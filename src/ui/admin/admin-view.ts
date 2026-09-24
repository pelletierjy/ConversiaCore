import { getDoc, setDoc } from 'firebase/firestore';
import { appConfigDoc } from '../../db/firebase';
import { isFirebaseConfigured } from '../../config';
import { PREDEFINED_SUBJECTS } from '../../models/constants';
import { renderLoginForm } from './login-form';
import { renderEntryList } from './entry-list';
import { renderEntryEditor } from './entry-editor';
import { renderAiProvidersPanel } from './ai-providers-panel';
import { t } from '../../i18n/translations';
import type { AppConfig } from '../../models/types';

export async function renderAdminView(root: HTMLElement): Promise<void> {
  if (!isFirebaseConfigured()) {
    root.innerHTML = `
      <div class="admin-error">
        <h2>${t('admin.firebaseNotConfiguredTitle')}</h2>
        <p>${t('admin.firebaseNotConfiguredDescription')}</p>
        <ol>
          <li>${t('admin.firebaseStep1')}</li>
          <li>${t('admin.firebaseStep2')}</li>
          <li>${t('admin.firebaseStep3')}</li>
          <li>${t('admin.firebaseStep4')}</li>
        </ol>
      </div>
    `;
    return;
  }

  root.innerHTML = '<div class="admin-shell"></div>';
  const shell = root.querySelector('.admin-shell') as HTMLElement;

  let config: AppConfig;
  try {
    const snap = await getDoc(appConfigDoc());
    config = snap.exists()
      ? (snap.data() as AppConfig)
      : { adminPinHash: null, customSubjects: [], predefinedSubjects: PREDEFINED_SUBJECTS };
  } catch (err) {
    console.error('Firestore read error:', err);
    shell.innerHTML = `
      <div class="admin-error">
        <strong>${t('admin.dbErrorTitle')}</strong><br/>
        ${t('admin.dbErrorDescription')}
      </div>
    `;
    return;
  }

  if (!config.adminPinHash) {
    renderLoginForm(shell, {
      mode: 'setup',
      onSetup: async (pinHash) => {
        await setDoc(appConfigDoc(), { ...config, adminPinHash: pinHash }, { merge: true });
        await renderAdminHome(shell, config);
      },
    });
    return;
  }

  renderLoginForm(shell, {
    mode: 'login',
    storedPinHash: config.adminPinHash,
    onLogin: () => renderAdminHome(shell, config),
  });
}

type AdminTab = 'knowledge' | 'settings';

async function renderAdminHome(container: HTMLElement, config: AppConfig): Promise<void> {
  container.innerHTML = `
    <div class="admin-home">
      <nav class="admin-nav">
        <button type="button" class="admin-nav-btn" data-tab="knowledge">${t('admin.knowledgeBaseNavLabel')}</button>
        <button type="button" class="admin-nav-btn" data-tab="settings">${t('admin.settingsNavLabel')}</button>
      </nav>
      <div class="admin-page-container"></div>
    </div>
  `;

  const pageContainer = container.querySelector('.admin-page-container') as HTMLElement;
  const navButtons = Array.from(container.querySelectorAll<HTMLButtonElement>('.admin-nav-btn'));

  function setActiveTab(tab: AdminTab): void {
    navButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === tab));
    if (tab === 'knowledge') renderKnowledgeBasePage(pageContainer, config);
    else renderSettingsPage(pageContainer, config);
  }

  navButtons.forEach((btn) =>
    btn.addEventListener('click', () => setActiveTab(btn.dataset.tab as AdminTab)),
  );

  setActiveTab('knowledge');
}

function renderKnowledgeBasePage(container: HTMLElement, config: AppConfig): void {
  const subjects = [...new Set([...config.predefinedSubjects, ...config.customSubjects])];

  container.innerHTML = `
    <div class="admin-page">
      <header class="admin-header">
        <h2>${t('admin.knowledgeBaseTitle')}</h2>
        <button type="button" class="add-entry-btn">${t('admin.addEntryButton')}</button>
      </header>
      <div class="entry-editor-container"></div>
      <div class="entry-list-container"></div>
    </div>
  `;

  const listContainer = container.querySelector('.entry-list-container') as HTMLElement;
  const editorContainer = container.querySelector('.entry-editor-container') as HTMLElement;
  const addBtn = container.querySelector('.add-entry-btn') as HTMLButtonElement;

  const refreshList = () =>
    renderEntryList(listContainer, {
      onEdit: (entry) => renderEntryEditor(editorContainer, { entry, onSaved: refreshList, subjects }),
      onDeleted: refreshList,
    });

  addBtn.addEventListener('click', () => {
    renderEntryEditor(editorContainer, { onSaved: refreshList, subjects });
  });

  void refreshList();
}

function renderSettingsPage(container: HTMLElement, config: AppConfig): void {
  container.innerHTML = `
    <div class="admin-page">
      <header class="admin-header">
        <h2>${t('admin.settingsTitle')}</h2>
      </header>
      <div class="ai-providers-container"></div>
    </div>
  `;

  const aiProvidersContainer = container.querySelector('.ai-providers-container') as HTMLElement;
  renderAiProvidersPanel(aiProvidersContainer, config);
}
