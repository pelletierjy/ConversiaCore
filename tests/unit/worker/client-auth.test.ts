// @vitest-environment node
// TDD RED phase — task T009 (feature 002-secure-embed-telemetry).
// Contract: specs/002-secure-embed-telemetry/contracts/client-auth.md.
import { describe, expect, it, beforeEach } from 'vitest';
import { verifyClientCredential } from '../../../worker/src/client-auth';
import {
  createClientRecord,
  invalidateCache,
  putClient,
  type KvLike,
} from '../../../worker/src/client-registry';
import { generateCredential, sha256Hex } from '../../../worker/src/credential-utils';

const ORIGIN = 'https://pelletierjy.github.io';

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

async function seededClient(kv: KvLike, options: { origins?: string[]; revoked?: boolean; limit?: number } = {}) {
  const record = createClientRecord({
    remoteId: 'globalvsthost',
    origins: options.origins ?? [],
    requestLimitPerMinute: options.limit ?? 600,
  });
  const credential = generateCredential('globalvsthost');
  record.credentials.push({
    keyId: credential.keyId,
    keyHash: await sha256Hex(credential.key),
    issuedAt: record.createdAt,
  });
  if (options.revoked) {
    record.status = 'revoked';
    record.revokedAt = record.createdAt;
    record.credentials = [];
  }
  await putClient(kv, record);
  return credential;
}

function headers(remoteId?: string, key?: string): Headers {
  const h = new Headers();
  if (remoteId !== undefined) h.set('X-Conversia-Client', remoteId);
  if (key !== undefined) h.set('X-Conversia-Key', key);
  return h;
}

beforeEach(() => {
  invalidateCache();
});

describe('verifyClientCredential (FR-002/FR-003)', () => {
  it('accepts a valid credential for an active client', async () => {
    const kv = fakeKv();
    const cred = await seededClient(kv);
    const result = await verifyClientCredential(headers('globalvsthost', cred.key), { CLIENTS: kv }, ORIGIN);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.client.remoteId).toBe('globalvsthost');
  });

  it('rejects missing headers, malformed remote ids and empty keys', async () => {
    const kv = fakeKv();
    await seededClient(kv);
    expect((await verifyClientCredential(headers(), { CLIENTS: kv }, ORIGIN)).ok).toBe(false);
    expect((await verifyClientCredential(headers('globalvsthost', undefined), { CLIENTS: kv }, ORIGIN)).ok).toBe(false);
    expect((await verifyClientCredential(headers('GlobalVstHost', 'cvk_x_y'), { CLIENTS: kv }, ORIGIN)).ok).toBe(false);
    expect((await verifyClientCredential(headers('globalvsthost', ''), { CLIENTS: kv }, ORIGIN)).ok).toBe(false);
  });

  it('rejects unknown, revoked and wrong-key cases with the same generic failure', async () => {
    const kv = fakeKv();
    const cred = await seededClient(kv);
    const revokedKv = fakeKv();
    await seededClient(revokedKv, { revoked: true });

    const unknown = await verifyClientCredential(headers('otherclient', cred.key), { CLIENTS: kv }, ORIGIN);
    const wrongKey = await verifyClientCredential(headers('globalvsthost', cred.key.slice(0, -4) + 'AAAA'), { CLIENTS: kv }, ORIGIN);
    // In production there is one registry and every mutation busts the cache; model that by
    // clearing it here since the previous checks cached the active record from `kv`.
    invalidateCache();
    const revoked = await verifyClientCredential(headers('globalvsthost', cred.key), { CLIENTS: revokedKv }, ORIGIN);
    expect(unknown).toMatchObject({ ok: false, reason: 'unknown' });
    expect(wrongKey).toMatchObject({ ok: false, reason: 'unknown' });
    expect(revoked).toMatchObject({ ok: false, reason: 'unknown' });
    // Parseable remote ids are still attributed for tracking (FR-010).
    if (!unknown.ok) expect(unknown.remoteId).toBe('otherclient');
  });

  it('fails closed when the registry binding is absent', async () => {
    const result = await verifyClientCredential(headers('globalvsthost', 'cvk_globalvsthost_x'), {}, ORIGIN);
    expect(result.ok).toBe(false);
  });

  it('treats registered origins as defense-in-depth only (never sufficient alone)', async () => {
    const kv = fakeKv();
    const cred = await seededClient(kv, { origins: ['https://app.example'] });
    // matching origin passes
    expect((await verifyClientCredential(headers('globalvsthost', cred.key), { CLIENTS: kv }, 'https://app.example')).ok).toBe(true);
    // non-matching origin refused even with a valid key
    expect((await verifyClientCredential(headers('globalvsthost', cred.key), { CLIENTS: kv }, 'https://evil.example')).ok).toBe(false);
    // missing Origin header refused when origins are registered
    expect((await verifyClientCredential(headers('globalvsthost', cred.key), { CLIENTS: kv }, null)).ok).toBe(false);
  });

  it('accepts any origin when the client registered none (credential still required)', async () => {
    const kv = fakeKv();
    const cred = await seededClient(kv);
    expect((await verifyClientCredential(headers('globalvsthost', cred.key), { CLIENTS: kv }, 'https://anything.example')).ok).toBe(true);
    expect((await verifyClientCredential(headers('globalvsthost', cred.key), { CLIENTS: kv }, null)).ok).toBe(true);
  });
});
