import './styles.css';
import { renderApp } from './ui/app';

const params = new URLSearchParams(window.location.search);
const theme = params.get('theme');
if (theme === 'dark' || theme === 'light') {
  document.documentElement.setAttribute('data-theme', theme);
}

const root = document.getElementById('app');
if (root) {
  renderApp(root);
}
