import type { Lesson, LessonHelpers } from '../types';

// Quinto ejercicio del libro (línea 789): palabras no visualizables.
// "ternura, pena, maravilloso, estricto, amistad, frío, gracia, azul, apetito"
// El usuario debe sustituirlas por algo concreto (ternura → ternera).

interface AbstractWord {
  readonly word: string;
  readonly hint: string;
  readonly example: string;
}

const PALABRAS: readonly AbstractWord[] = [
  { word: 'ternura', hint: 'palabra parecida', example: 'ternera' },
  { word: 'pena', hint: 'verbo o cosa que la cause', example: 'pan / llanto' },
  { word: 'maravilloso', hint: 'algo que te impacte', example: 'fuegos artificiales' },
  { word: 'estricto', hint: 'palabra parecida (Campayo: striptease)', example: 'striptease / militar' },
  { word: 'amistad', hint: 'persona concreta que conoces', example: 'tu mejor amigo' },
  { word: 'frío', hint: 'objeto físicamente frío', example: 'cubito de hielo' },
  { word: 'gracia', hint: 'algo que produzca risa', example: 'payaso' },
  { word: 'azul', hint: 'objeto azul prototípico', example: 'mar' },
  { word: 'apetito', hint: 'algo que dispare el hambre', example: 'bocadillo gigante' },
];

export const lessonNoVisualizables: Lesson = {
  id: 'l7-no-visualizables',
  title: 'Palabras no visualizables',
  description:
    'Sustituye lo abstracto por lo concreto. Campayo: "ternura → ternera". Sin esto, los eventos abstractos te bloquean.',
  estimatedMinutes: 10,

  mount(root: HTMLElement, helpers: LessonHelpers): void {
    let stage: 'intro' | 'run' | 'done' = 'intro';
    let wIndex = 0;
    const sustitutos: string[] = PALABRAS.map(() => '');

    function renderIntro(): void {
      root.innerHTML = `
        <article class="lesson">
          <h3>${lessonNoVisualizables.title}</h3>
          <p class="lesson-lead">
            Mientras los eventos sean concretos (un toro, un castillo) tu cerebro los ve. Pero ¿qué pasa con "Reforma protestante", "concepto", "rivalidad"? No se ven. Sin esta habilidad, fechas históricas y conceptos académicos te bloquean.
          </p>
          <p>
            La técnica: <strong>sustituyes</strong> la palabra abstracta por una concreta que te la evoque. Hay tres caminos:
          </p>
          <ul class="lesson-keys">
            <li><strong>Parecido sonoro</strong>: ternura → <em>ternera</em>. Pena → <em>pan</em>.</li>
            <li><strong>Sustituto semántico</strong>: amistad → <em>un amigo concreto que conoces</em>.</li>
            <li><strong>Causa o efecto físico</strong>: frío → <em>un cubito de hielo</em>. Apetito → <em>un bocadillo gigante</em>.</li>
          </ul>
          <p>Te voy 9 palabras del libro. Para cada una, escribe TU sustituto visualizable.</p>
          <div class="lesson-actions">
            <button class="btn-secondary" id="lesson-back">← Volver</button>
            <button class="btn-primary" id="start">Empezar →</button>
          </div>
        </article>
      `;
      root.querySelector<HTMLButtonElement>('#lesson-back')?.addEventListener('click', () => helpers.goBack());
      root.querySelector<HTMLButtonElement>('#start')?.addEventListener('click', () => {
        stage = 'run';
        wIndex = 0;
        render();
      });
    }

    function renderRun(): void {
      const w = PALABRAS[wIndex]!;
      const pct = ((wIndex + 1) / PALABRAS.length) * 100;

      root.innerHTML = `
        <article class="lesson">
          <h3>Palabra ${wIndex + 1} / ${PALABRAS.length}</h3>
          <div class="progress">
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
            <span>${wIndex + 1} / ${PALABRAS.length}</span>
          </div>

          <div class="triple-card">
            <div class="triple-row">
              <span class="triple-label">Abstracto</span>
              <span class="triple-value big">${w.word}</span>
            </div>
            <div class="triple-row">
              <span class="triple-label">Pista</span>
              <span class="triple-value muted">${w.hint}</span>
            </div>
            <div class="triple-row">
              <span class="triple-label">Sugerencia</span>
              <span class="triple-value">${w.example}</span>
            </div>
          </div>

          <p class="recall-prompt">Tu sustituto (algo concreto, visualizable):</p>
          <form id="sustituto-form" autocomplete="off">
            <input type="text" id="sustituto-input" placeholder="tu sustituto…" value="${(sustitutos[wIndex] ?? '').replaceAll('"', '&quot;')}" autofocus>
            <button type="submit">${wIndex === PALABRAS.length - 1 ? 'Terminar' : 'Siguiente →'}</button>
          </form>

          <div class="lesson-actions">
            <button class="btn-secondary" id="abort">← Salir</button>
          </div>
        </article>
      `;
      root.querySelector<HTMLButtonElement>('#abort')?.addEventListener('click', () => helpers.goBack());
      root.querySelector<HTMLFormElement>('#sustituto-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = root.querySelector<HTMLInputElement>('#sustituto-input');
        sustitutos[wIndex] = (input?.value ?? '').trim();
        if (wIndex === PALABRAS.length - 1) {
          stage = 'done';
        } else {
          wIndex += 1;
        }
        render();
      });
    }

    function renderDone(): void {
      const filled = sustitutos.filter((s) => s.length > 0).length;
      root.innerHTML = `
        <article class="lesson lesson-celebrate">
          <h3>Sustitutos: ${filled} / ${PALABRAS.length}</h3>
          <p>A partir de aquí, cuando una fecha histórica te suelte "Reforma protestante" o "Ilustración", ya sabes: <strong>antes de la escena, el sustituto</strong>. Sin esto te quedas en blanco.</p>
          <div class="lesson-actions">
            <button class="btn-secondary" id="retry">Revisar</button>
            <button class="btn-primary" id="mark-done">Marcar completada</button>
          </div>
        </article>
      `;
      root.querySelector<HTMLButtonElement>('#retry')?.addEventListener('click', () => {
        stage = 'run';
        wIndex = 0;
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
