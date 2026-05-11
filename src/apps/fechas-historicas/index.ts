import type { AppContext, MemoriaApp } from '../../core/app-contract';
import { countDue, pickNextDue } from '../../core/training/drill-loop';
import type { Rating } from '../../core/spaced-repetition/sm2';
import { createFechasStore, type FechasStore } from './store';
import {
  addEntries,
  addEntry,
  applyFechasReview,
  getEntryById,
  removeEntry,
  type FechasState,
} from './state';
import { compressYear } from './year-shortcut';
import { SEED_FECHAS } from './dataset';
import { withTransition } from '../../ui/transitions';

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

    function renderFormCompression(): string {
      // Vista placeholder; el JS la actualiza en vivo.
      return `
        <div class="year-compression" id="year-compression-preview" data-empty="1">
          <span class="yc-strike"></span><span class="yc-keep">— —</span>
          <span class="yc-era">teclea un año arriba</span>
        </div>
      `;
    }

    function renderLista(): string {
      const rows = state.entries
        .map((e) => {
          const c = compressYear(e.year);
          const target = c.compressed;
          const encoded = ctx.encoder.encode(e.association).join('');
          const ok = encoded.length > 0 && encoded === target;
          const partial = encoded.length > 0 && !ok;
          const yearVisual =
            c.era === 'completo'
              ? `<span class="year-full">${e.year}</span>`
              : c.era === 'siglo-xx'
                ? `<span class="year-strike">19</span><span class="year-keep">${target}</span>`
                : `<span class="year-strike">${String(e.year).slice(0, -3)}</span><span class="year-keep">${target}</span>`;

          const validBadge = ok
            ? '<span class="encoder-ok">✓ codifica</span>'
            : partial
              ? `<span class="encoder-partial">codifica a ${encoded}</span>`
              : '';

          return `
            <tr class="${ok ? 'ok' : partial ? 'partial' : ''}">
              <td class="year-cell">${yearVisual}</td>
              <td class="event">${escapeHtml(e.event)}</td>
              <td class="assoc">
                ${e.association ? escapeHtml(e.association) : '<span class="assoc-empty">— sin asociación —</span>'}
                ${validBadge}
              </td>
              <td class="actions">
                <button class="del" data-id="${e.id}" aria-label="Eliminar">×</button>
              </td>
            </tr>
          `;
        })
        .join('');

      const seedSection =
        state.entries.length === 0
          ? `
            <div class="seed-prompt">
              <p>Empieza con una <strong>muestra canónica</strong> de 10 fechas históricas (Descubrimiento, Cádiz, Berlín, 11-S...) y personaliza desde ahí.</p>
              <button class="btn-secondary" id="seed-load">Cargar muestra (10 fechas)</button>
            </div>
          `
          : '';

      return `
        <details class="how-it-works">
          <summary>Cómo funciona</summary>
          <p>
            Campayo comprime el año antes de codificarlo:
            <span class="rule">s. XX → 2 últimos dígitos</span>,
            <span class="rule">1001-2000 → 3 últimos</span>,
            <span class="rule">resto → 4 completos</span>.
          </p>
          <p>
            Escribe el año, el evento y una <strong>asociación</strong> donde aparezca una palabra cuyos dígitos Mayor formen el año comprimido. El codificador comprueba ✓ si encaja.
          </p>
        </details>

        ${seedSection}

        <form class="fechas-form" id="fechas-form">
          <input type="number" name="year" placeholder="Año" required min="-3000" max="9999" autocomplete="off">
          <input type="text" name="event" placeholder="Evento" required autocomplete="off">
          <input type="text" name="association" placeholder="Asociación inverosímil" autocomplete="off">
          <button type="submit">Añadir</button>
        </form>

        ${renderFormCompression()}

        ${state.entries.length === 0
          ? '<p class="empty">Aún no hay fechas. Añade una arriba o carga la muestra.</p>'
          : `
            <table class="fechas-table">
              <thead>
                <tr><th>Año → comprimido</th><th>Evento</th><th>Asociación</th><th></th></tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          `}
      `;
    }

    function renderDrill(): string {
      const items = state.drillItems;
      if (items.length === 0) {
        return `
          <div class="trainer-empty">
            <h3>Sin fechas todavía</h3>
            <p>Añade al menos una en <strong>Lista</strong> o carga la muestra para empezar a drillar.</p>
          </div>
        `;
      }
      const item = pickNextDue(items);
      const due = countDue(items);
      if (!item) {
        return `
          <div class="trainer-empty">
            <h3>Día completado</h3>
            <p>${items.length} items en el trainer. Vuelve más tarde.</p>
          </div>
        `;
      }
      const entry = getEntryById(state, item.fechaId);
      if (!entry) return '<p class="empty">Fecha no encontrada.</p>';

      const compressed = compressYear(entry.year);
      const isYearToEvent = item.direction === 'y2e';
      const promptHtml = isYearToEvent
        ? `<div class="trainer-prompt num">${entry.year}</div>
           <div class="trainer-hint">¿Qué evento? <span class="hint-meta">año → evento · comprime a ${compressed.compressed}</span></div>`
        : `<div class="trainer-prompt word">${escapeHtml(entry.event)}</div>
           <div class="trainer-hint">¿En qué año? <span class="hint-meta">evento → año</span></div>`;

      const revealHtml = isYearToEvent
        ? `<div class="pi-reveal-image">${escapeHtml(entry.event)}</div>
           ${entry.association ? `<div class="pi-reveal-assoc">${escapeHtml(entry.association)}</div>` : ''}`
        : `<div class="pi-reveal-digits">${entry.year}</div>
           <div class="pi-reveal-image">${escapeHtml(entry.event)}</div>
           ${entry.association ? `<div class="pi-reveal-assoc">${escapeHtml(entry.association)}</div>` : ''}`;

      return `
        <div class="trainer-card">
          <div class="trainer-due">${due} pendiente${due === 1 ? '' : 's'}</div>
          ${promptHtml}
          ${revealed
            ? `<div class="pi-reveal">${revealHtml}</div>
               <div class="trainer-ratings">
                 <button class="rate again" data-rating="again">Otra vez</button>
                 <button class="rate hard" data-rating="hard">Difícil</button>
                 <button class="rate good" data-rating="good">Bien</button>
                 <button class="rate easy" data-rating="easy">Fácil</button>
               </div>`
            : `<button class="trainer-reveal">Mostrar</button>`}
        </div>
      `;
    }

    function updateCompressionPreview(): void {
      const form = root.querySelector<HTMLFormElement>('#fechas-form');
      const preview = root.querySelector<HTMLDivElement>('#year-compression-preview');
      if (!form || !preview) return;
      const yearInput = form.elements.namedItem('year') as HTMLInputElement | null;
      const assocInput = form.elements.namedItem('association') as HTMLInputElement | null;
      const raw = yearInput?.value ?? '';
      const yearNum = Number(raw);
      if (!raw || Number.isNaN(yearNum)) {
        preview.dataset['empty'] = '1';
        preview.innerHTML = `<span class="yc-strike"></span><span class="yc-keep">— —</span><span class="yc-era">teclea un año arriba</span>`;
        return;
      }
      const c = compressYear(yearNum);
      const yearStr = String(yearNum);
      let strike = '';
      let keep = c.compressed;
      if (c.era === 'siglo-xx') {
        strike = yearStr.slice(0, -2);
        keep = yearStr.slice(-2);
      } else if (c.era === 'segundo-milenio') {
        strike = yearStr.slice(0, -3);
        keep = yearStr.slice(-3);
      } else {
        strike = '';
        keep = yearStr;
      }
      const eraLabel =
        c.era === 'siglo-xx'
          ? 's. XX — 2 dígitos'
          : c.era === 'segundo-milenio'
            ? '1001-2000 — 3 dígitos'
            : 'completo — 4 dígitos';

      // Verificación en vivo de la asociación contra el comprimido.
      const assocText = assocInput?.value ?? '';
      const encoded = ctx.encoder.encode(assocText).join('');
      let validBadge = '';
      if (assocText.trim() === '') {
        validBadge = '';
      } else if (encoded === keep) {
        validBadge = '<span class="yc-valid ok">✓ asociación codifica el año</span>';
      } else if (encoded.length > 0) {
        validBadge = `<span class="yc-valid partial">codifica → ${encoded} (esperado ${keep})</span>`;
      }

      preview.dataset['empty'] = '0';
      preview.innerHTML = `
        ${strike ? `<span class="yc-strike">${strike}</span>` : ''}
        <span class="yc-keep">${keep}</span>
        <span class="yc-era">${eraLabel}</span>
        ${validBadge}
      `;
    }

    function attachListaHandlers(): void {
      const seedBtn = root.querySelector<HTMLButtonElement>('#seed-load');
      seedBtn?.addEventListener('click', () => {
        withTransition(() => {
          persist(addEntries(state, SEED_FECHAS));
          render();
        });
      });

      const form = root.querySelector<HTMLFormElement>('#fechas-form');
      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const year = Number(data.get('year'));
        const event = String(data.get('event') ?? '').trim();
        const association = String(data.get('association') ?? '').trim();
        if (Number.isNaN(year) || event === '') return;
        withTransition(() => {
          persist(addEntry(state, year, event, association));
          render();
        });
      });

      form?.addEventListener('input', updateCompressionPreview);
      updateCompressionPreview();

      root.querySelectorAll<HTMLButtonElement>('.del').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset['id'];
          if (!id) return;
          if (window.confirm('¿Eliminar esta fecha?')) {
            withTransition(() => {
              persist(removeEntry(state, id));
              render();
            });
          }
        });
      });
    }

    function attachDrillHandlers(): void {
      const reveal = root.querySelector<HTMLButtonElement>('.trainer-reveal');
      reveal?.addEventListener('click', () => {
        withTransition(() => {
          revealed = true;
          render();
        });
      });
      root.querySelectorAll<HTMLButtonElement>('button[data-rating]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const rating = btn.dataset['rating'] as Rating | undefined;
          if (!rating) return;
          const item = pickNextDue(state.drillItems);
          if (!item) return;
          withTransition(() => {
            persist(applyFechasReview(state, item.id, rating));
            revealed = false;
            render();
          });
        });
      });
    }

    function render(): void {
      root.innerHTML = renderSubnav() + (view === 'lista' ? renderLista() : renderDrill());

      root.querySelectorAll<HTMLButtonElement>('.subnav-item').forEach((btn) => {
        btn.addEventListener('click', () => {
          const v = btn.dataset['view'] as View | undefined;
          if (v && v !== view) {
            withTransition(() => {
              view = v;
              revealed = false;
              render();
            });
          }
        });
      });

      if (view === 'lista') attachListaHandlers();
      else attachDrillHandlers();
    }

    render();
  },
};
