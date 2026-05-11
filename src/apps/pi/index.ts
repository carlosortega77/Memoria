import type { AppContext, MemoriaApp } from '../../core/app-contract';
import { getSelection } from '../../core/casillero/state';
import { countDue, pickNextDue } from '../../core/training/drill-loop';
import type { Rating } from '../../core/spaced-repetition/sm2';
import { getPairs } from './digits';
import { createPiStore, type PiStore } from './store';
import { withTransition } from '../../ui/transitions';
import {
  applyPiReview,
  clearAssociation,
  getAssociation,
  setAssociationText,
  type PiState,
} from './state';

type View = 'lista' | 'drill';

interface EffectiveWord {
  readonly word: string;
  readonly isUserChoice: boolean;
}

function getEffectiveWord(ctx: AppContext, position: number): EffectiveWord | null {
  const user = ctx.casilleroStore.load(ctx.preset);
  const sel = getSelection(user, position);
  if (sel) return { word: sel.chosenWord, isUserChoice: true };

  const slot = ctx.preset.slots.find((s) => s.position === position);
  if (!slot || slot.options.length === 0) return null;
  const first = slot.options[0];
  if (!first) return null;
  return { word: first, isUserChoice: false };
}

export const piApp: MemoriaApp = {
  id: 'pi',
  route: 'pi',
  name: 'π',
  description: 'Primeros 200 dígitos en 100 pares.',
  contentKind: 'digit-stream',

  mount(root: HTMLElement, ctx: AppContext): void {
    const store: PiStore = createPiStore(ctx.storage);
    const pairs = getPairs();
    let state: PiState = store.load();
    let view: View = 'lista';
    let revealed = false;

    function persist(next: PiState): void {
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
      const totalDone = state.associations.length;
      const total = pairs.length;
      const pct = Math.round((totalDone / total) * 100);

      const rows = pairs
        .map((p) => {
          const station = getEffectiveWord(ctx, p.index + 1);
          const image = getEffectiveWord(ctx, p.value);
          const assoc = getAssociation(state, p.index);
          const stationLabel = station
            ? `<span class="pi-word${station.isUserChoice ? '' : ' fallback'}">${station.word}</span>`
            : `<span class="pi-word missing">—</span>`;
          const imageLabel = image
            ? `<span class="pi-word${image.isUserChoice ? '' : ' fallback'}">${image.word}</span>`
            : `<span class="pi-word missing">—</span>`;
          return `
            <div class="pi-row ${assoc ? 'done' : ''}">
              <div class="pi-head">
                <span class="pi-idx">${String(p.index + 1).padStart(3, '0')}</span>
                <span class="pi-digits">${p.digits}</span>
              </div>
              <div class="pi-words">
                ${stationLabel}
                <span class="pi-arrow">·</span>
                ${imageLabel}
              </div>
              <input
                type="text"
                class="pi-assoc"
                placeholder="Escena inverosímil…"
                data-pair="${p.index}"
                value="${assoc ? assoc.text.replaceAll('"', '&quot;') : ''}"
              />
            </div>
          `;
        })
        .join('');

      return `
        <details class="how-it-works">
          <summary>Cómo funciona</summary>
          <p>
            Cada par de dígitos va a una <strong>estación</strong> del casillero (su posición en orden) y se "ve" como la <strong>imagen</strong> del valor (la palabra del casillero para ese número). Crea una escena inverosímil que una estación e imagen.
          </p>
          <p class="pi-fallback-note">
            Las palabras en <em>cursiva</em> son del preset (no las has elegido aún en Construir).
          </p>
        </details>
        <div class="progress">
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          <span>${totalDone} / ${total}</span>
        </div>
        <div class="pi-grid">${rows}</div>
      `;
    }

    function renderDrill(): string {
      const items = state.associations;
      if (items.length === 0) {
        return `
          <div class="trainer-empty">
            <h3>Sin asociaciones todavía</h3>
            <p>Vuelve a <strong>Lista</strong> y escribe al menos una escena.</p>
          </div>
        `;
      }
      const item = pickNextDue(items);
      const due = countDue(items);

      if (!item) {
        return `
          <div class="trainer-empty">
            <h3>Día completado</h3>
            <p>No hay asociaciones que repasar ahora.</p>
            <p class="trainer-stats">${items.length} asociaciones en total.</p>
          </div>
        `;
      }
      const pair = pairs[item.pairIndex];
      if (!pair) return '<p class="empty">Pair fuera de rango.</p>';

      const station = getEffectiveWord(ctx, pair.index + 1);
      const image = getEffectiveWord(ctx, pair.value);

      return `
        <div class="trainer-card">
          <div class="trainer-due">${due} pendiente${due === 1 ? '' : 's'}</div>
          <div class="trainer-prompt word">${station?.word ?? '—'}</div>
          <div class="trainer-hint">Estación ${pair.index + 1}. ¿Qué viene aquí?</div>
          ${
            revealed
              ? `
            <div class="pi-reveal">
              <div class="pi-reveal-digits">${pair.digits}</div>
              <div class="pi-reveal-image">${image?.word ?? '—'}</div>
              <div class="pi-reveal-assoc">${item.text}</div>
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
      root.querySelectorAll<HTMLInputElement>('.pi-assoc').forEach((input) => {
        input.addEventListener('change', () => {
          const idx = Number(input.dataset['pair']);
          if (Number.isNaN(idx)) return;
          const text = input.value.trim();
          if (text === '') {
            persist(clearAssociation(state, idx));
          } else {
            persist(setAssociationText(state, idx, text));
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
          const item = pickNextDue(state.associations);
          if (!item) return;
          withTransition(() => {
            persist(applyPiReview(state, item.id, rating));
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
