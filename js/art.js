// Procedural art for fish, ducks, pizza, piranha plants, the portal and the giant hand.
import { TAU, ell, rrect, sparkle } from './draw.js';

export const FISH_LOOKS = {
  minnow: [
    { len: 32, h: 12, body: '#cfe0ea', belly: '#ffffff', fin: '#9dbfd3', line: '#6f97b3', tail: 'fork', color: '#9fd8ff' },
    { len: 30, h: 11, body: '#d6e8c0', belly: '#fbfff2', fin: '#a8c98a', line: '#7f9e5b', tail: 'fork', color: '#b6ff8a' },
    { len: 34, h: 12, body: '#f0dca0', belly: '#fffbe8', fin: '#d9bb6a', line: '#b8913a', tail: 'fork', color: '#ffe066' },
  ],
  fish: [
    { len: 66, h: 38, body: '#ff7d1f', belly: '#ffa555', fin: '#ff8f33', tail: 'round', stripes: { n: 3, color: '#fff', edge: '#222', w: 0.16 }, color: '#ff8c2a' },
    { len: 56, h: 56, body: '#ffe14d', belly: '#fff09a', fin: '#ffd21f', tail: 'fork', tall: true, stripes: { n: 3, color: '#2a2a2a', w: 0.1 }, color: '#ffe14d' },
    { len: 74, h: 42, body: '#2f6cff', belly: '#6a95ff', fin: '#1d3fae', tailColor: '#ffd21f', tail: 'fork', mark: true, color: '#4d8bff' },
    { len: 62, h: 36, body: '#ff8c1a', belly: '#ffc266', fin: 'rgba(255,170,80,0.85)', tail: 'flow', color: '#ffa94d' },
    { len: 56, h: 46, body: '#d8c27a', belly: '#fff4cf', fin: '#c4a24f', tail: 'round', spots: '#7a5a20', color: '#f5e08a' },
  ],
};

export function drawFish(ctx, x, y, f, t, facing) {
  const rx = f.len / 2, ry = f.h / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  const wag = Math.sin(t * (f.len < 40 ? 18 : 9)) * 0.3;
  // tail
  ctx.save();
  ctx.translate(-rx * 0.82, 0);
  ctx.rotate(wag);
  ctx.fillStyle = f.tailColor || f.fin;
  ctx.beginPath();
  const T = Math.max(ry, 7);
  if (f.tail === 'round') {
    ctx.ellipse(-T * 0.55, 0, T * 0.7, T * 0.85, 0, 0, TAU);
  } else if (f.tail === 'flow') {
    const w2 = Math.sin(t * 5) * T * 0.3;
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-T * 0.8, -T * 1.4, -T * 2, -T * 1.2 + w2, -T * 2.3, -T * 0.2 + w2);
    ctx.quadraticCurveTo(-T * 1.4, 0, -T * 2.3, T * 0.4 - w2);
    ctx.bezierCurveTo(-T * 2, T * 1.3 - w2, -T * 0.8, T * 1.4, 0, 0);
  } else {
    ctx.moveTo(4, 0); ctx.lineTo(-T * 1.15, -T); ctx.lineTo(-T * 0.7, 0); ctx.lineTo(-T * 1.15, T);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // fins
  ctx.fillStyle = f.fin;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.55, -ry * 0.6);
  ctx.quadraticCurveTo(-rx * 0.15, -ry * (f.tall ? 2.1 : 1.5), rx * 0.35, -ry * 0.75);
  ctx.closePath(); ctx.fill();
  if (f.tall) {
    ctx.beginPath();
    ctx.moveTo(-rx * 0.45, ry * 0.6);
    ctx.quadraticCurveTo(-rx * 0.15, ry * 2.0, rx * 0.2, ry * 0.75);
    ctx.closePath(); ctx.fill();
  }
  // body
  ell(ctx, 0, 0, rx, ry); ctx.fillStyle = f.body; ctx.fill();
  ctx.save();
  ell(ctx, 0, 0, rx, ry); ctx.clip();
  ell(ctx, 0, ry * 0.6, rx, ry * 0.55); ctx.fillStyle = f.belly; ctx.fill();
  if (f.line) { ctx.fillStyle = f.line; ctx.fillRect(-rx, -1.2, rx * 2, 2.4); }
  if (f.stripes) {
    const n = f.stripes.n, w = rx * f.stripes.w;
    for (let i = 0; i < n; i++) {
      const sx = rx * (0.62 - (1.24 * (i + 0.5)) / n);
      if (f.stripes.edge) { ctx.fillStyle = f.stripes.edge; ctx.fillRect(sx - w / 2 - 2.5, -ry, w + 5, ry * 2); }
      ctx.fillStyle = f.stripes.color; ctx.fillRect(sx - w / 2, -ry, w, ry * 2);
    }
  }
  if (f.spots) {
    ctx.fillStyle = f.spots;
    for (const [a, b] of [[-0.3, -0.3], [0.1, -0.45], [-0.1, 0], [0.3, -0.1], [-0.5, 0.05], [0.05, 0.3]]) {
      ell(ctx, a * rx, b * ry, ry * 0.11, ry * 0.11); ctx.fill();
    }
  }
  if (f.mark) {
    ctx.strokeStyle = '#111'; ctx.lineWidth = ry * 0.22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(rx * 0.35, -ry * 0.55); ctx.quadraticCurveTo(-rx * 0.2, -ry * 0.05, -rx * 0.75, -ry * 0.45); ctx.stroke();
  }
  ctx.restore();
  // pectoral fin
  ctx.save();
  ctx.translate(rx * 0.15, ry * 0.2);
  ctx.rotate(0.7 + Math.sin(t * 10) * 0.35);
  ell(ctx, -ry * 0.3, 0, ry * 0.4, ry * 0.16); ctx.fillStyle = f.fin; ctx.fill();
  ctx.restore();
  // eye + mouth
  const er = Math.max(2.4, ry * 0.2), ex = rx * 0.56, ey = -ry * 0.18;
  ell(ctx, ex, ey, er * 1.3, er * 1.3); ctx.fillStyle = '#fff'; ctx.fill();
  ell(ctx, ex + er * 0.25, ey, er * 0.8, er * 0.8); ctx.fillStyle = '#111'; ctx.fill();
  ell(ctx, ex + er * 0.5, ey - er * 0.35, er * 0.3, er * 0.3); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = Math.max(1.2, ry * 0.08);
  ctx.beginPath(); ctx.moveTo(rx * 0.97, ry * 0.12); ctx.lineTo(rx * 0.8, ry * 0.2); ctx.stroke();
  ctx.restore();
}

