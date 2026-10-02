import { GoogleGenerativeAI, TaskType, type FunctionCall, type FunctionDeclaration } from '@google/generative-ai';
import { ChatGroq } from '@langchain/groq';
import { ChatOpenRouter } from '@langchain/openrouter';
import { AIMessage, HumanMessage, SystemMessage, type BaseMessage } from '@langchain/core/messages';

interface Env {
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  HUGGING_FACE_API_KEY?: string;
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
  /** Gemini-style function declarations the model may call. Ignored by the Groq handler;
   *  the OpenRouter and DeepSeek handlers convert them to OpenAI-style tool defs before binding. */
  tools?: FunctionDeclaration[];
}

interface EmbedRequestBody {
  text: string;
  taskType: 'document' | 'query';
  model: string;
}

const ALLOWED_ORIGINS_EXACT = new Set(['https://pelletierjy.github.io', 'https://scales-viewer.vercel.app', 'https://homework-tutora.vercel.app']);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS_EXACT.has(origin)) return true;
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

/** Maps an upstream SDK error to an HTTP status the client understands.
 *  401/403 → passed through so the orchestrator can skip providers with bad keys.
 *  429 → passed through for rate-limit backoff.
 *  5xx → mapped to 502 (Bad Gateway) to indicate upstream trouble.
 *  everything else → 500.
 */
function statusFromError(error: unknown): number {
  const message = error instanceof Error ? error.message : String(error);
  if (/401|403/.test(message)) return 401;
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

/** Converts chat turns to OpenAI-compatible message format. */
function toOpenAiChatFormat(systemPrompt: string, history: ChatTurn[]): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [{ role: 'system', content: systemPrompt }];
  for (const turn of history) {
    messages.push({
      role: turn.role === 'student' ? 'user' : 'assistant',
      content: turn.content,
    });
  }
  return messages;
}

/** Gemini's FunctionDeclaration.parameters is already OpenAPI/JSON-Schema-shaped (SchemaType's
 *  values are the lowercase JSON Schema type strings), so this is a wrapping, not a translation. */
function toOpenAiTools(tools: FunctionDeclaration[]): Record<string, unknown>[] {
  return tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters ?? { type: 'object', properties: {} },
    },
  }));
}

/** Safely parse JSON, returning undefined on failure. */
function safeJsonParse(text: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

async function handleGeminiChat(body: ChatRequestBody, apiKey: string): Promise<{ text: string; functionCalls?: FunctionCall[] }> {
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: body.model,
    systemInstruction: body.systemPrompt,
    generationConfig: {
      temperature: body.temperature,
      maxOutputTokens: body.maxOutputTokens,
    },
    tools: body.tools?.length ? [{ functionDeclarations: body.tools }] : undefined,
  });
  const contents = body.history.map((turn) => ({
    role: turn.role === 'student' ? 'user' : 'model',
    parts: [{ text: turn.content }],
  }));
  // Gemini rejects an empty contents array. This can happen on the first turn
  // if the client sends history: [] (e.g. admin-panel smoke test).
  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: '' }] });
  }
  const result = await model.generateContent({ contents });
  return { text: result.response.text(), functionCalls: result.response.functionCalls() };
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

/** DeepSeek API is fully OpenAI-compatible. We call the REST endpoint directly to avoid
 *  bundling the OpenAI SDK, keeping the worker payload small. Tool-calling is supported
 *  via OpenAI-format function definitions. */
async function handleDeepSeekChat(body: ChatRequestBody, apiKey: string): Promise<{ text: string; functionCalls?: FunctionCall[] }> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: body.model,
      messages: toOpenAiChatFormat(body.systemPrompt, body.history),
      temperature: body.temperature,
      max_tokens: body.maxOutputTokens,
      tools: body.tools?.length ? toOpenAiTools(body.tools) : undefined,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown');
    throw new Error(`${response.status} ${errorText}`);
  }
  const data = await response.json<{
    choices: Array<{
      message: {
        content?: string;
        tool_calls?: Array<{
          id: string;
          type: 'function';
          function: { name: string; arguments: string };
        }>;
      };
    }>;
  }>();
  const choice = data.choices[0];
  if (!choice) throw new Error('DeepSeek API returned no choices');
  const text = choice.message.content || '';
  const functionCalls = choice.message.tool_calls?.map((call) => ({
    name: call.function.name,
    args: safeJsonParse(call.function.arguments),
  }));
  return { text, functionCalls };
}

async function handleOpenRouterChat(body: ChatRequestBody, apiKey: string): Promise<{ text: string; functionCalls?: FunctionCall[] }> {
  const client = new ChatOpenRouter(body.model, {
    apiKey,
    temperature: body.temperature,
    maxTokens: body.maxOutputTokens,
  });
  // "openrouter/free" auto-routes across whichever free model serves the request, and not
  // every free model supports tool-calling — binding tools it doesn't support degrades to a
  // prose-only reply rather than an error, same fallback behavior as an unconfigured provider.
  const runnable = body.tools?.length ? client.bindTools(toOpenAiTools(body.tools)) : client;
  const result = await runnable.invoke(toLangchainMessages(body.systemPrompt, body.history));
  return {
    text: typeof result.content === 'string' ? result.content : String(result.content),
    functionCalls: result.tool_calls?.length
      ? result.tool_calls.map((call) => ({ name: call.name, args: call.args }))
      : undefined,
  };
}

/** Hugging Face Inference Providers API is OpenAI-compatible via router.huggingface.co/v1.
 *  We call the REST endpoint directly (no SDK), keeping the worker payload small. */
async function handleHuggingFaceChat(body: ChatRequestBody, apiKey: string): Promise<{ text: string; functionCalls?: FunctionCall[] }> {
  const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: body.model,
      messages: toOpenAiChatFormat(body.systemPrompt, body.history),
      temperature: body.temperature,
      max_tokens: body.maxOutputTokens,
      tools: body.tools?.length ? toOpenAiTools(body.tools) : undefined,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown');
    throw new Error(`${response.status} ${errorText}`);
  }
  const data = await response.json<{
    choices: Array<{
      message: {
        content?: string;
        tool_calls?: Array<{
          id: string;
          type: 'function';
          function: { name: string; arguments: string };
        }>;
      };
    }>;
  }>();
  const choice = data.choices[0];
  if (!choice) throw new Error('Hugging Face API returned no choices');
  const text = choice.message.content || '';
  const functionCalls = choice.message.tool_calls?.map((call) => ({
    name: call.function.name,
    args: safeJsonParse(call.function.arguments),
  }));
  return { text, functionCalls };
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
        case '/deepseek/chat': {
          if (!env.DEEPSEEK_API_KEY) return jsonResponse({ error: 'not_configured' }, 503, origin);
          const body = await request.json<ChatRequestBody>();
          return jsonResponse(await handleDeepSeekChat(body, env.DEEPSEEK_API_KEY), 200, origin);
        }
        case '/huggingface/chat': {
          if (!env.HUGGING_FACE_API_KEY) return jsonResponse({ error: 'not_configured' }, 503, origin);
          const body = await request.json<ChatRequestBody>();
          return jsonResponse(await handleHuggingFaceChat(body, env.HUGGING_FACE_API_KEY), 200, origin);
        }
        default:
          return jsonResponse({ error: 'not_found' }, 404, origin);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      return jsonResponse({ error: 'upstream_error', detail }, statusFromError(error), origin);
    }
  },
};