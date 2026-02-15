'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getTopic, markVideoAsWatched } from '@/lib/courses';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Play, BookOpen, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function WatchVideoPage() {
  const router = useRouter();
  const params = useParams();
  const topicId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [topic, setTopic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [watched, setWatched] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [enhancedOverview, setEnhancedOverview] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);

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
    setTopic(topicData);
    setWatched(topicData?.video_watched || false);
    setLoading(false);
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
      // Already loaded, just toggle
      setShowOverview(!showOverview);
      return;
    }

    if (!topic?.overview) {
      // No admin-provided overview, just show description
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

      if (!response.ok) {
        throw new Error('Failed to enhance overview');
      }

      const data = await response.json();
      setEnhancedOverview(data.enhancedOverview);
    } catch (error) {
      console.error('Error enhancing overview:', error);
      toast.error('Failed to generate enhanced overview');
      // Fall back to showing raw overview
      setEnhancedOverview(topic.overview);
    } finally {
      setEnhancing(false);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="aspect-video bg-muted rounded" />
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
    <div className="container py-8 max-w-6xl space-y-6">
      {/* Video Player */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-2xl">{topic.name}</CardTitle>
              {topic.description && (
                <CardDescription className="text-base">{topic.description}</CardDescription>
              )}
            </div>
            {watched && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950 px-3 py-1 rounded-full">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Watched</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            <iframe
              src={getYouTubeEmbedUrl(topic.video_url)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4">
            {!watched ? (
              <Button onClick={handleMarkAsWatched} size="lg">
                <CheckCircle className="mr-2 h-5 w-5" />
                Mark as Watched
              </Button>
            ) : (
              <Button onClick={() => router.push(`/topic/${topic.id}/quiz`)} size="lg">
                Start Quiz
              </Button>
            )}
            
            <Button variant="outline" onClick={handleShowOverview}>
              <BookOpen className="mr-2 h-4 w-4" />
              {showOverview ? 'Hide Overview' : 'Topic Overview'}
            </Button>
            <Button variant="ghost" onClick={() => router.push('/my-courses')}>
              Back to Courses
            </Button>
          </div>

          {/* Enhanced Topic Overview */}
          {showOverview && (
            <div className="mt-6 rounded-lg border bg-muted/30 p-6">
              {enhancing ? (
                <div className="flex items-center gap-3 justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-muted-foreground">
                    <Sparkles className="inline h-4 w-4 mr-1 text-yellow-500" />
                    Generating enhanced overview with AI...
                  </span>
                </div>
              ) : enhancedOverview ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    <h3 className="text-lg font-semibold">AI-Enhanced Overview</h3>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {enhancedOverview}
                  </div>
                </div>
              ) : topic?.overview ? (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Topic Overview</h3>
                  <p className="text-muted-foreground">{topic.overview}</p>
                </div>
              ) : topic?.description ? (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Topic Overview</h3>
                  <p className="text-muted-foreground">{topic.description}</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No overview available for this topic.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      {watched && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
            <CardDescription>
              Now that you've watched the video, test your knowledge with a quiz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/topic/${topic.id}/quiz`)}>
              Take the Quiz
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
