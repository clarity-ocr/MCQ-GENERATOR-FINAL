// src/components/Header.tsx

import React, { useState } from 'react';
import type { AppUser } from '../types';
import { Role } from '../types';

// FIX: Add 'followers' to the View type to match the definition in App.tsx
type View = 'auth' | 'idVerification' | 'generator' | 'results' | 'studentPortal' | 'studentLogin' | 'test' | 'facultyPortal' | 'testResults' | 'testHistory' | 'manualCreator' | 'notifications' | 'testAnalytics' | 'following' | 'profile' | 'followers';

interface HeaderProps {
  user: AppUser | null;
  activeView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
}

const NavButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; isMobile?: boolean }> = ({ active, onClick, children, isMobile = false }) => {
  const baseClasses = "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50";
  const activeClasses = "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200";
  const inactiveClasses = "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700";
  const mobileClasses = isMobile ? "block w-full text-left" : "";

  return (
    <button onClick={onClick} className={`${baseClasses} ${active ? activeClasses : inactiveClasses} ${mobileClasses}`}>
      {children}
    </button>
  );
};

export const Header: React.FC<HeaderProps> = ({ user, activeView, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (activeView === 'test') {
    return null;
  }
  
  const isFacultyView = ['facultyPortal', 'generator', 'results', 'manualCreator', 'testAnalytics', 'followers'].includes(activeView);
  const isStudentView = ['studentPortal', 'notifications', 'testHistory', 'following'].includes(activeView);

  const handleMobileNavClick = (view: View) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 md:px-8">
        <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
               <img src="/App-logo.png" alt="Quizly AI Logo" className="h-8 w-8" />
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
                  <div className="hidden md:flex flex-col items-end">
                      <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{user.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</span>
                  </div>
                  <button 
                    onClick={() => onNavigate('profile')} 
                    className="w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full font-bold text-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    title="View Profile"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </button>
                </div>
                <div className="sm:hidden">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500" aria-label="Open main menu">
                        <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                            {isMobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
              </div>
            )}
        </div>
        {isMobileMenuOpen && user && (
            <div className="sm:hidden mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <nav className="flex flex-col space-y-2">
                  {user.role === Role.Faculty && (
                    <>
                      <NavButton isMobile active={isFacultyView && activeView === 'facultyPortal'} onClick={() => handleMobileNavClick('facultyPortal')}>Dashboard</NavButton>
                      <NavButton isMobile active={['generator', 'results'].includes(activeView)} onClick={() => handleMobileNavClick('generator')}>AI Generator</NavButton>
                      <NavButton isMobile active={activeView === 'manualCreator'} onClick={() => handleMobileNavClick('manualCreator')}>Manual Creator</NavButton>
                    </>
                  )}
                  {user.role === Role.Student && (
                    <>
                      <NavButton isMobile active={isStudentView} onClick={() => handleMobileNavClick('studentPortal')}>Student Portal</NavButton>
                    </>
                  )}
                  <NavButton isMobile active={activeView === 'profile'} onClick={() => handleMobileNavClick('profile')}>Profile & Settings</NavButton>
                </nav>
            </div>
        )}
      </div>
    </header>
  );
};