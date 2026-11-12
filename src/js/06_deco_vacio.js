/* Atrezo del Ojo de Cristal (observatorio arcano: piedra violeta, latón, cristal y luz fría)
   y cosas colgadas de la forja enana */
(() => {
  const PI = Math.PI, VS = '#3e3852', VS_L = '#544c6e', VS_D = '#2a2538', BRASS = '#a8823a', SILVER = '#b8b8c8', WOOD_D = '#3a2418', IRON = '#3a3632';
  const GLOWS = ['#b48cff', '#7fd8ff', '#8affe0'];
  const V = ['void'];

  /* ---------------- pared ---------------- */
  DECO.add('estanteria_arcana', { slot: 'wall', temas: V, tags: ['biblioteca', 'observatorio', 'laboratorio'] }, (b, rnd) => {
    const fr = '#2a2030';
    [-0.78, 0.78].forEach((x) => b.box(0.07, 2.0, 0.34, fr, [x, 1.0, 0.17])); b.box(1.66, 0.08, 0.36, fr, [0, 2.02, 0.18]); b.box(1.56, 2.0, 0.03, VS_D, [0, 1.0, 0.015]);
    b.box(1.62, 0.1, 0.36, BRASS, [0, 2.1 - 0.05, 0.19], null, 'x');
    [0.06, 0.5, 0.94, 1.38].forEach((y, row) => {
      b.box(1.5, 0.035, 0.32, fr, [0, y, 0.17]);
      let x = -0.72;
      while (x < 0.68) {
        const w = 0.035 + rnd() * 0.05, h = 0.26 + rnd() * 0.14;
        if (rnd() < 0.86) { const glow = rnd() < 0.12; b.box(w, h, 0.22, glow ? b.pick(GLOWS) : b.vary(b.pick(['#2a1d4a', '#1a2a4a', '#3a1a3a', '#4a3a6a', '#1d3a3a']), 0.2), [x + w / 2, y + 0.02 + h / 2, 0.15], [0, 0, rnd() < 0.08 ? 0.2 : 0], glow ? 'g' : 'm', glow ? { k: 1.2 } : undefined); }
        x += w + 0.006;
      }
      if (row === 2) b.sph(0.07, b.pick(GLOWS), [0.5, y + 0.1, 0.18], null, 'g', { k: 1.8 });
    });
    // un libro abierto que flota delante
    b.at([0.1, 1.2, 0.3], [-0.5, 0.2, 0], (q) => { q.box(0.24, 0.02, 0.17, '#2a1d4a', [-0.12, 0, 0], [0, 0, 0.15]); q.box(0.24, 0.02, 0.17, '#2a1d4a', [0.12, 0, 0], [0, 0, -0.15]); q.box(0.22, 0.012, 0.15, '#e8e0f0', [-0.11, 0.017, 0], [0, 0, 0.15]); q.box(0.22, 0.012, 0.15, '#e8e0f0', [0.11, 0.017, 0], [0, 0, -0.15]); });
    b.light(0, 1.2, 0.4, '#b48cff', 0.5, 3);
  });
  DECO.add('espejo_pie', { slot: 'wall', temas: V, tags: ['espejos', 'santuario', 'biblioteca'] }, (b) => {
    b.box(0.9, 1.8, 0.06, BRASS, [0, 1.05, 0.12], null, 'x'); b.box(0.78, 1.66, 0.07, '#141826', [0, 1.05, 0.13], null, 'x');
    b.box(0.08, 1.5, 0.075, '#3a4a6a', [-0.2, 1.05, 0.13], [0, 0, 0.35], 'g', { k: 0.45 });
    b.cone(0.1, 0.18, 6, BRASS, [0, 2.03, 0.12], null, 'x'); b.sph(0.06, '#c0a8ff', [0, 2.07, 0.14], null, 'g', { k: 1.8 });
    [-0.35, 0.35].forEach((x) => b.box(0.1, 0.16, 0.36, BRASS, [x, 0.08, 0.18], null, 'x'));
  });
  DECO.add('mesa_estrellas', { slot: 'wall', temas: V, tags: ['observatorio', 'laboratorio', 'biblioteca'] }, (b, rnd) => {
    b.box(1.5, 0.06, 0.38, '#2a2030', [0, 0.8, 0.19]); [-0.68, 0.68].forEach((x) => [0.04, 0.34].forEach((z) => b.box(0.06, 0.8, 0.06, '#2a2030', [x, 0.4, z])));
    b.box(0.9, 0.01, 0.34, '#141a3a', [-0.2, 0.84, 0.19], [0, 0.05, 0], 'm', { ao: 0 });
    for (let k = 0; k < 18; k++) b.box(0.012, 0.004, 0.012, '#e0e8ff', [-0.6 + rnd() * 0.8, 0.848, 0.05 + rnd() * 0.28], null, 'g', { k: 2 });
    b.cyl(0.05, 0.07, 0.04, 8, BRASS, [0.45, 0.85, 0.2], null, 'x'); b.tor(0.13, 0.008, BRASS, [0.45, 1.0, 0.2], [PI / 2, 0, 0.4], 'x'); b.tor(0.13, 0.008, BRASS, [0.45, 1.0, 0.2], [0.3, 0, 0], 'x'); b.sph(0.035, '#ffd070', [0.45, 1.0, 0.2], null, 'g', { k: 2 });
    [-0.62, 0.66].forEach((x) => { b.cyl(0.04, 0.05, 0.03, 8, SILVER, [x, 0.845, 0.3], null, 'x'); b.cyl(0.025, 0.028, 0.16, 6, '#c8d4ff', [x, 0.94, 0.3]); b.sph(0.022, '#9fb8ff', [x, 1.05, 0.3], [0.8, 1.7, 0.8], 'g', { k: 3 }); });
    b.light(0, 1.1, 0.35, '#9fb8ff', 0.6, 3);
  });
  DECO.add('vitrina_orbes', { slot: 'wall', temas: V, tags: ['tesoro', 'laboratorio', 'santuario', 'espejos'] }, (b) => {
    b.box(1.1, 1.7, 0.36, '#2a2030', [0, 0.85, 0.18]); b.box(0.96, 1.5, 0.3, '#120e1a', [0, 0.92, 0.2]);
    [0.5, 1.0, 1.45].forEach((y, k) => { b.box(0.96, 0.03, 0.3, BRASS, [0, y - 0.18, 0.2], null, 'x'); b.cyl(0.06, 0.08, 0.05, 8, BRASS, [0, y - 0.14, 0.2], null, 'x'); b.sph(0.12, GLOWS[k], [0, y, 0.2], null, 'g', { k: 1.6 }); });
    b.box(1.0, 0.04, 0.02, BRASS, [0, 1.68, 0.37], null, 'x'); b.box(1.0, 0.04, 0.02, BRASS, [0, 0.16, 0.37], null, 'x');
    b.light(0, 1.0, 0.4, '#a8c8ff', 0.7, 3);
  });
  DECO.add('portal_arco', { slot: 'wall', temas: V, tags: ['santuario', 'observatorio', 'espejos', 'pasillo'] }, (b) => {
    [-0.72, 0.72].forEach((x) => { b.box(0.22, 1.5, 0.3, VS_L, [x, 0.75, 0.15]); b.box(0.28, 0.12, 0.34, VS_D, [x, 0.06, 0.17]); });
    for (let k = 0; k <= 8; k++) { const a = PI * (k / 8); b.box(0.22, 0.2, 0.3, k % 2 ? VS_L : '#5e5680', [Math.cos(a) * 0.72, 1.5 + Math.sin(a) * 0.55, 0.15], [0, 0, a - PI / 2]); }
    b.box(1.2, 1.5, 0.02, '#5a2a9a', [0, 0.78, 0.06], null, 'g', { k: 0.9 });
    b.cyl(0.55, 0.55, 0.02, 20, '#8a5aff', [0, 1.5, 0.06], [PI / 2, 0, 0], 'g', { k: 0.9 }, );
    [0.42, 0.28, 0.14].forEach((r, k) => b.tor(r, 0.02, k % 2 ? '#d0b8ff' : '#a070ff', [0, 1.05, 0.08], null, 'g', { k: 1.6 }));
    b.light(0, 1.1, 0.4, '#a070ff', 1.0, 4.5);
  });
  DECO.add('reloj_astronomico', { slot: 'wall', temas: V, tags: ['observatorio', 'biblioteca', 'pasillo'] }, (b) => {
    b.box(0.3, 1.0, 0.2, VS_L, [0, 0.5, 0.1]);
    b.cyl(0.62, 0.62, 0.08, 24, '#1a1830', [0, 1.4, 0.06], [PI / 2, 0, 0]);
    b.tor(0.62, 0.035, BRASS, [0, 1.4, 0.1], null, 'x'); b.tor(0.46, 0.02, BRASS, [0, 1.4, 0.11], null, 'x'); b.tor(0.3, 0.015, SILVER, [0, 1.4, 0.12], null, 'x');
    for (let k = 0; k < 12; k++) { const a = (k / 12) * PI * 2; b.box(0.04, 0.09, 0.02, '#e8d8a0', [Math.cos(a) * 0.54, 1.4 + Math.sin(a) * 0.54, 0.12], [0, 0, a], 'g', { k: 1.1 }); }
    b.box(0.03, 0.42, 0.02, BRASS, [0.1, 1.55, 0.14], [0, 0, -0.5], 'x'); b.box(0.03, 0.3, 0.02, SILVER, [-0.1, 1.48, 0.15], [0, 0, 1.0], 'x');
    b.sph(0.06, '#ffd070', [0, 1.4, 0.15], null, 'g', { k: 2 }); b.sph(0.045, '#c0d0ff', [0.3, 1.62, 0.14], null, 'g', { k: 1.8 });
    b.light(0, 1.4, 0.35, '#e0d0a0', 0.45, 2.5);
  });
  DECO.add('estatua_vidente', { slot: 'wall', temas: V, tags: ['santuario', 'espejos', 'jardin', 'pasillo'] }, (b) => {
    const st = '#7a7290';
    b.box(0.6, 0.3, 0.36, VS_D, [0, 0.15, 0.18]); b.box(0.66, 0.05, 0.38, VS_L, [0, 0.32, 0.19]);
    b.lathe([[0, 0], [0.24, 0], [0.22, 0.5], [0.17, 0.95], [0.12, 1.1], [0, 1.1]], 10, st, [0, 0.34, 0.18]);
    b.sph(0.14, st, [0, 1.5, 0.18], [1, 1.15, 1]); b.cone(0.17, 0.3, 8, st, [0, 1.62, 0.15], [-0.3, 0, 0]);
    b.box(0.08, 0.3, 0.08, st, [-0.12, 1.15, 0.26], [0.9, 0, 0.3]); b.box(0.08, 0.3, 0.08, st, [0.12, 1.15, 0.26], [0.9, 0, -0.3]);
    b.oct(0.1, '#8affe0', [0, 1.24, 0.32], [0.3, 0.5, 0], [1, 1.3, 1], 'g', { k: 1.8 });
    b.light(0, 1.25, 0.4, '#8affe0', 0.7, 3);
  });
  DECO.add('banco_piedra', { slot: 'wall', temas: V, tags: ['jardin', 'pasillo', 'espejos', 'santuario'] }, (b) => {
    b.box(1.4, 0.08, 0.34, VS_L, [0, 0.42, 0.18]); [-0.55, 0.55].forEach((x) => b.box(0.16, 0.38, 0.3, VS, [x, 0.19, 0.18]));
    b.box(1.2, 0.06, 0.28, '#4a2a6a', [0, 0.49, 0.18], null, 'm', { ao: 0.1 });
    b.box(1.4, 0.4, 0.06, VS_L, [0, 0.66, 0.03]);
  });
  DECO.add('jardinera_cristal', { slot: 'wall', temas: V, tags: ['jardin', 'laboratorio', 'santuario'] }, (b, rnd) => {
    b.box(1.5, 0.36, 0.36, VS_L, [0, 0.18, 0.18]); b.box(1.44, 0.04, 0.3, '#1a1422', [0, 0.37, 0.18]);
    for (let k = 0; k < 7; k++) { const c = b.pick(GLOWS), h = 0.3 + rnd() * 0.7; b.oct(0.08, c, [-0.6 + k * 0.2 + (rnd() - 0.5) * 0.06, 0.38 + h / 2, 0.12 + rnd() * 0.12], [(rnd() - 0.5) * 0.4, rnd(), (rnd() - 0.5) * 0.4], [0.7, h / 0.16, 0.7], 'g', { k: 1.15 }); }
    b.light(0, 0.9, 0.35, '#8affe0', 0.8, 3.5);
  });

  /* ---------------- colgado ---------------- */
  DECO.add('mapa_estelar', { slot: 'hang', temas: V, tags: ['observatorio', 'biblioteca', 'pasillo', 'santuario'] }, (b, rnd) => {
    b.box(1.2, 0.8, 0.04, BRASS, [0, 1.55, 0.03], null, 'x'); b.box(1.12, 0.72, 0.045, '#10142e', [0, 1.55, 0.035]);
    const P = []; for (let k = 0; k < 9; k++) P.push([-0.48 + rnd() * 0.96, 1.25 + rnd() * 0.6]);
    P.forEach(([x, y]) => b.oct(0.018, '#e8f0ff', [x, y, 0.065], null, null, 'g', { k: 2.2 }));
    for (let k = 0; k < 6; k++) { const [x0, y0] = P[k], [x1, y1] = P[k + 1], L = Math.hypot(x1 - x0, y1 - y0); b.box(L, 0.005, 0.004, '#8aa8ff', [(x0 + x1) / 2, (y0 + y1) / 2, 0.062], [0, 0, Math.atan2(y1 - y0, x1 - x0)], 'g', { k: 1 }); }
    for (let k = 0; k < 25; k++) b.box(0.008, 0.008, 0.004, '#c0c8e0', [-0.52 + rnd() * 1.04, 1.21 + rnd() * 0.68, 0.06], null, 'g', { k: 1.2 });
  });
  DECO.add('espejo_pared', { slot: 'hang', temas: V, tags: ['espejos', 'biblioteca', 'santuario'] }, (b) => {
    b.at([0, 1.55, 0.04], null, (q) => { q.cyl(0.36, 0.36, 0.05, 20, BRASS, [0, 0, 0], [PI / 2, 0, 0], 'x'); q.cyl(0.31, 0.31, 0.055, 20, '#151a2a', [0, 0, 0.005], [PI / 2, 0, 0], 'x'); q.box(0.05, 0.4, 0.06, '#3a4a6a', [-0.08, 0.04, 0.01], [0, 0, 0.5], 'g', { k: 0.4 }); }, [1, 1.35, 1]);
    b.sph(0.05, '#c0a8ff', [0, 2.07, 0.06], null, 'g', { k: 1.6 });
  });
  DECO.add('cristal_pared', { slot: 'hang', temas: V, tags: ['jardin', 'espejos', 'laboratorio', 'santuario', 'pasillo'] }, (b, rnd, o) => {
    const c = o.glow || b.pick(GLOWS);
    b.dode(0.18, VS_D, [0, 1.4, 0.04], null, [1.6, 1, 0.5]);
    [[0, 0.2, 0], [-0.18, 0.08, 0.6], [0.2, 0.05, -0.7], [0.08, -0.08, -0.3], [-0.1, -0.06, 0.4]].forEach(([x, y, t]) => b.oct(0.07, c, [x, 1.5 + y, 0.1], [0.4, 0, t], [0.8, 2.6, 0.8], 'g', { k: 1.3 }));
    b.light(0, 1.5, 0.3, c, 0.7, 3);
  });
  DECO.add('candelabro_azul', { slot: 'hang', temas: V, tags: ['observatorio', 'biblioteca', 'pasillo', 'espejos', 'jardin', 'laboratorio'] }, (b) => {
    b.box(0.12, 0.3, 0.04, SILVER, [0, 1.45, 0.02], null, 'x');
    b.box(0.5, 0.025, 0.025, SILVER, [0, 1.42, 0.12], null, 'x'); b.box(0.025, 0.025, 0.12, SILVER, [0, 1.42, 0.07], null, 'x');
    [-0.22, 0, 0.22].forEach((x) => { b.cyl(0.04, 0.03, 0.03, 8, SILVER, [x, 1.45, 0.12], null, 'x'); b.cyl(0.022, 0.025, 0.14, 6, '#d8e0ff', [x, 1.53, 0.12]); b.sph(0.024, '#8fa8ff', [x, 1.63, 0.12], [0.8, 1.8, 0.8], 'g', { k: 3 }); });
    b.light(0, 1.6, 0.3, '#8fa8ff', 0.8, 3.5);
  });
  DECO.add('ojo_tallado', { slot: 'hang', temas: V, tags: ['santuario', 'espejos', 'pasillo', 'observatorio'] }, (b) => {
    b.box(0.9, 0.7, 0.05, VS_L, [0, 1.6, 0.025]);
    b.sph(0.32, '#6e6688', [0, 1.6, 0.05], [1.3, 0.55, 0.25]); b.sph(0.13, '#2a1d4a', [0, 1.6, 0.1], [1, 1, 0.4]); b.sph(0.07, '#c08bff', [0, 1.6, 0.13], [1, 1, 0.5], 'g', { k: 2.2 });
    for (let k = 0; k < 7; k++) { const a = PI * (0.15 + k * 0.7 / 6); b.box(0.025, 0.12, 0.02, '#6e6688', [Math.cos(a) * 0.4, 1.6 + Math.sin(a) * 0.28 + 0.04, 0.06], [0, 0, a - PI / 2]); }
    b.light(0, 1.6, 0.3, '#c08bff', 0.5, 2.5);
  });

  /* ---------------- rincón ---------------- */
  DECO.add('cristales_rincon', { slot: 'corner', temas: V, tags: ['jardin', 'santuario', 'espejos', 'laboratorio', 'tesoro', 'pasillo'] }, (b, rnd, o) => {
    const c = o.glow || b.pick(GLOWS);
    b.dode(0.22, VS_D, [0.26, 0.05, 0.26], null, [1.3, 0.5, 1.3]);
    [[0.22, 0.22, 1.1, 0.2], [0.42, 0.2, 0.7, -0.4], [0.2, 0.42, 0.6, 0.5], [0.38, 0.4, 0.45, 0.1]].forEach(([x, z, h, t]) => b.oct(0.09, c, [x, h * 0.5, z], [t, 0.3, -t * 0.5], [0.8, h / 0.18, 0.8], 'g', { k: 1.2 }));
    b.light(0.3, 0.6, 0.3, c, 0.9, 3.5);
  });
  DECO.add('pedestal_orbe', { slot: 'corner', temas: V, tags: ['santuario', 'observatorio', 'tesoro', 'espejos', 'laboratorio'] }, (b, rnd) => {
    const c = b.pick(GLOWS);
    b.lathe([[0, 0], [0.2, 0], [0.2, 0.08], [0.1, 0.16], [0.08, 0.86], [0.16, 0.95], [0, 0.95]], 10, VS_L, [0.3, 0, 0.3]);
    b.tor(0.12, 0.012, BRASS, [0.3, 1.0, 0.3], [PI / 2, 0, 0], 'x'); b.sph(0.13, c, [0.3, 1.1, 0.3], null, 'g', { k: 1.7 });
    b.light(0.3, 1.1, 0.3, c, 0.8, 3.5);
  });
  DECO.add('obelisco', { slot: 'corner', temas: V, tags: ['santuario', 'jardin', 'pasillo', 'espejos'] }, (b) => {
    b.box(0.46, 0.14, 0.46, VS_D, [0.3, 0.07, 0.3]); b.cyl(0.08, 0.17, 1.5, 4, VS_L, [0.3, 0.89, 0.3], [0, PI / 4, 0]); b.cone(0.08, 0.16, 4, '#6e6688', [0.3, 1.72, 0.3], [0, PI / 4, 0]);
    [0.5, 0.85, 1.2].forEach((y) => b.box(0.05, 0.08, 0.012, '#b48cff', [0.3, y, 0.3 + 0.14 - y * 0.04], null, 'g', { k: 1.6 }));
    b.light(0.3, 1.0, 0.45, '#b48cff', 0.4, 2.5);
  });
  DECO.add('telescopio', { slot: 'corner', temas: V, tags: ['observatorio', 'biblioteca'] }, (b) => {
    [0, 2.1, 4.2].forEach((a) => b.box(0.03, 0.9, 0.03, '#3a2a20', [0.3 + Math.cos(a) * 0.14, 0.43, 0.3 + Math.sin(a) * 0.14], [Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3]));
    b.at([0.3, 0.92, 0.3], [0, PI / 4, 0.7], (q) => { q.cyl(0.05, 0.065, 0.62, 10, BRASS, [0, 0.1, 0], null, 'x'); q.cyl(0.07, 0.07, 0.04, 10, '#5a4a2a', [0, 0.42, 0], null, 'x'); q.cyl(0.03, 0.03, 0.08, 8, BRASS, [0, -0.25, 0], null, 'x'); });
  });
  DECO.add('globo_celeste', { slot: 'corner', temas: V, tags: ['observatorio', 'biblioteca', 'tesoro'] }, (b) => {
    b.lathe([[0, 0], [0.18, 0], [0.12, 0.06], [0.05, 0.12], [0.04, 0.56], [0, 0.56]], 10, '#3a2a20', [0.3, 0, 0.3]);
    b.tor(0.24, 0.012, BRASS, [0.3, 0.82, 0.3], [0, PI / 4, 0.4], 'x'); b.sph(0.21, '#1a2a5a', [0.3, 0.82, 0.3]);
    for (let k = 0; k < 10; k++) { const a = k * 2.4, e = (k % 5) * 0.3 - 0.6; b.box(0.015, 0.015, 0.015, '#ffe8a0', [0.3 + Math.cos(a) * Math.cos(e) * 0.215, 0.82 + Math.sin(e) * 0.215, 0.3 + Math.sin(a) * Math.cos(e) * 0.215], null, 'g', { k: 2 }); }
  });
  DECO.add('libros_flotantes', { slot: 'corner', temas: V, tags: ['biblioteca', 'observatorio', 'laboratorio'] }, (b, rnd) => {
    [[0.25, 0.9, 0.3], [0.38, 1.25, 0.22], [0.2, 1.5, 0.4]].forEach(([x, y, z], k) => b.at([x, y, z], [rnd() * 0.4, rnd() * 3, rnd() * 0.3], (q) => { q.box(0.2, 0.05, 0.28, b.pick(['#2a1d4a', '#4a2a2a', '#1d3a3a']), [0, 0, 0]); q.box(0.18, 0.045, 0.27, '#e8e0d0', [0.012, 0, 0]); }));
    b.cyl(0.18, 0.18, 0.01, 12, '#b48cff', [0.3, 0.01, 0.3], null, 'g', { k: 0.8 });
    b.light(0.3, 1.0, 0.3, '#b48cff', 0.5, 2.5);
  });

  /* ---------------- forja: cosas colgadas ---------------- */
  const F = ['forge'];
  DECO.add('herramientas_pared', { slot: 'hang', temas: F, tags: ['fragua', 'armeria', 'mina', 'pasillo'] }, (b) => {
    b.box(1.1, 0.7, 0.04, '#4a3020', [0, 1.5, 0.02]); [1.25, 1.75].forEach((y) => b.box(1.1, 0.06, 0.05, WOOD_D, [0, y, 0.045]));
    [[-0.38, 0.1], [-0.12, -0.1], [0.14, 0.15], [0.38, -0.05]].forEach(([x, t], k) => b.at([x, 1.62, 0.08], [0, 0, t], (q) => {
      q.box(0.035, 0.42, 0.03, '#6a4526', [0, -0.08, 0]);
      if (k % 2) { q.box(0.16, 0.08, 0.06, IRON, [0, 0.14, 0], null, 'x'); } else { q.box(0.03, 0.34, 0.02, IRON, [0.03, -0.05, 0], [0, 0, 0.1], 'x'); q.box(0.03, 0.34, 0.02, IRON, [-0.03, -0.05, 0], [0, 0, -0.1], 'x'); }
    }));
  });
  DECO.add('engranajes', { slot: 'hang', temas: F, tags: ['fragua', 'salon', 'mina', 'pasillo', 'tumba'] }, (b) => {
    const gear = (x, y, r, col, n) => { b.cyl(r, r, 0.06, 16, col, [x, y, 0.05], [PI / 2, 0, 0], 'x'); b.cyl(r * 0.3, r * 0.3, 0.08, 10, '#2a2826', [x, y, 0.06], [PI / 2, 0, 0], 'x'); for (let k = 0; k < n; k++) { const a = (k / n) * PI * 2; b.box(0.07, r * 0.25, 0.06, col, [x + Math.cos(a) * r, y + Math.sin(a) * r, 0.05], [0, 0, a - PI / 2], 'x'); } };
    gear(-0.2, 1.55, 0.32, '#5a4a3a', 12); gear(0.3, 1.32, 0.2, '#a8823a', 8); gear(0.32, 1.82, 0.14, '#6a5a4a', 7);
  });
  DECO.add('estandarte_orco', { slot: 'hang', temas: F, tags: ['barracon', 'armeria', 'taberna', 'pasillo'] }, (b) => {
    b.cyl(0.02, 0.02, 0.9, 6, WOOD_D, [0, 2.0, 0.08], [0, 0, PI / 2]);
    b.box(0.72, 0.9, 0.02, '#5a1414', [0, 1.52, 0.08], [0.02, 0, 0.02]); b.box(0.2, 0.18, 0.02, '#5a1414', [-0.24, 1.0, 0.08], [0, 0, 0.3]); b.box(0.2, 0.2, 0.02, '#5a1414', [0.22, 0.99, 0.08], [0, 0, -0.25]);
    b.box(0.3, 0.06, 0.025, '#d8c8a0', [0, 1.62, 0.09], [0, 0, 0.6]); b.box(0.3, 0.06, 0.025, '#d8c8a0', [0, 1.62, 0.09], [0, 0, -0.6]); b.cyl(0.08, 0.08, 0.026, 10, '#d8c8a0', [0, 1.38, 0.09], [PI / 2, 0, 0]);
    [-0.35, 0.35].forEach((x) => b.cyl(0.006, 0.006, 0.3, 3, '#8a7a5a', [x * 0.6, 2.12, 0.08], [0, 0, x > 0 ? -0.8 : 0.8]));
  });
  DECO.add('lampara_enana', { slot: 'hang', temas: F, tags: ['salon', 'tumba', 'mina', 'pasillo', 'armeria', 'taberna'] }, (b) => {
    b.box(0.1, 0.12, 0.03, IRON, [0, 1.75, 0.015], null, 'x'); b.box(0.03, 0.03, 0.18, IRON, [0, 1.75, 0.1], null, 'x');
    b.cyl(0.1, 0.07, 0.05, 8, '#a8823a', [0, 1.7, 0.18], null, 'x'); b.cyl(0.07, 0.08, 0.2, 8, '#6ad8d0', [0, 1.57, 0.18], null, 'g', { k: 1.5 }); b.cyl(0.09, 0.06, 0.04, 8, '#a8823a', [0, 1.45, 0.18], null, 'x');
    b.light(0, 1.55, 0.35, '#6ad8d0', 0.75, 3.5);
  });
  DECO.add('runa_enana', { slot: 'hang', temas: F, tags: ['salon', 'tumba', 'santuario', 'fragua'] }, (b) => {
    b.box(0.6, 0.7, 0.06, '#5e4a40', [0, 1.5, 0.03]); b.box(0.66, 0.06, 0.08, '#4a3830', [0, 1.88, 0.04]); b.box(0.66, 0.06, 0.08, '#4a3830', [0, 1.12, 0.04]);
    [[0, 1.5, 0.42, 0], [0, 1.6, 0.26, PI / 2], [-0.1, 1.38, 0.2, 0.7], [0.1, 1.38, 0.2, -0.7]].forEach(([x, y, l, a]) => b.box(0.035, l, 0.012, '#ff8a3a', [x, y, 0.065], [0, 0, a], 'g', { k: 1.8 }));
    b.light(0, 1.5, 0.3, '#ff8a3a', 0.45, 2.5);
  });
})();
