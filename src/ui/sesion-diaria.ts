import type { CasilleroPreset } from '../core/casillero/types';
import type { CasilleroStore } from '../core/casillero/store';
import type { TrainerStore } from '../core/training/store';
import { getSelection, type UserCasillero } from '../core/casillero/state';
import { createChronometer, formatElapsed } from '../core/training/chronometer';
import { MAJOR_CAMPAYO } from '../data/presets/major-campayo';
import type { Digit } from '../core/encoders/major/types';
import { mountMajorTrainer } from './major-trainer';
import { withTransition } from './transitions';

type Phase = 'landing' | 'calentamiento' | 'bloque' | 'cierre';

const CALENTAMIENTO_QUESTIONS = 10;
const CIERRE_QUESTIONS = 5;

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function mountSesionDiaria(
  root: HTMLElement,
  preset: CasilleroPreset,
  casilleroStore: CasilleroStore,
  trainerStore: TrainerStore,
): void {
  let phase: Phase = 'landing';

  function render(): void {
    switch (phase) {
      case 'landing':
        renderLanding();
        break;
      case 'calentamiento':
        renderCalentamiento();
        break;
      case 'bloque':
        renderBloque();
        break;
      case 'cierre':
        renderCierre();
        break;
    }
  }

  function renderLanding(): void {
    root.innerHTML = `
      <div class="sesion-diaria">
        <header class="sesion-header">
          <h3>Sesión diaria</h3>
          <p>15 minutos al día — la rutina de Campayo adaptada. Cuatro fases en orden. Hazlas todas o las que tengas tiempo.</p>
        </header>
        <ol class="sesion-phases">
          <li class="sesion-phase" data-phase="calentamiento">
            <div class="dp-num">I</div>
            <div class="dp-body">
              <h4>Calentamiento</h4>
              <p>10 challenges aleatorios de tabla Mayor cronometrados — directo + inverso.</p>
              <small>≈ 2 min</small>
            </div>
            <button class="dp-go" data-phase="calentamiento">Empezar</button>
          </li>
          <li class="sesion-phase" data-phase="construccion">
            <div class="dp-num">II</div>
            <div class="dp-body">
              <h4>Construcción</h4>
              <p>Fabrica 3 palabras-imagen cronometradas. Vas al modo flash de la lección.</p>
              <small>≈ 3 min</small>
            </div>
            <a class="dp-go" href="#/learn">Abrir Lección →</a>
          </li>
          <li class="sesion-phase" data-phase="bloque">
            <div class="dp-num">III</div>
            <div class="dp-body">
              <h4>Bloque del día</h4>
              <p>Drilla tu casillero con spaced repetition. Las casillas vencidas hoy.</p>
              <small>≈ 7 min</small>
            </div>
            <button class="dp-go" data-phase="bloque">Empezar</button>
          </li>
          <li class="sesion-phase" data-phase="cierre">
            <div class="dp-num">IV</div>
            <div class="dp-body">
              <h4>Cierre ritual</h4>
              <p>Recuperación en frío de 5 casillas aleatorias. Sin pistas, cronómetro corre.</p>
              <small>≈ 3 min</small>
            </div>
            <button class="dp-go" data-phase="cierre">Empezar</button>
          </li>
        </ol>
      </div>
    `;
    root.querySelectorAll<HTMLButtonElement>('button.dp-go').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = btn.dataset['phase'] as Phase | undefined;
        if (!p) return;
        withTransition(() => {
          phase = p;
          render();
        });
      });
    });
  }

  // ---------- FASE 1: CALENTAMIENTO ----------
  function renderCalentamiento(): void {
    interface Q {
      type: 'd-to-c' | 'c-to-d';
      digit?: Digit;
      consonant?: string;
      acceptedAnswers: readonly string[];
    }

    const questions: Q[] = [];
    for (let i = 0; i < CALENTAMIENTO_QUESTIONS; i++) {
      const direct = Math.random() < 0.5;
      if (direct) {
        const digit = Math.floor(Math.random() * 10) as Digit;
        questions.push({
          type: 'd-to-c',
          digit,
          acceptedAnswers: MAJOR_CAMPAYO.mapping[digit].map((c) => c.toLowerCase()),
        });
      } else {
        const digit = Math.floor(Math.random() * 10) as Digit;
        const consonants = MAJOR_CAMPAYO.mapping[digit];
        const consonant = pickRandom(consonants);
        questions.push({
          type: 'c-to-d',
          consonant,
          acceptedAnswers: [String(digit)],
        });
      }
    }

    let qIndex = 0;
    let correct = 0;
    const chrono = createChronometer();
    let lastFeedback: 'idle' | 'ok' | 'fail' = 'idle';
    let lastTry = '';
    let liveHandle: number | null = null;
    chrono.start();

    function stopLive(): void {
      if (liveHandle !== null) {
        window.clearInterval(liveHandle);
        liveHandle = null;
      }
    }

    function startLive(): void {
      stopLive();
      liveHandle = window.setInterval(() => {
        const el = root.querySelector<HTMLSpanElement>('#cal-chrono');
        if (el) el.textContent = formatElapsed(chrono.elapsed());
      }, 100);
    }

    function renderQ(): void {
      stopLive();
      if (qIndex >= questions.length) {
        const total = chrono.stop();
        renderResult(total, correct);
        return;
      }
      const q = questions[qIndex]!;
      const prompt =
        q.type === 'd-to-c'
          ? `<div class="quiz-digit">${q.digit}</div><div class="quiz-hint">¿Consonante?</div>`
          : `<div class="quiz-digit quiz-phoneme">${q.consonant!.toUpperCase()}</div><div class="quiz-hint">¿Dígito?</div>`;
      const feedback =
        lastFeedback === 'ok'
          ? `<p class="quiz-feedback ok">✓ ${lastTry}</p>`
          : lastFeedback === 'fail'
            ? `<p class="quiz-feedback fail">✗ Era: <strong>${q.acceptedAnswers[0]}</strong></p>`
            : '';

      root.innerHTML = `
        <div class="sesion-runner">
          <header class="sesion-runner-head">
            <span class="drh-label">Calentamiento</span>
            <span class="drh-progress">${qIndex + 1} / ${questions.length}</span>
            <span class="drh-score">${correct} ✓</span>
            <span class="drh-chrono"><span id="cal-chrono">${formatElapsed(chrono.elapsed())}</span></span>
          </header>
          <div class="quiz">
            <div class="quiz-prompt">${prompt}</div>
            <form id="cal-form" autocomplete="off">
              <input type="text" id="cal-input" maxlength="3" placeholder="…" autofocus>
              <button type="submit">→</button>
            </form>
            ${feedback}
          </div>
          <div class="lesson-actions">
            <button class="btn-secondary" id="cal-abort">← Abandonar</button>
          </div>
        </div>
      `;
      startLive();
      root.querySelector<HTMLButtonElement>('#cal-abort')?.addEventListener('click', () => {
        stopLive();
        phase = 'landing';
        render();
      });
      const form = root.querySelector<HTMLFormElement>('#cal-form');
      const input = root.querySelector<HTMLInputElement>('#cal-input');
      input?.focus();
      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const v = (input?.value ?? '').trim().toLowerCase();
        if (!v) return;
        lastTry = v;
        const cur = questions[qIndex]!;
        const ok = cur.acceptedAnswers.includes(v);
        if (ok) {
          correct += 1;
          lastFeedback = 'ok';
        } else {
          lastFeedback = 'fail';
        }
        qIndex += 1;
        renderQ();
      });
    }

    function renderResult(totalMs: number, correctCount: number): void {
      const pct = Math.round((correctCount / questions.length) * 100);
      root.innerHTML = `
        <div class="sesion-result">
          <h3>Calentamiento completado</h3>
          <div class="result-stats">
            <div class="rs-item"><span class="rs-label">Tiempo total</span><span class="rs-value">${formatElapsed(totalMs)}</span></div>
            <div class="rs-item"><span class="rs-label">Aciertos</span><span class="rs-value">${correctCount} / ${questions.length}</span></div>
            <div class="rs-item"><span class="rs-label">Precisión</span><span class="rs-value">${pct}%</span></div>
          </div>
          <div class="lesson-actions">
            <button class="btn-secondary" id="back">← Volver</button>
            <button class="btn-primary" id="next-phase" data-next="bloque">Siguiente: Bloque →</button>
          </div>
        </div>
      `;
      root.querySelector<HTMLButtonElement>('#back')?.addEventListener('click', () => {
        phase = 'landing';
        render();
      });
      root.querySelector<HTMLButtonElement>('#next-phase')?.addEventListener('click', () => {
        phase = 'bloque';
        render();
      });
    }

    renderQ();
  }

  // ---------- FASE 3: BLOQUE DEL DÍA ----------
  function renderBloque(): void {
    root.innerHTML = `
      <div class="sesion-runner-wrap">
        <header class="sesion-runner-head simple">
          <span class="drh-label">Bloque del día — drill del casillero</span>
          <button class="btn-secondary" id="bloque-back">← Volver</button>
        </header>
        <div id="bloque-mount"></div>
      </div>
    `;
    root.querySelector<HTMLButtonElement>('#bloque-back')?.addEventListener('click', () => {
      phase = 'landing';
      render();
    });
    const mount = root.querySelector<HTMLDivElement>('#bloque-mount');
    if (mount) {
      mountMajorTrainer(mount, preset, casilleroStore, trainerStore);
    }
  }

  // ---------- FASE 4: CIERRE RITUAL ----------
  function renderCierre(): void {
    const user: UserCasillero = casilleroStore.load(preset);
    const valid = user.selections.filter((s) => s.position >= 1 && s.position <= 100);
    if (valid.length < CIERRE_QUESTIONS) {
      root.innerHTML = `
        <div class="trainer-empty">
          <h3>Necesitas al menos ${CIERRE_QUESTIONS} casillas</h3>
          <p>Ve a <strong>Construir</strong> y elige al menos ${CIERRE_QUESTIONS} palabras antes del cierre ritual.</p>
          <div class="lesson-actions">
            <button class="btn-secondary" id="cierre-back">← Volver</button>
          </div>
        </div>
      `;
      root.querySelector<HTMLButtonElement>('#cierre-back')?.addEventListener('click', () => {
        phase = 'landing';
        render();
      });
      return;
    }

    // Selecciona 5 al azar
    const shuffled = [...valid].sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, CIERRE_QUESTIONS);
    const directions: ('n2w' | 'w2n')[] = picks.map(() => (Math.random() < 0.5 ? 'n2w' : 'w2n'));

    let qIndex = 0;
    let correct = 0;
    const chrono = createChronometer();
    let lastFeedback: 'idle' | 'ok' | 'fail' = 'idle';
    let lastTry = '';
    let liveHandle: number | null = null;
    chrono.start();

    function stopLive(): void {
      if (liveHandle !== null) {
        window.clearInterval(liveHandle);
        liveHandle = null;
      }
    }
    function startLive(): void {
      stopLive();
      liveHandle = window.setInterval(() => {
        const el = root.querySelector<HTMLSpanElement>('#cierre-chrono');
        if (el) el.textContent = formatElapsed(chrono.elapsed());
      }, 100);
    }

    function normalize(s: string): string {
      return s
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
    }

    function renderQ(): void {
      stopLive();
      if (qIndex >= picks.length) {
        const total = chrono.stop();
        renderResult(total, correct);
        return;
      }
      const pick = picks[qIndex]!;
      const dir = directions[qIndex]!;
      const expected = dir === 'n2w' ? pick.chosenWord : String(pick.position);
      const promptHtml =
        dir === 'n2w'
          ? `<div class="quiz-digit">${String(pick.position).padStart(2, '0')}</div><div class="quiz-hint">¿Palabra?</div>`
          : `<div class="quiz-digit quiz-phoneme">${pick.chosenWord}</div><div class="quiz-hint">¿Casilla?</div>`;
      const feedback =
        lastFeedback === 'ok'
          ? `<p class="quiz-feedback ok">✓ ${lastTry}</p>`
          : lastFeedback === 'fail'
            ? `<p class="quiz-feedback fail">✗ Era: <strong>${expected}</strong></p>`
            : '';

      root.innerHTML = `
        <div class="sesion-runner">
          <header class="sesion-runner-head">
            <span class="drh-label">Cierre ritual</span>
            <span class="drh-progress">${qIndex + 1} / ${picks.length}</span>
            <span class="drh-score">${correct} ✓</span>
            <span class="drh-chrono"><span id="cierre-chrono">${formatElapsed(chrono.elapsed())}</span></span>
          </header>
          <div class="quiz">
            <div class="quiz-prompt">${promptHtml}</div>
            <form id="cierre-form" autocomplete="off">
              <input type="text" id="cierre-input" placeholder="…" autofocus>
              <button type="submit">→</button>
            </form>
            ${feedback}
          </div>
          <div class="lesson-actions">
            <button class="btn-secondary" id="cierre-abort">← Abandonar</button>
          </div>
        </div>
      `;
      startLive();
      root.querySelector<HTMLButtonElement>('#cierre-abort')?.addEventListener('click', () => {
        stopLive();
        phase = 'landing';
        render();
      });
      const form = root.querySelector<HTMLFormElement>('#cierre-form');
      const input = root.querySelector<HTMLInputElement>('#cierre-input');
      input?.focus();
      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const v = (input?.value ?? '').trim();
        if (!v) return;
        lastTry = v;
        const ok =
          dir === 'n2w'
            ? normalize(v) === normalize(expected)
            : v === expected || Number(v) === Number(expected);
        if (ok) {
          correct += 1;
          lastFeedback = 'ok';
        } else {
          lastFeedback = 'fail';
        }
        qIndex += 1;
        renderQ();
      });
    }

    function renderResult(totalMs: number, correctCount: number): void {
      const pct = Math.round((correctCount / picks.length) * 100);
      root.innerHTML = `
        <div class="sesion-result">
          <h3>Cierre completado</h3>
          <div class="result-stats">
            <div class="rs-item"><span class="rs-label">Tiempo total</span><span class="rs-value">${formatElapsed(totalMs)}</span></div>
            <div class="rs-item"><span class="rs-label">Aciertos</span><span class="rs-value">${correctCount} / ${picks.length}</span></div>
            <div class="rs-item"><span class="rs-label">Precisión</span><span class="rs-value">${pct}%</span></div>
          </div>
          <p class="cierre-coda">Has cerrado la rutina del día. Vuelve mañana.</p>
          <div class="lesson-actions">
            <button class="btn-primary" id="back">← Volver</button>
          </div>
        </div>
      `;
      root.querySelector<HTMLButtonElement>('#back')?.addEventListener('click', () => {
        phase = 'landing';
        render();
      });
    }

    renderQ();
  }

  // Para uso por suppress no usado del void parameter en typescript strict
  void getSelection;

  render();
}
