import { renderGradeSubjectSelector } from './shared/grade-subject-selector';
import { renderChatView } from '../ui/chat/chat-view';
import { renderAdminView } from './admin/admin-view';
import { createSession } from '../db/chat';
import { getAppStateValue, setAppStateValue } from '../db/local';
import { getDoc } from 'firebase/firestore';
import { appConfigDoc } from '../db/firebase';
import { PREDEFINED_SUBJECTS } from '../models/constants';
import type { StudentSession, AppConfig } from '../models/types';

export interface StudentFlowOptions {
  forcedSubject?: string;
  forcedGradeLevel?: number;
  /** Called once a session starts, so a caller (e.g. the web component) can re-render this session later. */
  onSessionStart?: (session: StudentSession) => void;
}

export async function renderApp(root: HTMLElement): Promise<void> {
  const path = window.location.pathname.replace(/\/$/, '');
  if (path.endsWith('/admin')) {
    await renderAdminView(root);
    return;
  }
  const params = new URLSearchParams(window.location.search);
  const forcedSubject = params.get('subject') ?? undefined;
  const forcedGradeLevel = params.has('gradeLevel')
    ? Number(params.get('gradeLevel'))
    : undefined;
  await renderStudentFlow(root, { forcedSubject, forcedGradeLevel });
}

export async function renderStudentFlow(root: HTMLElement, options: StudentFlowOptions = {}): Promise<void> {
  const { onSessionStart } = options;
  const forcedSubject = options.forcedSubject;
  const forcedGradeLevel =
    options.forcedGradeLevel != null && !Number.isNaN(options.forcedGradeLevel)
      ? options.forcedGradeLevel
      : undefined;

  // If both subject and grade are forced, skip the selector entirely.
  if (forcedSubject && forcedGradeLevel != null) {
    await startStudentSession(root, forcedGradeLevel, forcedSubject, onSessionStart);
    return;
  }

  const lastSubject = await getAppStateValue<string>('lastSubject');
  const lastGradeLevel = await getAppStateValue<number>('lastGradeLevel');

  let subjects = PREDEFINED_SUBJECTS;
  try {
    const snap = await getDoc(appConfigDoc());
    if (snap.exists()) {
      const config = snap.data() as AppConfig;
      subjects = [...new Set([...config.predefinedSubjects, ...config.customSubjects])];
    }
  } catch {
    // fallback to hardcoded list if Firestore is unreachable
  }

  renderGradeSubjectSelector(
    root,
    async ({ gradeLevel, subject }) => {
      await setAppStateValue('lastSubject', subject);
      await setAppStateValue('lastGradeLevel', gradeLevel);
      await startStudentSession(root, gradeLevel, subject, onSessionStart);
    },
    { lastSubject, lastGradeLevel, subjects, forcedSubject },
  );
}

async function startStudentSession(
  root: HTMLElement,
  gradeLevel: number,
  subject: string,
  onSessionStart?: (session: StudentSession) => void,
): Promise<void> {
  const session: StudentSession = {
    id: crypto.randomUUID(),
    gradeLevel,
    subject,
    startedAt: Date.now(),
    lastActiveAt: Date.now(),
    performance: {
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      totalQuestions: 0,
      currentDifficulty: 'easy',
    },
  };
  await createSession(session);
  onSessionStart?.(session);
  await renderChatView(root, session);
}
