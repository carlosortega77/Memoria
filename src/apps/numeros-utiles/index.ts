import type { AppContext, MemoriaApp } from '../../core/app-contract';
import { countDue, pickNextDue } from '../../core/training/drill-loop';
import type { Rating } from '../../core/spaced-repetition/sm2';
import { createNumerosStore, type NumerosStore } from './store';
import {
  addNumero,
  applyNumerosReview,
  digitsOnly,
  removeNumero,
  type NumerosState,
} from './state';
import { withTransition } from '../../ui/transitions';

type View = 'lista' | 'drill';

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export const numerosApp: MemoriaApp = {
  id: 'numeros',
  route: 'numeros',
  name: 'Números',
  description: 'Teléfonos, DNIs, IBANs y cualquier número con etiqueta.',
  contentKind: 'labeled-number',

  mount(root: HTMLElement, ctx: AppContext): void {
    const store: NumerosStore = createNumerosStore(ctx.storage);
    let state: NumerosState = store.load();
    let view: View = 'lista';
    let revealed = false;

    function persist(next: NumerosState): void {
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
          const target = digitsOnly(e.number);
          const encoded = ctx.encoder.encode(e.association).join('');
          const ok = encoded.length > 0 && encoded === target;
          return `
            <tr class="${ok ? 'ok' : encoded ? 'partial' : ''}">
              <td class="label">${escapeHtml(e.label)}</td>
              <td class="number">${escapeHtml(e.number)}</td>
              <td class="assoc">
                ${escapeHtml(e.association)}
                ${encoded ? `<span class="encoded">→ ${encoded}</span>` : ''}
                ${ok ? '<span class="check">✓</span>' : ''}
              </td>
              <td class="actions">
                <button class="del" data-id="${e.id}" aria-label="Eliminar">×</button>
              </td>
            </tr>
          `;
        })
        .join('');

      return `
        <div class="numeros-intro">
          <p>
            Añade números útiles: teléfonos, DNI, IBAN, matrículas. Crea una asociación cuyas consonantes Mayor formen los dígitos del número. El codificador comprueba ✓ si encaja.
          </p>
        </div>

        <form class="numeros-form" id="numeros-form">
          <input type="text" name="label" placeholder="Etiqueta (ej. Móvil mamá)" required>
          <input type="text" name="number" placeholder="Número (ej. 666123456)" required>
          <input type="text" name="association" placeholder="Asociación inverosímil">
          <button type="submit">Añadir</button>
        </form>

        ${state.entries.length === 0
          ? '<p class="empty">Aún no hay números. Añade uno arriba.</p>'
          : `
            <table class="numeros-table">
              <thead><tr><th>Etiqueta</th><th>Número</th><th>Asociación</th><th></th></tr></thead>
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
            <h3>Sin números todavía</h3>
            <p>Añade al menos uno en <strong>Lista</strong>.</p>
          </div>
        `;
      }
      const item = pickNextDue(items);
      const due = countDue(items);
      if (!item) {
        return `
          <div class="trainer-empty">
            <h3>Día completado</h3>
            <p>${items.length} números en total. Vuelve más tarde.</p>
          </div>
        `;
      }
      return `
        <div class="trainer-card">
          <div class="trainer-due">${due} pendiente${due === 1 ? '' : 's'}</div>
          <div class="trainer-prompt word">${escapeHtml(item.label)}</div>
          <div class="trainer-hint">¿Qué número?</div>
          ${
            revealed
              ? `
              <div class="pi-reveal">
                <div class="pi-reveal-digits">${escapeHtml(item.number)}</div>
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
      const form = root.querySelector<HTMLFormElement>('#numeros-form');
      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const label = String(data.get('label') ?? '').trim();
        const number = String(data.get('number') ?? '').trim();
        const association = String(data.get('association') ?? '').trim();
        if (label === '' || number === '') return;
        persist(addNumero(state, label, number, association));
        render();
      });

      root.querySelectorAll<HTMLButtonElement>('.del').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset['id'];
          if (!id) return;
          if (window.confirm('¿Eliminar este número?')) {
            persist(removeNumero(state, id));
            render();
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
          const item = pickNextDue(state.entries);
          if (!item) return;
          withTransition(() => {
            persist(applyNumerosReview(state, item.id, rating));
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
