
import React from 'react';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full bg-red-50 dark:bg-red-900/30 p-4 rounded-lg border border-red-300 dark:border-red-600">
       <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 dark:text-red-400 mb-3" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <h3 className="text-lg font-medium text-red-800 dark:text-red-200">An Error Occurred</h3>
      <p className="mt-1 text-sm text-red-700 dark:text-red-300 max-w-md">
        {message}
      </p>
    </div>
  );
};
