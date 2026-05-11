import type { Lesson, LessonHelpers } from '../types';

// 20 palabras de la primera lección de Campayo.
const CHAIN: readonly string[] = [
  'tractor', 'bombilla', 'cigüeña', 'botón', 'mesa',
  'esquiador', 'gorila', 'barco', 'bicicleta', 'botella',
  'baúl', 'toro', 'libro', 'reloj', 'alfombra',
  'nube', 'puerta', 'roca', 'mar', 'balón',
];

// 19 escenas inverosímiles del libro (una por cada par consecutivo).
const SCENES: readonly string[] = [
  'Un tractor surca un campo y el arado va desenterrando bombillas que se encienden solas al salir.',
  'Una cigüeña cuelga del techo con una bombilla en su pico; al tirar de sus patas la bombilla parpadea.',
  'La cigüeña incrusta botones gigantes en una mesa con su pico, como una remachadora.',
  'La mesa está cubierta de botones de abrigo enormes que vibran al ritmo de la música.',
  'Un esquiador baja por la ladera sentado sobre una mesa puesta del revés, con las patas hacia arriba.',
  'Un gorila furioso esquía agarrado a dos plátanos persiguiendo a un oso polar que le ha robado un racimo.',
  'El Titanic se hundía y de pronto surge un King Kong gigante que lo agarra y lo pone otra vez a flote.',
  'Un barco de vapor cruza el Misisipí impulsado por pasajeros que pedalean bicicletas dentro de la cala.',
  'Un ciclista coloca su bici sobre una botella gigante y, en equilibrio, va tapando el corcho con la rueda.',
  'Una botella enorme te lanza el corcho a la cabeza y al caer rueda hasta meterse en un baúl.',
  'Del baúl emerge un toro furioso que carga contra todo.',
  'El toro se detiene a leer un libro descomunal con sus cuernos pasando las páginas.',
  'El libro se abre y de él salen miles de relojes haciendo tic-tac al unísono.',
  'Un reloj gigante cae rodando y aplasta una alfombra persa estampando sus números en el pelo.',
  'La alfombra se enrolla sola y sale volando hacia las nubes, deja una estela de polvo.',
  'Una nube negra se condensa hasta formar una puerta de madera maciza que se cierra de un golpe.',
  'La puerta se sale de sus goznes y rueda como una rueda hasta estamparse contra una roca enorme.',
  'La roca se parte por la mitad y de ella sale un torrente de agua que se vuelve el mar.',
  'En medio del mar salta un balón de playa gigante que rebota sobre las olas.',
];

