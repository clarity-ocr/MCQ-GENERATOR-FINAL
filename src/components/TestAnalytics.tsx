// src/components/TestAnalytics.tsx

import React, { useMemo } from 'react';
import type { Test, TestAttempt } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, Download, Users, Trophy, Percent, 
  AlertTriangle, MessageSquare, CheckCircle 
} from 'lucide-react';

interface TestAnalyticsProps {
  test: Test;
  attempts: TestAttempt[];
  onBack: () => void;
  onMessageStudent: (studentUsername: string) => void; // NEW PROP
}

// --- HELPER: ROBUST DATE PARSER ---
const formatDate = (dateInput: any): string => {
  if (!dateInput) return 'N/A';
  try {
    // Case 1: Firestore Timestamp (has seconds)
    if (typeof dateInput === 'object' && 'seconds' in dateInput) {
      return new Date(dateInput.seconds * 1000).toLocaleString();
    }
    // Case 2: String or Date object
    return new Date(dateInput).toLocaleString();
  } catch (e) {
    return 'Invalid Date';
  }
};

export const TestAnalytics: React.FC<TestAnalyticsProps> = ({ test, attempts, onBack, onMessageStudent }) => {

  const stats = useMemo(() => {
    if (!attempts || attempts.length === 0) return { avg: 0, high: 0, pass: 0 };
    const totalScore = attempts.reduce((acc, curr) => acc + curr.score, 0);
    const maxScore = Math.max(...attempts.map(a => a.score));
    const passCount = attempts.filter(a => (a.score / a.totalQuestions) >= 0.4).length;
    return { avg: (totalScore / attempts.length).toFixed(1), high: maxScore, pass: passCount };
  }, [attempts]);

  const isCustomMode = test.studentFieldsMode === 'custom';
  const extraHeaders = isCustomMode ? test.customStudentFields.map(f => f.label) : ['Branch', 'Section'];

  const handleExportCSV = () => {
    if (!attempts.length) { alert("No data."); return; }
    const headers = ["Reg ID", "Name", ...extraHeaders, "Score", "Total", "Date"];
    const rows = attempts.map(attempt => {
      const student = attempt.student;
      const extraValues = isCustomMode ? test.customStudentFields.map(f => student.customData?.[f.label] || '-') : [student.branch || '-', student.section || '-'];
      return [student.registrationNumber, student.name, ...extraValues, attempt.score, attempt.totalQuestions, formatDate(attempt.date)].map(f => `"${f}"`).join(',');
    });
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${test.title}_Analytics.csv`;
    link.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Test Analytics</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <span className="font-semibold text-foreground">{test.title}</span> 
            • {attempts.length} Attempts
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
            <Button onClick={handleExportCSV}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Average Score</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold flex items-baseline gap-2">{stats.avg} <span className="text-sm font-normal text-muted-foreground">/ {test.questions.length}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Highest Score</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600 flex items-baseline gap-2"><Trophy className="w-5 h-5" /> {stats.high}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Participants</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold flex items-baseline gap-2"><Users className="w-5 h-5 text-blue-500" /> {attempts.length}</div></CardContent></Card>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Reg ID</th>
                <th className="px-6 py-3 text-left font-semibold">Name</th>
                {extraHeaders.map((h, i) => <th key={i} className="px-6 py-3 text-left font-semibold">{h}</th>)}
                <th className="px-6 py-3 text-left font-semibold">Score</th>
                <th className="px-6 py-3 text-left font-semibold">Integrity</th>
                <th className="px-6 py-3 text-left font-semibold">Date</th>
                <th className="px-6 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {attempts.map(a => (
                <tr key={a.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-6 py-4 font-mono font-medium">{a.student.registrationNumber}</td>
                  <td className="px-6 py-4">{a.student.name}</td>
                  {isCustomMode ? test.customStudentFields.map((f, i) => <td key={i} className="px-6 py-4">{a.student.customData?.[f.label] || '-'}</td>) : <><td className="px-6 py-4">{a.student.branch}</td><td className="px-6 py-4">{a.student.section}</td></>}
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={a.score/a.totalQuestions >= 0.4 ? "border-green-200 text-green-700 bg-green-50" : "border-red-200 text-red-700 bg-red-50"}>
                        {a.score} / {a.totalQuestions}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {a.violations > 0 ? (
                      <div className="flex items-center gap-1 text-red-600 font-bold text-xs"><AlertTriangle className="w-3 h-3" /> {a.violations}</div>
                    ) : (
                      <div className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle className="w-3 h-3" /> Clean</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{formatDate(a.date)}</td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onMessageStudent(a.student.registrationNumber)} // Uses Reg ID as username
                        title="Send Message"
                    >
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};