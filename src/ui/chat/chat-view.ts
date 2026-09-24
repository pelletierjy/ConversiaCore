import { renderMessageList } from './message-list';
import { renderInputBar, setInputBarDisabled } from './input-bar';
import { addMessage, getMessagesForSession, updateSession } from '../../db/chat';
import { sendStudentMessage } from '../../services/homework';
import { AiProviderError } from '../../services/ai-provider';
import { PROVIDER_DISPLAY } from '../../services/ai-provider-registry';
import { t } from '../../i18n/translations';
import { HOST_COMMAND_PROTOCOL_VERSION, type HostCommand, type HostCommandEventDetail } from '../../models/host-commands';
import type { ChatMessage, StudentSession } from '../../models/types';

/** Dispatched from inside the widget's shadow tree; `composed: true` lets it cross the
 *  shadow boundary so a listener on the host page (outside `<conversia-app>`) receives it. */
function dispatchHostCommands(container: HTMLElement, sessionId: string, commands: HostCommand[]): void {
  const detail: HostCommandEventDetail = { version: HOST_COMMAND_PROTOCOL_VERSION, sessionId, commands };
  container.dispatchEvent(new CustomEvent('conversia-app:command', { bubbles: true, composed: true, detail }));
}

export async function renderChatView(container: HTMLElement, session: StudentSession): Promise<void> {
  container.innerHTML = `
    <div class="chat-view">
      <div class="message-list"></div>
      <div class="chat-status" aria-live="polite"></div>
      <div class="input-bar-container"></div>
      <div class="chat-footer">
        <span class="provider-status" aria-live="polite"></span>
        <p class="ai-provider-warning">${t('chat.aiProviderWarning')}</p>
      </div>
    </div>
  `;

  const messageListEl = container.querySelector('.message-list') as HTMLElement;
  const inputBarEl = container.querySelector('.input-bar-container') as HTMLElement;
  const statusEl = container.querySelector('.chat-status') as HTMLElement;
  const providerStatusEl = container.querySelector('.provider-status') as HTMLElement;

  let messages = await getMessagesForSession(session.id);
  if (messages.length === 0) {
    const welcomeMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      role: 'assistant',
      content: t('chat.welcomeMessage', { subject: session.subject }),
      timestamp: Date.now(),
    };
    messages = [welcomeMessage];
    await addMessage(welcomeMessage);
  }
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
          providerId: result.providerId,
        },
      };
      messages = [...messages, assistantMessage];
      renderMessageList(messageListEl, messages);
      await addMessage(assistantMessage);
      if (result.hostCommands?.length) {
        dispatchHostCommands(container, session.id, result.hostCommands);
      }
      statusEl.textContent = '';
      if (providerStatusEl && result.providerId) {
        const display = PROVIDER_DISPLAY[result.providerId];
        providerStatusEl.textContent = display
          ? `${t('chat.providerLabel')}: ${display.provider} ${t('chat.modelLabel')}: ${display.model}`
          : `${t('chat.modelLabel')}: ${result.providerId}`;
      }
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
