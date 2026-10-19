/* ==========================================================================
   Interfaz de rol: pruebas, Determinación, elecciones con virtudes,
   cerraduras, ficha del grupo, forja inicial y talentos
   ========================================================================== */
Object.assign(UI, {
  /* ---------------- utilidades ---------------- */
  heroLike(id) { return GAME.heroes.find((h) => h.id === id && h.virt) || GAME.makeHero(id); },
  chanceFor(h, attr, dif, bonus = 0) { return RULES.pCheck(GAME.checkDice(h, attr, bonus), GAME.effDif(h, dif)); },
  pips(n, max, cls = '') { return `<span class="vpips ${cls}">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`; },

  /* ---------------- bandeja de prueba ---------------- */
  checkTray(r) {
    const el = this.$('dice');
    const roll = () => [U.randi(2, 4) * 360 + U.randi(-40, 40), U.randi(2, 4) * 360 + U.randi(-40, 40), U.randi(-30, 30)];
    const row = r.dice.map((f) => this.dieHTML(f, f === 'skull', roll())).join('');
    el.className = 'dice plate check by-hero' + (r.quick ? ' quick' : '') + (r.reroll ? ' reroll' : '');
    el.innerHTML = `
      <div class="dc-head"><b>${U.esc(r.label || 'Prueba')}</b><span>${U.esc(r.u.name)} · ${VIRTUES[r.attr].name} ${r.dice.length} dado${r.dice.length === 1 ? '' : 's'}${r.bonus ? ` (+${r.bonus})` : ''} · dificultad ${r.dif}</span></div>
      <div class="dc-row atk">${row || '<em class="nodef">sin dados</em>'}</div>
      <div class="dc-res"><span>${r.skulls} ${icon('skull')}</span><i>de</i><span>${r.dif} necesaria${r.dif > 1 ? 's' : ''}</span><strong class="${r.ok ? 'hit' : 'miss'}">${r.ok ? 'Éxito' : 'Fallo'}</strong></div>`;
    el.hidden = false; void el.offsetWidth; el.classList.add('roll');
    audio.sfx('dice');
    const t = (r.quick ? 480 : 760) / U.speed;
    setTimeout(() => { audio.sfx('diceLand'); if (!r.quick) audio.sfx(r.ok ? 'turnHero' : 'deny', { vol: 0.5 }); }, t * 0.8);
    this.scheduleDiceHide(t + (r.quick ? 800 : 1400) / U.speed);
    return U.sleep(r.quick ? 480 : 760);
  },
  /* Ofrecer Determinación tras una tirada (espera la decisión unos segundos) */
  offerDet(u, text) {
    return new Promise((resolve) => {
      const el = this.$('dice');
      if (!el.innerHTML) { resolve(false); return; }
      if (el.hidden) { el.hidden = false; el.classList.add('roll'); }
      this._holdDice = true; clearTimeout(this._dh);
      const box = U.el('div', 'det-offer', `<button class="btn small primary" data-y>${icon('flame')} ${U.esc(text)} <small>Determinación ${u.det}/${u.detMax}</small></button><button class="btn small ghost" data-n>Aceptar</button><i class="det-timer"></i>`);
      el.appendChild(box);
      let done = false;
      const finish = (v) => { if (done) return; done = true; clearTimeout(tm); box.remove(); this._holdDice = false; this.scheduleDiceHide(v ? 1600 : 700); resolve(v); };
      box.querySelector('[data-y]').onclick = (e) => { e.stopPropagation(); audio.sfx('ui'); finish(true); };
      box.querySelector('[data-n]').onclick = (e) => { e.stopPropagation(); audio.sfx('uiBack'); finish(false); };
      const tm = setTimeout(() => finish(false), 6500);
      this._detFinish = finish;
    });
  },

  /* ---------------- elecciones (con o sin prueba de virtud) ---------------- */
  choice(prompt, options, o = {}) {
    return new Promise((resolve) => {
      const c = this.$('choice');
      const opt = (op, i) => {
        let check = '', port = '';
        if (op.attr && op.hero) {
          const h = this.heroLike(op.hero), p = this.chanceFor(h, op.attr, op.dif);
          port = `<img class="ch-port" src="${this.portraits[op.hero] || ''}" alt="">`;
          check = `<span class="ch-check"><em>${VIRTUES[op.attr].name} ${GAME.checkDice(h, op.attr)}</em> · dificultad ${RULES.difName(GAME.effDif(h, op.dif))} · <strong>${RULES.pct(p)}</strong></span>`;
        }
        const lock = op.locked ? `<span class="ch-lock">${U.esc(op.locked)}</span>` : '';
        return `<button class="ch-opt ${op.attr ? 'is-check' : ''}" data-i="${i}" ${op.locked ? 'disabled' : ''}>${port}<span class="ch-body"><b>${U.esc(op.label)}</b>${op.desc ? `<small>${U.esc(op.desc)}</small>` : ''}${check}${lock}</span></button>`;
      };
      c.innerHTML = `${o.title ? `<div class="eyebrow">${U.esc(o.title)}</div>` : ''}<div class="ch-prompt">${U.esc(prompt)}</div><div class="ch-opts n${options.length}">${options.map(opt).join('')}</div>`;
      c.hidden = false; this.$('dlg').hidden = true;
      audio.sfx('reveal', { vol: 0.5 });
      U.$$('.ch-opt', c).forEach((b) => (b.onclick = () => { if (b.disabled) return; audio.sfx('ui'); c.hidden = true; resolve(options[+b.dataset.i]); }));
    });
  },
  lockChoice(h, door, opts) {
    return new Promise((resolve) => {
      const c = this.$('choice');
      const heroes = GAME.heroes;
      const line = (op) => heroes.filter((q) => !q.ko).map((q) => {
        const auto = op.auto && RULES.perk(q, op.auto);
        const p = auto ? 1 : this.chanceFor(q, op.attr, op.dif, op.kit ? GAME.gearMod(q.id, 'kit') : (op.bonus || 0));
        return `<span class="lk-h ${q === h ? 'me' : ''}"><img src="${this.portraits[q.id] || ''}" alt="">${U.esc(q.name)} ${auto ? 'seguro' : RULES.pct(p)}</span>`;
      }).join('');
      c.innerHTML = `<div class="eyebrow">${door.lock === 'sello' ? 'Sello rúnico' : 'Cerradura de hierro'}</div><div class="ch-prompt">¿Cómo la abre ${U.esc(h.name)}? Gasta su acción; si falla, podéis volver a intentarlo.</div>
        <div class="ch-opts n${opts.length}">${opts.map((op, i) => `<button class="ch-opt is-check" data-i="${i}"><span class="ch-body"><b>${U.esc(op.label)}</b><small>${U.esc(op.desc)}</small><span class="ch-check"><em>${VIRTUES[op.attr].name}</em> · dificultad ${RULES.difName(op.dif)}</span><span class="lk-row">${line(op)}</span></span></button>`).join('')}</div>
        <div class="row end"><button class="btn small ghost" data-cancel>No abrirla ahora</button></div>`;
      c.hidden = false;
      audio.sfx('ui');
      U.$$('.ch-opt', c).forEach((b) => (b.onclick = () => { audio.sfx('ui'); c.hidden = true; resolve(opts[+b.dataset.i]); }));
      c.querySelector('[data-cancel]').onclick = () => { audio.sfx('uiBack'); c.hidden = true; resolve(null); };
    });
  },

  /* ---------------- ficha del grupo ---------------- */
  derivedRows(id, v, h) {
    const d = HERO_DEFS[id], s = GAME.derive(id, v), b = (k) => VBONUS(v[k]);
    const f = GAME.flags, D = GAME.D, tal = GAME.talents[id] || [], gear = GAME.gearOf(id);
    const plus = (list) => list.filter(Boolean).map((t) => ` + ${t}`).join('');
    const from = (key, unit = '') => gear.filter((it) => it.mods && typeof it.mods[key] === 'number' && it.mods[key] > 0).map((it) => `${it.mods[key]}${unit} (${it.name})`);
    const minus = (key) => gear.filter((it) => it.mods && it.mods[key] < 0).map((it) => ` − ${-it.mods[key]} (${it.name})`).join('');
    const rows = [
      ['Vida', `${h ? `${h.hp}/` : ''}${h ? h.maxHp : s.hp}`, `3 + Fuerza ${v.FUE} + vigor ${d.vigor}${plus([D.heroHp && `${D.heroHp} (${D.name})`, ...from('hp')])}${h && h.wounds ? ` − herida ${h.wounds}` : ''}`],
      ['Movimiento', s.mv, `3 + Agilidad ${v.AGI}${plus(from('mv'))}${minus('mv')}`],
      ['Ataque', `${h ? h.atk : s.atk} dados`, `${d.weapon.name} ${d.weapon.base} + ${VIRTUES[d.weapon.attr].name} (+${b(d.weapon.attr)})${plus([...from('atk'), ...(d.weapon.ranged ? [] : from('melee')), id === 'sera' && f.tomasDagger && '1 (daga de Tomás)'])}${s.range > 1 ? ` · alcance ${s.range}` : ''}`],
      ['Defensa', `${h ? h.def : s.def} dados`, `${d.armor.name} ${d.armor.base} + Agilidad (+${b('AGI')})${plus(from('def'))}`],
      ['Determinación', h ? `${h.det}/${h.detMax}` : s.det, `Voluntad ${v.VOL}${plus([D.det && `${D.det} (${D.name})`, ...from('det'), f.detAllCh === GAME.chIdx && '1 (velada)'])}`]
    ];
    if (s.eter) rows.push(['Éter', h ? `${h.eter}/${h.eterMax}` : s.eter, `Ingenio ${v.ING}${plus([f.eterBonus && `${f.eterBonus} (velada)`, tal.includes('fuente') && '2 (Fuente de éter)', ...from('eter')])}, +1 por ronda`]);
    return rows;
  },
  heroSheetHTML(id, opts = {}) {
    const d = HERO_DEFS[id], h = opts.h, v = opts.v || (h ? h.virt : GAME.virtOf(id)), base = HERO_DEFS[id].virt;
    const virt = VKEYS.map((k) => {
      const val = v[k], perk = val >= PERK_AT;
      const ctrl = opts.edit ? `<span class="vctl"><button class="vbtn" data-h="${id}" data-k="${k}" data-d="-1" ${val <= 1 ? 'disabled' : ''} aria-label="Bajar ${VIRTUES[k].name}">−</button><button class="vbtn" data-h="${id}" data-k="${k}" data-d="1" ${val >= 5 || !opts.free ? 'disabled' : ''} aria-label="Subir ${VIRTUES[k].name}">+</button></span>` : '';
      const diff = opts.edit && val !== base[k] ? `<em class="${val > base[k] ? 'up' : 'down'}">${val > base[k] ? '+' : ''}${val - base[k]}</em>` : '';
      return `<div class="vrow" style="--vc:${VIRTUES[k].color}"><span class="vname">${icon(VIRTUES[k].icon)}${VIRTUES[k].name}</span>${this.pips(val, VMAX)}<b class="vval">${val}${diff}</b>${ctrl}
        <small class="vdesc">${VIRTUES[k].desc}${perk ? ` <span class="perk">${VIRTUES[k].perk.name}: ${VIRTUES[k].perk.desc}</span>` : ''}</small></div>`;
    }).join('');
    const rows = this.derivedRows(id, v, h).map(([n, val, f]) => `<div><dt>${n}</dt><dd>${val}</dd><small>${f}</small></div>`).join('');
    const hh = h || (() => { const x = GAME.makeHero(id), sv = GAME.derive(id, v); return Object.assign(x, { virt: v, atk: sv.atk, meleeAtk: sv.melee }); })();
    const skills = hh.skills.map((s) => `<li><b>${icon(s.icon)} ${s.name}</b> <small>${s.eter ? `Éter ${GAME.skillInfo(hh, s).cost}` : `recarga ${GAME.skillCd(hh, s)} rondas`}</small><span>${GAME.skillInfo(hh, s).text}</span></li>`).join('');
    const tal = (GAME.talents[id] || []).map((t) => GAME.talentDef(id, t)).filter(Boolean);
    const st = h ? Object.keys(h.status).filter((k) => STATUS[k] && h.status[k]).map((k) => `<span class="${STATUS[k].bad ? 'bad' : 'good'}">${STATUS[k].name}</span>`).join('') : '';
    return `<div class="sh-hero" style="--hc:${d.color}">
      <header><img src="${this.portraits[id] || ''}" alt=""><div><h3>${d.full}</h3><span class="sh-role">${d.role}</span><p>${d.blurb}</p></div></header>
      <section class="sh-virt">${virt}</section>
      <dl class="sh-derived">${rows}</dl>
      <section class="sh-more"><h4>Rasgo · ${d.trait.name}</h4><p>${d.trait.desc}</p>
        <h4>Habilidades</h4><ul class="sh-skills">${skills}<li><b>${icon('crown')} Arengar · Registrar · Guardia · Correr</b><span>Acciones comunes. Arengar usa la Presencia y Registrar el Ingenio.</span></li></ul>
        ${GAME.gearOf(id).length ? `<h4>Equipo</h4><ul class="sh-skills">${GAME.gearOf(id).map((it) => `<li><b>${icon(it.icon)} ${it.name}</b> <small>${SLOTS[it.slot]}</small><span>${it.desc}</span></li>`).join('')}</ul>` : ''}
        ${tal.length ? `<h4>Talentos</h4><ul class="sh-skills">${tal.map((t) => `<li><b>${t.name}</b><span>${t.desc}</span></li>`).join('')}</ul>` : ''}
        ${st ? `<h4>Estados</h4><div class="pv-traits">${st}</div>` : ''}</section>
    </div>`;
  },
  sheet(focus) {
    const el = this.$('sheet');
    if (!el.hidden && !focus) { el.hidden = true; return; }
    const ids = GAME.party;
    let cur = focus || (GAME.active && GAME.active.id) || (ids.includes(this._sheetCur) ? this._sheetCur : ids[0]);
    const render = () => {
      this._sheetCur = cur;
      const h = GAME.heroes.find((q) => q.id === cur && q.virt && GAME.state === 'play') || null;
      el.innerHTML = `<header class="sh-top"><h3>Ficha del grupo</h3><div class="sh-tabs">${ids.map((id) => `<button class="sh-tab ${id === cur ? 'on' : ''}" data-t="${id}" style="--hc:${HERO_DEFS[id].color}"><img src="${this.portraits[id] || ''}" alt="">${HERO_DEFS[id].name}</button>`).join('')}</div><button class="icon-btn" data-close aria-label="Cerrar ficha">${icon('close')}</button></header>
        <div class="sh-body">${this.heroSheetHTML(cur, { h })}</div>
        <footer class="sh-foot">Dificultad: <b>${GAME.D.name}</b> · Pruebas: tantos dados como la virtud; éxito con tantas calaveras como la dificultad.</footer>`;
      U.$$('.sh-tab', el).forEach((b) => (b.onclick = () => { cur = b.dataset.t; audio.sfx('ui'); render(); }));
      el.querySelector('[data-close]').onclick = () => { el.hidden = true; audio.sfx('uiBack'); };
    };
    render();
    el.hidden = false;
  },

  /* ---------------- forja del grupo (reparto inicial) ---------------- */
  forge(party) {
    const IDS = party || GAME.party;
    return new Promise((resolve) => {
      const v = {}, moved = {};
      IDS.forEach((id) => { v[id] = Object.assign({}, HERO_DEFS[id].virt); moved[id] = 0; });
      const free = (id) => VKEYS.reduce((a, k) => a + Math.max(0, HERO_DEFS[id].virt[k] - v[id][k]), 0) - VKEYS.reduce((a, k) => a + Math.max(0, v[id][k] - HERO_DEFS[id].virt[k]), 0);
      const lowered = (id) => VKEYS.reduce((a, k) => a + Math.max(0, HERO_DEFS[id].virt[k] - v[id][k]), 0);
      let cur = IDS[0];
      const s = this.screen(`<div class="card forge"><div class="eyebrow">Forja del grupo</div><h2>Cada héroe, a su manera</h2>
        <p class="lead">Así son por defecto. Si quieres, mueve hasta 2 puntos por héroe: baja una virtud para subir otra. Todo lo demás (vida, dados, movimiento) cambia con ellas.</p>
        <div class="sh-tabs forge-tabs"></div><div class="forge-body"></div>
        <div class="row"><button class="btn" id="fg-back">Volver</button><button class="btn" id="fg-reset">Restablecer</button><span class="fg-msg"></span><button class="btn primary" id="fg-go">${icon('flame')} Descender</button></div></div>`, 'dim title-screen forge-screen');
      const render = () => {
        s.querySelector('.forge-tabs').innerHTML = IDS.map((id) => `<button class="sh-tab ${id === cur ? 'on' : ''}" data-t="${id}" style="--hc:${HERO_DEFS[id].color}"><img src="${this.portraits[id] || ''}" alt="">${HERO_DEFS[id].name}${free(id) ? ` <em>${free(id)}</em>` : ''}</button>`).join('');
        s.querySelector('.forge-body').innerHTML = this.heroSheetHTML(cur, { v: v[cur], edit: true, free: free(cur) > 0 });
        const pend = IDS.filter((id) => free(id) !== 0);
        s.querySelector('#fg-go').disabled = pend.length > 0;
        s.querySelector('.fg-msg').textContent = pend.length ? `Reparte los puntos que has quitado (${pend.map((id) => HERO_DEFS[id].name).join(', ')}).` : '';
        U.$$('.sh-tab', s).forEach((b) => (b.onclick = () => { cur = b.dataset.t; audio.sfx('ui'); render(); }));
        U.$$('.vbtn', s).forEach((b) => (b.onclick = () => {
          const id = b.dataset.h, k = b.dataset.k, d = +b.dataset.d;
          if (d < 0) { if (v[id][k] <= 1) return; if (v[id][k] <= HERO_DEFS[id].virt[k] && lowered(id) >= 2) { UI.toast('Como mucho puedes mover 2 puntos por héroe.'); return; } }
          if (d > 0 && (v[id][k] >= 5 || free(id) <= 0)) return;
          v[id][k] += d; audio.sfx(d > 0 ? 'ui' : 'uiBack'); render();
        }));
      };
      render();
      s.querySelector('#fg-back').onclick = () => { audio.sfx('uiBack'); resolve(null); };
      s.querySelector('#fg-reset').onclick = () => { IDS.forEach((id) => (v[id] = Object.assign({}, HERO_DEFS[id].virt))); audio.sfx('uiBack'); render(); };
      s.querySelector('#fg-go').onclick = () => {
        if (IDS.some((id) => free(id) !== 0)) return;
        audio.sfx('ui');
        const custom = IDS.some((id) => VKEYS.some((k) => v[id][k] !== HERO_DEFS[id].virt[k]));
        resolve({ custom, virt: v });
      };
      void moved;
    });
  },

  /* ---------------- ascenso: talentos al acampar ---------------- */
  talents(tier) {
    return new Promise((resolve) => {
      const picks = {};
      const s = this.screen(`<div class="card talents"><div class="eyebrow">Ascenso · Rango ${tier + 2}</div><h2>Lo que la Hondura os ha enseñado</h2>
        <p class="lead">Cada héroe elige un talento. Algunos suben una virtud; otros cambian cómo lucha.</p>
        <div class="tal-grid">${GAME.party.map((id) => `<section class="tal-col" style="--hc:${HERO_DEFS[id].color}"><header><img src="${this.portraits[id] || ''}" alt=""><b>${HERO_DEFS[id].full}</b>${GAME.isMulti() ? `<em class="hc-owner pc${GAME.heroOwner(id)}">${U.esc(GAME.playerName(GAME.heroOwner(id)))}</em>` : ''}</header>
          ${TALENTS[id][tier].map((t) => `<button class="tal-opt" data-h="${id}" data-t="${t.id}"><b>${t.name}</b><small>${t.desc}</small>${t.virt ? `<em>${Object.entries(t.virt).map(([k, n]) => `+${n} ${VIRTUES[k].name}`).join(', ')}</em>` : ''}</button>`).join('')}</section>`).join('')}</div>
        <div class="row end"><button class="btn primary" id="tl-go" disabled>${icon('check')} Confirmar talentos</button></div></div>`, 'dim');
      U.$$('.tal-opt', s).forEach((b) => (b.onclick = () => {
        picks[b.dataset.h] = b.dataset.t; audio.sfx('ui');
        U.$$(`.tal-opt[data-h="${b.dataset.h}"]`, s).forEach((q) => q.classList.toggle('sel', q === b));
        s.querySelector('#tl-go').disabled = GAME.party.some((id) => !picks[id]);
      }));
      s.querySelector('#tl-go').onclick = () => { audio.sfx('levelUp'); this.screen(null); resolve(picks); };
    });
  }
});
