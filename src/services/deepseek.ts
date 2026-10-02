import type { FunctionDeclaration } from '@google/generative-ai';
import { AiProviderError, type AiProvider, type ChatTurn, type TutorGenerationResult } from './ai-provider';
import { DEEPSEEK_GENERATION_MODEL, DEEPSEEK_MAX_OUTPUT_TOKENS, DEEPSEEK_TEMPERATURE, isDeepSeekConfigured } from '../config';
import { postToWorker } from './worker-client';

export const DEEPSEEK_PROVIDER_ID = 'deepseek';

/** Reused classification + retry helpers — identical pattern to gemini.ts/groq.ts/openrouter.ts. */
function classifyError(error: unknown): AiProviderError {
  if (error instanceof AiProviderError) return error;
  const message = error instanceof Error ? error.message : String(error);
  if (/not_configured/.test(message)) return new AiProviderError(DEEPSEEK_PROVIDER_ID, 'not_configured', message);
  if (/401|403/.test(message)) return new AiProviderError(DEEPSEEK_PROVIDER_ID, 'unauthorized', message);
  if (/429/.test(message)) return new AiProviderError(DEEPSEEK_PROVIDER_ID, 'rate_limited', message);
  if (/5\d\d/.test(message)) return new AiProviderError(DEEPSEEK_PROVIDER_ID, 'unavailable', message);
  if (/network|timeout|failed to fetch|fetch failed|load failed/i.test(message)) return new AiProviderError(DEEPSEEK_PROVIDER_ID, 'network', message);
  return new AiProviderError(DEEPSEEK_PROVIDER_ID, 'unknown', message);
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
      setTimeout(() => reject(new AiProviderError(DEEPSEEK_PROVIDER_ID, 'network', 'Request timed out.')), REQUEST_TIMEOUT_MS),
    ),
  ]);
}

/** Runs a DeepSeek call with a timeout and a single automatic retry on rate-limit (429) errors. */
async function callDeepSeek<T>(fn: () => Promise<T>): Promise<T> {
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

/** DeepSeek API is OpenAI-compatible, so we reuse the same tool-calling contract as OpenRouter.
 *  Tool conversion to OpenAI format is handled server-side in the worker. */
export async function generateTutorResponse(
  systemPrompt: string,
  history: ChatTurn[],
  tools?: FunctionDeclaration[],
): Promise<TutorGenerationResult> {
  return callDeepSeek(async () => {
    const { text, functionCalls } = await postToWorker<TutorGenerationResult>('/deepseek/chat', {
      systemPrompt,
      history,
      model: DEEPSEEK_GENERATION_MODEL,
      temperature: DEEPSEEK_TEMPERATURE,
      maxOutputTokens: DEEPSEEK_MAX_OUTPUT_TOKENS,
      tools,
    });
    return { text, functionCalls };
  });
}

export const deepSeekProvider: AiProvider = {
  id: DEEPSEEK_PROVIDER_ID,
  supportsTools: true,
  isConfigured: isDeepSeekConfigured,
  generateTutorResponse,
  // No embedText: DeepSeek API has no embeddings endpoint. The orchestrator skips this provider for embedding calls.
};