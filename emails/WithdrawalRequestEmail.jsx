import {
  Html,
  Body,
  Container,
  Text,
  Button,
  Hr,
} from "@react-email/components";

export function WithdrawalRequestEmail({
  interviewerName,
  interviewerEmail,
  credits,
  platformFee,
  netAmount,
  paymentMethod,
  paymentDetail,
  reviewUrl,
}) {
  return (
    <Html>
      <Body
        style={{
          fontFamily: "Georgia, serif",
          padding: "32px 16px",
        }}
      >
        <Container
          style={{
            maxWidth: "480px",
            margin: "0 auto",
          }}
        >
          <Text
            style={{ fontSize: "22px", color: "#111827", margin: "0 0 4px" }}
          >
            MockMate
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
            Withdrawal Request
          </Text>

          <Text
            style={{ fontSize: "14px", color: "#374151", margin: "0 0 4px" }}
          >
            <strong>{interviewerName}</strong> ({interviewerEmail}) has
            requested a withdrawal.
          </Text>

          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />

          {[
            ["Credits", credits],
            ["Platform fee (20%)", `− $${platformFee.toFixed(2)}`],
            ["Net payout", `$${netAmount.toFixed(2)}`],
            ["Method", paymentMethod],
            ["Send to", paymentDetail],
          ].map(([k, v]) => (
            <Text
              key={k}
              style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 8px" }}
            >
              {k}:{" "}
              <span
                style={{
                  color: k === "Net payout" ? "#d97706" : "#111827",
                  fontWeight: k === "Net payout" ? "700" : "400",
                }}
              >
                {v}
              </span>
            </Text>
          ))}

          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />

          <Button
            href={reviewUrl}
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
            Review &amp; Approve →
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
