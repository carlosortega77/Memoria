// Router mínimo basado en hash (#/ruta). Sin librería.
// Suficiente para v1: pocas rutas conocidas, sin params, sin nested routes.

export type Route = string;

export interface Router {
  go(route: Route): void;
  current(): Route;
  onChange(handler: (route: Route) => void): () => void;
}

export interface RouterOptions {
  readonly defaultRoute: Route;
  // Lista de rutas válidas. Cualquier ruta fuera de esta lista cae al defaultRoute.
  readonly validRoutes: readonly Route[];
}

export function createHashRouter(opts: RouterOptions): Router {
  const handlers = new Set<(route: Route) => void>();

  function read(): Route {
    const raw = window.location.hash.slice(1).replace(/^\/+/, '');
    return opts.validRoutes.includes(raw) ? raw : opts.defaultRoute;
  }

  function notify(): void {
    const r = read();
    handlers.forEach((h) => h(r));
  }

  window.addEventListener('hashchange', notify);

  // Si la URL llega sin hash, fijamos la ruta por defecto sin recargar.
  if (!window.location.hash) {
    history.replaceState(null, '', '#/' + opts.defaultRoute);
  }

  return {
    go(route: Route): void {
      window.location.hash = '/' + route;
    },
    current: read,
    onChange(handler: (route: Route) => void): () => void {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
  };
}
