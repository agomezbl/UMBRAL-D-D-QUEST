/* ==========================================================================
   UMBRAL · utilidades
   ========================================================================== */
if (window.THREE && THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
const U = {};
U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
U.lerp = (a, b, t) => a + (b - a) * t;
U.smooth = (t) => t * t * (3 - 2 * t);
U.easeOut = (t) => 1 - Math.pow(1 - t, 3);
U.easeIn = (t) => t * t * t;
U.easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
U.easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
U.damp = (a, b, lambda, dt) => U.lerp(a, b, 1 - Math.exp(-lambda * dt));
U.rand = (a = 0, b = 1) => a + Math.random() * (b - a);
U.randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
U.shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
U.key = (x, y) => x + ',' + y;
U.cheb = (ax, ay, bx, by) => Math.max(Math.abs(ax - bx), Math.abs(ay - by));
U.manh = (ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by);

/* Generador pseudoaleatorio con semilla (texturas reproducibles) */
U.mulberry = (seed) => () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* Ruido de valor 2D con tileado (para texturas sin costuras) */
U.makeNoise = (seed, period = 256) => {
  const r = U.mulberry(seed);
  const perm = new Uint16Array(512);
  const grad = new Float32Array(256);
  for (let i = 0; i < 256; i++) { perm[i] = i; grad[i] = r(); }
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
  for (let i = 0; i < 256; i++) perm[256 + i] = perm[i];
  const h = (x, y) => grad[perm[(perm[x & 255] + y) & 255]];
  function n(x, y, p) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const x0 = ((xi % p) + p) % p, y0 = ((yi % p) + p) % p;
    const x1 = (x0 + 1) % p, y1 = (y0 + 1) % p;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = h(x0, y0), b = h(x1, y0), c = h(x0, y1), d = h(x1, y1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  return {
    n,
    fbm(x, y, oct = 4, p = 8) {
      let s = 0, amp = 0.5, f = 1, norm = 0;
      for (let o = 0; o < oct; o++) { s += amp * n(x * f, y * f, p * f); norm += amp; amp *= 0.5; f *= 2; }
      return s / norm;
    }
  };
};

/* Promesas de espera que respetan la velocidad de animación */
U.sleep = (ms) => new Promise((res) => setTimeout(res, ms / (U.speed || 1)));
U.speed = 1;
U.nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

/* Tweens simples manejados por el bucle principal */
U.tweens = [];
U.tween = (dur, fn, ease = U.easeInOut) => new Promise((resolve) => {
  if (dur <= 0 || U.instant) { fn(1); resolve(); return; }
  U.tweens.push({ t: 0, dur: dur / 1000, fn, ease, resolve });
});
U.updateTweens = (dt) => {
  for (let i = U.tweens.length - 1; i >= 0; i--) {
    const tw = U.tweens[i];
    tw.t += dt * (U.speed || 1);
    const k = Math.min(1, tw.t / tw.dur);
    try { tw.fn(tw.ease(k)); } catch (e) { console.error(e); }
    if (k >= 1) { U.tweens.splice(i, 1); tw.resolve(); }
  }
};

/* DOM */
U.$ = (sel, root = document) => root.querySelector(sel);
U.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
U.el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
U.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Almacenamiento local seguro */
U.store = {
  get(k, def) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};

U.isTouch = () => (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
U.reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Probabilidades de combate exactas (para la previsualización de ataques) */
U.binom = (n, p) => {
  const out = new Array(n + 1).fill(0);
  out[0] = 1;
  for (let i = 0; i < n; i++) {
    for (let k = i + 1; k >= 1; k--) out[k] = out[k] * (1 - p) + out[k - 1] * p;
    out[0] *= (1 - p);
  }
  return out;
};
U.combatOdds = (atk, def, pShield, ignore = 0) => {
  const A = U.binom(atk, 0.5), D = U.binom(def, pShield);
  let pHit = 0, exp = 0;
  for (let s = 0; s <= atk; s++) for (let b = 0; b <= def; b++) {
    const dmg = Math.max(0, s - Math.max(0, b - ignore));
    const p = A[s] * D[b];
    if (dmg > 0) pHit += p;
    exp += p * dmg;
  }
  return { pHit, exp };
};
