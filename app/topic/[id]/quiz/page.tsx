'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getTopic, generateQuiz, submitQuizResponse } from '@/lib/quiz';
import { getCurrentUser } from '@/lib/auth';
import { markQuizPassed } from '@/lib/courses';
import { claimQuizPassReward } from '@/lib/gamification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2, Star, Trophy, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const topicId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [topic, setTopic] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [rewardSummary, setRewardSummary] = useState<{ points: number; xp: number; applied: boolean } | null>(null);

  useEffect(() => {
    loadData();
  }, [topicId]);

  const loadData = async () => {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    setUser(currentUser);
    const topicData = await getTopic(topicId);
    setTopic(topicData);

    // Generate quiz
    await generateQuizQuestions(topicId, topicData.name, topicData.overview);
  };

  const generateQuizQuestions = async (topicId: string, topicName: string, topicOverview?: string) => {
    setGenerating(true);
    
    try {
      const quizData = await generateQuiz(topicId, topicName, 5, topicOverview);
      
      if (quizData.error || !quizData.questions) {
        console.error('Error generating quiz:', quizData.error);
        toast.error(quizData.error || 'Failed to generate quiz');
        setQuestions([]); // Set empty array to show error state
      } else {
        setQuestions(quizData.questions);
        setSelectedAnswers(new Array(quizData.questions.length).fill(-1));
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to generate quiz: ${errorMessage}`);
      setQuestions([]); // Set empty array to show error state
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswers.includes(-1)) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    // Calculate score
    let correctCount = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    const finalScore = (correctCount / questions.length) * 100;
    setScore(finalScore);
    setSubmitted(true);
    let earnedPoints = 0;
    let earnedXp = 0;

    // Submit quiz response
    if (user && topic) {
      await submitQuizResponse(user.id, topic.id, finalScore, selectedAnswers, questions);
      
      // If passed, update topic_progress.quiz_passed
      if (finalScore >= 70) {
        await markQuizPassed(user.id, topic.id);
        try {
          const reward = await claimQuizPassReward(topic.id);
          earnedPoints = reward.pointsAwarded;
          earnedXp = reward.xpAwarded;
          setRewardSummary({
            points: reward.pointsAwarded,
            xp: reward.xpAwarded,
            applied: reward.applied,
          });
        } catch {
          setRewardSummary({
            points: 0,
            xp: 0,
            applied: false,
          });
        }
      }
    }

    if (finalScore >= 70) {
      if (earnedPoints > 0 || earnedXp > 0) {
        toast.success(`Quiz cleared! +${earnedPoints} XP and +${earnedXp} bonus XP`);
      } else {
        toast.success('Congratulations! You passed the quiz!');
      }
    } else {
      toast.error('You need at least 70% to pass. Try again!');
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (loading || generating) {
    return (
      <div className="container py-8 max-w-3xl">
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <h2 className="text-xl font-semibold">
              {generating ? 'Generating quiz questions with AI...' : 'Loading...'}
            </h2>
            <p className="text-muted-foreground">This may take a few moments</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!topic || questions.length === 0) {
    return (
      <div className="container py-8 max-w-3xl">
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <XCircle className="h-16 w-16 mx-auto text-destructive" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Unable to Generate Quiz</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                The quiz generation service is unavailable. This usually means:
              </p>
              <ul className="text-sm text-muted-foreground mt-3 space-y-1 max-w-md mx-auto text-left">
                <li>• Edge Function not deployed</li>
                <li>• Gemini API keys not configured in Supabase</li>
                <li>• API rate limit exceeded</li>
              </ul>
            </div>
            <div className="flex gap-2 justify-center mt-6">
              <Button onClick={() => router.push(`/topic/${topicId}/watch`)}>
                Back to Video
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setLoading(true);
                  loadData();
                }}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    const passed = score >= 70;

    return (
      <div className="container py-8 max-w-3xl">
        <Card>
          <CardHeader className="text-center pb-8">
            {passed ? (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            )}
            <CardTitle className="text-3xl">
              {passed ? 'Congratulations!' : 'Keep Learning'}
            </CardTitle>
            <CardDescription className="text-xl pt-2">
              Your score: <span className="font-bold text-foreground">{score.toFixed(0)}%</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Correct Answers</span>
                <span className="font-medium">
                  {questions.filter((q, i) => selectedAnswers[i] === q.correctAnswer).length} / {questions.length}
                </span>
              </div>
              <Progress value={score} className="h-2" />
            </div>

            <div className="space-y-4 pt-4">
              {passed ? (
                <>
                  <p className="text-center text-muted-foreground">
                    Great job! You're ready to move on to the coding challenges.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500">
                      <Trophy className="h-3 w-3" />+{rewardSummary?.points || 0} XP
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      <Star className="h-3 w-3" />+{rewardSummary?.xp || 0} XP
                    </span>
                    {rewardSummary && !rewardSummary.applied && (
                      <span className="text-xs text-muted-foreground">Reward already claimed previously.</span>
                    )}
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => router.push(`/topic/${topic.id}/problems`)}>
                      Start Problems
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/my-courses')}>
                      My Gates
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-center text-muted-foreground">
                    You need at least 70% to pass. Review the material and try again!
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => router.push(`/topic/${topic.id}/watch`)}>
                      Watch Video Again
                    </Button>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      Retry Quiz
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="container py-8 max-w-3xl space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Question {currentQuestion + 1} of {questions.length}</span>
          <span className="font-medium">{progress.toFixed(0)}% Complete</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{currentQ.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={selectedAnswers[currentQuestion]?.toString() || ''}
            onValueChange={(value) => handleAnswerSelect(parseInt(value))}
          >
            <div className="space-y-3">
              {currentQ.options.map((option, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${
                    selectedAnswers[currentQuestion] === index
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer text-base leading-relaxed"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>

            {currentQuestion === questions.length - 1 ? (
              <Button onClick={handleSubmit}>
                Submit Quiz
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question Navigator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {questions.map((_, index) => (
              <Button
                key={index}
                variant={currentQuestion === index ? 'default' : 'outline'}
                size="sm"
                className="w-10 h-10"
                onClick={() => setCurrentQuestion(index)}
              >
                {selectedAnswers[index] !== -1 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
