'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllCourses, registerForCourse, unregisterFromCourse, getUserCourses } from '@/lib/courses';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Trophy, Search, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [userCourseIds, setUserCourseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);

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

  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
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
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Browse Courses</h1>
          <p className="text-muted-foreground mt-2">
            Explore our collection of AI-powered coding courses
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Check back later for new courses'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isRegistered = userCourseIds.has(course.id);

            return (
              <Card key={course.id} className="overflow-hidden flex flex-col">
                {course.thumbnail_url && (
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={course.thumbnail_url}
                      alt={course.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2">{course.name}</CardTitle>
                    {isRegistered && (
                      <Badge variant="secondary" className="shrink-0">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Enrolled
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-3">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col gap-3">
                  <div className="flex items-center justify-between w-full text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Trophy className="mr-1 h-4 w-4 text-yellow-500" />
                      <span>{course.completion_reward_points} points</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <BookOpen className="mr-1 h-4 w-4" />
                      <span>{course.module_count || 0} modules</span>
                    </div>
                  </div>
                  
                  {isRegistered ? (
                    <div className="flex gap-2 w-full">
                      <Button
                        className="flex-1"
                        onClick={() => router.push('/my-courses')}
                      >
                        Continue Learning
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleUnregister(course.id, course.name)}
                      >
                        Unregister
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleRegister(course.id, course.name)}
                    >
                      Register Now
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