export const DUCK_LOOKS = {
  yellow: { body: '#ffd93b', wing: '#f5c400', edge: '#e0a800' },
  pink: { body: '#ff9ec4', wing: '#ff7fb0', edge: '#e0628f' },
  blue: { body: '#7cc7ff', wing: '#4fb0f5', edge: '#3a8fd0' },
  green: { body: '#8fe08f', wing: '#66c866', edge: '#46a846' },
  purple: { body: '#c9a3ff', wing: '#b083f5', edge: '#9064d8' },
  orange: { body: '#ffb35c', wing: '#ff9b2e', edge: '#e07d10' },
};

export function drawDuck(ctx, x, y, t, facing, scale = 1, look = DUCK_LOOKS.yellow) {
  const L = look || DUCK_LOOKS.yellow;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * scale, scale);
  ctx.rotate(Math.sin(t * 2) * 0.08);
  ctx.fillStyle = L.body;
  ctx.strokeStyle = L.edge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-30, -4);
  ctx.quadraticCurveTo(-36, -24, -24, -18);
  ctx.quadraticCurveTo(-10, -8, 6, -8);
  ctx.quadraticCurveTo(30, -10, 28, 6);
  ctx.quadraticCurveTo(24, 20, 0, 20);
  ctx.quadraticCurveTo(-26, 20, -30, -4);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ell(ctx, 14, -22, 14, 13); ctx.fill(); ctx.stroke();
  ell(ctx, 29, -19, 8, 4.5); ctx.fillStyle = '#ff8a1f'; ctx.fill();
  ctx.strokeStyle = '#d96a00'; ctx.beginPath(); ctx.moveTo(22, -19); ctx.lineTo(36, -19); ctx.stroke();
  ell(ctx, 18, -26, 2.8, 3.2); ctx.fillStyle = '#1a1a1a'; ctx.fill();
  ell(ctx, 19, -27, 1, 1); ctx.fillStyle = '#fff'; ctx.fill();
  ell(ctx, -4, 3, 13, 8, -0.2); ctx.fillStyle = L.wing; ctx.fill();
  ell(ctx, 13, -16, 4, 2.5); ctx.fillStyle = 'rgba(255,120,90,0.45)'; ctx.fill();
  ctx.restore();
}

