// ─── Booking confirmations ───────────────────────────────────────────────────
// Fired right after bookSlot succeeds: the INTERVIEWER is emailed the moment a
// candidate books their slot, the candidate gets their confirmation, and both
// receive an in-app notification + an .ics calendar invite attachment.

import { render } from "@react-email/render";
import { sendEmail } from "@/lib/mail";
import { buildAppUrl } from "@/lib/url";
import { icsAttachment } from "@/lib/ics";
import { createNotification } from "@/lib/notifications";
import { BookingConfirmationEmail } from "@/emails/BookingConfirmationEmail";

export async function sendBookingConfirmations({
  booking,
  interviewee,
  interviewer,
}) {
  const joinUrl = booking.streamCallId
    ? buildAppUrl(`/call/${booking.streamCallId}`)
    : buildAppUrl();
  const appUrl = buildAppUrl();

  // The booking row created inside the transaction has no relations loaded —
  // attach them so the .ics invite shows real names/email (organizer/attendee).
  const icsBooking = {
    ...booking,
    interviewer: {
      name: interviewer.name,
      email: interviewer.email,
      categories: interviewer.categories,
    },
    interviewee: { name: interviewee.name, email: interviewee.email },
  };

  // ── In-app notifications ──
  await createNotification({
    userId: interviewee.id,
    type: "BOOKING_CONFIRMED",
    title: "Session booked",
    body: `Your mock interview with ${interviewer.name ?? "your interviewer"} is confirmed.`,
    link: "/appointments",
  });
  await createNotification({
    userId: interviewer.id,
    type: "BOOKING_RECEIVED",
    title: "New session booked",
    body: `${interviewee.name ?? "A candidate"} booked a session with you.`,
    link: "/dashboard",
  });

  // ── Confirmation emails with calendar invite ──
  const recipients = [
    {
      role: "interviewee",
      person: interviewee,
      otherName: interviewer.name ?? "your interviewer",
      subject: `Interview confirmed — session with ${interviewer.name ?? "your interviewer"}`,
    },
    {
      role: "interviewer",
      person: interviewer,
      otherName: interviewee.name ?? "a candidate",
      subject: `New booking — ${interviewee.name ?? "a candidate"} booked your slot`,
    },
  ];

  for (const { role, person, otherName, subject } of recipients) {
    try {
      const html = await render(
        BookingConfirmationEmail({
          recipientName: person.name,
          otherPartyName: otherName,
          role,
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          categories: interviewer.categories,
          joinUrl,
          appUrl,
        })
      );
      await sendEmail({
        to: person.email,
        subject,
        html,
        attachments: [icsAttachment(icsBooking, { actor: person, joinUrl })],
      });
    } catch (err) {
      console.warn(`[booking] confirmation email failed (${role}):`, err.message);
    }
  }
}
