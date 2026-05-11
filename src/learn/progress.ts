import type { Storage } from '../persistence/local-storage';

export interface LearnProgress {
  readonly completed: readonly string[];
  readonly updatedAt: number;
}

const KEY = 'learn:progress';

export interface LearnProgressStore {
  load(): LearnProgress;
  markComplete(lessonId: string): void;
  isComplete(lessonId: string): boolean;
}

export function createLearnProgressStore(storage: Storage): LearnProgressStore {
  let cache: LearnProgress = storage.get<LearnProgress>(KEY) ?? {
    completed: [],
    updatedAt: Date.now(),
  };

  return {
    load: () => cache,
    markComplete(lessonId: string): void {
      if (cache.completed.includes(lessonId)) return;
      cache = {
        completed: [...cache.completed, lessonId],
        updatedAt: Date.now(),
      };
      storage.set(KEY, cache);
    },
    isComplete(lessonId: string): boolean {
      return cache.completed.includes(lessonId);
    },
  };
}
