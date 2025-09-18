import React, { useState, useMemo } from 'react';
import type { Test, Student } from '../types';

interface StudentLoginProps {
  test: Test;
  onLogin: (student: Student) => void;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({ test, onLogin }) => {
  const initialFormState = useMemo(() => {
    const customData = test.customFormFields.reduce((acc, field) => {
        acc[field.label] = '';
        return acc;
    }, {} as {[key: string]: string});
    return {
        registrationNumber: '',
        name: '',
        ...customData
    };
  }, [test.customFormFields]);

  const [formData, setFormData] = useState(initialFormState);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { registrationNumber, name, ...customData } = formData;
    if (name.trim() && registrationNumber.trim()) {
      onLogin({ 
          name, 
          registrationNumber,
          customData: test.testMode === 'custom' ? customData : undefined,
      });
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">Begin Test</h2>
      <p className="text-center text-lg font-semibold text-blue-600 dark:text-blue-400 mb-6">{test.title}</p>
      
      <div className="text-center bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg mb-6">
        <p className="text-sm text-gray-700 dark:text-gray-300">Please enter your details to start the test. The timer will begin immediately after you click "Begin Test".</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="regNum" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Registration Number</label>
          <input 
            type="text" 
            id="regNum"
            name="registrationNumber"
            value={formData.registrationNumber} 
            onChange={handleChange}
            required 
            className="mt-1 w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm"
            placeholder="e.g., 20BCS001"
          />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
          <input 
            type="text" 
            id="name"
            name="name"
            value={formData.name} 
            onChange={handleChange}
            required 
            className="mt-1 w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm"
            placeholder="e.g., Jane Doe"
          />
        </div>

        {test.testMode === 'custom' && test.customFormFields.map(field => (
             <div key={field.label}>
                <label htmlFor={field.label} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
                <input 
                    type="text" 
                    id={field.label}
                    name={field.label}
                    value={formData[field.label] || ''} 
                    onChange={handleChange}
                    required 
                    className="mt-1 w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm"
                />
            </div>
        ))}

        <div>
          <button type="submit" className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            Begin Test
          </button>
        </div>
      </form>
    </div>
  );
};