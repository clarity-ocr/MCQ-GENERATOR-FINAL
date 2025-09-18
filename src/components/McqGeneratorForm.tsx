import React, { useState, useCallback } from 'react';
import type { FormState } from '../types';
import { Difficulty, Taxonomy } from '../types';
import { DIFFICULTY_LEVELS, TAXONOMY_LEVELS } from '../constants';

interface McqGeneratorFormProps {
  onGenerate: (formData: Omit<FormState, 'aiProvider'>) => void;
  isLoading: boolean;
}

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {children}
    </label>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className={`w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${props.className || ''}`}>
        {props.children}
    </select>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
     <input {...props} className={`w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${props.className || ''}`} />
);

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const SUPPORTED_FILE_TYPES = ['text/plain', 'text/markdown', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp'];
const TEXT_FILE_TYPES = ['text/plain', 'text/markdown'];
const IMAGE_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];


export const McqGeneratorForm: React.FC<McqGeneratorFormProps> = ({ onGenerate, isLoading }) => {
  const [formState, setFormState] = useState({
    topic: 'React Hooks',
    difficulty: Difficulty.Medium,
    taxonomy: Taxonomy.Understanding,
    questions: 5,
    studyMaterial: '',
    imageData: null,
  });
  const [fileName, setFileName] = useState<string>('');
  const [formErrors, setFormErrors] = useState({ questions: '', file: '' });


  const handleFileChange = useCallback((file: File | null) => {
    if (!file) {
      setFileName('');
      setFormErrors(prev => ({ ...prev, file: '' }));
      setFormState(prev => ({ ...prev, studyMaterial: '', imageData: null }));
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFormErrors(prev => ({ ...prev, file: `File is too large. Max size is ${MAX_FILE_SIZE_MB}MB.` }));
      return;
    }

    if (!SUPPORTED_FILE_TYPES.includes(file.type) && !file.name.endsWith('.md')) {
        setFormErrors(prev => ({ ...prev, file: 'Unsupported file type. Please use TXT, MD, PDF, DOC, DOCX, JPG, PNG, or WebP.'}));
        return;
    }
    
    setFileName(file.name);
    setFormErrors(prev => ({ ...prev, file: '' }));
    
    if (IMAGE_FILE_TYPES.includes(file.type)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const [header, base64Data] = dataUrl.split(',');
        if (!header || !base64Data) {
            setFormErrors(prev => ({...prev, file: 'Invalid image file format.'}));
            return;
        }
        const mimeTypeMatch = header.match(/:(.*?);/);
        if (!mimeTypeMatch || !mimeTypeMatch[1]) {
            setFormErrors(prev => ({...prev, file: 'Could not determine image MIME type.'}));
            return;
        }
        const mimeType = mimeTypeMatch[1];
        setFormState(prev => ({ 
            ...prev, 
            studyMaterial: '', 
            imageData: { mimeType, data: base64Data } 
        }));
      };
      reader.onerror = () => {
        setFormErrors(prev => ({...prev, file: 'Failed to read the image file.'}));
      };
      reader.readAsDataURL(file);
    } else if (TEXT_FILE_TYPES.includes(file.type) || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFormState(prev => ({ ...prev, studyMaterial: text, imageData: null }));
      };
      reader.onerror = () => {
        setFormErrors(prev => ({...prev, file: 'Failed to read the file.'}));
      };
      reader.readAsText(file);
    } else {
        setFormState(prev => ({ ...prev, studyMaterial: `[Content of file: ${file.name}]`, imageData: null }));
    }

  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'questions') {
      const numValue = parseInt(value, 10);
      if (value && (isNaN(numValue) || numValue < 1 || numValue > 100)) {
        setFormErrors(prev => ({ ...prev, questions: 'Number of questions must be between 1 and 100.' }));
      } else {
        setFormErrors(prev => ({ ...prev, questions: '' }));
      }
    }

    setFormState(prevState => ({
      ...prevState,
      [name]: name === 'questions' ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(formErrors.file || formErrors.questions) return;
    onGenerate(formState);
  };
  
  const clearFile = () => {
    handleFileChange(null);
    const fileInput = document.getElementById('studyMaterialFile') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Generation Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="topic">Topic</Label>
          <Input id="topic" name="topic" type="text" value={formState.topic} onChange={handleChange} placeholder="e.g., General Computer Science" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select id="difficulty" name="difficulty" value={formState.difficulty} onChange={handleChange}>
              {DIFFICULTY_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="taxonomy">Bloom's Taxonomy</Label>
            <Select id="taxonomy" name="taxonomy" value={formState.taxonomy} onChange={handleChange}>
              {TAXONOMY_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="questions">Number of Questions (1-100)</Label>
          <Input id="questions" name="questions" type="number" value={formState.questions} onChange={handleChange} min="1" max="100" />
           {formErrors.questions && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formErrors.questions}</p>}
           <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">
              Groq for text (&le;40 questions), Gemini for images or &gt;40 questions.
            </p>
        </div>
        <div>
          <Label htmlFor="studyMaterialFile">Study Material (Optional)</Label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
            <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                 <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label htmlFor="studyMaterialFile" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload a file</span>
                      <input id="studyMaterialFile" name="studyMaterialFile" type="file" className="sr-only" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} accept=".txt,.md,.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Images, TXT, MD, PDF, DOC, DOCX up to {MAX_FILE_SIZE_MB}MB</p>
            </div>
          </div>
            {formErrors.file && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formErrors.file}</p>}
            {fileName && !formErrors.file && (
              <div className="mt-3 flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate pr-2">{fileName}</p>
                <button type="button" onClick={clearFile} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-bold">&times;</button>
              </div>
            )}
        </div>
        <div>
          <button type="submit" disabled={isLoading || !!formErrors.file || !!formErrors.questions} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
            {isLoading ? (
                <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Questions...
                </>
            ) : `Generate Questions`}
          </button>
        </div>
      </form>
    </div>
  );
};