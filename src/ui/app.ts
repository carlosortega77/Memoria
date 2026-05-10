import { AppRegistry } from '../core/app-contract';
import { createMajorEncoder } from '../core/encoders/major/encoder';
import { MAJOR_CAMPAYO } from '../data/presets/major-campayo';
import { CASILLERO_CAMPAYO } from '../data/presets/casillero-campayo';
import type { CasilleroStore } from '../core/casillero/store';
import { mountCasilleroBuilder } from './casillero-builder';

export interface AppContext {
  registry: AppRegistry;
  casilleroStore: CasilleroStore;
}

export function mountApp(root: HTMLElement, ctx: AppContext): void {
  const apps = ctx.registry.list();
  const slotCount = CASILLERO_CAMPAYO.slots.length;
  const comodinCount = CASILLERO_CAMPAYO.comodines.length;
  const totalCapacity = slotCount + comodinCount * 100;

  const encoder = createMajorEncoder(MAJOR_CAMPAYO);

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

  root.innerHTML = `
    <main class="landing">
      <header>
        <h1>Memoria</h1>
        <p class="tagline">Palacios de memoria · Sistema Mayor · Repaso espaciado</p>
      </header>

      <section class="builder-section">
        <div id="builder-mount"></div>
      </section>

      <details class="diag">
        <summary>Diagnóstico</summary>

        <section>
          <h2>Codificador</h2>
          <div class="preset-card">
            <strong>Verificación contra el libro</strong>
            <p>Ejemplos literales de "Desarrolla una mente prodigiosa".</p>
            <table class="cases">
              ${cases
                .map(
                  (c) => `<tr class="${c.ok ? 'ok' : 'fail'}">
                    <td>${c.word}</td>
                    <td>→</td>
                    <td>${c.got.join(' ')}</td>
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
          <h2>Aplicaciones</h2>
          <ul id="app-list">
            ${apps.length === 0
              ? '<li class="empty">Aún no hay aplicaciones registradas.</li>'
              : apps.map((a) => `<li>${a.name} — ${a.description}</li>`).join('')}
          </ul>
        </section>
      </details>

      <footer>
        <small>v0.1 — Capa 1: builder operativo.</small>
      </footer>
    </main>
  `;

  const builderMount = root.querySelector<HTMLDivElement>('#builder-mount');
  if (builderMount) {
    mountCasilleroBuilder(builderMount, CASILLERO_CAMPAYO, ctx.casilleroStore);
  }
}
