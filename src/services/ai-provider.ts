export type AiProviderErrorKind = 'not_configured' | 'unauthorized' | 'rate_limited' | 'unavailable' | 'network' | 'unknown';

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

export interface AiProvider {
  readonly id: string;
  isConfigured(): boolean;
  generateTutorResponse(systemPrompt: string, history: ChatTurn[]): Promise<string>;
  /** Optional: not every provider offers embeddings (e.g. Groq doesn't). Orchestrator skips providers that omit this. */
  embedText?(text: string, taskType: 'document' | 'query'): Promise<EmbedResult>;
}
