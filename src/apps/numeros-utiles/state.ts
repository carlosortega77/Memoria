import { createInitialReviewState, type Rating } from '../../core/spaced-repetition/sm2';
import { applyReviewToItem, type DrillItem } from '../../core/training/drill-loop';
import type { NumeroType } from './formats';

export type NumeroDrillDirection = 'l2n' | 'n2l';

export interface NumeroEntry {
  readonly id: string;
  readonly type: NumeroType;
  readonly label: string;
  readonly number: string;     // raw como el usuario lo escribió (puede incluir espacios/letras)
  readonly association: string;
}

export interface NumeroDrillItem extends DrillItem {
  readonly numeroId: string;
  readonly direction: NumeroDrillDirection;
}

export interface NumerosState {
  readonly entries: readonly NumeroEntry[];
  readonly drillItems: readonly NumeroDrillItem[];
  readonly nextId: number;
  readonly updatedAt: number;
}

export function createEmptyNumerosState(): NumerosState {
  return { entries: [], drillItems: [], nextId: 1, updatedAt: Date.now() };
}

function buildFreshDrillItems(entries: readonly NumeroEntry[]): NumeroDrillItem[] {
  const items: NumeroDrillItem[] = [];
  for (const e of entries) {
    items.push({
      id: `${e.id}:l2n`,
      numeroId: e.id,
      direction: 'l2n',
      review: createInitialReviewState(),
    });
    items.push({
      id: `${e.id}:n2l`,
      numeroId: e.id,
      direction: 'n2l',
      review: createInitialReviewState(),
    });
  }
  return items;
}

function syncDrillItems(
  prevItems: readonly NumeroDrillItem[],
  entries: readonly NumeroEntry[],
): readonly NumeroDrillItem[] {
  const fresh = buildFreshDrillItems(entries);
  const prevById = new Map(prevItems.map((i) => [i.id, i]));
  return fresh.map((f) => prevById.get(f.id) ?? f);
}

export function addNumero(
  state: NumerosState,
  type: NumeroType,
  label: string,
  number: string,
  association: string,
): NumerosState {
  const id = `numero:${state.nextId}`;
  const entry: NumeroEntry = {
    id,
    type,
    label: label.trim(),
    number: number.trim(),
    association: association.trim(),
  };
  const entries = [...state.entries, entry];
  return {
    entries,
    drillItems: syncDrillItems(state.drillItems, entries),
    nextId: state.nextId + 1,
    updatedAt: Date.now(),
  };
}

export function removeNumero(state: NumerosState, id: string): NumerosState {
  if (!state.entries.some((e) => e.id === id)) return state;
  const entries = state.entries.filter((e) => e.id !== id);
  return {
    ...state,
    entries,
    drillItems: syncDrillItems(state.drillItems, entries),
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
    drillItems: applyReviewToItem(state.drillItems, id, rating, now),
    updatedAt: now,
  };
}

export function getEntryById(
  state: NumerosState,
  numeroId: string,
): NumeroEntry | undefined {
  return state.entries.find((e) => e.id === numeroId);
}
