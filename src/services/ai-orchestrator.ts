import { AiProviderError, type AiProvider, type ChatTurn, type EmbedResult } from './ai-provider';
import { AI_PROVIDERS } from './ai-provider-registry';
import { getProviderPriority } from './ai-provider-config';

const RETRYABLE_KINDS = new Set(['rate_limited', 'unavailable', 'network']);

async function resolveOrder(): Promise<AiProvider[]> {
  const priority = await getProviderPriority();
  const byId = new Map(AI_PROVIDERS.map((p) => [p.id, p]));
  const ordered = priority.map((id) => byId.get(id)).filter((p): p is AiProvider => Boolean(p));
  for (const p of AI_PROVIDERS) if (!ordered.includes(p)) ordered.push(p); // newly-registered providers not yet in saved order
  return ordered;
}

/** Tries each configured provider in admin-set priority order, falling through only on
 * rate_limited/unavailable/network errors. An unknown-kind error (e.g. an invalid API key)
 * is surfaced immediately rather than masked by trying the next provider. */
export async function generateTutorResponse(systemPrompt: string, history: ChatTurn[]): Promise<string> {
  const providers = await resolveOrder();
  let lastError: AiProviderError | undefined;
  for (const provider of providers) {
    if (!provider.isConfigured()) continue;
    try {
      return await provider.generateTutorResponse(systemPrompt, history);
    } catch (error) {
      const classified = error instanceof AiProviderError ? error : new AiProviderError(provider.id, 'unknown', String(error));
      if (!RETRYABLE_KINDS.has(classified.kind)) throw classified;
      lastError = classified;
    }
  }
  throw lastError ?? new AiProviderError('none', 'not_configured', 'No AI provider is configured.');
}

/** Same fallback strategy as generateTutorResponse, but only tries providers that implement
 * embedText (not every provider offers embeddings). */
export async function embedText(text: string, taskType: 'document' | 'query'): Promise<EmbedResult> {
  const providers = await resolveOrder();
  let lastError: AiProviderError | undefined;
  for (const provider of providers) {
    if (!provider.isConfigured() || !provider.embedText) continue;
    try {
      return await provider.embedText(text, taskType);
    } catch (error) {
      const classified = error instanceof AiProviderError ? error : new AiProviderError(provider.id, 'unknown', String(error));
      if (!RETRYABLE_KINDS.has(classified.kind)) throw classified;
      lastError = classified;
    }
  }
  throw lastError ?? new AiProviderError('none', 'not_configured', 'No embedding-capable AI provider is configured.');
}
