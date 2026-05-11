import type { Storage } from '../../persistence/local-storage';
import { emptyTiming } from './chronometer';
import type { TrainerState, TrainerItem } from './major-trainer';

const KEY = 'trainer:major:state';

export interface TrainerStore {
  load(): TrainerState | null;
  save(state: TrainerState): void;
}

// Migración: estados antiguos no tienen `timing` en sus items. Lo añadimos vacío.
function migrate(state: TrainerState | null): TrainerState | null {
  if (!state) return null;
  const items: TrainerItem[] = state.items.map((item) => {
    const anyItem = item as TrainerItem & { timing?: unknown };
    if (anyItem.timing) return item;
    return { ...item, timing: emptyTiming() };
  });
  return { ...state, items };
}

export function createTrainerStore(storage: Storage): TrainerStore {
  return {
    load: () => migrate(storage.get<TrainerState>(KEY)),
    save: (s) => storage.set(KEY, s),
  };
}
