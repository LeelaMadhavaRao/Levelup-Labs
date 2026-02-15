// Edge Function: Generate Coding Problems
// Purpose: Generate LeetCode-style coding problems using Gemini API
// Called by: Frontend topic page after quiz completion

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

function getNextGeminiApiKey(): string {
  if (GEMINI_API_KEYS.length === 0) {
    throw new Error('No Gemini API keys configured')
  }
  const key = GEMINI_API_KEYS[currentKeyIndex]
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length
  return key
}

async function callGeminiAPI(prompt: string): Promise<string> {
  let lastError: Error | null = null

  // Try each model (1.5-flash first, then 2.0-flash-exp)
  for (const modelName of MODELS) {
    // For each model, try all API keys using round-robin
    for (let keyAttempt = 0; keyAttempt < GEMINI_API_KEYS.length; keyAttempt++) {
      try {
        const apiKey = getNextGeminiApiKey()
        console.log(`🔑 Trying ${modelName} with API key #${(currentKeyIndex) % GEMINI_API_KEYS.length + 1}`)
        
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: modelName })
        
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        
        console.log(`✅ Success with ${modelName}`)
        return text
      } catch (error) {
        lastError = error as Error
        console.error(`❌ ${modelName} attempt ${keyAttempt + 1} failed:`, (error as Error).message)
      }
    }
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
    const { topicId, topicName, numProblems } = await req.json()

    if (!topicId || !topicName || !numProblems) {
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

    // Generate problems using Gemini
    const prompt = `Generate ${numProblems} LeetCode-style coding problems about "${topicName}".
Return ONLY a valid JSON array with no additional text, in this exact format:
[
  {
    "title": "Problem Title",
    "description": "Detailed problem description with constraints",
    "difficulty": "easy" | "medium" | "hard",
    "examples": [
      {
        "input": "example input",
        "output": "example output",
        "explanation": "why this output"
      }
    ],
    "testCases": [
      {
        "input": "test input",
        "expectedOutput": "expected output"
      }
    ]
  }
]

Requirements:
- Mix difficulties: start easy, then medium, then hard
- Include at least 3 examples per problem
- Include at least 5 test cases per problem (including edge cases)
- Make problems relevant to ${topicName}
- Ensure clear constraints and edge cases`

    const response = await callGeminiAPI(prompt)
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    const jsonStr = jsonMatch ? jsonMatch[0] : response
    const problems = JSON.parse(jsonStr)

    // Store problems in database
    const problemsToInsert = problems.map((problem: any) => ({
      topic_id: topicId,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      examples: problem.examples,
      test_cases: problem.testCases,
    }))

    const { data: insertedProblems, error: insertError } = await supabaseClient
      .from('coding_problems')
      .insert(problemsToInsert)
      .select()

    if (insertError) {
      throw new Error(`Failed to save problems: ${insertError.message}`)
    }

    return new Response(
      JSON.stringify({ problems: insertedProblems }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (error) {
    console.error('Error generating problems:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate problems'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
