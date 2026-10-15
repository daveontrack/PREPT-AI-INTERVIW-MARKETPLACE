// Assignment

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import PayoutReviewClient from "./_components/PayoutReviewClient";
import { GoldTitle, GrayTitle, SectionLabel } from "@/components/reusables";

// Admin-only review page — the withdrawal request email is sent to ADMIN_EMAIL
// with the review link, so only that account may open it. Anyone else gets a
// 404 (no hint that the payout exists). Signed-out admins are sent to sign-in
// first (with the payout URL preserved), since a raw 404 gives no way in.
export default async function PayoutReviewPage({ params }) {
  const { id } = await params;

  const user = await currentUser();

  if (!user) {
    const next = encodeURIComponent(`/payout/${id}`);
    redirect(`/sign-in?redirect_url=${next}`);
  }

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const isAdmin = Boolean(
    adminEmail &&
      user.emailAddresses?.some(
        (e) => e.emailAddress?.toLowerCase() === adminEmail
      )
  );
  if (!isAdmin) notFound();

  const payout = await db.payout.findUnique({
    where: { id },
    include: {
      interviewer: { select: { name: true, email: true } },
    },
  });

  if (!payout) notFound();

  return (
    <main className="min-h-screen bg-background text-foreground antialiased px-6 flex items-center justify-center">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <SectionLabel>Admin</SectionLabel>
          <h1 className="font-serif text-4xl tracking-tighter mt-1">
            <GrayTitle>Review </GrayTitle>
            <GoldTitle>Withdrawal</GoldTitle>
          </h1>
        </div>

        <PayoutReviewClient
          payout={{
            id: payout.id,
            credits: payout.credits,
            netAmount: payout.netAmount,
            platformFee: payout.platformFee,
            paymentMethod: payout.paymentMethod,
            paymentDetail: payout.paymentDetail,
            status: payout.status,
            interviewerName: payout.interviewer.name,
            interviewerEmail: payout.interviewer.email,
          }}
        />
      </div>
    </main>
  );
}
