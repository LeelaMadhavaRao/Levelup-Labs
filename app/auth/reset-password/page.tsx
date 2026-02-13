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

export default function ResetPasswordPage() {
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

    const token = searchParams.get('token')
    if (!token) {
      toast.error('Invalid reset token')
      return
    }

    setLoading(true)
    try {
      const { error } = await resetPassword(token, password)

      if (error) {
        toast.error(error)
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
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-red-500 p-8">
          <div className="text-center space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-red-400 mb-2">Invalid Reset Link</h1>
              <p className="text-gray-400">
                This password reset link is invalid or has expired.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/auth/forgot-password')}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                Request New Reset Link
              </Button>
              <Button
                onClick={() => router.push('/auth/login')}
                variant="outline"
                className="w-full border-cyan-500 text-cyan-400 hover:bg-cyan-950"
              >
                Back to Login
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-cyan-500 p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-cyan-400 mb-2">Password Reset!</h1>
              <p className="text-gray-400">
                Your password has been successfully reset. You can now log in with your new
                password.
              </p>
            </div>
            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              Continue to Login
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-cyan-500 p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-cyan-400 mb-2">Reset Password</h1>
            <p className="text-gray-400">Enter your new password below.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-cyan-400">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="bg-black border-cyan-500 text-cyan-400 placeholder:text-gray-600 pr-10"
                  disabled={loading}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-cyan-400">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="bg-black border-cyan-500 text-cyan-400 placeholder:text-gray-600 pr-10"
                  disabled={loading}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Match Indicator */}
            {password && confirmPassword && (
              <div
                className={`text-sm ${
                  password === confirmPassword ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {password === confirmPassword
                  ? '✓ Passwords match'
                  : '✗ Passwords do not match'}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-700"
              disabled={loading || password !== confirmPassword}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          {/* Security Note */}
          <div className="bg-gray-800 border border-cyan-500/30 rounded-lg p-4">
            <p className="text-xs text-gray-400">
              <strong className="text-cyan-400">Security Tip:</strong> Choose a strong
              password that includes a mix of letters, numbers, and special characters.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
