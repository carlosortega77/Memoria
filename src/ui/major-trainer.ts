import type { CasilleroPreset } from '../core/casillero/types';
import type { CasilleroStore } from '../core/casillero/store';
import type { TrainerStore } from '../core/training/store';
import {
  applyTrainerReview,
  countDue,
  pickNext,
  syncTrainerState,
  type TrainerState,
} from '../core/training/major-trainer';
import type { Rating } from '../core/spaced-repetition/sm2';
import { withTransition } from './transitions';

export function mountMajorTrainer(
  root: HTMLElement,
  preset: CasilleroPreset,
  casilleroStore: CasilleroStore,
  trainerStore: TrainerStore,
): void {
  let state: TrainerState = sync();
  let revealed = false;

  function sync(): TrainerState {
    const user = casilleroStore.load(preset);
    const next = syncTrainerState(trainerStore.load(), user);
    trainerStore.save(next);
    return next;
  }

  function render(): void {
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

    root.innerHTML = `
      <div class="trainer-card">
        <div class="trainer-due">${due} pendiente${due === 1 ? '' : 's'}</div>
        ${promptHtml}
        ${
          revealed
            ? `
          <div class="trainer-answer">${answerText}</div>
          <div class="trainer-ratings">
            <button class="rate again" data-rating="again">Otra vez</button>
            <button class="rate hard" data-rating="hard">Difícil</button>
            <button class="rate good" data-rating="good">Bien</button>
            <button class="rate easy" data-rating="easy">Fácil</button>
          </div>
        `
            : `
          <button class="trainer-reveal">Mostrar respuesta</button>
        `
        }
      </div>
    `;

    if (!revealed) {
      const reveal = root.querySelector<HTMLButtonElement>('.trainer-reveal');
      reveal?.addEventListener('click', () => {
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
            render();
          });
        });
      });
    }
  }

  render();
}
