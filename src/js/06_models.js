/* ==========================================================================
   Miniaturas procedurales: héroes, criaturas, jefes y atrezo
   Todas las figuras se montan sobre una peana, como en el tablero.
   ========================================================================== */
const G = {
  c: {},
  k(name, args, fn) { const key = name + args.join('|'); return this.c[key] || (this.c[key] = fn()); },
  sph(r, w = 16, h = 12) { return this.k('s', [r, w, h], () => new THREE.SphereGeometry(r, w, h)); },
  cyl(rt, rb, h, s = 16, open = false) { return this.k('c', [rt, rb, h, s, open], () => new THREE.CylinderGeometry(rt, rb, h, s, 1, open)); },
  box(w, h, d) { return this.k('b', [w, h, d], () => new THREE.BoxGeometry(w, h, d)); },
  cone(r, h, s = 12) { return this.k('k', [r, h, s], () => new THREE.ConeGeometry(r, h, s)); },
  tor(r, t, rs = 8, ts = 24, arc = Math.PI * 2) { return this.k('t', [r, t, rs, ts, arc], () => new THREE.TorusGeometry(r, t, rs, ts, arc)); },
  lathe(pts, s = 20) { return this.k('l', [JSON.stringify(pts), s], () => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), s)); },
  oct(r) { return this.k('o', [r], () => new THREE.OctahedronGeometry(r, 0)); },
  ico(r, d = 0) { return this.k('i', [r, d], () => new THREE.IcosahedronGeometry(r, d)); },
  dode(r) { return this.k('d', [r], () => new THREE.DodecahedronGeometry(r, 0)); }
};

const MAT = {
  c: {},
  std(hex, r = 0.7, m = 0, ex = {}) {
    const key = ['std', hex, r, m, JSON.stringify(ex)].join('|');
    if (this.c[key]) return this.c[key];
    const mat = new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(hex), roughness: r, metalness: m, normalMap: TEX.grain(), normalScale: new THREE.Vector2(0.4, 0.4) }, ex));
    if (ex.emissive) mat.emissive = new THREE.Color(ex.emissive);
    return (this.c[key] = mat);
  },
  glow(hex, k = 2.2) {
    const key = ['glow', hex, k].join('|');
    return this.c[key] || (this.c[key] = new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false }));
  },
  ghost(hex, op = 0.5, emi = 0.8) {
    const key = ['ghost', hex, op, emi].join('|');
    return this.c[key] || (this.c[key] = new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), emissive: new THREE.Color(hex), emissiveIntensity: emi, transparent: true, opacity: op, depthWrite: false, roughness: 0.35, metalness: 0.1 }));
  },
  glass() {
    return this.c.glass || (this.c.glass = new THREE.MeshStandardMaterial({ color: 0x0c0d12, roughness: 0.08, metalness: 1.0, emissive: new THREE.Color(0x2a1f55), emissiveIntensity: 0.5 }));
  }
};

/* Miniatura pintada: huecos más oscuros, pincel seco en lo alto, contraluz que
   recorta la silueta y un destello al recibir un golpe o una curación. Cada figura
   lleva sus propios valores (contraluz, destello); el programa es el mismo para todas. */
