// Boot: wires the DOM, input, audio and the game loop together, and registers the service worker.
import { Game } from './game.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { unlockAudio, suspendAudio, resumeAudio, setMuted, isMuted, sfx, music } from './audio.js';

const $ = (id) => document.getElementById(id);
const ui = new UI();
const input = new Input($('dpad'));
const game = new Game($('game'), ui);
let paused = false;

function pickColor(key) {
  game.setColor(key);
  ui.setColor(key);
  ui.saveColor(key);
  unlockAudio();
  sfx.color();
}
ui.buildColors($('colors'), 44, pickColor);
ui.buildColors($('title-colors'), 76, pickColor);
ui.setColor(game.colorKey);
ui.buildTanks((i) => start(i));

function start(i = 0) {
  unlockAudio();
  paused = false;
  ui.showPause(false);
  ui.hideTitle();
  ui.hideWin();
  input.reset();
  game.newGame(i);
}

function goHome() {
  paused = false;
  music.stop();
  sfx.suckStop();
  ui.showPause(false);
  ui.hideWin();
  game.loadLevel(0, true);
  ui.showTitle();
}

function setPaused(p) {
  if (p && game.mode !== 'play' && game.mode !== 'dying' && game.mode !== 'smushed') return;
  paused = p;
  ui.showPause(p);
  input.reset();
  if (p) { sfx.suckStop(); game.suckOn = false; }
}

$('btn-play').addEventListener('click', () => start(0));
$('btn-pause').addEventListener('click', () => setPaused(true));
$('btn-resume').addEventListener('click', () => setPaused(false));
$('btn-restart').addEventListener('click', () => { setPaused(false); game.loadLevel(game.levelIndex); });
$('btn-home').addEventListener('click', goHome);
$('btn-again').addEventListener('click', () => start(0));
$('btn-win-home').addEventListener('click', goHome);
$('shift-btn').addEventListener('pointerdown', (e) => { e.preventDefault(); game.toggleShift(); });

const muteBtn = $('btn-mute');
const syncMute = () => { muteBtn.textContent = isMuted() ? '🔇 Sound Off' : '🔊 Sound On'; };
muteBtn.addEventListener('click', () => { setMuted(!isMuted()); syncMute(); });
syncMute();

window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' || e.code === 'KeyP') setPaused(!paused);
  if (e.code === 'KeyF') game.toggleShift();
});

// iPad: unlock audio on first touch, and stop the page from scrolling/zooming/bouncing.
document.addEventListener('pointerdown', unlockAudio, { capture: true });
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());

window.addEventListener('resize', () => game.resize());
window.addEventListener('orientationchange', () => setTimeout(() => game.resize(), 250));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (game.mode === 'play') setPaused(true); suspendAudio(); }
  else resumeAudio();
});

const ua = navigator.userAgent;
const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = navigator.standalone || window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches;
if (isIOS && !standalone) $('install-hint').classList.remove('hidden');

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if (!paused) game.update(dt, input.state);
  game.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

window.__axolotl = { game, input, start };
