'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Orbitron, Rajdhani } from 'next/font/google';
import { generateHunterAvatarUrl, getCurrentUser } from '@/lib/auth';
import { isGeneratedHunterAvatarUrl } from '@/lib/avatar';
import { getHunterRankByXp } from '@/lib/hunter-rank';
import { subscribeToUserGamification } from '@/lib/realtime';
import {
  getGamificationOverview,
  getRecentPointEvents,
  getUserAchievements,
  type GamificationOverview,
  type UserAchievement,
} from '@/lib/gamification';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Edit,
  Flame,
  Globe,
  Bell,
  Target,
  Coffee,
  Bug,
  Zap,
  Sparkles,
  Lock,
  Users,
  ArrowUpRight,
} from 'lucide-react';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'] });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

type ProfileUser = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  rank: number | null;
  title: string | null;
  level: number | null;
  xp: number | null;
  total_xp?: number | null;
  total_points: number | null;
  problems_solved: number | null;
  courses_completed: number | null;
  github_username: string | null;
  linkedin_url: string | null;
  created_at: string | null;
};

type XpEvent = {
  id: string;
  event_type: string;
  created_at: string;
  points_awarded?: number;
};

export default function ProfilePage() {
  const router = useRouter();
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'S' | 'A' | 'B'>('all');
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [overview, setOverview] = useState<GamificationOverview | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [xpEvents, setXpEvents] = useState<XpEvent[]>([]);
  const [avatarSrc, setAvatarSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const currentUser = (await getCurrentUser()) as ProfileUser | null;

      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      setUser(currentUser);
      setAvatarSrc(currentUser.avatar_url || generateHunterAvatarUrl(`${currentUser.id}-${currentUser.full_name || currentUser.email || 'hunter'}`));

      const [overviewRes, xpEventsRes, achievementsRes] = await Promise.all([
        getGamificationOverview(currentUser.id),
        getRecentPointEvents(currentUser.id, 8),
        getUserAchievements(currentUser.id),
      ]);

      setOverview(overviewRes);
      setXpEvents(xpEventsRes as XpEvent[]);
      setAchievements(achievementsRes);
    } catch {
      setOverview(null);
      setXpEvents([]);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = subscribeToUserGamification(user.id, () => {
      void loadData();
    });
    return unsubscribe;
  }, [user?.id, loadData]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatJoinedDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-20 rounded bg-white/10" />
          <div className="h-[560px] rounded bg-white/10" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-8 max-w-6xl">
        <div className="rounded-lg border border-white/10 bg-black/60 py-16 text-center">
          <h2 className="mb-2 text-xl font-semibold">User not found</h2>
          <Button onClick={() => router.push('/auth/login')}>Sign In</Button>
        </div>
      </div>
    );
  }

  const rankLabel = overview?.rank ? `#${overview.rank}` : user.rank ? `#${user.rank}` : '#405';
  const streak = overview?.current_streak ?? 0;
  const totalXp = Number(overview?.xp ?? overview?.total_xp ?? user.xp ?? user.total_xp ?? user.total_points ?? 0);
  const hunterRank = getHunterRankByXp(totalXp);
  const problemsSolved = Number(user.problems_solved ?? 0);
  const coursesCompleted = Number(user.courses_completed ?? 0);
  const githubUsername = user.github_username ? String(user.github_username) : null;
  const linkedinUrl = user.linkedin_url ? String(user.linkedin_url) : null;
  const easySolved = Math.round(problemsSolved * 0.34);
  const mediumSolved = Math.round(problemsSolved * 0.48);
  const hardSolved = Math.max(0, problemsSolved - easySolved - mediumSolved);
  const xp = totalXp;
  const level = Math.max(1, Math.floor(xp / 1000) + 1);
  const xpInLevel = xp % 1000;
  const xpTarget = 1000;
  const xpPercent = Math.min(100, Math.round((xpInLevel / xpTarget) * 100));
  const recentActivityAt = xpEvents[0]?.created_at ?? null;
  const memberSince = formatJoinedDate(user.created_at);

  const primaryBadges = achievements.slice(0, 5);
  const rankByBadgeIndex = (idx: number): 'S' | 'A' | 'B' => {
    if (idx < 2) return 'S';
    if (idx < 5) return 'A';
    return 'B';
  };
  const filteredBadges = primaryBadges.filter((_, idx) => {
    if (badgeFilter === 'all') return true;
    return rankByBadgeIndex(idx) === badgeFilter;
  });
  const recentFeats = xpEvents.slice(0, 3);

  return (
    <div className={`${rajdhani.className} relative min-h-screen overflow-hidden text-slate-200`}>
      <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-10" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-purple-950/20 via-black to-cyan-950/20" />

      <div className="relative z-20 mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-purple-300">System // Hunter Profile</p>
            <h1 className={`${orbitron.className} text-3xl font-bold text-white md:text-4xl`}>Profile Overview</h1>
          </div>
          <div className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-400">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Online Status: Active
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-3">
            <div className="group relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-b from-purple-500/40 to-transparent opacity-25 blur-xl transition duration-500 group-hover:opacity-45" />
              <div className="relative flex h-[500px] flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-950 shadow-[0_0_30px_rgba(127,13,242,0.18)]">
                <div className="absolute left-4 top-4 z-20">
                  <div className="flex items-center gap-2 rounded border border-purple-400/50 bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5 text-purple-300" />
                    {hunterRank.label} HUNTER
                  </div>
                </div>

                <div className="relative flex-grow overflow-hidden bg-slate-900 rankup-orb">
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#140c1c] via-transparent to-transparent" />
                  {user.id ? (
                    <img
                      src={avatarSrc}
                      alt={user.full_name || 'Hunter avatar'}
                      onError={() => setAvatarSrc(generateHunterAvatarUrl(`${user.id}-${user.full_name || user.email || 'hunter'}`))}
                      className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-6xl font-black text-purple-300/70">{getInitials(user.full_name || 'U')}</div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 z-0 h-1/2 bg-gradient-to-t from-purple-500/20 to-transparent" />
                </div>
                {isGeneratedHunterAvatarUrl(avatarSrc) && (
                  <div className="mt-2 text-xs text-slate-400">Auto-generated avatar</div>
                )}

                <div className="relative z-20 border-t border-white/10 bg-[#140c1c] p-6">
                  <h2 className="mb-1 text-3xl font-bold text-white">{user.full_name || 'Unknown Hunter'}</h2>
                  <p className="mb-4 text-sm font-medium text-purple-300">{overview?.title || user.title || 'Shadow Coder'} · Lvl. {level}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>XP Progress</span>
                      <span className="text-white">{xpInLevel.toLocaleString()} / {xpTarget.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-300 shadow-[0_0_10px_rgba(127,13,242,0.5)]"
                        style={{ width: `${xpPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-slate-900/50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded border border-white/10 bg-slate-800">
                <Users className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <div className="text-xs uppercase text-slate-400">Current Guild</div>
                <div className="font-medium text-white">{githubUsername ? `@${githubUsername}` : 'Independent Hunter'}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <Trophy className="h-5 w-5 text-purple-300" />
                Collection Hall
              </h2>
              <div className="flex gap-2">
                {([
                  { key: 'all', label: 'All' },
                  { key: 'S', label: 'S-Rank' },
                  { key: 'A', label: 'A-Rank' },
                  { key: 'B', label: 'B-Rank' },
                ] as const).map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setBadgeFilter(filter.key)}
                    className={`rounded px-3 py-1 text-xs border transition-colors ${
                      badgeFilter === filter.key
                        ? 'border-purple-500/30 bg-purple-500/20 text-purple-200'
                        : 'border-white/10 bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 p-6">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#7f0df2 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="relative z-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {filteredBadges.map((achievement) => {
                  const originalIndex = primaryBadges.findIndex((item) => item.id === achievement.id);
                  const isS = rankByBadgeIndex(Math.max(0, originalIndex)) === 'S';
                  return (
                    <div
                      key={achievement.id}
                      className={`group relative aspect-square rounded-lg border p-4 text-center transition-all duration-300 ${
                        isS
                          ? 'border-purple-400/40 bg-slate-800/80 shadow-[0_0_25px_rgba(127,13,242,0.18)] hover:border-purple-400'
                          : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="mb-3 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg transition-transform group-hover:scale-110">
                        {originalIndex % 5 === 0 ? <Sparkles className="h-6 w-6 text-white" /> : originalIndex % 5 === 1 ? <Zap className="h-6 w-6 text-white" /> : originalIndex % 5 === 2 ? <Bug className="h-6 w-6 text-white" /> : originalIndex % 5 === 3 ? <Target className="h-6 w-6 text-white" /> : <Coffee className="h-6 w-6 text-white" />}
                      </div>
                      <h3 className="mb-1 line-clamp-2 text-sm font-bold text-white">{achievement.name}</h3>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${isS ? 'border border-purple-400/40 bg-purple-500/10 text-purple-300' : 'border border-cyan-400/30 bg-cyan-500/10 text-cyan-300'}`}>
                        {isS ? 'S-Rank' : 'A-Rank'}
                      </span>
                    </div>
                  );
                })}

                {primaryBadges.length < 6 && (
                  <div className="flex aspect-square flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900/30 opacity-60">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
                      <Lock className="h-5 w-5 text-slate-600" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Locked</h3>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-slate-900/40 p-4">
              <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">Recent Feats</h3>
              <div className="space-y-3">
                {recentFeats.length === 0 ? (
                  <div className="text-sm text-slate-500">No recent feats yet. Complete missions to generate activity.</div>
                ) : (
                  recentFeats.map((event, index) => (
                    <div key={event.id} className="flex items-center gap-3 text-sm">
                      <div className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-purple-400 shadow-[0_0_5px_#7f0df2]' : 'bg-slate-600'}`} />
                      <span className="text-slate-300">{String(event.event_type || 'progress_update').replace(/_/g, ' ')}</span>
                      <span className="ml-auto text-xs text-slate-600">{formatShortDate(event.created_at)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-3">
            <Button
              className="group relative w-full overflow-hidden border-2 border-purple-500 bg-[#191022] py-6 font-bold text-white shadow-[0_0_20px_-5px_rgba(127,13,242,0.5)] transition-all hover:shadow-[0_0_30px_-5px_rgba(127,13,242,0.7)]"
              onClick={() => router.push('/profile/edit')}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Edit className="h-4 w-4 text-purple-300 transition-colors group-hover:text-white" />
                Edit Hunter Profile
              </span>
              <span className="absolute inset-0 -translate-x-full bg-purple-500/20 transition-transform duration-300 group-hover:translate-x-0" />
            </Button>

            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-lg border border-white/10 bg-slate-900 p-5">
                <Globe className="absolute right-3 top-3 h-12 w-12 text-white/10" />
                <p className="mb-1 text-xs uppercase text-slate-400">Global Rank</p>
                <div className={`${orbitron.className} text-4xl font-bold text-white`}>{rankLabel}</div>
                <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Top {overview?.rank ? Math.max(0.1, (overview.rank / 5000) * 100).toFixed(1) : '0.8'}%
                </div>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-white/10 bg-slate-900 p-5">
                <Bell className="absolute right-3 top-3 h-12 w-12 text-purple-500/20" />
                <p className="mb-1 text-xs uppercase text-slate-400">Problems Solved</p>
                <div className="text-4xl font-bold text-white">{problemsSolved.toLocaleString()}</div>
                <div className="mt-3 grid grid-cols-3 gap-1 text-center text-[10px]">
                  <div className="rounded bg-slate-800 py-1">
                    <div className="font-bold text-green-400">{easySolved}</div>
                    <div className="text-slate-500">Easy</div>
                  </div>
                  <div className="rounded bg-slate-800 py-1">
                    <div className="font-bold text-yellow-400">{mediumSolved}</div>
                    <div className="text-slate-500">Med</div>
                  </div>
                  <div className="rounded bg-slate-800 py-1">
                    <div className="font-bold text-red-400">{hardSolved}</div>
                    <div className="text-slate-500">Hard</div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-white/10 bg-slate-900 p-5">
                <Flame className="absolute right-3 top-3 h-12 w-12 text-orange-500/20" />
                <p className="mb-1 text-xs uppercase text-slate-400">Current Streak</p>
                <div className="text-4xl font-bold text-white">
                  {streak} <span className="text-lg font-normal text-slate-500">Days</span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-orange-500" style={{ width: `${Math.min(100, Math.max(15, streak * 6))}%` }} />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
              <div className="mb-1 font-semibold text-white">Hunter Score</div>
              <div className="text-xs text-slate-400">XP: <span className="text-purple-300">{xp.toLocaleString()}</span></div>
              <div className="text-xs text-slate-400">Current Rank: <span className="text-purple-300">{hunterRank.label}</span></div>
              <div className="text-xs text-slate-400">Courses Completed: <span className="text-cyan-300">{coursesCompleted.toLocaleString()}</span></div>
              <div className="text-xs text-slate-400">Member Since: <span className="text-slate-300">{memberSince}</span></div>
              <div className="text-xs text-slate-400">Last Activity: <span className="text-slate-300">{recentActivityAt ? formatShortDate(recentActivityAt) : 'No activity yet'}</span></div>
              <div className="text-xs text-slate-400">GitHub: <span className="text-slate-300">{githubUsername ? `@${githubUsername}` : 'Not set'}</span></div>
              <div className="text-xs text-slate-400">LinkedIn: <span className="text-slate-300">{linkedinUrl || 'Not set'}</span></div>
              <div className="text-xs text-slate-400">Email: <span className="text-slate-300">{user.email}</span></div>
            </div>
          </div>
        </div>

        <footer className="mt-12 border-t border-white/10 py-8 text-sm text-slate-500">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div>© 2026 Levelup-Labs. All rights reserved.</div>
            <div className="flex gap-6">
              <span className="cursor-default hover:text-purple-300">Privacy Policy</span>
              <span className="cursor-default hover:text-purple-300">Terms of Service</span>
              <span className="cursor-default hover:text-purple-300">Help Center</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
