<div align="center">

# 🎯 EVKA — AI Interview Marketplace

**Practice interviews with real experts. Get AI-powered feedback after every session.**

</div>

EVKA is a full-stack interview marketplace that connects **candidates** with **professional interviewers** over HD video calls. Sessions are analyzed by **Google Gemini**, which generates a detailed feedback report — technical, communication and problem-solving scores, strengths, improvements, concepts covered, and a question-by-question breakdown.

---

## ✨ Features

### For candidates 🎯

- Browse interviewers by category (Frontend, Backend, System Design, DSA, Behavioral, DevOps, Mobile)
- Book 45-minute sessions using monthly **credits** (Free / Starter / Pro plans, with rollover)
- Join **HD video calls** with persistent chat via Stream
- Get live **AI-generated questions** tailored to the interview category
- Receive a full **AI feedback report** after every completed interview
- Review session **recordings** and re-open feedback any time

### For interviewers 🧑‍💼

- Set your own availability and session rates
- **AI question generator** for each session
- Earn credits per session — track earnings and **withdraw** any time (20% platform fee)
- Admin **review & approve** flow for payout requests (email notification → password-gated approval)

### Platform 🛡️

- Clerk authentication with role-based onboarding
- Arcjet bot protection & rate limiting on critical actions
- Signed **Stream webhook** verification (HMAC) for transcription/recording events
- Server-side ownership checks on every data query (no cross-user data exposure)

---

## 🧱 Tech Stack

| Layer        | Technology                                                                     |
| ------------ | ------------------------------------------------------------------------------ |
| Framework    | [Next.js 16](https://nextjs.org) (App Router) + React 19                       |
| Auth         | [Clerk](https://clerk.com)                                                     |
| Database     | PostgreSQL (Supabase) via [Prisma 7](https://prisma.io) + `@prisma/adapter-pg` |
| Video & Chat | [Stream Video](https://getstream.io) + Stream Chat (transcription, recording)  |
| AI           | [Google Gemini](https://ai.google.dev) (`gemini-3.5-flash`)                    |
| Emails       | [Resend](https://resend.com) + React Email                                     |
| Protection   | [Arcjet](https://arcjet.com) (bot detection, rate limiting)                    |
| Styling      | Tailwind CSS 4, shadcn-style UI components, animate-ui                         |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+**
- A **PostgreSQL** database (Supabase recommended)
- Accounts/keys for: Clerk, Stream, Google AI, Resend, Arcjet

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the values into a `.env.local` file (`.env*` files are gitignored):

```env
# ── Clerk (dashboard.clerk.com) ───────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# ── Database (Supabase → Settings → Database) ─────────────
DATABASE_URL=postgresql://...

# ── Stream (dashboard.getstream.io) ────────────────────────
NEXT_PUBLIC_STREAM_API_KEY=...
STREAM_SECRET_KEY=...          # (STREAM_API_SECRET also works)

# ── Google AI (aistudio.google.com) ────────────────────────
GEMINI_API_KEY=...

# ── Arcjet (console.arcjet.com) ────────────────────────────
ARCJET_KEY=...

# ── Resend (resend.com) ────────────────────────────────────
RESEND_API_KEY=...

# ── Payout admin (used for /payout/[id] authorization) ─────
ADMIN_EMAIL=admin@example.com
ADMIN_PAYOUT_PASSWORD=change-me

# ── App URL (must be the deployed domain in production!) ───
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ In production, `NEXT_PUBLIC_APP_URL` **must** be your real domain (e.g. `https://EVKA.example.com`) — payout email links are built from it. On Vercel it falls back to `VERCEL_URL` automatically if unset.

### 3. Set up the database

```bash
npx prisma migrate dev   # applies the existing migrations
```

Optional: seed a feedback record for a booking (`prisma/seed.js` — edit the `BOOKING_ID` first).

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📜 Available Scripts

| Command            | Description                               |
| ------------------ | ----------------------------------------- |
| `npm run dev`      | Start the Next.js dev server              |
| `npm run build`    | Generate Prisma client + production build |
| `npm start`        | Serve the production build                |
| `npm run lint`     | Run ESLint                                |
| `npx tsc --noEmit` | Type-check the project                    |

---

## 🗂️ Project Structure

```
actions/        # Server actions (booking, calls, feedback, payout, dashboard…)
app/
  (auth)/       # Clerk sign-in / sign-up
  (main)/       # Authenticated app: appointments, call room, dashboard,
                #   explore, interviewers, onboarding, payout
  api/          # Route handlers (Stream webhook)
  page.jsx      # Landing page (hero, features, pricing, CTA)
components/     # Reusable UI, shadcn-style ui/, animate-ui, feedback modal
emails/         # React Email templates (withdrawal requests)
hooks/          # use-fetch, use-is-in-view, use-controlled-state
lib/            # Prisma client, helpers, Gemini feedback pipeline, Arcjet,
                #   Stream credential helper, URL builder
prisma/         # Schema + migrations
public/         # Static assets (logos, hero images)
proxy.js        # Middleware (Clerk + Arcjet)
```

---

## 🤖 How AI Feedback Works

```
Call ends
  ↓
Stream transcription ready  →  POST /api/webhooks/stream  (HMAC-verified)
  ↓
Transcript downloaded & parsed (JSONL → conversation)
  ↓
Gemini (gemini-3.5-flash) analyzes the session
  ↓
Report sanitized (scores clamped 1–10, enum rating validated, arrays trimmed)
  ↓
Saved to DB + booking marked COMPLETED + interviewer credited
  ↓
Candidate opens the past appointment → "View Feedback" → full report modal
```

The webhook path is automatic. A manual **"Generate report"** fallback is available on past appointments if the webhook didn't fire (e.g. local development).

---

## 🔒 Security Notes

- **Stream webhooks** are verified with HMAC-SHA256 over the raw request body — forged events are rejected with `401`.
- **Payout pages** (`/payout/[id]`) are server-protected: unauthenticated and non-admin requests return `404` (no existence leak), and approval requires `ADMIN_EMAIL` + password.
- **AI feedback** is only readable through the authenticated user's own scoped bookings — there is no feedback-by-ID endpoint.
- **API keys** live only on the server — nothing sensitive is exposed to the client bundle.
- **Arcjet** rate limits booking and withdrawal actions.

---

## ☁️ Deployment

The app deploys anywhere Next.js runs (Vercel, Railway, a VPS…).

1. Push the repo to GitHub.
2. Set **all** environment variables from the table above on the host (use the real domain for `NEXT_PUBLIC_APP_URL`).
3. Run `npx prisma migrate deploy` against the production database.
4. Configure the **Stream webhook** in the Stream dashboard to point at `https://<your-domain>/api/webhooks/stream`.
5. Deploy with `npm run build && npm start` (or the platform's build command).

---

<div align="center">

**Built with Next.js · Clerk · Stream · Gemini · Prisma · Supabase**

</div>
