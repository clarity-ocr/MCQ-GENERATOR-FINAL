// src/components/TestHistory.tsx

import React from 'react';
import type { TestAttempt } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Calendar, FileText, Eye } from 'lucide-react';

interface TestHistoryProps {
  history: TestAttempt[];
  onNavigateBack: () => void;
  onViewResult: (attempt: TestAttempt) => void; // New Prop
}

export const TestHistory: React.FC<TestHistoryProps> = ({ history, onNavigateBack, onViewResult }) => {
  return (
    <div className="space-y-6 p-4 md:p-0 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Test History</h2>
            <p className="text-muted-foreground">Review your past performance.</p>
        </div>
        <Button variant="outline" onClick={onNavigateBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Test Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    You have not attempted any tests yet.
                  </td>
                </tr>
              ) : (
                history.map(attempt => {
                    const pct = (attempt.score / attempt.totalQuestions) * 100;
                    return (
                        <tr key={attempt.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{attempt.testTitle}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {new Date(attempt.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                            {attempt.score} / {attempt.totalQuestions}
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${pct >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {pct.toFixed(0)}%
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <Button size="sm" variant="ghost" onClick={() => onViewResult(attempt)}>
                                <Eye className="w-4 h-4 mr-2" /> Review
                            </Button>
                        </td>
                        </tr>
                    )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};