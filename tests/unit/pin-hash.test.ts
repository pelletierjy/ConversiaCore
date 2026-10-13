import { describe, expect, it } from 'vitest';
import { hashPin, verifyPin } from '../../src/utils/pin-hash';

describe('hashPin', () => {
  it('returns a <saltHex>:<hashHex> string (32-char salt, 64-char SHA-256 hash)', async () => {
    const stored = await hashPin('1234');
    expect(stored).toMatch(/^[0-9a-f]{32}:[0-9a-f]{64}$/);
  });

  it('uses a random salt, so hashing the same PIN twice differs', async () => {
    const [a, b] = await Promise.all([hashPin('1234'), hashPin('1234')]);
    expect(a).not.toBe(b);
  });
});

describe('verifyPin', () => {
  it('accepts the correct PIN', async () => {
    const stored = await hashPin('4821');
    expect(await verifyPin('4821', stored)).toBe(true);
  });

  it('rejects a wrong PIN', async () => {
    const stored = await hashPin('4821');
    expect(await verifyPin('4822', stored)).toBe(false);
  });

  it('rejects a different PIN of the same length', async () => {
    const stored = await hashPin('4821');
    expect(await verifyPin('9999', stored)).toBe(false);
  });

  it('returns false for malformed stored values instead of throwing', async () => {
    expect(await verifyPin('4821', 'garbage')).toBe(false);
    expect(await verifyPin('4821', '')).toBe(false);
    expect(await verifyPin('4821', 'abc:def')).toBe(false);
  });
});
