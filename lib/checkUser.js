import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";
import { PLAN_CREDITS } from "./plans";

const PLAN_VALUE = PLAN_CREDITS.free;

// Paid-plan credits are granted by the Stripe webhook on every paid invoice
// (see app/api/webhooks/stripe/route.js). This helper only tops up the free
// plan's monthly credit, so a paying user is never granted twice.
const shouldAllocateFreeCredits = (dbUser, now) => {
  if (dbUser.currentPlan !== "free") return false;
  if (!dbUser.creditsLastAllocatedAt) return true;

  // Allocate if it's a new calendar month since the last free allocation
  const last = new Date(dbUser.creditsLastAllocatedAt);
  return (
    now.getFullYear() > last.getFullYear() || now.getMonth() > last.getMonth()
  );
};

export const checkUser = async () => {
  const user = await currentUser();
  if (!user) return null;

  try {
    const loggedInUser = await db.user.findUnique({
      where: { clerkUserId: user.id },
    });

    if (loggedInUser) {
      // Interviewers don't have a credit subscription — skip allocation
      if (loggedInUser.role === "INTERVIEWER") return loggedInUser;

      const now = new Date();
      if (shouldAllocateFreeCredits(loggedInUser, now)) {
        return await db.user.update({
          where: { clerkUserId: user.id },
          data: {
            credits: { increment: PLAN_VALUE },
            creditsLastAllocatedAt: now,
          },
        });
      }

      return loggedInUser;
    }

    // New user — start on the free plan with its first credit
    return await db.user.create({
      data: {
        clerkUserId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
        credits: PLAN_VALUE,
        currentPlan: "free",
        creditsLastAllocatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("checkUser error:", error.message);
    return null;
  }
};
