// All sound is synthesized with WebAudio, so the game needs no audio files and works offline.
// iOS only allows audio after a touch, so unlockAudio() is called from the first pointerdown.
let ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
let muted = false;
try { muted = localStorage.getItem('axo-muted') === '1'; } catch (e) { /* storage blocked */ }

export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = 0.55; musicBus.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const s = ctx.createBufferSource();
      s.buffer = ctx.createBuffer(1, 1, 22050);
      s.connect(ctx.destination);
      s.start(0);
      if (wantMusic) music.play(transpose);
    }
    if (ctx.state !== 'running') ctx.resume();
  } catch (e) { /* audio unavailable */ }
}

export function suspendAudio() { try { if (ctx && ctx.state === 'running') ctx.suspend(); } catch (e) { /* ignore */ } }
export function resumeAudio() { try { if (ctx && ctx.state !== 'running') ctx.resume(); } catch (e) { /* ignore */ } }
export const isMuted = () => muted;
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('axo-muted', m ? '1' : '0'); } catch (e) { /* ignore */ }
  if (master) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.02);
}

function tone(freq, dur, o = {}) {
  if (!ctx) return;
  const t0 = (o.at ?? ctx.currentTime) + (o.delay || 0);
  const osc = ctx.createOscillator();
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(o.vol ?? 0.3, t0 + (o.attack ?? 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(o.dest || sfxBus);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}

function noise(dur, o = {}) {
  if (!ctx) return;
  const t0 = ctx.currentTime + (o.delay || 0);
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = o.filter || 'lowpass';
  f.frequency.setValueAtTime(o.freq || 1000, t0);
  if (o.slideTo) f.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + dur);
  f.Q.value = o.q || 1;
  const g = ctx.createGain();
  g.gain.setValueAtTime(o.vol ?? 0.3, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(sfxBus);
  src.start(t0, Math.random()); src.stop(t0 + dur + 0.05);
}

function say(text) {
  if (muted || !('speechSynthesis' in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.pitch = 1.9; u.rate = 1.05;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch (e) { /* ignore */ }
}

let suckNodes = null;

export const sfx = {
  suckStart() {
    if (!ctx || suckNodes) return;
    const t0 = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3;
    f.frequency.setValueAtTime(300, t0); f.frequency.exponentialRampToValueAtTime(1500, t0 + 0.7);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 9;
    const lg = ctx.createGain(); lg.gain.value = 250; lfo.connect(lg); lg.connect(f.frequency);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.08);
    src.connect(f); f.connect(g); g.connect(sfxBus);
    src.start(); lfo.start();
    suckNodes = { src, lfo, g };
  },
  suckStop() {
    if (!suckNodes || !ctx) { suckNodes = null; return; }
    const { src, lfo, g } = suckNodes, t0 = ctx.currentTime;
    g.gain.cancelScheduledValues(t0);
    g.gain.setTargetAtTime(0, t0, 0.03);
    src.stop(t0 + 0.2); lfo.stop(t0 + 0.2);
    suckNodes = null;
  },
  gulp() { tone(520, 0.16, { slideTo: 140, vol: 0.4 }); tone(900, 0.07, { delay: 0.11, slideTo: 1300, vol: 0.15 }); },
  squeak() { tone(1500, 0.09, { type: 'square', slideTo: 2100, vol: 0.1 }); tone(1900, 0.12, { delay: 0.1, type: 'square', slideTo: 1300, vol: 0.1 }); },
  hurt() { tone(420, 0.28, { type: 'square', slideTo: 110, vol: 0.16 }); noise(0.15, { freq: 900, vol: 0.2 }); },
  bite() { tone(240, 0.08, { type: 'sawtooth', slideTo: 90, vol: 0.2 }); },
  magic() { [880, 1175, 1568, 2093].forEach((f, i) => tone(f, 0.25, { delay: i * 0.06, vol: 0.12 })); },
  heal() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, { type: 'triangle', delay: i * 0.07, vol: 0.2 })); },
  die() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, { type: 'triangle', delay: i * 0.18, vol: 0.22 })); },
  portal() { for (let i = 0; i < 8; i++) tone(440 * Math.pow(2, i / 5), 0.3, { delay: i * 0.07, vol: 0.14 }); },
  whoosh() { noise(1.0, { filter: 'bandpass', freq: 200, slideTo: 3000, q: 2, vol: 0.4 }); tone(200, 1.0, { slideTo: 1200, vol: 0.1 }); },
  shift(on) {
    if (on) tone(150, 0.4, { type: 'sawtooth', slideTo: 600, vol: 0.14 });
    else tone(600, 0.3, { slideTo: 1400, vol: 0.14 });
    noise(0.3, { filter: 'highpass', freq: 3000, vol: 0.15 });
  },
  thump() { tone(120, 0.35, { slideTo: 40, vol: 0.6 }); noise(0.25, { freq: 400, vol: 0.35 }); },
  smush() { tone(200, 0.3, { type: 'square', slideTo: 60, vol: 0.25 }); noise(0.3, { freq: 600, vol: 0.4 }); },
  splash() { noise(0.5, { filter: 'bandpass', freq: 1200, slideTo: 300, vol: 0.35 }); },
  ow() { tone(700, 0.35, { type: 'triangle', slideTo: 300, vol: 0.25 }); say('Ow!'); },
  spit() { tone(260, 0.1, { slideTo: 820, vol: 0.18 }); },
  pop() {
    noise(0.6, { freq: 2500, slideTo: 200, vol: 0.3 });
    tone(90, 0.25, { slideTo: 40, vol: 0.28 });
    for (let i = 0; i < 4; i++) noise(0.05, { filter: 'highpass', freq: 4000, vol: 0.08, delay: 0.15 + i * 0.07 });
  },
  win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i === 5 ? 0.6 : 0.18, { type: 'square', delay: i * 0.13, vol: 0.09 })); },
  tap() { tone(700, 0.06, { vol: 0.12 }); },
  color() { tone(880, 0.08, { vol: 0.12 }); tone(1320, 0.1, { delay: 0.06, vol: 0.12 }); },
};

// Gentle looping background music: a C–Am–F–G arpeggio, transposed per tank.
const CHORDS = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]];
const ARP = [0, 1, 2, 1, 2, 1, 0, 1];
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
let musicTimer = null, nextNote = 0, step = 0, transpose = 0, wantMusic = false;

function schedule() {
  if (!ctx || ctx.state !== 'running') return;
  const STEP = 60 / 100 / 2;
  if (nextNote < ctx.currentTime - 0.2) nextNote = ctx.currentTime + 0.05;
  while (nextNote < ctx.currentTime + 0.3) {
    const i = step % 8, ch = CHORDS[Math.floor(step / 8) % 4];
    tone(mtof(ch[ARP[i]] + 12 + transpose), STEP * 1.6, { type: 'triangle', vol: 0.05, at: nextNote, dest: musicBus, attack: 0.01 });
    if (i === 0 || i === 4) tone(mtof(ch[0] - 12 + transpose), STEP * 3.6, { vol: 0.09, at: nextNote, dest: musicBus, attack: 0.02 });
    if (step % 16 === 6 || step % 16 === 14) tone(mtof(ch[2] + 24 + transpose), STEP, { vol: 0.025, at: nextNote, dest: musicBus });
    nextNote += STEP;
    step++;
  }
}

export const music = {
  play(tr = 0) {
    transpose = tr; wantMusic = true;
    if (!ctx || musicTimer) return;
    nextNote = ctx.currentTime + 0.1; step = 0;
    musicTimer = setInterval(schedule, 100);
  },
  stop() {
    wantMusic = false;
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
  },
};
