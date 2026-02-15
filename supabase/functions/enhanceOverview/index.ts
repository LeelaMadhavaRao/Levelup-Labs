// Edge Function: Enhance Topic Overview
// Purpose: Enhance admin-provided topic overview using Gemini AI
// Called by: Frontend watch page when user clicks "Topic Overview"

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

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash']

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

  for (const modelName of MODELS) {
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
    const { topicName, overview } = await req.json()

    if (!topicName || !overview) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: topicName and overview' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Validate user is authenticated
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
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

    // Enhance overview using Gemini
    const prompt = `You are an expert programming instructor. Given the following topic and its overview, create an enhanced, comprehensive learning overview that students will see before studying this topic.

Topic: "${topicName}"

Admin-provided Overview:
"${overview}"

Create an enhanced overview that includes:
1. **What You'll Learn** — A clear summary of the key concepts covered
2. **Why It Matters** — Real-world relevance and practical applications
3. **Key Concepts** — Bullet points of the main technical concepts
4. **Prerequisites** — What the student should already know
5. **Learning Tips** — Quick tips for mastering this topic

Format the response in clean markdown. Keep it concise but informative (around 300-400 words). Make it engaging and motivating for students.
Do NOT include any code blocks or examples — just conceptual overview.`

    const enhancedOverview = await callGeminiAPI(prompt)

    return new Response(
      JSON.stringify({ enhancedOverview }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (error) {
    console.error('Error enhancing overview:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to enhance overview'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
