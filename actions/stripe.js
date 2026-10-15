"use server";

import { currentUser } from "@clerk/nextjs/server";
import { headers } from "next/headers";

import { db } from "@/lib/prisma";
import { isPaidPlan, planForPriceId } from "@/lib/plans";
import { stripe } from "@/lib/stripe";

// Stripe needs absolute URLs; fall back to the configured app URL so the same
// code works behind a proxy where the `origin` header is missing.
const getOrigin = async () =>
  (await headers()).get("origin") ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";
//https://prept-ai-interviw-marketplace.vercel.app/
const requireUser = async () => {
  const user = await currentUser();
  if (!user) throw new Error("Please sign in to continue");
  return user;
};

const getDbUser = async (clerkUserId) =>
  db.user.findUnique({ where: { clerkUserId } });

// One Stripe customer per app user. Reused on every checkout so the
// subscription, future invoices and the billing portal all live under it.
const getOrCreateCustomer = async (user, dbUser) => {
  if (dbUser?.stripeCustomerId) return dbUser.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.emailAddresses?.[0]?.emailAddress,
    metadata: { clerkUserId: user.id },
  });

  await db.user.update({
    where: { clerkUserId: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
};

// ─── CHECKOUT ───────────────────────────────────────────────────────────────
// Pricing button → hosted Stripe Checkout → back to the app. The plan is
// activated and credits granted by the webhook, never by trusting the browser.
export const startCheckout = async (priceId) => {
  const user = await requireUser();

  // Only sell prices we recognise — a client could pass any price id.
  const plan = planForPriceId(priceId);
  if (!isPaidPlan(plan)) throw new Error("Unknown plan");

  const dbUser = await getDbUser(user.id);
  const origin = await getOrigin();

  // Already paying? Switching plans happens in the billing portal, which
  // handles proration and stops the user holding two live subscriptions.
  if (dbUser?.stripeSubscriptionId) {
    return openPortal(dbUser.stripeCustomerId, origin);
  }

  if (dbUser?.currentPlan === plan) {
    throw new Error(`You are already on the ${plan} plan`);
  }

  const customer = await getOrCreateCustomer(user, dbUser);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer,
    client_reference_id: user.id,
    allow_promotion_codes: true,
    // Echoed back on the session and copied onto the subscription, so the
    // webhook knows which user and plan this payment belongs to.
    metadata: { clerkUserId: user.id, plan },
    subscription_data: { metadata: { clerkUserId: user.id, plan } },
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/#pricing`,
  });

  return { url: session.url };
};

// ─── BILLING PORTAL ─────────────────────────────────────────────────────────
// Lets a subscriber switch plans, update their card, download invoices or
// cancel — all hosted by Stripe.
const openPortal = async (customerId, origin) => {
  if (!customerId) throw new Error("No subscription found");

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/#pricing`,
  });

  return { url: portal.url };
};

export const getBillingPortalSession = async () => {
  const user = await requireUser();
  const dbUser = await getDbUser(user.id);

  return openPortal(dbUser?.stripeCustomerId, await getOrigin());
};

// ─── CURRENT PLAN ───────────────────────────────────────────────────────────
// User.currentPlan is the source of truth for plan gating — the Stripe webhook
// is the only thing that upgrades or downgrades it.
export const getMyPlan = async () => {
  const user = await currentUser();
  if (!user) return null;

  const dbUser = await getDbUser(user.id);
  return dbUser?.currentPlan ?? "free";
};
