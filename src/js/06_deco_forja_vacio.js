/* Atrezo propio de dos lugares:
   · la Forja de Karak-Azkul ('forge'): piedra rojiza, hierro y cobre, fuego y metal al rojo;
   · el Ojo de Cristal ('void'): piedra violeta, latón, cristal y luz violeta y cian. */
(() => {
  const PI = Math.PI, H = PI / 2;
  /* ---------- paleta de la forja ---------- */
  const WOOD = '#6a4526', WOOD_D = '#4a2f1a', WOOD_L = '#8a6238', IRON = '#3a3632', IRON_L = '#807e7a', STEEL = '#a8acb4', COPPER = '#c4702e', BRASS = '#b08a3e', GOLD = '#dcae3e';
  const ROCK = '#6e4a3e', ROCK_D = '#4a302a', ROCK_L = '#8c6454', STONE = '#7c7068', COAL = '#201d1f', LEATHER = '#5e3b22', LEATHER_L = '#80562f', HIDE = '#b89a6a', BONE = '#d8cdb0', RED = '#6a1f24', ROPE = '#9a8458';
  const EMBER = '#ff5a14', HOT = '#ffa030';
  /* ---------- paleta del Ojo de Cristal ---------- */
  const VS = '#463c62', VS_D = '#2c2542', VS_L = '#62577e', NIGHT = '#15143a', VELVET = '#44246a', SILVER = '#a6aabc', VWOOD = '#35263c';
  const VIO = '#a866ff', CYAN = '#5ad8ff', MAG = '#ff6ad0', AMBER = '#ffc050', BLUEFL = '#8fa8ff';

  /* ---------- utilidades de color ---------- */
  const _c = new THREE.Color();
  const C = (col) => (Array.isArray(col) ? col : (_c.set(col), [_c.r, _c.g, _c.b]));
  const mul = (col, f) => C(col).map((v) => v * f);
  const mix = (a, c, t) => { const p = C(a), q = C(c); return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t]; };

  /* ---------- formas de apoyo ---------- */
  /* Plano vertical que mira a +z (pintura, marcas, brillos de pared) */
  const vp = (b, w, h, col, pos, rz, kind, o) => b.geo(G.k('fvp', [], () => new THREE.PlaneGeometry(1, 1)), col, pos, rz ? [0, 0, rz] : null, [w, h, 1], kind, Object.assign({ ao: 0 }, o));
  /* Trazo recto entre dos puntos del plano xy (runas, líneas de constelación) */
  const seg = (b, x1, y1, x2, y2, t, col, kind, o) => vp(b, Math.hypot(x2 - x1, y2 - y1) + t * 0.5, t, col, [(x1 + x2) / 2, (y1 + y2) / 2, 0], Math.atan2(y2 - y1, x2 - x1), kind, o);
  /* Caja, cilindro y bola de medida libre (no llenan la caché de geometrías cuando la medida es al azar) */
  const bx = (b, w, h, d, col, pos, rot, kind, o) => b.geo(G.box(1, 1, 1), col, pos, rot, [w, h, d], kind, o || {});
  const ball = (b, r, col, pos, sc, kind, o) => b.geo(G.sph(1, 7, 5), col, pos, null, sc ? [r * sc[0], r * sc[1], r * sc[2]] : r, kind, o || {});
  const ring = (b, r, t, col, pos, rot, kind, o, ts, arc) => b.geo(G.tor(r, t, 4, ts || 10, arc || PI * 2), col, pos, rot, null, kind, o || {});
  /* Barra entre dos puntos del espacio (patas, brazos, cadenas): r1 en p, r2 en q */
  const _d = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion(), _e = new THREE.Euler();
  const rod = (b, p, q, r1, r2, col, kind, sg, o) => {
    _d.set(q[0] - p[0], q[1] - p[1], q[2] - p[2]); const L = _d.length(); _q.setFromUnitVectors(_up, _d.normalize()); _e.setFromQuaternion(_q);
    return b.geo(G.cyl(r2, r1, 1, sg || 6), col, [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2], [_e.x, _e.y, _e.z], [1, L, 1], kind, o || {});
  };
  /* Caja que se estrecha (o se ensancha) hacia arriba: lingotes, campanas, plintos, obeliscos */
  const tap = (b, w, h, d, tx, tz, col, pos, rot, kind, o) => b.geo(G.k('ftap', [w, h, d, tx, tz], () => {
    const g = new THREE.BoxGeometry(w, h, d), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) { p.setX(i, p.getX(i) * tx); p.setZ(i, p.getZ(i) * tz); }
    g.computeVertexNormals(); return g;
  }), col, pos, rot, null, kind, o || {});
  /* Silueta plana con grosor (en el plano xy, centrada en z): hojas de hacha, yunques, engranajes */
  const ext = (name, pts, d, holes) => G.k('fx' + name, [d], () => {
    const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    (holes || []).forEach((h) => s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y)))));
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 1 }); g.translate(0, 0, -d / 2); return g;
  });
  /* Silueta plana sin grosor, disco y corona (miran a +z) */
  const shp = (name, pts) => G.k('fs' + name, [], () => new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)))));
  const fdisc = (b, r, col, pos, kind, o, sg) => b.geo(G.k('fdisc', [sg || 10], () => new THREE.CircleGeometry(1, sg || 10)), col, pos, null, [r, r, 1], kind, Object.assign({ ao: 0 }, o));
  const fring = (b, r0, r1, col, pos, rz, kind, o, sg, arc) => b.geo(G.k('fring', [r0, r1, sg || 16, arc || 0], () => new THREE.RingGeometry(r0, r1, sg || 16, 1, 0, arc || PI * 2)), col, pos, rz ? [0, 0, rz] : null, null, kind, Object.assign({ ao: 0 }, o));
  /* Todo lo que se dibuje dentro (pensado en el plano xy) queda tumbado en el suelo a la altura y */
  const onFloor = (b, y, fn, ry) => b.at([0, y, 0], ry ? [0, ry, 0] : null, () => b.at([0, 0, 0], [-H, 0, 0], fn));
  /* Tumba una herramienta dibujada de pie (mango hacia +y) sobre una superficie, apuntando según ang */
  const lay = (b, pos, ang, fn) => b.at(pos, [0, ang, 0], () => b.at([0, 0, 0], [-H, 0, -H], fn));

  /* ---------- runas enanas (trazos rectos en un cuadro de −0.5 a 0.5) ---------- */
  const RUNAS = [
    [[0, -0.5, 0, 0.5], [0, 0.5, 0.3, 0.22], [0.3, 0.22, 0, -0.05]],
    [[-0.2, -0.5, -0.2, 0.5], [-0.2, 0.5, 0.28, 0.22], [-0.2, 0.12, 0.28, -0.16]],
    [[0, -0.5, 0, 0.5], [-0.3, 0.18, 0, 0.5], [0.3, 0.18, 0, 0.5]],
    [[-0.25, -0.5, -0.25, 0.5], [0.25, -0.5, 0.25, 0.5], [-0.25, 0.22, 0.25, -0.22]],
    [[0, -0.5, 0, 0.5], [-0.28, -0.28, 0.28, 0.28], [-0.28, 0.28, 0.28, -0.28]],
    [[-0.3, -0.5, 0.3, 0.5], [0.3, -0.5, -0.3, 0.5], [-0.3, 0.5, 0.3, 0.5]],
    [[0, -0.5, 0, 0.5], [0, 0.5, 0.28, 0.25], [0.28, 0.25, 0, 0], [0, 0, 0.28, -0.25], [0.28, -0.25, 0, -0.5]],
    [[-0.28, -0.5, -0.28, 0.5], [-0.28, 0.5, 0.28, 0], [0.28, 0, -0.28, -0.5]]
  ];
  const runa = (b, i, s, col, pos, kind, o, t) => b.at(pos, null, () => RUNAS[((i % 8) + 8) % 8].forEach(([x1, y1, x2, y2]) => seg(b, x1 * s, y1 * s, x2 * s, y2 * s, t || s * 0.15, col, kind || 'g', o)));

  /* ---------- piezas pequeñas que se repiten en la forja ---------- */
  const HOJA = [[0, -0.05], [0.09, -0.07], [0.2, -0.17], [0.245, -0.06], [0.25, 0.05], [0.2, 0.17], [0.09, 0.07], [0, 0.05]];
  /* Martillo de pie (mango hacia arriba, cabeza en lo alto) */
  const hammer = (b, L, hw, col) => { b.cyl(0.02, 0.024, L, 6, WOOD_L, [0, L / 2, 0]); b.box(hw, hw * 0.52, hw * 0.52, col || IRON_L, [0, L, 0], null, 'x'); };
  /* Martillo de guerra enano: cabeza ancha con cantoneras de latón */
  const warHammer = (b, L) => {
    b.cyl(0.026, 0.03, L, 6, WOOD_D, [0, L / 2, 0]); b.cyl(0.036, 0.036, 0.05, 6, BRASS, [0, 0.03, 0], null, 'x');
    b.box(0.34, 0.17, 0.15, IRON_L, [0, L, 0], null, 'x'); [-1, 1].forEach((s) => b.box(0.04, 0.2, 0.18, BRASS, [s * 0.15, L, 0], null, 'x'));
    b.cyl(0.03, 0.03, 0.06, 6, BRASS, [0, L + 0.11, 0], null, 'x');
  };
  /* Hacha de pie; doble si dbl */
  const axe = (b, L, s, dbl) => {
    b.cyl(0.024, 0.028, L, 6, WOOD, [0, L / 2, 0]); b.cyl(0.034, 0.034, 0.05, 6, BRASS, [0, 0.03, 0], null, 'x');
    const g = ext('hoja', HOJA, 0.03);
    b.geo(g, STEEL, [0.01, L - 0.14 * s, 0], null, s, 'x'); if (dbl) b.geo(g, STEEL, [-0.01, L - 0.14 * s, 0], [0, PI, 0], s, 'x');
    b.box(0.07, 0.16 * s, 0.05, IRON, [0, L - 0.14 * s, 0], null, 'x'); b.cone(0.03, 0.09, 6, IRON_L, [0, L + 0.04, 0], null, 'x');
  };
  /* Tenazas de pie (bocas arriba) */
  const tongs = (b, L) => { [-1, 1].forEach((s) => { b.box(0.018, L, 0.018, IRON, [s * 0.025, L / 2, 0], [0, 0, s * 0.07], 'x'); b.box(0.02, 0.1, 0.02, IRON, [s * 0.012, L + 0.03, 0], [0, 0, -s * 0.25], 'x'); }); b.cyl(0.016, 0.016, 0.03, 6, IRON_L, [0, L * 0.8, 0], [H, 0, 0], 'x'); };
  /* Espada de pie (pomo abajo, punta arriba). hot: hoja al rojo */
  const sword = (b, L, hot) => {
    if (hot) { b.box(0.075, L - 0.2, 0.02, '#c02c08', [0, 0.2 + (L - 0.2) / 2, 0], null, 'g', { col2: '#ffc050', k: 1.8 }); b.cone(0.038, 0.09, 4, '#ffb040', [0, L + 0.04, 0], [0, PI / 4, 0], 'g', { k: 1.8 }); b.box(0.03, 0.2, 0.014, IRON, [0, 0.1, 0], null, 'x'); return; }
    b.box(0.065, L - 0.24, 0.014, STEEL, [0, 0.24 + (L - 0.24) / 2, 0], null, 'x'); b.cone(0.033, 0.08, 4, STEEL, [0, L + 0.035, 0], [0, PI / 4, 0], 'x');
    b.box(0.22, 0.035, 0.04, BRASS, [0, 0.22, 0], null, 'x'); b.cyl(0.02, 0.02, 0.17, 6, LEATHER, [0, 0.12, 0]); ball(b, 0.035, BRASS, [0, 0.025, 0], null, 'x');
  };
  /* Jarra con asa y espuma */
  const mug = (b, x, y, z, ry, col) => b.at([x, y, z], [0, ry || 0, 0], () => {
    b.cyl(0.05, 0.045, 0.11, 8, col || WOOD_L, [0, 0.055, 0]); b.cyl(0.052, 0.052, 0.015, 8, IRON_L, [0, 0.03, 0], null, 'x'); b.cyl(0.054, 0.054, 0.015, 8, IRON_L, [0, 0.095, 0], null, 'x');
    b.cyl(0.043, 0.043, 0.012, 8, '#e8dcc0', [0, 0.112, 0], null, 'm', { ao: 0 }); ring(b, 0.035, 0.01, IRON_L, [0.058, 0.058, 0], null, 'x', null, 6);
  });
  /* Lingote (a lo largo de x) */
  const ingot = (b, col, pos, ry) => tap(b, 0.3, 0.085, 0.14, 0.82, 0.62, col, pos, ry ? [0, ry, 0] : null, 'x', { ao: 0.12 });
  /* Tonel de pie con sus aros */
  const cask = (b, r, h, col) => {
    b.lathe([[r * 0.8, 0], [r * 0.97, h * 0.25], [r, h * 0.5], [r * 0.97, h * 0.75], [r * 0.8, h], [0, h]], 10, col || b.vary(WOOD), [0, 0, 0]);
    [0.2, 0.8].forEach((t) => b.cyl(r * 0.955, r * 0.955, h * 0.05, 10, IRON, [0, h * t, 0], null, 'x'));
    b.cyl(r * 0.74, r * 0.74, 0.012, 10, WOOD_D, [0, h + 0.004, 0]);
  };
  /* Roca de escombro */
  const rock = (b, r, col, x, y, z, rnd) => b.dode(1, col, [x, y, z], [rnd() * 3, rnd() * 3, rnd() * 3], r);
  /* Sillares de un arco de medio punto (centro cx, cy; radio medio R) y sus jambas */
  const arco = (b, cy, R, col, colK, dz, n) => {
    for (let k = 0; k < n; k++) { const a = PI * (k + 0.5) / n, key = k === (n - 1) / 2; b.box(PI * R / n * 1.22, key ? 0.32 : 0.26, dz, key ? colK : b.vary(col, 0.1), [Math.cos(a) * R, cy + Math.sin(a) * (R + (key ? 0.02 : 0)), dz / 2 + (key ? 0.01 : 0)], [0, 0, a - H]); }
  };

  /* ========================================================================
     FORJA DE KARAK-AZKUL · piezas de pared
     ======================================================================== */
  DECO.add('horno', { slot: 'wall', temas: ['forge'], tags: ['fragua', 'armeria', 'santuario'] }, (b) => {
    b.box(1.62, 1.5, 0.26, ROCK_D, [0, 0.75, 0.13]);
    [-1, 1].forEach((s) => { for (let k = 0; k < 4; k++) b.box(0.36 + (k % 2) * 0.04, 0.2, 0.38, b.vary(ROCK, 0.1), [s * (0.63 - (k % 2) * 0.02), 0.1 + k * 0.205, 0.19]); b.box(0.34, 0.6, 0.33, b.vary(ROCK, 0.08), [s * 0.64, 1.18, 0.165]); });
    arco(b, 0.82, 0.57, ROCK, ROCK_L, 0.38, 7);
    b.box(1.74, 0.1, 0.39, ROCK_L, [0, 1.55, 0.195]);
    tap(b, 1.5, 0.4, 0.38, 0.5, 0.75, ROCK, [0, 1.8, 0.19]); b.box(0.66, 0.09, 0.3, ROCK_D, [0, 2.045, 0.19]);
    // boca: hollín, fondo al rojo, brasas y rejilla
    b.box(0.92, 0.84, 0.012, '#150d0a', [0, 0.42, 0.266], null, 'm', { ao: 0 }); b.cyl(0.46, 0.46, 0.012, 12, '#150d0a', [0, 0.82, 0.266], [H, 0, 0], 'm', { ao: 0 });
    vp(b, 0.84, 0.74, '#ffb030', [0, 0.5, 0.275], 0, 'g', { col2: '#5a1004', k: 1.7 }); fdisc(b, 0.3, '#7a1a06', [0, 0.9, 0.276], 'g', { k: 1.2 }, 10);
    b.box(0.9, 0.12, 0.36, ROCK_D, [0, 0.06, 0.2]);
    [[-0.27, 0.2, COAL], [-0.1, 0.19, HOT], [0.08, 0.2, COAL], [0.25, 0.19, EMBER], [-0.18, 0.3, EMBER], [0.0, 0.31, COAL], [0.17, 0.3, HOT], [-0.02, 0.4, EMBER]].forEach(([x, y, c], i) => b.dode(0.085, c, [x, y, 0.3], [i, i * 2, 0], null, c === COAL ? 'm' : 'g', { k: 2 }));
    [-0.3, -0.1, 0.1, 0.3].forEach((x) => b.box(0.03, 0.42, 0.03, IRON, [x, 0.33, 0.385], null, 'x')); b.box(0.9, 0.04, 0.03, IRON, [0, 0.54, 0.385], null, 'x');
    runa(b, 2, 0.16, EMBER, [0, 1.42, 0.395], 'g', { k: 1.6 });
    b.light(0, 0.6, 0.7, '#ff7a2a', 1.2, 6); b.flame(0, 0.6, 0.33, 0.6, 0.62);
  });

  DECO.add('fuelle', { slot: 'wall', temas: ['forge'], tags: ['fragua', 'armeria'] }, (b) => {
    const PERA = [[-0.55, 0], [-0.47, -0.14], [-0.25, -0.19], [0.05, -0.16], [0.38, -0.06], [0.38, 0.06], [0.05, 0.16], [-0.25, 0.19], [-0.47, 0.14]], gp = ext('pera', PERA, 0.04);
    // caballete
    [-0.45, 0.12].forEach((x) => { [0.06, 0.34].forEach((z) => b.box(0.07, 0.7, 0.07, WOOD_D, [x, 0.35, z])); b.box(0.09, 0.07, 0.38, WOOD, [x, 0.69, 0.2]); });
    b.box(0.72, 0.06, 0.06, WOOD_D, [-0.165, 0.28, 0.2]);
    // tablas y pliegues de cuero, abiertos en abanico desde la tobera
    b.at([0.3, 0.75, 0.2], null, () => {
      for (let k = 0; k < 5; k++) b.at([0, 0, 0], [0, 0, -k * 0.085], () => {
        const tabla = k === 0 || k === 4;
        b.geo(gp, tabla ? b.vary(WOOD) : (k % 2 ? LEATHER : LEATHER_L), [-0.38, 0, 0], [-H, 0, 0], tabla ? 1 : [0.96, k % 2 ? 0.86 : 0.95, 2.2]);
        if (k === 4) {
          [1, 2, 3, 6, 7, 8].forEach((i) => ball(b, 0.018, BRASS, [PERA[i][0] * 0.9 - 0.38, 0.025, -PERA[i][1] * 0.86], null, 'x'));
          b.box(0.34, 0.035, 0.06, WOOD_D, [-1.0, 0.0, 0]); b.box(0.1, 0.03, 0.2, IRON, [-0.25, 0.025, 0], null, 'x');
        }
      });
      b.cyl(0.024, 0.06, 0.42, 6, IRON, [0.2, 0.02, 0], [0, 0, -H], 'x'); b.cyl(0.066, 0.066, 0.05, 6, BRASS, [0.02, 0.02, 0], [0, 0, -H], 'x');
    });
    // poste y palanca con su cadena
    b.box(0.08, 1.72, 0.08, WOOD_D, [-0.84, 0.86, 0.06]); b.box(0.12, 0.06, 0.1, IRON, [-0.84, 1.62, 0.07], null, 'x');
    b.box(1.0, 0.055, 0.055, WOOD, [-0.4, 1.66, 0.1], [0, 0, 0.1]); rod(b, [0.02, 1.7, 0.1], [0.02, 1.36, 0.1], 0.008, 0.008, ROPE); b.box(0.16, 0.035, 0.035, WOOD_L, [0.02, 1.34, 0.1]);
    rod(b, [-0.42, 1.64, 0.1], [-0.42, 1.12, 0.14], 0.012, 0.012, IRON, 'x', 4);
  });

  DECO.add('banco_herrero', { slot: 'wall', temas: ['forge'], tags: ['fragua', 'armeria'] }, (b, rnd) => {
    b.box(1.72, 0.09, 0.38, b.vary(WOOD), [0, 0.82, 0.2]); b.box(1.6, 0.1, 0.03, WOOD_D, [0, 0.73, 0.36]);
    [-0.76, 0.76].forEach((x) => [0.08, 0.32].forEach((z) => b.box(0.1, 0.78, 0.1, WOOD_D, [x, 0.39, z])));
    b.box(1.5, 0.04, 0.3, WOOD, [0, 0.26, 0.2]);
    ingot(b, IRON_L, [-0.4, 0.325, 0.2], 0.2); ingot(b, COPPER, [-0.05, 0.325, 0.22], -0.15); ingot(b, IRON_L, [-0.22, 0.41, 0.21], 0.05);
    b.at([0.45, 0.28, 0.2], null, () => { b.cyl(0.13, 0.11, 0.24, 8, WOOD_L, [0, 0.12, 0]); b.cyl(0.135, 0.135, 0.03, 8, IRON, [0, 0.19, 0], null, 'x'); b.cyl(0.115, 0.115, 0.01, 8, '#22404e', [0, 0.235, 0], null, 'x'); });
    // tornillo de banco
    b.at([-0.66, 0.865, 0.24], null, () => { b.box(0.07, 0.2, 0.17, IRON, [-0.08, 0.1, 0], null, 'x'); b.box(0.07, 0.2, 0.17, IRON_L, [0.05, 0.1, 0], null, 'x'); b.box(0.2, 0.05, 0.12, IRON, [-0.02, 0.025, 0], null, 'x'); b.cyl(0.018, 0.018, 0.3, 6, STEEL, [0.1, 0.1, 0], [0, 0, H], 'x'); b.cyl(0.01, 0.01, 0.2, 5, STEEL, [0.24, 0.1, 0], null, 'x'); });
    // espada a medio forjar, martillo y tenazas
    lay(b, [-0.3, 0.875, 0.15], 0.06, () => sword(b, 0.78, true));
    lay(b, [0.02, 0.9, 0.3], (rnd() - 0.5) * 0.2, () => hammer(b, 0.4, 0.14));
    lay(b, [0.4, 0.875, 0.13], -0.12, () => tongs(b, 0.34));
    b.box(0.16, 0.012, 0.12, STEEL, [0.7, 0.872, 0.29], [0, 0.4, 0], 'x');
    b.light(0, 1.1, 0.4, '#ff8a3a', 0.35, 2.5);
  });

  DECO.add('estante_lingotes', { slot: 'wall', temas: ['forge'], tags: ['fragua', 'armeria', 'tesoro', 'mina'] }, (b, rnd) => {
    b.box(1.56, 1.74, 0.03, WOOD_D, [0, 0.87, 0.02]);
    [-0.78, 0.78].forEach((x) => b.box(0.09, 1.8, 0.36, WOOD, [x, 0.9, 0.19]));
    const cols = [IRON_L, COPPER, GOLD, IRON_L];
    [0.1, 0.56, 1.02, 1.48].forEach((y, j) => {
      b.box(1.5, 0.05, 0.36, b.vary(WOOD), [0, y, 0.19]); b.box(1.5, 0.03, 0.02, IRON, [0, y, 0.385], null, 'x');
      const n = j === 2 ? 3 : 4, x0 = -0.62 + rnd() * 0.1 + (j === 2 ? 0.3 : 0), c = j === 3 ? (rnd() < 0.5 ? COPPER : IRON_L) : cols[j];
      for (let r = 0; r < (j === 3 ? 2 : 3); r++) for (let k = 0; k < n - r; k++) if (!(r && rnd() < 0.18)) ingot(b, b.vary(c, 0.08), [x0 + (k + r * 0.5) * 0.165, y + 0.068 + r * 0.086, 0.2], H);
      if (j === 3) { ingot(b, GOLD, [0.5, y + 0.068, 0.2], H + 0.3); }
      if (j === 0) b.at([0.52, y + 0.025, 0.2], null, () => cask(b, 0.15, 0.3));
    });
    b.box(1.66, 0.07, 0.39, WOOD_D, [0, 1.835, 0.2]);
  });

  DECO.add('armero_enano', { slot: 'wall', temas: ['forge'], tags: ['armeria', 'barracon', 'salon', 'santuario'] }, (b) => {
    b.box(1.6, 0.14, 0.38, WOOD_D, [0, 0.07, 0.2]); b.box(1.6, 0.03, 0.02, BRASS, [0, 0.1, 0.39], null, 'x');
    [-0.78, 0.78].forEach((x) => { b.box(0.1, 1.55, 0.14, WOOD, [x, 0.9, 0.1]); b.cone(0.08, 0.12, 4, BRASS, [x, 1.73, 0.1], [0, PI / 4, 0], 'x'); });
    [0.78, 1.36].forEach((y) => { b.box(1.6, 0.08, 0.08, WOOD, [0, y, 0.12]); [-0.52, -0.17, 0.18, 0.52].forEach((x) => b.box(0.1, 0.05, 0.05, IRON, [x, y, 0.18], null, 'x')); });
    b.box(1.5, 0.5, 0.03, ROCK_D, [0, 1.07, 0.03]); runa(b, 5, 0.22, BRASS, [0, 1.07, 0.05], 'x');
    b.at([-0.52, 0.14, 0.24], [-0.05, 0, 0], () => axe(b, 1.5, 1.25));
    b.at([-0.17, 0.14, 0.25], [-0.05, 0, 0], () => warHammer(b, 1.42));
    b.at([0.18, 0.14, 0.24], [-0.05, 0, 0], () => axe(b, 1.62, 1.05, true));
    b.at([0.52, 0.14, 0.25], [-0.05, 0, 0], () => warHammer(b, 1.3));
  });

  DECO.add('tuberias', { slot: 'wall', temas: ['forge'], tags: ['fragua', 'mina', 'pasillo', 'taberna'] }, (b) => {
    const z = 0.13, codo = (x, y, r) => ball(b, r * 1.25, COPPER, [x, y, z], null, 'x');
    const brida = (x, y, r, hz) => b.cyl(r + 0.028, r + 0.028, 0.05, 6, IRON, [x, y, z], hz ? [0, 0, H] : null, 'x');
    // tubo gordo de arriba abajo
    b.cyl(0.075, 0.075, 2.1, 6, COPPER, [-0.58, 1.05, z], null, 'x'); [0.45, 1.25, 1.95].forEach((y) => brida(-0.58, y, 0.075));
    // tubo fino con dos codos
    b.cyl(0.05, 0.05, 1.5, 6, COPPER, [-0.2, 0.75, z], null, 'x'); codo(-0.2, 1.5, 0.05); b.cyl(0.05, 0.05, 0.6, 6, COPPER, [0.1, 1.5, z], [0, 0, H], 'x'); codo(0.4, 1.5, 0.05); b.cyl(0.05, 0.05, 0.6, 6, COPPER, [0.4, 1.8, z], null, 'x');
    brida(-0.2, 0.6, 0.05); brida(0.4, 1.9, 0.05); brida(0.1, 1.5, 0.05, true);
    // puente entre los dos y válvula roja
    b.cyl(0.04, 0.04, 0.38, 6, COPPER, [-0.39, 0.95, z], [0, 0, H], 'x');
    const valv = (x, y, col) => { b.cyl(0.018, 0.018, 0.14, 5, IRON, [x, y, z + 0.1], [H, 0, 0], 'x'); ring(b, 0.095, 0.02, col, [x, y, z + 0.17], null, 'm', null, 8); b.box(0.18, 0.022, 0.02, col, [x, y, z + 0.17]); b.box(0.022, 0.18, 0.02, col, [x, y, z + 0.17]); };
    valv(-0.39, 0.95, '#8a2420');
    // caldera con su tubo y su válvula
    b.at([0.62, 0, 0.2], null, () => { b.lathe([[0.17, 0], [0.19, 0.06], [0.19, 0.62], [0.12, 0.74], [0, 0.76]], 8, COPPER, [0, 0, 0], null, 'x'); [0.1, 0.36, 0.6].forEach((y) => b.cyl(0.196, 0.196, 0.035, 8, IRON, [0, y, 0], null, 'x')); });
    b.cyl(0.06, 0.06, 1.36, 6, COPPER, [0.66, 1.42, z], null, 'x'); brida(0.66, 0.82, 0.06); brida(0.66, 1.6, 0.06); valv(0.66, 1.2, BRASS);
    // manómetro
    b.cyl(0.02, 0.02, 0.12, 5, BRASS, [0.1, 1.6, z], null, 'x'); b.cyl(0.15, 0.15, 0.06, 12, BRASS, [0.1, 1.8, z + 0.02], [H, 0, 0], 'x');
    fdisc(b, 0.125, '#e0d6bc', [0.1, 1.8, z + 0.053], 'm', null, 12); b.at([0.1, 1.8, z + 0.056], null, () => { seg(b, 0, 0, 0.07, 0.07, 0.018, '#8a1c18', 'm'); for (let k = 0; k < 5; k++) { const a = PI * (1.1 - k * 0.3); seg(b, Math.cos(a) * 0.09, Math.sin(a) * 0.09, Math.cos(a) * 0.115, Math.sin(a) * 0.115, 0.012, '#2a2622', 'm'); } });
    // abrazaderas al muro
    [[-0.58, 0.85], [-0.58, 1.6], [-0.2, 1.1], [0.66, 1.9]].forEach(([x, y]) => b.box(0.24, 0.04, 0.1, IRON, [x, y, 0.05], null, 'x'));
  });
  /* Enano de piedra (pies en y = 0, mira a +z). rey: corona, capa y trenzas */
  const enano = (b, col, colL, colD, rey) => {
    [-1, 1].forEach((s) => { b.box(0.15, 0.1, 0.22, colD, [s * 0.11, 0.05, 0.02]); b.box(0.13, 0.16, 0.14, col, [s * 0.11, 0.17, -0.01]); });
    tap(b, 0.44, 0.26, 0.27, 0.88, 0.9, col, [0, 0.36, 0]); b.box(0.43, 0.06, 0.26, colD, [0, 0.5, 0]); b.box(0.09, 0.085, 0.03, colL, [0, 0.5, 0.135]);
    b.box(0.48, 0.3, 0.26, col, [0, 0.67, 0]);
    [-1, 1].forEach((s) => { ball(b, 0.115, colL, [s * 0.27, 0.79, 0], [1, 0.8, 1]); rod(b, [s * 0.28, 0.75, 0.02], [s * 0.21, 0.58, 0.12], 0.055, 0.05, col); rod(b, [s * 0.21, 0.58, 0.12], [s * 0.04, 0.56, 0.17], 0.05, 0.045, col); });
    ball(b, 0.065, colL, [0, 0.56, 0.17]);
    ball(b, 0.135, col, [0, 0.93, 0.02]); ball(b, 0.04, colL, [0, 0.93, 0.155]);
    b.at([0, 0.73, 0.1], [PI, 0, 0], () => b.cone(0.17, 0.42, 6, colL, [0, 0, 0]), [1, 1, 0.6]);
    [-1, 1].forEach((s) => rod(b, [s * 0.02, 0.89, 0.15], [s * 0.15, 0.82, 0.13], 0.03, 0.02, colL, 'm', 5));
    // mazo apoyado en el suelo
    rod(b, [0, 0.1, 0.17], [0, 0.56, 0.17], 0.025, 0.025, colD); b.box(0.3, 0.14, 0.1, colL, [0, 0.07, 0.165]);
    if (rey) {
      b.cyl(0.15, 0.14, 0.09, 8, GOLD, [0, 1.06, 0.02], null, 'x'); for (let k = 0; k < 6; k++) b.cone(0.03, 0.09, 4, GOLD, [Math.cos(k * 1.047) * 0.135, 1.14, 0.02 + Math.sin(k * 1.047) * 0.135], null, 'x');
      tap(b, 0.62, 0.8, 0.06, 0.75, 1, colD, [0, 0.42, -0.14]);
      [-1, 1].forEach((s) => { rod(b, [s * 0.1, 0.8, 0.14], [s * 0.13, 0.5, 0.16], 0.03, 0.02, colL, 'm', 5); ball(b, 0.03, GOLD, [s * 0.13, 0.49, 0.16], null, 'x'); });
    } else {
      b.lathe([[0.15, 0], [0.145, 0.07], [0.09, 0.15], [0, 0.18]], 8, colL, [0, 0.97, 0.02]); b.cyl(0.158, 0.158, 0.035, 8, colD, [0, 0.985, 0.02]);
      [-1, 1].forEach((s) => b.cone(0.04, 0.16, 5, colL, [s * 0.19, 1.07, 0.02], [0, 0, -s * 0.9]));
    }
  };
  /* Escudo redondo enano (mira a +z) con cuatro runas pintadas */
  const shield = (b, r, col, ri) => {
    b.cyl(r, r, 0.04, 12, col, [0, 0, 0], [H, 0, 0], 'm', { ao: 0.12 }); ring(b, r, 0.024, IRON_L, [0, 0, 0.012], null, 'x', null, 12);
    ball(b, r * 0.27, STEEL, [0, 0, 0.02], [1, 1, 0.6], 'x'); ring(b, r * 0.36, 0.012, BRASS, [0, 0, 0.022], null, 'x', null, 8);
    for (let k = 0; k < 4; k++) runa(b, ri + k, r * 0.3, '#e0b858', [Math.cos(k * H) * r * 0.66, Math.sin(k * H) * r * 0.66, 0.0215], 'm');
  };

  DECO.add('estatua_enano', { slot: 'wall', temas: ['forge'], tags: ['salon', 'pasillo', 'santuario', 'armeria', 'tesoro'] }, (b, rnd) => {
    const S = '#857468', SL = '#a08e80', SD = '#5e5048';
    tap(b, 0.7, 0.12, 0.38, 0.9, 0.95, ROCK_D, [0, 0.06, 0.2]); b.box(0.56, 0.3, 0.32, ROCK, [0, 0.27, 0.2]); b.box(0.66, 0.08, 0.38, ROCK_L, [0, 0.46, 0.2]);
    runa(b, Math.floor(rnd() * 8), 0.2, '#2a1c18', [0, 0.27, 0.362], 'm'); [-1, 1].forEach((s) => b.box(0.03, 0.26, 0.02, BRASS, [s * 0.22, 0.27, 0.362], null, 'x'));
    b.at([0, 0.5, 0.165], null, () => enano(b, S, SL, SD), 1.12);
  });

  DECO.add('escudos_enanos', { slot: 'wall', temas: ['forge'], tags: ['armeria', 'salon', 'barracon', 'pasillo', 'santuario'] }, (b, rnd) => {
    [-0.82, 0.82].forEach((x) => { b.box(0.08, 1.95, 0.08, WOOD_D, [x, 0.975, 0.06]); b.box(0.14, 0.08, 0.3, WOOD_D, [x, 0.04, 0.17]); });
    [0.4, 1.08, 1.86].forEach((y) => b.box(1.72, 0.09, 0.06, WOOD, [0, y, 0.07]));
    b.box(0.08, 0.7, 0.05, WOOD, [0, 0.74, 0.07]);
    const r0 = Math.floor(rnd() * 8);
    b.at([-0.42, 0.74, 0.15], [-0.06, 0, 0.1], () => shield(b, 0.33, '#7a2a22', r0));
    b.at([0.42, 0.74, 0.15], [-0.06, 0, -0.08], () => shield(b, 0.33, '#2f4a6a', r0 + 3));
    b.at([0, 1.46, 0.16], [-0.06, 0, 0], () => shield(b, 0.36, '#3e5c36', r0 + 5));
  });

  DECO.add('litera_orca', { slot: 'wall', temas: ['forge'], tags: ['barracon', 'mina'] }, (b, rnd) => {
    [[-0.84, 0.05, 1.8], [-0.84, 0.35, 1.6], [0.84, 0.05, 1.7], [0.84, 0.35, 1.48]].forEach(([x, z, h]) => rod(b, [x, 0, z], [x + (rnd() - 0.5) * 0.04, h, z], 0.05, 0.04, b.vary(WOOD_D)));
    [0.4, 1.15].forEach((y, j) => {
      [0.08, 0.2, 0.32].forEach((z, k) => bx(b, 1.6 + (k === 1 ? 0.12 : 0), 0.045, 0.115, b.vary(WOOD), [(rnd() - 0.5) * 0.03, y, z], [0, 0, (rnd() - 0.5) * 0.02]));
      [-0.84, 0.84].forEach((x) => rod(b, [x, y - 0.05, 0.03], [x, y - 0.05, 0.37], 0.03, 0.03, WOOD_D));
      bx(b, 1.22, 0.06, 0.34, j ? '#7a7468' : '#5c4630', [0.14, y + 0.05, 0.2]); bx(b, 0.6, 0.03, 0.26, j ? '#989080' : '#80603c', [0.2, y + 0.085, 0.2]);
      bx(b, 0.46, 0.2, 0.02, j ? '#7a7468' : '#5c4630', [0.4 - j * 0.5, y - 0.04, 0.383], [0, 0, (rnd() - 0.5) * 0.1]);
      b.cyl(0.07, 0.07, 0.3, 6, '#8e7c58', [-0.64, y + 0.09, 0.2], [H, 0, 0]);
    });
    [0.64, 0.88].forEach((y) => rod(b, [0.84, y, 0.05], [0.84, y, 0.35], 0.022, 0.022, WOOD_L));
    [0, 1].forEach((k) => { b.box(0.1, 0.17, 0.1, LEATHER, [-0.34 + k * 0.17, 0.085, 0.24]); b.box(0.1, 0.07, 0.17, LEATHER, [-0.34 + k * 0.17, 0.035, 0.29]); });
    b.at([0.3, 0, 0.2], null, () => { b.cyl(0.13, 0.11, 0.2, 8, WOOD_D, [0, 0.1, 0]); b.cyl(0.135, 0.135, 0.025, 8, IRON, [0, 0.15, 0], null, 'x'); });
    rod(b, [-0.84, 1.7, 0.08], [-0.78, 1.42, 0.12], 0.008, 0.008, ROPE, 'm', 4); ball(b, 0.07, LEATHER_L, [-0.77, 1.36, 0.13], [1, 1.2, 0.8]);
  });

  DECO.add('mesa_orca', { slot: 'wall', temas: ['forge'], tags: ['barracon', 'taberna', 'mina'] }, (b, rnd) => {
    [-0.52, 0.52].forEach((x) => b.at([x, 0, 0.2], null, () => cask(b, 0.19, 0.62)));
    bx(b, 1.74, 0.055, 0.19, b.vary(WOOD), [0, 0.665, 0.105], [0, 0, 0.012]); bx(b, 1.66, 0.055, 0.19, b.vary(WOOD_L), [0.02, 0.665, 0.295]);
    mug(b, -0.62, 0.693, 0.25, 0.5); mug(b, -0.3, 0.693, 0.11, 2.4, STEEL); mug(b, 0.64, 0.693, 0.2, -0.6 + rnd());
    b.cyl(0.18, 0.18, 0.02, 8, WOOD_D, [0.04, 0.703, 0.2]);
    b.geo(ext('queso', [[0, 0], [0.19, -0.06], [0.21, 0.03], [0.17, 0.12]], 0.09), '#dcaa38', [-0.06, 0.758, 0.24], [-H, 0.3, 0]);
    b.at([-0.06, 0.805, 0.24], [0, 0.3, 0], () => b.at([0, 0, 0], [-H, 0, 0], () => [[0.08, 0.0, 0.018], [0.14, 0.04, 0.014], [0.15, -0.02, 0.012]].forEach(([x, y, r]) => fdisc(b, r, '#a87a20', [x, y, 0], 'm', null, 6))));
    ball(b, 0.075, '#a06a32', [0.12, 0.75, 0.13], [1.3, 0.75, 0.9]);
    b.at([0.36, 0.69, 0.2], [0.15, 0, -0.3], () => { b.box(0.036, 0.2, 0.008, STEEL, [0, 0.1, 0], null, 'x'); b.box(0.075, 0.02, 0.022, IRON, [0, 0.2, 0], null, 'x'); b.cyl(0.016, 0.016, 0.1, 6, LEATHER, [0, 0.26, 0]); });
  });

  DECO.add('barriles_cerveza', { slot: 'wall', temas: ['forge'], tags: ['taberna', 'barracon', 'salon'] }, (b, rnd) => {
    [0.08, 0.32].forEach((z) => b.box(1.74, 0.1, 0.08, WOOD_D, [0, 0.05, z]));
    [-0.44, 0.44].forEach((x, j) => {
      [-1, 1].forEach((s) => b.box(0.12, 0.2, 0.32, WOOD, [x + s * 0.3, 0.2, 0.2], [0, 0, -s * 0.5]));
      b.at([x, 0.57, 0.01], [H, 0, 0], () => {
        b.lathe([[0.33, 0], [0.385, 0.09], [0.4, 0.17], [0.385, 0.25], [0.33, 0.34], [0, 0.34]], 12, b.vary(WOOD), [0, 0, 0]);
        [0.075, 0.265].forEach((y) => b.cyl(0.384, 0.384, 0.035, 12, IRON, [0, y, 0], null, 'x'));
        b.cyl(0.29, 0.29, 0.012, 12, WOOD_L, [0, 0.342, 0], null, 'm', { ao: 0 });
      });
      b.at([x, 0.57, 0.36], null, () => { [-0.14, 0, 0.14].forEach((dx) => seg(b, dx, -0.25, dx, 0.25, 0.012, WOOD_D, 'm')); runa(b, j * 3 + Math.floor(rnd() * 3), 0.2, BONE, [0, 0.07, 0.002], 'm'); });
      b.cyl(0.022, 0.022, 0.05, 6, BRASS, [x, 0.37, 0.374], [H, 0, 0], 'x'); b.box(0.02, 0.07, 0.02, BRASS, [x, 0.41, 0.385], null, 'x');
    });
    mug(b, -0.44, 0.1, 0.32, 1.6);
    b.box(1.5, 0.04, 0.3, WOOD, [0, 1.0, 0.17]);
    mug(b, -0.5, 1.02, 0.18, 0.4); mug(b, -0.3, 1.02, 0.14, 2.0, STEEL); mug(b, 0.05, 1.02, 0.2, 1.0);
    b.at([0.5, 1.02, 0.17], null, () => cask(b, 0.13, 0.28));
  });

  DECO.add('carbonera', { slot: 'wall', temas: ['forge'], tags: ['fragua', 'mina', 'armeria'] }, (b, rnd) => {
    const x0 = -0.18;
    b.box(1.3, 0.8, 0.03, WOOD_D, [x0, 0.4, 0.02]);
    [0.09, 0.26, 0.43].forEach((y) => bx(b, 1.3, 0.16, 0.03, b.vary(WOOD), [x0, y, 0.38]));
    [-0.65, 0.65].forEach((s) => { b.box(0.03, 0.56, 0.36, WOOD, [x0 + s, 0.28, 0.2]); b.box(0.05, 0.6, 0.04, IRON, [x0 + s, 0.3, 0.378], null, 'x'); });
    b.box(1.26, 0.38, 0.32, COAL, [x0, 0.21, 0.2]);
    for (let k = 0; k < 11; k++) rock(b, 0.07 + rnd() * 0.035, b.vary(k % 4 ? COAL : '#302c34', 0.2), x0 - 0.5 + (k % 6) * 0.2 + rnd() * 0.05, 0.42 + (k > 5 ? 0.08 : 0) + rnd() * 0.04, 0.13 + ((k * 7) % 3) * 0.07, rnd);
    rod(b, [0.75, 0.2, 0.3], [0.68, 1.42, 0.07], 0.022, 0.022, WOOD_L); ring(b, 0.05, 0.016, WOOD_L, [0.68, 1.47, 0.07], null, 'm', null, 8);
    tap(b, 0.2, 0.26, 0.03, 0.8, 1, IRON_L, [0.755, 0.13, 0.315], [-0.18, 0, 0.05], 'x');
    rock(b, 0.05, COAL, 0.56, 0.04, 0.33, rnd); rock(b, 0.04, COAL, 0.84, 0.035, 0.18, rnd);
  });

  /* ========================================================================
     FORJA · piezas de rincón
     ======================================================================== */
  DECO.add('carbon_monton', { slot: 'corner', temas: ['forge'], tags: ['fragua', 'mina', 'armeria'] }, (b, rnd) => {
    const cx = 0.3, cz = 0.3;
    for (let k = 0; k < 7; k++) { const a = k / 7 * PI * 2 + rnd() * 0.3; rock(b, 0.09 + rnd() * 0.02, b.vary(COAL, 0.25), cx + Math.cos(a) * 0.16, 0.07, cz + Math.sin(a) * 0.16, rnd); }
    for (let k = 0; k < 4; k++) { const a = k * H + 0.5; rock(b, 0.1, b.vary(COAL, 0.25), cx + Math.cos(a) * 0.08, 0.19, cz + Math.sin(a) * 0.08, rnd); }
    rock(b, 0.09, COAL, cx, 0.3, cz, rnd);
    for (let k = 0; k < 7; k++) { const a = k * 1.9 + 0.4, r = 0.13 + (k % 3) * 0.05; b.dode(0.045, k % 2 ? EMBER : HOT, [cx + Math.cos(a) * r, 0.11 + (k % 3) * 0.07, cz + Math.sin(a) * r], [k, k, 0], null, 'g', { k: 2 }); }
    b.light(cx, 0.4, cz, '#ff6a20', 0.45, 3);
  });

  DECO.add('cuba_temple', { slot: 'corner', temas: ['forge'], tags: ['fragua', 'armeria'] }, (b) => {
    b.at([0.3, 0, 0.3], null, () => {
      b.lathe([[0.21, 0], [0.255, 0.22], [0.265, 0.44], [0.235, 0.44], [0.225, 0.36], [0, 0.36]], 10, WOOD, [0, 0, 0]);
      b.cyl(0.24, 0.235, 0.035, 10, IRON, [0, 0.1, 0], null, 'x'); b.cyl(0.268, 0.266, 0.035, 10, IRON, [0, 0.36, 0], null, 'x');
      b.cyl(0.23, 0.23, 0.01, 10, '#2c6076', [0, 0.38, 0], null, 'm', { ao: 0 }); fring(b, 0.05, 0.065, '#6aa0b4', [0, 0, 0], 0, 'm');
      b.at([0.05, 1.02, -0.02], [0.1, 0, PI - 0.16], () => sword(b, 0.84));
    });
    b.at([0.5, 0, 0.53], [-0.2, 0, 0.12], () => tongs(b, 0.5));
  });

  DECO.add('lingotes_pila', { slot: 'corner', temas: ['forge'], tags: ['fragua', 'tesoro', 'armeria', 'mina'] }, (b, rnd) => {
    const capa = (y, girada, n, col) => { for (let k = 0; k < n; k++) { const off = (k - (n - 1) / 2) * 0.155; ingot(b, b.vary(col, 0.08), girada ? [0.3 + off, y, 0.3] : [0.3, y, 0.3 + off], girada ? H : 0); } };
    capa(0.043, false, 3, IRON_L); capa(0.129, true, 3, IRON_L); capa(0.215, false, 2, COPPER); capa(0.301, true, 2, COPPER); ingot(b, GOLD, [0.3, 0.387, 0.3], 0.3 + rnd() * 0.6);
  });

  DECO.add('tambor_orco', { slot: 'corner', temas: ['forge'], tags: ['barracon', 'salon', 'santuario', 'taberna'] }, (b) => {
    b.at([0.3, 0, 0.3], null, () => {
      [0, 1, 2].forEach((k) => { const a = k * 2.094 + 0.5; rod(b, [Math.cos(a) * 0.21, 0, Math.sin(a) * 0.21], [Math.cos(a) * 0.15, 0.22, Math.sin(a) * 0.15], 0.03, 0.03, WOOD_D); });
      b.lathe([[0, 0.14], [0.19, 0.14], [0.25, 0.4], [0.255, 0.62], [0, 0.62]], 10, WOOD, [0, 0, 0]);
      b.cyl(0.259, 0.25, 0.1, 10, '#7a2420', [0, 0.43, 0]);
      b.cyl(0.264, 0.264, 0.05, 10, HIDE, [0, 0.625, 0], null, 'm', { ao: 0.1 }); b.cyl(0.215, 0.215, 0.012, 10, '#d2bb90', [0, 0.652, 0], null, 'm', { ao: 0 });
      for (let k = 0; k < 10; k++) { const p = (a, r, y) => [Math.cos(a) * r, y, Math.sin(a) * r], a0 = k * PI / 5, q = p(a0 + PI / 10, 0.215, 0.2); rod(b, p(a0, 0.268, 0.6), q, 0.008, 0.008, ROPE, 'm', 3); rod(b, q, p(a0 + PI / 5, 0.268, 0.6), 0.008, 0.008, ROPE, 'm', 3); }
      [[-0.2, 0.1, 0.17, -0.12], [-0.16, -0.14, 0.19, 0.1]].forEach(([x1, z1, x2, z2], k) => { rod(b, [x1, 0.67 + k * 0.03, z1], [x2, 0.69 + k * 0.03, z2], 0.014, 0.014, WOOD_L, 'm', 5); ball(b, 0.035, LEATHER, [x2, 0.69 + k * 0.03, z2]); });
      for (let k = 0; k < 5; k++) b.cone(0.02, 0.09, 5, BONE, [Math.cos(k * 1.257 + 0.3) * 0.262, 0.54, Math.sin(k * 1.257 + 0.3) * 0.262], [PI, 0, 0]);
    });
  });

  DECO.add('totem_orco', { slot: 'corner', temas: ['forge'], tags: ['barracon', 'salon', 'santuario', 'mina', 'pasillo'] }, (b) => {
    const cols = ['#7e2c22', '#aa7c2c', '#2f625c'];
    b.at([0.3, 0, 0.3], [0, PI / 4, 0], () => {
      b.cyl(0.085, 0.11, 1.75, 7, WOOD_D, [0, 0.875, 0]);
      [0.42, 0.92, 1.42].forEach((y, k) => b.at([0, y, 0.06], null, () => {
        tap(b, 0.34, 0.42, 0.2, k === 1 ? 1.12 : 0.84, 1, cols[k], [0, 0, 0]);
        b.box(0.36, 0.06, 0.06, WOOD_D, [0, 0.1, 0.09]);
        [-1, 1].forEach((s) => { fdisc(b, 0.048, '#ecd9a0', [s * 0.085, 0.035, 0.102], 'm', null, 8); fdisc(b, 0.02, '#1a1410', [s * 0.085, 0.035, 0.104], 'm', null, 6); b.cone(0.022, 0.09, 5, BONE, [s * 0.07, -0.1, 0.115]); });
        b.box(0.07, 0.15, 0.07, cols[(k + 1) % 3], [0, -0.02, 0.11]); b.box(0.22, 0.05, 0.02, '#1a1410', [0, -0.135, 0.1]);
        [-1, 1].forEach((s) => vp(b, 0.05, 0.12, cols[(k + 2) % 3], [s * 0.135, -0.03, 0.102], s * 0.4));
      }));
      [-1, 1].forEach((s) => { b.box(0.17, 0.24, 0.04, cols[0], [s * 0.24, 0.95, 0.04], [0, 0, s * 0.3]); b.cone(0.05, 0.3, 6, BONE, [s * 0.15, 1.78, 0.04], [0, 0, -s * 0.5]); });
      [-0.3, 0, 0.3].forEach((a, k) => b.box(0.035, 0.26, 0.012, cols[k], [a * 0.2, 1.86, -0.02], [0, 0, -a]));
    });
  });

  DECO.add('piedra_afilar', { slot: 'corner', temas: ['forge'], tags: ['fragua', 'armeria', 'barracon'] }, (b) => {
    const y0 = 0.56;
    [0.14, 0.46].forEach((x) => { rod(b, [x, y0 + 0.04, 0.3], [x, 0, 0.08], 0.03, 0.035, WOOD_D, 'm', 4); rod(b, [x, y0 + 0.04, 0.3], [x, 0, 0.52], 0.03, 0.035, WOOD_D, 'm', 4); b.box(0.05, 0.05, 0.3, WOOD, [x, 0.2, 0.3]); });
    b.box(0.36, 0.05, 0.05, WOOD, [0.3, 0.2, 0.3]);
    b.cyl(0.23, 0.23, 0.09, 12, '#989082', [0.3, y0, 0.3], [0, 0, H], 'm', { ao: 0.1 }); b.cyl(0.07, 0.07, 0.11, 8, IRON, [0.3, y0, 0.3], [0, 0, H], 'x');
    rod(b, [0.08, y0, 0.3], [0.56, y0, 0.3], 0.018, 0.018, IRON, 'x');
    rod(b, [0.555, y0, 0.3], [0.555, y0 - 0.1, 0.36], 0.014, 0.014, IRON, 'x', 4); rod(b, [0.555, y0 - 0.1, 0.36], [0.555, 0.06, 0.42], 0.01, 0.01, IRON, 'x', 4);
    b.box(0.09, 0.025, 0.3, WOOD_L, [0.53, 0.05, 0.4], [0.15, 0, 0]);
    b.box(0.2, 0.08, 0.34, WOOD_D, [0.3, 0.3, 0.3]); b.box(0.16, 0.01, 0.3, '#2c6076', [0.3, 0.342, 0.3], null, 'm', { ao: 0 });
  });

  DECO.add('picos_palas', { slot: 'corner', temas: ['forge'], tags: ['mina', 'fragua', 'pasillo'] }, (b) => {
    const pico = (p, q, ry) => { rod(b, p, q, 0.026, 0.022, WOOD); b.at(q, [0, ry, 0], () => { b.box(0.07, 0.07, 0.06, IRON, [0, 0, 0], null, 'x'); [-1, 1].forEach((s) => b.cone(0.03, 0.24, 5, IRON_L, [s * 0.15, -0.015, 0], [0, 0, -s * (H + 0.2)], 'x')); }); };
    pico([0.36, 0, 0.46], [0.3, 1.22, 0.07], 0); pico([0.5, 0, 0.2], [0.07, 1.02, 0.32], H);
    rod(b, [0.22, 0.2, 0.25], [0.1, 1.3, 0.1], 0.022, 0.022, WOOD_L); ring(b, 0.045, 0.015, WOOD_L, [0.1, 1.35, 0.1], [0, PI / 4, 0], 'm', null, 8);
    tap(b, 0.19, 0.26, 0.03, 0.8, 1, IRON_L, [0.225, 0.13, 0.26], [-0.1, PI / 4, 0], 'x');
    ring(b, 0.1, 0.026, ROPE, [0.43, 0.03, 0.43], [H, 0, 0], 'm', null, 10); ring(b, 0.09, 0.026, ROPE, [0.43, 0.075, 0.43], [H, 0, 0], 'm', null, 10);
  });

  const YUNQUE = [[-0.3, 0], [0.3, 0], [0.3, 0.08], [0.16, 0.13], [0.13, 0.27], [0.24, 0.34], [0.24, 0.5], [-0.42, 0.5], [-0.42, 0.38], [-0.14, 0.3], [-0.16, 0.13], [-0.3, 0.08]];
  /* Yunque (base en y = 0, cuerno hacia +x); s: tamaño */
  const anvil = (b, s) => b.at([0, 0, 0], null, () => { b.geo(ext('yunque', YUNQUE, 0.3), IRON_L, [0, 0, 0], null, null, 'x'); b.cone(0.085, 0.4, 6, IRON_L, [0.42, 0.405, 0], [0, 0, -H], 'x'); b.box(0.05, 0.012, 0.05, '#151312', [-0.33, 0.5, 0]); }, s);

  DECO.add('yunque_pequeno', { slot: 'corner', temas: ['forge'], tags: ['fragua', 'armeria', 'mina'] }, (b) => {
    b.cyl(0.2, 0.22, 0.36, 8, WOOD_D, [0.3, 0.18, 0.3]); b.cyl(0.18, 0.18, 0.012, 8, WOOD_L, [0.3, 0.362, 0.3], null, 'm', { ao: 0 }); b.cyl(0.215, 0.215, 0.04, 8, IRON, [0.3, 0.27, 0.3], null, 'x');
    b.at([0.27, 0.365, 0.3], [0, 0.5, 0], () => anvil(b, 0.52));
    rod(b, [0.52, 0, 0.53], [0.47, 0.44, 0.44], 0.02, 0.02, WOOD_L); b.box(0.13, 0.07, 0.07, IRON, [0.47, 0.45, 0.44], [0, 0.6, 0.2], 'x');
    ring(b, 0.06, 0.014, IRON_L, [0.12, 0.016, 0.5], [H, 0, 0], 'x', null, 8, PI * 1.4);
  });

  DECO.add('mineral_monton', { slot: 'corner', temas: ['forge'], tags: ['mina', 'fragua', 'tesoro'] }, (b, rnd) => {
    const col = rnd() < 0.5 ? '#ff8a2a' : '#4ab0ff';
    [[0.2, 0.1, 0.2, 0.15], [0.43, 0.09, 0.19, 0.12], [0.2, 0.09, 0.43, 0.13], [0.42, 0.1, 0.42, 0.14], [0.3, 0.25, 0.3, 0.14]].forEach(([x, y, z, r], i) => {
      rock(b, r, b.vary(i % 2 ? ROCK : ROCK_D, 0.12), x, y, z, rnd);
      for (let j = 0; j < 3; j++) b.oct(1, col, [x + (rnd() - 0.3) * r * 0.9, y + r * 0.6 + rnd() * 0.03, z + (rnd() - 0.3) * r * 0.9], [rnd() * 3, rnd() * 3, 0], [0.03, 0.065, 0.03], 'g', { k: 1.8 });
    });
    b.light(0.3, 0.4, 0.3, col, 0.4, 2.8);
  });
})();
