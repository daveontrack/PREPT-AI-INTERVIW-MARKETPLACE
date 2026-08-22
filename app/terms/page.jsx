import {
  FileText,
  Scale,
  AlertTriangle,
  CreditCard,
  UserX,
  Gavel,
  UserCheck,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Mail,
  CalendarCheck,
} from 'lucide-react'

export const metadata = {
  title: 'Terms of Service | EVKA',
  description:
    'Terms and conditions for using the EVKA AI-powered mock interview marketplace.',
}

export default function TermsPage() {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      <div className='max-w-4xl mx-auto px-6 py-20'>
        {/* Header */}
        <div className='mb-16 text-center'>
          <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-medium mb-6'>
            <FileText className='w-3.5 h-3.5' />
            Legal Document
          </div>
          <h1 className='font-serif text-4xl md:text-5xl text-foreground tracking-tight mb-4'>
            Terms of Service
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
          {/* Section 1: Acceptance */}
          <section className='space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center'>
                <Scale className='w-4 h-4 text-amber-400' />
              </div>
              <h2 className='font-serif text-xl text-foreground'>
                1. Acceptance of Terms
              </h2>
            </div>
            <p className='text-muted-foreground'>
              By accessing, registering, or using EVKA (&quot;the
              Platform&quot;), you agree to be bound by these Terms of Service.
              If you do not agree to all terms, you may not access or use the
              Platform. Continued use of EVKA constitutes your acceptance of
              these Terms.
            </p>
          </section>

          {/* Section 2: Eligibility */}
          <section className='space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center'>
                <UserCheck className='w-4 h-4 text-amber-400' />
              </div>
              <h2 className='font-serif text-xl text-foreground'>
                2. Eligibility
              </h2>
            </div>
            <p className='text-muted-foreground'>
              You must meet applicable legal age requirements (at least 18 years
              of age or legal age of majority in your jurisdiction) to create an
              account, purchase credits, or offer mock interview services on
              EVKA. By creating an account, you represent and warrant that you
              meet these eligibility requirements.
            </p>
          </section>

          {/* Section 3: User Accounts */}
          <section className='space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center'>
                <CreditCard className='w-4 h-4 text-amber-400' />
              </div>
              <h2 className='font-serif text-xl text-foreground'>
                3. User Accounts &amp; Roles
              </h2>
            </div>
            <p className='text-muted-foreground'>
              Users may register on EVKA as either Candidates or Interviewers:
            </p>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4'>
              <div className='rounded-lg bg-muted/30 border border-border px-5 py-4'>
                <p className='text-foreground font-semibold text-sm mb-1'>
                  👤 Candidate
                </p>
                <p className='text-muted-foreground text-xs'>
                  Browse interviewers, purchase credits, book mock interview
                  sessions, receive AI evaluations, and manage appointments.
                </p>
              </div>
              <div className='rounded-lg bg-muted/30 border border-border px-5 py-4'>
                <p className='text-foreground font-semibold text-sm mb-1'>
                  🎯 Interviewer
                </p>
                <p className='text-muted-foreground text-xs'>
                  Publish availability timeslots, conduct mock interviews, set
                  rates, receive payouts, and build a public profile.
                </p>
              </div>
            </div>
            <p className='text-muted-foreground mt-4'>
              You are responsible for keeping your account credentials
              (authenticated via Clerk) secure, providing accurate profile
              information, and accepting responsibility for all activities
              conducted under your account.
            </p>
          </section>

          {/* Section 4: Platform Use & Prohibited Conduct */}
          <section className='space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center'>
                <AlertTriangle className='w-4 h-4 text-amber-400' />
              </div>
              <h2 className='font-serif text-xl text-foreground'>
                4. Platform Use &amp; Prohibited Conduct
              </h2>
            </div>
            <p className='text-muted-foreground'>
              You agree NOT to engage in any of the following prohibited
              activities:
            </p>
            <ul className='list-none space-y-3 pl-4'>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0' />
                <span>
                  Upload malicious content, viruses, or harmful code to the
                  platform.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0' />
                <span>
                  Attempt unauthorized access to other user accounts,
                  administrative dashboards, or system databases.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0' />
                <span>
                  Abuse or overload AI features, video infrastructure, or API
                  endpoints.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0' />
                <span>
                  Disrupt interview sessions, engage in harassment, or violate
                  applicable laws.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0' />
                <span>
                  Record, publish, or redistribute video calls or private
                  interview data without mutual consent.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 5: Interview Bookings */}
          <section className='space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center'>
                <CalendarCheck className='w-4 h-4 text-amber-400' />
              </div>
              <h2 className='font-serif text-xl text-foreground'>
                5. Interview Bookings
              </h2>
            </div>
            <ul className='list-none space-y-3 pl-4'>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>
                    Booking Mechanism:
                  </strong>{' '}
                  Candidates select available timeslots published by
                  interviewers and confirm booking using platform credits.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>Attendance:</strong> Both
                  candidates and interviewers are expected to join the video
                  session on time.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>
                    Cancellations &amp; Rescheduling:
                  </strong>{' '}
                  Cancellations or rescheduling requests must comply with
                  platform appointment guidelines prior to session start.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 6: Payments & Credits */}
          <section className='space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center'>
                <CreditCard className='w-4 h-4 text-amber-400' />
              </div>
              <h2 className='font-serif text-xl text-foreground'>
                6. Payments, Credits &amp; Payouts
              </h2>
            </div>
            <ul className='list-none space-y-3 pl-4'>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>Credit Purchases:</strong>{' '}
                  Candidates purchase credits to book mock interviews. Credit
                  balances and rates are displayed on the platform.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>
                    Credit Deductions:
                  </strong>{' '}
                  Credits are deducted from candidate balances upon appointment
                  confirmation.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>
                    Interviewer Payouts:
                  </strong>{' '}
                  Interviewers accumulate credit earnings for completed
                  sessions. Payout requests are subject to administrative
                  review.
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0' />
                <span>
                  <strong className='text-foreground'>Refund Policy:</strong>{' '}
                  Refunds for unfulfilled sessions or technical failures are
                  reviewed on a case-by-case basis.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 7: AI Features Disclaimer */}
          <section className='space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center'>
                <Sparkles className='w-4 h-4 text-amber-400' />
              </div>
              <h2 className='font-serif text-xl text-foreground'>
                7. AI Features Disclaimer
              </h2>
            </div>
            <p className='text-muted-foreground'>
              AI-generated interview questions, evaluation metrics, transcript
              summaries, and performance feedback provided via Google Gemini are
              strictly for educational and interview preparation purposes. AI
              feedback may not always be 100% accurate, complete, or reflective
              of actual corporate hiring decisions.
            </p>
          </section>

          {/* Section 8: Intellectual Property */}
          <section className='space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center'>
                <ShieldAlert className='w-4 h-4 text-amber-400' />
              </div>
              <h2 className='font-serif text-xl text-foreground'>
                8. Intellectual Property
              </h2>
            </div>
            <p className='text-muted-foreground'>
              The EVKA platform, branding, logos, design assets, and source code
              are the exclusive property of EVKA. Users retain ownership of
              content they submit (such as profile details or custom questions)
              while granting EVKA a non-exclusive license to process and display
              such content to operate the service.
            </p>
          </section>

          {/* Section 9: Limitation of Liability */}
          <section className='space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center'>
                <Gavel className='w-4 h-4 text-amber-400' />
              </div>
              <h2 className='font-serif text-xl text-foreground'>
                9. Limitation of Liability
              </h2>
            </div>
            <p className='text-muted-foreground'>
              EVKA is provided on an &quot;AS IS&quot; and &quot;AS
              AVAILABLE&quot; basis without warranties of any kind. To the
              maximum extent permitted by law, EVKA is not liable for indirect,
              incidental, or consequential damages arising from your use of the
              platform.
            </p>
          </section>

          {/* Section 10: Account Suspension */}
          <section className='space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center'>
                <UserX className='w-4 h-4 text-amber-400' />
              </div>
              <h2 className='font-serif text-xl text-foreground'>
                10. Account Suspension &amp; Termination
              </h2>
            </div>
            <p className='text-muted-foreground'>
              EVKA reserves the right to suspend or terminate accounts that
              violate these Terms, engage in fraud, or compromise security.
              Users may request account closure at any time through support.
            </p>
          </section>

          {/* Section 11: Changes to Terms */}
          <section className='space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center'>
                <RefreshCw className='w-4 h-4 text-amber-400' />
              </div>
              <h2 className='font-serif text-xl text-foreground'>
                11. Changes to Terms
              </h2>
            </div>
            <p className='text-muted-foreground'>
              We reserve the right to update these Terms of Service at any time.
              Continued use of EVKA after changes are posted constitutes
              acceptance of the updated Terms.
            </p>
          </section>

          {/* Section 12: Contact */}
          <section className='space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center'>
                <Mail className='w-4 h-4 text-amber-400' />
              </div>
              <h2 className='font-serif text-xl text-foreground'>
                12. Contact &amp; Legal Support
              </h2>
            </div>
            <p className='text-muted-foreground'>
              For any legal or service-related questions regarding these Terms,
              please contact us:
            </p>
            <div className='mt-6 rounded-xl bg-amber-400/5 border border-amber-400/20 p-5'>
              <p className='text-foreground text-sm'>
                Legal Support Email:{' '}
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
