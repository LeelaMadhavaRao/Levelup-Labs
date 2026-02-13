// Edge Function: Verify Algorithm Explanation
// Purpose: Validate user's algorithm explanation using Gemini AI
// Called by: Frontend problem page (Step 4)

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
              temperature: 0.3,
              maxOutputTokens: 2048,
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
    const { problemId, algorithmExplanation } = await req.json()

    if (!problemId || !algorithmExplanation) {
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

    // Verify algorithm with Gemini
    const prompt = `You are an expert algorithm validator. Analyze if the following algorithm explanation correctly solves the given problem.

PROBLEM:
Title: ${problem.title}
Description: ${problem.description}
Difficulty: ${problem.difficulty}

USER'S ALGORITHM EXPLANATION:
${algorithmExplanation}

Evaluate:
1. Does the algorithm logically solve the problem?
2. Are edge cases considered?
3. Is the approach correct and efficient?

Respond in JSON format:
{
  "isCorrect": true/false,
  "feedback": "Detailed feedback explaining why it's correct or what's missing/wrong",
  "suggestions": "Suggestions for improvement (if any)"
}

Be strict but fair. Minor wording issues are okay, but the core logic must be sound.`

    const response = await callGeminiAPI(prompt)
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : response
    const validation = JSON.parse(jsonStr)

    // Update problem solution status
    const { error: updateError } = await supabaseClient
      .from('problem_solutions')
      .upsert({
        user_id: user.id,
        problem_id: problemId,
        algorithm_explanation: algorithmExplanation,
        status: validation.isCorrect ? 'algorithm_approved' : 'algorithm_submitted',
        algorithm_verified_at: new Date().toISOString(),
      })

    if (updateError) {
      console.error('Failed to save solution status:', updateError)
    }

    return new Response(
      JSON.stringify({
        isCorrect: validation.isCorrect,
        feedback: validation.feedback,
        suggestions: validation.suggestions,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (error) {
    console.error('Error verifying algorithm:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to verify algorithm'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
