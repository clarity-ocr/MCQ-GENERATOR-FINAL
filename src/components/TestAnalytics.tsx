// in src/components/TestAnalytics.tsx

import React from 'react';
import type { Test, TestAttempt } from '../types';

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
      
      // Handle commas in data by wrapping fields in double quotes
      return rowData.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${test.title.replace(/\s+/g, '_')}_attempts.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Test Analytics</h2>
          <p className="text-lg text-blue-600 dark:text-blue-400 font-semibold">{test.title}</p>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={handleExportCSV} className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                Export as CSV
            </button>
            <button onClick={onBack} className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                &larr; Back to Dashboard
            </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reg No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Branch</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Section</th>
              {test.customStudentFields.map(field => (
                <th key={field.label} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{field.label}</th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Score</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {attempts.length > 0 ? (
              attempts.map(attempt => (
                <tr key={attempt.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{attempt.student.registrationNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{attempt.student.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{attempt.student.branch}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{attempt.student.section}</td>
                  {test.customStudentFields.map(field => (
                    <td key={field.label} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{attempt.student.customData?.[field.label] || '-'}</td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{attempt.score} / {attempt.totalQuestions}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5 + test.customStudentFields.length} className="px-6 py-4 text-center text-gray-500">No students have attempted this test yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};