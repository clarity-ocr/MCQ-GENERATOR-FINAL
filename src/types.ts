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
  Faculty = 'Faculty',
  Student = 'Student',
}

export interface AppUser {
  id: string; // Firebase UID
  name: string;
  email: string;
  role: Role;
  facultyId: string; // e.g., "Jeevasurya-faculty101"
  isIdVerified: boolean; // For staff ID card verification
  following: string[]; // List of faculty IDs a student is following
}

export interface MCQ {
  question: string;
  options: string[];
  answer: string;
  explanation:string;
}

export interface FormState {
  topic: string;
  difficulty: Difficulty;
  taxonomy: Taxonomy;
  questions: number;
  studyMaterial: string;
  imageData?: {
    mimeType: string;
    data: string; // base64 encoded string
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
  testMode: 'default' | 'custom';
  customFormFields: CustomFormField[];
}

export interface GeneratedMcqSet {
  id: string;
  facultyId: string;
  timestamp: Date;
  mcqs: MCQ[];
}

export interface Student {
  registrationNumber: string;
  name: string;
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
}

export interface FollowRequest {
  id: string;
  studentId: string;
  studentEmail: string;
  facultyId: string; // This is the AppUser ID (UID) of the faculty
  status: 'pending' | 'accepted' | 'rejected';
}

export interface Notification {
  id: string;
  studentId: string;
  test: Test;
  facultyName: string;
  isRead: boolean;
}