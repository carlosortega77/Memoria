import type { Storage } from '../../persistence/local-storage';
import { createEmptyNumerosState, type NumerosState } from './state';

const KEY = 'app:numeros:state';

export interface NumerosStore {
  load(): NumerosState;
  save(state: NumerosState): void;
}

export function createNumerosStore(storage: Storage): NumerosStore {
  return {
    load: () => storage.get<NumerosState>(KEY) ?? createEmptyNumerosState(),
    save: (s) => storage.set(KEY, s),
  };
}
