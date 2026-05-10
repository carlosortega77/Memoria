import { AppRegistry } from '../core/app-contract';
import { MAJOR_CAMPAYO } from '../data/presets/major-campayo';
import { CASILLERO_CAMPAYO } from '../data/presets/casillero-campayo';

export function mountApp(root: HTMLElement, registry: AppRegistry): void {
  const apps = registry.list();
  const slotCount = CASILLERO_CAMPAYO.slots.length;
  const comodinCount = CASILLERO_CAMPAYO.comodines.length;
  const totalCapacity = slotCount + comodinCount * 100;

  const sampleSlots = [1, 32, 49, 87, 100]
    .map((pos) => CASILLERO_CAMPAYO.slots.find((s) => s.position === pos))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  root.innerHTML = `
    <main class="landing">
      <header>
        <h1>Memoria</h1>
        <p class="tagline">Palacios de memoria · Sistema Mayor · Repaso espaciado</p>
      </header>

      <section>
        <h2>Preset cargado</h2>
        <div class="preset-card">
          <strong>${MAJOR_CAMPAYO.name}</strong>
          <p>${MAJOR_CAMPAYO.description}</p>
          <table class="mapping">
            ${(Object.entries(MAJOR_CAMPAYO.mapping) as Array<[string, readonly string[]]>)
              .map(([digit, phonemes]) => `<tr><td>${digit}</td><td>${phonemes.join(', ')}</td></tr>`)
              .join('')}
          </table>
        </div>
      </section>

      <section>
        <h2>Casillero</h2>
        <div class="preset-card">
          <strong>${CASILLERO_CAMPAYO.name}</strong>
          <p>${CASILLERO_CAMPAYO.description}</p>
          <ul class="stats">
            <li><span>${slotCount}</span> casillas base</li>
            <li><span>${comodinCount}</span> comodines</li>
            <li><span>${totalCapacity}</span> capacidad total</li>
          </ul>
          <h3>Muestra</h3>
          <table class="sample">
            ${sampleSlots
              .map((s) => `<tr><td>${s.position}</td><td>${s.options.join(' · ')}</td></tr>`)
              .join('')}
          </table>
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

      <footer>
        <small>v0.1 — Capa 1: datos cargados.</small>
      </footer>
    </main>
  `;
}
