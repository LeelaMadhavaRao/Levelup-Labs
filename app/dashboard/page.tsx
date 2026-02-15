'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateHunterAvatarUrl, getCurrentUser } from '@/lib/auth';
import { getHunterRankByPoints } from '@/lib/hunter-rank';
import { getUserCoursesWithProgress } from '@/lib/courses';
import { getTopLeaderboard } from '@/lib/leaderboard';
import { getQuestProgress, getRecentPointEvents, type QuestProgress } from '@/lib/gamification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BookOpen, 
  Trophy, 
  Code, 
  CheckCircle, 
  TrendingUp,
  Award,
  Clock,
  Target
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [dailyQuests, setDailyQuests] = useState<QuestProgress[]>([]);
  const [recentPoints, setRecentPoints] = useState<any[]>([]);
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
    const [userCourses, topUsers] = await Promise.all([
      getUserCoursesWithProgress(currentUser.id),
      getTopLeaderboard(5),
    ]);

    let questRows: QuestProgress[] = [];
    let pointRows: any[] = [];
    try {
      [questRows, pointRows] = await Promise.all([
        getQuestProgress(currentUser.id, 'daily'),
        getRecentPointEvents(currentUser.id, 5),
      ]);
    } catch {
      questRows = [];
      pointRows = [];
    }

    setCourses(userCourses);
    setLeaderboard(topUsers);
    setDailyQuests(questRows);
    setRecentPoints(pointRows);
    setLoading(false);
  };

  const calculateProgress = (course: any) => {
    if (!course.modules || course.modules.length === 0) return 0;
    
    const totalTopics = course.modules.reduce((acc: number, module: any) => 
      acc + (module.topics?.length || 0), 0
    );
    
    if (totalTopics === 0) return 0;
    
    const completedTopics = course.modules.reduce((acc: number, module: any) => 
      acc + (module.topics?.filter((t: any) => t.is_completed)?.length || 0), 0
    );
    
    return Math.round((completedTopics / totalTopics) * 100);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const inProgressCourses = courses.filter(c => {
    const progress = calculateProgress(c);
    return progress > 0 && progress < 100;
  });
  const hunterRank = getHunterRankByPoints(Number(user?.total_points || 0));

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, Hunter {user?.full_name?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's your gate progress and hunter achievements
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.total_points || 0}</div>
            <p className="text-xs text-muted-foreground">
              Hunter Rank {hunterRank.label}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Raid Gates Joined</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground">
              {user?.courses_completed || 0} gates cleared
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boss Fights Cleared</CardTitle>
            <Code className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.problems_solved || 0}</div>
            <p className="text-xs text-muted-foreground">
              Keep coding!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inProgressCourses.length > 0 ? '🔥 Active' : '😴 Start'}
            </div>
            <p className="text-xs text-muted-foreground">
              {inProgressCourses.length} active gates in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Continue Learning */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Continue Raids</CardTitle>
            <CardDescription>
              Re-enter your active gates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inProgressCourses.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No active gates. Enter a new raid now!
                </p>
                <Button asChild>
                  <Link href="/courses">Browse Raid Gates</Link>
                </Button>
              </div>
            ) : (
              inProgressCourses.slice(0, 3).map((course) => {
                const progress = calculateProgress(course);
                return (
                  <Card key={course.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{course.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {course.description}
                          </p>
                        </div>
                        <Button size="sm" asChild>
                          <Link href="/my-courses">
                            Continue
                          </Link>
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}

            {courses.length > 3 && (
              <Button variant="outline" className="w-full" asChild>
                <Link href="/my-courses">View All Gates</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard Preview */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Hunters</CardTitle>
            <CardDescription>
              Track your rank among hunters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaderboard.map((leader, index) => (
                <div key={`${leader.id ?? leader.full_name ?? 'leader'}-${index}`} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-semibold text-sm">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `#${index + 1}`}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={leader.avatar_url || generateHunterAvatarUrl(`${leader.id}-${leader.full_name}`)} />
                    <AvatarFallback>{getInitials(leader.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {leader.full_name}
                      {leader.id === user?.id && (
                        <span className="text-xs text-primary ml-2">(You)</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {leader.total_points} points
                    </p>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" className="w-full" asChild>
                <Link href="/leaderboard">View Hunter Rankings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Missions</CardTitle>
            <CardDescription>Small clears that boost your XP</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dailyQuests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No daily quests available.</p>
            ) : (
              dailyQuests.map((quest) => (
                <div key={quest.quest_id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{quest.title}</p>
                      <p className="text-xs text-muted-foreground">{quest.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">+{quest.reward_points} pts</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <Progress value={(quest.progress / Math.max(quest.target_count, 1)) * 100} className="h-2" />
                    <span className="text-xs text-muted-foreground">
                      {quest.progress}/{quest.target_count}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent XP Logs</CardTitle>
            <CardDescription>Latest rewards earned</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPoints.length === 0 ? (
              <p className="text-sm text-muted-foreground">No point activity yet.</p>
            ) : (
              recentPoints.map((event: any) => (
                <div key={event.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium">{event.event_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">+{event.points} pts</p>
                    <p className="text-xs text-muted-foreground">+{event.xp} XP</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            What would you like to do today?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
              <Link href="/courses">
                <BookOpen className="h-6 w-6" />
                <span>Browse Courses</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
              <Link href="/my-courses">
                <Clock className="h-6 w-6" />
                <span>My Courses</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
              <Link href="/leaderboard">
                <Trophy className="h-6 w-6" />
                <span>Leaderboard</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
              <Link href="/profile">
                <Award className="h-6 w-6" />
                <span>My Profile</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
