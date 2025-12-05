// src/components/TestAnalytics.tsx

import React from 'react';
import type { Test, TestAttempt } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Download } from 'lucide-react';

interface TestAnalyticsProps {
  test: Test;
  attempts: TestAttempt[];
  onBack: () => void;
}

export const TestAnalytics: React.FC<TestAnalyticsProps> = ({ test, attempts, onBack }) => {

  const handleExportCSV = () => {
    if (attempts.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = [
      "Registration Number", "Name", "Branch", "Section",
      ...test.customStudentFields.map(f => f.label),
      "Score", "Percentage"
    ];

    const rows = attempts.map(attempt => {
      const student = attempt.student;
      const customData = test.customStudentFields.map(field => 
        student.customData?.[field.label] || ''
      );
      const score = `${attempt.score} / ${attempt.totalQuestions}`;
      const percentage = ((attempt.score / attempt.totalQuestions) * 100).toFixed(2) + '%';
      
      const rowData = [
        student.registrationNumber, student.name, student.branch, student.section,
        ...customData,
        score, percentage
      ];
      return rowData.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${test.title.replace(/\s+/g, '_')}_analytics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">{test.title}</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Reg No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Branch</th>
                {test.customStudentFields.map(field => (
                  <th key={field.label} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{field.label}</th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Score</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {attempts.length > 0 ? (
                attempts.map(attempt => (
                  <tr key={attempt.id} className="hover:bg-muted/20">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{attempt.student.registrationNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{attempt.student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{attempt.student.branch}</td>
                    {test.customStudentFields.map(field => (
                      <td key={field.label} className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{attempt.student.customData?.[field.label] || '-'}</td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">{attempt.score} / {attempt.totalQuestions}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5 + test.customStudentFields.length} className="px-6 py-12 text-center text-muted-foreground">
                    No attempts recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};