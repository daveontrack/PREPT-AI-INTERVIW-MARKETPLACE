"use client";

// ─── Solo AI mock interview UI ───────────────────────────────────────────────
// Start (category / resume questions) → answer questions one at a time →
// Gemini report (same score shape as live sessions) → history.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flag,
  History,
  Loader2,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { CATEGORIES, CATEGORY_LABEL, RATING_CONFIG } from "@/lib/data";
import { formatDate } from "@/lib/helpers";
import useFetch from "@/hooks/use-fetch";
import {
  startSoloInterview,
  submitSoloAnswer,
  undoSoloAnswer,
  finishSoloInterviewEarly,
  getMySoloInterviews,
} from "@/actions/soloInterview";

const VERDICT_STYLES = {
  STRONG: "border-green-500/20 bg-green-500/10 text-green-400",
  GOOD: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  FAIR: "border-amber-400/20 bg-amber-400/10 text-amber-400",
  WEAK: "border-rose-500/20 bg-rose-500/10 text-rose-400",
};

const CATEGORY_OPTIONS = CATEGORIES.filter((c) => c.value);

const avgOf = (...scores) => {
  const valid = scores.filter((s) => Number.isInteger(s));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
};

export default function PracticeView() {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("resume");

  const [mode, setMode] = useState("start"); // start | interview | results | history
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState(null);
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState(null);
  const [roleTitle, setRoleTitle] = useState("");

  const startFetch = useFetch(startSoloInterview);
  const answerFetch = useFetch(submitSoloAnswer);
  const finishFetch = useFetch(finishSoloInterviewEarly);
  const historyFetch = useFetch(getMySoloInterviews);
  const undoFetch = useFetch(undoSoloAnswer);

  const resumeStartedRef = useRef(false);

  const beginSession = async (payload) => {
    const res = await startFetch.fn(payload);
    if (res?.session) {
      setSession(res.session);
      setAnswer("");
      setMode("interview");
    }
  };

  // "Start with my resume questions" lands here as /practice?resume=<id>
  useEffect(() => {
    if (!resumeId || resumeStartedRef.current) return;
    resumeStartedRef.current = true;
    beginSession({ resumeId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  const submitCurrentAnswer = async () => {
    if (!session) return;
    const res = await answerFetch.fn({ sessionId: session.id, answer });
    if (!res?.session) return;
    if (res.session.completed || res.report) {
      setSession(res.session);
      setMode("results");
    } else {
      setSession(res.session);
      setAnswer("");
    }
  };

  const endEarly = async () => {
    if (!session) return;
    const res = await finishFetch.fn({ sessionId: session.id });
    if (res?.session) {
      setSession(res.session);
      setMode("results");
    }
  };

  const loadHistory = async () => {
    setMode("history");
    const res = await historyFetch.fn();
    if (res) setHistory(res);
  };

  // ─── Start view ────────────────────────────────────────────────────────────

  if (mode === "start") {
    const canStart = Boolean(category) && !startFetch.loading;
    return (
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-xs font-semibold text-amber-400 tracking-[0.14em] uppercase mb-4">
            1 — Pick a category
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORY_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
                  category === c.value
                    ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                    : "border-white/10 bg-[#0f0f11] text-stone-400 hover:border-white/25"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-amber-400 tracking-[0.14em] uppercase mb-4">
            2 — Target role <span className="text-stone-600 normal-case tracking-normal">(optional)</span>
          </p>
          <div className="flex flex-col gap-1.5 max-w-md">
            <Label htmlFor="roleTitle" className="text-stone-500 text-xs">
              e.g. Senior Frontend Engineer at Stripe
            </Label>
            <Input
              id="roleTitle"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="Senior Frontend Engineer"
              maxLength={200}
              className="bg-[#0f0f11] border-white/10"
            />
          </div>
          <p className="text-xs text-stone-600 mt-3">
            Questions get sharper with context — or{" "}
            <Link href="/resume" className="text-amber-400 hover:underline">
              upload your resume
            </Link>{" "}
            for questions tailored to your experience.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="gold"
            disabled={!canStart}
            onClick={() => beginSession({ category, roleTitle })}
          >
            {startFetch.loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Sparkles size={15} />
            )}
            {startFetch.loading ? "Generating questions…" : "Start interview"}
          </Button>
          <Button variant="ghost" onClick={loadHistory}>
            <History size={15} />
            Past sessions
          </Button>
        </div>
      </div>
    );
  }

  // ─── Interview view ────────────────────────────────────────────────────────

  if (mode === "interview" && session) {
    const index = session.answers.length;
    const total = session.questions.length;
    const question = session.questions[index];
    const answeredCount = index;
    const canEndEarly = answeredCount >= 3;

    return (
      <div className="flex flex-col gap-6">
        {/* Progress */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className="border-amber-400/20 bg-amber-400/5 text-amber-400 text-xs shrink-0">
              {CATEGORY_LABEL[session.category] ?? session.category}
            </Badge>
            {session.roleTitle && (
              <span className="text-xs text-stone-500 truncate">
                {session.roleTitle}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-stone-500">
              Question {Math.min(index + 1, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              {session.questions.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i < index
                      ? "bg-emerald-400"
                      : i === index
                        ? "bg-amber-400"
                        : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-6 py-5">
          <p className="text-[10px] font-semibold text-amber-400 tracking-widest uppercase mb-2">
            Interviewer
          </p>
          <p className="text-base text-stone-200 leading-relaxed">
            {question?.question}
          </p>
        </div>

        {/* Answer */}
        <div className="flex flex-col gap-2">
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer… think out loud like you would in a real interview."
            rows={9}
            maxLength={8000}
            className="bg-[#0f0f11] border-white/10 text-sm"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-stone-600">
              {answer.length > 0 ? `${answer.length} characters` : "Take your time — depth beats length."}
            </span>
            {canEndEarly && (
              <button
                type="button"
                onClick={endEarly}
                disabled={finishFetch.loading}
                className="inline-flex items-center gap-1.5 text-[11px] text-stone-500 hover:text-stone-300"
              >
                {finishFetch.loading ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Flag size={11} />
                )}
                End & get report
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="gold"
            onClick={() => submitCurrentAnswer(answer)}
            disabled={answerFetch.loading}
          >
            {answerFetch.loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : index + 1 >= total ? (
              <CheckCircle2 size={15} />
            ) : (
              <ArrowRight size={15} />
            )}
            {index + 1 >= total ? "Finish & get report" : "Next question"}
          </Button>
          {index > 0 && !answerFetch.loading && !undoFetch.loading && (
            <Button
              variant="ghost"
              onClick={async () => {
                const res = await undoFetch.fn({ sessionId: session.id });
                if (res?.session) {
                  setSession(res.session);
                  setAnswer(res.session.answers?.[res.session.answers.length - 1] ?? "");
                }
              }}
            >
              <ArrowLeft size={15} />
              Previous
            </Button>
          )}
          <span className="text-[11px] text-stone-600">
            Submitting the last question triggers your AI report — it can take
            ~30 seconds.
          </span>
        </div>

        {/* Report generation overlay */}
        {answerFetch.loading && index + 1 >= total && (
          <div className="rounded-2xl border border-white/10 bg-[#0f0f11] px-6 py-8 flex items-center gap-4">
            <Loader2 size={22} className="text-amber-400 animate-spin shrink-0" />
            <div>
              <p className="text-sm text-stone-300 font-medium">
                Generating your report…
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Gemini is evaluating your answers across technical depth,
                communication and problem solving.
              </p>
            </div>
          </div>
        )}

        {answerFetch.error && (
          <p className="text-xs text-rose-400">{answerFetch.error.message}</p>
        )}
      </div>
    );
  }

  // ─── Results view ──────────────────────────────────────────────────────────

  if (mode === "results" && session?.report) {
    const report = session.report;
    const rating = RATING_CONFIG[report.overallRating] ?? null;
    const breakdown = Array.isArray(report.questionBreakdown)
      ? report.questionBreakdown
      : [];

    return (
      <div className="flex flex-col gap-8">
        {/* Summary card */}
        <div className="rounded-2xl border border-white/10 bg-[#0f0f11] bg-linear-to-t from-transparent via-transparent to-amber-300/10 p-7 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold text-stone-600 tracking-widest uppercase mb-2">
                Practice report — {CATEGORY_LABEL[session.category] ?? session.category}
              </p>
              <div className="flex items-center gap-2">
                {rating && (
                  <Badge variant="outline" className={rating.className}>
                    {rating.emoji} {rating.label}
                  </Badge>
                )}
                {report.recommendation && (
                  <span className="text-xs text-stone-500">
                    {report.recommendation.split(/\s+/)[0]}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <p className="font-serif text-4xl leading-none bg-linear-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent">
                {avgOf(report.technicalScore, report.communicationScore, report.problemSolvingScore)?.toFixed(1) ?? "—"}
              </p>
              <p className="text-[10px] text-stone-600 tracking-widest uppercase mt-1">
                Overall / 10
              </p>
            </div>
          </div>

          {report.summary && (
            <p className="text-sm text-stone-400 font-light leading-relaxed">
              {report.summary}
            </p>
          )}

          {/* Score bars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              ["Technical", report.technicalScore],
              ["Communication", report.communicationScore],
              ["Problem solving", report.problemSolvingScore],
            ].map(([label, score]) => (
              <div key={label} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-stone-600 tracking-widest uppercase">
                    {label}
                  </span>
                  <span className="text-xs text-stone-400">{score ?? "—"}/10</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-amber-500 to-amber-300 transition-all"
                    style={{ width: `${(score ?? 0) * 10}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths / improvements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-green-500/15 bg-green-500/5 px-5 py-4">
            <p className="text-[10px] font-semibold text-green-400 tracking-widest uppercase mb-3">
              Strengths
            </p>
            <ul className="flex flex-col gap-2">
              {(report.strengths ?? []).length > 0 ? (
                report.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-stone-400 leading-relaxed flex gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    {s}
                  </li>
                ))
              ) : (
                <li className="text-xs text-stone-600">Nothing specific flagged.</li>
              )}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 px-5 py-4">
            <p className="text-[10px] font-semibold text-amber-400 tracking-widest uppercase mb-3">
              Improvements
            </p>
            <ul className="flex flex-col gap-2">
              {(report.improvements ?? []).length > 0 ? (
                report.improvements.map((s, i) => (
                  <li key={i} className="text-xs text-stone-400 leading-relaxed flex gap-2">
                    <span className="text-amber-400 mt-0.5">→</span>
                    {s}
                  </li>
                ))
              ) : (
                <li className="text-xs text-stone-600">Nothing specific flagged.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Per-question breakdown with revealed model answers */}
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold text-stone-500 tracking-widest uppercase">
            Question breakdown ({breakdown.length})
          </p>
          {breakdown.map((q, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-[#0f0f11] px-5 py-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-stone-300 leading-relaxed">
                  {q.question}
                </p>
                <Badge
                  variant="outline"
                  className={`${VERDICT_STYLES[q.verdict] ?? VERDICT_STYLES.FAIR} shrink-0`}
                >
                  {q.verdict}
                </Badge>
              </div>

              {session.questions[i]?.modelAnswer && (
                <details className="rounded-lg border border-white/8 bg-[#141417] px-4 py-2.5">
                  <summary className="text-[11px] text-amber-400 cursor-pointer select-none">
                    Model answer
                  </summary>
                  <p className="text-xs text-stone-400 font-light leading-relaxed mt-2">
                    {session.questions[i].modelAnswer}
                  </p>
                </details>
              )}

              {q.notes && (
                <p className="text-xs text-stone-500 font-light leading-relaxed">
                  {q.notes}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="gold"
            onClick={() => {
              setSession(null);
              setAnswer("");
              setMode("start");
            }}
          >
            <RotateCcw size={15} />
            Practice again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/progress">
              <TrendingUp size={15} />
              View progress
            </Link>
          </Button>
          <Button variant="ghost" onClick={loadHistory}>
            <History size={15} />
            Past sessions
          </Button>
        </div>
      </div>
    );
  }

  // ─── History view ──────────────────────────────────────────────────────────

  if (mode === "history") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-stone-500 tracking-widest uppercase">
            Past practice sessions
          </p>
          <Button variant="ghost" size="sm" onClick={() => setMode("start")}>
            <ArrowLeft size={14} />
            Back
          </Button>
        </div>

        {historyFetch.loading && history === null ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="text-amber-400 animate-spin" />
          </div>
        ) : (history ?? []).length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0f0f11] px-6 py-14 text-center">
            <Target size={26} className="mx-auto text-amber-400 mb-3" />
            <p className="text-sm text-stone-400">
              No practice sessions yet — your completed interviews will show up
              here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((s) => {
              const rating = s.report ? RATING_CONFIG[s.report.overallRating] : null;
              const avg = s.report
                ? avgOf(
                  s.report.technicalScore,
                  s.report.communicationScore,
                  s.report.problemSolvingScore
                )
                : null;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSession(s);
                    setMode(s.completed ? "results" : "interview");
                    setAnswer("");
                  }}
                  className="rounded-2xl border border-white/10 bg-[#0f0f11] px-5 py-4 flex items-center justify-between gap-4 text-left hover:border-amber-400/30 transition-colors"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-stone-300">
                        {CATEGORY_LABEL[s.category] ?? s.category}
                      </span>
                      {s.completed ? (
                        rating ? (
                          <Badge variant="outline" className={rating.className}>
                            {rating.emoji} {rating.label}
                          </Badge>
                        ) : null
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-blue-500/20 bg-blue-500/10 text-blue-400"
                        >
                          In progress
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-stone-600">
                      {formatDate(s.createdAt)}
                      {s.roleTitle ? ` · ${s.roleTitle}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {avg !== null && (
                      <span className="font-serif text-2xl text-amber-400">
                        {avg.toFixed(1)}
                      </span>
                    )}
                    <ArrowRight size={15} className="text-stone-600" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Fallback (e.g. results without a report)
  return (
    <div className="flex items-center justify-center py-20">
      <Button variant="outline" onClick={() => setMode("start")}>
        Back to practice
      </Button>
    </div>
  );
}
