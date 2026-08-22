import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  GoldTitle,
  GrayTitle,
  SectionHeading,
  SectionLabel,
} from '@/components/reusables'
import Link from 'next/link'
import { AI_TAGS, AVATARS, LOGOS, ROLES, SLOTS } from '@/lib/data'
import Image from 'next/image'
import { StarsBackgroundDemo } from '@/components/demo-components-backgrounds-stars'
import { ArrowUpRight, Bot, Star, Wallet } from 'lucide-react'
import BentoCard from '@/components/BentoCard'
import PricingSection from '@/components/PricingSection'
import FaqAccordion from '@/components/FaqAccordion'
import HowItWorks from '@/components/HowItWorks'
import DemoPreview from '@/components/DemoPreview'
import Testimonials from '@/components/Testimonials'

import HeroPreview from '@/components/HeroPreview'

function MockUI({ rows = 3 }) {
  const widths = ['w-4/5', 'w-3/5', 'w-2/5', 'w-4/5', 'w-1/2']
  const colors = [
    'bg-muted/50',
    'bg-muted/50',
    'bg-amber-400/15',
    'bg-muted/50',
    'bg-muted/50',
  ]

  return (
    <div className='mt-5 rounded-xl bg-muted/30 backdrop-blur-md border border-border overflow-hidden'>
      <div className='h-9 bg-white/5 border-b border-border flex items-center px-3.5 gap-1.5'>
        <span className='w-2 h-2 rounded-full bg-[#ff5f57]' />
        <span className='w-2 h-2 rounded-full bg-[#ffbd2e]' />
        <span className='w-2 h-2 rounded-full bg-[#28c840]' />
      </div>
      <div className='p-4 flex flex-col gap-2'>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full ${widths[i]} ${colors[i]}`}
          />
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div className='bg-background overflow-x-hidden'>
      {/* HERO */}
      <section className='relative min-h-screen flex items-center overflow-hidden'>
        {/* ─── Background layers ─── */}
        <StarsBackgroundDemo />

        {/* Gradient mesh */}
        <div className='absolute inset-0 pointer-events-none'>
          <div className='absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-amber-500/[0.07] blur-[140px]' />
          <div className='absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-orange-600/[0.05] blur-[120px]' />
          <div className='absolute top-[30%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-amber-300/[0.04] blur-[100px]' />
        </div>

        {/* Grid overlay */}
        <div
          className='absolute inset-0 opacity-[0.02] pointer-events-none'
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* ─── Content ─── */}
        <div className='relative z-10 w-full max-w-350 mx-auto px-6 sm:px-10 lg:px-16 py-24 sm:py-32'>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center'>
            {/* ─── LEFT — 7 cols ─── */}
            <div className='lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left'>
              {/* Pill */}
              <div className='animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both mb-8'>
                <div className='inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/4 backdrop-blur-md border border-border shadow-[0_0_20px_-4px_rgba(251,191,36,0.1)]'>
                  <span className='relative flex h-2 w-2'>
                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75' />
                    <span className='relative inline-flex rounded-full h-2 w-2 bg-amber-400' />
                  </span>
                  <span className='text-xs text-foreground font-medium'>
                    Powered by AI — Now in Beta
                  </span>
                  <ArrowUpRight size={12} className='text-amber-400' />
                </div>
              </div>

              {/* Headline — massive, staggered */}
              <h1 className='font-serif text-[clamp(2.7rem,7vw,6.5rem)] tracking-[-0.04em] leading-[0.9] mb-8'>
                <span className='block animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 fill-mode-both bg-linear-to-br from-stone-700 via-stone-500 to-stone-400 dark:from-stone-200 dark:via-stone-300 dark:to-stone-500 bg-clip-text text-transparent pb-3'>
                  Ace your next interview
                </span>

                <span className='block animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 fill-mode-both bg-linear-to-br from-amber-300 via-amber-400 to-amber-600 bg-clip-text text-transparent'>
                  with real experts
                </span>
              </h1>

              {/* Sub */}
              <p className='text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed mb-10 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-[350ms] fill-mode-both'>
                Book 1:1 mock interviews with senior engineers from top
                companies. Get AI-powered feedback, role-specific questions, and
                the confidence to land your dream job.
              </p>

              {/* CTAs */}
              <div className='flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-12 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-[450ms] fill-mode-both'>
                <Link href='/onboarding'>
                  <Button variant='gold' size='hero'>
                    Get started free
                  </Button>
                </Link>
                <Link href='/explore'>
                  <Button variant='outline' size='hero'>
                    Browse Interviewers →
                  </Button>
                </Link>
              </div>

              {/* Social proof — horizontal bar */}
              <div className='animate-in fade-in slide-in-from-bottom-5 duration-700 delay-[550ms] fill-mode-both'>
                <div className='inline-flex items-center gap-5 px-5 py-3 rounded-2xl bg-muted/30 backdrop-blur-sm border border-border/60'>
                  <div className='flex'>
                    {AVATARS.map((av, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-full border-2 border-background overflow-hidden ${
                          i > 0 ? '-ml-2.5' : ''
                        }`}
                      >
                        <Image
                          src={av.src}
                          alt='user'
                          width={32}
                          height={32}
                          className='w-full h-full object-cover'
                        />
                      </div>
                    ))}
                  </div>
                  <div className='w-px h-8 bg-accent' />
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium text-foreground'>
                      2,400+ engineers
                    </span>
                    <span className='text-[11px] text-muted-foreground'>
                      cracked FAANG via EVKA
                    </span>
                  </div>
                  <div className='w-px h-8 bg-accent' />
                  <div className='flex gap-0.5'>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={12}
                        className='text-amber-400'
                        fill='currentColor'
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── RIGHT — 5 cols, layered visual ─── */}
            <div className='lg:col-span-5 animate-in fade-in slide-in-from-right-12 duration-1000 delay-300 fill-mode-both'>
              <HeroPreview />
            </div>
          </div>
        </div>

        {/* Bottom fade into next section */}
        <div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none' />
      </section>

      {/* LOGOS */}
      <section className='relative z-10 border-y border-border py-14 overflow-hidden'>
        <p className='text-center text-xs font-medium text-muted-foreground/70 tracking-widest uppercase mb-8'>
          Interviewees landed roles at
        </p>

        <div className='relative w-full overflow-hidden'>
          <div className='pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-24 bg-linear-to-r from-background to-transparent' />
          <div className='pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-24 bg-linear-to-l from-background to-transparent' />

          <div className='animate-marquee flex items-center gap-16'>
            {[...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS].map((l, idx) => (
              <Image
                key={`${l.alt}-${idx}`}
                src={l.src}
                alt={l.alt}
                width={100}
                height={50}
                className='h-7 w-auto opacity-60 grayscale shrink-0 hover:opacity-100 hover:grayscale-0 transition-all duration-300'
              />
            ))}
          </div>
        </div>
      </section>
      {/* How it works */}
      <HowItWorks />

      {/* DEMO PREVIEW */}
      <DemoPreview />

      {/* FEATURES BENTO GRID */}
      <section className='relative z-10 py-28 max-w-5xl mx-auto px-6'>
        <div className='text-center mb-16'>
          <SectionLabel>Features</SectionLabel>
          <SectionHeading
            gray='Everything you need,'
            gold="nothing you don't"
          />
        </div>
        <div className='grid grid-cols-12 gap-4'>
          <div className='col-span-12 md:col-span-7'>
            <BentoCard
              icon={<Bot size={20} className='text-amber-400' />}
              title={<GrayTitle>AI Question Generator</GrayTitle>}
              desc="Interviewers get a live AI co-pilot generating role-specific questions on demand — system design, behavioural, DSA — all tailored to the candidate's level."
            >
              <div className='flex flex-wrap gap-2 mt-5'>
                {AI_TAGS.map((t) => (
                  <Badge key={t.label} variant={t.active ? 'gold' : 'outline'}>
                    {t.label}
                  </Badge>
                ))}
              </div>
            </BentoCard>
          </div>
          <div className='col-span-12 md:col-span-5'>
            <BentoCard
              icon={<Wallet size={16} className='text-amber-400' />}
              title={<GrayTitle>Credit System</GrayTitle>}
              desc='Subscribe for monthly credits. Book sessions. Interviewers earn and withdraw any time.'
            >
              <div className='mt-5 rounded-xl bg-muted/30 backdrop-blur-md border border-border p-5 flex justify-between items-end'>
                <div>
                  <p className='text-xs text-muted-foreground/70 mb-1'>
                    Your balance
                  </p>
                  <p className='font-serif text-4xl leading-none bg-linear-to-br from-amber-500 to-amber-700 dark:from-amber-300 dark:to-amber-500 bg-clip-text text-transparent'>
                    28
                  </p>
                  <p className='text-xs text-muted-foreground/70 mt-1'>
                    credits remaining
                  </p>
                </div>

                <Badge variant='secondary'>+10 this month</Badge>
              </div>
            </BentoCard>
          </div>
          <div className='col-span-12 md:col-span-4'>
            <BentoCard
              icon='📹'
              title='HD Video Calls'
              desc='Powered by Stream. Screen sharing, recording, and instant playback links — all built in.'
            >
              <MockUI rows={3} />
            </BentoCard>
          </div>
          <div className='col-span-12 md:col-span-4'>
            <BentoCard
              icon='💬'
              title='Persistent Chat'
              desc='Message your interviewer before and after the call. Share resources, prep notes, and follow-ups in one thread.'
            />
          </div>
          <div className='col-span-12 md:col-span-4'>
            <BentoCard
              icon='🔒'
              title='Security by Arcjet'
              desc='Bot protection, rate limiting, and abuse prevention baked into every API route.'
            />
          </div>
          <div className='col-span-12 md:col-span-6'>
            <BentoCard
              icon='📊'
              title={<GrayTitle>AI Feedback Reports</GrayTitle>}
              desc='Post-interview analysis by Gemini with actionable insights.'
            >
              <MockUI rows={5} />
            </BentoCard>
          </div>
          <div className='col-span-12 md:col-span-6'>
            <BentoCard
              icon='🗓️'
              title={<GoldTitle>Slot-based Scheduling</GoldTitle>}
              desc='Interviewers set availability once. Interviewees pick from open slots and confirm with one click — no back-and-forth needed.'
            >
              <div className='flex flex-wrap gap-2 mt-5'>
                {SLOTS.map((s) => (
                  <span
                    key={s.label}
                    className={`text-xs px-3 py-1.5 rounded-lg border ${s.cls}`}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <Testimonials />

      {/* WHO IT'S FOR */}
      <section className='relative z-10 pb-28 max-w-5xl mx-auto px-6'>
        <div className='text-center mb-16'>
          <SectionLabel>Who it&apos;s for</SectionLabel>
          <SectionHeading gray='Built for both sides' gold='of the table' />
        </div>

        <div className='grid md:grid-cols-2 gap-6'>
          {ROLES.map((role) => (
            <div
              key={role.label}
              className='relative group bg-muted/30 backdrop-blur-xl border border-border hover:border-amber-400/25 rounded-2xl p-12 h-full transition-all duration-300 overflow-hidden shadow-[0_4px_40px_-12px_rgba(0,0,0,0.5)] hover:shadow-[0_4px_60px_-12px_rgba(251,191,36,0.12)]'
            >
              <div className='absolute inset-0 bg-linear-to-br from-amber-400/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none' />
              <div className='absolute -bottom-24 -right-24 w-48 h-48 bg-amber-400/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none' />

              <span className='relative inline-block text-xs font-semibold text-amber-400 tracking-widest uppercase border border-amber-400/20 bg-amber-400/10 backdrop-blur-sm rounded-full px-3 py-1.5 mb-5'>
                {role.label}
              </span>

              <h3 className='relative font-serif text-2xl tracking-tight mb-4'>
                {role.title}
              </h3>

              <p className='relative text-sm text-muted-foreground leading-relaxed mb-8'>
                {role.desc}
              </p>

              <ul className='relative space-y-3'>
                {role.perks.map((p) => (
                  <li
                    key={p}
                    className='flex gap-3 text-sm text-muted-foreground'
                  >
                    <span className='mt-0.5 min-w-4 h-4 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-xs text-amber-400'>
                      ✓
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className='relative z-10 pb-28 max-w-5xl mx-auto px-6'>
        <div className='text-center mb-16'>
          <SectionLabel>Pricing</SectionLabel>
          <SectionHeading
            gray='Simple, transparent'
            gold='credit-based plans'
          />
          <p className='text-muted-foreground mt-3 text-sm'>
            Each credit = one session. Unused credits roll over.
          </p>
        </div>
        <PricingSection />
      </section>

      {/* FAQ */}
      <FaqAccordion />

      {/* FINAL CTA */}
      <section className='relative z-10 pb-28 max-w-5xl mx-auto px-6'>
        <div className='relative rounded-3xl px-6 sm:px-16 py-24 overflow-hidden border border-border/60'>
          {/* Background layers */}
          <div className='absolute inset-0 bg-muted/20 backdrop-blur-xl' />
          <div className='absolute inset-0 bg-gradient-to-br from-amber-400/[0.08] via-transparent to-orange-500/[0.04]' />
          <div className='absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-[120px] pointer-events-none' />
          <div className='absolute bottom-0 right-0 w-[300px] h-[300px] bg-orange-500/8 rounded-full blur-[100px] pointer-events-none' />
          <div className='absolute top-1/2 left-0 w-[200px] h-[200px] bg-amber-300/5 rounded-full blur-[80px] pointer-events-none' />
          <StarsBackgroundDemo />

          {/* Grid overlay */}
          <div
            className='absolute inset-0 opacity-[0.015] pointer-events-none'
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          <div className='relative z-10 text-center'>
            {/* Pill */}
            <div className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted/40 backdrop-blur-md border border-border/80 mb-8'>
              <span className='relative flex h-1.5 w-1.5'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75' />
                <span className='relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400' />
              </span>
              <span className='text-[11px] text-muted-foreground font-medium'>
                Join 2,400+ engineers already on EVKA
              </span>
            </div>

            <h2 className='font-serif text-[clamp(2rem,4vw,3.5rem)] leading-[1.05] tracking-[-0.03em] mb-5'>
              <span className='bg-linear-to-br from-stone-700 via-stone-600 to-stone-400 dark:from-stone-100 dark:via-stone-200 dark:to-stone-500 bg-clip-text text-transparent'>
                Your next interview
              </span>
              <br />
              <span className='bg-linear-to-br from-amber-300 via-amber-400 to-amber-600 dark:from-amber-300 dark:via-amber-400 dark:to-amber-600 bg-clip-text text-transparent'>
                starts here
              </span>
            </h2>

            <p className='text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed mb-10'>
              Stop prepping alone. Practice with senior engineers, get
              AI-powered feedback, and walk into your next interview with
              confidence.
            </p>

            <div className='flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4'>
              <Link href='/onboarding'>
                <Button variant='gold' size='hero'>
                  Get started free
                </Button>
              </Link>
              <Link href='/explore'>
                <Button variant='outline' size='hero'>
                  Browse Interviewers →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
