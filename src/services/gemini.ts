import {
  GEMINI_EMBEDDING_MODEL,
  GEMINI_GENERATION_MODEL,
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_TEMPERATURE,
  isGeminiConfigured,
} from '../config';
import type { FunctionCall, FunctionDeclaration } from '@google/generative-ai';
import { AiProviderError, type AiProvider, type ChatTurn, type EmbedResult, type TutorGenerationResult } from './ai-provider';
import { postToWorker } from './worker-client';

export const GEMINI_PROVIDER_ID = 'gemini';

function classifyError(error: unknown): AiProviderError {
  if (error instanceof AiProviderError) return error;
  const message = error instanceof Error ? error.message : String(error);
  if (/not_configured/.test(message)) return new AiProviderError(GEMINI_PROVIDER_ID, 'not_configured', message);
  if (/401|403/.test(message)) return new AiProviderError(GEMINI_PROVIDER_ID, 'unauthorized', message);
  if (/429/.test(message)) return new AiProviderError(GEMINI_PROVIDER_ID, 'rate_limited', message);
  if (/5\d\d/.test(message)) return new AiProviderError(GEMINI_PROVIDER_ID, 'unavailable', message);
  if (/network|timeout|failed to fetch|fetch failed|load failed/i.test(message)) return new AiProviderError(GEMINI_PROVIDER_ID, 'network', message);
  return new AiProviderError(GEMINI_PROVIDER_ID, 'unknown', message);
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
      setTimeout(() => reject(new AiProviderError(GEMINI_PROVIDER_ID, 'network', 'Request timed out.')), REQUEST_TIMEOUT_MS),
    ),
  ]);
}

/** Runs a Gemini call with a timeout and a single automatic retry on rate-limit (429) errors. */
async function callGemini<T>(fn: () => Promise<T>): Promise<T> {
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

/** Generates a tutor response given a system prompt and prior conversation turns. */
export async function generateTutorResponse(
  systemPrompt: string,
  history: ChatTurn[],
  tools?: FunctionDeclaration[],
): Promise<TutorGenerationResult> {
  return callGemini(async () => {
    const { text, functionCalls } = await postToWorker<{ text: string; functionCalls?: FunctionCall[] }>('/gemini/chat', {
      systemPrompt,
      history,
      model: GEMINI_GENERATION_MODEL,
      temperature: GEMINI_TEMPERATURE,
      maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      tools,
    });
    return { text, functionCalls };
  });
}

/** Generates an embedding vector for the given text. */
export async function embedText(text: string, taskType: 'document' | 'query'): Promise<EmbedResult> {
  return callGemini(() =>
    postToWorker<EmbedResult>('/gemini/embed', { text, taskType, model: GEMINI_EMBEDDING_MODEL }),
  );
}

export const geminiProvider: AiProvider = {
  id: GEMINI_PROVIDER_ID,
  supportsTools: true,
  isConfigured: isGeminiConfigured,
  generateTutorResponse,
  embedText,
};