type Phase = 'intro' | 'visualize' | 'recall' | 'done';

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export const lessonCadena: Lesson = {
  id: 'l1-cadena',
  title: 'La cadena de 20',
  description:
    'El primer ejercicio del libro. Visualizas 19 escenas y luego recuperas las 20 palabras en frío.',
  estimatedMinutes: 10,

  mount(root: HTMLElement, helpers: LessonHelpers): void {
    let phase: Phase = 'intro';
    let visualizeIndex = 0;
    let recallIndex = 1;
    let recalledWords: string[] = [];
    let scoreCorrect = 0;
    let lastFeedback: 'idle' | 'ok' | 'fail' = 'idle';
    let lastTry = '';

    function render(): void {
      switch (phase) {
        case 'intro':
          renderIntro();
          break;
        case 'visualize':
          renderVisualize();
          break;
        case 'recall':
          renderRecall();
          break;
        case 'done':
          renderDone();
          break;
      }
    }

    function renderIntro(): void {
      root.innerHTML = `
        <article class="lesson">
          <h3>${lessonCadena.title}</h3>
          <p class="lesson-lead">
            Antes de tablas, antes de casilleros, antes de números: la habilidad raíz es <strong>encadenar imágenes inverosímiles</strong>. Vas a memorizar 20 palabras en orden — no con repetición, sino visualizando 19 escenas absurdas que las enlazan.
          </p>
          <p>
            Te voy a mostrar las escenas <strong>una a una</strong>. Tu trabajo: <strong>cerrar los ojos, "verla" un instante</strong> con todo el detalle posible (movimiento, sonido, exageración). Cuando la sientas nítida, avanzas a la siguiente.
          </p>
          <p class="lesson-tip">
            Después te ponemos a prueba en frío: te doy la primera palabra, escribes la segunda, luego la tercera, etcétera. Para completar la lección hace falta acertar al menos <strong>16 de 20</strong>.
          </p>
          <div class="lesson-actions">
            <button class="btn-secondary" id="lesson-back">← Volver</button>
            <button class="btn-primary" id="start">Empezar →</button>
          </div>
        </article>
      `;
      root.querySelector<HTMLButtonElement>('#lesson-back')?.addEventListener('click', () => helpers.goBack());
      root.querySelector<HTMLButtonElement>('#start')?.addEventListener('click', () => {
        phase = 'visualize';
        visualizeIndex = 0;
        render();
      });
    }

    function renderVisualize(): void {
      const idx = visualizeIndex;
      const total = SCENES.length;
      const fromWord = CHAIN[idx]!;
      const toWord = CHAIN[idx + 1]!;
      const scene = SCENES[idx]!;
      const progressPct = ((idx + 1) / total) * 100;

      root.innerHTML = `
        <article class="lesson">
          <h3>Visualizar · ${idx + 1} / ${total}</h3>
          <div class="progress">
            <div class="progress-bar"><div class="progress-fill" style="width:${progressPct}%"></div></div>
            <span>${idx + 1} / ${total}</span>
          </div>
          <div class="chain-scene">
            <div class="chain-words">
              <span class="chain-w from">${fromWord}</span>
              <span class="chain-arrow">→</span>
              <span class="chain-w to">${toWord}</span>
            </div>
            <p class="chain-scene-text">${scene}</p>
          </div>
          <p class="visualize-tip">
            Cierra los ojos. Cuenta hasta tres. Vela en tu cabeza con todo el detalle (qué oyes, qué hueles, qué tamaño). Luego avanza.
          </p>
          <div class="lesson-actions">
            <button class="btn-secondary" id="lesson-back">← Salir</button>
            <button class="btn-primary" id="next-scene">Lo veo nítido →</button>
          </div>
        </article>
      `;
      root.querySelector<HTMLButtonElement>('#lesson-back')?.addEventListener('click', () => helpers.goBack());
      root.querySelector<HTMLButtonElement>('#next-scene')?.addEventListener('click', () => {
        visualizeIndex += 1;
        if (visualizeIndex >= SCENES.length) {
          phase = 'recall';
          recallIndex = 1;
          recalledWords = [CHAIN[0]!];
          scoreCorrect = 0;
          lastFeedback = 'idle';
          lastTry = '';
        }
        render();
      });
    }

    function renderRecall(): void {
      const total = CHAIN.length;
      const prevWord = CHAIN[recallIndex - 1] ?? '—';
      const expectedWord = CHAIN[recallIndex] ?? '—';
      const feedback =
        lastFeedback === 'ok'
          ? `<p class="quiz-feedback ok">✓ ${lastTry}</p>`
          : lastFeedback === 'fail'
            ? `<p class="quiz-feedback fail">✗ Era: <strong>${expectedWord}</strong>${lastTry ? ' (escribiste ' + lastTry + ')' : ''}.</p>`
            : '';

      root.innerHTML = `
        <article class="lesson">
          <h3>Recuperar en frío · ${recallIndex} / ${total - 1}</h3>
          <p class="lesson-lead">
            La primera palabra es <strong>${CHAIN[0]}</strong>. Escribe la siguiente, una a una.
          </p>
          <div class="recall-chain">
            ${recalledWords
              .map((w, i) => `<span class="recall-w ${i + 1 === recallIndex - 1 ? 'last' : ''}">${w}</span>`)
              .join('<span class="recall-sep">·</span>')}
            ${recalledWords.length > 0 ? '<span class="recall-sep">·</span>' : ''}
            <span class="recall-current">?</span>
          </div>
          <p class="recall-prompt">
            Tras <strong>${prevWord}</strong>, viene…
          </p>
          <form id="recall-form" autocomplete="off">
            <input type="text" id="recall-input" placeholder="palabra siguiente" autofocus>
            <button type="submit">Siguiente</button>
          </form>
          ${feedback}
          <div class="lesson-actions">
            <button class="btn-secondary" id="lesson-back">← Salir</button>
          </div>
        </article>
      `;
      root.querySelector<HTMLButtonElement>('#lesson-back')?.addEventListener('click', () => helpers.goBack());
      const form = root.querySelector<HTMLFormElement>('#recall-form');
      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = root.querySelector<HTMLInputElement>('#recall-input');
        const v = (input?.value ?? '').trim();
        if (!v) return;
        lastTry = v;
        const expected = CHAIN[recallIndex] ?? '';
        if (normalize(v) === normalize(expected)) {
          scoreCorrect += 1;
          lastFeedback = 'ok';
        } else {
          lastFeedback = 'fail';
        }
        recalledWords.push(expected);
        recallIndex += 1;
        if (recallIndex >= CHAIN.length) {
          phase = 'done';
        }
        render();
      });
    }

    function renderDone(): void {
      const score = scoreCorrect;
      const passed = score >= 16;
      root.innerHTML = `
        <article class="lesson lesson-celebrate">
          <h3>${passed ? '✓ Cadena recuperada' : 'Casi'} — ${score} / 19</h3>
          ${
            passed
              ? `<p>Acabas de demostrarte que el cerebro almacena imágenes ENCADENADAS sin esfuerzo. Esto es la base de todo lo que viene después — el casillero, π, las fechas, los números. La técnica funciona.</p>`
              : `<p>Faltaron unas pocas. Vuelve a la fase de visualización — esta vez con MÁS tiempo y MÁS detalle en cada escena. El truco no es memorizar palabras; es ver escenas vívidas. Si la escena no te pareció absurda o no la "viste" de verdad, no se queda.</p>`
          }
          <div class="lesson-actions">
            <button class="btn-secondary" id="retry">${passed ? 'Otra vez' : 'Volver a visualizar'}</button>
            ${passed ? '<button class="btn-primary" id="mark-done">Marcar completada</button>' : ''}
          </div>
        </article>
      `;
      root.querySelector<HTMLButtonElement>('#retry')?.addEventListener('click', () => {
        phase = 'visualize';
        visualizeIndex = 0;
        recalledWords = [];
        recallIndex = 1;
        scoreCorrect = 0;
        lastFeedback = 'idle';
        render();
      });
      root.querySelector<HTMLButtonElement>('#mark-done')?.addEventListener('click', () => {
        helpers.markComplete();
        helpers.goBack();
      });
    }

    render();
  },
};
