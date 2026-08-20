import { CANVAS_W as W, CANVAS_H as H, GROUND_Y, COLORS } from './constants.js';

// Deterministic pseudo-random so stars/foliage don't jitter frame to frame.
function hash(n) {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

function drawStars(ctx, camX, t) {
  for (let i = 0; i < 90; i++) {
    const wx = (i * 733) % (W * 6);
    const x = ((wx - camX * 0.05) % (W + 40) + (W + 40)) % (W + 40) - 20;
    const y = 20 + hash(i) * (GROUND_Y - 260);
    const tw = 0.55 + 0.45 * Math.sin(t * 2 + i * 3.1);
    ctx.globalAlpha = tw * (0.4 + hash(i + 50) * 0.6);
    ctx.fillStyle = COLORS.star;
    const s = hash(i + 99) > 0.8 ? 2 : 1;
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;
}

function drawMountains(ctx, camX) {
  const spacing = 300;
  const off = -(camX * 0.15) % spacing;
  const baseY = GROUND_Y - 190;
  ctx.fillStyle = COLORS.mountainDark;
  for (let i = -1; i < W / spacing + 2; i++) {
    const bx = off + i * spacing;
    const peakH = 120 + 40 * Math.abs(Math.sin(i * 1.7));
    ctx.beginPath();
    ctx.moveTo(bx, baseY + 60);
    ctx.lineTo(bx + 60, baseY + 60 - peakH);
    ctx.lineTo(bx + 120, baseY + 60);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = COLORS.mountain;
  for (let i = -1; i < W / spacing + 2; i++) {
    const bx = off + i * spacing;
    const peakH = 120 + 40 * Math.abs(Math.sin(i * 1.7));
    // snow cap
    ctx.beginPath();
    ctx.moveTo(bx + 60, baseY + 60 - peakH);
    ctx.lineTo(bx + 40, baseY + 60 - peakH * 0.62);
    ctx.lineTo(bx + 80, baseY + 60 - peakH * 0.62);
    ctx.closePath();
    ctx.fill();
  }
}

function canopyBlob(ctx, cx, topY, r) {
  ctx.beginPath();
  ctx.moveTo(cx - r, topY + r * 0.7);
  ctx.bezierCurveTo(cx - r, topY - r * 0.6, cx - r * 0.4, topY - r * 1.15, cx, topY - r * 1.1);
  ctx.bezierCurveTo(cx + r * 0.5, topY - r * 1.2, cx + r, topY - r * 0.5, cx + r, topY + r * 0.7);
  ctx.bezierCurveTo(cx + r * 0.6, topY + r * 0.95, cx - r * 0.6, topY + r * 0.95, cx - r, topY + r * 0.7);
  ctx.closePath();
  ctx.fill();
}

function drawCanopy(ctx, camX, parallax, colorTop, colorShade, baseY, spacing, rMin, rMax, seedOff) {
  const off = -(camX * parallax) % spacing;
  for (let i = -1; i < W / spacing + 2; i++) {
    const bx = off + i * spacing;
    const seed = i + seedOff;
    const r = rMin + hash(seed) * (rMax - rMin);
    const cy = baseY - r * 0.3 + hash(seed + 7) * 14;
    // trunk
    ctx.strokeStyle = COLORS.trunk;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(bx, GROUND_Y - 2);
    ctx.lineTo(bx, cy + r * 0.4);
    ctx.stroke();
    ctx.fillStyle = colorShade;
    canopyBlob(ctx, bx, cy + 4, r);
    ctx.fillStyle = colorTop;
    canopyBlob(ctx, bx - r * 0.15, cy, r * 0.92);
  }
}

export function drawBackground(ctx, camX, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, COLORS.sky1);
  sky.addColorStop(0.6, COLORS.sky2);
  sky.addColorStop(1, COLORS.sky3);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  drawStars(ctx, camX, t);
  drawMountains(ctx, camX);

  // three canopy layers: deep (far/dark), mid, near (bright, foreground-most tree line)
  drawCanopy(ctx, camX, 0.35, COLORS.canopyDeep, '#082e0e', GROUND_Y - 40, 210, 55, 78, 11);
  drawCanopy(ctx, camX, 0.55, COLORS.canopyDark, '#0e5c17', GROUND_Y - 24, 165, 48, 68, 41);
  drawCanopy(ctx, camX, 0.8, COLORS.canopy, COLORS.canopyDark, GROUND_Y - 8, 130, 42, 60, 71);

  drawGround(ctx, camX);
}

function drawGround(ctx, camX) {
  const rockTop = GROUND_Y;
  ctx.fillStyle = COLORS.rockDark;
  ctx.fillRect(0, rockTop, W, H - rockTop);

  // blocky brick pattern (two staggered rows) in olive/khaki rock tones
  const bw = 46, bh = 30;
  const offX = -(camX % bw);
  const rowOffsets = [0, bw / 2];
  for (let row = 0; row * bh < H - rockTop + bh; row++) {
    const y = rockTop + row * bh;
    const stagger = rowOffsets[row % 2];
    for (let x = offX + stagger - bw; x < W + bw; x += bw) {
      const seed = Math.round((x + camX) / bw) * 13 + row * 7;
      const light = hash(seed) > 0.5;
      ctx.fillStyle = light ? COLORS.rock : COLORS.rockDark;
      ctx.fillRect(x + 1, y + 1, bw - 2, bh - 2);
    }
  }
  ctx.strokeStyle = COLORS.rockLine;
  ctx.lineWidth = 1;
  for (let row = 0; row * bh < H - rockTop + bh; row++) {
    const y = rockTop + row * bh;
    const stagger = rowOffsets[row % 2];
    for (let x = offX + stagger - bw; x < W + bw; x += bw) {
      ctx.strokeRect(x + 0.5, y + 0.5, bw - 1, bh - 1);
    }
  }

  // grass cap along the top edge
  ctx.fillStyle = COLORS.grassDark;
  ctx.fillRect(0, rockTop - 6, W, 8);
  ctx.fillStyle = COLORS.grass;
  ctx.fillRect(0, rockTop - 8, W, 6);
  const tuftOff = -(camX % 22);
  for (let x = tuftOff; x < W; x += 22) {
    ctx.fillRect(x, rockTop - 12, 4, 6);
  }

  // a glimpse of river water peeking at the very bottom of the frame
  const waterY = H - 14;
  ctx.fillStyle = COLORS.water;
  ctx.fillRect(0, waterY, W, 14);
  ctx.fillStyle = COLORS.waterFoam;
  const foamOff = -(camX * 1.1) % 24;
  for (let x = foamOff; x < W; x += 24) {
    ctx.beginPath();
    ctx.arc(x, waterY, 6, 0, Math.PI, true);
    ctx.fill();
  }
}

export function drawForegroundOcclusion(ctx, camX, t) {
  ctx.fillStyle = COLORS.canopyDeep;
  const spacing = 480;
  const off = -(camX * 1.25) % spacing;
  for (let i = -1; i < W / spacing + 2; i++) {
    const bx = off + i * spacing;
    ctx.save();
    ctx.translate(bx, -20 + Math.sin(t * 0.4 + i) * 4);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(60, 40, 20, 130);
    ctx.quadraticCurveTo(-10, 60, -40, 20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
