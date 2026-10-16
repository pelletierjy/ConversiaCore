// Client credential gate — feature 002-secure-embed-telemetry (contracts/client-auth.md, FR-002…FR-004).
// All failure modes collapse into the same generic `{ ok: false }` shape so the HTTP layer can
// return one indistinguishable refusal (FR-002: no oracle).

import { getClient, isValidRemoteId, type EmbeddingClient } from './client-registry';
import { constantTimeEquals, sha256Hex, type KvLike } from './credential-utils';

export interface AuthEnv {
  CLIENTS?: KvLike;
}

export type CredentialCheck =
  | { ok: true; client: EmbeddingClient }
  | { ok: false; reason: 'missing' | 'unknown'; remoteId?: string };

/** Verifies the `X-Conversia-Client` / `X-Conversia-Key` pair against the registry.
 *  `origins` on the record is defense-in-depth only — never sufficient without the key (FR-003). */
export async function verifyClientCredential(headers: Headers, env: AuthEnv, origin: string | null): Promise<CredentialCheck> {
  const remoteId = headers.get('X-Conversia-Client');
  const key = headers.get('X-Conversia-Key');
  if (!remoteId || !key || !isValidRemoteId(remoteId)) {
    return { ok: false, reason: 'missing' };
  }
  // Fail closed when the registry is unavailable (misconfigured binding), never open.
  if (!env.CLIENTS) {
    return { ok: false, reason: 'unknown', remoteId };
  }
  const client = await getClient(env.CLIENTS, remoteId);
  if (!client || client.status !== 'active') {
    return { ok: false, reason: 'unknown', remoteId };
  }
  if (client.origins.length > 0 && (!origin || !client.origins.includes(origin))) {
    return { ok: false, reason: 'unknown', remoteId };
  }
  const presented = await sha256Hex(key);
  // Compare against every credential without early exit to avoid a per-entry timing signal.
  let matched = false;
  for (const credential of client.credentials) {
    if (constantTimeEquals(presented, credential.keyHash)) matched = true;
  }
  if (!matched) {
    return { ok: false, reason: 'unknown', remoteId };
  }
  return { ok: true, client };
}
