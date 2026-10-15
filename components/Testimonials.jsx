"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionLabel, SectionHeading } from "@/components/reusables";
import { TESTIMONIALS } from "@/lib/data";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const COLOR_MAP = {
  amber: {
    ring: "ring-amber-400/20",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    text: "text-amber-400",
    glow: "bg-amber-400/5",
  },
  emerald: {
    ring: "ring-emerald-400/20",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    text: "text-emerald-400",
    glow: "bg-emerald-400/5",
  },
  blue: {
    ring: "ring-blue-400/20",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    text: "text-blue-400",
    glow: "bg-blue-400/5",
  },
  violet: {
    ring: "ring-violet-400/20",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
    text: "text-violet-400",
    glow: "bg-violet-400/5",
  },
};

const CYCLE_MS = 6000;

export default function Testimonials() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [direction, setDirection] = useState("next");

  const goTo = useCallback(
    (idx) => {
      setDirection(idx > activeIdx ? "next" : "prev");
      setActiveIdx(idx);
    },
    [activeIdx]
  );

  const next = useCallback(() => {
    setDirection("next");
    setActiveIdx((p) => (p + 1) % TESTIMONIALS.length);
  }, []);

  const prev = useCallback(() => {
    setDirection("prev");
    setActiveIdx(
      (p) => (p - 1 + TESTIMONIALS.length) % TESTIMONIALS.length
    );
  }, []);

  useEffect(() => {
    const t = setInterval(next, CYCLE_MS);
    return () => clearInterval(t);
  }, [next]);

  const t = TESTIMONIALS[activeIdx];
  const c = COLOR_MAP[t.color] || COLOR_MAP.amber;

  return (
    <section className="relative z-10 py-28 max-w-5xl mx-auto px-6">
      <div className="text-center mb-16">
        <SectionLabel>Testimonials</SectionLabel>
        <SectionHeading
          gray="Trusted by engineers"
          gold="at top companies"
        />
      </div>

      {/* Main testimonial card */}
      <div className="relative group">
        {/* Glow */}
        <div
          className={`absolute -inset-8 ${c.glow} rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`}
        />

        <div className="relative rounded-2xl border border-border/80 bg-muted/30 backdrop-blur-2xl overflow-hidden shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)]">
          {/* Top accent line */}
          <div
            className={`h-px bg-gradient-to-r from-transparent ${c.text} to-transparent opacity-30`}
          />

          <div className="p-8 sm:p-12 lg:p-16">
            {/* Quote icon */}
            <div
              className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center mb-8`}
            >
              <Quote size={18} className={c.text} />
            </div>

            {/* Quote text */}
            <p className="font-serif text-xl sm:text-2xl lg:text-[1.7rem] leading-relaxed tracking-tight text-foreground mb-10 max-w-3xl">
              &ldquo;{t.text}&rdquo;
            </p>

            {/* Author */}
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full ${c.bg} border ${c.border} flex items-center justify-center font-serif text-sm font-bold ${c.text} ring-2 ${c.ring}`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>

              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className="text-amber-400"
                    fill="currentColor"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        {/* Dots */}
        <div className="flex items-center gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-400 cursor-pointer ${
                i === activeIdx
                  ? "w-8 bg-amber-400"
                  : "w-1.5 bg-muted hover:bg-accent"
              }`}
            />
          ))}
        </div>

        {/* Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="w-8 h-8 rounded-full bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={next}
            className="w-8 h-8 rounded-full bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all cursor-pointer"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Mini testimonial grid (3 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
        {TESTIMONIALS.filter((_, i) => i !== activeIdx)
          .slice(0, 3)
          .map((item) => {
            const tc = COLOR_MAP[item.color] || COLOR_MAP.amber;
            return (
              <div
                key={item.name}
                className="rounded-xl bg-muted/20 border border-border/60 p-5 hover:border-border transition-all duration-300 cursor-pointer"
                onClick={() => goTo(TESTIMONIALS.indexOf(item))}
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Star
                      key={i}
                      size={10}
                      className="text-amber-400"
                      fill="currentColor"
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                  &ldquo;{item.text}&rdquo;
                </p>
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-full ${tc.bg} border ${tc.border} flex items-center justify-center text-[9px] font-bold ${tc.text}`}
                  >
                    {item.initials}
                  </div>
                  <div>
                    <p className="text-[11px] text-foreground font-medium">
                      {item.name}
                    </p>
                    <p className="text-[9px] text-muted-foreground/70">{item.role}</p>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
