import type { AiProvider } from './ai-provider';
import { geminiProvider, GEMINI_PROVIDER_ID } from './gemini';
import { groqProvider, GROQ_PROVIDER_ID } from './groq';
import { openRouterProvider, OPENROUTER_PROVIDER_ID } from './openrouter';
import { deepSeekProvider, DEEPSEEK_PROVIDER_ID } from './deepseek';
import { huggingFaceProvider, HUGGING_FACE_PROVIDER_ID } from './huggingface';

export const AI_PROVIDERS: AiProvider[] = [geminiProvider, groqProvider, openRouterProvider, deepSeekProvider, huggingFaceProvider];
export const DEFAULT_PROVIDER_PRIORITY: string[] = AI_PROVIDERS.map((p) => p.id);

/** Human-readable provider/model names for a given provider id, for display in the UI. */
export const PROVIDER_DISPLAY: Record<string, { provider: string; model: string }> = {
  [GEMINI_PROVIDER_ID]: { provider: 'Google', model: 'Gemini' },
  [GROQ_PROVIDER_ID]: { provider: 'Groq', model: 'Llama 3.3 70B' },
  [OPENROUTER_PROVIDER_ID]: { provider: 'OpenRouter', model: 'Auto (Free)' },
  [DEEPSEEK_PROVIDER_ID]: { provider: 'DeepSeek', model: 'deepseek-chat' },
  [HUGGING_FACE_PROVIDER_ID]: { provider: 'Hugging Face', model: 'Qwen3-235B-A22B' },
};
