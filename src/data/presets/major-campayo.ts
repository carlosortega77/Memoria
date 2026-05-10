import type { MajorPreset } from '../../core/encoders/major/types';

// Verificado contra "Desarrolla una mente prodigiosa" (Edaf, ISBN 9788441415775).
// Lectura literal del PDF original.
export const MAJOR_CAMPAYO: MajorPreset = {
  id: 'campayo-es',
  name: 'Campayo (Español)',
  description:
    'Sistema fonético de Ramón Campayo. Cada dígito agrupa consonantes por similitud o frecuencia de uso, no por estricta fonética.',
  mapping: {
    0: ['r'],
    1: ['t', 'd'],
    2: ['n', 'ñ'],
    3: ['m'],
    4: ['c', 'k', 'q'],
    5: ['l'],
    6: ['s', 'z'],
    7: ['f'],
    8: ['ch', 'j', 'g'],
    9: ['v', 'b', 'p'],
  },
  // 'h' es muda en español → relleno libre. 'w' aparece raramente, comodín de hecho.
  freeLetters: ['a', 'e', 'i', 'o', 'u', 'h', 'w'],
};
