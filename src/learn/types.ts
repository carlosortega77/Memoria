import type { AppContext } from '../core/app-contract';

export interface LessonHelpers {
  readonly ctx: AppContext;
  markComplete(): void;
  goBack(): void;
}

export interface Lesson {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly estimatedMinutes: number;
  mount(root: HTMLElement, helpers: LessonHelpers): void;
}
