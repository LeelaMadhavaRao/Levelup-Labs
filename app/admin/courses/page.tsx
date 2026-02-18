'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getAllCourses } from '@/lib/courses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Users,
  Trophy
} from 'lucide-react';
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
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { Orbitron, Rajdhani } from 'next/font/google';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'] });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function AdminCoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalEnrollments: 0,
    totalModules: 0,
    totalTopics: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [searchQuery, courses]);

  const loadData = async () => {
    const currentUser = await getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/');
      return;
    }

    setUser(currentUser);
    await fetchCourses();
    setLoading(false);
  };

  const fetchCourses = async () => {
    try {
      const coursesData = await getAllCourses();

      // Map to consistent field names
      const processedCourses = coursesData.map((course: any) => ({
        ...course,
        moduleCount: course.module_count || 0,
        topicCount: course.topic_count || 0,
        enrollmentCount: course.student_count || 0,
        problemCount: course.problem_count || 0,
      }));

      setCourses(processedCourses);
      setFilteredCourses(processedCourses);

      // Calculate overall stats
      const totalEnrollments = processedCourses.reduce((acc: number, c: any) => acc + c.enrollmentCount, 0);
      const totalModules = processedCourses.reduce((acc: number, c: any) => acc + c.moduleCount, 0);
      const totalTopics = processedCourses.reduce((acc: number, c: any) => acc + c.topicCount, 0);

      setStats({
        totalCourses: processedCourses.length,
        totalEnrollments,
        totalModules,
        totalTopics,
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    }
  };

  const filterCourses = () => {
    if (!searchQuery.trim()) {
      setFilteredCourses(courses);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = courses.filter(course =>
      course.name.toLowerCase().includes(query) ||
      course.description?.toLowerCase().includes(query)
    );
    setFilteredCourses(filtered);
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) {
        console.error('Delete error:', error);
        throw new Error(error.message || 'Failed to delete course');
      }

      toast.success('Course deleted successfully');
      await fetchCourses();
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast.error(error?.message || 'Failed to delete course');
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const averageEnrollments = stats.totalCourses > 0 ? Math.round(stats.totalEnrollments / stats.totalCourses) : 0;
  const averageModules = stats.totalCourses > 0 ? Math.round(stats.totalModules / stats.totalCourses) : 0;

  return (
    <div className={`${rajdhani.className} relative min-h-screen overflow-hidden bg-[#09090B] text-slate-100`}>
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-purple-950/20 via-black to-cyan-950/20" />

      <div className="relative z-20 container py-8 space-y-8">
      <div className="rounded-2xl border border-purple-500/30 bg-black/50 p-6 shadow-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className={`${orbitron.className} text-3xl font-black tracking-tight md:text-4xl`}>COURSE REGISTRY MATRIX</h1>
            <p className="mt-2 max-w-2xl text-slate-400">
              Search, inspect, and update all deployed gates from a single tactical registry.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild className="bg-purple-700 hover:bg-purple-600 text-white">
              <Link href="/admin/create-course">
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Link>
            </Button>

          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="card-interactive border-white/15 bg-black/60 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
          </CardContent>
        </Card>

        <Card className="card-interactive border-white/15 bg-black/60 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
          </CardContent>
        </Card>

        <Card className="card-interactive border-white/15 bg-black/60 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalModules}</div>
          </CardContent>
        </Card>

        <Card className="card-interactive border-white/15 bg-black/60 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Topics</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTopics}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-white/15 bg-black/60 text-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-400">Avg Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-300">{averageEnrollments}</div>
          </CardContent>
        </Card>
        <Card className="border-white/15 bg-black/60 text-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-400">Avg Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-300">{averageModules}</div>
          </CardContent>
        </Card>
        <Card className="border-white/15 bg-black/60 text-slate-100 xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-400">Registry Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300">
              {filteredCourses.length} visible gates from {stats.totalCourses} total. Use search to narrow mission catalogs by title or description.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-black/60 border-white/15 text-slate-100"
          />
        </div>
      </div>

      <Card className="card-interactive border-white/15 bg-black/60 text-slate-100">
        <CardHeader>
          <CardTitle>All Courses</CardTitle>
          <CardDescription className="text-slate-400">
            {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-slate-400 mb-4">
                {searchQuery ? 'No courses match your search' : 'No courses created yet'}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/admin/create-course">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Course
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-white/10 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead>Course Name</TableHead>
                    <TableHead>Modules</TableHead>
                    <TableHead>Topics</TableHead>
                    <TableHead>Enrollments</TableHead>
                    <TableHead>Reward XP</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id} className="border-white/5 hover:bg-white/5">
                      <TableCell>
                        <div>
                          <div className="font-medium">{course.name}</div>
                          <div className="text-sm text-slate-400 line-clamp-1">
                            {course.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{course.moduleCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{course.topicCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{course.enrollmentCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                          {course.completion_reward_points || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/courses/${course.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Course?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{course.name}" and all its modules, topics, and problems. 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCourse(course.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

