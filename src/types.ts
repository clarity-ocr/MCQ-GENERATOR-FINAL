// src/types.ts

// --- Enums ---

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

// --- Navigation Types ---

export type View = 
  | 'auth' 
  | 'emailVerification' 
  | 'idVerification' 
  // Main Views
  | 'dashboard'     
  | 'content'       
  | 'network'       
  | 'integrity'     
  // Sub Views / Actions
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
  // Legacy / Redirections
  | 'studentPortal' 
  | 'facultyPortal' 
  | 'following' 
  | 'followers' 
  | 'connect'
  | 'certificate';

// --- User & Social Interfaces ---

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

export interface FollowRequest {
  id: string;
  studentId: string;
  studentEmail: string;
  facultyId: string;
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

// --- Content & Test Interfaces ---

export interface MCQ {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  correctAnswer?: string; // Fallback for some AI models
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
    required?: boolean;
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
  // Advanced Controls
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  attemptLimit?: number;
  allowSkip?: boolean;
}

export interface GeneratedMcqSet {
  id: string;
  facultyId: string;
  timestamp: Date;
  mcqs: MCQ[];
}

// --- Student Execution Interfaces ---

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
  date: Date; // Unified date field (replaced timestamp)
  violations: number;
  questions?: MCQ[]; // Snapshot of questions at time of attempt
}

// --- System Interfaces ---

export interface AppNotification {
  id: string;
  studentId: string; // Recipient
  studentEmail: string;
  facultyId: string; // Sender
  facultyName: string;
  
  // Dynamic Content
  type?: 'test_invite' | 'message' | 'alert'; 
  title?: string;
  message?: string;
  test?: Test; // Optional (only for test_invite)
  
  status: 'new' | 'read' | 'ignored';
  timestamp?: string; // ISO String
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