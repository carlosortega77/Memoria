import { AppRegistry } from './core/app-contract';
import { createCasilleroStore } from './core/casillero/store';
import { createTrainerStore } from './core/training/store';
import { createLocalStorage } from './persistence/local-storage';
import { mountApp } from './ui/app';
import './ui/style.css';

const storage = createLocalStorage();
const casilleroStore = createCasilleroStore(storage);
const trainerStore = createTrainerStore(storage);
const registry = new AppRegistry();

// Las apps de Capa 2 se registrarán aquí cuando existan:
//   registry.register(piApp);
//   registry.register(fechasApp);
//   registry.register(numerosApp);

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app root element');

mountApp(root, { registry, storage, casilleroStore, trainerStore });

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
