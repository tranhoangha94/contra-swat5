const MOVE_LEFT = new Set(['ArrowLeft', 'KeyA']);
const MOVE_RIGHT = new Set(['ArrowRight', 'KeyD']);
const AIM_UP = new Set(['ArrowUp', 'KeyW']);
const AIM_DOWN = new Set(['ArrowDown', 'KeyS']);
const JUMP = new Set(['Space']);
const FIRE = new Set(['KeyZ', 'KeyK']);

export class Input {
  constructor() {
    this.keys = new Set();
    this._down = e => {
      this.keys.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    };
    this._up = e => this.keys.delete(e.code);
    window.addEventListener('keydown', this._down);
    window.addEventListener('keyup', this._up);
  }
  dispose() {
    window.removeEventListener('keydown', this._down);
    window.removeEventListener('keyup', this._up);
    this.keys.clear();
  }
  has(set) { for (const c of set) if (this.keys.has(c)) return true; return false; }
  get left() { return this.has(MOVE_LEFT); }
  get right() { return this.has(MOVE_RIGHT); }
  get up() { return this.has(AIM_UP); }
  get down() { return this.has(AIM_DOWN); }
  get jump() { return this.has(JUMP); }
  get fire() { return this.has(FIRE); }
}
