'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginWithGoogle, signInWithEmail } from '@/lib/auth';
import { ShieldCheck, Settings, BadgeCheck, Lock, LogIn, Users } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepAlive, setKeepAlive] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [clock, setClock] = useState<string>(() => new Date().toLocaleTimeString('en-US', { hour12: false }));

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user, error: signInError } = await signInWithEmail(email, password);
      
      if (signInError) {
        setError(signInError);
        setLoading(false);
        return;
      }

      setLoading(false);
      // Check if user is admin
      if (user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      await loginWithGoogle();
    } catch {
      setError('Google authentication failed');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050508] text-slate-100 selection:bg-cyan-300 selection:text-black">
      <div className="pointer-events-none fixed inset-0 z-0 nebula-bg animate-pulse" style={{ animationDuration: '4s' }} />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.06]"
        style={{ backgroundImage: 'radial-gradient(rgba(0, 243, 255, 0.2) 1px, transparent 1px)', backgroundSize: '50px 50px' }}
      />

      <main className="relative z-20 mx-auto flex w-full max-w-6xl flex-col items-center gap-10 p-6 md:min-h-screen md:flex-row md:gap-12">
        <section className="hidden flex-1 space-y-8 select-none md:flex md:flex-col">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Settings className="h-7 w-7 animate-spin text-cyan-300" style={{ animationDuration: '3s' }} />
              <h1 className="text-4xl font-bold tracking-tight text-white">
                SYSTEM<span className="text-cyan-300">_ENTRY</span>
              </h1>
            </div>
            <p className="pl-1 font-mono text-sm tracking-[0.25em] text-slate-400">SECURE TERMINAL ACCESS // V.2.0.4</p>
          </div>

          <div className="holo-card rounded-lg border-l-4 border-l-cyan-300 bg-black/40 p-6">
            <div className="space-y-2 font-mono text-xs text-slate-300">
              <p>&gt; Initializing handshake protocol...</p>
              <p>&gt; Checking security clearance...</p>
              <p className="text-green-400">&gt; Connection established.</p>
              <p className="animate-pulse">&gt; Awaiting user credentials_</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">Server Status</div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                <span className="font-bold text-green-400">ONLINE</span>
              </div>
            </div>
            <div className="rounded border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">Users Active</div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-300" />
                <span className="font-bold text-white">84,209</span>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-[520px]">
          <div className="holo-card group relative overflow-hidden rounded-xl bg-black/60 p-8 shadow-[0_0_20px_rgba(166,13,242,0.15)] backdrop-blur-xl">
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-50 animate-pulse" />

            <div className="relative mb-8 text-center">
              <h2 className="mb-2 text-2xl font-bold uppercase tracking-[0.2em] text-white">Identify Yourself</h2>
              <div className="mx-auto h-0.5 w-16 bg-cyan-300 shadow-[0_0_12px_rgba(0,243,255,0.45)]" />
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
              )}

              <div className="space-y-1">
                <label className="ml-1 font-mono text-xs uppercase tracking-wider text-cyan-300" htmlFor="email">Username / ID</label>
                <div className="terminal-input-group relative">
                  <span className="corner-bracket tl" />
                  <span className="corner-bracket tr" />
                  <span className="corner-bracket bl" />
                  <span className="corner-bracket br" />
                  <input
                    id="email"
                    type="email"
                    placeholder="ENTER_ID"
                    className="w-full bg-black/50 p-4 pr-12 font-mono tracking-wider text-white placeholder:text-slate-600 focus:outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                  />
                  <BadgeCheck className="pointer-events-none absolute right-4 top-4 h-5 w-5 text-slate-600" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="ml-1 font-mono text-xs uppercase tracking-wider text-cyan-300" htmlFor="password">Password</label>
                <div className="terminal-input-group relative">
                  <span className="corner-bracket tl" />
                  <span className="corner-bracket tr" />
                  <span className="corner-bracket bl" />
                  <span className="corner-bracket br" />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    className="w-full bg-black/50 p-4 pr-12 font-mono tracking-wider text-white placeholder:text-slate-600 focus:outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                  />
                  <Lock className="pointer-events-none absolute right-4 top-4 h-5 w-5 text-slate-600" />
                </div>
              </div>

              <div className="flex items-center justify-between font-mono text-xs text-slate-400">
                <label className="flex cursor-pointer items-center transition-colors hover:text-white">
                  <input
                    className="mr-2 h-3.5 w-3.5 rounded border-slate-600 bg-black text-cyan-300"
                    type="checkbox"
                    checked={keepAlive}
                    onChange={(e) => setKeepAlive(e.target.checked)}
                    disabled={loading || googleLoading}
                  />
                  Keep connection alive
                </label>
                <Link href="/auth/forgot-password" className="underline-offset-4 transition-colors hover:text-cyan-300 hover:underline">
                  Lost access key?
                </Link>
              </div>

              <button
                type="submit"
                className="group/btn relative w-full overflow-hidden bg-[#a60df2] px-6 py-4 font-bold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-[#a60df2]/90 disabled:opacity-50"
                disabled={loading || googleLoading}
              >
                <div className="absolute inset-0 h-full w-full -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <LogIn className="h-4 w-4" />
                  {loading ? 'AUTHENTICATING...' : 'INITIATE LOGIN'}
                </span>
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-700" />
                <span className="mx-4 flex-shrink-0 font-mono text-xs uppercase text-slate-500">Or Authenticate With</span>
                <div className="flex-grow border-t border-slate-700" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading}
                className="group/google flex w-full items-center justify-center gap-3 border border-cyan-300/30 bg-black/40 px-6 py-3 font-mono text-white transition-all duration-300 hover:border-cyan-300 hover:bg-cyan-300/10 hover:shadow-[0_0_15px_rgba(0,243,255,0.3)] disabled:opacity-50"
              >
                <svg className="h-5 w-5 group-hover/google:animate-pulse" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26-1.19-.58z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="text-sm tracking-wider">{googleLoading ? 'CONNECTING...' : 'Google Access'}</span>
              </button>
            </form>

            <div className="mt-8 text-center text-xs text-slate-500">
              New Entity?
              <Link href="/auth/signup" className="ml-1 font-bold text-cyan-300 transition-colors hover:text-white">
                REGISTER_SOUL
              </Link>
            </div>
          </div>

          <div className="mt-4 flex justify-between px-4 font-mono text-[10px] uppercase text-slate-600">
            <span>
              Sys_Time: <span className="text-slate-400">{clock}</span>
            </span>
            <span>
              Region: <span className="text-slate-400">NEO_SEOUL</span>
            </span>
          </div>
        </section>
      </main>

      <div className="pointer-events-none fixed bottom-4 left-4 flex items-center gap-2 rounded border border-cyan-400/30 bg-black/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-cyan-300 md:hidden">
        <ShieldCheck className="h-3 w-3" /> Secure Terminal Access
      </div>
    </div>
  );
}
