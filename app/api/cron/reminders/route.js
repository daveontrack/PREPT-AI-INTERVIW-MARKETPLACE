// Hourly reminder sweep for scheduled sessions (see lib/reminders.js).
// Protected by CRON_SECRET — Vercel Cron sends it as `Authorization: Bearer
// $CRON_SECRET` automatically (see vercel.json); locally you can call:
//
//   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/reminders

import { sendUpcomingReminders } from "@/lib/reminders";

async function handle(request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization") ?? "";

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await sendUpcomingReminders({});
  return Response.json(result);
}

export async function GET(request) {
  return handle(request);
}

export async function POST(request) {
  return handle(request);
}
