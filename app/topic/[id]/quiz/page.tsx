'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getTopic, markQuizPassed } from '@/lib/courses';
import { generateQuiz, submitQuizResponse } from '@/lib/quiz';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Loader2, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const topicId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [topic, setTopic] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuiz();
  }, [topicId]);

  const loadQuiz = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }
      setUser(currentUser);

      const topicData = await getTopic(topicId);
      if (!topicData) {
        setError('Topic not found');
        setLoading(false);
        return;
      }
      setTopic(topicData);

      const result = await generateQuiz(topicId, topicData.name, 5, topicData.overview || topicData.description || '');
      if (result.error || !result.questions || result.questions.length === 0) {
        setError(result.error || 'Failed to generate quiz questions');
        setLoading(false);
        return;
      }

      setQuestions(result.questions);
      setSelectedAnswers(new Array(result.questions.length).fill(-1));
    } catch (err) {
      console.error('Failed to load quiz:', err);
      setError('Failed to load quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const updated = [...selectedAnswers];
    updated[currentQuestion] = answerIndex;
    setSelectedAnswers(updated);
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
    if (selectedAnswers.some((a) => a === -1)) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    setSubmitting(true);

    try {
      let correct = 0;
      for (let i = 0; i < questions.length; i++) {
        if (selectedAnswers[i] === questions[i].correctAnswer) {
          correct++;
        }
      }

      const scorePercent = Math.round((correct / questions.length) * 100);
      setScore(scorePercent);

      await submitQuizResponse(user.id, topicId, scorePercent, selectedAnswers, questions);

      if (scorePercent >= 70) {
        await markQuizPassed(user.id, topicId);
        toast.success(`Quiz passed! ${scorePercent}%`);
      } else {
        toast.error(`Quiz not passed. You scored ${scorePercent}%, need 70% to pass.`);
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      toast.error('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
          <p className="text-gray-500">Generating quiz questions with AI...</p>
          <p className="text-xs text-gray-400 mt-1">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="border-gray-200 bg-white">
          <CardContent className="py-16 text-center space-y-4">
            <XCircle className="h-12 w-12 text-red-600 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">{error}</h2>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => window.location.reload()} className="bg-purple-600 hover:bg-purple-500 text-gray-900">
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => router.push(`/topic/${topicId}`)} className="border-gray-200 text-gray-600 hover:bg-gray-100">
                Back to Topic
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results screen
  if (submitted) {
    const passed = score >= 70;
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <Card className={`${passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="py-10 text-center space-y-4">
            {passed ? (
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            ) : (
              <XCircle className="h-16 w-16 text-red-600 mx-auto" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {passed ? 'Quiz Passed!' : 'Quiz Not Passed'}
              </h2>
              <p className="text-gray-500 mt-1">
                You scored <span className={`font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>{score}%</span>
                {passed ? '' : ' — You need 70% to pass'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              {passed ? (
                <Button onClick={() => router.push(`/topic/${topicId}/problems`)} className="bg-purple-600 hover:bg-purple-500 text-gray-900">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Start Problems
                </Button>
              ) : (
                <>
                  <Button onClick={() => router.push(`/topic/${topicId}/watch`)} variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-100">
                    Watch Video Again
                  </Button>
                  <Button onClick={() => window.location.reload()} className="bg-purple-600 hover:bg-purple-500 text-gray-900">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retry Quiz
                  </Button>
                </>
              )}
              <Button variant="ghost" onClick={() => router.push(`/topic/${topicId}`)} className="text-gray-500 hover:text-gray-900">
                Back to Topic
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">{topic.name}</h1>
        <p className="text-sm text-gray-500">Quiz Assessment</p>
      </div>

      {/* Progress */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="pt-6 pb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Question {currentQuestion + 1} of {questions.length}</span>
            <span className="font-medium text-gray-900">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-1.5 bg-gray-200 [&>div]:bg-purple-500" />
        </CardContent>
      </Card>

      {/* Question */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">{currentQ.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={selectedAnswers[currentQuestion]?.toString() || ''}
            onValueChange={(value) => handleAnswerSelect(parseInt(value))}
          >
            <div className="space-y-3">
              {currentQ.options.map((option: string, index: number) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                    selectedAnswers[currentQuestion] === index
                      ? 'border-purple-500/60 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-sm text-gray-700 leading-relaxed">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="border-gray-200 text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentQuestion === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-purple-600 hover:bg-purple-500 text-gray-900"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Quiz'
                )}
              </Button>
            ) : (
              <Button onClick={handleNext} className="bg-purple-600 hover:bg-purple-500 text-gray-900">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question Navigator */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {questions.map((_, index) => (
              <Button
                key={index}
                variant={currentQuestion === index ? 'default' : 'outline'}
                size="sm"
                className={`w-10 h-10 ${
                  currentQuestion === index
                    ? 'bg-purple-600 hover:bg-purple-500 text-gray-900'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
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
