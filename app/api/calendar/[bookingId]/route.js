// Downloadable calendar invitation (.ics) for a booked session — only the
// two participants can fetch it. Works for Google Calendar, Apple Calendar,
// Outlook, etc.

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { buildBookingICS } from "@/lib/ics";
import { buildAppUrl } from "@/lib/url";

export async function GET(request, { params }) {
  const { bookingId } = await params;

  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const dbUser = await db.user.findUnique({
    where: { clerkUserId: user.id },
    select: { id: true, name: true, email: true },
  });
  if (!dbUser) return new Response("Unauthorized", { status: 401 });

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      interviewer: { select: { name: true, email: true, categories: true } },
      interviewee: { select: { name: true, email: true } },
    },
  });
  if (!booking) return new Response("Not found", { status: 404 });
  if (
    booking.intervieweeId !== dbUser.id &&
    booking.interviewerId !== dbUser.id
  )
    return new Response("Not found", { status: 404 });

  const joinUrl = booking.streamCallId
    ? buildAppUrl(`/call/${booking.streamCallId}`)
    : buildAppUrl();

  const ics = buildBookingICS(booking, { actor: dbUser, joinUrl });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="interviewloop-session.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
