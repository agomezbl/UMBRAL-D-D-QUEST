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
    this.$('undo-move').innerHTML = icon('rotate') + L(' Deshacer movimiento <kbd>Z</kbd>', ' Annuler le déplacement <kbd>Z</kbd>');
    this.$('undo-move').onclick = () => GAME.action('undo');
    this.$('ffwd').innerHTML = icon('ffwd') + L(' Acelerar', ' Accélérer');
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
        <span class="hc-port"><img alt="" data-port="${id}"><i class="hc-ring" style="--hc:${d.color}"></i>${i === 0 ? `<i class="hc-lan" title="${L('Lleva el farol', 'Porte la lanterne')}">${icon('flame')}</i>` : ''}</span>
        <span class="hc-body">
          <span class="hc-name">${d.name}<small>${d.role}</small></span>
          <span class="hc-hp"><span class="hc-hpbar"><i></i></span><b class="hc-hpn"></b></span>
          <span class="hc-st"><span class="st-mv" title="${L('Movimiento restante', 'Déplacement restant')}">${icon('boot')}<b></b></span><span class="st-act" title="${L('Acción', 'Action')}">${icon('hand')}</span></span>
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
      attack: mk('attack', 'sword', L('Atacar', 'Attaquer'), '1'), s0: mk('s0', 'shield', L('Habilidad', 'Compétence'), '2'), s1: mk('s1', 'radiant', L('Habilidad', 'Compétence'), '3'),
      search: mk('search', 'search', L('Buscar', 'Fouiller'), '4'), items: mk('items', 'potion', L('Objetos', 'Objets'), '5'), end: mk('end', 'hourglass', L('Fin de turno', 'Fin du tour'), '␣')
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
      c.querySelector('.hc-fx').innerHTML = Object.keys(h.status).filter((k) => STATUS[k] && h.status[k]).map((k) => `<span class="fx-chip ${STATUS[k].bad ? 'bad' : 'good'}" title="${STATUS[k].name}${L(':', ' :')} ${STATUS[k].desc}">${icon(STATUS[k].icon)}${k === 'desangrando' ? h.status[k] : ''}</span>`).join('') + (h.wounds ? `<span class="fx-chip bad" title="${L(`Herido: −${h.wounds} PV máximo hasta acampar`, `Blessé : −${h.wounds} PV max. jusqu'au campement`)}">${icon('heart')}−${h.wounds}</span>` : '');
      c.querySelector('.hc-tag').textContent = h.ko ? (h.status.desangrando ? `${L('Sin fuerzas', 'À bout de forces')} · ${h.status.desangrando}` : L('Caído', 'À terre')) : h.ended ? L('Hecho', 'Fini') : (GAME.active === h && GAME.phase === 'hero') ? L('En turno', 'Son tour') : '';
    });
    // acciones
    const h = GAME.active, can = h && GAME.phase === 'hero' && !GAME.busy;
    if (h) {
      h.skills.forEach((s, i) => {
        const b = this.btn['s' + i];
        b.querySelector('.act-ic').innerHTML = icon(s.icon); b.querySelector('.act-lb').textContent = s.name;
        const si = GAME.skillInfo(h, s);
        b.title = `${s.name}${L(':', ' :')} ${si.text}`;
        const cd = b.querySelector('.act-cd');
        cd.textContent = s.cd > 0 ? s.cd : ''; b.classList.toggle('cooling', s.cd > 0); b.classList.toggle('free', !!s.free);
        const why = GAME.skillBlock(h, s);
        b.disabled = !can; b.classList.toggle('blocked', !!why);
        if (why) b.title = `${s.name}${L(':', ' :')} ${why}`;
        b.classList.toggle('mode', !!(GAME.mode && GAME.mode.key === 's' + i));
      });
      this.btn.attack.querySelector('.act-ic').innerHTML = icon(h.basic.icon);
      this.btn.attack.querySelector('.act-lb').textContent = h.basic.name;
      this.btn.attack.title = L(`${h.basic.name}: ${h.atk} dados (${HERO_DEFS[h.id].weapon})${h.range > 1 ? `, alcance ${h.range}` : ''}.`, `${h.basic.name} : ${h.atk} dé${h.atk > 1 ? 's' : ''} (${HERO_DEFS[h.id].weapon})${h.range > 1 ? `, portée ${h.range}` : ''}.`);
      this.btn.attack.disabled = !can; this.btn.attack.classList.toggle('blocked', h.actions <= 0);
      this.btn.attack.classList.toggle('mode', !!(GAME.mode && GAME.mode.key === 'attack'));
      const sb = GAME.searchBlock(h);
      this.btn.search.disabled = !can; this.btn.search.classList.toggle('blocked', !!sb);
      this.btn.search.title = sb || L('Buscar: revela las trampas de la sala y quizá encuentra tesoro. Una vez por sala; hace ruido (+1 Presagio).', 'Fouiller : révèle les pièges de la salle et trouve peut-être un trésor. Une fois par salle ; fait du bruit (+1 Présage).');
      this.btn.items.disabled = !can;
      this.btn.end.disabled = !can;
      this.btn.end.classList.toggle('pulse', can && h.mvLeft <= 0 && h.actions <= 0);
    } else Object.values(this.btn).forEach((b) => (b.disabled = true));
    this.$('actions').classList.toggle('targeting', !!GAME.mode);
    this.$('cancel-mode').hidden = !GAME.mode;
    this.$('undo-move').hidden = !(GAME.undo && GAME.active === GAME.undo.h && !GAME.busy && GAME.phase === 'hero');
    const dm = this.$('r-doom'); if (dm) { const mx = GAME.doomMax(); dm.innerHTML = `${icon('eye')}<span class="doom-bar">${Array.from({ length: mx }, (_, i) => `<i class="${i < GAME.doom ? 'on' : ''}"></i>`).join('')}</span>`; dm.title = L(`Presagio ${GAME.doom}/${mx}: crece cada ronda y con el ruido. Al llenarse, algo errante sube a buscaros.`, `Présage ${GAME.doom}/${mx} : il grandit à chaque manche et avec le bruit. Quand il est plein, une créature errante monte vous chercher.`); dm.classList.toggle('warn', GAME.doom >= mx - 1); }
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
    if (d.atk) dice = `<div class="pv-dice"><span class="pv-a">${'<i class="dd skull"></i>'.repeat(Math.min(d.atk, 8))}</span><em>${L('contra', 'contre')}</em><span class="pv-d">${'<i class="dd bshield"></i>'.repeat(Math.min(d.def, 8))}</span></div>`;
    const u = d.unit;
    let stats = '';
    if (u && u.side === 'enemy') {
      const tr = (u.T.traits || []).concat(u.champion ? ['campeon'] : []).map((k) => ETRAITS[k]).filter(Boolean);
      const st = Object.keys(u.status).filter((k) => STATUS[k] && u.status[k]).map((k) => STATUS[k].name);
      stats = `<div class="pv-stats"><span class="hp-pips">${Array.from({ length: u.maxHp }, (_, i) => `<i class="${i < u.hp ? 'on' : ''}"></i>`).join('')}</span><span title="${L('Dados de ataque', "Dés d'attaque")}">${icon('sword')}${u.atk}</span><span title="${L('Dados de defensa', 'Dés de défense')}">${icon('shield')}${u.def}</span><span title="${L('Movimiento', 'Déplacement')}">${icon('boot')}${u.mv}</span>${u.ranged ? `<span title="${L('Alcance', 'Portée')}">${icon('bow')}${u.range}</span>` : ''}</div>
        <div class="pv-virt"><span class="pv-iq" title="${L('Cómo piensa (según la criatura y la dificultad)', 'Sa façon de penser (selon la créature et la difficulté)')}">${GAME.iqLabel(u)} · ${(ROLES[u.role] || '').split(' · ')[0]}</span></div>
        ${tr.length || st.length ? `<div class="pv-traits">${tr.map((t) => `<span title="${U.esc(t.desc)}">${U.esc(t.name)}</span>`).join('')}${st.map((t) => `<span class="bad">${U.esc(t)}</span>`).join('')}</div>` : ''}`;
    } else if (u && u.side === 'hero' && d.kind === 'self') {
      stats = `<div class="pv-stats">${this.statLine({ hp: `${u.hp}/${u.maxHp}`, atk: u.atk, def: u.def, mv: u.mv, range: u.range })}</div>`;
    }
    const mods = d.mods && d.mods.length ? `<div class="pv-mods">${d.mods.map(([t, v]) => `<span class="${v > 0 ? 'up' : 'down'}">${v > 0 ? '+' : ''}${v} ${U.esc(t)}</span>`).join('')}</div>` : '';
    const sub = d.sub ? d.sub.replace(/ \(.*?\) (contra|contre)/, ' $1') : '';
    p.innerHTML = `<b>${U.esc(d.text)}</b>${sub ? `<small>${U.esc(sub)}</small>` : ''}${mods}${stats}${dice}${confirm ? `<span class="pv-confirm">${L('Toca otra vez para confirmar', 'Touche encore pour confirmer')}</span>` : ''}`;
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
  renderChronicle() { this.$('chronicle-list').innerHTML = this.logs.slice().reverse().map((l) => `<div class="lg ${l.kind}"><em>${L('R', 'M')}${l.r}</em> ${l.html}</div>`).join(''); },

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
    // PEGI 7: sustos suaves por defecto (sin rojo, sin chirrido) y opción «Sin sustos»
    if (SETTINGS.scares === 'ninguno') { audio.sfx('whisper', { dur: 1, vol: 0.4 }); await U.sleep(400); return; }
    s.className = 'scare ' + (kind || 'flash');
    s.hidden = false; void s.offsetWidth; s.classList.add('go');
    audio.sfx('scare');
    ENGINE.fx.flash = SETTINGS.flashes ? 0.25 : 0.08; ENGINE.shake(0.45);
    await U.sleep(kind === 'eyes' ? 1900 : 800);
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
    const s = this.screen(`<div class="chap"><div class="chap-num">${ch.eyebrow || `${L('Capítulo', 'Chapitre')} ${ch.num}`}</div><h1 class="chap-title">${ch.title}</h1><div class="chap-sub">${ch.subtitle}</div><div class="chap-rule"></div></div>`, 'chapter-card');
    audio.stinger('chapter');
    s.querySelector('.chap').classList.add('in');
    await new Promise((r) => { const t = setTimeout(r, 3400); s.onclick = () => { clearTimeout(t); r(); }; });
    this.screen(null);
    this.$('fade').classList.remove('on');
  },
  locationCard(t) {
    const b = this.$('banner'); b.className = 'banner place'; b.innerHTML = `<div class="bn-t">${U.esc(t)}</div><div class="bn-s">${L('Campamento', 'Campement')}</div>`;
    void b.offsetWidth; b.classList.add('show'); setTimeout(() => b.classList.remove('show'), 2600);
  },
  victoryCard(ch, st) {
    return new Promise((resolve) => {
      const mins = Math.max(1, Math.round((Date.now() - st.start) / 60000));
      const s = this.screen(`<div class="card victory">
        <div class="eyebrow">${L(`Capítulo ${ch.num} superado`, `Chapitre ${ch.num} accompli`)}</div>
        <h2>${ch.subtitle}</h2>
        <p class="lead">${L('El farol pesa un poco más. Y brilla un poco distinto.', 'La lanterne pèse un peu plus lourd. Et elle ne brille plus tout à fait pareil.')}</p>
        <dl class="stats"><div><dt>${L('Criaturas abatidas', 'Créatures vaincues')}</dt><dd>${st.kills}</dd></div><div><dt>${L('Oro reunido', 'Or amassé')}</dt><dd>${st.gold}</dd></div><div><dt>${L('Rondas', 'Manches')}</dt><dd>${st.rounds}</dd></div><div><dt>${L('Caídas', 'Chutes')}</dt><dd>${st.falls}</dd></div><div><dt>${L('Escritos leídos', 'Écrits lus')}</dt><dd>${st.notes}</dd></div><div><dt>${L('Minutos', 'Minutes')}</dt><dd>${mins}</dd></div></dl>
        <button class="btn primary" id="v-go">${icon('flame')} ${L('Acampar y descansar', 'Camper et se reposer')}</button></div>`, 'dim');
      s.querySelector('#v-go').onclick = () => { audio.sfx('ui'); this.screen(null); resolve(); };
    });
  },
  defeatCard(dead, o = {}) {
    return new Promise((resolve) => {
      this.showHUD(false);
      const candles = o.descent ? `<div class="candles" aria-label="${L(`${o.lives} velas`, `${o.lives} bougie${o.lives > 1 ? 's' : ''}`)}">${Array.from({ length: Math.max(o.lives + 1, 1) }, (_, i) => `<i class="${i < o.lives ? 'on' : 'out'}">${icon('flame')}</i>`).join('')}</div>` : '';
      const s = this.screen(`<div class="card defeat"><div class="eyebrow">${o.descent ? L(`Descenso · nivel ${o.depth}`, `Descente · niveau ${o.depth}`) : L('Fin del camino', 'Fin du chemin')}</div><h2>${o.descent ? L('Una vela se apaga', "Une bougie s'éteint") : dead ? L(`${U.esc(dead.name)} no puede seguir`, `${U.esc(dead.name)} ne peut plus continuer`) : L('Las sombras os reclaman', 'Les ombres vous réclament')}</h2>
        ${candles}
        <p class="lead">${o.descent ? L(`${dead ? `${U.esc(dead.name)} no ha podido levantarse a tiempo. ` : ''}Os ${o.lives === 1 ? 'queda una vela' : `quedan ${o.lives} velas`}: podéis repetir este nivel desde su comienzo, tal como lo encontrasteis.`, `${dead ? `${U.esc(dead.name)} n'a pas pu se relever. ` : ''}Il vous reste ${o.lives === 1 ? 'une bougie' : `${o.lives} bougie${o.lives > 1 ? 's' : ''}`} : vous pouvez rejouer ce niveau depuis le début, tel que vous l'avez trouvé.`) : dead ? L('Nadie llegó a tiempo para ayudarle. El grupo se retira a recuperar fuerzas y lo intentará de nuevo.', "Personne n'est arrivé à temps pour l'aider. Le groupe se replie pour reprendre des forces et retentera sa chance.") : L('El farol rueda por el suelo de piedra. El grupo se retira a la escalera para recuperar fuerzas.', "La lanterne roule sur les dalles. Le groupe se replie vers l'escalier pour reprendre des forces.")}</p>
        <div class="row"><button class="btn primary" id="d-retry">${icon('rotate')} ${o.descent ? L('Repetir el nivel', 'Rejouer le niveau') : L('Reintentar el capítulo', 'Retenter le chapitre')}</button><button class="btn" id="d-menu">${o.descent ? L('Salir (se guarda)', 'Quitter (sauvegardé)') : L('Volver al inicio', "Retour à l'accueil")}</button></div></div>`, 'dim red');
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
        s.querySelector('.shop-haggle').innerHTML = disc ? `${icon('crown')} ${L(`Con el Sello de la Orden os rebajan un ${Math.round(disc * 100)} % en todo.`, `Grâce au Sceau de l'Ordre, on vous fait ${Math.round(disc * 100)} % de remise sur tout.`)}` : '';
        // lo que lleva cada héroe
        s.querySelector('.shop-kit').innerHTML = party.map((id) => `<div class="kit-h" style="--hc:${HERO_DEFS[id].color}">${port(id)}<b>${HERO_DEFS[id].name}</b>${Object.keys(SLOTS).map((sl) => { const it = GAME.gearOf(id).find((g) => g.slot === sl); return `<span class="kit-slot ${it ? 'on' : ''}"><em>${SLOTS[sl]}</em>${it ? U.esc(it.name) : '—'}</span>`; }).join('')}</div>`).join('') +
          (GAME.stash.length ? `<div class="kit-h stash">${icon('chest')}<b>${L('Arcón', 'Malle')}</b><span class="kit-slot on">${GAME.stash.map((k) => U.esc(GAME.gearDef(k).name)).join(' · ')}</span></div>` : '');
        const cons = (it) => {
          const cost = Math.round(it.cost * (1 - disc)), full = it.max && GAME.items[it.id] >= it.max, can = GAME.gold >= cost && !full;
          return `<div class="shop-item"><span class="si-ic">${icon(it.icon)}</span><span class="si-t"><b>${it.name}</b><small>${it.desc}</small></span>
            <span class="si-buy"><em>${full ? L(`Mochila llena (${it.max})`, `Sac plein (${it.max})`) : L(`Tenéis ${GAME.items[it.id]}${it.max ? ` de ${it.max}` : ''}`, `Vous en avez ${GAME.items[it.id]}${it.max ? ` sur ${it.max}` : ''}`)}</em><button class="btn small" data-buy="${it.id}" ${can ? '' : 'disabled'}>${icon('coin')} ${cost}${cost < it.cost ? ` <s>${it.cost}</s>` : ''}</button></span></div>`;
        };
        const gearRow = (it) => {
          const owner = GAME.ownerOf(it.id), cost = GAME.gearPrice(it);
          const who = (it.who || party).filter((id) => party.includes(id));
          const btns = who.map((id) => {
            const why = GAME.gearBlock(id, it), here = GAME.hasGear(id, it.id);
            const off = here || why || (!owner && GAME.gold < cost);
            const title = here ? L(`Lo lleva ${HERO_DEFS[id].name}`, `Porté par ${HERO_DEFS[id].name}`) : why || (!owner && GAME.gold < cost ? L('No os llega el oro', "Pas assez d'or") : owner ? L(`Dárselo a ${HERO_DEFS[id].name}`, `Le donner à ${HERO_DEFS[id].name}`) : L(`Comprar para ${HERO_DEFS[id].name}`, `Acheter pour ${HERO_DEFS[id].name}`));
            return `<button class="gear-to ${here ? 'here' : ''}" data-gear="${it.id}" data-to="${id}" ${off ? 'disabled' : ''} title="${U.esc(title)}" aria-label="${U.esc(title)}" style="--hc:${HERO_DEFS[id].color}">${port(id)}</button>`;
          }).join('');
          const state = owner === 'stash' ? L('En el arcón: elige quién lo lleva', 'Dans la malle : choisis qui le porte') : owner ? L(`Lo lleva ${HERO_DEFS[owner].name}`, `Porté par ${HERO_DEFS[owner].name}`) : `${icon('coin')} ${cost}${cost < it.cost ? ` <s>${it.cost}</s>` : ''} · ${L('elige quién lo lleva', 'choisis qui le porte')}`;
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
        s.querySelector('.shop-ups').innerHTML = `${relics.length ? `<h4>${L('Reliquias del grupo', 'Reliques du groupe')}</h4>${relics.map(gearRow).join('')}` : ''}<h4>${L('Equipo de la Orden', "Équipement de l'Ordre")}</h4>${common.map(gearRow).join('')}${found.length ? `<h4>${L('Hallazgos', 'Trouvailles')}</h4>${found.map(gearRow).join('')}` : ''}`;
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
      const s = this.screen(`<div class="card shop"><div class="shop-head"><div><div class="eyebrow">${L('Arcón de la Orden', "Malle de l'Ordre")}</div><h2>${L('Antes de descender', 'Avant de descendre')}</h2></div><div class="shop-gold">${icon('coin')}<b></b><span>${L('monedas', 'pièces')}</span></div></div>
        <p class="lead">${L('Las hermanas del Archivo dejaron provisiones y equipo en el rellano. Cada pieza va en un hueco (mano, cuerpo o extra) y no todos los héroes pueden llevarlo todo.', "Les sœurs des Archives ont laissé des provisions et de l'équipement sur le palier. Chaque pièce occupe un emplacement (main, corps ou extra), et tous les héros ne peuvent pas tout porter.")}</p>
        <p class="shop-haggle"></p>
        <div class="shop-kit"></div>
        <div class="shop-grid"><section><h3>${L('Provisiones', 'Provisions')}</h3><div class="shop-cons"></div></section><section><h3>${L('Armería', 'Armurerie')}</h3><div class="shop-ups"></div></section></div>
        <div class="row end"><button class="btn primary" id="shop-go">${icon('play')} ${L('Descender', 'Descendre')}</button></div></div>`, 'dim shop-screen');
      render();
      s.querySelector('#shop-go').onclick = () => { audio.sfx('ui'); this.screen(null); resolve(); };
    });
  },
  ending(ep, st) {
    return new Promise(async (resolve) => {
      this.showHUD(false);
      await this.fadeOut();
      const s = this.screen(`<div class="prologue ending"><div class="pl-line"></div><button class="btn ghost pl-skip">${L('Saltar', 'Passer')}</button></div>`, 'black');
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
      const s2 = this.screen(`<div class="card final"><div class="eyebrow">${L('Fin', 'Fin')}</div><h2 class="display">${ep.title}</h2>
        <p class="lead">${GAME.flags.broke === false ? L('Hay finales que se pagan con alguien que se queda atrás.', "Il y a des fins qui se paient de quelqu'un qu'on laisse derrière soi.") : L('Rompisteis la luz que os mentía. Aldmere vuelve a tener una llama propia.', 'Vous avez brisé la lumière qui vous mentait. Aldmere a de nouveau sa propre flamme.')}</p>
        <dl class="stats"><div><dt>${L('Criaturas abatidas', 'Créatures vaincues')}</dt><dd>${st.kills}</dd></div><div><dt>${L('Oro reunido', 'Or amassé')}</dt><dd>${st.gold}</dd></div><div><dt>${L('Rondas jugadas', 'Manches jouées')}</dt><dd>${st.rounds}</dd></div><div><dt>${L('Caídas', 'Chutes')}</dt><dd>${st.falls}</dd></div><div><dt>${L('Escritos leídos', 'Écrits lus')}</dt><dd>${st.notes}</dd></div><div><dt>${L('Minutos', 'Minutes')}</dt><dd>${mins}</dd></div></dl>
        <p class="small">${GAME.flags.broke === false ? L(`Existe otro final. Quizá la próxima vez ${U.esc(GAME.fmt('{lider}'))} no dude.`, `Il existe une autre fin. Peut-être que la prochaine fois, ${U.esc(GAME.fmt('{lider}'))} n'hésitera pas.`) : L('Existe otro final, más amargo. Solo se alcanza dudando.', "Il existe une autre fin, plus amère. On ne l'atteint qu'en hésitant.")}</p>
        <button class="btn primary" id="e-go">${L('Volver al inicio', "Retour à l'accueil")}</button></div>`, 'dim');
      s2.querySelector('#e-go').onclick = () => { audio.sfx('ui'); this.screen(null); resolve(); };
    });
  },
  prologue() {
    return new Promise(async (resolve) => {
      const s = this.screen(`<div class="prologue"><div class="pl-line"></div><div class="pl-tap">${L('Toca para continuar', 'Touche pour continuer')}</div><button class="btn ghost pl-skip">${L('Saltar prólogo', 'Passer le prologue')}</button></div>`, 'black');
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
      <div class="tt-top"><div class="tt-eyebrow">${L('Crónicas de la Última Llama', 'Chroniques de la Dernière Flamme')}</div>
      <h1 class="tt-name" aria-label="Umbral">UMBRAL</h1>
      <p class="tt-tag">${L('Cinco héroes. Tres sellos. Un farol que no debería brillar.', 'Cinq héros. Trois sceaux. Une lanterne qui ne devrait pas briller.')}</p></div>
      <nav class="tt-menu">
        ${save ? `<button class="btn primary" id="t-cont">${icon('play')} ${L('Continuar', 'Continuer')} <small>${L('Capítulo', 'Chapitre')} ${CHAPTERS[save.chIdx] ? CHAPTERS[save.chIdx].num : ''}${save.stage === 'camp' ? L(' · campamento', ' · campement') : save.stage === 'round' && save.run ? L(` · ronda ${save.run.round}`, ` · manche ${save.run.round}`) : ''}</small></button>` : ''}
        <button class="btn ${save ? '' : 'primary'}" id="t-new">${icon('flame')} ${L('Nueva partida', 'Nouvelle partie')} <small>${L('Campaña · tres capítulos', 'Campagne · trois chapitres')}</small></button>
        ${dsave ? `<button class="btn" id="t-dcont">${icon('stairs')} ${L('Seguir bajando', 'Reprendre la descente')} <small>${L('Nivel', 'Niveau')} ${dsave.descent.depth}${dsave.stage === 'dcamp' ? L(' · campamento', ' · campement') : dsave.stage === 'round' && dsave.run ? L(` · ronda ${dsave.run.round}`, ` · manche ${dsave.run.round}`) : ''} · ${dsave.descent.lives} ${L(dsave.descent.lives === 1 ? 'vela' : 'velas', dsave.descent.lives > 1 ? 'bougies' : 'bougie')}</small></button>` : ''}
        <button class="btn" id="t-desc">${icon('stairs')} ${L('Modo Descenso', 'Mode Descente')} <small>${dbest ? L(`Récord: nivel ${dbest.depth}`, `Record : niveau ${dbest.depth}`) : L('Mazmorras sin fin · de 1 a 5 héroes', 'Donjons sans fin · de 1 à 5 héros')}</small></button>
        <button class="btn ${tutDone ? '' : 'recommend'}" id="t-tut">${icon('target')} ${L('Tutorial guiado', 'Tutoriel guidé')} <small>${tutDone ? L('unos 10 min', 'environ 10 min') : L('Recomendado · 10 min', 'Conseillé · 10 min')}</small></button>
        <button class="btn" id="t-help">${icon('scroll')} ${L('Cómo se juega', 'Comment jouer')}</button>
        <button class="btn" id="t-set">${icon('gear')} ${L('Ajustes', 'Réglages')}</button>
      </nav>
      <div class="tt-lang" role="group" aria-label="${L('Idioma', 'Langue')}">${Object.keys(LANGS).map((k) => `<button class="${k === LANG ? 'on' : ''}" data-lang="${k}" lang="${k}" title="${LANGS[k]}" aria-pressed="${k === LANG}">${k.toUpperCase()}</button>`).join('')}</div>
      <div class="tt-foot">${L('Táctica por turnos con dados de calavera y escudo · Ratón, teclado o pantalla táctil', 'Tactique au tour par tour avec dés crânes et boucliers · Souris, clavier ou écran tactile')}</div></div>`, 'title-screen');
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
    U.$$('[data-lang]', s).forEach((b) => (b.onclick = () => { audio.init(); audio.sfx('ui'); setLang(b.dataset.lang); }));
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
    const s = this.screen(`<div class="card diff"><div class="eyebrow">${desc ? L('Modo Descenso', 'Mode Descente') : L('Nueva partida', 'Nouvelle partie')}</div><h2>${L('¿Cuánta oscuridad soportáis?', 'Quelle dose de ténèbres oserez-vous affronter ?')}</h2>
      <div class="diff-opts">${opts.map((d) => `<button class="diff-opt ${d.id === 'heroe' ? 'sel' : ''}" data-d="${d.id}"><b>${d.name}</b><small>${d.blurb}</small>
        <ul class="diff-list"><li>${L('La Sombra:', "L'Ombre :")} ${d.iq < 0 ? L('torpe', 'maladroite') : d.iq > 0 ? L('más astuta', 'plus rusée') : L('piensa según cada criatura', 'pense selon chaque créature')}</li><li>${L('Caer:', 'Tomber :')} ${d.fall === 'auto' ? L('te levantas solo', 'tu te relèves sans aide') : d.fall === 'bleed' ? L(`te quedas sin fuerzas (${d.bleed} rondas)`, `tu es à bout de forces (${d.bleed} manche${d.bleed > 1 ? 's' : ''})`) : L('un aliado te levanta, quedas herido', 'un allié te relève, tu gardes une blessure')}</li><li>${L(`Presagio: ${d.doom} marcas`, `Présage : ${d.doom} marque${d.doom > 1 ? 's' : ''}`)}</li>${d.champions ? `<li>${L('Campeones entre los enemigos', 'Des champions parmi les ennemis')}</li>` : ''}${desc ? `<li>${L(`Velas: ${DESCENT.LIVES[d.id]} ${DESCENT.LIVES[d.id] === 1 ? 'intento de más' : 'intentos de más'}`, `Bougies : ${DESCENT.LIVES[d.id]} essai${DESCENT.LIVES[d.id] > 1 ? 's' : ''} de plus`)}</li>` : ''}</ul></button>`).join('')}</div>
      ${tutDone ? '' : `<p class="df-tut">${icon('target')} <span>${L('¿Primera vez? El <b>tutorial guiado</b> te enseña lo esencial en unos diez minutos, sin tocar tu partida.', "Première fois ? Le <b>tutoriel guidé</b> t'apprend l'essentiel en une dizaine de minutes, sans toucher à ta partie.")}</span> <button class="btn small" id="df-tut">${L('Hacer el tutorial', 'Faire le tutoriel')}</button></p>`}
      <div class="row"><button class="btn" id="df-back">${L('Volver', 'Retour')}</button><button class="btn primary" id="df-go">${icon('crown')} ${L('Elegir a los héroes', 'Choisir les héros')}</button></div></div>`, 'dim title-screen');
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
      const t = this.screen(`<div class="card pause"><div class="eyebrow">${L('Tutorial en pausa', 'Tutoriel en pause')}</div><h2>${GAME.ch ? GAME.ch.title : L('Tutorial', 'Tutoriel')}</h2>
        <div class="col"><button class="btn primary" id="p-back">${icon('play')} ${L('Seguir', 'Reprendre')}</button><button class="btn" id="p-help">${icon('scroll')} ${L('Cómo se juega', 'Comment jouer')}</button><button class="btn" id="p-set">${icon('gear')} ${L('Ajustes', 'Réglages')}</button><button class="btn" id="p-retry">${icon('rotate')} ${L('Empezar el tutorial de nuevo', 'Recommencer le tutoriel')}</button><button class="btn danger" id="p-quit">${L('Salir del tutorial', 'Quitter le tutoriel')}</button></div>
        <p class="small">${L('El tutorial no toca tu partida guardada.', 'Le tutoriel ne touche pas à ta partie sauvegardée.')}</p></div>`, 'dim');
      t.querySelector('#p-back').onclick = () => { audio.sfx('uiBack'); this.screen(null); };
      t.querySelector('#p-help').onclick = () => this.help(() => this.pause());
      t.querySelector('#p-set').onclick = () => this.settings(() => this.pause());
      t.querySelector('#p-retry').onclick = () => { this.screen(null); TUTOR.stop(); GAME.startTutorial(); };
      t.querySelector('#p-quit').onclick = () => { audio.heartbeat(false); this.title(); };
      return;
    }
    const s = this.screen(`<div class="card pause"><div class="eyebrow">${L('Pausa', 'Pause')}</div><h2>${GAME.ch ? GAME.ch.title : 'Umbral'}</h2>
      <div class="col"><button class="btn primary" id="p-back">${icon('play')} ${L('Seguir jugando', 'Reprendre la partie')}</button><button class="btn" id="p-help">${icon('scroll')} ${L('Cómo se juega', 'Comment jouer')}</button><button class="btn" id="p-set">${icon('gear')} ${L('Ajustes', 'Réglages')}</button><button class="btn" id="p-full">${icon('fullscreen')} ${L('Pantalla completa', 'Plein écran')}</button>${GAME.state === 'play' && !GAME.descent ? `<button class="btn" id="p-retry">${icon('rotate')} ${L('Reiniciar capítulo', 'Recommencer le chapitre')}</button>` : ''}<button class="btn danger" id="p-quit">${L('Salir al inicio', "Retour à l'accueil")}</button></div>
      <p class="small">${GAME.descent ? L(`Descenso · nivel ${GAME.descent.depth} · ${GAME.descent.lives} ${GAME.descent.lives === 1 ? 'vela' : 'velas'}. Se guarda al comenzar cada ronda.`, `Descente · niveau ${GAME.descent.depth} · ${GAME.descent.lives} bougie${GAME.descent.lives > 1 ? 's' : ''}. Sauvegarde au début de chaque manche.`) : L('La partida se guarda al comenzar cada ronda, cada capítulo y al llegar al campamento.', "La partie est sauvegardée au début de chaque manche, de chaque chapitre et à l'arrivée au campement.")}</p></div>`, 'dim');
    s.querySelector('#p-back').onclick = () => { audio.sfx('uiBack'); this.screen(null); };
    s.querySelector('#p-help').onclick = () => this.help(() => this.pause());
    s.querySelector('#p-set').onclick = () => this.settings(() => this.pause());
    const rt = s.querySelector('#p-retry');
    if (rt) rt.onclick = () => { this.screen(null); if (GAME.checkpoint) { GAME.restore(GAME.checkpoint); GAME.startChapter(GAME.checkpoint.chIdx); } };
    s.querySelector('#p-full').onclick = () => { this.screen(null); MAIN.fullscreen(); };
    s.querySelector('#p-quit').onclick = () => { audio.heartbeat(false); this.title(); };
  },
  help(back) {
    const s = this.screen(`<div class="card help"><div class="eyebrow">${L('Cómo se juega', 'Comment jouer')}</div><h2>${L('Reglas del descenso', 'Règles de la descente')}</h2>
      <div class="help-grid">
        <section><h3>${icon('boot')} ${L('El turno', `Le tour`)}</h3><p>${L('Cada héroe tiene <b>movimiento</b> y <b>una acción</b>. Puedes moverte antes y después de actuar. Cuando todos terminan, actúa la Sombra.', `Chaque héros a du <b>déplacement</b> et <b>une action</b>. Tu peux te déplacer avant et après avoir agi. Quand tous ont fini, c'est au tour de l'Ombre.`)}</p></section>
        <section><h3>${icon('skull')} ${L('Los dados', `Les dés`)}</h3><p>${L('Los dados ruedan sobre el tablero y un cartel dice el resultado. Cada <b>calavera</b> es un golpe. El defensor tira los suyos: los héroes paran con <b>escudos blancos</b> (2 de 6 caras) y los monstruos con <b>escudos negros</b> (1 de 6). Daño = calaveras − escudos.', `Les dés roulent sur le plateau et un panneau annonce le résultat. Chaque <b>crâne</b> est un coup. Le défenseur lance les siens : les héros parent avec les <b>boucliers blancs</b> (2 faces sur 6) et les monstres avec les <b>boucliers noirs</b> (1 sur 6). Dégâts = crânes − boucliers.`)}</p></section>
        <section><h3>${icon('crown')} ${L('El Dado del Destino', `Le Dé du Destin`)}</h3><p>${L('Cada ataque de un héroe (o habilidad de ataque) lleva un dado dorado. <b>Máscara alegre</b> (2 de 6): el premio de tu héroe. Bárbaro, <b>Rebote</b>: 1 dado contra otro enemigo. Enano, <b>Empujón</b>: aparta al enemigo. Elfa, <b>Paso ligero</b>: +2 de movimiento. Hechicero, <b>Chispa</b>: una habilidad se recarga antes. Amazona, <b>¡Conmigo!</b>: un aliado cercano queda Inspirado. <b>Máscara triste</b> (1 de 6): ruido, +1 Presagio (contra un jefe, pierdes el movimiento). Cara lisa: nada.', `Chaque attaque d'un héros (ou compétence d'attaque) ajoute un dé doré. <b>Masque joyeux</b> (2 sur 6) : la récompense de ton héros. Barbare, <b>Ricochet</b> : 1 dé contre un autre ennemi. Nain, <b>Bousculade</b> : repousse l'ennemi. Elfe, <b>Pas léger</b> : +2 de déplacement. Enchanteur, <b>Étincelle</b> : une compétence se recharge plus tôt. Amazone, <b>Avec moi !</b> : un allié proche devient Inspiré. <b>Masque triste</b> (1 sur 6) : du bruit, +1 Présage (contre un chef, tu perds ton déplacement). Face vierge : rien.`)}</p></section>
        <section><h3>${icon('crown')} ${L('Los cinco héroes', `Les cinq héros`)}</h3><p>${L('<b>Bárbaro</b> (pega y aguanta), <b>Enano</b> (duro, rompe escudos, abre cerraduras), <b>Elfa arquera</b> (dispara lejos, ve trampas), <b>Hechicero</b> (fuego y curación) y <b>Amazona</b> (lanza a 2 casillas y carga). Bajad de 1 a 5: con más héroes salen más enemigos.', `<b>Barbare</b> (frappe fort et encaisse), <b>Nain</b> (solide, brise les boucliers, ouvre les serrures), <b>Elfe archère</b> (tire de loin, repère les pièges), <b>Enchanteur</b> (feu et soins) et <b>Amazone</b> (lance à 2 cases et charge). Descendez de 1 à 5 : plus il y a de héros, plus il y a d'ennemis.`)}</p></section>
        <section><h3>${icon('sword')} ${L('Acciones', `Actions`)}</h3><p>${L('<b>Atacar</b> con el arma, o usar una de tus <b>dos habilidades</b> (después se recargan unas rondas). <b>Buscar</b> revela las trampas de la sala y puede dar tesoro. Abrir cofres y levantar a un caído también gasta la acción.', `<b>Attaquer</b> avec ton arme, ou utiliser l'une de tes <b>deux compétences</b> (elles se rechargent ensuite pendant quelques manches). <b>Fouiller</b> révèle les pièges de la salle et peut rapporter un trésor. Ouvrir un coffre ou relever un héros à terre utilise aussi l'action.`)}</p></section>
        <section><h3>${icon('door')} ${L('Puertas y cerraduras', `Portes et serrures`)}</h3><p>${L('Las salas están ocultas hasta que abres su puerta. Las cerraduras de hierro y los sellos se fuerzan tirando 3 dados: las calaveras se suman hasta abrirla. El Enano abre las cerraduras y el Hechicero los sellos sin tirar.', `Les salles restent cachées tant que tu n'as pas ouvert leur porte. Les serrures de fer et les sceaux se forcent en lançant 3 dés : les crânes s'additionnent jusqu'à l'ouverture. Le Nain ouvre les serrures et l'Enchanteur les sceaux sans lancer de dés.`)}</p></section>
        <section><h3>${icon('search')} ${L('Buscar y Presagio', `Fouille et Présage`)}</h3><p>${L('Buscar se hace una vez por sala y sin enemigos dentro, y se tira el <b>Dado del Tesoro</b>: oro (2 caras), poción, objeto, nada o peligro (un dardo, o el ruido despierta algo). El <b>Presagio</b> (ojo de arriba) crece cada ronda y con el ruido; al llenarse, algo errante sube a buscaros.', `On fouille une fois par salle, sans ennemi à l'intérieur, en lançant le <b>Dé du Trésor</b> : or (2 faces), potion, objet, rien ou danger (une fléchette, ou le bruit réveille quelque chose). Le <b>Présage</b> (l'œil en haut) grandit à chaque manche et avec le bruit ; quand il est plein, une créature errante monte vous chercher.`)}</p></section>
        <section><h3>${icon('sword')} ${L('Posición', `Position`)}</h3><p>${L('<b>Flanqueo:</b> +1 dado si otro aliado está junto a tu objetivo. Nadie te ataca por moverte: colócate con libertad.', `<b>Prise de flanc :</b> +1 dé si un autre allié est à côté de ta cible. Personne ne t'attaque parce que tu te déplaces : place-toi librement.`)}</p></section>
        <section><h3>${icon('eye')} ${L('Estados', `États`)}</h3><p>${L('<b>Asustado</b> (−1 dado de ataque), <b>Envenenado</b> y <b>Ardiendo</b> (−1 PV por turno), <b>Aturdido</b> (pierde su turno), <b>Inspirado</b> (+1 dado en su próximo ataque). Los enemigos pueden <b>huir</b> si cae su líder o la mitad de su grupo.', `<b>Effrayé</b> (−1 dé d'attaque), <b>Empoisonné</b> et <b>En feu</b> (−1 PV par tour), <b>Étourdi</b> (passe son tour), <b>Inspiré</b> (+1 dé à sa prochaine attaque). Les ennemis peuvent <b>prendre la fuite</b> si leur chef tombe, ou la moitié de leur groupe.`)}</p></section>
        <section><h3>${icon('revive')} ${L('Caer y levantarse', `Tomber et se relever`)}</h3><p>${L('Un héroe a 0 PV cae. Un aliado a su lado puede levantarle con su acción, o el Hechicero con Luz sanadora. Vuelve Herido (−1 PV máximo hasta acampar). En Pesadilla, quien cae se queda sin fuerzas y hay que levantarle a tiempo.', `Un héros à 0 PV tombe à terre. Un allié à côté de lui peut le relever avec son action, ou l'Enchanteur avec Lumière guérisseuse. Il revient Blessé (−1 PV max. jusqu'au campement). En Cauchemar, celui qui tombe est à bout de forces : il faut le relever à temps.`)}</p></section>
        <section><h3>${icon('armor')} ${L('Campamento', `Campement`)}</h3><p>${L('Entre capítulos se acampa: cada héroe gana un talento, podéis cambiar quién baja, y en la tienda se compran pociones y equipo. Cada pieza va en un hueco (mano, cuerpo o extra).', `Entre deux chapitres, on établit le campement : chaque héros gagne un talent, vous pouvez changer qui descend, et la boutique vend potions et équipement. Chaque pièce occupe un emplacement (main, corps ou extra).`)}</p></section>
        <section><h3>${icon('book')} ${L('Aprender jugando', 'Apprendre en jouant')}</h3><p>${L('<b>Ojo de Tahúr</b>: una vez por ronda, antes de atacar, el juego te pide estimar la probabilidad. Si aciertas y el Dado del Destino sale liso, se vuelve máscara alegre; fallar no quita nada. Sube de nivel con los aciertos (se puede apagar en Ajustes). <b>Dilema de la noche</b>: en cada campamento, una decisión sin respuesta correcta y un «¿por qué?». <b>Crónica de la noche</b>: un resumen de vuestras tiradas, estimaciones y decisiones, con una pregunta para hablar en familia.', '<b>Œil du Parieur</b> : une fois par manche, avant d’attaquer, le jeu te demande d’estimer la probabilité. Si tu as juste et que le Dé du Destin tombe sur une face vierge, il devient masque joyeux ; te tromper ne coûte rien. Tu montes de niveau avec les bonnes réponses (désactivable dans les Réglages). <b>Dilemme de la nuit</b> : à chaque campement, une décision sans bonne réponse et un « pourquoi ? ». <b>Chronique de la nuit</b> : un résumé de vos lancers, estimations et décisions, avec une question à discuter en famille.')}</p></section>
        <section><h3>${icon('stairs')} ${L('Modo Descenso', `Mode Descente`)}</h3><p>${L('Elige de 1 a 5 héroes y baja por mazmorras que se generan solas. Busca la <b>escalera que brilla</b> y tócala sin enemigos a la vista. Cada cuatro niveles espera un guardián y después se acampa. Al caer se apaga una <b>vela</b> y se repite el nivel.', `Choisis de 1 à 5 héros et descends dans des donjons qui se créent tout seuls. Cherche l'<b>escalier qui brille</b> et touche-le sans ennemi en vue. Tous les quatre niveaux, un gardien vous attend, puis on campe. En cas de défaite, une <b>bougie</b> s'éteint et on rejoue le niveau.`)}</p></section>
      </div>
      <div class="help-grid controls">
        <section><h3>${L('Ordenador', 'Ordinateur')}</h3><p>${L('Clic: mover, atacar, abrir · Arrastrar: desplazar · Clic derecho y arrastrar: girar · Rueda: zoom · <kbd>1</kbd> atacar · <kbd>2</kbd> <kbd>3</kbd> habilidades · <kbd>4</kbd> buscar · <kbd>5</kbd> objetos · <kbd>Z</kbd> deshacer movimiento · <kbd>G</kbd> ficha del grupo · <kbd>Espacio</kbd> fin de turno · <kbd>Tab</kbd> siguiente héroe · <kbd>Q</kbd>/<kbd>E</kbd> girar · <kbd>WASD</kbd> mover cámara · <kbd>Esc</kbd> cancelar', 'Clic : déplacer, attaquer, ouvrir · Glisser : faire défiler · Clic droit et glisser : pivoter · Molette : zoom · <kbd>1</kbd> attaquer · <kbd>2</kbd> <kbd>3</kbd> compétences · <kbd>4</kbd> fouiller · <kbd>5</kbd> objets · <kbd>Z</kbd> annuler le déplacement · <kbd>G</kbd> fiche du groupe · <kbd>Espace</kbd> fin du tour · <kbd>Tab</kbd> héros suivant · <kbd>Q</kbd>/<kbd>E</kbd> pivoter · <kbd>WASD</kbd> ou flèches : déplacer la caméra · <kbd>Échap</kbd> annuler')}</p></section>
        <section><h3>${L('Móvil', 'Mobile')}</h3><p>${L('Toca para ver qué pasará y toca otra vez para confirmar · Arrastra con un dedo para mover la cámara · Pellizca para acercar · Gira con dos dedos.', 'Touche pour voir ce qui va se passer, puis touche encore pour confirmer · Glisse un doigt pour déplacer la caméra · Pince pour zoomer · Tourne avec deux doigts.')}</p></section>
      </div>
      <div class="row end">${GAME.state === 'title' ? `<button class="btn" id="h-tut">${icon('target')} ${L('Jugar el tutorial', 'Jouer le tutoriel')}</button>` : ''}<button class="btn primary" id="h-back">${L('Entendido', 'Compris')}</button></div></div>`, 'dim');
    const ht = s.querySelector('#h-tut'); if (ht) ht.onclick = () => this.startTutorial();
    s.querySelector('#h-back').onclick = () => { audio.sfx('uiBack'); back ? back() : this.screen(null); };
  },
  settings(back) {
    const S = SETTINGS;
    const sel = (id, label, opts, val) => `<label class="set-row"><span>${label}</span><select id="${id}">${opts.map(([v, t]) => `<option value="${v}" ${String(v) === String(val) ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;
    const rng = (id, label, val) => `<label class="set-row"><span>${label}</span><input type="range" id="${id}" min="0" max="1" step="0.05" value="${val}"></label>`;
    const chk = (id, label, val) => `<label class="set-row chk"><span>${label}</span><input type="checkbox" id="${id}" ${val ? 'checked' : ''}></label>`;
    const s = this.screen(`<div class="card settings"><div class="eyebrow">${L('Ajustes', 'Réglages')}</div><h2>${L('Ajustes', 'Réglages')}</h2>
      <div class="set-grid">
        <section><h3>${L('Imagen', 'Image')}</h3>
          ${sel('s-q', L('Calidad gráfica', 'Qualité graphique'), [['minimo', L('Mínima (móviles muy lentos)', 'Minimale (mobiles très lents)')], ['bajo', L('Baja (móviles modestos)', 'Basse (mobiles modestes)')], ['medio', L('Media', 'Moyenne')], ['alto', L('Alta', 'Haute')]], S.quality)}
          ${chk('s-tilt', L('Efecto miniatura (desenfoque)', 'Effet miniature (flou)'), S.tilt)}
          ${chk('s-shake', L('Temblor de cámara', 'Tremblement de caméra'), S.shake)}
          ${chk('s-flash', L('Destellos de luz', 'Éclairs lumineux'), S.flashes)}
        </section>
        <section><h3>${L('Lectura', 'Lecture')}</h3>
          ${sel('s-size', L('Tamaño de letra', 'Taille du texte'), [['normal', L('Normal', 'Normale')], ['grande', L('Grande', 'Grande')], ['enorme', L('Muy grande', 'Très grande')]], S.textSize)}
          ${chk('s-contrast', L('Alto contraste', 'Contraste élevé'), S.contrast)}
        </section>
        <section><h3>${L('Sonido', 'Son')}</h3>
          ${rng('s-music', L('Música', 'Musique'), S.music)}${rng('s-sfx', L('Efectos', 'Effets'), S.sfx)}${rng('s-amb', L('Ambiente', 'Ambiance'), S.amb)}
          ${sel('s-voice', L('Voz narrada', 'Voix narrée'), [['off', L('Sin voz', 'Sans voix')], ['narrador', L('Solo narrador', 'Narrateur seul')], ['todos', L('Todos los personajes', 'Tous les personnages')]], S.voice)}
        </section>
        <section><h3>${L('Juego', 'Jeu')}</h3>
          ${sel('s-lang', L('Idioma · Langue', 'Langue · Idioma'), Object.keys(LANGS).map((k) => [k, LANGS[k]]), LANG)}
          ${chk('s-tahur', L('Ojo de Tahúr: estimar antes de atacar', 'Œil du Parieur : estimer avant d’attaquer'), S.tahur !== false)}
          ${sel('s-scares', L('Sustos', 'Frayeurs'), [['suaves', L('Suaves', 'Douces')], ['ninguno', L('Sin sustos', 'Sans frayeurs')]], S.scares)}
          ${sel('s-text', L('Velocidad del texto', 'Vitesse du texte'), [['lenta', L('Lenta', 'Lente')], ['normal', L('Normal', 'Normale')], ['rapida', L('Rápida', 'Rapide')]], S.textSpeed)}
          ${chk('s-auto', L('Avanzar diálogos solo', 'Dialogues automatiques'), S.autoText)}
          ${sel('s-speed', L('Velocidad de animación', "Vitesse d'animation"), [[1, L('Normal', 'Normale')], [1.5, L('Rápida', 'Rapide')], [2.2, L('Muy rápida', 'Très rapide')]], S.speed)}
          ${chk('s-follow', L('La cámara sigue la acción', "La caméra suit l'action"), S.follow)}
          ${chk('s-confirm', L('Confirmar con segundo toque (táctil)', "Confirmer d'un second toucher (tactile)"), S.confirmTouch)}
          ${chk('s-qdice', L('Dados rápidos en el turno enemigo', 'Dés rapides au tour ennemi'), S.quickEnemyDice)}
        </section>
      </div>
      <div class="row end"><button class="btn primary" id="s-back">${L('Hecho', 'Terminé')}</button></div></div>`, 'dim');
    const $ = (id) => s.querySelector('#' + id);
    const apply = () => {
      const q = $('s-q').value; const qChanged = q !== S.quality;
      Object.assign(S, { quality: q, tilt: $('s-tilt').checked, shake: $('s-shake').checked, flashes: $('s-flash').checked, music: +$('s-music').value, sfx: +$('s-sfx').value, amb: +$('s-amb').value, voice: $('s-voice').value, textSpeed: $('s-text').value, autoText: $('s-auto').checked, speed: +$('s-speed').value, follow: $('s-follow').checked, confirmTouch: $('s-confirm').checked, quickEnemyDice: $('s-qdice').checked, textSize: $('s-size').value, contrast: $('s-contrast').checked, scares: $('s-scares').value, tahur: $('s-tahur').checked });
      MAIN.applySettings(qChanged);
      if ($('s-lang').value !== LANG) setLang($('s-lang').value);
    };
    U.$$('select,input', s).forEach((i) => i.addEventListener('change', apply));
    U.$$('input[type=range]', s).forEach((i) => i.addEventListener('input', apply));
    $('s-back').onclick = () => { audio.sfx('uiBack'); back ? back() : this.screen(null); };
  }
};
