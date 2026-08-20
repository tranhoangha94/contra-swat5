import { GRAVITY, MOVE_SPEED, JUMP_VELOCITY, PLAYER_W, PLAYER_H, GROUND_Y, WEAPONS, RAPID_FIRE_MULTIPLIER, RAPID_CAPSULE, SCORE, MAGAZINE_SIZE, RELOAD_TIME } from './constants.js';
import { aimVector, getMuzzlePoint } from './sprites.js';

// ---------------- player ----------------
export function createPlayer() {
  return {
    x: 60, y: GROUND_Y - PLAYER_H, w: PLAYER_W, h: PLAYER_H,
    vx: 0, vy: 0, onGround: true, facing: 1, crouch: false,
    aimAngle: 0, legPhase: 0, invT: 0, alive: true,
    weapon: 'machinegun', rapidFire: false, shootCd: 0, hurtFlashT: 0, moving: false, airborne: false,
    ammo: MAGAZINE_SIZE, reloading: false, reloadT: 0,
  };
}

export function computeAim(input, grounded, movingH) {
  if (input.up && input.down) return { angle: Math.PI / 2, crouch: false };
  if (input.up) return { angle: movingH ? Math.PI / 4 : Math.PI / 2, crouch: false };
  if (input.down) {
    if (!grounded) return { angle: movingH ? -Math.PI / 4 : -Math.PI / 2, crouch: false };
    return { angle: 0, crouch: true };
  }
  return { angle: 0, crouch: false };
}

export function updatePlayerPhysics(p, input, dt, platforms) {
  const movingH = (input.left || input.right) && !p.crouch;
  if (input.left) p.facing = -1;
  if (input.right) p.facing = 1;

  const aim = computeAim(input, p.onGround, input.left || input.right);
  p.aimAngle = aim.angle;
  p.crouch = aim.crouch && p.onGround;

  const speed = p.crouch ? 0 : MOVE_SPEED;
  p.vx = (input.left ? -1 : 0) + (input.right ? 1 : 0);
  p.vx *= speed;
  p.moving = p.vx !== 0;
  if (p.moving) p.legPhase += dt * 14;

  p.x += p.vx * dt;

  if (input.jump && p.onGround && !p.crouch) {
    p.vy = JUMP_VELOCITY;
    p.onGround = false;
  }
  p.vy += GRAVITY * dt;
  const prevBottom = p.y + p.h;
  const h = p.crouch ? p.h * 0.62 : p.h;
  const yTop = p.y + (p.h - h);
  p.y += p.vy * dt;
  p.airborne = !p.onGround;

  p.onGround = false;
  if (p.y + p.h >= GROUND_Y) {
    p.y = GROUND_Y - p.h;
    p.vy = 0;
    p.onGround = true;
  }
  for (const pf of platforms) {
    const withinX = p.x + p.w > pf.x && p.x < pf.x + pf.w;
    if (withinX && p.vy >= 0 && prevBottom <= pf.y + 1 && p.y + p.h >= pf.y) {
      p.y = pf.y - p.h;
      p.vy = 0;
      p.onGround = true;
    }
  }

  if (p.invT > 0) p.invT -= dt;
  if (p.hurtFlashT > 0) p.hurtFlashT -= dt;
  p.shootCd -= dt;

  if (p.reloading) {
    p.reloadT -= dt;
    if (p.reloadT <= 0) {
      p.reloading = false;
      p.reloadT = 0;
      p.ammo = MAGAZINE_SIZE;
    }
  }
}

export function playerHitbox(p) {
  const h = p.crouch ? p.h * 0.62 : p.h;
  return { x: p.x + 4, y: p.y + (p.h - h), w: p.w - 8, h: h - 2 };
}

