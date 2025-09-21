// in src/components/StudentPortal.tsx

import React, { useState } from 'react';

// --- Sub-component: FollowFaculty (Unchanged) ---
interface FollowFacultyProps {
  onSendFollowRequest: (facultyId: string) => void;
}
const FollowFaculty: React.FC<FollowFacultyProps> = ({ onSendFollowRequest }) => {
  const [facultyId, setFacultyId] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (facultyId.trim()) {
      onSendFollowRequest(facultyId.trim());
      setFacultyId('');
    }
  };
  return (
    <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Follow a Faculty Member</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Enter the unique ID of a faculty member to receive notifications when they publish new tests.
      </p>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={facultyId}
          onChange={(e) => setFacultyId(e.target.value)}
          placeholder="e.g., faculty-101"
          className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
        />
        <button type="submit" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
          Send Request
        </button>
      </form>
    </div>
  );
};

// --- Main Component ---
interface StudentPortalProps {
  onNavigateToHistory: () => void;
  onNavigateToNotifications: () => void;
  onNavigateToFollowing: () => void; // <<< NEW PROP
  onSendFollowRequest: (facultyId: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ onNavigateToHistory, onNavigateToNotifications, onNavigateToFollowing, onSendFollowRequest }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Student Dashboard</h2>
        <div className="flex items-center space-x-2">
          {/* ** NEW BUTTON ** */}
          <button
            onClick={onNavigateToFollowing}
            className="inline-flex items-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            View Following
          </button>
          <button
            onClick={onNavigateToNotifications}
            className="inline-flex items-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            View Notifications
          </button>
          <button
            onClick={onNavigateToHistory}
            className="inline-flex items-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            View Test History
          </button>
        </div>
      </div>
      <div className="space-y-6">
        <FollowFaculty onSendFollowRequest={onSendFollowRequest} />
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <h3 className="text-lg font-medium">Welcome!</h3>
            <p>New tests from faculty you follow will appear in your notifications.</p>
        </div>
      </div>
    </div>
  );
};