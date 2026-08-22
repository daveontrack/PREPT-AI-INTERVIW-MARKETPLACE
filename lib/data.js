import { GoldTitle, GrayTitle } from '@/components/reusables'

export const LOGOS = [
  { src: '/amazon.svg', alt: 'Amazon' },
  { src: '/atlassian.svg', alt: 'Atlassian' },
  { src: '/google.webp', alt: 'Google' },
  { src: '/meta.svg', alt: 'Meta' },
  { src: '/microsoft.webp', alt: 'Microsoft' },
  { src: '/netflix.png', alt: 'Netflix' },
  { src: '/uber.svg', alt: 'Uber' },
]

export const AVATARS = [
  { src: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { src: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { src: 'https://randomuser.me/api/portraits/men/76.jpg' },
  { src: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { src: 'https://randomuser.me/api/portraits/men/12.jpg' },
]

export const AI_TAGS = [
  { label: 'Frontend Engineer', active: true },
  { label: 'L5 Level', active: true },
  { label: 'React Performance', active: false },
  { label: 'System Design', active: false },
  { label: 'Behavioural', active: true },
  { label: 'DSA', active: false },
]

export const SLOTS = [
  {
    label: 'Mon 10:00 AM',
    cls: 'border-amber-400/30 text-amber-200 bg-amber-400/5',
  },
  { label: 'Mon 2:00 PM', cls: 'border-white/7 text-stone-500' },
  {
    label: 'Tue 11:00 AM',
    cls: 'border-amber-400/30 text-amber-200 bg-amber-400/5',
  },
  {
    label: 'Wed 9:00 AM ✓',
    cls: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
  },
  {
    label: 'Thu 3:00 PM',
    cls: 'border-amber-400/30 text-amber-200 bg-amber-400/5',
  },
]

export const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Frontend Engineer @ Meta',
    initials: 'PS',
    text: 'EVKA completely changed how I approached system design interviews. The AI feedback pointed out patterns I never noticed — like over-engineering early instead of starting with the simplest solution. After 3 sessions, I cleared my L5 loop.',
    rating: 5,
    color: 'amber',
  },
  {
    name: 'Marcus Johnson',
    role: 'Senior SWE @ Amazon',
    initials: 'MJ',
    text: "I've interviewed on the other side for years, but EVKA helped me stay sharp as a candidate too. The AI co-pilot generating questions in real-time is insane — it felt exactly like my actual Amazon loop.",
    rating: 5,
    color: 'emerald',
  },
  {
    name: 'Aisha Khalid',
    role: 'Frontend Lead @ Stripe',
    initials: 'AK',
    text: 'The booking flow is frictionless. I picked a slot, got matched with a senior interviewer, and had my feedback report within an hour. The persistent chat afterwards was great for follow-up questions.',
    rating: 5,
    color: 'blue',
  },
  {
    name: 'Daniel Park',
    role: 'Backend Engineer @ Netflix',
    initials: 'DP',
    text: "I was skeptical about mock interviews online, but the HD video quality and screen sharing made it feel like I was in the same room. My interviewer caught weak points in my distributed systems knowledge that I'd missed.",
    rating: 5,
    color: 'violet',
  },
  {
    name: 'Sarah Chen',
    role: 'SDE II @ Microsoft',
    initials: 'SC',
    text: 'Used the free plan for my first session and immediately upgraded. The AI feedback reports are worth it alone — detailed breakdowns of technical depth, communication, and problem-solving approach.',
    rating: 5,
    color: 'amber',
  },
  {
    name: "James O'Brien",
    role: 'Staff Engineer @ Uber',
    initials: 'JO',
    text: "As an interviewer on EVKA, I love the AI question generator. It tailors questions to each candidate's level so I can focus on evaluating their responses rather than thinking of what to ask next.",
    rating: 5,
    color: 'emerald',
  },
]

export const PLANS = [
  {
    name: 'Free',
    price: '$0',
    credits: '1 credit / month',
    featured: false,
    planId: null,
    slug: 'free',
    features: [
      '1 mock interview session',
      'HD video call via Stream',
      'Persistent chat thread',
    ],
  },
  {
    name: 'Starter',
    price: '$29',
    credits: '5 credits / month',
    featured: true,
    planId: 'cplan_3GlAUJGIznbNd2XvwKWOK9SBilE',
    slug: 'starter',
    features: [
      '5 mock interview sessions',
      'AI feedback report',
      'HD video call via Stream',
      'Persistent chat thread',
      'Credits roll over monthly',
    ],
  },
  {
    name: 'Pro',
    price: '$69',
    credits: '15 credits / month',
    featured: false,
    planId: 'cplan_3GlCUjn6nX1m838X7I5eWNeaV4S',
    slug: 'pro',
    features: [
      '15 mock interview sessions',
      'AI feedback report',
      'HD video call via Stream',
      'Persistent chat thread',
      'Credits roll over monthly',
      'Recording & playback link',
    ],
  },
]

export const ROLES = [
  {
    label: 'Interviewee',
    title: <GrayTitle>Land the role you deserve</GrayTitle>,
    desc: "Stop guessing what interviewers want. Practice with people who've been on the other side and know exactly how top companies evaluate candidates.",
    perks: [
      'Browse by category: Frontend, Backend, System Design, PM',
      'Book sessions using monthly credits from your plan',
      'Receive AI-powered feedback after every session',
      'Access session recordings to review your performance',
      'Chat with your interviewer before and after the call',
    ],
  },
  {
    label: 'Interviewer',
    title: <GoldTitle>Earn doing what you&apos;re great at</GoldTitle>,
    desc: 'Share your knowledge, help engineers grow, and earn meaningful income on your own schedule. Set your slots, and we handle the rest.',
    perks: [
      'Set your own availability and session rates',
      "AI question generator tailored to each candidate's role",
      'Earn credits per session — withdraw any time',
      'Dashboard with credit balance and withdrawal requests',
    ],
  },
]

export const FAQ_ITEMS = [
  {
    question: 'How do mock interviews on EVKA work?',
    answer:
      "Book a 1:1 session with a senior engineer from a top company. You'll join a HD video call with screen sharing, an AI co-pilot that generates live questions, and a persistent chat thread. After the session, you receive an AI-powered feedback report with actionable insights.",
  },
  {
    question: 'What happens to unused credits?',
    answer:
      "All unused credits roll over to the next month automatically. There's no expiry on your credits as long as your subscription is active.",
  },
  {
    question: 'Can I become an interviewer on EVKA?',
    answer:
      'Yes! If you have experience interviewing candidates at top tech companies, you can apply to become an interviewer. Set your own availability, earn credits per session, and withdraw your earnings at any time.',
  },
  {
    question: 'What categories of interviews are available?',
    answer:
      'We cover Frontend, Backend, Full Stack, System Design, DSA, Behavioral, DevOps, and Mobile. Each category has specialized interviewers who focus on that domain.',
  },
  {
    question: 'Is there a free plan?',
    answer:
      'Yes — the Free plan gives you 1 credit per month, enough for one mock interview session with HD video, AI-generated questions, and a chat thread. Upgrade anytime for more credits and AI feedback reports.',
  },
  {
    question: 'How does the AI feedback report work?',
    answer:
      'After each session on a Starter or Pro plan, our AI (powered by Gemini) analyzes your performance across technical depth, communication, problem-solving approach, and more — delivering a detailed report with specific areas to improve.',
  },
  {
    question: 'Can I record my interview sessions?',
    answer:
      'Yes — Pro plan users get automatic recording and a shareable playback link after every session. Review your performance or revisit key moments at any time.',
  },
]

export const CATEGORIES = [
  { value: null, label: 'All' },
  { value: 'FRONTEND', label: 'Frontend' },
  { value: 'BACKEND', label: 'Backend' },
  { value: 'FULLSTACK', label: 'Full Stack' },
  { value: 'DSA', label: 'DSA' },
  { value: 'SYSTEM_DESIGN', label: 'System Design' },
  { value: 'BEHAVIORAL', label: 'Behavioral' },
  { value: 'DEVOPS', label: 'DevOps' },
  { value: 'MOBILE', label: 'Mobile' },
]

export const CATEGORY_LABEL = {
  FRONTEND: 'Frontend',
  BACKEND: 'Backend',
  FULLSTACK: 'Full Stack',
  DSA: 'DSA',
  SYSTEM_DESIGN: 'System Design',
  BEHAVIORAL: 'Behavioral',
  DEVOPS: 'DevOps',
  MOBILE: 'Mobile',
}

// onboarding
export const YEARS_OPTIONS = [
  { value: 1, label: '1 yr' },
  { value: 2, label: '2 yrs' },
  { value: 3, label: '3 yrs' },
  { value: 5, label: '5 yrs' },
  { value: 7, label: '7 yrs' },
  { value: 10, label: '10+ yrs' },
]

export const ONBOARDING_ROLES = [
  {
    value: 'INTERVIEWEE',
    icon: '🎯',
    title: 'I want to practice',
    desc: 'Browse expert interviewers, book sessions, and get AI-powered feedback to land your dream role.',
  },
  {
    value: 'INTERVIEWER',
    icon: '🧑‍💼',
    title: 'I want to interview',
    desc: 'Share your expertise, earn credits, and help engineers level up.',
  },
]

// Appointment Card Data
export const STATUS_STYLES = {
  SCHEDULED: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  COMPLETED: 'border-green-500/20 bg-green-500/10 text-green-400',
  CANCELLED: 'border-red-500/20 bg-red-500/10 text-red-400',
}

export const RATING_STYLES = {
  POOR: 'ml-auto border-red-500/20 bg-red-500/10 text-red-400',
  AVERAGE: 'ml-auto border-yellow-500/20 bg-yellow-500/10 text-yellow-400',
  GOOD: 'ml-auto border-blue-500/20 bg-blue-500/10 text-blue-400',
  EXCELLENT: 'ml-auto border-green-500/20 bg-green-500/10 text-green-400',
}

export const RATING_LABEL = {
  POOR: 'Poor',
  AVERAGE: 'Average',
  GOOD: 'Good',
  EXCELLENT: 'Excellent',
}

// Feedback Modal
export const RATING_CONFIG = {
  POOR: {
    label: 'Poor',
    emoji: '📉',
    className: 'border-red-500/20 bg-red-500/10 text-red-400',
    bg: 'from-red-500/5',
  },
  AVERAGE: {
    label: 'Average',
    emoji: '📊',
    className: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400',
    bg: 'from-yellow-500/5',
  },
  GOOD: {
    label: 'Good',
    emoji: '👍',
    className: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
    bg: 'from-blue-500/5',
  },
  EXCELLENT: {
    label: 'Excellent',
    emoji: '🏆',
    className: 'border-green-500/20 bg-green-500/10 text-green-400',
    bg: 'from-green-500/5',
  },
}

// Booking Page
export const EXPECT_ITEMS = [
  ['🎥', 'HD Video Call', '45-minute session with screen sharing built in.'],
  [
    '🤖',
    'AI Question Generator',
    'Role-specific questions generated live during the interview.',
  ],
  [
    '💬',
    'Persistent Chat',
    'Message before and after — share notes, resources, follow-ups.',
  ],
  [
    '📊',
    'AI Feedback Report',
    'Post-interview analysis covering technical depth, communication, and more.',
  ],
  [
    '📹',
    'Recording & Playback',
    'A shareable recording link is generated automatically after the call.',
  ],
]
