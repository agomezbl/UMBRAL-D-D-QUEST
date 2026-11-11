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
      const s = this.screen(`<div class="card talents boons"><div class="eyebrow">${L('Ascenso · Campamento', 'Ascension · Campement')} ${GAME.descent ? GAME.descent.camps : ''}</div><h2>${L('La Hondura os ha endurecido', 'Les Tréfonds vous ont endurcis')}</h2>
        <p class="lead">${L('Cada héroe elige una mejora para el resto del descenso.', 'Chaque héros choisit une amélioration pour le reste de la descente.')}</p>
        <div class="tal-grid">${GAME.party.map((id) => { const st = GAME.derive(id); return `<section class="tal-col" style="--hc:${HERO_DEFS[id].color}"><header><img src="${this.portraits[id] || ''}" alt=""><b>${HERO_DEFS[id].full}</b></header>
          ${this.statLine(st)}
          ${BOONS.map((bn) => `<button class="tal-opt boon" data-h="${id}" data-k="${bn.id}"><b>${icon(bn.icon)} ${bn.name}</b></button>`).join('')}</section>`; }).join('')}</div>
        <div class="row end"><button class="btn primary" id="tl-go" disabled>${icon('check')} ${L('Confirmar', 'Confirmer')}</button></div></div>`, 'dim');
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
      const s = this.screen(`<div class="card victory descent-over"><div class="eyebrow">${L('Fin del descenso', 'Fin de la descente')} · ${U.esc(DIFFICULTY[o.difficulty].name)}</div>
        <h2>${L('Nivel', 'Niveau')} ${o.depth}</h2>
        <p class="lead">${o.record ? `${icon('crown')} ${L('¡Nuevo récord! Nadie de la Orden había bajado tanto.', "Nouveau record ! Personne de l'Ordre n'était descendu aussi bas.")}` : L(`Vuestro récord sigue en el nivel ${best}.`, `Votre record reste au niveau ${best}.`)}</p>
        <div class="do-party">${o.party.map((id) => `<span style="--hc:${HERO_DEFS[id].color}"><img src="${this.portraits[id] || ''}" alt="">${HERO_DEFS[id].name}</span>`).join('')}</div>
        <dl class="stats"><div><dt>${L('Criaturas abatidas', 'Créatures vaincues')}</dt><dd>${st.kills || 0}</dd></div><div><dt>${L('Oro reunido', 'Or amassé')}</dt><dd>${st.gold || 0}</dd></div><div><dt>${L('Rondas', 'Manches')}</dt><dd>${st.rounds || 0}</dd></div><div><dt>${L('Caídas', 'Chutes')}</dt><dd>${st.falls || 0}</dd></div><div><dt>${L('Cofres', 'Coffres')}</dt><dd>${st.chests || 0}</dd></div><div><dt>${L('Minutos', 'Minutes')}</dt><dd>${mins}</dd></div></dl>
        <div class="row"><button class="btn" id="do-menu">${L('Volver al inicio', "Retour à l'accueil")}</button><button class="btn primary" id="do-again">${icon('stairs')} ${L('Nuevo descenso', 'Nouvelle descente')}</button></div></div>`, 'dim red');
      s.querySelector('#do-again').onclick = () => { audio.sfx('ui'); this.screen(null); resolve('again'); };
      s.querySelector('#do-menu').onclick = () => { audio.sfx('ui'); this.screen(null); resolve('menu'); };
    });
  }
});
