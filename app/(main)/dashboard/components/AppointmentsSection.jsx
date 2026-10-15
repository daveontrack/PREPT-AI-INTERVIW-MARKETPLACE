"use client";

import { AppointmentCard } from "@/components/AppointmentCard";
import { GrayTitle } from "@/components/reusables";
import { ClipboardList } from "lucide-react";

export default function AppointmentsSection({ appointments }) {
  const now = new Date();
  const scheduled = appointments.filter(
    (a) => a.status === "SCHEDULED" && new Date(a.startTime) > now
  );
  const past = appointments.filter(
    (a) => a.status !== "SCHEDULED" || new Date(a.endTime) <= now
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="bg-card border border-border rounded-2xl p-8">
        <span className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-4">
          <ClipboardList size={18} className="text-amber-400" />
        </span>
        <h2 className="font-serif text-xl tracking-tight">
          <GrayTitle>Appointments</GrayTitle>
        </h2>
        <p className="text-xs text-muted-foreground font-light mt-1">
          All your scheduled and past sessions.
        </p>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-20 text-center">
          <p className="text-muted-foreground/70 text-sm">No appointments yet.</p>
          <p className="text-muted-foreground/50 text-xs mt-1">
            Once interviewees book your slots, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {scheduled.length > 0 && (
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">
                Upcoming ({scheduled.length})
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {scheduled.map((b) => (
                  <AppointmentCard key={b.id} booking={b} mode="interviewer" />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">
                Past ({past.length})
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {past.map((b) => (
                  <AppointmentCard
                    key={b.id}
                    booking={b}
                    mode="interviewer"
                    isPast
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
