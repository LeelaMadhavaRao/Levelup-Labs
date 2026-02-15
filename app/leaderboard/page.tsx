'use client';

import { useEffect, useState } from 'react';
import {
  getActiveSeason,
  getLeaderboard,
  getLeaderboardAroundMe,
  getTopMovers,
  type LeaderboardScope,
} from '@/lib/leaderboard';
import { generateHunterAvatarUrl, getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpRight, Medal, Trophy, TrendingUp, Users } from 'lucide-react';

export default function LeaderboardPage() {
  const [scope, setScope] = useState<LeaderboardScope>('all_time');
  const [user, setUser] = useState<any>(null);
  const [season, setSeason] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [aroundMe, setAroundMe] = useState<any[]>([]);
  const [movers, setMovers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [scope]);

  const loadData = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      const activeSeason =
        typeof getActiveSeason === 'function'
          ? await getActiveSeason().catch(() => null)
          : null;
      setSeason(activeSeason);

      const leaders = await getLeaderboard(50, scope, activeSeason?.season_id);
      setLeaderboard(leaders);

      if (currentUser) {
        const aroundMePromise =
          typeof getLeaderboardAroundMe === 'function'
            ? getLeaderboardAroundMe(currentUser.id, scope, 4, activeSeason?.season_id).catch(() => [])
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

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-slate-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-700" />;
      default:
        return null;
    }
  };

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-300 border border-yellow-500/40';
      case 2:
        return 'bg-slate-500/20 text-slate-600 dark:text-slate-200 border border-slate-400/40';
      case 3:
        return 'bg-amber-600/20 text-amber-700 dark:text-amber-200 border border-amber-500/40';
      default:
        return 'bg-muted border border-border';
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-10 w-72 bg-muted rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const meInBoard = user ? leaderboard.find((u) => u.id === user.id) : null;

  return (
    <div className="container relative py-8 max-w-6xl space-y-8">
      <div className="scanlines pointer-events-none absolute inset-0 z-0 opacity-6"></div>
      <div className="space-y-4">
        <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3 mb-4 reveal-in">
            <Trophy className="h-10 w-10 text-yellow-500 animate-pulse" />
            <h1 className="text-4xl font-bold tracking-tight rankup-title">Hunter Ranking Leaderboard</h1>
          </div>
          <p className="text-lg text-muted-foreground reveal-in">Compete, climb hunter tiers, and hold your streak on Levelup-Labs.</p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Tabs value={scope} onValueChange={(value) => setScope(value as LeaderboardScope)}>
            <TabsList>
              <TabsTrigger value="all_time">All-time</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
            </TabsList>
          </Tabs>
          {scope === 'seasonal' && season && (
            <p className="text-xs text-muted-foreground">
              {season.name}: {season.starts_at} to {season.ends_at}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="card-interactive lg:col-span-2">
          <CardHeader>
            <CardTitle>Hunters Around You</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!user ? (
              <p className="text-sm text-muted-foreground">Sign in to track nearby hunters.</p>
            ) : aroundMe.length === 0 ? (
              <p className="text-sm text-muted-foreground">No nearby rank data for this scope yet.</p>
            ) : (
              aroundMe.map((entry) => (
                <div
                  key={`${entry.id}-${entry.rank}`}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    entry.is_me ? 'border-primary/40 bg-primary/5' : 'border-border/70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shrink-0 ${getRankBadgeClass(
                        entry.rank,
                      )}`}
                    >
                      #{entry.rank}
                    </div>
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={entry.avatar_url || generateHunterAvatarUrl(`${entry.id}-${entry.full_name}`)} alt={entry.full_name} />
                      <AvatarFallback>{getInitials(entry.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {entry.full_name} {entry.is_me && <span className="text-xs text-primary">(You)</span>}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">{entry.total_points} XP</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Top Movers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {movers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No movement data yet.</p>
            ) : (
              movers.map((mover) => (
                <div key={mover.user_id} className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{mover.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      #{mover.previous_rank} to #{mover.current_rank}
                    </p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-500">
                    <ArrowUpRight className="mr-1 h-3 w-3" />+{mover.rank_change}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <Card className="border-yellow-500/50 bg-yellow-500/5 sm:order-2 sm:scale-105 reveal-in rankup-frame">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="flex justify-center">
                <Trophy className="h-16 w-16 text-yellow-500 animate-pulse" />
              </div>
              <div className="rankup-orb inline-block rounded-full">
                <Avatar className="h-20 w-20 mx-auto border-4 border-yellow-500">
                  <AvatarImage src={leaderboard[0].avatar_url || generateHunterAvatarUrl(`${leaderboard[0].id}-${leaderboard[0].full_name}`)} alt={leaderboard[0].full_name} />
                  <AvatarFallback>{getInitials(leaderboard[0].full_name)}</AvatarFallback>
                </Avatar>
              </div>
              <div>
                <Badge className="mb-2 bg-yellow-500 text-black">Champion</Badge>
                <p className="font-bold text-lg hunter-glow-text">{leaderboard[0].full_name}</p>
                <p className="text-3xl font-bold">{leaderboard[0].total_points}</p>
                <p className="text-sm text-muted-foreground">XP</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-400/50 bg-gray-400/5 sm:order-1">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="flex justify-center">
                <Medal className="h-12 w-12 text-gray-400" />
              </div>
              <Avatar className="h-16 w-16 mx-auto border-2 border-gray-400">
                <AvatarImage src={leaderboard[1].avatar_url || generateHunterAvatarUrl(`${leaderboard[1].id}-${leaderboard[1].full_name}`)} alt={leaderboard[1].full_name} />
                <AvatarFallback>{getInitials(leaderboard[1].full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{leaderboard[1].full_name}</p>
                <p className="text-2xl font-bold">{leaderboard[1].total_points}</p>
                <p className="text-sm text-muted-foreground">XP</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-700/50 bg-amber-700/5 sm:order-3">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="flex justify-center">
                <Medal className="h-12 w-12 text-amber-700" />
              </div>
              <Avatar className="h-16 w-16 mx-auto border-2 border-amber-700">
                <AvatarImage src={leaderboard[2].avatar_url || generateHunterAvatarUrl(`${leaderboard[2].id}-${leaderboard[2].full_name}`)} alt={leaderboard[2].full_name} />
                <AvatarFallback>{getInitials(leaderboard[2].full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{leaderboard[2].full_name}</p>
                <p className="text-2xl font-bold">{leaderboard[2].total_points}</p>
                <p className="text-sm text-muted-foreground">XP</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {user && meInBoard && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-primary">
                  <AvatarImage src={user.avatar_url || generateHunterAvatarUrl(`${user.id}-${user.full_name}`)} alt={user.full_name} />
                  <AvatarFallback>{getInitials(user.full_name || 'You')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">Your Current Standing</p>
                  <p className="text-sm text-muted-foreground">{user.full_name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">#{meInBoard.rank}</p>
                <p className="text-sm text-muted-foreground">{meInBoard.total_points} XP</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Full Hunter Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map((leader) => {
              const isCurrentUser = leader.id === user?.id;
              return (
                <div
                  key={`${leader.id}-${leader.rank}`}
                  className={`flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg transition-colors ${
                    isCurrentUser ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div
                      className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full font-bold text-sm sm:text-lg shrink-0 ${getRankBadgeClass(
                        leader.rank,
                      )}`}
                    >
                      {getRankIcon(leader.rank) || `#${leader.rank}`}
                    </div>

                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                      <AvatarImage src={leader.avatar_url || generateHunterAvatarUrl(`${leader.id}-${leader.full_name}`)} alt={leader.full_name} />
                      <AvatarFallback>{getInitials(leader.full_name)}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <div className="font-semibold flex items-center gap-2 mb-0.5 sm:mb-1">
                        <span className="truncate">{leader.full_name}</span>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            You
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {leader.courses_completed} gates and {leader.problems_solved} boss fights
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                      <span className="text-lg sm:text-xl font-bold">{leader.total_points}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
