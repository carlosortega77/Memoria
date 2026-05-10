import type { UserCasillero } from '../casillero/state';
import {
  createInitialReviewState,
  isDue,
  review,
  type Rating,
  type ReviewState,
} from '../spaced-repetition/sm2';

// Cada casilla del usuario genera DOS items de drill:
//  - número → palabra (recall directo)
//  - palabra → número (recall inverso)
export type DrillDirection = 'number-to-word' | 'word-to-number';

export interface TrainerItem {
  readonly id: string;
  readonly position: number;
  readonly word: string;
  readonly direction: DrillDirection;
  readonly review: ReviewState;
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
    });
    items.push({
      id: `c:${sel.position}:w2n`,
      position: sel.position,
      word: sel.chosenWord,
      direction: 'word-to-number',
      review: createInitialReviewState(),
    });
  }
  return items;
}

// Reconcilia el estado del trainer con la elección actual del casillero.
// - Items cuya palabra ha cambiado → se reemplazan (review state perdido).
// - Items removidos por el usuario → se borran.
// - Items nuevos → se añaden con review inicial.
// - Items existentes idénticos → se preservan (review state intacto).
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

export function pickNextDue(
  state: TrainerState,
  now: number = Date.now(),
): TrainerItem | null {
  const due = state.items.filter((i) => isDue(i.review, now));
  if (due.length === 0) return null;
  due.sort((a, b) => a.review.nextReviewAt - b.review.nextReviewAt);
  return due[0] ?? null;
}

export function countDue(state: TrainerState, now: number = Date.now()): number {
  return state.items.filter((i) => isDue(i.review, now)).length;
}

export function applyReview(
  state: TrainerState,
  itemId: string,
  rating: Rating,
  now: number = Date.now(),
): TrainerState {
  return {
    items: state.items.map((item) =>
      item.id === itemId ? { ...item, review: review(item.review, rating, now) } : item,
    ),
    updatedAt: now,
  };
}
