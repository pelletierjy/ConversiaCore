// @vitest-environment jsdom
// Feature 002-secure-embed-telemetry — standalone SPA self-injection (contracts/embedder-injection.md).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bootstrapStandaloneIdentity } from '../../src/services/standalone-identity';

type WindowWithGlobal = Window & { conversiaClient?: { version: number; remoteId: string; key: string } };
const win = window as unknown as WindowWithGlobal;

beforeEach(() => {
  delete win.conversiaClient;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('bootstrapStandaloneIdentity (SPA-only first-party bootstrap)', () => {
  it('injects from build-time env when no identity is present', () => {
    vi.stubEnv('VITE_CONVERSIA_REMOTE_ID', 'conversia-web');
    vi.stubEnv('VITE_CONVERSIA_CLIENT_KEY', 'cvk_conversia-web_test');
    bootstrapStandaloneIdentity();
    expect(win.conversiaClient).toEqual({ version: 1, remoteId: 'conversia-web', key: 'cvk_conversia-web_test' });
  });

  it('degrades gracefully when the env values are absent (CI without secrets)', () => {
    vi.stubEnv('VITE_CONVERSIA_REMOTE_ID', '');
    vi.stubEnv('VITE_CONVERSIA_CLIENT_KEY', '');
    bootstrapStandaloneIdentity();
    expect(win.conversiaClient).toBeUndefined();
  });

  it('never overwrites an already-injected identity (host/iframe or prior bootstrap)', () => {
    vi.stubEnv('VITE_CONVERSIA_REMOTE_ID', 'conversia-web');
    vi.stubEnv('VITE_CONVERSIA_CLIENT_KEY', 'cvk_conversia-web_test');
    win.conversiaClient = { version: 1, remoteId: 'someone-else', key: 'cvk_someone-else_x' };
    bootstrapStandaloneIdentity();
    expect(win.conversiaClient?.remoteId).toBe('someone-else');
  });
});
