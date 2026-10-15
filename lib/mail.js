// ─── Email sending helper ────────────────────────────────────────────────────
// Shared Resend client for transactional emails (booking confirmations,
// reminders, payout requests). Lazy — never constructed at import time, so
// `next build` succeeds without RESEND_API_KEY and sending is skipped+logged
// when the key is missing.

import { Resend } from "resend";

export const EMAIL_FROM = "InterviewLoop <onboarding@resend.dev>";

let resend = null;
export function getResendClient() {
  if (resend) return resend;
  if (!process.env.RESEND_API_KEY) return null;
  resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

// Throws on API error so callers can log per-recipient failures without
// blocking the rest of their flow.
export async function sendEmail({ to, subject, html, attachments }) {
  if (!to) return null;
  const client = getResendClient();
  if (!client) {
    console.warn(`[mail] RESEND_API_KEY not set — skipped email: "${subject}"`);
    return null;
  }
  const { error } = await client.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    html,
    ...(attachments?.length ? { attachments } : {}),
  });
  if (error) throw new Error(`Resend: ${error.message}`);
  return true;
}
