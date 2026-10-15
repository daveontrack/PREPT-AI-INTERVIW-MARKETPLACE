import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { db } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import Link from "next/link";

const PLAN_LABELS = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
};

// Confirmation page shown after a successful Stripe Checkout. The credit grant
// itself is done by the Stripe webhook — this page only reports the result.
export default async function SuccessPage({ searchParams }) {
  const { session_id: sessionId } = await searchParams;
  if (!sessionId) return redirect("/#pricing");

  const { userId } = await auth();
  if (!userId) return redirect("/sign-in");

  // Never show someone else's checkout confirmation.
  const dbUser = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { stripeCustomerId: true },
  });

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error("success page: could not retrieve session", err);
    return redirect("/#pricing");
  }

  const sessionCustomer = session.customer ? String(session.customer) : null;
  if (
    session.status !== "complete" ||
    !sessionCustomer ||
    sessionCustomer !== dbUser?.stripeCustomerId
  ) {
    return redirect("/#pricing");
  }

  const planLabel = PLAN_LABELS[session.metadata?.plan];
  const email = session.customer_details?.email;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="w-full max-w-xl rounded-3xl border border-amber-400/20 bg-card/60 p-10 text-center backdrop-blur">
        <h1 className="font-serif text-4xl tracking-tight">
          Payment successful
        </h1>
        <p className="mt-4 text-muted-foreground">
          {planLabel
            ? `You're on the ${planLabel} plan now.`
            : "Your subscription is active."}{" "}
          {email && `A receipt is on its way to ${email}.`}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Your credits are applied automatically. Give it a few seconds, then
          refresh if they don&apos;t show up yet.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/appointments"
            className="rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-[#0a0a0b] transition hover:bg-amber-500"
          >
            Book a session
          </Link>
          <Link
            href="/#pricing"
            className="rounded-full border border-border/60 px-6 py-2.5 text-sm font-medium transition hover:border-amber-400/40 hover:text-amber-300"
          >
            Manage plan
          </Link>
        </div>
      </div>
    </main>
  );
}
