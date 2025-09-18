import React, { useState } from 'react';
import type { Test, Student } from '../types';

interface StudentLoginProps {
  test: Test;
  onLogin: (student: Student) => void;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({ test, onLogin }) => {
  const [name, setName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [section, setSection] = useState('');
  const [customData, setCustomData] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);

  const handleCustomDataChange = (label: string, value: string) => {
    setCustomData(prev => ({ ...prev, [label]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (test.studentFieldsMode === 'default') {
      if (!name.trim() || !registrationNumber.trim() || !branch.trim() || !section.trim()) {
        setError("All default fields (Name, Reg No, Branch, Section) are required.");
        return;
      }
    } else { // Custom mode validation
      for (const field of test.customStudentFields) {
        if (!customData[field.label]?.trim()) {
          setError(`Field "${field.label}" is required.`);
          return;
        }
      }
    }
    
    onLogin({ name, registrationNumber, branch, section, customData });
  };

  const renderFields = () => {
    if (test.studentFieldsMode === 'default') {
      return (
        <>
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Registration Number</label>
            <input type="text" value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} required className="mt-1 w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Branch</label>
            <input type="text" value={branch} onChange={e => setBranch(e.target.value)} required className="mt-1 w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Section</label>
            <input type="text" value={section} onChange={e => setSection(e.target.value)} required className="mt-1 w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
          </div>
        </>
      );
    }

    if (test.studentFieldsMode === 'custom') {
      return test.customStudentFields.map(field => (
        <div key={field.label}>
          <label className="block text-sm font-medium">{field.label}</label>
          <input type="text" value={customData[field.label] || ''} onChange={e => handleCustomDataChange(field.label, e.target.value)} required className="mt-1 w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
        </div>
      ));
    }
    return null;
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-2">Test Login</h2>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Enter your details to begin the test: <strong className="text-blue-600 dark:text-blue-400">{test.title}</strong></p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {renderFields()}
        {error && <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900/50 p-2 rounded-md">{error}</p>}
        <button type="submit" className="w-full py-3 mt-4 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold">
          Begin Test
        </button>
      </form>
    </div>
  );
};