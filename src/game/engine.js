import { CANVAS_W as W, CANVAS_H as H, GROUND_Y, LEVEL_WIDTH, BOSS_X, WEAPONS, TIME_LIMIT, SCORE, MAGAZINE_SIZE, RELOAD_TIME } from './constants.js';
import { Input } from './input.js';
import { ParticleSystem } from './particles.js';
import { drawBackground, drawForegroundOcclusion } from './background.js';
import { drawSoldier, drawTurret, drawCapsule, drawBossWall, drawBullet, drawGroundShadow } from './sprites.js';
import {
  createPlayer, updatePlayerPhysics, playerHitbox, tryFire, updateBullets,
  createSoldierEnemy, createTurretEnemy, createGrenadierEnemy, updateEnemy,
  createPickup, createBoss, updateBoss,
} from './entities.js';
import { SFX } from './audio.js';

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function bulletBox(b) { return { x: b.x - 5, y: b.y - 5, w: 10, h: 10 }; }

function buildPlatforms() {
  return [
    { x: 780, y: 360, w: 200, h: 22 },
    { x: 1500, y: 320, w: 170, h: 22 },
    { x: 2200, y: 360, w: 220, h: 22 },
    { x: 2950, y: 310, w: 170, h: 22 },
    { x: 3650, y: 360, w: 220, h: 22 },
    { x: 4400, y: 330, w: 190, h: 22 },
    { x: 5100, y: 360, w: 220, h: 22 },
  ];
}

function buildSpawnTable() {
  const t = [];
  const seq = ['soldier', 'soldier', 'turret', 'soldier', 'grenadier', 'soldier', 'turret'];
  let x = 620;
  let i = 0;
  const weaponCycle = ['spread', 'rapid', 'fire', 'laser', 'spread', 'machinegun', 'rapid', 'fire'];
  let wc = 0;
  while (x < BOSS_X - 380) {
    const type = seq[i % seq.length];
    const carries = type !== 'turret' && i % 3 === 1;
    t.push({ x, type, done: false, capsule: carries ? weaponCycle[wc++ % weaponCycle.length] : null });
    if (i % 6 === 5) t.push({ x: x + 90, type: 'soldier', done: false, capsule: null });
    x += 260 + Math.random() * 220;
    i++;
  }
  return t;
}

