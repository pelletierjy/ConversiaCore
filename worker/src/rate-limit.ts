// Per-client rate limiting + usage counters — feature 002-secure-embed-telemetry
// (data-model.md § UsageCounter, FR-007/FR-009). KV writes are eventually consistent, which is
// acceptable for a soft limit (research R4); attribution is the primary control.

import type { KvLike } from './credential-utils';

/** Minute buckets only serve the rate window; day aggregates carry the 30-day usage retention. */
export const MINUTE_BUCKET_TTL_SECONDS = 7200;
export const DAY_BUCKET_TTL_SECONDS = 30 * 24 * 3600;

export type CounterField = 's' | 'e' | 'r' | 't';

interface Counters {
  s: number; // requests that passed the gate (attempts)
  e: number; // subset of s that errored (upstream/provider failures)
  r: number; // refused-authorization requests attributed to this remote id
  t: number; // throttled requests
  la: string; // last activity (ISO)
}

const EMPTY: Omit<Counters, 'la'> = { s: 0, e: 0, r: 0, t: 0 };

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function dateParts(now: Date): { ymd: string; yhm: string } {
  const ymd = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`;
  return { ymd, yhm: `${ymd}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}` };
}

export function minuteBucketKey(remoteId: string, now: Date = new Date()): string {
  return `usage:${remoteId}:${dateParts(now).yhm}`;
}

export function dayBucketKey(remoteId: string, now: Date = new Date()): string {
  return `usage-day:${remoteId}:${dateParts(now).ymd}`;
}

async function readCounters(kv: KvLike, key: string): Promise<Counters> {
  const raw = await kv.get(key);
  if (!raw) return { ...EMPTY, la: '' };
  try {
    const parsed = JSON.parse(raw) as Partial<Counters>;
    return {
      s: typeof parsed.s === 'number' ? parsed.s : 0,
      e: typeof parsed.e === 'number' ? parsed.e : 0,
      r: typeof parsed.r === 'number' ? parsed.r : 0,
      t: typeof parsed.t === 'number' ? parsed.t : 0,
      la: typeof parsed.la === 'string' ? parsed.la : '',
    };
  } catch {
    return { ...EMPTY, la: '' };
  }
}

async function writeBucket(kv: KvLike, key: string, counters: Counters, ttlSeconds: number): Promise<void> {
  await kv.put(key, JSON.stringify(counters), { expirationTtl: ttlSeconds });
}

/** Increments a non-'s' outcome field in both the minute bucket and the day aggregate. */
export async function bumpCounters(kv: KvLike, remoteId: string, field: Exclude<CounterField, 's'>, now: Date = new Date()): Promise<void> {
  const stamp = now.toISOString();
  for (const [key, ttl] of [
    [minuteBucketKey(remoteId, now), MINUTE_BUCKET_TTL_SECONDS],
    [dayBucketKey(remoteId, now), DAY_BUCKET_TTL_SECONDS],
  ] as const) {
    const counters = await readCounters(kv, key);
    counters[field] += 1;
    counters.la = stamp;
    await writeBucket(kv, key, counters, ttl);
  }
}

/** FR-007 gate: consumes one slot from the current minute bucket when under the per-client
 *  limit; over the limit it records a throttle (the limit counts gate-allowed traffic only,
 *  so attackers burning refused attempts can't exhaust a legit client's budget). */
export async function checkAndIncrement(
  kv: KvLike,
  remoteId: string,
  limitPerMinute: number,
  now: Date = new Date(),
): Promise<{ allowed: boolean; count: number }> {
  const minuteKey = minuteBucketKey(remoteId, now);
  const minute = await readCounters(kv, minuteKey);
  if (minute.s >= limitPerMinute) {
    await bumpCounters(kv, remoteId, 't', now);
    return { allowed: false, count: minute.s };
  }
  const stamp = now.toISOString();
  minute.s += 1;
  minute.la = stamp;
  await writeBucket(kv, minuteKey, minute, MINUTE_BUCKET_TTL_SECONDS);

  const dayKey = dayBucketKey(remoteId, now);
  const day = await readCounters(kv, dayKey);
  day.s += 1;
  day.la = stamp;
  await writeBucket(kv, dayKey, day, DAY_BUCKET_TTL_SECONDS);
  return { allowed: true, count: minute.s };
}
