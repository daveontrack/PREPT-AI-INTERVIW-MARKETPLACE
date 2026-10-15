// ─── Resume / CV analysis ────────────────────────────────────────────────────
// PDF text extraction (unpdf — pdf.js build that works in Node/serverless) and
// the Gemini analysis behind actions/resume.js. Kept in lib so the action file
// only exports server functions.

import { extractText, getDocumentProxy } from "unpdf";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FEEDBACK_MODEL } from "@/lib/feedback";

export const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_PAGES = 30;
const MAX_PROMPT_CHARS = 24_000;

const INTERVIEW_CATEGORIES = [
  "FRONTEND",
  "BACKEND",
  "FULLSTACK",
  "DSA",
  "SYSTEM_DESIGN",
  "BEHAVIORAL",
  "DEVOPS",
  "MOBILE",
];

// Quick magic-byte check so a renamed .txt/.exe never reaches pdf.js.
export function isPdfBuffer(buffer) {
  return (
    Buffer.isBuffer(buffer) &&
    buffer.length > 5 &&
    buffer.subarray(0, 5).toString("latin1") === "%PDF-"
  );
}

// Extracts plain text from a PDF buffer. Throws user-friendly errors for
// image-only (scanned) PDFs — we can't OCR, so saying so beats an empty report.
export async function extractPdfText(buffer) {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));

  if (pdf.numPages > MAX_PAGES)
    throw new Error(`PDF is too long (${pdf.numPages} pages, max ${MAX_PAGES})`);

  const { text } = await extractText(pdf, { mergePages: true });
  const cleaned = (text ?? "").replace(/\s{3,}/g, "\n").trim();

  if (cleaned.length < 100)
    throw new Error(
      "Couldn't read any text from this PDF — scanned or image-only PDFs aren't supported yet."
    );

  return { text: cleaned.slice(0, MAX_PROMPT_CHARS), totalPages: pdf.numPages };
}

// ─── Sanitization ────────────────────────────────────────────────────────────

const toStringArray = (arr, limit) =>
  Array.isArray(arr)
    ? arr
      .filter((s) => typeof s === "string" && s.trim())
      .map((s) => s.trim().slice(0, 200))
      .filter((v, i, all) => all.indexOf(v) === i)
      .slice(0, limit)
    : [];

const toProjects = (arr) =>
  Array.isArray(arr)
    ? arr
      .filter((p) => p && typeof p === "object" && typeof p.name === "string" && p.name.trim())
      .map((p) => ({
        name: p.name.trim().slice(0, 200),
        description: typeof p.description === "string" ? p.description.trim().slice(0, 1000) : "",
        tech: toStringArray(p.tech, 12),
      }))
      .slice(0, 8)
    : [];

const toQuestions = (arr) =>
  Array.isArray(arr)
    ? arr
      .filter((q) => q && typeof q.question === "string" && q.question.trim())
      .map((q) => ({
        question: q.question.trim().slice(0, 2000),
        modelAnswer:
          typeof q.modelAnswer === "string" ? q.modelAnswer.trim().slice(0, 4000) : "",
      }))
      .slice(0, 12)
    : [];

export function sanitizeResumeAnalysis(data) {
  return {
    summary: typeof data?.summary === "string" ? data.summary.trim().slice(0, 2000) : "",
    skills: toStringArray(data?.skills, 30),
    projects: toProjects(data?.projects),
    suggestedCategories: toStringArray(data?.suggestedCategories, 3)
      .map((c) => c.toUpperCase())
      .filter((c) => INTERVIEW_CATEGORIES.includes(c)),
    questions: toQuestions(data?.questions),
  };
}

// ─── Gemini analysis ─────────────────────────────────────────────────────────

export async function analyzeResumeText(text) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: FEEDBACK_MODEL });

  const prompt = `You are an expert technical recruiter and interviewer. Analyze the resume below and respond ONLY with a valid JSON object — no markdown, no backticks, no explanation.

RESUME:
${text}

JSON shape:
{
  "summary": "2-3 sentence professional profile of this candidate",
  "skills": ["concrete, specific technologies and skills found in the resume (max 25)"],
  "projects": [
    { "name": "project or role highlight", "description": "1-2 sentences on impact/scope", "tech": ["stack used"] }
  ],
  "suggestedCategories": ["1-3 of: FRONTEND, BACKEND, FULLSTACK, DSA, SYSTEM_DESIGN, BEHAVIORAL, DEVOPS, MOBILE"],
  "questions": [
    { "question": "a personalized interview question probing their real experience, choices or gaps", "modelAnswer": "what a strong interviewer expects in return" }
  ]
}

Rules:
- Extract ONLY what the resume actually states — never invent employers, titles, skills or projects.
- Write 8 interview questions personalized to this resume: probe their claimed projects, justify design choices, and probe obvious gaps between the resume and a strong candidate for the suggested roles.
- Mix difficulty: 2 warm-up, 4 mid, 2 challenging.`;

  const result = await model.generateContent(prompt);
  const raw = result.response
    .text()
    .trim()
    .replace(/^```json|^```|```$/gm, "")
    .trim();

  return sanitizeResumeAnalysis(JSON.parse(raw));
}
