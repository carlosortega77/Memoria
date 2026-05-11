// Schedule prescrito por Campayo para el casillero base (libro, líneas 1711+):
// repaso a 1 día → 7 días → 15 días → 30 días → 60 → 120 → 240.
// "Otra vez" reinicia. "Difícil" mantiene. "Bien" avanza un peldaño. "Fácil" salta dos.
//
// Distinto de SM-2 (genérico para la curva del olvido). Aquí lo que entrenamos es
// CONSOLIDACIÓN del casillero base — una infraestructura que necesita repaso
// estructurado, no estimación adaptativa.

import type { Rating, ReviewState } from './sm2';

const DAY_MS = 86_400_000;

// Intervalos en días — el "stage" indexa este array.
const CAMPAYO_INTERVALS_DAYS: readonly number[] = [1, 7, 15, 30, 60, 120, 240];

export function applyCampayoReview(
  state: ReviewState,
  rating: Rating,
  now: number = Date.now(),
): ReviewState {
  // Reutilizamos `repetitions` como índice del stage (0..N-1).
  // `easiness` permanece pero no se usa en este scheduler.
  let stage = state.repetitions;

  switch (rating) {
    case 'again':
      stage = 0;
      break;
    case 'hard':
      // mantiene el peldaño actual
      break;
    case 'good':
      stage = Math.min(stage + 1, CAMPAYO_INTERVALS_DAYS.length - 1);
      break;
    case 'easy':
      stage = Math.min(stage + 2, CAMPAYO_INTERVALS_DAYS.length - 1);
      break;
  }

  const intervalDays =
    CAMPAYO_INTERVALS_DAYS[Math.min(stage, CAMPAYO_INTERVALS_DAYS.length - 1)] ?? 1;
  return {
    easiness: state.easiness,
    intervalDays,
    repetitions: stage,
    lastReviewedAt: now,
    nextReviewAt: now + intervalDays * DAY_MS,
  };
}

// Descripción humana del peldaño actual (para mostrarle al usuario).
export function describeCampayoStage(state: ReviewState): string {
  const stage = state.repetitions;
  const interval = CAMPAYO_INTERVALS_DAYS[stage] ?? null;
  if (interval === null) return '—';
  if (state.lastReviewedAt === null) return 'Por consolidar (1 día)';
  return `Peldaño ${stage + 1} · cada ${interval} día${interval === 1 ? '' : 's'}`;
}
