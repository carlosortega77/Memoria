// Interfaz que cumple toda aplicación de Capa 2.
// El núcleo no conoce apps concretas; las descubre por este contrato.

import type { CasilleroStore } from './casillero/store';
import type { CasilleroPreset } from './casillero/types';
import type { MajorEncoder } from './encoders/major/encoder';
import type { Storage } from '../persistence/local-storage';

export type ContentKind =
  | 'digit-stream'      // v1 — π
  | 'date-event'        // v1 — fechas históricas
  | 'labeled-number'    // v1 — números útiles (teléfonos, DNIs, IBANs)
  | 'card'              // v2 — baraja (PAO)
  | 'face-name'         // v2 — nombres y caras
  | 'word-pair'         // v2 — vocabulario idioma extranjero
  | 'list';             // v2 — lista genérica (sandbox)

// Lo que se entrega a cada app al montarse.
// La app puede ignorar lo que no use; está aquí para que NO tenga que conocer
// ni importar el resto del núcleo.
export interface AppContext {
  readonly storage: Storage;
  readonly preset: CasilleroPreset;
  readonly casilleroStore: CasilleroStore;
  readonly encoder: MajorEncoder;
}

export interface MemoriaApp {
  readonly id: string;          // identificador estable, ej. 'pi'
  readonly route: string;       // segmento de URL, ej. 'pi'
  readonly name: string;        // nombre visible
  readonly description: string;
  readonly contentKind: ContentKind;
  mount(root: HTMLElement, ctx: AppContext): void;
}

export class AppRegistry {
  private readonly apps = new Map<string, MemoriaApp>();

  register(app: MemoriaApp): void {
    this.apps.set(app.id, app);
  }

  get(id: string): MemoriaApp | undefined {
    return this.apps.get(id);
  }

  findByRoute(route: string): MemoriaApp | undefined {
    for (const app of this.apps.values()) {
      if (app.route === route) return app;
    }
    return undefined;
  }

  list(): readonly MemoriaApp[] {
    return Array.from(this.apps.values());
  }
}
