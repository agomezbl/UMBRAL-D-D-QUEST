/* ==========================================================================
   Interfaz de rol: tiradas de cerraduras y trampas, elecciones, ficha del
   grupo, elección de héroes (1 a 5) y talentos
   ========================================================================== */
Object.assign(UI, {
  /* ---------------- bandeja de tirada (cerraduras, trampas) ---------------- */
  checkTray(r) {
    const el = this.$('dice');
    const roll = () => [U.randi(2, 4) * 360 + U.randi(-40, 40), U.randi(2, 4) * 360 + U.randi(-40, 40), U.randi(-30, 30)];
    const row = r.dice.map((f) => this.dieHTML(f, f === 'skull', roll())).join('');
    const total = r.skulls + (r.have || 0), ok = total >= r.need;
    el.className = 'dice plate check by-hero' + (r.quick ? ' quick' : '');
    el.innerHTML = `
      <div class="dc-head"><b>${U.esc(r.label || 'Tirada')}</b><span>${U.esc(r.u.name)} · ${r.dice.length} dado${r.dice.length === 1 ? '' : 's'} · hacen falta ${r.need} ${icon('skull')}</span></div>
      <div class="dc-row atk">${row}</div>
      <div class="dc-res"><span>${r.have ? `${r.have} + ` : ''}${r.skulls} ${icon('skull')}</span><i>de</i><span>${r.need}</span><strong class="${ok ? 'hit' : 'miss'}">${ok ? 'Conseguido' : r.have != null && total > 0 ? 'Aún no' : 'Fallo'}</strong></div>`;
    el.hidden = false; void el.offsetWidth; el.classList.add('roll');
    audio.sfx('dice');
    const t = (r.quick ? 480 : 760) / U.speed;
    setTimeout(() => { audio.sfx('diceLand'); if (!r.quick) audio.sfx(ok ? 'turnHero' : 'deny', { vol: 0.5 }); }, t * 0.8);
    this.scheduleDiceHide(t + (r.quick ? 800 : 1400) / U.speed);
    return U.sleep(r.quick ? 480 : 760);
  },

  /* ---------------- elecciones ---------------- */
  choice(prompt, options, o = {}) {
    return new Promise((resolve) => {
      const c = this.$('choice');
      const opt = (op, i) => {
        const req = Array.isArray(op.req) ? `<span class="ch-req">${op.req.map((id) => `<img src="${this.portraits[id] || ''}" alt="" title="${U.esc(HERO_DEFS[id].role)}">`).join('')}</span>` : '';
        const lock = op.locked ? `<span class="ch-lock">${U.esc(op.locked)}</span>` : '';
        return `<button class="ch-opt" data-i="${i}" ${op.locked ? 'disabled' : ''}>${req}<span class="ch-body"><b>${U.esc(op.label)}</b>${op.desc ? `<small>${U.esc(op.desc)}</small>` : ''}${lock}</span></button>`;
      };
      c.innerHTML = `${o.title ? `<div class="eyebrow">${U.esc(o.title)}</div>` : ''}<div class="ch-prompt">${U.esc(prompt)}</div><div class="ch-opts n${options.length}">${options.map(opt).join('')}</div>`;
      c.hidden = false; this.$('dlg').hidden = true;
      audio.sfx('reveal', { vol: 0.5 });
      U.$$('.ch-opt', c).forEach((b) => (b.onclick = () => { if (b.disabled) return; audio.sfx('ui'); c.hidden = true; resolve(options[+b.dataset.i]); }));
    });
  },

  /* ---------------- números del héroe ---------------- */
  statLine(s, o = {}) {
    return `<span class="hstats${o.big ? ' big' : ''}"><span title="Vida">${icon('heart')}<b>${s.hp}</b></span><span title="Dados de ataque">${icon('sword')}<b>${s.atk}</b></span><span title="Dados de defensa">${icon('shield')}<b>${s.def}</b></span><span title="Movimiento">${icon('boot')}<b>${s.mv}</b></span>${s.range > 1 ? `<span title="Alcance">${icon('bow')}<b>${s.range}</b></span>` : ''}</span>`;
  },
  derivedRows(id, h) {
    const d = HERO_DEFS[id], S = d.stats, s = GAME.derive(id), D = GAME.D, gear = GAME.gearOf(id), tal = (GAME.talents[id] || []).map((t) => GAME.talentDef(id, t)).filter(Boolean);
    const from = (key) => gear.filter((it) => it.mods && typeof it.mods[key] === 'number' && it.mods[key] > 0).map((it) => `+${it.mods[key]} ${it.name}`)
      .concat(tal.filter((t) => t.mods && t.mods[key] > 0).map((t) => `+${t.mods[key]} ${t.name}`))
      .concat(GAME.build && GAME.build[id] && GAME.build[id][key] ? [`+${GAME.build[id][key]} mejoras`] : []);
    const minus = (key) => gear.filter((it) => it.mods && it.mods[key] < 0).map((it) => `−${-it.mods[key]} ${it.name}`);
    const why = (base, list) => [base].concat(list).filter(Boolean).join(' · ');
    const atkFrom = from('atk').concat(d.ranged ? from('shoot').concat(d.magic ? from('spell') : []) : from('melee'));
    return [
      ['Vida', h ? `${h.hp}/${h.maxHp}` : s.hp, why(`${S.hp} base`, [D.heroHp && `${D.heroHp > 0 ? '+' : ''}${D.heroHp} ${D.name}`, ...from('hp'), h && h.wounds && `−${h.wounds} heridas`, GAME.flags.vigorCh === GAME.chIdx && '+2 descanso'])],
      ['Ataque', `${h ? h.atk : s.atk} dados`, why(`${S.atk} ${d.weapon}`, atkFrom) + (d.ranged ? ` · cuerpo a cuerpo ${s.melee}` : '')],
      ['Defensa', `${h ? h.def : s.def} dados`, why(`${S.def} ${d.armor}`, from('def'))],
      ['Movimiento', h ? h.mv : s.mv, why(`${S.mv} base`, [...from('mv'), ...minus('mv')])],
      ['Alcance', s.range > 1 ? `${s.range} casillas` : 'Cuerpo a cuerpo', d.ranged ? 'Dispara si hay línea de visión' : s.range > 1 ? 'La lanza llega a 2 casillas' : 'Golpea a quien tenga al lado']
    ];
  },
  heroSheetHTML(id, opts = {}) {
    const d = HERO_DEFS[id], h = opts.h;
    const rows = this.derivedRows(id, h).map(([n, val, f]) => `<div><dt>${n}</dt><dd>${val}</dd><small>${U.esc(f)}</small></div>`).join('');
    const hh = h || GAME.makeHero(id);
    const skills = hh.skills.map((s) => `<li><b>${icon(s.icon)} ${s.name}</b> <small>${s.free ? 'no gasta la acción · ' : ''}recarga ${GAME.skillCd(hh, s)} rondas</small><span>${GAME.skillInfo(hh, s).text}</span></li>`).join('');
    const tal = (GAME.talents[id] || []).map((t) => GAME.talentDef(id, t)).filter(Boolean);
    const st = h ? Object.keys(h.status).filter((k) => STATUS[k] && h.status[k]).map((k) => `<span class="${STATUS[k].bad ? 'bad' : 'good'}" title="${U.esc(STATUS[k].desc)}">${STATUS[k].name}</span>`).join('') : '';
    return `<div class="sh-hero" style="--hc:${d.color}">
      <header><img src="${this.portraits[id] || ''}" alt=""><div><h3>${d.full}</h3><span class="sh-role">${d.role} · ${d.race}</span><p>${d.blurb}</p></div></header>
      <dl class="sh-derived">${rows}</dl>
      <section class="sh-more"><h4>Rasgo · ${d.trait.name}</h4><p>${d.trait.desc}</p>
        <h4>Ataque y habilidades</h4><ul class="sh-skills"><li><b>${icon(d.basic.icon)} ${d.basic.name}</b><small>gasta la acción</small><span>Ataque básico: ${hh.atk} dados${d.ranged ? ` a ${hh.range} casillas` : ''}.</span></li>${skills}</ul>
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
      const h = GAME.state === 'play' ? GAME.heroes.find((q) => q.id === cur) || null : null;
      el.innerHTML = `<header class="sh-top"><h3>Ficha del grupo</h3><div class="sh-tabs">${ids.map((id) => `<button class="sh-tab ${id === cur ? 'on' : ''}" data-t="${id}" style="--hc:${HERO_DEFS[id].color}"><img src="${this.portraits[id] || ''}" alt="">${HERO_DEFS[id].name}</button>`).join('')}</div><button class="icon-btn" data-close aria-label="Cerrar ficha">${icon('close')}</button></header>
        <div class="sh-body">${this.heroSheetHTML(cur, { h })}</div>
        <footer class="sh-foot">Dificultad: <b>${GAME.D.name}</b> · Cada calavera es un golpe; cada escudo para uno.</footer>`;
      U.$$('.sh-tab', el).forEach((b) => (b.onclick = () => { cur = b.dataset.t; audio.sfx('ui'); render(); }));
      el.querySelector('[data-close]').onclick = () => { el.hidden = true; audio.sfx('uiBack'); };
    };
    render();
    el.hidden = false;
  },

  /* ---------------- elegir el grupo: de 1 a 5 héroes ----------------
     o.mode: 'campaign' | 'camp' | 'descent'; o.recommend: { heroes, text } */
  partyPick(o = {}) {
    return new Promise((resolve) => {
      const ALL = HERO_ROSTER, rec = o.recommend || null;
      const stored = o.mode === 'descent' ? U.store.get('umbral.descent.party', null) : null;
      let sel = (o.current || stored || (rec && rec.heroes) || DEFAULT_PARTY).filter((id) => ALL.includes(id)).slice(0, 5);
      if (!sel.length) sel = DEFAULT_PARTY.slice();
      const eyebrow = o.mode === 'camp' ? `Antes de bajar · ${U.esc(o.title || '')}` : o.mode === 'descent' ? `Modo Descenso · ${U.esc(DIFFICULTY[o.diff || 'heroe'].name)}` : `Nueva partida · ${U.esc(DIFFICULTY[o.diff || 'heroe'].name)}`;
      const lead = o.mode === 'camp' ? 'Podéis cambiar quién baja al siguiente capítulo. Quien entra nuevo elige sus talentos al momento.' : 'Elige de 1 a 5 héroes. Con menos héroes salen menos enemigos; con más, la Hondura manda más criaturas. El primero que elijas lleva el farol.';
      const s = this.screen(`<div class="card party-pick"><div class="eyebrow">${eyebrow}</div><h2>¿Quién baja?</h2>
        <p class="lead">${lead}</p>
        ${rec ? `<div class="pp-rec">${icon('crown')}<span><b>Recomendado:</b> ${rec.heroes.map((id) => HERO_DEFS[id].role).join(', ')}. <small>${U.esc(rec.text)}</small></span><button class="btn small" id="pp-rec">Usar este grupo</button></div>` : ''}
        <div class="pp-grid"></div>
        <div class="row"><button class="btn" id="pp-back">${o.mode === 'camp' ? 'Seguir igual' : 'Volver'}</button><span class="pp-msg"></span><button class="btn primary" id="pp-go"></button></div></div>`, 'dim title-screen party-screen');
      const render = () => {
        s.querySelector('.pp-grid').innerHTML = ALL.map((id) => {
          const d = HERO_DEFS[id], i = sel.indexOf(id), on = i >= 0, st = GAME.derive(id, Math.max(1, sel.length));
          return `<button class="pp-hero ${on ? 'on' : ''}" data-h="${id}" style="--hc:${d.color}" aria-pressed="${on}">
            <span class="pp-top"><img src="${this.portraits[id] || ''}" alt=""><span><b>${d.name}</b><small>${d.role}</small>${on && i === 0 ? `<em class="pp-lead">${icon('flame')} Lleva el farol</em>` : ''}</span>${rec && rec.heroes.includes(id) ? '<em class="pp-new">Recomendado</em>' : ''}</span>
            ${this.statLine(st)}
            <span class="pp-blurb">${d.blurb}</span>
            <span class="pp-skills"><i>${icon(d.basic.icon)} ${d.basic.name}</i>${d.skills.map((q) => `<i>${icon(q.icon)} ${q.name}</i>`).join('')}</span>
            <span class="pp-check">${on ? i + 1 : ''}</span></button>`;
        }).join('');
        const n = sel.length;
        s.querySelector('#pp-go').disabled = !n;
        s.querySelector('#pp-go').innerHTML = `${icon('stairs')} ${n ? `Bajar con ${n} héroe${n > 1 ? 's' : ''}` : 'Elige al menos uno'}`;
        s.querySelector('.pp-msg').textContent = n === 1 ? 'En solitario: pocos enemigos, pero nadie te levantará si caes.' : n >= 4 ? 'Grupo grande: más criaturas en cada sala.' : '';
        U.$$('.pp-hero', s).forEach((b) => (b.onclick = () => {
          const id = b.dataset.h;
          if (sel.includes(id)) sel = sel.filter((q) => q !== id); else if (sel.length < 5) sel.push(id);
          audio.sfx('ui'); render();
        }));
      };
      render();
      const rb = s.querySelector('#pp-rec'); if (rb) rb.onclick = () => { sel = rec.heroes.slice(); audio.sfx('ui'); render(); };
      s.querySelector('#pp-back').onclick = () => { audio.sfx('uiBack'); this.screen(null); resolve(o.mode === 'camp' ? o.current.slice() : null); };
      s.querySelector('#pp-go').onclick = () => {
        if (!sel.length) return;
        audio.sfx('ui');
        if (o.mode === 'descent') U.store.set('umbral.descent.party', sel.slice());
        this.screen(null); resolve(sel.slice());
      };
    });
  },

  /* ---------------- ascenso: talentos al acampar ---------------- */
  talents(tier, ids) {
    const IDS = ids || GAME.party;
    return new Promise((resolve) => {
      const picks = {};
      const s = this.screen(`<div class="card talents"><div class="eyebrow">Ascenso · Talento ${tier + 1} de 2</div><h2>Lo que la Hondura os ha enseñado</h2>
        <p class="lead">Cada héroe elige un talento: más números o una habilidad mejorada.</p>
        <div class="tal-grid">${IDS.map((id) => `<section class="tal-col" style="--hc:${HERO_DEFS[id].color}"><header><img src="${this.portraits[id] || ''}" alt=""><b>${HERO_DEFS[id].full}</b></header>
          ${TALENTS[id][tier].map((t) => `<button class="tal-opt" data-h="${id}" data-t="${t.id}"><b>${t.name}</b><small>${t.desc}</small></button>`).join('')}</section>`).join('')}</div>
        <div class="row end"><button class="btn primary" id="tl-go" disabled>${icon('check')} Confirmar talentos</button></div></div>`, 'dim');
      U.$$('.tal-opt', s).forEach((b) => (b.onclick = () => {
        picks[b.dataset.h] = b.dataset.t; audio.sfx('ui');
        U.$$(`.tal-opt[data-h="${b.dataset.h}"]`, s).forEach((q) => q.classList.toggle('sel', q === b));
        s.querySelector('#tl-go').disabled = IDS.some((id) => !picks[id]);
      }));
      s.querySelector('#tl-go').onclick = () => { audio.sfx('levelUp'); this.screen(null); resolve(picks); };
    });
  }
});