/** A see-through rainbow soap bubble. */
export function drawSoapBubble(ctx, x, y, r, t) {
  if (r < 1) return;
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, 'rgba(255,255,255,0.04)');
  g.addColorStop(0.75, 'rgba(200,240,255,0.10)');
  g.addColorStop(1, 'rgba(255,190,240,0.38)');
  ctx.fillStyle = g;
  ell(ctx, x, y, r, r); ctx.fill();
  ctx.strokeStyle = `hsla(${(t * 80 + x) % 360}, 90%, 82%, 0.75)`;
  ctx.lineWidth = Math.max(1.2, r * 0.06);
  ctx.stroke();
  ell(ctx, x - r * 0.35, y - r * 0.42, r * 0.24, r * 0.12, -0.6);
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
}

export function drawPizza(ctx, x, y, t) {
  const pulse = 1 + Math.sin(t * 5) * 0.12;
  const g = ctx.createRadialGradient(x, y, 4, x, y, 60 * pulse);
  g.addColorStop(0, 'rgba(255,250,180,0.75)');
  g.addColorStop(1, 'rgba(255,220,90,0)');
  ctx.fillStyle = g;
  ell(ctx, x, y, 60 * pulse, 60 * pulse); ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 2) * 0.25);
  ctx.fillStyle = '#ffcf4a';
  ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(-24, -16); ctx.quadraticCurveTo(0, -26, 24, -16); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#d98c3a'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-27, -17); ctx.quadraticCurveTo(0, -30, 27, -17); ctx.stroke();
  ctx.fillStyle = '#d6322f';
  for (const [a, b] of [[-8, -8], [8, -6], [0, 8]]) { ell(ctx, a, b, 5, 5); ctx.fill(); }
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 4; i++) {
    const a = t * 2 + (i * TAU) / 4;
    sparkle(ctx, Math.cos(a) * 42, Math.sin(a) * 42, 5 + Math.sin(t * 8 + i) * 2, t);
  }
  ctx.restore();
}

function leaf(ctx, x, y, ang, len) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = '#3fae4a';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -len * 0.35, len, 0);
  ctx.quadraticCurveTo(len * 0.5, len * 0.35, 0, 0);
  ctx.fill();
  ctx.restore();
}

