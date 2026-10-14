import { getDoc } from 'firebase/firestore';
import { appConfigDoc } from '../db/firebase';
import { isFirebaseConfigured } from '../config';
import { DEFAULT_PROVIDER_PRIORITY } from './ai-provider-registry';
import type { AppConfig } from '../models/types';

const CACHE_TTL_MS = 60_000;
let cached: { priority: string[]; disabled: string[]; expiresAt: number } | null = null;

async function loadProviderSettings(): Promise<{ priority: string[]; disabled: string[] }> {
  if (cached && cached.expiresAt > Date.now()) return cached;
  if (!isFirebaseConfigured()) return { priority: DEFAULT_PROVIDER_PRIORITY, disabled: [] };
  try {
    const snap = await getDoc(appConfigDoc());
    const cfg = snap.exists() ? (snap.data() as AppConfig) : null;
    const value = {
      priority: cfg?.aiProviderPriority?.length ? cfg.aiProviderPriority : DEFAULT_PROVIDER_PRIORITY,
      disabled: cfg?.aiDisabledProviders ?? [],
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    cached = value;
    return value;
  } catch {
    return { priority: DEFAULT_PROVIDER_PRIORITY, disabled: [] };
  }
}

/** Admin-configured provider try-order, best-effort with a short in-memory cache. */
export async function getProviderPriority(): Promise<string[]> {
  return (await loadProviderSettings()).priority;
}

/** Admin-disabled provider ids, sharing the priority list's cache (same Firestore doc). */
export async function getDisabledProviders(): Promise<string[]> {
  return (await loadProviderSettings()).disabled;
}

/** Called by the admin UI right after a successful save so this tab picks up the new order and
 *  enabled flags immediately. */
export function invalidateProviderPriorityCache(): void {
  cached = null;
}
