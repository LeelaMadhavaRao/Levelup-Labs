'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateHunterAvatarUrl, getCurrentUser } from '@/lib/auth';
import { getHunterRankByPoints } from '@/lib/hunter-rank';
import { getUserCoursesWithProgress } from '@/lib/courses';
import { getTopLeaderboard } from '@/lib/leaderboard';
import { getGamificationOverview, getQuestProgress, getRecentPointEvents, type GamificationOverview, type QuestProgress } from '@/lib/gamification';
import { Button } from '@/components/ui/button';
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
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    setUser(currentUser);
    const [userCourses, topUsers, overview] = await Promise.all([
      getUserCoursesWithProgress(currentUser.id),
      getTopLeaderboard(5),
      getGamificationOverview(currentUser.id).catch(() => null),
    ]);

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
    setLoading(false);
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

  const solvedProblems = Number(user?.problems_solved || 0);
  const manaCrystals = Number(user?.total_points || 0);
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
  const hunterRank = getHunterRankByPoints(Number(user?.total_points || 0));
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
      <aside className="w-20 lg:w-64 bg-[#09090B] border-r border-white/5 flex flex-col justify-between shrink-0 z-20">
        <div>
          <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/5">
            <div className="w-10 h-10 rounded-sm bg-[#7C3AED] flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(124,58,237,0.5)] italic text-xl">S</div>
            <span className={`hidden lg:block ml-3 font-bold text-lg tracking-widest text-white uppercase ${orbitron.className} text-glow`}>System</span>
          </div>
          <nav className="mt-8 flex flex-col gap-2 px-2 lg:px-4">
            <button className="flex items-center gap-3 px-3 py-3 rounded bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30 shadow-[0_0_12px_rgba(124,58,237,0.45)]">
              <Shield className="h-4 w-4" />
              <span className="hidden lg:block font-medium tracking-wide">Status</span>
            </button>
            <Link href="/courses" className="flex items-center gap-3 px-3 py-3 rounded text-slate-500 hover:bg-white/5 hover:text-[#A855F7] transition-all">
              <Swords className="h-4 w-4" />
              <span className="hidden lg:block font-medium tracking-wide">Instant Dungeon</span>
            </Link>
            <Link href="/leaderboard" className="flex items-center gap-3 px-3 py-3 rounded text-slate-500 hover:bg-white/5 hover:text-[#A855F7] transition-all">
              <Trophy className="h-4 w-4" />
              <span className="hidden lg:block font-medium tracking-wide">Rankings</span>
            </Link>
            <Link href="/my-courses" className="flex items-center gap-3 px-3 py-3 rounded text-slate-500 hover:bg-white/5 hover:text-[#A855F7] transition-all">
              <Package className="h-4 w-4" />
              <span className="hidden lg:block font-medium tracking-wide">Inventory</span>
            </Link>
          </nav>
        </div>
        <div className="p-4 border-t border-white/5">
          <Link href="/profile/edit" className="flex items-center gap-3 px-3 py-3 rounded text-slate-500 hover:bg-white/5 transition-all">
            <Settings className="h-4 w-4" />
            <span className="hidden lg:block font-medium">Settings</span>
          </Link>
        </div>
      </aside>

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
                  <span className={`text-4xl font-black text-white ${orbitron.className} text-glow`}>{Math.round(manaCrystals / 1000)}k</span>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mt-2 font-bold">Mana Crystals</span>
                </div>
                <div className="bg-[#121214] border border-[#A855F7]/30 p-6 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-black text-[#A855F7] italic ${orbitron.className} text-glow`}>{hunterRank.label[0]}</span>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mt-2 font-bold">Clearance Rank</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-xl font-black text-white flex items-center gap-3 uppercase tracking-widest ${orbitron.className} text-glow`}>
                    <BookOpen className="h-5 w-5 text-[#A855F7]" />
                    Current Quests
                  </h2>
                  <Link href="/my-courses" className="text-xs font-bold text-[#A855F7] hover:text-white transition-colors border-b border-[#A855F7]/30 pb-1">VIEW ALL MISSIONS</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeQuests.length === 0 ? (
                    <div className="md:col-span-2 bg-[#121214] border border-white/10 p-5">
                      <p className="text-sm text-slate-400 mb-4">No daily/weekly missions available right now.</p>
                      <Button asChild className="bg-[#A855F7] hover:bg-[#7C3AED] text-white">
                        <Link href="/my-courses">Go to My Courses</Link>
                      </Button>
                    </div>
                  ) : (
                    activeQuests.map((quest) => (
                      <div key={quest.id} className={`bg-[#121214] border border-[#A855F7]/30 p-5 relative overflow-hidden border-l-4 ${quest.color.split(' ')[0]}`}>
                        <div className="absolute top-3 right-3">
                          <span className="bg-[#7C3AED]/20 text-[#A855F7] text-[10px] font-black px-2 py-1 border border-[#7C3AED]/30">RANK: {quest.rank}</span>
                        </div>
                        <h3 className={`font-bold text-lg text-white mb-2 uppercase ${orbitron.className}`}>{quest.title}</h3>
                        <p className="text-sm text-slate-400 mb-4 h-10 line-clamp-2 leading-relaxed">{quest.description}</p>
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-500 mb-2 uppercase tracking-tighter">
                          <span>Completion</span>
                          <span className="text-[#A855F7]">{quest.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 overflow-hidden border border-white/5">
                          <div className="h-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] shadow-[0_0_10px_#7C3AED]" style={{ width: `${quest.progress}%` }}></div>
                        </div>
                      </div>
                    ))
                  )}
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

              <div className="rounded overflow-hidden border border-[#7C3AED]/30 relative h-72 group">
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#7C3AED]/10 to-transparent z-10"></div>
                <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(124,58,237,0.4)] z-10 pointer-events-none"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.18),transparent_65%)]"></div>
                <div className="absolute bottom-6 left-6 z-20">
                  <span className="text-[10px] font-black text-[#A855F7] tracking-[0.4em] uppercase mb-1 block">Raid Zone</span>
                  <h3 className={`text-white font-black text-2xl uppercase italic ${orbitron.className} text-glow`}>The Eternal Slumber</h3>
                  <p className="text-[#A855F7] text-xs font-bold flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-[#A855F7] animate-ping"></span>
                    HIDDEN CLASS • LEGENDARY LOOT
                  </p>
                </div>
                <Link href="/courses" className="absolute bottom-6 right-6 z-20 bg-[#A855F7] text-white font-black px-8 py-3 rounded-sm shadow-[0_0_10px_rgba(168,85,247,0.28)] hover:bg-[#7C3AED] transition-all uppercase tracking-widest">ENTER RAID</Link>
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

              <div className="bg-[#121214] border border-white/5 rounded p-5">
                <h3 className={`font-black text-white mb-6 text-xs uppercase tracking-[0.3em] border-b border-white/5 pb-3 ${orbitron.className} text-glow`}>System Notifications</h3>
                <div className="space-y-5">
                  {(recentPoints.length > 0 ? recentPoints.slice(0, 3) : [{ id: 'default', event_type: 'Danger: Gate Detected', created_at: new Date().toISOString(), points: 0 }]).map((event: any, index: number) => (
                    <div key={event.id || index} className="flex gap-4 group">
                      <div className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 border ${index === 0 ? 'bg-red-600/10 text-red-500 border-red-600/20' : index === 1 ? 'bg-[#A855F7]/10 text-[#A855F7] border-[#A855F7]/20' : 'bg-blue-600/10 text-blue-400 border-blue-600/20'}`}>
                        <Bell className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-300 font-bold uppercase tracking-wide">{String(event.event_type || 'System Notice').replace(/_/g, ' ')}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{new Date(event.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#121214] border border-white/5 rounded p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`font-black text-white text-xs uppercase tracking-widest ${orbitron.className} text-glow`}>Daily Mana Goal</h3>
                  <span className="text-[10px] text-[#A855F7] font-black">{manaUnitsDone} / {manaGoalUnits}</span>
                </div>
                <div className="flex gap-1.5 h-10">
                  {Array.from({ length: manaGoalUnits }).map((_, index) => (
                    <div key={index} className={`flex-1 ${index < manaUnitsDone ? 'bg-[#A855F7] shadow-[0_0_12px_rgba(168,85,247,0.45)]' : 'bg-white/5 border border-white/10'}`}></div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-4 text-center font-bold tracking-widest uppercase italic">
                  {Math.max(0, manaGoalUnits - manaUnitsDone)} more units to unlock hidden reward
                </p>
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
