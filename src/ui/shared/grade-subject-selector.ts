import { GRADE_LEVELS } from '../../models/constants';

export interface GradeSubjectSelection {
  gradeLevel: number;
  subject: string;
}

export interface GradeSubjectDefaults {
  lastSubject?: string;
  lastGradeLevel?: number;
  subjects?: string[];
}

export function renderGradeSubjectSelector(
  container: HTMLElement,
  onSubmit: (selection: GradeSubjectSelection) => void,
  defaults: GradeSubjectDefaults = {},
): void {
  const subjects = defaults.subjects ?? [];
  const isCustomDefault = Boolean(defaults.lastSubject) && !subjects.includes(defaults.lastSubject!);

  container.innerHTML = `
    <form class="selector-form">
      <h1>AI Homework Chatbot</h1>
      <p>Select your grade level and subject to start a homework session.</p>
      <label>Grade Level
        <select name="gradeLevel">
          ${GRADE_LEVELS.map(
            (g) => `<option value="${g}" ${g === defaults.lastGradeLevel ? 'selected' : ''}>${g}</option>`,
          ).join('')}
        </select>
      </label>
      <label>Subject
        <select name="subject">
          ${subjects.map(
            (s) => `<option value="${s}" ${s === defaults.lastSubject ? 'selected' : ''}>${s}</option>`,
          ).join('')}
          <option value="__custom__" ${isCustomDefault ? 'selected' : ''}>Other...</option>
        </select>
      </label>
      <input
        type="text"
        name="customSubject"
        placeholder="Enter subject"
        value="${isCustomDefault ? defaults.lastSubject : ''}"
        style="display:${isCustomDefault ? 'block' : 'none'}"
      />
      <button type="submit">Start Session</button>
    </form>
  `;

  const form = container.querySelector('form') as HTMLFormElement;
  const subjectSelect = form.querySelector('select[name="subject"]') as HTMLSelectElement;
  const customInput = form.querySelector('input[name="customSubject"]') as HTMLInputElement;

  subjectSelect.addEventListener('change', () => {
    customInput.style.display = subjectSelect.value === '__custom__' ? 'block' : 'none';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const gradeLevel = Number((form.querySelector('select[name="gradeLevel"]') as HTMLSelectElement).value);
    const subject = subjectSelect.value === '__custom__' ? customInput.value.trim() : subjectSelect.value;
    if (!subject) return;
    onSubmit({ gradeLevel, subject });
  });
}