export function tryFire(p, input, particles) {
  if (!input.fire || p.shootCd > 0 || p.reloading) return null;
  const def = WEAPONS[p.weapon];
  p.shootCd = def.rate * (p.rapidFire ? RAPID_FIRE_MULTIPLIER : 1);
  p.ammo -= 1;
  if (p.ammo <= 0) {
    p.ammo = 0;
    p.reloading = true;
    p.reloadT = RELOAD_TIME;
  }
  const feetY = p.y + p.h - (p.crouch ? 10 : 0);
  const muzzle = getMuzzlePoint(p.x + p.w / 2, feetY, 1, p.facing, p.aimAngle, p.crouch);
  particles.muzzleFlash(muzzle.x, muzzle.y);
  const bullets = [];
  const angles = def.spread
    ? [-def.spread, 0, def.spread].map(d => Math.atan2(muzzle.dy, muzzle.dx) + (d * Math.PI) / 180)
    : [Math.atan2(muzzle.dy, muzzle.dx)];
  for (const a of angles) {
    bullets.push({
      x: muzzle.x, y: muzzle.y, vx: Math.cos(a) * def.speed, vy: Math.sin(a) * def.speed,
      angle: a, color: def.color, dmg: def.dmg, isEnemy: false, life: 1.4, flame: !!def.flame,
      pierce: !!def.pierce, hitIds: def.pierce ? new Set() : null,
    });
  }
  if (def.flame) particles.flame(muzzle.x, muzzle.y, p.facing);
  return bullets;
}

// ---------------- bullets ----------------
export function updateBullets(list, dt, particles) {
  for (const b of list) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.grenade) {
      b.vy += GRAVITY * 0.9 * dt;
      if (b.y >= GROUND_Y - 4) { b.dead = true; b.explode = true; }
    }
    if (b.flame && particles && Math.random() < 0.6) particles.flame(b.x, b.y, Math.sign(b.vx) || 1);
  }
}

// ---------------- enemies ----------------
let uid = 1;
export function createSoldierEnemy(x) {
  return {
    id: uid++, type: 'soldier', x, y: GROUND_Y - 46, w: 24, h: 46, vx: 0, facing: -1,
    hp: 2, maxHp: 2, state: 'run', timer: 0.6 + Math.random() * 0.6, alive: true,
    scoreValue: SCORE.ENEMY, hurtT: 0, legPhase: Math.random() * 10, carriesCapsule: false,
  };
}
export function createTurretEnemy(x) {
  return {
    id: uid++, type: 'turret', x, y: GROUND_Y, w: 30, h: 20, vx: 0, facing: -1,
    hp: 4, maxHp: 4, popT: 0, shootCd: 1, alive: true, scoreValue: SCORE.TURRET, hurtT: 0,
  };
}
export function createGrenadierEnemy(x) {
  return {
    id: uid++, type: 'grenadier', x, y: GROUND_Y - 46, w: 24, h: 46, vx: 0, facing: -1,
    hp: 3, maxHp: 3, state: 'idle', timer: 1, alive: true, scoreValue: SCORE.ENEMY, hurtT: 0,
    legPhase: 0, carriesCapsule: false,
  };
}

