import {
  Html,
  Body,
  Container,
  Text,
  Button,
  Hr,
} from "@react-email/components";
import { formatDateFull, formatTime } from "@/lib/helpers";

// Sent ~1 hour before a scheduled session to BOTH parties.
export function InterviewReminderEmail({
  recipientName,
  otherPartyName,
  role,
  startTime,
  endTime,
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
            Starting soon
          </Text>

          <Text style={{ fontSize: "14px", color: "#374151", margin: "0 0 4px" }}>
            Hi {recipientName ?? "there"},
          </Text>
          <Text style={{ fontSize: "15px", color: "#111827", margin: "8px 0 4px" }}>
            Your mock interview{isInterviewee ? " with" : " with"}{" "}
            <strong>{otherPartyName}</strong> starts in about an hour.
          </Text>

          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />

          <Text style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 8px" }}>
            When:{" "}
            <span style={{ color: "#111827" }}>
              {formatDateFull(startTime)}, {formatTime(startTime)} –{" "}
              {formatTime(endTime)}
            </span>
          </Text>

          <Text style={{ fontSize: "12px", color: "#6b7280", margin: "16px 0 0" }}>
            Tip: test your camera and mic a few minutes early. The call link
            below opens the interview room.
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
            Join the session →
          </Button>

          <Text style={{ fontSize: "12px", color: "#9ca3af", margin: "24px 0 0" }}>
            Manage your bookings: {appUrl}/appointments
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