/** p: { x, baseY, potH, hx, hy, ang, chomp, shake } */
export function drawPlant(ctx, p, t) {
  const potTop = p.baseY - p.potH;
  const cy = potTop - (potTop - p.hy) * 0.55;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#2b7f36'; ctx.lineWidth = 13;
  ctx.beginPath(); ctx.moveTo(p.x, potTop + 4); ctx.quadraticCurveTo(p.x, cy, p.hx, p.hy); ctx.stroke();
  ctx.strokeStyle = '#4fbf55'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(p.x - 3, potTop + 4); ctx.quadraticCurveTo(p.x - 3, cy, p.hx - 3, p.hy); ctx.stroke();
  const lw = Math.sin(t * 2 + p.x) * 0.15 + (p.shake ? Math.sin(t * 50) * 0.3 : 0);
  leaf(ctx, p.x, potTop - 4, -0.5 + lw, 38);
  leaf(ctx, p.x, potTop - 4, Math.PI + 0.5 - lw, 38);
  // pot
  ctx.fillStyle = '#c8643b';
  ctx.beginPath();
  ctx.moveTo(p.x - 34, potTop); ctx.lineTo(p.x + 34, potTop);
  ctx.lineTo(p.x + 26, p.baseY); ctx.lineTo(p.x - 26, p.baseY);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e27f4e'; rrect(ctx, p.x - 40, potTop - 8, 80, 16, 6); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(p.x - 22, potTop + 12, 8, p.potH - 18);
  // head
  ctx.save();
  ctx.translate(p.hx + (p.shake ? Math.sin(t * 60) * 3 : 0), p.hy);
  ctx.rotate(p.ang);
  const open = 0.12 + p.chomp * 0.62;
  ctx.fillStyle = '#5a0a1e';
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.arc(-14, 0, 34, -open, open); ctx.closePath(); ctx.fill();
  for (const jaw of [-1, 1]) {
    ctx.save();
    ctx.translate(-14, 0);
    ctx.rotate(jaw * open);
    ctx.fillStyle = '#e8336b';
    ctx.beginPath();
    if (jaw < 0) ctx.ellipse(18, 0, 28, 23, 0, Math.PI, TAU);
    else ctx.ellipse(18, 0, 28, 23, 0, 0, Math.PI);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const tx = 8 + k * 9;
      ctx.moveTo(tx, 0); ctx.lineTo(tx + 7, 0); ctx.lineTo(tx + 3.5, -jaw * 8);
    }
    ctx.fill();
    ctx.fillStyle = '#fff3a0';
    for (const [a, b] of [[12, 13], [26, 10], [19, 18], [34, 4]]) { ell(ctx, a, jaw * b, 3.4, 3.4); ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
}

export function drawPortal(ctx, x, y, floorY, lit, t) {
  const R = 76, r = 55;
  // pedestal
  ctx.fillStyle = '#5f6672';
  ctx.fillRect(x - 24, y + R - 6, 48, floorY - (y + R) + 10);
  ctx.fillStyle = '#7a828f';
  rrect(ctx, x - 44, floorY - 14, 88, 22, 8); ctx.fill();
  // inside
  if (lit) {
    const og = ctx.createRadialGradient(x, y, R * 0.7, x, y, R * 1.9);
    og.addColorStop(0, 'rgba(170,130,255,0.5)');
    og.addColorStop(1, 'rgba(170,130,255,0)');
    ctx.fillStyle = og; ell(ctx, x, y, R * 1.9, R * 1.9); ctx.fill();
    const g = ctx.createRadialGradient(x, y, 3, x, y, r);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, '#9ff7ff');
    g.addColorStop(0.65, '#7b5cff'); g.addColorStop(1, '#2a0f6b');
    ctx.fillStyle = g; ell(ctx, x, y, r, r); ctx.fill();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      for (let a = 0; a < 4.2; a += 0.25) {
        const rr = 6 + a * 11, aa = a + (k * TAU) / 3;
        if (a === 0) ctx.moveTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
        else ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
      }
      ctx.stroke();
    }
    ctx.restore();
  } else {
    ctx.fillStyle = 'rgba(15,25,40,0.78)'; ell(ctx, x, y, r, r); ctx.fill();
    ctx.strokeStyle = 'rgba(160,190,220,0.12)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, r * 0.6, t * 0.3, t * 0.3 + 2); ctx.stroke();
  }
  // stone ring
  for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * TAU + 0.04, a1 = ((i + 1) / 12) * TAU - 0.04;
    ctx.beginPath();
    ctx.arc(x, y, R, a0, a1);
    ctx.arc(x, y, r, a1, a0, true);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? '#8b93a1' : '#7a8290'; ctx.fill();
    ctx.strokeStyle = '#4b5260'; ctx.lineWidth = 2; ctx.stroke();
    const am = (a0 + a1) / 2, rm = (R + r) / 2;
    const gx = x + Math.cos(am) * rm, gy = y + Math.sin(am) * rm;
    ctx.fillStyle = lit ? `rgba(130,255,255,${0.6 + 0.4 * Math.sin(t * 5 + i)})` : 'rgba(40,50,60,0.7)';
    ell(ctx, gx, gy, 3.5, 3.5); ctx.fill();
  }
  // keystone gem
  ctx.fillStyle = lit ? '#b6fffb' : '#55606e';
  ctx.beginPath(); ctx.moveTo(x, y - R - 14); ctx.lineTo(x + 12, y - R + 2); ctx.lineTo(x, y - R + 14); ctx.lineTo(x - 12, y - R + 2); ctx.closePath(); ctx.fill();
  if (lit) { ctx.fillStyle = '#fff'; sparkle(ctx, x, y - R, 10 + Math.sin(t * 6) * 4, t); }
}

