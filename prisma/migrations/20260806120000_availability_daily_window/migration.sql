-- Convert date-based Availability into a recurring daily window.
-- Existing rows keep their UTC time-of-day; stale per-date rows are removed.

DELETE FROM "Availability" WHERE "startTime" < '2025-01-01';

ALTER TABLE "Availability" DROP COLUMN "status";
ALTER TABLE "Availability" DROP COLUMN "days";
ALTER TABLE "Availability" ALTER COLUMN "startTime" TYPE TEXT USING to_char("startTime" AT TIME ZONE 'UTC', 'HH24:MI');
ALTER TABLE "Availability" ALTER COLUMN "endTime" TYPE TEXT USING to_char("endTime" AT TIME ZONE 'UTC', 'HH24:MI');
ALTER TABLE "Availability" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Availability" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Availability" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Availability" ADD CONSTRAINT "Availability_interviewerId_key" UNIQUE ("interviewerId");
DROP INDEX "Availability_interviewerId_startTime_idx";
CREATE INDEX "Availability_interviewerId_idx" ON "Availability"("interviewerId");

DROP TYPE "AvailabilityStatus";
