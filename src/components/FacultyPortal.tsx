// src/components/FacultyPortal.tsx

import React, { useState } from 'react';
// FIX 1: Import the ViolationAlert TYPE and RENAME it to avoid the name collision.
import type { GeneratedMcqSet, Test, FollowRequest, AppUser, CustomFormField, AppNotification, ConnectionRequest, ViolationAlert as ViolationAlertType } from '../types';
// FIX 2: Import the ViolationAlert COMPONENT separately.
import { ViolationManager } from './ViolationManager';
import { McqDisplay } from './McqDisplay';

// --- Sub-component: PublishModal ---
interface PublishModalProps {
  questionCount: number;
  onSubmit: (title: string, duration: number, endDate: string | null, studentFieldsMode: 'default' | 'custom', customFields: CustomFormField[]) => void;
  onClose: () => void;
}
const PublishModal: React.FC<PublishModalProps> = ({ questionCount, onSubmit, onClose }) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(10);
  const [endDate, setEndDate] = useState('');
  const [studentFieldsMode, setStudentFieldsMode] = useState<'default' | 'custom'>('default');
  const [customFields, setCustomFields] = useState<CustomFormField[]>([{ label: '' }]);
  const [error, setError] = useState<string | null>(null);

  const handleAddField = () => setCustomFields(prev => [...prev, { label: '' }]);
  const handleRemoveField = (index: number) => setCustomFields(prev => prev.filter((_, i) => i !== index));
  const handleFieldChange = (index: number, value: string) => {
    const newFields = [...customFields];
    newFields[index].label = value;
    setCustomFields(newFields);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError("Test Title is required."); return; }
    if (duration <= 0) { setError("Duration must be a positive number."); return; }
    if (endDate && new Date(endDate) <= new Date()) { setError("End Date must be in the future."); return; }
    const finalCustomFields = studentFieldsMode === 'custom' ? customFields.filter(f => f.label.trim() !== '') : [];
    if (studentFieldsMode === 'custom' && finalCustomFields.length === 0) {
      setError("Please add at least one custom field or switch to Default mode.");
      return;
    }
    onSubmit(title.trim(), duration, endDate || null, studentFieldsMode, finalCustomFields);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Publish Test Settings</h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">Configure the details for this test ({questionCount} questions).</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="testTitle" className="block text-sm font-medium">Test Title</label>
            <input type="text" id="testTitle" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="duration" className="block text-sm font-medium">Duration (minutes)</label>
              <input type="number" id="duration" value={duration} onChange={e => setDuration(parseInt(e.target.value, 10))} min="1" required className="mt-1 w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium">End Date (Optional)</label>
              <input type="datetime-local" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
            </div>
          </div>
          <div className="pt-2">
            <label className="block text-sm font-medium mb-2">Student Details Form</label>
            <div className="flex gap-4 p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md">
              <label className="flex items-center cursor-pointer">
                <input type="radio" name="fieldsMode" value="default" checked={studentFieldsMode === 'default'} onChange={() => setStudentFieldsMode('default')} className="h-4 w-4"/>
                <span className="ml-2">Default (Name, Reg No, Branch, Section)</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input type="radio" name="fieldsMode" value="custom" checked={studentFieldsMode === 'custom'} onChange={() => setStudentFieldsMode('custom')} className="h-4 w-4"/>
                <span className="ml-2">Custom</span>
              </label>
            </div>
          </div>
          {studentFieldsMode === 'custom' && (
              <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-md space-y-3">
                <h4 className="font-semibold">Custom Student Fields</h4>
                {customFields.map((field, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input type="text" placeholder="e.g., Department Name" value={field.label} onChange={(e) => handleFieldChange(index, e.target.value)} className="flex-grow p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" />
                    <button type="button" onClick={() => handleRemoveField(index)} className="text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
                  </div>
                ))}
                <button type="button" onClick={handleAddField} className="text-sm text-blue-600 hover:underline">+ Add Another Field</button>
              </div>
          )}
          {error && <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900/50 p-2 rounded-md">{error}</p>}
          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium">Cancel</button>
            <button type="submit" className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Publish Test</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Sub-component: GeneratedSet ---
const GeneratedSet: React.FC<{ set: GeneratedMcqSet; onPublish: (id: string, title: string, duration: number, endDate: string | null, studentFieldsMode: 'default' | 'custom', customFields: CustomFormField[]) => void; }> = ({ set, onPublish }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const handlePublish = (title: string, duration: number, endDate: string | null, studentFieldsMode: 'default' | 'custom', customFields: CustomFormField[]) => {
    onPublish(set.id, title, duration, endDate, studentFieldsMode, customFields);
    setShowModal(false);
  };
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="p-4 flex justify-between items-center">
        <div>
          <h4 className="font-semibold">Set of {set.mcqs.length} questions</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Generated on {new Date(set.timestamp).toLocaleString()}</p>
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

// --- Main Component ---
interface FacultyPortalProps {
  faculty: AppUser;
  generatedSets: GeneratedMcqSet[];
  publishedTests: Test[];
  followRequests: FollowRequest[];
  connectionRequests: ConnectionRequest[];
  ignoredNotifications: AppNotification[];
  violationAlerts: ViolationAlertType[]; // <-- FIX: Use the aliased type here
  onPublishTest: (mcqSetId: string, title: string, durationMinutes: number, endDate: string | null, studentFieldsMode: 'default' | 'custom', customFormFields: CustomFormField[]) => void;
  onRevokeTest: (testId: string) => void;
  onFollowRequestResponse: (requestId: string, status: 'accepted' | 'rejected') => void;
  onViewTestAnalytics: (test: Test) => void;
  onGrantReattempt: (alertId: string) => void;
  onViewFollowers: () => void;
  onNavigateToConnect: () => void;
  onAcceptConnection: (requestId: string) => void;
  onRejectConnection: (requestId: string) => void;
}

export const FacultyPortal: React.FC<FacultyPortalProps> = ({ faculty, generatedSets, publishedTests, followRequests, connectionRequests, ignoredNotifications, violationAlerts, onPublishTest, onRevokeTest, onFollowRequestResponse, onViewTestAnalytics, onGrantReattempt, onViewFollowers, onNavigateToConnect, onAcceptConnection, onRejectConnection }) => {
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start">
            <div>
                <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">Faculty Dashboard</h2>
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg flex items-center gap-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">Your unique Faculty ID:</p>
                  <strong className="text-md font-mono bg-white dark:bg-gray-700 px-3 py-1 rounded-md">{faculty.facultyId}</strong>
                </div>
            </div>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <button onClick={onViewFollowers} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">View Followers</button>
                <button onClick={onNavigateToConnect} className="py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Connect & Chat</button>
            </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4">Unpublished Question Sets</h3>
                <div className="space-y-4">
                {generatedSets.length > 0 ? (
                    [...generatedSets].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(set => <GeneratedSet key={set.id} set={set} onPublish={onPublishTest} />)
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
                        <div className="flex items-center gap-2">
                          <button onClick={() => onViewTestAnalytics(test)} className="py-1 px-3 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">View Attempts</button>
                          <button onClick={() => onRevokeTest(test.id)} className="py-1 px-3 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">Revoke</button>
                        </div>
                    </div>
                    ))
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">No tests have been published yet.</p>
                )}
                </div>
            </div>
        </div>
        <div className="lg:col-span-1 space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4">Faculty Connection Requests</h3>
                <div className="space-y-3">
                    {connectionRequests.length > 0 ? (
                        connectionRequests.map(req => (
                            <div key={req.id} className="p-3 border border-purple-300 dark:border-purple-700 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{req.fromFacultyName}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{req.fromFacultyCollege}</p>
                                <div className="mt-2 flex items-center space-x-2">
                                    <button onClick={() => onAcceptConnection(req.id)} className="w-full text-xs py-1 px-2 bg-green-600 text-white rounded hover:bg-green-700">Accept</button>
                                    <button onClick={() => onRejectConnection(req.id)} className="w-full text-xs py-1 px-2 bg-gray-600 text-white rounded hover:bg-gray-500">Reject</button>
                                </div>
                            </div>
                        ))
                    ) : (
                         <p className="text-sm text-gray-500 dark:text-gray-400">No new connection requests.</p>
                    )}
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4">Student Follow Requests</h3>
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
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4">Ignored Test Alerts</h3>
                <div className="space-y-3">
                    {ignoredNotifications.length > 0 ? (
                       [...ignoredNotifications].sort((a, b) => new Date(b.actionTimestamp!).getTime() - new Date(a.actionTimestamp!).getTime()).map(notif => (
                            <div key={notif.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-yellow-50 dark:bg-yellow-900/30">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{notif.studentEmail}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">ignored your test: <span className="font-medium">{notif.test.title}</span></p>
                                {notif.actionTimestamp && (<p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{new Date(notif.actionTimestamp).toLocaleString()}</p>)}
                            </div>
                        ))
                    ) : (<p className="text-sm text-gray-500 dark:text-gray-400">No ignored test alerts.</p>)}
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold mb-4">Violation Alerts</h3>
              <div className="space-y-3">
                  {violationAlerts.length > 0 ? (
                      // FIX: Render the imported ViolationAlert component
                      violationAlerts.map(alert => (
                          <ViolationManager key={alert.id} alert={alert} onGrantReattempt={onGrantReattempt} />
                      ))
                  ) : (<p className="text-sm text-gray-500 dark:text-gray-400">No new violation alerts.</p>)}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};