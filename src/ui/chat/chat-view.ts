import { renderMessageList } from './message-list';
import { renderInputBar, setInputBarDisabled } from './input-bar';
import { addMessage, getMessagesForSession, updateSession } from '../../db/chat';
import { sendStudentMessage } from '../../services/homework';
import { AiProviderError } from '../../services/ai-provider';
import { t } from '../../i18n/translations';
import type { ChatMessage, StudentSession } from '../../models/types';

export async function renderChatView(container: HTMLElement, session: StudentSession): Promise<void> {
  container.innerHTML = `
    <div class="chat-view">
      <header class="chat-header">${session.subject} · ${t('common.grade')} ${session.gradeLevel}</header>
      <div class="message-list"></div>
      <div class="chat-status" aria-live="polite"></div>
      <div class="input-bar-container"></div>
      <p class="ai-provider-warning">${t('chat.aiProviderWarning')}</p>
    </div>
  `;

  const messageListEl = container.querySelector('.message-list') as HTMLElement;
  const inputBarEl = container.querySelector('.input-bar-container') as HTMLElement;
  const statusEl = container.querySelector('.chat-status') as HTMLElement;

  let messages = await getMessagesForSession(session.id);
  renderMessageList(messageListEl, messages);

  renderInputBar(inputBarEl, async (text) => {
    const studentMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      role: 'student',
      content: text,
      timestamp: Date.now(),
    };
    messages = [...messages, studentMessage];
    renderMessageList(messageListEl, messages);
    await addMessage(studentMessage);

    setInputBarDisabled(inputBarEl, true);
    statusEl.textContent = t('chat.thinking');

    try {
      const history = messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
      const result = await sendStudentMessage({
        subject: session.subject,
        gradeLevel: session.gradeLevel,
        contextKey: session.contextKey,
        performance: session.performance,
        history,
        message: text,
      });

      session.performance = result.performance;
      session.lastActiveAt = Date.now();
      await updateSession(session);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sessionId: session.id,
        role: 'assistant',
        content: result.reply,
        timestamp: Date.now(),
        referencedEntryIds: result.referencedEntryIds.length ? result.referencedEntryIds : undefined,
        metadata: {
          difficulty: session.performance.currentDifficulty,
          isHomeworkRequest: result.isHomeworkRequest,
        },
      };
      messages = [...messages, assistantMessage];
      renderMessageList(messageListEl, messages);
      await addMessage(assistantMessage);
      statusEl.textContent = '';
    } catch (error) {
      statusEl.textContent = describeError(error);
    } finally {
      setInputBarDisabled(inputBarEl, false);
    }
  });
}

function describeError(error: unknown): string {
  if (error instanceof AiProviderError) {
    switch (error.kind) {
      case 'not_configured':
        return t('chat.errorNotConfigured');
      case 'unauthorized':
        return t('chat.errorUnauthorized');
      case 'rate_limited':
        return t('chat.errorRateLimited');
      case 'unavailable':
        return t('chat.errorUnavailable');
      case 'network':
        return t('chat.errorNetwork');
      default:
        return t('chat.errorGeneric');
    }
  }
  return t('chat.errorGeneric');
}
