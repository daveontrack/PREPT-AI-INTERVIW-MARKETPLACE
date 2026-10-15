"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

// Shared-code snapshot limits — the editor autosaves the whole document, so a
// generous but bounded cap keeps a misbehaving client from bloating the row.
const MAX_CODE_LENGTH = 200_000;
const LANGUAGE_PATTERN = /^[a-z0-9+#._-]{1,32}$/;

// Both sides of a booking (and only they) may read/write the shared code.
async function assertParticipant(bookingId) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await db.user.findUnique({
    where: { clerkUserId: user.id },
    select: { id: true },
  });
  if (!dbUser) throw new Error("User not found");

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, intervieweeId: true, interviewerId: true },
  });
  if (!booking) throw new Error("Booking not found");
  if (
    booking.intervieweeId !== dbUser.id &&
    booking.interviewerId !== dbUser.id
  )
    throw new Error("Forbidden");

  return booking;
}

// Latest snapshot for the live-interview editor (seeds a fresh room so a
// rejoin restores the work in progress).
export const getSharedCode = async ({ bookingId }) => {
  if (!bookingId) throw new Error("Booking required");
  await assertParticipant(bookingId);

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: { sharedCode: true, sharedLanguage: true },
  });

  return {
    code: booking.sharedCode ?? "",
    language: booking.sharedLanguage ?? "javascript",
  };
};

// Debounced autosave from the editor (and a final flush on leave).
export const saveSharedCode = async ({ bookingId, code, language }) => {
  if (!bookingId) return { success: false, error: "Booking required" };
  await assertParticipant(bookingId);

  if (typeof code !== "string")
    return { success: false, error: "Invalid code payload" };
  if (code.length > MAX_CODE_LENGTH)
    return { success: false, error: "Code document is too large" };

  const lang =
    typeof language === "string" && LANGUAGE_PATTERN.test(language)
      ? language.toLowerCase()
      : "javascript";

  await db.booking.update({
    where: { id: bookingId },
    data: { sharedCode: code, sharedLanguage: lang },
  });

  return { success: true, savedAt: new Date().toISOString() };
};
