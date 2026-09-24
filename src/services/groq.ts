import { AiProviderError, type AiProvider, type ChatTurn, type TutorGenerationResult } from './ai-provider';
import { GROQ_GENERATION_MODEL, GROQ_MAX_OUTPUT_TOKENS, GROQ_TEMPERATURE, isGroqConfigured } from '../config';
import { postToWorker } from './worker-client';

export const GROQ_PROVIDER_ID = 'groq';

function classifyError(error: unknown): AiProviderError {
  if (error instanceof AiProviderError) return error;
  const message = error instanceof Error ? error.message : String(error);
  if (/not_configured/.test(message)) return new AiProviderError(GROQ_PROVIDER_ID, 'not_configured', message);
  if (/401|403/.test(message)) return new AiProviderError(GROQ_PROVIDER_ID, 'unauthorized', message);
  if (/429/.test(message)) return new AiProviderError(GROQ_PROVIDER_ID, 'rate_limited', message);
  if (/5\d\d/.test(message)) return new AiProviderError(GROQ_PROVIDER_ID, 'unavailable', message);
  if (/network|timeout|fetch failed/i.test(message)) return new AiProviderError(GROQ_PROVIDER_ID, 'network', message);
  return new AiProviderError(GROQ_PROVIDER_ID, 'unknown', message);
}

const REQUEST_TIMEOUT_MS = 20_000;
const RATE_LIMIT_RETRY_DELAY_MS = 3000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new AiProviderError(GROQ_PROVIDER_ID, 'network', 'Request timed out.')), REQUEST_TIMEOUT_MS),
    ),
  ]);
}

/** Runs a Groq call with a timeout and a single automatic retry on rate-limit (429) errors. */
async function callGroq<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await withTimeout(fn());
  } catch (error) {
    const classified = classifyError(error);
    if (classified.kind === 'rate_limited') {
      await sleep(RATE_LIMIT_RETRY_DELAY_MS);
      try {
        return await withTimeout(fn());
      } catch (retryError) {
        throw classifyError(retryError);
      }
    }
    throw classified;
  }
}

/** Generates a tutor response given a system prompt and prior conversation turns. Groq has no
 *  tool-calling support wired up here yet, so any `tools` param is accepted but ignored. */
export async function generateTutorResponse(systemPrompt: string, history: ChatTurn[]): Promise<TutorGenerationResult> {
  return callGroq(async () => {
    const { text } = await postToWorker<{ text: string }>('/groq/chat', {
      systemPrompt,
      history,
      model: GROQ_GENERATION_MODEL,
      temperature: GROQ_TEMPERATURE,
      maxOutputTokens: GROQ_MAX_OUTPUT_TOKENS,
    });
    return { text };
  });
}

export const groqProvider: AiProvider = {
  id: GROQ_PROVIDER_ID,
  isConfigured: isGroqConfigured,
  generateTutorResponse,
  // No embedText: Groq's API has no embeddings endpoint. The orchestrator skips this
  // provider for embedding calls.
};
