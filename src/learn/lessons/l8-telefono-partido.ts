import { createMajorEncoder } from '../../core/encoders/major/encoder';
import { MAJOR_CAMPAYO } from '../../data/presets/major-campayo';
import type { Lesson, LessonHelpers } from '../types';

// Segundo ejercicio del libro (línea 637): teléfono de 6 dígitos.
// Campayo lo parte en 2 palabras (no necesariamente de 3 dígitos cada una).
// Ejemplo: 91 55 52 → "botella" (9-1-5-5) + "Luna" (5-2).

const FONOS: ReadonlyArray<{ digits: string; label: string }> = [
  { digits: '915552', label: 'Hospital de tu ciudad (Campayo)' },
  { digits: '912345', label: 'Tu academia favorita' },
  { digits: '666666', label: 'Cuidado, este es solo 6s' },
  { digits: '480125', label: 'Compañía de aguas' },
  { digits: '731829', label: 'Despacho del abuelo' },
];

const TARGET_COMPLETED = 3;

export const lessonTelefonoPartido: Lesson = {
  id: 'l8-telefono-partido',
  title: 'Teléfono partido en dos',
  description:
    'Codifica un número de 6 dígitos en DOS palabras. Aprendes a partir lo largo en bloques manejables.',
  estimatedMinutes: 12,

  mount(root: HTMLElement, helpers: LessonHelpers): void {
    const encoder = createMajorEncoder(MAJOR_CAMPAYO);
    let stage: 'intro' | 'run' | 'done' = 'intro';
    let fIndex = 0;
    let completed = 0;
    let lastFeedback: 'idle' | 'ok' | 'fail' = 'idle';
    let lastP1 = '';
    let lastP2 = '';

    function renderIntro(): void {
      root.innerHTML = `
        <article class="lesson">
          <h3>${lessonTelefonoPartido.title}</h3>
          <p class="lesson-lead">
            Para 2 dígitos basta una palabra del casillero. Para 6, ¿qué? Campayo: <strong>parte en dos palabras</strong>. Cada una codifica un trozo, y la escena enlaza ambas.
          </p>
          <p>
            Ejemplo del libro: teléfono <code>91 55 52</code>. Lo parte así:
          </p>
          <div class="how-example">
            <strong>botella</strong> (B-T-LL-LL = 9-1-5-5) + <strong>Luna</strong> (L-N = 5-2). Escena: "En el hospital los enfermos agitan <strong>botellas</strong> que explotan contra la <strong>luna</strong> formando cráteres."
          </div>
          <p>Trabajo: para cada teléfono, escribes <strong>dos palabras</strong>. La app valida que las consonantes Mayor de ambas, concatenadas, formen exactamente el número. Necesitas ${TARGET_COMPLETED} aciertos.</p>
          <div class="lesson-actions">
            <button class="btn-secondary" id="lesson-back">← Volver</button>
            <button class="btn-primary" id="start">Empezar →</button>
          </div>
        </article>
      `;
      root.querySelector<HTMLButtonElement>('#lesson-back')?.addEventListener('click', () => helpers.goBack());
      root.querySelector<HTMLButtonElement>('#start')?.addEventListener('click', () => {
        stage = 'run';
        fIndex = 0;
        completed = 0;
        lastFeedback = 'idle';
        render();
      });
    }

    function renderRun(): void {
      const fono = FONOS[fIndex % FONOS.length]!;
      const feedback =
        lastFeedback === 'ok'
          ? `<p class="quiz-feedback ok">✓ <strong>${lastP1}</strong> + <strong>${lastP2}</strong> codifica ${fono.digits}.</p>`
          : lastFeedback === 'fail'
            ? `<p class="quiz-feedback fail">✗ Tu codificación no cuadra. Verifica las consonantes Mayor.</p>`
            : '';

      root.innerHTML = `
        <article class="lesson">
          <h3>Teléfono · ${completed} / ${TARGET_COMPLETED} aciertos</h3>

          <div class="triple-card">
            <div class="triple-row">
              <span class="triple-label">Contexto</span>
              <span class="triple-value muted">${fono.label}</span>
            </div>
            <div class="triple-row">
              <span class="triple-label">Número</span>
              <span class="triple-value digit">${fono.digits}</span>
            </div>
          </div>

          <p class="recall-prompt">Parte en dos palabras (consonantes Mayor en orden):</p>
          <form id="fono-form" autocomplete="off">
            <input type="text" id="fono-p1" placeholder="palabra 1…" autofocus>
            <span class="form-plus">+</span>
            <input type="text" id="fono-p2" placeholder="palabra 2…">
            <button type="submit">Validar</button>
          </form>

          ${feedback}

          <div class="lesson-actions">
            <button class="btn-secondary" id="abort">← Salir</button>
            <button class="btn-secondary" id="skip">Saltar</button>
          </div>
        </article>
      `;
      root.querySelector<HTMLButtonElement>('#abort')?.addEventListener('click', () => helpers.goBack());
      root.querySelector<HTMLButtonElement>('#skip')?.addEventListener('click', () => {
        fIndex += 1;
        lastFeedback = 'idle';
        render();
      });
      root.querySelector<HTMLFormElement>('#fono-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const p1 = root.querySelector<HTMLInputElement>('#fono-p1');
        const p2 = root.querySelector<HTMLInputElement>('#fono-p2');
        const w1 = (p1?.value ?? '').trim();
        const w2 = (p2?.value ?? '').trim();
        if (!w1 || !w2) return;
        lastP1 = w1;
        lastP2 = w2;
        const encoded1 = encoder.encode(w1).join('');
        const encoded2 = encoder.encode(w2).join('');
        const fullEncoded = encoded1 + encoded2;
        if (fullEncoded === fono.digits) {
          completed += 1;
          lastFeedback = 'ok';
          if (completed >= TARGET_COMPLETED) {
            stage = 'done';
          } else {
            fIndex += 1;
          }
        } else {
          lastFeedback = 'fail';
        }
        render();
      });
    }

    function renderDone(): void {
      root.innerHTML = `
        <article class="lesson lesson-celebrate">
          <h3>✓ ${TARGET_COMPLETED} teléfonos codificados</h3>
          <p>Acabas de aprender a partir números largos. Para un IBAN de 24 dígitos no harás 2 palabras — harás 8 a 12. Pero el principio es el mismo: trocea, codifica cada chunk, enlaza con escenas.</p>
          <div class="lesson-actions">
            <button class="btn-secondary" id="retry">Otra ronda</button>
            <button class="btn-primary" id="mark-done">Marcar completada</button>
          </div>
        </article>
      `;
      root.querySelector<HTMLButtonElement>('#retry')?.addEventListener('click', () => {
        stage = 'run';
        fIndex = 0;
        completed = 0;
        lastFeedback = 'idle';
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
