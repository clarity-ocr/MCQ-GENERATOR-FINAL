import React, { useState, useCallback, useMemo, useEffect } from 'react';

// Component Imports
import { Header } from './components/Header';
import { McqGeneratorForm } from './components/McqGeneratorForm';
import { McqList } from './components/McqList';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { StudentPortal } from './components/StudentPortal';
import { TestPage } from './components/TestPage';
import { FacultyPortal } from './components/FacultyPortal';
import { StudentLogin } from './components/StudentLogin';
import { TestResults } from './components/TestResults';
import { TestHistory } from './components/TestHistory';
import { ManualMcqCreator } from './components/ManualMcqCreator';
import { AuthPortal } from './components/AuthPortal';
import { IdVerification } from './components/IdVerification';
import { Notifications } from './components/Notifications';

// Type Imports
import type { FormState, MCQ, Test, GeneratedMcqSet, Student, TestAttempt, FollowRequest, Notification as AppNotification, AppUser, CustomFormField } from './types';
import { Role } from './types';

// Service Imports
import { auth } from './services/firebase';
import { generateMcqs } from './services/geminiService';

// This is required for the v8 compat library
import type firebase from 'firebase/compat/app';

// TypeScript declarations for global libraries loaded via <script> tags
declare const jspdf: any;
declare const docx: any;

type View = 'auth' | 'idVerification' | 'generator' | 'results' | 'studentPortal' | 'studentLogin' | 'test' | 'facultyPortal' | 'testResults' | 'testHistory' | 'manualCreator' | 'notifications';

// Helper to safely read and parse data from localStorage
type GetInitialState = <T>(key: string, defaultValue: T) => T;
const getInitialState: GetInitialState = (key, defaultValue) => {
    try {
        const item = window.localStorage.getItem(key);
        if (item) {
            return JSON.parse(item, (k, v) => {
                if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(v)) {
                    return new Date(v);
                }
                return v;
            });
        }
    } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error);
    }
    return defaultValue;
};


