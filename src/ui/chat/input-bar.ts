import { t } from '../../i18n/translations';

export function renderInputBar(container: HTMLElement, onSend: (text: string) => void): void {
  container.innerHTML = `
    <form class="input-bar">
      <input type="text" name="message" placeholder="${t('chat.inputPlaceholder')}" autocomplete="off" />
      <button type="submit">${t('chat.sendButton')}</button>
    </form>
  `;

  const form = container.querySelector('form') as HTMLFormElement;
  const input = form.querySelector('input') as HTMLInputElement;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    onSend(text);
  });
}

export function setInputBarDisabled(container: HTMLElement, disabled: boolean): void {
  container.querySelectorAll('input, button').forEach((el) => {
    (el as HTMLInputElement | HTMLButtonElement).disabled = disabled;
  });
}
