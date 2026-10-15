// Assignment

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const approvePayout = async ({ payoutId, adminPassword }) => {
  if (!adminPassword) throw new Error("Password required");

  if (adminPassword !== process.env.ADMIN_PAYOUT_PASSWORD) {
    throw new Error("Incorrect password");
  }

  const payout = await db.payout.findUnique({ where: { id: payoutId } });

  if (!payout) throw new Error("Payout not found");
  if (payout.status === "PROCESSED") throw new Error("Already processed");

  await db.payout.update({
    where: { id: payoutId },
    data: {
      status: "PROCESSED",
      processedAt: new Date(),
      processedBy: "admin",
    },
  });

  revalidatePath(`/payout/${payoutId}`);
  revalidatePath("/dashboard");

  return { success: true };
};
