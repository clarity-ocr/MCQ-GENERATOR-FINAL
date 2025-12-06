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
  getDoc
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

// --- Modular Components ---
import { Dashboard } from './components/Dashboard';
import { ContentLibrary } from './components/ContentLibrary';
import { NetworkCenter } from './components/NetworkCenter';
import { IntegrityCenter } from './components/IntegrityCenter';

// --- Types & Services ---
import { Role, View } from './types';
import type {
  FormState, MCQ, Test, GeneratedMcqSet, Student, TestAttempt, FollowRequest,
  AppNotification, AppUser, ViolationAlert, ConnectionRequest
} from './types';
import { generateMcqs } from './services/geminiService';

declare global {
  interface Window { jspdf: any; docx: any; }
}

// --- Persistence Helper ---
const getInitialState = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
      return JSON.parse(item, (k, v) => {
        // Date parser for JSON
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

  // --- 2. Data State (Local/Persisted) ---
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
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]); // For analytics view
  
  // --- 4. Session State ---
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  const [latestTestResult, setLatestTestResult] = useState<TestAttempt | null>(null);
  const [analyticsTest, setAnalyticsTest] = useState<Test | null>(null);

  // --- Persistence Effects ---
  useEffect(() => { try { localStorage.setItem('userMetadata', JSON.stringify(userMetadata)); } catch (e) {} }, [userMetadata]);
  useEffect(() => { try { localStorage.setItem('allGeneratedMcqs', JSON.stringify(allGeneratedMcqs)); } catch (e) {} }, [allGeneratedMcqs]);
  useEffect(() => { try { localStorage.setItem('testHistory', JSON.stringify(testHistory)); } catch (e) {} }, [testHistory]);

  // --- Auth Listener ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
      if (!user) setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- User Sync & Deep Link Handler ---
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

      // 1. Fetch/Sync Profile
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
            // No profile found? Logout to be safe or redirect to setup
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

      // 2. Deep Link Handling
      if (userData) {
        const params = new URLSearchParams(window.location.search);
        const testId = params.get('testId');
        
        // If there is a testId and we aren't already in a test session
        if (testId && (!activeTest || activeTest.id !== testId)) {
          try {
            const testRef = doc(db, "tests", testId);
            const testSnap = await getDoc(testRef);
            
            if (testSnap.exists()) {
              const testData = testSnap.data() as Test;
              
              // A. Check Expiration
              if (testData.endDate && new Date(testData.endDate) < new Date()) {
                alert("This test has expired and is no longer available.");
                // Clean URL
                window.history.replaceState({}, '', window.location.pathname);
              } 
              // B. Check Disqualification
              else if (testData.disqualifiedStudents?.includes(userData.id)) {
                alert("You are disqualified from taking this test.");
                window.history.replaceState({}, '', window.location.pathname);
              } 
              // C. Valid Test -> Prepare Session
              else {
                setActiveTest(testData);
                // Pre-fill info based on login
                setStudentInfo({
                    name: userData.name,
                    registrationNumber: userData.username, 
                    branch: "N/A", 
                    section: "N/A",
                    customData: {}
                });
                setView('studentLogin'); 
                // Don't clean URL yet, allow studentLogin to process, or clean now:
                window.history.replaceState({}, '', window.location.pathname);
              }
            } else {
              alert("Test not found or link is invalid.");
              window.history.replaceState({}, '', window.location.pathname);
            }
          } catch (e) {
            console.error("Deep link error:", e);
          }
        } else if (['auth', 'idVerification', 'emailVerification'].includes(view)) {
          // If no deep link, go to dashboard
          setView('dashboard');
        }
      }
    };
    syncUser();
  }, [firebaseUser, userMetadata]);

  // --- Real-time Listeners (Firestore) ---
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribes: (() => void)[] = [];
    
    // My Content
    unsubscribes.push(onSnapshot(query(collection(db, "tests"), where("facultyId", "==", currentUser.id)), (s) => setPublishedTests(s.docs.map(d => d.data() as Test))));
    // My Alerts
    unsubscribes.push(onSnapshot(query(collection(db, "notifications"), where("studentId", "==", currentUser.id)), (s) => setNotifications(s.docs.map(d => d.data() as AppNotification))));
    // Network
    unsubscribes.push(onSnapshot(query(collection(db, "followRequests"), where("facultyId", "==", currentUser.id), where("status", "==", "pending")), (s) => setFollowRequests(s.docs.map(d => d.data() as FollowRequest))));
    unsubscribes.push(onSnapshot(query(collection(db, "connectionRequests"), where("toFacultyId", "==", currentUser.id), where("status", "==", "pending")), (s) => setConnectionRequests(s.docs.map(d => d.data() as ConnectionRequest))));
    // Integrity
    unsubscribes.push(onSnapshot(query(collection(db, "violationAlerts"), where("facultyId", "==", currentUser.id), where("status", "==", "pending")), (s) => setViolationAlerts(s.docs.map(d => d.data() as ViolationAlert))));
    unsubscribes.push(onSnapshot(query(collection(db, "notifications"), where("facultyId", "==", currentUser.id), where("status", "==", "ignored")), (s) => setIgnoredByStudents(s.docs.map(d => d.data() as AppNotification))));

    return () => unsubscribes.forEach(u => u());
  }, [currentUser]);

  // --- Selectors ---
  const userGeneratedSets = useMemo(() => allGeneratedMcqs.filter(s => s.facultyId === currentUser?.id), [allGeneratedMcqs, currentUser]);
  const studentTestHistory = useMemo(() => testHistory.filter(h => h.studentId === currentUser?.id), [testHistory, currentUser]);

  // --- Auth Handlers ---
  const handleLogin = async (e: string, p: string) => { 
    try { 
      const c = await signInWithEmailAndPassword(auth, e, p); 
      return !c.user.emailVerified ? (await signOut(auth), "Please verify your email first.") : null; 
    } catch { return "Invalid email or password."; } 
  };

  const handleRegister = async (d: RegistrationData) => { 
      try {
        const q = query(collection(db, "users"), where("username", "==", d.username));
        if (!(await getDocs(q)).empty) return { success: false, error: "Username is already taken." };
        
        let u: FirebaseUser;
        if (auth.currentUser) u = auth.currentUser; 
        else { const c = await createUserWithEmailAndPassword(auth, d.email, d.password!); u = c.user; }

        const nu: AppUser = { 
          id: u.uid, username: d.username, name: d.name, email: u.email!, role: d.role, 
          facultyId: d.username, collegeName: d.collegeName, country: d.country, 
          state: d.state, district: d.district, isIdVerified: true, 
          following: [], followers: [], facultyConnections: [] 
        };
        await setDoc(doc(db, "users", u.uid), nu); 
        setUserMetadata(p => [...p, nu]);
        
        if (d.password) { await sendEmailVerification(u); await signOut(auth); }
        return { success: true, email: u.email! };
      } catch (e: any) { return { success: false, error: e.message }; }
  };

  const handleGoogleSignIn = async () => { 
    try { 
      const r = await signInWithPopup(auth, new GoogleAuthProvider()); 
      return (await getDoc(doc(db, "users", r.user.uid))).exists() ? {} : { isNewUser: true, googleUser: r.user }; 
    } catch { return { error: "Google Sign-In Failed" }; } 
  };

  // --- Content Handlers ---
  const handleGenerateMcqs = useCallback(async (data: Omit<FormState, 'aiProvider'>) => {
    if (!currentUser) return; 
    setView('generator'); setError(null); setMcqs([]);
    try { 
      const res = await generateMcqs(data); 
      setAllGeneratedMcqs(p => [...p, { id: `set-${Date.now()}`, facultyId: currentUser.id, timestamp: new Date(), mcqs: res }]); 
      setMcqs(res); setView('results'); 
    } catch (e: any) { setError(e.message); setView('results'); }
  }, [currentUser]);

  // Publish with all settings
  const handlePublishTest = async (id: string, title: string, duration: number, end: string|null, mode: any, fields: any, shuffleQ: boolean, shuffleO: boolean, limit: number, allowSkip: boolean) => {
     if (!currentUser) return;
     const set = allGeneratedMcqs.find(s => s.id === id); if (!set) return;
     
     const newTest: Test = { 
        id: doc(collection(db, "tests")).id, 
        facultyId: currentUser.id, 
        title, durationMinutes: duration, questions: set.mcqs, endDate: end, 
        studentFieldsMode: mode, customStudentFields: fields, disqualifiedStudents: [],
        shuffleQuestions: shuffleQ, shuffleOptions: shuffleO, attemptLimit: limit, allowSkip 
     };
     await setDoc(doc(db, "tests", newTest.id), newTest);
     
     // Notify followers
     if (currentUser.followers?.length) {
        const batch = currentUser.followers.map(async (fid) => {
            const ref = doc(collection(db, "notifications"));
            await setDoc(ref, { id: ref.id, studentId: fid, studentEmail: "Follower", facultyId: currentUser.id, facultyName: currentUser.name, test: newTest, status: 'new' });
        });
        await Promise.all(batch);
     }
     // Removed auto-navigation to dashboard to keep user context
  };

  const handleRevokeTest = async (testId: string) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
        await deleteDoc(doc(db, "tests", testId));
        const q = query(collection(db, "notifications"), where("test.id", "==", testId));
        (await getDocs(q)).docs.forEach(d => deleteDoc(d.ref));
    } catch (e) { console.error(e); }
  };

  // --- Social Handlers ---
  const handleSendFollowRequest = async (targetUsername: string) => {
    if (!currentUser) return;
    const q = query(collection(db, "users"), where("username", "==", targetUsername));
    const snap = await getDocs(q);
    if (snap.empty) { alert("User not found."); return; }
    const target = snap.docs[0].data() as AppUser;
    if (target.id === currentUser.id) { alert("You cannot follow yourself."); return; }
    
    // Check pending requests
    const qReq = query(collection(db, "followRequests"), where("studentId", "==", currentUser.id), where("facultyId", "==", target.id));
    if (!(await getDocs(qReq)).empty) { alert("Request already pending."); return; }
    
    // Check if already following
    if (currentUser.following.includes(target.id)) { alert("You are already following this user."); return; }

    await setDoc(doc(collection(db, "followRequests")), { id: doc(collection(db, "followRequests")).id, studentId: currentUser.id, studentEmail: currentUser.email, facultyId: target.id, status: 'pending' });
    alert("Follow request sent!");
  };

  const handleFollowRequestResponse = async (rid: string, status: 'accepted'|'rejected') => {
    const ref = doc(db, "followRequests", rid); 
    await updateDoc(ref, { status });
    if (status === 'accepted') {
        const d = (await getDoc(ref)).data() as FollowRequest;
        await updateDoc(doc(db, "users", d.studentId), { following: arrayUnion(d.facultyId) });
        await updateDoc(doc(db, "users", d.facultyId), { followers: arrayUnion(d.studentId) });
    }
  };

  const handleAcceptConnection = async (rid: string) => {
      const req = connectionRequests.find(r => r.id === rid); if (!req) return;
      await updateDoc(doc(db, "connectionRequests", rid), { status: 'accepted' });
      await updateDoc(doc(db, "users", req.fromFacultyId), { facultyConnections: arrayUnion(req.toFacultyId) });
      await updateDoc(doc(db, "users", req.toFacultyId), { facultyConnections: arrayUnion(req.fromFacultyId) });
  };

  const handleRejectConnection = async (rid: string) => { await updateDoc(doc(db, "connectionRequests", rid), { status: 'rejected' }); };

  // --- Navigation ---
  const handleNavigate = (target: View) => {
      setError(null); setIsLoading(true);
      setTimeout(() => { setView(target); setIsLoading(false); }, 200);
      if (target === 'network' && currentUser) {
         // Refresh social lists
         if (currentUser.following.length) getDocs(query(collection(db, "users"), where("id", "in", currentUser.following))).then(s => setFollowingList(s.docs.map(d => d.data() as AppUser)));
         if (currentUser.followers && currentUser.followers.length) getDocs(query(collection(db, "users"), where("id", "in", currentUser.followers))).then(s => setFollowers(s.docs.map(d => d.data() as AppUser)));
      }
  };

  // --- Test Execution Handlers ---
  const handleStartTest = async (test: Test, notificationId?: string) => {
    if (!currentUser) { alert("Must be logged in."); return; }
    
    // 1. Check Expiration
    if (test.endDate && new Date(test.endDate) < new Date()) { alert("Test has expired."); return; }
    
    // 2. Check Disqualification
    if (test.disqualifiedStudents?.includes(currentUser.id)) { alert("You are disqualified."); return; }
    
    // 3. Check Limits (Fetch from Firestore for accuracy)
    if (test.attemptLimit && test.attemptLimit > 0) {
        const attemptsQ = query(collection(db, "testAttempts"), where("testId", "==", test.id), where("studentId", "==", currentUser.id));
        const count = (await getDocs(attemptsQ)).size;
        if (count >= test.attemptLimit) { alert(`Limit reached (${test.attemptLimit} attempts).`); return; }
    }

    if (notificationId) await deleteDoc(doc(db, "notifications", notificationId));
    
    setActiveTest(test);
    // Use logged in user data as Student Info
    setStudentInfo({
        name: currentUser.name,
        registrationNumber: currentUser.username, 
        branch: "N/A", section: "N/A", customData: {}
    });
    setView('studentLogin'); 
  };

  // UPDATED handleTestFinish: Accepts 'usedQuestions' to reflect the exact state (shuffled order) the user saw
  const handleTestFinish = async (answers: (string|null)[], violations: number, usedQuestions: MCQ[]) => {
      if (!activeTest || !currentUser || !studentInfo) return;
      
      // Calculate score based on the questions order the user actually saw
      const score = usedQuestions.reduce((acc, q, i) => {
          // Robust checking for correct answer property
          const correctVal = q.correctAnswer || q.answer;
          return (answers[i] === correctVal) ? acc + 1 : acc;
      }, 0);
      
      const attempt: TestAttempt = { 
          id: doc(collection(db, "testAttempts")).id, 
          testId: activeTest.id, 
          studentId: currentUser.id, 
          testTitle: activeTest.title, 
          student: studentInfo, 
          score, 
          totalQuestions: usedQuestions.length, 
          answers, 
          timestamp: Date.now(), 
          violations,
          questions: usedQuestions // SAVE EXACT SHUFFLED ORDER USED
      };
      
      await setDoc(doc(db, "testAttempts", attempt.id), attempt);
      
      // Update local states
      setTestHistory(p => [attempt, ...p]);
      setTestAttempts(p => [...p, attempt]); // Update analytics data
      
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
      case 'studentPortal': // Compat
      case 'facultyPortal': // Compat
        return <Dashboard 
            user={currentUser} 
            publishedTests={publishedTests} 
            generatedSets={userGeneratedSets} 
            testAttempts={testAttempts} 
            followersCount={currentUser.followers?.length || 0} 
            followingCount={currentUser.following.length} 
            onNavigate={handleNavigate} 
        />;

      case 'content': case 'library': 
        return <ContentLibrary generatedSets={userGeneratedSets} publishedTests={publishedTests} onPublishTest={handlePublishTest} onRevokeTest={handleRevokeTest} onViewTestAnalytics={(t) => { setAnalyticsTest(t); setView('testAnalytics'); }} onNavigate={handleNavigate} />;
      case 'network': return <NetworkCenter followRequests={followRequests} connectionRequests={connectionRequests} followers={followers} following={followingList} onSendFollowRequest={handleSendFollowRequest} onFollowRequestResponse={handleFollowRequestResponse} onAcceptConnection={handleAcceptConnection} onRejectConnection={handleRejectConnection} />;
      case 'integrity': return <IntegrityCenter violationAlerts={violationAlerts} ignoredNotifications={ignoredByStudents} onGrantReattempt={async () => {}} />;
      case 'profile': return <ProfilePage user={currentUser} onLogout={() => { signOut(auth); setView('auth'); }} onBack={() => handleNavigate('dashboard')} />;
      
      // Test execution & results
      case 'testResults': 
        // Use questions from the result object first (to respect shuffle history), fallback to active/published
        const questionsToShow = latestTestResult?.questions || activeTest?.questions || publishedTests.find(t => t.id === latestTestResult?.testId)?.questions || [];
        return latestTestResult ? <TestResults result={latestTestResult} questions={questionsToShow} onNavigate={handleNavigate} /> : <ErrorMessage message="No result found." />;
      
      case 'studentLogin': 
        return activeTest 
          ? <StudentLogin 
              test={activeTest} 
              currentUser={currentUser} // Pass currentUser for auto-fill
              onLogin={(info) => { setStudentInfo(info); setView('test'); }} 
            /> 
          : <ErrorMessage message="Test session expired." />;
          
      case 'test': return (activeTest && studentInfo) ? <TestPage test={activeTest} student={studentInfo} onFinish={handleTestFinish} /> : <ErrorMessage message="Invalid Test Session." />;
      
      // Utils
      case 'notifications': return <Notifications notifications={notifications} onStartTest={handleStartTest} onIgnoreTest={async (nid) => { await updateDoc(doc(db, "notifications", nid), { status: 'ignored' }); }} onBack={() => handleNavigate('dashboard')} />;
      case 'testHistory': return <TestHistory history={studentTestHistory} onNavigateBack={() => handleNavigate('dashboard')} onViewResult={(attempt) => { setLatestTestResult(attempt); setView('testResults'); }} />;
      
      // Analytics: Filter attempts for the selected test
      case 'testAnalytics': 
        return analyticsTest 
          ? <TestAnalytics 
              test={analyticsTest} 
              attempts={testAttempts.filter(a => a.testId === analyticsTest.id)} 
              onBack={() => handleNavigate('content')} 
            /> 
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
          <Header user={currentUser} activeView={view} onNavigate={handleNavigate} onLogout={() => { signOut(auth); setView('auth'); }} />
          <main className="container mx-auto p-4 md:p-8 animate-in fade-in duration-300">{renderContent()}</main>
        </>
      )}
    </div>
  );
};

export default App;