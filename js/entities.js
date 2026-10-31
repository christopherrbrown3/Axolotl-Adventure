// Player, creatures, piranha plants, magic pizza and the portal.
import { SURFACE_Y, floorAt, clamp, approach, lerp, rand } from './world.js';
import { TAU, drawAxolotl, EVIL_PALETTE, ell } from './draw.js';
import { drawFish, drawDuck, drawPizza, drawPlant, drawPortal } from './art.js';
import * as FX from './particles.js';

export class Player {
  constructor(x, y) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.facing = 1;
    this.r = 30; this.hp = 100; this.maxHp = 100; this.inv = 0;
    this.mouthOpen = 0; this.swim = 0; this.tilt = 0; this.gulp = 0;
    this.predator = false; this.pred = 0; this.blinkT = 2.5; this.blink = 0; this.t = 0;
    this.squash = 0; this.bellyUp = false; this.scaleMul = 1; this.spin = 0;
  }

  get scale() { return (1 + this.pred * 0.35) * this.scaleMul; }

  mouthPos() {
    const s = this.scale, c = Math.cos(this.tilt), sn = Math.sin(this.tilt);
    const lx = 61 * s, ly = 7 * s;
    return { x: this.x + this.facing * (lx * c - ly * sn), y: this.y + lx * sn + ly * c };
  }

  updateBlink(dt) {
    this.blinkT -= dt;
    if (this.blinkT < 0) {
      this.blink = 1;
      if (this.blinkT < -0.14) { this.blink = 0; this.blinkT = 2 + Math.random() * 3; }
    }
  }

  update(dt, input, game) {
    this.t += dt;
    const ax = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const ay = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    const MAX = this.predator ? 360 : 320, ACC = 1700;
    this.vx += ax * ACC * dt;
    this.vy += ay * ACC * dt;
    this.vx *= Math.exp(-(ax ? 1.0 : 3.2) * dt);
    this.vy *= Math.exp(-(ay ? 1.0 : 3.2) * dt);
    if (!ay) this.vy += 20 * dt; // gentle sink
    const sp = Math.hypot(this.vx, this.vy);
    if (sp > MAX) { this.vx *= MAX / sp; this.vy *= MAX / sp; }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const s = this.scale;
    if (this.x < 50) { this.x = 50; this.vx = Math.max(0, this.vx); }
    if (this.x > game.W - 50) { this.x = game.W - 50; this.vx = Math.min(0, this.vx); }
    const top = SURFACE_Y + 22 * s, bottom = floorAt(this.x) - 22 * s;
    if (this.y < top) { this.y = top; this.vy = Math.max(0, this.vy); }
    if (this.y > bottom) { this.y = bottom; this.vy = Math.min(0, this.vy); }
    if (ax) this.facing = ax;
    this.swim = approach(this.swim, Math.min(1, sp / MAX + (ax || ay ? 0.25 : 0)), 6, dt);
    this.tilt = approach(this.tilt, clamp(this.vy / MAX, -1, 1) * 0.45, 8, dt);
    this.mouthOpen = approach(this.mouthOpen, input.suck ? 1 : 0, 14, dt);
    this.pred = approach(this.pred, this.predator ? 1 : 0, 5, dt);
    this.gulp = Math.max(0, this.gulp - dt * 2.5);
    this.inv = Math.max(0, this.inv - dt);
    this.updateBlink(dt);
  }

  draw(ctx, palette) {
    ctx.save();
    if (this.inv > 0 && !this.bellyUp && Math.floor(this.inv * 12) % 2 === 0) ctx.globalAlpha = 0.4;
    if (this.pred > 0.05) {
      const r = 90 * this.scale;
      const g = ctx.createRadialGradient(this.x, this.y, 10, this.x, this.y, r);
      g.addColorStop(0, `rgba(255,60,90,${0.32 * this.pred})`);
      g.addColorStop(1, 'rgba(255,60,90,0)');
      ctx.fillStyle = g; ell(ctx, this.x, this.y, r, r); ctx.fill();
    }
    drawAxolotl(ctx, this.x, this.y, {
      palette, t: this.t, scale: this.scale, facing: this.facing, tilt: this.tilt + this.spin,
      swim: this.swim, mouth: this.mouthOpen, predator: this.pred, gulp: this.gulp,
      blink: this.blink, squash: this.squash, bellyUp: this.bellyUp,
    });
    ctx.restore();
  }
}

const SPECS = {
  minnow: { r: 14, speed: 115, flee: 170, resist: 1.0, wander: 1.5 },
  fish:   { r: 26, speed: 75, flee: 120, resist: 1.9, wander: 3 },
  evil:   { r: 28, speed: 135, flee: 0, resist: 1.5, wander: 2.5 },
  duck:   { r: 24, speed: 35, flee: 0, resist: 1.25, wander: 4 },
};

export class Creature {
  constructor(kind, x, y, look) {
    Object.assign(this, SPECS[kind]);
    this.kind = kind; this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.look = look;
    this.t = Math.random() * 10; this.facing = Math.random() < 0.5 ? -1 : 1;
    this.pull = 0; this.sucked = false; this.eaten = false;
    this.tx = x; this.ty = y; this.wt = 0; this.cool = 0; this.shake = 0; this.chasing = false;
  }

