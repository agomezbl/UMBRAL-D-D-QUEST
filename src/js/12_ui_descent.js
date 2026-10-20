/* ==========================================================================
   Interfaz del modo Descenso: mejoras del campamento
   y el final de la partida
   ========================================================================== */
Object.assign(UI, {
  descentSetup() { this.difficulty('descent'); },

  /* Más allá del segundo campamento: una mejora por héroe */
  boons() {
    return new Promise((resolve) => {
      const picks = {};
      const s = this.screen(`<div class="card talents boons"><div class="eyebrow">Ascenso · Campamento ${GAME.descent ? GAME.descent.camps : ''}</div><h2>La Hondura os ha endurecido</h2>
        <p class="lead">Cada héroe elige una mejora para el resto del descenso.</p>
        <div class="tal-grid">${GAME.party.map((id) => { const st = GAME.derive(id); return `<section class="tal-col" style="--hc:${HERO_DEFS[id].color}"><header><img src="${this.portraits[id] || ''}" alt=""><b>${HERO_DEFS[id].full}</b></header>
          ${this.statLine(st)}
          ${BOONS.map((bn) => `<button class="tal-opt boon" data-h="${id}" data-k="${bn.id}"><b>${icon(bn.icon)} ${bn.name}</b></button>`).join('')}</section>`; }).join('')}</div>
        <div class="row end"><button class="btn primary" id="tl-go" disabled>${icon('check')} Confirmar</button></div></div>`, 'dim');
      U.$$('.tal-opt', s).forEach((b) => (b.onclick = () => {
        picks[b.dataset.h] = b.dataset.k; audio.sfx('ui');
        U.$$(`.tal-opt[data-h="${b.dataset.h}"]`, s).forEach((q) => q.classList.toggle('sel', q === b));
        s.querySelector('#tl-go').disabled = GAME.party.some((id) => !picks[id]);
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
