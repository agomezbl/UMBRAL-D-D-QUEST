/* ==========================================================================
   Reglas, turnos, IA de la Sombra, eventos de historia y jefes
   ========================================================================== */
const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const HERO_IDS = HERO_ROSTER;
const DEFAULT_PARTY = ['barbaro', 'elfa', 'hechicero'];
const SAVE_KEY = 'umbral.save.v3', DESCENT_KEY = 'umbral.descent.v2';

const GAME = {
  state: 'title', chIdx: 0, ch: null, L: null,
  heroes: [], enemies: [], npcs: [],
  round: 0, phase: 'idle', active: null, busy: 0, mode: null, pending: null,
  gold: 60, items: { potion: 2, elixir: 0, bomb: 1 }, gear: {}, stash: [], flags: {}, difficulty: 'heroe', D: DIFFICULTY.heroe,
  party: DEFAULT_PARTY.slice(), talents: {}, build: {},
  stats: null, boss: null, eruptions: [], uid: 0, doom: 0, undo: null,

  newStats() { return { kills: 0, rounds: 0, gold: 0, dealt: 0, taken: 0, chests: 0, notes: 0, falls: 0, checks: 0, checksOk: 0, start: Date.now() }; },

  /* ------------------------------------------------------------ partida */
  setDifficulty(d) { this.difficulty = DIFFICULTY[d] ? d : 'heroe'; this.D = DIFFICULTY[this.difficulty]; window.GAME_DIFF = this.difficulty; },
  /* Un grupo válido: de 1 a 5 héroes distintos del plantel */
  validParty(p) { const ok = Array.isArray(p) ? p.filter((id, i) => HERO_DEFS[id] && p.indexOf(id) === i).slice(0, 5) : []; return ok.length ? ok : DEFAULT_PARTY.slice(); },
  newGame(difficulty, build, party) {
    this.setDifficulty(difficulty); this.descent = null;
    this.party = this.validParty(party);
    this.gold = 60; this.items = { potion: this.D.potions + PARTY_SCALE.of(this.party.length, 'potions'), elixir: 0, bomb: 1 }; this.flags = {};
    this.gear = {}; this.stash = []; this.talents = {}; this.build = {};
    HERO_ROSTER.forEach((id) => { this.gear[id] = []; this.talents[id] = []; });
    this.stats = this.newStats();
  },
  snapshot(stage) {
    return { v: 3, stage, chIdx: this.chIdx, gold: this.gold, items: Object.assign({}, this.items), party: this.party.slice(), gear: JSON.parse(JSON.stringify(this.gear || {})), stash: (this.stash || []).slice(), flags: JSON.parse(JSON.stringify(this.flags)), difficulty: this.difficulty, stats: Object.assign({}, this.stats), talents: JSON.parse(JSON.stringify(this.talents)), build: JSON.parse(JSON.stringify(this.build || {})), descent: this.descent ? JSON.parse(JSON.stringify(this.descent)) : null };
  },
  restore(s) {
    this.chIdx = s.chIdx; this.gold = s.gold; this.items = Object.assign({}, s.items);
    this.flags = Object.assign({}, s.flags); this.setDifficulty(s.difficulty); this.stats = Object.assign(this.newStats(), s.stats || {});
    this.party = this.validParty(s.party);
    this.talents = {}; this.gear = {};
    HERO_ROSTER.forEach((id) => { this.talents[id] = ((s.talents || {})[id] || []).slice(); this.gear[id] = ((s.gear || {})[id] || []).slice(); });
    this.stash = (s.stash || []).slice(); this.build = s.build ? JSON.parse(JSON.stringify(s.build)) : {};
    this.descent = s.descent ? JSON.parse(JSON.stringify(s.descent)) : null;
  },
  save(stage) { const s = this.snapshot(stage); this.checkpoint = s; U.store.set(this.saveKey(), s); },

  /* ------------------------------------------------------------ héroes: vida, ataque, defensa y movimiento */

  talentDef(id, tid) { for (const tier of TALENTS[id] || []) for (const t of tier) if (t.id === tid) return t; return null; },
  /* Lo que suman equipo, talentos y mejoras del Descenso a un número */
  modOf(id, key) {
    let n = 0;
    const add = (m) => { if (!m) return; const v = m[key]; if (v === true) n = Math.max(n, 1); else if (key === 'range' && v) n = Math.max(n, v); else if (v) n += v; };
    this.gearOf(id).forEach((it) => add(it.mods));
    (this.talents[id] || []).forEach((tid) => { const t = this.talentDef(id, tid); if (t) add(t.mods); });
    add(this.build && this.build[id]);
    return n;
  },
  /* Los números del héroe: base + equipo + talentos + dificultad */
  derive(id, size = this.party.length) {
    const d = HERO_DEFS[id], S = d.stats, D = this.D, m = (k) => this.modOf(id, k), f = this.flags;
    const out = {
      hp: S.hp + D.heroHp + m('hp') + (f.vigorCh === this.chIdx ? 2 : 0) + PARTY_SCALE.of(size, 'hp'),
      mv: Math.max(2, S.mv + m('mv')),
      def: Math.max(1, S.def + m('def') + PARTY_SCALE.of(size, 'def')),
      atk: S.atk + m('atk') + (d.ranged ? m('shoot') + (d.magic ? m('spell') : 0) : m('melee')) + PARTY_SCALE.of(size, 'atk'),
      range: Math.max(S.range || 1, m('range'))
    };
    out.melee = d.ranged ? (S.melee || 1) + m('melee') + PARTY_SCALE.of(size, 'atk') : out.atk;
    return out;
  },
  /* ------------------------------------------------------------ equipo con requisitos */
  gearDef(itemId) { return GEAR.find((q) => q.id === itemId) || null; },
  gearOf(id) { return ((this.gear && this.gear[id]) || []).map((k) => this.gearDef(k)).filter(Boolean); },
  gearMod(id, key) { let n = 0; this.gearOf(id).forEach((it) => { const v = it.mods && it.mods[key]; if (v === true) n = Math.max(n, 1); else if (key === 'range' && v) n = Math.max(n, v); else if (v) n += v; }); return n; },
  hasGear(id, itemId) { return !!(this.gear && this.gear[id] && this.gear[id].includes(itemId)); },
  ownerOf(itemId) { return HERO_ROSTER.find((id) => this.hasGear(id, itemId)) || (this.stash.includes(itemId) ? 'stash' : null); },
  /* ¿Puede llevarlo? Devuelve el motivo si no */
  gearBlock(id, it) {
    if (it.who && !it.who.includes(id)) return `${HERO_DEFS[id].role}: no puede llevarlo`;
    return null;
  },
  gearDiscount() { return this.party.some((id) => this.modOf(id, 'haggle')) ? 0.1 : 0; },
  gearPrice(it) { return Math.round(it.cost * (1 - this.gearDiscount())); },
  /* Pone el objeto a un héroe; lo que llevaba en ese hueco vuelve al arcón */
  equip(itemId, id) {
    const it = this.gearDef(itemId); if (!it || this.gearBlock(id, it)) return false;
    HERO_ROSTER.forEach((h) => { if (this.gear[h]) this.gear[h] = this.gear[h].filter((k) => k !== itemId); });
    this.stash = this.stash.filter((k) => k !== itemId);
    const prev = this.gearOf(id).find((g) => g.slot === it.slot);
    if (prev) { this.gear[id] = this.gear[id].filter((k) => k !== prev.id); this.stash.push(prev.id); }
    (this.gear[id] = this.gear[id] || []).push(itemId);
    return true;
  },
  /* Si un héroe ya no cumple los requisitos de algo que lleva, vuelve al arcón */
  checkGear() {
    HERO_ROSTER.forEach((id) => { (this.gear[id] || []).slice().forEach((k) => { const it = this.gearDef(k); if (!it || this.gearBlock(id, it)) { this.gear[id] = this.gear[id].filter((q) => q !== k); if (it) this.stash.push(k); } }); });
  },
  buyGear(itemId, id) {
    const it = this.gearDef(itemId); if (!it || this.ownerOf(itemId)) return false;
    const price = this.gearPrice(it); if (this.gold < price || this.gearBlock(id, it)) return false;
    this.gold -= price; this.equip(itemId, id); return true;
  },

  makeHero(id) {
    const d = HERO_DEFS[id], s = this.derive(id), tal = this.talents[id] || [];
    const h = {
      id, side: 'hero', kind: id, name: d.name, full: d.full, role: d.role, model: d.model, color: d.color,
      tal: new Set(tal), traits: d.traits || {}, hp: s.hp, maxHp: s.hp, atk: s.atk, meleeAtk: s.melee, def: s.def, mv: s.mv, range: s.range,
      ranged: !!d.ranged, dtype: d.dtype || 'phys', proj: d.proj, magic: !!d.magic || !!this.modOf(id, 'magic'),
      wounds: 0, skills: d.skills.map((sk) => Object.assign({}, sk, { cd: 0 })), basic: d.basic,
      mvLeft: 0, actions: 0, ended: false, ko: false, alive: true, status: {}, potionUsed: false, modelOpts: {}
    };
    this.gearOf(id).forEach((it) => { if (it.look) h.modelOpts[it.look] = true; });
    return h;
  },
  skillInfo(h, s) {
    const t = h.tal, spell = this.modOf(h.id, 'spell');
    switch (s.id) {
      case 'torbellino': return { dice: h.atk, text: `Golpea a todos los enemigos que tenga al lado: ${h.atk} dados a cada uno.` };
      case 'grito': return { radius: 2, heal: 2, text: 'Los enemigos a 2 casillas quedan aterrados 2 turnos (−1 dado de ataque) y Korvak recupera 2 PV. Los guardianes no se asustan.' };
      case 'sismico': { const r = t.has('terremoto') ? 2 : 1; return { dice: h.meleeAtk, radius: r, text: `Martillazo de ${h.meleeAtk} dados que ignora 1 escudo. Los enemigos a ${r} casilla${r > 1 ? 's' : ''} de Borin quedan aturdidos y pierden su turno (los guardianes no).` }; }
      case 'muralla': return { text: `+2 dados de defensa hasta su próximo turno y los enemigos cercanos irán a por él.${t.has('murallaHierro') ? ' Los aliados de al lado, +1.' : ''}` };
      case 'lluvia': { const n = (t.has('tormenta') ? 3 : 2) + this.modOf(h.id, 'shoot'); return { dice: n, text: `${n} dados a cada enemigo de una zona de 3×3, a hasta 6 casillas. No daña a los aliados.` }; }
      case 'salto': return { text: `Salta a una casilla libre a 5 casillas, por encima de enemigos y obstáculos. No gasta la acción.${t.has('viento') ? ' Queda Inspirada.' : ''}` };
      case 'bola': { const n = (t.has('meteoro') ? 4 : 3) + spell, sp = (t.has('meteoro') ? 3 : 2) + spell; return { dice: n, splash: sp, text: `${n} dados de fuego al objetivo y ${sp} a cada enemigo junto a él.${t.has('llama') ? ' Deja ardiendo a quien hiere.' : ''}` }; }
      case 'luz': { const n = 3 + spell + (t.has('aurora') ? 1 : 0); return { heal: n, text: `Cura ${n} PV a un aliado a 4 casillas (o a sí mismo) o levanta a un caído.${t.has('aurora') ? ' También cura 2 PV a los aliados junto al objetivo.' : ''}` }; }
      case 'carga': { const n = h.atk + (t.has('imparable') ? 2 : 1); return { dice: n, text: `Corre hasta un enemigo a 5 casillas sin gastar movimiento y le golpea con ${n} dados.` }; }
      case 'tribu': return { radius: 3, text: `Ella y sus aliados a 3 casillas: +1 dado en su próximo ataque y +2 de movimiento este turno.${t.has('cancion') ? ' Además recuperan 2 PV.' : ''}` };
    }
    return { text: '' };
  },
  skillCd(h, s) { if (s.id === 'torbellino' && h.tal.has('torbellinoVeloz')) return 2; if (s.id === 'salto' && h.tal.has('viento')) return 2; return (HERO_DEFS[h.id].skills.find((q) => q.id === s.id) || s).cd || 0; },
  makeEnemy(type, x, y, o = {}) {
    const T = ENEMY_TYPES[type], D = this.D;
    const e = { id: 'e' + (++this.uid), side: 'enemy', kind: type, name: T.name, model: T.model, hp: T.hp, maxHp: T.hp, atk: T.atk, def: T.def, mv: T.mv, range: T.range || 1, ranged: !!T.ranged, proj: T.proj,
      boss: !!T.boss, undead: !!T.undead, flies: !!T.flies, gold: T.gold, x, y, alive: true, active: false, status: {}, T, role: T.role, dtype: 'phys', magic: true };
    const S = (this.ch && this.ch.scale) || null;
    let iq = T.iq || 2;
    if (e.boss) { e.hp += D.bossHp + (S ? S.bossHp : 0); e.atk += D.bossAtk; e.hp = Math.round(e.hp * PARTY_SCALE.of(this.party.length, 'boss')); }
    else if (type !== 'risen') { e.hp += D.enemyHp + (S ? S.hp : 0); e.atk = Math.max(1, e.atk + D.enemyAtk + (S ? S.atk : 0)); }
    if (o.champion) { e.champion = true; e.hp += 1; e.atk += 1; e.gold *= 2; e.name = 'Campeón · ' + e.name; iq += 1; }
    if (type === 'ignis' && this.flags.ignisWeak) e.def = Math.max(1, e.def - 1);
    e.maxHp = e.hp = Math.max(1, e.hp);
    e.iq = U.clamp(iq + D.iq, 1, 5);
    return e;
  },
  iqLabel(e) { return e.iq <= 2 ? 'Bestial' : e.iq === 3 ? 'Táctico' : 'Astuto'; },
  allUnits() { return this.heroes.concat(this.enemies.filter((e) => e.alive), this.npcs); },
  unitAt(x, y) { return this.allUnits().find((u) => u.x === x && u.y === y && (u.side !== 'enemy' || u.alive)); },
  heroesUp() { return this.heroes.filter((h) => !h.ko); },
  foesOf(u) { return u.side === 'hero' ? this.visibleEnemies() : this.heroesUp(); },
  up(u) { return u.side === 'hero' ? !u.ko : u.side === 'enemy' ? u.alive : false; },

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
  /* ¿Quién puede reaccionar con un ataque de oportunidad contra «u»? */
  reactorsFor() { return []; },

  provokes() { return false; },
  reach(u, maxSteps, opts = {}) {
    const dist = new Map(), prev = new Map(), stand = new Set(), prov = new Map();
    const reactors = opts.ignoreUnits || opts.noProv ? [] : this.reactorsFor(u);
    const k0 = U.key(u.x, u.y); dist.set(k0, 0); stand.add(k0); prov.set(k0, 0);
    const q = [[u.x, u.y]];
    while (q.length) {
      const [cx, cy] = q.shift(); const ck = U.key(cx, cy), d = dist.get(ck), pc = prov.get(ck);
      if (d >= maxSteps) continue;
      for (const [dx, dy] of DIRS4) {
        const nx = cx + dx, ny = cy + dy, k = U.key(nx, ny);
        if (!this.passable(nx, ny, u)) continue;
        const o = this.unitAt(nx, ny);
        if (o && o !== u && o.side !== u.side && o.side !== 'npc' && !opts.ignoreUnits) continue;
        if (o && o.side === 'npc') continue;
        let p = pc;
        if (reactors.length) for (const r of reactors) if (this.provokes(u, r, cx, cy, nx, ny)) p++;
        if (!dist.has(k)) {
          dist.set(k, d + 1); prev.set(k, ck); prov.set(k, p);
          if (!o || o === u || opts.ignoreUnits) stand.add(k);
          q.push([nx, ny]);
        } else if (dist.get(k) === d + 1 && p < prov.get(k)) { prev.set(k, ck); prov.set(k, p); }
      }
    }
    return { dist, prev, stand, prov };
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
    this.tutorial = !!opts.tutorial;
    const R = opts.resume && opts.resume.run;
    this.state = 'play'; this.chIdx = idx; this.ch = opts.def || this.chapterDef(idx);
    if (!this.stats) this.stats = this.newStats();
    if (R) this.checkpoint = opts.resume.start || this.snapshot('chapter');
    else if (!this.tutorial) this.save('chapter');
    UI.hideAll(); UI.bossBar(null); UI.shadowMode(false);
    this.busy++;
    try {
      const ch = this.ch;
      await UI.chapterCard(R ? Object.assign({}, ch, { eyebrow: ch.descent ? `Descenso · Nivel ${ch.num} · ronda ${R.round}` : `Capítulo ${ch.num} · ronda ${R.round}` }) : ch);
      FX.clearLabels();
      WORLD.build(ch, ch.theme);
      this.L = WORLD.L;
      DICE3D.prewarm(ENGINE.renderer, ENGINE.camera);
      this.checkGear();
      this.heroes = this.party.map((id) => this.makeHero(id));
      this.applyCarry();
      UI.buildParty();
      this.enemies = []; this.npcs = []; this.boss = null; this.eruptions = []; this.round = 0; this.mode = null; this.pending = null;
      this.doom = 0; this.wanderers = 0; this.pendingWanderer = false; this.undo = null; this.brokenGroups = {}; this.willFail = []; this.lightsMode = 'on';
      this.summonsLeft = Math.max(1, Math.round(this.D.summons * PARTY_SCALE.of(this.party.length, 'foes')));
      this.heroes.forEach((h, i) => {
        let s = this.L.starts[String(i + 1)];
        if (!s || this.heroes.some((o) => o !== h && o.x === s.x && o.y === s.y)) s = this.spareStart(h);
        h.x = s.x; h.y = s.y; WORLD.addUnit(h, { face: Math.PI });
      });
      if (!R && this.flags.sharpCh === idx) this.heroes.forEach((h) => (h.status.inspirado = 9));
      this.updateLantern();
      if (R) { await this.applyRun(R); this.busy = 0; this.beginHeroPhase(true); return; }
      let nCh = 0;
      this.scaledSpawns(this.L.enemies).forEach((p) => {
        const type = ch.legend[p.key]; if (!type) return;
        nCh++;
        const champ = (this.D.champions && nCh % this.D.champions === 0) || (ch.champChance && Math.random() < ch.champChance);
        const e = this.makeEnemy(type, p.x, p.y, { champion: champ }); this.enemies.push(e); WORLD.addUnit(e, { face: Math.random() * 6 }); e.mesh.visible = false;
        if (champ) WORLD.markChampion(e);
      });
      if (this.L.boss) { const b = this.makeEnemy(ch.bossType, this.L.boss.x, this.L.boss.y); this.enemies.push(b); WORLD.addUnit(b, { face: 0 }); b.mesh.visible = false; }
      // cerraduras y sellos
      this.L.doors.forEach((d) => { d.lock = (ch.locks && ch.locks[U.key(d.x, d.y)]) || null; if (d.lock) WORLD.addLock(d); });
      // trampas señaladas en la velada
      if (this.flags.trapsKnownCh === idx) this.L.traps.forEach((t) => (t.revealed = true));
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
      if (this.flags.trapsKnownCh === idx) UI.log('Las marcas de tiza de la exploración señalan las trampas de este nivel.', 'good');
    } catch (e) { console.error(e); }
    this.busy = 0;
    await this.startRound();
  },
  /* Más o menos criaturas según cuántos héroes bajan (los mapas están pensados para 3) */
  scaledSpawns(list) {
    const f = PARTY_SCALE.of(this.party.length, 'foes') * (this.D.foes || 1);
    if (Math.abs(f - 1) < 0.01) return list;
    const byRoom = new Map();
    list.forEach((p) => { const r = this.T(p.x, p.y).room; if (!byRoom.has(r)) byRoom.set(r, []); byRoom.get(r).push(p); });
    const out = [], used = new Set(list.map((p) => U.key(p.x, p.y)));
    Object.values(this.L.starts).forEach((s) => used.add(U.key(s.x, s.y)));
    byRoom.forEach((g) => {
      if (f < 1) { const keep = Math.max(g.length >= 2 ? 1 : 0, Math.round(g.length * f)); g.slice(0, keep).forEach((p) => out.push(p)); return; }
      g.forEach((p) => out.push(p));
      let extra = Math.round(g.length * (f - 1));
      for (let i = 0; i < g.length && extra > 0; i++) {
        const p = g[i];
        for (const [dx, dy] of DIRS8) {
          const x = p.x + dx, y = p.y + dy, t = this.T(x, y);
          if (!t || !t.floor || t.block || t.hazard || t.trap || t.room !== this.T(p.x, p.y).room || used.has(U.key(x, y)) || 'XC?*'.includes(t.ch)) continue;
          used.add(U.key(x, y)); out.push({ key: p.key, x, y }); extra--; break;
        }
      }
    });
    return out;
  },
  /* Casilla libre en la sala de entrada para el 4.º y 5.º héroe */
  spareStart(h) {
    const s1 = this.L.starts['1'], room = this.T(s1.x, s1.y).room;
    const taken = (x, y) => this.heroes.some((o) => o !== h && o.x === x && o.y === y) || this.L.enemies.some((e) => e.x === x && e.y === y);
    const free = this.L.rooms[room].tiles.filter((t) => !t.block && !t.hazard && !t.trap && !taken(t.x, t.y));
    free.sort((a, b) => U.cheb(a.x, a.y, s1.x, s1.y) - U.cheb(b.x, b.y, s1.x, s1.y));
    return free[0] || s1;
  },
  /* ------------------------------------------------------------ partida en curso: se guarda al empezar cada ronda */
  runState() {
    const L = this.L, J = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
    const pick = (o, keys) => { const r = {}; keys.forEach((k) => { if (o[k] !== undefined) r[k] = J(o[k]); }); return r; };
    return {
      v: 1, round: this.round, doom: this.doom, wanderers: this.wanderers || 0, pendingWanderer: !!this.pendingWanderer, summonsLeft: this.summonsLeft, uid: this.uid,
      brokenGroups: J(this.brokenGroups || {}), willFail: (this.willFail || []).map((h) => h.id), eruptions: (this.eruptions || []).map((t) => ({ x: t.x, y: t.y })),
      objective: UI.$('q-obj').textContent, lights: this.lightsMode || 'on', bossBar: !!(UI.bossU && UI.bossU.alive), boss: this.boss && this.boss.alive ? this.boss.id : null,
      heroes: this.heroes.map((h) => Object.assign(pick(h, ['id', 'x', 'y', 'hp', 'maxHp', 'atk', 'meleeAtk', 'def', 'mv', 'range', 'wounds', 'ko', 'status', 'mvLeft', 'actions', 'ended', 'indomUsed', 'potionUsed']), { cds: h.skills.map((q) => q.cd), rot: h.mesh ? h.mesh.rotation.y : 0 })),
      enemies: this.enemies.filter((e) => e.alive).map((e) => Object.assign(pick(e, ['id', 'kind', 'name', 'x', 'y', 'hp', 'maxHp', 'atk', 'def', 'mv', 'range', 'gold', 'iq', 'status', 'active', 'group', 'champion', 'summoned', 'wanderer', 'phase2', 'doubted', 'boss']), { rot: e.mesh ? e.mesh.rotation.y : 0 })),
      npcs: this.npcs.map((n) => ({ kind: n.kind, x: n.x, y: n.y })),
      doors: L.doors.map((d) => ({ open: !!d.open, lock: d.lock || null, swing: d.swing || 1 })),
      rooms: L.rooms.map((r) => (r.revealed ? 1 : 0) | (r.visited ? 2 : 0) | (r.searched ? 4 : 0)),
      chests: L.chests.map((c) => !!c.looted), notes: L.notes.map((n) => !!n.read),
      traps: L.traps.map((t) => (t.revealed ? 1 : 0) | (t.disarmed ? 2 : 0) | (t.sprung ? 4 : 0)), altars: L.altars.map((a) => !!a.used)
    };
  },
  saveRun() {
    if (this.tutorial || this.state !== 'play' || !this.checkpoint || !this.L) return;
    try { U.store.set(this.saveKey(), Object.assign(this.snapshot('round'), { start: this.checkpoint, run: this.runState() })); } catch (e) { console.error('saveRun', e); }
  },
  async applyRun(R) {
    const L = this.L;
    this.round = R.round; this.doom = R.doom || 0; this.wanderers = R.wanderers || 0; this.pendingWanderer = !!R.pendingWanderer;
    this.summonsLeft = R.summonsLeft != null ? R.summonsLeft : this.D.summons; this.brokenGroups = R.brokenGroups || {}; this.uid = Math.max(this.uid || 0, R.uid || 0);
    // salas, puertas, cofres, escritos, trampas
    (R.rooms || []).forEach((f, i) => { const r = L.rooms[i]; if (!r) return; if (f & 1) WORLD.revealRoom(i, null, true); r.visited = !!(f & 2); r.searched = !!(f & 4); });
    (R.doors || []).forEach((s, i) => {
      const d = L.doors[i]; if (!d) return;
      d.lock = s.lock || null; d.swing = s.swing || 1;
      if (s.open) { d.open = true; d.mesh.userData.pivot.rotation.y = d.swing * -1.45; d.mesh.userData.leak.visible = false; }
      else if (d.lock) WORLD.addLock(d);
    });
    WORLD.updateDoorLeaks();
    (R.chests || []).forEach((looted, i) => { const c = L.chests[i]; if (c && looted) { c.looted = true; if (c.mesh) { c.mesh.userData.lid.rotation.x = -1.6; c.mesh.userData.glow.visible = false; } } });
    (R.notes || []).forEach((read, i) => { if (L.notes[i]) L.notes[i].read = read; });
    (R.traps || []).forEach((f, i) => {
      const t = L.traps[i]; if (!t) return;
      t.revealed = !!(f & 1); t.disarmed = !!(f & 2); t.sprung = !!(f & 4);
      if (t.mesh) { t.mesh.visible = t.revealed || t.sprung; const sp = t.mesh.userData.spikes; if (t.disarmed) sp.visible = false; else if (t.sprung) sp.position.y = 0.25; }
    });
    (R.altars || []).forEach((u, i) => { if (L.altars[i]) L.altars[i].used = u; });
    // héroes
    this.heroes.forEach((h) => {
      const s = (R.heroes || []).find((q) => q.id === h.id); if (!s) return;
      const { cds, rot, ...rest } = s;
      Object.assign(h, rest);
      (cds || []).forEach((cd, i) => { if (h.skills[i]) h.skills[i].cd = cd; });
      h.mesh.position.set(h.x * TILE, 0, h.y * TILE); h.mesh.rotation.y = rot || 0;
      if (h.ko) { const ud = h.mesh.userData; ud.lockAnim = true; ud.model.rotation.x = -1.4; ud.model.position.y = 0.1; ud.base.userData.ring.material = MAT.std('#3a3a3a', 0.8); }
    });
    // criaturas y PNJ
    (R.enemies || []).forEach((s) => {
      const { rot, ...rest } = s;
      const e = this.makeEnemy(s.kind, s.x, s.y, { champion: s.champion });
      Object.assign(e, rest);
      this.enemies.push(e); WORLD.addUnit(e, { face: rot || 0 });
      e.mesh.visible = !!e.active;
      if (e.champion) WORLD.markChampion(e);
    });
    (R.npcs || []).forEach((n) => {
      const npc = { id: 'npc_' + n.kind, side: 'npc', kind: n.kind, name: SPEAKERS[n.kind] ? SPEAKERS[n.kind].name : n.kind, model: n.kind, x: n.x, y: n.y, hp: 1, maxHp: 1, alive: true, status: {} };
      this.npcs.push(npc); WORLD.addUnit(npc, { face: 0 }); const h = this.heroes[0]; this.faceTo(npc, h.x, h.y);
    });
    this.willFail = (R.willFail || []).map((id) => this.heroes.find((h) => h.id === id)).filter(Boolean);
    this.boss = R.boss ? this.enemies.find((e) => e.id === R.boss) || null : null;
    this.eruptions = (R.eruptions || []).slice(); if (this.eruptions.length) WORLD.setDanger(this.eruptions);
    // cámara, sonido e interfaz
    const lead = this.heroesUp()[0] || this.heroes[0];
    ENGINE.keyPos.set(lead.x * TILE, 0, lead.y * TILE); ENGINE.key.target.position.copy(ENGINE.keyPos);
    ENGINE.focusTile(lead.x, lead.y, { dist: U.isTouch() && ENGINE.w < ENGINE.h ? 26 : 21, pitch: 0.92, yaw: 0.35, instant: true });
    audio.startAmbient(this.ch.ambient);
    const bossOn = this.boss && this.boss.alive && this.boss.active;
    audio.setMusic(bossOn ? 'boss' : this.visibleEnemies().length ? 'combat' : 'explore', THEMES[this.ch.theme].music);
    ENGINE.fx.fadeT = 0;
    UI.showHUD(true);
    UI.setLocation(this.ch, this.roomOf(lead));
    if (R.objective) UI.objective(R.objective);
    if (R.bossBar && bossOn) UI.bossBar(this.boss);
    if (R.lights === 'out') { this.lightsMode = 'out'; WORLD.setLightsMult(0); ENGINE.key.intensity = 0.12; ENGINE.hemi.intensity = 0.08; }
    UI.log(`Partida reanudada en la ronda ${this.round}.`, 'good');
    await U.sleep(250);
  },
  /* Tutorial guiado: sala de prácticas con reglas de Relato; no toca la partida guardada */
  async startTutorial() {
    this.newGame('relato', null, TUTORIAL.party);
    TUTOR.prepare();
    await this.startChapter(-1, { def: TUTORIAL, tutorial: true });
    if (this.tutorial && this.state === 'play') TUTOR.begin();
  },
  /* El farol lo lleva quien encabeza el grupo */
  lanternHolder() { return this.heroes[0] || null; },
  updateLantern() {
    const col = this.flags.lantern || (this.ch && this.ch.lantern) || '#ffb45a';
    this.heroes.forEach((h, i) => {
      if (!h.mesh) return;
      const md = h.mesh.userData.model; if (!md) return;
      let lp = md.userData.lanternProp;
      const want = i === 0 && !this.flags.lanternGone;
      if (want && !lp) {
        lp = MODELS.lanternProp(col);
        const ht = md.userData.height || 1.5;
        lp.position.set(-0.34, ht * 0.5, 0.16);
        md.add(lp); md.userData.lanternProp = lp;
      }
      if (lp) { lp.visible = want; lp.userData.core.material = MAT.glow(col, 3); }
    });
  },
  /* ------------------------------------------------------------ rondas */
  async startRound() {
    if (this.state !== 'play') return;
    this.round++; this.stats.rounds++;
    this.phase = 'hero';
    this.busy++;
    try {
      for (const h of this.heroes) {
        if (h.ko) {
          h.ended = true; h.mvLeft = 0; h.actions = 0;
          if (h.status.desangrando) {
            h.status.desangrando--;
            if (h.status.desangrando <= 0) { await this.heroDies(h); return; }
            UI.log(`<b>${h.name} se desangra.</b> Quedan ${h.status.desangrando} ronda${h.status.desangrando > 1 ? 's' : ''} para levantarle.`, 'bad');
          }
          continue;
        }
        h.ended = false; h.mvLeft = h.mv; h.actions = 1; h.potionUsed = false;
        h.skills.forEach((s) => (s.cd = Math.max(0, s.cd - 1)));
        delete h.status.muralla; delete h.status.guard; delete h.status.taunt;
        await this.tickStart(h);
        if (h.ko) continue;
        if (h.status.aturdido) { h.actions = 0; FX.text(this.headPos(h), 'Aturdido', 'warn'); UI.log(`${h.name} está aturdido y pierde su acción.`, 'bad'); }
      }
    } finally { this.busy = Math.max(0, this.busy - 1); }
    await this.beginHeroPhase();
  },
  async beginHeroPhase(resumed) {
    if (this.state !== 'play') return;
    if (!this.heroesUp().length) { this.state = 'defeat'; setTimeout(() => this.defeat(), 900); return; }
    this.phase = 'hero';
    const anyHostile = this.visibleEnemies().length > 0;
    if (!resumed && (!this.boss || !this.boss.alive)) audio.setMusic(anyHostile ? 'combat' : 'explore');
    UI.banner(resumed ? `Ronda ${this.round}` : this.round === 1 ? 'Vuestro turno' : `Ronda ${this.round}`, resumed ? 'Seguís donde lo dejasteis' : anyHostile ? 'La Sombra os observa' : 'Explorad con cautela', 'hero');
    audio.sfx('turnHero');
    const first = this.heroes.find((h) => !h.ended && !h.ko);
    if (!first) { await this.shadowPhase(); return; }
    this.selectHero(first, true);
    UI.refresh();
    this.saveRun();
  },
  selectHero(h, auto) {
    if (!h || h.ko || h.ended || this.state !== 'play') return;
    if (this.active !== h) this.undo = null;
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
    h.ended = true; this.mode = null; this.undo = null;
    const nxt = this.nextHero() || this.heroes.find((x) => !x.ended && !x.ko);
    if (nxt) { this.selectHero(nxt); return; }
    await this.shadowPhase();
  },
  autoEnd(h) {
    if (h && !h.ended && h.mvLeft <= 0 && h.actions <= 0 && !this.busy && this.state === 'play' && !this.undo) {
      setTimeout(() => { if (this.active === h && !h.ended && !this.busy && h.mvLeft <= 0 && h.actions <= 0 && !this.undo) this.endTurn(h); }, 450 / U.speed);
    }
  },
  headPos(u) { return new THREE.Vector3(u.mesh ? u.mesh.position.x : u.x * TILE, ((u.mesh && u.mesh.userData.height) || 1.5) + 0.3, u.mesh ? u.mesh.position.z : u.y * TILE); },

  /* ------------------------------------------------------------ estados alterados */

  immuneTo(u, key) {
    if (u.side === 'enemy') return (u.T.immune || []).includes(key) || (key === 'aterrado' && (u.T.traits || []).includes('sinMiedo'));
    if (key === 'aterrado' && u.traits && u.traits.fearless) return 'Sin miedo';
    return false;
  },
  async addStatus(u, key, dur, o = {}) {
    if (!this.up(u)) return false;
    const imm = this.immuneTo(u, key);
    if (imm) { if (u.side === 'hero' && !o.quiet) FX.text(this.headPos(u), typeof imm === 'string' ? imm : 'Inmune', 'block'); return false; }
    const was = u.status[key] || 0;
    u.status[key] = Math.max(was, dur);
    FX.text(this.headPos(u), STATUS[key].name, STATUS[key].bad ? 'warn' : 'heal');
    if (key === 'aterrado' && u.side === 'hero') { audio.sfx('whisper', { dur: 0.8, vol: 0.6 }); UI.hintOnce('fear'); }
    if (key === 'aturdido' && u.side === 'hero' && this.phase === 'hero' && this.active === u) u.actions = 0;
    if (u.side === 'hero') UI.log(`${u.name}: <b>${STATUS[key].name}</b>.`, STATUS[key].bad ? 'bad' : 'good');
    UI.refresh();
    return true;
  },
  async tickStart(u) {
    for (const k of ['envenenado', 'ardiendo']) {
      if (u.status[k] > 0 && this.up(u)) {
        FX.burst(k === 'ardiendo' ? 'fire' : 'death', u.mesh.position, k === 'envenenado' ? { color: '#a8ff7a', color2: '#2a5a10' } : {});
        if (k === 'ardiendo') audio.sfx('fire', { vol: 0.4 });
        await this.damage(u, 1, { dot: k });
        if (u.side === 'hero') UI.log(`${u.name} sufre 1 de daño (${STATUS[k].name.toLowerCase()}).`, 'bad');
      }
    }
  },
  tickEnd(u) {
    ['aterrado', 'envenenado', 'ardiendo', 'aturdido', 'huyendo', 'inspirado'].forEach((k) => { if (u.status[k] > 0) { u.status[k]--; if (u.status[k] <= 0) delete u.status[k]; } });
  },

  /* ------------------------------------------------------------ dados */
  rollDie() { const r = Math.floor(Math.random() * 6); return r < 3 ? 'skull' : r < 5 ? 'white' : 'black'; },

  async rollCheck(u, n, need, o = {}) {
    const dice = []; for (let i = 0; i < n; i++) dice.push(this.rollDie());
    const skulls = dice.filter((f) => f === 'skull').length;
    if (u && u.side === 'hero') {
      this.stats.checks++;
      await this.checkRoll(u, dice, need, { label: o.label, have: o.have, at: o.at });
      if (skulls + (o.have || 0) >= need) this.stats.checksOk++;
    }
    return { skulls, ok: skulls + (o.have || 0) >= need };
  },
  /* ------------------------------------------------------------ plan / resaltados */
  refreshPlan() {
    this.threatOf = null;
    const h = this.active;
    if (!h || this.busy || this.phase !== 'hero' || h.ko) { WORLD.setHighlights([]); WORLD.setPath(null); WORLD.setTarget(null); return; }
    const hl = [];
    this.R = this.reach(h, h.mvLeft);
    if (!this.mode) {
      this.R.stand.forEach((k) => { const [x, y] = k.split(',').map(Number); if (x !== h.x || y !== h.y) hl.push({ x, y, kind: 'move', k: this.R.prov.get(k) ? 0.38 : 0.55 }); });
      if (h.actions > 0) this.visibleEnemies().forEach((e) => { if (this.attackFrom(h, e)) hl.push({ x: e.x, y: e.y, kind: 'attack', k: this.canHit(h, h.x, h.y, e, this.heroRange(h)) ? 1.1 : 0.55 }); });
      this.L.doors.forEach((d) => { if (!d.open && d.mesh.visible && this.doorApproach(h, d)) hl.push({ x: d.x, y: d.y, kind: d.lock ? 'item' : 'interact', k: 0.8 }); });
    } else {
      this.validTargets().forEach((t) => hl.push({ x: t.x, y: t.y, kind: this.mode.color || 'skill' }));
    }
    WORLD.setHighlights(hl);
  },
  heroRange(h) { return h.range; },
  /* zona de amenaza de un enemigo: dónde puede golpear en su próximo turno */
  showThreat(e) {
    if (this.threatOf === e) return;
    this.threatOf = e;
    if (!e) { this.refreshPlan(); return; }
    const R = this.reach(e, e.mv, { noProv: true });
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
    const range = this.heroRange(h);
    if (this.canHit(h, h.x, h.y, e, range)) return { x: h.x, y: h.y, d: 0, p: 0 };
    let best = null;
    const foes = this.visibleEnemies();
    this.R.stand.forEach((k) => {
      const [x, y] = k.split(',').map(Number); const d = this.R.dist.get(k), p = this.R.prov.get(k) || 0;
      if (!this.canHit(h, x, y, e, range)) return;
      const exposed = range > 1 ? foes.filter((f) => U.cheb(f.x, f.y, x, y) <= 1).length : 0;
      const flank = range <= 1 && this.heroes.some((a) => a !== h && !a.ko && U.cheb(a.x, a.y, e.x, e.y) === 1) ? -0.5 : 0;
      const s = d + exposed * 4 + p * 6 + flank;
      if (!best || s < best.s) best = { x, y, d, s, p };
    });
    return best;
  },
  doorApproach(h, d) {
    if (U.manh(h.x, h.y, d.x, d.y) === 1) return { x: h.x, y: h.y, d: 0, p: 0 };
    let best = null;
    DIRS4.forEach(([dx, dy]) => { const k = U.key(d.x + dx, d.y + dy); if (this.R.stand.has(k)) { const dd = this.R.dist.get(k) + (this.R.prov.get(k) || 0) * 6; if (!best || dd < best.s) best = { x: d.x + dx, y: d.y + dy, d: this.R.dist.get(k), s: dd, p: this.R.prov.get(k) || 0 }; } });
    return best;
  },
  adjApproach(h, x, y) {
    if (U.cheb(h.x, h.y, x, y) === 1) return { x: h.x, y: h.y, d: 0, p: 0 };
    let best = null;
    DIRS8.forEach(([dx, dy]) => { const k = U.key(x + dx, y + dy); if (this.R.stand.has(k)) { const dd = this.R.dist.get(k) + (this.R.prov.get(k) || 0) * 6; if (!best || dd < best.s) best = { x: x + dx, y: y + dy, d: this.R.dist.get(k), s: dd, p: this.R.prov.get(k) || 0 }; } });
    return best;
  },
  validTargets() {
    const h = this.active, m = this.mode; if (!h || !m) return [];
    const out = [];
    const areaTiles = (r, needLos) => {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const x = h.x + dx, y = h.y + dy, t = this.T(x, y);
        if (!t || !t.floor || (!dx && !dy)) continue;
        const room = this.L.rooms[t.room]; if (!room || !room.revealed) continue;
        if (!needLos || this.los(h.x, h.y, x, y)) out.push({ x, y });
      }
    };
    if (m.type === 'attack') this.visibleEnemies().forEach((e) => { if (this.canHit(h, h.x, h.y, e, this.heroRange(h))) out.push(e); });
    else if (m.type === 'skill') {
      const s = m.skill;
      if (s.id === 'carga') this.visibleEnemies().forEach((e) => { if (this.chargeSpot(h, e)) out.push(e); });
      else if (s.target === 'enemy') this.visibleEnemies().forEach((e) => { if (this.canHit(h, h.x, h.y, e, s.range || 1, s.los !== false)) out.push(e); });
      else if (s.target === 'ally') this.heroes.forEach((a) => { if (U.cheb(h.x, h.y, a.x, a.y) <= s.range && (a.ko || a.hp < a.maxHp)) out.push(a); });
      else if (s.target === 'area') areaTiles(s.range, true);
      else if (s.target === 'tile') {
        for (let dy = -s.range; dy <= s.range; dy++) for (let dx = -s.range; dx <= s.range; dx++) {
          const x = h.x + dx, y = h.y + dy; if (!dx && !dy) continue;
          if (this.passable(x, y, h) && !this.unitAt(x, y)) out.push({ x, y });
        }
      }
    } else if (m.type === 'bomb') areaTiles(4, true);
    return out;
  },
  /* Tocar algo lejano (puerta, cofre, escrito): el héroe camina hacia allí todo lo que pueda */
  approachMove(h, x, y, diag, label) {
    if (!h || h.mvLeft <= 0 || !this.R) return null;
    const full = this.reach(h, 60);
    let best = null;
    (diag ? DIRS8 : DIRS4).forEach(([dx, dy]) => { const k = U.key(x + dx, y + dy); if (full.stand.has(k)) { const d = full.dist.get(k); if (!best || d < best.d) best = { x: x + dx, y: y + dy, d }; } });
    if (!best) return null;
    const path = this.pathTo(full, best.x, best.y);
    for (let i = Math.min(h.mvLeft, path.length - 1); i >= 1; i--) {
      const p = path[i];
      if (!this.R.stand.has(U.key(p.x, p.y))) continue;
      const sub = this.pathTo(this.R, p.x, p.y); if (!sub) continue;
      const left = best.d - (sub.length - 1);
      return { kind: 'move', x: p.x, y: p.y, path: sub, prov: 0, text: label, sub: `Avanza ${sub.length - 1} casilla${sub.length > 2 ? 's' : ''} hacia allí${left > 0 ? `; faltarán ${left}` : ''}.` };
    }
    return null;
  },
  /* Carga: casilla libre junto al enemigo a la que llega en 5 pasos (sin contar su movimiento) */
  chargeSpot(h, e) {
    const R = this.reach(h, 5);
    let best = null;
    R.stand.forEach((k) => {
      const [x, y] = k.split(',').map(Number); const d = R.dist.get(k);
      if (!this.meleeOK(x, y, e.x, e.y)) return;
      if (!best || d < best.d) best = { x, y, d };
    });
    return best;
  },
  /* ------------------------------------------------------------ entrada */
  provText() { return ''; },
  describe(x, y) {
    const h = this.active; if (!h || this.phase !== 'hero' || this.busy) return null;
    const t = this.T(x, y); if (!t) return null;
    const u = this.unitAt(x, y);
    if (this.mode) {
      const valid = this.validTargets().find((q) => q.x === x && q.y === y);
      if (!valid) return { kind: 'none', text: 'Objetivo no válido', sub: 'Elige una casilla resaltada o cancela.' };
      if (this.mode.type === 'attack') return this.attackPreview(h, u, null);
      if (this.mode.type === 'bomb') return { kind: 'bomb', x, y, text: 'Lanzar bomba alquímica', sub: '3 dados de fuego a cada criatura del área 3×3, y prende fuego. ¡Cuidado con los aliados!', area: true };
      const s = this.mode.skill, si = this.skillInfo(h, s);
      if (s.target === 'enemy') return this.attackPreview(h, u, s);
      if (s.target === 'ally') return { kind: 'skill', x, y, unit: u, text: `${s.name} → ${u.name}`, sub: u.ko ? `Lo levanta con ${si.heal} PV.` : `Cura ${si.heal} PV.` };
      if (s.target === 'area') { const n = this.visibleEnemies().filter((e) => U.cheb(e.x, e.y, x, y) <= 1).length; return { kind: 'skill', x, y, text: s.name, sub: `${si.dice} dados a cada enemigo de la zona · ${n ? `${n} enemigo${n > 1 ? 's' : ''} dentro` : 'ahora mismo no hay nadie dentro'}.`, area: true }; }
      if (s.target === 'tile') return { kind: 'skill', x, y, text: s.name, sub: 'Saltarás aquí. Conservas el movimiento y la acción.' };
    }
    if (u && u.side === 'hero') {
      if (u === h) return { kind: 'self', unit: u, text: `${h.full}`, sub: `${h.mvLeft} de movimiento · ${h.actions > 0 ? 'acción disponible' : 'sin acción'}` };
      if (u.ko && h.actions > 0) { const ap = this.adjApproach(h, x, y); if (ap) return { kind: 'revive', x, y, unit: u, via: ap, text: `Levantar a ${u.name}`, sub: `Gasta tu acción. Vuelve con 2 PV${this.D.wounds ? ' y queda Herido (−1 PV máximo)' : ''}.${this.provText(ap.p)}` }; }
      if (!u.ended && !u.ko) return { kind: 'switch', unit: u, text: `Cambiar a ${u.name}`, sub: 'Selecciona otro héroe que aún no ha terminado.' };
      return { kind: 'info', unit: u, text: u.name, sub: u.ko ? (u.status.desangrando ? `Caído · se desangra en ${u.status.desangrando}` : 'Caído') : 'Ya ha actuado este turno' };
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
      const L = t.doorRef.lock;
      if (L) {
        const name = L === 'sello' ? 'Sello rúnico' : 'Cerradura de hierro';
        if (!ap) return this.approachMove(h, x, y, false, `Ir hacia la ${L === 'sello' ? 'puerta sellada' : 'cerradura'}`) || { kind: 'none', text: name, sub: 'Acércate para intentar abrirla.' };
        if (h.actions <= 0) return { kind: 'none', text: name, sub: 'Abrirla gasta la acción, y ya no te queda.' };
        return { kind: 'lock', x, y, door: t.doorRef, via: ap, text: this.lockAuto(h, t.doorRef) ? `${name}: abrir` : `${name}: forzar`, sub: this.lockText(h, t.doorRef) };
      }
      if (ap) return { kind: 'door', x, y, door: t.doorRef, via: ap, text: 'Abrir puerta', sub: (ap.d ? `Avanzar ${ap.d} y abrir` : 'Sin coste') + this.provText(ap.p) };
      return this.approachMove(h, x, y, false, 'Ir hacia la puerta') || { kind: 'none', text: 'Puerta cerrada', sub: 'Demasiado lejos para alcanzarla este turno.' };
    }
    if (t.ch === 'C') {
      const c = this.L.chests.find((q) => q.x === x && q.y === y);
      if (c && !c.looted) { const ap = h.actions > 0 && this.adjApproach(h, x, y); return ap ? { kind: 'chest', x, y, chest: c, via: ap, text: 'Abrir cofre', sub: 'Gasta tu acción.' + this.provText(ap.p) } : (U.cheb(h.x, h.y, x, y) > 1 && this.approachMove(h, x, y, true, 'Ir hacia el cofre')) || { kind: 'none', text: 'Cofre', sub: h.actions > 0 ? 'Fuera de alcance.' : 'Abrirlo necesita una acción.' }; }
      return { kind: 'none', text: 'Cofre vacío', sub: '' };
    }
    if (t.ch === '?') {
      const n = this.L.notes.find((q) => q.x === x && q.y === y);
      const ap = this.adjApproach(h, x, y);
      return ap ? { kind: 'note', x, y, note: n, via: ap, text: n.read ? 'Releer' : 'Leer', sub: 'Sin coste.' + this.provText(ap.p) } : this.approachMove(h, x, y, true, 'Ir hacia el escrito') || { kind: 'none', text: 'Un escrito', sub: 'Acércate para leerlo.' };
    }
    if (t.ch === 'X' && this.descent && this.ch.exit && this.ch.exit.x === x && this.ch.exit.y === y) return this.stairsInfo(h, x, y);
    if (t.ch === '*') return { kind: 'none', text: 'El sello', sub: this.boss && this.boss.alive ? 'Su guardián lo protege.' : 'Late con una luz antigua.' };
    if (t.trap && t.trap.revealed && !t.trap.disarmed && !t.trap.sprung) {
      const ap = h.actions > 0 && this.adjApproach(h, x, y);
      const sure = h.traits && h.traits.locksmith;
      return ap ? { kind: 'disarm', x, y, trap: t.trap, via: ap, text: 'Desarmar trampa', sub: sure ? 'El Enano la desarma sin fallar · gasta tu acción.' : `Tira 2 dados: con una calavera la desarma (${RULES.pct(RULES.pAtLeast(2, 1))}); sin ninguna, salta · gasta tu acción.` } : { kind: 'none', text: 'Trampa', sub: 'Acércate para desarmarla.' };
    }
    const k = U.key(x, y);
    if (this.R && this.R.stand.has(k) && (x !== h.x || y !== h.y)) {
      const path = this.pathTo(this.R, x, y), p = this.R.prov.get(k) || 0;
      return { kind: 'move', x, y, path, prov: p, text: 'Mover', sub: `${path.length - 1} de ${h.mvLeft} casillas${this.provText(p)}` };
    }
    return null;
  },
  /* Dados de ataque con todos sus modificadores (vista previa y tirada usan lo mismo) */
  atkDice(att, tgt, o = {}) {
    const mods = [];
    const melee = !o.ranged && U.cheb(att.x, att.y, tgt.x, tgt.y) === 1;
    let n = o.atk != null ? o.atk : (melee && att.meleeAtk != null && att.ranged ? att.meleeAtk : att.atk);
    if (att.status && att.status.aterrado) mods.push(['Aterrado', -1]);
    if (att.status && att.status.inspirado) mods.push(['Inspirado', 1]);
    if (melee && !o.noFlank) {
      const friends = att.side === 'hero' ? this.heroesUp() : this.visibleEnemies();
      if (friends.some((a) => a !== att && !(a.status && a.status.huyendo) && U.cheb(a.x, a.y, tgt.x, tgt.y) === 1)) mods.push(['Flanqueo', 1]);
    }
    if (att.T && att.T.fury && att.hp < att.maxHp) mods.push(['Furia', 1]);
    if (att.traits && att.traits.rage && att.hp <= att.maxHp / 2) mods.push(['Sangre caliente', 1]);
    const dt = o.dtype || att.dtype || 'phys';
    if (tgt.T) {
      if ((tgt.T.weak || []).includes(dt)) mods.push([`Vulnerable (${DTYPES[dt]})`, 1]);
      if ((tgt.T.resist || []).includes(dt)) mods.push([`Resiste (${DTYPES[dt]})`, -1]);
      if (tgt.T.resistMundane && !att.magic && (dt === 'phys' || dt === 'pierce')) mods.push(['Incorpóreo', -1]);
    }
    mods.forEach(([, v]) => (n += v));
    return { n: Math.max(1, n), mods, dtype: dt };
  },
  /* Escudos que ignora un golpe (Enano cuerpo a cuerpo, flechas certeras) */
  ignoreFor(att, ranged, o = {}) {
    let n = o.ignore || 0;
    if (att.traits && att.traits.shieldbreaker && !ranged) n += att.traits.shieldbreaker;
    if (att.tal && att.tal.has('certera') && ranged) n += 1;
    return n;
  },
  defDice(u) {
    let d = u.def;
    if (u.status.muralla) d += 2;
    if (u.status.guard) d += 1;
    return Math.max(0, d);
  },
  attackPreview(h, e, skill, from) {
    if (!e) return null;
    let o = {}, name = h.basic.name;
    const fx = from ? from.x : h.x, fy = from ? from.y : h.y;
    let ranged = h.ranged && U.cheb(fx, fy, e.x, e.y) > 1;
    if (skill) {
      const si = this.skillInfo(h, skill); name = skill.name;
      if (skill.id === 'bola') { o = { atk: si.dice, ranged: true, dtype: 'fire' }; ranged = true; }
      if (skill.id === 'sismico') o = { atk: si.dice };
      if (skill.id === 'carga') o = { atk: si.dice };
    } else o = { ranged };
    o.ignore = this.ignoreFor(h, ranged, o);
    const ghost = Object.assign({}, h, { x: fx, y: fy });
    if (skill && skill.id === 'carga') { const sp = this.chargeSpot(h, e); if (sp) { ghost.x = sp.x; ghost.y = sp.y; } }
    const ad = this.atkDice(ghost, e, o);
    const def = this.defDice(e);
    const odds = U.combatOdds(ad.n, def, 1 / 6, o.ignore || 0);
    const modTxt = ad.mods.length ? ' (' + ad.mods.map(([t, v]) => `${v > 0 ? '+' : ''}${v} ${t.toLowerCase()}`).join(', ') + ')' : '';
    return { kind: skill ? 'skill' : 'attack', x: e.x, y: e.y, unit: e, via: from, skill, text: `${name} → ${e.name}`, sub: `${ad.n} dados${modTxt} contra ${def} · ${Math.round(odds.pHit * 100)}% de herir · daño medio ${odds.exp.toFixed(1)}`, atk: ad.n, def, odds, mods: ad.mods };
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
    const snap = d.kind === 'move' ? { h, x: h.x, y: h.y, mv: h.mvLeft, rot: h.mesh.rotation.y } : null;
    this.undo = null; this.eventful = false;
    await this.lock(async () => {
      WORLD.setPath(null); WORLD.setTarget(null);
      if (d.via && (d.via.x !== h.x || d.via.y !== h.y)) {
        const ok = await this.moveHero(h, this.pathTo(this.R, d.via.x, d.via.y));
        if (!ok) return;
      }
      switch (d.kind) {
        case 'move': await this.moveHero(h, d.path); break;
        case 'door': await this.openDoor(d.door, h); break;
        case 'lock': await this.tryLock(h, d.door); break;
        case 'attack': if (this.mode && this.mode.type === 'attack') this.mode = null; await this.heroAttack(h, d.unit); break;
        case 'skill': await this.useSkill(h, this.mode.skill, d); this.mode = null; break;
        case 'bomb': await this.throwBomb(h, d.x, d.y); this.mode = null; break;
        case 'chest': await this.openChest(h, d.chest); break;
        case 'note': await this.readNote(h, d.note); break;
        case 'revive': await this.revive(h, d.unit); break;
        case 'disarm': await this.disarm(h, d.trap); break;
        case 'stairs': await this.descend(h); break;
      }
    });
    if (snap && !this.eventful && !h.ko && this.state === 'play' && (h.x !== snap.x || h.y !== snap.y)) this.undo = snap;
    this.afterAction(h);
  },
  undoMove() {
    const u = this.undo; if (!u || this.busy || this.active !== u.h) return;
    const h = u.h; this.undo = null;
    h.x = u.x; h.y = u.y; h.mvLeft = u.mv;
    h.mesh.position.set(u.x * TILE, 0, u.y * TILE); h.mesh.rotation.y = u.rot;
    ENGINE.keyPos.set(u.x * TILE, 0, u.y * TILE);
    audio.sfx('uiBack');
    this.refreshPlan(); UI.refresh();
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
    this.mode = m; this.pending = null; this.undo = null; UI.preview(null);
    if (m && m.instant) { const mm = m; this.mode = null; this.lock(async () => { await this.useSkill(this.active, mm.skill, {}); }).then(() => this.afterAction(this.active)); return; }
    this.refreshPlan(); UI.refresh();
    if (m && !this.validTargets().length) { UI.toast(m.empty || 'No hay objetivos válidos al alcance.'); this.mode = null; this.refreshPlan(); UI.refresh(); }
  },
  skillBlock(h, s) {
    if (s.cd > 0) return `${s.name} estará lista en ${s.cd} ronda${s.cd > 1 ? 's' : ''}.`;
    if (!s.free && h.actions <= 0) return 'Ya has usado tu acción este turno.';
    if (s.id === 'torbellino' && !this.visibleEnemies().some((e) => this.meleeOK(h.x, h.y, e.x, e.y))) return 'Torbellino necesita enemigos a tu lado.';
    return null;
  },
  action(id) {
    const h = this.active; if (!h || this.busy || this.phase !== 'hero') return;
    audio.sfx('ui');
    const run = (fn) => { this.undo = null; this.lock(() => fn()).then(() => this.afterAction(h)); };
    if (id === 'attack') { if (h.actions <= 0) return UI.toast('Ya has usado tu acción este turno.'); this.setMode({ key: 'attack', type: 'attack', color: 'attack', empty: 'Ningún enemigo a tu alcance desde aquí. Toca a un enemigo para acercarte y atacar.' }); }
    else if (id === 's0' || id === 's1') {
      const s = h.skills[+id[1]], why = this.skillBlock(h, s);
      if (why) return UI.toast(why);
      const empty = { carga: 'Ningún enemigo al alcance de la carga.', lluvia: 'No hay ningún sitio a la vista donde disparar.', luz: 'Nadie está herido ni caído a tu alcance.', salto: 'No hay sitio libre para saltar.' }[s.id];
      this.setMode({ key: id, type: 'skill', skill: s, instant: s.target === 'self', color: s.target === 'ally' ? 'heal' : 'skill', empty });
    }
    else if (id === 'search') run(() => this.search(h));
    else if (id === 'potion') run(() => this.drink(h));
    else if (id === 'elixir') run(() => this.elixir(h));
    else if (id === 'bomb') { if (h.actions <= 0) return UI.toast('Lanzar una bomba gasta tu acción.'); if (this.items.bomb <= 0) return UI.toast('No os quedan bombas.'); this.setMode({ key: 'bomb', type: 'bomb', color: 'item' }); }
    else if (id === 'undo') this.undoMove();
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
  async reactions(mover) { return this.up(mover); },
  async moveHero(h, path) {
    if (!path || path.length < 2) return true;
    if (SETTINGS.follow) ENGINE.cam.lambda = 3.5;
    for (let i = 1; i < path.length; i++) {
      const p = path[i], prev = path[i - 1];
      if (h.mvLeft <= 0) break;
      if (!(await this.reactions(h, prev.x, prev.y, p.x, p.y))) { ENGINE.cam.lambda = 6; return false; }
      await this.hop(h, p.x, p.y);
      h.mvLeft--;
      if (SETTINGS.follow) ENGINE.focusTile(p.x, p.y);
      const t = this.T(p.x, p.y);
      if (t.trap && !t.trap.revealed && !t.trap.disarmed && !t.trap.sprung) { await this.springTrap(t.trap, h); h.mvLeft = 0; ENGINE.cam.lambda = 6; return false; }
      if (h.traits.trapSense && !h.ko) this.detectTraps(h, h.traits.trapSense);
      const room = this.L.rooms[t.room];
      if (room && !room.visited) {
        room.visited = true; this.eventful = true;
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
      if (BARKS[h.id] && BARKS[h.id].trap) FX.bubble(h, U.pick(BARKS[h.id].trap));
    });
  },
  revealTrap(tr) {
    tr.revealed = true; tr.mesh.visible = true; this.eventful = true;
    audio.sfx('trap', { vol: 0.4 });
    FX.text(new THREE.Vector3(tr.x * TILE, 1, tr.y * TILE), '¡Trampa!', 'warn');
    if (this.active) this.refreshPlan();
  },
  async springTrap(tr, h) {
    tr.revealed = true; tr.sprung = true; tr.mesh.visible = true; this.eventful = true;
    const sp = tr.mesh.userData.spikes;
    audio.sfx('trap'); ENGINE.shake(0.35);
    await U.tween(120, (k) => { sp.position.y = -0.15 + k * 0.4; });
    const theme = WORLD.theme.id;
    FX.burst(theme === 'forge' ? 'fire' : theme === 'void' ? 'magic' : 'trap', { x: h.x * TILE, y: 0.4, z: h.y * TILE });
    if (theme === 'forge') audio.sfx('fire');
    await this.damage(h, 2, { source: 'trap' });
    UI.log(`${h.name} activa una trampa y pierde 2 PV.`, 'bad');
    if (!h.ko) {
      FX.bubble(h, h.traits.trapSense ? '¿Cómo no la he visto?' : '¡Una trampa!');
      if (theme === 'forge') await this.addStatus(h, 'ardiendo', 1);
      else if (theme === 'crypt') await this.addStatus(h, 'envenenado', 2);
      else await this.addStatus(h, 'aterrado', 1);
    }
  },

  /* ------------------------------------------------------------ puertas, cerraduras y salas */
  async openDoor(door, h) {
    if (door.open) return;
    door.open = true; this.eventful = true;
    audio.sfx('door');
    const pv = door.mesh.userData.pivot;
    const sign = (h && (door.vertical ? h.y < door.y : h.x < door.x)) ? -1 : 1; door.swing = sign;
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
  /* Cerraduras: el Enano abre las de hierro y el Hechicero los sellos sin tirar.
     Los demás tiran 3 dados; las calaveras se suman hasta llegar a las necesarias */
  lockNeed(door) { return door.lock === 'sello' ? 3 : 2; },
  lockAuto(h, door) { return door.lock === 'sello' ? !!(h.traits && h.traits.sealbreaker) : !!(h.traits && h.traits.locksmith); },
  lockText(h, door) {
    if (this.lockAuto(h, door)) return door.lock === 'sello' ? `${h.name} conoce estas runas: lo abre sin tirar · gasta la acción.` : `${h.name} la abre sin tirar · gasta la acción.`;
    const need = this.lockNeed(door), have = door.progress || 0;
    return `Tira 3 dados; hacen falta ${need} calaveras en total${have ? ` (lleváis ${have})` : ''} · gasta la acción.${door.lock === 'sello' ? ' Si no sale ninguna, el sello muerde: −1 PV.' : ' Hace ruido: +1 Presagio.'}`;
  },
  async tryLock(h, door) {
    if (h.actions <= 0 || !door.lock) return;
    UI.hintOnce('lock');
    h.actions--; this.eventful = true;
    this.faceTo(h, door.x, door.y);
    let ok;
    if (this.lockAuto(h, door)) { ok = true; FX.text(this.headPos(h), door.lock === 'sello' ? 'Runas descifradas' : 'Abierta', 'heal'); await U.sleep(300); }
    else {
      const need = this.lockNeed(door), have = door.progress || 0;
      const r = await this.rollCheck(h, 3, need, { label: door.lock === 'sello' ? 'Romper el sello' : 'Forzar la cerradura', have, at: door });
      door.progress = have + r.skulls; ok = door.progress >= need;
      if (door.lock === 'cerradura') { audio.sfx('doorSlam', { vol: 0.5 }); this.addDoom(1); }
      if (!ok) {
        UI.log(`${h.name} no consigue abrirla del todo (${door.progress} de ${need}).`, 'neutral');
        FX.text(this.headPos(h), `${door.progress} de ${need}`, 'block'); audio.sfx('deny');
        if (door.lock === 'sello' && r.skulls === 0) { FX.burst('magic', h.mesh.position, { color: '#c08bff' }); await this.damage(h, 1, { source: 'seal' }); }
      }
    }
    if (ok) {
      UI.log(`${h.name} abre la puerta.`, 'good');
      audio.sfx(door.lock === 'sello' ? 'magic' : 'block');
      WORLD.removeLock(door); door.lock = null; door.progress = 0;
      await this.openDoor(door, h);
    }
  },
  async revealRoom(room, origin, hero) {
    this.eventful = true;
    const hasBoss = this.enemies.some((e) => e.boss && e.alive && this.T(e.x, e.y).room === room.id);
    audio.sfx('reveal', { vol: hasBoss ? 1 : 0.7 });
    const cx = Math.round(room.cx), cy = Math.round(room.cy);
    ENGINE.focusTile((cx + origin.x) / 2, (cy + origin.y) / 2, {});
    FX.burst('reveal', { x: origin.x * TILE, z: origin.y * TILE }, { color: WORLD.theme.torch });
    const p = WORLD.revealRoom(room.id, origin, false);
    const foes = this.enemies.filter((e) => e.alive && !e.active && this.T(e.x, e.y).room === room.id);
    foes.forEach((e) => (e.group = room.id));
    if (foes.length) this.brokenGroups[room.id] = { size: foes.filter((e) => !e.boss).length, broken: false };
    await U.sleep(450);
    foes.forEach((e, i) => setTimeout(() => this.riseUnit(e), (250 + i * 140) / U.speed));
    await p;
    await U.sleep(foes.length ? 300 : 0);
    UI.setLocation(this.ch, room);
    const meta = this.ch.rooms[room.marker];
    if (room.boss && this.ch.boss) { this.boss = this.enemies.find((e) => e.boss && e.alive); await this.run(this.ch.boss.reveal, { hero, room }); this.applyBossOpening(); }
    else if (meta && meta.reveal) await this.run(meta.reveal, { hero, room });
    if (foes.length && !(this.boss && this.boss.alive)) audio.setMusic('combat');
    if (hero && SETTINGS.follow) ENGINE.focusTile(hero.x, hero.y);
    UI.refresh();
  },
  applyBossOpening() {
    const b = this.boss; if (!b) return;
    if (b.kind === 'aethelgard' && this.flags.aethDoubt && !b.doubted) {
      b.doubted = true; b.hp = Math.max(1, b.hp - 4); b.status.aturdido = 1;
      FX.text(this.headPos(b), 'Duda', 'block'); UI.updateBoss();
    }
  },
  riseUnit(e, fx = 'dust') {
    e.active = true; const m = e.mesh; if (!m) return;
    m.visible = true; const fig = m.userData.model;
    fig.position.y = -1.6;
    U.tween(650, (k) => (fig.position.y = -1.6 * (1 - k)), U.easeOutBack);
    FX.burst(fx, m.position, { color: WORLD.theme.eye });
    if (e.T && e.T.sfx === 'bone') audio.sfx('bone', { vol: 0.6 });
  },

  /* ------------------------------------------------------------ Presagio */
  doomMax() { return this.D.doom + PARTY_SCALE.of(this.party.length, 'doom'); },
  addDoom(n) {
    if (this.state !== 'play') return;
    if (this.boss && this.boss.alive && this.boss.active) return;
    this.doom += n;
    UI.hintOnce('doom');
    if (this.tutorial) this.doom = Math.min(this.doom, this.doomMax() - 1);
    if (this.doom >= this.doomMax()) { this.doom = 0; this.pendingWanderer = true; }
    UI.refresh();
  },
  async spawnWanderer() {
    this.pendingWanderer = false;
    const pools = { crypt: ['skeleton', 'ghoul', 'skeleton', 'acolyte', 'ghoul'], forge: ['goblin', 'orc', 'goblin', 'berserker', 'orc'], void: ['wraith', 'reflection', 'voidAcolyte', 'wraith', 'golem'] };
    const pool = pools[WORLD.theme.id] || pools.crypt;
    const type = pool[Math.min(pool.length - 1, this.wanderers || 0)];
    this.wanderers = (this.wanderers || 0) + 1;
    // aparece lejos del grupo, en una zona ya explorada
    const heroes = this.heroesUp();
    let best = null;
    this.L.rooms.forEach((r) => { if (!r.revealed) return; r.tiles.forEach((t) => {
      if (!this.passable(t.x, t.y, { side: 'enemy' }) || this.unitAt(t.x, t.y)) return;
      const d = Math.min(...heroes.map((h) => U.manh(h.x, h.y, t.x, t.y)));
      if (d < 6) return;
      const s = -Math.abs(d - 9) + Math.random() * 2;
      if (!best || s > best.s) best = { x: t.x, y: t.y, s };
    }); });
    if (!best) return;
    audio.sfx('whisper', { dur: 2 }); audio.sfx('summon', { vol: 0.6 });
    UI.banner('La Hondura se agita', 'Algo errante sube a buscaros', 'shadow');
    UI.log(`<b>El Presagio se cumple.</b> ${ENEMY_TYPES[type].name} sube de la Hondura.`, 'bad');
    await ENGINE.focusWait(best.x, best.y, { max: 700 });
    const e = await this.spawn(type, best.x, best.y);
    e.group = -1; e.wanderer = true;
  },

  /* ------------------------------------------------------------ combate */
  async attack(att, tgt, o = {}) {
    if (!tgt || !this.up(tgt)) return 0;
    const ranged = o.ranged != null ? o.ranged : (att.ranged && U.cheb(att.x, att.y, tgt.x, tgt.y) > 1);
    const ad = this.atkDice(att, tgt, Object.assign({}, o, { ranged })), atkN = ad.n;
    if (att.status && att.status.inspirado) delete att.status.inspirado;
    const defN = this.defDice(tgt), ignore = this.ignoreFor(att, ranged, o);
    this.faceTo(att, tgt.x, tgt.y);
    const m = att.mesh, from = m.position.clone(), dir = new THREE.Vector3(tgt.x * TILE - from.x, 0, tgt.y * TILE - from.z).normalize();
    const pan = (ENGINE.project(tgt.mesh.position).x / ENGINE.w - 0.5) * 1.2;
    const A = []; for (let i = 0; i < atkN; i++) A.push(this.rollDie());
    const D = []; for (let i = 0; i < defN; i++) D.push(this.rollDie());
    const shieldFace = tgt.side === 'hero' ? 'white' : 'black';
    const sk = A.filter((f) => f === 'skull').length, sh = Math.max(0, D.filter((f) => f === shieldFace).length - ignore);
    const R = { skulls: sk, shields: sh, dmg: Math.max(0, sk - sh) };
    const quick = o.quick || (att.side === 'enemy' && SETTINGS.quickEnemyDice);
    // el Dado del Destino acompaña al primer ataque de cada acción de un héroe
    const destiny = o.destiny && att.side === 'hero' ? this.rollDestiny() : null;
    const label = o.label && o.label !== att.name ? `<b>${U.esc(o.label)}</b> · ` : '';
    await this.combatRoll({ att, tgt, A, D, shieldFace, ignore, quick, destiny, mods: ad.mods, caption: `${label}${U.esc(att.name)} → ${U.esc(tgt.name)}` });
    if (ranged || o.proj) {
      const proj = o.proj || att.proj || 'arrow';
      audio.sfx(proj === 'arrow' ? 'arrow' : proj === 'fire' ? 'fire' : proj === 'dagger' ? 'swing' : 'magic', { pan, vol: 0.8 });
      U.tween(160, (k) => { m.userData.model.rotation.x = -Math.sin(k * Math.PI) * 0.15; });
      await FX.projectile(o.projFrom || new THREE.Vector3(from.x, 1.2, from.z), new THREE.Vector3(tgt.x * TILE, 1.0, tgt.y * TILE), proj);
    } else {
      audio.sfx('swing', { pan });
      const md = m.userData.model;
      await U.tween(170, (k) => { m.position.x = from.x + dir.x * 0.55 * U.easeIn(k); m.position.z = from.z + dir.z * 0.55 * U.easeIn(k); md.rotation.x = 0.2 * k; });
      FX.slash(m.position, dir, att.side === 'hero' ? (att.color || '#fff2d0') : att.boss ? '#ff6a4a' : '#ffb0a0');
    }
    const victim = tgt;
    const tp = new THREE.Vector3(victim.mesh.position.x, 1.1, victim.mesh.position.z);
    if (R.dmg > 0) {
      const fxk = victim.T && victim.T.sfx === 'bone' ? 'bone' : victim.T && victim.T.sfx === 'glass' ? 'glass' : victim.side === 'hero' ? 'blood' : 'hit';
      FX.burst(fxk, tp); FX.burst('hit', tp);
      audio.sfx(victim.T && victim.T.sfx === 'glass' ? 'glass' : 'hit', { pan });
      if (victim.T && victim.T.sfx === 'bone') audio.sfx('bone', { pan });
      ENGINE.shake(0.12 + R.dmg * 0.08);
      this.hitReact(victim, dir);
      if (o.light !== false) ENGINE.flashLight(tp, '#ffb070', 2.2, 0.25);
    } else {
      FX.burst('block', tp); audio.sfx('block', { pan });
      FX.text(tp, 'Bloqueado', 'block');
    }
    if (!ranged && !o.proj) { const md = m.userData.model; U.tween(220, (k) => { m.position.x = U.lerp(m.position.x, from.x, k); m.position.z = U.lerp(m.position.z, from.z, k); md.rotation.x = 0.2 * (1 - k); }); }
    UI.log(`${att.name} → ${victim.name}${o.label && o.label !== att.name ? ` (${o.label.toLowerCase()})` : ''}: ${R.skulls} calavera${R.skulls === 1 ? '' : 's'} contra ${R.shields} escudo${R.shields === 1 ? '' : 's'}${R.dmg ? `, <b>${R.dmg} de daño</b>` : ', sin daño'}.`, att.side === 'hero' ? 'good' : 'bad');
    if (R.dmg > 0) {
      await this.damage(victim, R.dmg, { by: att });
      if (this.up(victim)) {
        const oh = o.onHit || (att.T && att.T.onHit);
        if (oh && (!oh.minDmg || R.dmg >= oh.minDmg)) await this.addStatus(victim, oh.st, oh.dur);
      }
    }
    if (destiny) await this.destinyEffect(att, destiny, victim);
    await U.sleep(140);
    return R.dmg;
  },
  hitReact(u, dir) {
    const m = u.mesh; if (!m) return;
    const mi = m.userData.mini; if (mi) { mi.uFlashCol.value.set('#fff1dc'); mi.uFlash.value = 1; }
    const md = m.userData.model;
    U.tween(260, (k) => { const s = Math.sin(k * Math.PI); md.position.x = dir.x * 0.18 * s; md.position.z = dir.z * 0.18 * s; md.rotation.z = -0.25 * s * (dir.x || 1); });
    const ring = m.userData.base.userData.ring;
    if (ring && ring.material) { const old = ring.material; ring.material = MAT.glow('#ff3020', 3); setTimeout(() => (ring.material = old), 220); }
  },
  async damage(u, n, o = {}) {
    if (n <= 0 || !this.up(u)) return;
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
    const mi = u.mesh && u.mesh.userData.mini; if (mi) { mi.uFlashCol.value.set('#8dffc0'); mi.uFlash.value = 0.8; }
    FX.text(new THREE.Vector3(u.mesh.position.x, 1.8, u.mesh.position.z), `+${got}`, 'heal');
    UI.refresh(); audio.heartbeat(this.heroes.some((h) => !h.ko && h.hp <= 2));
  },
  /* Herida al volver de una caída (Héroe y Pesadilla) */
  woundOnRise(a) {
    delete a.status.desangrando;
    if (!this.D.wounds) return;
    a.wounds++; a.maxHp = Math.max(3, a.maxHp - 1); a.hp = Math.min(a.hp, a.maxHp);
    FX.text(this.headPos(a), 'Herido −1 PV máx.', 'warn');
  },
  standUp(u) {
    const ud = u.mesh.userData; const fig = ud.model;
    U.tween(500, (k) => { fig.rotation.x = -1.4 * (1 - k); fig.position.y = 0; }).then(() => { ud.lockAnim = false; });
    ud.base.userData.ring.material = MAT.glow(u.color, 1.3);
  },
  async kill(u, by) {
    if (u.side === 'hero') {
      if (u.ko) return;
      const solo = this.party.length === 1;
      if (((u.tal && u.tal.has('indomable')) || solo) && !u.indomUsed) {
        u.indomUsed = true; u.hp = solo ? Math.ceil(u.maxHp / 2) : Math.min(3, u.maxHp);
        FX.text(this.headPos(u), solo ? 'Último en pie' : 'Indomable', 'heal'); audio.sfx('levelUp', { vol: 0.6 }); FX.burst('heal', u.mesh.position);
        FX.bubble(u, '¡Todavía no!', 1.6); UI.log(`${u.name} se niega a caer y sigue en pie con ${u.hp} PV.${solo ? ' (En solitario, una vez por capítulo.)' : ''}`, 'good'); UI.refresh();
        return;
      }
      u.ko = true; u.ended = true; u.mvLeft = 0; u.actions = 0; this.stats.falls++;
      ['aterrado', 'envenenado', 'ardiendo', 'aturdido', 'inspirado', 'guard', 'muralla', 'taunt'].forEach((k) => delete u.status[k]);
      if (this.D.fall === 'bleed') u.status.desangrando = this.D.bleed;
      audio.sfx('heroDown'); ENGINE.fx.desat = 0.6; ENGINE.fx.desatT = 0;
      const ud = u.mesh.userData; ud.lockAnim = true;
      U.tween(600, (k) => { ud.model.rotation.x = -1.4 * U.easeOut(k); ud.model.position.y = 0.1 * k; });
      ud.base.userData.ring.material = MAT.std('#3a3a3a', 0.8);
      const how = this.D.fall === 'auto' ? 'Se levantará solo al final de la ronda si queda alguien en pie.' : this.D.fall === 'bleed' ? `Se desangra: tenéis ${this.D.bleed} rondas para levantarle.` : 'Un aliado adyacente puede levantarle.';
      UI.log(`<b>${u.name} ha caído.</b> ${how}`, 'bad');
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
    if (u.boss) { await U.sleep(500); await this.bossDefeated(u); UI.refresh(); return; }
    // moral: cae un líder o el grupo queda a la mitad
    if (this.state === 'play') {
      if ((T.traits || []).includes('lider') && !u.summoned) {
        const near = this.visibleEnemies().filter((e) => U.cheb(e.x, e.y, u.x, u.y) <= 6);
        if (near.length) { UI.log(`Ha caído ${u.name}. Sus aliados vacilan.`, 'good'); await this.moraleCheck(near); }
      } else if (u.group != null && this.brokenGroups[u.group] && !this.brokenGroups[u.group].broken) {
        const g = this.brokenGroups[u.group], left = this.visibleEnemies().filter((e) => e.group === u.group && !e.boss);
        if (g.size >= 2 && left.length <= g.size / 2 && left.length) { g.broken = true; await this.moraleCheck(left); }
      }
      if (!this.visibleEnemies().length) audio.setMusic('explore');
    }
    UI.refresh();
  },

  /* Moral: al caer un líder (o la mitad del grupo), cada uno puede huir; los cobardes siempre */
  async moraleCheck(list) {
    for (const e of list) {
      if (!e.alive || e.boss || e.status.huyendo || this.immuneTo(e, 'aterrado')) continue;
      const coward = (e.T.traits || []).includes('cobarde');
      if (coward || Math.random() < 0.5) { e.status.huyendo = 2; FX.text(this.headPos(e), '¡Huye!', 'heal'); UI.log(`${e.name} pierde los nervios y huye.`, 'good'); if (e.T.barks && Math.random() < 0.5) FX.bubble(e, '¡No, no, no!', 1.6); }
      else FX.text(this.headPos(e), 'Aguanta', 'block');
      await U.sleep(120);
    }
  },
  addGold(n, pos) {
    if (this.descent) n = Math.max(1, Math.round(n * 0.6)); // en el Descenso solo se compra al acampar: el oro escasea más
    this.gold += n; this.stats.gold += n;
    if (pos) { FX.text(pos, `+${n} oro`, 'gold'); FX.burst('gold', pos); }
    audio.sfx('gold', { vol: 0.6 });
    UI.refresh();
  },
  async heroAttack(h, e) {
    if (h.actions <= 0) return;
    h.actions--;
    const ranged = h.ranged && U.cheb(h.x, h.y, e.x, e.y) > 1;
    await this.attack(h, e, { ranged, proj: ranged ? h.proj : null, label: h.basic.name, destiny: true });
  },
  /* ------------------------------------------------------------ habilidades y acciones */
  async useSkill(h, s, d) {
    if (!s) return;
    const si = this.skillInfo(h, s), at = (u) => new THREE.Vector3(u.x * TILE, 1.5, u.y * TILE);
    if (!s.free) { if (h.actions <= 0) return; h.actions--; }
    s.cd = this.skillCd(h, s);
    this.eventful = true;
    if (Math.random() < 0.55 && BARKS[h.id].skill) FX.bubble(h, U.pick(BARKS[h.id].skill));
    UI.hintOnce('skill');
    if (s.id === 'torbellino') {
      const foes = this.visibleEnemies().filter((e) => this.meleeOK(h.x, h.y, e.x, e.y));
      const md = h.mesh.userData.model;
      audio.sfx('swing'); FX.ring({ x: h.x * TILE, z: h.y * TILE }, h.color, TILE * 1.6, 500);
      await U.tween(380, (k) => (md.rotation.y = U.easeOut(k) * Math.PI * 2));
      md.rotation.y = 0;
      let first = true;
      for (const e of foes) { await this.attack(h, e, { atk: si.dice, label: s.name, quick: !first, noFlank: true, destiny: first }); first = false; }
      UI.log(`${h.name} gira con el hacha: ${foes.length} enemigo${foes.length === 1 ? '' : 's'} alcanzado${foes.length === 1 ? '' : 's'}.`, 'good');
    } else if (s.id === 'grito') {
      audio.sfx('reveal', { vol: 0.9 }); ENGINE.shake(0.4);
      FX.ring({ x: h.x * TILE, z: h.y * TILE }, '#ff7a50', si.radius * TILE + 1, 700);
      ENGINE.flashLight(at(h), '#ff9a6a', 3.5, 0.6);
      const near = this.visibleEnemies().filter((e) => !e.boss && U.cheb(e.x, e.y, h.x, h.y) <= si.radius);
      let n = 0;
      for (const e of near) { if (await this.addStatus(e, 'aterrado', 2)) n++; else FX.text(this.headPos(e), 'No se asusta', 'block'); }
      if (h.hp < h.maxHp) await this.heal(h, si.heal);
      UI.log(`${h.name} ruge: ${n} enemigo${n === 1 ? '' : 's'} aterrado${n === 1 ? '' : 's'}.`, 'good');
    } else if (s.id === 'sismico') {
      const e = d.unit;
      ENGINE.shake(0.7); audio.sfx('quake', { vol: 0.8 });
      await this.attack(h, e, { atk: si.dice, label: s.name, destiny: true });
      FX.burst('dust', h.mesh.position); FX.burst('explode', { x: h.x * TILE, y: 0.2, z: h.y * TILE });
      FX.ring({ x: h.x * TILE, z: h.y * TILE }, '#f0b070', si.radius * TILE + 0.8, 600);
      const near = this.visibleEnemies().filter((o) => !o.boss && U.cheb(o.x, o.y, h.x, h.y) <= si.radius);
      for (const o of near) await this.addStatus(o, 'aturdido', 1);
    } else if (s.id === 'muralla') {
      h.status.muralla = 1; h.status.taunt = 1;
      audio.sfx('shield'); FX.burst('shield', h.mesh.position);
      ENGINE.flashLight(at(h), '#ffd0a0', 3, 0.8);
      FX.text(this.headPos(h), 'Muralla', 'heal');
      if (h.tal.has('murallaHierro')) this.heroes.forEach((a) => { if (a !== h && !a.ko && U.cheb(a.x, a.y, h.x, h.y) === 1) { a.status.guard = 1; FX.burst('shield', a.mesh.position); FX.text(this.headPos(a), 'Protegido', 'heal'); } });
      UI.log(`${h.name} se planta: +2 dados de defensa y los enemigos cercanos irán a por él.`, 'good');
    } else if (s.id === 'lluvia') {
      const cx = d.x, cy = d.y;
      this.faceTo(h, cx, cy);
      audio.sfx('arrow', { vol: 0.9 });
      FX.ring({ x: cx * TILE, z: cy * TILE }, '#86e0a0', TILE * 1.6, 600);
      const md = h.mesh.userData.model; U.tween(220, (k) => (md.rotation.x = -Math.sin(k * Math.PI) * 0.3));
      for (let i = 0; i < 4; i++) FX.projectile(new THREE.Vector3(h.x * TILE, 1.6, h.y * TILE), new THREE.Vector3((cx + U.rand(-1, 1)) * TILE, 0.2, (cy + U.rand(-1, 1)) * TILE), 'arrow');
      await U.sleep(260);
      const foes = this.visibleEnemies().filter((e) => U.cheb(e.x, e.y, cx, cy) <= 1);
      let first = true;
      for (const e of foes) { await this.attack(h, e, { atk: si.dice, ranged: true, proj: 'arrow', projFrom: new THREE.Vector3(e.x * TILE, 7, e.y * TILE), label: s.name, quick: !first, light: false, destiny: first }); first = false; }
      if (!foes.length) UI.log('Las flechas se clavan en el suelo vacío.', 'neutral');
    } else if (s.id === 'salto') {
      const m = h.mesh, fx0 = m.position.x, fz0 = m.position.z, tx = d.x * TILE, tz = d.y * TILE;
      this.faceTo(h, d.x, d.y); audio.sfx('hop');
      FX.burst('dust', m.position);
      await U.tween(420, (k) => { m.position.x = U.lerp(fx0, tx, k); m.position.z = U.lerp(fz0, tz, k); m.position.y = Math.sin(k * Math.PI) * 2.2; });
      m.position.y = 0; h.x = d.x; h.y = d.y;
      FX.burst('dust', m.position); audio.sfx('step');
      ENGINE.keyPos.set(tx, 0, tz);
      if (SETTINGS.follow) ENGINE.focusTile(d.x, d.y);
      if (h.tal.has('viento')) { h.status.inspirado = 1; FX.text(this.headPos(h), 'Inspirada', 'heal'); }
      const t = this.T(d.x, d.y);
      if (t.trap && !t.trap.revealed && !t.trap.disarmed && !t.trap.sprung) { await this.springTrap(t.trap, h); h.mvLeft = 0; }
      if (!h.ko && h.traits.trapSense) this.detectTraps(h, h.traits.trapSense);
      const room = this.L.rooms[t.room];
      if (!h.ko && room && !room.visited) { room.visited = true; UI.setLocation(this.ch, room); const meta = this.ch.rooms[room.marker]; if (meta && meta.enter) await this.run(meta.enter, { hero: h, room }); }
    } else if (s.id === 'bola') {
      const e = d.unit, oh = h.tal.has('llama') ? { st: 'ardiendo', dur: 2 } : null;
      await this.attack(h, e, { atk: si.dice, ranged: true, proj: 'fire', label: s.name, dtype: 'fire', onHit: oh, destiny: true });
      audio.sfx('fire'); FX.burst('fire', { x: e.x * TILE, y: 1, z: e.y * TILE }); FX.burst('explode', { x: e.x * TILE, y: 0.5, z: e.y * TILE });
      ENGINE.flashLight(new THREE.Vector3(e.x * TILE, 1.4, e.y * TILE), '#ff9a4a', 4, 0.6); ENGINE.shake(0.4);
      const splash = this.visibleEnemies().filter((o) => o !== e && U.cheb(o.x, o.y, e.x, e.y) === 1);
      for (const o of splash) await this.attack(h, o, { atk: si.splash, ranged: true, proj: 'fire', projFrom: new THREE.Vector3(e.x * TILE, 1.2, e.y * TILE), label: 'Llamas', light: false, dtype: 'fire', quick: true, onHit: oh });
    } else if (s.id === 'luz') {
      const a = d.unit;
      if (a !== h) await FX.projectile(new THREE.Vector3(h.x * TILE, 1.6, h.y * TILE), new THREE.Vector3(a.x * TILE, 1.2, a.y * TILE), 'dawn');
      ENGINE.flashLight(at(a), '#fff0c0', 3, 0.6);
      if (a.ko) { a.ko = false; a.ended = true; a.hp = 0; this.standUp(a); await this.heal(a, si.heal); this.woundOnRise(a); UI.log(`${a.name} vuelve a ponerse en pie.`, 'good'); }
      else await this.heal(a, si.heal);
      if (h.tal.has('aurora')) for (const b of this.heroes.filter((x) => x !== a && !x.ko && x.hp < x.maxHp && U.cheb(x.x, x.y, a.x, a.y) <= 1)) await this.heal(b, 2);
      FX.bubble(h, U.pick(BARKS.hechicero.heal));
    } else if (s.id === 'carga') {
      const e = d.unit, sp = this.chargeSpot(h, e);
      if (sp) {
        const R = this.reach(h, 5), path = this.pathTo(R, sp.x, sp.y) || [];
        audio.sfx('swing', { vol: 0.5 });
        for (let i = 1; i < path.length; i++) {
          await this.hop(h, path[i].x, path[i].y, { dur: 95, h: 0.15 });
          const t = this.T(path[i].x, path[i].y);
          if (t.trap && !t.trap.revealed && !t.trap.disarmed && !t.trap.sprung) { await this.springTrap(t.trap, h); h.mvLeft = 0; break; }
        }
        if (SETTINGS.follow) ENGINE.focusTile(h.x, h.y);
      }
      if (!h.ko && this.meleeOK(h.x, h.y, e.x, e.y)) { ENGINE.shake(0.3); await this.attack(h, e, { atk: si.dice, label: s.name, destiny: true }); }
    } else if (s.id === 'tribu') {
      audio.sfx('levelUp', { vol: 0.7 }); ENGINE.flashLight(at(h), '#ffe0a0', 3.5, 0.8);
      FX.ring({ x: h.x * TILE, z: h.y * TILE }, '#ffd27a', si.radius * TILE + 1, 800);
      const allies = this.heroes.filter((a) => !a.ko && U.cheb(a.x, a.y, h.x, h.y) <= si.radius);
      for (const a of allies) {
        a.status.inspirado = 2; if (!a.ended) a.mvLeft += 2;
        FX.burst('heal', a.mesh.position); FX.text(this.headPos(a), 'Inspirado · +2 mov.', 'heal');
        if (h.tal.has('cancion') && a.hp < a.maxHp) await this.heal(a, 2);
      }
      UI.log(`${h.name} lanza el grito de su tribu: ${allies.length} héroe${allies.length === 1 ? '' : 's'} inspirado${allies.length === 1 ? '' : 's'}.`, 'good');
    }
    UI.refresh();
  },

  async throwBomb(h, x, y) {
    if (this.items.bomb <= 0 || h.actions <= 0) return;
    this.items.bomb--; h.actions--;
    await FX.projectile(new THREE.Vector3(h.x * TILE, 1.4, h.y * TILE), new THREE.Vector3(x * TILE, 0.3, y * TILE), 'bomb');
    audio.sfx('explode'); ENGINE.shake(0.9); FX.burst('explode', { x: x * TILE, y: 0.5, z: y * TILE });
    ENGINE.flashLight(new THREE.Vector3(x * TILE, 1.5, y * TILE), '#ffb070', 6, 0.7); ENGINE.fx.flash = 0.25;
    this.addDoom(1);
    const victims = this.allUnits().filter((u) => u.side !== 'npc' && this.up(u) && U.cheb(u.x, u.y, x, y) <= 1);
    for (const v of victims) await this.diceHit('La bomba', v, 3, { label: 'Bomba alquímica', dir: new THREE.Vector3(v.x - x || 0.01, 0, v.y - y), dtype: 'fire', onHit: { st: 'ardiendo', dur: 1 } });
  },
  /* tirada sin atacante físico (bombas, erupciones) */
  async diceHit(name, tgt, atkN, o = {}) {
    if (!this.up(tgt)) return 0;
    let n = atkN;
    if (o.dtype && tgt.T) { if ((tgt.T.weak || []).includes(o.dtype)) n++; if ((tgt.T.resist || []).includes(o.dtype)) n--; }
    const defN = this.defDice(tgt);
    const A = []; for (let i = 0; i < Math.max(1, n); i++) A.push(this.rollDie());
    const D = []; for (let i = 0; i < defN; i++) D.push(this.rollDie());
    const skulls = A.filter((f) => f === 'skull').length, shieldFace = tgt.side === 'hero' ? 'white' : 'black';
    const shields = D.filter((f) => f === shieldFace).length, dmg = Math.max(0, skulls - shields);
    await this.combatRoll({ att: o.by || null, tgt, A, D, shieldFace, quick: true, caption: `${o.label ? `<b>${U.esc(o.label)}</b> · ` : ''}${U.esc(name)} → ${U.esc(tgt.name)}` });
    const tp = new THREE.Vector3(tgt.mesh.position.x, 1.1, tgt.mesh.position.z);
    if (dmg > 0) {
      FX.burst('hit', tp); audio.sfx('hit'); this.hitReact(tgt, (o.dir || (o.by ? new THREE.Vector3(tgt.x - o.by.x || 0.01, 0, tgt.y - o.by.y) : new THREE.Vector3(1, 0, 0))).normalize()); await this.damage(tgt, dmg, { by: o.by });
      if (o.onHit && this.up(tgt)) await this.addStatus(tgt, o.onHit.st, o.onHit.dur);
    } else { FX.burst('block', tp); audio.sfx('block'); FX.text(tp, 'Bloqueado', 'block'); }
    UI.log(`${name} → ${tgt.name}: ${dmg ? `<b>${dmg} de daño</b>` : 'sin daño'}.`, tgt.side === 'hero' ? 'bad' : 'good');
    return dmg;
  },
  async drink(h) {
    if (this.items.potion <= 0) return UI.toast('No os quedan pociones.');
    if (h.potionUsed) return UI.toast('Solo una poción por turno.');
    if (h.hp >= h.maxHp && !h.status.envenenado) return UI.toast(`${h.name} ya está en plena forma.`);
    this.items.potion--; h.potionUsed = true;
    audio.sfx('potion');
    delete h.status.envenenado;
    await this.heal(h, 4);
    UI.log(`${h.name} bebe una poción${h.status.envenenado ? '' : ' (y se cura el veneno)'}.`, 'good');
  },
  async elixir(h) {
    if (this.items.elixir <= 0) return UI.toast('No os quedan elixires.');
    this.items.elixir--; h.actions++;
    audio.sfx('levelUp'); FX.burst('magic', h.mesh.position, { color: '#9fe8ff', color2: '#3a8aff' });
    FX.text(new THREE.Vector3(h.mesh.position.x, 1.9, h.mesh.position.z), '+1 acción', 'heal');
  },
  /* ------------------------------------------------------------ interacción */
  /* Buscar: una vez por sala. Revela sus trampas y saca algo de una tabla al azar,
     como las cartas de tesoro de siempre: casi siempre bueno, a veces un susto */
  searchBlock(h) {
    if (!h || h.actions <= 0) return 'Buscar gasta la acción, y ya no te queda.';
    const room = this.roomOf(h); if (!room) return 'Aquí no hay nada que buscar.';
    if (this.visibleEnemies().some((e) => this.T(e.x, e.y).room === room.id)) return 'No podéis buscar con enemigos en la sala.';
    const meta = this.ch.rooms[room.marker];
    if (room.searched && !(meta && meta.search && !room.searchEvent)) return 'Esta sala ya está registrada.';
    return null;
  },
  async search(h) {
    const why = this.searchBlock(h); if (why) return UI.toast(why);
    const room = this.roomOf(h);
    const meta = this.ch.rooms[room.marker];
    const special = meta && meta.search && !room.searchEvent;
    h.actions--; this.eventful = true;
    audio.sfx('page', { vol: 0.5 });
    FX.bubble(h, 'Veamos…', 1.4);
    const fig = h.mesh.userData.model;
    await U.tween(500, (k) => (fig.rotation.x = Math.sin(k * Math.PI) * 0.35));
    UI.hintOnce('search');
    this.addDoom(1);
    let found = 0;
    this.L.traps.forEach((tr) => { if (!tr.revealed && !tr.disarmed && !tr.sprung && this.T(tr.x, tr.y).room === room.id) { this.revealTrap(tr); found++; } });
    if (found) UI.log(`${h.name} descubre ${found} trampa${found > 1 ? 's' : ''}.`, 'good');
    if (special) { room.searchEvent = true; room.searched = true; await this.run(meta.search, { hero: h, room }); UI.refresh(); return; }
    room.searched = true;
    const at = new THREE.Vector3(h.mesh.position.x, 1.6, h.mesh.position.z);
    // el Dado del Tesoro: oro, oro, poción, objeto, nada o peligro (en el tutorial, nunca peligro)
    const kind = await this.treasureRoll(h, this.tutorial);
    this.stats.treasure = this.stats.treasure || {}; this.stats.treasure[kind] = (this.stats.treasure[kind] || 0) + 1;
    const itemName = { elixir: 'un elixir', bomb: 'una bomba', potion: 'una poción' };
    if (kind === 'danger') {
      if (Math.random() < 0.5 || this.state !== 'play') {
        UI.treasurePlaque(h, kind, 'Peligro: un dardo, −1 PV');
        UI.log(`${h.name} levanta una losa… y un dardo sale disparado de la pared.`, 'bad');
        FX.burst('trap', { x: h.x * TILE, y: 0.8, z: h.y * TILE }); audio.sfx('trap');
        await this.damage(h, 1, { source: 'trap' });
      } else {
        UI.treasurePlaque(h, kind, 'Peligro: algo viene');
        UI.log(`El ruido despierta algo en la Hondura. <b>Viene hacia aquí.</b>`, 'bad');
        FX.text(at, '¡Algo se acerca!', 'warn'); audio.sfx('whisper', { dur: 1.2 });
        this.pendingWanderer = true;
      }
    } else if (kind === 'nothing') {
      UI.treasurePlaque(h, kind, 'Nada');
      UI.log(`${h.name} no encuentra más que polvo y huesos.`, 'neutral'); FX.text(this.headPos(h), 'Nada', 'block');
    } else if (kind === 'gold') {
      const g = U.randi(10, 20); UI.treasurePlaque(h, kind, `Oro: ${g} monedas`);
      this.addGold(g, at); UI.log(`Bajo una losa suelta: ${g} monedas.`, 'good');
      if (BARKS[h.id].gold && Math.random() < 0.6) FX.bubble(h, U.pick(BARKS[h.id].gold));
    } else if (kind === 'potion') {
      const g = U.randi(6, 14); UI.treasurePlaque(h, kind, `Una poción y ${g} monedas`);
      this.addGold(g, at); this.items.potion++; audio.sfx('potion', { vol: 0.6 });
      FX.text(new THREE.Vector3(at.x, 2, at.z), '+1 poción', 'heal'); UI.log(`${g} monedas y una poción intacta.`, 'good');
    } else {
      const it = U.pick(['elixir', 'bomb', 'potion', 'bomb']); this.items[it]++;
      const g = U.randi(12, 24); UI.treasurePlaque(h, kind, `${itemName[it][0].toUpperCase() + itemName[it].slice(1)} y ${g} monedas`);
      this.addGold(g, at); audio.sfx('chest', { vol: 0.6 });
      FX.text(new THREE.Vector3(at.x, 2, at.z), '+1 ' + { elixir: 'elixir', bomb: 'bomba', potion: 'poción' }[it], 'heal');
      UI.log(`¡Un alijo escondido! ${g} monedas y ${itemName[it]}.`, 'good');
    }
    DICE3D.clearLater(2200); UI.plaqueDone(2200);
    UI.refresh();
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
    h.actions--; c.looted = true; this.stats.chests++; this.eventful = true;
    this.faceTo(h, c.x, c.y);
    audio.sfx('chest');
    const lid = c.mesh.userData.lid; c.mesh.userData.glow.visible = true;
    await U.tween(500, (k) => (lid.rotation.x = -1.6 * U.easeOutBack(k)));
    ENGINE.flashLight(new THREE.Vector3(c.x * TILE, 1.2, c.y * TILE), '#ffcf6b', 2.5, 0.8);
    const g = U.randi(28, 50);
    this.addGold(g, new THREE.Vector3(c.x * TILE, 1.4, c.y * TILE));
    let extra = '';
    if (Math.random() < 0.55) { this.items.potion++; extra = ' y una poción'; }
    UI.log(`Cofre: ${g} monedas${extra}.`, 'good');
    setTimeout(() => (c.mesh.userData.glow.visible = false), 900);
    const ev = this.ch.chests[c.idx];
    if (ev) await this.run(ev, { hero: h, room: this.roomOf(h) });
  },
  async readNote(h, n) {
    this.faceTo(h, n.x, n.y); this.eventful = true;
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
    this.woundOnRise(a);
    FX.bubble(a, { barbaro: 'Aún no ha nacido quien me tumbe.', enano: 'Ni una palabra de esto.', elfa: 'Gracias. Te debo una.', hechicero: 'Estoy… estoy bien.', amazona: 'En pie. Seguimos.' }[a.id] || 'Gracias.');
    UI.log(`${h.name} levanta a ${a.name}.`, 'good');
  },
  /* Desarmar: 2 dados, basta una calavera. Sin ninguna, salta. El Enano no falla */
  async disarm(h, tr) {
    if (h.actions <= 0) return;
    h.actions--; this.eventful = true;
    this.faceTo(h, tr.x, tr.y);
    const sure = h.traits && h.traits.locksmith;
    const r = sure ? { ok: true, skulls: 1 } : await this.rollCheck(h, 2, 1, { label: 'Desarmar la trampa', at: tr });
    if (r.ok) {
      tr.disarmed = true; audio.sfx('block');
      tr.mesh.userData.spikes.visible = false;
      this.addGold(8, new THREE.Vector3(tr.x * TILE, 1, tr.y * TILE));
      FX.text(new THREE.Vector3(tr.x * TILE, 1.2, tr.y * TILE), 'Desarmada', 'heal');
      UI.log(`${h.name} desarma la trampa.`, 'good');
    } else {
      UI.log(`${h.name} falla al desarmar la trampa y la dispara.`, 'bad');
      await this.springTrap(tr, h);
    }
  },
  /* ------------------------------------------------------------ turno de la Sombra */
  async shadowPhase() {
    if (this.state !== 'play') return;
    this.phase = 'shadow'; this.active = null; this.mode = null; this.undo = null;
    const gen = this.gen;
    WORLD.setSelection(null); WORLD.setHighlights([]); WORLD.setPath(null);
    this.heroes.forEach((h) => { if (!h.ko) this.tickEnd(h); });
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
      const dist = (e) => Math.min(...this.heroesUp().map((h) => U.manh(h.x, h.y, e.x, e.y)).concat([99]));
      acting.sort((a, b) => dist(a) - dist(b));
      for (const e of acting) {
        if (this.state !== 'play' || gen !== this.gen || !this.heroesUp().length) break;
        if (!e.alive) continue;
        await this.enemyTurn(e);
      }
      if (this.state === 'play' && gen === this.gen && this.heroesUp().length) {
        // Relato: los caídos se levantan solos
        if (this.D.fall === 'auto') for (const h of this.heroes) if (h.ko) { h.ko = false; h.hp = 0; this.standUp(h); await this.heal(h, 1); UI.log(`${h.name} se levanta, tambaleante.`, 'good'); }
        this.addDoom(1);
        if (this.pendingWanderer) await this.spawnWanderer();
      }
    } catch (err) { console.error(err); }
    UI.shadowMode(false);
    if (gen !== this.gen) return;
    this.busy = Math.max(0, this.busy - 1);
    if (this.state === 'play' && this.heroesUp().length) await this.startRound();
  },
  async enemyTurn(e) {
    await this.tickStart(e);
    if (!e.alive) return;
    if (e.status.aturdido) { FX.text(this.headPos(e), 'Aturdido', 'block'); this.tickEnd(e); await U.sleep(200); return; }
    if (e.status.huyendo) await this.enemyFlee(e);
    else await this.enemyAct(e);
    if (e.alive) this.tickEnd(e);
  },
  /* IA: cada criatura piensa según su Ingenio (más la dificultad) y su rol */
  scoreTarget(e, h, x, y, steps, prov) {
    const iq = e.iq;
    let s = 100 - steps * 1.5;
    if (h.status.taunt && U.manh(h.x, h.y, e.x, e.y) <= 6) s += 80;
    if (iq <= 2) return s - U.cheb(e.x, e.y, h.x, h.y) * 3 + Math.random() * 3;
    s -= prov * 14;
    s += (h.maxHp - h.hp) * 2.5 - this.defDice(h) * 4;
    const exp = U.combatOdds(e.atk, this.defDice(h), 1 / 3, 0).exp;
    if (exp >= h.hp) s += 18;
    if (!e.ranged && U.cheb(x, y, h.x, h.y) === 1 && this.visibleEnemies().some((o) => o !== e && U.cheb(o.x, o.y, h.x, h.y) === 1)) s += 7;
    if (e.ranged) { s += Math.min(U.cheb(x, y, h.x, h.y), e.range) * 3; if (this.heroesUp().some((q) => U.cheb(q.x, q.y, x, y) === 1)) s -= iq >= 4 ? 20 : 8; }
    if (iq >= 4) { if (h.hitThisRound === this.round) s += 10; if (h.id === 'hechicero') s += 6; if (e.role === 'hostigador' && this.heroesUp().filter((q) => q !== h && U.cheb(q.x, q.y, h.x, h.y) <= 2).length === 0) s += 8; }
    return s + Math.random() * 2;
  },
  async enemyAct(e) {
    if (e.boss) { const done = await this.bossAct(e); if (done) return; }
    if (!e.alive) return;
    const targets = this.heroesUp(); if (!targets.length) return;
    const R = this.reach(e, e.mv, { noProv: e.iq <= 2 });
    let best = null;
    R.stand.forEach((k) => {
      const [x, y] = k.split(',').map(Number); const d = R.dist.get(k), p = R.prov.get(k) || 0;
      targets.forEach((h) => {
        if (!this.canHit(e, x, y, h, e.range)) return;
        const s = this.scoreTarget(e, h, x, y, d, p);
        if (!best || s > best.s) best = { x, y, h, s };
      });
    });
    if (e.T.healer && e.iq >= 3) {
      const hurt = this.visibleEnemies().filter((o) => o !== e && o.hp < o.maxHp && U.cheb(o.x, o.y, e.x, e.y) <= 4).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (hurt && (!best || hurt.hp <= 1 || Math.random() < 0.4)) { await this.enemyHeal(e, hurt); return; }
    }
    if (best) {
      if (best.x !== e.x || best.y !== e.y) { const ok = await this.moveEnemy(e, this.pathTo(R, best.x, best.y)); if (!ok) return; }
      if (!e.alive || !this.up(best.h)) return;
      if (e.mesh && e.mesh.visible) ENGINE.focusTile((e.x + best.h.x) / 2, (e.y + best.h.y) / 2);
      if (Math.random() < 0.25 && e.T.barks) FX.bubble(e, U.pick(e.T.barks), 2);
      best.h.hitThisRound = this.round;
      await this.attack(e, best.h, { label: e.name, ranged: e.ranged && U.cheb(e.x, e.y, best.h.x, best.h.y) > 1 });
      return;
    }
    if (e.T.healer) {
      const hurt = this.visibleEnemies().find((o) => o.alive && o !== e && o.hp < o.maxHp && U.cheb(o.x, o.y, e.x, e.y) <= 4);
      if (hurt) { await this.enemyHeal(e, hurt); return; }
    }
    // acercarse por la ruta larga
    const far = this.reach(e, 60, { ignoreUnits: true });
    let goal = null;
    far.dist.forEach((d, k) => {
      const [x, y] = k.split(',').map(Number);
      targets.forEach((h) => { if (this.canHit(e, x, y, h, e.range, e.range > 1)) { const s = d - (h.status.taunt ? 4 : 0); if (!goal || s < goal.s) goal = { x, y, s }; } });
    });
    if (!goal) return;
    const full = this.pathTo(far, goal.x, goal.y);
    if (!full) return;
    let stop = null;
    for (let i = Math.min(e.mv, full.length - 1); i >= 1; i--) { const k = U.key(full[i].x, full[i].y); if (R.stand.has(k) && R.dist.get(k) <= e.mv && (e.iq <= 2 || !(R.prov.get(k) > 0) || i === 1)) { stop = full[i]; break; } }
    if (stop) await this.moveEnemy(e, this.pathTo(R, stop.x, stop.y));
  },
  async enemyHeal(e, hurt) {
    audio.sfx('heal', { vol: 0.5 }); FX.burst('heal', hurt.mesh.position);
    hurt.hp = Math.min(hurt.maxHp, hurt.hp + 1);
    FX.text(new THREE.Vector3(hurt.mesh.position.x, 1.8, hurt.mesh.position.z), '+1', 'heal');
    UI.log(`${e.name} cura a ${hurt.name}.`, 'bad'); await U.sleep(400);
  },
  async enemyFlee(e) {
    const heroes = this.heroesUp(); if (!heroes.length) return;
    const R = this.reach(e, e.mv);
    const md = (x, y) => Math.min(...heroes.map((h) => U.manh(h.x, h.y, x, y)));
    let best = { x: e.x, y: e.y, s: md(e.x, e.y) * 2 };
    R.stand.forEach((k) => { const [x, y] = k.split(',').map(Number); const s = md(x, y) * 2 - (R.prov.get(k) || 0) * 3; if (s > best.s) best = { x, y, s }; });
    if (best.x !== e.x || best.y !== e.y) { await this.moveEnemy(e, this.pathTo(R, best.x, best.y)); return; }
    const adj = heroes.find((h) => this.meleeOK(e.x, e.y, h.x, h.y));
    if (adj && e.alive) await this.attack(e, adj, { label: 'Acorralado' });
  },
  async moveEnemy(e, path) {
    if (!path || path.length < 2) return true;
    const vis = e.mesh && e.mesh.visible;
    if (vis) ENGINE.focusTile(path[path.length - 1].x, path[path.length - 1].y);
    for (let i = 1; i < path.length; i++) {
      if (!(await this.reactions(e, path[i - 1].x, path[i - 1].y, path[i].x, path[i].y))) return false;
      await this.hop(e, path[i].x, path[i].y, { dur: vis ? 150 : 1 });
      if (!e.alive) return false;
    }
    return true;
  },

  /* ------------------------------------------------------------ jefes */
  async summon(b, type, n, maxAlive) {
    const alive = this.enemies.filter((e) => e.alive && e.summoned).length;
    const k = Math.min(n, this.summonsLeft, maxAlive - alive);
    for (let i = 0; i < k; i++) { const p = this.freeTileNear(b.x, b.y, 3); if (p) { const s = await this.spawn(type, p.x, p.y); s.summoned = true; s.group = -2; this.summonsLeft--; } }
    return k;
  },
  async bossAct(b) {
    const heroes = this.heroesUp();
    const near = (u) => heroes.filter((h) => U.cheb(h.x, h.y, u.x, u.y) === 1 && this.meleeOK(u.x, u.y, h.x, h.y));
    ENGINE.focusTile(b.x, b.y);
    if (b.kind === 'malakor') {
      const minions = this.enemies.filter((e) => e.alive && e.summoned).length;
      if ((this.round % 3 === 0 || minions === 0) && this.summonsLeft > 0 && minions < 3) {
        FX.bubble(b, U.pick(['¡Levantaos!', 'Servidme otra vez.', 'La muerte no es excusa.']), 2.2);
        audio.sfx('summon'); ENGINE.flashLight(new THREE.Vector3(b.x * TILE, 2, b.y * TILE), '#6dffb0', 4, 1);
        await this.summon(b, 'risen', 2, 3);
        await U.sleep(300);
      }
      return false;
    }
    if (b.kind === 'ignis') {
      if (this.eruptions.length) {
        audio.sfx('quake'); ENGINE.shake(0.8);
        FX.bubble(b, '¡ARDED!', 1.8);
        for (const t of this.eruptions) {
          FX.burst('fire', { x: t.x * TILE, y: 0.3, z: t.y * TILE }); FX.burst('explode', { x: t.x * TILE, y: 0.3, z: t.y * TILE });
          audio.sfx('lava'); ENGINE.flashLight(new THREE.Vector3(t.x * TILE, 1, t.y * TILE), '#ff6a1a', 4, 0.7);
          const u = this.unitAt(t.x, t.y);
          if (u && u.side === 'hero' && !u.ko) await this.diceHit('La erupción', u, 4, { label: 'Erupción', dtype: 'fire', onHit: { st: 'ardiendo', dur: 1 } });
          await U.sleep(160);
        }
        this.eruptions = []; WORLD.setDanger([]);
      }
      const adj = near(b);
      if (adj.length >= 2) {
        FX.bubble(b, '¡Aplastaros a todos!', 1.8);
        audio.sfx('bossRoar'); ENGINE.shake(1);
        for (const h of adj) await this.attack(b, h, { label: 'Golpe de magma', onHit: { st: 'aturdido', dur: 1, minDmg: 2 } });
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
      if (this.round % 3 === 0 && wraiths < 2 && this.summonsLeft > 0) {
        FX.bubble(b, U.pick(['Hijos míos, venid.', 'El Ojo tiene muchos hijos.']), 2);
        audio.sfx('summon');
        await this.summon(b, 'wraith', 2, 2);
      }
      let targets = heroes.filter((h) => U.cheb(h.x, h.y, b.x, b.y) <= b.range && this.los(b.x, b.y, h.x, h.y));
      if (!targets.length) {
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
        const dmg = await this.attack(b, h, { label: 'Mirada del Vacío', proj: 'void', ranged: true });
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
      this.enemies.filter((e) => e.alive && e.summoned).forEach((e) => { e.hp = 0; this.kill(e); });
      const ch = this.ch;
      if (this.descent) { await this.run(ch.boss && ch.boss.defeat, {}); audio.setMusic('explore'); UI.refresh(); return; }
      if (b.kind === 'isolde') { await this.run(ch.finalDefeat, {}); this.state = 'ending'; setTimeout(() => this.ending(), 60); return; }
      await this.run(ch.boss.defeat, {});
      if (b.kind === 'aethelgard') return;
      this.state = 'between';
      setTimeout(() => this.chapterComplete(), 60);
    } finally { this.busy = Math.max(0, this.busy - 1); }
  },
  async seal() {
    const a = this.L.altars[0]; if (!a) return;
    const el = this.lanternHolder();
    ENGINE.focusTile(a.x, a.y, { dist: 16 });
    await U.sleep(500);
    const from = new THREE.Vector3(a.x * TILE, 1.5, a.y * TILE);
    const to = el && el.mesh ? new THREE.Vector3(el.mesh.position.x, 1.8, el.mesh.position.z) : from;
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
  /* Puestos alrededor del fuego del campamento (hasta 5) */
  campSpots() { return [[3.4, 2.6], [6.6, 2.4], [5, 4.3], [2.7, 4.1], [7.3, 4.0]]; },
  placeCampHeroes() {
    (this.heroes || []).forEach((h) => { if (h.mesh) WORLD.removeUnit(h); });
    this.heroes = this.party.map((id) => this.makeHero(id));
    const spots = this.campSpots();
    this.heroes.forEach((h, i) => { h.x = 0; h.y = 0; WORLD.addUnit(h, { face: 0 }); const m = h.mesh; m.position.set(spots[i][0] * TILE, 0, spots[i][1] * TILE); m.lookAt(5 * TILE, 0, 3 * TILE); });
    this.updateLantern();
  },
  /* Talentos que le faltan a cada héroe del grupo hasta el rango «upTo» */
  async campTalents(upTo) {
    for (let tier = 0; tier <= upTo; tier++) {
      const need = this.party.filter((id) => (this.talents[id] || []).length <= tier);
      if (!need.length) continue;
      const picks = await UI.talents(tier, need);
      need.forEach((id) => { const t = (this.talents[id] = this.talents[id] || []); if (picks[id] && !t.includes(picks[id])) t.push(picks[id]); });
      this.refreshCampHeroes();
    }
  },
  /* Antes de bajar: se puede cambiar quién va (con la recomendación del capítulo siguiente) */
  async campParty(next) {
    const p = await UI.partyPick({ mode: 'camp', current: this.party, recommend: next && next.recommend, title: next ? `Capítulo ${next.num} · ${next.title}` : '' });
    if (!p || (p.length === this.party.length && p.every((id, i) => id === this.party[i]))) return;
    this.party = this.validParty(p);
    this.placeCampHeroes();
    UI.log(`Bajan: ${this.groupNames()}.`, 'good');
  },
  async camp(idx) {
    this.state = 'camp';
    this.chIdx = idx;
    this.save('camp');
    UI.showHUD(false);
    const c = CAMPS[idx];
    await UI.fadeOut();
    FX.clearLabels();
    WORLD.buildCamp();
    this.heroes = [];
    this.enemies = []; this.npcs = []; this.ch = Object.assign({}, CHAPTERS[idx], { lantern: this.flags.lantern || CHAPTERS[idx].lantern });
    this.placeCampHeroes();
    ENGINE.focus(5 * TILE, 3 * TILE, { dist: 13, pitch: 0.55, yaw: 0.2, instant: true });
    audio.startAmbient('camp'); audio.setMusic('camp');
    await UI.fadeIn();
    UI.locationCard(c.title);
    ENGINE.cam.t.yaw = 0.2;
    this.campOrbit = true;
    await this.run(c.steps, {});
    await this.campParty(CHAPTERS[idx + 1]);
    await this.campTalents(Math.min(idx, 1));
    if (!this.flags['vigil' + idx]) await this.vigil(idx);
    this.save('camp');
    await UI.shop();
    this.campOrbit = false;
    await this.startChapter(idx + 1);
  },
  refreshCampHeroes() {
    this.heroes.forEach((h, i) => { const nh = this.makeHero(h.id); const pos = h.mesh.position.clone(), rot = h.mesh.rotation.y; Object.assign(h, nh, { mesh: h.mesh }); WORLD.rebuildUnit(h); h.mesh.position.copy(pos); h.mesh.rotation.y = rot; void i; });
    this.updateLantern();
  },
  /* Velada: una actividad por noche, sin tiradas; algunas piden a un héroe concreto */
  async vigil(idx) {
    const V = VIGILS[idx]; if (!V) return;
    this.flags['vigil' + idx] = true;
    const opts = V.options.map((o) => {
      const q = Object.assign({}, o);
      if (o.req && !o.req.some((id) => this.party.includes(id))) q.locked = 'Necesita ' + o.req.map((id) => HERO_DEFS[id].role.toLowerCase()).join(' o ');
      return q;
    });
    const pick = await UI.choice(V.prompt, opts, { title: 'Velada' });
    if (!pick) return;
    const who = pick.req ? this.heroes.find((h) => pick.req.includes(h.id)) : this.lanternHolder();
    const nm = who ? who.name : 'Alguien';
    const text = {
      vigor: 'Dormís de un tirón por primera vez en días. (Todos empiezan el próximo capítulo con +2 de vida máxima)',
      traps: `${nm} vuelve antes del alba con el camino marcado con tiza. (Las trampas del próximo capítulo empiezan señaladas)`,
      sharp: `El chirrido de la piedra de afilar de ${nm} acompaña la noche. (Todos empiezan el próximo capítulo Inspirados)`,
      trueName: `${nm} no duerme. Al amanecer hay un nombre escrito en el margen del cuaderno, y no es Isolde. (El enemigo final será más débil)`
    }[pick.reward];
    if (pick.reward === 'vigor') this.flags.vigorCh = idx + 1;
    if (pick.reward === 'traps') this.flags.trapsKnownCh = idx + 1;
    if (pick.reward === 'sharp') this.flags.sharpCh = idx + 1;
    if (pick.reward === 'trueName') this.flags.trueName = true;
    if (text) await UI.say('narrador', text);
    UI.endDialogue();
  },
  async heroDies(h) {
    this.state = 'defeat';
    UI.log(`<b>${h.name} ha muerto.</b>`, 'bad');
    audio.sfx('heroDown'); ENGINE.fx.desatT = 0.9;
    this.deathOf = h;
    setTimeout(() => this.defeat(), 900);
  },
  async defeat() {
    // una sola derrota por intento, aunque la avisen dos caminos a la vez
    if (this._defeatGen === this.gen) return;
    this._defeatGen = this.gen;
    this.state = 'defeat';
    audio.stinger('defeat'); audio.setMusic('silence'); audio.heartbeat(false);
    ENGINE.fx.desatT = 0.9;
    if (this.descent && !this.tutorial) { await this.descentDefeat(); return; }
    const choice = await UI.defeatCard(this.deathOf);
    this.deathOf = null;
    ENGINE.fx.desatT = 0;
    if (this.tutorial) { TUTOR.stop(); if (choice === 'retry') this.startTutorial(); else UI.title(); return; }
    if (choice === 'retry' && this.checkpoint) { this.restore(this.checkpoint); this.startChapter(this.checkpoint.chIdx); }
    else UI.title();
  },
  async ending() {
    this.state = 'ending';
    U.store.del(SAVE_KEY);
    const ep = EPILOGUES[this.flags.broke === false ? 'gave' : 'broke'];
    audio.setMusic('menu');
    await UI.ending(ep, this.stats);
    UI.title();
  },

  /* ------------------------------------------------------------ guion */
  /* Nombres en los textos: {lider} es quien lleva el farol, {grupo} todo el grupo */
  groupNames() {
    const n = this.party.map((id) => HERO_DEFS[id].name);
    return n.length <= 1 ? (n[0] || '') : n.slice(0, -1).join(', ') + ' y ' + n[n.length - 1];
  },
  fmt(s) {
    if (typeof s !== 'string') return s;
    const lead = HERO_DEFS[this.party[0]] ? HERO_DEFS[this.party[0]].name : '';
    return s.replace(/\{lider\}/g, lead).replace(/\{grupo\}/g, this.groupNames());
  },
  /* Quién dice una frase del guion: el primero del grupo que tenga una propia; si no, el líder */
  heroLine(map, exclude) {
    if (typeof map === 'string') map = { any: map };
    const ids = this.party.filter((id) => id !== exclude);
    if (!ids.length) return null;
    const own = ids.find((id) => map[id]);
    if (own) return [own, map[own]];
    return map.any ? [ids[0], map.any] : null;
  },
  stepUnit(who, ctx) {
    if (who === 'lider') return this.heroes[0];
    if (who === 'tested') return this.tested;
    if (who === 'hero') return ctx.hero || this.active || this.heroesUp()[0];
    return this.heroes.find((q) => q.id === who);
  },
  async run(steps, ctx = {}) {
    if (!steps) return;
    if (steps.length) this.eventful = true;
    for (const st of steps) {
      if (!Array.isArray(st)) continue;
      const [k, ...a] = st;
      try {
        if (SPEAKERS[k] && k !== 'narrador') { await UI.say(k, this.fmt(a[0])); continue; }
        switch (k) {
          case 'n': await UI.say('narrador', this.fmt(a[0])); break;
          case 'h': case 'h2': {
            const line = this.heroLine(a[0], k === 'h2' ? this.lastSpeaker : null);
            if (line) { this.lastSpeaker = line[0]; await UI.say(line[0], this.fmt(line[1])); }
            break;
          }
          case 'hlast': { const id = this.party.includes(this.lastSpeaker) ? this.lastSpeaker : this.party[0]; await UI.say(id, this.fmt(a[0])); break; }
          case 'wait': await U.sleep(a[0]); break;
          case 'sfx': audio.sfx(a[0], { dur: a[1] }); break;
          case 'music': audio.setMusic(a[0]); break;
          case 'stinger': audio.stinger(a[0]); break;
          case 'shake': ENGINE.shake(a[0] || 0.5); break;
          case 'objective': UI.objective(this.fmt(a[0])); break;
          case 'hint': UI.hintOnce(a[0]); break;
          case 'bossbar': this.boss = this.enemies.find((e) => e.boss && e.alive); UI.bossBar(this.boss); break;
          case 'camBoss': { const b = this.enemies.find((e) => e.boss && e.alive); if (b) await ENGINE.focusWait(b.x, b.y, { dist: 15 }); break; }
          case 'camAltar': { const al = this.L.altars[0]; if (al) await ENGINE.focusWait(al.x, al.y, { dist: 15 }); break; }
          case 'bark': { const who = a[0] === 'enemy' ? U.pick(this.visibleEnemies()) : this.stepUnit(a[0], ctx); if (who && who.mesh) FX.bubble(who, this.fmt(a[1])); break; }
          case 'fear': { const list = a[0] === 'all' ? this.heroesUp() : [this.stepUnit(a[0], ctx)].filter((h) => h && !h.ko); for (const h of list) await this.addStatus(h, 'aterrado', a[1] || 1); break; }
          case 'ambush': {
            const h = ctx.hero || this.active || this.heroesUp()[0]; if (!h || h.ko) break;
            if (h.id === 'elfa' || h.id === 'amazona') { FX.text(this.headPos(h), 'Esquiva', 'heal'); UI.log(`${h.name} lo ve venir y se aparta a tiempo.`, 'good'); audio.sfx('swing'); }
            else { UI.log(`${h.name} recibe el golpe por sorpresa.`, 'bad'); await this.damage(h, a[0] || 2, { source: 'story' }); }
            break;
          }
          case 'strike': {
            const h = this.stepUnit(a[0], ctx), b = this.enemies.find((e) => e.boss && e.alive);
            if (h && !h.ko) await this.diceHit(b ? b.name : 'El golpe', h, a[1] || 3, { label: 'Golpe sin defensa', by: b || null });
            break;
          }
          case 'lights': await this.lights(a[0]); break;
          case 'scare': await UI.scare(a[0]); break;
          case 'spawn': await this.scriptSpawn(a[0], a[1], a[2] || 1, ctx); break;
          case 'npc': await this.spawnNPC(a[0], ctx); break;
          case 'npcGone': await this.removeNPC(a[0]); break;
          case 'note': await UI.note(this.fmt(a[0]), this.fmt(a[1])); break;
          case 'give': this.give(a[0], a[1]); break;
          case 'flag': this.flags[a[0]] = a[1]; break;
          case 'lantern': this.flags.lantern = a[0]; this.updateLantern(); break;
          case 'seal': await this.seal(); break;
          case 'gearLoot': this.gearLoot(); break;
          case 'twist': await this.twist(); break;
          case 'spawnBoss': await this.spawnFinalBoss(a[0]); break;
          case 'choice': case 'check': await this.runChoice(a[0], a[1], ctx); break;
          case 'willTest': await this.willTest(); break;
          case 'hurt': { const h = this.stepUnit(a[0], ctx); if (h && !h.ko) await this.damage(h, a[1] || 1, { source: 'story' }); break; }
          case 'status': { const h = this.stepUnit(a[0], ctx); if (h) await this.addStatus(h, a[1], a[2] || 1); break; }
        }
      } catch (e) { console.error('step', st, e); }
    }
    UI.endDialogue();
  },
  /* Elección: [label, desc, steps] o {label, desc, steps, req}. «req» es una lista de héroes o una pista ya encontrada */
  async runChoice(prompt, options, ctx) {
    const opts = options.map((o) => (Array.isArray(o) ? { label: o[0], desc: o[1], steps: o[2] } : Object.assign({}, o)));
    opts.forEach((o) => {
      o.label = this.fmt(o.label); o.desc = this.fmt(o.desc);
      if (Array.isArray(o.req)) { if (!o.req.some((id) => this.party.includes(id))) o.locked = o.reqText || 'No disponible'; }
      else if (o.req && !this.flags[o.req]) o.locked = o.reqText || 'No disponible';
    });
    const pick = await UI.choice(this.fmt(prompt), opts);
    if (pick && pick.steps) await this.run(pick.steps, ctx);
  },

  /* La voz de Isolde: aterra al final a quien no sea inmune al miedo, salvo que sepáis la verdad de Tomás */
  async willTest() {
    this.willFail = [];
    for (const h of this.heroesUp()) {
      let imm = this.immuneTo(h, 'aterrado');
      if (!imm && this.flags.tomasTruth) imm = 'Recuerda a Tomás';
      if (imm) { FX.text(this.headPos(h), imm, 'block'); UI.log(`${h.name} no escucha la voz de Isolde (${imm}).`, 'good'); continue; }
      this.willFail.push(h); FX.text(this.headPos(h), 'La voz se queda dentro', 'warn');
      UI.log(`La voz de Isolde se queda en la cabeza de ${h.name}.`, 'bad');
      await U.sleep(200);
    }
  },
  async lights(mode) {
    this.lightsMode = mode === 'out' ? 'out' : 'on';
    if (mode === 'out') { audio.sfx('torchOut'); WORLD.setLightsMult(0); ENGINE.key.intensity = 0.12; ENGINE.hemi.intensity = 0.08; await U.sleep(400); }
    else if (mode === 'on') { WORLD.setLightsMult(1); ENGINE.key.intensity = 2.6; ENGINE.hemi.intensity = WORLD.theme.hemi * 2.2; audio.sfx('torch'); }
    else if (mode === 'flicker') { for (let i = 0; i < 5; i++) { WORLD.setLightsMult(i % 2 ? 1 : 0.15); await U.sleep(70 + Math.random() * 90); } WORLD.setLightsMult(1); }
  },
  async scriptSpawn(type, where, n, ctx) {
    const h = ctx.hero || this.active || this.heroesUp()[0];
    n = Math.max(1, Math.round(n * PARTY_SCALE.of(this.party.length, 'foes') * (this.D.foes || 1)));
    for (let i = 0; i < n; i++) {
      let p = null;
      if (where === 'near' && h) p = this.freeTileNear(h.x, h.y, 2);
      else if (where === 'room') {
        const room = ctx.room || this.roomOf(h);
        const cands = room.tiles.filter((t) => this.passable(t.x, t.y, { side: 'enemy' }) && !this.unitAt(t.x, t.y)).sort((a, b) => Math.min(...this.heroes.map((q) => U.cheb(q.x, q.y, b.x, b.y))) - Math.min(...this.heroes.map((q) => U.cheb(q.x, q.y, a.x, a.y))));
        p = cands[Math.floor(Math.random() * Math.min(4, cands.length))];
      } else if (Array.isArray(where)) p = i === 0 ? { x: where[0], y: where[1] } : this.freeTileNear(where[0], where[1], 2);
      if (p) { const e = await this.spawn(type, p.x, p.y, 'summon'); e.group = -3; if (h) this.faceTo(e, h.x, h.y); }
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
    if (what === 'tomasDagger') {
      this.flags.tomasDagger = true;
      if (!this.ownerOf('tomasDagger')) this.stash.push('tomasDagger');
      const h = this.lanternHolder(); if (h && h.mesh) FX.burst('magic', h.mesh.position, { color: '#cfe6ff' });
      audio.sfx('levelUp');
    }
    else if (what === 'blessing') this.heroes.forEach((h) => { if (!h.ko) this.heal(h, 2); });
    else if (what === 'blessing2') this.heroes.forEach((h) => this.heal(h, 3));
    else if (what === 'thrainLoot') { const h = this.lanternHolder(); this.addGold(40, h && h.mesh ? this.headPos(h) : null); this.items.elixir++; }
    UI.refresh();
  },
  async twist() {
    const el = this.lanternHolder();
    const al = this.L.altars[0];
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
    // entregar el farol la hace más fuerte (algo menos en Pesadilla, que ya la refuerza de por sí)
    if (this.flags.broke === false) { b.hp += this.D.id === 'pesadilla' ? 2 : 4; b.atk += 1; }
    if (this.flags.tomasTruth) b.hp -= 2;
    if (this.flags.trueName) { b.hp -= 2; b.def = Math.max(1, b.def - 1); }
    b.maxHp = b.hp = Math.max(4, b.hp);
    this.summonsLeft = Math.min(this.D.summons, 4);
    this.enemies.push(b);
    WORLD.addUnit(b, { face: 0 });
    b.active = true;
    const m = b.mesh; m.scale.setScalar(0.01);
    ENGINE.flashLight(new THREE.Vector3(p.x * TILE, 2, p.y * TILE), '#c08bff', 6, 1.5);
    FX.burst('summon', m.position, { color: '#e0ccff', color2: '#5a2aaa' }); audio.sfx('bossRoar');
    await ENGINE.focusWait(p.x, p.y, { dist: 16 });
    await U.tween(900, (k) => m.scale.setScalar(Math.max(0.01, k)), U.easeOutBack);
    this.boss = b;
    if (this.flags.tomasTruth || this.flags.trueName) UI.log('Lo que sabéis de ella la debilita: Isolde empieza con menos fuerza.', 'good');
    for (const h of this.willFail || []) if (!h.ko) await this.addStatus(h, 'aterrado', 2);
    this.willFail = [];
  }
};
