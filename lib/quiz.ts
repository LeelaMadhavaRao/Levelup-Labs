import { createClient } from './supabase'

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

// Generate quiz using Edge Function (server-side Gemini AI)
export async function generateQuiz(topicId: string, topicName: string, numQuestions: number, topicOverview?: string) {
  const supabase = createClient()

  try {
    // Refresh session to ensure it's current
    const { data: { session }, error: sessionError } = await supabase.auth.refreshSession()
    
    console.log('🔍 Session check (after refresh):', { 
      hasSession: !!session, 
      hasToken: !!session?.access_token,
      tokenPreview: session?.access_token?.substring(0, 20) + '...',
      sessionError 
    })
    
    if (!session) {
      console.error('❌ No session found - user may not be logged in')
      return {
        questions: null,
        error: 'You must be logged in to generate a quiz. Please refresh and try again.',
      }
    }

    if (!session.access_token) {
      console.error('❌ Session exists but no access token')
      return {
        questions: null,
        error: 'Authentication token missing. Please log out and log back in.',
      }
    }

    console.log('✅ Invoking generateQuiz via direct fetch')

    // Use direct fetch to have full control over headers
    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generateQuiz`
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({
        topicId,
        topicName,
        numQuestions,
        topicOverview: topicOverview || '',
      }),
    })

    console.log('📡 Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Function error:', errorText)
      return {
        questions: null,
        error: `Edge Function failed with status ${response.status}: ${errorText}`,
      }
    }

    const data = await response.json()
    console.log('📡 Function response:', { hasData: !!data, hasQuestions: !!data?.questions })

    if (!data || !data.questions) {
      return {
        questions: null,
        error: 'Edge Function returned invalid data',
      }
    }

    return {
      questions: data.questions,
      error: null,
    }
  } catch (error) {
    console.error('Error generating quiz:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      questions: null,
      error: `Failed to generate quiz: ${errorMessage}`,
    }
  }
}

// Get topic info
export async function getTopic(topicId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('id', topicId)
    .single()
  
  if (error) throw error
  return data
}

export async function submitQuizResponse(
  userId: string,
  topicId: string,
  score: number,
  userAnswers: number[],
  questions: Array<{ question: string; options: string[]; correctAnswer: number }>
) {
  const supabase = createClient()
  
  const passed = score >= 70
  
  // Build quiz_data JSONB with questions and user answers
  const quiz_data = {
    questions: questions.map((q, index) => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      userAnswer: userAnswers[index],
    })),
    timestamp: new Date().toISOString(),
  }
  
  const { data, error } = await supabase
    .from('quiz_responses')
    .insert([
      {
        user_id: userId,
        topic_id: topicId,
        quiz_data,
        score,
        total_questions: questions.length,
        passed,
      },
    ])
    .select()
  
  if (error) throw error
  return data
}

export async function getQuizResponse(userId: string, topicId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('quiz_responses')
    .select('*')
    .eq('user_id', userId)
    .eq('topic_id', topicId)
    .order('attempted_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error && error.code === 'PGRST116') {
    return null // Not found
  }
  
  if (error) throw error
  return data
}

export async function hasUserPassedQuiz(userId: string, topicId: string) {
  const response = await getQuizResponse(userId, topicId)
  return response?.passed || false
}

export async function calculateQuizScore(
  userAnswers: number[],
  correctAnswers: number[]
): Promise<number> {
  let score = 0
  
  for (let i = 0; i < userAnswers.length; i++) {
    if (userAnswers[i] === correctAnswers[i]) {
      score++
    }
  }
  
  return score
}
