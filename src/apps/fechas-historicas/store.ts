import type { Storage } from '../../persistence/local-storage';
import { createEmptyFechasState, type FechasState } from './state';

const KEY = 'app:fechas:state';

export interface FechasStore {
  load(): FechasState;
  save(state: FechasState): void;
}

export function createFechasStore(storage: Storage): FechasStore {
  return {
    load: () => storage.get<FechasState>(KEY) ?? createEmptyFechasState(),
    save: (s) => storage.set(KEY, s),
  };
}
