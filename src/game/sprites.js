// Procedural "flat-shaded pixel" sprites — no external art assets.
// Hard 2-tone blocks + dark outlines (not soft gradients) for a crisper,
// more retro-commando read; posed/rotated per-frame for 8-direction aiming.

function shadeRect(ctx, x, y, w, h, light, dark, horizontal = true) {
  const g = horizontal ? ctx.createLinearGradient(x, 0, x + w, 0) : ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, light);
  g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

// flat block with a hard-edge shadow strip on one side + a thin dark outline
function block(ctx, x, y, w, h, color, outline = '#0c0f0a', shadowSide = 'right', shadowColor = null) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  if (shadowColor) {
    const sw = Math.max(1.5, w * 0.3);
    ctx.fillStyle = shadowColor;
    if (shadowSide === 'right') ctx.fillRect(x + w - sw, y, sw, h);
    else if (shadowSide === 'bottom') ctx.fillRect(x, y + h - sw, w, sw);
    else if (shadowSide === 'left') ctx.fillRect(x, y, sw, h);
  }
  if (outline) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(x, y, w, h);
  }
}

function darken(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (n >> 16) - amt), g = Math.max(0, ((n >> 8) & 255) - amt), b = Math.max(0, (n & 255) - amt);
  return `rgb(${r},${g},${b})`;
}

// Optional real-photo face texture for the player head, swapped in for the
// flat drawn skin+hair circle when opts.face is passed to drawSoldier.
// Selectable per character-select screen; defaults to the player's own photo.
const playerFaceImg = new Image();
playerFaceImg.src = '/face.png';
export function setPlayerFace(src) {
  if (src && playerFaceImg.src.indexOf(src) === -1) playerFaceImg.src = src;
}

// The boss's core always reveals the same fixed face regardless of which
// playable character was picked — that's the joke, it's always "you".
const bossFaceImg = new Image();
bossFaceImg.src = '/bossface.png';

// Real uniform-fabric swatch, tiled as a fill pattern over the player's
// jumpsuit blocks (torso/arms/legs) instead of a flat color, when opts.face
// is set — reuses the same "this is the real player" flag as the face photo.
const uniformImg = new Image();
uniformImg.src = '/uniform.png';
let uniformPattern = null;
function getUniformFill(ctx, fallback) {
  if (!uniformPattern && uniformImg.complete && uniformImg.naturalWidth) {
    uniformPattern = ctx.createPattern(uniformImg, 'repeat');
  }
  return uniformPattern || fallback;
}

function drawFaceHead(ctx, cx, cy, r, facing, outline, img = playerFaceImg) {
  if (!img.complete || !img.naturalWidth) return false;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const size = r * 2.15;
  ctx.translate(cx, cy);
  if (facing < 0) ctx.scale(-1, 1);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
  if (outline) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  return true;
}

export function drawGroundShadow(ctx, x, y, w, alpha = 0.4) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x, y, w, w * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// direction vector for a gun aimed at angle `a` (0 = horizontal forward, PI/2 = straight up)
export function aimVector(aimAngle, facing) {
  return { dx: Math.cos(aimAngle) * facing, dy: -Math.sin(aimAngle) };
}

export function getMuzzlePoint(x, y, scale, facing, aimAngle, crouch) {
  const shoulderY = y - scale * (crouch ? 10 : 37);
  const shoulderX = x + facing * scale * (crouch ? 20 : 4);
  const { dx, dy } = aimVector(aimAngle, facing);
  const armLen = scale * (crouch ? 13 : 30);
  return { x: shoulderX + dx * armLen, y: shoulderY + dy * armLen, dx, dy };
}

let soldierBuf = null;
const BUF_OX = 50, BUF_OY = 72;
function getSoldierBuffer() {
  if (!soldierBuf) {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    soldierBuf = { canvas, ctx: canvas.getContext('2d') };
  }
  return soldierBuf;
}

