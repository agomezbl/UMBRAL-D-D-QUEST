/* ==========================================================================
   Reglas, turnos, IA de la Sombra, eventos de historia y jefes
   ========================================================================== */
const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

const GAME = {
  state: 'title', chIdx: 0, ch: null, L: null,
  heroes: [], enemies: [], npcs: [],
  round: 0, phase: 'idle', active: null, busy: 0, mode: null, pending: null,
  gold: 60, items: { potion: 2, elixir: 0, bomb: 1 }, kit: false, upgrades: {}, flags: {}, difficulty: 'heroe',
  stats: null, boss: null, eruptions: [], uid: 0,

  newStats() { return { kills: 0, rounds: 0, gold: 0, dealt: 0, taken: 0, chests: 0, notes: 0, falls: 0, start: Date.now() }; },

  /* ------------------------------------------------------------ partida */
  newGame(difficulty) {
    this.difficulty = difficulty || 'heroe';
    this.gold = 60; this.items = { potion: 2, elixir: 0, bomb: 1 }; this.kit = false; this.upgrades = {}; this.flags = {};
    this.stats = this.newStats();
    if (this.difficulty === 'pesadilla') this.items.potion = 1;
  },
  snapshot(stage) {
    return { v: 1, stage, chIdx: this.chIdx, gold: this.gold, items: Object.assign({}, this.items), kit: this.kit, upgrades: Object.assign({}, this.upgrades), flags: Object.assign({}, this.flags), difficulty: this.difficulty, stats: Object.assign({}, this.stats) };
  },
  restore(s) {
    this.chIdx = s.chIdx; this.gold = s.gold; this.items = Object.assign({}, s.items); this.kit = s.kit; this.upgrades = Object.assign({}, s.upgrades);
    this.flags = Object.assign({}, s.flags); this.difficulty = s.difficulty; this.stats = Object.assign(this.newStats(), s.stats || {});
  },
  save(stage) { const s = this.snapshot(stage); this.checkpoint = s; U.store.set('umbral.save.v1', s); },

  /* ------------------------------------------------------------ unidades */
  makeHero(id) {
    const d = HERO_DEFS[id], up = this.upgrades;
    const h = { id, side: 'hero', kind: id, name: d.name, full: d.full, role: d.role, model: d.model, color: d.color, hp: d.hp, maxHp: d.hp, atk: d.atk, def: d.def, mv: d.mv, range: d.range, ranged: !!d.ranged,
      skills: d.skills.map((s) => Object.assign({}, s, { cd: 0 })), basic: d.basic, mvLeft: 0, actions: 0, ended: false, ko: false, alive: true, status: {}, potionUsed: false, healBonus: 0, modelOpts: {} };
    if (id === 'aldric') { if (up.blade) { h.atk++; h.modelOpts.blade = true; } if (up.aegis) { h.def++; h.maxHp += 2; h.modelOpts.aegis = true; } }
    if (id === 'sera') { if (up.fangs) { h.atk++; h.modelOpts.fangs = true; } if (up.bow) { h.bowRange = 5; h.modelOpts.bow = true; } if (this.flags.tomasDagger) h.atk++; }
    if (id === 'elian') { if (up.dawnstaff) { h.atk++; h.healBonus = 1; h.modelOpts.dawn = true; } if (up.mantle) { h.def++; h.maxHp += 2; h.modelOpts.mantle = true; } }
    if (this.difficulty === 'relato') h.maxHp += 3;
    h.hp = h.maxHp;
    return h;
  },
  makeEnemy(type, x, y) {
    const T = ENEMY_TYPES[type];
    const e = { id: 'e' + (++this.uid), side: 'enemy', kind: type, name: T.name, model: T.model, hp: T.hp, maxHp: T.hp, atk: T.atk, def: T.def, mv: T.mv, range: T.range || 1, ranged: !!T.ranged, proj: T.proj,
      boss: !!T.boss, undead: !!T.undead, flies: !!T.flies, gold: T.gold, x, y, alive: true, active: false, status: {}, T };
    if (this.difficulty === 'relato') { e.atk = Math.max(1, e.atk - 1); if (e.boss) { e.hp -= 2; e.maxHp -= 2; } }
    if (this.difficulty === 'pesadilla') { if (e.boss || e.kind === 'golem') e.atk += 1; e.hp += e.boss ? 3 : 1; e.maxHp = e.hp; e.mv += 1; }
    return e;
  },
  allUnits() { return this.heroes.concat(this.enemies.filter((e) => e.alive), this.npcs); },
  unitAt(x, y) { return this.allUnits().find((u) => u.x === x && u.y === y && (u.side !== 'enemy' || u.alive)); },
  heroesUp() { return this.heroes.filter((h) => !h.ko); },

  /* ------------------------------------------------------------ geometría */
  T(x, y) { const L = WORLD.L; return L && L.T[y] && L.T[y][x]; },
  passable(x, y, u) {
    const t = this.T(x, y); if (!t) return false;
    if (t.wall) return false;
    if (t.door) return t.doorRef.open;
    if (t.hazard) return !!(u && u.flies);
    if (t.block) return false;
    if (t.trap && !t.trap.disarmed && !t.trap.sprung) {
      if (u && u.side === 'enemy') return false;
      if (t.trap.revealed) return false;
    }
    const room = WORLD.L.rooms[t.room]; if (room && !room.revealed) return false;
    return true;
  },
  reach(u, maxSteps, opts = {}) {
    const dist = new Map(), prev = new Map(), stand = new Set();
    const k0 = U.key(u.x, u.y); dist.set(k0, 0); stand.add(k0);
    const q = [[u.x, u.y]];
    while (q.length) {
      const [cx, cy] = q.shift(); const d = dist.get(U.key(cx, cy));
      if (d >= maxSteps) continue;
      for (const [dx, dy] of DIRS4) {
        const nx = cx + dx, ny = cy + dy, k = U.key(nx, ny);
        if (dist.has(k) || !this.passable(nx, ny, u)) continue;
        const o = this.unitAt(nx, ny);
        if (o && o !== u && o.side !== u.side && !opts.ignoreUnits) continue;
        dist.set(k, d + 1); prev.set(k, U.key(cx, cy));
        if (!o || o === u || opts.ignoreUnits) stand.add(k);
        q.push([nx, ny]);
      }
    }
    return { dist, prev, stand };
  },
  pathTo(R, x, y) {
    const path = []; let k = U.key(x, y);
    if (!R.dist.has(k)) return null;
    while (k) { const [a, b] = k.split(',').map(Number); path.unshift({ x: a, y: b }); k = R.prev.get(k); }
    return path;
  },
  blocksLOS(x, y) {
    const t = this.T(x, y); if (!t) return true;
    if (t.wall) return true;
    if (t.door) return !t.doorRef.open;
    return t.ch === 'O' || t.ch === 'M' || t.ch === 'X';
  },
  los(ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, n = Math.max(Math.abs(dx), Math.abs(dy)) * 4;
    for (let i = 1; i < n; i++) {
      const x = Math.round(ax + (dx * i) / n), y = Math.round(ay + (dy * i) / n);
      if ((x === ax && y === ay) || (x === bx && y === by)) continue;
      if (this.blocksLOS(x, y)) return false;
    }
    return true;
  },
  meleeOK(ax, ay, bx, by) {
    const c = U.cheb(ax, ay, bx, by); if (c !== 1) return false;
    if (ax !== bx && ay !== by) { const w1 = this.blocksLOS(ax, by), w2 = this.blocksLOS(bx, ay); if (w1 && w2) return false; }
    return true;
  },
  canHit(att, fx, fy, tgt, range, needLos = true) {
    if (range <= 1) return this.meleeOK(fx, fy, tgt.x, tgt.y);
    const c = U.cheb(fx, fy, tgt.x, tgt.y);
    if (c < 1 || c > range) return false;
    if (c === 1 && this.meleeOK(fx, fy, tgt.x, tgt.y)) return true;
    return !needLos || this.los(fx, fy, tgt.x, tgt.y);
  },
  roomOf(u) { const t = this.T(u.x, u.y); return t ? WORLD.L.rooms[t.room] : null; },
  visibleEnemies() { return this.enemies.filter((e) => e.alive && e.active); },
  freeTileNear(x, y, maxR = 3, sameRoom = true) {
    const t0 = this.T(x, y), cand = [];
    for (let r = 1; r <= maxR; r++) {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const nx = x + dx, ny = y + dy, t = this.T(nx, ny);
        if (!t || !this.passable(nx, ny, { side: 'enemy' }) || this.unitAt(nx, ny)) continue;
        if (sameRoom && t0 && t.room !== t0.room) continue;
        cand.push({ x: nx, y: ny });
      }
      if (cand.length) return U.pick(cand);
    }
    return null;
  },

  /* ------------------------------------------------------------ capítulo */
  async startChapter(idx, opts = {}) {
    this.gen = (this.gen || 0) + 1;
    this.busy = 0;
    this.state = 'play'; this.chIdx = idx; this.ch = CHAPTERS[idx];
    if (!this.stats) this.stats = this.newStats();
    this.save('chapter');
    UI.hideAll();
    this.busy++;
    try {
      const ch = this.ch;
      await UI.chapterCard(ch);
      FX.clearLabels();
      WORLD.build(ch, ch.theme);
      this.L = WORLD.L;
      this.heroes = ['aldric', 'sera', 'elian'].map((id) => this.makeHero(id));
      this.enemies = []; this.npcs = []; this.boss = null; this.eruptions = []; this.round = 0; this.mode = null; this.pending = null;
      this.heroes.forEach((h) => { const s = this.L.starts[HERO_DEFS[h.id].start]; h.x = s.x; h.y = s.y; WORLD.addUnit(h, { face: Math.PI }); });
      this.updateLantern();
      this.L.enemies.forEach((p) => { const type = ch.legend[p.key]; if (!type) return; const e = this.makeEnemy(type, p.x, p.y); this.enemies.push(e); WORLD.addUnit(e, { face: Math.random() * 6 }); e.mesh.visible = false; });
      if (this.L.boss) { const b = this.makeEnemy(ch.bossType, this.L.boss.x, this.L.boss.y); this.enemies.push(b); WORLD.addUnit(b, { face: 0 }); b.mesh.visible = false; }
      const startRoom = this.roomOf(this.heroes[0]);
      const sp = this.L.starts['1'];
      ENGINE.keyPos.set(sp.x * TILE, 0, sp.y * TILE); ENGINE.key.target.position.copy(ENGINE.keyPos);
      ENGINE.focusTile(sp.x, sp.y, { dist: U.isTouch() && ENGINE.w < ENGINE.h ? 30 : 24, pitch: 0.92, yaw: 0.35, instant: true });
      ENGINE.cam.t.dist *= 0.82;
      audio.startAmbient(ch.ambient); audio.setMusic('explore', THEMES[ch.theme].music);
      ENGINE.fx.fadeT = 0;
      UI.showHUD(true);
      UI.setLocation(ch, startRoom);
      await WORLD.revealRoom(startRoom.id, sp, false);
      startRoom.visited = true;
      UI.refresh();
      await this.run(ch.intro, { room: startRoom });
    } catch (e) { console.error(e); }
    this.busy = 0;
    this.startRound();
  },
  updateLantern() {
    const el = this.heroes.find((h) => h.id === 'elian');
    if (!el || !el.mesh) return;
    const md = el.mesh.userData.model.userData;
    const col = this.flags.lantern || this.ch.lantern || '#ffb45a';
    if (md.lanternCore) md.lanternCore.material = MAT.glow(col, 3);
    if (md.lantern) md.lantern.visible = !this.flags.lanternGone;
  },

  /* ------------------------------------------------------------ rondas */
  startRound() {
    if (this.state !== 'play') return;
    this.round++; this.stats.rounds++;
    this.phase = 'hero';
    this.heroes.forEach((h) => {
      h.ended = h.ko; h.mvLeft = h.ko ? 0 : h.mv; h.actions = h.ko ? 0 : 1; h.potionUsed = false;
      h.skills.forEach((s) => (s.cd = Math.max(0, s.cd - 1)));
      if (h.status.wall) h.status.wall = 0;
      if (h.status.guard) h.status.guard = 0;
      if (h.status.taunt) h.status.taunt = 0;
    });
    const anyHostile = this.visibleEnemies().length > 0;
    if (!this.boss || !this.boss.alive) audio.setMusic(anyHostile ? 'combat' : 'explore');
    UI.banner(this.round === 1 ? 'Vuestro turno' : `Ronda ${this.round}`, anyHostile ? 'La Sombra os observa' : 'Explorad con cautela', 'hero');
    audio.sfx('turnHero');
    const first = this.heroes.find((h) => !h.ended);
    this.selectHero(first, true);
    UI.refresh();
  },
  selectHero(h, auto) {
    if (!h || h.ko || h.ended || this.state !== 'play') return;
    this.active = h; this.mode = null; this.pending = null;
    WORLD.setSelection(h);
    if (SETTINGS.follow || !auto) ENGINE.focusTile(h.x, h.y);
    ENGINE.keyPos.set(h.x * TILE, 0, h.y * TILE);
    this.refreshPlan();
    UI.refresh();
  },
  nextHero() {
    const order = this.heroes.filter((h) => !h.ended && !h.ko);
    if (!order.length) return null;
    const i = order.indexOf(this.active);
    return order[(i + 1) % order.length];
  },
  async endTurn(h = this.active) {
    if (!h || this.busy || this.phase !== 'hero') return;
    h.ended = true; this.mode = null;
    const nxt = this.heroes.find((x) => !x.ended && !x.ko);
    if (nxt) { this.selectHero(nxt); return; }
    await this.shadowPhase();
  },
  autoEnd(h) {
    if (h && !h.ended && h.mvLeft <= 0 && h.actions <= 0 && !this.busy && this.state === 'play') {
      setTimeout(() => { if (this.active === h && !h.ended && !this.busy && h.mvLeft <= 0 && h.actions <= 0) this.endTurn(h); }, 450 / U.speed);
    }
  },

  /* ------------------------------------------------------------ plan / resaltados */
  refreshPlan() {
    this.threatOf = null;
    const h = this.active;
    if (!h || this.busy || this.phase !== 'hero' || h.ko) { WORLD.setHighlights([]); WORLD.setPath(null); WORLD.setTarget(null); return; }
    const hl = [];
    this.R = this.reach(h, h.mvLeft);
    if (!this.mode) {
      this.R.stand.forEach((k) => { const [x, y] = k.split(',').map(Number); if (x !== h.x || y !== h.y) hl.push({ x, y, kind: 'move' }); });
      if (h.actions > 0) this.visibleEnemies().forEach((e) => { if (this.attackFrom(h, e)) hl.push({ x: e.x, y: e.y, kind: 'attack', k: this.canHit(h, h.x, h.y, e, this.heroRange(h)) ? 1.1 : 0.55 }); });
      this.L.doors.forEach((d) => { if (!d.open && d.mesh.visible && this.doorApproach(h, d)) hl.push({ x: d.x, y: d.y, kind: 'interact', k: 0.8 }); });
    } else {
      this.validTargets().forEach((t) => hl.push({ x: t.x, y: t.y, kind: this.mode.color || 'skill' }));
    }
    WORLD.setHighlights(hl);
  },
  heroRange(h) { return h.bowRange || h.range; },
  /* zona de amenaza de un enemigo: dónde puede golpear en su próximo turno */
  showThreat(e) {
    if (this.threatOf === e) return;
    this.threatOf = e;
    if (!e) { this.refreshPlan(); return; }
    const R = this.reach(e, e.mv, { ignoreUnits: false });
    const set = new Map();
    R.stand.forEach((k) => {
      const [x, y] = k.split(',').map(Number);
      const r = e.range || 1;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const tx = x + dx, ty = y + dy, t = this.T(tx, ty);
        if (!t || !t.floor || set.has(U.key(tx, ty))) continue;
        const room = this.L.rooms[t.room]; if (!room || !room.revealed) continue;
        if (r <= 1 ? this.meleeOK(x, y, tx, ty) : (U.cheb(x, y, tx, ty) <= r && this.los(x, y, tx, ty))) set.set(U.key(tx, ty), { x: tx, y: ty, kind: 'attack', k: 0.32 });
      }
    });
    set.set(U.key(e.x, e.y), { x: e.x, y: e.y, kind: 'attack', k: 1.1 });
    WORLD.setHighlights([...set.values()]);
  },
  attackFrom(h, e) {
    // devuelve la casilla (alcanzable) desde la que puede atacar, priorizando no moverse
    const range = this.heroRange(h);
    if (this.canHit(h, h.x, h.y, e, range)) return { x: h.x, y: h.y, d: 0 };
    let best = null;
    const foes = this.visibleEnemies();
    this.R.stand.forEach((k) => {
      const [x, y] = k.split(',').map(Number); const d = this.R.dist.get(k);
      if (!this.canHit(h, x, y, e, range)) return;
      // los tiradores evitan quedar pegados a los enemigos
      const exposed = range > 1 ? foes.filter((f) => U.cheb(f.x, f.y, x, y) <= 1).length : 0;
      const s = d + exposed * 4;
      if (!best || s < best.s) best = { x, y, d, s };
    });
    return best;
  },
  doorApproach(h, d) {
    if (U.manh(h.x, h.y, d.x, d.y) === 1) return { x: h.x, y: h.y, d: 0 };
    let best = null;
    DIRS4.forEach(([dx, dy]) => { const k = U.key(d.x + dx, d.y + dy); if (this.R.stand.has(k)) { const dd = this.R.dist.get(k); if (!best || dd < best.d) best = { x: d.x + dx, y: d.y + dy, d: dd }; } });
    return best;
  },
  adjApproach(h, x, y) {
    if (U.cheb(h.x, h.y, x, y) === 1) return { x: h.x, y: h.y, d: 0 };
    let best = null;
    DIRS8.forEach(([dx, dy]) => { const k = U.key(x + dx, y + dy); if (this.R.stand.has(k)) { const dd = this.R.dist.get(k); if (!best || dd < best.d) best = { x: x + dx, y: y + dy, d: dd }; } });
    return best;
  },
  validTargets() {
    const h = this.active, m = this.mode; if (!h || !m) return [];
    const out = [];
    if (m.type === 'attack') this.visibleEnemies().forEach((e) => { if (this.canHit(h, h.x, h.y, e, this.heroRange(h))) out.push(e); });
    else if (m.type === 'skill') {
      const s = m.skill;
      if (s.target === 'enemy') this.visibleEnemies().forEach((e) => { if (this.canHit(h, h.x, h.y, e, s.range || 1, s.los !== false)) out.push(e); });
      else if (s.target === 'ally') this.heroes.forEach((a) => { if (U.cheb(h.x, h.y, a.x, a.y) <= s.range && (a.ko || a.hp < a.maxHp)) out.push(a); });
      else if (s.target === 'tile') {
        for (let dy = -s.range; dy <= s.range; dy++) for (let dx = -s.range; dx <= s.range; dx++) {
          const x = h.x + dx, y = h.y + dy; if (!dx && !dy) continue;
          if (this.passable(x, y, h) && !this.unitAt(x, y)) out.push({ x, y });
        }
      }
    } else if (m.type === 'bomb') {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const x = h.x + dx, y = h.y + dy, t = this.T(x, y);
        if (!t || !t.floor || (!dx && !dy)) continue;
        const room = this.L.rooms[t.room]; if (!room || !room.revealed) continue;
        if (this.los(h.x, h.y, x, y)) out.push({ x, y });
      }
    }
    return out;
  },

  /* ------------------------------------------------------------ entrada */
  describe(x, y) {
    // qué pasaría si el jugador elige esta casilla
    const h = this.active; if (!h || this.phase !== 'hero' || this.busy) return null;
    const t = this.T(x, y); if (!t) return null;
    const u = this.unitAt(x, y);
    if (this.mode) {
      const valid = this.validTargets().find((q) => q.x === x && q.y === y);
      if (!valid) return { kind: 'none', text: 'Objetivo no válido', sub: 'Elige una casilla resaltada o cancela.' };
      if (this.mode.type === 'attack') return this.attackPreview(h, u, null);
      if (this.mode.type === 'bomb') return { kind: 'bomb', x, y, text: 'Lanzar bomba alquímica', sub: '3 dados a cada criatura del área 3×3. ¡Cuidado con los aliados!', area: true };
      const s = this.mode.skill;
      if (s.target === 'enemy') return this.attackPreview(h, u, s);
      if (s.target === 'ally') return { kind: 'skill', x, y, unit: u, text: `${s.name} → ${u.name}`, sub: u.ko ? 'Lo levanta con 3 PV.' : `Cura ${3 + h.healBonus} PV.` };
      if (s.target === 'tile') return { kind: 'skill', x, y, text: s.name, sub: 'Reaparecerás aquí. Pierdes el movimiento restante.' };
    }
    if (u && u.side === 'hero') {
      if (u === h) return { kind: 'self', text: `${h.full}`, sub: `${h.mvLeft} de movimiento · ${h.actions > 0 ? 'acción disponible' : 'sin acción'}` };
      if (u.ko && h.actions > 0) { const ap = this.adjApproach(h, x, y); if (ap) return { kind: 'revive', x, y, unit: u, via: ap, text: `Levantar a ${u.name}`, sub: 'Gasta tu acción. Vuelve con 2 PV.' }; }
      if (!u.ended && !u.ko) return { kind: 'switch', unit: u, text: `Cambiar a ${u.name}`, sub: 'Selecciona otro héroe que aún no ha terminado.' };
      return { kind: 'info', unit: u, text: u.name, sub: u.ko ? 'Caído' : 'Ya ha actuado este turno' };
    }
    if (u && u.side === 'enemy') {
      if (!u.active) return null;
      if (h.actions <= 0) return { kind: 'info', unit: u, text: u.name, sub: 'Sin acción disponible este turno.' };
      const from = this.attackFrom(h, u);
      if (!from) return { kind: 'info', unit: u, text: u.name, sub: 'Fuera de tu alcance este turno.' };
      return this.attackPreview(h, u, null, from);
    }
    if (u && u.side === 'npc') return { kind: 'info', unit: u, text: SPEAKERS[u.kind] ? SPEAKERS[u.kind].name : 'Espíritu', sub: 'Un eco del pasado.' };
    if (t.door && !t.doorRef.open) {
      const ap = this.doorApproach(h, t.doorRef);
      if (ap) return { kind: 'door', x, y, door: t.doorRef, via: ap, text: 'Abrir puerta', sub: ap.d ? `Avanzar ${ap.d} y abrir` : 'Sin coste' };
      return { kind: 'none', text: 'Puerta cerrada', sub: 'Demasiado lejos para alcanzarla este turno.' };
    }
    if (t.ch === 'C') {
      const c = this.L.chests.find((q) => q.x === x && q.y === y);
      if (c && !c.looted) { const ap = h.actions > 0 && this.adjApproach(h, x, y); return ap ? { kind: 'chest', x, y, chest: c, via: ap, text: 'Abrir cofre', sub: 'Gasta tu acción.' } : { kind: 'none', text: 'Cofre', sub: h.actions > 0 ? 'Fuera de alcance.' : 'Necesitas una acción.' }; }
      return { kind: 'none', text: 'Cofre vacío', sub: '' };
    }
    if (t.ch === '?') {
      const n = this.L.notes.find((q) => q.x === x && q.y === y);
      const ap = this.adjApproach(h, x, y);
      return ap ? { kind: 'note', x, y, note: n, via: ap, text: n.read ? 'Releer' : 'Leer', sub: 'Sin coste.' } : { kind: 'none', text: 'Un escrito', sub: 'Acércate para leerlo.' };
    }
    if (t.ch === '*') return { kind: 'none', text: 'El sello', sub: this.boss && this.boss.alive ? 'Su guardián lo protege.' : 'Late con una luz antigua.' };
    if (t.trap && t.trap.revealed && !t.trap.disarmed && !t.trap.sprung) {
      const ap = h.actions > 0 && this.adjApproach(h, x, y);
      const ch = this.kit ? 100 : h.id === 'sera' ? 90 : 50;
      return ap ? { kind: 'disarm', x, y, trap: t.trap, via: ap, text: 'Desarmar trampa', sub: `${ch}% de éxito · gasta tu acción.` } : { kind: 'none', text: 'Trampa', sub: 'Acércate para desarmarla.' };
    }
    const k = U.key(x, y);
    if (this.R && this.R.stand.has(k) && (x !== h.x || y !== h.y)) {
      const path = this.pathTo(this.R, x, y);
      return { kind: 'move', x, y, path, text: 'Mover', sub: `${path.length - 1} de ${h.mvLeft} casillas` };
    }
    return null;
  },
  attackPreview(h, e, skill, from) {
    if (!e) return null;
    let atk = h.atk, ign = 0, name = h.basic.name;
    if (skill && skill.id === 'smite') { atk += 2 + (e.undead ? 1 : 0); name = skill.name; }
    if (skill && skill.id === 'throw') { atk = 4; ign = 1; name = skill.name; }
    if (skill && skill.id === 'starfire') { atk = 4; name = skill.name; }
    const def = this.defDice(e);
    const o = U.combatOdds(atk, def, 1 / 6, ign);
    return { kind: skill ? 'skill' : 'attack', x: e.x, y: e.y, unit: e, via: from, skill, text: `${name} → ${e.name}`, sub: `${atk} dados contra ${def} · ${Math.round(o.pHit * 100)}% de herir · daño medio ${o.exp.toFixed(1)}`, atk, def, odds: o };
  },
  async click(x, y, touch) {
    if (this.busy || this.phase !== 'hero' || this.state !== 'play') return;
    const d = this.describe(x, y);
    if (!d || d.kind === 'none' || d.kind === 'info') {
      if (d && d.kind === 'none') { UI.preview(d); audio.sfx('deny', { vol: 0.5 }); }
      if (d && d.kind === 'info') { UI.preview(d); if (d.unit && d.unit.side === 'enemy') this.showThreat(d.unit); }
      this.pending = null; return;
    }
    if (d.kind === 'switch') { this.selectHero(d.unit); audio.sfx('ui'); return; }
    if (d.kind === 'self') { UI.preview(d); return; }
    // en táctil: primer toque previsualiza, el segundo confirma
    if (touch && SETTINGS.confirmTouch && !(this.pending && this.pending.x === x && this.pending.y === y)) {
      this.pending = { x, y }; UI.preview(d, true); this.showPreview(d); audio.sfx('hover');
      this.threatOf = undefined; if (d.unit && d.unit.side === 'enemy') { this.refreshPlan(); } return;
    }
    this.pending = null; UI.preview(null);
    await this.execute(d);
  },
  showPreview(d) {
    if (!d) { WORLD.setPath(null); WORLD.setTarget(null); return; }
    if (d.kind === 'move') WORLD.setPath(d.path);
    else if (d.via && this.R) { const p = this.pathTo(this.R, d.via.x, d.via.y); WORLD.setPath(p && p.length > 1 ? p : null); }
    else WORLD.setPath(null);
    WORLD.setTarget(d.unit && d.unit.side === 'enemy' ? d.unit : null);
  },
  async execute(d) {
    const h = this.active;
    await this.lock(async () => {
      WORLD.setPath(null); WORLD.setTarget(null);
      if (d.via && (d.via.x !== h.x || d.via.y !== h.y)) {
        const ok = await this.moveHero(h, this.pathTo(this.R, d.via.x, d.via.y));
        if (!ok) return;
      }
      switch (d.kind) {
        case 'move': await this.moveHero(h, d.path); break;
        case 'door': await this.openDoor(d.door, h); break;
        case 'attack': if (this.mode && this.mode.type === 'attack') this.mode = null; await this.heroAttack(h, d.unit); break;
        case 'skill': await this.useSkill(h, this.mode.skill, d); this.mode = null; break;
        case 'bomb': await this.throwBomb(h, d.x, d.y); this.mode = null; break;
        case 'chest': await this.openChest(h, d.chest); break;
        case 'note': await this.readNote(h, d.note); break;
        case 'revive': await this.revive(h, d.unit); break;
        case 'disarm': await this.disarm(h, d.trap); break;
      }
    });
    this.afterAction(h);
  },
  async lock(fn) {
    const gen = this.gen;
    this.busy++; WORLD.setHighlights([]); WORLD.setPath(null); WORLD.setTarget(null); WORLD.setHover(null); UI.preview(null); UI.refresh();
    try { await fn(); } catch (e) { console.error(e); }
    if (gen === this.gen) this.busy = Math.max(0, this.busy - 1);
  },
  afterAction(h) {
    if (this.state !== 'play') return;
    if (this.phase === 'hero') { this.refreshPlan(); UI.refresh(); this.autoEnd(h); }
  },
  setMode(m) {
    if (this.busy || this.phase !== 'hero' || !this.active) return;
    if (this.mode && m && this.mode.key === m.key) m = null;
    this.mode = m; this.pending = null; UI.preview(null);
    if (m && m.instant) { const mm = m; this.mode = null; this.lock(async () => { await this.useSkill(this.active, mm.skill, {}); }).then(() => this.afterAction(this.active)); return; }
    this.refreshPlan(); UI.refresh();
    if (m && !this.validTargets().length) { UI.toast(m.empty || 'No hay objetivos válidos al alcance.'); this.mode = null; this.refreshPlan(); UI.refresh(); }
  },
  action(id) {
    const h = this.active; if (!h || this.busy || this.phase !== 'hero') return;
    audio.sfx('ui');
    if (id === 'attack') { if (h.actions <= 0) return UI.toast('Ya has usado tu acción este turno.'); this.setMode({ key: 'attack', type: 'attack', color: 'attack', empty: 'Ningún enemigo a tu alcance desde aquí. Toca a un enemigo para acercarte y atacar.' }); }
    else if (id === 's0' || id === 's1') {
      const s = h.skills[+id[1]];
      if (s.cd > 0) return UI.toast(`${s.name} estará lista en ${s.cd} ronda${s.cd > 1 ? 's' : ''}.`);
      if (!s.free && h.actions <= 0) return UI.toast('Ya has usado tu acción este turno.');
      if (s.id === 'step' && h.mvLeft <= 0) return UI.toast('Paso Sombrío necesita movimiento restante.');
      this.setMode({ key: id, type: 'skill', skill: s, instant: s.target === 'self', color: s.target === 'ally' ? 'heal' : 'skill' });
    }
    else if (id === 'search') this.lock(() => this.search(h)).then(() => this.afterAction(h));
    else if (id === 'potion') this.lock(() => this.drink(h)).then(() => this.afterAction(h));
    else if (id === 'elixir') this.lock(() => this.elixir(h)).then(() => this.afterAction(h));
    else if (id === 'bomb') { if (h.actions <= 0) return UI.toast('Lanzar una bomba gasta tu acción.'); if (this.items.bomb <= 0) return UI.toast('No os quedan bombas.'); this.setMode({ key: 'bomb', type: 'bomb', color: 'item' }); }
    else if (id === 'end') this.endTurn(h);
    else if (id === 'next') { const n = this.nextHero(); if (n && n !== h) this.selectHero(n); }
    else if (id === 'cancel') { this.mode = null; this.pending = null; UI.preview(null); this.refreshPlan(); UI.refresh(); }
  },

  /* ------------------------------------------------------------ movimiento */
  async hop(u, x, y, opts = {}) {
    const m = u.mesh; if (!m) { u.x = x; u.y = y; return; }
    const fx = m.position.x, fz = m.position.z, tx = x * TILE, tz = y * TILE;
    const ang = Math.atan2(tx - fx, tz - fz);
    let dy = ang - m.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    const r0 = m.rotation.y;
    u.x = x; u.y = y;
    const dur = (opts.dur || 170);
    await U.tween(dur, (k) => {
      m.position.x = U.lerp(fx, tx, k); m.position.z = U.lerp(fz, tz, k);
      m.position.y = Math.sin(k * Math.PI) * (opts.h || 0.32);
      m.rotation.y = r0 + dy * Math.min(1, k * 2.5);
      m.rotation.x = Math.sin(k * Math.PI) * 0.08;
    }, (t) => t);
    m.position.y = 0; m.rotation.x = 0;
    const s = ENGINE.project(m.position);
    audio.sfx('step', { pan: (s.x / ENGINE.w - 0.5) * 1.2, vol: u.side === 'hero' ? 1 : 0.7 });
    if (Math.random() < 0.5) FX.burst('dust', m.position);
    if (u.side === 'hero' && u === this.active) ENGINE.keyPos.set(tx, 0, tz);
  },
  faceTo(u, x, y) { if (!u.mesh) return; u.mesh.rotation.y = Math.atan2(x * TILE - u.mesh.position.x, y * TILE - u.mesh.position.z); },
  async moveHero(h, path) {
    if (!path || path.length < 2) return true;
    if (SETTINGS.follow) ENGINE.cam.lambda = 3.5;
    for (let i = 1; i < path.length; i++) {
      const p = path[i];
      if (h.mvLeft <= 0) break;
      await this.hop(h, p.x, p.y);
      h.mvLeft--;
      if (SETTINGS.follow) ENGINE.focusTile(p.x, p.y);
      const t = this.T(p.x, p.y);
      // trampa oculta
      if (t.trap && !t.trap.revealed && !t.trap.disarmed && !t.trap.sprung) { await this.springTrap(t.trap, h); h.mvLeft = 0; ENGINE.cam.lambda = 6; return false; }
      if (h.id === 'sera' && !h.ko) this.detectTraps(h, 2);
      const room = this.L.rooms[t.room];
      if (room && !room.visited) {
        room.visited = true;
        UI.setLocation(this.ch, room);
        const meta = this.ch.rooms[room.marker];
        if (meta && meta.enter) { await this.run(meta.enter, { hero: h, room }); ENGINE.cam.lambda = 6; return false; }
      }
      if (h.ko) return false;
    }
    ENGINE.cam.lambda = 6;
    return true;
  },
  detectTraps(h, r) {
    this.L.traps.forEach((tr) => {
      if (tr.revealed || tr.disarmed || tr.sprung) return;
      const t = this.T(tr.x, tr.y); const room = this.L.rooms[t.room];
      if (!room.revealed || U.cheb(h.x, h.y, tr.x, tr.y) > r) return;
      this.revealTrap(tr);
      FX.bubble(h, U.pick(BARKS.sera.trap));
    });
  },
  revealTrap(tr) {
    tr.revealed = true; tr.mesh.visible = true;
    audio.sfx('trap', { vol: 0.4 });
    FX.text(new THREE.Vector3(tr.x * TILE, 1, tr.y * TILE), '¡Trampa!', 'warn');
    if (this.active) this.refreshPlan();
  },
  async springTrap(tr, h) {
    tr.revealed = true; tr.sprung = true; tr.mesh.visible = true;
    const sp = tr.mesh.userData.spikes;
    audio.sfx('trap'); ENGINE.shake(0.35);
    await U.tween(120, (k) => { sp.position.y = -0.15 + k * 0.4; });
    const theme = WORLD.theme.id;
    FX.burst(theme === 'forge' ? 'fire' : theme === 'void' ? 'magic' : 'trap', { x: h.x * TILE, y: 0.4, z: h.y * TILE });
    if (theme === 'forge') audio.sfx('fire');
    await this.damage(h, 2, { source: 'trap' });
    UI.log(`${h.name} activa una trampa oculta y pierde 2 PV.`, 'bad');
    if (!h.ko) FX.bubble(h, h.id === 'sera' ? '¿Cómo no la he visto?' : '¡Una trampa!');
  },

  /* ------------------------------------------------------------ puertas y salas */
  async openDoor(door, h) {
    if (door.open) return;
    door.open = true;
    audio.sfx('door');
    const pv = door.mesh.userData.pivot;
    const sign = (h && (door.vertical ? h.y < door.y : h.x < door.x)) ? -1 : 1;
    U.tween(650, (k) => { pv.rotation.y = sign * -1.45 * U.easeOut(k); });
    door.mesh.userData.leak.visible = false;
    await U.sleep(280);
    for (const ri of door.rooms) {
      const room = this.L.rooms[ri];
      if (room && !room.revealed) await this.revealRoom(room, door, h);
    }
    WORLD.updateDoorLeaks();
    UI.hintOnce('turn');
  },
  async revealRoom(room, origin, hero) {
    const hasBoss = this.enemies.some((e) => e.boss && e.alive && this.T(e.x, e.y).room === room.id);
    audio.sfx('reveal', { vol: hasBoss ? 1 : 0.7 });
    const cx = Math.round(room.cx), cy = Math.round(room.cy);
    ENGINE.focusTile((cx + origin.x) / 2, (cy + origin.y) / 2, {});
    FX.burst('reveal', { x: origin.x * TILE, z: origin.y * TILE }, { color: WORLD.theme.torch });
    const p = WORLD.revealRoom(room.id, origin, false);
    // despiertan los enemigos de la sala
    const foes = this.enemies.filter((e) => e.alive && !e.active && this.T(e.x, e.y).room === room.id);
    await U.sleep(450);
    foes.forEach((e, i) => setTimeout(() => this.riseUnit(e), (250 + i * 140) / U.speed));
    await p;
    await U.sleep(foes.length ? 300 : 0);
    UI.setLocation(this.ch, room);
    const meta = this.ch.rooms[room.marker];
    if (room.boss && this.ch.boss) { this.boss = this.enemies.find((e) => e.boss && e.alive); await this.run(this.ch.boss.reveal, { hero, room }); }
    else if (meta && meta.reveal) await this.run(meta.reveal, { hero, room });
    if (foes.length && !(this.boss && this.boss.alive)) audio.setMusic('combat');
    if (hero && SETTINGS.follow) ENGINE.focusTile(hero.x, hero.y);
    UI.refresh();
  },
  riseUnit(e, fx = 'dust') {
    e.active = true; const m = e.mesh; if (!m) return;
    m.visible = true; const fig = m.userData.model;
    fig.position.y = -1.6;
    U.tween(650, (k) => (fig.position.y = -1.6 * (1 - k)), U.easeOutBack);
    FX.burst(fx, m.position, { color: WORLD.theme.eye });
    if (e.T && e.T.sfx === 'bone') audio.sfx('bone', { vol: 0.6 });
  },

  /* ------------------------------------------------------------ combate */
  defDice(u) {
    let d = u.def;
    if (u.status.wall) d += 2;
    if (u.status.guard) d += 1;
    return d;
  },
  rollDie() { const r = Math.floor(Math.random() * 6); return r < 3 ? 'skull' : r < 5 ? 'white' : 'black'; },
  async attack(att, tgt, o = {}) {
    if (!tgt || (tgt.side === 'enemy' && !tgt.alive) || (tgt.side === 'hero' && tgt.ko)) return 0;
    const atkN = o.atk != null ? o.atk : att.atk;
    const defN = this.defDice(tgt);
    const ranged = o.ranged != null ? o.ranged : (att.ranged && U.cheb(att.x, att.y, tgt.x, tgt.y) > 1);
    this.faceTo(att, tgt.x, tgt.y);
    const m = att.mesh, from = m.position.clone(), dir = new THREE.Vector3(tgt.x * TILE - from.x, 0, tgt.y * TILE - from.z).normalize();
    const pan = (ENGINE.project(tgt.mesh.position).x / ENGINE.w - 0.5) * 1.2;
    // tirada
    const A = []; for (let i = 0; i < atkN; i++) A.push(this.rollDie());
    const D = []; for (let i = 0; i < defN; i++) D.push(this.rollDie());
    const skulls = A.filter((f) => f === 'skull').length;
    const shieldFace = tgt.side === 'hero' ? 'white' : 'black';
    const shields = D.filter((f) => f === shieldFace).length;
    const eff = Math.max(0, shields - (o.ignore || 0));
    const dmg = Math.max(0, skulls - eff);
    const diceP = UI.dice({ att, tgt, A, D, shieldFace, skulls, shields: eff, dmg, label: o.label, quick: att.side === 'enemy' && SETTINGS.quickEnemyDice });
    if (ranged || o.proj) {
      const proj = o.proj || att.proj || (att.id === 'elian' ? 'bolt' : att.id === 'sera' ? 'arrow' : 'arrow');
      audio.sfx(proj === 'arrow' ? 'arrow' : proj === 'fire' ? 'fire' : proj === 'dagger' ? 'swing' : 'magic', { pan, vol: 0.8 });
      // pequeño gesto de lanzamiento
      U.tween(160, (k) => { m.userData.model.rotation.x = -Math.sin(k * Math.PI) * 0.15; });
      await FX.projectile(new THREE.Vector3(from.x, 1.2, from.z), new THREE.Vector3(tgt.x * TILE, 1.0, tgt.y * TILE), proj);
    } else {
      audio.sfx('swing', { pan });
      const md = m.userData.model;
      await U.tween(170, (k) => { m.position.x = from.x + dir.x * 0.55 * U.easeIn(k); m.position.z = from.z + dir.z * 0.55 * U.easeIn(k); md.rotation.x = 0.2 * k; });
    }
    await diceP;
    // impacto
    const tp = new THREE.Vector3(tgt.mesh.position.x, 1.1, tgt.mesh.position.z);
    if (dmg > 0) {
      const fxk = tgt.undead && tgt.side === 'enemy' && (tgt.kind === 'skeleton' || tgt.kind === 'archer') ? 'bone' : tgt.T && (tgt.T.sfx === 'glass') ? 'glass' : tgt.side === 'hero' ? 'blood' : 'hit';
      FX.burst(fxk, tp); FX.burst('hit', tp);
      audio.sfx(tgt.T && tgt.T.sfx === 'glass' ? 'glass' : 'hit', { pan });
      if (tgt.T && tgt.T.sfx === 'bone') audio.sfx('bone', { pan });
      ENGINE.shake(0.12 + dmg * 0.08);
      this.hitReact(tgt, dir);
      if (o.light !== false) ENGINE.flashLight(tp, '#ffb070', 2.2, 0.25);
    } else {
      FX.burst('block', tp); audio.sfx('block', { pan });
      FX.text(tp, 'Bloqueado', 'block');
    }
    if (!ranged && !o.proj) { const md = m.userData.model; U.tween(220, (k) => { m.position.x = U.lerp(m.position.x, from.x, k); m.position.z = U.lerp(m.position.z, from.z, k); md.rotation.x = 0.2 * (1 - k); }); }
    if (dmg > 0) await this.damage(tgt, dmg, { by: att });
    UI.log(`${att.name} → ${tgt.name}: ${skulls} calavera${skulls === 1 ? '' : 's'} contra ${eff} escudo${eff === 1 ? '' : 's'}${dmg ? `, <b>${dmg} de daño</b>` : ', sin daño'}.`, att.side === 'hero' ? 'good' : 'bad');
    await U.sleep(140);
    return dmg;
  },
  hitReact(u, dir) {
    const m = u.mesh; if (!m) return;
    const md = m.userData.model;
    U.tween(260, (k) => { const s = Math.sin(k * Math.PI); md.position.x = dir.x * 0.18 * s; md.position.z = dir.z * 0.18 * s; md.rotation.z = -0.25 * s * (dir.x || 1); });
    // destello rojo en la peana
    const ring = m.userData.base.userData.ring;
    if (ring && ring.material) { const old = ring.material; ring.material = MAT.glow('#ff3020', 3); setTimeout(() => (ring.material = old), 220); }
  },
  async damage(u, n, o = {}) {
    if (n <= 0) return;
    const p = new THREE.Vector3(u.mesh.position.x, (u.mesh.userData.height || 1.5) + 0.2, u.mesh.position.z);
    u.hp = Math.max(0, u.hp - n);
    FX.text(p, `−${n}`, u.side === 'hero' ? 'dmg hero' : 'dmg');
    if (u.side === 'hero') {
      this.stats.taken += n;
      ENGINE.fx.damage = Math.min(1, ENGINE.fx.damage + 0.35 + n * 0.12);
      if (u.hp > 0) { if (u.hp <= 2) FX.bubble(u, U.pick(BARKS[u.id].low)); else if (Math.random() < 0.35) FX.bubble(u, U.pick(BARKS[u.id].hurt)); }
    } else this.stats.dealt += n;
    UI.refresh();
    if (u.hp <= 0) await this.kill(u, o.by);
    audio.heartbeat(this.heroes.some((h) => !h.ko && h.hp <= 2));
  },
  async heal(u, n) {
    if (u.ko) { u.ko = false; u.hp = 0; this.standUp(u); }
    const got = Math.min(n, u.maxHp - u.hp); u.hp += got;
    FX.burst('heal', u.mesh.position); audio.sfx('heal');
    FX.text(new THREE.Vector3(u.mesh.position.x, 1.8, u.mesh.position.z), `+${got}`, 'heal');
    UI.refresh(); audio.heartbeat(this.heroes.some((h) => !h.ko && h.hp <= 2));
  },
  standUp(u) {
    const ud = u.mesh.userData; const fig = ud.model;
    U.tween(500, (k) => { fig.rotation.x = -1.4 * (1 - k); fig.position.y = 0; }).then(() => { ud.lockAnim = false; });
    ud.base.userData.ring.material = MAT.glow(u.color, 1.3);
  },
  async kill(u, by) {
    if (u.side === 'hero') {
      if (u.ko) return;
      u.ko = true; u.ended = true; u.mvLeft = 0; u.actions = 0; this.stats.falls++;
      audio.sfx('heroDown'); ENGINE.fx.desat = 0.6; ENGINE.fx.desatT = 0;
      const ud = u.mesh.userData; ud.lockAnim = true;
      U.tween(600, (k) => { ud.model.rotation.x = -1.4 * U.easeOut(k); ud.model.position.y = 0.1 * k; });
      ud.base.userData.ring.material = MAT.std('#3a3a3a', 0.8);
      UI.log(`<b>${u.name} ha caído.</b> Un aliado adyacente puede levantarle.`, 'bad');
      FX.text(new THREE.Vector3(u.mesh.position.x, 2, u.mesh.position.z), 'Caído', 'warn');
      if (this.heroes.every((h) => h.ko) && this.state === 'play') { this.state = 'defeat'; setTimeout(() => this.defeat(), 1300); }
      return;
    }
    if (u.side !== 'enemy' || !u.alive) return;
    u.alive = false;
    this.stats.kills++;
    const ud = u.mesh.userData; ud.lockAnim = true; ud.dead = true;
    const T = u.T; const dc = T.deathCol || ['#ffffff', '#555555'];
    FX.burst('death', u.mesh.position, { color: dc[0], color2: dc[1] });
    if (u.undead || u.kind === 'wraith') FX.burst('soul', u.mesh.position);
    audio.sfx(T.sfx === 'glass' ? 'glass' : T.sfx === 'bone' ? 'bone' : 'death');
    if (by && by.side === 'hero' && Math.random() < 0.6) FX.bubble(by, U.pick(BARKS[by.id].kill));
    const m = u.mesh;
    U.tween(700, (k) => { ud.model.rotation.z = 1.4 * U.easeIn(k); ud.model.position.y = -0.4 * k; m.scale.setScalar(1 - 0.25 * k); }).then(() => U.tween(500, (k) => { m.position.y = -1.5 * k; })).then(() => { WORLD.removeUnit(u); });
    if (u.gold) { this.addGold(u.gold, new THREE.Vector3(m.position.x, 1.6, m.position.z)); }
    if (u.boss) { await U.sleep(500); await this.bossDefeated(u); }
    else if (!this.visibleEnemies().length && this.state === 'play') { audio.setMusic('explore'); }
    UI.refresh();
  },
  addGold(n, pos) {
    this.gold += n; this.stats.gold += n;
    if (pos) { FX.text(pos, `+${n} oro`, 'gold'); FX.burst('gold', pos); }
    audio.sfx('gold', { vol: 0.6 });
    UI.refresh();
  },
  async heroAttack(h, e) {
    if (h.actions <= 0) return;
    h.actions--;
    const ranged = (h.ranged || h.bowRange) && U.cheb(h.x, h.y, e.x, e.y) > 1;
    await this.attack(h, e, { ranged, proj: ranged ? (h.id === 'elian' ? 'bolt' : 'arrow') : null, label: h.basic.name });
  },

  /* ------------------------------------------------------------ habilidades */
  async useSkill(h, s, d) {
    if (!s) return;
    if (!s.free) { if (h.actions <= 0) return; h.actions--; }
    s.cd = HERO_DEFS[h.id].skills.find((q) => q.id === s.id).cd;
    if (Math.random() < 0.5) FX.bubble(h, U.pick(BARKS[h.id].skill));
    if (s.id === 'wall') {
      h.status.wall = 1; h.status.taunt = 1;
      audio.sfx('shield'); FX.burst('shield', h.mesh.position);
      ENGINE.flashLight(new THREE.Vector3(h.x * TILE, 1.5, h.y * TILE), '#bfe0ff', 3, 0.8);
      this.heroes.forEach((a) => { if (a !== h && !a.ko && U.cheb(a.x, a.y, h.x, h.y) === 1) { a.status.guard = 1; FX.burst('shield', a.mesh.position); } });
      UI.log('Aldric levanta el Muro de Escudos. Los enemigos cercanos le buscarán a él.', 'good');
    } else if (s.id === 'smite') {
      const e = d.unit;
      ENGINE.flashLight(new THREE.Vector3(h.x * TILE, 1.5, h.y * TILE), '#ffe6a0', 3.5, 0.6);
      FX.burst('magic', h.mesh.position, { color: '#fff2c0', color2: '#ffb000' });
      await this.attack(h, e, { atk: h.atk + 2 + (e.undead ? 1 : 0), label: s.name });
    } else if (s.id === 'throw') {
      await this.attack(h, d.unit, { atk: 4, ignore: 1, ranged: true, proj: 'dagger', label: s.name });
    } else if (s.id === 'step') {
      audio.sfx('dark', { vol: 0.6 });
      FX.burst('death', h.mesh.position, { color: '#3a4a40', color2: '#0a0a0a' });
      const m = h.mesh; await U.tween(180, (k) => m.scale.setScalar(1 - k * 0.9));
      h.x = d.x; h.y = d.y; m.position.set(d.x * TILE, 0, d.y * TILE);
      FX.burst('death', m.position, { color: '#3a4a40', color2: '#0a0a0a' });
      await U.tween(220, (k) => m.scale.setScalar(0.1 + k * 0.9));
      h.mvLeft = 0; ENGINE.keyPos.set(d.x * TILE, 0, d.y * TILE);
      if (SETTINGS.follow) ENGINE.focusTile(d.x, d.y);
      this.detectTraps(h, 2);
      const t = this.T(d.x, d.y), room = this.L.rooms[t.room];
      if (room && !room.visited) { room.visited = true; UI.setLocation(this.ch, room); const meta = this.ch.rooms[room.marker]; if (meta && meta.enter) await this.run(meta.enter, { hero: h, room }); }
    } else if (s.id === 'starfire') {
      const e = d.unit;
      await this.attack(h, e, { atk: 4, ranged: true, proj: 'fire', label: s.name });
      audio.sfx('fire'); FX.burst('fire', { x: e.x * TILE, y: 1, z: e.y * TILE });
      ENGINE.flashLight(new THREE.Vector3(e.x * TILE, 1.4, e.y * TILE), '#ff9a4a', 4, 0.6);
      const splash = this.visibleEnemies().filter((o) => o !== e && U.cheb(o.x, o.y, e.x, e.y) === 1);
      for (const o of splash) await this.attack(h, o, { atk: 2, ranged: true, proj: 'fire', label: 'Salpicadura astral', light: false });
    } else if (s.id === 'dawn') {
      const a = d.unit;
      await FX.projectile(new THREE.Vector3(h.x * TILE, 1.6, h.y * TILE), new THREE.Vector3(a.x * TILE, 1.2, a.y * TILE), 'dawn');
      if (a.ko) { a.ko = false; a.ended = true; a.hp = 0; this.standUp(a); await this.heal(a, 3); UI.log(`${a.name} vuelve a ponerse en pie.`, 'good'); }
      else await this.heal(a, 3 + h.healBonus);
      FX.bubble(h, U.pick(BARKS.elian.heal));
    }
    UI.refresh();
  },
  async throwBomb(h, x, y) {
    if (this.items.bomb <= 0 || h.actions <= 0) return;
    this.items.bomb--; h.actions--;
    await FX.projectile(new THREE.Vector3(h.x * TILE, 1.4, h.y * TILE), new THREE.Vector3(x * TILE, 0.3, y * TILE), 'bomb');
    audio.sfx('explode'); ENGINE.shake(0.9); FX.burst('explode', { x: x * TILE, y: 0.5, z: y * TILE });
    ENGINE.flashLight(new THREE.Vector3(x * TILE, 1.5, y * TILE), '#ffb070', 6, 0.7); ENGINE.fx.flash = 0.25;
    const victims = this.allUnits().filter((u) => u.side !== 'npc' && !(u.side === 'hero' && u.ko) && !(u.side === 'enemy' && !u.alive) && U.cheb(u.x, u.y, x, y) <= 1);
    for (const v of victims) await this.diceHit('La bomba', v, 3, { label: 'Bomba alquímica', dir: new THREE.Vector3(v.x - x || 0.01, 0, v.y - y) });
  },
  /* tirada sin atacante físico (bombas, erupciones) */
  async diceHit(name, tgt, atkN, o = {}) {
    const defN = this.defDice(tgt);
    const A = []; for (let i = 0; i < atkN; i++) A.push(this.rollDie());
    const D = []; for (let i = 0; i < defN; i++) D.push(this.rollDie());
    const skulls = A.filter((f) => f === 'skull').length, shieldFace = tgt.side === 'hero' ? 'white' : 'black';
    const shields = D.filter((f) => f === shieldFace).length, dmg = Math.max(0, skulls - shields);
    await UI.dice({ att: { name, side: 'hero' }, tgt, A, D, shieldFace, skulls, shields, dmg, label: o.label, quick: true });
    const tp = new THREE.Vector3(tgt.mesh.position.x, 1.1, tgt.mesh.position.z);
    if (dmg > 0) { FX.burst('hit', tp); audio.sfx('hit'); this.hitReact(tgt, (o.dir || new THREE.Vector3(1, 0, 0)).normalize()); await this.damage(tgt, dmg, {}); }
    else { FX.burst('block', tp); audio.sfx('block'); FX.text(tp, 'Bloqueado', 'block'); }
    UI.log(`${name} → ${tgt.name}: ${dmg ? `<b>${dmg} de daño</b>` : 'sin daño'}.`, tgt.side === 'hero' ? 'bad' : 'good');
    return dmg;
  },
  async drink(h) {
    if (this.items.potion <= 0) return UI.toast('No os quedan pociones.');
    if (h.potionUsed) return UI.toast('Solo una poción por turno.');
    if (h.hp >= h.maxHp) return UI.toast(`${h.name} ya está en plena forma.`);
    this.items.potion--; h.potionUsed = true;
    audio.sfx('potion');
    await this.heal(h, 4);
    UI.log(`${h.name} bebe una poción.`, 'good');
  },
  async elixir(h) {
    if (this.items.elixir <= 0) return UI.toast('No os quedan elixires.');
    this.items.elixir--; h.actions++;
    audio.sfx('levelUp'); FX.burst('magic', h.mesh.position, { color: '#9fe8ff', color2: '#3a8aff' });
    FX.text(new THREE.Vector3(h.mesh.position.x, 1.9, h.mesh.position.z), '+1 acción', 'heal');
  },

  /* ------------------------------------------------------------ interacción */
  async search(h) {
    if (h.actions <= 0) return UI.toast('Registrar gasta tu acción.');
    const room = this.roomOf(h);
    const foes = this.visibleEnemies().filter((e) => this.T(e.x, e.y).room === room.id);
    if (foes.length) return UI.toast('No podéis registrar con enemigos en la sala.');
    h.actions--;
    audio.sfx('page', { vol: 0.5 });
    FX.bubble(h, 'Veamos…', 1.4);
    const fig = h.mesh.userData.model;
    await U.tween(500, (k) => (fig.rotation.x = Math.sin(k * Math.PI) * 0.35));
    let found = 0;
    this.L.traps.forEach((tr) => { if (!tr.revealed && !tr.disarmed && this.T(tr.x, tr.y).room === room.id) { this.revealTrap(tr); found++; } });
    if (found) UI.log(`${h.name} descubre ${found} trampa${found > 1 ? 's' : ''}.`, 'good');
    const meta = this.ch.rooms[room.marker];
    if (meta && meta.search && !room.searchEvent) { room.searchEvent = true; await this.run(meta.search, { hero: h, room }); return; }
    if (room.searched) { if (!found) UI.toast('Aquí ya no queda nada.'); return; }
    room.searched = true;
    const r = Math.random(), safe = room.marker === '1';
    if (r < 0.36) { const g = U.randi(20, 45); this.addGold(g, new THREE.Vector3(h.mesh.position.x, 1.6, h.mesh.position.z)); UI.log(`Bajo una losa suelta: ${g} monedas.`, 'good'); if (h.id === 'sera') FX.bubble(h, U.pick(BARKS.sera.gold)); }
    else if (r < 0.5) { this.items.potion++; FX.text(new THREE.Vector3(h.mesh.position.x, 1.7, h.mesh.position.z), '+1 poción', 'heal'); audio.sfx('potion', { vol: 0.5 }); UI.log('Un vial de poción, intacto.', 'good'); }
    else if (r < 0.58) { this.items.elixir++; FX.text(new THREE.Vector3(h.mesh.position.x, 1.7, h.mesh.position.z), '+1 elixir', 'heal'); UI.log('Un elixir de ímpetu envuelto en tela.', 'good'); }
    else if (r < 0.65) { this.items.bomb++; FX.text(new THREE.Vector3(h.mesh.position.x, 1.7, h.mesh.position.z), '+1 bomba', 'gold'); UI.log('Una bomba alquímica. Con cuidado.', 'good'); }
    else if (r < 0.8 && !safe) { await this.wanderingMonster(h); }
    else { UI.log(U.pick(['Solo polvo y huesos.', 'Nada. Ni siquiera ratas.', 'Una moneda falsa. Ni eso.']), 'neutral'); FX.text(new THREE.Vector3(h.mesh.position.x, 1.7, h.mesh.position.z), 'Nada', 'block'); }
    UI.refresh();
  },
  async wanderingMonster(h) {
    const pool = { crypt: ['skeleton', 'ghoul'], forge: ['goblin', 'orc'], void: ['wraith', 'reflection'] }[WORLD.theme.id];
    const p = this.freeTileNear(h.x, h.y, 2);
    if (!p) return;
    audio.sfx('scare'); ENGINE.shake(0.6); ENGINE.fx.flash = 0.2;
    UI.log('<b>¡Monstruo errante!</b> Algo os había estado siguiendo.', 'bad');
    const e = await this.spawn(U.pick(pool), p.x, p.y);
    FX.bubble(h, '¡¿De dónde ha salido eso?!');
    void e;
  },
  async spawn(type, x, y, fx = 'summon') {
    const e = this.makeEnemy(type, x, y);
    this.enemies.push(e);
    WORLD.addUnit(e, { face: this.active ? Math.atan2(this.active.x - x, this.active.y - y) : 0 });
    this.riseUnit(e, fx);
    audio.sfx(e.T.sfx === 'glass' ? 'glass' : 'summon', { vol: 0.7 });
    UI.refresh();
    await U.sleep(450);
    return e;
  },
  async openChest(h, c) {
    if (h.actions <= 0 || c.looted) return;
    h.actions--; c.looted = true; this.stats.chests++;
    this.faceTo(h, c.x, c.y);
    audio.sfx('chest');
    const lid = c.mesh.userData.lid; c.mesh.userData.glow.visible = true;
    await U.tween(500, (k) => (lid.rotation.x = -1.6 * U.easeOutBack(k)));
    ENGINE.flashLight(new THREE.Vector3(c.x * TILE, 1.2, c.y * TILE), '#ffcf6b', 2.5, 0.8);
    const g = U.randi(40, 80);
    this.addGold(g, new THREE.Vector3(c.x * TILE, 1.4, c.y * TILE));
    let extra = '';
    if (Math.random() < 0.55) { this.items.potion++; extra = ' y una poción'; }
    UI.log(`Cofre: ${g} monedas${extra}.`, 'good');
    setTimeout(() => (c.mesh.userData.glow.visible = false), 900);
    const ev = this.ch.chests[c.idx];
    if (ev) await this.run(ev, { hero: h, room: this.roomOf(h) });
  },
  async readNote(h, n) {
    this.faceTo(h, n.x, n.y);
    if (!n.read) { n.read = true; this.stats.notes++; }
    await this.run(this.ch.notes[n.idx], { hero: h, room: this.roomOf(h) });
  },
  async revive(h, a) {
    if (h.actions <= 0 || !a.ko) return;
    h.actions--;
    this.faceTo(h, a.x, a.y);
    a.ko = false; a.hp = 0; a.ended = true;
    this.standUp(a);
    await this.heal(a, 2);
    FX.bubble(a, a.id === 'aldric' ? 'Gracias. No volverá a pasar.' : a.id === 'sera' ? 'Uf. Te debo una.' : 'Estoy… estoy bien.');
    UI.log(`${h.name} levanta a ${a.name}.`, 'good');
  },
  async disarm(h, tr) {
    if (h.actions <= 0) return;
    h.actions--;
    this.faceTo(h, tr.x, tr.y);
    const chance = this.kit ? 1 : h.id === 'sera' ? 0.9 : 0.5;
    await U.sleep(350);
    if (Math.random() < chance) {
      tr.disarmed = true; audio.sfx('block');
      tr.mesh.userData.spikes.visible = false;
      this.addGold(15, new THREE.Vector3(tr.x * TILE, 1, tr.y * TILE));
      UI.log(`${h.name} desarma la trampa.`, 'good');
    } else {
      UI.log(`${h.name} falla al desarmar la trampa.`, 'bad');
      const t2 = { ...tr }; void t2;
      await this.springTrap(tr, h);
    }
  },

  /* ------------------------------------------------------------ turno de la Sombra */
  async shadowPhase() {
    if (this.state !== 'play') return;
    this.phase = 'shadow'; this.active = null; this.mode = null;
    const gen = this.gen;
    WORLD.setSelection(null); WORLD.setHighlights([]); WORLD.setPath(null);
    UI.refresh();
    this.busy++;
    try {
      const acting = this.visibleEnemies();
      if (acting.length || this.eruptions.length) {
        audio.sfx('turnShadow');
        UI.banner('Turno de la Sombra', acting.length ? `${acting.length} criatura${acting.length > 1 ? 's' : ''} se mueve${acting.length > 1 ? 'n' : ''}` : '', 'shadow');
        UI.shadowMode(true);
        await U.sleep(900);
      }
      // ordenar por cercanía a los héroes
      const dist = (e) => Math.min(...this.heroesUp().map((h) => U.manh(h.x, h.y, e.x, e.y)).concat([99]));
      acting.sort((a, b) => dist(a) - dist(b));
      for (const e of acting) {
        if (this.state !== 'play' || gen !== this.gen || !this.heroesUp().length) break;
        if (!e.alive) continue;
        await this.enemyAct(e);
      }
      // ecos que se disipan con el tiempo: nada aquí
    } catch (err) { console.error(err); }
    UI.shadowMode(false);
    if (gen !== this.gen) return;
    this.busy = Math.max(0, this.busy - 1);
    if (this.state === 'play' && this.heroesUp().length) this.startRound();
  },
  async enemyAct(e) {
    if (e.boss) { const done = await this.bossAct(e); if (done) return; }
    if (!e.alive) return;
    const targets = this.heroesUp(); if (!targets.length) return;
    // curanderos: si un aliado está herido y no hay héroe al alcance, curan
    const R = this.reach(e, e.mv);
    const taunter = targets.find((h) => h.status.taunt && U.manh(h.x, h.y, e.x, e.y) <= 6);
    let best = null;
    R.stand.forEach((k) => {
      const [x, y] = k.split(',').map(Number); const d = R.dist.get(k);
      targets.forEach((h) => {
        if (!this.canHit(e, x, y, h, e.range)) return;
        let s = 100 - d * 1.5 + (h.maxHp - h.hp) * 3 - this.defDice(h) * 4 + (h === taunter ? 80 : 0);
        if (e.ranged) s += U.cheb(x, y, h.x, h.y) * 3;
        s += Math.random() * 2;
        if (!best || s > best.s) best = { x, y, h, s };
      });
    });
    const visible = () => e.mesh && e.mesh.visible;
    if (best) {
      if (best.x !== e.x || best.y !== e.y) await this.moveEnemy(e, this.pathTo(R, best.x, best.y));
      if (!e.alive) return;
      if (visible()) ENGINE.focusTile((e.x + best.h.x) / 2, (e.y + best.h.y) / 2);
      if (Math.random() < 0.25 && e.T.barks) FX.bubble(e, U.pick(e.T.barks), 2);
      await this.attack(e, best.h, { label: e.name });
      return;
    }
    if (e.T.healer) {
      const hurt = this.enemies.find((o) => o.alive && o !== e && o.hp < o.maxHp && U.cheb(o.x, o.y, e.x, e.y) <= 4);
      if (hurt) { audio.sfx('heal', { vol: 0.5 }); FX.burst('heal', hurt.mesh.position); hurt.hp = Math.min(hurt.maxHp, hurt.hp + 1); FX.text(new THREE.Vector3(hurt.mesh.position.x, 1.8, hurt.mesh.position.z), '+1', 'heal'); UI.log(`${e.name} cura a ${hurt.name}.`, 'bad'); await U.sleep(400); return; }
    }
    // acercarse: ruta larga ignorando aliados
    const far = this.reach(e, 60, { ignoreUnits: true });
    let goal = null;
    far.dist.forEach((d, k) => {
      const [x, y] = k.split(',').map(Number);
      targets.forEach((h) => { if (this.canHit(e, x, y, h, e.range, e.range > 1)) { const s = d - (h === taunter ? 4 : 0); if (!goal || s < goal.s) goal = { x, y, s }; } });
    });
    if (!goal) return;
    const full = this.pathTo(far, goal.x, goal.y);
    if (!full) return;
    let stop = null;
    for (let i = Math.min(e.mv, full.length - 1); i >= 1; i--) { const k = U.key(full[i].x, full[i].y); if (R.stand.has(k) && R.dist.get(k) <= e.mv) { stop = full[i]; break; } }
    if (stop) await this.moveEnemy(e, this.pathTo(R, stop.x, stop.y));
  },
  async moveEnemy(e, path) {
    if (!path || path.length < 2) return;
    const vis = e.mesh && e.mesh.visible;
    if (vis) ENGINE.focusTile(path[path.length - 1].x, path[path.length - 1].y);
    for (let i = 1; i < path.length; i++) {
      await this.hop(e, path[i].x, path[i].y, { dur: vis ? 150 : 1 });
      if (!e.alive) return;
    }
  },

  /* ------------------------------------------------------------ jefes */
  async bossAct(b) {
    const heroes = this.heroesUp();
    const near = (u) => heroes.filter((h) => U.cheb(h.x, h.y, u.x, u.y) === 1 && this.meleeOK(u.x, u.y, h.x, h.y));
    ENGINE.focusTile(b.x, b.y);
    if (b.kind === 'malakor') {
      const minions = this.enemies.filter((e) => e.alive && e.summoned).length;
      if ((this.round % 3 === 0 || minions === 0) && minions < 4) {
        FX.bubble(b, U.pick(['¡Levantaos!', 'Servidme otra vez.', 'La muerte no es excusa.']), 2.2);
        audio.sfx('summon'); ENGINE.flashLight(new THREE.Vector3(b.x * TILE, 2, b.y * TILE), '#6dffb0', 4, 1);
        for (let i = 0; i < 2; i++) { const p = this.freeTileNear(b.x, b.y, 3); if (p) { const s = await this.spawn('skeleton', p.x, p.y); s.summoned = true; } }
        await U.sleep(300);
      }
      return false;
    }
    if (b.kind === 'ignis') {
      // erupciones marcadas el turno anterior
      if (this.eruptions.length) {
        audio.sfx('quake'); ENGINE.shake(0.8);
        FX.bubble(b, '¡ARDED!', 1.8);
        for (const t of this.eruptions) {
          FX.burst('fire', { x: t.x * TILE, y: 0.3, z: t.y * TILE }); FX.burst('explode', { x: t.x * TILE, y: 0.3, z: t.y * TILE });
          audio.sfx('lava'); ENGINE.flashLight(new THREE.Vector3(t.x * TILE, 1, t.y * TILE), '#ff6a1a', 4, 0.7);
          const u = this.unitAt(t.x, t.y);
          if (u && u.side === 'hero' && !u.ko) await this.diceHit('La erupción', u, 4, { label: 'Erupción' });
          await U.sleep(160);
        }
        this.eruptions = []; WORLD.setDanger([]);
      }
      const adj = near(b);
      if (adj.length >= 2) {
        FX.bubble(b, '¡Aplastaros a todos!', 1.8);
        audio.sfx('bossRoar'); ENGINE.shake(1);
        for (const h of adj) await this.attack(b, h, { label: 'Golpe de magma' });
        await this.markEruptions(b);
        return true;
      }
      await this.enemyActNormal(b);
      await this.markEruptions(b);
      return true;
    }
    if (b.kind === 'aethelgard') {
      const R = this.reach(b, b.mv);
      const canReach = heroes.some((h) => [...R.stand].some((k) => { const [x, y] = k.split(',').map(Number); return this.meleeOK(x, y, h.x, h.y); }));
      if (!canReach && heroes.length) {
        const weak = heroes.slice().sort((a, c) => a.hp - c.hp)[0];
        const p = this.freeTileNear(weak.x, weak.y, 1, false);
        if (p) {
          FX.bubble(b, 'No hay sombra donde esconderse.', 2);
          audio.sfx('dark'); FX.burst('magic', b.mesh.position, { color: '#e8f7ff', color2: '#4ab0ff' });
          const m = b.mesh; await U.tween(220, (k) => m.scale.setScalar(1 - 0.95 * k));
          b.x = p.x; b.y = p.y; m.position.set(p.x * TILE, 0, p.y * TILE); this.faceTo(b, weak.x, weak.y);
          ENGINE.focusTile(p.x, p.y);
          FX.burst('magic', m.position, { color: '#e8f7ff', color2: '#4ab0ff' }); ENGINE.flashLight(new THREE.Vector3(p.x * TILE, 2, p.y * TILE), '#bfe8ff', 4, 0.6);
          await U.tween(260, (k) => m.scale.setScalar(0.05 + 0.95 * k));
          if (this.meleeOK(b.x, b.y, weak.x, weak.y)) await this.attack(b, weak, { label: 'Estocada espectral' });
          return true;
        }
      }
      return false;
    }
    if (b.kind === 'isolde') {
      const wraiths = this.enemies.filter((e) => e.alive && e.summoned).length;
      if (this.round % 3 === 0 && wraiths < 2) {
        FX.bubble(b, U.pick(['Hijos míos, venid.', 'El Ojo tiene muchos hijos.']), 2);
        audio.sfx('summon');
        for (let i = 0; i < 2; i++) { const p = this.freeTileNear(b.x, b.y, 3); if (p) { const s = await this.spawn('wraith', p.x, p.y); s.summoned = true; } }
      }
      let targets = heroes.filter((h) => U.cheb(h.x, h.y, b.x, b.y) <= b.range && this.los(b.x, b.y, h.x, h.y));
      if (!targets.length) {
        // se desvanece y reaparece con línea de visión
        const room = this.roomOf(b);
        const spots = room.tiles.filter((t) => this.passable(t.x, t.y, b) && !this.unitAt(t.x, t.y) && heroes.some((h) => U.cheb(h.x, h.y, t.x, t.y) <= b.range && U.cheb(h.x, h.y, t.x, t.y) >= 2 && this.los(t.x, t.y, h.x, h.y)));
        if (spots.length) {
          const p = U.pick(spots); const m = b.mesh;
          audio.sfx('dark'); await U.tween(250, (k) => m.scale.setScalar(1 - 0.95 * k));
          b.x = p.x; b.y = p.y; m.position.set(p.x * TILE, 0, p.y * TILE);
          ENGINE.focusTile(p.x, p.y);
          await U.tween(250, (k) => m.scale.setScalar(0.05 + 0.95 * k));
          targets = heroes.filter((h) => U.cheb(h.x, h.y, b.x, b.y) <= b.range && this.los(b.x, b.y, h.x, h.y));
        }
      }
      targets.sort((a, c) => a.hp - c.hp);
      const n = b.hp <= b.maxHp / 2 ? 2 : 1;
      if (n === 2 && !b.phase2) { b.phase2 = true; FX.bubble(b, '¡Mirad dentro del Ojo!', 2.4); ENGINE.fx.flash = 0.3; audio.sfx('scare'); WORLD.setLightsMult(0.5); }
      for (const h of targets.slice(0, n)) {
        const dmg = await this.attack(b, h, { label: 'Mirada del Vacío', proj: 'void' });
        if (dmg > 0 && b.alive) { b.hp = Math.min(b.maxHp, b.hp + 1); FX.text(new THREE.Vector3(b.mesh.position.x, 2.6, b.mesh.position.z), '+1', 'heal'); UI.refresh(); }
      }
      return true;
    }
    return false;
  },
  async enemyActNormal(e) { const wasBoss = e.boss; e.boss = false; await this.enemyAct(e); e.boss = wasBoss; },
  async markEruptions(b) {
    const heroes = this.heroesUp().filter((h) => U.cheb(h.x, h.y, b.x, b.y) <= 7);
    const tiles = [];
    U.shuffle(heroes.slice()).slice(0, 3).forEach((h) => tiles.push({ x: h.x, y: h.y }));
    if (!tiles.length) return;
    this.eruptions = tiles; WORLD.setDanger(tiles);
    audio.sfx('lava'); FX.bubble(b, 'El suelo arderá bajo vuestros pies.', 2.4);
    UI.log('<b>Ignis marca el suelo.</b> Apartaos de las runas rojas antes de que acabe el turno.', 'bad');
    await U.sleep(500);
  },
  async bossDefeated(b) {
    this.busy++;
    try {
      UI.bossBar(null);
      ENGINE.fx.flash = 0.5; ENGINE.shake(1.2); audio.sfx('explode');
      // los esbirros invocados se deshacen
      this.enemies.filter((e) => e.alive && e.summoned).forEach((e) => { e.hp = 0; this.kill(e); });
      const ch = this.ch;
      if (b.kind === 'isolde') { await this.run(ch.finalDefeat, {}); this.state = 'ending'; setTimeout(() => this.ending(), 60); return; }
      await this.run(ch.boss.defeat, {});
      if (b.kind === 'aethelgard') return;
      this.state = 'between';
      setTimeout(() => this.chapterComplete(), 60);
    } finally { this.busy = Math.max(0, this.busy - 1); }
  },
  async seal() {
    const a = this.L.altars[0]; if (!a) return;
    const el = this.heroes.find((h) => h.id === 'elian');
    ENGINE.focusTile(a.x, a.y, { dist: 16 });
    await U.sleep(500);
    const from = new THREE.Vector3(a.x * TILE, 1.5, a.y * TILE);
    const to = el.mesh ? new THREE.Vector3(el.mesh.position.x, 1.8, el.mesh.position.z) : from;
    audio.sfx('summon');
    for (let i = 0; i < 4; i++) { FX.projectile(from, to, 'dawn'); await U.sleep(140); }
    await U.sleep(400);
    WORLD.setLightsMult(0.15); ENGINE.fx.desatT = 0.4;
    a.mesh.userData.gem.material = MAT.std('#222', 0.5);
    a.light.on = false;
    audio.sfx('torchOut');
    await U.sleep(1200);
    WORLD.setLightsMult(1); ENGINE.fx.desatT = 0;
  },
  async chapterComplete() {
    this.state = 'between';
    audio.stinger('victory'); audio.setMusic('silence');
    this.flags['done' + this.chIdx] = true;
    await UI.victoryCard(this.ch, this.stats);
    await this.camp(this.chIdx);
  },
  async camp(idx) {
    this.state = 'camp';
    this.save('camp');
    UI.showHUD(false);
    const c = CAMPS[idx];
    await UI.fadeOut();
    FX.clearLabels();
    WORLD.buildCamp();
    this.heroes = ['aldric', 'sera', 'elian'].map((id) => this.makeHero(id));
    const spots = [[3.4, 2.6, 2.2], [6.6, 2.4, -2.1], [5, 4.3, 3.14]];
    this.heroes.forEach((h, i) => { h.x = 0; h.y = 0; WORLD.addUnit(h, { face: 0 }); const m = h.mesh; m.position.set(spots[i][0] * TILE, 0, spots[i][1] * TILE); m.lookAt(5 * TILE, 0, 3 * TILE); });
    this.enemies = []; this.npcs = []; this.ch = Object.assign({}, CHAPTERS[idx], { lantern: this.flags.lantern || CHAPTERS[idx].lantern });
    this.updateLantern();
    ENGINE.focus(5 * TILE, 3 * TILE, { dist: 13, pitch: 0.55, yaw: 0.2, instant: true });
    audio.startAmbient('camp'); audio.setMusic('camp');
    await UI.fadeIn();
    UI.locationCard(c.title);
    ENGINE.cam.t.yaw = 0.2;
    this.campOrbit = true;
    await this.run(c.steps, {});
    await UI.shop();
    this.campOrbit = false;
    await this.startChapter(idx + 1);
  },
  async defeat() {
    this.state = 'defeat';
    audio.stinger('defeat'); audio.setMusic('silence'); audio.heartbeat(false);
    ENGINE.fx.desatT = 0.9;
    const choice = await UI.defeatCard();
    ENGINE.fx.desatT = 0;
    if (choice === 'retry' && this.checkpoint) { this.restore(this.checkpoint); this.startChapter(this.checkpoint.chIdx); }
    else UI.title();
  },
  async ending() {
    this.state = 'ending';
    U.store.del('umbral.save.v1');
    const ep = EPILOGUES[this.flags.broke === false ? 'gave' : 'broke'];
    audio.setMusic('menu');
    await UI.ending(ep, this.stats);
    UI.title();
  },

  /* ------------------------------------------------------------ guion */
  async run(steps, ctx = {}) {
    if (!steps) return;
    for (const st of steps) {
      if (!Array.isArray(st)) continue;
      const [k, ...a] = st;
      try {
        if (SPEAKERS[k] && k !== 'narrador') { await UI.say(k, a[0]); continue; }
        switch (k) {
          case 'n': await UI.say('narrador', a[0]); break;
          case 'wait': await U.sleep(a[0]); break;
          case 'sfx': audio.sfx(a[0], { dur: a[1] }); break;
          case 'music': audio.setMusic(a[0]); break;
          case 'stinger': audio.stinger(a[0]); break;
          case 'shake': ENGINE.shake(a[0] || 0.5); break;
          case 'objective': UI.objective(a[0]); break;
          case 'hint': UI.hintOnce(a[0]); break;
          case 'bossbar': this.boss = this.enemies.find((e) => e.boss && e.alive); UI.bossBar(this.boss); break;
          case 'camBoss': { const b = this.enemies.find((e) => e.boss && e.alive); if (b) await ENGINE.focusWait(b.x, b.y, { dist: 15 }); break; }
          case 'camAltar': { const al = this.L.altars[0]; if (al) await ENGINE.focusWait(al.x, al.y, { dist: 15 }); break; }
          case 'bark': { const who = a[0] === 'enemy' ? U.pick(this.visibleEnemies()) : this.heroes.find((h) => h.id === a[0]); if (who) FX.bubble(who, a[1]); break; }
          case 'lights': await this.lights(a[0]); break;
          case 'scare': await UI.scare(a[0]); break;
          case 'spawn': await this.scriptSpawn(a[0], a[1], a[2] || 1, ctx); break;
          case 'npc': await this.spawnNPC(a[0], ctx); break;
          case 'npcGone': await this.removeNPC(a[0]); break;
          case 'note': await UI.note(a[0], a[1]); break;
          case 'give': this.give(a[0], a[1]); break;
          case 'flag': this.flags[a[0]] = a[1]; break;
          case 'lantern': this.flags.lantern = a[0]; this.updateLantern(); break;
          case 'seal': await this.seal(); break;
          case 'twist': await this.twist(); break;
          case 'spawnBoss': await this.spawnFinalBoss(a[0]); break;
          case 'choice': { const pick = await UI.choice(a[0], a[1]); if (pick && pick[2]) await this.run(pick[2], ctx); break; }
        }
      } catch (e) { console.error('step', st, e); }
    }
    UI.endDialogue();
  },
  async lights(mode) {
    if (mode === 'out') { audio.sfx('torchOut'); WORLD.setLightsMult(0); ENGINE.key.intensity = 0.12; ENGINE.hemi.intensity = 0.08; await U.sleep(400); }
    else if (mode === 'on') { WORLD.setLightsMult(1); ENGINE.key.intensity = 2.6; ENGINE.hemi.intensity = WORLD.theme.hemi * 2.2; audio.sfx('torch'); }
    else if (mode === 'flicker') { for (let i = 0; i < 5; i++) { WORLD.setLightsMult(i % 2 ? 1 : 0.15); await U.sleep(70 + Math.random() * 90); } WORLD.setLightsMult(1); }
  },
  async scriptSpawn(type, where, n, ctx) {
    const h = ctx.hero || this.active || this.heroesUp()[0];
    for (let i = 0; i < n; i++) {
      let p = null;
      if (where === 'near' && h) p = this.freeTileNear(h.x, h.y, 2);
      else if (where === 'room') {
        const room = ctx.room || this.roomOf(h);
        const cands = room.tiles.filter((t) => this.passable(t.x, t.y, { side: 'enemy' }) && !this.unitAt(t.x, t.y)).sort((a, b) => Math.min(...this.heroes.map((q) => U.cheb(q.x, q.y, b.x, b.y))) - Math.min(...this.heroes.map((q) => U.cheb(q.x, q.y, a.x, a.y))));
        p = cands[Math.floor(Math.random() * Math.min(4, cands.length))];
      } else if (Array.isArray(where)) p = { x: where[0], y: where[1] };
      if (p) { const e = await this.spawn(type, p.x, p.y, 'summon'); this.faceTo(e, h.x, h.y); }
    }
  },
  async spawnNPC(kind, ctx) {
    const room = ctx.room || this.roomOf(this.active || this.heroes[0]);
    const cx = Math.round(room.cx), cy = Math.round(room.cy);
    let p = this.passable(cx, cy, {}) && !this.unitAt(cx, cy) ? { x: cx, y: cy } : this.freeTileNear(cx, cy, 3);
    if (!p) return;
    const npc = { id: 'npc_' + kind, side: 'npc', kind, name: SPEAKERS[kind].name, model: kind, x: p.x, y: p.y, hp: 1, maxHp: 1, alive: true, status: {} };
    this.npcs.push(npc);
    WORLD.addUnit(npc, { face: 0 });
    const h = ctx.hero || this.heroes[0]; this.faceTo(npc, h.x, h.y);
    npc.mesh.userData.model.position.y = 0; npc.mesh.scale.setScalar(0.01);
    audio.sfx('summon', { vol: 0.5 }); FX.burst('soul', npc.mesh.position);
    await ENGINE.focusWait(p.x, p.y, { dist: 14 });
    await U.tween(700, (k) => npc.mesh.scale.setScalar(Math.max(0.01, k)), U.easeOutBack);
  },
  async removeNPC(kind) {
    const npc = this.npcs.find((n) => n.kind === kind); if (!npc) return;
    FX.burst('soul', npc.mesh.position); audio.sfx('heal', { vol: 0.5 });
    await U.tween(800, (k) => { npc.mesh.scale.setScalar(Math.max(0.01, 1 - k)); npc.mesh.position.y = k * 1.5; });
    WORLD.removeUnit(npc); this.npcs = this.npcs.filter((n) => n !== npc);
  },
  give(what) {
    if (what === 'tomasDagger') { this.flags.tomasDagger = true; const s = this.heroes.find((h) => h.id === 'sera'); s.atk++; FX.burst('magic', s.mesh.position, { color: '#cfe6ff' }); audio.sfx('levelUp'); }
    else if (what === 'blessing') this.heroes.forEach((h) => { if (!h.ko) this.heal(h, 2); });
    else if (what === 'blessing2') this.heroes.forEach((h) => this.heal(h, 3));
    UI.refresh();
  },
  async twist() {
    const el = this.heroes.find((h) => h.id === 'elian');
    const al = this.L.altars[0];
    // el farol abandona el báculo
    this.flags.lanternGone = true; this.updateLantern();
    if (el && el.mesh) {
      const p = new THREE.Vector3(el.mesh.position.x, 1.8, el.mesh.position.z);
      await FX.projectile(p, new THREE.Vector3(al.x * TILE, 1.8, (al.y - 1) * TILE), 'void');
    }
    ENGINE.fx.flash = 0.6; audio.sfx('scare'); ENGINE.shake(1);
    await this.run(this.ch.twist, {});
  },
  async spawnFinalBoss(type) {
    const al = this.L.altars[0];
    let p = { x: al.x, y: al.y - 1 };
    if (!this.passable(p.x, p.y, { flies: true }) || this.unitAt(p.x, p.y)) p = this.freeTileNear(al.x, al.y, 3, false) || p;
    const b = this.makeEnemy(type, p.x, p.y);
    if (this.flags.broke === false) { b.hp += 4; b.maxHp = b.hp; b.atk += 1; }
    this.enemies.push(b);
    WORLD.addUnit(b, { face: 0 });
    b.active = true;
    const m = b.mesh; m.scale.setScalar(0.01);
    ENGINE.flashLight(new THREE.Vector3(p.x * TILE, 2, p.y * TILE), '#c08bff', 6, 1.5);
    FX.burst('summon', m.position, { color: '#e0ccff', color2: '#5a2aaa' }); audio.sfx('bossRoar');
    await ENGINE.focusWait(p.x, p.y, { dist: 16 });
    await U.tween(900, (k) => m.scale.setScalar(Math.max(0.01, k)), U.easeOutBack);
    this.boss = b;
  }
};
