import type { AppContext } from '../core/app-contract';
import { createLearnProgressStore } from './progress';
import type { Lesson } from './types';
import { lessonCadena } from './lessons/l1-cadena';
import { lessonMayor } from './lessons/l2-mayor';
import { lessonCasillero } from './lessons/l3-casillero';
import { lessonMayorInverso } from './lessons/l4-mayor-inverso';
import { lessonFabricar } from './lessons/l5-fabricar';
import { lessonElementos } from './lessons/l6-elementos';
import { lessonNoVisualizables } from './lessons/l7-no-visualizables';
import { lessonTelefonoPartido } from './lessons/l8-telefono-partido';
import { withTransition } from '../ui/transitions';

const CURRICULUM: readonly Lesson[] = [
  lessonCadena,
  lessonMayor,
  lessonMayorInverso,
  lessonFabricar,
  lessonCasillero,
  lessonElementos,
  lessonNoVisualizables,
  lessonTelefonoPartido,
];

export function mountLearn(root: HTMLElement, ctx: AppContext): void {
  const progressStore = createLearnProgressStore(ctx.storage);
  let activeLesson: Lesson | null = null;
  let completionFor: Lesson | null = null;

  function renderIndex(): void {
    const completedCount = CURRICULUM.filter((l) => progressStore.isComplete(l.id)).length;
    const totalCount = CURRICULUM.length;
    const pct = Math.round((completedCount / totalCount) * 100);

    root.innerHTML = `
      <div class="learn-index">
        <p class="learn-lead">
          Currículum guiado del códice. Cada lección dura 5-10 minutos. El progreso se guarda en este dispositivo.
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
                <div class="lesson-num">${romanNumeral(i + 1)}</div>
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
                Has completado todas las lecciones disponibles. Más vendrán en próximas versiones del códice.
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
        if (activeLesson) {
          progressStore.markComplete(activeLesson.id);
          completionFor = activeLesson;
        }
      },
      goBack: () => {
        withTransition(() => {
          if (completionFor) {
            renderCeremony(completionFor);
          } else {
            activeLesson = null;
            renderIndex();
          }
        });
      },
    });
  }

  function renderCeremony(lesson: Lesson): void {
    const idx = CURRICULUM.findIndex((l) => l.id === lesson.id);
    const next = CURRICULUM[idx + 1];
    const isLast = !next;

    root.innerHTML = isLast
      ? `
        <div class="lesson-ceremony">
          <div class="ceremony-stamp">
            <span>FIN DEL</span>
            <span>APRENDIZAJE BASE</span>
          </div>
          <p class="ceremony-line">
            Has cerrado el currículum del códice. Tu sistema está en pie:
            tabla del Mayor, casillero base, encadenamiento inverosímil.
            Lo demás se construye con uso.
          </p>
          <div class="ceremony-actions">
            <button id="ceremony-back" class="btn-secondary">Al índice</button>
          </div>
        </div>
      `
      : `
        <div class="lesson-ceremony">
          <p class="ceremony-eyebrow">Capítulo siguiente</p>
          <div class="ceremony-capital">${escapeHtml((next.title[0] ?? '').toUpperCase())}</div>
          <h3 class="ceremony-title">${escapeHtml(next.title)}</h3>
          <p class="ceremony-desc">${escapeHtml(next.description)}</p>
          <div class="ceremony-actions">
            <button id="ceremony-back" class="btn-secondary">Al índice</button>
            <button id="ceremony-next" class="btn-primary">Empezar →</button>
          </div>
        </div>
      `;

    root.querySelector<HTMLButtonElement>('#ceremony-back')?.addEventListener('click', () => {
      withTransition(() => {
        completionFor = null;
        activeLesson = null;
        renderIndex();
      });
    });
    root.querySelector<HTMLButtonElement>('#ceremony-next')?.addEventListener('click', () => {
      withTransition(() => {
        completionFor = null;
        activeLesson = next;
        renderActive();
      });
    });
  }

  renderIndex();
}

function romanNumeral(n: number): string {
  const table: ReadonlyArray<[number, string]> = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let out = '';
  let rem = n;
  for (const [v, s] of table) {
    while (rem >= v) {
      out += s;
      rem -= v;
    }
  }
  return out;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
