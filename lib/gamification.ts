import { createClient } from './supabase'

export interface QuestProgress {
  quest_id: string
  slug: string
  title: string
  description: string
  frequency: 'daily' | 'weekly'
  target_type: string
  target_count: number
  reward_points: number
  reward_xp: number
  progress: number
  completed: boolean
}

export interface NextAchievement {
  code: string
  name: string
  description: string
  progress: number
  target: number
}

export interface GamificationOverview {
  total_xp: number
  rank: number | null
  xp: number
  level: number
  title: string
  current_streak: number
  longest_streak: number
  achievements_unlocked: number
  next_achievement: NextAchievement | null
  problems_solved: number
  courses_completed: number
}

export interface UserAchievement {
  id: string
  achievement_id: string
  code: string
  name: string
  description: string | null
  icon: string | null
  unlocked_at: string
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

function getCurrentMetric(achievement: any, user: any, streak: number): number {
  switch (achievement.condition_type) {
    case 'problems_solved':
      return Number(user?.problems_solved ?? 0)
    case 'courses_completed':
      return Number(user?.courses_completed ?? 0)
    case 'streak_days':
      return Number(streak ?? 0)
    case 'points_earned':
    case 'xp_earned':
      return Number(user?.total_xp ?? user?.total_points ?? 0)
    case 'level_reached':
      return Number(user?.level ?? 1)
    default:
      return 0
  }
}

export async function getGamificationOverview(userId: string): Promise<GamificationOverview> {
  const supabase = createClient()

  const [userRes, streakRes, unlockedRes, achievementsRes] = await Promise.all([
    supabase
      .from('users')
      .select('total_xp:total_points, rank, xp, level, title, problems_solved, courses_completed')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('daily_streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('user_achievements')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('achievements')
      .select('id, code, name, description, condition_type, condition_value')
      .eq('is_active', true),
  ])

  const userData: any = userRes.data || {}
  const streakData: any = streakRes.data || {}
  const unlockedCount = unlockedRes.count || 0
  const achievements = achievementsRes.data || []

  let nextAchievement: NextAchievement | null = null
  if (achievements.length > 0) {
    const { data: unlockedRows } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)

    const unlockedSet = new Set((unlockedRows || []).map((r: any) => r.achievement_id))
    const locked = achievements.filter((a: any) => !unlockedSet.has(a.id))

    locked.sort((a: any, b: any) => Number(a.condition_value) - Number(b.condition_value))
    const candidate = locked[0]

    if (candidate) {
      const current = getCurrentMetric(candidate, userData, Number(streakData.current_streak ?? 0))
      nextAchievement = {
        code: candidate.code,
        name: candidate.name,
        description: candidate.description,
        progress: Math.min(current, Number(candidate.condition_value)),
        target: Number(candidate.condition_value),
      }
    }
  }

  return {
    total_xp: Number(userData.total_xp ?? userData.total_points ?? 0),
    rank: userData.rank ?? null,
    xp: Number(userData.xp ?? 0),
    level: Number(userData.level ?? 1),
    title: userData.title ?? 'Rookie',
    current_streak: Number(streakData.current_streak ?? 0),
    longest_streak: Number(streakData.longest_streak ?? 0),
    achievements_unlocked: unlockedCount,
    next_achievement: nextAchievement,
    problems_solved: Number(userData.problems_solved ?? 0),
    courses_completed: Number(userData.courses_completed ?? 0),
  }
}

export async function getQuestProgress(userId: string, frequency: 'daily' | 'weekly'): Promise<QuestProgress[]> {
  const supabase = createClient()
  const bucketDate =
    frequency === 'daily'
      ? new Date().toISOString().slice(0, 10)
      : (() => {
          const now = new Date()
          const day = now.getDay()
          const diff = now.getDate() - day + (day === 0 ? -6 : 1)
          const weekStart = new Date(now.setDate(diff))
          return weekStart.toISOString().slice(0, 10)
        })()

  const { data: quests, error: questError } = await supabase
    .from('quests')
    .select('id, slug, title, description, frequency, target_type, target_count, reward_points, reward_xp')
    .eq('is_active', true)
    .eq('frequency', frequency)

  if (questError) {
    throw new Error(toErrorMessage(questError, 'Failed to load quests'))
  }

  const questIds = (quests || []).map((q: any) => q.id)
  let progressRows: any[] = []

  if (questIds.length > 0) {
    const { data, error } = await supabase
      .from('user_quest_progress')
      .select('quest_id, progress, completed')
      .eq('user_id', userId)
      .eq('bucket_date', bucketDate)
      .in('quest_id', questIds)

    if (error) {
      // If table exists but query fails, default zero progress.
      progressRows = []
    } else {
      progressRows = data || []
    }
  }

  const byQuest = new Map(progressRows.map((p: any) => [p.quest_id, p]))
  return (quests || []).map((q: any) => {
    const progress = byQuest.get(q.id)
    return {
      quest_id: q.id,
      slug: q.slug,
      title: q.title,
      description: q.description,
      frequency: q.frequency,
      target_type: q.target_type,
      target_count: Number(q.target_count ?? 1),
      reward_points: Number(q.reward_points ?? 0),
      reward_xp: Number(q.reward_xp ?? 0),
      progress: Number(progress?.progress ?? 0),
      completed: !!progress?.completed,
    }
  })
}

export async function getRecentPointEvents(userId: string, limit: number = 10) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('point_events')
    .select('id, event_type, xp_delta:points, xp, metadata, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(toErrorMessage(error, 'Failed to load point history'))
  }

  return data || []
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_achievements')
    .select('id, achievement_id, unlocked_at, achievements (code, name, description, icon)')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false })

  if (error) {
    throw new Error(toErrorMessage(error, 'Failed to load achievements'))
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    achievement_id: row.achievement_id,
    code: row.achievements?.code ?? '',
    name: row.achievements?.name ?? 'Achievement',
    description: row.achievements?.description ?? null,
    icon: row.achievements?.icon ?? null,
    unlocked_at: row.unlocked_at,
  }))
}

export async function getStreakMultiplier(userId: string): Promise<number> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_streak_multiplier', { p_user_id: userId })
  if (error) return 1
  const val = Number(data ?? 1)
  return Number.isFinite(val) && val > 0 ? val : 1
}

export async function claimQuizPassReward(topicId: string) {
  void topicId
  return {
    pointsAwarded: 0,
    xpAwarded: 0,
    applied: false,
    message: 'Quiz rewards disabled',
  }
}
