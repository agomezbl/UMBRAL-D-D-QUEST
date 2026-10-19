/* ==========================================================================
   Cooperativo en el mismo aparato: cada jugador lleva sus héroes y el
   aparato pasa de mano en mano cuando le toca a un héroe de otro jugador
   ========================================================================== */
Object.assign(GAME, {
  players: [{ name: 'Jugador 1' }], owner: {}, curPlayer: -1,
  isMulti() { return !!(this.players && this.players.length > 1); },
  heroOwner(id) { const o = (this.owner || {})[id] || 0; return o < this.players.length ? o : 0; },
  playerName(i) { return (this.players[i] && this.players[i].name) || `Jugador ${i + 1}`; },
  setPlayers(players, owner) {
    this.players = players && players.length ? players.slice(0, 3).map((p, i) => ({ name: String((p && p.name) || '').trim().slice(0, 16) || `Jugador ${i + 1}` })) : [{ name: 'Jugador 1' }];
    this.owner = Object.assign({}, owner || {});
    this.curPlayer = -1;
  },
  heroFor(p) { return this.heroes.find((h) => !h.ended && !h.ko && this.heroOwner(h.id) === p) || null; },
  /* Cada ronda empieza un jugador distinto, para que nadie abra siempre */
  firstHeroForRound() {
    const n = this.players.length, start = Math.max(0, this.round - 1) % n;
    for (let i = 0; i < n; i++) { const h = this.heroFor((start + i) % n); if (h) return h; }
    return this.heroes.find((h) => !h.ended && !h.ko) || null;
  }
});
