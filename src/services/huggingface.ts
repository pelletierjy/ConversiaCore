import type { FunctionDeclaration } from '@google/generative-ai';
import { AiProviderError, type AiProvider, type ChatTurn, type TutorGenerationResult } from './ai-provider';
import {
  HUGGING_FACE_GENERATION_MODEL,
  HUGGING_FACE_MAX_OUTPUT_TOKENS,
  HUGGING_FACE_TEMPERATURE,
  isHuggingFaceConfigured,
} from '../config';
import { postToWorker } from './worker-client';

export const HUGGING_FACE_PROVIDER_ID = 'huggingface';

/** Error classification matching the pattern used by gemini.ts / openrouter.ts. */
function classifyError(error: unknown): AiProviderError {
  if (error instanceof AiProviderError) return error;
  const message = error instanceof Error ? error.message : String(error);
  if (/not_configured/.test(message)) return new AiProviderError(HUGGING_FACE_PROVIDER_ID, 'not_configured', message);
  if (/401|403/.test(message)) return new AiProviderError(HUGGING_FACE_PROVIDER_ID, 'unauthorized', message);
  if (/429/.test(message)) return new AiProviderError(HUGGING_FACE_PROVIDER_ID, 'rate_limited', message);
  if (/5\d\d/.test(message)) return new AiProviderError(HUGGING_FACE_PROVIDER_ID, 'unavailable', message);
  if (/network|timeout|failed to fetch|fetch failed|load failed/i.test(message)) return new AiProviderError(HUGGING_FACE_PROVIDER_ID, 'network', message);
  return new AiProviderError(HUGGING_FACE_PROVIDER_ID, 'unknown', message);
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
      setTimeout(() => reject(new AiProviderError(HUGGING_FACE_PROVIDER_ID, 'network', 'Request timed out.')), REQUEST_TIMEOUT_MS),
    ),
  ]);
}

/** Runs a Hugging Face call with a timeout and a single automatic retry on rate-limit (429) errors. */
async function callHuggingFace<T>(fn: () => Promise<T>): Promise<T> {
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

/** Generates a tutor response via Hugging Face Inference Providers. The worker proxies
 *  the call to keep the API token server-side. */
export async function generateTutorResponse(
  systemPrompt: string,
  history: ChatTurn[],
  tools?: FunctionDeclaration[],
): Promise<TutorGenerationResult> {
  return callHuggingFace(async () => {
    const { text, functionCalls } = await postToWorker<TutorGenerationResult>('/huggingface/chat', {
      systemPrompt,
      history,
      model: HUGGING_FACE_GENERATION_MODEL,
      temperature: HUGGING_FACE_TEMPERATURE,
      maxOutputTokens: HUGGING_FACE_MAX_OUTPUT_TOKENS,
      tools,
    });
    return { text, functionCalls };
  });
}

export const huggingFaceProvider: AiProvider = {
  id: HUGGING_FACE_PROVIDER_ID,
  supportsTools: true,
  isConfigured: isHuggingFaceConfigured,
  generateTutorResponse,
  // No embedText: Hugging Face chat models don't have a direct embeddings endpoint here.
};