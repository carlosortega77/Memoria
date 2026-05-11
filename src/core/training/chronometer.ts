// Cronómetro de recuperación — la métrica que Campayo entrena en serio.
// El tiempo del recall, no la "calidad", es lo que separa el método aprendido
// del gesto reflejo.

export interface Chronometer {
  start(): void;
  stop(): number;
  reset(): void;
  elapsed(): number;
  isRunning(): boolean;
}

export function createChronometer(): Chronometer {
  let startedAt: number | null = null;
  let lastElapsed: number = 0;

  return {
    start(): void {
      startedAt = performance.now();
      lastElapsed = 0;
    },
    stop(): number {
      if (startedAt === null) return lastElapsed;
      lastElapsed = performance.now() - startedAt;
      startedAt = null;
      return lastElapsed;
    },
    reset(): void {
      startedAt = null;
      lastElapsed = 0;
    },
    elapsed(): number {
      if (startedAt !== null) return performance.now() - startedAt;
      return lastElapsed;
    },
    isRunning(): boolean {
      return startedAt !== null;
    },
  };
}

export function formatElapsed(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const s = ms / 1000;
  if (s < 10) return `${s.toFixed(2)} s`;
  if (s < 60) return `${s.toFixed(1)} s`;
  const m = Math.floor(s / 60);
  const rs = Math.round(s % 60);
  return `${m}m ${rs}s`;
}

// Marca de velocidad: cómo de rápido un usuario llegó a la respuesta.
// Mantenida por item del trainer. Permite ver "mejor" y "último".
export interface TimingRecord {
  readonly bestMs: number | null;
  readonly lastMs: number | null;
  readonly attempts: number;
}

export function emptyTiming(): TimingRecord {
  return { bestMs: null, lastMs: null, attempts: 0 };
}

export function recordTiming(prev: TimingRecord, elapsedMs: number): TimingRecord {
  return {
    bestMs: prev.bestMs === null ? elapsedMs : Math.min(prev.bestMs, elapsedMs),
    lastMs: elapsedMs,
    attempts: prev.attempts + 1,
  };
}
