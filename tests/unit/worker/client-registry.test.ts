// @vitest-environment node
// TDD RED phase — task T005 (feature 002-secure-embed-telemetry).
// Contract: data-model.md § EmbeddingClient + credential rules from contracts/client-auth.md.
import { describe, expect, it, vi } from 'vitest';
import {
  CACHE_TTL_MS,
  DEFAULT_REQUEST_LIMIT_PER_MINUTE,
  REMOTE_ID_PATTERN,
  assertValidRecord,
  createClientRecord,
  getClient,
  invalidateCache,
  isValidRemoteId,
  putClient,
  type EmbeddingClient,
  type KvLike,
} from '../../../worker/src/client-registry';
import { constantTimeEquals, generateCredential, sha256Hex } from '../../../worker/src/credential-utils';

function fakeKv(initial: Record<string, string> = {}): KvLike & { store: Map<string, string>; gets: number } {
  const store = new Map(Object.entries(initial));
  return {
    store,
    gets: 0,
    async get(key: string) {
      this.gets += 1;
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

function validRecord(overrides: Partial<EmbeddingClient> = {}): EmbeddingClient {
  return {
    remoteId: 'globalvsthost',
    label: 'GlobalVstHost desktop app',
    status: 'active',
    credentials: [{ keyId: 'ab12cd34', keyHash: 'a'.repeat(64), issuedAt: '2026-10-15T00:00:00Z' }],
    requestLimitPerMinute: 600,
    origins: [],
    createdAt: '2026-10-15T00:00:00Z',
    updatedAt: '2026-10-15T00:00:00Z',
    ...overrides,
  };
}

describe('remote id validation (data-model § EmbeddingClient)', () => {
  it('accepts the documented pattern', () => {
    expect(isValidRemoteId('globalvsthost')).toBe(true);
    expect(isValidRemoteId('my-host-2')).toBe(true);
    expect(REMOTE_ID_PATTERN.test('a'.repeat(64))).toBe(true);
  });

  it('rejects out-of-pattern values', () => {
    expect(isValidRemoteId('GlobalVstHost')).toBe(false);
    expect(isValidRemoteId('ab')).toBe(false);
    expect(isValidRemoteId('a'.repeat(65))).toBe(false);
    expect(isValidRemoteId('-leading-hyphen')).toBe(false);
    expect(isValidRemoteId('has_underscore')).toBe(false);
    expect(isValidRemoteId('')).toBe(false);
  });
});

describe('createClientRecord / assertValidRecord', () => {
  it('creates a record with the generous default limit', () => {
    const rec = createClientRecord({ remoteId: 'globalvsthost', label: 'GVH' });
    expect(rec.requestLimitPerMinute).toBe(DEFAULT_REQUEST_LIMIT_PER_MINUTE);
    expect(DEFAULT_REQUEST_LIMIT_PER_MINUTE).toBe(600);
    expect(rec.origins).toEqual([]);
    expect(rec.status).toBe('active');
    expect(rec.credentials).toEqual([]);
  });

  it('honours explicit limit/origins and rejects invalid input', () => {
    const rec = createClientRecord({ remoteId: 'globalvsthost', requestLimitPerMinute: 5, origins: ['https://x.example'] });
    expect(rec.requestLimitPerMinute).toBe(5);
    expect(rec.origins).toEqual(['https://x.example']);
    expect(() => createClientRecord({ remoteId: 'Bad_Id' })).toThrow();
    expect(() => createClientRecord({ remoteId: 'globalvsthost', requestLimitPerMinute: 0 })).toThrow();
  });

  it('enforces record invariants: limit >= 1, max 2 credentials, active has >= 1 credential', () => {
    expect(() => assertValidRecord(validRecord())).not.toThrow();
    expect(() => assertValidRecord(validRecord({ requestLimitPerMinute: 0 }))).toThrow();
    expect(() => assertValidRecord(validRecord({ credentials: [] }))).toThrow();
    expect(() =>
      assertValidRecord(
        validRecord({
          credentials: [
            { keyId: 'a1', keyHash: 'a'.repeat(64), issuedAt: 'x' },
            { keyId: 'a2', keyHash: 'b'.repeat(64), issuedAt: 'x' },
            { keyId: 'a3', keyHash: 'c'.repeat(64), issuedAt: 'x' },
          ],
        }),
      ),
    ).toThrow();
    expect(() => assertValidRecord(validRecord({ status: 'bogus' } as never))).toThrow();
    expect(() => assertValidRecord({} as never)).toThrow();
  });
});

describe('getClient (30 s per-isolate cache, FR-005/SC-003)', () => {
  it('reads from KV and caches within the TTL', async () => {
    invalidateCache();
    const kv = fakeKv({ 'clients:globalvsthost': JSON.stringify(validRecord()) });
    const first = await getClient(kv, 'globalvsthost');
    const second = await getClient(kv, 'globalvsthost');
    expect(first?.remoteId).toBe('globalvsthost');
    expect(second).toBe(first);
    expect(kv.gets).toBe(1);
  });

  it('re-reads after the TTL expires', async () => {
    invalidateCache();
    const kv = fakeKv({ 'clients:globalvsthost': JSON.stringify(validRecord()) });
    const start = 1_000_000;
    const now = vi.spyOn(Date, 'now').mockReturnValue(start);
    await getClient(kv, 'globalvsthost');
    now.mockReturnValue(start + CACHE_TTL_MS + 1);
    await getClient(kv, 'globalvsthost');
    expect(kv.gets).toBe(2);
  });

  it('returns null for missing, malformed, or invalid records', async () => {
    invalidateCache();
    const kv = fakeKv({
      'clients:broken': 'not-json',
      'clients:invalid': JSON.stringify({ remoteId: 'invalid' }),
    });
    expect(await getClient(kv, 'globalvsthost')).toBeNull();
    expect(await getClient(kv, 'broken')).toBeNull();
    expect(await getClient(kv, 'invalid')).toBeNull();
  });

  it('putClient validates, stores, and busts the cache', async () => {
    invalidateCache();
    const kv = fakeKv({ 'clients:globalvsthost': JSON.stringify(validRecord()) });
    await getClient(kv, 'globalvsthost');
    const updated = validRecord({ requestLimitPerMinute: 5 });
    await putClient(kv, updated);
    const after = await getClient(kv, 'globalvsthost');
    expect(after?.requestLimitPerMinute).toBe(5);
    expect(kv.gets).toBe(2); // cache was invalidated, so the second read hit KV
    await expect(putClient(kv, validRecord({ requestLimitPerMinute: 0 }))).rejects.toThrow();
  });
});

describe('credential primitives (data-model § Credential)', () => {
  it('generates self-attributing cvk_ keys with an 8-char key id', () => {
    const a = generateCredential('globalvsthost');
    const b = generateCredential('globalvsthost');
    expect(a.key.startsWith('cvk_globalvsthost_')).toBe(true);
    expect(a.keyId).toMatch(/^[a-z0-9]{8}$/);
    expect(a.key).not.toBe(b.key);
    const random = a.key.slice('cvk_globalvsthost_'.length);
    const decoded = Buffer.from(random, 'base64url');
    expect(decoded.length).toBe(32);
  });

  it('hashes with SHA-256 (known vector)', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('constant-time comparison matches only equal strings', () => {
    expect(constantTimeEquals('deadbeef', 'deadbeef')).toBe(true);
    expect(constantTimeEquals('deadbeef', 'deadbeee')).toBe(false);
    expect(constantTimeEquals('', '')).toBe(true);
    expect(constantTimeEquals('short', 'longer-value')).toBe(false);
  });
});
