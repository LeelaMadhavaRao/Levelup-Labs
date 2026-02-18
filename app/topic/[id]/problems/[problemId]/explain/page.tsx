'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProblemById, submitAlgorithmExplanation, getProblemSolution } from '@/lib/problems';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Send, CheckCircle, XCircle, Code, Loader2, Eye, Lock, Brain, FileText, Activity } from 'lucide-react';
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

function formatAiText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value.map((entry) => formatAiText(entry)).filter(Boolean).join('\n')
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  return String(value)
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
        // If previously approved (status is algorithm_approved or completed), mark as approved
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
        feedback: formatAiText(result.feedback),
        suggestions: formatAiText(result.suggestions),
      });
        
      if (result.isCorrect) {
        toast.success('Great work! Your algorithm is correct!');
        setApprovedText(explanation);
        
        // Wait to ensure database has fully updated before allowing navigation
        // This prevents race conditions when clicking "Go to Code" immediately
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

  if (!problem) {
    return (
      <div className={`${rajdhani.className} relative min-h-screen overflow-hidden bg-[#09090B] text-slate-100`}>
        <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-10" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-purple-950/20 via-black to-cyan-950/20" />
        <div className="relative z-20 container py-8 max-w-7xl">
        <div className="animate-pulse space-y-4">
          <div className="h-10 rounded bg-white/10 w-1/3"></div>
          <div className="h-64 rounded bg-white/10"></div>
        </div>
        </div>
      </div>
    );
  }

  const difficultyColor = problem.difficulty === 'easy' ? 'text-green-400' : problem.difficulty === 'medium' ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className={`${rajdhani.className} relative min-h-screen overflow-hidden bg-[#09090B] text-slate-100`}>
      <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-10" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-purple-950/20 via-black to-cyan-950/20" />

      <div className="relative z-20 container py-6 max-w-7xl h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="border-white/20 hover:bg-white/10 text-slate-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              ABORT
            </Button>
            <div>
              <h1 className={`${orbitron.className} text-xl font-bold tracking-widest text-white`}>
                ALGORITHM ANALYSIS
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                <span>{problem.title.toUpperCase()}</span>
                <span className="text-purple-500">//</span>
                <span className={difficultyColor}>{problem.difficulty.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-500 mr-4">
               <div className="flex items-center gap-1">
                 <Activity className="h-3 w-3" />
                 <span>SYSTEM READY</span>
               </div>
               <div className="flex items-center gap-1">
                 <Brain className="h-3 w-3" />
                 <span>AI LINKED</span>
               </div>
             </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          
          {/* Left Panel: Problem Brief */}
          <Card className="flex flex-col border-white/10 bg-black/60 backdrop-blur-sm overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <CardHeader className="border-b border-white/5 bg-white/5 py-3 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-400" />
                <CardTitle className={`${orbitron.className} text-sm font-bold tracking-wider text-slate-200`}>
                  PROBLEM DETAILS
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-purple-900/50 scrollbar-track-transparent">
              <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-slate-100 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                <h3 className={`${orbitron.className} text-lg text-white mb-4 flex items-center gap-2`}>
                   {problem.title}
                </h3>
                
                <p className="text-slate-300 leading-relaxed">{problem.description}</p>
                
                {problem.constraints && (
                  <div className="mt-6 p-4 bg-purple-900/10 border border-purple-500/20 rounded-lg">
                    <h4 className={`${orbitron.className} text-sm text-purple-300 mb-2 uppercase tracking-wide`}>Constraints:</h4>
                    <p className="text-sm font-mono text-purple-200/80 whitespace-pre-wrap">{formatProblemField(problem.constraints)}</p>
                  </div>
                )}

                {problem.examples && (
                  <div className="mt-6 space-y-4">
                    <h4 className={`${orbitron.className} text-sm text-cyan-300 uppercase tracking-wide`}>Test Vectors (Examples):</h4>
                    <pre className="text-sm font-mono bg-black/40 border border-white/10 p-4 rounded-lg text-slate-300 shadow-inner">
                      {formatProblemField(problem.examples)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Panel: Strategy Terminal */}
          <Card className="flex flex-col border-white/10 bg-black/60 backdrop-blur-sm overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <CardHeader className="border-b border-white/5 bg-white/5 py-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-cyan-400" />
                  <CardTitle className={`${orbitron.className} text-sm font-bold tracking-wider text-slate-200`}>
                    STRATEGY TERMINAL
                  </CardTitle>
                </div>
                {isSolved && (
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20 font-mono text-xs">
                    <Lock className="mr-1 h-3 w-3" />
                    LOCKED // SOLVED
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative">
              <div className="absolute top-2 right-4 z-10 text-[10px] text-slate-600 font-mono pointer-events-none">
                 // INPUT_MODE: MARKDOWN
              </div>
              <Textarea
                value={explanation}
                onChange={(e) => {
                  if (isSolved) return;
                  setExplanation(e.target.value);
                }}
                readOnly={isSolved}
                placeholder={`>> INITIALIZE STRATEGY SEQUENCE...\n\n1. APPROACH VECTOR:\n   [Describe data structures and core logic]\n\n2. ALGORITHM EXECUTION:\n   [Step-by-step process]\n\n3. EFFICIENCY METRICS:\n   - Time Complexity: O(?)\n   - Space Complexity: O(?)`}
                className={`flex-1 w-full resize-none rounded-none border-0 bg-transparent p-6 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus-visible:ring-0 ${isSolved ? 'opacity-80 cursor-not-allowed' : ''}`}
              />
              
              {/* Feedback Area */}
              {(feedback || hasChangedSinceApproval) && (
                <div className="border-t border-white/10 bg-black/40 p-4 max-h-[40%] overflow-y-auto shrink-0">
                  {feedback && (
                     <div className={`p-4 rounded border ${feedback.isCorrect ? 'bg-green-950/30 border-green-500/30' : 'bg-red-950/30 border-red-500/30'}`}>
                        <div className="flex items-start gap-3">
                          {feedback.isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
                          )}
                          <div className="space-y-2">
                            <p className={`font-bold ${orbitron.className} tracking-wide ${feedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                              {feedback.isCorrect ? 'ANALYSIS CONFIRMED' : 'LOGIC ERROR DETECTED'}
                            </p>
                            <p className="text-sm text-slate-300 font-mono whitespace-pre-wrap">{formatAiText(feedback.feedback)}</p>
                            {feedback.suggestions && (
                               <div className="mt-3 pt-3 border-t border-white/5">
                                 <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Optimization Suggestions:</p>
                                 <p className="text-sm text-slate-400 font-mono whitespace-pre-wrap">{formatAiText(feedback.suggestions)}</p>
                               </div>
                            )}
                          </div>
                        </div>
                     </div>
                  )}
                  
                  {hasChangedSinceApproval && (
                    <div className="mt-2 text-xs text-yellow-500 font-mono flex items-center gap-2">
                      <Activity className="h-3 w-3" />
                      <span>Warning: Strategy modified since last approval. Re-verification required.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Bar */}
              <div className="border-t border-white/10 bg-white/5 p-4 shrink-0 flex gap-3">
                 {!isSolved && (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !explanation.trim() || isApproved}
                    className={`flex-1 font-mono tracking-wide ${isApproved ? 'bg-green-600 hover:bg-green-500' : 'bg-purple-600 hover:bg-purple-500'}`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        PROCESSING...
                      </>
                    ) : isApproved ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        APPROVED // LOCKED
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        SUBMIT ANALYSIS
                      </>
                    )}
                  </Button>
                )}
                
                {(isApproved || isSolved) && (
                  <Button
                    onClick={() => router.push(`/topic/${problem.topic_id}/problems/${problemId}/code`)}
                    className={isSolved ? 'flex-1 bg-green-600 hover:bg-green-500 text-white font-mono' : 'bg-cyan-600 hover:bg-cyan-500 text-white font-mono'}
                  >
                    {isSolved ? (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        REVIEW CODE
                      </>
                    ) : (
                      <>
                        <Code className="mr-2 h-4 w-4" />
                        INITIATE CODE
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
