import './styles.css';
import { renderApp } from './ui/app';
import { initLocale } from './i18n/locale';
import { bootstrapStandaloneIdentity } from './services/standalone-identity';

// Must run before any chat/widget code: the widget reads window.conversiaClient lazily on
// its first AI request (feature 002-secure-embed-telemetry).
bootstrapStandaloneIdentity();

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
