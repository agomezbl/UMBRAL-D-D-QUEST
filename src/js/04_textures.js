/* ==========================================================================
   Texturas procedurales (albedo + relieve + rugosidad + emisión)
   ========================================================================== */
const TEX = {
  cache: {},
  size: 512,
  canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; },
  hexRGB(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; },
  toTex(canvas, srgb = true, repeat = false) {
    const t = new THREE.CanvasTexture(canvas);
    if (srgb) t.encoding = THREE.sRGBEncoding;
    t.anisotropy = TEX.aniso || 4;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
    t.needsUpdate = true;
    return t;
  },
  normalFromHeight(H, S, strength) {
    const c = TEX.canvas(S), ctx = c.getContext('2d'), img = ctx.createImageData(S, S), d = img.data;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const xl = (x - 1 + S) % S, xr = (x + 1) % S, yu = (y - 1 + S) % S, yd = (y + 1) % S;
      const dx = (H[y * S + xr] - H[y * S + xl]) * strength;
      const dy = (H[yd * S + x] - H[yu * S + x]) * strength;
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const i = (y * S + x) * 4;
      d[i] = (-dx * inv * 0.5 + 0.5) * 255; d[i + 1] = (dy * inv * 0.5 + 0.5) * 255; d[i + 2] = (inv * 0.5 + 0.5) * 255; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  },
  grayCanvas(A, S) {
    const c = TEX.canvas(S), ctx = c.getContext('2d'), img = ctx.createImageData(S, S), d = img.data;
    for (let i = 0; i < S * S; i++) { const v = U.clamp(A[i], 0, 1) * 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
    ctx.putImageData(img, 0, 0); return c;
  },

  /* Losa cuadrada: una casilla del tablero = una losa (la cuadrícula se lee sola) */
  floor(theme) {
    const key = 'floor_' + theme.id;
    if (TEX.cache[key]) return TEX.cache[key];
    const S = TEX.size, N = U.makeNoise(theme.seed || 11), N2 = U.makeNoise((theme.seed || 11) + 7);
    const H = new Float32Array(S * S), R = new Float32Array(S * S), E = theme.floorEmissive ? new Float32Array(S * S) : null;
    const c = TEX.canvas(S), ctx = c.getContext('2d'), img = ctx.createImageData(S, S), d = img.data;
    const base = TEX.hexRGB(theme.floor), mort = TEX.hexRGB(theme.mortar), acc = TEX.hexRGB(theme.floorAccent);
    const rnd = U.mulberry(theme.seed || 3);
    // grietas como polilíneas aleatorias
    const cracks = [];
    for (let k = 0; k < 5; k++) {
      let x = rnd() * S, y = rnd() * S, a = rnd() * Math.PI * 2;
      const pts = [[x, y]];
      for (let s = 0; s < 14; s++) { a += (rnd() - 0.5) * 1.2; x += Math.cos(a) * S * 0.035; y += Math.sin(a) * S * 0.035; pts.push([x, y]); }
      cracks.push(pts);
    }
    const crackMap = TEX.canvas(S), cm = crackMap.getContext('2d');
    cm.fillStyle = '#000'; cm.fillRect(0, 0, S, S); cm.strokeStyle = '#fff'; cm.lineCap = 'round';
    cracks.forEach((p) => { cm.lineWidth = S * 0.004 + rnd() * S * 0.004; cm.beginPath(); p.forEach(([x, y], i) => (i ? cm.lineTo(x, y) : cm.moveTo(x, y))); cm.stroke(); });
    const cd = cm.getImageData(0, 0, S, S).data;
    const edge = 0.045;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const u = x / S, v = y / S, i = y * S + x;
      const n1 = N.fbm(u * 8, v * 8, 5, 8), n2 = N2.fbm(u * 3, v * 3, 3, 3), n3 = N.n(u * 64, v * 64, 64);
      const wob = (N2.n(u * 20, v * 20, 20) - 0.5) * 0.02;
      const dEdge = Math.min(u, v, 1 - u, 1 - v) + wob;
      let h = U.smooth(U.clamp(dEdge / edge, 0, 1));
      const bevel = U.clamp((dEdge - edge) / 0.05, 0, 1);
      h = h * (0.82 + 0.18 * bevel) + (n1 - 0.5) * 0.18 * h + (n3 - 0.5) * 0.04;
      const crack = cd[i * 4] / 255;
      h -= crack * 0.35 * h;
      H[i] = h;
      const t = U.clamp(n2 * 1.3 - 0.2, 0, 1);
      let r = U.lerp(base[0], acc[0], t), g = U.lerp(base[1], acc[1], t), b = U.lerp(base[2], acc[2], t);
      const shade = 0.78 + n1 * 0.4 + (n3 - 0.5) * 0.12;
      r *= shade; g *= shade; b *= shade;
      const m = 1 - U.clamp(dEdge / edge, 0, 1);
      const mk = Math.max(m, crack * 0.85);
      r = U.lerp(r, mort[0], mk); g = U.lerp(g, mort[1], mk); b = U.lerp(b, mort[2], mk);
      // desgaste central más claro (pisado durante siglos)
      const cx = u - 0.5, cy = v - 0.5, wear = Math.max(0, 1 - Math.sqrt(cx * cx + cy * cy) * 2.2) * 0.08;
      r += wear * 255 * 0.3; g += wear * 255 * 0.3; b += wear * 255 * 0.3;
      d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
      R[i] = U.clamp(theme.floorRough + (n1 - 0.5) * 0.3 + mk * 0.2 - wear * 2, 0.15, 1);
      if (E) E[i] = Math.pow(mk, 1.5) * U.clamp(N2.fbm(u * 4 + 3, v * 4, 3, 4) * 2 - 0.7, 0, 1);
    }
    ctx.putImageData(img, 0, 0);
    const res = {
      map: TEX.toTex(c), normalMap: TEX.toTex(TEX.normalFromHeight(H, S, theme.floorBump || 6), false),
      roughnessMap: TEX.toTex(TEX.grayCanvas(R, S), false)
    };
    if (E) res.emissiveMap = TEX.toTex(TEX.grayCanvas(E, S));
    return (TEX.cache[key] = res);
  },

  /* Sillería de muro */
  wall(theme) {
    const key = 'wall_' + theme.id;
    if (TEX.cache[key]) return TEX.cache[key];
    const S = TEX.size, N = U.makeNoise((theme.seed || 5) + 21), N2 = U.makeNoise((theme.seed || 5) + 40);
    const H = new Float32Array(S * S), R = new Float32Array(S * S), E = theme.wallRunes ? new Float32Array(S * S) : null;
    const c = TEX.canvas(S), ctx = c.getContext('2d'), img = ctx.createImageData(S, S), d = img.data;
    const base = TEX.hexRGB(theme.wall), mort = TEX.hexRGB(theme.mortar), moss = TEX.hexRGB(theme.moss);
    const rows = 5, rnd = U.mulberry(theme.seed || 9);
    const offs = []; const tint = [];
    for (let r = 0; r < rows; r++) { offs.push(rnd()); const row = []; for (let k = 0; k < 6; k++) row.push(0.85 + rnd() * 0.3); tint.push(row); }
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const u = x / S, v = y / S, i = y * S + x;
      const row = Math.floor(v * rows), fv = v * rows - row;
      const bw = 0.5; const uu = (u + offs[row] * bw) / bw, col = Math.floor(uu), fu = uu - col;
      const n1 = N.fbm(u * 6, v * 6, 5, 6), n3 = N2.n(u * 48, v * 48, 48);
      const wob = (N2.n(u * 14, v * 14, 14) - 0.5) * 0.06;
      const de = Math.min(fu * 2, (1 - fu) * 2, fv, 1 - fv) + wob;
      const e = 0.07;
      let h = U.smooth(U.clamp(de / e, 0, 1)) * (0.85 + n1 * 0.3) + (n3 - 0.5) * 0.05;
      H[i] = h;
      const tt = tint[row][((col % 6) + 6) % 6];
      let r = base[0] * tt * (0.75 + n1 * 0.5), g = base[1] * tt * (0.75 + n1 * 0.5), b = base[2] * tt * (0.75 + n1 * 0.5);
      const m = 1 - U.clamp(de / e, 0, 1);
      r = U.lerp(r, mort[0], m); g = U.lerp(g, mort[1], m); b = U.lerp(b, mort[2], m);
      // musgo/hollín en la base del muro
      const mossAmt = U.clamp((v - 0.55) * 2.2 + (N.fbm(u * 5, v * 5, 4, 5) - 0.5) * 1.2, 0, 1) * theme.mossAmt;
      r = U.lerp(r, moss[0], mossAmt); g = U.lerp(g, moss[1], mossAmt); b = U.lerp(b, moss[2], mossAmt);
      d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
      R[i] = U.clamp(0.82 + (n1 - 0.5) * 0.3 + m * 0.1, 0.3, 1);
      if (E) E[i] = 0;
    }
    if (E) {
      // runas grabadas que brillan débilmente
      const rc = TEX.canvas(S), r2 = rc.getContext('2d');
      r2.fillStyle = '#000'; r2.fillRect(0, 0, S, S); r2.strokeStyle = '#fff'; r2.lineWidth = S * 0.006; r2.lineCap = 'round';
      for (let k = 0; k < 4; k++) {
        const cx = S * (0.15 + rnd() * 0.7), cy = S * (0.15 + Math.floor(rnd() * rows) / rows + 0.05);
        TEX.glyph(r2, cx, cy, S * 0.05, rnd);
      }
      const rd = r2.getImageData(0, 0, S, S).data;
      for (let i = 0; i < S * S; i++) { E[i] = rd[i * 4] / 255; H[i] -= E[i] * 0.15; }
    }
    ctx.putImageData(img, 0, 0);
    const res = { map: TEX.toTex(c), normalMap: TEX.toTex(TEX.normalFromHeight(H, S, 5), false), roughnessMap: TEX.toTex(TEX.grayCanvas(R, S), false) };
    if (E) res.emissiveMap = TEX.toTex(TEX.grayCanvas(E, S));
    return (TEX.cache[key] = res);
  },

  glyph(ctx, cx, cy, s, rnd) {
    ctx.beginPath();
    const n = 3 + Math.floor(rnd() * 3);
    let x = cx + (rnd() - 0.5) * s, y = cy - s;
    ctx.moveTo(x, y);
    for (let k = 0; k < n; k++) {
      x = cx + (rnd() - 0.5) * s * 1.4; y = cy + (rnd() - 0.5) * s * 2;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    if (rnd() < 0.6) { ctx.beginPath(); ctx.arc(cx, cy, s * 0.35, 0, Math.PI * 2); ctx.stroke(); }
  },

  wood() {
    if (TEX.cache.wood) return TEX.cache.wood;
    const S = 256, N = U.makeNoise(77);
    const H = new Float32Array(S * S);
    const c = TEX.canvas(S), ctx = c.getContext('2d'), img = ctx.createImageData(S, S), d = img.data;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const u = x / S, v = y / S, i = y * S + x;
      const plank = Math.floor(u * 4), fu = u * 4 - plank;
      const grain = Math.sin((v * 30 + N.fbm(u * 4 + plank, v * 2, 4, 4) * 8) * 2) * 0.5 + 0.5;
      const edge = Math.min(fu, 1 - fu);
      let h = U.smooth(U.clamp(edge / 0.06, 0, 1)) * (0.8 + grain * 0.2);
      const band = (v > 0.14 && v < 0.22) || (v > 0.78 && v < 0.86);
      let r = 92 + grain * 40 + plank * 6, g = 58 + grain * 24 + plank * 3, b = 34 + grain * 12;
      if (edge < 0.04) { r *= 0.4; g *= 0.4; b *= 0.4; }
      if (band) { r = 48 + grain * 10; g = 46 + grain * 8; b = 50 + grain * 10; h = 1.1; const rv = (fu - 0.5); if (Math.abs(rv) < 0.06 && Math.abs(((v > 0.5 ? 0.82 : 0.18) - v)) < 0.02) { r = g = b = 120; h = 1.3; } }
      H[i] = h;
      d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return (TEX.cache.wood = { map: TEX.toTex(c), normalMap: TEX.toTex(TEX.normalFromHeight(H, S, 4), false) });
  },

  /* Grano fino para que las miniaturas no parezcan plástico */
  grain() {
    if (TEX.cache.grain) return TEX.cache.grain;
    const S = 128, N = U.makeNoise(5), H = new Float32Array(S * S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) H[y * S + x] = N.fbm(x / S * 8, y / S * 8, 4, 8);
    const t = TEX.toTex(TEX.normalFromHeight(H, S, 3), false, true);
    t.repeat.set(3, 3);
    return (TEX.cache.grain = t);
  },

  dot() {
    if (TEX.cache.dot) return TEX.cache.dot;
    const S = 64, c = TEX.canvas(S), ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    const t = TEX.toTex(c, false); t.generateMipmaps = false; t.minFilter = THREE.LinearFilter;
    return (TEX.cache.dot = t);
  },
  blob() {
    if (TEX.cache.blob) return TEX.cache.blob;
    const S = 128, c = TEX.canvas(S), ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(0,0,0,0.85)'); g.addColorStop(0.5, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    return (TEX.cache.blob = TEX.toTex(c, false));
  },
  /* Círculo rúnico para selección, objetivos y sellos */
  runeRing(seed = 1) {
    const key = 'rune' + seed;
    if (TEX.cache[key]) return TEX.cache[key];
    const S = 512, c = TEX.canvas(S), ctx = c.getContext('2d'), rnd = U.mulberry(seed * 13);
    ctx.translate(S / 2, S / 2);
    ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineCap = 'round';
    ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, S * 0.46, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, S * 0.40, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, S * 0.30, 0, Math.PI * 2); ctx.stroke();
    const n = 18;
    for (let k = 0; k < n; k++) {
      ctx.save(); ctx.rotate((k / n) * Math.PI * 2); ctx.translate(0, -S * 0.35); ctx.lineWidth = 3;
      TEX.glyph(ctx, 0, 0, S * 0.022, rnd); ctx.restore();
    }
    for (let k = 0; k < 6; k++) { ctx.save(); ctx.rotate((k / 6) * Math.PI * 2); ctx.beginPath(); ctx.moveTo(0, -S * 0.30); ctx.lineTo(S * 0.26 * Math.sin(Math.PI / 3), -S * 0.30 * Math.cos(Math.PI / 3)); ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
    for (let k = 0; k < 4; k++) { ctx.save(); ctx.rotate((k / 4) * Math.PI * 2 + Math.PI / 4); ctx.beginPath(); ctx.moveTo(0, -S * 0.47); ctx.lineTo(-10, -S * 0.5); ctx.lineTo(10, -S * 0.5); ctx.closePath(); ctx.fill(); ctx.restore(); }
    return (TEX.cache[key] = TEX.toTex(c, false));
  },
  /* Marco de casilla para alcance de movimiento */
  tileFrame() {
    if (TEX.cache.tileFrame) return TEX.cache.tileFrame;
    const S = 128, c = TEX.canvas(S), ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, S);
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(8, 8, S - 16, S - 16);
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 4;
    const r = 10, m = 10;
    ctx.beginPath(); ctx.moveTo(m + r, m); ctx.lineTo(S - m - r, m); ctx.quadraticCurveTo(S - m, m, S - m, m + r); ctx.lineTo(S - m, S - m - r); ctx.quadraticCurveTo(S - m, S - m, S - m - r, S - m); ctx.lineTo(m + r, S - m); ctx.quadraticCurveTo(m, S - m, m, S - m - r); ctx.lineTo(m, m + r); ctx.quadraticCurveTo(m, m, m + r, m); ctx.stroke();
    void g;
    return (TEX.cache.tileFrame = TEX.toTex(c, false));
  },
  web() {
    if (TEX.cache.web) return TEX.cache.web;
    const S = 256, c = TEX.canvas(S), ctx = c.getContext('2d'), rnd = U.mulberry(4);
    ctx.strokeStyle = 'rgba(230,230,230,0.55)'; ctx.lineWidth = 1.2;
    const spokes = 9;
    for (let k = 0; k < spokes; k++) { const a = (k / (spokes - 1)) * Math.PI / 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * S, Math.sin(a) * S); ctx.stroke(); }
    for (let r = 20; r < S; r += 18 + rnd() * 10) { ctx.beginPath(); for (let k = 0; k < spokes; k++) { const a = (k / (spokes - 1)) * Math.PI / 2; const rr = r * (0.9 + rnd() * 0.15); const x = Math.cos(a) * rr, y = Math.sin(a) * rr; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
    return (TEX.cache.web = TEX.toTex(c, false));
  },
  /* Pergamino de nota */
  parchment() {
    if (TEX.cache.parch) return TEX.cache.parch;
    const S = 128, c = TEX.canvas(S), ctx = c.getContext('2d'), N = U.makeNoise(31);
    const img = ctx.createImageData(S, S), d = img.data;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const n = N.fbm(x / S * 4, y / S * 4, 4, 4); const i = (y * S + x) * 4; d[i] = 200 + n * 40; d[i + 1] = 175 + n * 35; d[i + 2] = 130 + n * 25; d[i + 3] = 255; }
    ctx.putImageData(img, 0, 0);
    ctx.strokeStyle = 'rgba(60,30,20,0.6)'; ctx.lineWidth = 2;
    for (let l = 0; l < 8; l++) { ctx.beginPath(); ctx.moveTo(18, 22 + l * 12); for (let x = 18; x < S - 18; x += 6) ctx.lineTo(x, 22 + l * 12 + Math.sin(x * 0.7 + l) * 1.5); ctx.stroke(); }
    return (TEX.cache.parch = TEX.toTex(c));
  }
};

