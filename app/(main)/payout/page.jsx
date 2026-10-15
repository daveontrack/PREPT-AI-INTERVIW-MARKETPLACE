// Assignment

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

// Admin payout index — after login the admin is routed here, which forwards to
// the most recent withdrawal request so they land straight on the review page.
export default async function PayoutIndexPage() {
  const user = await currentUser();

  if (!user) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent("/payout")}`);
  }

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const isAdmin = Boolean(
    adminEmail &&
      user.emailAddresses?.some(
        (e) => e.emailAddress?.toLowerCase() === adminEmail
      )
  );
  if (!isAdmin) notFound();

  const latest = await db.payout.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!latest) notFound();

  redirect(`/payout/${latest.id}`);
}
