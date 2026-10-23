import { setDoc } from 'firebase/firestore';
import { appConfigDoc } from '../../db/firebase';
import { AI_PROVIDERS, PROVIDER_DISPLAY } from '../../services/ai-provider-registry';
import { invalidateProviderPriorityCache } from '../../services/ai-provider-config';
import { showToast } from '../shared/toast';
import { t } from '../../i18n/translations';
import type { AppConfig } from '../../models/types';

/**
 * Minimal structural types for the `<signal-grid>` web component.
 * The grid is consumed as a custom element (no npm dependency), so arrays and
 * objects are assigned as DOM **properties**, never attributes.
 */
interface SignalGridColumnSchema {
  field: string;
  header?: string;
  type?: string;
  editable?: boolean;
  width?: number;
}

interface SignalGridElement extends HTMLElement {
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

/** The grid's saveChanges payload: rows, or (defensively) a single-element wrapper around them. */
function extractRows(detail: unknown): ProviderGridRow[] | null {
  if (Array.isArray(detail)) {
    // Angular elements may deliver either the payload itself or [payload].
    // The payload is an array of row objects, so disambiguate on element type.
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

/** Column schemas (the grid's Formly-style plain-object config). */
export function providerColumns(): SignalGridColumnSchema[] {
  return [
    { field: 'position', header: '#', type: 'number', editable: true, width: 80 },
    { field: 'provider', header: t('chat.providerLabel'), type: 'string', width: 180 },
    { field: 'model', header: t('chat.modelLabel'), type: 'string', width: 220 },
    { field: 'enabled', header: t('admin.providerEnabledLabel'), type: 'boolean', editable: true, width: 130 },
  ];
}

/** Builds grid rows from the persisted config: array order = current priority. */
export function buildProviderRows(config: Pick<AppConfig, 'aiProviderPriority' | 'aiDisabledProviders'>): ProviderGridRow[] {
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

export function renderAiProvidersPanel(container: HTMLElement, config: AppConfig): void {
  container.innerHTML = `
    <div class="ai-providers-panel">
      <h3>${t('admin.aiProvidersTitle')}</h3>
      <p>${t('admin.aiProvidersDescription')}</p>
      <signal-grid class="ai-providers-grid"></signal-grid>
      <p class="ai-providers-status" role="status"></p>
      <style>
        .ai-providers-grid {
          display: block;
          margin: 1rem 0;
          --signal-grid-viewport-height: 340px;
        }
      </style>
    </div>
  `;

  const grid = container.querySelector('signal-grid') as SignalGridElement;
  grid.columns = providerColumns();
  grid.model = buildProviderRows(config);

  const statusEl = container.querySelector('.ai-providers-status') as HTMLElement;

  grid.addEventListener('saveChanges', async (event) => {
    const rows = extractRows((event as CustomEvent).detail);
    if (!rows) {
      console.error('signal-grid saveChanges: unexpected payload', (event as CustomEvent).detail);
      return;
    }
    const result = computeProviderSave(rows);
    if (!result.ok) {
      // The grid commits before emitting, so a rejected save is rolled back by
      // re-seeding the model from the last persisted config.
      statusEl.textContent = t('admin.allProvidersDisabledError');
      grid.model = buildProviderRows(config);
      return;
    }
    statusEl.textContent = '';
    try {
      // Persist only ids the registry still knows — self-heals stale entries from
      // retired providers instead of accumulating them forever.
      await setDoc(
        appConfigDoc(),
        { ...config, aiProviderPriority: result.priority, aiDisabledProviders: result.disabledIds },
        { merge: true },
      );
      config.aiProviderPriority = result.priority;
      config.aiDisabledProviders = result.disabledIds;
      invalidateProviderPriorityCache();
      grid.model = result.rows ?? [];
      showToast(t('admin.orderSavedToast'), 'success');
    } catch (error) {
      console.error(error);
      statusEl.textContent = t('admin.orderSaveFailedError');
      grid.model = buildProviderRows(config);
    }
  });
}
