import React from 'react';
import type { TestAttempt } from '../types';

interface TestResultsProps {
  result: TestAttempt;
  onNavigate: (view: 'studentPortal' | 'testHistory') => void;
}

const StatCard: React.FC<{ label: string; value: string | number; colorClass: string }> = ({ label, value, colorClass }) => (
    <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
);


export const TestResults: React.FC<TestResultsProps> = ({ result, onNavigate }) => {
    const percentage = Math.round((result.score / result.totalQuestions) * 100);
    const incorrectAnswers = result.totalQuestions - result.score;

    return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Test Complete!</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">Here are your results for the test: <span className="font-semibold text-blue-600 dark:text-blue-400">{result.testTitle}</span></p>

            <div className="my-8">
                 <div className="text-6xl font-bold text-blue-600 dark:text-blue-400">{percentage}%</div>
                 <p className="text-xl font-semibold text-gray-700 dark:text-gray-200 mt-2">You scored {result.score} out of {result.totalQuestions}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard label="Total Questions" value={result.totalQuestions} colorClass="text-gray-800 dark:text-gray-200" />
                <StatCard label="Correct Answers" value={result.score} colorClass="text-green-600 dark:text-green-400" />
                <StatCard label="Incorrect Answers" value={incorrectAnswers} colorClass="text-red-600 dark:text-red-400" />
            </div>

            <div className="flex justify-center items-center space-x-4">
                 <button onClick={() => onNavigate('studentPortal')} className="py-2 px-6 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    Back to Portal
                </button>
                 <button onClick={() => onNavigate('testHistory')} className="py-2 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    View Full History
                </button>
            </div>
        </div>
    );
};
