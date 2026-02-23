'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import {
  getLeaderboard,
  getLeaderboardAroundMe,
  getTopMovers,
} from '@/lib/leaderboard';
import { generateHunterAvatarUrl, getCurrentUser } from '@/lib/auth';
import { subscribeToLeaderboard } from '@/lib/realtime';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowUp, Crown, Medal, Search, Trophy, TrendingUp } from 'lucide-react';

export default function LeaderboardPage() {
  const [search, setSearch] = useState('');
  const [user, setUser] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [aroundMe, setAroundMe] = useState<any[]>([]);
  const [movers, setMovers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard(() => {
      void loadData();
    });
    return unsubscribe;
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      const leaders = await getLeaderboard(50, 'all_time');
      setLeaderboard(leaders);

      if (currentUser) {
        const aroundMePromise =
          typeof getLeaderboardAroundMe === 'function'
            ? getLeaderboardAroundMe(currentUser.id, 'all_time', 4).catch(() => [])
            : Promise.resolve([]);
        const topMoversPromise =
          typeof getTopMovers === 'function'
            ? getTopMovers(5, 7).catch(() => [])
            : Promise.resolve([]);
        const [windowRanks, topMovers] = await Promise.all([
          aroundMePromise,
          topMoversPromise,
        ]);
        setAroundMe(windowRanks);
        setMovers(topMovers);
      } else {
        setAroundMe([]);
        setMovers([]);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setLeaderboard([]);
      setAroundMe([]);
      setMovers([]);
    } finally {
      setLoading(false);
    }
  };

  const getXpValue = (entry: any) =>
    Number(entry?.total_xp ?? entry?.xp ?? entry?.total_points ?? 0);

  const getDisplayName = (profile: any) => {
    if (!profile) return 'Learner';
    return profile.full_name || profile.email?.split('@')[0] || 'Learner';
  };

  const getAvatarSource = (id: string, name: string, avatarUrl?: string) => {
    return avatarUrl || generateHunterAvatarUrl(`${id}-${name}`);
  };

  const handleAvatarError = (
    event: SyntheticEvent<HTMLImageElement>,
    id: string,
    name: string
  ) => {
    const fallback = generateHunterAvatarUrl(`${id}-${name}`);
    if (event.currentTarget.src !== fallback) {
      event.currentTarget.src = fallback;
    }
  };

  const getTier = (rank?: number) => {
    if (!rank) return 'Unranked';
    if (rank <= 10) return 'S-Rank';
    if (rank <= 50) return 'A-Rank';
    if (rank <= 100) return 'B-Rank';
    return 'C-Rank';
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded-md bg-gray-200" />
          <div className="flex justify-center gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 w-40 rounded-lg bg-gray-200" />
            ))}
          </div>
          <div className="h-96 rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  const displayName = getDisplayName(user);
  const meInBoard = user
    ? leaderboard.find((u) => u.id === user.id)
    : null;
  const podium = leaderboard.slice(0, 3);
  const boardRows = leaderboard.length > 3 ? leaderboard.slice(3) : [];

  const filteredRows = boardRows.filter((entry) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      entry.full_name?.toLowerCase().includes(q) ||
      String(entry.rank).includes(q) ||
      entry.title?.toLowerCase().includes(q)
    );
  });

  const aroundIndex = aroundMe.findIndex(
    (entry) => entry.is_me || entry.id === user?.id
  );
  const aboveEntry = aroundIndex > 0 ? aroundMe[aroundIndex - 1] : null;
  const meEntry = aroundIndex >= 0 ? aroundMe[aroundIndex] : meInBoard;
  const belowEntry =
    aroundIndex >= 0 && aroundIndex < aroundMe.length - 1
      ? aroundMe[aroundIndex + 1]
      : null;

  const myProfileEntry = meEntry || meInBoard || user;
  const myXp = getXpValue(myProfileEntry);

  const podiumOrder = [podium[1], podium[0], podium[2]];
  const podiumMeta = [
    { icon: Medal, height: 'h-28', border: 'border-slate-400', label: '#2' },
    { icon: Crown, height: 'h-36', border: 'border-amber-400', label: '#1' },
    { icon: Medal, height: 'h-24', border: 'border-amber-600', label: '#3' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Global rankings based on total XP earned
          </p>
        </div>
        <Badge className="w-fit border-purple-200 bg-purple-50 text-purple-600">
          Top 50 &middot; All Time
        </Badge>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main column */}
        <div className="flex-1 space-y-6">
          {/* Podium */}
          <Card className="border-gray-200 bg-white">
            <CardContent className="flex items-end justify-center gap-4 px-6 py-8 sm:gap-8">
              {podiumOrder.map((entry, i) =>
                entry ? (
                  <div key={entry.id} className="flex flex-col items-center">
                    <div className="relative mb-2">
                      <div
                        className={`h-16 w-16 overflow-hidden rounded-full border-2 ${podiumMeta[i].border} bg-gray-100 sm:h-20 sm:w-20`}
                      >
                        <img
                          src={getAvatarSource(
                            entry.id,
                            entry.full_name || 'learner',
                            entry.avatar_url
                          )}
                          alt={entry.full_name}
                          className="h-full w-full object-cover"
                          onError={(e) =>
                            handleAvatarError(
                              e,
                              entry.id,
                              entry.full_name || 'learner'
                            )
                          }
                        />
                      </div>
                      {i === 1 && (
                        <Crown className="absolute -top-3 left-1/2 h-5 w-5 -translate-x-1/2 text-amber-400" />
                      )}
                    </div>
                    <div
                      className={`${podiumMeta[i].height} flex w-24 flex-col items-center justify-end rounded-t-lg bg-gray-50 px-3 pb-3 sm:w-32`}
                    >
                      <span className="mb-1 text-lg font-bold text-gray-900 sm:text-xl">
                        {podiumMeta[i].label}
                      </span>
                      <p className="mb-1 max-w-full truncate text-center text-xs font-medium text-gray-900">
                        {entry.full_name}
                      </p>
                      <p className="text-xs font-semibold text-purple-600">
                        {getXpValue(entry).toLocaleString()} XP
                      </p>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="w-24 sm:w-32" />
                )
              )}
            </CardContent>
          </Card>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or rank..."
              className="border-gray-200 bg-gray-100 pl-9 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Rankings table */}
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-0">
              <div className="grid grid-cols-12 gap-4 border-b border-gray-100 px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                <div className="col-span-2 sm:col-span-1">Rank</div>
                <div className="col-span-6 sm:col-span-5">Name</div>
                <div className="hidden sm:col-span-3 sm:block">Title</div>
                <div className="col-span-4 text-right sm:col-span-3">XP</div>
              </div>

              <div className="max-h-[520px] divide-y divide-white/5 overflow-y-auto">
                {filteredRows.map((entry) => {
                  const isCurrentUser = entry.id === user?.id;
                  return (
                    <div
                      key={entry.id}
                      className={`grid grid-cols-12 items-center gap-4 px-5 py-3 transition-colors ${
                        isCurrentUser
                          ? 'bg-purple-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="col-span-2 text-sm text-gray-500 sm:col-span-1">
                        #{entry.rank}
                      </div>
                      <div className="col-span-6 flex items-center gap-3 sm:col-span-5">
                        <div className="hidden h-8 w-8 overflow-hidden rounded-full bg-gray-100 sm:block">
                          <img
                            src={getAvatarSource(
                              entry.id,
                              entry.full_name || 'learner',
                              entry.avatar_url
                            )}
                            alt={entry.full_name}
                            className="h-full w-full object-cover"
                            onError={(e) =>
                              handleAvatarError(
                                e,
                                entry.id,
                                entry.full_name || 'learner'
                              )
                            }
                          />
                        </div>
                        <div className="min-w-0">
                          <span
                            className={`truncate text-sm font-medium ${
                              isCurrentUser
                                ? 'text-purple-600'
                                : 'text-gray-900'
                            }`}
                          >
                            {entry.full_name}
                            {isCurrentUser && (
                              <span className="ml-2 text-[10px] uppercase text-gray-500">
                                You
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="hidden text-sm text-gray-400 sm:col-span-3 sm:block">
                        {entry.title || 'Learner'}
                      </div>
                      <div className="col-span-4 text-right text-sm font-semibold text-purple-600 sm:col-span-3">
                        {getXpValue(entry).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
                {filteredRows.length === 0 && (
                  <div className="px-5 py-8 text-center text-sm text-gray-400">
                    No learners found for this search.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-full space-y-6 lg:w-80">
          {/* My position */}
          {user && meEntry && (
            <Card className="border-gray-200 bg-white">
              <CardContent className="p-5">
                <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-400">
                  Your Position
                </h3>
                <div className="space-y-3">
                  {aboveEntry && (
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span className="w-8 text-right">
                        #{aboveEntry.rank}
                      </span>
                      <span className="flex-1 truncate">
                        {aboveEntry.full_name}
                      </span>
                      <span className="text-xs text-red-600">
                        +
                        {Math.max(
                          0,
                          getXpValue(aboveEntry) - getXpValue(meEntry)
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm">
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-purple-500/50">
                      <img
                        src={getAvatarSource(
                          meEntry.id,
                          meEntry.full_name || 'learner',
                          meEntry.avatar_url
                        )}
                        alt="You"
                        className="h-full w-full object-cover"
                        onError={(e) =>
                          handleAvatarError(
                            e,
                            meEntry.id,
                            meEntry.full_name || 'learner'
                          )
                        }
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">You</p>
                      <p className="text-xs font-semibold text-purple-600">
                        {getXpValue(meEntry).toLocaleString()} XP
                      </p>
                    </div>
                    <ArrowUp className="h-4 w-4 text-purple-600" />
                  </div>
                  {belowEntry && (
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span className="w-8 text-right">
                        #{belowEntry.rank}
                      </span>
                      <span className="flex-1 truncate">
                        {belowEntry.full_name}
                      </span>
                      <span className="text-xs text-green-600">
                        -
                        {Math.max(
                          0,
                          getXpValue(meEntry) - getXpValue(belowEntry)
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* My Stats */}
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-5">
              <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-400">
                My Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <span className="text-xs text-gray-500">
                    Problems Solved
                  </span>
                  <span className="text-lg font-bold text-purple-600">
                    {myProfileEntry?.problems_solved ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <span className="text-xs text-gray-500">
                    Courses Completed
                  </span>
                  <span className="text-lg font-bold text-purple-600">
                    {myProfileEntry?.courses_completed ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <span className="text-xs text-gray-500">Current Tier</span>
                  <span className="text-lg font-bold text-gray-900">
                    {getTier(myProfileEntry?.rank)}
                  </span>
                </div>
              </div>

              <Link
                href="/my-courses"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-purple-500"
              >
                My Courses <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          {/* Top Movers */}
          {movers.length > 0 && (
            <Card className="border-gray-200 bg-white">
              <CardContent className="p-5">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                  <TrendingUp className="h-3.5 w-3.5" /> Top Movers (7 days)
                </h3>
                <div className="space-y-2">
                  {movers.slice(0, 5).map((mover) => (
                    <div
                      key={mover.user_id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate text-gray-600">
                        {mover.full_name}
                      </span>
                      <span className="text-xs text-green-600">
                        #{mover.previous_rank} &rarr; #{mover.current_rank}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
