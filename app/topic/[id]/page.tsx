'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getTopic, getTopicProgress } from '@/lib/courses';
import { hasUserPassedQuiz } from '@/lib/quiz';
import { getTopicProblems } from '@/lib/problems';
import { getCurrentUser } from '@/lib/auth';
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
      <div className="container py-8 max-w-3xl">
        <Card>
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
      action: () => router.push(`/topic/${topicId}/watch`),
      actionLabel: progress.video_watched ? 'Rewatch' : 'Watch Now',
    },
    {
      id: 'quiz' as TopicStep,
      icon: FileQuestion,
      title: 'Take Quiz',
      description: 'Test your understanding with AI-generated questions',
      action: () => router.push(`/topic/${topicId}/quiz`),
      actionLabel: progress.quiz_passed ? 'Retake Quiz' : 'Start Quiz',
    },
    {
      id: 'problems' as TopicStep,
      icon: Code,
      title: 'Solve Problems',
      description: `Complete coding challenges (${progress.problems_completed}/${totalProblems} solved)`,
      action: () => router.push(`/topic/${topicId}/problems`),
      actionLabel:
        totalProblems > 0 && progress.problems_completed >= totalProblems
          ? 'Review Problems'
          : 'Solve Problems',
    },
  ];

  return (
    <div className="container py-8 max-w-3xl space-y-6">
      {/* Topic Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{topic.name}</h1>
          {currentStep === 'completed' && (
            <Badge className="bg-green-500/20 text-green-500 border border-green-500/40">
              <CheckCircle className="mr-1 h-3 w-3" />
              Completed
            </Badge>
          )}
        </div>
        {topic.description && (
          <p className="text-muted-foreground">{topic.description}</p>
        )}
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Topic Progress</span>
              <span className="font-semibold">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
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
                  ? 'border-primary ring-1 ring-primary/20'
                  : isDone
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'opacity-60'
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
                          isCurrent ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
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

      {/* Completed State */}
      {currentStep === 'completed' && (
        <Card className="border-green-500/40 bg-green-500/5">
          <CardContent className="pt-6 text-center space-y-4">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
            <div>
              <h2 className="text-2xl font-bold">Topic Completed!</h2>
              <p className="text-muted-foreground mt-1">
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

      {/* Continue Button */}
      {currentStep !== 'completed' && (
        <div className="flex justify-center">
          <Button size="lg" onClick={handleContinue} className="min-w-[200px]">
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
  );
}
