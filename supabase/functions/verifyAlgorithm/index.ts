// Edge Function: Verify Algorithm Explanation
// Purpose: Validate user's algorithm explanation using Gemini AI
// Called by: Frontend problem page (Step 4)

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

function normalizeAiText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeAiText(entry)).filter(Boolean).join('\n')
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

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
      .upsert(
        {
          user_id: user.id,
          problem_id: problemId,
          algorithm_explanation: algorithmExplanation,
          status: validation.isCorrect ? 'algorithm_approved' : 'algorithm_submitted',
          algorithm_verified_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,problem_id',
          ignoreDuplicates: false,
        }
      )

    if (updateError) {
      console.error('Failed to save solution status:', updateError)
    }

    return new Response(
      JSON.stringify({
        isCorrect: validation.isCorrect,
        feedback: normalizeAiText(validation.feedback),
        suggestions: normalizeAiText(validation.suggestions),
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
