// Diccionario curado de sustantivos españoles concretos, visualizables.
// Usado por el buscador de candidatos léxicos en Fechas (años de 3+ dígitos).
// Filosofía: léxico SÍ, escena JAMÁS. Damos al usuario palabras que
// satisfacen el patrón consonántico Mayor; él decide cuál usar y monta la escena.

export const SPANISH_DICTIONARY: readonly string[] = [
  // 1-2 consonantes
  'aro', 'té', 'tea', 'hada', 'ñu', 'humo', 'moho', 'oca', 'ola', 'ala', 'hilo',
  'oso', 'asa', 'hueso', 'ufo', 'hacha', 'hucha', 'ajo', 'ave', 'búho',
  'mar', 'sol', 'luna', 'lana', 'lino', 'pan', 'café', 'cama', 'mesa', 'casa',
  'cara', 'coro', 'taco', 'tela', 'taza', 'toro', 'mono', 'mina', 'mano',
  'paja', 'lima', 'loma', 'loco', 'sopa', 'rosa', 'risa', 'foca', 'fama',
  'lago', 'beso', 'boca', 'choza', 'goma', 'maza', 'meta', 'mota', 'moto',
  'nata', 'pata', 'pera', 'pico', 'pino', 'puma', 'puño', 'rana', 'rata',
  'ratón', 'remo', 'ropa', 'sapo', 'seta', 'silla', 'tina', 'tubo', 'vaca',
  'vela', 'vino', 'piña', 'caña', 'leña', 'uña',

  // 3 consonantes (las más útiles para fechas 1001-2000)
  'cabaña', 'cabina', 'caballo', 'cabello', 'cabeza', 'cable', 'cadena',
  'caimán', 'calle', 'cámara', 'camino', 'campana', 'canica', 'canoa',
  'capilla', 'caracol', 'carbón', 'cartera', 'casino', 'castillo', 'cebolla',
  'cebra', 'cereza', 'cesta', 'chaqueta', 'cigarro', 'cinta', 'cinturón',
  'ciruela', 'cocina', 'cocodrilo', 'cohete', 'colina', 'collar', 'comedor',
  'corbata', 'corral', 'cuaderno', 'cuchara', 'cuchillo', 'cuerda', 'cuerpo',
  'cuervo', 'culebra', 'cuna', 'damajuana', 'dedal', 'delfín', 'desierto',
  'diamante', 'diana', 'dinero', 'dragón', 'elefante', 'enano', 'escalera',
  'escoba', 'escudo', 'esmoquin', 'espada', 'espejo', 'esponja', 'estrella',
  'estufa', 'fábrica', 'falda', 'farola', 'fideo', 'fiebre', 'fiesta',
  'figura', 'flauta', 'flecha', 'fogón', 'forro', 'fósforo', 'fresa',
  'frontera', 'galleta', 'gallina', 'gallo', 'ganso', 'garra', 'garza',
  'gato', 'gemelo', 'gigante', 'globo', 'gnomo', 'gorila', 'gorra', 'gota',
  'granja', 'guante', 'guitarra', 'gusano', 'hacha', 'helado', 'hierba',
  'hierro', 'higuera', 'hipopótamo', 'hoguera', 'hojaldre', 'hombro', 'horno',
  'huerto', 'jabalí', 'jabón', 'jamón', 'jardín', 'jaula', 'jeringa',
  'jirafa', 'joya', 'juguete', 'kilo', 'koala', 'lago', 'lámpara', 'lanza',
  'lápiz', 'lata', 'látigo', 'lavadora', 'leche', 'lechuga', 'lechuza',
  'león', 'lechón', 'libro', 'limón', 'linterna', 'lirio', 'llama', 'llanta',
  'llave', 'loro', 'lupa', 'maceta', 'madera', 'maíz', 'maleta', 'manada',
  'manguera', 'manzana', 'maraña', 'marmita', 'martillo', 'mascarilla',
  'medusa', 'mejilla', 'melón', 'membrillo', 'memoria', 'mochila', 'molino',
  'momia', 'moneda', 'morsa', 'mosca', 'muleta', 'muralla', 'naranja',
  'navaja', 'nevera', 'nido', 'nube', 'palmera', 'paloma', 'pantano',
  'papagayo', 'paraguas', 'pared', 'patata', 'patio', 'peine', 'pelícano',
  'pelota', 'penacho', 'peñasco', 'perro', 'pescado', 'piano', 'piedra',
  'pijama', 'pinza', 'pirata', 'pizarra', 'plátano', 'plato', 'pluma',
  'pollo', 'porche', 'puerta', 'puerco', 'queso', 'rama', 'rana', 'rastrillo',
  'redonda', 'reloj', 'remolino', 'repollo', 'rey', 'ría', 'roca', 'rosal',
  'rueda', 'sábana', 'sandía', 'sardina', 'sartén', 'serpiente', 'silla',
  'sirena', 'sofá', 'sombrero', 'taberna', 'tarima', 'tarta', 'tejado',
  'teléfono', 'tenedor', 'tetera', 'tigre', 'tijera', 'timón', 'tornillo',
  'tortilla', 'tortuga', 'trapo', 'trineo', 'trono', 'tucán', 'tulipán',
  'túnel', 'urraca', 'vagón', 'valija', 'varilla', 'vela', 'venda', 'ventana',
  'verja', 'violín', 'volcán', 'yegua', 'yunque', 'zanahoria', 'zapato',
  'zapatilla', 'zarzamora', 'zorro',

  // Verbos y acciones útiles para construir asociaciones
  'cantar', 'bailar', 'saltar', 'correr', 'volar', 'comer', 'dormir',
  'reír', 'llorar', 'gritar', 'escapar', 'pintar', 'romper', 'pegar',
  'tirar', 'cocinar', 'leer', 'escribir', 'cazar', 'pescar',
];
