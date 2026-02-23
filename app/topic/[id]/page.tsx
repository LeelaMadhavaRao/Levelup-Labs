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
  Flame,
} from 'lucide-react';

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

    const topicProgress = await getTopicProgress(user.id, topicId);
    setProgress(topicProgress);

    let quizPassed = topicProgress.quiz_passed;
    if (!quizPassed) {
      quizPassed = await hasUserPassedQuiz(user.id, topicId);
    }

    let problems: any[] = [];
    try {
      problems = await getTopicProblems(topicId, user.id);
    } catch {
      problems = [];
    }
    setTotalProblems(problems.length);

    const solvedCount = problems.filter((p: any) => p.status === 'completed').length;

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
    let total = 3;
    let done = 0;
    if (progress.video_watched) done++;
    if (progress.quiz_passed) done++;
    if (totalProblems > 0) {
      done += progress.problems_completed / totalProblems;
    } else if (progress.quiz_passed) {
      done++;
    }
    return Math.round((done / total) * 100);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-80 rounded bg-gray-200" />
          <div className="h-48 rounded bg-gray-200" />
          <div className="h-48 rounded bg-gray-200" />
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
      reward: 'Pass to unlock coding problems',
      action: () => router.push(`/topic/${topicId}/quiz`),
      actionLabel: progress.quiz_passed ? 'Retake Quiz' : 'Start Quiz',
    },
    {
      id: 'problems' as TopicStep,
      icon: Code,
      title: 'Solve Problems',
      description: `Complete coding challenges (${progress.problems_completed}/${totalProblems} solved)`,
      reward: `100-300 XP per problem with x${streakMultiplier.toFixed(2)} streak`,
      action: () => router.push(`/topic/${topicId}/problems`),
      actionLabel:
        totalProblems > 0 && progress.problems_completed >= totalProblems
          ? 'Review Problems'
          : 'Solve Problems',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{topic.name}</h1>
            {currentStep === 'completed' && (
              <Badge className="border-green-500/40 bg-green-100 text-green-600">
                <CheckCircle className="mr-1 h-3 w-3" />
                Completed
              </Badge>
            )}
          </div>
          {topic.description && (
            <p className="max-w-3xl text-gray-500">{topic.description}</p>
          )}
        </div>

        <div className="flex gap-3 text-center">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 min-w-[90px]">
            <p className="text-xs text-gray-400">Progress</p>
            <p className="text-2xl font-bold text-purple-600">{progressPercent}%</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 min-w-[90px]">
            <p className="text-xs text-gray-400">Solved</p>
            <p className="text-2xl font-bold text-gray-900">{progress.problems_completed}/{totalProblems}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 min-w-[90px]">
            <p className="text-xs text-gray-400">Streak</p>
            <p className="text-2xl font-bold text-amber-400">x{streakMultiplier.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Progress bar card */}
          <Card className="border-gray-200 bg-white">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {levelSnapshot && (
                    <Badge variant="secondary" className="gap-1 bg-gray-100 text-gray-600 border-gray-200">
                      <Star className="h-3 w-3 text-yellow-500" />
                      Lv {levelSnapshot.level} · {levelSnapshot.title}
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1 border-gray-200 text-gray-600">
                    <Flame className="h-3 w-3 text-amber-500" />
                    Streak x{streakMultiplier.toFixed(2)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Topic Progress</span>
                  <span className="font-semibold text-gray-900">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2 bg-gray-200 [&>div]:bg-purple-500" />
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step) => {
              const status = getStepStatus(step.id);
              const Icon = step.icon;
              const isDone = status === 'done';
              const isCurrent = status === 'current';

              return (
                <Card
                  key={step.id}
                  className={`transition-all ${
                    isCurrent
                      ? 'border-purple-500/50 bg-purple-500/5'
                      : isDone
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-white opacity-60'
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                          isDone
                            ? 'bg-green-50'
                            : isCurrent
                            ? 'bg-purple-50'
                            : 'bg-gray-100'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : (
                          <Icon className={`h-6 w-6 ${isCurrent ? 'text-purple-600' : 'text-gray-400'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{step.title}</h3>
                        <p className="text-sm text-gray-500">{step.description}</p>
                        <p className="text-xs text-purple-600 mt-1">{step.reward}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={isCurrent ? 'default' : isDone ? 'outline' : 'ghost'}
                        disabled={!isDone && !isCurrent}
                        onClick={step.action}
                        className={
                          isCurrent
                            ? 'bg-purple-600 hover:bg-purple-500 text-gray-900'
                            : isDone
                            ? 'border-gray-200 text-gray-600 hover:bg-gray-100'
                            : ''
                        }
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

          {/* Continue button */}
          {currentStep !== 'completed' && (
            <div className="flex justify-center pt-2">
              <Button size="lg" onClick={handleContinue} className="min-w-[220px] bg-purple-600 hover:bg-purple-500 text-gray-900">
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

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Topic Info</CardTitle>
              <CardDescription className="text-gray-400">Current progress details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                <span className="text-gray-500">Active Step</span>
                <span className="font-semibold text-gray-900 capitalize">{currentStep}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                <span className="text-gray-500">Quiz Status</span>
                <span className={`font-semibold ${progress.quiz_passed ? 'text-green-600' : 'text-gray-600'}`}>
                  {progress.quiz_passed ? 'Passed' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                <span className="text-gray-500">Video</span>
                <span className={`font-semibold ${progress.video_watched ? 'text-green-600' : 'text-gray-600'}`}>
                  {progress.video_watched ? 'Watched' : 'Not Watched'}
                </span>
              </div>
            </CardContent>
          </Card>

          {levelSnapshot && (
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <span className="text-gray-500">Level</span>
                  <span className="font-semibold text-gray-900">{levelSnapshot.level}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <span className="text-gray-500">Title</span>
                  <span className="font-semibold text-gray-900">{levelSnapshot.title}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <span className="text-gray-500">Streak Bonus</span>
                  <span className="font-semibold text-amber-400">x{streakMultiplier.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Completed celebration */}
      {currentStep === 'completed' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center space-y-4">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Topic Completed!</h2>
              <p className="text-gray-500 mt-1">You&apos;ve mastered this topic. Great work!</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => router.push('/my-courses')} className="bg-purple-600 hover:bg-purple-500 text-gray-900">
                Back to My Courses
              </Button>
              <Button variant="outline" onClick={() => router.push(`/topic/${topicId}/problems`)} className="border-gray-200 text-gray-600 hover:bg-gray-100">
                Review Problems
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

