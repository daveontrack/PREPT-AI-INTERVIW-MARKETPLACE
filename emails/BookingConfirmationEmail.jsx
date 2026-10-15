import {
  Html,
  Body,
  Container,
  Text,
  Button,
  Hr,
} from "@react-email/components";
import { formatDateFull, formatTime } from "@/lib/helpers";

// Sent to BOTH parties right after a slot is booked:
//   role "interviewee" → "your interview is confirmed"
//   role "interviewer" → "a candidate booked your slot"
// The .ics calendar invite is attached by the caller.
export function BookingConfirmationEmail({
  recipientName,
  otherPartyName,
  role,
  startTime,
  endTime,
  categories,
  joinUrl,
  appUrl,
}) {
  const isInterviewee = role === "interviewee";

  return (
    <Html>
      <Body style={{ fontFamily: "Georgia, serif", padding: "32px 16px" }}>
        <Container style={{ maxWidth: "480px", margin: "0 auto" }}>
          <Text style={{ fontSize: "22px", color: "#111827", margin: "0 0 4px" }}>
            InterviewLoop
          </Text>
          <Text
            style={{
              fontSize: "11px",
              color: "#6b7280",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              margin: "0 0 32px",
            }}
          >
            {isInterviewee ? "Booking confirmed" : "New booking"}
          </Text>

          <Text style={{ fontSize: "14px", color: "#374151", margin: "0 0 4px" }}>
            Hi {recipientName ?? "there"},
          </Text>
          <Text style={{ fontSize: "14px", color: "#374151", margin: "0 0 4px" }}>
            {isInterviewee ? (
              <>
                Your mock interview with <strong>{otherPartyName}</strong> is
                confirmed.
              </>
            ) : (
              <>
                <strong>{otherPartyName}</strong> has booked a mock interview
                with you.
              </>
            )}
          </Text>

          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />

          {[
            ["When", `${formatDateFull(startTime)}, ${formatTime(startTime)} – ${formatTime(endTime)}`],
            ["Focus", categories?.length ? categories.join(", ") : "General"],
          ].map(([k, v]) => (
            <Text key={k} style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 8px" }}>
              {k}:{" "}
              <span style={{ color: "#111827" }}>{v}</span>
            </Text>
          ))}

          <Text style={{ fontSize: "12px", color: "#6b7280", margin: "16px 0 0" }}>
            A calendar invitation (.ics) is attached — open it to add this
            session to Google Calendar, Apple Calendar or Outlook. A reminder
            will arrive an hour before the session starts.
          </Text>

          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />

          <Button
            href={joinUrl ?? appUrl}
            style={{
              backgroundColor: "#f59e0b",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "700",
              padding: "12px 28px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            {isInterviewee ? "View your session →" : "View your dashboard →"}
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
