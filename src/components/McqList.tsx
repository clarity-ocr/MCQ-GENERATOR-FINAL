
import React from 'react';
import type { MCQ } from '../types';
import { McqDisplay } from './McqDisplay';

interface McqListProps {
  mcqs: MCQ[];
}

export const McqList: React.FC<McqListProps> = ({ mcqs }) => {
  if (mcqs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Ready to Generate</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your generated questions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {mcqs.map((mcq, index) => (
        <McqDisplay key={index} mcq={mcq} index={index} />
      ))}
    </div>
  );
};
