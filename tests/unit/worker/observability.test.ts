// @vitest-environment node
// TDD RED phase — task T004 (feature 002-secure-embed-telemetry).
// Contract: specs/002-secure-embed-telemetry/contracts/observability.md + data-model.md § LogEvent.
import { describe, expect, it, vi, afterEach } from 'vitest';
import { buildLogEvent, logEvent, newCorrelationId } from '../../../worker/src/observability';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('newCorrelationId', () => {
  it('returns a UUID-shaped id (FR-011)', () => {
    expect(newCorrelationId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('returns unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => newCorrelationId()));
    expect(ids.size).toBe(50);
  });
});

describe('buildLogEvent (FR-012 closed schema)', () => {
  it('requires event, level, timestamp and correlation id', () => {
    expect(() => buildLogEvent({} as never)).toThrow();
    expect(() => buildLogEvent({ event: 'request_served' } as never)).toThrow();
    expect(() =>
      buildLogEvent({ event: 'request_served', level: 'info', correlationId: newCorrelationId() } as never),
    ).not.toThrow();
  });

  it('fills ts when absent and keeps all closed-schema fields', () => {
    const evt = buildLogEvent({
      event: 'request_served',
      level: 'info',
      correlationId: 'cid-1',
      remoteId: 'globalvsthost',
      route: '/gemini/chat',
      origin: 'https://pelletierjy.github.io',
      outcome: 'served',
      status: 200,
      durationMs: 42,
      provider: 'gemini',
      fallbackCount: 1,
    });
    expect(evt.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(evt).toMatchObject({
      event: 'request_served',
      level: 'info',
      correlationId: 'cid-1',
      remoteId: 'globalvsthost',
      route: '/gemini/chat',
      origin: 'https://pelletierjy.github.io',
      outcome: 'served',
      status: 200,
      durationMs: 42,
      provider: 'gemini',
      fallbackCount: 1,
    });
  });

  it('drops fields outside the closed schema (FR-014) with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const evt = buildLogEvent({
      event: 'request_served',
      level: 'info',
      correlationId: 'cid-2',
      chatContent: 'my homework answer',
      apiKey: 'GEMINI_API_KEY_VALUE',
    } as never);
    expect(evt).not.toHaveProperty('chatContent');
    expect(evt).not.toHaveProperty('apiKey');
    expect(warn).toHaveBeenCalled();
  });

  it('redacts secret-looking values in string fields (SC-007)', () => {
    const evt = buildLogEvent({
      event: 'request_refused',
      level: 'warn',
      correlationId: 'cid-3',
      route: 'cvk_globalvsthost_abc123',
      errorKind: 'Bearer some-provider-key',
    });
    expect(evt.route).toBe('[redacted]');
    expect(evt.errorKind).toBe('[redacted]');
  });
});

describe('logEvent (FR-012 one structured entry)', () => {
  it('emits exactly one single-line JSON console.log entry', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const evt = logEvent({
      event: 'request_throttled',
      level: 'warn',
      correlationId: 'cid-4',
      remoteId: 'globalvsthost',
      outcome: 'throttled',
      status: 429,
      durationMs: 3,
    });
    expect(log).toHaveBeenCalledTimes(1);
    const printed = String(log.mock.calls[0][0]);
    expect(printed).not.toContain('\n');
    expect(JSON.parse(printed)).toMatchObject({ event: 'request_throttled', correlationId: 'cid-4', remoteId: 'globalvsthost' });
    expect(evt.outcome).toBe('throttled');
  });
});
