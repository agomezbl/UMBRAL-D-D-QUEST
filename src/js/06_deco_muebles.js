/* ==========================================================================
   Atrezo: muebles y objetos de uso general (valen para varios temas)
   --------------------------------------------------------------------------
   De pared (wall), de rincón (corner), de casilla entera (block) y de suelo
   (floor). Las medidas al azar se aplican como escala sobre formas unidad
   (bx, cy) para no llenar la caché de geometrías con tamaños irrepetibles.
   ========================================================================== */
(() => {
  const PI = Math.PI, H = PI / 2;
  const WOOD = '#6a4526', WOOD_D = '#4a2f1a', WOOD_L = '#8a6238', PINE = '#7d5c36', IRON = '#3a3632', STEEL = '#8d929b';
  const STONE = '#5e5a52', STONE_D = '#48453f', STONE_L = '#7c776d', BRASS = '#a8823a', GOLD = '#d6a62c', COPPER = '#a8602a';
  const RED = '#6a1f24', BLUE = '#27405e', GREEN = '#2f4a2c', PARCH = '#cbb98c', PARCH_D = '#9c8a62', WAX = '#e8dcc0', LINEN = '#b9ad8f';
  const BURLAP = '#8a7450', STRAW = '#b0934a', PEWTER = '#7f8388', CLAY = '#8a4a2c', SOOT = '#1a1512', FLAME = '#ffb35a';
  const LIBROS = ['#6a1f24', '#27405e', '#2f4a2c', '#5a3a1e', '#4a2a55', '#7a5a22', '#1f4248', '#3a2a22', '#7a3a1c'];
  const TELAS = ['#6a1f24', '#2f4a2c', '#27405e', '#5a4a36', '#4a2a55', '#55585e'];

  /* ------------------------------ formas de apoyo ------------------------------ */
  /* Caja y cilindro de tamaño libre (escala sobre la forma unidad) y esfera de pocos lados */
  const bx = (b, w, h, d, col, pos, rot, kind, o) => b.geo(G.box(1, 1, 1), col, pos, rot, [w, h, d], kind, o || {});
  const cy = (b, r, h, seg, col, pos, rot, kind, o) => b.geo(G.cyl(1, 1, 1, seg || 6), col, pos, rot, [r, h, r], kind, o || {});
  const bola = (b, r, col, pos, scale, kind, o) => b.geo(G.sph(r, 7, 5), col, pos, null, scale, kind, o || {});
  const disco = () => G.k('mdisco', [], () => { const g = new THREE.CircleGeometry(1, 24); g.rotateX(-H); return g; });
  const anillo = (ri) => G.k('manillo', [ri], () => { const g = new THREE.RingGeometry(ri, 1, 28, 1); g.rotateX(-H); return g; });
  /* Media caña (tapa de baúl): eje a lo largo de x, lomo hacia arriba */
  const mediaCana = (r, len) => G.k('mcana', [r, len], () => { const g = new THREE.CylinderGeometry(r, r, len, 8, 1, false, 0, PI); g.rotateZ(H); return g; });
  /* Medio torno (pila de fuente): solo la mitad que mira a +z */
  const medioTorno = (pts, seg) => G.k('mtorno', [JSON.stringify(pts), seg], () => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg, -H, PI));
  const _a = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), UP = new THREE.Vector3(0, 1, 0);
  /* Palo entre dos puntos (astas, patas, cuerdas). Devuelve el giro, para colocar algo en la punta */
  const palo = (b, p0, p1, r, col, kind, seg) => {
    _a.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]); const len = _a.length();
    _e.setFromQuaternion(_q.setFromUnitVectors(UP, _a.normalize()));
    const rot = [_e.x, _e.y, _e.z];
    cy(b, r, len, seg || 6, col, [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2], rot, kind);
    return rot;
  };
  /* Vela barata (la llama es una esfera de pocos lados) y palmatoria de latón */
  const vela = (b, x, y, z, h = 0.16, lit = true) => {
    cy(b, 0.028, h, 6, WAX, [x, y + h / 2, z], null, 'm', { ao: 0.1 });
    if (lit) b.geo(G.sph(0.024, 6, 4), FLAME, [x, y + h + 0.03, z], null, [0.8, 1.7, 0.8], 'g', { k: 3 });
  };
  const palmatoria = (b, x, y, z, h = 0.16, lit = true) => { b.cyl(0.065, 0.05, 0.02, 8, BRASS, [x, y + 0.01, z], null, 'x'); vela(b, x, y + 0.02, z, h, lit); };
  /* Rollo de pergamino (eje y local) con cinta opcional */
  const rollo = (b, pos, rot, len = 0.26, r = 0.035, cinta) => b.at(pos, rot, (b) => {
    cy(b, r, len, 6, b.vary(PARCH, 0.1), [0, 0, 0], null, 'm', { ao: 0.12 });
    if (cinta) cy(b, r + 0.005, 0.035, 6, cinta, [0, 0, 0], null, 'm', { ao: 0 });
  });
  /* Libro tumbado con sus hojas a la vista */
  const libroTumbado = (b, pos, rotY, w = 0.26, t = 0.055, d = 0.2, col) => b.at(pos, [0, rotY || 0, 0], (b) => {
    bx(b, w, t, d, col || b.vary(b.pick(LIBROS), 0.15), [0, t / 2, 0]);
    bx(b, w - 0.02, t * 0.62, d + 0.004, '#d3c59e', [0.012, t / 2, 0], null, 'm', { ao: 0 });
  });
  /* Libro abierto (lomo a lo largo de z), centrado en el origen */
  const libroAbierto = (b, pos, rotY, s) => b.at(pos, [0, rotY || 0, 0], (b) => {
    b.box(0.4, 0.014, 0.28, b.pick(LIBROS), [0, 0.007, 0]);
    [-1, 1].forEach((sx) => b.at([sx * 0.095, 0.03, 0], [0, 0, -sx * 0.1], (b) => {
      b.box(0.185, 0.026, 0.26, '#d9cba4', [0, 0, 0], null, 'm', { ao: 0.1 });
      for (let k = 0; k < 4; k++) b.plane(0.13, 0.012, '#5a4a36', [0, 0.0135, -0.09 + k * 0.058]);
    }));
  }, s);
  /* Fila de libros de pie sobre una balda, de x0 a x1; z es el frente de los lomos (miran a +z) */
  const filaLibros = (b, rnd, x0, x1, y, z, hMax) => {
    let x = x0 + 0.008;
    while (x < x1 - 0.07) {
      const r = rnd(), left = x1 - x;
      if (r < 0.08) { x += 0.05 + rnd() * 0.07; continue; }                                   // hueco
      if (r < 0.2 && left > 0.32) {                                                           // montón tumbado
        const n = 2 + Math.floor(rnd() * 3), w = 0.22 + rnd() * 0.05; let yy = y;
        for (let k = 0; k < n && yy - y < hMax - 0.09; k++) { const t = 0.045 + rnd() * 0.03; libroTumbado(b, [x + w / 2 + 0.01, yy, z - 0.115], PI + (rnd() - 0.5) * 0.16, w - k * 0.015, t, 0.19); yy += t; }
        x += w + 0.03; continue;
      }
      if (r < 0.28 && left > 0.22) {                                                          // rollos de pergamino
        const zz = z - 0.125, cinta = rnd() < 0.5 ? RED : null;
        rollo(b, [x + 0.045, y + 0.04, zz], [H, 0, 0], 0.23, 0.04); rollo(b, [x + 0.13, y + 0.04, zz + 0.01], [H, 0, 0], 0.22, 0.04, cinta);
        if (rnd() < 0.6) rollo(b, [x + 0.088, y + 0.108, zz], [H, 0, 0], 0.24, 0.038);
        x += 0.19; continue;
      }
      const w = Math.min(left - 0.01, 0.075 + rnd() * 0.075), h = hMax * (0.6 + rnd() * 0.36), d = 0.17 + rnd() * 0.06, zc = z - rnd() * 0.025 - d / 2;
      const col = b.vary(b.pick(LIBROS), 0.2);
      if (rnd() < 0.1 && left > w + 0.16) {                                                   // libro ladeado
        const a = 0.26, sn = Math.sin(a);
        b.at([x, y + w * sn, zc], [0, 0, -a], (b) => bx(b, w, h * 0.9, d, col, [w / 2, h * 0.45, 0]));
        x += w * Math.cos(a) + h * 0.9 * sn + 0.006; continue;
      }
      bx(b, w, h, d, col, [x + w / 2, y + h / 2, zc]);
      if (rnd() < 0.28) bx(b, w + 0.003, 0.022, d + 0.003, rnd() < 0.7 ? BRASS : PARCH, [x + w / 2, y + h * (0.72 + rnd() * 0.12), zc], null, 'm', { ao: 0 });
      x += w + 0.004;
    }
  };
  /* Mesa estrecha de pared: tablero a la altura y (cara de arriba), faldón y cuatro patas */
  const mesa = (b, W, D, y, col = WOOD, pata = 0.06) => {
    const z = D / 2 + 0.01;
    b.box(W, 0.05, D, col, [0, y - 0.025, z]);
    b.box(W - 0.12, 0.09, D - 0.08, WOOD_D, [0, y - 0.095, z]);
    [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => b.box(pata, y - 0.05, pata, WOOD_D, [sx * (W / 2 - 0.07), (y - 0.05) / 2, z + sz * (D / 2 - 0.05)])));
    [-0.07, 0.06].forEach((dz) => b.plane(W - 0.02, 0.008, WOOD_D, [0, y + 0.001, z + dz]));
  };
  /* Frascos de alquimia: panza que brilla, cuello de vidrio y corcho. tipo 0 redondo · 1 cónico · 2 botella */
  const FR = [
    [[0, 0], [0.06, 0.005], [0.1, 0.06], [0.1, 0.11], [0.06, 0.17], [0.028, 0.19]],
    [[0, 0], [0.1, 0.005], [0.1, 0.03], [0.03, 0.19]],
    [[0, 0], [0.06, 0.005], [0.065, 0.03], [0.065, 0.17], [0.028, 0.21]]
  ];
  const frasco = (b, x, y, z, tipo, col, s, k = 1.5) => b.at([x, y, z], null, (b) => {
    const p = FR[tipo], top = p[p.length - 1][1];
    b.lathe(p, 7, col, [0, 0, 0], null, 'g', { k });
    b.cyl(0.03, 0.028, 0.09, 5, '#8fa39c', [0, top + 0.045, 0], null, 'm', { ao: 0 });
    b.cyl(0.024, 0.024, 0.03, 5, PINE, [0, top + 0.1, 0]);
  }, s);
  /* Tarro con tapa y, a veces, etiqueta */
  const tarro = (b, x, y, z, r, h, col, kind, etiqueta) => {
    cy(b, r, h, 6, col, [x, y + h / 2, z], [0, PI / 6, 0], kind || 'm', kind === 'g' ? { k: 1.0 } : {});
    cy(b, r * 0.8, 0.03, 5, kind === 'g' ? PINE : WOOD_D, [x, y + h + 0.015, z]);
    if (etiqueta) bx(b, r * 0.8, h * 0.4, 0.006, PARCH, [x, y + h * 0.5, z + r * 0.87], null, 'm', { ao: 0 });
  };
  /* Espada con la punta hacia −y (origen en la cruz), lanza y escudo redondo de cara a +z */
  const espada = (b, len = 0.7) => {
    b.geo(G.box(1, 1, 1), STEEL, [0, -len / 2, 0], null, [0.05, len, 0.014], 'x');
    b.geo(G.cone(0.025, 0.07, 4), STEEL, [0, -len - 0.035, 0], [PI, 0, 0], [1, 1, 0.28], 'x');
    b.box(0.2, 0.03, 0.035, BRASS, [0, 0.015, 0], null, 'x');
    b.cyl(0.018, 0.018, 0.14, 6, '#3a2418', [0, 0.1, 0]);
    b.oct(0.03, BRASS, [0, 0.19, 0], null, null, 'x');
  };
  const lanza = (b, p0, p1, punta = 0) => {
    const rot = palo(b, p0, p1, 0.018, b.vary(WOOD_L, 0.1));
    b.at(p1, rot, (b) => {
      if (punta === 0) b.geo(G.cone(0.055, 0.26, 4), STEEL, [0, 0.12, 0], null, [1, 1, 0.3], 'x');
      else {                                                                                   // alabarda
        b.geo(G.cone(0.03, 0.2, 4), STEEL, [0, 0.1, 0], null, [1, 1, 0.3], 'x');
        b.geo(G.cone(0.11, 0.15, 4), STEEL, [0.075, -0.06, 0], [0, 0, H], [1, 1, 0.14], 'x');
        b.geo(G.cone(0.03, 0.1, 4), STEEL, [-0.05, -0.06, 0], [0, 0, H], [1, 1, 0.3], 'x');
      }
      b.cyl(0.024, 0.024, 0.05, 6, BRASS, [0, -0.02, 0], null, 'x');
    });
  };
  const escudo = (b, r, col, col2) => {
    b.cyl(r, r, 0.03, 10, IRON, [0, 0, 0], [H, 0, 0], 'x');
    b.cyl(r - 0.028, r - 0.028, 0.034, 10, col, [0, 0, 0.003], [H, 0, 0], 'm', { ao: 0 });
    b.box(r * 1.72, 0.05, 0.036, col2, [0, 0, 0.004], null, 'm', { ao: 0 }); b.box(0.05, r * 1.72, 0.036, col2, [0, 0, 0.004], null, 'm', { ao: 0 });
    bola(b, 0.06, STEEL, [0, 0, 0.02], [1, 1, 0.6], 'x');
  };
  /* Barril de pie en el origen (r y h fijos por llamada: se guardan en caché) */
  const barril = (b, r = 0.2, h = 0.6, col) => {
    b.lathe([[r * 0.8, 0], [r * 0.96, h * 0.25], [r, h * 0.5], [r * 0.96, h * 0.75], [r * 0.8, h], [r * 0.7, h], [r * 0.7, h - 0.02], [0, h - 0.02]], 10, col || b.vary(WOOD, 0.1));
    [0.2, 0.8].forEach((t) => b.cyl(r * 0.955 + 0.004, r * 0.955 + 0.004, h * 0.06, 10, IRON, [0, h * t, 0], null, 'x'));
  };
  /* Saco de arpillera atado (cerrado) o abierto con grano */
  const SACO = [[0, 0], [0.15, 0.02], [0.2, 0.12], [0.2, 0.3], [0.16, 0.44], [0.07, 0.5], [0.1, 0.57]];
  const SACO_AB = [[0, 0], [0.15, 0.02], [0.2, 0.12], [0.2, 0.32], [0.19, 0.43], [0.165, 0.43], [0.165, 0.4]];
  const saco = (b, pos, rot, s, abierto, col) => b.at(pos, rot, (b) => {
    const c = col || b.vary(BURLAP, 0.14);
    if (abierto) { b.lathe(SACO_AB, 8, c); b.cyl(0.165, 0.165, 0.02, 8, '#c9a24a', [0, 0.4, 0], null, 'm', { ao: 0 }); }
    else { b.lathe(SACO, 8, c); b.cyl(0.078, 0.078, 0.025, 6, STRAW, [0, 0.5, 0], null, 'm', { ao: 0 }); }
    b.box(0.1, 0.09, 0.01, '#6a5a3c', [0.03, 0.2, 0.197], [0, 0, 0.2], 'm', { ao: 0 });
  }, s);
  /* Caja de tablas con marco y travesaño (origen: centro de la base) */
  const caja = (b, w, h, d, col) => {
    const c = col || b.vary(PINE, 0.12), f = WOOD_D, t = 0.055, z = d / 2 + 0.006;
    bx(b, w, h, d, c, [0, h / 2, 0]);
    [h - t / 2, t / 2].forEach((y) => bx(b, w + 0.012, t, 0.014, f, [0, y, z]));
    [-1, 1].forEach((s) => bx(b, t, h - t * 2, 0.014, f, [s * (w / 2 - t / 2 + 0.006), h / 2, z]));
    bx(b, Math.hypot(w - t * 2, h - t * 2), t * 0.8, 0.01, f, [0, h / 2, z - 0.002], [0, 0, Math.atan2(h - t * 2, w - t * 2)]);
    [-1, 1].forEach((s) => bx(b, w + 0.012, 0.012, t, f, [0, h + 0.004, s * (d / 2 - t / 2 + 0.004)], null, 'm', { ao: 0 }));
    [-1, 1].forEach((s) => bx(b, 0.012, h, t, f, [s * (w / 2 + 0.004), h / 2, d / 2 - t / 2 + 0.004]));
  };

  /* ================================ DE PARED ================================ */
  DECO.add('estanteria_libros', { slot: 'wall', tags: ['archivo', 'biblioteca', 'laboratorio', 'observatorio', 'celdas', 'salon'] }, (b, rnd) => {
    const W = 1.56, D = 0.31, HT = 1.86, col = b.vary(WOOD_D, 0.1);
    b.box(W, HT, 0.03, '#2a1a0e', [0, HT / 2, 0.015]);
    [-1, 1].forEach((s) => b.box(0.06, HT, D, col, [s * (W / 2 - 0.03), HT / 2, D / 2]));
    b.box(W + 0.06, 0.1, D + 0.04, WOOD_D, [0, 0.05, (D + 0.04) / 2]);
    b.box(W + 0.1, 0.07, D + 0.06, WOOD, [0, HT + 0.035, (D + 0.06) / 2]);
    [0.1, 0.54, 0.98, 1.42].forEach((y, i) => {
      if (i) b.box(W - 0.1, 0.035, D - 0.02, WOOD, [0, y - 0.0175, D / 2 + 0.01]);
      filaLibros(b, rnd, -W / 2 + 0.07, W / 2 - 0.07, y, D - 0.02, 0.38);
    });
    libroTumbado(b, [-0.38 + rnd() * 0.2, HT + 0.07, 0.17], 0.25, 0.28, 0.06, 0.2);
    rollo(b, [0.3 + rnd() * 0.2, HT + 0.105, 0.16], [0, 0.2, H], 0.3, 0.035, RED);
  });

  DECO.add('estanteria_pergaminos', { slot: 'wall', tags: ['archivo', 'biblioteca', 'observatorio', 'laboratorio'] }, (b, rnd) => {
    const W = 1.5, D = 0.33, C = 0.345, y0 = 0.46, col = b.vary(WOOD_D, 0.1);
    // cuerpo bajo con dos cajones
    b.box(W, y0 - 0.06, D, col, [0, (y0 - 0.06) / 2 + 0.06, D / 2]); b.box(W + 0.04, 0.06, D + 0.03, WOOD_D, [0, 0.03, (D + 0.03) / 2]);
    [-1, 1].forEach((s) => { b.box(0.64, 0.26, 0.016, WOOD, [s * 0.35, 0.26, D + 0.008]); b.oct(0.028, BRASS, [s * 0.35, 0.26, D + 0.026], null, null, 'x'); });
    b.box(W + 0.06, 0.04, D + 0.04, WOOD, [0, y0 - 0.02, (D + 0.04) / 2]);
    // casillero de 4 × 3
    b.box(W, C * 3 + 0.03, 0.03, '#2a1a0e', [0, y0 + C * 1.5, 0.015]);
    for (let i = 0; i <= 4; i++) b.box(0.035, C * 3, D - 0.02, col, [-C * 2 + i * C, y0 + C * 1.5, (D - 0.02) / 2 + 0.01]);
    for (let j = 1; j <= 3; j++) b.box(W - 0.06, 0.035, D - 0.02, j === 3 ? WOOD : col, [0, y0 + j * C, (D - 0.02) / 2 + 0.01]);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const cx = -C * 1.5 + i * C, by = y0 + j * C + 0.018 * (j ? 1 : 0), n = Math.floor(rnd() * 4);
      const one = (dx, dy, r) => {
        const len = 0.22 + rnd() * 0.07, z = 0.035 + len / 2;
        rollo(b, [cx + dx, by + dy + r, z], [H, 0, 0], len, r, rnd() < 0.25 ? b.pick([RED, BLUE, GREEN]) : null);
        if (rnd() < 0.4) b.oct(r * 0.55, WOOD_D, [cx + dx, by + dy + r, z + len / 2], null, [1, 1, 0.5]);
      };
      if (n >= 1) one(-0.075, 0, 0.05); if (n >= 2) one(0.045, 0, 0.042 + rnd() * 0.012); if (n >= 3) one(-0.01, 0.085, 0.045);
    }
    rollo(b, [-0.3, y0 + C * 3 + 0.055, 0.17], [0, 0.15, H], 0.34, 0.038, RED); rollo(b, [-0.26, y0 + C * 3 + 0.05, 0.25], [0, -0.1, H], 0.3, 0.032);
    libroTumbado(b, [0.38, y0 + C * 3 + 0.018, 0.17], -0.2);
  });

  DECO.add('escritorio', { slot: 'wall', tags: ['archivo', 'biblioteca', 'celdas', 'observatorio', 'laboratorio'] }, (b, rnd) => {
    const W = 1.34, D = 0.37, y = 0.78;
    mesa(b, W, D, y, b.vary(WOOD, 0.08));
    b.box(0.5, 0.1, 0.016, WOOD, [0.1, y - 0.1, D - 0.025]); b.oct(0.025, BRASS, [0.1, y - 0.1, D - 0.01], null, null, 'x');   // cajón
    b.box(W - 0.2, 0.04, 0.04, WOOD_D, [0, 0.16, 0.06]);
    libroAbierto(b, [-0.12, y, 0.2], 0, 0.95);
    // tintero y pluma
    b.lathe([[0, 0], [0.045, 0.004], [0.05, 0.05], [0.025, 0.07], [0.028, 0.085]], 6, '#1c2230', [0.3, y, 0.13]);
    b.geo(G.cone(0.028, 0.3, 4), '#e4decb', [0.335, y + 0.2, 0.13], [0, 0, -0.3], [1, 1, 0.22], 'm', { ao: 0 });
    palmatoria(b, 0.52, y, 0.14, 0.2);
    rollo(b, [-0.5, y + 0.035, 0.13], [H, 0, 0.25], 0.2, 0.034, RED);
    b.box(0.19, 0.004, 0.22, PARCH, [0.3, y + 0.003, 0.25], [0, 0.2, 0], 'm', { ao: 0 }); b.cyl(0.022, 0.022, 0.008, 6, '#8a1c1c', [0.35, y + 0.008, 0.31]);
    libroTumbado(b, [-0.5, y, 0.28], 0.1 + rnd() * 0.2, 0.2, 0.04, 0.15);
    b.light(0.52, y + 0.4, 0.2, FLAME, 0.6, 3.4);
  });

  DECO.add('mesa_alquimia', { slot: 'wall', tags: ['laboratorio'] }, (b, rnd) => {
    const W = 1.62, D = 0.37, y = 0.8, z = D / 2 + 0.01;
    mesa(b, W, D, y, '#3f3a36', 0.08);
    b.box(W - 0.2, 0.03, D - 0.08, WOOD_D, [0, 0.24, z]);                                      // balda baja
    tarro(b, -0.5, 0.255, z, 0.09, 0.2, CLAY); tarro(b, -0.28, 0.255, z + 0.02, 0.07, 0.15, '#4a6a5a', null, true); tarro(b, 0.45, 0.255, z, 0.1, 0.24, '#6a5a3a');
    libroTumbado(b, [0.1, 0.255, z], 0.2); libroTumbado(b, [0.1, 0.31, z], -0.1, 0.22, 0.045, 0.17);
    // alambique: matraz verde sobre trípode con mechero, serpentín de cobre y matraz violeta
    const cV = '#35c45a', cM = '#9a4ae0', cA = '#3a8ae8';
    [0, 1, 2].forEach((k) => palo(b, [-0.56 + Math.cos(k * 2.1) * 0.085, y, 0.19 + Math.sin(k * 2.1) * 0.085], [-0.56 + Math.cos(k * 2.1) * 0.06, y + 0.13, 0.19 + Math.sin(k * 2.1) * 0.06], 0.008, IRON, 'x', 4));
    b.cyl(0.075, 0.075, 0.012, 8, IRON, [-0.56, y + 0.13, 0.19], null, 'x');
    b.cyl(0.03, 0.035, 0.05, 6, BRASS, [-0.56, y + 0.025, 0.19], null, 'x'); b.geo(G.sph(0.02, 6, 4), '#6ab8ff', [-0.56, y + 0.08, 0.19], null, [0.8, 1.6, 0.8], 'g', { k: 2.4 });
    frasco(b, -0.56, y + 0.136, 0.19, 0, cV, 1.05);
    b.geo(G.tor(0.165, 0.011, 4, 8, PI), COPPER, [-0.395, y + 0.44, 0.19], null, null, 'x');
    frasco(b, -0.23, y, 0.19, 1, cM, 1.25);
    frasco(b, 0.0, y, 0.13, 2, cA, 1.0); frasco(b, 0.1, y, 0.27, 0, '#e0a030', 0.62, 1.3);
    // mortero con su mano
    b.lathe([[0, 0], [0.06, 0.005], [0.07, 0.03], [0.1, 0.11], [0.085, 0.11], [0.05, 0.04], [0, 0.035]], 8, STONE_L, [0.34, y, 0.2]);
    palo(b, [0.34, y + 0.05, 0.2], [0.42, y + 0.2, 0.15], 0.018, STONE_D);
    // gradilla con tres tubos
    b.box(0.26, 0.03, 0.09, WOOD, [0.62, y + 0.1, 0.16]); [-1, 1].forEach((s) => b.box(0.025, 0.12, 0.09, WOOD_D, [0.62 + s * 0.12, y + 0.06, 0.16]));
    ['#e04a3a', '#e8d040', '#40d8c8'].forEach((c, k) => { cy(b, 0.02, 0.15, 5, c, [0.55 + k * 0.07, y + 0.1, 0.16], null, 'g', { k: 1.5 }); });
    vela(b, 0.7, y, 0.3, 0.1 + rnd() * 0.06);
    b.plane(0.1, 0.08, '#35c45a', [0.2, y + 0.002, 0.3], 0.4, 'g', { k: 1.1 });                // gota derramada
    b.light(-0.5, y + 0.4, 0.3, '#4dff7a', 0.6, 3.4); b.light(0.0, y + 0.35, 0.3, '#a45cff', 0.5, 3.0);
  });

  DECO.add('estante_frascos', { slot: 'wall', tags: ['laboratorio', 'observatorio', 'bodega'] }, (b, rnd) => {
    const W = 1.24, D = 0.29, HT = 1.84, col = b.vary(WOOD_D, 0.1);
    b.box(W, HT, 0.03, '#241810', [0, HT / 2, 0.015]);
    [-1, 1].forEach((s) => b.box(0.06, HT, D, col, [s * (W / 2 - 0.03), HT / 2, D / 2]));
    b.box(W, 0.6, D, col, [0, 0.3, D / 2]);                                                    // cuerpo bajo cerrado
    [-1, 1].forEach((s) => { b.box(0.5, 0.44, 0.016, WOOD, [s * 0.28, 0.32, D + 0.008]); b.box(0.36, 0.3, 0.008, WOOD_D, [s * 0.28, 0.32, D + 0.02]); b.oct(0.024, BRASS, [s * 0.07, 0.34, D + 0.028], null, null, 'x'); });
    b.box(W + 0.08, 0.045, D + 0.07, WOOD, [0, 0.62, (D + 0.07) / 2]);
    b.box(W + 0.08, 0.07, D + 0.05, WOOD, [0, HT + 0.035, (D + 0.05) / 2]);
    const cols = ['#b07a2a', '#4a7a3a', '#3a6a8a', '#8a3030', '#6a4a8a', '#b9ad8f', CLAY, '#3a8a7a'];
    [0.645, 1.04, 1.43].forEach((y, j) => {
      if (j) b.box(W - 0.1, 0.03, D - 0.03, WOOD, [0, y - 0.015, D / 2 + 0.005]);
      let x = -W / 2 + 0.09;
      while (x < W / 2 - 0.14) {
        const r = 0.055 + rnd() * 0.04, h = 0.14 + rnd() * 0.17, g = rnd() < 0.22;
        tarro(b, x + r, y, 0.15 + (rnd() - 0.5) * 0.04, r, h, g ? b.pick(['#2fae52', '#3478d0', '#8a44cc', '#d09028']) : b.vary(b.pick(cols), 0.12), g ? 'g' : 'm', !g && rnd() < 0.5);
        x += r * 2 + 0.04 + rnd() * 0.06;
      }
    });
    // marco de vitrina: travesaño en arco y parteluz
    b.box(0.03, HT - 0.66, 0.02, WOOD, [0, 0.64 + (HT - 0.66) / 2, D - 0.005]);
    b.box(W - 0.1, 0.03, 0.02, WOOD, [0, 1.42, D - 0.004]);
    b.light(0, 1.2, 0.4, '#6ad8c0', 0.4, 3.0);
  });

  DECO.add('armero', { slot: 'wall', tags: ['guardia', 'armeria', 'barracon', 'fragua', 'salon'] }, (b, rnd) => {
    const col = b.vary(WOOD, 0.1);
    b.box(1.56, 0.1, 0.32, col, [0, 0.07, 0.2]); [-1, 1].forEach((s) => b.box(0.1, 0.04, 0.36, WOOD_D, [s * 0.66, 0.02, 0.2]));
    [-1, 1].forEach((s) => { b.box(0.07, 1.6, 0.07, WOOD_D, [s * 0.74, 0.9, 0.06]); b.oct(0.05, WOOD, [s * 0.74, 1.73, 0.06]); });
    b.box(1.56, 0.08, 0.09, col, [0, 1.5, 0.07]); b.box(1.5, 0.06, 0.05, WOOD_D, [0, 0.85, 0.05]);
    [-0.56, -0.34, -0.1, 0.12, 0.34].forEach((x) => [-1, 1].forEach((s) => b.box(0.025, 0.05, 0.09, WOOD_D, [x + s * 0.05, 1.5, 0.15])));
    lanza(b, [-0.56, 0.12, 0.27], [-0.56, 1.78, 0.09], 0); lanza(b, [-0.34, 0.12, 0.27], [-0.34, 1.7, 0.09], 1);
    [-0.1, 0.12].forEach((x, k) => b.at([x, 1.28 - k * 0.1, 0.105], [-0.14, 0, PI], (b) => b.at([0, 0, 0], [0, 0, PI], (b) => espada(b, 0.95 - k * 0.1))));
    // hacha
    const r = palo(b, [0.34, 0.12, 0.27], [0.34, 1.45, 0.1], 0.02, WOOD_L);
    b.at([0.34, 1.33, 0.115], r, (b) => { b.geo(G.cone(0.13, 0.17, 4), STEEL, [0.1, 0, 0], [0, 0, H], [1, 1, 0.13], 'x'); b.box(0.06, 0.1, 0.035, IRON, [0, 0, 0], null, 'x'); });
    b.at([0.56, 0.5, 0.3], [-0.12, 0, 0], (b) => escudo(b, 0.27, b.pick([RED, BLUE, GREEN]), PARCH));
  });

  DECO.add('soporte_armadura', { slot: 'wall', tags: ['guardia', 'armeria', 'salon', 'tesoro', 'santuario'] }, (b, rnd) => {
    const z = 0.2, st = b.vary(STEEL, 0.08), tela = b.pick([RED, BLUE, GREEN]);
    b.box(0.62, 0.05, 0.1, WOOD_D, [0, 0.025, z]); b.box(0.1, 0.05, 0.36, WOOD_D, [0, 0.03, z]);
    b.cyl(0.03, 0.035, 1.5, 6, WOOD, [0, 0.8, z]); b.box(0.5, 0.05, 0.05, WOOD, [0, 1.3, z]);
    b.geo(G.cyl(0.15, 0.2, 0.3, 8), tela, [0, 0.62, z], null, [1, 1, 0.72], 'm', { ao: 0.4 });           // faldón de tela
    b.geo(G.lathe([[0.14, 0], [0.17, 0.08], [0.2, 0.3], [0.215, 0.42], [0.16, 0.5], [0.08, 0.53]], 10), st, [0, 0.8, z], null, [1, 1, 0.74], 'x');   // coraza
    b.box(0.02, 0.4, 0.02, '#b9bdc4', [0, 1.02, z + 0.148], [0.08, 0, 0], 'x'); b.geo(G.cyl(0.175, 0.175, 0.04, 10), BRASS, [0, 0.82, z], null, [1, 1, 0.76], 'x');
    [-1, 0, 1].forEach((s) => b.box(0.115, 0.2, 0.02, st, [s * 0.12, 0.71, z + 0.135 - Math.abs(s) * 0.03], [0.12, s * 0.5, 0], 'x'));   // escarcelas
    [-1, 1].forEach((s) => {
      bola(b, 0.11, st, [s * 0.27, 1.3, z], [1.1, 0.75, 0.95], 'x'); b.cyl(0.05, 0.04, 0.3, 6, st, [s * 0.3, 1.1, z], [0, 0, s * 0.08], 'x');
      b.cyl(0.045, 0.05, 0.14, 6, '#4a3020', [s * 0.315, 0.9, z]);
    });
    // yelmo con penacho
    b.lathe([[0.1, 0], [0.12, 0.05], [0.125, 0.13], [0.1, 0.2], [0.05, 0.24], [0, 0.25]], 8, st, [0, 1.42, z], null, 'x');
    b.box(0.17, 0.022, 0.02, SOOT, [0, 1.535, z + 0.115]); b.box(0.024, 0.13, 0.03, st, [0, 1.5, z + 0.12], null, 'x');
    b.geo(G.sph(0.07, 7, 5), tela, [0, 1.71, z - 0.02], null, [0.35, 1.2, 1.5], 'm', { ao: 0.1 });
    // escudo de lágrima apoyado y espada
    b.at([0.5, 0.36, 0.25], [-0.22, -0.25, 0.08], (b) => { b.box(0.3, 0.36, 0.03, tela, [0, 0.08, 0]); b.geo(G.cone(0.15, 0.24, 4), tela, [0, -0.22, 0], [PI, 0, 0], [1, 1, 0.1]); b.box(0.05, 0.5, 0.036, BRASS, [0, 0, 0.002], null, 'x'); b.box(0.3, 0.05, 0.036, BRASS, [0, 0.12, 0.002], null, 'x'); });
    b.at([-0.48, 0.95, 0.09], [-0.12, 0, 0.05], (b) => espada(b, 0.8));
  });

  DECO.add('banco', { slot: 'wall', tags: ['capilla', 'celdas', 'guardia', 'barracon', 'salon', 'taberna', 'pasillo', 'archivo'] }, (b, rnd) => {
    const col = b.vary(WOOD, 0.1), tela = b.pick(TELAS), y = 0.46;
    b.box(1.56, 0.06, 0.34, col, [0, y - 0.03, 0.21]); b.plane(1.54, 0.008, WOOD_D, [0, y + 0.001, 0.2]);
    [-1, 1].forEach((s) => { b.box(0.07, y - 0.06, 0.3, WOOD_D, [s * 0.58, (y - 0.06) / 2, 0.21]); b.box(0.06, 1.0, 0.05, WOOD_D, [s * 0.7, 0.5, 0.045]); });
    b.box(1.1, 0.07, 0.05, WOOD_D, [0, 0.16, 0.21]);
    b.box(1.5, 0.26, 0.035, col, [0, 0.82, 0.04]); b.box(1.56, 0.05, 0.06, WOOD_D, [0, 0.975, 0.045]);
    [-0.45, 0, 0.45].forEach((x) => b.oct(0.05, SOOT, [x, 0.82, 0.05], [0, 0, 0], [1, 1.3, 0.25]));        // calados
    // cojín con borlas
    b.at([-0.36, y, 0.21], [0, 0.08, 0], (b) => { b.geo(G.sph(0.2, 7, 5), tela, [0, 0.05, 0], null, [1.25, 0.32, 0.72], 'm', { ao: 0.3 }); [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => b.oct(0.02, BRASS, [sx * 0.22, 0.045, sz * 0.125]))); });
    // manta doblada que cuelga
    const m = b.pick(['#5a4a36', '#3d5a4a', '#6a4a26']), m2 = PARCH_D;
    b.box(0.4, 0.035, 0.34, m, [0.46, y + 0.018, 0.215], null, 'm', { ao: 0 }); b.box(0.4, 0.26, 0.02, m, [0.46, y - 0.11, 0.388], null, 'm', { ao: 0.35 });
    [0.36, 0.56].forEach((x) => { b.box(0.045, 0.037, 0.342, m2, [x, y + 0.018, 0.215], null, 'm', { ao: 0 }); b.box(0.045, 0.262, 0.022, m2, [x, y - 0.11, 0.388], null, 'm', { ao: 0.35 }); });
  });

  DECO.add('mesa_pared', { slot: 'wall', tags: ['taberna', 'salon', 'bodega', 'barracon', 'guardia', 'celdas'] }, (b, rnd) => {
    const W = 1.56, D = 0.37, y = 0.78, z = D / 2 + 0.01;
    mesa(b, W, D, y, b.vary(WOOD, 0.08));
    // camino de mesa que cuelga por delante
    b.box(0.62, 0.008, D + 0.006, LINEN, [0.06, y + 0.004, z], null, 'm', { ao: 0 }); b.box(0.62, 0.2, 0.008, LINEN, [0.06, y - 0.095, D + 0.016], null, 'm', { ao: 0.3 });
    b.box(0.62, 0.03, 0.01, RED, [0.06, y - 0.16, D + 0.017], null, 'm', { ao: 0 });
    // jarra de peltre
    b.lathe([[0, 0], [0.07, 0.005], [0.085, 0.08], [0.075, 0.18], [0.05, 0.24], [0.06, 0.3], [0.045, 0.3], [0.04, 0.26]], 7, PEWTER, [-0.58, y, 0.17], null, 'x');
    b.geo(G.tor(0.07, 0.012, 4, 6, PI), PEWTER, [-0.655, y + 0.17, 0.17], [0, 0, H], null, 'x');
    // copa
    b.lathe([[0.04, 0], [0.012, 0.02], [0.012, 0.08], [0.045, 0.12], [0.05, 0.17], [0.04, 0.17], [0.03, 0.12]], 6, BRASS, [-0.4, y, 0.29], null, 'x');
    // plato con pan
    b.cyl(0.13, 0.09, 0.02, 8, '#b5ab94', [-0.2, y + 0.01, 0.2]);
    b.geo(G.sph(0.1, 7, 5), '#9a6a32', [-0.2, y + 0.07, 0.2], [0, 0.4, 0], [1.25, 0.6, 0.85], 'm', { col2: '#c08a40', ao: 0.01 });
    [-0.05, 0, 0.05].forEach((dx) => b.box(0.012, 0.01, 0.1, '#d9b871', [-0.2 + dx, y + 0.128, 0.2], [0, 0.4, 0], 'm', { ao: 0 }));
    // frutero
    b.lathe([[0.05, 0], [0.04, 0.03], [0.14, 0.09], [0.125, 0.09], [0.03, 0.045]], 8, WOOD_L, [0.14, y + 0.008, 0.19]);
    [[0.09, 0.19, '#a02a22'], [0.17, 0.15, '#b03a26'], [0.16, 0.24, '#6a8a2a'], [0.13, 0.2, '#c0902a']].forEach(([x, zz, c], k) => b.geo(G.sph(0.05, 6, 4), c, [x, y + 0.1 + (k === 3 ? 0.055 : 0), zz]));
    [[0.2, 0.1], [0.23, 0.07], [0.215, 0.05], [0.245, 0.1]].forEach(([x, dy]) => b.oct(0.03, '#5a2a6a', [x, y + dy + 0.02, 0.25]));
    // botella, queso y vela
    b.lathe([[0, 0], [0.05, 0.005], [0.055, 0.03], [0.055, 0.17], [0.02, 0.25], [0.02, 0.31], [0.027, 0.32]], 6, '#24402c', [0.44, y, 0.14]); b.cyl(0.018, 0.018, 0.03, 6, PINE, [0.44, y + 0.33, 0.14]);
    b.box(0.2, 0.015, 0.14, WOOD_L, [0.5, y + 0.008, 0.3], [0, 0.2, 0]); b.geo(G.cyl(0.09, 0.09, 0.06, 3), '#d8b040', [0.5, y + 0.046, 0.3], [0, 0.6, 0], [1, 1, 0.7]);
    palmatoria(b, 0.69, y, 0.15, 0.17 + rnd() * 0.06);
    b.light(0.6, y + 0.4, 0.25, FLAME, 0.6, 3.4);
  });

  DECO.add('aparador', { slot: 'wall', tags: ['salon', 'taberna', 'celdas', 'archivo', 'capilla', 'biblioteca'] }, (b, rnd) => {
    const W = 1.4, D = 0.33, y = 0.9, col = b.vary(WOOD_D, 0.1);
    b.box(W, y - 0.14, D, col, [0, (y - 0.14) / 2 + 0.09, D / 2]);
    [-1, 1].forEach((sx) => [0.06, D - 0.06].forEach((zz) => b.box(0.1, 0.09, 0.1, WOOD_D, [sx * (W / 2 - 0.07), 0.045, zz])));
    b.box(W + 0.04, 0.03, D + 0.03, WOOD, [0, 0.105, (D + 0.03) / 2]);
    b.box(W + 0.08, 0.05, D + 0.055, WOOD, [0, y - 0.025, (D + 0.055) / 2]);
    [-0.45, 0, 0.45].forEach((x, k) => {
      b.box(0.41, 0.6, 0.016, WOOD, [x, 0.48, D + 0.008]); b.box(0.29, 0.46, 0.008, col, [x, 0.48, D + 0.02]);
      b.oct(0.05, WOOD, [x, 0.48, D + 0.024], null, [1, 1.6, 0.2]);
      [0.26, 0.7].forEach((yy) => b.box(0.15, 0.03, 0.008, IRON, [x - 0.13, yy, D + 0.022], null, 'x'));                           // bisagras
      b.geo(G.tor(0.03, 0.008, 4, 8), BRASS, [x + 0.16, 0.47, D + 0.024], null, null, 'x');                                      // tirador
    });
    // encima: plato de pie, candelero, arqueta y paños
    b.cyl(0.15, 0.15, 0.02, 10, '#8f9499', [-0.45, y + 0.15, 0.04], [H - 0.12, 0, 0], 'm', { ao: 0 }); b.cyl(0.09, 0.09, 0.024, 10, '#b4b8bc', [-0.45, y + 0.15, 0.045], [H - 0.12, 0, 0], 'm', { ao: 0 });
    b.lathe([[0.06, 0], [0.02, 0.03], [0.015, 0.12], [0.035, 0.15], [0.04, 0.17]], 6, BRASS, [-0.12, y, 0.18], null, 'x'); vela(b, -0.12, y + 0.17, 0.18, 0.14, false);
    b.box(0.26, 0.12, 0.17, WOOD, [0.2, y + 0.06, 0.18], [0, -0.15, 0]); b.geo(mediaCana(0.085, 0.26), WOOD, [0.2, y + 0.12, 0.18], [0, -0.15, 0]); b.box(0.04, 0.06, 0.01, BRASS, [0.212, y + 0.1, 0.268], [0, -0.15, 0], 'x');
    [LINEN, b.pick(TELAS), LINEN].forEach((c, k) => b.box(0.22 - k * 0.01, 0.03, 0.2, c, [0.54, y + 0.015 + k * 0.03, 0.18], [0, (rnd() - 0.5) * 0.2, 0], 'm', { ao: 0.1 }));
  });

  DECO.add('tonel_grande', { slot: 'wall', temas: ['crypt', 'forge'], tags: ['bodega', 'taberna', 'salon'] }, (b, rnd) => {
    const cy0 = 0.8, col = b.vary(WOOD, 0.1);
    // caballetes
    [0.07, 0.29].forEach((zz) => {
      b.box(1.3, 0.07, 0.07, WOOD_D, [0, 0.035, zz]);
      [-1, 1].forEach((s) => b.box(0.07, 0.56, 0.07, WOOD_D, [s * 0.5, 0.26, zz], [0, 0, -s * 0.5]));
      b.box(0.5, 0.09, 0.07, WOOD_D, [0, 0.215, zz]);
    });
    // cuba con la tapa de cara a la sala
    b.lathe([[0.5, 0], [0.55, 0.1], [0.565, 0.17], [0.55, 0.24], [0.5, 0.34], [0.46, 0.34], [0.46, 0.31], [0, 0.31]], 12, col, [0, cy0, 0], [H, 0, 0], 'm', { ao: 0.45 });
    [0.06, 0.28].forEach((zz) => b.cyl(0.548, 0.548, 0.04, 12, IRON, [0, cy0, zz], [H, 0, 0], 'x'));
    [-0.3, -0.15, 0, 0.15, 0.3].forEach((x) => bx(b, 0.012, Math.sqrt(0.46 * 0.46 - x * x) * 2 - 0.02, 0.006, WOOD_D, [x, cy0, 0.311], null, 'm', { ao: 0 }));
    b.box(0.86, 0.1, 0.02, WOOD_L, [0, cy0 + 0.02, 0.322]); [-0.34, 0.34].forEach((x) => b.oct(0.02, IRON, [x, cy0 + 0.02, 0.334], null, null, 'x'));
    // grifo, cubo y charquito
    b.cyl(0.022, 0.022, 0.08, 6, BRASS, [0, cy0 - 0.28, 0.35], [H, 0, 0], 'x'); b.cyl(0.016, 0.016, 0.06, 6, BRASS, [0, cy0 - 0.31, 0.375], null, 'x'); b.box(0.09, 0.016, 0.016, BRASS, [0, cy0 - 0.245, 0.36], null, 'x');
    b.lathe([[0, 0], [0.075, 0.005], [0.095, 0.16], [0.08, 0.16], [0.065, 0.03], [0, 0.03]], 8, PINE, [0.02, 0.07, 0.3]); b.cyl(0.091, 0.091, 0.02, 8, IRON, [0.02, 0.17, 0.3], null, 'x');
    b.cyl(0.07, 0.07, 0.01, 8, '#5a1626', [0.02, 0.2, 0.3], null, 'm', { ao: 0 });
    b.cyl(0.03, 0.03, 0.03, 6, PINE, [0, cy0 + 0.565, 0.17]);
  });

  DECO.add('cajas_apiladas', { slot: 'wall', tags: ['bodega', 'mina', 'fragua', 'armeria', 'guardia', 'pasillo', 'taberna', 'barracon'] }, (b, rnd) => {
    b.at([-0.42, 0, 0.185], [0, 0.03, 0], (b) => { caja(b, 0.74, 0.56, 0.3); b.box(0.16, 0.1, 0.006, PARCH, [-0.1, 0.3, 0.158], [0, 0, 0.1], 'm', { ao: 0 }); });
    b.at([0.36, 0, 0.185], [0, -0.04, 0], (b) => {
      caja(b, 0.6, 0.44, 0.3);
      // caja abierta: paja y botellas
      b.box(0.5, 0.02, 0.22, STRAW, [0, 0.45, 0], null, 'm', { ao: 0 });
      [[-0.15, -0.03], [0.02, 0.04], [0.17, -0.02]].forEach(([x, zz], k) => { b.cyl(0.02, 0.05, 0.16, 6, ['#24402c', '#4a2a1a', '#24402c'][k], [x, 0.5, zz]); b.cyl(0.017, 0.017, 0.03, 6, PINE, [x, 0.59, zz]); });
    });
    b.at([-0.4 + rnd() * 0.1, 0.572, 0.18], [0, 0.08 * (rnd() < 0.5 ? -1 : 1), 0], (b) => {
      caja(b, 0.5, 0.4, 0.27);
      b.geo(G.tor(0.09, 0.022, 4, 10), STRAW, [0.04, 0.43, 0], [H, 0, 0], null, 'm', { ao: 0 }); b.geo(G.tor(0.085, 0.022, 4, 10), '#9a8040', [0.04, 0.462, 0], [H, 0.5, 0], null, 'm', { ao: 0 });   // cuerda
    });
  });

  DECO.add('sacos', { slot: 'wall', temas: ['crypt', 'forge'], tags: ['bodega', 'mina', 'taberna', 'fragua', 'barracon'] }, (b, rnd) => {
    saco(b, [-0.55, 0, 0.21], [-0.06, rnd(), 0.06], [1.0, 1.1, 0.8]);
    saco(b, [-0.12, 0, 0.2], [0, rnd(), 0], [1.0, 1.0, 0.86], true);
    saco(b, [0.33, 0, 0.21], [-0.05, rnd(), -0.05], [1.1, 1.2, 0.78]);
    saco(b, [0.68, 0, 0.2], [0, rnd(), -0.1], [0.78, 0.8, 0.85]);
    saco(b, [-0.1, 0.62, 0.17], [0.0, 0, H], [0.8, 0.95, 0.75]);                                // uno tumbado encima
    // pala de madera en el saco abierto y grano caído
    palo(b, [-0.1, 0.4, 0.22], [0.02, 0.56, 0.3], 0.014, WOOD_L); b.box(0.08, 0.02, 0.1, WOOD_L, [-0.12, 0.41, 0.2], [0.3, 0.5, 0]);
    b.geo(disco(), '#c9a24a', [0.1, 0.006, 0.33], null, [0.12, 1, 0.06], 'm', { ao: 0 });
  });

  DECO.add('baul', { slot: 'wall', tags: ['celdas', 'barracon', 'tesoro', 'guardia', 'armeria', 'salon', 'archivo'] }, (b, rnd) => {
    const W = 1.0, col = b.vary(WOOD_D, 0.12), z = 0.2;
    b.box(W, 0.32, 0.33, col, [0, 0.2, z]); [-1, 1].forEach((s) => b.box(0.1, 0.04, 0.35, IRON, [s * 0.42, 0.02, z], null, 'x'));
    b.geo(mediaCana(0.165, W), b.vary(WOOD, 0.1), [0, 0.375, z]); b.box(W + 0.02, 0.03, 0.35, IRON, [0, 0.365, z], null, 'x');
    [0.14, 0.26].forEach((y) => b.box(W - 0.02, 0.008, 0.004, SOOT, [0, y, z + 0.166], null, 'm', { ao: 0 }));
    [-0.4, 0, 0.4].forEach((x) => { b.box(0.075, 0.33, 0.012, IRON, [x, 0.2, z + 0.17], null, 'x'); b.geo(mediaCana(0.173, 0.075), IRON, [x, 0.375, z], null, null, 'x'); [0.1, 0.3].forEach((y) => b.oct(0.014, STEEL, [x, y, z + 0.178], null, null, 'x')); });
    b.box(0.13, 0.13, 0.014, BRASS, [0, 0.31, z + 0.18], null, 'x'); b.box(0.02, 0.045, 0.016, SOOT, [0, 0.3, z + 0.181]);
    [-1, 1].forEach((s) => b.geo(G.tor(0.05, 0.011, 4, 8), IRON, [s * (W / 2 + 0.012), 0.24, z], [0, H, 0], null, 'x'));
  });

  DECO.add('chimenea', { slot: 'wall', temas: ['crypt', 'forge'], tags: ['salon', 'taberna', 'guardia', 'barracon', 'celdas', 'archivo'] }, (b, rnd) => {
    b.box(1.56, 0.06, 0.39, STONE_D, [0, 0.03, 0.2]);
    b.box(1.1, 1.0, 0.04, SOOT, [0, 0.55, 0.02]);
    [-1, 1].forEach((s) => {
      for (let k = 0; k < 4; k++) b.box(0.27 + (k % 2) * 0.03, 0.235, 0.34 + (k % 2) * 0.02, b.vary(STONE, 0.14), [s * 0.66, 0.18 + k * 0.24, 0.18 + (k % 2) * 0.01]);
      b.box(0.52, 0.2, 0.37, b.vary(STONE, 0.12), [s * 0.44, 1.11, 0.19]);
    });
    b.box(0.32, 0.25, 0.39, STONE_L, [0, 1.1, 0.2]); b.oct(0.06, BRASS, [0, 1.1, 0.392], null, [1, 1.2, 0.2], 'x');
    b.box(1.76, 0.07, 0.4, STONE_L, [0, 1.245, 0.2]);
    b.at([0, 1.28, 0.15], null, (b) => b.geo(G.cyl(0.58, 0.97, 0.64, 4), b.vary(STONE, 0.08), [0, 0.32, 0], [0, PI / 4, 0], null, 'm', { ao: 0.3 }), [1, 1, 0.215]);   // campana
    b.box(0.86, 0.06, 0.2, STONE_D, [0, 1.95, 0.1]); b.box(0.74, 0.1, 0.16, b.vary(STONE, 0.08), [0, 2.03, 0.08]);
    [-0.33, 0, 0.33].forEach((x) => b.box(0.3, 0.012, 0.01, STONE_D, [x * 0.9, 1.5, 0.275 - 0.0, ], [-0.12, 0, 0], 'm', { ao: 0 }));
    // leños, brasas y morillos
    [[-0.08, 0.13, 0.2, 0.2], [0.1, 0.13, 0.26, -0.25], [0, 0.23, 0.22, 0.05]].forEach(([x, y, zz, ry]) => { b.cyl(0.06, 0.065, 0.56, 6, '#3a2616', [x, y, zz], [0, ry, H]); });
    [[-0.2, 0.09, 0.3], [0.05, 0.1, 0.33], [0.22, 0.09, 0.3], [-0.05, 0.17, 0.2], [0.14, 0.2, 0.24], [-0.26, 0.1, 0.16], [0.3, 0.1, 0.18]].forEach(([x, y, zz], k) => b.dode(0.04 + (k % 3) * 0.012, k % 2 ? '#ff7a1a' : '#e03a0a', [x, y, zz], [k, k * 2, 0], null, 'g', { k: k % 2 ? 2.4 : 1.6 }));
    b.geo(disco(), '#55504a', [0, 0.062, 0.24], null, [0.5, 1, 0.14], 'm', { ao: 0 });
    [-1, 1].forEach((s) => { b.cyl(0.018, 0.022, 0.3, 6, IRON, [s * 0.4, 0.21, 0.35], null, 'x'); b.oct(0.035, BRASS, [s * 0.4, 0.38, 0.35], null, null, 'x'); });
    palo(b, [0.84, 0.06, 0.36], [0.8, 0.95, 0.38], 0.012, IRON, 'x');                           // atizador
    // repisa: velas, jarrita y plato
    vela(b, -0.74, 1.28, 0.34, 0.14, false); vela(b, 0.72, 1.28, 0.34, 0.1, false);
    b.lathe([[0, 0], [0.04, 0.004], [0.05, 0.05], [0.03, 0.1], [0.038, 0.13]], 6, CLAY, [-0.52, 1.28, 0.34]);
    b.cyl(0.06, 0.04, 0.015, 8, PEWTER, [0.5, 1.288, 0.34], null, 'x');
    b.light(0, 0.5, 0.45, '#ff8a3a', 1.2, 6); b.flame(0, 0.42, 0.24, 0.6, 0.62);
  });

  DECO.add('estatua_pared', { slot: 'wall', tags: ['capilla', 'santuario', 'pasillo', 'salon', 'osario', 'espejos', 'jardin', 'observatorio', 'biblioteca'] }, (b, rnd, o) => {
    const sabio = o.sabio != null ? !!o.sabio : rnd() < 0.5, z = 0.2, st = b.vary(STONE_L, 0.06), y0 = 0.6;
    b.box(0.66, 0.12, 0.38, STONE_D, [0, 0.06, z]); b.box(0.52, 0.4, 0.31, STONE, [0, 0.32, z]); b.box(0.62, 0.08, 0.36, STONE_D, [0, 0.56, z]);
    b.box(0.3, 0.14, 0.012, BRASS, [0, 0.33, z + 0.158], null, 'x');
    b.geo(G.lathe([[0.19, 0], [0.18, 0.08], [0.13, 0.45], [0.135, 0.62], [0.17, 0.76], [0.15, 0.85], [0.06, 0.9]], 8), st, [0, y0, z], null, [1, 1, 0.78], 'm', { ao: 0.4 });
    [-1, 1].forEach((s) => bola(b, 0.075, st, [s * 0.17, y0 + 0.78, z], [1, 0.9, 0.9]));
    bola(b, 0.088, st, [0, y0 + 0.98, z + 0.01], [0.95, 1.1, 0.95]);
    if (sabio) {
      b.geo(G.sph(0.11, 7, 5), st, [0, y0 + 1.0, z - 0.03], null, [1.02, 1.12, 0.95]);                                       // capucha
      b.geo(G.cone(0.065, 0.2, 5), st, [0, y0 + 0.83, z + 0.09], [PI, 0, 0], [1, 1, 0.5]);                                  // barba
      [-1, 1].forEach((s) => palo(b, [s * 0.2, y0 + 0.76, z + 0.02], [s * 0.08, y0 + 0.52, z + 0.13], 0.042, st));
      b.at([0, y0 + 0.53, z + 0.14], [0.5, 0, 0], (b) => { b.box(0.24, 0.03, 0.15, st, [0, 0, 0]); b.box(0.008, 0.034, 0.15, STONE_D, [0, 0, 0]); });   // libro
    } else {
      b.lathe([[0.095, 0], [0.105, 0.05], [0.09, 0.12], [0, 0.16]], 8, st, [0, y0 + 1.0, z + 0.01]); b.box(0.02, 0.1, 0.03, st, [0, y0 + 0.98, z + 0.1]);
      b.geo(G.sph(0.05, 7, 5), st, [0, y0 + 1.17, z - 0.01], null, [0.4, 1, 1.6]);                                          // cimera
      [-1, 1].forEach((s) => palo(b, [s * 0.2, y0 + 0.76, z + 0.02], [s * 0.035, y0 + 0.47, z + 0.13], 0.042, st));
      b.box(0.045, 0.46, 0.022, st, [0, y0 + 0.22, z + 0.15]); b.box(0.18, 0.035, 0.035, st, [0, y0 + 0.45, z + 0.15]); bola(b, 0.03, st, [0, y0 + 0.55, z + 0.15]);   // espada
      b.geo(G.cyl(0.15, 0.19, 0.6, 6), st, [0, y0 + 0.5, z - 0.07], null, [1.25, 1, 0.3], 'm', { ao: 0.4 });                // capa
    }
    [[-0.26, 0.61, 0.33], [0.2, 0.125, 0.37], [0.24, 0.61, 0.08]].forEach(([x, y, zz], k) => b.dode(0.045, '#4a5a34', [x, y, zz], [k, k, 0], [1.3, 0.35, 1]));   // musgo
  });

  DECO.add('fuente_pared', { slot: 'wall', tags: ['jardin', 'capilla', 'salon', 'pasillo', 'santuario', 'taberna', 'espejos'] }, (b, rnd) => {
    const st = b.vary(STONE, 0.08), agua = '#3a8ad0';
    b.box(0.96, 1.5, 0.08, st, [0, 0.75, 0.04]); b.cyl(0.48, 0.48, 0.07, 14, st, [0, 1.5, 0.035], [H, 0, 0], 'm', { ao: 0 });
    b.box(0.62, 0.86, 0.012, '#24465a', [0, 1.1, 0.086], null, 'm', { ao: 0.1 }); b.cyl(0.31, 0.31, 0.012, 12, '#2c5670', [0, 1.52, 0.076], [H, 0, 0], 'm', { ao: 0 });
    for (let k = 0; k < 6; k++) b.box(0.07, 0.07, 0.004, k % 2 ? '#3a7a9a' : '#c9b56a', [-0.22 + (k % 3) * 0.22, 1.42 - Math.floor(k / 3) * 0.6, 0.094], [0, 0, PI / 4], 'm', { ao: 0 });
    [-1, 1].forEach((s) => { b.box(0.12, 1.5, 0.12, STONE_D, [s * 0.46, 0.75, 0.06]); b.oct(0.07, STONE_L, [s * 0.46, 1.56, 0.06]); });
    // mascarón y caño
    b.dode(0.12, STONE_L, [0, 1.16, 0.12], [0.3, 0, 0], [1.1, 1.1, 0.6]); b.cyl(0.028, 0.028, 0.12, 6, BRASS, [0, 1.12, 0.2], [H, 0, 0], 'x');
    [-1, 1].forEach((s) => b.oct(0.022, SOOT, [s * 0.045, 1.2, 0.185]));
    palo(b, [0, 1.12, 0.26], [0, 0.63, 0.3], 0.014, '#8fd0ff', 'g', 5);
    // pila semicircular con agua
    const P = [[0.13, 0.3], [0.3, 0.38], [0.375, 0.52], [0.39, 0.64], [0.39, 0.69], [0.34, 0.69], [0.32, 0.6], [0, 0.57]];
    b.geo(medioTorno(P, 10), b.vary(STONE_L, 0.06), [0, 0, 0.005], null, null, 'm', { ao: 0.4 });
    b.geo(medioTorno([[0.19, 0], [0.15, 0.06], [0.11, 0.26], [0.14, 0.31]], 8), STONE_D, [0, 0, 0.005]);
    b.geo(G.k('mmdisco', [], () => { const g = new THREE.CircleGeometry(1, 12, PI, PI); g.rotateX(-H); return g; }), agua, [0, 0.63, 0.005], null, [0.335, 1, 0.335], 'g', { k: 0.85 });
    b.geo(disco(), '#a8e0ff', [0, 0.634, 0.3], null, [0.06, 1, 0.04], 'g', { k: 1.2 });
    b.dode(0.05, '#4a5a34', [-0.3, 0.7, 0.2], null, [1.4, 0.3, 1]); b.dode(0.04, '#4a5a34', [0.42, 0.02, 0.2], null, [1.4, 0.4, 1]);
    b.light(0, 0.95, 0.4, '#5aa8ff', 0.5, 3.2);
  });

  DECO.add('perchero_capas', { slot: 'wall', tags: ['celdas', 'barracon', 'guardia', 'taberna', 'archivo', 'biblioteca', 'salon'] }, (b, rnd) => {
    b.box(1.6, 0.12, 0.04, b.vary(WOOD, 0.1), [0, 1.78, 0.02]); b.box(1.6, 0.02, 0.05, WOOD_D, [0, 1.85, 0.025]);
    const xs = [-0.62, -0.31, 0, 0.31, 0.62];
    xs.forEach((x) => { b.cyl(0.018, 0.018, 0.13, 6, WOOD_D, [x, 1.78, 0.1], [H, 0, 0]); b.oct(0.028, WOOD_D, [x, 1.78, 0.17]); });
    const capa = (x, col, len, rb, capucha, ribete) => b.at([x, 1.76, 0.12], null, (b) => {
      b.geo(G.cyl(0.05, rb, 1, 7), col, [0, -len / 2, 0], [0, rnd(), 0], [1, len, 0.5], 'm', { ao: 0.45 });
      if (ribete) b.geo(G.cyl(rb + 0.004, rb + 0.006, 0.035, 7), ribete, [0, -len + 0.02, 0], null, [1, 1, 0.5], 'm', { ao: 0 });
      if (capucha) b.geo(G.sph(0.085, 7, 5), col, [0, -0.1, 0.03], null, [1.1, 1.5, 0.7], 'm', { ao: 0.3 });
    });
    const cs = TELAS.slice().sort(() => rnd() - 0.5);
    capa(xs[0], cs[0], 1.25, 0.17, true, BRASS); capa(xs[1], cs[1], 0.85, 0.15, true); capa(xs[3], cs[2], 1.05, 0.16, false, PARCH_D);
    b.box(0.3, 0.04, 0.012, WOOD_D, [xs[3], 1.2, 0.2], null, 'm', { ao: 0 }); b.box(0.04, 0.05, 0.016, BRASS, [xs[3], 1.2, 0.2], null, 'x');   // cinturón de la túnica
    // sombrero en la percha del centro y zurrón en la última
    b.cyl(0.19, 0.2, 0.02, 9, '#4a3a26', [0, 1.7, 0.16], [H - 0.3, 0, 0]); b.geo(G.cone(0.1, 0.2, 7), '#4a3a26', [0, 1.73, 0.25], [H - 0.3, 0, 0]); b.geo(G.cone(0.02, 0.2, 4), '#b03a26', [0.1, 1.8, 0.2], [0, 0, -0.6], [1, 1, 0.3], 'm', { ao: 0 });
    palo(b, [xs[4], 1.78, 0.14], [xs[4] - 0.08, 1.3, 0.12], 0.01, '#3a2a1c'); palo(b, [xs[4], 1.78, 0.14], [xs[4] + 0.08, 1.3, 0.12], 0.01, '#3a2a1c');
    b.box(0.26, 0.22, 0.1, '#6a4a2a', [xs[4], 1.2, 0.11], null, 'm', { ao: 0.35 }); b.box(0.27, 0.11, 0.012, '#553820', [xs[4], 1.26, 0.166]); b.oct(0.018, BRASS, [xs[4], 1.21, 0.175], null, null, 'x');
    // botas y bastón
    [0.22, 0.38].forEach((x, k) => { b.box(0.09, 0.07, 0.2, '#3a2a1c', [x, 0.035, 0.16], [0, k ? 0.2 : -0.1, 0]); b.cyl(0.05, 0.045, 0.24, 6, '#3a2a1c', [x - (k ? 0.012 : -0.006), 0.17, 0.1]); b.cyl(0.056, 0.056, 0.04, 6, '#5a4028', [x - (k ? 0.012 : -0.006), 0.28, 0.1]); });
    palo(b, [-0.86, 0, 0.3], [-0.84, 1.55, 0.06], 0.02, WOOD_L); b.dode(0.04, WOOD_L, [-0.84, 1.57, 0.06]);
  });

  DECO.add('mapa_mesa', { slot: 'wall', tags: ['guardia', 'archivo', 'observatorio', 'biblioteca', 'salon', 'armeria'] }, (b, rnd) => {
    const W = 1.56, D = 0.37, y = 0.78, z = D / 2 + 0.01;
    mesa(b, W, D, y, b.vary(WOOD, 0.08));
    // mapa que cuelga por delante y se enrolla a la izquierda
    b.box(1.02, 0.006, D - 0.01, PARCH, [-0.02, y + 0.003, z + 0.008], null, 'm', { ao: 0 }); b.box(1.02, 0.13, 0.006, PARCH, [-0.02, y - 0.06, D + 0.016], null, 'm', { ao: 0.3 });
    b.cyl(0.03, 0.03, D, 6, PARCH_D, [-0.55, y + 0.03, z], [H, 0, 0]);
    const p = (w, d, c, x, zz, r) => b.plane(w, d, c, [x, y + 0.0075, zz], r);
    p(0.3, 0.14, '#4a7a9a', 0.3, 0.14, 0.2); p(0.22, 0.12, '#4a7a9a', 0.12, 0.12, -0.3); p(0.5, 0.03, '#4a7a9a', -0.15, 0.2, 0.35);       // mar y río
    p(0.16, 0.12, '#5a7a3a', -0.3, 0.1, 0.3); p(0.13, 0.1, '#5a7a3a', -0.05, 0.3, -0.2); p(0.12, 0.09, '#5a7a3a', 0.36, 0.29, 0.5);     // bosques
    [[-0.38, 0.27], [-0.32, 0.29], [-0.27, 0.26]].forEach(([x, zz]) => b.geo(G.cone(0.03, 0.035, 4), '#7a5a3a', [x, y + 0.024, zz]));    // montañas
    [[-0.2, 0.33], [-0.12, 0.3], [-0.03, 0.22], [0.06, 0.2], [0.15, 0.24]].forEach(([x, zz]) => p(0.022, 0.022, '#8a1c1c', x, zz, 0.6));
    p(0.07, 0.018, '#8a1c1c', 0.24, 0.26, PI / 4); p(0.07, 0.018, '#8a1c1c', 0.24, 0.26, -PI / 4);
    // compás, lupa, piedras, regla y velas
    [[0.02, 0.13], [0.1, 0.17]].forEach(([x, zz]) => palo(b, [x, y + 0.008, zz], [0.06, y + 0.2, 0.15], 0.008, STEEL, 'x', 4)); b.oct(0.022, BRASS, [0.06, y + 0.205, 0.15], null, null, 'x');
    b.geo(G.tor(0.05, 0.01, 4, 10), BRASS, [0.4, y + 0.016, 0.2], [H, 0, 0], null, 'x'); b.cyl(0.012, 0.012, 0.1, 5, WOOD_D, [0.49, y + 0.016, 0.24], [H, 1.15, 0]);
    [[-0.47, 0.33], [0.46, 0.33], [0.46, 0.06]].forEach(([x, zz], k) => b.dode(0.035, STONE_D, [x, y + 0.03, zz], [k, k, 0], [1, 0.7, 1]));
    b.box(0.4, 0.008, 0.035, WOOD_L, [-0.2, y + 0.012, 0.06], [0, 0.05, 0], 'm', { ao: 0 });
    palmatoria(b, 0.68, y, 0.12, 0.2); palmatoria(b, -0.7, y, 0.28, 0.12);
    rollo(b, [0.66, y + 0.035, 0.29], [H, 0, 0.3], 0.16, 0.032, BLUE);
    b.light(0.6, y + 0.4, 0.25, FLAME, 0.55, 3.2); b.light(-0.65, y + 0.35, 0.3, FLAME, 0.4, 2.6);
  });
})();
