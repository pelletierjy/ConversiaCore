import { describe, expect, it } from 'vitest';
import { setLocale } from '../../src/i18n/locale';
import { welcomeMessageFor } from '../../src/ui/chat/welcome-message';

// Pinned to English so assertions on wording are deterministic regardless of
// the jsdom navigator language.
setLocale('en');

describe('welcomeMessageFor', () => {
  it('greets with the host app name for the no-KB subject', () => {
    expect(welcomeMessageFor({ subject: 'Others', contextKey: 'GlobalVstHost' })).toBe(
      "Hi! I'm here to help. Ask me your questions if you need help with using the GlobalVstHost!",
    );
  });

  it('keeps the subject-tutor greeting for real subjects', () => {
    expect(welcomeMessageFor({ subject: 'Mathematics', contextKey: 'HomeworkTutora' })).toContain(
      'Mathematics tutor',
    );
  });

  it('falls back to the subject greeting when no host context key is present', () => {
    expect(welcomeMessageFor({ subject: 'Others' })).toContain('Others tutor');
  });
});