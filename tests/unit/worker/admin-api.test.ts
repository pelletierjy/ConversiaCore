// @vitest-environment node
// TDD RED phase — task T018 (feature 002-secure-embed-telemetry).
// Contract: specs/002-secure-embed-telemetry/contracts/admin-cli.md.
import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { handleAdminRequest } from '../../../worker/src/admin-api';
import { getClient, invalidateCache, type KvLike } from '../../../worker/src/client-registry';

const TOKEN = 'admin-secret-token';

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

function env(kv: KvLike, overrides: Record<string, unknown> = {}) {
  return { CLIENTS: kv, ADMIN_TOKEN: TOKEN, ...overrides };
}

function req(path: string, options: { method?: string; token?: string | null; body?: unknown } = {}): Request {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (options.token !== null) headers.set('X-Admin-Token', options.token ?? TOKEN);
  return new Request(`https://worker.example${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

async function call(kv: KvLike, request: Request, overrides: Record<string, unknown> = {}): Promise<{ status: number; body: any }> {
  const res = await handleAdminRequest(request, env(kv, overrides) as never, null, 'cid-admin-test');
  return { status: res.status, body: await res.json() };
}

beforeEach(() => {
  invalidateCache();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('admin auth guard (contracts/admin-cli.md)', () => {
  it('returns 503 not_configured when ADMIN_TOKEN is unset (safe default)', async () => {
    const { status, body } = await call(fakeKv(), req('/admin/clients', { token: null }), { ADMIN_TOKEN: undefined });
    expect(status).toBe(503);
    expect(body).toEqual({ error: 'not_configured' });
  });

  it('returns 401 for missing or wrong tokens', async () => {
    const kv = fakeKv();
    expect((await call(kv, req('/admin/clients', { token: null }))).status).toBe(401);
    expect((await call(kv, req('/admin/clients', { token: 'wrong' }))).status).toBe(401);
    expect((await call(kv, req('/admin/clients'))).status).toBe(200);
  });
});

describe('client lifecycle endpoints', () => {
  it('creates a client and returns the plaintext key exactly once', async () => {
    const kv = fakeKv();
    const { status, body } = await call(kv, req('/admin/clients', { method: 'POST', body: { remoteId: 'globalvsthost', label: 'GVH' } }));
    expect(status).toBe(201);
    expect(body.remoteId).toBe('globalvsthost');
    expect(body.key).toMatch(/^cvk_globalvsthost_/);
    expect(body.keyId).toMatch(/^[a-z0-9]{8}$/);
    expect(body.requestLimitPerMinute).toBe(600);
    const stored = await getClient(kv, 'globalvsthost');
    expect(stored?.credentials).toHaveLength(1);
    expect(JSON.stringify(stored)).not.toContain(body.key); // only the hash is stored
  });

  it('rejects duplicates with 409 and invalid input with 400', async () => {
    const kv = fakeKv();
    await call(kv, req('/admin/clients', { method: 'POST', body: { remoteId: 'globalvsthost' } }));
    expect((await call(kv, req('/admin/clients', { method: 'POST', body: { remoteId: 'globalvsthost' } }))).status).toBe(409);
    expect((await call(kv, req('/admin/clients', { method: 'POST', body: { remoteId: 'Bad_Id' } }))).status).toBe(400);
    expect((await call(kv, req('/admin/clients', { method: 'POST', body: {} }))).status).toBe(400);
  });

  it('lists clients without exposing key hashes, shows one with hashes', async () => {
    const kv = fakeKv();
    await call(kv, req('/admin/clients', { method: 'POST', body: { remoteId: 'globalvsthost' } }));
    const list = await call(kv, req('/admin/clients'));
    expect(list.status).toBe(200);
    const serializedList = JSON.stringify(list.body);
    expect(serializedList).not.toContain('keyHash');
    expect(list.body.clients[0]).toMatchObject({ remoteId: 'globalvsthost', status: 'active', credentialCount: 1 });
    const show = await call(kv, req('/admin/clients/globalvsthost'));
    expect(show.body.credentials[0].keyHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('rotates up to two overlapping keys, then refuses a third', async () => {
    const kv = fakeKv();
    const created = await call(kv, req('/admin/clients', { method: 'POST', body: { remoteId: 'globalvsthost' } }));
    const rotated = await call(kv, req('/admin/clients/globalvsthost/rotate', { method: 'POST' }));
    expect(rotated.status).toBe(200);
    expect(rotated.body.key).toMatch(/^cvk_globalvsthost_/);
    expect(rotated.body.key).not.toBe(created.body.key);
    const third = await call(kv, req('/admin/clients/globalvsthost/rotate', { method: 'POST' }));
    expect(third.status).toBe(400);
    expect(third.body).toEqual({ error: 'too_many_credentials' });
  });

  it('revokes an individual key but never the last active one', async () => {
    const kv = fakeKv();
    const created = await call(kv, req('/admin/clients', { method: 'POST', body: { remoteId: 'globalvsthost' } }));
    const rotated = await call(kv, req('/admin/clients/globalvsthost/rotate', { method: 'POST' }));
    const revokedKey = await call(kv, req(`/admin/clients/globalvsthost/keys/${created.body.keyId}/revoke`, { method: 'POST' }));
    expect(revokedKey.status).toBe(200);
    const lastOne = await call(kv, req(`/admin/clients/globalvsthost/keys/${rotated.body.keyId}/revoke`, { method: 'POST' }));
    expect(lastOne.status).toBe(400);
    expect(lastOne.body).toEqual({ error: 'last_credential' });
  });

  it('revokes the client terminally and logs security events at warn severity', async () => {
    const warn = vi.spyOn(console, 'log').mockImplementation(() => {});
    const kv = fakeKv();
    await call(kv, req('/admin/clients', { method: 'POST', body: { remoteId: 'globalvsthost' } }));
    const revoked = await call(kv, req('/admin/clients/globalvsthost/revoke', { method: 'POST' }));
    expect(revoked.status).toBe(200);
    expect(revoked.body).toMatchObject({ remoteId: 'globalvsthost', status: 'revoked' });
    const stored = await getClient(kv, 'globalvsthost');
    expect(stored?.status).toBe('revoked');
    const events = warn.mock.calls.map((args) => String(args[0])).map((line) => JSON.parse(line));
    const names = events.map((e) => e.event);
    expect(names).toContain('client_registered');
    expect(names).toContain('client_revoked');
    for (const evt of events) expect(evt.level).toBe('warn');
  });

  it('returns 404 for unknown clients', async () => {
    const kv = fakeKv();
    expect((await call(kv, req('/admin/clients/ghost'))).status).toBe(404);
    expect((await call(kv, req('/admin/clients/ghost/rotate', { method: 'POST' }))).status).toBe(404);
  });
});

describe('usage endpoint (FR-009)', () => {
  it('summarizes counters per client over the window', async () => {
    const dayKey = (d: Date) => `usage-day:globalvsthost:${d.toISOString().slice(0, 10).replace(/-/g, '')}`;
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 3600 * 1000);
    const kv = fakeKv({
      [dayKey(yesterday)]: JSON.stringify({ s: 10, e: 1, r: 0, t: 0, la: `${yesterday.toISOString().slice(0, 10)}T10:00:00.000Z` }),
      [dayKey(today)]: JSON.stringify({ s: 5, e: 0, r: 2, t: 1, la: `${today.toISOString().slice(0, 10)}T10:00:00.000Z` }),
    });
    const { status, body } = await call(kv, req('/admin/usage?remoteId=globalvsthost&days=2'));
    expect(status).toBe(200);
    expect(body).toMatchObject({ remoteId: 'globalvsthost', served: 15, errored: 1, refused: 2, throttled: 1, lastActivity: `${today.toISOString().slice(0, 10)}T10:00:00.000Z` });
    expect(body.perDay).toHaveLength(2);
  });

  it('requires the remoteId query parameter', async () => {
    const { status, body } = await call(fakeKv(), req('/admin/usage'));
    expect(status).toBe(400);
    expect(body).toEqual({ error: 'missing_remote_id' });
  });
});
