// Bucle de drill genérico sobre cualquier item que tenga id + review state.
// Major Trainer y todas las apps de Capa 2 lo reutilizan sin duplicar.

import { isDue, review as applySm2, type Rating, type ReviewState } from '../spaced-repetition/sm2';

export interface DrillItem {
  readonly id: string;
  readonly review: ReviewState;
}

export function pickNextDue<T extends DrillItem>(
  items: readonly T[],
  now: number = Date.now(),
): T | null {
  const due = items.filter((i) => isDue(i.review, now));
  if (due.length === 0) return null;
  due.sort((a, b) => a.review.nextReviewAt - b.review.nextReviewAt);
  return due[0] ?? null;
}

export function countDue<T extends DrillItem>(
  items: readonly T[],
  now: number = Date.now(),
): number {
  return items.filter((i) => isDue(i.review, now)).length;
}

export function applyReviewToItem<T extends DrillItem>(
  items: readonly T[],
  itemId: string,
  rating: Rating,
  now: number = Date.now(),
): readonly T[] {
  return items.map((i) => {
    if (i.id !== itemId) return i;
    return { ...i, review: applySm2(i.review, rating, now) } as T;
  });
}
