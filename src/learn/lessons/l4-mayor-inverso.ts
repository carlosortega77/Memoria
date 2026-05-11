import type { Digit, Phoneme } from '../../core/encoders/major/types';
import { MAJOR_CAMPAYO } from '../../data/presets/major-campayo';
import type { Lesson, LessonHelpers } from '../types';

const TARGET_CORRECT_IN_ROW = 10;

interface PhonemeQuestion {
  readonly phoneme: Phoneme;
  readonly digit: Digit;
}

function buildPhonemeQuestions(): readonly PhonemeQuestion[] {
  const out: PhonemeQuestion[] = [];
  for (const [digitStr, phonemes] of Object.entries(MAJOR_CAMPAYO.mapping)) {
    const digit = Number(digitStr) as Digit;
    for (const p of phonemes) {
      out.push({ phoneme: p, digit });
    }
  }
  return out;
}

function pickRandom(qs: readonly PhonemeQuestion[]): PhonemeQuestion {
  return qs[Math.floor(Math.random() * qs.length)]!;
}

export const lessonMayorInverso: Lesson = {
  id: 'l4-mayor-inverso',
  title: 'La tabla Mayor — al revés',
  description:
    'Codificas palabras en dígitos sin pensar. Es el paso previo a fabricar palabras-imagen.',
  estimatedMinutes: 8,

  mount(root: HTMLElement, helpers: LessonHelpers): void {
    const questions = buildPhonemeQuestions();
    let current: PhonemeQuestion = pickRandom(questions);
    let streak = 0;
    let lastResult: 'ok' | 'fail' | null = null;

    function checkAnswer(input: string): void {
      const ans = input.trim();
      const ansNum = Number(ans);
      if (!/^\d$/.test(ans) || Number.isNaN(ansNum)) {
        lastResult = 'fail';
        renderQuiz();
        return;
      }
      if (ansNum === current.digit) {
        streak += 1;
        lastResult = 'ok';
        if (streak >= TARGET_CORRECT_IN_ROW) {
          renderDone();
          return;
        }
        current = pickRandom(questions);
        renderQuiz();
      } else {
        streak = 0;
        lastResult = 'fail';
        renderQuiz();
      }
    }

    function renderQuiz(): void {
      const pct = Math.round((streak / TARGET_CORRECT_IN_ROW) * 100);
      const validDigitForCurrent = String(current.digit);

      root.innerHTML = `
        <article class="lesson">
          <h3>${lessonMayorInverso.title}</h3>
          <p class="lesson-lead">
            En la lección anterior viste <strong>dígito → consonantes</strong>. Ahora al revés: ves una consonante y escribes el dígito. Es el músculo que necesitas para leer palabras como números.
          </p>

          <div class="quiz">
            <div class="quiz-progress">
              <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
              <span>${streak} / ${TARGET_CORRECT_IN_ROW} aciertos seguidos</span>
            </div>

            <div class="quiz-prompt">
              <div class="quiz-digit quiz-phoneme">${current.phoneme.toUpperCase()}</div>
              <div class="quiz-hint">¿Qué dígito?</div>
            </div>

            <form id="quiz-form" autocomplete="off">
              <input type="text" id="quiz-input" inputmode="numeric" pattern="[0-9]" maxlength="1" placeholder="0-9" autofocus>
              <button type="submit">Comprobar</button>
            </form>

            ${
              lastResult === 'ok'
                ? `<p class="quiz-feedback ok">✓ Correcto</p>`
                : lastResult === 'fail'
                  ? `<p class="quiz-feedback fail">✗ Era: <strong>${validDigitForCurrent}</strong>. Inténtalo otra vez.</p>`
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
    }

    function renderDone(): void {
      root.innerHTML = `
        <article class="lesson lesson-celebrate">
          <h3>10 seguidas — codificas leyendo</h3>
          <p>
            Ya no necesitas mirar la tabla. Ves una palabra y tu cabeza extrae los dígitos sola.
            Eso es el paso previo a la siguiente lección: <strong>fabricar palabras-imagen</strong> a partir
            de un número dado. Es el músculo central del método.
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
