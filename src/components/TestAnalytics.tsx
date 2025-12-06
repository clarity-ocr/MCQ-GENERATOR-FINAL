import React, { useMemo } from 'react';
import type { Test, TestAttempt } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  ArrowLeft, 
  Download, 
  Users, 
  Trophy, 
  Percent, 
  AlertTriangle 
} from 'lucide-react';

interface TestAnalyticsProps {
  test: Test;
  attempts: TestAttempt[];
  onBack: () => void;
}

export const TestAnalytics: React.FC<TestAnalyticsProps> = ({ test, attempts, onBack }) => {

  // --- 1. STATISTICS CALCULATION ---
  const stats = useMemo(() => {
    if (attempts.length === 0) return { avg: 0, high: 0, pass: 0 };
    
    const totalScore = attempts.reduce((acc, curr) => acc + curr.score, 0);
    const maxScore = Math.max(...attempts.map(a => a.score));
    // Assuming 40% is pass for analytics visualization
    const passCount = attempts.filter(a => (a.score / a.totalQuestions) >= 0.4).length;

    return {
      avg: (totalScore / attempts.length).toFixed(1),
      high: maxScore,
      pass: passCount
    };
  }, [attempts]);

  // --- 2. DYNAMIC HEADERS & CSV GENERATION ---
  const isCustomMode = test.studentFieldsMode === 'custom';
  
  // Define extra columns based on mode
  const extraHeaders = isCustomMode 
    ? test.customStudentFields.map(f => f.label) 
    : ['Branch', 'Section'];

  const handleExportCSV = () => {
    if (attempts.length === 0) {
      alert("No data to export.");
      return;
    }

    // 1. Headers
    const headers = [
      "Registration ID", 
      "Name", 
      ...extraHeaders, 
      "Score", 
      "Total", 
      "Percentage", 
      "Violations", 
      "Date"
    ];

    // 2. Rows
    const rows = attempts.map(attempt => {
      const student = attempt.student;
      
      // Extract dynamic values
      const extraValues = isCustomMode
        ? test.customStudentFields.map(f => student.customData?.[f.label] || '-')
        : [student.branch || '-', student.section || '-'];

      const percentage = ((attempt.score / attempt.totalQuestions) * 100).toFixed(2) + '%';
      
      const rowData = [
        student.registrationNumber, 
        student.name, 
        ...extraValues,
        attempt.score, 
        attempt.totalQuestions,
        percentage,
        attempt.violations,
        new Date(attempt.timestamp).toLocaleString()
      ];

      // Escape quotes for CSV format
      return rowData.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${test.title.replace(/\s+/g, '_')}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Test Analytics</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <span className="font-semibold text-foreground">{test.title}</span> 
            • {attempts.length} Attempts Recorded
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={onBack} className="flex-1 md:flex-none">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button onClick={handleExportCSV} className="flex-1 md:flex-none shadow-sm">
                <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avg} <span className="text-sm text-muted-foreground font-normal">/ {test.questions.length}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
            <Trophy className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.high}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attempts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* DATA TABLE */}
      <Card className="overflow-hidden border shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider">Reg ID</th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                
                {/* Dynamic Columns */}
                {extraHeaders.map((header, idx) => (
                  <th key={idx} className="px-6 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                    {header}
                  </th>
                ))}

                <th className="px-6 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider">Integrity</th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {attempts.length > 0 ? (
                attempts.map(attempt => {
                  const percentage = (attempt.score / attempt.totalQuestions) * 100;
                  const hasViolations = attempt.violations > 0;

                  return (
                    <tr key={attempt.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium">{attempt.student.registrationNumber}</td>
                      <td className="px-6 py-4">{attempt.student.name}</td>
                      
                      {/* Dynamic Cells */}
                      {isCustomMode ? (
                        test.customStudentFields.map((field, idx) => (
                          <td key={idx} className="px-6 py-4 text-muted-foreground">
                            {attempt.student.customData?.[field.label] || '-'}
                          </td>
                        ))
                      ) : (
                        <>
                          <td className="px-6 py-4 text-muted-foreground">{attempt.student.branch || '-'}</td>
                          <td className="px-6 py-4 text-muted-foreground">{attempt.student.section || '-'}</td>
                        </>
                      )}

                      <td className="px-6 py-4">
                        <span className={`font-bold ${percentage >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                          {attempt.score}
                        </span>
                        <span className="text-muted-foreground"> / {attempt.totalQuestions}</span>
                      </td>

                      <td className="px-6 py-4">
                        {hasViolations ? (
                          <div className="flex items-center gap-1 text-red-600 font-bold bg-red-50 w-fit px-2 py-1 rounded-full text-xs">
                            <AlertTriangle className="w-3 h-3" /> {attempt.violations}
                          </div>
                        ) : (
                          <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">Clean</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(attempt.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  {/* Spans across all static columns + dynamic columns */}
                  <td colSpan={6 + extraHeaders.length} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-10 h-10 opacity-20" />
                      <p>No attempts recorded yet.</p>
                    </div>
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