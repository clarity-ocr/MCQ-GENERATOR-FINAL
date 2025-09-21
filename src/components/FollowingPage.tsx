// in src/components/FollowingPage.tsx

import React from 'react';
import type { AppUser } from '../types';

interface FollowingPageProps {
  followingList: AppUser[];
  onUnfollow: (facultyId: string) => void;
  onBack: () => void;
}

export const FollowingPage: React.FC<FollowingPageProps> = ({ followingList, onUnfollow, onBack }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Following</h2>
        <button onClick={onBack} className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
          &larr; Back to Dashboard
        </button>
      </div>
      <div className="space-y-4">
        {followingList.length > 0 ? (
          followingList.map(faculty => (
            <div key={faculty.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{faculty.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{faculty.email}</p>
              </div>
              <button
                onClick={() => onUnfollow(faculty.id)}
                className="py-1 px-3 border border-red-500 rounded-md text-sm font-medium text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              >
                Unfollow
              </button>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <h3 className="text-lg font-medium">You are not following any faculty members.</h3>
            <p>Use the "Follow a Faculty Member" tool on your dashboard to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};