/* ==========================================================================
   Mundo: parseo de mapas, salas por relleno, construcción 3D y revelado
   ========================================================================== */
const THEMES = {
  crypt: { id: 'crypt', seed: 11, floor: '#585c63', floorAccent: '#46524b', mortar: '#151615', floorRough: 0.86, floorBump: 6, wall: '#62646a', moss: '#21382a', mossAmt: 0.85, trim: '#5a564f', pillar: '#66625b',
    bg: 0x050607, fogDensity: 0.012, hemiSky: 0x3c5068, hemiGround: 0x0d0b09, hemi: 0.42, torch: '#ff9a4a', flameA: '#ffd890', flameB: '#ff5a14', hazard: 'necro', hazardLight: '#3dff9a', debris: 'bones', block: 'sarcophagus', mist: '#4a6a60', mistA: 0.22, music: 'crypt', ambient: 'crypt', eye: '#6dffb0', grade: [[0.78, 0.9, 1.08], [1.0, 0.93, 0.82]] },
  forge: { id: 'forge', seed: 23, floor: '#5a463c', floorAccent: '#46342c', mortar: '#140a07', floorRough: 0.9, floorBump: 7, floorEmissive: true, wall: '#6a4a3c', moss: '#170f0b', mossAmt: 0.9, trim: '#5a4438', pillar: '#5e4a40',
    bg: 0x090403, fogDensity: 0.011, hemiSky: 0x5a3a2a, hemiGround: 0x120806, hemi: 0.38, torch: '#ff8a3a', flameA: '#ffe0a0', flameB: '#ff4a10', hazard: 'lava', hazardLight: '#ff6a1a', debris: 'rubble', block: 'anvil', mist: '#6a3a22', mistA: 0.16, music: 'forge', ambient: 'forge', eye: '#ff3b1f', grade: [[0.9, 0.88, 0.95], [1.06, 0.92, 0.78]] },
  void: { id: 'void', seed: 37, floor: '#3e3852', floorAccent: '#4c4266', mortar: '#0c0a12', floorRough: 0.45, floorBump: 4, wall: '#4a4366', moss: '#1d1830', mossAmt: 0.6, wallRunes: true, trim: '#5a5277', pillar: '#5b5378',
    bg: 0x05030a, fogDensity: 0.012, hemiSky: 0x4a3c7a, hemiGround: 0x0a0612, hemi: 0.45, torch: '#a98bff', flameA: '#e6dcff', flameB: '#7a4aff', hazard: 'void', hazardLight: '#9d6bff', debris: 'shards', block: 'crystals', mist: '#5a4a8a', mistA: 0.2, music: 'void', ambient: 'void', eye: '#c08bff', grade: [[0.82, 0.86, 1.1], [1.02, 0.94, 0.96]] }
};

