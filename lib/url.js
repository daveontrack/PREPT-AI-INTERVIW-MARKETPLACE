// Single source of truth for the app's absolute base URL — used to build links
// that appear in transactional emails (e.g. the payout "Review & Approve" link).
//
// Resolution order:
//   1. NEXT_PUBLIC_APP_URL — the explicit deployment URL (recommended, e.g.
//      https://interviewloop.example.com — must NOT include a path like /payout)
//   2. VERCEL_URL          — auto-provided by Vercel when deployed there
//   3. http://localhost:3000 — local development fallback

function stripTrailingSlash(url) {
  return url.replace(/\/+$/, "");
}

export function getAppUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return stripTrailingSlash(`https://${vercelUrl}`);

  return "http://localhost:3000";
}

// Joins a path (e.g. "/payout/abc123") onto the app base URL. Tolerates a
// trailing slash on the base and/or a leading slash on the path, so it always
// produces exactly one slash: https://example.com/payout/abc123
export function buildAppUrl(path = "") {
  const base = getAppUrl();
  const cleanPath = String(path ?? "").trim().replace(/^\/+/, "");
  return cleanPath ? `${base}/${cleanPath}` : base;
}
