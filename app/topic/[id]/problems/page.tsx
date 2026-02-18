'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getTopicProblems, getTopic, generateProblemsForTopic } from '@/lib/problems';
import { getCurrentUser } from '@/lib/auth';
import { getStreakMultiplier } from '@/lib/gamification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, Trophy, CheckCircle, Circle, Flame, Star, Target, Zap, Lock, Unlock, Loader2 } from 'lucide-react';
import { Orbitron, Rajdhani } from 'next/font/google';
import { toast } from 'sonner';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'] });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function ProblemsListPage() {
  const router = useRouter();
  const params = useParams();
  const topicId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [topic, setTopic] = useState<any>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [streakMultiplier, setStreakMultiplier] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, [topicId]);

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser();
      
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      setUser(currentUser);
      const [topicData, problemsData, multiplier] = await Promise.all([
        getTopic(topicId),
        getTopicProblems(topicId, currentUser.id),
        getStreakMultiplier(currentUser.id).catch(() => 1),
      ]);
      
      setTopic(topicData);
      setProblems(problemsData);
      setStreakMultiplier(multiplier);
    } catch (error) {
      console.error('Failed to load topic problems:', error);
      setProblems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProblems = async () => {
    if (!topic || !user) return;
    
    setGenerating(true);
    toast.info('Generating coding problems using AI... This may take 30-60 seconds.');

    try {
      const numProblems = 3; // Generate 3 problems
      const { problems: newProblems, error } = await generateProblemsForTopic(
        topic.id,
        topic.name,
        numProblems,
        topic.overview || topic.description
      );

      if (error || !newProblems || newProblems.length === 0) {
        throw new Error(error || 'No problems generated');
      }

      toast.success(`Successfully generated ${newProblems.length} coding problems!`);
      setProblems(newProblems);
    } catch (error) {
      console.error('Failed to generate problems:', error);
      toast.error('Failed to generate problems. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'hard':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return '';
    }
  };

  const getXpByDifficulty = (difficulty: string) => {
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
    const statuses = problem.problem_solutions || [];
    if (!Array.isArray(statuses) || statuses.length === 0) return null;
    if (statuses.some((s: any) => s.status === 'completed')) return 'completed';
    if (statuses.some((s: any) => s.status)) return 'attempted';
    return null;
  };

  if (loading) {
    return (
      <div className={`${rajdhani.className} relative min-h-screen overflow-hidden bg-[#09090B] text-slate-100`}>
        <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-10" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-purple-950/20 via-black to-cyan-950/20" />
        <div className="relative z-20 container py-8 max-w-6xl">
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-80 rounded bg-white/10" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded bg-white/10" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className={`${rajdhani.className} container py-8`}>
        <Card className="card-interactive border-white/15 bg-black/60 text-slate-100">
          <CardContent className="py-16 text-center">
            <h2 className="text-xl font-semibold mb-2">Topic not found</h2>
            <Button onClick={() => router.push('/my-courses')}>
              Back to My Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedCount = problems.filter((p) => getProblemStatus(p) === 'completed').length;
  const totalXp = problems.reduce((acc, p) => acc + getXpByDifficulty(p.difficulty), 0);

  return (
    <div className={`${rajdhani.className} relative min-h-screen overflow-hidden bg-[#09090B] text-slate-100`}>
      <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-10" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-purple-950/20 via-black to-cyan-950/20" />

      <div className="relative z-20 container py-8 max-w-6xl space-y-8">
      {/* Header Panel */}
      <div className="rounded-2xl border border-purple-500/30 bg-black/50 p-6 shadow-[0_0_30px_rgba(124,58,237,0.2)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className={`${orbitron.className} text-3xl font-black tracking-tight md:text-4xl uppercase`}>
              <span className="text-purple-500 mr-2">/</span>
              PROBLEM SELECTION
            </h1>
            <p className="mt-2 text-slate-400 font-mono text-sm">
              // TARGET: {topic.name.toUpperCase()} <br/>
              // OBJECTIVE: Complete coding challenges to master this domain.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-center min-w-[300px]">
            <div className="rounded-lg border border-white/15 bg-black/60 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Status</p>
              <p className="text-2xl font-bold text-cyan-300 font-mono leading-none">{completedCount}/{problems.length}</p>
            </div>
            <div className="rounded-lg border border-white/15 bg-black/60 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">XP Pool</p>
              <p className="text-2xl font-bold text-purple-300 font-mono leading-none">{totalXp}</p>
            </div>
            <div className="rounded-lg border border-white/15 bg-black/60 px-4 py-3 bg-gradient-to-b from-amber-950/30 to-black/60 border-amber-500/30">
              <p className="text-[10px] uppercase tracking-wider text-amber-400 mb-1">Multiplier</p>
              <div className="flex items-center justify-center gap-1">
                <Flame className="h-4 w-4 text-amber-500 fill-amber-500 animate-pulse" />
                <p className="text-2xl font-bold text-amber-300 font-mono leading-none">x{streakMultiplier.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Problems List */}
      {problems.length === 0 ? (
        <Card className="card-interactive border-white/15 bg-black/60 text-slate-100 min-h-[400px] flex items-center justify-center">
          <CardContent className="text-center space-y-4 py-16">
            <div className="relative">
              {generating ? (
                <Loader2 className="h-16 w-16 text-purple-500 mx-auto animate-spin" />
              ) : (
                <>
                  <Code className="h-16 w-16 text-slate-700 mx-auto" />
                  <Lock className="h-6 w-6 text-slate-500 absolute bottom-0 right-1/2 translate-x-12" />
                </>
              )}
            </div>
            <div>
              <h3 className={`${orbitron.className} text-xl font-bold mb-2 tracking-wide`}>
                {generating ? 'GENERATING PROBLEMS' : 'NO PROBLEMS DETECTED'}
              </h3>
              <p className="text-slate-400 max-w-md mx-auto">
                {generating 
                  ? 'AI is creating custom coding challenges for this topic. Please wait...' 
                  : 'No active coding challenges found. Generate AI-powered problems to continue your training.'}
              </p>
            </div>
            {!generating ? (
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={handleGenerateProblems}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Generate Problems with AI
                </Button>
                <Button 
                  onClick={() => router.push('/my-courses')} 
                  variant="outline" 
                  className="border-white/20 hover:bg-white/10"
                >
                  Return to Base
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>This may take 30-60 seconds...</span>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {problems.map((problem) => {
            const status = getProblemStatus(problem);
            const isCompleted = status === 'completed';
            const baseXp = getXpByDifficulty(problem.difficulty);
            const effectiveXp = Math.round(baseXp * streakMultiplier);
            
            // Difficulty styling
            let diffColor = 'text-slate-400';
            let diffBorder = 'border-slate-500/30';
            if (problem.difficulty === 'easy') { diffColor = 'text-green-400'; diffBorder = 'border-green-500/30'; }
            if (problem.difficulty === 'medium') { diffColor = 'text-yellow-400'; diffBorder = 'border-yellow-500/30'; }
            if (problem.difficulty === 'hard') { diffColor = 'text-red-400'; diffBorder = 'border-red-500/30'; }

            return (
              <Card
                key={problem.id}
                className={`group relative flex flex-col justify-between overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] ${
                  isCompleted 
                    ? 'border-green-500/30 bg-green-950/10' 
                    : 'border-white/10 bg-black/80 hover:border-purple-500/50'
                }`}
              >
                {/* Background Decoration */}
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 bg-gradient-to-br from-purple-500/10 to-transparent blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />
                
                <CardHeader className="relative z-10 space-y-4 pb-2">
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className={`uppercase tracking-wider text-[10px] ${diffBorder} ${diffColor} bg-transparent`}>
                      {problem.difficulty}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs font-mono text-slate-500">
                      <Zap className="h-3 w-3 text-yellow-500/70" />
                      <span>{effectiveXp} XP</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <CardTitle className={`text-lg leading-tight ${isCompleted ? 'text-green-300' : 'text-slate-100 group-hover:text-purple-300'} transition-colors`}>
                       {problem.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-xs text-slate-400">
                      {problem.description}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10 pt-4">
                  <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <div className="flex items-center gap-1.5 text-xs text-green-400 font-bold tracking-wide">
                          <CheckCircle className="h-4 w-4" />
                          <span>CLEARED</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                           <Target className="h-3.5 w-3.5" />
                           <span>PENDING</span>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => router.push(`/topic/${topicId}/problems/${problem.id}/explain`)}
                      className={isCompleted 
                        ? 'bg-transparent border border-green-500/30 text-green-400 hover:bg-green-500/10 h-8 text-xs' 
                        : 'bg-white/5 hover:bg-purple-600 hover:text-white text-slate-300 border border-white/10 hover:border-purple-500 h-8 text-xs transition-colors'}
                    >
                      {isCompleted ? 'Review Details' : 'Start'}
                    </Button>
                  </div>
                </CardContent>
                
                {/* Active Corner Accent */}
                {!isCompleted && (
                   <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Unlock className="h-4 w-4 text-purple-400" />
                   </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}

