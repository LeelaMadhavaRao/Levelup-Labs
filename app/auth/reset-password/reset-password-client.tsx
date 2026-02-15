'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { resetPassword } from '@/lib/auth'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'
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
      <div className={`${rajdhani.className} relative min-h-screen bg-[#050508] flex items-center justify-center p-4 text-slate-100`}>
        <div className="pointer-events-none fixed inset-0 z-0 nebula-bg animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-20" />

        <Card className="relative z-20 w-full max-w-md border-red-500/40 bg-black/70 p-8 text-slate-100">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-red-500" />
            </div>
            <h1 className={`${orbitron.className} text-2xl font-bold`}>Invalid Reset Link</h1>
            <p className="text-slate-400">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Button
              onClick={() => router.push('/auth/forgot-password')}
              className="w-full bg-purple-700 hover:bg-purple-600 text-white"
            >
              Request New Reset Link
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (resetSuccess) {
    return (
      <div className={`${rajdhani.className} relative min-h-screen bg-[#050508] flex items-center justify-center p-4 text-slate-100`}>
        <div className="pointer-events-none fixed inset-0 z-0 nebula-bg animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-20" />

        <Card className="relative z-20 w-full max-w-md border-emerald-500/40 bg-black/70 p-8 text-slate-100">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className={`${orbitron.className} text-2xl font-bold`}>Password Reset!</h1>
            <p className="text-slate-400">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-purple-700 hover:bg-purple-600 text-white"
            >
              Go to Login
            </Button>
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
        <div className="text-center space-y-2 mb-8">
          <h1 className={`${orbitron.className} text-2xl font-bold`}>Reset Password</h1>
          <p className="text-slate-400">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="bg-black/60 border-white/15 text-slate-100 pr-10"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="bg-black/60 border-white/15 text-slate-100 pr-10"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full bg-purple-700 hover:bg-purple-600 text-white" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
