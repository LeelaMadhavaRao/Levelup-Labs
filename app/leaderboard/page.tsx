'use client';

import { useEffect, useState } from 'react';
import { getLeaderboard } from '@/lib/leaderboard';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

export default function LeaderboardPage() {
  const [user, setUser] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    const leaders = await getLeaderboard(50);
    setLeaderboard(leaders);
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-700" />;
      default:
        return null;
    }
  };

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40';
      case 2:
        return 'bg-slate-500/20 text-slate-200 border border-slate-400/40';
      case 3:
        return 'bg-amber-600/20 text-amber-200 border border-amber-500/40';
      default:
        return 'bg-muted border border-border';
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const userRank = leaderboard.findIndex((u) => u.id === user?.id) + 1;

  return (
    <div className="container py-8 max-w-4xl space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy className="h-10 w-10 text-yellow-500" />
          <h1 className="text-4xl font-bold tracking-tight">Leaderboard</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Compete with fellow learners and climb to the top!
        </p>
      </div>

      {/* User's Rank */}
      {user && userRank > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-primary">
                  <AvatarImage src={user.avatar_url} alt={user.full_name} />
                  <AvatarFallback>{getInitials(user.full_name || 'You')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">Your Rank</p>
                  <p className="text-sm text-muted-foreground">{user.full_name}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-2xl font-bold">#{userRank}</p>
                    <p className="text-sm text-muted-foreground">{user.total_points} points</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          {/* 2nd Place */}
          <Card className="border-gray-400/50 bg-gray-400/5">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="flex justify-center">
                <Medal className="h-12 w-12 text-gray-400" />
              </div>
              <Avatar className="h-16 w-16 mx-auto border-2 border-gray-400">
                <AvatarImage src={leaderboard[1].avatar_url} alt={leaderboard[1].full_name} />
                <AvatarFallback>{getInitials(leaderboard[1].full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{leaderboard[1].full_name}</p>
                <p className="text-2xl font-bold">{leaderboard[1].total_points}</p>
                <p className="text-sm text-muted-foreground">points</p>
              </div>
            </CardContent>
          </Card>

          {/* 1st Place */}
          <Card className="border-yellow-500/50 bg-yellow-500/5 sm:scale-105">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="flex justify-center">
                <Trophy className="h-16 w-16 text-yellow-500" />
              </div>
              <Avatar className="h-20 w-20 mx-auto border-4 border-yellow-500">
                <AvatarImage src={leaderboard[0].avatar_url} alt={leaderboard[0].full_name} />
                <AvatarFallback>{getInitials(leaderboard[0].full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <Badge className="mb-2 bg-yellow-500 text-black">Champion</Badge>
                <p className="font-bold text-lg">{leaderboard[0].full_name}</p>
                <p className="text-3xl font-bold">{leaderboard[0].total_points}</p>
                <p className="text-sm text-muted-foreground">points</p>
              </div>
            </CardContent>
          </Card>

          {/* 3rd Place */}
          <Card className="border-amber-700/50 bg-amber-700/5">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="flex justify-center">
                <Medal className="h-12 w-12 text-amber-700" />
              </div>
              <Avatar className="h-16 w-16 mx-auto border-2 border-amber-700">
                <AvatarImage src={leaderboard[2].avatar_url} alt={leaderboard[2].full_name} />
                <AvatarFallback>{getInitials(leaderboard[2].full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{leaderboard[2].full_name}</p>
                <p className="text-2xl font-bold">{leaderboard[2].total_points}</p>
                <p className="text-sm text-muted-foreground">points</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>All Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map((leader, index) => {
              const rank = index + 1;
              const isCurrentUser = leader.id === user?.id;

              return (
                <div
                  key={leader.id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    isCurrentUser
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${getRankBadgeClass(rank)}`}>
                      {getRankIcon(rank) || `#${rank}`}
                    </div>
                    
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={leader.avatar_url} alt={leader.full_name} />
                      <AvatarFallback>{getInitials(leader.full_name)}</AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="font-semibold flex items-center gap-2 mb-1">
                        {leader.full_name}
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {leader.courses_completed} courses • {leader.problems_solved} problems
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <span className="text-xl font-bold">{leader.total_points}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
