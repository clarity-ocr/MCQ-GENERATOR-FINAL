import React from 'react';
import type { AppUser } from '../types';
import { Role } from '../types';

type View = 'auth' | 'idVerification' | 'generator' | 'results' | 'studentPortal' | 'studentLogin' | 'test' | 'facultyPortal' | 'testResults' | 'testHistory' | 'manualCreator' | 'notifications';

interface HeaderProps {
  user: AppUser | null;
  activeView: View;
  notificationCount: number;
  onNavigate: (view: View) => void;
  onLogout: () => void;
}

const NavButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => {
  const baseClasses = "px-4 py-2 rounded-md text-sm font-medium transition-colors relative";
  const activeClasses = "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200";
  const inactiveClasses = "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700";
  
  return (
    <button onClick={onClick} className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}>
      {children}
    </button>
  );
};


export const Header: React.FC<HeaderProps> = ({ user, activeView, onNavigate, onLogout, notificationCount }) => {
  const isFacultyView = ['facultyPortal', 'generator', 'results', 'manualCreator'].includes(activeView);
  const isStudentView = ['studentPortal', 'studentLogin', 'test', 'testResults', 'testHistory', 'notifications'].includes(activeView);
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-3 md:px-8 flex justify-between items-center">
        <div className="flex items-center space-x-3">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 9h-2v2H9v-2H7v-2h2V9h2v2h2v2zm5 9H6V4h7v5h5v11z"/>
          </svg>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            AI MCQ Platform
          </h1>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <nav className="hidden sm:flex items-center space-x-2 bg-gray-50 dark:bg-gray-900 p-1 rounded-lg">
              {user.role === Role.Faculty && (
                <>
                  <NavButton active={isFacultyView && ['facultyPortal'].includes(activeView)} onClick={() => onNavigate('facultyPortal')}>Dashboard</NavButton>
                  <NavButton active={['generator', 'results'].includes(activeView)} onClick={() => onNavigate('generator')}>AI Generator</NavButton>
                  <NavButton active={activeView === 'manualCreator'} onClick={() => onNavigate('manualCreator')}>Manual Creator</NavButton>
                </>
              )}
               {user.role === Role.Student && (
                <>
                  <NavButton active={isStudentView} onClick={() => onNavigate('studentPortal')}>Student Portal</NavButton>
                  <NavButton active={activeView === 'notifications'} onClick={() => onNavigate('notifications')}>
                    Notifications
                    {notificationCount > 0 && (
                      <span className="absolute top-0 right-0 -mt-1 -mr-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{notificationCount}</span>
                    )}
                  </NavButton>
                </>
              )}
            </nav>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:block">{user.email}</span>
              <button onClick={onLogout} className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50 rounded-md">Logout</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};