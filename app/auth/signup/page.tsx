'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpWithEmail, loginWithGoogle } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Orbitron, Rajdhani } from 'next/font/google';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'] });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
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
        // Email confirmation required
        setSuccess(
          `Account created! Please check your email (${formData.email}) and click the confirmation link to activate your account.`
        );
        setLoading(false);
      } else {
        // No confirmation needed, redirect to home
        router.push('/');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
    <div className={`${rajdhani.className} relative min-h-screen overflow-hidden bg-[#050508] text-slate-100 p-4 flex items-center justify-center`}>
      <div className="pointer-events-none fixed inset-0 z-0 nebula-bg animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-20" />

      <Card className="relative z-20 w-full max-w-md border-white/15 bg-black/70 text-slate-100 shadow-[0_0_24px_rgba(166,13,242,0.35)]">
        <CardHeader className="space-y-1">
          <CardTitle className={`${orbitron.className} text-2xl font-bold text-center`}>Awaken Hunter Account</CardTitle>
          <CardDescription className="text-center text-slate-400">
            Join Levelup-Labs and enter the Solo Leveling system
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="bg-emerald-500/10 text-emerald-200 border-emerald-500/30">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="John Doe"
                className="bg-black/60 border-white/15 text-slate-100"
                value={formData.fullName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                className="bg-black/60 border-white/15 text-slate-100"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="bg-black/60 border-white/15 text-slate-100"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="bg-black/60 border-white/15 text-slate-100"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-purple-700 hover:bg-purple-600 text-white" disabled={loading}>
              {loading ? 'Awakening account...' : 'Register Hunter'}
            </Button>

            <Button onClick={handleGoogleSignup} className="group/google flex w-full items-center justify-center gap-3 border border-cyan-300/30 bg-black/40 px-6 py-3 font-mono text-white transition-all duration-300 hover:border-cyan-300 hover:bg-cyan-300/10 hover:shadow-[0_0_15px_rgba(0,243,255,0.3)] disabled:opacity-50" disabled={googleLoading || loading}>
              <svg className="h-5 w-5 group-hover/google:animate-pulse" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
                <path d="M21.35 11.1H12v2.8h5.35c-.23 1.37-1.19 2.53-2.53 3.25v2.7h4.08C20.68 19.03 22 15.43 22 12c0-.56-.04-1.11-.11-1.65z" fill="#4285F4"/>
                <path d="M12 22c2.7 0 4.98-.9 6.64-2.45l-4.08-2.7c-.98.64-2.24 1.02-3.96 1.02-3.04 0-5.61-2.06-6.53-4.83H1.29v3.03C3.02 19.6 7.24 22 12 22z" fill="#34A853"/>
                <path d="M5.47 13.04A6.99 6.99 0 0 1 5 12c0-.34.03-.67.08-1.04V7.92H1.29A10.99 10.99 0 0 0 0 12c0 1.86.45 3.62 1.29 5.08l4.18-4.04z" fill="#FBBC05"/>
                <path d="M12 6.5c1.47 0 2.78.5 3.82 1.48l2.86-2.86C16.98 3.66 14.7 2.5 12 2.5 7.24 2.5 3.02 4.9 1.29 7.92l4.18 3.04C6.39 8.56 8.96 6.5 12 6.5z" fill="#EA4335"/>
              </svg>
              <span className="text-sm tracking-wider">{googleLoading ? 'CONNECTING...' : 'Continue with Google'}</span>
            </Button>

            <div className="text-sm text-center text-slate-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
