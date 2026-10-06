import fs from 'fs';
import path from 'path';
import os from 'os';
import { initialDatabaseData } from './seed';
import {
  Admin,
  Answer,
  Certificate,
  DatabaseSchema,
  EmailLog,
  Question,
  QuestionOption,
  Test,
  TestAttempt,
  User,
} from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_DB_FILE = path.join(DATA_DIR, 'certipulse_db.json');
const TMP_DB_FILE = path.join(os.tmpdir(), 'certipulse_db.json');

// Global in-memory cache to retain state across warm lambda invocations
let inMemoryCache: DatabaseSchema | null = null;

// Ensure data folder and file existence with initial seed
function ensureDataStore(): DatabaseSchema {
  if (inMemoryCache) {
    return inMemoryCache;
  }

  try {
    // 1. Try reading from tmp directory (most up-to-date in serverless runtime)
    if (fs.existsSync(TMP_DB_FILE)) {
      const raw = fs.readFileSync(TMP_DB_FILE, 'utf-8');
      inMemoryCache = JSON.parse(raw);
      return inMemoryCache!;
    }

    // 2. Try reading from bundled repository data directory
    if (fs.existsSync(LOCAL_DB_FILE)) {
      const raw = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
      inMemoryCache = JSON.parse(raw);
      return inMemoryCache!;
    }

    // 3. Fallback to bundled seed data
    inMemoryCache = JSON.parse(JSON.stringify(initialDatabaseData));
    return inMemoryCache!;
  } catch (err) {
    console.error('Error reading certipulse DB, falling back to seed:', err);
    inMemoryCache = JSON.parse(JSON.stringify(initialDatabaseData));
    return inMemoryCache!;
  }
}

