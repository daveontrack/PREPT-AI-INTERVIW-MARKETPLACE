// ─── Pre-session reminders ───────────────────────────────────────────────────
// Finds scheduled sessions starting within the next hour that haven't been
// reminded yet, then emails BOTH parties (with a calendar invite attached) and
// drops an in-app notification on each account.
//
// Trigger paths:
//   • page load — appointments / dashboard pages call this in the background
//     via next/server after(), covering local dev where cron can't run
//   • /api/cron/reminders — hourly sweep in production (see vercel.json)
//
// Idempotency: `Booking.remindedAt` is claimed with updateMany({ remindedAt:
// null }) BEFORE sending, so a page load racing the cron can never double-send.

import { render } from "@react-email/render";
import { db } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";
import { buildAppUrl } from "@/lib/url";
import { icsAttachment } from "@/lib/ics";
import { createNotification } from "@/lib/notifications";
import { InterviewReminderEmail } from "@/emails/InterviewReminderEmail";
import { formatDate, formatTime } from "@/lib/helpers";

const REMIND_LEAD_MS = 60 * 60 * 1000; // 1 hour before start
const SWEEP_LIMIT = 10; // cap per sweep so a backlog can't burst the API

export async function sendUpcomingReminders({ clerkUserId } = {}) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + REMIND_LEAD_MS);

  // Page-load callers scope the sweep to sessions they participate in; the
  // cron endpoint passes nothing and sweeps everything due.
  let participantId = null;
  if (clerkUserId) {
    const u = await db.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });
    if (!u) return { success: true, processed: 0 };
    participantId = u.id;
  }

  const bookings = await db.booking.findMany({
    where: {
      status: "SCHEDULED",
      remindedAt: null,
      startTime: { gt: now, lte: cutoff },
      ...(participantId
        ? {
          OR: [
            { intervieweeId: participantId },
            { interviewerId: participantId },
          ],
        }
        : {}),
    },
    include: {
      interviewer: {
        select: { id: true, name: true, email: true, categories: true },
      },
      interviewee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startTime: "asc" },
    take: SWEEP_LIMIT,
  });

  const appUrl = buildAppUrl();
  let processed = 0;

  for (const booking of bookings) {
    // Claim the reminder slot first (idempotency across concurrent sweeps).
    const claimed = await db.booking.updateMany({
      where: { id: booking.id, remindedAt: null },
      data: { remindedAt: now },
    });
    if (claimed.count === 0) continue;

    const when = `${formatDate(booking.startTime)} at ${formatTime(booking.startTime)}`;
    const joinUrl = booking.streamCallId
      ? buildAppUrl(`/call/${booking.streamCallId}`)
      : appUrl;

    // ── In-app notifications (both parties) ──
    await createNotification({
      userId: booking.interviewee.id,
      type: "SESSION_REMINDER",
      title: "Session starts in ~1 hour",
      body: `Your mock interview with ${booking.interviewer.name ?? "your interviewer"} is on ${when}.`,
      link: "/appointments",
    });
    await createNotification({
      userId: booking.interviewer.id,
      type: "SESSION_REMINDER",
      title: "Session starts in ~1 hour",
      body: `${booking.interviewee.name ?? "A candidate"} booked your slot on ${when}.`,
      link: "/dashboard",
    });

    // ── Emails + calendar invite (both parties) ──
    const recipients = [
      {
        role: "interviewee",
        person: booking.interviewee,
        otherName: booking.interviewer.name ?? "your interviewer",
      },
      {
        role: "interviewer",
        person: booking.interviewer,
        otherName: booking.interviewee.name ?? "your candidate",
      },
    ];

    for (const { role, person, otherName } of recipients) {
      try {
        const html = await render(
          InterviewReminderEmail({
            recipientName: person.name,
            otherPartyName: otherName,
            role,
            startTime: booking.startTime.toISOString(),
            endTime: booking.endTime.toISOString(),
            joinUrl,
            appUrl,
          })
        );
        await sendEmail({
          to: person.email,
          subject: `Starts in 1 hour — your InterviewLoop session with ${otherName}`,
          html,
          attachments: [icsAttachment(booking, { actor: person, joinUrl })],
        });
      } catch (err) {
        console.warn(
          `[reminders] email failed for booking ${booking.id} (${role}):`,
          err.message
        );
      }
    }

    processed++;
  }

  return { success: true, processed };
}
