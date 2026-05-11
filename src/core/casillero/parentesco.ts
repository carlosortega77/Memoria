// Detector de "parentesco peligroso" — Campayo (línea 901):
// "copa y vaso se parecen demasiado como para usar ambas en las casillas 49 y 96".
// Avisa cuando el usuario elige una palabra en una casilla que es semánticamente
// vecina de la palabra de otra casilla. Sin esto el casillero acaba siendo un pantano.

interface SemanticCluster {
  readonly name: string;
  readonly words: readonly string[];
}

const CLUSTERS: readonly SemanticCluster[] = [
  { name: 'recipiente para beber', words: ['vaso', 'copa', 'taza', 'jarra', 'cubo', 'cuba', 'tina', 'tuna'] },
  { name: 'bebida', words: ['vino', 'café', 'té', 'tea', 'cerveza'] },
  { name: 'animal grande', words: ['toro', 'vaca', 'oso', 'gorila', 'león', 'jirafa', 'hipopótamo'] },
  { name: 'ave', words: ['ave', 'búho', 'oca', 'paloma', 'gallina', 'gallo', 'cigüeña', 'pelícano'] },
  { name: 'perro', words: ['perro', 'chucho', 'chita', 'lobo'] },
  { name: 'felino', words: ['gato', 'león', 'tigre', 'lince'] },
  { name: 'tela / vestido', words: ['tela', 'capa', 'falda', 'toga', 'chaqueta', 'bata', 'pijama'] },
  { name: 'cuerda / lazo', words: ['cuerda', 'lazo', 'hilo', 'cinta', 'soga'] },
  { name: 'mueble', words: ['mesa', 'silla', 'cama', 'sofá', 'sillón', 'taburete'] },
  { name: 'palo / vara', words: ['vara', 'palo', 'bastón', 'taco', 'tubo', 'caña'] },
  { name: 'arma / golpe', words: ['daga', 'lanza', 'espada', 'hacha', 'maza', 'mazo'] },
  { name: 'fuego / luz', words: ['fuego', 'fogón', 'farola', 'faro', 'tea', 'hoguera', 'lámpara', 'mecha'] },
  { name: 'recipiente / contenedor', words: ['caja', 'baúl', 'saco', 'cubo', 'caja', 'cesta', 'maleta'] },
  { name: 'vehículo', words: ['moto', 'coche', 'tractor', 'barco', 'bici', 'bicicleta', 'tren', 'TIR'] },
  { name: 'comida / vegetal', words: ['naranja', 'limón', 'manzana', 'pera', 'plátano', 'cebolla', 'patata', 'tomate'] },
  { name: 'ropa / prenda', words: ['ropa', 'camisa', 'pantalón', 'falda', 'bata', 'pijama', 'chaqueta'] },
  { name: 'líquido / agua', words: ['mar', 'lago', 'río', 'ola', 'nube', 'lluvia'] },
];

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function clustersOf(word: string): readonly string[] {
  const n = normalize(word);
  const out: string[] = [];
  for (const c of CLUSTERS) {
    if (c.words.some((w) => normalize(w) === n)) out.push(c.name);
  }
  return out;
}

// Distancia de Levenshtein simple — caso adicional a clusters.
function levenshtein(a: string, b: string): number {
  const A = normalize(a);
  const B = normalize(b);
  if (A === B) return 0;
  const m = A.length;
  const n = B.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = A[i - 1] === B[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + cost);
    }
  }
  return dp[m]![n]!;
}

export interface ParentescoWarning {
  readonly otherPosition: number;
  readonly otherWord: string;
  readonly reason: string;
}

export function findParentesco(
  candidate: string,
  selections: ReadonlyArray<{ position: number; chosenWord: string }>,
  candidatePosition: number,
): readonly ParentescoWarning[] {
  const out: ParentescoWarning[] = [];
  const candidateClusters = clustersOf(candidate);

  for (const sel of selections) {
    if (sel.position === candidatePosition) continue;

    // Cluster match
    const otherClusters = clustersOf(sel.chosenWord);
    const shared = candidateClusters.filter((c) => otherClusters.includes(c));
    if (shared.length > 0 && shared[0]) {
      out.push({
        otherPosition: sel.position,
        otherWord: sel.chosenWord,
        reason: shared[0],
      });
      continue;
    }

    // String similarity (Levenshtein ≤ 1 entre palabras cortas)
    const minLen = Math.min(candidate.length, sel.chosenWord.length);
    if (minLen >= 3) {
      const dist = levenshtein(candidate, sel.chosenWord);
      if (dist <= 1) {
        out.push({
          otherPosition: sel.position,
          otherWord: sel.chosenWord,
          reason: 'parecido tipográfico',
        });
      }
    }
  }
  return out;
}
