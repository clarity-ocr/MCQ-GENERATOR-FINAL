import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Test, Student } from '../types';

interface TestPageProps {
  test: Test;
  student: Student;
  onFinish: (answers: (string | null)[], violations: number) => void;
}

const VIOLATION_LIMIT = 3;

export const TestPage: React.FC<TestPageProps> = ({ test, student, onFinish }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(() => Array(test.questions.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(test.durationMinutes * 60);
  const [violations, setViolations] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(document.fullscreenElement != null);
  
  // Use a ref to hold a stable reference to the onFinish function
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  // Use a ref to get the latest state inside callbacks that can't re-render
  const stateRef = useRef({ violations, answers });
  useEffect(() => {
    stateRef.current = { violations, answers };
  }, [violations, answers]);

  const currentQuestion = test.questions[currentQuestionIndex];
  
  // A stable function to end the test
  const endTest = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    // Use the ref to ensure the latest onFinish function is called
    onFinishRef.current(stateRef.current.answers, stateRef.current.violations);
  }, []);

  const handleViolation = useCallback(() => {
    // This function will now be stable and won't cause re-renders of useEffect
    setViolations(currentViolations => {
        const newViolationCount = currentViolations + 1;
        
        if (newViolationCount >= VIOLATION_LIMIT) {
            // Use requestAnimationFrame to prevent race conditions with alerts
            requestAnimationFrame(() => {
                alert(`Violation limit of ${VIOLATION_LIMIT} reached. Your test will be submitted as is.`);
                endTest();
            });
        } else {
            setAnswers(Array(test.questions.length).fill(null));
            setCurrentQuestionIndex(0);
            alert(`Violation ${newViolationCount}/${VIOLATION_LIMIT} detected!\n\nLeaving the test is not allowed. Your answers have been reset.`);
        }
        return newViolationCount;
    });
  }, [test.questions.length, endTest]);

  useEffect(() => {
    const enterFullScreen = async () => {
        try {
            await document.documentElement.requestFullscreen();
        } catch (error) {
            // This alert is important for browsers that block automatic fullscreen
            alert("Please enable fullscreen mode to start the test.");
        }
    };
    enterFullScreen();

    const handleFullScreenChange = () => {
      const isCurrentlyFullScreen = document.fullscreenElement != null;
      if (!isCurrentlyFullScreen && stateRef.current.violations < VIOLATION_LIMIT) {
        handleViolation();
      }
      setIsFullScreen(isCurrentlyFullScreen);
    };
    
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    // Use visibilitychange as a fallback for detecting tab switches
    document.addEventListener('visibilitychange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('visibilitychange', handleFullScreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
  }, [handleViolation]);

  useEffect(() => {
    if (timeLeft <= 0) {
      alert("Time's up! Submitting your test.");
      endTest();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, endTest]);

  const handleAnswerSelect = (option: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = option;
    setAnswers(newAnswers);
  };

  const goToNext = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  if (!isFullScreen && violations < VIOLATION_LIMIT) {
      return (
          <div className="fixed inset-0 bg-gray-900 text-white flex flex-col items-center justify-center z-50">
              <h2 className="text-3xl font-bold mb-4">Entering Secure Exam Mode</h2>
              <p className="text-lg mb-8">This test must be taken in fullscreen.</p>
              <button 
                onClick={() => document.documentElement.requestFullscreen()}
                className="py-3 px-8 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold"
              >
                Enter Fullscreen
              </button>
          </div>
      )
  }

  return (
    <div className="fixed inset-0 bg-gray-800 text-white p-4 sm:p-6 md:p-8 flex flex-col z-50">
        <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-6 flex-shrink-0">
            <div>
                <h1 className="text-xl md:text-2xl font-bold">{test.title}</h1>
                <p className="text-sm text-gray-400">Student: {student.name}</p>
            </div>
            <div className="flex items-center space-x-4">
                <div className={`text-lg font-semibold px-3 py-1 rounded-md ${timeLeft < 60 ? 'text-red-200 bg-red-900/50' : 'text-gray-200'}`}>
                    {formattedTime}
                </div>
                 <div className="text-sm text-red-400 font-medium">
                    Violations: {violations} / {VIOLATION_LIMIT}
                </div>
            </div>
        </div>
        <div className="flex-grow overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <p className="font-semibold text-lg md:text-xl text-gray-200 mb-5">
                  <span className="text-gray-400 mr-2">Q{currentQuestionIndex + 1}.</span>{currentQuestion.question}
                </p>
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <label key={index} className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${answers[currentQuestionIndex] === option ? 'bg-blue-900/50 border-blue-500' : 'bg-gray-700/50 border-gray-600 hover:border-blue-500'}`}>
                      <input type="radio" name={`question-${currentQuestionIndex}`} value={option} checked={answers[currentQuestionIndex] === option} onChange={() => handleAnswerSelect(option)} className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500 bg-gray-700"/>
                      <span className="ml-4 text-md text-gray-200">{option}</span>
                    </label>
                  ))}
                </div>
            </div>
        </div>
        <div className="mt-8 pt-4 border-t border-gray-700 flex justify-between items-center flex-shrink-0">
             <button onClick={goToPrev} disabled={currentQuestionIndex === 0} className="py-2 px-6 border border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-200 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
            <div className="text-sm text-gray-400">Question {currentQuestionIndex + 1} of {test.questions.length}</div>
            {currentQuestionIndex === test.questions.length - 1 ? (
                 <button onClick={() => endTest()} className="py-2 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">Submit Test</button>
            ): (
                 <button onClick={goToNext} className="py-2 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Next</button>
            )}
        </div>
    </div>
  );
};