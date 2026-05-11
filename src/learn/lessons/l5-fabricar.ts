import type { Digit } from '../../core/encoders/major/types';
import { createMajorEncoder } from '../../core/encoders/major/encoder';
import { MAJOR_CAMPAYO } from '../../data/presets/major-campayo';
import { createChronometer, formatElapsed } from '../../core/training/chronometer';
import type { Lesson, LessonHelpers } from '../types';

const STATS_KEY = 'learn:fabricar:stats';
const FLASH_SECONDS = 60;
const PRACTICE_TARGET = 5;

interface BuilderStats {
  bestFlashScore: number;
  flashSessions: number;
  fabricationsCompleted: number;
}

function emptyStats(): BuilderStats {
  return { bestFlashScore: 0, flashSessions: 0, fabricationsCompleted: 0 };
}

function loadStats(helpers: LessonHelpers): BuilderStats {
  return helpers.ctx.storage.get<BuilderStats>(STATS_KEY) ?? emptyStats();
}

function saveStats(helpers: LessonHelpers, s: BuilderStats): void {
  helpers.ctx.storage.set(STATS_KEY, s);
}

function randomNumber(digits: number): string {
  let out = '';
  for (let i = 0; i < digits; i++) {
    out += String(Math.floor(Math.random() * 10));
  }
  // Evita que empiece por 0 cuando son 3+ dígitos
  if (digits >= 3 && out[0] === '0') {
    out = String(1 + Math.floor(Math.random() * 9)) + out.slice(1);
  }
  return out;
}

function consonantPattern(digits: string): string {
  return digits
    .split('')
    .map((d) => {
      const n = Number(d) as Digit;
      return MAJOR_CAMPAYO.mapping[n].join('·').toUpperCase();
    })
    .join(' &nbsp;·&nbsp; ');
}

type Mode = 'intro' | 'practice' | 'flash-intro' | 'flash-run' | 'flash-done';

