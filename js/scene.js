// Tank scenery: room behind the glass, water, light rays, sand, seaweed and decorations.
import { H, SURFACE_Y, FLOOR_Y, floorAt, mulberry32 } from './world.js';
import { TAU, ell, rrect, sparkle } from './draw.js';

export function buildScene(theme, W, seed) {
  const rng = mulberry32(seed);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const weeds = [], pebbles = [], decor = [], far = [], rays = [];
  for (let x = 30; x < W; x += 50 + rng() * 90) {
    weeds.push({ x, h: 60 + rng() * 140, w: 10 + rng() * 10, ph: rng() * TAU, c: pick(theme.weed) });
  }
  for (let i = 0; i < W / 6; i++) {
    pebbles.push({ x: rng() * W, dy: 8 + rng() * 80, r: 1.5 + rng() * 3.5, c: pick(theme.pebbles) });
  }
  pebbles.sort((a, b) => a.x - b.x);
  for (let x = -200; x < W * 0.6 + 1800; x += 160 + rng() * 220) far.push({ x, w: 180 + rng() * 260, h: 60 + rng() * 130 });
  for (let i = 0; i < 9; i++) rays.push({ x: rng() * (W * 0.4 + 1400) - 200, w: 40 + rng() * 90, sk: 80 + rng() * 120, ph: rng() * TAU });
  let x = 300;
  while (x < W - 280) {
    decor.push({
      kind: pick(theme.decor), x, s: 0.8 + rng() * 0.45, ph: rng() * TAU,
      c: pick(['#ff7aa2', '#ff9f5a', '#c38bff', '#ffd43b', '#4dabf7', '#69db7c']),
      letter: pick(['A', 'B', 'C', 'X', 'O']),
    });
    x += 260 + rng() * 340;
  }
  return { theme, W, weeds, pebbles, decor, far, rays, grad: null, bubblers: decor.filter((d) => d.kind === 'bubbler') };
}

function drawWeed(ctx, w, t) {
  const base = floorAt(w.x) + 6, segs = 7;
  const left = [], right = [];
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const sway = Math.sin(t * 1.3 + w.ph + u * 2.2) * 16 * u;
    const cx = w.x + sway, cy = base - u * w.h, hw = (w.w * (1 - u * 0.85)) / 2;
    left.push(cx - hw, cy); right.push(cx + hw, cy);
  }
  ctx.fillStyle = w.c;
  ctx.beginPath();
  ctx.moveTo(left[0], left[1]);
  for (let i = 2; i < left.length; i += 2) ctx.lineTo(left[i], left[i + 1]);
  for (let i = right.length - 2; i >= 0; i -= 2) ctx.lineTo(right[i], right[i + 1]);
  ctx.closePath();
  ctx.fill();
}

