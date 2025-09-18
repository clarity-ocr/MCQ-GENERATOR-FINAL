import React, { useState } from 'react';
import type { GeneratedMcqSet, Test, FollowRequest, AppUser, CustomFormField } from '../types';
import { McqDisplay } from './McqDisplay';

interface PublishModalProps {
  questionCount: number;
  onSubmit: (title: string, duration: number, testMode: 'default' | 'custom', customFormFields: CustomFormField[]) => void;
  onClose: () => void;
}

const PublishModal: React.FC<PublishModalProps> = ({ questionCount, onSubmit, onClose }) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(10);
  const [testMode, setTestMode] = useState<'default' | 'custom'>('default');
  const [customFields, setCustomFields] = useState<CustomFormField[]>([]);

  const handleAddField = () => {
    setCustomFields(prev => [...prev, { label: '' }]);
  };

  const handleFieldChange = (index: number, value: string) => {
    const newFields = [...customFields];
    newFields[index].label = value;
    setCustomFields(newFields);
  };

  const handleRemoveField = (index: number) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalFields = customFields.filter(f => f.label.trim() !== '');
    if (title.trim() && duration > 0) {
      onSubmit(title, duration, testMode, finalFields);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Publish Test</h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">You are about to publish a test with {questionCount} questions.</p>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="testTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Test Title</label>
              <input type="text" id="testTitle" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
            </div>
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Duration (minutes)</label>
              <input type="number" id="duration" value={duration} onChange={e => setDuration(parseInt(e.target.value, 10))} min="1" required className="mt-1 w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Student Form Mode</label>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center"><input type="radio" name="testMode" value="default" checked={testMode === 'default'} onChange={() => setTestMode('default')} className="h-4 w-4" /> <span className="ml-2">Default</span></label>
                <label className="flex items-center"><input type="radio" name="testMode" value="custom" checked={testMode === 'custom'} onChange={() => setTestMode('custom')} className="h-4 w-4"/> <span className="ml-2">Custom Form</span></label>
              </div>
            </div>
            {testMode === 'custom' && (
              <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-md space-y-3">
                <h4 className="font-semibold">Custom Student Fields</h4>
                {customFields.map((field, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input type="text" placeholder="e.g., Department" value={field.label} onChange={(e) => handleFieldChange(index, e.target.value)} className="flex-grow p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" />
                    <button type="button" onClick={() => handleRemoveField(index)} className="text-red-500 font-bold text-xl">&times;</button>
                  </div>
                ))}
                <button type="button" onClick={handleAddField} className="text-sm text-blue-600 hover:underline">+ Add Field</button>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium">Cancel</button>
            <button type="submit" className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Publish</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const GeneratedSet: React.FC<{ set: GeneratedMcqSet; onPublish: (id: string, title: string, duration: number, testMode: 'default' | 'custom', customFormFields: CustomFormField[]) => void; }> = ({ set, onPublish }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const handlePublish = (title: string, duration: number, testMode: 'default' | 'custom', customFormFields: CustomFormField[]) => {
    onPublish(set.id, title, duration, testMode, customFormFields);
    setShowModal(false);
  };
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="p-4 flex justify-between items-center">
        <div>
          <h4 className="font-semibold">Set of {set.mcqs.length} questions</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Generated on {set.timestamp.toLocaleString()}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{isExpanded ? 'Collapse' : 'View'}</button>
          <button onClick={() => setShowModal(true)} className="py-1 px-3 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Publish</button>
        </div>
      </div>
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4 bg-gray-50 dark:bg-gray-900/50">
          {set.mcqs.map((mcq, index) => <McqDisplay key={index} mcq={mcq} index={index} />)}
        </div>
      )}
      {showModal && <PublishModal questionCount={set.mcqs.length} onSubmit={handlePublish} onClose={() => setShowModal(false)} />}
    </div>
  );
};


interface FacultyPortalProps {
  faculty: AppUser;
  generatedSets: GeneratedMcqSet[];
  publishedTests: Test[];
  followRequests: FollowRequest[];
  onPublishTest: (mcqSetId: string, title: string, durationMinutes: number, testMode: 'default' | 'custom', customFormFields: CustomFormField[]) => void;
  onRevokeTest: (testId: string) => void;
  onFollowRequestResponse: (requestId: string, status: 'accepted' | 'rejected') => void;
}

export const FacultyPortal: React.FC<FacultyPortalProps> = ({ faculty, generatedSets, publishedTests, followRequests, onPublishTest, onRevokeTest, onFollowRequestResponse }) => {
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">Faculty Dashboard</h2>
        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg flex items-center gap-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">Your unique Faculty ID (for students to follow you):</p>
          <strong className="text-md font-mono bg-white dark:bg-gray-700 px-3 py-1 rounded-md text-blue-900 dark:text-blue-100">{faculty.facultyId}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4">Unpublished Question Sets</h3>
                <div className="space-y-4">
                {generatedSets.length > 0 ? (
                    [...generatedSets].sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).map(set => <GeneratedSet key={set.id} set={set} onPublish={onPublishTest} />)
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">No unpublished question sets. Use the AI or Manual Generator to create some.</p>
                )}
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4">Published Tests</h3>
                <div className="space-y-3">
                {publishedTests.length > 0 ? (
                    publishedTests.map(test => (
                    <div key={test.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{test.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{test.questions.length} Questions, {test.durationMinutes} min</p>
                        </div>
                        <button onClick={() => onRevokeTest(test.id)} className="py-1 px-3 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">Revoke</button>
                    </div>
                    ))
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">No tests have been published yet.</p>
                )}
                </div>
            </div>
        </div>
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <h3 className="text-2xl font-bold mb-4">Follow Requests</h3>
            <div className="space-y-3">
                {followRequests.length > 0 ? (
                    followRequests.map(req => (
                        <div key={req.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{req.studentEmail}</p>
                            <div className="mt-2 flex items-center space-x-2">
                                <button onClick={() => onFollowRequestResponse(req.id, 'accepted')} className="w-full text-xs py-1 px-2 bg-green-600 text-white rounded hover:bg-green-700">Accept</button>
                                <button onClick={() => onFollowRequestResponse(req.id, 'rejected')} className="w-full text-xs py-1 px-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500">Reject</button>
                            </div>
                        </div>
                    ))
                ) : (
                     <p className="text-sm text-gray-500 dark:text-gray-400">No pending follow requests.</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};