export type Difficulty = 'easy' | 'medium' | 'hard';

export interface PerformanceSnapshot {
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  totalQuestions: number;
  currentDifficulty: Difficulty;
}

export interface StudentSession {
  id: string;
  gradeLevel: number;
  subject: string;
  contextKey?: string;
  startedAt: number;
  lastActiveAt: number;
  performance: PerformanceSnapshot;
}

export interface MessageMetadata {
  difficulty?: Difficulty;
  hintLevel?: number;
  isHomeworkRequest?: boolean;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'student' | 'assistant';
  content: string;
  timestamp: number;
  referencedEntryIds?: string[];
  metadata?: MessageMetadata;
}

export interface ExampleProblem {
  problem: string;
  solution: string;
  explanation: string;
  difficulty: Difficulty;
}

export interface Attachment {
  id: string;
  mimeType: string;
  dataUrl: string;
  caption?: string;
}

export interface KnowledgeEntry {
  id: string;
  entryType?: 'subject' | 'context';
  subject?: string;
  gradeLevel?: number | null;
  contextKey?: string;
  isMainArticle?: boolean;
  title: string;
  contentBody: string;
  exampleProblems?: ExampleProblem[];
  pedagogicalNotes?: string;
  attachments?: Attachment[];
  createdAt: number;
  updatedAt: number;
}

export interface EmbeddingVector {
  entryId: string;
  model: string;
  vector: number[];
  updatedAt: number;
}

export interface HomeworkItem {
  questionText: string;
  expectedAnswerFormat: string;
  difficulty: Difficulty;
  subject: string;
  gradeLevel: number;
  hintText?: string;
  explanationText?: string;
  solution?: string;
}

export interface AppConfig {
  adminPinHash: string | null;
  customSubjects: string[];
  predefinedSubjects: string[];
}

export interface RetrievedEntry {
  entry: KnowledgeEntry;
  score: number;
}
