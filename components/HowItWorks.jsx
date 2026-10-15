import {
  SectionLabel,
  SectionHeading,
  GrayTitle,
  GoldTitle,
} from '@/components/reusables'
import { UserPlus, Search, Video, Sparkles } from 'lucide-react'

const STEPS = [
  {
    icon: <UserPlus size={22} />,
    number: '01',
    title: (
      <>
        <GrayTitle>Create your</GrayTitle> <GoldTitle>free account</GoldTitle>
      </>
    ),
    desc: "Sign up in seconds. Choose your role — interviewee or interviewer — and you're ready to go.",
  },
  {
    icon: <Search size={22} />,
    number: '02',
    title: (
      <>
        <GrayTitle>Browse &</GrayTitle> <GoldTitle>book a session</GoldTitle>
      </>
    ),
    desc: 'Filter by category, rating, and availability. Pick an open slot and confirm with one click.',
  },
  {
    icon: <Video size={22} />,
    number: '03',
    title: (
      <>
        <GrayTitle>Join the</GrayTitle> <GoldTitle>HD video call</GoldTitle>
      </>
    ),
    desc: '45-minute 1:1 session with screen sharing, an AI co-pilot generating live questions, and persistent chat.',
  },
  {
    icon: <Sparkles size={22} />,
    number: '04',
    title: (
      <>
        <GrayTitle>Get AI</GrayTitle> <GoldTitle>feedback</GoldTitle>
      </>
    ),
    desc: 'Receive a detailed post-session report with actionable insights on technical depth, communication, and more.',
  },
]

export default function HowItWorks() {
  return (
    <section className='relative z-10 py-24 max-w-5xl mx-auto px-6'>
      <div className='text-center mb-20'>
        <SectionLabel>How it works</SectionLabel>
        <SectionHeading gray='From sign-up to' gold='interview-ready' />
      </div>

      <div className='relative'>
        {/* Connecting line */}
        <div className='hidden md:block absolute top-12 left-[calc(12.5%+22px)] right-[calc(12.5%+22px)] h-px bg-linear-to-r from-amber-400/0 via-amber-400/30 to-amber-400/0' />

        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          {STEPS.map((step, i) => (
            <div
              key={i}
              className='relative group flex flex-col items-center text-center'
            >
              {/* Glow behind icon */}
              <div className='absolute top-0 w-16 h-16 rounded-full bg-amber-400/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500' />

              {/* Icon circle */}
              <div className='relative w-12 h-12 rounded-full bg-muted/50 backdrop-blur-md border border-border flex items-center justify-center text-amber-400 mb-6 ring-1 ring-border/50 group-hover:border-amber-400/30 group-hover:ring-amber-400/20 transition-all duration-300'>
                {step.icon}
              </div>

              {/* Step number */}
              <span className='text-[10px] font-bold text-amber-400/60 tracking-[0.2em] uppercase mb-3'>
                Step {step.number}
              </span>

              {/* Title */}
              <h3 className='font-serif text-lg tracking-tight mb-3'>
                {step.title}
              </h3>

              {/* Description */}
              <p className='text-sm text-muted-foreground leading-relaxed max-w-55'>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
