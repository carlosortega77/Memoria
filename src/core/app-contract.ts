// Interfaz que cumple toda aplicación de Capa 2.
// El núcleo no conoce apps concretas; las descubre por este contrato.

export type ContentKind =
  | 'digit-stream'      // v1 — π
  | 'date-event'        // v1 — fechas históricas
  | 'labeled-number'    // v1 — números útiles (teléfonos, DNIs, IBANs)
  | 'card'              // v2 — baraja (PAO)
  | 'face-name'         // v2 — nombres y caras
  | 'word-pair'         // v2 — vocabulario idioma extranjero
  | 'list';             // v2 — lista genérica (sandbox)

export interface MemoriaApp {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly contentKind: ContentKind;

  mount(root: HTMLElement): void;
  unmount(): void;
}

export class AppRegistry {
  private readonly apps = new Map<string, MemoriaApp>();

  register(app: MemoriaApp): void {
    this.apps.set(app.id, app);
  }

  get(id: string): MemoriaApp | undefined {
    return this.apps.get(id);
  }

  list(): readonly MemoriaApp[] {
    return Array.from(this.apps.values());
  }
}
