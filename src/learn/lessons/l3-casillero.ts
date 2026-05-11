import { clearSelection, getSelection, setSelection } from '../../core/casillero/state';
import type { Lesson, LessonHelpers } from '../types';

const FIRST_TEN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const lessonCasillero: Lesson = {
  id: 'l3-casillero',
  title: 'Tu primer casillero (1-10)',
  description: 'Elige una palabra para cada una de las 10 primeras casillas. Quedan persistidas.',
  estimatedMinutes: 10,

  mount(root: HTMLElement, helpers: LessonHelpers): void {
    const { preset, casilleroStore } = helpers.ctx;

    function render(): void {
      const state = casilleroStore.load(preset);
      const slots = preset.slots.filter((s) => FIRST_TEN.includes(s.position));
      const chosenCount = FIRST_TEN.filter(
        (pos) => getSelection(state, pos) !== undefined,
      ).length;
      const allChosen = chosenCount === FIRST_TEN.length;

      root.innerHTML = `
        <article class="lesson">
          <h3>${lessonCasillero.title}</h3>
          <p class="lesson-lead">
            El <strong>casillero</strong> es una serie de "estaciones" memorizadas en orden,
            cada una representada por un objeto visualizable. Las palabras NO son aleatorias:
            cada una se construye con las consonantes del Sistema Mayor que corresponden a su número.
          </p>
          <p>
            Por ejemplo, la casilla 1 → consonantes <em>t</em> o <em>d</em> → palabras como
            <em>té</em>, <em>tea</em>, <em>hada</em>. Tú eliges la que más te guste o construyes una propia.
          </p>

          <div class="progress">
            <div class="progress-bar"><div class="progress-fill" style="width:${(chosenCount / FIRST_TEN.length) * 100}%"></div></div>
            <span>${chosenCount} / ${FIRST_TEN.length}</span>
          </div>

          <div class="builder-grid">
            ${slots
              .map((slot) => {
                const sel = getSelection(state, slot.position);
                const chips = slot.options
                  .map((opt) => {
                    const active = sel && !sel.isCustom && sel.chosenWord === opt;
                    return `<button class="chip ${active ? 'active' : ''}"
                              data-pos="${slot.position}" data-word="${opt}">${opt}</button>`;
                  })
                  .join('');
                return `
                  <div class="slot ${sel ? 'done' : ''}">
                    <span class="pos">${String(slot.position).padStart(2, '0')}</span>
                    <div class="chips">${chips}</div>
                  </div>
                `;
              })
              .join('')}
          </div>

          ${
            allChosen
              ? `
                <p class="lesson-tip">
                  ¡Casillero base completo! Ve a la pestaña <strong>Entrenar</strong> para
                  drillar lo que acabas de elegir con repaso espaciado.
                </p>
              `
              : `
                <p class="lesson-tip">
                  Sigue eligiendo hasta completar las 10. Más adelante puedes ampliar a 100
                  desde la pestaña <strong>Construir</strong>.
                </p>
              `
          }

          <div class="lesson-actions">
            <button class="btn-secondary" id="lesson-back">← Volver</button>
            <button class="btn-primary" id="lesson-done" ${allChosen ? '' : 'disabled'}>
              ${allChosen ? 'Marcar completada' : 'Completa las 10 primero'}
            </button>
          </div>
        </article>
      `;

      root.querySelectorAll<HTMLButtonElement>('.chip').forEach((btn) => {
        btn.addEventListener('click', () => {
          const pos = Number(btn.dataset['pos']);
          const word = btn.dataset['word'] ?? '';
          if (Number.isNaN(pos) || !word) return;
          const current = casilleroStore.load(preset);
          const sel = getSelection(current, pos);
          const next =
            sel && !sel.isCustom && sel.chosenWord === word
              ? clearSelection(current, pos)
              : setSelection(current, pos, word, false);
          casilleroStore.save(next);
          render();
        });
      });

      root.querySelector<HTMLButtonElement>('#lesson-back')?.addEventListener('click', () => {
        helpers.goBack();
      });
      const done = root.querySelector<HTMLButtonElement>('#lesson-done');
      done?.addEventListener('click', () => {
        if (!done.disabled) {
          helpers.markComplete();
          helpers.goBack();
        }
      });
    }

    render();
  },
};
