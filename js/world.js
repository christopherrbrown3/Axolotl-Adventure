// Shared world constants and small math helpers.
export const H = 720;          // logical world height (the view always shows the full tank height)
export const SURFACE_Y = 84;   // water surface line
export const FLOOR_Y = 628;    // average sand line

export function floorAt(x) {
  return FLOOR_Y + Math.sin(x * 0.0075) * 9 + Math.sin(x * 0.021 + 1.3) * 4;
}

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a, b) => a + Math.random() * (b - a);
export const approach = (v, target, rate, dt) => v + (target - v) * (1 - Math.exp(-rate * dt));
export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
