import type { FunctionCall, FunctionDeclaration } from '@google/generative-ai';

export type AiProviderErrorKind =
  | 'not_configured'
  | 'unauthorized'
  | 'rate_limited'
  | 'unavailable'
  | 'network'
  | 'unknown'
  /** The worker rejected this app's own embedding credential (feature 002-secure-embed-telemetry).
   *  Not retryable across providers — every provider sits behind the same gate. */
  | 'client_unauthorized'
  /** The worker throttled this app's client id (per-client rate limit). Not retryable. */
  | 'client_throttled'
  /** No `window.conversiaClient` credential was injected into this page by the host app. */
  | 'client_not_configured';

export class AiProviderError extends Error {
  constructor(
    public readonly providerId: string,
    public readonly kind: AiProviderErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'AiProviderError';
  }
}

export interface ChatTurn {
  role: 'student' | 'assistant';
  content: string;
}

export interface EmbedResult {
  vector: number[];
  model: string;
}

export interface TutorGenerationResult {
  text: string;
  functionCalls?: FunctionCall[];
}

export interface AiProvider {
  readonly id: string;
  /** True if this provider can accept a `tools` param and return function calls. Orchestrator only forwards tools to providers where this is true. */
  readonly supportsTools?: boolean;
  isConfigured(): boolean;
  generateTutorResponse(systemPrompt: string, history: ChatTurn[], tools?: FunctionDeclaration[]): Promise<TutorGenerationResult>;
  /** Optional: not every provider offers embeddings (e.g. Groq doesn't). Orchestrator skips providers that omit this. */
  embedText?(text: string, taskType: 'document' | 'query'): Promise<EmbedResult>;
}
