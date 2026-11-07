// Tank 4's rubber ducks. Each duck has a mode:
//   mama   - paddles along the surface leading her ducklings, and hurries away when you come close
//   baby   - follows the duck in front of it; scatters if the mama gets eaten
//   hopper - jumps out of the water and splashes down somewhere else when you sneak up underneath
//   bubble - trapped in a soap bubble that rises from the sand; pops when sucked or at the surface
//   float  - an ordinary floating duck that hops now and then
// Any duck pulled underwater and let go shoots back up out of the water.
import { SURFACE_Y, floorAt, clamp, approach, rand } from './world.js';
import { Creature } from './entities.js';
import { drawDuck, drawSoapBubble, DUCK_LOOKS } from './art.js';
import * as FX from './particles.js';
import { sfx } from './audio.js';

const GRAVITY = 900;
const TRAIL_STEP = 0.03; // seconds between remembered positions

export class Duck extends Creature {
  constructor(x, y, { mode = 'float', look = DUCK_LOOKS.yellow, size = 1, leader = null, wait = 0 } = {}) {
    super('duck', x, y, look);
    this.mode = mode; this.size = size; this.leader = leader; this.wait = wait;
    this.r = 24 * size;
    this.resist = mode === 'mama' ? 1.5 : mode === 'baby' ? 0.9 : 1.2;
    this.speed = mode === 'mama' ? 70 : mode === 'hopper' ? 55 : 40;
    this.facing = 1;
    this.air = false;
    this.hopCool = rand(1, 3);
    this.bubbleR = mode === 'bubble' ? 0.6 : 0;
    this.ph = rand(0, 6);
    this.trail = [];
    this.trailT = 0;
  }

  floatY() { return SURFACE_Y - 4 * this.size + Math.sin(this.t * 2) * 2.5; }

