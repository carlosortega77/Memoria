import type { Storage } from '../../persistence/local-storage';
import type { TrainerState } from './major-trainer';

const KEY = 'trainer:major:state';

export interface TrainerStore {
  load(): TrainerState | null;
  save(state: TrainerState): void;
}

export function createTrainerStore(storage: Storage): TrainerStore {
  return {
    load: () => storage.get<TrainerState>(KEY),
    save: (s) => storage.set(KEY, s),
  };
}
