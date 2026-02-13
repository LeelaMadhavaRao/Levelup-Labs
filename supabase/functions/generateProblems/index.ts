// Edge Function: Generate Coding Problems
// Purpose: Generate LeetCode-style coding problems using Gemini API
// Called by: Frontend topic page after quiz completion

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
              temperature: 0.8,
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
