import { currentUser } from "@clerk/nextjs/server";
import { after } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getIntervieweeAppointments } from "@/actions/appointments";
import { autoGeneratePendingReports } from "@/lib/feedback";
import { sendUpcomingReminders } from "@/lib/reminders";
import { AppointmentCard } from "@/components/AppointmentCard";
import PageHeader from "@/components/reusables";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";

export default async function MyAppointmentsPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const appointments = await getIntervieweeAppointments();
  const now = new Date();
  const scheduled = appointments.filter(
    (a) => a.status === "SCHEDULED" && new Date(a.startTime) > now
  );
  const past = appointments.filter(
    (a) => a.status !== "SCHEDULED" || new Date(a.endTime) <= now
  );

  // Auto-generate AI feedback for past sessions that don't have a report yet.
  // Runs in the background after the page streams (after()), so reports appear
  // without any clicks. Sessions whose transcript isn't ready are skipped and
  // retried on the next visit.
  const pendingFeedbackIds = past
    .filter((b) => b.streamCallId && !b.feedback && b.status !== "CANCELLED")
    .map((b) => b.id);
  if (pendingFeedbackIds.length > 0) {
    after(() => {
      autoGeneratePendingReports({
        clerkUserId: user.id,
        bookingIds: pendingFeedbackIds,
      }).catch((err) =>
        console.error("[auto-feedback] Background generation failed:", err)
      );
    });
  }

  // Background reminder sweep — emails parties whose session starts within
  // the hour (no-op when nothing is due; remindedAt makes it idempotent).
  after(() => {
    sendUpcomingReminders({ clerkUserId: user.id }).catch((err) =>
      console.error("[reminders] Background sweep failed:", err)
    );
  });

  return (
    <main className="min-h-screen bg-background">
      {/* ── Page header ── */}
      <PageHeader
        label="My appointments"
        gray="Your interview"
        gold="sessions"
        description="All your upcoming and past mock interviews in one place."
      />

      <div className="max-w-6xl mx-auto px-8 lg:px-0 py-8 flex flex-col gap-14">
        {/* ── Empty state ── */}
        {appointments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 gap-5 text-center">
            <span className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-3xl">
              <CalendarDays size={28} className="text-amber-400" />
            </span>
            <div>
              <p className="text-base text-stone-400 font-light">
                No sessions booked yet.
              </p>
              <p className="text-sm text-stone-600 mt-1">
                Browse expert interviewers and book your first session.
              </p>
            </div>
            <Button variant="gold" asChild>
              <Link href="/explore">Browse interviewers →</Link>
            </Button>
          </div>
        )}

        {/* ── Upcoming ── */}
        {scheduled.length > 0 && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <p className="text-xs font-semibold text-stone-500 tracking-widest uppercase">
                Upcoming ({scheduled.length})
              </p>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {scheduled.map((b) => (
                <AppointmentCard key={b.id} booking={b} mode="interviewee" />
              ))}
            </div>
          </div>
        )}

        {/* ── Past ── */}
        {past.length > 0 && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <p className="text-xs font-semibold text-stone-500 tracking-widest uppercase">
                Past ({past.length})
              </p>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {past.map((b) => (
                <AppointmentCard
                  key={b.id}
                  booking={b}
                  mode="interviewee"
                  isPast={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
