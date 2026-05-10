import type { Storage } from '../../persistence/local-storage';
import type { CasilleroPreset } from './types';
import { createEmptyUserCasillero, type UserCasillero } from './state';

const KEY = 'casillero:user';

export interface CasilleroStore {
  load(preset: CasilleroPreset): UserCasillero;
  save(state: UserCasillero): void;
}

export function createCasilleroStore(storage: Storage): CasilleroStore {
  return {
    load(preset: CasilleroPreset): UserCasillero {
      const stored = storage.get<UserCasillero>(KEY);
      if (stored && stored.presetId === preset.id) return stored;
      return createEmptyUserCasillero(preset);
    },
    save(state: UserCasillero): void {
      storage.set(KEY, state);
    },
  };
}
