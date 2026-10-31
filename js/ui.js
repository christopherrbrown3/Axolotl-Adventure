// DOM overlays: HUD, color-face buttons, toasts, level cards, title/pause/win screens.
import { PALETTES, COLOR_ORDER, EVIL_PALETTE, drawFace } from './draw.js';
import { FISH_LOOKS, drawFish, drawDuck } from './art.js';
import { LEVELS } from './levels.js';

const $ = (id) => document.getElementById(id);

export const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
};

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w * 2; c.height = h * 2;
  c.style.width = w + 'px'; c.style.height = h + 'px';
  const ctx = c.getContext('2d');
  ctx.scale(2, 2);
  return [c, ctx];
}

export function faceCanvas(palette, px, opts = {}) {
  const [c, ctx] = makeCanvas(px, px);
  drawFace(ctx, px / 2, px / 2 + px * 0.04, px / 100, palette, opts);
  return c;
}

export class UI {
  constructor() {
    this.hud = $('hud');
    this.controls = $('controls');
    this.healthWrap = $('health');
    this.fill = $('health-fill');
    this.levelName = $('level-name');
    this.counterText = $('counter-text');
    this.counterIcon = $('counter-icon');
    this.toastEl = $('toast');
    this.card = $('levelcard');
    this.fadeEl = $('fade');
    this.shiftBtn = $('shift-btn');
    this.colorButtons = [];
    this.iconKind = null;
    this.toastTimer = 0;
    this.shiftBtn.prepend(faceCanvas({ ...PALETTES.orange, body: '#c0392b', belly: '#e17055', gill: '#6c1d1d', dark: '#3d0b0b' }, 64, { predator: true }));
  }

  savedColor() { const c = store.get('axo-color', 'orange'); return PALETTES[c] ? c : 'orange'; }
  saveColor(c) { store.set('axo-color', c); }
  unlocked() { return Math.min(LEVELS.length - 1, parseInt(store.get('axo-unlocked', '0'), 10) || 0); }
  unlock(i) {
    if (i > this.unlocked()) store.set('axo-unlocked', String(Math.min(i, LEVELS.length - 1)));
    if (this.onTank) this.buildTanks(this.onTank);
  }

  buildColors(container, px, onPick) {
    container.innerHTML = '';
    for (const key of COLOR_ORDER) {
      const b = document.createElement('button');
      b.className = 'color-btn';
      b.dataset.color = key;
      b.setAttribute('aria-label', PALETTES[key].name + ' axolotl');
      b.appendChild(faceCanvas(PALETTES[key], px));
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); onPick(key); });
      container.appendChild(b);
      this.colorButtons.push(b);
    }
  }

  setColor(key) {
    for (const b of this.colorButtons) b.classList.toggle('selected', b.dataset.color === key);
  }

  buildTanks(onTank) {
    this.onTank = onTank;
    const wrap = $('tanks'), n = this.unlocked();
    wrap.innerHTML = '';
    LEVELS.forEach((L, i) => {
      const b = document.createElement('button');
      b.className = 'tank-btn';
      b.textContent = String(i + 1);
      b.title = L.name;
      b.disabled = i > n;
      if (i > n) b.textContent = '🔒';
      else b.addEventListener('click', () => onTank(i));
      wrap.appendChild(b);
    });
  }

  startLevel(i, L) {
    this.levelName.textContent = `Tank ${i + 1}: ${L.name}`;
    this.hud.classList.remove('hidden');
    this.controls.classList.remove('hidden');
    this.shiftBtn.classList.toggle('hidden', !L.shapeshift);
    this.pulseShift(!!L.shapeshift);
    this.card.querySelector('.lc-num').textContent = `Tank ${i + 1}`;
    this.card.querySelector('.lc-name').textContent = L.name;
    this.card.querySelector('.lc-goal').textContent = L.goal;
    this.card.classList.remove('hidden', 'play');
    void this.card.offsetWidth;
    this.card.classList.add('play');
  }

  setCounter(n, total, kind) {
    this.counterText.textContent = `${n} / ${total}`;
    if (kind === this.iconKind) return;
    this.iconKind = kind;
    const [c, ctx] = makeCanvas(48, 34);
    if (kind === 'minnow') drawFish(ctx, 24, 17, FISH_LOOKS.minnow[0], 0, 1);
    else if (kind === 'fish') { ctx.translate(24, 17); ctx.scale(0.5, 0.5); drawFish(ctx, 4, 0, FISH_LOOKS.fish[0], 0, 1); }
    else if (kind === 'evil') drawFace(ctx, 24, 18, 0.34, EVIL_PALETTE, { evil: true });
    else if (kind === 'duck') drawDuck(ctx, 22, 22, 0, 1, 0.55);
    else { ctx.font = '26px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✋', 24, 18); }
    this.counterIcon.replaceChildren(c);
  }

  setHealth(f, visible) {
    this.healthWrap.classList.toggle('hidden', !visible);
    this.fill.style.width = Math.round(Math.max(0, f) * 100) + '%';
    this.fill.classList.toggle('low', f <= 0.4);
  }

  toast(msg, secs = 2) {
    const el = this.toastEl;
    el.textContent = msg;
    el.classList.remove('hidden');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.remove('show'), secs * 1000);
  }

  setShiftActive(on) {
    this.shiftBtn.classList.toggle('active', on);
    this.shiftBtn.querySelector('span').textContent = on ? 'Be Cute' : 'Predator';
  }
  pulseShift(on) { this.shiftBtn.classList.toggle('pulse', on); }
  fade(on) { this.fadeEl.classList.toggle('on', on); }
  hideControls() { this.controls.classList.add('hidden'); this.hud.classList.add('hidden'); }

  showTitle() {
    $('title').classList.remove('hidden');
    this.hud.classList.add('hidden');
    this.controls.classList.add('hidden');
    this.card.classList.add('hidden');
  }
  hideTitle() { $('title').classList.add('hidden'); }
  showPause(on) { $('pause').classList.toggle('hidden', !on); }
  showWin(n) {
    $('win-text').textContent = n > 0
      ? `You beat the Giant Hand and spit out ${n} critters as fireworks!`
      : 'You beat the Giant Hand! Fireworks for you!';
    $('win').classList.remove('hidden');
  }
  hideWin() { $('win').classList.add('hidden'); }
}
