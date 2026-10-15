/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GrayTitle } from "@/components/reusables";
import { setAvailability } from "@/actions/dashboard";
import useFetch from "@/hooks/use-fetch";
import { Clock, Power } from "lucide-react";
import { formatTimeOfDay } from "@/lib/helpers";

export default function AvailabilitySection({ initial }) {
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // The recurring window is anchored to this IANA timezone so booking slot
  // generation and server-side validation agree — including on Vercel where
  // serverless functions run in UTC.
  const browserTimeZone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  };

  const { data, loading, error, fn: saveFn } = useFetch(setAvailability);

  useEffect(() => {
    if (data?.success === false) {
      setSaveError(data.error || "Failed to save availability");
    } else if (data?.success) {
      setSaveError(null);
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(t);
    }
  }, [data]);

  const hasWindow = startTime && endTime;
  const duration = hasWindow
    ? (() => {
        const [sh, sm] = startTime.split(":").map(Number);
        const [eh, em] = endTime.split(":").map(Number);
        const diff = eh * 60 + em - (sh * 60 + sm);
        if (diff <= 0) return null;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}`.trim() : `${m}m`;
      })()
    : null;

  const isTimeValid = duration !== null;
  const isValid = hasWindow && isTimeValid;

  const handleSave = async () => {
    if (!isValid) return;
    setSaveError(null);
    const result = await saveFn({
      isActive,
      startTime,
      endTime,
      timezone: browserTimeZone(),
    });
    if (result && result.success === false) {
      setSaveError(result.error || "Failed to save availability");
    }
  };

  return (
    <section className="bg-card border border-border rounded-2xl p-8 flex flex-col gap-7">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-lg mb-4">
            <Clock size={18} className="text-amber-400" />
          </span>
          <h2 className="font-serif text-xl tracking-tight">
            <GrayTitle>Daily Availability Window</GrayTitle>
          </h2>
          <p className="text-xs text-muted-foreground font-light mt-1">
            Set one recurring daily window. You&apos;ll automatically be
            considered available every day during these hours — no need to add
            dates.
          </p>
        </div>

        <Badge
          variant="outline"
          className={`shrink-0 ${
            isActive
              ? "border-green-500/20 bg-green-500/10 text-green-400"
              : "border-stone-500/20 bg-stone-500/10 text-muted-foreground"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="h-px bg-muted/50" />

      {/* Status toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-muted/50 border border-border flex items-center justify-center">
            <Power size={15} className="text-muted-foreground" />
          </span>
          <div>
            <Label className="text-foreground text-xs font-semibold uppercase tracking-wider">
              Status
            </Label>
            <p className="text-xs text-muted-foreground/70 font-light mt-0.5">
              Turn bookings on or off without deleting your window.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsActive((prev) => !prev)}
          aria-pressed={isActive}
          className={`relative w-14 h-8 rounded-full transition-colors duration-200 cursor-pointer ${
            isActive
              ? "bg-green-500/80"
              : "bg-stone-700/60"
          }`}
        >
          <span
            className={`absolute top-1 w-6 h-6 rounded-full bg-foreground transition-all duration-200 ${
              isActive ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>

      <div className="h-px bg-muted/50" />

      {/* Time inputs */}
      <div className="flex flex-col gap-3">
        <Label className="text-foreground text-xs font-semibold uppercase tracking-wider">
          Available Time
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground text-xs">Start time</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground text-xs">End time</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="bg-secondary border-border text-foreground"
            />
          </div>
        </div>

        {hasWindow && !isTimeValid && (
          <p className="text-xs text-red-400 mt-1">
            End time must be after start time.
          </p>
        )}
      </div>

      {/* Window duration pill */}
      {duration && isTimeValid && (
        <div className="flex items-center gap-3 bg-amber-400/5 border border-amber-400/20 rounded-xl px-4 py-3">
          <Badge
            variant="outline"
            className="border-amber-400/30 bg-amber-400/10 text-amber-300 shrink-0"
          >
            Window Duration: {duration}
          </Badge>
          <span className="text-xs text-muted-foreground font-light">
            Interviewees can book any day during this recurring window.
          </span>
        </div>
      )}

      {/* Daily Availability Summary Card */}
      <div className="bg-secondary border border-border rounded-xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              isActive ? "bg-green-400" : "bg-stone-600"
            }`}
          />
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-semibold text-foreground">
              Available every day
            </p>
            {hasWindow && isTimeValid ? (
              <p className="text-[11px] text-muted-foreground font-light">
                From{" "}
                <span className="text-amber-400 font-mono font-medium">
                  {formatTimeOfDay(startTime)}
                </span>{" "}
                –{" "}
                <span className="text-amber-400 font-mono font-medium">
                  {formatTimeOfDay(endTime)}
                </span>
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground/70 font-light">
                Set a time window to start accepting bookings.
              </p>
            )}
          </div>
        </div>

        {!isActive && hasWindow && isTimeValid && (
          <Badge
            variant="outline"
            className="shrink-0 border-stone-500/20 bg-stone-500/10 text-muted-foreground"
          >
            Paused
          </Badge>
        )}
      </div>

      {/* Server Error */}
      {(saveError || error) && (
        <p className="text-xs text-red-400">
          {saveError || error?.message || error}
        </p>
      )}

      {/* Save Button */}
      <Button
        variant="gold"
        disabled={!isValid || loading}
        onClick={handleSave}
        className="self-start px-6"
      >
        {loading
          ? "Saving…"
          : saved
          ? "✓ Window Saved"
          : initial
          ? "Update Window"
          : "Set Window"}
      </Button>
    </section>
  );
}
