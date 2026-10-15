import {
  format,
  isToday,
  isTomorrow,
  addDays,
  addMinutes,
  isBefore,
  isAfter,
  differenceInMinutes,
} from "date-fns";

// "Mon, Mar 24, 2026" — used in appointment cards
export function formatDate(iso) {
  return format(new Date(iso), "EEE, MMM d, yyyy");
}

// "Monday, March 24, 2026" — used in the booking confirm card
export function formatDateFull(date) {
  return format(new Date(date), "EEEE, MMMM d, yyyy");
}

// "9:30 AM" — used anywhere a time-only string is needed (slot buttons, appointment rows)
export function formatTime(date) {
  return format(new Date(date), "h:mm a");
}

// "2:38 PM" — formats an "HH:mm" time-of-day string (used for the daily
// availability window on cards, profile badges and the dashboard).
export function formatTimeOfDay(time) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return "";//Rejects values that cannot be converted to numbers.
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

// "1h 30m" or "45m" — used in appointment cards to show session length
export function formatDuration(start, end) {
  const mins = differenceInMinutes(new Date(end), new Date(start));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
}

// Returns { top, bottom } label for each date tab in SlotPicker.
// Today/Tomorrow get friendly labels; all other days show short weekday name.
// bottom is always "MMM d" (e.g. "Mar 24") regardless of which branch.
export function formatDateTab(date) {
  const bottom = format(date, "MMM d");
  if (isToday(date)) return { top: "Today", bottom };
  if (isTomorrow(date)) return { top: "Tomorrow", bottom };
  return { top: format(date, "EEE"), bottom };
}

// Produces an array of Date objects starting from today, one per day,
// for the next `daysAhead` days — used to populate the date tab strip.
export function generateDates(daysAhead) {
  return Array.from({ length: daysAhead }, (_, i) => addDays(new Date(), i));
}

// ─── Timezone helpers ─────────────────────────────────────────────────────────
// Availability windows are stored as naive wall-clock strings ("HH:mm") with an
// IANA timezone (`Availability.timezone`). These helpers convert that wall-clock
// window into ABSOLUTE instants for a given calendar day, so the client slot
// picker and the server-side validator produce identical instants regardless of
// the runtime's local timezone (Vercel functions run in UTC).

// Offset (in ms) between the given instant's UTC value and its wall-clock
// rendering in `timeZone` — used to build absolute instants from wall-clock
// hours and to stay correct across DST transitions.
function zonedOffsetMs(timeZone, date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return (
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    ) - date.getTime()
  );
}

// Calendar components (year, month 1-12, day) of `date` rendered in `timeZone`.
function zonedDateParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hourCycle: "h23",
  });
  const parts = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return parts;
}

// Returns the absolute instant whose wall-clock rendering in `timeZone` is
// (year, month, day, hour, minute), using the calendar date given.
function zonedWallClockToInstant(year, month, day, hour, minute, timeZone) {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = zonedOffsetMs(timeZone, new Date(guess));
  let instant = guess - offset;
  // One correction pass to resolve DST-transition edge cases.
  const confirmOffset = zonedOffsetMs(timeZone, new Date(instant));
  if (confirmOffset !== offset) instant = guess - confirmOffset;
  return new Date(instant);
}

// Absolute [start, end] instants of the daily availability window whose
// wall-clock hours are `startTime`/`endTime`, on the calendar day of `date` in
// `timeZone`. The calendar day is resolved IN `timeZone`, so the same instant
// maps to the same window on every runtime (Vercel's lambdas run in UTC).
// Returns null when the window is invalid.
export function getDailyWindowBounds(date, startTime, endTime, timeZone = "UTC") {
  if (!date || !startTime || !endTime) return null;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;

  const tz = timeZone || "UTC";
  const { year, month, day } = zonedDateParts(new Date(date), tz);
  return [
    zonedWallClockToInstant(year, month, day, sh, sm, tz),
    zonedWallClockToInstant(year, month, day, eh, em, tz),
  ];
}

// Splits an interviewer's recurring daily availability window into fixed-length
// slots and marks each one as booked or available.
//
// - date:                the calendar day to generate slots for
// - availStartTime:      "HH:mm" start of the daily window (repeats every day)
// - availEndTime:        "HH:mm" end of the daily window
// - bookedSlots:         existing SCHEDULED bookings to check for conflicts
// - slotDurationMinutes: length of each slot (45 min throughout the app)
// - timeZone:            IANA timezone the window is anchored to (default UTC)
//
// The window's hours/minutes are applied onto the target day in `timeZone`, so
// it repeats automatically every day with no per-date setup. Past slots (cursor
// <= now) are skipped entirely so they never appear in the UI. A slot is marked
// isBooked if it overlaps any existing booking using a standard overlap check:
// slotStart < bookedEnd && slotEnd > bookedStart.
//frontend (Disables booked slots)
export function generateSlots(
  date,
  availStartTime,
  availEndTime,
  bookedSlots,
  slotDurationMinutes,
  timeZone = "UTC"
) {
  const bounds = getDailyWindowBounds(
    date,
    availStartTime,
    availEndTime,
    timeZone
  );
  if (!bounds) return [];
  const [start, end] = bounds;

  const now = new Date();
  const slots = [];
  let cursor = start;

  while (isBefore(cursor, end)) {
    const slotEnd = addMinutes(cursor, slotDurationMinutes);

    // Drop the last partial slot if it would overflow the window
    if (isAfter(slotEnd, end)) break;

    const isBooked = bookedSlots.some(
      (b) =>
        isBefore(cursor, new Date(b.endTime)) &&
        isAfter(slotEnd, new Date(b.startTime))
    );

    // Only push future slots — past ones are silently skipped
    if (isAfter(cursor, now)) {
      slots.push({
        startTime: cursor,
        endTime: slotEnd,
        isBooked,
        available: !isBooked,
      });
    }

    cursor = slotEnd;
  }

  return slots;
}
