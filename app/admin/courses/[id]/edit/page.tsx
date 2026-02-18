'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
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
import { Orbitron, Rajdhani } from 'next/font/google'

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'] })
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

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

  // Form states
  const [courseName, setCourseName] = useState('')
  const [courseDescription, setCourseDescription] = useState('')
  const [courseThumbnail, setCourseThumbnail] = useState('')
  const [coursePoints, setCoursePoints] = useState(100)

  // Edit states for modules and topics
  const [editingModule, setEditingModule] = useState<string | null>(null)
  const [editingTopic, setEditingTopic] = useState<string | null>(null)
  const [addingModule, setAddingModule] = useState(false)
  const [addingTopicToModule, setAddingTopicToModule] = useState<string | null>(null)

  // New module/topic states
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
      const { error } = await updateModule(moduleId, {
        name,
        description,
      })

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

    if (itemToDelete.type === 'course') {
      handleDeleteCourse()
    } else if (itemToDelete.type === 'module') {
      handleDeleteModule(itemToDelete.id)
    } else if (itemToDelete.type === 'topic') {
      handleDeleteTopic(itemToDelete.id)
    }
  }

  if (loading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <div className="text-xl">Loading course...</div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <div className="text-xl">Course not found</div>
      </div>
    )
  }

  return (
    <div className={`${rajdhani.className} relative min-h-screen overflow-hidden text-slate-100`}>
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-purple-950/20 via-black to-cyan-950/20" />

      <div className="relative z-20 container py-8 max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`${orbitron.className} text-4xl font-bold mb-2`}>Edit Course</h1>
            <p className="text-slate-400">Update course details, modules, and topics</p>
          </div>
          <Button
            onClick={() => router.push('/admin/courses')}
            variant="outline"
            className="border-white/20 text-slate-200"
          >
            Back to Courses
          </Button>
        </div>

        {/* Course Details */}
        <Card className="p-6 border-white/15 bg-black/60 text-slate-100">
          <h2 className="text-2xl font-bold mb-4">Course Details</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Course Name</Label>
              <Input
                id="name"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="bg-black/60 border-white/15 text-slate-100"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={courseDescription}
                onChange={(e) => setCourseDescription(e.target.value)}
                className="min-h-[100px] bg-black/60 border-white/15 text-slate-100"
              />
            </div>
            <div>
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                value={courseThumbnail}
                onChange={(e) => setCourseThumbnail(e.target.value)}
                placeholder="https://example.com/thumbnail.jpg"
                className="bg-black/60 border-white/15 text-slate-100"
              />
            </div>
            <div>
              <Label htmlFor="points">Completion Reward XP</Label>
              <Input
                id="points"
                type="number"
                value={coursePoints}
                onChange={(e) => setCoursePoints(Number(e.target.value))}
                className="bg-black/60 border-white/15 text-slate-100"
              />
            </div>
            <div className="flex gap-4">
              <Button
                onClick={handleUpdateCourse}
                disabled={saving}
                className="bg-purple-700 hover:bg-purple-600 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Course'}
              </Button>
              <Button
                onClick={() => confirmDelete('course', courseId, courseName)}
                variant="destructive"
                disabled={saving}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Course
              </Button>
            </div>
          </div>
        </Card>

        {/* Modules & Topics */}
        <Card className="p-6 border-white/15 bg-black/60 text-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Modules & Topics</h2>
            <Button
              onClick={() => setAddingModule(true)}
              className="bg-purple-700 hover:bg-purple-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Module
            </Button>
          </div>

          {/* Add New Module Form */}
          {addingModule && (
            <Card className="p-4 mb-4 border-white/15 bg-black/60 text-slate-100">
              <h3 className="text-lg font-bold mb-3">New Module</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="newModuleName">Module Name</Label>
                  <Input
                    id="newModuleName"
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    className="bg-black/60 border-white/15 text-slate-100"
                  />
                </div>
                <div>
                  <Label htmlFor="newModuleDescription">Description</Label>
                  <Textarea
                    id="newModuleDescription"
                    value={newModuleDescription}
                    onChange={(e) => setNewModuleDescription(e.target.value)}
                    className="bg-black/60 border-white/15 text-slate-100"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddModule}
                    disabled={saving}
                    className="bg-purple-700 hover:bg-purple-600 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Module
                  </Button>
                  <Button
                    onClick={() => {
                      setAddingModule(false)
                      setNewModuleName('')
                      setNewModuleDescription('')
                    }}
                    variant="outline"
                    className="border-white/20 text-slate-200"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
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
                  className="border border-white/15 rounded-lg px-4 bg-black/50"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span className="text-lg font-semibold">{module.name}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-300 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingModule(module.id)
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-300 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            confirmDelete('module', module.id, module.name)
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
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
                    <Button
                      onClick={() => setAddingTopicToModule(module.id)}
                      size="sm"
                      className="bg-purple-700 hover:bg-purple-600 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Topic
                    </Button>

                    {/* Add New Topic Form */}
                    {addingTopicToModule === module.id && (
                      <Card className="p-4 border-white/15 bg-black/60 text-slate-100">
                        <h4 className="text-md font-bold mb-3">New Topic</h4>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="newTopicName">Topic Name</Label>
                            <Input
                              id="newTopicName"
                              value={newTopicName}
                              onChange={(e) => setNewTopicName(e.target.value)}
                              className="bg-black/60 border-white/15 text-slate-100"
                            />
                          </div>
                          <div>
                            <Label htmlFor="newTopicDescription">Description</Label>
                            <Textarea
                              id="newTopicDescription"
                              value={newTopicDescription}
                              onChange={(e) => setNewTopicDescription(e.target.value)}
                              className="bg-black/60 border-white/15 text-slate-100"
                            />
                          </div>
                          <div>
                            <Label htmlFor="newTopicVideoUrl">Video URL</Label>
                            <Input
                              id="newTopicVideoUrl"
                              value={newTopicVideoUrl}
                              onChange={(e) => setNewTopicVideoUrl(e.target.value)}
                              className="bg-black/60 border-white/15 text-slate-100"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="newTopicMcqs">Number of MCQs</Label>
                              <Input
                                id="newTopicMcqs"
                                type="number"
                                value={newTopicMcqs}
                                onChange={(e) => setNewTopicMcqs(Number(e.target.value))}
                                className="bg-black/60 border-white/15 text-slate-100"
                              />
                            </div>
                            <div>
                              <Label htmlFor="newTopicProblems">Number of Problems</Label>
                              <Input
                                id="newTopicProblems"
                                type="number"
                                value={newTopicProblems}
                                onChange={(e) => setNewTopicProblems(Number(e.target.value))}
                                className="bg-black/60 border-white/15 text-slate-100"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleAddTopic(module.id)}
                              disabled={saving}
                              className="bg-purple-700 hover:bg-purple-600 text-white"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save Topic
                            </Button>
                            <Button
                              onClick={() => {
                                setAddingTopicToModule(null)
                                setNewTopicName('')
                                setNewTopicDescription('')
                                setNewTopicVideoUrl('')
                              }}
                              variant="outline"
                              className="border-white/20 text-slate-200"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Topics List */}
                    <div className="space-y-2">
                      {module.topics
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((topic) => (
                          <Card key={topic.id} className="p-4 border-white/15 bg-black/60 text-slate-100">
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
                                  <h4 className="font-semibold">{topic.name}</h4>
                                  <p className="text-sm text-slate-400">
                                    {topic.num_mcqs} MCQs • {topic.num_problems} Problems
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-slate-300 hover:text-white"
                                    onClick={() => setEditingTopic(topic.id)}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-slate-300 hover:text-white"
                                    onClick={() =>
                                      confirmDelete('topic', topic.id, topic.name)
                                    }
                                  >
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </Card>
                        ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {itemToDelete?.type}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be
              undone.
              {itemToDelete?.type === 'course' &&
                ' All modules, topics, and user progress will be deleted.'}
              {itemToDelete?.type === 'module' &&
                ' All topics in this module will be deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
              <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
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
    <Card className="p-4 border-white/15 bg-black/60 text-slate-100">
      <h4 className="text-md font-bold mb-3">Edit Module</h4>
      <div className="space-y-3">
        <div>
          <Label htmlFor={`moduleName-${module.id}`}>Module Name</Label>
          <Input
            id={`moduleName-${module.id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-black/60 border-white/15 text-slate-100"
          />
        </div>
        <div>
          <Label htmlFor={`moduleDescription-${module.id}`}>Description</Label>
          <Textarea
            id={`moduleDescription-${module.id}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-black/60 border-white/15 text-slate-100"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => onSave(module.id, name, description)}
            disabled={saving}
            className="bg-purple-700 hover:bg-purple-600 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-white/20 text-slate-200"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
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
  onSave: (
    id: string,
    name: string,
    description: string,
    videoUrl: string,
    mcqs: number,
    problems: number
  ) => void
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
      <div>
        <Label htmlFor={`topicName-${topic.id}`}>Topic Name</Label>
        <Input
          id={`topicName-${topic.id}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-black/60 border-white/15 text-slate-100"
        />
      </div>
      <div>
        <Label htmlFor={`topicDescription-${topic.id}`}>Description</Label>
        <Textarea
          id={`topicDescription-${topic.id}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-black/60 border-white/15 text-slate-100"
        />
      </div>
      <div>
        <Label htmlFor={`topicVideoUrl-${topic.id}`}>Video URL</Label>
        <Input
          id={`topicVideoUrl-${topic.id}`}
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="bg-black/60 border-white/15 text-slate-100"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`topicMcqs-${topic.id}`}>Number of MCQs</Label>
          <Input
            id={`topicMcqs-${topic.id}`}
            type="number"
            value={mcqs}
            onChange={(e) => setMcqs(Number(e.target.value))}
            className="bg-black/60 border-white/15 text-slate-100"
          />
        </div>
        <div>
          <Label htmlFor={`topicProblems-${topic.id}`}>Number of Problems</Label>
          <Input
            id={`topicProblems-${topic.id}`}
            type="number"
            value={problems}
            onChange={(e) => setProblems(Number(e.target.value))}
            className="bg-black/60 border-white/15 text-slate-100"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => onSave(topic.id, name, description, videoUrl, mcqs, problems)}
          disabled={saving}
          className="bg-purple-700 hover:bg-purple-600 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="border-white/20 text-slate-200"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
