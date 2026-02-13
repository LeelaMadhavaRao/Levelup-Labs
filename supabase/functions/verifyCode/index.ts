// Edge Function: Verify Code Solution
// Purpose: Validate user's code against test cases using Gemini AI
// Called by: Frontend problem page (Step 5)

// @ts-ignore - Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore - Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Type declaration for Deno global
declare const Deno: any

const GEMINI_API_KEYS = [
  Deno.env.get('GEMINI_API_KEY_1'),
  Deno.env.get('GEMINI_API_KEY_2'),
  Deno.env.get('GEMINI_API_KEY_3'),
  Deno.env.get('GEMINI_API_KEY_4'),
].filter(Boolean) as string[]

let currentKeyIndex = 0

function getNextGeminiApiKey(): string {
  if (GEMINI_API_KEYS.length === 0) {
    throw new Error('No Gemini API keys configured')
  }
  const key = GEMINI_API_KEYS[currentKeyIndex]
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length
  return key
}

async function callGeminiAPI(prompt: string): Promise<string> {
  const maxRetries = GEMINI_API_KEYS.length
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const apiKey = getNextGeminiApiKey()
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 4096,
            },
          }),
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Gemini API error: ${error}`)
      }

      const data = await response.json()
      return data.candidates[0].content.parts[0].text
    } catch (error) {
      lastError = error as Error
      console.error(`Attempt ${attempt + 1} failed:`, error)
    }
  }

  throw lastError || new Error('All API keys exhausted')
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

    // Update solution status and award points if solved
    const { error: updateError } = await supabaseClient
      .from('problem_solutions')
      .update({
        code_solution: code,
        language: language,
        status: allPassed ? 'completed' : 'code_failed',
        code_verified_at: new Date().toISOString(),
        points_awarded: points,
      })
      .eq('user_id', user.id)
      .eq('problem_id', problemId)

    if (updateError) {
      console.error('Failed to update solution:', updateError)
    }

    // Award points to user if all tests passed
    if (allPassed && points > 0) {
      const { error: pointsError } = await supabaseClient.rpc('add_points_to_user', {
        p_user_id: user.id,
        p_points: points,
      })

      if (pointsError) {
        console.error('Failed to award points:', pointsError)
      }
    }

    return new Response(
      JSON.stringify({
        allTestsPassed: allPassed,
        testResults: validation.testResults,
        feedback: validation.feedback,
        pointsAwarded: points,
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
