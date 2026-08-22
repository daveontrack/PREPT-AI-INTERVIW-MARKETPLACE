'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GoldTitle, GrayTitle, SectionLabel } from '@/components/reusables'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { completeOnboarding } from '@/actions/onboarding'
import useFetch from '@/hooks/use-fetch'
import { CATEGORIES, ONBOARDING_ROLES, YEARS_OPTIONS } from '@/lib/data'

export default function OnboardingPage() {
  const router = useRouter()

  const { data, loading, fn: onboardingFn } = useFetch(completeOnboarding)

  const [role, setRole] = useState(null)
  const [form, setForm] = useState({
    title: '',
    company: '',
    yearsExp: '',
    bio: '',
    categories: [],
  })

  useEffect(() => {
    if (data && !loading) {
      router.push(role === 'INTERVIEWER' ? '/dashboard' : '/explore')
    }
  }, [data, router])

  const toggleCategory = (val) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(val)
        ? prev.categories.filter((c) => c !== val)
        : [...prev.categories, val],
    }))
  }

  const isInterviewerValid =
    form.title.trim() &&
    form.company.trim() &&
    form.yearsExp &&
    form.bio.trim() &&
    form.categories.length > 0

  const canSubmit =
    role === 'INTERVIEWEE' || (role === 'INTERVIEWER' && isInterviewerValid)

  const handleSubmit = () => {
    if (!canSubmit) return

    onboardingFn({
      role,
      ...(role === 'INTERVIEWER' && {
        title: form.title,
        company: form.company,
        yearsExp: Number(form.yearsExp),
        bio: form.bio,
        categories: form.categories,
      }),
    })
  }

  return (
    <main className='min-h-screen bg-background px-6 py-24 flex flex-col items-center'>
      <div className='w-full max-w-2xl'>
        {/* Heading */}
        <div className='text-center mb-10'>
          <SectionLabel>Welcome</SectionLabel>
          <h1 className='font-serif text-5xl leading-tight tracking-tighter mt-1'>
            <GrayTitle>How will you be</GrayTitle>
            <br />
            <GoldTitle>using EVKA?</GoldTitle>
          </h1>
          <p className='text-sm text-muted-foreground font-light mt-4 leading-relaxed'>
            This helps us personalise your experience.
            <span className='text-muted-foreground/70'>
              {' '}
              You can&apos;t change this later.
            </span>
          </p>
        </div>

        {!role && (
          <div className='grid grid-cols-2 gap-4 w-full'>
            {ONBOARDING_ROLES.map((r) => (
              <button
                key={r.value}
                type='button'
                onClick={() => setRole(r.value)}
                className='text-left rounded-2xl p-8 border border-border bg-card hover:border-amber-400/20 hover:-translate-y-0.5 transition-all duration-300'
              >
                <span className='w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-xl mb-5'>
                  {r.icon}
                </span>
                <h3 className='font-serif text-xl tracking-tight mb-3 text-foreground'>
                  {r.title}
                </h3>
                <p className='text-sm text-muted-foreground font-light leading-relaxed'>
                  {r.desc}
                </p>
              </button>
            ))}
          </div>
        )}

        {role && (
          <div className='flex flex-col gap-6'>
            {/* role strip */}
            <div className='flex items-center justify-between bg-card border border-border rounded-2xl px-6 py-4'>
              <div className='flex items-center gap-3'>
                <span className='w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-base shrink-0'>
                  {ONBOARDING_ROLES.find((r) => r.value === role)?.icon}
                </span>
                <div>
                  <p className='text-sm font-medium text-foreground'>
                    {ONBOARDING_ROLES.find((r) => r.value === role)?.title}
                  </p>
                  <p className='text-xs text-muted-foreground/70 mt-0.5'>
                    Selected role
                  </p>
                </div>
              </div>
              <Button variant='outline' size='sm' onClick={() => setRole(null)}>
                Change
              </Button>
            </div>

            {/* interviewer form */}
            {role === 'INTERVIEWER' && (
              <div className='bg-card border border-border rounded-2xl p-8 flex flex-col gap-6'>
                {/* Title + Company */}
                <div className='grid grid-cols-2 gap-4'>
                  <div className='flex flex-col gap-2'>
                    <Label htmlFor='title'>Current title</Label>
                    <Input
                      id='title'
                      placeholder='Senior Software Engineer'
                      value={form.title}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, title: e.target.value }))
                      }
                    />
                  </div>

                  <div className='flex flex-col gap-2'>
                    <Label htmlFor='company'>Company</Label>
                    <Input
                      id='company'
                      placeholder='Google, Meta, Startup…'
                      value={form.company}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, company: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* years */}
                <div className='flex flex-wrap gap-2'>
                  {YEARS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type='button'
                      onClick={() =>
                        setForm((p) => ({ ...p, yearsExp: opt.value }))
                      }
                      className={`text-xs px-4 py-2 rounded-lg border ${
                        form.yearsExp === opt.value
                          ? 'border-amber-400/40 bg-amber-400/10 text-amber-400'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* categories */}
                <div className='flex flex-wrap gap-2'>
                  {CATEGORIES.map((cat) => {
                    if (!cat?.value) return null

                    const active = form.categories.includes(cat.value)

                    return (
                      <button
                        key={cat.value}
                        type='button'
                        onClick={() => toggleCategory(cat.value)}
                        className={`text-xs px-4 py-2 rounded-lg border ${
                          active
                            ? 'border-amber-400/40 bg-amber-400/10 text-amber-400'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        {cat.label}
                      </button>
                    )
                  })}
                </div>

                {/* bio */}
                <Textarea
                  rows={4}
                  maxLength={300}
                  placeholder='Tell interviewees about your background, what you specialise in, and what they can expect from a session with you.'
                  value={form.bio}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, bio: e.target.value }))
                  }
                />
              </div>
            )}

            <Button
              variant='gold'
              size='hero'
              className='w-full'
              disabled={!canSubmit || loading}
              onClick={handleSubmit}
            >
              {loading
                ? 'Setting up your account…'
                : role === 'INTERVIEWER'
                  ? 'Create interviewer profile →'
                  : 'Go to dashboard →'}
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
