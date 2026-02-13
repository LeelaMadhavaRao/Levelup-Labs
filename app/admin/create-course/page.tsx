'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCourse, createModule, createTopic } from '@/lib/courses';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Topic {
  id: string;
  name: string;
  video_url: string;
  description: string;
}

interface Module {
  id: string;
  name: string;
  description: string;
  topics: Topic[];
}

export default function CreateCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState({
    name: '',
    description: '',
    thumbnail_url: '',
    completion_reward_points: 500,
  });

  const [modules, setModules] = useState<Module[]>([
    {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      topics: [],
    },
  ]);

  const addModule = () => {
    setModules([
      ...modules,
      {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        topics: [],
      },
    ]);
  };

  const removeModule = (moduleId: string) => {
    setModules(modules.filter((m) => m.id !== moduleId));
  };

  const updateModule = (moduleId: string, field: string, value: string) => {
    setModules(
      modules.map((m) =>
        m.id === moduleId ? { ...m, [field]: value } : m
      )
    );
  };

  const addTopic = (moduleId: string) => {
    setModules(
      modules.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              topics: [
                ...m.topics,
                {
                  id: crypto.randomUUID(),
                  name: '',
                  video_url: '',
                  description: '',
                },
              ],
            }
          : m
      )
    );
  };

  const removeTopic = (moduleId: string, topicId: string) => {
    setModules(
      modules.map((m) =>
        m.id === moduleId
          ? { ...m, topics: m.topics.filter((t) => t.id !== topicId) }
          : m
      )
    );
  };

  const updateTopic = (moduleId: string, topicId: string, field: string, value: string) => {
    setModules(
      modules.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              topics: m.topics.map((t) =>
                t.id === topicId ? { ...t, [field]: value } : t
              ),
            }
          : m
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!course.name || !course.description) {
        toast.error('Please fill in all course details');
        setLoading(false);
        return;
      }

      if (modules.length === 0) {
        toast.error('Please add at least one module');
        setLoading(false);
        return;
      }

      for (const module of modules) {
        if (!module.name) {
          toast.error('All modules must have a name');
          setLoading(false);
          return;
        }
        if (module.topics.length === 0) {
          toast.error(`Module "${module.name}" must have at least one topic`);
          setLoading(false);
          return;
        }
        for (const topic of module.topics) {
          if (!topic.name || !topic.video_url) {
            toast.error('All topics must have a name and video URL');
            setLoading(false);
            return;
          }
        }
      }

      const user = await getCurrentUser();
      if (!user) {
        toast.error('You must be logged in');
        router.push('/auth/login');
        return;
      }

      // Create course
      const { course: newCourse, error: courseError } = await createCourse({
        admin_id: user.id,
        name: course.name,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        completion_reward_points: course.completion_reward_points,
      });

      if (courseError || !newCourse) {
        toast.error('Failed to create course');
        setLoading(false);
        return;
      }

      // Create modules and topics
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        const { module: newModule, error: moduleError } = await createModule({
          course_id: newCourse.id,
          name: module.name,
          description: module.description,
          order_index: i + 1,
        });

        if (moduleError || !newModule) {
          toast.error(`Failed to create module "${module.name}"`);
          continue;
        }

        // Create topics
        for (let j = 0; j < module.topics.length; j++) {
          const topic = module.topics[j];
          const { error: topicError } = await createTopic({
            module_id: newModule.id,
            name: topic.name,
            video_url: topic.video_url,
            description: topic.description,
            order_index: j + 1,
          });

          if (topicError) {
            toast.error(`Failed to create topic "${topic.name}"`);
          }
        }
      }

      toast.success('Course created successfully!');
      router.push('/admin/dashboard');
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Course</h1>
        <p className="text-muted-foreground mt-2">
          Build a comprehensive course with modules and topics
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Course Details */}
        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
            <CardDescription>Basic information about your course</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Course Name *</Label>
              <Input
                id="name"
                value={course.name}
                onChange={(e) => setCourse({ ...course, name: e.target.value })}
                placeholder="e.g., JavaScript Fundamentals"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={course.description}
                onChange={(e) => setCourse({ ...course, description: e.target.value })}
                placeholder="Describe what students will learn..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                value={course.thumbnail_url}
                onChange={(e) => setCourse({ ...course, thumbnail_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Completion Reward Points</Label>
              <Input
                id="points"
                type="number"
                value={course.completion_reward_points}
                onChange={(e) =>
                  setCourse({ ...course, completion_reward_points: parseInt(e.target.value) })
                }
                min={0}
              />
            </div>
          </CardContent>
        </Card>

        {/* Modules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Course Modules</h2>
            <Button type="button" onClick={addModule} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Module
            </Button>
          </div>

          {modules.map((module, moduleIndex) => (
            <Card key={module.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Module {moduleIndex + 1}</CardTitle>
                  {modules.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeModule(module.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Module Name *</Label>
                  <Input
                    value={module.name}
                    onChange={(e) => updateModule(module.id, 'name', e.target.value)}
                    placeholder="e.g., Introduction to Variables"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Module Description</Label>
                  <Textarea
                    value={module.description}
                    onChange={(e) => updateModule(module.id, 'description', e.target.value)}
                    placeholder="What will students learn in this module?"
                    rows={2}
                  />
                </div>

                {/* Topics */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Topics</Label>
                    <Button
                      type="button"
                      onClick={() => addTopic(module.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Add Topic
                    </Button>
                  </div>

                  {module.topics.map((topic, topicIndex) => (
                    <div key={topic.id} className="space-y-3 p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Topic {topicIndex + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTopic(module.id, topic.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      <Input
                        value={topic.name}
                        onChange={(e) =>
                          updateTopic(module.id, topic.id, 'name', e.target.value)
                        }
                        placeholder="Topic name *"
                        required
                      />

                      <Input
                        value={topic.video_url}
                        onChange={(e) =>
                          updateTopic(module.id, topic.id, 'video_url', e.target.value)
                        }
                        placeholder="YouTube URL *"
                        required
                      />

                      <Textarea
                        value={topic.description}
                        onChange={(e) =>
                          updateTopic(module.id, topic.id, 'description', e.target.value)
                        }
                        placeholder="Topic description"
                        rows={2}
                      />
                    </div>
                  ))}

                  {module.topics.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No topics yet. Add your first topic above.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/dashboard')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Creating...' : 'Create Course'}
          </Button>
        </div>
      </form>
    </div>
  );
}
