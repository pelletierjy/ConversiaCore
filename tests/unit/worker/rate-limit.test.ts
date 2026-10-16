// @vitest-environment node
// TDD RED phase — task T010 (feature 002-secure-embed-telemetry).
// Contract: data-model.md § UsageCounter + FR-007.
import { describe, expect, it } from 'vitest';
import { bumpCounters, checkAndIncrement, dayBucketKey, minuteBucketKey } from '../../../worker/src/rate-limit';
import type { KvLike } from '../../../worker/src/credential-utils';

const MINUTE_TTL = 7200; // 2 h — rate window only needs the current bucket
const DAY_TTL = 30 * 24 * 3600; // 30-day usage retention (FR-009, clarify Q5)

function fakeKv(initial: Record<string, string> = {}): KvLike & { puts: Array<{ key: string; ttl?: number }> } {
  const store = new Map(Object.entries(initial));
  const puts: Array<{ key: string; ttl?: number }> = [];
  return {
    puts,
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async put(key: string, value: string, options?: { expirationTtl?: number }) {
      store.set(key, value);
      puts.push({ key, ttl: options?.expirationTtl });
    },
    async list({ prefix }: { prefix: string }) {
      return { keys: [...store.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })) };
    },
  };
}

const NOW = new Date('2026-10-15T12:34:00Z');

describe('bucket keys (data-model § UsageCounter)', () => {
  it('formats minute and day buckets', () => {
    expect(minuteBucketKey('globalvsthost', NOW)).toBe('usage:globalvsthost:202610151234');
    expect(dayBucketKey('globalvsthost', NOW)).toBe('usage-day:globalvsthost:20261015');
  });
});

describe('checkAndIncrement (FR-007)', () => {
  it('allows requests below the per-client limit and throttles at the limit', async () => {
    const kv = fakeKv();
    for (let i = 0; i < 3; i++) {
      const result = await checkAndIncrement(kv, 'test-client', 3, NOW);
      expect(result.allowed).toBe(true);
    }
    const over = await checkAndIncrement(kv, 'test-client', 3, NOW);
    expect(over.allowed).toBe(false);
  });

  it('counts toward a minute window that rolls over', async () => {
    const kv = fakeKv();
    await checkAndIncrement(kv, 'test-client', 1, NOW);
    expect((await checkAndIncrement(kv, 'test-client', 1, NOW)).allowed).toBe(false);
    const nextMinute = new Date(NOW.getTime() + 60_000);
    expect((await checkAndIncrement(kv, 'test-client', 1, nextMinute)).allowed).toBe(true);
  });

  it('writes the minute bucket with the 2 h TTL and the day aggregate with the 30-day TTL', async () => {
    const kv = fakeKv();
    await checkAndIncrement(kv, 'test-client', 10, NOW);
    const minutePut = kv.puts.find((p) => p.key.startsWith('usage:test-client:'));
    const dayPut = kv.puts.find((p) => p.key.startsWith('usage-day:test-client:'));
    expect(minutePut?.ttl).toBe(MINUTE_TTL);
    expect(dayPut?.ttl).toBe(DAY_TTL);
  });
});

describe('bumpCounters (FR-009 attribution fields)', () => {
  it('increments errored/refused/throttled in both the minute bucket and the day aggregate, updating lastActivity', async () => {
    const kv = fakeKv();
    await bumpCounters(kv, 'test-client', 'e', NOW);
    await bumpCounters(kv, 'test-client', 'r', NOW);
    await bumpCounters(kv, 'test-client', 't', NOW);
    const minute = JSON.parse((await kv.get(minuteBucketKey('test-client', NOW))) ?? '{}');
    const day = JSON.parse((await kv.get(dayBucketKey('test-client', NOW))) ?? '{}');
    expect(minute).toMatchObject({ e: 1, r: 1, t: 1 });
    expect(day).toMatchObject({ e: 1, r: 1, t: 1 });
    expect(minute.la).toBe('2026-10-15T12:34:00.000Z');
    expect(day.la).toBe('2026-10-15T12:34:00.000Z');
  });
});
