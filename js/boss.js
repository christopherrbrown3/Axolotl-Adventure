// Tank 5: the kid's giant hand. It tracks you, slams down, and rests on the sand.
// Suck it while it rests and it yanks out yelling "OW!". Five times wins the game.
import { floorAt, clamp, approach, rand } from './world.js';
import { drawHand } from './art.js';
import { ell, rrect } from './draw.js';
import * as FX from './particles.js';
import { sfx } from './audio.js';

const HOVER_Y = 30;        // palm-center height while hovering
const TIP = 148;           // palm center -> fingertip distance
const FONT = '"Chalkboard SE", "Comic Sans MS", sans-serif';

export class Hand {
  constructor(game) {
    this.x = game.W / 2; this.y = -460; this.state = 'enter'; this.timer = 1.6;
    this.hits = 0; this.meter = 0; this.speed = 1; this.curl = 0; this.wiggle = false;
    this.red = 0; this.shake = 0; this.say = 0; this.t = 0; this.vy = 0; this.shadow = 0;
  }

  get tipY() { return this.y + TIP - this.curl * 50; }
  get left() { return this.x - 118; }
  get right() { return this.x + 96; }
  vulnerable() { return this.state === 'rest'; }

  update(dt, game) {
    this.t += dt;
    this.timer -= dt;
    this.shake = Math.max(0, this.shake - dt);
    this.red = Math.max(0, this.red - dt * 0.7);
    this.say = Math.max(0, this.say - dt);
    this.wiggle = false;
    const p = game.player;
    const restY = floorAt(this.x) + 6 - TIP;
    switch (this.state) {
      case 'enter':
        this.y = approach(this.y, HOVER_Y, 3, dt);
        this.curl = approach(this.curl, 0, 6, dt);
        if (this.timer <= 0) { this.state = 'track'; this.timer = rand(1.8, 2.6) / this.speed; }
        break;
      case 'track': {
        const maxV = 260 * this.speed * dt;
        this.x += clamp(clamp(p.x, 160, game.W - 160) - this.x, -maxV, maxV);
        this.y = approach(this.y, HOVER_Y + Math.sin(this.t * 2) * 12, 4, dt);
        this.shadow = approach(this.shadow, 0.5, 3, dt);
        this.wiggle = true;
        if (this.timer <= 0) { this.state = 'windup'; this.timer = 0.55; }
        break;
      }
      case 'windup':
        this.y = approach(this.y, HOVER_Y - 40, 6, dt);
        this.shake = 0.1;
        this.shadow = approach(this.shadow, 1, 6, dt);
        if (this.timer <= 0) { this.state = 'slam'; this.vy = 300; }
        break;
      case 'slam': {
        this.vy += 3800 * dt;
        this.y += this.vy * dt;
        const pr = p.r * p.scale;
        if (game.mode === 'play' && p.inv <= 0 && p.x > this.left - 10 && p.x < this.right + 10 &&
            this.tipY > p.y - pr * 0.6 && this.y < p.y) {
          game.smush();
          return;
        }
        if (this.y >= restY) {
          this.y = restY; this.state = 'rest'; this.meter = 0;
          this.timer = Math.max(1.9, 2.9 - (this.speed - 1) * 2);
          game.shake = 0.4; sfx.thump();
          for (let i = 0; i < 18; i++) {
            FX.add(game.particles, { type: 'sand', x: this.x + rand(-110, 100), y: floorAt(this.x) - 4, vx: rand(-160, 160), vy: rand(-260, -80), r: rand(2, 4), c: game.scene.theme.sand2, life: rand(0.5, 0.9) });
          }
        }
        break;
      }
      case 'rest':
        this.y = restY; this.wiggle = true; this.shadow = 1;
        if (!game.handSucked) this.meter = Math.max(0, this.meter - dt * 0.25);
        if (this.meter >= 1) this.ouch(game);
        else if (this.timer <= 0) this.state = 'rise';
        break;
      case 'rise':
        this.y = approach(this.y, HOVER_Y, 3, dt);
        this.shadow = approach(this.shadow, 0.4, 3, dt);
        if (Math.abs(this.y - HOVER_Y) < 8) { this.state = 'track'; this.timer = rand(1.6, 2.4) / this.speed; }
        break;
      case 'ow':
        this.y -= 900 * dt; this.shake = 0.3;
        this.shadow = approach(this.shadow, 0, 5, dt);
        if (this.timer <= 0) {
          if (this.hits >= 5) { this.state = 'gone'; game.startWin(); }
          else { this.state = 'enter'; this.timer = 1.0; this.y = Math.min(this.y, -460); }
        }
        break;
      case 'grab':
        this.curl = approach(this.curl, 1, 8, dt);
        this.shadow = approach(this.shadow, 0, 3, dt);
        if (this.timer < 1.3) this.y -= 420 * dt;
        p.x = this.x - 10; p.y = this.tipY - 4;
        if (this.timer <= 0) {
          game.respawnFromHand();
          this.state = 'enter'; this.timer = 1.6; this.y = -460; this.curl = 0;
        }
        break;
      case 'gone':
        this.y -= 600 * dt; this.shadow = 0;
        break;
    }
    // the hand is solid while it sits low in the water: nudge the player out sideways
    if ((this.state === 'rest' || this.state === 'rise' || this.state === 'track') && game.mode === 'play') {
      const pr = p.r * p.scale;
      if (p.y + pr * 0.5 > this.y - 70 && p.y - pr * 0.5 < this.tipY && p.x > this.left - pr && p.x < this.right + pr) {
        const roomLeft = this.left - pr > 60;
        if ((p.x < this.x && roomLeft) || this.right + pr > game.W - 60) { p.x = this.left - pr; p.vx = Math.min(p.vx, -60); }
        else { p.x = this.right + pr; p.vx = Math.max(p.vx, 60); }
      }
    }
  }

  ouch(game) {
    this.hits++;
    this.state = 'ow'; this.timer = 1.5; this.say = 1.7; this.red = 1; this.meter = 0;
    this.speed *= 1.12;
    sfx.ow();
    game.onHandHit(this.hits);
  }

  drawShadow(ctx) {
    if (this.shadow <= 0.01) return;
    const fy = floorAt(this.x) + 10;
    ctx.fillStyle = `rgba(0,0,0,${0.3 * this.shadow})`;
    ell(ctx, this.x - 10, fy, 70 + 60 * this.shadow, 12 + 4 * this.shadow); ctx.fill();
  }

  draw(ctx) {
    if (this.y < -700) return;
    drawHand(ctx, this, this.t);
  }

  drawOverlay(ctx) {
    if (this.state === 'rest' && this.meter > 0.02) {
      const w = 140, x = this.x - w / 2 - 10, y = this.y - 108;
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, x - 4, y - 4, w + 8, 26, 13); ctx.fill();
      ctx.fillStyle = '#ffd447'; rrect(ctx, x, y, Math.max(18, w * Math.min(1, this.meter)), 18, 9); ctx.fill();
    }
    if (this.say > 0) {
      const bx = this.x + 150, by = 170, s = 1 + Math.sin(this.say * 20) * 0.06;
      ctx.save();
      ctx.translate(bx, by); ctx.scale(s, s);
      ctx.fillStyle = '#fff'; rrect(ctx, -84, -48, 168, 96, 40); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-60, 30); ctx.lineTo(-110, 70); ctx.lineTo(-30, 40); ctx.fill();
      ctx.fillStyle = '#e8213a'; ctx.font = `900 60px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('OW!', 0, 2);
      ctx.restore();
    }
  }
}
