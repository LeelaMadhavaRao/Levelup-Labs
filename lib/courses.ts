import { createClient } from './supabase'

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
    .select('*, modules(count)')
  
  if (error) return []
  // Map module count from nested array format to flat field
  return (data || []).map((course: any) => ({
    ...course,
    module_count: course.modules?.[0]?.count ?? 0,
  }))
}

export async function getCourseById(courseId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()
  
  if (error) throw error
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
  
  if (error) throw error
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
  
  if (error) throw error
  return !!data
}

export async function getCourseModules(courseId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order', { ascending: true })
  
  if (error) throw error
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
        order,
      },
    ])
    .select()
  
  if (error) throw error
  return data
}

export async function getModuleTopics(moduleId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('module_id', moduleId)
  
  if (error) throw error
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
  
  if (error) throw error
  return data
}

export async function getTopicById(topicId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('id', topicId)
    .single()
  
  if (error) throw error
  return data
}

// Additional helper functions for pages

export async function getTopic(topicId: string) {
  return getTopicById(topicId)
}

export async function getCoursesByAdmin(adminId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('courses')
    .select('*, modules(*)')
    .eq('admin_id', adminId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
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
  
  if (error) throw error

  // Fetch topic progress for this user to determine completion status
  const { data: progressData } = await supabase
    .from('topic_progress')
    .select('topic_id, video_watched, quiz_passed, problems_completed')
    .eq('user_id', userId)

  const completedTopicIds = new Set(
    progressData?.filter((p: any) => p.video_watched).map((p: any) => p.topic_id) || []
  )

  // Merge completion status into topics
  return data?.map((uc: any) => ({
    ...uc.courses,
    modules: uc.courses?.modules?.map((m: any) => ({
      ...m,
      topics: m.topics?.map((t: any) => ({
        ...t,
        is_completed: completedTopicIds.has(t.id),
      })),
    })),
  })) || []
}

export async function markVideoAsWatched(userId: string, topicId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('topic_progress')
    .upsert([
      {
        user_id: userId,
        topic_id: topicId,
        video_watched: true,
      },
    ])
  
  return { error: error ? error.message : null }
}
