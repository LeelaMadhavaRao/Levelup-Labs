import { createClient } from './supabase'

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

export async function createCourse(data: {
  admin_id: string
  name: string
  description: string
  thumbnail_url?: string
  completion_reward_points?: number
}) {
  const supabase = createClient()
  
  const { data: course, error } = await supabase
    .from('courses')
    .insert([data])
    .select()
    .single()
  
  return { course, error: error ? error.message : null }
}

export async function getAllCourses() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      modules (
        id,
        topics (
          id,
          coding_problems (id)
        )
      ),
      user_courses (user_id)
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching courses:', error)
    return []
  }
  
  // Calculate counts
  return (data || []).map((course: any) => ({
    ...course,
    module_count: course.modules?.length || 0,
    topic_count: course.modules?.reduce((acc: number, m: any) => acc + (m.topics?.length || 0), 0) || 0,
    problem_count: course.modules?.reduce((acc: number, m: any) => 
      acc + (m.topics?.reduce((t: number, topic: any) => t + (topic.coding_problems?.length || 0), 0) || 0), 0) || 0,
    student_count: course.user_courses?.length || 0,
  }))
}

export async function getCourseById(courseId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()
  
  if (error) throw toError(error, 'Failed to load course')
  return data
}

export async function getCourseWithModules(courseId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      modules (
        id,
        name,
        title,
        description,
        order_index,
        order,
        topics (
          id,
          name,
          description,
          video_url,
          order_index,
          num_mcqs,
          num_problems
        )
      )
    `)
    .eq('id', courseId)
    .single()
  
  if (error) throw toError(error, 'Failed to load course modules')
  return data
}

export async function getUserCourses(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_courses')
    .select('*')
    .eq('user_id', userId)
  
  if (error) return []
  return data || []
}

export async function registerForCourse(userId: string, courseId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_courses')
    .insert([
      {
        user_id: userId,
        course_id: courseId,
      },
    ])
    .select()
  
  return { data, error: error ? error.message : null }
}

export async function unregisterFromCourse(userId: string, courseId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('user_courses')
    .delete()
    .eq('user_id', userId)
    .eq('course_id', courseId)
  
  return { error: error ? error.message : null }
}

export async function isUserRegisteredForCourse(userId: string, courseId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_courses')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()
  
  if (error && error.code === 'PGRST116') {
    return false // Not found
  }
  
  if (error) throw toError(error, 'Failed to check course registration')
  return !!data
}

export async function getCourseModules(courseId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order', { ascending: true })
  
  if (error) throw toError(error, 'Failed to load modules')
  return data
}

export async function addModule(courseId: string, title: string, order: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('modules')
    .insert([
      {
        course_id: courseId,
        title,
        name: title,
        order,
        order_index: order,
      },
    ])
    .select()
  
  if (error) throw toError(error, 'Failed to create module')
  return data
}

export async function getModuleTopics(moduleId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('module_id', moduleId)
  
  if (error) throw toError(error, 'Failed to load module topics')
  return data
}

export async function addTopic(
  moduleId: string,
  name: string,
  videoUrl: string,
  numMcqs: number,
  numProblems: number
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('topics')
    .insert([
      {
        module_id: moduleId,
        name,
        video_url: videoUrl,
        num_mcqs: numMcqs,
        num_problems: numProblems,
      },
    ])
    .select()
  
  if (error) throw toError(error, 'Failed to create topic')
  return data
}

export async function getTopicById(topicId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('id', topicId)
    .single()
  
  if (error) throw toError(error, 'Failed to load topic')
  return data
}

// Additional helper functions for pages

export async function getTopic(topicId: string) {
  return getTopicById(topicId)
}

export async function getCoursesByAdmin(adminId: string) {
  const supabase = createClient()
  
  // Show ALL courses to any admin (not filtered by admin_id)
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      modules (
        id,
        topics (
          id,
          coding_problems (id)
        )
      ),
      user_courses (user_id)
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw toError(error, 'Failed to load admin courses')
  
  // Calculate counts
  return (data || []).map((course: any) => ({
    ...course,
    module_count: course.modules?.length || 0,
    topic_count: course.modules?.reduce((acc: number, m: any) => acc + (m.topics?.length || 0), 0) || 0,
    problem_count: course.modules?.reduce((acc: number, m: any) => 
      acc + (m.topics?.reduce((t: number, topic: any) => t + (topic.coding_problems?.length || 0), 0) || 0), 0) || 0,
    student_count: course.user_courses?.length || 0,
  }))
}

export async function deleteCourse(courseId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId)
  
  return { error: error ? error.message : null }
}

export async function updateCourse(courseId: string, data: {
  name?: string
  description?: string
  thumbnail_url?: string
  completion_reward_points?: number
}) {
  const supabase = createClient()
  
  const { data: course, error } = await supabase
    .from('courses')
    .update(data)
    .eq('id', courseId)
    .select()
    .single()
  
  return { course, error: error ? error.message : null }
}

export async function updateModule(moduleId: string, data: {
  name?: string
  description?: string
  order_index?: number
}) {
  const supabase = createClient()
  
  const { data: module, error } = await supabase
    .from('modules')
    .update(data)
    .eq('id', moduleId)
    .select()
    .single()
  
  return { module, error: error ? error.message : null }
}

export async function deleteModule(moduleId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('id', moduleId)
  
  return { error: error ? error.message : null }
}

export async function updateTopic(topicId: string, data: {
  name?: string
  description?: string
  video_url?: string
  order_index?: number
  num_mcqs?: number
  num_problems?: number
}) {
  const supabase = createClient()
  
  const { data: topic, error } = await supabase
    .from('topics')
    .update(data)
    .eq('id', topicId)
    .select()
    .single()
  
  return { topic, error: error ? error.message : null }
}

export async function deleteTopic(topicId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', topicId)
  
  return { error: error ? error.message : null }
}

export async function createModule(data: {
  course_id: string
  name: string
  description?: string
  order_index: number
}) {
  const supabase = createClient()
  
  // Populate both old and new schema fields for backward compatibility
  const { data: module, error } = await supabase
    .from('modules')
    .insert([{
      ...data,
      title: data.name, // Map name to title
      order: data.order_index, // Map order_index to order
    }])
    .select()
    .single()
  
  return { module, error: error ? error.message : null }
}

export async function createTopic(data: {
  module_id: string
  name: string
  video_url: string
  description?: string
  overview?: string
  order_index: number
}) {
  const supabase = createClient()
  
  const { data: topic, error } = await supabase
    .from('topics')
    .insert([data])
    .select()
    .single()
  
  return { topic, error: error ? error.message : null }
}

export async function getUserCoursesWithProgress(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_courses')
    .select(`
      *,
      courses (
        id,
        name,
        description,
        thumbnail_url,
        modules (
          id,
          name,
          description,
          order_index,
          topics (
            id,
            name,
            description,
            video_url,
            order_index
          )
        )
      )
    `)
    .eq('user_id', userId)
  
  if (error) throw toError(error, 'Failed to load user course progress')

  // Fetch topic progress for this user to determine completion status
  // Handle gracefully if topic_progress table doesn't exist
  let topicProgressMap = new Map<string, { video_watched: boolean; quiz_passed: boolean; problems_completed: number }>()
  try {
    const { data: progressData, error: progressError } = await supabase
      .from('topic_progress')
      .select('topic_id, video_watched, quiz_passed, problems_completed')
      .eq('user_id', userId)

    if (!progressError && progressData) {
      for (const p of progressData) {
        topicProgressMap.set(p.topic_id, {
          video_watched: p.video_watched || false,
          quiz_passed: p.quiz_passed || false,
          problems_completed: p.problems_completed || 0,
        })
      }
    }
  } catch (err) {
    console.warn('topic_progress table not found - progress tracking disabled', err)
  }

  // Also fetch problem counts per topic so we can determine if all are solved
  let topicProblemCounts = new Map<string, number>()
  try {
    const { data: problemData } = await supabase
      .from('coding_problems')
      .select('topic_id')
    
    if (problemData) {
      for (const p of problemData) {
        topicProblemCounts.set(p.topic_id, (topicProblemCounts.get(p.topic_id) || 0) + 1)
      }
    }
  } catch (err) {
    // Ignore
  }

  // Merge completion status into topics
  // A topic is "complete" when: video_watched + quiz_passed + all problems solved
  return data?.map((uc: any) => ({
    ...uc.courses,
    modules: uc.courses?.modules?.map((m: any) => ({
      ...m,
      topics: m.topics?.map((t: any) => {
        const prog = topicProgressMap.get(t.id)
        const totalProblems = topicProblemCounts.get(t.id) || 0
        const isComplete = prog
          ? prog.video_watched && prog.quiz_passed && (totalProblems === 0 || prog.problems_completed >= totalProblems)
          : false
        return {
          ...t,
          is_completed: isComplete,
          progress: prog || { video_watched: false, quiz_passed: false, problems_completed: 0 },
          total_problems: totalProblems,
        }
      }),
    })),
  })) || []
}

export async function markVideoAsWatched(userId: string, topicId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('topic_progress')
    .upsert(
      {
        user_id: userId,
        topic_id: topicId,
        video_watched: true,
      },
      {
        onConflict: 'user_id,topic_id',
        ignoreDuplicates: false,
      }
    )
  
  return { error: error ? error.message : null }
}

/**
 * Get full topic progress for a user
 */
export async function getTopicProgress(userId: string, topicId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('topic_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('topic_id', topicId)
    .single()
  
  if (error && error.code === 'PGRST116') {
    // Not found → no progress yet
    return { video_watched: false, quiz_passed: false, problems_completed: 0 }
  }
  
  if (error) {
    console.warn('Error fetching topic progress:', error)
    return { video_watched: false, quiz_passed: false, problems_completed: 0 }
  }
  
  return {
    video_watched: data.video_watched || false,
    quiz_passed: data.quiz_passed || false,
    problems_completed: data.problems_completed || 0,
  }
}

/**
 * Mark quiz as passed in topic_progress
 */
export async function markQuizPassed(userId: string, topicId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('topic_progress')
    .upsert(
      {
        user_id: userId,
        topic_id: topicId,
        quiz_passed: true,
      },
      {
        onConflict: 'user_id,topic_id',
        ignoreDuplicates: false,
      }
    )
  
  return { error: error ? error.message : null }
}

/**
 * Update problems_completed count in topic_progress.
 * Also checks if ALL problems are now solved and marks topic as fully complete.
 */
export async function updateProblemsCompleted(userId: string, topicId: string) {
  const supabase = createClient()
  
  // Count total problems for this topic
  const { data: allProblems } = await supabase
    .from('coding_problems')
    .select('id')
    .eq('topic_id', topicId)
  
  const totalProblems = allProblems?.length || 0
  
  // Count solved problems for this user in this topic
  const problemIds = allProblems?.map(p => p.id) || []
  let solvedCount = 0
  
  if (problemIds.length > 0) {
    const { data: solutions } = await supabase
      .from('problem_solutions')
      .select('problem_id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('problem_id', problemIds)
    
    solvedCount = solutions?.length || 0
  }
  
  // Update topic_progress
  const { error } = await supabase
    .from('topic_progress')
    .upsert(
      {
        user_id: userId,
        topic_id: topicId,
        problems_completed: solvedCount,
      },
      {
        onConflict: 'user_id,topic_id',
        ignoreDuplicates: false,
      }
    )
  
  return {
    error: error ? error.message : null,
    solvedCount,
    totalProblems,
    allSolved: solvedCount >= totalProblems && totalProblems > 0,
  }
}

/**
 * Check if a topic is fully complete (video watched + quiz passed + all problems solved)
 */
export async function isTopicFullyComplete(userId: string, topicId: string): Promise<boolean> {
  const progress = await getTopicProgress(userId, topicId)
  
  if (!progress.video_watched || !progress.quiz_passed) return false
  
  const supabase = createClient()
  const { data: allProblems } = await supabase
    .from('coding_problems')
    .select('id')
    .eq('topic_id', topicId)
  
  const totalProblems = allProblems?.length || 0
  
  // If no problems exist and video+quiz done, topic is complete
  if (totalProblems === 0) return true
  
  return progress.problems_completed >= totalProblems
}
