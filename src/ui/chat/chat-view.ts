import { renderMessageList } from './message-list';
import { renderInputBar, setInputBarDisabled } from './input-bar';
import { addMessage, getMessagesForSession, updateSession } from '../../db/chat';
import { sendStudentMessage } from '../../services/homework';
import { GeminiError } from '../../services/gemini';
import type { ChatMessage, StudentSession } from '../../models/types';

export async function renderChatView(container: HTMLElement, session: StudentSession): Promise<void> {
  container.innerHTML = `
    <div class="chat-view">
      <header class="chat-header">${session.subject} · Grade ${session.gradeLevel}</header>
      <div class="message-list"></div>
      <div class="chat-status" aria-live="polite"></div>
      <div class="input-bar-container"></div>
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
    statusEl.textContent = 'Thinking...';

    try {
      const history = messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
      const result = await sendStudentMessage({
        subject: session.subject,
        gradeLevel: session.gradeLevel,
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
  if (error instanceof GeminiError) {
    switch (error.kind) {
      case 'not_configured':
        return 'The AI service is not configured. Please contact an administrator.';
      case 'rate_limited':
        return "We're a bit busy right now. Please try again in about a minute.";
      case 'unavailable':
        return 'The AI service is temporarily unavailable. Please try again shortly.';
      case 'network':
        return 'Connection problem. Check your internet and try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
  return 'Something went wrong. Please try again.';
}
