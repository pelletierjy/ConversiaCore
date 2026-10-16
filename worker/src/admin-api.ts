// Admin surface — feature 002-secure-embed-telemetry (contracts/admin-cli.md, FR-005/006/008/009/010).
// Reached only through the worker router (which skips the origin gate here: the operator CLI
// sends no Origin). Guarded by the ADMIN_TOKEN secret; disabled (503) when it is not set.

import { createClientRecord, getClient, putClient, type Credential, type EmbeddingClient } from './client-registry';
import { constantTimeEquals, generateCredential, sha256Hex, type KvLike } from './credential-utils';
import { logEvent, type LogEventInput } from './observability';
import { getUsageSummary } from './usage';

export interface AdminEnv {
  CLIENTS?: KvLike;
  ADMIN_TOKEN?: string;
}

const CLIENT_PATH = /^\/admin\/clients\/([a-z0-9][a-z0-9-]{2,63})(\/keys\/([a-z0-9]{1,64})\/revoke|\/rotate|\/revoke)?$/;
const MAX_USAGE_DAYS = 90;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function issueCredential(remoteId: string): Promise<{ credential: Credential; key: string }> {
  const { keyId, key } = generateCredential(remoteId);
  return { credential: { keyId, keyHash: await sha256Hex(key), issuedAt: new Date().toISOString() }, key };
}

/** Public list projection — never exposes key hashes outside the operator-only show route. */
function toListItem(record: EmbeddingClient) {
  return {
    remoteId: record.remoteId,
    label: record.label,
    status: record.status,
    credentialCount: record.credentials.length,
    keyIds: record.credentials.map((c) => c.keyId),
    requestLimitPerMinute: record.requestLimitPerMinute,
    origins: record.origins,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    ...(record.revokedAt ? { revokedAt: record.revokedAt } : {}),
  };
}

export async function handleAdminRequest(request: Request, env: AdminEnv, origin: string | null, correlationId: string): Promise<Response> {
  const { pathname } = new URL(request.url);

  if (!env.ADMIN_TOKEN) {
    return json({ error: 'not_configured' }, 503);
  }
  const presentedHash = await sha256Hex(request.headers.get('X-Admin-Token') ?? '');
  const expectedHash = await sha256Hex(env.ADMIN_TOKEN);
  if (!constantTimeEquals(presentedHash, expectedHash)) {
    logEvent({
      correlationId,
      route: pathname,
      origin: origin ?? undefined,
      level: 'warn',
      event: 'request_refused',
      outcome: 'refused',
      status: 401,
      errorKind: 'invalid_admin_token',
    });
    return json({ error: 'invalid_token' }, 401);
  }
  if (!env.CLIENTS) {
    return json({ error: 'not_configured' }, 503);
  }
  const kv = env.CLIENTS;
  const security = (event: string, remoteId: string, level: LogEventInput['level'] = 'warn'): void => {
    logEvent({ correlationId, route: pathname, origin: origin ?? undefined, event, level, remoteId });
  };

  // ---- GET /admin/usage?remoteId=&days= --------------------------------------------------
  if (pathname === '/admin/usage' && request.method === 'GET') {
    const remoteId = new URL(request.url).searchParams.get('remoteId');
    if (!remoteId) return json({ error: 'missing_remote_id' }, 400);
    const requestedDays = Number(new URL(request.url).searchParams.get('days') ?? '30');
    const days = Number.isFinite(requestedDays) ? Math.min(Math.max(Math.trunc(requestedDays), 1), MAX_USAGE_DAYS) : 30;
    const summary = await getUsageSummary(kv, remoteId, days);
    security('usage_report', remoteId, 'info');
    return json(summary, 200);
  }

  // ---- collection ------------------------------------------------------------------------
  if (pathname === '/admin/clients') {
    if (request.method === 'GET') {
      const listed = await kv.list({ prefix: 'clients:' });
      const clients: ReturnType<typeof toListItem>[] = [];
      for (const key of listed.keys.map((k) => k.name).sort()) {
        const raw = await kv.get(key);
        if (!raw) continue;
        try {
          clients.push(toListItem(JSON.parse(raw) as EmbeddingClient));
        } catch {
          // skip malformed records rather than failing the whole listing
        }
      }
      return json({ clients }, 200);
    }
    if (request.method === 'POST') {
      const body = (await request.json().catch(() => undefined)) as
        | { remoteId?: string; label?: string; requestLimitPerMinute?: number; origins?: string[] }
        | undefined;
      if (!body || typeof body.remoteId !== 'string') return json({ error: 'missing_remote_id' }, 400);
      let record: EmbeddingClient;
      try {
        record = createClientRecord({
          remoteId: body.remoteId,
          label: body.label,
          requestLimitPerMinute: body.requestLimitPerMinute,
          origins: body.origins,
        });
      } catch (error) {
        return json({ error: 'invalid_request', detail: error instanceof Error ? error.message : String(error) }, 400);
      }
      if (await getClient(kv, record.remoteId)) return json({ error: 'already_exists' }, 409);
      const { credential, key } = await issueCredential(record.remoteId);
      record.credentials.push(credential);
      await putClient(kv, record);
      security('client_registered', record.remoteId);
      return json({ remoteId: record.remoteId, label: record.label, keyId: credential.keyId, key, requestLimitPerMinute: record.requestLimitPerMinute, createdAt: record.createdAt }, 201);
    }
    return json({ error: 'method_not_allowed' }, 405);
  }

  // ---- single client ---------------------------------------------------------------------
  const match = CLIENT_PATH.exec(pathname);
  if (!match) return json({ error: 'not_found' }, 404);
  const [, remoteId, action, keyId] = match;
  const record = await getClient(kv, remoteId);
  if (!record) return json({ error: 'not_found' }, 404);

  if (request.method === 'GET' && !action) {
    return json(record, 200); // operator-only: includes key hashes
  }
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  if (action === '/rotate') {
    if (record.status === 'revoked') return json({ error: 'client_revoked' }, 400);
    if (record.credentials.length >= 2) return json({ error: 'too_many_credentials' }, 400);
    const { credential, key } = await issueCredential(record.remoteId);
    record.credentials.push(credential);
    record.updatedAt = new Date().toISOString();
    await putClient(kv, record);
    security('client_rotated', remoteId);
    return json({ keyId: credential.keyId, key, activeCredentials: record.credentials.length }, 200);
  }
  if (action === '/revoke') {
    record.status = 'revoked';
    record.revokedAt = new Date().toISOString();
    record.updatedAt = record.revokedAt;
    await putClient(kv, record);
    security('client_revoked', remoteId);
    return json({ remoteId, status: record.status, revokedAt: record.revokedAt }, 200);
  }
  if (action?.startsWith('/keys/') && keyId) {
    const index = record.credentials.findIndex((c) => c.keyId === keyId);
    if (index === -1) return json({ error: 'key_not_found' }, 404);
    if (record.credentials.length === 1) return json({ error: 'last_credential' }, 400);
    record.credentials.splice(index, 1);
    record.updatedAt = new Date().toISOString();
    await putClient(kv, record);
    security('client_key_revoked', remoteId);
    return json({ remoteId, keyId, remaining: record.credentials.length }, 200);
  }
  return json({ error: 'not_found' }, 404);
}
