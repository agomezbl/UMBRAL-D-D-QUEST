/* Atrezo de suelo (alfombras, círculos, paja, papeles) y piezas de casilla entera
   (mesas, sarcófagos, estatuas, yunques, braseros, cristales, planetario…) */
(() => {
  const STONE = '#6a655b', STONE_L = '#857e72', STONE_D = '#4a4740', WOOD = '#6a4526', WOOD_D = '#4a2f1a', IRON = '#3a3632', GOLD = '#b08a3a', CLOTH = '#e2d8c2';
  const PI = Math.PI;

  /* ---------------- suelo ---------------- */
  // alfombra rectangular: cenefa, filete, medallón y flecos (o.w × o.d, colores o.col y o.col2)
  const rug = (b, o, def) => {
    const w = o.w || def.w, d = o.d || def.d, c1 = o.col || def.c1, c2 = o.col2 || def.c2, A = { ao: 0 };
    b.box(w, 0.012, d, c2, [0, 0.006, 0], null, 'm', A);
    b.box(w - 0.16, 0.014, d - 0.16, b.vary(c1, 0.04), [0, 0.008, 0], null, 'm', A);
    const fw = w - 0.42, fd = d - 0.42, t = 0.035;
    b.box(fw, 0.016, t, c2, [0, 0.009, fd / 2], null, 'm', A); b.box(fw, 0.016, t, c2, [0, 0.009, -fd / 2], null, 'm', A);
    b.box(t, 0.016, fd, c2, [fw / 2, 0.009, 0], null, 'm', A); b.box(t, 0.016, fd, c2, [-fw / 2, 0.009, 0], null, 'm', A);
    const m = Math.min(w, d) * 0.3;
    b.box(m, 0.018, m, c2, [0, 0.01, 0], [0, PI / 4, 0], 'm', A);
    b.box(m * 0.64, 0.02, m * 0.64, c1, [0, 0.011, 0], [0, PI / 4, 0], 'm', A);
    b.box(m * 0.26, 0.022, m * 0.26, def.c3 || c2, [0, 0.012, 0], [0, PI / 4, 0], 'm', A);
    if (def.moons) [-1, 1].forEach((s) => { b.cyl(m * 0.22, m * 0.22, 0.018, 12, c2, [s * (fw / 2 - m * 0.45), 0.01, 0], null, 'm', A); b.cyl(m * 0.18, m * 0.18, 0.02, 12, c1, [s * (fw / 2 - m * 0.45) + s * 0.05, 0.011, 0], null, 'm', A); });
    const long = w >= d, n = Math.floor((long ? d : w) / 0.12);
    for (let s = -1; s <= 1; s += 2) for (let k = 0; k < n; k++) {
      const u = -(long ? d : w) / 2 + 0.08 + k * 0.12;
      if (long) b.box(0.08, 0.006, 0.024, c2, [s * (w / 2 + 0.035), 0.003, u], null, 'm', A);
      else b.box(0.024, 0.006, 0.08, c2, [u, 0.003, s * (d / 2 + 0.035)], null, 'm', A);
    }
  };
  DECO.add('alfombra', { slot: 'floor', tw: 2, td: 1, tags: ['archivo', 'celdas', 'tesoro', 'salon', 'taberna'] }, (b, rnd, o) => rug(b, o, { w: 3.4, d: 1.6, c1: '#6a1f24', c2: '#c9a24a', c3: '#2a3a5a' }));
  DECO.add('alfombra_capilla', { slot: 'floor', tw: 1, td: 2, tags: ['capilla'] }, (b, rnd, o) => rug(b, o, { w: 1.2, d: 3.6, c1: '#6a1a22', c2: '#c9a24a' }));
  DECO.add('alfombra_arcana', { slot: 'floor', tw: 2, td: 1, temas: ['void'], tags: ['observatorio', 'biblioteca', 'tesoro'] }, (b, rnd, o) => rug(b, o, { w: 3.4, d: 1.6, c1: '#2a1d4a', c2: '#b8b8d8', c3: '#8affe0', moons: true }));

  // círculo de runas pintado en el suelo, con un brillo tenue
  const circle = (b, R, col, points) => {
    const G = { k: 1.1 };
    b.tor(R, 0.016, col, [0, 0.016, 0], [PI / 2, 0, 0], 'g', G);
    b.tor(R * 0.8, 0.011, col, [0, 0.014, 0], [PI / 2, 0, 0], 'g', G);
    const rg = R * 0.9, ng = Math.round(R * 14);
    for (let k = 0; k < ng; k++) { const a = (k / ng) * PI * 2; b.box(0.07, 0.008, 0.025 + (k % 3) * 0.012, col, [Math.cos(a) * rg, 0.012, Math.sin(a) * rg], [0, -a + (k % 2) * 0.6, 0], 'g', G); }
    // rosa de los vientos: rayos y dos cuadrados girados (motivo de suelo, sin símbolos religiosos ni ocultistas)
    const line = (x0, z0, x1, z1, k) => { const L = Math.hypot(x1 - x0, z1 - z0); b.box(L, 0.008, 0.018, col, [(x0 + x1) / 2, 0.011, (z0 + z1) / 2], [0, -Math.atan2(z1 - z0, x1 - x0), 0], 'g', { k }); };
    for (let q = 0; q < 2; q++) { const P = []; for (let k = 0; k < 4; k++) { const a = (k / 4) * PI * 2 + q * PI / 4; P.push([Math.cos(a) * R * 0.62, Math.sin(a) * R * 0.62]); } for (let k = 0; k < 4; k++) line(...P[k], ...P[(k + 1) % 4], 0.85); }
    for (let k = 0; k < points * 2; k++) { const a = (k / (points * 2)) * PI * 2, r0 = k % 2 ? R * 0.2 : R * 0.12, r1 = k % 2 ? R * 0.45 : R * 0.74; line(Math.cos(a) * r0, Math.sin(a) * r0, Math.cos(a) * r1, Math.sin(a) * r1, 0.95); }
    b.tor(R * 0.12, 0.01, col, [0, 0.014, 0], [PI / 2, 0, 0], 'g', G);
    b.light(0, 0.3, 0, col, 0.55, R * 2.6);
  };
  DECO.add('circulo_runas', { slot: 'floor', temas: ['crypt', 'void'], tags: ['laboratorio', 'santuario', 'observatorio'] }, (b, rnd, o) => circle(b, 0.82, o.glow || '#8affc8', 4));
  DECO.add('circulo_arcano', { slot: 'floor', tw: 2, td: 2, temas: ['void'], tags: ['santuario', 'observatorio'] }, (b, rnd, o) => circle(b, o.r || 1.6, o.glow || '#b48cff', 6));
  DECO.add('runa_suelo', { slot: 'floor', temas: ['forge'], tags: ['fragua', 'santuario', 'salon', 'tumba'] }, (b, rnd, o) => circle(b, 0.78, o.glow || '#ff8a3a', 4));

  DECO.add('paja', { slot: 'floor', tags: ['bodega', 'barracon', 'celdas', 'mina', 'taberna'] }, (b, rnd) => {
    for (let k = 0; k < 46; k++) { const a = rnd() * PI * 2, r = Math.sqrt(rnd()) * 0.75, L = 0.12 + rnd() * 0.22; b.cyl(0.007, 0.007, L, 3, b.vary('#b8963a', 0.2), [Math.cos(a) * r, 0.008 + rnd() * 0.012, Math.sin(a) * r], [0, rnd() * PI, PI / 2], 'm', { ao: 0 }); }
  });
  DECO.add('papeles', { slot: 'floor', tags: ['archivo', 'biblioteca', 'laboratorio', 'observatorio'] }, (b, rnd) => {
    for (let k = 0; k < 5; k++) b.box(0.2 + rnd() * 0.08, 0.004, 0.26 + rnd() * 0.08, b.vary('#d8cba8', 0.1), [(rnd() - 0.5) * 1.1, 0.003 + k * 0.004, (rnd() - 0.5) * 1.1], [0, rnd() * PI, 0], 'm', { ao: 0 });
    b.cyl(0.03, 0.03, 0.24, 8, '#cdbb90', [(rnd() - 0.5) * 0.8, 0.03, (rnd() - 0.5) * 0.8], [0, rnd() * PI, PI / 2]);
  });
  DECO.add('monedas_suelo', { slot: 'floor', tags: ['tesoro'] }, (b, rnd) => {
    for (let k = 0; k < 14; k++) { const a = rnd() * PI * 2, r = Math.sqrt(rnd()) * 0.6; b.cyl(0.045, 0.045, 0.01, 8, b.vary('#d0a040', 0.1), [Math.cos(a) * r, 0.006 + (k % 3) * 0.008, Math.sin(a) * r], [rnd() * 0.3, 0, rnd() * 0.3], 'x', { ao: 0 }); }
  });

  /* ---------------- casilla entera (solo en casillas que ya bloquean el paso) ---------------- */
  const candleStand = (b, x, z, h = 0.9) => {
    b.cyl(0.08, 0.1, 0.04, 8, IRON, [x, 0.02, z], null, 'x');
    b.cyl(0.018, 0.018, h, 6, IRON, [x, h / 2, z], null, 'x');
    b.cyl(0.07, 0.05, 0.03, 8, IRON, [x, h, z], null, 'x');
    b.candle(x, h + 0.015, z, 0.16);
  };
  DECO.add('sarcofago', { slot: 'block', temas: ['crypt'], tags: ['capilla', 'osario', 'nichos', 'santuario', 'celdas'] }, (b, rnd) => {
    const st = b.vary(STONE, 0.06);
    b.box(1.56, 0.12, 0.9, STONE_D, [0, 0.06, 0]);
    b.box(1.38, 0.5, 0.72, st, [0, 0.37, 0]);
    [-1, 1].forEach((s) => { for (let k = -1; k <= 1; k++) b.box(0.32, 0.26, 0.02, STONE_D, [k * 0.42, 0.38, s * 0.365]); b.box(0.02, 0.26, 0.4, STONE_D, [s * 0.695, 0.38, 0]); });
    b.box(1.48, 0.1, 0.82, STONE_L, [0, 0.67, 0]); b.box(1.32, 0.06, 0.64, STONE_L, [0, 0.75, 0]);
    // yacente tallado sobre la tapa
    const ef = '#948c7e';
    b.sph(0.1, ef, [0.48, 0.84, 0], [1, 0.8, 1]); b.box(0.12, 0.06, 0.24, ef, [0.36, 0.8, 0]);
    b.box(0.62, 0.1, 0.28, ef, [0.02, 0.82, 0]); b.box(0.2, 0.08, 0.1, ef, [0.08, 0.9, 0]);
    b.box(0.12, 0.1, 0.22, ef, [-0.34, 0.82, 0]);
    candleStand(b, 0.79, 0.62, 0.55); candleStand(b, -0.79, -0.62, 0.55);
    b.light(0.79, 0.8, 0.62, '#ffb35a', 0.55, 3); b.light(-0.79, 0.8, -0.62, '#ffb35a', 0.55, 3);
  });
  DECO.add('altar_piedra', { slot: 'block', temas: ['crypt', 'void'], tags: ['capilla', 'santuario'] }, (b) => {
    b.box(1.64, 0.08, 1.24, STONE_D, [0, 0.04, 0]); b.box(1.44, 0.08, 1.04, STONE, [0, 0.12, 0]);
    b.box(1.2, 0.72, 0.62, STONE_L, [0, 0.52, 0]); b.box(1.32, 0.06, 0.72, STONE_L, [0, 0.91, 0]);
    b.box(1.34, 0.03, 0.74, CLOTH, [0, 0.955, 0], null, 'm', { ao: 0 });
    b.box(0.5, 0.46, 0.02, '#6a1f24', [0, 0.74, 0.375]); b.box(0.5, 0.05, 0.025, GOLD, [0, 0.52, 0.378], null, 'x');
    b.lathe([[0, 0], [0.07, 0], [0.025, 0.03], [0.02, 0.12], [0.06, 0.16], [0.075, 0.24], [0, 0.24]], 10, GOLD, [0, 0.97, -0.1], null, 'x');
    b.box(0.3, 0.05, 0.22, '#5a2a1a', [0, 0.995, 0.14], [0, 0.2, 0]); b.box(0.28, 0.01, 0.2, '#e8dcc0', [0, 1.025, 0.14], [0, 0.2, 0]);
    [-1, 1].forEach((s) => { b.cyl(0.05, 0.07, 0.04, 8, GOLD, [s * 0.5, 0.99, -0.12], null, 'x'); b.cyl(0.015, 0.015, 0.22, 6, GOLD, [s * 0.5, 1.1, -0.12], null, 'x'); b.candle(s * 0.5, 1.21, -0.12, 0.2); });
    b.light(0, 1.3, 0, '#ffc070', 0.9, 4);
  });
  DECO.add('mesa_banquete', { slot: 'block', tags: ['salon', 'taberna', 'barracon', 'celdas', 'guardia', 'comedor'] }, (b, rnd) => {
    const wd = b.vary(WOOD, 0.08);
    b.box(1.62, 0.08, 0.84, wd, [0, 0.74, 0]);
    [[-0.7, -0.34], [0.7, -0.34], [-0.7, 0.34], [0.7, 0.34]].forEach(([x, z]) => b.box(0.08, 0.7, 0.08, WOOD_D, [x, 0.35, z]));
    b.box(1.4, 0.05, 0.05, WOOD_D, [0, 0.2, 0]);
    [-1, 1].forEach((s) => { b.box(1.5, 0.06, 0.24, wd, [0, 0.42, s * 0.66]); [-0.62, 0.62].forEach((x) => b.box(0.06, 0.4, 0.2, WOOD_D, [x, 0.2, s * 0.66])); });
    b.box(1.5, 0.012, 0.3, '#7a2a24', [0, 0.786, 0], null, 'm', { ao: 0 });
    [-0.55, -0.2, 0.2, 0.55].forEach((x, k) => { const z = k % 2 ? 0.24 : -0.24; b.cyl(0.11, 0.09, 0.02, 10, '#c8c0b0', [x, 0.79, z]); if (rnd() < 0.7) b.sph(0.06, b.pick(['#c06a2a', '#8aa83a', '#b8903a']), [x, 0.83, z], [1, 0.8, 1]); b.cyl(0.045, 0.04, 0.12, 8, b.pick(['#8a6a4a', IRON, '#6a7a8a']), [x + 0.14, 0.84, z * 0.4], null, k % 2 ? 'x' : 'm'); });
    b.sph(0.12, '#b88a4a', [-0.3, 0.84, 0.05], [1.4, 0.7, 1]); b.lathe([[0, 0], [0.07, 0], [0.09, 0.08], [0.05, 0.18], [0.04, 0.22], [0, 0.22]], 10, '#8a5a3a', [0.35, 0.78, -0.02]);
    b.cyl(0.08, 0.1, 0.03, 8, IRON, [0, 0.8, 0], null, 'x'); b.cyl(0.015, 0.015, 0.2, 6, IRON, [0, 0.9, 0], null, 'x'); b.box(0.36, 0.02, 0.02, IRON, [0, 0.98, 0], null, 'x');
    [-0.17, 0, 0.17].forEach((x) => b.candle(x, x ? 0.99 : 1.0, 0, 0.14));
    b.light(0, 1.2, 0, '#ffb060', 0.8, 4);
  });
  DECO.add('estatua_heroe', { slot: 'block', tags: ['salon', 'tumba', 'capilla', 'espejos', 'pasillo', 'santuario', 'guardia'] }, (b) => {
    const st = '#8a8478', st2 = '#777064';
    b.box(1.1, 0.14, 1.1, STONE_D, [0, 0.07, 0]); b.box(0.86, 0.36, 0.86, st2, [0, 0.32, 0]); b.box(0.96, 0.08, 0.96, STONE_D, [0, 0.54, 0]);
    b.box(0.5, 0.04, 0.02, GOLD, [0, 0.34, 0.432], null, 'x');
    b.at([0, 0.58, 0], null, (q) => {
      q.box(0.17, 0.62, 0.19, st, [-0.11, 0.31, 0]); q.box(0.17, 0.62, 0.19, st, [0.11, 0.31, 0.04]);
      q.box(0.5, 0.9, 0.06, st2, [0, 0.95, -0.2], [0.12, 0, 0]);
      q.lathe([[0, 0], [0.22, 0], [0.26, 0.2], [0.24, 0.42], [0.16, 0.5], [0, 0.5]], 10, st, [0, 0.6, 0]);
      q.sph(0.13, st, [0, 1.22, 0]); q.cone(0.15, 0.12, 8, st, [0, 1.36, 0]);
      q.box(0.1, 0.48, 0.1, st, [0.27, 0.95, 0.06], [0, 0, -0.25]);
      q.box(0.05, 0.6, 0.02, '#a8a090', [0.42, 1.34, 0.08], null, 'x'); q.box(0.2, 0.04, 0.05, st, [0.4, 1.06, 0.08]);
      q.cyl(0.24, 0.24, 0.05, 12, st, [-0.3, 0.9, 0.08], [PI / 2, 0, 0.2]);
    });
  });
  DECO.add('libreria_doble', { slot: 'block', tags: ['archivo', 'biblioteca'] }, (b, rnd) => {
    const wd = b.vary(WOOD_D, 0.06);
    b.box(1.6, 1.9, 0.08, wd, [0, 0.95, 0]); [-0.8, 0.8].forEach((x) => b.box(0.08, 1.95, 0.7, wd, [x, 0.975, 0])); b.box(1.7, 0.08, 0.76, wd, [0, 1.95, 0]);
    [0.06, 0.52, 0.98, 1.44].forEach((y) => b.box(1.56, 0.04, 0.66, wd, [0, y, 0]));
    [-1, 1].forEach((s) => [0.08, 0.54, 1.0, 1.46].forEach((y) => { let x = -0.74; while (x < 0.7) { const w = 0.04 + rnd() * 0.05, h = 0.28 + rnd() * 0.14; if (rnd() < 0.9) b.box(w, h, 0.24, b.vary(b.pick(['#6a1f24', '#2a3a5a', '#3a4a2a', '#5a3a1a', '#4a2a4a', '#8a6a3a']), 0.15), [x + w / 2, y + h / 2, s * 0.17]); x += w + 0.008; } }));
  });
  DECO.add('pozo', { slot: 'block', temas: ['crypt', 'forge'], tags: ['bodega', 'osario', 'mina'] }, (b) => {
    for (let k = 0; k < 12; k++) { const a = (k / 12) * PI * 2; b.box(0.3, 0.55, 0.16, b.vary(STONE, 0.1), [Math.cos(a) * 0.62, 0.275, Math.sin(a) * 0.62], [0, -a + PI / 2, 0]); }
    b.cyl(0.66, 0.66, 0.06, 16, STONE_L, [0, 0.57, 0]); b.cyl(0.52, 0.52, 0.07, 16, '#0e1416', [0, 0.57, 0]);
    b.cyl(0.5, 0.5, 0.01, 16, '#2a6a7a', [0, 0.3, 0], null, 'g', { k: 0.35 });
    [-1, 1].forEach((s) => b.box(0.08, 1.2, 0.08, WOOD_D, [s * 0.7, 0.6, 0])); b.box(1.5, 0.08, 0.1, WOOD, [0, 1.22, 0]);
    b.cyl(0.07, 0.07, 1.2, 8, WOOD, [0, 1.05, 0], [0, 0, PI / 2]); b.cyl(0.006, 0.006, 0.4, 3, '#b8a070', [0.1, 0.82, 0]);
    b.lathe([[0, 0], [0.09, 0], [0.11, 0.16], [0, 0.16]], 8, WOOD, [0.1, 0.58, 0]);
    b.light(0, 0.6, 0, '#5ab0c0', 0.35, 2.5);
  });
  DECO.add('tesoro_grande', { slot: 'block', tags: ['tesoro'] }, (b, rnd) => {
    b.sph(0.72, '#c89a3a', [0, 0.02, 0], [1.05, 0.42, 0.95], 'x'); b.sph(0.4, '#d8aa48', [0.25, 0.22, -0.15], [1, 0.6, 1], 'x');
    for (let k = 0; k < 22; k++) { const a = rnd() * PI * 2, r = 0.25 + rnd() * 0.5; b.cyl(0.05, 0.05, 0.012, 8, '#e0b84a', [Math.cos(a) * r, 0.18 + rnd() * 0.12 - r * 0.2, Math.sin(a) * r], [rnd(), rnd(), rnd()], 'x', { ao: 0 }); }
    b.at([-0.32, 0, 0.12], [0, 0.4, 0], (q) => { q.box(0.62, 0.36, 0.4, WOOD, [0, 0.18, 0]); [-0.27, 0.27].forEach((x) => q.box(0.04, 0.38, 0.42, IRON, [x, 0.18, 0], null, 'x')); q.box(0.62, 0.32, 0.06, WOOD, [0, 0.5, -0.2], [-0.5, 0, 0]); q.sph(0.2, '#e0b84a', [0, 0.34, 0], [1.3, 0.5, 0.8], 'x'); });
    [['#ff3a5a', 0.3, 0.28, 0.35], ['#3aa0ff', -0.1, 0.3, -0.3], ['#3aff8a', 0.5, 0.15, -0.2], ['#c06aff', -0.5, 0.12, -0.3]].forEach(([c, x, y, z]) => b.oct(0.06, c, [x, y, z], [rnd(), rnd(), 0], null, 'g', { k: 1.6 }));
    b.lathe([[0, 0], [0.06, 0], [0.02, 0.03], [0.018, 0.12], [0.06, 0.15], [0.07, 0.24], [0, 0.24]], 10, '#d8aa48', [0.42, 0.18, 0.34], null, 'x');
    b.light(0, 0.6, 0, '#ffd060', 0.9, 4);
  });
  DECO.add('caldero', { slot: 'block', tags: ['laboratorio', 'barracon'] }, (b) => {
    [0, 2.1, 4.2].forEach((a) => b.box(0.05, 1.2, 0.05, IRON, [Math.cos(a) * 0.45, 0.58, Math.sin(a) * 0.45], [Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35], 'x'));
    b.lathe([[0, 0.05], [0.3, 0.1], [0.42, 0.3], [0.4, 0.5], [0.34, 0.58], [0.36, 0.6], [0, 0.6]], 14, '#2a2826', [0, 0.25, 0], null, 'x');
    b.cyl(0.33, 0.33, 0.02, 14, '#6aff8a', [0, 0.83, 0], null, 'g', { k: 1.4 }); [[0.1, 0.05], [-0.12, -0.08], [0.02, -0.15]].forEach(([x, z]) => b.sph(0.05, '#9affaa', [x, 0.85, z], [1, 0.6, 1], 'g', { k: 1.6 }));
    for (let k = 0; k < 7; k++) { const a = k * 0.9; b.box(0.3, 0.07, 0.07, '#3a2418', [Math.cos(a) * 0.15, 0.06, Math.sin(a) * 0.15], [0, a, 0]); }
    b.sph(0.16, '#ff7a2a', [0, 0.1, 0], [1.3, 0.4, 1.3], 'g', { k: 1.8 });
    b.light(0, 1, 0, '#6aff8a', 0.9, 4); b.light(0, 0.2, 0, '#ff7a2a', 0.5, 2.5); b.flame(0, 0.28, 0, 0.4, 0.4);
  });
  DECO.add('yunque_grande', { slot: 'block', temas: ['forge'], tags: ['fragua', 'armeria', 'santuario'] }, (b) => {
    b.cyl(0.36, 0.42, 0.55, 10, '#4a3020', [0, 0.275, 0]); b.cyl(0.36, 0.36, 0.01, 10, '#7a5a3a', [0, 0.555, 0]);
    b.box(0.36, 0.14, 0.26, '#2e2c2a', [0, 0.62, 0], null, 'x'); b.box(0.22, 0.12, 0.18, '#2e2c2a', [0, 0.74, 0], null, 'x');
    b.box(0.62, 0.12, 0.26, '#3a3836', [0.04, 0.86, 0], null, 'x'); b.cone(0.11, 0.36, 8, '#3a3836', [-0.43, 0.88, 0], [0, 0, PI / 2], 'x');
    b.box(0.32, 0.03, 0.05, '#ffb030', [0.06, 0.935, 0.03], [0, 0.3, 0], 'g', { k: 2.4 });
    b.box(0.07, 0.36, 0.05, WOOD, [0.28, 1.0, -0.08], [0, 0, 1.2]); b.box(0.16, 0.08, 0.08, IRON, [0.42, 1.08, -0.08], [0, 0, 1.2], 'x');
    b.box(0.03, 0.5, 0.03, IRON, [0.48, 0.3, 0.42], [0, 0, 0.3], 'x');
    b.lathe([[0, 0], [0.2, 0], [0.22, 0.32], [0, 0.32]], 10, '#3a2a1e', [-0.55, 0, 0.5]); b.cyl(0.19, 0.19, 0.01, 10, '#2a4a5a', [-0.55, 0.3, 0.5]);
    b.light(0.06, 1.1, 0, '#ff8a3a', 0.6, 3);
  });
  DECO.add('brasero_pie', { slot: 'block', temas: ['forge', 'crypt'], tags: ['fragua', 'santuario', 'salon', 'barracon', 'tumba', 'guardia'] }, (b) => {
    [0, 2.1, 4.2].forEach((a) => b.box(0.05, 0.8, 0.05, IRON, [Math.cos(a) * 0.32, 0.38, Math.sin(a) * 0.32], [Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3], 'x'));
    b.lathe([[0, 0], [0.12, 0], [0.4, 0.14], [0.46, 0.2], [0.42, 0.22], [0, 0.18]], 12, '#2e2a26', [0, 0.72, 0], null, 'x');
    for (let k = 0; k < 9; k++) b.dode(0.07, k % 3 ? '#ff6a1a' : '#ffb040', [Math.cos(k * 2.4) * 0.22 * (k % 2 ? 0.5 : 1), 0.92, Math.sin(k * 2.4) * 0.22 * (k % 2 ? 0.5 : 1)], [k, k * 2, 0], null, 'g', { k: 2 });
    b.flame(0, 1.32, 0, 0.7, 0.9); b.light(0, 1.4, 0, '#ff7a2a', 1.2, 5.5);
  });
  DECO.add('cristal_gigante', { slot: 'block', temas: ['void'], tags: ['jardin', 'santuario', 'espejos', 'laboratorio', 'tesoro'] }, (b, rnd, o) => {
    const c = o.glow || b.pick(['#b48cff', '#7fd8ff', '#8affe0']);
    b.dode(0.55, '#3a3348', [0, 0.12, 0], [0, 0.4, 0], [1.3, 0.45, 1.2]);
    b.oct(0.36, c, [0, 1.0, 0], [0, 0.3, 0.06], [0.7, 2.3, 0.7], 'g', { k: 1.25 });
    [[0.38, 0.3, 0.6, -0.4], [-0.36, 0.22, 0.5, 0.5], [0.12, -0.42, 0.45, 0.3], [-0.2, -0.3, 0.32, -0.6]].forEach(([x, z, s, t]) => b.oct(0.2, c, [x, 0.3 + s * 0.4, z], [t, 0.4, -t * 0.6], [0.6 * s * 2, 1.9 * s * 2, 0.6 * s * 2], 'g', { k: 1.1 }));
    b.light(0, 1.2, 0, c, 1.2, 5.5);
  });
  DECO.add('planetario', { slot: 'block', temas: ['void'], tags: ['observatorio', 'biblioteca', 'laboratorio'] }, (b) => {
    const BR = '#a8823a';
    b.cyl(0.42, 0.5, 0.12, 12, '#3a3348', [0, 0.06, 0]); b.lathe([[0, 0], [0.16, 0], [0.08, 0.1], [0.06, 0.6], [0.12, 0.72], [0, 0.72]], 10, BR, [0, 0.1, 0], null, 'x');
    b.at([0, 1.25, 0], [0.4, 0.3, 0], (q) => {
      q.tor(0.48, 0.015, BR, [0, 0, 0], [PI / 2, 0, 0], 'x'); q.tor(0.48, 0.012, BR, [0, 0, 0], [0, 0, 0], 'x'); q.tor(0.48, 0.012, BR, [0, 0, 0], [0, PI / 2, 0], 'x'); q.tor(0.34, 0.01, BR, [0, 0, 0], [PI / 2, 0, 0.5], 'x');
      q.sph(0.11, '#ffd070', [0, 0, 0], null, 'g', { k: 2.2 });
      [['#5a8aff', 0.48, 0.4], ['#ff8a5a', 0.48, 2.3], ['#8affc0', 0.34, 4.0], ['#d8c0ff', 0.48, 5.1]].forEach(([c, r, a]) => q.sph(0.05, c, [Math.cos(a) * r, 0, Math.sin(a) * r], null, 'g', { k: 1.6 }));
    });
    b.light(0, 1.3, 0, '#ffd890', 0.8, 4);
  });
})();
