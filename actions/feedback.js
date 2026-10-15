"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { generateFeedbackForBooking } from "@/lib/feedback";

// Generates the AI feedback report on demand after an interview call. Used as a
// manual fallback when the Stream webhook hasn't fired (e.g. local dev). Anyone
// in the call can trigger it; it's a no-op if a report already exists.
export const generateFeedbackReport = async ({ bookingId }) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
  if (!dbUser) throw new Error("User not found");

  if (!bookingId) throw new Error("Booking required");

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      interviewer: {
        select: { id: true, clerkUserId: true, name: true, categories: true },
      },
      interviewee: {
        select: { id: true, clerkUserId: true, name: true },
      },
      feedback: { select: { id: true } },
    },
  });
  if (!booking) throw new Error("Booking not found");

  const isInterviewer = booking.interviewer.clerkUserId === user.id;
  const isInterviewee = booking.interviewee.clerkUserId === user.id;
  if (!isInterviewer && !isInterviewee) throw new Error("Forbidden");

  await generateFeedbackForBooking(booking);

  revalidatePath("/dashboard");
  revalidatePath("/appointments");
  return { success: true };
};

// Interviewer rates the candidate after a completed session. The rating is
// stored on the Feedback row (sessionRating / sessionComment) and rendered
// alongside the AI report. Upserts so it works even before the AI report lands.
export const submitSessionRating = async ({ bookingId, rating, comment }) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
  if (!dbUser || dbUser.role !== "INTERVIEWER") throw new Error("Forbidden");

  if (!bookingId) throw new Error("Booking required");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    throw new Error("Rating must be between 1 and 5");

  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found");
  if (booking.interviewerId !== dbUser.id) throw new Error("Forbidden");
  if (booking.status !== "COMPLETED")
    throw new Error("Sessions must be completed before rating");

  const cleanComment =
    typeof comment === "string" ? comment.trim().slice(0, 1000) : "";

  await db.feedback.upsert({
    where: { bookingId },
    create: { bookingId, sessionRating: rating, sessionComment: cleanComment },
    update: { sessionRating: rating, sessionComment: cleanComment },
  });

  revalidatePath("/dashboard");
  return { success: true };
};
