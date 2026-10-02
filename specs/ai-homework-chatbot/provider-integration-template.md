# Provider Integration Template & Checklist

> **Purpose**: Authoritative reference for adding a new free-tier LLM provider (e.g. DeepSeek,
> Together, Cohere, Hugging Face) to ConversiaCore. This is a *template + checklist only* — no
> code has been changed. The repo root in references below is `/d/repos/conversia-core`.
>
> **Note on the task prompt**: there is **no** `src/providers/` directory in this repo. Provider
> logic lives in `src/services/` (one module per provider), registered from
> `src/services/ai-provider-registry.ts`. File references below reflect the real layout.

---

## 1. Architecture Overview (layers, call order)

```
UI layer
  chat-view.ts  ──reads PROVIDER_DISPLAY[result.providerId] to show "Provider / Model"
  ai-providers-panel.ts (admin) ──reorders AI_PROVIDERS; saves aiProviderPriority to Firestore
  homework.ts ──calls orchestrator; tags reply with providerId

Orchestration layer
  ai-orchestrator.ts ──generateTutorResponse / embedText
    → resolves priority order (admin priority + registry fallback)
    → tries providers in order, falls through ONLY on retryable errors
    → forwards `tools` only to providers where supportsTools === true

Provider layer  (one file per provider, src/services/)
  ai-provider.ts     ──interface AiProvider, AiProviderError, ChatTurn, EmbedResult, TutorGenerationResult
  ai-provider-config.ts ──getProviderPriority() (admin order, Firestore-backed, 60s cache)
  gemini.ts / groq.ts / openrouter.ts ──each: *_PROVIDER_ID, classifyError, withTimeout, retry, postToWorker
  ai-provider-registry.ts ──AI_PROVIDERS[], DEFAULT_PROVIDER_PRIORITY, PROVIDER_DISPLAY

Client config layer
  config.ts ──model constants + isXConfigured() (currently just `Boolean(WORKER_BASE_URL)`)
  worker-client.ts ──postToWorker(path, body) generic POST to WORKER_BASE_URL

Server proxy layer
  worker/src/index.ts ──Cloudflare Worker; routes + CORS allowlist + status mapping

Data layer
  db/firebase.ts ──appConfigDoc() → appConfig/global (stores adminPinHash, aiProviderPriority, …)
  models/types.ts ──AppConfig interface
```

**Key invariant**: the browser client **never** holds provider API keys. Every provider call is a
`postToWorker('/<provider>/chat' | '/<provider>/embed', {...})` to the Cloudflare Worker, which
holds the keys as **Worker secrets** and invokes the provider SDK server-side.

---

## 2. Where provider settings live (file inventory)

| Concern | File(s) | What to add/edit |
|---|---|---|
| Provider **identity + contract** | `src/services/ai-provider.ts` | `AiProvider` interface, `AiProviderError`, error kinds, `TutorGenerationResult`. **(No change needed per provider — the interface is generic.)** |
| Provider **registration + priority + UI display** | `src/services/ai-provider-registry.ts` | Add `import`, push to `AI_PROVIDERS`, add a `PROVIDER_DISPLAY[id]` entry. |
| Provider **runtime impl** | `src/services/<provider>.ts` (new file per provider) | `*_PROVIDER_ID`, `classifyError`, timeout/retry, `generateTutorResponse`, optional `embedText`, export an `AiProvider` object. |
| Provider **constants** (model name, temp, max tokens, embed dim) | `src/config.ts` | Add `<PROVIDER>_*` constants + `is<Provider>Configured()`. |
| **Worker routing + SDK call** | `worker/src/index.ts` | Add `<PROVIDER>_API_KEY` to `Env`; add a `switch` case + `handle<Provider>Chat` (and `…Embed` if applicable); route path `/<provider>/chat`. |
| **Worker secrets** (deploy/CI) | `worker/package.json` (`secrets` script) **+** README "Setup" + GitHub Actions secrets | Document the new secret name; CI injects at build. |
| **Admin UI reorder list** | `src/ui/admin/ai-providers-panel.ts` | No change — reads `AI_PROVIDERS` dynamically. (Only UI display name comes from `PROVIDER_DISPLAY`.) |
| **Chat footer "provider/model" badge** | `src/ui/chat/chat-view.ts` + `src/services/ai-provider-registry.ts` | `PROVIDER_DISPLAY` entry drives the badge text. |
| **Admin-priority persistence schema** | `src/models/types.ts` (`AppConfig`) | `aiProviderPriority?: string[]` already generic — **no change**; new id is just a string in the array. |
| **Admin "Settings" help text** | `src/i18n/translations.ts` | No structural change, but `aiProviderWarning`/`providerLabel`/`modelLabel` are locale strings (already generic). |

