import type { CasilleroPreset } from '../core/casillero/types';
import type { CasilleroStore } from '../core/casillero/store';
import type { TrainerStore } from '../core/training/store';
import {
  applyTrainerReview,
  countDue,
  pickNext,
  recordTrainerTiming,
  syncTrainerState,
  type TrainerItem,
  type TrainerState,
} from '../core/training/major-trainer';
import type { Rating } from '../core/spaced-repetition/sm2';
import { describeCampayoStage } from '../core/spaced-repetition/campayo-schedule';
import { createChronometer, formatElapsed } from '../core/training/chronometer';
import { withTransition } from './transitions';

export function mountMajorTrainer(
  root: HTMLElement,
  preset: CasilleroPreset,
  casilleroStore: CasilleroStore,
  trainerStore: TrainerStore,
): void {
  let state: TrainerState = sync();
  let revealed = false;
  const chrono = createChronometer();
  let liveTimerHandle: number | null = null;

  function sync(): TrainerState {
    const user = casilleroStore.load(preset);
    const next = syncTrainerState(trainerStore.load(), user);
    trainerStore.save(next);
    return next;
  }

  function stopLiveTimer(): void {
    if (liveTimerHandle !== null) {
      window.clearInterval(liveTimerHandle);
      liveTimerHandle = null;
    }
  }

  function startLiveTimer(): void {
    stopLiveTimer();
    liveTimerHandle = window.setInterval(() => {
      const el = root.querySelector<HTMLSpanElement>('#chrono-live');
      if (el) el.textContent = formatElapsed(chrono.elapsed());
    }, 100);
  }

  function renderItemTiming(item: TrainerItem): string {
    const { bestMs, lastMs, attempts } = item.timing;
    if (attempts === 0) return '';
    const best = bestMs !== null ? formatElapsed(bestMs) : '—';
    const last = lastMs !== null ? formatElapsed(lastMs) : '—';
    return `
      <div class="trainer-timing-record">
        <span class="ttr-item"><span class="ttr-label">Mejor</span><span class="ttr-value">${best}</span></span>
        <span class="ttr-item"><span class="ttr-label">Último</span><span class="ttr-value">${last}</span></span>
        <span class="ttr-item"><span class="ttr-label">Intentos</span><span class="ttr-value">${attempts}</span></span>
      </div>
    `;
  }

  function render(): void {
    stopLiveTimer();
    state = sync();

    if (state.items.length === 0) {
      root.innerHTML = `
        <div class="trainer-empty">
          <h3>Sin casillas todavía</h3>
          <p>Ve a <strong>Construir</strong> y elige al menos una opción para empezar a entrenar.</p>
        </div>
      `;
      return;
    }

    const item = pickNext(state);
    const due = countDue(state);

    if (!item) {
      root.innerHTML = `
        <div class="trainer-empty">
          <h3>Día completado</h3>
          <p>No hay nada que repasar ahora mismo. Vuelve más tarde.</p>
          <p class="trainer-stats">${state.items.length} items en el trainer.</p>
        </div>
      `;
      return;
    }

    const promptHtml =
      item.direction === 'number-to-word'
        ? `<div class="trainer-prompt num">${String(item.position).padStart(3, '0')}</div>
           <div class="trainer-hint">¿Qué palabra?</div>`
        : `<div class="trainer-prompt word">${item.word}</div>
           <div class="trainer-hint">¿Qué casilla?</div>`;

    const answerText =
      item.direction === 'number-to-word' ? item.word : String(item.position).padStart(3, '0');

    const elapsedMs = chrono.elapsed();

    root.innerHTML = `
      <div class="trainer-card">
        <div class="trainer-due">${due} pendiente${due === 1 ? '' : 's'}</div>
        <div class="trainer-stage">${describeCampayoStage(item.review)}</div>
        ${promptHtml}
        ${renderItemTiming(item)}
        ${
          revealed
            ? `
          <div class="chrono-final">Tu tiempo · <strong>${formatElapsed(elapsedMs)}</strong></div>
          <div class="trainer-answer">${answerText}</div>
          <div class="trainer-ratings">
            <button class="rate again" data-rating="again">Otra vez</button>
            <button class="rate hard" data-rating="hard">Difícil</button>
            <button class="rate good" data-rating="good">Bien</button>
            <button class="rate easy" data-rating="easy">Fácil</button>
          </div>
        `
            : `
          <div class="chrono-live-row">
            <span class="chrono-live-label">Cronómetro</span>
            <span class="chrono-live" id="chrono-live">0 ms</span>
          </div>
          <button class="trainer-reveal">Mostrar respuesta</button>
        `
        }
      </div>
    `;

    if (!revealed) {
      chrono.start();
      startLiveTimer();
      const reveal = root.querySelector<HTMLButtonElement>('.trainer-reveal');
      reveal?.addEventListener('click', () => {
        const elapsed = chrono.stop();
        stopLiveTimer();
        state = recordTrainerTiming(state, item.id, elapsed);
        trainerStore.save(state);
        withTransition(() => {
          revealed = true;
          render();
        });
      });
    } else {
      root.querySelectorAll<HTMLButtonElement>('button[data-rating]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const rating = btn.dataset['rating'] as Rating | undefined;
          if (!rating) return;
          withTransition(() => {
            state = applyTrainerReview(state, item.id, rating);
            trainerStore.save(state);
            revealed = false;
            chrono.reset();
            render();
          });
        });
      });
    }
  }

  render();
}
