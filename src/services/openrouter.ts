import { ChatOpenRouter } from '@langchain/openrouter';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AiProviderError, type AiProvider, type ChatTurn } from './ai-provider';
import {
  OPENROUTER_API_KEY,
  OPENROUTER_GENERATION_MODEL,
  OPENROUTER_MAX_OUTPUT_TOKENS,
  OPENROUTER_TEMPERATURE,
  isOpenRouterConfigured,
} from '../config';

export const OPENROUTER_PROVIDER_ID = 'openrouter';

let client: ChatOpenRouter | null = null;

function getClient(): ChatOpenRouter {
  if (!isOpenRouterConfigured()) {
    throw new AiProviderError(OPENROUTER_PROVIDER_ID, 'not_configured', 'OpenRouter API key is not configured.');
  }
  if (!client) {
    client = new ChatOpenRouter(OPENROUTER_GENERATION_MODEL, {
      apiKey: OPENROUTER_API_KEY,
      temperature: OPENROUTER_TEMPERATURE,
      maxTokens: OPENROUTER_MAX_OUTPUT_TOKENS,
    });
  }
  return client;
}

function classifyError(error: unknown): AiProviderError {
  if (error instanceof AiProviderError) return error;
  const message = error instanceof Error ? error.message : String(error);
  if (/429/.test(message)) return new AiProviderError(OPENROUTER_PROVIDER_ID, 'rate_limited', message);
  if (/5\d\d/.test(message)) return new AiProviderError(OPENROUTER_PROVIDER_ID, 'unavailable', message);
  if (/network|timeout|fetch failed/i.test(message)) return new AiProviderError(OPENROUTER_PROVIDER_ID, 'network', message);
  return new AiProviderError(OPENROUTER_PROVIDER_ID, 'unknown', message);
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
      setTimeout(
        () => reject(new AiProviderError(OPENROUTER_PROVIDER_ID, 'network', 'Request timed out.')),
        REQUEST_TIMEOUT_MS,
      ),
    ),
  ]);
}

/** Runs an OpenRouter call with a timeout and a single automatic retry on rate-limit (429) errors. */
async function callOpenRouter<T>(fn: () => Promise<T>): Promise<T> {
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
export async function generateTutorResponse(systemPrompt: string, history: ChatTurn[]): Promise<string> {
  return callOpenRouter(async () => {
    const messages = [
      new SystemMessage(systemPrompt),
      ...history.map((turn) => (turn.role === 'student' ? new HumanMessage(turn.content) : new AIMessage(turn.content))),
    ];
    const result = await getClient().invoke(messages);
    return typeof result.content === 'string' ? result.content : String(result.content);
  });
}

export const openRouterProvider: AiProvider = {
  id: OPENROUTER_PROVIDER_ID,
  isConfigured: isOpenRouterConfigured,
  generateTutorResponse,
  // No embedText: OpenRouter's free-tier models here are chat-only, like Groq's.
};
