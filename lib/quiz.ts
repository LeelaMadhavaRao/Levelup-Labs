import { createClient } from './supabase'

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

function buildFallbackQuiz(topicName: string, numQuestions: number, topicOverview?: string): QuizQuestion[] {
  const safeTopic = topicName?.trim() || 'this topic'
  const overviewSnippet = (topicOverview || '').slice(0, 220)

  const bank: QuizQuestion[] = [
    {
      id: 'fallback-1',
      question: `What is the primary goal when solving problems in ${safeTopic}?`,
      options: [
        'Understand constraints and choose the right approach before coding',
        'Write code immediately without reviewing input/output',
        'Skip edge cases and optimize later',
        'Memorize one solution for every problem',
      ],
      correctAnswer: 0,
    },
    {
      id: 'fallback-2',
      question: 'Which step is best before submitting a coding solution?',
      options: [
        'Run through examples and edge cases',
        'Only check formatting',
        'Assume tests will pass if code compiles',
        'Remove all comments and submit',
      ],
      correctAnswer: 0,
    },
    {
      id: 'fallback-3',
      question: 'Why are constraints important in algorithmic problems?',
      options: [
        'They help determine feasible time and space complexity',
        'They are only used for grading style',
        'They can be ignored for small inputs',
        'They only matter in production systems',
      ],
      correctAnswer: 0,
    },
    {
      id: 'fallback-4',
      question: `Based on the topic context, what should you prioritize? ${overviewSnippet ? `(Hint: ${overviewSnippet}...)` : ''}`,
      options: [
        'Core concepts, correctness, and clear reasoning',
        'Maximum code length',
        'Using every language feature possible',
        'Skipping explanation and tests',
      ],
      correctAnswer: 0,
    },
    {
      id: 'fallback-5',
      question: 'What is a strong debugging strategy when tests fail?',
      options: [
        'Inspect one failing case at a time and trace state changes',
        'Randomly rewrite large parts of the solution',
        'Ignore failures from corner cases',
        'Only test with one simple input',
      ],
      correctAnswer: 0,
    },
  ]

  return bank.slice(0, Math.max(1, numQuestions))
}

function isQuotaOrRateLimitError(status: number, message: string) {
  const text = message.toLowerCase()
  return (
    status === 429 ||
    text.includes('quota exceeded') ||
    text.includes('too many requests') ||
    text.includes('rate limit')
  )
}

function toError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error
  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) {
      return new Error(message)
    }
  }
  return new Error(fallback)
}

// Generate quiz using Edge Function (server-side Gemini AI)
export async function generateQuiz(topicId: string, topicName: string, numQuestions: number, topicOverview?: string) {
  const supabase = createClient()

  try {
    // Refresh session to ensure it's current
    const { data: { session }, error: sessionError } = await supabase.auth.refreshSession()
    
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

    if (!response.ok) {
      const errorText = await response.text()

      if (isQuotaOrRateLimitError(response.status, errorText)) {
        console.warn('⚠️ Quiz AI quota/rate limit reached. Using fallback quiz questions.')
        return {
          questions: buildFallbackQuiz(topicName, numQuestions, topicOverview),
          error: null,
          warning: 'AI quota reached. Loaded fallback quiz questions.',
        }
      }

      console.error('❌ Function error:', errorText)
      return {
        questions: null,
        error: `Edge Function failed with status ${response.status}: ${errorText}`,
      }
    }

    const data = await response.json()
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

    if (isQuotaOrRateLimitError(429, errorMessage)) {
      return {
        questions: buildFallbackQuiz(topicName, numQuestions, topicOverview),
        error: null,
        warning: 'AI quota reached. Loaded fallback quiz questions.',
      }
    }

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
  
  if (error) throw toError(error, 'Failed to load topic')
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
  
  if (error) throw toError(error, 'Failed to submit quiz response')
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
  
  if (error) throw toError(error, 'Failed to load quiz response')
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
