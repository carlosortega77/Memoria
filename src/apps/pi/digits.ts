// Primeros 200 dígitos de π después del "3.".
// Permite formar 100 pares — exactamente el tamaño del casillero base.
// Para superar 200 dígitos en v2/v3 hará falta activar comodines.
export const PI_DIGITS: string =
  '14159265358979323846264338327950288419716939937510' +
  '58209749445923078164062862089986280348253421170679' +
  '82148086513282306647093844609550582231725359408128' +
  '48111745028410270193852110555964462294895493038196';

export interface PiPair {
  readonly index: number;     // 0-based posición en el stream de pares
  readonly digits: string;    // "14", "15", etc. (siempre 2 caracteres)
  readonly value: number;     // numérico (0-99), referencia a la casilla
}

export function getPairs(): readonly PiPair[] {
  const pairs: PiPair[] = [];
  for (let i = 0; i * 2 < PI_DIGITS.length; i++) {
    const digits = PI_DIGITS.substring(i * 2, i * 2 + 2);
    if (digits.length < 2) break;
    pairs.push({ index: i, digits, value: Number(digits) });
  }
  return pairs;
}
