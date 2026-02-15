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
      <div className={`${rajdhani.className} relative min-h-screen bg-[#050508] flex items-center justify-center p-4 text-slate-100`}>
        <div className="pointer-events-none fixed inset-0 z-0 nebula-bg animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-20" />

        <Card className="relative z-20 w-full max-w-md border-white/15 bg-black/70 p-8 text-slate-100">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border border-neutral-800">
                <Mail className="w-8 h-8 text-cyan-300" />
              </div>
            </div>
            <div>
              <h1 className={`${orbitron.className} text-3xl font-bold mb-2`}>Check Your Email</h1>
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
                className="w-full"
              >
                Try Another Email
              </Button>
              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={`${rajdhani.className} relative min-h-screen bg-[#050508] flex items-center justify-center p-4 text-slate-100`}>
      <div className="pointer-events-none fixed inset-0 z-0 nebula-bg animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-20" />

      <Card className="relative z-20 w-full max-w-md border-white/15 bg-black/70 p-8 text-slate-100">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className={`${orbitron.className} text-3xl font-bold mb-2`}>Forgot Password?</h1>
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
                className="bg-black/60 border-white/15 text-slate-100"
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-purple-700 hover:bg-purple-600 text-white" disabled={loading}>
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
    </div>
  )
}
