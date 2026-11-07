// On-screen 4-way d-pad with SUCK in the middle. Multi-touch aware: each finger is tracked
// separately and can slide between zones, so kids can hold SUCK with one finger and steer with another.
const ZONES = ['up', 'down', 'left', 'right', 'suck'];

export class Input {
  constructor(dpad) {
    this.dpad = dpad;
    this.state = { up: false, down: false, left: false, right: false, suck: false };
    this.pointers = new Map();
    this.keys = new Set();
    this.onFirstTouch = null;

    const down = (e) => {
      e.preventDefault();
      try { dpad.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      this.pointers.set(e.pointerId, this.zoneFor(e));
      this.recompute();
    };
    const move = (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      e.preventDefault();
      const z = this.zoneFor(e);
      if (z !== this.pointers.get(e.pointerId)) { this.pointers.set(e.pointerId, z); this.recompute(); }
    };
    const up = (e) => {
      if (this.pointers.delete(e.pointerId)) this.recompute();
    };
    dpad.addEventListener('pointerdown', down);
    dpad.addEventListener('pointermove', move);
    dpad.addEventListener('pointerup', up);
    dpad.addEventListener('pointercancel', up);
    dpad.addEventListener('lostpointercapture', up);
    dpad.addEventListener('contextmenu', (e) => e.preventDefault());

    const keyMap = {
      ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
      ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
      Space: 'suck', KeyJ: 'suck', Enter: 'suck',
    };
    window.addEventListener('keydown', (e) => {
      const z = keyMap[e.code];
      if (!z) return;
      e.preventDefault();
      this.keys.add(z);
      this.recompute();
    });
    window.addEventListener('keyup', (e) => {
      const z = keyMap[e.code];
      if (z) { this.keys.delete(z); this.recompute(); }
    });
    window.addEventListener('blur', () => this.reset());
  }

  zoneFor(e) {
    const r = this.dpad.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    if (Math.hypot(dx, dy) < r.width * 0.2) return 'suck';
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'down' : 'up';
  }

  reset() {
    this.pointers.clear();
    this.keys.clear();
    this.recompute();
  }

  recompute() {
    for (const z of ZONES) this.state[z] = this.keys.has(z);
    for (const z of this.pointers.values()) this.state[z] = true;
    for (const z of ZONES) this.dpad.classList.toggle('on-' + z, this.state[z]);
  }
}
