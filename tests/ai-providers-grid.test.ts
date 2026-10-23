import { describe, expect, it } from 'vitest';
import {
  buildProviderRows,
  computeProviderSave,
  extractRows,
  type ProviderGridRow,
} from '../src/ui/admin/ai-providers-grid';
import { AI_PROVIDERS } from '../src/services/ai-provider-registry';

const row = (over: Partial<ProviderGridRow> = {}): ProviderGridRow => ({
  position: 1,
  id: 'gemini',
  provider: 'Google',
  model: 'Gemini',
  enabled: true,
  ...over,
});

describe('buildProviderRows', () => {
  it('uses registry order when no priority is stored', () => {
    const rows = buildProviderRows({});
    expect(rows.map((r) => r.id)).toEqual(AI_PROVIDERS.map((p) => p.id));
    expect(rows.every((r) => r.enabled)).toBe(true);
    expect(rows.map((r) => r.position)).toEqual(rows.map((_, i) => i + 1));
  });

  it('honours a stored priority, drops retired ids and appends new providers', () => {
    const priority = ['groq', 'retired-provider'];
    const rows = buildProviderRows({ aiProviderPriority: priority, aiDisabledProviders: [] });
    expect(rows[0].id).toBe('groq');
    expect(rows.some((r) => r.id === 'retired-provider')).toBe(false);
    // every registry provider still present, appended after the stored order
    for (const p of AI_PROVIDERS) expect(rows.some((r) => r.id === p.id)).toBe(true);
  });

  it('maps disabled ids to enabled=false', () => {
    const first = AI_PROVIDERS[0].id;
    const rows = buildProviderRows({ aiDisabledProviders: [first] });
    expect(rows.find((r) => r.id === first)?.enabled).toBe(false);
    expect(rows.filter((r) => r.enabled).length).toBe(AI_PROVIDERS.length - 1);
  });
});

describe('computeProviderSave', () => {
  it('sorts by position and normalizes positions to 1..n', () => {
    const result = computeProviderSave([
      row({ id: 'a', position: 30 }),
      row({ id: 'b', position: 10 }),
      row({ id: 'c', position: 20 }),
    ]);
    expect(result.ok).toBe(true);
    expect(result.priority).toEqual(['b', 'c', 'a']);
    expect(result.rows?.map((r) => [r.id, r.position])).toEqual([
      ['b', 1],
      ['c', 2],
      ['a', 3],
    ]);
  });

  it('keeps display order for equal positions (stable sort)', () => {
    const result = computeProviderSave([
      row({ id: 'first', position: 5 }),
      row({ id: 'second', position: 5 }),
    ]);
    expect(result.priority).toEqual(['first', 'second']);
  });

  it('reports disabled ids as the complement of enabled', () => {
    const result = computeProviderSave([row({ id: 'a' }), row({ id: 'b', enabled: false })]);
    expect(result.disabledIds).toEqual(['b']);
  });

  it('rejects a config where every provider is disabled', () => {
    const result = computeProviderSave([
      row({ id: 'a', enabled: false }),
      row({ id: 'b', enabled: false }),
    ]);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('all_disabled');
    expect(result.priority).toBeUndefined();
  });
});

describe('extractRows', () => {
  const rows = [row()];

  it('accepts the payload itself', () => {
    expect(extractRows(rows)).toEqual(rows);
  });

  it('accepts a single-element wrapper around the payload', () => {
    expect(extractRows([rows])).toEqual(rows);
  });

  it('accepts an empty payload', () => {
    expect(extractRows([])).toEqual([]);
  });

  it('rejects non-array payloads', () => {
    expect(extractRows({ rows })).toBeNull();
    expect(extractRows(undefined)).toBeNull();
  });
});
