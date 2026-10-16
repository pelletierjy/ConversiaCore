// @vitest-environment jsdom
// TDD RED phase — task T011 (feature 002-secure-embed-telemetry).
// Contract: specs/002-secure-embed-telemetry/contracts/embedder-injection.md (FR-020).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getClientIdentity, resetClientIdentityCache } from '../../src/services/client-identity';

type WindowWithGlobal = Window & { conversiaClient?: unknown };

const win = window as unknown as WindowWithGlobal;

beforeEach(() => {
  resetClientIdentityCache();
  delete win.conversiaClient;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getClientIdentity (injected window.conversiaClient global)', () => {
  it('accepts a well-formed v1 global', () => {
    win.conversiaClient = { version: 1, remoteId: 'globalvsthost', key: 'cvk_globalvsthost_abc' };
    expect(getClientIdentity()).toEqual({ remoteId: 'globalvsthost', key: 'cvk_globalvsthost_abc' });
  });

  it('returns null when the global is absent (degraded mode)', () => {
    expect(getClientIdentity()).toBeNull();
  });

  it('rejects malformed shapes with a developer-facing warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    win.conversiaClient = { version: 1, remoteId: 'BAD ID', key: 'k' };
    expect(getClientIdentity()).toBeNull();
    win.conversiaClient = { version: 1, remoteId: 'globalvsthost', key: '' };
    expect(getClientIdentity()).toBeNull();
    win.conversiaClient = 'nope';
    expect(getClientIdentity()).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('refuses unknown versions with a warning (contract evolution guard)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    win.conversiaClient = { version: 2, remoteId: 'globalvsthost', key: 'k' };
    expect(getClientIdentity()).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('deliberately ignores credentials supplied via URL parameters (FR-020)', () => {
    // Simulate an unsupported host integration that puts the key in the launch URL.
    window.history.replaceState({}, '', '/?remoteId=globalvsthost&key=cvk_globalvsthost_leaked');
    expect(getClientIdentity()).toBeNull();
    window.history.replaceState({}, '', '/');
  });

  it('reads the global only once per session (stable identity)', () => {
    win.conversiaClient = { version: 1, remoteId: 'globalvsthost', key: 'first' };
    const first = getClientIdentity();
    win.conversiaClient = { version: 1, remoteId: 'globalvsthost', key: 'second' };
    expect(getClientIdentity()).toBe(first);
    expect(getClientIdentity()?.key).toBe('first');
  });
});
