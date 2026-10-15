"use server";

// ─── Sign-language recognition actions ───────────────────────────────────────
// Next.js owns authorization + persistence; a separate Python service
// (sign-recognition-service/) owns model inference. The browser receives a
// short-lived, narrowly scoped HMAC token for the recognition WebSocket — the
// Python service validates it with the shared SIGN_SESSION_SECRET and never
// needs database or Clerk credentials.

import crypto from "crypto";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";

const MAX_ENTRY_LENGTH = 1000;
const TOKEN_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours — covers a full session
// Session eligibility window around the scheduled booking.
const OPEN_BEFORE_MS = 45 * 60 * 1000;
const OPEN_AFTER_MS = 90 * 60 * 1000;

// ─── Scoped session tokens (verified by the Python service) ─────────────────

const b64 = (buf) => Buffer.from(buf).toString("base64url");

function signSessionToken({ sessionId, userId }) {
  const secret = process.env.SIGN_SESSION_SECRET;
  if (!secret) throw new Error("Sign recognition is not configured");

  const payload = b64(
    JSON.stringify({
      sid: sessionId,
      uid: userId,
      lang: "EthSL",
      exp: Date.now() + TOKEN_TTL_MS,
    })
  );
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireDbUser() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
  if (!dbUser) throw new Error("User not found");
  return dbUser;
}

async function loadBookingForParticipant(bookingId, dbUser) {
  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found");
  if (
    booking.intervieweeId !== dbUser.id &&
    booking.interviewerId !== dbUser.id
  )
    throw new Error("Forbidden");
  return booking;
}

const serializeEntry = (e) => ({
  id: e.id,
  text: e.text,
  confidence: e.confidence,
  source: e.source,
  edited: e.edited,
  sequenceNumber: e.sequenceNumber,
  confirmedAt: e.confirmedAt?.toISOString?.() ?? e.confirmedAt,
});

// ─── Actions ─────────────────────────────────────────────────────────────────

// Candidate-only: starts (or resumes) the recognition session for a booking
// and returns the scoped WebSocket token. Consent is recorded explicitly —
// the UI gates this call behind a consent prompt.
export const startSignSession = async ({ bookingId, consented }) => {
  const dbUser = await requireDbUser();
  if (!bookingId) throw new Error("Booking required");
  if (consented !== true)
    throw new Error("Consent is required to start sign recognition");

  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found");
  if (booking.intervieweeId !== dbUser.id)
    throw new Error("Only the candidate can start sign recognition");
  if (booking.status === "CANCELLED")
    throw new Error("This session was cancelled");

  const now = Date.now();
  const start = new Date(booking.startTime).getTime();
  if (now < start - OPEN_BEFORE_MS || now > start + OPEN_AFTER_MS)
    throw new Error("Sign recognition opens shortly before the session starts");

  // Reuse the latest open session (resume after disconnect); otherwise create.
  const existing = await db.signRecognitionSession.findFirst({
    where: { bookingId, status: { not: "ENDED" } },
    orderBy: { startedAt: "desc" },
  });

  const session =
    existing ??
    (await db.signRecognitionSession.create({
      data: {
        bookingId,
        candidateId: dbUser.id,
        language: "EthSL",
        // consentAt defaults to now() — that IS the consent record.
      },
    }));

  if (existing && existing.status === "PAUSED") {
    await db.signRecognitionSession.update({
      where: { id: session.id },
      data: { status: "ACTIVE" },
    });
  }

  return {
    sessionId: session.id,
    token: signSessionToken({ sessionId: session.id, userId: dbUser.id }),
    wsUrl: process.env.SIGN_RECOGNITION_WS_URL || "ws://localhost:8000",
    language: session.language,
  };
};

// Persists ONE candidate-confirmed entry. The server assigns the sequence
// number (max + 1 inside the session), so reconnects can never duplicate or
// reorder entries. Only the candidate writes.
export const saveSignEntry = async ({
  sessionId,
  text,
  confidence,
  edited,
  source,
}) => {
  const dbUser = await requireDbUser();
  if (!sessionId) throw new Error("Session required");

  const clean = typeof text === "string" ? text.trim().replace(/\s+/g, " ") : "";
  if (!clean) throw new Error("Entry text is required");
  if (clean.length > MAX_ENTRY_LENGTH)
    throw new Error(`Entries are limited to ${MAX_ENTRY_LENGTH} characters`);

  const session = await db.signRecognitionSession.findUnique({
    where: { id: sessionId },
  });
  if (!session || session.candidateId !== dbUser.id)
    throw new Error("Session not found");
  if (session.status === "ENDED") throw new Error("Session has ended");

  const cleanSource = source === "typed" ? "typed" : "sign_recognition";
  const conf =
    typeof confidence === "number" && Number.isFinite(confidence)
      ? Math.min(1, Math.max(0, confidence))
      : null;

  // sequenceNumber = max(existing) + 1, retrying on the unique-constraint race.
  let entry = null;
  for (let attempt = 0; attempt < 3 && !entry; attempt++) {
    const last = await db.signTranscript.findFirst({
      where: { sessionId },
      orderBy: { sequenceNumber: "desc" },
      select: { sequenceNumber: true },
    });
    const next = (last?.sequenceNumber ?? 0) + 1;
    try {
      entry = await db.signTranscript.create({
        data: {
          sessionId,
          text: clean,
          confidence: conf,
          source: cleanSource,
          edited: edited === true || cleanSource === "typed",
          sequenceNumber: next,
        },
      });
    } catch (err) {
      // Unique(sessionId, sequenceNumber) race with a concurrent save — retry.
      if (err?.code !== "P2002") throw err;
    }
  }
  if (!entry) throw new Error("Could not save the entry, please retry");

  revalidatePath("/appointments");
  return { entry: serializeEntry(entry) };
};

// Candidate pauses/stops recognition for the booking.
export const endSignSession = async ({ sessionId }) => {
  const dbUser = await requireDbUser();
  if (!sessionId) throw new Error("Session required");

  const session = await db.signRecognitionSession.findUnique({
    where: { id: sessionId },
  });
  if (!session || session.candidateId !== dbUser.id)
    throw new Error("Session not found");

  await db.signRecognitionSession.update({
    where: { id: sessionId },
    data: { status: "ENDED", endedAt: new Date() },
  });
  return { success: true };
};

// Both participants can read the confirmed transcript (interviewer sees it
// via polling while the candidate signs). Read-only.
export const getSignTranscript = async ({ bookingId }) => {
  const dbUser = await requireDbUser();
  if (!bookingId) throw new Error("Booking required");
  await loadBookingForParticipant(bookingId, dbUser);

  const sessions = await db.signRecognitionSession.findMany({
    where: { bookingId },
    orderBy: { startedAt: "asc" },
    select: {
      id: true,
      language: true,
      status: true,
      modelVersion: true,
      startedAt: true,
      endedAt: true,
    },
  });

  const entries = await db.signTranscript.findMany({
    where: { session: { bookingId } },
    orderBy: { confirmedAt: "asc" },
  });

  return {
    sessions: sessions.map((s) => ({
      ...s,
      startedAt: s.startedAt.toISOString(),
      endedAt: s.endedAt ? s.endedAt.toISOString() : null,
    })),
    entries: entries.map(serializeEntry),
  };
};
