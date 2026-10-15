// ─── In-app notifications ────────────────────────────────────────────────────
// Server-only helper (not a "use server" action) — callers decide which users
// get notified. Failures never break the calling flow (booking, feedback, …).

import { db } from "@/lib/prisma";

export async function createNotification({ userId, type, title, body, link }) {
  if (!userId || !type || !title) return null;
  try {
    return await db.notification.create({
      data: {
        userId,
        type,
        title,
        body: body ?? null,
        link: link ?? null,
      },
    });
  } catch (err) {
    console.warn("[notification] create failed:", err.message);
    return null;
  }
}
