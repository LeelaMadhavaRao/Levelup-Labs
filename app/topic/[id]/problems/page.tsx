'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getTopicProblems, getTopic, generateProblemsForTopic } from '@/lib/problems';
import { getCurrentUser } from '@/lib/auth';
import { getStreakMultiplier } from '@/lib/gamification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, CheckCircle, Circle, Flame, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const hasAttemptedGeneration = useRef(false);

  useEffect(() => {
    loadData();
  }, [topicId]);

  useEffect(() => {
    if (!loading && !generating && problems.length === 0 && topic && user && !hasAttemptedGeneration.current) {
      hasAttemptedGeneration.current = true;
      handleGenerateProblems();
    }
  }, [loading, topic, user]);

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
      const numProblems = 3;
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
      const refreshed = await getTopicProblems(topic.id, user.id);
      setProblems(refreshed);
    } catch (error) {
      console.error('Failed to generate problems:', error);
      toast.error('Failed to generate problems. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-50 text-green-600 border-green-500/20';
      case 'medium': return 'bg-yellow-50 text-yellow-600 border-yellow-500/20';
      case 'hard': return 'bg-red-50 text-red-600 border-red-500/20';
      default: return '';
    }
  };

  const getXpByDifficulty = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 100;
      case 'medium': return 200;
      case 'hard': return 300;
      default: return 0;
    }
  };

  const getProblemStatus = (problem: any) => {
    if (problem.status === 'completed') return 'completed';
    if (problem.status) return 'attempted';
    return null;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-80 rounded bg-gray-200" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="border-gray-200 bg-white">
          <CardContent className="py-16 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Topic not found</h2>
            <Button onClick={() => router.push('/my-courses')} className="bg-purple-600 hover:bg-purple-500 text-gray-900">
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coding Problems</h1>
          <p className="text-gray-500 text-sm mt-1">{topic.name} — Complete challenges to master this topic</p>
        </div>

        <div className="flex gap-3 text-center">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 min-w-[80px]">
            <p className="text-xs text-gray-400">Solved</p>
            <p className="text-xl font-bold text-gray-900">{completedCount}/{problems.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 min-w-[80px]">
            <p className="text-xs text-gray-400">Total XP</p>
            <p className="text-xl font-bold text-purple-600">{totalXp}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 min-w-[80px]">
            <p className="text-xs text-gray-400">Streak</p>
            <div className="flex items-center justify-center gap-1">
              <Flame className="h-4 w-4 text-amber-500" />
              <p className="text-xl font-bold text-amber-400">x{streakMultiplier.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Problems */}
      {problems.length === 0 ? (
        <Card className="border-gray-200 bg-white">
          <CardContent className="text-center space-y-4 py-16">
            {generating ? (
              <>
                <Loader2 className="h-12 w-12 text-purple-600 mx-auto animate-spin" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Generating Problems</h3>
                  <p className="text-gray-500 text-sm mt-1">AI is creating custom challenges for this topic...</p>
                  <p className="text-gray-400 text-xs mt-2">This may take 30-60 seconds</p>
                </div>
              </>
            ) : (
              <>
                <Code className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">No Problems Yet</h3>
                  <p className="text-gray-500 text-sm mt-1">Generate AI-powered coding challenges to continue</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleGenerateProblems} className="bg-purple-600 hover:bg-purple-500 text-gray-900">
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Problems
                  </Button>
                  <Button onClick={() => router.push('/my-courses')} variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-100">
                    Back to Courses
                  </Button>
                </div>
              </>
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

            return (
              <Card
                key={problem.id}
                className={`flex flex-col justify-between transition-colors hover:border-gray-300 ${
                  isCompleted
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <CardHeader className="space-y-3 pb-2">
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className={`text-xs capitalize ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      {effectiveXp} XP
                    </div>
                  </div>
                  <div>
                    <CardTitle className={`text-base ${isCompleted ? 'text-green-300' : 'text-gray-900'}`}>
                      {problem.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-xs text-gray-500 mt-1">
                      {problem.description}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="pt-3">
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      {isCompleted ? (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Solved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Circle className="h-3.5 w-3.5" />
                          Pending
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/topic/${topicId}/problems/${problem.id}/explain`)}
                      className={
                        isCompleted
                          ? 'border-gray-200 bg-transparent text-gray-600 hover:bg-gray-100 h-8 text-xs'
                          : 'bg-purple-600 hover:bg-purple-500 text-gray-900 h-8 text-xs'
                      }
                      variant={isCompleted ? 'outline' : 'default'}
                    >
                      {isCompleted ? 'Review' : 'Start'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

