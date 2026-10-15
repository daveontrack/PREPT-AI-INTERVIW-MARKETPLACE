/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GrayTitle } from "@/components/reusables";
import { approvePayout } from "@/actions/payout";
import useFetch from "@/hooks/use-fetch";

export default function PayoutReviewClient({ payout }) {
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(payout.status === "PROCESSED");

  const { data, loading, error, fn: approveFn } = useFetch(approvePayout);

  useEffect(() => {
    if (data?.success) setDone(true);
  }, [data]);

  if (done) {
    return (
      <div className="bg-card border border-border rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
        <span className="text-3xl">✅</span>
        <p className="font-serif text-xl">
          <GrayTitle>Withdrawal approved</GrayTitle>
        </p>
        <p className="text-xs text-muted-foreground font-light">
          {payout.interviewerName} · ${payout.netAmount.toFixed(2)} via{" "}
          {payout.paymentMethod}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-8 flex flex-col gap-5">
      {/* Payout summary */}
      <div className="rounded-xl bg-secondary border border-border p-4 flex flex-col gap-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Interviewer</span>
          <span className="text-foreground">{payout.interviewerName}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Email</span>
          <span className="text-foreground">{payout.interviewerEmail}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Credits</span>
          <span className="text-foreground">{payout.credits}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Platform fee (20%)</span>
          <span className="text-red-400">
            − ${payout.platformFee.toFixed(2)}
          </span>
        </div>
        <Separator className="bg-muted/80 my-1" />
        <div className="flex justify-between text-sm font-medium">
          <span className="text-foreground">Pay out</span>
          <span className="font-serif text-lg bg-linear-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent leading-none">
            ${payout.netAmount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-xs pt-1">
          <span className="text-muted-foreground">Send to</span>
          <span className="text-foreground">
            {payout.paymentMethod} · {payout.paymentDetail}
          </span>
        </div>
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2">
        <Label className="text-muted-foreground text-xs">Admin password</Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            password.trim() &&
            approveFn({ payoutId: payout.id, adminPassword: password })
          }
          placeholder="Enter password…"
          className="bg-secondary border-border text-foreground"
        />
      </div>

      {error && (
        <p className="text-xs text-red-400">{error?.message || error}</p>
      )}

      <Button
        variant="gold"
        disabled={!password.trim() || loading}
        onClick={() =>
          approveFn({ payoutId: payout.id, adminPassword: password })
        }
        className="w-full"
      >
        {loading ? "Approving…" : `Approve $${payout.netAmount.toFixed(2)} →`}
      </Button>
    </div>
  );
}
