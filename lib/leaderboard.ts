import { createClient } from './supabase'

export interface LeaderboardEntry {
  rank: number
  user: {
    id: string
    full_name: string
    avatar_url?: string
  }
  total_points: number
}

// Get leaderboard (alias for compatibility)
export async function getLeaderboard(limit: number = 10) {
  return getTopLeaderboard(limit)
}

export async function getTopLeaderboard(limit: number = 10) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, email, total_points, rank, courses_completed, problems_solved, role')
    .order('total_points', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  
  return data || []
}

export async function getUserRank(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('leaderboard')
    .select('rank, total_points')
    .eq('user_id', userId)
    .single()
  
  if (error && error.code === 'PGRST116') {
    return null // User not on leaderboard yet
  }
  
  if (error) throw error
  return data
}

export async function updateUserPoints(userId: string, pointsToAdd: number) {
  const supabase = createClient()
  
  // Update user total points
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('total_points')
    .eq('id', userId)
    .single()
  
  if (userError) throw userError
  
  const newTotal = (userData?.total_points || 0) + pointsToAdd
  
  const { error: updateError } = await supabase
    .from('users')
    .update({ total_points: newTotal })
    .eq('id', userId)
  
  if (updateError) throw updateError
  
  // Update leaderboard
  await updateLeaderboard(userId, newTotal)
  
  return newTotal
}

export async function updateLeaderboard(userId: string, totalPoints: number) {
  const supabase = createClient()
  
  // Get current rank
  const { data: rankData } = await supabase
    .from('leaderboard')
    .select('rank')
    .gt('total_points', totalPoints)
    .order('total_points', { ascending: false })
  
  const newRank = (rankData?.length || 0) + 1
  
  const { error } = await supabase
    .from('leaderboard')
    .upsert([
      {
        user_id: userId,
        total_points: totalPoints,
        rank: newRank,
        updated_at: new Date().toISOString(),
      },
    ])
  
  if (error) throw error
}

export async function updateLeaderboardRanks() {
  const supabase = createClient()
  
  // Get all users sorted by points
  const { data: users, error } = await supabase
    .from('leaderboard')
    .select('user_id, total_points')
    .order('total_points', { ascending: false })
  
  if (error) throw error
  
  // Update ranks
  for (let i = 0; i < (users?.length || 0); i++) {
    await supabase
      .from('leaderboard')
      .update({ rank: i + 1 })
      .eq('user_id', users![i].user_id)
  }
}

export async function searchLeaderboard(
  searchTerm: string,
  limit: number = 10
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('leaderboard')
    .select(`
      rank,
      total_points,
      users:user_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .ilike('users.full_name', `%${searchTerm}%`)
    .order('rank', { ascending: true })
    .limit(limit)
  
  if (error) throw error
  
  return data?.map((entry: any) => ({
    rank: entry.rank,
    user: entry.users,
    total_points: entry.total_points,
  })) || []
}
