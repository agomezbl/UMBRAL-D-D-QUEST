/* ==========================================================================
   Luz de sala horneada
   --------------------------------------------------------------------------
   El motor solo puede tener encendidas de 2 a 6 luces de verdad a la vez. Para
   que TODAS las salas del mapa tengan su luz y su color (antorchas, velas,
   pociones, brasas…) sin coste, la luz de cada sala se pinta en una textura
   pequeña vista desde arriba (4 puntos por casilla) y todos los materiales la
   suman a su color. La luz no atraviesa los muros: cada punto solo recibe la
   de su sala. Se repinta cuando se descubre una sala o cambian las luces.
   ========================================================================== */
const BAKE = {
  R: 4, w: 1, h: 1, tex: null, data: null, owner: null, sources: [], fills: [], roomW: [], dirty: false, mult: 1, gain: 1,
  u: { uBakeMap: { value: null }, uBakeBox: { value: new THREE.Vector4(1, 1, 0.01, 0.01) }, uBakeK: { value: 0 } },

  blank() {
    const t = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, THREE.RGBAFormat); t.needsUpdate = true; return t;
  },
  /* Se añade a cualquier material estándar: suma la luz de la sala a lo que ya calcula three.js */
  inject(sh) {
    if (!BAKE.u.uBakeMap.value) BAKE.u.uBakeMap.value = BAKE.blank();
    sh.uniforms.uBakeMap = BAKE.u.uBakeMap; sh.uniforms.uBakeBox = BAKE.u.uBakeBox; sh.uniforms.uBakeK = BAKE.u.uBakeK;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform vec4 uBakeBox; varying vec2 vBakeUv;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        {
          vec4 bkP = vec4(transformed, 1.0); vec3 bkN = objectNormal;
          #ifdef USE_INSTANCING
            bkP = instanceMatrix * bkP; bkN = mat3(instanceMatrix) * bkN;
          #endif
          bkP = modelMatrix * bkP; bkN = normalize(mat3(modelMatrix) * bkN);
          // las caras verticales toman la luz de la casilla que tienen delante
          vBakeUv = (bkP.xz + bkN.xz * 0.62 + uBakeBox.xy) * uBakeBox.zw;
        }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D uBakeMap; uniform float uBakeK; varying vec2 vBakeUv;')
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        {
          vec3 bk = texture2D(uBakeMap, vBakeUv).rgb; bk = bk * bk * 2.0;
          reflectedLight.indirectDiffuse += bk * uBakeK * diffuseColor.rgb;
        }`);
  },

  /* Prepara el mapa de luz de un nivel: tamaño y a qué sala pertenece cada punto */
  setup(L) {
    const R = this.R, w = this.w = L.w * R, h = this.h = L.h * R;
    this.data = new Uint8Array(w * h * 4); this.acc = new Float32Array(w * h * 3);
    const own = this.owner = new Int16Array(w * h);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const t = L.T[Math.floor(j / R)][Math.floor(i / R)];
      own[j * w + i] = t.door ? -2 : t.floor ? t.room : -1;
    }
    // las puertas reciben la luz de las dos salas que unen
    this.doorRooms = {};
    L.doors.forEach((d) => { this.doorRooms[d.y * L.w + d.x] = d.rooms; });
    this.Lw = L.w;
    if (this.tex) this.tex.dispose();
    const t = this.tex = new THREE.DataTexture(this.data, w, h, THREE.RGBAFormat);
    t.magFilter = t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
    this.u.uBakeMap.value = t;
    this.u.uBakeBox.value.set(TILE / 2, TILE / 2, 1 / (TILE * L.w), 1 / (TILE * L.h));
    this.sources = []; this.fills = []; this.roomW = L.rooms.map(() => ({ w: 0, t: 0 }));
    this.mult = 1; this.dirty = true; this.u.uBakeK.value = this.gain;
  },
  clear() { this.sources = []; this.fills = []; this.roomW = []; if (this.data) { this.data.fill(0); if (this.tex) this.tex.needsUpdate = true; } },
  /* Luz puntual de una sala (posición en el mundo) */
  add(room, x, z, color, intensity, dist) {
    const c = new THREE.Color(color);
    const s = { room, x: (x / TILE + 0.5) * this.R, z: (z / TILE + 0.5) * this.R, r: c.r * intensity, g: c.g * intensity, b: c.b * intensity, d: (dist / TILE) * this.R };
    this.sources.push(s); this.dirty = true; return s;
  },
  /* Luz de fondo de una sala entera (su color) */
  fill(room, color, intensity) { const c = new THREE.Color(color); this.fills[room] = [c.r * intensity, c.g * intensity, c.b * intensity]; this.dirty = true; },
  /* Enciende (o apaga) la luz de una sala poco a poco */
  reveal(room, instant, delay = 0) { const q = this.roomW[room]; if (!q) return; q.t = 1; q.delay = instant ? 0 : delay; if (instant) q.w = 1; this.dirty = true; },
  setMult(m) { this.mult = m; this.u.uBakeK.value = this.gain * m; },
  update(dt) {
    let moving = false;
    this.roomW.forEach((q) => {
      if (q.w === q.t) return;
      if (q.delay > 0) { q.delay -= dt; moving = true; return; }
      q.w = Math.min(q.t, q.w + dt * 1.4); moving = true;
    });
    if (moving || this.dirty) this.paint();
  },
  paint() {
    this.dirty = false;
    if (!this.data) return;
    const w = this.w, h = this.h, A = this.acc, own = this.owner, R = this.R, RW = this.roomW;
    A.fill(0);
    // fondo de cada sala
    for (let k = 0, n = w * h; k < n; k++) {
      const o = own[k]; if (o === -1) continue;
      if (o >= 0) { const f = this.fills[o], q = RW[o]; if (f && q && q.w > 0) { A[k * 3] = f[0] * q.w; A[k * 3 + 1] = f[1] * q.w; A[k * 3 + 2] = f[2] * q.w; } }
      else {
        const i = k % w, j = (k - i) / w, rooms = this.doorRooms[Math.floor(j / R) * this.Lw + Math.floor(i / R)] || [];
        rooms.forEach((ri) => { const f = this.fills[ri], q = RW[ri]; if (f && q && q.w > 0) { A[k * 3] += f[0] * q.w * 0.5; A[k * 3 + 1] += f[1] * q.w * 0.5; A[k * 3 + 2] += f[2] * q.w * 0.5; } });
      }
    }
    // luces puntuales
    for (let s = 0; s < this.sources.length; s++) {
      const S = this.sources[s], q = RW[S.room]; if (!q || q.w <= 0) continue;
      const d = S.d, i0 = Math.max(0, Math.floor(S.x - d)), i1 = Math.min(w - 1, Math.ceil(S.x + d)), j0 = Math.max(0, Math.floor(S.z - d)), j1 = Math.min(h - 1, Math.ceil(S.z + d));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const k = j * w + i, o = own[k];
        if (o !== S.room) { if (o !== -2) continue; const rooms = this.doorRooms[Math.floor(j / R) * this.Lw + Math.floor(i / R)]; if (!rooms || !rooms.includes(S.room)) continue; }
        const dx = i + 0.5 - S.x, dz = j + 0.5 - S.z, dd = Math.sqrt(dx * dx + dz * dz) / d;
        if (dd >= 1) continue;
        const a = (1 - dd) * (1 - dd) * q.w;
        A[k * 3] += S.r * a; A[k * 3 + 1] += S.g * a; A[k * 3 + 2] += S.b * a;
      }
    }
    const D = this.data;
    for (let k = 0, n = w * h; k < n; k++) {
      D[k * 4] = Math.min(255, Math.sqrt(A[k * 3] * 0.5) * 255); D[k * 4 + 1] = Math.min(255, Math.sqrt(A[k * 3 + 1] * 0.5) * 255); D[k * 4 + 2] = Math.min(255, Math.sqrt(A[k * 3 + 2] * 0.5) * 255); D[k * 4 + 3] = 255;
    }
    this.tex.needsUpdate = true;
  }
};
/* Todos los materiales estándar reciben la luz de sala (salvo los que ya traen su propio ajuste, que la añaden ellos) */
BAKE.onCompile = function (sh) { BAKE.inject(sh); };
THREE.MeshStandardMaterial.prototype.onBeforeCompile = BAKE.onCompile;
