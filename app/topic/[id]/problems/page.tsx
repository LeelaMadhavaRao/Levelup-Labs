'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getTopicProblems, getTopic } from '@/lib/problems';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, Trophy, CheckCircle, Circle } from 'lucide-react';

export default function ProblemsListPage() {
  const router = useRouter();
  const params = useParams();
  const topicId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [topic, setTopic] = useState<any>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [topicId]);

  const loadData = async () => {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    setUser(currentUser);
    const topicData = await getTopic(topicId);
    const problemsData = await getTopicProblems(topicId, currentUser.id);
    
    setTopic(topicData);
    setProblems(problemsData);
    setLoading(false);
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

  const getPointsByDifficulty = (difficulty: string) => {
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

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="container py-8">
        <Card>
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

  return (
    <div className="container py-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{topic.name} - Problems</h1>
        <p className="text-muted-foreground">
          Solve coding problems to master this topic and earn points
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Problems</p>
                <p className="text-2xl font-bold">{problems.length}</p>
              </div>
              <Code className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solved</p>
                <p className="text-2xl font-bold">
                  {problems.filter((p) => p.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Points Available</p>
                <p className="text-2xl font-bold">
                  {problems.reduce((acc, p) => acc + getPointsByDifficulty(p.difficulty), 0)}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Problems List */}
      {problems.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <Code className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold mb-2">No problems available yet</h3>
              <p className="text-muted-foreground">
                Problems will be added soon. Check back later!
              </p>
            </div>
            <Button onClick={() => router.push('/my-courses')}>
              Back to My Courses
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {problems.map((problem) => {
            const isCompleted = problem.status === 'completed';

            return (
              <Card
                key={problem.id}
                className={`transition-colors ${
                  isCompleted ? 'border-green-500/30 bg-green-500/5' : 'hover:border-primary'
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                        )}
                        <CardTitle className="text-xl">{problem.title}</CardTitle>
                      </div>
                      <CardDescription>{problem.description}</CardDescription>
                    </div>
                    
                    <div className="space-y-2 shrink-0">
                      <Badge className={getDifficultyColor(problem.difficulty)}>
                        {problem.difficulty}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="font-semibold">{getPointsByDifficulty(problem.difficulty)}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button
                      onClick={() =>
                        router.push(`/topic/${topicId}/problems/${problem.id}/explain`)
                      }
                      variant={isCompleted ? 'outline' : 'default'}
                    >
                      {isCompleted ? 'Review' : 'Start Problem'}
                    </Button>
                    {isCompleted && (
                      <Badge variant="secondary" className="px-3">
                        ✓ Solved
                      </Badge>
                    )}
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
