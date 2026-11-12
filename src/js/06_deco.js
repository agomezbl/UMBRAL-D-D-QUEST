/* ==========================================================================
   Atrezo de salas: muebles, adornos de pared y piezas de suelo
   --------------------------------------------------------------------------
   Cada pieza se describe con formas sencillas pintadas por vértice. Todas las
   piezas de una sala se funden después en tres mallas como mucho (mate, metal
   y brillo), así que una sala llena de muebles cuesta tres llamadas de dibujo.

   Cómo se añade una pieza (ver 06_deco_*.js):

     DECO.add('barril', { slot: 'corner', temas: ['crypt', 'forge'], tags: ['bodega'] }, (b, rnd) => {
       b.cyl(0.24, 0.24, 0.62, 12, '#6a4526', [0.3, 0.31, 0.3]);
       b.tor(0.245, 0.02, '#3a3632', [0.3, 0.15, 0.3], [Math.PI / 2, 0, 0], 'x');
     });

   Huecos (slot) y el volumen que puede ocupar cada pieza (1 casilla = 2 × 2):
     'wall'   pegada a un muro. Origen: centro del tramo de muro, a ras de suelo.
              +z entra en la sala. x de −0.9 a 0.9 · z de 0 a 0.40 · y de 0 a 2.1
     'hang'   colgada del muro (no toca el suelo: cuadros, escudos, estantes altos).
              Igual que 'wall', pero y de 1.0 a 2.1 y z de 0 a 0.22
     'corner' en un rincón. Origen: el vértice del rincón. +x y +z entran en la sala.
              x y z de 0 a 0.6 · y libre
     'block'  ocupa la casilla entera (solo se pone en casillas que ya bloquean).
              Origen: centro de la casilla. x y z de −0.85 a 0.85
     'floor'  plana sobre el suelo, se puede pisar. Origen: centro de la casilla.
              y de 0 a 0.035. Puede medir varias casillas (meta.tw × meta.td)
   Las figuras tienen una peana de 0.62 de radio en el centro de la casilla:
   por eso lo que va pegado al muro no puede salir más de 0.40.
   ========================================================================== */
