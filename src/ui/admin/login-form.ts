import { hashPin, verifyPin } from '../../utils/pin-hash';

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
      <h2>${isSetup ? 'Set Admin PIN' : 'Admin Login'}</h2>
      <p>${
        isSetup
          ? 'No PIN has been configured yet. Choose one to protect the admin area.'
          : 'Enter the admin PIN to continue.'
      }</p>
      <input type="password" name="pin" placeholder="PIN" inputmode="numeric" minlength="4" required />
      <button type="submit">${isSetup ? 'Save PIN' : 'Log In'}</button>
      <p class="admin-login-error" role="alert"></p>
    </form>
  `;

  const form = container.querySelector('form') as HTMLFormElement;
  const errorEl = form.querySelector('.admin-login-error') as HTMLElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = (form.querySelector('input[name="pin"]') as HTMLInputElement).value.trim();
    if (pin.length < 4) {
      errorEl.textContent = 'PIN must be at least 4 characters.';
      return;
    }

    if (isSetup) {
      options.onSetup?.(await hashPin(pin));
      return;
    }

    const ok = options.storedPinHash ? await verifyPin(pin, options.storedPinHash) : false;
    if (!ok) {
      errorEl.textContent = 'Incorrect PIN.';
      return;
    }
    options.onLogin?.();
  });
}
