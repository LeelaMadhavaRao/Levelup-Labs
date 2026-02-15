// Edge Function: Update User Points
// Purpose: Award points for problem solving and course completion
// Called by: verifyCode function and course completion logic

// @ts-ignore - Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore - Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Type declaration for Deno global
declare const Deno: any

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: CORS_HEADERS,
    })
  }

  try {
    const { action, courseId, topicId } = await req.json()

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing action type' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      )
    }

    // Validate user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
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
        { status: 401, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      )
    }

    const awardEvent = async (
      eventType: string,
      eventKey: string,
      points: number,
      xp: number,
      metadata: Record<string, unknown>,
    ) => {
      const { data, error } = await supabaseClient.rpc('award_points_event', {
        p_user_id: user.id,
        p_event_type: eventType,
        p_event_key: eventKey,
        p_points: points,
        p_xp: xp,
        p_metadata: metadata,
      })

      if (error) {
        throw new Error(`Failed to award points: ${error.message}`)
      }

      if (Array.isArray(data) && data.length > 0) {
        return {
          pointsAwarded: data[0]?.points_awarded || 0,
          xpAwarded: data[0]?.xp_awarded || 0,
          applied: !!data[0]?.applied,
        }
      }

      return {
        pointsAwarded: 0,
        xpAwarded: 0,
        applied: false,
      }
    }

    if (action === 'complete_course') {
      if (!courseId) {
        return new Response(
          JSON.stringify({ error: 'Missing courseId' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
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
          { status: 404, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
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
            xpAwarded: 0,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
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

      const rewardResult = await awardEvent(
        'complete_course',
        `complete_course:${user.id}:${courseId}`,
        rewardPoints,
        rewardPoints * 2,
        { course_id: courseId, source: 'updatePoints' },
      )

      await supabaseClient
        .from('user_courses')
        .update({ completion_points_awarded: rewardResult.pointsAwarded })
        .eq('user_id', user.id)
        .eq('course_id', courseId)

      return new Response(
        JSON.stringify({
          message: 'Course completed successfully',
          pointsAwarded: rewardResult.pointsAwarded,
          xpAwarded: rewardResult.xpAwarded,
          applied: rewardResult.applied,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      )
    }

    if (action === 'pass_quiz') {
      if (!topicId) {
        return new Response(
          JSON.stringify({ error: 'Missing topicId' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
        )
      }

      const basePoints = 40
      const rewardResult = await awardEvent(
        'pass_quiz',
        `pass_quiz:${user.id}:${topicId}`,
        basePoints,
        basePoints,
        { topic_id: topicId, source: 'updatePoints' },
      )

      return new Response(
        JSON.stringify({
          message: rewardResult.applied ? 'Quiz reward granted' : 'Quiz reward already claimed',
          pointsAwarded: rewardResult.pointsAwarded,
          xpAwarded: rewardResult.xpAwarded,
          applied: rewardResult.applied,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    )
  } catch (error) {
    console.error('Error updating points:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update points'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    )
  }
})
