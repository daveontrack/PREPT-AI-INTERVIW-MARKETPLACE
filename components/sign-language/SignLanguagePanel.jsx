"use client";

// ─── Sign-language recognition panel ─────────────────────────────────────────
// Candidate: consent → webcam preview → prediction preview → confirm/edit →
// confirmed entries flow to the shared transcript. Typed answers are a
// first-class alternative when recognition fails.
// Interviewer: read-only confirmed transcript (polled).
//
// Experimental sign-to-text assistance — recognized text is reviewed and
// confirmed by the candidate; it is not a certified interpretation.

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  CircleStop,
  Edit3,
  Hand,
  Loader2,
  Pause,
  PenLine,
  Play,
  ShieldCheck,
  Trash2,
  Type,
} from "lucide-react";
import useSignLanguageRecognition, {
  LOW_CONFIDENCE,
} from "@/hooks/useSignLanguageRecognition";

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

function TranscriptList({ entries }) {
  if (entries.length === 0) {
    return (
      <p className="text-[11px] text-stone-600 font-light leading-relaxed">
        No confirmed entries yet. Confirmed text appears here for both sides —
        raw predictions are never shared automatically.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {entries.map((e) => (
        <li
          key={e.id}
          className="rounded-lg border border-white/8 bg-[#141417] px-3 py-2 flex flex-col gap-1"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-stone-600">
              #{e.sequenceNumber} · {formatTime(e.confirmedAt)}
              {e.edited ? " · edited" : ""}
            </span>
            <Badge
              variant="outline"
              className={
                e.source === "typed"
                  ? "border-blue-500/20 bg-blue-500/10 text-blue-400 text-[9px]"
                  : "border-amber-400/20 bg-amber-400/5 text-amber-400 text-[9px]"
              }
            >
              {e.source === "typed" ? "Typed" : "Signed"}
            </Badge>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">{e.text}</p>
        </li>
      ))}
    </ul>
  );
}

export default function SignLanguagePanel({ booking, isInterviewer }) {
  const {
    videoRef,
    phase,
    preview,
    entries,
    error,
    sessionActive,
    start,
    pause,
    stop,
    confirm,
    confirmEdited,
    discard,
    addTyped,
    refreshEntries,
  } = useSignLanguageRecognition({ bookingId: booking.id });

  const [consented, setConsented] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [typedText, setTypedText] = useState("");

  // Live-ish transcript for the interviewer (candidate gets local updates
  // immediately; polling also covers a reconnect on the other side).
  useEffect(() => {
    const t = setInterval(refreshEntries, 5000);
    return () => clearInterval(t);
  }, [refreshEntries]);

  const running = phase === "running";
  const starting = phase === "starting";

  // ─── Interviewer: read-only transcript ────────────────────────────────────
  if (isInterviewer) {
    return (
      <div className="flex flex-col gap-4 h-full overflow-y-auto">
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 flex items-start gap-3">
          <ShieldCheck size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-stone-400 font-light leading-relaxed">
            The candidate enabled experimental sign-to-text assistance. You
            see entries they have <strong>confirmed or typed</strong> — never
            raw predictions or video.
          </p>
        </div>
        <TranscriptList entries={entries} />
      </div>
    );
  }

  // ─── Candidate ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Consent gate */}
      {!consented && !running && !starting && (
        <div className="rounded-xl border border-white/10 bg-[#141417] px-4 py-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Hand size={15} className="text-amber-400" />
            <p className="text-xs font-medium text-stone-300">
              Sign-language assistance (EthSL)
            </p>
          </div>
          <ul className="text-[11px] text-stone-500 font-light leading-relaxed flex flex-col gap-1.5">
            <li>• Your camera is processed locally — only landmark data is sent for recognition, never video.</li>
            <li>• Nothing is shared until you confirm or edit each prediction.</li>
            <li>• Experimental sign-to-text assistance, not a certified interpreter — you can pause or stop any time.</li>
            <li>• Typing remains available whenever recognition struggles.</li>
          </ul>
          <label className="flex items-start gap-2 text-[11px] text-stone-400 cursor-pointer">
            <input
              type="checkbox"
              checked={consented}
              onChange={(e) => setConsented(e.target.checked)}
              className="mt-0.5 accent-amber-400"
            />
            I consent to sign-language recognition for this session.
          </label>
          <Button variant="gold" size="sm" onClick={start} disabled={!consented}>
            <Play size={13} />
            Enable recognition
          </Button>
        </div>
      )}

      {/* Camera + status */}
      {(running || starting) && (
        <div className="rounded-xl border border-white/10 bg-[#141417] overflow-hidden">
          <video
            ref={videoRef}
            muted
            playsInline
            className="w-full h-32 object-cover scale-x-[-1] bg-black"
          />
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-stone-400">
              {starting ? (
                <>
                  <Loader2 size={11} className="animate-spin text-amber-400" />
                  Starting…
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Recognizing (EthSL)
                </>
              )}
            </span>
            {running && (
              <button
                type="button"
                onClick={pause}
                className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-300"
              >
                <Pause size={11} />
                Pause
              </button>
            )}
          </div>
        </div>
      )}

      {phase === "idle" && consented && (
        <Button variant="outline" size="sm" onClick={start}>
          <Play size={13} />
          Resume recognition
        </Button>
      )}

      {error && (
        <p className="text-[11px] text-rose-400 leading-relaxed">{error}</p>
      )}

      {/* Prediction preview — confirm / edit / discard */}
      {preview && (
        <div
          className={`rounded-xl border px-4 py-3 flex flex-col gap-2 ${
            preview.low
              ? "border-rose-500/30 bg-rose-500/5"
              : "border-amber-400/30 bg-amber-400/5"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-stone-500">
              Recognized
            </span>
            <span className="text-[10px] text-stone-500">
              {preview.confidence !== null
                ? `${Math.round(preview.confidence * 100)}% confidence${preview.low ? " — please review" : ""}`
                : preview.modelVersion ?? ""}
            </span>
          </div>

          {editing ? (
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              maxLength={1000}
              className="bg-[#0f0f11] border-white/10 text-xs"
              autoFocus
            />
          ) : (
            <p className="text-sm text-stone-200 leading-relaxed">
              {preview.text}
            </p>
          )}

          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button
                  variant="gold"
                  size="sm"
                  onClick={async () => {
                    await confirmEdited(editText);
                    setEditing(false);
                  }}
                >
                  <Check size={12} />
                  Save & share
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button variant="gold" size="sm" onClick={confirm}>
                  <Check size={12} />
                  Confirm
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditText(preview.text);
                    setEditing(true);
                  }}
                >
                  <Edit3 size={12} />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={discard}>
                  <Trash2 size={12} />
                  Discard
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Typed alternative — recognition must never block communication */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold text-stone-600 tracking-widest uppercase">
          Type instead (always available)
        </p>
        <div className="flex flex-col gap-2">
          <Textarea
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder="Type an answer to add it to the shared transcript…"
            rows={2}
            maxLength={1000}
            className="bg-[#0f0f11] border-white/10 text-xs"
          />
          <Button
            variant="outline"
            size="sm"
            disabled={!typedText.trim()}
            onClick={async () => {
              const ok = await addTyped(typedText);
              if (ok) setTypedText("");
            }}
          >
            <Type size={12} />
            Add to transcript
          </Button>
        </div>
      </div>

      {/* Shared transcript */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-stone-600 tracking-widest uppercase">
            Shared transcript ({entries.length})
          </p>
          {sessionActive && (
            <button
              type="button"
              onClick={stop}
              className="inline-flex items-center gap-1 text-[11px] text-rose-400/80 hover:text-rose-400"
            >
              <CircleStop size={11} />
              Stop & end session
            </button>
          )}
        </div>
        <TranscriptList entries={entries} />
      </div>

      <p className="text-[10px] text-stone-700 font-light leading-relaxed">
        Confidence threshold: {Math.round(LOW_CONFIDENCE * 100)}% (calibrated on
        held-out signers). Recognized sign text is candidate-reviewed assistance,
        not certified translation.
      </p>
    </div>
  );
}
