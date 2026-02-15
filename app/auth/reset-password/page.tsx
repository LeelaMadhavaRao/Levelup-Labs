import { Suspense } from 'react'
import ResetPasswordClient from './reset-password-client'

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
          <div className="text-slate-200">Loading...</div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  )
}
