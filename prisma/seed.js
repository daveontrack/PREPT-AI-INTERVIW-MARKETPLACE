import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Replicate the same adapter pattern as lib/prisma.ts
// Can't use @/ alias — seed runs outside Next.js
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

// ── CHANGE THIS ───────────────────────────────────────────────────────────────
// const BOOKING_ID = "your-booking-id-here";
const BOOKING_ID = "c9160e33-341f-4a59-853d-760d279881d5";
// ─────────────────────────────────────────────────────────────────────────────

const feedback = {
  summary:
    "dave demonstrated a solid understanding of React fundamentals and component architecture. He approached problems methodically and showed good instincts around state management. With some refinement in system design and async patterns, he's well on track for a mid-level frontend role.",
  technical:
    "Strong grasp of React hooks, component lifecycle, and basic TypeScript. Handled the closure question confidently. Struggled slightly with the event loop explanation and needed hints on optimising a recursive tree traversal — but recovered well once guided.",
  communication:
    "Articulate and structured in most answers. Thinks out loud effectively, which made it easy to follow his reasoning. Occasionally jumped to implementation before fully exploring the problem space.",
  problemSolving:
    "Good instinct for breaking problems down. Chose sensible data structures for most questions. The dynamic programming problem was a stretch — he identified the overlapping subproblems but didn't arrive at a memoised solution independently.",
  technicalScore: 7,
  communicationScore: 8,
  problemSolvingScore: 6,
  recommendation:
    "Recommended for mid-level frontend roles at growth-stage startups. Not yet ready for senior FAANG interviews without deepening system design knowledge. Suggest focusing on: async JavaScript internals, large-scale component architecture, and DP patterns.",
  strengths: [
    "Strong React & hooks knowledge",
    "Clear verbal communication",
    "Systematic debugging approach",
    "Good CSS & browser fundamentals",
  ],
  improvements: [
    "System design depth",
    "Async/event loop internals",
    "Dynamic programming patterns",
    "Ask clarifying questions upfront",
  ],
  conceptsCovered: [
    "React hooks",
    "Closures",
    "Event loop",
    "Component lifecycle",
    "System design",
    "Dynamic programming",
  ],
  pace: "Maintained a steady pace throughout and used time well. Spent slightly too long on the first question, which cut into the system design discussion — worth watching as interview rounds get tighter.",
  nextSteps: [
    "Deep-dive into async JavaScript and the event loop",
    "Practice large-scale component architecture",
    "Work through 10 dynamic programming patterns",
    "Always ask clarifying questions before jumping to code",
  ],
  questionBreakdown: [
    {
      question: "Explain how closures work in JavaScript with an example",
      verdict: "STRONG",
      notes:
        "Gave a confident, correct explanation with a clear counter example.",
    },
    {
      question: "Walk through the event loop and microtask queue ordering",
      verdict: "WEAK",
      notes:
        "Knew the terms but mixed up ordering between microtasks and macrotasks.",
    },
    {
      question: "Optimise a recursive tree traversal for large datasets",
      verdict: "ADEQUATE",
      notes:
        "Identified the recursion depth issue but needed a hint toward iteration.",
    },
    {
      question: "Design the component structure for a dashboard at scale",
      verdict: "ADEQUATE",
      notes:
        "Solid start on component boundaries; didn't cover state management tradeoffs.",
    },
    {
      question: "Solve the coin-change problem with minimal coins",
      verdict: "ADEQUATE",
      notes:
        "Saw the overlapping subproblems but didn't reach a memoised solution unaided.",
    },
  ],
  overallRating: "GOOD", // POOR | AVERAGE | GOOD | EXCELLENT
  sessionRating: 4,
  sessionComment:
    "Great session — dave was engaged and receptive to feedback. Would be happy to interview him again after he's done more system design prep.",
};

async function main() {
  const booking = await db.booking.findUnique({
    where: { id: BOOKING_ID },
    select: { id: true, status: true },
  });

  if (!booking) {
    console.error(`❌  No booking found with ID: ${BOOKING_ID}`);
    process.exit(1);
  }

  const existing = await db.feedback.findUnique({
    where: { bookingId: BOOKING_ID },
  });

  if (existing) {
    console.error(`❌  Feedback already exists for booking: ${BOOKING_ID}`);
    process.exit(1);
  }

  await db.$transaction([
    db.feedback.create({
      data: { bookingId: BOOKING_ID, ...feedback },
    }),
    db.booking.update({
      where: { id: BOOKING_ID },
      data: { status: "COMPLETED" },
    }),
  ]);

  console.log(`✅  Feedback seeded for booking: ${BOOKING_ID}`);
  console.log(`✅  Booking status → COMPLETED`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
