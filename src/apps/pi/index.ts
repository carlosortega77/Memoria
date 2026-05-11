import type { AppContext, MemoriaApp } from '../../core/app-contract';
import { getSelection } from '../../core/casillero/state';
import { countDue, pickNextDue } from '../../core/training/drill-loop';
import type { Rating } from '../../core/spaced-repetition/sm2';
import { getPairs, type PiPair } from './digits';
import { createPiStore, type PiStore } from './store';
import {
  applyPiReview,
  clearAssociation,
  getAssociation,
  setAssociationText,
  type PiState,
} from './state';
import { withTransition } from '../../ui/transitions';

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

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export const piApp: MemoriaApp = {
  id: 'pi',
  route: 'pi',
  name: 'π',
  description: 'Primeros 200 dígitos en 100 pares — método cadena.',
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
      // Solo hay enlaces para los primeros N-1 pares.
      const totalLinks = pairs.length - 1;
      const linksDone = state.associations.filter((a) => a.pairIndex < totalLinks).length;
      const pct = totalLinks > 0 ? Math.round((linksDone / totalLinks) * 100) : 0;

      const rows = pairs
        .map((p: PiPair, idx) => {
          const image = getEffectiveWord(ctx, p.value);
          const nextPair = pairs[idx + 1];
          const isLast = !nextPair;
          const nextImage = nextPair ? getEffectiveWord(ctx, nextPair.value) : null;
          const assoc = getAssociation(state, p.index);

          const imageLabel = image
            ? `<span class="pi-image-word${image.isUserChoice ? '' : ' fallback'}">${image.word}</span>`
            : `<span class="pi-image-word missing">—</span>`;
          const nextImageLabel = nextImage
            ? `<span class="pi-image-word small${nextImage.isUserChoice ? '' : ' fallback'}">${nextImage.word}</span>`
            : '<span class="pi-image-word small missing">—</span>';

          return `
            <div class="pi-chain-row ${assoc ? 'done' : ''} ${isLast ? 'last' : ''}">
              <div class="pi-pair-head">
                <span class="pi-idx">${String(p.index + 1).padStart(3, '0')}</span>
                <span class="pi-digits">${p.digits}</span>
                <span class="pi-arrow">→</span>
                ${imageLabel}
              </div>
              ${
                isLast
                  ? '<div class="pi-link-end">— fin de la cadena —</div>'
                  : `
                    <div class="pi-link-row">
                      <span class="pi-link-bridge">↳ enlace con ${nextImageLabel}</span>
                      <input
                        type="text"
                        class="pi-assoc"
                        placeholder="Escena inverosímil que une ${image?.word ?? '—'} con ${nextImage?.word ?? '—'}…"
                        data-pair="${p.index}"
                        value="${assoc ? assoc.text.replaceAll('"', '&quot;') : ''}"
                      />
                    </div>
                  `
              }
            </div>
          `;
        })
        .join('');

      return `
        <details class="how-it-works">
          <summary>Cómo funciona — método cadena</summary>
          <p>π se memoriza por <strong>pares</strong> en orden. Cada par tiene una palabra-imagen (la de tu casillero en el valor del par). Las escenas <strong>encadenan</strong> la imagen actual con la del par siguiente.</p>
          <p>Ejemplo: par 1 vale <code>14</code> → imagen <strong>taco</strong>. Par 2 vale <code>15</code> → imagen <strong>tela</strong>. La escena: "Un taco gigante se rasga la tela del mantel mientras le caen cebollas encima". Luego "tela" encadena con la imagen del par 3, y así sucesivamente. Recitar π = caminar la cadena.</p>
        </details>

        <div class="progress">
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          <span>${linksDone} / ${totalLinks}</span>
        </div>

        <div class="assoc-criteria" aria-label="Criterios para una buena asociación">
          <span class="ac-title">Una buena escena</span>
          <span class="ac-tags">vívida · en movimiento · multisensorial · inverosímil</span>
        </div>

        <div class="pi-chain">${rows}</div>
      `;
    }

    function renderDrill(): string {
      const items = state.associations;
      if (items.length === 0) {
        return `
          <div class="trainer-empty">
            <h3>Sin enlaces todavía</h3>
            <p>Vuelve a <strong>Lista</strong> y escribe al menos un enlace entre dos pares consecutivos.</p>
          </div>
        `;
      }
      const item = pickNextDue(items);
      const due = countDue(items);

      if (!item) {
        return `
          <div class="trainer-empty">
            <h3>Día completado</h3>
            <p>No hay enlaces que repasar ahora.</p>
            <p class="trainer-stats">${items.length} enlaces en total.</p>
          </div>
        `;
      }
      const pair = pairs[item.pairIndex];
      const nextPair = pair ? pairs[item.pairIndex + 1] : undefined;
      if (!pair || !nextPair) return '<p class="empty">Enlace fuera de rango.</p>';

      const image = getEffectiveWord(ctx, pair.value);
      const nextImage = getEffectiveWord(ctx, nextPair.value);

      return `
        <div class="trainer-card">
          <div class="trainer-due">${due} pendiente${due === 1 ? '' : 's'}</div>
          <div class="trainer-prompt word">${image?.word ?? '—'}</div>
          <div class="trainer-hint">Estás aquí. ¿Qué pareja viene después?</div>
          ${
            revealed
              ? `
            <div class="pi-reveal">
              <div class="pi-reveal-digits">${nextPair.digits}</div>
              <div class="pi-reveal-image">${nextImage?.word ?? '—'}</div>
              <div class="pi-reveal-assoc">${escapeHtml(item.text)}</div>
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
