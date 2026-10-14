import { setDoc } from 'firebase/firestore';
import { appConfigDoc } from '../../db/firebase';
import { AI_PROVIDERS } from '../../services/ai-provider-registry';
import { invalidateProviderPriorityCache } from '../../services/ai-provider-config';
import { showToast } from '../shared/toast';
import { t } from '../../i18n/translations';
import type { AppConfig } from '../../models/types';

export function renderAiProvidersPanel(container: HTMLElement, config: AppConfig): void {
  const order = config.aiProviderPriority?.length
    ? [...config.aiProviderPriority].filter((id) => AI_PROVIDERS.some((p) => p.id === id))
    : AI_PROVIDERS.map((p) => p.id);
  for (const p of AI_PROVIDERS) if (!order.includes(p.id)) order.push(p.id); // newly-added providers appear at the end
  const disabled = new Set(config.aiDisabledProviders ?? []);

  function render(): void {
    container.innerHTML = `
      <div class="ai-providers-panel">
        <h3>${t('admin.aiProvidersTitle')}</h3>
        <p>${t('admin.aiProvidersDescription')}</p>
        <ol class="ai-providers-list">
          ${order
            .map(
              (id, i) => `
            <li data-id="${id}">
              <span>${id}</span>
              <label class="ai-providers-enabled">
                <input type="checkbox" data-action="toggle" ${disabled.has(id) ? '' : 'checked'} />
                ${t('admin.providerEnabledLabel')}
              </label>
              <div class="ai-providers-actions">
                <button type="button" data-action="up" data-index="${i}" ${i === 0 ? 'disabled' : ''}>${t('admin.moveUpButton')}</button>
                <button type="button" data-action="down" data-index="${i}" ${i === order.length - 1 ? 'disabled' : ''}>${t('admin.moveDownButton')}</button>
              </div>
            </li>`,
            )
            .join('')}
        </ol>
        <button type="button" class="ai-providers-save">${t('admin.saveOrderButton')}</button>
        <p class="ai-providers-status" role="status"></p>
      </div>
    `;

    container.querySelectorAll('[data-action="up"]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const i = Number((btn as HTMLElement).dataset.index);
        [order[i - 1], order[i]] = [order[i], order[i - 1]];
        render();
      }),
    );
    container.querySelectorAll('[data-action="down"]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const i = Number((btn as HTMLElement).dataset.index);
        [order[i], order[i + 1]] = [order[i + 1], order[i]];
        render();
      }),
    );
    container.querySelectorAll('[data-action="toggle"]').forEach((input) =>
      input.addEventListener('change', () => {
        const checkbox = input as HTMLInputElement;
        const id = checkbox.closest('li')?.getAttribute('data-id');
        if (!id) return;
        if (checkbox.checked) disabled.delete(id);
        else disabled.add(id);
      }),
    );

    const statusEl = container.querySelector('.ai-providers-status') as HTMLElement;
    container.querySelector('.ai-providers-save')?.addEventListener('click', async () => {
      // Persist only ids the registry still knows — self-heals stale entries from
      // retired providers instead of accumulating them forever.
      const disabledIds = order.filter((id) => disabled.has(id));
      if (disabledIds.length === order.length) {
        statusEl.textContent = t('admin.allProvidersDisabledError');
        return;
      }
      try {
        await setDoc(appConfigDoc(), { ...config, aiProviderPriority: order, aiDisabledProviders: disabledIds }, { merge: true });
        config.aiProviderPriority = order;
        config.aiDisabledProviders = disabledIds;
        invalidateProviderPriorityCache();
        showToast(t('admin.orderSavedToast'), 'success');
      } catch (error) {
        console.error(error);
        statusEl.textContent = t('admin.orderSaveFailedError');
      }
    });
  }

  render();
}
