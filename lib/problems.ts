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
    .upsert(
      {
        user_id: userId,
        problem_id: problemId,
        algorithm_explanation: algorithmExplanation,
        status: 'algorithm_submitted',
      },
      {
        onConflict: 'user_id,problem_id',
        ignoreDuplicates: false,
      }
    )
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

// Submit algorithm explanation and verify with AI (Edge Function)
export async function submitAlgorithmExplanation(
  userId: string,
  problemId: string,
  explanation: string
) {
  const supabase = createClient()
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return {
        error: 'You must be logged in',
        feedback: null,
        isCorrect: false,
        suggestions: null
      }
    }

    const { data, error } = await supabase.functions.invoke('verifyAlgorithm', {
      body: {
        problemId,
        algorithmExplanation: explanation,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (error) {
      return { 
        error: error.message, 
        feedback: null, 
        isCorrect: false,
        suggestions: null 
      }
    }

    return {
      error: null,
      isCorrect: data.isCorrect,
      feedback: data.feedback,
      suggestions: data.suggestions,
    }
  } catch (error) {
    console.error('Error verifying algorithm:', error)
    return { 
      error: 'Failed to verify algorithm', 
      feedback: null, 
      isCorrect: false,
      suggestions: null 
    }
  }
}

// Submit code solution and verify with AI (Edge Function)
export async function submitCode(
  userId: string,
  problemId: string,
  code: string,
  language: string = 'javascript'
) {
  const supabase = createClient()
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return {
        error: 'You must be logged in',
        pointsAwarded: 0,
        allTestsPassed: false,
        testResults: [],
        feedback: null,
      }
    }

    const { data, error } = await supabase.functions.invoke('verifyCode', {
      body: {
        problemId,
        code,
        language,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (error) {
      return { 
        error: error.message, 
        pointsAwarded: 0,
        allTestsPassed: false,
        testResults: [],
        feedback: null,
      }
    }

    return {
      error: null,
      allTestsPassed: data.allTestsPassed,
      testResults: data.testResults,
      feedback: data.feedback,
      pointsAwarded: data.pointsAwarded,
    }
  } catch (error) {
    console.error('Error verifying code:', error)
    return { 
      error: 'Failed to verify code', 
      pointsAwarded: 0,
      allTestsPassed: false,
      testResults: [],
      feedback: null,
    }
  }
}

// Generate coding problems for a topic using AI (Edge Function)
export async function generateProblemsForTopic(
  topicId: string,
  topicName: string,
  numProblems: number
) {
  const supabase = createClient()
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return {
        problems: [],
        error: 'You must be logged in to generate problems',
      }
    }

    const { data, error } = await supabase.functions.invoke('generateProblems', {
      body: {
        topicId,
        topicName,
        numProblems,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (error) {
      throw new Error(error.message || 'Failed to generate problems')
    }

    return {
      problems: data.problems,
      error: null,
    }
  } catch (error) {
    console.error('Error generating problems:', error)
    return {
      problems: [],
      error: 'Failed to generate problems',
    }
  }
}

// Get all problems with optional filtering
export async function getAllProblems(filters?: {
  difficulty?: 'easy' | 'medium' | 'hard'
  userId?: string
}) {
  const supabase = createClient()
  
  let query = supabase
    .from('coding_problems')
    .select(`
      *,
      topics!inner(
        id,
        name,
        modules!inner(
          id,
          title,
          courses!inner(
            id,
            name
          )
        )
      )
    `)
    .order('created_at', { ascending: false })
  
  if (filters?.difficulty) {
    query = query.eq('difficulty', filters.difficulty)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  
  // If userId provided, also fetch user's solutions
  if (filters?.userId && data) {
    const problemIds = data.map(p => p.id)
    const { data: solutions } = await supabase
      .from('problem_solutions')
      .select('problem_id, status')
      .eq('user_id', filters.userId)
      .in('problem_id', problemIds)
    
    // Merge solution status
    return data.map(problem => ({
      ...problem,
      user_status: solutions?.find(s => s.problem_id === problem.id)?.status || null
    }))
  }
  
  return data
}