function drawDecor(ctx, d, t) {
  const by = floorAt(d.x) + 8;
  ctx.save();
  ctx.translate(d.x, by);
  ctx.scale(d.s, d.s);
  switch (d.kind) {
    case 'castle': {
      ctx.fillStyle = '#b9a58a';
      ctx.fillRect(-60, -72, 120, 72); ctx.fillRect(-84, -112, 38, 112); ctx.fillRect(46, -112, 38, 112);
      for (let k = 0; k < 3; k++) { ctx.fillRect(-84 + k * 14, -124, 9, 12); ctx.fillRect(46 + k * 14, -124, 9, 12); }
      for (let k = 0; k < 5; k++) ctx.fillRect(-58 + k * 24, -84, 14, 12);
      ctx.fillStyle = '#d9534f';
      ctx.beginPath(); ctx.moveTo(-90, -124); ctx.lineTo(-65, -168); ctx.lineTo(-40, -124);
      ctx.moveTo(40, -124); ctx.lineTo(65, -168); ctx.lineTo(90, -124); ctx.fill();
      ctx.fillStyle = '#4a3b2a';
      ctx.beginPath(); ctx.moveTo(-17, 0); ctx.lineTo(-17, -30); ctx.arc(0, -30, 17, Math.PI, 0); ctx.lineTo(17, 0); ctx.fill();
      ctx.fillRect(-72, -96, 14, 18); ctx.fillRect(58, -96, 14, 18);
      break;
    }
    case 'chest': {
      ctx.fillStyle = '#8b5a2b'; rrect(ctx, -42, -44, 84, 44, 6); ctx.fill();
      ctx.fillStyle = '#ffd447';
      for (let k = -2; k <= 2; k++) { ell(ctx, k * 12, -46 - Math.abs(k) * -2, 9, 6); ctx.fill(); }
      ctx.save(); ctx.translate(-42, -44); ctx.rotate(-0.5 + Math.sin(t * 1.5 + d.ph) * 0.08);
      ctx.fillStyle = '#7a4c22'; rrect(ctx, 0, -32, 84, 32, 10); ctx.fill();
      ctx.fillStyle = '#e0b03a'; ctx.fillRect(0, -6, 84, 6); ctx.restore();
      ctx.fillStyle = '#e0b03a'; ctx.fillRect(-42, -26, 84, 6); ctx.fillRect(-6, -30, 12, 14);
      ctx.fillStyle = '#fff'; if (Math.sin(t * 3 + d.ph) > 0.7) sparkle(ctx, 10, -54, 8, t);
      break;
    }
    case 'coral': {
      ctx.strokeStyle = d.c; ctx.lineCap = 'round'; ctx.lineWidth = 11;
      ctx.beginPath();
      for (const [a, b, c2, e] of [[0, 0, 0, -64], [0, -30, -28, -74], [0, -40, 24, -86], [-28, -74, -38, -100], [24, -86, 32, -112], [0, -64, 6, -96]]) {
        ctx.moveTo(a, b); ctx.lineTo(c2, e);
      }
      ctx.stroke();
      break;
    }
    case 'rock': {
      ctx.fillStyle = '#7c8794'; ell(ctx, 0, -16, 48, 30); ctx.fill();
      ctx.fillStyle = '#6b7682'; ell(ctx, 32, -10, 26, 18); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ell(ctx, -12, -30, 18, 8); ctx.fill();
      break;
    }
    case 'shell': {
      ctx.fillStyle = '#ffd6c9';
      ctx.beginPath(); ctx.moveTo(0, -2); ctx.arc(0, -2, 22, Math.PI, TAU); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e8a598'; ctx.lineWidth = 2; ctx.beginPath();
      for (let k = 0; k <= 4; k++) { const a = Math.PI + (k / 4) * Math.PI; ctx.moveTo(0, -2); ctx.lineTo(Math.cos(a) * 21, -2 + Math.sin(a) * 21); }
      ctx.stroke();
      break;
    }
    case 'bubbler': {
      ctx.fillStyle = '#6f7d8c'; rrect(ctx, -14, -18, 28, 18, 6); ctx.fill();
      ctx.fillStyle = '#9aa8b6'; rrect(ctx, -10, -24, 20, 8, 4); ctx.fill();
      break;
    }
    case 'mushroom': {
      const glow = 0.5 + Math.sin(t * 2 + d.ph) * 0.25;
      const g = ctx.createRadialGradient(0, -50, 4, 0, -50, 70);
      g.addColorStop(0, `rgba(120,255,240,${0.45 * glow})`); g.addColorStop(1, 'rgba(120,255,240,0)');
      ctx.fillStyle = g; ell(ctx, 0, -50, 70, 70); ctx.fill();
      ctx.fillStyle = '#e8dcc8'; rrect(ctx, -7, -46, 14, 46, 6); ctx.fill();
      ctx.fillStyle = '#5ff2e0';
      ctx.beginPath(); ctx.ellipse(0, -46, 30, 22, 0, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff'; ell(ctx, -10, -56, 4, 4); ctx.fill(); ell(ctx, 8, -60, 3, 3); ctx.fill();
      break;
    }
    case 'crystal': {
      for (const [ox, h2, a] of [[-16, 70, -0.3], [0, 100, 0], [18, 60, 0.35]]) {
        ctx.save(); ctx.translate(ox, 0); ctx.rotate(a);
        ctx.fillStyle = '#a77bff';
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-10, -h2 * 0.8); ctx.lineTo(0, -h2); ctx.lineTo(10, -h2 * 0.8); ctx.lineTo(10, 0); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-6, -h2 * 0.75, 4, h2 * 0.7);
        ctx.restore();
      }
      break;
    }
    case 'block': {
      ctx.fillStyle = d.c; rrect(ctx, -36, -72, 72, 72, 10); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = '900 48px "Chalkboard SE", "Comic Sans MS", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(d.letter, 0, -34);
      break;
    }
    case 'starfish': {
      ctx.fillStyle = '#ff8a65';
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 11 : 28;
        ctx.lineTo(Math.cos(a) * r, -26 + Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd0bf'; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k * TAU) / 5; ell(ctx, Math.cos(a) * 14, -26 + Math.sin(a) * 14, 2.5, 2.5); ctx.fill(); }
      break;
    }
    case 'sponge': {
      ctx.fillStyle = '#ffe066'; rrect(ctx, -40, -46, 80, 46, 12); ctx.fill();
      ctx.fillStyle = '#e6c440';
      for (const [a, b, r] of [[-22, -30, 6], [4, -20, 8], [24, -34, 5], [-6, -38, 4], [18, -12, 4]]) { ell(ctx, a, b, r, r); ctx.fill(); }
      break;
    }
  }
  ctx.restore();
}

