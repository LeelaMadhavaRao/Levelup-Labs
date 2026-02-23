'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  getCourseWithModules,
  updateCourse,
  deleteCourse,
  updateModule,
  deleteModule,
  updateTopic,
  deleteTopic,
  createModule,
  createTopic,
} from '@/lib/courses'
import { getCurrentUser } from '@/lib/auth'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Pencil, Trash2, Plus, Save, X } from 'lucide-react'

interface Topic {
  id: string
  name: string
  description?: string
  video_url: string
  order_index: number
  num_mcqs: number
  num_problems: number
}

interface Module {
  id: string
  name: string
  description?: string
  order_index: number
  topics: Topic[]
}

interface Course {
  id: string
  name: string
  description: string
  thumbnail_url?: string
  completion_reward_points: number
  modules: Module[]
}

export default function EditCoursePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'course' | 'module' | 'topic'
    id: string
    name: string
  } | null>(null)

  const [courseName, setCourseName] = useState('')
  const [courseDescription, setCourseDescription] = useState('')
  const [courseThumbnail, setCourseThumbnail] = useState('')
  const [coursePoints, setCoursePoints] = useState(100)

  const [editingModule, setEditingModule] = useState<string | null>(null)
  const [editingTopic, setEditingTopic] = useState<string | null>(null)
  const [addingModule, setAddingModule] = useState(false)
  const [addingTopicToModule, setAddingTopicToModule] = useState<string | null>(null)

  const [newModuleName, setNewModuleName] = useState('')
  const [newModuleDescription, setNewModuleDescription] = useState('')
  const [newTopicName, setNewTopicName] = useState('')
  const [newTopicDescription, setNewTopicDescription] = useState('')
  const [newTopicVideoUrl, setNewTopicVideoUrl] = useState('')
  const [newTopicMcqs, setNewTopicMcqs] = useState(5)
  const [newTopicProblems, setNewTopicProblems] = useState(3)

  useEffect(() => {
    loadCourse()
  }, [courseId])

  async function loadCourse() {
    try {
      const user = await getCurrentUser()
      if (!user || user.role !== 'admin') {
        router.push('/auth/login')
        return
      }

      const data = await getCourseWithModules(courseId)
      setCourse(data)
      setCourseName(data.name)
      setCourseDescription(data.description)
      setCourseThumbnail(data.thumbnail_url || '')
      setCoursePoints(data.completion_reward_points || 100)
    } catch (error) {
      console.error('Error loading course:', error)
      toast.error('Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateCourse() {
    setSaving(true)
    try {
      const { error } = await updateCourse(courseId, {
        name: courseName,
        description: courseDescription,
        thumbnail_url: courseThumbnail,
        completion_reward_points: coursePoints,
      })

      if (error) {
        toast.error(typeof error === 'string' ? error : 'Operation failed')
      } else {
        toast.success('Course updated successfully')
        await loadCourse()
      }
    } catch (error) {
      toast.error('Failed to update course')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteCourse() {
    setSaving(true)
    try {
      const { error } = await deleteCourse(courseId)
      if (error) {
        toast.error(typeof error === 'string' ? error : 'Operation failed')
      } else {
        toast.success('Course deleted successfully')
        router.push('/admin/courses')
      }
    } catch (error) {
      toast.error('Failed to delete course')
    } finally {
      setSaving(false)
      setDeleteDialogOpen(false)
    }
  }

  async function handleAddModule() {
    if (!newModuleName.trim()) {
      toast.error('Module name is required')
      return
    }

    setSaving(true)
    try {
      const { error } = await createModule({
        course_id: courseId,
        name: newModuleName,
        description: newModuleDescription,
        order_index: course?.modules.length || 0,
      })

      if (error) {
        toast.error(typeof error === 'string' ? error : 'Operation failed')
      } else {
        toast.success('Module added successfully')
        setNewModuleName('')
        setNewModuleDescription('')
        setAddingModule(false)
        await loadCourse()
      }
    } catch (error) {
      toast.error('Failed to add module')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateModule(moduleId: string, name: string, description: string) {
    setSaving(true)
    try {
      const { error } = await updateModule(moduleId, { name, description })

      if (error) {
        toast.error(typeof error === 'string' ? error : 'Operation failed')
      } else {
        toast.success('Module updated successfully')
        setEditingModule(null)
        await loadCourse()
      }
    } catch (error) {
      toast.error('Failed to update module')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteModule(moduleId: string) {
    setSaving(true)
    try {
      const { error } = await deleteModule(moduleId)
      if (error) {
        toast.error(typeof error === 'string' ? error : 'Operation failed')
      } else {
        toast.success('Module deleted successfully')
        await loadCourse()
      }
    } catch (error) {
      toast.error('Failed to delete module')
    } finally {
      setSaving(false)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  async function handleAddTopic(moduleId: string) {
    if (!newTopicName.trim() || !newTopicVideoUrl.trim()) {
      toast.error('Topic name and video URL are required')
      return
    }

    setSaving(true)
    try {
      const module = course?.modules.find((m) => m.id === moduleId)
      const { error } = await createTopic({
        module_id: moduleId,
        name: newTopicName,
        description: newTopicDescription,
        video_url: newTopicVideoUrl,
        order_index: module?.topics.length || 0,
      })

      if (error) {
        toast.error(typeof error === 'string' ? error : 'Operation failed')
      } else {
        toast.success('Topic added successfully')
        setNewTopicName('')
        setNewTopicDescription('')
        setNewTopicVideoUrl('')
        setNewTopicMcqs(5)
        setNewTopicProblems(3)
        setAddingTopicToModule(null)
        await loadCourse()
      }
    } catch (error) {
      toast.error('Failed to add topic')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateTopic(
    topicId: string,
    name: string,
    description: string,
    videoUrl: string,
    mcqs: number,
    problems: number
  ) {
    setSaving(true)
    try {
      const { error } = await updateTopic(topicId, {
        name,
        description,
        video_url: videoUrl,
        num_mcqs: mcqs,
        num_problems: problems,
      })

      if (error) {
        toast.error(typeof error === 'string' ? error : 'Operation failed')
      } else {
        toast.success('Topic updated successfully')
        setEditingTopic(null)
        await loadCourse()
      }
    } catch (error) {
      toast.error('Failed to update topic')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteTopic(topicId: string) {
    setSaving(true)
    try {
      const { error } = await deleteTopic(topicId)
      if (error) {
        toast.error(typeof error === 'string' ? error : 'Operation failed')
      } else {
        toast.success('Topic deleted successfully')
        await loadCourse()
      }
    } catch (error) {
      toast.error('Failed to delete topic')
    } finally {
      setSaving(false)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  function confirmDelete(type: 'course' | 'module' | 'topic', id: string, name: string) {
    setItemToDelete({ type, id, name })
    setDeleteDialogOpen(true)
  }

  function handleConfirmDelete() {
    if (!itemToDelete) return
    if (itemToDelete.type === 'course') handleDeleteCourse()
    else if (itemToDelete.type === 'module') handleDeleteModule(itemToDelete.id)
    else if (itemToDelete.type === 'topic') handleDeleteTopic(itemToDelete.id)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
          <p className="mt-4 text-sm text-gray-500">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-lg text-gray-500">Course not found</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
          <p className="mt-1 text-sm text-gray-500">Update course details, modules, and topics</p>
        </div>
        <Button onClick={() => router.push('/admin/courses')} variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-100">
          Back to Courses
        </Button>
      </div>

      {/* Course Details */}
      <Card className="border-gray-200 bg-white text-gray-900">
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Course Name</Label>
            <Input
              id="name"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="border-gray-200 bg-gray-100 text-gray-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              className="min-h-[100px] border-gray-200 bg-gray-100 text-gray-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail URL</Label>
            <Input
              id="thumbnail"
              value={courseThumbnail}
              onChange={(e) => setCourseThumbnail(e.target.value)}
              placeholder="https://example.com/thumbnail.jpg"
              className="border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="points">Completion Reward XP</Label>
            <Input
              id="points"
              type="number"
              value={coursePoints}
              onChange={(e) => setCoursePoints(Number(e.target.value))}
              className="border-gray-200 bg-gray-100 text-gray-900"
            />
          </div>
          <div className="flex gap-4">
            <Button onClick={handleUpdateCourse} disabled={saving} className="bg-purple-600 text-white hover:bg-purple-500">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Course'}
            </Button>
            <Button onClick={() => confirmDelete('course', courseId, courseName)} variant="destructive" disabled={saving}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Course
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modules & Topics */}
      <Card className="border-gray-200 bg-white text-gray-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Modules & Topics</CardTitle>
            <Button onClick={() => setAddingModule(true)} className="bg-purple-600 text-white hover:bg-purple-500">
              <Plus className="mr-2 h-4 w-4" />
              Add Module
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Module Form */}
          {addingModule && (
            <Card className="border-gray-200 bg-gray-50 text-gray-900">
              <CardContent className="space-y-3 pt-6">
                <h3 className="text-lg font-semibold">New Module</h3>
                <div className="space-y-2">
                  <Label>Module Name</Label>
                  <Input
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    className="border-gray-200 bg-gray-100 text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newModuleDescription}
                    onChange={(e) => setNewModuleDescription(e.target.value)}
                    className="border-gray-200 bg-gray-100 text-gray-900"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddModule} disabled={saving} className="bg-purple-600 text-white hover:bg-purple-500">
                    <Save className="mr-2 h-4 w-4" />
                    Save Module
                  </Button>
                  <Button
                    onClick={() => { setAddingModule(false); setNewModuleName(''); setNewModuleDescription(''); }}
                    variant="outline"
                    className="border-gray-200 text-gray-600 hover:bg-gray-100"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Modules List */}
          <Accordion type="multiple" className="space-y-2">
            {course.modules
              .sort((a, b) => a.order_index - b.order_index)
              .map((module) => (
                <AccordionItem
                  key={module.id}
                  value={module.id}
                  className="rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div className="flex items-center px-4">
                    <AccordionTrigger className="flex-1 hover:no-underline">
                      <span className="text-base font-semibold">{module.name}</span>
                    </AccordionTrigger>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="ghost" className="text-gray-500 hover:text-gray-900" onClick={() => setEditingModule(module.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-gray-500 hover:text-red-600" onClick={() => confirmDelete('module', module.id, module.name)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <AccordionContent className="space-y-4 px-4 pt-4">
                    {/* Edit Module Form */}
                    {editingModule === module.id && (
                      <ModuleEditForm
                        module={module}
                        onSave={handleUpdateModule}
                        onCancel={() => setEditingModule(null)}
                        saving={saving}
                      />
                    )}

                    {/* Add Topic Button */}
                    <Button onClick={() => setAddingTopicToModule(module.id)} size="sm" className="bg-purple-600 text-white hover:bg-purple-500">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Topic
                    </Button>

                    {/* Add New Topic Form */}
                    {addingTopicToModule === module.id && (
                      <Card className="border-gray-200 bg-gray-50 text-gray-900">
                        <CardContent className="space-y-3 pt-6">
                          <h4 className="font-semibold">New Topic</h4>
                          <div className="space-y-2">
                            <Label>Topic Name</Label>
                            <Input value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} className="border-gray-200 bg-gray-100 text-gray-900" />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={newTopicDescription} onChange={(e) => setNewTopicDescription(e.target.value)} className="border-gray-200 bg-gray-100 text-gray-900" />
                          </div>
                          <div className="space-y-2">
                            <Label>Video URL</Label>
                            <Input value={newTopicVideoUrl} onChange={(e) => setNewTopicVideoUrl(e.target.value)} className="border-gray-200 bg-gray-100 text-gray-900" />
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Number of MCQs</Label>
                              <Input type="number" value={newTopicMcqs} onChange={(e) => setNewTopicMcqs(Number(e.target.value))} className="border-gray-200 bg-gray-100 text-gray-900" />
                            </div>
                            <div className="space-y-2">
                              <Label>Number of Problems</Label>
                              <Input type="number" value={newTopicProblems} onChange={(e) => setNewTopicProblems(Number(e.target.value))} className="border-gray-200 bg-gray-100 text-gray-900" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => handleAddTopic(module.id)} disabled={saving} className="bg-purple-600 text-white hover:bg-purple-500">
                              <Save className="mr-2 h-4 w-4" /> Save Topic
                            </Button>
                            <Button
                              onClick={() => { setAddingTopicToModule(null); setNewTopicName(''); setNewTopicDescription(''); setNewTopicVideoUrl(''); }}
                              variant="outline"
                              className="border-gray-200 text-gray-600 hover:bg-gray-100"
                            >
                              <X className="mr-2 h-4 w-4" /> Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Topics List */}
                    <div className="space-y-2">
                      {module.topics
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((topic) => (
                          <Card key={topic.id} className="border-gray-200 bg-gray-50 text-gray-900">
                            <CardContent className="p-4">
                              {editingTopic === topic.id ? (
                                <TopicEditForm
                                  topic={topic}
                                  onSave={handleUpdateTopic}
                                  onCancel={() => setEditingTopic(null)}
                                  saving={saving}
                                />
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-gray-900">{topic.name}</h4>
                                    <p className="text-sm text-gray-400">
                                      {topic.num_mcqs} MCQs · {topic.num_problems} Problems
                                    </p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="text-gray-500 hover:text-gray-900" onClick={() => setEditingTopic(topic.id)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-gray-500 hover:text-red-600" onClick={() => confirmDelete('topic', topic.id, topic.name)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemToDelete?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{itemToDelete?.name}&quot;? This action cannot be undone.
              {itemToDelete?.type === 'course' && ' All modules, topics, and user progress will be deleted.'}
              {itemToDelete?.type === 'module' && ' All topics in this module will be deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Module Edit Form Component
function ModuleEditForm({
  module,
  onSave,
  onCancel,
  saving,
}: {
  module: Module
  onSave: (id: string, name: string, description: string) => void
  onCancel: () => void
  saving: boolean
}) {
  const [name, setName] = useState(module.name)
  const [description, setDescription] = useState(module.description || '')

  return (
    <Card className="border-gray-200 bg-gray-50 text-gray-900">
      <CardContent className="space-y-3 pt-6">
        <h4 className="font-semibold">Edit Module</h4>
        <div className="space-y-2">
          <Label>Module Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="border-gray-200 bg-gray-100 text-gray-900" />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="border-gray-200 bg-gray-100 text-gray-900" />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onSave(module.id, name, description)} disabled={saving} className="bg-purple-600 text-white hover:bg-purple-500">
            <Save className="mr-2 h-4 w-4" /> Save
          </Button>
          <Button onClick={onCancel} variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-100">
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Topic Edit Form Component
function TopicEditForm({
  topic,
  onSave,
  onCancel,
  saving,
}: {
  topic: Topic
  onSave: (id: string, name: string, description: string, videoUrl: string, mcqs: number, problems: number) => void
  onCancel: () => void
  saving: boolean
}) {
  const [name, setName] = useState(topic.name)
  const [description, setDescription] = useState(topic.description || '')
  const [videoUrl, setVideoUrl] = useState(topic.video_url)
  const [mcqs, setMcqs] = useState(topic.num_mcqs)
  const [problems, setProblems] = useState(topic.num_problems)

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Topic Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="border-gray-200 bg-gray-100 text-gray-900" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="border-gray-200 bg-gray-100 text-gray-900" />
      </div>
      <div className="space-y-2">
        <Label>Video URL</Label>
        <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="border-gray-200 bg-gray-100 text-gray-900" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Number of MCQs</Label>
          <Input type="number" value={mcqs} onChange={(e) => setMcqs(Number(e.target.value))} className="border-gray-200 bg-gray-100 text-gray-900" />
        </div>
        <div className="space-y-2">
          <Label>Number of Problems</Label>
          <Input type="number" value={problems} onChange={(e) => setProblems(Number(e.target.value))} className="border-gray-200 bg-gray-100 text-gray-900" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(topic.id, name, description, videoUrl, mcqs, problems)} disabled={saving} className="bg-purple-600 text-white hover:bg-purple-500">
          <Save className="mr-2 h-4 w-4" /> Save
        </Button>
        <Button onClick={onCancel} variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-100">
          <X className="mr-2 h-4 w-4" /> Cancel
        </Button>
      </div>
    </div>
  )
}
