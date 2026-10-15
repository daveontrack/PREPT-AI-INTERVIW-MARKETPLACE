# 🎯 InterviewLoop — AI-Powered Interview Marketplace

**Practice interviews with real experts. Get personalized, AI-powered feedback. Build your career with confidence.**

InterviewLoop is a full-stack interview preparation marketplace that connects candidates with experienced interviewers through real-time HD video sessions. Powered by Google Gemini, the platform analyzes completed interviews and generates detailed feedback on technical knowledge, communication, problem-solving, strengths, areas for improvement, and question-by-question performance.

Beyond live interviews, InterviewLoop offers AI-powered solo practice, CV analysis, skill progression tracking, collaborative coding, and experimental Ethiopian Sign Language (EthSL) assistance.

---

## ✨ Features

### 🎯 For Candidates

- **Discover Interviewers:** Browse and filter interviewers by Frontend, Backend, Full-Stack, Data Structures & Algorithms (DSA), System Design, Behavioral, DevOps, and Mobile Development.
- **Flexible Credit Plans:** Purchase subscription plans and use monthly credits to book 45-minute interview sessions, with rollover support where applicable.
- **HD Video Interviews:** Join real-time video sessions with persistent chat powered by Stream.
- **AI-Generated Questions:** Practice with interview questions tailored to the selected interview category.
- **Detailed AI Feedback:** Receive personalized reports covering technical skills, communication, problem-solving, strengths, improvement areas, concepts covered, and individual answers.
- **Session History:** Revisit previous interviews, recordings where available, and feedback reports.
- **Collaborative Code Editor:** Solve coding problems together using Monaco Editor and Yjs, with shared editing during interviews and code saved for later review.
- **Solo AI Mock Interviews:** Practice independently with Gemini without booking an interviewer.
- **CV / Resume Analysis:** Upload a PDF resume to extract skills and projects and generate personalized interview questions.
- **Skill Progress Tracking:** View performance trends across live interviews and solo practice sessions.
- **Calendar and Email Notifications:** Receive booking confirmations, calendar invitations (`.ics`), and scheduled reminders.
- **Experimental EthSL Assistance:** Explore sign-language recognition during live calls using browser-side MediaPipe landmarks and a separate Python recognition service. Review predictions before sharing confirmed text with the interviewer.

### 🧑‍💼 For Interviewers

- **Professional Profiles:** Showcase your experience, skills, specialties, and professional background.
- **Availability Management:** Configure your available interview times and session rates.
- **AI Question Generation:** Prepare relevant questions for upcoming sessions.
- **Credit-Based Earnings:** Earn credits from completed interviews and track your earnings.
- **Withdrawal Requests:** Request payouts with a transparent 20% platform fee.
- **Admin Payout Review:** Support a controlled payout approval process with email notifications and password-protected authorization.

### 🛡️ Platform and Security

- **Authentication and Roles:** Clerk authentication with role-based onboarding and access control.
- **Bot Protection:** Arcjet bot detection and rate limiting for critical actions.
- **Verified Webhooks:** HMAC-SHA256 verification for Stream webhook events.
- **Data Ownership:** Server-side authorization checks to prevent unauthorized access to users' data.
- **Protected AI Reports:** Feedback is accessible through authorized, user-scoped bookings.
- **Secure Configuration:** Sensitive API keys and secrets remain server-side.

---

## 🧱 Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16, App Router |
| Frontend | React 19, TypeScript, Tailwind CSS 4 |
| UI Components | shadcn-style components, animate-ui |
| Authentication | Clerk |
| Database | PostgreSQL on Supabase |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Video and Chat | Stream Video and Stream Chat |
| AI | Google Gemini (`gemini-3.5-flash`, as configured) |
| Collaborative Editor | Monaco Editor, Yjs, WebSocket synchronization |
| Sign Language | MediaPipe and FastAPI |
| Email | Resend and React Email |
| Security | Arcjet |
| Deployment | Vercel or another compatible Next.js hosting platform |

---

## 🚀 Getting Started

### Prerequisites

Install or prepare the following:

- Node.js 20 or a compatible version required by your dependencies
- npm
- PostgreSQL database (Supabase recommended)
- Clerk account
- Stream account
- Google AI Studio API key
- Resend account
- Arcjet API key
- Python and pip for the experimental sign-language service

### 1. Clone the Repository

```bash
git clone https://github.com/daveontrack/AI-Powered-Mock-Interview-Marketplace-Platform.git
cd AI-Powered-Mock-Interview-Marketplace-Platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root and configure the following variables.

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# PostgreSQL / Supabase
DATABASE_URL=

# Stream Video and Chat
NEXT_PUBLIC_STREAM_API_KEY=
STREAM_SECRET_KEY=

# Google Gemini
GEMINI_API_KEY=

# Arcjet Security
ARCJET_KEY=

# Resend Email
RESEND_API_KEY=

# Payout Administration
ADMIN_EMAIL=
ADMIN_PAYOUT_PASSWORD=

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Collaborative Code Editor
NEXT_PUBLIC_COLLAB_WS_URL=ws://localhost:1234

# Reminder Cron Security
CRON_SECRET=

# Ethiopian Sign Language Recognition
SIGN_SESSION_SECRET=
SIGN_RECOGNITION_WS_URL=ws://localhost:8000
```

**Important configuration notes:**

- Obtain each credential from its corresponding provider dashboard.
- Use strong, unique secrets for administrative and cron protection.
- Keep `.env.local` out of Git and never commit real API keys.
- Ensure `SIGN_SESSION_SECRET` matches between the Next.js application and the Python recognition service.
- Set `NEXT_PUBLIC_APP_URL` to your actual deployed domain in production. This is particularly important for email links.
- Use the exact variable names expected by your implementation. For example, some versions may support `STREAM_API_SECRET` as an alternative to `STREAM_SECRET_KEY`.

