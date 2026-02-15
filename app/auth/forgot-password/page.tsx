'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { requestPasswordReset } from '@/lib/auth'
import { Mail, ArrowLeft } from 'lucide-react'
import { Orbitron, Rajdhani } from 'next/font/google'

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'] })
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setLoading(true)
    try {
      const { error } = await requestPasswordReset(email)

      if (error) {
        toast.error(typeof error === 'string' ? error : 'Failed to send reset email. Please try again.')
      } else {
        setEmailSent(true)
        toast.success('Password reset email sent! Check your inbox.')
      }
    } catch (error) {
      toast.error('Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className={`${rajdhani.className} relative min-h-screen overflow-hidden bg-[#050508] text-slate-100`}>
        <div className="pointer-events-none fixed inset-0 z-0 nebula-bg animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="hunter-grid-bg pointer-events-none fixed inset-0 z-0 opacity-70" />
        <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-20" />

        <main className="relative z-20 mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center p-6">
        <Card className="relative z-20 w-full max-w-xl border-white/15 bg-black/75 p-8 text-slate-100 holo-card">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full border border-cyan-500/40 bg-cyan-500/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-cyan-300" />
              </div>
            </div>
            <div>
              <h1 className={`${orbitron.className} text-3xl font-bold mb-2 uppercase tracking-[0.16em]`}>Check Your Email</h1>
              <p className="text-slate-400">
                We've sent a password reset link to <strong className="text-foreground">{email}</strong>
              </p>
            </div>
            <div className="space-y-3 text-sm text-slate-400">
              <p>Click the link in the email to reset your password.</p>
              <p>If you don't see the email, check your spam folder.</p>
            </div>
            <div className="pt-4 space-y-3">
              <Button
                onClick={() => {
                  setEmailSent(false)
                  setEmail('')
                }}
                variant="outline"
                className="w-full border-white/20 bg-transparent text-slate-100 hover:bg-white/10"
              >
                Try Another Email
              </Button>
              <Button
                onClick={() => router.push('/auth/login')}
                className="btn-hunter w-full border border-purple-400/40 bg-purple-700 text-white hover:bg-purple-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </div>
        </Card>
        </main>
      </div>
    )
  }

  return (
    <div className={`${rajdhani.className} relative min-h-screen overflow-hidden bg-[#050508] text-slate-100`}>
      <div className="pointer-events-none fixed inset-0 z-0 nebula-bg animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="hunter-grid-bg pointer-events-none fixed inset-0 z-0 opacity-70" />
      <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-20" />

      <main className="relative z-20 mx-auto flex w-full max-w-6xl flex-col items-center gap-10 p-6 md:min-h-screen md:flex-row md:gap-12">
        <section className="hidden flex-1 space-y-8 select-none md:flex md:flex-col">
          <div className="space-y-2">
            <h1 className={`${orbitron.className} text-4xl font-bold tracking-tight text-white`}>
              SYSTEM<span className="text-cyan-300">_RECOVERY</span>
            </h1>
            <p className="pl-1 font-mono text-sm tracking-[0.25em] text-slate-400">ACCESS KEY RESET // V.2.9.1</p>
          </div>
          <div className="holo-card rounded-lg border-l-4 border-l-cyan-300 bg-black/40 p-6">
            <div className="space-y-2 font-mono text-xs text-slate-300">
              <p>&gt; Opening secure recovery channel...</p>
              <p>&gt; Validating hunter identity hash...</p>
              <p className="text-green-400">&gt; Email relay online.</p>
            </div>
          </div>
        </section>

      <Card className="relative z-20 w-full max-w-md border-white/15 bg-black/75 p-8 text-slate-100 holo-card">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className={`${orbitron.className} text-3xl font-bold mb-2 uppercase tracking-[0.16em]`}>Forgot Password</h1>
            <p className="text-slate-400">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@levelup-labs.com"
                className="bg-black/60 border-white/15 text-slate-100 font-mono"
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" className="btn-hunter w-full border border-purple-400/40 bg-purple-700 hover:bg-purple-600 text-white" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm text-slate-400 hover:text-white flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </Card>
      </main>
    </div>
  )
}
