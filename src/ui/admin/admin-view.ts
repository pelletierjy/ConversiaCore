import { getDoc, setDoc } from 'firebase/firestore';
import { appConfigDoc } from '../../db/firebase';
import { isFirebaseConfigured } from '../../config';
import { PREDEFINED_SUBJECTS } from '../../models/constants';
import { renderLoginForm } from './login-form';
import { renderEntryList } from './entry-list';
import { renderEntryEditor } from './entry-editor';
import type { AppConfig } from '../../models/types';

export async function renderAdminView(root: HTMLElement): Promise<void> {
  if (!isFirebaseConfigured()) {
    root.innerHTML = `
      <div class="admin-error">
        <h2>Firebase is not configured</h2>
        <p>The shared knowledge base requires a Firebase project.</p>
        <ol>
          <li>Create a project at <a href="https://console.firebase.google.com" target="_blank">Firebase Console</a></li>
          <li>Enable Cloud Firestore (Native mode)</li>
          <li>Copy your web app config into <code>.env</code> (see the placeholder variables)</li>
          <li>Restart the dev server (<code>npm run dev</code>)</li>
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
        <strong>Unable to reach the shared database.</strong><br/>
        Check your connection, Firestore security rules, and browser console for details.
      </div>
    `;
    return;
  }

  if (!config.adminPinHash) {
    renderLoginForm(shell, {
      mode: 'setup',
      onSetup: async (pinHash) => {
        await setDoc(appConfigDoc(), { ...config, adminPinHash: pinHash }, { merge: true });
        await renderAdminHome(shell);
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

async function renderAdminHome(container: HTMLElement, config: AppConfig): Promise<void> {
  const subjects = [...new Set([...config.predefinedSubjects, ...config.customSubjects])];

  container.innerHTML = `
    <div class="admin-home">
      <header class="admin-header">
        <h2>Knowledge Base</h2>
        <button type="button" class="add-entry-btn">Add Entry</button>
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

  await refreshList();
}
