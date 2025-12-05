// src/types.ts

export enum Difficulty {
  Easy = "Easy",
  Medium = "Medium",
  Hard = "Hard",
  Expert = "Expert",
}

export enum Taxonomy {
  Remembering = "Remembering",
  Understanding = "Understanding",
  Applying = "Applying",
  Analyzing = "Analyzing",
  Evaluating = "Evaluating",
  Creating = "Creating",
}

export enum AiProvider {
  Gemini = "Gemini",
  Groq = "Groq",
}

export enum Role {
  Faculty = 'faculty', 
  Student = 'student',
}

// Updated View type to support the new modular architecture
export type View = 
  | 'auth' 
  | 'emailVerification' 
  | 'idVerification' 
  // -- New Main Views --
  | 'dashboard'     // Stats & Charts
  | 'content'       // Tests & Drafts
  | 'network'       // Followers & Connections
  | 'integrity'     // Violations & Logs
  // -- Sub Views --
  | 'generator' 
  | 'results' 
  | 'manualCreator' 
  | 'test' 
  | 'studentLogin' 
  | 'testResults' 
  | 'testHistory' 
  | 'notifications' 
  | 'testAnalytics' 
  | 'profile' 
  // Legacy mappings (redirected in App.tsx)
  | 'studentPortal' 
  | 'facultyPortal' 
  | 'following' 
  | 'followers' 
  | 'connect';

export interface AppUser {
  id: string; // Firebase UID
  username: string;
  name: string;
  email: string;
  role: Role;
  collegeName: string; 
  country: string;
  state: string;
  district: string;
  facultyId: string;
  isIdVerified: boolean;
  following: string[]; // Array of User IDs
  followers?: string[]; // Array of User IDs
  facultyConnections?: string[]; // Array of User IDs
}

export interface ConnectionRequest {
  id: string;
  fromFacultyId: string;
  fromFacultyName: string;
  fromFacultyCollege: string;
  toFacultyId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text?: string;
  imageUrl?: string;
  timestamp: string | Date;
}

export interface MCQ {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface FormState {
  topic: string;
  difficulty: Difficulty;
  taxonomy: Taxonomy;
  questions: number;
  studyMaterial: string;
  imageData?: {
    mimeType: string;
    data: string;
  } | null;
  aiProvider: AiProvider;
}

export interface CustomFormField {
    label: string;
}

export interface Test {
  id: string;
  facultyId: string;
  title: string;
  durationMinutes: number;
  questions: MCQ[];
  studentFieldsMode: 'default' | 'custom';
  customStudentFields: CustomFormField[];
  endDate: string | null;
  disqualifiedStudents?: string[]; 
}

export interface GeneratedMcqSet {
  id: string;
  facultyId: string;
  timestamp: Date;
  mcqs: MCQ[];
}

export interface Student {
  name: string;
  registrationNumber: string;
  branch: string;
  section: string;
  customData?: { [key: string]: string };
}

export interface TestAttempt {
  id: string;
  testId: string;
  studentId: string;
  testTitle: string;
  student: Student;
  score: number;
  totalQuestions: number;
  answers: (string | null)[];
  date: Date;
  violations: number;
}

export interface FollowRequest {
  id: string;
  studentId: string;
  studentEmail: string;
  facultyId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface AppNotification {
  id: string;
  studentId: string;
  studentEmail: string;
  facultyId: string;
  facultyName: string;
  test: Test;
  status: 'new' | 'ignored';
  actionTimestamp?: string;
}

export interface ViolationAlert {
    id: string;
    studentId: string;
    studentEmail: string;
    facultyId: string;
    testId: string;
    testTitle: string;
    timestamp: string;
    status: 'pending' | 'resolved';
}