import { WORKER_BASE_URL } from '../../config';
import { t } from '../../i18n/translations';

interface StoredReport {
  id: string;
  remoteId: string;
  createdAt: string;
  reason: string;
  comment?: string;
  assistantContent: string;
  studentPrompt?: string;
  providerId?: string;
}

const TOKEN_KEY = 'conversia-admin-token';

function readToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage unavailable: the user just re-enters the token next time
  }
}

function esc(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/"/g, '&quot;');
}

/** Lists "Report an issue" submissions from the worker's /admin/reports route. The route is guarded
 *  by the worker's ADMIN_TOKEN, which is kept only in sessionStorage for this tab. */
export function renderReportsPanel(container: HTMLElement): void {
  container.innerHTML = `
    <div class="reports-panel">
      <p>${t('admin.reportsDescription')}</p>
      <form>
        <label>${t('admin.reportsTokenLabel')}
          <input type="password" name="token" autocomplete="off" value="${esc(readToken())}" />
        </label>
        <button type="submit">${t('admin.reportsLoadButton')}</button>
      </form>
      <div class="reports-status" aria-live="polite"></div>
      <div class="reports-results"></div>
    </div>
  `;
  const form = container.querySelector('form') as HTMLFormElement;
  const statusEl = container.querySelector('.reports-status') as HTMLElement;
  const resultsEl = container.querySelector('.reports-results') as HTMLElement;

  async function load(token: string): Promise<void> {
    statusEl.className = 'reports-status';
    statusEl.textContent = t('admin.reportsLoading');
    resultsEl.innerHTML = '';
    try {
      const response = await fetch(`${WORKER_BASE_URL}/admin/reports?limit=200`, { headers: { 'X-Admin-Token': token } });
      if (response.status === 401) {
        statusEl.className = 'reports-status error';
        statusEl.textContent = t('admin.reportsUnauthorized');
        return;
      }
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { reports: StoredReport[] };
      saveToken(token);
      statusEl.textContent = data.reports.length ? '' : t('admin.reportsEmpty');
      if (!data.reports.length) return;
      resultsEl.innerHTML = `
        <table class="reports-table">
          <thead><tr>
            <th>${t('admin.reportsColTime')}</th><th>${t('admin.reportsColClient')}</th><th>${t('admin.reportsColReason')}</th>
            <th>${t('admin.reportsColProvider')}</th><th>${t('admin.reportsColDetails')}</th>
          </tr></thead>
          <tbody>
            ${data.reports
              .map(
                (r) => `<tr>
                  <td>${esc(new Date(r.createdAt).toLocaleString())}</td>
                  <td>${esc(r.remoteId)}</td>
                  <td>${esc(r.reason)}</td>
                  <td>${esc(r.providerId ?? '-')}</td>
                  <td><details><summary>${esc((r.comment || r.assistantContent).slice(0, 80))}</summary>
                    ${r.comment ? `<p><strong>${t('admin.reportsComment')}:</strong></p><pre>${esc(r.comment)}</pre>` : ''}
                    ${r.studentPrompt ? `<p><strong>${t('admin.reportsPrompt')}:</strong></p><pre>${esc(r.studentPrompt)}</pre>` : ''}
                    <p><strong>${t('admin.reportsReply')}:</strong></p><pre>${esc(r.assistantContent)}</pre>
                  </details></td>
                </tr>`,
              )
              .join('')}
          </tbody>
        </table>`;
    } catch (error) {
      console.error('reports load failed:', error);
      statusEl.className = 'reports-status error';
      statusEl.textContent = t('admin.reportsLoadFailed');
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const token = String(new FormData(form).get('token') ?? '').trim();
    if (token) void load(token);
  });
  const existing = readToken();
  if (existing) void load(existing);
}
