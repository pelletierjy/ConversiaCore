import { PREDEFINED_SUBJECTS } from '../../src/models/constants';

export interface KnowledgeContentProblem {
  path: string;
  message: string;
}

export interface ContentExampleProblem {
  problem: string;
  solution: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ContentEntry {
  gradeLevel: number;
  title: string;
  contentBody: string;
  pedagogicalNotes: string;
  exampleProblems: ContentExampleProblem[];
}

export interface KnowledgeFile {
  subject: string;
  entries: ContentEntry[];
}

export const MIN_CONTENT_CHARS = 400;
export const MIN_NOTES_CHARS = 100;
export const MAX_TITLE_CHARS = 120;
export const MIN_GRADE = 1;
export const MAX_GRADE = 20;

export function validateKnowledgeFile(data: KnowledgeFile): KnowledgeContentProblem[] {
  const problems: KnowledgeContentProblem[] = [];
  const p = (path: string, message: string) => problems.push({ path, message });

  if (!PREDEFINED_SUBJECTS.includes(data.subject)) {
    p('subject', `Unknown subject "${data.subject}" — must be one of: ${PREDEFINED_SUBJECTS.join(', ')}`);
  }
  if (!Array.isArray(data.entries)) {
    p('entries', 'entries must be an array');
    return problems;
  }

  const seen = new Set<number>();
  data.entries.forEach((e, i) => {
    const at = `entries[${i}]`;
    if (!Number.isInteger(e.gradeLevel) || e.gradeLevel < MIN_GRADE || e.gradeLevel > MAX_GRADE) {
      p(`${at}.gradeLevel`, `gradeLevel must be an integer ${MIN_GRADE}–${MAX_GRADE}, got ${e.gradeLevel}`);
    } else if (seen.has(e.gradeLevel)) {
      p(`${at}.gradeLevel`, `duplicate gradeLevel ${e.gradeLevel}`);
    } else {
      seen.add(e.gradeLevel);
    }

    if (typeof e.title !== 'string' || e.title.trim().length === 0) {
      p(`${at}.title`, 'title is required');
    } else if (e.title.length > MAX_TITLE_CHARS) {
      p(`${at}.title`, `title must be <= ${MAX_TITLE_CHARS} chars`);
    }

    if (typeof e.contentBody !== 'string' || e.contentBody.trim().length < MIN_CONTENT_CHARS) {
      p(`${at}.contentBody`, `contentBody must be >= ${MIN_CONTENT_CHARS} chars`);
    }

    if (typeof e.pedagogicalNotes !== 'string' || e.pedagogicalNotes.trim().length < MIN_NOTES_CHARS) {
      p(`${at}.pedagogicalNotes`, `pedagogicalNotes must be >= ${MIN_NOTES_CHARS} chars`);
    }

    if (!Array.isArray(e.exampleProblems) || e.exampleProblems.length < 1 || e.exampleProblems.length > 3) {
      p(`${at}.exampleProblems`, 'exampleProblems must contain 1–3 items');
    } else {
      e.exampleProblems.forEach((ex, j) => {
        const atEx = `${at}.exampleProblems[${j}]`;
        for (const field of ['problem', 'solution', 'explanation'] as const) {
          if (typeof ex[field] !== 'string' || ex[field].trim().length === 0) {
            p(`${atEx}.${field}`, `${field} is required`);
          }
        }
        if (!['easy', 'medium', 'hard'].includes(ex.difficulty)) {
          p(`${atEx}.difficulty`, `difficulty must be easy|medium|hard, got ${ex.difficulty}`);
        }
      });
    }
  });

  for (let g = MIN_GRADE; g <= MAX_GRADE; g++) {
    if (!seen.has(g)) p('entries', `missing gradeLevel ${g}`);
  }
  return problems;
}
