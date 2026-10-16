// @vitest-environment node
// TDD RED phase — task T019 (feature 002-secure-embed-telemetry).
// Contract: specs/002-secure-embed-telemetry/contracts/admin-cli.md (CLI half).
import { describe, expect, it, vi } from 'vitest';
import { runCommand } from '../../../tools/conversia-admin/index.js';

type FetchImpl = (url: string, init?: { method?: string; headers?: Record<string, string> }) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

function fetchStub(status: number, data: unknown): { fetchImpl: FetchImpl; fetchMock: ReturnType<typeof vi.fn> } {
  const fetchMock = vi.fn(async () => ({ ok: status < 400, status, json: async () => data }));
  return { fetchImpl: fetchMock as unknown as FetchImpl, fetchMock };
}

const ENV = { CONVERSIA_WORKER_URL: 'https://worker.example', CONVERSIA_ADMIN_TOKEN: 'tok' };

describe('argument and environment validation (exit codes 0/1/2/3)', () => {
  it('fails with exit 1 on no arguments', async () => {
    const result = await runCommand([], { fetchImpl: async () => ({} as never), env: ENV });
    expect(result.exitCode).toBe(1);
    expect(result.output).toMatchObject({ ok: false });
  });

  it('fails with exit 1 when env vars are missing', async () => {
    const result = await runCommand(['client', 'list'], { fetchImpl: async () => ({} as never), env: {} });
    expect(result.exitCode).toBe(1);
    expect((result.output as { error: { code: string } }).error.code).toBe('missing_env');
  });

  it('fails with exit 1 on an unknown command', async () => {
    const result = await runCommand(['frobnicate'], { fetchImpl: async () => ({} as never), env: ENV });
    expect(result.exitCode).toBe(1);
  });

  it('maps HTTP 401 to exit 2 (auth failure)', async () => {
    const { fetchImpl } = fetchStub(401, { error: 'invalid_token' });
    const result = await runCommand(['client', 'list'], { fetchImpl, env: ENV });
    expect(result.exitCode).toBe(2);
    expect((result.output as { ok: boolean }).ok).toBe(false);
  });

  it('maps network failures and 5xx to exit 3', async () => {
    const networkFailure = { fetchImpl: async () => { throw new Error('connection refused'); }, env: ENV };
    const result = await runCommand(['client', 'list'], networkFailure);
    expect(result.exitCode).toBe(3);
    const { fetchImpl } = fetchStub(503, { error: 'not_configured' });
    expect((await runCommand(['client', 'list'], { fetchImpl, env: ENV })).exitCode).toBe(3);
  });

  it('maps 4xx command errors to exit 1 with a machine-readable code', async () => {
    const { fetchImpl } = fetchStub(409, { error: 'already_exists' });
    const result = await runCommand(['client', 'add', '--remote-id', 'x'], { fetchImpl, env: ENV });
    expect(result.exitCode).toBe(1);
    expect((result.output as { error: { code: string } }).error.code).toBe('conflict');
  });
});

describe('commands (JSON envelope, contracts/admin-cli.md)', () => {
  it('client add posts the record and surfaces the one-time key', async () => {
    const { fetchImpl, fetchMock } = fetchStub(201, { remoteId: 'globalvsthost', keyId: 'ab12cd34', key: 'cvk_globalvsthost_abc' });
    const result = await runCommand(['client', 'add', '--remote-id', 'globalvsthost', '--label', 'GVH', '--limit', '500', '--origin', 'https://a.example', '--origin', 'https://b.example'], { fetchImpl, env: ENV });
    expect(result.exitCode).toBe(0);
    expect(result.output).toMatchObject({ ok: true, data: { remoteId: 'globalvsthost', key: 'cvk_globalvsthost_abc' } });
    const [url, init] = fetchMock.mock.calls[0] as [string, { method: string; headers: Record<string, string>; body: string }];
    expect(url).toBe('https://worker.example/admin/clients');
    expect(init.method).toBe('POST');
    expect(init.headers['X-Admin-Token']).toBe('tok');
    expect(JSON.parse(init.body)).toEqual({
      remoteId: 'globalvsthost',
      label: 'GVH',
      requestLimitPerMinute: 500,
      origins: ['https://a.example', 'https://b.example'],
    });
  });

  it('client list / show / rotate / revoke-key / revoke hit the documented endpoints', async () => {
    const cases: Array<[string[], string, string]> = [
      [['client', 'list'], 'https://worker.example/admin/clients', 'GET'],
      [['client', 'show', '--remote-id', 'gvh'], 'https://worker.example/admin/clients/gvh', 'GET'],
      [['client', 'rotate', '--remote-id', 'gvh'], 'https://worker.example/admin/clients/gvh/rotate', 'POST'],
      [['client', 'revoke-key', '--remote-id', 'gvh', '--key-id', 'ab12cd34'], 'https://worker.example/admin/clients/gvh/keys/ab12cd34/revoke', 'POST'],
      [['client', 'revoke', '--remote-id', 'gvh'], 'https://worker.example/admin/clients/gvh/revoke', 'POST'],
      [['usage', '--remote-id', 'gvh', '--days', '7'], 'https://worker.example/admin/usage?remoteId=gvh&days=7', 'GET'],
    ];
    for (const [argv, expectedUrl, expectedMethod] of cases) {
      const { fetchImpl, fetchMock } = fetchStub(200, { ok: true });
      const result = await runCommand(argv, { fetchImpl, env: ENV });
      expect(result.exitCode).toBe(0);
      const [url, init] = fetchMock.mock.calls[0] as [string, { method: string }];
      expect(url).toBe(expectedUrl);
      expect(init.method).toBe(expectedMethod);
    }
  });

  it('prints the plaintext key exactly once on add/rotate (stdout contract)', async () => {
    const { fetchImpl } = fetchStub(200, { keyId: 'k1', key: 'cvk_gvh_supersecret' });
    const result = await runCommand(['client', 'rotate', '--remote-id', 'gvh'], { fetchImpl, env: ENV });
    const printed = JSON.stringify(result.output);
    expect(printed.split('cvk_gvh_supersecret').length - 1).toBe(1);
  });

  it('supports --human output', async () => {
    const { fetchImpl } = fetchStub(200, { clients: [{ remoteId: 'gvh', status: 'active' }] });
    const result = await runCommand(['client', 'list', '--human'], { fetchImpl, env: ENV });
    expect(typeof result.output).toBe('string');
    expect(String(result.output)).toContain('gvh');
  });
});
