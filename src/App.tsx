// src/App.tsx

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { db, auth } from './services/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
  deleteDoc,
  arrayRemove,
  getDoc,
  writeBatch
} from "firebase/firestore";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';

// --- Components ---
import { Header } from './components/Header';
import { McqGeneratorForm } from './components/McqGeneratorForm';
import { McqList } from './components/McqList';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { StudentLogin } from './components/StudentLogin';
import { TestPage } from './components/TestPage';
import { TestResults } from './components/TestResults';
import { TestHistory } from './components/TestHistory';
import { ManualMcqCreator } from './components/ManualMcqCreator';
import { AuthPortal, RegistrationData } from './components/AuthPortal';
import { Notifications } from './components/Notifications';
import { TestAnalytics } from './components/TestAnalytics';
import { ProfilePage } from './components/ProfilePage';
import { EmailVerification } from './components/EmailVerification';
import { SendNotificationModal } from './components/SendNotificationModal';
import { Certificate } from './components/Certificate';

// --- Modular Components ---
import { Dashboard } from './components/Dashboard';
import { ContentLibrary } from './components/ContentLibrary';
import { NetworkCenter } from './components/NetworkCenter';
import { IntegrityCenter } from './components/IntegrityCenter';

// --- Types & Services ---
import { Role, View } from './types';
import type {
  FormState, MCQ, Test, GeneratedMcqSet, Student, TestAttempt, FollowRequest,
  AppNotification, AppUser, CustomFormField, ViolationAlert, ConnectionRequest
} from './types';
import { generateMcqs } from './services/geminiService';

declare global {
  interface Window { jspdf: any; docx: any; }
}

