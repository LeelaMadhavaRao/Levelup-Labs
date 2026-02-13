'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, BookOpen, Code, Award, Edit, Mail, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
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
    setLoading(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-8 max-w-4xl">
        <Card>
          <CardContent className="py-16 text-center">
            <h2 className="text-xl font-semibold mb-2">User not found</h2>
            <Button onClick={() => router.push('/auth/login')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-primary">
              <AvatarImage src={user.avatar_url} alt={user.full_name} />
              <AvatarFallback className="text-2xl">
                {getInitials(user.full_name || 'User')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{user.full_name}</h1>
                  {user.role === 'admin' && (
                    <Badge variant="secondary" className="text-sm">
                      <Award className="mr-1 h-3 w-3" />
                      Admin
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {formatDate(user.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">Rank #{user.rank || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <Button onClick={() => router.push('/profile/edit')}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{user.total_points || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Rank #{user.rank || 'N/A'} globally
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{user.courses_completed || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Keep learning to complete more
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problems Solved</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{user.problems_solved || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Challenge yourself with more
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Milestones you've reached in your coding journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {user.total_points >= 1000 && (
              <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
                <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="font-semibold">Points Master</p>
                  <p className="text-sm text-muted-foreground">Earned 1,000+ points</p>
                </div>
              </div>
            )}
            
            {user.courses_completed >= 1 && (
              <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold">Course Completer</p>
                  <p className="text-sm text-muted-foreground">Completed your first course</p>
                </div>
              </div>
            )}
            
            {user.problems_solved >= 10 && (
              <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Code className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="font-semibold">Problem Solver</p>
                  <p className="text-sm text-muted-foreground">Solved 10+ problems</p>
                </div>
              </div>
            )}
            
            {user.rank && user.rank <= 10 && (
              <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="font-semibold">Top 10 Coder</p>
                  <p className="text-sm text-muted-foreground">Ranked in top 10 globally</p>
                </div>
              </div>
            )}
          </div>
          
          {user.total_points < 100 && user.courses_completed === 0 && user.problems_solved === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Complete courses and solve problems to earn achievements!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push('/courses')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Browse Courses
            </CardTitle>
            <CardDescription>Explore new courses to expand your skills</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push('/leaderboard')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              View Leaderboard
            </CardTitle>
            <CardDescription>See where you rank among other learners</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
