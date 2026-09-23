import { deleteKnowledgeEntry, listKnowledgeEntries } from '../../db/knowledge';
import { deleteEmbeddingVector } from '../../db/vectors';
import { showToast } from '../shared/toast';
import { t } from '../../i18n/translations';
import type { KnowledgeEntry } from '../../models/types';

export interface EntryListOptions {
  onEdit: (entry: KnowledgeEntry) => void;
  onDeleted: () => void;
}

export async function renderEntryList(container: HTMLElement, options: EntryListOptions): Promise<void> {
  container.innerHTML = `<p>${t('entryList.loading')}</p>`;

  let entries: KnowledgeEntry[];
  try {
    entries = await listKnowledgeEntries();
  } catch {
    container.innerHTML = `<p class="admin-error">${t('entryList.loadError')}</p>`;
    return;
  }

  if (entries.length === 0) {
    container.innerHTML = `<p>${t('entryList.empty')}</p>`;
    return;
  }

  container.innerHTML = `
    <ul class="entry-list">
      ${entries
        .map(
          (e) => `
        <li class="entry-list-item" data-id="${e.id}">
          <div>
            <strong>${escapeHtml(e.title)}</strong>
            <span>${
              e.entryType === 'context'
                ? `${t('entryList.contextBadge', { key: escapeHtml(e.contextKey ?? '') })} · ${e.isMainArticle ? t('entryList.mainArticleBadge') : t('entryList.subArticleBadge')}`
                : `${escapeHtml(e.subject ?? '')} · ${e.gradeLevel == null ? t('entryList.allGradesBadge') : `${t('common.grade')} ${e.gradeLevel}`}`
            }</span>
          </div>
          <div class="entry-list-actions">
            <button type="button" data-action="edit">${t('entryList.editButton')}</button>
            <button type="button" data-action="delete">${t('entryList.deleteButton')}</button>
          </div>
        </li>`,
        )
        .join('')}
    </ul>
  `;

  container.querySelectorAll('.entry-list-item').forEach((item) => {
    const id = (item as HTMLElement).dataset.id as string;
    const entry = entries.find((e) => e.id === id) as KnowledgeEntry;

    item.querySelector('[data-action="edit"]')?.addEventListener('click', () => options.onEdit(entry));
    item.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      if (!confirm(t('entryList.deleteConfirm', { title: entry.title }))) return;
      try {
        await deleteKnowledgeEntry(entry.id);
        await deleteEmbeddingVector(entry.id).catch(() => undefined);
        showToast(t('entryList.deletedToast'), 'success');
        options.onDeleted();
      } catch {
        showToast(t('entryList.deleteFailedToast'), 'error');
      }
    });
  });
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
