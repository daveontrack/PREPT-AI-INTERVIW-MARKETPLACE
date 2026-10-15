"use server";

// ─── Resume / CV upload + analysis actions ───────────────────────────────────

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import {
  extractPdfText,
  isPdfBuffer,
  analyzeResumeText,
  MAX_RESUME_BYTES,
} from "@/lib/resume";

function sanitizeFileName(name) {
  const clean = String(name ?? "resume.pdf")
    .replace(/[/\\?%*:|"<>]/g, "-")
    .slice(0, 120);
  return clean.toLowerCase().endsWith(".pdf") ? clean : `${clean}.pdf`;
}

// Client-safe projection — never leaks fileData (raw PDF bytes) through
// server-action payloads; downloads go through /api/resumes/[id].
const LIST_SELECT = {
  id: true,
  fileName: true,
  fileSize: true,
  summary: true,
  skills: true,
  projects: true,
  suggestedCategories: true,
  questions: true,
  createdAt: true,
};

async function requireDbUser() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
  if (!dbUser) throw new Error("User not found");
  return dbUser;
}

// Upload → validate → extract text → Gemini analysis → store (bytes stay in
// Postgres, reachable only via the authenticated download route).
export const uploadResume = async (formData) => {
  const dbUser = await requireDbUser();

  const file = formData?.get?.("file");
  if (!file || typeof file.arrayBuffer !== "function")
    throw new Error("Choose a PDF file to upload");
  if (file.size > MAX_RESUME_BYTES)
    throw new Error("PDF is too large — the limit is 5 MB");

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isPdfBuffer(buffer))
    throw new Error("That file doesn't look like a PDF");

  const { text, totalPages } = await extractPdfText(buffer);
  const analysis = await analyzeResumeText(text);

  if (analysis.questions.length === 0)
    throw new Error("Could not extract interview questions from this resume");

  const resume = await db.resume.create({
    data: {
      userId: dbUser.id,
      fileName: sanitizeFileName(file.name),
      fileSize: file.size,
      mimeType: "application/pdf",
      fileData: buffer,
      summary: analysis.summary,
      skills: analysis.skills,
      projects: analysis.projects,
      suggestedCategories: analysis.suggestedCategories,
      questions: analysis.questions,
    },
    select: LIST_SELECT,
  });

  revalidatePath("/resume");
  return { resume, totalPages };
};

export const getMyResumes = async () => {
  const dbUser = await requireDbUser();
  return db.resume.findMany({
    where: { userId: dbUser.id },
    select: LIST_SELECT,
    orderBy: { createdAt: "desc" },
    take: 25,
  });
};

export const getResume = async ({ resumeId }) => {
  const dbUser = await requireDbUser();
  if (!resumeId) throw new Error("Resume required");

  const resume = await db.resume.findUnique({
    where: { id: resumeId },
    select: LIST_SELECT,
  });
  if (!resume || resume.userId !== dbUser.id) throw new Error("Resume not found");
  return resume;
};

export const deleteResume = async ({ resumeId }) => {
  const dbUser = await requireDbUser();
  if (!resumeId) throw new Error("Resume required");

  const resume = await db.resume.findUnique({
    where: { id: resumeId },
    select: { id: true, userId: true },
  });
  if (!resume || resume.userId !== dbUser.id) throw new Error("Resume not found");

  await db.resume.delete({ where: { id: resumeId } });
  revalidatePath("/resume");
  return { success: true };
};
