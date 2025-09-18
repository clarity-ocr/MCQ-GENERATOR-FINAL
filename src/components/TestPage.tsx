import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Test, Student } from '../types';

interface TestPageProps {
  test: Test;
  student: Student;
  onFinish: (answers: (string | null)[]) => void;
}

export const TestPage: React.FC<TestPageProps> = ({ test, student, onFinish }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(() => Array(test.questions.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(test.durationMinutes * 60);
  const [violations, setViolations] = useState(0);

  const currentQuestion = test.questions[currentQuestionIndex];
  
  const finishTest = useCallback(() => {
    onFinish(answers);
  }, [answers, onFinish]);


  const handleViolation = useCallback(() => {
    setViolations(prev => prev + 1);
    setAnswers(Array(test.questions.length).fill(null)); // Reset all answers
    alert('Violation detected! Leaving the test page, copying, or right-clicking is not allowed. Your answers have been reset.');
  }, [test.questions.length]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) handleViolation();
    };
    const preventDefault = (e: Event) => e.preventDefault();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.body.addEventListener('contextmenu', preventDefault);
    document.body.addEventListener('copy', preventDefault);
    document.body.addEventListener('paste', preventDefault);
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.body.removeEventListener('contextmenu', preventDefault);
      document.body.removeEventListener('copy', preventDefault);
      document.body.removeEventListener('paste', preventDefault);
      document.body.style.userSelect = 'auto';
    };
  }, [handleViolation]);

  useEffect(() => {
    if (timeLeft <= 0) {
      alert("Time's up! Submitting your test.");
      finishTest();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, finishTest]);

  const handleAnswerSelect = (option: string) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = option;
      return newAnswers;
    });
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


  return (
    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{test.title}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Question {currentQuestionIndex + 1} of {test.questions.length}</p>
                 <p className="text-sm text-gray-500 dark:text-gray-300">Student: {student.name}</p>
            </div>
            <div className="flex items-center space-x-4 mt-3 sm:mt-0">
                <div className={`text-lg font-semibold px-3 py-1 rounded-md ${timeLeft < 60 ? 'text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-900/50' : 'text-gray-800 dark:text-gray-200'}`}>
                    {formattedTime}
                </div>
                 <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                    Violations: {violations}
                </div>
            </div>
        </div>

        <div>
            <p className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-5">
              {currentQuestion.question}
            </p>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <label key={index} className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${answers[currentQuestionIndex] === option ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-500' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'}`}>
                  <input
                    type="radio"
                    name={`question-${currentQuestionIndex}`}
                    value={option}
                    checked={answers[currentQuestionIndex] === option}
                    onChange={() => handleAnswerSelect(option)}
                    className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-4 text-md text-gray-900 dark:text-gray-200">{option}</span>
                </label>
              ))}
            </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
             <button
              onClick={goToPrev}
              disabled={currentQuestionIndex === 0}
              className="py-2 px-6 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {currentQuestionIndex === test.questions.length - 1 ? (
                 <button
                  onClick={finishTest}
                  className="py-2 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 transition-colors"
                >
                  Submit Test
                </button>
            ): (
                 <button
                  onClick={goToNext}
                  className="py-2 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
                >
                  Next
                </button>
            )}
        </div>
    </div>
  );
};