import type { Lesson, LessonHelpers } from '../types';

const CHAIN_EXAMPLE = [
  { from: 'tractor', to: 'bombilla', scene: 'Un tractor ara un campo y va desenterrando bombillas que se encienden al salir de la tierra.' },
  { from: 'bombilla', to: 'cigüeña', scene: 'Una cigüeña cuelga del techo con una bombilla en su largo pico, y al tirarle de las patas la bombilla parpadea.' },
  { from: 'cigüeña', to: 'botón', scene: 'La cigüeña incrusta botones gigantes en una mesa de madera con su pico, como una remachadora.' },
  { from: 'botón', to: 'mesa', scene: 'La mesa está cubierta de botones de abrigo enormes que vibran al ritmo de la música.' },
];

export const lessonCadena: Lesson = {
  id: 'l1-cadena',
  title: 'La cadena inverosímil',
  description: 'Por qué tu cerebro recuerda escenas raras y olvida datos abstractos.',
  estimatedMinutes: 5,

  mount(root: HTMLElement, helpers: LessonHelpers): void {
    root.innerHTML = `
      <article class="lesson">
        <h3>${this.title}</h3>

        <p class="lesson-lead">
          Tu cerebro NO está hecho para memorizar listas. Está hecho para recordar <strong>escenas</strong>:
          imágenes con movimiento, sonido y rareza. Si una escena te sorprende, no la olvidas en años.
        </p>

        <p>
          Esa es la base de todo el método: <strong>convertimos lo abstracto en escena inverosímil</strong>.
          Y enlazamos escenas entre sí formando una cadena.
        </p>

        <h4>Ejemplo</h4>
        <p>Memoriza estas cuatro palabras en orden:</p>
        <ol class="words"><li>tractor</li><li>bombilla</li><li>cigüeña</li><li>botón</li></ol>

        <p>Repetirlas como un papagayo cuesta y se olvida en minutos. En lugar de eso, encadénalas:</p>

        <div class="lesson-chain">
          ${CHAIN_EXAMPLE
            .map(
              (link) => `
            <div class="chain-link">
              <span class="link-from">${link.from}</span>
              <span class="link-arrow">→</span>
              <span class="link-to">${link.to}</span>
              <p class="link-scene">${link.scene}</p>
            </div>
          `,
            )
            .join('')}
        </div>

        <p>
          Tres claves para que las escenas funcionen:
        </p>
        <ul class="lesson-keys">
          <li><strong>Movimiento</strong>: no foto fija, vídeo mental. El tractor avanza, la cigüeña martilla.</li>
          <li><strong>Exageración</strong>: tamaños imposibles, cantidades absurdas, leyes físicas rotas.</li>
          <li><strong>Multisensorial</strong>: oye el ruido, siente el olor, no sólo lo veas.</li>
        </ul>

        <p>
          Esto SOLO es la base. Sirve para listas cortas, pero se queda corto con datos en orden
          o con números. Para eso necesitamos el <strong>Sistema Mayor</strong> y el <strong>casillero</strong>,
          que verás en las siguientes lecciones.
        </p>

        <div class="lesson-actions">
          <button class="btn-secondary" id="lesson-back">← Volver</button>
          <button class="btn-primary" id="lesson-done">Lo entiendo, continuar</button>
        </div>
      </article>
    `;

    root.querySelector<HTMLButtonElement>('#lesson-back')?.addEventListener('click', () => {
      helpers.goBack();
    });
    root.querySelector<HTMLButtonElement>('#lesson-done')?.addEventListener('click', () => {
      helpers.markComplete();
      helpers.goBack();
    });
  },
};
