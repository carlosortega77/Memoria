// SM-2 (SuperMemo 2) — algoritmo clásico de repaso espaciado.
// Elegido sobre FSRS en v1 por simplicidad. Misma forma de estado, así que
// migrar a FSRS en v2 no rompe el modelo de datos.

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewState {
  readonly easiness: number;          // EF, mínimo 1.3
  readonly intervalDays: number;      // días al próximo repaso
  readonly repetitions: number;       // racha de aciertos consecutivos
  readonly nextReviewAt: number;      // ms epoch
  readonly lastReviewedAt: number | null;
}

const DAY_MS = 86_400_000;

export function createInitialReviewState(now: number = Date.now()): ReviewState {
  return {
    easiness: 2.5,
    intervalDays: 0,
    repetitions: 0,
    nextReviewAt: now, // disponible para repasar inmediatamente
    lastReviewedAt: null,
  };
}

export function review(
  state: ReviewState,
  rating: Rating,
  now: number = Date.now(),
): ReviewState {
  const q = ratingToQuality(rating);
  let easiness = state.easiness;
  let intervalDays: number;
  let repetitions: number;

  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions = state.repetitions + 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(state.intervalDays * easiness);
  }

  easiness = Math.max(1.3, easiness + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

  return {
    easiness,
    intervalDays,
    repetitions,
    lastReviewedAt: now,
    nextReviewAt: now + intervalDays * DAY_MS,
  };
}

export function isDue(state: ReviewState, now: number = Date.now()): boolean {
  return state.nextReviewAt <= now;
}

function ratingToQuality(rating: Rating): number {
  switch (rating) {
    case 'again': return 2;
    case 'hard':  return 3;
    case 'good':  return 4;
    case 'easy':  return 5;
  }
}