> The provider-priority schema (`AppConfig.aiProviderPriority: string[]`) is intentionally an
> **opaque list of provider ids** — it carries no per-provider config. Provider capability
> details (supportsTools, has embeddings) come from the `AiProvider` interface at runtime, not the
> stored schema. This is a deliberate design that makes adding a provider a **1-field** schema change.

---

## 3. Cloudflare Worker proxy: routing & rate-limiting

`worker/src/index.ts` is a single `fetch` handler with a `switch (pathname)`:

- **CORS**: `ALLOWED_ORIGINS_EXACT` allowlist (GitHub Pages + localhost). `OPTIONS` → 204 with
  CORS headers; non-allowlisted origin → `403 origin_not_allowed`.
- **Auth gate**: only `POST` allowed, else `405`.
- **Dispatch** (each case): if `!env.<PROVIDER>_API_KEY` → `503 not_configured` (so the client
  orchestrator's `not_configured` branch skips it); otherwise `await handle<Provider>(body, key)`.
- **Routes today**: `/gemini/chat`, `/gemini/embed`, `/groq/chat`, `/openrouter/chat`.
- **Error → status mapping** (`statusFromError`): `401/403` → pass-through (orchestrator skips),
  `429` → pass-through (rate-limit backoff), `5xx` → `502` (Bad Gateway), else `500`.
- **Env**: keys are **Worker secrets**, not `wrangler.toml [vars]`. Set via
  `wrangler secret put <KEY>` (see `worker/package.json` `secrets` script). No `[vars]` table exists.

### Rate-limiting behavior — **READ THIS**

The README (p. 6) *claims* the worker "manages API keys, **token budgeting**, and provider
failover", but the actual `worker/src/index.ts` does **NOT** implement token budgeting or any
rate-limit throttling. Observed rate-limit handling:

1. **Per-provider retry** (client-side): each provider module (`gemini.ts`, `groq.ts`,
   `openrouter.ts`) retries **once** after `RATE_LIMIT_RETRY_DELAY_MS` (3000ms) on `429`, via its
   `call<Provider>` wrapper + `withTimeout` race (20s timeout).
2. **Cross-provider fallback** (orchestrator): on a retryable error (`rate_limited`, `unavailable`,
   `network`, `unauthorized`, `not_configured`), the orchestrator moves to the **next provider** in
   priority order. `unknown` errors surface immediately (not masked).
3. **No central rate-limiter** in the worker — there is no token bucket / budget / per-origin
   throttle. A new provider inherits this same behavior automatically if it follows the template.

> **Gap to flag**: if a future provider needs stricter free-tier limits (e.g. DeepSeek free has
> tight RPM), add an optional `rateLimit` field to the `AiProvider` interface and a per-provider
> throttle in the worker. The current template does **not** require it.

---

## 4. The integration pattern (template / schema)

Every provider follows the same shape. The template is split into **shared utilities** (should be
hoisted to avoid duplication) and **per-provider specifics**.

### 4a. Shared utilities (extract to a single file, e.g. `src/services/ai-provider-utils.ts`)

The three existing providers duplicate this verbatim. A new provider should **reuse** these
helpers rather than re-declaring them.

```ts
// src/services/ai-provider-utils.ts  (PROPOSED shared module — not yet created)
import { AiProviderError, type AiProviderErrorKind } from './ai-provider';

/** Retryable error kinds the orchestrator will fall through on. */
export const RETRYABLE_KINDS = new Set<AiProviderErrorKind>(
  ['not_configured', 'unauthorized', 'rate_limited', 'unavailable', 'network']
);

/** Classify a raw upstream error into an AiProviderError of the given provider id.
 *  Override the regex thresholds per-provider if their error formats differ from the
 *  conventional HTTP-status-in-message convention used today. */
export function classifyError(providerId: string, error: unknown): AiProviderError {
  if (error instanceof AiProviderError) return error;
  const message = error instanceof Error ? error.message : String(error);
  if (/not_configured/.test(message))   return new AiProviderError(providerId, 'not_configured', message);
  if (/401|403/.test(message))           return new AiProviderError(providerId, 'unauthorized', message);
  if (/429/.test(message))               return new AiProviderError(providerId, 'rate_limited', message);
  if (/5\d\d/.test(message))             return new AiProviderError(providerId, 'unavailable', message);
  if (/network|timeout|failed to fetch|fetch failed|load failed/i.test(message))
    return new AiProviderError(providerId, 'network', message);
  return new AiProviderError(providerId, 'unknown', message);
}

const REQUEST_TIMEOUT_MS = 20_000;
const RATE_LIMIT_RETRY_DELAY_MS = 3000;

function sleep(ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export function withTimeout<T>(promise: Promise<T>, providerId: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new AiProviderError(providerId, 'network', 'Request timed out.')), REQUEST_TIMEOUT_MS)
    ),
  ]);
}

/** One retry on 429 (rate_limited), with the standard 3s backoff. Pass the per-provider fetch. */
export async function callWithRetry<T>(
  providerId: string, fn: () => Promise<T>
): Promise<T> {
  try {
    return await withTimeout(fn(), providerId);
  } catch (error) {
    const classified = classifyError(providerId, error);
    if (classified.kind === 'rate_limited') {
      await sleep(RATE_LIMIT_RETRY_DELAY_MS);
      try { return await withTimeout(fn(), providerId); }
      catch (retryError) { throw classifyError(providerId, retryError); }
    }
    throw classified;
  }
}
```

### 4b. Per-provider module template (`src/services/<provider>.ts`)

Replace `PROVIDER` / `Provider` placeholders. Decision points are marked `[CHOICE]`.

```ts
import { postToWorker } from './worker-client';
import { AiProviderError, type AiProvider, type ChatTurn, type EmbedResult, type TutorGenerationResult } from './ai-provider';
import { callWithRetry } from './ai-provider-utils';   // ← hoisted helper (Section 4a)
import { isConfigured, GENERATION_MODEL, TEMPERATURE, MAX_OUTPUT_TOKENS, EMBEDDING_MODEL, EMBEDDING_DIM } from '../config';
import type { FunctionCall, FunctionDeclaration } from '@google/generative-ai'; // re-use Gemini types for FunctionDeclaration shape

export const PROVIDER_PROVIDER_ID = '<provider>'; // [CHOICE] e.g. 'deepseek'

/** Generates a tutor response. */
export async function generateTutorResponse(
  systemPrompt: string,
  history: ChatTurn[],
  tools?: FunctionDeclaration[],
): Promise<TutorGenerationResult> {
  return callWithRetry(PROVIDER_PROVIDER_ID, async () => {
    return postToWorker<...>('/<provider>/chat', {
      systemPrompt, history,
      model: GENERATION_MODEL,
      temperature: TEMPERATURE,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      [CHOICE: include `tools` only if supportsTools]
    });
  });
}

/** Optional: embeddings. Omit if the provider has no embed endpoint. */
export async function embedText(text: string, taskType: 'document' | 'query'): Promise<EmbedResult> {
  return callWithRetry(PROVIDER_PROVIDER_ID, () =>
    postToWorker<EmbedResult>('/<provider>/embed', { text, taskType, model: EMBEDDING_MODEL }),
  );
}

export const <provider>Provider: AiProvider = {
  id: PROVIDER_PROVIDER_ID,
  supportsTools: [CHOICE: true | false],  // false → orchestrator omits `tools`
  isConfigured,
  generateTutorResponse,
  [CHOICE: omit embedText if not supported],
};
```

**Provider-specific decision matrix** (fill while designing each provider):

| Decision | How to decide | Existing examples |
|---|---|---|
| Route path | `/<provider>/chat` (+ `/<provider>/embed` if embeddings) | `/gemini/chat`, `/groq/chat`, `/openrouter/chat` |
| Tools support | Does provider accept OpenAI-style `tools` and return tool_calls? | Gemini ✓, Groq ✗(ignored), OpenRouter ✓ |
| Embeddings | Does provider have a usable embedding endpoint in free tier? | Gemini ✓, Groq ✗, OpenRouter ✗ |
| `isConfigured()` | Currently binary (`Boolean(WORKER_BASE_URL)`); could tighten to per-key check in worker. | All three identical today. |
| SDK in worker | Use a LangChain provider client if one exists, else raw `fetch` to the provider's OpenAI-compatible REST endpoint. | `ChatGroq`, `ChatOpenRouter`; DeepSeek/Together are OpenAI-compatible → raw fetch or `@langchain/openai`. |
| Error format | Match on `status`/`message` regex in `classifyError`. Free providers usually return OpenAI-shaped errors. | — |

### 4c. Worker handler template (`worker/src/index.ts`)

Additive only — slot into the existing `switch` and `Env`:

```ts
// 1. Env interface — add one field per provider (secret, not in wrangler.toml)
interface Env {
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  PROVIDER_API_KEY?: string;   // ← NEW secret
}

// 2. Handler function — pick SDK vs raw fetch based on Section 4b decision matrix
async function handle<Provider>Chat(body: ChatRequestBody, apiKey: string): Promise<{text:string; functionCalls?:FunctionCall[]}> {
  // Option A (LangChain, e.g. Together): new ChatTogether({ apiKey, model: body.model, ... }).invoke(msgs)
  // Option B (raw OpenAI-compatible fetch, e.g. DeepSeek): POST https://api.deepseek.com/v1/chat/completions
  //   with the OpenAI message/tool shape; map response.choices[0].message back to TutorGenerationResult.
}

async function handle<Provider>Embed(body: EmbedRequestBody, apiKey: string): Promise<{vector:number[]; model:string}> {
  // optional — omit case below if no embeddings
}

// 3. Switch cases
        case '/<provider>/chat': {
          if (!env.PROVIDER_API_KEY) return jsonResponse({ error: 'not_configured' }, 503, origin);
          const body = await request.json<ChatRequestBody>();
          return jsonResponse(await handle<Provider>Chat(body, env.PROVIDER_API_KEY), 200, origin);
        }
        case '/<provider>/embed': {           // ← omit if no embeddings
          if (!env.PROVIDER_API_KEY) return jsonResponse({ error: 'not_configured' }, 503, origin);
          const body = await request.json<EmbedRequestBody>();
          return jsonResponse(await handle<Provider>Embed(body, env.PROVIDER_API_KEY), 200, origin);
        }
```

### 4d. Registry + config registration template

```ts
// src/services/ai-provider-registry.ts
import { <provider>Provider, PROVIDER_PROVIDER_ID } from './<provider>';
export const AI_PROVIDERS: AiProvider[] = [geminiProvider, groqProvider, openRouterProvider, <provider>Provider];

export const PROVIDER_DISPLAY: Record<string, { provider: string; model: string }> = {
  [GEMINI_PROVIDER_ID]: { provider: 'Google', model: 'Gemini' },
  [GROQ_PROVIDER_ID]:  { provider: 'Groq',  model: 'Llama 3.3 70B' },
  [OPENROUTER_PROVIDER_ID]: { provider: 'OpenRouter', model: 'Auto (Free)' },
  [PROVIDER_PROVIDER_ID]: { provider: '<Human Name>', model: '<default/free model>' },  // ← NEW
};

// src/config.ts
export const PROVIDER_GENERATION_MODEL = '<model-id>';   // [CHOICE]
export const PROVIDER_TEMPERATURE = 0.7;
export const PROVIDER_MAX_OUTPUT_TOKENS = 2048;
export const PROVIDER_API_KEY = '';  // not used client-side; placeholder for symmetry / .env.example
export const PROVIDER_EMBEDDING_MODEL = '<embed-model>';  // if applicable
export const PROVIDER_EMBEDDING_DIMENSION = 1024;          // if applicable
export function is<Provider>Configured(): boolean { return Boolean(WORKER_BASE_URL); }
```

---

## 5. Step-by-step integration checklist

> Each top-level step maps to the file(s) in Section 2. Order: client contract → config → client
> impl → worker → registry/UI → secrets/deploy → admin.

### Phase A — Provider definition & client wiring (no server yet)

1. **Create `src/services/<provider>.ts`** from the Section 4b template.
   - [ ] Choose route path `/<provider>/chat` (+ `/embed`?).
   - [ ] Set `supportsTools` (`true` if OpenAI-compatible tool-call response).
   - [ ] Include `embedText` only if the provider offers embeddings.
   - [ ] Wire error classification to `callWithRetry` (Section 4a); override regexes if the
        provider's error shape differs.
   - [ ] Import your constants from `../config` and `postToWorker` from `./worker-client`.

2. **Add constants to `src/config.ts`** (Section 4d).
   - [ ] `PROVIDER_GENERATION_MODEL`, `PROVIDER_TEMPERATURE`, `PROVIDER_MAX_OUTPUT_TOKENS`.
   - [ ] `PROVIDER_EMBEDDING_MODEL` + `PROVIDER_EMBEDDING_DIMENSION` (if embeddings).
   - [ ] `is<Provider>Configured()` — keep `Boolean(WORKER_BASE_URL)` to match current parity,
        OR tighten to per-key if you add per-key client checks later (flag as a deliberate choice).
   - [ ] Update the retired-model verification comment block to record the live-checked date for the new model.

3. **Register in `src/services/ai-provider-registry.ts`** (Section 4d).
   - [ ] `import { <provider>Provider, PROVIDER_PROVIDER_ID }`.
   - [ ] Push to `AI_PROVIDERS` array.
   - [ ] Add `PROVIDER_DISPLAY[PROVIDER_PROVIDER_ID]` entry (drives the admin reorder list + chat
        footer badge).

4. **Verify the orchestrator needs no change.**
   - [ ] `src/services/ai-orchestrator.ts` resolves priority from `DEFAULT_PROVIDER_PRIORITY` and
        falls through on retryable errors — automatically picks up the new provider. No edit needed.
   - [ ] `AppConfig.aiProviderPriority` (`src/models/types.ts`) is an opaque string[]; no schema
        migration required.

### Phase B — Worker proxy (the keys & routing)

5. **Add the Env secret field in `worker/src/index.ts`.**
   - [ ] Add `PROVIDER_API_KEY?: string` to the `Env` interface.

6. **Add the worker handler(s).**
   - [ ] `handle<Provider>Chat(body, apiKey)` — LangChain client (`ChatTogether`, etc.) if one exists,
        else raw `fetch` to the OpenAI-compatible endpoint.
   - [ ] Map response → `{ text, functionCalls? }` matching `TutorGenerationResult` (for tool-supporting providers,
        translate `tool_calls` → `{ name, args }` like OpenRouter does).
   - [ ] `handle<Provider>Embed` (if applicable) → `{ vector, model }`.

7. **Add the routing `switch` cases.**
   - [ ] `case '/<provider>/chat'`: key-gate `503 not_configured`, parse `ChatRequestBody`, respond.
   - [ ] `case '/<provider>/embed'` (if embeddings): same pattern with `EmbedRequestBody`.

8. **Status mapping** — reuse the existing `statusFromError`; OpenAI-compatible errors already
   surface `401/403/429/5xx` in messages, so the regexes match. Flag if a provider uses an
   unusual status encoding.

### Phase C — Rate-limiting & optional hardening

9. **Rate-limit strategy** (Section 3 gap).
   - [ ] Free-tier free tiers (e.g. DeepSeek, Together) often have tight RPM limits. Decide:
        rely on the existing single 429-retry + orchestrator fallback (status quo), OR add an
        optional `rateLimit` cap to the `AiProvider` interface + a worker-side throttle.
   - [ ] If adding tool-call support for the first time on an OpenAI-compatible provider, test the
        `toOpenAiTools` translation in the worker (already exists for OpenRouter).

### Phase D — Secrets, CI/CD, env

10. **Worker secrets.**
    - [ ] `wrangler secret put PROVIDER_API_KEY` (manual / CI).
    - [ ] Add the secret name to `worker/package.json` → `secrets` script text.

11. **`.env.example`.**
    - [ ] Add a commented `# <PROVIDER>_API_KEY=` line with a doc link (free-tier signup URL) —
        informational, since the client never holds provider keys.

12. **Cloudflare Worker secrets** (deploy the worker separately from the client).
    - [ ] The client SPA (deployed to GitHub Pages via `.github/workflows/deploy.yml`) only injects
        `VITE_*` vars; **provider API keys are Worker secrets**, not GitHub Actions secrets.
    - [ ] Set the secret via `wrangler secret put PROVIDER_API_KEY` (see `worker/package.json`
        `secrets` script) when publishing the worker with `wrangler deploy`.
    - [ ] Update that `secrets` script text to list the new secret name.
    - [ ] Confirm `VITE_WORKER_BASE_URL` (a GitHub Actions secret) points at the Worker route —
        this is the only `VITE_*` var the provider depends on, because `isConfigured()` is
        currently `Boolean(WORKER_BASE_URL)`.

### Phase E — Admin & UI verification

13. **Admin UI** (`src/ui/admin/ai-providers-panel.ts`).
    - [ ] No code change — the reorder list is driven by `AI_PROVIDERS.length`. Confirm the new
        provider appears and is draggable.

14. **Chat footer badge** (`src/ui/chat/chat-view.ts`).
    - [ ] Driven by `PROVIDER_DISPLAY[result.providerId]`. Confirm your `provider`/`model` labels
        render; if `PROVIDER_DISPLAY` lacks your id, it falls back to `Model: <providerId>`.

15. **Smoke test** the fallback chain.
    - [ ] With only the new provider's worker key set, the orchestrator should try it first.
    - [ ] With it returning `429`, confirm the 3s retry then orchestrator fallback to the next
        provider in `DEFAULT_PROVIDER_PRIORITY`.
    - [ ] Confirm `unknown`-kind errors still surface (no masking) per the orchestrator contract.

### Phase F — Documentation & guardrails (task-adjacent)

16. **Cross-reference sibling research** (running in parallel this cycle).
    - [ ] When the free-tier research agent reports a provider's limits/URL, update the
        `provider-integration-template.md` notes + `.env.example` doc link + README provider table.
    - [ ] When the child-safety agent reports safety findings, confirm the new provider's
        free-tier models respect the host system prompt + guardrails (the worker forwards
        `systemPrompt` as `systemInstruction`/`system_message` for every provider — verify per SDK).

---

## 6. Ready-to-add provider scaffold (minimal checklist)

For a quick free-tier chat-only provider (e.g. DeepSeek, Together) with no embeddings & with
tool-calling — check each:

- [ ] `src/config.ts`: `<PROVIDER>_GENERATION_MODEL`, `_TEMPERATURE`, `_MAX_OUTPUT_TOKENS`, `is<Provider>Configured()`
- [ ] `src/services/<provider>.ts`: `PROVIDER_PROVIDER_ID`, `generateTutorResponse` → `/<provider>/chat`, `<provider>Provider` object (`supportsTools: true`)
- [ ] `src/services/ai-provider-registry.ts`: import, push to `AI_PROVIDERS`, `PROVIDER_DISPLAY` entry
- [ ] `worker/src/index.ts`: `Env.PROVIDER_API_KEY`, `handle<Provider>Chat`, `case '/<provider>/chat'`
- [ ] `worker/package.json`: `secrets` script text
- [ ] `.env.example`: `# <PROVIDER>_API_KEY=` line
- [ ] GitHub Actions secret: `<PROVIDER>_API_KEY`
- [ ] No edits needed: `ai-provider.ts`, `ai-orchestrator.ts`, `models/types.ts`, `ai-providers-panel.ts`, `chat-view.ts` (auto-driven)

---

## 7. Architectural smells worth a follow-up refactor (optional, not blocking)

1. **Duplication**: `classifyError`, `withTimeout`, `sleep`, `call<Provider>`, `REQUEST_TIMEOUT_MS`,
   `RATE_LIMIT_RETRY_DELAY_MS` are copy-pasted in all three provider modules. Hoisting to a shared
   `ai-provider-utils.ts` (Section 4a) would cut ~40 lines/provider and centralize retry policy.
2. **Binary `isConfigured`**: every `isXConfigured()` returns `Boolean(WORKER_BASE_URL)`, so the
   client cannot distinguish "worker deployed but key missing" from "fully ready" — that's handled
   server-side via the `503 not_configured` gate. If you want a true per-provider ready check,
   expose a `/<provider>/status` endpoint.
3. **README vs. code drift**: README says the worker does "token budgeting"; it does not. Either
   implement it or update the README to avoid misleading future integrators.
4. **No tests** exist for providers (`tests/unit/` covers cosine similarity + PIN hashing only). A
   new provider should add a unit test for `classifyError` + the orchestrator fallback ordering.
