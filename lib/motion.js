// Closed-form damped spring from 0 → 1 (starting at rest), so any frame can be
// computed directly from time — no simulation state, fully deterministic.
function spring(t, { stiffness = 170, damping = 12, mass = 1 } = {}) {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t));
  }
  if (zeta === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const r1 = -w0 * (zeta - Math.sqrt(zeta * zeta - 1));
  const r2 = -w0 * (zeta + Math.sqrt(zeta * zeta - 1));
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}

const lerp = (a, b, p) => a + (b - a) * p;

const clamp = (x, min = 0, max = 1) => Math.min(max, Math.max(min, x));
// 0 → 1 as t moves from start to end (clamped).
const progress = (t, start, end) => clamp((t - start) / (end - start));
const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);
const easeInOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

// Chain springs through a list of states: [[time, {x, y, ...}, springConfig?], ...].
// Each key launches a spring from the previous state's values toward its own, and the
// springs add up, so the element flows continuously even when keys overlap in time.
function chain(t, keys, defaults) {
  const out = { ...keys[0][1] };
  for (let i = 1; i < keys.length; i++) {
    const [start, to, cfg] = keys[i];
    const from = keys[i - 1][1];
    const p = spring(t - start, cfg ?? defaults);
    for (const k in to) out[k] += (to[k] - from[k]) * p;
  }
  return out;
}

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
// Blend two hex colors; p is clamped so springs can't overshoot into invalid colors.
function mixColor(a, b, p) {
  const [ca, cb, q] = [hexToRgb(a), hexToRgb(b), clamp(p)];
  return `rgb(${ca.map((v, i) => Math.round(lerp(v, cb[i], q))).join(',')})`;
}
