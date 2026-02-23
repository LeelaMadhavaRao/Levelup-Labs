'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllCourses, registerForCourse, unregisterFromCourse, getUserCourses } from '@/lib/courses';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Search, Sparkles, BookOpen, ChevronRight } from 'lucide-react';

export default function CoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [userCourseIds, setUserCourseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'name' | 'reward'>('name');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      const allCourses = await getAllCourses();
      setCourses(allCourses);

      if (currentUser) {
        const userCourses = await getUserCourses(currentUser.id);
        setUserCourseIds(new Set(userCourses.map((uc: any) => uc.course_id)));
      }
    } catch (err) {
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
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

  const getDifficultyLabel = (course: any) => {
    const reward = Number(course.completion_reward_xp ?? course.completion_reward_points ?? 0);
    if (reward >= 700) return { label: 'Advanced', color: 'text-amber-400 border-amber-400/30 bg-amber-400/10' };
    if (reward >= 500) return { label: 'Intermediate', color: 'text-purple-600 border-purple-400/30 bg-purple-400/10' };
    return { label: 'Beginner', color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' };
  };

  const filteredCourses = courses
    .filter(
      (course) =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortMode === 'name') return a.name.localeCompare(b.name);
      return (
        Number(b.completion_reward_xp ?? b.completion_reward_points ?? 0) -
        Number(a.completion_reward_xp ?? a.completion_reward_points ?? 0)
      );
    });

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded-md bg-gray-200" />
          <div className="h-10 w-72 rounded-md bg-gray-200" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Course Library</h1>
        <p className="mt-1 text-sm text-gray-500">Browse and enroll in available courses</p>
      </div>

      {/* Search & Sort */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-gray-200 bg-gray-100 pl-9 text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
          className="rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="name">Sort by Name</option>
          <option value="reward">Sort by XP Reward</option>
        </select>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-16 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">No courses found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Try refining your search.' : 'New courses will appear soon.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const isRegistered = userCourseIds.has(course.id);
            const difficulty = getDifficultyLabel(course);
            const reward = Number(course.completion_reward_xp ?? course.completion_reward_points ?? 0);

            return (
              <Card key={course.id} className="overflow-hidden border-gray-200 bg-white transition-colors hover:border-gray-300">
                {/* Thumbnail */}
                <div className="relative h-40 bg-gray-50">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Sparkles className="h-8 w-8 text-slate-600" />
                    </div>
                  )}
                  <Badge className={`absolute right-2 top-2 border text-xs ${difficulty.color}`}>
                    {difficulty.label}
                  </Badge>
                </div>

                <CardContent className="p-5">
                  <h3 className="mb-1 text-base font-semibold text-gray-900">{course.name}</h3>
                  <p className="mb-4 line-clamp-2 text-sm text-gray-500">{course.description}</p>

                  <div className="mb-4 flex gap-4 text-xs text-gray-400">
                    <span>{course.module_count || 0} modules</span>
                    <span>+{reward} XP</span>
                  </div>

                  {isRegistered ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-purple-600 text-white hover:bg-purple-500"
                        onClick={() => router.push('/my-courses')}
                      >
                        Open Course <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-200 text-gray-600 hover:bg-gray-100"
                        onClick={() => handleUnregister(course.id, course.name)}
                      >
                        Leave
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full bg-purple-600 text-white hover:bg-purple-500"
                      onClick={() => handleRegister(course.id, course.name)}
                    >
                      Enroll Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


