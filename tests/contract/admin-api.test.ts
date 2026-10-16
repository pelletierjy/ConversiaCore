// @vitest-environment node
// TDD RED phase — task T020 (feature 002-secure-embed-telemetry) — constitution Principle IV:
// admin-surface contract tests over the router-level fetch handler, including the
// revocation → gate-refusal cross-contract (SC-003).
// Contract: specs/002-secure-embed-telemetry/contracts/admin-cli.md.
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import worker from '../../worker/src/index';
import { invalidateCache, type KvLike } from '../../worker/src/client-registry';

const TOKEN = 'contract-admin-token';
const ORIGIN = 'https://pelletierjy.github.io';
const WORKER_URL = 'https://conversia-core-proxy.example.workers.dev';

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

function env(kv: KvLike) {
  return { CLIENTS: kv, ADMIN_TOKEN: TOKEN } as never;
}

function adminReq(path: string, options: { method?: string; body?: unknown } = {}): Request {
  return new Request(`${WORKER_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': TOKEN },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

async function call(kv: KvLike, request: Request): Promise<{ status: number; body: any }> {
  const res = await worker.fetch(request as never, env(kv));
  return { status: res.status, body: await res.json() };
}

function chatRequest(remoteId: string, key: string): Request {
  return new Request(`${WORKER_URL}/gemini/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, 'X-Conversia-Client': remoteId, 'X-Conversia-Key': key },
    body: '{}',
  });
}

beforeEach(() => {
  invalidateCache();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('admin surface over the worker router (constitution Principle IV)', () => {
  it('runs the full add → rotate → revoke-key → revoke lifecycle and enforces it at the gate', async () => {
    const events = vi.spyOn(console, 'log').mockImplementation(() => {});
    const kv = fakeKv();

    // add → plaintext key once, hash at rest
    const created = await call(kv, adminReq('/admin/clients', { method: 'POST', body: { remoteId: 'globalvsthost', label: 'GVH' } }));
    expect(created.status).toBe(201);
    expect(created.body.key).toMatch(/^cvk_globalvsthost_/);

    // the issued key works at the gate (handler reachable → 503 not_configured, no provider key in test env)
    const served = await worker.fetch(chatRequest('globalvsthost', created.body.key) as never, env(kv));
    expect(served.status).toBe(503);

    // rotate → second overlapping key; both work
    const rotated = await call(kv, adminReq('/admin/clients/globalvsthost/rotate', { method: 'POST' }));
    expect(rotated.status).toBe(200);
    const oldKeyWorks = await worker.fetch(chatRequest('globalvsthost', created.body.key) as never, env(kv));
    const newKeyWorks = await worker.fetch(chatRequest('globalvsthost', rotated.body.key) as never, env(kv));
    expect(oldKeyWorks.status).toBe(503);
    expect(newKeyWorks.status).toBe(503);

    // revoke the old key → old refused at the gate, new still works (rotation without downtime)
    const keyRevoked = await call(kv, adminReq(`/admin/clients/globalvsthost/keys/${created.body.keyId}/revoke`, { method: 'POST' }));
    expect(keyRevoked.status).toBe(200);
    const oldAfter = await worker.fetch(chatRequest('globalvsthost', created.body.key) as never, env(kv));
    const newAfter = await worker.fetch(chatRequest('globalvsthost', rotated.body.key) as never, env(kv));
    expect(oldAfter.status).toBe(401);
    expect(await oldAfter.json()).toEqual({ error: 'not_authorized' });
    expect(newAfter.status).toBe(503);

    // terminal client revoke → the surviving key is refused too (SC-003 drill)
    const revoked = await call(kv, adminReq('/admin/clients/globalvsthost/revoke', { method: 'POST' }));
    expect(revoked.status).toBe(200);
    const afterRevoke = await worker.fetch(chatRequest('globalvsthost', rotated.body.key) as never, env(kv));
    expect(afterRevoke.status).toBe(401);

    // every mutation left a security event in the structured log stream
    const names = events.mock.calls
      .map((args) => String(args[0]))
      .filter((line) => line.startsWith('{'))
      .map((line) => JSON.parse(line).event);
    expect(names).toContain('client_registered');
    expect(names).toContain('client_rotated');
    expect(names).toContain('client_revoked');
  });

  it('rejects admin calls without a valid token even from allowed origins', async () => {
    const kv = fakeKv();
    const res = await worker.fetch(
      new Request(`${WORKER_URL}/admin/clients`, { headers: { 'X-Admin-Token': 'nope' } }) as never,
      env(kv),
    );
    expect(res.status).toBe(401);
  });

  it('returns 503 for the whole admin surface when ADMIN_TOKEN is not configured', async () => {
    const kv = fakeKv();
    const res = await worker.fetch(adminReq('/admin/clients') as never, { CLIENTS: kv } as never);
    expect(res.status).toBe(503);
  });

  it('reports usage accumulated by real gate traffic', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const kv = fakeKv();
    const created = await call(kv, adminReq('/admin/clients', { method: 'POST', body: { remoteId: 'globalvsthost' } }));
    await worker.fetch(chatRequest('globalvsthost', created.body.key) as never, env(kv)); // served attempt (503 upstream)
    await worker.fetch(chatRequest('globalvsthost', 'cvk_globalvsthost_bogus') as never, env(kv)); // refused
    const usage = await call(kv, adminReq('/admin/usage?remoteId=globalvsthost&days=1'));
    expect(usage.status).toBe(200);
    expect(usage.body.served).toBe(1);
    expect(usage.body.errored).toBe(1); // the 503 not_configured counts as an errored attempt
    expect(usage.body.refused).toBe(1);
    expect(usage.body.lastActivity).toBeTruthy();
  });
});