  update(dt, game) {
    this.t += dt;
    this.cool = Math.max(0, this.cool - dt);
    this.shake = Math.max(0, this.shake - dt);
    const p = game.player, alive = game.mode === 'play';
    const k = 1 - Math.exp(-3 * dt);
    this.chasing = false;
    if (this.kind === 'duck') {
      if (!this.sucked) {
        const floatY = SURFACE_Y - 4 + Math.sin(this.t * 2) * 2.5;
        if (this.x < 140) this.facing = 1;
        else if (this.x > game.W - 220) this.facing = -1;
        else if (Math.random() < dt * 0.12) this.facing *= -1;
        this.vx += (this.facing * this.speed - this.vx) * k;
        this.vy += (floatY - this.y) * 10 * dt;
        this.vy *= Math.exp(-4 * dt);
      }
    } else if (!this.sucked) {
      this.wt -= dt;
      if (this.wt <= 0 || Math.hypot(this.tx - this.x, this.ty - this.y) < 24) {
        this.wt = this.wander + Math.random() * 2;
        this.tx = clamp(this.x + rand(-380, 380), 120, game.W - 220);
        this.ty = rand(SURFACE_Y + 70, floorAt(this.tx) - 70);
      }
      const gx = this.tx - this.x, gy = this.ty - this.y, gl = Math.hypot(gx, gy) || 1;
      let dvx = (gx / gl) * this.speed, dvy = (gy / gl) * this.speed;
      const dx = this.x - p.x, dy = this.y - p.y, d = Math.hypot(dx, dy) || 1;
      if (this.kind === 'evil' && alive) {
        if (p.predator && d < 340) {
          dvx = (dx / d) * this.speed * 1.1; dvy = (dy / d) * this.speed * 1.1;
          this.shake = Math.max(this.shake, 0.05);
        } else if (!p.predator && d < 400 && this.cool <= 0) {
          dvx = -(dx / d) * this.speed; dvy = -(dy / d) * this.speed; this.chasing = true;
        } else if (this.cool > 0) {
          dvx = (dx / d) * this.speed * 0.8; dvy = (dy / d) * this.speed * 0.8;
        }
      } else if (this.flee && alive && d < this.flee) {
        dvx = (dx / d) * this.speed * 1.6; dvy = (dy / d) * this.speed * 1.6;
      }
      this.vx += (dvx - this.vx) * k;
      this.vy += (dvy - this.vy) * k;
    }
    this.x = clamp(this.x + this.vx * dt, 50, game.W - 50);
    this.y += this.vy * dt;
    if (this.kind === 'duck') this.y = clamp(this.y, SURFACE_Y - 12, floorAt(this.x) - this.r);
    else this.y = clamp(this.y, SURFACE_Y + this.r + 6, floorAt(this.x) - this.r - 4);
    if (!this.sucked && Math.abs(this.vx) > 6) this.facing = Math.sign(this.vx);
    this.pull = approach(this.pull, this.sucked ? 1 : 0, 6, dt);
  }

  draw(ctx, mouth) {
    const st = this.pull;
    const x = this.x + (this.shake > 0 ? Math.sin(this.t * 80) * 3 : 0), y = this.y;
    ctx.save();
    if (st > 0.02 && mouth) {
      const a = Math.atan2(mouth.y - y, mouth.x - x);
      const shrink = clamp(Math.hypot(mouth.x - x, mouth.y - y) / 90, 0.45, 1);
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.scale((1 + st * 0.45) * shrink, (1 - st * 0.3) * shrink);
      ctx.rotate(-a);
      ctx.translate(-x, -y);
    }
    const facing = this.sucked && mouth ? (this.x < mouth.x ? -1 : 1) : this.facing;
    const tt = this.t * (this.sucked ? 2 : 1);
    if (this.kind === 'evil') {
      drawAxolotl(ctx, x, y, {
        palette: EVIL_PALETTE, evil: true, t: tt, scale: 0.82, facing,
        swim: this.chasing ? 0.9 : 0.5, tilt: clamp(this.vy / 300, -0.4, 0.4),
        mouth: this.chasing ? 0.45 + 0.35 * Math.sin(this.t * 10) : this.sucked ? 0.8 : 0,
      });
    } else if (this.kind === 'duck') {
      drawDuck(ctx, x, y, tt, facing);
    } else {
      drawFish(ctx, x, y, this.look, tt, facing);
    }
    ctx.restore();
  }
}

const easeOutBack = (u) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };

export class Plant {
  constructor(x, reach, speed) {
    this.x = x; this.baseY = floorAt(x) + 6; this.potH = 48; this.reach = reach; this.speed = speed;
    this.state = 'rest'; this.timer = 1 + Math.random() * 2; this.t = Math.random() * 5;
    const r = this.restPos();
    this.hx = r.x; this.hy = r.y; this.ang = -Math.PI / 2; this.chomp = 0; this.chompT = 0; this.shake = false;
    this.from = { x: r.x, y: r.y }; this.to = { x: r.x, y: r.y }; this.dur = 1;
  }

