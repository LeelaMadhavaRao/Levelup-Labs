'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getCoursesByAdmin, deleteCourse } from '@/lib/courses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Users, BookOpen, Code, ChevronRight } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';

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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded bg-gray-200" />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalStudents = courses.reduce((acc, c) => acc + (c.student_count || 0), 0);
  const totalProblems = courses.reduce((acc, c) => acc + (c.problem_count || 0), 0);
  const topCourses = [...courses]
    .sort((a, b) => (b.student_count || 0) - (a.student_count || 0))
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="max-w-2xl text-sm text-gray-500">
            Manage courses, monitor enrollments, and publish content updates.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
            <span>{courses.length} courses</span>
            <span>·</span>
            <span>{totalStudents} enrolled students</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Button onClick={() => router.push('/admin/create-course')} className="bg-purple-600 text-white hover:bg-purple-500">
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
          <Button variant="outline" onClick={() => router.push('/admin/courses')} className="border-gray-200 text-gray-600 hover:bg-gray-100">
            View All Courses
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="border-gray-200 bg-white text-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-gray-400">Active courses</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white text-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Students</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-gray-400">Enrolled across all courses</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white text-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Problems</CardTitle>
            <Code className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProblems}</div>
            <p className="text-xs text-gray-400">Coding challenges deployed</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Top Courses */}
        <Card className="border-gray-200 bg-white text-gray-900 xl:col-span-2">
          <CardHeader>
            <CardTitle>Top Courses</CardTitle>
            <CardDescription className="text-gray-500">Highest enrollment across your courses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCourses.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                No courses yet. Create your first course to start tracking.
              </div>
            ) : (
              topCourses.map((course, index) => {
                const intensity = Math.max(12, Math.min(100, Math.round(((course.student_count || 0) / Math.max(1, totalStudents)) * 100)));
                return (
                  <div key={course.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">#{index + 1} {course.name}</p>
                        <p className="text-xs text-gray-400">{course.problem_count || 0} problems · {Number(course.completion_reward_xp ?? course.completion_reward_points ?? 0)} XP</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-600">
                        {course.student_count || 0} students
                      </span>
                    </div>
                    <Progress value={intensity} className="h-1.5 bg-gray-200 [&>div]:bg-purple-500" />
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:bg-gray-100" onClick={() => router.push(`/admin/courses/${course.id}/edit`)}>
                        <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete &quot;{course.name}&quot; and all its modules, topics, and problems.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(course.id, course.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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

        {/* Sidebar */}
        <Card className="border-gray-200 bg-white text-gray-900">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription className="text-gray-500">Overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs text-gray-400">Admin</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{user?.full_name || user?.email || 'System Admin'}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs text-gray-400">Avg Problems / Course</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{courses.length > 0 ? Math.round(totalProblems / courses.length) : 0}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs text-gray-400">Avg Students / Course</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{courses.length > 0 ? Math.round(totalStudents / courses.length) : 0}</p>
            </div>
            <Button onClick={() => router.push('/admin/courses')} className="w-full bg-purple-600 text-white hover:bg-purple-500">
              View All Courses
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* All Courses */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">All Courses</h2>

        {courses.length === 0 ? (
          <Card className="border-gray-200 bg-white text-gray-900">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold">No courses yet</h3>
              <p className="mb-6 text-center text-gray-500">Create your first course to start teaching</p>
              <Button onClick={() => router.push('/admin/create-course')} className="bg-purple-600 text-white hover:bg-purple-500">
                <Plus className="mr-2 h-4 w-4" /> Create Course
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden border-gray-200 bg-white text-gray-900">
                {course.thumbnail_url && (
                  <div className="aspect-video w-full overflow-hidden bg-gray-100">
                    <img
                      src={course.thumbnail_url}
                      alt={course.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-base">{course.name}</CardTitle>
                  <CardDescription className="line-clamp-2 text-gray-500">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Reward XP</span>
                    <span className="font-medium">{Number(course.completion_reward_xp ?? course.completion_reward_points ?? 0)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-100" onClick={() => router.push(`/admin/courses/${course.id}/edit`)}>
                      <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="flex-1">
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete &quot;{course.name}&quot; and all its modules, topics, and problems.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(course.id, course.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
  );
}

