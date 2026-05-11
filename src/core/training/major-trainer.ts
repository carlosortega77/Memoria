import type { UserCasillero } from '../casillero/state';
import { createInitialReviewState, type Rating } from '../spaced-repetition/sm2';
import { applyCampayoReview } from '../spaced-repetition/campayo-schedule';
import {
  applyReviewToItemWith,
  countDue as countDueGeneric,
  pickNextDue as pickNextDueGeneric,
  type DrillItem,
} from './drill-loop';
import { emptyTiming, recordTiming, type TimingRecord } from './chronometer';

// Cada casilla del usuario genera DOS items de drill:
//  - número → palabra (recall directo)
//  - palabra → número (recall inverso)
export type DrillDirection = 'number-to-word' | 'word-to-number';

export interface TrainerItem extends DrillItem {
  readonly position: number;
  readonly word: string;
  readonly direction: DrillDirection;
  readonly timing: TimingRecord;
}

export interface TrainerState {
  readonly items: readonly TrainerItem[];
  readonly updatedAt: number;
}

export function buildTrainerItems(user: UserCasillero): readonly TrainerItem[] {
  const items: TrainerItem[] = [];
  for (const sel of user.selections) {
    items.push({
      id: `c:${sel.position}:n2w`,
      position: sel.position,
      word: sel.chosenWord,
      direction: 'number-to-word',
      review: createInitialReviewState(),
      timing: emptyTiming(),
    });
    items.push({
      id: `c:${sel.position}:w2n`,
      position: sel.position,
      word: sel.chosenWord,
      direction: 'word-to-number',
      review: createInitialReviewState(),
      timing: emptyTiming(),
    });
  }
  return items;
}

// Reconcilia el estado del trainer con la elección actual del casillero:
//  - items existentes con palabra idéntica → se preservan (review state intacto)
//  - items cuya palabra cambió → se reemplazan con review state inicial
//  - items huérfanos (sin selección equivalente) → se eliminan
//  - items nuevos → se añaden con review state inicial
export function syncTrainerState(
  prev: TrainerState | null,
  user: UserCasillero,
): TrainerState {
  const fresh = buildTrainerItems(user);
  if (!prev) return { items: fresh, updatedAt: Date.now() };

  const prevById = new Map(prev.items.map((i) => [i.id, i]));
  const merged = fresh.map((f) => {
    const existing = prevById.get(f.id);
    return existing && existing.word === f.word ? existing : f;
  });
  return { items: merged, updatedAt: Date.now() };
}

export function pickNext(state: TrainerState, now?: number): TrainerItem | null {
  return pickNextDueGeneric(state.items, now);
}

export function countDue(state: TrainerState, now?: number): number {
  return countDueGeneric(state.items, now);
}

export function applyTrainerReview(
  state: TrainerState,
  itemId: string,
  rating: Rating,
  now: number = Date.now(),
): TrainerState {
  return {
    items: applyReviewToItemWith(state.items, itemId, rating, applyCampayoReview, now),
    updatedAt: now,
  };
}

export function recordTrainerTiming(
  state: TrainerState,
  itemId: string,
  elapsedMs: number,
): TrainerState {
  return {
    items: state.items.map((item) =>
      item.id === itemId ? { ...item, timing: recordTiming(item.timing, elapsedMs) } : item,
    ),
    updatedAt: Date.now(),
  };
}
