export type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// Token consonántico normalizado. Los dígrafos del español ('ch') son un único token.
export type Phoneme = string;

export interface MajorPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly mapping: Readonly<Record<Digit, readonly Phoneme[]>>;
  // Letras que no codifican: vocales y silenciosas. El codificador las salta.
  readonly freeLetters: readonly string[];
}
