"use server";

// ─── Solo AI mock interviews ─────────────────────────────────────────────────
// Text-based practice interviews with Gemini — no booking, no human
// interviewer, no credits. Candidates pick a category (or reuse resume-derived
// questions), answer one question at a time, and receive the same structured
// AI report (1-10 scores + FeedbackRating) as live sessions, so the skill
// progression dashboard can aggregate both sources together.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { CATEGORY_PROMPTS, isValidCategory } from "@/lib/categories";
import { FEEDBACK_MODEL, sanitizeFeedback } from "@/lib/feedback";

const QUESTIONS_PER_SESSION = 6;
const MIN_ANSWER_LENGTH = 10; // below this we don't wait for Gemini on submit

// ─── Sanitization ────────────────────────────────────────────────────────────

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

const toAnswers = (arr, count) =>
  Array.isArray(arr)
    ? arr
      .slice(0, count)
      .map((a) => (typeof a === "string" ? a.trim().slice(0, 8000) : ""))
    : [];

// ─── Gemini helpers ──────────────────────────────────────────────────────────

function callGemini(prompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: FEEDBACK_MODEL });
  return model.generateContent(prompt).then((result) =>
    result.response
      .text()
      .trim()
      .replace(/^```json|^```|```$/gm, "")
      .trim()
  );
}

async function generateQuestions({ category, roleTitle, resume }) {
  const resumeContext = resume
    ? `
The candidate uploaded this resume — make at least half of the questions personalize their real experience (projects, stack, gaps):
Resume summary: ${resume.summary ?? "n/a"}
Skills: ${(resume.skills ?? []).join(", ") || "n/a"}
Projects: ${JSON.stringify(resume.projects ?? []).slice(0, 3000)}
`
    : "";

  const prompt = `You are an expert technical interviewer conducting a mock interview for a ${category} role.
${roleTitle ? `Target role: ${roleTitle}` : ""}
Topics to cover: ${CATEGORY_PROMPTS[category]}
${resumeContext}
Generate ${QUESTIONS_PER_SESSION} questions ordered from warm-up to challenging. For each question also write a concise model answer an interviewer would expect from a strong candidate.

Respond ONLY with a valid JSON array, no markdown, no backticks:
[{"question": "...", "modelAnswer": "..."}]`;

  return toQuestions(JSON.parse(await callGemini(prompt)));
}

async function generateSoloReport(questions, answers, { category, roleTitle }) {
  const transcript = questions
    .map(
      (q, i) => `${i + 1}. Question: ${q.question}\nAnswer: ${answers[i] || "(no answer)"}`
    )
    .join("\n\n");

  const answered = answers.filter((a) => a && a.trim().length >= MIN_ANSWER_LENGTH).length;

  const prompt = `You are an expert ${category} interviewer evaluating a completed text-based mock interview.
${roleTitle ? `Target role: ${roleTitle}` : ""}

QUESTIONS AND ANSWERS:
${transcript}

IMPORTANT: ${answered === 0
      ? "The candidate provided no meaningful answers. Do NOT invent answers or performance. Give low scores, recommend NO_HIRE and state the evidence is missing."
      : `Judge only what is present in the answers above. Some answers may be brief — evaluate the knowledge actually demonstrated, never invent content.`}

Respond ONLY with a valid JSON object, no markdown, no backticks:
{
  "summary": "One paragraph summarizing the candidate's actual performance based strictly on the answers above",
  "recommendation": "HIRE or MAYBE or NO_HIRE — with a concise explanation grounded in the answers",
  "technical": "Technical knowledge demonstrated, concepts covered, and what was missing",
  "communication": "Clarity, structure and completeness of the written answers",
  "problemSolving": "Reasoning approach and problem-solving ability shown in the answers",
  "pace": "Whether answers were developed enough for an interview setting",
  "technicalScore": 7,
  "communicationScore": 7,
  "problemSolvingScore": 7,
  "overallRating": "POOR or AVERAGE or GOOD or EXCELLENT",
  "strengths": ["strength supported by the answers"],
  "improvements": ["specific improvement"],
  "conceptsCovered": ["concept"],
  "nextSteps": ["recommendation"],
  "questionBreakdown": [
    {
      "question": "the question as asked above",
      "verdict": "STRONG or GOOD or FAIR or WEAK",
      "notes": "one or two sentences evaluating the candidate's answer",
      "strengths": ["strength in this answer"],
      "improvements": ["improvement for this answer"]
    }
  ]
}`;

  return sanitizeFeedback(JSON.parse(await callGemini(prompt)));
}

// ─── Serialization ───────────────────────────────────────────────────────────

const serializeQuestions = (questions) =>
  (Array.isArray(questions) ? questions : []).map((q) => ({
    question: q?.question ?? "",
    // Model answers stay hidden until the session completes.
    modelAnswer: "",
  }));

const serializeAnswers = (answers) =>
  Array.isArray(answers) ? answers : [];

function serializeSession(session, { includeQuestions = false } = {}) {
  return {
    id: session.id,
    category: session.category,
    roleTitle: session.roleTitle,
    resumeId: session.resumeId,
    status: session.status,
    questions: includeQuestions
      ? Array.isArray(session.questions) ? session.questions : []
      : serializeQuestions(session.questions),
    answers: serializeAnswers(session.answers),
    completed: session.status === "COMPLETED",
    report:
      session.status === "COMPLETED"
        ? {
          summary: session.summary,
          technical: session.technical,
          communication: session.communication,
          problemSolving: session.problemSolving,
          recommendation: session.recommendation,
          strengths: session.strengths,
          improvements: session.improvements,
          conceptsCovered: session.conceptsCovered,
          technicalScore: session.technicalScore,
          communicationScore: session.communicationScore,
          problemSolvingScore: session.problemSolvingScore,
          overallRating: session.overallRating,
          questionBreakdown: session.questionBreakdown ?? [],
        }
        : null,
    startedAt: session.startedAt?.toISOString?.() ?? session.startedAt,
    completedAt: session.completedAt?.toISOString?.() ?? session.completedAt,
    createdAt: session.createdAt?.toISOString?.() ?? session.createdAt,
  };
}

// ─── Actions ─────────────────────────────────────────────────────────────────

async function requireDbUser() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  const dbUser = await db.user.findUnique({
    where: { clerkUserId: user.id },
  });
  if (!dbUser) throw new Error("User not found");
  return dbUser;
}

// Starts a new practice session. With resumeId the questions come from that
// resume's analysis (Feature 3); otherwise Gemini generates them fresh.
export const startSoloInterview = async ({ category, roleTitle, resumeId }) => {
  const dbUser = await requireDbUser();

  let resume = null;
  if (resumeId) {
    resume = await db.resume.findUnique({ where: { id: resumeId } });
    if (!resume || resume.userId !== dbUser.id) throw new Error("Resume not found");
  }

  const effectiveCategory =
    category && isValidCategory(category)
      ? category
      : resume?.suggestedCategories?.[0] && isValidCategory(resume.suggestedCategories[0])
        ? resume.suggestedCategories[0]
        : null;
  if (!effectiveCategory) throw new Error("Pick an interview category to practice");

  const cleanRoleTitle =
    typeof roleTitle === "string" && roleTitle.trim() ? roleTitle.trim().slice(0, 200) : null;

  // Resume sessions reuse the stored personalized questions; category sessions
  // get a fresh Gemini generation.
  const questions = resume
    ? toQuestions(resume.questions).slice(0, QUESTIONS_PER_SESSION)
    : await generateQuestions({
      category: effectiveCategory,
      roleTitle: cleanRoleTitle,
      resume: null,
    });

  if (questions.length === 0)
    throw new Error("Could not generate questions right now. Please try again.");

  const session = await db.soloInterview.create({
    data: {
      userId: dbUser.id,
      category: effectiveCategory,
      roleTitle: cleanRoleTitle,
      resumeId: resume?.id ?? null,
      status: "IN_PROGRESS",
      questions,
      answers: [],
    },
  });

  revalidatePath("/practice");
  return { session: serializeSession(session, { includeQuestions: true }) };
};

// Records the answer for the current question. When the last question is
// answered the AI report is generated and the session completed — the report
// comes back in the same response.
export const submitSoloAnswer = async ({ sessionId, answer }) => {
  const dbUser = await requireDbUser();
  if (!sessionId) throw new Error("Session required");

  const session = await db.soloInterview.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== dbUser.id) throw new Error("Session not found");
  if (session.status === "COMPLETED")
    throw new Error("This session is already complete");

  const questions = Array.isArray(session.questions) ? session.questions : [];
  const answers = Array.isArray(session.answers) ? session.answers : [];
  const index = answers.length;
  if (index >= questions.length) throw new Error("All questions already answered");

  const cleanAnswer =
    typeof answer === "string" ? answer.trim().slice(0, 8000) : "";
  const nextAnswers = [...answers, cleanAnswer];
  const isLast = nextAnswers.length >= questions.length;

  if (!isLast) {
    await db.soloInterview.update({
      where: { id: session.id },
      data: { answers: nextAnswers },
    });
    return {
      session: serializeSession(
        { ...session, answers: nextAnswers },
        { includeQuestions: true }
      ),
      report: null,
    };
  }

  // Last answer → generate the report and close out the session.
  const report = await generateSoloReport(questions, nextAnswers, {
    category: session.category,
    roleTitle: session.roleTitle,
  });

  const updated = await db.soloInterview.update({
    where: { id: session.id },
    data: {
      answers: nextAnswers,
      status: "COMPLETED",
      completedAt: new Date(),
      summary: report.summary,
      technical: report.technical,
      communication: report.communication,
      problemSolving: report.problemSolving,
      recommendation: report.recommendation,
      strengths: report.strengths,
      improvements: report.improvements,
      conceptsCovered: report.conceptsCovered,
      technicalScore: report.technicalScore,
      communicationScore: report.communicationScore,
      problemSolvingScore: report.problemSolvingScore,
      overallRating: report.overallRating,
      questionBreakdown: report.questionBreakdown,
    },
  });

  revalidatePath("/practice");
  revalidatePath("/progress");
  return { session: serializeSession(updated, { includeQuestions: true }), report };
};

// Removes the last recorded answer so the candidate can revise it (the UI's
// "Previous" button). Only while the session is still in progress.
export const undoSoloAnswer = async ({ sessionId }) => {
  const dbUser = await requireDbUser();
  if (!sessionId) throw new Error("Session required");

  const session = await db.soloInterview.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== dbUser.id) throw new Error("Session not found");
  if (session.status === "COMPLETED")
    throw new Error("This session is already complete");

  const answers = Array.isArray(session.answers) ? session.answers : [];
  if (answers.length === 0) throw new Error("No answers to undo");

  const updated = await db.soloInterview.update({
    where: { id: session.id },
    data: { answers: answers.slice(0, -1) },
  });

  return { session: serializeSession(updated, { includeQuestions: true }) };
};

// Ends an in-progress session early using whatever has been answered so far
// (min 3 answered questions so the report has real evidence to grade).
export const finishSoloInterviewEarly = async ({ sessionId }) => {
  const dbUser = await requireDbUser();
  if (!sessionId) throw new Error("Session required");

  const session = await db.soloInterview.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== dbUser.id) throw new Error("Session not found");
  if (session.status === "COMPLETED")
    return { session: serializeSession(session, { includeQuestions: true }) };

  const questions = Array.isArray(session.questions) ? session.questions : [];
  const answers = Array.isArray(session.answers) ? session.answers : [];
  const answered = answers.filter((a) => a && a.trim().length >= MIN_ANSWER_LENGTH);

  if (answered.length < 3)
    throw new Error("Answer at least 3 questions before finishing early");

  const report = await generateSoloReport(questions, answers, {
    category: session.category,
    roleTitle: session.roleTitle,
  });

  const updated = await db.soloInterview.update({
    where: { id: session.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      summary: report.summary,
      technical: report.technical,
      communication: report.communication,
      problemSolving: report.problemSolving,
      recommendation: report.recommendation,
      strengths: report.strengths,
      improvements: report.improvements,
      conceptsCovered: report.conceptsCovered,
      technicalScore: report.technicalScore,
      communicationScore: report.communicationScore,
      problemSolvingScore: report.problemSolvingScore,
      overallRating: report.overallRating,
      questionBreakdown: report.questionBreakdown,
    },
  });

  revalidatePath("/practice");
  revalidatePath("/progress");
  return { session: serializeSession(updated, { includeQuestions: true }) };
};

// History for the practice page — model answers stay hidden for COMPLETED
// sessions the user re-opens from history? They're revealed there on purpose:
// after completion the model answer is the learning material.
export const getMySoloInterviews = async () => {
  const dbUser = await requireDbUser();

  const sessions = await db.soloInterview.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return sessions.map((s) => serializeSession(s, { includeQuestions: s.status === "COMPLETED" }));
};

// One session in full (in-progress or completed) — used to resume/refresh.
export const getSoloInterview = async ({ sessionId }) => {
  const dbUser = await requireDbUser();
  if (!sessionId) throw new Error("Session required");

  const session = await db.soloInterview.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== dbUser.id) throw new Error("Session not found");

  return serializeSession(session, { includeQuestions: true });
};
