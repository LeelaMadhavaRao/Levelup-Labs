'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Orbitron, Rajdhani } from 'next/font/google';
import { getCurrentUser } from '@/lib/auth';
import { getUserCoursesWithProgress } from '@/lib/courses';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Check,
  Circle,
  Code2,
  Cpu,
  Flame,
  Lock,
  PlusCircle,
  Rocket,
  Scan,
  SearchCode,
  Settings2,
  ShieldCheck,
  Sparkles,
  Swords,
  Trash2,
} from 'lucide-react';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'] });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function MyCoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
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
    const userCourses = await getUserCoursesWithProgress(currentUser.id);
    setCourses(userCourses);
    setSelectedCourseId(userCourses[0]?.id || null);
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
    
    return (completedTopics / totalTopics) * 100;
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-64 rounded bg-muted" />
          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            <div className="h-[560px] rounded bg-muted" />
            <div className="h-[560px] rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || courses[0] || null;
  const selectedProgress = selectedCourse ? calculateProgress(selectedCourse) : 0;

  const gateRank = (course: any) => {
    const reward = Number(course?.completion_reward_xp ?? course?.completion_reward_points ?? 0);
    if (reward >= 700) return 'S-RANK';
    if (reward >= 600) return 'A-RANK';
    if (reward >= 500) return 'B-RANK';
    if (reward >= 400) return 'C-RANK';
    return 'E-RANK';
  };

  return (
    <div className={`${rajdhani.className} flex h-[calc(100vh-80px)] overflow-hidden bg-[#09090b] text-slate-300`}>
      <aside className="hidden w-80 flex-col border-r border-purple-500/20 bg-[#050507]/95 shadow-[5px_0_30px_rgba(0,0,0,0.5)] lg:flex">
        <div className="relative flex h-16 items-center bg-[#050507] px-6 after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-gradient-to-r after:from-transparent after:via-purple-600 after:to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-700 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider text-white">SYSTEM_CONSOLE</h1>
              <p className="font-mono text-[10px] uppercase text-purple-400/70">Shadow_Monarch_OS_v9.0</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <button
            onClick={() => router.push('/courses')}
            className="group relative w-full overflow-hidden rounded-lg border border-purple-500/50 bg-purple-500/5 text-purple-400 transition-all duration-300 hover:bg-purple-500/10"
          >
            <div className="absolute inset-0 w-1 bg-purple-500 opacity-10 transition-all duration-300 group-hover:w-full" />
            <div className="relative flex items-center justify-center gap-2 px-4 py-4">
              <PlusCircle className="h-5 w-5" />
              <span className="font-mono text-sm font-bold uppercase tracking-widest">View all Dungeons</span>
            </div>
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
          <div className="mb-2 flex items-center justify-between px-2 font-mono text-xs uppercase tracking-widest text-slate-500">
            <span>Active Dungeons</span>
            <span>Rank</span>
          </div>
          {courses.map((course, index) => {
            const active = selectedCourse?.id === course.id;
            const rank = gateRank(course);
            return (
              <button
                key={course.id}
                onClick={() => setSelectedCourseId(course.id)}
                className={`group w-full rounded border p-3 text-left transition-all ${
                  active
                    ? 'animate-aura border-purple-500 bg-purple-500/5 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'border-white/5 bg-[#121215] hover:border-purple-500/50 hover:bg-[#121215]/80'
                }`}
              >
                <div className="mb-1 flex items-start justify-between">
                  <h3 className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-300 group-hover:text-purple-400'}`}>
                    GATE: {course.name.toUpperCase()}
                  </h3>
                  <span className={`font-mono text-[10px] font-bold ${active ? 'text-purple-400' : 'text-slate-500'}`}>{rank}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="font-mono text-[10px] text-slate-500 group-hover:text-purple-400/70">ID: #SYS-0{index + 1}</span>
                  <span className="font-mono text-[10px] text-slate-500">{Math.max(1, course.module_count || 0)} Layers</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="border-t border-purple-500/10 bg-[#050507]/50 p-4">
          <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-slate-400">
            <div className="flex flex-col">
              <span className="uppercase tracking-widest text-purple-400/60">Mana Load</span>
              <span className="text-white">{Math.round(selectedProgress)}% <span className="text-purple-400">■■■□□□</span></span>
            </div>
            <div className="flex flex-col text-right">
              <span className="uppercase tracking-widest text-purple-400/60">Latency</span>
              <span className="text-white">12ms</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col overflow-hidden bg-[#09090b]">
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#7C3AED 1px, transparent 1px), linear-gradient(90deg, #7C3AED 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#09090B_120%)]" />

        <header className="relative z-10 flex h-16 items-center justify-between border-b border-purple-500/20 bg-[#121215]/90 px-6 md:px-8 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded border border-white/5 bg-[#050507] px-3 py-1.5 font-mono text-xs text-slate-400">
              <span className="text-purple-400">root</span>
              <span className="mx-2 text-slate-600">/</span>
              <span className="text-purple-400">gate_algorithms</span>
              <span className="mx-2 text-slate-600">/</span>
              <span className="text-white">config</span>
            </div>
            <span className="h-4 w-px bg-white/10" />
            <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-purple-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
              System Online
            </span>
          </div>
          
        </header>

        <div className="scanlines relative z-10 flex-1 overflow-y-auto p-4 md:p-8">
          {!selectedCourse ? (
            <div className="mx-auto max-w-3xl rounded-lg border border-white/10 bg-[#121215] p-10 text-center">
              <Swords className="mx-auto mb-4 h-10 w-10 text-purple-400" />
              <h3 className={`${orbitron.className} mb-2 text-2xl text-white`}>No Active Gate</h3>
              <p className="mb-6 text-slate-400">Open a gate to start your hunter mission.</p>
              <Button onClick={() => router.push('/courses')}>Open Gate</Button>
            </div>
          ) : (
            <div className="mx-auto grid max-w-7xl grid-cols-12 gap-8">
              <div className="col-span-12 space-y-6 lg:col-span-8">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className={`${orbitron.className} mb-1 text-3xl font-bold text-white`}>Gate Configuration</h2>
                    <p className="text-sm text-slate-400">Manage your gate parameters and monitor your progress.</p>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-lg border border-white/5 bg-[#121215] p-6 shadow-lg">
                  <div className="absolute left-0 top-0 h-full w-1 bg-purple-500 shadow-[0_0_10px_#A855F7]" />
                  <div className="mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                    <SearchCode className="h-4 w-4 text-purple-400" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white">Gate Parameters</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block font-mono text-xs uppercase text-purple-400">System_Name</label>
                      <input readOnly value={selectedCourse.name} className="w-full rounded border border-white/10 bg-[#09090b] px-4 py-2 font-mono text-sm text-white outline-none" />
                    </div>
                    <div>
                      <label className="mb-2 block font-mono text-xs uppercase text-purple-400">Protocol_ID</label>
                      <input readOnly value={`GATE_${selectedCourse.id.slice(0, 8).toUpperCase()}`} className="w-full cursor-not-allowed rounded border border-white/5 bg-[#09090b]/50 px-4 py-2 font-mono text-sm text-slate-400 outline-none" />
                    </div>
                    <div className="col-span-full">
                      <label className="mb-2 block font-mono text-xs uppercase text-purple-400">Mission_Description</label>
                      <textarea readOnly rows={2} value={selectedCourse.description || 'No mission description available.'} className="w-full resize-none rounded border border-white/10 bg-[#09090b] px-4 py-2 font-mono text-sm text-white outline-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Dungeon Layers (Modules)</h3>
                    
                  </div>

                  {selectedCourse.modules?.length ? (
                    selectedCourse.modules.map((module: any, moduleIndex: number) => (
                      <div
                        key={module.id}
                        className={`rounded-lg border p-1 ${moduleIndex === 0 ? 'border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-white/10'}`}
                      >
                        <div className="flex flex-col gap-4 rounded bg-[#09090b]/50 p-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded font-mono font-bold ${moduleIndex === 0 ? 'border border-purple-500 bg-purple-500/20 text-purple-300' : 'border border-slate-700 bg-slate-800/50 text-slate-500'}`}>
                              {String(moduleIndex + 1).padStart(2, '0')}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="mb-1 text-lg font-bold text-white">Module: {module.name}</h4>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="rounded border border-blue-500/40 bg-blue-900/30 px-2 py-0.5 font-mono text-[10px] uppercase text-blue-300">Logic_Gate</span>
                                <span className="rounded border border-purple-500/40 bg-purple-900/30 px-2 py-0.5 font-mono text-[10px] uppercase text-purple-300">Stable</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {module.topics?.length ? (
                              module.topics.map((topic: any) => (
                                <div key={topic.id} className="group flex flex-col gap-2 rounded border border-white/10 bg-[#09090b] p-3 hover:border-purple-500/40 sm:flex-row sm:items-center">
                                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${topic.is_completed ? 'bg-green-400' : 'bg-purple-400/60'} shadow-[0_0_5px_rgba(168,85,247,0.7)]`} />
                                  <div className="min-w-0 flex-1">
                                    <div className="break-words font-mono text-sm text-slate-300">Topic: {topic.name}</div>
                                    {topic.description && <div className="line-clamp-1 text-xs text-slate-500">{topic.description}</div>}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={topic.is_completed ? 'outline' : 'default'}
                                    onClick={() => router.push(`/topic/${topic.id}`)}
                                    className="w-full font-mono text-xs sm:w-auto"
                                  >
                                    {topic.is_completed ? 'Review' : topic.progress?.quiz_passed ? 'Boss Fight' : topic.progress?.video_watched ? 'Trial' : 'Start'}
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <div className="font-mono text-xs text-slate-500">No topics available.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-white/10 bg-[#121215] p-6 text-sm text-slate-500">No modules available yet.</div>
                  )}
                </div>
              </div>

              <div className="col-span-12 space-y-6 lg:col-span-4">
                <div className="rounded-lg border border-white/5 bg-[#121215] p-4 shadow-lg">
                  <h4 className="mb-4 font-mono text-xs uppercase tracking-widest text-slate-400">Topology_Map</h4>
                  <div className="relative aspect-square overflow-hidden rounded border border-white/5 bg-[#09090b]">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#7C3AED 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                    <div className="relative flex h-full items-center justify-center">
                      <div className="relative h-32 w-32">
                        <div className="absolute inset-0 animate-[spin_10s_linear_infinite] rounded-full border-2 border-purple-500 opacity-60 shadow-[0_0_15px_#A855F7]" />
                        <div className="absolute inset-4 animate-[spin_7s_linear_infinite_reverse] rounded-full border border-purple-500/50 shadow-[0_0_10px_#7C3AED]" />
                        <div className="absolute inset-[30%] flex items-center justify-center rounded-full border border-purple-500 bg-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.7)]">
                          <Cpu className="h-7 w-7 animate-pulse text-purple-400" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 animate-pulse font-mono text-[10px] text-purple-400">SYNCED</div>
                  </div>
                </div>

                


                <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4 text-xs text-slate-300">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                    <ShieldCheck className="h-4 w-4 text-purple-400" /> Hunter Snapshot
                  </div>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between"><span className="text-slate-500">Hunter</span><span>{user?.full_name || 'Unknown'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Active Gate</span><span>{selectedCourse.name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Gate Rank</span><span>{gateRank(selectedCourse)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Progress</span><span>{Math.round(selectedProgress)}%</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <footer className="mb-4 mt-12 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600">System Architect // Authorized Personnel Only</p>
          </footer>
        </div>
      </main>
    </div>
  );
}


