'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getTopic, getTopicProgress } from '@/lib/courses';
import { hasUserPassedQuiz } from '@/lib/quiz';
import { getTopicProblems } from '@/lib/problems';
import { getCurrentUser } from '@/lib/auth';
import { getGamificationOverview, getStreakMultiplier } from '@/lib/gamification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  PlayCircle,
  FileQuestion,
  Code,
  ArrowRight,
  RotateCcw,
  Trophy,
  Star,
} from 'lucide-react';
import { Orbitron, Rajdhani } from 'next/font/google';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'] });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

type TopicStep = 'video' | 'quiz' | 'problems' | 'completed';

export default function TopicLandingPage() {
  const router = useRouter();
  const params = useParams();
  const topicId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<TopicStep>('video');
  const [progress, setProgress] = useState({
    video_watched: false,
    quiz_passed: false,
    problems_completed: 0,
  });
  const [totalProblems, setTotalProblems] = useState(0);
  const [streakMultiplier, setStreakMultiplier] = useState(1);
  const [levelSnapshot, setLevelSnapshot] = useState<{ level: number; title: string } | null>(null);

  useEffect(() => {
    checkProgressAndRoute();
  }, [topicId]);

  const checkProgressAndRoute = async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const topicData = await getTopic(topicId);
    if (!topicData) {
      setLoading(false);
      return;
    }
    setTopic(topicData);

    const [multiplier, overview] = await Promise.all([
      getStreakMultiplier(user.id).catch(() => 1),
      getGamificationOverview(user.id).catch(() => null),
    ]);
    setStreakMultiplier(multiplier);
    if (overview) {
      setLevelSnapshot({ level: overview.level, title: overview.title });
    }

    // Get progress from topic_progress table
    const topicProgress = await getTopicProgress(user.id, topicId);
    setProgress(topicProgress);

    // Also check quiz_responses directly (in case topic_progress wasn't updated)
    let quizPassed = topicProgress.quiz_passed;
    if (!quizPassed) {
      quizPassed = await hasUserPassedQuiz(user.id, topicId);
    }

    // Get problems info
    let problems: any[] = [];
    try {
      problems = await getTopicProblems(topicId, user.id);
    } catch {
      problems = [];
    }
    setTotalProblems(problems.length);

    const solvedCount = problems.filter(
      (p: any) => p.status === 'completed'
    ).length;

    // Determine current step
    if (!topicProgress.video_watched) {
      setCurrentStep('video');
    } else if (!quizPassed) {
      setCurrentStep('quiz');
    } else if (problems.length > 0 && solvedCount < problems.length) {
      setProgress((prev) => ({ ...prev, problems_completed: solvedCount, quiz_passed: true }));
      setCurrentStep('problems');
    } else {
      setProgress((prev) => ({
        ...prev,
        quiz_passed: true,
        problems_completed: solvedCount,
      }));
      setCurrentStep('completed');
    }

    setLoading(false);
  };

  const getStepStatus = (step: TopicStep) => {
    const order: TopicStep[] = ['video', 'quiz', 'problems', 'completed'];
    const currentIdx = order.indexOf(currentStep);
    const stepIdx = order.indexOf(step);

    if (step === 'completed') {
      return currentStep === 'completed' ? 'current' : 'upcoming';
    }
    if (stepIdx < currentIdx) return 'done';
    if (stepIdx === currentIdx) return 'current';
    return 'upcoming';
  };

  const handleContinue = () => {
    switch (currentStep) {
      case 'video':
        router.push(`/topic/${topicId}/watch`);
        break;
      case 'quiz':
        router.push(`/topic/${topicId}/quiz`);
        break;
      case 'problems':
        router.push(`/topic/${topicId}/problems`);
        break;
      case 'completed':
        router.push(`/topic/${topicId}/problems`);
        break;
    }
  };

  const getProgressPercent = () => {
    let total = 3; // video + quiz + problems
    let done = 0;
    if (progress.video_watched) done++;
    if (progress.quiz_passed) done++;
    if (totalProblems > 0) {
      done += progress.problems_completed / totalProblems;
    } else if (progress.quiz_passed) {
      done++; // no problems = auto-complete
    }
    return Math.round((done / total) * 100);
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className={`${rajdhani.className} container py-8 max-w-3xl`}>
        <Card className="card-interactive border-white/15 bg-black/60 text-slate-100">
          <CardContent className="py-16 text-center">
            <h2 className="text-xl font-semibold mb-2">Topic not found</h2>
            <Button onClick={() => router.push('/my-courses')}>Back to My Courses</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercent = getProgressPercent();

  const steps = [
    {
      id: 'video' as TopicStep,
      icon: PlayCircle,
      title: 'Watch Video',
      description: 'Learn the concepts through the video lesson',
      reward: 'Unlocks quiz progression',
      action: () => router.push(`/topic/${topicId}/watch`),
      actionLabel: progress.video_watched ? 'Rewatch' : 'Watch Now',
    },
    {
      id: 'quiz' as TopicStep,
      icon: FileQuestion,
      title: 'Take Quiz',
      description: 'Test your understanding with AI-generated questions',
      reward: `Pass reward: ~${Math.round(40 * streakMultiplier)} pts + 40 XP`,
      action: () => router.push(`/topic/${topicId}/quiz`),
      actionLabel: progress.quiz_passed ? 'Retake Quiz' : 'Start Quiz',
    },
    {
      id: 'problems' as TopicStep,
      icon: Code,
      title: 'Solve Problems',
      description: `Complete coding challenges (${progress.problems_completed}/${totalProblems} solved)`,
      reward: `Each solve: 100-300 pts with x${streakMultiplier.toFixed(2)} streak boost`,
      action: () => router.push(`/topic/${topicId}/problems`),
      actionLabel:
        totalProblems > 0 && progress.problems_completed >= totalProblems
          ? 'Review Problems'
          : 'Solve Problems',
    },
  ];

  return (
    <div className={`${rajdhani.className} relative min-h-screen overflow-hidden bg-[#09090B] text-slate-100`}>
      <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-10" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-purple-950/20 via-black to-cyan-950/20" />

      <div className="relative z-20 container max-w-6xl space-y-6 py-8">
      <div className="rounded-2xl border border-purple-500/30 bg-black/50 p-6 shadow-[0_0_30px_rgba(124,58,237,0.2)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className={`${orbitron.className} text-xs tracking-[0.25em] text-purple-300/90`}>MISSION NODE</p>
            <div className="flex items-center gap-3">
              <h1 className={`${orbitron.className} text-3xl font-black tracking-tight md:text-4xl`}>{topic.name}</h1>
              {currentStep === 'completed' && (
                <Badge className="border border-green-500/40 bg-green-500/20 text-green-400">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Completed
                </Badge>
              )}
            </div>
            {topic.description && <p className="max-w-3xl text-slate-400">{topic.description}</p>}
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-white/15 bg-black/60 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-slate-400">Progress</p>
              <p className="text-2xl font-bold text-cyan-300">{progressPercent}%</p>
            </div>
            <div className="rounded-lg border border-white/15 bg-black/60 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-slate-400">Solved</p>
              <p className="text-2xl font-bold text-purple-300">{progress.problems_completed}/{totalProblems}</p>
            </div>
            <div className="rounded-lg border border-white/15 bg-black/60 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-slate-400">Streak</p>
              <p className="text-2xl font-bold text-amber-300">x{streakMultiplier.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">

      <Card className="card-interactive border-white/15 bg-black/60 text-slate-100">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {levelSnapshot && (
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3" />
                  Lv {levelSnapshot.level} {levelSnapshot.title}
                </Badge>
              )}
              <Badge variant="outline" className="gap-1">
                <Trophy className="h-3 w-3 text-yellow-500" />
                Streak x{streakMultiplier.toFixed(2)}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Topic Progress</span>
              <span className="font-semibold">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {steps.map((step) => {
          const status = getStepStatus(step.id);
          const Icon = step.icon;
          const isDone = status === 'done';
          const isCurrent = status === 'current';

          return (
            <Card
              key={step.id}
              className={`card-interactive reveal-in transition-all ${
                isCurrent
                  ? 'border-purple-500/60 ring-1 ring-purple-500/30 bg-purple-500/10'
                  : isDone
                  ? 'border-green-500/30 bg-green-500/10'
                  : 'opacity-75 border-white/10 bg-black/50'
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                      isDone
                        ? 'bg-green-500/10'
                        : isCurrent
                        ? 'bg-primary/10'
                        : 'bg-muted'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <Icon
                        className={`h-6 w-6 ${
                          isCurrent ? 'text-purple-300' : 'text-slate-400'
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="text-sm text-slate-400">{step.description}</p>
                    <p className="text-xs text-purple-300 mt-1">{step.reward}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isCurrent ? 'default' : isDone ? 'outline' : 'ghost'}
                    disabled={!isDone && !isCurrent}
                    onClick={step.action}
                  >
                    {isCurrent && <ArrowRight className="mr-1 h-4 w-4" />}
                    {isDone && <RotateCcw className="mr-1 h-4 w-4" />}
                    {step.actionLabel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {currentStep !== 'completed' && (
        <div className="flex justify-center">
          <Button size="lg" onClick={handleContinue} className="min-w-[220px] bg-purple-700 hover:bg-purple-600 text-white">
            <ArrowRight className="mr-2 h-5 w-5" />
            {currentStep === 'video'
              ? 'Watch Video'
              : currentStep === 'quiz'
              ? 'Take Quiz'
              : 'Solve Problems'}
          </Button>
        </div>
      )}
      </div>

      <div className="space-y-4">
        <Card className="border-white/15 bg-black/60 text-slate-100">
          <CardHeader>
            <CardTitle className="text-lg">Mission Intel</CardTitle>
            <CardDescription className="text-slate-400">Current operational target</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border border-white/10 bg-black/50 p-3">
              <p className="text-slate-400">Active Step</p>
              <p className="font-semibold text-slate-100 capitalize">{currentStep}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/50 p-3">
              <p className="text-slate-400">Quiz Status</p>
              <p className="font-semibold text-slate-100">{progress.quiz_passed ? 'Passed' : 'Pending'}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/50 p-3">
              <p className="text-slate-400">Video Status</p>
              <p className="font-semibold text-slate-100">{progress.video_watched ? 'Watched' : 'Not Watched'}</p>
            </div>
          </CardContent>
        </Card>
        {levelSnapshot && (
          <Card className="border-white/15 bg-black/60 text-slate-100">
            <CardHeader>
              <CardTitle className="text-lg">Hunter Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/50 p-3">
                <span className="text-slate-400">Level</span>
                <span className="font-semibold">{levelSnapshot.level}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/50 p-3">
                <span className="text-slate-400">Title</span>
                <span className="font-semibold">{levelSnapshot.title}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/50 p-3">
                <span className="text-slate-400">Streak Bonus</span>
                <span className="font-semibold text-amber-300">x{streakMultiplier.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      </div>

      {currentStep === 'completed' && (
        <Card className="border-green-500/40 bg-green-500/10 text-slate-100">
          <CardContent className="pt-6 text-center space-y-4">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
            <div>
              <h2 className="text-2xl font-bold">Topic Completed!</h2>
              <p className="text-slate-400 mt-1">
                You've mastered this topic. Great work!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => router.push('/my-courses')}>
                Back to My Courses
              </Button>
              <Button variant="outline" onClick={() => router.push(`/topic/${topicId}/problems`)}>
                Review Problems
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}

