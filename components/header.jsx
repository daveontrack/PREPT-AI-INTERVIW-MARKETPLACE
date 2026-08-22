import { checkUser } from '@/lib/checkUser'
import { Button } from './ui/button'
import { Show, SignInButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import RoleRedirect from './RoleRedirect'
import CreditButton from './CreditButton'
import ThemeToggle from './ThemeToggle'
import { CalendarDays, Users } from 'lucide-react'

const Header = async () => {
  const user = await checkUser()

  const isAdmin = Boolean(
    user &&
    process.env.ADMIN_EMAIL &&
    user.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase(),
  )

  return (
    <nav className='fixed top-0 inset-x-0 z-50 flex items-center justify-between px-3 sm:px-10 py-3 bg-background/80 border-b border-border backdrop-blur-xl'>
      <Link href='/'>
        <Image
          src='/logo.png'
          alt='EVKA Logo'
          width={100}
          height={100}
          className='h-11 w-auto mt-1'
        />
      </Link>

      {user && <RoleRedirect role={user.role} isAdmin={isAdmin} />}

      <div className='flex items-center gap-3'>
        <Show when='signed-out'>
          <SignInButton mode='modal'>
            <Button variant='ghost'>Sign in</Button>
          </SignInButton>
          <SignInButton mode='modal'>
            <Button variant='gold'>Get started →</Button>
          </SignInButton>
        </Show>

        <Show when='signed-in'>
          {user?.role === 'INTERVIEWER' && (
            <Button variant='ghost' asChild>
              <Link href='/dashboard'>Dashboard</Link>
            </Button>
          )}

          {user?.role === 'INTERVIEWEE' && (
            <>
              <Button variant='ghost' asChild>
                <Link href='/explore'>
                  <Users size={16} />
                  <span className='hidden md:inline'>Explore</span>
                </Link>
              </Button>
              <Button variant='ghost' asChild>
                <Link href='/appointments'>
                  <CalendarDays size={16} />
                  <span className='hidden md:inline'>Appointments</span>
                </Link>
              </Button>
            </>
          )}

          <CreditButton
            role={user?.role === 'INTERVIEWER' ? 'INTERVIEWER' : 'INTERVIEWEE'}
            credits={
              (user?.role === 'INTERVIEWER'
                ? user?.creditBalance
                : user?.credits) ?? 0
            }
          />

          <UserButton />
        </Show>

        <ThemeToggle />
      </div>
    </nav>
  )
}

export default Header
