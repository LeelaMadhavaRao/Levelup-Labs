import { createClient } from './supabase'

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
  
  // User profile will be created automatically by database trigger after email confirmation
  return { 
    user: authData.user, 
    error: null, 
    needsConfirmation 
  }
}

// Get current user
export async function getCurrentUser() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  return await getUserProfile(user.id)
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
  
  if (error) throw error
  return data
}

export async function signupWithEmail(email: string, password: string, fullName: string) {
  const supabase = createClient()
  
  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (authError) throw authError
  
  // Create user profile
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          full_name: fullName,
          role: 'user',
        },
      ])
    
    if (profileError) throw profileError
  }
  
  return authData
}

export async function loginWithGoogle() {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  
  if (error) throw error
  return data
}

export async function getUserRole(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data?.role
}

export async function getUserProfile(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
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

// Reset password with token
export async function resetPassword(token: string, newPassword: string) {
  const supabase = createClient()
  
  // The token is automatically validated by Supabase
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  
  return { error: error ? error.message : null }
}
