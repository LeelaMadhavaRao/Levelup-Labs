'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Orbitron, Rajdhani } from 'next/font/google';
import { getCurrentUser } from '@/lib/auth';
import { getAllProblems } from '@/lib/problems';
import { getStreakMultiplier } from '@/lib/gamification';
import { getHunterRankByPoints } from '@/lib/hunter-rank';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  Circle,
  Code2,
  Cpu,
  Flame,
  PlusCircle,
  Rocket,
  SearchCode,
  ShieldCheck,
  Sparkles,
  Swords,
  Zap,
} from 'lucide-react';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'] });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

export default function PracticePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<DifficultyFilter>('all');
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [streakMultiplier, setStreakMultiplier] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    setUser(currentUser);

    try {
      const [allProblems, multiplier] = await Promise.all([
        getAllProblems({ userId: currentUser.id }),
        getStreakMultiplier(currentUser.id).catch(() => 1),
      ]);
      setProblems(allProblems);
      setStreakMultiplier(multiplier);
      setSelectedProblemId(allProblems[0]?.id || null);
    } catch (error) {
      console.error('Error loading practice missions:', error);
      setProblems([]);
    }

    setLoading(false);
  };

  const getPoints = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 100;
      case 'medium':
        return 200;
      case 'hard':
        return 300;
      default:
        return 0;
    }
  };

  const getProblemStatus = (problem: any) => {
    const status = problem.user_status;
    if (!status) return 'unsolved';
    if (status === 'completed') return 'completed';
    return 'attempted';
  };

  const filteredProblems = useMemo(() => {
    if (activeFilter === 'all') return problems;
    return problems.filter((problem) => problem.difficulty === activeFilter);
  }, [activeFilter, problems]);

  const selectedProblem = filteredProblems.find((problem) => problem.id === selectedProblemId) || filteredProblems[0] || null;

  const stats = useMemo(() => ({
    total: problems.length,
    solved: problems.filter((problem) => getProblemStatus(problem) === 'completed').length,
    attempted: problems.filter((problem) => getProblemStatus(problem) === 'attempted').length,
    unsolved: problems.filter((problem) => getProblemStatus(problem) === 'unsolved').length,
  }), [problems]);

  const hunterRank = getHunterRankByPoints(Number(user?.total_points || 0));

  if (loading) {
    return (
      <div className="container py-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-64 rounded bg-muted" />
          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            <div className="h-[560px] rounded bg-muted" />
            <div className="h-[560px] rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${rajdhani.className} flex h-[calc(100vh-80px)] overflow-hidden bg-[#09090b] text-slate-300`}>
      <aside className="hidden w-80 flex-col border-r border-purple-500/20 bg-[#050507]/95 shadow-[5px_0_30px_rgba(0,0,0,0.5)] lg:flex">
        <div className="relative flex h-16 items-center bg-[#050507] px-6 after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-gradient-to-r after:from-transparent after:via-purple-600 after:to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-700 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider text-white">PRACTICE_CONSOLE</h1>
              <p className="font-mono text-[10px] uppercase text-purple-400/70">Shadow_Training_OS_v3.1</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <button
            onClick={() => router.push('/courses')}
            className="group relative w-full overflow-hidden rounded-lg border border-purple-500/50 bg-purple-500/5 text-purple-400 transition-all duration-300 hover:bg-purple-500/10"
          >
            <div className="absolute inset-0 w-1 bg-purple-500 opacity-10 transition-all duration-300 group-hover:w-full" />
            <div className="relative flex items-center justify-center gap-2 px-4 py-4">
              <PlusCircle className="h-5 w-5" />
              <span className="font-mono text-sm font-bold uppercase tracking-widest">View all Dungeons</span>
            </div>
          </button>
        </div>

        <div className="mb-2 flex items-center justify-between px-6 font-mono text-xs uppercase tracking-widest text-slate-500">
          <span>Active Trials</span>
          <span>Tier</span>
        </div>

        <div className="px-4 pb-4 space-y-2 overflow-y-auto flex-1">
          {filteredProblems.map((problem, index) => {
            const active = selectedProblem?.id === problem.id;
            const status = getProblemStatus(problem);
            const tier = problem.difficulty?.toUpperCase() || 'UNSET';

            return (
              <button
                key={problem.id}
                onClick={() => setSelectedProblemId(problem.id)}
                className={`w-full rounded border p-3 text-left transition-all ${
                  active
                    ? 'border-purple-500 bg-purple-500/5 shadow-[0_0_15px_rgba(168,85,247,0.28)]'
                    : 'border-white/5 bg-[#121215] hover:border-purple-500/50 hover:bg-[#121215]/80'
                }`}
              >
                <div className="mb-1 flex items-start justify-between">
                  <h3 className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-300'}`}>TRIAL: {problem.title}</h3>
                  <span className={`font-mono text-[10px] font-bold ${active ? 'text-purple-400' : 'text-slate-500'}`}>{tier}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="font-mono text-[10px] text-slate-500">ID: #TR-{String(index + 1).padStart(2, '0')}</span>
                  <span className="font-mono text-[10px] text-slate-500">{status}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="border-t border-purple-500/10 bg-[#050507]/50 p-4">
          <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-slate-400">
            <div className="flex flex-col">
              <span className="uppercase tracking-widest text-purple-400/60">Hunter Rank</span>
              <span className="text-white">{hunterRank.label}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="uppercase tracking-widest text-purple-400/60">Streak Boost</span>
              <span className="text-white">x{streakMultiplier.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col overflow-hidden bg-[#09090b]">
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#7C3AED 1px, transparent 1px), linear-gradient(90deg, #7C3AED 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#09090B_120%)]" />

        <header className="relative z-10 flex h-16 items-center justify-between border-b border-purple-500/20 bg-[#121215]/90 px-6 md:px-8 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded border border-white/5 bg-[#050507] px-3 py-1.5 font-mono text-xs text-slate-400">
              <span className="text-purple-400">root</span>
              <span className="mx-2 text-slate-600">/</span>
              <span className="text-purple-400">trial_arena</span>
              <span className="mx-2 text-slate-600">/</span>
              <span className="text-white">practice</span>
            </div>
            <span className="h-4 w-px bg-white/10" />
            <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-purple-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
              System Online
            </span>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            {(['all', 'easy', 'medium', 'hard'] as DifficultyFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setActiveFilter(filter);
                  const next = filter === 'all' ? problems : problems.filter((problem) => problem.difficulty === filter);
                  setSelectedProblemId(next[0]?.id || null);
                }}
                className={`rounded border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                  activeFilter === filter
                    ? 'border-purple-500/50 bg-purple-500/20 text-purple-300'
                    : 'border-white/10 bg-[#09090b] text-slate-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </header>

        <div className="scanlines relative z-10 flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto grid max-w-7xl grid-cols-12 gap-8">
            <div className="col-span-12 space-y-6 lg:col-span-8">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className={`${orbitron.className} mb-1 text-3xl font-bold text-white`}>Practice Gate</h2>
                  <p className="font-mono text-sm text-slate-400">Execute boss-fight coding drills and extract XP.</p>
                </div>
                
              </div>

              {!selectedProblem ? (
                <div className="rounded-lg border border-white/10 bg-[#121215] p-8 text-center">
                  <Swords className="mx-auto mb-4 h-10 w-10 text-purple-400" />
                  <h3 className="mb-2 text-2xl text-white">No Trials in this tier</h3>
                  <p className="text-slate-400">Switch filter or open a new gate.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-lg border border-white/5 bg-[#121215] p-6 shadow-lg">
                    <div className="absolute left-0 top-0 h-full w-1 bg-purple-500 shadow-[0_0_10px_#A855F7]" />
                    <div className="mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                      <Code2 className="h-4 w-4 text-purple-400" />
                      <h3 className="text-sm font-bold uppercase tracking-widest text-white">Trial Parameters</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block font-mono text-xs uppercase text-purple-400">Trial_Name</label>
                        <input readOnly value={selectedProblem.title} className="w-full rounded border border-white/10 bg-[#09090b] px-4 py-2 font-mono text-sm text-white outline-none" />
                      </div>
                      <div>
                        <label className="mb-2 block font-mono text-xs uppercase text-purple-400">Difficulty_Tier</label>
                        <input readOnly value={String(selectedProblem.difficulty || '').toUpperCase()} className="w-full rounded border border-white/10 bg-[#09090b] px-4 py-2 font-mono text-sm text-white outline-none" />
                      </div>
                      <div className="col-span-full">
                        <label className="mb-2 block font-mono text-xs uppercase text-purple-400">Mission_Description</label>
                        <textarea readOnly rows={3} value={selectedProblem.description || 'No mission description available.'} className="w-full resize-none rounded border border-white/10 bg-[#09090b] px-4 py-2 font-mono text-sm text-white outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-purple-500/25 bg-[#121215] p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-mono text-xs uppercase tracking-widest text-slate-400">Trial Actions</h4>
                      <Badge className="border border-purple-500/50 bg-purple-500/20 text-purple-300">
                        +{Math.round(getPoints(selectedProblem.difficulty) * streakMultiplier)} XP
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => router.push(`/topic/${selectedProblem.topic_id}/problems/${selectedProblem.id}/code`)}
                        className="bg-purple-700 hover:bg-purple-600"
                      >
                        <Zap className="mr-2 h-4 w-4" />
                        {getProblemStatus(selectedProblem) === 'completed' ? 'Re-enter Boss Fight' : 'Start Boss Fight'}
                      </Button>
                      <Button variant="outline" onClick={() => router.push('/leaderboard')}>
                        <ShieldCheck className="mr-2 h-4 w-4" /> View Hunter Rankings
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-12 space-y-6 lg:col-span-4">
              <div className="rounded-lg border border-white/5 bg-[#121215] p-4 shadow-lg">
                <h4 className="mb-4 font-mono text-xs uppercase tracking-widest text-slate-400">Hunter_Stats</h4>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-400"><span>Rank</span><span className="text-purple-300">{hunterRank.label}</span></div>
                    <div className="h-1.5 rounded-full bg-[#09090b]">
                      <div className="h-full rounded-full bg-purple-500 shadow-[0_0_8px_#A855F7]" style={{ width: `${(hunterRank.index + 1) * 20}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-400"><span>Solved</span><span className="text-green-400">{stats.solved}</span></div>
                    <div className="h-1.5 rounded-full bg-[#09090b]">
                      <div className="h-full rounded-full bg-green-500" style={{ width: `${stats.total ? (stats.solved / stats.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-400"><span>Attempted</span><span className="text-amber-400">{stats.attempted}</span></div>
                    <div className="h-1.5 rounded-full bg-[#09090b]">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: `${stats.total ? (stats.attempted / stats.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

             

              

              <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4 text-xs text-slate-300">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                  <Sparkles className="h-4 w-4 text-purple-400" /> Solo Progress Snapshot
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between"><span className="text-slate-500">Hunter</span><span>{user?.full_name || 'Unknown'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Current Rank</span><span>{hunterRank.label}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Total XP</span><span>{Number(user?.total_points || 0)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Streak Boost</span><span>x{streakMultiplier.toFixed(2)}</span></div>
                </div>
              </div>
            </div>
          </div>

          <footer className="mb-4 mt-12 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600">Shadow Training Console // Authorized Hunters Only</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
