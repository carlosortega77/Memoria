import { createInitialReviewState, type Rating } from '../../core/spaced-repetition/sm2';
import { applyReviewToItem, type DrillItem } from '../../core/training/drill-loop';

// Cada PiAssociation representa el ENLACE entre el par con índice `pairIndex`
// y el par siguiente (`pairIndex + 1`). Es una escena inverosímil que conecta
// las palabras-imagen de DOS pares consecutivos.
// El último par no tiene asociación porque no hay siguiente.
export interface PiAssociation extends DrillItem {
  readonly pairIndex: number;    // 0..N-2 (el FROM del enlace)
  readonly text: string;         // escena que une casillero[par_actual] con casillero[par_siguiente]
}

export interface PiState {
  readonly associations: readonly PiAssociation[];
  readonly updatedAt: number;
}

export function createEmptyPiState(): PiState {
  return { associations: [], updatedAt: Date.now() };
}

export function getAssociation(state: PiState, pairIndex: number): PiAssociation | undefined {
  return state.associations.find((a) => a.pairIndex === pairIndex);
}

export function setAssociationText(
  state: PiState,
  pairIndex: number,
  text: string,
): PiState {
  const trimmed = text.trim();
  if (trimmed === '') return clearAssociation(state, pairIndex);

  const existing = getAssociation(state, pairIndex);
  const others = state.associations.filter((a) => a.pairIndex !== pairIndex);
  const next: PiAssociation = {
    id: `pi:${pairIndex}`,
    pairIndex,
    text: trimmed,
    review: existing?.review ?? createInitialReviewState(),
  };
  return {
    associations: [...others, next].sort((a, b) => a.pairIndex - b.pairIndex),
    updatedAt: Date.now(),
  };
}

export function clearAssociation(state: PiState, pairIndex: number): PiState {
  if (!state.associations.some((a) => a.pairIndex === pairIndex)) return state;
  return {
    associations: state.associations.filter((a) => a.pairIndex !== pairIndex),
    updatedAt: Date.now(),
  };
}

export function applyPiReview(
  state: PiState,
  itemId: string,
  rating: Rating,
  now: number = Date.now(),
): PiState {
  return {
    associations: applyReviewToItem(state.associations, itemId, rating, now),
    updatedAt: now,
  };
}
