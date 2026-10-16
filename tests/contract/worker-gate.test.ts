// @vitest-environment node
// TDD RED phase — task T012 (feature 002-secure-embed-telemetry) — constitution Principle IV:
// automated contract tests for the inter-service boundary (widget/host → worker gate).
// Contract: specs/002-secure-embed-telemetry/contracts/client-auth.md.
import { describe, expect, it, beforeEach } from 'vitest';
import worker from '../../worker/src/index';
import {
  createClientRecord,
  invalidateCache,
  putClient,
  type KvLike,
} from '../../worker/src/client-registry';
import { generateCredential, sha256Hex } from '../../worker/src/credential-utils';

const ORIGIN = 'https://pelletierjy.github.io';
const WORKER_URL = 'https://conversia-core-proxy.example.workers.dev';

type TestEnv = Record<string, unknown>;

function fakeKv(initial: Record<string, string> = {}): KvLike {
  const store = new Map(Object.entries(initial));
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

async function seedClient(kv: KvLike, options: { limit?: number; revoked?: boolean } = {}) {
  const record = createClientRecord({ remoteId: 'globalvsthost', requestLimitPerMinute: options.limit ?? 600 });
  const credential = generateCredential('globalvsthost');
  record.credentials.push({
    keyId: credential.keyId,
    keyHash: await sha256Hex(credential.key),
    issuedAt: record.createdAt,
  });
  if (options.revoked) {
    record.status = 'revoked';
    record.credentials = [];
  }
  await putClient(kv, record);
  return credential;
}

function chatRequest(headers: Record<string, string>): Request {
  return new Request(`${WORKER_URL}/gemini/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, ...headers },
    body: JSON.stringify({ systemPrompt: 'x', history: [], model: 'm', temperature: 0.7, maxOutputTokens: 16 }),
  });
}

/** No provider keys in the env: a request that PASSES the gate reaches the handler and gets
 *  503 not_configured; a request that fails the gate never gets that far. This keeps the
 *  contract suite hermetic (no external provider calls). */
function env(kv: KvLike, overrides: TestEnv = {}): TestEnv {
  return { CLIENTS: kv, ...overrides };
}

async function call(e: TestEnv, request: Request): Promise<Response> {
  return worker.fetch(request as never, e as never);
}

beforeEach(() => {
  invalidateCache();
});

describe('worker gate contract (contracts/client-auth.md)', () => {
  it('preflight grants the two credential headers on allowed origins', async () => {
    const res = await call(env(fakeKv()), new Request(`${WORKER_URL}/gemini/chat`, { method: 'OPTIONS', headers: { Origin: ORIGIN } }));
    expect(res.status).toBe(204);
    const allowHeaders = res.headers.get('Access-Control-Allow-Headers') ?? '';
    expect(allowHeaders).toContain('X-Conversia-Client');
    expect(allowHeaders).toContain('X-Conversia-Key');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
  });

  it('refuses a credential-less request with the single generic authorization error', async () => {
    const res = await call(env(fakeKv()), chatRequest({}));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'not_authorized' });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(res.headers.get('X-Correlation-Id')).toBeTruthy();
  });

  it('returns byte-identical refusals for fabricated, malformed and revoked credentials (no oracle)', async () => {
    const kv = fakeKv();
    const cred = await seedClient(kv, { revoked: true });
    const fabricated = await call(env(kv), chatRequest({ 'X-Conversia-Client': 'ghost', 'X-Conversia-Key': 'cvk_ghost_x' }));
    const malformed = await call(env(kv), chatRequest({ 'X-Conversia-Client': 'GlobalVstHost!', 'X-Conversia-Key': 'x' }));
    const revoked = await call(env(kv), chatRequest({ 'X-Conversia-Client': 'globalvsthost', 'X-Conversia-Key': cred.key }));
    const bodies = await Promise.all([fabricated, malformed, revoked].map((r) => r.text()));
    expect(fabricated.status).toBe(401);
    expect(malformed.status).toBe(401);
    expect(revoked.status).toBe(401);
    expect(new Set(bodies).size).toBe(1);
    expect(JSON.parse(bodies[0])).toEqual({ error: 'not_authorized' });
  });

  it('origin allowlist still applies before the credential (forged origin alone useless)', async () => {
    const kv = fakeKv();
    const cred = await seedClient(kv);
    const res = await call(
      env(kv),
      new Request(`${WORKER_URL}/gemini/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example', 'X-Conversia-Client': 'globalvsthost', 'X-Conversia-Key': cred.key },
        body: '{}',
      }),
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'origin_not_allowed' });
  });

  it('serves a valid credential past the gate (reaches handler → 503 not_configured)', async () => {
    const kv = fakeKv();
    const cred = await seedClient(kv);
    const res = await call(env(kv), chatRequest({ 'X-Conversia-Client': 'globalvsthost', 'X-Conversia-Key': cred.key }));
    expect(res.status).toBe(503); // gate passed; no provider key configured in the test env
    expect(res.headers.get('X-Correlation-Id')).toBeTruthy();
  });

  it('accepts the optional X-Conversia-Attempt header without affecting authorization', async () => {
    const kv = fakeKv();
    const cred = await seedClient(kv);
    const res = await call(
      env(kv),
      chatRequest({ 'X-Conversia-Client': 'globalvsthost', 'X-Conversia-Key': cred.key, 'X-Conversia-Attempt': '3' }),
    );
    expect(res.status).toBe(503);
  });

  it('enforces the per-client rate limit with 429 rate_limited', async () => {
    const kv = fakeKv();
    const cred = await seedClient(kv, { limit: 2 });
    const auth = { 'X-Conversia-Client': 'globalvsthost', 'X-Conversia-Key': cred.key };
    expect((await call(env(kv), chatRequest(auth))).status).toBe(503);
    expect((await call(env(kv), chatRequest(auth))).status).toBe(503);
    const throttled = await call(env(kv), chatRequest(auth));
    expect(throttled.status).toBe(429);
    expect(await throttled.json()).toEqual({ error: 'rate_limited' });
  });

  it('fails closed when the registry binding is missing', async () => {
    const res = await call({ CLIENTS: undefined }, chatRequest({ 'X-Conversia-Client': 'globalvsthost', 'X-Conversia-Key': 'cvk_globalvsthost_x' }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'not_authorized' });
  });

  it('keeps the existing method and not_found behavior', async () => {
    const kv = fakeKv();
    const cred = await seedClient(kv);
    const auth = { 'X-Conversia-Client': 'globalvsthost', 'X-Conversia-Key': cred.key };
    const get = await call(env(kv), new Request(`${WORKER_URL}/gemini/chat`, { method: 'GET', headers: { Origin: ORIGIN, ...auth } }));
    expect(get.status).toBe(405);
    const missing = await call(
      env(kv),
      new Request(`${WORKER_URL}/nope`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: ORIGIN, ...auth }, body: '{}' }),
    );
    expect(missing.status).toBe(404);
  });
});