export function drawBackground(ctx, sc, camX, viewW, t) {
  const th = sc.theme, W = sc.W;
  const x0 = camX - 4, x1 = camX + viewW + 4;
  ctx.fillStyle = th.room; ctx.fillRect(x0, 0, x1 - x0, H);
  ctx.fillStyle = th.room2;
  for (let sx = Math.floor(x0 / 90) * 90; sx < x1; sx += 90) ctx.fillRect(sx, 0, 36, H);
  const tx0 = Math.max(x0, 0), tx1 = Math.min(x1, W);
  if (tx1 <= tx0) return;
  ctx.save();
  ctx.beginPath(); ctx.rect(tx0, 0, tx1 - tx0, H); ctx.clip();
  ctx.fillStyle = 'rgba(210,240,255,0.35)'; ctx.fillRect(tx0, 0, tx1 - tx0, SURFACE_Y);
  if (!sc.grad) {
    sc.grad = ctx.createLinearGradient(0, SURFACE_Y, 0, H);
    sc.grad.addColorStop(0, th.top); sc.grad.addColorStop(1, th.bottom);
  }
  ctx.fillStyle = sc.grad; ctx.fillRect(tx0, SURFACE_Y, tx1 - tx0, H - SURFACE_Y);
  // light rays (parallax)
  ctx.fillStyle = th.rays;
  for (const r of sc.rays) {
    const rx = r.x + camX * 0.7;
    if (rx + r.w + r.sk < x0 || rx - 60 > x1) continue;
    const wob = Math.sin(t * 0.4 + r.ph) * 20;
    ctx.beginPath();
    ctx.moveTo(rx + wob, SURFACE_Y); ctx.lineTo(rx + r.w + wob, SURFACE_Y);
    ctx.lineTo(rx + r.w + r.sk, FLOOR_Y); ctx.lineTo(rx + r.sk - r.w * 0.3, FLOOR_Y);
    ctx.fill();
  }
  // far silhouettes (parallax)
  ctx.fillStyle = th.far;
  for (const f of sc.far) {
    const fx = f.x + camX * 0.5;
    if (fx + f.w < x0 || fx - f.w > x1) continue;
    ell(ctx, fx, FLOOR_Y + 30, f.w, f.h); ctx.fill();
  }
  // sand
  ctx.fillStyle = th.sand2;
  ctx.beginPath(); ctx.moveTo(tx0, H);
  for (let x = Math.floor(tx0 / 20) * 20; x <= tx1 + 20; x += 20) ctx.lineTo(x, floorAt(x) - 12 + Math.sin(x * 0.013) * 6);
  ctx.lineTo(tx1 + 20, H); ctx.closePath(); ctx.fill();
  for (const d of sc.decor) if (d.x > x0 - 200 && d.x < x1 + 200) drawDecor(ctx, d, t);
  for (const w of sc.weeds) if (w.x > x0 - 40 && w.x < x1 + 40) drawWeed(ctx, w, t);
  ctx.fillStyle = th.sand;
  ctx.beginPath(); ctx.moveTo(tx0, H);
  for (let x = Math.floor(tx0 / 20) * 20; x <= tx1 + 20; x += 20) ctx.lineTo(x, floorAt(x) + 8);
  ctx.lineTo(tx1 + 20, H); ctx.closePath(); ctx.fill();
  for (const p of sc.pebbles) {
    if (p.x < x0) continue;
    if (p.x > x1) break;
    ell(ctx, p.x, floorAt(p.x) + 8 + p.dy, p.r, p.r * 0.75); ctx.fillStyle = p.c; ctx.fill();
  }
  ctx.restore();
}

export function drawForeground(ctx, sc, camX, viewW, t) {
  const W = sc.W, x0 = camX - 4, x1 = camX + viewW + 4;
  const tx0 = Math.max(x0, 0), tx1 = Math.min(x1, W);
  if (tx1 > tx0) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    const start = Math.floor(tx0 / 16) * 16;
    ctx.moveTo(start, SURFACE_Y);
    for (let x = start; x <= tx1 + 16; x += 16) ctx.lineTo(x, SURFACE_Y - 2 + Math.sin(x * 0.025 + t * 2.2) * 3);
    for (let x = tx1 + 16; x >= start; x -= 16) ctx.lineTo(x, SURFACE_Y + 6 + Math.sin(x * 0.025 + t * 2.2 + 0.8) * 3);
    ctx.closePath(); ctx.fill();
    if (sc.theme.suds) { // bubble-bath foam along the top of the water
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      for (let x = Math.floor(tx0 / 26) * 26; x <= tx1 + 26; x += 26) {
        const h = Math.abs(Math.sin(x * 12.9898) * 43758.5453) % 1;
        const r = 7 + h * 9;
        ell(ctx, x + h * 10, SURFACE_Y - 1 + Math.sin(t * 1.5 + x) * 1.5, r, r * 0.65); ctx.fill();
      }
    }
  }
  // glass walls and frame
  ctx.fillStyle = 'rgba(190,235,255,0.55)';
  if (x0 < 20) ctx.fillRect(-16, 0, 16, H);
  if (x1 > W - 20) ctx.fillRect(W, 0, 16, H);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  if (x0 < 20) ctx.fillRect(-11, 0, 3, H);
  if (x1 > W - 20) ctx.fillRect(W + 8, 0, 3, H);
  ctx.fillStyle = '#2d333b';
  const fx0 = Math.max(x0, -18), fx1 = Math.min(x1, W + 18);
  if (fx1 > fx0) { ctx.fillRect(fx0, 0, fx1 - fx0, 12); ctx.fillRect(fx0, H - 10, fx1 - fx0, 10); }
}
