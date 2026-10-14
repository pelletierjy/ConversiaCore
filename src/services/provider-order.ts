import type { AiProvider } from './ai-provider';
import { AI_PROVIDERS } from './ai-provider-registry';

/** Builds the active provider try-order for one turn:
 * admin priority first, registry providers missing from the saved order appended
 * (newcomers registered after the order was last saved), then admin-disabled ids
 * removed — the filter runs AFTER the append so a disabled provider absent from
 * the saved order cannot sneak back in at the end.
 * Returns [] when every provider is disabled; the admin panel blocks saving that
 * state, and a manual Firestore edit surfaces as "No AI provider is configured." */
export function resolveProviderOrder(priority: string[], disabled: string[]): AiProvider[] {
  const byId = new Map(AI_PROVIDERS.map((p) => [p.id, p]));
  const ordered = priority.map((id) => byId.get(id)).filter((p): p is AiProvider => Boolean(p));
  for (const p of AI_PROVIDERS) if (!ordered.includes(p)) ordered.push(p);
  const off = new Set(disabled);
  return ordered.filter((p) => !off.has(p.id));
}