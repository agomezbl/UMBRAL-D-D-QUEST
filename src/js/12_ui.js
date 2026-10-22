/* ==========================================================================
   Interfaz: HUD, diálogo, dados, tarjetas, tienda y menús
   ========================================================================== */
const UI = {
  portraits: {},
  init() {
    this.$ = (id) => document.getElementById(id);
    this.hud = this.$('hud');
    this.buildParty(); this.buildActions();
    [['btn-view', 'map'], ['btn-rotate', 'rotate'], ['btn-center', 'target'], ['btn-log', 'scroll'], ['btn-sound', 'sound'], ['btn-menu', 'menu'], ['btn-party', 'crown']].forEach(([id, ic]) => (this.$(id).innerHTML = icon(ic)));
    this.$('btn-party').onclick = () => { audio.sfx('ui'); this.sheet(); };
    this.$('undo-move').innerHTML = icon('rotate') + ' Deshacer movimiento <kbd>Z</kbd>';
    this.$('undo-move').onclick = () => GAME.action('undo');
    this.$('ffwd').innerHTML = icon('ffwd') + ' Acelerar';
    this.$('cancel-mode').onclick = () => GAME.action('cancel');
    this.$('btn-log').onclick = () => { audio.sfx('ui'); this.$('chronicle').hidden = !this.$('chronicle').hidden; this.renderChronicle(); };
    this.$('chronicle-close').onclick = () => { this.$('chronicle').hidden = true; };
    this.$('btn-sound').onclick = () => { audio.init(); audio.setMuted(!audio.muted); this.$('btn-sound').innerHTML = icon(audio.muted ? 'mute' : 'sound'); };
    this.$('btn-menu').onclick = () => this.pause();
    this.$('btn-center').onclick = () => { const h = GAME.active || GAME.heroesUp()[0]; if (h) ENGINE.focusTile(h.x, h.y); audio.sfx('ui'); };
    this.$('btn-rotate').onclick = () => { ENGINE.rotate(Math.PI / 4); audio.sfx('ui'); };
    this.$('btn-view').onclick = () => { const c = ENGINE.cam.t; c.pitch = c.pitch > 1.2 ? 0.92 : 1.38; audio.sfx('ui'); };
    this.$('ffwd').onclick = () => { this.fast = !this.fast; U.speed = this.fast ? 2.6 : SETTINGS.speed; this.$('ffwd').classList.toggle('on', this.fast); };
    this.$('dlg').addEventListener('pointerup', (e) => { if (e.target.closest('#dlg-skip')) return; this.advance(); });
    this.$('dlg-skip').onclick = (e) => { e.stopPropagation(); GAME.skipping = true; this.advance(true); };
    this.$('hint-ok').onclick = () => { this.$('hint').hidden = true; };
    this.logs = [];
  },
  hideAll() { if (typeof DICE3D !== 'undefined') DICE3D.clear(); this.plaqueHide(); ['dlg', 'choice', 'note', 'hint', 'preview', 'chronicle', 'items-pop', 'sheet'].forEach((id) => { const e = this.$(id); if (e) e.hidden = true; }); this.screen(null); },
  showHUD(on) { this.hud.hidden = !on; document.body.classList.toggle('in-game', on); },

  /* ---------------- grupo ---------------- */
  buildParty() {
    const p = this.$('party'); p.innerHTML = '';
    p.className = 'n' + GAME.party.length;
    GAME.party.forEach((id, i) => {
      const d = HERO_DEFS[id];
      const c = U.el('button', 'hero-card', `
        <span class="hc-port"><img alt="" data-port="${id}"><i class="hc-ring" style="--hc:${d.color}"></i>${i === 0 ? `<i class="hc-lan" title="Lleva el farol">${icon('flame')}</i>` : ''}</span>
        <span class="hc-body">
          <span class="hc-name">${d.name}<small>${d.role}</small></span>
          <span class="hc-hp"><span class="hc-hpbar"><i></i></span><b class="hc-hpn"></b></span>
          <span class="hc-st"><span class="st-mv" title="Movimiento restante">${icon('boot')}<b></b></span><span class="st-act" title="Acción">${icon('hand')}</span></span>
          <span class="hc-fx"></span>
        </span>
        <span class="hc-tag"></span>`);
      c.dataset.hero = id; c.style.setProperty('--hc', d.color);
      c.onclick = () => { const h = GAME.heroes.find((q) => q.id === id); if (h && !h.ended && !h.ko && GAME.phase === 'hero' && !GAME.busy) { GAME.selectHero(h); audio.sfx('ui'); } else if (h) ENGINE.focusTile(h.x, h.y); };
      p.appendChild(c);
    });
  },
  /* Barra de acciones: atacar, dos habilidades, buscar, objetos y fin de turno */
  buildActions() {
    const a = this.$('actions'); a.innerHTML = '';
    const mk = (id, ic, label, key) => { const b = U.el('button', 'act', `<span class="act-ic">${icon(ic)}</span><span class="act-lb">${label}</span>${key ? `<kbd>${key}</kbd>` : ''}<span class="act-cd"></span>`); b.dataset.act = id; b.onclick = (e) => { e.stopPropagation(); if (id === 'items') this.togglePop('items-pop'); else { this.closeItems(); GAME.action(id); } }; a.appendChild(b); return b; };
    this.btn = {
      attack: mk('attack', 'sword', 'Atacar', '1'), s0: mk('s0', 'shield', 'Habilidad', '2'), s1: mk('s1', 'radiant', 'Habilidad', '3'),
      search: mk('search', 'search', 'Buscar', '4'), items: mk('items', 'potion', 'Objetos', '5'), end: mk('end', 'hourglass', 'Fin de turno', '␣')
    };
    this.btn.end.classList.add('act-end');
    const pop = this.$('items-pop');
    pop.innerHTML = ['potion', 'elixir', 'bomb'].map((k) => { const s = SHOP.find((q) => q.id === k); return `<button class="item-row" data-item="${k}">${icon(s.icon)}<span><b>${s.name}</b><small>${s.desc}</small></span><em data-count="${k}">0</em></button>`; }).join('');
    U.$$('.item-row', pop).forEach((b) => (b.onclick = (e) => { e.stopPropagation(); this.closeItems(); GAME.action(b.dataset.item); }));
  },
  togglePop(id) { audio.sfx('ui'); const p = this.$(id), open = p.hidden; this.closeItems(); p.hidden = !open; this.btn.items.classList.toggle('mode', open); if (open) this.refresh(); },
  toggleItems() { this.togglePop('items-pop'); },
  closeItems() { this.$('items-pop').hidden = true; if (this.btn) this.btn.items.classList.remove('mode'); },
  refresh() {
    if (!this.hud || GAME.state !== 'play') return;
    // grupo
    U.$$('.hero-card', this.$('party')).forEach((c) => {
      const h = GAME.heroes.find((q) => q.id === c.dataset.hero); if (!h) return;
      const img = c.querySelector('img'); if (this.portraits[h.id] && img.src !== this.portraits[h.id]) img.src = this.portraits[h.id];
      c.classList.toggle('active', GAME.active === h && GAME.phase === 'hero');
      c.classList.toggle('ended', h.ended && !h.ko); c.classList.toggle('ko', h.ko);
      c.querySelector('.hc-hpbar i').style.width = (100 * h.hp / h.maxHp) + '%';
      c.querySelector('.hc-hpbar').classList.toggle('low', h.hp <= 2);
      c.querySelector('.hc-hpn').textContent = `${h.hp}/${h.maxHp}`;
      c.querySelector('.st-mv b').textContent = h.mvLeft;
      c.querySelector('.st-act').classList.toggle('used', h.actions <= 0);
      c.querySelector('.hc-fx').innerHTML = Object.keys(h.status).filter((k) => STATUS[k] && h.status[k]).map((k) => `<span class="fx-chip ${STATUS[k].bad ? 'bad' : 'good'}" title="${STATUS[k].name}: ${STATUS[k].desc}">${icon(STATUS[k].icon)}${k === 'desangrando' ? h.status[k] : ''}</span>`).join('') + (h.wounds ? `<span class="fx-chip bad" title="Herido: −${h.wounds} PV máximo hasta acampar">${icon('heart')}−${h.wounds}</span>` : '');
      c.querySelector('.hc-tag').textContent = h.ko ? (h.status.desangrando ? `Se desangra · ${h.status.desangrando}` : 'Caído') : h.ended ? 'Hecho' : (GAME.active === h && GAME.phase === 'hero') ? 'En turno' : '';
    });
    // acciones
    const h = GAME.active, can = h && GAME.phase === 'hero' && !GAME.busy;
    if (h) {
      h.skills.forEach((s, i) => {
        const b = this.btn['s' + i];
        b.querySelector('.act-ic').innerHTML = icon(s.icon); b.querySelector('.act-lb').textContent = s.name;
        const si = GAME.skillInfo(h, s);
        b.title = `${s.name}: ${si.text}`;
        const cd = b.querySelector('.act-cd');
        cd.textContent = s.cd > 0 ? s.cd : ''; b.classList.toggle('cooling', s.cd > 0); b.classList.toggle('free', !!s.free);
        const why = GAME.skillBlock(h, s);
        b.disabled = !can; b.classList.toggle('blocked', !!why);
        if (why) b.title = `${s.name}: ${why}`;
        b.classList.toggle('mode', !!(GAME.mode && GAME.mode.key === 's' + i));
      });
      this.btn.attack.querySelector('.act-ic').innerHTML = icon(h.basic.icon);
      this.btn.attack.querySelector('.act-lb').textContent = h.basic.name;
      this.btn.attack.title = `${h.basic.name}: ${h.atk} dados (${HERO_DEFS[h.id].weapon})${h.range > 1 ? `, alcance ${h.range}` : ''}.`;
      this.btn.attack.disabled = !can; this.btn.attack.classList.toggle('blocked', h.actions <= 0);
      this.btn.attack.classList.toggle('mode', !!(GAME.mode && GAME.mode.key === 'attack'));
      const sb = GAME.searchBlock(h);
      this.btn.search.disabled = !can; this.btn.search.classList.toggle('blocked', !!sb);
      this.btn.search.title = sb || 'Buscar: revela las trampas de la sala y quizá encuentra tesoro. Una vez por sala; hace ruido (+1 Presagio).';
      this.btn.items.disabled = !can;
      this.btn.end.disabled = !can;
      this.btn.end.classList.toggle('pulse', can && h.mvLeft <= 0 && h.actions <= 0);
    } else Object.values(this.btn).forEach((b) => (b.disabled = true));
    this.$('actions').classList.toggle('targeting', !!GAME.mode);
    this.$('cancel-mode').hidden = !GAME.mode;
    this.$('undo-move').hidden = !(GAME.undo && GAME.active === GAME.undo.h && !GAME.busy && GAME.phase === 'hero');
    const dm = this.$('r-doom'); if (dm) { const mx = GAME.doomMax(); dm.innerHTML = `${icon('eye')}<span class="doom-bar">${Array.from({ length: mx }, (_, i) => `<i class="${i < GAME.doom ? 'on' : ''}"></i>`).join('')}</span>`; dm.title = `Presagio ${GAME.doom}/${mx}: crece cada ronda y con el ruido. Al llenarse, algo errante sube a buscaros.`; dm.classList.toggle('warn', GAME.doom >= mx - 1); }
    // recursos
    this.$('r-gold').textContent = GAME.gold;
    this.$('r-potion').textContent = GAME.items.potion; this.$('r-elixir').textContent = GAME.items.elixir; this.$('r-bomb').textContent = GAME.items.bomb;
    U.$$('[data-count]').forEach((e) => (e.textContent = GAME.items[e.dataset.count]));
    this.$('r-round').textContent = GAME.round;
    if (this.bossU) this.updateBoss();
  },
  setLocation(ch, room) {
    const meta = room && ch.rooms[room.marker];
    this.$('q-num').textContent = ch.num;
    this.$('q-loc').textContent = (meta && meta.name) || ch.title;
  },
  objective(t) { this.$('q-obj').textContent = t; this.$('quest').classList.remove('flash'); void this.$('quest').offsetWidth; this.$('quest').classList.add('flash'); },
  bossBar(b) { this.bossU = b; this.$('bossbar').hidden = !b; if (b) { this.$('boss-name').textContent = b.name; this.updateBoss(); } },
  updateBoss() { const b = this.bossU; if (!b) return; this.$('boss-fill').style.width = (100 * Math.max(0, b.hp) / b.maxHp) + '%'; this.$('boss-hp').textContent = `${Math.max(0, b.hp)} / ${b.maxHp}`; if (!b.alive) this.bossBar(null); },
  shadowMode(on) { document.body.classList.toggle('shadow-turn', on); this.$('ffwd').hidden = !on; if (!on && this.fast) { this.fast = false; U.speed = SETTINGS.speed; this.$('ffwd').classList.remove('on'); } },

  /* ---------------- previsualización ---------------- */
  preview(d, confirm) {
    const p = this.$('preview');
    if (!d) { p.hidden = true; return; }
    p.hidden = false;
    let dice = '';
    if (d.atk) dice = `<div class="pv-dice"><span class="pv-a">${'<i class="dd skull"></i>'.repeat(Math.min(d.atk, 8))}</span><em>contra</em><span class="pv-d">${'<i class="dd bshield"></i>'.repeat(Math.min(d.def, 8))}</span></div>`;
    const u = d.unit;
    let stats = '';
    if (u && u.side === 'enemy') {
      const tr = (u.T.traits || []).concat(u.champion ? ['campeon'] : []).map((k) => ETRAITS[k]).filter(Boolean);
      const st = Object.keys(u.status).filter((k) => STATUS[k] && u.status[k]).map((k) => STATUS[k].name);
      stats = `<div class="pv-stats"><span class="hp-pips">${Array.from({ length: u.maxHp }, (_, i) => `<i class="${i < u.hp ? 'on' : ''}"></i>`).join('')}</span><span title="Dados de ataque">${icon('sword')}${u.atk}</span><span title="Dados de defensa">${icon('shield')}${u.def}</span><span title="Movimiento">${icon('boot')}${u.mv}</span>${u.ranged ? `<span title="Alcance">${icon('bow')}${u.range}</span>` : ''}</div>
        <div class="pv-virt"><span class="pv-iq" title="Cómo piensa (según la criatura y la dificultad)">${GAME.iqLabel(u)} · ${(ROLES[u.role] || '').split(' · ')[0]}</span></div>
        ${tr.length || st.length ? `<div class="pv-traits">${tr.map((t) => `<span title="${U.esc(t.desc)}">${U.esc(t.name)}</span>`).join('')}${st.map((t) => `<span class="bad">${U.esc(t)}</span>`).join('')}</div>` : ''}`;
    } else if (u && u.side === 'hero' && d.kind === 'self') {
      stats = `<div class="pv-stats">${this.statLine({ hp: `${u.hp}/${u.maxHp}`, atk: u.atk, def: u.def, mv: u.mv, range: u.range })}</div>`;
    }
    const mods = d.mods && d.mods.length ? `<div class="pv-mods">${d.mods.map(([t, v]) => `<span class="${v > 0 ? 'up' : 'down'}">${v > 0 ? '+' : ''}${v} ${U.esc(t)}</span>`).join('')}</div>` : '';
    const sub = d.sub ? d.sub.replace(/ \(.*?\) contra/, ' contra') : '';
    p.innerHTML = `<b>${U.esc(d.text)}</b>${sub ? `<small>${U.esc(sub)}</small>` : ''}${mods}${stats}${dice}${confirm ? '<span class="pv-confirm">Toca otra vez para confirmar</span>' : ''}`;
    p.classList.toggle('confirm', !!confirm);
  },

  /* ---------------- banners, avisos ---------------- */
  banner(title, sub, kind) {
    const b = this.$('banner');
    b.className = 'banner ' + (kind || '');
    b.innerHTML = `<div class="bn-t">${U.esc(title)}</div>${sub ? `<div class="bn-s">${U.esc(sub)}</div>` : ''}`;
    void b.offsetWidth; b.classList.add('show');
    clearTimeout(this._bt); this._bt = setTimeout(() => b.classList.remove('show'), 1500 / U.speed);
  },
  toast(t) {
    const el = this.$('toast'); el.textContent = t; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(this._tt); this._tt = setTimeout(() => el.classList.remove('show'), 2600);
  },
  hintOnce(id) {
    if (GAME.tutorial) return; // el tutorial ya lo explica paso a paso
    const seen = U.store.get('umbral.hints', {});
    if (seen[id] || !HINTS[id]) return;
    if (id === 'touch' && !U.isTouch()) return;
    seen[id] = 1; U.store.set('umbral.hints', seen);
    const h = this.$('hint'); this.$('hint-text').textContent = HINTS[id]; h.hidden = false;
    clearTimeout(this._ht); this._ht = setTimeout(() => (h.hidden = true), 11000);
  },
  log(html, kind = 'neutral') {
    this.logs.push({ html, kind, r: GAME.round });
    if (this.logs.length > 120) this.logs.shift();
    const el = this.$('log');
    const line = U.el('div', 'lg ' + kind, html);
    el.appendChild(line);
    while (el.children.length > 4) el.firstChild.remove();
    if (!this.$('chronicle').hidden) this.renderChronicle();
  },
  renderChronicle() { this.$('chronicle-list').innerHTML = this.logs.slice().reverse().map((l) => `<div class="lg ${l.kind}"><em>R${l.r}</em> ${l.html}</div>`).join(''); },

  /* ---------------- diálogo ---------------- */
  say(who, text) {
    if (GAME.skipping) return Promise.resolve();
    return new Promise((resolve) => {
      const d = this.$('dlg'), sp = SPEAKERS[who] || SPEAKERS.narrador;
      document.body.classList.add('cinema');
      d.hidden = false;
      d.className = 'dlg plate ' + (who === 'narrador' ? 'narr' : 'talk') + ' who-' + who;
      const port = this.portraits[who];
      this.$('dlg-port').hidden = who === 'narrador' || !port;
      if (port) this.$('dlg-port-img').src = port;
      this.$('dlg-name').innerHTML = who === 'narrador' ? '' : `${U.esc(sp.name)}${sp.title ? `<small>${U.esc(sp.title)}</small>` : ''}`;
      this.$('dlg-name').style.color = sp.color;
      const tx = this.$('dlg-text'); tx.textContent = '';
      this.$('dlg-next').classList.remove('ready');
      audio.speak(text, who);
      const cps = { lenta: 28, normal: 55, rapida: 120 }[SETTINGS.textSpeed] || 55;
      let i = 0; const chars = [...text];
      this._typing = true;
      this._resolve = () => { this._resolve = null; resolve(); };
      clearInterval(this._ti);
      const done = () => {
        clearInterval(this._ti); this._typing = false; tx.textContent = text; this.$('dlg-next').classList.add('ready');
        if (SETTINGS.autoText) { clearTimeout(this._auto); this._auto = setTimeout(() => this.advance(), 1400 + text.length * 38); }
      };
      this._finish = done;
      this._ti = setInterval(() => {
        const n = Math.max(1, Math.round(cps / 30));
        for (let k = 0; k < n && i < chars.length; k++) tx.textContent += chars[i++];
        if (i % 3 === 0) audio.sfx('type', { vol: 0.6 });
        if (i >= chars.length) done();
      }, 1000 / 30);
    });
  },
  advance(force) {
    if (this.$('dlg').hidden) return;
    clearTimeout(this._auto);
    if (this._typing && !force) { this._finish && this._finish(); return; }
    audio.stopSpeech();
    if (this._typing) { clearInterval(this._ti); this._typing = false; }
    const r = this._resolve; if (r) { audio.sfx('page', { vol: 0.25 }); r(); }
  },
  endDialogue() {
    GAME.skipping = false;
    this.$('dlg').hidden = true; document.body.classList.remove('cinema');
    audio.stopSpeech();
  },
  note(title, text) {
    return new Promise((resolve) => {
      if (GAME.skipping) { resolve(); return; }
      const n = this.$('note');
      this.$('note-title').textContent = title; this.$('note-text').textContent = text;
      n.hidden = false; audio.speak(text, 'narrador');
      const close = () => { n.hidden = true; audio.stopSpeech(); n.removeEventListener('pointerup', close); audio.sfx('page', { vol: 0.4 }); resolve(); };
      setTimeout(() => n.addEventListener('pointerup', close), 300);
    });
  },
  /* ---------------- sustos ---------------- */
  async scare(kind) {
    const s = this.$('scare');
    s.className = 'scare ' + (kind || 'flash');
    s.hidden = false; void s.offsetWidth; s.classList.add('go');
    audio.sfx('scare');
    ENGINE.fx.flash = SETTINGS.flashes ? 0.5 : 0.1; ENGINE.shake(0.9);
    await U.sleep(kind === 'eyes' ? 1700 : 700);
    s.classList.remove('go'); s.hidden = true;
  },

  /* ---------------- pantallas ---------------- */
  screen(html, cls) {
    const s = this.$('screen');
    if (!html) { s.hidden = true; s.innerHTML = ''; s.className = 'screen'; return null; }
    s.className = 'screen ' + (cls || ''); s.innerHTML = html; s.hidden = false;
    // los rótulos flotantes (lugar, ronda) no deben transparentarse detrás de una pantalla
    this.$('banner').classList.remove('show');
    return s;
  },
  fadeOut() { this.$('fade').classList.add('on'); return U.sleep(700); },
  fadeIn() { this.$('fade').classList.remove('on'); return U.sleep(500); },
  async chapterCard(ch) {
    this.showHUD(false);
    this.$('fade').classList.add('on');
    await U.sleep(400);
    const s = this.screen(`<div class="chap"><div class="chap-num">${ch.eyebrow || `Capítulo ${ch.num}`}</div><h1 class="chap-title">${ch.title}</h1><div class="chap-sub">${ch.subtitle}</div><div class="chap-rule"></div></div>`, 'chapter-card');
    audio.stinger('chapter');
    s.querySelector('.chap').classList.add('in');
    await new Promise((r) => { const t = setTimeout(r, 3400); s.onclick = () => { clearTimeout(t); r(); }; });
    this.screen(null);
    this.$('fade').classList.remove('on');
  },
  locationCard(t) {
    const b = this.$('banner'); b.className = 'banner place'; b.innerHTML = `<div class="bn-t">${U.esc(t)}</div><div class="bn-s">Campamento</div>`;
    void b.offsetWidth; b.classList.add('show'); setTimeout(() => b.classList.remove('show'), 2600);
  },
  victoryCard(ch, st) {
    return new Promise((resolve) => {
      const mins = Math.max(1, Math.round((Date.now() - st.start) / 60000));
      const s = this.screen(`<div class="card victory">
        <div class="eyebrow">Capítulo ${ch.num} superado</div>
        <h2>${ch.subtitle}</h2>
        <p class="lead">El farol pesa un poco más. Y brilla un poco distinto.</p>
        <dl class="stats"><div><dt>Criaturas abatidas</dt><dd>${st.kills}</dd></div><div><dt>Oro reunido</dt><dd>${st.gold}</dd></div><div><dt>Rondas</dt><dd>${st.rounds}</dd></div><div><dt>Caídas</dt><dd>${st.falls}</dd></div><div><dt>Escritos leídos</dt><dd>${st.notes}</dd></div><div><dt>Minutos</dt><dd>${mins}</dd></div></dl>
        <button class="btn primary" id="v-go">${icon('flame')} Acampar y descansar</button></div>`, 'dim');
      s.querySelector('#v-go').onclick = () => { audio.sfx('ui'); this.screen(null); resolve(); };
    });
  },
  defeatCard(dead, o = {}) {
    return new Promise((resolve) => {
      this.showHUD(false);
      const candles = o.descent ? `<div class="candles" aria-label="${o.lives} velas">${Array.from({ length: Math.max(o.lives + 1, 1) }, (_, i) => `<i class="${i < o.lives ? 'on' : 'out'}">${icon('flame')}</i>`).join('')}</div>` : '';
      const s = this.screen(`<div class="card defeat"><div class="eyebrow">${o.descent ? `Descenso · nivel ${o.depth}` : 'Fin del camino'}</div><h2>${o.descent ? 'Una vela se apaga' : dead ? `${U.esc(dead.name)} no volverá a levantarse` : 'Las sombras os reclaman'}</h2>
        ${candles}
        <p class="lead">${o.descent ? `${dead ? `${U.esc(dead.name)} no ha vuelto a levantarse. ` : ''}Os ${o.lives === 1 ? 'queda una vela' : `quedan ${o.lives} velas`}: podéis repetir este nivel desde su comienzo, tal como lo encontrasteis.` : dead ? 'Nadie llegó a tiempo. Sin todo el grupo, el descenso no puede continuar.' : 'El farol rueda por el suelo de piedra. Arriba, en Aldmere, nadie sabrá cómo terminó la historia.'}</p>
        <div class="row"><button class="btn primary" id="d-retry">${icon('rotate')} ${o.descent ? 'Repetir el nivel' : 'Reintentar el capítulo'}</button><button class="btn" id="d-menu">${o.descent ? 'Salir (se guarda)' : 'Volver al inicio'}</button></div></div>`, 'dim red');
      s.querySelector('#d-retry').onclick = () => { audio.sfx('ui'); this.screen(null); resolve('retry'); };
      s.querySelector('#d-menu').onclick = () => { audio.sfx('ui'); this.screen(null); resolve('menu'); };
    });
  },
  shop() {
    return new Promise((resolve) => {
      const party = GAME.party;
      const port = (id) => `<img src="${this.portraits[id] || ''}" alt="">`;
      const rebuild = (id) => {
        const h = GAME.heroes.find((q) => q.id === id); if (!h || !h.mesh) return;
        const nh = GAME.makeHero(id);
        if (GAME.state === 'camp') Object.assign(h, nh, { mesh: h.mesh }); else h.modelOpts = nh.modelOpts;
        const pos = h.mesh.position.clone(), rot = h.mesh.rotation.y; WORLD.rebuildUnit(h); h.mesh.position.copy(pos); h.mesh.rotation.y = rot;
        FX.burst('magic', pos, { color: '#ffe6a0', color2: '#ffb000' }); GAME.updateLantern();
      };
      const render = () => {
        const disc = GAME.gearDiscount();
        s.querySelector('.shop-gold b').textContent = GAME.gold;
        s.querySelector('.shop-haggle').innerHTML = disc ? `${icon('crown')} Con el Sello de la Orden os rebajan un ${Math.round(disc * 100)} % en todo.` : '';
        // lo que lleva cada héroe
        s.querySelector('.shop-kit').innerHTML = party.map((id) => `<div class="kit-h" style="--hc:${HERO_DEFS[id].color}">${port(id)}<b>${HERO_DEFS[id].name}</b>${Object.keys(SLOTS).map((sl) => { const it = GAME.gearOf(id).find((g) => g.slot === sl); return `<span class="kit-slot ${it ? 'on' : ''}"><em>${SLOTS[sl]}</em>${it ? U.esc(it.name) : '—'}</span>`; }).join('')}</div>`).join('') +
          (GAME.stash.length ? `<div class="kit-h stash">${icon('chest')}<b>Arcón</b><span class="kit-slot on">${GAME.stash.map((k) => U.esc(GAME.gearDef(k).name)).join(' · ')}</span></div>` : '');
        const cons = (it) => {
          const cost = Math.round(it.cost * (1 - disc)), full = it.max && GAME.items[it.id] >= it.max, can = GAME.gold >= cost && !full;
          return `<div class="shop-item"><span class="si-ic">${icon(it.icon)}</span><span class="si-t"><b>${it.name}</b><small>${it.desc}</small></span>
            <span class="si-buy"><em>${full ? `Mochila llena (${it.max})` : `Tenéis ${GAME.items[it.id]}${it.max ? ` de ${it.max}` : ''}`}</em><button class="btn small" data-buy="${it.id}" ${can ? '' : 'disabled'}>${icon('coin')} ${cost}${cost < it.cost ? ` <s>${it.cost}</s>` : ''}</button></span></div>`;
        };
        const gearRow = (it) => {
          const owner = GAME.ownerOf(it.id), cost = GAME.gearPrice(it);
          const who = (it.who || party).filter((id) => party.includes(id));
          const btns = who.map((id) => {
            const why = GAME.gearBlock(id, it), here = GAME.hasGear(id, it.id);
            const off = here || why || (!owner && GAME.gold < cost);
            const title = here ? `Lo lleva ${HERO_DEFS[id].name}` : why || (!owner && GAME.gold < cost ? 'No os llega el oro' : owner ? `Dárselo a ${HERO_DEFS[id].name}` : `Comprar para ${HERO_DEFS[id].name}`);
            return `<button class="gear-to ${here ? 'here' : ''}" data-gear="${it.id}" data-to="${id}" ${off ? 'disabled' : ''} title="${U.esc(title)}" aria-label="${U.esc(title)}" style="--hc:${HERO_DEFS[id].color}">${port(id)}</button>`;
          }).join('');
          const state = owner === 'stash' ? 'En el arcón: elige quién lo lleva' : owner ? `Lo lleva ${HERO_DEFS[owner].name}` : `${icon('coin')} ${cost}${cost < it.cost ? ` <s>${it.cost}</s>` : ''} · elige quién lo lleva`;
          const blockedAll = who.every((id) => GAME.gearBlock(id, it));
          return `<div class="shop-item gear ${owner ? 'owned' : ''} ${blockedAll ? 'blocked' : ''}"><span class="si-ic">${icon(it.icon)}</span>
            <span class="si-t"><b>${it.name}</b><span class="gear-tags"><i>${SLOTS[it.slot]}</i>${it.who && it.who.length < HERO_ROSTER.length ? `<i class="req">${it.who.map((id) => HERO_DEFS[id].role).join(' · ')}</i>` : ''}</span><small>${it.desc}</small></span>
            <span class="si-buy gear-buy"><em>${state}</em><span class="gear-tos">${btns}</span></span></div>`;
        };
        s.querySelector('.shop-cons').innerHTML = SHOP.map(cons).join('');
        const usable = (it) => !it.who || it.who.some((id) => party.includes(id));
        const relics = GEAR.filter((it) => !it.found && it.who && it.who.length === 1 && usable(it));
        const common = GEAR.filter((it) => !it.found && !(it.who && it.who.length === 1) && usable(it));
        const found = GEAR.filter((it) => it.found && GAME.ownerOf(it.id));
        s.querySelector('.shop-ups').innerHTML = `${relics.length ? `<h4>Reliquias del grupo</h4>${relics.map(gearRow).join('')}` : ''}<h4>Equipo de la Orden</h4>${common.map(gearRow).join('')}${found.length ? `<h4>Hallazgos</h4>${found.map(gearRow).join('')}` : ''}`;
        U.$$('[data-buy]', s).forEach((b) => (b.onclick = () => { const it = SHOP.find((i) => i.id === b.dataset.buy), cost = Math.round(it.cost * (1 - GAME.gearDiscount())); if (GAME.gold < cost || (it.max && GAME.items[it.id] >= it.max)) return; GAME.gold -= cost; GAME.items[it.id]++; audio.sfx('buy'); render(); }));
        U.$$('[data-gear]', s).forEach((b) => (b.onclick = () => {
          const id = b.dataset.to, k = b.dataset.gear, prevOwner = GAME.ownerOf(k);
          const ok = prevOwner ? GAME.equip(k, id) : GAME.buyGear(k, id);
          if (!ok) return;
          audio.sfx(prevOwner ? 'ui' : 'buy');
          rebuild(id); if (prevOwner && prevOwner !== 'stash') rebuild(prevOwner);
          render();
        }));
      };
      const s = this.screen(`<div class="card shop"><div class="shop-head"><div><div class="eyebrow">Arcón de la Orden</div><h2>Antes de descender</h2></div><div class="shop-gold">${icon('coin')}<b></b><span>monedas</span></div></div>
        <p class="lead">Las hermanas del Archivo dejaron provisiones y equipo en el rellano. Cada pieza va en un hueco (mano, cuerpo o extra) y no todos los héroes pueden llevarlo todo.</p>
        <p class="shop-haggle"></p>
        <div class="shop-kit"></div>
        <div class="shop-grid"><section><h3>Provisiones</h3><div class="shop-cons"></div></section><section><h3>Armería</h3><div class="shop-ups"></div></section></div>
        <div class="row end"><button class="btn primary" id="shop-go">${icon('play')} Descender</button></div></div>`, 'dim shop-screen');
      render();
      s.querySelector('#shop-go').onclick = () => { audio.sfx('ui'); this.screen(null); resolve(); };
    });
  },
  ending(ep, st) {
    return new Promise(async (resolve) => {
      this.showHUD(false);
      await this.fadeOut();
      const s = this.screen(`<div class="prologue ending"><div class="pl-line"></div><button class="btn ghost pl-skip">Saltar</button></div>`, 'black');
      const line = s.querySelector('.pl-line');
      let skip = false; s.querySelector('.pl-skip').onclick = () => { skip = true; adv && adv(); };
      let adv = null;
      for (const l of ep.lines) {
        if (skip) break;
        line.classList.remove('in'); await U.sleep(300); line.textContent = l; line.classList.add('in');
        audio.speak(l, 'narrador');
        await new Promise((r) => { adv = r; const t = setTimeout(r, 3200 + l.length * 45); s.onclick = (e) => { if (!e.target.closest('.pl-skip')) { clearTimeout(t); r(); } }; });
      }
      audio.stopSpeech();
      this.$('fade').classList.remove('on');
      const mins = Math.max(1, Math.round((Date.now() - st.start) / 60000));
      const s2 = this.screen(`<div class="card final"><div class="eyebrow">Fin</div><h2 class="display">${ep.title}</h2>
        <p class="lead">${GAME.flags.broke === false ? 'Hay finales que se pagan con alguien que se queda atrás.' : 'Rompisteis la luz que os mentía. Aldmere vuelve a tener una llama propia.'}</p>
        <dl class="stats"><div><dt>Criaturas abatidas</dt><dd>${st.kills}</dd></div><div><dt>Oro reunido</dt><dd>${st.gold}</dd></div><div><dt>Rondas jugadas</dt><dd>${st.rounds}</dd></div><div><dt>Caídas</dt><dd>${st.falls}</dd></div><div><dt>Escritos leídos</dt><dd>${st.notes}</dd></div><div><dt>Minutos</dt><dd>${mins}</dd></div></dl>
        <p class="small">${GAME.flags.broke === false ? `Existe otro final. Quizá la próxima vez ${U.esc(GAME.fmt('{lider}'))} no dude.` : 'Existe otro final, más amargo. Solo se alcanza dudando.'}</p>
        <button class="btn primary" id="e-go">Volver al inicio</button></div>`, 'dim');
      s2.querySelector('#e-go').onclick = () => { audio.sfx('ui'); this.screen(null); resolve(); };
    });
  },
  prologue() {
    return new Promise(async (resolve) => {
      const s = this.screen(`<div class="prologue"><div class="pl-line"></div><div class="pl-tap">Toca para continuar</div><button class="btn ghost pl-skip">Saltar prólogo</button></div>`, 'black');
      const line = s.querySelector('.pl-line');
      let skip = false, adv = null;
      s.querySelector('.pl-skip').onclick = (e) => { e.stopPropagation(); skip = true; adv && adv(); };
      audio.setMusic('menu');
      for (const l of PROLOGUE) {
        if (skip) break;
        line.classList.remove('in'); await U.sleep(350); line.textContent = l; line.classList.add('in');
        audio.speak(l, 'narrador');
        await new Promise((r) => { adv = r; const t = setTimeout(r, 2800 + l.length * 50); s.onclick = () => { clearTimeout(t); r(); }; });
      }
      audio.stopSpeech();
      this.screen(null);
      resolve();
    });
  },

  /* ---------------- título y menús ---------------- */
  title() {
    GAME.state = 'title'; GAME.tutorial = false; GAME.gen = (GAME.gen || 0) + 1; GAME.busy = 0; GAME.mode = null;
    TUTOR.stop();
    // limpiar lo que pudiera quedar a medias (diálogo, latido, velo de la Sombra)
    clearInterval(this._ti); clearTimeout(this._auto); this._typing = false; this._resolve = null;
    document.body.classList.remove('cinema'); audio.stopSpeech(); audio.heartbeat(false);
    this.showHUD(false); this.hideAll(); this.bossBar(null); this.shadowMode(false);
    const save = U.store.get(SAVE_KEY, null);
    const dsave = (() => { const d = U.store.get(DESCENT_KEY, null); return d && d.descent ? d : null; })();
    const dbest = U.store.get('umbral.descent.best', null);
    const tutDone = !!U.store.get('umbral.tutorial', 0);
    const s = this.screen(`<div class="title">
      <div class="tt-top"><div class="tt-eyebrow">Crónicas de la Última Llama</div>
      <h1 class="tt-name" aria-label="Umbral">UMBRAL</h1>
      <p class="tt-tag">Cinco héroes. Tres sellos. Un farol que no debería brillar.</p></div>
      <nav class="tt-menu">
        ${save ? `<button class="btn primary" id="t-cont">${icon('play')} Continuar <small>Capítulo ${CHAPTERS[save.chIdx] ? CHAPTERS[save.chIdx].num : ''}${save.stage === 'camp' ? ' · campamento' : save.stage === 'round' && save.run ? ` · ronda ${save.run.round}` : ''}</small></button>` : ''}
        <button class="btn ${save ? '' : 'primary'}" id="t-new">${icon('flame')} Nueva partida <small>Campaña · tres capítulos</small></button>
        ${dsave ? `<button class="btn" id="t-dcont">${icon('stairs')} Seguir bajando <small>Nivel ${dsave.descent.depth}${dsave.stage === 'dcamp' ? ' · campamento' : dsave.stage === 'round' && dsave.run ? ` · ronda ${dsave.run.round}` : ''} · ${dsave.descent.lives} ${dsave.descent.lives === 1 ? 'vela' : 'velas'}</small></button>` : ''}
        <button class="btn" id="t-desc">${icon('stairs')} Modo Descenso <small>${dbest ? `Récord: nivel ${dbest.depth}` : 'Mazmorras sin fin · de 1 a 5 héroes'}</small></button>
        <button class="btn ${tutDone ? '' : 'recommend'}" id="t-tut">${icon('target')} Tutorial guiado <small>${tutDone ? 'unos 10 min' : 'Recomendado · 10 min'}</small></button>
        <button class="btn" id="t-help">${icon('scroll')} Cómo se juega</button>
        <button class="btn" id="t-set">${icon('gear')} Ajustes</button>
      </nav>
      <div class="tt-foot">Táctica por turnos con dados de calavera y escudo · Ratón, teclado o pantalla táctil</div></div>`, 'title-screen');
    const start = () => audio.init();
    s.addEventListener('pointerdown', start, { once: true });
    if (save) s.querySelector('#t-cont').onclick = () => {
      audio.init(); audio.sfx('ui'); GAME.restore(save); this.screen(null); MAIN.stopTitle();
      if (save.stage === 'camp') GAME.camp(save.chIdx);
      else if (save.stage === 'round' && save.run) GAME.startChapter(save.chIdx, { resume: save });
      else GAME.startChapter(save.chIdx);
    };
    s.querySelector('#t-new').onclick = () => { audio.init(); audio.sfx('ui'); this.difficulty(); };
    s.querySelector('#t-desc').onclick = () => { audio.init(); audio.sfx('ui'); this.descentSetup(); };
    if (dsave) s.querySelector('#t-dcont').onclick = () => {
      audio.init(); audio.sfx('ui'); GAME.restore(dsave); this.screen(null); MAIN.stopTitle();
      if (dsave.stage === 'dcamp') GAME.descentCamp();
      else if (dsave.stage === 'round' && dsave.run) GAME.startChapter(dsave.chIdx, { resume: dsave });
      else GAME.startChapter(dsave.chIdx);
    };
    s.querySelector('#t-tut').onclick = () => this.startTutorial();
    s.querySelector('#t-help').onclick = () => { audio.init(); audio.sfx('ui'); this.help(() => this.title()); };
    s.querySelector('#t-set').onclick = () => { audio.init(); audio.sfx('ui'); this.settings(() => this.title()); };
    audio.setMusic('menu', 'crypt');
    MAIN.titleScene();
  },
  async startTutorial() {
    audio.init(); audio.sfx('ui');
    this.screen(null); await this.fadeOut(); MAIN.stopTitle();
    GAME.startTutorial();
  },
  difficulty(mode) {
    const tutDone = !!U.store.get('umbral.tutorial', 0), desc = mode === 'descent';
    const opts = ['relato', 'heroe', 'pesadilla'].map((id) => DIFFICULTY[id]);
    const s = this.screen(`<div class="card diff"><div class="eyebrow">${desc ? 'Modo Descenso' : 'Nueva partida'}</div><h2>¿Cuánta oscuridad soportáis?</h2>
      <div class="diff-opts">${opts.map((d) => `<button class="diff-opt ${d.id === 'heroe' ? 'sel' : ''}" data-d="${d.id}"><b>${d.name}</b><small>${d.blurb}</small>
        <ul class="diff-list"><li>La Sombra: ${d.iq < 0 ? 'torpe' : d.iq > 0 ? 'más astuta' : 'piensa según cada criatura'}</li><li>Caer: ${d.fall === 'auto' ? 'te levantas solo' : d.fall === 'bleed' ? `te desangras (${d.bleed} rondas)` : 'un aliado te levanta, quedas herido'}</li><li>Presagio: ${d.doom} marcas</li>${d.champions ? '<li>Campeones entre los enemigos</li>' : ''}${desc ? `<li>Velas: ${DESCENT.LIVES[d.id]} ${DESCENT.LIVES[d.id] === 1 ? 'intento de más' : 'intentos de más'}</li>` : ''}</ul></button>`).join('')}</div>
      ${tutDone ? '' : `<p class="df-tut">${icon('target')} <span>¿Primera vez? El <b>tutorial guiado</b> te enseña lo esencial en unos diez minutos, sin tocar tu partida.</span> <button class="btn small" id="df-tut">Hacer el tutorial</button></p>`}
      <div class="row"><button class="btn" id="df-back">Volver</button><button class="btn primary" id="df-go">${icon('crown')} Elegir a los héroes</button></div></div>`, 'dim title-screen');
    const dt = s.querySelector('#df-tut'); if (dt) dt.onclick = () => this.startTutorial();
    let pick = 'heroe';
    U.$$('.diff-opt', s).forEach((b) => (b.onclick = () => { pick = b.dataset.d; U.$$('.diff-opt', s).forEach((q) => q.classList.toggle('sel', q === b)); audio.sfx('ui'); }));
    s.querySelector('#df-back').onclick = () => { audio.sfx('uiBack'); this.title(); };
    s.querySelector('#df-go').onclick = async () => {
      audio.sfx('ui');
      GAME.setDifficulty(pick);
      const party = await this.partyPick({ mode: desc ? 'descent' : 'campaign', diff: pick, recommend: desc ? null : CHAPTERS[0].recommend });
      if (!party) { this.difficulty(mode); return; }
      this.screen(null); await this.fadeOut(); MAIN.stopTitle();
      if (desc) { GAME.startDescent(pick, party); return; }
      GAME.newGame(pick, null, party); U.store.del(SAVE_KEY);
      await this.prologue();
      GAME.startChapter(0);
    };
  },
  pause() {
    if (GAME.state !== 'play' && GAME.state !== 'camp') return;
    audio.sfx('ui');
    if (GAME.tutorial) {
      const t = this.screen(`<div class="card pause"><div class="eyebrow">Tutorial en pausa</div><h2>${GAME.ch ? GAME.ch.title : 'Tutorial'}</h2>
        <div class="col"><button class="btn primary" id="p-back">${icon('play')} Seguir</button><button class="btn" id="p-help">${icon('scroll')} Cómo se juega</button><button class="btn" id="p-set">${icon('gear')} Ajustes</button><button class="btn" id="p-retry">${icon('rotate')} Empezar el tutorial de nuevo</button><button class="btn danger" id="p-quit">Salir del tutorial</button></div>
        <p class="small">El tutorial no toca tu partida guardada.</p></div>`, 'dim');
      t.querySelector('#p-back').onclick = () => { audio.sfx('uiBack'); this.screen(null); };
      t.querySelector('#p-help').onclick = () => this.help(() => this.pause());
      t.querySelector('#p-set').onclick = () => this.settings(() => this.pause());
      t.querySelector('#p-retry').onclick = () => { this.screen(null); TUTOR.stop(); GAME.startTutorial(); };
      t.querySelector('#p-quit').onclick = () => { audio.heartbeat(false); this.title(); };
      return;
    }
    const s = this.screen(`<div class="card pause"><div class="eyebrow">Pausa</div><h2>${GAME.ch ? GAME.ch.title : 'Umbral'}</h2>
      <div class="col"><button class="btn primary" id="p-back">${icon('play')} Seguir jugando</button><button class="btn" id="p-help">${icon('scroll')} Cómo se juega</button><button class="btn" id="p-set">${icon('gear')} Ajustes</button><button class="btn" id="p-full">${icon('fullscreen')} Pantalla completa</button>${GAME.state === 'play' && !GAME.descent ? `<button class="btn" id="p-retry">${icon('rotate')} Reiniciar capítulo</button>` : ''}<button class="btn danger" id="p-quit">Salir al inicio</button></div>
      <p class="small">${GAME.descent ? `Descenso · nivel ${GAME.descent.depth} · ${GAME.descent.lives} ${GAME.descent.lives === 1 ? 'vela' : 'velas'}. Se guarda al comenzar cada ronda.` : 'La partida se guarda al comenzar cada ronda, cada capítulo y al llegar al campamento.'}</p></div>`, 'dim');
    s.querySelector('#p-back').onclick = () => { audio.sfx('uiBack'); this.screen(null); };
    s.querySelector('#p-help').onclick = () => this.help(() => this.pause());
    s.querySelector('#p-set').onclick = () => this.settings(() => this.pause());
    const rt = s.querySelector('#p-retry');
    if (rt) rt.onclick = () => { this.screen(null); if (GAME.checkpoint) { GAME.restore(GAME.checkpoint); GAME.startChapter(GAME.checkpoint.chIdx); } };
    s.querySelector('#p-full').onclick = () => { this.screen(null); MAIN.fullscreen(); };
    s.querySelector('#p-quit').onclick = () => { audio.heartbeat(false); this.title(); };
  },
  help(back) {
    const s = this.screen(`<div class="card help"><div class="eyebrow">Cómo se juega</div><h2>Reglas del descenso</h2>
      <div class="help-grid">
        <section><h3>${icon('boot')} El turno</h3><p>Cada héroe tiene <b>movimiento</b> y <b>una acción</b>. Puedes moverte antes y después de actuar. Cuando todos terminan, actúa la Sombra.</p></section>
        <section><h3>${icon('skull')} Los dados</h3><p>Los dados ruedan sobre el tablero y un cartel dice el resultado. Cada <b>calavera</b> es un golpe. El defensor tira los suyos: los héroes paran con <b>escudos blancos</b> (2 de 6 caras) y los monstruos con <b>escudos negros</b> (1 de 6). Daño = calaveras − escudos.</p></section>
        <section><h3>${icon('crown')} El Dado del Destino</h3><p>Cada ataque de un héroe (o habilidad de ataque) lleva un dado dorado. <b>Máscara alegre</b> (2 de 6): el premio de tu héroe. Bárbaro, <b>Rebote</b>: 1 dado contra otro enemigo. Enano, <b>Empujón</b>: aparta al enemigo. Elfa, <b>Paso ligero</b>: +2 de movimiento. Hechicero, <b>Chispa</b>: una habilidad se recarga antes. Amazona, <b>¡Conmigo!</b>: un aliado cercano queda Inspirado. <b>Máscara triste</b> (1 de 6): ruido, +1 Presagio (contra un jefe, pierdes el movimiento). Cara lisa: nada.</p></section>
        <section><h3>${icon('crown')} Los cinco héroes</h3><p><b>Bárbaro</b> (pega y aguanta), <b>Enano</b> (duro, rompe escudos, abre cerraduras), <b>Elfa arquera</b> (dispara lejos, ve trampas), <b>Hechicero</b> (fuego y curación) y <b>Amazona</b> (lanza a 2 casillas y carga). Bajad de 1 a 5: con más héroes salen más enemigos.</p></section>
        <section><h3>${icon('sword')} Acciones</h3><p><b>Atacar</b> con el arma, o usar una de tus <b>dos habilidades</b> (después se recargan unas rondas). <b>Buscar</b> revela las trampas de la sala y puede dar tesoro. Abrir cofres y levantar a un caído también gasta la acción.</p></section>
        <section><h3>${icon('door')} Puertas y cerraduras</h3><p>Las salas están ocultas hasta que abres su puerta. Las cerraduras de hierro y los sellos se fuerzan tirando 3 dados: las calaveras se suman hasta abrirla. El Enano abre las cerraduras y el Hechicero los sellos sin tirar.</p></section>
        <section><h3>${icon('search')} Buscar y Presagio</h3><p>Buscar se hace una vez por sala y sin enemigos dentro, y se tira el <b>Dado del Tesoro</b>: oro (2 caras), poción, objeto, nada o peligro (un dardo, o el ruido despierta algo). El <b>Presagio</b> (ojo de arriba) crece cada ronda y con el ruido; al llenarse, algo errante sube a buscaros.</p></section>
        <section><h3>${icon('sword')} Posición</h3><p><b>Flanqueo:</b> +1 dado si otro aliado está junto a tu objetivo. Nadie te ataca por moverte: colócate con libertad.</p></section>
        <section><h3>${icon('eye')} Estados</h3><p><b>Aterrado</b> (−1 dado de ataque), <b>Envenenado</b> y <b>Ardiendo</b> (−1 PV por turno), <b>Aturdido</b> (pierde su turno), <b>Inspirado</b> (+1 dado en su próximo ataque). Los enemigos pueden <b>huir</b> si cae su líder o la mitad de su grupo.</p></section>
        <section><h3>${icon('revive')} Caer y levantarse</h3><p>Un héroe a 0 PV cae. Un aliado a su lado puede levantarle con su acción, o el Hechicero con Luz sanadora. Vuelve Herido (−1 PV máximo hasta acampar). En Pesadilla, quien cae se desangra.</p></section>
        <section><h3>${icon('armor')} Campamento</h3><p>Entre capítulos se acampa: cada héroe gana un talento, podéis cambiar quién baja, y en la tienda se compran pociones y equipo. Cada pieza va en un hueco (mano, cuerpo o extra).</p></section>
        <section><h3>${icon('stairs')} Modo Descenso</h3><p>Elige de 1 a 5 héroes y baja por mazmorras que se generan solas. Busca la <b>escalera que brilla</b> y tócala sin enemigos a la vista. Cada cuatro niveles espera un guardián y después se acampa. Al caer se apaga una <b>vela</b> y se repite el nivel.</p></section>
      </div>
      <div class="help-grid controls">
        <section><h3>Ordenador</h3><p>Clic: mover, atacar, abrir · Arrastrar: desplazar · Clic derecho y arrastrar: girar · Rueda: zoom · <kbd>1</kbd> atacar · <kbd>2</kbd> <kbd>3</kbd> habilidades · <kbd>4</kbd> buscar · <kbd>5</kbd> objetos · <kbd>Z</kbd> deshacer movimiento · <kbd>G</kbd> ficha del grupo · <kbd>Espacio</kbd> fin de turno · <kbd>Tab</kbd> siguiente héroe · <kbd>Q</kbd>/<kbd>E</kbd> girar · <kbd>WASD</kbd> mover cámara · <kbd>Esc</kbd> cancelar</p></section>
        <section><h3>Móvil</h3><p>Toca para ver qué pasará y toca otra vez para confirmar · Arrastra con un dedo para mover la cámara · Pellizca para acercar · Gira con dos dedos.</p></section>
      </div>
      <div class="row end">${GAME.state === 'title' ? `<button class="btn" id="h-tut">${icon('target')} Jugar el tutorial</button>` : ''}<button class="btn primary" id="h-back">Entendido</button></div></div>`, 'dim');
    const ht = s.querySelector('#h-tut'); if (ht) ht.onclick = () => this.startTutorial();
    s.querySelector('#h-back').onclick = () => { audio.sfx('uiBack'); back ? back() : this.screen(null); };
  },
  settings(back) {
    const S = SETTINGS;
    const sel = (id, label, opts, val) => `<label class="set-row"><span>${label}</span><select id="${id}">${opts.map(([v, t]) => `<option value="${v}" ${String(v) === String(val) ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;
    const rng = (id, label, val) => `<label class="set-row"><span>${label}</span><input type="range" id="${id}" min="0" max="1" step="0.05" value="${val}"></label>`;
    const chk = (id, label, val) => `<label class="set-row chk"><span>${label}</span><input type="checkbox" id="${id}" ${val ? 'checked' : ''}></label>`;
    const s = this.screen(`<div class="card settings"><div class="eyebrow">Ajustes</div><h2>Ajustes</h2>
      <div class="set-grid">
        <section><h3>Imagen</h3>
          ${sel('s-q', 'Calidad gráfica', [['minimo', 'Mínima (móviles muy lentos)'], ['bajo', 'Baja (móviles modestos)'], ['medio', 'Media'], ['alto', 'Alta']], S.quality)}
          ${chk('s-tilt', 'Efecto miniatura (desenfoque)', S.tilt)}
          ${chk('s-shake', 'Temblor de cámara', S.shake)}
          ${chk('s-flash', 'Destellos intensos en los sustos', S.flashes)}
        </section>
        <section><h3>Lectura</h3>
          ${sel('s-size', 'Tamaño de letra', [['normal', 'Normal'], ['grande', 'Grande'], ['enorme', 'Muy grande']], S.textSize)}
          ${chk('s-contrast', 'Alto contraste', S.contrast)}
        </section>
        <section><h3>Sonido</h3>
          ${rng('s-music', 'Música', S.music)}${rng('s-sfx', 'Efectos', S.sfx)}${rng('s-amb', 'Ambiente', S.amb)}
          ${sel('s-voice', 'Voz narrada', [['off', 'Sin voz'], ['narrador', 'Solo narrador'], ['todos', 'Todos los personajes']], S.voice)}
        </section>
        <section><h3>Juego</h3>
          ${sel('s-text', 'Velocidad del texto', [['lenta', 'Lenta'], ['normal', 'Normal'], ['rapida', 'Rápida']], S.textSpeed)}
          ${chk('s-auto', 'Avanzar diálogos solo', S.autoText)}
          ${sel('s-speed', 'Velocidad de animación', [[1, 'Normal'], [1.5, 'Rápida'], [2.2, 'Muy rápida']], S.speed)}
          ${chk('s-follow', 'La cámara sigue la acción', S.follow)}
          ${chk('s-confirm', 'Confirmar con segundo toque (táctil)', S.confirmTouch)}
          ${chk('s-qdice', 'Dados rápidos en el turno enemigo', S.quickEnemyDice)}
        </section>
      </div>
      <div class="row end"><button class="btn primary" id="s-back">Hecho</button></div></div>`, 'dim');
    const $ = (id) => s.querySelector('#' + id);
    const apply = () => {
      const q = $('s-q').value; const qChanged = q !== S.quality;
      Object.assign(S, { quality: q, tilt: $('s-tilt').checked, shake: $('s-shake').checked, flashes: $('s-flash').checked, music: +$('s-music').value, sfx: +$('s-sfx').value, amb: +$('s-amb').value, voice: $('s-voice').value, textSpeed: $('s-text').value, autoText: $('s-auto').checked, speed: +$('s-speed').value, follow: $('s-follow').checked, confirmTouch: $('s-confirm').checked, quickEnemyDice: $('s-qdice').checked, textSize: $('s-size').value, contrast: $('s-contrast').checked });
      MAIN.applySettings(qChanged);
    };
    U.$$('select,input', s).forEach((i) => i.addEventListener('change', apply));
    U.$$('input[type=range]', s).forEach((i) => i.addEventListener('input', apply));
    $('s-back').onclick = () => { audio.sfx('uiBack'); back ? back() : this.screen(null); };
  }
};
