import { WORKER_BASE_URL } from '../config';
import { AiProviderError } from './ai-provider';
import { getClientIdentity } from './client-identity';

/** The orchestrator sets this before each provider attempt (1-based) so the worker can log
 *  fallback depth via the optional X-Conversia-Attempt header (contracts/client-auth.md).
 *  Resets to 1 after each request so a fresh conversation turn starts a new chain. */
let nextAttemptNumber = 1;

export function setAttemptNumber(attempt: number): void {
  nextAttemptNumber = attempt;
}

/** Posts to a route on the Cloudflare Worker proxy that holds the provider API keys server-side.
 *  Every request carries the embedding client's injected credential (feature 002-secure-embed-telemetry):
 *  the worker refuses anything else with a generic 401/429 that is surfaced as a typed,
 *  non-retryable error so the orchestrator doesn't burn through providers pointlessly. */
export async function postToWorker<T>(path: string, body: unknown): Promise<T> {
  const identity = getClientIdentity();
  if (!identity) {
    throw new AiProviderError('worker', 'client_not_configured', 'No window.conversiaClient credential was injected into this page.');
  }
  const attempt = nextAttemptNumber;
  nextAttemptNumber = 1;
  const response = await fetch(`${WORKER_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Conversia-Client': identity.remoteId,
      'X-Conversia-Key': identity.key,
      'X-Conversia-Attempt': String(attempt),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const parsed = (await response.json().catch(() => ({ error: 'unknown' }))) as { error?: string };
    const errorText = `${response.status} ${parsed.error ?? 'unknown'}`;
    if (response.status === 401 && parsed.error === 'not_authorized') {
      throw new AiProviderError('worker', 'client_unauthorized', errorText);
    }
    if (response.status === 429 && parsed.error === 'rate_limited') {
      throw new AiProviderError('worker', 'client_throttled', errorText);
    }
    throw new Error(errorText);
  }
  return response.json() as Promise<T>;
}
