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
    .from('users')
    .select('rank, total_points, problems_solved, courses_completed')
    .eq('id', userId)
    .single()
  
  if (error && error.code === 'PGRST116') {
    return null // User not on leaderboard yet
  }
  
  if (error) throw error
  return data
}

// Search leaderboard by rank or name
export async function searchLeaderboard(query: string, searchType: 'rank' | 'name' = 'name') {
  const supabase = createClient()
  
  if (searchType === 'rank') {
    const rank = parseInt(query)
    if (isNaN(rank)) return []
    
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, email, total_points, rank, courses_completed, problems_solved')
      .eq('rank', rank)
    
    if (error) throw error
    return data || []
  } else {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, email, total_points, rank, courses_completed, problems_solved')
      .ilike('full_name', `%${query}%`)
      .order('total_points', { ascending: false })
      .limit(10)
    
    if (error) throw error
    return data || []
  }
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

