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
