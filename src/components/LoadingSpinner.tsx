import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils'; // Assuming you have this, otherwise standard class strings work

const LOADING_MESSAGES = [
  "Analyzing your topic...",
  "Consulting the AI knowledge base...",
  "Drafting relevant questions...",
  "Structuring options and answers...",
  "Polishing final output..."
];

export const LoadingSpinner: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Cycle through messages to keep user engaged
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000); // Change text every 2 seconds

    // Fake progress bar logic for psychological comfort
    const progressInterval = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) return 100;
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 95); // Cap at 95% until actually done
      });
    }, 500);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] w-full p-8 animate-in fade-in duration-700">
      
      {/* --- AI CORE ANIMATION --- */}
      <div className="relative flex items-center justify-center mb-8">
        {/* Outer Glow / Ripple */}
        <div className="absolute h-24 w-24 rounded-full bg-blue-500/20 animate-ping opacity-75"></div>
        <div className="absolute h-16 w-16 rounded-full bg-purple-500/30 animate-pulse delay-75"></div>
        
        {/* Inner Core (The "Brain") */}
        <div className="relative h-12 w-12 rounded-full bg-gradient-to-tr from-blue-600 via-purple-600 to-pink-500 shadow-lg shadow-purple-500/50 z-10 flex items-center justify-center">
           {/* Inner Sparkle */}
           <div className="h-6 w-6 rounded-full bg-white/20 blur-sm animate-pulse"></div>
        </div>
      </div>

      {/* --- TEXT CONTENT --- */}
      <div className="space-y-3 text-center max-w-xs">
        <h3 
          key={messageIndex} // Key forces re-render animation on text change
          className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 animate-in slide-in-from-bottom-2 fade-in duration-500"
        >
          {LOADING_MESSAGES[messageIndex]}
        </h3>
        
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Crafting a unique test just for you.
        </p>
      </div>

      {/* --- PROGRESS BAR --- */}
      <div className="w-64 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-8 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
      
    </div>
  );
};