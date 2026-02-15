'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Orbitron, Rajdhani } from 'next/font/google';
import { getAllCourses, registerForCourse, unregisterFromCourse, getUserCourses } from '@/lib/courses';
import { generateHunterAvatarUrl, getCurrentUser } from '@/lib/auth';
import { getHunterRankByPoints } from '@/lib/hunter-rank';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Radar,
  Swords,
  ChevronRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'] });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function CoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [userCourseIds, setUserCourseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRank, setFilterRank] = useState<'all' | 'S' | 'A' | 'B' | 'C' | 'E'>('all');
  const [sortMode, setSortMode] = useState<'threat' | 'reward' | 'name'>('threat');
  const [avatarSrc, setAvatarSrc] = useState<string>('');

  const hunterRank = useMemo(() => {
    return getHunterRankByPoints(Number(user?.total_points || 0)).label;
  }, [user]);

  const rankConfig = (course: any) => {
    const reward = Number(course.completion_reward_points || 0);
    if (reward >= 700) {
      return { label: 'S-RANK GATE', tint: 'text-amber-300', border: 'border-amber-400/70', glow: 'shadow-[0_0_18px_rgba(251,191,36,0.35)]', chip: 'bg-amber-400 text-black', tag: 'RED GATE' };
    }
    if (reward >= 600) {
      return { label: 'A-RANK GATE', tint: 'text-orange-300', border: 'border-orange-500/70', glow: 'shadow-[0_0_18px_rgba(249,115,22,0.35)]', chip: 'bg-orange-500 text-black', tag: 'BOSS RAID' };
    }
    if (reward >= 500) {
      return { label: 'B-RANK GATE', tint: 'text-purple-300', border: 'border-purple-500/70', glow: 'shadow-[0_0_18px_rgba(168,85,247,0.35)]', chip: 'bg-purple-500 text-white', tag: 'MAGIC CLASS' };
    }
    if (reward >= 400) {
      return { label: 'C-RANK GATE', tint: 'text-sky-300', border: 'border-sky-400/70', glow: 'shadow-[0_0_18px_rgba(56,189,248,0.35)]', chip: 'bg-sky-500 text-white', tag: 'DUNGEON' };
    }
    return { label: 'E-RANK GATE', tint: 'text-emerald-300', border: 'border-emerald-400/70', glow: 'shadow-[0_0_18px_rgba(52,211,153,0.35)]', chip: 'bg-emerald-400 text-black', tag: 'TUTORIAL' };
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setAvatarSrc(
      currentUser
        ? currentUser.avatar_url || generateHunterAvatarUrl(`${currentUser.id}-${currentUser.full_name || currentUser.email || 'hunter'}`)
        : ''
    );

    const allCourses = await getAllCourses();
    setCourses(allCourses);

    if (currentUser) {
      const userCourses = await getUserCourses(currentUser.id);
      setUserCourseIds(new Set(userCourses.map((uc: any) => uc.course_id)));
    }

    setLoading(false);
  };

  const handleRegister = async (courseId: string, courseName: string) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { error } = await registerForCourse(user.id, courseId);
    
    if (error) {
      toast.error('Failed to register for course');
      return;
    }

    toast.success(`Registered for "${courseName}"!`);
    loadData();
  };

  const handleUnregister = async (courseId: string, courseName: string) => {
    if (!user) return;

    const { error } = await unregisterFromCourse(user.id, courseId);
    
    if (error) {
      toast.error('Failed to unregister from course');
      return;
    }

    toast.success(`Unregistered from "${courseName}"`);
    loadData();
  };

  const filteredCourses = courses
    .filter((course) =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((course) => {
      if (filterRank === 'all') return true;
      const label = rankConfig(course).label;
      return label.startsWith(`${filterRank}-RANK`);
    })
    .sort((a, b) => {
      if (sortMode === 'name') return a.name.localeCompare(b.name);
      if (sortMode === 'reward') return (b.completion_reward_points || 0) - (a.completion_reward_points || 0);
      const rankOrder = ['S', 'A', 'B', 'C', 'E'];
      const aRank = rankConfig(a).label[0];
      const bRank = rankConfig(b).label[0];
      return rankOrder.indexOf(aRank) - rankOrder.indexOf(bRank);
    });

  if (loading) {
    return (
      <div className="container py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-64 bg-muted rounded" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${rajdhani.className} relative min-h-screen overflow-hidden text-white`}>
      <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-5" />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#a60df2 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="particle h-32 w-32 left-[10%] top-[80%]" style={{ animationDelay: '0s' }} />
        <div className="particle h-20 w-20 left-[80%] top-[20%]" style={{ animationDelay: '2s', background: 'radial-gradient(circle, rgba(41,98,255,0.6) 0%, rgba(0,0,0,0) 70%)' }} />
        <div className="particle h-40 w-40 left-[40%] top-[50%]" style={{ animationDelay: '5s', background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, rgba(0,0,0,0) 70%)' }} />
      </div>

      <div className="relative z-20 mx-auto flex h-[calc(100vh-80px)] max-w-[1600px] flex-col gap-4 p-4">
        <header className="flex-none rounded-lg border border-white/10 bg-black/70 p-4 backdrop-blur-md shadow-[4px_4px_0_rgba(15,23,42,0.3)]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded border border-purple-400/50 bg-purple-500/10">
                  <Sparkles className="h-6 w-6 text-purple-300" />
                </div>
                <div>
                  <h1 className={`${orbitron.className} text-xl font-bold uppercase tracking-[0.2em]`}>Raid Gates</h1>
                  <span className="text-xs uppercase tracking-[0.3em] text-purple-300">System Gate Discovery</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right lg:ml-auto">
                <div className="hidden lg:block">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Hunter Rank</p>
                  <p className={`${orbitron.className} text-lg font-semibold`}>{hunterRank}</p>
                </div>
                <div className="h-11 w-11 overflow-hidden rounded-full border-2 border-white/20 bg-white/10 flex-shrink-0">
                  {user ? (
                    <img
                      src={avatarSrc}
                      alt={user.full_name || 'Hunter'}
                      className="h-full w-full object-cover"
                      onError={() =>
                        setAvatarSrc(generateHunterAvatarUrl(`${user.id}-${user.full_name || user.email || 'hunter'}`))
                      }
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">LVL</div>
                  )}
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 -skew-x-6 rounded border border-purple-400/30 bg-purple-500/10 transition-all" />
              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-3 px-4 py-2">
                <Radar className="h-4 w-4 text-purple-300 animate-pulse flex-shrink-0" />
                <Input
                  placeholder="Scanning for dungeon gates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-none bg-transparent font-mono text-xs uppercase tracking-[0.2em] text-white placeholder:text-gray-400 focus-visible:ring-0 flex-1 min-w-0"
                />
                <div className="flex gap-2 text-[10px] uppercase tracking-[0.2em] text-purple-300 flex-shrink-0">
                  <label className="border border-purple-400/30 bg-purple-500/10 px-2 py-1 whitespace-nowrap">
                    <span className="mr-1">Filter</span>
                    <select
                      value={filterRank}
                      onChange={(e) => setFilterRank(e.target.value as typeof filterRank)}
                      className="bg-transparent text-purple-200 focus:outline-none"
                    >
                      <option value="all">All</option>
                      <option value="S">S</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="E">E</option>
                    </select>
                  </label>
                  <label className="border border-purple-400/30 bg-purple-500/10 px-2 py-1 whitespace-nowrap">
                    <span className="mr-1">Sort</span>
                    <select
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
                      className="bg-transparent text-purple-200 focus:outline-none"
                    >
                      <option value="threat">Threat</option>
                      <option value="reward">Reward</option>
                      <option value="name">Name</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pr-2 pb-2">
          {filteredCourses.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-black/60 p-12 text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-purple-300" />
              <h3 className={`${orbitron.className} mt-4 text-xl uppercase tracking-[0.2em]`}>No gates detected</h3>
              <p className="mt-2 text-sm text-gray-400">
                {searchQuery ? 'Try refining your scan parameters.' : 'New gates will open soon.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 p-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredCourses.map((course) => {
                const isRegistered = userCourseIds.has(course.id);
                const rank = rankConfig(course);

                return (
                  <div
                    key={course.id}
                    className={`gate-card relative flex h-[420px] flex-col overflow-hidden rounded-lg border-2 ${rank.border} ${rank.glow} bg-black/60`}
                  >
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/5 to-transparent" />
                    <div className={`relative h-48 overflow-hidden border-b ${rank.border}`}>
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                          <Sparkles className={`h-10 w-10 ${rank.tint}`} />
                        </div>
                      )}
                      <div className={`absolute right-0 top-0 ${rank.chip} px-3 py-1 text-xs font-black`}>{rank.label}</div>
                      <div className={`absolute bottom-2 left-2 rounded border ${rank.border} bg-black/70 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.2em] ${rank.tint}`}>
                        {rank.tag}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`${orbitron.className} text-lg font-bold text-white`}>{course.name}</h3>
                        <Badge className={`border ${rank.border} bg-white/5 text-[10px] font-mono ${rank.tint}`}>
                          LVL {Math.max(1, Math.floor((course.completion_reward_points || 100) / 10))}+
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-2">{course.description}</p>
                      <div className="mt-auto space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded border border-white/10 bg-white/5 p-2">
                            <div className="text-[9px] uppercase text-gray-500 font-bold">Reward</div>
                            <div className={`${rank.tint} font-bold`}>+{course.completion_reward_points || 0} XP</div>
                          </div>
                          <div className="rounded border border-white/10 bg-white/5 p-2">
                            <div className="text-[9px] uppercase text-gray-500 font-bold">Duration</div>
                            <div className="text-white font-bold">{course.module_count || 0} Modules</div>
                          </div>
                        </div>
                        {isRegistered ? (
                          <div className="flex gap-2">
                            <Button
                              className={`w-full clip-corner border ${rank.border} bg-white/5 text-xs uppercase tracking-[0.2em] ${rank.tint} hover:bg-white/10`}
                              onClick={() => router.push('/my-courses')}
                            >
                              Buy Gate <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              className="border-white/20 text-xs uppercase tracking-[0.2em]"
                              onClick={() => handleUnregister(course.id, course.name)}
                            >
                              Withdraw
                            </Button>
                          </div>
                        ) : (
                          <Button
                            className={`w-full clip-corner border ${rank.border} bg-white/5 text-xs uppercase tracking-[0.2em] ${rank.tint} hover:bg-white/10`}
                            onClick={() => handleRegister(course.id, course.name)}
                          >
                            Enter Gate <Swords className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