  update(dt, game) {
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt);
    const k = 1 - Math.exp(-3 * dt);
    if (this.sucked) {
      this.air = false;
      if (this.mode === 'bubble') this.popBubble(game);
    } else if (this.mode === 'bubble') this.updateBubble(dt, game, k);
    else if (this.air) this.updateAir(dt, game);
    else this.updateSurface(dt, game, k);
    this.x = clamp(this.x + this.vx * dt, 50, game.W - 50);
    this.y = clamp(this.y + this.vy * dt, 10, floorAt(this.x) - this.r);
    if (!this.sucked && this.mode !== 'bubble' && Math.abs(this.vx) > 6) this.facing = Math.sign(this.vx);
    this.pull = approach(this.pull, this.sucked ? 1 : 0, 6, dt);
    this.trailT += dt;
    if (this.trailT >= TRAIL_STEP) {
      this.trailT = 0;
      this.trail.push(this.x);
      if (this.trail.length > 40) this.trail.shift();
    }
  }

  updateBubble(dt, game, k) {
    if (this.wait > 0) { // sitting on the sand while its bubble grows
      this.wait -= dt;
      this.bubbleR = Math.min(1, this.bubbleR + dt * 0.2);
      this.vx = 0; this.vy = 0;
      this.y = floorAt(this.x) - 34 * this.size;
      return;
    }
    this.bubbleR = 1;
    this.vy += (-26 - this.vy) * k;
    this.vx = Math.sin(this.t * 1.2 + this.ph) * 45;
    if (this.y <= SURFACE_Y + 30) this.popBubble(game);
  }

  popBubble(game) {
    this.mode = 'float';
    this.bubbleR = 0;
    FX.add(game.particles, { type: 'ring', x: this.x, y: this.y - 4, r: 30 * this.size, life: 0.3, max: 0.3, c: 'rgba(255,255,255,0.9)' });
    FX.sparks(game.particles, this.x, this.y - 4, 8, '#ffffff', 160);
    sfx.blip();
  }

  updateAir(dt, game) {
    this.vy += GRAVITY * dt;
    const fy = this.floatY();
    if (this.vy > 0 && this.y >= fy) {
      this.air = false;
      this.y = fy; this.vy = 80; this.vx *= 0.5;
      splash(game, this.x);
    }
  }

  updateSurface(dt, game, k) {
    const p = game.player, fy = this.floatY();
    // Bob at the surface; a duck held underwater shoots back up and pops out of the water.
    if (this.y > fy + 10) {
      this.vy -= 800 * dt;
      if (this.vy < -230 && this.y < fy + 30) { this.air = true; return; }
    } else {
      this.vy += (fy - this.y) * 10 * dt;
      this.vy *= Math.exp(-4 * dt);
    }
    const dx = this.x - p.x;
    const near = game.mode === 'play' && Math.abs(dx) < 220;
    if (this.mode === 'baby') {
      if (this.leader && this.leader.eaten) this.leader = this.leader.leader;
      // no mama left at the front of the line: the whole family scatters
      if (!this.leader || this.leader.mode === 'float') this.scatter();
      else {
        // follow the leader's path a moment behind, so the family swims in a line
        const L = this.leader, back = Math.round((L.mode === 'mama' ? 0.75 : 0.55) / TRAIL_STEP);
        const tx = L.trail.length > back ? L.trail[L.trail.length - 1 - back] : L.x - L.facing * 50;
        this.vx = clamp((tx - this.x) * 5, -220, 220);
        return;
      }
    }
    let speed = this.speed;
    if (this.mode === 'mama' && near) { this.facing = dx >= 0 ? 1 : -1; speed = 120; } // hurry away
    if (this.x < 140) this.facing = 1;
    else if (this.x > game.W - 220) this.facing = -1;
    else if (this.mode !== 'mama' && Math.random() < dt * 0.12) this.facing *= -1;
    this.vx += (this.facing * speed - this.vx) * k;
    this.hopCool -= dt;
    if (this.hopCool <= 0 && this.y < fy + 6) {
      if (this.mode === 'hopper' && near && Math.abs(dx) < 170) this.hop(dx >= 0 ? 1 : -1);
      else if (this.mode === 'float' && Math.random() < dt * 0.25) this.hop(this.facing);
    }
  }

  hop(dir) {
    this.air = true;
    this.vy = -rand(250, 300); // low enough to stay visible under the top bar
    this.vx = dir * rand(150, 190);
    this.hopCool = rand(2.2, 3.4);
    sfx.squeak();
  }

  scatter() {
    this.mode = 'float';
    this.leader = null;
    this.speed = 90;
    this.facing = Math.random() < 0.5 ? -1 : 1;
    this.hop(this.facing);
  }

  drawBody(ctx, x, y, facing, tt) {
    const tilt = this.air ? clamp(this.vy / 900, -0.4, 0.4) * facing : 0;
    ctx.save();
    if (tilt) { ctx.translate(x, y); ctx.rotate(tilt); ctx.translate(-x, -y); }
    drawDuck(ctx, x, y, tt, facing, this.size, this.look);
    ctx.restore();
    if (this.bubbleR > 0) drawSoapBubble(ctx, x, y - 4 * this.size, 42 * this.size * this.bubbleR, this.t);
  }
}

function splash(game, x) {
  for (let i = 0; i < 10; i++) {
    FX.add(game.particles, { type: 'sand', x: x + rand(-14, 14), y: SURFACE_Y, vx: rand(-120, 120), vy: rand(-260, -110), r: rand(2, 4), c: 'rgba(255,255,255,0.9)', life: rand(0.35, 0.6) });
  }
  FX.bubbles(game.particles, x, SURFACE_Y + 18, 4, 12);
  sfx.plop();
}

/** Tank 4's duck party: a mama with three ducklings, two hoppers, and the rest rising in soap bubbles. */
export function spawnDucks(W, n) {
  const D = DUCK_LOOKS, y = SURFACE_Y - 4, sx = W / 3000;
  const ducks = [];
  const mama = new Duck(900 * sx, y, { mode: 'mama', size: 1.3 });
  ducks.push(mama);
  let leader = mama;
  for (let i = 0; i < 3; i++) {
    const baby = new Duck(mama.x - 60 - i * 40, y, { mode: 'baby', size: 0.6, leader });
    ducks.push(baby);
    leader = baby;
  }
  ducks.push(new Duck(1800 * sx, y, { mode: 'hopper', look: D.pink }));
  ducks.push(new Duck(2550 * sx, y, { mode: 'hopper', look: D.blue }));
  const spots = [1400, 1900, 2350], looks = [D.green, D.purple, D.orange], waits = [1.5, 7, 13];
  for (let i = 0; ducks.length < n; i++) {
    const x = spots[i % 3] * sx + Math.floor(i / 3) * 80;
    ducks.push(new Duck(x, floorAt(x) - 34, { mode: 'bubble', look: looks[i % 3], wait: waits[i % 3] + Math.floor(i / 3) * 4 }));
  }
  return ducks;
}
