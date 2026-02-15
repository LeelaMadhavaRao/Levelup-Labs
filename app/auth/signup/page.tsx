'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpWithEmail, loginWithGoogle } from '@/lib/auth';
import { ShieldCheck, Settings, BadgeCheck, Lock, UserPlus, Users, Terminal } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [clock, setClock] = useState<string>('');

  useEffect(() => {
    setClock(new Date().toLocaleTimeString('en-US', { hour12: false }));
    const timer = setInterval(() => {
      setClock(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError, needsConfirmation } = await signUpWithEmail(
        formData.email,
        formData.password,
        formData.fullName
      );

      if (signUpError) {
        setError(signUpError);
        setLoading(false);
        return;
      }

      if (needsConfirmation) {
        setSuccess('Account created! Please check your email and click the confirmation link.');
        setLoading(false);
      } else {
        router.push('/');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError('Google authentication failed');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050508] text-slate-100 selection:bg-purple-500 selection:text-white">
      {/* Background Ambience */}
      <div className="pointer-events-none fixed inset-0 z-0 nebula-bg animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-20" />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-20"
        style={{ backgroundImage: 'radial-gradient(rgba(168, 85, 247, 0.2) 1px, transparent 1px)', backgroundSize: '50px 50px' }}
      />
      
      {/* Header/Clock */}
      <header className="fixed top-0 left-0 right-0 z-30 flex justify-between p-6 opacity-60 mix-blend-screen pointer-events-none">
        <div className="flex items-center gap-2 font-mono text-xs text-purple-400">
           <Terminal className="h-4 w-4" />
           <span>SYSTEM_REGISTRY_V.2.0.4</span>
        </div>
        <div className="font-mono text-xs tracking-widest text-slate-500">{clock}</div>
      </header>

      <main className="relative z-20 mx-auto flex w-full max-w-6xl flex-col items-center gap-10 p-6 md:min-h-screen md:flex-row md:gap-12 justify-center">
        
        {/* Left Concept Panel */}
        <section className="hidden flex-1 space-y-8 select-none md:flex md:flex-col justify-center">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <UserPlus className="h-8 w-8 animate-pulse text-purple-400" />
              <h1 className="text-4xl font-bold tracking-tight text-white font-orbitron">
                HUNTER<span className="text-purple-400">_REGISTRATION</span>
              </h1>
            </div>
            <p className="pl-1 font-mono text-sm tracking-[0.25em] text-slate-400">AWAKEN YOUR POTENTIAL // JOIN THE RANKS</p>
          </div>

          <div className="holo-card rounded-lg border-l-4 border-l-purple-500 bg-black/40 p-6 backdrop-blur-sm">
            <div className="space-y-2 font-mono text-xs text-slate-300">
              <p>&gt; Scanning new user signature...</p>
              <p>&gt; Allocating system resources...</p>
              <p className="text-green-400">&gt; Profile slot available.</p>
              <p className="animate-pulse">&gt; Waiting for input...</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="mb-1 text-xs uppercase tracking-wider text-slate-500 font-mono">Global Rank</div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-slate-500" />
                <span className="font-bold text-slate-300 font-rajdhani">UNRANKED</span>
              </div>
            </div>
            <div className="rounded border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="mb-1 text-xs uppercase tracking-wider text-slate-500 font-mono">Guild Capacity</div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-300" />
                <span className="font-bold text-white font-rajdhani">OPEN</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Form Panel */}
        <section className="w-full max-w-[500px]">
          <div className="holo-card group relative overflow-hidden rounded-xl bg-black/60 p-8 shadow-[0_0_30px_rgba(168,85,247,0.25)] backdrop-blur-xl border border-white/10">
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-80" />

            <div className="relative mb-8 text-center">
              <h2 className="mb-2 text-2xl font-bold uppercase tracking-[0.2em] text-white font-orbitron">New Hunter Profile</h2>
              <div className="mx-auto h-0.5 w-16 bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]" />
            </div>

            <form className="space-y-5" onSubmit={handleSignup}>
              {error && (
                <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-red-200">
                  <span className="text-xs font-mono">{error}</span>
                </div>
              )}
              {success && (
                <div className="rounded border border-green-500/30 bg-green-500/10 p-3 text-green-200">
                   <span className="text-xs font-mono">{success}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="ml-1 font-mono text-[10px] uppercase tracking-wider text-purple-400">Full Name</label>
                <div className="relative group">
                   <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0 rounded opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                   <input
                    name="fullName"
                    type="text"
                    placeholder="ENTER_NAME"
                    className="relative w-full bg-black/50 border border-white/10 p-3 pl-4 font-mono text-sm tracking-wider text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:bg-black/70 rounded transition-all font-rajdhani"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    disabled={loading || googleLoading}
                  />
                  <BadgeCheck className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-600" />
                </div>
              </div>

               <div className="space-y-1">
                <label className="ml-1 font-mono text-[10px] uppercase tracking-wider text-purple-400">Email Address</label>
                <div className="relative group">
                   <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0 rounded opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                   <input
                    name="email"
                    type="email"
                    placeholder="ENTER_EMAIL"
                    className="relative w-full bg-black/50 border border-white/10 p-3 pl-4 font-mono text-sm tracking-wider text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:bg-black/70 rounded transition-all font-rajdhani"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading || googleLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="ml-1 font-mono text-[10px] uppercase tracking-wider text-purple-400">Password</label>
                    <div className="relative group">
                         <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0 rounded opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                        <input
                            name="password"
                            type="password"
                            placeholder="******"
                            className="relative w-full bg-black/50 border border-white/10 p-3 pl-4 font-mono text-sm tracking-wider text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:bg-black/70 rounded transition-all font-rajdhani"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={loading || googleLoading}
                        />
                         <Lock className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-600" />
                    </div>
                </div>

                 <div className="space-y-1">
                    <label className="ml-1 font-mono text-[10px] uppercase tracking-wider text-purple-400">Confirm</label>
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0 rounded opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                        <input
                            name="confirmPassword"
                            type="password"
                            placeholder="******"
                            className="relative w-full bg-black/50 border border-white/10 p-3 pl-4 font-mono text-sm tracking-wider text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:bg-black/70 rounded transition-all font-rajdhani"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            disabled={loading || googleLoading}
                        />
                    </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="group relative w-full overflow-hidden rounded bg-purple-600 p-3 font-mono text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? 'Initializing...' : 'Initialize System'}
                  {!loading && <UserPlus className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
              </button>

               <div className="relative flex items-center gap-4 py-2">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="font-mono text-xs text-slate-500">OR CONNECT WITH</span>
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded border border-white/10 bg-white/5 p-3 text-sm font-bold text-white transition-colors hover:bg-white/10 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] disabled:opacity-50 font-rajdhani"
                onClick={handleGoogleSignup}
                disabled={loading || googleLoading}
              >
                <svg className="h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
                GOOGLE_LINK
              </button>

            </form>

            <div className="mt-6 text-center">
               <Link 
                href="/auth/login" 
                className="text-xs text-slate-400 hover:text-purple-400 transition-colors font-mono tracking-wide"
              >
                  &lt; RETURN_TO_LOGIN /&gt;
               </Link>
            </div>
            
          </div>
        </section>
      </main>
    </div>
  );
}
