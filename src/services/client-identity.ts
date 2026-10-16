// Client identity loader — feature 002-secure-embed-telemetry (contracts/embedder-injection.md, FR-020).
// The embedding host injects `window.conversiaClient = { version, remoteId, key }` before any
// widget script runs. Credentials in the launch URL are deliberately ignored: the global is the
// only accepted source, so keys never touch URLs, history, or referrers.

export interface ClientIdentity {
  remoteId: string;
  key: string;
}

interface ConversiaClientGlobal {
  version: number;
  remoteId: string;
  key: string;
}

export const CLIENT_IDENTITY_VERSION = 1;

const REMOTE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{2,63}$/;

let cached: ClientIdentity | null | undefined;

/** Returns the injected identity, or null (degraded mode: the widget renders but AI requests
 *  surface a friendly "not configured" error). Read once per session. */
export function getClientIdentity(): ClientIdentity | null {
  if (cached !== undefined) return cached;
  cached = null;
  const injected = (globalThis as { conversiaClient?: unknown }).conversiaClient;
  if (injected && typeof injected === 'object') {
    const candidate = injected as ConversiaClientGlobal;
    if (candidate.version !== CLIENT_IDENTITY_VERSION) {
      console.warn(`conversiaClient: unsupported version ${String(candidate.version)} (expected ${CLIENT_IDENTITY_VERSION}); assistant degraded.`);
    } else if (
      typeof candidate.remoteId === 'string' &&
      REMOTE_ID_PATTERN.test(candidate.remoteId) &&
      typeof candidate.key === 'string' &&
      candidate.key.length > 0
    ) {
      cached = { remoteId: candidate.remoteId, key: candidate.key };
    } else {
      console.warn('conversiaClient: malformed global (need { version, remoteId, key }); assistant degraded.');
    }
  }
  return cached;
}

/** Test-only: clears the one-shot cache so scenarios can re-inject a different global. */
export function resetClientIdentityCache(): void {
  cached = undefined;
}
