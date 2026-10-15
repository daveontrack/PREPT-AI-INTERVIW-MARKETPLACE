// ─── iCalendar (.ics) generation ─────────────────────────────────────────────
// Builds a downloadable calendar invitation for a booked session so candidates
// and interviewers can add it to Google Calendar / Apple Calendar / Outlook.

const icsEscape = (value) =>
  String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

// UTC basic format: 20260324T093000Z
const icsDate = (date) =>
  new Date(date).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

const icsDateTimeLocal = (date) =>
  new Date(date)
    .toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

// `booking` needs: id, startTime, endTime, streamCallId, creditsCharged,
// plus interviewer { name, email, categories } and interviewee { name, email }.
// `actor` is the user downloading the invite (used as the ATTENDEE).
export function buildBookingICS(booking, { actor, joinUrl }) {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const interviewerName = booking.interviewer?.name ?? "Interviewer";
  const intervieweeName = booking.interviewee?.name ?? "Candidate";

  const categories = booking.interviewer?.categories?.join(", ") ?? "";
  const summary = `Mock Interview — ${interviewerName} × ${intervieweeName}`;
  const description = [
    `Your InterviewLoop mock interview${categories ? ` (${categories})` : ""}.`,
    `Starts: ${icsDateTimeLocal(start)}`,
    `Ends: ${icsDateTimeLocal(end)}`,
    joinUrl ? `Join the video call: ${joinUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//InterviewLoop//Mock Interviews//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${booking.id}@interviewloop`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsEscape(summary)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    ...(joinUrl ? [`URL:${icsEscape(joinUrl)}`, `LOCATION:${icsEscape(joinUrl)}`] : []),
    `ORGANIZER;CN=${icsEscape(interviewerName)}:mailto:${booking.interviewer?.email ?? "noreply@interviewloop.app"}`,
    ...(actor?.email
      ? [
        `ATTENDEE;CN=${icsEscape(actor.name ?? "Attendee")};RSVP=TRUE:mailto:${actor.email}`,
      ]
      : []),
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:InterviewLoop session starts in 15 minutes",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  // CRLF per RFC 5545.
  return lines.join("\r\n");
}

// Attachment payload for Resend emails.
export function icsAttachment(booking, opts) {
  return {
    filename: "interviewloop-invite.ics",
    content: Buffer.from(buildBookingICS(booking, opts), "utf8"),
  };
}
