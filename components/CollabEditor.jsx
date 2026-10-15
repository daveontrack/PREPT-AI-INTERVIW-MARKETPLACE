"use client";

// ─── Collaborative live code editor ──────────────────────────────────────────
// Monaco + Yjs. Every participant edits the same Y.Text; changes sync through
// a y-websocket provider (rooms are per booking, see scripts/collab-server.js)
// and the last state is snapshotted to the Booking row via onSave so both
// parties can review the code after the call.
//
// The Monaco <-> Yjs binding below is intentionally diff-based (instead of
// coordinate math on Monaco change events): Monaco batches multiple edits per
// event and their ranges refer to the pre-edit document, which is easy to get
// wrong. A minimal prefix/suffix diff against a mirror string is robust and
// cheap for interview-sized documents.

import { useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { cn } from "@/lib/utils";
import { Check, Code2, Loader2, Users } from "lucide-react";

const CONTENT_KEY = "code";

// Set via .env — point it at the y-websocket server run by `npm run collab`.
// When unset the editor still works locally (per browser), it just can't sync
// with the other participant.
const WS_URL = process.env.NEXT_PUBLIC_COLLAB_WS_URL || "";

export const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
  { value: "sql", label: "SQL" },
  { value: "shell", label: "Shell" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
];

export const languageLabel = (value) =>
  LANGUAGES.find((l) => l.value === value)?.label ?? "JavaScript";

// Deterministic per-user cursor color so both sides see each other consistently.
const PALETTE = [
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f43f5e",
  "#06b6d4",
];

const colorFor = (seed = "") => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
};

let themeDefined = false;
const ensureTheme = (monaco) => {
  if (themeDefined) return;
  themeDefined = true;
  monaco.editor.defineTheme("il-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#0f0f11",
      "editor.lineHighlightBackground": "#17171b",
      "editorLineNumber.foreground": "#52525b",
      "editorCursor.foreground": "#f59e0b",
      "editor.selectionBackground": "#f59e0b40",
    },
  });
};

