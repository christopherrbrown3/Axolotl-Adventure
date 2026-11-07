// Game state: levels, suction, damage, portal travel, boss, and the fireworks finale.
import { H, SURFACE_Y, floorAt, clamp, approach, rand } from './world.js';
import { LEVELS, THEMES } from './levels.js';
import { buildScene, drawBackground, drawForeground } from './scene.js';
import { PALETTES, EVIL_PALETTE, drawAxolotl } from './draw.js';
import { FISH_LOOKS, drawFish, drawDuck } from './art.js';
import { Player, Creature, Plant, Pizza, Portal } from './entities.js';
import { Hand } from './boss.js';
import * as FX from './particles.js';
import { sfx, music } from './audio.js';

const SUCK_RANGE = 250;
const BRIGHT = ['#ff4d6d', '#ffd447', '#4dabf7', '#69db7c', '#c77dff', '#ff922b', '#ffffff'];

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;
    this.t = 0; this.camX = 0; this.shake = 0;
    this.particles = []; this.fireworks = []; this.eatenAll = [];
    this.hintT = {};
    this.colorKey = ui.savedColor();
    this.resize();
    this.loadLevel(0, true);
  }

  get palette() { return PALETTES[this.colorKey]; }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.k = h / H;
    this.viewW = w / this.k;
  }

  setColor(key) { if (PALETTES[key]) this.colorKey = key; }

  newGame(levelIndex = 0) {
    this.eatenAll = [];
    this.loadLevel(levelIndex);
  }

  loadLevel(i, demo = false) {
    const L = LEVELS[i];
    this.levelIndex = i; this.level = L; this.demo = demo;
    this.W = Math.max(L.width, Math.ceil(this.viewW) + 60);
    this.scene = buildScene(THEMES[L.theme], this.W, L.seed);
    this.player = new Player(170, 320);
    this.creatures = []; this.plants = []; this.pizza = null; this.hand = null;
    this.particles = []; this.fireworks = []; this.eatenLevel = [];
    this.portal = L.boss ? null : new Portal(this.W - 130, 330);
    this.spawnCreatures(L);
    if (!demo) {
      for (const x of L.plants || []) this.plants.push(new Plant(x, L.plantReach, L.plantSpeed));
      if (L.boss) this.hand = new Hand(this);
    }
    this.total = this.creatures.length;
    this.camX = 0; this.modeT = 0; this.suckOn = false; this.handSucked = false;
    this.streakAcc = 0; this.bubbleAcc = 0; this.fading = false;
    this.mode = demo ? 'title' : 'play';
    if (!demo) {
      this.ui.startLevel(i, L);
      this.ui.setShiftActive(false);
      this.updateHud();
      music.play(THEMES[L.theme].music);
    }
  }

  spawnCreatures(L) {
    const W = this.W;
    for (const [kind, n] of Object.entries(L.creatures || {})) {
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n;
        let x = 450 + u * (W - 800) + rand(-60, 60), y = rand(170, 520), look = null;
        if (kind === 'minnow') {
          x = 520 + ((i % 3) + 0.5) / 3 * (W - 950) + rand(-90, 90);
          look = FISH_LOOKS.minnow[i % 3];
        } else if (kind === 'fish') {
          look = FISH_LOOKS.fish[i % FISH_LOOKS.fish.length];
        } else if (kind === 'evil') {
          y = rand(220, 540);
        } else if (kind === 'duck') {
          y = SURFACE_Y - 4;
        }
        this.creatures.push(new Creature(kind, x, y, look));
      }
    }
  }

  remaining() {
    let n = 0;
    for (const c of this.creatures) if (!c.eaten) n++;
    return n;
  }

  updateHud() {
    const L = this.level;
    if (L.boss) this.ui.setCounter(this.hand ? this.hand.hits : 0, 5, 'hand');
    else this.ui.setCounter(this.total - this.remaining(), this.total, Object.keys(L.creatures)[0]);
    this.ui.setHealth(this.player.hp / this.player.maxHp, !L.boss);
  }

  hint(key, msg, secs = 2.5) {
    const last = this.hintT[key] ?? -99;
    if (this.t - last < 6) return;
    this.hintT[key] = this.t;
    this.ui.toast(msg, secs);
  }

  // ---------- update ----------
  update(dt, input) {
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt);
    const p = this.player;
    switch (this.mode) {
      case 'title': this.updateDemo(dt); break;
      case 'play': p.update(dt, input, this); this.updateSuction(dt, !!input.suck); break;
      case 'dying': this.updateDying(dt); break;
      case 'portal': this.updatePortal(dt); break;
      case 'smushed': p.t += dt; break;
      case 'win': this.updateWin(dt); break;
    }
    if (this.mode !== 'play' && this.suckOn) { this.suckOn = false; sfx.suckStop(); }
    for (const c of this.creatures) if (!c.eaten) c.update(dt, this);
    if (this.mode === 'play') this.checkBites();
    for (const pl of this.plants) pl.update(dt, this);
    if (this.pizza && this.pizza.update(dt, this) && this.mode === 'play') this.eatPizza();
    if (this.portal && this.portal.update(dt, this)) this.enterPortal();
    if (this.hand) this.hand.update(dt, this);
    this.ambient(dt);
    FX.updateParticles(this.particles, dt, this.suckOn ? p.mouthPos() : null);
    FX.updateParticles(this.fireworks, dt, null);
    if (this.mode !== 'title') this.updateCamera(dt);
  }

  updateSuction(dt, sucking) {
    const p = this.player;
    if (sucking !== this.suckOn) { this.suckOn = sucking; if (sucking) sfx.suckStart(); else sfx.suckStop(); }
    this.handSucked = false;
    if (!sucking) { for (const c of this.creatures) c.sucked = false; return; }
    const m = p.mouthPos();
    const range = SUCK_RANGE + p.pred * 70;
    const dirX = p.facing * Math.cos(p.tilt), dirY = Math.sin(p.tilt);
    this.streakAcc += dt * 50;
    while (this.streakAcc >= 1) {
      this.streakAcc -= 1;
      const a = rand(-0.75, 0.75), dd = rand(50, range), ca = Math.cos(a), sa = Math.sin(a);
      FX.add(this.particles, { type: 'streak', x: m.x + (dirX * ca - dirY * sa) * dd, y: m.y + (dirX * sa + dirY * ca) * dd, speed: 100, ang: 0, life: 1.5 });
    }
    for (const c of this.creatures) {
      if (c.eaten) continue;
      const dx = m.x - c.x, dy = m.y - c.y, d = Math.hypot(dx, dy) || 1;
      const dot = (-dx * dirX - dy * dirY) / d;
      if (d > range || (dot < 0.5 && d > 80)) { c.sucked = false; continue; }
      if (c.kind === 'evil' && !p.predator) {
        c.sucked = false; c.shake = 0.25;
        this.hint('evil', 'Too strong! Tap SHARK to turn into a shark!');
        this.ui.pulseShift(true);
        continue;
      }
      c.sucked = true;
      const strength = 0.35 + 0.65 * (1 - d / range);
      const pull = (600 * strength) / c.resist;
      const k = 1 - Math.exp(-7 * dt);
      c.vx += ((dx / d) * pull - c.vx) * k;
      c.vy += ((dy / d) * pull - c.vy) * k;
      if (c.resist > 1.3) { // big ones wriggle and fight back
        const wob = Math.sin(c.t * 22) * 90 * (c.resist - 1);
        c.x += (-dy / d) * wob * dt; c.y += (dx / d) * wob * dt;
      }
      if (d < 24 * p.scale + c.r * 0.5) this.eat(c);
    }
    const h = this.hand;
    if (h && h.vulnerable()) {
      const nx = clamp(m.x, h.left, h.right), ny = clamp(m.y, h.y - 70, h.tipY);
      const d = Math.hypot(m.x - nx, m.y - ny);
      const dot = d < 1 ? 1 : ((nx - m.x) * dirX + (ny - m.y) * dirY) / d;
      if (d < 150 && (dot > 0.3 || d < 60)) { this.handSucked = true; h.meter += dt / 0.9; h.shake = 0.1; }
    }
  }

  eat(c) {
    c.eaten = true; c.sucked = false;
    const p = this.player, m = p.mouthPos();
    p.gulp = 1;
    this.eatenLevel.push({ kind: c.kind, look: c.look });
    if (c.kind === 'duck') sfx.squeak(); else sfx.gulp();
    if (p.predator) sfx.bite();
    FX.bubbles(this.particles, m.x, m.y, 5, 8);
    FX.text(this.particles, m.x, m.y - 44, c.kind === 'duck' ? 'Squeak!' : p.predator ? 'CHOMP!' : 'Gulp!', '#fff', 26);
    this.updateHud();
    const left = this.remaining();
    if (left === 0 && this.portal) {
      this.portal.lit = true;
      sfx.portal();
      this.ui.toast('All gone! The portal is open! Swim right ➜', 3.5);
    } else if (left > 0 && left <= 3) {
      this.ui.toast(`${left} left!`, 1.2);
    }
  }

  checkBites() {
    const p = this.player;
    for (const c of this.creatures) {
      if (c.eaten || c.kind !== 'evil' || c.sucked || p.predator || c.cool > 0) continue;
      if (Math.hypot(c.x - p.x, c.y - p.y) < c.r + p.r * p.scale * 0.8) {
        c.cool = 1.6;
        sfx.bite();
        this.hurtPlayer(15, c.x, c.y);
        c.vx = (c.x - p.x) * 5; c.vy = (c.y - p.y) * 5;
      }
    }
  }

  hurtPlayer(dmg, fx, fy) {
    const p = this.player;
    if (p.inv > 0 || this.mode !== 'play') return;
    p.hp = Math.max(0, p.hp - dmg);
    p.inv = 1.5;
    const dx = p.x - fx, dy = p.y - fy, d = Math.hypot(dx, dy) || 1;
    p.vx = (dx / d) * 450; p.vy = (dy / d) * 450;
    this.shake = 0.3;
    sfx.hurt();
    FX.text(this.particles, p.x, p.y - 54, 'Ouch!', '#ff6b6b', 32);
    FX.sparks(this.particles, p.x, p.y, 10, '#fff7a0', 220);
    this.updateHud();
    if (p.hp <= 0) this.die();
    else if (!this.pizza) this.spawnPizza();
  }

  spawnPizza() {
    const p = this.player, side = Math.random() < 0.5 ? -1 : 1;
    let x = p.x + side * rand(180, 300);
    if (x < 120 || x > this.W - 180) x = p.x - side * rand(180, 300);
    this.pizza = new Pizza(clamp(x, 120, this.W - 180), rand(SURFACE_Y + 80, 270));
    sfx.magic();
    this.hint('pizza', 'A magic pizza! Catch it to heal!', 3);
  }

  eatPizza() {
    const p = this.player;
    p.hp = Math.min(p.maxHp, p.hp + 40);
    FX.hearts(this.particles, p.x, p.y - 20, 8);
    FX.text(this.particles, p.x, p.y - 60, 'Yum!', '#ffd447', 34);
    sfx.heal();
    this.pizza = null;
    this.updateHud();
  }

  die() {
    this.mode = 'dying'; this.modeT = 0;
    if (this.player.predator) { this.player.predator = false; this.ui.setShiftActive(false); }
    sfx.die();
    this.ui.toast('Oh no! Try again!', 2.2);
  }

  updateDying(dt) {
    const p = this.player;
    this.modeT += dt; p.t += dt;
    p.bellyUp = true; p.mouthOpen = 0; p.inv = 0;
    p.swim = approach(p.swim, 0, 3, dt);
    p.tilt = approach(p.tilt, 0, 3, dt);
    p.y = Math.max(SURFACE_Y + 40, p.y - 50 * dt);
    if (this.modeT > 2.4) this.loadLevel(this.levelIndex);
  }

  enterPortal() {
    if (this.mode !== 'play') return;
    this.mode = 'portal'; this.modeT = 0;
    sfx.whoosh();
    this.eatenAll.push(...this.eatenLevel);
    this.ui.unlock(this.levelIndex + 1);
  }

  updatePortal(dt) {
    const p = this.player, pt = this.portal;
    this.modeT += dt; p.t += dt;
    p.x = approach(p.x, pt.x, 5, dt); p.y = approach(p.y, pt.y, 5, dt);
    p.spin += dt * 12; p.swim = 1; p.mouthOpen = 0;
    p.scaleMul = Math.max(0.05, 1 - this.modeT / 1.1);
    if (this.modeT > 0.8 && !this.fading) { this.fading = true; this.ui.fade(true); }
    if (this.modeT > 1.4) { this.loadLevel(this.levelIndex + 1); this.ui.fade(false); }
  }

  toggleShift() {
    if (!this.level.shapeshift || this.mode !== 'play') return;
    const p = this.player;
    p.setShark(!p.predator);
    sfx.shift(p.predator);
    FX.bubbles(this.particles, p.x, p.y, 22, 50);
    FX.sparks(this.particles, p.x, p.y, 20, p.predator ? '#bfe3ff' : '#ffffff', 260);
    FX.text(this.particles, p.x, p.y - 84, p.predator ? 'SHARK!' : 'Axolotl again!', p.predator ? '#bfe3ff' : '#fff', 32);
    this.ui.setShiftActive(p.predator);
    this.ui.pulseShift(false);
    if (p.predator) this.hint('pred', 'You are a SHARK! The evil axolotls are scared of you!', 2.5);
  }

  // ---------- tank 5 ----------
  smush() {
    if (this.mode !== 'play') return;
    const p = this.player;
    this.mode = 'smushed';
    p.squash = 1; p.mouthOpen = 0; p.predator = false;
    this.hand.state = 'grab'; this.hand.timer = 2.0;
    this.shake = 0.5;
    sfx.smush();
    FX.text(this.particles, p.x, p.y - 40, 'SMUSH!', '#ffd447', 40);
    this.ui.toast('SMUSH! The hand got you!', 2);
  }

  respawnFromHand() {
    const p = this.player, h = this.hand;
    p.squash = 0; p.spin = 0;
    p.x = h.x < this.W / 2 ? this.W * 0.72 : this.W * 0.28;
    p.y = SURFACE_Y + 40; p.vx = 0; p.vy = 160; p.inv = 2.5;
    this.mode = 'play';
    sfx.splash();
    FX.bubbles(this.particles, p.x, p.y, 14, 30);
    this.ui.toast('Splash! You can do it!', 1.6);
  }

  onHandHit(n) {
    this.updateHud();
    FX.text(this.particles, this.hand.x, this.hand.y - 40, `${n}/5`, '#ffd447', 44);
    if (n < 5) this.ui.toast(n === 4 ? 'One more time!' : `${5 - n} more to go!`, 1.6);
  }

  startWin() {
    if (this.mode === 'win') return;
    this.mode = 'win'; this.modeT = 0;
    this.ui.unlock(LEVELS.length - 1);
    this.ui.hideControls();
    music.stop();
    sfx.win();
    this.spitQueue = this.eatenAll.slice();
    const extra = ['minnow', 'fish', 'duck', 'evil'];
    for (let i = 0; this.spitQueue.length < 18; i++) {
      const kind = extra[i % 4];
      this.spitQueue.push({ kind, look: kind === 'minnow' ? FISH_LOOKS.minnow[i % 3] : kind === 'fish' ? FISH_LOOKS.fish[i % 5] : null });
    }
    this.spit = []; this.spitT = 1.2; this.winShown = false; this.fwT = 0; this.fwLeft = 14;
  }

  updateWin(dt) {
    const p = this.player;
    this.modeT += dt; p.t += dt;
    p.x = approach(p.x, this.camX + this.viewW * 0.5, 2, dt);
    p.y = approach(p.y, 470, 2, dt);
    p.facing = 1; p.squash = 0; p.bellyUp = false; p.predator = false; p.inv = 0;
    p.tilt = approach(p.tilt, -1.1, 3, dt); p.swim = 0.5;
    p.pred = approach(p.pred, 0, 5, dt);
    p.gulp = Math.max(0, p.gulp - dt * 3);
    p.mouthOpen = approach(p.mouthOpen, this.spitQueue.length ? 0.9 : 0, 8, dt);
    p.updateBlink(dt);
    this.spitT -= dt;
    if (this.spitT <= 0 && this.spitQueue.length) {
      this.spitT = 0.14;
      const it = this.spitQueue.shift(), m = p.mouthPos();
      this.spit.push({ ...it, x: m.x, y: m.y, vx: rand(-230, 230), vy: rand(-840, -640), t: rand(0, 5), target: rand(40, 250) });
      sfx.spit();
    }
    for (const f of this.spit) {
      f.t += dt; f.vy += 260 * dt; f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.y < f.target || f.vy > -40) {
        f.dead = true;
        const base = f.kind === 'duck' ? '#ffd93b' : f.kind === 'evil' ? '#c77dff' : f.look ? f.look.color : '#ffffff';
        FX.firework(this.fireworks, f.x, f.y, [base, BRIGHT[(Math.random() * BRIGHT.length) | 0], '#ffffff']);
        sfx.pop();
      }
    }
    this.spit = this.spit.filter((f) => !f.dead);
    if (!this.spitQueue.length && !this.spit.length) {
      this.fwT -= dt;
      if (this.fwT <= 0 && this.fwLeft > 0) {
        this.fwLeft--; this.fwT = rand(0.35, 0.8);
        FX.firework(this.fireworks, this.camX + rand(80, this.viewW - 80), rand(60, 300), [BRIGHT[(Math.random() * 7) | 0], BRIGHT[(Math.random() * 7) | 0], '#fff']);
        sfx.pop();
      }
      if (!this.winShown) { this.winShown = true; setTimeout(() => this.ui.showWin(this.eatenAll.length), 1500); }
    }
  }

  // ---------- misc ----------
  updateDemo(dt) {
    const p = this.player;
    p.t += dt;
    this.camX = clamp(300 + Math.sin(this.t * 0.07) * 250, 0, Math.max(0, this.W - this.viewW));
    const nx = this.camX + this.viewW * 0.5 + Math.sin(this.t * 0.45) * this.viewW * 0.32;
    const ny = 420 + Math.sin(this.t * 0.9) * 110;
    if (Math.abs(nx - p.x) > 0.2) p.facing = nx > p.x ? 1 : -1;
    p.tilt = approach(p.tilt, clamp((ny - p.y) / Math.max(dt, 0.001) / 400, -0.5, 0.5), 5, dt);
    p.x = nx; p.y = ny; p.swim = 0.7;
    p.mouthOpen = approach(p.mouthOpen, Math.sin(this.t * 0.6) > 0.85 ? 1 : 0, 10, dt);
    p.updateBlink(dt);
  }

  ambient(dt) {
    this.bubbleAcc += dt;
    if (this.bubbleAcc > 0.15) {
      this.bubbleAcc = 0;
      for (const b of this.scene.bubblers) {
        if (b.x < this.camX - 50 || b.x > this.camX + this.viewW + 50) continue;
        FX.add(this.particles, { type: 'bubble', x: b.x + rand(-4, 4), y: floorAt(b.x) - 10, vx: rand(-8, 8), vy: rand(-80, -40), r: rand(2, 5), life: 6, ph: rand(0, 6) });
      }
    }
    if (Math.random() < dt * 0.5 && (this.mode === 'play' || this.mode === 'title')) {
      const m = this.player.mouthPos();
      FX.bubbles(this.particles, m.x, m.y - 6, 2, 3);
    }
  }

  updateCamera(dt) {
    if (this.mode === 'win') return;
    const p = this.player, maxCam = this.W - this.viewW;
    const target = maxCam <= 0 ? maxCam / 2 : clamp(p.x - this.viewW * 0.42 + p.facing * 50, 0, maxCam);
    this.camX = approach(this.camX, target, 4, dt);
  }

  // ---------- render ----------
  render() {
    const ctx = this.ctx, k = this.k * this.dpr;
    const sh = this.shake * 18;
    const ox = sh ? rand(-sh, sh) : 0, oy = sh ? rand(-sh, sh) : 0;
    const cam = this.camX + ox, x0 = cam, x1 = cam + this.viewW;
    ctx.setTransform(k, 0, 0, k, -cam * k, oy * k);
    drawBackground(ctx, this.scene, cam, this.viewW, this.t);
    if (this.portal) this.portal.draw(ctx);
    for (const pl of this.plants) if (pl.x > x0 - 250 && pl.x < x1 + 250) pl.draw(ctx);
    const m = this.suckOn ? this.player.mouthPos() : null;
    for (const c of this.creatures) if (!c.eaten && c.x > x0 - 100 && c.x < x1 + 100) c.draw(ctx, m);
    if (this.pizza) this.pizza.draw(ctx);
    if (this.hand) this.hand.drawShadow(ctx);
    const grabbed = this.mode === 'smushed';
    if (!grabbed && this.mode !== 'win') this.player.draw(ctx, this.palette);
    if (this.hand) this.hand.draw(ctx);
    if (grabbed) this.player.draw(ctx, this.palette);
    FX.drawParticles(ctx, this.particles, x0, x1);
    drawForeground(ctx, this.scene, cam, this.viewW, this.t);
    if (this.hand) this.hand.drawOverlay(ctx);
    if (this.mode === 'win') {
      ctx.fillStyle = `rgba(8,6,40,${Math.min(0.6, this.modeT * 0.25)})`;
      ctx.fillRect(x0 - 20, -20, this.viewW + 40, H + 40);
      for (const f of this.spit) this.drawSpit(ctx, f);
      this.player.draw(ctx, this.palette);
      FX.drawParticles(ctx, this.fireworks, x0, x1);
    }
    ctx.setTransform(k, 0, 0, k, 0, 0);
    if (this.mode === 'play') this.drawIndicators(ctx);
  }

  drawSpit(ctx, f) {
    const a = Math.atan2(f.vy, f.vx);
    ctx.save();
    ctx.translate(f.x, f.y);
    if (f.kind === 'duck') { ctx.rotate(f.t * 6); drawDuck(ctx, 0, 0, f.t, 1, 0.8); }
    else if (f.kind === 'evil') drawAxolotl(ctx, 0, 0, { palette: EVIL_PALETTE, evil: true, t: f.t, scale: 0.6, facing: 1, tilt: a, swim: 1 });
    else { ctx.rotate(a); drawFish(ctx, 0, 0, f.look, f.t * 2, 1); }
    ctx.restore();
  }

  drawIndicators(ctx) {
    const vw = this.viewW, x0 = this.camX, pulse = 0.6 + 0.4 * Math.sin(this.t * 6);
    if (this.remaining() <= 5) {
      for (const c of this.creatures) {
        if (c.eaten) continue;
        const sx = c.x - x0;
        if (sx > -10 && sx < vw + 10) continue;
        const right = sx >= vw;
        arrow(ctx, right ? vw - 22 : 22, clamp(c.y, 140, H - 160), right ? 1 : -1, `rgba(255,224,102,${pulse})`, 14);
      }
    }
    if (this.portal && this.portal.lit && this.portal.x - x0 > vw - 20) {
      arrow(ctx, vw - 40, this.portal.y, 1, `rgba(150,240,255,${pulse})`, 30);
    }
  }
}

function arrow(ctx, x, y, dir, color, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(s, 0); ctx.lineTo(-s * 0.6, -s); ctx.lineTo(-s * 0.6, s);
  ctx.closePath();
  ctx.stroke(); ctx.fill();
  ctx.restore();
}
