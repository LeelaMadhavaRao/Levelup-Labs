'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getAllProblems } from '@/lib/problems';
import { getStreakMultiplier } from '@/lib/gamification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, CheckCircle2, Circle, Flame, Trophy } from 'lucide-react';

export default function PracticePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
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
    } catch (error) {
      console.error('Error loading problems:', error);
    }
    
    setLoading(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'hard':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      default:
        return 'bg-muted';
    }
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

  const filterProblems = (difficulty?: string) => {
    if (!difficulty || difficulty === 'all') return problems;
    return problems.filter(p => p.difficulty === difficulty);
  };

  const getStatusStats = () => {
    return {
      total: problems.length,
      solved: problems.filter((p) => getProblemStatus(p) === 'completed').length,
      attempted: problems.filter((p) => getProblemStatus(p) === 'attempted').length,
      unsolved: problems.filter((p) => getProblemStatus(p) === 'unsolved').length,
    };
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = getStatusStats();
  const displayProblems = filterProblems(activeTab);

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Practice Problems</h1>
        <p className="text-muted-foreground mt-2">
          Sharpen your coding skills with challenges across all courses
        </p>
        <div className="mt-2 flex items-center">
          <Badge variant="outline" className="gap-1">
            <Flame className="h-3 w-3 text-orange-500" />
            Streak multiplier x{streakMultiplier.toFixed(2)}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Problems</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.solved}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0}% complete
            </p>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attempted</CardTitle>
            <Circle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.attempted}</div>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Started</CardTitle>
            <Circle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unsolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Problems List with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="easy">Easy</TabsTrigger>
          <TabsTrigger value="medium">Medium</TabsTrigger>
          <TabsTrigger value="hard">Hard</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {displayProblems.length === 0 ? (
            <Card className="card-interactive">
              <CardContent className="pt-6 text-center py-12">
                <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No problems available in this category yet.
                </p>
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/courses">Browse Courses</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            displayProblems.map((problem) => (
              <Card key={problem.id} className="card-interactive hover:bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        {getProblemStatus(problem) === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : getProblemStatus(problem) === 'attempted' ? (
                          <Circle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                        <h3 className="font-semibold text-lg">{problem.title}</h3>
                        <Badge className={getDifficultyColor(problem.difficulty)}>
                          {problem.difficulty}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {problem.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4" />
                          <span>{Math.round(getPoints(problem.difficulty) * streakMultiplier)} points</span>
                        </div>
                        {problem.topics && (
                          <>
                            <span>•</span>
                            <span>
                              {problem.topics.modules?.courses?.name || 'Unknown Course'} →{' '}
                              {problem.topics.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <Button asChild className="w-full sm:w-auto">
                      <Link href={`/topic/${problem.topic_id}/problems/${problem.id}/code`}>
                        {getProblemStatus(problem) === 'completed' ? 'Solve Again' : 'Solve'}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Tips Card */}
      {displayProblems.length > 0 && (
        <Card className="card-interactive">
          <CardHeader>
            <CardTitle>💡 Tips for Success</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Start with Easy problems to build confidence</li>
              <li>• Read the problem statement carefully and understand all examples</li>
              <li>• Think about edge cases before coding</li>
              <li>• Test your solution with the provided examples</li>
              <li>• Each solved problem earns you points on the leaderboard!</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


