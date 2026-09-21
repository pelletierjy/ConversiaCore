import { renderGradeSubjectSelector } from './shared/grade-subject-selector';
import { renderChatView } from '../ui/chat/chat-view';
import { renderAdminView } from './admin/admin-view';
import { createSession } from '../db/chat';
import { getAppStateValue, setAppStateValue } from '../db/local';
import type { StudentSession } from '../models/types';

export async function renderApp(root: HTMLElement): Promise<void> {
  const path = window.location.pathname.replace(/\/$/, '');
  if (path.endsWith('/admin')) {
    await renderAdminView(root);
    return;
  }
  await renderStudentFlow(root);
}

async function renderStudentFlow(root: HTMLElement): Promise<void> {
  const lastSubject = await getAppStateValue<string>('lastSubject');
  const lastGradeLevel = await getAppStateValue<number>('lastGradeLevel');

  renderGradeSubjectSelector(
    root,
    async ({ gradeLevel, subject }) => {
      await setAppStateValue('lastSubject', subject);
      await setAppStateValue('lastGradeLevel', gradeLevel);

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
      await renderChatView(root, session);
    },
    { lastSubject, lastGradeLevel },
  );
}
