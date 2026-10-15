-- Experimental sign-to-text assistance: recognition sessions per booking and
-- candidate-confirmed transcript entries. Only confirmed text is stored — no
-- video, landmarks or motion sequences.

-- CreateEnum
CREATE TYPE "SignRecognitionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');

-- CreateTable
CREATE TABLE "SignRecognitionSession" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'EthSL',
    "status" "SignRecognitionStatus" NOT NULL DEFAULT 'ACTIVE',
    "modelVersion" TEXT,
    "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "SignRecognitionSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignTranscript" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'sign_recognition',
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "sequenceNumber" INTEGER NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SignRecognitionSession_bookingId_startedAt_idx" ON "SignRecognitionSession"("bookingId", "startedAt");

-- CreateIndex
CREATE INDEX "SignRecognitionSession_candidateId_startedAt_idx" ON "SignRecognitionSession"("candidateId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SignTranscript_sessionId_sequenceNumber_key" ON "SignTranscript"("sessionId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "SignTranscript_sessionId_confirmedAt_idx" ON "SignTranscript"("sessionId", "confirmedAt");

-- AddForeignKey
ALTER TABLE "SignRecognitionSession" ADD CONSTRAINT "SignRecognitionSession_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignRecognitionSession" ADD CONSTRAINT "SignRecognitionSession_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignTranscript" ADD CONSTRAINT "SignTranscript_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SignRecognitionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
