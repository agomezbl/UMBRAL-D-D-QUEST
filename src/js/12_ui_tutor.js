/* ==========================================================================
   Tutorial guiado: un panel que enseña paso a paso sobre el propio tablero.
   Espera a que el jugador haga cada cosa, señala dónde tocar y explica las
   reglas justo cuando aparecen (dados, habilidades, cerraduras…)
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
    before(GAME, 'search', (h) => { T._searchAct = h ? h.actions : 0; });
    after(GAME, 'search', (r, h) => { if (h && h.actions < T._searchAct) T.emit('search', { h }); });
    after(UI, 'preview', (r, d) => { if (d && d.unit && d.unit.side === 'enemy') T.emit('peek'); });
    // cámara movida por el jugador (arrastrar, rueda, teclas)
    ['panWorld', 'pan', 'rotate', 'zoom', 'tilt'].forEach((k) => before(ENGINE, k, () => T.emit('cam')));
    // piezas de la interfaz
    const panel = U.el('div', 'plate', `
      <div class="tu-top"><span class="eyebrow">${L('Tutorial', 'Tutoriel')} · <b class="tu-n"></b></span><button class="tu-exit" type="button">${L('Salir del tutorial', 'Quitter le tutoriel')}</button></div>
      <div class="tu-bar"><i></i></div>
      <h4 class="tu-title"></h4>
      <p class="tu-text"></p>
      <p class="tu-aside" hidden></p>
      <div class="tu-foot"><span class="tu-wait">${icon('hand')} ${L('Hazlo para seguir', 'Fais-le pour continuer')}</span><button class="tu-pass" type="button">${L('Saltar paso', 'Passer l’étape')}</button><button class="btn small primary tu-next" type="button">${icon('check')} ${L('Entendido', 'Compris')}</button></div>`);
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
    // «LV» es el nivel (GAME.L); se llama así para no tapar la función de idiomas L()
    const T = U.isTouch(), tap = T ? L('Toca', 'Touche') : L('Haz clic en', 'Clique sur'), LV = GAME.L;
    const door1 = LV.doors.find((d) => d.x === 6 && d.y === 3), door2 = LV.doors.find((d) => d.x === 14 && d.y === 3), chest = LV.chests[0];
    const H = (id) => GAME.heroes.find((h) => h.id === id);
    const foes = () => GAME.enemies.filter((e) => e.alive && (e.kind === 'dummy' || e.kind === 'dummyArcher'));
    const nearest = () => { const a = GAME.active || GAME.heroesUp()[0]; const f = foes().filter((e) => e.active); if (!a || !f.length) return null; return f.sort((p, q) => U.cheb(a.x, a.y, p.x, p.y) - U.cheb(a.x, a.y, q.x, q.y))[0]; };
    const sheetOpen = () => !UI.$('sheet').hidden;
    const cam = ENGINE.cam.t;
    this.refs = { door1, door2, chest, foes };
    return [
      { id: 'party', title: L('Tu grupo', 'Ton groupe'), ring: '#party', next: true,
        text: L('Estos son tus tres héroes: Korvak el Bárbaro, Lyriel la Elfa arquera y Aldebrán el Hechicero. En la partida podrás bajar con 1 a 5. Cada uno juega su turno por separado: el del borde iluminado es el que mueves ahora. La barra roja es su vida.', 'Voici tes trois héros : Korvak le Barbare, Lyriel l’Elfe archère et Aldebrán l’Enchanteur. En partie, tu pourras descendre avec 1 à 5 héros. Chacun joue son tour séparément : celui dont le bord brille est celui que tu déplaces maintenant. La barre rouge, c’est sa vie.') },
      { id: 'move', title: L('Moverse', 'Se déplacer'), arrow: () => ({ x: 4, y: 3 }), label: L('Aquí', 'Ici'), skipIf: () => this.flags.moved,
        text: T ? L('Las casillas iluminadas son las que alcanza Korvak este turno. Toca una para ver la ruta y vuelve a tocarla para confirmar.', 'Les cases illuminées sont celles que Korvak peut atteindre ce tour-ci. Touches-en une pour voir le chemin, puis touche-la encore pour confirmer.') : L('Las casillas iluminadas son las que alcanza Korvak este turno. Pasa el ratón para ver la ruta y haz clic para moverle.', 'Les cases illuminées sont celles que Korvak peut atteindre ce tour-ci. Passe la souris dessus pour voir le chemin et clique pour le déplacer.'),
        on: { moved: true } },
      { id: 'undo', title: L('Deshacer', 'Annuler'), ring: '#undo-move', next: true, skipIf: () => !GAME.undo,
        text: L('¿Te has equivocado? Mientras no descubras nada nuevo, «Deshacer movimiento» devuelve al héroe a donde estaba. Muy útil con el dedo.', 'Une erreur ? Tant que tu ne découvres rien de nouveau, « Annuler le déplacement » ramène le héros là où il était. Très pratique avec le doigt.') },
      { id: 'camera', title: L('Mira a tu alrededor', 'Regarde autour de toi'), next: true,
        start: () => { this._cam0 = { yaw: cam.yaw, dist: cam.dist }; this.flags.cam = false; },
        until: () => this.flags.cam || Math.abs(cam.yaw - this._cam0.yaw) > 0.3 || Math.abs(cam.dist - this._cam0.dist) > 2.5,
        text: T ? L('Arrastra el tablero con un dedo para mover la cámara, pellizca para acercarte y gira con dos dedos. Pruébalo.', 'Fais glisser le plateau d’un doigt pour déplacer la caméra, pince pour zoomer et tourne avec deux doigts. Essaie.') : L('Arrastra el tablero para mover la cámara, usa la rueda para acercarte y gira con el botón derecho (o con Q y E). Pruébalo.', 'Fais glisser le plateau pour déplacer la caméra, utilise la molette pour zoomer et tourne avec le bouton droit (ou avec Q et E). Essaie.') },
      { id: 'switch', title: L('Cambiar de héroe', 'Changer de héros'), ring: '.hero-card[data-hero="elfa"]', skipIf: () => door1.open || H('elfa').ended,
        text: L(`No hace falta que Korvak termine. ${tap} el retrato de Lyriel para manejarla a ella${T ? '' : ' (o pulsa Tab)'}.`, `Pas besoin que Korvak ait fini. ${tap} le portrait de Lyriel pour la jouer${T ? '' : ' (ou appuie sur Tab)'}.`),
        until: () => GAME.active && GAME.active.id === 'elfa' },
      { id: 'door', title: L('Abrir puertas', 'Ouvrir les portes'), arrow: () => door1, label: L('Puerta', 'Porte'), focus: true, skipIf: () => door1.open,
        text: L(`Las salas están ocultas hasta que abres su puerta. ${tap} la puerta: el héroe se acerca y la abre. Abrir puertas no gasta la acción.`, `Les salles restent cachées tant que tu n’as pas ouvert leur porte. ${tap} la porte : le héros s’approche et l’ouvre. Ouvrir une porte ne coûte pas l’action.`),
        until: () => door1.open },
      { id: 'peek', title: L('Conoce al enemigo', 'Connais ton ennemi'), arrow: nearest, label: L('Esqueleto', 'Squelette'), skipIf: () => !foes().length, next: true,
        text: T ? L('Toca un esqueleto una sola vez: verás su ficha (vida, dados y cómo piensa) sin atacar todavía.', 'Touche un squelette une seule fois : tu verras sa fiche (vie, dés et façon de penser) sans encore attaquer.') : L('Pasa el ratón por encima de un esqueleto: verás su ficha (vida, dados y cómo piensa) y, en rojo, hasta dónde puede golpear.', 'Passe la souris sur un squelette : tu verras sa fiche (vie, dés et façon de penser) et, en rouge, jusqu’où il peut frapper.'),
        on: { peek: true } },
      { id: 'attack', title: L('Atacar', 'Attaquer'), arrow: nearest, needsAction: true, skipIf: () => !foes().length || this.flags.attacked,
        text: T ? L('Para atacar, toca al esqueleto y vuelve a tocarlo para confirmar. Antes verás cuántos dados tiras y tu probabilidad de herir. Lyriel dispara desde lejos; si alguien no llega, se acerca solo.', 'Pour attaquer, touche le squelette, puis touche-le encore pour confirmer. Avant, tu verras combien de dés tu lances et tes chances de blesser. Lyriel tire de loin ; si un héros est trop loin, il s’approche tout seul.') : L('Haz clic en un esqueleto para atacarlo. Antes verás cuántos dados tiras y tu probabilidad de herir. Lyriel dispara desde lejos; si alguien no llega, se acerca solo.', 'Clique sur un squelette pour l’attaquer. Avant, tu verras combien de dés tu lances et tes chances de blesser. Lyriel tire de loin ; si un héros est trop loin, il s’approche tout seul.'),
        on: { attack: true, skill: (d) => d && d.s && d.s.target === 'enemy' } },
      { id: 'dice', title: L('Los dados', 'Les dés'), next: true,
        text: L('Los dados ruedan en el tablero y el cartel de arriba dice el resultado. Cada calavera es un golpe. Los monstruos paran con escudos negros (1 cara de 6) y los héroes con escudos blancos (2 de 6). Daño = calaveras − escudos.', 'Les dés roulent sur le plateau et le panneau du haut annonce le résultat. Chaque crâne est un coup. Les monstres parent avec des boucliers noirs (1 face sur 6) et les héros avec des boucliers blancs (2 sur 6). Dégâts = crânes − boucliers.') },
      { id: 'destiny', title: L('El Dado del Destino', 'Le Dé du Destin'), next: true,
        text: L('El dado dorado acompaña a cada ataque de un héroe. Máscara alegre: el premio de ese héroe (Korvak rebota el golpe contra otro enemigo, Lyriel gana movimiento, Aldebrán recarga antes una habilidad). Máscara triste: ruido, +1 Presagio. Cara lisa: nada.', 'Le dé doré accompagne chaque attaque d’un héros. Masque joyeux : la récompense de ce héros (Korvak fait ricocher le coup sur un autre ennemi, Lyriel gagne du déplacement, Aldebrán recharge plus tôt une compétence). Masque triste : du bruit, +1 Présage. Face vierge : rien.') },
      { id: 'skill', title: L('Habilidades', 'Compétences'), needsAction: 'hechicero',
        ring: () => (GAME.active && GAME.active.id === 'hechicero' ? '#actions [data-act="s0"]' : '.hero-card[data-hero="hechicero"]'),
        arrow: () => (GAME.mode && GAME.mode.type === 'skill' ? nearest() : null),
        skipIf: () => !foes().length || this.flags.mageSkill,
        text: L('Cada héroe tiene un ataque y dos habilidades. Tras usar una, se recarga durante unas rondas (el número sobre el botón). Selecciona a Aldebrán, pulsa «Bola de fuego» y elige un esqueleto: también quema a los que estén a su lado. Si no llega, acércale primero.', 'Chaque héros a une attaque et deux compétences. Une fois utilisée, une compétence se recharge pendant quelques manches (le chiffre sur le bouton). Sélectionne Aldebrán, appuie sur « Boule de feu » et choisis un squelette : elle brûle aussi ceux qui sont à côté. S’il est trop loin, rapproche-le d’abord.'),
        on: { skill: (d) => d && d.h && d.h.id === 'hechicero' } },
      { id: 'end', ring: () => (GAME.phase === 'hero' ? '#actions [data-act="end"]' : null), skipIf: () => this.flags.roundSeen || !foes().length,
        title: () => (GAME.phase === 'shadow' ? L('Turno de la Sombra', 'Tour de l’Ombre') : L('Fin del turno', 'Fin du tour')),
        text: () => (GAME.phase === 'shadow' ? L('Ahora actúan los enemigos. Las criaturas torpes van a por el más cercano; las listas, a por el más débil.', 'Maintenant, ce sont les ennemis qui agissent. Les créatures maladroites foncent sur le plus proche ; les plus rusées, sur le plus faible.') : L(`Cuando hayas hecho lo que quieras con los tres, ${T ? 'toca' : 'pulsa'} «Fin de turno»${T ? '' : ' (o la barra espaciadora)'}. Si a un héroe no le queda movimiento ni acción, su turno acaba solo.`, `Quand tu as fini avec les trois, ${T ? 'touche' : 'appuie sur'} « Fin du tour »${T ? '' : ' (ou la barre d’espace)'}. Si un héros n’a plus ni déplacement ni action, son tour se termine tout seul.`)),
        on: { round: true } },
      { id: 'position', title: L('Flanqueo', 'Prise de flanc'), next: true, skipIf: () => !foes().length,
        text: L('Si otro héroe está junto a tu objetivo, atacas con un dado más. Y nadie te golpea por moverte: colócate con libertad, rodead a los enemigos y proteged al Hechicero.', 'Si un autre héros est à côté de ta cible, tu attaques avec un dé de plus. Et personne ne te frappe parce que tu te déplaces : place-toi librement, encerclez les ennemis et protégez l’Enchanteur.') },
      { id: 'clear', title: L('Limpiad la sala', 'Nettoyez la salle'), skipIf: () => !foes().length,
        text: L('Acabad con los esqueletos. Korvak aguanta en primera fila, Lyriel dispara desde lejos y Aldebrán quema con su magia o cura con Luz sanadora.', 'Venez à bout des squelettes. Korvak tient la première ligne, Lyriel tire de loin et Aldebrán brûle avec sa magie ou soigne avec Lumière guérisseuse.'),
        until: () => !foes().length },
      { id: 'sheet', title: L('La ficha del grupo', 'La fiche du groupe'), ring: '#btn-party',
        text: L(`La corona de arriba abre la ficha del grupo: vida, ataque, defensa, movimiento, habilidades y equipo de cada héroe. ${tap} la corona${T ? '' : ' (o pulsa G)'}.`, `La couronne en haut ouvre la fiche du groupe : vie, attaque, défense, déplacement, compétences et équipement de chaque héros. ${tap} la couronne${T ? '' : ' (ou appuie sur G)'}.`),
        until: sheetOpen },
      { id: 'sheetClose', title: L('Cierra la ficha', 'Ferme la fiche'), ring: '#sheet [data-close]', skipIf: () => !sheetOpen(),
        text: L('Mira las pestañas de los tres y cierra la ficha cuando quieras.', 'Regarde les onglets des trois héros et ferme la fiche quand tu veux.'), until: () => !sheetOpen() },
      { id: 'lock', title: L('Puertas cerradas', 'Portes verrouillées'), arrow: () => door2, label: L('Cerradura', 'Serrure'), focus: true, needsAction: true, skipIf: () => door2.open,
        text: L(`Esta puerta tiene cerradura. ${T ? 'Tócala' : 'Haz clic en ella'} con un héroe que tenga su acción: tira 3 dados y las calaveras se van sumando hasta llegar a 2. Si no se abre a la primera, seguid intentándolo. El Enano las abre sin tirar.`, `Cette porte a une serrure. ${T ? 'Touche-la' : 'Clique dessus'} avec un héros qui a encore son action : il lance 3 dés et les crânes s’additionnent jusqu’à 2. Si elle ne s’ouvre pas du premier coup, continuez d’essayer. Le Nain les ouvre sans lancer de dés.`),
        until: () => door2.open },
      { id: 'chest', title: L('Botín', 'Butin'), arrow: () => chest, label: L('Cofre', 'Coffre'), focus: true, needsAction: true, skipIf: () => chest.looted,
        text: L(`${tap} el cofre para abrirlo (gasta la acción). Al lado hay un atril: leer no cuesta nada.`, `${tap} le coffre pour l’ouvrir (ça coûte l’action). Juste à côté, il y a un lutrin : lire ne coûte rien.`),
        until: () => chest.looted && !GAME.busy },
      { id: 'search', title: L('Buscar', 'Fouiller'), ring: '#actions [data-act="search"]', needsAction: true, skipIf: () => this.flags.searched,
        text: L(`Con la sala tranquila, ${T ? 'toca' : 'pulsa'} «Buscar» (la lupa)${T ? '' : ' o la tecla 4'}: revela las trampas de la sala y tira el Dado del Tesoro: oro, una poción, un objeto… o nada. Se busca una vez por sala y hace ruido; fuera de aquí, la cara de peligro trae un dardo o algo que sube a por vosotros.`, `Quand la salle est calme, ${T ? 'touche' : 'appuie sur'} « Fouiller » (la loupe)${T ? '' : ' ou la touche 4'}. Tu découvres les pièges de la salle et tu lances le Dé du Trésor : de l’or, une potion, un objet… ou rien. On fouille une fois par salle, et ça fait du bruit ; ailleurs qu’ici, la face danger amène une fléchette, ou quelque chose qui monte vous chercher.`),
        on: { search: true } },
      { id: 'items', title: L('Objetos', 'Objets'), ring: '#actions [data-act="items"]', next: true,
        text: L('En «Objetos» están las pociones (beberla no gasta la acción), los elixires (una acción más) y las bombas.', 'Dans « Objets », tu trouves les potions (en boire une ne coûte pas l’action), les élixirs (une action de plus) et les bombes.') },
      { id: 'doom', title: L('El Presagio', 'Le Présage'), ring: '#r-doom', next: true,
        text: L('El ojo de arriba es el Presagio: crece cada ronda y con el ruido. Cuando se llena, algo errante sube de la Hondura a buscaros. Aquí no pasará; abajo, sí.', 'L’œil en haut, c’est le Présage : il grandit à chaque manche et avec le bruit. Quand il est plein, une créature errante monte des Tréfonds pour vous chercher. Ici, ça n’arrivera pas ; en bas, si.') }
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
    E.n.textContent = L(`${this.i + 1} de ${this.steps.length}`, `${this.i + 1} sur ${this.steps.length}`);
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
    if (ev === 'skill') { this.flags.skillUsed = true; if (d && d.h && d.h.id === 'hechicero') this.flags.mageSkill = true; if (d && d.s && d.s.target === 'enemy') this.flags.attacked = true; }
    if (ev === 'search') this.flags.searched = true;
    if (ev === 'shadow') this.flags.shadowSeen = true;
    if (ev === 'round' && this.flags.shadowSeen) this.flags.roundSeen = true;
    // lecciones al vuelo, una vez cada una
    if (ev === 'shadow' && st && st.id === 'end') this.said.shadow = true;
    if (ev === 'shadow' && GAME.visibleEnemies().length) this.once('shadow', L('Turno de la Sombra: ahora actúan los enemigos. Las criaturas torpes van a por el más cercano; las listas, a por el más débil.', 'Tour de l’Ombre : maintenant, ce sont les ennemis qui agissent. Les créatures maladroites foncent sur le plus proche ; les plus rusées, sur le plus faible.'));
    if (ev === 'down') this.once('down', L('Un héroe ha caído. En el tutorial se levanta solo al final de la ronda; en la campaña tendrá que levantarle un aliado.', 'Un héros est à terre. Dans le tutoriel, il se relève tout seul à la fin de la manche ; dans la campagne, il faudra qu’un allié le relève.'));
    if (ev === 'lock' && d && !d.ok) this.once('lockFail', L(`Aún no: lleváis ${d.door.progress || 0} de 2 calaveras. Puede seguir otro héroe con su acción, o el mismo en el siguiente turno.`, `Pas encore : vous en êtes à ${d.door.progress || 0} crâne${(d.door.progress || 0) > 1 ? 's' : ''} sur 2. Un autre héros peut continuer avec son action, ou le même au tour suivant.`), true);
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
      if (!any) { this._endHint = true; this.aside(st.needsAction === true ? L('A nadie le queda acción este turno: pulsa «Fin de turno» y seguid en el siguiente.', 'Plus personne n’a d’action ce tour-ci : appuie sur « Fin du tour » et continuez au suivant.') : L(`${HERO_DEFS[st.needsAction].name} ya ha gastado su acción: pulsa «Fin de turno» y prueba en el siguiente.`, `${HERO_DEFS[st.needsAction].name} a déjà utilisé son action : appuie sur « Fin du tour » et réessaie au suivant.`)); }
      else if (a && a.actions <= 0 && st.needsAction === true) this.aside(L('A este héroe ya no le queda acción: elige a otro en su retrato.', 'Ce héros n’a plus d’action : choisis-en un autre avec son portrait.'));
      else if (a && st.needsAction !== true && a.id !== st.needsAction) this.aside(L(`Este paso es para ${HERO_DEFS[st.needsAction].name}: ${U.isTouch() ? 'toca' : 'haz clic en'} su retrato.`, `Cette étape est pour ${HERO_DEFS[st.needsAction].name} : ${U.isTouch() ? 'touche' : 'clique sur'} son portrait.`));
      else if (this._aside && /acción|paso es para|action|étape est pour/.test(this._aside)) this.aside(null);
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
    ['preview', 'cancel-mode', 'undo-move', 'items-pop'].forEach((id) => { const e = UI.$(id); if (e && !e.hidden) { const r = e.getBoundingClientRect(); if (r.height) top = Math.min(top, r.top); } });
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
    const s = UI.screen(`<div class="card tut-end"><div class="eyebrow">${L('Tutorial completado', 'Tutoriel terminé')}</div><h2>${L('Listos para descender', 'Prêts à descendre')}</h2>
      <p class="lead">${L('Ya sabéis lo esencial. Lo demás se aprende abajo, con el farol en la mano.', 'Vous connaissez l’essentiel. Le reste s’apprend en bas, la lanterne à la main.')}</p>
      <ul class="tu-recap">
        <li>${icon('boot')} ${L('Mover, mirar alrededor, cambiar de héroe y deshacer', 'Se déplacer, regarder autour de soi, changer de héros et annuler')}</li>
        <li>${icon('skull')} ${L('Atacar: calaveras contra escudos', 'Attaquer : crânes contre boucliers')}</li>
        <li>${icon('starfire')} ${L('Dos habilidades por héroe, que se recargan', 'Deux compétences par héros, qui se rechargent')}</li>
        <li>${icon('search')} ${L('Cerraduras, cofres y buscar tesoro', 'Serrures, coffres et chasse au trésor')}</li>
        <li>${icon('eye')} ${L('El Presagio: no os entretengáis', 'Le Présage : ne traînez pas')}</li>
      </ul>
      <p class="small">${L('Si dudas de algo durante la partida, el menú tiene «Cómo se juega», y la corona de arriba abre la ficha del grupo.', 'Si tu as un doute pendant la partie, le menu propose « Comment jouer », et la couronne en haut ouvre la fiche du groupe.')}</p>
      <div class="row"><button class="btn primary" id="tu-camp">${icon('flame')} ${L('Empezar la campaña', 'Commencer la campagne')}</button><button class="btn" id="tu-again">${icon('rotate')} ${L('Repetir el tutorial', 'Refaire le tutoriel')}</button><button class="btn ghost" id="tu-title">${L('Volver al inicio', 'Retour à l’accueil')}</button></div></div>`, 'dim');
    s.querySelector('#tu-camp').onclick = () => { audio.sfx('ui'); UI.difficulty(); };
    s.querySelector('#tu-again').onclick = () => UI.startTutorial();
    s.querySelector('#tu-title').onclick = () => { audio.sfx('uiBack'); UI.title(); };
  }
};
