import React from 'react';
import type { AppUser } from '../types';
import { Role } from '../types';

type View = 'auth' | 'idVerification' | 'generator' | 'results' | 'studentPortal' | 'studentLogin' | 'test' | 'facultyPortal' | 'testResults' | 'testHistory' | 'manualCreator' | 'notifications' | 'testAnalytics' | 'following' | 'profile';

interface HeaderProps {
  user: AppUser | null;
  activeView: View;
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

export const Header: React.FC<HeaderProps> = ({ user, activeView, onNavigate, onLogout }) => {
  if (activeView === 'test') {
    return null;
  }
  
  const isFacultyView = ['facultyPortal', 'generator', 'results', 'manualCreator', 'testAnalytics'].includes(activeView);
  const isStudentView = ['studentPortal', 'notifications', 'testHistory', 'following'].includes(activeView);
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-3 md:px-8 flex justify-between items-center">
        <div className="flex items-center space-x-3">
           {/* ** UPDATED: Using your App-logo.png ** */}
           <img src="/App-icon.png" alt="Quizly AI Logo" className="h-8 w-8" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Quizly AI
          </h1>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <nav className="hidden sm:flex items-center space-x-2 bg-gray-50 dark:bg-gray-900 p-1 rounded-lg">
              {user.role === Role.Faculty && (
                <>
                  <NavButton active={isFacultyView && activeView === 'facultyPortal'} onClick={() => onNavigate('facultyPortal')}>Dashboard</NavButton>
                  <NavButton active={['generator', 'results'].includes(activeView)} onClick={() => onNavigate('generator')}>AI Generator</NavButton>
                  <NavButton active={activeView === 'manualCreator'} onClick={() => onNavigate('manualCreator')}>Manual Creator</NavButton>
                </>
              )}
               {user.role === Role.Student && (
                <>
                  <NavButton active={isStudentView} onClick={() => onNavigate('studentPortal')}>Student Portal</NavButton>
                </>
              )}
            </nav>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:block">{user.email}</span>
              <button 
                onClick={() => onNavigate('profile')} 
                className="w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full font-bold text-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                title="View Profile"
              >
                {user.name.charAt(0).toUpperCase()}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};