export class ContraEngine {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cb = callbacks;
    this.input = new Input();
    this.particles = new ParticleSystem();
    this.running = false;
    this.raf = null;
    this.lastTs = 0;
    this._resetState();
  }

  _resetState() {
    this.player = createPlayer();
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.pickups = [];
    this.platforms = buildPlatforms();
    this.spawnTable = buildSpawnTable();
    this.lives = 3;
    this.score = 0;
    this.camX = 0;
    this.shake = 0;
    this.bossTriggered = false;
    this.bossGraceT = 0;
    this.boss = null;
    this.time = 0;
    this._lastTimeEmit = -1;
    this.ended = false;
    this.particles.list = [];
    this.particles.lights = [];
  }

  start() {
    this.running = true;
    this.lastTs = 0;
    this._emitAll();
    this.raf = requestAnimationFrame(this._loop);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.input.dispose();
  }

  _emitAll() {
    this.cb.onScore?.(this.score);
    this.cb.onLives?.(this.lives);
    this.cb.onWeapon?.(this.player.weapon);
    this.cb.onRapid?.(this.player.rapidFire);
    this.cb.onBoss?.(this.boss ? { hp: this.boss.hp, maxHp: this.boss.maxHp } : null);
    this.cb.onTime?.(TIME_LIMIT);
    this.cb.onAmmo?.({ ammo: this.player.ammo, max: MAGAZINE_SIZE, reloading: this.player.reloading });
  }

  _loop = ts => {
    if (!this.running) return;
    if (!this.lastTs) this.lastTs = ts;
    const dt = Math.min(0.033, (ts - this.lastTs) / 1000);
    this.lastTs = ts;
    this._update(dt);
    this._draw();
    this.raf = requestAnimationFrame(this._loop);
  };

  _hurtPlayer() {
    if (this.player.invT > 0 || this.ended) return;
    this.lives--;
    this.player.invT = 1.7;
    this.player.hurtFlashT = 0.3;
    this.shake = 12;
    SFX.hurt();
    this.cb.onLives?.(this.lives);
    if (this.lives <= 0) {
      this.ended = true;
      this.particles.explosion(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, true);
      setTimeout(() => this.cb.onGameOver?.(this.score, 'dead'), 700);
    }
  }

  _timeUp() {
    if (this.ended) return;
    this.ended = true;
    this.lives = 0;
    this.cb.onLives?.(0);
    this.particles.explosion(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, true);
    SFX.hurt();
    setTimeout(() => this.cb.onGameOver?.(this.score, 'timeout'), 700);
  }

  _update(dt) {
    if (this.ended) { this.particles.update(dt); return; }
    this.time += dt;
    const remaining = Math.max(0, TIME_LIMIT - this.time);
    const remainingWhole = Math.ceil(remaining);
    if (remainingWhole !== this._lastTimeEmit) {
      this._lastTimeEmit = remainingWhole;
      this.cb.onTime?.(remainingWhole);
    }
    if (remaining <= 0) { this._timeUp(); return; }
    const input = this.input;
    const prevWeapon = this.player.weapon;
    const prevAmmo = this.player.ammo;
    const prevReloading = this.player.reloading;

    updatePlayerPhysics(this.player, input, dt, this.platforms);
    if (this.player.moving && this.player.onGround && Math.random() < 0.3) {
      this.particles.dust(this.player.x + this.player.w / 2, this.player.y + this.player.h, this.player.facing);
    }
    const newBullets = tryFire(this.player, input, this.particles);
    if (newBullets) { this.playerBullets.push(...newBullets); SFX[this.player.weapon === 'fire' ? 'flame' : 'shoot'](); }
    if (this.player.ammo !== prevAmmo || this.player.reloading !== prevReloading) {
      this.cb.onAmmo?.({ ammo: this.player.ammo, max: MAGAZINE_SIZE, reloading: this.player.reloading });
      if (this.player.reloading && !prevReloading) SFX.reload();
    }

    updateBullets(this.playerBullets, dt, this.player.weapon === 'fire' ? this.particles : null);
    updateBullets(this.enemyBullets, dt, null);
    this.playerBullets = this.playerBullets.filter(b => b.life > 0 && b.x > this.camX - 60 && b.x < this.camX + W + 60);
    this.enemyBullets = this.enemyBullets.filter(b => {
      if (b.explode) { this.particles.explosion(b.x, b.y, false); return false; }
      return b.life > 0 && b.x > this.camX - 80 && b.x < this.camX + W + 80 && b.y < H + 60;
    });

    // spawn
    for (const s of this.spawnTable) {
      if (!s.done && s.x < this.camX + W + 40) {
        s.done = true;
        let e;
        if (s.type === 'soldier') e = createSoldierEnemy(s.x);
        else if (s.type === 'turret') e = createTurretEnemy(s.x);
        else e = createGrenadierEnemy(s.x);
        if (s.capsule) e.carriesCapsule = s.capsule;
        this.enemies.push(e);
      }
    }

    for (const e of this.enemies) updateEnemy(e, dt, this.player, this.enemyBullets, this.particles);

    // player bullets vs enemies
    const pHit = playerHitbox(this.player);
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const ebox = { x: e.x, y: e.y - (e.type === 'turret' ? 22 * e.popT : 0), w: e.w, h: e.h + (e.type === 'turret' ? 22 * e.popT : 0) };
      if (e.type === 'turret' && e.popT < 0.5) continue;
      for (const b of this.playerBullets) {
        if (b.dead) continue;
        if (b.pierce && b.hitIds.has(e.id)) continue;
        if (overlap(bulletBox(b), ebox)) {
          if (b.pierce) b.hitIds.add(e.id); else b.dead = true;
          e.hp -= b.dmg;
          e.hurtT = 0.12;
          this.particles.spark(b.x, b.y, '#ffdd80', 6);
          if (e.hp <= 0) {
            e.alive = false;
            // style bonus: any kill landed while airborne is worth a flat 500,
            // overriding the enemy's normal point value
            this.score += this.player.onGround ? e.scoreValue : SCORE.AIRBORNE_KILL;
            this.cb.onScore?.(this.score);
            this.particles.explosion(e.x + e.w / 2, e.y + e.h / 2 - (e.type === 'turret' ? 14 : 0));
            SFX.explode();
            if (e.carriesCapsule) this.pickups.push(createPickup(e.x + e.w / 2, e.y + e.h / 2, e.carriesCapsule));
          } else SFX.hit();
        }
      }
    }
    this.playerBullets = this.playerBullets.filter(b => !b.dead);
    this.enemies = this.enemies.filter(e => e.alive);

    // enemies / enemy bullets vs player
    for (const e of this.enemies) {
      const ebox = { x: e.x, y: e.y - (e.type === 'turret' ? 22 * e.popT : 0), w: e.w, h: e.h + (e.type === 'turret' ? 22 * e.popT : 0) };
      if (overlap(pHit, ebox)) this._hurtPlayer();
    }
    for (const b of this.enemyBullets) {
      if (b.dead) continue;
      if (overlap(bulletBox(b), pHit)) { b.dead = true; this._hurtPlayer(); }
    }
    this.enemyBullets = this.enemyBullets.filter(b => !b.dead);

    // pickups
    for (const pk of this.pickups) {
      if (!pk.alive) continue;
      pk.bobT = (pk.bobT || 0) + dt * 3;
      if (overlap(pHit, { x: pk.x - 10, y: pk.y - 12, w: 20, h: 24 })) {
        pk.alive = false;
        if (pk.weaponKey === 'rapid') {
          this.player.rapidFire = true;
          this.cb.onRapid?.(true);
        } else {
          this.player.weapon = pk.weaponKey;
          // a new gun comes with a fresh magazine
          this.player.ammo = MAGAZINE_SIZE;
          this.player.reloading = false;
          this.player.reloadT = 0;
        }
        SFX.pickup();
      }
    }
    this.pickups = this.pickups.filter(p => p.alive);
    if (this.player.weapon !== prevWeapon) this.cb.onWeapon?.(this.player.weapon);

    // boss — trigger well before the arena so the camera has time to pan the
    // boss into view before the player can physically reach/collide with it
    if (!this.bossTriggered && this.player.x > BOSS_X - 320) {
      this.bossTriggered = true;
      this.boss = createBoss(BOSS_X);
      this.bossGraceT = 0.8; // brief no-contact window while the arena settles into view
      this.cb.onBoss?.({ hp: this.boss.hp, maxHp: this.boss.maxHp });
    }
    if (this.bossGraceT > 0) this.bossGraceT -= dt;
    if (this.boss && !this.boss.dead) {
      updateBoss(this.boss, dt, this.player, this.enemyBullets, this.particles);
      const bbox = { x: this.boss.x, y: this.boss.y, w: this.boss.w, h: this.boss.h };
      if (this.bossGraceT <= 0 && overlap(pHit, bbox)) this._hurtPlayer();
      for (const b of this.playerBullets) {
        if (b.dead) continue;
        if (b.pierce && b.hitIds.has('boss')) continue;
        if (this.boss.coreOpen && overlap(bulletBox(b), { x: this.boss.x + this.boss.w * 0.3, y: this.boss.y + this.boss.h * 0.3, w: this.boss.w * 0.4, h: this.boss.h * 0.3 })) {
          if (b.pierce) b.hitIds.add('boss'); else b.dead = true;
          this.boss.hp -= b.dmg;
          this.boss.hurtT = 0.12;
          this.particles.spark(b.x, b.y, '#ff9060', 8);
          SFX.bossHit();
          this.cb.onBoss?.({ hp: Math.max(0, this.boss.hp), maxHp: this.boss.maxHp });
          if (this.boss.hp <= 0) {
            this.boss.dead = true;
            this.ended = true;
            this.shake = 24;
            this.particles.explosion(this.boss.x + this.boss.w / 2, this.boss.y + this.boss.h / 2, true);
            const timeBonus = Math.max(0, Math.floor(TIME_LIMIT - this.time)) * SCORE.TIME_BONUS_PER_SEC;
            this.score += SCORE.BOSS + timeBonus;
            this.cb.onScore?.(this.score);
            setTimeout(() => this.cb.onWin?.(this.score, timeBonus), 1100);
          }
        }
      }
      this.playerBullets = this.playerBullets.filter(b => !b.dead);
    }

    this.particles.update(dt);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 46);

    // camera
    const maxCam = LEVEL_WIDTH - W;
    const targetCam = this.bossTriggered ? Math.min(maxCam, BOSS_X + 260 - W) : this.player.x - W / 2;
    this.camX += (Math.max(0, Math.min(maxCam, targetCam)) - this.camX) * Math.min(1, dt * 6);
  }

  _draw() {
    const ctx = this.ctx;
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);

    drawBackground(ctx, this.camX, this.time);

    for (const pf of this.platforms) {
      if (pf.x + pf.w < this.camX || pf.x > this.camX + W) continue;
      const px = pf.x - this.camX;
      drawGroundShadow(ctx, px + pf.w / 2, pf.y + pf.h + 4, pf.w * 0.4, 0.25);
      ctx.fillStyle = '#6e6024';
      ctx.fillRect(px, pf.y + 6, pf.w, pf.h - 6);
      ctx.strokeStyle = '#4f4519';
      ctx.lineWidth = 1;
      for (let bx = 0; bx < pf.w; bx += 23) ctx.strokeRect(px + bx, pf.y + 6, 23, pf.h - 6);
      ctx.fillStyle = '#1f9a2c';
      ctx.fillRect(px, pf.y + 3, pf.w, 5);
      ctx.fillStyle = '#3fd44a';
      ctx.fillRect(px, pf.y, pf.w, 4);
    }

    for (const pk of this.pickups) {
      drawCapsule(ctx, pk.x - this.camX, pk.y, pk.letter, pk.bobT, pk.color);
    }

    for (const e of this.enemies) {
      if (e.x + e.w < this.camX - 40 || e.x > this.camX + W + 40) continue;
      const sx = e.x - this.camX + e.w / 2;
      if (e.type === 'turret') {
        drawGroundShadow(ctx, sx, e.y + 4, 16, 0.3);
        drawTurret(ctx, { x: sx, y: e.y, popT: e.popT, aimAngle: angleToPlayer(e, this.player), facing: 1, hitFlash: e.hurtT > 0 });
      } else {
        drawGroundShadow(ctx, sx, e.y + e.h, e.w * 0.5, 0.35);
        drawSoldier(ctx, {
          x: sx, y: e.y + e.h, facing: e.facing, aimAngle: 0, legPhase: e.legPhase || 0,
          pants: '#a03838', headband: '#3454a0', hitFlash: e.hurtT > 0, moving: e.vx !== 0,
        });
      }
    }

    if (this.boss) {
      drawBossWall(ctx, {
        x: this.boss.x - this.camX, y: this.boss.y, w: this.boss.w, h: this.boss.h,
        hpPct: Math.max(0, this.boss.hp / this.boss.maxHp), coreOpen: this.boss.coreOpen,
        hitFlash: this.boss.hurtT > 0, time: this.boss.time, armL: this.boss.armL, armR: this.boss.armR,
      });
    }

    for (const b of this.playerBullets) drawBullet(ctx, b.x - this.camX, b.y, b.angle, b.color, b.flame ? 6 : (b.pierce ? 20 : 12), b.pierce);
    for (const b of this.enemyBullets) drawBullet(ctx, b.x - this.camX, b.y, b.angle, b.color, 9);

    this.particles.draw(ctx, this.camX);

    if (this.player.alive && !(this.ended && this.lives <= 0)) {
      const blink = this.player.invT > 0 && Math.floor(this.player.invT * 18) % 2 === 0;
      if (!blink) {
        drawGroundShadow(ctx, this.player.x - this.camX + this.player.w / 2, this.player.y + this.player.h, this.player.w * 0.55, 0.4);
        drawSoldier(ctx, {
          x: this.player.x - this.camX + this.player.w / 2, y: this.player.y + this.player.h,
          facing: this.player.facing, aimAngle: this.player.aimAngle, legPhase: this.player.legPhase,
          crouch: this.player.crouch, moving: this.player.moving, airborne: this.player.airborne,
          hitFlash: this.player.hurtFlashT > 0, face: true,
        });
      }
      if (this.player.reloading) {
        const bx = this.player.x - this.camX + this.player.w / 2;
        const by = this.player.y + this.player.h - 78;
        const pct = 1 - this.player.reloadT / RELOAD_TIME;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(bx - 16, by, 32, 6);
        ctx.fillStyle = '#ffe066';
        ctx.fillRect(bx - 16, by, 32 * Math.max(0, Math.min(1, pct)), 6);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx - 16, by, 32, 6);
        ctx.fillStyle = '#fff';
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        // plain ASCII on purpose: the pixel font's canvas glyphs render
        // Vietnamese combining diacritics with stray marks at this size
        ctx.fillText('RELOAD', bx, by - 4);
      }
    }

    drawForegroundOcclusion(ctx, this.camX, this.time);

    ctx.restore();
  }
}

function angleToPlayer(e, player) {
  const dx = (player.x + player.w / 2) - (e.x + e.w / 2);
  const dy = (player.y + player.h * 0.5) - (e.y - 22);
  return Math.atan2(-dy, dx);
}
