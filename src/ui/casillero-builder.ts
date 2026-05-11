import type { CasilleroPreset } from '../core/casillero/types';
import type { CasilleroStore } from '../core/casillero/store';
import {
  type UserCasillero,
  clearSelection,
  getSelection,
  setSelection,
} from '../core/casillero/state';
import { withTransition } from './transitions';

export function mountCasilleroBuilder(
  root: HTMLElement,
  preset: CasilleroPreset,
  store: CasilleroStore,
): void {
  let state: UserCasillero = store.load(preset);
  let focusedPosition: number = findFirstIncomplete(state, preset);

  function findFirstIncomplete(s: UserCasillero, p: CasilleroPreset): number {
    for (const slot of p.slots) {
      if (slot.position < 1 || slot.position > 100) continue;
      if (!getSelection(s, slot.position)) return slot.position;
    }
    return 1;
  }

  function persist(next: UserCasillero): void {
    state = next;
    store.save(state);
  }

  function render(): void {
    const slots100 = preset.slots.filter((s) => s.position >= 1 && s.position <= 100);
    const total = slots100.length;
    const completed = state.selections.filter((s) => s.position >= 1 && s.position <= 100).length;
    const pct = Math.round((completed / total) * 100);
    const focusedSlot = preset.slots.find((s) => s.position === focusedPosition);

    const cells = slots100
      .map((slot) => {
        const sel = getSelection(state, slot.position);
        const cls = [
          'cell',
          sel ? 'done' : '',
          sel && sel.isCustom ? 'custom' : '',
          slot.position === focusedPosition ? 'focused' : '',
        ]
          .filter(Boolean)
          .join(' ');
        const wordHtml = sel
          ? `<span class="cell-word">${escapeHtml(sel.chosenWord)}</span>`
          : '<span class="cell-word"></span>';
        return `
          <button class="${cls}" data-pos="${slot.position}" type="button">
            <span class="cell-pos">${String(slot.position).padStart(2, '0')}</span>
            ${wordHtml}
          </button>
        `;
      })
      .join('');

    root.innerHTML = `
      <div class="builder-header">
        <h3>Tu códice</h3>
        <p>Cien casillas. Para cada una eliges UNA palabra del libro o escribes la tuya. El códice se guarda en este dispositivo.</p>
        <div class="progress">
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          <span>${completed} / ${total}</span>
        </div>
      </div>

      <div class="casillero-grid" role="grid" aria-label="Casillero">
        ${cells}
      </div>

      ${focusedSlot ? renderDrawer(focusedSlot) : ''}
    `;

    root.querySelectorAll<HTMLButtonElement>('.cell').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pos = Number(btn.dataset['pos']);
        if (Number.isNaN(pos)) return;
        if (pos === focusedPosition) return;
        withTransition(() => {
          focusedPosition = pos;
          render();
        });
      });
    });

    root.querySelectorAll<HTMLButtonElement>('.drawer-options .chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pos = Number(btn.dataset['pos']);
        if (Number.isNaN(pos)) return;

        if (btn.dataset['clear'] === '1') {
          withTransition(() => {
            persist(clearSelection(state, pos));
            render();
          });
          return;
        }
        if (btn.dataset['mine'] === '1') {
          const custom = window.prompt(`Tu palabra para la casilla ${pos}:`);
          if (custom && custom.trim()) {
            withTransition(() => {
              persist(setSelection(state, pos, custom.trim(), true));
              focusedPosition = findFirstIncomplete(state, preset);
              render();
            });
          }
          return;
        }
        const word = btn.dataset['word'] ?? '';
        if (!word) return;
        const current = getSelection(state, pos);
        const isSame = current && !current.isCustom && current.chosenWord === word;
        withTransition(() => {
          if (isSame) {
            persist(clearSelection(state, pos));
          } else {
            persist(setSelection(state, pos, word, false));
            focusedPosition = findFirstIncomplete(state, preset);
          }
          render();
        });
      });
    });
  }

  function renderDrawer(slot: { position: number; options: readonly string[] }): string {
    const sel = getSelection(state, slot.position);
    const chips = slot.options
      .map((opt) => {
        const active = sel && !sel.isCustom && sel.chosenWord === opt;
        return `<button class="chip ${active ? 'active' : ''}" data-pos="${slot.position}" data-word="${escapeHtml(opt)}" type="button">${escapeHtml(opt)}</button>`;
      })
      .join('');

    const customChip =
      sel && sel.isCustom
        ? `<button class="chip custom active" data-pos="${slot.position}" data-clear="1" type="button">${escapeHtml(sel.chosenWord)} ×</button>`
        : `<button class="chip mine" data-pos="${slot.position}" data-mine="1" type="button">+ Tu palabra</button>`;

    return `
      <div class="casillero-drawer">
        <header class="drawer-head">
          <span class="drawer-pos">${String(slot.position).padStart(2, '0')}</span>
          <span class="drawer-title">Casilla ${slot.position}</span>
        </header>
        <div class="drawer-options">
          ${chips}
          ${customChip}
        </div>
      </div>
    `;
  }

  function escapeHtml(s: string): string {
    return s
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  render();
}
