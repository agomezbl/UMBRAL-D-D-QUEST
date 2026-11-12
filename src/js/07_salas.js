/* ==========================================================================
   Salas con carácter: cada sala recibe un estilo (capilla, osario, archivo,
   fragua, observatorio…) que decide su suelo, el color de su luz y los
   muebles y adornos que lleva. Todo es decorado: nada de lo que se coloca aquí
   cambia por dónde se puede andar (los muebles van pegados a los muros, en los
   rincones, planos en el suelo o sobre casillas que ya estaban bloqueadas).
   ========================================================================== */
const SALAS = {
  /* suelo: clase de TEX.floorKind · tinte: color que multiplica el suelo · luz: color de la sala
     fondo: cuánta luz de ese color llena la sala · antorcha: color de sus antorchas (si no, el del lugar)
     tags: etiquetas de las piezas de DECO que le van · arq: refuerzo de los muros · tela: colores de alfombras y tapices
     manchas: dibujos de TEX.decals para el suelo */
  ESTILOS: {
    crypt: {
      archivo: { suelo: 'tablas', tinte: [1.0, 0.86, 0.68], luz: '#ffb060', fondo: 0.2, tags: ['archivo'], arq: 'viga_madera', tela: ['#6a1f24', '#c9a24a'], alfombra: 'alfombra', manchas: ['hojas', 'arena', 'grietas'] },
      capilla: { suelo: 'mosaico', tinte: [1.05, 0.96, 0.8], luz: '#ffc87a', fondo: 0.2, tags: ['capilla'], arq: 'arco_ciego', tela: ['#5a1a22', '#c9a24a'], alfombra: 'alfombra_capilla', manchas: ['grietas', 'arena', 'humedad'] },
      osario: { suelo: 'adoquin', tinte: [0.86, 0.96, 0.9], luz: '#8fd8b0', fondo: 0.12, antorcha: '#b8ffd0', llama: ['#e8ffe8', '#3fd080'], tags: ['osario'], arq: 'pilastra', tela: ['#2a3a2a', '#b8b08a'], manchas: ['musgo', 'humedad', 'losa_rota', 'raices'] },
      nichos: { suelo: 'losas4', tinte: [0.84, 0.92, 1.05], luz: '#8fb4ff', fondo: 0.18, tags: ['osario', 'capilla'], arq: 'arco_ciego', tela: ['#1f2a4a', '#b8b8c8'], manchas: ['humedad', 'grietas2', 'arena'] },
      guardia: { suelo: 'losas4', tinte: [1.0, 0.9, 0.84], luz: '#ff8a4a', fondo: 0.18, tags: ['guardia'], arq: 'pilastra', tela: ['#6a1f24', '#8a8f96'], manchas: ['hollin', 'grietas', 'paja'] },
      bodega: { suelo: 'tierra', tinte: [1.0, 0.88, 0.74], luz: '#e8a060', fondo: 0.16, tags: ['bodega'], arq: 'viga_madera', tela: ['#4a3020', '#a8823a'], manchas: ['paja', 'humedad', 'charco'] },
      laboratorio: { suelo: 'hexagonos', tinte: [0.9, 0.88, 1.08], luz: '#b48cff', fondo: 0.2, tags: ['laboratorio'], arq: 'pilastra', tela: ['#2a1d4a', '#8affb0'], manchas: ['charco', 'tiza', 'hollin'] },
      celdas: { suelo: 'ladrillo', tinte: [1.02, 0.86, 0.74], luz: '#ffa860', fondo: 0.16, tags: ['celdas', 'archivo'], arq: 'viga_madera', tela: ['#3a2a4a', '#c9a24a'], alfombra: 'alfombra', manchas: ['paja', 'arena', 'hojas'] },
      tesoro: { suelo: 'ajedrez', tinte: [1.08, 0.96, 0.7], luz: '#ffd060', fondo: 0.24, tags: ['tesoro'], arq: 'pilastra', tela: ['#6a1f24', '#e0b84a'], alfombra: 'alfombra', manchas: ['monedas', 'arena'] },
      pasillo: { suelo: 'losa', tinte: [0.92, 0.96, 1.0], luz: '#ff9a4a', fondo: 0.12, tags: ['pasillo'], arq: 'pilastra', tela: ['#5a1a22', '#c9a24a'], manchas: ['grietas', 'arena', 'huellas'] },
      santuario: { suelo: 'mosaico', tinte: [0.86, 0.95, 0.9], luz: '#6ad8a0', fondo: 0.13, antorcha: '#a8ffc8', llama: ['#d8ffe0', '#2fd070'], tags: ['santuario', 'capilla', 'osario'], arq: 'arco_ciego', tela: ['#10301f', '#6dffb0'], manchas: ['tiza', 'losa_rota', 'grietas2'] }
    },
    forge: {
      fragua: { suelo: 'chapa', tinte: [1.08, 0.86, 0.72], luz: '#ff7a2a', fondo: 0.22, tags: ['fragua'], arq: 'pilastra', tela: ['#2a2a30', '#c26a2e'], manchas: ['hollin', 'cenizas', 'grietas'] },
      mina: { suelo: 'tierra', tinte: [1.0, 0.86, 0.72], luz: '#ffb060', fondo: 0.16, tags: ['mina'], arq: 'viga_madera', tela: ['#4a3020', '#a8823a'], manchas: ['losa_rota', 'arena', 'grietas2'] },
      barracon: { suelo: 'tablas', tinte: [1.0, 0.8, 0.7], luz: '#ff5a3a', fondo: 0.18, tags: ['barracon'], arq: 'viga_madera', tela: ['#5a1414', '#2a2a2a'], manchas: ['paja', 'cenizas', 'huellas'] },
      salon: { suelo: 'ajedrez', tinte: [0.9, 0.96, 0.96], luz: '#6ad8d0', fondo: 0.13, antorcha: '#7fe8e0', llama: ['#e0fffa', '#2fb0a8'], tags: ['salon'], arq: 'pilastra', tela: ['#14323a', '#c9a24a'], alfombra: 'alfombra', manchas: ['grietas', 'arena'] },
      tumba: { suelo: 'mosaico', tinte: [0.84, 0.94, 1.05], luz: '#7fb0ff', fondo: 0.2, antorcha: '#9fc4ff', llama: ['#e8f0ff', '#4a7aff'], tags: ['salon', 'santuario'], arq: 'arco_ciego', tela: ['#1a2a4a', '#c9a24a'], manchas: ['grietas2', 'arena'] },
      taberna: { suelo: 'tablas', tinte: [1.05, 0.88, 0.7], luz: '#ffb060', fondo: 0.2, tags: ['taberna', 'bodega'], arq: 'viga_madera', tela: ['#6a1f24', '#c9a24a'], alfombra: 'alfombra', manchas: ['charco', 'paja'] },
      armeria: { suelo: 'losas4', tinte: [1.0, 0.9, 0.82], luz: '#ff9a4a', fondo: 0.18, tags: ['armeria', 'guardia'], arq: 'pilastra', tela: ['#2a2a30', '#c26a2e'], manchas: ['hollin', 'grietas'] },
      tesoro: { suelo: 'mosaico', tinte: [1.1, 0.95, 0.68], luz: '#ffd060', fondo: 0.24, tags: ['tesoro'], arq: 'pilastra', tela: ['#6a1f24', '#e0b84a'], alfombra: 'alfombra', manchas: ['monedas', 'arena'] },
      pasillo: { suelo: 'losa', tinte: [1.0, 0.92, 0.86], luz: '#ff8a3a', fondo: 0.12, tags: ['pasillo'], arq: 'pilastra', tela: ['#2a2a30', '#c26a2e'], manchas: ['grietas', 'hollin', 'huellas'] },
      santuario: { suelo: 'chapa', tinte: [1.1, 0.8, 0.66], luz: '#ff5a1a', fondo: 0.22, tags: ['santuario', 'fragua'], arq: 'pilastra', tela: ['#3a0a0a', '#ff8a3a'], manchas: ['cenizas', 'hollin', 'grietas2'] }
    },
    void: {
      observatorio: { suelo: 'mosaico', tinte: [0.86, 0.94, 1.12], luz: '#7fa8ff', fondo: 0.22, antorcha: '#9fb8ff', llama: ['#e8f0ff', '#4a7aff'], tags: ['observatorio'], arq: 'pilastra', tela: ['#1a2452', '#c8d0e8'], alfombra: 'alfombra_arcana', manchas: ['tiza', 'cristalitos'] },
      biblioteca: { suelo: 'espiga', tinte: [1.0, 0.86, 1.05], luz: '#b48cff', fondo: 0.2, tags: ['biblioteca'], arq: 'arco_ciego', tela: ['#2a1d4a', '#b9a2ff'], alfombra: 'alfombra_arcana', manchas: ['hojas', 'charco', 'humedad'] },
      espejos: { suelo: 'ajedrez', tinte: [0.86, 0.88, 0.98], luz: '#c8d8ff', fondo: 0.13, antorcha: '#d8e4ff', llama: ['#ffffff', '#8aa8ff'], tags: ['espejos'], arq: 'pilastra', tela: ['#2a2a4a', '#d8c88a'], manchas: ['cristalitos', 'grietas'] },
      jardin: { suelo: 'cristal', tinte: [0.8, 1.1, 1.05], luz: '#6affd8', fondo: 0.22, antorcha: '#8affe0', llama: ['#e0fff8', '#2fc8a8'], tags: ['jardin'], arq: 'pilastra', tela: ['#103a3a', '#8affe0'], manchas: ['cristalitos', 'raices', 'musgo'] },
      laboratorio: { suelo: 'hexagonos', tinte: [0.86, 1.05, 0.92], luz: '#8affb0', fondo: 0.2, tags: ['laboratorio', 'observatorio'], arq: 'pilastra', tela: ['#14323a', '#8affb0'], manchas: ['tiza', 'charco'] },
      tesoro: { suelo: 'ajedrez', tinte: [1.1, 0.96, 0.74], luz: '#ffd060', fondo: 0.24, antorcha: '#ffd890', llama: ['#fff4d0', '#ffb030'], tags: ['tesoro'], arq: 'pilastra', tela: ['#3a1d4a', '#e0b84a'], alfombra: 'alfombra_arcana', manchas: ['monedas', 'cristalitos'] },
      pasillo: { suelo: 'losa', tinte: [0.94, 0.9, 1.1], luz: '#a98bff', fondo: 0.14, tags: ['pasillo'], arq: 'pilastra', tela: ['#2a1d4a', '#b9a2ff'], manchas: ['grietas', 'cristalitos'] },
      santuario: { suelo: 'cristal', tinte: [1.0, 0.86, 1.12], luz: '#c08bff', fondo: 0.24, tags: ['santuario', 'observatorio'], arq: 'arco_ciego', tela: ['#2a0d4a', '#e0c8ff'], manchas: ['tiza', 'cristalitos', 'grietas2'] }
    }
  },
  PARED: { crypt: 'silleria', forge: 'ladrillo', void: 'paneles' },
  ESTRUCTURA: ['pilastra', 'viga_madera', 'arco_ciego'],
  DENS: { minimo: 0.55, bajo: 0.8, medio: 1, alto: 1 },

  /* Decide el estilo de cada sala. El guion puede fijarlo (rooms: { '4': { style: 'osario' } }) */
  assign(L, def, theme) {
    const E = this.ESTILOS[theme.id], ids = Object.keys(E), rnd = U.mulberry(theme.seed * 131 + L.w * 7 + L.h * 13 + L.rooms.length);
    const libres = ids.filter((k) => !['pasillo', 'santuario', 'tesoro', 'nichos', 'tumba'].includes(k));
    for (let i = libres.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [libres[i], libres[j]] = [libres[j], libres[i]]; }
    let turno = 0, tesoros = 0;
    L.rooms.forEach((room) => {
      let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
      room.tiles.forEach((t) => { x0 = Math.min(x0, t.x); x1 = Math.max(x1, t.x); y0 = Math.min(y0, t.y); y1 = Math.max(y1, t.y); });
      room.bw = x1 - x0 + 1; room.bh = y1 - y0 + 1;
      const meta = def.rooms && room.marker && def.rooms[room.marker];
      let id = meta && meta.style;
      if (!id || !E[id]) {
        if (room.boss) id = 'santuario';
        else if (Math.min(room.bw, room.bh) <= 2 || room.tiles.length <= 8) id = 'pasillo';
        else if (!tesoros && room.tiles.length <= 24 && room.tiles.some((t) => t.ch === 'C') && !room.tiles.some((t) => /[123]/.test(t.ch))) { id = 'tesoro'; tesoros++; }
        else {
          // el siguiente de la lista que no tenga ya una sala vecina
          const vecinos = new Set(); room.doors.forEach((d) => d.rooms.forEach((ri) => { const q = L.rooms[ri]; if (q && q.style) vecinos.add(q.style.id); }));
          for (let k = 0; k < libres.length; k++) { id = libres[(turno + k) % libres.length]; if (!vecinos.has(id)) { turno += k + 1; break; } }
        }
      }
      room.style = Object.assign({ id }, E[id]);
    });
  },

  /* Piezas de un hueco para un estilo: las de sus etiquetas y, si se pide, las generales ('arq') */
  pool(slot, theme, st, general) {
    const out = new Set();
    st.tags.forEach((tag) => DECO.list(slot, theme.id, tag).forEach((n) => out.add(n)));
    if (general) DECO.list(slot, theme.id, 'arq').forEach((n) => { if (!this.ESTRUCTURA.includes(n)) out.add(n); });
    return [...out];
  },
  /* Elige de una lista procurando no repetir: de dos candidatos al azar, el menos usado */
  choose(list, rnd, uso) {
    if (!list.length) return null;
    const a = list[Math.floor(rnd() * list.length)], b = list[Math.floor(rnd() * list.length)];
    const n = (uso[a] || 0) <= (uso[b] || 0) ? a : b; uso[n] = (uso[n] || 0) + 1; return n;
  },
  opts(st) { return { col: st.tela[0], col2: st.tela[1] }; },

  /* Amuebla una sala. Devuelve las piezas colocadas ({ res, m }) para fundirlas en una sola malla */
  furnish(room, L, theme, dens = 1) {
    const T = L.T, st = room.style, items = [], uso = {};
    if (typeof DECO === 'undefined') return items;
    const rnd = U.mulberry(theme.seed * 977 + room.id * 131 + room.tiles.length * 17 + Math.round(room.cx * 10));
    const at = (x, y) => T[y] && T[y][x];
    // cualquier casilla de suelo sin objeto encima vale (también donde empiezan enemigos o hay marcas de la historia)
    const plain = (t) => t && t.floor && !t.block && !t.trap && !t.hazard;
    const torch = (t, dx, dy) => (room.wallUsed || []).some((q) => q.t === t && q.dx === dx && q.dy === dy);
    const nearDoor = (t, dx, dy) => [[dy, dx], [-dy, -dx]].some(([sx, sy]) => { const q = at(t.x + sx, t.y + sy), w = at(t.x + sx + dx, t.y + sy + dy); return (q && q.door) || (w && w.door); });
    const put = (name, x, z, ry, o) => {
      const res = DECO.make(name, rnd, Object.assign(this.opts(st), o));
      if (!res) return null;
      items.push({ res, m: new THREE.Matrix4().makeRotationY(ry).setPosition(x, 0, z) });
      return res;
    };
    const wallPut = (name, c, o) => name && put(name, c.t.x * TILE + c.dx * (TILE / 2 - 0.004), c.t.y * TILE + c.dy * (TILE / 2 - 0.004), Math.atan2(-c.dx, -c.dy), o);
    const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    const walls = [], corners = [];
    room.tiles.forEach((t) => {
      if (!plain(t)) return;
      const ws = DIRS.filter(([dx, dy]) => { const n = at(t.x + dx, t.y + dy); return n && n.wall; });
      const wx = ws.find(([dx]) => dx), wy = ws.find(([, dy]) => dy);
      if (wx && wy && !torch(t, wx[0], 0) && !torch(t, 0, wy[1])) corners.push({ t, dx: wx[0], dy: wy[1] });
      ws.forEach(([dx, dy]) => { if (!nearDoor(t, dx, dy)) walls.push({ t, dx, dy, low: torch(t, dx, dy) }); });
    });
    // --- rincones ---
    const cornerUsed = new Set(), cornerPool = this.pool('corner', theme, st, false).concat(DECO.list('corner', theme.id).filter((n) => !DECO.CAT[n].meta.temas && !DECO.CAT[n].meta.tags.length));
    corners.forEach((c) => {
      if (rnd() > 0.8 * dens) return;
      const name = this.choose(cornerPool.length ? cornerPool : DECO.list('corner', theme.id), rnd, uso); if (!name) return;
      const sx = -c.dx, sz = -c.dy, ry = sx > 0 ? (sz > 0 ? 0 : Math.PI / 2) : (sz > 0 ? -Math.PI / 2 : Math.PI);
      put(name, c.t.x * TILE + c.dx * (TILE / 2 - 0.004), c.t.y * TILE + c.dy * (TILE / 2 - 0.004), ry);
      cornerUsed.add(c.t);
    });
    // --- muros: refuerzos a ritmo, muebles y cosas colgadas ---
    const wallPool = this.pool('wall', theme, st, false), wallGen = this.pool('wall', theme, st, true).filter((n) => !wallPool.includes(n));
    const hangPool = this.pool('hang', theme, st, true);
    const big = room.tiles.length >= 12, fase = Math.floor(rnd() * 3);
    for (let i = walls.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [walls[i], walls[j]] = [walls[j], walls[i]]; }
    walls.forEach((c) => {
      const along = c.dy ? c.t.x : c.t.y, inCorner = cornerUsed.has(c.t);
      // bajo una antorcha solo cabe un mueble bajo (barriles, baúl, banco…)
      if (c.low) { if (!inCorner && rnd() < 0.6 * dens) for (let k = 0; k < 3; k++) { const n = items.length, res = wallPut(this.choose(wallPool.length ? wallPool : wallGen, rnd, uso), c); if (!res || res.top < 1.15) break; items.length = n; } return; }
      if (big && !inCorner && DECO.CAT[st.arq] && (along + fase) % 3 === 0) { if (rnd() < 0.85) wallPut(st.arq, c); return; }
      const p = rnd();
      if (inCorner) { if (p < 0.55 * dens && hangPool.length) wallPut(this.choose(hangPool, rnd, uso), c); return; }
      if (p < 0.84 * dens && (wallPool.length || wallGen.length)) {
        const res = wallPut(this.choose(wallPool.length && (rnd() < 0.82 || !wallGen.length) ? wallPool : wallGen, rnd, uso), c);
        // encima de un mueble bajo (banco, baúl, barriles…) cabe algo colgado: cuadro, escudo, estante
        if (res && res.top < 1.0 && hangPool.length && rnd() < 0.7) wallPut(this.choose(hangPool, rnd, uso), c);
      }
      else if (p < 0.97 * dens && hangPool.length) wallPut(this.choose(hangPool, rnd, uso), c);
    });
    // --- alfombra en el claro más amplio de la sala ---
    const rug = st.alfombra && DECO.CAT[st.alfombra] ? st.alfombra : null;
    const clear = (x, y) => { const t = at(x, y); return t && t.room === room.id && t.ch === '.' && !t.trap; };
    if (rug && room.tiles.length >= 12) {
      const long = DECO.CAT[rug].meta.td > DECO.CAT[rug].meta.tw;   // las alfombras de pasillo son largas en z
      let best = null;
      [[3, 2], [2, 3], [2, 2], [3, 1], [1, 3], [2, 1], [1, 2]].forEach(([w, h]) => {
        if (best && best.w * best.h >= w * h) return;
        room.tiles.forEach((t) => {
          for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (!clear(t.x + xx, t.y + yy)) return;
          const cx = t.x + (w - 1) / 2, cy = t.y + (h - 1) / 2, d = Math.hypot(cx - room.cx, cy - room.cy);
          if (!best || best.w * best.h < w * h || d < best.d) best = { w, h, cx, cy, d };
        });
      });
      if (best) {
        const turn = long ? best.w > best.h : best.h > best.w;   // girar la pieza si el claro va en la otra dirección
        const lw = (turn ? best.h : best.w) * TILE - 0.5, ld = (turn ? best.w : best.h) * TILE - 0.5;
        put(rug, best.cx * TILE, best.cy * TILE, turn ? Math.PI / 2 : 0, { w: lw, d: ld, r: Math.min(lw, ld) / 2 });
        room.rug = best;
      }
    }
    // --- cosas pequeñas por el suelo ---
    const floorPool = this.pool('floor', theme, st, false).filter((n) => n !== rug && !(DECO.CAT[n].meta.tw > 1) && !(DECO.CAT[n].meta.td > 1));
    if (floorPool.length) {
      const n = Math.round(room.tiles.length / 9 * dens), free = room.tiles.filter((t) => t.ch === '.' && !t.trap);
      let pool = floorPool.slice();
      for (let k = 0; k < n && free.length && pool.length; k++) {
        const t = free.splice(Math.floor(rnd() * free.length), 1)[0], name = this.choose(pool, rnd, uso);
        put(name, t.x * TILE + (rnd() - 0.5) * 0.5, t.y * TILE + (rnd() - 0.5) * 0.5, rnd() * Math.PI * 2);
        if (/circulo|runa/.test(name)) pool = pool.filter((q) => !/circulo|runa/.test(q));   // un solo círculo por sala
      }
    }
    return items;
  },
  /* Pieza para una casilla que ya bloquea el paso ('&'): mesa, estatua, pozo… según la sala */
  block(room, theme, rnd) {
    if (typeof DECO === 'undefined') return null;
    const pool = this.pool('block', theme, room.style, false);
    return pool.length ? pool[Math.floor(rnd() * pool.length)] : null;
  },
  /* Manchas del suelo: dónde va cada una (el dibujo sale de TEX.decals) */
  stains(room, theme, cells, dens = 1) {
    const st = room.style, rnd = U.mulberry(theme.seed * 613 + room.id * 71 + room.tiles.length), out = [];
    const names = (st.manchas || []).filter((n) => cells[n]); if (!names.length) return out;
    const rg = room.rug, onRug = (t) => rg && Math.abs(t.x - rg.cx) <= rg.w / 2 + 0.5 && Math.abs(t.y - rg.cy) <= rg.h / 2 + 0.5;
    const free = room.tiles.filter((t) => t.floor && !t.hazard && t.ch !== 'X' && !onRug(t));
    const n = Math.round(room.tiles.length / 3.2 * dens);
    for (let k = 0; k < n && free.length; k++) {
      const t = free[Math.floor(rnd() * free.length)], name = names[Math.floor(rnd() * names.length)];
      if (name === 'tiza' && rnd() < 0.6) continue;
      const s = name === 'monedas' || name === 'huellas' || name === 'tiza' ? 0.8 + rnd() * 0.4 : 1.2 + rnd() * 1.3;
      // sin salirse de la sala: la mancha se queda dentro de su casilla si toca muro
      const lim = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
      let x = t.x * TILE + (rnd() - 0.5) * TILE, z = t.y * TILE + (rnd() - 0.5) * TILE;
      const wl = (dx, dy) => { const q = L_at(t.x + dx, t.y + dy); return !q || q.wall || (q.floor && q.room !== room.id) || q.door; };
      const L_at = (xx, yy) => this._T[yy] && this._T[yy][xx];
      if (wl(-1, 0)) x = lim(x, t.x * TILE - 1 + s / 2, 1e9); if (wl(1, 0)) x = lim(x, -1e9, t.x * TILE + 1 - s / 2);
      if (wl(0, -1)) z = lim(z, t.y * TILE - 1 + s / 2, 1e9); if (wl(0, 1)) z = lim(z, -1e9, t.y * TILE + 1 - s / 2);
      out.push({ x, z, s, rot: rnd() * Math.PI * 2, cell: cells[name] });
    }
    return out;
  }
};
