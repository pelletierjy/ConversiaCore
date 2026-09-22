import { hashPin, verifyPin } from '../../utils/pin-hash';
import { t } from '../../i18n/translations';

export interface LoginFormOptions {
  mode: 'setup' | 'login';
  storedPinHash?: string;
  onSetup?: (pinHash: string) => void;
  onLogin?: () => void;
}

export function renderLoginForm(container: HTMLElement, options: LoginFormOptions): void {
  const isSetup = options.mode === 'setup';

  container.innerHTML = `
    <form class="admin-login-form">
      <h2>${isSetup ? t('login.setupTitle') : t('login.loginTitle')}</h2>
      <p>${isSetup ? t('login.setupDescription') : t('login.loginDescription')}</p>
      <input type="password" name="pin" placeholder="${t('login.pinPlaceholder')}" inputmode="numeric" minlength="4" required />
      <button type="submit">${isSetup ? t('login.savePinButton') : t('login.loginButton')}</button>
      <p class="admin-login-error" role="alert"></p>
    </form>
  `;

  const form = container.querySelector('form') as HTMLFormElement;
  const errorEl = form.querySelector('.admin-login-error') as HTMLElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = (form.querySelector('input[name="pin"]') as HTMLInputElement).value.trim();
    if (pin.length < 4) {
      errorEl.textContent = t('login.pinTooShortError');
      return;
    }

    if (isSetup) {
      options.onSetup?.(await hashPin(pin));
      return;
    }

    const ok = options.storedPinHash ? await verifyPin(pin, options.storedPinHash) : false;
    if (!ok) {
      errorEl.textContent = t('login.incorrectPinError');
      return;
    }
    options.onLogin?.();
  });
}
