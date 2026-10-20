/* ==========================================================================
   Modo Descenso: reglas de la partida (niveles, escaleras, campamentos,
   velas y récord). La mazmorra la genera DESCENT.make (10_descent.js).
   ========================================================================== */
Object.assign(GAME, {
  descent: null,
  saveKey() { return this.descent ? DESCENT_KEY : SAVE_KEY; },
  chapterDef(idx) { return this.descent && idx >= 1000 ? DESCENT.make(this.descent.seed, idx - 1000) : CHAPTERS[idx]; },
  descentBest() { return U.store.get('umbral.descent.best', null); },
  noteBest() {
    const D = this.descent; if (!D) return false;
    const b = this.descentBest();
    if (b && b.depth >= D.depth) return false;
    U.store.set('umbral.descent.best', { depth: D.depth, party: this.party.slice(), difficulty: this.difficulty, date: Date.now() });
    return true;
  },

  async startDescent(difficulty, party) {
    this.newGame(difficulty, null, party);
    this.descent = { seed: (Math.random() * 4294967296) >>> 0, depth: 1, lives: DESCENT.LIVES[this.difficulty] != null ? DESCENT.LIVES[this.difficulty] : 3, camps: 0, campDepth: 0, boonAt: 0, carry: null, record: false };
    this.gold = 80;
    U.store.del(DESCENT_KEY);
    await this.startChapter(1001);
  },

  /* Al empezar un nivel: la vida y las heridas vienen del nivel anterior */
  applyCarry() {
    const C = this.descent && this.descent.carry; if (!C) return;
    this.heroes.forEach((h) => {
      const c = C[h.id]; if (!c) return;
      h.wounds = c.wounds || 0;
      h.maxHp = Math.max(3, h.maxHp - h.wounds);
      h.hp = U.clamp(c.hp, 1, h.maxHp);
    });
  },

  stairsInfo(h, x, y) {
    const name = 'Escalera abajo';
    if (this.boss && this.boss.alive) return { kind: 'none', text: name, sub: 'El guardián del nivel no os dejará pasar.' };
    if (this.visibleEnemies().length) return { kind: 'none', text: name, sub: 'No podéis bajar con enemigos a la vista.' };
    const ap = this.adjApproach(h, x, y);
    if (!ap) return { kind: 'none', text: name, sub: 'Acércate a la escalera para bajar.' };
    const next = this.descent.depth + 1, camp = DESCENT.isBoss(this.descent.depth);
    return { kind: 'stairs', x, y, via: ap, text: camp ? 'Bajar y acampar' : `Bajar al nivel ${next}`, sub: `Baja todo el grupo, también los caídos. ${camp ? 'Al pie de la escalera acamparéis: descanso completo, talentos y tienda.' : 'Recuperáis 2 PV; las heridas siguen hasta acampar.'}${this.provText(ap.p)}` };
  },

  async descend(h) {
    if (this.state !== 'play') return;
    this.state = 'between';
    const D = this.descent, done = D.depth;
    this.faceTo(h, this.ch.exit.x, this.ch.exit.y);
    audio.sfx('door'); audio.setMusic('silence');
    D.carry = {};
    this.heroes.forEach((q) => { D.carry[q.id] = { hp: Math.min(q.maxHp, (q.ko ? 1 : q.hp) + 2), wounds: q.wounds || 0 }; });
    D.depth = done + 1;
    if (this.noteBest()) D.record = true;
    UI.log(`El grupo baja al nivel ${D.depth}.`, 'good');
    setTimeout(() => (DESCENT.isBoss(done) ? this.descentCamp() : this.startChapter(1000 + D.depth)), 80);
  },

  async descentCamp() {
    const D = this.descent;
    this.state = 'camp';
    D.carry = null;
    if (D.campDepth !== D.depth) { D.campDepth = D.depth; D.camps = (D.camps || 0) + 1; }
    this.chIdx = 1000 + D.depth;
    this.save('dcamp');
    UI.showHUD(false);
    await UI.fadeOut();
    FX.clearLabels();
    WORLD.buildCamp();
    this.heroes = []; this.enemies = []; this.npcs = [];
    const theme = DESCENT.theme(D.depth - 1);
    this.ch = { id: 'dcamp', num: String(D.depth - 1), title: 'Campamento', rooms: {}, lantern: DESCENT.LANTERN[theme], descent: true };
    this.placeCampHeroes();
    ENGINE.focus(5 * TILE, 3 * TILE, { dist: 13, pitch: 0.55, yaw: 0.2, instant: true });
    audio.startAmbient('camp'); audio.setMusic('camp');
    await UI.fadeIn();
    UI.locationCard(`Al pie del nivel ${D.depth - 1}`);
    ENGINE.cam.t.yaw = 0.2;
    this.campOrbit = true;
    await this.run([['n', DESCENT.CAMP[(D.camps - 1) % DESCENT.CAMP.length]], ['n', 'Las heridas se cierran junto al fuego. Mañana, el nivel ' + D.depth + '.']], {});
    UI.endDialogue();
    // Ascenso: dos rangos de talentos; después, una mejora por campamento
    const tier = D.camps - 1;
    await this.campTalents(Math.min(tier, 1));
    if (tier >= 2 && D.boonAt !== D.depth) {
      const picks = await UI.boons();
      this.build = this.build || {};
      this.party.forEach((id) => {
        const bn = BOONS.find((q) => q.id === picks[id]); if (!bn) return;
        const b = (this.build[id] = this.build[id] || {});
        Object.entries(bn.mods).forEach(([k, v]) => (b[k] = (b[k] || 0) + v));
      });
      D.boonAt = D.depth;
      this.refreshCampHeroes();
    }
    this.save('dcamp');
    await UI.shop();
    this.campOrbit = false;
    await this.startChapter(1000 + D.depth);
  },

  /* Derrota: se apaga una vela y se repite el nivel; sin velas, termina el descenso */
  async descentDefeat() {
    const D = this.descent, left = D.lives;
    if (left <= 0) {
      U.store.del(DESCENT_KEY);
      this.deathOf = null; ENGINE.fx.desatT = 0;
      await this.descentOver();
      return;
    }
    if (this.checkpoint && this.checkpoint.descent) { this.checkpoint.descent.lives = left - 1; U.store.set(DESCENT_KEY, this.checkpoint); }
    const choice = await UI.defeatCard(this.deathOf, { descent: true, lives: left - 1, depth: D.depth });
    this.deathOf = null; ENGINE.fx.desatT = 0;
    if (choice === 'retry' && this.checkpoint) { this.restore(this.checkpoint); this.startChapter(this.checkpoint.chIdx); }
    else UI.title();
  },
  async descentOver() {
    const D = this.descent;
    const rec = this.noteBest() || D.record;
    this.state = 'ending';
    audio.setMusic('menu');
    const choice = await UI.descentOver({ depth: D.depth, record: rec, best: this.descentBest(), stats: this.stats, party: this.party.slice(), difficulty: this.difficulty });
    if (choice === 'again') UI.descentSetup(); else UI.title();
  },

  /* Un cofre con una pieza de equipo: va al arcón para repartirla al acampar */
  gearLoot() {
    const pool = GEAR.filter((it) => !it.found && !this.ownerOf(it.id) && (!it.who || it.who.some((id) => this.party.includes(id))));
    if (!pool.length) { const g = U.randi(25, 40); this.addGold(g); UI.log(`Bajo el oro, nada más: ${g} monedas extra.`, 'good'); return; }
    const it = U.pick(pool);
    this.stash.push(it.id);
    audio.sfx('levelUp');
    UI.banner(it.name, 'Al arcón: podréis dárselo a alguien al acampar', 'place');
    UI.log(`Encontráis <b>${U.esc(it.name)}</b>. Va al arcón del grupo.`, 'good');
  }
});
