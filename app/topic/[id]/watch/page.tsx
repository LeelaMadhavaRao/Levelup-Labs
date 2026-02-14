'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getTopic, markVideoAsWatched } from '@/lib/courses';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function WatchVideoPage() {
  const router = useRouter();
  const params = useParams();
  const topicId = params.id as string;
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [topic, setTopic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [watched, setWatched] = useState(false);

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

          <div className="flex items-center justify-between pt-4">
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
            
            <Button variant="outline" onClick={() => router.push('/my-courses')}>
              Back to Courses
            </Button>
          </div>
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
