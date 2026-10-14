import { t } from '../../i18n/translations';
import { NO_KB_SUBJECT } from '../../models/constants';
import type { StudentSession } from '../../models/types';

/** Picks the opening line for a fresh chat.
 *
 * Sessions on the no-KB subject (an embedded app assistant with no curriculum behind it, e.g.
 * GlobalVstHost) get a host-app greeting instead of the subject-tutor one — "I'm your Others
 * tutor" reads as nonsense when the thing being helped with is the host app itself. Falls back
 * to the subject greeting when no host context key is present (standalone demos name no app). */
export function welcomeMessageFor(session: Pick<StudentSession, 'subject' | 'contextKey'>): string {
  if (session.subject === NO_KB_SUBJECT && session.contextKey) {
    return t('chat.welcomeMessageGeneral', { appName: session.contextKey });
  }
  return t('chat.welcomeMessage', { subject: session.subject });
}