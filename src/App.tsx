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

// --- Component Imports ---
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

// --- New Modular Components ---
// Ensure you have created these files based on the previous instructions
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

  // --- 2. Data State (Persisted) ---
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
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  
  // --- 4. Session State ---
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  const [latestTestResult, setLatestTestResult] = useState<TestAttempt | null>(null);
  const [analyticsTest, setAnalyticsTest] = useState<Test | null>(null);

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

      const metadata = userMetadata.find(u => u.id === firebaseUser.uid);
      if (metadata) {
        setCurrentUser(metadata);
        if (['auth', 'idVerification', 'emailVerification'].includes(view)) {
          setView('dashboard'); 
        }
        setIsLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const userData = docSnap.data() as AppUser;
          setUserMetadata(prev => [...prev.filter(u => u.id !== userData.id), userData]);
          setCurrentUser(userData);
          if (['auth', 'idVerification', 'emailVerification'].includes(view)) {
            setView('dashboard');
          }
        } else {
          await signOut(auth);
          setView('auth');
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setIsLoading(false);
      }
    };
    syncUser();
  }, [firebaseUser, userMetadata, view]);

  // --- Real-time Listeners ---
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribes: (() => void)[] = [];
    
    // 1. My Published Tests
    unsubscribes.push(onSnapshot(
      query(collection(db, "tests"), where("facultyId", "==", currentUser.id)),
      (s) => setPublishedTests(s.docs.map(d => d.data() as Test))
    ));

    // 2. My Notifications
    unsubscribes.push(onSnapshot(
      query(collection(db, "notifications"), where("studentId", "==", currentUser.id)),
      (s) => setNotifications(s.docs.map(d => d.data() as AppNotification))
    ));

    // 3. Follow Requests
    unsubscribes.push(onSnapshot(
      query(collection(db, "followRequests"), where("facultyId", "==", currentUser.id), where("status", "==", "pending")),
      (s) => setFollowRequests(s.docs.map(d => d.data() as FollowRequest))
    ));

    // 4. Connection Requests
    unsubscribes.push(onSnapshot(
      query(collection(db, "connectionRequests"), where("toFacultyId", "==", currentUser.id), where("status", "==", "pending")),
      (s) => setConnectionRequests(s.docs.map(d => d.data() as ConnectionRequest))
    ));

    // 5. Violations
    unsubscribes.push(onSnapshot(
      query(collection(db, "violationAlerts"), where("facultyId", "==", currentUser.id), where("status", "==", "pending")),
      (s) => setViolationAlerts(s.docs.map(d => d.data() as ViolationAlert))
    ));

    // 6. Ignored Tests
    unsubscribes.push(onSnapshot(
      query(collection(db, "notifications"), where("facultyId", "==", currentUser.id), where("status", "==", "ignored")),
      (s) => setIgnoredByStudents(s.docs.map(d => d.data() as AppNotification))
    ));

    return () => unsubscribes.forEach(u => u());
  }, [currentUser]);

  // --- Memoized Data ---
  const userGeneratedSets = useMemo(() => allGeneratedMcqs.filter(s => s.facultyId === currentUser?.id), [allGeneratedMcqs, currentUser]);
  const studentTestHistory = useMemo(() => testHistory.filter(h => h.studentId === currentUser?.id), [testHistory, currentUser]);

  // --- Handlers (Auth) ---
  const handleLogin = async (email: string, pass: string): Promise<string | null> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      if (!cred.user.emailVerified) {
        await signOut(auth);
        return "Please verify your email.";
      }
      return null;
    } catch (e: any) {
      return "Login failed. Check credentials.";
    }
  };

  const handleRegister = async (data: RegistrationData): Promise<{ success: boolean; error?: string; email?: string }> => {
    try {
      const q = query(collection(db, "users"), where("username", "==", data.username));
      const snap = await getDocs(q);
      if (!snap.empty) return { success: false, error: "Username taken." };

      let user: FirebaseUser;
      if (auth.currentUser) user = auth.currentUser;
      else if (data.password) {
        const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
        user = cred.user;
      } else return { success: false, error: "Auth error." };

      const newUser: AppUser = {
        id: user.uid,
        username: data.username,
        name: data.name,
        email: user.email!,
        role: data.role,
        facultyId: data.username,
        collegeName: data.collegeName,
        country: data.country,
        state: data.state,
        district: data.district,
        isIdVerified: true,
        following: [],
        followers: [],
        facultyConnections: []
      };

      await setDoc(doc(db, "users", user.uid), newUser);
      setUserMetadata(prev => [...prev, newUser]);

      if (data.password) {
        await sendEmailVerification(user);
        await signOut(auth);
      }
      
      return { success: true, email: user.email! };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const docRef = doc(db, "users", res.user.uid);
      const snap = await getDoc(docRef);
      return snap.exists() ? {} : { isNewUser: true, googleUser: res.user };
    } catch (e) { return { error: "Google Auth Failed" }; }
  };

  // --- Handlers (Content) ---
  const handleGenerateMcqs = useCallback(async (formData: Omit<FormState, 'aiProvider'>) => {
    if (!currentUser) return;
    setView('generator'); setError(null); setMcqs([]);
    try {
      const res = await generateMcqs(formData);
      setMcqs(res);
      setAllGeneratedMcqs(prev => [...prev, { id: `set-${Date.now()}`, facultyId: currentUser.id, timestamp: new Date(), mcqs: res }]);
      setView('results');
    } catch (e: any) { setError(e.message); setView('results'); }
  }, [currentUser]);

  const handlePublishTest = async (id: string, title: string, duration: number, end: string|null, mode: any, fields: any) => {
     if (!currentUser) return;
     const set = allGeneratedMcqs.find(s => s.id === id);
     if (!set) return;
     const newTest: Test = { 
        id: doc(collection(db, "tests")).id, 
        facultyId: currentUser.id, 
        title, 
        durationMinutes: duration, 
        questions: set.mcqs, 
        endDate: end, 
        studentFieldsMode: mode, 
        customStudentFields: fields, 
        disqualifiedStudents: [] 
     };
     await setDoc(doc(db, "tests", newTest.id), newTest);
     
     // Notify Followers
     if (currentUser.followers && currentUser.followers.length > 0) {
        const q = query(collection(db, "users"), where("following", "array-contains", currentUser.id));
        const snap = await getDocs(q);
        const batch = snap.docs.map(d => {
            const student = d.data() as AppUser;
            const ref = doc(collection(db, "notifications"));
            return setDoc(ref, {
                id: ref.id,
                studentId: student.id,
                studentEmail: student.email,
                facultyId: currentUser.id,
                facultyName: currentUser.name,
                test: newTest,
                status: 'new'
            });
        });
        await Promise.all(batch);
     }
     setView('dashboard');
  };

  const handleRevokeTest = async (testId: string) => {
    if (!confirm("Delete this test?")) return;
    try {
        await deleteDoc(doc(db, "tests", testId));
        const q = query(collection(db, "notifications"), where("test.id", "==", testId));
        const snap = await getDocs(q);
        await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
    } catch (e) { console.error(e); }
  };

  // --- Handlers (Social) ---
  const handleSendFollowRequest = async (targetUsername: string) => {
    if (!currentUser) return;
    try {
        const q = query(collection(db, "users"), where("username", "==", targetUsername));
        const snap = await getDocs(q);
        if (snap.empty) { alert("User not found."); return; }
        const targetUser = snap.docs[0].data() as AppUser;
        if (targetUser.id === currentUser.id) { alert("Cannot follow self."); return; }

        const qReq = query(collection(db, "followRequests"), where("studentId", "==", currentUser.id), where("facultyId", "==", targetUser.id));
        const snapReq = await getDocs(qReq);
        if (!snapReq.empty) { alert("Request pending or already following."); return; }

        const ref = doc(collection(db, "followRequests"));
        await setDoc(ref, {
            id: ref.id,
            studentId: currentUser.id,
            studentEmail: currentUser.email,
            facultyId: targetUser.id,
            status: 'pending'
        });
        alert(`Request sent to @${targetUsername}`);
    } catch (e) { console.error(e); }
  };

  const handleFollowRequestResponse = async (rid: string, status: 'accepted'|'rejected') => {
    try {
        const ref = doc(db, "followRequests", rid);
        await updateDoc(ref, { status });
        if (status === 'accepted') {
            const snap = await getDoc(ref);
            const data = snap.data() as FollowRequest;
            await updateDoc(doc(db, "users", data.studentId), { following: arrayUnion(data.facultyId) });
            await updateDoc(doc(db, "users", data.facultyId), { followers: arrayUnion(data.studentId) });
        }
    } catch (e) { console.error(e); }
  };

  const handleAcceptConnection = async (rid: string) => {
      const req = connectionRequests.find(r => r.id === rid);
      if (!req) return;
      await updateDoc(doc(db, "connectionRequests", rid), { status: 'accepted' });
      await updateDoc(doc(db, "users", req.fromFacultyId), { facultyConnections: arrayUnion(req.toFacultyId) });
      await updateDoc(doc(db, "users", req.toFacultyId), { facultyConnections: arrayUnion(req.fromFacultyId) });
  };

  const handleRejectConnection = async (rid: string) => {
      await updateDoc(doc(db, "connectionRequests", rid), { status: 'rejected' });
  };

  // --- Navigation & Helper ---
  const handleNavigate = (target: View) => {
      setError(null);
      setIsLoading(true);
      setTimeout(() => { setView(target); setIsLoading(false); }, 200);

      // Data refresh based on target view
      if (target === 'network' && currentUser) {
         if (currentUser.following.length > 0) {
             getDocs(query(collection(db, "users"), where("id", "in", currentUser.following)))
                .then(s => setFollowingList(s.docs.map(d => d.data() as AppUser)));
         }
         if (currentUser.followers && currentUser.followers.length > 0) {
            getDocs(query(collection(db, "users"), where("id", "in", currentUser.followers)))
                .then(s => setFollowers(s.docs.map(d => d.data() as AppUser)));
          }
      }
  };

  const handleStartTest = async (test: Test, notificationId: string) => {
    if (test.disqualifiedStudents?.includes(currentUser?.id || '')) {
        alert("You are disqualified from this test.");
        return;
    }
    await deleteDoc(doc(db, "notifications", notificationId));
    setActiveTest(test);
    setView('studentLogin');
  };

  const handleTestFinish = async (answers: (string|null)[], violations: number) => {
      if (!activeTest || !currentUser || !studentInfo) return;
      const score = activeTest.questions.reduce((acc, q, i) => q.answer === answers[i] ? acc + 1 : acc, 0);
      const attempt: TestAttempt = {
          id: doc(collection(db, "testAttempts")).id,
          testId: activeTest.id,
          studentId: currentUser.id,
          testTitle: activeTest.title,
          student: studentInfo,
          score,
          totalQuestions: activeTest.questions.length,
          answers,
          date: new Date(),
          violations
      };
      await setDoc(doc(db, "testAttempts", attempt.id), attempt);
      setTestHistory(prev => [...prev, attempt]);
      
      if (violations >= 3) {
          await updateDoc(doc(db, "tests", activeTest.id), { disqualifiedStudents: arrayUnion(currentUser.id) });
          await setDoc(doc(collection(db, "violationAlerts")), {
              id: doc(collection(db, "violationAlerts")).id,
              studentId: currentUser.id,
              studentEmail: currentUser.email,
              facultyId: activeTest.facultyId,
              testId: activeTest.id,
              testTitle: activeTest.title,
              timestamp: new Date().toISOString(),
              status: 'pending'
          });
      }
      setLatestTestResult(attempt);
      setActiveTest(null);
      setStudentInfo(null);
      setView('testResults');
  };

  // --- Render ---
  const renderContent = () => {
    if (isLoading) return <div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>;
    
    // Auth Views
    if (view === 'emailVerification') return <EmailVerification email={verificationEmail} onLoginNavigate={() => setView('auth')} />;
    if (!currentUser) return <AuthPortal onLogin={handleLogin} onRegister={handleRegister} onGoogleSignIn={handleGoogleSignIn} onRegistrationSuccess={(e) => { setVerificationEmail(e); setView('emailVerification'); }} />;

    // Main Routes
    switch (view) {
      case 'studentPortal': // Legacy Redirect
      case 'facultyPortal': // Legacy Redirect
      case 'dashboard':
        return <Dashboard 
            user={currentUser} 
            publishedTests={publishedTests} 
            generatedSets={userGeneratedSets}
            testAttempts={testAttempts}
            followersCount={currentUser.followers?.length || 0}
            followingCount={currentUser.following.length}
            onNavigate={handleNavigate}
        />;

      case 'content':
        return <ContentLibrary
            generatedSets={userGeneratedSets}
            publishedTests={publishedTests}
            onPublishTest={handlePublishTest}
            onRevokeTest={handleRevokeTest}
            onViewTestAnalytics={(t) => { setAnalyticsTest(t); setView('testAnalytics'); }}
        />;

      case 'network':
        return <NetworkCenter
            followRequests={followRequests}
            connectionRequests={connectionRequests}
            followers={followers}
            following={followingList}
            onSendFollowRequest={handleSendFollowRequest}
            onFollowRequestResponse={handleFollowRequestResponse}
            onAcceptConnection={handleAcceptConnection}
            onRejectConnection={handleRejectConnection}
        />;

      case 'integrity':
        return <IntegrityCenter
            violationAlerts={violationAlerts}
            ignoredNotifications={ignoredByStudents}
            onGrantReattempt={async (aid) => { /* logic */ }}
        />;

      case 'profile': return <ProfilePage user={currentUser} onLogout={() => { signOut(auth); setView('auth'); }} onBack={() => handleNavigate('dashboard')} />;
      case 'generator': return <McqGeneratorForm onGenerate={handleGenerateMcqs} isLoading={false} />;
      case 'results': return <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><McqGeneratorForm onGenerate={handleGenerateMcqs} isLoading={false} /><div className="bg-white p-6 rounded-lg shadow">{error ? <ErrorMessage message={error} /> : <McqList mcqs={mcqs} />}</div></div>;
      case 'manualCreator': return <ManualMcqCreator onSaveSet={(mcqs) => { /* save logic */ }} onExportPDF={()=>{}} onExportWord={()=>{}} />;
      case 'test': return (activeTest && studentInfo) ? <TestPage test={activeTest} student={studentInfo} onFinish={handleTestFinish} /> : <ErrorMessage message="Invalid Test" />;
      case 'studentLogin': return activeTest ? <StudentLogin test={activeTest} onLogin={(info) => { setStudentInfo(info); setView('test'); }} /> : <ErrorMessage message="No active test" />;
      case 'testResults': return latestTestResult ? <TestResults result={latestTestResult} onNavigate={handleNavigate} /> : <ErrorMessage message="Result not found" />;
      
      // Sub-views
      case 'notifications': return <Notifications notifications={notifications} onStartTest={handleStartTest} onIgnoreTest={async (nid) => { await updateDoc(doc(db, "notifications", nid), { status: 'ignored' }); }} onBack={() => handleNavigate('dashboard')} />;
      case 'testHistory': return <TestHistory history={studentTestHistory} onNavigateBack={() => handleNavigate('dashboard')} />;
      case 'testAnalytics': return analyticsTest ? <TestAnalytics test={analyticsTest} attempts={testAttempts} onBack={() => handleNavigate('content')} /> : <ErrorMessage message="Select a test" />;
      
      default: return <div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      {['auth', 'emailVerification', 'test', 'studentLogin'].includes(view) ? renderContent() : (
        <>
          <Header user={currentUser} activeView={view} onNavigate={handleNavigate} onLogout={() => { signOut(auth); setView('auth'); }} />
          <main className="container mx-auto p-4 md:p-8 animate-in fade-in duration-300">
            {renderContent()}
          </main>
        </>
      )}
    </div>
  );
};

export default App;