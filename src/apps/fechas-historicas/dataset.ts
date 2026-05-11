// Muestra precargada de fechas históricas canónicas.
// Sirve para arrancar el módulo sin el cold start del form vacío.
// El usuario puede cargarlas con un click y luego personalizar/borrar.

export interface SeedFecha {
  readonly year: number;
  readonly event: string;
  readonly association: string;
}

export const SEED_FECHAS: readonly SeedFecha[] = [
  { year: 1492, event: 'Descubrimiento de América', association: '' },
  { year: 1517, event: 'Reforma protestante (95 tesis de Lutero)', association: '' },
  { year: 1789, event: 'Revolución francesa (toma de la Bastilla)', association: '' },
  { year: 1812, event: 'Constitución de Cádiz (La Pepa)', association: '' },
  { year: 1898, event: 'Desastre del 98 (pérdida de Cuba, Puerto Rico y Filipinas)', association: '' },
  { year: 1936, event: 'Inicio de la Guerra Civil española', association: '' },
  { year: 1945, event: 'Fin de la Segunda Guerra Mundial', association: '' },
  { year: 1969, event: 'Apolo 11 — primer alunizaje tripulado', association: '' },
  { year: 1989, event: 'Caída del Muro de Berlín', association: '' },
  { year: 2001, event: 'Atentados del 11 de septiembre', association: '' },
];
