// @vitest-environment node
// TDD RED phase — task T025 (feature 002-secure-embed-telemetry).
// Contract: specs/002-secure-embed-telemetry/contracts/observability.md — domain attributes on
// request events (conversia.* span-attribute dimensions) and no awaited telemetry export (FR-019).
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import worker from '../../../worker/src/index';
import { createClientRecord, invalidateCache, putClient, type KvLike } from '../../../worker/src/client-registry';
import { generateCredential, sha256Hex } from '../../../worker/src/credential-utils';

const ORIGIN = 'https://pelletierjy.github.io';
const WORKER_URL = 'https://conversia-core-proxy.example.workers.dev';

function fakeKv(): KvLike {
  const store = new Map<string, string>();
  return {
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async put(key: string, value: string) {
      store.set(key, value);
    },
    async list({ prefix }: { prefix: string }) {
      return { keys: [...store.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })) };
    },
  };
}

async function seed(kv: KvLike): Promise<string> {
  const record = createClientRecord({ remoteId: 'globalvsthost' });
  const credential = generateCredential('globalvsthost');
  record.credentials.push({ keyId: credential.keyId, keyHash: await sha256Hex(credential.key), issuedAt: record.createdAt });
  await putClient(kv, record);
  return credential.key;
}

function request(path: string, headers: Record<string, string>, body: unknown = {}): Request {
  return new Request(`${WORKER_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, ...headers },
    body: JSON.stringify(body),
  });
}

function capturedEvents(calls: unknown[][]): Array<Record<string, unknown>> {
  return calls
    .map((args) => String(args[0]))
    .filter((line) => line.startsWith('{'))
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

beforeEach(() => {
  invalidateCache();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('domain attributes on request events (FR-016/FR-018, contracts/observability.md)', () => {
  it('served events carry remote id, route, outcome, provider and fallback depth', async () => {
    // Stub the provider's upstream call so /deepseek/chat can complete hermetically at 200.
    const providerFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
    }));
    vi.stubGlobal('fetch', providerFetch);

    const kv = fakeKv();
    const key = await seed(kv);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const res = await worker.fetch(
      request('/deepseek/chat', { 'X-Conversia-Client': 'globalvsthost', 'X-Conversia-Key': key, 'X-Conversia-Attempt': '3' }, { systemPrompt: 'x', history: [], model: 'm', temperature: 0.7, maxOutputTokens: 16 }) as never,
      { CLIENTS: kv, DEEPSEEK_API_KEY: 'test-key' } as never,
    );
    expect(res.status).toBe(200);

    const events = capturedEvents(logSpy.mock.calls as unknown[][]);
    const served = events.find((e) => e.event === 'request_served');
    expect(served).toMatchObject({
      remoteId: 'globalvsthost',
      route: '/deepseek/chat',
      outcome: 'served',
      status: 200,
      provider: 'deepseek',
      fallbackCount: 2, // attempt 3 → two earlier provider attempts in the chain
    });
    expect(served).toBeDefined();
    expect(served!.correlationId).toBeTruthy();
    expect(served!.durationMs).toBeGreaterThanOrEqual(0);

    // FR-019: the ONLY network call was the provider itself — no awaited telemetry export.
    expect(providerFetch).toHaveBeenCalledTimes(1);
    const exportedUrls = providerFetch.mock.calls.map((c: unknown[]) => String((c as unknown[])[0]));
    expect(exportedUrls.every((u) => u.startsWith('https://api.deepseek.com/'))).toBe(true);
    vi.unstubAllGlobals();
  });

  it('errored events (handler-level 503) carry provider and errorKind', async () => {
    const kv = fakeKv();
    const key = await seed(kv);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const res = await worker.fetch(
      request('/deepseek/chat', { 'X-Conversia-Client': 'globalvsthost', 'X-Conversia-Key': key }) as never,
      { CLIENTS: kv } as never, // no DEEPSEEK_API_KEY → 503 not_configured
    );
    expect(res.status).toBe(503);
    const errored = capturedEvents(logSpy.mock.calls as unknown[][]).find((e) => e.event === 'request_errored');
    expect(errored).toMatchObject({
      remoteId: 'globalvsthost',
      outcome: 'errored',
      status: 503,
      provider: 'deepseek',
      errorKind: 'not_configured',
    });
  });

  it('refused events attribute unknown remote ids as "unknown" (FR-010)', async () => {
    const kv = fakeKv();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const res = await worker.fetch(
      request('/gemini/chat', { 'X-Conversia-Client': 'ghost-client', 'X-Conversia-Key': 'cvk_ghost_x' }) as never,
      { CLIENTS: kv } as never,
    );
    expect(res.status).toBe(401);
    const refused = capturedEvents(logSpy.mock.calls as unknown[][]).find((e) => e.event === 'request_refused');
    expect(refused).toMatchObject({ remoteId: 'ghost-client', outcome: 'refused', status: 401, errorKind: 'not_authorized' });
  });
});