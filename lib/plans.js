// Single source of truth for subscription plans.
//
// The pricing table (lib/data.js), the checkout action and the Stripe webhook
// all read credits and price ids from here, so what a user is shown can never
// drift from what Stripe actually charges.

export const PLAN_SLUGS = ["free", "starter", "pro"];

// Monthly credits granted per plan. Paid plans are granted by the Stripe
// webhook on every paid invoice; the free grant happens in lib/checkUser.js.
export const PLAN_CREDITS = {
  free: 1,
  starter: 5,
  pro: 15,
};

// Price ids live in env (never in the repo) so test and live stay separate.
export const PLAN_PRICE_IDS = {
  starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER ?? null,
  pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO ?? null,
};

export const isPaidPlan = (slug) => slug === "starter" || slug === "pro";

// Narrows an untrusted value (Stripe metadata, client input) to a real plan.
export const toPlanSlug = (value) =>
  typeof value === "string" && PLAN_SLUGS.includes(value) ? value : null;

// Resolves the plan a Stripe price id sells. Used to reject any price the
// client sends to the checkout action that isn't one of ours.
export const planForPriceId = (priceId) => {
  if (!priceId) return null;
  return toPlanSlug(
    Object.keys(PLAN_PRICE_IDS).find(
      (slug) => PLAN_PRICE_IDS[slug] === priceId,
    ),
  );
};