const getInitialState = <T,>(key: string, defaultValue: T): T => {
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
  // --- 1. Core State ---
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [view, setView] = useState<View>('auth');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  // --- 2. Data State (Persisted/Cached) ---
  const [userMetadata, setUserMetadata] = useState<AppUser[]>(() => getInitialState('userMetadata', []));
  const [allGeneratedMcqs, setAllGeneratedMcqs] = useState<GeneratedMcqSet[]>(() => getInitialState('allGeneratedMcqs', []));
  const [testHistory, setTestHistory] = useState<TestAttempt[]>(() => getInitialState('testHistory', []));

  // --- 3. Live Data (Firestore Synced) ---
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [publishedTests, setPublishedTests] = useState<Test[]>([]);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [ignoredByStudents, setIgnoredByStudents] = useState<AppNotification[]>([]);
  const [violationAlerts, setViolationAlerts] = useState<ViolationAlert[]>([]);
  const [followingList, setFollowingList] = useState<AppUser[]>([]);
  const [followers, setFollowers] = useState<AppUser[]>([]);
  const [connectedFaculty, setConnectedFaculty] = useState<AppUser[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  
  // -- Separate Attempt States --
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]); // For Analytics (All students)
  const [userAttempts, setUserAttempts] = useState<TestAttempt[]>([]); // For History (Current user)
  
  // --- 4. Session State ---
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  const [latestTestResult, setLatestTestResult] = useState<TestAttempt | null>(null);
  const [analyticsTest, setAnalyticsTest] = useState<Test | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<TestAttempt | null>(null);

  // --- 5. Modal State ---
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [msgTargetUser, setMsgTargetUser] = useState('');

  // --- Persistence Effects ---
  useEffect(() => { try { localStorage.setItem('userMetadata', JSON.stringify(userMetadata)); } catch (e) {} }, [userMetadata]);
  useEffect(() => { try { localStorage.setItem('allGeneratedMcqs', JSON.stringify(allGeneratedMcqs)); } catch (e) {} }, [allGeneratedMcqs]);
  useEffect(() => { try { localStorage.setItem('testHistory', JSON.stringify(testHistory)); } catch (e) {} }, [testHistory]);

  // --- Auth & User Sync ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
      if (!user) setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const syncUser = async () => {
      if (!firebaseUser) {
        if (view !== 'auth' && view !== 'emailVerification') {
          setCurrentUser(null);
          setView('auth');
        }
        return;
      }

      if (!firebaseUser.emailVerified) {
        setIsLoading(false);
        return;
      }

      let userData: AppUser | null = null;
      const metadata = userMetadata.find(u => u.id === firebaseUser.uid);
      
      if (metadata) {
        userData = metadata;
      } else {
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            userData = docSnap.data() as AppUser;
            setUserMetadata(prev => [...prev.filter(u => u.id !== userData!.id), userData!]);
          } else {
            await signOut(auth);
            setView('auth');
            return;
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      }

      setCurrentUser(userData);
      setIsLoading(false);

      // Deep Linking Logic
      if (userData) {
        const params = new URLSearchParams(window.location.search);
        const testId = params.get('testId');
        
        if (testId && !activeTest) {
          try {
            const testRef = doc(db, "tests", testId);
            const testSnap = await getDoc(testRef);
            
            if (testSnap.exists()) {
              const testData = testSnap.data() as Test;
              
              if (testData.endDate && new Date(testData.endDate) < new Date()) {
                alert("This test has expired.");
              } else if (testData.disqualifiedStudents?.includes(userData.id)) {
                alert("You are disqualified.");
              } else {
                setActiveTest(testData);
                setStudentInfo({
                    name: userData.name,
                    registrationNumber: userData.username, 
                    branch: "N/A", section: "N/A", customData: {}
                });
                setView('studentLogin'); 
              }
            } else {
              alert("Test not found.");
            }
          } catch (e) {
            console.error("Link error:", e);
          } finally {
            window.history.replaceState({}, '', window.location.pathname);
          }
        } else if (['auth', 'idVerification', 'emailVerification'].includes(view)) {
          setView('dashboard');
        }
      }
    };
    syncUser();
  }, [firebaseUser, userMetadata]);

  // --- Real-time Listeners ---
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribes: (() => void)[] = [];
    
    // Data Loading
    unsubscribes.push(onSnapshot(query(collection(db, "tests"), where("facultyId", "==", currentUser.id)), (s) => setPublishedTests(s.docs.map(d => d.data() as Test))));
    unsubscribes.push(onSnapshot(query(collection(db, "notifications"), where("studentId", "==", currentUser.id)), (s) => setNotifications(s.docs.map(d => d.data() as AppNotification))));
    
    // Sync Attempts (Student view)
    unsubscribes.push(onSnapshot(query(collection(db, "testAttempts"), where("studentId", "==", currentUser.id)), (s) => {
        const attempts = s.docs.map(d => d.data() as TestAttempt);
        setUserAttempts(attempts);
        setTestHistory(attempts); // Keep local storage synced
    }));

    // Social & Integrity
    unsubscribes.push(onSnapshot(query(collection(db, "followRequests"), where("facultyId", "==", currentUser.id), where("status", "==", "pending")), (s) => setFollowRequests(s.docs.map(d => d.data() as FollowRequest))));
    unsubscribes.push(onSnapshot(query(collection(db, "connectionRequests"), where("toFacultyId", "==", currentUser.id), where("status", "==", "pending")), (s) => setConnectionRequests(s.docs.map(d => d.data() as ConnectionRequest))));
    unsubscribes.push(onSnapshot(query(collection(db, "violationAlerts"), where("facultyId", "==", currentUser.id), where("status", "==", "pending")), (s) => setViolationAlerts(s.docs.map(d => d.data() as ViolationAlert))));
    unsubscribes.push(onSnapshot(query(collection(db, "notifications"), where("facultyId", "==", currentUser.id), where("status", "==", "ignored")), (s) => setIgnoredByStudents(s.docs.map(d => d.data() as AppNotification))));

    return () => unsubscribes.forEach(u => u());
  }, [currentUser]);

  // --- Derived State ---
  const userGeneratedSets = useMemo(() => allGeneratedMcqs.filter(s => s.facultyId === currentUser?.id), [allGeneratedMcqs, currentUser]);
  const studentTestHistory = useMemo(() => userAttempts, [userAttempts]);
  
  // --- Handlers: Auth ---
  const handleLogin = async (e: string, p: string) => { try { const c = await signInWithEmailAndPassword(auth, e, p); return !c.user.emailVerified ? (await signOut(auth), "Verify Email") : null; } catch { return "Login Failed"; } };
  const handleRegister = async (d: RegistrationData) => { 
      try {
        const q = query(collection(db, "users"), where("username", "==", d.username));
        if (!(await getDocs(q)).empty) return { success: false, error: "Username taken" };
        let u: FirebaseUser;
        if (auth.currentUser) u = auth.currentUser; else { u = (await createUserWithEmailAndPassword(auth, d.email, d.password!)).user; }
        const nu: AppUser = { id: u.uid, username: d.username, name: d.name, email: u.email!, role: d.role, facultyId: d.username, collegeName: d.collegeName, country: d.country, state: d.state, district: d.district, isIdVerified: true, following: [], followers: [], facultyConnections: [] };
        await setDoc(doc(db, "users", u.uid), nu); setUserMetadata(p => [...p, nu]);
        if (d.password) { await sendEmailVerification(u); await signOut(auth); }
        return { success: true, email: u.email! };
      } catch (e: any) { return { success: false, error: e.message }; }
  };
  const handleGoogleSignIn = async () => { try { const r = await signInWithPopup(auth, new GoogleAuthProvider()); return (await getDoc(doc(db, "users", r.user.uid))).exists() ? {} : { isNewUser: true, googleUser: r.user }; } catch { return { error: "Failed" }; } };

  // --- Handlers: Content ---
  const handleGenerateMcqs = useCallback(async (data: Omit<FormState, 'aiProvider'>) => {
    if (!currentUser) return; setView('generator'); setError(null);
    try { const res = await generateMcqs(data); setAllGeneratedMcqs(p => [...p, { id: `set-${Date.now()}`, facultyId: currentUser.id, timestamp: new Date(), mcqs: res }]); setMcqs(res); setView('results'); } catch (e: any) { setError(e.message); setView('results'); }
  }, [currentUser]);

  const handlePublishTest = async (id: string, title: string, duration: number, end: string|null, mode: any, fields: any, shuffleQ: boolean, shuffleO: boolean, limit: number, allowSkip: boolean) => {
     if (!currentUser) return;
     const set = allGeneratedMcqs.find(s => s.id === id); if (!set) return;
     const newTest: Test = { 
        id: doc(collection(db, "tests")).id, facultyId: currentUser.id, title, durationMinutes: duration, questions: set.mcqs, endDate: end, 
        studentFieldsMode: mode, customStudentFields: fields, disqualifiedStudents: [],
        shuffleQuestions: shuffleQ, shuffleOptions: shuffleO, attemptLimit: limit, allowSkip 
     };
     
     const batch = writeBatch(db);
     batch.set(doc(db, "tests", newTest.id), newTest);

     if (currentUser.followers?.length) {
        currentUser.followers.forEach(fid => {
            const notifRef = doc(collection(db, "notifications"));
            batch.set(notifRef, { id: notifRef.id, studentId: fid, studentEmail: "Follower", facultyId: currentUser.id, facultyName: currentUser.name, test: newTest, status: 'new', type: 'test_invite', timestamp: new Date().toISOString() });
        });
     }
     await batch.commit();
     setView('dashboard');
  };

  const handleRevokeTest = async (testId: string) => {
    if (!confirm("Delete this test?")) return;
    try {
        await deleteDoc(doc(db, "tests", testId));
        (await getDocs(query(collection(db, "notifications"), where("test.id", "==", testId)))).docs.forEach(d => deleteDoc(d.ref));
    } catch (e) { console.error(e); }
  };

  const handleViewTestAnalytics = async (test: Test) => {
    setIsLoading(true);
    try {
        const q = query(collection(db, "testAttempts"), where("testId", "==", test.id));
        const snap = await getDocs(q);
        setTestAttempts(snap.docs.map(d => d.data() as TestAttempt));
        setAnalyticsTest(test);
        setView('testAnalytics');
    } catch (e) { console.error(e); alert("Failed to load analytics."); } 
    finally { setIsLoading(false); }
  };

  // --- Handlers: Social (Atomic) ---
  const handleSendFollowRequest = async (targetUsername: string) => {
    if (!currentUser) return;
    try {
        const q = query(collection(db, "users"), where("username", "==", targetUsername));
        const snap = await getDocs(q);
        if (snap.empty) { alert("User not found"); return; }
        const target = snap.docs[0].data() as AppUser;
        if (target.id === currentUser.id) { alert("Cannot follow self."); return; }
        
        const qReq = query(collection(db, "followRequests"), where("studentId", "==", currentUser.id), where("facultyId", "==", target.id));
        if (!(await getDocs(qReq)).empty) { alert("Request pending."); return; }
        if (currentUser.following.includes(target.id)) { alert("Already following."); return; }

        await setDoc(doc(collection(db, "followRequests")), { id: doc(collection(db, "followRequests")).id, studentId: currentUser.id, studentEmail: currentUser.email, facultyId: target.id, status: 'pending' });
        alert("Request sent.");
    } catch (e) { console.error(e); }
  };

  const handleFollowRequestResponse = async (rid: string, status: 'accepted'|'rejected') => {
    try {
        const batch = writeBatch(db);
        const ref = doc(db, "followRequests", rid); 
        batch.update(ref, { status });
        
        if (status === 'accepted') {
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const d = snap.data() as FollowRequest;
                batch.update(doc(db, "users", d.studentId), { following: arrayUnion(d.facultyId) });
                batch.update(doc(db, "users", d.facultyId), { followers: arrayUnion(d.studentId) });
                
                // Add system notification
                const notifRef = doc(collection(db, "notifications"));
                batch.set(notifRef, {
                    id: notifRef.id,
                    studentId: d.studentId,
                    studentEmail: currentUser!.email,
                    facultyId: currentUser!.id,
                    facultyName: currentUser!.name,
                    type: 'message',
                    title: 'Request Accepted',
                    message: `${currentUser!.name} accepted your follow request.`,
                    status: 'new',
                    timestamp: new Date().toISOString()
                });
            }
        }
        await batch.commit();
    } catch (e: any) {
        console.error("Follow Error:", e);
        if (e.code === 'permission-denied') alert("Permission denied. Check Rules.");
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    if (!currentUser || !confirm("Unfollow user?")) return;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "users", currentUser.id), { following: arrayRemove(targetUserId) });
      batch.update(doc(db, "users", targetUserId), { followers: arrayRemove(currentUser.id) });
      await batch.commit();
      
      setFollowingList(prev => prev.filter(u => u.id !== targetUserId));
      setCurrentUser(prev => prev ? { ...prev, following: prev.following.filter(id => id !== targetUserId) } : null);
    } catch (e) { console.error("Unfollow error:", e); }
  };

  const handleAcceptConnection = async (rid: string) => {
      const req = connectionRequests.find(r => r.id === rid); if (!req) return;
      const batch = writeBatch(db);
      batch.update(doc(db, "connectionRequests", rid), { status: 'accepted' });
      batch.update(doc(db, "users", req.fromFacultyId), { facultyConnections: arrayUnion(req.toFacultyId) });
      batch.update(doc(db, "users", req.toFacultyId), { facultyConnections: arrayUnion(req.fromFacultyId) });
      await batch.commit();
  };

  const handleRejectConnection = async (rid: string) => { await updateDoc(doc(db, "connectionRequests", rid), { status: 'rejected' }); };

  const handleSendMessage = async (targetUsername: string, message: string) => {
    if (!currentUser) return;
    try {
        const q = query(collection(db, "users"), where("username", "==", targetUsername));
        const snap = await getDocs(q);
        if (snap.empty) { alert("User not found."); return; }
        const target = snap.docs[0].data() as AppUser;
        const ref = doc(collection(db, "notifications"));
        await setDoc(ref, { 
            id: ref.id, studentId: target.id, studentEmail: target.email, 
            facultyId: currentUser.id, facultyName: currentUser.name, 
            title: "Message", message, type: 'message', status: 'new', timestamp: new Date().toISOString() 
        });
        setIsMsgModalOpen(false); alert("Message sent.");
    } catch (e) { console.error(e); alert("Failed to send."); }
  };

  const handleNavigate = (target: View) => {
      setError(null); setIsLoading(true);
      setTimeout(() => { setView(target); setIsLoading(false); }, 200);
      if (target === 'network' && currentUser) {
         if (currentUser.following.length) getDocs(query(collection(db, "users"), where("id", "in", currentUser.following))).then(s => setFollowingList(s.docs.map(d => d.data() as AppUser)));
         if (currentUser.followers && currentUser.followers.length) getDocs(query(collection(db, "users"), where("id", "in", currentUser.followers))).then(s => setFollowers(s.docs.map(d => d.data() as AppUser)));
      }
  };

  // --- Handlers: Execution ---
  const handleStartTest = async (test: Test, notificationId?: string) => {
    if (!currentUser) { alert("Must be logged in."); return; }
    if (test.endDate && new Date(test.endDate) < new Date()) { alert("Expired"); return; }
    if (test.disqualifiedStudents?.includes(currentUser.id)) { alert("Disqualified"); return; }
    
    if (test.attemptLimit && test.attemptLimit > 0) {
        const count = studentTestHistory.filter(h => h.testId === test.id).length;
        if (count >= test.attemptLimit) { alert(`Limit reached (${test.attemptLimit}).`); return; }
    }
    
    if (notificationId) await deleteDoc(doc(db, "notifications", notificationId));
    setActiveTest(test);
    setStudentInfo({ name: currentUser.name, registrationNumber: currentUser.username, branch: "N/A", section: "N/A", customData: {} });
    setView('studentLogin'); 
  };

  const handleTestFinish = async (answers: (string|null)[], violations: number, usedQuestions: MCQ[]) => {
      if (!activeTest || !currentUser || !studentInfo) return;
      const score = usedQuestions.reduce((acc, q, i) => (answers[i] === (q.correctAnswer || q.answer) ? acc + 1 : acc), 0);
      
      const attempt: TestAttempt = { 
          id: doc(collection(db, "testAttempts")).id, testId: activeTest.id, studentId: currentUser.id, testTitle: activeTest.title, 
          student: studentInfo, score, totalQuestions: usedQuestions.length, answers, 
          date: new Date(), violations, questions: usedQuestions 
      };
      
      await setDoc(doc(db, "testAttempts", attempt.id), attempt);
      setTestHistory(p => [attempt, ...p]);
      setUserAttempts(p => [attempt, ...p]); 
      
      if (violations >= 3) {
          await updateDoc(doc(db, "tests", activeTest.id), { disqualifiedStudents: arrayUnion(currentUser.id) });
          await setDoc(doc(collection(db, "violationAlerts")), { id: doc(collection(db, "violationAlerts")).id, studentId: currentUser.id, studentEmail: currentUser.email, facultyId: activeTest.facultyId, testId: activeTest.id, testTitle: activeTest.title, timestamp: new Date().toISOString(), status: 'pending' });
      }
      setLatestTestResult(attempt); setActiveTest(null); setView('testResults');
  };

  // --- Render ---
  const renderContent = () => {
    if (isLoading) return <LoadingSpinner />;
    if (view === 'emailVerification') return <EmailVerification email={verificationEmail} onLoginNavigate={() => setView('auth')} />;
    if (!currentUser) return <AuthPortal onLogin={handleLogin} onRegister={handleRegister} onGoogleSignIn={handleGoogleSignIn} onRegistrationSuccess={(e) => { setVerificationEmail(e); setView('emailVerification'); }} />;

    switch (view) {
      case 'dashboard': 
      case 'studentPortal': case 'facultyPortal':
        return <Dashboard user={currentUser} publishedTests={publishedTests} generatedSets={userGeneratedSets} testAttempts={userAttempts} followersCount={currentUser.followers?.length || 0} followingCount={currentUser.following.length} onNavigate={handleNavigate} />;
      
      case 'content': return <ContentLibrary generatedSets={userGeneratedSets} publishedTests={publishedTests} onPublishTest={handlePublishTest} onRevokeTest={handleRevokeTest} onViewTestAnalytics={handleViewTestAnalytics} onNavigate={handleNavigate} />;
      
      case 'network': return <NetworkCenter followRequests={followRequests} connectionRequests={connectionRequests} followers={followers} following={followingList} onSendFollowRequest={handleSendFollowRequest} onFollowRequestResponse={handleFollowRequestResponse} onAcceptConnection={handleAcceptConnection} onRejectConnection={handleRejectConnection} onUnfollow={handleUnfollow} />;
      
      case 'integrity': return <IntegrityCenter violationAlerts={violationAlerts} ignoredNotifications={ignoredByStudents} onGrantReattempt={async () => {}} />;
      case 'profile': return <ProfilePage user={currentUser} onLogout={() => { signOut(auth); setView('auth'); }} onBack={() => handleNavigate('dashboard')} />;
      
      case 'testResults': 
        const questionsToShow = latestTestResult?.questions || activeTest?.questions || publishedTests.find(t => t.id === latestTestResult?.testId)?.questions || [];
        return latestTestResult ? <TestResults result={latestTestResult} questions={questionsToShow} onNavigate={handleNavigate} /> : <ErrorMessage message="No result found." />;
      
      case 'studentLogin': return activeTest ? <StudentLogin test={activeTest} currentUser={currentUser} onLogin={(info) => { setStudentInfo(info); setView('test'); }} /> : <ErrorMessage message="Session expired." />;
      case 'test': return (activeTest && studentInfo) ? <TestPage test={activeTest} student={studentInfo} onFinish={handleTestFinish} /> : <ErrorMessage message="Invalid Session." />;
      case 'notifications': return <Notifications notifications={notifications} onStartTest={handleStartTest} onIgnoreTest={async (nid) => { await updateDoc(doc(db, "notifications", nid), { status: 'ignored' }); }} onBack={() => handleNavigate('dashboard')} />;
      
      case 'testHistory': 
        return <TestHistory 
          history={studentTestHistory} 
          onNavigateBack={() => handleNavigate('dashboard')} 
          onViewResult={(attempt) => { setLatestTestResult(attempt); setView('testResults'); }} 
          onViewCertificate={(attempt) => { setSelectedCertificate(attempt); setView('certificate'); }}
        />;

      case 'certificate': 
        return selectedCertificate 
          ? <Certificate attempt={selectedCertificate} onBack={() => setView('testHistory')} /> 
          : <ErrorMessage message="No certificate selected." />;

      case 'testAnalytics': 
        return analyticsTest 
          ? <TestAnalytics test={analyticsTest} attempts={testAttempts} onBack={() => handleNavigate('content')} onMessageStudent={(u) => { setMsgTargetUser(u); setIsMsgModalOpen(true); }} /> 
          : <ErrorMessage message="Select a test." />;
      
      case 'generator': return <McqGeneratorForm onGenerate={handleGenerateMcqs} isLoading={false} />;
      case 'results': return <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><McqGeneratorForm onGenerate={handleGenerateMcqs} isLoading={false} /><div className="bg-white p-6 rounded-lg shadow">{error ? <ErrorMessage message={error} /> : <McqList mcqs={mcqs} />}</div></div>;
      case 'manualCreator': return <ManualMcqCreator onSaveSet={(mcqs) => { /* save logic */ }} onExportPDF={()=>{}} onExportWord={()=>{}} />;
      default: return <div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      {['auth', 'emailVerification', 'test', 'studentLogin'].includes(view) ? renderContent() : (
        <>
          <Header user={currentUser} activeView={view} onNavigate={handleNavigate} onLogout={() => { signOut(auth); setView('auth'); }} notificationCount={notifications.filter(n => n.status === 'new').length} />
          <main className="container mx-auto p-4 md:p-8 animate-in fade-in duration-300">
            {renderContent()}
          </main>
          
          <SendNotificationModal 
            isOpen={isMsgModalOpen} 
            onClose={() => setIsMsgModalOpen(false)} 
            onSend={handleSendMessage} 
            prefilledUsername={msgTargetUser}
          />
        </>
      )}
    </div>
  );
};

export default App;