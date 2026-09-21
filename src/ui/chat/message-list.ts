import type { ChatMessage } from '../../models/types';

export function renderMessageList(container: HTMLElement, messages: ChatMessage[]): void {
  container.innerHTML = messages
    .map(
      (m) =>
        `<div class="message message-${m.role}"><div class="message-bubble">${escapeHtml(m.content)}</div></div>`,
    )
    .join('');
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
