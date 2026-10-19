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
  hideAll() { ['dlg', 'choice', 'note', 'dice', 'hint', 'preview', 'chronicle', 'items-pop', 'acts-pop', 'sheet'].forEach((id) => { const e = this.$(id); if (e) e.hidden = true; }); this.screen(null); },
  showHUD(on) { this.hud.hidden = !on; document.body.classList.toggle('in-game', on); },

  /* ---------------- grupo ---------------- */
  buildParty() {
    const p = this.$('party'); p.innerHTML = '';
    ['aldric', 'sera', 'elian'].forEach((id) => {
      const d = HERO_DEFS[id];
      const c = U.el('button', 'hero-card', `
        <span class="hc-port"><img alt="" data-port="${id}"><i class="hc-ring" style="--hc:${d.color}"></i><i class="hc-b det" title="Determinación"></i>${id === 'elian' ? '<i class="hc-b eter" title="Éter"></i>' : ''}</span>
        <span class="hc-body">
          <span class="hc-name">${d.name}<small>${d.role}</small></span>
          <span class="hc-hp"><span class="hc-hpbar"><i></i></span><b class="hc-hpn"></b></span>
          <span class="hc-st"><span class="st-mv" title="Movimiento restante">${icon('boot')}<b></b></span><span class="st-act" title="Acción">${icon('hand')}</span><span class="st-det" title="Determinación"></span>${id === 'elian' ? '<span class="st-eter" title="Éter"></span>' : ''}</span>
          <span class="hc-fx"></span>
        </span>
        <span class="hc-tag"></span>`);
      c.dataset.hero = id; c.style.setProperty('--hc', d.color);
      c.onclick = () => { const h = GAME.heroes.find((q) => q.id === id); if (h && !h.ended && !h.ko && GAME.phase === 'hero' && !GAME.busy) { GAME.selectHero(h); audio.sfx('ui'); } else if (h) ENGINE.focusTile(h.x, h.y); };
      p.appendChild(c);
    });
  },
  buildActions() {
    const a = this.$('actions'); a.innerHTML = '';
    const mk = (id, ic, label, key) => { const b = U.el('button', 'act', `<span class="act-ic">${icon(ic)}</span><span class="act-lb">${label}</span>${key ? `<kbd>${key}</kbd>` : ''}<span class="act-cd"></span>`); b.dataset.act = id; b.onclick = (e) => { e.stopPropagation(); if (id === 'items') this.togglePop('items-pop'); else if (id === 'acts') this.togglePop('acts-pop'); else { this.closeItems(); GAME.action(id); } }; a.appendChild(b); return b; };
    this.btn = {
      attack: mk('attack', 'sword', 'Atacar', '1'), s0: mk('s0', 'shield', 'Habilidad', '2'), s1: mk('s1', 'radiant', 'Habilidad', '3'),
      acts: mk('acts', 'hand', 'Acciones', '4'), items: mk('items', 'potion', 'Objetos', '5'), end: mk('end', 'hourglass', 'Fin de turno', '␣')
    };
    this.btn.end.classList.add('act-end');
    const pop = this.$('items-pop');
    pop.innerHTML = ['potion', 'elixir', 'bomb'].map((k) => { const s = SHOP.find((q) => q.id === k); return `<button class="item-row" data-item="${k}">${icon(s.icon)}<span><b>${s.name}</b><small>${s.desc}</small></span><em data-count="${k}">0</em></button>`; }).join('');
    U.$$('.item-row', pop).forEach((b) => (b.onclick = (e) => { e.stopPropagation(); this.closeItems(); GAME.action(b.dataset.item); }));
    const ap = this.$('acts-pop');
    const acts = [['rally', 'crown', 'Arengar', 'Presencia: cada calavera inspira a un aliado (+1 dado en su próximo ataque o prueba) y le quita el miedo.'],
      ['search', 'search', 'Registrar', 'Ingenio: revela las trampas de la sala y busca botín. Hace ruido (+1 Presagio).'],
      ['guard', 'shield', 'En guardia', '+1 dado de defensa hasta tu próximo turno.'],
      ['dash', 'boot', 'Correr', '+3 de movimiento este turno.']];
    ap.innerHTML = acts.map(([k, ic, n, d]) => `<button class="item-row" data-actx="${k}">${icon(ic)}<span><b>${n}</b><small data-desc="${k}">${d}</small></span><em data-odds="${k}"></em></button>`).join('');
    U.$$('.item-row', ap).forEach((b) => (b.onclick = (e) => { e.stopPropagation(); this.closeItems(); GAME.action(b.dataset.actx); }));
  },
  togglePop(id) { audio.sfx('ui'); const p = this.$(id), open = p.hidden; this.closeItems(); p.hidden = !open; const b = id === 'items-pop' ? this.btn.items : this.btn.acts; b.classList.toggle('mode', open); if (open) this.refresh(); },
  toggleItems() { this.togglePop('items-pop'); },
  closeItems() { ['items-pop', 'acts-pop'].forEach((id) => (this.$(id).hidden = true)); if (this.btn) { this.btn.items.classList.remove('mode'); this.btn.acts.classList.remove('mode'); } },
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
      c.querySelector('.st-det').innerHTML = `<i class="pip-row">${Array.from({ length: h.detMax }, (_, i) => `<i class="pip det ${i < h.det ? 'on' : ''}"></i>`).join('')}</i>`;
      c.querySelector('.hc-b.det').textContent = h.det; const eb = c.querySelector('.hc-b.eter'); if (eb) eb.textContent = h.eter;
      const et = c.querySelector('.st-eter'); if (et) et.innerHTML = `<i class="pip-row">${Array.from({ length: h.eterMax }, (_, i) => `<i class="pip eter ${i < h.eter ? 'on' : ''}"></i>`).join('')}</i>`;
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
        if (s.eter) { cd.textContent = h.eter < si.cost ? si.cost : ''; b.classList.toggle('cooling', h.eter < si.cost); b.dataset.cost = si.cost; }
        else { cd.textContent = s.cd > 0 ? s.cd : ''; b.classList.toggle('cooling', s.cd > 0); delete b.dataset.cost; }
        b.disabled = !can || !!GAME.skillBlock(h, s);
        b.classList.toggle('mode', !!(GAME.mode && GAME.mode.key === 's' + i));
      });
      this.btn.attack.querySelector('.act-ic').innerHTML = icon(h.basic.icon);
      this.btn.attack.querySelector('.act-lb').textContent = h.basic.name;
      const w = HERO_DEFS[h.id].weapon;
      this.btn.attack.title = `${h.basic.name}: ${h.atk} dados (${w.name}, ${VIRTUES[w.attr].name})${h.range > 1 ? `, alcance ${h.range}` : ''}.`;
      this.btn.attack.disabled = !can || h.actions <= 0;
      this.btn.attack.classList.toggle('mode', !!(GAME.mode && GAME.mode.key === 'attack'));
      this.btn.acts.disabled = !can || h.actions <= 0;
      const odds = { rally: `${h.virt.PRE + (RULES.perk(h, 'PRE') ? 1 : 0)}d`, search: `${h.virt.ING}d`, guard: '', dash: '' };
      U.$$('[data-odds]', this.$('acts-pop')).forEach((e) => (e.textContent = odds[e.dataset.odds] || ''));
      this.btn.items.disabled = !can;
      this.btn.end.disabled = !can;
      this.btn.end.classList.toggle('pulse', can && h.mvLeft <= 0 && h.actions <= 0);
    } else Object.values(this.btn).forEach((b) => (b.disabled = true));
    this.$('actions').classList.toggle('targeting', !!GAME.mode);
    this.$('cancel-mode').hidden = !GAME.mode;
    this.$('undo-move').hidden = !(GAME.undo && GAME.active === GAME.undo.h && !GAME.busy && GAME.phase === 'hero');
    const dm = this.$('r-doom'); if (dm) { const mx = GAME.D.doom; dm.innerHTML = `${icon('eye')}<span class="doom-bar">${Array.from({ length: mx }, (_, i) => `<i class="${i < GAME.doom ? 'on' : ''}"></i>`).join('')}</span>`; dm.title = `Presagio ${GAME.doom}/${mx}: crece cada ronda y con el ruido. Al llenarse, algo errante sube a buscaros.`; dm.classList.toggle('warn', GAME.doom >= mx - 1); }
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
        <div class="pv-virt">${VKEYS.map((k) => `<span title="${VIRTUES[k].name}"><em>${k}</em>${u.virt[k]}</span>`).join('')}<span class="pv-iq" title="Cómo piensa (según su Ingenio y la dificultad)">${GAME.iqLabel(u)} · ${(ROLES[u.role] || '').split(' · ')[0]}</span></div>
        ${tr.length || st.length ? `<div class="pv-traits">${tr.map((t) => `<span title="${U.esc(t.desc)}">${U.esc(t.name)}</span>`).join('')}${st.map((t) => `<span class="bad">${U.esc(t)}</span>`).join('')}</div>` : ''}`;
    } else if (u && u.side === 'hero' && d.kind === 'self') {
      stats = `<div class="pv-virt">${VKEYS.map((k) => `<span title="${VIRTUES[k].name}"><em>${k}</em>${u.virt[k]}</span>`).join('')}</div>`;
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
  /* ---------------- dados ---------------- */
  dieHTML(face, counted, roll) {
    const ic = face === 'skull' ? 'skull' : 'shield';
    const faces = ['skull', 'white', 'black', 'skull', 'white', 'skull'];
    const f = (cls, fc) => `<span class="fc ${cls} f-${fc}">${icon(fc === 'skull' ? 'skull' : 'shield')}</span>`;
    void ic;
    return `<span class="die ${counted ? 'counted' : 'muted'}" style="--rx:${roll[0]}deg;--ry:${roll[1]}deg;--rz:${roll[2]}deg"><span class="cube">${f('front', face)}${f('back', faces[1])}${f('right', faces[2])}${f('left', faces[3])}${f('top', faces[4])}${f('bottom', faces[5])}</span></span>`;
  },
  dice(r) {
    const el = this.$('dice');
    const roll = () => [U.randi(2, 4) * 360 + U.randi(-40, 40), U.randi(2, 4) * 360 + U.randi(-40, 40), U.randi(-30, 30)];
    const atkRow = r.A.map((f) => this.dieHTML(f, f === 'skull', roll())).join('');
    const defRow = r.D.map((f) => this.dieHTML(f, f === r.shieldFace, roll())).join('');
    el.className = 'dice plate ' + (r.att.side === 'hero' ? 'by-hero' : 'by-foe') + (r.quick ? ' quick' : '') + (r.reroll ? ' reroll' : '');
    const mods = r.mods && r.mods.length ? `<div class="dc-mods">${r.mods.map(([t, v]) => `<span class="${v > 0 ? 'up' : 'down'}">${v > 0 ? '+' : ''}${v} ${U.esc(t)}</span>`).join('')}</div>` : '';
    el.innerHTML = `
      <div class="dc-head"><b>${U.esc(r.label || r.att.name)}</b><span>${U.esc(r.att.name)} → ${U.esc(r.tgt.name)}</span></div>${mods}
      <div class="dc-row atk">${atkRow}</div>
      <div class="dc-row def">${defRow || '<em class="nodef">sin defensa</em>'}</div>
      <div class="dc-res"><span>${r.skulls} ${icon('skull')}</span><i>−</i><span>${r.shields} ${icon('shield')}</span><i>=</i><strong class="${r.dmg ? 'hit' : 'miss'}">${r.dmg ? r.dmg + ' de daño' : 'Bloqueado'}</strong></div>`;
    el.hidden = false; void el.offsetWidth; el.classList.add('roll');
    audio.sfx('dice');
    const t = (r.quick ? 520 : 820) / U.speed;
    setTimeout(() => audio.sfx('diceLand'), t * 0.8);
    this.scheduleDiceHide(t + (r.quick ? 900 : 1500) / U.speed);
    return U.sleep(r.quick ? 520 : 820);
  },
  scheduleDiceHide(ms) { const el = this.$('dice'); clearTimeout(this._dh); this._dh = setTimeout(() => { if (this._holdDice) return; el.classList.remove('roll'); el.hidden = true; }, ms); },

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
  defeatCard(dead) {
    return new Promise((resolve) => {
      this.showHUD(false);
      const s = this.screen(`<div class="card defeat"><div class="eyebrow">Fin del camino</div><h2>${dead ? `${U.esc(dead.name)} no volverá a levantarse` : 'Las sombras os reclaman'}</h2>
        <p class="lead">${dead ? 'Nadie llegó a tiempo. Sin los tres, el descenso no puede continuar.' : 'El farol rueda por el suelo de piedra. Arriba, en Aldmere, nadie sabrá cómo terminó la historia.'}</p>
        <div class="row"><button class="btn primary" id="d-retry">${icon('rotate')} Reintentar el capítulo</button><button class="btn" id="d-menu">Volver al inicio</button></div></div>`, 'dim red');
      s.querySelector('#d-retry').onclick = () => { audio.sfx('ui'); this.screen(null); resolve('retry'); };
      s.querySelector('#d-menu').onclick = () => { audio.sfx('ui'); this.screen(null); resolve('menu'); };
    });
  },
  shop() {
    return new Promise((resolve) => {
      const render = () => {
        const heroes = ['aldric', 'sera', 'elian'];
        const item = (it) => {
          const owned = it.kind === 'up' ? GAME.upgrades[it.id] : it.kind === 'kit' ? GAME.kit : false;
          const cnt = it.kind === 'item' ? GAME.items[it.id] : null;
          const cost = price(it), can = !owned && GAME.gold >= cost;
          return `<div class="shop-item ${owned ? 'owned' : ''}"><span class="si-ic">${icon(it.icon)}</span><span class="si-t"><b>${it.name}</b><small>${it.desc}</small></span>
            <span class="si-buy">${cnt != null ? `<em>Tenéis ${cnt}</em>` : ''}<button class="btn small" data-buy="${it.id}" ${can ? '' : 'disabled'}>${owned ? 'Adquirido' : `${icon('coin')} ${cost}${cost < it.cost ? ` <s>${it.cost}</s>` : ''}`}</button></span></div>`;
        };
        s.querySelector('.shop-gold b').textContent = GAME.gold;
        s.querySelector('.shop-haggle').innerHTML = disc ? `${icon('crown')} ${U.esc(haggler.name)} regatea con su Presencia ${haggler.virt.PRE}: −${Math.round(disc * 100)}% en todo.` : 'Nadie del grupo tiene Presencia para regatear (hace falta 3 o más).';
        s.querySelector('.shop-cons').innerHTML = SHOP.filter((i) => i.kind !== 'up').map(item).join('');
        s.querySelector('.shop-ups').innerHTML = heroes.map((h) => `<div class="shop-hero"><div class="sh-h"><img src="${this.portraits[h] || ''}" alt=""><b>${HERO_DEFS[h].full}</b></div>${SHOP.filter((i) => i.hero === h).map(item).join('')}</div>`).join('');
        U.$$('[data-buy]', s).forEach((b) => (b.onclick = () => buy(b.dataset.buy)));
      };
      const haggler = HERO_IDS.map((id) => ({ name: HERO_DEFS[id].name, virt: GAME.virtOf(id) })).sort((a, b) => b.virt.PRE - a.virt.PRE)[0];
      const disc = Math.max(0, haggler.virt.PRE - 2) * 0.05;
      const price = (it) => Math.round(it.cost * (1 - disc));
      const buy = (id) => {
        const it = SHOP.find((i) => i.id === id); if (!it || GAME.gold < price(it)) return;
        GAME.gold -= price(it); audio.sfx('buy');
        if (it.kind === 'item') GAME.items[id]++;
        else if (it.kind === 'kit') GAME.kit = true;
        else {
          GAME.upgrades[id] = true;
          const h = GAME.heroes.find((q) => q.id === it.hero);
          if (h) { const nh = GAME.makeHero(h.id); Object.assign(h, { modelOpts: nh.modelOpts }); const pos = h.mesh.position.clone(), rot = h.mesh.rotation.y; WORLD.rebuildUnit(h); h.mesh.position.copy(pos); h.mesh.rotation.y = rot; FX.burst('magic', pos, { color: '#ffe6a0', color2: '#ffb000' }); GAME.updateLantern(); }
        }
        render();
      };
      const s = this.screen(`<div class="card shop"><div class="shop-head"><div><div class="eyebrow">Arcón de la Orden</div><h2>Antes de descender</h2></div><div class="shop-gold">${icon('coin')}<b></b><span>monedas</span></div></div>
        <p class="lead">Las hermanas del Archivo dejaron provisiones en el rellano. Pagad lo justo: la Orden lleva las cuentas.</p>
        <p class="shop-haggle"></p>
        <div class="shop-grid"><section><h3>Provisiones</h3><div class="shop-cons"></div></section><section><h3>Reliquias</h3><div class="shop-ups"></div></section></div>
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
        <p class="small">${GAME.flags.broke === false ? 'Existe otro final. Quizá la próxima vez Elian no dude.' : 'Existe otro final, más amargo. Solo se alcanza dudando.'}</p>
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
    const save = U.store.get('umbral.save.v2', null);
    const tutDone = !!U.store.get('umbral.tutorial', 0);
    const s = this.screen(`<div class="title">
      <div class="tt-top"><div class="tt-eyebrow">Crónicas de la Última Llama</div>
      <h1 class="tt-name" aria-label="Umbral">UMBRAL</h1>
      <p class="tt-tag">Tres héroes. Tres sellos. Un farol que no debería brillar.</p></div>
      <nav class="tt-menu">
        ${save ? `<button class="btn primary" id="t-cont">${icon('play')} Continuar <small>Capítulo ${CHAPTERS[save.chIdx] ? CHAPTERS[save.chIdx].num : ''}${save.stage === 'camp' ? ' · campamento' : ''}</small></button>` : ''}
        <button class="btn ${save ? '' : 'primary'}" id="t-new">${icon('flame')} Nueva partida</button>
        <button class="btn ${tutDone ? '' : 'recommend'}" id="t-tut">${icon('target')} Tutorial guiado <small>${tutDone ? 'unos 10 min' : 'Recomendado · 10 min'}</small></button>
        <button class="btn" id="t-help">${icon('scroll')} Cómo se juega</button>
        <button class="btn" id="t-set">${icon('gear')} Ajustes</button>
      </nav>
      <div class="tt-foot">Táctica por turnos con dados de calavera y escudo · Ratón, teclado o pantalla táctil</div></div>`, 'title-screen');
    const start = () => audio.init();
    s.addEventListener('pointerdown', start, { once: true });
    if (save) s.querySelector('#t-cont').onclick = () => { audio.init(); audio.sfx('ui'); GAME.restore(save); this.screen(null); if (save.stage === 'camp') GAME.camp(save.chIdx); else GAME.startChapter(save.chIdx); };
    s.querySelector('#t-new').onclick = () => { audio.init(); audio.sfx('ui'); this.difficulty(); };
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
  difficulty() {
    const tutDone = !!U.store.get('umbral.tutorial', 0);
    const opts = ['relato', 'heroe', 'pesadilla'].map((id) => DIFFICULTY[id]);
    const s = this.screen(`<div class="card diff"><div class="eyebrow">Nueva partida</div><h2>¿Cuánta oscuridad soportáis?</h2>
      <div class="diff-opts">${opts.map((d) => `<button class="diff-opt ${d.id === 'heroe' ? 'sel' : ''}" data-d="${d.id}"><b>${d.name}</b><small>${d.blurb}</small>
        <ul class="diff-list"><li>La Sombra: ${d.iq < 0 ? 'torpe' : d.iq > 0 ? 'más astuta' : 'piensa según cada criatura'}</li><li>Caer: ${d.fall === 'auto' ? 'te levantas solo' : d.fall === 'bleed' ? `te desangras (${d.bleed} rondas)` : 'un aliado te levanta, quedas herido'}</li><li>Presagio: cada ${d.doom} rondas</li>${d.champions ? '<li>Campeones entre los enemigos</li>' : ''}</ul></button>`).join('')}</div>
      ${tutDone ? '' : `<p class="df-tut">${icon('target')} <span>¿Primera vez? El <b>tutorial guiado</b> te enseña lo esencial en unos diez minutos, sin tocar tu partida.</span> <button class="btn small" id="df-tut">Hacer el tutorial</button></p>`}
      <div class="row"><button class="btn" id="df-back">Volver</button><button class="btn primary" id="df-go">${icon('crown')} Forjar el grupo</button></div></div>`, 'dim title-screen');
    const dt = s.querySelector('#df-tut'); if (dt) dt.onclick = () => this.startTutorial();
    let pick = 'heroe';
    U.$$('.diff-opt', s).forEach((b) => (b.onclick = () => { pick = b.dataset.d; U.$$('.diff-opt', s).forEach((q) => q.classList.toggle('sel', q === b)); audio.sfx('ui'); }));
    s.querySelector('#df-back').onclick = () => { audio.sfx('uiBack'); this.title(); };
    s.querySelector('#df-go').onclick = async () => {
      audio.sfx('ui');
      GAME.newGame(pick);
      const build = await this.forge();
      if (!build) { this.difficulty(); return; }
      GAME.newGame(pick, build.custom ? build.virt : null); U.store.del('umbral.save.v2');
      this.screen(null); await this.fadeOut(); MAIN.stopTitle();
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
      <div class="col"><button class="btn primary" id="p-back">${icon('play')} Seguir jugando</button><button class="btn" id="p-help">${icon('scroll')} Cómo se juega</button><button class="btn" id="p-set">${icon('gear')} Ajustes</button><button class="btn" id="p-full">${icon('fullscreen')} Pantalla completa</button>${GAME.state === 'play' ? `<button class="btn" id="p-retry">${icon('rotate')} Reiniciar capítulo</button>` : ''}<button class="btn danger" id="p-quit">Salir al inicio</button></div>
      <p class="small">La partida se guarda al comenzar cada capítulo y al llegar al campamento.</p></div>`, 'dim');
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
        <section><h3>${icon('boot')} El turno</h3><p>Cada héroe tiene <b>movimiento</b> y <b>una acción</b>. Puedes moverte antes y después de actuar. Cuando los tres terminan, actúa la Sombra.</p></section>
        <section><h3>${icon('skull')} Los dados</h3><p>Al atacar se tiran dados de combate: cada <b>calavera</b> es un golpe. El defensor tira los suyos: los héroes paran con <b>escudos blancos</b> (2 de 6 caras) y los monstruos con <b>escudos negros</b> (1 de 6). Daño = calaveras − escudos.</p></section>
        <section><h3>${icon('door')} Puertas y salas</h3><p>Las salas están ocultas hasta que abres su puerta. Detrás puede haber tesoros, enemigos… o algo peor. La luz que se filtra bajo una puerta roja anuncia a un guardián.</p></section>
        <section><h3>${icon('crown')} Las cinco virtudes</h3><p><b>Fuerza</b> (vida, armas pesadas, romper), <b>Agilidad</b> (movimiento, defensa, ganzúas, trampas), <b>Ingenio</b> (magia, registrar, sellos), <b>Voluntad</b> (Determinación, resistir el miedo) y <b>Presencia</b> (arengar, convencer, regatear). Con 4 o más, cada una da un don. Todo sale de ellas: mira la ficha del grupo (corona).</p></section>
        <section><h3>${icon('target')} Pruebas</h3><p>Para forzar una cerradura, convencer a un espíritu o resistir el miedo se tiran tantos dados como la virtud. Éxito si salen tantas calaveras como la dificultad (1 fácil, 2 media, 3 difícil). Siempre ves la probabilidad antes de elegir.</p></section>
        <section><h3>${icon('flame')} Determinación y Éter</h3><p>La Determinación (tanta como la Voluntad) permite repetir los dados fallados de tu tirada; si un golpe va a derribarte, se gasta sola. Elian lanza sus hechizos con Éter (tanto como su Ingenio, +1 por ronda).</p></section>
        <section><h3>${icon('sword')} Posición</h3><p><b>Flanqueo:</b> +1 dado si otro aliado está junto a tu objetivo (Sera, +2). <b>Ataque de oportunidad:</b> alejarte de un enemigo cuerpo a cuerpo le da un golpe gratis; los ágiles (Agilidad 4+) se escurren sin provocarlo.</p></section>
        <section><h3>${icon('eye')} Estados</h3><p><b>Aterrado</b> (−2 mov., −1 dado), <b>Envenenado</b> y <b>Ardiendo</b> (−1 PV por turno), <b>Aturdido</b> (pierde la acción), <b>Inspirado</b> (+1 dado). Los enemigos con poca Voluntad pueden <b>huir</b> si cae su líder o la mitad de su grupo.</p></section>
        <section><h3>${icon('search')} Registrar y Presagio</h3><p>Registrar usa el Ingenio: más calaveras, mejor botín y trampas reveladas. El <b>Presagio</b> (ojo de arriba) crece cada ronda y con el ruido; al llenarse, algo errante sube a buscaros.</p></section>
        <section><h3>${icon('revive')} Caer y levantarse</h3><p>Un héroe a 0 PV cae. Un aliado a su lado puede levantarle con su acción, o Elian con Luz de la Aurora. Vuelve Herido (−1 PV máximo hasta acampar). En Pesadilla, quien cae se desangra.</p></section>
        <section><h3>${icon('door')} Cerraduras y sellos</h3><p>Algunas puertas se abren con Agilidad (ganzúa) o Fuerza (con estruendo); otras con Ingenio o Voluntad. Elige bien quién lo intenta.</p></section>
      </div>
      <div class="help-grid controls">
        <section><h3>Ordenador</h3><p>Clic: mover, atacar, abrir · Arrastrar: desplazar · Clic derecho y arrastrar: girar · Rueda: zoom · <kbd>1</kbd>–<kbd>5</kbd> acciones · <kbd>Z</kbd> deshacer movimiento · <kbd>G</kbd> ficha del grupo · <kbd>Espacio</kbd> fin de turno · <kbd>Tab</kbd> siguiente héroe · <kbd>Q</kbd>/<kbd>E</kbd> girar · <kbd>WASD</kbd> mover cámara · <kbd>Esc</kbd> cancelar</p></section>
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
          ${sel('s-q', 'Calidad gráfica', [['bajo', 'Baja (móviles modestos)'], ['medio', 'Media'], ['alto', 'Alta']], S.quality)}
          ${chk('s-tilt', 'Efecto miniatura (desenfoque)', S.tilt)}
          ${chk('s-shake', 'Temblor de cámara', S.shake)}
          ${chk('s-flash', 'Destellos intensos en los sustos', S.flashes)}
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
          ${chk('s-det', 'Ofrecer Determinación tras mis tiradas', S.detOffer)}
        </section>
      </div>
      <div class="row end"><button class="btn primary" id="s-back">Hecho</button></div></div>`, 'dim');
    const $ = (id) => s.querySelector('#' + id);
    const apply = () => {
      const q = $('s-q').value; const qChanged = q !== S.quality;
      Object.assign(S, { quality: q, tilt: $('s-tilt').checked, shake: $('s-shake').checked, flashes: $('s-flash').checked, music: +$('s-music').value, sfx: +$('s-sfx').value, amb: +$('s-amb').value, voice: $('s-voice').value, textSpeed: $('s-text').value, autoText: $('s-auto').checked, speed: +$('s-speed').value, follow: $('s-follow').checked, confirmTouch: $('s-confirm').checked, quickEnemyDice: $('s-qdice').checked, detOffer: $('s-det').checked });
      MAIN.applySettings(qChanged);
    };
    U.$$('select,input', s).forEach((i) => i.addEventListener('change', apply));
    U.$$('input[type=range]', s).forEach((i) => i.addEventListener('input', apply));
    $('s-back').onclick = () => { audio.sfx('uiBack'); back ? back() : this.screen(null); };
  }
};
