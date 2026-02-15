'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCourse, createModule, createTopic } from '@/lib/courses';
import { getCurrentUser } from '@/lib/auth';
import { generateProblemsForTopic } from '@/lib/problems';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save, Layers, Shield, BookOpenCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Orbitron, Rajdhani } from 'next/font/google';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'] });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

interface Topic {
  id: string;
  name: string;
  video_url: string;
  description: string;
  overview: string;
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

  const totalTopics = modules.reduce((sum, module) => sum + module.topics.length, 0);

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
                  overview: '',
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

      // Verify admin role
      if (user.role !== 'admin') {
        toast.error('Access denied: Admin privileges required.');
        setLoading(false);
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
        console.error('Course creation error:', courseError);
        toast.error('Failed to create course: ' + courseError);
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
          const { topic: newTopic, error: topicError } = await createTopic({
            module_id: newModule.id,
            name: topic.name,
            video_url: topic.video_url,
            description: topic.description,
            overview: topic.overview,
            order_index: j + 1,
          });

          if (topicError || !newTopic) {
            toast.error(`Failed to create topic "${topic.name}"`);
            continue;
          }

          // Auto-generate 2-3 coding problems for each topic
          try {
            const numProblems = Math.floor(Math.random() * 2) + 2; // Random 2 or 3
            const { problems, error: genError } = await generateProblemsForTopic(
              newTopic.id,
              newTopic.name,
              numProblems,
              newTopic.overview || newTopic.description
            );

            if (genError || !problems || problems.length === 0) {
              console.warn(`Could not generate problems for topic "${topic.name}":`, genError);
              // Don't fail course creation if problem generation fails
            } else {
              console.log(`✅ Generated ${problems.length} problems for "${topic.name}"`);
            }
          } catch (genError) {
            console.warn(`Problem generation failed for "${topic.name}":`, genError);
            // Continue with course creation even if problem generation fails
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
    <div className={`${rajdhani.className} relative min-h-screen overflow-hidden bg-[#09090B] text-slate-100`}>
      <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-10" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-purple-950/20 via-black to-cyan-950/20" />

      <div className="relative z-20 container py-8 max-w-6xl space-y-8">
      <div className="rounded-2xl border border-purple-500/30 bg-black/50 p-6 shadow-[0_0_30px_rgba(124,58,237,0.2)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className={`${orbitron.className} text-3xl font-black tracking-tight md:text-4xl`}>COURSE FORGE TERMINAL</h1>
            <p className="mt-2 text-slate-400">
              Assemble modules, deploy topics, and publish a battle-ready learning gate.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-white/15 bg-black/60 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-slate-400">Modules</p>
              <p className="text-2xl font-bold text-purple-300">{modules.length}</p>
            </div>
            <div className="rounded-lg border border-white/15 bg-black/60 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-slate-400">Topics</p>
              <p className="text-2xl font-bold text-cyan-300">{totalTopics}</p>
            </div>
            <div className="rounded-lg border border-white/15 bg-black/60 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-slate-400">Reward</p>
              <p className="text-2xl font-bold text-emerald-300">{course.completion_reward_points}</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-white/15 bg-black/60 text-slate-100 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpenCheck className="h-5 w-5 text-purple-300" />
              Gate Identity
            </CardTitle>
            <CardDescription className="text-slate-400">Define title, narrative, and reward telemetry for this course</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Course Name *</Label>
              <Input
                id="name"
                value={course.name}
                onChange={(e) => setCourse({ ...course, name: e.target.value })}
                placeholder="e.g., JavaScript Fundamentals"
                className="bg-black/60 border-white/15 text-slate-100"
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
                className="bg-black/60 border-white/15 text-slate-100"
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
                className="bg-black/60 border-white/15 text-slate-100"
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
                className="bg-black/60 border-white/15 text-slate-100"
                min={0}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/15 bg-black/60 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyan-300" />
              Deployment Brief
            </CardTitle>
            <CardDescription className="text-slate-400">Checklist before publishing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div className="rounded-lg border border-white/15 bg-black/50 p-3">
              Ensure each module has a unique purpose and progression path.
            </div>
            <div className="rounded-lg border border-white/15 bg-black/50 p-3">
              Include at least one topic with a valid YouTube URL for each module.
            </div>
            <div className="rounded-lg border border-white/15 bg-black/50 p-3">
              Write overviews so AI can generate stronger quizzes and coding missions.
            </div>
          </CardContent>
        </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={`${orbitron.className} text-2xl font-bold flex items-center gap-2`}>
              <Layers className="h-5 w-5 text-purple-300" />
              Module Architecture
            </h2>
            <Button type="button" onClick={addModule} variant="outline" className="border-white/20 text-slate-200">
              <Plus className="mr-2 h-4 w-4" />
              Add Module
            </Button>
          </div>

          {modules.map((module, moduleIndex) => (
            <Card key={module.id} className="border-white/15 bg-black/60 text-slate-100 shadow-[0_0_20px_rgba(30,41,59,0.35)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Module {moduleIndex + 1}: {module.name || 'Unnamed Module'}</CardTitle>
                  {modules.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-slate-300 hover:text-white"
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
                    className="bg-black/60 border-white/15 text-slate-100"
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
                    className="bg-black/60 border-white/15 text-slate-100"
                  />
                </div>

                {/* Topics */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Topics</Label>
                    <Button
                      type="button"
                      onClick={() => addTopic(module.id)}
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-slate-200"
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Add Topic
                    </Button>
                  </div>

                  {module.topics.map((topic, topicIndex) => (
                    <div key={topic.id} className="space-y-3 rounded-lg border border-white/15 bg-black/50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Topic {topicIndex + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-slate-300 hover:text-white"
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
                        className="bg-black/60 border-white/15 text-slate-100"
                        required
                      />

                      <Input
                        value={topic.video_url}
                        onChange={(e) =>
                          updateTopic(module.id, topic.id, 'video_url', e.target.value)
                        }
                        placeholder="YouTube URL *"
                        className="bg-black/60 border-white/15 text-slate-100"
                        required
                      />

                      <Textarea
                        value={topic.description}
                        onChange={(e) =>
                          updateTopic(module.id, topic.id, 'description', e.target.value)
                        }
                        placeholder="Topic description"
                        rows={2}
                        className="bg-black/60 border-white/15 text-slate-100"
                      />

                      <Textarea
                        value={topic.overview}
                        onChange={(e) =>
                          updateTopic(module.id, topic.id, 'overview', e.target.value)
                        }
                        placeholder="Topic overview — provide a detailed summary of what this topic covers. This will be enhanced by AI and used to generate better quizzes and problems."
                        rows={3}
                        className="bg-black/60 border-white/15 text-slate-100"
                      />
                    </div>
                  ))}

                  {module.topics.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">
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
            className="border-white/20 text-slate-200"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-purple-700 hover:bg-purple-600 text-white">
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Creating...' : 'Create Course'}
          </Button>
        </div>
      </form>
      </div>
    </div>
  );
}
