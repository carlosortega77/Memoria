import { AppRegistry } from './core/app-contract';
import { mountApp } from './ui/app';
import './ui/style.css';

const registry = new AppRegistry();

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app root element');

mountApp(root, registry);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {
    // SW solo en build de producción; fallar silenciosamente en dev.
  });
}
