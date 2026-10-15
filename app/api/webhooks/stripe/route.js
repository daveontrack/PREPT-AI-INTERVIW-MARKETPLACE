import { NextResponse } from "next/server";

import { db } from "@/lib/prisma";
import { PLAN_CREDITS, isPaidPlan, planForPriceId } from "@/lib/plans";
import { stripe } from "@/lib/stripe";

// Stripe retries webhooks until it gets a 2xx, and events can arrive out of
// order, so every handler here must be safe to run more than once.
const findUser = async ({ clerkUserId, customerId }) => {
  if (clerkUserId) {
    const user = await db.user.findUnique({ where: { clerkUserId } });
    if (user) return user;
  }
  if (customerId) {
    return db.user.findUnique({ where: { stripeCustomerId: customerId } });
  }
  return null;
};

// The price on the subscription is the source of truth for which plan the user
// is on — more reliable than metadata, which a dashboard edit can change.
const resolvePlan = async (subscriptionId) => {
  if (!subscriptionId) return { plan: null, subscription: null };

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items?.data?.[0]?.price?.id;

  return { plan: planForPriceId(priceId), subscription };
};

// Grants the plan's monthly credits and records the invoice that paid for them.
// The unique stripeInvoiceId makes a duplicate event a no-op.
// Checks stripeInvoiceId before adding credits. 
// If Stripe sends the same webhook twice, the duplicate is 
// ignored (if (alreadyGranted) return;).

//step 1The Problem it solves: "The Duplicate Webhook" in grantPlanCredits

const grantPlanCredits = async (user, plan, invoiceId, periodStart) => {
  const alreadyGranted = await db.creditTransaction.findUnique({
    where: { stripeInvoiceId: invoiceId },
    select: { id: true },
  });
  if (alreadyGranted) return;

  const credits = PLAN_CREDITS[plan];
  //Step 2: If it's the first time, add credits and save the receipt (Lines 47-64)

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: {
        currentPlan: plan,
        credits: { increment: credits },
        creditsLastAllocatedAt: new Date(periodStart * 1000),
      },
    }),
    db.creditTransaction.create({
      data: {
        userId: user.id,
        amount: credits,
        type: "CREDIT_PURCHASE",
        stripeInvoiceId: invoiceId,
      },
    }),
  ]);
};

// Checkout finished: link the Stripe ids to the account and activate the plan.
// Credits come from the `invoice.paid` that Stripe emits right after this.
const onCheckoutCompleted = async (session) => {
  if (session.mode !== "subscription") return;

  const customerId = session.customer ? String(session.customer) : null;
  const user = await findUser({
    clerkUserId: session.metadata?.clerkUserId ?? session.client_reference_id,
    customerId,
  });
  if (!user) return;

  const { plan, subscription } = await resolvePlan(
    session.subscription ? String(session.subscription) : null,
  );

  await db.user.update({
    where: { id: user.id },
    data: {
      ...(customerId ? { stripeCustomerId: customerId } : {}),
      ...(subscription ? { stripeSubscriptionId: subscription.id } : {}),
      ...(isPaidPlan(plan) ? { currentPlan: plan } : {}),
    },
  });
};

// A subscription invoice was paid: the initial checkout payment plus every
// monthly renewal. This is where credits actually land.
const onInvoicePaid = async (invoice) => {
  const subscriptionId = invoice.parent?.subscription_details?.subscription
    ? String(invoice.parent.subscription_details.subscription)
    : null;
  if (!subscriptionId) return;

  const { plan } = await resolvePlan(subscriptionId);
  if (!isPaidPlan(plan)) return;

  const user = await findUser({
    clerkUserId: null,
    customerId: invoice.customer ? String(invoice.customer) : null,
  });
  if (!user) return;

  await grantPlanCredits(user, plan, invoice.id, invoice.period_start);
};

// Plan switched (upgrade/downgrade via the billing portal), or the subscription
// was paused/resumed. Keep currentPlan in sync without touching credits.
const onSubscriptionUpdated = async (subscription) => {
  const { plan } = await resolvePlan(subscription.id);
  if (!isPaidPlan(plan)) return;

  const user = await findUser({
    clerkUserId: subscription.metadata?.clerkUserId,
    customerId: String(subscription.customer),
  });
  if (!user || user.currentPlan === plan) return;

  await db.user.update({
    where: { id: user.id },
    data: { currentPlan: plan },
  });
};

// Subscription cancelled: drop back to the free plan. Credits already granted
// stay on the account so the user keeps what they paid for.
const onSubscriptionDeleted = async (subscription) => {
  const user = await findUser({
    clerkUserId: subscription.metadata?.clerkUserId,
    customerId: String(subscription.customer),
  });
  if (!user || (user.currentPlan === "free" && !user.stripeSubscriptionId)) {
    return;
  }

  await db.user.update({
    where: { id: user.id },
    data: { currentPlan: "free", stripeSubscriptionId: null },
  });
};

const HANDLERS = {
  "checkout.session.completed": onCheckoutCompleted,
  "invoice.paid": onInvoicePaid,
  "customer.subscription.updated": onSubscriptionUpdated,
  "customer.subscription.deleted": onSubscriptionDeleted,
};

export async function POST(req) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured" },
      { status: 500 },
    );
  }

  // The raw body is required — the parsed one will not verify.
  const payload = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 },
    );
  }

  const handler = HANDLERS[event.type];
  if (!handler) return NextResponse.json({ received: true });

  try {
    await handler(event.data.object);
  } catch (err) {
    // Rethrow as a 500 so Stripe retries — a failed grant must not be lost.
    console.error(`stripe webhook ${event.type} failed:`, err);
    return NextResponse.json(
      { error: `Failed to handle ${event.type}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