const MINI = {
  shared: { uUpView: { value: new THREE.Vector3(0, 1, 0) } },
  cache: new WeakMap(),
  uniforms(rimHex, rim) { return { uFlash: { value: 0 }, uFlashCol: { value: new THREE.Color('#fff1dc') }, uRimCol: { value: new THREE.Color(rimHex) }, uRim: { value: rim }, base: rim }; },
  patch(mat, mu) {
    const m = mat.clone();
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uUpView = MINI.shared.uUpView; sh.uniforms.uFlash = mu.uFlash; sh.uniforms.uFlashCol = mu.uFlashCol; sh.uniforms.uRimCol = mu.uRimCol; sh.uniforms.uRim = mu.uRim;
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uUpView; uniform float uFlash; uniform vec3 uFlashCol; uniform vec3 uRimCol; uniform float uRim;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          {
            float upd = dot(normal, uUpView);
            float fres = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);
            fres *= 1.0 - smoothstep(0.35, 0.9, abs(upd));
            diffuseColor.rgb *= mix(0.68, 1.0, smoothstep(-0.55, 0.3, upd));
            totalEmissiveRadiance += diffuseColor.rgb * smoothstep(0.6, 1.0, upd) * 0.1;
            totalEmissiveRadiance += uRimCol * fres * uRim;
            totalEmissiveRadiance += uFlashCol * uFlash * (0.3 + fres * 1.2);
          }`);
    };
    m.customProgramCacheKey = () => 'umbral-mini';
    return m;
  },
  apply(root, mu) {
    root.traverse((o) => {
      if (!o.isMesh || !o.material || Array.isArray(o.material)) return;
      const mt = o.material;
      if (!mt.isMeshStandardMaterial || mt.transparent) return;
      o.material = MINI.patch(mt, mu);
    });
  },
  update(camera) { MINI.shared.uUpView.value.set(0, 1, 0).transformDirection(camera.matrixWorldInverse); }
};

const MODELS = (() => {
  const P = (parent, geo, mat, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(p[0], p[1], p[2]); m.rotation.set(r[0], r[1], r[2]); m.scale.set(s[0], s[1], s[2]);
    m.castShadow = shadow; m.receiveShadow = shadow;
    parent.add(m); return m;
  };
  const grp = (parent, p = [0, 0, 0], r = [0, 0, 0]) => { const g = new THREE.Group(); g.position.set(p[0], p[1], p[2]); g.rotation.set(r[0], r[1], r[2]); if (parent) parent.add(g); return g; };

  /* Peana con anillo de color de bando */
  function base(rim, radius = 0.62, glowRim = false) {
    const g = new THREE.Group();
    P(g, G.cyl(radius, radius + 0.05, 0.12, 40), MAT.std('#17130f', 0.55, 0.1), [0, 0.06, 0]);
    P(g, G.cyl(radius - 0.06, radius, 0.03, 40), MAT.std('#2a241d', 0.75, 0), [0, 0.135, 0]);
    const ring = P(g, G.tor(radius + 0.01, 0.022, 6, 48), glowRim ? MAT.glow(rim, 1.3) : MAT.std(rim, 0.35, 0.8), [0, 0.11, 0], [Math.PI / 2, 0, 0]);
    g.userData.ring = ring;
    return g;
  }
  function eyes(parent, y, z, sep, color, size = 0.022, k = 3) {
    P(parent, G.sph(size, 8, 6), MAT.glow(color, k), [-sep, y, z], [0, 0, 0], [1, 0.7, 1], false);
    P(parent, G.sph(size, 8, 6), MAT.glow(color, k), [sep, y, z], [0, 0, 0], [1, 0.7, 1], false);
  }
  function sword(parent, steel, guard, len = 0.75, glow) {
    const s = grp(parent);
    P(s, G.box(0.05, len, 0.014), glow ? MAT.glow(glow, 1.4) : steel, [0, len / 2 + 0.08, 0]);
    P(s, G.cone(0.025, 0.08, 4), glow ? MAT.glow(glow, 1.4) : steel, [0, len + 0.12, 0], [0, Math.PI / 4, 0], [1, 1, 0.3]);
    P(s, G.box(0.24, 0.035, 0.05), guard, [0, 0.07, 0]);
    P(s, G.cyl(0.022, 0.022, 0.14, 8), MAT.std('#3b2618', 0.8), [0, -0.02, 0]);
    P(s, G.sph(0.035, 8, 6), guard, [0, -0.1, 0]);
    return s;
  }
  function axe(parent, wood, iron, big = 1) {
    const a = grp(parent);
    P(a, G.cyl(0.03 * big, 0.03 * big, 0.9 * big, 8), wood, [0, 0.35 * big, 0]);
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.quadraticCurveTo(0.22, 0.05, 0.28, 0.2); shape.quadraticCurveTo(0.2, 0.18, 0.18, 0.12); shape.lineTo(0.18, -0.12); shape.quadraticCurveTo(0.2, -0.18, 0.28, -0.2); shape.quadraticCurveTo(0.22, -0.05, 0, 0);
    const geo = G.k('axeHead', [], () => new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1 }));
    P(a, geo, iron, [0.02, 0.7 * big, -0.015 * big], [0, 0, 0], [big, big, big]);
    return a;
  }
  function staff(parent, wood, len = 1.7) { const s = grp(parent); P(s, G.cyl(0.028, 0.034, len, 8), wood, [0, len / 2, 0]); return s; }
  function cape(parent, color, w = 0.6, h = 0.9, y = 1.05, z = -0.2) {
    const geo = G.k('cape', [w, h], () => {
      const g = new THREE.PlaneGeometry(w, h, 6, 8); const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), yy = pos.getY(i); const t = (h / 2 - yy) / h; pos.setZ(i, -Math.cos((x / w) * Math.PI) * 0.06 - t * 0.12 + Math.sin(x * 9) * 0.02 * t); pos.setX(i, x * (1 + t * 0.35)); }
      g.translate(0, -h / 2, 0); g.computeVertexNormals(); return g;
    });
    const pivot = grp(parent, [0, y, z]);
    const m = P(pivot, geo, MAT.std(color, 0.85, 0, { side: THREE.DoubleSide }));
    void m; return pivot;
  }
  function tatter(r0, h, seed) {
    return G.k('tatter', [r0, h, seed], () => {
      const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(r0 * (1 - t * 0.55) + Math.sin(t * 3) * 0.02, t * h)); }
      const g = new THREE.LatheGeometry(pts, 24); const pos = g.attributes.position; const rnd = U.mulberry(seed);
      const jag = []; for (let k = 0; k < 25; k++) jag.push(rnd() * 0.22);
      for (let i = 0; i < pos.count; i++) { if (pos.getY(i) < 0.001) { const a = Math.atan2(pos.getZ(i), pos.getX(i)); const k = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 24); pos.setY(i, -jag[k] * (k % 2 ? 1 : 0.4)); } }
      g.computeVertexNormals(); return g;
    });
  }

  /* ----------------------------- HÉROES ----------------------------- */
  function aldric(o = {}) {
    const steel = MAT.std('#a7b0ba', 0.32, 0.9), dark = MAT.std('#3d434b', 0.45, 0.8), gold = MAT.std('#c9a24a', 0.3, 0.95);
    const blue = MAT.std('#23407a', 0.85), leather = MAT.std('#4a3324', 0.8);
    const root = new THREE.Group(), fig = grp(root, [0, 0.12, 0]);
    P(fig, G.cyl(0.085, 0.07, 0.42, 10), dark, [-0.11, 0.21, 0]); P(fig, G.cyl(0.085, 0.07, 0.42, 10), dark, [0.11, 0.21, 0]);
    P(fig, G.box(0.13, 0.08, 0.2), dark, [-0.11, 0.04, 0.03]); P(fig, G.box(0.13, 0.08, 0.2), dark, [0.11, 0.04, 0.03]);
    P(fig, G.lathe([[0.3, 0.22], [0.28, 0.4], [0.23, 0.6], [0.2, 0.7]]), blue, [0, 0, 0]);
    P(fig, G.lathe([[0.2, 0.6], [0.26, 0.76], [0.275, 0.93], [0.23, 1.06], [0.12, 1.12]]), steel);
    P(fig, G.tor(0.215, 0.03, 6, 24), leather, [0, 0.66, 0], [Math.PI / 2, 0, 0]);
    P(fig, G.box(0.07, 0.06, 0.03), gold, [0, 0.66, 0.225]);
    P(fig, G.box(0.22, 0.5, 0.02), blue, [0, 0.42, 0.26], [-0.12, 0, 0]);
    P(fig, G.box(0.03, 0.5, 0.025), gold, [-0.11, 0.42, 0.262], [-0.12, 0, 0]); P(fig, G.box(0.03, 0.5, 0.025), gold, [0.11, 0.42, 0.262], [-0.12, 0, 0]);
    P(fig, G.sph(0.06, 10, 8), gold, [0, 0.9, 0.24], [0, 0, 0], [1, 1, 0.4]);
    [-1, 1].forEach((sx) => {
      P(fig, G.sph(0.135, 14, 10), steel, [sx * 0.27, 1.03, 0], [0, 0, sx * -0.3], [1, 0.72, 1]);
      P(fig, G.tor(0.12, 0.014, 6, 20), gold, [sx * 0.28, 0.99, 0], [Math.PI / 2, 0, sx * -0.3]);
    });
    const armL = grp(fig, [-0.31, 0.98, 0]); P(armL, G.cyl(0.065, 0.06, 0.4, 8), dark, [0, -0.2, 0.02], [0.25, 0, 0.1]); P(armL, G.sph(0.07, 8, 6), steel, [-0.03, -0.4, 0.1]);
    const armR = grp(fig, [0.31, 0.98, 0]); P(armR, G.cyl(0.065, 0.06, 0.4, 8), dark, [0, -0.2, 0.06], [0.5, 0, -0.1]); P(armR, G.sph(0.07, 8, 6), steel, [0.03, -0.37, 0.2]);
    P(fig, G.cyl(0.07, 0.08, 0.1, 10), dark, [0, 1.15, 0]);
    const head = grp(fig, [0, 1.3, 0]);
    P(head, G.sph(0.155, 18, 14), steel, [0, 0, 0], [0, 0, 0], [1, 1.08, 1.02]);
    P(head, G.cyl(0.152, 0.14, 0.16, 18), steel, [0, -0.07, 0]);
    P(head, G.box(0.2, 0.025, 0.06), MAT.std('#07080a', 0.9), [0, 0.0, 0.135]);
    P(head, G.box(0.025, 0.12, 0.05), MAT.std('#07080a', 0.9), [0, -0.07, 0.14]);
    P(head, G.box(0.03, 0.08, 0.3), gold, [0, 0.15, -0.02]);
    P(head, G.cone(0.05, 0.22, 8), MAT.std('#7a1d24', 0.9), [0, 0.2, -0.16], [-2.1, 0, 0]);
    // escudo cometa
    const sh = new THREE.Shape(); sh.moveTo(0, 0.3); sh.quadraticCurveTo(0.22, 0.28, 0.22, 0.12); sh.quadraticCurveTo(0.2, -0.15, 0, -0.34); sh.quadraticCurveTo(-0.2, -0.15, -0.22, 0.12); sh.quadraticCurveTo(-0.22, 0.28, 0, 0.3);
    const shGeo = G.k('kite', [], () => new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }));
    const shield = grp(fig, [-0.42, 0.68, 0.12], [0, -0.55, 0]);
    P(shield, shGeo, blue);
    const emb = grp(shield, [0, 0.02, 0.07]);
    P(emb, G.cyl(0.07, 0.07, 0.015, 16), gold, [0, 0, 0], [Math.PI / 2, 0, 0]);
    for (let k = 0; k < 8; k++) P(emb, G.box(0.018, 0.12, 0.012), gold, [Math.cos(k * Math.PI / 4) * 0.12, Math.sin(k * Math.PI / 4) * 0.12, 0], [0, 0, k * Math.PI / 4 - Math.PI / 2]);
    const rimGeo = G.k('kiteRim', [], () => { const pts = sh.getPoints(30).map((p) => new THREE.Vector3(p.x, p.y, 0)); return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 60, 0.018, 5, true); });
    const shieldRim = P(shield, rimGeo, o.aegis ? MAT.std('#dfe6ee', 0.15, 1) : gold, [0, 0, 0.05]);
    const sw = grp(fig, [0.36, 0.62, 0.22], [0.35, 0, -0.15]);
    sword(sw, steel, gold, 0.78, o.blade ? '#9fd8ff' : null);
    const cp = cape(fig, '#6d1a1f', 0.58, 0.95, 1.08, -0.2);
    root.userData = { fig, head, weapon: sw, shield, cape: cp, height: 1.62, shieldRim };
    return root;
  }

  function sera(o = {}) {
    const cloak = MAT.std('#33413a', 0.9), leather = MAT.std('#3b2a20', 0.75), skin = MAT.std('#b98d6c', 0.7), steel = MAT.std('#c3c9d0', 0.25, 0.9), red = MAT.std('#6a1f22', 0.85);
    const root = new THREE.Group(), fig = grp(root, [0, 0.12, 0]);
    P(fig, G.cyl(0.07, 0.06, 0.42, 8), leather, [-0.1, 0.21, 0]); P(fig, G.cyl(0.07, 0.06, 0.42, 8), leather, [0.1, 0.21, 0]);
    P(fig, G.box(0.11, 0.08, 0.2), leather, [-0.1, 0.04, 0.03]); P(fig, G.box(0.11, 0.08, 0.2), leather, [0.1, 0.04, 0.03]);
    P(fig, G.lathe([[0.17, 0.42], [0.2, 0.62], [0.21, 0.82], [0.18, 1.0], [0.1, 1.1]]), leather);
    const cl = P(fig, G.lathe([[0.33, 0.16], [0.3, 0.32], [0.25, 0.6], [0.22, 0.85], [0.2, 1.02], [0.12, 1.12]], 22), cloak);
    cl.scale.set(1, 1, 0.92);
    P(fig, G.tor(0.18, 0.025, 6, 20), leather, [0, 0.62, 0], [Math.PI / 2, 0, 0]);
    P(fig, G.box(0.08, 0.1, 0.06), leather, [0.15, 0.58, 0.12]); P(fig, G.box(0.07, 0.08, 0.05), leather, [-0.16, 0.58, 0.1]);
    P(fig, G.tor(0.11, 0.045, 8, 16), red, [0, 1.11, 0], [Math.PI / 2, 0, 0]);
    const head = grp(fig, [0, 1.24, 0]);
    P(head, G.sph(0.16, 18, 14), cloak, [0, 0.01, -0.02], [0, 0, 0], [1, 1.1, 1.12]);
    P(head, G.cone(0.1, 0.22, 10), cloak, [0, 0.03, -0.17], [-1.9, 0, 0]);
    P(head, G.sph(0.115, 14, 10), MAT.std('#060506', 1), [0, -0.01, 0.07]);
    eyes(head, 0.0, 0.17, 0.042, '#ffc46b', 0.018, 3.2);
    P(head, G.box(0.18, 0.06, 0.08), red, [0, -0.08, 0.12]);
    const armL = grp(fig, [-0.27, 0.98, 0]); P(armL, G.cyl(0.055, 0.05, 0.42, 8), cloak, [0, -0.2, 0.05], [0.4, 0, 0.15]); P(armL, G.sph(0.05, 8, 6), skin, [-0.04, -0.4, 0.17]);
    const armR = grp(fig, [0.27, 0.98, 0]); P(armR, G.cyl(0.055, 0.05, 0.42, 8), cloak, [0, -0.2, 0.05], [0.4, 0, -0.15]); P(armR, G.sph(0.05, 8, 6), skin, [0.04, -0.4, 0.17]);
    const dagger = (g) => { P(g, G.box(0.035, 0.28, 0.01), o.fangs ? MAT.glow('#7dffb2', 1.2) : steel, [0, 0.16, 0]); P(g, G.box(0.1, 0.02, 0.03), leather, [0, 0.02, 0]); P(g, G.cyl(0.016, 0.016, 0.09, 6), leather, [0, -0.04, 0]); };
    const dL = grp(fig, [-0.31, 0.58, 0.18], [1.2, 0, 0.3]); dagger(dL);
    const dR = grp(fig, [0.31, 0.58, 0.18], [1.2, 0, -0.3]); dagger(dR);
    const qv = grp(fig, [0.12, 0.85, -0.2], [0.2, 0, -0.4]);
    P(qv, G.cyl(0.06, 0.05, 0.42, 10), leather);
    for (let k = 0; k < 4; k++) P(qv, G.cone(0.025, 0.08, 4), MAT.std('#d8d0c0', 0.8), [Math.cos(k * 1.6) * 0.03, 0.26, Math.sin(k * 1.6) * 0.03]);
    const bow = grp(fig, [-0.05, 0.85, -0.24], [0, 0, 0.5]);
    P(bow, G.tor(0.48, 0.018, 6, 24, Math.PI * 0.9), MAT.std('#1d1612', 0.6, 0.1), [0, 0, 0], [0, 0, Math.PI * 0.55]);
    bow.visible = !!o.bow;
    root.userData = { fig, head, weapon: dR, weapon2: dL, bow, height: 1.55 };
    return root;
  }

  function elian(o = {}) {
    const robe = MAT.std('#38296a', 0.85), trim = MAT.std('#c7a352', 0.35, 0.9), skin = MAT.std('#c79a7c', 0.7), hair = MAT.std('#2b1d15', 0.9), wood = MAT.std('#5a3a22', 0.8);
    const root = new THREE.Group(), fig = grp(root, [0, 0.12, 0]);
    P(fig, G.lathe([[0.34, 0.02], [0.31, 0.2], [0.25, 0.5], [0.21, 0.8], [0.2, 0.98], [0.12, 1.1]], 24), o.mantle ? MAT.std('#1d2a4a', 0.75) : robe);
    P(fig, G.tor(0.335, 0.025, 6, 32), trim, [0, 0.03, 0], [Math.PI / 2, 0, 0]);
    P(fig, G.tor(0.215, 0.03, 6, 24), trim, [0, 0.72, 0], [Math.PI / 2, 0, 0]);
    P(fig, G.box(0.09, 0.42, 0.02), trim, [0, 0.48, 0.24], [-0.18, 0, 0]);
    P(fig, G.tor(0.13, 0.06, 8, 18), o.mantle ? MAT.std('#d6dbe6', 0.5) : robe, [0, 1.1, 0], [Math.PI / 2, 0, 0]);
    const sleeve = (sx) => { const a = grp(fig, [sx * 0.24, 1.0, 0]); P(a, G.cyl(0.05, 0.11, 0.42, 10), robe, [sx * 0.04, -0.2, 0.06], [0.35, 0, sx * 0.15]); P(a, G.sph(0.045, 8, 6), skin, [sx * 0.08, -0.42, 0.16]); return a; };
    sleeve(-1); sleeve(1);
    const head = grp(fig, [0, 1.25, 0]);
    P(head, G.sph(0.125, 16, 12), skin, [0, 0, 0.01]);
    P(head, G.sph(0.135, 16, 12), hair, [0, 0.04, -0.03], [0, 0, 0], [1.02, 0.95, 1]);
    P(head, G.tor(0.128, 0.012, 6, 24), trim, [0, 0.04, 0.0], [Math.PI / 2 - 0.15, 0, 0]);
    P(head, G.oct(0.022), MAT.glow('#9bd7ff', 2.5), [0, 0.06, 0.13]);
    P(head, G.sph(0.012, 6, 4), MAT.std('#111', 0.5), [-0.045, 0.0, 0.115]); P(head, G.sph(0.012, 6, 4), MAT.std('#111', 0.5), [0.045, 0.0, 0.115]);
    const st = grp(fig, [0.36, -0.02, 0.18], [0.05, 0, -0.04]);
    staff(st, wood, 1.75);
    const crystal = P(st, G.oct(0.085), MAT.glow(o.dawn ? '#ffd27a' : '#9bd7ff', 2.2), [0, 1.86, 0], [0, 0, 0], [0.8, 1.4, 0.8], false);
    P(st, G.tor(0.06, 0.012, 6, 16), trim, [0, 1.76, 0], [Math.PI / 2, 0, 0]);
    // el Farol de Isolde cuelga del báculo
    const lan = grp(st, [0.12, 1.5, 0]);
    P(lan, G.cyl(0.004, 0.004, 0.12, 4), trim, [0, 0.08, 0]);
    P(lan, G.cone(0.06, 0.06, 6), trim, [0, 0.0, 0]);
    for (let k = 0; k < 4; k++) P(lan, G.box(0.008, 0.12, 0.008), trim, [Math.cos(k * Math.PI / 2 + 0.78) * 0.045, -0.09, Math.sin(k * Math.PI / 2 + 0.78) * 0.045]);
    P(lan, G.cyl(0.05, 0.05, 0.015, 8), trim, [0, -0.155, 0]);
    const core = P(lan, G.sph(0.03, 10, 8), MAT.glow('#ffb45a', 3), [0, -0.09, 0], [0, 0, 0], [1, 1.3, 1], false);
    P(fig, G.box(0.12, 0.15, 0.05), MAT.std('#5b2a1e', 0.8), [-0.2, 0.55, 0.12], [0, 0.4, 0.1]);
    root.userData = { fig, head, weapon: st, crystal, lantern: lan, lanternCore: core, height: 1.6 };
    return root;
  }

  /* Brunna, guardiana enana de la forja: baja, ancha, barba de cobre y martillo de dos manos */
  function brunna(o = {}) {
    const iron = MAT.std('#6f747c', 0.38, 0.85), dark = MAT.std('#2f2a26', 0.6, 0.5), leather = MAT.std('#5a3a24', 0.8), copper = MAT.std('#c26a2e', 0.4, 0.75);
    const beard = MAT.std('#b8582a', 0.9), skin = MAT.std('#c28a68', 0.7), wood = MAT.std('#4a3020', 0.8);
    const root = new THREE.Group(), fig = grp(root, [0, 0.12, 0]);
    P(fig, G.cyl(0.1, 0.09, 0.28, 10), dark, [-0.12, 0.14, 0]); P(fig, G.cyl(0.1, 0.09, 0.28, 10), dark, [0.12, 0.14, 0]);
    P(fig, G.box(0.16, 0.08, 0.22), iron, [-0.12, 0.03, 0.03]); P(fig, G.box(0.16, 0.08, 0.22), iron, [0.12, 0.03, 0.03]);
    P(fig, G.lathe([[0.32, 0.22], [0.35, 0.4], [0.34, 0.6], [0.3, 0.76], [0.16, 0.86]], 22), iron);
    P(fig, G.box(0.36, 0.42, 0.03), leather, [0, 0.36, 0.3], [-0.08, 0, 0]);
    P(fig, G.tor(0.335, 0.035, 6, 26), leather, [0, 0.46, 0], [Math.PI / 2, 0, 0]);
    P(fig, G.box(0.1, 0.08, 0.04), copper, [0, 0.46, 0.34]);
    [-1, 1].forEach((sx) => {
      P(fig, G.sph(0.15, 14, 10), iron, [sx * 0.33, 0.76, 0], [0, 0, sx * -0.35], [1, 0.75, 1]);
      P(fig, G.tor(0.13, 0.016, 6, 20), copper, [sx * 0.34, 0.72, 0], [Math.PI / 2, 0, sx * -0.35]);
      const arm = grp(fig, [sx * 0.37, 0.72, 0]);
      P(arm, G.cyl(0.08, 0.075, 0.34, 8), leather, [0, -0.17, 0.08], [0.7, 0, sx * -0.1]);
      P(arm, G.sph(0.085, 8, 6), iron, [0, -0.3, 0.24]);
    });
    const head = grp(fig, [0, 0.98, 0.02]);
    P(head, G.sph(0.15, 16, 12), skin, [0, 0, 0.02]);
    P(head, G.lathe([[0.17, 0.0], [0.165, 0.06], [0.13, 0.13], [0.06, 0.17], [0.0, 0.18]], 18), iron, [0, 0.02, -0.01]);
    P(head, G.box(0.03, 0.12, 0.03), iron, [0, 0.0, 0.16]);
    P(head, G.tor(0.162, 0.018, 6, 24), copper, [0, 0.0, 0], [Math.PI / 2, 0, 0]);
    P(head, G.cone(0.035, 0.16, 6), MAT.std('#d8cbb0', 0.6), [-0.17, 0.12, 0], [0, 0, 1.0]); P(head, G.cone(0.035, 0.16, 6), MAT.std('#d8cbb0', 0.6), [0.17, 0.12, 0], [0, 0, -1.0]);
    P(head, G.sph(0.016, 6, 4), MAT.std('#111', 0.5), [-0.05, 0.0, 0.15]); P(head, G.sph(0.016, 6, 4), MAT.std('#111', 0.5), [0.05, 0.0, 0.15]);
    P(head, G.cone(0.17, 0.42, 12), beard, [0, -0.26, 0.09], [Math.PI + 0.2, 0, 0]);
    [-1, 1].forEach((sx) => { P(head, G.cyl(0.03, 0.02, 0.22, 6), beard, [sx * 0.07, -0.42, 0.14], [0.25, 0, 0]); P(head, G.sph(0.03, 6, 4), copper, [sx * 0.07, -0.54, 0.17]); });
    // martillo de dos manos
    const hm = grp(fig, [0.3, 0.42, 0.3], [0.35, 0, -0.45]);
    P(hm, G.cyl(0.032, 0.032, 1.0, 8), wood, [0, 0.3, 0]);
    P(hm, G.box(0.3, 0.17, 0.17), o.hammer ? MAT.std('#e0b46a', 0.25, 1, { emissive: '#ff8a2a', emissiveIntensity: 0.6 }) : iron, [0, 0.82, 0]);
    P(hm, G.box(0.32, 0.04, 0.19), copper, [0, 0.82, 0]);
    P(hm, G.cone(0.05, 0.14, 4), iron, [-0.21, 0.82, 0], [0, 0, Math.PI / 2]);
    root.userData = { fig, head, weapon: hm, height: 1.3 };
    return root;
  }

  /* Nyra, cantora de la Orden: túnica clara, cetro con campana y libro de himnos */
  function nyra(o = {}) {
    const ivory = MAT.std('#e8dcc4', 0.75), rose = MAT.std('#a8324e', 0.7), silver = MAT.std('#d2d6de', 0.25, 0.95), skin = MAT.std('#d0a080', 0.7), hair = MAT.std('#6a2e1a', 0.85);
    const root = new THREE.Group(), fig = grp(root, [0, 0.12, 0]);
    P(fig, G.lathe([[0.31, 0.02], [0.28, 0.25], [0.22, 0.55], [0.19, 0.8], [0.18, 0.98], [0.11, 1.1]], 24), ivory);
    P(fig, G.tor(0.305, 0.022, 6, 32), rose, [0, 0.04, 0], [Math.PI / 2, 0, 0]);
    P(fig, G.box(0.13, 0.86, 0.02), rose, [0, 0.5, 0.21], [-0.12, 0, 0]);
    P(fig, G.sph(0.05, 10, 8), MAT.glow('#ff8fb0', 1.6), [0, 0.86, 0.2], [0, 0, 0], [1, 1, 0.4], false);
    P(fig, G.tor(0.195, 0.026, 6, 24), silver, [0, 0.66, 0], [Math.PI / 2, 0, 0]);
    P(fig, G.tor(0.12, 0.05, 8, 18), rose, [0, 1.09, 0], [Math.PI / 2, 0, 0]);
    const sleeve = (sx) => { const a = grp(fig, [sx * 0.22, 0.98, 0]); P(a, G.cyl(0.045, 0.09, 0.4, 10), ivory, [sx * 0.04, -0.19, 0.06], [0.4, 0, sx * 0.12]); P(a, G.sph(0.042, 8, 6), skin, [sx * 0.07, -0.4, 0.16]); return a; };
    sleeve(-1); sleeve(1);
    const head = grp(fig, [0, 1.24, 0]);
    P(head, G.sph(0.12, 16, 12), skin, [0, 0, 0.01]);
    P(head, G.sph(0.13, 16, 12), hair, [0, 0.03, -0.03], [0, 0, 0], [1.02, 0.98, 1]);
    P(head, G.cone(0.12, 0.42, 12), hair, [0, -0.2, -0.08], [0.15, 0, 0]);
    P(head, G.tor(0.125, 0.012, 6, 24), silver, [0, 0.05, 0.0], [Math.PI / 2 - 0.2, 0, 0]);
    P(head, G.oct(0.02), MAT.glow('#ff9ab8', 2.4), [0, 0.08, 0.125]);
    P(head, G.sph(0.011, 6, 4), MAT.std('#111', 0.5), [-0.042, 0.0, 0.11]); P(head, G.sph(0.011, 6, 4), MAT.std('#111', 0.5), [0.042, 0.0, 0.11]);
    // cetro con campana
    const sc = grp(fig, [0.32, 0.2, 0.18], [0.05, 0, -0.06]);
    P(sc, G.cyl(0.022, 0.026, 1.25, 8), silver, [0, 0.62, 0]);
    P(sc, G.lathe([[0.0, 0.0], [0.07, 0.02], [0.075, 0.1], [0.045, 0.16], [0.0, 0.17]], 14), MAT.std('#d6b25a', 0.3, 0.95), [0, 1.18, 0], [Math.PI, 0, 0]);
    P(sc, G.sph(0.03, 8, 6), MAT.glow('#ffe0a0', 2), [0, 1.27, 0], [0, 0, 0], [1, 1, 1], false);
    // libro de himnos al costado (con el Salterio de plata, brilla)
    const book = grp(fig, [-0.22, 0.6, 0.14], [0, 0.5, 0.15]);
    P(book, G.box(0.16, 0.2, 0.06), o.hymnal ? MAT.std('#c9ccd6', 0.2, 1, { emissive: '#ff9ab8', emissiveIntensity: 0.35 }) : MAT.std('#5a1e2c', 0.7));
    root.userData = { fig, head, weapon: sc, height: 1.55 };
    return root;
  }

  /* ----------------------------- CRIATURAS ----------------------------- */
  function skeleton(o = {}) {
    const bone = MAT.std('#d6ccb3', 0.85), rust = MAT.std('#6e4a33', 0.65, 0.5), dark = MAT.std('#0a0908', 1);
    const eye = o.eye || '#6dffb0';
    const root = new THREE.Group(), fig = grp(root, [0, 0.12, 0]);
    const leg = (sx) => { P(fig, G.cyl(0.03, 0.025, 0.36, 6), bone, [sx * 0.09, 0.21, 0]); P(fig, G.sph(0.04, 6, 5), bone, [sx * 0.09, 0.4, 0]); P(fig, G.cyl(0.035, 0.03, 0.3, 6), bone, [sx * 0.09, 0.56, 0]); P(fig, G.box(0.07, 0.04, 0.14), bone, [sx * 0.09, 0.03, 0.04]); };
    leg(-1); leg(1);
    P(fig, G.box(0.24, 0.08, 0.12), bone, [0, 0.7, 0]);
    P(fig, G.cyl(0.025, 0.025, 0.4, 6), bone, [0, 0.9, -0.04], [0.15, 0, 0]);
    for (let k = 0; k < 4; k++) P(fig, G.tor(0.12 - k * 0.012, 0.018, 5, 14, Math.PI * 1.5), bone, [0, 0.82 + k * 0.075, 0.0], [Math.PI / 2, 0, Math.PI * 0.75]);
    P(fig, G.box(0.03, 0.22, 0.02), bone, [0, 0.92, 0.11]);
    P(fig, G.sph(0.045, 6, 5), bone, [-0.17, 1.08, 0]); P(fig, G.sph(0.045, 6, 5), bone, [0.17, 1.08, 0]);
    const armL = grp(fig, [-0.18, 1.06, 0]); P(armL, G.cyl(0.025, 0.022, 0.3, 6), bone, [-0.02, -0.15, 0.03], [0.2, 0, 0.12]); P(armL, G.cyl(0.022, 0.02, 0.28, 6), bone, [-0.04, -0.4, 0.12], [0.8, 0, 0]);
    const armR = grp(fig, [0.18, 1.06, 0]); P(armR, G.cyl(0.025, 0.022, 0.3, 6), bone, [0.02, -0.15, 0.03], [0.2, 0, -0.12]); P(armR, G.cyl(0.022, 0.02, 0.28, 6), bone, [0.04, -0.4, 0.12], [0.8, 0, 0]);
    const head = grp(fig, [0, 1.24, 0.03]);
    P(head, G.sph(0.125, 14, 12), bone, [0, 0, 0], [0, 0, 0], [0.92, 1, 1.05]);
    P(head, G.box(0.14, 0.06, 0.1), bone, [0, -0.11, 0.05]);
    P(head, G.sph(0.035, 8, 6), dark, [-0.045, 0.0, 0.1]); P(head, G.sph(0.035, 8, 6), dark, [0.045, 0.0, 0.1]);
    eyes(head, 0.0, 0.125, 0.045, eye, 0.014, 4);
    P(head, G.cone(0.02, 0.04, 3), dark, [0, -0.05, 0.12], [Math.PI, 0, 0]);
    if (o.helm) P(head, G.sph(0.135, 12, 8, 0), rust, [0, 0.04, 0], [0, 0, 0], [1, 0.75, 1.05]);
    let weapon;
    if (o.bow) {
      weapon = grp(fig, [-0.28, 0.72, 0.16], [0, 0.3, 0.1]);
      P(weapon, G.tor(0.38, 0.016, 5, 20, Math.PI * 0.85), MAT.std('#3a2a1a', 0.8), [0, 0, 0], [0, Math.PI / 2, Math.PI * 0.57]);
    } else {
      weapon = grp(fig, [0.26, 0.7, 0.2], [0.6, 0, -0.2]);
      P(weapon, G.box(0.05, 0.55, 0.014), rust, [0, 0.32, 0]); P(weapon, G.box(0.16, 0.03, 0.04), rust, [0, 0.06, 0]);
      const sh = grp(fig, [-0.3, 0.75, 0.12], [0, -0.5, 0]);
      P(sh, G.cyl(0.17, 0.17, 0.03, 14), MAT.std('#4a3626', 0.9), [0, 0, 0], [Math.PI / 2, 0, 0]);
      P(sh, G.sph(0.04, 8, 6), rust, [0, 0, 0.03]);
    }
    root.userData = { fig, head, weapon, height: 1.45, undead: true };
    return root;
  }

  function ghoul(o = {}) {
    const flesh = MAT.std(o.color || '#68765a', 0.75), rag = MAT.std('#2c2620', 0.95), claw = MAT.std('#1b1a16', 0.5);
    const root = new THREE.Group(), fig = grp(root, [0, 0.12, 0]);
    P(fig, G.cyl(0.07, 0.06, 0.38, 8), flesh, [-0.12, 0.19, -0.05], [-0.2, 0, 0]); P(fig, G.cyl(0.07, 0.06, 0.38, 8), flesh, [0.12, 0.19, -0.05], [-0.2, 0, 0]);
    P(fig, G.lathe([[0.22, 0.35], [0.24, 0.5], [0.2, 0.6]]), rag);
    P(fig, G.sph(0.3, 16, 12), flesh, [0, 0.78, 0.06], [0.6, 0, 0], [0.85, 1, 0.72]);
    for (let k = 0; k < 4; k++) P(fig, G.box(0.02, 0.02, 0.18), MAT.std('#4c5641', 0.8), [-0.12 + k * 0.08, 0.95, -0.12], [0.6, 0, 0]);
    const head = grp(fig, [0, 0.98, 0.3]);
    P(head, G.sph(0.14, 12, 10), flesh, [0, 0, 0], [0, 0, 0], [1, 0.9, 1.15]);
    P(head, G.box(0.16, 0.05, 0.12), MAT.std('#2a1a14', 0.8), [0, -0.09, 0.08]);
    for (let k = 0; k < 5; k++) P(head, G.cone(0.01, 0.04, 3), MAT.std('#e6dcc0', 0.6), [-0.05 + k * 0.025, -0.06, 0.15], [Math.PI, 0, 0]);
    eyes(head, 0.03, 0.14, 0.05, o.eye || '#ffdd55', 0.02, 3.5);
    const arm = (sx) => { const a = grp(fig, [sx * 0.26, 0.9, 0.12]); P(a, G.cyl(0.05, 0.04, 0.5, 8), flesh, [sx * 0.04, -0.25, 0.12], [0.6, 0, sx * 0.15]); for (let k = 0; k < 3; k++) P(a, G.cone(0.015, 0.1, 4), claw, [sx * 0.06 + (k - 1) * 0.03, -0.5, 0.3], [1.9, 0, 0]); };
    arm(-1); arm(1);
    root.userData = { fig, head, height: 1.25, undead: true };
    return root;
  }

  function cultist(o = {}) {
    const robe = MAT.std(o.color || '#4a1218', 0.9), robe2 = MAT.std(o.color2 || '#140809', 0.9), gold = MAT.std('#a8843f', 0.4, 0.8);
    const root = new THREE.Group(), fig = grp(root, [0, 0.12, 0]);
    P(fig, G.lathe([[0.32, 0.0], [0.29, 0.2], [0.23, 0.55], [0.2, 0.85], [0.18, 1.02], [0.1, 1.1]], 22), robe);
    P(fig, G.box(0.12, 1.0, 0.02), robe2, [0, 0.5, 0.25], [-0.1, 0, 0]);
    P(fig, G.tor(0.2, 0.02, 6, 20), gold, [0, 0.7, 0], [Math.PI / 2, 0, 0]);
    const head = grp(fig, [0, 1.22, 0]);
    P(head, G.cone(0.19, 0.48, 14), robe, [0, 0.12, -0.03], [-0.15, 0, 0]);
    P(head, G.sph(0.12, 12, 10), MAT.std('#040304', 1), [0, -0.03, 0.06]);
    eyes(head, -0.02, 0.15, 0.04, o.eye || '#ff4a3a', 0.02, 4);
    const arm = (sx) => { const a = grp(fig, [sx * 0.22, 1.0, 0]); P(a, G.cyl(0.05, 0.1, 0.4, 10), robe, [sx * 0.03, -0.18, 0.1], [0.6, 0, sx * 0.1]); P(a, G.sph(0.04, 8, 6), MAT.std('#b8a891', 0.7), [sx * 0.05, -0.36, 0.25]); return a; };
    arm(-1); arm(1);
    const st = grp(fig, [0.3, 0.0, 0.22]); staff(st, MAT.std('#2a1d16', 0.8), 1.5);
    P(st, G.sph(0.08, 10, 8), MAT.std('#d6ccb3', 0.8), [0, 1.58, 0], [0, 0, 0], [0.9, 1, 1.05]);
    const orb = P(st, G.sph(0.045, 10, 8), MAT.glow(o.eye || '#ff4a3a', 3), [0, 1.58, 0.06], [0, 0, 0], [1, 1, 1], false);
    root.userData = { fig, head, weapon: st, orb, height: 1.55 };
    return root;
  }

  function orc(o = {}) {
    const skin = MAT.std(o.skin || '#4e6b2f', 0.72), iron = MAT.std('#4b4f55', 0.45, 0.85), leather = MAT.std('#3b2a1f', 0.85), bone = MAT.std('#e3d9bf', 0.7);
    const sc = o.scale || 1;
    const root = new THREE.Group(), fig = grp(root, [0, 0.12, 0]);
    fig.scale.setScalar(sc);
    P(fig, G.cyl(0.1, 0.085, 0.42, 10), skin, [-0.14, 0.21, 0]); P(fig, G.cyl(0.1, 0.085, 0.42, 10), skin, [0.14, 0.21, 0]);
    P(fig, G.box(0.15, 0.1, 0.22), leather, [-0.14, 0.05, 0.03]); P(fig, G.box(0.15, 0.1, 0.22), leather, [0.14, 0.05, 0.03]);
    P(fig, G.lathe([[0.3, 0.35], [0.31, 0.5], [0.27, 0.62]]), leather);
    P(fig, G.sph(0.34, 16, 12), skin, [0, 0.84, 0.02], [0.2, 0, 0], [1.1, 0.95, 0.85]);
    P(fig, G.tor(0.29, 0.04, 6, 20), leather, [0, 0.66, 0.02], [Math.PI / 2, 0, 0]);
    P(fig, G.box(0.1, 0.1, 0.05), iron, [0, 0.66, 0.3]);
    if (!o.berserk) {
      const sp = grp(fig, [-0.32, 1.06, 0]);
      P(sp, G.sph(0.17, 12, 8), iron, [0, 0, 0], [0, 0, 0.4], [1, 0.7, 1]);
      for (let k = 0; k < 3; k++) P(sp, G.cone(0.03, 0.12, 6), iron, [-0.06 + k * 0.06, 0.1, 0], [0, 0, 0.4 - k * 0.2]);
    } else {
      for (let k = 0; k < 3; k++) P(fig, G.box(0.25, 0.025, 0.02), MAT.std('#7a1414', 0.7), [0, 0.8 + k * 0.08, 0.3], [0.3, 0, 0.2]);
    }
    const head = grp(fig, [0, 1.22, 0.08]);
    P(head, G.sph(0.18, 14, 12), skin, [0, 0, 0], [0, 0, 0], [1, 0.95, 1]);
    P(head, G.box(0.24, 0.1, 0.16), skin, [0, -0.1, 0.08]);
    P(head, G.cone(0.025, 0.1, 6), bone, [-0.08, -0.03, 0.15], [-0.2, 0, 0.2]); P(head, G.cone(0.025, 0.1, 6), bone, [0.08, -0.03, 0.15], [-0.2, 0, -0.2]);
    P(head, G.cone(0.05, 0.16, 6), skin, [-0.2, 0.04, 0], [0, 0, 1.3]); P(head, G.cone(0.05, 0.16, 6), skin, [0.2, 0.04, 0], [0, 0, -1.3]);
    eyes(head, 0.04, 0.16, 0.06, o.eye || '#ff3b1f', 0.022, 3.5);
    P(head, G.box(0.22, 0.03, 0.05), MAT.std('#26331a', 0.8), [0, 0.09, 0.15], [0.3, 0, 0]);
    if (o.helm !== false && !o.berserk && !o.shaman) {
      P(head, G.sph(0.19, 14, 8, 0), iron, [0, 0.06, -0.01], [0, 0, 0], [1, 0.7, 1.05]);
      P(head, G.cone(0.04, 0.2, 8), bone, [-0.15, 0.17, 0], [0, 0, 0.7]); P(head, G.cone(0.04, 0.2, 8), bone, [0.15, 0.17, 0], [0, 0, -0.7]);
    }
    if (o.berserk) for (let k = 0; k < 5; k++) P(head, G.box(0.03, 0.08, 0.06), MAT.std('#1a1210', 0.9), [0, 0.18, -0.12 + k * 0.06]);
    if (o.shaman) { P(head, G.sph(0.17, 12, 10), bone, [0, 0.02, 0.06], [0, 0, 0], [1, 1, 0.6]); eyes(head, 0.03, 0.17, 0.06, '#ffae3b', 0.024, 4); for (let k = 0; k < 5; k++) P(head, G.cone(0.02, 0.2, 4), MAT.std(['#a33', '#da3', '#eee'][k % 3], 0.8), [-0.12 + k * 0.06, 0.24, -0.08], [-0.3, 0, (k - 2) * 0.2]); }
    const arm = (sx) => { const a = grp(fig, [sx * 0.36, 1.02, 0]); P(a, G.cyl(0.085, 0.075, 0.45, 8), skin, [sx * 0.04, -0.22, 0.04], [0.3, 0, sx * 0.2]); P(a, G.sph(0.08, 8, 6), skin, [sx * 0.08, -0.45, 0.12]); P(a, G.cyl(0.085, 0.085, 0.1, 8), leather, [sx * 0.07, -0.36, 0.1], [0.3, 0, sx * 0.2]); return a; };
    arm(-1); arm(1);
    let weapon;
    if (o.shaman) {
      weapon = grp(fig, [0.42, 0, 0.18]); staff(weapon, MAT.std('#3a2616', 0.85), 1.55);
      P(weapon, G.sph(0.07, 8, 6), bone, [0, 1.58, 0]);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.55), SHADERS.flameMat('#ffd27a', '#ff4b10'));
      fl.position.set(0, 1.85, 0); weapon.add(fl); root.userData.flame = fl;
    } else if (o.spear) {
      weapon = grp(fig, [0.42, 0, 0.18], [0.1, 0, 0]); staff(weapon, MAT.std('#4a3020', 0.85), 1.7); P(weapon, G.cone(0.05, 0.22, 4), iron, [0, 1.8, 0]);
    } else {
      weapon = grp(fig, [0.44, 0.55, 0.25], [0.4, 0, -0.2]); axe(weapon, MAT.std('#4a3020', 0.85), iron, 1);
      if (o.berserk) { const w2 = grp(fig, [-0.44, 0.55, 0.25], [0.4, Math.PI, 0.2]); axe(w2, MAT.std('#4a3020', 0.85), iron, 1); }
    }
    root.userData = Object.assign(root.userData, { fig, head, weapon, height: 1.5 * sc });
    return root;
  }

  function wraith(o = {}) {
    const col = o.color || '#5fd0e6';
    const gm = MAT.ghost(col, 0.5, 0.9), dark = MAT.std('#030405', 1);
    const root = new THREE.Group(), fig = grp(root, [0, 0.4, 0]);
    P(fig, tatter(0.34, 1.05, 7), gm, [0, 0, 0], [0, 0, 0], [1, 1, 1], false);
    const head = grp(fig, [0, 1.12, 0]);
    P(head, G.sph(0.17, 14, 12), gm, [0, 0, -0.02], [0, 0, 0], [1, 1.15, 1.1], false);
    P(head, G.sph(0.12, 12, 10), dark, [0, -0.02, 0.06], [0, 0, 0], [1, 1, 1], false);
    eyes(head, 0.0, 0.165, 0.045, '#e8ffff', 0.02, 4);
    const arm = (sx) => { const a = grp(fig, [sx * 0.24, 0.88, 0.05]); P(a, G.cone(0.08, 0.6, 8), gm, [sx * 0.1, -0.15, 0.2], [1.2, 0, sx * -0.4], [1, 1, 1], false); return a; };
    arm(-1); arm(1);
    root.userData = { fig, head, height: 1.7, float: 0.4, ghost: true };
    return root;
  }

  function golem(o = {}) {
    const rock = MAT.std('#2a2433', 0.9, 0.05), cry = MAT.glow(o.crystal || '#b98cff', 1.8), cryS = MAT.std(o.crystal || '#b98cff', 0.15, 0.2, { emissive: o.crystal || '#7a4ae0', emissiveIntensity: 0.6, transparent: true, opacity: 0.88 });
    const root = new THREE.Group(), fig = grp(root, [0, 0.12, 0]);
    fig.scale.setScalar(1.15);
    P(fig, G.dode(0.16), rock, [-0.15, 0.18, 0]); P(fig, G.dode(0.16), rock, [0.15, 0.18, 0]);
    P(fig, G.dode(0.2), rock, [0, 0.48, 0]);
    P(fig, G.ico(0.34, 0), rock, [0, 0.86, 0], [0.3, 0.4, 0], [1.1, 0.95, 0.9]);
    P(fig, G.ico(0.14, 0), cryS, [0, 0.9, 0.2]);
    for (let k = 0; k < 5; k++) P(fig, G.oct(0.09 + (k % 2) * 0.04), cryS, [Math.cos(k * 1.3) * 0.25, 1.05 + (k % 3) * 0.08, -0.15 + Math.sin(k * 1.3) * 0.1], [k, k * 0.7, 0], [0.7, 2.2, 0.7]);
    const head = grp(fig, [0, 1.2, 0.08]);
    P(head, G.dode(0.13), rock);
    P(head, G.sph(0.035, 8, 6), cry, [0, 0.0, 0.11], [0, 0, 0], [1, 1, 1], false);
    const arm = (sx) => { const a = grp(fig, [sx * 0.42, 1.0, 0]); P(a, G.dode(0.13), rock, [0, -0.1, 0]); P(a, G.dode(0.12), rock, [sx * 0.05, -0.36, 0.06]); P(a, G.ico(0.15, 0), rock, [sx * 0.06, -0.6, 0.1]); P(a, G.oct(0.07), cryS, [sx * 0.08, -0.72, 0.15], [0, 0, 0], [0.6, 1.6, 0.6]); return a; };
    arm(-1); arm(1);
    root.userData = { fig, head, height: 1.7 };
    return root;
  }

  /* ----------------------------- JEFES ----------------------------- */
  function malakor() {
    const robe = MAT.std('#13201a', 0.85), bone = MAT.std('#ddd2b6', 0.8), trim = MAT.std('#8c7a4c', 0.4, 0.7);
    const root = new THREE.Group(), fig = grp(root, [0, 0.2, 0]);
    fig.scale.setScalar(1.3);
    P(fig, tatter(0.34, 1.05, 3), robe);
    P(fig, G.tor(0.21, 0.02, 6, 20), trim, [0, 0.72, 0], [Math.PI / 2, 0, 0]);
    P(fig, G.cyl(0.28, 0.2, 0.3, 16, true), MAT.std('#13201a', 0.85, 0, { side: THREE.DoubleSide }), [0, 1.13, -0.04], [0.2, 0, 0], [1, 1, 0.7]);
    for (let k = 0; k < 6; k++) P(fig, G.box(0.12, 0.012, 0.012), bone, [0, 0.4 + k * 0.08, 0.235 - k * 0.006]);
    const head = grp(fig, [0, 1.2, 0.02]);
    P(head, G.sph(0.13, 14, 12), bone, [0, 0, 0], [0, 0, 0], [0.9, 1.05, 1]);
    P(head, G.sph(0.035, 8, 6), MAT.std('#050505', 1), [-0.045, 0.01, 0.1]); P(head, G.sph(0.035, 8, 6), MAT.std('#050505', 1), [0.045, 0.01, 0.1]);
    eyes(head, 0.01, 0.125, 0.045, '#7dffb0', 0.018, 5);
    for (let k = 0; k < 7; k++) { const a = (k / 6) * Math.PI - Math.PI / 2 - Math.PI / 2; P(head, G.cone(0.02, 0.16 + (k === 3 ? 0.08 : 0), 5), bone, [Math.cos(a + Math.PI / 2) * 0.1, 0.14, Math.sin(a + Math.PI / 2) * 0.1 - 0.02], [0, 0, 0]); }
    const arm = (sx) => { const a = grp(fig, [sx * 0.25, 1.0, 0]); P(a, G.cyl(0.04, 0.12, 0.5, 10), robe, [sx * 0.05, -0.22, 0.1], [0.5, 0, sx * 0.2]); P(a, G.sph(0.04, 8, 6), bone, [sx * 0.1, -0.44, 0.24]); };
    arm(-1); arm(1);
    const st = grp(fig, [0.36, -0.15, 0.24]); staff(st, MAT.std('#1d140f', 0.8), 1.85);
    P(st, G.sph(0.09, 10, 8), bone, [0, 1.9, 0]);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), SHADERS.flameMat('#b9ffd8', '#11a35e')); fl.position.set(0, 2.15, 0); st.add(fl);
    const orbs = grp(fig, [0, 0.9, 0]);
    for (let k = 0; k < 3; k++) { const o = P(orbs, G.sph(0.06, 10, 8), MAT.glow('#6dffb0', 3), [Math.cos(k * 2.09) * 0.55, Math.sin(k * 1.7) * 0.1, Math.sin(k * 2.09) * 0.55], [0, 0, 0], [1, 1, 1], false); void o; }
    root.userData = { fig, head, weapon: st, orbs, flame: fl, height: 2.3, float: 0.12, undead: true, glow: '#6dffb0' };
    return root;
  }

  function ignis() {
    const rock = MAT.std('#231611', 0.95), core = MAT.glow('#ff6a1a', 2.6), coreHot = MAT.glow('#ffc070', 3), iron = MAT.std('#3a3433', 0.5, 0.85);
    const root = new THREE.Group(), fig = grp(root, [0, 0.12, 0]);
    fig.scale.setScalar(1.45);
    P(fig, G.sph(0.3, 12, 10), core, [0, 0.82, 0], [0, 0, 0], [1, 1.1, 0.9], false);
    const chunks = [[0, 0.95, 0.2, 0.2], [-0.2, 0.85, 0.12, 0.17], [0.22, 0.86, 0.12, 0.17], [0, 0.7, 0.22, 0.16], [-0.18, 1.05, -0.05, 0.18], [0.2, 1.05, -0.05, 0.18], [0, 0.85, -0.22, 0.22], [0, 1.12, 0.1, 0.15]];
    chunks.forEach(([x, y, z, r], i) => P(fig, G.dode(r), rock, [x, y, z], [i, i * 0.6, i * 0.3]));
    P(fig, G.dode(0.16), rock, [-0.15, 0.25, 0]); P(fig, G.dode(0.16), rock, [0.15, 0.25, 0]);
    P(fig, G.sph(0.1, 8, 6), core, [-0.15, 0.4, 0], [0, 0, 0], [1, 1, 1], false); P(fig, G.sph(0.1, 8, 6), core, [0.15, 0.4, 0], [0, 0, 0], [1, 1, 1], false);
    P(fig, G.dode(0.2), rock, [0, 0.52, 0]);
    const head = grp(fig, [0, 1.32, 0.08]);
    P(head, G.dode(0.15), rock);
    P(head, G.box(0.16, 0.03, 0.05), coreHot, [0, -0.02, 0.12], [0, 0, 0], [1, 1, 1], false);
    P(head, G.cone(0.05, 0.3, 6), rock, [-0.16, 0.14, -0.02], [0.3, 0, 0.8]); P(head, G.cone(0.05, 0.3, 6), rock, [0.16, 0.14, -0.02], [0.3, 0, -0.8]);
    const arm = (sx) => { const a = grp(fig, [sx * 0.38, 1.0, 0]); P(a, G.dode(0.14), rock, [0, -0.08, 0]); P(a, G.sph(0.07, 6, 5), core, [sx * 0.03, -0.24, 0.04], [0, 0, 0], [1, 1, 1], false); P(a, G.dode(0.13), rock, [sx * 0.05, -0.36, 0.08]); P(a, G.dode(0.12), rock, [sx * 0.07, -0.58, 0.14]); return a; };
    arm(-1); arm(1);
    const hm = grp(fig, [0.48, 0.42, 0.25], [0.5, 0, -0.25]);
    P(hm, G.cyl(0.04, 0.04, 1.0, 8), iron, [0, 0.45, 0]);
    P(hm, G.box(0.42, 0.24, 0.24), iron, [0, 0.98, 0]);
    P(hm, G.box(0.43, 0.04, 0.25), coreHot, [0, 0.98, 0], [0, 0, 0], [1, 1, 1], false);
    root.userData = { fig, head, weapon: hm, height: 2.4, glow: '#ff7a2a' };
    return root;
  }

  function aethelgard() {
    const gm = MAT.ghost('#8fd6ff', 0.62, 1.0), gm2 = MAT.ghost('#c7ecff', 0.75, 1.3);
    const root = new THREE.Group(), fig = grp(root, [0, 0.25, 0]);
    fig.scale.setScalar(1.4);
    P(fig, tatter(0.32, 0.75, 11), gm, [0, 0, 0], [0, 0, 0], [1, 1, 1], false);
    P(fig, G.lathe([[0.2, 0.6], [0.27, 0.78], [0.28, 0.95], [0.23, 1.08], [0.12, 1.13]]), gm2, [0, 0, 0], [0, 0, 0], [1, 1, 1], false);
    [-1, 1].forEach((sx) => P(fig, G.sph(0.14, 12, 8), gm2, [sx * 0.28, 1.04, 0], [0, 0, sx * -0.3], [1, 0.72, 1], false));
    const head = grp(fig, [0, 1.3, 0]);
    P(head, G.sph(0.155, 16, 12), gm2, [0, 0, 0], [0, 0, 0], [1, 1.1, 1], false);
    P(head, G.box(0.2, 0.025, 0.06), MAT.glow('#ffffff', 3), [0, 0.0, 0.135], [0, 0, 0], [1, 1, 1], false);
    for (let k = 0; k < 5; k++) P(head, G.cone(0.02, 0.12, 4), gm2, [Math.cos(k * 0.6 + 1.6) * 0.12, 0.17, Math.sin(k * 0.6 + 1.6) * 0.04 - 0.02], [0, 0, (k - 2) * 0.2], [1, 1, 1], false);
    const sw = grp(fig, [0.3, 0.2, 0.3], [0.1, 0, -0.05]);
    P(sw, G.box(0.08, 1.1, 0.02), MAT.glow('#bfe8ff', 1.8), [0, 0.65, 0], [0, 0, 0], [1, 1, 1], false);
    P(sw, G.box(0.32, 0.05, 0.06), gm2, [0, 0.1, 0], [0, 0, 0], [1, 1, 1], false);
    const arm = (sx) => { const a = grp(fig, [sx * 0.3, 0.98, 0]); P(a, G.cyl(0.07, 0.06, 0.42, 8), gm, [0, -0.2, 0.08], [0.4, 0, 0], [1, 1, 1], false); };
    arm(-1); arm(1);
    const halo = P(fig, G.tor(0.22, 0.012, 6, 32), MAT.glow('#e8f7ff', 2.2), [0, 1.62, -0.05], [Math.PI / 2 - 0.2, 0, 0], [1, 1, 1], false);
    root.userData = { fig, head, weapon: sw, halo, height: 2.3, float: 0.25, ghost: true, glow: '#8fd6ff' };
    return root;
  }

  function isolde(o = {}) {
    const robe = MAT.std('#d4cdbf', 0.85), veil = new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: 0.6, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
    const band = MAT.std('#141018', 0.9), skin = MAT.std('#d8c3b0', 0.6), voidM = MAT.glow('#9d6bff', 1.6);
    const root = new THREE.Group(), fig = grp(root, [0, 0.35, 0]);
    fig.scale.setScalar(o.small ? 1 : 1.45);
    P(fig, tatter(0.36, 1.1, 21), robe);
    P(fig, G.tor(0.15, 0.06, 8, 18), robe, [0, 1.1, 0], [Math.PI / 2, 0, 0]);
    const head = grp(fig, [0, 1.27, 0]);
    P(head, G.sph(0.12, 16, 12), skin, [0, 0, 0.01]);
    P(head, G.tor(0.122, 0.028, 6, 24), band, [0, 0.015, 0.0], [Math.PI / 2, 0, 0]);
    P(head, G.sph(0.16, 16, 12), veil, [0, 0.03, -0.02], [0, 0, 0], [1, 1.25, 1.05], false);
    const arm = (sx) => { const a = grp(fig, [sx * 0.24, 1.02, 0]); P(a, G.cyl(0.045, 0.1, 0.45, 10), robe, [sx * 0.12, -0.12, 0.12], [0.9, 0, sx * 0.6]); P(a, G.sph(0.04, 8, 6), skin, [sx * 0.26, -0.24, 0.28]); };
    arm(-1); arm(1);
    const eyesG = grp(fig, [0, 1.25, 0]);
    const n = 8;
    for (let k = 0; k < n; k++) {
      const e = grp(eyesG, [Math.cos(k / n * Math.PI * 2) * 0.62, Math.sin(k * 1.9) * 0.12, Math.sin(k / n * Math.PI * 2) * 0.62]);
      P(e, G.sph(0.055, 12, 10), MAT.std('#f4efe6', 0.3), [0, 0, 0], [0, 0, 0], [1, 1, 1], false);
      P(e, G.sph(0.03, 10, 8), MAT.glow('#9d6bff', 2.5), [0, 0, 0.035], [0, 0, 0], [1, 1, 0.4], false);
      P(e, G.sph(0.014, 6, 6), MAT.std('#000', 1), [0, 0, 0.05], [0, 0, 0], [1, 1, 0.4], false);
      e.rotation.y = Math.atan2(e.position.x, e.position.z);
    }
    const tendrils = grp(root, [0, 0.1, 0]);
    if (!o.small) for (let k = 0; k < 5; k++) {
      const a = k / 5 * Math.PI * 2, pts = [];
      for (let i = 0; i < 6; i++) pts.push(new THREE.Vector3(Math.cos(a + i * 0.3) * (0.15 + i * 0.12), 0.6 - i * 0.12, Math.sin(a + i * 0.3) * (0.15 + i * 0.12)));
      P(tendrils, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.035, 6, false), voidM, [0, 0, 0], [0, 0, 0], [1, 1, 1], false);
    }
    root.userData = { fig, head, eyes: eyesG, tendrils, height: 2.4, float: 0.3, glow: '#9d6bff' };
    return root;
  }

  function dwarfGhost() {
    const gm = MAT.ghost('#9fe3ff', 0.5, 0.9);
    const root = new THREE.Group(), fig = grp(root, [0, 0.15, 0]);
    P(fig, G.lathe([[0.33, 0.1], [0.32, 0.4], [0.3, 0.7], [0.18, 0.85]]), gm, [0, 0, 0], [0, 0, 0], [1, 1, 1], false);
    const head = grp(fig, [0, 0.95, 0.02]);
    P(head, G.sph(0.15, 14, 12), gm, [0, 0, 0], [0, 0, 0], [1, 1, 1], false);
    P(head, G.cone(0.17, 0.5, 12), gm, [0, -0.28, 0.08], [Math.PI + 0.25, 0, 0], [1, 1, 1], false);
    P(head, G.sph(0.16, 14, 8), gm, [0, 0.05, -0.01], [0, 0, 0], [1, 0.7, 1], false);
    P(head, G.cone(0.04, 0.2, 6), gm, [-0.17, 0.12, 0], [0, 0, 0.9], [1, 1, 1], false); P(head, G.cone(0.04, 0.2, 6), gm, [0.17, 0.12, 0], [0, 0, -0.9], [1, 1, 1], false);
    eyes(head, 0.0, 0.14, 0.05, '#ffffff', 0.016, 4);
    const ax = grp(fig, [0.35, 0.2, 0.2], [0.3, 0, -0.2]); P(ax, G.cyl(0.03, 0.03, 0.8, 6), gm, [0, 0.35, 0], [0, 0, 0], [1, 1, 1], false); P(ax, G.box(0.3, 0.2, 0.03), gm, [0.1, 0.7, 0], [0, 0, 0], [1, 1, 1], false);
    root.userData = { fig, head, height: 1.2, float: 0.1, ghost: true };
    return root;
  }
  function humanGhost() {
    const gm = MAT.ghost('#bfe2ff', 0.42, 0.9);
    const root = new THREE.Group(), fig = grp(root, [0, 0.2, 0]);
    P(fig, tatter(0.26, 1.0, 17), gm, [0, 0, 0], [0, 0, 0], [1, 1, 1], false);
    const head = grp(fig, [0, 1.18, 0]);
    P(head, G.sph(0.12, 14, 12), gm, [0, 0, 0], [0, 0, 0], [1, 1, 1], false);
    P(head, G.sph(0.13, 14, 8), gm, [0, 0.04, -0.02], [0, 0, 0], [1, 0.8, 1], false);
    eyes(head, 0.0, 0.115, 0.04, '#ffffff', 0.014, 3);
    root.userData = { fig, head, height: 1.5, float: 0.2, ghost: true };
    return root;
  }

  /* Versión espejo (reflejos del capítulo III) */
  function mirrorOf(kind) {
    const m = build(kind, {});
    m.traverse((o) => { if (o.isMesh && !(o.material && o.material.toneMapped === false)) o.material = MAT.glass(); });
    mergeStatic(m);
    return m;
  }

  /* ----------------------------- ATREZO ----------------------------- */
  function door(theme) {
    const g = new THREE.Group();
    const WT = TEX.wall(theme);
    const stone = new THREE.MeshStandardMaterial({ map: WT.map, normalMap: WT.normalMap, roughness: 0.9, color: new THREE.Color(0.8, 0.78, 0.75) }), iron = MAT.std('#2c2c2e', 0.45, 0.85);
    const W = TEX.wood();
    const wood = new THREE.MeshStandardMaterial({ map: W.map, normalMap: W.normalMap, roughness: 0.8, color: 0xffffff });
    P(g, G.box(0.32, 2.3, 0.62), stone, [-0.9, 1.15, 0]); P(g, G.box(0.32, 2.3, 0.62), stone, [0.9, 1.15, 0]);
    P(g, G.box(2.1, 0.34, 0.66), stone, [0, 2.32, 0]);
    P(g, G.box(0.3, 0.2, 0.7), stone, [0, 2.32, 0], [0, 0, Math.PI / 4]);
    const pivot = grp(g, [-0.74, 0, 0]);
    P(pivot, G.box(1.48, 2.06, 0.12), wood, [0.74, 1.04, 0]);
    P(pivot, G.box(1.5, 0.1, 0.15), iron, [0.74, 0.4, 0]); P(pivot, G.box(1.5, 0.1, 0.15), iron, [0.74, 1.62, 0]);
    P(pivot, G.tor(0.08, 0.015, 6, 16), iron, [1.25, 1.0, 0.09]);
    const leak = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    leak.rotation.x = -Math.PI / 2; leak.position.set(0, 0.05, 0); g.add(leak);
    g.userData = { pivot, leak };
    return g;
  }
  function chest() {
    const g = new THREE.Group();
    const W = TEX.wood();
    const wood = new THREE.MeshStandardMaterial({ map: W.map, normalMap: W.normalMap, roughness: 0.75 });
    const iron = MAT.std('#6a5a3a', 0.4, 0.85), gold = MAT.std('#d8b25a', 0.3, 1);
    P(g, G.box(1.0, 0.5, 0.65), wood, [0, 0.27, 0]);
    P(g, G.box(1.04, 0.06, 0.69), iron, [0, 0.06, 0]); P(g, G.box(0.06, 0.52, 0.69), iron, [-0.35, 0.27, 0]); P(g, G.box(0.06, 0.52, 0.69), iron, [0.35, 0.27, 0]);
    const lid = grp(g, [0, 0.52, -0.32]);
    const lidGeo = G.k('lid', [], () => new THREE.CylinderGeometry(0.33, 0.33, 1.0, 16, 1, false, 0, Math.PI));
    P(lid, lidGeo, wood, [0, 0, 0.32], [0, 0, Math.PI / 2]);
    P(lid, G.box(0.06, 0.06, 0.04), gold, [0, 0.0, 0.66]);
    const glow = P(g, G.box(0.9, 0.05, 0.55), MAT.glow('#ffcf6b', 2), [0, 0.5, 0], [0, 0, 0], [1, 1, 1], false);
    glow.visible = false;
    P(g, G.box(0.12, 0.16, 0.05), gold, [0, 0.42, 0.34]);
    g.userData = { lid, glow };
    return g;
  }
  function pillar(theme) {
    const g = new THREE.Group(), st = MAT.std(theme.pillar || '#5a5650', 0.75);
    P(g, G.box(1.2, 0.25, 1.2), st, [0, 0.12, 0]);
    P(g, G.cyl(0.42, 0.48, 0.18, 16), st, [0, 0.33, 0]);
    P(g, G.cyl(0.36, 0.4, 2.0, 16), st, [0, 1.4, 0]);
    P(g, G.cyl(0.5, 0.38, 0.22, 16), st, [0, 2.48, 0]);
    P(g, G.box(1.15, 0.2, 1.15), st, [0, 2.68, 0]);
    return g;
  }
  function sconce() {
    const g = new THREE.Group(), iron = MAT.std('#2e2a26', 0.5, 0.8);
    P(g, G.box(0.18, 0.3, 0.06), iron, [0, 0, 0]);
    P(g, G.box(0.05, 0.05, 0.35), iron, [0, -0.05, 0.17]);
    P(g, G.cyl(0.07, 0.04, 0.12, 8), iron, [0, 0.0, 0.35]);
    P(g, G.cyl(0.045, 0.035, 0.42, 8), MAT.std('#3b2618', 0.9), [0, 0.12, 0.35], [0.12, 0, 0]);
    return g;
  }
  /* Une las piezas fijas de un adorno en una malla por material: muchas menos llamadas de dibujo */
  function merged(g) {
    g.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), groups = new Map();
    g.traverse((o) => {
      if (!o.isMesh || Array.isArray(o.material)) return;
      const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
      if (!groups.has(o.material)) groups.set(o.material, []);
      groups.get(o.material).push(geo);
    });
    const out = new THREE.Group();
    groups.forEach((geos, mat) => {
      const n = geos.reduce((a, q) => a + q.attributes.position.count, 0);
      const P = new Float32Array(n * 3), N = new Float32Array(n * 3), UV = new Float32Array(n * 2);
      let off = 0;
      geos.forEach((q) => { P.set(q.attributes.position.array, off * 3); N.set(q.attributes.normal.array, off * 3); UV.set(q.attributes.uv.array, off * 2); off += q.attributes.position.count; q.dispose(); });
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.BufferAttribute(P, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(N, 3)); bg.setAttribute('uv', new THREE.BufferAttribute(UV, 2));
      const m = new THREE.Mesh(bg, mat); m.userData.own = true; out.add(m);
    });
    out.userData = Object.assign({}, g.userData);
    return out;
  }
  /* ----------------------- adornos de pared (la cara frontal mira a +z) ----------------------- */
  function banner(color, emblem) {
    const g = new THREE.Group(), iron = MAT.std('#2e2a26', 0.5, 0.8);
    P(g, G.cyl(0.02, 0.02, 0.86, 6), iron, [0, 0.62, 0.08], [0, 0, Math.PI / 2]);
    [-1, 1].forEach((sx) => P(g, G.sph(0.035, 8, 6), iron, [sx * 0.44, 0.62, 0.08]));
    const geo = G.k('banner', [], () => {
      const w = 0.66, h = 1.25, gg = new THREE.PlaneGeometry(w, h, 6, 10), pos = gg.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), t = (h / 2 - y) / h;
        let yy = y; if (t > 0.92) yy = y + Math.abs(x) * 0.5 * (t - 0.92) * 10 - 0.08 * Math.abs(Math.sin(x * 20)); // cola en V raída
        pos.setY(i, yy); pos.setZ(i, Math.sin(x * 6 + t * 2) * 0.025 + t * 0.04);
      }
      gg.translate(0, -h / 2, 0); gg.computeVertexNormals(); return gg;
    });
    P(g, geo, MAT.std(color, 0.9, 0, { side: THREE.DoubleSide }), [0, 0.62, 0.09]);
    P(g, G.cyl(0.13, 0.13, 0.012, 20), MAT.std(emblem, 0.4, 0.7), [0, 0.12, 0.13], [Math.PI / 2, 0, 0]);
    P(g, G.oct(0.07), MAT.std(emblem, 0.4, 0.7), [0, 0.12, 0.145], [0, 0, 0], [1, 1.4, 0.3]);
    P(g, G.box(0.66, 0.04, 0.012), MAT.std(emblem, 0.4, 0.7), [0, 0.5, 0.1]);
    return g;
  }
  function chains() {
    const g = new THREE.Group(), iron = MAT.std('#3a3632', 0.45, 0.85);
    P(g, G.box(0.5, 0.08, 0.06), iron, [0, 0.55, 0.03]);
    [-0.18, 0.18].forEach((x, j) => {
      const n = 6 + j * 2;
      for (let k = 0; k < n; k++) P(g, G.tor(0.04, 0.011, 5, 10), iron, [x, 0.5 - k * 0.07, 0.06], [0, k % 2 ? Math.PI / 2 : 0, 0]);
      P(g, G.tor(0.08, 0.016, 6, 16), iron, [x, 0.5 - n * 0.07 - 0.05, 0.07]);
    });
    return g;
  }
  function skullShelf(rnd) {
    const g = new THREE.Group(), stone = MAT.std('#5e5a52', 0.85), bone = MAT.std('#d8cdb0', 0.7);
    P(g, G.box(0.9, 0.07, 0.3), stone, [0, 0, 0.15]);
    P(g, G.box(0.08, 0.14, 0.24), stone, [-0.36, -0.1, 0.12]); P(g, G.box(0.08, 0.14, 0.24), stone, [0.36, -0.1, 0.12]);
    for (let k = 0; k < 3; k++) {
      const x = -0.26 + k * 0.26 + (rnd() - 0.5) * 0.05, sk = grp(g, [x, 0.1, 0.17], [0, (rnd() - 0.5) * 0.8, 0]);
      P(sk, G.sph(0.075, 10, 8), bone, [0, 0.02, 0], [0, 0, 0], [1, 1.05, 1.1]);
      P(sk, G.box(0.08, 0.035, 0.07), bone, [0, -0.045, 0.02]);
      P(sk, G.sph(0.02, 6, 4), MAT.std('#0a0908', 1), [-0.028, 0.02, 0.07]); P(sk, G.sph(0.02, 6, 4), MAT.std('#0a0908', 1), [0.028, 0.02, 0.07]);
    }
    return g;
  }
  function weaponRack() {
    const g = new THREE.Group(), wood = MAT.std('#4a3020', 0.85), iron = MAT.std('#7c8088', 0.35, 0.85), red = MAT.std('#7a2a1e', 0.8);
    P(g, G.cyl(0.32, 0.32, 0.05, 24), wood, [0, 0.2, 0.04], [Math.PI / 2, 0, 0]);
    P(g, G.cyl(0.33, 0.33, 0.03, 24), iron, [0, 0.2, 0.02], [Math.PI / 2, 0, 0]);
    P(g, G.cyl(0.1, 0.1, 0.03, 16), red, [0, 0.2, 0.075], [Math.PI / 2, 0, 0]);
    [-1, 1].forEach((sx) => { const a = axe(grp(g, [sx * 0.05, -0.25, 0.1], [0, 0, sx * -0.65]), wood, iron, 0.9); void a; });
    return g;
  }
  function pipes() {
    const g = new THREE.Group(), cu = MAT.std('#a8602a', 0.4, 0.8), iron = MAT.std('#3a3632', 0.5, 0.8);
    [-0.2, 0.05].forEach((x, j) => { P(g, G.cyl(0.06 - j * 0.015, 0.06 - j * 0.015, 2.1, 10), cu, [x, 0.0, 0.08]); for (let k = 0; k < 3; k++) P(g, G.cyl(0.075 - j * 0.015, 0.075 - j * 0.015, 0.05, 10), iron, [x, -0.7 + k * 0.7, 0.08]); });
    P(g, G.cyl(0.04, 0.04, 0.25, 8), cu, [-0.08, 0.3, 0.08], [0, 0, Math.PI / 2]);
    P(g, G.tor(0.08, 0.014, 6, 16), MAT.std('#7a1d1d', 0.6, 0.4), [0.05, -0.2, 0.17]);
    return g;
  }
  function wallCrystals(color) {
    const g = new THREE.Group(), m = MAT.std(color, 0.12, 0.2, { emissive: color, emissiveIntensity: 0.7, transparent: true, opacity: 0.88 });
    P(g, G.dode(0.16), MAT.std('#221d2b', 0.9), [0, 0, 0.05]);
    for (let k = 0; k < 5; k++) P(g, G.oct(0.09 + (k % 3) * 0.03), m, [Math.cos(k * 1.3) * 0.12, Math.sin(k * 1.3) * 0.12, 0.12], [k * 0.4 + 0.6, k, 0.3 * k], [0.55, 2.2 + (k % 2) * 0.6, 0.55]);
    return g;
  }
  function runePanel(color) {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: TEX.runeRing(5), color: new THREE.Color(color).multiplyScalar(1.4), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7 }));
    m.position.set(0, 0, 0.03); g.add(m); g.userData.spin = m;
    return g;
  }
  /* Rayo de luz que cae de una grieta del techo (con su charco de luz en el suelo) */
  function lightShaft(color) {
    const g = new THREE.Group();
    const geo = G.k('shaft', [], () => { const c = new THREE.CylinderGeometry(0.55, 1.05, 6.5, 20, 1, true); c.translate(0, 3.25, 0); return c; });
    const mat = new THREE.ShaderMaterial({
      uniforms: { uCol: { value: new THREE.Color(color) }, uA: { value: 0 }, uT: { value: 0 } },
      vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = position.y / 6.5; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 uCol; uniform float uA; uniform float uT; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float edge = pow(abs(dot(vN, vV)), 1.6); float h = smoothstep(0.0, 0.25, vY) * (1.0 - smoothstep(0.55, 1.0, vY)); float fl = 0.85 + 0.15 * sin(uT * 1.3 + vY * 6.0); gl_FragColor = vec4(uCol * edge * h * fl * uA * 0.42, 1.0); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(geo, mat); beam.renderOrder = 6; g.add(beam);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: TEX.dot(), color: new THREE.Color(color).multiplyScalar(0.8), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = 0.02; pool.renderOrder = 2; g.add(pool);
    g.userData = { noRise: true, shaft: mat, pool };
    return g;
  }
  function sarcophagus() {
    const g = new THREE.Group(), st = MAT.std('#6b665c', 0.8), dark = MAT.std('#3a3732', 0.85);
    P(g, G.box(1.1, 0.7, 1.7), st, [0, 0.35, 0]);
    P(g, G.box(1.2, 0.14, 1.8), dark, [0, 0.76, 0]);
    P(g, G.sph(0.18, 10, 8), st, [0, 0.9, -0.55], [0, 0, 0], [1, 0.6, 1.2]);
    P(g, G.box(0.5, 0.12, 0.9), st, [0, 0.88, 0.15]);
    P(g, G.box(0.06, 0.08, 0.5), MAT.std('#8b7d55', 0.4, 0.8), [0, 0.95, 0.25]);
    return g;
  }
  function anvil() {
    const g = new THREE.Group(), iron = MAT.std('#3b3a3c', 0.4, 0.9), stone = MAT.std('#3a2c25', 0.9);
    P(g, G.box(1.0, 0.5, 1.0), stone, [0, 0.25, 0]);
    P(g, G.box(0.4, 0.4, 0.3), iron, [0, 0.7, 0]);
    P(g, G.box(0.9, 0.22, 0.42), iron, [0, 1.0, 0]);
    P(g, G.cone(0.2, 0.45, 4), iron, [0.62, 1.0, 0], [0, 0, -Math.PI / 2], [1, 1, 0.7]);
    P(g, G.box(0.3, 0.06, 0.06), MAT.glow('#ff7a2a', 1.6), [-0.1, 1.13, 0], [0, 0.4, 0], [1, 1, 1], false);
    return g;
  }
  function brazier() {
    const g = new THREE.Group(), iron = MAT.std('#2b2725', 0.5, 0.85);
    P(g, G.cyl(0.08, 0.14, 0.9, 8), iron, [0, 0.45, 0]);
    P(g, G.cyl(0.5, 0.3, 0.3, 12, true), MAT.std('#2b2725', 0.5, 0.85, { side: THREE.DoubleSide }), [0, 1.0, 0]);
    P(g, G.cyl(0.42, 0.42, 0.05, 12), MAT.glow('#ff5a1a', 2.2), [0, 1.08, 0], [0, 0, 0], [1, 1, 1], false);
    return g;
  }
  function crystals(color) {
    const g = new THREE.Group(), m = MAT.std(color, 0.12, 0.2, { emissive: color, emissiveIntensity: 0.55, transparent: true, opacity: 0.86 });
    P(g, G.dode(0.35), MAT.std('#221d2b', 0.9), [0, 0.15, 0]);
    for (let k = 0; k < 6; k++) P(g, G.oct(0.18 + (k % 3) * 0.06), m, [Math.cos(k * 1.1) * 0.3, 0.45 + (k % 2) * 0.2, Math.sin(k * 1.1) * 0.3], [k * 0.3, k, 0.2 * k], [0.6, 2.4 + (k % 3) * 0.4, 0.6]);
    return g;
  }
  function mirror() {
    const g = new THREE.Group(), frame = MAT.std('#6b5a35', 0.35, 0.9);
    const ring = G.k('mirrorRing', [], () => new THREE.TorusGeometry(0.55, 0.06, 8, 32));
    P(g, ring, frame, [0, 1.25, 0], [0, 0, 0], [0.85, 1.25, 1]);
    const glass = P(g, G.k('mirrorDisc', [], () => new THREE.CircleGeometry(0.55, 32)), MAT.glass(), [0, 1.25, 0.01], [0, 0, 0], [0.85, 1.25, 1]);
    P(g, G.box(0.5, 0.2, 0.4), frame, [0, 0.1, 0]);
    P(g, G.cyl(0.05, 0.05, 0.55, 6), frame, [0, 0.35, 0]);
    g.userData = { glass };
    return g;
  }
  function bones(rnd) {
    const g = new THREE.Group(), bone = MAT.std('#cfc5ad', 0.85);
    for (let k = 0; k < 5; k++) P(g, G.cyl(0.025, 0.025, 0.3 + rnd() * 0.2, 5), bone, [(rnd() - 0.5) * 1.3, 0.03, (rnd() - 0.5) * 1.3], [Math.PI / 2, rnd() * 3, 0]);
    if (rnd() < 0.6) P(g, G.sph(0.09, 8, 6), bone, [(rnd() - 0.5) * 1.0, 0.07, (rnd() - 0.5) * 1.0], [0.3, rnd() * 6, 0.4], [0.9, 1, 1.1]);
    return g;
  }
  function rubble(rnd, color = '#3b3430') {
    const g = new THREE.Group(), st = MAT.std(color, 0.9);
    for (let k = 0; k < 6; k++) P(g, G.dode(0.07 + rnd() * 0.1), st, [(rnd() - 0.5) * 1.5, 0.05, (rnd() - 0.5) * 1.5], [rnd() * 3, rnd() * 3, 0]);
    return g;
  }
  function crate() {
    const g = new THREE.Group(), W = TEX.wood(); const wood = new THREE.MeshStandardMaterial({ map: W.map, normalMap: W.normalMap, roughness: 0.85 });
    P(g, G.box(0.8, 0.8, 0.8), wood, [0.15, 0.4, 0.1], [0, 0.3, 0]);
    P(g, G.cyl(0.32, 0.32, 0.85, 14), MAT.std('#5a3b22', 0.8), [-0.4, 0.42, -0.3]);
    P(g, G.tor(0.33, 0.02, 4, 18), MAT.std('#3a3836', 0.5, 0.8), [-0.4, 0.2, -0.3], [Math.PI / 2, 0, 0]); P(g, G.tor(0.33, 0.02, 4, 18), MAT.std('#3a3836', 0.5, 0.8), [-0.4, 0.64, -0.3], [Math.PI / 2, 0, 0]);
    return g;
  }
  function altar(color) {
    const g = new THREE.Group(), st = MAT.std('#4d4740', 0.7);
    P(g, G.cyl(0.85, 0.95, 0.2, 8), st, [0, 0.1, 0]);
    P(g, G.cyl(0.6, 0.7, 0.3, 8), st, [0, 0.35, 0]);
    P(g, G.cyl(0.35, 0.45, 0.6, 8), st, [0, 0.8, 0]);
    const gem = P(g, G.oct(0.22), MAT.glow(color, 2.4), [0, 1.45, 0], [0, 0, 0], [1, 1.4, 1], false);
    const ringMat = new THREE.MeshBasicMaterial({ map: TEX.runeRing(3), color: new THREE.Color(color).multiplyScalar(1.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), ringMat); ring.rotation.x = -Math.PI / 2; ring.position.y = 1.15; g.add(ring);
    g.userData = { gem, ring };
    return g;
  }
  function lectern() {
    const g = new THREE.Group(), wood = MAT.std('#3d2a1c', 0.8);
    P(g, G.cyl(0.06, 0.1, 0.9, 8), wood, [0, 0.45, 0]);
    P(g, G.box(0.6, 0.06, 0.45), wood, [0, 0.95, 0], [-0.5, 0, 0]);
    const page = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), new THREE.MeshStandardMaterial({ map: TEX.parchment(), roughness: 0.9, emissive: new THREE.Color('#ffcf8a'), emissiveIntensity: 0.25 }));
    page.position.set(0, 0.99, 0.02); page.rotation.x = -0.5 - Math.PI / 2; g.add(page);
    g.userData = { page };
    return g;
  }
  function stairs(theme) {
    const g = new THREE.Group(), st = MAT.std(theme.trim || '#4a4640', 0.8);
    for (let k = 0; k < 4; k++) P(g, G.box(1.8, 0.3, 0.45), st, [0, -0.15 - k * 0.3, -0.7 + k * 0.45]);
    P(g, G.box(1.9, 0.08, 1.9), MAT.std('#050505', 1), [0, -1.3, 0]);
    return g;
  }
  function candles(rnd) {
    const g = new THREE.Group(), wax = MAT.std('#e8dcc0', 0.6);
    for (let k = 0; k < 5; k++) {
      const h = 0.15 + rnd() * 0.25, x = (rnd() - 0.5) * 0.5, z = (rnd() - 0.5) * 0.5;
      P(g, G.cyl(0.035, 0.04, h, 8), wax, [x, h / 2, z]);
      P(g, G.sph(0.022, 6, 6), MAT.glow('#ffb35a', 3), [x, h + 0.03, z], [0, 0, 0], [0.8, 1.6, 0.8], false);
    }
    return g;
  }
  function campfire() {
    const g = new THREE.Group(), wood = MAT.std('#3a2414', 0.9), stone = MAT.std('#4a4440', 0.85);
    for (let k = 0; k < 9; k++) P(g, G.dode(0.16), stone, [Math.cos(k / 9 * Math.PI * 2) * 0.62, 0.08, Math.sin(k / 9 * Math.PI * 2) * 0.62], [k, k, 0]);
    for (let k = 0; k < 5; k++) P(g, G.cyl(0.06, 0.07, 0.9, 6), wood, [0, 0.2, 0], [1.1, k / 5 * Math.PI * 2, 0]);
    P(g, G.sph(0.25, 10, 8), MAT.glow('#ff6a1a', 2), [0, 0.1, 0], [0, 0, 0], [1, 0.4, 1], false);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.5), SHADERS.flameMat('#ffe0a0', '#ff4a10')); fl.position.set(0, 0.85, 0); g.add(fl);
    g.userData = { flame: fl };
    return g;
  }
  function bedroll(color) {
    const g = new THREE.Group();
    P(g, G.box(0.7, 0.08, 1.6), MAT.std(color, 0.95), [0, 0.04, 0]);
    P(g, G.cyl(0.14, 0.14, 0.7, 10), MAT.std(color, 0.95), [0, 0.12, -0.75], [0, 0, Math.PI / 2]);
    return g;
  }

  const builders = {
    aldric, sera, elian, brunna, nyra, skeleton, ghoul, cultist, orc, wraith, golem, malakor, ignis, aethelgard, isolde,
    thrain: dwarfGhost, tomas: humanGhost,
    archer: (o) => skeleton(Object.assign({ bow: true }, o)),
    goblin: (o) => orc(Object.assign({ scale: 0.72, skin: '#6a7a2a', spear: true, helm: false, eye: '#ffd23a' }, o)),
    shaman: (o) => orc(Object.assign({ shaman: true, skin: '#5d6a35' }, o)),
    berserker: (o) => orc(Object.assign({ berserk: true, skin: '#56702e' }, o)),
    acolyte: (o) => cultist(o),
    voidAcolyte: (o) => cultist(Object.assign({ color: '#2c1748', color2: '#0c0614', eye: '#c08bff' }, o)),
    reflection: () => mirrorOf(U.pick(['aldric', 'sera', 'elian'])),
  };
  /* Fusiona las piezas estáticas de cada figura por material (menos llamadas de dibujo) */
  function mergeGeos(list) {
    let n = 0; list.forEach((g) => (n += g.attributes.position.count));
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    let o = 0;
    list.forEach((g) => {
      pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
      o += g.attributes.position.count; g.dispose();
    });
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    out.computeBoundingSphere();
    return out;
  }
  function mergeStatic(root) {
    const ud = root.userData, fig = ud.fig; if (!fig) return;
    const keep = new Set([ud.head, ud.cape, ud.weapon, ud.weapon2, ud.orbs, ud.eyes, ud.tendrils, ud.halo, ud.crystal, ud.lantern, ud.lanternCore, ud.flame, ud.bow, ud.shield, ud.shieldRim, ud.orb].filter(Boolean));
    root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(fig.matrixWorld).invert();
    const groups = new Map(), remove = [], tmp = new THREE.Matrix4();
    fig.traverse((o) => {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.normal) return;
      let p = o; while (p && p !== fig) { if (keep.has(p)) return; p = p.parent; }
      const m = o.material;
      if (!m || Array.isArray(m) || m.transparent || m.toneMapped === false || m.side === THREE.DoubleSide) return;
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      g.applyMatrix4(tmp.multiplyMatrices(inv, o.matrixWorld));
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (!groups.has(m)) groups.set(m, []);
      groups.get(m).push(g); remove.push(o);
    });
    remove.forEach((o) => o.parent.remove(o));
    groups.forEach((list, mat) => { const mesh = new THREE.Mesh(mergeGeos(list), mat); mesh.castShadow = mesh.receiveShadow = true; mesh.userData.own = true; fig.add(mesh); });
  }
  function build(kind, o = {}) {
    const fn = builders[kind] || skeleton;
    const m = fn(o);
    if (kind !== 'reflection') mergeStatic(m);
    return m;
  }
  return { build, base, door, chest, pillar, sconce, merged, banner, chains, skullShelf, weaponRack, pipes, wallCrystals, runePanel, lightShaft, sarcophagus, anvil, brazier, crystals, mirror, bones, rubble, crate, altar, lectern, stairs, candles, campfire, bedroll, mirrorOf };
})();
