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
import { BookOpen, Plus, Search, Edit, Trash2, Users, Trophy } from 'lucide-react';
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
      const processedCourses = coursesData.map((course: any) => ({
        ...course,
        moduleCount: course.module_count || 0,
        topicCount: course.topic_count || 0,
        enrollmentCount: course.student_count || 0,
        problemCount: course.problem_count || 0,
      }));

      setCourses(processedCourses);
      setFilteredCourses(processedCourses);

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
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) throw new Error(error.message || 'Failed to delete course');
      toast.success('Course deleted successfully');
      await fetchCourses();
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast.error(error?.message || 'Failed to delete course');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded bg-gray-200" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded bg-gray-200" />
            ))}
          </div>
          <div className="h-96 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Courses</h1>
          <p className="mt-1 text-sm text-gray-500">
            Search, inspect, and manage all courses in the platform.
          </p>
        </div>
        <Button asChild className="bg-purple-600 text-white hover:bg-purple-500">
          <Link href="/admin/create-course">
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-gray-200 bg-white text-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white text-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Enrollments</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white text-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalModules}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white text-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Topics</CardTitle>
            <Trophy className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTopics}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search courses by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
        />
      </div>

      {/* Course Table */}
      <Card className="border-gray-200 bg-white text-gray-900">
        <CardHeader>
          <CardTitle>Courses</CardTitle>
          <CardDescription className="text-gray-500">
            {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCourses.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-4 text-gray-500">
                {searchQuery ? 'No courses match your search' : 'No courses created yet'}
              </p>
              {!searchQuery && (
                <Button asChild className="bg-purple-600 text-white hover:bg-purple-500">
                  <Link href="/admin/create-course">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Course
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 hover:bg-transparent">
                    <TableHead className="text-gray-500">Course Name</TableHead>
                    <TableHead className="text-gray-500">Modules</TableHead>
                    <TableHead className="text-gray-500">Topics</TableHead>
                    <TableHead className="text-gray-500">Enrollments</TableHead>
                    <TableHead className="text-gray-500">Reward XP</TableHead>
                    <TableHead className="text-right text-gray-500">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id} className="border-gray-100 hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{course.name}</div>
                          <div className="text-sm text-gray-400 line-clamp-1">{course.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-gray-200 text-gray-600">{course.moduleCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-gray-200 text-gray-600">{course.topicCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-gray-200 text-gray-600">{course.enrollmentCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100">
                          {Number(course.completion_reward_xp ?? course.completion_reward_points ?? 0)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild className="text-gray-500 hover:text-gray-900">
                            <Link href={`/admin/courses/${course.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Course?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete &quot;{course.name}&quot; and all its modules, topics, and problems.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCourse(course.id)} className="bg-red-600 hover:bg-red-700">
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
  );
}

