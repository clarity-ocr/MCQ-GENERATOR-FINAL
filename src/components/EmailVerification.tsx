// in src/components/EmailVerification.tsx
import React from 'react';

interface EmailVerificationProps {
  email: string;
  onLoginNavigate: () => void;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({ email, onLoginNavigate }) => {
  return (
    <div className="max-w-md mx-auto mt-10 text-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Verify Your Email</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-4">
          A verification link has been sent to <strong className="text-blue-600 dark:text-blue-400">{email}</strong>. Please check your inbox (and spam folder) to complete your registration.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Once verified, you can log in.
        </p>
        <button 
          onClick={onLoginNavigate}
          className="w-full mt-6 py-3 px-4 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};