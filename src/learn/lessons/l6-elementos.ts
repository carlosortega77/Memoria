import { getSelection } from '../../core/casillero/state';
import type { Lesson, LessonHelpers } from '../types';

// Sexto ejercicio del libro (línea 832): números atómicos de 10 elementos.
// Entrena: asociación triple (casillero + dato puro + sustitución para palabras
// no directamente visualizables, p.ej. Litio → litigio).
const ELEMENTOS: ReadonlyArray<{ name: string; atomic: number; hintSustituto: string }> = [
  { name: 'Hidrógeno', atomic: 1, hintSustituto: 'globo (lleno de H)' },
  { name: 'Carbono', atomic: 6, hintSustituto: 'carbón / diamante' },
  { name: 'Nitrógeno', atomic: 7, hintSustituto: 'aire / globo de gas' },
  { name: 'Oxígeno', atomic: 8, hintSustituto: 'tubo de buzo / mascarilla' },
  { name: 'Flúor', atomic: 9, hintSustituto: 'tubo de pasta de dientes' },
  { name: 'Sodio', atomic: 11, hintSustituto: 'salero (cloruro sódico)' },
  { name: 'Magnesio', atomic: 12, hintSustituto: 'fuegos artificiales blancos' },
  { name: 'Aluminio', atomic: 13, hintSustituto: 'papel de plata' },
  { name: 'Fósforo', atomic: 15, hintSustituto: 'cerilla encendida' },
  { name: 'Azufre', atomic: 16, hintSustituto: 'huevo podrido (olor)' },
];

export const lessonElementos: Lesson = {
  id: 'l6-elementos',
  title: 'Triple: casillero + dato + sustituto',
  description:
    'Memoriza números atómicos. Combina casilla + sustitución de palabra abstracta + escena inverosímil.',
  estimatedMinutes: 12,

  mount(root: HTMLElement, helpers: LessonHelpers): void {
    const user = helpers.ctx.casilleroStore.load(helpers.ctx.preset);
    let stage: 'intro' | 'run' | 'done' = 'intro';
    let elIndex = 0;
    const associations: string[] = ELEMENTOS.map(() => '');

    function casillaWord(atomic: number): string {
      const sel = getSelection(user, atomic);
      if (sel) return sel.chosenWord;
      const slot = helpers.ctx.preset.slots.find((s) => s.position === atomic);
      return slot?.options[0] ?? '—';
    }

    function renderIntro(): void {
      root.innerHTML = `
        <article class="lesson">
          <h3>${lessonElementos.title}</h3>
          <p class="lesson-lead">
            Es el ejercicio donde el método empieza a brillar. Vas a memorizar 10 elementos químicos con sus números atómicos. La técnica triple es:
          </p>
          <ol class="how-steps">
            <li><strong>Casilla</strong>: el número atómico ya tiene palabra en tu casillero. Ej: Carbono = 6 → <em>oso</em>.</li>
            <li><strong>Sustituto</strong>: si el elemento no es visualizable directamente (Flúor, Litio...), lo sustituyes por algo concreto que te lo evoque. Ej: Flúor → cepillo de dientes.</li>
            <li><strong>Escena inverosímil</strong>: enlazas casilla con sustituto en una imagen vívida. Ej: "un oso enorme se cepilla los dientes con la espuma volcánica".</li>
          </ol>
          <p>Te van 10. Para cada uno escribes tu propia escena. Sin pistas durante el drill posterior — esto es entrenamiento de fabricación.</p>
          <div class="lesson-actions">
            <button class="btn-secondary" id="lesson-back">← Volver</button>
            <button class="btn-primary" id="start">Empezar →</button>
          </div>
        </article>
      `;
      root.querySelector<HTMLButtonElement>('#lesson-back')?.addEventListener('click', () => helpers.goBack());
      root.querySelector<HTMLButtonElement>('#start')?.addEventListener('click', () => {
        stage = 'run';
        elIndex = 0;
        render();
      });
    }

    function renderRun(): void {
      const el = ELEMENTOS[elIndex]!;
      const cWord = casillaWord(el.atomic);
      const pct = ((elIndex + 1) / ELEMENTOS.length) * 100;

      root.innerHTML = `
        <article class="lesson">
          <h3>Elemento ${elIndex + 1} / ${ELEMENTOS.length}</h3>
          <div class="progress">
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
            <span>${elIndex + 1} / ${ELEMENTOS.length}</span>
          </div>

          <div class="triple-card">
            <div class="triple-row">
              <span class="triple-label">Elemento</span>
              <span class="triple-value big">${el.name}</span>
            </div>
            <div class="triple-row">
              <span class="triple-label">Número atómico</span>
              <span class="triple-value digit">${el.atomic}</span>
            </div>
            <div class="triple-row">
              <span class="triple-label">Casilla ${el.atomic}</span>
              <span class="triple-value">${cWord}</span>
            </div>
            <div class="triple-row">
              <span class="triple-label">Sustituto sugerido</span>
              <span class="triple-value muted">${el.hintSustituto}</span>
            </div>
          </div>

          <p class="recall-prompt">Tu escena inverosímil:</p>
          <form id="triple-form" autocomplete="off">
            <input type="text" id="triple-input" placeholder="escena que una ${cWord} con ${el.name.toLowerCase()}…" value="${(associations[elIndex] ?? '').replaceAll('"', '&quot;')}" autofocus>
            <button type="submit">${elIndex === ELEMENTOS.length - 1 ? 'Terminar' : 'Siguiente →'}</button>
          </form>

          <div class="lesson-actions">
            <button class="btn-secondary" id="abort">← Salir</button>
          </div>
        </article>
      `;
      root.querySelector<HTMLButtonElement>('#abort')?.addEventListener('click', () => helpers.goBack());
      const form = root.querySelector<HTMLFormElement>('#triple-form');
      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = root.querySelector<HTMLInputElement>('#triple-input');
        const v = (input?.value ?? '').trim();
        associations[elIndex] = v;
        if (elIndex === ELEMENTOS.length - 1) {
          stage = 'done';
        } else {
          elIndex += 1;
        }
        render();
      });
    }

    function renderDone(): void {
      const filled = associations.filter((a) => a.trim().length > 0).length;
      root.innerHTML = `
        <article class="lesson lesson-celebrate">
          <h3>10 elementos compuestos · ${filled} / ${ELEMENTOS.length} con escena</h3>
          <p>Acabas de hacer asociaciones triples. Esto es lo que hace falta para fechas históricas con eventos abstractos, para artículos de leyes, para cualquier dato puro que no es visualizable de entrada.</p>
          <div class="lesson-actions">
            <button class="btn-secondary" id="retry">Revisar</button>
            <button class="btn-primary" id="mark-done">Marcar completada</button>
          </div>
        </article>
      `;
      root.querySelector<HTMLButtonElement>('#retry')?.addEventListener('click', () => {
        stage = 'run';
        elIndex = 0;
        render();
      });
      root.querySelector<HTMLButtonElement>('#mark-done')?.addEventListener('click', () => {
        helpers.markComplete();
        helpers.goBack();
      });
    }

    function render(): void {
      if (stage === 'intro') renderIntro();
      else if (stage === 'run') renderRun();
      else renderDone();
    }

    render();
  },
};
