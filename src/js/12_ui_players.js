/* ==========================================================================
   Interfaz del cooperativo en el mismo aparato: reparto de héroes entre
   jugadores y la pantalla de «pásale el aparato»
   ========================================================================== */
Object.assign(UI, {
  /* Elegir cuántos juegan, sus nombres y quién lleva a cada héroe */
  playersSetup(party, o = {}) {
    return new Promise((resolve) => {
      let n = Math.max(1, Math.min(3, o.n || 2));
      const names = [0, 1, 2].map((i) => (o.players && o.players[i] && o.players[i].name) || (U.store.get('umbral.players.names', [])[i]) || `Jugador ${i + 1}`);
      const owner = {};
      party.forEach((id, i) => (owner[id] = o.owner && o.owner[id] != null ? o.owner[id] : i % Math.max(1, n)));
      const s = this.screen(`<div class="card players"><div class="eyebrow">En el mismo aparato</div><h2>¿Quién juega?</h2>
        <p class="lead">Cada jugador lleva a sus héroes. Cuando le toque a un héroe de otro, el juego pedirá pasar el móvil o la tableta. Se puede cambiar en cualquier momento desde la pausa.</p>
        <div class="pl-n" role="group" aria-label="Número de jugadores">${[1, 2, 3].map((k) => `<button class="pl-nb" data-n="${k}">${k} ${k === 1 ? 'jugador' : 'jugadores'}</button>`).join('')}</div>
        <div class="pl-names"></div>
        <div class="pl-heroes"></div>
        <div class="row"><button class="btn" id="pl-back">${o.back ? 'Cancelar' : 'Volver'}</button><span class="pl-msg"></span><button class="btn primary" id="pl-go">${icon('check')} Listo</button></div></div>`, o.back ? 'dim players-screen' : 'dim title-screen players-screen');
      const fix = () => party.forEach((id) => { if (owner[id] >= n) owner[id] = n - 1; });
      const render = () => {
        fix();
        U.$$('.pl-nb', s).forEach((b) => b.classList.toggle('sel', +b.dataset.n === n));
        s.querySelector('.pl-names').innerHTML = n > 1 ? Array.from({ length: n }, (_, i) => `<label class="pl-name pc${i}"><span>Jugador ${i + 1}</span><input maxlength="16" data-i="${i}" value="${U.esc(names[i])}" autocomplete="off"></label>`).join('') : '';
        s.querySelector('.pl-heroes').innerHTML = n > 1 ? party.map((id) => `<div class="pl-hero" style="--hc:${HERO_DEFS[id].color}"><img src="${this.portraits[id] || ''}" alt=""><b>${HERO_DEFS[id].name}</b><span class="pl-who">${Array.from({ length: n }, (_, i) => `<button class="pl-to pc${i} ${owner[id] === i ? 'on' : ''}" data-h="${id}" data-i="${i}" aria-pressed="${owner[id] === i}">${U.esc(names[i])}</button>`).join('')}</span></div>`).join('') : `<p class="pl-solo">${icon('crown')} Un solo jugador lleva a los tres héroes.</p>`;
        const empty = n > 1 ? Array.from({ length: n }, (_, i) => i).filter((i) => !party.some((id) => owner[id] === i)) : [];
        s.querySelector('.pl-msg').textContent = empty.length ? `${empty.map((i) => names[i]).join(' y ')} no lleva a nadie.` : '';
        s.querySelector('#pl-go').disabled = empty.length > 0;
        U.$$('.pl-name input', s).forEach((inp) => (inp.oninput = () => { names[+inp.dataset.i] = inp.value; U.$$(`.pl-to[data-i="${inp.dataset.i}"]`, s).forEach((b) => (b.textContent = inp.value || `Jugador ${+inp.dataset.i + 1}`)); }));
        U.$$('.pl-to', s).forEach((b) => (b.onclick = () => { owner[b.dataset.h] = +b.dataset.i; audio.sfx('ui'); render(); }));
      };
      U.$$('.pl-nb', s).forEach((b) => (b.onclick = () => { n = +b.dataset.n; if (n > 1 && party.every((id) => owner[id] === 0)) party.forEach((id, i) => (owner[id] = i % n)); audio.sfx('ui'); render(); }));
      render();
      s.querySelector('#pl-back').onclick = () => { audio.sfx('uiBack'); resolve(null); };
      s.querySelector('#pl-go').onclick = () => {
        audio.sfx('ui');
        const players = Array.from({ length: n }, (_, i) => ({ name: (names[i] || '').trim() || `Jugador ${i + 1}` }));
        U.store.set('umbral.players.names', names.slice(0, 3)); U.store.set('umbral.players.n', n);
        resolve({ players, owner: n > 1 ? Object.assign({}, owner) : {} });
      };
    });
  },

  /* Pásale el aparato: tapa el tablero hasta que el siguiente jugador lo coge */
  handoffOpen: false,
  handoff(p, h) {
    if (this.handoffOpen) { this.handoffDone(true); }
    this.handoffOpen = true; GAME.busy++;
    const name = U.esc(GAME.playerName(p));
    const mine = GAME.heroes.filter((q) => GAME.heroOwner(q.id) === p);
    const s = this.screen(`<div class="card handoff pc${p}"><div class="eyebrow">Ronda ${GAME.round} · en el mismo aparato</div>
      <h2>Turno de ${name}</h2>
      <div class="ho-heroes">${mine.map((q) => `<span class="${q.ended || q.ko ? 'done' : ''}" style="--hc:${HERO_DEFS[q.id].color}"><img src="${this.portraits[q.id] || ''}" alt="">${HERO_DEFS[q.id].name}${q.ko ? ' <small>caído</small>' : q.ended ? ' <small>ya actuó</small>' : ''}</span>`).join('')}</div>
      <p class="lead">Pásale el aparato a ${name}. Empieza con ${U.esc(h.name)}.</p>
      <button class="btn primary" id="ho-go">${icon('play')} Soy ${name}: a jugar</button></div>`, 'dim handoff-screen');
    audio.sfx('turnHero');
    s.querySelector('#ho-go').onclick = () => this.handoffDone();
  },
  handoffDone(silent) {
    if (!this.handoffOpen) return;
    this.handoffOpen = false;
    GAME.busy = Math.max(0, GAME.busy - 1);
    this.screen(null);
    if (!silent) { audio.sfx('ui'); const h = GAME.active; if (h) ENGINE.focusTile(h.x, h.y); }
    UI.refresh();
  }
});
