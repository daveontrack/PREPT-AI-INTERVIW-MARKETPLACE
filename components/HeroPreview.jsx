"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  MessageSquare,
  Sparkles,
  Star,
  Play,
  ArrowUpRight,
  Zap,
  Users,
  Clock,
  TrendingUp,
} from "lucide-react";

/* ─── Typing text hook ─── */
function useTyping(texts, speed = 60, pause = 2000) {
  const [display, setDisplay] = useState("");
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[idx];
    const timer = setTimeout(
      () => {
        if (!deleting) {
          setDisplay(current.slice(0, charIdx + 1));
          setCharIdx((c) => c + 1);
          if (charIdx + 1 === current.length) {
            setTimeout(() => setDeleting(true), pause);
          }
        } else {
          setDisplay(current.slice(0, charIdx - 1));
          setCharIdx((c) => c - 1);
          if (charIdx - 1 === 0) {
            setDeleting(false);
            setIdx((i) => (i + 1) % texts.length);
          }
        }
      },
      deleting ? speed / 2 : speed
    );
    return () => clearTimeout(timer);
  }, [charIdx, deleting, idx, texts, speed, pause]);

  return display;
}

/* ─── Animated counter ─── */
function AnimatedNumber({ value, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const step = Math.ceil(value / 40);
          const t = setInterval(() => {
            start += step;
            if (start >= value) {
              setCount(value);
              clearInterval(t);
            } else {
              setCount(start);
            }
          }, 30);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─── Main HeroPreview ─── */
export default function HeroPreview() {
  const typingText = useTyping(
    [
      "Explain React fiber architecture",
      "Design a URL shortener at scale",
      "What is event bubbling in the DOM",
      "Implement LRU cache in TypeScript",
    ],
    55,
    2500
  );

  return (
    <div className="relative w-full aspect-square sm:aspect-[4/3] lg:aspect-square max-w-xl mx-auto lg:mx-0">
      {/* ─── Ambient orbs ─── */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-amber-400/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-56 h-56 bg-orange-500/8 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* ─── Layer 1 (Back) — Stats panel, top-right ─── */}
      <div className="absolute top-0 right-0 w-40 sm:w-48 z-10">
        <div className="rounded-2xl bg-muted/40 backdrop-blur-2xl border border-border/80 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
              <TrendingUp size={12} className="text-emerald-400" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">
              Sessions
            </span>
          </div>
          <p className="font-serif text-2xl sm:text-3xl bg-linear-to-br from-stone-700 to-stone-500 dark:from-stone-100 dark:to-stone-400 bg-clip-text text-transparent leading-none mb-1">
            <AnimatedNumber value={2400} suffix="+" />
          </p>
          <p className="text-[9px] text-muted-foreground/70">
            interviews completed
          </p>
        </div>
      </div>

      {/* ─── Layer 1 (Back) — Credit card, bottom-left ─── */}
      <div className="absolute bottom-16 left-0 w-36 sm:w-44 z-10">
        <div className="rounded-2xl bg-muted/40 backdrop-blur-2xl border border-border/80 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
              <Zap size={12} className="text-amber-400" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">
              Credits
            </span>
          </div>
          <p className="font-serif text-2xl sm:text-3xl bg-linear-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent leading-none mb-1">
            28
          </p>
          <div className="flex items-center gap-1">
            <div className="flex-1 h-1 rounded-full bg-muted/50 overflow-hidden">
              <div className="h-full w-[70%] rounded-full bg-amber-400/50" />
            </div>
            <span className="text-[8px] text-muted-foreground/70">70%</span>
          </div>
        </div>
      </div>

      {/* ─── Layer 2 (Mid) — AI typing panel, top-left ─── */}
      <div className="absolute top-12 left-4 sm:left-8 w-56 sm:w-64 z-20">
        <div className="rounded-2xl bg-muted/50 backdrop-blur-2xl border border-border/80 p-4 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-amber-400/15 border border-amber-400/25 flex items-center justify-center">
              <Sparkles size={10} className="text-amber-400" />
            </div>
            <span className="text-[10px] text-foreground font-medium">
              AI Co-pilot
            </span>
            <span className="ml-auto flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[8px] text-muted-foreground/70">live</span>
            </span>
          </div>
          <div className="rounded-xl bg-background/30 border border-border/50 p-3 mb-2">
            <p className="text-[11px] text-foreground font-mono leading-relaxed min-h-[2.5em]">
              {typingText}
              <span className="inline-block w-[2px] h-3 bg-amber-400 ml-0.5 animate-pulse" />
            </p>
          </div>
          <div className="flex gap-1.5">
            {["Frontend", "L5", "System Design"].map((tag) => (
              <span
                key={tag}
                className="text-[8px] px-2 py-0.5 rounded-full bg-muted/50 border border-border text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Layer 3 (Front) — Main video call card ─── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-[44%] -translate-y-[44%] w-64 sm:w-80 z-30">
        <div className="rounded-2xl bg-muted/60 backdrop-blur-2xl border border-border shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7),0_0_40px_-5px_rgba(251,191,36,0.1)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground font-mono">
                12:34
              </span>
            </div>
            <span className="text-[9px] text-muted-foreground/70">
              Frontend Mock Interview
            </span>
          </div>

          {/* Video grid */}
          <div className="grid grid-cols-2 gap-2 p-3">
            <div className="rounded-xl bg-gradient-to-br from-secondary to-secondary/80 border border-border/60 aspect-video flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-transparent" />
              <div className="relative w-10 h-10 rounded-full bg-amber-400/15 border border-amber-400/25 flex items-center justify-center text-amber-400 font-serif text-sm font-bold">
                JD
              </div>
              <p className="relative text-[10px] text-foreground mt-1.5 font-medium">
                John Doe
              </p>
              <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-background/40 backdrop-blur-sm">
                <Mic size={7} className="text-emerald-400" />
                <div className="flex gap-[1px] items-end h-2">
                  {[1, 2, 3, 2].map((h, i) => (
                    <div
                      key={i}
                      className="w-[1.5px] bg-emerald-400 rounded-full animate-pulse"
                      style={{
                        height: `${h * 2.5}px`,
                        animationDelay: `${i * 150}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-secondary to-secondary/80 border border-border/60 aspect-video flex flex-col items-center justify-center relative overflow-hidden">
              <div className="relative w-10 h-10 rounded-full bg-blue-400/15 border border-blue-400/25 flex items-center justify-center text-blue-400 font-serif text-sm font-bold">
                YO
              </div>
              <p className="relative text-[10px] text-foreground mt-1.5 font-medium">
                You
              </p>
              <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-background/40 backdrop-blur-sm">
                <MicOff size={7} className="text-muted-foreground" />
                <span className="text-[7px] text-muted-foreground">Muted</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2 px-3 py-2 border-t border-border/60">
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-muted-foreground">
              <Mic size={10} />
            </div>
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-muted-foreground">
              <MonitorUp size={10} />
            </div>
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-muted-foreground">
              <MessageSquare size={10} />
            </div>
            <div className="w-7 h-7 rounded-full bg-red-500/80 flex items-center justify-center text-white">
              <PhoneOff size={10} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Layer 4 (Front) — Feedback score card, bottom-right ─── */}
      <div className="absolute bottom-0 right-2 sm:right-6 w-44 sm:w-52 z-40">
        <div className="rounded-2xl bg-muted/60 backdrop-blur-2xl border border-border p-4 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center">
              <Sparkles size={10} className="text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-foreground font-medium">
                Session Score
              </p>
              <p className="text-[8px] text-muted-foreground/70">AI-generated</p>
            </div>
            <span className="ml-auto font-serif text-lg bg-linear-to-br from-amber-500 to-amber-700 dark:from-amber-300 dark:to-amber-500 bg-clip-text text-transparent font-bold">
              86
            </span>
          </div>
          <div className="space-y-2">
            {[
              { label: "Technical", pct: 85, color: "bg-amber-400" },
              { label: "Communication", pct: 92, color: "bg-emerald-400" },
              { label: "Problem Solving", pct: 78, color: "bg-blue-400" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-[8px] text-muted-foreground w-14 shrink-0">
                  {s.label}
                </span>
                <div className="flex-1 h-1 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.color} opacity-70`}
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
                <span className="text-[8px] text-muted-foreground/70 font-mono">
                  {s.pct}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Layer 5 (Top) — Floating role badge ─── */}
      <div className="absolute top-1/2 right-0 -translate-y-8 z-50">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 backdrop-blur-xl border border-border shadow-lg">
          <div className="w-5 h-5 rounded-full bg-amber-400/15 border border-amber-400/20 flex items-center justify-center">
            <Users size={9} className="text-amber-400" />
          </div>
          <span className="text-[9px] text-foreground font-medium">
            500+ interviewers
          </span>
        </div>
      </div>
    </div>
  );
}
