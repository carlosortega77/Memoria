import { createInitialReviewState, type Rating } from '../../core/spaced-repetition/sm2';
import { applyReviewToItem, type DrillItem } from '../../core/training/drill-loop';

export type FechaDrillDirection = 'y2e' | 'e2y';

export interface FechaEntry {
  readonly id: string;
  readonly year: number;
  readonly event: string;
  readonly association: string;
}

export interface FechaDrillItem extends DrillItem {
  readonly fechaId: string;
  readonly direction: FechaDrillDirection;
}

export interface FechasState {
  readonly entries: readonly FechaEntry[];
  readonly drillItems: readonly FechaDrillItem[];
  readonly nextId: number;
  readonly updatedAt: number;
}

export function createEmptyFechasState(): FechasState {
  return { entries: [], drillItems: [], nextId: 1, updatedAt: Date.now() };
}

function buildFreshDrillItems(entries: readonly FechaEntry[]): FechaDrillItem[] {
  const items: FechaDrillItem[] = [];
  for (const e of entries) {
    items.push({
      id: `${e.id}:y2e`,
      fechaId: e.id,
      direction: 'y2e',
      review: createInitialReviewState(),
    });
    items.push({
      id: `${e.id}:e2y`,
      fechaId: e.id,
      direction: 'e2y',
      review: createInitialReviewState(),
    });
  }
  return items;
}

function syncDrillItems(
  prevItems: readonly FechaDrillItem[],
  entries: readonly FechaEntry[],
): readonly FechaDrillItem[] {
  const fresh = buildFreshDrillItems(entries);
  const prevById = new Map(prevItems.map((i) => [i.id, i]));
  return fresh.map((f) => prevById.get(f.id) ?? f);
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
  };
  const entries = [...state.entries, entry].sort((a, b) => a.year - b.year);
  return {
    entries,
    drillItems: syncDrillItems(state.drillItems, entries),
    nextId: state.nextId + 1,
    updatedAt: Date.now(),
  };
}

export function addEntries(
  state: FechasState,
  rows: ReadonlyArray<{ year: number; event: string; association: string }>,
): FechasState {
  let next = state;
  for (const r of rows) {
    next = addEntry(next, r.year, r.event, r.association);
  }
  return next;
}

export function removeEntry(state: FechasState, id: string): FechasState {
  if (!state.entries.some((e) => e.id === id)) return state;
  const entries = state.entries.filter((e) => e.id !== id);
  return {
    ...state,
    entries,
    drillItems: syncDrillItems(state.drillItems, entries),
    updatedAt: Date.now(),
  };
}

export function applyFechasReview(
  state: FechasState,
  itemId: string,
  rating: Rating,
  now: number = Date.now(),
): FechasState {
  return {
    ...state,
    drillItems: applyReviewToItem(state.drillItems, itemId, rating, now),
    updatedAt: now,
  };
}

export function getEntryById(
  state: FechasState,
  fechaId: string,
): FechaEntry | undefined {
  return state.entries.find((e) => e.id === fechaId);
}
