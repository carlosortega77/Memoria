import { createInitialReviewState, type Rating } from '../../core/spaced-repetition/sm2';
import { applyReviewToItem, type DrillItem } from '../../core/training/drill-loop';

export interface NumeroEntry extends DrillItem {
  readonly label: string;          // p.ej. "Móvil mamá", "DNI", "IBAN"
  readonly number: string;          // dígitos en bruto (puede llevar espacios/guiones)
  readonly association: string;     // escena inverosímil que codifica el número
}

export interface NumerosState {
  readonly entries: readonly NumeroEntry[];
  readonly nextId: number;
  readonly updatedAt: number;
}

export function createEmptyNumerosState(): NumerosState {
  return { entries: [], nextId: 1, updatedAt: Date.now() };
}

export function addNumero(
  state: NumerosState,
  label: string,
  number: string,
  association: string,
): NumerosState {
  const id = `numero:${state.nextId}`;
  const entry: NumeroEntry = {
    id,
    label: label.trim(),
    number: number.trim(),
    association: association.trim(),
    review: createInitialReviewState(),
  };
  return {
    entries: [...state.entries, entry],
    nextId: state.nextId + 1,
    updatedAt: Date.now(),
  };
}

export function removeNumero(state: NumerosState, id: string): NumerosState {
  if (!state.entries.some((e) => e.id === id)) return state;
  return {
    ...state,
    entries: state.entries.filter((e) => e.id !== id),
    updatedAt: Date.now(),
  };
}

export function applyNumerosReview(
  state: NumerosState,
  id: string,
  rating: Rating,
  now: number = Date.now(),
): NumerosState {
  return {
    ...state,
    entries: applyReviewToItem(state.entries, id, rating, now),
    updatedAt: now,
  };
}

// Extrae sólo los dígitos para verificar la codificación contra una asociación.
export function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}
