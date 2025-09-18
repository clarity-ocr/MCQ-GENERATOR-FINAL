import React, { useState } from 'react';
import type { MCQ } from '../types';

interface ManualMcqCreatorProps {
  onSaveSet: (mcqs: MCQ[]) => void;
  onExportPDF: (mcqs: MCQ[]) => void;
  onExportWord: (mcqs: MCQ[]) => void;
}

const emptyFormState = {
  question: '',
  options: ['', '', '', ''],
  explanation: '',
  correctOptionIndex: null as number | null,
};

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {children}
    </label>
);

export const ManualMcqCreator: React.FC<ManualMcqCreatorProps> = ({ onSaveSet, onExportPDF, onExportWord }) => {
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [formState, setFormState] = useState(emptyFormState);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setError(null);
    if (name.startsWith('option-')) {
      const index = parseInt(name.split('-')[1], 10);
      const newOptions = [...formState.options];
      newOptions[index] = value;
      setFormState(prev => ({ ...prev, options: newOptions }));
    } else {
      setFormState(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddQuestion = () => {
    const { question, options, explanation, correctOptionIndex } = formState;
    if (!question.trim() || options.some(opt => !opt.trim()) || !explanation.trim() || correctOptionIndex === null) {
      setError('Please fill out all fields and select a correct answer.');
      return;
    }
    if (new Set(options).size !== options.length) {
        setError('All options must be unique.');
        return;
    }
    
    const newMcq: MCQ = {
      question,
      options,
      answer: options[correctOptionIndex],
      explanation,
    };

    setMcqs(prev => [...prev, newMcq]);
    setFormState(emptyFormState);
    setError(null);
  };

  const handleDeleteQuestion = (indexToDelete: number) => {
    setMcqs(prev => prev.filter((_, index) => index !== indexToDelete));
  };
  
  const isAddDisabled = !formState.question.trim() || formState.options.some(opt => !opt.trim()) || formState.correctOptionIndex === null;
  const isActionDisabled = mcqs.length === 0;

  return (
    <div>
        <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Manual Question Creator</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Column */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg space-y-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Create a New Question</h3>
                <div>
                    <Label htmlFor="question">Question</Label>
                    <textarea id="question" name="question" value={formState.question} onChange={handleInputChange} rows={3} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"></textarea>
                </div>
                 <div>
                    <Label htmlFor="options">Options (select the correct one)</Label>
                    <div className="space-y-3">
                        {formState.options.map((option, index) => (
                             <div key={index} className="flex items-center">
                                <input type="radio" name="correctOption" id={`radio-${index}`} checked={formState.correctOptionIndex === index} onChange={() => setFormState(prev => ({ ...prev, correctOptionIndex: index }))} className="h-4 w-4 text-blue-600"/>
                                <input type="text" name={`option-${index}`} value={option} onChange={handleInputChange} className="ml-3 flex-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" placeholder={`Option ${index + 1}`} />
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <Label htmlFor="explanation">Explanation</Label>
                    <textarea id="explanation" name="explanation" value={formState.explanation} onChange={handleInputChange} rows={2} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"></textarea>
                </div>
                 {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                <button onClick={handleAddQuestion} disabled={isAddDisabled} className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">Add Question to Set</button>
            </div>
            {/* Preview Column */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Created Questions ({mcqs.length})</h3>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => onExportPDF(mcqs)} disabled={isActionDisabled} className="text-xs p-2 disabled:opacity-50">PDF</button>
                        <button onClick={() => onExportWord(mcqs)} disabled={isActionDisabled} className="text-xs p-2 disabled:opacity-50">Word</button>
                        <button onClick={() => onSaveSet(mcqs)} disabled={isActionDisabled} className="py-2 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">Save Set</button>
                    </div>
                </div>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {mcqs.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">Your questions will appear here as you add them.</p>
                    ) : (
                        mcqs.map((mcq, index) => (
                            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 relative">
                                <p className="font-semibold text-gray-800 dark:text-gray-200 pr-8">{index + 1}. {mcq.question}</p>
                                <button onClick={() => handleDeleteQuestion(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};