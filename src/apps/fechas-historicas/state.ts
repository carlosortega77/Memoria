import { createInitialReviewState, type Rating } from '../../core/spaced-repetition/sm2';
import { applyReviewToItem, type DrillItem } from '../../core/training/drill-loop';

export interface FechaEntry extends DrillItem {
  readonly year: number;
  readonly event: string;
  readonly association: string;    // escena inverosímil (opcional pero recomendada)
}

export interface FechasState {
  readonly entries: readonly FechaEntry[];
  readonly nextId: number;
  readonly updatedAt: number;
}

export function createEmptyFechasState(): FechasState {
  return { entries: [], nextId: 1, updatedAt: Date.now() };
}

export function addEntry(
  state: FechasState,
  year: number,
  event: string,
  association: string,
): FechasState {
  const id = `fecha:${state.nextId}`;
  const entry: FechaEntry = {
    id,
    year,
    event: event.trim(),
    association: association.trim(),
    review: createInitialReviewState(),
  };
  return {
    entries: [...state.entries, entry].sort((a, b) => a.year - b.year),
    nextId: state.nextId + 1,
    updatedAt: Date.now(),
  };
}

export function updateEntry(
  state: FechasState,
  id: string,
  patch: { year?: number; event?: string; association?: string },
): FechasState {
  return {
    ...state,
    entries: state.entries
      .map((e) => {
        if (e.id !== id) return e;
        return {
          ...e,
          year: patch.year ?? e.year,
          event: patch.event !== undefined ? patch.event.trim() : e.event,
          association:
            patch.association !== undefined ? patch.association.trim() : e.association,
        };
      })
      .sort((a, b) => a.year - b.year),
    updatedAt: Date.now(),
  };
}

export function removeEntry(state: FechasState, id: string): FechasState {
  if (!state.entries.some((e) => e.id === id)) return state;
  return {
    ...state,
    entries: state.entries.filter((e) => e.id !== id),
    updatedAt: Date.now(),
  };
}

export function applyFechasReview(
  state: FechasState,
  id: string,
  rating: Rating,
  now: number = Date.now(),
): FechasState {
  return {
    ...state,
    entries: applyReviewToItem(state.entries, id, rating, now),
    updatedAt: now,
  };
}
