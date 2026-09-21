export function renderInputBar(container: HTMLElement, onSend: (text: string) => void): void {
  container.innerHTML = `
    <form class="input-bar">
      <input type="text" name="message" placeholder="Type your message..." autocomplete="off" />
      <button type="submit">Send</button>
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
