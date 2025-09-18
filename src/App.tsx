import React, { useState, useCallback, useMemo, useEffect } from 'react';

// --- Firebase Service Imports ---
import { db, auth } from './services/firebase';
import { 
    collection, query, where, getDocs, doc, setDoc, updateDoc, arrayUnion, onSnapshot, deleteDoc 
} from "firebase/firestore"; 
import type firebase from 'firebase/compat/app';

// --- Component Imports ---
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
import { TestAnalytics } from './components/TestAnalytics';

// --- Type Imports ---
import { Role } from './types';
import type { FormState, MCQ, Test, GeneratedMcqSet, Student, TestAttempt, FollowRequest, AppNotification, AppUser, CustomFormField } from './types';

// --- Service Imports ---
import { generateMcqs } from './services/geminiService';

// --- Global Declarations ---
declare const jspdf: any;
declare const docx: any;
type View = 'auth' | 'idVerification' | 'generator' | 'results' | 'studentPortal' | 'studentLogin' | 'test' | 'facultyPortal' | 'testResults' | 'testHistory' | 'manualCreator' | 'notifications' | 'testAnalytics';

const getInitialState = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        if (item) {
            return JSON.parse(item, (k, v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(v)) ? new Date(v) : v);
        }
    } catch (error) { console.error(`Error reading localStorage key "${key}":`, error); }
    return defaultValue;
};

