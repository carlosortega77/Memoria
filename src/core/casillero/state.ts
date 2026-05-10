import type { CasilleroPreset } from './types';

export interface UserCasillaSelection {
  readonly position: number;
  readonly chosenWord: string;
  readonly isCustom: boolean; // true si el usuario escribió una no-preset
}

export interface UserCasillero {
  readonly presetId: string;
  readonly selections: readonly UserCasillaSelection[];
  readonly activatedComodines: readonly string[];
  readonly createdAt: number;
  readonly updatedAt: number;
}

export function createEmptyUserCasillero(preset: CasilleroPreset): UserCasillero {
  const now = Date.now();
  return {
    presetId: preset.id,
    selections: [],
    activatedComodines: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function getSelection(
  state: UserCasillero,
  position: number,
): UserCasillaSelection | undefined {
  return state.selections.find((s) => s.position === position);
}

export function setSelection(
  state: UserCasillero,
  position: number,
  chosenWord: string,
  isCustom: boolean,
): UserCasillero {
  const others = state.selections.filter((s) => s.position !== position);
  const next: UserCasillaSelection[] = [
    ...others,
    { position, chosenWord, isCustom },
  ].sort((a, b) => a.position - b.position);
  return { ...state, selections: next, updatedAt: Date.now() };
}

export function clearSelection(state: UserCasillero, position: number): UserCasillero {
  if (!state.selections.some((s) => s.position === position)) return state;
  return {
    ...state,
    selections: state.selections.filter((s) => s.position !== position),
    updatedAt: Date.now(),
  };
}

export function activateComodin(state: UserCasillero, comodinId: string): UserCasillero {
  if (state.activatedComodines.includes(comodinId)) return state;
  return {
    ...state,
    activatedComodines: [...state.activatedComodines, comodinId],
    updatedAt: Date.now(),
  };
}

export function deactivateComodin(state: UserCasillero, comodinId: string): UserCasillero {
  if (!state.activatedComodines.includes(comodinId)) return state;
  return {
    ...state,
    activatedComodines: state.activatedComodines.filter((id) => id !== comodinId),
    updatedAt: Date.now(),
  };
}
