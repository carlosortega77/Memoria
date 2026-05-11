import type { AppContext } from '../core/app-contract';
import { createLearnProgressStore } from './progress';
import type { Lesson } from './types';
import { lessonCadena } from './lessons/l1-cadena';
import { lessonMayor } from './lessons/l2-mayor';
import { lessonCasillero } from './lessons/l3-casillero';
import { withTransition } from '../ui/transitions';

const CURRICULUM: readonly Lesson[] = [lessonCadena, lessonMayor, lessonCasillero];

export function mountLearn(root: HTMLElement, ctx: AppContext): void {
  const progressStore = createLearnProgressStore(ctx.storage);
  let activeLesson: Lesson | null = null;

  function renderIndex(): void {
    const completedCount = CURRICULUM.filter((l) => progressStore.isComplete(l.id)).length;
    const totalCount = CURRICULUM.length;
    const pct = Math.round((completedCount / totalCount) * 100);

    root.innerHTML = `
      <div class="learn-index">
        <p class="learn-lead">
          Currículum guiado: del concepto base al primer casillero funcional.
          Cada lección dura 5-10 minutos. El progreso se guarda en tu dispositivo.
        </p>

        <div class="progress">
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          <span>${completedCount} / ${totalCount}</span>
        </div>

        <ol class="lesson-list">
          ${CURRICULUM.map((l, i) => {
            const done = progressStore.isComplete(l.id);
            return `
              <li class="lesson-card ${done ? 'done' : ''}" data-id="${l.id}">
                <div class="lesson-num">${String(i + 1).padStart(2, '0')}</div>
                <div class="lesson-body">
                  <div class="lesson-title-row">
                    <h4>${l.title}</h4>
                    ${done ? '<span class="lesson-check">✓</span>' : ''}
                  </div>
                  <p>${l.description}</p>
                  <small class="lesson-time">≈ ${l.estimatedMinutes} min</small>
                </div>
                <button class="lesson-start" data-id="${l.id}">
                  ${done ? 'Repasar' : 'Empezar'}
                </button>
              </li>
            `;
          }).join('')}
        </ol>

        ${
          completedCount === totalCount
            ? `
              <p class="lesson-celebrate-msg">
                Has completado todas las lecciones disponibles. Más vendrán en próximas versiones.
              </p>
            `
            : ''
        }
      </div>
    `;

    root.querySelectorAll<HTMLButtonElement>('.lesson-start').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset['id'];
        const lesson = CURRICULUM.find((l) => l.id === id);
        if (lesson) {
          withTransition(() => {
            activeLesson = lesson;
            renderActive();
          });
        }
      });
    });
  }

  function renderActive(): void {
    if (!activeLesson) return;
    activeLesson.mount(root, {
      ctx,
      markComplete: () => {
        if (activeLesson) progressStore.markComplete(activeLesson.id);
      },
      goBack: () => {
        withTransition(() => {
          activeLesson = null;
          renderIndex();
        });
      },
    });
  }

  renderIndex();
}
