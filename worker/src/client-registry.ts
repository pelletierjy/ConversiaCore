// Client registry — feature 002-secure-embed-telemetry (data-model.md § EmbeddingClient, research R2).
// KV-backed registry of embedding clients with a 30 s per-isolate read cache so revocation
// lands inside the one-minute budget (FR-005/SC-003).

import type { KvLike } from './credential-utils';

export type { KvLike };

export interface Credential {
  keyId: string;
  keyHash: string;
  issuedAt: string;
}

export type ClientStatus = 'active' | 'revoked';

export interface EmbeddingClient {
  remoteId: string;
  label: string;
  status: ClientStatus;
  credentials: Credential[];
  requestLimitPerMinute: number;
  origins: string[];
  createdAt: string;
  updatedAt: string;
  revokedAt?: string;
}

export const REMOTE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{2,63}$/;
export const DEFAULT_REQUEST_LIMIT_PER_MINUTE = 600;
/** Tighter than the 60 s host-config pattern: cache drain + KV propagation must fit SC-003. */
export const CACHE_TTL_MS = 30_000;
export const MAX_ACTIVE_CREDENTIALS = 2;

const KEY_PREFIX = 'clients:';

export function isValidRemoteId(id: unknown): id is string {
  return typeof id === 'string' && REMOTE_ID_PATTERN.test(id);
}

/** Creates a new (credential-less) record; keys are issued separately via the admin surface. */
export function createClientRecord(input: {
  remoteId: string;
  label?: string;
  requestLimitPerMinute?: number;
  origins?: string[];
  now?: string;
}): EmbeddingClient {
  if (!isValidRemoteId(input.remoteId)) {
    throw new Error(`Invalid remote id "${String(input.remoteId)}" (expected ${REMOTE_ID_PATTERN})`);
  }
  const limit = input.requestLimitPerMinute ?? DEFAULT_REQUEST_LIMIT_PER_MINUTE;
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(`Invalid requestLimitPerMinute: ${String(input.requestLimitPerMinute)}`);
  }
  const origins = input.origins ?? [];
  if (origins.some((o) => typeof o !== 'string' || o.length === 0)) {
    throw new Error('Invalid origins: must be non-empty strings');
  }
  const now = input.now ?? new Date().toISOString();
  return {
    remoteId: input.remoteId,
    label: input.label ?? input.remoteId,
    status: 'active',
    credentials: [],
    requestLimitPerMinute: limit,
    origins,
    createdAt: now,
    updatedAt: now,
  };
}

/** Runtime guard used on every write (and defensively on read) — the single place the
 *  data-model invariants live: limit >= 1, <= 2 credentials, active clients hold >= 1 key. */
export function assertValidRecord(record: unknown): asserts record is EmbeddingClient {
  const r = record as EmbeddingClient | null;
  if (!r || typeof r !== 'object') throw new Error('Invalid client record: not an object');
  if (!isValidRemoteId(r.remoteId)) throw new Error('Invalid client record: bad remoteId');
  if (typeof r.label !== 'string') throw new Error('Invalid client record: missing label');
  if (r.status !== 'active' && r.status !== 'revoked') throw new Error(`Invalid client record: bad status "${String(r.status)}"`);
  if (!Array.isArray(r.credentials) || r.credentials.length > MAX_ACTIVE_CREDENTIALS) {
    throw new Error('Invalid client record: credentials must be an array of at most 2 entries');
  }
  for (const cred of r.credentials) {
    if (!cred || typeof cred.keyId !== 'string' || typeof cred.keyHash !== 'string' || cred.keyHash.length !== 64) {
      throw new Error('Invalid client record: malformed credential');
    }
  }
  if (r.status === 'active' && r.credentials.length === 0) {
    throw new Error('Invalid client record: active client must hold at least one credential');
  }
  if (!Number.isInteger(r.requestLimitPerMinute) || r.requestLimitPerMinute < 1) {
    throw new Error('Invalid client record: requestLimitPerMinute must be >= 1');
  }
  if (!Array.isArray(r.origins) || r.origins.some((o) => typeof o !== 'string')) {
    throw new Error('Invalid client record: origins must be a string array');
  }
  if (typeof r.createdAt !== 'string' || typeof r.updatedAt !== 'string') {
    throw new Error('Invalid client record: missing timestamps');
  }
}

interface CacheEntry {
  value: EmbeddingClient | null;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export function invalidateCache(remoteId?: string): void {
  if (remoteId) cache.delete(KEY_PREFIX + remoteId);
  else cache.clear();
}

/** Reads a client record through the 30 s cache. Returns null for missing/malformed/invalid
 *  records (fail closed — the auth gate treats null as "unknown client"). */
export async function getClient(kv: KvLike, remoteId: string): Promise<EmbeddingClient | null> {
  if (!isValidRemoteId(remoteId)) return null;
  const key = KEY_PREFIX + remoteId;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  let value: EmbeddingClient | null = null;
  const raw = await kv.get(key);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      assertValidRecord(parsed);
      value = parsed;
    } catch {
      value = null;
    }
  }
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

/** Validates and writes a record, then busts the cache so mutations propagate within the TTL. */
export async function putClient(kv: KvLike, record: EmbeddingClient): Promise<void> {
  assertValidRecord(record);
  await kv.put(KEY_PREFIX + record.remoteId, JSON.stringify(record));
  invalidateCache(record.remoteId);
}
