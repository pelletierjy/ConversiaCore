import './styles.css';
import { renderApp } from './ui/app';
import { initLocale } from './i18n/locale';

const params = new URLSearchParams(window.location.search);
const theme = params.get('theme');
if (theme === 'dark' || theme === 'light') {
  document.documentElement.setAttribute('data-theme', theme);
}

initLocale();

const root = document.getElementById('app');
if (root) {
  renderApp(root);
}
