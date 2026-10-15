"use client";

// ─── Sign-language recognition hook ──────────────────────────────────────────
// Experimental sign-to-text assistance. Pipeline (privacy-conscious by design):
//
//   webcam frames → MediaPipe hand + pose landmarks (IN THE BROWSER)
//     → short landmark sequences over WebSocket to the Python service
//     → prediction preview → CANDIDATE CONFIRMS/EDITS
//     → only confirmed text is persisted (actions/signLanguage.js)
//
// Raw video, landmarks and motion sequences never leave the machine except as
// transient inference payloads, and are never stored.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import {
  startSignSession,
  saveSignEntry,
  endSignSession,
  getSignTranscript,
} from "@/actions/signLanguage";

const TASKS_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm";
const HAND_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task";
const POSE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

const DETECT_INTERVAL_MS = 110; // ~9 fps landmark extraction
const FRAMES_PER_SEQUENCE = 24; // ≈ 2.5 s of signing per prediction
const MIN_SEND_INTERVAL_MS = 1400;
// Placeholder threshold — calibrate on held-out signers before trusting it.
export const LOW_CONFIDENCE = 0.55;

// Pose indices used for orientation/scale context (nose, eyes, ears,
// shoulders, elbows, wrists, hips).
const POSE_INDICES = [0, 2, 5, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24];

const r4 = (n) => Math.round(n * 10000) / 10000;

