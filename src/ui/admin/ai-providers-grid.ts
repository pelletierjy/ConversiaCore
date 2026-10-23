import { AI_PROVIDERS, PROVIDER_DISPLAY } from '../../services/ai-provider-registry';
import { t } from '../../i18n/translations';
import type { AppConfig } from '../../models/types';

/**
 * Pure logic + schema for the AI-providers grid panel.
 *
 * Deliberately free of firebase/toast imports so it can be unit-tested (vitest)
 * and reused by the local grid harness page without pulling in Firestore.
 */

/**
 * Minimal structural types for the `<signal-grid>` web component.
 * The grid is consumed as a custom element (no npm dependency), so arrays and
 * objects are assigned as DOM **properties**, never attributes.
 */
export interface SignalGridColumnSchema {
  field: string;
  header?: string;
  type?: string;
  editable?: boolean;
  width?: number;
}

export interface SignalGridElement extends HTMLElement {
  model: unknown[];
  columns: SignalGridColumnSchema[];
}

/** One grid row. `position` is editable and drives the persisted priority order. */
export interface ProviderGridRow {
  position: number;
  id: string;
  provider: string;
  model: string;
  enabled: boolean;
}

/**
 * The grid's saveChanges payload: rows, or (defensively) a single-element
 * wrapper around them — Angular elements may deliver either shape.
 */
export function extractRows(detail: unknown): ProviderGridRow[] | null {
  if (Array.isArray(detail)) {
    if (detail.length === 0 || !Array.isArray(detail[0])) {
      return detail as ProviderGridRow[];
    }
    const wrapped = detail[0] as unknown;
    if (Array.isArray(wrapped)) {
      return wrapped as ProviderGridRow[];
    }
  }
  return null;
}

/** Column schemas — the grid's Formly-style plain-object configuration. */
export function providerColumns(): SignalGridColumnSchema[] {
  return [
    { field: 'position', header: '#', type: 'number', editable: true, width: 80 },
    { field: 'provider', header: t('chat.providerLabel'), type: 'string', width: 180 },
    { field: 'model', header: t('chat.modelLabel'), type: 'string', width: 220 },
    {
      field: 'enabled',
      header: t('admin.providerEnabledLabel'),
      type: 'boolean',
      editable: true,
      width: 130,
    },
  ];
}

/** Builds grid rows from the persisted config: array order = current priority. */
export function buildProviderRows(
  config: Pick<AppConfig, 'aiProviderPriority' | 'aiDisabledProviders'>,
): ProviderGridRow[] {
  const order = config.aiProviderPriority?.length
    ? [...config.aiProviderPriority].filter((id) => AI_PROVIDERS.some((p) => p.id === id))
    : AI_PROVIDERS.map((p) => p.id);
  for (const p of AI_PROVIDERS) if (!order.includes(p.id)) order.push(p.id); // newly-added providers appear at the end
  const disabled = new Set(config.aiDisabledProviders ?? []);
  return order.map((id, i) => ({
    position: i + 1,
    id,
    provider: PROVIDER_DISPLAY[id]?.provider ?? id,
    model: PROVIDER_DISPLAY[id]?.model ?? '—',
    enabled: !disabled.has(id),
  }));
}

export interface ProviderSaveResult {
  ok: boolean;
  error?: 'all_disabled';
  /** Rows normalized to positions 1..n in their new order (on success only). */
  rows?: ProviderGridRow[];
  priority?: string[];
  disabledIds?: string[];
}

/**
 * Pure save logic: validates the edited rows and derives the persisted shape.
 * Sorting is stable — equal positions keep the current display order.
 */
export function computeProviderSave(rows: ProviderGridRow[]): ProviderSaveResult {
  const sorted = [...rows].sort((a, b) => a.position - b.position);
  const priority = sorted.map((r) => r.id);
  const disabledIds = sorted.filter((r) => !r.enabled).map((r) => r.id);
  if (disabledIds.length === priority.length) {
    return { ok: false, error: 'all_disabled' };
  }
  return {
    ok: true,
    priority,
    disabledIds,
    rows: sorted.map((r, i) => ({ ...r, position: i + 1 })),
  };
}
