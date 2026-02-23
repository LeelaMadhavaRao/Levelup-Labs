'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getUserCoursesWithProgress } from '@/lib/courses';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  ChevronRight,
  CheckCircle,
  Circle,
  PlusCircle,
  Sparkles,
} from 'lucide-react';

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
    const totalTopics = course.modules.reduce(
      (acc: number, module: any) => acc + (module.topics?.length || 0),
      0
    );
    if (totalTopics === 0) return 0;
    const completedTopics = course.modules.reduce(
      (acc: number, module: any) =>
        acc + (module.topics?.filter((t: any) => t.is_completed)?.length || 0),
      0
    );
    return (completedTopics / totalTopics) * 100;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded-md bg-gray-200" />
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="h-[560px] rounded-lg bg-gray-200" />
            <div className="h-[560px] rounded-lg bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  const selectedCourse =
    courses.find((c) => c.id === selectedCourseId) || courses[0] || null;
  const selectedProgress = selectedCourse ? calculateProgress(selectedCourse) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your learning progress across enrolled courses
          </p>
        </div>
        <Button
          onClick={() => router.push('/courses')}
          className="bg-purple-600 text-white hover:bg-purple-500"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Browse Courses
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card className="border-gray-200 bg-white">
          <CardContent className="flex flex-col items-center py-16">
            <BookOpen className="mb-4 h-12 w-12 text-gray-400" />
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              No courses yet
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Enroll in a course to start learning.
            </p>
            <Button
              onClick={() => router.push('/courses')}
              className="bg-purple-600 text-white hover:bg-purple-500"
            >
              Explore Courses
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Course sidebar */}
          <div className="space-y-2">
            {courses.map((course) => {
              const active = selectedCourse?.id === course.id;
              const progress = calculateProgress(course);
              return (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${
                    active
                      ? 'border-purple-500/50 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <h3
                    className={`mb-1 text-sm font-semibold ${
                      active ? 'text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    {course.name}
                  </h3>
                  <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
                    <span>{course.modules?.length || 0} modules</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress
                    value={progress}
                    className="h-1.5 bg-gray-200 [&>div]:bg-purple-500"
                  />
                </button>
              );
            })}
          </div>

          {/* Course detail */}
          <div className="space-y-6">
            {/* Course header */}
            <Card className="border-gray-200 bg-white">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="mb-1 text-xl font-bold text-gray-900">
                      {selectedCourse.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedCourse.description || 'No description available.'}
                    </p>
                  </div>
                  <Badge className="w-fit border-purple-200 bg-purple-50 text-purple-600">
                    {Math.round(selectedProgress)}% complete
                  </Badge>
                </div>
                <div className="mt-4">
                  <Progress
                    value={selectedProgress}
                    className="h-2 bg-gray-200 [&>div]:bg-purple-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Modules */}
            {selectedCourse.modules?.length ? (
              selectedCourse.modules.map((module: any, moduleIndex: number) => (
                <Card
                  key={module.id}
                  className="border-gray-200 bg-white"
                >
                  <CardContent className="p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50 text-sm font-bold text-purple-600">
                        {moduleIndex + 1}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          {module.name}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {module.topics?.length || 0} topics
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {module.topics?.length ? (
                        module.topics.map((topic: any) => (
                          <div
                            key={topic.id}
                            className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-gray-200 sm:flex-row sm:items-center"
                          >
                            {topic.is_completed ? (
                              <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                            ) : (
                              <Circle className="h-4 w-4 flex-shrink-0 text-slate-600" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-sm text-gray-600">
                                {topic.name}
                              </div>
                              {topic.description && (
                                <div className="line-clamp-1 text-xs text-gray-400">
                                  {topic.description}
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant={topic.is_completed ? 'outline' : 'default'}
                              onClick={() => router.push(`/topic/${topic.id}`)}
                              className={
                                topic.is_completed
                                  ? 'border-gray-200 text-gray-600 hover:bg-gray-100'
                                  : 'bg-purple-600 text-white hover:bg-purple-500'
                              }
                            >
                              {topic.is_completed
                                ? 'Review'
                                : topic.progress?.quiz_passed
                                  ? 'Challenge'
                                  : topic.progress?.video_watched
                                    ? 'Continue'
                                    : 'Start'}
                              <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="py-2 text-sm text-gray-400">
                          No topics available yet.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-gray-200 bg-white">
                <CardContent className="py-12 text-center">
                  <Sparkles className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    No modules available yet.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* User snapshot */}
            {selectedCourse && (
              <Card className="border-gray-200 bg-white">
                <CardContent className="p-5">
                  <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                    Course Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-gray-400">Student</p>
                      <p className="font-medium text-gray-900">
                        {user?.full_name || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Course</p>
                      <p className="font-medium text-gray-900">
                        {selectedCourse.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Modules</p>
                      <p className="font-medium text-gray-900">
                        {selectedCourse.modules?.length || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Progress</p>
                      <p className="font-medium text-purple-600">
                        {Math.round(selectedProgress)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


