// Shared AI feedback pipeline used by the Stream webhook (automatic) and the
// on-demand generateFeedbackReport action (manual trigger after a call).
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { createStreamClient } from "@/lib/stream";
import { createNotification } from "@/lib/notifications";

// Verified live against the project API key: gemini-3.5-flash is the current
// stable model (gemini-2.0-flash and gemini-2.5-flash are no longer available
// to new users — they 404). Same model as the AI Questions action.
export const FEEDBACK_MODEL = "gemini-3.5-flash";

// ─── Sanitization ─────────────────────────────────────────────────────────────
// AI output is sanitized so malformed fields never break the DB write.

const clamp = (n, min = 1, max = 10) =>
  Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : null;

// Gemini sometimes returns the rating lowercase ("good") or with extra text
// ("Good performance"). The DB column is an enum (POOR|AVERAGE|GOOD|EXCELLENT),
// so we normalize and reject anything else instead of crashing the write.
const OVERALL_RATINGS = ["POOR", "AVERAGE", "GOOD", "EXCELLENT"];

const toOverallRating = (v) => {
  const normalized =
    typeof v === "string" ? v.trim().toUpperCase().split(/\s+/)[0] : "";
  return OVERALL_RATINGS.includes(normalized) ? normalized : null;
};

const toStringArray = (arr, limit = 10) =>
  Array.isArray(arr)
    ? arr.filter((s) => typeof s === "string" && s.trim()).slice(0, limit)
    : [];

const QUESTION_VERDICTS = ["STRONG", "GOOD", "FAIR", "WEAK"];

const toTextArray = (arr, limit = 5) =>
  Array.isArray(arr)
    ? arr.filter((s) => typeof s === "string" && s.trim()).slice(0, limit)
    : [];

// Maps anything the model returns onto the 4-point verdict scale. "ADEQUATE"
// was used by older reports and reads as "FAIR" on the new scale.
const toQuestionVerdict = (v) => {
  const raw = typeof v === "string" ? v.trim().toUpperCase() : "";
  if (QUESTION_VERDICTS.includes(raw)) return raw;
  if (raw === "ADEQUATE") return "FAIR";
  return "FAIR";
};

const toQuestionBreakdown = (arr) =>
  Array.isArray(arr)
    ? arr
      .filter((q) => q && typeof q === "object" && q.question)
      .map((q) => ({
        question: String(q.question),
        verdict: toQuestionVerdict(q.verdict),
        notes: typeof q.notes === "string" ? q.notes : "",
        strengths: toTextArray(q.strengths),
        improvements: toTextArray(q.improvements),
      }))
      .slice(0, 12)
    : [];

export function sanitizeFeedback(data) {
  return {
    summary: typeof data?.summary === "string" ? data.summary : "",
    technical: typeof data?.technical === "string" ? data.technical : "",
    communication:
      typeof data?.communication === "string" ? data.communication : "",
    problemSolving:
      typeof data?.problemSolving === "string" ? data.problemSolving : "",
    technicalScore: clamp(data?.technicalScore),
    communicationScore: clamp(data?.communicationScore),
    problemSolvingScore: clamp(data?.problemSolvingScore),
    recommendation:
      typeof data?.recommendation === "string" ? data.recommendation : "",
    strengths: toStringArray(data?.strengths),
    improvements: toStringArray(data?.improvements),
    conceptsCovered: toStringArray(data?.conceptsCovered, 20),
    pace: typeof data?.pace === "string" ? data.pace : "",
    nextSteps: toStringArray(data?.nextSteps),
    questionBreakdown: toQuestionBreakdown(data?.questionBreakdown),
    overallRating: toOverallRating(data?.overallRating),
  };
}

// ─── Gemini generation ────────────────────────────────────────────────────────

