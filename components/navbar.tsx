'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { getCurrentUser, signOut } from '@/lib/auth';
import { getGamificationOverview } from '@/lib/gamification';
import { getHunterRankByPoints, getHunterRankFromCode } from '@/lib/hunter-rank';
import RankUpOverlay from '@/components/rank-up-overlay';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Code2, Flame, LogOut, Menu, Moon, Sun, Trophy, User, X } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const [user, setUser] = useState<any>(null);
  const [playerStats, setPlayerStats] = useState<{ level: number; streak: number; points: number; xp: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showRankUp, setShowRankUp] = useState(false);
  const [rankUpLabel, setRankUpLabel] = useState('E-RANK');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    loadUser();
  }, [pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const loadUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      let points = Number(currentUser.total_points || 0);
      let xp = Number(currentUser.xp || 0);
      try {
        const overview = await getGamificationOverview(currentUser.id);
        points = Number(overview.total_points || points);
        xp = Number(overview.xp || xp);
        setPlayerStats({
          level: overview.level,
          streak: overview.current_streak,
          points,
          xp,
        });
      } catch {
        setPlayerStats({
          level: Number(currentUser.level || 1),
          streak: 0,
          points,
          xp,
        });
      }

      if (typeof window !== 'undefined') {
        const currentRank = getHunterRankByPoints(points);
        const storageKey = `cq:last-rank:${currentUser.id}`;
        const storedRankCode = window.localStorage.getItem(storageKey);

        if (!storedRankCode) {
          window.localStorage.setItem(storageKey, currentRank.code);
        } else {
          const previousRank = getHunterRankFromCode(storedRankCode);
          if (currentRank.index > previousRank.index) {
            setRankUpLabel(currentRank.label);
            setShowRankUp(true);
          }
          window.localStorage.setItem(storageKey, currentRank.code);
        }
      }
    } else {
      setPlayerStats(null);
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    router.push('/auth/login');
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const navLinks = user
    ? user.role === 'admin'
      ? [
          { href: '/dashboard', label: 'DASHBOARD' },
          { href: '/admin/dashboard', label: 'ADMIN' },
          { href: '/admin/create-course', label: 'CREATE' },
          { href: '/admin/courses', label: 'CONSOLE' },
          { href: '/courses', label: 'DUNGEONS' },
          { href: '/practice', label: 'PRACTICE' },
          { href: '/leaderboard', label: 'RANKINGS' },
        ]
      : [
          { href: '/dashboard', label: 'DASHBOARD' },
          { href: '/courses', label: 'DUNGEONS' },
          { href: '/my-courses', label: 'MY DUNGEONS' },
          { href: '/practice', label: 'PRACTICE' },
          { href: '/leaderboard', label: 'RANKINGS' },
        ]
    : [];

  const level = playerStats?.level ?? Number(user?.level || 1);
  const xp = playerStats?.xp ?? Number(user?.xp || 0);
  const hunterRank = getHunterRankByPoints(Number(playerStats?.points ?? user?.total_points ?? 0));
  
  // Calculate XP percentage within current level
  // Each level needs 1000 XP, so XP within level = xp % 1000
  const xpInCurrentLevel = xp % 1000;
  const xpNeededForNextLevel = 1000;
  const xpPercentage = Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100);

  return (
    <nav className="sticky top-0 z-50 h-20 w-full border-b border-purple-500/40 bg-[#0b0f1a]/85 backdrop-blur-xl shadow-[0_4px_20px_-5px_rgba(147,13,242,0.5)]">
      <div className="mx-auto flex h-full w-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center">
          <div className="relative mr-3 flex h-10 w-10 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-purple-500/30 blur-md transition-all group-hover:bg-purple-500/50" />
            <Code2 className="relative z-10 h-7 w-7 text-purple-400 transition-colors group-hover:text-white" />
          </div>
          <div className="flex flex-col">
            <span className="bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-xl font-bold tracking-tight text-transparent drop-shadow-[0_0_8px_rgba(147,13,242,0.4)] md:text-2xl">
              LEVELUP-LABS
            </span>
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-purple-400/80">System Online</span>
          </div>
        </Link>

        {navLinks.length > 0 && (
          <div className="hidden items-center space-x-10 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative px-1 py-2 text-xs font-semibold tracking-[0.14em] transition-colors ${
                  pathname === link.href ? 'text-white drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.label}
                <span
                  className={`absolute bottom-0 left-0 h-[2px] bg-cyan-400 shadow-[0_0_10px_#06b6d4] transition-all ${
                    pathname === link.href ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 sm:gap-5">
          {user && playerStats && (
            <div className="hidden items-center space-x-2 rounded border border-white/5 bg-black/20 px-3 py-1.5 backdrop-blur-sm sm:flex" title="Daily Streak">
              <Flame className="h-4 w-4 animate-pulse text-orange-400" />
              <span className="font-mono font-bold text-orange-400">{playerStats.streak}</span>
            </div>
          )}

          {user && (
            <div className="hidden sm:block">
              <div className="group relative">
                <div className="absolute inset-0 rotate-45 rounded-sm bg-purple-500/20 transition-all group-hover:bg-purple-500/40" />
                <div className="relative z-10 rounded-sm border border-purple-500/50 bg-black/40 px-4 py-1 backdrop-blur-md">
                  <span className="text-xs font-bold tracking-widest text-purple-400 transition-colors group-hover:text-white">{hunterRank.code} • LVL {level}</span>
                </div>
              </div>
            </div>
          )}

          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hidden h-9 w-9 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white md:inline-flex"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}

          {loading ? (
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-transparent">
                  <span className="absolute -inset-1 animate-spin rounded-full border-2 border-dashed border-purple-500/60 opacity-70" style={{ animationDuration: '10s' }} />
                  <span className="absolute -inset-1 animate-pulse rounded-full border border-purple-500/30" />
                  <Avatar className="relative z-10 h-10 w-10">
                    <AvatarImage src={user.avatar_url} alt={user.full_name} />
                    <AvatarFallback className="text-xs">{getInitials(user.full_name || 'User')}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 z-20 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-[#0b0f1a] shadow-[0_0_5px_rgba(74,222,128,0.8)]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="mt-3 w-56 overflow-hidden border border-purple-500/30 bg-[#0b0f1a] text-white shadow-[0_0_30px_-5px_rgba(147,13,242,0.3)]">
                <DropdownMenuLabel className="border-b border-purple-500/20 bg-[linear-gradient(135deg,rgba(147,13,242,0.12)_25%,transparent_25%,transparent_50%,rgba(147,13,242,0.12)_50%,rgba(147,13,242,0.12)_75%,transparent_75%,transparent)] bg-[length:10px_10px] px-4 py-3">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">Player Name</p>
                    <p className="truncate text-sm font-bold text-white">{user.full_name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-purple-300">{hunterRank.label}</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                      <div className="h-full rounded-full bg-purple-500" style={{ width: `${xpPercentage}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between font-mono text-[10px] text-gray-500">
                      <span>XP: {xpInCurrentLevel}/{xpNeededForNextLevel}</span>
                      <span>{xpPercentage}%</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push('/profile')} className="group relative rounded-none px-4 py-3 text-gray-300 hover:bg-purple-500/10 hover:text-white">
                  <span className="absolute left-0 top-0 h-full w-1 -translate-x-full bg-purple-500 transition-transform group-hover:translate-x-0" />
                  <User className="mr-2 h-4 w-4" /> Hunter Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/leaderboard')} className="group relative rounded-none px-4 py-3 text-gray-300 hover:bg-purple-500/10 hover:text-white">
                  <span className="absolute left-0 top-0 h-full w-1 -translate-x-full bg-purple-500 transition-transform group-hover:translate-x-0" />
                  <Trophy className="mr-2 h-4 w-4" /> Hunter Ranking
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={handleSignOut} className="group relative rounded-none px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 focus:text-red-300">
                  <span className="absolute left-0 top-0 h-full w-1 -translate-x-full bg-red-500 transition-transform group-hover:translate-x-0" />
                  <LogOut className="mr-2 h-4 w-4" /> System Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/auth/login')}
                className="uppercase tracking-[0.12em] text-gray-300 hover:bg-white/10 hover:text-white"
              >
                Login
              </Button>
              <Button
                size="sm"
                onClick={() => router.push('/auth/signup')}
                className="border border-purple-400/60 bg-purple-600 uppercase tracking-[0.12em] text-white shadow-[0_0_16px_rgba(126,34,206,0.45)] hover:bg-purple-500"
              >
                Initialize
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white md:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-black/95 backdrop-blur-md md:hidden">
          <div className="container space-y-2 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-md border px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] transition-colors ${
                  pathname === link.href
                    ? 'border-purple-400/40 bg-purple-500/20 text-purple-200'
                    : 'border-transparent text-gray-300 hover:border-white/10 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {mounted && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start border-white/20 text-gray-300"
                onClick={() => {
                  toggleTheme();
                  setMobileMenuOpen(false);
                }}
              >
                {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />} Toggle Theme
              </Button>
            )}

            {user && (
              <button
                className="mt-2 w-full rounded-md px-4 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
              >
                System Logout
              </button>
            )}
          </div>
        </div>
      )}

      <RankUpOverlay open={showRankUp} rankLabel={rankUpLabel} onCloseAction={() => setShowRankUp(false)} />
    </nav>
  );
}
