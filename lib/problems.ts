import { createClient } from './supabase'

export interface CodingProblem {
  id: string
  topic_id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  examples: any[]
  test_cases: any[]
  created_at: string
}

// Get topic problems with user status
export async function getTopicProblems(topicId: string, userId?: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('coding_problems')
    .select(`
      *,
      problem_solutions!left(status)
    `)
    .eq('topic_id', topicId)
  
  if (error) throw error
  return data as any[]
}

// Get topic
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

export async function getProblemsByTopic(topicId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('coding_problems')
    .select('*')
    .eq('topic_id', topicId)
  
  if (error) throw error
  return data as CodingProblem[]
}

export async function getProblemById(problemId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('coding_problems')
    .select('*')
    .eq('id', problemId)
    .single()
  
  if (error) throw error
  return data as CodingProblem
}

export async function createProblem(
  topicId: string,
  title: string,
  description: string,
  difficulty: 'easy' | 'medium' | 'hard',
  examples: any[],
  testCases: any[]
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('coding_problems')
    .insert([
      {
        topic_id: topicId,
        title,
        description,
        difficulty,
        examples,
        test_cases: testCases,
      },
    ])
    .select()
  
  if (error) throw error
  return data
}

export async function submitProblemSolution(
  userId: string,
  problemId: string,
  algorithmExplanation: string
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('problem_solutions')
    .upsert([
      {
        user_id: userId,
        problem_id: problemId,
        algorithm_explanation: algorithmExplanation,
        status: 'algorithm_submitted',
      },
    ])
    .select()
  
  if (error) throw error
  return data
}

export async function getProblemSolution(userId: string, problemId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('problem_solutions')
    .select('*')
    .eq('user_id', userId)
    .eq('problem_id', problemId)
    .single()
  
  if (error && error.code === 'PGRST116') {
    return null // Not found
  }
  
  if (error) throw error
  return data
}

export async function updateSolutionWithCode(
  userId: string,
  problemId: string,
  code: string,
  status: string
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('problem_solutions')
    .update({
      code_solution: code,
      status,
      code_verified_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('problem_id', problemId)
    .select()
  
  if (error) throw error
  return data
}

export async function getPointsForProblem(difficulty: 'easy' | 'medium' | 'hard') {
  const points: Record<string, number> = {
    easy: 100,
    medium: 200,
    hard: 300,
  }
  return points[difficulty] || 0
}

export async function getSolvedProblems(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('problem_solutions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
  
  if (error) throw error
  return data
}

export async function getUserProblemsSolvedInCourse(userId: string, courseId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc(
    'get_user_problems_solved_in_course',
    { p_user_id: userId, p_course_id: courseId }
  )
  
  if (error) {
    // Fallback if function doesn't exist
    return []
  }
  
  return data || []
}

// Submit algorithm explanation
export async function submitAlgorithmExplanation(
  userId: string,
  problemId: string,
  explanation: string
) {
  const supabase = createClient()
  
  // In production, this would call Gemini API to validate the explanation
  // For now, we'll do a simple validation
  const isCorrect = explanation.length > 100 // Simple check
  const pointsAwarded = isCorrect ? 50 : 0
  
  const { data, error } = await supabase
    .from('problem_solutions')
    .upsert([
      {
        user_id: userId,
        problem_id: problemId,
        algorithm_explanation: explanation,
        status: isCorrect ? 'algorithm_submitted' : 'in_progress',
      },
    ])
    .select()
  
  if (error) {
    return { error: error.message, feedback: null, pointsAwarded: 0 }
  }
  
  // Award points if correct
  if (isCorrect && pointsAwarded > 0) {
    await supabase
      .from('users')
      .update({ points: supabase.raw(`points + ${pointsAwarded}`) })
      .eq('id', userId)
  }
  
  return {
    error: null,
    pointsAwarded,
    feedback: {
      isCorrect,
      feedback: isCorrect 
        ? 'Great explanation! You have a good understanding of the algorithm.'
        : 'Your explanation needs more detail. Try to explain the approach, algorithm steps, time complexity, and space complexity.',
    },
  }
}

// Submit code solution
export async function submitCode(
  userId: string,
  problemId: string,
  code: string
) {
  const supabase = createClient()
  
  // Get problem details for points calculation
  const problem = await getProblemById(problemId)
  const pointsAwarded = await getPointsForProblem(problem.difficulty)
  
  const { data, error } = await supabase
    .from('problem_solutions')
    .upsert([
      {
        user_id: userId,
        problem_id: problemId,
        code_solution: code,
        status: 'completed',
        code_verified_at: new Date().toISOString(),
      },
    ])
    .select()
  
  if (error) {
    return { error: error.message, pointsAwarded: 0 }
  }
  
  // Award points
  await supabase.rpc('award_points', {
    p_user_id: userId,
    p_points: pointsAwarded,
  })
  
  return {
    error: null,
    pointsAwarded,
  }
}
