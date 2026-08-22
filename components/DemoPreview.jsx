'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SectionLabel, SectionHeading } from '@/components/reusables'
import {
  Video,
  Sparkles,
  BarChart3,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  MessageSquare,
} from 'lucide-react'

const DEMO_TABS = [
  { id: 'video', label: 'HD Video Call', icon: <Video size={14} /> },
  { id: 'ai', label: 'AI Questions', icon: <Sparkles size={14} /> },
  { id: 'feedback', label: 'AI Feedback', icon: <BarChart3 size={14} /> },
]

const CYCLE_MS = 4500

/* ─── Video Call View ─── */
function VideoCallView({ active }) {
  const elapsedRef = useRef(0)
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => {
      elapsedRef.current += 1
      forceUpdate((n) => n + 1)
    }, 1000)
    return () => clearInterval(t)
  }, [active])

  const elapsed = elapsedRef.current
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <div className='w-full h-full flex flex-col'>
      {/* Top bar */}
      <div className='flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border'>
        <div className='flex items-center gap-2'>
          <span className='w-2 h-2 rounded-full bg-red-500 animate-pulse' />
          <span className='text-xs sm:text-[11px] text-muted-foreground font-mono'>
            {mm}:{ss}
          </span>
        </div>
        <span className='text-xs sm:text-[11px] text-muted-foreground'>
          Frontend Interview
        </span>
        <span className='text-xs sm:text-[11px] text-muted-foreground'>
          45:00 min
        </span>
      </div>

      {/* Video grid */}
      <div className='flex-1 grid grid-cols-2 gap-2 sm:gap-4 p-3 sm:p-6'>
        {/* Interviewer */}
        <div className='relative rounded-xl bg-gradient-to-br from-secondary to-secondary/80 border border-border flex flex-col items-center justify-center overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-br from-amber-400/5 to-transparent' />
          <div className='relative w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-amber-400/15 border border-amber-400/25 flex items-center justify-center text-amber-400 font-serif text-lg sm:text-2xl font-bold'>
            JD
          </div>
          <p className='relative text-[11px] sm:text-sm text-foreground mt-2 sm:mt-3 font-medium'>
            John Doe
          </p>
          <p className='relative text-[9px] sm:text-[11px] text-muted-foreground'>
            Senior SWE · Google
          </p>
          <div className='absolute bottom-2 sm:bottom-3 left-2 sm:left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent backdrop-blur-sm'>
            <Mic size={10} className='text-emerald-400' />
            <div className='flex gap-[2px] items-end h-3'>
              {[1, 2, 3, 2].map((h, i) => (
                <div
                  key={i}
                  className='w-[2px] bg-emerald-400 rounded-full animate-pulse'
                  style={{
                    height: `${h * 3}px`,
                    animationDelay: `${i * 150}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Candidate (You) */}
        <div className='relative rounded-xl bg-gradient-to-br from-secondary to-secondary/80 border border-border flex flex-col items-center justify-center overflow-hidden'>
          <div className='relative w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-blue-400/15 border border-blue-400/25 flex items-center justify-center text-blue-400 font-serif text-lg sm:text-2xl font-bold'>
            YO
          </div>
          <p className='relative text-[11px] sm:text-sm text-foreground mt-2 sm:mt-3 font-medium'>
            You
          </p>
          <p className='relative text-[9px] sm:text-[11px] text-muted-foreground'>
            Candidate
          </p>
          <div className='absolute bottom-2 sm:bottom-3 left-2 sm:left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent backdrop-blur-sm'>
            <MicOff size={10} className='text-muted-foreground' />
            <span className='text-[8px] sm:text-[9px] text-muted-foreground'>
              Listening
            </span>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className='flex items-center justify-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 border-t border-border'>
        {[
          { icon: <Mic size={14} />, active: true },
          { icon: <MonitorUp size={14} />, active: true },
          { icon: <MessageSquare size={14} />, active: true },
          { icon: <PhoneOff size={14} />, danger: true },
        ].map((btn, i) => (
          <div
            key={i}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${
              btn.danger
                ? 'bg-red-500/80 text-white hover:bg-red-500'
                : 'bg-accent text-muted-foreground hover:bg-white/15'
            }`}
          >
            {btn.icon}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── AI Questions View ─── */
function AIQuestionsView({ active }) {
  const visibleRef = useRef(0)
  const [visibleCount, setVisibleCount] = useState(0)

  const QUESTIONS = [
    {
      role: 'ai',
      text: "Can you explain the virtual DOM and how React's reconciliation algorithm works?",
    },
    {
      role: 'candidate',
      text: 'The virtual DOM is a lightweight copy of the real DOM. When state changes, React creates a new virtual tree, diffs it against the previous one, and batches minimal updates to the real DOM.',
    },
    {
      role: 'ai',
      text: 'Great. Now follow up — what happens during a key change in a list? Walk me through the re-rendering behavior.',
    },
  ]

  useEffect(() => {
    if (!active) return
    visibleRef.current = 0
    setVisibleCount(0)
    const timers = QUESTIONS.map((_, i) =>
      setTimeout(
        () => {
          visibleRef.current = i + 1
          setVisibleCount(i + 1)
        },
        (i + 1) * 1200,
      ),
    )
    return () => timers.forEach(clearTimeout)
  }, [active])

  return (
    <div className='w-full h-full flex flex-col'>
      {/* Header */}
      <div className='flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-border'>
        <Sparkles size={13} className='text-amber-400' />
        <span className='text-[11px] sm:text-xs text-foreground font-medium'>
          AI Co-pilot · Frontend Engineer · L5
        </span>
        <div className='ml-auto flex items-center gap-1.5'>
          <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse' />
          <span className='text-[10px] text-muted-foreground'>Generating</span>
        </div>
      </div>

      {/* Chat area */}
      <div className='flex-1 p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 overflow-hidden'>
        {QUESTIONS.slice(0, visibleCount).map((q, i) => (
          <div
            key={i}
            className={`flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500 ${
              q.role === 'ai' ? 'items-start' : 'items-end'
            }`}
          >
            <span
              className={`text-[10px] font-medium tracking-wide uppercase ${
                q.role === 'ai' ? 'text-amber-400/70' : 'text-blue-400/70'
              }`}
            >
              {q.role === 'ai' ? 'AI Co-pilot' : 'Candidate'}
            </span>
            <div
              className={`max-w-[85%] text-[11px] sm:text-xs leading-relaxed px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl ${
                q.role === 'ai'
                  ? 'bg-amber-400/10 border border-amber-400/15 text-foreground rounded-tl-sm'
                  : 'bg-muted/50 border border-border text-muted-foreground rounded-tr-sm'
              }`}
            >
              {q.text}
            </div>
          </div>
        ))}

        {visibleCount > 0 && visibleCount < QUESTIONS.length && (
          <div className='flex items-center gap-1.5 px-2'>
            <div className='flex gap-1'>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className='w-1.5 h-1.5 rounded-full bg-amber-400/40 animate-bounce'
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
            <span className='text-[10px] text-muted-foreground/70'>
              AI is typing...
            </span>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className='px-4 sm:px-6 py-3 border-t border-border'>
        <div className='flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-muted/50 border border-border'>
          <span className='text-[11px] sm:text-xs text-muted-foreground/70'>
            Type your answer or speak...
          </span>
          <div className='ml-auto w-7 h-7 rounded-full bg-amber-400/15 flex items-center justify-center'>
            <Mic size={12} className='text-amber-400' />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── AI Feedback View ─── */
function AIFeedbackView({ active }) {
  const revealedRef = useRef(0)
  const [revealed, setRevealed] = useState(0)

  const SCORES = [
    {
      label: 'Technical Depth',
      score: 85,
      color: 'from-amber-400 to-amber-500',
    },
    {
      label: 'Communication',
      score: 92,
      color: 'from-emerald-400 to-emerald-500',
    },
    { label: 'Problem Solving', score: 78, color: 'from-blue-400 to-blue-500' },
    {
      label: 'Code Quality',
      score: 88,
      color: 'from-violet-400 to-violet-500',
    },
  ]

  const HIGHLIGHTS = [
    { type: 'good', text: 'Strong understanding of React fundamentals' },
    { type: 'good', text: 'Clear, structured communication style' },
    {
      type: 'improve',
      text: 'Consider mentioning trade-offs in reconciliation',
    },
    { type: 'good', text: 'Good follow-up handling under pressure' },
  ]

  useEffect(() => {
    if (!active) return
    revealedRef.current = 0
    setRevealed(0)
    const timers = SCORES.map((_, i) =>
      setTimeout(
        () => {
          revealedRef.current = i + 1
          setRevealed(i + 1)
        },
        (i + 1) * 400,
      ),
    )
    return () => timers.forEach(clearTimeout)
  }, [active])

  return (
    <div className='w-full h-full flex flex-col'>
      {/* Header */}
      <div className='flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-border'>
        <BarChart3 size={13} className='text-amber-400' />
        <span className='text-[11px] sm:text-xs text-foreground font-medium'>
          Session Complete · Frontend Interview
        </span>
        <span className='ml-auto text-[10px] sm:text-[11px] text-muted-foreground'>
          Score: 86/100
        </span>
      </div>

      <div className='flex-1 p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 overflow-hidden'>
        {/* Score bars */}
        <div className='space-y-3 sm:space-y-4'>
          {SCORES.map((s, i) => (
            <div key={s.label} className='space-y-1.5'>
              <div className='flex items-center justify-between'>
                <span className='text-xs sm:text-[11px] text-muted-foreground'>
                  {s.label}
                </span>
                <span className='text-xs sm:text-[11px] text-muted-foreground font-mono'>
                  {revealed > i ? s.score : 0}%
                </span>
              </div>
              <div className='h-2 rounded-full bg-muted/50 overflow-hidden'>
                <div
                  className={`h-full rounded-full bg-linear-to-r ${s.color} transition-all duration-700 ease-out`}
                  style={{ width: revealed > i ? `${s.score}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className='h-px bg-accent' />

        {/* Key highlights */}
        <div>
          <p className='text-[10px] sm:text-[11px] font-semibold text-muted-foreground tracking-widest uppercase mb-3'>
            Key Highlights
          </p>
          <div className='space-y-2 sm:space-y-2.5'>
            {HIGHLIGHTS.slice(0, revealed).map((h, i) => (
              <div
                key={i}
                className='flex items-start gap-2.5 animate-in fade-in slide-in-from-left-2 duration-400'
              >
                <span
                  className={`mt-0.5 min-w-[18px] h-[18px] rounded-full border flex items-center justify-center text-[9px] ${
                    h.type === 'good'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}
                >
                  {h.type === 'good' ? '✓' : '↑'}
                </span>
                <span className='text-[11px] sm:text-xs text-muted-foreground leading-relaxed'>
                  {h.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Component ─── */
export default function DemoPreview() {
  const [activeTab, setActiveTab] = useState('video')

  const cycleTab = useCallback(() => {
    setActiveTab((prev) => {
      const idx = DEMO_TABS.findIndex((t) => t.id === prev)
      return DEMO_TABS[(idx + 1) % DEMO_TABS.length].id
    })
  }, [])

  useEffect(() => {
    const t = setInterval(cycleTab, CYCLE_MS)
    return () => clearInterval(t)
  }, [cycleTab])

  return (
    <section className='relative z-10 py-20 sm:py-28 w-full'>
      <div className='text-center mb-12 sm:mb-16 px-6'>
        <SectionLabel>See it in action</SectionLabel>
        <SectionHeading
          gray='A platform built for'
          gold='real interview prep'
        />
        <p className='text-muted-foreground mt-4 text-sm max-w-lg mx-auto leading-relaxed'>
          Watch how EVKA combines expert-led mock interviews with AI-powered
          tools to give you the edge in your next interview.
        </p>
      </div>

      <div className='relative group px-4 sm:px-8 lg:px-12'>
        {/* Glow behind frame */}
        <div className='absolute -inset-4 sm:-inset-6 lg:-inset-8 bg-linear-to-b from-amber-400/10 via-amber-400/5 to-transparent rounded-3xl blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-700' />

        <div className='relative rounded-xl sm:rounded-2xl border border-border bg-muted/30 backdrop-blur-xl overflow-hidden shadow-[0_0_80px_-20px_rgba(251,191,36,0.1)]'>
          {/* Browser chrome */}
          <div className='flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 border-b border-border bg-muted/20'>
            <span className='w-2.5 h-2.5 rounded-full bg-[#ff5f57]' />
            <span className='w-2.5 h-2.5 rounded-full bg-[#ffbd2e]' />
            <span className='w-2.5 h-2.5 rounded-full bg-[#28c840]' />
            <div className='ml-3 sm:ml-4 flex-1 max-w-xs h-6 rounded-md bg-muted/50 border border-border flex items-center px-3'>
              <span className='text-[10px] text-muted-foreground font-mono'>
                EVKA.app/interview/session
              </span>
            </div>
          </div>

          {/* Tab bar — scattered evenly */}
          <div className='flex items-center justify-between px-6 sm:px-10 py-3 border-b border-border bg-muted/20'>
            {DEMO_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-lg text-[11px] sm:text-xs font-medium transition-all duration-300 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                }`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <span className='absolute -bottom-[13px] left-1/2 -translate-x-1/2 w-10 h-[2px] bg-amber-400 rounded-full' />
                )}
              </button>
            ))}
          </div>

          {/* Demo content — fills available screen height */}
          <div className='relative min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] bg-gradient-to-br from-background via-card to-background'>
            {/* Decorative grid */}
            <div
              className='absolute inset-0 opacity-[0.03]'
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />

            {/* Video Call — always mounted, hidden via opacity */}
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${
                activeTab === 'video'
                  ? 'opacity-100'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              <VideoCallView active={activeTab === 'video'} />
            </div>

            {/* AI Questions */}
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${
                activeTab === 'ai'
                  ? 'opacity-100'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              <AIQuestionsView active={activeTab === 'ai'} />
            </div>

            {/* AI Feedback */}
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${
                activeTab === 'feedback'
                  ? 'opacity-100'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              <AIFeedbackView active={activeTab === 'feedback'} />
            </div>
          </div>
        </div>
      </div>

      {/* Feature pills */}
      <div className='flex flex-wrap items-center justify-center gap-3 mt-8 px-6'>
        {DEMO_TABS.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm text-xs cursor-pointer transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-amber-400/10 border border-amber-400/25 text-amber-300'
                : 'bg-muted/50 border border-border text-muted-foreground hover:border-white/20 hover:text-foreground'
            }`}
          >
            <span className={activeTab === tab.id ? 'text-amber-400' : ''}>
              {tab.icon}
            </span>
            {tab.label}
          </div>
        ))}
      </div>
    </section>
  )
}
