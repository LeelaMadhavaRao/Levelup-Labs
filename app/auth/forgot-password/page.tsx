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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-neutral-800 bg-card/80 p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border border-neutral-800">
                <Mail className="w-8 h-8 text-cyan-300" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Check Your Email</h1>
              <p className="text-muted-foreground">
                We've sent a password reset link to <strong className="text-foreground">{email}</strong>
              </p>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-neutral-800 bg-card/80 p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Forgot Password?</h1>
            <p className="text-muted-foreground">
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
                className="bg-background"
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
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