export default function useSignLanguageRecognition({ bookingId }) {
  const videoRef = useRef(null);

  const [phase, setPhase] = useState("idle"); // idle | starting | running | error
  const [preview, setPreview] = useState(null); // { text, confidence, modelVersion, low }
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);

  const streamRef = useRef(null);
  const wsRef = useRef(null);
  const handRef = useRef(null);
  const poseRef = useRef(null);
  const loopRef = useRef(null);
  const bufferRef = useRef([]);
  const lastSendRef = useRef(0);
  const seqRef = useRef(0);
  const sessionRef = useRef(null); // { sessionId }
  const phaseRef = useRef("idle");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // ── Load existing confirmed entries (both roles can view; only candidate
  //    can add) ──
  const refreshEntries = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await getSignTranscript({ bookingId });
      if (Array.isArray(res?.entries)) setEntries(res.entries);
    } catch {
      /* non-fatal */
    }
  }, [bookingId]);

  useEffect(() => {
    // Deferred so the effect body itself never triggers a state update chain.
    const t = setTimeout(refreshEntries, 0);
    return () => clearTimeout(t);
  }, [refreshEntries]);

  // ── Local teardown (camera, WS, detection loop) ──
  const teardownLocal = useCallback(() => {
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        /* noop */
      }
      wsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    bufferRef.current = [];
    setSessionActive(false);
  }, []);

  useEffect(() => teardownLocal, [teardownLocal]);

  // ── Frame → landmark record (rounded, minimal) ──
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;

    const nowMs = performance.now();
    const handResult = handRef.current?.detectForVideo(video, nowMs);
    const poseResult = poseRef.current?.detectForVideo(video, nowMs + 1);

    const hands = (handResult?.landmarks ?? []).slice(0, 2).map((hand) =>
      hand.map((p) => [r4(p.x), r4(p.y), r4(p.z)])
    );
    const poseSrc = poseResult?.landmarks?.[0];
    const pose = poseSrc
      ? POSE_INDICES.map((i) => [r4(poseSrc[i].x), r4(poseSrc[i].y), r4(poseSrc[i].z)])
      : null;

    if (hands.length === 0 && !pose) return null; // nothing visible — skip
    return { h: hands, p: pose };
  }, []);

  // ── WebSocket prediction handler ──
  const handleServerMessage = useCallback((msg) => {
    if (msg?.type === "prediction" && typeof msg.prediction === "string") {
      const text = msg.prediction.trim();
      if (!text) return;
      const confidence =
        typeof msg.confidence === "number" ? msg.confidence : null;
      setPreview({
        text,
        confidence,
        modelVersion: msg.modelVersion ?? null,
        low: confidence !== null && confidence < LOW_CONFIDENCE,
      });
    } else if (msg?.type === "error") {
      setError(msg.message ?? "Recognition service error");
    }
  }, []);

  // ── Start (also resumes after pause; the server reuses the session) ──
  const start = useCallback(async () => {
    if (!bookingId) return;
    setPhase("starting");
    setError(null);

    try {
      // 1. Server-authorized session + scoped WS token (consent recorded).
      const session = await startSignSession({ bookingId, consented: true });
      sessionRef.current = session;

      // 2. Camera — processed locally, never uploaded.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // 3. MediaPipe landmark models (browser-side).
      const vision = await FilesetResolver.forVisionTasks(TASKS_CDN);
      const [hand, pose] = await Promise.all([
        HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: HAND_MODEL, delegate: "GPU" },
          runningMode: "VIDEO",
          numHands: 2,
        }),
        PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: POSE_MODEL, delegate: "GPU" },
          runningMode: "VIDEO",
          numPoses: 1,
        }),
      ]);
      handRef.current = hand;
      poseRef.current = pose;

      // 4. WebSocket to the Python recognition service.
      const ws = new WebSocket(
        `${session.wsUrl.replace(/\/$/, "")}/ws/recognize?token=${encodeURIComponent(session.token)}`
      );
      wsRef.current = ws;
      ws.onmessage = (e) => {
        try {
          handleServerMessage(JSON.parse(e.data));
        } catch {
          /* ignore malformed frames */
        }
      };
      ws.onerror = () =>
        setError("Lost connection to the recognition service");
      ws.onclose = () => {
        if (phaseRef.current === "running") {
          setError(
            "Connection to the recognition service was closed — press Resume to reconnect."
          );
        }
      };
      await new Promise((resolve, reject) => {
        ws.onopen = resolve;
        ws.onerror = () => reject(new Error("Could not reach the recognition service"));
      });

      // 5. Detection loop — buffer landmarks, ship sequences.
      bufferRef.current = [];
      lastSendRef.current = 0;
      loopRef.current = setInterval(() => {
        const frame = captureFrame();
        if (!frame) return;
        const buffer = bufferRef.current;
        buffer.push(frame);
        if (buffer.length > FRAMES_PER_SEQUENCE * 2) buffer.shift();

        const now = Date.now();
        const wsNow = wsRef.current;
        if (
          buffer.length >= FRAMES_PER_SEQUENCE &&
          now - lastSendRef.current >= MIN_SEND_INTERVAL_MS &&
          wsNow?.readyState === WebSocket.OPEN
        ) {
          seqRef.current += 1;
          wsNow.send(
            JSON.stringify({
              type: "sequence",
              sessionId: session.sessionId,
              seq: seqRef.current,
              language: session.language,
              frames: buffer.splice(0, FRAMES_PER_SEQUENCE + 6),
            })
          );
          lastSendRef.current = now;
        }
      }, DETECT_INTERVAL_MS);

      setSessionActive(true);
      setPhase("running");
      await refreshEntries();
    } catch (err) {
      console.error("[sign-language] start failed:", err);
      teardownLocal();
      setPhase("error");
      setError(err?.message ?? "Could not start sign recognition");
    }
  }, [bookingId, captureFrame, handleServerMessage, refreshEntries, teardownLocal]);

  const pause = useCallback(() => {
    teardownLocal();
    setPreview(null);
    setPhase("idle"); // resume reuses the same server-side session
  }, [teardownLocal]);

  const stop = useCallback(async () => {
    teardownLocal();
    setPreview(null);
    const sessionId = sessionRef.current?.sessionId;
    sessionRef.current = null;
    setPhase("idle");
    if (sessionId) {
      try {
        await endSignSession({ sessionId });
      } catch {
        /* best-effort */
      }
    }
  }, [teardownLocal]);

  // ── Confirmation flow: ONLY confirmed text is stored ──
  const persist = useCallback(
    async ({ text, confidence, edited, source }) => {
      const sessionId = sessionRef.current?.sessionId;
      if (!sessionId || !text?.trim()) return false;
      try {
        const res = await saveSignEntry({
          sessionId,
          text,
          confidence,
          edited,
          source,
        });
        if (res?.entry) setEntries((prev) => [...prev, res.entry]);
        return true;
      } catch (err) {
        setError(err?.message ?? "Could not save the entry");
        return false;
      }
    },
    []
  );

  const confirm = useCallback(async () => {
    if (!preview) return false;
    const ok = await persist({
      text: preview.text,
      confidence: preview.confidence,
      edited: false,
      source: "sign_recognition",
    });
    if (ok) setPreview(null);
    return ok;
  }, [persist, preview]);

  const confirmEdited = useCallback(
    async (text) => {
      if (!preview || !text?.trim() || text.trim() === preview.text)
        return confirm();
      const ok = await persist({
        text,
        confidence: preview.confidence,
        edited: true,
        source: "sign_recognition",
      });
      if (ok) setPreview(null);
      return ok;
    },
    [confirm, persist, preview]
  );

  const discard = useCallback(() => setPreview(null), []);

  // Communication alternative — recognition failures must never block the
  // candidate: typing an answer is first-class (source: "typed").
  const addTyped = useCallback(
    async (text) => {
      if (!sessionRef.current?.sessionId) return false;
      return persist({ text, confidence: null, edited: false, source: "typed" });
    },
    [persist]
  );

  return {
    videoRef,
    phase,
    preview,
    entries,
    error,
    sessionActive,
    lowConfidenceThreshold: LOW_CONFIDENCE,
    start,
    pause,
    stop,
    confirm,
    confirmEdited,
    discard,
    addTyped,
    refreshEntries,
  };
}
