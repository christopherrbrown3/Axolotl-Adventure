// Lightweight particle system: bubbles, suction streaks, sparks/fireworks, hearts, text.
import { SURFACE_Y, rand } from './world.js';
import { ell, sparkle, TAU } from './draw.js';

const MAX = 450;
const FONT = '"Chalkboard SE", "Comic Sans MS", "Baloo 2", sans-serif';

export function add(list, p) {
  if (list.length < MAX) list.push(p);
}

export function bubbles(list, x, y, n = 6, spread = 14) {
  for (let i = 0; i < n; i++) {
    add(list, { type: 'bubble', x: x + rand(-spread, spread), y: y + rand(-spread, spread), vx: rand(-20, 20), vy: rand(-60, -20), r: rand(2, 6), life: rand(1.5, 3), ph: rand(0, 6) });
  }
}

export function firework(list, x, y, colors) {
  const n = 46;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rand(-0.05, 0.05), sp = rand(170, 330);
    add(list, { type: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 110, drag: 1.4, life: rand(1.1, 1.8), max: 1.8, r: rand(2.5, 4.5), c: colors[i % colors.length] });
  }
  add(list, { type: 'ring', x, y, r: 6, life: 0.45, max: 0.45, c: colors[0] });
}

export function text(list, x, y, str, color = '#fff', size = 30) {
  add(list, { type: 'text', x, y, str, c: color, size, life: 1.1, max: 1.1 });
}

export function hearts(list, x, y, n = 6) {
  for (let i = 0; i < n; i++) add(list, { type: 'heart', x: x + rand(-30, 30), y: y + rand(-20, 20), life: rand(0.8, 1.4), max: 1.4, ph: rand(0, 6) });
}

export function sparks(list, x, y, n, color, speed = 200) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), sp = rand(speed * 0.3, speed);
    add(list, { type: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0, drag: 3, life: rand(0.4, 0.9), max: 0.9, r: rand(2, 4), c: color, star: true });
  }
}

export function updateParticles(list, dt, mouth) {
  let j = 0;
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    p.life -= dt;
    if (p.life > 0) {
      switch (p.type) {
        case 'bubble':
          p.vy -= 40 * dt;
          p.x += p.vx * dt + Math.sin((p.life + p.ph) * 6) * 0.4;
          p.y += p.vy * dt;
          if (p.y < SURFACE_Y + 4) p.life = 0;
          break;
        case 'streak': {
          if (!mouth) { p.life = 0; break; }
          const dx = mouth.x - p.x, dy = mouth.y - p.y, d = Math.hypot(dx, dy);
          if (d < 14) { p.life = 0; break; }
          p.speed += 1500 * dt;
          const step = Math.min(p.speed * dt, d);
          p.x += (dx / d) * step; p.y += (dy / d) * step;
          p.ang = Math.atan2(dy, dx);
          break;
        }
        case 'spark':
          p.vy += p.g * dt;
          p.vx *= Math.exp(-p.drag * dt); p.vy *= Math.exp(-p.drag * dt);
          p.x += p.vx * dt; p.y += p.vy * dt;
          break;
        case 'heart': p.y -= 60 * dt; p.x += Math.sin(p.life * 6 + p.ph) * 0.6; break;
        case 'text': p.y -= 45 * dt; break;
        case 'ring': p.r += 260 * dt; break;
        case 'sand': p.vy += 400 * dt; p.x += p.vx * dt; p.y += p.vy * dt; break;
      }
    }
    if (p.life > 0) list[j++] = p;
  }
  list.length = j;
}

export function drawParticles(ctx, list, x0, x1) {
  for (const p of list) {
    if (p.x < x0 - 60 || p.x > x1 + 60) continue;
    switch (p.type) {
      case 'bubble':
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.5;
        ell(ctx, p.x, p.y, p.r, p.r); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; ell(ctx, p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.3, p.r * 0.3); ctx.fill();
        break;
      case 'streak': {
        const len = 10 + Math.min(26, p.speed * 0.03);
        ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.85, p.life * 2)})`; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - Math.cos(p.ang) * len, p.y - Math.sin(p.ang) * len); ctx.stroke();
        break;
      }
      case 'spark': {
        ctx.globalAlpha = Math.min(1, p.life / (p.max * 0.5));
        ctx.fillStyle = p.c;
        if (p.star) sparkle(ctx, p.x, p.y, p.r * 2.2, p.life * 4);
        else { ell(ctx, p.x, p.y, p.r, p.r); ctx.fill(); }
        ctx.globalAlpha = 1;
        break;
      }
      case 'heart': {
        ctx.globalAlpha = Math.min(1, p.life / 0.5);
        ctx.fillStyle = '#ff4d6d';
        const s = 9;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + s * 0.9);
        ctx.bezierCurveTo(p.x - s * 1.6, p.y - s * 0.2, p.x - s * 0.6, p.y - s * 1.3, p.x, p.y - s * 0.4);
        ctx.bezierCurveTo(p.x + s * 0.6, p.y - s * 1.3, p.x + s * 1.6, p.y - s * 0.2, p.x, p.y + s * 0.9);
        ctx.fill();
        ctx.globalAlpha = 1;
        break;
      }
      case 'text':
        ctx.globalAlpha = Math.min(1, p.life / 0.4);
        ctx.font = `900 ${p.size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.strokeText(p.str, p.x, p.y);
        ctx.fillStyle = p.c; ctx.fillText(p.str, p.x, p.y);
        ctx.globalAlpha = 1;
        break;
      case 'ring':
        ctx.globalAlpha = p.life / p.max; ctx.strokeStyle = p.c; ctx.lineWidth = 4;
        ell(ctx, p.x, p.y, p.r, p.r); ctx.stroke(); ctx.globalAlpha = 1;
        break;
      case 'sand':
        ctx.fillStyle = p.c; ell(ctx, p.x, p.y, p.r, p.r); ctx.fill();
        break;
    }
  }
}
