// Per-client usage aggregation — feature 002-secure-embed-telemetry (FR-009, clarify Q5: same
// 30-day retention window as logs, no long-term aggregates). Sums the daily counter buckets
// maintained by rate-limit.ts.

import type { KvLike } from './credential-utils';
import { dayBucketKey } from './rate-limit';

export interface UsageDay {
  day: string; // YYYYMMDD (UTC)
  served: number; // gate-allowed requests
  errored: number; // subset of served that hit upstream/handler errors
  refused: number; // refused-authorization requests
  throttled: number; // rate-limited requests
  lastActivity: string | null;
}

export interface UsageSummary {
  remoteId: string;
  windowDays: number;
  served: number;
  errored: number;
  refused: number;
  throttled: number;
  lastActivity: string | null;
  perDay: UsageDay[];
}

const DAY_MS = 24 * 3600 * 1000;

export async function getUsageSummary(kv: KvLike, remoteId: string, days = 30, now: Date = new Date()): Promise<UsageSummary> {
  const perDay: UsageDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * DAY_MS);
    const key = dayBucketKey(remoteId, date);
    const day = key.slice(key.lastIndexOf(':') + 1);
    let served = 0;
    let errored = 0;
    let refused = 0;
    let throttled = 0;
    let lastActivity: string | null = null;
    const raw = await kv.get(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { s?: number; e?: number; r?: number; t?: number; la?: string };
        served = typeof parsed.s === 'number' ? parsed.s : 0;
        errored = typeof parsed.e === 'number' ? parsed.e : 0;
        refused = typeof parsed.r === 'number' ? parsed.r : 0;
        throttled = typeof parsed.t === 'number' ? parsed.t : 0;
        lastActivity = typeof parsed.la === 'string' && parsed.la ? parsed.la : null;
      } catch {
        // malformed bucket → counts as zero, attribution degrades gracefully
      }
    }
    perDay.push({ day, served, errored, refused, throttled, lastActivity });
  }
  const sum = (pick: (d: UsageDay) => number): number => perDay.reduce((acc, d) => acc + pick(d), 0);
  const lastActivity = perDay
    .map((d) => d.lastActivity)
    .filter((la): la is string => Boolean(la))
    .sort()
    .pop() ?? null;
  return {
    remoteId,
    windowDays: days,
    served: sum((d) => d.served),
    errored: sum((d) => d.errored),
    refused: sum((d) => d.refused),
    throttled: sum((d) => d.throttled),
    lastActivity,
    perDay,
  };
}
