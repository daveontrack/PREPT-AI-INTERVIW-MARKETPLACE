"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  TrendingUp,
  MessageSquare,
  Brain,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Star,
  Loader2,
  Gauge,
  ListChecks,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { GrayTitle } from "@/components/reusables";
import { StarsBackgroundDemo } from "./demo-components-backgrounds-stars";
import { RATING_CONFIG } from "@/lib/data";
import { submitSessionRating } from "@/actions/feedback";
import useFetch from "@/hooks/use-fetch";

const SCORE_BAR = {
  low: { text: "text-red-400", bar: "bg-red-400" },
  mid: { text: "text-amber-400", bar: "bg-amber-400" },
  high: { text: "text-green-400", bar: "bg-green-400" },
};

function scoreStyle(n) {
  if (n == null) return SCORE_BAR.mid;
  if (n < 5) return SCORE_BAR.low;
  if (n >= 8) return SCORE_BAR.high;
  return SCORE_BAR.mid;
}

const VERDICT_STYLE = {
  STRONG: "border-green-500/20 text-green-400",
  GOOD: "border-blue-500/20 text-blue-400",
  FAIR: "border-amber-400/20 text-amber-400",
  WEAK: "border-red-500/20 text-red-400",
};

function ScoreBar({ icon, label, score }) {
  const style = scoreStyle(score);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-stone-500">
          {icon}
          <p className="text-[10px] uppercase tracking-widest">{label}</p>
        </div>
        <p className={`text-sm font-medium ${style.text}`}>
          {score != null ? `${score}/10` : "—"}
        </p>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full ${style.bar} transition-all duration-700`}
          style={{ width: score != null ? `${score * 10}%` : "0%" }}
        />
      </div>
    </div>
  );
}

function SectionCard({ icon, title, children, className = "" }) {
  return (
    <div
      className={`bg-[#141417] border border-white/8 rounded-xl p-5 ${className}`}
    >
      <div className="flex items-center gap-2 mb-2.5">
        {icon}
        <p className="text-[10px] uppercase tracking-widest text-stone-500">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function StarRatingInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            size={18}
            className={
              n <= value
                ? "fill-amber-400 text-amber-400"
                : "text-stone-700 hover:text-stone-500"
            }
          />
        </button>
      ))}
    </div>
  );
}

function buildReportText(feedback, intervieweeName) {
  const L = [];
  L.push("AI FEEDBACK REPORT");
  L.push(intervieweeName ? `Candidate: ${intervieweeName}` : "");
  L.push("");
  L.push(
    `Overall rating: ${
      RATING_CONFIG[feedback.overallRating]?.label ?? "Unrated"
    }`
  );
  if (
    feedback.technicalScore ||
    feedback.communicationScore ||
    feedback.problemSolvingScore
  ) {
    L.push(
      `Scores — Technical: ${
        feedback.technicalScore ?? "—"
      }/10 · Communication: ${
        feedback.communicationScore ?? "—"
      }/10 · Problem Solving: ${feedback.problemSolvingScore ?? "—"}/10`
    );
  }
  L.push("");
  if (feedback.summary) L.push(`Summary: ${feedback.summary}`, "");
  if (feedback.recommendation)
    L.push(`Recommendation: ${feedback.recommendation}`, "");
  if (feedback.technical) L.push(`Technical: ${feedback.technical}`, "");
  if (feedback.communication)
    L.push(`Communication: ${feedback.communication}`, "");
  if (feedback.problemSolving)
    L.push(`Problem solving: ${feedback.problemSolving}`, "");
  if (feedback.pace) L.push(`Pace & timing: ${feedback.pace}`, "");

  if (Array.isArray(feedback.questionBreakdown) && feedback.questionBreakdown.length) {
    L.push("Question breakdown:");
    feedback.questionBreakdown.forEach((q, i) => {
      L.push(`  ${i + 1}. ${q.question} — ${q.verdict}: ${q.notes || ""}`);
      if (Array.isArray(q.strengths) && q.strengths.length) {
        L.push("    Strengths:");
        q.strengths.forEach((s) => L.push(`      ✓ ${s}`));
      }
      if (Array.isArray(q.improvements) && q.improvements.length) {
        L.push("    To improve:");
        q.improvements.forEach((s) => L.push(`      ○ ${s}`));
      }
    });
    L.push("");
  }

  if (Array.isArray(feedback.strengths) && feedback.strengths.length) {
    L.push("Strengths:");
    feedback.strengths.forEach((s) => L.push(`  ✓ ${s}`));
    L.push("");
  }
  if (Array.isArray(feedback.improvements) && feedback.improvements.length) {
    L.push("To improve:");
    feedback.improvements.forEach((s) => L.push(`  ○ ${s}`));
    L.push("");
  }
  if (Array.isArray(feedback.conceptsCovered) && feedback.conceptsCovered.length)
    L.push(`Concepts covered: ${feedback.conceptsCovered.join(", ")}`, "");
  if (Array.isArray(feedback.nextSteps) && feedback.nextSteps.length) {
    L.push("Next steps:");
    feedback.nextSteps.forEach((s) => L.push(`  → ${s}`));
  }

  return L.filter((l) => l !== "").join("\n");
}

