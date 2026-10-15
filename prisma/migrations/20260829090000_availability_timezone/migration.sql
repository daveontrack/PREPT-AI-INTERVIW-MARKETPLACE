-- Anchors the recurring daily availability window to the interviewer's IANA
-- timezone (IANA name, e.g. "Africa/Addis_Ababa" or "America/New_York").
--
-- The window's wall-clock startTime/endTime ("HH:mm") is interpreted in this
-- timezone by both the client slot picker and the server-side availability
-- validation, so bookings validate identically on local dev machines and on
-- Vercel's UTC serverless functions.
--
-- Existing rows default to 'UTC'; interviewers should re-save their window
-- once from the dashboard so their browser's timezone is captured.

ALTER TABLE "Availability" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';