const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [userMetadata, setUserMetadata] = useState<AppUser[]>(() => getInitialState('userMetadata', []));
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [allGeneratedMcqs, setAllGeneratedMcqs] = useState<GeneratedMcqSet[]>(() => getInitialState('allGeneratedMcqs', []));
  const [publishedTests, setPublishedTests] = useState<Test[]>(() => getInitialState('publishedTests', []));
  const [testHistory, setTestHistory] = useState<TestAttempt[]>(() => getInitialState('testHistory', []));
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>(() => getInitialState('followRequests', []));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getInitialState('notifications', []));
  const [isLoading, setIsLoading] = useState<boolean>(true); // Manages the initial auth check loading screen
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('auth');
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  const [latestTestResult, setLatestTestResult] = useState<TestAttempt | null>(null);
  
  // State for the raw Firebase user object. This is separate from our app's user profile.
  const [firebaseUser, setFirebaseUser] = useState<firebase.User | null>(null);

  // --- DATA PERSISTENCE EFFECTS ---
  useEffect(() => { localStorage.setItem('userMetadata', JSON.stringify(userMetadata)); }, [userMetadata]);
  useEffect(() => { localStorage.setItem('allGeneratedMcqs', JSON.stringify(allGeneratedMcqs)); }, [allGeneratedMcqs]);
  useEffect(() => { localStorage.setItem('publishedTests', JSON.stringify(publishedTests)); }, [publishedTests]);
  useEffect(() => { localStorage.setItem('testHistory', JSON.stringify(testHistory)); }, [testHistory]);
  useEffect(() => { localStorage.setItem('followRequests', JSON.stringify(followRequests)); }, [followRequests]);
  useEffect(() => { localStorage.setItem('notifications', JSON.stringify(notifications)); }, [notifications]);

  // --- CORE AUTHENTICATION & NAVIGATION LOGIC ---

  // EFFECT 1: Listens for Firebase auth changes.
  // This effect runs ONLY ONCE on component mount. Its sole job is to determine
  // if a user is logged into Firebase and update the `firebaseUser` state.
  // Once it completes, it sets `isLoading` to false, removing the initial loading screen.
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
      setIsLoading(false); // Auth check is complete, hide the main spinner.
    });
    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  // EFFECT 2: Syncs Firebase auth state with application state.
  // This effect runs whenever the `firebaseUser` changes (login/logout) or when
  // our local `userMetadata` is updated (e.g., after registration or ID verification).
  // It contains all the business logic for routing and setting the current user profile.
  useEffect(() => {
    if (isLoading) return; // Do nothing until the initial auth check is done.

    if (firebaseUser && firebaseUser.emailVerified) {
      const metadata = userMetadata.find(u => u.id === firebaseUser.uid);
      if (metadata) {
        setCurrentUser(metadata);
        if (metadata.role === Role.Faculty && !metadata.isIdVerified) {
          setView('idVerification');
        } else {
          // If the view is still 'auth' or 'idVerification', move to the correct portal.
          // This prevents getting stuck on the login page after a refresh.
          if (view === 'auth' || view === 'idVerification') {
             setView(metadata.role === Role.Faculty ? 'facultyPortal' : 'studentPortal');
          }
        }
      } else {
        // This handles a rare edge case where a user is authenticated with Firebase
        // but doesn't have a profile in our app's state (e.g., localStorage was cleared).
        // Logging out is the safest action to prevent a broken state.
        auth.signOut();
      }
    } else {
      // If there's no Firebase user or their email isn't verified, clear the
      // application's current user and show the login page.
      setCurrentUser(null);
      setView('auth');
    }
  }, [firebaseUser, userMetadata, isLoading, view]);


  // --- MEMOIZED DATA FOR PERFORMANCE ---
  const userGeneratedSets = useMemo(() => allGeneratedMcqs.filter(s => s.facultyId === currentUser?.id), [allGeneratedMcqs, currentUser]);
  const userPublishedTests = useMemo(() => publishedTests.filter(t => t.facultyId === currentUser?.id), [publishedTests, currentUser]);
  const userFollowRequests = useMemo(() => followRequests.filter(fr => fr.facultyId === currentUser?.id && fr.status === 'pending'), [followRequests, currentUser]);
  const userNotifications = useMemo(() => notifications.filter(n => n.studentId === currentUser?.id), [notifications, currentUser]);
  const studentTestHistory = useMemo(() => testHistory.filter(h => h.studentId === currentUser?.id), [testHistory, currentUser]);

  // --- AUTHENTICATION HANDLER FUNCTIONS ---
  const handleLogin = async (email: string, pass: string): Promise<string | null> => {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, pass);
      if (!userCredential.user?.emailVerified) {
        await auth.signOut();
        return "Please verify your email before logging in.";
      }
      return null;
    } catch (error: any) {
      return "Invalid email or password.";
    }
  };
  
  const handleRegister = async (name: string, email: string, pass: string, role: Role): Promise<string | null> => {
    if (userMetadata.some(u => u.email === email)) return "An account with this email already exists.";
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
      const user = userCredential.user;
      if (!user) throw new Error("User creation failed.");

      let facultyId = '';
      if (role === Role.Faculty) {
        const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '');
        const facultyCount = userMetadata.filter(u => u.role === Role.Faculty).length;
        facultyId = `${sanitizedName}-faculty${101 + facultyCount}`;
      }
      
      await user.updateProfile({ displayName: facultyId || name });
      
      const newUser: AppUser = { id: user.uid, name, email, role, facultyId, isIdVerified: false, following: [] };
      setUserMetadata(prev => [...prev, newUser]);
      
      await user.sendEmailVerification();
      await auth.signOut();
      
      return null;
    } catch (error: any) {
        return error.code === 'auth/email-already-in-use' ? "This email is already registered." : "Registration failed.";
    }
  };

  const handleCompleteIdVerification = () => {
      if(!currentUser) return;
      setUserMetadata(prev => prev.map(u => u.id === currentUser.id ? { ...u, isIdVerified: true } : u));
  };

  const handleLogout = () => {
    auth.signOut();
  };

  // --- MCQ & TEST MANAGEMENT HANDLERS ---
  const handleGenerateMcqs = useCallback(async (formData: Omit<FormState, 'aiProvider'>) => {
    if (!currentUser) return;
    const isGeneratorLoading = true;
    setView('generator');
    setError(null);
    setMcqs([]);
    try {
      const generatedMcqs = await generateMcqs(formData);
      setMcqs(generatedMcqs);
      setAllGeneratedMcqs(prev => [...prev, {
        id: `set-${Date.now()}`,
        facultyId: currentUser.id,
        timestamp: new Date(),
        mcqs: generatedMcqs,
      }]);
      setView('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setView('results'); // Show error on the results pane
    }
  }, [currentUser]);
  
  const handlePublishTest = (mcqSetId: string, title: string, durationMinutes: number, testMode: 'default' | 'custom', customFormFields: CustomFormField[]) => {
    if (!currentUser || currentUser.role !== Role.Faculty) return;
    const set = allGeneratedMcqs.find(s => s.id === mcqSetId);
    if (set) {
      const newTest: Test = { id: `test-${Date.now()}`, facultyId: currentUser.id, title, durationMinutes, questions: set.mcqs, testMode, customFormFields: testMode === 'custom' ? customFormFields : [] };
      setPublishedTests(prev => [...prev, newTest]);
      setAllGeneratedMcqs(prev => prev.filter(s => s.id !== mcqSetId));
      const followers = userMetadata.filter(u => u.role === Role.Student && u.following.includes(currentUser.id));
      const newNotifications: AppNotification[] = followers.map(follower => ({ id: `notif-${follower.id}-${newTest.id}`, studentId: follower.id, test: newTest, facultyName: currentUser.name, isRead: false }));
      setNotifications(prev => [...prev, ...newNotifications]);
      alert(`Test "${title}" published!`);
    }
  };

  const handleRevokeTest = (testId: string) => {
    const test = publishedTests.find(t => t.id === testId);
    if (test) {
      const newSet: GeneratedMcqSet = { id: `set-revoked-${Date.now()}`, facultyId: test.facultyId, timestamp: new Date(), mcqs: test.questions };
      setAllGeneratedMcqs(prev => [...prev, newSet]);
      setPublishedTests(prev => prev.filter(t => t.id !== testId));
      alert(`Test "${test.title}" has been revoked.`);
    }
  };

  const handleSaveManualSet = (manualMcqs: MCQ[]) => {
    if (!currentUser || manualMcqs.length === 0) return;
    setAllGeneratedMcqs(prev => [...prev, { id: `set-manual-${Date.now()}`, facultyId: currentUser.id, timestamp: new Date(), mcqs: manualMcqs }]);
    alert(`${manualMcqs.length} questions saved!`);
    setView('facultyPortal');
  };

  // --- STUDENT TEST FLOW HANDLERS ---
  const handleStartTest = (test: Test) => {
    setActiveTest(test);
    setView('studentLogin');
  };
  
  const handleLoginAndStart = (student: Student) => {
    if (activeTest && currentUser) {
      setStudentInfo(student);
      setNotifications(prev => prev.filter(n => !(n.test.id === activeTest.id && n.studentId === currentUser.id)));
      setView('test');
    }
  };

  const handleTestFinish = (finalAnswers: (string | null)[]) => {
    if (!activeTest || !studentInfo || !currentUser) return;
    const score = activeTest.questions.reduce((acc, q, index) => q.answer === finalAnswers[index] ? acc + 1 : acc, 0);
    const attempt: TestAttempt = { id: `attempt-${Date.now()}`, testId: activeTest.id, studentId: currentUser.id, testTitle: activeTest.title, student: studentInfo, score, totalQuestions: activeTest.questions.length, answers: finalAnswers, date: new Date() };
    setTestHistory(prev => [...prev, attempt]);
    setLatestTestResult(attempt);
    setActiveTest(null);
    setStudentInfo(null);
    setView('testResults');
  };

  // --- SOCIAL & NAVIGATION HANDLERS ---
  const handleSendFollowRequest = (facultyId: string) => {
    if (!currentUser) return;
    const faculty = userMetadata.find(u => u.facultyId === facultyId && u.role === Role.Faculty);
    if (!faculty) { alert("Faculty ID not found."); return; }
    if (followRequests.some(fr => fr.studentId === currentUser.id && fr.facultyId === faculty.id)) { alert("Request already sent."); return; }
    const newRequest: FollowRequest = { id: `fr-${currentUser.id}-${faculty.id}`, studentId: currentUser.id, studentEmail: currentUser.email, facultyId: faculty.id, status: 'pending' };
    setFollowRequests(prev => [...prev, newRequest]);
    alert("Follow request sent!");
  };

  const handleFollowRequestResponse = (requestId: string, status: 'accepted' | 'rejected') => {
    const request = followRequests.find(fr => fr.id === requestId);
    if (!request) return;
    setFollowRequests(prev => prev.map(fr => fr.id === requestId ? { ...fr, status } : fr));
    if (status === 'accepted') {
      setUserMetadata(prev => prev.map(u => u.id === request.studentId ? { ...u, following: [...u.following, request.facultyId] } : u));
    }
  };
  
  const handleNavigate = (targetView: View) => {
    setError(null); // Clear errors when navigating away
    setView(targetView);
  }

  // --- UTILITY HANDLERS ---
  const handleExportPDF = (mcqsToExport: MCQ[]) => { 
    alert(`PDF export for ${mcqsToExport.length} questions is not yet implemented.`);
  };
  const handleExportWord = (mcqsToExport: MCQ[]) => { 
    alert(`Word export for ${mcqsToExport.length} questions is not yet implemented.`);
  };
  
  // --- MAIN RENDER FUNCTION ---
  const renderContent = () => {
    // 1. Handle Initial Loading State: Show a spinner ONLY while checking auth status.
    if (isLoading) {
      return <div className="mt-20"><LoadingSpinner /></div>;
    }

    // 2. Handle Unauthenticated User: Always show the auth portal if not logged in.
    if (!currentUser) {
      return <AuthPortal onLogin={handleLogin} onRegister={handleRegister} />;
    }

    // 3. Handle Unverified Faculty: Force ID verification.
    if (currentUser.role === Role.Faculty && !currentUser.isIdVerified) {
      return <IdVerification onVerified={handleCompleteIdVerification} />;
    }

    // 4. Main View Router for authenticated and verified users.
    switch (view) {
      case 'facultyPortal':
        return <FacultyPortal faculty={currentUser} generatedSets={userGeneratedSets} publishedTests={userPublishedTests} followRequests={userFollowRequests} onPublishTest={handlePublishTest} onRevokeTest={handleRevokeTest} onFollowRequestResponse={handleFollowRequestResponse} />;
      
      case 'generator':
      case 'results':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <McqGeneratorForm onGenerate={handleGenerateMcqs} isLoading={false} />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg min-h-[400px] flex flex-col justify-center">
              {error ? <ErrorMessage message={error} /> 
                : <McqList mcqs={mcqs} />}
            </div>
          </div>
        );

      case 'manualCreator':
        return <ManualMcqCreator onSaveSet={handleSaveManualSet} onExportPDF={handleExportPDF} onExportWord={handleExportWord} />;

      case 'studentPortal':
        return <StudentPortal onNavigateToHistory={() => setView('testHistory')} onNavigateToNotifications={() => setView('notifications')} onSendFollowRequest={handleSendFollowRequest} />;
      
      case 'notifications':
        return <Notifications notifications={userNotifications} onStartTest={handleStartTest} onBack={() => setView('studentPortal')} />;
      
      case 'studentLogin':
        return activeTest ? <StudentLogin test={activeTest} onLogin={handleLoginAndStart} /> : <ErrorMessage message="No active test was selected. Please return to your notifications." />;
      
      case 'test':
        return (activeTest && studentInfo) ? <TestPage test={activeTest} student={studentInfo} onFinish={handleTestFinish} /> : <ErrorMessage message="Test session is invalid. Please restart the test." />;
      
      case 'testResults':
        return latestTestResult ? <TestResults result={latestTestResult} onNavigate={handleNavigate} /> : <ErrorMessage message="Could not find your latest test result." />;
      
      case 'testHistory':
        return <TestHistory history={studentTestHistory} onNavigateBack={() => setView('studentPortal')} />;

      // Fallback for any invalid view state
      default:
        // This should rarely be reached with the new effects, but it's a safe fallback.
        const defaultView = currentUser.role === Role.Faculty ? 'facultyPortal' : 'studentPortal';
        setView(defaultView);
        // Return a loading spinner while the state corrects itself on the next render.
        return <div className="mt-20"><LoadingSpinner /></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Header user={currentUser} activeView={view} onNavigate={handleNavigate} onLogout={handleLogout} notificationCount={userNotifications.filter(n => !n.isRead).length} />
      <main className="container mx-auto p-4 md:p-8">
        {error && !['generator', 'results'].includes(view) && <div className="mb-4"><ErrorMessage message={error} /></div>}
        {renderContent()}
      </main>
    </div>
  );
};

export default App;