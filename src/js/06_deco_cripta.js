/* ==========================================================================
   Atrezo: arquitectura de muro (vale para todos los temas) y cripta
   --------------------------------------------------------------------------
   Primera parte: pilastras, vigas, arcos, nichos, ventanas, tapices, escudos,
   estantes, faroles… lo que rompe la monotonía de un muro (etiqueta 'arq').
   Segunda parte: las criptas bajo la catedral y sus monjes archiveros
   (tema 'crypt'): osarios, sarcófagos cerrados, altares, pilas, cirios.
   Todo apto para PEGI 7: huesos y calaveras limpios, nada más.
   ========================================================================== */
(() => {
  const PI = Math.PI, H = PI / 2, Q = PI / 4;
  const STONE = '#5e5a52', STONE_D = '#423f39', STONE_L = '#7b766b', WOOD = '#6a4526', WOOD_D = '#4a2f1a', IRON = '#3a3632';
  const BONE = '#d8cdb0', BRASS = '#a8823a', GOLD = '#c79a3a', RED = '#6a1f24', WAX = '#e8dcc0', DARK = '#0e0d0c';
  const MOSS = '#4c5a2e', CLAY = '#8a5a3a', PAGE = '#d9cfb4', FLAME = '#ffb35a';

  /* ------------------------------ ayudas ------------------------------ */
  const _c = new THREE.Color();
  const rgb = (c) => { if (Array.isArray(c)) return c; _c.set(c); return [_c.r, _c.g, _c.b]; };
  const tint = (c, f) => { const v = rgb(c); return [v[0] * f, v[1] * f, v[2] * f]; };
  const q2 = (v) => Math.round(v * 20) / 20;
  /* Formas hechas con una geometría de lado 1 estirada: así las medidas al azar no llenan la caché de G */
  const B = (b, w, h, d, col, pos, rot, kind, o) => b.geo(G.box(1, 1, 1), col, pos, rot, [w, h, d], kind, o);
  const C = (b, rt, rb, h, seg, col, pos, rot, kind, o) => { const m = Math.max(rt, rb); return b.geo(G.cyl(q2(rt / m), q2(rb / m), 1, seg || 8), col, pos, rot, [m, h, m], kind, o); };
  const S = (b, r, col, pos, sc, kind, o, w = 6, h = 4) => b.geo(G.sph(1, w, h), col, pos, null, sc ? [sc[0] * r, sc[1] * r, sc[2] * r] : r, kind, o);
  const O = (b, col, pos, sc, rot, kind, o) => b.geo(G.oct(1), col, pos, rot, sc, kind, o);
  const ring = (b, r, t, col, pos, rot, kind, arc, rs = 4, ts = 8, sc) => b.geo(G.tor(r, t, rs, ts, arc || PI * 2), col, pos, rot, sc || null, kind);
  /* Plano vertical que mira a +z, disco y rombo planos que miran a +z */
  const VP = (b, w, h, col, pos, rot, kind, o) => b.geo(G.k('dcvp', [], () => new THREE.PlaneGeometry(1, 1)), col, pos, rot, [w, h, 1], kind, Object.assign({ ao: 0 }, o));
  const disco = (b, r, col, pos, kind, seg = 10, th = 0.008, sc) => b.geo(G.cyl(1, 1, 1, seg), col, pos, [H, 0, 0], [r * (sc ? sc[0] : 1), th, r * (sc ? sc[1] : 1)], kind, { ao: 0 });
  const rombo = (b, rx, ry, col, pos, kind, th = 0.008) => b.geo(G.cyl(1, 1, 1, 4), col, pos, [H, 0, 0], [rx, th, ry], kind, { ao: 0 });
  /* Tronco de pirámide de base w × d (tapas de arqueta, atriles) */
  const tronco = (b, w, d, h, k, col, pos, kind, o) => b.at(pos, null, (b) => b.geo(G.cyl(q2(k), 1, 1, 4), col, [0, 0, 0], [0, Q, 0], null, kind, o), [w / Math.SQRT2, h, d / Math.SQRT2]);
  /* Barra entre dos puntos (r1 en p1, r2 en p2) */
  const _p = new THREE.Vector3(), _d = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _qt = new THREE.Quaternion(), _eu = new THREE.Euler();
  const seg = (b, p1, p2, r1, r2, col, kind, n = 5, o) => {
    _p.set(p1[0], p1[1], p1[2]); _d.set(p2[0], p2[1], p2[2]).sub(_p); const len = _d.length();
    _qt.setFromUnitVectors(_up, _d.normalize()); _eu.setFromQuaternion(_qt);
    return C(b, r2 == null ? r1 : r2, r1, len, n, col, [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2], [_eu.x, _eu.y, _eu.z], kind, o);
  };
  /* Vela barata (54 triángulos) con su llama */
  const vela = (b, x, y, z, h, r = 0.028, lit = true) => {
    C(b, r * 0.88, r, h, 6, WAX, [x, y + h / 2, z], null, 'm', { ao: 0.14 });
    if (lit) S(b, r * 0.8, FLAME, [x, y + h + r * 1.25, z], [0.8, 1.8, 0.8], 'g', { k: 3 }, 5, 4);
    return b;
  };
  /* Calavera limpia. El origen está en el centro del cráneo; la mandíbula llega a −0.07·s */
  const skull = (b, p, ry = 0, s = 1, rx = 0, fina = false) => b.at(p, [rx, ry, 0], (b) => {
    const c = b.vary(BONE, 0.07);
    S(b, 0.075, c, [0, 0.03, 0], [1, 1.02, 1.15], 'm', { ao: 0.3 }, fina ? 8 : 6, fina ? 5 : 4);
    B(b, 0.084, 0.05, 0.07, tint(c, 0.84), [0, -0.045, 0.032]);
    [-1, 1].forEach((sx) => O(b, DARK, [sx * 0.03, 0.02, 0.076], [0.023, 0.025, 0.014], null, 'm', { ao: 0 }));
    if (fina) B(b, 0.014, 0.022, 0.01, DARK, [0, -0.018, 0.084], null, 'm', { ao: 0 });
  }, s);
  /* Hueso largo (eje en y) */
  const bone = (b, p, rot, len = 0.3, r = 0.02, sy = 1) => b.at(p, rot, (b) => {
    const c = b.vary(BONE, 0.08);
    C(b, r, r, len, 5, c, [0, 0, 0], null, 'm', { ao: 0.1 });
    [-1, 1].forEach((s) => O(b, c, [0, s * len / 2, 0], [r * 2, r * 1.5, r * 1.6], null, 'm', { ao: 0.1 }));
  }, [1, 1, sy]);
  /* Dovela: trozo de anillo centrado en la vertical, de r0 a r1 y fondo d */
  const sector = (r0, r1, half, d, n = 2) => G.k('dcsec', [r0, r1, half, d, n], () => {
    const P = [], pt = (r, a, z) => [r * Math.cos(a), r * Math.sin(a), z], quad = (a, b2, c, e) => P.push(...a, ...b2, ...c, ...a, ...c, ...e);
    for (let i = 0; i < n; i++) {
      const t0 = H - half + (2 * half * i) / n, t1 = H - half + (2 * half * (i + 1)) / n;
      quad(pt(r0, t0, d), pt(r1, t0, d), pt(r1, t1, d), pt(r0, t1, d));
      quad(pt(r1, t0, d), pt(r1, t0, 0), pt(r1, t1, 0), pt(r1, t1, d));
      quad(pt(r0, t0, 0), pt(r0, t0, d), pt(r0, t1, d), pt(r0, t1, 0));
    }
    const a0 = H - half, a1 = H + half;
    quad(pt(r0, a0, 0), pt(r1, a0, 0), pt(r1, a0, d), pt(r0, a0, d));
    quad(pt(r0, a1, d), pt(r1, a1, d), pt(r1, a1, 0), pt(r0, a1, 0));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals(); return g;
  });
  /* Arco de medio punto de n dovelas (n impar: la del centro es la clave), con centro en (0, y) */
  const arco = (b, y, r0, r1, n, d, col, z = 0) => {
    const half = PI / n / 2;
    for (let k = 0; k < n; k++) {
      const key = k === (n - 1) / 2;
      b.geo(sector(r0, r1 + (key ? 0.03 : 0), half - 0.014, q2(d + (key ? 0.02 : k % 2 ? -0.02 : 0)), 2), key ? tint(col, 1.18) : b.vary(col, 0.1), [0, y, z], [0, 0, -H + half + k * 2 * half]);
    }
  };
  /* Hueco con arco (plano que mira a +z): medio ancho hw, tramo recto hr */
  const hueco = (hw, hr, n = 8) => G.k('dchueco', [hw, hr, n], () => { const s = new THREE.Shape(); s.moveTo(-hw, 0); s.lineTo(hw, 0); s.lineTo(hw, hr); s.absarc(0, hr, hw, 0, PI, false); s.lineTo(-hw, 0); return new THREE.ShapeGeometry(s, n); });
  /* Tela colgada con pliegues suaves; las capas (cenefa y campo) usan la misma onda y quedan paralelas */
  const telaZ = (x, y) => 0.05 + 0.012 * Math.sin(x * 11 + y * 2.3) + (2.0 - y) * 0.02;
  const tela = (w, h, yTop, pico = 0) => G.k('dctela', [w, h, yTop, pico], () => {
    const g = new THREE.PlaneGeometry(w, h, 8, 4), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i); let y = p.getY(i) + yTop - h / 2;
      if (pico && y < yTop - h + 0.001) y -= pico * (1 - Math.abs(x) / (w / 2));
      p.setXYZ(i, x, y, telaZ(x, y));
    }
    g.computeVertexNormals(); return g;
  });
  const escudoGeo = () => G.k('dcescudo', [], () => {
    const s = new THREE.Shape(); s.moveTo(-0.3, 0.36); s.lineTo(0.3, 0.36); s.lineTo(0.3, 0.02); s.quadraticCurveTo(0.28, -0.26, 0, -0.42); s.quadraticCurveTo(-0.28, -0.26, -0.3, 0.02); s.lineTo(-0.3, 0.36);
    return new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, curveSegments: 5 });
  });
  /* Libros */
  const LOMOS = ['#6a1f24', '#2c4a3a', '#27405e', '#5a3a1e', '#7a5a22', '#3d2a4a'];
  const libroCerrado = (b, w, h, d, col, pos, rot) => b.at(pos, rot, (b) => {
    B(b, w, h * 0.22, d, col, [0, h * 0.11, 0]); B(b, w, h * 0.22, d, col, [0, h * 0.89, 0]);
    B(b, w - 0.02, h * 0.56, d - 0.015, PAGE, [0.006, h * 0.5, 0]);
  });
  const libroAbierto = (b, w, d, pos, rot, col = '#5a1c1e') => b.at(pos, rot, (b) => {
    B(b, w, 0.018, d, col, [0, 0.009, 0]);
    [-1, 1].forEach((s) => {
      B(b, w * 0.46, 0.03, d * 0.9, PAGE, [s * w * 0.24, 0.032, 0], [0, 0, -s * 0.07]);
      B(b, w * 0.32, 0.004, d * 0.6, '#8f8672', [s * w * 0.24, 0.05, 0], [0, 0, -s * 0.07], 'm', { ao: 0 });
    });
    B(b, 0.018, 0.01, d * 0.6, '#a02a2a', [0.012, 0.045, d * 0.25]);
  });

  /* =====================================================================
     ARQUITECTURA DE MURO (todos los temas)
     ===================================================================== */
  DECO.add('pilastra', { slot: 'wall', tags: ['arq'] }, (b, rnd, o) => {
    const c = o.col || STONE, d = tint(c, 0.7), l = tint(c, 1.2);
    B(b, 0.62, 0.14, 0.22, d, [0, 0.07, 0.11]); B(b, 0.56, 0.07, 0.2, c, [0, 0.175, 0.1]); B(b, 0.5, 0.05, 0.18, l, [0, 0.235, 0.09]);   // basa
    B(b, 0.4, 1.54, 0.13, d, [0, 1.03, 0.065]);                                                                                           // juntas
    const n = 5, h = 1.54 / n;
    for (let k = 0; k < n; k++) { const dd = k % 2 ? 0.145 : 0.165; B(b, k % 2 ? 0.42 : 0.46, h - 0.014, dd, b.vary(c, 0.1), [0, 0.26 + h * (k + 0.5), dd / 2]); }
    B(b, 0.5, 0.06, 0.18, l, [0, 1.83, 0.09]); B(b, 0.56, 0.1, 0.2, c, [0, 1.91, 0.1]); B(b, 0.64, 0.07, 0.22, l, [0, 1.995, 0.11]); B(b, 0.6, 0.07, 0.21, d, [0, 2.065, 0.105]);   // capitel
    rombo(b, 0.04, 0.04, d, [0, 1.91, 0.203], 'm', 0.012);
  });

  DECO.add('viga_madera', { slot: 'wall', tags: ['arq'] }, (b) => {
    const w = b.vary('#5c3d23', 0.1), wd = tint(w, 0.68), wl = tint(w, 1.3);
    B(b, 0.32, 0.14, 0.24, STONE, [0, 0.07, 0.12]);                                    // dado de piedra
    B(b, 0.18, 1.84, 0.17, w, [0, 1.06, 0.105]);                                       // pie derecho
    [-0.045, 0.04].forEach((x, i) => B(b, 0.014, 1.5 - i * 0.4, 0.01, wd, [x, 1.0 + i * 0.1, 0.192], null, 'm', { ao: 0 }));   // vetas
    B(b, 0.9, 0.13, 0.22, wd, [0, 2.035, 0.12]);                                       // zapata bajo el techo
    [-1, 1].forEach((s) => {
      B(b, 0.012, 0.1, 0.19, wl, [s * 0.452, 2.035, 0.12], null, 'm', { ao: 0 });      // testa clara
      b.at([s * 0.225, 1.735, 0.115], [0, 0, -s * Q], (b) => B(b, 0.1, 0.6, 0.12, b.vary(w, 0.08), [0, 0, 0]));   // jabalcón
      B(b, 0.035, 0.035, 0.02, IRON, [s * 0.36, 2.0, 0.235], null, 'x'); B(b, 0.035, 0.035, 0.02, IRON, [s * 0.05, 1.56, 0.195], null, 'x');   // clavos
    });
    [0.34, 1.4].forEach((y) => B(b, 0.2, 0.06, 0.19, IRON, [0, y, 0.105], null, 'x'));  // abrazaderas
  });

  DECO.add('arco_ciego', { slot: 'wall', tags: ['arq'] }, (b, rnd, o) => {
    const c = o.col || STONE, Y = 1.22, R0 = 0.61, R1 = 0.85;
    b.geo(hueco(R0 + 0.03, Y), tint(c, 0.36), [0, 0, 0.012], null, null, 'm', { ao: 0 });
    for (let k = 0; k < 7; k++) { const w = 0.22 + rnd() * 0.2; B(b, w, 0.12, 0.02, tint(c, 0.46 + rnd() * 0.12), [(rnd() - 0.5) * (1.08 - w), 0.18 + k * 0.19 + rnd() * 0.04, 0.018]); }   // sillares del tapiado
    [-1, 1].forEach((s) => {
      B(b, 0.27, 0.1, 0.2, tint(c, 0.75), [s * 0.73, 0.05, 0.1]);
      for (let k = 0; k < 3; k++) { const dd = k % 2 ? 0.15 : 0.175; B(b, k % 2 ? 0.215 : 0.24, 0.338, dd, b.vary(c, 0.1), [s * 0.73, 0.1 + 0.35 * (k + 0.5), dd / 2]); }
      B(b, 0.27, 0.07, 0.19, tint(c, 1.18), [s * 0.73, Y - 0.035, 0.095]);              // imposta
    });
    arco(b, Y, R0, R1, 9, 0.17, c);
  });

  DECO.add('nicho', { slot: 'wall', tags: ['arq'] }, (b, rnd, o) => {
    const c = o.col || STONE, d = tint(c, 0.72), l = tint(c, 1.18), Y = 0.98;
    B(b, 0.9, 0.12, 0.3, d, [0, 0.06, 0.15]);
    B(b, 0.76, 0.76, 0.24, c, [0, 0.5, 0.12]); B(b, 0.5, 0.5, 0.012, d, [0, 0.5, 0.244]); rombo(b, 0.12, 0.12, l, [0, 0.5, 0.252], 'm', 0.01);
    B(b, 0.94, 0.1, 0.34, l, [0, 0.93, 0.17]);                                            // repisa
    b.geo(hueco(0.31, 0.5), tint(c, 0.3), [0, Y, 0.015], null, null, 'm', { ao: 0 });
    [-1, 1].forEach((s) => B(b, 0.13, 0.5, 0.22, b.vary(c, 0.08), [s * 0.375, Y + 0.25, 0.11]));
    arco(b, Y + 0.5, 0.31, 0.44, 5, 0.22, c);
    B(b, 0.2, 0.05, 0.2, l, [0, Y + 0.5 + 0.495, 0.1]);
    const r = rnd(), z = 0.17;
    if (r < 0.34) {                                                                       // urna
      b.lathe([[0.05, 0], [0.07, 0.02], [0.045, 0.05], [0.11, 0.15], [0.12, 0.23], [0.08, 0.3], [0.06, 0.33], [0.075, 0.35], [0, 0.36]], 8, '#4a5a52', [0, Y, z]);
      C(b, 0.122, 0.122, 0.025, 8, BRASS, [0, Y + 0.22, z], null, 'x'); S(b, 0.03, BRASS, [0, Y + 0.385, z], null, 'x');
    } else if (r < 0.67) {                                                                // estatuilla
      B(b, 0.2, 0.05, 0.16, d, [0, Y + 0.025, z]);
      C(b, 0.055, 0.1, 0.3, 6, '#8d887c', [0, Y + 0.2, z]); S(b, 0.055, '#8d887c', [0, Y + 0.4, z]);
      seg(b, [-0.07, Y + 0.3, z], [0, Y + 0.25, z + 0.07], 0.028, 0.022, '#8d887c'); seg(b, [0.07, Y + 0.3, z], [0, Y + 0.25, z + 0.07], 0.028, 0.022, '#8d887c');
    } else {                                                                              // velas
      disco(b, 0.2, '#d8cbb0', [0, Y + 0.004, z], 'm', 8, 1);
      vela(b, -0.12, Y, z + 0.02, 0.2); vela(b, 0.01, Y, z - 0.03, 0.32, 0.032); vela(b, 0.13, Y, z + 0.03, 0.13);
      b.light(0, Y + 0.45, 0.4, FLAME, 0.6, 3);
    }
  });

  DECO.add('ventana_reja', { slot: 'hang', tags: ['arq'] }, (b, rnd, o) => {
    const c = STONE, col = o.col || '#7fa8ff', Y = 1.6, R = 0.3;
    B(b, 0.9, 0.08, 0.2, tint(c, 1.15), [0, 1.06, 0.1]);                                 // alféizar
    b.geo(hueco(R + 0.02, Y - 1.1), col, [0, 1.1, 0.02], null, null, 'g', { k: 1.15 });   // resplandor
    b.geo(hueco(R * 0.55, (Y - 1.1) * 0.8), col, [0, 1.16, 0.026], null, null, 'g', { k: 1.9 });
    [-1, 1].forEach((s) => B(b, 0.13, Y - 1.1, 0.17, b.vary(c, 0.08), [s * (R + 0.065), (Y + 1.1) / 2, 0.085]));
    arco(b, Y, R, R + 0.13, 5, 0.17, c);
    [-0.15, 0, 0.15].forEach((x) => { const top = Y + Math.sqrt(R * R - x * x); C(b, 0.014, 0.014, top - 1.1, 4, IRON, [x, (top + 1.1) / 2, 0.1], null, 'x'); });
    [1.3, 1.55].forEach((y) => C(b, 0.014, 0.014, 2 * R, 4, IRON, [0, y, 0.1], [0, 0, H], 'x'));
    b.light(0, 1.5, 0.5, col, 0.75, 4.5);
  });

  DECO.add('tapiz', { slot: 'hang', tags: ['arq'] }, (b, rnd, o) => {
    const pal = b.pick([[RED, '#b08c3e'], ['#243a5e', '#b9a05a'], ['#2f4a34', '#b08c3e'], ['#4a2a52', '#c0a060']]);
    const c = o.col || pal[0], c2 = o.col2 || pal[1], e = tint(c2, 1.25);
    C(b, 0.02, 0.02, 1.58, 6, IRON, [0, 2.045, 0.1], [0, 0, H], 'x');
    [-1, 1].forEach((s) => { S(b, 0.04, BRASS, [s * 0.8, 2.045, 0.1], null, 'x'); B(b, 0.04, 0.04, 0.1, IRON, [s * 0.74, 2.045, 0.05], null, 'x'); });
    for (let k = -2; k <= 2; k++) B(b, 0.1, 0.1, 0.07, c2, [k * 0.31, 2.035, 0.1]);       // trabillas
    b.geo(tela(1.4, 0.9, 2.0), c2, [0, 0, 0], null, null, 'm', { ao: 0.3 });
    b.geo(tela(1.2, 0.7, 1.9), c, [0, 0, 0.008], null, null, 'm', { ao: 0.3 });
    const z = telaZ(0, 1.55) + 0.026, y = 1.55, v = Math.floor(rnd() * 3);
    if (v === 0) { rombo(b, 0.27, 0.27, e, [0, y, z]); rombo(b, 0.18, 0.18, c, [0, y, z + 0.006]); disco(b, 0.07, e, [0, y, z + 0.012]); }
    else if (v === 1) { disco(b, 0.13, e, [0, y, z + 0.006]); for (let k = 0; k < 8; k++) rombo(b, 0.035, 0.07, e, [Math.cos(k * Q) * 0.22, y + Math.sin(k * Q) * 0.22, z]); disco(b, 0.06, c, [0, y, z + 0.012]); }
    else { rombo(b, 0.24, 0.24, e, [0, y, z]); B(b, 0.34, 0.34, 0.008, e, [0, y, z]); disco(b, 0.11, c, [0, y, z + 0.008]); rombo(b, 0.06, 0.06, e, [0, y, z + 0.014]); }
    [-1, 1].forEach((s) => { rombo(b, 0.05, 0.05, e, [s * 0.47, 1.8, z]); rombo(b, 0.05, 0.05, e, [s * 0.47, 1.3, z + 0.01]); });
    for (let k = -6; k <= 6; k++) VP(b, 0.035, 0.075, tint(c2, 0.85), [k * 0.108, 1.066, telaZ(k * 0.108, 1.1)]);   // flecos
  });

  DECO.add('escudo_armas', { slot: 'hang', tags: ['arq'] }, (b, rnd, o) => {
    const campo = o.col || b.pick([RED, '#243a5e', '#2f4a34', '#3a3a40']), oro = o.col2 || '#b8923e', Y = 1.56;
    [-1, 1].forEach((s) => b.at([0, Y, 0.035], [0, 0, s * 0.72], (b) => {                  // espadas cruzadas
      B(b, 0.055, 0.74, 0.014, '#8d9299', [0, 0.1, 0], null, 'x'); O(b, '#8d9299', [0, 0.47, 0], [0.028, 0.06, 0.008], null, 'x');
      B(b, 0.22, 0.035, 0.035, BRASS, [0, -0.28, 0], null, 'x'); C(b, 0.018, 0.018, 0.13, 5, WOOD_D, [0, -0.36, 0]); S(b, 0.03, BRASS, [0, -0.44, 0], null, 'x');
    }));
    b.geo(escudoGeo(), IRON, [0, Y, 0.05], null, [1, 1, 0.035], 'x');
    b.geo(escudoGeo(), campo, [0, Y - 0.005, 0.07], null, [0.87, 0.87, 0.025]);
    const z = 0.1, v = Math.floor(rnd() * 3);
    if (v === 0) { B(b, 0.5, 0.09, 0.012, oro, [0, Y + 0.12, z]); rombo(b, 0.08, 0.1, oro, [0, Y - 0.1, z], 'm', 0.012); }                      // faja y rombo
    else if (v === 1) { B(b, 0.09, 0.6, 0.012, oro, [0, Y - 0.01, z]); B(b, 0.5, 0.09, 0.012, oro, [0, Y + 0.1, z]); }                            // cruz
    else { [-1, 1].forEach((s) => b.at([s * 0.11, Y + 0.02, z], [0, 0, s * 0.75], (b) => B(b, 0.08, 0.34, 0.012, oro, [0, 0, 0]))); disco(b, 0.05, oro, [0, Y - 0.2, z], 'm', 8, 0.012); }   // cabrio
    S(b, 0.035, BRASS, [0, Y + 0.28, 0.1], [1, 1, 0.6], 'x');
  });

  DECO.add('estandarte', { slot: 'hang', tags: ['arq'] }, (b, rnd, o) => {
    const pal = b.pick([[RED, '#b08c3e'], ['#243a5e', '#c9c2a8'], ['#2f4a34', '#b08c3e'], ['#1f1c22', '#8a2a2a']]);
    const c = o.col || pal[0], c2 = o.col2 || pal[1], e = tint(c2, 1.2);
    C(b, 0.018, 0.018, 0.74, 6, IRON, [0, 2.05, 0.1], [0, 0, H], 'x');
    [-1, 1].forEach((s) => { O(b, BRASS, [s * 0.39, 2.05, 0.1], [0.05, 0.03, 0.03], null, 'x'); B(b, 0.03, 0.03, 0.1, IRON, [s * 0.3, 2.05, 0.05], null, 'x'); });
    b.geo(tela(0.56, 0.72, 2.03, 0.22), c2, [0, 0, 0], null, null, 'm', { ao: 0.3 });
    b.geo(tela(0.42, 0.66, 2.03, 0.17), c, [0, 0, 0.008], null, null, 'm', { ao: 0.3 });
    const z = telaZ(0, 1.6) + 0.026;
    B(b, 0.42, 0.04, 0.008, e, [0, 1.9, z - 0.004]);
    disco(b, 0.12, e, [0, 1.66, z]); rombo(b, 0.075, 0.075, c, [0, 1.66, z + 0.008]);
    rombo(b, 0.045, 0.06, e, [0, 1.42, z + 0.006]);
    C(b, 0.006, 0.006, 0.05, 4, e, [0, 1.065, telaZ(0, 1.09)]); S(b, 0.022, e, [0, 1.035, telaZ(0, 1.09)]);   // borla
  });

  DECO.add('cuadro', { slot: 'hang', tags: ['arq'] }, (b, rnd) => {
    const retrato = rnd() < 0.5, w = retrato ? 0.6 : 0.9, h = retrato ? 0.78 : 0.6, m = 0.075, iw = w - m, ih = h - m;
    b.at([0, 1.56, 0], [0, 0, (rnd() - 0.5) * 0.07], (b) => {
      if (retrato) {
        VP(b, iw, ih, '#2b2420', [0, 0, 0.03]);
        disco(b, 0.21, b.pick(['#5a1d22', '#22385a', '#2c4630']), [0, -0.27, 0.034], 'm', 10, 0.004, [1.1, 0.75]);
        disco(b, 0.105, '#2a1c14', [0, 0.1, 0.036], 'm', 10, 0.004, [1, 0.9]);
        disco(b, 0.09, '#b58d6c', [0, 0.04, 0.04], 'm', 10, 0.004, [0.85, 1.12]);
        rombo(b, 0.05, 0.04, '#cfc6ad', [0, -0.1, 0.044]);
      } else {
        VP(b, iw, ih * 0.6, '#516b82', [0, ih * 0.2, 0.03]); VP(b, iw, ih * 0.4, '#46552f', [0, -ih * 0.3, 0.03]);
        disco(b, 0.055, '#e2c477', [0.2, 0.13, 0.034]);
        rombo(b, 0.22, 0.17, '#3d4652', [-0.18, -0.045, 0.034]); rombo(b, 0.15, 0.11, '#4a5462', [-0.02, -0.05, 0.038]);
        disco(b, 0.2, '#36472a', [0.2, -0.13, 0.042], 'm', 10, 0.004, [1.5, 0.45]);
        B(b, 0.03, 0.12, 0.004, '#2a2019', [0.25, -0.05, 0.046]); disco(b, 0.06, '#2c3d22', [0.25, 0.03, 0.048], 'm', 8, 0.004, [1, 1.2]);
      }
      [-1, 1].forEach((s) => { B(b, m, h + m, 0.06, GOLD, [s * w / 2, 0, 0.03], null, 'x'); B(b, w + m, m, 0.06, GOLD, [0, s * h / 2, 0.03], null, 'x'); });
      [-1, 1].forEach((s) => { B(b, 0.02, ih, 0.05, '#6a5220', [s * (iw / 2 - 0.004), 0, 0.027]); B(b, iw, 0.02, 0.05, '#6a5220', [0, s * (ih / 2 - 0.004), 0.027]); });
      [-1, 1].forEach((sx) => [-1, 1].forEach((sy) => rombo(b, 0.045, 0.045, '#e0b85a', [sx * w / 2, sy * h / 2, 0.062], 'x', 0.012)));
    });
  });

  DECO.add('estante_alto', { slot: 'hang', tags: ['arq'] }, (b, rnd) => {
    const w = b.vary(WOOD, 0.1), Y = 1.32;
    B(b, 1.52, 0.05, 0.2, w, [0, Y - 0.025, 0.1]);
    [-0.56, 0.56].forEach((x) => { B(b, 0.05, 0.26, 0.04, WOOD_D, [x, Y - 0.18, 0.02]); b.at([x, Y - 0.165, 0.095], [0.52, 0, 0], (b) => B(b, 0.04, 0.27, 0.035, WOOD_D, [0, 0, 0])); });
    let x = -0.7, luz = false;
    while (x < 0.56) {
      const r = rnd();
      if (r < 0.45) {                                                                      // libros de pie
        const n = 2 + Math.floor(rnd() * 3);
        for (let k = 0; k < n && x < 0.66; k++) {
          const bw = 0.045 + rnd() * 0.035, bh = 0.2 + rnd() * 0.11, tilt = k === n - 1 && rnd() < 0.5;
          b.at([x + bw / 2 + (tilt ? 0.03 : 0), Y, 0.105], [0, 0, tilt ? 0.24 : 0], (b) => { B(b, bw, bh, 0.15, b.vary(b.pick(LOMOS), 0.15), [0, bh / 2, 0]); B(b, bw + 0.002, 0.018, 0.01, GOLD, [0, bh * 0.76, 0.072], null, 'x'); });
          x += bw + 0.004 + (tilt ? 0.05 : 0);
        }
        x += 0.03;
      } else if (r < 0.6) {                                                                // tarro
        C(b, 0.055, 0.06, 0.15, 7, '#5f8272', [x + 0.07, Y + 0.075, 0.1], null, 'x'); C(b, 0.04, 0.045, 0.035, 7, '#9a7a52', [x + 0.07, Y + 0.167, 0.1]); x += 0.17;
      } else if (r < 0.75) { skull(b, [x + 0.09, Y + 0.07 * 1.15, 0.1], (rnd() - 0.5) * 0.7, 1.15, 0, true); x += 0.21; }
      else if (r < 0.88 && !luz) { C(b, 0.05, 0.035, 0.02, 6, BRASS, [x + 0.06, Y + 0.01, 0.1], null, 'x'); vela(b, x + 0.06, Y + 0.02, 0.1, 0.12 + rnd() * 0.12); luz = true; b.light(x + 0.06, Y + 0.4, 0.3, FLAME, 0.45, 2.8); x += 0.15; }
      else { const lw = 0.2 + rnd() * 0.05; libroCerrado(b, lw, 0.05, 0.15, b.pick(LOMOS), [x + lw / 2, Y, 0.1], [0, (rnd() - 0.5) * 0.3, 0]); if (rnd() < 0.6) libroCerrado(b, lw * 0.85, 0.045, 0.14, b.pick(LOMOS), [x + lw / 2, Y + 0.05, 0.1], [0, (rnd() - 0.5) * 0.5, 0]); x += lw + 0.04; }
    }
  });

  DECO.add('farol_pared', { slot: 'hang', tags: ['arq'] }, (b, rnd, o) => {
    const col = o.col || FLAME, z = 0.13;
    B(b, 0.1, 0.3, 0.025, IRON, [0, 1.9, 0.0125], null, 'x');
    B(b, 0.03, 0.03, 0.17, IRON, [0, 2.02, 0.085], null, 'x'); seg(b, [0, 1.8, 0.02], [0, 2.0, 0.14], 0.012, 0.012, IRON, 'x', 4);
    ring(b, 0.022, 0.007, IRON, [0, 1.985, z], [0, H, 0], 'x', 0, 3, 6); ring(b, 0.022, 0.007, IRON, [0, 1.95, z], null, 'x', 0, 3, 6);
    b.at([0, 0, z], [0, Q, 0], (b) => {
      b.geo(G.cyl(0.15, 1, 1, 4), IRON, [0, 1.885, 0], [0, Q, 0], [0.115, 0.09, 0.115], 'x');   // tejadillo
      B(b, 0.105, 0.2, 0.105, col, [0, 1.74, 0], null, 'g', { k: 1.5 });                          // vidrio encendido
      [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => B(b, 0.016, 0.21, 0.016, IRON, [sx * 0.055, 1.74, sz * 0.055], null, 'x')));
      B(b, 0.135, 0.02, 0.135, IRON, [0, 1.63, 0], null, 'x'); B(b, 0.125, 0.014, 0.125, IRON, [0, 1.74, 0], null, 'x');
      O(b, IRON, [0, 1.6, 0], [0.025, 0.04, 0.025], null, 'x');
    });
    b.light(0, 1.72, 0.4, col, 0.8, 4);
  });

  DECO.add('cadenas_pared', { slot: 'hang', tags: ['arq'] }, (b, rnd) => {
    [[-0.3, 6 + Math.floor(rnd() * 2)], [0.3, 4 + Math.floor(rnd() * 3)]].forEach(([x, n]) => {
      B(b, 0.14, 0.14, 0.03, IRON, [x, 2.0, 0.015], null, 'x'); ring(b, 0.04, 0.012, IRON, [x, 1.97, 0.05], [0, H, 0], 'x', 0, 3, 6);
      for (let k = 0; k < n; k++) ring(b, 0.034, 0.01, b.vary(IRON, 0.2), [x, 1.9 - k * 0.092, 0.055], [0, k % 2 ? H : 0, 0], 'x', 0, 3, 6, [1, 1.5, 1]);
      const y = 1.9 - n * 0.092 - 0.045;
      ring(b, 0.075, 0.016, IRON, [x, y, 0.055], [0, 0, -H - 0.5], 'x', PI * 2 - 0.9, 4, 9);                  // argolla abierta
      B(b, 0.05, 0.035, 0.035, IRON, [x, y + 0.075, 0.055], null, 'x');
    });
  });

  DECO.add('raices', { slot: 'wall', tags: ['arq'] }, (b, rnd) => {
    const col = '#4d3b27', n = 4;
    for (let k = 0; k < n; k++) {
      let x = -0.62 + (1.24 * (k + rnd() * 0.7)) / n, y = 2.04, z = 0.05, r = 0.04 + rnd() * 0.028;
      const c = b.vary(col, 0.18);
      while (y > 0.3) {
        const nx = Math.max(-0.78, Math.min(0.78, x + (rnd() - 0.5) * 0.3)), ny = Math.max(0.24, y - 0.3 - rnd() * 0.16), nz = 0.035 + rnd() * 0.03, nr = Math.max(0.016, r * 0.84);
        seg(b, [x, y, z], [nx, ny, nz], r, nr, c, 'm', 4);
        if (rnd() < 0.4) { const s = rnd() < 0.5 ? -1 : 1; seg(b, [nx, ny, nz], [Math.max(-0.84, Math.min(0.84, nx + s * (0.14 + rnd() * 0.12))), ny - 0.2 - rnd() * 0.1, 0.03], nr * 0.7, 0.008, c, 'm', 4); }
        if (rnd() < 0.55) O(b, b.vary('#44602c', 0.2), [nx + (rnd() - 0.5) * 0.12, ny + 0.03, nz + 0.035], [0.055, 0.02, 0.035], [rnd(), rnd() * 3, rnd()]);
        x = nx; y = ny; z = nz; r = nr;
      }
      const fx = Math.max(-0.82, Math.min(0.82, x + (rnd() - 0.5) * 0.3));
      seg(b, [x, y, z], [(x + fx) / 2, 0.07, 0.1], r, r * 0.75, c, 'm', 4);
      seg(b, [(x + fx) / 2, 0.07, 0.1], [fx, 0.022, 0.18], r * 0.75, 0.01, c, 'm', 4);                         // se abre en el suelo
    }
  });
  /* Grieta: tira quebrada (tres variantes). ex ensancha el contorno para pintar el borde desconchado */
  const grieta = (v, ex) => G.k('dcgrieta', [v, ex], () => {
    let sd = 7 + v * 131; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const n = 8, L = [], R = [], P = []; let cx = (r() - 0.5) * 0.2;
    for (let i = 0; i <= n; i++) {
      const t = i / n, y = 2.07 - t * 1.04, w = 0.01 + Math.pow(Math.sin(PI * t), 0.7) * (0.06 + r() * 0.09) + ex * (i === 0 || i === n ? 0.3 : 1);
      cx += (i % 2 ? 1 : -1) * (0.05 + r() * 0.1);
      L.push([cx - w, y]); R.push([cx + w * (0.6 + r() * 0.8), y]);
    }
    for (let i = 0; i < n; i++) P.push(L[i][0], L[i][1], 0, L[i + 1][0], L[i + 1][1], 0, R[i + 1][0], R[i + 1][1], 0, L[i][0], L[i][1], 0, R[i + 1][0], R[i + 1][1], 0, R[i][0], R[i][1], 0);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals(); g.userData = { L, R }; return g;
  });
  DECO.add('grieta_muro', { slot: 'hang', tags: ['arq'] }, (b, rnd, o) => {
    const c = o.col || STONE, v = Math.floor(rnd() * 3), g = grieta(v, 0), { L, R } = g.userData;
    b.geo(grieta(v, 0.035), tint(c, 0.55), [0, 0, 0.006], null, null, 'm', { ao: 0 });
    b.geo(g, '#070707', [0, 0, 0.012], null, null, 'm', { ao: 0 });
    for (let i = 1; i < 8; i++) {                                                          // cascotes en los bordes
      const s = rnd() < 0.5 ? L : R, sg = s === L ? -1 : 1, r = 0.035 + rnd() * 0.04;
      if (rnd() < 0.8) b.dode(1, b.vary(c, 0.15), [s[i][0] + sg * (r * 0.7 + rnd() * 0.03), s[i][1] + (rnd() - 0.5) * 0.05, 0.02 + r * 0.3], [rnd() * 3, rnd() * 3, 0], [r, r * 0.8, r * 0.7]);
      if (rnd() < 0.35) B(b, 0.16, 0.08, 0.07, b.vary(c, 0.12), [s[i][0] + sg * 0.11, s[i][1], 0.035], [0, sg * 0.25, (rnd() - 0.5) * 0.5]);   // sillar que asoma
    }
    for (let k = 0; k < 3; k++) { const i = 2 + k * 2; b.dode(1, tint(c, 0.6), [(L[i][0] + R[i][0]) / 2, L[i][1] - 0.03, 0.03], [k, k * 2, 0], [0.04, 0.03, 0.025]); }   // piedras dentro
  });

  DECO.add('anaquel_velas', { slot: 'hang', tags: ['arq'] }, (b, rnd, o) => {
    const c = o.col || STONE, Y = 1.2, cera = '#dccfb2';
    B(b, 1.44, 0.08, 0.2, tint(c, 1.12), [0, Y - 0.04, 0.1]); B(b, 1.32, 0.04, 0.16, tint(c, 0.72), [0, Y - 0.1, 0.08]);
    [-0.5, 0.5].forEach((x) => B(b, 0.12, 0.08, 0.13, tint(c, 0.85), [x, 1.05, 0.065]));
    B(b, 1.3, 0.012, 0.17, cera, [0, Y + 0.004, 0.1], null, 'm', { ao: 0 });                // cera derretida
    for (let k = 0; k < 9; k++) {
      const x = -0.6 + k * 0.15 + (rnd() - 0.5) * 0.06, z = 0.06 + rnd() * 0.09, h = 0.07 + rnd() * rnd() * 0.5, r = 0.022 + rnd() * 0.014;
      vela(b, x, Y, z, h, r); C(b, r * 1.25, r * 1.9, 0.02, 6, cera, [x, Y + 0.012, z], null, 'm', { ao: 0 });
      if (rnd() < 0.6) { const len = 0.05 + rnd() * 0.1; C(b, 0.012, 0.016, len, 5, cera, [x + (rnd() - 0.5) * 0.06, Y + 0.01 - len / 2, 0.198], null, 'm', { ao: 0 }); }   // goterón
    }
    b.light(0, 1.65, 0.35, FLAME, 0.9, 4);
  });

  /* =====================================================================
     CRIPTA — de pared
     ===================================================================== */
  DECO.add('nichos_calaveras', { slot: 'wall', temas: ['crypt'], tags: ['osario'] }, (b, rnd) => {
    B(b, 1.74, 1.9, 0.05, '#1b1917', [0, 0.95, 0.025]);
    B(b, 1.78, 0.14, 0.36, STONE_D, [0, 0.07, 0.18]);
    for (let r = 0; r < 3; r++) B(b, 1.74, 0.08, 0.33, b.vary(STONE, 0.08), [0, 0.68 + r * 0.58, 0.165]);
    [-0.83, -0.277, 0.277, 0.83].forEach((x) => B(b, 0.09, 1.66, 0.31, b.vary(STONE, 0.08), [x, 0.97, 0.155]));
    B(b, 1.8, 0.1, 0.38, STONE_L, [0, 1.93, 0.19]); B(b, 1.66, 0.07, 0.34, STONE_D, [0, 2.015, 0.17]);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const x = (c - 1) * 0.553, y = 0.14 + r * 0.58;
      if ((r + c) % 2 === 0) skull(b, [x + (rnd() - 0.5) * 0.06, y + 0.07 * 1.9, 0.19], (rnd() - 0.5) * 0.6, 1.9);
      else [[-0.12, 0.05], [0, 0.05], [0.12, 0.05], [-0.06, 0.145], [0.06, 0.145]].forEach(([dx, dy]) => C(b, 0.05, 0.05, 0.24 + rnd() * 0.04, 5, b.vary(BONE, 0.1), [x + dx, y + dy, 0.17], [H, 0, rnd()], 'm', { ao: 0.25 }));   // huesos apilados (se ven las cabezas)
    }
  });

  DECO.add('lapida', { slot: 'wall', temas: ['crypt'], tags: ['osario', 'capilla', 'pasillo'] }, (b, rnd) => {
    const c = b.vary(STONE_L, 0.08), d = tint(c, 0.45);
    B(b, 0.86, 0.1, 0.3, STONE_D, [-0.12, 0.05, 0.19]);
    b.at([-0.12, 0.08, 0.22], [-0.1, 0, 0], (b) => {
      B(b, 0.64, 0.86, 0.1, c, [0, 0.43, 0]); C(b, 0.32, 0.32, 0.1, 12, c, [0, 0.86, 0], [H, 0, 0]);
      ring(b, 0.25, 0.012, d, [0, 0.86, 0.05], null, 'm', PI, 3, 8);
      if (rnd() < 0.55) { B(b, 0.07, 0.46, 0.012, d, [0, 0.74, 0.052]); B(b, 0.28, 0.07, 0.012, d, [0, 0.82, 0.052]); }       // cruz
      else { rombo(b, 0.09, 0.09, d, [0, 0.86, 0.052], 'm', 0.012); B(b, 0.34, 0.03, 0.012, d, [0, 0.68, 0.052]); }
      for (let k = 0; k < 4; k++) B(b, 0.2 + rnd() * 0.24, 0.028, 0.012, d, [0, 0.42 - k * 0.085, 0.052]);                    // inscripción
      S(b, 0.1, MOSS, [-0.26, 0.06, 0.05], [1.2, 0.6, 0.6]); S(b, 0.07, b.vary(MOSS, 0.2), [0.22, 1.1, 0.02], [1.3, 0.5, 0.8]); S(b, 0.06, MOSS, [0.3, 0.3, 0.05], [0.7, 1.2, 0.5]);
    });
    b.at([0.56, 0.0, 0.16], [-0.16, 0, 0.1], (b) => {                                       // losa pequeña ladeada
      B(b, 0.4, 0.56, 0.08, b.vary(STONE, 0.1), [0, 0.28, 0]); rombo(b, 0.09, 0.12, tint(STONE, 0.5), [0, 0.36, 0.042], 'm', 0.012);
      S(b, 0.07, MOSS, [-0.14, 0.52, 0.02], [1.2, 0.5, 0.7]);
    });
    vela(b, 0.3, 0, 0.3, 0.07, 0.03, false); C(b, 0.05, 0.06, 0.012, 6, '#dccfb2', [0.3, 0.006, 0.3], null, 'm', { ao: 0 });
  });

  DECO.add('sarcofago_pie', { slot: 'wall', temas: ['crypt'], tags: ['osario', 'santuario', 'pasillo', 'tesoro'] }, (b, rnd) => {
    const c = b.vary(STONE, 0.08), f = tint(c, 1.3);
    B(b, 0.92, 0.12, 0.4, STONE_D, [0, 0.06, 0.2]);
    B(b, 0.76, 1.78, 0.28, c, [0, 1.01, 0.14]);
    B(b, 0.84, 0.08, 0.32, STONE_L, [0, 1.94, 0.16]); B(b, 0.6, 0.08, 0.26, STONE_D, [0, 2.02, 0.13]);
    B(b, 0.64, 1.6, 0.04, tint(c, 1.12), [0, 1.02, 0.3]);                                   // tapa
    [0.26, 1.8].forEach((y) => B(b, 0.78, 0.05, 0.33, BRASS, [0, y, 0.165], null, 'x'));    // zunchos
    b.at([0, 0, 0.305], null, (b) => {                                                      // figura tallada
      B(b, 0.36, 0.3, 0.1, tint(c, 0.9), [0, 1.56, 0.05]);
      S(b, 0.11, f, [0, 1.56, 0.1], [1, 1.15, 1], 'm', { ao: 0.3 }, 8, 5);
      C(b, 0.2, 0.12, 1.02, 8, f, [0, 0.93, 0], null, 'm', { ao: 0.4 });
      [-1, 1].forEach((s) => b.at([s * 0.07, 1.2, 0.16], [0, 0, s * 0.75], (b) => B(b, 0.075, 0.3, 0.1, tint(f, 0.92), [0, 0, 0])));
      B(b, 0.26, 0.1, 0.2, tint(f, 0.9), [0, 0.38, 0.06]);
    }, [1, 1, 0.42]);
  });

  DECO.add('estatua_orante', { slot: 'wall', temas: ['crypt'], tags: ['capilla', 'santuario', 'pasillo', 'celdas'] }, (b, rnd) => {
    const c = b.vary('#807b70', 0.06), z = 0.19;
    B(b, 0.58, 0.1, 0.38, STONE_D, [0, 0.05, z]); B(b, 0.46, 0.36, 0.3, STONE, [0, 0.28, z]); B(b, 0.54, 0.07, 0.36, STONE_L, [0, 0.495, z]);
    B(b, 0.3, 0.2, 0.012, STONE_D, [0, 0.28, z + 0.152]);
    b.at([0, 0.53, z], null, (b) => {
      b.lathe([[0.21, 0], [0.2, 0.1], [0.15, 0.5], [0.14, 0.8], [0.17, 0.93], [0.11, 1.03], [0, 1.06]], 8, c, [0, 0, 0], null, 'm', { ao: 0.45 });
      S(b, 0.125, c, [0, 1.12, 0], [1, 1.12, 1.05], 'm', { ao: 0.3 }, 8, 5);                // capucha
      b.cone(0.09, 0.16, 6, c, [0, 1.2, -0.08], [-0.9, 0, 0]);
      S(b, 0.08, '#1a1816', [0, 1.1, 0.075], [0.85, 1.05, 0.7], 'm', { ao: 0 });             // rostro en sombra
      [-1, 1].forEach((s) => seg(b, [s * 0.15, 0.9, 0.02], [s * 0.015, 0.76, 0.19], 0.062, 0.05, tint(c, 0.92), 'm', 6));
      B(b, 0.06, 0.12, 0.05, tint(c, 1.2), [0, 0.81, 0.2], [-0.5, 0, 0]);                   // manos juntas
      C(b, 0.205, 0.205, 0.03, 8, tint(c, 0.75), [0, 0.6, 0]);                              // cíngulo
    }, [1, 1, 0.72]);
    S(b, 0.09, MOSS, [-0.2, 0.1, z + 0.17], [1.2, 0.5, 0.5]);
  });

  DECO.add('relicario', { slot: 'wall', temas: ['crypt'], tags: ['tesoro', 'capilla', 'santuario'] }, (b, rnd) => {
    [-0.42, 0.42].forEach((x) => B(b, 0.16, 0.56, 0.3, b.vary(STONE, 0.08), [x, 0.28, 0.19]));
    B(b, 1.16, 0.1, 0.36, STONE_L, [0, 0.61, 0.19]);
    B(b, 0.56, 0.014, 0.365, RED, [0, 0.667, 0.19]); B(b, 0.56, 0.2, 0.012, RED, [0, 0.572, 0.378]); B(b, 0.56, 0.03, 0.014, GOLD, [0, 0.49, 0.38]);
    b.at([0, 0.674, 0.19], null, (b) => {                                                   // arqueta
      B(b, 0.48, 0.04, 0.25, BRASS, [0, 0.02, 0], null, 'x');
      B(b, 0.42, 0.17, 0.2, GOLD, [0, 0.125, 0], null, 'x');
      tronco(b, 0.46, 0.24, 0.12, 0.4, GOLD, [0, 0.27, 0], 'x');
      B(b, 0.22, 0.02, 0.03, BRASS, [0, 0.34, 0], null, 'x'); S(b, 0.03, GOLD, [0, 0.37, 0], null, 'x');
      [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => C(b, 0.02, 0.02, 0.17, 5, BRASS, [sx * 0.21, 0.125, sz * 0.1], null, 'x')));
      rombo(b, 0.05, 0.065, '#fff0b0', [0, 0.125, 0.103], 'g', 0.01); 
      [-1, 1].forEach((s) => O(b, s < 0 ? '#ff4a4a' : '#4a9aff', [s * 0.13, 0.125, 0.104], [0.025, 0.025, 0.012], null, 'g', { k: 1.6 }));
      O(b, '#5aff9a', [0, 0.27, 0.085], [0.022, 0.022, 0.012], null, 'g', { k: 1.4 });
    });
    [-1, 1].forEach((s) => { C(b, 0.03, 0.05, 0.05, 6, BRASS, [s * 0.44, 0.685, 0.19], null, 'x'); vela(b, s * 0.44, 0.71, 0.19, 0.15 + rnd() * 0.06); });
    b.light(0, 1.05, 0.34, '#ffd27a', 0.7, 3.4);
  });

  DECO.add('atril_coro', { slot: 'wall', temas: ['crypt'], tags: ['capilla', 'archivo'] }, (b, rnd) => {
    const w = b.vary('#5c3d23', 0.08);
    B(b, 0.56, 0.07, 0.36, WOOD_D, [0, 0.035, 0.2]); B(b, 0.4, 0.06, 0.28, w, [0, 0.1, 0.2]);
    C(b, 0.06, 0.085, 1.0, 6, w, [0, 0.63, 0.18]); S(b, 0.1, WOOD_D, [0, 0.62, 0.18], [1, 0.55, 1]);
    b.at([0, 1.22, 0.2], [0.95, 0, 0], (b) => {
      B(b, 0.86, 0.045, 0.44, w, [0, 0, 0]); B(b, 0.86, 0.05, 0.035, WOOD_D, [0, 0.04, 0.205]);
      libroAbierto(b, 0.72, 0.36, [0, 0.022, -0.005]);
    });
    [-1, 1].forEach((s) => {
      seg(b, [s * 0.05, 0.8, 0.18], [s * 0.36, 0.72, 0.2], 0.014, 0.014, IRON, 'x', 4); seg(b, [s * 0.36, 0.72, 0.2], [s * 0.62, 0.9, 0.2], 0.014, 0.014, IRON, 'x', 4);
      C(b, 0.065, 0.03, 0.03, 6, IRON, [s * 0.62, 0.915, 0.2], null, 'x'); vela(b, s * 0.62, 0.93, 0.2, 0.26 + rnd() * 0.08, 0.032);
    });
    b.light(0, 1.5, 0.38, FLAME, 0.65, 3.4);
  });

  DECO.add('pila_agua', { slot: 'wall', temas: ['crypt'], tags: ['capilla', 'celdas', 'pasillo'] }, (b, rnd) => {
    const c = b.vary(STONE_L, 0.06);
    B(b, 0.62, 0.9, 0.06, STONE, [0, 1.35, 0.03]); C(b, 0.31, 0.31, 0.06, 12, STONE, [0, 1.78, 0.03], [H, 0, 0]);       // respaldo con remate redondo
    B(b, 0.06, 0.34, 0.014, BRASS, [0, 1.72, 0.066], null, 'x'); B(b, 0.2, 0.06, 0.014, BRASS, [0, 1.78, 0.066], null, 'x');
    B(b, 0.44, 0.1, 0.34, STONE_D, [0, 0.05, 0.18]);
    C(b, 0.09, 0.13, 0.66, 8, c, [0, 0.43, 0.18]); C(b, 0.13, 0.13, 0.05, 8, STONE, [0, 0.4, 0.18]);
    b.at([0, 0.74, 0.2], null, (b) => {
      b.lathe([[0.08, 0], [0.2, 0.05], [0.3, 0.18], [0.31, 0.27], [0, 0.27]], 10, c, [0, 0, 0], null, 'm', { ao: 0.4 });
      b.tor(0.3, 0.022, tint(c, 1.15), [0, 0.27, 0], [H, 0, 0]);
      C(b, 0.275, 0.275, 0.01, 10, '#3f7f8f', [0, 0.275, 0], null, 'x', { ao: 0 });         // agua
      C(b, 0.1, 0.1, 0.006, 8, '#9fd6e0', [0.05, 0.283, 0.02], null, 'x', { ao: 0 });
    }, [1, 1, 0.62]);
    S(b, 0.08, MOSS, [0.17, 0.1, 0.3], [1.2, 0.5, 0.6]); S(b, 0.05, MOSS, [-0.2, 0.86, 0.3], [1, 0.8, 0.5]);
  });

  DECO.add('banco_iglesia', { slot: 'wall', temas: ['crypt'], tags: ['capilla', 'celdas'] }, (b, rnd) => {
    const w = b.vary('#5c3d23', 0.1), d = tint(w, 0.68);
    B(b, 1.52, 0.06, 0.34, w, [0, 0.46, 0.2]); B(b, 1.52, 0.1, 0.03, d, [0, 0.39, 0.35]);
    B(b, 1.52, 0.5, 0.05, w, [0, 0.76, 0.045]); B(b, 1.56, 0.06, 0.08, d, [0, 1.03, 0.05]);
    for (let k = -3; k <= 3; k++) B(b, 0.012, 0.44, 0.01, d, [k * 0.21, 0.76, 0.073], null, 'm', { ao: 0 });   // tablas del respaldo
    [-1, 1].forEach((s) => {
      B(b, 0.07, 0.98, 0.38, d, [s * 0.79, 0.49, 0.19]); C(b, 0.11, 0.11, 0.07, 8, d, [s * 0.79, 0.98, 0.12], [0, 0, H]);
      S(b, 0.045, BRASS, [s * 0.79, 1.12, 0.12], null, 'x');
    });
    B(b, 0.42, 0.05, 0.27, RED, [-0.4, 0.515, 0.2]); B(b, 0.42, 0.012, 0.275, GOLD, [-0.4, 0.5, 0.2]);        // cojín
    libroCerrado(b, 0.22, 0.05, 0.16, b.pick(LOMOS), [0.35, 0.49, 0.21], [0, 0.3 + rnd() * 0.4, 0]);
  });

  DECO.add('organo_pequeno', { slot: 'wall', temas: ['crypt'], tags: ['capilla', 'santuario'] }, (b, rnd) => {
    const w = b.vary('#5c3d23', 0.08), d = tint(w, 0.65);
    B(b, 1.2, 0.75, 0.32, w, [0, 0.375, 0.17]); B(b, 1.28, 0.08, 0.36, d, [0, 0.04, 0.18]);
    [-0.3, 0.3].forEach((x) => { B(b, 0.44, 0.46, 0.012, d, [x, 0.36, 0.332]); rombo(b, 0.07, 0.1, BRASS, [x, 0.36, 0.342], 'x', 0.01); });
    B(b, 0.84, 0.04, 0.12, d, [0, 0.74, 0.335]); B(b, 0.74, 0.02, 0.085, '#d8d0b8', [0, 0.77, 0.34]);       // teclado
    for (let k = 0; k < 9; k++) if (k % 3 !== 2) B(b, 0.035, 0.016, 0.05, '#1c1917', [-0.32 + k * 0.08, 0.785, 0.325]);
    B(b, 1.26, 0.14, 0.3, d, [0, 0.82, 0.15]);
    for (let k = -5; k <= 5; k++) {                                                          // tubos
      const h = 1.08 - Math.abs(k) * 0.095, x = k * 0.098;
      C(b, 0.04, 0.04, h, 6, k % 2 ? BRASS : GOLD, [x, 0.89 + h / 2, 0.19], null, 'x'); B(b, 0.045, 0.02, 0.01, DARK, [x, 1.03, 0.228], null, 'm', { ao: 0 });
    }
    [-1, 1].forEach((s) => { B(b, 0.08, 1.2, 0.3, w, [s * 0.6, 1.45, 0.15]); B(b, 0.1, 0.06, 0.32, d, [s * 0.6, 2.07, 0.16]); b.at([s * 0.3, 1.75, 0.24], [0, 0, -s * 0.76], (b) => B(b, 0.04, 0.78, 0.03, d, [0, 0, 0])); });
    B(b, 0.1, 0.06, 0.06, BRASS, [0, 2.02, 0.22], null, 'x');
  });

  DECO.add('armario_reliquias', { slot: 'wall', temas: ['crypt'], tags: ['tesoro', 'capilla', 'archivo'] }, (b, rnd) => {
    const w = b.vary('#55381f', 0.08), d = tint(w, 0.65);
    B(b, 1.2, 0.1, 0.38, d, [0, 0.05, 0.19]); B(b, 1.1, 1.78, 0.05, '#17130f', [0, 0.99, 0.025]);
    [-1, 1].forEach((s) => B(b, 0.08, 1.78, 0.34, w, [s * 0.51, 0.99, 0.17]));
    B(b, 0.94, 0.5, 0.32, w, [0, 0.35, 0.17]);                                              // cuerpo bajo cerrado
    [-0.23, 0.23].forEach((x, i) => { B(b, 0.4, 0.36, 0.012, d, [x, 0.35, 0.332]); S(b, 0.022, BRASS, [x + (i ? -0.15 : 0.15), 0.38, 0.345], null, 'x'); });
    [0.62, 1.03, 1.44, 1.86].forEach((y) => B(b, 0.96, 0.04, 0.33, w, [0, y, 0.17]));
    B(b, 1.24, 0.1, 0.4, d, [0, 1.93, 0.2]); B(b, 0.7, 0.08, 0.34, w, [0, 2.02, 0.17]);
    B(b, 0.035, 1.2, 0.03, w, [0, 1.24, 0.325]);                                             // parteluz de la vitrina
    const obj = [
      (x, y) => { C(b, 0.02, 0.05, 0.03, 6, GOLD, [x, y + 0.015, 0.2], null, 'x'); C(b, 0.013, 0.013, 0.08, 5, GOLD, [x, y + 0.07, 0.2], null, 'x'); C(b, 0.06, 0.025, 0.09, 7, GOLD, [x, y + 0.155, 0.2], null, 'x'); },   // cáliz
      (x, y) => { B(b, 0.1, 0.03, 0.08, BRASS, [x, y + 0.015, 0.2], null, 'x'); B(b, 0.03, 0.26, 0.025, GOLD, [x, y + 0.16, 0.2], null, 'x'); B(b, 0.15, 0.03, 0.025, GOLD, [x, y + 0.2, 0.2], null, 'x'); },            // cruz
      (x, y) => { B(b, 0.2, 0.1, 0.13, GOLD, [x, y + 0.05, 0.2], null, 'x'); tronco(b, 0.22, 0.15, 0.07, 0.4, BRASS, [x, y + 0.135, 0.2], 'x'); O(b, '#ff4a4a', [x, y + 0.05, 0.268], [0.02, 0.02, 0.01], null, 'g', { k: 1.5 }); },   // arqueta
      (x, y) => { C(b, 0.03, 0.06, 0.03, 6, BRASS, [x, y + 0.015, 0.2], null, 'x'); C(b, 0.014, 0.014, 0.14, 5, BRASS, [x, y + 0.1, 0.2], null, 'x'); C(b, 0.04, 0.02, 0.02, 6, BRASS, [x, y + 0.175, 0.2], null, 'x'); vela(b, x, y + 0.185, 0.2, 0.09, 0.022, false); },   // candelero
      (x, y) => { disco(b, 0.1, GOLD, [x, y + 0.11, 0.14], 'x', 10, 0.012); disco(b, 0.06, BRASS, [x, y + 0.11, 0.15], 'x', 8, 0.012); B(b, 0.1, 0.02, 0.05, d, [x, y + 0.01, 0.16]); },   // patena
      (x, y) => { C(b, 0.075, 0.07, 0.07, 8, GOLD, [x, y + 0.035, 0.2], null, 'x'); for (let k = 0; k < 4; k++) O(b, k % 2 ? '#4a9aff' : GOLD, [x + Math.cos(k * H + Q) * 0.07, y + 0.085, 0.2 + Math.sin(k * H + Q) * 0.07], [0.018, 0.035, 0.018], null, k % 2 ? 'g' : 'x'); }   // corona
    ];
    const orden = [0, 1, 2, 3, 4, 5].sort(() => rnd() - 0.5);
    [0.64, 1.05, 1.46].forEach((y, r) => [-0.24, 0.24].forEach((x, k) => obj[orden[r * 2 + k]](x + (rnd() - 0.5) * 0.06, y)));
  });

  /* =====================================================================
     CRIPTA — de rincón
     ===================================================================== */
  DECO.add('huesos_monton', { slot: 'corner', temas: ['crypt'], tags: ['osario'] }, (b, rnd) => {
    for (let l = 0; l < 3; l++) {
      const n = 4 - (l > 1 ? 1 : 0), y = 0.035 + l * 0.062;
      for (let k = 0; k < n; k++) {
        const t = 0.12 + (k + 0.5 * (l > 1 ? 1 : 0)) * 0.115 + (rnd() - 0.5) * 0.02;
        if (l % 2) bone(b, [t, y, 0.3], [H, (rnd() - 0.5) * 0.1, 0], 0.4, 0.03); else bone(b, [0.3, y, t], [0, 0, H + (rnd() - 0.5) * 0.1], 0.4, 0.03);
      }
    }
    skull(b, [0.22, 0.2 + 0.07 * 1.25, 0.25], 0.5 + rnd() * 0.3, 1.25, 0, true); skull(b, [0.41, 0.2 + 0.07 * 1.15, 0.36], 1.0 + rnd() * 0.4, 1.15, 0, true);
  });

  DECO.add('cirios', { slot: 'corner', temas: ['crypt'], tags: ['capilla', 'santuario', 'osario', 'archivo'] }, (b, rnd) => {
    const cera = '#dccfb2';
    // el alto, sobre un candelero de hierro
    C(b, 0.05, 0.13, 0.05, 6, IRON, [0.2, 0.025, 0.2], null, 'x'); C(b, 0.02, 0.025, 0.5, 5, IRON, [0.2, 0.3, 0.2], null, 'x'); S(b, 0.04, BRASS, [0.2, 0.3, 0.2], null, 'x'); C(b, 0.1, 0.04, 0.04, 7, IRON, [0.2, 0.56, 0.2], null, 'x');
    vela(b, 0.2, 0.58, 0.2, 0.5 + rnd() * 0.1, 0.06);
    [[0.44, 0.24, 0.62, 0.07], [0.27, 0.46, 0.36, 0.075]].forEach(([x, z, h, r]) => {
      C(b, r * 1.9, r * 2.1, 0.025, 8, BRASS, [x, 0.0125, z], null, 'x'); vela(b, x, 0.025, z, h + rnd() * 0.1, r);
      C(b, r * 1.2, r * 1.6, 0.03, 7, cera, [x, 0.04, z], null, 'm', { ao: 0 });
      for (let k = 0; k < 2; k++) { const a = rnd() * 6.3, len = 0.08 + rnd() * 0.12; C(b, 0.012, 0.016, len, 4, cera, [x + Math.cos(a) * r * 0.95, 0.025 + h - len / 2, z + Math.sin(a) * r * 0.95], null, 'm', { ao: 0 }); }
    });
    b.light(0.32, 1.0, 0.32, FLAME, 0.9, 4.2);
  });

  DECO.add('urna_funeraria', { slot: 'corner', temas: ['crypt'], tags: ['osario', 'tesoro', 'capilla'] }, (b, rnd) => {
    const x = 0.3, z = 0.3, c = b.vary(b.pick(['#3e4f48', '#3a3a44', '#5a4a3a']), 0.08);
    B(b, 0.42, 0.12, 0.42, STONE, [x, 0.06, z]); B(b, 0.34, 0.05, 0.34, STONE_L, [x, 0.145, z]);
    b.lathe([[0.09, 0], [0.11, 0.03], [0.07, 0.08], [0.17, 0.24], [0.2, 0.36], [0.17, 0.47], [0.1, 0.52], [0.13, 0.56], [0, 0.57]], 10, c, [x, 0.17, z], null, 'm', { ao: 0.4 });
    C(b, 0.203, 0.203, 0.035, 10, BRASS, [x, 0.53, z], null, 'x'); C(b, 0.135, 0.135, 0.02, 10, BRASS, [x, 0.735, z], null, 'x');
    C(b, 0.06, 0.11, 0.06, 8, c, [x, 0.77, z]); S(b, 0.04, BRASS, [x, 0.83, z], null, 'x');
    [-1, 1].forEach((s) => b.at([x, 0.6, z], [0, -Q, 0], (b) => ring(b, 0.07, 0.016, c, [s * 0.17, 0, 0], [0, 0, -s * H], 'm', PI, 4, 6)));
  });

  DECO.add('incensario', { slot: 'corner', temas: ['crypt'], tags: ['capilla', 'santuario', 'laboratorio'] }, (b, rnd) => {
    const x = 0.3, z = 0.3;
    [0, 1, 2].forEach((k) => { const a = k * 2.094 + 0.8; seg(b, [x + Math.cos(a) * 0.2, 0.01, z + Math.sin(a) * 0.2], [x + Math.cos(a) * 0.02, 0.62, z + Math.sin(a) * 0.02], 0.018, 0.013, IRON, 'x', 4); });
    ring(b, 0.115, 0.012, IRON, [x, 0.3, z], [H, 0, 0], 'x', 0, 3, 8);
    C(b, 0.022, 0.022, 0.22, 5, IRON, [x, 0.7, z], null, 'x'); S(b, 0.045, BRASS, [x, 0.66, z], null, 'x');
    b.lathe([[0.03, 0], [0.11, 0.04], [0.155, 0.12], [0.16, 0.16], [0, 0.16]], 8, BRASS, [x, 0.8, z], null, 'x');
    C(b, 0.125, 0.125, 0.05, 8, '#ff4a1a', [x, 0.985, z], null, 'g', { k: 2.2 });           // brasa que asoma
    [0, 1, 2, 3].forEach((k) => B(b, 0.025, 0.06, 0.025, BRASS, [x + Math.cos(k * H + Q) * 0.125, 0.985, z + Math.sin(k * H + Q) * 0.125], null, 'x'));
    C(b, 0.03, 0.16, 0.15, 8, BRASS, [x, 1.085, z], null, 'x'); S(b, 0.03, GOLD, [x, 1.18, z], null, 'x');
    b.light(x + 0.05, 1.05, z + 0.05, '#ff5a2a', 0.42, 2.6);
  });

  DECO.add('telarana_rincon', { slot: 'corner', temas: ['crypt'], tags: ['osario', 'bodega', 'pasillo', 'celdas', 'archivo'] }, (b, rnd) => {
    const hilo = '#d6dade', hub = [0.16, 1.82, 0.16];
    const anc = [[0.58, 2.06, 0.012], [0.44, 1.5, 0.012], [0.012, 1.28, 0.012], [0.012, 1.5, 0.44], [0.012, 2.06, 0.58]];
    const th = (p1, p2, r = 0.006) => seg(b, p1, p2, r, r, hilo, 'm', 3, { ao: 0 });
    const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
    anc.forEach((a) => th(hub, a));
    th(anc[0], anc[4], 0.007);                                                              // hilo puente
    const top = lerp(anc[0], anc[4], 0.5);
    th(hub, top);
    [0.3, 0.55, 0.8].forEach((f) => { const pts = anc.map((a) => lerp(hub, a, f + (rnd() - 0.5) * 0.06)).concat([lerp(hub, top, Math.min(0.95, f + 0.1))]); for (let k = 0; k < pts.length; k++) th(pts[k], pts[(k + 1) % pts.length], 0.0045); });
    const sp = lerp(hub, anc[1], 0.45); O(b, '#1a1614', [sp[0] + 0.01, sp[1], sp[2] + 0.02], [0.022, 0.028, 0.018]);   // la inquilina
  });

  DECO.add('vasijas', { slot: 'corner', temas: ['crypt'], tags: ['bodega', 'celdas', 'laboratorio', 'osario'] }, (b, rnd) => {
    const anfora = [[0.07, 0], [0.15, 0.1], [0.19, 0.28], [0.17, 0.44], [0.09, 0.56], [0.08, 0.63], [0.11, 0.66], [0, 0.66]], olla = [[0.08, 0], [0.13, 0.06], [0.145, 0.18], [0.11, 0.28], [0.1, 0.32], [0.12, 0.34], [0, 0.34]];
    const c1 = b.vary(CLAY, 0.1), c2 = b.vary('#7a4a30', 0.1), c3 = b.vary('#9a6a45', 0.1);
    b.lathe(anfora, 10, c1, [0.22, 0, 0.22], null, 'm', { ao: 0.4 }); C(b, 0.085, 0.085, 0.006, 8, '#1a120c', [0.22, 0.662, 0.22], null, 'm', { ao: 0 });
    C(b, 0.193, 0.193, 0.04, 10, tint(c1, 0.6), [0.22, 0.3, 0.22]);
    [-1, 1].forEach((s) => b.at([0.22, 0.52, 0.22], [0, -Q, 0], (b) => ring(b, 0.06, 0.014, c1, [s * 0.13, 0, 0], [0, 0, -s * H], 'm', PI, 4, 6)));
    b.lathe(olla, 9, c2, [0.47, 0, 0.42], null, 'm', { ao: 0.4 }); B(b, 0.2, 0.03, 0.2, '#b8a888', [0.47, 0.35, 0.42], [0, 0.4, 0]); ring(b, 0.105, 0.01, '#6a5a3a', [0.47, 0.31, 0.42], [H, 0, 0], 'm', 0, 3, 8);   // tapada con tela
    b.at([0.48, 0, 0.14], null, (b) => { b.lathe(olla, 9, c3, [0, 0, 0], null, 'm', { ao: 0.4 }); C(b, 0.095, 0.095, 0.006, 8, '#1a120c', [0, 0.342, 0], null, 'm', { ao: 0 }); ring(b, 0.05, 0.012, c3, [0.13, 0.22, 0], [0, 0, -H], 'm', PI, 4, 6); }, 0.72);
    b.at([0.17, 0.045, 0.5], [0, 0.5, 0], (b) => { C(b, 0.1, 0.05, 0.09, 8, c2, [0, 0, 0]); C(b, 0.085, 0.085, 0.006, 8, '#2a1c12', [0, 0.046, 0], null, 'm', { ao: 0 }); });   // cuenco
  });
})();
