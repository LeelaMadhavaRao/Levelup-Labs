'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Trophy, Users } from 'lucide-react';

interface CourseCardProps {
  course: {
    id: string;
    name: string;
    description: string;
    thumbnail_url?: string;
    completion_reward_points?: number;
    modules?: any[];
    _count?: {
      user_courses: number;
    };
  };
  isRegistered?: boolean;
  onRegister?: () => void;
  onUnregister?: () => void;
  showProgress?: boolean;
  progress?: number;
}

export function CourseCard({
  course,
  isRegistered = false,
  onRegister,
  onUnregister,
  showProgress = false,
  progress = 0,
}: CourseCardProps) {
  const router = useRouter();

  const moduleCount = course.modules?.length || 0;
  const topicCount = course.modules?.reduce((sum, m) => sum + (m.topics?.length || 0), 0) || 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      {course.thumbnail_url && (
        <div className="aspect-video overflow-hidden rounded-t-lg">
          <img
            src={course.thumbnail_url}
            alt={course.name}
            className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-1">{course.name}</CardTitle>
            <CardDescription className="line-clamp-2 mt-2">
              {course.description}
            </CardDescription>
          </div>
          {course.completion_reward_points && (
            <Badge variant="secondary" className="ml-2">
              <Trophy className="mr-1 h-3 w-3" />
              {course.completion_reward_points}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{moduleCount} modules</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{topicCount} topics</span>
          </div>
          {course._count?.user_courses !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{course._count.user_courses} enrolled</span>
            </div>
          )}
        </div>

        {showProgress && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {isRegistered ? (
          <>
            <Button
              onClick={() => router.push(`/my-courses`)}
              className="flex-1"
            >
              Continue Learning
            </Button>
            {onUnregister && (
              <Button
                onClick={onUnregister}
                variant="outline"
              >
                Unregister
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              onClick={() => router.push(`/courses`)}
              variant="outline"
              className="flex-1"
            >
              View Details
            </Button>
            {onRegister && (
              <Button onClick={onRegister} className="flex-1">
                Enroll Now
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
