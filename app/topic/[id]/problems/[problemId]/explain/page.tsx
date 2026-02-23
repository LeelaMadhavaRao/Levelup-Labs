'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProblemById, submitAlgorithmExplanation, getProblemSolution } from '@/lib/problems';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, CheckCircle, XCircle, Code, Loader2, Eye, Lock, Brain, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

function formatProblemField(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0 && value[0].input !== undefined) {
    return value.map((ex: any, idx: number) =>
      `Example ${idx + 1}:\nInput: ${ex.input}\nOutput: ${ex.output}\n${ex.explanation ? `Explanation: ${ex.explanation}` : ''}`
    ).join('\n\n');
  }
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

function formatAiText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map((entry) => formatAiText(entry)).filter(Boolean).join('\n');
  if (typeof value === 'object') { try { return JSON.stringify(value, null, 2); } catch { return String(value); } }
  return String(value);
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
  const [approvedText, setApprovedText] = useState<string | null>(null);
  const [isSolved, setIsSolved] = useState(false);

  const isApproved = approvedText !== null && explanation.trim() === approvedText.trim();
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

    try {
      const existingSolution = await getProblemSolution(currentUser.id, problemId);
      if (existingSolution && existingSolution.algorithm_explanation) {
        setExplanation(existingSolution.algorithm_explanation);
        if (existingSolution.status === 'algorithm_approved' || existingSolution.status === 'completed') {
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
      // No existing solution
    }
  };

  const handleSubmit = async () => {
    if (!explanation.trim()) {
      toast.error('Please write an explanation');
      return;
    }

    setLoading(true);
    if (hasChangedSinceApproval) {
      setApprovedText(null);
      setFeedback(null);
    }

    try {
      const result = await submitAlgorithmExplanation(user.id, problemId, explanation);
      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      setFeedback({
        isCorrect: result.isCorrect,
        feedback: formatAiText(result.feedback),
        suggestions: formatAiText(result.suggestions),
      });

      if (result.isCorrect) {
        toast.success('Great work! Your algorithm is correct!');
        setApprovedText(explanation);
        await new Promise(resolve => setTimeout(resolve, 1500));
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

  const getDifficultyColor = (d: string) =>
    d === 'easy' ? 'text-green-600 bg-green-50 border-green-500/20'
      : d === 'medium' ? 'text-yellow-600 bg-yellow-50 border-yellow-500/20'
      : 'text-red-600 bg-red-50 border-red-500/20';

  if (!problem) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 rounded bg-gray-200 w-1/3" />
          <div className="h-64 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="border-gray-200 text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{problem.title}</h1>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <span>Algorithm Explanation</span>
              <span className="text-slate-600">·</span>
              <Badge variant="outline" className={`text-[10px] capitalize ${getDifficultyColor(problem.difficulty)}`}>
                {problem.difficulty}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Left: Problem details */}
        <Card className="flex flex-col border-gray-200 bg-white overflow-hidden">
          <CardHeader className="border-b border-gray-100 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              <CardTitle className="text-sm font-semibold text-gray-900">Problem Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{problem.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{problem.description}</p>
            </div>

            {problem.constraints && (
              <div className="rounded-lg border border-purple-200 bg-purple-500/5 p-4">
                <h4 className="text-sm font-semibold text-purple-600 mb-2">Constraints</h4>
                <p className="text-sm text-gray-600 font-mono whitespace-pre-wrap">{formatProblemField(problem.constraints)}</p>
              </div>
            )}

            {problem.examples && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Examples</h4>
                <pre className="text-sm font-mono bg-gray-50 border border-gray-200 p-4 rounded-lg text-gray-600 whitespace-pre-wrap">
                  {formatProblemField(problem.examples)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Strategy input */}
        <Card className="flex flex-col border-gray-200 bg-white overflow-hidden">
          <CardHeader className="border-b border-gray-100 py-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <CardTitle className="text-sm font-semibold text-gray-900">Your Approach</CardTitle>
              </div>
              {isSolved && (
                <Badge className="bg-green-50 text-green-600 border-green-500/20 text-xs">
                  <Lock className="mr-1 h-3 w-3" />
                  Solved
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <Textarea
              value={explanation}
              onChange={(e) => { if (!isSolved) setExplanation(e.target.value); }}
              readOnly={isSolved}
              placeholder={`Describe your approach:\n\n1. Algorithm strategy:\n   What data structures and logic will you use?\n\n2. Steps:\n   Walk through the process step by step\n\n3. Complexity:\n   - Time: O(?)\n   - Space: O(?)`}
              className={`flex-1 w-full resize-none rounded-none border-0 bg-transparent p-6 font-mono text-sm text-gray-700 placeholder:text-slate-600 focus-visible:ring-0 ${isSolved ? 'opacity-70 cursor-not-allowed' : ''}`}
            />

            {/* Feedback */}
            {(feedback || hasChangedSinceApproval) && (
              <div className="border-t border-gray-200 bg-gray-50 p-4 max-h-[40%] overflow-y-auto shrink-0">
                {feedback && (
                  <div className={`p-4 rounded-lg border ${feedback.isCorrect ? 'bg-green-50 border-green-500/20' : 'bg-red-50 border-red-500/20'}`}>
                    <div className="flex items-start gap-3">
                      {feedback.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                      )}
                      <div className="space-y-2 min-w-0">
                        <p className={`font-semibold text-sm ${feedback.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          {feedback.isCorrect ? 'Approach Approved' : 'Needs Improvement'}
                        </p>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{formatAiText(feedback.feedback)}</p>
                        {feedback.suggestions && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-400 mb-1">Suggestions:</p>
                            <p className="text-sm text-gray-500 whitespace-pre-wrap">{formatAiText(feedback.suggestions)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {hasChangedSinceApproval && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-yellow-500">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Approach modified since last approval. Re-submit to verify.</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-gray-200 bg-gray-50 p-4 shrink-0 flex gap-3">
              {!isSolved && (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !explanation.trim() || isApproved}
                  className={`flex-1 ${isApproved ? 'bg-green-600 hover:bg-green-500' : 'bg-purple-600 hover:bg-purple-500'} text-gray-900`}
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
                  ) : isApproved ? (
                    <><CheckCircle className="mr-2 h-4 w-4" />Approved</>
                  ) : (
                    <><Send className="mr-2 h-4 w-4" />Submit for Review</>
                  )}
                </Button>
              )}

              {(isApproved || isSolved) && (
                <Button
                  onClick={() => router.push(`/topic/${problem.topic_id}/problems/${problemId}/code`)}
                  className={isSolved ? 'flex-1 bg-gray-200 hover:bg-white/15 text-gray-900' : 'bg-purple-600 hover:bg-purple-500 text-gray-900'}
                >
                  {isSolved ? (
                    <><Eye className="mr-2 h-4 w-4" />Review Code</>
                  ) : (
                    <><Code className="mr-2 h-4 w-4" />Go to Code</>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