const WORLD = {
  group: null, L: null, theme: null, anims: [], dyn: [],
  WH: 2.15,

  parse(def) {
    const rows = def.map, h = rows.length, w = rows[0].length;
    const T = [];
    const L = { w, h, T, rooms: [], doors: [], starts: {}, enemies: [], boss: null, chests: [], notes: [], altars: [], traps: [], markers: {}, mirrors: [], stairs: [] };
    for (let y = 0; y < h; y++) {
      T.push([]);
      for (let x = 0; x < w; x++) {
        const ch = rows[y][x] || '#';
        const t = { x, y, ch, wall: ch === '#', door: ch === '+', room: -1, hazard: ch === '~', block: 'OC?*X&M~'.includes(ch), debris: ch === ',', trap: null };
        t.floor = !t.wall && !t.door;
        T[y].push(t);
        if ('123'.includes(ch)) L.starts[ch] = { x, y };
        else if (/[a-z]/.test(ch)) L.enemies.push({ key: ch, x, y });
        else if (ch === 'B') L.boss = { x, y };
        else if (ch === 'C') L.chests.push({ x, y, looted: false, idx: L.chests.length });
        else if (ch === '?') L.notes.push({ x, y, read: false, idx: L.notes.length });
        else if (ch === '*') L.altars.push({ x, y, used: false });
        else if (ch === '^') { const tr = { x, y, idx: L.traps.length, revealed: false, disarmed: false, sprung: false }; L.traps.push(tr); t.trap = tr; }
        else if (/[0456789RSTUVW]/.test(ch)) L.markers[ch] = { x, y };
        else if (ch === 'M') L.mirrors.push({ x, y });
        else if (ch === 'X') L.stairs.push({ x, y });
      }
    }
    if (L.starts['1']) L.markers['1'] = L.starts['1'];
    // salas por relleno (las puertas separan)
    let rid = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const t = T[y][x];
      if (!t.floor || t.room >= 0) continue;
      const room = { id: rid, tiles: [], revealed: false, marker: null, doors: [], props: [], torches: [], hazards: [], meta: null, visited: false, searched: false };
      const st = [t]; t.room = rid;
      while (st.length) {
        const c = st.pop(); room.tiles.push(c);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
          const n = T[c.y + dy] && T[c.y + dy][c.x + dx];
          if (n && n.floor && n.room < 0) { n.room = rid; st.push(n); }
        });
      }
      let sx = 0, sy = 0; room.tiles.forEach((q) => { sx += q.x; sy += q.y; });
      room.cx = sx / room.tiles.length; room.cy = sy / room.tiles.length;
      L.rooms.push(room); rid++;
    }
    Object.entries(L.markers).forEach(([k, m]) => { const r = L.rooms[T[m.y][m.x].room]; if (r) r.marker = k; });
    if (L.boss) L.rooms[T[L.boss.y][L.boss.x].room].boss = true;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const t = T[y][x];
      if (!t.door) continue;
      const l = T[y][x - 1], r = T[y][x + 1], u = T[y - 1] && T[y - 1][x], d = T[y + 1] && T[y + 1][x];
      const vertical = l && l.wall && r && r.wall; // paso norte-sur
      const a = vertical ? u : l, b = vertical ? d : r;
      const door = { x, y, vertical, rooms: [a ? a.room : -1, b ? b.room : -1], open: false, idx: L.doors.length };
      t.doorRef = door; L.doors.push(door);
      door.rooms.forEach((ri) => { if (ri >= 0) L.rooms[ri].doors.push(door); });
    }
    return L;
  },

  /* ----------------- construcción ----------------- */
  clear() {
    if (this.group) {
      ENGINE.scene.remove(this.group);
      this.group.traverse((o) => { if (o.isInstancedMesh) o.dispose(); if (o.geometry && o.userData.own) o.geometry.dispose(); });
    }
    this.group = null; this.L = null; this.anims = []; this.dyn = []; this.flames = []; this.liquids = []; this.mists = []; this.exitGlow = null; this.shafts = []; this.runePanels = [];
    ENGINE.clearLights();
  },

  applyTheme(theme) {
    this.theme = theme;
    const sc = ENGINE.scene;
    sc.background.setHex(theme.bg); sc.fog.color.setHex(theme.bg); sc.fog.density = theme.fogDensity;
    ENGINE.hemi.color.setHex(theme.hemiSky); ENGINE.hemi.groundColor.setHex(theme.hemiGround); ENGINE.hemi.intensity = theme.hemi * 2.2;
    ENGINE.renderer.setClearColor(theme.bg, 1);
    if (ENGINE.final && theme.grade) { ENGINE.final.uniforms.uCool.value.setRGB(...theme.grade[0]); ENGINE.final.uniforms.uWarm.value.setRGB(...theme.grade[1]); }
  },

  build(def, themeId) {
    this.clear();
    const theme = THEMES[themeId];
    this.applyTheme(theme);
    const L = this.L = this.parse(def);
    const g = this.group = new THREE.Group();
    ENGINE.scene.add(g);
    this.units = new THREE.Group(); g.add(this.units);
    this.flames = []; this.liquids = []; this.mists = [];
    const rnd = U.mulberry(theme.seed * 7 + 1);

    // --- suelo instanciado ---
    const FT = TEX.floor(theme);
    const floorMat = new THREE.MeshStandardMaterial({ map: FT.map, normalMap: FT.normalMap, roughnessMap: FT.roughnessMap, roughness: 1, metalness: theme.id === 'void' ? 0.25 : 0.02, normalScale: new THREE.Vector2(1, 1) });
    if (FT.emissiveMap) { floorMat.emissiveMap = FT.emissiveMap; floorMat.emissive = new THREE.Color('#ff5a1a'); floorMat.emissiveIntensity = 0.55; }
    const floorTiles = [];
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) { const t = L.T[y][x]; if ((t.floor && !t.hazard && t.ch !== 'X') || t.door) floorTiles.push(t); }
    const floorGeo = new THREE.BoxGeometry(TILE, 0.4, TILE);
    floorGeo.translate(0, -0.2, 0);
    // UV de la cara superior: una losa por casilla
    const fI = this.floorI = new THREE.InstancedMesh(floorGeo, floorMat, floorTiles.length);
    fI.receiveShadow = true; fI.userData.own = true;
    fI.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.floorData = floorTiles.map((t, i) => {
      const d = { t, i, rooms: t.door ? t.doorRef.rooms : [t.room], shown: false, rot: Math.floor(rnd() * 4) * Math.PI / 2, x: t.x * TILE, z: t.y * TILE };
      const c = 0.86 + rnd() * 0.22; fI.setColorAt(i, new THREE.Color(c, c * (0.98 + rnd() * 0.04), c));
      t.floorIdx = i; return d;
    });
    this.hideAll(fI, this.floorData);
    g.add(fI);

    // --- muros instanciados ---
    const WT = TEX.wall(theme);
    const wallMat = new THREE.MeshStandardMaterial({ map: WT.map, normalMap: WT.normalMap, roughnessMap: WT.roughnessMap, roughness: 1, metalness: 0.0 });
    if (WT.emissiveMap) { wallMat.emissiveMap = WT.emissiveMap; wallMat.emissive = new THREE.Color(theme.torch); wallMat.emissiveIntensity = 0.4; }
    const wallTiles = [];
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
      const t = L.T[y][x]; if (!t.wall) continue;
      const rooms = new Set();
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const n = L.T[y + dy] && L.T[y + dy][x + dx]; if (!n) continue;
        if (n.floor) rooms.add(n.room); else if (n.door) n.doorRef.rooms.forEach((r) => r >= 0 && rooms.add(r));
      }
      if (rooms.size) wallTiles.push({ t, rooms: [...rooms] });
    }
    const WH = this.WH;
    const wallGeo = new THREE.BoxGeometry(TILE, WH, TILE); wallGeo.translate(0, WH / 2, 0);
    const wI = this.wallI = new THREE.InstancedMesh(wallGeo, wallMat, wallTiles.length);
    wI.castShadow = true; wI.receiveShadow = true; wI.userData.own = true;
    wI.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const capGeo = new THREE.BoxGeometry(TILE + 0.04, 0.12, TILE + 0.04); capGeo.translate(0, WH + 0.06, 0);
    const capMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(theme.trim).multiplyScalar(0.55), roughness: 0.9 });
    const cI = this.capI = new THREE.InstancedMesh(capGeo, capMat, wallTiles.length);
    cI.userData.own = true; cI.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.wallData = wallTiles.map((w, i) => {
      const c = 0.82 + rnd() * 0.22; wI.setColorAt(i, new THREE.Color(c, c, c));
      return { t: w.t, i, rooms: w.rooms, shown: false, rot: 0, x: w.t.x * TILE, z: w.t.y * TILE };
    });
    this.hideAll(wI, this.wallData); this.hideAll(cI, this.wallData);
    g.add(wI); g.add(cI);

    // --- puertas ---
    L.doors.forEach((d) => {
      const m = MODELS.door(theme);
      m.position.set(d.x * TILE, 0, d.y * TILE);
      m.rotation.y = d.vertical ? 0 : Math.PI / 2;
      m.visible = false;
      m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      g.add(m); d.mesh = m;
      const leakSide = new THREE.Group(); void leakSide;
    });

    // --- atrezo por sala ---
    const addProp = (t, obj, opts = {}) => {
      obj.position.set(t.x * TILE + (opts.dx || 0), opts.y || 0, t.y * TILE + (opts.dz || 0));
      if (opts.ry != null) obj.rotation.y = opts.ry;
      obj.visible = false;
      obj.traverse((o) => { if (o.isMesh && o.castShadow !== false && !(o.material && o.material.toneMapped === false)) { o.castShadow = true; o.receiveShadow = true; } });
      g.add(obj);
      const room = L.rooms[t.room]; if (room) room.props.push(obj);
      return obj;
    };
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
      const t = L.T[y][x];
      if (!t.floor) continue;
      const ch = t.ch;
      if (ch === 'O') addProp(t, MODELS.pillar(theme));
      else if (ch === '&') {
        let p;
        if (theme.block === 'sarcophagus') p = MODELS.sarcophagus();
        else if (theme.block === 'anvil') p = (x + y) % 2 ? MODELS.anvil() : MODELS.brazier();
        else p = MODELS.crystals(rnd() < 0.5 ? '#b98cff' : '#7fc8ff');
        addProp(t, p, { ry: Math.floor(rnd() * 4) * Math.PI / 2 });
        if (theme.block === 'anvil' && (x + y) % 2 === 0) { const fl = this.addFlame(t.x * TILE, 1.45, t.y * TILE, 0.9, 1.1, '#ffe0a0', '#ff4a10', L.rooms[t.room]); void fl; L.rooms[t.room].torches.push(ENGINE.addLightSource({ pos: new THREE.Vector3(t.x * TILE, 2.2, t.y * TILE), color: new THREE.Color('#ff7a2a'), intensity: 1.6, distance: 10, flicker: true, on: false })); }
        if (theme.block === 'crystals') L.rooms[t.room].torches.push(ENGINE.addLightSource({ pos: new THREE.Vector3(t.x * TILE, 1.2, t.y * TILE), color: new THREE.Color('#9d7bff'), intensity: 0.9, distance: 7, pulse: 1.3, on: false }));
      }
      else if (ch === 'M') { const m = addProp(t, MODELS.mirror(), { ry: this.faceAwayFromWall(t) }); t.mirror = m; }
      else if (ch === 'X') {
        // la escalera baja por un hueco en el suelo: paredes del pozo para que se vea la bajada
        const sm = MODELS.stairs(theme), shaft = MAT.std('#' + new THREE.Color(theme.wall).multiplyScalar(0.42).getHexString(), 1);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const b = new THREE.Mesh(G.box(dx ? 0.06 : TILE, 1.4, dy ? 0.06 : TILE), shaft); b.position.set(dx * (TILE / 2 - 0.03), -0.7, dy * (TILE / 2 - 0.03)); sm.add(b); });
        const m = addProp(t, sm, { ry: this.faceAwayFromWall(t) + Math.PI }); const st = L.stairs.find((q) => q.x === x && q.y === y); if (st) st.mesh = m; }
      else if (ch === ',') {
        const p = theme.debris === 'bones' ? MODELS.bones(rnd) : theme.debris === 'rubble' ? MODELS.rubble(rnd, '#3a2a22') : MODELS.rubble(rnd, '#3a3354');
        addProp(t, p, { ry: rnd() * 6 });
      }
      else if (ch === 'C') { const c = addProp(t, MODELS.chest(), { ry: this.faceAwayFromWall(t) }); const ch2 = L.chests.find((q) => q.x === x && q.y === y); ch2.mesh = c; }
      else if (ch === '?') { const n = addProp(t, MODELS.lectern(), { ry: this.faceAwayFromWall(t) }); const nn = L.notes.find((q) => q.x === x && q.y === y); nn.mesh = n; }
      else if (ch === '*') {
        const col = theme.id === 'crypt' ? '#e9e2c9' : theme.id === 'forge' ? '#ff8a3a' : '#c9a7ff';
        const a = addProp(t, MODELS.altar(col)); const aa = L.altars[0]; aa.mesh = a; aa.color = col;
        L.rooms[t.room].torches.push(aa.light = ENGINE.addLightSource({ pos: new THREE.Vector3(t.x * TILE, 2, t.y * TILE), color: new THREE.Color(col), intensity: 1.4, distance: 9, pulse: 2, on: false, priority: 30 }));
      }
      else if (t.trap) {
        const tm = this.trapMesh(); tm.position.set(t.x * TILE, 0.01, t.y * TILE); tm.visible = false; g.add(tm); t.trap.mesh = tm;
      }
      // velas y telarañas en la cripta
      if (theme.id === 'crypt' && t.ch === '.' && rnd() < 0.05 && this.nextToWall(t)) addProp(t, MODELS.candles(rnd), { dx: (rnd() - 0.5) * 0.6, dz: (rnd() - 0.5) * 0.6 });
      if (theme.id === 'forge' && t.ch === '.' && rnd() < 0.035 && this.nextToWall(t)) addProp(t, MODELS.crate(), { ry: rnd() * 6 });
    }

    // --- líquidos (por sala) ---
    L.rooms.forEach((room) => {
      const hz = room.tiles.filter((t) => t.hazard);
      if (hz.length) {
        const geo = this.mergedQuads(hz, -0.18);
        const mat = SHADERS.liquidMat(theme.hazard);
        const m = new THREE.Mesh(geo, mat); m.visible = false; m.userData.own = true; g.add(m);
        room.props.push(m); this.liquids.push(mat);
        // paredes de la fosa
        const pit = this.pitWalls(hz); pit.visible = false; g.add(pit); room.props.push(pit);
        let cx = 0, cz = 0; hz.forEach((t) => { cx += t.x; cz += t.y; }); cx /= hz.length; cz /= hz.length;
        room.torches.push(ENGINE.addLightSource({ pos: new THREE.Vector3(cx * TILE, 1.0, cz * TILE), color: new THREE.Color(theme.hazardLight), intensity: theme.hazard === 'lava' ? 2.2 : 1.3, distance: 12, pulse: 1.7, on: false, priority: 8 }));
        room.hazardTiles = hz;
      }
      // bruma
      if (ENGINE.q.mist) {
        const geo = this.mergedQuads(room.tiles, 0.32);
        const mat = SHADERS.mistMat(theme.mist);
        const m = new THREE.Mesh(geo, mat); m.visible = false; m.renderOrder = 5; m.userData.own = true; g.add(m);
        room.mist = { mesh: m, mat }; this.mists.push(room.mist);
      }
    });

    // --- antorchas automáticas en los muros, adornos y rayos de luz ---
    L.rooms.forEach((room) => this.placeTorches(room, theme, rnd));
    this.runePanels = [];
    L.rooms.forEach((room) => this.placeDecor(room, theme, rnd));
    this.placeShafts(theme, rnd);

    // --- telarañas en esquinas (cripta) ---
    if (theme.id === 'crypt') this.addWebs(rnd);

    // --- objetos altos seleccionables ---
    ENGINE.tall = [];
    L.doors.forEach((d) => ENGINE.tall.push({ x: d.x, y: d.y, h: 1.1, r: 0.95, hidden: () => d.open || !d.mesh.visible }));
    L.chests.forEach((c) => ENGINE.tall.push({ x: c.x, y: c.y, h: 0.5, r: 0.7, hidden: () => !c.mesh || !c.mesh.visible }));
    L.notes.forEach((n) => ENGINE.tall.push({ x: n.x, y: n.y, h: 0.9, r: 0.6, hidden: () => !n.mesh || !n.mesh.visible }));
    // --- escalera de salida (modo Descenso): se puede tocar y brilla ---
    this.exitGlow = null;
    const ex = def.exit && L.stairs.find((q) => q.x === def.exit.x && q.y === def.exit.y);
    if (ex) {
      ex.exit = true;
      ENGINE.tall.push({ x: ex.x, y: ex.y, h: 0.9, r: 0.85, hidden: () => !ex.mesh || !ex.mesh.visible });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.95, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(theme.flameA), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.userData.own = true; ring.renderOrder = 4;
      addProp(L.T[ex.y][ex.x], ring, { y: 0.03 });
      ring.rotation.x = -Math.PI / 2;
      this.exitGlow = ring;
      L.rooms[L.T[ex.y][ex.x].room].torches.push(ENGINE.addLightSource({ pos: new THREE.Vector3(ex.x * TILE, 1.6, ex.y * TILE), color: new THREE.Color(theme.flameA), intensity: 1.5, distance: 9, pulse: 1.1, on: false, priority: 25 }));
    }
    // --- capas de resaltado ---
    this.buildHighlights();
    const xs = L.w * TILE, zs = L.h * TILE;
    ENGINE.cam.bounds = { minX: 0, maxX: xs - TILE, minZ: 0, maxZ: zs - TILE };
    return L;
  },

  nextToWall(t) { const T = this.L.T; return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => T[t.y + dy] && T[t.y + dy][t.x + dx] && T[t.y + dy][t.x + dx].wall); },
  faceAwayFromWall(t) {
    const T = this.L.T;
    const dirs = [[0, -1, 0], [0, 1, Math.PI], [-1, 0, Math.PI / 2], [1, 0, -Math.PI / 2]];
    for (const [dx, dy, a] of dirs) { const n = T[t.y + dy] && T[t.y + dy][t.x + dx]; if (n && n.wall) return a; }
    return 0;
  },
  hideAll(im, data) {
    const m = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001); m.setPosition(0, -60, 0);
    data.forEach((d) => im.setMatrixAt(d.i, m));
    im.instanceMatrix.needsUpdate = true;
  },
  mergedQuads(tiles, y) {
    const pos = [], uv = [], idx = [];
    tiles.forEach((t, k) => {
      const x0 = t.x * TILE - TILE / 2, z0 = t.y * TILE - TILE / 2, x1 = x0 + TILE, z1 = z0 + TILE;
      pos.push(x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1); uv.push(0, 0, 1, 0, 1, 1, 0, 1);
      const b = k * 4; idx.push(b, b + 2, b + 1, b, b + 3, b + 2);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  },
  pitWalls(hz) {
    const grp = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: 0x15100d, roughness: 1 });
    const T = this.L.T;
    hz.forEach((t) => {
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const n = T[t.y + dy] && T[t.y + dy][t.x + dx];
        if (n && !n.hazard) {
          const m = new THREE.Mesh(G.box(dx ? 0.05 : TILE, 0.22, dy ? 0.05 : TILE), mat);
          m.position.set(t.x * TILE + dx * (TILE / 2 - 0.03), -0.1, t.y * TILE + dy * (TILE / 2 - 0.03)); grp.add(m);
        }
      });
    });
    return grp;
  },
  trapMesh() {
    const g = new THREE.Group();
    const plate = new THREE.Mesh(G.box(1.6, 0.04, 1.6), MAT.std('#3a3430', 0.6, 0.6)); g.add(plate);
    const spikes = new THREE.Group(); g.add(spikes);
    for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(G.cone(0.08, 0.4, 5), MAT.std('#8a8f96', 0.3, 0.9)); s.position.set(((i % 3) - 1) * 0.45, -0.15, (Math.floor(i / 3) - 1) * 0.45); spikes.add(s); }
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ map: TEX.runeRing(7), color: new THREE.Color('#ff9a3a').multiplyScalar(1.4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; g.add(ring);
    g.userData = { spikes, ring };
    return g;
  },
  addFlame(x, y, z, w, h, a, b, room) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), SHADERS.flameMat(a, b));
    m.position.set(x, y, z); m.visible = false; m.userData.lit = !!room; m.userData.noRise = true;
    this.group.add(m); this.flames.push(m);
    if (room) room.props.push(m);
    return m;
  },
  placeTorches(room, theme, rnd) {
    const T = this.L.T, cands = [];
    room.tiles.forEach((t) => {
      if (t.ch !== '.' && t.ch !== ',' && !/[0-9]/.test(t.ch)) return;
      [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
        const n = T[t.y + dy] && T[t.y + dy][t.x + dx];
        if (n && n.wall) cands.push({ t, dx, dy });
      });
    });
    const want = Math.max(2, Math.round(room.tiles.length / 9));
    const chosen = [];
    for (let i = 0; i < cands.length && chosen.length < want; i++) {
      const c = cands[Math.floor(rnd() * cands.length)];
      if (chosen.some((q) => U.cheb(q.t.x, q.t.y, c.t.x, c.t.y) < 3)) continue;
      chosen.push(c);
    }
    room.wallUsed = chosen.slice();
    chosen.forEach((c) => {
      const fx = c.t.x * TILE + c.dx * (TILE / 2), fz = c.t.y * TILE + c.dy * (TILE / 2);
      const s = MODELS.sconce();
      s.position.set(fx - c.dx * 0.02, 1.45, fz - c.dy * 0.02);
      s.rotation.y = Math.atan2(-c.dx, -c.dy);
      s.visible = false; this.group.add(s); room.props.push(s);
      const flame = this.addFlame(fx - c.dx * 0.4, 1.92, fz - c.dy * 0.4, 0.42, 0.62, theme.flameA, theme.flameB, null);
      const src = ENGINE.addLightSource({ pos: new THREE.Vector3(fx - c.dx * 0.75, 2.05, fz - c.dy * 0.75), color: new THREE.Color(theme.torch), intensity: 3.2, distance: 12, flicker: true, on: false, flame });
      room.torches.push(src);
    });
  },
  /* Adornos de pared según el lugar: estandartes, cadenas, osarios, armas, tuberías, cristales y runas */
  placeDecor(room, theme, rnd) {
    const T = this.L.T, cands = [], used = room.wallUsed || [];
    room.tiles.forEach((t) => {
      if (t.ch !== '.' && t.ch !== ',' && !/[0-9]/.test(t.ch)) return;
      [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
        const n = T[t.y + dy] && T[t.y + dy][t.x + dx];
        if (!n || !n.wall) return;
        // no al lado de una puerta (la hoja barre la pared)
        const side = [[dy, dx], [-dy, -dx]].some(([sx, sy]) => { const q = T[t.y + sy] && T[t.y + sy][t.x + sx]; const w = T[t.y + sy + dy] && T[t.y + sy + dy][t.x + sx + dx]; return (q && q.door) || (w && w.door); });
        if (!side) cands.push({ t, dx, dy });
      });
    });
    const want = Math.min(ENGINE.q && ENGINE.q.lights <= 3 ? 2 : 3, Math.max(1, Math.round(room.tiles.length / 12)));
    const kinds = theme.id === 'crypt' ? ['banner', 'skulls', 'chains', 'skulls', 'banner'] : theme.id === 'forge' ? ['rack', 'pipes', 'banner', 'chains', 'pipes'] : ['crystals', 'runes', 'crystals', 'banner'];
    const chosen = [];
    for (let i = 0; i < cands.length * 2 && chosen.length < want; i++) {
      const c = cands[Math.floor(rnd() * cands.length)];
      if (used.concat(chosen).some((q) => U.cheb(q.t.x, q.t.y, c.t.x, c.t.y) < 2)) continue;
      chosen.push(c);
    }
    const bannerCol = theme.id === 'crypt' ? ['#5a1a22', '#c9a24a'] : theme.id === 'forge' ? ['#2a2a30', '#c26a2e'] : ['#2a1d4a', '#b9a2ff'];
    chosen.forEach((c) => {
      const kind = kinds[Math.floor(rnd() * kinds.length)];
      let m, y = 1.1;
      if (kind === 'banner') { m = MODELS.banner(bannerCol[0], bannerCol[1]); y = 1.35; }
      else if (kind === 'skulls') { m = MODELS.skullShelf(rnd); y = 1.05; }
      else if (kind === 'chains') { m = MODELS.chains(); y = 1.45; }
      else if (kind === 'rack') { m = MODELS.weaponRack(); y = 1.2; }
      else if (kind === 'pipes') { m = MODELS.pipes(); y = 1.05; }
      else if (kind === 'crystals') { m = MODELS.wallCrystals(rnd() < 0.5 ? '#b98cff' : '#7fc8ff'); y = 0.9 + rnd() * 0.8; }
      else { m = MODELS.runePanel('#b98cff'); y = 1.3; this.runePanels = (this.runePanels || []).concat(m); }
      if (kind !== 'runes') m = MODELS.merged(m);
      m.position.set(c.t.x * TILE + c.dx * (TILE / 2 - 0.06), y, c.t.y * TILE + c.dy * (TILE / 2 - 0.06));
      m.rotation.y = Math.atan2(-c.dx, -c.dy);
      m.traverse((o) => { if (o.isMesh && !(o.material && o.material.transparent)) { o.castShadow = true; o.receiveShadow = true; } });
      m.visible = false; this.group.add(m); room.props.push(m);
    });
  },
  /* Rayos de luz: en algunas salas grandes, solo con calidad media o alta */
  placeShafts(theme, rnd) {
    this.shafts = [];
    if (!ENGINE.q || !ENGINE.q.mist) return;
    const col = theme.id === 'crypt' ? '#cfe0ff' : theme.id === 'forge' ? '#ffb070' : '#c8b0ff';
    this.L.rooms.forEach((room) => {
      if (room.tiles.length < 16 || rnd() > 0.4) return;
      const inner = room.tiles.filter((t) => t.ch === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].every(([dx, dy]) => { const n = this.L.T[t.y + dy] && this.L.T[t.y + dy][t.x + dx]; return n && n.floor; }));
      if (!inner.length) return;
      const t = inner[Math.floor(rnd() * inner.length)];
      const m = MODELS.lightShaft(col);
      m.position.set(t.x * TILE, 0, t.y * TILE); m.rotation.z = (rnd() - 0.5) * 0.18; m.rotation.x = (rnd() - 0.5) * 0.18;
      m.visible = false; this.group.add(m); room.props.push(m);
      this.shafts.push(m);
    });
  },
  addWebs(rnd) {
    const T = this.L.T, mat = new THREE.MeshBasicMaterial({ map: TEX.web(), transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.5 });
    this.L.rooms.forEach((room) => {
      room.tiles.forEach((t) => {
        if (rnd() > 0.12) return;
        const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
        for (const [dx, dy] of corners) {
          const a = T[t.y][t.x + dx], b = T[t.y + dy] && T[t.y + dy][t.x];
          if (a && a.wall && b && b.wall) {
            const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), mat);
            m.position.set(t.x * TILE + dx * 0.95, this.WH - 0.75, t.y * TILE + dy * 0.95);
            m.rotation.set(0, Math.atan2(-dx, -dy) + Math.PI / 4, 0);
            m.lookAt(t.x * TILE, this.WH - 1.2, t.y * TILE);
            m.visible = false; this.group.add(m); room.props.push(m);
            break;
          }
        }
      });
    });
  },

  /* ----------------- revelado de salas ----------------- */
  revealRoom(roomId, origin, instant) {
    const L = this.L, room = L.rooms[roomId];
    if (!room || room.revealed) return Promise.resolve(false);
    room.revealed = true;
    const ox = origin ? origin.x : room.cx, oy = origin ? origin.y : room.cy;
    const now = ENGINE.time;
    const sched = (data, im, kind) => {
      data.forEach((d) => {
        if (d.shown || !d.rooms.includes(roomId)) return;
        d.shown = true;
        const dist = Math.hypot(d.t.x - ox, d.t.y - oy);
        this.anims.push({ kind, d, im, t0: now + (instant ? 0 : dist * 0.045), dur: instant ? 0.001 : 0.55 });
      });
    };
    sched(this.floorData, this.floorI, 'floor');
    sched(this.wallData, this.wallI, 'wall');
    sched(this.wallData, this.capI, 'cap');
    L.doors.forEach((d) => { if (d.rooms.includes(roomId)) d.mesh.visible = true; });
    room.props.forEach((p) => {
      if (p.visible) return;
      p.visible = true;
      if (instant || p.userData.noRise) return;
      const ty = p.position.y; p.position.y = ty - 2.5;
      const dist = Math.hypot(p.position.x / TILE - ox, p.position.z / TILE - oy);
      const d0 = dist * 0.045 + 0.15;
      setTimeout(() => U.tween(600, (k) => { p.position.y = ty - 2.5 * (1 - k); }, U.easeOutBack), d0 * 1000 / (U.speed || 1));
      p.position.y = ty - 2.5;
    });
    if (room.mist) { const mm = room.mist; mm.mesh.visible = true; U.tween(instant ? 0 : 1800, (k) => { mm.mat.uniforms.uAlpha.value = k * this.theme.mistA; }); }
    // antorchas: se encienden en cascada
    room.torches.forEach((src, i) => {
      const light = () => {
        src.on = true;
        if (src.flame) { src.flame.visible = true; src.flame.userData.lit = true; src.flame.material.uniforms.uInt.value = 0; U.tween(400, (k) => (src.flame.material.uniforms.uInt.value = k)); if (!instant) audio.sfx('torch', { vol: 0.35 }); }
      };
      if (instant) light(); else setTimeout(light, (500 + i * 180) / (U.speed || 1));
    });
    room.tiles.forEach((t) => { if (t.trap && t.trap.revealed) t.trap.mesh.visible = true; });
    this.updateDoorLeaks();
    return U.sleep(instant ? 0 : 700 + Math.min(room.tiles.length, 40) * 8).then(() => true);
  },
  updateDoorLeaks() {
    const L = this.L;
    L.doors.forEach((d) => {
      const r = d.rooms.map((i) => L.rooms[i]).filter(Boolean);
      const shownCount = r.filter((q) => q.revealed).length;
      const leak = d.mesh.userData.leak;
      if (!d.open && shownCount === 1) {
        const hidden = r.find((q) => !q.revealed);
        leak.visible = true;
        leak.userData.boss = !!(hidden && hidden.boss);
        leak.material.color.set(leak.userData.boss ? '#ff3060' : this.theme.torch).multiplyScalar(0.9);
        // la luz se filtra desde el lado oculto
        const side = d.rooms.indexOf(hidden.id) === 0 ? -1 : 1;
        leak.position.set(0, 0.03, side * 0.6);
      } else leak.visible = false;
    });
  },
  setLightsMult(m) { this.L && this.L.rooms.forEach((r) => r.torches.forEach((s) => (s.mult = m))); this.flames.forEach((f) => (f.material.uniforms.uInt.value = f.userData.lit ? m : 0)); },

  /* ----------------- resaltados ----------------- */
  buildHighlights() {
    const N = this.L.w * this.L.h;
    const mat = new THREE.MeshBasicMaterial({ map: TEX.tileFrame(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, vertexColors: false });
    const geo = new THREE.PlaneGeometry(TILE * 0.96, TILE * 0.96); geo.rotateX(-Math.PI / 2);
    const hl = this.hl = new THREE.InstancedMesh(geo, mat, N); hl.count = 0; hl.renderOrder = 6; hl.userData.own = true;
    hl.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
    hl.frustumCulled = false;
    this.group.add(hl);
    const dotGeo = new THREE.CircleGeometry(0.16, 12); dotGeo.rotateX(-Math.PI / 2);
    const pd = this.pathI = new THREE.InstancedMesh(dotGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe6a8').multiplyScalar(1.6), transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }), 64);
    pd.count = 0; pd.renderOrder = 7; pd.frustumCulled = false; pd.userData.own = true; this.group.add(pd);
    const ringMat = new THREE.MeshBasicMaterial({ map: TEX.runeRing(1), color: new THREE.Color('#ffd27a').multiplyScalar(1.5), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const sel = this.selRing = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), ringMat); sel.rotation.x = -Math.PI / 2; sel.position.y = 0.035; sel.visible = false; sel.renderOrder = 8; this.group.add(sel);
    const tgt = this.tgtRing = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshBasicMaterial({ map: TEX.runeRing(2), color: new THREE.Color('#ff4a3a').multiplyScalar(1.6), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    tgt.rotation.x = -Math.PI / 2; tgt.position.y = 0.04; tgt.visible = false; tgt.renderOrder = 8; this.group.add(tgt);
    const hov = this.hoverQ = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: TEX.tileFrame(), color: new THREE.Color('#ffffff').multiplyScalar(0.9), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    hov.position.y = 0.045; hov.visible = false; hov.renderOrder = 7; this.group.add(hov);
    const dangerMat = new THREE.MeshBasicMaterial({ map: TEX.runeRing(5), color: new THREE.Color('#ff2a10').multiplyScalar(1.8), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const dg = this.dangerI = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.9, 1.9).rotateX(-Math.PI / 2), dangerMat, 32);
    dg.count = 0; dg.renderOrder = 7; dg.frustumCulled = false; dg.userData.own = true; this.group.add(dg);
  },
  HL_COLORS: { move: '#d9b46a', far: '#6a5a3a', attack: '#ff3d2e', skill: '#a982ff', heal: '#5dffb0', item: '#ffb347', interact: '#7fd8ff', danger: '#ff2a10' },
  setHighlights(list) {
    const hl = this.hl; if (!hl) return;
    const m = new THREE.Matrix4(), c = new THREE.Color();
    hl.count = list.length;
    list.forEach((h, i) => {
      m.makeTranslation(h.x * TILE, 0.03 + (h.kind === 'move' ? 0 : 0.004), h.y * TILE);
      hl.setMatrixAt(i, m);
      c.set(this.HL_COLORS[h.kind] || '#ffffff').multiplyScalar(h.k != null ? h.k : (h.kind === 'move' ? 0.55 : 1.0));
      hl.setColorAt(i, c);
    });
    hl.instanceMatrix.needsUpdate = true; if (hl.instanceColor) hl.instanceColor.needsUpdate = true;
  },
  setPath(path) {
    const pd = this.pathI; if (!pd) return;
    const m = new THREE.Matrix4();
    const pts = [];
    for (let i = 1; i < (path || []).length; i++) {
      const a = path[i - 1], b = path[i];
      pts.push([(a.x + b.x) / 2, (a.y + b.y) / 2, 0.7]); pts.push([b.x, b.y, 1]);
    }
    pd.count = Math.min(64, pts.length);
    pts.slice(0, 64).forEach(([x, y, s], i) => { m.makeScale(s, 1, s); m.setPosition(x * TILE, 0.05, y * TILE); pd.setMatrixAt(i, m); });
    pd.instanceMatrix.needsUpdate = true;
  },
  setDanger(list) {
    const dg = this.dangerI; if (!dg) return;
    const m = new THREE.Matrix4();
    dg.count = Math.min(32, list.length);
    list.slice(0, 32).forEach((t, i) => { m.makeTranslation(t.x * TILE, 0.06, t.y * TILE); dg.setMatrixAt(i, m); });
    dg.instanceMatrix.needsUpdate = true;
  },
  setHover(t) {
    if (!this.hoverQ) return;
    if (!t) { this.hoverQ.visible = false; return; }
    this.hoverQ.visible = true; this.hoverQ.position.set(t.x * TILE, 0.045, t.y * TILE);
  },
  setSelection(unit) {
    if (!this.selRing) return;
    if (!unit) { this.selRing.visible = false; return; }
    this.selRing.visible = true; this.selUnit = unit;
  },
  setTarget(unit) { if (!this.tgtRing) return; this.tgtUnit = unit; this.tgtRing.visible = !!unit; },

  /* ----------------- unidades ----------------- */
  addUnit(u, opts = {}) {
    const root = new THREE.Group();
    const model = MODELS.build(u.model, u.modelOpts || {});
    const isHero = u.side === 'hero';
    const rim = isHero ? u.color : u.side === 'npc' ? '#7fd8ff' : (u.boss ? '#c0283a' : '#7a1d1d');
    const base = MODELS.base(rim, u.boss ? 0.85 : 0.62, isHero || u.boss);
    root.add(base);
    root.add(model);
    if (u.boss) model.scale.setScalar(1);
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ map: TEX.blob(), transparent: true, depthWrite: false, opacity: 0.85 }));
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.012; blob.renderOrder = 1; root.add(blob);
    // silueta a través de muros
    const h = model.userData.height || 1.5;
    const sil = new THREE.Mesh(G.cyl(0.32, 0.4, h, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(isHero ? u.color : '#ff3030').multiplyScalar(0.35), depthFunc: THREE.GreaterDepth, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    sil.position.y = h / 2 + 0.1; sil.renderOrder = 3; root.add(sil);
    model.traverse((o) => { if (o.isMesh) o.renderOrder = o.material && o.material.transparent ? 10 : 4; });
    base.traverse((o) => { if (o.isMesh) { o.renderOrder = 4; o.castShadow = true; o.receiveShadow = true; } });
    model.userData.fig.userData.baseY = model.userData.fig.position.y; model.userData.fig.userData.baseS = model.userData.fig.scale.y;
    const mini = MINI.uniforms(isHero ? '#ffd9a8' : u.side === 'npc' ? '#9fe0ff' : u.boss ? '#ff7a5a' : '#a8bcff', isHero ? 0.3 : 0.24);
    MINI.apply(model, mini);
    root.userData = { model, base, fig: model.userData.fig, height: h, phase: Math.random() * 10, sil, float: model.userData.float || 0, rim, mini };
    root.position.set(u.x * TILE, 0, u.y * TILE);
    root.rotation.y = opts.face != null ? opts.face : 0;
    this.units.add(root);
    u.mesh = root;
    if (model.userData.glow) u.lightSrc = ENGINE.addLightSource({ pos: new THREE.Vector3(), color: new THREE.Color(model.userData.glow), intensity: 1.6, distance: 9, pulse: 2.2, on: true, priority: 40, follow: root });
    return root;
  },
  removeUnit(u) {
    if (u.mesh) { this.units.remove(u.mesh); u.mesh = null; }
    if (u.lightSrc) { u.lightSrc.on = false; ENGINE.lightSources = ENGINE.lightSources.filter((s) => s !== u.lightSrc); }
  },
  rebuildUnit(u) { const p = u.mesh ? u.mesh.rotation.y : 0; const vis = u.mesh ? u.mesh.visible : true; this.removeUnit(u); this.addUnit(u, { face: p }); u.mesh.visible = vis; },

  /* ----------------- cerraduras, sellos y campeones ----------------- */
  addLock(d) {
    const pv = d.mesh.userData.pivot, g = new THREE.Group();
    const mk = () => {
      if (d.lock === 'sello') {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), new THREE.MeshBasicMaterial({ map: TEX.runeRing(9), color: new THREE.Color('#c08bff').multiplyScalar(1.7), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
        m.userData.spin = true; return m;
      }
      const p = new THREE.Group();
      p.add(new THREE.Mesh(G.box(0.3, 0.38, 0.05), MAT.std('#2a2624', 0.35, 0.9)));
      const k = new THREE.Mesh(G.box(0.05, 0.13, 0.06), MAT.glow('#ffcf6b', 1.4)); k.position.y = -0.03; p.add(k);
      const ring = new THREE.Mesh(G.tor(0.11, 0.02, 6, 16, Math.PI), MAT.std('#6a5a3a', 0.35, 0.9)); ring.position.y = 0.2; p.add(ring);
      return p;
    };
    const a = mk(), b = mk();
    if (d.lock === 'sello') { a.position.set(0.74, 1.12, 0.075); b.position.set(0.74, 1.12, -0.075); b.rotation.y = Math.PI; }
    else { a.position.set(1.2, 1.0, 0.09); b.position.set(1.2, 1.0, -0.09); b.rotation.y = Math.PI; }
    g.add(a); g.add(b); pv.add(g); d.lockMesh = g;
  },
  removeLock(d) {
    if (!d.lockMesh) return;
    const g = d.lockMesh; d.lockMesh = null;
    FX.burst(d.lock === 'sello' ? 'magic' : 'block', new THREE.Vector3(d.x * TILE, 1.1, d.y * TILE), { color: '#c08bff' });
    U.tween(350, (k) => g.scale.setScalar(Math.max(0.01, 1 - k))).then(() => g.parent && g.parent.remove(g));
  },
  markChampion(e) {
    const ud = e.mesh.userData;
    ud.base.userData.ring.material = MAT.glow('#ffcf5a', 1.9);
    ud.model.scale.multiplyScalar(1.1);
  },

  /* ----------------- campamento ----------------- */
  buildCamp() {
    const def = { map: [
      '###########',
      '#.........#',
      '#.........#',
      '#....,....#',
      '#.........#',
      '#.........#',
      '###########'] };
    this.build(def, 'crypt');
    this.applyTheme(Object.assign({}, THEMES.crypt, { bg: 0x060404, hemi: 0.3, fogDensity: 0.02 }));
    const L = this.L;
    L.rooms.forEach((r) => this.revealRoom(r.id, null, true));
    const fire = MODELS.campfire(); fire.position.set(5 * TILE, 0, 3 * TILE); this.group.add(fire);
    this.flames.push(fire.userData.flame); fire.userData.flame.userData.lit = true;
    this.campFire = ENGINE.addLightSource({ pos: new THREE.Vector3(5 * TILE, 1.6, 3 * TILE), color: new THREE.Color('#ff8a3a'), intensity: 2.6, distance: 16, flicker: true, on: true, priority: 99 });
    [['#4a2a2a', 3.6, 2.2, 0.6], ['#2a3a2a', 6.4, 2.0, -0.5], ['#2a2a4a', 5.0, 4.6, 3.1]].forEach(([c, x, z, r]) => { const b = MODELS.bedroll(c); b.position.set(x * TILE, 0.01, z * TILE); b.rotation.y = r; this.group.add(b); });
    const pack = MODELS.crate(); pack.position.set(7.4 * TILE, 0, 4.2 * TILE); pack.scale.setScalar(0.7); this.group.add(pack);
    return L;
  },

  /* ----------------- bucle ----------------- */
  update(dt) {
    if (!this.group) return;
    MINI.update(ENGINE.camera);
    const now = ENGINE.time, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), yAxis = new THREE.Vector3(0, 1, 0);
    // animaciones de revelado de instancias
    if (this.anims.length) {
      const touched = new Set();
      for (let i = this.anims.length - 1; i >= 0; i--) {
        const a = this.anims[i];
        let k = (now - a.t0) / a.dur;
        if (k < 0) continue;
        k = Math.min(1, k);
        const e = U.easeOutBack(k);
        const d = a.d;
        p.set(d.x, -3 * (1 - e), d.z);
        q.setFromAxisAngle(yAxis, d.rot || 0);
        const sc = 0.6 + 0.4 * U.clamp(e, 0, 1.2);
        s.set(sc, a.kind === 'floor' ? 1 : sc, sc);
        m4.compose(p, q, s);
        a.im.setMatrixAt(d.i, m4); touched.add(a.im);
        if (k >= 1) this.anims.splice(i, 1);
      }
      touched.forEach((im) => (im.instanceMatrix.needsUpdate = true));
    }
    this.flames.forEach((f) => { if (f.visible) f.material.uniforms.uTime.value = now; });
    this.liquids.forEach((m) => (m.uniforms.uTime.value = now));
    this.mists.forEach((mm) => (mm.mat.uniforms.uTime.value = now));
    // resaltados vivos
    if (this.selRing && this.selRing.visible && this.selUnit && this.selUnit.mesh) {
      this.selRing.position.x = this.selUnit.mesh.position.x; this.selRing.position.z = this.selUnit.mesh.position.z;
      this.selRing.rotation.z = now * 0.4;
    }
    if (this.tgtRing && this.tgtRing.visible && this.tgtUnit && this.tgtUnit.mesh) {
      this.tgtRing.position.x = this.tgtUnit.mesh.position.x; this.tgtRing.position.z = this.tgtUnit.mesh.position.z;
      this.tgtRing.rotation.z = -now * 0.8; const sc = 1 + Math.sin(now * 6) * 0.05; this.tgtRing.scale.set(sc, sc, sc);
    }
    if (this.hl) this.hl.material.opacity = 0.75 + Math.sin(now * 3) * 0.2;
    (this.shafts || []).forEach((sh) => { if (!sh.visible) return; const u = sh.userData.shaft.uniforms; u.uT.value = now; if (u.uA.value < 1) u.uA.value = Math.min(1, u.uA.value + dt * 0.5); sh.userData.pool.material.opacity = 0.55 * u.uA.value; });
    (this.runePanels || []).forEach((rp) => { if (rp.visible) { rp.userData.spin.rotation.z = now * 0.25; rp.userData.spin.material.opacity = 0.5 + Math.sin(now * 1.5) * 0.2; } });
    if (this.exitGlow && this.exitGlow.visible) { this.exitGlow.rotation.z = now * 0.5; this.exitGlow.material.opacity = 0.32 + Math.sin(now * 2.2) * 0.18; }
    if (this.dangerI && this.dangerI.count) { this.dangerI.material.opacity = 0.6 + Math.sin(now * 8) * 0.4; }
    // puertas: luz que se filtra
    this.L && this.L.doors.forEach((d) => {
      const lk = d.mesh.userData.leak;
      if (lk.visible) lk.material.opacity = (lk.userData.boss ? 0.5 + Math.sin(now * 3) * 0.25 : 0.22 + Math.sin(now * 7 + d.x) * 0.06);
    });
    // sellos rúnicos en puertas
    this.L && this.L.doors.forEach((d) => { if (d.lockMesh) d.lockMesh.children.forEach((c) => { if (c.userData.spin) c.rotation.z = now * 0.6 * (c.rotation.y ? -1 : 1); }); });
    // cofres, altares, notas
    this.L && this.L.chests.forEach((c) => { if (c.mesh && c.mesh.visible && !c.looted && c.mesh.userData.glow) { c.mesh.userData.glow.visible = true; c.mesh.userData.glow.material.opacity = 1; } });
    this.L && this.L.altars.forEach((a) => { if (a.mesh) { a.mesh.userData.ring.rotation.z = now * 0.3; a.mesh.userData.gem.rotation.y = now; a.mesh.userData.gem.position.y = 1.45 + Math.sin(now * 2) * 0.06; } });
    this.L && this.L.traps.forEach((t) => { if (t.mesh && t.mesh.visible) t.mesh.userData.ring.material.opacity = t.disarmed ? 0.15 : 0.5 + Math.sin(now * 4) * 0.3; });
    // unidades vivas
    this.units && this.units.children.forEach((r) => {
      const ud = r.userData, fig = ud.fig, md = ud.model && ud.model.userData;
      if (!fig || ud.dead) return;
      const ph = ud.phase;
      const fl = ud.float || 0;
      if (!ud.lockAnim) {
        const by = fig.userData.baseY || 0;
        fig.position.y = by + (fl ? Math.sin(now * 1.6 + ph) * 0.08 : Math.abs(Math.sin(now * 1.1 + ph)) * 0.012);
        fig.rotation.z = Math.sin(now * 0.9 + ph) * 0.015;
        fig.scale.y = (fig.userData.baseS || 1) * (1 + Math.sin(now * 1.7 + ph) * 0.012); // respiración
      }
      const mi = ud.mini;
      if (mi) {
        if (mi.uFlash.value > 0) mi.uFlash.value = Math.max(0, mi.uFlash.value - dt * 4.5);
        const act = typeof GAME !== 'undefined' && GAME.active && GAME.active.mesh === r && GAME.phase === 'hero';
        mi.uRim.value = act ? mi.base * 1.9 + Math.sin(now * 3) * 0.08 : mi.base;
      }
      if (md.cape) md.cape.rotation.x = 0.12 + Math.sin(now * 1.7 + ph) * 0.07;
      if (md.orbs) md.orbs.rotation.y = now * 1.2;
      if (md.eyes) { md.eyes.rotation.y = now * 0.35; }
      if (md.tendrils) md.tendrils.rotation.y = -now * 0.5;
      if (md.halo) md.halo.rotation.z = now;
      if (md.crystal) { md.crystal.rotation.y = now * 1.5; md.crystal.position.y = 1.86 + Math.sin(now * 2 + ph) * 0.03; }
      if (md.lantern) md.lantern.rotation.z = Math.sin(now * 1.3 + ph) * 0.15;
      if (md.flame) md.flame.material.uniforms.uTime.value = now;
      if (md.head && !ud.lockAnim) md.head.rotation.y = Math.sin(now * 0.5 + ph * 3) * 0.25;
    });
    ENGINE.lightSources.forEach((s) => { if (s.follow) { s.pos.copy(s.follow.position); s.pos.y = 1.6; s.on = s.follow.visible && !s.follow.userData.dead; } });
  }
};
