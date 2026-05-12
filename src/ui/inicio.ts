export function mountInicio(root: HTMLElement): void {
  root.innerHTML = `
    <article class="inicio">
      <header class="inicio-hero">
        <p class="inicio-eyebrow">Memoria</p>
        <h1 class="inicio-h1">Una técnica de 400 años para recordar cualquier número, fecha o dato.</h1>
        <p class="inicio-tagline">
          Y para sentir que tu cabeza esconde un truco que el resto no sabe que existe.
        </p>
      </header>

      <section class="inicio-section">
        <h2>El problema con tu memoria</h2>
        <p>
          Tu cerebro está EXCEPCIONALMENTE diseñado para recordar caras, olores, escenas raras y lugares conocidos. Y MUY mal diseñado para listas de números, fechas en frío, IBANs y datos académicos sin contexto.
        </p>
        <p>
          Esta asimetría no es un defecto. Es estructural. El cerebro evolucionó para sobrevivir en sabanas, no para procesar hojas de cálculo. La técnica que vas a aprender <strong>explota la asimetría</strong>: convierte lo que olvidas (números) en lo que NO puedes olvidar (escenas inverosímiles).
        </p>
      </section>

      <section class="inicio-section">
        <h2>La técnica — Sistema Mayor de Ramón Campayo</h2>
        <p>
          Un sistema fonético del siglo XVII, formalizado en castellano por Ramón Campayo (campeón mundial de memoria, múltiples récords mundiales). Funciona en tres pasos:
        </p>

        <h3 class="inicio-step">1 · Cada dígito tiene unas consonantes</h3>
        <table class="inicio-mapping">
          <tr><td>0 → R</td><td>5 → L</td></tr>
          <tr><td>1 → T, D</td><td>6 → S, Z</td></tr>
          <tr><td>2 → N, Ñ</td><td>7 → F</td></tr>
          <tr><td>3 → M</td><td>8 → CH, J, G</td></tr>
          <tr><td>4 → C, K, Q</td><td>9 → V, B, P</td></tr>
        </table>
        <p class="inicio-aside">Las vocales y la <em>h</em> son libres — no codifican nada. Solo cuentan las consonantes.</p>

        <h3 class="inicio-step">2 · Cualquier número se vuelve una palabra-imagen</h3>
        <p>
          Para el año <strong>1989</strong>, Campayo recorta a los 2 últimos dígitos (siglo XX): <code>89</code>. Las consonantes son 8=CH, 9=V → <strong>chivo</strong> (Ch-V = 89 ✓).
        </p>

        <h3 class="inicio-step">3 · La palabra se enlaza al evento en una escena absurda</h3>
        <div class="inicio-example">
          <p><em>"Cae el Muro de Berlín y un <strong>chivo</strong> gigante salta sobre los escombros, con trozos de hormigón colgando de cada cuerno."</em></p>
          <p class="inicio-example-meta">→ La escena se queda. Cuando piensas en "Caída del Muro de Berlín", aparece el chivo. Decodificas chivo → CH-V → 89 → 1989. Reflejo.</p>
        </div>
      </section>

      <section class="inicio-section">
        <h2>Lo que vas a poder hacer</h2>
        <ul class="inicio-uses">
          <li>Recitar <strong>100 dígitos de π</strong> sin pestañear.</li>
          <li>Memorizar <strong>fechas históricas</strong> para una oposición, MIR o examen sin enloquecer.</li>
          <li>Recordar <strong>números útiles</strong> — el móvil de tus padres, tu IBAN, la matrícula del coche, tu DNI — sin guardarlos en el móvil.</li>
          <li>Dar <strong>discursos sin notas</strong> usando una cadena de imágenes.</li>
          <li>Aprender <strong>vocabulario extranjero</strong> a velocidad varias veces normal.</li>
          <li>Tener UN truco social: cuando recitas 50 dígitos de π en una cena, no se olvida.</li>
        </ul>
      </section>

      <section class="inicio-section">
        <h2>Cómo funciona esta app</h2>
        <ol class="inicio-tour">
          <li>
            <strong>Lección</strong> — currículum guiado de 8 unidades cortas. Te lleva desde la primera cadena inverosímil hasta dominar la fabricación de palabras-imagen. Empiezas aquí.
          </li>
          <li>
            <strong>Construir</strong> — defines TU casillero personal: 100 palabras-imagen, una por cada número de 00 a 99. Sin esto el método no funciona. Es afilar tu cuchillo antes de usarlo.
          </li>
          <li>
            <strong>Sesión diaria</strong> — una rutina de 15 minutos con cronómetro: calentamiento, fabricación, drill del casillero, cierre ritual. Es donde el método se vuelve <strong>reflejo</strong>.
          </li>
          <li>
            <strong>π · Fechas · Números útiles</strong> — tres aplicaciones concretas. Memoriza los primeros 200 dígitos de π, fechas históricas con el atajo de compresión, y tus números reales del día a día.
          </li>
          <li>
            <strong>El Taller</strong> — donde se inspeccionan las piezas: el codificador verificado, la tabla Mayor, el inventario.
          </li>
        </ol>
      </section>

      <section class="inicio-section">
        <h2>Qué esperar en cuanto a tiempo</h2>
        <ul class="inicio-timeline">
          <li><strong>Primer día</strong>: 30 minutos con la Lección I (cadena de 20). Vas a creer que funciona, porque funciona.</li>
          <li><strong>Primera semana</strong>: construyes las primeras 50 casillas de tu casillero.</li>
          <li><strong>Semanas 2-3</strong>: completas el casillero y empiezas fechas o números.</li>
          <li><strong>Semana 4</strong>: codificar un número en una imagen empieza a tomarte 2-3 segundos.</li>
          <li><strong>Semana 8</strong>: reflejo. La sesión diaria de 15 min es un ritual placentero, no una tarea.</li>
        </ul>
        <p class="inicio-honest">
          No vendemos magia. Vendemos disciplina concentrada en una técnica que <strong>demostrablemente funciona</strong> en miles de personas a lo largo de 400 años. Lo único que necesitas es 15 minutos al día durante un par de meses.
        </p>
      </section>

      <section class="inicio-cta">
        <h2 class="inicio-cta-h2">¿Listo?</h2>
        <p>La Lección I son 10 minutos. Demuestra el método sobre ti mismo antes de que te creas nada.</p>
        <a href="#/learn" class="inicio-cta-btn">Empezar la Lección I →</a>
      </section>
    </article>
  `;
}
