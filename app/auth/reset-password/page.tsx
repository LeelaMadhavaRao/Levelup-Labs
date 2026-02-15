import { Suspense } from 'react'
import ResetPasswordClient from './reset-password-client'

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen overflow-hidden bg-[#050508] text-slate-200">
          <div className="pointer-events-none fixed inset-0 z-0 nebula-bg animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="hunter-grid-bg pointer-events-none fixed inset-0 z-0 opacity-70" />
          <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-20" />
          <div className="relative z-20 flex min-h-screen items-center justify-center p-4">
            <div className="rounded border border-cyan-400/30 bg-black/60 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
              Initializing Recovery Terminal...
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  )
}
