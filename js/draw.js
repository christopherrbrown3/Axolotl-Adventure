// Procedural axolotl art: side view (in-game) and front-facing face (color picker).
import { clamp } from './world.js';

export const TAU = Math.PI * 2;

export const PALETTES = {
  orange: { name: 'Orange', body: '#ff9d52', belly: '#ffd3a8', gill: '#ef4b3a', gill2: '#b8322a', dark: '#b85a22', fin: 'rgba(255,196,150,0.78)' },
  black:  { name: 'Black', body: '#3b3b54', belly: '#5a5a7c', gill: '#a24ea2', gill2: '#5e2a5e', dark: '#15151f', fin: 'rgba(120,120,165,0.72)', eyeRing: '#9d9dc4' },
  blue:   { name: 'Blue', body: '#5fb0ff', belly: '#c2e3ff', gill: '#2a64d4', gill2: '#1b3f8f', dark: '#2a5f9e', fin: 'rgba(175,218,255,0.78)' },
  pink:   { name: 'Pink', body: '#ffb3c8', belly: '#ffe8ef', gill: '#ff3d74', gill2: '#c2244f', dark: '#c9718c', fin: 'rgba(255,218,230,0.82)' },
  gold:   { name: 'Gold', body: '#ffd23f', belly: '#fff4b0', gill: '#ff8c1a', gill2: '#c76510', dark: '#b8860b', fin: 'rgba(255,238,155,0.82)', sparkle: true },
};
export const COLOR_ORDER = ['orange', 'black', 'blue', 'pink', 'gold'];
export const EVIL_PALETTE = { body: '#5b2d70', belly: '#80508f', gill: '#e8195c', gill2: '#8c0f38', dark: '#24092e', fin: 'rgba(140,80,165,0.72)' };

export function ell(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU);
}

export function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function sparkle(ctx, x, y, r, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a + Math.PI / 4) * r * 0.28, Math.sin(a + Math.PI / 4) * r * 0.28);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function poly(ctx, a, b) {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  for (let i = 2; i < a.length; i += 2) ctx.lineTo(a[i], a[i + 1]);
  for (let i = b.length - 2; i >= 0; i -= 2) ctx.lineTo(b[i], b[i + 1]);
  ctx.closePath();
}

// One feathery gill stalk.
function gillFrond(ctx, bx, by, ang, len, wave, col, lw) {
  const ca = ang + wave * 0.35;
  const mx = bx + Math.cos(ca) * len * 0.55, my = by + Math.sin(ca) * len * 0.55;
  const ea = ang + wave * 0.7;
  const ex = mx + Math.cos(ea) * len * 0.5, ey = my + Math.sin(ea) * len * 0.5;
  ctx.strokeStyle = col;
  ctx.lineCap = 'round';
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.quadraticCurveTo(mx, my, ex, ey);
  ctx.stroke();
  ctx.lineWidth = lw * 0.45;
  ctx.beginPath();
  for (let k = 1; k <= 5; k++) {
    const u = k / 6, iu = 1 - u;
    const px = iu * iu * bx + 2 * iu * u * mx + u * u * ex;
    const py = iu * iu * by + 2 * iu * u * my + u * u * ey;
    const tx = 2 * iu * (mx - bx) + 2 * u * (ex - mx);
    const ty = 2 * iu * (my - by) + 2 * u * (ey - my);
    const tl = Math.hypot(tx, ty) || 1;
    const nx = -ty / tl, ny = tx / tl, ux = tx / tl, uy = ty / tl;
    const fl = len * 0.24 * (1 - u * 0.5);
    ctx.moveTo(px, py); ctx.lineTo(px + nx * fl + ux * fl * 0.5, py + ny * fl + uy * fl * 0.5);
    ctx.moveTo(px, py); ctx.lineTo(px - nx * fl + ux * fl * 0.5, py - ny * fl + uy * fl * 0.5);
  }
  ctx.stroke();
}

function leg(ctx, x, y, ang, col, outline) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.lineCap = 'round';
  const draw = (c, w, tw) => {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 12); ctx.stroke();
    ctx.lineWidth = tw;
    ctx.beginPath();
    for (let k = -1.5; k <= 1.5; k += 1) { ctx.moveTo(0, 12); ctx.lineTo(k * 3.4, 18.5); }
    ctx.stroke();
  };
  if (outline) draw(outline, 9.5, 4.6);
  draw(col, 7, 2.6);
  ctx.restore();
}

/**
 * Side-view axolotl, facing right in local space (head at +x).
 * o: { palette, t, scale, facing, tilt, swim(0..1), mouth(0..1 open),
 *      evil, gulp(0..1), blink(0..1), squash(0..1), bellyUp }
 */
