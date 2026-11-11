import { t } from '../../i18n/translations';
import { REPORT_REASONS, type ReportReason } from '../../models/types';

export interface ReportDialogResult {
  reason: ReportReason;
  comment: string;
}

const REASON_LABEL_KEY = {
  inappropriate: 'chat.reportReasonInappropriate',
  incorrect: 'chat.reportReasonIncorrect',
  harmful: 'chat.reportReasonHarmful',
  other: 'chat.reportReasonOther',
} as const satisfies Record<ReportReason, Parameters<typeof t>[0]>;

/** Modal "Report an issue" form, mounted inside `host` (so it stays within the widget's shadow root).
 *  `onSubmit` performs the send; rejecting keeps the dialog open with an error message. */
export function openReportDialog(host: HTMLElement, onSubmit: (result: ReportDialogResult) => Promise<void>): void {
  const overlay = document.createElement('div');
  overlay.className = 'report-overlay';
  overlay.innerHTML = `
    <form class="report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <h3 id="report-title">${t('chat.reportTitle')}</h3>
      <p class="report-intro">${t('chat.reportIntro')}</p>
      <fieldset class="report-reasons">
        <legend>${t('chat.reportReasonLabel')}</legend>
        ${REPORT_REASONS.map(
          (r, i) =>
            `<label><input type="radio" name="reason" value="${r}"${i === 0 ? ' checked' : ''} /> ${t(REASON_LABEL_KEY[r])}</label>`,
        ).join('')}
      </fieldset>
      <label class="report-comment-label">${t('chat.reportCommentLabel')}
        <textarea name="comment" rows="3" maxlength="1000" placeholder="${t('chat.reportCommentPlaceholder')}"></textarea>
      </label>
      <div class="report-status" aria-live="polite"></div>
      <div class="report-actions">
        <button type="button" data-action="cancel">${t('chat.reportCancel')}</button>
        <button type="submit">${t('chat.reportSubmit')}</button>
      </div>
    </form>
  `;
  host.appendChild(overlay);

  const form = overlay.querySelector('form') as HTMLFormElement;
  const statusEl = overlay.querySelector('.report-status') as HTMLElement;
  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  const cancelBtn = form.querySelector('[data-action="cancel"]') as HTMLButtonElement;
  const close = (): void => overlay.remove();

  cancelBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const reason = (data.get('reason') as ReportReason) ?? 'other';
    const comment = String(data.get('comment') ?? '').trim();
    submitBtn.disabled = true;
    cancelBtn.disabled = true;
    statusEl.textContent = t('chat.reportSending');
    try {
      await onSubmit({ reason, comment });
      statusEl.textContent = t('chat.reportThanks');
      setTimeout(close, 1200);
    } catch (error) {
      console.error('report failed:', error);
      statusEl.textContent = t('chat.reportFailed');
      submitBtn.disabled = false;
      cancelBtn.disabled = false;
    }
  });

  (form.querySelector('input[name="reason"]') as HTMLInputElement).focus();
}
