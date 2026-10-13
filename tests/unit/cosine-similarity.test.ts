import { describe, expect, it } from 'vitest';
import { cosineSimilarity } from '../../src/utils/cosine-similarity';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 10);
  });

  it('returns 1 for positively scaled vectors', () => {
    expect(cosineSimilarity([1, 1], [5, 5])).toBeCloseTo(1, 10);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 10);
  });

  it('computes a known non-trivial similarity', () => {
    // dot = 32, |a| = sqrt(14), |b| = sqrt(77) => 32 / sqrt(1078)
    expect(cosineSimilarity([1, 2, 3], [4, 5, 6])).toBeCloseTo(32 / Math.sqrt(1078), 10);
  });

  it('returns 0 when either vector is all zeros', () => {
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
    expect(cosineSimilarity([1, 2], [0, 0])).toBe(0);
  });

  it('throws on length mismatch', () => {
    expect(() => cosineSimilarity([1, 2, 3], [1, 2])).toThrow(
      'Vector length mismatch: 3 !== 2',
    );
  });
});
