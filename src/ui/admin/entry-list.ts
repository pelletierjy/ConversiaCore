import {
  deleteKnowledgeEntry,
  listKnowledgeEntries,
  listKnowledgeEntriesWithFilters,
  type KnowledgeEntryFilters,
} from '../../db/knowledge';
import { deleteEmbeddingVector } from '../../db/vectors';
import { GRADE_LEVELS } from '../../models/constants';
import { showToast } from '../shared/toast';
import { t } from '../../i18n/translations';
import type { KnowledgeEntry } from '../../models/types';

export interface EntryListOptions {
  onEdit: (entry: KnowledgeEntry) => void;
  onDeleted: () => void;
  subjects?: string[];
  contextKeys?: string[];
}

interface FilterState {
  entryType: 'subject' | 'context' | '';
  subject: string;
  gradeLevel: number | null;
  allGrades: boolean;
  contextKey: string;
  isMainArticle: boolean | null;
  searchQuery: string;
}

export async function renderEntryList(
  container: HTMLElement,
  options: EntryListOptions,
): Promise<void> {
  const state: FilterState = {
    entryType: '',
    subject: '',
    gradeLevel: null,
    allGrades: true,
    contextKey: '',
    isMainArticle: null,
    searchQuery: '',
  };

  // Collect available values for filter dropdowns
  let availableSubjects = [...(options.subjects ?? [])];
  let availableContextKeys = [...(options.contextKeys ?? [])];

  async function loadEntries(): Promise<KnowledgeEntry[]> {
    const filters: KnowledgeEntryFilters = {};

    if (state.entryType) {
      filters.entryType = state.entryType;
    }
    if (state.entryType === 'subject' && state.subject && !state.allGrades) {
      filters.subject = state.subject;
    }
    if (state.entryType === 'subject' && !state.allGrades && state.gradeLevel !== null) {
      filters.gradeLevel = state.gradeLevel;
    }
    if (state.entryType === 'subject' && state.allGrades) {
      filters.gradeLevel = null;
    }
    if (state.entryType === 'context' && state.contextKey) {
      filters.contextKey = state.contextKey;
    }
    if (state.entryType === 'context' && state.isMainArticle !== null) {
      filters.isMainArticle = state.isMainArticle;
    }
    if (state.searchQuery) {
      filters.searchQuery = state.searchQuery;
    }

    try {
      if (Object.keys(filters).length > 0) {
        return await listKnowledgeEntriesWithFilters(filters);
      }
      return await listKnowledgeEntries();
    } catch {
      throw new Error(t('entryList.loadError'));
    }
  }

  async function refresh(): Promise<void> {
    const entries = await loadEntries();

    // Collect unique subjects and contextKeys from all entries for filter dropdowns
    const subjects = new Set<string>(availableSubjects);
    const contextKeys = new Set<string>(availableContextKeys);
    for (const e of entries) {
      if (e.entryType === 'subject' && e.subject) subjects.add(e.subject);
      if (e.entryType === 'context' && e.contextKey) contextKeys.add(e.contextKey);
    }
    availableSubjects = Array.from(subjects).sort();
    availableContextKeys = Array.from(contextKeys).sort();

    try {
      const allEntries = await listKnowledgeEntries();
      for (const e of allEntries) {
        if (e.entryType === 'subject' && e.subject) subjects.add(e.subject);
        if (e.entryType === 'context' && e.contextKey) contextKeys.add(e.contextKey);
      }
      availableSubjects = Array.from(subjects).sort();
      availableContextKeys = Array.from(contextKeys).sort();
    } catch {
      // Ignore, use what we have
    }

    renderList(container, entries, state, {
      availableSubjects,
      availableContextKeys,
      onFilterChange: async (newFilters: Partial<FilterState>) => {
        Object.assign(state, newFilters);
        await refresh();
      },
      onEdit: options.onEdit,
      onDeleted: options.onDeleted,
    });
  }

  // Initial load
  container.innerHTML = '<p>' + t('entryList.loading') + '</p>';
  try {
    await refresh();
  } catch {
    container.innerHTML = '<p class="admin-error">' + t('entryList.loadError') + '</p>';
    return;
  }
}

interface RenderListOptions {
  availableSubjects: string[];
  availableContextKeys: string[];
  onFilterChange: (filters: Partial<FilterState>) => Promise<void>;
  onEdit: (entry: KnowledgeEntry) => void;
  onDeleted: () => void;
}

