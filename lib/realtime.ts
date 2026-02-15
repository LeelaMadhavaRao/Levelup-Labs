import { createClient } from './supabase'

export function subscribeToUserGamification(userId: string, onChange: () => void) {
  const supabase = createClient()
  const channel = supabase
    .channel(`gamification:${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${userId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_streaks', filter: `user_id=eq.${userId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'point_events', filter: `user_id=eq.${userId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard', filter: `user_id=eq.${userId}` }, onChange)
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export function subscribeToLeaderboard(onChange: () => void) {
  const supabase = createClient()
  const channel = supabase
    .channel('leaderboard:global')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_streaks' }, onChange)
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
