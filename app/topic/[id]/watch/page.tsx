'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getTopic, markVideoAsWatched, getTopicProgress } from '@/lib/courses';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase';
import { hasUserPassedQuiz } from '@/lib/quiz';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, PlayCircle, BookOpen, Loader2, Sparkles, Lock, ArrowRight, Code, FileQuestion } from 'lucide-react';
import { toast } from 'sonner';

export default function WatchVideoPage() {
  const router = useRouter();
  const params = useParams();
  const topicId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [topic, setTopic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [watched, setWatched] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [enhancedOverview, setEnhancedOverview] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);

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
      const topicData = await getTopic(topicId);
      setTopic(topicData);

      try {
        const progress = await getTopicProgress(currentUser.id, topicId);
        setWatched(progress.video_watched);
      } catch {
        setWatched(false);
      }

      try {
        const passed = await hasUserPassedQuiz(currentUser.id, topicId);
        setQuizPassed(!!passed);
      } catch {
        setQuizPassed(false);
      }
    } catch (err) {
      console.error('Error loading watch page data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsWatched = async () => {
    if (!user || !topic) return;
    const { error } = await markVideoAsWatched(user.id, topic.id);
    if (error) {
      toast.error('Failed to mark video as watched');
      return;
    }
    setWatched(true);
    toast.success('Video marked as watched!');
  };

  const handleShowOverview = async () => {
    if (enhancedOverview) {
      setShowOverview(!showOverview);
      return;
    }

    if (!topic?.overview) {
      setShowOverview(!showOverview);
      return;
    }

    setShowOverview(true);
    setEnhancing(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Please log in to view enhanced overview');
        return;
      }

      const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/enhanceOverview`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({
          topicName: topic.name,
          overview: topic.overview,
        }),
      });

      if (!response.ok) throw new Error('Failed to enhance overview');
      const data = await response.json();
      setEnhancedOverview(data.enhancedOverview);
    } catch (error) {
      console.error('Error enhancing overview:', error);
      toast.error('Failed to generate enhanced overview');
      setEnhancedOverview(topic.overview);
    } finally {
      setEnhancing(false);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const progressPercent = watched ? (quizPassed ? 66 : 33) : 0;

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-80 rounded bg-gray-200" />
          <div className="aspect-video rounded bg-gray-200" />
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

  const progressionSteps = [
    {
      label: 'Watch Video',
      icon: PlayCircle,
      done: watched,
      active: !watched,
    },
    {
      label: 'Take Quiz',
      icon: FileQuestion,
      done: quizPassed,
      active: watched && !quizPassed,
    },
    {
      label: 'Solve Problems',
      icon: Code,
      done: false,
      active: quizPassed,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <BookOpen className="h-4 w-4" />
            <span>Video Lesson</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{topic.name}</h1>
          {topic.description && (
            <p className="text-gray-500 mt-1 text-sm">{topic.description}</p>
          )}
        </div>
        {watched && (
          <Badge className="border-green-500/40 bg-green-100 text-green-600 self-start">
            <CheckCircle className="mr-1 h-3 w-3" />
            Watched
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Main content */}
        <div className="space-y-4">
          {/* Video player */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-black">
            <div className="relative aspect-video w-full">
              <iframe
                src={getYouTubeEmbedUrl(topic.video_url)}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`${topic.name} video`}
              />
            </div>
          </div>

          {/* Overview section */}
          <Card className="border-gray-200 bg-white">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Content Overview</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                {topic.overview || topic.description || 'Study the content and prepare for the assessment ahead.'}
              </p>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {!watched ? (
              <Button onClick={handleMarkAsWatched} className="bg-purple-600 hover:bg-purple-500 text-gray-900">
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Watched
              </Button>
            ) : (
              <Button onClick={() => router.push(`/topic/${topic.id}/quiz`)} className="bg-purple-600 hover:bg-purple-500 text-gray-900">
                <ArrowRight className="mr-2 h-4 w-4" />
                Begin Quiz
              </Button>
            )}
            <Button variant="outline" onClick={handleShowOverview} className="border-gray-200 text-gray-600 hover:bg-gray-100">
              <Sparkles className="mr-2 h-4 w-4" />
              {showOverview ? 'Hide AI Insights' : 'AI Insights'}
            </Button>
            <Button variant="ghost" onClick={() => router.push('/my-courses')} className="text-gray-500 hover:text-gray-900">
              Back to Courses
            </Button>
          </div>

          {/* AI Enhanced Overview */}
          {showOverview && (
            <Card className="border-gray-200 bg-white">
              <CardContent className="pt-6">
                {enhancing ? (
                  <div className="flex items-center gap-3 justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                    <span className="text-gray-500">Generating insights with AI...</span>
                  </div>
                ) : enhancedOverview ? (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">AI-Enhanced Insights</h3>
                    <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-gray-600">
                      {enhancedOverview}
                    </div>
                  </div>
                ) : topic?.overview ? (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">Topic Summary</h3>
                    <p className="text-gray-500 whitespace-pre-wrap">{topic.overview}</p>
                  </div>
                ) : (
                  <p className="text-gray-400">No additional information available for this topic.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Course Progression */}
        <div>
          <Card className="border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-900">Course Progression</CardTitle>
                <span className="text-xs text-gray-500">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-1.5 bg-gray-200 [&>div]:bg-purple-500 mt-2" />
            </CardHeader>
            <CardContent className="space-y-3">
              {progressionSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${
                      step.done
                        ? 'border-green-200 bg-green-50'
                        : step.active
                        ? 'border-purple-200 bg-purple-500/5'
                        : 'border-gray-100 bg-gray-50 opacity-50'
                    }`}
                  >
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      step.done
                        ? 'bg-green-100'
                        : step.active
                        ? 'bg-purple-100'
                        : 'bg-gray-100'
                    }`}>
                      {step.done ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      ) : step.active ? (
                        <Icon className="h-3.5 w-3.5 text-purple-600" />
                      ) : (
                        <Lock className="h-3 w-3 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${step.done ? 'text-green-600' : step.active ? 'text-gray-900' : 'text-gray-400'}`}>
                        {index + 1}. {step.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {step.done ? 'Completed' : step.active ? 'In Progress' : 'Locked'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