export function updateEnemy(e, dt, player, enemyBullets, particles) {
  if (e.hurtT > 0) e.hurtT -= dt;
  const dx = (player.x + player.w / 2) - (e.x + e.w / 2);
  e.facing = dx < 0 ? -1 : 1;

  if (e.type === 'soldier') {
    const dist = Math.abs(dx);
    e.timer -= dt;
    if (e.state === 'run') {
      e.vx = e.facing * 70;
      if (dist < 320 && e.timer <= 0) { e.state = 'shoot'; e.timer = 0.55; e.vx = 0; }
    } else {
      e.vx = 0;
      if (e.timer <= 0) {
        enemyBullets.push({
          x: e.x + e.w / 2, y: e.y + 18, vx: e.facing * 300, vy: 0, angle: e.facing > 0 ? 0 : Math.PI,
          color: '#ff5c5c', dmg: 1, isEnemy: true, life: 2,
        });
        e.state = 'run';
        e.timer = 0.9 + Math.random() * 0.7;
      }
    }
    e.x += e.vx * dt;
    if (e.vx !== 0) e.legPhase += dt * 12;
  } else if (e.type === 'turret') {
    const dist = Math.abs(dx);
    const active = dist < 480;
    e.popT += ((active ? 1 : 0) - e.popT) * Math.min(1, dt * 4);
    e.shootCd -= dt;
    if (e.popT > 0.8 && e.shootCd <= 0) {
      e.shootCd = 1.1 + Math.random() * 0.3;
      const dy = (player.y + player.h * 0.5) - (e.y - 22);
      const ang = Math.atan2(dy, dx);
      enemyBullets.push({
        x: e.x + e.w / 2, y: e.y - 22, vx: Math.cos(ang) * 260, vy: Math.sin(ang) * 260,
        angle: ang, color: '#ff8a5c', dmg: 1, isEnemy: true, life: 2.2,
      });
    }
  } else if (e.type === 'grenadier') {
    const dist = Math.abs(dx);
    e.timer -= dt;
    if (dist > 200 && dist < 500) {
      if (e.timer <= 0) {
        e.timer = 1.8 + Math.random() * 0.6;
        const vx = e.facing * 180;
        const vy = -420;
        enemyBullets.push({
          x: e.x + e.w / 2, y: e.y + 10, vx, vy, angle: 0, color: '#8fd35c',
          dmg: 1, isEnemy: true, life: 3, grenade: true,
        });
      }
    } else if (dist >= 500) {
      e.vx = e.facing * 60;
      e.x += e.vx * dt;
      e.legPhase += dt * 10;
    } else { e.vx = 0; }
  }
}

// ---------------- pickups ----------------
export function createPickup(x, y, weaponKey) {
  const def = weaponKey === 'rapid' ? RAPID_CAPSULE : WEAPONS[weaponKey];
  return { x, y, weaponKey, letter: def.letter, color: def.color, bobT: Math.random() * 10, alive: true };
}

// ---------------- boss ----------------
export function createBoss(x) {
  return {
    x, y: GROUND_Y - 240, w: 170, h: 240, hp: 46, maxHp: 46,
    coreOpen: false, cycleT: 0, armL: 0, armR: 0, shootCd: 1, time: 0, dead: false, hurtT: 0,
  };
}

export function updateBoss(boss, dt, player, enemyBullets, particles) {
  if (boss.dead) return;
  boss.time += dt;
  boss.cycleT += dt;
  if (boss.hurtT > 0) boss.hurtT -= dt;

  const cyclePos = boss.cycleT % 4.2;
  boss.coreOpen = cyclePos > 1.6 && cyclePos < 3.8;
  boss.armL = Math.sin(boss.time * 1.3) * 8;
  boss.armR = Math.sin(boss.time * 1.3 + Math.PI) * 8;

  boss.shootCd -= dt;
  if (boss.coreOpen && boss.shootCd <= 0) {
    boss.shootCd = 0.55;
    const cx = boss.x + boss.w * 0.5, cy = boss.y + boss.h * 0.46;
    const baseAng = Math.atan2((player.y + player.h / 2) - cy, (player.x + player.w / 2) - cx);
    for (const off of [-0.22, 0, 0.22]) {
      const a = baseAng + off;
      enemyBullets.push({
        // long life so the shot always crosses the whole locked boss arena
        // instead of fizzling out before it reaches a player camped at the edge
        x: cx, y: cy, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240, angle: a,
        color: '#ff5a3c', dmg: 1, isEnemy: true, life: 6,
      });
    }
  }
  // arm cannons fire straight forward occasionally
  if (Math.floor(boss.time * 10) % 34 === 0) {
    const ay = boss.y + boss.h * 0.28 + boss.armL + 13;
    enemyBullets.push({ x: boss.x - 18, y: ay, vx: -230, vy: 0, angle: Math.PI, color: '#ffd15c', dmg: 1, isEnemy: true, life: 6 });
  }
}