/* ==========================================================================
   Suelos por sala, muros con carácter y calcas de suelo (v1.2)
   Todo sale de tres tablas de ruido precalculadas + formas dibujadas con el
   canvas 2D (grietas, vetas, remaches) que se leen con getImageData.
   Medidas en «unidades de casilla»: 256 = un lado de casilla, a cualquier tamaño.
   ========================================================================== */
Object.assign(TEX, {
  /* Tablas de ruido T×T que se repiten sin costura (T potencia de 2): nubes, medio y grano */
  _nz(T) {
    const key = '_nz' + T; if (TEX.cache[key]) return TEX.cache[key];
    const xi = new Int32Array(T), xj = new Int32Array(T), xf = new Float32Array(T);
    const mk = (seed, f0, oct) => {
      const A = new Float32Array(T * T), rnd = U.mulberry(seed);
      for (let o = 0, g = f0, amp = 1; o < oct && g <= T; o++, g *= 2, amp *= 0.5) {
        const G = new Float32Array(g * g); for (let i = 0; i < g * g; i++) G[i] = rnd();
        for (let x = 0; x < T; x++) { const p = x * g / T, i = Math.floor(p), f = p - i; xi[x] = i; xj[x] = (i + 1) % g; xf[x] = f * f * (3 - 2 * f); }
        for (let y = 0; y < T; y++) {
          const r0 = xi[y] * g, r1 = xj[y] * g, fy = xf[y], row = y * T;
          for (let x = 0; x < T; x++) {
            const a = G[r0 + xi[x]], b = G[r0 + xj[x]], fx = xf[x], top = a + (b - a) * fx, c = G[r1 + xi[x]];
            A[row + x] += amp * (top + (c + (G[r1 + xj[x]] - c) * fx - top) * fy);
          }
        }
      }
      let lo = 1e9, hi = -1e9; for (let i = 0; i < T * T; i++) { if (A[i] < lo) lo = A[i]; if (A[i] > hi) hi = A[i]; }
      const k = 1 / (hi - lo); for (let i = 0; i < T * T; i++) A[i] = (A[i] - lo) * k;
      return A;
    };
    return (TEX.cache[key] = { T, M: T - 1, cloud: mk(101, 3, 5), mid: mk(202, 11, 4), fine: mk(303, Math.min(64, T / 2), 2) });
  },
  _pow2(s) { return 1 << Math.round(Math.log2(U.clamp(s || TEX.size, 64, 2048))); },
  _ctx(S, read) { const c = TEX.canvas(S); return c.getContext('2d', read ? { willReadFrequently: true } : undefined); },
  /* Normales desde alturas (misma convención que normalFromHeight, pero rápida y sin depender del tamaño) */
  _normal(H, S, k, wrapY = true) {
    const ctx = TEX._ctx(S), img = ctx.createImageData(S, S), d = img.data, M = S - 1; k *= S / 512;
    for (let y = 0, p = 0; y < S; y++) {
      const r = y * S, yu = (y ? y - 1 : wrapY ? M : 0) * S, yd = (y < M ? y + 1 : wrapY ? 0 : y) * S;
      for (let x = 0; x < S; x++, p += 4) {
        const dx = (H[r + ((x + 1) & M)] - H[r + ((x - 1) & M)]) * k, dy = (H[yd + x] - H[yu + x]) * k, inv = 127.5 / Math.sqrt(dx * dx + dy * dy + 1);
        d[p] = 127.5 - dx * inv; d[p + 1] = 127.5 + dy * inv; d[p + 2] = 127.5 + inv; d[p + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0); return ctx.canvas;
  },
  /* Canvas a partir de un mapa 0..1 multiplicado por un color (gris si no se da) */
  _gray(A, S, col) {
    const ctx = TEX._ctx(S), img = ctx.createImageData(S, S), d = img.data, r = col ? col[0] : 255, g = col ? col[1] : 255, b = col ? col[2] : 255;
    for (let i = 0, p = 0, n = S * S; i < n; i++, p += 4) { const v = A[i]; d[p] = v * r; d[p + 1] = v * g; d[p + 2] = v * b; d[p + 3] = 255; }
    ctx.putImageData(img, 0, 0); return ctx.canvas;
  },
  /* Grieta: línea quebrada que se afina, con ramas; se dibuja en el canal que diga strokeStyle */
  _crack(x, r, px, py, a0, len, w, branch) {
    const n = Math.max(2, Math.round(len / 6)); let da = 0;
    for (let s = 0; s < n; s++) {
      const k = 1 - s / n, ox = px, oy = py;
      da = da * 0.55 + (r() - 0.5) * 1.5; px += Math.cos(a0 + da) * 6; py += Math.sin(a0 + da) * 6;
      x.globalAlpha = 0.16; x.lineWidth = w * (1.2 + 2.6 * k); x.beginPath(); x.moveTo(ox, oy); x.lineTo(px, py); x.stroke();
      x.globalAlpha = 0.95; x.lineWidth = w * (0.3 + 0.7 * k); x.beginPath(); x.moveTo(ox, oy); x.lineTo(px, py); x.stroke();
      if (branch && r() < 0.16) TEX._crack(x, r, px, py, a0 + da + (r() < 0.5 ? 1 : -1) * (0.5 + r() * 0.7), len * 0.45 * k, w * 0.7, branch - 1);
    }
    x.globalAlpha = 1;
  },
  /* n grietas que nacen del borde del rectángulo rc y entran hacia dentro */
  _cracksIn(x, r, rc, n, w) {
    const [x0, y0, x1, y1] = rc, bw = x1 - x0, bh = y1 - y0;
    x.save(); x.beginPath(); x.rect(x0, y0, bw, bh); x.clip();
    for (let k = 0; k < n; k++) {
      const side = Math.floor(r() * 4), t = 0.12 + r() * 0.76;
      const px = side === 0 ? x0 : side === 1 ? x1 : x0 + bw * t, py = side === 2 ? y0 : side === 3 ? y1 : y0 + bh * t;
      const a = Math.atan2(y0 + bh * (0.3 + r() * 0.4) - py, x0 + bw * (0.3 + r() * 0.4) - px);
      TEX._crack(x, r, px, py, a, (0.25 + r() * 0.55) * Math.min(bw, bh), w * (0.7 + r() * 0.6), 2);
    }
    x.restore();
  },
  /* Punto con relieve (remache, clavo, piedrecilla) como degradado radial */
  _dot(x, px, py, rad, col, a = 1) {
    const g = x.createRadialGradient(px, py, 0, px, py, rad);
    g.addColorStop(0, col); g.addColorStop(0.55, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalAlpha = a; x.fillStyle = g; x.beginPath(); x.arc(px, py, rad, 0, 6.2832); x.fill(); x.globalAlpha = 1;
  },

  /* --- piezas: cada una con su tono, su altura y su inclinación --- */
  _pc(B, r, cx, cy, K) {
    const P = B.P, i = P.n++;
    P.tint[i] = 1 + (r() - 0.5) * 2 * K.tv; P.lift[i] = (r() - 0.5) * 2 * K.lv; P.mix[i] = (r() - 0.5) * 2 * K.mv;
    P.tx[i] = (r() - 0.5) * 2 * K.tl; P.ty[i] = (r() - 0.5) * 2 * K.tl; P.cx[i] = cx; P.cy[i] = cy;
    if (r() < K.odd) { const s = r() < 0.5 ? -1 : 1; P.tint[i] *= 1 + s * K.tv * 1.6; P.mix[i] += s * 0.45; }
    return i;
  },
  /* Rectángulo de esquinas romas: distancia al borde en D e índice de pieza en ID */
  _rect(B, x0, y0, x1, y1, rad, id) {
    const { C, q, D, ID } = B;
    const X0 = Math.max(0, Math.round(x0 * q)), X1 = Math.min(C, Math.round(x1 * q)), Y0 = Math.max(0, Math.round(y0 * q)), Y1 = Math.min(C, Math.round(y1 * q));
    for (let y = Y0; y < Y1; y++) {
      const v = (y + 0.5) / q, dy = Math.min(v - y0, y1 - v);
      for (let x = X0, i = y * C + X0; x < X1; x++, i++) {
        const u = (x + 0.5) / q, dx = Math.min(u - x0, x1 - u);
        D[i] = dx < rad && dy < rad ? rad - Math.hypot(rad - dx, rad - dy) : dx < dy ? dx : dy; ID[i] = id;
      }
    }
  },
  _rects(B, r, list, rad, K) {
    B.rects = list;
    list.forEach((c) => { const x0 = Math.max(0, c[0]), y0 = Math.max(0, c[1]), x1 = Math.min(256, c[2]), y1 = Math.min(256, c[3]); if (x1 - x0 < 1 || y1 - y0 < 1) return; TEX._rect(B, x0, y0, x1, y1, rad, TEX._pc(B, r, (x0 + x1) / 2, (y0 + y1) / 2, K)); });
  },
  /* Rotura: lo que queda a un lado de la línea a→b pasa a ser otra pieza (junta fina y ondulada) */
  _cut(B, r, ax, ay, bx, by, id, wob = 9) {
    const { C, q, D, ID, NZ } = B, L = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / L, ny = (bx - ax) / L, ox = Math.floor(r() * C), oy = Math.floor(r() * C);
    for (let y = 0, i = 0; y < C; y++) for (let x = 0; x < C; x++, i++) {
      const s = ((x + 0.5) / q - ax) * nx + ((y + 0.5) / q - ay) * ny + (NZ.mid[(((y + oy) & NZ.M) * C) + ((x + ox) & NZ.M)] - 0.5) * wob, a = (s < 0 ? -s : s) * 1.5;
      if (s > 0) ID[i] = id; if (a < D[i]) D[i] = a;
    }
  },
  /* Celdas de Voronoi (adoquines, hexágonos, facetas): g = casillas de la rejilla de búsqueda, k = redondeo */
  _voro(B, pts, g, k, D, ID, id0) {
    const C = B.C, q = B.q, n = pts.length >> 1, bs = 256 / g, G = g + 2, bk = [], inv = new Float32Array(n * n), dd = new Float32Array(64);
    for (let i = 0; i < G * G; i++) bk.push([]);
    for (let s = 0; s < n; s++) {
      const bx = Math.floor(pts[s * 2] / bs) + 1, by = Math.floor(pts[s * 2 + 1] / bs) + 1;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = bx + dx, Y = by + dy; if (X >= 0 && Y >= 0 && X < G && Y < G) bk[Y * G + X].push(s); }
    }
    for (let y = 0, i = 0; y < C; y++) {
      const py = (y + 0.5) / q, row = (Math.floor(py / bs) + 1) * G + 1;
      for (let x = 0; x < C; x++, i++) {
        const px = (x + 0.5) / q, L = bk[row + Math.floor(px / bs)], m = L.length; let d1 = 1e9, i1 = 0;
        for (let c = 0; c < m; c++) { const s = L[c], ex = pts[s * 2] - px, ey = pts[s * 2 + 1] - py, d = ex * ex + ey * ey; dd[c] = d; if (d < d1) { d1 = d; i1 = s; } }
        let e = 1e9;
        for (let c = 0; c < m; c++) {
          const s = L[c]; if (s === i1) continue;
          let iv = inv[i1 * n + s]; if (!iv) iv = inv[i1 * n + s] = 0.5 / Math.hypot(pts[s * 2] - pts[i1 * 2], pts[s * 2 + 1] - pts[i1 * 2 + 1]);
          const de = (dd[c] - d1) * iv, h = k - (e > de ? e - de : de - e);
          e = (de < e ? de : e) - (h > 0 ? h * h / (4 * k + 1e-6) : 0);
        }
        D[i] = e; ID[i] = id0 + i1;
      }
    }
  },
  /* Distancia al borde de la casilla, mezclada con suavidad k */
  _border(B, k) {
    const { C, q, D } = B;
    for (let y = 0, i = 0; y < C; y++) { const v = (y + 0.5) / q, dy = Math.min(v, 256 - v); for (let x = 0; x < C; x++, i++) { const u = (x + 0.5) / q, db = Math.min(u, 256 - u, dy), e = D[i], h = k - (e > db ? e - db : db - e); D[i] = (db < e ? db : e) - (h > 0 ? h * h / (4 * k + 1e-6) : 0); } }
  },

  /* Valores comunes de «material» de un suelo; cada clase cambia los suyos */
  _K0: { j: 2.2, bw: 5, wob: 2.2, chip: 7, chipT: 0.62, dome: 0, hb: 0.8, a1: 0.10, a2: 0.10, a3: 0.035, pit: 0.12, crack: 0.5,
    mixK: 1.5, s1: 0.22, s2: 0.3, s3: 0.12, ao: 0.5, aoW: 8, rim: 0.14, stT: 0.62, stain: 0.3, mort: 1, rVar: 0.25, rough: 0, metal: 0.02,
    qS: 0, qH: 0, qM: 0, qA: 0, qE: 0, qR: 0, gA: 0, gH: 0, gR: 0, gE: 0, bA: 0, bH: 0, bR: 0, glowJ: 0,
    tv: 0.08, lv: 0.04, tl: 0.0005, mv: 0.12, odd: 0.1 },

  /* Pinta una casilla del atlas a partir de D/ID/Q, las piezas y la capa dibujada (R grietas, G vetas, B relieve) */
  _compose(B, v, K, r) {
    const { C, S, q, NZ, D, ID, Q, P, H, R, E, d, ov, base, acc, mor, gc, bc, qc } = B, M = NZ.M, cl = NZ.cloud, md = NZ.mid, fn = NZ.fine;
    const X0 = (v & 1) * C, Y0 = (v >> 1) * C, o = []; for (let k = 0; k < 12; k++) o.push(Math.floor(r() * C));
    const iq = 1 / q, j = K.j, ibw = 1 / K.bw, iao = 1 / K.aoW, irim = 1 / (K.bw * 1.3), imo = 1 / (j * 0.9 + 0.5), rough = K.rough;
    const tint = P.tint, lift = P.lift, mixp = P.mix, tx = P.tx, ty = P.ty, pcx = P.cx, pcy = P.cy;
    for (let y = 0; y < C; y++) {
      const r1 = ((y + o[1]) & M) * C, r2 = ((y + o[3]) & M) * C, r3 = ((y + o[5]) & M) * C, r4 = ((y + o[7]) & M) * C, r5 = ((y + o[9]) & M) * C, r6 = ((y + o[11]) & M) * C;
      const vy = (y + 0.5) * iq; let i = y * C, a = ((Y0 + y) * S + X0), p = a * 4, w = i * 4;
      for (let x = 0; x < C; x++, i++, a++, p += 4, w += 4) {
        const id = ID[i], n1 = cl[r1 + ((x + o[0]) & M)], n2 = md[r2 + ((x + o[2]) & M)], n3 = fn[r3 + ((x + o[4]) & M)], n4 = cl[r4 + ((x + o[6]) & M)];
        const qv = Q ? Q[i] : 0.5, q2 = qv > 0.5 ? (qv - 0.5) * 2 : 0, ck = ov[w] * 0.0039216, g = ov[w + 1] * 0.0039216, b = ov[w + 2] * 0.0039216;
        let de = D[i] + (md[r5 + ((x + o[8]) & M)] - 0.5) * K.wob;
        const cp = md[r6 + ((x + o[10]) & M)] - K.chipT; if (cp > 0) de -= cp * K.chip;
        let t = (de - j) * ibw; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const prof = K.dome ? 1 - (1 - t) * (1 - t) : t * t * (3 - 2 * t);
        const pit = n3 > 0.84 ? (n3 - 0.84) * 6.25 * n2 : 0;
        // altura
        let h = prof * (K.hb + lift[id] + tx[id] * (vx(x) - pcx[id]) + ty[id] * (vy - pcy[id]) + (n1 - 0.5) * K.a1 + (n2 - 0.5) * K.a2 + (qv - 0.5) * K.qH - ck * K.crack - pit * K.pit)
          + (n3 - 0.5) * K.a3 * (0.5 + 0.5 * prof) + g * K.gH + b * K.bH;
        if (K.dome) h += (de > 40 ? 40 : de < 0 ? 0 : de) * 0.004 * K.dome;
        H[a] = h;
        // color
        let mx = (n1 - 0.5) * K.mixK + 0.35 + mixp[id] + (qv - 0.5) * K.qM; mx = mx < 0 ? 0 : mx > 1 ? 1 : mx;
        let sh = tint[id] * (1 + (n1 - 0.5) * K.s1 + (n2 - 0.5) * K.s2 + (n3 - 0.5) * K.s3 + (qv - 0.5) * K.qS) * (1 - pit * 0.45);
        const st = n4 - K.stT; if (st > 0) sh *= 1 - (st > 0.25 ? 1 : st * 4) * K.stain;
        let ao = (de - j * 0.5) * iao; ao = ao < 0 ? 0 : ao > 1 ? 1 : ao; sh *= K.ao + (1 - K.ao) * ao * (2 - ao);
        let tr = (de - j - K.bw * 0.2) * irim; tr = tr < 0 ? 0 : tr > 1 ? 1 : tr; const rim = 4 * tr * (1 - tr) * K.rim * (0.3 + 1.4 * n2); sh += rim;
        let m = 1 - (de - j * 0.3) * imo; m = m < 0 ? 0 : m > 1 ? 1 : m; m = m * m * (3 - 2 * m) * K.mort;
        const ms = (0.7 + 0.6 * n3) * (1 - m * 0), ckc = ck * 1.4 > 1 ? 1 : ck * 1.4;
        let cr = (base[0] + (acc[0] - base[0]) * mx) * sh, cg = (base[1] + (acc[1] - base[1]) * mx) * sh, cb = (base[2] + (acc[2] - base[2]) * mx) * sh;
        if (q2 > 0 && K.qA) { const k = q2 * K.qA; cr += (qc[0] - cr) * k; cg += (qc[1] - cg) * k; cb += (qc[2] - cb) * k; }
        if (m > 0) { const dz = n1 * 0.35; cr += ((mor[0] + (base[0] * 0.5 - mor[0]) * dz) * ms - cr) * m; cg += ((mor[1] + (base[1] * 0.5 - mor[1]) * dz) * ms - cg) * m; cb += ((mor[2] + (base[2] * 0.5 - mor[2]) * dz) * ms - cb) * m; }
        if (ckc > 0) { const k = ckc * 0.85 * (1 - m); cr += (mor[0] - cr) * k; cg += (mor[1] - cg) * k; cb += (mor[2] - cb) * k; }
        if (g > 0 && K.gA) { const k = g * K.gA; cr += (gc[0] - cr) * k; cg += (gc[1] - cg) * k; cb += (gc[2] - cb) * k; }
        if (b > 0 && K.bA) { const k = b * K.bA; cr += (bc[0] - cr) * k; cg += (bc[1] - cg) * k; cb += (bc[2] - cb) * k; }
        d[p] = cr; d[p + 1] = cg; d[p + 2] = cb; d[p + 3] = 255;
        const rr = rough + (n2 - 0.5) * K.rVar + m * 0.12 + ckc * 0.1 - rim * 0.4 + g * K.gR + b * K.bR + (qv - 0.5) * K.qR + pit * 0.1;
        R[a] = rr < 0.04 ? 0.04 : rr > 1 ? 1 : rr;
        if (E) { let e = q2 * K.qE + g * K.gE; if (K.glowJ) { const gl = n4 * 2.6 - 1.25; if (gl > 0) e += (m > ckc ? m : ckc) * (gl > 1 ? 1 : gl) * K.glowJ; } E[a] = e > 1 ? 1 : e; }
      }
    }
    function vx(x) { return (x + 0.5) * iq; }
  },

  /* Suelo de una clase: atlas de 2×2 variantes de UNA casilla, cada una acabada en media junta.
     pal = { base, accent, mortar, rough, bump, seed, glow }. Devuelve { map, normalMap, roughnessMap, emissiveMap|null, rotate, metalness }.
     El emissiveMap ya lleva el color de pal.glow: en el material, emissive = blanco. */
  floorKind(kind, pal, o) {
    pal = pal || {}; o = o || {};
    const F = TEX.FK[kind] || TEX.FK.losa, S = TEX._pow2(o.size), C = S >> 1;
    const key = 'fk_' + kind + '_' + S + '_' + [pal.base, pal.accent, pal.mortar, pal.rough, pal.bump, pal.seed, pal.glow].join('|');
    if (TEX.cache[key]) return TEX.cache[key];
    const K = Object.assign({}, TEX._K0, typeof F.K === 'function' ? F.K(pal) : F.K);
    K.rough = (pal.rough != null ? pal.rough : 0.85) * (K.roughK || 1) + (K.roughA || 0);
    const glow = pal.glow || K.glow, ctx = TEX._ctx(S), img = ctx.createImageData(S, S), ovx = TEX._ctx(C, true), r = U.mulberry((pal.seed || 1) * 7919 + kind.length * 131 + kind.charCodeAt(0));
    const hex = (h, def) => TEX.hexRGB(h || def);
    const B = { S, C, q: C / 256, NZ: TEX._nz(C), pal, K, H: new Float32Array(S * S), R: new Float32Array(S * S), E: glow && (K.qE || K.gE || K.glowJ) ? new Float32Array(S * S) : null, d: img.data,
      D: new Float32Array(C * C), ID: new Uint16Array(C * C), Q: null, QA: null, ov: null, rects: null,
      P: { n: 0, tint: new Float32Array(1024), lift: new Float32Array(1024), mix: new Float32Array(1024), tx: new Float32Array(1024), ty: new Float32Array(1024), cx: new Float32Array(1024), cy: new Float32Array(1024) },
      base: hex(K.base || pal.base, '#84807a'), acc: hex(K.accent || pal.accent, '#6b665e'), mor: hex(K.mortar || pal.mortar, '#1b1917'), gc: hex(K.gc, '#c8c2b4'), bc: hex(K.bc, '#b0aaa0'), qc: hex(K.qc || glow, '#e8e4dc') };
    if (F.pre) B.QA = new Float32Array(C * C);
    for (let v = 0; v < 4; v++) {
      B.P.n = 0; B.D.fill(0); B.ID.fill(0); B.Q = null; B.rects = null;
      F.lay(B, v, r, K);
      if (F.pre) { B.Q = B.QA; F.pre(B, v, r, K); }
      ovx.globalCompositeOperation = 'source-over'; ovx.setTransform(1, 0, 0, 1, 0, 0); ovx.fillStyle = '#000'; ovx.fillRect(0, 0, C, C);
      ovx.setTransform(B.q, 0, 0, B.q, 0, 0); ovx.lineCap = 'round'; ovx.globalCompositeOperation = 'lighter';
      if (F.ink) F.ink(B, ovx, v, r, K);
      B.ov = ovx.getImageData(0, 0, C, C).data;
      TEX._compose(B, v, K, r);
    }
    ctx.putImageData(img, 0, 0);
    const res = { map: TEX.toTex(ctx.canvas), normalMap: TEX.toTex(TEX._normal(B.H, S, (pal.bump || 6) * (K.bumpK || 1)), false), roughnessMap: TEX.toTex(TEX._gray(B.R, S), false),
      emissiveMap: B.E ? TEX.toTex(TEX._gray(B.E, S, TEX.hexRGB(glow))) : null, rotate: F.rot !== false, metalness: K.metal };
    return (TEX.cache[key] = res);
  },
  floorKinds: ['losa', 'losas4', 'adoquin', 'ladrillo', 'espiga', 'tablas', 'ajedrez', 'mosaico', 'hexagonos', 'tierra', 'chapa', 'cristal'],
  FK: {}
});

/* --- Las doce clases de suelo. Cada una dice cómo se reparten las piezas de la casilla (lay),
   qué dibujo llevan dentro (pre: vetas, motivos) y qué se pinta encima (ink: canal rojo = grietas,
   verde = vetas y rayas, azul = relieve como remaches o piedrecillas). Medidas: la casilla mide 256. --- */
(() => {
  const ink = (x, col, a, w) => { x.strokeStyle = col; x.globalAlpha = a; x.lineWidth = w; };
  const vein = (x, r, steps, len, turn) => { x.beginPath(); let px = r() * 256, py = r() * 256, a = r() * 6.28; x.moveTo(px, py); for (let s = 0; s < steps; s++) { a += (r() - 0.5) * turn; px += Math.cos(a) * len; py += Math.sin(a) * len; x.lineTo(px, py); } x.stroke(); };
  const diamond = (x, cx, cy, s) => { x.beginPath(); x.moveTo(cx, cy - s); x.lineTo(cx + s, cy); x.lineTo(cx, cy + s); x.lineTo(cx - s, cy); x.closePath(); x.fill(); };
  const voro = (B, r, K, pts, g, k) => { const id0 = B.P.n, P = []; pts.forEach(([px, py]) => { P.push(px, py); TEX._pc(B, r, px, py, K); }); TEX._voro(B, P, g, k, B.D, B.ID, id0); };
  Object.assign(TEX.FK, {
    // una losa grande, a veces partida
    losa: { K: (pal) => ({ bw: 7, j: 2.6, a1: 0.14, a2: 0.12, hb: 0.85, rim: 0.16, glowJ: pal.glow ? 0.8 : 0 }),
      lay(B, v, r, K) {
        TEX._rects(B, r, [[0, 0, 256, 256]], 10, K);
        if (v === 1) TEX._cut(B, r, 40 + r() * 60, 0, 130 + r() * 90, 256, TEX._pc(B, r, 210, 128, K));
        if (v === 3) TEX._cut(B, r, 0, 150 + r() * 50, 120 + r() * 60, 256, TEX._pc(B, r, 40, 230, K));
      },
      ink(B, x, v, r) { x.strokeStyle = '#f00'; TEX._cracksIn(x, r, [4, 4, 252, 252], v === 2 ? 3 : 1 + Math.floor(r() * 2), 1.2); } },
    // de cuatro a seis losas de tamaños distintos
    losas4: { K: { bw: 5, j: 2.4, tv: 0.1, odd: 0.2, a1: 0.12 },
      lay(B, v, r, K) {
        const sx = 80 + r() * 96, L = [];
        [[0, sx], [sx, 256]].forEach(([a, b]) => {
          const n = 1 + (r() < 0.8 ? 1 : 0) + (r() < 0.35 ? 1 : 0); let y = 0;
          for (let k = 0; k < n; k++) { const y1 = k === n - 1 ? 256 : y + ((256 - y) / (n - k)) * (0.7 + r() * 0.6); L.push([a, y, b, y1]); y = y1; }
        });
        TEX._rects(B, r, L, 6, K);
      },
      ink(B, x, v, r) { x.strokeStyle = '#f00'; B.rects.forEach((c) => { if (r() < 0.4) TEX._cracksIn(x, r, c, 1, 1); }); } },
    // adoquines redondeados
    adoquin: { K: { j: 3.4, bw: 10, dome: 1.3, hb: 0.55, chip: 4, tv: 0.13, mixK: 1.2, odd: 0.18, a1: 0.08 },
      lay(B, v, r, K) {
        const n = 5, s = 256 / n, pts = [];
        for (let gy = 0; gy < n; gy++) for (let gx = 0; gx < n; gx++) pts.push([(gx + 0.5 + (r() - 0.5) * 0.65) * s, (gy + 0.5 + (r() - 0.5) * 0.65) * s]);
        voro(B, r, K, pts, n, 7); TEX._border(B, 6);
      } },
    // ladrillo a soga
    ladrillo: { rot: false, K: { j: 3, bw: 4, tv: 0.13, odd: 0.22, mixK: 1.1, chip: 9, a1: 0.08 },
      lay(B, v, r, K) {
        const L = [], rows = 6, h = 256 / rows, w = 256 / 3;
        for (let k = 0; k < rows; k++) { const off = (k % 2) * w / 2 + (r() - 0.5) * 10; for (let x = -w + off; x < 256; x += w) L.push([x, k * h, x + w, (k + 1) * h]); }
        TEX._rects(B, r, L, 4, K);
      },
      ink(B, x, v, r) { x.strokeStyle = '#f00'; if (v % 2) TEX._cracksIn(x, r, [0, 0, 256, 256], 1, 0.9); } },
    // espiga (ladrillos en zigzag, alineados con la casilla)
    espiga: { rot: false, K: { j: 2.6, bw: 4, tv: 0.12, odd: 0.22, chip: 8, a1: 0.08 },
      lay(B, v, r, K) {
        const u = 32, L = [];
        for (let k = -4; k <= 4; k++) for (let n = -10; n <= 10; n++) { const ax = (n + 4 * k) * u, ay = n * u; L.push([ax, ay, ax + 2 * u, ay + u]); L.push([ax, ay + u, ax + u, ay + 3 * u]); }
        TEX._rects(B, r, L, 4, K);
      } },
    // tarima de madera con vetas y clavos
    tablas: { rot: false, K: { j: 2.2, bw: 3, hb: 0.7, tv: 0.12, odd: 0.18, mixK: 0.9, s2: 0.18, qS: 0.4, qA: 0.3, qc: '#2e1c10', qH: 0.05, chip: 3, crack: 0.25, a1: 0.05, a2: 0.05, stain: 0.25, bA: 0.85, bc: '#1e1a18', bH: 0.12, bR: -0.3 },
      lay(B, v, r, K) {
        const L = [], n = 4, h = 256 / n;
        for (let k = 0; k < n; k++) { let x = -r() * 220; while (x < 256) { const w = 120 + r() * 160; L.push([x, k * h, x + w, (k + 1) * h]); x += w; } }
        TEX._rects(B, r, L, 3, K);
      },
      pre(B, v, r, K) {
        const { C, q, ID, Q, NZ, P } = B, M = NZ.M;
        for (let y = 0, i = 0; y < C; y++) for (let x = 0; x < C; x++, i++) {
          const id = ID[i], w = NZ.cloud[((y + id * 13) & M) * C + (((x >> 2) + id * 29) & M)], vy = (y + 0.5) / q - P.cy[id];
          Q[i] = 0.5 + 0.5 * Math.sin(vy * 0.85 + w * 16 + id);
        }
      },
      ink(B, x, v, r) { B.rects.forEach(([x0, y0, x1, y1]) => { const h = y1 - y0; [x0 + 8, x1 - 8].forEach((px) => { if (px > 2 && px < 254) { TEX._dot(x, px, y0 + h * 0.28, 2.6, '#00f'); TEX._dot(x, px, y1 - h * 0.28, 2.6, '#00f'); } }); }); } },
    // mármol pulido con vetas y un rombo incrustado (el tinte por casilla hace el ajedrez)
    ajedrez: { K: { j: 1.6, bw: 2.5, hb: 0.5, tv: 0.04, odd: 0, mixK: 0.7, s1: 0.14, s2: 0.12, s3: 0.04, a1: 0.03, a2: 0.03, a3: 0.01, chip: 2, pit: 0, gA: 0.5, gc: '#ece6da', gH: -0.015, gR: -0.08, bA: 0.9, bc: '#9a7a32', bH: 0.04, bR: -0.25, roughK: 0.7, stain: 0.08, metal: 0.05 },
      lay(B, v, r, K) { TEX._rects(B, r, [[0, 0, 256, 256]], 4, K); },
      ink(B, x, v, r) {
        x.strokeStyle = '#0f0'; for (let k = 0; k < 4; k++) { x.globalAlpha = 0.2 + r() * 0.35; x.lineWidth = 0.7 + r() * 1.8; vein(x, r, 14, 20, 0.9); }
        x.globalAlpha = 1; x.fillStyle = '#00f'; diamond(x, 128, 128, 20);
        [[0, 0], [256, 0], [0, 256], [256, 256]].forEach(([cx, cy]) => diamond(x, cx, cy, 16));
      } },
    // teselas con cenefa y rosetón
    mosaico: { K: (pal) => ({ j: 1.5, bw: 2, hb: 0.5, tv: 0.1, odd: 0.1, chip: 2, mixK: 0.5, a1: 0.04, a2: 0.04, qA: 0.85, qc: pal.accent || '#6a3a34', qS: 0.05, s2: 0.2, crack: 0.4, accent: pal.base }),
      lay(B, v, r, K) { const n = 10, s = 256 / n, L = []; for (let gy = 0; gy < n; gy++) for (let gx = 0; gx < n; gx++) L.push([gx * s, gy * s, (gx + 1) * s, (gy + 1) * s]); TEX._rects(B, r, L, 2, K); },
      pre(B, v, r, K) {
        const { C, ID, Q, P } = B, n = 10, s = 25.6, val = new Float32Array(P.n);
        for (let id = 0; id < P.n; id++) {
          const gx = Math.floor(P.cx[id] / s), gy = Math.floor(P.cy[id] / s), ring = Math.min(gx, gy, n - 1 - gx, n - 1 - gy), dc = Math.abs(gx - 4.5) + Math.abs(gy - 4.5);
          let on = ring === 1 ? (gx + gy) % 2 : ring >= 2 ? (dc <= 1 || (dc > 2 && dc <= 3) ? 1 : 0) : 0;
          if (v >= 2 && ring >= 2 && (gx === gy || gx + gy === 9)) on = 1;
          val[id] = on ? 0.9 + r() * 0.1 : 0.1 + r() * 0.25;
        }
        for (let i = 0, N = C * C; i < N; i++) Q[i] = val[ID[i]];
      },
      ink(B, x, v, r) { x.strokeStyle = '#f00'; if (r() < 0.6) TEX._cracksIn(x, r, [0, 0, 256, 256], 1, 0.8); } },
    // baldosas hexagonales
    hexagonos: { K: { j: 2.4, bw: 4, tv: 0.11, odd: 0.18, chip: 5, a1: 0.08 },
      lay(B, v, r, K) {
        const a = 64, hh = a * 0.866, pts = [], g = 6, bs = 256 / g, oy = 18 + v * 9;
        for (let row = -1; row * hh + oy < 256 + bs * 0.9; row++) for (let col = -1; col * a < 256 + bs; col++) {
          const px = col * a + (row % 2 ? a / 2 : 0) + v * 7, py = row * hh + oy;
          if (px > -bs * 0.9 && px < 256 + bs * 0.9 && py > -bs * 0.9) pts.push([px, py]);
        }
        voro(B, r, K, pts, g, 2); TEX._border(B, 4);
      } },
    // tierra apisonada con piedrecillas
    tierra: { K: { j: 0.4, bw: 10, hb: 0.3, mort: 0.12, rim: 0, ao: 0.85, tv: 0.05, a1: 0.25, a2: 0.18, a3: 0.06, s1: 0.4, s2: 0.32, chip: 0, crack: 0.25, stain: 0.45, stT: 0.55, bA: 0.55, bc: '#8a8070', bH: 0.2, bR: -0.05, wob: 4 },
      lay(B, v, r, K) { TEX._rects(B, r, [[0, 0, 256, 256]], 4, K); },
      ink(B, x, v, r) { for (let k = 0; k < 55; k++) TEX._dot(x, r() * 256, r() * 256, 1.5 + r() * 4.5, '#00f', 0.45 + r() * 0.55); if (v === 1) { x.strokeStyle = '#f00'; TEX._cracksIn(x, r, [0, 0, 256, 256], 2, 0.8); } } },
    // planchas de hierro remachadas
    chapa: { K: { j: 2.2, bw: 3, hb: 0.6, tv: 0.09, odd: 0.18, mixK: 1.8, s1: 0.3, s2: 0.25, chip: 0, crack: 0, a1: 0.05, a2: 0.04, stain: 0.45, gA: 0.35, gc: '#b0a89e', gR: -0.15, gH: -0.01, bA: 0.75, bc: '#a8a198', bH: 0.4, bR: -0.2, roughK: 0.9, metal: 0.55 },
      lay(B, v, r, K) { TEX._rects(B, r, v % 2 ? [[0, 0, 256, 128], [0, 128, 256, 256]] : [[0, 0, 128, 256], [128, 0, 256, 256]], 4, K); },
      ink(B, x, v, r) {
        B.rects.forEach(([x0, y0, x1, y1]) => {
          const nx = Math.round((x1 - x0) / 36), ny = Math.round((y1 - y0) / 36);
          for (let k = 0; k <= nx; k++) { const t = x0 + 10 + (x1 - x0 - 20) * k / nx; TEX._dot(x, t, y0 + 9, 5, '#00f'); TEX._dot(x, t, y1 - 9, 5, '#00f'); }
          for (let k = 1; k < ny; k++) { const t = y0 + 10 + (y1 - y0 - 20) * k / ny; TEX._dot(x, x0 + 9, t, 5, '#00f'); TEX._dot(x, x1 - 9, t, 5, '#00f'); }
        });
        x.strokeStyle = '#0f0'; for (let k = 0; k < 18; k++) { x.globalAlpha = 0.15 + r() * 0.35; x.lineWidth = 0.6 + r(); const px = r() * 256, py = r() * 256, a = r() * 6.28, l = 10 + r() * 40; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
        x.globalAlpha = 1;
      } },
    // obsidiana pulida en facetas, con vetas que brillan
    cristal: { K: { j: 2, bw: 6, hb: 0.7, tv: 0.18, odd: 0.25, mixK: 1.6, s1: 0.4, s2: 0.2, chip: 3, a1: 0.05, a2: 0.04, roughK: 0.7, metal: 0.3, gA: 0.55, gc: '#c0a8ff', gE: 0.9, gH: -0.02, glowJ: 0.45, stain: 0 },
      lay(B, v, r, K) {
        const n = 3, s = 256 / n, pts = [];
        for (let gy = 0; gy < n; gy++) for (let gx = 0; gx < n; gx++) pts.push([(gx + 0.5 + (r() - 0.5) * 0.8) * s, (gy + 0.5 + (r() - 0.5) * 0.8) * s]);
        voro(B, r, K, pts, n, 1); TEX._border(B, 3);
      },
      ink(B, x, v, r) { x.strokeStyle = '#0f0'; for (let k = 0; k < 3; k++) { x.globalAlpha = 0.5 + r() * 0.5; x.lineWidth = 0.8 + r() * 1.2; vein(x, r, 10, 18, 1.2); } x.globalAlpha = 1; } }
  });
  void ink;
})();

/* --- Manchas y detalles sueltos para el suelo: atlas n×n con fondo transparente.
   Devuelve { map, cells: { nombre: [columna, fila] }, n }. Todo apto para niños: sin sangre. --- */
TEX.decals = function (o) {
  o = o || {};
  const S = TEX._pow2(o.size || 1024), n = 4, C = S / n, key = 'decals' + S;
  if (TEX.cache[key]) return TEX.cache[key];
  const cv = TEX.canvas(S), x = cv.getContext('2d'), r = U.mulberry(4242), cells = {};
  const names = ['grietas', 'grietas2', 'musgo', 'humedad', 'charco', 'hollin', 'arena', 'paja', 'hojas', 'raices', 'cenizas', 'cristalitos', 'tiza', 'losa_rota', 'monedas', 'huellas'];
  const blob = (cx, cy, R, col, a, k = 9) => { for (let i = 0; i < k; i++) { const px = cx + (r() - 0.5) * R * 1.1, py = cy + (r() - 0.5) * R * 1.1, rr = R * (0.3 + r() * 0.5), g = x.createRadialGradient(px, py, 0, px, py, rr); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); x.fillStyle = g; x.beginPath(); x.arc(px, py, rr, 0, 6.2832); x.fill(); } };
  const speck = (cx, cy, R, col, k, s0, s1) => { x.fillStyle = col; for (let i = 0; i < k; i++) { const a = r() * 6.2832, d = Math.sqrt(r()) * R; x.globalAlpha = 0.4 + r() * 0.6; x.beginPath(); x.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, s0 + r() * (s1 - s0), 0, 6.2832); x.fill(); } x.globalAlpha = 1; };
  names.forEach((name, i) => {
    const X = (i % n) * C, Y = Math.floor(i / n) * C; cells[name] = [i % n, Math.floor(i / n)];
    x.save(); x.beginPath(); x.rect(X + 2, Y + 2, C - 4, C - 4); x.clip(); x.translate(X, Y); x.scale(C / 256, C / 256);
    const cx = 128, cy = 128; x.lineCap = 'round';
    switch (name) {
      case 'grietas': case 'grietas2': x.strokeStyle = 'rgba(14,11,9,0.9)'; for (let k = 0; k < (name === 'grietas' ? 2 : 4); k++) TEX._crack(x, r, 40 + r() * 60, 50 + r() * 150, -0.4 + r() * 0.8, 120 + r() * 60, 1.4, name === 'grietas2' ? 3 : 2); break;
      case 'musgo': blob(cx, cy, 90, 'rgba(48,78,34,A)', 0.55, 14); speck(cx, cy, 80, '#4a6a2a', 160, 1, 3); speck(cx, cy, 70, '#7a9a3a', 50, 1, 2); break;
      case 'humedad': blob(cx, cy, 100, 'rgba(10,12,14,A)', 0.45, 12); break;
      case 'charco': { blob(cx, cy, 70, 'rgba(14,20,26,A)', 0.85, 10); x.strokeStyle = 'rgba(160,190,210,0.35)'; x.lineWidth = 3; x.beginPath(); x.ellipse(cx - 10, cy - 12, 40, 16, -0.3, 3.6, 5.2); x.stroke(); break; }
      case 'hollin': blob(cx, cy, 90, 'rgba(6,5,4,A)', 0.75, 12); speck(cx, cy, 90, '#1a1410', 80, 1, 3); break;
      case 'arena': blob(cx, cy, 100, 'rgba(170,150,120,A)', 0.35, 10); speck(cx, cy, 100, '#c8b898', 300, 0.6, 1.6); break;
      case 'paja': for (let k = 0; k < 70; k++) { const a = r() * 6.2832, d = Math.sqrt(r()) * 90, l = 14 + r() * 26, b = r() * 6.2832, px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d; x.strokeStyle = `rgba(${190 + r() * 40},${150 + r() * 30},${60 + r() * 30},0.95)`; x.lineWidth = 1.5 + r() * 1.5; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(b) * l, py + Math.sin(b) * l); x.stroke(); } break;
      case 'hojas': for (let k = 0; k < 6; k++) { x.save(); x.translate(50 + r() * 156, 50 + r() * 156); x.rotate(r() * 6.28); x.fillStyle = `rgba(${200 + r() * 30},${185 + r() * 30},${150 + r() * 20},0.95)`; x.fillRect(-18, -24, 36, 48); x.strokeStyle = 'rgba(80,60,40,0.6)'; x.lineWidth = 1; for (let l = -16; l < 20; l += 6) { x.beginPath(); x.moveTo(-12, l); x.lineTo(12 - r() * 8, l); x.stroke(); } x.restore(); } break;
      case 'raices': x.strokeStyle = 'rgba(70,50,30,0.95)'; for (let k = 0; k < 5; k++) TEX._crack(x, r, cx + (r() - 0.5) * 40, cy + (r() - 0.5) * 40, r() * 6.28, 100, 2.6, 3); break;
      case 'cenizas': blob(cx, cy, 80, 'rgba(70,66,62,A)', 0.7, 12); speck(cx, cy, 70, '#2a2624', 120, 1, 3); speck(cx, cy, 40, '#ff7a2a', 30, 1, 2.5); break;
      case 'cristalitos': for (let k = 0; k < 22; k++) { const a = r() * 6.28, d = Math.sqrt(r()) * 90, px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d, s = 3 + r() * 7; x.fillStyle = `rgba(${190 + r() * 60},${200 + r() * 55},255,0.9)`; x.beginPath(); x.moveTo(px, py - s); x.lineTo(px + s * 0.5, py); x.lineTo(px, py + s * 0.7); x.lineTo(px - s * 0.5, py); x.fill(); } break;
      case 'tiza': { x.strokeStyle = 'rgba(230,226,215,0.8)'; x.lineWidth = 3.5; x.beginPath(); x.arc(cx, cy, 60, 0, 6.28); x.stroke(); x.beginPath(); x.moveTo(cx - 40, cy); x.lineTo(cx + 30, cy); x.moveTo(cx + 12, cy - 18); x.lineTo(cx + 32, cy); x.lineTo(cx + 12, cy + 18); x.stroke(); for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(cx - 30 + k * 10, cy + 80); x.lineTo(cx - 34 + k * 10, cy + 100); x.stroke(); } x.beginPath(); x.moveTo(cx - 36, cy + 90); x.lineTo(cx + 6, cy + 86); x.stroke(); break; }
      case 'losa_rota': for (let k = 0; k < 7; k++) { const px = 40 + r() * 176, py = 40 + r() * 176, s = 10 + r() * 22; x.fillStyle = `rgba(${90 + r() * 30},${86 + r() * 30},${80 + r() * 30},1)`; x.strokeStyle = 'rgba(10,8,6,0.8)'; x.lineWidth = 2; x.beginPath(); for (let v = 0; v < 5; v++) { const a = v * 1.256 + r() * 0.5, d = s * (0.6 + r() * 0.5); v ? x.lineTo(px + Math.cos(a) * d, py + Math.sin(a) * d) : x.moveTo(px + Math.cos(a) * d, py + Math.sin(a) * d); } x.closePath(); x.fill(); x.stroke(); } break;
      case 'monedas': for (let k = 0; k < 9; k++) { const px = cx + (r() - 0.5) * 120, py = cy + (r() - 0.5) * 120; x.fillStyle = '#e0b040'; x.strokeStyle = '#7a5a10'; x.lineWidth = 2; x.beginPath(); x.ellipse(px, py, 11, 9, r() * 3, 0, 6.28); x.fill(); x.stroke(); } break;
      case 'huellas': x.fillStyle = 'rgba(30,24,18,0.45)'; for (let k = 0; k < 6; k++) { const px = 60 + k * 26, py = cy + (k % 2 ? -18 : 18); x.beginPath(); x.ellipse(px, py, 11, 6, 0, 0, 6.28); x.fill(); x.beginPath(); x.ellipse(px + 14, py, 6, 5, 0, 0, 6.28); x.fill(); } break;
    }
    x.restore();
  });
  const map = TEX.toTex(cv); map.premultiplyAlpha = false;
  return (TEX.cache[key] = { map, cells, n });
};
