export const CANVAS_W = 960;
export const CANVAS_H = 540;
export const GROUND_Y = 440;
export const LEVEL_WIDTH = 6400;
export const BOSS_X = LEVEL_WIDTH - 420;
export const GRAVITY = 1650;
export const MOVE_SPEED = 205;
export const JUMP_VELOCITY = -640;

export const PLAYER_W = 26;
export const PLAYER_H = 54;

export const WEAPONS = {
  machinegun: { name: 'MACHINE GUN', letter: 'M', color: '#ffe066', rate: 0.11, speed: 780, dmg: 1, spread: 0 },
  spread: { name: 'SPREAD GUN', letter: 'S', color: '#7fffb0', rate: 0.22, speed: 680, dmg: 1, spread: 5 },
  fire: { name: 'FIRE GUN', letter: 'F', color: '#ff8c42', rate: 0.09, speed: 520, dmg: 1, spread: 0, flame: true },
  laser: { name: 'LASER', letter: 'L', color: '#8fe8ff', rate: 0.32, speed: 920, dmg: 3, spread: 0, pierce: true },
};

// Rapid Fire ("R") isn't its own weapon — like the original game, it's a
// standing upgrade that speeds up whatever weapon is currently equipped.
export const RAPID_FIRE_MULTIPLIER = 0.5;
export const RAPID_CAPSULE = { name: 'RAPID FIRE', letter: 'R', color: '#ffffff' };

export const COLORS = {
  sky1: '#04050c',
  sky2: '#070a16',
  sky3: '#0c1428',
  star: '#dfe8ff',
  mountain: '#c9d2d6',
  mountainDark: '#8a9498',
  canopy: '#2fae2f',
  canopyDark: '#177a1f',
  canopyDeep: '#0c4a16',
  trunk: '#0c4a16',
  rock: '#9a8a3c',
  rockDark: '#6e6024',
  rockLine: '#4f4519',
  grass: '#3fd44a',
  grassDark: '#1f9a2c',
  water: '#2f6fd0',
  waterFoam: '#bfe4ff',
  skin: '#d99a6c',
  pants: '#4a6b46',
  pantsDark: '#324a30',
  strap: '#3a2e1a',
  headband: '#c0392b',
  outline: '#0c0f0a',
};
