import { GRADE_LEVELS } from '../../models/constants';
import { t } from '../../i18n/translations';

export interface GradeSubjectSelection {
  gradeLevel: number;
  subject: string;
}

export interface GradeSubjectDefaults {
  lastSubject?: string;
  lastGradeLevel?: number;
  subjects?: string[];
  forcedSubject?: string;
}

export function renderGradeSubjectSelector(
  container: HTMLElement,
  onSubmit: (selection: GradeSubjectSelection) => void,
  defaults: GradeSubjectDefaults = {},
): void {
  const subjects = defaults.subjects ?? [];
  const isCustomDefault = Boolean(defaults.lastSubject) && !subjects.includes(defaults.lastSubject!);
  const forcedSubject = defaults.forcedSubject;

  const subjectHtml = forcedSubject
    ? `<input type="hidden" name="subject" value="${forcedSubject}" />
       <div class="selector-forced-subject"><strong>${t('selector.subjectForcedLabel')}</strong> ${forcedSubject}</div>`
    : `<label>${t('selector.subjectLabel')}
         <select name="subject">
           ${subjects.map(
             (s) => `<option value="${s}" ${s === defaults.lastSubject ? 'selected' : ''}>${s}</option>`,
           ).join('')}
           <option value="__custom__" ${isCustomDefault ? 'selected' : ''}>${t('selector.subjectOtherOption')}</option>
         </select>
       </label>
       <input
         type="text"
         name="customSubject"
         placeholder="${t('selector.subjectPlaceholder')}"
         value="${isCustomDefault ? defaults.lastSubject : ''}"
         style="display:${isCustomDefault ? 'block' : 'none'}"
       />`;

  container.innerHTML = `
    <form class="selector-form">
      <h1>${t('selector.title')}</h1>
      <p>${t('selector.subtitle')}</p>
      <label>${t('selector.gradeLevelLabel')}
        <select name="gradeLevel">
          ${GRADE_LEVELS.map(
            (g) => `<option value="${g}" ${g === defaults.lastGradeLevel ? 'selected' : ''}>${g}</option>`,
          ).join('')}
        </select>
      </label>
      ${subjectHtml}
      <button type="submit">${t('selector.startButton')}</button>
    </form>
  `;

  const form = container.querySelector('form') as HTMLFormElement;

  if (!forcedSubject) {
    const subjectSelect = form.querySelector('select[name="subject"]') as HTMLSelectElement;
    const customInput = form.querySelector('input[name="customSubject"]') as HTMLInputElement;

    subjectSelect.addEventListener('change', () => {
      customInput.style.display = subjectSelect.value === '__custom__' ? 'block' : 'none';
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const gradeLevel = Number((form.querySelector('select[name="gradeLevel"]') as HTMLSelectElement).value);
    const subject = forcedSubject
      ? forcedSubject
      : (form.querySelector('select[name="subject"]') as HTMLSelectElement).value === '__custom__'
        ? (form.querySelector('input[name="customSubject"]') as HTMLInputElement).value.trim()
        : (form.querySelector('select[name="subject"]') as HTMLSelectElement).value;
    if (!subject) return;
    onSubmit({ gradeLevel, subject });
  });
}
