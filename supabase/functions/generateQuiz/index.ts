// Edge Function: Generate AI Quiz
// Purpose: Generate MCQ quiz questions using Gemini API
// Called by: Frontend quiz page

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
    console.log('🔵 Incoming request to generateQuiz')
    
    const { topicId, topicName, numQuestions } = await req.json()
    
    console.log('📦 Request body:', { topicId, topicName, numQuestions })

    if (!topicId || !topicName || !numQuestions) {
      console.log('❌ Missing required fields')
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Log all headers for debugging
    console.log('📋 Request headers:')
    req.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('auth') || key.toLowerCase().includes('apikey')) {
        console.log(`  ${key}: ${value.substring(0, 20)}...`)
      } else {
        console.log(`  ${key}: ${value}`)
      }
    })

    // Validate user is authenticated
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
    console.log('🔑 Auth header check:', {
      hasAuthHeader: !!authHeader,
      headerPreview: authHeader ? authHeader.substring(0, 30) + '...' : 'null',
      startsWithBearer: authHeader?.startsWith('Bearer '),
    })
    
    if (!authHeader) {
      console.log('❌ Missing authorization header')
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    console.log('🔧 Creating Supabase client with auth header')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    console.log('👤 Verifying user...')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    console.log('👤 User verification result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
    })
    
    if (!user) {
      console.log('❌ User verification failed - Unauthorized')
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          details: authError?.message || 'Failed to verify user',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    console.log('✅ User authenticated, generating quiz...')

    // Generate quiz using Gemini
    const prompt = `Generate ${numQuestions} multiple choice questions about "${topicName}" for a coding course.
Return ONLY a valid JSON array with no additional text, in this exact format:
[
  {
    "question": "What is...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]
The correctAnswer should be the index (0-3) of the correct option. Make questions progressively challenging.`

    const response = await callGeminiAPI(prompt)
    console.log('🤖 Gemini response received, parsing...')
    
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    const jsonStr = jsonMatch ? jsonMatch[0] : response
    const questions = JSON.parse(jsonStr)

    // Add IDs to questions
    const questionsWithIds = questions.map((q: any, idx: number) => ({
      ...q,
      id: `q${idx + 1}`,
    }))

    console.log(`✅ Successfully generated ${questionsWithIds.length} quiz questions`)

    return new Response(
      JSON.stringify({ questions: questionsWithIds }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (error) {
    console.error('💥 Error generating quiz:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate quiz'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
