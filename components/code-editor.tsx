'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Play, Check, X, Loader2 } from 'lucide-react';

interface TestCase {
  input: string;
  expected_output: string;
  passed?: boolean;
  actual_output?: string;
}

interface CodeEditorProps {
  language: string;
  defaultCode?: string;
  testCases: TestCase[];
  onSubmit?: (code: string, results: TestCase[]) => void;
  onRunTests?: (code: string) => Promise<TestCase[]>;
  readOnly?: boolean;
}

export function CodeEditor({
  language,
  defaultCode = '',
  testCases,
  onSubmit,
  onRunTests,
  readOnly = false,
}: CodeEditorProps) {
  const [code, setCode] = useState(defaultCode);
  const [results, setResults] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRunTests = async () => {
    setLoading(true);
    
    try {
      let testResults: TestCase[];

      if (onRunTests) {
        // Delegate test execution to parent (server-side AI verification)
        testResults = await onRunTests(code);
      } else {
        // No test runner provided - cannot verify locally
        testResults = testCases.map((testCase) => ({
          ...testCase,
          passed: false,
          actual_output: 'Server verification required',
        }));
      }

      setResults(testResults);

      if (onSubmit) {
        onSubmit(code, testResults);
      }
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{language}</Badge>
            {results.length > 0 && (
              <Badge variant={passedCount === totalCount ? 'default' : 'destructive'}>
                {passedCount}/{totalCount} Passed
              </Badge>
            )}
          </div>
          <Button
            onClick={handleRunTests}
            disabled={loading || readOnly || !code.trim()}
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Tests
              </>
            )}
          </Button>
        </div>

        <Textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={`Write your ${language} code here...`}
          className="min-h-[400px] font-mono text-sm"
          readOnly={readOnly}
        />
      </Card>

      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Test Results</h3>
          {results.map((result, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">Test Case {index + 1}</span>
                    {result.passed ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Input:</span>
                      <code className="ml-2 bg-muted px-2 py-1 rounded">
                        {result.input}
                      </code>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expected:</span>
                      <code className="ml-2 bg-muted px-2 py-1 rounded">
                        {result.expected_output}
                      </code>
                    </div>
                    {result.actual_output && (
                      <div>
                        <span className="text-muted-foreground">Actual:</span>
                        <code
                          className={`ml-2 px-2 py-1 rounded ${
                            result.passed ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}
                        >
                          {result.actual_output}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
