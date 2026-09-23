import { getDoc } from 'firebase/firestore';
import { appConfigDoc } from '../db/firebase';
import { isFirebaseConfigured } from '../config';
import { DEFAULT_PROVIDER_PRIORITY } from './ai-provider-registry';
import type { AppConfig } from '../models/types';

const CACHE_TTL_MS = 60_000;
let cached: { value: string[]; expiresAt: number } | null = null;

/** Admin-configured provider try-order, best-effort with a short in-memory cache. */
export async function getProviderPriority(): Promise<string[]> {
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  if (!isFirebaseConfigured()) return DEFAULT_PROVIDER_PRIORITY;
  try {
    const snap = await getDoc(appConfigDoc());
    const stored = snap.exists() ? (snap.data() as AppConfig).aiProviderPriority : undefined;
    const value = stored?.length ? stored : DEFAULT_PROVIDER_PRIORITY;
    cached = { value, expiresAt: Date.now() + CACHE_TTL_MS };
    return value;
  } catch {
    return DEFAULT_PROVIDER_PRIORITY;
  }
}

/** Called by the admin UI right after a successful save so this tab picks up the new order immediately. */
export function invalidateProviderPriorityCache(): void {
  cached = null;
}