### 4. Set Up the Database

Configure your PostgreSQL connection string, then apply the existing Prisma migrations.

For local development:

```bash
npx prisma migrate dev
```

For production deployments:

```bash
npx prisma migrate deploy
```

If your project uses a separate Prisma generation script, run:

```bash
npx prisma generate
```

Use the existing migration history rather than resetting a database that contains important data.

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Start the Collaborative Code Editor

Open a second terminal in the project directory:

```bash
npm run collab
```

The collaboration server synchronizes code between interview participants. Without the shared WebSocket server, the editor may operate in local-only mode.

### 7. Start the EthSL Recognition Service

The experimental sign-language service runs separately from Next.js.

In a second or third terminal:

```powershell
cd sign-recognition-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Configure the same `SIGN_SESSION_SECRET` used by the main application, then start the service:

```powershell
$env:SIGN_SESSION_SECRET="your-shared-secret"
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

If your service requires `ALLOW_STUB=true` during development, configure it explicitly according to `sign-recognition-service/README.md`.

**Note:** Stub mode tests the integration pipeline; it does not provide genuine Ethiopian Sign Language recognition. Real recognition requires a compatible trained model and verified inference pipeline.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run collab` | Start the collaborative editing server |
| `npm run build` | Build the application for production |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Run TypeScript type checking |

Available scripts depend on the commands defined in `package.json`.

---

## 🗂️ Project Structure

```text
actions/                  # Server actions for bookings, feedback, payouts, etc.
app/
  (auth)/                 # Authentication pages
  (main)/                 # Authenticated application pages
  api/                    # API routes and webhook handlers
components/               # Reusable UI components
emails/                   # React Email templates
hooks/                    # Reusable React hooks
lib/                      # Database, AI, security, and helper utilities
prisma/                   # Prisma schema and migrations
public/                   # Static assets
sign-recognition-service/ # Python-based sign recognition service
proxy.js                  # Request interception and protection
```

The exact directory structure may vary as the project evolves.

---

## 🤖 How AI Interview Feedback Works

The live-interview feedback workflow follows these steps:

```text
1. Interview session ends
          ↓
2. Stream transcription becomes available
          ↓
3. Stream webhook sends an event
          ↓
4. Server verifies the webhook signature
          ↓
5. Transcript is retrieved and parsed
          ↓
6. Gemini analyzes the interview
          ↓
7. The generated feedback is validated and sanitized
          ↓
8. Feedback is saved to the database
          ↓
9. Booking is marked completed and interviewer earnings are recorded
          ↓
10. Candidate opens the completed booking to view feedback
```

The application also provides a manual **Generate Report** fallback for eligible past appointments when automatic processing has not completed, such as during local development.

The feedback pipeline should be idempotent so that repeated webhook events do not create duplicate earnings or inconsistent booking records.

---

## 🔒 Security Considerations

- **Webhook verification:** Verify Stream webhook signatures against the raw request body before processing event data.
- **Authorization:** Check authentication, user ownership, and permissions on every sensitive server action and API route.
- **Payout protection:** Restrict payout approval to authorized administrators and protect approval credentials.
- **AI output validation:** Validate generated scores, ratings, arrays, and other expected fields before saving feedback.
- **Rate limiting:** Apply appropriate limits to booking, withdrawal, and other abuse-sensitive actions.
- **Secret management:** Keep private API keys and administrative credentials out of client-side code.
- **File uploads:** Validate PDF uploads, enforce size limits, and process documents securely.
- **Sign-language privacy:** Obtain appropriate consent before processing or sharing video-derived information.
- **Idempotent financial operations:** Protect credit deductions, interviewer earnings, and payouts against duplicate processing.

These are security goals; verify each against the actual implementation before describing it as fully enforced.

---

## ☁️ Deployment

InterviewLoop can be deployed to Vercel or another platform that supports the application's runtime requirements.

1. Push the repository to GitHub.
2. Configure the required environment variables in your hosting provider.
3. Configure the production PostgreSQL database.
4. Apply migrations with `npx prisma migrate deploy`.
5. Set `NEXT_PUBLIC_APP_URL` to the production domain.
6. Configure the Stream webhook URL:

   ```text
   https://your-domain.com/api/webhooks/stream
   ```

7. Deploy the Next.js application using the hosting provider's build settings.
8. Deploy the collaborative WebSocket server separately if your hosting platform cannot run it as part of the Next.js application.
9. Deploy the Python recognition service separately and configure a secure WebSocket endpoint.
10. Configure the reminder cron schedule and its authentication secret if the application relies on scheduled reminders.
11. Test authentication, bookings, payments, webhook processing, AI feedback, email notifications, and authorization before going live.

**Production note:** The collaborative editor and sign-language recognition service require their own reachable endpoints. Configure HTTPS/WSS where appropriate, and do not expose internal service credentials.

---

## 🛣️ Future Improvements

Potential improvements include:

- A larger, validated Ethiopian Sign Language dataset and a trained recognition model.
- More robust CV-to-job matching and personalized interview preparation.
- Improved AI feedback calibration and progress analytics.
- Better accessibility, multilingual support, and mobile responsiveness.
- Stronger automated tests for booking conflicts, credit accounting, and webhook idempotency.
- Improved monitoring and error reporting for background processing and external services.

---

## 👨‍💻 Built With

**Next.js · React · TypeScript · Clerk · Stream · Google Gemini · Prisma · Supabase · Tailwind CSS · Python · FastAPI**

InterviewLoop aims to make interview preparation more accessible by combining expert guidance, practical coding sessions, and personalized AI feedback in one platform.
