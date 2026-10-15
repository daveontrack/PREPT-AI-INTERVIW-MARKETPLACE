-- Interviewee rating + comment on Feedback (nullable AI report fields).
ALTER TABLE "Feedback" ALTER COLUMN "summary" DROP NOT NULL;
ALTER TABLE "Feedback" ALTER COLUMN "technical" DROP NOT NULL;
ALTER TABLE "Feedback" ALTER COLUMN "communication" DROP NOT NULL;
ALTER TABLE "Feedback" ALTER COLUMN "problemSolving" DROP NOT NULL;
ALTER TABLE "Feedback" ALTER COLUMN "recommendation" DROP NOT NULL;
ALTER TABLE "Feedback" ALTER COLUMN "overallRating" DROP NOT NULL;
ALTER TABLE "Feedback" ADD COLUMN "rating" INTEGER;
ALTER TABLE "Feedback" ADD COLUMN "comment" TEXT;
ALTER TABLE "Feedback" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
