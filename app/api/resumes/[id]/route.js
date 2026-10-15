// Authenticated download of a candidate's own uploaded resume PDF.
// The bytes never leave Postgres except through this route, so only their
// owner (checked against the Clerk session) can fetch them.

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

function safeFileName(name) {
  return String(name ?? "resume.pdf").replace(/["\\]/g, "");
}

export async function GET(request, { params }) {
  const { id } = await params;

  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const dbUser = await db.user.findUnique({
    where: { clerkUserId: user.id },
    select: { id: true },
  });
  if (!dbUser) return new Response("Unauthorized", { status: 401 });

  const resume = await db.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== dbUser.id || !resume.fileData)
    return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(resume.fileData), {
    headers: {
      "Content-Type": resume.mimeType || "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFileName(resume.fileName)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
