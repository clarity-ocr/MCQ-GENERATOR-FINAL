
import React from 'react';
import type { MCQ } from '../types';

interface McqDisplayProps {
  mcq: MCQ;
  index: number;
}

export const McqDisplay: React.FC<McqDisplayProps> = ({ mcq, index }) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 transition-shadow hover:shadow-md">
      <p className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-4">
        {index + 1}. {mcq.question}
      </p>
      <div className="space-y-2 mb-4">
        {mcq.options.map((option, i) => {
          const isCorrect = option === mcq.answer;
          const optionClasses = isCorrect
            ? 'bg-green-100 dark:bg-green-900/50 border-green-400 dark:border-green-600 text-green-800 dark:text-green-200'
            : 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600';
          
          return (
            <div key={i} className={`p-3 rounded-md border text-sm ${optionClasses}`}>
              <span className="font-mono mr-3">{String.fromCharCode(65 + i)}.</span>
              <span>{option}</span>
            </div>
          );
        })}
      </div>
      <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Explanation:</p>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{mcq.explanation}</p>
      </div>
    </div>
  );
};
