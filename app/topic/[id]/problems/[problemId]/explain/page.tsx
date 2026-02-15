'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProblemById, submitAlgorithmExplanation, submitProblemSolution, getProblemSolution } from '@/lib/problems';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Send, CheckCircle, XCircle, Code, Loader2, Eye, Lock } from 'lucide-react';
import { toast } from 'sonner';

function formatProblemField(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  
  // Handle array of example objects specially
  if (Array.isArray(value) && value.length > 0 && value[0].input !== undefined) {
    return value.map((ex: any, idx: number) => 
      `Example ${idx + 1}:\n` +
      `Input: ${ex.input}\n` +
      `Output: ${ex.output}\n` +
      (ex.explanation ? `Explanation: ${ex.explanation}` : '')
    ).join('\n\n')
  }
  
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export default function ExplainProblemPage() {
  const router = useRouter();
  const params = useParams();
  const problemId = params.problemId as string;
  
  const [user, setUser] = useState<any>(null);
  const [problem, setProblem] = useState<any>(null);
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  // Track the text that was approved so we can detect edits
  const [approvedText, setApprovedText] = useState<string | null>(null);
  // Track if the problem is fully solved (code completed)
  const [isSolved, setIsSolved] = useState(false);

  // Derived: approach is approved AND text hasn't changed since approval
  const isApproved = approvedText !== null && explanation.trim() === approvedText.trim();
  // Derived: text changed after an approval → allow re-submit
  const hasChangedSinceApproval = approvedText !== null && explanation.trim() !== approvedText.trim();

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

    // Check if user already has an approved algorithm explanation
    try {
      const existingSolution = await getProblemSolution(currentUser.id, problemId);
      if (existingSolution && existingSolution.algorithm_explanation) {
        setExplanation(existingSolution.algorithm_explanation);
        // If previously approved (status is algorithm_submitted or completed), mark as approved
        if (existingSolution.status === 'algorithm_submitted' || existingSolution.status === 'completed') {
          setApprovedText(existingSolution.algorithm_explanation);
          const solved = existingSolution.status === 'completed';
          setIsSolved(solved);
          setFeedback({
            isCorrect: true,
            feedback: solved
              ? 'This problem is solved. Your approach and code have been submitted successfully.'
              : 'Your approach was previously approved. You can proceed to coding!',
            suggestions: null,
          });
        }
      }
    } catch {
      // No existing solution — that's fine
    }
  };

  const handleSubmit = async () => {
    if (!explanation.trim()) {
      toast.error('Please write an explanation');
      return;
    }

    setLoading(true);
    // Reset previous approval if text was changed
    if (hasChangedSinceApproval) {
      setApprovedText(null);
      setFeedback(null);
    }

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
        setApprovedText(explanation);
        // Save solution to DB with status 'algorithm_submitted'
        try {
          await submitProblemSolution(user.id, problemId, explanation);
        } catch (e) {
          console.error('Error saving solution:', e);
        }
      } else {
        setApprovedText(null);
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
                <p className="text-sm text-muted-foreground">{formatProblemField(problem.constraints)}</p>
              </div>
            )}

            {problem.examples && (
              <div className="mt-4">
                <h4 className="font-semibold">Examples:</h4>
                <pre className="text-sm bg-muted p-3 rounded">{formatProblemField(problem.examples)}</pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Explanation</CardTitle>
              <CardDescription>
                {isSolved
                  ? 'Your submitted approach (read-only)'
                  : 'Explain your approach, algorithm, time complexity, and space complexity'}
              </CardDescription>
            </div>
            {isSolved && (
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                <Lock className="mr-1 h-3 w-3" />
                Solved
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={explanation}
            onChange={(e) => {
              if (isSolved) return;
              setExplanation(e.target.value);
            }}
            readOnly={isSolved}
            placeholder="Example:&#10;1. Approach: Use a hash map to store...&#10;2. Algorithm: First, iterate through...&#10;3. Time Complexity: O(n)&#10;4. Space Complexity: O(n)"
            rows={12}
            className={`font-mono text-sm ${isSolved ? 'opacity-80 cursor-not-allowed bg-muted' : ''}`}
          />

          {feedback && (
            <Alert variant={feedback.isCorrect && isApproved ? 'default' : feedback.isCorrect && hasChangedSinceApproval ? 'default' : !feedback.isCorrect ? 'destructive' : 'default'}>
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
                    {feedback.suggestions && (
                      <p className="text-sm mt-2 text-muted-foreground">{feedback.suggestions}</p>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {hasChangedSinceApproval && (
            <Alert>
              <AlertDescription className="text-sm text-muted-foreground">
                You&apos;ve modified your approach since it was approved. Submit again to re-verify.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {!isSolved && (
              <Button
                onClick={handleSubmit}
                disabled={loading || !explanation.trim() || isApproved}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : isApproved ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approach Approved
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Explanation
                  </>
                )}
              </Button>
            )}
            {(isApproved || isSolved) && (
              <Button
                onClick={() => router.push(`/topic/${problem.topic_id}/problems/${problemId}/code`)}
                className={isSolved ? 'flex-1 bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
              >
                {isSolved ? (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    View Code
                  </>
                ) : (
                  <>
                    <Code className="mr-2 h-4 w-4" />
                    Go to Code
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