  restPos() {
    return { x: this.x + Math.sin(this.t * 1.5) * 5, y: this.baseY - this.potH - 26 + Math.sin(this.t * 2.2) * 4 };
  }

  update(dt, game) {
    this.t += dt;
    this.timer -= dt;
    this.shake = false;
    const p = game.player;
    const near = game.mode === 'play' && Math.abs(p.x - this.x) < 380;
    const potTop = this.baseY - this.potH;
    switch (this.state) {
      case 'rest': {
        const r = this.restPos(); this.hx = r.x; this.hy = r.y;
        if (this.timer <= 0 && near) { this.state = 'warn'; this.timer = 0.6 / this.speed; }
        break;
      }
      case 'warn': {
        const r = this.restPos(); this.hx = r.x; this.hy = r.y; this.shake = true;
        if (this.timer <= 0) {
          this.state = 'reach';
          this.dur = this.timer = 0.5 / this.speed;
          this.from = { x: this.hx, y: this.hy };
          this.to = { x: this.x + clamp(p.x - this.x, -150, 150), y: clamp(p.y, potTop - this.reach, potTop - 70) };
        }
        break;
      }
      case 'reach': {
        const e = easeOutBack(1 - Math.max(0, this.timer) / this.dur);
        this.hx = lerp(this.from.x, this.to.x, e); this.hy = lerp(this.from.y, this.to.y, e);
        if (this.timer <= 0) { this.state = 'hold'; this.timer = 0.7; }
        break;
      }
      case 'hold':
        this.hx = approach(this.hx, this.to.x + clamp(p.x - this.to.x, -40, 40), 3, dt);
        this.hy = approach(this.hy, this.to.y + clamp(p.y - this.to.y, -40, 40), 3, dt);
        if (this.timer <= 0) { this.state = 'retract'; this.dur = this.timer = 0.7; this.from = { x: this.hx, y: this.hy }; }
        break;
      case 'retract': {
        const u = 1 - Math.max(0, this.timer) / this.dur, e = u * u * (3 - 2 * u), r = this.restPos();
        this.hx = lerp(this.from.x, r.x, e); this.hy = lerp(this.from.y, r.y, e);
        if (this.timer <= 0) { this.state = 'rest'; this.timer = (1.3 + Math.random() * 2) / this.speed; }
        break;
      }
    }
    const active = this.state === 'reach' || this.state === 'hold';
    this.chompT += dt * (active ? 14 : 3.5);
    this.chomp = 0.5 + 0.5 * Math.sin(this.chompT);
    let want = Math.atan2(p.y - this.hy, p.x - this.hx);
    if (!active && want > 0) want = want < Math.PI / 2 ? -0.1 : -Math.PI + 0.1;
    let diff = want - this.ang;
    while (diff > Math.PI) diff -= TAU;
    while (diff < -Math.PI) diff += TAU;
    this.ang += diff * (1 - Math.exp(-8 * dt));
    if (game.mode === 'play' && Math.hypot(p.x - this.hx, p.y - this.hy) < 26 + p.r * 0.75 * p.scale) {
      game.hurtPlayer(20, this.hx, this.hy);
    }
  }

  draw(ctx) { drawPlant(ctx, this, this.t); }
}

export class Pizza {
  constructor(x, y) { this.ax = x; this.ay = y; this.x = x; this.y = y; this.t = 0; }
  update(dt, game) {
    this.t += dt;
    this.x = this.ax + Math.sin(this.t * 0.9) * 40;
    this.y = this.ay + Math.sin(this.t * 1.7) * 18;
    if (Math.random() < dt * 8) FX.sparks(game.particles, this.x + rand(-30, 30), this.y + rand(-30, 30), 1, '#fff6b0', 40);
    const p = game.player;
    return Math.hypot(p.x - this.x, p.y - this.y) < 48 + p.r * p.scale * 0.5;
  }
  draw(ctx) { drawPizza(ctx, this.x, this.y, this.t); }
}

export class Portal {
  constructor(x, y) { this.x = x; this.y = y; this.lit = false; this.t = 0; }
  update(dt, game) {
    this.t += dt;
    if (!this.lit) return false;
    if (Math.random() < dt * 25) {
      const a = rand(0, TAU), r = rand(90, 130);
      FX.add(game.particles, { type: 'spark', x: this.x + Math.cos(a) * r, y: this.y + Math.sin(a) * r, vx: -Math.cos(a) * 170, vy: -Math.sin(a) * 170, g: 0, drag: 0, life: 0.55, max: 0.55, r: 2.5, c: '#d9ccff', star: true });
    }
    if (game.mode !== 'play') return false;
    const p = game.player, d = Math.hypot(p.x - this.x, p.y - this.y) || 1;
    if (d < 220) { p.vx += ((this.x - p.x) / d) * 600 * dt; p.vy += ((this.y - p.y) / d) * 600 * dt; }
    return d < 52;
  }
  draw(ctx) { drawPortal(ctx, this.x, this.y, floorAt(this.x) + 8, this.lit, this.t); }
}
