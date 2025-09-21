// in src/components/FollowersPage.tsx
import React from 'react';
import type { AppUser } from '../types';

interface FollowersPageProps {
  followers: AppUser[];
  onBack: () => void;
}

export const FollowersPage: React.FC<FollowersPageProps> = ({ followers, onBack }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Your Followers</h2>
        <button onClick={onBack} className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
          &larr; Back to Dashboard
        </button>
      </div>
      <div className="space-y-4">
        {followers.length > 0 ? (
          followers.map(student => (
            <div key={student.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <p className="font-semibold text-gray-800 dark:text-gray-100">{student.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <h3 className="text-lg font-medium">You have no followers yet.</h3>
            <p>Share your unique Faculty ID with your students so they can follow you.</p>
          </div>
        )}
      </div>
    </div>
  );
};