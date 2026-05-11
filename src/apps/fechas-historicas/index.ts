import type { AppContext, MemoriaApp } from '../../core/app-contract';
import { countDue, pickNextDue } from '../../core/training/drill-loop';
import type { Rating } from '../../core/spaced-repetition/sm2';
import { createFechasStore, type FechasStore } from './store';
import {
  addEntry,
  applyFechasReview,
  removeEntry,
  type FechasState,
} from './state';
import { compressYear } from './year-shortcut';

type View = 'lista' | 'drill';

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export const fechasApp: MemoriaApp = {
  id: 'fechas',
  route: 'fechas',
  name: 'Fechas',
  description: 'Fechas históricas con atajo de compresión de años de Campayo.',
  contentKind: 'date-event',

  mount(root: HTMLElement, ctx: AppContext): void {
    const store: FechasStore = createFechasStore(ctx.storage);
    let state: FechasState = store.load();
    let view: View = 'lista';
    let revealed = false;

    function persist(next: FechasState): void {
      state = next;
      store.save(state);
    }

    function renderSubnav(): string {
      return `
        <div class="subnav">
          <button class="subnav-item ${view === 'lista' ? 'active' : ''}" data-view="lista">Lista</button>
          <button class="subnav-item ${view === 'drill' ? 'active' : ''}" data-view="drill">Drill</button>
        </div>
      `;
    }

    function renderLista(): string {
      const rows = state.entries
        .map((e) => {
          const c = compressYear(e.year);
          const digits = ctx.encoder.encode(e.association).join('');
          return `
            <tr>
              <td class="year">${e.year}</td>
              <td class="compressed" title="${c.era}">${c.compressed}</td>
              <td class="event">${escapeHtml(e.event)}</td>
              <td class="assoc">${escapeHtml(e.association)}
                ${digits ? `<span class="encoded" title="Codificación Mayor de la asociación">→ ${digits}</span>` : ''}
              </td>
              <td class="actions">
                <button class="del" data-id="${e.id}" aria-label="Eliminar">×</button>
              </td>
            </tr>
          `;
        })
        .join('');

      return `
        <div class="fechas-intro">
          <p>
            Campayo comprime el año antes de codificarlo:
            <span class="rule">s. XX → 2 últimos dígitos</span>,
            <span class="rule">1001-2000 → 3 últimos</span>,
            <span class="rule">resto → 4 completos</span>.
          </p>
          <p class="fechas-flow">
            Escribe el año, el evento y una <strong>asociación</strong> donde aparezca una palabra cuyos dígitos Mayor formen el año comprimido. El codificador lo verifica abajo en vivo.
          </p>
        </div>

        <form class="fechas-form" id="fechas-form">
          <input type="number" name="year" placeholder="Año" required min="-3000" max="9999">
          <input type="text" name="event" placeholder="Evento" required>
          <input type="text" name="association" placeholder="Asociación inverosímil">
          <button type="submit">Añadir</button>
        </form>

        ${state.entries.length === 0
          ? '<p class="empty">Aún no hay fechas. Añade una arriba.</p>'
          : `
            <table class="fechas-table">
              <thead>
                <tr><th>Año</th><th>→</th><th>Evento</th><th>Asociación</th><th></th></tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          `}
      `;
    }

    function renderDrill(): string {
      const items = state.entries;
      if (items.length === 0) {
        return `
          <div class="trainer-empty">
            <h3>Sin fechas todavía</h3>
            <p>Añade al menos una en <strong>Lista</strong> para empezar a drillar.</p>
          </div>
        `;
      }
      const item = pickNextDue(items);
      const due = countDue(items);
      if (!item) {
        return `
          <div class="trainer-empty">
            <h3>Día completado</h3>
            <p>${items.length} fechas en total. Vuelve más tarde.</p>
          </div>
        `;
      }
      return `
        <div class="trainer-card">
          <div class="trainer-due">${due} pendiente${due === 1 ? '' : 's'}</div>
          <div class="trainer-prompt num">${item.year}</div>
          <div class="trainer-hint">¿Qué evento?</div>
          ${
            revealed
              ? `
              <div class="pi-reveal">
                <div class="pi-reveal-image">${escapeHtml(item.event)}</div>
                ${item.association ? `<div class="pi-reveal-assoc">${escapeHtml(item.association)}</div>` : ''}
              </div>
              <div class="trainer-ratings">
                <button class="rate again" data-rating="again">Otra vez</button>
                <button class="rate hard" data-rating="hard">Difícil</button>
                <button class="rate good" data-rating="good">Bien</button>
                <button class="rate easy" data-rating="easy">Fácil</button>
              </div>
              `
              : `<button class="trainer-reveal">Mostrar</button>`
          }
        </div>
      `;
    }

    function attachListaHandlers(): void {
      const form = root.querySelector<HTMLFormElement>('#fechas-form');
      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const year = Number(data.get('year'));
        const event = String(data.get('event') ?? '').trim();
        const association = String(data.get('association') ?? '').trim();
        if (Number.isNaN(year) || event === '') return;
        persist(addEntry(state, year, event, association));
        render();
      });

      root.querySelectorAll<HTMLButtonElement>('.del').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset['id'];
          if (!id) return;
          if (window.confirm('¿Eliminar esta fecha?')) {
            persist(removeEntry(state, id));
            render();
          }
        });
      });
    }

    function attachDrillHandlers(): void {
      const reveal = root.querySelector<HTMLButtonElement>('.trainer-reveal');
      reveal?.addEventListener('click', () => {
        revealed = true;
        render();
      });
      root.querySelectorAll<HTMLButtonElement>('button[data-rating]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const rating = btn.dataset['rating'] as Rating | undefined;
          if (!rating) return;
          const item = pickNextDue(state.entries);
          if (!item) return;
          persist(applyFechasReview(state, item.id, rating));
          revealed = false;
          render();
        });
      });
    }

    function render(): void {
      root.innerHTML = renderSubnav() + (view === 'lista' ? renderLista() : renderDrill());

      root.querySelectorAll<HTMLButtonElement>('.subnav-item').forEach((btn) => {
        btn.addEventListener('click', () => {
          const v = btn.dataset['view'] as View | undefined;
          if (v && v !== view) {
            view = v;
            revealed = false;
            render();
          }
        });
      });

      if (view === 'lista') attachListaHandlers();
      else attachDrillHandlers();
    }

    render();
  },
};
