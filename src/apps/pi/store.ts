import type { Storage } from '../../persistence/local-storage';
import { createEmptyPiState, type PiState } from './state';

const KEY = 'app:pi:state';

export interface PiStore {
  load(): PiState;
  save(state: PiState): void;
}

export function createPiStore(storage: Storage): PiStore {
  return {
    load: () => storage.get<PiState>(KEY) ?? createEmptyPiState(),
    save: (s) => storage.set(KEY, s),
  };
}
