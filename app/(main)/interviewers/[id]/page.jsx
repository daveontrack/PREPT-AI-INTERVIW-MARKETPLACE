import { currentUser } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/prisma'
import { getInterviewerProfile } from '@/actions/booking'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { GrayTitle, SectionLabel } from '@/components/reusables'
import SlotPicker from './_components/SlotPicker'
import { StarsBackgroundDemo } from '@/components/demo-components-backgrounds-stars'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CATEGORY_LABEL, EXPECT_ITEMS } from '@/lib/data'

export default async function InterviewerProfilePage({ params }) {
  const { id } = await params

  const user = await currentUser()
  if (!user) redirect('/')

  const dbUser = await db.user.findUnique({
    where: { clerkUserId: user.id },
    select: { role: true, credits: true },
  })

  if (!dbUser) redirect('/')
  if (dbUser.role === 'UNASSIGNED') redirect('/onboarding')

  const interviewer = await getInterviewerProfile(id)

  if (!interviewer) notFound()

  return (
    <main className='min-h-screen bg-background'>
      {/* ── Hero identity banner ── */}
      <section className='relative border-b border-border overflow-hidden'>
        <StarsBackgroundDemo />

        <div className='relative max-w-6xl mx-auto px-8 pt-20 pb-14 flex flex-col gap-8'>
          <Link href='/explore'>
            <Button
              variant='link'
              className='text-muted-foreground cursor-pointer'
            >
              <ArrowLeft size={13} />
              Back to explore
            </Button>
          </Link>

          <div className='flex items-start gap-8'>
            <Avatar className='w-24 h-24 border-2 border-border shrink-0 rounded-2xl'>
              <AvatarImage
                src={interviewer.imageUrl}
                alt={interviewer.name}
                className='rounded-2xl'
              />
              <AvatarFallback className='rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 text-3xl font-medium'>
                {interviewer.name?.[0] ?? '?'}
              </AvatarFallback>
            </Avatar>
            <div className='flex flex-col gap-3 min-w-0 pt-1'>
              <h1 className='font-serif text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-tight'>
                <GrayTitle>{interviewer.name}</GrayTitle>
              </h1>

              {interviewer.title && interviewer.company && (
                <p className='text-base text-muted-foreground font-light'>
                  {interviewer.title}
                  <span className='text-muted-foreground/50 mx-2'>·</span>
                  {interviewer.company}
                </p>
              )}

              <div className='flex items-center gap-2 flex-wrap mt-1'>
                {interviewer.yearsExp && (
                  <Badge
                    variant='outline'
                    className='border-border text-muted-foreground text-xs px-3 py-1'
                  >
                    {interviewer.yearsExp}+ yrs experience
                  </Badge>
                )}
                <Badge
                  variant='outline'
                  className='border-amber-400/25 bg-amber-400/8 text-amber-400 text-xs px-3 py-1'
                >
                  {interviewer.creditRate ?? 10} credits / session
                </Badge>
                {interviewer.availabilities?.[0] && (
                  <Badge
                    variant='outline'
                    className='border-green-500/20 bg-green-500/8 text-green-400 text-xs px-3 py-1'
                  >
                    🟢 Available
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <div className='max-w-6xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-5 gap-10 items-start'>
        {/* ── LEFT ── */}
        <div className='lg:col-span-3 flex flex-col gap-6 order-2 lg:-order-1'>
          {interviewer.bio && (
            <div className='bg-card border border-border rounded-2xl p-8 flex flex-col gap-5'>
              <SectionLabel>About</SectionLabel>
              <p className='text-base text-foreground font-light leading-relaxed'>
                {interviewer.bio}
              </p>
            </div>
          )}

          {interviewer.categories?.length > 0 && (
            <div className='bg-card border border-border rounded-2xl p-8 flex flex-col gap-5'>
              <div>
                <SectionLabel>Specialties</SectionLabel>
                <p className='text-sm text-muted-foreground font-light mt-1'>
                  Interview categories this expert covers.
                </p>
              </div>
              <div className='flex flex-wrap gap-2.5'>
                {interviewer.categories.map((cat) => (
                  <span
                    key={cat}
                    className='text-sm px-4 py-2 rounded-xl border border-amber-400/20 bg-amber-400/5 text-amber-400'
                  >
                    {CATEGORY_LABEL[cat] ?? cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className='bg-card border border-border rounded-2xl p-8 flex flex-col gap-6'>
            <div>
              <SectionLabel>What to expect</SectionLabel>
              <p className='text-sm text-muted-foreground font-light mt-1'>
                Every session on EVKA includes the following.
              </p>
            </div>
            <ul className='flex flex-col gap-5'>
              {EXPECT_ITEMS.map(([icon, title, desc]) => (
                <li key={title} className='flex items-start gap-4'>
                  <span className='mt-0.5 w-10 h-10 shrink-0 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-lg'>
                    {icon}
                  </span>
                  <div className='flex flex-col gap-0.5'>
                    <p className='text-sm font-medium text-foreground'>
                      {title}
                    </p>
                    <p className='text-xs text-muted-foreground font-light leading-relaxed'>
                      {desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── RIGHT — sticky slot picker ── */}
        <div className='lg:col-span-2 lg:sticky top-24'>
          <SlotPicker
            interviewer={interviewer}
            interviewerCredits={interviewer.creditRate ?? 10}
            userCredits={dbUser.credits}
          />
        </div>
      </div>
    </main>
  )
}