export function drawAxolotl(ctx, x, y, o) {
  const P = o.palette, t = o.t || 0, s = o.scale || 1;
  const swim = clamp(o.swim ?? 0.3, 0, 1);
  const mouth = o.mouth || 0;
  const evil = !!o.evil;
  ctx.save();
  ctx.translate(x, y);
  let sx = s, sy = s;
  if (o.squash) { sx *= 1 + o.squash * 0.55; sy *= 1 - o.squash * 0.72; }
  ctx.scale(sx * (o.facing || 1), sy);
  ctx.rotate(o.tilt || 0);
  if (o.bellyUp) ctx.scale(1, -1);

  const freq = 3 + swim * 9;
  const amp = 0.35 + swim * 0.85;
  const puff = mouth * (3 + Math.sin(t * 38));
  const flare = mouth * 0.35;
  const gt = t * (2.5 + swim * 4);
  const legSw = 0.35 + swim * 0.65;
  const lp = t * freq * 0.7;

  // far-side gills and legs
  for (let i = 0; i < 3; i++) {
    gillFrond(ctx, 24, -12 + i * 7, -1.75 - i * 0.5 - flare * (1 - i * 0.4), 22, Math.sin(gt + i + 1.2) * 0.35, P.gill2, 4.5);
  }
  leg(ctx, 22, 14, 0.4 + swim * 0.4 + Math.sin(lp + 1.6) * 0.5 * legSw, P.dark);
  leg(ctx, -22, 14, 0.5 + swim * 0.4 + Math.sin(lp + 3.2) * 0.5 * legSw, P.dark);

  // tail + crest fin (undulating)
  const N = 18, top = [], bot = [], ftop = [], fbot = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const px = 6 - u * 102;
    const w = clamp((-24 - px) / 72, 0, 1);
    const py = 4 + Math.sin(t * freq - w * 3.4) * (1 + 13 * w) * amp * w;
    const ex = (px + 8) / 40;
    const bodyHalf = Math.abs(ex) < 1 ? 19 * Math.sqrt(1 - ex * ex) : 0;
    const half = Math.max(bodyHalf, px < -24 ? 12 * (1 - w) + 1.2 : 0);
    const fadeIn = clamp((6 - px) / 16, 0, 1);
    const eTop = ((3 + 9 * Math.sin(w * Math.PI)) * (1 - w * w * 0.75)) * fadeIn;
    const eBot = 8 * Math.sin(w * Math.PI) * (1 - w * 0.4);
    top.push(px, py - half); bot.push(px, py + half);
    ftop.push(px, py - half - eTop); fbot.push(px, py + half + eBot);
  }
  poly(ctx, ftop, fbot); ctx.fillStyle = P.fin; ctx.fill();
  poly(ctx, top, bot); ctx.fillStyle = P.body; ctx.fill();

  // body
  ell(ctx, -8, 4, 40, 19); ctx.fillStyle = P.body; ctx.fill();
  ctx.save();
  ell(ctx, -8, 4, 40, 19); ctx.clip();
  ell(ctx, -6, 19, 40, 10); ctx.fillStyle = P.belly; ctx.fill();
  ctx.restore();
  if (o.gulp > 0.01) { ell(ctx, -4, 13, 14 + 8 * o.gulp, 6 + 9 * o.gulp); ctx.fillStyle = P.belly; ctx.fill(); }

  // near legs
  leg(ctx, 14, 17, 0.4 + swim * 0.4 + Math.sin(lp) * 0.5 * legSw, P.body, P.dark);
  leg(ctx, -30, 16, 0.5 + swim * 0.4 + Math.sin(lp + 1.6) * 0.5 * legSw, P.body, P.dark);

  // head
  const hrx = 30 + puff, hry = 25 + puff * 0.7;
  ell(ctx, 34, 0, hrx, hry); ctx.fillStyle = P.body; ctx.fill();
  ctx.save();
  ell(ctx, 34, 0, hrx, hry); ctx.clip();
  ell(ctx, 38, 21, 27, 10); ctx.fillStyle = P.belly; ctx.fill();
  ell(ctx, 32, -14, 16, 6); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
  ctx.restore();

  // near-side gills
  for (let i = 0; i < 3; i++) {
    gillFrond(ctx, 14, -12 + i * 8, -1.95 - i * 0.55 - flare * (1 - i * 0.4), i === 1 ? 29 : 26, Math.sin(gt + i) * 0.4, P.gill, 5.5);
  }

  // cheek blush
  if (!evil) { ell(ctx, 50, 7, 6, 3.6); ctx.fillStyle = 'rgba(255,90,130,0.35)'; ctx.fill(); }

  // eye
  const eyeX = 46, eyeY = -7;
  if ((o.blink || 0) > 0.6) {
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(eyeX - 5, eyeY); ctx.quadraticCurveTo(eyeX, eyeY + 3, eyeX + 5, eyeY); ctx.stroke();
  } else {
    if (P.eyeRing) { ell(ctx, eyeX, eyeY, 7, 7); ctx.fillStyle = P.eyeRing; ctx.fill(); }
    ell(ctx, eyeX, eyeY, 5.4, 5.4); ctx.fillStyle = '#111'; ctx.fill();
    if (evil) { ell(ctx, eyeX + 0.6, eyeY, 3, 3); ctx.fillStyle = '#ff2b2b'; ctx.fill(); }
    ell(ctx, eyeX + 1.6, eyeY - 1.8, 1.9, 1.9); ctx.fillStyle = '#fff'; ctx.fill();
  }
  if (evil) {
    ctx.strokeStyle = '#1a0820'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(eyeX - 8, eyeY - 11); ctx.lineTo(eyeX + 6, eyeY - 6); ctx.stroke();
  }

  // mouth
  if (mouth > 0.05) {
    const mx = 61 + puff * 0.6, my = 7, mr = 2 + mouth * 8;
    ell(ctx, mx, my, mr * 0.75, mr); ctx.fillStyle = '#4a0c1d'; ctx.fill();
    ctx.lineWidth = 2.2; ctx.strokeStyle = P.dark; ctx.stroke();
    ell(ctx, mx, my + mr * 0.45, mr * 0.45, mr * 0.3); ctx.fillStyle = '#ff7b9c'; ctx.fill();
    if (evil) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(mx - mr * 0.5, my - mr * 0.75); ctx.lineTo(mx - mr * 0.2, my - mr * 0.75); ctx.lineTo(mx - mr * 0.35, my - mr * 0.25);
      ctx.moveTo(mx + mr * 0.1, my - mr * 0.85); ctx.lineTo(mx + mr * 0.45, my - mr * 0.7); ctx.lineTo(mx + mr * 0.25, my - mr * 0.25);
      ctx.fill();
    }
  } else {
    ctx.strokeStyle = P.dark; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(47, 10); ctx.quadraticCurveTo(55, 15, 63, 6); ctx.stroke();
    if (evil) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(52, 12.4); ctx.lineTo(55.5, 12.6); ctx.lineTo(53.8, 17.5);
      ctx.moveTo(58, 10.8); ctx.lineTo(61, 9.6); ctx.lineTo(60, 14.5);
      ctx.fill();
    }
  }

  if (P.sparkle) {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    const spots = [[20, -20], [-20, -2], [40, -16]];
    for (let k = 0; k < 3; k++) {
      const ph = (t * 0.8 + k * 0.37) % 1;
      if (ph < 0.3) sparkle(ctx, spots[k][0], spots[k][1], 7 * Math.sin((ph / 0.3) * Math.PI), t);
    }
  }
  ctx.restore();
}

