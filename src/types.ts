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

export type View = 
  | 'auth' 
  | 'emailVerification' 
  | 'idVerification' 
  | 'dashboard'     
  | 'content'       
  | 'network'       
  | 'integrity'     
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
  | 'studentPortal' 
  | 'facultyPortal' 
  | 'following' 
  | 'followers' 
  | 'connect'
  | 'library'
  | 'analytics'
  | 'taking_test';

export interface AppUser {
  id: string; 
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
  following: string[]; 
  followers?: string[]; 
  facultyConnections?: string[]; 
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

export interface FollowRequest {
  id: string;
  studentId: string;
  studentEmail: string;
  facultyId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface CustomFormField {
  label: string;
  required?: boolean; 
}

export interface MCQ {
  id?: string; 
  question: string;
  options: string[];
  correctAnswer: string;
  answer?: string;
  explanation?: string;
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

export interface GeneratedMcqSet {
  id: string;
  topic?: string; 
  facultyId?: string; 
  timestamp: string | Date; 
  mcqs: MCQ[];
  sourceFile?: string;
}

export interface Test {
  id: string;
  facultyId?: string; 
  title: string;
  durationMinutes: number;
  questions: MCQ[];
  studentFieldsMode: 'default' | 'custom';
  customStudentFields: CustomFormField[];
  endDate: string | null;
  createdAt?: string; 
  disqualifiedStudents?: string[];
  
  // Control Fields
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  attemptLimit: number; 
  allowSkip?: boolean; // Added allowSkip (optional to support legacy data)
}

export interface Student {
  name: string;
  registrationNumber: string;
  branch?: string; 
  section?: string; 
  customData?: { [key: string]: string };
}

export interface TestAttempt {
  id: string;
  testId: string;
  studentId?: string; 
  testTitle?: string; 
  student: Student;
  score: number;
  totalQuestions: number;
  answers: (string | null)[]; 
  timestamp: number; 
  date?: Date;       
  violations: number;
  questions?: MCQ[]; 
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