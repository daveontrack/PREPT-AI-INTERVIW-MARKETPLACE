import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { DM_Sans, Lora } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { Toaster } from 'sonner'
import Script from 'next/script'

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
})

export const metadata = {
  title: 'EVKA',
  description: '',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        theme: dark,
      }}
    >
      <html lang='en' suppressHydrationWarning>
        <head />
        <body className={`${lora.variable} ${dmSans.variable} font-sans`}>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            <main className='min-h-screen'>{children}</main>
            <Script
              src='https://js.chapa.co/v1/inline.js'
              strategy='lazyOnload'
            />
            <Toaster richColors />
            <Footer />
          </ThemeProvider>
          <Script id='chatling-config' strategy='beforeInteractive'>
            {`
    window.chtlConfig = {
      chatbotId: "9871893335"
    };
  `}
          </Script>

          {/* Chatling embed */}
          <Script
            id='chatling-script'
            src='https://chatling.ai/js/embed.js'
            strategy='afterInteractive'
          />
        </body>
      </html>
    </ClerkProvider>
  )
}
