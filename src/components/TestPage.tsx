// src/components/TestPage.tsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  Maximize2,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import type { Test, Student, MCQ } from '../types';
import { cn } from '../lib/utils';

interface TestPageProps {
  test: Test;
  student: Student;
  // UPDATED: Now accepts the shuffled questions list for storage
  onFinish: (answers: (string | null)[], violations: number, usedQuestions: MCQ[]) => void;
}

const VIOLATION_LIMIT = 3;

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const TestPage: React.FC<TestPageProps> = ({ test, student, onFinish }) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(() => Array(test.questions.length).fill(null));
  const [markedForReview, setMarkedForReview] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(test.durationMinutes * 60);
  const [violations, setViolations] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [showViolationModal, setShowViolationModal] = useState(false);

  // Store the shuffled version of questions for this session
  const [processedQuestions, setProcessedQuestions] = useState<MCQ[]>([]);

  // Init Shuffle (Run once on mount/test change)
  useEffect(() => {
    let qs = [...test.questions];
    if (test.shuffleQuestions) qs = shuffleArray(qs);
    if (test.shuffleOptions) {
        qs = qs.map(q => ({ ...q, options: shuffleArray(q.options) }));
    }
    setProcessedQuestions(qs);
  }, [test]);

  const onFinishRef = useRef(onFinish);
  const stateRef = useRef({ violations, answers, processedQuestions });

  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);
  useEffect(() => { 
      stateRef.current = { violations, answers, processedQuestions }; 
  }, [violations, answers, processedQuestions]);

  const goToNext = useCallback(() => {
    setCurrentQuestionIndex(prev => Math.min(processedQuestions.length - 1, prev + 1));
  }, [processedQuestions.length]);

  const goToPrev = useCallback(() => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  }, []);

  const endTest = useCallback(() => {
    if (test.allowSkip === false) { 
        const hasUnanswered = stateRef.current.answers.some(a => a === null);
        if (hasUnanswered) {
            alert("Skipping is disabled. You must answer all questions to submit.");
            return;
        }
    }

    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    
    // UPDATED: Pass the specific shuffled questions used in this attempt
    onFinishRef.current(
        stateRef.current.answers, 
        stateRef.current.violations, 
        stateRef.current.processedQuestions
    );
  }, [test.allowSkip]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullScreen || showViolationModal || !hasStarted) return; 
      
      switch(e.key) {
        case 'ArrowRight': goToNext(); break;
        case 'ArrowLeft': goToPrev(); break;
        case 'Enter': 
          if (currentQuestionIndex < processedQuestions.length - 1) goToNext();
          else if (confirm("Submit test?")) endTest(); 
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, showViolationModal, hasStarted, goToNext, goToPrev, currentQuestionIndex, processedQuestions.length, endTest]);

  const triggerViolation = useCallback(() => {
    setViolations(prev => {
      const newCount = prev + 1;
      setAnswers(Array(test.questions.length).fill(null)); // Clear answers penalty
      
      if (newCount >= VIOLATION_LIMIT) { 
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        onFinishRef.current(
            Array(test.questions.length).fill(null), 
            newCount, 
            stateRef.current.processedQuestions
        ); 
      } else { 
        setShowViolationModal(true); 
      }
      return newCount;
    });
  }, [test.questions.length]);

  useEffect(() => {
    if (!hasStarted) return; 

    const handleFullScreenChange = () => {
      const isFull = document.fullscreenElement != null;
      setIsFullScreen(isFull);
      if (!isFull && stateRef.current.violations < VIOLATION_LIMIT) { 
        triggerViolation(); 
      }
    };

    const handleVisibilityChange = () => {
        if (document.hidden && stateRef.current.violations < VIOLATION_LIMIT) {
            triggerViolation();
        }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
        document.removeEventListener('fullscreenchange', handleFullScreenChange);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [triggerViolation, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    if (timeLeft <= 0) { 
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        onFinishRef.current(stateRef.current.answers, stateRef.current.violations, stateRef.current.processedQuestions);
        return; 
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, hasStarted]);

  const handleAnswerSelect = (option: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = option;
    setAnswers(newAnswers);
  };

  const toggleMarkReview = () => {
    setMarkedForReview(prev => prev.includes(currentQuestionIndex) ? prev.filter(i => i !== currentQuestionIndex) : [...prev, currentQuestionIndex]);
  };

  const navigateTo = (index: number) => {
    setCurrentQuestionIndex(index);
    setIsPaletteOpen(false);
  };

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  const progressPercentage = Math.round((answers.filter(a => a !== null).length / processedQuestions.length) * 100);
  const isCriticalTime = timeLeft < 300;
  
  if (processedQuestions.length === 0) return <div className="flex h-screen items-center justify-center">Preparing Test...</div>;

  if (!hasStarted) {
    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-4">
            <Card className="max-w-2xl w-full shadow-xl">
                <div className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold">{test.title}</h1>
                        <p className="text-muted-foreground">Instructions & Integrity Rules</p>
                    </div>

                    <div className="space-y-4 bg-muted/30 p-6 rounded-lg border">
                        <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                                <h3 className="font-semibold">Timed Exam</h3>
                                <p className="text-sm text-muted-foreground">You have {test.durationMinutes} minutes.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                                <h3 className="font-semibold">Question Policy</h3>
                                <p className="text-sm text-muted-foreground">
                                    {test.allowSkip === false ? "Strict Mode: Answer ALL questions." : "Standard Mode: Skipping allowed."}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <ShieldAlert className="w-5 h-5 text-destructive mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-destructive">Strict Violation Policy</h3>
                                <p className="text-sm text-destructive/80">
                                    Violations (tab switch, exit fullscreen) will <strong>reset all answers</strong>.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button 
                        size="lg" 
                        className="w-full text-lg h-12" 
                        onClick={() => {
                            document.documentElement.requestFullscreen().then(() => {
                                setHasStarted(true);
                            }).catch(() => alert("Fullscreen permission denied."));
                        }}
                    >
                        I Agree & Start Test
                    </Button>
                </div>
            </Card>
        </div>
    );
  }

  if (!isFullScreen && violations < VIOLATION_LIMIT && !showViolationModal) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="p-4 bg-destructive/10 rounded-full animate-pulse">
          <Maximize2 className="w-12 h-12 text-destructive" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-destructive">Fullscreen Required</h2>
          <p className="text-muted-foreground max-w-md mt-2">
            Return to fullscreen to continue.
          </p>
        </div>
        <Button size="lg" onClick={() => document.documentElement.requestFullscreen().catch(() => {})}>
          Return to Fullscreen
        </Button>
      </div>
    );
  }

  const currentQ = processedQuestions[currentQuestionIndex];

  return (
    <div className="fixed inset-0 bg-background flex flex-col z-40 select-none">
      <header className="h-16 border-b flex items-center justify-between px-4 bg-card shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setIsPaletteOpen(true)} className="lg:hidden">
            <Menu className="w-5 h-5" />
          </Button>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg truncate max-w-[200px]">{test.title}</h1>
            <p className="text-xs text-muted-foreground">Candidate: {student.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <div className="hidden md:flex flex-col items-end w-32">
            <div className="text-xs text-muted-foreground flex justify-between w-full mb-1">
              <span>Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>

          <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-md font-mono font-bold border", isCriticalTime ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-secondary text-foreground")}>
            <Clock className="w-4 h-4" />
            {formattedTime}
          </div>

          <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
            <AlertTriangle className="w-3 h-3" />
            {violations}/{VIOLATION_LIMIT}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col">
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col justify-center space-y-6">
            <Card className="border-0 shadow-none bg-transparent md:border md:bg-card md:shadow-sm">
              <div className="p-0 md:p-6 space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <h2 className="text-xl md:text-2xl font-semibold leading-relaxed text-foreground">
                    <span className="text-muted-foreground mr-2 opacity-50">#{currentQuestionIndex + 1}</span>
                    {currentQ.question}
                  </h2>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleMarkReview}
                    className={cn(markedForReview.includes(currentQuestionIndex) ? "text-orange-500 bg-orange-50" : "text-muted-foreground")}
                  >
                    <Flag className={cn("w-5 h-5", markedForReview.includes(currentQuestionIndex) && "fill-current")} />
                  </Button>
                </div>

                <div className="space-y-3">
                  {currentQ.options.map((option, idx) => {
                    const isSelected = answers[currentQuestionIndex] === option;
                    return (
                      <div 
                        key={idx}
                        onClick={() => handleAnswerSelect(option)}
                        className={cn(
                          "relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-accent/50",
                          isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card"
                        )}
                      >
                        <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 transition-colors", isSelected ? "border-primary bg-primary" : "border-muted-foreground/30")}>
                          {isSelected && <div className="w-2 h-2 bg-primary-foreground rounded-full" />}
                        </div>
                        <span className="text-base md:text-lg">{option}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        </main>

        <aside className={cn(
          "fixed inset-y-0 right-0 w-80 bg-card border-l transform transition-transform duration-300 z-20 flex flex-col",
          "lg:relative lg:translate-x-0", 
          isPaletteOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Question Palette</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsPaletteOpen(false)} className="lg:hidden">
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {processedQuestions.map((_, idx) => {
                const isAnswered = answers[idx] !== null;
                const isMarked = markedForReview.includes(idx);
                const isCurrent = currentQuestionIndex === idx;
                
                let btnClass = "bg-muted text-muted-foreground hover:bg-muted/80";
                if (isAnswered) btnClass = "bg-green-100 text-green-700 border-green-200";
                if (isMarked) btnClass = "bg-orange-100 text-orange-700 border-orange-200";
                if (isCurrent) btnClass = "ring-2 ring-primary ring-offset-2";

                return (
                  <button key={idx} onClick={() => navigateTo(idx)} className={cn("h-10 w-10 rounded-lg text-sm font-medium transition-all flex items-center justify-center relative", btnClass)}>
                    {idx + 1}
                    {isMarked && <div className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full translate-x-1/4 -translate-y-1/4 border border-background" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t space-y-4 bg-muted/10">
            <Button className="w-full" size="lg" onClick={endTest}>Submit Test</Button>
          </div>
        </aside>

        {isPaletteOpen && <div className="fixed inset-0 bg-black/50 z-10 lg:hidden" onClick={() => setIsPaletteOpen(false)} />}
      </div>

      {showViolationModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md border-destructive shadow-2xl animate-in zoom-in-95">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-destructive">Integrity Violation</h3>
                <p className="text-muted-foreground mt-2">
                    You navigated away from the test window.
                </p>
                <div className="mt-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg text-sm text-destructive font-semibold">
                    PENALTY APPLIED: Answers reset.
                </div>
                <p className="font-semibold mt-4">Violation Count: {violations}/{VIOLATION_LIMIT}</p>
              </div>
              <Button variant="destructive" className="w-full" onClick={() => { setShowViolationModal(false); document.documentElement.requestFullscreen().catch(() => {}); }}>
                Continue
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};