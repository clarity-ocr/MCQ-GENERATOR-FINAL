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
  arrayRemove
} from "firebase/firestore";
import {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';

// Import components
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

// Import types and services
import { Role } from './types';
import type {
  FormState,
  MCQ,
  Test,
  GeneratedMcqSet,
  Student,
  TestAttempt,
  FollowRequest,
  AppNotification,
  AppUser,
  CustomFormField,
  ViolationAlert,
  ConnectionRequest,
  ChatMessage
} from './types';
import { generateMcqs } from './services/geminiService';

// Type declarations for global variables
declare global {
  interface Window {
    jspdf: any;
    docx: any;
  }
}

// Type definitions for views
type View = 'auth' | 'idVerification' | 'generator' | 'results' | 'studentPortal' |
           'studentLogin' | 'test' | 'facultyPortal' | 'testResults' | 'testHistory' |
           'manualCreator' | 'notifications' | 'testAnalytics' | 'following' | 'profile' |
           'followers' | 'connect' | 'emailVerification';

// Utility function for localStorage with error handling
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

// Main App Component
const App: React.FC = () => {
  // State Management
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Effects for localStorage persistence
  useEffect(() => {
    try {
      localStorage.setItem('userMetadata', JSON.stringify(userMetadata));
    } catch (e) { console.error(e); }
  }, [userMetadata]);

  useEffect(() => {
    try {
      localStorage.setItem('allGeneratedMcqs', JSON.stringify(allGeneratedMcqs));
    } catch (e) { console.error(e); }
  }, [allGeneratedMcqs]);

  useEffect(() => {
    try {
      localStorage.setItem('testHistory', JSON.stringify(testHistory));
    } catch (e) { console.error(e); }
  }, [testHistory]);

  // Firebase authentication state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // User authentication and role-based routing
  useEffect(() => {
    if (isLoading) return;

    if (firebaseUser && firebaseUser.emailVerified) {
      const metadata = userMetadata.find(u => u.id === firebaseUser.uid);
      if (metadata) {
        setCurrentUser(metadata);
        if (metadata.role === Role.Faculty && !metadata.isIdVerified) {
          setView('idVerification');
        } else if (['auth', 'idVerification', 'emailVerification'].includes(view)) {
          setView(metadata.role === Role.Faculty ? 'facultyPortal' : 'studentPortal');
        }
      } else {
        const fetchUserDoc = async () => {
          try {
            const userDocSnap = await getDocs(query(collection(db, "users"), where("id", "==", firebaseUser.uid)));
            if (!userDocSnap.empty) {
              const userData = userDocSnap.docs[0].data() as AppUser;
              setUserMetadata(prev => [...prev.filter(u => u.id !== userData.id), userData]);
              setCurrentUser(userData);
            } else {
              await signOut(auth);
            }
          } catch (err) {
            console.error('Error fetching user document:', err);
            await signOut(auth);
          }
        };
        fetchUserDoc();
      }
    } else if (view !== 'emailVerification') {
      setCurrentUser(null);
      setView('auth');
    }
  }, [firebaseUser, isLoading, userMetadata, view]);

  // Firestore listeners for real-time data
  useEffect(() => {
    if (!currentUser) return;
    
    const unsubscribes: (() => void)[] = [];
    const onError = (err: Error) => console.error("Firestore listener error:", err);

    if (currentUser.role === Role.Faculty) {
      unsubscribes.push(onSnapshot(query(collection(db, "tests"), where("facultyId", "==", currentUser.id)), snapshot => setPublishedTests(snapshot.docs.map(doc => doc.data() as Test)), onError));
      unsubscribes.push(onSnapshot(query(collection(db, "followRequests"), where("facultyId", "==", currentUser.id), where("status", "==", "pending")), snapshot => setFollowRequests(snapshot.docs.map(doc => doc.data() as FollowRequest)), onError));
      unsubscribes.push(onSnapshot(query(collection(db, "notifications"), where("facultyId", "==", currentUser.id), where("status", "==", "ignored")), snapshot => setIgnoredByStudents(snapshot.docs.map(doc => doc.data() as AppNotification)), onError));
      unsubscribes.push(onSnapshot(query(collection(db, "violationAlerts"), where("facultyId", "==", currentUser.id), where("status", "==", "pending")), snapshot => setViolationAlerts(snapshot.docs.map(doc => doc.data() as ViolationAlert)), onError));
      unsubscribes.push(onSnapshot(query(collection(db, "connectionRequests"), where("toFacultyId", "==", currentUser.id), where("status", "==", "pending")), snapshot => setConnectionRequests(snapshot.docs.map(doc => doc.data() as ConnectionRequest)), onError));
    }

    return () => unsubscribes.forEach(unsub => unsub());
  }, [currentUser]);

  // Memoized selectors
  const userGeneratedSets = useMemo(() => allGeneratedMcqs.filter(s => s.facultyId === currentUser?.id), [allGeneratedMcqs, currentUser]);
  const userPublishedTests = useMemo(() => publishedTests, [publishedTests]);
  const userFollowRequests = useMemo(() => followRequests, [followRequests]);
  const studentTestHistory = useMemo(() => testHistory.filter(h => h.studentId === currentUser?.id), [testHistory, currentUser]);

  // Authentication handlers
  const handleLogin = async (email: string, password: string): Promise<string | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user?.emailVerified) {
        await signOut(auth);
        return "Please verify your email before logging in.";
      }
      return null;
    } catch (error: any) {
      console.error('Login error:', error);
      return error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found'
        ? "Invalid email or password. Please try again."
        : "Login failed. Please try again.";
    }
  };

  const handleRegister = async (name: string, email: string, password: string, role: Role, collegeName: string, country: string, state: string, district: string): Promise<{ success: boolean; error?: string; email?: string }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (!user) {
        throw new Error("User creation failed unexpectedly.");
      }

      let facultyId = '';
      if (role === Role.Faculty) {
        const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '');
        const facultySnapshot = await getDocs(query(collection(db, "users"), where("role", "==", Role.Faculty)));
        facultyId = `${sanitizedName}-faculty${101 + facultySnapshot.size}`;
      }

      const newUser: AppUser = { id: user.uid, name, email, role, facultyId, collegeName, country, state, district, isIdVerified: false, following: [], facultyConnections: [] };
      await setDoc(doc(db, "users", user.uid), newUser);
      setUserMetadata(prev => [...prev, newUser]);
      await sendEmailVerification(user);
      await signOut(auth);
      
      return { success: true, email: user.email! };
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error.code === 'auth/email-already-in-use' 
        ? "This email is already registered."
        : error.code === 'auth/weak-password'
        ? "Password is too weak. Please use a stronger password."
        : "Registration failed. Please try again.";
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
        const newUser: AppUser = { id: user.uid, name: user.displayName || 'New User', email: user.email!, role: Role.Student, collegeName: 'N/A', country: 'N/A', state: 'N/A', district: 'N/A', facultyId: '', isIdVerified: true, following: [], facultyConnections: [] };
        await setDoc(doc(db, "users", user.uid), newUser);
        setUserMetadata(prev => [...prev, newUser]);
      }
      
      return {};
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      return { 
        error: error.code === 'auth/popup-closed-by-user'
          ? "Google sign-in was cancelled."
          : "Failed to sign in with Google. Please try again."
      };
    }
  };

  const handleCompleteIdVerification = () => {
    if (!currentUser) return;
    setUserMetadata(prev => prev.map(u => 
      u.id === currentUser.id ? { ...u, isIdVerified: true } : u
    ));
  };

  const handleLogout = () => {
    signOut(auth);
    setView('auth');
  };

  const handleGenerateMcqs = useCallback(async (formData: Omit<FormState, 'aiProvider'>) => {
    if (!currentUser) return;
    
    setView('generator');
    setError(null);
    setMcqs([]);
    
    try {
      const generatedMcqs = await generateMcqs(formData);
      setMcqs(generatedMcqs);
      setAllGeneratedMcqs(prev => [...prev, { id: `set-${Date.now()}`, facultyId: currentUser.id, timestamp: new Date(), mcqs: generatedMcqs }]);
      setView('results');
    } catch (err) {
      console.error('Error generating MCQs:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while generating questions.');
      setView('results');
    }
  }, [currentUser]);

  const handlePublishTest = async (mcqSetId: string, title: string, durationMinutes: number, endDate: string | null, studentFieldsMode: 'default' | 'custom', customStudentFields: CustomFormField[]) => {
    if (!currentUser || currentUser.role !== Role.Faculty) return;

    const set = allGeneratedMcqs.find(s => s.id === mcqSetId);
    if (!set) {
      console.error('Question set not found');
      return;
    }

    try {
      const newTestRef = doc(collection(db, "tests"));
      const newTest: Test = { id: newTestRef.id, facultyId: currentUser.id, title, durationMinutes, questions: set.mcqs, endDate, studentFieldsMode, customStudentFields, disqualifiedStudents: [] };
      await setDoc(newTestRef, newTest);

      const followersQuery = query(collection(db, "users"), where("following", "array-contains", currentUser.id));
      const followersSnapshot = await getDocs(followersQuery);

      const notificationPromises = followersSnapshot.docs.map(userDoc => {
        const follower = userDoc.data() as AppUser;
        const newNotifRef = doc(collection(db, "notifications"));
        const newNotification: AppNotification = { id: newNotifRef.id, studentId: follower.id, studentEmail: follower.email, facultyId: currentUser.id, facultyName: currentUser.name, test: newTest, status: 'new' };
        return setDoc(newNotifRef, newNotification);
      });

      await Promise.all(notificationPromises);
      setAllGeneratedMcqs(prev => prev.filter(s => s.id !== mcqSetId));
    } catch (error) {
      console.error("Error publishing test:", error);
    }
  };

  const handleRevokeTest = async (testId: string) => {
    if (!confirm("Are you sure you want to revoke this test?")) return;
    
    const testToRevoke = publishedTests.find(t => t.id === testId);
    if (!testToRevoke) {
      console.error('Test not found for revocation');
      return;
    }

    try {
      await deleteDoc(doc(db, "tests", testId));
      
      const notificationsQuery = query(collection(db, "notifications"), where("test.id", "==", testId));
      const notificationSnapshot = await getDocs(notificationsQuery);
      
      const deletePromises = notificationSnapshot.docs.map(notificationDoc => deleteDoc(doc(db, "notifications", notificationDoc.id)));
      await Promise.all(deletePromises);
      
      const newSet: GeneratedMcqSet = { id: `set-revoked-${Date.now()}`, facultyId: testToRevoke.facultyId, timestamp: new Date(), mcqs: testToRevoke.questions };
      setAllGeneratedMcqs(prev => [...prev, newSet]);
    } catch (error) {
      console.error("Error revoking test:", error);
    }
  };

  const handleSaveManualSet = (manualMcqs: MCQ[]) => {
    if (!currentUser || manualMcqs.length === 0) return;

    setAllGeneratedMcqs(prev => [...prev, { id: `set-manual-${Date.now()}`, facultyId: currentUser.id, timestamp: new Date(), mcqs: manualMcqs }]);
    setView('facultyPortal');
  };

  const handleStartTest = async (test: Test, notificationId: string) => {
    if (!currentUser) return;
    if (test.disqualifiedStudents?.includes(currentUser.id)) return;

    try {
      await deleteDoc(doc(db, "notifications", notificationId));
      setActiveTest(test);
      setView('studentLogin');
    } catch (error) {
      console.error("Error starting test:", error);
    }
  };

  const handleIgnoreTest = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), { status: 'ignored', actionTimestamp: new Date().toISOString() });
    } catch (error) {
      console.error("Error ignoring notification:", error);
    }
  };

  const handleLoginAndStart = (student: Student) => {
    if (activeTest && currentUser) {
      setStudentInfo(student);
      setView('test');
    }
  };

  const handleTestFinish = async (finalAnswers: (string | null)[], violations: number) => {
    if (!activeTest || !studentInfo || !currentUser) return;

    try {
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
    } catch (error) {
      console.error("Error finishing test:", error);
    }
  };

  const handleGrantReattempt = async (alertId: string) => {
    const alert = violationAlerts.find(a => a.id === alertId);
    if (!alert || !currentUser) return;

    try {
      const testDoc = await getDocs(query(collection(db, "tests"), where("id", "==", alert.testId)));
      if (testDoc.empty) return;

      const testData = testDoc.docs[0].data() as Test;
      const testRef = doc(db, "tests", alert.testId);

      await updateDoc(testRef, { disqualifiedStudents: testData.disqualifiedStudents?.filter(id => id !== alert.studentId) || [] });

      const newNotifRef = doc(collection(db, "notifications"));
      const newNotification: AppNotification = { id: newNotifRef.id, studentId: alert.studentId, studentEmail: alert.studentEmail, facultyId: currentUser.id, facultyName: currentUser.name, test: testData, status: 'new' };
      await setDoc(newNotifRef, newNotification);

      await updateDoc(doc(db, "violationAlerts", alertId), { status: 'resolved' });
    } catch (error) {
      console.error("Error granting re-attempt:", error);
    }
  };

  const handleSendFollowRequest = async (facultyIdToFind: string) => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, "users"), where("facultyId", "==", facultyIdToFind), where("role", "==", Role.Faculty));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return;

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
        if (existingRequestDoc.data().status !== 'pending') {
          await updateDoc(doc(db, "followRequests", existingRequestDoc.id), { status: 'pending' });
        }
      }
    } catch (error) {
      console.error("Error sending follow request:", error);
    }
  };

  const handleFollowRequestResponse = async (requestId: string, status: 'accepted' | 'rejected') => {
    const request = followRequests.find(fr => fr.id === requestId);
    if (!request) return;
    try {
      const requestRef = doc(db, "followRequests", requestId);
      await updateDoc(requestRef, { status });
      
      if (status === 'accepted') {
        const studentRef = doc(db, "users", request.studentId);
        await updateDoc(studentRef, { following: arrayUnion(request.facultyId) });
      }
    } catch (error) {
      console.error("Error responding to follow request:", error);
    }
  };

  const handleUnfollow = async (facultyId: string) => {
    if (!currentUser || !confirm("Unfollow this faculty member?")) return;
    try {
      const studentRef = doc(db, "users", currentUser.id);
      await updateDoc(studentRef, { following: arrayRemove(facultyId) });
      
      const updatedUser = { ...currentUser, following: currentUser.following.filter(id => id !== facultyId) };
      setCurrentUser(updatedUser);
      setUserMetadata(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      setFollowingList(prev => prev.filter(f => f.id !== facultyId));
    } catch (error) {
      console.error("Error unfollowing faculty:", error);
    }
  };

  const handleSendConnectionRequest = async (facultyId: string) => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, "users"), where("facultyId", "==", facultyId), where("role", "==", Role.Faculty));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return;

      const toFaculty = snapshot.docs[0].data() as AppUser;
      if (toFaculty.id === currentUser.id) return;

      const newRequestRef = doc(collection(db, "connectionRequests"));
      const newRequest: ConnectionRequest = { id: newRequestRef.id, fromFacultyId: currentUser.id, fromFacultyName: currentUser.name, fromFacultyCollege: currentUser.collegeName, toFacultyId: toFaculty.id, status: 'pending' };
      await setDoc(newRequestRef, newRequest);
    } catch (error) {
      console.error("Error sending connection request:", error);
    }
  };

  const handleSendMessage = async (chatId: string, message: { text?: string; imageUrl?: string }) => {
    if (!currentUser || (!message.text?.trim() && !message.imageUrl)) return;
    try {
      const messageRef = doc(collection(db, "chats", chatId, "messages"));
      const newMessage: Omit<ChatMessage, 'timestamp'> & { timestamp: Date } = { id: messageRef.id, chatId, senderId: currentUser.id, senderName: currentUser.name, text: message.text || '', imageUrl: message.imageUrl || '', timestamp: new Date() };
      await setDoc(messageRef, newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleAcceptConnection = async (requestId: string) => {
    const request = connectionRequests.find(r => r.id === requestId);
    if (!request || !currentUser) return;
    try {
      await updateDoc(doc(db, "connectionRequests", requestId), { status: 'accepted' });
      await updateDoc(doc(db, "users", request.fromFacultyId), { facultyConnections: arrayUnion(request.toFacultyId) });
      await updateDoc(doc(db, "users", request.toFacultyId), { facultyConnections: arrayUnion(request.fromFacultyId) });

      const updatedUser = { ...currentUser, facultyConnections: [...(currentUser.facultyConnections || []), request.fromFacultyId] };
      setCurrentUser(updatedUser);
      setUserMetadata(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    } catch (error) {
      console.error("Error accepting connection:", error);
    }
  };
  
  const handleRejectConnection = async (requestId: string) => {
    try {
      await updateDoc(doc(db, "connectionRequests", requestId), { status: 'rejected' });
    } catch (error) {
      console.error("Error rejecting connection:", error);
    }
  };
  
  const handleNavigate = async (targetView: View) => {
    setAnalyticsTest(null);
    setIsLoading(true);
    
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
          } else {
            setFollowingList([]);
          }
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
        } else {
          setConnectedFaculty([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data for navigation:", error);
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
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderContent = () => {
    if (isLoading) return <div className="flex h-full w-full items-center justify-center"><LoadingSpinner /></div>;
    if (view === 'emailVerification') return <EmailVerification email={verificationEmail} onLoginNavigate={() => setView('auth')} />;
    if (!currentUser) return <AuthPortal onLogin={handleLogin} onRegister={handleRegister} onGoogleSignIn={handleGoogleSignIn} onRegistrationSuccess={(email) => { setVerificationEmail(email); setView('emailVerification'); }} />;
    if (currentUser.role === Role.Faculty && !currentUser.isIdVerified) return <IdVerification onVerified={handleCompleteIdVerification} />;
    
    switch (view) {
      case 'profile': return <ProfilePage user={currentUser} onLogout={handleLogout} onBack={() => handleNavigate(currentUser.role === Role.Faculty ? 'facultyPortal' : 'studentPortal')} />;
      case 'facultyPortal': return <FacultyPortal faculty={currentUser} generatedSets={userGeneratedSets} publishedTests={userPublishedTests} followRequests={userFollowRequests} connectionRequests={connectionRequests} ignoredNotifications={ignoredByStudents} violationAlerts={violationAlerts} onPublishTest={handlePublishTest} onRevokeTest={handleRevokeTest} onFollowRequestResponse={handleFollowRequestResponse} onViewTestAnalytics={handleViewTestAnalytics} onGrantReattempt={handleGrantReattempt} onViewFollowers={() => handleNavigate('followers')} onNavigateToConnect={() => handleNavigate('connect')} onAcceptConnection={handleAcceptConnection} onRejectConnection={handleRejectConnection} />;
      case 'studentPortal': return <StudentPortal onNavigateToHistory={() => handleNavigate('testHistory')} onNavigateToNotifications={() => handleNavigate('notifications')} onNavigateToFollowing={() => handleNavigate('following')} onSendFollowRequest={handleSendFollowRequest} />;
      case 'following': return <FollowingPage followingList={followingList} onUnfollow={handleUnfollow} onBack={() => handleNavigate('studentPortal')} />;
      case 'followers': return <FollowersPage followers={followers} onBack={() => handleNavigate('facultyPortal')} />;
      case 'connect': return <ConnectPage currentUser={currentUser} connectedFaculty={connectedFaculty} connectionRequests={connectionRequests} onSendConnectionRequest={handleSendConnectionRequest} onSendMessage={handleSendMessage} onAcceptConnection={handleAcceptConnection} onRejectConnection={handleRejectConnection} onBack={() => handleNavigate('facultyPortal')} />;
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
        return <div className="flex h-full w-full items-center justify-center"><LoadingSpinner /></div>;
    }
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      {view === 'auth' || view === 'emailVerification' || view === 'test' ? (
        renderContent()
      ) : (
        <>
          <Header
            user={currentUser}
            activeView={view}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
          <main className="container mx-auto p-4 md:p-8">
            {renderContent()}
          </main>
        </>
      )}
    </div>
  );
};

export default App;