/** The kid's hand reaching down into the tank. h: { x, y (palm center), curl, wiggle, red, shake } */
export function drawHand(ctx, h, t) {
  const r = Math.min(1, h.red || 0);
  const mix = (a, b) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * r)).join(',')})`;
  const skin = mix([255, 207, 166], [255, 120, 110]), shade = mix([231, 161, 124], [200, 70, 70]), nail = '#ffe6dc';
  ctx.save();
  ctx.translate(h.x + (h.shake > 0 ? Math.sin(t * 70) * 8 * Math.min(1, h.shake * 2) : 0), h.y);
  // forearm + striped sleeve going up out of the tank
  ctx.fillStyle = skin; rrect(ctx, -58, -260, 116, 230, 30); ctx.fill();
  ctx.save();
  rrect(ctx, -76, -1000, 152, 860, 34); ctx.clip();
  ctx.fillStyle = '#e84a5f'; ctx.fillRect(-76, -1000, 152, 860);
  ctx.fillStyle = '#fff4e0';
  for (let sy = -990; sy < -150; sy += 64) ctx.fillRect(-76, sy, 152, 24);
  ctx.restore();
  ctx.fillStyle = '#c7364a'; rrect(ctx, -82, -172, 164, 36, 14); ctx.fill();
  // palm
  ctx.fillStyle = skin; rrect(ctx, -92, -70, 184, 140, 52); ctx.fill();
  const curl = h.curl || 0;
  // thumb
  ctx.save();
  ctx.translate(-78, -12);
  ctx.rotate(0.55 + curl * 0.6);
  rrect(ctx, -20, -6, 40, 92 * (1 - curl * 0.35), 20);
  ctx.fillStyle = skin; ctx.fill(); ctx.strokeStyle = shade; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
  // fingers
  const F = [[-62, 92, 36], [-21, 108, 38], [21, 102, 38], [60, 84, 34]];
  for (let i = 0; i < 4; i++) {
    const [fx, len0, fw] = F[i];
    const len = len0 * (1 - curl * 0.5) + (h.wiggle ? Math.sin(t * 9 + i * 1.3) * 6 : 0);
    rrect(ctx, fx - fw / 2, 30, fw, len + 10, fw / 2);
    ctx.fillStyle = skin; ctx.fill(); ctx.strokeStyle = shade; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = nail; rrect(ctx, fx - fw * 0.28, 30 + len - 18, fw * 0.56, 20, 8); ctx.fill();
    ctx.strokeStyle = shade; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(fx - fw * 0.25, 30 + len * 0.5); ctx.lineTo(fx + fw * 0.25, 30 + len * 0.5); ctx.stroke();
  }
  ctx.fillStyle = skin; rrect(ctx, -90, -30, 180, 82, 40); ctx.fill();
  ctx.strokeStyle = shade; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(-30, -6, 12, 0.3, 2.8); ctx.moveTo(42, -6); ctx.arc(30, -6, 12, 0.3, 2.8); ctx.stroke();
  ctx.restore();
}

// ---------- Shark (the tank-3 shape shift) ----------
const SHARK = { top: '#6b8aa3', dark: '#4b667d', belly: '#eef3f6', mouth: '#4a0c1d', teeth: '#ffffff' };
const JAW_HINGE = { x: 46, y: 12 };
/** Where the shark's suction comes from, in its local space (before scale). */
export const SHARK_MOUTH = { x: 72, y: 13 };

function sharkBody(ctx) {
  ctx.beginPath();
  ctx.moveTo(80, 6);
  ctx.bezierCurveTo(74, -16, 34, -26, -8, -22);
  ctx.bezierCurveTo(-38, -18, -56, -8, -64, -3);
  ctx.lineTo(-64, 4);
  ctx.bezierCurveTo(-48, 12, -16, 22, 14, 23);
  ctx.bezierCurveTo(30, 23, 40, 22, 44, 21);
  ctx.lineTo(JAW_HINGE.x, JAW_HINGE.y);
  ctx.quadraticCurveTo(62, 12, 80, 6);
  ctx.closePath();
}

function sharkTeeth(ctx, x0, x1, y0, y1, dir) {
  ctx.fillStyle = SHARK.teeth;
  ctx.beginPath();
  for (let x = x0; x < x1 - 3; x += 6) {
    const u = (x - x0) / (x1 - x0), y = y0 + (y1 - y0) * u;
    ctx.moveTo(x, y); ctx.lineTo(x + 5, y + (y1 - y0) * (5 / (x1 - x0))); ctx.lineTo(x + 2.5, y + dir * 6);
  }
  ctx.fill();
}

/**
 * Side-view cartoon shark facing right. o: { t, scale, facing, tilt, swim(0..1), mouth(0..1 open), gulp, blink }
 */
export function drawShark(ctx, x, y, o) {
  const t = o.t || 0, s = o.scale || 1, swim = o.swim ?? 0.3, open = o.mouth || 0, C = SHARK;
  const freq = 2.5 + swim * 6, amp = 0.15 + swim * 0.3;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * (o.facing || 1), s);
  ctx.rotate((o.tilt || 0) + Math.sin(t * freq - 1) * 0.03);

  // far pectoral fin
  ctx.fillStyle = C.dark;
  ctx.beginPath(); ctx.moveTo(32, 12); ctx.quadraticCurveTo(24, 26, 12, 36); ctx.quadraticCurveTo(18, 24, 14, 16); ctx.closePath(); ctx.fill();

  // tail fin, sweeping side to side
  ctx.save();
  ctx.translate(-60, 0);
  ctx.rotate(Math.sin(t * freq) * amp);
  ctx.fillStyle = C.top;
  ctx.beginPath();
  ctx.moveTo(6, -6);
  ctx.quadraticCurveTo(-18, -18, -44, -42);
  ctx.quadraticCurveTo(-34, -12, -26, 0);
  ctx.quadraticCurveTo(-32, 12, -38, 28);
  ctx.quadraticCurveTo(-16, 14, 6, 6);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  // small rear fins and the big dorsal fin
  ctx.fillStyle = C.dark;
  ctx.beginPath();
  ctx.moveTo(-38, -13); ctx.lineTo(-48, -26); ctx.lineTo(-28, -16);
  ctx.moveTo(-34, 14); ctx.lineTo(-46, 25); ctx.lineTo(-26, 16);
  ctx.fill();
  ctx.fillStyle = C.top;
  ctx.beginPath(); ctx.moveTo(-20, -18); ctx.quadraticCurveTo(-2, -32, 4, -58); ctx.quadraticCurveTo(8, -34, 24, -22); ctx.closePath(); ctx.fill();

  // body with a white belly
  sharkBody(ctx); ctx.fillStyle = C.top; ctx.fill();
  ctx.save();
  sharkBody(ctx); ctx.clip();
  ell(ctx, 4, 25, 76, 13); ctx.fillStyle = C.belly; ctx.fill();
  ell(ctx, 10, -14, 40, 6); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
  ctx.restore();
  if (o.gulp > 0.01) { ell(ctx, 0, 18, 18 + 8 * o.gulp, 6 + 9 * o.gulp); ctx.fillStyle = C.belly; ctx.fill(); }

  // gill slits
  ctx.strokeStyle = C.dark; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath();
  for (const gx of [28, 33, 38]) { ctx.moveTo(gx, -3); ctx.quadraticCurveTo(gx - 3, 4, gx, 11); }
  ctx.stroke();

  // jaw: closed it is a toothy grin, open it drops to show both rows of teeth
  const ang = open * 0.75, H = JAW_HINGE;
  const rot = (px, py) => {
    const dx = px - H.x, dy = py - H.y, c = Math.cos(ang), sn = Math.sin(ang);
    return [H.x + dx * c - dy * sn, H.y + dx * sn + dy * c];
  };
  if (open > 0.05) {
    const [cx, cy] = rot(76, 10);
    ctx.fillStyle = C.mouth;
    ctx.beginPath(); ctx.moveTo(H.x, H.y); ctx.quadraticCurveTo(62, 12, 80, 6); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();
    sharkTeeth(ctx, 52, 78, 11, 7, 1);
  }
  ctx.save();
  ctx.translate(H.x, H.y); ctx.rotate(ang); ctx.translate(-H.x, -H.y);
  ctx.fillStyle = C.belly;
  ctx.beginPath(); ctx.moveTo(H.x, H.y); ctx.quadraticCurveTo(60, 13, 76, 10); ctx.quadraticCurveTo(74, 18, 64, 20); ctx.lineTo(44, 21); ctx.closePath(); ctx.fill();
  if (open > 0.05) sharkTeeth(ctx, 52, 74, 13, 11, -1);
  ctx.restore();
  if (open <= 0.05) {
    ctx.strokeStyle = C.dark; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(H.x, H.y); ctx.quadraticCurveTo(62, 12, 78, 7); ctx.stroke();
    sharkTeeth(ctx, 54, 74, 12, 9, 1);
  }

  // near pectoral fin
  ctx.save();
  ctx.translate(26, 14);
  ctx.rotate(Math.sin(t * 3) * 0.12);
  ctx.fillStyle = C.top;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-12, 16, -30, 30); ctx.quadraticCurveTo(-20, 14, -22, 4); ctx.closePath(); ctx.fill();
  ctx.restore();

  // nostril, eye and a fierce brow
  ell(ctx, 71, -2, 2, 1.2); ctx.fillStyle = C.dark; ctx.fill();
  if ((o.blink || 0) > 0.6) {
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(54, -6); ctx.lineTo(63, -6); ctx.stroke();
  } else {
    ell(ctx, 58, -6, 4.8, 4.8); ctx.fillStyle = '#111'; ctx.fill();
    ell(ctx, 59.6, -7.6, 1.7, 1.7); ctx.fillStyle = '#fff'; ctx.fill();
  }
  ctx.strokeStyle = '#2c3d4d'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(50, -15); ctx.lineTo(64, -10); ctx.stroke();
  ctx.restore();
}
