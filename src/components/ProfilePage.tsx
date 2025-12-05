// in src/components/ProfilePage.tsx
import React from 'react';
import type { AppUser } from '../types';

interface ProfilePageProps {
  user: AppUser;
  onLogout: () => void;
  onBack: () => void;
}

const ProfileOption: React.FC<{ title: string; description: string; buttonText: string; onClick: () => void; }> = ({ title, description, buttonText, onClick }) => (
  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg flex justify-between items-center">
    <div>
      <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
    <button
      onClick={onClick}
      className="py-1 px-3 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
    >
      {buttonText}
    </button>
  </div>
);

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, onBack }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Profile & Settings</h2>
        <button onClick={onBack} className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
          &larr; Back to Dashboard
        </button>
      </div>
      
      <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <h3 className="text-xl font-bold">{user.name}</h3>
        <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
        <span className="mt-2 inline-block px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 text-xs font-semibold rounded-full capitalize">{user.role}</span>
      </div>

      <div className="space-y-4">
        <ProfileOption
          title="Change Password"
          description="Update your password for better security."
          buttonText="Change"
          onClick={() => alert('Change Password functionality not yet implemented.')}
        />
        <ProfileOption
          title="Theme"
          description="Switch between light and dark mode."
          buttonText="Toggle"
          onClick={() => alert('Theme toggle functionality not yet implemented.')}
        />
         <ProfileOption
          title="Export My Data"
          description="Download an archive of all your data."
          buttonText="Export"
          onClick={() => alert('Export Data functionality not yet implemented.')}
        />
        <div className="!mt-8">
            <ProfileOption
              title="Logout"
              description="Sign out of your Quizapo AI account."
              buttonText="Logout"
              onClick={onLogout}
            />
        </div>
      </div>
    </div>
  );
};