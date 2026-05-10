import type { CasilleroPreset } from '../core/casillero/types';
import type { CasilleroStore } from '../core/casillero/store';
import {
  type UserCasillero,
  getSelection,
  setSelection,
  clearSelection,
} from '../core/casillero/state';

export function mountCasilleroBuilder(
  root: HTMLElement,
  preset: CasilleroPreset,
  store: CasilleroStore,
): void {
  let state: UserCasillero = store.load(preset);

  function persist(next: UserCasillero): void {
    state = next;
    store.save(state);
    render();
  }

  function render(): void {
    const total = preset.slots.length;
    const completed = state.selections.length;
    const pct = Math.round((completed / total) * 100);

    root.innerHTML = `
      <div class="builder-header">
        <h3>Construye tu casillero</h3>
        <p>Para cada casilla, elige UNA opción del libro o escribe la tuya.
        La elección se guarda en este dispositivo.</p>
        <div class="progress">
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          <span>${completed} / ${total}</span>
        </div>
      </div>
      <div class="builder-grid">
        ${preset.slots
          .map((slot) => {
            const sel = getSelection(state, slot.position);
            const chips = slot.options
              .map((opt) => {
                const active = sel && !sel.isCustom && sel.chosenWord === opt;
                return `<button class="chip ${active ? 'active' : ''}"
                          data-pos="${slot.position}" data-word="${opt}">${opt}</button>`;
              })
              .join('');
            const customBadge =
              sel && sel.isCustom
                ? `<span class="chip custom active" data-pos="${slot.position}" data-clear="1">${sel.chosenWord} ×</span>`
                : '';
            return `
              <div class="slot ${sel ? 'done' : ''}">
                <span class="pos">${String(slot.position).padStart(3, '0')}</span>
                <div class="chips">
                  ${chips}
                  ${customBadge}
                  <button class="chip mine" data-pos="${slot.position}" data-mine="1">+ mía</button>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;

    root.querySelectorAll<HTMLButtonElement>('.chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pos = Number(btn.dataset['pos']);
        if (Number.isNaN(pos)) return;

        if (btn.dataset['clear'] === '1') {
          persist(clearSelection(state, pos));
          return;
        }
        if (btn.dataset['mine'] === '1') {
          const custom = window.prompt(`Tu palabra para la casilla ${pos}:`);
          if (custom && custom.trim()) {
            persist(setSelection(state, pos, custom.trim(), true));
          }
          return;
        }
        const word = btn.dataset['word'] ?? '';
        if (!word) return;
        const current = getSelection(state, pos);
        if (current && !current.isCustom && current.chosenWord === word) {
          persist(clearSelection(state, pos));
        } else {
          persist(setSelection(state, pos, word, false));
        }
      });
    });
  }

  render();
}
