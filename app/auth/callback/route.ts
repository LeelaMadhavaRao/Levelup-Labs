import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    // If email confirmation, create user profile if it doesn't exist
    if (!error && data?.user) {
      const userId = data.user.id
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle()
      
      // Create profile if it doesn't exist
      if (!existingProfile) {
        const fullName = 
          (data.user.user_metadata?.full_name as string) ||
          (data.user.user_metadata?.fullName as string) ||
          data.user.email?.split('@')[0] ||
          'User'
        
        await supabase
          .from('users')
          .insert([
            {
              id: userId,
              email: data.user.email,
              full_name: fullName,
              role: 'user',
            },
          ])
      }
    }
  }

  // Redirect to dashboard after successful OAuth login or email confirmation
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
