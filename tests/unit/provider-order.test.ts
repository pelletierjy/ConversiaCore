import { describe, expect, it } from 'vitest';
import { AI_PROVIDERS } from '../../src/services/ai-provider-registry';
import { resolveProviderOrder } from '../../src/services/provider-order';
import { GEMINI_PROVIDER_ID } from '../../src/services/gemini';
import { GROQ_PROVIDER_ID } from '../../src/services/groq';
import { OPENROUTER_PROVIDER_ID } from '../../src/services/openrouter';
import { DEEPSEEK_PROVIDER_ID } from '../../src/services/deepseek';
import { HUGGING_FACE_PROVIDER_ID } from '../../src/services/huggingface';

const ALL_IDS = AI_PROVIDERS.map((p) => p.id);
const ids = (order: { id: string }[]) => order.map((p) => p.id);

describe('resolveProviderOrder', () => {
  it('follows the admin priority order, then appends registry newcomers', () => {
    expect(ids(resolveProviderOrder([OPENROUTER_PROVIDER_ID, GEMINI_PROVIDER_ID], []))).toEqual([
      OPENROUTER_PROVIDER_ID,
      GEMINI_PROVIDER_ID,
      GROQ_PROVIDER_ID,
      DEEPSEEK_PROVIDER_ID,
      HUGGING_FACE_PROVIDER_ID,
    ]);
  });

  it('removes disabled providers while preserving the rest of the order', () => {
    expect(ids(resolveProviderOrder(ALL_IDS, [GROQ_PROVIDER_ID, DEEPSEEK_PROVIDER_ID]))).toEqual([
      GEMINI_PROVIDER_ID,
      OPENROUTER_PROVIDER_ID,
      HUGGING_FACE_PROVIDER_ID,
    ]);
  });

  it('keeps a disabled newcomer disabled even though it is absent from the saved priority', () => {
    // The saved order predates Hugging Face's registration; the append-newcomer
    // logic must not resurrect it after the disabled filter runs.
    expect(ids(resolveProviderOrder([GEMINI_PROVIDER_ID], [HUGGING_FACE_PROVIDER_ID]))).not.toContain(
      HUGGING_FACE_PROVIDER_ID,
    );
    // Sanity: with nothing disabled, the same newcomer IS appended.
    expect(ids(resolveProviderOrder([GEMINI_PROVIDER_ID], []))).toContain(HUGGING_FACE_PROVIDER_ID);
  });

  it('ignores disabled ids that no longer exist in the registry', () => {
    expect(ids(resolveProviderOrder(ALL_IDS, ['retired-provider']))).toEqual(ALL_IDS);
  });

  it('returns an empty order when every provider is disabled', () => {
    expect(resolveProviderOrder(ALL_IDS, ALL_IDS)).toEqual([]);
  });
});