export const lessonFabricar: Lesson = {
  id: 'l5-fabricar',
  title: 'Fabricar palabra-imagen',
  description:
    'El músculo central. Te doy un número, fabricas una palabra que codifique. Termina con modo flash 60s.',
  estimatedMinutes: 12,

  mount(root: HTMLElement, helpers: LessonHelpers): void {
    const encoder = createMajorEncoder(MAJOR_CAMPAYO);
    let mode: Mode = 'intro';
    let stats = loadStats(helpers);

    // Práctica
    let practiceTarget: string = '';
    let practiceCompleted = 0;
    let practiceFeedback: 'idle' | 'ok' | 'fail' = 'idle';
    let practiceLastTry = '';
    let practiceLastEncoded = '';
    const practiceChrono = createChronometer();
    let practiceLastElapsed = 0;

    // Flash
    let flashScore = 0;
    let flashTarget = '';
    let flashSecondsLeft = FLASH_SECONDS;
    let flashInterval: number | null = null;

    function stopFlashInterval(): void {
      if (flashInterval !== null) {
        window.clearInterval(flashInterval);
        flashInterval = null;
      }
    }

    function nextPracticeTarget(): void {
      // 2-3 dígitos para empezar suave
      const len = Math.random() < 0.6 ? 2 : 3;
      practiceTarget = randomNumber(len);
      practiceFeedback = 'idle';
      practiceLastTry = '';
      practiceLastEncoded = '';
      practiceChrono.start();
    }

    function nextFlashTarget(): void {
      flashTarget = randomNumber(Math.random() < 0.7 ? 2 : 3);
    }

    function renderIntro(): string {
      return `
        <article class="lesson">
          <h3>${lessonFabricar.title}</h3>
          <p class="lesson-lead">
            Ahora la habilidad central. Te voy a dar un número, y tú vas a inventar una palabra cuyas consonantes Mayor coincidan exactamente con esos dígitos. Las vocales y la 'h' son libres.
          </p>
          <p>Ejemplo: <code>34</code> → 3 = M, 4 = C/K/Q → <strong>moco</strong>, <strong>maca</strong>, <strong>amaca</strong>, <strong>hamaca</strong> son todas válidas (M-C = 3-4).</p>
          <p>Primero <strong>práctica calmada</strong>: ${PRACTICE_TARGET} aciertos sin presión. Después <strong>modo flash</strong>: ${FLASH_SECONDS} segundos para fabricar todas las que puedas.</p>

          <div class="builder-stats">
            <div class="bs-item"><span class="bs-label">Mejor flash</span><span class="bs-value">${stats.bestFlashScore}</span></div>
            <div class="bs-item"><span class="bs-label">Sesiones flash</span><span class="bs-value">${stats.flashSessions}</span></div>
            <div class="bs-item"><span class="bs-label">Fabricaciones</span><span class="bs-value">${stats.fabricationsCompleted}</span></div>
          </div>

          <div class="lesson-actions">
            <button class="btn-secondary" id="lesson-back">← Volver</button>
            <button class="btn-primary" id="start-practice">Empezar práctica →</button>
          </div>
        </article>
      `;
    }

    function renderPractice(): string {
      const pattern = consonantPattern(practiceTarget);
      const elapsed = practiceChrono.elapsed();
      const feedback =
        practiceFeedback === 'ok'
          ? `<div class="fabricar-feedback ok">✓ <strong>${practiceLastTry}</strong> codifica ${practiceTarget}. Tiempo: ${formatElapsed(practiceLastElapsed)}</div>`
          : practiceFeedback === 'fail'
            ? `<div class="fabricar-feedback fail">✗ <strong>${practiceLastTry}</strong> codifica ${practiceLastEncoded || '(sin consonantes Mayor)'}, no ${practiceTarget}.</div>`
            : '';

      return `
        <article class="lesson">
          <h3>Práctica · ${practiceCompleted} / ${PRACTICE_TARGET}</h3>

          <div class="fabricar-card">
            <div class="fabricar-target">${practiceTarget}</div>
            <div class="fabricar-pattern">${pattern}</div>

            <form id="fabricar-form" autocomplete="off">
              <input type="text" id="fabricar-input" placeholder="escribe una palabra…" autofocus>
              <button type="submit">Comprobar</button>
            </form>

            <div class="chrono-live-row">
              <span class="chrono-live-label">Cronómetro</span>
              <span class="chrono-live" id="chrono-live">${formatElapsed(elapsed)}</span>
            </div>

            ${feedback}
          </div>

          <div class="lesson-actions">
            <button class="btn-secondary" id="lesson-back">← Salir</button>
          </div>
        </article>
      `;
    }

    function renderFlashIntro(): string {
      return `
        <article class="lesson lesson-celebrate">
          <h3>Práctica completada — ${PRACTICE_TARGET} aciertos</h3>
          <p>Ahora el reto de verdad: <strong>${FLASH_SECONDS} segundos</strong>. Te van a llover números. Por cada palabra-imagen válida, +1. Sin penalización por error, solo te como tiempo.</p>
          <p class="lesson-tip">El objetivo NO es batir el récord la primera vez. El objetivo es que repitas esto a diario hasta que tu cabeza haga la fabricación sin pensar. <strong>Eso es Doomsday-mode</strong>.</p>
          <div class="lesson-actions">
            <button class="btn-secondary" id="back-to-intro">← Volver</button>
            <button class="btn-primary" id="start-flash">Empezar 60s →</button>
          </div>
        </article>
      `;
    }

    function renderFlashRun(): string {
      const pattern = consonantPattern(flashTarget);
      const pct = (flashSecondsLeft / FLASH_SECONDS) * 100;
      return `
        <article class="lesson">
          <div class="flash-header">
            <span class="flash-score">${flashScore}</span>
            <div class="flash-clock">
              <div class="flash-bar"><div class="flash-bar-fill" style="width:${pct}%"></div></div>
              <span class="flash-seconds">${flashSecondsLeft}s</span>
            </div>
          </div>

          <div class="fabricar-card flash">
            <div class="fabricar-target">${flashTarget}</div>
            <div class="fabricar-pattern">${pattern}</div>

            <form id="flash-form" autocomplete="off">
              <input type="text" id="flash-input" placeholder="…" autofocus>
            </form>
            <p class="flash-hint">Enter para validar y saltar al siguiente.</p>
          </div>
        </article>
      `;
    }

    function renderFlashDone(): string {
      const isNewRecord = flashScore > stats.bestFlashScore;
      const beforeBest = stats.bestFlashScore;

      // Actualiza stats una sola vez
      stats = {
        bestFlashScore: Math.max(stats.bestFlashScore, flashScore),
        flashSessions: stats.flashSessions + 1,
        fabricationsCompleted: stats.fabricationsCompleted + flashScore,
      };
      saveStats(helpers, stats);

      const banner = isNewRecord
        ? `<div class="flash-record">🏆 Nuevo récord — anterior: ${beforeBest}</div>`
        : `<div class="flash-record-old">Mejor sesión: ${stats.bestFlashScore}</div>`;

      return `
        <article class="lesson lesson-celebrate">
          <h3>Flash terminado · ${flashScore} fabricaciones</h3>
          ${banner}
          <p class="lesson-lead">
            Has hecho ${flashScore} palabra${flashScore === 1 ? '' : 's'}-imagen en ${FLASH_SECONDS} segundos. ${flashScore < 5 ? 'Es solo el principio.' : flashScore < 10 ? 'Buen ritmo.' : 'Velocidad de combate.'}
          </p>
          <p>
            Este ejercicio gana valor con la repetición. Vuelve mañana. Pasado mañana. Hasta que fabricar una palabra-imagen sea tan automático como atarte los zapatos.
          </p>
          <div class="lesson-actions">
            <button class="btn-secondary" id="back-to-intro">← Volver</button>
            <button class="btn-primary" id="restart-flash">Otra ronda</button>
            <button class="btn-primary" id="mark-done">Marcar completada</button>
          </div>
        </article>
      `;
    }

    function render(): void {
      switch (mode) {
        case 'intro':
          root.innerHTML = renderIntro();
          break;
        case 'practice':
          root.innerHTML = renderPractice();
          break;
        case 'flash-intro':
          root.innerHTML = renderFlashIntro();
          break;
        case 'flash-run':
          root.innerHTML = renderFlashRun();
          break;
        case 'flash-done':
          root.innerHTML = renderFlashDone();
          break;
      }
      attachHandlers();
    }

    function attachHandlers(): void {
      root.querySelector<HTMLButtonElement>('#lesson-back')?.addEventListener('click', () => {
        stopFlashInterval();
        helpers.goBack();
      });

      root.querySelector<HTMLButtonElement>('#start-practice')?.addEventListener('click', () => {
        mode = 'practice';
        practiceCompleted = 0;
        nextPracticeTarget();
        render();
      });

      root.querySelector<HTMLButtonElement>('#back-to-intro')?.addEventListener('click', () => {
        stopFlashInterval();
        mode = 'intro';
        render();
      });

      root.querySelector<HTMLButtonElement>('#start-flash')?.addEventListener('click', () => {
        flashScore = 0;
        flashSecondsLeft = FLASH_SECONDS;
        nextFlashTarget();
        mode = 'flash-run';
        render();
        flashInterval = window.setInterval(() => {
          flashSecondsLeft -= 1;
          if (flashSecondsLeft <= 0) {
            stopFlashInterval();
            mode = 'flash-done';
            render();
            return;
          }
          const clock = root.querySelector<HTMLSpanElement>('.flash-seconds');
          const bar = root.querySelector<HTMLDivElement>('.flash-bar-fill');
          if (clock) clock.textContent = `${flashSecondsLeft}s`;
          if (bar) bar.style.width = `${(flashSecondsLeft / FLASH_SECONDS) * 100}%`;
        }, 1000);
      });

      root.querySelector<HTMLButtonElement>('#restart-flash')?.addEventListener('click', () => {
        flashScore = 0;
        flashSecondsLeft = FLASH_SECONDS;
        nextFlashTarget();
        mode = 'flash-run';
        render();
        flashInterval = window.setInterval(() => {
          flashSecondsLeft -= 1;
          if (flashSecondsLeft <= 0) {
            stopFlashInterval();
            mode = 'flash-done';
            render();
            return;
          }
          const clock = root.querySelector<HTMLSpanElement>('.flash-seconds');
          const bar = root.querySelector<HTMLDivElement>('.flash-bar-fill');
          if (clock) clock.textContent = `${flashSecondsLeft}s`;
          if (bar) bar.style.width = `${(flashSecondsLeft / FLASH_SECONDS) * 100}%`;
        }, 1000);
      });

      root.querySelector<HTMLButtonElement>('#mark-done')?.addEventListener('click', () => {
        helpers.markComplete();
        helpers.goBack();
      });

      // Práctica
      const practiceForm = root.querySelector<HTMLFormElement>('#fabricar-form');
      if (practiceForm) {
        const live = root.querySelector<HTMLSpanElement>('#chrono-live');
        let liveHandle: number | null = window.setInterval(() => {
          if (live) live.textContent = formatElapsed(practiceChrono.elapsed());
        }, 100);
        practiceForm.addEventListener('submit', (e) => {
          e.preventDefault();
          if (liveHandle !== null) {
            window.clearInterval(liveHandle);
            liveHandle = null;
          }
          const input = practiceForm.elements.namedItem('fabricar-input') as
            | HTMLInputElement
            | null;
          // El nombre del input es por id, no name. Recuperamos directamente.
          const real = root.querySelector<HTMLInputElement>('#fabricar-input');
          const word = (real?.value ?? input?.value ?? '').trim();
          if (!word) return;
          const encoded = encoder.encode(word).join('');
          practiceLastTry = word;
          practiceLastEncoded = encoded;
          if (encoded === practiceTarget) {
            practiceLastElapsed = practiceChrono.stop();
            stats = { ...stats, fabricationsCompleted: stats.fabricationsCompleted + 1 };
            saveStats(helpers, stats);
            practiceCompleted += 1;
            practiceFeedback = 'ok';
            if (practiceCompleted >= PRACTICE_TARGET) {
              mode = 'flash-intro';
              render();
              return;
            }
            setTimeout(() => {
              nextPracticeTarget();
              render();
            }, 900);
            render();
          } else {
            practiceFeedback = 'fail';
            render();
          }
        });
      }

      // Flash
      const flashForm = root.querySelector<HTMLFormElement>('#flash-form');
      if (flashForm) {
        flashForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const real = root.querySelector<HTMLInputElement>('#flash-input');
          const word = (real?.value ?? '').trim();
          if (!word) return;
          const encoded = encoder.encode(word).join('');
          if (encoded === flashTarget) {
            flashScore += 1;
            nextFlashTarget();
            render();
            // mantener interval activo — solo re-render del input
            const clock = root.querySelector<HTMLSpanElement>('.flash-seconds');
            const bar = root.querySelector<HTMLDivElement>('.flash-bar-fill');
            if (clock) clock.textContent = `${flashSecondsLeft}s`;
            if (bar) bar.style.width = `${(flashSecondsLeft / FLASH_SECONDS) * 100}%`;
          } else if (real) {
            // sacudida visual
            real.classList.add('shake');
            setTimeout(() => real.classList.remove('shake'), 250);
            real.select();
          }
        });
      }
    }

    render();
  },
};
