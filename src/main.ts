import { AppRegistry } from './core/app-contract';
import { createCasilleroStore } from './core/casillero/store';
import { createLocalStorage } from './persistence/local-storage';
import { mountApp } from './ui/app';
import './ui/style.css';

const storage = createLocalStorage();
const casilleroStore = createCasilleroStore(storage);
const registry = new AppRegistry();

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app root element');

mountApp(root, { registry, casilleroStore });

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {
    // SW solo útil en producción.
  });
}
