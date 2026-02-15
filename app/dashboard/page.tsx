'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateHunterAvatarUrl, getCurrentUser } from '@/lib/auth';
import { getHunterRankByPoints } from '@/lib/hunter-rank';
import { getUserCoursesWithProgress } from '@/lib/courses';
import { getTopLeaderboard } from '@/lib/leaderboard';
import { getQuestProgress, getRecentPointEvents, getGamificationOverview, type QuestProgress, type GamificationOverview } from '@/lib/gamification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Settings,
  Shield,
  Swords,
  Trophy,
  Package,
  Bell,
  Flame,
  ChevronRight,
  BookOpen,
  Clock3,
} from 'lucide-react';
import { Orbitron, Space_Grotesk } from 'next/font/google';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'] });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [dailyQuests, setDailyQuests] = useState<QuestProgress[]>([]);
  const [recentPoints, setRecentPoints] = useState<any[]>([]);
  const [gamificationOverview, setGamificationOverview] = useState<GamificationOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('📊 Dashboard: Loading data...');
      const currentUser = await getCurrentUser();
      console.log('📊 Dashboard: Current user:', currentUser ? 'Found' : 'Not found');
      
      if (!currentUser) {
        console.log('📊 Dashboard: No user found, redirecting to login');
        setLoading(false);
        router.push('/auth/login');
        return;
      }

      setUser(currentUser);
      console.log('📊 Dashboard: User data:', {
        id: currentUser.id,
        problems_solved: currentUser.problems_solved,
        total_points: currentUser.total_points,
        rank: currentUser.rank,
        xp: currentUser.xp,
        level: currentUser.level
      });

      const [userCourses, topUsers, overview] = await Promise.all([
        getUserCoursesWithProgress(currentUser.id),
        getTopLeaderboard(5),
        getGamificationOverview(currentUser.id).catch((err) => {
          console.error('📊 Dashboard: Error fetching gamification overview:', err);
          return null;
        }),
      ]);

      console.log('📊 Dashboard: Gamification overview:', overview);
      console.log('📊 Dashboard: User courses:', userCourses?.length || 0);

      let questRows: QuestProgress[] = [];
      let pointRows: any[] = [];
      try {
        [questRows, pointRows] = await Promise.all([
          getQuestProgress(currentUser.id, 'daily'),
          getRecentPointEvents(currentUser.id, 5),
        ]);
      } catch {
        questRows = [];
        pointRows = [];
      }

      setCourses(userCourses);
      setLeaderboard(topUsers);
      setGamificationOverview(overview);
      setDailyQuests(questRows);
      setRecentPoints(pointRows);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (course: any) => {
    if (!course.modules || course.modules.length === 0) return 0;
    
    const totalTopics = course.modules.reduce((acc: number, module: any) => 
      acc + (module.topics?.length || 0), 0
    );
    
    if (totalTopics === 0) return 0;
    
    const completedTopics = course.modules.reduce((acc: number, module: any) => 
      acc + (module.topics?.filter((t: any) => t.is_completed)?.length || 0), 0
    );
    
    return Math.round((completedTopics / totalTopics) * 100);
  };

  if (loading) {
    return (
      <div className={`${spaceGrotesk.className} min-h-screen bg-[#09090B] p-8`}>
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-80 rounded bg-white/10" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded bg-white/10" />
            ))}
          </div>
          <div className="h-72 rounded bg-white/10" />
        </div>
      </div>
    );
  }

  const inProgressCourses = courses.filter(c => {
    const progress = calculateProgress(c);
    return progress > 0 && progress < 100;
  });

  const solvedProblems = Number(gamificationOverview?.problems_solved ?? user?.problems_solved ?? 0);
  const manaCrystals = Number(gamificationOverview?.total_points ?? user?.total_points ?? 0);
  const userRank = gamificationOverview?.rank ?? user?.rank ?? null;
  const displayName = user?.full_name || 'Hunter';
  const avatarSeed = `${user?.id || 'hunter'}-${displayName}`;
  const avatarSrc = user?.avatar_url || generateHunterAvatarUrl(avatarSeed);
  const streakDays = Math.max(
    1,
    Math.min(
      365,
      Number(
        gamificationOverview?.current_streak ||
          (user as any)?.streak_days ||
          0
      )
    )
  );
  const questCompletion = dailyQuests.length > 0
    ? Math.round((dailyQuests.filter((q) => q.progress >= q.target_count).length / dailyQuests.length) * 100)
    : 0;

  const activeQuests = dailyQuests.slice(0, 4).map((quest, index) => {
    const progress = quest.target_count > 0 ? Math.min(100, Math.round((quest.progress / quest.target_count) * 100)) : 0;
    const tags = ['S', 'A', 'B', 'E'];
    const colors = ['border-l-[#7C3AED] text-[#A855F7]', 'border-l-yellow-500 text-yellow-500', 'border-l-cyan-500 text-cyan-400', 'border-l-slate-500 text-slate-400'];
    return {
      id: quest.quest_id,
      title: quest.title,
      description: quest.description || 'Complete this mission to unlock rewards.',
      progress,
      rank: quest.completed ? 'CLEARED' : (tags[index] || 'A'),
      color: colors[index] || colors[1],
    };
  });

  const manaGoalUnits = 10;
  const manaUnitsDone = Math.min(manaGoalUnits, Math.max(0, Math.round((questCompletion / 100) * manaGoalUnits)));
  const hunterRank = getHunterRankByPoints(manaCrystals);
  const currentCourses = courses
    .map((course) => {
      const progress = calculateProgress(course);
      return {
        id: course.id,
        name: course.name,
        progress,
        modulesCount: Array.isArray(course.modules) ? course.modules.length : 0,
        isCompleted: progress >= 100,
      };
    })
    .sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return b.progress - a.progress;
    })
    .slice(0, 6);

  return (
    <div className={`${spaceGrotesk.className} min-h-screen bg-[#09090B] text-slate-200 flex overflow-hidden`}>
      

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#7C3AED]/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#A855F7]/10 rounded-full blur-[100px] pointer-events-none"></div>

        <header className="bg-[#09090B]/80 backdrop-blur-xl border-b border-white/5 z-10 sticky top-0">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded bg-slate-800 overflow-hidden border-2 border-[#7C3AED]/50 breathing-purple">
                    <img
                      alt="Hunter Avatar"
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                      src={avatarSrc}
                      onError={(event) => {
                        event.currentTarget.src = generateHunterAvatarUrl(avatarSeed);
                      }}
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-[#7C3AED] text-[10px] font-black px-2 py-0.5 rounded border border-[#A855F7] text-white">{hunterRank.label}</div>
                </div>
                <div>
                  <h1 className={`text-2xl font-bold text-white leading-none tracking-tight uppercase ${orbitron.className} text-glow`}>{displayName}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#A855F7]">Shadow Monarch</span>
                    <span className="text-xs text-slate-600">/</span>
                    <span className="text-xs text-slate-500 font-mono">SYSTEM_ID: {String(user?.id || '0001').slice(0, 10)}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 max-w-xl w-full">
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Level</span>
                    <span className={`text-2xl font-black text-white italic ${orbitron.className} text-glow`}>{Math.max(1, Math.floor(manaCrystals / 1000) + 1)}</span>
                  </div>
                  <span className="text-xs font-bold text-[#A855F7] tracking-widest uppercase">{manaCrystals.toLocaleString()} / 100,000 XP</span>
                </div>
                <div className="h-3 w-full bg-white/5 rounded-sm overflow-hidden relative border border-white/10">
                  <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#7C3AED] via-[#A855F7] to-blue-500 shadow-[0_0_15px_#7C3AED]" style={{ width: `${Math.min(100, (manaCrystals / 100000) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 terminal-scroll">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#121214] border border-[#A855F7]/30 p-6 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-black text-white ${orbitron.className} text-glow`}>{solvedProblems.toLocaleString()}</span>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mt-2 font-bold">Monsters Slain</span>
                </div>
                
                <div className="bg-[#121214] border border-[#A855F7]/30 p-6 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-black text-[#A855F7] italic ${orbitron.className} text-glow`}>{hunterRank.label[0]}</span>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mt-2 font-bold">Clearance Rank</span>
                </div>

                <div className="bg-[#121214] border border-[#A855F7]/30 p-6 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-black text-white ${orbitron.className} text-glow`}>#{userRank || '—'}</span>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mt-2 font-bold">Global Rank</span>
                </div>
              </div>



              <div className="bg-[#121214] border border-[#A855F7]/20 rounded-md p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className={`text-lg font-black text-white uppercase tracking-widest ${orbitron.className}`}>
                    Current Courses
                  </h2>
                  <Link href="/my-courses" className="text-xs font-bold text-[#A855F7] hover:text-white transition-colors inline-flex items-center gap-1">
                    MANAGE <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>

                {currentCourses.length === 0 ? (
                  <div className="rounded border border-white/10 bg-black/20 px-4 py-6 text-sm text-slate-400">
                    No active courses detected yet. Enroll in a gate to start progression.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentCourses.map((course) => (
                      <div key={course.id} className="rounded border border-white/10 bg-black/20 px-4 py-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{course.name}</p>
                            <p className="text-[11px] text-slate-500">{course.modulesCount} modules</p>
                          </div>
                          <span className="text-xs font-bold text-[#A855F7]">{course.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded bg-white/10">
                          <div className="h-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7]" style={{ width: `${course.progress}%` }} />
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider">
                            <Clock3 className="h-3 w-3" />
                            {course.isCompleted ? 'Completed' : 'In Progress'}
                          </span>
                          <Button asChild size="sm" variant="outline" className="h-7 border-[#A855F7]/30 text-[#A855F7] hover:text-white hover:bg-[#7C3AED]/20">
                            <Link href="/my-courses">Continue</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#121214] p-8 rounded border border-[#A855F7]/30 relative overflow-hidden flex flex-col items-center text-center shadow-[0_0_10px_rgba(124,58,237,0.22)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#A855F7] to-transparent"></div>
                <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#A855F7]/30 rounded-full blur-2xl animate-pulse"></div>
                  <Flame className="h-16 w-16 text-[#A855F7] relative z-10" />
                </div>
                <h2 className={`text-6xl font-black text-white mb-2 italic ${orbitron.className} text-glow`}>{streakDays}</h2>
                <p className="text-[#A855F7] uppercase tracking-[0.4em] text-xs font-black mb-6">Consecutive Days</p>
                <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">"You've grown stronger. Do not stop now, Hunter."</p>
                <div className="w-full bg-white/5 h-3 p-0.5 border border-white/10">
                  <div className="bg-gradient-to-r from-[#7C3AED] to-[#A855F7] h-full w-full shadow-[0_0_15px_#A855F7]"></div>
                </div>
              </div>

              <div className="bg-[#121214] border border-[#A855F7]/30 rounded p-6">
                <h2 className={`text-lg font-black text-white uppercase tracking-widest mb-4 ${orbitron.className}`}>
                  Recent XP Logs
                </h2>
                <div className="space-y-3">
                  {recentPoints.length === 0 ? (
                    <p className="text-sm text-slate-500">No point activity yet.</p>
                  ) : (
                    recentPoints.map((event: any) => (
                      <div key={event.id} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-b-0">
                        <div>
                          <p className="text-sm font-medium text-white">{event.event_type.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#A855F7]">+{event.points} pts</p>
                          <p className="text-xs text-slate-500">+{event.xp} XP</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <footer className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 text-center pb-12">
            <p className={`text-slate-600 text-[10px] font-black tracking-[0.5em] uppercase ${orbitron.className} text-glow`}>
              Solo Leveling System // Protocol v4.2.0 // Monarch Consciousness Online
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
