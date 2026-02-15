'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProblemById, submitCode, getProblemSolution } from '@/lib/problems';
import { getCurrentUser } from '@/lib/auth';
import { updateProblemsCompleted } from '@/lib/courses';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CodeEditor } from '@/components/code-editor';
import { ArrowLeft, Award, Lock, AlertTriangle, ShieldAlert, Timer, CheckCircle, Play, Save, Code, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Orbitron, Rajdhani } from 'next/font/google';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'] });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

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
  const [isSolved, setIsSolved] = useState(false);
  const [savedCode, setSavedCode] = useState<string | null>(null);

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

    // Guard: check if algorithm explanation was approved before allowing code
    // Retry up to 3 times to handle race conditions between UI and DB updates
    const maxRetries = 3;
    let solution = null;
    let isApproved = false;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries}: Checking algorithm approval status...`);
        
        solution = await getProblemSolution(currentUser.id, problemId);
        
        // Check if solution exists and is approved
        isApproved = solution && (
          solution.status === 'algorithm_approved' || 
          solution.status === 'completed'
        );
        
        console.log(`Attempt ${attempt}: Solution status = ${solution?.status || 'not found'}, isApproved = ${isApproved}`);
        
        if (isApproved) {
          // Success! Break the retry loop
          console.log('✅ Algorithm approved, proceeding to code page');
          break;
        }
        
        // If not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          console.log(`⏳ Waiting 1 second before retry ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Attempt ${attempt} error:`, error);
        // If not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // After all retries, check if approved
    if (!isApproved) {
      console.error('❌ Algorithm not approved after all retries');
      toast.error('You must get your approach approved before writing code.');
      router.push(`/topic/${params.id}/problems/${problemId}/explain`);
      return;
    }
    
    // If already solved, load the saved code and mark as read-only
    if (solution && solution.status === 'completed') {
      setIsSolved(true);
      if (solution.code_solution) {
        setSavedCode(solution.code_solution);
      }
    }

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
      // Update topic progress: count problems solved
      if (user && problem?.topic_id) {
        const progressResult = await updateProblemsCompleted(user.id, problem.topic_id);
        if (progressResult.allSolved) {
          toast.success('All problems solved! Topic completed! 🎉', { duration: 4000 });
        }
      }
      
      setTimeout(() => {
        router.push(`/topic/${problem.topic_id}/problems`);
      }, 2000);
    } else {
      toast.error('Some tests failed. Fix your code and try again!');
    }
  };

  if (!problem) {
    return (
      <div className={`${rajdhani.className} min-h-screen bg-[#09090B] p-8`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3"></div>
          <div className="h-96 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  const defaultCode = savedCode || problem.starter_code || `// Write your solution here
function solution(input) {
  // Your code here
  return result;
}`;

  return (
    <div className={`${rajdhani.className} relative min-h-screen overflow-hidden bg-[#09090B] text-slate-200 selection:bg-purple-500/30 selection:text-white`}>
      <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-10" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-purple-950/20 via-black to-cyan-950/20" />
      
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-500/10 rounded-full blur-[150px]"></div>
      </div>

      <div className="relative z-20 flex flex-col h-screen p-4 md:p-6 gap-4">
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-black/60 border border-white/10 backdrop-blur-md p-4 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] shrink-0">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${isSolved ? 'bg-green-500/20 border-green-500/50' : 'bg-purple-500/20 border-purple-500/50'}`}>
              <Code className={`h-5 w-5 ${isSolved ? 'text-green-400' : 'text-purple-400'}`} />
            </div>
            <div>
              <h1 className={`text-lg font-bold tracking-widest text-white uppercase flex items-center gap-2 ${orbitron.className}`}>
                {problem.title}
                {isSolved && <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-bold tracking-wider">CLEARED</span>}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isSolved ? 'bg-green-500' : 'bg-purple-500'} animate-pulse`}></span>
                {isSolved ? 'SYSTEM SECURE' : 'ACTIVE EXPLOIT IN PROGRESS'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono">
            <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push(`/topic/${problem.topic_id}/problems`)} 
                className="text-xs text-slate-400 hover:text-white border border-white/5 hover:bg-white/5"
            >
              <ArrowLeft className="mr-2 h-3 w-3" />
              ABORT MISSION
            </Button>
            
            <div className="hidden md:block h-8 w-px bg-white/10"></div>
            
            <div className="hidden md:block text-right">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Difficulty</div>
              <div className={`font-bold text-sm flex items-center gap-1 justify-end uppercase ${
                problem.difficulty === 'easy' ? 'text-green-400' : 
                problem.difficulty === 'medium' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {problem.difficulty}
              </div>
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden min-h-0">
          
          {/* Left Panel: Problem Context */}
          <section className="lg:w-1/3 flex flex-col gap-4 overflow-hidden">
            <div className="bg-black/60 border border-white/10 rounded-xl flex flex-col overflow-hidden h-full shadow-lg">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-cyan-400" />
                        <span className={`text-xs font-bold text-slate-200 tracking-widest uppercase ${orbitron.className}`}>Mission Intel</span>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    <div className="prose prose-sm prose-invert max-w-none">
                        <p className="text-slate-300 leading-relaxed font-sans">{problem.description}</p>
                        
                        {problem.constraints && (
                            <div className="mt-6 mb-4">
                                <h4 className={`text-xs font-bold text-purple-300 uppercase tracking-wide mb-2 ${orbitron.className}`}>Constraints</h4>
                                <div className="bg-purple-900/10 border border-purple-500/20 rounded p-3 text-xs font-mono text-purple-200 whitespace-pre-wrap">
                                    {formatProblemField(problem.constraints)}
                                </div>
                            </div>
                        )}

                        {problem.examples && (
                            <div className="mt-4">
                                <h4 className={`text-xs font-bold text-cyan-300 uppercase tracking-wide mb-2 ${orbitron.className}`}>Test Vectors</h4>
                                <div className="bg-black/40 border border-white/10 rounded p-3 text-xs font-mono text-slate-300 whitespace-pre-wrap">
                                    {formatProblemField(problem.examples)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Console Output (Mini) */}
                <div className="border-t border-white/10 bg-black/80 p-3 min-h-[120px] max-h-[200px] overflow-y-auto font-mono text-xs">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                        <span>Console Output</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                    </div>
                    <div className="space-y-1 text-slate-400">
                        <div className="flex gap-2"><span className="text-purple-500">➜</span><span>Environment initialized.</span></div>
                        <div className="flex gap-2"><span className="text-cyan-500">➜</span><span>Loaded {testCases.length} test cases.</span></div>
                        <div className="flex gap-2"><span className="text-slate-600">➜</span><span className="opacity-50">Waiting for code execution...</span></div>
                    </div>
                </div>
            </div>
          </section>

          {/* Right Panel: Code Editor */}
          <section className="lg:w-2/3 flex flex-col bg-black/60 border border-white/10 rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent z-10"></div>
            
            <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 uppercase tracking-wide font-mono">
                    {problem.language || 'JAVASCRIPT'}
                </div>
                {isSolved && (
                  <span className="flex items-center gap-1.5 text-[10px] text-green-400 uppercase tracking-wide font-bold">
                    <Lock className="h-3 w-3" /> READ-ONLY
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
              <CodeEditor
                language={problem.language || 'javascript'}
                defaultCode={defaultCode}
                testCases={testCases}
                onSubmit={isSolved ? undefined : handleSubmit}
                onRunTests={isSolved ? undefined : handleRunTests}
                readOnly={isSolved}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
