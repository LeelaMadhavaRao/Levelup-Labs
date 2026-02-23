'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Edit,
  Flame,
  Globe,
  ArrowUpRight,
  Target,
  Sparkles,
  Lock,
  Zap,
  Bug,
  Coffee,
} from 'lucide-react';

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
      setAvatarSrc(
        currentUser.avatar_url ||
          generateHunterAvatarUrl(
            `${currentUser.id}-${currentUser.full_name || currentUser.email || 'user'}`
          )
      );
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

  const formatShortDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

  const formatJoinedDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-20 rounded-lg bg-gray-200" />
          <div className="h-[400px] rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="border-gray-200 bg-white">
          <CardContent className="py-16 text-center">
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              User not found
            </h2>
            <Button
              onClick={() => router.push('/auth/login')}
              className="bg-purple-600 text-white hover:bg-purple-500"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rankLabel = overview?.rank
    ? `#${overview.rank}`
    : user.rank
      ? `#${user.rank}`
      : '#—';
  const streak = overview?.current_streak ?? 0;
  const totalXp = Number(
    overview?.total_xp ??
      overview?.xp ??
      user.total_xp ??
      user.xp ??
      user.total_points ??
      0
  );
  const hunterRank = getHunterRankByXp(totalXp);
  const problemsSolved = Number(user.problems_solved ?? 0);
  const coursesCompleted = Number(user.courses_completed ?? 0);
  const githubUsername = user.github_username
    ? String(user.github_username)
    : null;
  const linkedinUrl = user.linkedin_url ? String(user.linkedin_url) : null;

  const easySolved = Math.round(problemsSolved * 0.34);
  const mediumSolved = Math.round(problemsSolved * 0.48);
  const hardSolved = Math.max(0, problemsSolved - easySolved - mediumSolved);

  const level = Math.max(1, Math.floor(totalXp / 1000) + 1);
  const xpInLevel = totalXp % 1000;
  const xpTarget = 1000;
  const xpPercent = Math.min(100, Math.round((xpInLevel / xpTarget) * 100));

  const memberSince = formatJoinedDate(user.created_at);
  const recentFeats = xpEvents.slice(0, 5);
  const primaryBadges = achievements.slice(0, 6);

  const badgeIcons = [Sparkles, Zap, Bug, Target, Coffee, Trophy];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <Button
          onClick={() => router.push('/profile/edit')}
          className="bg-purple-600 text-white hover:bg-purple-500"
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left column – Avatar & identity */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-6">
              <div className="mb-4 flex flex-col items-center">
                <Avatar className="mb-4 h-28 w-28 border-2 border-purple-200">
                  <AvatarImage
                    src={avatarSrc}
                    onError={() =>
                      setAvatarSrc(
                        generateHunterAvatarUrl(
                          `${user.id}-${user.full_name || user.email || 'user'}`
                        )
                      )
                    }
                  />
                  <AvatarFallback className="bg-purple-50 text-2xl text-purple-600">
                    {(user.full_name || 'U')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold text-gray-900">
                  {user.full_name || 'Unknown User'}
                </h2>
                <p className="text-sm text-gray-500">
                  {overview?.title || user.title || 'Learner'} &middot; Lvl{' '}
                  {level}
                </p>
                <Badge className="mt-2 border-purple-200 bg-purple-50 text-purple-600">
                  {hunterRank.label}
                </Badge>
              </div>
              {/* XP bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>XP Progress</span>
                  <span className="text-gray-900">
                    {xpInLevel.toLocaleString()} / {xpTarget.toLocaleString()}
                  </span>
                </div>
                <Progress
                  value={xpPercent}
                  className="h-2 bg-gray-200 [&>div]:bg-purple-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Info card */}
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-5 text-sm">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                Details
              </h3>
              <div className="space-y-2 text-gray-500">
                <div className="flex justify-between">
                  <span>Email</span>
                  <span className="text-gray-900">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>GitHub</span>
                  <span className="text-gray-900">
                    {githubUsername ? `@${githubUsername}` : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>LinkedIn</span>
                  <span className="text-gray-900">
                    {linkedinUrl ? 'Connected' : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Member Since</span>
                  <span className="text-gray-900">{memberSince}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center column – Achievements & activity */}
        <div className="space-y-6 lg:col-span-5">
          {/* Achievements */}
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                <Trophy className="h-5 w-5 text-purple-600" />
                Achievements
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {primaryBadges.map((achievement, idx) => {
                  const Icon = badgeIcons[idx % badgeIcons.length];
                  return (
                    <div
                      key={achievement.id}
                      className="flex flex-col items-center rounded-lg border border-gray-200 bg-gray-50 p-4 text-center transition-colors hover:border-purple-200"
                    >
                      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-50">
                        <Icon className="h-5 w-5 text-purple-600" />
                      </div>
                      <h4 className="mb-1 line-clamp-2 text-xs font-medium text-gray-900">
                        {achievement.name}
                      </h4>
                    </div>
                  );
                })}

                {primaryBadges.length < 6 && (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-4">
                    <Lock className="mb-1 h-5 w-5 text-slate-600" />
                    <span className="text-xs text-gray-400">Locked</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {recentFeats.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No recent activity yet. Complete tasks to see activity here.
                  </p>
                ) : (
                  recentFeats.map((event, index) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div
                        className={`h-2 w-2 flex-shrink-0 rounded-full ${
                          index === 0 ? 'bg-purple-400' : 'bg-slate-600'
                        }`}
                      />
                      <span className="flex-1 text-gray-600">
                        {String(event.event_type || 'progress_update').replace(
                          /_/g,
                          ' '
                        )}
                      </span>
                      <span className="text-xs text-slate-600">
                        {formatShortDate(event.created_at)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column – Stats */}
        <div className="space-y-4 lg:col-span-3">
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-5">
              <Globe className="mb-1 h-5 w-5 text-gray-400" />
              <p className="text-xs text-gray-500">Global Rank</p>
              <p className="text-3xl font-bold text-gray-900">{rankLabel}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                <ArrowUpRight className="h-3 w-3" />
                Top{' '}
                {overview?.rank
                  ? Math.max(0.1, (overview.rank / 5000) * 100).toFixed(1)
                  : '—'}
                %
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white">
            <CardContent className="p-5">
              <Target className="mb-1 h-5 w-5 text-gray-400" />
              <p className="text-xs text-gray-500">Problems Solved</p>
              <p className="text-3xl font-bold text-gray-900">{problemsSolved}</p>
              <div className="mt-3 grid grid-cols-3 gap-1 text-center text-[10px]">
                <div className="rounded bg-gray-50 py-1">
                  <div className="font-bold text-emerald-400">{easySolved}</div>
                  <div className="text-gray-400">Easy</div>
                </div>
                <div className="rounded bg-gray-50 py-1">
                  <div className="font-bold text-amber-400">
                    {mediumSolved}
                  </div>
                  <div className="text-gray-400">Med</div>
                </div>
                <div className="rounded bg-gray-50 py-1">
                  <div className="font-bold text-red-600">{hardSolved}</div>
                  <div className="text-gray-400">Hard</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white">
            <CardContent className="p-5">
              <Flame className="mb-1 h-5 w-5 text-gray-400" />
              <p className="text-xs text-gray-500">Current Streak</p>
              <p className="text-3xl font-bold text-gray-900">
                {streak}{' '}
                <span className="text-base font-normal text-gray-400">
                  days
                </span>
              </p>
              <Progress
                value={Math.min(100, Math.max(15, streak * 6))}
                className="mt-3 h-1.5 bg-gray-200 [&>div]:bg-orange-500"
              />
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white">
            <CardContent className="p-5 text-sm text-gray-500">
              <p className="mb-1 font-medium text-gray-900">Summary</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>XP</span>
                  <span className="text-purple-600">
                    {totalXp.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Rank</span>
                  <span className="text-purple-600">{hunterRank.label}</span>
                </div>
                <div className="flex justify-between">
                  <span>Courses Done</span>
                  <span className="text-gray-900">{coursesCompleted}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
