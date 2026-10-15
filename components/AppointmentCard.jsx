"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  CalendarPlus,
  Clock,
  Video,
  Sparkles,
  Loader2,
  Code2,
} from "lucide-react";
import { FeedbackModal } from "./FeedbackModal";
import { formatDate, formatDuration, formatTime } from "@/lib/helpers";
import { RATING_LABEL, RATING_STYLES, STATUS_STYLES } from "@/lib/data";
import { generateFeedbackReport } from "@/actions/feedback";
import { languageLabel } from "@/components/CollabEditor";
import useFetch from "@/hooks/use-fetch";

// Monaco is heavy and only needed when the user opens the code review dialog —
// load it lazily (client-only).
const CollabEditor = dynamic(() => import("@/components/CollabEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={20} className="text-amber-400 animate-spin" />
    </div>
  ),
});

export function AppointmentCard({ booking, mode, isPast = false }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const { has } = useAuth();
  const router = useRouter();
  const {
    loading: generating,
    fn: generateReport,
  } = useFetch(generateFeedbackReport);

  const handleGenerateReport = async () => {
    await generateReport({ bookingId: booking.id });
    router.refresh();
  };

  const {
    startTime,
    endTime,
    status,
    creditsCharged,
    streamCallId,
    recordingUrl,
    sharedCode,
    sharedLanguage,
    feedback,
  } = booking;

  const person =
    mode === "interviewer" ? booking.interviewee : booking.interviewer;

  const creditsLabel =
    mode === "interviewer"
      ? `+${creditsCharged} credits earned`
      : `−${creditsCharged} credits`;

  const creditsStyle =
    mode === "interviewer"
      ? "border-green-500/20 bg-green-500/10 text-green-400"
      : "border-amber-400/20 bg-amber-400/5 text-amber-400";

  const isUpcoming = status === "SCHEDULED";

  return (
    <>
      <FeedbackModal
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        feedback={feedback}
        bookingId={booking.id}
        mode={mode}
        intervieweeName={
          mode === "interviewer" ? booking.interviewee?.name : undefined
        }
      />

      {/* Read-only replay of the shared code from the live interview */}
      <Dialog open={codeOpen} onOpenChange={setCodeOpen}>
        <DialogContent className="sm:max-w-5xl w-[92vw]">
          <DialogHeader>
            <DialogTitle>
              Shared code — {languageLabel(sharedLanguage)}
            </DialogTitle>
          </DialogHeader>
          <div className="h-[65vh] rounded-lg overflow-hidden border border-white/10">
            <CollabEditor
              readOnly
              language={sharedLanguage ?? "javascript"}
              initialCode={sharedCode ?? ""}
            />
          </div>
        </DialogContent>
      </Dialog>

      <article className="group relative bg-[#0f0f11] border border-white/10 transition-all duration-300 hover:-translate-y-0.5 rounded-2xl bg-linear-to-t from-transparent via-transparent to-amber-300/10 p-7 flex flex-col gap-6 self-start">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar className="w-14 h-14 border border-white/10 rounded-2xl shrink-0">
              <AvatarImage
                src={person?.imageUrl}
                alt={person?.name}
                className="rounded-2xl"
              />
              <AvatarFallback className="rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 text-lg font-medium">
                {person?.name?.[0] ?? "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-base font-medium text-stone-200 leading-tight truncate">
                {person?.name ?? "—"}
              </p>
              {person?.title && person?.company ? (
                <p className="text-xs text-stone-500 truncate">
                  {person.title}
                  <span className="text-stone-700 mx-1.5">·</span>
                  {person.company}
                </p>
              ) : (
                <p className="text-xs text-stone-600 truncate">
                  {person?.email}
                </p>
              )}
              {mode === "interviewee" && person?.categories?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {person.categories.slice(0, 3).map((cat) => (
                    <span
                      key={cat}
                      className="text-[10px] px-2 py-0.5 rounded-md border border-amber-400/20 bg-amber-400/5 text-amber-400 leading-tight"
                    >
                      {cat.replace("_", " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge variant="outline" className={STATUS_STYLES[status]}>
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </Badge>
            <Badge variant="outline" className={creditsStyle}>
              {creditsLabel}
            </Badge>
          </div>
        </div>

        <div className="h-px bg-white/5" />

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-stone-600">
              <Calendar size={12} />
              <span className="text-[10px] font-semibold tracking-widest uppercase">
                Date
              </span>
            </div>
            <p className="text-sm text-stone-300">{formatDate(startTime)}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-stone-600">
              <Clock size={12} />
              <span className="text-[10px] font-semibold tracking-widest uppercase">
                Time
              </span>
            </div>
            <p className="text-sm text-stone-300">
              {formatTime(startTime)}
              <span className="text-stone-600 mx-1">–</span>
              {formatTime(endTime)}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-stone-600">
              <Video size={12} />
              <span className="text-[10px] font-semibold tracking-widest uppercase">
                Duration
              </span>
            </div>
            <p className="text-sm text-stone-300">
              {formatDuration(startTime, endTime)}
            </p>
          </div>
        </div>

        {feedback?.summary &&
          (mode === "interviewer" ||
            has?.({ plan: "starter" }) ||
            has?.({ plan: "pro" })) && (
            <div className="rounded-xl border border-white/8 bg-[#141417] px-4 py-3 flex flex-col gap-1.5">
              <p className="text-[10px] font-semibold text-stone-600 tracking-widest uppercase">
                AI Feedback
              </p>
              <p className="text-xs text-stone-400 font-light leading-relaxed line-clamp-2">
                {feedback.summary}
              </p>
            </div>
          )}

        {!feedback &&
          isPast &&
          status !== "CANCELLED" &&
          streamCallId &&
          (mode === "interviewer" ||
            has?.({ plan: "starter" }) ||
            has?.({ plan: "pro" })) && (
            <div className="rounded-xl border border-white/8 bg-[#141417] px-4 py-3 flex flex-col gap-1.5">
              <p className="text-[10px] font-semibold text-stone-600 tracking-widest uppercase">
                AI Feedback
              </p>
              <p className="text-xs text-stone-400 font-light leading-relaxed">
                Your AI feedback is being generated for this session. It will
                appear here shortly — please check back in a few minutes.
              </p>
            </div>
          )}

        {(streamCallId || recordingUrl || feedback || sharedCode) && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {!feedback &&
              isPast &&
              streamCallId &&
              (mode === "interviewer" ||
                has?.({ plan: "starter" }) ||
                has?.({ plan: "pro" })) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-amber-400/20 text-amber-400 hover:bg-amber-400/10 hover:border-amber-400/40"
                  onClick={handleGenerateReport}
                  disabled={generating}
                >
                  {generating ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  {generating ? "Generating…" : "Generate report"}
                </Button>
              )}

            {!isPast && streamCallId && isUpcoming && (
              <Button variant="gold" size="sm" className="gap-2" asChild>
                <Link href={`/call/${streamCallId}`}>
                  <Video size={13} />
                  Join call
                </Link>
              </Button>
            )}

            {isUpcoming && (
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <a href={`/api/calendar/${booking.id}`} download>
                  <CalendarPlus size={12} />
                  Add to calendar
                </a>
              </Button>
            )}

            {recordingUrl && has?.({ plan: "pro" }) && (
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a
                  href={recordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📹 Recording
                </a>
              </Button>
            )}

            {sharedCode && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-amber-400/20 text-amber-400 hover:bg-amber-400/10 hover:border-amber-400/40"
                onClick={() => setCodeOpen(true)}
              >
                <Code2 size={12} />
                View code
              </Button>
            )}

            {feedback &&
              (mode === "interviewer" ||
                has?.({ plan: "starter" }) ||
                has?.({ plan: "pro" })) && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-amber-400/20 text-amber-400 hover:bg-amber-400/10 hover:border-amber-400/40"
                    onClick={() => setFeedbackOpen(true)}
                  >
                    <Sparkles size={12} />
                    View Feedback
                  </Button>
                  {feedback.overallRating && (
                    <Badge
                      variant="outline"
                      className={RATING_STYLES[feedback.overallRating]}
                    >
                      ✦ {RATING_LABEL[feedback.overallRating]} performance
                    </Badge>
                  )}
                </>
              )}
          </div>
        )}
      </article>
    </>
  );
}
