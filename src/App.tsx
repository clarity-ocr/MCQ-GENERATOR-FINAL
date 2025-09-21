import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { db, auth } from './services/firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, arrayUnion, onSnapshot, deleteDoc, arrayRemove } from "firebase/firestore"; 
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import type firebase from 'firebase/compat/app';
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
import { FollowingPage } from './components/FollowingPage';
import { ProfilePage } from './components/ProfilePage';
import { FollowersPage } from './components/FollowersPage';
import { ConnectPage } from './components/ConnectPage';
import { EmailVerification } from './components/EmailVerification';
import { Role } from './types';
import type { FormState, MCQ, Test, GeneratedMcqSet, Student, TestAttempt, FollowRequest, AppNotification, AppUser, CustomFormField, ViolationAlert, ConnectionRequest } from './types';
import { generateMcqs } from './services/geminiService';

declare const jspdf: any;
declare const docx: any;
type View = 'auth' | 'idVerification' | 'generator' | 'results' | 'studentPortal' | 'studentLogin' | 'test' | 'facultyPortal' | 'testResults' | 'testHistory' | 'manualCreator' | 'notifications' | 'testAnalytics' | 'following' | 'profile' | 'followers' | 'connect' | 'emailVerification';

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
  const [userMetadata, setUserMetadata] = useState<AppUser[]>(() => getInitialState('userMetadata', []));
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [allGeneratedMcqs, setAllGeneratedMcqs] = useState<GeneratedMcqSet[]>(() => getInitialState('allGeneratedMcqs', []));
  const [publishedTests, setPublishedTests] = useState<Test[]>([]);
  const [testHistory, setTestHistory] = useState<TestAttempt[]>(() => getInitialState('testHistory', []));
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [ignoredByStudents, setIgnoredByStudents] = useState<AppNotification[]>([]);
  const [violationAlerts, setViolationAlerts] = useState<ViolationAlert[]>([]);
  const [followingList, setFollowingList] = useState<AppUser[]>([]);
  const [followers, setFollowers] = useState<AppUser[]>([]);
  const [connectedFaculty, setConnectedFaculty] = useState<AppUser[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [analyticsTest, setAnalyticsTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('auth');
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  const [latestTestResult, setLatestTestResult] = useState<TestAttempt | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<firebase.User | null>(null);

  useEffect(() => { localStorage.setItem('userMetadata', JSON.stringify(userMetadata)); }, [userMetadata]);
  useEffect(() => { localStorage.setItem('allGeneratedMcqs', JSON.stringify(allGeneratedMcqs)); }, [allGeneratedMcqs]);
  useEffect(() => { localStorage.setItem('testHistory', JSON.stringify(testHistory)); }, [testHistory]);
  
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
        else if (view === 'auth' || view === 'idVerification' || view === 'emailVerification') setView(metadata.role === Role.Faculty ? 'facultyPortal' : 'studentPortal');
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
    } else if (view !== 'emailVerification') { 
        setCurrentUser(null); 
        setView('auth'); 
    }
  }, [firebaseUser, isLoading, userMetadata, view]);
  
  useEffect(() => {
    if (!currentUser) { setFollowRequests([]); setNotifications([]); setPublishedTests([]); setIgnoredByStudents([]); setTestAttempts([]); setViolationAlerts([]); setFollowers([]); setConnectedFaculty([]); setConnectionRequests([]); return; }
    let unsubscribes: (() => void)[] = [];
    const onError = (err: Error) => { console.error("Firestore listener error:", err); };
    if (currentUser.role === Role.Faculty) {
      unsubscribes.push(onSnapshot(query(collection(db, "tests"), where("facultyId", "==", currentUser.id)), snapshot => setPublishedTests(snapshot.docs.map(doc => doc.data() as Test)), onError));
      unsubscribes.push(onSnapshot(query(collection(db, "followRequests"), where("facultyId", "==", currentUser.id), where("status", "==", "pending")), snapshot => setFollowRequests(snapshot.docs.map(doc => doc.data() as FollowRequest)), onError));
      unsubscribes.push(onSnapshot(query(collection(db, "notifications"), where("facultyId", "==", currentUser.id), where("status", "==", "ignored")), snapshot => setIgnoredByStudents(snapshot.docs.map(doc => doc.data() as AppNotification)), onError));
      unsubscribes.push(onSnapshot(query(collection(db, "violationAlerts"), where("facultyId", "==", currentUser.id), where("status", "==", "pending")), snapshot => setViolationAlerts(snapshot.docs.map(doc => doc.data() as ViolationAlert)), onError));
      unsubscribes.push(onSnapshot(query(collection(db, "connectionRequests"), where("toFacultyId", "==", currentUser.id), where("status", "==", "pending")), snapshot => { setConnectionRequests(snapshot.docs.map(doc => doc.data() as ConnectionRequest)); }, onError));
    }
    return () => unsubscribes.forEach(unsub => unsub());
  }, [currentUser]);

  const userGeneratedSets = useMemo(() => allGeneratedMcqs.filter(s => s.facultyId === currentUser?.id), [allGeneratedMcqs, currentUser]);
  const userPublishedTests = useMemo(() => publishedTests, [publishedTests]);
  const userFollowRequests = useMemo(() => followRequests, [followRequests]);
  const studentTestHistory = useMemo(() => testHistory.filter(h => h.studentId === currentUser?.id), [testHistory, currentUser]);

  const handleLogin = async (email: string, pass: string): Promise<string | null> => {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, pass);
      if (!userCredential.user?.emailVerified) { await auth.signOut(); return "Please verify your email."; }
      return null;
    } catch (error: any) { return "Invalid email or password."; }
  };

  const handleRegister = async (name: string, email: string, pass: string, role: Role, collegeName: string, country: string, state: string, district: string): Promise<{ success: boolean; error?: string; email?: string }> => {
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
      const newUser: AppUser = { id: user.uid, name, email, role, facultyId, collegeName, country, state, district, isIdVerified: false, following: [], facultyConnections: [] };
      await setDoc(doc(db, "users", user.uid), newUser);
      setUserMetadata(prev => [...prev, newUser]);
      await user.sendEmailVerification();
      await auth.signOut();
      return { success: true, email: user.email! };
    } catch (error: any) { 
      const message = error.code === 'auth/email-already-in-use' ? "This email is already registered." : "Registration failed.";
      return { success: false, error: message };
    }
  };

  const handleGoogleSignIn = async (): Promise<{ error?: string }> => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = await getDocs(query(collection(db, "users"), where("id", "==", user.uid)));
      if (userDoc.empty) {
        const newUser: AppUser = { 
          id: user.uid, name: user.displayName || 'New User', email: user.email!, 
          role: Role.Student, collegeName: 'N/A', country: 'N/A', state: 'N/A', district: 'N/A', 
          facultyId: '', isIdVerified: true, following: [], facultyConnections: [] 
        };
        await setDoc(doc(db, "users", user.uid), newUser);
        setUserMetadata(prev => [...prev, newUser]);
      }
      return {};
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      return { error: "Failed to sign in with Google. Please try again." };
    }
  };
  
  const handleCompleteIdVerification = () => { if(!currentUser) return; setUserMetadata(prev => prev.map(u => u.id === currentUser.id ? { ...u, isIdVerified: true } : u)); };
  const handleLogout = () => { auth.signOut(); setView('auth'); };
  
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

  const handleStartTest = async (test: Test, notificationId: string) => {
    if (!currentUser) return;
    if (test.disqualifiedStudents?.includes(currentUser.id)) {
        alert("You have been disqualified from re-taking this test due to excessive violations. Please contact your faculty member for permission.");
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
        await updateDoc(doc(db, "notifications", notificationId), { status: 'ignored', actionTimestamp: new Date().toISOString() });
    } catch (error) { console.error("Error ignoring notification:", error); }
  };

  const handleLoginAndStart = (student: Student) => {
    if (activeTest && currentUser) { setStudentInfo(student); setView('test'); }
  };

  const handleTestFinish = async (finalAnswers: (string | null)[], violations: number) => {
    if (!activeTest || !studentInfo || !currentUser) return;
    const score = activeTest.questions.reduce((acc, q, index) => q.answer === finalAnswers[index] ? acc + 1 : acc, 0);
    const attemptRef = doc(collection(db, "testAttempts"));
    const attempt: TestAttempt = { id: attemptRef.id, testId: activeTest.id, studentId: currentUser.id, testTitle: activeTest.title, student: studentInfo, score, totalQuestions: activeTest.questions.length, answers: finalAnswers, date: new Date(), violations };
    await setDoc(attemptRef, attempt);
    if (violations >= 3) {
      const testRef = doc(db, "tests", activeTest.id);
      await updateDoc(testRef, { disqualifiedStudents: arrayUnion(currentUser.id) });
      const alertRef = doc(collection(db, "violationAlerts"));
      const newAlert: ViolationAlert = { id: alertRef.id, studentId: currentUser.id, studentEmail: currentUser.email, facultyId: activeTest.facultyId, testId: activeTest.id, testTitle: activeTest.title, timestamp: new Date().toISOString(), status: 'pending' };
      await setDoc(alertRef, newAlert);
    }
    setLatestTestResult(attempt);
    setActiveTest(null); 
    setStudentInfo(null);
    setView('testResults');
  };

  const handleGrantReattempt = async (alertId: string) => {
    const alert = violationAlerts.find(a => a.id === alertId);
    if (!alert || !currentUser) return;
    try {
        const testDoc = await getDocs(query(collection(db, "tests"), where("id", "==", alert.testId)));
        if (testDoc.empty) { alert("Original test not found."); return; }
        const testData = testDoc.docs[0].data() as Test;
        const testRef = doc(db, "tests", alert.testId);
        await updateDoc(testRef, { disqualifiedStudents: testData.disqualifiedStudents?.filter(id => id !== alert.studentId) || [] });
        const newNotifRef = doc(collection(db, "notifications"));
        const newNotification: AppNotification = { id: newNotifRef.id, studentId: alert.studentId, studentEmail: alert.studentEmail, facultyId: currentUser.id, facultyName: currentUser.name, test: testData, status: 'new' };
        await setDoc(newNotifRef, newNotification);
        await updateDoc(doc(db, "violationAlerts", alertId), { status: 'resolved' });
        alert(`Permission granted. ${alert.studentEmail} will be notified.`);
    } catch (error) { console.error("Error granting re-attempt:", error); alert("An error occurred."); }
  };
  
  const handleSendFollowRequest = async (facultyIdToFind: string) => {
    if (!currentUser) { alert("You must be logged in."); return; }
    try {
      const q = query(collection(db, "users"), where("facultyId", "==", facultyIdToFind), where("role", "==", Role.Faculty));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) { alert("Faculty ID not found."); return; }
      const faculty = querySnapshot.docs[0].data() as AppUser;
      const requestsRef = collection(db, "followRequests");
      const existingReqQuery = query(requestsRef, where("studentId", "==", currentUser.id), where("facultyId", "==", faculty.id));
      const existingReqSnapshot = await getDocs(existingReqQuery);

      if (existingReqSnapshot.empty) {
        const newRequestRef = doc(requestsRef);
        const newRequest: FollowRequest = { id: newRequestRef.id, studentId: currentUser.id, studentEmail: currentUser.email, facultyId: faculty.id, status: 'pending' };
        await setDoc(newRequestRef, newRequest);
      } else {
        const existingRequestDoc = existingReqSnapshot.docs[0];
        if (existingRequestDoc.data().status === 'pending') {
          alert("You have already sent a follow request to this faculty member.");
          return;
        }
        await updateDoc(doc(db, "followRequests", existingRequestDoc.id), { status: 'pending' });
      }
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

  const handleUnfollow = async (facultyId: string) => {
    if (!currentUser || !window.confirm("Are you sure you want to unfollow this faculty member?")) return;
    try {
        const studentRef = doc(db, "users", currentUser.id);
        await updateDoc(studentRef, { following: arrayRemove(facultyId) });
        const updatedUser = { ...currentUser, following: currentUser.following.filter(id => id !== facultyId) };
        setCurrentUser(updatedUser);
        setUserMetadata(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
        setFollowingList(prev => prev.filter(f => f.id !== facultyId));
        alert("You have unfollowed the faculty member.");
    } catch (error) {
        console.error("Error unfollowing faculty:", error);
        alert("An error occurred while trying to unfollow.");
    }
  };

  const handleSendConnectionRequest = async (facultyId: string) => {
    if (!currentUser) return;
    try {
        const q = query(collection(db, "users"), where("facultyId", "==", facultyId), where("role", "==", Role.Faculty));
        const snapshot = await getDocs(q);
        if (snapshot.empty) { alert("Faculty ID not found."); return; }
        const toFaculty = snapshot.docs[0].data() as AppUser;
        if (toFaculty.id === currentUser.id) { alert("You cannot connect with yourself."); return; }
        const newRequestRef = doc(collection(db, "connectionRequests"));
        const newRequest: ConnectionRequest = { id: newRequestRef.id, fromFacultyId: currentUser.id, fromFacultyName: currentUser.name, fromFacultyCollege: currentUser.collegeName, toFacultyId: toFaculty.id, status: 'pending' };
        await setDoc(newRequestRef, newRequest);
        alert("Connection request sent.");
    } catch (error) { console.error("Error sending connection request:", error); }
  };
  
  const handleAcceptConnection = async (requestId: string) => {
    const request = connectionRequests.find(r => r.id === requestId);
    if (!request || !currentUser) return;
    try {
        await updateDoc(doc(db, "connectionRequests", requestId), { status: 'accepted' });
        await updateDoc(doc(db, "users", request.fromFacultyId), { facultyConnections: arrayUnion(request.toFacultyId) });
        await updateDoc(doc(db, "users", request.toFacultyId), { facultyConnections: arrayUnion(request.fromFacultyId) });
        const updatedUser = { ...currentUser, facultyConnections: [...(currentUser.facultyConnections || []), request.fromFacultyId]};
        setCurrentUser(updatedUser);
        setUserMetadata(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    } catch (error) { console.error("Error accepting connection:", error); }
  };
  
  const handleRejectConnection = async (requestId: string) => {
    try {
        await updateDoc(doc(db, "connectionRequests", requestId), { status: 'rejected' });
    } catch (error) { console.error("Error rejecting connection:", error); }
  };
  
  const handleNavigate = async (targetView: View) => {
    setAnalyticsTest(null); setIsLoading(true);
    try {
        if (targetView === 'notifications' && currentUser?.role === Role.Student) {
            const now = new Date().toISOString();
            const q = query(collection(db, "notifications"), where("studentId", "==", currentUser.id), where("status", "==", "new"));
            const snapshot = await getDocs(q);
            const validNotifications = snapshot.docs.map(doc => doc.data() as AppNotification).filter(n => !n.test.endDate || n.test.endDate >= now);
            setNotifications(validNotifications);
        }
        if (targetView === 'following' && currentUser?.role === Role.Student) {
            const userDocSnap = await getDocs(query(collection(db, "users"), where("id", "==", currentUser.id)));
            if (!userDocSnap.empty) {
                const latestUserData = userDocSnap.docs[0].data() as AppUser;
                setCurrentUser(latestUserData);
                if (latestUserData.following && latestUserData.following.length > 0) {
                    const facultyQuery = query(collection(db, "users"), where("id", "in", latestUserData.following));
                    const snapshot = await getDocs(facultyQuery);
                    setFollowingList(snapshot.docs.map(doc => doc.data() as AppUser));
                } else { setFollowingList([]); }
            }
        }
        if (targetView === 'followers' && currentUser?.role === Role.Faculty) {
            const followersQuery = query(collection(db, "users"), where("following", "array-contains", currentUser.id));
            const snapshot = await getDocs(followersQuery);
            setFollowers(snapshot.docs.map(doc => doc.data() as AppUser));
        }
        if (targetView === 'connect' && currentUser?.role === Role.Faculty) {
            if (currentUser.facultyConnections && currentUser.facultyConnections.length > 0) {
                const connectionsQuery = query(collection(db, "users"), where("id", "in", currentUser.facultyConnections));
                const snapshot = await getDocs(connectionsQuery);
                setConnectedFaculty(snapshot.docs.map(doc => doc.data() as AppUser));
            } else { setConnectedFaculty([]); }
        }
    } catch (error) {
        console.error("Failed to fetch data for navigation:", error);
        alert("Could not load page data. Please try again.");
    } finally {
        setIsLoading(false);
    }
    setView(targetView);
  };
  
  const handleViewTestAnalytics = async (test: Test) => {
    try {
        setIsLoading(true);
        const q = query(collection(db, "testAttempts"), where("testId", "==", test.id));
        const snapshot = await getDocs(q);
        setTestAttempts(snapshot.docs.map(doc => doc.data() as TestAttempt));
        setAnalyticsTest(test);
        setView('testAnalytics');
    } catch (error) {
        console.error("Failed to fetch test attempts:", error);
        alert("Could not load test analytics. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };
  
  const renderContent = () => {
    if (isLoading) return <div className="mt-20"><LoadingSpinner /></div>;
    if (view === 'emailVerification') {
      return <EmailVerification email={verificationEmail} onLoginNavigate={() => setView('auth')} />;
    }
    if (!currentUser) return <AuthPortal onLogin={handleLogin} onRegister={handleRegister} onGoogleSignIn={handleGoogleSignIn} onRegistrationSuccess={(email) => { setVerificationEmail(email); setView('emailVerification'); }} />;
    if (currentUser.role === Role.Faculty && !currentUser.isIdVerified) return <IdVerification onVerified={handleCompleteIdVerification} />;
    
    switch (view) {
      case 'profile':
        const goBackView = currentUser.role === Role.Faculty ? 'facultyPortal' : 'studentPortal';
        return <ProfilePage user={currentUser} onLogout={handleLogout} onBack={() => handleNavigate(goBackView)} />;
      case 'facultyPortal': return <FacultyPortal faculty={currentUser} generatedSets={userGeneratedSets} publishedTests={userPublishedTests} followRequests={followRequests} connectionRequests={connectionRequests} ignoredNotifications={ignoredByStudents} violationAlerts={violationAlerts} onPublishTest={handlePublishTest} onRevokeTest={handleRevokeTest} onFollowRequestResponse={handleFollowRequestResponse} onViewTestAnalytics={handleViewTestAnalytics} onGrantReattempt={handleGrantReattempt} onViewFollowers={() => handleNavigate('followers')} onNavigateToConnect={() => handleNavigate('connect')} onAcceptConnection={handleAcceptConnection} onRejectConnection={handleRejectConnection} />;
      case 'studentPortal': return <StudentPortal onNavigateToHistory={() => handleNavigate('testHistory')} onNavigateToNotifications={() => handleNavigate('notifications')} onNavigateToFollowing={() => handleNavigate('following')} onSendFollowRequest={handleSendFollowRequest} />;
      case 'following': return <FollowingPage followingList={followingList} onUnfollow={handleUnfollow} onBack={() => handleNavigate('studentPortal')} />;
      case 'followers': return <FollowersPage followers={followers} onBack={() => handleNavigate('facultyPortal')} />;
      case 'connect': return <ConnectPage currentUser={currentUser} connectedFaculty={connectedFaculty} connectionRequests={connectionRequests} onSendConnectionRequest={handleSendConnectionRequest} onAcceptConnection={handleAcceptConnection} onRejectConnection={handleRejectConnection} onBack={() => handleNavigate('facultyPortal')} />;
      case 'notifications': return <Notifications notifications={notifications} onStartTest={handleStartTest} onIgnoreTest={handleIgnoreTest} onBack={() => handleNavigate('studentPortal')} />;
      case 'testAnalytics': return analyticsTest ? <TestAnalytics test={analyticsTest} attempts={testAttempts} onBack={() => handleNavigate('facultyPortal')} /> : <ErrorMessage message="No test selected for analytics." />;
      case 'generator': return <McqGeneratorForm onGenerate={handleGenerateMcqs} isLoading={false} />;
      case 'results': return <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"><McqGeneratorForm onGenerate={handleGenerateMcqs} isLoading={false} /><div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg min-h-[400px] flex flex-col justify-center">{error ? <ErrorMessage message={error} /> : <McqList mcqs={mcqs} />}</div></div>;
      case 'manualCreator': return <ManualMcqCreator onSaveSet={handleSaveManualSet} onExportPDF={() => {}} onExportWord={() => {}} />;
      case 'studentLogin': return activeTest ? <StudentLogin test={activeTest} onLogin={handleLoginAndStart} /> : <ErrorMessage message="No active test selected." />;
      case 'test': return (activeTest && studentInfo) ? <TestPage test={activeTest} student={studentInfo} onFinish={handleTestFinish} /> : <ErrorMessage message="Test session is invalid." />;
      case 'testResults': return latestTestResult ? <TestResults result={latestTestResult} onNavigate={handleNavigate} /> : <ErrorMessage message="Could not find your test result." />;
      case 'testHistory': return <TestHistory history={studentTestHistory} onNavigateBack={() => handleNavigate('studentPortal')} />;
      default:
        const defaultView = currentUser.role === Role.Faculty ? 'facultyPortal' : 'studentPortal';
        setView(defaultView);
        return <div className="mt-20"><LoadingSpinner /></div>;
    }
  };

  return (
    view === 'test' ? (
        renderContent()
    ) : (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
          <Header user={currentUser} activeView={view} onNavigate={handleNavigate} onLogout={handleLogout} />
          <main className="container mx-auto p-4 md:p-8">
            {renderContent()}
          </main>
        </div>
    )
  );
};

export default App;