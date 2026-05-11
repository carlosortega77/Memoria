import type { MajorEncoder } from './encoder';

// Devuelve palabras del diccionario cuya codificación Mayor coincide
// EXACTAMENTE con el patrón de dígitos objetivo.
// Léxico determinista — no genera escenas, solo material para que el usuario las componga.
export function findLexicalCandidates(
  targetDigits: string,
  dictionary: readonly string[],
  encoder: MajorEncoder,
  limit: number = 24,
): readonly string[] {
  if (targetDigits === '') return [];
  const results: string[] = [];
  for (const word of dictionary) {
    const encoded = encoder.encode(word).join('');
    if (encoded === targetDigits) {
      results.push(word);
      if (results.length >= limit) break;
    }
  }
  // Quita duplicados conservando orden
  return Array.from(new Set(results));
}
