// Edge Function: Update User Points
// Purpose: Award points for problem solving and course completion
// Called by: verifyCode function and course completion logic

// @ts-ignore - Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore - Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Type declaration for Deno global
declare const Deno: any

serve(async (req: Request) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { action, courseId } = await req.json()

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing action type' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Validate user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    if (action === 'complete_course') {
      if (!courseId) {
        return new Response(
          JSON.stringify({ error: 'Missing courseId' }),
          { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }

      // Get course details
      const { data: course, error: courseError } = await supabaseClient
        .from('courses')
        .select('completion_reward_points')
        .eq('id', courseId)
        .single()

      if (courseError || !course) {
        return new Response(
          JSON.stringify({ error: 'Course not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }

      // Check if user has already completed this course
      const { data: existingCompletion } = await supabaseClient
        .from('user_courses')
        .select('completed_at, completion_points_awarded')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single()

      if (existingCompletion?.completed_at) {
        return new Response(
          JSON.stringify({ 
            message: 'Course already completed',
            pointsAwarded: 0,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }

      // Mark course as completed and award points
      const rewardPoints = course.completion_reward_points || 0
      
      const { error: updateError } = await supabaseClient
        .from('user_courses')
        .update({
          completed_at: new Date().toISOString(),
          completion_points_awarded: rewardPoints,
        })
        .eq('user_id', user.id)
        .eq('course_id', courseId)

      if (updateError) {
        throw new Error(`Failed to mark course complete: ${updateError.message}`)
      }

      // Add points to user's total
      if (rewardPoints > 0) {
        const { error: pointsError } = await supabaseClient.rpc('add_points_to_user', {
          p_user_id: user.id,
          p_points: rewardPoints,
        })

        if (pointsError) {
          throw new Error(`Failed to award points: ${pointsError.message}`)
        }
      }

      return new Response(
        JSON.stringify({
          message: 'Course completed successfully',
          pointsAwarded: rewardPoints,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (error) {
    console.error('Error updating points:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update points'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
