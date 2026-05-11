import type { Digit } from '../../core/encoders/major/types';
import { MAJOR_CAMPAYO } from '../../data/presets/major-campayo';
import type { Lesson, LessonHelpers } from '../types';

const DIGITS: Digit[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const TARGET_CORRECT_IN_ROW = 10;

function pickRandomDigit(): Digit {
  return DIGITS[Math.floor(Math.random() * DIGITS.length)]!;
}

export const lessonMayor: Lesson = {
  id: 'l2-mayor',
  title: 'La tabla del Sistema Mayor',
  description: 'Memoriza el mapeo dígito → consonante. Te quizeamos hasta 10 aciertos seguidos.',
  estimatedMinutes: 10,

  mount(root: HTMLElement, helpers: LessonHelpers): void {
    let current: Digit = pickRandomDigit();
    let streak = 0;
    let lastResult: 'ok' | 'fail' | null = null;
    let revealed = false;

    function checkAnswer(input: string): void {
      const valid = MAJOR_CAMPAYO.mapping[current].map((p) => p.toLowerCase());
      const ans = input.trim().toLowerCase();
      if (valid.includes(ans)) {
        streak += 1;
        lastResult = 'ok';
        if (streak >= TARGET_CORRECT_IN_ROW) {
          renderDone();
          return;
        }
        current = pickRandomDigit();
        revealed = false;
        renderQuiz();
      } else {
        streak = 0;
        lastResult = 'fail';
        revealed = true;
        renderQuiz();
      }
    }

    function renderQuiz(): void {
      const pct = Math.round((streak / TARGET_CORRECT_IN_ROW) * 100);
      const valid = MAJOR_CAMPAYO.mapping[current].join(', ');

      root.innerHTML = `
        <article class="lesson">
          <h3>${lessonMayor.title}</h3>
          <p class="lesson-lead">
            Memoriza esta tabla. Cada dígito tiene una o varias consonantes asociadas.
            Las vocales son relleno libre (no codifican).
          </p>

          <table class="mapping-table">
            ${DIGITS.map(
              (d) => `
              <tr class="${d === current ? 'current' : ''}">
                <td class="digit">${d}</td>
                <td>${MAJOR_CAMPAYO.mapping[d].join(', ')}</td>
              </tr>
            `,
            ).join('')}
          </table>

          <div class="quiz">
            <div class="quiz-progress">
              <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
              <span>${streak} / ${TARGET_CORRECT_IN_ROW} aciertos seguidos</span>
            </div>

            <div class="quiz-prompt">
              <div class="quiz-digit">${current}</div>
              <div class="quiz-hint">¿Qué consonante(s)?</div>
            </div>

            <form id="quiz-form" autocomplete="off">
              <input type="text" id="quiz-input" placeholder="Escribe la consonante" autofocus>
              <button type="submit">Comprobar</button>
            </form>

            ${
              lastResult === 'ok'
                ? `<p class="quiz-feedback ok">✓ Correcto</p>`
                : lastResult === 'fail'
                  ? `<p class="quiz-feedback fail">✗ Era: <strong>${valid}</strong>. Inténtalo otra vez.</p>`
                  : ''
            }
          </div>

          <div class="lesson-actions">
            <button class="btn-secondary" id="lesson-back">← Volver</button>
          </div>
        </article>
      `;

      const form = root.querySelector<HTMLFormElement>('#quiz-form');
      const input = root.querySelector<HTMLInputElement>('#quiz-input');
      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!input || input.value.trim() === '') return;
        checkAnswer(input.value);
      });
      input?.focus();

      root.querySelector<HTMLButtonElement>('#lesson-back')?.addEventListener('click', () => {
        helpers.goBack();
      });

      // Mantener visibilidad del valid si revealed
      if (revealed) {
        // input se borra solo al pasar a la siguiente
        if (input) input.value = '';
      }
    }

    function renderDone(): void {
      root.innerHTML = `
        <article class="lesson lesson-celebrate">
          <h3>¡10 seguidas! Tabla dominada</h3>
          <p>
            Acabas de internalizar el codificador del Sistema Mayor. Esto es la base de TODO lo
            que viene después: convertir cualquier número en una secuencia de consonantes,
            y de ahí a palabras visualizables.
          </p>
          <p>
            En la siguiente lección construirás tu primer <strong>casillero</strong>:
            las 10 primeras casillas donde guardarás lo que quieras memorizar.
          </p>
          <div class="lesson-actions">
            <button class="btn-primary" id="lesson-done">Marcar completada</button>
          </div>
        </article>
      `;
      root.querySelector<HTMLButtonElement>('#lesson-done')?.addEventListener('click', () => {
        helpers.markComplete();
        helpers.goBack();
      });
    }

    renderQuiz();
  },
};
