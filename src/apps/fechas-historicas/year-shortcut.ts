// Atajo de compresión de años según Campayo (libro pág. ~85):
//  - Siglo XX (1901-2000): solo los 2 últimos dígitos.
//  - Segundo milenio (1001-2000): solo los 3 últimos dígitos.
//  - Resto: los 4 dígitos completos.
//
// Esto reduce la carga mnemónica de 4 dígitos a 2-3 en la mayoría de fechas
// que un europeo recordaría habitualmente.

export interface CompressedYear {
  readonly original: number;
  readonly compressed: string;     // "87", "475", "44"
  readonly era: 'siglo-xx' | 'segundo-milenio' | 'completo';
}

export function compressYear(year: number): CompressedYear {
  if (year >= 1901 && year <= 2000) {
    return {
      original: year,
      compressed: String(year % 100).padStart(2, '0'),
      era: 'siglo-xx',
    };
  }
  if (year >= 1001 && year <= 2000) {
    return {
      original: year,
      compressed: String(year % 1000).padStart(3, '0'),
      era: 'segundo-milenio',
    };
  }
  return {
    original: year,
    compressed: String(year),
    era: 'completo',
  };
}
