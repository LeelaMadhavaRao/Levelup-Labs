// Course completion utilities
import { createClient } from './supabase'

/**
 * Check if user has completed all requirements for a course
 * Requirements: Pass all quizzes AND solve all problems in all topics
 */
export async function checkCourseCompletion(userId: string, courseId: string): Promise<boolean> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.rpc('has_user_completed_all_course_topics', {
      p_user_id: userId,
      p_course_id: courseId,
    })
    
    if (error) {
      console.error('Error checking course completion:', error)
      return false
    }
    
    return data || false
  } catch (error) {
    console.error('Error checking course completion:', error)
    return false
  }
}

/**
 * Mark course as completed and award completion XP
 * Only callable by user who completed all requirements
 */
export async function completeCourse(userId: string, courseId: string) {
  const supabase = createClient()
  
  // First check if user actually completed all requirements
  const isCompleted = await checkCourseCompletion(userId, courseId)
  
  if (!isCompleted) {
    return {
      error: 'Course requirements not met. Complete all quizzes and problems.',
      xpAwarded: 0,
      pointsAwarded: 0,
    }
  }
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return {
        error: 'You must be logged in',
        xpAwarded: 0,
        pointsAwarded: 0,
      }
    }

    const { data, error } = await supabase.functions.invoke('updatePoints', {
      body: {
        action: 'complete_course',
        courseId,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })
    
    if (error) {
      const { data: courseData } = await supabase
        .from('courses')
        .select('completion_reward_points')
        .eq('id', courseId)
        .maybeSingle()

      const rewardPoints = Number(courseData?.completion_reward_points ?? 0)
      const eventKey = `complete_course:${userId}:${courseId}`
      const { data: fallbackReward, error: fallbackError } = await supabase.rpc('award_points_event', {
        p_user_id: userId,
        p_event_type: 'complete_course',
        p_event_key: eventKey,
        p_points: rewardPoints,
        p_xp: rewardPoints * 2,
        p_metadata: { course_id: courseId, source: 'client_fallback' },
      })

      if (fallbackError) {
        return {
          error: error.message || 'Failed to complete course',
          xpAwarded: 0,
          pointsAwarded: 0,
        }
      }

      const fallbackRow = Array.isArray(fallbackReward) ? fallbackReward[0] : null
      await supabase
        .from('user_courses')
        .update({
          completed_at: new Date().toISOString(),
          completion_points_awarded: Number(fallbackRow?.points_awarded ?? 0),
        })
        .eq('user_id', userId)
        .eq('course_id', courseId)

      return {
        error: null,
        xpAwarded: Number(fallbackRow?.xp_awarded ?? fallbackRow?.points_awarded ?? 0),
        pointsAwarded: Number(fallbackRow?.points_awarded ?? 0),
        message: fallbackRow?.applied ? 'Course completed successfully' : 'Course already completed',
      }
    }
    
    return {
      error: null,
      xpAwarded: Number(data.xpAwarded ?? data.pointsAwarded ?? 0),
      pointsAwarded: Number(data.pointsAwarded ?? data.xpAwarded ?? 0),
      message: data.message,
    }
  } catch (error) {
    console.error('Error completing course:', error)
    return {
      error: 'Failed to complete course',
      xpAwarded: 0,
      pointsAwarded: 0,
    }
  }
}

/**
 * Get course completion progress percentage
 */
export async function getCourseProgress(userId: string, courseId: string): Promise<number> {
  const supabase = createClient()
  
  try {
    // Get all topics in the course
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('id, module_id, modules!inner(course_id)')
      .eq('modules.course_id', courseId)
    
    if (topicsError || !topics || topics.length === 0) {
      return 0
    }
    
    const totalTopics = topics.length
    let completedTopics = 0
    
    // Check each topic for quiz pass and all problems solved
    for (const topic of topics) {
      // Check if quiz passed
      const { data: quizData } = await supabase
        .from('quiz_responses')
        .select('passed')
        .eq('user_id', userId)
        .eq('topic_id', topic.id)
        .eq('passed', true)
        .limit(1)
      
      if (!quizData || quizData.length === 0) {
        continue // Quiz not passed
      }
      
      // Check if all problems solved
      const { data: problemsData } = await supabase
        .from('coding_problems')
        .select('id')
        .eq('topic_id', topic.id)
      
      if (!problemsData || problemsData.length === 0) {
        // No problems for this topic, count as completed if quiz passed
        completedTopics++
        continue
      }
      
      // Count solved problems
      const { data: solvedData } = await supabase
        .from('problem_solutions')
        .select('problem_id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .in('problem_id', problemsData.map(p => p.id))
      
      if (solvedData && solvedData.length === problemsData.length) {
        completedTopics++
      }
    }
    
    return Math.round((completedTopics / totalTopics) * 100)
  } catch (error) {
    console.error('Error calculating course progress:', error)
    return 0
  }
}
