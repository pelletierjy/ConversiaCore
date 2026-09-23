import type { AiProvider } from './ai-provider';
import { geminiProvider } from './gemini';
import { groqProvider } from './groq';
import { openRouterProvider } from './openrouter';

export const AI_PROVIDERS: AiProvider[] = [geminiProvider, groqProvider, openRouterProvider];
export const DEFAULT_PROVIDER_PRIORITY: string[] = AI_PROVIDERS.map((p) => p.id);