function buildPrompt(
  transcript,
  interviewer,
  interviewee,
  participationNote = "",
  signAnswersBlock = ""
) {
  const categories = interviewer.categories?.join(", ") ?? "General";
  const candidate = interviewee.name ?? "the candidate";
  const interviewerName = interviewer.name ?? "the interviewer";

  return `You are an expert technical interviewer evaluating a mock interview for ${candidate}, conducted by ${interviewerName}.

Interview categories: ${categories}
Candidate: ${candidate}
Interviewer: ${interviewerName}

${participationNote ? `${participationNote}\n` : ""}${signAnswersBlock ? `${signAnswersBlock}\n` : ""}TRANSCRIPT:
${transcript}

Evaluate the candidate STRICTLY from the transcript above. Never invent questions, answers, scores, or recommendations that are not supported by the evidence in the transcript. If the candidate did not meaningfully participate, explicitly say that there is insufficient evidence instead of fabricating performance.

Respond ONLY with a valid JSON object, no markdown, no backticks, no explanation:
{
  "summary": "One clear paragraph summarizing the candidate's actual interview performance based strictly on the transcript",
  "recommendation": "HIRE or MAYBE or NO_HIRE — followed by a concise explanation based on the evidence in the transcript",
  "technical": "What technical knowledge the candidate demonstrated, which concepts were discussed, what was missing, and what could be improved",
  "communication": "Assessment of the candidate's communication, clarity, confidence, completeness, and ability to explain answers, based only on the transcript",
  "problemSolving": "Assessment of the candidate's reasoning, approach to technical problems, debugging, system design, coding, or other problem-solving activities present in the interview",
  "pace": "Assessment of the interview pacing, response timing, structure, and whether the candidate provided sufficiently developed answers",
  "technicalScore": 7,
  "communicationScore": 8,
  "problemSolvingScore": 6,
  "overallRating": "POOR or AVERAGE or GOOD or EXCELLENT",
  "strengths": ["specific strength supported by the transcript", "another strength if applicable"],
  "improvements": ["specific improvement", "another improvement if applicable"],
  "conceptsCovered": ["concept discussed", "another concept"],
  "nextSteps": ["specific recommendation for the candidate", "technical/interview preparation recommendation", "any other appropriate follow-up"],
  "questionBreakdown": [
    {
      "question": "the exact meaningful interview question asked, as it appears in the transcript",
      "verdict": "STRONG or GOOD or FAIR or WEAK",
      "notes": "one or two sentences on how well the candidate answered it",
      "strengths": ["specific strength in the answer, supported by the transcript", "another strength if applicable"],
      "improvements": ["specific improvement for this answer", "another improvement if applicable"]
    }
  ]
}

Guidelines:
- Include a questionBreakdown entry for every meaningful professional or technical question asked in the transcript, evaluating how well the candidate answered (verdict plus specific strengths and improvements grounded in the transcript).
- If the transcript contains no meaningful professional or technical questions, do NOT invent questions. Instead include a single entry: { "question": "No meaningful professional or technical questions were asked in this session", "verdict": "WEAK", "notes": "Explicitly explain that no meaningful questions were asked or answered in the transcript, so there is nothing to evaluate per question.", "strengths": [], "improvements": ["Structured technical and behavioral questions should be asked so the candidate's abilities can be evaluated"] }.
- If the candidate gave no meaningful answers, mark those entries WEAK, keep the scores low, and explicitly state there is insufficient evidence.
- Do not fabricate performance, scores, or recommendations under any circumstances.`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Pulls the `retryDelay` (e.g. "52s") Google attaches to 429 responses.
const getRetryDelayMs = (err) => {
  const match = String(err?.message ?? "").match(
    /retryDelay["']?\s*[:=]\s*["']?(\d+(?:\.\d+)?)s/
  );
  return match ? Math.ceil(parseFloat(match[1]) * 1000) : 30_000;
};

export async function generateFeedback(
  transcript,
  interviewer,
  interviewee,
  participationNote,
  signAnswersBlock = ""
) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: FEEDBACK_MODEL });

  const prompt = buildPrompt(
    transcript,
    interviewer,
    interviewee,
    participationNote,
    signAnswersBlock
  );

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const raw = result.response
        .text()
        .trim()
        .replace(/^```json|^```|```$/gm, "")
        .trim();

      return sanitizeFeedback(JSON.parse(raw));
    } catch (err) {
      lastError = err;
      const isRateLimit =
        err?.status === 429 ||
        /429|quota|rate limit/i.test(String(err?.message ?? ""));
      if (!isRateLimit || attempt === 3) break;
      await sleep(getRetryDelayMs(err));
    }
  }

  throw new Error(
    "The AI report service is temporarily rate-limited. Please try again in a minute."
  );
}

// ─── Stream transcript ────────────────────────────────────────────────────────

// ─── Sign-language answers (provenance-labeled) ──────────────────────────
// Candidate-confirmed EthSL sign-recognition entries for the booking. The
// prompt tells Gemini to evaluate the CONTENT and never penalize the candidate
// for recognition artifacts — the system grades answers, not the model.

export function buildSignAnswersBlock(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return "";
  const lines = entries.map(
    (e, i) =>
      `${i + 1}. (${e.source === "typed" ? "typed by candidate" : "signed → recognized"}) ${e.text}`
  );
  return `CANDIDATE ANSWERS VIA SIGN-LANGUAGE ASSISTANCE (confirmed or edited by the candidate):
${lines.join("\n")}
NOTE: These answers were signed in Ethiopian Sign Language, recognized as text, and confirmed or edited by the candidate before being stored. Evaluate the CONTENT of each answer (relevance, completeness, reasoning, technical correctness). Do NOT penalize the candidate for recognition artifacts — if an entry is garbled or clearly incomplete, treat it as insufficient evidence for that answer rather than a poor answer.`;
}

async function fetchSignAnswers(bookingId) {
  try {
    return await db.signTranscript.findMany({
      where: { session: { bookingId } },
      orderBy: { sequenceNumber: "asc" },
      select: { text: true, source: true, sequenceNumber: true },
    });
  } catch (err) {
    console.warn("[feedback] sign transcript fetch failed:", err.message);
    return [];
  }
}

export async function fetchStreamTranscript(streamCallId) {
  const streamClient = createStreamClient({ timeout: 30_000 });

  const { transcriptions } = await streamClient.video
    .call("default", streamCallId)
    .listTranscriptions();
  const transcript = transcriptions?.[0];
  if (!transcript?.url) return null;

  const res = await fetch(transcript.url);
  if (!res.ok) return null;
  return await res.text();
}

// ─── Transcript parsing ───────────────────────────────────────────────────────

// Returns the raw JSONL "speech" entries (used to build the readable transcript
// and to measure how much the candidate actually spoke).
export function parseTranscriptLines(text) {
  return (text ?? "")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter((entry) => entry?.type === "speech");
}

// Parses the JSONL transcript from Stream into a readable conversation.
// Returns null when there are no speech segments.
export function parseTranscript(text, speakerMap) {
  const lines = parseTranscriptLines(text);
  if (lines.length === 0) return null;

  return lines
    .map((l) => `${speakerMap[l.speaker_id] ?? l.speaker_id}: ${l.text}`)
    .join("\n");
}

// Measures how much the candidate spoke so the AI can be told not to invent
// performance when the candidate barely (or never) appears in the transcript.
export function buildParticipationNote(speechLines, intervieweeId, intervieweeName) {
  const candidateLines = speechLines.filter(
    (l) => l.speaker_id === intervieweeId
  );
  const candidateUtterances = candidateLines.length;
  const candidateWords = candidateLines.reduce(
    (n, l) => n + String(l.text ?? "").trim().split(/\s+/).filter(Boolean).length,
    0
  );

  if (candidateUtterances === 0) {
    return `IMPORTANT: The candidate (${intervieweeName ?? "the interviewee"}) has NO recorded speech in this transcript. Do NOT invent answers, scores, or performance. Explicitly state that there is insufficient evidence to evaluate the candidate, give low scores, recommend NO_HIRE, and note that the audio or participation may have failed.`;
  }
  if (candidateWords < 20) {
    return `Note: The candidate (${intervieweeName ?? "the interviewee"}) has very little recorded speech (${candidateUtterances} utterances, roughly ${candidateWords} words). Evaluate only what is actually present in the transcript and do not fill the gaps with invented performance.`;
  }
  return null;
}

// ─── DB write ─────────────────────────────────────────────────────────────────

// Writes the AI report, marks the booking COMPLETED and credits the interviewer.
// The credit transaction is guarded so retries never double-pay.
export async function saveFeedbackForBooking(booking, feedbackData) {
  await db.$transaction([
    db.feedback.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        ...feedbackData,
      },
      update: {}, // already exists — no-op, keep the original
    }),
    db.booking.update({
      where: { id: booking.id },
      data: { status: "COMPLETED" },
    }),
  ]);

  const earnExists = await db.creditTransaction.findFirst({
    where: { bookingId: booking.id, type: "BOOKING_EARNING" },
  });
  if (!earnExists) {
    await db.creditTransaction.create({
      data: {
        userId: booking.interviewer.id,
        amount: booking.creditsCharged,
        type: "BOOKING_EARNING",
        bookingId: booking.id,
      },
    });
  }

  // ─── In-app notifications — the report is live ────────────────────────────
  // createNotification swallows its own errors, so this can't break the write.
  await createNotification({
    userId: booking.interviewee.id,
    type: "FEEDBACK_READY",
    title: "Your AI report is ready",
    body: `Feedback for your session with ${booking.interviewer.name ?? "your interviewer"} has been generated.`,
    link: "/appointments",
  });
  await createNotification({
    userId: booking.interviewer.id,
    type: "FEEDBACK_READY",
    title: "Session report ready",
    body: `The AI report for your session with ${booking.interviewee.name ?? "your candidate"} is available.`,
    link: "/dashboard",
  });
}
//I. Saving the feedback in PostgreSQL

// ─── Full pipeline (shared by manual + automatic paths) ───────────────────────

// Runs the complete "transcript → Gemini → DB" pipeline for a booking fetched
// with interviewer / interviewee relations and feedback included. No-ops when a
// report already exists. Throws when the transcript isn't ready or no speech was
// detected, so callers decide whether to surface the error.
export async function generateFeedbackForBooking(booking) {
  if (booking.feedback) return { success: true, alreadyExists: true };
  if (!booking.streamCallId)
    throw new Error("This session has no call to analyze");
  //The first check avoids generating a report if the booking already has feedback.

  // 1. Pull the transcript from Stream. Stream returns an empty transcript file
  //    for sessions where no recognizable speech was captured, so `null` (no
  //    transcription record yet / download failed) is the only "not ready" case.
  const transcriptText = await fetchStreamTranscript(booking.streamCallId);
  if (transcriptText == null) {
    throw new Error(
      "The transcript isn't ready yet. Please try again in a couple of minutes."
    );
  }

  // 2. Parse into a readable conversation
  const speakerMap = {
    [booking.interviewer.clerkUserId]:
      booking.interviewer.name ?? "Interviewer",
    [booking.interviewee.clerkUserId]:
      booking.interviewee.name ?? "Interviewee",
  };
  const speechLines = parseTranscriptLines(transcriptText);

  // Candidate-confirmed sign-language answers (may be the ONLY answers when
  // the candidate signed instead of speaking).
  const signEntries = await fetchSignAnswers(booking.id);
  const signBlock = buildSignAnswersBlock(signEntries);

  // No analyzable audio at all (silent / failed recording). Produce an honest
  // insufficient-evidence report instead of failing forever — the button must
  // not keep reporting the transcript as "not ready". When the candidate used
  // sign-language assistance, their confirmed answers ARE the evidence.
  if (speechLines.length === 0) {
    const feedbackData = await generateFeedback(
      "No speech was recorded in this session.",
      booking.interviewer,
      booking.interviewee,
      signBlock
        ? "IMPORTANT: No speech was captured in the audio, but the candidate used sign-language assistance — their confirmed answers are provided in the SIGN-LANGUAGE ASSISTANCE section. Evaluate those answers; only penalize what is genuinely missing from them, and mention that audio was unavailable."
        : "IMPORTANT: The transcript is empty — no speech was recorded for the interviewer or the candidate. Do NOT invent questions, answers, scores, or performance. Explicitly state that there is insufficient evidence to evaluate the candidate because no speech was captured, give low scores, recommend NO_HIRE, and note that the audio or recording may have failed.",
      signBlock
    );
    await saveFeedbackForBooking(booking, feedbackData);
    return { success: true };
  }

  const transcript = speechLines
    .map((l) => `${speakerMap[l.speaker_id] ?? l.speaker_id}: ${l.text}`)
    .join("\n");

  // Tell the AI when the candidate barely spoke so it states insufficient
  // evidence instead of inventing performance.
  const participationNote = buildParticipationNote(
    speechLines,
    booking.interviewee.clerkUserId,
    booking.interviewee.name
  );

  // 3. Generate + save the report (sign-language answers included with
  //    provenance labels when the candidate used the assistance feature)
  const feedbackData = await generateFeedback(
    transcript,
    booking.interviewer,
    booking.interviewee,
    participationNote,
    signBlock
  );
  await saveFeedbackForBooking(booking, feedbackData);
  return { success: true };
}

// ─── Automatic background generation ──────────────────────────────────────────
// Fired via next/server's after() when the appointments / dashboard pages
// render. Lives in lib (not a "use server" action) so it's only ever callable
// from server code — no client-invokable endpoint, no untrusted clerkUserId.

// Wait this long after a session's scheduled end before auto-generating its
// report — gives Stream a few minutes to finish transcribing the call.
const AUTO_FEEDBACK_GRACE_MS = 3 * 60 * 1000;
//Wait 3 minutes after the scheduled end before attempting generation

// Only auto-attempt sessions that ended within this window. After that, a
// no-show / never-transcribed session stops costing Stream API calls (the
// manual "Generate report" button remains the fallback for older sessions).
const AUTO_FEEDBACK_MAX_AGE_MS = 48 * 60 * 60 * 1000;
//Only auto-attempt sessions within 48 hours of their scheduled end.

// Cap per page load so a backlog of old sessions can't trigger a burst.
const AUTO_FEEDBACK_MAX_PER_LOAD = 5;
//Limit the number of reports generated per page load.

// Silently generates AI feedback for past sessions that don't have a report
// yet, so reports appear without any clicks. Sessions whose transcript isn't
// ready are skipped quietly and retried on the next page visit. The Stream
// call.transcription_ready webhook remains the primary path; this is a
// server-side safety net that also covers local dev where webhooks can't fire.
export async function autoGeneratePendingReports({ clerkUserId, bookingIds }) {
  if (!clerkUserId || !Array.isArray(bookingIds) || bookingIds.length === 0) {
    return { success: true, processed: 0 };
  }

  const now = Date.now();
  let processed = 0;
  for (const bookingId of bookingIds.slice(0, AUTO_FEEDBACK_MAX_PER_LOAD)) {
    try {
      const booking = await db.booking.findUnique({
        where: { id: bookingId },
        include: {
          interviewer: {
            select: {
              id: true,
              clerkUserId: true,
              name: true,
              categories: true,
            },
          },
          interviewee: {
            select: { id: true, clerkUserId: true, name: true },
          },
          feedback: { select: { id: true } },
        },
      });
      if (!booking) continue;

      // Only auto-generate for sessions the current user was part of
      const isInterviewer = booking.interviewer.clerkUserId === clerkUserId;
      const isInterviewee = booking.interviewee.clerkUserId === clerkUserId;
      if (!isInterviewer && !isInterviewee) continue;

      // Already reported, no call, or cancelled — nothing to do
      if (booking.feedback || !booking.streamCallId || booking.status === "CANCELLED") {
        continue;
      }

      const endedMs = new Date(booking.endTime).getTime();
      // Give Stream time to produce the transcript before the first attempt
      if (now - endedMs < AUTO_FEEDBACK_GRACE_MS) continue;
      // Stop retrying sessions that will likely never have a transcript
      if (now - endedMs > AUTO_FEEDBACK_MAX_AGE_MS) continue;

      await generateFeedbackForBooking(booking);
      processed++;
    } catch (err) {
      // Transcript not ready yet or AI rate-limited — skip quietly; the next
      // page visit (or the transcription_ready webhook) will retry
      console.warn(`[auto-feedback] Skipped ${bookingId}: ${err.message}`);
    }
  }

  if (processed > 0) {
    revalidatePath("/dashboard");
    revalidatePath("/appointments");
  }
  return { success: true, processed };
}
