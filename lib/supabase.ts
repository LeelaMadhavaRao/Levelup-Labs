import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Diagnostic logging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Supabase Config:', {
      url: supabaseUrl?.substring(0, 30) + '...',
      keyLength: supabaseAnonKey?.length,
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    })
  }

  // Provide helpful error message if environment variables are not set
  if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
    throw new Error(
      '⚠️ SUPABASE_URL not configured!\n\n' +
      'Please update your .env.local file with actual Supabase credentials:\n' +
      '1. Go to: https://app.supabase.com → Your Project → Settings → API\n' +
      '2. Copy "Project URL" and paste as NEXT_PUBLIC_SUPABASE_URL\n' +
      '3. Copy "anon public" key and paste as NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
      '4. Restart the dev server: npm run dev'
    )
  }

  if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here') {
    throw new Error(
      '⚠️ SUPABASE_ANON_KEY not configured!\n\n' +
      'Please update your .env.local file with actual Supabase credentials.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

export async function getSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signOut() {
  const supabase = createClient()
  return supabase.auth.signOut()
}

// Type exports
export type { User } from '@supabase/supabase-js'
