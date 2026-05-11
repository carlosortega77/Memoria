import type { AppContext, AppRegistry, MemoriaApp } from '../core/app-contract';
import { createMajorEncoder } from '../core/encoders/major/encoder';
import { MAJOR_CAMPAYO } from '../data/presets/major-campayo';
import { CASILLERO_CAMPAYO } from '../data/presets/casillero-campayo';
import type { CasilleroStore } from '../core/casillero/store';
import type { TrainerStore } from '../core/training/store';
import type { Storage } from '../persistence/local-storage';
import { mountCasilleroBuilder } from './casillero-builder';
import { mountMajorTrainer } from './major-trainer';
import { mountLearn } from '../learn';
import { createHashRouter, type Route } from './router';
import { withTransition } from './transitions';

export interface BootContext {
  registry: AppRegistry;
  storage: Storage;
  casilleroStore: CasilleroStore;
  trainerStore: TrainerStore;
}

const BUILTIN_ROUTES = ['learn', 'builder', 'trainer', 'diag'] as const;

export function mountApp(root: HTMLElement, boot: BootContext): void {
  const encoder = createMajorEncoder(MAJOR_CAMPAYO);
  const appCtx: AppContext = {
    storage: boot.storage,
    preset: CASILLERO_CAMPAYO,
    casilleroStore: boot.casilleroStore,
    encoder,
  };

  const appRoutes = boot.registry.list().map((a) => a.route);
  const validRoutes = [...BUILTIN_ROUTES, ...appRoutes];

  const router = createHashRouter({
    defaultRoute: 'learn',
    validRoutes,
  });

  const navItems: Array<{ route: Route; label: string }> = [
    { route: 'learn', label: 'Aprender' },
    { route: 'builder', label: 'Construir' },
    { route: 'trainer', label: 'Entrenar' },
    ...boot.registry.list().map((a) => ({ route: a.route, label: a.name })),
    { route: 'diag', label: 'Diagnóstico' },
  ];

  function renderShell(active: Route): void {
    root.innerHTML = `
      <main class="shell">
        <header class="shell-header">
          <h1>Memoria</h1>
        </header>
        <nav class="nav">
          ${navItems
            .map(
              (n) =>
                `<a class="nav-item ${active === n.route ? 'active' : ''}" href="#/${n.route}">${n.label}</a>`,
            )
            .join('')}
        </nav>
        <section class="view">
          <div id="view-mount"></div>
        </section>
        <footer class="shell-footer">
          <small>Códice Mnemónico · v0.2</small>
        </footer>
      </main>
    `;

    const mount = root.querySelector<HTMLDivElement>('#view-mount');
    if (!mount) return;

    switch (active) {
      case 'learn':
        mountLearn(mount, appCtx);
        return;
      case 'builder':
        mountCasilleroBuilder(mount, CASILLERO_CAMPAYO, boot.casilleroStore);
        return;
      case 'trainer':
        mountMajorTrainer(mount, CASILLERO_CAMPAYO, boot.casilleroStore, boot.trainerStore);
        return;
      case 'diag':
        mountDiag(mount, boot.registry, encoder);
        return;
      default: {
        const app: MemoriaApp | undefined = boot.registry.findByRoute(active);
        if (app) app.mount(mount, appCtx);
        else mount.innerHTML = `<p class="empty">Vista no encontrada.</p>`;
      }
    }
  }

  router.onChange((next) => withTransition(() => renderShell(next)));
  renderShell(router.current());
}

function mountDiag(
  root: HTMLElement,
  registry: AppRegistry,
  encoder: ReturnType<typeof createMajorEncoder>,
): void {
  const slotCount = CASILLERO_CAMPAYO.slots.length;
  const comodinCount = CASILLERO_CAMPAYO.comodines.length;
  const totalCapacity = slotCount + comodinCount * 100;

  const bookCases: Array<{ word: string; expected: readonly number[]; meaning: string }> = [
    { word: 'tachuelas', expected: [1, 8, 5, 6], meaning: 'fecha 1856' },
    { word: 'botella', expected: [9, 1, 5, 5], meaning: 'parte de tel. 9155' },
    { word: 'Luna', expected: [5, 2], meaning: 'parte de tel. 52' },
  ];
  const cases = bookCases.map((c) => {
    const got = encoder.encode(c.word);
    const ok = got.length === c.expected.length && got.every((d, i) => d === c.expected[i]);
    return { ...c, got, ok };
  });

  const apps = registry.list();

  root.innerHTML = `
    <section>
      <h2>Codificador</h2>
      <div class="preset-card">
        <strong>Verificación contra el libro</strong>
        <p>Ejemplos literales de "Desarrolla una mente prodigiosa".</p>
        <table class="cases">
          ${cases
            .map(
              (c) => `<tr class="${c.ok ? 'ok' : 'fail'}">
                <td>${c.word}</td><td>→</td><td>${c.got.join(' ')}</td>
                <td class="meaning">${c.meaning}</td>
                <td class="status">${c.ok ? 'OK' : 'FAIL'}</td>
              </tr>`,
            )
            .join('')}
        </table>
      </div>
    </section>

    <section>
      <h2>Preset Mayor</h2>
      <div class="preset-card">
        <strong>${MAJOR_CAMPAYO.name}</strong>
        <p>${MAJOR_CAMPAYO.description}</p>
        <table class="mapping">
          ${(Object.entries(MAJOR_CAMPAYO.mapping) as Array<[string, readonly string[]]>)
            .map(
              ([digit, phonemes]) =>
                `<tr><td>${digit}</td><td>${phonemes.join(', ')}</td></tr>`,
            )
            .join('')}
        </table>
      </div>
    </section>

    <section>
      <h2>Capacidad</h2>
      <div class="preset-card">
        <ul class="stats">
          <li><span>${slotCount}</span> casillas base</li>
          <li><span>${comodinCount}</span> comodines</li>
          <li><span>${totalCapacity}</span> capacidad total</li>
        </ul>
      </div>
    </section>

    <section>
      <h2>Aplicaciones registradas</h2>
      <ul id="app-list">
        ${apps.length === 0
          ? '<li class="empty">Aún no hay aplicaciones registradas.</li>'
          : apps
              .map(
                (a) =>
                  `<li><strong>${a.name}</strong> (${a.id}) — ${a.description} <a href="#/${a.route}">→</a></li>`,
              )
              .join('')}
      </ul>
    </section>
  `;
}
