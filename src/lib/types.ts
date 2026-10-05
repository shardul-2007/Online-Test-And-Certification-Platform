export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'TIMED_OUT';

export interface Admin {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  organization?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionOption {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface Question {
  id: string;
  testId: string;
  text: string;
  type: QuestionType;
  marks: number;
  order: number;
  category: string;
  explanation?: string | null;
  options: QuestionOption[];
}

export interface Test {
  id: string;
  title: string;
  slug: string;
  description: string;
  durationMinutes: number;
  passingPercentage: number;
  isPublished: boolean;
  certificateTitle: string;
  organizationName: string;
  createdAt: string;
  updatedAt: string;
  questions?: Question[];
}

export interface Answer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptionId?: string | null;
  isMarkedForReview: boolean;
  isCorrect: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TestAttempt {
  id: string;
  testId: string;
  userId: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt?: string | null;
  timeSpentSeconds: number;
  tabSwitchCount: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  score: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  answers: Answer[];
  user?: User;
  test?: Test;
  certificate?: Certificate | null;
}

export interface Certificate {
  id: string;
  certificateId: string;
  attemptId: string;
  userId: string;
  testId: string;
  participantName: string;
  participantEmail: string;
  participantOrganization?: string | null;
  testTitle: string;
  score: number;
  percentage: number;
  issueDate: string;
  verificationUrl: string;
  emailSent: boolean;
  emailSentAt?: string | null;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  certificateId?: string | null;
  recipient: string;
  emailType: string;
  status: 'DELIVERED' | 'SENT' | 'SIMULATED' | 'FAILED';
  providerId?: string | null;
  errorMessage?: string | null;
  timestamp: string;
}

export interface DatabaseSchema {
  admins: Admin[];
  users: User[];
  tests: Test[];
  questions: Question[];
  options: QuestionOption[];
  attempts: TestAttempt[];
  answers: Answer[];
  certificates: Certificate[];
  emailLogs: EmailLog[];
}
