import { createClient } from './supabase'
import { callGeminiAPI } from './gemini'

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

// Generate quiz using Gemini AI
export async function generateQuiz(topicId: string, topicName: string, numQuestions: number) {
  const prompt = `Generate ${numQuestions} multiple choice questions about "${topicName}" for a coding course.
Return ONLY a valid JSON array with no additional text, in this exact format:
[
  {
    "question": "What is...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]
The correctAnswer should be the index (0-3) of the correct option.`;

  try {
    const response = await callGeminiAPI(prompt);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : response;
    const questions = JSON.parse(jsonStr);
    
    return {
      questions: questions.map((q: any, idx: number) => ({
        ...q,
        id: `q${idx + 1}`,
      })),
    };
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw new Error('Failed to generate quiz questions');
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
  userAnswers: number[]
) {
  const supabase = createClient()
  
  const passed = score >= 70
  
  const { data, error } = await supabase
    .from('quiz_responses')
    .insert([
      {
        user_id: userId,
        topic_id: topicId,
        score,
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
