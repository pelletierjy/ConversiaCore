import { createKnowledgeEntry, updateKnowledgeEntry } from '../../db/knowledge';
import { saveEmbeddingVector } from '../../db/vectors';
import { embedText } from '../../services/gemini';
import { GEMINI_EMBEDDING_MODEL } from '../../config';
import { showToast } from '../shared/toast';
import { t } from '../../i18n/translations';
import type { Attachment, KnowledgeEntry } from '../../models/types';

const MAX_ATTACHMENT_BYTES = 1_000_000;

export interface EntryEditorOptions {
  entry?: KnowledgeEntry;
  onSaved: () => void;
  subjects?: string[];
}

export function renderEntryEditor(container: HTMLElement, options: EntryEditorOptions): void {
  const entry = options.entry;
  const subjects = options.subjects ?? [];

  container.innerHTML = `
    <form class="entry-editor">
      <h3>${entry ? t('entryEditor.editTitle') : t('entryEditor.addTitle')}</h3>
      <label>${t('entryEditor.subjectLabel')}
        <input list="subject-options" name="subject" value="${entry?.subject ?? ''}" required />
        <datalist id="subject-options">
          ${subjects.map((s) => `<option value="${s}"></option>`).join('')}
        </datalist>
      </label>
      <label>${t('entryEditor.gradeLevelLabel')}
        <input type="number" name="gradeLevel" min="1" max="20" value="${entry?.gradeLevel ?? ''}" required />
      </label>
      <label>${t('entryEditor.titleLabel')}
        <input type="text" name="title" value="${entry?.title ?? ''}" required />
      </label>
      <label>${t('entryEditor.contentLabel')}
        <textarea name="contentBody" rows="6" required>${entry?.contentBody ?? ''}</textarea>
      </label>
      <label>${t('entryEditor.pedagogicalNotesLabel')}
        <textarea name="pedagogicalNotes" rows="3">${entry?.pedagogicalNotes ?? ''}</textarea>
      </label>
      <label>${t('entryEditor.attachmentLabel')}
        <input type="file" name="attachment" accept="image/*" />
      </label>
      <div class="entry-editor-actions">
        <button type="submit">${t('entryEditor.saveButton')}</button>
        ${entry ? `<button type="button" data-action="cancel">${t('entryEditor.cancelButton')}</button>` : ''}
      </div>
      <p class="entry-editor-status" role="status"></p>
    </form>
  `;

  const form = container.querySelector('form') as HTMLFormElement;
  const statusEl = form.querySelector('.entry-editor-status') as HTMLElement;
  const cancelBtn = form.querySelector('[data-action="cancel"]') as HTMLButtonElement | null;

  cancelBtn?.addEventListener('click', () => {
    container.innerHTML = '';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const subject = String(formData.get('subject') ?? '').trim();
    const gradeLevel = Number(formData.get('gradeLevel'));
    const title = String(formData.get('title') ?? '').trim();
    const contentBody = String(formData.get('contentBody') ?? '').trim();
    const pedagogicalNotes = String(formData.get('pedagogicalNotes') ?? '').trim();
    const file = formData.get('attachment') as File | null;

    if (contentBody.length < 10) {
      statusEl.textContent = t('entryEditor.contentTooShortError');
      return;
    }

    statusEl.textContent = t('entryEditor.savingStatus');

    try {
      const attachments: Attachment[] = entry?.attachments ?? [];
      if (file && file.size > 0) {
        if (file.size > MAX_ATTACHMENT_BYTES) {
          statusEl.textContent = t('entryEditor.imageTooLargeError');
          return;
        }
        attachments.push({ id: crypto.randomUUID(), mimeType: file.type, dataUrl: await fileToDataUrl(file) });
      }

      const payload = {
        subject,
        gradeLevel,
        title,
        contentBody,
        pedagogicalNotes,
        attachments,
        exampleProblems: entry?.exampleProblems ?? [],
      };

      const id = entry ? entry.id : await createKnowledgeEntry(payload);
      if (entry) {
        await updateKnowledgeEntry(entry.id, payload);
      }

      try {
        const vector = await embedText(`${title}\n${contentBody}`, 'document');
        await saveEmbeddingVector(id, GEMINI_EMBEDDING_MODEL, vector);
      } catch (embedError) {
        console.warn('Embedding generation failed; entry saved without vector.', embedError);
      }

      statusEl.textContent = '';
      showToast(t('entryEditor.entrySavedToast'), 'success');
      options.onSaved();
      if (!entry) form.reset();
    } catch (error) {
      console.error(error);
      statusEl.textContent = t('entryEditor.saveFailedError');
      showToast(t('entryEditor.saveFailedToast'), 'error');
    }
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
