'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import {
  getLeaderboard,
  getLeaderboardAroundMe,
  getTopMovers,
} from '@/lib/leaderboard';
import { generateHunterAvatarUrl, getCurrentUser } from '@/lib/auth';
import { Orbitron, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { ArrowRight, ArrowUp, Code2, Crosshair, Search, Trophy } from 'lucide-react';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'] });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'] });

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

  if (loading) {
    return (
      <div className={`${spaceGrotesk.className} container py-8`}>
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
  const podium = leaderboard.slice(0, 3);
  const boardRows = leaderboard.length > 3 ? leaderboard.slice(3) : leaderboard;

  const filteredRows = boardRows.filter((entry) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      entry.full_name?.toLowerCase().includes(q) ||
      String(entry.rank).includes(q) ||
      entry.title?.toLowerCase().includes(q)
    );
  });

  const aroundIndex = aroundMe.findIndex((entry) => entry.is_me || entry.id === user?.id);
  const aboveEntry = aroundIndex > 0 ? aroundMe[aroundIndex - 1] : null;
  const meEntry = aroundIndex >= 0 ? aroundMe[aroundIndex] : meInBoard;
  const belowEntry = aroundIndex >= 0 && aroundIndex < aroundMe.length - 1 ? aroundMe[aroundIndex + 1] : null;

  const getTier = (rank?: number) => {
    if (!rank) return 'Unranked';
    if (rank <= 10) return 'S-Rank';
    if (rank <= 50) return 'A-Rank';
    if (rank <= 100) return 'B-Rank';
    return 'C-Rank';
  };

  const getDisplayName = (profile: any) => {
    if (!profile) return 'Hunter';
    return profile.full_name || profile.email?.split('@')[0] || 'Hunter';
  };

  const getAvatarSource = (id: string, name: string, avatarUrl?: string) => {
    return avatarUrl || generateHunterAvatarUrl(`${id}-${name}`);
  };

  const handleAvatarError = (event: SyntheticEvent<HTMLImageElement>, id: string, name: string) => {
    const fallback = generateHunterAvatarUrl(`${id}-${name}`);
    if (event.currentTarget.src !== fallback) {
      event.currentTarget.src = fallback;
    }
  };

  const displayName = getDisplayName(user);
  const profileAvatar = getAvatarSource(user?.id || 'guest', displayName, user?.avatar_url);

  const renderPodiumCard = (
    hunter: any,
    rankLabel: string,
    glowClass: string,
    rankTextClass: string,
    borderClass: string,
    heightClass: string,
    titleBadge: string,
    titleBadgeClass: string,
    frameClass: string,
    highlightClass: string
  ) => {
    if (!hunter) return null;

    return (
      <div className="relative w-1/3 max-w-[240px] group cursor-pointer">
        <div className="absolute -top-12 left-1/2 z-20 flex -translate-x-1/2 transform flex-col items-center">
          <span className={`${rankTextClass} text-lg font-bold mb-1`}>{rankLabel}</span>
          <div className={`w-20 h-20 rounded-full border-2 p-1 bg-background-dark relative ${glowClass} ${frameClass}`}>
            <img
              src={getAvatarSource(hunter.id, hunter.full_name || 'hunter', hunter.avatar_url)}
              alt={hunter.full_name}
              className="w-full h-full rounded-full object-cover"
              onError={(event) => handleAvatarError(event, hunter.id, hunter.full_name || 'hunter')}
            />
            <div className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold ${titleBadgeClass}`}>
              {titleBadge}
            </div>
          </div>
        </div>
        <div className={`${heightClass} bg-gradient-to-b from-gray-800/85 to-background-dark rounded-t-xl backdrop-blur-sm flex flex-col justify-end pb-4 items-center shadow-lg relative overflow-hidden border-t-2 ${borderClass}`}>
          <div className={`absolute inset-0 ${highlightClass}`}></div>
          <h3 className={`${orbitron.className} text-white font-bold text-lg z-10 text-glow text-center px-2`}>{hunter.full_name}</h3>
          <p className={`${jetBrainsMono.className} ${rankTextClass} text-sm z-10 font-bold`}>{hunter.total_points.toLocaleString()} XP</p>
          <p className="text-gray-500 text-xs mt-1 z-10 uppercase tracking-wide">{hunter.title || 'Elite Hunter'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className={`${spaceGrotesk.className} relative min-h-screen overflow-hidden text-gray-100`}>
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(#a60df2 1px, transparent 1px), linear-gradient(90deg, #a60df2 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />
      <div className="scanlines pointer-events-none absolute inset-0 z-0 opacity-10" />

      <header className="relative z-10 w-full border-b border-white/5 bg-background-dark/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <Code2 className="h-8 w-8 text-primary" />
            <span className={`${orbitron.className} text-lg font-bold uppercase tracking-wider text-white`}>
              CodeQuest <span className="text-primary">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-none sm:block">
              <span className={`${jetBrainsMono.className} text-xs font-bold text-primary`}>
                LVL {Math.max(1, Math.floor((meInBoard?.total_points || 0) / 1000) + 1)}
              </span>
              <div className="text-sm font-bold text-white">{displayName}</div>
            </div>
            <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary bg-gray-800">
              <img
                src={profileAvatar}
                alt={`${displayName} avatar`}
                className="h-full w-full object-cover"
                onError={(event) => handleAvatarError(event, user?.id || 'guest', displayName)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col">
          <section className="flex-none pb-4 pt-2">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h1 className={`${orbitron.className} text-3xl font-black text-glow md:text-4xl`}>Hunter Ranking Leaderboard</h1>
              <span className={`${jetBrainsMono.className} rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-widest text-primary`}>
                Global Scope
              </span>
            </div>

            <div className="flex h-64 w-full items-end justify-center gap-4 sm:h-80 sm:gap-8 lg:gap-12">
              {renderPodiumCard(
                podium[1],
                'RANK 2',
                'breathing-blue border-rank-blue',
                'text-rank-blue',
                'border-rank-blue',
                'h-48',
                'S-Rank',
                'bg-rank-blue text-black',
                'border-rank-blue',
                'bg-rank-blue/5'
              )}
              <div className="relative z-10 w-1/3 max-w-[260px] cursor-pointer">
                {podium[0] && (
                  <>
                    <div className="absolute -top-16 left-1/2 z-20 flex -translate-x-1/2 transform flex-col items-center">
                      <span className="mb-1 flex items-center gap-1 text-xl font-bold text-primary">
                        <Trophy className="h-4 w-4" /> RANK 1
                      </span>
                      <div className="relative h-24 w-24 rounded-full border-4 border-primary bg-background-dark p-1 breathing-purple">
                        <img
                          src={getAvatarSource(podium[0].id, podium[0].full_name || 'hunter', podium[0].avatar_url)}
                          alt={podium[0].full_name}
                          className="h-full w-full rounded-full object-cover"
                          onError={(event) => handleAvatarError(event, podium[0].id, podium[0].full_name || 'hunter')}
                        />
                        <div className="absolute -bottom-2 -right-2 rounded-full border border-black bg-primary px-2 py-0.5 text-xs font-bold text-white">
                          Monarch
                        </div>
                      </div>
                    </div>
                    <div className="relative flex h-60 flex-col items-center justify-end overflow-hidden rounded-t-xl border-t-4 border-primary bg-gradient-to-b from-gray-800/90 to-background-dark pb-6 shadow-2xl backdrop-blur-md">
                      <div className="absolute inset-0 bg-primary/10 animate-pulse" />
                      <h3 className={`${orbitron.className} z-10 px-2 text-center text-xl font-bold text-white text-glow`}>{podium[0].full_name}</h3>
                      <p className={`${jetBrainsMono.className} z-10 text-base font-bold text-primary`}>{podium[0].total_points.toLocaleString()} XP</p>
                      <p className="z-10 mt-1 text-xs uppercase tracking-widest text-gray-400">{podium[0].title || 'Shadow Monarch'}</p>
                    </div>
                  </>
                )}
              </div>
              {renderPodiumCard(
                podium[2],
                'RANK 3',
                'breathing-gold border-rank-gold',
                'text-rank-gold',
                'border-rank-gold',
                'h-40',
                'Nation',
                'bg-rank-gold text-black',
                'border-rank-gold',
                'bg-rank-gold/5'
              )}
            </div>
          </section>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-terminal-black/50 shadow-2xl backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 border-b border-white/10 bg-background-dark/50 p-4 sm:flex-row">
              <div className="relative group w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-primary transition-colors group-focus-within:text-white" />
                </div>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className={`${jetBrainsMono.className} block w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pl-10 pr-3 text-gray-300 placeholder-gray-500 leading-5 transition-all focus:border-primary/50 focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm`}
                  placeholder="SCAN HUNTER ID OR NAME..."
                  type="text"
                />
                <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-primary transition-all duration-500 ease-out group-focus-within:w-full" />
              </div>
            </div>

            <div className={`grid grid-cols-12 gap-4 border-b border-white/5 bg-white/5 px-6 py-3 text-xs uppercase tracking-widest text-gray-400 font-bold ${jetBrainsMono.className}`}>
              <div className="col-span-2 sm:col-span-1">Rank</div>
              <div className="col-span-6 sm:col-span-5">Hunter Identity</div>
              <div className="hidden sm:block sm:col-span-3">Title / Class</div>
              <div className="col-span-4 text-right sm:col-span-3">Total XP</div>
            </div>

            <div className="relative flex-1 space-y-1 overflow-y-auto p-2 terminal-scroll">
              <div className="scan-line opacity-10" />
              {filteredRows.map((entry) => {
                const isCurrentUser = entry.id === user?.id;
                return (
                  <div
                    key={entry.id}
                    className={`group grid grid-cols-12 items-center gap-4 rounded px-4 py-3 transition-colors border-l-2 ${isCurrentUser ? 'border-primary/70 bg-primary/10 shadow-[0_0_20px_rgba(166,13,242,0.25)]' : 'border-transparent hover:bg-white/5 hover:border-primary/50'}`}
                  >
                    <div className={`${jetBrainsMono.className} col-span-2 text-gray-400 group-hover:text-white sm:col-span-1`}>#{entry.rank.toString().padStart(2, '0')}</div>
                    <div className="col-span-6 flex items-center gap-3 sm:col-span-5">
                      <div className="relative hidden h-8 w-8 overflow-hidden rounded bg-gray-700 sm:block">
                        <img
                          src={getAvatarSource(entry.id, entry.full_name || 'hunter', entry.avatar_url)}
                          alt={entry.full_name}
                          className="h-full w-full object-cover opacity-80 group-hover:opacity-100"
                          onError={(event) => handleAvatarError(event, entry.id, entry.full_name || 'hunter')}
                        />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className={`truncate font-bold transition-colors ${isCurrentUser ? 'text-primary' : 'text-gray-200 group-hover:text-primary'}`}>
                          {entry.full_name}
                          {isCurrentUser && <span className="ml-2 text-[10px] uppercase tracking-widest">You</span>}
                        </span>
                        <span className={`${jetBrainsMono.className} text-[10px] uppercase text-gray-500 sm:hidden`}>{entry.title || 'Hunter'}</span>
                      </div>
                    </div>
                    <div className={`${jetBrainsMono.className} hidden text-xs text-gray-400 sm:col-span-3 sm:block`}>{entry.title || 'Unclassified'}</div>
                    <div className={`${jetBrainsMono.className} col-span-4 text-right font-bold text-primary sm:col-span-3`}>
                      {entry.total_points.toLocaleString()}
                    </div>
                  </div>
                );
              })}
              {filteredRows.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-gray-500">No hunters detected for this query.</div>
              )}
            </div>
          </div>
        </div>

        <aside className="w-full flex-none lg:w-80 flex flex-col gap-6">
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-terminal-black p-6">
            <div className="absolute right-0 top-0 p-2 opacity-20">
              <Crosshair className="h-16 w-16 text-primary" />
            </div>
            <h2 className={`${jetBrainsMono.className} mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400`}>
              <span className="h-2 w-2 rounded-full bg-primary animate-ping"></span>
              Proximity Alert
            </h2>

            {!user ? (
              <p className="text-sm text-gray-500">Sign in to see hunters near your rank.</p>
            ) : !meEntry ? (
              <p className="text-sm text-gray-500">No nearby hunters within this scope.</p>
            ) : (
              <div className="relative flex flex-col gap-4">
                <div className="absolute bottom-4 left-[1.65rem] top-4 w-0.5 bg-gradient-to-b from-transparent via-primary/50 to-transparent"></div>

                {aboveEntry && (
                  <div className="relative z-10 flex items-center gap-4 opacity-60">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-600 bg-gray-800 text-sm font-bold text-gray-400">
                      #{String(aboveEntry.rank).padStart(2, '0')}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-sm font-bold text-gray-300">{aboveEntry.full_name}</span>
                      <span className={`${jetBrainsMono.className} text-xs text-gray-500`}>XP: {aboveEntry.total_points.toLocaleString()}</span>
                    </div>
                    <div className={`${jetBrainsMono.className} ml-auto text-xs text-red-400`}>
                      +{Math.max(0, aboveEntry.total_points - meEntry.total_points).toLocaleString()} XP
                    </div>
                  </div>
                )}

                <div className="relative z-10 -mx-3 flex items-center gap-4 rounded-lg border border-primary/30 bg-primary/10 p-3 shadow-[0_0_15px_rgba(166,13,242,0.45)]">
                  <div className="h-14 w-14 rounded-full border-2 border-primary bg-gray-800 p-0.5">
                    <img
                      src={getAvatarSource(meEntry.id, meEntry.full_name || 'hunter', meEntry.avatar_url)}
                      alt={meEntry.full_name}
                      className="h-full w-full rounded-full object-cover"
                      onError={(event) => handleAvatarError(event, meEntry.id, meEntry.full_name || 'hunter')}
                    />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-bold text-white">You</span>
                    <span className={`${jetBrainsMono.className} text-xs font-bold text-primary`}>
                      XP: {meEntry.total_points.toLocaleString()}
                    </span>
                  </div>
                  <div className="ml-auto">
                    <ArrowUp className="h-4 w-4 text-primary animate-bounce" />
                  </div>
                </div>

                {belowEntry && (
                  <div className="relative z-10 flex items-center gap-4 opacity-60">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-600 bg-gray-800 text-sm font-bold text-gray-400">
                      #{String(belowEntry.rank).padStart(2, '0')}
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-bold text-gray-300">{belowEntry.full_name}</span>
                      <span className={`${jetBrainsMono.className} text-xs text-gray-500`}>XP: {belowEntry.total_points.toLocaleString()}</span>
                    </div>
                    <div className={`${jetBrainsMono.className} ml-auto text-xs text-green-400`}>
                      -{Math.max(0, meEntry.total_points - belowEntry.total_points).toLocaleString()} XP
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-white/5 bg-background-dark p-6">
            <h2 className={`${jetBrainsMono.className} mb-2 text-sm font-bold uppercase tracking-widest text-gray-400`}>My Hunter Stats</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3">
                <div className="flex flex-col">
                  <span className="text-xs uppercase text-gray-500">Monsters Slayed</span>
                  <span className={`${jetBrainsMono.className} text-xl font-bold text-primary`}>{meInBoard?.problems_solved ?? 0}</span>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-gray-500">Problems Solved</span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3">
                <div className="flex flex-col">
                  <span className="text-xs uppercase text-gray-500">Dungeons Cleared</span>
                  <span className={`${jetBrainsMono.className} text-xl font-bold text-rank-blue`}>{meInBoard?.courses_completed ?? 0}</span>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-gray-500">Courses Completed</span>
              </div>

              <div className="mt-2 flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3">
                <div className="flex flex-col">
                  <span className="text-xs uppercase text-gray-500">Current Tier</span>
                  <span className="text-xl font-bold text-white">{getTier(meInBoard?.rank)}</span>
                </div>
                <div className={`${orbitron.className} text-3xl font-black text-gray-600`}>
                  {getTier(meInBoard?.rank).charAt(0)}
                </div>
              </div>
            </div>

            <Link
              href="/my-courses"
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-purple-400/40 bg-[#7b1dd8] py-3 font-bold text-white shadow-[0_0_15px_rgba(166,13,242,0.45)] transition-colors hover:bg-[#9228f4] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60"
            >
              <span>MY DUNGEONS</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            {movers.length > 0 && (
              <div className="rounded-lg border border-white/5 bg-white/5 p-3">
                <div className={`${jetBrainsMono.className} mb-2 text-[10px] uppercase tracking-widest text-gray-500`}>Top Movers</div>
                <div className="space-y-1.5">
                  {movers.slice(0, 3).map((mover) => (
                    <div key={mover.user_id} className="flex items-center justify-between text-xs">
                      <span className="truncate text-gray-300">{mover.full_name}</span>
                      <span className={`${jetBrainsMono.className} text-green-400`}>#{mover.previous_rank} → #{mover.current_rank}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          
        </aside>
      </main>
    </div>
  );
}
