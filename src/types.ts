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
  collegeName: string; 
  country: string; // <<< NEW FIELD
  state: string; // <<< NEW FIELD
  district: string; // <<< NEW FIELD
  facultyId: string;
  isIdVerified: boolean;
  following: string[];
  facultyConnections?: string[];
}

// ** NEW TYPE for faculty-to-faculty connection requests **
export interface ConnectionRequest {
  id: string;
  fromFacultyId: string; // The AppUser ID of the sender
  fromFacultyName: string;
  fromFacultyCollege: string;
  toFacultyId: string; // The AppUser ID of the receiver
  status: 'pending' | 'accepted' | 'rejected';
}
export interface ChatMessage {
  id: string;
  chatId: string; // Combination of the two faculty UIDs
  senderId: string;
  senderName: string;
  text?: string; // Text is optional for image messages
  imageUrl?: string; // URL for the uploaded image
  timestamp: string; // Stored as ISO string
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
  facultyId: string; // This is the AppUser ID (UID) of the faculty
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
  actionTimestamp?: string; // Stored as ISO string for ignored/disqualified events
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

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  facultyId: string;
  isIdVerified: boolean;
  following: string[];
}

