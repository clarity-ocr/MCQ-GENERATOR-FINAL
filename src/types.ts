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

export interface AppUser {
  id: string; // Firebase UID
  name: string;
  email: string;
  role: Role;
  facultyId: string; // e.g., "Jeevasurya-faculty101"
  isIdVerified: boolean; // For staff ID card verification
  following: string[]; // List of faculty AppUser IDs (UIDs) a student is following
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
  studentFieldsMode: 'default' | 'custom';
  customStudentFields: CustomFormField[];
  endDate: string | null; // Stored as ISO string
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
  student: Student; // This now holds the full student details object
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

export interface AppNotification {
  id: string;
  studentId: string;
  studentEmail: string; // For display on faculty dashboard
  facultyId: string;
  facultyName: string;
  test: Test;
  status: 'new' | 'ignored'; // Status for tracking student action
  ignoredTimestamp?: string; // Stored as ISO string
}