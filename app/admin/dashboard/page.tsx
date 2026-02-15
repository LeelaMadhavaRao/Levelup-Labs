'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getCoursesByAdmin, deleteCourse } from '@/lib/courses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Users, BookOpen, Code, Activity, Sparkles, Shield, Flame, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Orbitron, Rajdhani } from 'next/font/google';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'] });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/');
      return;
    }

    setUser(currentUser);
    const userCourses = await getCoursesByAdmin(currentUser.id);
    setCourses(userCourses);
    setLoading(false);
  };

  const handleDelete = async (courseId: string, courseName: string) => {
    const { error } = await deleteCourse(courseId);
    
    if (error) {
      toast.error('Failed to delete course');
      return;
    }

    toast.success(`Course "${courseName}" deleted successfully`);
    loadData();
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalStudents = courses.reduce((accumulator, course) => accumulator + (course.student_count || 0), 0);
  const totalProblems = courses.reduce((accumulator, course) => accumulator + (course.problem_count || 0), 0);
  const topCourses = [...courses]
    .sort((courseA, courseB) => (courseB.student_count || 0) - (courseA.student_count || 0))
    .slice(0, 4);

  return (
    <div className={`${rajdhani.className} relative min-h-screen overflow-hidden bg-[#09090B] text-slate-100`}>
      <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-10" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-purple-950/20 via-black to-cyan-950/20" />

      <div className="relative z-20 container py-8 space-y-8">
      <div className="rounded-2xl border border-purple-500/30 bg-black/50 p-6 shadow-[0_0_30px_rgba(124,58,237,0.2)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              <Shield className="h-3.5 w-3.5" />
              Admin Command Core
            </div>
            <h1 className={`${orbitron.className} text-3xl font-black tracking-wide md:text-4xl`}>MONARCH CONTROL PANEL</h1>
            <p className="max-w-2xl text-sm text-slate-400 md:text-base">
              Build and govern every gate curriculum, monitor active hunters, and dispatch content updates from one control surface.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
              <span className="inline-flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-emerald-400" /> System Online</span>
              <span className="inline-flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-purple-300" /> {courses.length} Active Gates</span>
              <span className="inline-flex items-center gap-2"><Flame className="h-3.5 w-3.5 text-orange-400" /> {totalStudents} Hunters Enrolled</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button size="lg" onClick={() => router.push('/admin/create-course')} className="bg-purple-700 hover:bg-purple-600 text-white">
              <Plus className="mr-2 h-5 w-5" />
              Forge New Course
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/admin/courses')} className="border-white/20 text-slate-200 hover:bg-white/10">
              View Full Registry
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card className="card-interactive border-white/15 bg-black/60 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-slate-400">Curriculum gates initialized</p>
          </CardContent>
        </Card>

        <Card className="card-interactive border-white/15 bg-black/60 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalStudents}
            </div>
            <p className="text-xs text-slate-400">Hunters linked to your gates</p>
          </CardContent>
        </Card>

        <Card className="card-interactive border-white/15 bg-black/60 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Problems</CardTitle>
            <Code className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalProblems}
            </div>
            <p className="text-xs text-slate-400">Boss trials deployed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="border-white/15 bg-black/60 text-slate-100 xl:col-span-2">
          <CardHeader>
            <CardTitle className={`${orbitron.className} text-lg`}>Top Performing Gates</CardTitle>
            <CardDescription className="text-slate-400">Highest enrollment and content traction across your registry</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCourses.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-black/40 p-6 text-sm text-slate-400">
                No gate telemetry yet. Create your first course to begin tracking performance.
              </div>
            ) : (
              topCourses.map((course, index) => {
                const intensity = Math.max(12, Math.min(100, Math.round(((course.student_count || 0) / Math.max(1, totalStudents)) * 100)));
                return (
                  <div key={course.id} className="rounded-lg border border-white/10 bg-black/40 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">#{index + 1} {course.name}</p>
                        <p className="text-[11px] text-slate-500">{course.problem_count || 0} challenges • {Number(course.completion_reward_xp ?? course.completion_reward_points ?? 0)} XP reward</p>
                      </div>
                      <span className="rounded border border-purple-500/40 bg-purple-500/15 px-2 py-1 text-[11px] font-semibold text-purple-300">{course.student_count || 0} Hunters</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded bg-white/10">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400" style={{ width: `${intensity}%` }} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" className="border-white/20 text-slate-200" onClick={() => router.push(`/admin/courses/${course.id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" />Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the course "{course.name}" and all its modules, topics, and problems. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(course.id, course.name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
        
        <Card className="border-white/15 bg-black/60 text-slate-100">
          <CardHeader>
            <CardTitle className={`${orbitron.className} text-lg`}>Command Snapshot</CardTitle>
            <CardDescription className="text-slate-400">Fast mission telemetry</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">Admin</p>
              <p className="mt-1 text-sm font-semibold text-white">{user?.full_name || user?.email || 'System Admin'}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">Average Problems per Course</p>
              <p className="mt-1 text-xl font-bold text-cyan-300">{courses.length > 0 ? Math.round(totalProblems / courses.length) : 0}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">Average Students per Course</p>
              <p className="mt-1 text-xl font-bold text-purple-300">{courses.length > 0 ? Math.round(totalStudents / courses.length) : 0}</p>
            </div>
            <Button onClick={() => router.push('/admin/courses')} className="w-full bg-purple-700 hover:bg-purple-600 text-white">
              Open Course Registry
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className={`${orbitron.className} text-xl font-bold`}>All Active Courses</h2>

        {courses.length === 0 ? (
          <Card className="card-interactive border-white/15 bg-black/60 text-slate-100">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
              <p className="text-slate-400 text-center mb-6">Create your first course to start teaching</p>
              <Button onClick={() => router.push('/admin/create-course')}>
                <Plus className="mr-2 h-4 w-4" />Create Course
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden card-interactive card-equal border-white/15 bg-black/60 text-slate-100">
                {course.thumbnail_url && (
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={course.thumbnail_url}
                      alt={course.name}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{course.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Reward XP</span>
                    <span className="font-semibold">{Number(course.completion_reward_xp ?? course.completion_reward_points ?? 0)}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-white/20 text-slate-200"
                      onClick={() => router.push(`/admin/courses/${course.id}/edit`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="flex-1">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the course "{course.name}" and all its
                            modules, topics, and problems. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(course.id, course.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

