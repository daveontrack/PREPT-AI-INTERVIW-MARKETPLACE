"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { createStreamClient } from "@/lib/stream";
import { revalidatePath } from "next/cache";
import { request } from "@arcjet/next";
import { createRateLimiter, checkRateLimit } from "@/lib/arcjet";
import { getDailyWindowBounds } from "@/lib/helpers";
import { sendBookingConfirmations } from "@/lib/bookingNotify";

// 5 booking attempts per hour — generous enough for real users,
// tight enough to block automated abuse
const bookingLimiter = createRateLimiter({
  refillRate: 2,
  interval: "1h",
  capacity: 5,
});

// Logs a booking failure server-side (Vercel function logs) with a correlation
// id so the client digest can be matched back. Never logs request bodies or
// secrets — only the error type and stack.
function logBookingError(stage, traceId, err) {
  console.error(`[bookSlot] ${stage} failed (traceId=${traceId})`, {
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
}

function ok(result) {
  return { success: true, ...result };
}

function fail(error) {
  return { success: false, error };
}

export const getInterviewerProfile = async (interviewerId) => {
  try {
    const interviewer = await db.user.findUnique({
      where: { id: interviewerId, role: "INTERVIEWER" },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        title: true,
        company: true,
        yearsExp: true,
        bio: true,
        categories: true,
        creditRate: true,
        availabilities: {
          where: { isActive: true },
          select: { startTime: true, endTime: true, timezone: true, isActive: true },
          take: 1,
        },
        bookingsAsInterviewer: {
          where: { status: "SCHEDULED" },
          select: { startTime: true, endTime: true },
        },
      },
    });

    return interviewer ?? null;
  } catch (err) {
    console.error("getInterviewerProfile error:", err);
    throw new Error("Failed to fetch interviewer profile");
  }
};

export const bookSlot = async ({ interviewerId, startTime, endTime }) => {
  const traceId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const user = await currentUser();
  if (!user) return fail("Unauthorized. Please sign in and try again.");

  // ── Arcjet rate limit ──────────────────────────────────────────────────────
  try {
    const req = await request();
    const rateLimitError = await checkRateLimit(bookingLimiter, req, user.id);
    if (rateLimitError) return fail(rateLimitError);
  } catch (err) {
    // If Arcjet rate limiting fails (e.g. request context unavailable in
    // server actions), log and continue rather than blocking the booking.
    console.warn("[bookSlot] Arcjet rate limit check skipped:", err.message);
  }
  // ──────────────────────────────────────────────────────────────────────────

  const [dbUser, interviewer] = await Promise.all([
    db.user.findUnique({ where: { clerkUserId: user.id } }),
    db.user.findUnique({ where: { id: interviewerId } }),
  ]);

  if (!dbUser || dbUser.role !== "INTERVIEWEE")
    return fail("Only interviewees can book sessions");
  if (!interviewer || interviewer.role !== "INTERVIEWER")
    return fail("Interviewer not found");

  const credits = interviewer.creditRate ?? 1;

  if (dbUser.credits < credits)
    return fail("Insufficient credits. Please upgrade your plan.");

  const start = new Date(startTime);
  const end = new Date(endTime);

  // Verify the requested time falls inside the interviewer's active daily
  // window. The window is stored as wall-clock hours anchored to the
  // interviewer's IANA timezone, so the same conversion is used here and in
  // the client slot picker — this stays correct on Vercel (UTC lambdas)
  // instead of silently drifting by the runtime's local timezone.
  const availability = await db.availability.findFirst({
    where: { interviewerId, isActive: true },
  });

  if (!availability) {
    return fail("Interviewer is currently unavailable");
  }

  const bounds = getDailyWindowBounds(
    start,
    availability.startTime,
    availability.endTime,
    availability.timezone
  );
  if (!bounds) return fail("Interviewer has no valid availability window");
  const [winStart, winEnd] = bounds;

  if (start < winStart || end > winEnd) {
    return fail(
      "Selected time is outside the interviewer's availability window"
    );
  }

  // ── Create Stream call ────────────────────────────────────────────────────
  // Room is created BEFORE the transaction so credits are never deducted when
  // the (more fragile) external API call fails. If the transaction then fails,
  // the orphaned room is ended best-effort below.
  // Create the Stream video call
  let streamClient;
  let streamCallId;
  try {
    streamClient = createStreamClient({ timeout: 30_000 });

    await streamClient.upsertUsers([
      {
        id: dbUser.clerkUserId,
        name: dbUser.name ?? "Interviewee",
        image: dbUser.imageUrl ?? undefined,
        role: "user",
      },
      {
        id: interviewer.clerkUserId,
        name: interviewer.name ?? "Interviewer",
        image: interviewer.imageUrl ?? undefined,
        role: "user",
      },
    ]);

    streamCallId = `mock_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 7)}`;

    const call = streamClient.video.call("default", streamCallId);

    await call.getOrCreate({
      data: {
        created_by_id: dbUser.clerkUserId,
        members: [
          { user_id: dbUser.clerkUserId, role: "host" },
          { user_id: interviewer.clerkUserId, role: "host" },
        ],
        settings_override: {
          recording: { mode: "available", quality: "1080p" },
          screensharing: {
            enabled: true,
          },
          transcription: {
            mode: "auto-on", // starts when first user joins, stops when all leave
          },
        },
      },
    });
  } catch (err) {
    logBookingError("stream_call_creation", traceId, err);
    return fail("Failed to create video call. Please try again.");
  }
  //Prepare for slot conflicts
  // Sentinel used to abort the transaction with a user-friendly message when
  // the slot was taken between the pre-check and the insert.
  const SLOT_TAKEN = Object.assign(new Error("Slot taken"), {
    code: "SLOT_TAKEN",
  });
  // Database transaction
  try {
    const booking = await db.$transaction(async (tx) => {
      // Re-check for conflicts inside the transaction so a concurrent booking
      // of the same slot rolls the whole operation back — credits are never
      // deducted for a slot that ended up taken.
      const conflict = await tx.booking.findFirst({
        where: {
          interviewerId,
          status: "SCHEDULED",
          startTime: { lt: end },
          endTime: { gt: start },
        },
      });
      if (conflict) throw SLOT_TAKEN;

      const newBooking = await tx.booking.create({
        data: {
          intervieweeId: dbUser.id,
          interviewerId,
          startTime: start,
          endTime: end,
          status: "SCHEDULED",
          creditsCharged: credits,
          streamCallId,
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: dbUser.id,
          amount: -credits,
          type: "BOOKING_DEDUCTION",
          bookingId: newBooking.id,
        },
      });

      await tx.user.update({
        where: { id: dbUser.id },
        data: { credits: { decrement: credits } },
      });
      await tx.user.update({
        where: { id: interviewerId },
        data: { creditBalance: { increment: credits } },
      });

      return newBooking;
    });

    revalidatePath(`/interviewers/${interviewerId}`);
    revalidatePath("/dashboard");
    revalidatePath("/appointments");

    // ── Confirmation email + in-app notifications ────────────────────────
    // The interviewer is emailed the moment an interviewee books their slot
    // (and the candidate gets their own confirmation). Both get an .ics
    // calendar invite. Non-blocking: a failed email never fails the booking.
    try {
      await sendBookingConfirmations({
        booking,
        interviewee: dbUser,
        interviewer,
      });
    } catch (err) {
      console.warn("[bookSlot] confirmation notify failed:", err.message);
    }

    return ok({ bookingId: booking.id, streamCallId });
  } catch (err) {
    if (err === SLOT_TAKEN) {
      // The user's credits were never touched (transaction rolled back), but
      // the pre-created call room would otherwise linger — end it.
      if (streamClient && streamCallId) {
        try {
          await streamClient.video.call("default", streamCallId).end();
        } catch (cleanupErr) {
          console.warn(
            `[bookSlot] orphaned call cleanup skipped (${streamCallId}):`,
            cleanupErr.message
          );
        }
      }
      return fail("This slot was just booked. Please pick another.");
    }

    logBookingError("transaction", traceId, err);
    if (streamClient && streamCallId) {
      try {
        await streamClient.video.call("default", streamCallId).end();
      } catch (cleanupErr) {
        console.warn(
          `[bookSlot] orphaned call cleanup skipped (${streamCallId}):`,
          cleanupErr.message
        );
      }
    }
    return fail("Booking failed. Please try again.");
  }
};