export default function CollabEditor({
  roomName = null,
  initialCode = "",
  language: initialLanguage = "javascript",
  user,
  readOnly = false,
  onSave,
  className,
}) {
  const [language, setLanguage] = useState(initialLanguage);
  const [editorKey, setEditorKey] = useState(0);
  const [status, setStatus] = useState(
    roomName && !readOnly && WS_URL ? "connecting" : "local"
  );
  const [peers, setPeers] = useState([]);
  const [saveState, setSaveState] = useState(null); // null | "saving" | "saved" | "error"

  const editorRef = useRef(null);
  const modelRef = useRef(null);
  const docRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);
  const mirrorRef = useRef("");
  const dirtyRef = useRef(false);
  const saveTimerRef = useRef(null);
  const languageRef = useRef(language);
  const onSaveRef = useRef(onSave);
  const initialCodeRef = useRef(initialCode);
  const userRef = useRef(user);

  useEffect(() => {
    languageRef.current = language;
    onSaveRef.current = onSave;
    initialCodeRef.current = initialCode;
    userRef.current = user;
  });

  // ── Autosave ───────────────────────────────────────────────────────────────

  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (!dirtyRef.current) return;
    const doc = docRef.current;
    const save = onSaveRef.current;
    if (!doc || !save) return;
    dirtyRef.current = false;
    const code = doc.getText(CONTENT_KEY).toString();
    setSaveState("saving");
    Promise.resolve(save({ code, language: languageRef.current }))
      .then((res) => {
        if (res && res.success === false) throw new Error(res.error);
        setSaveState("saved");
      })
      .catch(() => {
        dirtyRef.current = true;
        setSaveState("error");
      });
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(flushSave, 2000);
  }, [flushSave]);

  // Periodic flush during long sessions + best-effort final save on unmount
  // (covers leaving the call, which is exactly when we want the latest code).
  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current) flushSave();
    }, 20_000);
    return () => {
      clearInterval(interval);
      flushSave();
      bindingRef.current?.dispose();
      providerRef.current?.destroy();
      providerRef.current = null;
      docRef.current?.destroy();
      docRef.current = null;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [flushSave]);

  // ── Yjs <-> Monaco binding ─────────────────────────────────────────────────

  const bind = useCallback(
    (editor, monaco) => {
      // Dispose the previous binding first — switching languages remounts the
      // editor, and stale Yjs observers must never touch a new model twice.
      bindingRef.current?.dispose();
      bindingRef.current = null;

      ensureTheme(monaco);

      const doc = docRef.current ?? new Y.Doc();
      docRef.current = doc;
      const ytext = doc.getText(CONTENT_KEY);

      // ── Provider (collaborative rooms only) ──
      let provider = providerRef.current;
      if (!provider && roomName && !readOnly && WS_URL) {
        provider = new WebsocketProvider(WS_URL, roomName, doc, {
          connect: true,
        });
        providerRef.current = provider;

        provider.on("status", ({ status: s }) => {
          setStatus(
            s === "connected"
              ? "live"
              : s === "connecting"
                ? "connecting"
                : "reconnecting"
          );
        });

        provider.awareness.setLocalStateField("user", {
          id: userRef.current?.id,
          name: userRef.current?.name ?? "Guest",
          color: colorFor(userRef.current?.name ?? ""),
        });

        const onAwareness = () => {
          const list = [];
          provider.awareness.getStates().forEach((state, clientId) => {
            if (clientId === provider.awareness.clientID) return;
            const u = state?.user;
            if (u?.name) list.push(u);
          });
          setPeers(list);
        };
        provider.awareness.on("change", onAwareness);
      }

      const model = editor.getModel();
      modelRef.current = model;
      editorRef.current = editor;

      let applyingRemote = false;
      let selfEdit = false;

      // Yjs → Monaco
      const observer = (event) => {
        if (selfEdit) return;
        const m = modelRef.current;
        if (!m) return;
        applyingRemote = true;
        try {
          let idx = 0;
          for (const d of event.delta) {
            if (d.retain) {
              idx += d.retain;
            } else if (typeof d.insert === "string") {
              const pos = m.getPositionAt(idx);
              m.applyEdits([
                {
                  range: {
                    startLineNumber: pos.lineNumber,
                    startColumn: pos.column,
                    endLineNumber: pos.lineNumber,
                    endColumn: pos.column,
                  },
                  text: d.insert,
                },
              ]);
              idx += d.insert.length;
            } else if (d.delete) {
              const start = m.getPositionAt(idx);
              const end = m.getPositionAt(idx + d.delete);
              m.applyEdits([
                {
                  range: {
                    startLineNumber: start.lineNumber,
                    startColumn: start.column,
                    endLineNumber: end.lineNumber,
                    endColumn: end.column,
                  },
                  text: "",
                },
              ]);
            }
          }
          mirrorRef.current = m.getValue();
        } finally {
          applyingRemote = false;
        }
      };
      ytext.observe(observer);

      // Monaco → Yjs (minimal diff against the last synced mirror)
      const changeDisposable = model.onDidChangeModelContent(() => {
        if (applyingRemote) return;
        const m = modelRef.current;
        if (!m) return;
        const next = m.getValue();
        const prev = mirrorRef.current;
        if (next === prev) return;

        let start = 0;
        const minLen = Math.min(prev.length, next.length);
        while (
          start < minLen &&
          prev.charCodeAt(start) === next.charCodeAt(start)
        )
          start++;
        let endPrev = prev.length;
        let endNext = next.length;
        while (
          endPrev > start &&
          endNext > start &&
          prev.charCodeAt(endPrev - 1) === next.charCodeAt(endNext - 1)
        ) {
          endPrev--;
          endNext--;
        }

        selfEdit = true;
        try {
          doc.transact(() => {
            if (endPrev > start) ytext.delete(start, endPrev - start);
            if (endNext > start)
              ytext.insert(start, next.slice(start, endNext));
          });
        } finally {
          selfEdit = false;
        }
        mirrorRef.current = next;
        dirtyRef.current = true;
        setSaveState(null);
        if (onSaveRef.current) scheduleSave();
      });

      // ── Initial content ──
      // Seed only once the provider has synced (or after a grace period when
      // the collab server is unreachable), so we never merge the snapshot into
      // an already-synced room.
      let seeded = false;
      const seed = () => {
        if (seeded) return;
        seeded = true;
        const m = modelRef.current;
        if (!m) return;
        if (ytext.length > 0) {
          applyingRemote = true;
          try {
            m.setValue(ytext.toString());
          } finally {
            applyingRemote = false;
          }
          mirrorRef.current = m.getValue();
        } else if (initialCodeRef.current) {
          selfEdit = true;
          try {
            ytext.insert(0, initialCodeRef.current);
          } finally {
            selfEdit = false;
          }
          applyingRemote = true;
          try {
            m.setValue(initialCodeRef.current);
          } finally {
            applyingRemote = false;
          }
          mirrorRef.current = m.getValue();
        } else {
          mirrorRef.current = m.getValue();
        }
      };

      let seedTimer = null;
      let onSync = null;
      if (provider) {
        onSync = (isSynced) => {
          if (isSynced) seed();
        };
        provider.on("sync", onSync);
        if (provider.synced) seed();
        else seedTimer = setTimeout(seed, 4000);
      } else {
        seed();
      }

      bindingRef.current = {
        dispose: () => {
          if (seedTimer) clearTimeout(seedTimer);
          if (provider && onSync) provider.off("sync", onSync);
          changeDisposable?.dispose();
          ytext.unobserve(observer);
          if (modelRef.current === model) modelRef.current = null;
        },
      };
    },
    [roomName, readOnly, scheduleSave]
  );

  const handleMount = useCallback(
    (editor, monaco) => bind(editor, monaco),
    [bind]
  );

  const changeLanguage = (value) => {
    setLanguage(value);
    setEditorKey((k) => k + 1); // remount so Monaco re-tokenizes instantly
    if (!readOnly && onSaveRef.current) {
      dirtyRef.current = true; // the language is part of the snapshot too
      setSaveState(null);
      scheduleSave();
    }
  };

  const collaborative = Boolean(roomName) && !readOnly;

  const statusChip = (() => {
    if (readOnly)
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-stone-400">
          <span className="w-2 h-2 rounded-full bg-stone-500" />
          Read-only
        </span>
      );
    if (status === "live")
      return (
        <span
          className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400"
          title="Both of you are editing the same document in real time"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      );
    if (status === "connecting")
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-400">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Connecting…
        </span>
      );
    if (status === "reconnecting")
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-rose-400">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
          Reconnecting…
        </span>
      );
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[11px] text-stone-500"
        title="Live sync is off — set NEXT_PUBLIC_COLLAB_WS_URL and run `npm run collab`"
      >
        <span className="w-2 h-2 rounded-full bg-stone-600" />
        Local only
      </span>
    );
  })();

  return (
    <div className={cn("flex flex-col h-full min-h-0 bg-[#0f0f11]", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border bg-[#141417] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-400">
            <Code2 size={13} className="text-amber-400" />
            Shared editor
          </span>
          {statusChip}
          {peers.length > 0 && (
            <div className="flex items-center gap-2 overflow-hidden">
              {peers.slice(0, 4).map((p, i) => (
                <span
                  key={`${p.id ?? i}`}
                  className="inline-flex items-center gap-1.5 text-[11px] text-stone-400 max-w-28"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: p.color ?? "#f59e0b" }}
                  />
                  <span className="truncate">{p.name}</span>
                </span>
              ))}
              {peers.length > 4 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-stone-500">
                  <Users size={11} />+{peers.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {collaborative && (
            <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 w-20 justify-end">
              {saveState === "saving" && (
                <>
                  <Loader2 size={11} className="animate-spin" /> Saving…
                </>
              )}
              {saveState === "saved" && (
                <>
                  <Check size={11} className="text-emerald-400" /> Saved
                </>
              )}
              {saveState === "error" && (
                <span className="text-rose-400">Save failed</span>
              )}
            </span>
          )}
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            disabled={readOnly}
            className="bg-[#1a1a1e] border border-white/10 rounded-md text-xs text-stone-300 px-2 py-1 outline-none focus:border-amber-400/40 disabled:opacity-60"
            aria-label="Programming language"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          key={editorKey}
          height="100%"
          language={language}
          theme="il-dark"
          onMount={handleMount}
          loading={
            <div className="flex items-center justify-center h-full">
              <Loader2 size={20} className="text-amber-400 animate-spin" />
            </div>
          }
          options={{
            readOnly,
            domReadOnly: readOnly,
            fontSize: 13,
            fontFamily:
              "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "on",
            tabSize: 2,
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: "all",
            smoothScrolling: true,
          }}
        />
      </div>
    </div>
  );
}
