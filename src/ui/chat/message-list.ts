import { t } from '../../i18n/translations';
import type { ChatMessage } from '../../models/types';

/** Only AI-generated replies (those carrying provider metadata) can be reported; the
 *  locally-built welcome message has none. */
function isReportable(m: ChatMessage): boolean {
  return m.role === 'assistant' && !!m.metadata?.providerId;
}

export function renderMessageList(
  container: HTMLElement,
  messages: ChatMessage[],
  onReport?: (messageId: string) => void,
): void {
  container.innerHTML = messages
    .map((m) => {
      const action =
        onReport && isReportable(m)
          ? m.metadata?.reportedAt
            ? `<span class="message-reported">${t('chat.reportedLabel')}</span>`
            : `<button type="button" class="report-link" data-report-id="${escapeAttr(m.id)}">${t('chat.reportButton')}</button>`
          : '';
      return `<div class="message message-${m.role}"><div class="message-body"><div class="message-bubble">${escapeHtml(
        m.content,
      )}</div>${action}</div></div>`;
    })
    .join('');
  container.scrollTop = container.scrollHeight;
  if (onReport) {
    container.querySelectorAll<HTMLButtonElement>('[data-report-id]').forEach((btn) => {
      btn.addEventListener('click', () => onReport(btn.dataset.reportId as string));
    });
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, '&quot;');
}
