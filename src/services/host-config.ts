import { getDoc } from 'firebase/firestore';
import { hostAppConfigDoc } from '../db/firebase';
import { isFirebaseConfigured } from '../config';
import type { HostAppConfig } from '../models/types';

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { value: HostAppConfig | null; expiresAt: number }>();

/** Admin-configured per-host prompt/guardrails, keyed by the host app's `context` value, best-effort with a short in-memory cache. */
export async function getHostAppConfig(contextKey: string): Promise<HostAppConfig | null> {
  const cached = cache.get(contextKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  if (!isFirebaseConfigured()) return null;
  try {
    const snap = await getDoc(hostAppConfigDoc(contextKey));
    const value = snap.exists() ? (snap.data() as HostAppConfig) : null;
    cache.set(contextKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  } catch {
    return null;
  }
}

/** Called by the admin UI right after a successful save so the widget picks up the new config immediately. */
export function invalidateHostAppConfigCache(contextKey?: string): void {
  if (contextKey) cache.delete(contextKey);
  else cache.clear();
}
