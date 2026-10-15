import { currentUser } from "@clerk/nextjs/server";
import { after } from "next/server";
import { redirect } from "next/navigation";
import PageHeader from "@/components/reusables";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAvailability,
  getInterviewerAppointments,
  getInterviewerStats,
  getWithdrawalHistory,
} from "@/actions/dashboard";
import { autoGeneratePendingReports } from "@/lib/feedback";
import { sendUpcomingReminders } from "@/lib/reminders";
import AvailabilitySection from "./components/AvailabilitySection";
import AppointmentsSection from "./components/AppointmentsSection";
import EarningsSection from "./components/EarningsSection";
import { ClipboardList, Clock, Wallet } from "lucide-react";
import { getCurrentUser } from "@/actions/user";

export default async function InterviewerDashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const dbUser = await getCurrentUser();

  const [availability, appointments, stats, withdrawalHistory] =
    await Promise.all([
      getAvailability(),
      getInterviewerAppointments(),
      getInterviewerStats(),

      // Assignment
      getWithdrawalHistory(),
    ]);

  // Auto-generate AI feedback for past sessions that don't have a report yet.
  // Runs in the background after the page streams (after()), so reports appear
  // without any clicks. Sessions whose transcript isn't ready are skipped and
  // retried on the next visit.
  const now = new Date();
  const pendingFeedbackIds = appointments
    .filter(
      (a) =>
        a.streamCallId &&
        !a.feedback &&
        a.status !== "CANCELLED" &&
        (a.status !== "SCHEDULED" || new Date(a.endTime) <= now)
    )
    .map((a) => a.id);
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

  // Background reminder sweep — emails both parties when a session starts
  // within the hour (no-op when nothing is due; remindedAt makes it safe).
  after(() => {
    sendUpcomingReminders({ clerkUserId: user.id }).catch((err) =>
      console.error("[reminders] Background sweep failed:", err)
    );
  });

  return (
    <main className="min-h-screen bg-background">
      {/* Page header */}
      <PageHeader
        label="Interviewer dashboard"
        gray="Welcome back,"
        gold={dbUser.name?.split(" ")[0] ?? "Interviewer"}
        description={
          dbUser.title && dbUser.company
            ? `${dbUser.title} · ${dbUser.company}`
            : undefined
        }
        right={
          <div>
            <p className="text-xs text-muted-foreground/70">Credit balance</p>
            <p className="font-serif text-3xl leading-none bg-linear-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent text-right">
              {stats?.creditBalance ?? 0}
            </p>
          </div>
        }
      />

      {/* Tabbed content */}
      <div className="max-w-6xl mx-auto px-8 py-10">
        <Tabs defaultValue="earnings">
          <TabsList className="bg-card border border-border mb-8 w-full">
            <TabsTrigger value="earnings" className="p-5">
              <Wallet size={16} className="text-amber-400" /> Earnings
            </TabsTrigger>
            <TabsTrigger value="appointments" className="p-5">
              <ClipboardList size={18} className="text-amber-400" />{" "}
              Appointments
            </TabsTrigger>
            <TabsTrigger value="availability" className="p-5">
              <Clock size={18} className="text-amber-400" /> Availability
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            <AppointmentsSection appointments={appointments} />
          </TabsContent>

          <TabsContent value="availability">
            <AvailabilitySection initial={availability} />
          </TabsContent>

          <TabsContent value="earnings">
            <EarningsSection stats={stats} history={withdrawalHistory} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
