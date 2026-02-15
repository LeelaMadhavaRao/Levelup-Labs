import { createClient } from './supabase'

export type LeaderboardScope = 'all_time' | 'weekly' | 'seasonal'

export interface LeaderboardUser {
  id: string
  full_name: string
  avatar_url?: string
  total_xp: number
  rank: number
  courses_completed: number
  problems_solved: number
}

export interface AroundMeEntry extends LeaderboardUser {
  is_me: boolean
}

export interface RankMover {
  user_id: string
  full_name: string
  avatar_url?: string
  current_rank: number
  previous_rank: number
  rank_change: number
}

export interface SeasonInfo {
  season_id: string
  name: string
  starts_at: string
  ends_at: string
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    if (typeof record.message === 'string') return record.message
    if (typeof record.error === 'string') return record.error
  }
  return fallback
}

function mapLeaderboardRows(rows: any[] | null | undefined): LeaderboardUser[] {
  return (rows || []).map((row: any) => ({
    id: row.user_id ?? row.id,
    full_name: row.full_name ?? 'Learner',
    avatar_url: row.avatar_url ?? undefined,
    total_xp: Number(row.total_xp ?? row.total_points ?? 0),
    rank: Number(row.rank ?? 0),
    courses_completed: Number(row.courses_completed ?? 0),
    problems_solved: Number(row.problems_solved ?? 0),
  }))
}

export async function getLeaderboard(limit: number = 10, scope: LeaderboardScope = 'all_time', seasonId?: string) {
  return getTopLeaderboard(limit, scope, seasonId)
}

export async function getTopLeaderboard(
  limit: number = 10,
  scope: LeaderboardScope = 'all_time',
  seasonId?: string,
) {
  const supabase = createClient()

  try {
    if (scope === 'weekly') {
      const { data, error } = await supabase.rpc('get_leaderboard_weekly', {
        p_limit: limit,
        p_offset: 0,
        p_days: 7,
      })
      if (error) throw new Error(toErrorMessage(error, 'Failed to load weekly leaderboard'))
      return mapLeaderboardRows(data)
    }

    if (scope === 'seasonal') {
      const { data, error } = await supabase.rpc('get_leaderboard_seasonal', {
        p_limit: limit,
        p_offset: 0,
        p_season_id: seasonId || null,
      })
      if (error) throw new Error(toErrorMessage(error, 'Failed to load seasonal leaderboard'))
      return mapLeaderboardRows(data)
    }

    const { data, error } = await supabase.rpc('get_leaderboard_all_time', {
      p_limit: limit,
      p_offset: 0,
    })
    if (error) throw new Error(toErrorMessage(error, 'Failed to load leaderboard'))
    return mapLeaderboardRows(data)
  } catch (rpcError) {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, total_xp:total_points, rank, courses_completed, problems_solved')
      .order('total_points', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(toErrorMessage(error, toErrorMessage(rpcError, 'Failed to load leaderboard')))
    }

    return (data || []).map((u: any, index: number) => ({
      id: u.id,
      full_name: u.full_name ?? 'Learner',
      avatar_url: u.avatar_url ?? undefined,
      total_xp: Number(u.total_xp ?? u.total_points ?? 0),
      rank: Number(u.rank ?? index + 1),
      courses_completed: Number(u.courses_completed ?? 0),
      problems_solved: Number(u.problems_solved ?? 0),
    }))
  }
}

export async function getLeaderboardAroundMe(
  userId: string,
  scope: LeaderboardScope = 'all_time',
  windowSize: number = 5,
  seasonId?: string,
): Promise<AroundMeEntry[]> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('get_user_rank_window', {
    p_user_id: userId,
    p_scope: scope,
    p_window: windowSize,
    p_days: 7,
    p_season_id: seasonId || null,
  })

  if (error) {
    throw new Error(toErrorMessage(error, 'Failed to load nearby ranks'))
  }

  return (data || []).map((row: any) => ({
    id: row.user_id,
    full_name: row.full_name ?? 'Learner',
    avatar_url: row.avatar_url ?? undefined,
    total_xp: Number(row.total_xp ?? row.total_points ?? 0),
    rank: Number(row.rank ?? 0),
    courses_completed: 0,
    problems_solved: 0,
    is_me: !!row.is_me,
  }))
}

export async function getTopMovers(limit: number = 10, days: number = 7): Promise<RankMover[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_top_movers', {
    p_limit: limit,
    p_days: days,
  })

  if (error) {
    throw new Error(toErrorMessage(error, 'Failed to load top movers'))
  }

  return (data || []).map((row: any) => ({
    user_id: row.user_id,
    full_name: row.full_name ?? 'Learner',
    avatar_url: row.avatar_url ?? undefined,
    current_rank: Number(row.current_rank ?? 0),
    previous_rank: Number(row.previous_rank ?? 0),
    rank_change: Number(row.rank_change ?? 0),
  }))
}

export async function getActiveSeason(): Promise<SeasonInfo | null> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_active_season_info')

  if (error) {
    throw new Error(toErrorMessage(error, 'Failed to load active season'))
  }

  if (!Array.isArray(data) || data.length === 0) return null
  return data[0] as SeasonInfo
}

export async function getUserRank(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('users')
    .select('rank, total_xp:total_points, problems_solved, courses_completed, xp, level, title')
    .eq('id', userId)
    .single()

  if (error && error.code === 'PGRST116') {
    return null
  }

  if (error) {
    throw new Error(toErrorMessage(error, 'Failed to load user rank'))
  }

  return data
}

export async function searchLeaderboard(query: string, searchType: 'rank' | 'name' = 'name') {
  const supabase = createClient()

  if (searchType === 'rank') {
    const rank = parseInt(query)
    if (isNaN(rank)) return []

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, total_xp:total_points, rank, courses_completed, problems_solved')
      .eq('rank', rank)

    if (error) {
      throw new Error(toErrorMessage(error, 'Failed to search leaderboard'))
    }

    return data || []
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, total_xp:total_points, rank, courses_completed, problems_solved')
    .ilike('full_name', `%${query}%`)
    .order('total_points', { ascending: false })
    .limit(10)

  if (error) {
    throw new Error(toErrorMessage(error, 'Failed to search leaderboard'))
  }

  return data || []
}

export async function updateLeaderboardRanks() {
  const supabase = createClient()
  const { error } = await supabase.rpc('update_leaderboard_ranks')
  if (error) {
    throw new Error(toErrorMessage(error, 'Failed to update leaderboard ranks'))
  }
}
