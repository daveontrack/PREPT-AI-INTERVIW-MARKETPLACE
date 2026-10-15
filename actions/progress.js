"use server";

// ─── Skill progression ───────────────────────────────────────────────────────
// Aggregates the EXISTING feedback records — no separate scoring system:
//   • live sessions  → Feedback.technicalScore / communicationScore /
//                      problemSolvingScore / overallRating (AI report)
//   • solo sessions  → SoloInterview.* (same 1-10 scale + FeedbackRating)
// Both are merged into one chronological series powering the dashboard.

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { CATEGORY_LABEL } from "@/lib/data";

const toIso = (d) => (d ? new Date(d).toISOString() : null);

const sessionAverage = (s) => {
  const scores = [s.technicalScore, s.communicationScore, s.problemSolvingScore].filter(
    Number.isInteger
  );
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
};

const avg = (values) => {
  const valid = values.filter(Number.isInteger);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
};

// Difference between the most recent `window` sessions and the ones before
// them — the "are you getting better" number shown next to each skill bar.
function recentDelta(sessions, pick) {
  const withScore = sessions
    .map(pick)
    .filter((v) => Number.isInteger(v))
    .reverse(); // newest first
  if (withScore.length < 4) return null;
  const recent = withScore.slice(0, 3);
  const prior = withScore.slice(3, 6);
  if (prior.length === 0) return null;
  return avg(recent) - avg(prior);
}

export const getSkillProgress = async () => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await db.user.findUnique({
    where: { clerkUserId: user.id },
    select: { id: true },
  });
  if (!dbUser) throw new Error("User not found");

  const [bookings, solos] = await Promise.all([
    db.booking.findMany({
      where: { intervieweeId: dbUser.id, status: "COMPLETED" },
      include: {
        interviewer: { select: { name: true, categories: true } },
        feedback: { select: {
          id: true,
          summary: true,
          overallRating: true,
          technicalScore: true,
          communicationScore: true,
          problemSolvingScore: true,
          updatedAt: true,
        } },
      },
      orderBy: { endTime: "asc" },
    }),
    db.soloInterview.findMany({
      where: { userId: dbUser.id, status: "COMPLETED" },
      orderBy: { completedAt: "asc" },
    }),
  ]);

  // ── Merge into one chronological session series ──
  const sessions = [];

  for (const b of bookings) {
    const f = b.feedback;
    if (!f) continue;
    sessions.push({
      id: b.id,
      source: "LIVE",
      title: b.interviewer?.name ? `Mock interview with ${b.interviewer.name}` : "Mock interview",
      category: b.interviewer?.categories?.[0] ?? null,
      date: toIso(b.endTime ?? b.updatedAt) ?? toIso(f.updatedAt),
      technicalScore: f.technicalScore,
      communicationScore: f.communicationScore,
      problemSolvingScore: f.problemSolvingScore,
      overallRating: f.overallRating,
      summary: f.summary,
    });
  }

  for (const s of solos) {
    sessions.push({
      id: s.id,
      source: "SOLO",
      title: `Solo practice — ${CATEGORY_LABEL[s.category] ?? s.category}`,
      category: s.category,
      date: toIso(s.completedAt) ?? toIso(s.createdAt),
      technicalScore: s.technicalScore,
      communicationScore: s.communicationScore,
      problemSolvingScore: s.problemSolvingScore,
      overallRating: s.overallRating,
      summary: s.summary,
    });
  }

  sessions.sort((a, b) => new Date(a.date) - new Date(b.date));

  // ── Dimension averages (+ trend) ──
  const dimensions = [
    {
      key: "technical",
      label: "Technical knowledge",
      value: avg(sessions.map((s) => s.technicalScore)),
      delta: recentDelta(sessions, (s) => s.technicalScore),
    },
    {
      key: "communication",
      label: "Communication",
      value: avg(sessions.map((s) => s.communicationScore)),
      delta: recentDelta(sessions, (s) => s.communicationScore),
    },
    {
      key: "problemSolving",
      label: "Problem solving",
      value: avg(sessions.map((s) => s.problemSolvingScore)),
      delta: recentDelta(sessions, (s) => s.problemSolvingScore),
    },
  ];

  const overall = avg(
    sessions.map((s) => sessionAverage(s)).filter((v) => v !== null)
  );

  // ── Trend series (session average over time, capped for the chart) ──
  const trend = sessions
    .filter((s) => sessionAverage(s) !== null)
    .slice(-16)
    .map((s) => ({
      id: s.id,
      source: s.source,
      date: s.date,
      value: Number(sessionAverage(s).toFixed(2)),
    }));

  // ── Category breakdown ──
  const byCategory = new Map();
  for (const s of sessions) {
    const key = s.category ?? "GENERAL";
    const entry = byCategory.get(key) ?? { category: key, count: 0, scores: [] };
    entry.count++;
    const v = sessionAverage(s);
    if (v !== null) entry.scores.push(v);
    byCategory.set(key, entry);
  }
  const categories = [...byCategory.values()]
    .map((e) => ({
      category: e.category,
      label: CATEGORY_LABEL[e.category] ?? "General",
      count: e.count,
      value: avg(e.scores),
    }))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  // ── Overall-rating distribution ──
  const ratings = { POOR: 0, AVERAGE: 0, GOOD: 0, EXCELLENT: 0 };
  for (const s of sessions) {
    if (s.overallRating && ratings[s.overallRating] !== undefined)
      ratings[s.overallRating]++;
  }

  return {
    totals: {
      sessions: sessions.length,
      live: bookings.length,
      solo: solos.length,
      overall,
      topCategory: categories[0]?.label ?? null,
    },
    dimensions,
    trend,
    categories,
    ratings,
    recent: [...sessions].reverse().slice(0, 6),
  };
};
