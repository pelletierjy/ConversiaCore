import { deleteKnowledgeEntry, listKnowledgeEntries } from '../../db/knowledge';
import { deleteEmbeddingVector } from '../../db/vectors';
import { showToast } from '../shared/toast';
import type { KnowledgeEntry } from '../../models/types';

export interface EntryListOptions {
  onEdit: (entry: KnowledgeEntry) => void;
  onDeleted: () => void;
}

export async function renderEntryList(container: HTMLElement, options: EntryListOptions): Promise<void> {
  container.innerHTML = '<p>Loading knowledge entries...</p>';

  let entries: KnowledgeEntry[];
  try {
    entries = await listKnowledgeEntries();
  } catch {
    container.innerHTML = '<p class="admin-error">Unable to load knowledge entries.</p>';
    return;
  }

  if (entries.length === 0) {
    container.innerHTML = '<p>No knowledge entries yet.</p>';
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
            <span>${escapeHtml(e.subject)} · Grade ${e.gradeLevel}</span>
          </div>
          <div class="entry-list-actions">
            <button type="button" data-action="edit">Edit</button>
            <button type="button" data-action="delete">Delete</button>
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
      if (!confirm(`Delete "${entry.title}"?`)) return;
      try {
        await deleteKnowledgeEntry(entry.id);
        await deleteEmbeddingVector(entry.id).catch(() => undefined);
        showToast('Entry deleted.', 'success');
        options.onDeleted();
      } catch {
        showToast('Failed to delete entry.', 'error');
      }
    });
  });
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
