import { getDoc, getDocs, setDoc } from 'firebase/firestore';
import { appConfigCollection, hostAppConfigDoc } from '../../db/firebase';
import { invalidateHostAppConfigCache } from '../../services/host-config';
import { showToast } from '../shared/toast';
import { t } from '../../i18n/translations';
import type { HostAppConfig } from '../../models/types';

const GLOBAL_DOC_ID = 'global';

export async function renderHostAppsPanel(container: HTMLElement): Promise<void> {
  container.innerHTML = `<p>${t('admin.hostAppsLoadingStatus')}</p>`;

  let contextKeys: string[] = [];
  try {
    const snap = await getDocs(appConfigCollection());
    contextKeys = snap.docs.map((d) => d.id).filter((id) => id !== GLOBAL_DOC_ID).sort();
  } catch (error) {
    console.error(error);
    container.innerHTML = `<p class="host-apps-error">${t('admin.hostAppsLoadFailedError')}</p>`;
    return;
  }

  let selectedContextKey: string | null = contextKeys[0] ?? null;

  function render(): void {
    container.innerHTML = `
      <div class="host-apps-panel">
        <p>${t('admin.hostAppsDescription')}</p>
        <div class="host-apps-layout">
          <div class="host-apps-list">
            <ul>
              ${contextKeys
                .map(
                  (key) => `
                <li>
                  <button type="button" class="host-apps-list-item ${key === selectedContextKey ? 'active' : ''}" data-key="${key}">${key}</button>
                </li>`,
                )
                .join('')}
            </ul>
            <label class="host-apps-new">
              ${t('admin.hostAppsNewContextKeyLabel')}
              <input type="text" class="host-apps-new-input" placeholder="${t('admin.hostAppsNewContextKeyPlaceholder')}" />
              <button type="button" class="host-apps-new-btn">${t('admin.hostAppsNewButton')}</button>
            </label>
          </div>
          <div class="host-apps-editor"></div>
        </div>
      </div>
    `;

    container.querySelectorAll<HTMLButtonElement>('.host-apps-list-item').forEach((btn) =>
      btn.addEventListener('click', () => {
        selectedContextKey = btn.dataset.key ?? null;
        render();
      }),
    );

    const newInput = container.querySelector('.host-apps-new-input') as HTMLInputElement;
    container.querySelector('.host-apps-new-btn')?.addEventListener('click', () => {
      const key = newInput.value.trim();
      if (!key || key === GLOBAL_DOC_ID) return;
      if (!contextKeys.includes(key)) contextKeys = [...contextKeys, key].sort();
      selectedContextKey = key;
      render();
    });

    const editorContainer = container.querySelector('.host-apps-editor') as HTMLElement;
    if (selectedContextKey) {
      void renderEditor(editorContainer, selectedContextKey, () => {
        if (!contextKeys.includes(selectedContextKey!)) contextKeys = [...contextKeys, selectedContextKey!].sort();
        render();
      });
    } else {
      editorContainer.innerHTML = `<p>${t('admin.hostAppsNoSelectionStatus')}</p>`;
    }
  }

  render();
}

async function renderEditor(container: HTMLElement, contextKey: string, onSaved: () => void): Promise<void> {
  container.innerHTML = `<p>${t('admin.hostAppsLoadingStatus')}</p>`;

  let existing: HostAppConfig | null = null;
  try {
    const snap = await getDoc(hostAppConfigDoc(contextKey));
    existing = snap.exists() ? (snap.data() as HostAppConfig) : null;
  } catch (error) {
    console.error(error);
    container.innerHTML = `<p class="host-apps-error">${t('admin.hostAppsLoadFailedError')}</p>`;
    return;
  }

  const keywordsText = existing?.guardrails?.offTopicKeywords?.join('\n') ?? '';

  container.innerHTML = `
    <form class="host-apps-form">
      <h3>${contextKey}</h3>
      <label>${t('admin.hostAppsSystemPromptLabel')}
        <textarea name="systemPrompt" rows="10">${existing?.systemPrompt ?? ''}</textarea>
      </label>
      <label>${t('admin.hostAppsOffTopicKeywordsLabel')}
        <textarea name="offTopicKeywords" rows="6" placeholder="${t('admin.hostAppsOffTopicKeywordsPlaceholder')}">${keywordsText}</textarea>
      </label>
      <label>${t('admin.hostAppsRedirectMessageLabel')}
        <textarea name="redirectMessage" rows="3">${existing?.guardrails?.redirectMessage ?? ''}</textarea>
      </label>
      <div class="host-apps-form-actions">
        <button type="submit">${t('admin.hostAppsSaveButton')}</button>
      </div>
      <p class="host-apps-form-status" role="status"></p>
    </form>
  `;

  const form = container.querySelector('form') as HTMLFormElement;
  const statusEl = form.querySelector('.host-apps-form-status') as HTMLElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const systemPrompt = String(formData.get('systemPrompt') ?? '').trim();
    const redirectMessage = String(formData.get('redirectMessage') ?? '').trim();
    const offTopicKeywords = String(formData.get('offTopicKeywords') ?? '')
      .split('\n')
      .map((k) => k.trim())
      .filter(Boolean);

    const payload: HostAppConfig = {
      ...(systemPrompt ? { systemPrompt } : {}),
      ...(offTopicKeywords.length || redirectMessage ? { guardrails: { offTopicKeywords, redirectMessage } } : {}),
    };

    statusEl.textContent = t('admin.hostAppsSavingStatus');
    try {
      await setDoc(hostAppConfigDoc(contextKey), payload);
      invalidateHostAppConfigCache(contextKey);
      statusEl.textContent = '';
      showToast(t('admin.hostAppsSavedToast'), 'success');
      onSaved();
    } catch (error) {
      console.error(error);
      statusEl.textContent = t('admin.hostAppsSaveFailedError');
      showToast(t('admin.hostAppsSaveFailedToast'), 'error');
    }
  });
}
