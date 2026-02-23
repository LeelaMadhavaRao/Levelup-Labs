'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import { Flame, LogOut, Menu, Trophy, User, X, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [playerStats, setPlayerStats] = useState<{ level: number; streak: number; points: number; xp: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRankUp, setShowRankUp] = useState(false);
  const [rankUpLabel, setRankUpLabel] = useState('E-RANK');

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
        points = Number(overview.total_xp || points);
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

  const isAdmin = user?.role === 'admin';

  const navLinks = user
    ? isAdmin
      ? [
          { href: '/admin/dashboard', label: 'Admin' },
          { href: '/admin/create-course', label: 'Create' },
          { href: '/admin/courses', label: 'Courses' },
          { href: '/leaderboard', label: 'Leaderboard' },
        ]
      : [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/courses', label: 'Courses' },
          { href: '/my-courses', label: 'My Courses' },
          { href: '/practice', label: 'Practice' },
          { href: '/leaderboard', label: 'Leaderboard' },
        ]
    : [];

  const totalPoints = Number(playerStats?.points ?? user?.total_xp ?? user?.total_points ?? 0);
  const xp = playerStats?.xp || totalPoints || Number(user?.xp || 0);
  const level = Math.max(1, Math.floor(xp / 1000) + 1);
  const hunterRank = getHunterRankByPoints(totalPoints);

  const xpInCurrentLevel = xp % 1000;
  const xpNeededForNextLevel = 1000;
  const xpPercentage = Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">CodeZapra</span>
        </Link>

        {/* Desktop Nav Links */}
        {navLinks.length > 0 && (
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Streak badge */}
          {user && playerStats && !isAdmin && (
            <div className="hidden items-center gap-1.5 rounded-md border border-gray-200 bg-gray-100 px-2.5 py-1.5 sm:flex" title="Daily Streak">
              <Flame className="h-3.5 w-3.5 text-orange-600" />
              <span className="text-xs font-semibold text-orange-600">{playerStats.streak}</span>
            </div>
          )}

          {/* Level badge */}
          {user && !isAdmin && (
            <div className="hidden items-center gap-1.5 rounded-md border border-gray-200 bg-gray-100 px-2.5 py-1.5 sm:flex">
              <span className="text-xs font-semibold text-purple-600">Lvl {level}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs font-medium text-gray-500">{hunterRank.code}-Rank</span>
            </div>
          )}

          {/* User dropdown / Auth buttons */}
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 hover:bg-gray-200">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} alt={user.full_name} />
                    <AvatarFallback className="bg-purple-100 text-xs text-purple-600">
                      {getInitials(user.full_name || 'User')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-gray-200 bg-white">
                <DropdownMenuLabel className="px-3 py-3">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">{isAdmin ? 'Admin' : 'Account'}</p>
                    <p className="truncate text-sm font-medium text-gray-900">{user.full_name}</p>
                    {!isAdmin && (
                      <div className="pt-2">
                        <div className="mb-1 flex justify-between text-[11px] text-gray-500">
                          <span>{hunterRank.label}</span>
                          <span>{xpInCurrentLevel}/{xpNeededForNextLevel} XP</span>
                        </div>
                        <Progress value={xpPercentage} className="h-1.5" />
                      </div>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200" />
                {!isAdmin && (
                  <>
                    <DropdownMenuItem
                      onClick={() => router.push('/profile')}
                      className="cursor-pointer text-gray-600 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900"
                    >
                      <User className="mr-2 h-4 w-4" /> Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push('/leaderboard')}
                      className="cursor-pointer text-gray-600 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900"
                    >
                      <Trophy className="mr-2 h-4 w-4" /> Leaderboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-200" />
                  </>
                )}
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-red-600 hover:text-red-700 focus:bg-red-50 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/auth/login')}
                className="text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                Log in
              </Button>
              <Button
                size="sm"
                onClick={() => router.push('/auth/signup')}
                className="bg-purple-600 text-white hover:bg-purple-500"
              >
                Sign Up
              </Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:bg-gray-100 hover:text-gray-900 md:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-gray-50 md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {!user && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-gray-600"
                  onClick={() => { setMobileMenuOpen(false); router.push('/auth/login'); }}
                >
                  Log in
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-purple-600 text-white hover:bg-purple-500"
                  onClick={() => { setMobileMenuOpen(false); router.push('/auth/signup'); }}
                >
                  Sign Up
                </Button>
              </div>
            )}

            {user && (
              <button
                className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}

      <RankUpOverlay open={showRankUp} rankLabel={rankUpLabel} onCloseAction={() => setShowRankUp(false)} />
    </nav>
  );
}
