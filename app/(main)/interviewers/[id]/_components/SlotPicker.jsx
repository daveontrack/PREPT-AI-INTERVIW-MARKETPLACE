"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GrayTitle } from "@/components/reusables";
import { bookSlot } from "@/actions/booking";
import useFetch from "@/hooks/use-fetch";
import UpgradeModal from "@/components/UpgradeModal";
import {
  formatDateFull,
  formatTime,
  formatDateTab,
  formatTimeOfDay,
  generateDates,
  generateSlots,
} from "@/lib/helpers";

const SLOT_DURATION_MINUTES = 10;
const DAYS_AHEAD = 7;

export default function SlotPicker({
  interviewer,
  interviewerCredits,
  userCredits,
}) {
  const router = useRouter();
  const dates = useMemo(() => generateDates(DAYS_AHEAD), []);

  const availability = interviewer.availabilities?.[0];
  const canAfford = userCredits >= interviewerCredits;
  const bookings = useMemo(
    () => interviewer.bookingsAsInterviewer ?? [],
    [interviewer.bookingsAsInterviewer]
  );

  // Pick the first upcoming day that still has an open slot in the daily window
  const initialDate = useMemo(() => {
    if (!availability) return dates[0];
    const firstWithSlots = dates.find((d) =>
      generateSlots(
        d,
        availability.startTime,
        availability.endTime,
        bookings,
        SLOT_DURATION_MINUTES
      ).some((s) => s.available)
    );
    return firstWithSlots ?? dates[0];
  }, [dates, availability, bookings]);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const summaryRef = useRef(null);

  useEffect(() => {
    if (selectedSlot && summaryRef.current) {
      summaryRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedSlot]);

  const { data, loading, error, fn: bookFn } = useFetch(bookSlot);

  const slots = useMemo(() => {
    if (!availability) return [];
    return generateSlots(
      selectedDate,
      availability.startTime,
      availability.endTime,
      bookings,
      SLOT_DURATION_MINUTES
    );
  }, [selectedDate, availability, bookings]);

  useEffect(() => {
    if (data?.success && data.streamCallId) {
      router.push(`/appointments`);
    }
  }, [data, router]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotClick = (slot) => {
    if (!slot.available) return;
    if (!canAfford) {
      setUpgradeOpen(true);
      return;
    }
    setSelectedSlot((prev) =>
      prev?.startTime.getTime() === slot.startTime.getTime() ? null : slot
    );
  };

  const handleConfirm = () => {
    if (!selectedSlot) return;
    bookFn({
      interviewerId: interviewer.id,
      startTime: selectedSlot.startTime.toISOString(),
      endTime: selectedSlot.endTime.toISOString(),
    });
  };

  const windowActive = availability && availability.isActive !== false;

  if (!availability || !windowActive) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center flex flex-col items-center gap-2">
        <span className="text-2xl">🕐</span>
        <p className="text-sm text-muted-foreground">
          {!availability
            ? "This interviewer hasn't set their availability yet."
            : "The interviewer is currently unavailable."}
        </p>
        <p className="text-xs text-muted-foreground/50">Check back later.</p>
      </div>
    );
  }

  const allBooked = slots.length > 0 && slots.every((s) => s.isBooked);

  return (
    <>
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        reason={`You need ${interviewerCredits} credits to book this session. Your current balance is ${userCredits}.`}
      />

      <div className="flex flex-col gap-4">
        {/* ── Main picker card ── */}
        <div className="bg-card border border-border rounded-2xl p-7 flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl tracking-tight">
                <GrayTitle>Book a session</GrayTitle>
              </h2>
              <p className="text-xs text-muted-foreground font-light mt-1">
                Available every day ·{" "}
                <span className="text-amber-400 font-medium">
                  {formatTimeOfDay(availability.startTime)} –{" "}
                  {formatTimeOfDay(availability.endTime)}
                </span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground/70">Cost</p>
              <p className="font-serif text-2xl leading-none bg-linear-to-br from-amber-500 to-amber-700 dark:from-amber-300 dark:to-amber-500 bg-clip-text text-transparent">
                {interviewerCredits}
                <span className="text-xs font-sans text-muted-foreground ml-1">
                  cr
                </span>
              </p>
            </div>
          </div>

          {/* Date tabs */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none -mx-1 px-1">
            {dates.map((date) => {
              const label = formatDateTab(date);
              const active =
                date.toDateString() === selectedDate.toDateString();

              return (
                <button
                  key={date.toDateString()}
                  type="button"
                  onClick={() => handleDateChange(date)}
                  className={`shrink-0 flex flex-col items-center px-3.5 py-2.5 rounded-xl border text-xs transition-all duration-200 ${active
                    ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
                    : "border-border text-muted-foreground hover:border-white/20 hover:text-foreground"
                    }`}
                >
                  <span className="font-medium">{label.top}</span>
                  <span
                    className={`mt-0.5 text-[10px] ${active ? "text-amber-500/70" : "text-muted-foreground/70"
                      }`}
                  >
                    {label.bottom}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="h-px bg-muted/50" />

          {/* Time grid */}
          {slots.length === 0 ? (
            <p className="text-xs text-muted-foreground/70 text-center py-4">
              {allBooked
                ? "No open slots remaining — all slots on this date are booked."
                : "No open slots remaining in the availability window for this date."}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => {
                const isSelected =
                  selectedSlot?.startTime.getTime() ===
                  slot.startTime.getTime();

                return (
                  <button
                    key={slot.startTime.toISOString()}
                    type="button"
                    disabled={slot.isBooked}
                    onClick={() => handleSlotClick(slot)}
                    className={`relative text-xs px-2 py-2.5 rounded-xl border transition-all duration-200 ${isSelected
                      ? "border-amber-400/60 bg-amber-400/15 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.08)]"
                      : slot.isBooked
                        ? "border-border/50 bg-muted/20 text-muted-foreground/50 cursor-not-allowed"
                        : "border-border text-muted-foreground hover:border-amber-400/30 hover:text-amber-400 hover:bg-amber-400/5 cursor-pointer"
                      }`}
                  >
                    {formatTime(slot.startTime)}
                    {slot.isBooked && (
                      <span
                        className="absolute inset-x-0 bottom-0.5 text-center text-muted-foreground/50 leading-none"
                        style={{ fontSize: "9px" }}
                      >
                        booked
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Inline confirm card ── */}
        {selectedSlot && (
          <div
            ref={summaryRef}
            className="bg-card border border-amber-400/20 rounded-2xl p-6 flex flex-col gap-4"
          >
            <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">
              Your booking
            </p>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground">
                  {formatDateFull(selectedSlot.startTime)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Time</span>
                <span className="text-foreground">
                  {formatTime(selectedSlot.startTime)} –{" "}
                  {formatTime(selectedSlot.endTime)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Duration</span>
                <span className="text-foreground">
                  {SLOT_DURATION_MINUTES} minutes
                </span>
              </div>
            </div>

            <Separator className="bg-muted/80" />

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Credits charged</span>
              <span className="font-serif text-lg bg-linear-to-br from-amber-500 to-amber-700 dark:from-amber-300 dark:to-amber-500 bg-clip-text text-transparent leading-none">
                −{interviewerCredits}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground/70">Balance after</span>
              <span className="text-muted-foreground">
                {userCredits - interviewerCredits} credits
              </span>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/20 px-3.5 py-3">
              <span className="text-sm shrink-0">🎥</span>
              <p className="text-xs text-muted-foreground font-light leading-relaxed">
                A video call room will be created and added to your
                appointments. You&apos;ll be redirected to My Appointments after
                confirming.
              </p>
            </div>

            {error && (
              <p className="text-xs text-red-400">{error?.message || error}</p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={loading}
                onClick={() => setSelectedSlot(null)}
              >
                Change slot
              </Button>
              <Button
                variant="gold"
                size="sm"
                className="flex-1"
                disabled={loading}
                onClick={handleConfirm}
              >
                {loading ? "Creating call…" : "Confirm →"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
