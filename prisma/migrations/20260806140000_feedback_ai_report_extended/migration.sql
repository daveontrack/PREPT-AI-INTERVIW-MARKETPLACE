-- Extend the AI feedback report with numeric scores, extended analysis
-- sections and a per-question breakdown (all optional for legacy rows).

ALTER TABLE "Feedback" ADD COLUMN "technicalScore" INTEGER;
ALTER TABLE "Feedback" ADD COLUMN "communicationScore" INTEGER;
ALTER TABLE "Feedback" ADD COLUMN "problemSolvingScore" INTEGER;
ALTER TABLE "Feedback" ADD COLUMN "conceptsCovered" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Feedback" ADD COLUMN "pace" TEXT;
ALTER TABLE "Feedback" ADD COLUMN "nextSteps" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Feedback" ADD COLUMN "questionBreakdown" JSONB;
