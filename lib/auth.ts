import { createClient } from './supabase'
import { generateHunterAvatarUrl } from './avatar'

export { generateHunterAvatarUrl } from './avatar'

function toError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error
  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) {
      return new Error(message)
    }
  }
  return new Error(fallback)
}

function normalizeError(error: unknown) {
  if (!error) return null
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    }
  }
  if (typeof error === 'object') {
    const record = error as Record<string, unknown>
    const code = typeof record.code === 'string' ? record.code : undefined
    const message = typeof record.message === 'string' ? record.message : undefined
    const hint = typeof record.hint === 'string' ? record.hint : undefined
    const details = typeof record.details === 'string' ? record.details : undefined

    if (code || message || hint || details) {
      return { code, message, hint, details }
    }
  }

  return null
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    return { user: null, error: error.message }
  }

  // Get user profile
  const profile = await getUserProfile(data.user.id)
  
  return { user: profile, error: null }
}

// Sign up with email and password  
export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const supabase = createClient()
  const defaultAvatar = generateHunterAvatarUrl(`${email}-${fullName}`)
  
  // Sign up the user with metadata
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })
  
  if (authError) {
    return { user: null, error: authError.message, needsConfirmation: false }
  }
  
  // Check if email confirmation is required
  const needsConfirmation = authData.user && !authData.session
  
  // If user is created without confirmation (session exists), create profile immediately
  // only when a stable authenticated session is available for PostgREST writes.
  if (authData.user && authData.session) {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const hasStableSession =
        !!sessionData.session &&
        sessionData.session.user?.id === authData.user.id &&
        typeof sessionData.session.access_token === 'string' &&
        sessionData.session.access_token.length > 0

      if (!hasStableSession) {
        return {
          user: authData.user,
          error: null,
          needsConfirmation,
        }
      }

      // Create user profile in public.users table
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: authData.user.email,
            full_name: fullName,
            avatar_url: defaultAvatar,
            role: 'user',
          },
        ])
        .select()
      
      // Ignore duplicate key errors (profile already exists)
      if (profileError && profileError.code !== '23505') {
        console.error('Error creating user profile:', profileError)
        // Don't fail signup if profile creation fails - it will be created later via getUserProfile fallback
      }
    } catch (error) {
      console.error('Error creating user profile:', error)
    }
  }
  
  return { 
    user: authData.user, 
    error: null, 
    needsConfirmation 
  }
}

// Get current user
export async function getCurrentUser() {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null
    
    return await getUserProfile(user.id)
  } catch (error) {
    const normalized = normalizeError(error)
    if (normalized) {
      console.error('Error getting current user:', normalized)
    }
    return null
  }
}

// Sign out
export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export async function loginWithEmail(email: string, password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw toError(error, 'Login failed')
  return data
}

export async function loginWithGoogle() {
  const supabase = createClient()

  const allowedOAuthOrigins = [
    'https://levelup-labs-ten.vercel.app',
    'https://levelup-labs-mvfl.vercel.app',
  ]

  const browserOrigin =
    typeof window !== 'undefined' && typeof window.location?.origin === 'string'
      ? window.location.origin
      : ''
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL || ''

  const siteUrl =
    (browserOrigin && allowedOAuthOrigins.includes(browserOrigin) ? browserOrigin : '') ||
    (envOrigin && allowedOAuthOrigins.includes(envOrigin) ? envOrigin : '') ||
    allowedOAuthOrigins[0]

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  })
  
  if (error) throw toError(error, 'Google login failed')
  return data
}

export async function getUserRole(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  
  if (error) throw toError(error, 'Failed to load user role')
  return data?.role
}

export async function getUserProfile(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  
  if (error) {
    const message = error.message?.toLowerCase() || ''
    if (error.code === '42501' || message.includes('permission denied')) {
      return null
    }
    throw toError(error, 'Failed to load user profile')
  }
  
  if (data) {
    const hasLegacyGeneratedAvatar =
      typeof data.avatar_url === 'string' &&
      data.avatar_url.includes('api.dicebear.com')

    if (!data.avatar_url || hasLegacyGeneratedAvatar) {
      const generatedAvatar = generateHunterAvatarUrl(`${data.id}-${data.email}-${data.full_name || 'hunter'}`)
      const { data: updated } = await supabase
        .from('users')
        .update({ avatar_url: generatedAvatar })
        .eq('id', data.id)
        .select('*')
        .maybeSingle()

      return updated || { ...data, avatar_url: generatedAvatar }
    }
    return data
  }
  
  // If profile missing, create it from auth user metadata
  const { data: authData } = await supabase.auth.getUser()
  const authUser = authData.user
  if (!authUser) return null

  const { data: sessionData } = await supabase.auth.getSession()
  const hasStableSession =
    !!sessionData.session &&
    sessionData.session.user?.id === authUser.id &&
    typeof sessionData.session.access_token === 'string' &&
    sessionData.session.access_token.length > 0
  
  const fullName =
    (authUser.user_metadata?.full_name as string) ||
    (authUser.user_metadata?.fullName as string) ||
    authUser.email?.split('@')[0] ||
    'User'
  const defaultAvatar = generateHunterAvatarUrl(`${authUser.id}-${authUser.email}-${fullName}`)

  if (!hasStableSession) {
    return {
      id: authUser.id,
      email: authUser.email,
      full_name: fullName,
      avatar_url: defaultAvatar,
      role: 'user',
      total_xp: 0,
      total_points: 0,
      xp: 0,
      level: 1,
      title: 'Rookie',
      rank: null,
      courses_completed: 0,
      problems_solved: 0,
      bio: null,
      github_username: null,
      linkedin_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
  
  const { error: insertError } = await supabase
    .from('users')
    .insert([
      {
        id: authUser.id,
        email: authUser.email,
        full_name: fullName,
        avatar_url: defaultAvatar,
        role: 'user',
      },
    ])
  
  if (insertError) {
    const message = insertError.message?.toLowerCase() || ''
    
    // Handle permission denied
    if (insertError.code === '42501' || message.includes('permission denied')) {
      return null
    }
    
    // Handle duplicate key (profile already exists from another request/trigger)
    if (insertError.code === '23505' || message.includes('duplicate')) {
      const { data: existing } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()
      return existing || null
    }
    
    throw toError(insertError, 'Failed to create user profile')
  }
  
  const { data: refreshed } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle()
  
  return refreshed || null
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: {
    full_name?: string
    bio?: string
    avatar_url?: string
    github_username?: string
    linkedin_url?: string
  }
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
  
  return { data, error: error ? error.message : null }
}

// Request password reset
export async function requestPasswordReset(email: string) {
  const supabase = createClient()
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
  
  return { error: error ? error.message : null }
}

// Reset password (Supabase handles token automatically via session from redirect)
export async function resetPassword(_token: string, newPassword: string) {
  const supabase = createClient()
  
  // The token from the reset email is automatically exchanged for a session
  // by the Supabase client when the user lands on the reset page.
  // We just need to call updateUser with the new password.
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  
  return { error: error ? error.message : null }
}
