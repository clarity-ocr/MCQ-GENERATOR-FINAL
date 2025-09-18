
import React from 'react';
import type { Notification, Test } from '../types';

interface NotificationsProps {
  notifications: Notification[];
  onStartTest: (test: Test) => void;
  onBack: () => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ notifications, onStartTest, onBack }) => {
  const sortedNotifications = [...notifications].sort((a, b) => b.test.id.localeCompare(a.test.id));

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Notifications</h2>
        <button onClick={onBack} className="inline-flex items-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
          &larr; Back to Dashboard
        </button>
      </div>

      <div className="space-y-4">
        {sortedNotifications.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            You have no new notifications. Follow faculty members to be notified of new tests.
          </p>
        ) : (
          sortedNotifications.map(notif => (
            <div key={notif.id} className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">New test from <span className="font-semibold">{notif.facultyName}</span></p>
                <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300">{notif.test.title}</h3>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span><strong className="font-medium text-gray-800 dark:text-gray-200">{notif.test.questions.length}</strong> Questions</span>
                  <span><strong className="font-medium text-gray-800 dark:text-gray-200">{notif.test.durationMinutes}</strong> Minutes</span>
                </div>
              </div>
              <button
                onClick={() => onStartTest(notif.test)}
                className="w-full md:w-auto flex-shrink-0 py-2 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Start Test
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
