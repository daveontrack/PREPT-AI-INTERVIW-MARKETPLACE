-- Feature set: collaborative code editor snapshot, solo AI mock interviews,
-- resume/CV analysis, in-app notifications and calendar reminders.

-- CreateEnum
CREATE TYPE "SoloStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CONFIRMED', 'BOOKING_RECEIVED', 'SESSION_REMINDER', 'FEEDBACK_READY');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "sharedCode" TEXT,
ADD COLUMN "sharedLanguage" TEXT DEFAULT 'javascript',
ADD COLUMN "remindedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SoloInterview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "InterviewCategory" NOT NULL,
    "roleTitle" TEXT,
    "resumeId" TEXT,
    "status" "SoloStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "questions" JSONB NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '[]',
    "summary" TEXT,
    "technical" TEXT,
    "communication" TEXT,
    "problemSolving" TEXT,
    "recommendation" TEXT,
    "strengths" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "improvements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "conceptsCovered" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "technicalScore" INTEGER,
    "communicationScore" INTEGER,
    "problemSolvingScore" INTEGER,
    "overallRating" "FeedbackRating",
    "questionBreakdown" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoloInterview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "fileData" BYTEA,
    "summary" TEXT,
    "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "projects" JSONB NOT NULL DEFAULT '[]',
    "suggestedCategories" "InterviewCategory"[],
    "questions" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SoloInterview_userId_createdAt_idx" ON "SoloInterview"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SoloInterview_userId_status_idx" ON "SoloInterview"("userId", "status");

-- CreateIndex
CREATE INDEX "Resume_userId_createdAt_idx" ON "Resume"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "SoloInterview" ADD CONSTRAINT "SoloInterview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
