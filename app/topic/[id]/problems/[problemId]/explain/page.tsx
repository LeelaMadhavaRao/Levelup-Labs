'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProblemById, submitAlgorithmExplanation } from '@/lib/problems';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Send, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ExplainProblemPage() {
  const router = useRouter();
  const params = useParams();
  const problemId = params.problemId as string;
  
  const [user, setUser] = useState<any>(null);
  const [problem, setProblem] = useState<any>(null);
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [problemId]);

  const loadData = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    setUser(currentUser);

    const problemData = await getProblemById(problemId);
    setProblem(problemData);
  };

  const handleSubmit = async () => {
    if (!explanation.trim()) {
      toast.error('Please write an explanation');
      return;
    }

    setLoading(true);
    try {
      const result = await submitAlgorithmExplanation(
        user.id,
        problemId,
        explanation
      );

      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      // Set feedback from AI response
      setFeedback({
        isCorrect: result.isCorrect,
        feedback: result.feedback,
        suggestions: result.suggestions,
      });
        
      if (result.isCorrect) {
        toast.success('Great work! Your algorithm is correct!');
      } else {
        toast.error('Not quite right. Check the feedback and try again!');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!problem) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{problem.title}</CardTitle>
              <CardDescription className="mt-2">
                Explain the algorithm or approach to solve this problem
              </CardDescription>
            </div>
            <Badge variant={problem.difficulty === 'easy' ? 'default' : problem.difficulty === 'medium' ? 'secondary' : 'destructive'}>
              {problem.difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none">
            <p>{problem.description}</p>
            
            {problem.constraints && (
              <div className="mt-4">
                <h4 className="font-semibold">Constraints:</h4>
                <p className="text-sm text-muted-foreground">{problem.constraints}</p>
              </div>
            )}

            {problem.examples && (
              <div className="mt-4">
                <h4 className="font-semibold">Examples:</h4>
                <pre className="text-sm bg-muted p-3 rounded">{problem.examples}</pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Explanation</CardTitle>
          <CardDescription>
            Explain your approach, algorithm, time complexity, and space complexity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Example:&#10;1. Approach: Use a hash map to store...&#10;2. Algorithm: First, iterate through...&#10;3. Time Complexity: O(n)&#10;4. Space Complexity: O(n)"
            rows={12}
            className="font-mono text-sm"
          />

          {feedback && (
            <Alert variant={feedback.isCorrect ? 'default' : 'destructive'}>
              <div className="flex items-start gap-2">
                {feedback.isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <p className="font-semibold mb-2">
                      {feedback.isCorrect ? 'Excellent!' : 'Not quite right'}
                    </p>
                    <p className="text-sm">{feedback.feedback}</p>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={loading || !explanation.trim()}
              className="flex-1"
            >
              <Send className="mr-2 h-4 w-4" />
              {loading ? 'Submitting...' : 'Submit Explanation'}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/topic/${problem.topic_id}/problems/${problemId}/code`)}
            >
              Skip to Code
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
