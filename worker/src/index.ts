import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import { ChatGroq } from '@langchain/groq';
import { ChatOpenRouter } from '@langchain/openrouter';
import { AIMessage, HumanMessage, SystemMessage, type BaseMessage } from '@langchain/core/messages';

interface Env {
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
}

interface ChatTurn {
  role: 'student' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  systemPrompt: string;
  history: ChatTurn[];
  model: string;
  temperature: number;
  maxOutputTokens: number;
}

interface EmbedRequestBody {
  text: string;
  taskType: 'document' | 'query';
  model: string;
}

const ALLOWED_ORIGINS_EXACT = new Set(['https://pelletierjy.github.io', 'https://scales-viewer.vercel.app']);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS_EXACT.has(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true;
  if (origin.startsWith('http://localhost:')) return true;
  return false;
}

function corsHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function jsonResponse(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

/** Maps an upstream SDK error to an HTTP status the client's existing classifyError() regexes already understand. */
function statusFromError(error: unknown): number {
  const message = error instanceof Error ? error.message : String(error);
  if (/429/.test(message)) return 429;
  if (/5\d\d/.test(message)) return 502;
  return 500;
}

function toLangchainMessages(systemPrompt: string, history: ChatTurn[]): BaseMessage[] {
  return [
    new SystemMessage(systemPrompt),
    ...history.map((turn) => (turn.role === 'student' ? new HumanMessage(turn.content) : new AIMessage(turn.content))),
  ];
}

async function handleGeminiChat(body: ChatRequestBody, apiKey: string): Promise<{ text: string }> {
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: body.model,
    systemInstruction: body.systemPrompt,
    generationConfig: {
      temperature: body.temperature,
      maxOutputTokens: body.maxOutputTokens,
    },
  });
  const contents = body.history.map((turn) => ({
    role: turn.role === 'student' ? 'user' : 'model',
    parts: [{ text: turn.content }],
  }));
  const result = await model.generateContent({ contents });
  return { text: result.response.text() };
}

async function handleGeminiEmbed(body: EmbedRequestBody, apiKey: string): Promise<{ vector: number[]; model: string }> {
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: body.model });
  const result = await model.embedContent({
    content: { role: 'user', parts: [{ text: body.text }] },
    taskType: body.taskType === 'document' ? TaskType.RETRIEVAL_DOCUMENT : TaskType.RETRIEVAL_QUERY,
  });
  return { vector: result.embedding.values, model: body.model };
}

async function handleGroqChat(body: ChatRequestBody, apiKey: string): Promise<{ text: string }> {
  const client = new ChatGroq({
    apiKey,
    model: body.model,
    temperature: body.temperature,
    maxTokens: body.maxOutputTokens,
  });
  const result = await client.invoke(toLangchainMessages(body.systemPrompt, body.history));
  return { text: typeof result.content === 'string' ? result.content : String(result.content) };
}

async function handleOpenRouterChat(body: ChatRequestBody, apiKey: string): Promise<{ text: string }> {
  const client = new ChatOpenRouter(body.model, {
    apiKey,
    temperature: body.temperature,
    maxTokens: body.maxOutputTokens,
  });
  const result = await client.invoke(toLangchainMessages(body.systemPrompt, body.history));
  return { text: typeof result.content === 'string' ? result.content : String(result.content) };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (!isAllowedOrigin(origin)) {
      return jsonResponse({ error: 'origin_not_allowed' }, 403, origin);
    }
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'method_not_allowed' }, 405, origin);
    }

    const { pathname } = new URL(request.url);

    try {
      switch (pathname) {
        case '/gemini/chat': {
          if (!env.GEMINI_API_KEY) return jsonResponse({ error: 'not_configured' }, 503, origin);
          const body = await request.json<ChatRequestBody>();
          return jsonResponse(await handleGeminiChat(body, env.GEMINI_API_KEY), 200, origin);
        }
        case '/gemini/embed': {
          if (!env.GEMINI_API_KEY) return jsonResponse({ error: 'not_configured' }, 503, origin);
          const body = await request.json<EmbedRequestBody>();
          return jsonResponse(await handleGeminiEmbed(body, env.GEMINI_API_KEY), 200, origin);
        }
        case '/groq/chat': {
          if (!env.GROQ_API_KEY) return jsonResponse({ error: 'not_configured' }, 503, origin);
          const body = await request.json<ChatRequestBody>();
          return jsonResponse(await handleGroqChat(body, env.GROQ_API_KEY), 200, origin);
        }
        case '/openrouter/chat': {
          if (!env.OPENROUTER_API_KEY) return jsonResponse({ error: 'not_configured' }, 503, origin);
          const body = await request.json<ChatRequestBody>();
          return jsonResponse(await handleOpenRouterChat(body, env.OPENROUTER_API_KEY), 200, origin);
        }
        default:
          return jsonResponse({ error: 'not_found' }, 404, origin);
      }
    } catch (error) {
      return jsonResponse({ error: 'upstream_error' }, statusFromError(error), origin);
    }
  },
};