// Atomic file writer
function saveDb(data: DatabaseSchema): void {
  inMemoryCache = data;

  // Persist to tmp directory (always writable in Vercel & serverless lambdas)
  try {
    const tempTmp = `${TMP_DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempTmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempTmp, TMP_DB_FILE);
  } catch (err) {
    // tmp write fallback
  }

  // Also attempt local write for local dev server
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${LOCAL_DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, LOCAL_DB_FILE);
  } catch {
    // Silently ignore EROFS in read-only serverless environment
  }
}

export const db = {
  // RAW ACCESS
  getRawData(): DatabaseSchema {
    return ensureDataStore();
  },

  // USERS
  user: {
    findUnique({ where }: { where: { email?: string; id?: string } }): User | null {
      const state = ensureDataStore();
      if (where.email) {
        return state.users.find((u) => u.email.toLowerCase() === where.email?.toLowerCase()) || null;
      }
      if (where.id) {
        return state.users.find((u) => u.id === where.id) || null;
      }
      return null;
    },
    findMany(): User[] {
      const state = ensureDataStore();
      return state.users;
    },
    create({ data }: { data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> }): User {
      const state = ensureDataStore();
      const existing = state.users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
      if (existing) {
        existing.name = data.name;
        if (data.phone) existing.phone = data.phone;
        if (data.organization) existing.organization = data.organization;
        existing.updatedAt = new Date().toISOString();
        saveDb(state);
        return existing;
      }
      const newUser: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        organization: data.organization || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.users.push(newUser);
      saveDb(state);
      return newUser;
    },
    upsert({
      where,
      update,
      create,
    }: {
      where: { email: string };
      update: Partial<User>;
      create: Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
    }): User {
      const state = ensureDataStore();
      const idx = state.users.findIndex((u) => u.email.toLowerCase() === where.email.toLowerCase());
      if (idx >= 0) {
        state.users[idx] = {
          ...state.users[idx],
          ...update,
          updatedAt: new Date().toISOString(),
        };
        saveDb(state);
        return state.users[idx];
      }
      const created: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...create,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.users.push(created);
      saveDb(state);
      return created;
    },
  },

  // ADMIN
  admin: {
    findUnique({ where }: { where: { email?: string; id?: string } }): Admin | null {
      const state = ensureDataStore();
      if (where.email) {
        return state.admins.find((a) => a.email.toLowerCase() === where.email?.toLowerCase()) || null;
      }
      if (where.id) {
        return state.admins.find((a) => a.id === where.id) || null;
      }
      return null;
    },
    findMany(): Admin[] {
      const state = ensureDataStore();
      return state.admins;
    },
    create({ data }: { data: Omit<Admin, 'createdAt' | 'updatedAt'> }): Admin {
      const state = ensureDataStore();
      const newAdmin: Admin = {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.admins.push(newAdmin);
      saveDb(state);
      return newAdmin;
    },
  },

  // TESTS
  test: {
    findUnique({ where }: { where: { id?: string; slug?: string } }): (Test & { questions: (Question & { options: QuestionOption[] })[] }) | null {
      const state = ensureDataStore();
      const test = state.tests.find((t) => (where.id ? t.id === where.id : t.slug === where.slug));
      if (!test) return null;

      const questions = state.questions
        .filter((q) => q.testId === test.id)
        .sort((a, b) => a.order - b.order)
        .map((q) => ({
          ...q,
          options: state.options
            .filter((opt) => opt.questionId === q.id)
            .sort((a, b) => a.order - b.order),
        }));

      return {
        ...test,
        questions,
      };
    },
    findMany({ where }: { where?: { isPublished?: boolean } } = {}): (Test & { questionCount: number })[] {
      const state = ensureDataStore();
      return state.tests
        .filter((t) => (where?.isPublished !== undefined ? t.isPublished === where.isPublished : true))
        .map((t) => {
          const qCount = state.questions.filter((q) => q.testId === t.id).length;
          return {
            ...t,
            questionCount: qCount,
          };
        });
    },
    create({ data }: { data: Omit<Test, 'id' | 'createdAt' | 'updatedAt'> }): Test {
      const state = ensureDataStore();
      const newTest: Test = {
        id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.tests.push(newTest);
      saveDb(state);
      return newTest;
    },
    update({ where, data }: { where: { id: string }; data: Partial<Test> }): Test | null {
      const state = ensureDataStore();
      const idx = state.tests.findIndex((t) => t.id === where.id);
      if (idx === -1) return null;
      state.tests[idx] = {
        ...state.tests[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      saveDb(state);
      return state.tests[idx];
    },
    delete({ where }: { where: { id: string } }): boolean {
      const state = ensureDataStore();
      state.tests = state.tests.filter((t) => t.id !== where.id);
      state.questions = state.questions.filter((q) => q.testId !== where.id);
      saveDb(state);
      return true;
    },
  },

  // QUESTIONS
  question: {
    findMany({ where }: { where: { testId: string } }): (Question & { options: QuestionOption[] })[] {
      const state = ensureDataStore();
      return state.questions
        .filter((q) => q.testId === where.testId)
        .sort((a, b) => a.order - b.order)
        .map((q) => ({
          ...q,
          options: state.options
            .filter((o) => o.questionId === q.id)
            .sort((a, b) => a.order - b.order),
        }));
    },
    create({
      data,
    }: {
      data: {
        testId: string;
        text: string;
        type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
        marks: number;
        category: string;
        explanation?: string | null;
        options: { text: string; isCorrect: boolean; order: number }[];
      };
    }): Question {
      const state = ensureDataStore();
      const existingInTest = state.questions.filter((q) => q.testId === data.testId);
      const newQId = `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newQuestion: Question = {
        id: newQId,
        testId: data.testId,
        text: data.text,
        type: data.type,
        marks: data.marks,
        order: existingInTest.length + 1,
        category: data.category || 'General',
        explanation: data.explanation || null,
        options: [],
      };
      state.questions.push(newQuestion);

      const createdOptions: QuestionOption[] = data.options.map((opt, i) => ({
        id: `opt-${Date.now()}-${i}`,
        questionId: newQId,
        text: opt.text,
        isCorrect: opt.isCorrect,
        order: opt.order || i + 1,
      }));
      state.options.push(...createdOptions);

      saveDb(state);
      return {
        ...newQuestion,
        options: createdOptions,
      };
    },
    delete({ where }: { where: { id: string } }): boolean {
      const state = ensureDataStore();
      state.questions = state.questions.filter((q) => q.id !== where.id);
      state.options = state.options.filter((o) => o.questionId !== where.id);
      saveDb(state);
      return true;
    },
  },

  // TEST ATTEMPTS
  attempt: {
    findUnique({ where }: { where: { id: string } }): (TestAttempt & { user?: User; test?: Test; certificate?: Certificate | null }) | null {
      const state = ensureDataStore();
      const attempt = state.attempts.find((a) => a.id === where.id);
      if (!attempt) return null;
      const user = state.users.find((u) => u.id === attempt.userId);
      const test = state.tests.find((t) => t.id === attempt.testId);
      const certificate = state.certificates.find((c) => c.attemptId === attempt.id) || null;
      return {
        ...attempt,
        user,
        test,
        certificate,
      };
    },
    findMany({ where }: { where?: { testId?: string; userId?: string; status?: string } } = {}): (TestAttempt & { user?: User; test?: Test; certificate?: Certificate | null })[] {
      const state = ensureDataStore();
      return state.attempts
        .filter((a) => {
          if (where?.testId && a.testId !== where.testId) return false;
          if (where?.userId && a.userId !== where.userId) return false;
          if (where?.status && a.status !== where.status) return false;
          return true;
        })
        .map((attempt) => ({
          ...attempt,
          user: state.users.find((u) => u.id === attempt.userId),
          test: state.tests.find((t) => t.id === attempt.testId),
          certificate: state.certificates.find((c) => c.attemptId === attempt.id) || null,
        }))
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    },
    create({
      data,
    }: {
      data: {
        id?: string;
        testId: string;
        userId: string;
        totalQuestions: number;
        maxScore: number;
      };
    }): TestAttempt {
      const state = ensureDataStore();
      const newAttempt: TestAttempt = {
        id: data.id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        testId: data.testId,
        userId: data.userId,
        status: 'IN_PROGRESS',
        startedAt: new Date().toISOString(),
        submittedAt: null,
        timeSpentSeconds: 0,
        tabSwitchCount: 0,
        totalQuestions: data.totalQuestions,
        correctAnswers: 0,
        incorrectAnswers: 0,
        unanswered: data.totalQuestions,
        score: 0,
        maxScore: data.maxScore,
        percentage: 0,
        isPassed: false,
        answers: [],
      };
      state.attempts.push(newAttempt);
      saveDb(state);
      return newAttempt;
    },
    update({ where, data }: { where: { id: string }; data: Partial<TestAttempt> }): TestAttempt | null {
      const state = ensureDataStore();
      const idx = state.attempts.findIndex((a) => a.id === where.id);
      if (idx === -1) return null;
      state.attempts[idx] = {
        ...state.attempts[idx],
        ...data,
      };
      saveDb(state);
      return state.attempts[idx];
    },
    delete({ where }: { where: { id: string } }): boolean {
      const state = ensureDataStore();
      state.attempts = state.attempts.filter((a) => a.id !== where.id);
      saveDb(state);
      return true;
    },
    deleteMany({ where }: { where: { ids: string[] } }): number {
      const state = ensureDataStore();
      const before = state.attempts.length;
      state.attempts = state.attempts.filter((a) => !where.ids.includes(a.id));
      saveDb(state);
      return before - state.attempts.length;
    },
  },

  // ANSWERS (FOR SAVING PROGRESS & REVIEWS)
  answer: {
    findMany({ where }: { where: { attemptId: string } }): Answer[] {
      const state = ensureDataStore();
      return state.answers.filter((a) => a.attemptId === where.attemptId);
    },
    deleteMany({ where }: { where: { attemptIds: string[] } }): number {
      const state = ensureDataStore();
      const before = state.answers.length;
      state.answers = state.answers.filter((a) => !where.attemptIds.includes(a.attemptId));
      saveDb(state);
      return before - state.answers.length;
    },
    upsert({
      where,
      data,
    }: {
      where: { attemptId_questionId: { attemptId: string; questionId: string } };
      data: { selectedOptionId?: string | null; isMarkedForReview?: boolean; isCorrect?: boolean };
    }): Answer {
      const state = ensureDataStore();
      const { attemptId, questionId } = where.attemptId_questionId;
      const idx = state.answers.findIndex(
        (a) => a.attemptId === attemptId && a.questionId === questionId
      );
      if (idx >= 0) {
        state.answers[idx] = {
          ...state.answers[idx],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        saveDb(state);
        return state.answers[idx];
      }
      const newAns: Answer = {
        id: `ans-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        attemptId,
        questionId,
        selectedOptionId: data.selectedOptionId || null,
        isMarkedForReview: data.isMarkedForReview ?? false,
        isCorrect: data.isCorrect ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.answers.push(newAns);
      saveDb(state);
      return newAns;
    },
  },

  // CERTIFICATES
  certificate: {
    findUnique({ where }: { where: { certificateId?: string; id?: string; attemptId?: string } }): Certificate | null {
      const state = ensureDataStore();
      if (where.certificateId) {
        return state.certificates.find((c) => c.certificateId.toUpperCase() === where.certificateId?.toUpperCase()) || null;
      }
      if (where.id) {
        return state.certificates.find((c) => c.id === where.id) || null;
      }
      if (where.attemptId) {
        return state.certificates.find((c) => c.attemptId === where.attemptId) || null;
      }
      return null;
    },
    findMany({ search }: { search?: string } = {}): Certificate[] {
      const state = ensureDataStore();
      let list = state.certificates;
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (c) =>
            c.certificateId.toLowerCase().includes(q) ||
            c.participantName.toLowerCase().includes(q) ||
            c.participantEmail.toLowerCase().includes(q) ||
            c.testTitle.toLowerCase().includes(q)
        );
      }
      return list.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    },
    create({ data }: { data: Omit<Certificate, 'id' | 'createdAt'> }): Certificate {
      const state = ensureDataStore();
      const newCert: Certificate = {
        id: `cert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...data,
        createdAt: new Date().toISOString(),
      };
      state.certificates.push(newCert);
      saveDb(state);
      return newCert;
    },
    update({ where, data }: { where: { id?: string; certificateId?: string }; data: Partial<Certificate> }): Certificate | null {
      const state = ensureDataStore();
      const idx = state.certificates.findIndex((c) => (where.id ? c.id === where.id : c.certificateId === where.certificateId));
      if (idx === -1) return null;
      state.certificates[idx] = {
        ...state.certificates[idx],
        ...data,
      };
      saveDb(state);
      return state.certificates[idx];
    },
    delete({ where }: { where: { certificateId?: string; attemptId?: string } }): boolean {
      const state = ensureDataStore();
      state.certificates = state.certificates.filter((c) => {
        if (where.certificateId && c.certificateId === where.certificateId) return false;
        if (where.attemptId && c.attemptId === where.attemptId) return false;
        return true;
      });
      saveDb(state);
      return true;
    },
    deleteMany({ where }: { where: { attemptIds: string[] } }): number {
      const state = ensureDataStore();
      const before = state.certificates.length;
      state.certificates = state.certificates.filter((c) => !where.attemptIds.includes(c.attemptId));
      saveDb(state);
      return before - state.certificates.length;
    },
  },

  // EMAIL LOGS
  emailLog: {
    findMany(): EmailLog[] {
      const state = ensureDataStore();
      return state.emailLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    create({ data }: { data: Omit<EmailLog, 'id' | 'timestamp'> }): EmailLog {
      const state = ensureDataStore();
      const newLog: EmailLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...data,
        timestamp: new Date().toISOString(),
      };
      state.emailLogs.push(newLog);
      saveDb(state);
      return newLog;
    },
  },

  // STATS FOR ADMIN
  stats: {
    getOverview() {
      const state = ensureDataStore();
      const totalTests = state.tests.length;
      const totalParticipants = state.users.length;
      const totalAttempts = state.attempts.length;
      const completedAttempts = state.attempts.filter((a) => a.status === 'COMPLETED');
      const passedAttempts = completedAttempts.filter((a) => a.isPassed);
      const certificatesIssued = state.certificates.length;
      const passRate =
        completedAttempts.length > 0
          ? Math.round((passedAttempts.length / completedAttempts.length) * 100)
          : 0;

      // Score distribution: [0-50, 50-70, 70-85, 85-100]
      const distribution = {
        below50: completedAttempts.filter((a) => a.percentage < 50).length,
        between50And70: completedAttempts.filter((a) => a.percentage >= 50 && a.percentage < 70).length,
        between70And85: completedAttempts.filter((a) => a.percentage >= 70 && a.percentage < 85).length,
        above85: completedAttempts.filter((a) => a.percentage >= 85).length,
      };

      return {
        totalTests,
        totalParticipants,
        totalAttempts,
        testsCompleted: completedAttempts.length,
        certificatesIssued,
        passRate,
        distribution,
      };
    },
  },
};
