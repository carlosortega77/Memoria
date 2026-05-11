// View Transitions API wrapper.
// Si el navegador no soporta startViewTransition, se ejecuta sin más.

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => unknown;
};

export function withTransition(fn: () => void): void {
  const doc = document as DocWithVT;
  if (typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(fn);
  } else {
    fn();
  }
}
