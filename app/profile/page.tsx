'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import {
  getGamificationOverview,
  getQuestProgress,
  getRecentPointEvents,
  getUserAchievements,
  type QuestProgress,
  type GamificationOverview,
  type UserAchievement,
} from '@/lib/gamification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, BookOpen, Code, Award, Edit, Mail, Calendar, Flame } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [overview, setOverview] = useState<GamificationOverview | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [dailyQuests, setDailyQuests] = useState<QuestProgress[]>([]);
  const [weeklyQuests, setWeeklyQuests] = useState<QuestProgress[]>([]);
  const [pointEvents, setPointEvents] = useState<any[]>([]);
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
    try {
      const [overviewRes, dailyRes, weeklyRes, pointsRes, achievementsRes] = await Promise.all([
        getGamificationOverview(currentUser.id),
        getQuestProgress(currentUser.id, 'daily'),
        getQuestProgress(currentUser.id, 'weekly'),
        getRecentPointEvents(currentUser.id, 8),
        getUserAchievements(currentUser.id),
      ]);
      setOverview(overviewRes);
      setDailyQuests(dailyRes);
      setWeeklyQuests(weeklyRes);
      setPointEvents(pointsRes);
      setAchievements(achievementsRes);
    } catch {
      setOverview(null);
      setDailyQuests([]);
      setWeeklyQuests([]);
      setPointEvents([]);
      setAchievements([]);
    }
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

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
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

  const isRankEligible = user.role !== 'admin';

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
                  <span className="font-semibold">{isRankEligible ? `Rank #${user.rank || 'N/A'}` : 'Not ranked'}</span>
                </div>
              </div>
            </div>
            
            <Button onClick={() => router.push('/profile/edit')} className="w-full md:w-auto">
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{user.total_points || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isRankEligible ? `Rank #${user.rank || 'N/A'} globally` : 'Not ranked'}
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

      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Level</CardTitle>
              <Award className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overview.level}</div>
              <p className="text-xs text-muted-foreground mt-1">{overview.title}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">XP</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overview.xp}</div>
              <p className="text-xs text-muted-foreground mt-1">Keep earning</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Streak</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overview.current_streak} days</div>
              <p className="text-xs text-muted-foreground mt-1">Best: {overview.longest_streak}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Milestones you've reached in your coding journey</CardDescription>
        </CardHeader>
        <CardContent>
          {achievements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Complete courses and solve problems to earn achievements!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{achievement.name}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {achievement.description || 'Achievement unlocked'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Unlocked {formatShortDate(achievement.unlocked_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {overview?.next_achievement && (
            <div className="mt-4 rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-semibold">Next up: {overview.next_achievement.name}</p>
              <p className="text-xs text-muted-foreground mb-2">
                {overview.next_achievement.description}
              </p>
              <Progress
                value={(overview.next_achievement.progress / Math.max(overview.next_achievement.target, 1)) * 100}
                className="h-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quests */}
      <Card>
        <CardHeader>
          <CardTitle>Quests</CardTitle>
          <CardDescription>Daily and weekly goals that grant bonus rewards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold">Daily</p>
            {dailyQuests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No daily quests available.</p>
            ) : (
              dailyQuests.map((quest) => (
                <div key={quest.quest_id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{quest.title}</p>
                      <p className="text-xs text-muted-foreground">{quest.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      +{quest.reward_points} pts / +{quest.reward_xp} XP
                    </span>
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
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold">Weekly</p>
            {weeklyQuests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No weekly quests available.</p>
            ) : (
              weeklyQuests.map((quest) => (
                <div key={quest.quest_id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{quest.title}</p>
                      <p className="text-xs text-muted-foreground">{quest.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      +{quest.reward_points} pts / +{quest.reward_xp} XP
                    </span>
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
          </div>
        </CardContent>
      </Card>

      {/* Point History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Point History</CardTitle>
          <CardDescription>Latest XP and points earned</CardDescription>
        </CardHeader>
        <CardContent>
          {pointEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No point activity yet.</p>
          ) : (
            <div className="space-y-3">
              {pointEvents.map((event: any) => (
                <div key={event.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium">{event.event_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">{formatShortDate(event.created_at)}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">+{event.points} pts</p>
                    <p className="text-xs text-muted-foreground">+{event.xp} XP</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
