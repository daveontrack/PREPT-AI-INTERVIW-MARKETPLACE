import arcjet, { tokenBucket } from "@arcjet/next";

/**
 * Creates a pre-configured Arcjet instance with token bucket rate limiting.
 *
 * @param {Object} options
 * @param {number} options.refillRate  - tokens added per interval
 * @param {string} options.interval    - e.g. "1h", "1m"
 * @param {number} options.capacity    - max burst size
 */
export function createRateLimiter({ refillRate, interval, capacity }) {
  return arcjet({
    key: process.env.ARCJET_KEY,
    characteristics: ["userId"], // fingerprint by Clerk user ID, not IP
    rules: [
      tokenBucket({
        mode: "LIVE",
        refillRate,
        interval,
        capacity,
      }),
    ],
  });
}

/**
 * Runs an Arcjet decision and returns an error string if denied, null if allowed.
 * userId is the Clerk user ID — passed as the fingerprint characteristic.
 *
 * @param {import("@arcjet/next").ArcjetInstance} aj
 * @param {Request} req
 * @param {string} userId
 * @returns {Promise<string|null>}
 */
export async function checkRateLimit(aj, req, userId) {
  const decision = await aj.protect(req, { userId, requested: 1 });
  if (decision.isDenied()) {
    return decision.reason.isRateLimit()
      ? "Too many requests. Please try again later."
      : "Request blocked.";
  }
  return null;
}
