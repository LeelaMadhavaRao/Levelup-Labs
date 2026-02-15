'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Orbitron, Rajdhani } from 'next/font/google';
import { getTopic, markVideoAsWatched } from '@/lib/courses';
import { generateHunterAvatarUrl, getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase';
import { hasUserPassedQuiz } from '@/lib/quiz';
import { Button } from '@/components/ui/button';
import { CheckCircle, Play, BookOpen, Loader2, Sparkles, Clock, Lock, Star, Zap, Code } from 'lucide-react';
import { toast } from 'sonner';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'] });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

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
  const [systemTime, setSystemTime] = useState<string>(() => new Date().toLocaleTimeString('en-US', { hour12: false }));
  const [avatarSrc, setAvatarSrc] = useState<string>('');

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
    setAvatarSrc(currentUser.avatar_url || generateHunterAvatarUrl(`${currentUser.id}-${currentUser.full_name || currentUser.email || 'hunter'}`));
    const topicData = await getTopic(topicId);
    setTopic(topicData);
    setWatched(topicData?.video_watched || false);
    try {
      const passed = await hasUserPassedQuiz(currentUser.id, topicId);
      setQuizPassed(!!passed);
    } catch {
      setQuizPassed(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const progressPercent = watched ? (quizPassed ? 66 : 33) : 0;

  if (loading) {
    return (
      <div className={`${rajdhani.className} relative min-h-screen overflow-hidden text-white`}>
        <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-10" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-purple-950/20 via-black to-cyan-950/20" />
        <div className="relative z-20 container py-8 max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-80 rounded bg-white/10" />
          <div className="aspect-video rounded bg-white/10" />
        </div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className={`${rajdhani.className} relative min-h-screen overflow-hidden text-white`}>
        <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-10" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-purple-950/20 via-black to-cyan-950/20" />
        <div className="relative z-20 container py-8 max-w-3xl text-center">
          <div className="rounded-lg border border-white/10 bg-black/60 p-10">
            <h2 className="text-xl font-semibold mb-2">Topic not found</h2>
            <Button onClick={() => router.push('/my-courses')} className="bg-purple-700 hover:bg-purple-600 border border-purple-400/40 text-white">Back to My Courses</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${rajdhani.className} relative min-h-screen overflow-hidden text-white`}>
      <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-10" />
      <div className="scan-line" />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#a60df2 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-purple-900/10 via-black/80 to-cyan-900/10" />

      <div className="relative z-20 mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-[1600px] flex-col gap-4 p-4">
        <header className="flex-none rounded-lg border border-white/10 bg-black/70 p-4 backdrop-blur-md shadow-[0_0_15px_rgba(166,13,242,0.2)]">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded border border-purple-400/50 bg-purple-500/10">
                <BookOpen className="h-6 w-6 text-purple-300" />
              </div>
              <div className="min-w-0">
                <h1 className={`${orbitron.className} truncate text-lg font-bold uppercase tracking-[0.16em] md:text-xl`}>{topic.name}</h1>
                <span className="text-xs uppercase tracking-[0.3em] text-cyan-300">Mission 04: Component Composition</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-start gap-4 lg:justify-end lg:gap-6">
              <div className="hidden md:flex flex-col items-end border-r border-white/10 pr-4 lg:pr-6">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">System Time</span>
                <span className="text-xl font-mono text-cyan-300 font-bold tracking-widest drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">
                  {systemTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-white">Hunter Rank</span>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-400 font-mono uppercase">Online</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full border-2 border-purple-400 p-0.5 ml-2 breathing-purple">
                  {user ? (
                    <img
                      src={avatarSrc}
                      alt={user.full_name || 'Hunter'}
                      className="h-full w-full rounded-full object-cover"
                      onError={() => setAvatarSrc(generateHunterAvatarUrl(`${user.id}-${user.full_name || user.email || 'hunter'}`))}
                    />
                  ) : (
                    <div className="h-full w-full rounded-full bg-white/10" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="col-span-12 lg:col-span-9 flex flex-col gap-4 h-full min-h-0">
            <div className="relative w-full overflow-hidden rounded-lg border border-purple-400/40 shadow-[0_0_20px_rgba(166,13,242,0.25)] hud-border">
              <div className="absolute inset-0 border border-purple-400/20 animate-pulse pointer-events-none z-10 rounded-lg" />
              <div className="relative z-0">
                <div className="relative aspect-video w-full bg-black">
                  <iframe
                    src={getYouTubeEmbedUrl(topic.video_url)}
                    className="absolute inset-0 h-full w-full opacity-90"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`${topic.name} video`}
                  />
                  {!watched && (
                    <button
                      className="absolute left-1/2 top-1/2 z-30 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-purple-400 bg-purple-500/20 backdrop-blur-sm transition-transform shadow-[0_0_15px_rgba(166,13,242,0.5)] hover:scale-110"
                      onClick={handleMarkAsWatched}
                    >
                      <Play className="h-9 w-9 text-white" />
                    </button>
                  )}
                  <div className="absolute top-4 left-4 z-30 flex gap-2">
                    <span className="bg-red-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-md">Live Feed</span>
                    <span className="bg-black/60 border border-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-md">
                      1.2k
                    </span>
                  </div>
                  {watched && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 text-green-300 bg-green-500/10 border border-green-400/30 px-3 py-1 rounded-full">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]">Watched</span>
                    </div>
                  )}
                </div>
                <div className="flex h-14 items-center gap-4 border-t border-white/10 bg-black/70 px-4 backdrop-blur-md">
                  <span className="text-xs font-mono text-cyan-300">04:20</span>
                  <div className="relative h-1 flex-1 rounded-full bg-white/10">
                    <div className="absolute left-0 top-0 h-full w-[35%] rounded-full bg-gradient-to-r from-purple-500 to-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
                  </div>
                  <span className="text-xs font-mono text-gray-500">12:45</span>
                </div>
              </div>
            </div>

            <div className="min-h-[11rem] bg-black/60 border border-white/10 rounded-lg p-6 flex flex-col relative overflow-hidden clip-path-slant">
              <div className="absolute inset-0 border border-purple-400/10 animate-pulse pointer-events-none rounded-lg" />
              <h2 className={`${orbitron.className} text-2xl font-bold text-white mb-2 flex items-center gap-2 text-glow`}>
                <span className="w-1 h-6 bg-cyan-300 rounded-sm" />
                Mission Briefing
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed max-w-4xl pr-1">
                {topic.overview || topic.description || 'Study the mission dossier and prepare for the trials ahead.'}
              </p>
              <div className="mt-auto pt-4 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded border border-white/5">
                  <Star className="h-3 w-3 text-purple-300" />
                  Difficulty: <span className="text-white font-bold">A-Rank</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded border border-white/5">
                  <Clock className="h-3 w-3 text-cyan-300" />
                  Est. Time: <span className="text-white font-bold">45m</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!watched ? (
                <Button onClick={handleMarkAsWatched} className="btn-hunter border border-cyan-400/40 bg-white/10 text-white">
                  <CheckCircle className="mr-2 h-4 w-4" /> Mark as Watched
                </Button>
              ) : (
                <Button onClick={() => router.push(`/topic/${topic.id}/quiz`)} className="btn-hunter border border-purple-400/40 bg-white/10 text-white">
                  Begin Trial
                </Button>
              )}
              <Button variant="outline" onClick={handleShowOverview} className="border-white/20 text-white">
                <Sparkles className="mr-2 h-4 w-4" /> {showOverview ? 'Hide Intel' : 'Intel File'}
              </Button>
              <Button variant="ghost" onClick={() => router.push('/my-courses')} className="text-gray-400 hover:text-white">
                Back to Gates
              </Button>
            </div>

            {showOverview && (
              <div className="rounded-lg border border-white/10 bg-black/60 p-6 relative overflow-hidden terminal-scroll max-h-[400px]">
                <div className="absolute inset-0 border border-cyan-400/10 animate-pulse pointer-events-none rounded-lg" />
                {enhancing ? (
                  <div className="flex items-center gap-3 justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-300" />
                    <span className="text-gray-400">Generating intel with AI...</span>
                  </div>
                ) : enhancedOverview ? (
                  <div className="space-y-2">
                    <h3 className={`${orbitron.className} text-lg font-semibold text-white text-glow`}>AI-Enhanced Intel</h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-gray-200">
                      {enhancedOverview}
                    </div>
                  </div>
                ) : topic?.overview ? (
                  <div className="space-y-2">
                    <h3 className={`${orbitron.className} text-lg font-semibold text-white text-glow`}>Mission Intel</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{topic.overview}</p>
                  </div>
                ) : (
                  <p className="text-gray-400">No intel available for this mission.</p>
                )}
              </div>
            )}
          </section>

          <aside className="col-span-12 lg:col-span-3 flex flex-col gap-6 h-full min-h-0 terminal-scroll lg:overflow-y-auto lg:pr-1">
            <div className="bg-black/60 border border-white/10 rounded-lg overflow-hidden relative">
              <div className="absolute inset-0 border border-cyan-400/10 animate-pulse pointer-events-none rounded-lg" />
              <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <h3 className={`${orbitron.className} text-sm font-bold uppercase tracking-widest text-glow`}>Quest Progression</h3>
                <span className="text-xs font-mono text-cyan-300 text-glow">{progressPercent}% COMPLETE</span>
              </div>
              <div className="p-4 space-y-6 relative">
                <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-white/10" />
                <div className="relative">
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-black border-2 border-cyan-300 flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.5)]">
                      <div className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse" />
                    </div>
                    <div className="flex-1 cyan-aura bg-cyan-900/10 border border-cyan-500/30 p-3 rounded clip-corner-sm">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-cyan-300 uppercase tracking-wide">01. Intel Acquisition</h4>
                        <Play className="h-4 w-4 text-cyan-300" />
                      </div>
                      <p className="text-xs text-gray-400">Watch the briefing video to unlock gate access.</p>
                      <div className="mt-2 text-[10px] text-cyan-300 font-mono">{watched ? '>> CLEARED' : '>> IN PROGRESS'}</div>
                    </div>
                  </div>
                </div>
                <div className="relative opacity-60">
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-black border-2 border-gray-600 flex items-center justify-center">
                      <span className="text-[10px] text-gray-500 font-bold">2</span>
                    </div>
                    <div className="flex-1 bg-black border border-white/10 p-3 rounded clip-corner-sm">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">02. The Trial</h4>
                        <Zap className="h-4 w-4 text-gray-500" />
                      </div>
                      <p className="text-xs text-gray-600">Complete the knowledge check quiz.</p>
                      <div className="mt-2 text-[10px] text-gray-600 font-mono flex items-center gap-1">
                        <Lock className="h-3 w-3" /> {watched ? (quizPassed ? 'CLEARED' : 'AVAILABLE') : 'LOCKED'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative opacity-60">
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-black border-2 border-gray-600 flex items-center justify-center">
                      <span className="text-[10px] text-gray-500 font-bold">3</span>
                    </div>
                    <div className="flex-1 bg-black border border-white/10 p-3 rounded clip-corner-sm">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">03. Extraction</h4>
                        <Code className="h-4 w-4 text-gray-500" />
                      </div>
                      <p className="text-xs text-gray-600">Submit your code solution to pass the gate.</p>
                      <div className="mt-2 text-[10px] text-gray-600 font-mono flex items-center gap-1">
                        <Lock className="h-3 w-3" /> {quizPassed ? 'READY' : 'LOCKED'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
