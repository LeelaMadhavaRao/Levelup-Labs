import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import Navbar from '@/components/navbar'
import { Toaster } from '@/components/ui/sonner'

import './globals.css'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'CodeZapra - Learning Platform',
  description: 'Master challenging courses, complete hands-on coding challenges, and advance through skill ranks with AI guidance',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${spaceGrotesk.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <Navbar />
          <main className="page-shell solo-root relative min-h-screen overflow-hidden bg-[#050508] text-slate-100">
            <div className="pointer-events-none fixed inset-0 z-[1] nebula-bg opacity-30" />
            <div className="hunter-grid-bg pointer-events-none fixed inset-0 z-[1] opacity-20" />
            <div className="scanlines pointer-events-none fixed inset-0 z-[2] opacity-[0.04]" />
            <div className="relative z-[3]">{children}</div>
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
