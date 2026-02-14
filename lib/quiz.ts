import { createClient } from './supabase'

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

// Generate quiz using Edge Function (server-side Gemini AI)
export async function generateQuiz(topicId: string, topicName: string, numQuestions: number) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.functions.invoke('generateQuiz', {
      body: {
        topicId,
        topicName,
        numQuestions,
      },
    })

    if (error) {
      console.error('Error generating quiz:', error)
      throw new Error(error.message || 'Failed to generate quiz questions')
    }

    return {
      questions: data.questions,
    }
  } catch (error) {
    console.error('Error generating quiz:', error)
    throw new Error('Failed to generate quiz questions')
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
