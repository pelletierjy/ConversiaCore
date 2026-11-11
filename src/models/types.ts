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
  providerId?: string;
  /** Set once the user has reported this AI reply via "Report an issue". */
  reportedAt?: number;
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
  /** Admin-configured AI provider try-order (provider ids). Defaults to registry order when unset. */
  aiProviderPriority?: string[];
  /** Admin-disabled provider ids — excluded from the chat try-order (see resolveProviderOrder).
   *  Unset or empty means every provider is enabled. */
  aiDisabledProviders?: string[];
}

export interface HostGuardrailConfig {
  offTopicKeywords: string[];
  redirectMessage: string;
}

/** Per-host tutor configuration, stored at `appConfig/{contextKey}` and keyed by the host app's `context` value. */
export interface HostAppConfig {
  systemPrompt?: string;
  guardrails?: HostGuardrailConfig;
}

export interface RetrievedEntry {
  entry: KnowledgeEntry;
  score: number;
}

export type ReportReason = 'inappropriate' | 'incorrect' | 'harmful' | 'other';

export const REPORT_REASONS: ReportReason[] = ['inappropriate', 'incorrect', 'harmful', 'other'];

/** A user's report about an AI-generated reply (Microsoft Store policy 11.16). */
export interface ContentReport {
  reason: ReportReason;
  comment?: string;
  messageId: string;
  sessionId: string;
  assistantContent: string;
  studentPrompt?: string;
  providerId?: string;
  subject?: string;
  gradeLevel?: number;
  contextKey?: string;
  locale?: string;
}