const DECO = (() => {
  const CAT = {};
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _n = new THREE.Matrix3(), _c = new THREE.Color();
  const nonIdx = new Map();
  const flat = (g) => { let q = nonIdx.get(g); if (!q) { q = g.index ? g.toNonIndexed() : g; if (!q.attributes.normal) q.computeVertexNormals(); nonIdx.set(g, q); } return q; };
  const colCache = {};
  const rgb = (col) => {
    if (Array.isArray(col)) return col;
    return colCache[col] || (colCache[col] = (() => { _c.set(col); return [_c.r, _c.g, _c.b]; })());
  };
  const mat4 = (pos, rot, scale) => {
    _v.set(pos[0] || 0, pos[1] || 0, pos[2] || 0);
    _q.setFromEuler(_e.set(rot ? rot[0] || 0 : 0, rot ? rot[1] || 0 : 0, rot ? rot[2] || 0 : 0));
    if (scale == null) _s.set(1, 1, 1); else if (typeof scale === 'number') _s.set(scale, scale, scale); else _s.set(scale[0], scale[1], scale[2]);
    return new THREE.Matrix4().compose(_v, _q, _s);
  };
  const newBuf = () => ({ p: [], n: [], c: [] });

  /* Constructor de piezas: cada llamada añade una forma ya colocada y pintada.
     kind: 'm' mate (por defecto) · 'x' metal · 'g' brillo propio (velas, pociones, brasas)
     col: '#rrggbb'. En 'g' el color se multiplica por o.k (2 por defecto) para que resplandezca.
     o.ao: sombra falsa hacia la base de la forma (0 a 1; por defecto 0.22 en mate y metal). */
  class Builder {
    constructor(rnd) { this.rnd = rnd || Math.random; this.buf = { m: newBuf(), x: newBuf(), g: newBuf() }; this.lights = []; this.flames = []; this.stack = [new THREE.Matrix4()]; }
    get top() { return this.stack[this.stack.length - 1]; }
    /* Agrupa: todo lo que se añada dentro de fn queda movido, girado y escalado junto */
    at(pos, rot, fn, scale) { this.stack.push(new THREE.Matrix4().multiplyMatrices(this.top, mat4(pos, rot, scale))); fn(this); this.stack.pop(); return this; }
    geo(g, col, pos = [0, 0, 0], rot = null, scale = null, kind = 'm', o = {}) {
      const src = flat(g), P = src.attributes.position, N = src.attributes.normal, B = this.buf[kind] || this.buf.m;
      _m.multiplyMatrices(this.top, mat4(pos, rot, scale)); _n.getNormalMatrix(_m);
      const c = rgb(col), k = kind === 'g' ? (o.k != null ? o.k : 2) : 1, ao = kind === 'g' ? 0 : (o.ao != null ? o.ao : 0.22);
      let y0 = Infinity, y1 = -Infinity;
      if (ao) { for (let i = 0; i < P.count; i++) { const y = P.getY(i); if (y < y0) y0 = y; if (y > y1) y1 = y; } }
      const span = y1 - y0 || 1, c2 = o.col2 ? rgb(o.col2) : null;
      for (let i = 0; i < P.count; i++) {
        _v.fromBufferAttribute(P, i);
        const t = ao || c2 ? (_v.y - y0) / span : 1;
        _v.applyMatrix4(_m); B.p.push(_v.x, _v.y, _v.z);
        _v.fromBufferAttribute(N, i).applyMatrix3(_n).normalize(); B.n.push(_v.x, _v.y, _v.z);
        const sh = k * (ao ? 1 - ao * (1 - t) : 1);
        if (c2) B.c.push((c[0] + (c2[0] - c[0]) * t) * sh, (c[1] + (c2[1] - c[1]) * t) * sh, (c[2] + (c2[2] - c[2]) * t) * sh);
        else B.c.push(c[0] * sh, c[1] * sh, c[2] * sh);
      }
      return this;
    }
    box(w, h, d, col, pos, rot, kind, o) { return this.geo(G.box(w, h, d), col, pos, rot, null, kind, o); }
    cyl(rt, rb, h, seg, col, pos, rot, kind, o) { return this.geo(G.cyl(rt, rb, h, seg || 10), col, pos, rot, null, kind, o); }
    cone(r, h, seg, col, pos, rot, kind, o) { return this.geo(G.cone(r, h, seg || 8), col, pos, rot, null, kind, o); }
    sph(r, col, pos, scale, kind, o) { return this.geo(G.sph(r, 10, 8), col, pos, null, scale, kind, o); }
    tor(r, t, col, pos, rot, kind, o, arc) { return this.geo(G.tor(r, t, 5, 14, arc || Math.PI * 2), col, pos, rot, null, kind, o); }
    oct(r, col, pos, rot, scale, kind, o) { return this.geo(G.oct(r), col, pos, rot, scale, kind, o); }
    dode(r, col, pos, rot, scale, kind, o) { return this.geo(G.dode(r), col, pos, rot, scale, kind, o); }
    lathe(pts, seg, col, pos, rot, kind, o) { return this.geo(G.lathe(pts, seg || 12), col, pos, rot, null, kind, o); }
    /* Plano horizontal (alfombras, charcos): w × d, mirando hacia arriba */
    plane(w, d, col, pos, rotY, kind, o) { return this.geo(G.k('dplane', [], () => { const g = new THREE.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2); return g; }), col, pos, rotY ? [0, rotY, 0] : null, [w, 1, d], kind, Object.assign({ ao: 0 }, o)); }
    /* Color con una variación al azar (para que dos tablas o dos libros no sean iguales) */
    vary(col, amt = 0.12) { const c = rgb(col), f = 1 + (this.rnd() - 0.5) * 2 * amt; return [c[0] * f, c[1] * f, c[2] * f]; }
    pick(arr) { return arr[Math.floor(this.rnd() * arr.length)]; }
    /* Luz que la pieza da a la sala (se hornea en el mapa de luz): velas, pociones, brasas */
    light(x, y, z, color, intensity = 0.6, dist = 3.5) { _v.set(x, y, z).applyMatrix4(this.top); this.lights.push({ x: _v.x, y: _v.y, z: _v.z, color, intensity, dist }); return this; }
    /* Llama animada (pocas: solo braseros, hogueras y fraguas) */
    flame(x, y, z, w = 0.5, h = 0.7) { _v.set(x, y, z).applyMatrix4(this.top); this.flames.push({ x: _v.x, y: _v.y, z: _v.z, w, h }); return this; }
    /* Vela con su llama */
    candle(x, y, z, h = 0.18, lit = true) {
      this.cyl(0.028, 0.032, h, 6, '#e8dcc0', [x, y + h / 2, z], null, 'm', { ao: 0.1 });
      if (lit) this.sph(0.024, '#ffb35a', [x, y + h + 0.03, z], [0.8, 1.7, 0.8], 'g', { k: 3 });
      return this;
    }
  }

  const add = (name, meta, fn) => { CAT[name] = { name, meta: Object.assign({ slot: 'wall', temas: null, tags: [] }, meta), fn }; };
  /* Construye una pieza suelta: devuelve sus formas (aún sin fundir), luces y llamas */
  const make = (name, rnd, o) => {
    const it = CAT[name]; if (!it) return null;
    const b = new Builder(rnd);
    it.fn(b, b.rnd, o || {});
    let top = 0; ['m', 'x', 'g'].forEach((k) => { const p = b.buf[k].p; for (let i = 1; i < p.length; i += 3) if (p[i] > top) top = p[i]; });
    return { name, meta: it.meta, buf: b.buf, lights: b.lights, flames: b.flames, top };
  };

  let mats = null;
  const materials = () => mats || (mats = {
    m: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.84, metalness: 0 }),
    x: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.36, metalness: 0.85 }),
    g: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })
  });
  /* Funde una lista de piezas colocadas ({ res, m: Matrix4 }) en un grupo de hasta tres mallas.
     Devuelve también las luces y las llamas ya en coordenadas del mundo. */
  const compose = (items) => {
    const acc = { m: newBuf(), x: newBuf(), g: newBuf() }, lights = [], flames = [];
    const count = { m: 0, x: 0, g: 0 };
    items.forEach(({ res }) => ['m', 'x', 'g'].forEach((k) => (count[k] += res.buf[k].p.length)));
    const out = {};
    ['m', 'x', 'g'].forEach((k) => { if (count[k]) out[k] = { p: new Float32Array(count[k]), n: new Float32Array(count[k]), c: new Float32Array(count[k]), o: 0 }; });
    items.forEach(({ res, m }) => {
      _n.getNormalMatrix(m);
      ['m', 'x', 'g'].forEach((k) => {
        const B = res.buf[k], O = out[k]; if (!B.p.length) return;
        for (let i = 0; i < B.p.length; i += 3) {
          _v.set(B.p[i], B.p[i + 1], B.p[i + 2]).applyMatrix4(m); O.p[O.o + i] = _v.x; O.p[O.o + i + 1] = _v.y; O.p[O.o + i + 2] = _v.z;
          _v.set(B.n[i], B.n[i + 1], B.n[i + 2]).applyMatrix3(_n).normalize(); O.n[O.o + i] = _v.x; O.n[O.o + i + 1] = _v.y; O.n[O.o + i + 2] = _v.z;
        }
        O.c.set(B.c, O.o); O.o += B.p.length;
      });
      res.lights.forEach((l) => { _v.set(l.x, l.y, l.z).applyMatrix4(m); lights.push(Object.assign({}, l, { x: _v.x, y: _v.y, z: _v.z })); });
      res.flames.forEach((f) => { _v.set(f.x, f.y, f.z).applyMatrix4(m); flames.push(Object.assign({}, f, { x: _v.x, y: _v.y, z: _v.z })); });
    });
    const group = new THREE.Group(), M = materials();
    void acc;
    ['m', 'x', 'g'].forEach((k) => {
      const O = out[k]; if (!O) return;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(O.p, 3)); g.setAttribute('normal', new THREE.BufferAttribute(O.n, 3)); g.setAttribute('color', new THREE.BufferAttribute(O.c, 3));
      g.computeBoundingSphere();
      const mesh = new THREE.Mesh(g, M[k]); mesh.userData.own = true;
      if (k !== 'g') { mesh.castShadow = true; mesh.receiveShadow = true; } else mesh.castShadow = false;
      group.add(mesh);
    });
    return { group, lights, flames };
  };
  /* Pieza suelta ya convertida en mallas (para el probador y para piezas aisladas) */
  const mesh = (name, rnd, o) => { const res = make(name, rnd, o); return res ? compose([{ res, m: new THREE.Matrix4() }]) : null; };
  /* Nombres de las piezas que valen para un hueco, un tema y (si se pide) una etiqueta */
  const list = (slot, tema, tag) => Object.values(CAT).filter((it) => it.meta.slot === slot && (!it.meta.temas || !tema || it.meta.temas.includes(tema)) && (!tag || it.meta.tags.includes(tag))).map((it) => it.name);

  return { CAT, add, make, compose, mesh, list, materials, Builder };
})();
