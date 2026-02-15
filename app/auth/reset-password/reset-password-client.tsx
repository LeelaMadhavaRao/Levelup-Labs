'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { resetPassword } from '@/lib/auth'
import { Eye, EyeOff, CheckCircle2, ShieldCheck, KeyRound, LockKeyhole } from 'lucide-react'
import { Orbitron, Rajdhani } from 'next/font/google'

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'] })
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

export default function ResetPasswordClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(true)

  useEffect(() => {
    // Check if we have the required token in the URL
    const token = searchParams.get('token')
    if (!token) {
      setTokenValid(false)
      toast.error('Invalid or missing reset token')
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    // Supabase handles the token via session exchange; pass a placeholder
    const token = searchParams.get('token') || searchParams.get('code') || searchParams.get('token_hash') || 'session-based'

    setLoading(true)
    try {
      const { error } = await resetPassword(token, password)

      if (error) {
        toast.error(typeof error === 'string' ? error : 'Failed to reset password. Please try again.')
        if (error.includes('expired') || error.includes('invalid')) {
          setTokenValid(false)
        }
      } else {
        setResetSuccess(true)
        toast.success('Password reset successfully!')
      }
    } catch (error) {
      toast.error('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!tokenValid) {
    return (
      <div className={`${rajdhani.className} relative min-h-screen overflow-hidden bg-[#050508] text-slate-100`}>
        <div className="pointer-events-none fixed inset-0 z-0 nebula-bg animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="hunter-grid-bg pointer-events-none fixed inset-0 z-0 opacity-70" />
        <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-20" />

        <main className="relative z-20 mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center p-6">
        <Card className="relative z-20 w-full max-w-xl border-red-500/40 bg-black/75 p-8 text-slate-100 holo-card">
          <div className="text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10">
              <CheckCircle2 className="h-8 w-8 text-red-500" />
            </div>
            <h1 className={`${orbitron.className} text-3xl font-bold uppercase tracking-[0.12em]`}>Invalid Reset Link</h1>
            <p className="text-slate-400">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Button
              onClick={() => router.push('/auth/forgot-password')}
              className="btn-hunter w-full border border-purple-400/40 bg-purple-700 text-white hover:bg-purple-600"
            >
              Request New Reset Link
            </Button>
          </div>
        </Card>
        </main>
      </div>
    )
  }

  if (resetSuccess) {
    return (
      <div className={`${rajdhani.className} relative min-h-screen overflow-hidden bg-[#050508] text-slate-100`}>
        <div className="pointer-events-none fixed inset-0 z-0 nebula-bg animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="hunter-grid-bg pointer-events-none fixed inset-0 z-0 opacity-70" />
        <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-20" />

        <main className="relative z-20 mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center p-6">
        <Card className="relative z-20 w-full max-w-xl border-emerald-500/40 bg-black/75 p-8 text-slate-100 holo-card">
          <div className="text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className={`${orbitron.className} text-3xl font-bold uppercase tracking-[0.12em]`}>Password Reset</h1>
            <p className="text-slate-400">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <Button
              onClick={() => router.push('/auth/login')}
              className="btn-hunter w-full border border-purple-400/40 bg-purple-700 text-white hover:bg-purple-600"
            >
              Go to Login
            </Button>
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
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-7 w-7 text-cyan-300" />
              <h1 className={`${orbitron.className} text-4xl font-bold tracking-tight text-white`}>
                SYSTEM<span className="text-cyan-300">_RECOVERY</span>
              </h1>
            </div>
            <p className="pl-1 font-mono text-sm tracking-[0.25em] text-slate-400">PASSWORD REFORGE PROTOCOL // V.3.1.2</p>
          </div>

          <div className="holo-card rounded-lg border-l-4 border-l-cyan-300 bg-black/40 p-6">
            <div className="space-y-2 font-mono text-xs text-slate-300">
              <p>&gt; Verifying reset access key...</p>
              <p>&gt; Synchronizing hunter identity...</p>
              <p className="text-green-400">&gt; Recovery channel established.</p>
              <p className="animate-pulse">&gt; Awaiting new secure passphrase_</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">Encryption</div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                <span className="font-bold text-green-400">ACTIVE</span>
              </div>
            </div>
            <div className="rounded border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">Security Layer</div>
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-purple-300" />
                <span className="font-bold text-white">TIER S</span>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-[520px]">
          <div className="holo-card relative overflow-hidden rounded-xl bg-black/60 p-8 shadow-[0_0_20px_rgba(166,13,242,0.4)] backdrop-blur-xl">
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-50 animate-pulse" />

            <div className="mb-8 text-center">
              <h2 className={`${orbitron.className} mb-2 text-2xl font-bold uppercase tracking-[0.2em] text-white`}>Reset Password</h2>
              <p className="text-slate-400">Enter your new secure password below.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <Label htmlFor="password" className="ml-1 font-mono text-xs uppercase tracking-wider text-cyan-300">New Password</Label>
                <div className="terminal-input-group relative">
                  <span className="corner-bracket tl" />
                  <span className="corner-bracket tr" />
                  <span className="corner-bracket bl" />
                  <span className="corner-bracket br" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ENTER_NEW_SECRET"
                    className="w-full bg-black/50 p-4 pr-12 font-mono tracking-wider text-white placeholder:text-slate-600"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="ml-1 font-mono text-xs uppercase tracking-wider text-cyan-300">Confirm Password</Label>
                <div className="terminal-input-group relative">
                  <span className="corner-bracket tl" />
                  <span className="corner-bracket tr" />
                  <span className="corner-bracket bl" />
                  <span className="corner-bracket br" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="CONFIRM_SECRET"
                    className="w-full bg-black/50 p-4 pr-12 font-mono tracking-wider text-white placeholder:text-slate-600"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="btn-hunter w-full border border-purple-400/40 bg-purple-700 text-white hover:bg-purple-600" disabled={loading}>
                <LockKeyhole className="mr-2 h-4 w-4" />
                {loading ? 'REFORGING...' : 'REFORGE PASSWORD'}
              </Button>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}
