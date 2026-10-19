/* ==========================================================================
   Interfaz del modo Descenso: elegir el grupo, dones del campamento
   y el final de la partida
   ========================================================================== */
Object.assign(UI, {
  descentSetup() { this.difficulty('descent'); },

  /* Elige 3 de los 5 héroes */
  partyPick(diff, np = 1) {
    const ALL = ['aldric', 'sera', 'elian', 'brunna', 'nyra'];
    const last = U.store.get('umbral.descent.party', null);
    let sel = Array.isArray(last) && last.length === 3 && last.every((id) => ALL.includes(id)) ? last.slice() : ['aldric', 'brunna', 'nyra'];
    const s = this.screen(`<div class="card party-pick"><div class="eyebrow">Modo Descenso · ${U.esc(DIFFICULTY[diff].name)}</div><h2>¿Quién baja?</h2>
      <p class="lead">Elige a tres. Cada nivel es distinto y se baja tan hondo como aguante el grupo. Al caer se apaga una vela y repetís el nivel; sin velas, termina el descenso.</p>
      <div class="pp-grid"></div>
      <div class="row"><button class="btn" id="pp-back">Volver</button><span class="pp-msg"></span><button class="btn primary" id="pp-go">${icon('crown')} Forjar el grupo</button></div></div>`, 'dim title-screen party-screen');
    const render = () => {
      s.querySelector('.pp-grid').innerHTML = ALL.map((id) => {
        const d = HERO_DEFS[id], on = sel.includes(id);
        return `<button class="pp-hero ${on ? 'on' : ''}" data-h="${id}" style="--hc:${d.color}" aria-pressed="${on}">
          <span class="pp-top"><img src="${this.portraits[id] || ''}" alt=""><span><b>${d.name}</b><small>${d.role}</small></span>${d.descent ? '<em class="pp-new">Nuevo</em>' : ''}</span>
          <span class="pp-blurb">${d.blurb}</span>
          <span class="pp-virt">${VKEYS.map((k) => `<span title="${VIRTUES[k].name} ${d.virt[k]}" style="--vc:${VIRTUES[k].color}"><em>${VIRTUES[k].name.slice(0, 3)}</em>${this.pips(d.virt[k], 5)}<b class="pp-n">${d.virt[k]}</b></span>`).join('')}</span>
          <span class="pp-skills">${d.skills.map((q) => `<i>${icon(q.icon)} ${q.name}</i>`).join('')}</span>
          <span class="pp-check">${on ? icon('check') : ''}</span></button>`;
      }).join('');
      s.querySelector('#pp-go').disabled = sel.length !== 3;
      s.querySelector('.pp-msg').textContent = sel.length === 3 ? '' : `Elige ${3 - sel.length} más.`;
      U.$$('.pp-hero', s).forEach((b) => (b.onclick = () => {
        const id = b.dataset.h;
        if (sel.includes(id)) sel = sel.filter((q) => q !== id);
        else if (sel.length < 3) sel.push(id);
        else { sel.shift(); sel.push(id); }
        audio.sfx('ui'); render();
      }));
    };
    render();
    s.querySelector('#pp-back').onclick = () => { audio.sfx('uiBack'); this.difficulty('descent'); };
    const self = this;
    s.querySelector('#pp-go').onclick = async () => {
      if (sel.length !== 3) return;
      audio.sfx('ui');
      const party = ALL.filter((id) => sel.includes(id));
      U.store.set('umbral.descent.party', party);
      GAME.newGame(diff, null, party);
      const build = await this.forge(party);
      if (!build) { this.partyPick(diff, np); return; }
      let mp = null;
      if (np > 1) { mp = await self.playersSetup(party, { n: np }); if (!mp) { this.partyPick(diff, np); return; } }
      this.screen(null); await this.fadeOut(); MAIN.stopTitle();
      GAME.startDescent(diff, party, build.custom ? build.virt : null, mp);
    };
  },

  /* Más allá del segundo campamento: +1 a una virtud por héroe */
  boons() {
    return new Promise((resolve) => {
      const picks = {};
      const s = this.screen(`<div class="card talents boons"><div class="eyebrow">Ascenso · Campamento ${GAME.descent ? GAME.descent.camps : ''}</div><h2>La Hondura os ha endurecido</h2>
        <p class="lead">Cada héroe sube una virtud un punto (hasta ${VMAX}). Con 4 o más llega su don; todo lo demás cambia con ella.</p>
        <div class="tal-grid">${GAME.party.map((id) => { const v = GAME.virtOf(id); return `<section class="tal-col" style="--hc:${HERO_DEFS[id].color}"><header><img src="${this.portraits[id] || ''}" alt=""><b>${HERO_DEFS[id].full}</b>${GAME.isMulti() ? `<em class="hc-owner pc${GAME.heroOwner(id)}">${U.esc(GAME.playerName(GAME.heroOwner(id)))}</em>` : ''}</header>
          ${VKEYS.map((k) => `<button class="tal-opt boon" data-h="${id}" data-k="${k}" ${v[k] >= VMAX ? 'disabled' : ''}><b>${icon(VIRTUES[k].icon)} ${VIRTUES[k].name} <span class="bn-n">${v[k]} → ${Math.min(VMAX, v[k] + 1)}</span></b>${v[k] + 1 === PERK_AT ? `<em>Desbloquea: ${VIRTUES[k].perk.name}</em>` : ''}</button>`).join('')}</section>`; }).join('')}</div>
        <div class="row end"><button class="btn primary" id="tl-go" disabled>${icon('check')} Confirmar</button></div></div>`, 'dim');
      U.$$('.tal-opt', s).forEach((b) => (b.onclick = () => {
        picks[b.dataset.h] = b.dataset.k; audio.sfx('ui');
        U.$$(`.tal-opt[data-h="${b.dataset.h}"]`, s).forEach((q) => q.classList.toggle('sel', q === b));
        s.querySelector('#tl-go').disabled = GAME.party.some((id) => !picks[id] && VKEYS.some((k) => GAME.virtOf(id)[k] < VMAX));
      }));
      s.querySelector('#tl-go').onclick = () => { audio.sfx('levelUp'); this.screen(null); resolve(picks); };
    });
  },

  /* Final del descenso: profundidad, récord y números de la partida */
  descentOver(o) {
    return new Promise((resolve) => {
      this.showHUD(false);
      const st = o.stats || {}, mins = Math.max(1, Math.round((Date.now() - (st.start || Date.now())) / 60000));
      const best = o.best && o.best.depth ? o.best.depth : o.depth;
      const s = this.screen(`<div class="card victory descent-over"><div class="eyebrow">Fin del descenso · ${U.esc(DIFFICULTY[o.difficulty].name)}</div>
        <h2>Nivel ${o.depth}</h2>
        <p class="lead">${o.record ? `${icon('crown')} ¡Nuevo récord! Nadie de la Orden había bajado tanto.` : `Vuestro récord sigue en el nivel ${best}.`}</p>
        <div class="do-party">${o.party.map((id) => `<span style="--hc:${HERO_DEFS[id].color}"><img src="${this.portraits[id] || ''}" alt="">${HERO_DEFS[id].name}</span>`).join('')}</div>
        <dl class="stats"><div><dt>Criaturas abatidas</dt><dd>${st.kills || 0}</dd></div><div><dt>Oro reunido</dt><dd>${st.gold || 0}</dd></div><div><dt>Rondas</dt><dd>${st.rounds || 0}</dd></div><div><dt>Caídas</dt><dd>${st.falls || 0}</dd></div><div><dt>Cofres</dt><dd>${st.chests || 0}</dd></div><div><dt>Minutos</dt><dd>${mins}</dd></div></dl>
        <div class="row"><button class="btn" id="do-menu">Volver al inicio</button><button class="btn primary" id="do-again">${icon('stairs')} Nuevo descenso</button></div></div>`, 'dim red');
      s.querySelector('#do-again').onclick = () => { audio.sfx('ui'); this.screen(null); resolve('again'); };
      s.querySelector('#do-menu').onclick = () => { audio.sfx('ui'); this.screen(null); resolve('menu'); };
    });
  }
});
