import type { AppContext, MemoriaApp } from '../../core/app-contract';
import { countDue, pickNextDue } from '../../core/training/drill-loop';
import type { Rating } from '../../core/spaced-repetition/sm2';
import { createNumerosStore, type NumerosStore } from './store';
import {
  addNumero,
  applyNumerosReview,
  getEntryById,
  removeNumero,
  type NumeroEntry,
  type NumerosState,
} from './state';
import {
  TYPE_METAS,
  diffDigits,
  digitsOnly,
  formatVisual,
  metaFor,
  type NumeroType,
} from './formats';
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
    let selectedType: NumeroType = 'movil';

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

    function renderTypePicker(): string {
      return `
        <div class="type-picker" role="tablist">
          ${TYPE_METAS.map(
            (m) => `
            <button class="type-pill ${selectedType === m.id ? 'active' : ''}"
                    data-type="${m.id}" type="button" role="tab">${m.label}</button>
          `,
          ).join('')}
        </div>
      `;
    }

    function renderEncoderTheatre(): string {
      // El "teatro del codificador" — debajo del form, muestra en vivo cómo
      // la asociación va codificando los dígitos objetivo.
      return `
        <div class="encoder-theatre" id="encoder-theatre" data-empty="1">
          <div class="theatre-lane">
            <span class="theatre-label">Objetivo</span>
            <div class="theatre-digits target" id="theatre-target">— —</div>
          </div>
          <div class="theatre-lane">
            <span class="theatre-label">Tu asociación codifica</span>
            <div class="theatre-digits encoded" id="theatre-encoded">—</div>
          </div>
          <div class="theatre-status" id="theatre-status">Selecciona tipo y escribe un número arriba.</div>
        </div>
      `;
    }

    function renderEntryRow(e: NumeroEntry): string {
      const meta = metaFor(e.type);
      const target = digitsOnly(e.number);
      const encoded = ctx.encoder.encode(e.association).join('');
      const ok = encoded.length > 0 && encoded === target;
      const partial = encoded.length > 0 && !ok;
      const displayNumber = formatVisual(e.number, e.type);
      return `
        <tr class="${ok ? 'ok' : partial ? 'partial' : ''}">
          <td class="type-cell"><span class="type-chip">${meta.label}</span></td>
          <td class="label">${escapeHtml(e.label)}</td>
          <td class="number">${escapeHtml(displayNumber)}</td>
          <td class="assoc">
            ${e.association ? escapeHtml(e.association) : '<span class="assoc-empty">—</span>'}
            ${ok
              ? '<span class="encoder-ok">✓ codifica</span>'
              : partial
                ? `<span class="encoder-partial">codifica → ${encoded}</span>`
                : ''}
          </td>
          <td class="actions">
            <button class="del" data-id="${e.id}" aria-label="Eliminar">×</button>
          </td>
        </tr>
      `;
    }

    function renderLista(): string {
      const meta = metaFor(selectedType);
      const rows = state.entries.map((e) => renderEntryRow(e)).join('');

      return `
        <details class="how-it-works">
          <summary>Cómo funciona — con ejemplo</summary>

          <p>Un número largo (un IBAN, un móvil) no se puede memorizar dígito a dígito. La técnica lo trocea en <strong>pares</strong> y cada par lo convierte en una palabra-imagen de tu casillero.</p>

          <ol class="how-steps">
            <li>
              <strong>Elige el tipo.</strong> El número se muestra con su formato canónico — los grupos visuales (3-2-2-2 en móvil, 4-4-4-4 en IBAN, 8+letra en DNI) <em>ya</em> son parte de la mnemotécnica: tu cerebro recuerda mejor los bloques.
            </li>
            <li>
              <strong>Trocea en pares.</strong> Cada par de dígitos se corresponde con una casilla del casillero (las que elegiste en <strong>Construir</strong>).
              <div class="how-example">
                DNI <code>12 34 56 78</code> → casilla 12 (<strong>tuna</strong>) · casilla 34 (<strong>moco</strong>) · casilla 56 (<strong>lazo</strong>) · casilla 78 (<strong>ficha</strong>)
              </div>
            </li>
            <li>
              <strong>Construye una escena inverosímil</strong> que enlace tu etiqueta con las palabras-imagen en orden.
              <div class="how-example">
                <em>Etiqueta: "Mi DNI":</em> "Saco mi DNI de una <strong>tuna</strong> rebosante de <strong>mocos</strong>, lo rodea un <strong>lazo</strong> rojo y al final está pegado a una <strong>ficha</strong> de casino."
              </div>
            </li>
          </ol>

          <p class="how-coda">
            El <strong>teatro del codificador</strong> debajo del formulario te valida en directo: escribe la asociación y verás dígito a dígito qué consonantes Mayor está produciendo tu texto. Los dígitos que aciertas se encienden en ámbar. Los que no cuadran aparecen subrayados en rojo. Cuando todos los dígitos coinciden, el codificador te lo confirma.
          </p>
        </details>

        ${renderTypePicker()}

        <form class="numeros-form" id="numeros-form">
          <input type="text" name="label" placeholder="${escapeHtml(meta.labelPlaceholder)}" required autocomplete="off">
          <input type="text" name="number" placeholder="${escapeHtml(meta.placeholder)}" required autocomplete="off">
          <input type="text" name="association" placeholder="Asociación inverosímil" autocomplete="off">
          <button type="submit">Añadir</button>
        </form>

        ${renderEncoderTheatre()}

        ${state.entries.length === 0
          ? '<p class="empty">Aún no hay números. Añade uno arriba.</p>'
          : `
            <table class="numeros-table">
              <thead><tr><th>Tipo</th><th>Etiqueta</th><th>Número</th><th>Asociación</th><th></th></tr></thead>
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
            <h3>Sin números todavía</h3>
            <p>Añade al menos uno en <strong>Lista</strong> para empezar a drillar.</p>
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
      const entry = getEntryById(state, item.numeroId);
      if (!entry) return '<p class="empty">Entrada no encontrada.</p>';

      const display = formatVisual(entry.number, entry.type);
      const meta = metaFor(entry.type);
      const isLabelToNum = item.direction === 'l2n';

      const promptHtml = isLabelToNum
        ? `<div class="trainer-prompt word">${escapeHtml(entry.label)}</div>
           <div class="trainer-hint">¿Qué número? <span class="hint-meta">${meta.label} · etiqueta → número</span></div>`
        : `<div class="trainer-prompt num">${escapeHtml(display)}</div>
           <div class="trainer-hint">¿De qué es? <span class="hint-meta">${meta.label} · número → etiqueta</span></div>`;

      const revealHtml = isLabelToNum
        ? `<div class="pi-reveal-digits">${escapeHtml(display)}</div>
           ${entry.association ? `<div class="pi-reveal-assoc">${escapeHtml(entry.association)}</div>` : ''}`
        : `<div class="pi-reveal-image">${escapeHtml(entry.label)}</div>
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

    function updateEncoderTheatre(): void {
      const form = root.querySelector<HTMLFormElement>('#numeros-form');
      const target = root.querySelector<HTMLDivElement>('#theatre-target');
      const encodedEl = root.querySelector<HTMLDivElement>('#theatre-encoded');
      const status = root.querySelector<HTMLDivElement>('#theatre-status');
      const theatre = root.querySelector<HTMLDivElement>('#encoder-theatre');
      if (!form || !target || !encodedEl || !status || !theatre) return;

      const numberInput = form.elements.namedItem('number') as HTMLInputElement | null;
      const assocInput = form.elements.namedItem('association') as HTMLInputElement | null;
      const rawNumber = numberInput?.value ?? '';
      const targetDigits = digitsOnly(rawNumber);
      const assocText = assocInput?.value ?? '';
      const encodedDigits = ctx.encoder.encode(assocText).join('');

      if (targetDigits === '' && assocText.trim() === '') {
        theatre.dataset['empty'] = '1';
        target.textContent = '— —';
        encodedEl.textContent = '—';
        status.textContent = 'Selecciona tipo y escribe un número arriba.';
        return;
      }
      theatre.dataset['empty'] = '0';

      // Target: renderizar dígitos como pares con highlight según match
      const diff = diffDigits(encodedDigits, targetDigits);
      const targetHtml = diff
        .map((d) => {
          if (d.status === 'match') return `<span class="d match">${d.digit}</span>`;
          if (d.status === 'pending') return `<span class="d pending">${d.digit}</span>`;
          return `<span class="d mismatch">${d.digit}</span>`;
        })
        .join('');
      target.innerHTML = targetHtml || '— —';

      // Encoded: la string que la asociación produce
      encodedEl.textContent = encodedDigits || '—';

      // Status
      if (targetDigits === '') {
        status.textContent = 'Escribe el número objetivo arriba.';
      } else if (assocText.trim() === '') {
        status.innerHTML = `<span class="theatre-target-summary">Objetivo: <strong>${targetDigits}</strong> (${targetDigits.length} dígitos). Escribe una asociación que codifique a esto.</span>`;
      } else if (encodedDigits === targetDigits) {
        status.innerHTML = `<span class="theatre-ok">✓ La asociación codifica exactamente al número.</span>`;
      } else if (targetDigits.startsWith(encodedDigits)) {
        const remaining = targetDigits.length - encodedDigits.length;
        status.innerHTML = `<span class="theatre-progress">Vas bien — faltan <strong>${remaining}</strong> dígitos por encodear.</span>`;
      } else {
        status.innerHTML = `<span class="theatre-mismatch">Las consonantes Mayor de tu asociación no cuadran con el número objetivo.</span>`;
      }
    }

    function attachListaHandlers(): void {
      // Type pills
      root.querySelectorAll<HTMLButtonElement>('.type-pill').forEach((btn) => {
        btn.addEventListener('click', () => {
          const t = btn.dataset['type'] as NumeroType | undefined;
          if (!t || t === selectedType) return;
          withTransition(() => {
            selectedType = t;
            render();
          });
        });
      });

      const form = root.querySelector<HTMLFormElement>('#numeros-form');
      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const label = String(data.get('label') ?? '').trim();
        const number = String(data.get('number') ?? '').trim();
        const association = String(data.get('association') ?? '').trim();
        if (label === '' || number === '') return;
        withTransition(() => {
          persist(addNumero(state, selectedType, label, number, association));
          render();
        });
      });

      form?.addEventListener('input', updateEncoderTheatre);
      updateEncoderTheatre();

      root.querySelectorAll<HTMLButtonElement>('.del').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset['id'];
          if (!id) return;
          if (window.confirm('¿Eliminar este número?')) {
            withTransition(() => {
              persist(removeNumero(state, id));
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
