"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/data";
import useMyPlan from "@/hooks/use-plan";
import useFetch from "@/hooks/use-fetch";
import {
  getBillingPortalSession,
  startCheckout,
} from "@/actions/stripe";

export default function PricingSection() {
  const { userId } = useAuth();
  const { plan: activePlan, loading: loadingPlan } = useMyPlan();
  const { fn: checkout, loading: checkingOut } = useFetch(startCheckout);
  const { fn: openPortal, loading: openingPortal } = useFetch(
    getBillingPortalSession,
  );

  const isSignedIn = !!userId;
  const isSubscribed = isSignedIn && !!activePlan && activePlan !== "free";

  // Stripe hosts the checkout page, so all we do is create the session and
  // send the browser to the URL it returns.
  const handleCheckout = async (priceId) => {
    if (!priceId) return;
    const { url } = await checkout(priceId);
    if (url) window.location.assign(url);
  };

  const handlePortal = async () => {
    const { url } = await openPortal();
    if (url) window.location.assign(url);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {PLANS.map((plan) => {
        const isActive = isSignedIn && activePlan === plan.slug;
        const busy = loadingPlan || checkingOut || openingPortal;

        return (
          <div
            key={plan.name}
            className={`relative rounded-2xl p-10 h-full flex flex-col transition-all duration-300 hover:-translate-y-1 ${
              plan.featured
                ? "bg-secondary border border-amber-400/20"
                : "bg-card border border-border hover:border-amber-400/10"
            } ${isActive ? "ring-1 ring-amber-400/30" : ""}`}
          >
            {/* Most Popular badge */}
            {plan.featured && !isActive && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-[#0a0a0b] text-xs font-bold tracking-wide uppercase px-3.5 py-1 rounded-full whitespace-nowrap">
                Most Popular
              </span>
            )}

            <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-5">
              {plan.name}
            </p>

            <div className="flex items-end gap-1 mb-1.5">
              <span
                className={`font-serif text-5xl leading-none tracking-tight ${
                  plan.featured
                    ? "bg-linear-to-br from-amber-500 to-amber-700 dark:from-amber-300 dark:to-amber-500 bg-clip-text text-transparent"
                    : "bg-linear-to-br from-stone-700 to-stone-500 dark:from-stone-100 dark:to-stone-400 bg-clip-text text-transparent"
                }`}
              >
                {plan.price}
              </span>
              <span className="text-sm text-muted-foreground font-light mb-1.5">
                /month
              </span>
            </div>

            <p className="text-sm text-amber-400 mb-7">{plan.credits}</p>

            <div className="h-px bg-accent mb-7" />

            <ul className="space-y-3 mb-9 flex-1">
              {plan.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
                  <span className="text-amber-400 text-xs mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            {isActive ? (
              // Already paying for this plan
              <Button
                variant={plan.featured ? "gold" : "default"}
                disabled
                className="w-full opacity-50 cursor-not-allowed"
              >
                ✓ Current plan
              </Button>
            ) : plan.slug === "free" ? (
              // Free plan — nothing to pay for
              isSignedIn ? (
                <Button
                  variant="outline"
                  disabled
                  className="w-full opacity-50 cursor-not-allowed"
                >
                  Default plan
                </Button>
              ) : (
                <SignInButton mode="modal">
                  <Button variant="outline" className="w-full">
                    Get started free
                  </Button>
                </SignInButton>
              )
            ) : isSignedIn ? (
              <>
                <Button
                  variant={plan.featured ? "gold" : "outline"}
                  className="w-full"
                  disabled={busy || !plan.priceId}
                  onClick={() => handleCheckout(plan.priceId)}
                >
                  {checkingOut
                    ? "Redirecting…"
                    : isSubscribed
                    ? `Switch to ${plan.name} →`
                    : "Get started →"}
                </Button>

                {/* Price id missing — Stripe has no price to charge */}
                {!plan.priceId && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Temporarily unavailable
                  </p>
                )}

                {/* Subscribers manage or cancel in Stripe's billing portal */}
                {isSubscribed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-muted-foreground"
                    disabled={busy}
                    onClick={handlePortal}
                  >
                    {openingPortal ? "Opening…" : "Manage billing / cancel"}
                  </Button>
                )}
              </>
            ) : (
              // Paid plan, signed out → sign in first
              <SignInButton mode="modal">
                <Button
                  variant={plan.featured ? "gold" : "outline"}
                  className="w-full"
                >
                  Get started →
                </Button>
              </SignInButton>
            )}
          </div>
        );
      })}
    </div>
  );
}
