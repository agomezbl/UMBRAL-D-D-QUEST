/* ==========================================================================
   Cartel del resultado: en cuanto los dados se paran, dice en grande lo que
   ha salido (calaveras − escudos = daño, la máscara del Destino, el tesoro)
   ========================================================================== */
Object.assign(UI, {
  _fi: {},
  faceImg(type, face) {
    const k = type + ':' + face;
    if (!this._fi[k]) this._fi[k] = DICE3D.faceTexture(type, face).image.toDataURL();
    return `<img class="fi" src="${this._fi[k]}" alt="">`;
  },
  plaque(caption, main, cls = '') {
    const p = this.$('plaque'); clearTimeout(this._pqT);
    p.className = 'plaque plate ' + cls;
    p.innerHTML = `<div class="pq-cap">${caption}</div><div class="pq-main">${main}</div><div class="pq-sub"></div>`;
    p.hidden = false; this.placePlaque(p); void p.offsetWidth; p.classList.add('in');
    document.body.classList.add('pq-on');
  },
  /* En el móvil en vertical va abajo; si el panel del tutorial ocupa esa zona, justo encima de él */
  placePlaque(p) {
    p.style.bottom = '';
    if (!window.matchMedia('(max-width: 820px)').matches) return;
    const t = this.$('tutor'); if (!t || t.hidden) return;
    const r = t.getBoundingClientRect();
    if (r.height && r.top > window.innerHeight * 0.35) p.style.bottom = Math.round(window.innerHeight - r.top + 10) + 'px';
  },
  plaqueSub(html, cls = '') { const s = this.$('plaque').querySelector('.pq-sub'); if (s) s.insertAdjacentHTML('beforeend', `<p class="${cls}">${html}</p>`); },
  /* La máscara alegre dice al final qué ha pasado de verdad */
  plaqueDestiny(html) { const e = this.$('plaque').querySelector('.pq-destiny span'); if (e) e.innerHTML = html; },
  plaqueDone(ms = 1800) { clearTimeout(this._pqT); this._pqT = setTimeout(() => this.plaqueHide(), ms / (U.speed || 1)); },
  plaqueHide() { clearTimeout(this._pqT); const p = this.$('plaque'); if (p) p.hidden = true; document.body.classList.remove('pq-on'); },

  /* Ataque: calaveras − escudos = daño, y la máscara si se tiró el Destino */
  rollPlaque(r) {
    const fi = (t, f) => this.faceImg(t, f), blocks = r.shields - r.broken;
    const foe = r.att && r.att.side === 'enemy';
    const mods = r.mods && r.mods.length ? ` <span class="pq-mods">${r.mods.map(([t, v]) => `<em class="${v > 0 ? 'up' : 'down'}">${v > 0 ? '+' : ''}${v} ${U.esc(t)}</em>`).join('')}</span>` : '';
    this.plaque(r.caption + mods,
      `${fi(r.aType, 'skull')}<b class="n">×${r.skulls}</b><i>−</i>${fi(r.dType, r.shieldFace)}<b class="n">×${blocks}</b><i>=</i>${r.dmg ? `<b class="dmg">${L(`${r.dmg} de daño`, `${r.dmg} dégât${r.dmg > 1 ? 's' : ''}`)}</b>` : `<b class="none">${L('Sin daño', 'Aucun dégât')}</b>`}`,
      (r.dmg ? 'hit' : 'miss') + (foe ? ' foe' : ''));
    if (r.broken) this.plaqueSub(`${fi(r.dType, r.shieldFace)}<span>${L(`${r.broken === 1 ? 'Un escudo no cuenta' : `${r.broken} escudos no cuentan`}: ${r.att && r.att.traits && r.att.traits.shieldbreaker ? 'rompe-escudos' : 'tiro certero'}`, `${r.broken === 1 ? 'Un bouclier ne compte pas' : `${r.broken} boucliers ne comptent pas`} : ${r.att && r.att.traits && r.att.traits.shieldbreaker ? 'brise-boucliers' : 'tir précis'}`)}</span>`, 'none');
    if (r.destiny) {
      const D = DESTINY[r.att.id] || { name: L('Suerte', 'Chance') };
      const bossOn = GAME.boss && GAME.boss.alive && GAME.boss.active;
      if (r.destiny === 'comedy') this.plaqueSub(`${fi('destiny', 'comedy')}<span><b class="good">${L('Máscara alegre', 'Masque joyeux')}</b> · ${D.name}…</span>`, 'good pq-destiny');
      else if (r.destiny === 'tragedy') this.plaqueSub(`${fi('destiny', 'tragedy')}<span><b class="bad">${L('Máscara triste', 'Masque triste')}</b> · ${bossOn ? L('Desequilibrado: pierdes el movimiento', 'Déséquilibré : tu perds ton déplacement') : L('Ruido: +1 Presagio', 'Bruit : +1 Présage')}</span>`, 'bad pq-destiny');
      else this.plaqueSub(`${fi('destiny', 'blank')}<span>${L('Destino en blanco: nada más', 'Destin vierge : rien de plus')}</span>`, 'none pq-destiny');
    }
  },
  /* Cerraduras, sellos y trampas: calaveras que hacen falta */
  checkPlaque(r) {
    const fi = this.faceImg('combat', 'skull');
    const verdict = r.ok ? `<b class="good">${L('Conseguido', 'Réussi')}</b>` : r.cumulative && r.have > 0 ? `<b class="none">${L('Aún no', 'Pas encore')}</b>` : `<b class="bad">${L('Fallo', 'Échec')}</b>`;
    this.plaque(`<b>${U.esc(r.caption)}</b> · ${L(`hacen falta ${r.need} calavera${r.need === 1 ? '' : 's'}`, `il faut ${r.need} crâne${r.need > 1 ? 's' : ''}`)}`, `${fi}<b class="n">×${r.skulls}</b><i>→</i>${verdict}`, r.ok ? 'hit' : 'miss');
    if (r.cumulative && r.have !== r.skulls) this.plaqueSub(`<span>${r.ok ? L('Con lo de antes, basta', 'Avec les précédents, ça suffit') : L(`Con lo de antes, lleváis ${r.have} de ${r.need}`, `Avec les précédents, vous en êtes à ${r.have} sur ${r.need}`)}</span>`, 'none');
  },
  /* Buscar: la cara del Dado del Tesoro */
  treasurePlaque(h, kind, text) {
    const good = kind === 'gold' || kind === 'potion' || kind === 'item';
    this.plaque(L(`<b>${U.esc(h.name)} busca</b> · Dado del Tesoro`, `<b>${U.esc(h.name)} fouille</b> · Dé du Trésor`), `${this.faceImg('treasure', kind)}<b class="${good ? 'good' : kind === 'danger' ? 'bad' : 'none'}">${text}</b>`, good ? 'hit' : 'miss');
  }
});
