import { createKnowledgeEntry, updateKnowledgeEntry } from '../../db/knowledge';
import { saveEmbeddingVector } from '../../db/vectors';
import { embedText } from '../../services/ai-orchestrator';
import { MIN_GRADE_LEVEL, MAX_GRADE_LEVEL } from '../../models/constants';
import { showToast } from '../shared/toast';
import { t } from '../../i18n/translations';
import type { Attachment, KnowledgeEntry } from '../../models/types';

const MAX_ATTACHMENT_BYTES = 1_000_000;

export interface EntryEditorOptions {
  entry?: KnowledgeEntry;
  onSaved: () => void;
  subjects?: string[];
  contextKeys?: string[];
}

export function renderEntryEditor(container: HTMLElement, options: EntryEditorOptions): void {
  const entry = options.entry;
  const subjects = options.subjects ?? [];
  const contextKeys = options.contextKeys ?? [];

  const isContextEntry = entry?.entryType === 'context';

  container.innerHTML = `
    <form class="entry-editor">
      <h3>${entry ? t('entryEditor.editTitle') : t('entryEditor.addTitle')}</h3>
      <label>${t('entryEditor.entryTypeLabel')}
        <select name="entryType">
          <option value="subject" ${!isContextEntry ? 'selected' : ''}>${t('entryEditor.entryTypeSubjectOption')}</option>
          <option value="context" ${isContextEntry ? 'selected' : ''}>${t('entryEditor.entryTypeContextOption')}</option>
        </select>
      </label>
      <div class="entry-editor-subject-fields" ${isContextEntry ? 'hidden' : ''}>
        <label>${t('entryEditor.subjectLabel')}
          <input list="subject-options" name="subject" value="${entry?.subject ?? ''}" ${isContextEntry ? '' : 'required'} />
          <datalist id="subject-options">
            ${subjects.map((s) => `<option value="${s}"></option>`).join('')}
          </datalist>
        </label>
        <label>${t('entryEditor.allGradesLabel')}
          <input type="checkbox" name="allGrades" ${entry?.gradeLevel == null ? 'checked' : ''} />
        </label>
        <label>${t('entryEditor.gradeLevelLabel')}
          <input type="number" name="gradeLevel" min="${MIN_GRADE_LEVEL}" max="${MAX_GRADE_LEVEL}" value="${entry?.gradeLevel ?? ''}"
            ${entry?.gradeLevel == null ? 'disabled' : ''} />
        </label>
      </div>
      <div class="entry-editor-context-fields" ${isContextEntry ? '' : 'hidden'}>
        <label>${t('entryEditor.contextKeyLabel')}
          <input list="context-key-options" type="text" name="contextKey" value="${entry?.contextKey ?? ''}" ${isContextEntry ? 'required' : ''} />
          <datalist id="context-key-options">
            ${contextKeys.map((k) => `<option value="${k}"></option>`).join('')}
          </datalist>
        </label>
        <label>${t('entryEditor.isMainArticleLabel')}
          <input type="checkbox" name="isMainArticle" ${entry?.isMainArticle ? 'checked' : ''} />
        </label>
      </div>
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
  const entryTypeSelect = form.querySelector('select[name="entryType"]') as HTMLSelectElement;
  const subjectFieldsEl = form.querySelector('.entry-editor-subject-fields') as HTMLElement;
  const contextFieldsEl = form.querySelector('.entry-editor-context-fields') as HTMLElement;
  const subjectInput = form.querySelector('input[name="subject"]') as HTMLInputElement;
  const contextKeyInput = form.querySelector('input[name="contextKey"]') as HTMLInputElement;
  const allGradesCheckbox = form.querySelector('input[name="allGrades"]') as HTMLInputElement;
  const gradeLevelInput = form.querySelector('input[name="gradeLevel"]') as HTMLInputElement;

  cancelBtn?.addEventListener('click', () => {
    container.innerHTML = '';
  });

  function syncGradeLevelRequired(): void {
    gradeLevelInput.required = entryTypeSelect.value === 'subject' && !allGradesCheckbox.checked;
  }

  entryTypeSelect.addEventListener('change', () => {
    const isContext = entryTypeSelect.value === 'context';
    subjectFieldsEl.hidden = isContext;
    contextFieldsEl.hidden = !isContext;
    subjectInput.required = !isContext;
    contextKeyInput.required = isContext;
    syncGradeLevelRequired();
  });

  allGradesCheckbox.addEventListener('change', () => {
    gradeLevelInput.disabled = allGradesCheckbox.checked;
    if (allGradesCheckbox.checked) gradeLevelInput.value = '';
    syncGradeLevelRequired();
  });

  syncGradeLevelRequired();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const entryType = String(formData.get('entryType') ?? 'subject') === 'context' ? 'context' : 'subject';
    const subject = String(formData.get('subject') ?? '').trim();
    const allGrades = formData.get('allGrades') === 'on';
    const gradeLevel = allGrades ? null : Number(formData.get('gradeLevel'));
    const contextKey = String(formData.get('contextKey') ?? '').trim();
    const isMainArticle = formData.get('isMainArticle') === 'on';
    const title = String(formData.get('title') ?? '').trim();
    const contentBody = String(formData.get('contentBody') ?? '').trim();
    const pedagogicalNotes = String(formData.get('pedagogicalNotes') ?? '').trim();
    const file = formData.get('attachment') as File | null;

    if (contentBody.length < 10) {
      statusEl.textContent = t('entryEditor.contentTooShortError');
      return;
    }
    if (entryType === 'context' && !contextKey) {
      statusEl.textContent = t('entryEditor.contextKeyRequiredError');
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
        ...(entryType === 'context'
          ? { entryType: 'context' as const, contextKey, isMainArticle }
          : { entryType: 'subject' as const, subject, gradeLevel }),
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
        const { vector, model } = await embedText(`${title}\n${contentBody}`, 'document');
        await saveEmbeddingVector(id, model, vector);
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
