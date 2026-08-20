import { loadKeybinds } from './keybinds.js';

export class Input {
  constructor() {
    this.keys = new Set();
    this.map = loadKeybinds();
    this._down = e => {
      this.keys.add(e.code);
      if (Object.values(this.map).includes(e.code)) e.preventDefault();
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
  get left() { return this.keys.has(this.map.left); }
  get right() { return this.keys.has(this.map.right); }
  get up() { return this.keys.has(this.map.up); }
  get down() { return this.keys.has(this.map.down); }
  get jump() { return this.keys.has(this.map.jump); }
  get fire() { return this.keys.has(this.map.fire); }
}
