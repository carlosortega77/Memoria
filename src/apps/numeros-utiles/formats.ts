// Formato visual por tipo de número.
// Los grupos visuales SON parte de la mnemotécnica — verlos en clusters
// canónicos ayuda a memorizar.

export type NumeroType = 'movil' | 'dni' | 'iban' | 'matricula' | 'otro';

export interface TypeMeta {
  readonly id: NumeroType;
  readonly label: string;
  readonly placeholder: string;
  readonly labelPlaceholder: string;
}

export const TYPE_METAS: readonly TypeMeta[] = [
  { id: 'movil', label: 'Móvil', placeholder: '666 12 34 56', labelPlaceholder: 'Móvil de mamá' },
  { id: 'dni', label: 'DNI', placeholder: '12345678 X', labelPlaceholder: 'Mi DNI' },
  { id: 'iban', label: 'IBAN', placeholder: 'ES12 3456 7890 ...', labelPlaceholder: 'IBAN nómina' },
  { id: 'matricula', label: 'Matrícula', placeholder: '1234 BCD', labelPlaceholder: 'Coche de papá' },
  { id: 'otro', label: 'Otro', placeholder: 'cualquier número', labelPlaceholder: 'Etiqueta' },
];

export function metaFor(type: NumeroType): TypeMeta {
  return TYPE_METAS.find((t) => t.id === type) ?? TYPE_METAS[TYPE_METAS.length - 1]!;
}

// Convierte cualquier string a sólo dígitos (lo que el codificador Mayor encoda).
export function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

// Formato visual canónico por tipo. Devuelve el string en grupos.
export function formatVisual(raw: string, type: NumeroType): string {
  if (raw === '') return '';
  switch (type) {
    case 'movil': {
      const d = digitsOnly(raw);
      // 9 dígitos: 3-2-2-2
      const m = d.match(/^(\d{3})(\d{0,2})(\d{0,2})(\d{0,2})/);
      if (!m) return d;
      return [m[1], m[2], m[3], m[4]].filter((s) => s && s.length > 0).join(' ');
    }
    case 'dni': {
      // 8 dígitos + letra opcional
      const digits = digitsOnly(raw);
      const letterMatch = raw.match(/[A-Za-z]/);
      const letter = letterMatch ? letterMatch[0].toUpperCase() : '';
      return letter ? `${digits} ${letter}` : digits;
    }
    case 'iban': {
      // ES + 22 dígitos en grupos de 4
      const onlyAlphaNum = raw.replace(/\s+/g, '').toUpperCase();
      return onlyAlphaNum.replace(/(.{4})/g, '$1 ').trim();
    }
    case 'matricula': {
      // 4 dígitos + 3 letras
      const cleaned = raw.replace(/\s+/g, '').toUpperCase();
      const m = cleaned.match(/^(\d{1,4})([A-Z]{0,3})$/);
      if (!m) return cleaned;
      return [m[1], m[2]].filter((s) => s && s.length > 0).join(' ');
    }
    default:
      return raw;
  }
}

// Compara dígito a dígito el encoded vs target y devuelve estructura
// para renderizar con highlights.
export interface DigitMatch {
  readonly digit: string;
  readonly status: 'match' | 'mismatch' | 'pending';
}

export function diffDigits(encoded: string, target: string): readonly DigitMatch[] {
  const max = Math.max(encoded.length, target.length);
  const out: DigitMatch[] = [];
  for (let i = 0; i < max; i++) {
    const t = target[i] ?? '';
    const e = encoded[i] ?? '';
    if (t === '' && e === '') continue;
    if (e === '') {
      out.push({ digit: t, status: 'pending' });
    } else if (t === '') {
      out.push({ digit: e, status: 'mismatch' });
    } else if (e === t) {
      out.push({ digit: t, status: 'match' });
    } else {
      out.push({ digit: e, status: 'mismatch' });
    }
  }
  return out;
}
