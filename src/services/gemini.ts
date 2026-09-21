import { GoogleGenerativeAI, TaskType, type Content } from '@google/generative-ai';
import {
  GEMINI_API_KEY,
  GEMINI_EMBEDDING_MODEL,
  GEMINI_GENERATION_MODEL,
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_TEMPERATURE,
  isGeminiConfigured,
} from '../config';

export type GeminiErrorKind = 'not_configured' | 'rate_limited' | 'unavailable' | 'network' | 'unknown';

export class GeminiError extends Error {
  constructor(public readonly kind: GeminiErrorKind, message: string) {
    super(message);
    this.name = 'GeminiError';
  }
}

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!isGeminiConfigured()) {
    throw new GeminiError('not_configured', 'Gemini API key is not configured.');
  }
  if (!client) {
    client = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return client;
}

function classifyError(error: unknown): GeminiError {
  if (error instanceof GeminiError) return error;
  const message = error instanceof Error ? error.message : String(error);
  if (/429/.test(message)) return new GeminiError('rate_limited', message);
  if (/5\d\d/.test(message)) return new GeminiError('unavailable', message);
  if (/network|timeout|fetch failed/i.test(message)) return new GeminiError('network', message);
  return new GeminiError('unknown', message);
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
      setTimeout(() => reject(new GeminiError('network', 'Request timed out.')), REQUEST_TIMEOUT_MS),
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

export interface ChatTurn {
  role: 'student' | 'assistant';
  content: string;
}

/** Generates a tutor response given a system prompt and prior conversation turns. */
export async function generateTutorResponse(systemPrompt: string, history: ChatTurn[]): Promise<string> {
  return callGemini(async () => {
    const model = getClient().getGenerativeModel({
      model: GEMINI_GENERATION_MODEL,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: GEMINI_TEMPERATURE,
        maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      },
    });

    const contents: Content[] = history.map((turn) => ({
      role: turn.role === 'student' ? 'user' : 'model',
      parts: [{ text: turn.content }],
    }));

    const result = await model.generateContent({ contents });
    return result.response.text();
  });
}

/** Generates an embedding vector for the given text. */
export async function embedText(text: string, taskType: 'document' | 'query'): Promise<number[]> {
  return callGemini(async () => {
    const model = getClient().getGenerativeModel({ model: GEMINI_EMBEDDING_MODEL });
    const result = await model.embedContent({
      content: { role: 'user', parts: [{ text }] },
      taskType: taskType === 'document' ? TaskType.RETRIEVAL_DOCUMENT : TaskType.RETRIEVAL_QUERY,
    });
    return result.embedding.values;
  });
}