const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [userMetadata, setUserMetadata] = useState<AppUser[]>(() => getInitialState('userMetadata', []));
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [allGeneratedMcqs, setAllGeneratedMcqs] = useState<GeneratedMcqSet[]>(() => getInitialState('allGeneratedMcqs', []));
  const [publishedTests, setPublishedTests] = useState<Test[]>([]);
  const [testHistory, setTestHistory] = useState<TestAttempt[]>(() => getInitialState('testHistory', []));
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [ignoredByStudents, setIgnoredByStudents] = useState<AppNotification[]>([]);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [analyticsTest, setAnalyticsTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('auth');
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  const [latestTestResult, setLatestTestResult] = useState<TestAttempt | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<firebase.User | null>(null);

  // --- LOCALSTORAGE PERSISTENCE ---
  useEffect(() => { localStorage.setItem('userMetadata', JSON.stringify(userMetadata)); }, [userMetadata]);
  useEffect(() => { localStorage.setItem('allGeneratedMcqs', JSON.stringify(allGeneratedMcqs)); }, [allGeneratedMcqs]);
  useEffect(() => { localStorage.setItem('testHistory', JSON.stringify(testHistory)); }, [testHistory]);
  
  // --- CORE AUTH & DATA LOADING ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => { setFirebaseUser(user); setIsLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (firebaseUser && firebaseUser.emailVerified) {
      const metadata = userMetadata.find(u => u.id === firebaseUser.uid);
      if (metadata) {
        setCurrentUser(metadata);
        if (metadata.role === Role.Faculty && !metadata.isIdVerified) setView('idVerification');
        else if (view === 'auth' || view === 'idVerification') setView(metadata.role === Role.Faculty ? 'facultyPortal' : 'studentPortal');
      } else {
        const fetchUserDoc = async () => {
            const userDocSnap = await getDocs(query(collection(db, "users"), where("id", "==", firebaseUser.uid)));
            if (!userDocSnap.empty) {
                const userData = userDocSnap.docs[0].data() as AppUser;
                setUserMetadata(prev => [...prev.filter(u => u.id !== userData.id), userData]);
                setCurrentUser(userData);
            } else { auth.signOut(); }
        };
        fetchUserDoc();
      }
    } else { setCurrentUser(null); setView('auth'); }
  }, [firebaseUser, isLoading, userMetadata, view]);
  
  // --- REAL-TIME FIRESTORE LISTENERS ---
  useEffect(() => {
    if (!currentUser) { setFollowRequests([]); setNotifications([]); setPublishedTests([]); setIgnoredByStudents([]); setTestAttempts([]); return; }
    let unsubscribes: (() => void)[] = [];
    const onError = (err: Error) => { console.error("Firestore listener error:", err); };
    if (analyticsTest && currentUser.role === Role.Faculty) {
      const attemptsQuery = query(collection(db, "testAttempts"), where("testId", "==", analyticsTest.id));
      unsubscribes.push(onSnapshot(attemptsQuery, (snapshot) => { setTestAttempts(snapshot.docs.map(doc => doc.data() as TestAttempt)); }, onError));
    }
    if (currentUser.role === Role.Faculty) {
      const testsQuery = query(collection(db, "tests"), where("facultyId", "==", currentUser.id));
      unsubscribes.push(onSnapshot(testsQuery, snapshot => setPublishedTests(snapshot.docs.map(doc => doc.data() as Test)), onError));
      const frQuery = query(collection(db, "followRequests"), where("facultyId", "==", currentUser.id), where("status", "==", "pending"));
      unsubscribes.push(onSnapshot(frQuery, snapshot => setFollowRequests(snapshot.docs.map(doc => doc.data() as FollowRequest)), onError));
      const ignoredQuery = query(collection(db, "notifications"), where("facultyId", "==", currentUser.id), where("status", "==", "ignored"));
      unsubscribes.push(onSnapshot(ignoredQuery, snapshot => setIgnoredByStudents(snapshot.docs.map(doc => doc.data() as AppNotification)), onError));
    }
    if (currentUser.role === Role.Student) {
      const now = new Date().toISOString();
      const notifQuery = query(collection(db, "notifications"), where("studentId", "==", currentUser.id), where("status", "==", "new"), where("test.endDate", ">=", now));
      unsubscribes.push(onSnapshot(notifQuery, snapshot => {
          setNotifications(snapshot.docs.map(doc => doc.data() as AppNotification));
      }, onError));
    }
    return () => unsubscribes.forEach(unsub => unsub());
  }, [currentUser, analyticsTest]);

  // --- MEMOIZED DATA ---
  const userGeneratedSets = useMemo(() => allGeneratedMcqs.filter(s => s.facultyId === currentUser?.id), [allGeneratedMcqs, currentUser]);
  const userPublishedTests = useMemo(() => publishedTests, [publishedTests]);
  const userFollowRequests = useMemo(() => followRequests, [followRequests]);
  const userNotifications = useMemo(() => notifications, [notifications]);
  const studentTestHistory = useMemo(() => testHistory.filter(h => h.studentId === currentUser?.id), [testHistory, currentUser]);

  // --- AUTH HANDLERS ---
  const handleLogin = async (email: string, pass: string): Promise<string | null> => {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, pass);
      if (!userCredential.user?.emailVerified) { await auth.signOut(); return "Please verify your email."; }
      return null;
    } catch (error: any) { return "Invalid email or password."; }
  };

  const handleRegister = async (name: string, email: string, pass: string, role: Role): Promise<string | null> => {
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
      const user = userCredential.user;
      if (!user) throw new Error("User creation failed.");
      let facultyId = '';
      if (role === Role.Faculty) {
        const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '');
        const { size } = await getDocs(query(collection(db, "users"), where("role", "==", Role.Faculty)));
        facultyId = `${sanitizedName}-faculty${101 + size}`;
      }
      const newUser: AppUser = { id: user.uid, name, email, role, facultyId, isIdVerified: false, following: [] };
      await setDoc(doc(db, "users", user.uid), newUser);
      setUserMetadata(prev => [...prev, newUser]);
      await user.sendEmailVerification();
      await auth.signOut();
      return null;
    } catch (error: any) { return error.code === 'auth/email-already-in-use' ? "This email is already registered." : "Registration failed."; }
  };

  const handleCompleteIdVerification = () => { if(!currentUser) return; setUserMetadata(prev => prev.map(u => u.id === currentUser.id ? { ...u, isIdVerified: true } : u)); };
  const handleLogout = () => auth.signOut();
  
  // --- MCQ & TEST HANDLERS ---
  const handleGenerateMcqs = useCallback(async (formData: Omit<FormState, 'aiProvider'>) => {
    if (!currentUser) return;
    setView('generator'); setError(null); setMcqs([]);
    try {
      const generatedMcqs = await generateMcqs(formData);
      setMcqs(generatedMcqs);
      setAllGeneratedMcqs(prev => [...prev, { id: `set-${Date.now()}`, facultyId: currentUser.id, timestamp: new Date(), mcqs: generatedMcqs }]);
      setView('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setView('results');
    }
  }, [currentUser]);
  
  const handlePublishTest = async (mcqSetId: string, title: string, durationMinutes: number, endDate: string | null, studentFieldsMode: 'default' | 'custom', customStudentFields: CustomFormField[]) => {
    if (!currentUser || currentUser.role !== Role.Faculty) return;
    const set = allGeneratedMcqs.find(s => s.id === mcqSetId);
    if (!set) { alert("Question set not found."); return; }
    try {
        const newTestRef = doc(collection(db, "tests"));
        const newTest: Test = { id: newTestRef.id, facultyId: currentUser.id, title, durationMinutes, questions: set.mcqs, endDate, studentFieldsMode, customStudentFields, disqualifiedStudents: [] };
        await setDoc(newTestRef, newTest);
        const followersQuery = query(collection(db, "users"), where("following", "array-contains", currentUser.id));
        const followersSnapshot = await getDocs(followersQuery);
        if (followersSnapshot.empty) {
            alert(`Test "${title}" published successfully, but no followers were found to notify.`);
        } else {
            for (const userDoc of followersSnapshot.docs) {
                const follower = userDoc.data() as AppUser;
                const newNotifRef = doc(collection(db, "notifications"));
                const newNotification: AppNotification = { id: newNotifRef.id, studentId: follower.id, studentEmail: follower.email, facultyId: currentUser.id, facultyName: currentUser.name, test: newTest, status: 'new' };
                await setDoc(newNotifRef, newNotification);
            }
            alert(`Test "${title}" published and sent to ${followersSnapshot.size} follower(s)!`);
        }
        setAllGeneratedMcqs(prev => prev.filter(s => s.id !== mcqSetId));
    } catch (error) { console.error("Error publishing test:", error); alert("An error occurred."); }
  };
  
  const handleRevokeTest = async (testId: string) => {
    if (!window.confirm("Are you sure you want to revoke this test? This will delete it and all related notifications.")) return;
    const testToRevoke = publishedTests.find(t => t.id === testId);
    if (!testToRevoke) { alert("Test not found."); return; }
    try {
      await deleteDoc(doc(db, "tests", testId));
      const notificationsQuery = query(collection(db, "notifications"), where("test.id", "==", testId));
      const notificationSnapshot = await getDocs(notificationsQuery);
      for (const notificationDoc of notificationSnapshot.docs) {
        await deleteDoc(doc(db, "notifications", notificationDoc.id));
      }
      const newSet: GeneratedMcqSet = { id: `set-revoked-${Date.now()}`, facultyId: testToRevoke.facultyId, timestamp: new Date(), mcqs: testToRevoke.questions };
      setAllGeneratedMcqs(prev => [...prev, newSet]);
      alert(`Test "${testToRevoke.title}" has been revoked successfully.`);
    } catch (error) { console.error("Error revoking test:", error); alert("An error occurred."); }
  };

  const handleSaveManualSet = (manualMcqs: MCQ[]) => {
    if (!currentUser || manualMcqs.length === 0) return;
    setAllGeneratedMcqs(prev => [...prev, { id: `set-manual-${Date.now()}`, facultyId: currentUser.id, timestamp: new Date(), mcqs: manualMcqs }]);
    alert(`${manualMcqs.length} questions saved!`);
    setView('facultyPortal');
  };

  // --- STUDENT FLOW HANDLERS ---
  const handleStartTest = async (test: Test, notificationId: string) => {
    if (!currentUser) return;
    if (test.disqualifiedStudents?.includes(currentUser.id)) {
        alert("You have been disqualified from re-taking this test due to excessive violations. Please contact your faculty member.");
        return;
    }
    try {
        await deleteDoc(doc(db, "notifications", notificationId));
        setActiveTest(test);
        setView('studentLogin');
    } catch (error) { console.error("Error removing notification:", error); }
  };
  
  const handleIgnoreTest = async (notificationId: string) => {
    try {
        await updateDoc(doc(db, "notifications", notificationId), { 
            status: 'ignored',
            ignoredTimestamp: new Date().toISOString()
        });
    } catch (error) { console.error("Error ignoring notification:", error); }
  };

  const handleLoginAndStart = (student: Student) => {
    if (activeTest && currentUser) { 
      setStudentInfo(student); 
      setView('test'); 
    }
  };

  const handleTestFinish = async (finalAnswers: (string | null)[], violations: number) => {
    if (!activeTest || !studentInfo || !currentUser) return;
    const score = activeTest.questions.reduce((acc, q, index) => q.answer === finalAnswers[index] ? acc + 1 : acc, 0);
    const attemptRef = doc(collection(db, "testAttempts"));
    const attempt: TestAttempt = { id: attemptRef.id, testId: activeTest.id, studentId: currentUser.id, testTitle: activeTest.title, student: studentInfo, score, totalQuestions: activeTest.questions.length, answers: finalAnswers, date: new Date() };
    await setDoc(attemptRef, attempt);

    if (violations >= 3) {
      const testRef = doc(db, "tests", activeTest.id);
      await updateDoc(testRef, {
        disqualifiedStudents: arrayUnion(currentUser.id)
      });
    }

    setLatestTestResult(attempt);
    setActiveTest(null); 
    setStudentInfo(null);
    setView('testResults');
  };

  // --- SOCIAL HANDLERS ---
  const handleSendFollowRequest = async (facultyIdToFind: string) => {
    if (!currentUser) { alert("You must be logged in."); return; }
    try {
      const q = query(collection(db, "users"), where("facultyId", "==", facultyIdToFind), where("role", "==", Role.Faculty));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) { alert("Faculty ID not found."); return; }
      const faculty = querySnapshot.docs[0].data() as AppUser;
      const requestsRef = collection(db, "followRequests");
      const existingReqQuery = query(requestsRef, where("studentId", "==", currentUser.id), where("facultyId", "==", faculty.id));
      if (!(await getDocs(existingReqQuery)).empty) { alert("You have already sent a follow request."); return; }
      const newRequestRef = doc(requestsRef);
      const newRequest: FollowRequest = { id: newRequestRef.id, studentId: currentUser.id, studentEmail: currentUser.email, facultyId: faculty.id, status: 'pending' };
      await setDoc(newRequestRef, newRequest);
      alert("Follow request sent successfully!");
    } catch (error) { console.error("Error sending follow request:", error); alert("An error occurred."); }
  };

  const handleFollowRequestResponse = async (requestId: string, status: 'accepted' | 'rejected') => {
    const request = followRequests.find(fr => fr.id === requestId);
    if (!request) return;
    try {
        const requestRef = doc(db, "followRequests", requestId);
        await updateDoc(requestRef, { status: status });
        if (status === 'accepted') {
            const studentRef = doc(db, "users", request.studentId);
            await updateDoc(studentRef, { following: arrayUnion(request.facultyId) });
        }
        alert(`Request has been ${status}.`);
    } catch (error) { console.error("Error responding to follow request:", error); alert("An error occurred."); }
  };
  
  const handleNavigate = (targetView: View) => { setAnalyticsTest(null); setView(targetView); };
  
  const handleViewTestAnalytics = (test: Test) => {
    setAnalyticsTest(test);
    setView('testAnalytics');
  };
  
  // --- MAIN RENDER FUNCTION ---
  const renderContent = () => {
    if (isLoading) return <div className="mt-20"><LoadingSpinner /></div>;
    if (!currentUser) return <AuthPortal onLogin={handleLogin} onRegister={handleRegister} />;
    if (currentUser.role === Role.Faculty && !currentUser.isIdVerified) return <IdVerification onVerified={handleCompleteIdVerification} />;
    
    switch (view) {
      case 'facultyPortal': return <FacultyPortal faculty={currentUser} generatedSets={userGeneratedSets} publishedTests={userPublishedTests} followRequests={userFollowRequests} ignoredNotifications={ignoredByStudents} onPublishTest={handlePublishTest} onRevokeTest={handleRevokeTest} onFollowRequestResponse={handleFollowRequestResponse} onViewTestAnalytics={handleViewTestAnalytics} />;
      case 'studentPortal': return <StudentPortal onNavigateToHistory={() => setView('testHistory')} onNavigateToNotifications={() => setView('notifications')} onSendFollowRequest={handleSendFollowRequest} />;
      case 'notifications': return <Notifications notifications={userNotifications} onStartTest={handleStartTest} onIgnoreTest={handleIgnoreTest} onBack={() => setView('studentPortal')} />;
      case 'testAnalytics': return analyticsTest ? <TestAnalytics test={analyticsTest} attempts={testAttempts} onBack={() => setView('facultyPortal')} /> : <ErrorMessage message="No test selected for analytics." />;
      case 'generator':
      case 'results':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <McqGeneratorForm onGenerate={handleGenerateMcqs} isLoading={false} />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg min-h-[400px] flex flex-col justify-center">
              {error ? <ErrorMessage message={error} /> : <McqList mcqs={mcqs} />}
            </div>
          </div>
        );
      case 'manualCreator': return <ManualMcqCreator onSaveSet={handleSaveManualSet} onExportPDF={() => {}} onExportWord={() => {}} />;
      case 'studentLogin': return activeTest ? <StudentLogin test={activeTest} onLogin={handleLoginAndStart} /> : <ErrorMessage message="No active test selected." />;
      case 'test': return (activeTest && studentInfo) ? <TestPage test={activeTest} student={studentInfo} onFinish={handleTestFinish} /> : <ErrorMessage message="Test session is invalid." />;
      case 'testResults': return latestTestResult ? <TestResults result={latestTestResult} onNavigate={handleNavigate} /> : <ErrorMessage message="Could not find your test result." />;
      case 'testHistory': return <TestHistory history={studentTestHistory} onNavigateBack={() => setView('studentPortal')} />;
      default:
        const defaultView = currentUser.role === Role.Faculty ? 'facultyPortal' : 'studentPortal';
        setView(defaultView);
        return <div className="mt-20"><LoadingSpinner /></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Header user={currentUser} activeView={view} onNavigate={handleNavigate} onLogout={handleLogout} notificationCount={userNotifications.length} />
      <main className="container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;