export function drawSoldier(ctx, opts) {
  const { x, y, hitFlash = false, alpha = 1 } = opts;
  if (!hitFlash) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    paintSoldierBody(ctx, opts);
    ctx.restore();
    return;
  }
  // Flashing sprites are painted into an isolated offscreen buffer first so the
  // white "hit" overlay (source-atop) only tints the sprite's own pixels instead
  // of everything already drawn on the main canvas underneath it.
  const buf = getSoldierBuffer();
  const bctx = buf.ctx;
  bctx.clearRect(0, 0, buf.canvas.width, buf.canvas.height);
  bctx.save();
  bctx.globalAlpha = alpha;
  bctx.translate(BUF_OX, BUF_OY);
  paintSoldierBody(bctx, opts);
  bctx.restore();
  bctx.save();
  bctx.globalCompositeOperation = 'source-atop';
  bctx.fillStyle = 'rgba(255,255,255,0.8)';
  bctx.fillRect(0, 0, buf.canvas.width, buf.canvas.height);
  bctx.restore();
  ctx.drawImage(buf.canvas, x - BUF_OX, y - BUF_OY);
}

function paintSoldierBody(ctx, opts) {
  const {
    facing = 1, aimAngle = 0, legPhase = 0, crouch = false,
    pants = '#4a6b46', skin = '#d99a6c', strap = '#2a1f12',
    moving = false, airborne = false, headband = '#c0392b', face = false,
  } = opts;
  const uniform = face ? getUniformFill(ctx, pants) : pants;
  const pantsDark = darken(pants, 45);
  const outline = '#0c0f0a';
  const { dx, dy } = aimVector(aimAngle, facing);
  const gunColor = '#20242a';

  if (crouch) {
    paintCrouch(ctx, { facing, dx, dy, pants, uniform, pantsDark, skin, strap, headband, outline, gunColor, face });
    return;
  }

  const hipY = -22;

  // legs (swing while running)
  const swing = moving && !airborne ? Math.sin(legPhase) * 14 : (airborne ? 10 : 0);
  ctx.save();
  ctx.translate(-facing * 3, hipY);
  ctx.rotate((swing / 90) * (Math.PI / 5) * facing);
  block(ctx, -3.5, 0, 7, 23, uniform, outline, 'right', pantsDark);
  ctx.restore();
  ctx.save();
  ctx.translate(facing * 3, hipY);
  ctx.rotate((-swing / 90) * (Math.PI / 5) * facing);
  block(ctx, -3.5, 0, 7, 23, uniform, outline, 'left', pantsDark);
  ctx.restore();
  // boots
  block(ctx, -facing * 3 - 4, hipY + 20, 8, 4, '#1c1c1c', outline);
  block(ctx, facing * 3 - 4, hipY + 20, 8, 4, '#1c1c1c', outline);

  // uniform jumpsuit torso, rifle sling across the chest
  block(ctx, -7, hipY - 19, 14, 19, uniform, outline, 'right', pantsDark);
  ctx.strokeStyle = strap;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-facing * 6, hipY - 19);
  ctx.lineTo(facing * 5, hipY - 2);
  ctx.stroke();

  // back arm (static, behind torso)
  ctx.save();
  ctx.translate(-facing * 4, hipY - 16);
  ctx.rotate(facing * 0.5);
  block(ctx, -2.5, 0, 5, 15, uniform, outline, 'right', pantsDark);
  ctx.restore();

  // head
  const headY = hipY - 19 - 8;
  const gotFace = face && drawFaceHead(ctx, facing * 1.5, headY, 6.8, facing, outline);
  if (!gotFace) {
    ctx.beginPath();
    ctx.fillStyle = skin;
    ctx.arc(facing * 1.5, headY, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#241a12';
    ctx.beginPath();
    ctx.arc(facing * 1.5, headY - 2.5, 6.2, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = headband;
    ctx.fillRect(facing * 1.5 - 6.4, headY - 2, 12.8, 3);
    ctx.fillRect(-facing * 7.5, headY - 1.2, facing * -5, 2.2);
  }

  // gun arm (front, rotated to aim)
  const shoulderX = facing * 4;
  const shoulderY = hipY - 15;
  const armLen = 15;
  const elbowX = shoulderX + dx * armLen;
  const elbowY = shoulderY + dy * armLen;
  ctx.strokeStyle = uniform;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(elbowX, elbowY);
  ctx.stroke();
  drawGunBarrel(ctx, elbowX, elbowY, dx, dy, gunColor, outline);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(elbowX, elbowY, 2.7, 0, Math.PI * 2);
  ctx.fill();
}

// AK-style rifle: wood stock behind the grip, receiver, long barrel, and a
// curved "banana" magazine — drawn in the gun's own rotated local space so
// it reads correctly at any of the 8 aim directions.
function drawGunBarrel(ctx, sx, sy, dx, dy, color, outline) {
  const angle = Math.atan2(dy, dx);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(angle);
  ctx.lineWidth = 1;
  ctx.strokeStyle = outline;

  // wood stock (behind the grip)
  ctx.fillStyle = '#7a5330';
  ctx.fillRect(-12, -2.1, 8, 4.2);
  ctx.strokeRect(-12, -2.1, 8, 4.2);

  // curved banana magazine, hanging forward-down from the receiver
  ctx.fillStyle = '#24262b';
  ctx.beginPath();
  ctx.moveTo(0, 2.2);
  ctx.quadraticCurveTo(2.5, 9, 7.5, 14.5);
  ctx.quadraticCurveTo(5, 10, 3, 2.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // receiver body
  ctx.fillStyle = color;
  ctx.fillRect(-4, -2.6, 10, 5.2);
  ctx.strokeRect(-4, -2.6, 10, 5.2);

  // barrel
  ctx.fillStyle = '#17191d';
  ctx.fillRect(6, -1.2, 15, 2.4);
  ctx.strokeRect(6, -1.2, 15, 2.4);
  ctx.restore();
}

// True prone pose: the whole body lies flat along the ground, propped up on
// the gun arm, so the muzzle sits right at ground level — this is what lines
// up with low turrets, matching the original game's "hit the deck and return
// fire" trick instead of just a shorter standing stance.
function paintCrouch(ctx, p) {
  const { facing, dx, dy, pants, uniform, pantsDark, skin, strap, headband, outline, gunColor, face } = p;

  const hipX = -facing * 3, hipY = -6;
  const chestX = facing * 14, chestY = -10;
  const feetX = hipX - facing * 21, feetY = -2;

  // legs, lying flat and trailing behind the hip toward the feet
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(Math.atan2(feetY - hipY, feetX - hipX));
  const legL = Math.hypot(feetX - hipX, feetY - hipY);
  block(ctx, 0, -3.5, legL, 7, uniform, outline, 'right', pantsDark);
  ctx.restore();
  block(ctx, feetX - 4, feetY - 3, 8, 4, '#1c1c1c', outline);

  // torso, propped up from hip toward the chest/head
  ctx.save();
  ctx.translate(hipX, hipY);
  const tAng = Math.atan2(chestY - hipY, chestX - hipX);
  ctx.rotate(tAng);
  const torsoL = Math.hypot(chestX - hipX, chestY - hipY);
  block(ctx, 0, -5.5, torsoL, 11, uniform, outline, 'right', pantsDark);
  ctx.restore();
  ctx.strokeStyle = strap;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY - 2);
  ctx.lineTo(chestX, chestY + 2);
  ctx.stroke();

  // head, propped up at the front
  const headX = chestX + facing * 6, headY = chestY - 3;
  const gotFace = face && drawFaceHead(ctx, headX, headY, 5.9, facing, outline);
  if (!gotFace) {
    ctx.beginPath();
    ctx.fillStyle = skin;
    ctx.arc(headX, headY, 5.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#241a12';
    ctx.beginPath();
    ctx.arc(headX, headY - 1.5, 5.4, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = headband;
    ctx.fillRect(headX + facing * 1.2 - 5.6, headY - 1.6, 11.2, 2.6);
  }

  // gun arm, propped forward right at ground level
  const shoulderX = chestX + facing * 4, shoulderY = chestY;
  const armLen = 9;
  const elbowX = shoulderX + dx * armLen, elbowY = shoulderY + dy * armLen;
  ctx.strokeStyle = uniform;
  ctx.lineWidth = 4.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(elbowX, elbowY);
  ctx.stroke();
  drawGunBarrel(ctx, elbowX, elbowY, dx, dy, gunColor, outline);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(elbowX, elbowY, 2.3, 0, Math.PI * 2);
  ctx.fill();
}

export function drawTurret(ctx, opts) {
  const { x, y, scale = 1, popT = 1, aimAngle = 0, facing = -1, hitFlash = false } = opts;
  ctx.save();
  ctx.translate(x, y);
  // base housing
  const domeH = 18 * popT;
  shadeRect(ctx, -16, -4, 32, 6, '#6b6b6b', '#333');
  ctx.beginPath();
  ctx.fillStyle = hitFlash ? '#fff' : '#555';
  ctx.moveTo(-14, -4);
  ctx.quadraticCurveTo(0, -4 - domeH * 1.6, 14, -4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // eye/core
  ctx.fillStyle = hitFlash ? '#fff' : '#ff4d4d';
  ctx.beginPath();
  ctx.arc(0, -4 - domeH * 0.9, 3.4 * popT, 0, Math.PI * 2);
  ctx.fill();
  // barrel
  const { dx, dy } = aimVector(aimAngle, facing);
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const bx = 0, by = -4 - domeH * 0.9;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + dx * 18 * popT, by + dy * 18 * popT);
  ctx.stroke();
  ctx.restore();
}

export function drawCapsule(ctx, x, y, letter, bobT, color) {
  const by = y + Math.sin(bobT) * 4;
  ctx.save();
  ctx.translate(x, by);
  const g = ctx.createLinearGradient(-10, 0, 10, 0);
  g.addColorStop(0, '#dfe6ee');
  g.addColorStop(1, '#8fa0b3');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(-10, -12, 20, 24, 6) : ctx.rect(-10, -12, 20, 24);
  ctx.fill();
  ctx.strokeStyle = '#2a323c';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 0, 1);
  ctx.restore();
}

// Boss: organic-mechanical wall bunker with a pulsing weak-point core.
export function drawBossWall(ctx, opts) {
  const { x, y, w, h, hpPct, coreOpen, hitFlash, time, armL, armR } = opts;
  ctx.save();
  ctx.translate(x, y);

  // cracked rock wall body
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#4a4238');
  g.addColorStop(1, '#241f19');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  for (let i = 0; i < 10; i++) {
    const cx = (i * 53) % w;
    const cy = (i * 97) % h;
    ctx.fillRect(cx, cy, 3, 14);
  }
  // damage cracks grow as hp drops
  ctx.strokeStyle = `rgba(255,120,60,${0.25 + 0.5 * (1 - hpPct)})`;
  ctx.lineWidth = 2;
  const crackN = Math.floor((1 - hpPct) * 10);
  for (let i = 0; i < crackN; i++) {
    ctx.beginPath();
    const sx = (i * 37) % w, sy = (i * 61) % h;
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 18, sy + 22);
    ctx.lineTo(sx - 10, sy + 40);
    ctx.stroke();
  }

  // side arm cannons
  ctx.fillStyle = '#33302a';
  ctx.fillRect(-18, h * 0.28 + armL, 20, 26);
  ctx.fillRect(-18, h * 0.62 + armR, 20, 26);
  ctx.fillStyle = '#151311';
  ctx.beginPath(); ctx.arc(-18, h * 0.28 + armL + 13, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-18, h * 0.62 + armR + 13, 6, 0, Math.PI * 2); ctx.fill();

  // core
  const coreY = h * 0.46;
  const coreR = (coreOpen ? 30 : 14) * (hitFlash ? 1.15 : 1);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const pulse = 0.6 + 0.4 * Math.sin(time * 6);
  const cg = ctx.createRadialGradient(w * 0.5, coreY, 0, w * 0.5, coreY, coreR * 1.8);
  cg.addColorStop(0, `rgba(255,${coreOpen ? 90 : 60},60,${0.9 * pulse})`);
  cg.addColorStop(1, 'rgba(255,60,30,0)');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(w * 0.5, coreY, coreR * 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // the "true face" behind the wall — only exposed while the core hatch is open
  const gotBossFace = coreOpen && !hitFlash && drawFaceHead(ctx, w * 0.5, coreY, coreR, 1, null, bossFaceImg);
  if (gotBossFace) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = `rgba(255,60,40,${0.32 + 0.12 * Math.sin(time * 6)})`;
    ctx.beginPath();
    ctx.arc(w * 0.5, coreY, coreR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    ctx.fillStyle = hitFlash ? '#fff' : (coreOpen ? '#ff5a3c' : '#7a2e20');
    ctx.beginPath();
    ctx.arc(w * 0.5, coreY, coreR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(w * 0.5, coreY, coreR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

export function drawBullet(ctx, x, y, angle, color, len = 10, glow = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (glow) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = color;
    ctx.fillRect(-len - 5, -5, len + 10, 10);
    ctx.restore();
  }
  const g = ctx.createLinearGradient(-len, 0, 0, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, color);
  ctx.fillStyle = g;
  ctx.fillRect(-len, glow ? -2.2 : -1.6, len, glow ? 4.4 : 3.2);
  if (glow) {
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.8;
    ctx.fillRect(-len * 0.5, -0.9, len * 0.5, 1.8);
  }
  ctx.restore();
}
