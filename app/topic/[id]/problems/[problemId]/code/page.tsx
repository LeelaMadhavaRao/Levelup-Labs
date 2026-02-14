'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProblemById, submitCode } from '@/lib/problems';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CodeEditor } from '@/components/code-editor';
import { ArrowLeft, Award } from 'lucide-react';
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

export default function CodeProblemPage() {
  const router = useRouter();
  const params = useParams();
  const problemId = params.problemId as string;
  
  const [user, setUser] = useState<any>(null);
  const [problem, setProblem] = useState<any>(null);
  const [testCases, setTestCases] = useState<any[]>([]);

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

    // Parse test cases from problem data
    if (problemData?.test_cases) {
      try {
        const cases = typeof problemData.test_cases === 'string' 
          ? JSON.parse(problemData.test_cases)
          : problemData.test_cases;
        
        // Transform test cases to match CodeEditor interface
        const formattedCases = cases.map((testCase: any) => ({
          input: typeof testCase.input === 'string' 
            ? testCase.input 
            : JSON.stringify(testCase.input),
          expected_output: typeof testCase.expectedOutput === 'string'
            ? testCase.expectedOutput
            : JSON.stringify(testCase.expectedOutput),
        }));
        
        setTestCases(formattedCases);
      } catch (error) {
        console.error('Error parsing test cases:', error);
      }
    }
  };

  const handleRunTests = async (code: string): Promise<any[]> => {
    try {
      const result = await submitCode(user.id, problemId, code, problem.language || 'javascript');

      if (result.error) {
        toast.error(result.error);
        return testCases.map((tc: any) => ({
          ...tc,
          passed: false,
          actual_output: 'Verification failed',
        }));
      }

      if (result.allTestsPassed) {
        toast.success(`Perfect! All tests passed. +${result.pointsAwarded} points`, {
          icon: <Award className="h-4 w-4 text-yellow-500" />,
          duration: 5000,
        });
      }

      // Map server results back to TestCase format
      if (result.testResults && result.testResults.length > 0) {
        return result.testResults.map((tr: any, i: number) => ({
          input: testCases[i]?.input || '',
          expected_output: tr.expectedOutput || testCases[i]?.expected_output || '',
          passed: tr.passed,
          actual_output: tr.actualOutput || (tr.passed ? (testCases[i]?.expected_output || '') : 'Output mismatch'),
        }));
      }

      return testCases.map((tc: any) => ({
        ...tc,
        passed: result.allTestsPassed,
        actual_output: result.allTestsPassed ? tc.expected_output : (result.feedback || 'Output mismatch'),
      }));
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred during verification');
      return testCases.map((tc: any) => ({
        ...tc,
        passed: false,
        actual_output: 'Verification error',
      }));
    }
  };

  const handleSubmit = async (code: string, results: any[]) => {
    const allPassed = results.every((r) => r.passed);

    if (allPassed) {
      // Points already awarded by the edge function in handleRunTests
      setTimeout(() => {
        router.push(`/topic/${problem.topic_id}/problems`);
      }, 2000);
    } else {
      toast.error('Some tests failed. Fix your code and try again!');
    }
  };

  if (!problem) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const defaultCode = problem.starter_code || `// Write your solution here
function solution(input) {
  // Your code here
  return result;
}`;

  return (
    <div className="container py-8 max-w-6xl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Problem Description */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{problem.title}</CardTitle>
                <CardDescription className="mt-2">
                  Solve this coding challenge
                </CardDescription>
              </div>
              <Badge variant={problem.difficulty === 'easy' ? 'default' : problem.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                {problem.difficulty}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none text-sm">
              <p>{problem.description}</p>
              
              {problem.constraints && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm">Constraints:</h4>
                  <p className="text-xs text-muted-foreground">{formatProblemField(problem.constraints)}</p>
                </div>
              )}

              {problem.examples && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm">Examples:</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">{formatProblemField(problem.examples)}</pre>
                </div>
              )}

              {problem.hints && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm">Hints:</h4>
                  <p className="text-xs text-muted-foreground">{formatProblemField(problem.hints)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Code Editor */}
        <div>
          <CodeEditor
            language={problem.language || 'javascript'}
            defaultCode={defaultCode}
            testCases={testCases}
            onSubmit={handleSubmit}
            onRunTests={handleRunTests}
          />
        </div>
      </div>
    </div>
  );
}
