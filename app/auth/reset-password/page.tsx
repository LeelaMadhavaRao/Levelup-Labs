import { Suspense } from 'react'
import ResetPasswordClient from './reset-password-client'

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  )
}
