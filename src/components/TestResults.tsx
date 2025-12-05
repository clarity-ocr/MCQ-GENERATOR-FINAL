// src/components/TestResults.tsx

import React, { useState } from 'react';
import type { TestAttempt, MCQ } from '../types';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  ChevronUp, 
  AlertCircle,
  HelpCircle,
  BookOpen,
  ArrowLeft,
  MousePointer2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface TestResultsProps {
  result: TestAttempt;
  questions?: MCQ[]; 
  onNavigate: (view: any) => void;
}

const StatCard: React.FC<{ label: string; value: string | number; colorClass: string }> = ({ label, value, colorClass }) => (
    <div className="bg-card border p-4 rounded-xl text-center shadow-sm hover:shadow-md transition-shadow">
        <p className="text-sm text-muted-foreground mb-1 font-medium">{label}</p>
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
    </div>
);

export const TestResults: React.FC<TestResultsProps> = ({ result, questions = [], onNavigate }) => {
    const [showAnalysis, setShowAnalysis] = useState(false);

    const percentage = Math.round((result.score / result.totalQuestions) * 100);
    const incorrectAnswers = result.totalQuestions - result.score;
    
    // Status Colors
    const scoreColor = percentage >= 80 ? 'text-green-600 dark:text-green-400' : percentage >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
    const ringColor = percentage >= 80 ? 'border-green-600 dark:border-green-400' : percentage >= 50 ? 'border-amber-600 dark:border-amber-400' : 'border-red-600 dark:border-red-400';

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* 1. Score Summary Card */}
            <Card className="text-center p-8 border-none shadow-2xl bg-gradient-to-br from-card to-muted/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />
                
                <h2 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Test Complete!</h2>
                <p className="text-lg text-muted-foreground mb-10">
                    Results for: <span className="font-semibold text-foreground">{result.testTitle}</span>
                </p>

                {/* Score Ring Visualization */}
                <div className="mb-12 flex justify-center items-center relative">
                     <div className={cn("relative w-56 h-56 flex items-center justify-center rounded-full border-[12px] bg-card shadow-inner transition-all duration-1000", ringColor)}>
                        <div className="text-center z-10">
                            <div className={cn("text-6xl font-black tracking-tighter", scoreColor)}>{percentage}%</div>
                            <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-2">Total Score</div>
                        </div>
                     </div>
                     <div className={cn("absolute w-48 h-48 rounded-full blur-3xl opacity-20", scoreColor.replace('text-', 'bg-'))}></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 max-w-3xl mx-auto">
                    <StatCard label="Total Questions" value={result.totalQuestions} colorClass="text-foreground" />
                    <StatCard label="Correct Answers" value={result.score} colorClass="text-green-600 dark:text-green-400" />
                    <StatCard label="Incorrect / Skipped" value={incorrectAnswers} colorClass="text-red-600 dark:text-red-400" />
                </div>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                     <Button 
                        variant={showAnalysis ? "secondary" : "default"} 
                        size="lg"
                        onClick={() => setShowAnalysis(!showAnalysis)}
                        className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all font-semibold"
                        disabled={!questions || questions.length === 0}
                     >
                        {showAnalysis ? <ChevronUp className="mr-2 h-5 w-5"/> : <BookOpen className="mr-2 h-5 w-5"/>}
                        {showAnalysis ? "Hide Answer Key" : "Review Answers"}
                     </Button>
                     
                     <Button 
                        variant="outline" 
                        size="lg"
                        onClick={() => onNavigate('dashboard')}
                        className="w-full sm:w-auto border-2 hover:bg-muted"
                     >
                        <ArrowLeft className="mr-2 h-5 w-5" /> Return to Dashboard
                    </Button>
                </div>
                
                {(!questions || questions.length === 0) && (
                    <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm rounded-lg inline-flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Detailed question data is unavailable for this historical attempt.
                    </div>
                )}
            </Card>

            {/* 2. Detailed Question Analysis Section */}
            {showAnalysis && questions && questions.length > 0 && (
                <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center justify-between px-2 pb-2 border-b border-border/50">
                        <h3 className="text-2xl font-bold flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-primary" /> Answer Key
                        </h3>
                        <Badge variant="outline" className="text-muted-foreground px-3 py-1">
                            {questions.length} Items Reviewed
                        </Badge>
                    </div>

                    {questions.map((q, index) => {
                        // FIX: Ensure safe access to answer array even if lengths differ slightly
                        const userAnswer = result.answers && result.answers[index];
                        const isSkipped = userAnswer === null || userAnswer === undefined;
                        const isCorrect = userAnswer === q.answer;
                        
                        let statusIcon = <AlertCircle className="w-6 h-6 text-amber-500" />;
                        let statusText = "Skipped";
                        let cardBorder = "border-amber-200 dark:border-amber-900/50";
                        let headerBg = "bg-amber-50/50 dark:bg-amber-950/20";
                        let statusBadge = "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";

                        if (!isSkipped) {
                            if (isCorrect) {
                                statusIcon = <CheckCircle2 className="w-6 h-6 text-green-500" />;
                                statusText = "Correct";
                                cardBorder = "border-green-200 dark:border-green-900/50";
                                headerBg = "bg-green-50/50 dark:bg-green-950/20";
                                statusBadge = "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
                            } else {
                                statusIcon = <XCircle className="w-6 h-6 text-red-500" />;
                                statusText = "Incorrect";
                                cardBorder = "border-red-200 dark:border-red-900/50";
                                headerBg = "bg-red-50/50 dark:bg-red-950/20";
                                statusBadge = "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
                            }
                        }

                        return (
                            <Card key={index} className={cn("overflow-hidden transition-all border shadow-sm hover:shadow-md", cardBorder)}>
                                <CardHeader className={cn("pb-4 border-b border-border/40", headerBg)}>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex gap-4">
                                            <div className="mt-1 flex-shrink-0">{statusIcon}</div>
                                            <div>
                                                <h4 className="font-semibold text-lg leading-snug">
                                                    <span className="text-muted-foreground mr-2 text-base font-normal opacity-70">Q{index + 1}.</span>
                                                    {q.question}
                                                </h4>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className={cn("whitespace-nowrap ml-auto font-bold px-3 h-6", statusBadge)}>
                                            {statusText}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6 pl-6 md:pl-16 pr-6">
                                    <div className="grid gap-3">
                                        {q.options.map((option, optIdx) => {
                                            const isSelected = userAnswer === option;
                                            const isTheCorrectAnswer = q.answer === option;
                                            
                                            // Base Style
                                            let optionClass = "border-transparent bg-muted/20 text-muted-foreground hover:bg-muted/40"; 
                                            let icon = null;
                                            let label = null;

                                            // Logic for highlighting
                                            if (isTheCorrectAnswer) {
                                                // Correct Answer (Always Green)
                                                optionClass = "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100 font-medium ring-1 ring-green-500/30";
                                                icon = <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />;
                                                
                                                if (isSelected) {
                                                    label = <span className="text-xs font-bold text-green-600 dark:text-green-400 ml-2 flex items-center gap-1"><MousePointer2 className="w-3 h-3"/> You Selected</span>;
                                                } else {
                                                    label = <span className="text-xs font-bold text-green-600 dark:text-green-400 ml-2">(Correct Answer)</span>;
                                                }

                                            } else if (isSelected) {
                                                // Wrong Selection (Red)
                                                optionClass = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 font-medium ring-1 ring-red-500/30";
                                                icon = <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
                                                label = <span className="text-xs font-bold text-red-600 dark:text-red-400 ml-2 flex items-center gap-1"><MousePointer2 className="w-3 h-3"/> You Selected</span>;
                                            }

                                            return (
                                                <div key={optIdx} className={cn(
                                                    "flex items-center justify-between p-3 rounded-lg border text-base transition-all",
                                                    optionClass
                                                )}>
                                                    <div className="flex items-center">
                                                        <span className="mr-3 opacity-50 text-sm font-mono border rounded px-1.5 py-0.5 border-current">{String.fromCharCode(65 + optIdx)}</span>
                                                        <span>{option}</span>
                                                        {label}
                                                    </div>
                                                    {icon}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Explanation Section */}
                                    {q.explanation && (
                                        <div className="mt-6 pt-4 border-t border-dashed border-border bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-4 -mx-2">
                                            <p className="text-sm font-bold flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-300">
                                                <HelpCircle className="w-4 h-4" /> Explanation:
                                            </p>
                                            <p className="text-sm text-muted-foreground leading-relaxed italic pl-6">
                                                {q.explanation}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};