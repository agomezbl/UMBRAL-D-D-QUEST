/* ==========================================================================
   Dados sobre el tablero: dónde caen, cómo se resuelven a la vista y los
   dados especiales (Destino y Tesoro). La suerte la decide el juego antes
   de tirar; los dados 3D solo la enseñan.
   ========================================================================== */
const DESTINY = {
  barbaro: { name: 'Rebote', short: 'Rebote: 1 dado contra otro enemigo' },
  enano: { name: 'Empujón', short: 'Empujón: lo apartas 1 casilla' },
  elfa: { name: 'Paso ligero', short: 'Paso ligero: +2 de movimiento' },
  hechicero: { name: 'Chispa', short: 'Chispa: una habilidad, 1 ronda antes' },
  amazona: { name: '¡Conmigo!', short: '¡Conmigo!: un aliado, +1 dado' }
};

Object.assign(GAME, {
  /* ¿Casilla libre para que caigan los dados? */
  diceTileOk(x, y) {
    const t = this.T(x, y); if (!t || !t.floor || t.wall || t.door || t.hazard || t.block) return false;
    const r = this.L.rooms[t.room]; return !!(r && r.revealed);
  },
  /* Dónde caen: delante de la pelea (hacia la cámara), los del atacante a su lado
     de la pantalla y los del defensor al otro, sin pisar muros ni figuras */
  diceLayout(att, tgt, nA, nD, withX) {
    const yaw = ENGINE.cam.yaw, fw = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), rt = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const ax = att ? att.x : tgt.x, ay = att ? att.y : tgt.y;
    // de cerca, entre los dos; a distancia, junto al objetivo (que es donde mira la cámara)
    const far = U.cheb(ax, ay, tgt.x, tgt.y) > 2, k = far ? 1 / Math.hypot(ax - tgt.x, ay - tgt.y) : 0.5;
    const mid = new THREE.Vector3((tgt.x + (ax - tgt.x) * k) * TILE, 0, (tgt.y + (ay - tgt.y) * k) * TILE);
    // el atacante, ¿a la derecha o a la izquierda en pantalla?
    const side = nD ? (Math.sign((ax - tgt.x) * rt.x + (ay - tgt.y) * rt.z) || -1) : 0;
    const GAP = 0.92, HALF = 1.2;
    const grid = (c, n, per) => {
      const out = [], rows = Math.ceil(n / per);
      for (let i = 0; i < n; i++) {
        const r = Math.floor(i / per), inRow = Math.min(per, n - r * per), k = i - r * per;
        out.push(c.clone().addScaledVector(rt, (k - (inRow - 1) / 2) * GAP + (Math.random() - 0.5) * 0.1).addScaledVector(fw, (r - (rows - 1) / 2) * GAP + (Math.random() - 0.5) * 0.1));
      }
      return out;
    };
    // un dado cabe si cae en suelo descubierto, lejos de las figuras; mejor si no queda detrás de un muro bajo
    const units = this.allUnits().filter((u) => u.mesh && u.mesh.visible && (u.side !== 'enemy' || u.alive));
    const cost = (p) => {
      const gx = Math.round(p.x / TILE), gy = Math.round(p.z / TILE);
      if (!this.diceTileOk(gx, gy)) return 1;
      if (units.some((u) => Math.hypot(u.mesh.position.x - p.x, u.mesh.position.z - p.z) < 1.2)) return 1;
      const fx = Math.round((p.x + fw.x * 1.3) / TILE), fy = Math.round((p.z + fw.z * 1.3) / TILE), ft = this.T(fx, fy);
      return !ft || ft.wall ? 0.3 : 0;
    };
    const rowsMax = Math.ceil(Math.max(nA, nD || 0) / 2), cands = [];
    for (const f of [1, 1.25, 1.5, 0.75, 1.75, 2, 0.5, 2.5, -1, -1.25, -1.5, -2]) for (const l of [0, 0.25, -0.25, 0.5, -0.5, 0.75, -0.75, 1, -1]) cands.push({ f, l, pref: Math.abs(f - 1.25) + Math.abs(l) * 0.6 + (f < 0 ? 3 : 0) });
    cands.sort((a, b) => a.pref - b.pref);
    let best = null;
    for (const c of cands) {
      const M = mid.clone().addScaledVector(fw, c.f * TILE).addScaledVector(rt, c.l * TILE);
      const sa = grid(side ? M.clone().addScaledVector(rt, side * HALF) : M, nA, nD ? 2 : 3);
      const sd = nD ? grid(M.clone().addScaledVector(rt, -side * HALF), nD, 2) : [];
      const x = withX ? M.clone().addScaledVector(fw, (rowsMax / 2) * GAP + 0.95) : null;
      const bad = sa.concat(sd, x ? [x] : []).reduce((n, p) => n + cost(p), 0) + c.pref * 0.01;
      if (!best || bad < best.bad) best = { sa, sd, x, M, bad };
      if (bad < 0.1) break;
    }
    return best;
  },
  diceFrom(u, fallback) {
    if (u && u.mesh) { const p = u.mesh.position, yaw = ENGINE.cam.yaw; return new THREE.Vector3(p.x + Math.sin(yaw) * 0.5, 2.1, p.z + Math.cos(yaw) * 0.5); }
    return fallback.clone().add(new THREE.Vector3(0, 4.5, 0));
  },
  faceIdx(type, f) { return DICE3D.faceOf(type, f === 'white' ? 'wshield' : f === 'black' ? 'bshield' : f); },
  /* Si algún dado va a caer fuera de la pantalla, la cámara se centra en ellos */
  diceInView(M, pts, margin = 0.1) {
    if (!SETTINGS.follow) return; // quien prefiere mover la cámara a mano tiene el cartel con el resultado
    const out = (p) => { const s = ENGINE.project(p.clone().setY(0.4)); return !s.visible || s.x < ENGINE.w * margin || s.x > ENGINE.w * (1 - margin) || s.y < ENGINE.h * 0.12 || s.y > ENGINE.h * 0.86; };
    if ([M].concat(pts || []).some(out)) ENGINE.focusTile(M.x / TILE, M.z / TILE);
  },

  /* Tirada de combate a la vista: ataque contra defensa (y el Dado del Destino si toca) */
  async combatRoll(r) {
    const { att, tgt, A, D, shieldFace, quick } = r, ignore = r.ignore || 0;
    DICE3D.setView(ENGINE.cam.yaw); DICE3D.clear();
    const aType = !att || att.side !== 'enemy' ? 'combat' : 'foe', dType = tgt.side === 'hero' ? 'combat' : 'foe';
    const { sa, sd, x: sx, M } = this.diceLayout(att, tgt, A.length, D.length, !!r.destiny);
    this.diceInView(M, sa.concat(sd, sx ? [sx] : []), quick ? 0.02 : 0.1);
    const fA = this.diceFrom(att, sa[0]), fD = this.diceFrom(tgt, sd[0] || M);
    const list = A.map((f, i) => ({ type: aType, face: this.faceIdx(aType, f), from: fA, to: sa[i], delay: i * 45, owner: 'a' }))
      .concat(D.map((f, i) => ({ type: dType, face: this.faceIdx(dType, f), from: fD, to: sd[i], delay: 110 + i * 45, owner: 'd' })));
    if (r.destiny) list.push({ type: 'destiny', face: DICE3D.faceOf('destiny', r.destiny), from: fA, to: sx, delay: 200, owner: 'x' });
    const dice = await DICE3D.throw(list, { dur: quick ? 560 : 820, height: quick ? 1.8 : 2.4 });
    const ad = dice.filter((d) => d.owner === 'a'), dd = dice.filter((d) => d.owner === 'd'), xd = dice.find((d) => d.owner === 'x');
    const sk = shieldFace === 'white' ? 'wshield' : 'bshield';
    const hits = ad.filter((d) => d.kind === 'skull'), shields = dd.filter((d) => d.kind === sk);
    const broken = shields.slice(0, Math.min(ignore, shields.length)), blocks = shields.slice(broken.length);
    const dmg = Math.max(0, hits.length - blocks.length);
    UI.rollPlaque({ caption: r.caption, mods: r.mods, aType, dType, shieldFace: sk, skulls: hits.length, shields: shields.length, broken: broken.length, dmg, destiny: r.destiny, att });
    const fx = [...hits.map((d) => DICE3D.glow(d, '#ff9a5a')), ...ad.filter((d) => d.kind !== 'skull').map((d) => DICE3D.dim(d)),
      ...blocks.map((d) => DICE3D.glow(d, '#8fc6ff')), ...broken.map((d) => DICE3D.dim(d)), ...dd.filter((d) => d.kind !== sk).map((d) => DICE3D.dim(d))];
    if (xd) fx.push(r.destiny === 'comedy' ? DICE3D.glow(xd, '#ffd060', 1.6) : r.destiny === 'tragedy' ? DICE3D.glow(xd, '#ff3a5a', 1.6) : DICE3D.dim(xd));
    await Promise.all(fx);
    // cada escudo apaga una calavera: una chispa azul va del escudo a la calavera
    const n = Math.min(hits.length, blocks.length);
    for (let i = 0; i < n; i++) {
      const s = blocks[i], k = hits[hits.length - 1 - i];
      if (!quick) await this.diceSpark(s.group.position, k.group.position);
      DICE3D.dim(s); DICE3D.dim(k);
      audio.sfx('block', { vol: 0.45 });
    }
    DICE3D.clearLater(quick ? 1400 : 2200); UI.plaqueDone(quick ? 1400 : 2200);
    return { dice, xd, dmg };
  },
  diceSpark(a, b) {
    const m = new THREE.Mesh(G.sph(0.1, 10, 8), MAT.glow('#8fc6ff', 3));
    const p0 = a.clone().setY(0.6), p1 = b.clone().setY(0.6);
    m.position.copy(p0); ENGINE.scene.add(m);
    return U.tween(210, (k) => { m.position.lerpVectors(p0, p1, k); m.position.y += Math.sin(k * Math.PI) * 0.5; })
      .then(() => { ENGINE.scene.remove(m); FX.burst('block', p1); });
  },
  /* Tirada simple (cerraduras, sellos, trampas): calaveras contra lo que hace falta */
  async checkRoll(u, dice, need, o = {}) {
    DICE3D.setView(ENGINE.cam.yaw); DICE3D.clear();
    const { sa, M } = this.diceLayout(u, o.at || u, dice.length, 0, false);
    this.diceInView(M, sa);
    const got = await DICE3D.throw(dice.map((f, i) => ({ type: 'combat', face: this.faceIdx('combat', f), from: this.diceFrom(u, M), to: sa[i], delay: i * 50 })), { dur: 800 });
    const sk = got.filter((d) => d.kind === 'skull'), have = (o.have || 0) + sk.length, ok = have >= need;
    UI.checkPlaque({ caption: o.label || 'Tirada', skulls: sk.length, have, need, ok, cumulative: o.have != null });
    audio.sfx(ok ? 'turnHero' : 'deny', { vol: 0.5 });
    await Promise.all([...sk.map((d) => DICE3D.glow(d, '#ff9a5a')), ...got.filter((d) => d.kind !== 'skull').map((d) => DICE3D.dim(d))]);
    DICE3D.clearLater(2000); UI.plaqueDone(2000);
    return { ok, have };
  },

  /* ---------------- Dado del Destino ---------------- */
  rollDestiny() { return DICE3D.roll('destiny').kind; },
  async destinyEffect(h, kind, tgt) {
    if (!kind || kind === 'blank' || !this.up(h)) return;
    const head = this.headPos(h);
    this.stats.destiny = this.stats.destiny || { comedy: 0, tragedy: 0 };
    UI.hintOnce('destiny');
    if (kind === 'tragedy') {
      this.stats.destiny.tragedy++;
      const bossOn = this.boss && this.boss.alive && this.boss.active;
      audio.sfx('whisper', { dur: 0.8, vol: 0.6 });
      if (!bossOn) { this.addDoom(1); FX.text(head, '+1 Presagio', 'warn'); UI.log(`Máscara trágica: el ruido de ${h.name} atrae a la Hondura (+1 Presagio).`, 'bad'); }
      else { h.mvLeft = 0; FX.text(head, 'Desequilibrado', 'warn'); UI.log(`Máscara trágica: ${h.name} pierde el equilibrio y el movimiento que le quedaba.`, 'bad'); }
      UI.refresh(); return;
    }
    this.stats.destiny.comedy++;
    const D = DESTINY[h.id] || { name: 'Suerte' };
    audio.sfx('levelUp', { vol: 0.5 }); FX.burst('magic', h.mesh.position, { color: '#ffd060', color2: '#ffb000' });
    FX.text(head, D.name, 'heal');
    const say = (t) => UI.plaqueDestiny(`<b class="good">Máscara alegre</b> · ${t}`);
    const inspire = (u, why) => { u.status.inspirado = Math.max(u.status.inspirado || 0, 2); FX.text(this.headPos(u), 'Inspirado', 'heal'); UI.log(why, 'good'); say(h.id === 'amazona' ? `${D.name}: ${u === h ? 'Inspirada' : U.esc(u.name) + ' queda Inspirado'}, +1 dado en ${u === h ? 'tu' : 'su'} próximo ataque` : 'En su lugar, Inspirado: +1 dado en tu próximo ataque'); };
    if (h.id === 'barbaro') {
      const others = this.visibleEnemies().filter((e) => e !== tgt && U.cheb(e.x, e.y, tgt.x, tgt.y) <= 1 && U.cheb(e.x, e.y, h.x, h.y) <= 2);
      const t2 = others.sort((a, b) => a.hp - b.hp)[0] || (this.up(tgt) ? tgt : null);
      if (t2) { say(`Rebote: 1 dado contra ${U.esc(t2.name)}`); UI.log(`Máscara alegre: el hachazo de ${h.name} rebota hacia ${t2.name}.`, 'good'); await U.sleep(700); await this.diceHit(h.name, t2, 1, { label: 'Rebote', by: h }); }
      else inspire(h, `Máscara alegre: ${h.name} queda Inspirado.`);
    } else if (h.id === 'enano') {
      const dx = Math.sign(tgt.x - h.x), dy = Math.sign(tgt.y - h.y), nx = tgt.x + dx, ny = tgt.y + dy;
      if (this.up(tgt) && !tgt.boss && (dx || dy) && this.passable(nx, ny, { side: 'enemy' }) && !this.unitAt(nx, ny)) {
        audio.sfx('quake', { vol: 0.5 }); ENGINE.shake(0.3);
        say(`Empujón: ${U.esc(tgt.name)} retrocede una casilla`);
        await this.hop(tgt, nx, ny, { dur: 220, h: 0.2 }); this.faceTo(tgt, h.x, h.y);
        UI.log(`Máscara alegre: ${h.name} aparta a ${tgt.name} de un empujón.`, 'good');
      } else inspire(h, `Máscara alegre: ${h.name} queda Inspirado.`);
    } else if (h.id === 'elfa') {
      h.mvLeft += 2; say('Paso ligero: +2 de movimiento'); FX.text(new THREE.Vector3(head.x, head.y + 0.5, head.z), '+2 movimiento', 'heal');
      UI.log(`Máscara alegre: ${h.name} gana +2 de movimiento este turno.`, 'good');
    } else if (h.id === 'hechicero') {
      const s = h.skills.filter((q) => q.cd > 0).sort((a, b) => b.cd - a.cd)[0];
      if (s) { s.cd--; say(`Chispa: ${U.esc(s.name)} estará lista una ronda antes`); UI.log(`Máscara alegre: ${s.name} estará lista una ronda antes.`, 'good'); }
      else inspire(h, `Máscara alegre: ${h.name} queda Inspirado.`);
    } else if (h.id === 'amazona') {
      const al = this.heroes.filter((a) => a !== h && !a.ko && U.cheb(a.x, a.y, h.x, h.y) <= 3).sort((a, b) => U.cheb(a.x, a.y, h.x, h.y) - U.cheb(b.x, b.y, h.x, h.y))[0];
      inspire(al || h, `Máscara alegre: ${(al || h).name} queda Inspirado (+1 dado en su próximo ataque).`);
    }
    UI.refresh();
  },

  /* ---------------- Dado del Tesoro (Buscar) ---------------- */
  async treasureRoll(h, safe) {
    DICE3D.setView(ENGINE.cam.yaw); DICE3D.clear();
    let r = DICE3D.roll('treasure');
    if (safe && r.kind === 'danger') r = { i: DICE3D.faceOf('treasure', 'gold'), kind: 'gold' };
    const { sa, M } = this.diceLayout(h, h, 1, 0, false);
    this.diceInView(M, sa);
    const [d] = await DICE3D.throw([{ type: 'treasure', face: r.i, from: this.diceFrom(h, M), to: sa[0] }], { dur: 900 });
    const good = r.kind === 'gold' || r.kind === 'potion' || r.kind === 'item';
    await DICE3D.glow(d, good ? '#ffd060' : r.kind === 'danger' ? '#ff3a5a' : '#bbbbbb', 1.4);
    DICE3D.hop(d);
    return r.kind;
  }
});
