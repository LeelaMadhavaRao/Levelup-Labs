'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCourseWithModules, registerForCourse, unregisterFromCourse, isUserRegisteredForCourse } from '@/lib/courses';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Trophy, Users, Clock, CheckCircle, Lock, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  
  const [user, setUser] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      const courseData = await getCourseWithModules(courseId);
      setCourse(courseData);

      if (currentUser) {
        const registered = await isUserRegisteredForCourse(currentUser.id, courseId);
        setIsRegistered(registered);
      }
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await registerForCourse(user.id, courseId);
      
      if (error) {
        toast.error('Failed to enroll in course');
      } else {
        toast.success('Successfully enrolled in course!');
        setIsRegistered(true);
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!user) return;

    setActionLoading(true);
    try {
      const { error } = await unregisterFromCourse(user.id, courseId);
      
      if (error) {
        toast.error('Failed to unenroll from course');
      } else {
        toast.success('Successfully unenrolled from course');
        setIsRegistered(false);
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  const getTotalTopics = () => {
    if (!course?.modules) return 0;
    return course.modules.reduce((acc: number, module: any) => 
      acc + (module.topics?.length || 0), 0
    );
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-64 bg-muted rounded-lg" />
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container py-16">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Course not found</h3>
            <p className="text-muted-foreground text-center mb-6">
              The course you're looking for doesn't exist
            </p>
            <Button onClick={() => router.push('/courses')}>
              Browse Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Hero Section */}
      <Card className="border-2">
        <CardHeader className="space-y-4">
          {course.thumbnail_url && (
            <div className="w-full h-64 rounded-lg overflow-hidden bg-muted">
              <img 
                src={course.thumbnail_url} 
                alt={course.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">{course.name}</h1>
            <p className="text-lg text-muted-foreground">
              {course.description || 'No description available'}
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-cyan-500" />
              <span className="text-sm">
                {course.modules?.length || 0} Modules
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-purple-500" />
              <span className="text-sm">
                {getTotalTopics()} Topics
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-sm">
                {course.completion_reward_points || 500} Points Reward
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {isRegistered ? (
              <>
                <Button 
                  size="lg" 
                  onClick={() => router.push('/my-courses')}
                  className="flex-1"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Continue Learning
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={handleUnenroll}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  {actionLoading ? 'Processing...' : 'Unenroll'}
                </Button>
              </>
            ) : (
              <Button 
                size="lg" 
                onClick={handleEnroll}
                disabled={actionLoading}
                className="flex-1"
              >
                {actionLoading ? 'Enrolling...' : user ? 'Enroll Now' : 'Login to Enroll'}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Course Content */}
      <Card>
        <CardHeader>
          <CardTitle>Course Content</CardTitle>
          <CardDescription>
            {course.modules?.length || 0} modules with {getTotalTopics()} topics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!course.modules || course.modules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No content available yet
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {course.modules
                .sort((a: any, b: any) => a.order - b.order)
                .map((module: any, moduleIndex: number) => (
                  <AccordionItem key={module.id} value={`module-${module.id}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {moduleIndex + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold">{module.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {module.topics?.length || 0} topics
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-11 space-y-2 pt-2">
                        {!module.topics || module.topics.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No topics yet</p>
                        ) : (
                          module.topics.map((topic: any, topicIndex: number) => (
                            <div
                              key={topic.id}
                              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">
                                  {topicIndex + 1}.
                                </span>
                                <div>
                                  <p className="font-medium">{topic.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {topic.num_mcqs || 5} Quizzes
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {topic.num_problems || 3} Problems
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              {isRegistered ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <Lock className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* What You'll Learn */}
      <Card>
        <CardHeader>
          <CardTitle>What You'll Learn</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid md:grid-cols-2 gap-4">
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Master core concepts through video tutorials</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Practice with AI-generated quizzes</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Solve real coding problems</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Earn points and climb the leaderboard</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