/** Front-facing cute axolotl face, used for the color picker and buttons. */
export function drawFace(ctx, cx, cy, s, P, o = {}) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const a = side > 0 ? -0.65 + i * 0.6 : Math.PI + 0.65 - i * 0.6;
      gillFrond(ctx, side * 24, -8 + i * 9, a, 24, 0, P.gill, 5.5);
    }
  }
  ell(ctx, 0, 4, 34, 27); ctx.fillStyle = P.body; ctx.fill();
  ctx.save(); ell(ctx, 0, 4, 34, 27); ctx.clip();
  ell(ctx, 0, 24, 26, 11); ctx.fillStyle = P.belly; ctx.fill();
  ctx.restore();
  for (const ex of [-14, 14]) {
    if (P.eyeRing) { ell(ctx, ex, -2, 7.5, 7.5); ctx.fillStyle = P.eyeRing; ctx.fill(); }
    ell(ctx, ex, -2, 5.8, 5.8); ctx.fillStyle = '#111'; ctx.fill();
    if (o.evil) { ell(ctx, ex, -2, 3, 3); ctx.fillStyle = '#ff2b2b'; ctx.fill(); }
    ell(ctx, ex + 1.8, -4, 2, 2); ctx.fillStyle = '#fff'; ctx.fill();
  }
  ctx.lineCap = 'round';
  if (o.evil) {
    ctx.strokeStyle = P.dark; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(-22, -13); ctx.lineTo(-8, -8); ctx.moveTo(22, -13); ctx.lineTo(8, -8); ctx.stroke();
  }
  ctx.strokeStyle = P.dark; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(-11, 11); ctx.quadraticCurveTo(0, 19, 11, 11); ctx.stroke();
  if (o.evil) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(-7, 13.5); ctx.lineTo(-3, 15); ctx.lineTo(-5.5, 20);
    ctx.moveTo(7, 13.5); ctx.lineTo(3, 15); ctx.lineTo(5.5, 20);
    ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(255,90,130,0.4)';
    ell(ctx, -22, 9, 5.5, 3.5); ctx.fill();
    ell(ctx, 22, 9, 5.5, 3.5); ctx.fill();
  }
  ctx.restore();
}
