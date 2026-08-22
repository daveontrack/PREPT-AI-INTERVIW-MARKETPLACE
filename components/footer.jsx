'use client'

import Link from 'next/link'
import { GoldTitle, GrayTitle } from '@/components/reusables'
import { Button } from '@/components/ui/button'
import { Sparkles, ShieldCheck, ArrowRight } from 'lucide-react'

export default function Footer() {
  return (
    <footer className='relative z-10 bg-background border-t border-border text-foreground pt-16 pb-12 overflow-hidden'>
      {/* Subtle Background Glow */}
      <div className='pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-[radial-gradient(ellipse_at_bottom,rgba(251,191,36,0.06)_0%,transparent_70%)]' />

      <div className='max-w-7xl mx-auto px-6 sm:px-8 relative'>
        {/* TOP SECTION: Callout Banner */}
        <div className='rounded-2xl bg-gradient-to-r from-muted via-card to-muted border border-border p-8 mb-16 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl'>
          <div className='flex items-center gap-4'>
            <div className='w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0'>
              <Sparkles className='w-6 h-6' />
            </div>
            <div>
              <h3 className='font-serif text-xl text-foreground tracking-tight'>
                Ready to crack your dream tech role?
              </h3>
              <p className='text-xs text-muted-foreground font-light mt-0.5'>
                Join 2,400+ engineers practicing with senior interviewers and AI
                co-pilots.
              </p>
            </div>
          </div>
          <div className='flex items-center gap-3 w-full md:w-auto'>
            {/* <Link href="/onboarding" className="w-full md:w-auto">
              <Button variant="gold" size="sm" className="w-full md:w-auto px-5 py-2.5 text-xs font-semibold">
                Get Started Free <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link> */}
          </div>
        </div>

        {/* MAIN GRID */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-16 border-b border-border'>
          {/* COL 1: Brand & Status */}
          <div className='lg:col-span-2 flex flex-col gap-5'>
            <Link href='/' className='flex items-center gap-2'>
              <img src='/logo.png' alt='EVKA Logo' className='h-8 w-auto' />
            </Link>

            <p className='text-xs text-muted-foreground font-light leading-relaxed max-w-sm'>
              The premier AI-powered 1:1 mock interview platform. Connect with
              elite technical interviewers from FAANG, practice with real-time
              AI co-pilots, and get automated transcript evaluation.
            </p>

            {/* Operational Badge */}
            <div className='inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs w-fit'>
              <span className='relative flex h-2 w-2'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500'></span>
              </span>
              <span className='font-medium'>All Systems Operational</span>
            </div>

            {/* Security Badge */}
            <div className='flex items-center gap-2 text-xs text-muted-foreground mt-1'>
              <ShieldCheck className='w-4 h-4 text-amber-400/80' />
              <span>Protected by Arcjet &amp; Stream Encrypted Video</span>
            </div>
          </div>

          {/* COL 2: Platform Links */}
          <div className='flex flex-col gap-3'>
            <p className='text-xs font-semibold text-amber-400 uppercase tracking-widest'>
              Platform
            </p>
            <ul className='flex flex-col gap-2.5 text-xs text-muted-foreground'>
              <li>
                <Link
                  href='/explore'
                  className='hover:text-amber-300 transition-colors'
                >
                  Browse Interviewers
                </Link>
              </li>
              <li>
                <Link
                  href='/dashboard'
                  className='hover:text-amber-300 transition-colors'
                >
                  Interviewer Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href='/onboarding'
                  className='hover:text-amber-300 transition-colors'
                >
                  Role Onboarding
                </Link>
              </li>
              <li>
                <Link
                  href='/appointments'
                  className='hover:text-amber-300 transition-colors'
                >
                  My Appointments
                </Link>
              </li>
            </ul>
          </div>

          {/* COL 3: Interview Categories */}
          <div className='flex flex-col gap-3'>
            <p className='text-xs font-semibold text-amber-400 uppercase tracking-widest'>
              Categories
            </p>
            <ul className='flex flex-col gap-2.5 text-xs text-muted-foreground'>
              <li>
                <Link
                  href='/explore?category=FRONTEND'
                  className='hover:text-amber-300 transition-colors'
                >
                  Frontend Engineering
                </Link>
              </li>
              <li>
                <Link
                  href='/explore?category=BACKEND'
                  className='hover:text-amber-300 transition-colors'
                >
                  Backend Systems
                </Link>
              </li>
              <li>
                <Link
                  href='/explore?category=FULLSTACK'
                  className='hover:text-amber-300 transition-colors'
                >
                  Fullstack Architecture
                </Link>
              </li>
              <li>
                <Link
                  href='/explore?category=SYSTEM_DESIGN'
                  className='hover:text-amber-300 transition-colors'
                >
                  System Design
                </Link>
              </li>
              <li>
                <Link
                  href='/explore?category=BEHAVIORAL'
                  className='hover:text-amber-300 transition-colors'
                >
                  Behavioral &amp; Leadership
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className='pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-light'>
          <div className='flex items-center gap-2'>
            <span>
              © {new Date().getFullYear()} EVKA. Built with Next.js, Supabase,
              Stream &amp; Gemini AI.
            </span>
          </div>

          <div className='flex items-center gap-6'>
            <Link
              href='/privacy'
              className='hover:text-foreground transition-colors'
            >
              Privacy Policy
            </Link>
            <Link
              href='/terms'
              className='hover:text-foreground transition-colors'
            >
              Terms of Service
            </Link>
            <span className='hover:text-foreground transition-colors cursor-pointer'>
              Cookie Settings
            </span>
          </div>

          <div className='flex items-center gap-3'>
            <span className='text-muted-foreground font-medium'>
              Crafted with ❤️ by{' '}
              <strong className='text-amber-400'>DaveOnTrack</strong>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
