import {
  ShieldCheck,
  Lock,
  Eye,
  Server,
  Users,
  Mail,
  Clock,
  FileCheck,
  Cookie,
} from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | EVKA',
  description:
    'Learn how EVKA collects, uses, protects, and retains your personal information when using our AI-powered mock interview platform.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      <div className='max-w-4xl mx-auto px-6 py-20'>
        {/* Header */}
        <div className='mb-16 text-center'>
          <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-medium mb-6'>
            <ShieldCheck className='w-3.5 h-3.5' />
            Legal Document
          </div>
          <h1 className='font-serif text-4xl md:text-5xl text-foreground tracking-tight mb-4'>
            Privacy Policy
          </h1>
          <p className='text-sm text-muted-foreground'>
            Last updated:{' '}
            {new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Content */}
        <div className='space-y-12 text-sm leading-relaxed'>
          {/* Section 1: Information Collected */}
          <section className='space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center'>
                <Eye className='w-4 h-4 text-amber-400' />
              </div>
              <h2 className='font-serif text-xl text-foreground'>
                1. Information We Collect
              </h2>
            </div>
            <p className='text-muted-foreground'>
              When you use EVKA, we collect information to provide, maintain,
              and improve our mock interview marketplace and AI services:
            </p>
            <ul className='list-none space-y-3 pl-4'>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>
                    Account &amp; Profile Information:
                  </strong>{' '}
                  Name, email address (via Clerk authentication), profile
                  picture, role selection (Candidate or Interviewer),
                  professional bio, and expertise details.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>
                    Interview Booking Details:
                  </strong>{' '}
                  Scheduled appointment dates, times, category selections,
                  interviewer assignments, and booking status logs.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>
                    Interview Recordings &amp; Transcripts:
                  </strong>{' '}
                  Video call streams, audio feeds, live chat messages, and
                  session transcripts processed through Stream video
                  infrastructure.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>
                    AI-Generated Content:
                  </strong>{' '}
                  Custom interview questions, transcript summaries, evaluation
                  metrics, scores, and performance feedback produced using
                  Google Gemini AI.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>
                    Payment &amp; Payout Information:
                  </strong>{' '}
                  Credit purchase records, session credit deductions,
                  interviewer credit earnings, and withdrawal payout logs.
                  Payment transactions are processed securely; we do not store
                  raw credit card numbers.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>
                    Device &amp; Usage Data:
                  </strong>{' '}
                  IP address, browser type, operating system, page visits,
                  feature interactions, and request timestamps collected for
                  security and performance monitoring.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 2: How Information Is Used */}
          <section className='space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center'>
                <Server className='w-4 h-4 text-amber-400' />
              </div>
              <h2 className='font-serif text-xl text-foreground'>
                2. How Information Is Used
              </h2>
            </div>
            <p className='text-muted-foreground'>
              We use the collected information for the following specific
              operational purposes:
            </p>
            <ul className='list-none space-y-3 pl-4'>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  Create, authenticate, and maintain candidate and interviewer
                  user accounts.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  Schedule, match, and facilitate live 1:1 video mock interviews
                  between candidates and expert interviewers.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  Process session transcripts using Google Gemini to generate
                  tailored interview questions and evaluation reports.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  Manage candidate credit balances, process interview payments,
                  and handle interviewer payout requests.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  Send transactional emails, appointment confirmations, and
                  payout status updates via Resend.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  Protect the platform against spam, bot traffic, automated
                  abuse, and rate limits via Arcjet.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 3: Third-Party Services */}
          <section className='space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center'>
                <Users className='w-4 h-4 text-amber-400' />
              </div>
              <h2 className='font-serif text-xl text-foreground'>
                3. Third-Party Services
              </h2>
            </div>
            <p className='text-muted-foreground'>
              EVKA integrates with trusted third-party providers to power
              essential infrastructure. These services process data according to
              their own privacy policies:
            </p>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4'>
              {[
                {
                  name: 'Clerk',
                  purpose: 'User authentication, identity & session management',
                },
                {
                  name: 'Stream',
                  purpose:
                    'Live video calling, audio streaming & real-time chat',
                },
                {
                  name: 'Google Gemini',
                  purpose:
                    'AI interview question generation & automated transcript feedback',
                },
                {
                  name: 'Resend',
                  purpose:
                    'Transactional emails & appointment notification delivery',
                },
                {
                  name: 'Supabase / PostgreSQL / Prisma',
                  purpose: 'Database hosting, data persistence & ORM mapping',
                },
                {
                  name: 'Arcjet',
                  purpose:
                    'Application security, rate limiting & bot prevention',
                },
              ].map((service) => (
                <div
                  key={service.name}
                  className='rounded-lg bg-muted/30 border border-border px-4 py-3'
                >
                  <p className='text-foreground font-medium text-xs'>
                    {service.name}
                  </p>
                  <p className='text-muted-foreground text-xs mt-0.5'>
                    {service.purpose}
                  </p>
                </div>
              ))}
            </div>
            <p className='text-muted-foreground mt-4 text-xs'>
              Each vendor maintains independent privacy standards. We encourage
              you to review their respective privacy statements.
            </p>
          </section>

          {/* Section 4: Data Security */}
          <section className='space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center'>
                <Lock className='w-4 h-4 text-amber-400' />
              </div>
              <h2 className='font-serif text-xl text-foreground'>
                4. Data Security
              </h2>
            </div>
            <p className='text-muted-foreground'>
              We employ reasonable technical and organizational measures to
              safeguard user information:
            </p>
            <ul className='list-none space-y-3 pl-4'>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0' />
                <span>
                  All data transmitted between your browser and our servers is
                  encrypted using standard TLS/SSL protocols.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0' />
                <span>
                  Database records are encrypted at rest via Supabase /
                  PostgreSQL cloud infrastructure.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0' />
                <span>
                  Authentication credentials are managed securely by Clerk with
                  multi-factor authentication support.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0' />
                <span>
                  Arcjet continuously screens network traffic to defend against
                  unauthorized access and brute-force attacks.
                </span>
              </li>
            </ul>
            <p className='text-muted-foreground text-xs mt-2 italic'>
              While we utilize rigorous protection standards, please note that
              no internet-based service can guarantee 100% absolute security.
            </p>
          </section>

          {/* Section 5: Data Retention */}
          <section className='space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center'>
                <Clock className='w-4 h-4 text-amber-400' />
              </div>
              <h2 className='font-serif text-xl text-foreground'>
                5. Data Retention
              </h2>
            </div>
            <p className='text-muted-foreground'>
              We retain user information for as long as necessary to provide
              service features and fulfill accounting requirements:
            </p>
            <ul className='list-none space-y-3 pl-4'>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>Account Profiles:</strong>{' '}
                  Maintained while your account remains active on EVKA.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>
                    Interview Records &amp; Feedback:
                  </strong>{' '}
                  Session logs, AI evaluation scores, and transcripts are stored
                  so candidates can review their progress until account
                  deletion.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>
                    Transaction &amp; Payout Records:
                  </strong>{' '}
                  Credit purchase logs and interviewer payout histories are
                  retained as required by financial regulations.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 6: User Rights */}
          <section className='space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center'>
                <FileCheck className='w-4 h-4 text-amber-400' />
              </div>
              <h2 className='font-serif text-xl text-foreground'>
                6. User Rights
              </h2>
            </div>
            <p className='text-muted-foreground'>
              As a user, you maintain rights regarding your data:
            </p>
            <ul className='list-none space-y-3 pl-4'>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>View Information:</strong>{' '}
                  Inspect your profile details, booking history, credit balance,
                  and AI feedback reports at any time.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>Update Profile:</strong>{' '}
                  Edit your profile details, availability, rates, and bio
                  directly in your dashboard settings.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>
                    Request Account Deletion:
                  </strong>{' '}
                  Request account closure and erasure of personal data by
                  contacting support.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>Privacy Support:</strong>{' '}
                  Contact our team for assistance with privacy questions or data
                  handling concerns.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 7: Cookies */}
          <section className='space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center'>
                <Cookie className='w-4 h-4 text-amber-400' />
              </div>
              <h2 className='font-serif text-xl text-foreground'>
                7. Cookies &amp; Tracking Technologies
              </h2>
            </div>
            <p className='text-muted-foreground'>
              EVKA uses essential cookies and local storage to keep your session
              secure and remember interface preferences:
            </p>
            <ul className='list-none space-y-3 pl-4'>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>
                    Authentication Cookies:
                  </strong>{' '}
                  Managed by Clerk to authenticate your browser session across
                  page reloads.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>
                    Preference Storage:
                  </strong>{' '}
                  Used to store UI preferences such as theme settings (dark
                  mode).
                </span>
              </li>
            </ul>
          </section>

          {/* Section 8: Contact */}
          <section className='space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center'>
                <Mail className='w-4 h-4 text-amber-400' />
              </div>
              <h2 className='font-serif text-xl text-foreground'>
                8. Contact Us
              </h2>
            </div>
            <p className='text-muted-foreground'>
              For questions, privacy inquiries, or data protection requests
              regarding this Privacy Policy, please reach out to us:
            </p>
            <div className='mt-6 rounded-xl bg-amber-400/5 border border-amber-400/20 p-5'>
              <p className=' text-foreground text-sm'>
                Privacy Support Email:{' '}
                <a
                  href='mailto:dawitberiso406@gmail.com'
                  className='text-amber-400 hover:text-amber-300 underline underline-offset-2 font-medium'
                >
                  dawitberiso406@gmail.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
