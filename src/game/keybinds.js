const STORAGE_KEY = 'contra-keybinds-v1';

export const DEFAULT_KEYBINDS = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  up: 'ArrowUp',
  down: 'ArrowDown',
  jump: 'Space',
  fire: 'KeyZ',
  reload: 'KeyR',
};

export const ACTION_ORDER = ['left', 'right', 'up', 'down', 'jump', 'fire', 'reload'];

export const ACTION_LABELS = {
  left: 'DI CHUYỂN TRÁI',
  right: 'DI CHUYỂN PHẢI',
  up: 'NGẮM LÊN',
  down: 'NẰM / THU NGƯỜI',
  jump: 'NHẢY',
  fire: 'BẮN',
  reload: 'NẠP ĐẠN',
};

export function loadKeybinds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_KEYBINDS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_KEYBINDS, ...parsed };
  } catch {
    return { ...DEFAULT_KEYBINDS };
  }
}

export function saveKeybinds(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch { /* storage unavailable — binding still works for this session */ }
}

export function resetKeybinds() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  return { ...DEFAULT_KEYBINDS };
}

const ARROW_SYMBOLS = { ArrowLeft: '◀', ArrowRight: '▶', ArrowUp: '▲', ArrowDown: '▼' };

export function keyLabel(code) {
  if (!code) return '—';
  if (ARROW_SYMBOLS[code]) return ARROW_SYMBOLS[code];
  if (code === 'Space') return 'SPACE';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return code;
}
