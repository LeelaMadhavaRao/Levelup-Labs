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
import { Orbitron } from 'next/font/google';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500','700','900'] });

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
      <div className="scanlines pointer-events-none absolute inset-0 z-0 opacity-8" />
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-10 w-10 text-yellow-500" />
            <h1 className={`${orbitron.className} hunter-glow-text text-4xl md:text-5xl font-extrabold`}>Hunter Ranking Leaderboard</h1>
          </div>
          <p className="text-sm text-muted-foreground">Compete, climb hunter tiers, and hold your streak on Levelup‑Labs.</p>
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
            <p className="text-xs text-muted-foreground">{season.name}: {season.starts_at} to {season.ends_at}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="mb-6">
            {leaderboard.length >= 3 && (
              <div className="flex items-end justify-center gap-8 lg:gap-12">
                {/* rank 2 */}
                <div className="relative w-[220px] text-center">
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-20">
                    <span className="text-rank-blue font-bold text-lg mb-1">RANK 2</span>
                    <div className="w-16 h-16 rounded-full border-2 border-rank-blue p-1 bg-background-dark overflow-hidden">
                      <img src={leaderboard[1].avatar_url || generateHunterAvatarUrl(`${leaderboard[1].id}-${leaderboard[1].full_name}`)} alt={leaderboard[1].full_name} className="w-full h-full rounded-full object-cover" />
                    </div>
                  </div>
                  <div className="h-44 bg-gradient-to-b from-gray-800/80 to-background-dark border-t-2 border-rank-blue rounded-t-xl flex flex-col justify-end pb-4 items-center shadow-lg relative overflow-hidden">
                    <h3 className={`${orbitron.className} text-white font-bold text-lg z-10`}>{leaderboard[1].full_name}</h3>
                    <p className="text-rank-blue text-sm font-mono z-10">{leaderboard[1].total_points.toLocaleString()} XP</p>
                  </div>
                </div>

                {/* rank 1 */}
                <div className="relative w-[300px] text-center z-10">
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-20">
                    <span className="text-primary font-bold text-xl mb-1">RANK 1</span>
                    <div className="w-28 h-28 rounded-full border-4 border-primary p-1 bg-background-dark overflow-hidden ring-4 ring-primary/10 shadow-2xl breathing-purple">
                      <img src={leaderboard[0].avatar_url || generateHunterAvatarUrl(`${leaderboard[0].id}-${leaderboard[0].full_name}`)} alt={leaderboard[0].full_name} className="w-full h-full rounded-full object-cover" />
                    </div>
                  </div>
                  <div className="h-56 bg-gradient-to-b from-gray-900/90 to-background-dark border-t-4 border-primary rounded-t-xl flex flex-col justify-end pb-6 items-center shadow-2xl relative overflow-hidden">
                    <h3 className={`${orbitron.className} hunter-glow-text text-2xl font-black z-10`}>{leaderboard[0].full_name}</h3>
                    <p className="text-primary text-xl font-mono z-10 font-bold">{leaderboard[0].total_points.toLocaleString()} XP</p>
                  </div>
                </div>

                {/* rank 3 */}
                <div className="relative w-[220px] text-center">
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-20">
                    <span className="text-rank-gold font-bold text-lg mb-1">RANK 3</span>
                    <div className="w-16 h-16 rounded-full border-2 border-rank-gold p-1 bg-background-dark overflow-hidden">
                      <img src={leaderboard[2].avatar_url || generateHunterAvatarUrl(`${leaderboard[2].id}-${leaderboard[2].full_name}`)} alt={leaderboard[2].full_name} className="w-full h-full rounded-full object-cover" />
                    </div>
                  </div>
                  <div className="h-36 bg-gradient-to-b from-gray-800/80 to-background-dark border-t-2 border-rank-gold rounded-t-xl flex flex-col justify-end pb-4 items-center shadow-lg relative overflow-hidden">
                    <h3 className={`${orbitron.className} text-white font-bold text-lg z-10`}>{leaderboard[2].full_name}</h3>
                    <p className="text-rank-gold text-sm font-mono z-10">{leaderboard[2].total_points.toLocaleString()} XP</p>
                  </div>
                </div>
              </div>
            )}
          </section>
          <div className="rounded-xl border border-white/10 bg-terminal-black/50 p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:max-w-md group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary">
                <span className="material-icons-round">qr_code_scanner</span>
              </div>
              <input className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-lg bg-black/40 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-black/60 focus:border-primary/50 focus:ring-1 focus:ring-primary sm:text-sm font-mono transition-all" placeholder="SCAN HUNTER ID OR NAME..." type="text" />
              <div className="absolute bottom-0 left-0 h-[1px] bg-primary w-0 group-focus-within:w-full transition-all duration-500 ease-out" />
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg bg-primary/20 text-primary border border-primary/30 text-xs font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition-all">Global</button>
              <button className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 border border-white/5 text-xs font-bold uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all">Friends</button>
              <button className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 border border-white/5 text-xs font-bold uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all">Guild</button>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-terminal-black overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-white/3 border-b border-white/5 backdrop-blur-sm text-xs font-mono uppercase tracking-widest text-gray-400 font-bold">
              <div className="col-span-2 sm:col-span-1">Rank</div>
              <div className="col-span-6 sm:col-span-5">Hunter Identity</div>
              <div className="hidden sm:block sm:col-span-3">Title / Class</div>
              <div className="col-span-4 sm:col-span-3 text-right">Total XP</div>
            </div>
            <div className="divide-y divide-white/5">
              {leaderboard.map((leader) => {
                const isCurrentUser = leader.id === user?.id;
                return (
                  <div key={leader.id} className={`grid grid-cols-12 gap-4 px-4 py-4 items-center transition-colors ${isCurrentUser ? 'bg-gradient-to-r from-primary/6 to-transparent border-l-4 border-primary/50 ring-1 ring-primary/10' : 'hover:bg-white/5'} `}>
                    <div className="col-span-2 sm:col-span-1 font-mono text-gray-400">#{leader.rank}</div>
                    <div className="col-span-6 sm:col-span-5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gray-700 relative overflow-hidden hidden sm:block">
                        <img src={leader.avatar_url || generateHunterAvatarUrl(`${leader.id}-${leader.full_name}`)} alt={leader.full_name} className="w-full h-full object-cover opacity-80" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`font-bold truncate ${isCurrentUser ? 'text-primary' : 'text-gray-200'}`}>{leader.full_name}</span>
                        <span className="text-[10px] text-gray-500 font-mono uppercase sm:hidden">{leader.title || ''}</span>
                      </div>
                    </div>
                    <div className="hidden sm:block sm:col-span-3 font-mono text-xs text-gray-400">{leader.title || ''}</div>
                    <div className="col-span-4 sm:col-span-3 text-right font-mono text-primary font-bold">{leader.total_points.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-6 sticky top-24">
          <Card className="bg-[#07070a]/60 border border-amber-700/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-400" />
                Proximity Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!user ? (
                <p className="text-sm text-muted-foreground">Sign in to see hunters near your rank.</p>
              ) : aroundMe.length === 0 ? (
                <p className="text-sm text-muted-foreground">No nearby hunters within this scope.</p>
              ) : (
                <div className="space-y-3">
                  {aroundMe.map((entry) => (
                    <div key={`${entry.id}-${entry.rank}`} className={`flex items-center justify-between rounded-lg border p-3 ${entry.is_me ? 'border-primary/40 bg-primary/5' : 'border-border/70'}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shrink-0 ${getRankBadgeClass(entry.rank)}`}>
                          #{entry.rank}
                        </div>
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={entry.avatar_url || generateHunterAvatarUrl(`${entry.id}-${entry.full_name}`)} alt={entry.full_name} />
                          <AvatarFallback>{getInitials(entry.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{entry.full_name} {entry.is_me && <span className="text-xs text-primary">(You)</span>}</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold">{entry.total_points} XP</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#07070a]/50 border border-white/6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                Top Movers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {movers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No movements recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {movers.map((m) => (
                    <div key={m.user_id} className="flex items-center justify-between gap-3 p-2 rounded-md border border-border/60">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={m.avatar_url} alt={m.full_name} />
                          <AvatarFallback>{getInitials(m.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{m.full_name}</div>
                          <div className="text-xs text-muted-foreground">#{m.previous_rank} → #{m.current_rank}</div>
                        </div>
                      </div>
                      <Badge className="bg-green-500/10 text-green-400">+{m.rank_change}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {user && (
            <Card className="border-primary/30 bg-[#071026]/30">
              <CardHeader>
                <CardTitle>My Hunter Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarImage src={user.avatar_url || generateHunterAvatarUrl(`${user.id}-${user.full_name}`)} alt={user.full_name} />
                    <AvatarFallback>{getInitials(user.full_name || 'You')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold truncate">{user.full_name}</div>
                      <Badge className="text-xs">You</Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">Rank</div>
                      <div className="font-bold">#{meInBoard?.rank ?? '—'}</div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">XP</div>
                      <div className="font-bold">{meInBoard?.total_points ?? 0}</div>
                    </div>
                    <div className="mt-3">
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(100, meInBoard ? Math.round((meInBoard.total_points % 1000) / 10) : 0)}%` }} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Progress to next title</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
