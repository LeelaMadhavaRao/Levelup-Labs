'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlayCircle, CheckCircle2, Lock } from 'lucide-react';

interface Topic {
  id: string;
  name: string;
  description?: string;
  video_url: string;
  order_index: number;
  completed?: boolean;
  locked?: boolean;
}

interface Module {
  id: string;
  name: string;
  description?: string;
  order_index: number;
  topics: Topic[];
}

interface ModuleAccordionProps {
  modules: Module[];
  courseId: string;
}

export function ModuleAccordion({ modules, courseId }: ModuleAccordionProps) {
  const router = useRouter();
  const [openItems, setOpenItems] = useState<string[]>([modules[0]?.id || '']);

  const handleTopicClick = (topicId: string, locked: boolean) => {
    if (locked) return;
    router.push(`/topic/${topicId}/watch`);
  };

  const calculateModuleProgress = (module: Module) => {
    const totalTopics = module.topics.length;
    const completedTopics = module.topics.filter((t) => t.completed).length;
    return totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  };

  return (
    <Accordion
      type="multiple"
      value={openItems}
      onValueChange={setOpenItems}
      className="space-y-4"
    >
      {modules
        .sort((a, b) => a.order_index - b.order_index)
        .map((module, moduleIndex) => {
          const progress = calculateModuleProgress(module);
          const isCompleted = progress === 100;

          return (
            <AccordionItem
              key={module.id}
              value={module.id}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center justify-between w-full mr-2">
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {moduleIndex + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">{module.name}</h3>
                      {module.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {module.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isCompleted ? 'default' : 'secondary'}>
                      {progress}%
                    </Badge>
                    {isCompleted && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2 mt-2">
                  {module.topics
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((topic, topicIndex) => (
                      <div
                        key={topic.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          topic.locked
                            ? 'bg-muted/30 cursor-not-allowed'
                            : 'hover:bg-muted/50 cursor-pointer'
                        }`}
                        onClick={() => handleTopicClick(topic.id, topic.locked || false)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                            {topicIndex + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{topic.name}</p>
                            {topic.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {topic.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {topic.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : topic.locked ? (
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <PlayCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
    </Accordion>
  );
}
