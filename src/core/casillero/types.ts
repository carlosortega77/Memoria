export interface CasillaSlot {
  readonly position: number;            // 0..N. La 0 es de reserva (Campayo).
  readonly options: readonly string[];  // alternativas; el usuario elige una.
}

// Una situación comodín multiplica por 100 las casillas disponibles.
// Cada asociación pasa a ser triple: casilla base + contenido + escena comodín.
export interface ComodinSituation {
  readonly id: string;
  readonly range: readonly [number, number];
  readonly scene: string;
}

export interface CasilleroPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly slots: readonly CasillaSlot[];
  readonly comodines: readonly ComodinSituation[];
}
