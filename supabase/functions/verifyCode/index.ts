// Edge Function: Verify Code Solution
// Purpose: Validate user's code against test cases using Gemini AI
// Called by: Frontend problem page (Step 5)

// @ts-ignore - Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore - Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore - Deno imports
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0'

// Type declaration for Deno global
declare const Deno: any

const GEMINI_API_KEYS = [
  Deno.env.get('GEMINI_API_KEY_1'),
  Deno.env.get('GEMINI_API_KEY_2'),
  Deno.env.get('GEMINI_API_KEY_3'),
  Deno.env.get('GEMINI_API_KEY_4'),
].filter(Boolean) as string[]

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'] // Primary -> Fallback

let currentKeyIndex = 0

async function callGeminiAPI(prompt: string): Promise<string> {
  let lastError: Error | null = null

  // Try each API key in round-robin fashion
  for (let keyAttempt = 0; keyAttempt < GEMINI_API_KEYS.length; keyAttempt++) {
    const apiKey = GEMINI_API_KEYS[currentKeyIndex]
    currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length
    
    // For each key, try both models (primary then fallback)
    for (const modelName of MODELS) {
      try {
        console.log(`🔄 Trying ${modelName} with API key ${keyAttempt + 1}/${GEMINI_API_KEYS.length}`)
        
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: modelName })
        
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        
        console.log(`✅ Success with ${modelName} using key ${keyAttempt + 1}`)
        return text
      } catch (error) {
        lastError = error as Error
        console.error(`❌ ${modelName} with key ${keyAttempt + 1} failed:`, (error as Error).message)
        // Continue to next model with same key
      }
    }
    // If both models failed with this key, continue to next key
  }

  throw lastError || new Error('All API keys and models exhausted')
}

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
    const { problemId, code, language } = await req.json()

    if (!problemId || !code || !language) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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

    // Get problem details
    const { data: problem, error: problemError } = await supabaseClient
      .from('coding_problems')
      .select('*')
      .eq('id', problemId)
      .single()

    if (problemError || !problem) {
      return new Response(
        JSON.stringify({ error: 'Problem not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Verify code with Gemini
    const prompt = `You are a code execution simulator and validator. Analyze if the following code correctly solves the problem for ALL test cases.

PROBLEM:
Title: ${problem.title}
Description: ${problem.description}

TEST CASES:
${JSON.stringify(problem.test_cases, null, 2)}

USER'S CODE (${language}):
${code}

TASK:
1. Mentally execute the code for each test case
2. Check if outputs match expected outputs
3. Identify any errors or edge cases that fail

Respond in JSON format:
{
  "allTestsPassed": true/false,
  "testResults": [
    {
      "testCase": 1,
      "passed": true/false,
      "expectedOutput": "...",
      "actualOutput": "...",
      "error": "error message if any"
    }
  ],
  "feedback": "Overall feedback about the solution"
}

Be strict - even one failing test case means allTestsPassed should be false.`

    const response = await callGeminiAPI(prompt)
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : response
    const validation = JSON.parse(jsonStr)

    const allPassed = validation.allTestsPassed

    // Calculate points based on difficulty (only if all tests passed)
    const difficultyPoints: Record<string, number> = {
      easy: 100,
      medium: 200,
      hard: 300,
    }
    const points = allPassed ? (difficultyPoints[problem.difficulty] || 0) : 0

    // Use service role client to bypass RLS for points operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if solution already exists (for idempotency)
    const { data: existingSolution } = await supabaseAdmin
      .from('problem_solutions')
      .select('points_awarded, status')
      .eq('user_id', user.id)
      .eq('problem_id', problemId)
      .single()

    let pointsAwarded = 0
    let xpAwarded = 0
    let rewardApplied = false

    // Award points FIRST (before updating problem_solutions)
    if (allPassed && points > 0) {
      const alreadyAwarded = existingSolution?.points_awarded > 0 && existingSolution?.status === 'completed'

      if (!alreadyAwarded) {
        // Try RPC first (handles users + leaderboard + ranks)
        const { error: rpcError } = await supabaseAdmin.rpc('add_points_to_user', {
          p_user_id: user.id,
          p_points: points,
          p_problem_id: problemId,
        })

        if (rpcError) {
          console.error('RPC add_points_to_user failed, using direct fallback:', rpcError.message)

          // Direct fallback: update users table and insert point event
          try {
            // Update user points directly
            const { data: currentUser } = await supabaseAdmin
              .from('users')
              .select('total_points, xp, level')
              .eq('id', user.id)
              .single()

            const newTotalPoints = (currentUser?.total_points || 0) + points
            const newXp = (currentUser?.xp || 0) + points
            const newLevel = Math.max(1, Math.floor(newXp / 1000) + 1)

            await supabaseAdmin
              .from('users')
              .update({
                total_points: newTotalPoints,
                xp: newXp,
                level: newLevel,
                updated_at: new Date().toISOString(),
              })
              .eq('id', user.id)

            // Insert point event for XP log tracking
            await supabaseAdmin
              .from('point_events')
              .insert({
                user_id: user.id,
                event_type: 'solve_problem',
                event_key: `solve_problem:${user.id}:${problemId}`,
                points: points,
                xp: points,
                metadata: { problem_id: problemId },
              })

            // Update leaderboard
            await supabaseAdmin
              .from('leaderboard')
              .upsert({
                user_id: user.id,
                total_points: newTotalPoints,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'user_id' })

            pointsAwarded = points
            xpAwarded = points
            rewardApplied = true

            console.log(`✅ Direct fallback: awarded ${points} points to user ${user.id}`)
          } catch (fallbackError) {
            console.error('❌ Direct fallback also failed:', fallbackError)
          }
        } else {
          pointsAwarded = points
          xpAwarded = points
          rewardApplied = true
          console.log(`✅ RPC awarded ${points} points to user ${user.id}`)
        }
      } else {
        pointsAwarded = Number(existingSolution?.points_awarded ?? points)
        xpAwarded = pointsAwarded
      }
    }

    // Now update the solution row with code, status, and points_awarded
    const { error: updateError } = await supabaseAdmin
      .from('problem_solutions')
      .update({
        code_solution: code,
        language: language,
        status: allPassed ? 'completed' : 'code_failed',
        code_verified_at: new Date().toISOString(),
        points_awarded: allPassed ? points : 0,
      })
      .eq('user_id', user.id)
      .eq('problem_id', problemId)

    if (updateError) {
      console.error('Failed to update solution:', updateError)
    }

    // Update problems_solved count on users table
    if (allPassed) {
      // Get the topic_id for this problem
      const topicId = problem.topic_id

      // Check if this problem was already completed before (to avoid double-counting in topic_progress)
      const wasAlreadyCompleted = existingSolution?.status === 'completed'

      // Count actual completed problems to be accurate
      const { data: allSolved } = await supabaseAdmin
        .from('problem_solutions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'completed')

      const actualSolvedCount = allSolved?.length || 0

      await supabaseAdmin
        .from('users')
        .update({ problems_solved: actualSolvedCount })
        .eq('id', user.id)

      // Update topic_progress: increment problems_completed ONLY if this is a new completion
      if (topicId && !wasAlreadyCompleted) {
        try {
          // Count how many problems in this topic the user has completed
          const { data: topicProblems } = await supabaseAdmin
            .from('coding_problems')
            .select('id')
            .eq('topic_id', topicId)

          const topicProblemIds = topicProblems?.map((p: any) => p.id) || []

          const { data: completedInTopic } = await supabaseAdmin
            .from('problem_solutions')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .in('problem_id', topicProblemIds)

          const completedCount = completedInTopic?.length || 0

          // Upsert topic_progress with accurate count
          await supabaseAdmin
            .from('topic_progress')
            .upsert({
              user_id: user.id,
              topic_id: topicId,
              problems_completed: completedCount,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,topic_id',
              ignoreDuplicates: false,
            })

          console.log(`✅ Updated topic_progress: ${completedCount} problems completed in topic ${topicId}`)
        } catch (topicError) {
          console.error('Failed to update topic_progress:', topicError)
          // Don't fail the entire operation if topic progress update fails
        }
      }
    }

    return new Response(
      JSON.stringify({
        allTestsPassed: allPassed,
        testResults: validation.testResults,
        feedback: validation.feedback,
        pointsAwarded,
        xpAwarded,
        rewardApplied,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (error) {
    console.error('Error verifying code:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to verify code'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
