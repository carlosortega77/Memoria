// Wrapper sobre localStorage. En v2/v3 la interfaz se mantiene
// y la implementación puede pasar a IndexedDB sin tocar consumidores.

export interface Storage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

export function createLocalStorage(prefix: string = 'memoria:'): Storage {
  return {
    get<T>(key: string): T | null {
      try {
        const raw = localStorage.getItem(prefix + key);
        return raw === null ? null : (JSON.parse(raw) as T);
      } catch {
        return null;
      }
    },
    set<T>(key: string, value: T): void {
      try {
        localStorage.setItem(prefix + key, JSON.stringify(value));
      } catch {
        // Quota excedida o storage deshabilitado (modo privado). No-op silencioso.
      }
    },
    remove(key: string): void {
      try {
        localStorage.removeItem(prefix + key);
      } catch {
        // Idem.
      }
    },
  };
}
