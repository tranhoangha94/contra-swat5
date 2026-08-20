// Procedural particle system: sparks, smoke, muzzle flash light, dust, debris.
export class ParticleSystem {
  constructor() {
    this.list = [];
    this.lights = []; // transient point lights: {x,y,r,color,life,maxLife}
  }

  spark(x, y, color = '#ffcf5c', n = 10, power = 220) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = power * (0.3 + Math.random() * 0.8);
      this.list.push({
        type: 'spark', x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
        life: 0.25 + Math.random() * 0.25, maxLife: 0.5, color, r: 1.5 + Math.random() * 2, gravity: 500,
      });
    }
  }

  explosion(x, y, big = false) {
    const n = big ? 34 : 18;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = (big ? 260 : 170) * (0.3 + Math.random());
      this.list.push({
        type: 'fire', x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 60,
        life: 0.35 + Math.random() * 0.4, maxLife: 0.75, r: (big ? 4 : 2.5) + Math.random() * 4, gravity: 260,
      });
    }
    for (let i = 0; i < (big ? 16 : 8); i++) {
      this.list.push({
        type: 'smoke', x: x + (Math.random() - 0.5) * 12, y: y + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 40, vy: -40 - Math.random() * 60,
        life: 0.6 + Math.random() * 0.6, maxLife: 1.2, r: (big ? 10 : 6) + Math.random() * 10, gravity: -20,
      });
    }
    this.lights.push({ x, y, r: big ? 140 : 80, color: '255,180,80', life: 0.25, maxLife: 0.25 });
  }

  muzzleFlash(x, y, color = '255,220,140') {
    this.lights.push({ x, y, r: 55, color, life: 0.06, maxLife: 0.06 });
  }

  dust(x, y, dir = 1) {
    for (let i = 0; i < 3; i++) {
      this.list.push({
        type: 'dust', x, y, vx: -dir * (30 + Math.random() * 40), vy: -20 - Math.random() * 30,
        life: 0.3 + Math.random() * 0.2, maxLife: 0.5, r: 2 + Math.random() * 2, gravity: 200,
      });
    }
  }

  flame(x, y, dir = 1) {
    for (let i = 0; i < 2; i++) {
      this.list.push({
        type: 'fire', x, y: y + (Math.random() - 0.5) * 6,
        vx: dir * (260 + Math.random() * 120), vy: (Math.random() - 0.5) * 60,
        life: 0.18 + Math.random() * 0.12, maxLife: 0.3, r: 4 + Math.random() * 4, gravity: -40,
      });
    }
  }

  update(dt) {
    for (const p of this.list) {
      p.vy += (p.gravity || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.list = this.list.filter(p => p.life > 0);
    for (const l of this.lights) l.life -= dt;
    this.lights = this.lights.filter(l => l.life > 0);
  }

  draw(ctx, camX) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const l of this.lights) {
      const t = l.life / l.maxLife;
      const g = ctx.createRadialGradient(l.x - camX, l.y, 0, l.x - camX, l.y, l.r * (0.6 + 0.4 * t));
      g.addColorStop(0, `rgba(${l.color},${0.55 * t})`);
      g.addColorStop(1, `rgba(${l.color},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(l.x - camX, l.y, l.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const p of this.list) {
      const t = Math.max(0, p.life / p.maxLife);
      if (p.type === 'smoke') {
        ctx.globalAlpha = t * 0.35;
        ctx.fillStyle = '#888';
      } else if (p.type === 'fire') {
        ctx.globalAlpha = t;
        ctx.fillStyle = t > 0.5 ? '#fff3b0' : '#ff6a2b';
      } else if (p.type === 'dust') {
        ctx.globalAlpha = t * 0.5;
        ctx.fillStyle = '#c9b896';
      } else {
        ctx.globalAlpha = t;
        ctx.fillStyle = p.color;
      }
      ctx.beginPath();
      ctx.arc(p.x - camX, p.y, p.r * (p.type === 'smoke' ? (1.6 - t) : t), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