export function FeedbackModal({
  open,
  onOpenChange,
  feedback,
  intervieweeName,
  mode = "interviewee",
  bookingId,
}) {
  const [copied, setCopied] = useState(false);
  const [draftRating, setDraftRating] = useState(0);
  const [comment, setComment] = useState("");
  const {
    loading: savingRating,
    fn: saveRatingFn,
  } = useFetch(submitSessionRating);

  if (!feedback) return null;

  const rating = RATING_CONFIG[feedback.overallRating] ?? {
    label: "Unrated",
    emoji: "❔",
    className: "border-white/8 bg-transparent text-stone-300",
    bg: "from-transparent",
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(buildReportText(feedback, intervieweeName));
      setCopied(true);
      toast.success("Report copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy report");
    }
  };

  const downloadReport = () => {
    const blob = new Blob([buildReportText(feedback, intervieweeName)], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-report-${intervieweeName?.toLowerCase().replace(/\s+/g, "-") || "session"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  const handleSaveRating = async () => {
    if (!draftRating) return;
    await saveRatingFn({ bookingId, rating: draftRating, comment });
    setDraftRating(0);
    setComment("");
  };

  const scores = [
    {
      icon: <Brain size={14} className="text-amber-400" />,
      label: "Technical",
      score: feedback.technicalScore,
    },
    {
      icon: <MessageSquare size={14} className="text-amber-400" />,
      label: "Communication",
      score: feedback.communicationScore,
    },
    {
      icon: <TrendingUp size={14} className="text-amber-400" />,
      label: "Problem Solving",
      score: feedback.problemSolvingScore,
    },
  ];
  const hasScores = scores.some((s) => s.score != null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border border-amber-200/20 text-stone-100 sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <StarsBackgroundDemo />

        <DialogHeader className="relative">
          <div className="flex items-start justify-between gap-4 pr-10">
            <div>
              <DialogTitle className="font-serif text-2xl tracking-tight">
                <GrayTitle>AI Feedback Report</GrayTitle>
              </DialogTitle>
              {intervieweeName && (
                <p className="text-xs text-stone-500 font-light mt-1">
                  Performance analysis for {intervieweeName}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-stone-400"
                onClick={copyReport}
              >
                {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-stone-400"
                onClick={downloadReport}
              >
                <Download size={13} />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="relative flex flex-col gap-5 mt-2">
          {/* Rating + scores */}
          <div
            className={`rounded-2xl border ${rating.className} bg-linear-to-br ${rating.bg} to-transparent p-6 flex items-center justify-between`}
          >
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-60">
                Overall rating
              </p>
              <p className="font-serif text-3xl">{rating.label}</p>
            </div>

            <span className="text-4xl">{rating.emoji}</span>
          </div>

          {hasScores && (
            <div className="bg-[#141417] border border-white/8 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Gauge size={13} className="text-amber-400" />
                <p className="text-[10px] uppercase tracking-widest text-stone-500">
                  Score breakdown
                </p>
              </div>
              {scores.map((s) => (
                <ScoreBar key={s.label} {...s} />
              ))}
            </div>
          )}

          {/* Summary */}
          {feedback.summary && (
            <SectionCard
              icon={<Sparkles size={13} className="text-amber-400" />}
              title="Summary"
            >
              <p className="text-sm text-stone-300">{feedback.summary}</p>
            </SectionCard>
          )}

          {/* Recommendation */}
          {feedback.recommendation && (
            <SectionCard
              icon={<CheckCircle2 size={13} className="text-green-400" />}
              title="Recommendation"
            >
              <p className="text-sm text-stone-300">
                {feedback.recommendation}
              </p>
            </SectionCard>
          )}

          {/* Written assessments */}
          <div className="grid gap-3">
            {[
              {
                icon: <Brain size={14} className="text-amber-400" />,
                label: "Technical",
                value: feedback.technical,
              },
              {
                icon: <MessageSquare size={14} className="text-amber-400" />,
                label: "Communication",
                value: feedback.communication,
              },
              {
                icon: <TrendingUp size={14} className="text-amber-400" />,
                label: "Problem Solving",
                value: feedback.problemSolving,
              },
            ]
              .filter((item) => item.value)
              .map((item) => (
                <div
                  key={item.label}
                  className="bg-[#141417] border border-white/8 rounded-xl p-5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {item.icon}
                    <p className="text-[10px] uppercase tracking-widest text-stone-500">
                      {item.label}
                    </p>
                  </div>
                  <p className="text-sm text-stone-300">{item.value}</p>
                </div>
              ))}
          </div>

          {/* Question breakdown */}
          {Array.isArray(feedback.questionBreakdown) &&
            feedback.questionBreakdown.length > 0 && (
              <SectionCard
                icon={<HelpCircle size={13} className="text-amber-400" />}
                title="Question breakdown"
              >
                <div className="flex flex-col gap-2.5">
                  {feedback.questionBreakdown.map((q, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-white/8 bg-black/30 p-3.5 flex flex-col gap-1.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-stone-200 leading-snug">
                          {i + 1}. {q.question}
                        </p>
                        <Badge
                          variant="outline"
                          className={`shrink-0 ${VERDICT_STYLE[q.verdict] ?? VERDICT_STYLE.FAIR}`}
                        >
                          {q.verdict}
                        </Badge>
                      </div>
                      {q.notes && (
                        <p className="text-xs text-stone-500 font-light leading-relaxed">
                          {q.notes}
                        </p>
                      )}
                      {q.strengths?.length > 0 && (
                        <div className="flex flex-col gap-1 mt-1">
                          <p className="text-[10px] uppercase tracking-widest text-green-500/70">
                            Strengths
                          </p>
                          {q.strengths.map((s, j) => (
                            <p
                              key={j}
                              className="text-xs text-green-400/90 font-light leading-relaxed"
                            >
                              ✓ {s}
                            </p>
                          ))}
                        </div>
                      )}
                      {q.improvements?.length > 0 && (
                        <div className="flex flex-col gap-1 mt-1">
                          <p className="text-[10px] uppercase tracking-widest text-red-500/70">
                            To improve
                          </p>
                          {q.improvements.map((s, j) => (
                            <p
                              key={j}
                              className="text-xs text-red-400/90 font-light leading-relaxed"
                            >
                              ○ {s}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

          {/* Pace */}
          {feedback.pace && (
            <SectionCard
              icon={<Gauge size={13} className="text-amber-400" />}
              title="Pace & timing"
            >
              <p className="text-sm text-stone-300">{feedback.pace}</p>
            </SectionCard>
          )}

          {/* Strengths & Improvements */}
          {(feedback.strengths?.length > 0 ||
            feedback.improvements?.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#141417] border border-white/8 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={13} className="text-green-400" />
                  <p className="text-[10px] uppercase tracking-widest text-stone-500">
                    Strengths
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {feedback.strengths?.map((s, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="justify-start border-green-500/20 text-green-400 whitespace-normal"
                    >
                      ✓ {s}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="bg-[#141417] border border-white/8 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={13} className="text-amber-400" />
                  <p className="text-[10px] uppercase tracking-widest text-stone-500">
                    To improve
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {feedback.improvements?.map((imp, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="justify-start border-red-500/20 text-red-400 whitespace-normal"
                    >
                      ○ {imp}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Concepts covered */}
          {feedback.conceptsCovered?.length > 0 && (
            <SectionCard
              icon={<Sparkles size={13} className="text-amber-400" />}
              title="Concepts covered"
            >
              <div className="flex flex-wrap gap-1.5">
                {feedback.conceptsCovered.map((c, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-stone-300"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Next steps */}
          {feedback.nextSteps?.length > 0 && (
            <SectionCard
              icon={<ListChecks size={13} className="text-amber-400" />}
              title="Next steps"
            >
              <div className="flex flex-col gap-2">
                {feedback.nextSteps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-stone-300"
                  >
                    <span className="w-5 h-5 shrink-0 mt-0.5 rounded-md bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[11px] flex items-center justify-center font-medium">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Interviewer's rating of the candidate */}
          {mode === "interviewer" && (
            <div className="bg-[#141417] border border-white/8 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Star size={13} className="text-amber-400" />
                <p className="text-[10px] uppercase tracking-widest text-stone-500">
                  Your rating of {intervieweeName ?? "the candidate"}
                </p>
              </div>

              {feedback.sessionRating ? (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={16}
                        className={
                          n <= feedback.sessionRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-stone-700"
                        }
                      />
                    ))}
                    <span className="text-xs text-stone-500 ml-1">
                      Saved
                    </span>
                  </div>
                  {feedback.sessionComment && (
                    <p className="text-sm text-stone-300">
                      “{feedback.sessionComment}”
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <StarRatingInput value={draftRating} onChange={setDraftRating} />
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Brief feedback for the candidate (optional)"
                    className="min-h-20 text-sm"
                    maxLength={1000}
                  />
                  <Button
                    variant="gold"
                    size="sm"
                    className="self-start gap-2"
                    disabled={!draftRating || savingRating}
                    onClick={handleSaveRating}
                  >
                    {savingRating ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Star size={13} />
                    )}
                    Save rating
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
