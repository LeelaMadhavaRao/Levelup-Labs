'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAllProblems } from '@/lib/problems';
import { getStreakMultiplier } from '@/lib/gamification';
import { getHunterRankByXp } from '@/lib/hunter-rank';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  Circle,
  Code,
  Flame,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

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
      console.error('Error loading practice tasks:', error);
      setProblems([]);
    }
    setLoading(false);
  };

  const getXpReward = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 100;
      case 'medium': return 200;
      case 'hard': return 300;
      default: return 0;
    }
  };

  const getProblemStatus = (problem: any) => {
    const status = problem.user_status;
    if (!status) return 'unsolved';
    if (status === 'completed') return 'completed';
    return 'attempted';
  };

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case 'easy': return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
      case 'medium': return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
      case 'hard': return 'text-red-600 border-red-400/30 bg-red-400/10';
      default: return 'text-gray-500 border-slate-400/30 bg-slate-400/10';
    }
  };

  const filteredProblems = useMemo(() => {
    if (activeFilter === 'all') return problems;
    return problems.filter((p) => p.difficulty === activeFilter);
  }, [activeFilter, problems]);

  const selectedProblem =
    filteredProblems.find((p) => p.id === selectedProblemId) || filteredProblems[0] || null;

  const stats = useMemo(
    () => ({
      total: problems.length,
      solved: problems.filter((p) => getProblemStatus(p) === 'completed').length,
      attempted: problems.filter((p) => getProblemStatus(p) === 'attempted').length,
      unsolved: problems.filter((p) => getProblemStatus(p) === 'unsolved').length,
    }),
    [problems]
  );

  const hunterRank = getHunterRankByXp(
    Number(user?.total_xp ?? user?.xp ?? user?.total_points ?? 0)
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded-md bg-gray-200" />
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="h-[560px] rounded-lg bg-gray-200" />
            <div className="h-[560px] rounded-lg bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Practice</h1>
          <p className="mt-1 text-sm text-gray-500">
            Solve coding problems and earn XP
          </p>
        </div>
        <div className="flex gap-2">
          {(['all', 'easy', 'medium', 'hard'] as DifficultyFilter[]).map(
            (filter) => (
              <button
                key={filter}
                onClick={() => {
                  setActiveFilter(filter);
                  const next =
                    filter === 'all'
                      ? problems
                      : problems.filter((p) => p.difficulty === filter);
                  setSelectedProblemId(next[0]?.id || null);
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors ${
                  activeFilter === filter
                    ? 'border-purple-500/50 bg-purple-50 text-purple-600'
                    : 'border-gray-200 text-gray-500 hover:text-gray-900'
                }`}
              >
                {filter}
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Problem list sidebar */}
        <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
          {filteredProblems.length === 0 ? (
            <Card className="border-gray-200 bg-white">
              <CardContent className="py-8 text-center">
                <Code className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-500">
                  No problems in this category.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredProblems.map((problem) => {
              const active = selectedProblem?.id === problem.id;
              const status = getProblemStatus(problem);
              return (
                <button
                  key={problem.id}
                  onClick={() => setSelectedProblemId(problem.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    active
                      ? 'border-purple-500/50 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3
                      className={`text-sm font-medium ${
                        active ? 'text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      {problem.title}
                    </h3>
                    {status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                    ) : status === 'attempted' ? (
                      <Circle className="h-4 w-4 flex-shrink-0 text-amber-400" />
                    ) : (
                      <Circle className="h-4 w-4 flex-shrink-0 text-slate-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`border text-[10px] ${getDifficultyColor(
                        problem.difficulty
                      )}`}
                    >
                      {problem.difficulty}
                    </Badge>
                    <span className="text-[10px] text-gray-400">
                      +{getXpReward(problem.difficulty)} XP
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Problem detail + stats */}
        <div className="space-y-6">
          {selectedProblem ? (
            <>
              {/* Problem detail card */}
              <Card className="border-gray-200 bg-white">
                <CardContent className="p-6">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedProblem.title}
                      </h2>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge
                          className={`border ${getDifficultyColor(
                            selectedProblem.difficulty
                          )}`}
                        >
                          {selectedProblem.difficulty}
                        </Badge>
                        <Badge className="border-purple-200 bg-purple-50 text-purple-600">
                          +
                          {Math.round(
                            getXpReward(selectedProblem.difficulty) *
                              streakMultiplier
                          )}{' '}
                          XP
                        </Badge>
                      </div>
                    </div>
                    {getProblemStatus(selectedProblem) === 'completed' && (
                      <Badge className="border-green-200 bg-green-50 text-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" /> Solved
                      </Badge>
                    )}
                  </div>
                  <p className="mb-6 text-sm leading-relaxed text-gray-500">
                    {selectedProblem.description ||
                      'No description available.'}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() =>
                        router.push(
                          `/topic/${selectedProblem.topic_id}/problems/${selectedProblem.id}/code`
                        )
                      }
                      className="bg-purple-600 text-white hover:bg-purple-500"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      {getProblemStatus(selectedProblem) === 'completed'
                        ? 'Practice Again'
                        : 'Start Practice'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/leaderboard')}
                      className="border-gray-200 text-gray-600 hover:bg-gray-100"
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" /> Rankings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-gray-200 bg-white">
              <CardContent className="py-16 text-center">
                <Code className="mx-auto mb-4 h-10 w-10 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  No problems available
                </h3>
                <p className="text-sm text-gray-500">
                  Switch filter or enroll in a course first.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Stats cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-gray-200 bg-white">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">Solved</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.solved}
                </p>
                <Progress
                  value={stats.total ? (stats.solved / stats.total) * 100 : 0}
                  className="mt-2 h-1.5 bg-gray-200 [&>div]:bg-green-500"
                />
              </CardContent>
            </Card>
            <Card className="border-gray-200 bg-white">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">Attempted</p>
                <p className="text-2xl font-bold text-amber-400">
                  {stats.attempted}
                </p>
                <Progress
                  value={
                    stats.total ? (stats.attempted / stats.total) * 100 : 0
                  }
                  className="mt-2 h-1.5 bg-gray-200 [&>div]:bg-amber-500"
                />
              </CardContent>
            </Card>
            <Card className="border-gray-200 bg-white">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">Unsolved</p>
                <p className="text-2xl font-bold text-gray-600">
                  {stats.unsolved}
                </p>
                <Progress
                  value={
                    stats.total ? (stats.unsolved / stats.total) * 100 : 0
                  }
                  className="mt-2 h-1.5 bg-gray-200 [&>div]:bg-slate-500"
                />
              </CardContent>
            </Card>
          </div>

          {/* Quick info */}
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-5">
              <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                Session Info
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-gray-400">Student</p>
                  <p className="font-medium text-gray-900">
                    {user?.full_name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Rank</p>
                  <p className="font-medium text-purple-600">
                    {hunterRank.label}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Total XP</p>
                  <p className="font-medium text-gray-900">
                    {Number(
                      user?.total_xp ?? user?.xp ?? user?.total_points ?? 0
                    ).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Streak Boost</p>
                  <p className="font-medium text-amber-400">
                    x{streakMultiplier.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
