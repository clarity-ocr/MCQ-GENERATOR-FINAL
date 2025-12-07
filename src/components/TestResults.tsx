// src/components/TestResults.tsx

import React, { useState } from 'react';
import { View, TestAttempt, MCQ } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, Home, Filter, Clock, AlertTriangle, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';

interface TestResultsProps {
  result: TestAttempt;
  questions: MCQ[]; // These are the SHUFFLED questions from the attempt
  onNavigate: (view: View) => void;
}

export const TestResults: React.FC<TestResultsProps> = ({ result, questions, onNavigate }) => {
  const [filter, setFilter] = useState<'all' | 'incorrect'>('all');
  const percentage = Math.round((result.score / result.totalQuestions) * 100);
  const scoreColor = percentage >= 80 ? 'text-green-600' : percentage >= 50 ? 'text-orange-600' : 'text-red-600';
  const circleColor = percentage >= 80 ? 'stroke-green-500' : percentage >= 50 ? 'stroke-orange-500' : 'stroke-red-500';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <Card className="flex-1 shadow-lg border-t-4 border-t-primary">
          <CardContent className="p-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-1">Test Complete!</h2>
              <p className="text-muted-foreground">Results for: <span className="font-semibold text-foreground">{result.testTitle}</span></p>
              <div className="flex gap-4 mt-6 text-sm">
                <div className="flex flex-col"><span className="text-muted-foreground">Total Questions</span><span className="font-bold text-lg">{result.totalQuestions}</span></div>
                <div className="w-px bg-border"></div>
                <div className="flex flex-col"><span className="text-muted-foreground">Correct</span><span className="font-bold text-lg text-green-600">{result.score}</span></div>
                <div className="w-px bg-border"></div>
                <div className="flex flex-col"><span className="text-muted-foreground">Wrong / Skipped</span><span className="font-bold text-lg text-red-600">{result.totalQuestions - result.score}</span></div>
              </div>
            </div>
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-gray-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                <path className={`${circleColor} transition-all duration-1000 ease-out`} strokeDasharray={`${percentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`text-3xl font-bold ${scoreColor}`}>{percentage}%</span>
                <span className="text-[10px] text-muted-foreground uppercase">Score</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-3 min-w-[250px]">
            <Card className="flex-1 bg-muted/30"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-full text-blue-600"><Clock className="w-5 h-5" /></div><div><p className="text-xs text-muted-foreground">Completed On</p>
            {/* FIXED: Use result.date instead of result.timestamp */}
            <p className="font-semibold text-sm">{new Date(result.date).toLocaleDateString()}</p><p className="text-xs text-muted-foreground">{new Date(result.date).toLocaleTimeString()}</p></div></CardContent></Card>
            <Card className="flex-1 bg-muted/30"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-red-100 rounded-full text-red-600"><AlertTriangle className="w-5 h-5" /></div><div><p className="text-xs text-muted-foreground">Integrity Report</p><p className="font-semibold text-sm">{result.violations} Violations</p></div></CardContent></Card>
        </div>
      </div>

      <div className="flex justify-between items-center bg-card p-2 rounded-lg border sticky top-0 z-10 shadow-sm">
        <div className="flex gap-2">
            <Button variant={filter === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('all')}>All Questions</Button>
            <Button variant={filter === 'incorrect' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('incorrect')} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Filter className="w-3 h-3 mr-2" /> Incorrect Only</Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => onNavigate('dashboard')}><Home className="w-4 h-4 mr-2" /> Dashboard</Button>
      </div>

      <div className="space-y-6">
        {questions.map((q, idx) => {
            const userAnswer = result.answers[idx];
            const correctVal = q.correctAnswer || q.answer || "";
            const isCorrect = userAnswer?.trim() === correctVal.trim();
            const isSkipped = userAnswer === null;

            if (filter === 'incorrect' && isCorrect) return null;

            return (
                <Card key={idx} className={cn("overflow-hidden border-l-4 transition-all hover:shadow-md", isCorrect ? "border-l-green-500" : "border-l-red-500")}>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex gap-3">
                                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold border">{idx + 1}</span>
                                <h3 className="text-lg font-medium text-foreground leading-snug">{q.question}</h3>
                            </div>
                            <Badge variant={isCorrect ? "default" : "destructive"} className={cn("h-6", isCorrect ? "bg-green-600" : "")}>{isCorrect ? "Correct" : isSkipped ? "Skipped" : "Incorrect"}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                        <div className="grid gap-2">
                            {q.options.map((opt, optIdx) => {
                                const isSelected = userAnswer === opt;
                                const isTheCorrectAnswer = opt === correctVal;
                                let styleClass = "border-border bg-card hover:bg-accent/50";
                                let icon = null;

                                if (isTheCorrectAnswer) {
                                    styleClass = "border-green-500 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500";
                                    icon = <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />;
                                } else if (isSelected && !isCorrect) {
                                    styleClass = "border-red-500 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500";
                                    icon = <XCircle className="w-5 h-5 text-red-600 ml-auto" />;
                                }

                                return (
                                    <div key={optIdx} className={cn("p-3 rounded-lg border flex items-center gap-3 transition-colors", styleClass)}>
                                        <div className="text-sm font-medium">{String.fromCharCode(65 + optIdx)}.</div>
                                        <span className={cn("text-sm flex-1", isTheCorrectAnswer ? "font-semibold" : "")}>{opt}</span>
                                        {icon}
                                        {isSelected && !isTheCorrectAnswer && <span className="text-xs text-red-600 font-bold px-2">YOUR ANSWER</span>}
                                        {isTheCorrectAnswer && <span className="text-xs text-green-600 font-bold px-2">CORRECT ANSWER</span>}
                                    </div>
                                );
                            })}
                        </div>
                        {q.explanation && (
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 flex gap-3">
                                <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div><h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-1">Explanation</h4><p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">{q.explanation}</p></div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            );
        })}
      </div>
      <div className="flex justify-center pt-8"><Button size="lg" className="px-12" onClick={() => onNavigate('dashboard')}>Return to Dashboard</Button></div>
    </div>
  );
};