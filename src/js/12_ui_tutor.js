/* ==========================================================================
   Tutorial guiado: un panel que enseña paso a paso sobre el propio tablero.
   Espera a que el jugador haga cada cosa, señala dónde tocar y explica las
   reglas justo cuando aparecen (dados, Determinación, ataques de oportunidad…)
   ========================================================================== */
const TUTOR = {
  active: false, installed: false, i: -1, steps: [], flags: {}, said: {},

  /* ---------------- enganches: el juego avisa al tutorial de lo que pasa ---------------- */
  install() {
    if (this.installed) return;
    this.installed = true;
    const T = this;
    const after = (obj, name, fn) => {
      const f = obj[name];
      obj[name] = function (...a) {
        const r = f.apply(this, a);
        if (r && typeof r.then === 'function') return r.then((v) => { T.safe(() => fn.call(this, v, ...a)); return v; });
        T.safe(() => fn.call(this, r, ...a)); return r;
      };
    };
    const before = (obj, name, fn) => { const f = obj[name]; obj[name] = function (...a) { T.safe(() => fn.call(this, ...a)); return f.apply(this, a); }; };
    after(GAME, 'moveHero', (ok, h) => T.emit('moved', { h }));
    after(GAME, 'heroAttack', (r, h, e) => T.emit('attack', { h, e }));
    after(GAME, 'useSkill', (r, h, s) => T.emit('skill', { h, s }));
    before(GAME, 'shadowPhase', () => T.emit('shadow'));
    after(GAME, 'startRound', () => T.emit('round'));
    after(GAME, 'openDoor', (r, door) => T.emit('door', { door }));
    // una cerradura solo «falla» si se gastó la acción (cancelar la elección no cuenta)
    before(GAME, 'tryLock', (h) => { T._lockAct = h ? h.actions : 0; });
    after(GAME, 'tryLock', (r, h, door) => { if (h && door && h.actions < T._lockAct) T.emit('lock', { h, door, ok: !door.lock }); });
    after(GAME, 'openChest', () => T.emit('chest'));
    before(GAME, 'kill', (u) => { if (u && u.side === 'hero' && !u.ko) T.emit('down', { u }); });
    before(GAME, 'reactions', function (m, ax, ay, bx, by) { if (m && m.side === 'hero' && this.reactorsFor(m).some((r) => this.provokes(m, r, ax, ay, bx, by))) T.emit('oa', { m }); });
    before(UI, 'offerDet', () => T.emit('detOffer'));
    after(UI, 'preview', (r, d) => { if (d && d.unit && d.unit.side === 'enemy') T.emit('peek'); });
    // cámara movida por el jugador (arrastrar, rueda, teclas)
    ['panWorld', 'pan', 'rotate', 'zoom', 'tilt'].forEach((k) => before(ENGINE, k, () => T.emit('cam')));
    // piezas de la interfaz
    const panel = U.el('div', 'plate', `
      <div class="tu-top"><span class="eyebrow">Tutorial · <b class="tu-n"></b></span><button class="tu-exit" type="button">Salir del tutorial</button></div>
      <div class="tu-bar"><i></i></div>
      <h4 class="tu-title"></h4>
      <p class="tu-text"></p>
      <p class="tu-aside" hidden></p>
      <div class="tu-foot"><span class="tu-wait">${icon('hand')} Hazlo para seguir</span><button class="tu-pass" type="button">Saltar paso</button><button class="btn small primary tu-next" type="button">${icon('check')} Entendido</button></div>`);
    panel.id = 'tutor'; panel.hidden = true; panel.setAttribute('aria-live', 'polite');
    const ring = U.el('div', '', ''); ring.id = 'tu-ring'; ring.hidden = true;
    const arrow = U.el('div', '', '<span></span><i></i>'); arrow.id = 'tu-arrow'; arrow.hidden = true;
    document.body.append(panel, ring, arrow);
    this.el = { panel, ring, arrow, n: panel.querySelector('.tu-n'), bar: panel.querySelector('.tu-bar i'), title: panel.querySelector('.tu-title'), text: panel.querySelector('.tu-text'), aside: panel.querySelector('.tu-aside'), wait: panel.querySelector('.tu-wait'), pass: panel.querySelector('.tu-pass'), next: panel.querySelector('.tu-next'), exit: panel.querySelector('.tu-exit') };
    // el panel no debe dejar pasar el toque al tablero
    panel.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.el.next.onclick = (e) => { e.stopPropagation(); audio.sfx('ui'); this.complete(true); };
    this.el.pass.onclick = (e) => { e.stopPropagation(); audio.sfx('uiBack'); this.complete(true); };
    this.el.exit.onclick = (e) => { e.stopPropagation(); audio.sfx('uiBack'); UI.title(); };
  },
  safe(fn) { try { fn(); } catch (e) { console.error('tutor', e); } },

  /* ---------------- ciclo de vida ---------------- */
  prepare() { this.install(); this.stop(); },
  begin() {
    this.install();
    this.flags = {}; this.said = {};
    this.steps = this.makeSteps();
    this.active = true;
    this.go(0);
    clearInterval(this._iv); this._iv = setInterval(() => this.poll(), 250);
    cancelAnimationFrame(this._raf); const loop = () => { if (!this.active) return; this.tick(); this._raf = requestAnimationFrame(loop); }; loop();
  },
  stop() {
    this.active = false; this.i = -1;
    clearInterval(this._iv); cancelAnimationFrame(this._raf); clearTimeout(this._doneT); clearTimeout(this._asideT);
    if (this.el) { this.el.panel.hidden = true; this.el.ring.hidden = true; this.el.arrow.hidden = true; this.el.panel.style.bottom = ''; }
  },

  /* ---------------- pasos ---------------- */
  makeSteps() {
    const T = U.isTouch(), tap = T ? 'Toca' : 'Haz clic en', L = GAME.L;
    const door1 = L.doors.find((d) => d.x === 6 && d.y === 3), door2 = L.doors.find((d) => d.x === 14 && d.y === 3), chest = L.chests[0];
    const H = (id) => GAME.heroes.find((h) => h.id === id);
    const foes = () => GAME.enemies.filter((e) => e.alive && (e.kind === 'dummy' || e.kind === 'dummyArcher'));
    const nearest = () => { const a = GAME.active || GAME.heroesUp()[0]; const f = foes().filter((e) => e.active); if (!a || !f.length) return null; return f.sort((p, q) => U.cheb(a.x, a.y, p.x, p.y) - U.cheb(a.x, a.y, q.x, q.y))[0]; };
    const sheetOpen = () => !UI.$('sheet').hidden;
    const cam = ENGINE.cam.t;
    this.refs = { door1, door2, chest, foes };
    return [
      { id: 'party', title: 'Tu grupo', ring: '#party', next: true,
        text: 'Estos son tus tres héroes. Cada uno juega su turno por separado: el del borde iluminado es el que mueves ahora, Aldric. La barra roja es su vida.' },
      { id: 'move', title: 'Moverse', arrow: () => ({ x: 4, y: 3 }), label: 'Aquí', skipIf: () => this.flags.moved,
        text: T ? 'Las casillas iluminadas son las que alcanza Aldric este turno. Toca una para ver la ruta y vuelve a tocarla para confirmar.' : 'Las casillas iluminadas son las que alcanza Aldric este turno. Pasa el ratón para ver la ruta y haz clic para moverle.',
        on: { moved: true } },
      { id: 'undo', title: 'Deshacer', ring: '#undo-move', next: true, skipIf: () => !GAME.undo,
        text: '¿Te has equivocado? Mientras no descubras nada nuevo, «Deshacer movimiento» devuelve al héroe a donde estaba. Muy útil con el dedo.' },
      { id: 'camera', title: 'Mira a tu alrededor', next: true,
        start: () => { this._cam0 = { yaw: cam.yaw, dist: cam.dist }; this.flags.cam = false; },
        until: () => this.flags.cam || Math.abs(cam.yaw - this._cam0.yaw) > 0.3 || Math.abs(cam.dist - this._cam0.dist) > 2.5,
        text: T ? 'Arrastra el tablero con un dedo para mover la cámara, pellizca para acercarte y gira con dos dedos. Pruébalo.' : 'Arrastra el tablero para mover la cámara, usa la rueda para acercarte y gira con el botón derecho (o con Q y E). Pruébalo.' },
      { id: 'switch', title: 'Cambiar de héroe', ring: '.hero-card[data-hero="sera"]', skipIf: () => door1.open || H('sera').ended,
        text: `No hace falta que Aldric termine. ${tap} el retrato de Sera para manejarla a ella${T ? '' : ' (o pulsa Tab)'}.`,
        until: () => GAME.active && GAME.active.id === 'sera' },
      { id: 'door', title: 'Abrir puertas', arrow: () => door1, label: 'Puerta', focus: true, skipIf: () => door1.open,
        text: `Las salas están ocultas hasta que abres su puerta. ${tap} la puerta: el héroe se acerca y la abre. Abrir puertas no gasta la acción.`,
        until: () => door1.open },
      { id: 'peek', title: 'Conoce al enemigo', arrow: nearest, label: 'Esqueleto', skipIf: () => !foes().length, next: true,
        text: T ? 'Toca un esqueleto una sola vez: verás su ficha (vida, dados, virtudes y cómo piensa) sin atacar todavía.' : 'Pasa el ratón por encima de un esqueleto: verás su ficha (vida, dados, virtudes y cómo piensa) y, en rojo, hasta dónde puede golpear.',
        on: { peek: true } },
      { id: 'attack', title: 'Atacar', arrow: nearest, needsAction: true, skipIf: () => !foes().length || this.flags.attacked,
        text: T ? 'Para atacar, toca al esqueleto y vuelve a tocarlo para confirmar. Antes verás cuántos dados tiras y tu probabilidad de herir. Si está lejos pero llegas, el héroe se acerca solo.' : 'Haz clic en un esqueleto para atacarlo. Antes de hacerlo verás cuántos dados tiras y tu probabilidad de herir. Si está lejos pero llegas, el héroe se acerca solo.',
        on: { attack: true, skill: (d) => d && d.s && d.s.target === 'enemy' } },
      { id: 'dice', title: 'Los dados', next: true,
        text: 'Cada calavera es un golpe. Los monstruos paran con escudos negros (1 cara de 6) y los héroes con escudos blancos (2 de 6). Daño = calaveras − escudos.' },
      { id: 'skill', title: 'Habilidades y Éter', needsAction: 'elian',
        ring: () => (GAME.active && GAME.active.id === 'elian' ? '#actions [data-act="s0"]' : '.hero-card[data-hero="elian"]'),
        arrow: () => (GAME.mode && GAME.mode.type === 'skill' ? nearest() : null),
        skipIf: () => !foes().length || this.flags.elianSkill,
        text: `Cada héroe tiene dos habilidades. Elian lanza hechizos con Éter (${T ? 'la insignia morada de su retrato' : 'los rombos morados'}). Selecciona a Elian, pulsa «Fuego Astral» y elige un esqueleto: también quema a los que estén a su lado. Si no llega, acércale primero.`,
        on: { skill: (d) => d && d.h && d.h.id === 'elian' } },
      { id: 'end', ring: () => (GAME.phase === 'hero' ? '#actions [data-act="end"]' : null), skipIf: () => this.flags.roundSeen || !foes().length,
        title: () => (GAME.phase === 'shadow' ? 'Turno de la Sombra' : 'Fin del turno'),
        text: () => (GAME.phase === 'shadow' ? 'Ahora actúan los enemigos. Cada criatura piensa según su Ingenio: las torpes van a por el más cercano y las listas, a por el más débil.' : `Cuando hayas hecho lo que quieras con los tres, ${T ? 'toca' : 'pulsa'} «Fin de turno»${T ? '' : ' (o la barra espaciadora)'}. Si a un héroe no le queda movimiento ni acción, su turno acaba solo.`),
        on: { round: true } },
      { id: 'det', title: 'Determinación', ring: '#party', next: true,
        text: `${T ? 'La insignia dorada de cada retrato' : 'Los círculos dorados'} son la Determinación, tanta como la Voluntad del héroe. Tras una tirada tuya puedes gastar un punto para repetir los dados fallados. Si un golpe va a tumbarte, se gasta sola.` },
      { id: 'position', title: 'Flanqueo y huida', next: true, skipIf: () => !foes().length,
        text: 'Si otro héroe está junto a tu objetivo, atacas con un dado más (Sera, con dos). Pero alejarte de un enemigo cuerpo a cuerpo le da un golpe gratis: un ataque de oportunidad. Sera, tan ágil, se escurre sin provocarlo.' },
      { id: 'clear', title: 'Limpiad la sala', skipIf: () => !foes().length,
        text: 'Acabad con los esqueletos. Combina a los tres: Aldric aguanta en primera fila, Sera flanquea y Elian ataca desde lejos.',
        until: () => !foes().length },
      { id: 'sheet', title: 'La ficha del grupo', ring: '#btn-party',
        text: `La corona de arriba abre la ficha del grupo con las cinco virtudes de cada héroe: Fuerza, Agilidad, Ingenio, Voluntad y Presencia. De ellas sale todo: vida, movimiento, dados… y quién es mejor en cada prueba. ${tap} la corona${T ? '' : ' (o pulsa G)'}.`,
        until: sheetOpen },
      { id: 'sheetClose', title: 'Cierra la ficha', ring: '#sheet [data-close]', skipIf: () => !sheetOpen(),
        text: 'Mira las pestañas de los tres y cierra la ficha cuando quieras.', until: () => !sheetOpen() },
      { id: 'lock', title: 'Puertas cerradas', arrow: () => door2, label: 'Cerradura', focus: true, needsAction: true, skipIf: () => door2.open,
        text: `Esta puerta tiene cerradura. ${tap} ella con un héroe que tenga su acción: verás cómo puede abrirla cada uno y con qué probabilidad. Sera es la mejor con las ganzúas.`,
        until: () => door2.open },
      { id: 'checks', title: 'Las pruebas', next: true,
        text: 'Así funcionan todas las pruebas: tiras tantos dados como la virtud y necesitas tantas calaveras como la dificultad (1 fácil, 2 media, 3 difícil). Siempre verás la probabilidad antes de elegir.' },
      { id: 'chest', title: 'Botín', arrow: () => chest, label: 'Cofre', focus: true, needsAction: true, skipIf: () => chest.looted,
        text: `${tap} el cofre para abrirlo (gasta la acción). Al lado hay un atril: leer no cuesta nada.`,
        until: () => chest.looted && !GAME.busy },
      { id: 'acts', title: 'Acciones y objetos', ring: '#actions', next: true,
        text: 'En «Acciones» están Arengar (Presencia), Registrar (Ingenio), En guardia y Correr. En «Objetos», las pociones, los elixires y las bombas.' },
      { id: 'doom', title: 'El Presagio', ring: '#r-doom', next: true,
        text: 'El ojo de arriba es el Presagio: crece cada ronda y con el ruido. Cuando se llena, algo errante sube de la Hondura a buscaros. Aquí no pasará; abajo, sí.' }
    ];
  },
  val(v) { return typeof v === 'function' ? v() : v; },
  go(i) {
    clearTimeout(this._doneT);
    this.i = i; this.doneing = false;
    while (this.i < this.steps.length && this.steps[this.i].skipIf && this.steps[this.i].skipIf()) this.i++;
    if (this.i >= this.steps.length) { this.finish(); return; }
    const st = this.steps[this.i];
    st.round0 = GAME.round; st.t0 = performance.now();
    if (st.start) this.safe(st.start);
    // lleva la cámara hasta lo que hay que tocar
    if (st.focus && st.arrow) this.safe(() => { const t = st.arrow(); if (t) ENGINE.focusTile(t.x, t.y); });
    this.aside(null);
    this.render(true);
  },
  render(fresh) {
    const st = this.steps[this.i]; if (!st || !this.el) return;
    const E = this.el, title = this.val(st.title), text = this.val(st.text);
    const key = title + '|' + text;
    if (!fresh && key === this._key) return;
    this._key = key;
    E.panel.classList.remove('done');
    E.n.textContent = `${this.i + 1} de ${this.steps.length}`;
    E.bar.style.width = `${Math.round((100 * this.i) / this.steps.length)}%`;
    E.title.textContent = title; E.text.textContent = text;
    E.next.hidden = !st.next; E.wait.hidden = !!st.next; E.pass.hidden = !!st.next;
    if (fresh) { E.panel.classList.remove('tu-in'); void E.panel.offsetWidth; E.panel.classList.add('tu-in'); }
  },
  complete(manual) {
    if (!this.active || this.doneing) return;
    const st = this.steps[this.i]; if (!st) return;
    this.doneing = true;
    if (!manual) { this.el.panel.classList.add('done'); this.el.bar.style.width = `${Math.round((100 * (this.i + 1)) / this.steps.length)}%`; audio.sfx('levelUp', { vol: 0.35 }); }
    this._doneT = setTimeout(() => { if (this.active) this.go(this.i + 1); }, manual ? 60 : 750);
  },

  /* ---------------- sucesos del juego ---------------- */
  emit(ev, d) {
    if (!this.active || !GAME.tutorial) return;
    const st = this.steps[this.i];
    if (ev === 'cam') { if (st && st.id === 'camera') this.flags.cam = true; return; }
    if (ev === 'moved') this.flags.moved = true;
    if (ev === 'attack') this.flags.attacked = true;
    if (ev === 'skill') { this.flags.skillUsed = true; if (d && d.h && d.h.id === 'elian') this.flags.elianSkill = true; if (d && d.s && d.s.target === 'enemy') this.flags.attacked = true; }
    if (ev === 'shadow') this.flags.shadowSeen = true;
    if (ev === 'round' && this.flags.shadowSeen) this.flags.roundSeen = true;
    // lecciones al vuelo, una vez cada una
    if (ev === 'shadow' && st && st.id === 'end') this.said.shadow = true;
    if (ev === 'shadow' && GAME.visibleEnemies().length) this.once('shadow', 'Turno de la Sombra: ahora actúan los enemigos. Cada criatura piensa según su Ingenio: las torpes van a por el más cercano y las listas, a por el más débil.');
    if (ev === 'detOffer') this.once('det', 'Arriba se te ofrece Determinación: repetir los dados que han fallado. Úsala cuando el golpe importe; se recupera en cada capítulo.');
    if (ev === 'oa') this.once('oa', '¡Ataque de oportunidad! Al alejarte de un enemigo cuerpo a cuerpo, te golpea gratis. La ruta marcada lo evita si puede.');
    if (ev === 'down') this.once('down', 'Un héroe ha caído. En el tutorial se levanta solo al final de la ronda; en la campaña tendrá que levantarle un aliado.');
    if (ev === 'lock' && d && !d.ok) this.once('lockFail', 'No lo ha conseguido. Puede intentarlo otro héroe con su acción, o el mismo en el siguiente turno.', true);
    if (!st || this.doneing) return;
    const on = st.on && st.on[ev];
    if (on && (on === true || on(d))) this.complete();
  },
  once(id, text, again) {
    if (this.said[id] && !again) return;
    this.said[id] = true; this.aside(text, 9000);
  },
  aside(text, ms) {
    if (!this.el) return;
    clearTimeout(this._asideT);
    this._aside = text || null;
    this.el.aside.hidden = !text; if (text) this.el.aside.textContent = text;
    if (text && ms) this._asideT = setTimeout(() => { if (this._aside === text) this.aside(null); }, ms);
  },
  /* Comprobación periódica: estados que se cumplen sin un suceso concreto */
  poll() {
    if (!this.active || this.doneing || GAME.state !== 'play') return;
    const st = this.steps[this.i]; if (!st) return;
    if (st.until && st.until()) { this.complete(); return; }
    this.render(false);
    // ¿hace falta una acción y no queda?
    this._endHint = false;
    if (st.needsAction && GAME.phase === 'hero' && !GAME.busy) {
      const who = st.needsAction === true ? GAME.heroesUp() : GAME.heroesUp().filter((h) => h.id === st.needsAction);
      const any = who.some((h) => !h.ended && h.actions > 0);
      const a = GAME.active;
      if (!any) { this._endHint = true; this.aside(st.needsAction === true ? 'A nadie le queda acción este turno: pulsa «Fin de turno» y seguid en el siguiente.' : 'Elian ya ha gastado su acción: pulsa «Fin de turno» y prueba en el siguiente.'); }
      else if (a && a.actions <= 0 && st.needsAction === true) this.aside('A este héroe ya no le queda acción: elige a otro en su retrato.');
      else if (a && st.needsAction !== true && a.id !== st.needsAction) this.aside(`Este paso es para ${HERO_DEFS[st.needsAction].name}: ${U.isTouch() ? 'toca' : 'haz clic en'} su retrato.`);
      else if (this._aside && /acción|paso es para/.test(this._aside)) this.aside(null);
    }
  },

  /* ---------------- dibujo: panel, anillo y flecha ---------------- */
  covered() {
    const $ = (id) => UI.$(id);
    if (GAME.state !== 'play' || !$('dlg').hidden || !$('choice').hidden || !$('note').hidden || !$('screen').hidden || document.body.classList.contains('cinema')) return true;
    if (!$('sheet').hidden && this.steps[this.i] && this.steps[this.i].id !== 'sheetClose') return true;
    if (!$('sheet').hidden) return 'sheet';
    return false;
  },
  /* En el móvil el panel va justo encima de la barra de acciones (y de lo que asome sobre ella) */
  place() {
    const E = this.el;
    const narrow = window.innerWidth <= 820;
    // con la ficha de un enemigo abierta en el móvil, el panel se encoge y se aparta encima de ella
    E.panel.classList.toggle('compact', narrow && !UI.$('preview').hidden);
    if (!narrow) { if (E.panel.style.bottom) E.panel.style.bottom = ''; return; }
    let top = window.innerHeight;
    ['preview', 'cancel-mode', 'undo-move', 'items-pop', 'acts-pop'].forEach((id) => { const e = UI.$(id); if (e && !e.hidden) { const r = e.getBoundingClientRect(); if (r.height) top = Math.min(top, r.top); } });
    const bar = document.querySelector('.act-bar'); if (bar) { const r = bar.getBoundingClientRect(); if (r.height) top = Math.min(top, r.top); }
    const b = `${Math.round(window.innerHeight - top + 8)}px`;
    if (E.panel.style.bottom !== b) E.panel.style.bottom = b;
  },
  tick() {
    const E = this.el, st = this.steps[this.i]; if (!E || !st) return;
    const cov = this.covered();
    E.panel.hidden = !!cov;
    if (!cov) this.place();
    // anillo sobre un elemento de la interfaz
    const ringSel = this._endHint ? '#actions [data-act="end"]' : this.val(st.ring);
    let target = null;
    if (ringSel && (!cov || (cov === 'sheet' && st.id === 'sheetClose'))) target = typeof ringSel === 'string' ? document.querySelector(ringSel) : ringSel;
    const r = target && target.getBoundingClientRect();
    if (r && r.width > 0 && r.height > 0 && !(target.closest('[hidden]'))) {
      E.ring.hidden = false;
      E.ring.style.transform = `translate(${(r.left - 6).toFixed(1)}px, ${(r.top - 6).toFixed(1)}px)`;
      E.ring.style.width = `${r.width + 12}px`; E.ring.style.height = `${r.height + 12}px`;
    } else E.ring.hidden = true;
    // flecha sobre el tablero
    let p = null;
    const tgt = !cov && GAME.phase === 'hero' && !GAME.busy && st.arrow ? st.arrow() : null;
    if (tgt) {
      const t = GAME.T(tgt.x, tgt.y), room = t && GAME.L.rooms[t.room];
      const seen = tgt.mesh ? tgt.mesh.visible !== false : (t && (t.door || (room && room.revealed)));
      if (seen) p = tgt.mesh && tgt.side ? new THREE.Vector3(tgt.mesh.position.x, ((tgt.mesh.userData && tgt.mesh.userData.height) || 1.5) + 0.5, tgt.mesh.position.z) : new THREE.Vector3(tgt.x * TILE, t && t.door ? 2.6 : 0.9, tgt.y * TILE);
    }
    const s = p && ENGINE.project(p);
    if (s && s.visible) {
      // si el objetivo queda fuera de la pantalla, la flecha se queda en el borde y apunta hacia él
      const m = 34, x = U.clamp(s.x, m, window.innerWidth - m), y = U.clamp(s.y, 70, window.innerHeight - m), edge = x !== s.x || y !== s.y;
      E.arrow.hidden = false;
      E.arrow.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
      E.arrow.classList.toggle('edge', edge);
      E.arrow.lastChild.style.transform = edge ? `rotate(${(Math.atan2(s.y - y, s.x - x) - Math.PI / 2).toFixed(3)}rad)` : '';
      const lb = st.label || ''; const sp = E.arrow.firstChild; if (sp.textContent !== lb) sp.textContent = lb; sp.hidden = !lb;
    } else E.arrow.hidden = true;
  },

  /* ---------------- final ---------------- */
  finish() {
    this.stop();
    U.store.set('umbral.tutorial', 1);
    GAME.state = 'menu'; GAME.tutorial = false; GAME.gen = (GAME.gen || 0) + 1;
    audio.heartbeat(false); audio.stinger('victory'); audio.setMusic('menu');
    UI.showHUD(false); UI.hideAll(); UI.bossBar(null); UI.shadowMode(false);
    const s = UI.screen(`<div class="card tut-end"><div class="eyebrow">Tutorial completado</div><h2>Listos para descender</h2>
      <p class="lead">Ya sabéis lo esencial. Lo demás se aprende abajo, con el farol en la mano.</p>
      <ul class="tu-recap">
        <li>${icon('boot')} Mover, mirar alrededor, cambiar de héroe y deshacer</li>
        <li>${icon('skull')} Atacar: calaveras contra escudos</li>
        <li>${icon('starfire')} Habilidades, Éter y Determinación</li>
        <li>${icon('crown')} Virtudes y pruebas: quién lo intenta importa</li>
        <li>${icon('eye')} El Presagio: no os entretengáis</li>
      </ul>
      <p class="small">Si dudas de algo durante la partida, el menú tiene «Cómo se juega», y la corona de arriba abre la ficha del grupo.</p>
      <div class="row"><button class="btn primary" id="tu-camp">${icon('flame')} Empezar la campaña</button><button class="btn" id="tu-again">${icon('rotate')} Repetir el tutorial</button><button class="btn ghost" id="tu-title">Volver al inicio</button></div></div>`, 'dim');
    s.querySelector('#tu-camp').onclick = () => { audio.sfx('ui'); UI.difficulty(); };
    s.querySelector('#tu-again').onclick = () => UI.startTutorial();
    s.querySelector('#tu-title').onclick = () => { audio.sfx('uiBack'); UI.title(); };
  }
};
