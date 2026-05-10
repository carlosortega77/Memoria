import type { Digit, MajorPreset, Phoneme } from './types';

export interface MajorEncoder {
  // Texto → secuencia de dígitos. Salta vocales, letras libres y caracteres no-letra.
  // Reconoce dígrafos como 'ch' antes que letras simples.
  encode(text: string): readonly Digit[];

  // Secuencia de dígitos → consonantes-esqueleto (la primera de cada dígito).
  // Pista de partida cuando el usuario aún no ha elegido palabra.
  toConsonantSkeleton(digits: readonly Digit[]): readonly Phoneme[];
}

export function createMajorEncoder(preset: MajorPreset): MajorEncoder {
  const phonemeToDigit = new Map<Phoneme, Digit>();
  for (const [digit, phonemes] of Object.entries(preset.mapping)) {
    const d = Number(digit) as Digit;
    for (const p of phonemes) phonemeToDigit.set(p.toLowerCase(), d);
  }

  // Orden por longitud DESC para que dígrafos como 'ch' se prueben antes que 'c'.
  const phonemeList = [...phonemeToDigit.keys()].sort((a, b) => b.length - a.length);

  const isLetter = (ch: string): boolean => /[a-zñáéíóúü]/.test(ch);

  function encode(text: string): readonly Digit[] {
    const lower = text.toLowerCase();
    const result: Digit[] = [];
    let i = 0;
    while (i < lower.length) {
      const ch = lower[i];
      if (!ch || !isLetter(ch)) {
        i++;
        continue;
      }
      let matchLen = 0;
      let matchedDigit: Digit | undefined;
      for (const phoneme of phonemeList) {
        if (lower.startsWith(phoneme, i)) {
          matchedDigit = phonemeToDigit.get(phoneme);
          matchLen = phoneme.length;
          break;
        }
      }
      if (matchedDigit !== undefined) {
        result.push(matchedDigit);
        i += matchLen;
      } else {
        // Letra libre (vocal o silenciosa) o letra extranjera. Saltar.
        i++;
      }
    }
    return result;
  }

  function toConsonantSkeleton(digits: readonly Digit[]): readonly Phoneme[] {
    return digits.map((d) => preset.mapping[d][0] ?? '');
  }

  return { encode, toConsonantSkeleton };
}