function formatEntryMeta(e: KnowledgeEntry): string {
  if (e.entryType === 'context') {
    const badges = [t('entryList.contextBadge', { key: escapeHtml(e.contextKey ?? '') })];
    if (e.isMainArticle) badges.push(t('entryList.mainArticleBadge'));
    else badges.push(t('entryList.subArticleBadge'));
    return badges.join(' · ');
  }
  const gradeText = e.gradeLevel == null ? t('entryList.allGradesBadge') : `${t('common.grade')} ${e.gradeLevel}`;
  return `${escapeHtml(e.subject ?? '')} · ${gradeText}`;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderList(
  container: HTMLElement,
  entries: KnowledgeEntry[],
  state: FilterState,
  opts: RenderListOptions,
): void {
  const html = `
    <div class="entry-list-page">
      <!-- Filters -->
      <div class="entry-filters">
        <div class="entry-filter-row">
          <div class="filter-group">
            <label for="filter-search">${t('entryList.searchLabel')}</label>
            <input
              type="search"
              id="filter-search"
              class="filter-search-input"
              placeholder="${t('entryList.searchPlaceholder')}"
              value="${escapeHtml(state.searchQuery)}"
            />
          </div>

          <div class="filter-group">
            <label for="filter-entry-type">${t('entryList.entryTypeFilterLabel')}</label>
            <select id="filter-entry-type" class="filter-entry-type">
              <option value="">${t('entryList.allEntryTypesOption')}</option>
              <option value="subject" ${state.entryType === 'subject' ? 'selected' : ''}>${t('entryList.subjectOption')}</option>
              <option value="context" ${state.entryType === 'context' ? 'selected' : ''}>${t('entryList.contextOption')}</option>
            </select>
          </div>

          <div class="filter-group subject-filter" style="${state.entryType === 'subject' ? '' : 'display:none'}">
            <label for="filter-subject">${t('entryList.subjectFilterLabel')}</label>
            <select id="filter-subject" class="filter-subject-select">
              <option value="">${t('entryList.allSubjectsOption')}</option>
              ${opts.availableSubjects.map((s) => `<option value="${escapeHtml(s)}" ${state.subject === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
            </select>
          </div>

          <div class="filter-group grade-filter" style="${state.entryType === 'subject' ? '' : 'display:none'}">
            <label for="filter-all-grades">${t('entryList.gradeFilterLabel')}</label>
            <div class="grade-filter-options">
              <label class="checkbox-label">
                <input type="checkbox" id="filter-all-grades" ${state.allGrades ? 'checked' : ''} />
                ${t('entryList.allGradesOption')}
              </label>
              <select id="filter-grade-level" ${state.allGrades ? 'disabled' : ''}>
                ${GRADE_LEVELS.map((g) => `<option value="${g}" ${state.gradeLevel === g ? 'selected' : ''}>${t('common.grade')} ${g}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="filter-group context-filter" style="${state.entryType === 'context' ? '' : 'display:none'}">
            <label for="filter-context-key">${t('entryList.contextKeyFilterLabel')}</label>
            <select id="filter-context-key" class="filter-context-key-select">
              <option value="">${t('entryList.allContextKeysOption')}</option>
              ${opts.availableContextKeys.map((k) => `<option value="${escapeHtml(k)}" ${state.contextKey === k ? 'selected' : ''}>${escapeHtml(k)}</option>`).join('')}
            </select>
          </div>

          <div class="filter-group main-article-filter" style="${state.entryType === 'context' ? '' : 'display:none'}">
            <label for="filter-main-article">${t('entryList.mainArticleFilterLabel')}</label>
            <select id="filter-main-article" class="filter-main-article-select">
              <option value="">${t('entryList.allArticleTypesOption')}</option>
              <option value="main" ${state.isMainArticle === true ? 'selected' : ''}>${t('entryList.mainArticleOption')}</option>
              <option value="sub" ${state.isMainArticle === false ? 'selected' : ''}>${t('entryList.subArticleOption')}</option>
            </select>
          </div>

          <div class="filter-group reset-filters">
            <label>&nbsp;</label>
            <button type="button" class="reset-filters-btn">${t('entryList.resetFiltersButton')}</button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="entry-table-wrapper">
        <table class="entry-table">
          <thead>
            <tr>
              <th class="entry-col-title">${t('entryList.tableTitleHeader')}</th>
              <th class="entry-col-type">${t('entryList.tableEntryTypeHeader')}</th>
              <th class="entry-col-detail">${t('entryList.tableDetailHeader')}</th>
              <th class="entry-col-meta">${t('entryList.tableMetaHeader')}</th>
              <th class="entry-col-actions">${t('entryList.tableActionsHeader')}</th>
            </tr>
          </thead>
          <tbody>
            ${entries.length === 0
              ? `<tr><td colspan="5" class="entry-table-empty">${t('entryList.empty')}</td></tr>`
              : entries.map((e) => `
                <tr class="entry-table-row" data-id="${e.id}">
                  <td class="entry-col-title"><strong>${escapeHtml(e.title)}</strong></td>
                  <td class="entry-col-type">${e.entryType === 'context' ? escapeHtml(t('entryList.contextOption')) : escapeHtml(t('entryList.subjectOption'))}</td>
                  <td class="entry-col-detail">${formatEntryDetail(e)}</td>
                  <td class="entry-col-meta">${formatEntryMeta(e)}</td>
                  <td class="entry-col-actions">
                    <button type="button" class="entry-card-edit" data-action="edit">${t('entryList.editButton')}</button>
                    <button type="button" class="entry-card-delete" data-action="delete">${t('entryList.deleteButton')}</button>
                  </td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Wire up filter event listeners
  const searchInput = container.querySelector('.filter-search-input') as HTMLInputElement;
  const entryTypeSelect = container.querySelector('.filter-entry-type') as HTMLSelectElement;
  const subjectSelect = container.querySelector('.filter-subject-select') as HTMLSelectElement;
  const allGradesCheckbox = container.querySelector('#filter-all-grades') as HTMLInputElement;
  const gradeLevelSelect = container.querySelector('#filter-grade-level') as HTMLSelectElement;
  const contextKeySelect = container.querySelector('.filter-context-key-select') as HTMLSelectElement;
  const mainArticleSelect = container.querySelector('.filter-main-article-select') as HTMLSelectElement;
  const resetBtn = container.querySelector('.reset-filters-btn') as HTMLButtonElement;
  const subjectFilterEl = container.querySelector('.subject-filter') as HTMLElement;
  const gradeFilterEl = container.querySelector('.grade-filter') as HTMLElement;
  const contextFilterEl = container.querySelector('.context-filter') as HTMLElement;
  const mainArticleFilterEl = container.querySelector('.main-article-filter') as HTMLElement;

  async function applyFilters(): Promise<void> {
    const newEntryType = entryTypeSelect.value as 'subject' | 'context' | '';
    const newSubject = subjectSelect.value;
    const newAllGrades = allGradesCheckbox.checked;
    const newGradeLevel = newAllGrades ? null : Number(gradeLevelSelect.value) || null;
    const newContextKey = contextKeySelect.value;
    const mainArticleVal = mainArticleSelect.value;
    let newIsMainArticle: boolean | null = null;
    if (mainArticleVal === 'main') newIsMainArticle = true;
    else if (mainArticleVal === 'sub') newIsMainArticle = false;

    await opts.onFilterChange({
      entryType: newEntryType,
      subject: newSubject,
      gradeLevel: newGradeLevel,
      allGrades: newAllGrades,
      contextKey: newContextKey,
      isMainArticle: newIsMainArticle,
      searchQuery: searchInput.value,
    });
  }

  // Search with debounce
  let searchDebounce: ReturnType<typeof setTimeout>;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => void applyFilters(), 300);
  });

  entryTypeSelect?.addEventListener('change', () => {
    const type = entryTypeSelect.value;
    subjectFilterEl.style.display = type === 'subject' ? '' : 'none';
    gradeFilterEl.style.display = type === 'subject' ? '' : 'none';
    contextFilterEl.style.display = type === 'context' ? '' : 'none';
    mainArticleFilterEl.style.display = type === 'context' ? '' : 'none';
    void applyFilters();
  });

  subjectSelect?.addEventListener('change', () => void applyFilters());
  allGradesCheckbox?.addEventListener('change', () => {
    gradeLevelSelect.disabled = allGradesCheckbox.checked;
    void applyFilters();
  });
  gradeLevelSelect?.addEventListener('change', () => void applyFilters());
  contextKeySelect?.addEventListener('change', () => void applyFilters());
  mainArticleSelect?.addEventListener('change', () => void applyFilters());

  resetBtn?.addEventListener('click', () => {
    void opts.onFilterChange({
      entryType: '',
      subject: '',
      gradeLevel: null,
      allGrades: true,
      contextKey: '',
      isMainArticle: null,
      searchQuery: '',
    });
  });

  // Wire up row actions
  container.querySelectorAll('.entry-table-row').forEach((rowEl) => {
    const row = rowEl as HTMLElement;
    const id = row.dataset.id as string;
    const entry = entries.find((e) => e.id === id) as KnowledgeEntry;
    if (!entry) return;

    row.querySelector('[data-action="edit"]')?.addEventListener('click', () => opts.onEdit(entry));
    row.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      if (!confirm(t('entryList.deleteConfirm', { title: entry.title }))) return;
      try {
        await deleteKnowledgeEntry(entry.id);
        await deleteEmbeddingVector(entry.id).catch(() => undefined);
        showToast(t('entryList.deletedToast'), 'success');
        opts.onDeleted();
      } catch {
        showToast(t('entryList.deleteFailedToast'), 'error');
      }
    });
  });
}

/** Returns a concise detail string for the table -- subject/grade for subject entries, contextKey for context entries. */
function formatEntryDetail(e: KnowledgeEntry): string {
  if (e.entryType === 'context') {
    return escapeHtml(e.contextKey ?? '');
  }
  const subject = escapeHtml(e.subject ?? '');
  const gradeText = e.gradeLevel == null ? t('entryList.allGradesBadge') : `${t('common.grade')} ${e.gradeLevel}`;
  return `${subject} · ${gradeText}`;
}
