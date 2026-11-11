/* ==========================================================================
   Capa de saber (fase 1): aprender jugando sin cuestionarios que bloqueen
   - Ojo de Tahúr: una vez por ronda, antes de atacar, estimas la probabilidad.
     Si aciertas y el Dado del Destino sale liso, se vuelve máscara alegre.
     Fallar no quita nada. Cuatro niveles que suben con los aciertos.
   - Libro de Tiradas: cuenta las calaveras de verdad frente a lo esperado (50 %).
   - Velada de los dilemas: un dilema sin respuesta correcta, con coste en los dos
     lados, un «¿por qué?» con tres razones y el nombre del filósofo que pensaba así.
   - Crónica de la noche: al acampar, un resumen para comentar en familia.
   Regla de oro: saber da ventaja; no saber nunca castiga más que jugar como hoy.
   ========================================================================== */
const SABER = {
  // progreso del Ojo de Tahúr: es del jugador, así que se guarda en el aparato (no en la partida)
  prog: Object.assign({ lvl: 0, ok: 0, asked: 0, right: 0 }, U.store.get('umbral.saber', {})),
  LEVELS: [
    { name: L('Aprendiz', 'Apprenti'), what: L('calaveras esperadas', 'crânes attendus') },
    { name: L('Jugador', 'Joueur'), what: L('al menos una calavera', 'au moins un crâne') },
    { name: L('Tahúr', 'Parieur'), what: L('veces de cada 10 que hieres', 'fois sur 10 où tu blesses') },
    { name: L('Maestro de dados', 'Maître des dés'), what: L('daño medio', 'dégâts moyens') }
  ],
  TO_LEVEL_UP: 3,
  askedKey: null, bonus: false,

  /* ---------------- estado ---------------- */
  on() { return SETTINGS.tahur !== false && typeof GAME !== 'undefined' && !GAME.tutorial && GAME.state === 'play' && GAME.phase === 'hero'; },
  key() { return `${GAME.chIdx}:${GAME.round}`; },
  willAsk(d) { return this.on() && !!(d && d.odds && d.unit) && this.askedKey !== this.key(); },
  night() {
    const f = GAME.flags || (GAME.flags = {});
    return (f.saber = f.saber || { est: 0, estOk: 0, dice: 0, skulls: 0, dilemma: null });
  },
  levelName() { return this.LEVELS[this.prog.lvl].name; },
  saveProg() { U.store.set('umbral.saber', this.prog); },

  /* ---------------- Libro de Tiradas ---------------- */
  count(nDice, nSkulls) { const n = this.night(); n.dice += nDice; n.skulls += nSkulls; },

  /* ---------------- Ojo de Tahúr ---------------- */
  fmt(x) { const r = Math.round(x * 10) / 10; return (Number.isInteger(r) ? String(r) : r.toFixed(1)).replace('.', L(',', ',')); },
  question(d) {
    const n = d.atk, def = d.def, name = d.unit.name, p = d.odds.pHit, exp = d.odds.exp;
    let type = this.prog.lvl;
    if (type === 3) type = 1 + Math.floor(Math.random() * 3); // en el último nivel se mezclan las preguntas
    if (type === 0) {
      const opts = []; for (let i = 0; i <= n; i++) opts.push({ v: i, t: String(i) });
      return { type, opts, wide: n > 6,
        q: L(`Vas a tirar ${n} dados de ataque. ¿Cuántas calaveras crees que saldrán, más o menos?`, `Tu vas lancer ${n} dés d'attaque. Combien de crânes vont sortir, à peu près ?`),
        ok: (v) => Math.abs(v - n / 2) <= 0.5,
        why: L(`Cada dado tiene 3 calaveras en sus 6 caras: sale calavera la mitad de las veces. Con ${n} dados, lo normal es unas ${this.fmt(n / 2)}.`,
          `Chaque dé a 3 crânes sur ses 6 faces : un crâne sort une fois sur deux. Avec ${n} dés, on en attend environ ${this.fmt(n / 2)}.`) };
    }
    if (type === 1) {
      const right = Math.round((1 - Math.pow(0.5, n)) * 100);
      const pool = [25, 50, 75, 88, 94, 97, 100].filter((x) => x !== right);
      pool.sort((a, b) => Math.abs(a - right) - Math.abs(b - right));
      const vals = [right].concat(pool.slice(0, 3)).sort((a, b) => a - b);
      return { type, opts: vals.map((v) => ({ v, t: v + ' %' })),
        q: L(`Con ${n} dados, ¿qué probabilidad hay de sacar al menos una calavera?`, `Avec ${n} dés, quelle est la probabilité d'obtenir au moins un crâne ?`),
        ok: (v) => v === right,
        why: L(`Truco: piensa en lo contrario. Que no salga ninguna calavera es (1/2) multiplicado ${n} ${n === 1 ? 'vez' : 'veces'}: 1 de cada ${Math.pow(2, n)}. Así que al menos una: 1 − 1/${Math.pow(2, n)} = ${right} %.`,
          `Astuce : pense au contraire. Aucun crâne, c'est (1/2) multiplié ${n} fois : 1 chance sur ${Math.pow(2, n)}. Donc au moins un : 1 − 1/${Math.pow(2, n)} = ${right} %.`) };
    }
    if (type === 2) {
      const right = Math.round(p * 10);
      const opts = []; for (let i = 0; i <= 10; i++) opts.push({ v: i, t: String(i) });
      return { type, opts, wide: true,
        q: L(`${n} dados contra ${def} ${def === 1 ? 'dado' : 'dados'} de defensa de ${name}. ¿Cuántas veces de cada 10 le herirías?`, `${n} dés contre ${def} dé${def > 1 ? 's' : ''} de défense de ${name}. Combien de fois sur 10 le blesserais-tu ?`),
        ok: (v) => Math.abs(v - p * 10) <= 1,
        why: L(`Hieres si salen más calaveras (la mitad de tus dados, de media) que escudos negros (solo 1 de sus 6 caras). Lo exacto: ${this.fmt(p * 10)} de cada 10 (${Math.round(p * 100)} %).`,
          `Tu blesses s'il sort plus de crânes (la moitié de tes dés, en moyenne) que de boucliers noirs (1 seule face sur 6). Le calcul exact : ${this.fmt(p * 10)} fois sur 10 (${Math.round(p * 100)} %).`) };
    }
    // tipo 3: daño medio (esperanza)
    const right = Math.round(exp * 10) / 10;
    const cand = [right, Math.round((n / 2) * 10) / 10, Math.max(0, Math.round((right - 1) * 10) / 10), Math.round((right + 1) * 10) / 10, Math.round((right + 0.5) * 10) / 10];
    const vals = []; cand.forEach((v) => { if (!vals.includes(v) && vals.length < 4) vals.push(v); });
    vals.sort((a, b) => a - b);
    return { type: 3, opts: vals.map((v) => ({ v, t: this.fmt(v) })),
      q: L(`¿Cuánto daño crees que le harás a ${name} de media?`, `Combien de dégâts penses-tu infliger à ${name} en moyenne ?`),
      ok: (v) => v === right,
      why: L(`De media salen ${this.fmt(n / 2)} calaveras (${n} ÷ 2) y ${this.fmt(def / 6)} escudos (${def} ÷ 6). El daño nunca baja de 0, por eso el cálculo exacto da ${this.fmt(right)} y no una resta simple.`,
        `En moyenne, il sort ${this.fmt(n / 2)} crânes (${n} ÷ 2) et ${this.fmt(def / 6)} bouclier${def / 6 > 1 ? 's' : ''} (${def} ÷ 6). Les dégâts ne descendent jamais sous 0 : le calcul exact donne ${this.fmt(right)}, pas une simple soustraction.`) };
  },
  // se llama justo antes de atacar; devuelve cuando el jugador ha contestado (o ha dicho «ahora no»)
  async beforeAttack(h, d) {
    this.bonus = false;
    if (!this.willAsk(d)) return;
    this.askedKey = this.key();
    const Q = this.question(d);
    const pick = await this.pop(h, Q);
    if (pick == null) return;
    const n = this.night(); n.est++;
    this.prog.asked++;
    const right = Q.ok(pick);
    if (right) {
      n.estOk++; this.prog.right++; this.prog.ok++; this.bonus = true;
      if (this.prog.lvl < this.LEVELS.length - 1 && this.prog.ok >= this.TO_LEVEL_UP) {
        this.prog.lvl++; this.prog.ok = 0;
        setTimeout(() => UI.toast(L(`Ojo de Tahúr: ¡nivel ${this.levelName()}!`, `Œil du Parieur : niveau ${this.levelName()} !`)), 900);
      }
    }
    this.saveProg();
  },
  // el Dado del Destino: un buen cálculo convierte la cara lisa en máscara alegre
  destiny(kind) {
    const b = this.bonus; this.bonus = false;
    if (b && kind === 'blank') { setTimeout(() => UI.toast(L('Buen ojo: la cara lisa se vuelve máscara alegre.', 'Bien vu : la face vierge devient masque joyeux.')), 300); return 'comedy'; }
    return kind;
  },
  pop(h, Q) {
    return new Promise((resolve) => {
      this.css();
      let el = document.getElementById('saber-pop');
      if (!el) { el = document.createElement('div'); el.id = 'saber-pop'; el.className = 'saber-pop'; document.body.appendChild(el); }
      const col = h && HERO_DEFS[h.id] ? HERO_DEFS[h.id].color : '#e9b864';
      el.style.setProperty('--hc', col);
      el.innerHTML = `<div class="sp-head"><span class="eyebrow">${L('Ojo de Tahúr', 'Œil du Parieur')} · ${U.esc(this.levelName())}</span><button class="sp-skip" type="button">${L('Ahora no', 'Pas maintenant')}</button></div>
        <p class="sp-q">${U.esc(Q.q)}</p>
        <div class="sp-opts${Q.wide ? ' wide' : ''}">${Q.opts.map((o, i) => `<button class="sp-opt" type="button" data-i="${i}">${U.esc(o.t)}</button>`).join('')}</div>
        <p class="sp-note">${L('Si aciertas y el Dado del Destino sale liso, será máscara alegre. Fallar no quita nada.', 'Si tu as juste et que le Dé du Destin tombe sur une face vierge, il devient masque joyeux. Te tromper ne coûte rien.')}</p>`;
      el.hidden = false; requestAnimationFrame(() => el.classList.add('in'));
      audio.sfx('reveal', { vol: 0.3 });
      const close = (v) => { el.classList.remove('in'); setTimeout(() => { el.hidden = true; el.innerHTML = ''; }, 180); resolve(v); };
      el.querySelector('.sp-skip').onclick = () => { audio.sfx('uiBack'); close(null); };
      U.$$('.sp-opt', el).forEach((b) => (b.onclick = () => {
        const o = Q.opts[+b.dataset.i], right = Q.ok(o.v);
        audio.sfx(right ? 'gold' : 'ui');
        U.$$('.sp-opt', el).forEach((x) => { x.disabled = true; if (Q.ok(Q.opts[+x.dataset.i].v)) x.classList.add('right'); });
        if (!right) b.classList.add('wrong');
        el.querySelector('.sp-note').outerHTML = `<div class="sp-res ${right ? 'good' : ''}"><b>${right ? L('¡Buen ojo!', 'Bien vu !') : L('Casi.', 'Presque.')}</b> ${U.esc(Q.why)}</div>
          <div class="sp-go"><button class="btn primary" type="button">${L('¡A los dados!', 'Aux dés !')}</button></div>`;
        el.querySelector('.sp-skip').hidden = true;
        const go = el.querySelector('.sp-go .btn'); go.focus();
        go.onclick = () => { audio.sfx('ui'); close(o.v); };
      }));
    });
  },

  /* ---------------- Velada de los dilemas ---------------- */
  PHILO: {
    cons: { name: L('Pensar en las consecuencias', 'Penser aux conséquences'), who: 'John Stuart Mill',
      text: L('Así razonaba John Stuart Mill (Inglaterra, siglo XIX): lo correcto es lo que trae más bien a más gente.', 'C\'est ainsi que raisonnait John Stuart Mill (Angleterre, XIXᵉ siècle) : le bon choix est celui qui fait le plus de bien au plus grand nombre.') },
    deber: { name: L('Cumplir una regla', 'Suivre une règle'), who: L('Immanuel Kant', 'Emmanuel Kant'),
      text: L('Así razonaba Immanuel Kant (Alemania, siglo XVIII): hay reglas que se cumplen siempre, pase lo que pase.', 'C\'est ainsi que raisonnait Emmanuel Kant (Allemagne, XVIIIᵉ siècle) : certaines règles se respectent toujours, quoi qu\'il arrive.') },
    caracter: { name: L('Ser buena persona', 'Être quelqu\'un de bien'), who: L('Aristóteles', 'Aristote'),
      text: L('Así razonaba Aristóteles (Grecia, siglo IV a. C.): lo importante es en qué clase de persona te convierte lo que haces.', 'C\'est ainsi que raisonnait Aristote (Grèce, IVᵉ siècle av. J.-C.) : ce qui compte, c\'est la personne que tes actes font de toi.') }
  },
  // qué héroe dice cada tipo de razón (si no baja, la dice otro del grupo)
  VOICE: { cons: ['amazona', 'elfa', 'barbaro'], deber: ['hechicero', 'enano', 'amazona'], caracter: ['enano', 'barbaro', 'elfa'] },
  DILEMMAS: {
    trasgo: {
      title: L('El trasgo de la despensa', 'Le gobelin du garde-manger'),
      prompt: L('Un trasgo flacucho se ha colado en el campamento y le habéis pillado con vuestro pan. Tiembla. Dice que su clan pasa hambre desde que los orcos tomaron la forja, y promete enseñaros el camino si le dejáis ir.',
        'Un gobelin maigrichon s\'est faufilé dans le campement et vous l\'avez surpris avec votre pain. Il tremble. Il dit que son clan a faim depuis que les orques ont pris la forge, et il promet de vous montrer le chemin si vous le laissez partir.'),
      family: L('¿Está bien obligar a alguien a ayudarte si antes te ha hecho daño? ¿Y si lo hizo porque tenía hambre?', 'Est-ce juste d\'obliger quelqu\'un à t\'aider s\'il t\'a fait du tort ? Et s\'il l\'a fait parce qu\'il avait faim ?'),
      options: [
        { label: L('Darle el pan y dejarle ir', 'Lui donner le pain et le laisser partir'), desc: L('Os quedáis sin parte de las provisiones: −1 poción.', 'Vous perdez une partie des provisions : −1 potion.'), fx: { potion: -1 },
          after: L('El trasgo se aleja abrazado al pan. Antes de desaparecer, se gira y os hace una reverencia torpe.', 'Le gobelin s\'éloigne en serrant le pain contre lui. Avant de disparaître, il se retourne et vous fait une révérence maladroite.'),
          why: {
            cons: L('Un trasgo agradecido no irá a avisar a los orcos. Nos conviene a todos.', 'Un gobelin reconnaissant n\'ira pas prévenir les orques. Tout le monde y gagne.'),
            deber: L('Tenía hambre. A quien tiene hambre se le da de comer: esa regla no se rompe.', 'Il avait faim. Quand quelqu\'un a faim, on le nourrit : c\'est une règle qu\'on ne brise pas.'),
            caracter: L('No quiero ser de los que echan a un hambriento. Quiero ser mejor que eso.', 'Je ne veux pas être de ceux qui chassent un affamé. Je veux valoir mieux que ça.') } },
        { label: L('Que os guíe, quiera o no', 'Qu\'il vous guide, de gré ou de force'), desc: L('Marcará las trampas del próximo capítulo, pero al alba se escapa con parte del oro: −20 monedas.', 'Il marquera les pièges du prochain chapitre, mais à l\'aube il file avec une partie de l\'or : −20 pièces.'), fx: { traps: true, gold: -20 },
          after: L('El trasgo marca el camino con tiza, refunfuñando. Al amanecer ya no está. Vuestra bolsa pesa algo menos.', 'Le gobelin marque le chemin à la craie en ronchonnant. Au matin, il a disparu. Votre bourse est un peu plus légère.'),
          why: {
            cons: L('Con su ayuda evitamos trampas. Más vale un trasgo enfadado que un compañero herido.', 'Grâce à lui, on évite les pièges. Mieux vaut un gobelin fâché qu\'un compagnon blessé.'),
            deber: L('Nos robó. Quien hace un daño tiene que repararlo: es justo que nos ayude.', 'Il nous a volés. Qui fait du tort doit le réparer : il est juste qu\'il nous aide.'),
            caracter: L('Un buen jefe cuida primero de su grupo, aunque le toque ser duro.', 'Un bon chef protège d\'abord son groupe, même s\'il doit se montrer dur.') } }
      ]
    },
    orco: {
      title: L('El orco de las cadenas rotas', 'L\'orque aux chaînes brisées'),
      prompt: L('Junto a la grieta encontráis a un orco joven con cadenas rotas en las muñecas. Ignis obligaba a los suyos a trabajar en la forja. Ahora está libre, perdido y asustado. Os pide subir con vosotros hasta la superficie.',
        'Près de la crevasse, vous trouvez un jeune orque aux poignets entourés de chaînes brisées. Ignis forçait les siens à travailler à la forge. Le voilà libre, perdu et effrayé. Il vous demande de remonter avec vous jusqu\'à la surface.'),
      family: L('¿Juzgamos a alguien por el grupo del que viene? ¿Qué cambia si sabemos que le obligaron?', 'Juge-t-on quelqu\'un d\'après le groupe d\'où il vient ? Qu\'est-ce qui change si l\'on sait qu\'on l\'a forcé ?'),
      options: [
        { label: L('Acompañarle hasta la escalera', 'L\'accompagner jusqu\'à l\'escalier'), desc: L('Le curáis las rozaduras de las cadenas (−1 poción). En agradecimiento os da una bomba de la forja (+1 bomba).', 'Vous soignez les marques des chaînes (−1 potion). Pour vous remercier, il vous donne une bombe de la forge (+1 bombe).'), fx: { potion: -1, bomb: 1 },
          after: L('El orco camina detrás del grupo sin decir palabra. En la escalera os da un saquito de la forja y señala hacia arriba, hacia la luz.', 'L\'orque marche derrière le groupe sans un mot. Dans l\'escalier, il vous tend une petite bourse de la forge et montre le haut, vers la lumière.'),
          why: {
            cons: L('Si los orcos libres ven que les ayudamos, quizá dejen de servir a los que mandan en la Hondura.', 'Si les orques libérés voient qu\'on les aide, ils cesseront peut-être de servir les maîtres des Tréfonds.'),
            deber: L('Alguien nos pide ayuda y podemos dársela. Con eso basta.', 'Quelqu\'un nous demande de l\'aide et nous pouvons la lui donner. Cela suffit.'),
            caracter: L('Yo también me he sentido perdido alguna vez. No le juzgo por el grupo del que viene.', 'Moi aussi, je me suis déjà senti perdu. Je ne le juge pas d\'après les siens.') } },
        { label: L('Indicarle el camino y seguir', 'Lui indiquer le chemin et continuer'), desc: L('No perdéis tiempo ni provisiones.', 'Vous ne perdez ni temps ni provisions.'), fx: {},
          after: L('El orco duda, mira la escalera y empieza a subir solo, despacio, sin mirar atrás.', 'L\'orque hésite, regarde l\'escalier et commence à monter seul, lentement, sans se retourner.'),
          why: {
            cons: L('Tenemos una misión. Cada hora que perdemos, la Hondura la gana. Primero, terminarla.', 'Nous avons une mission. Chaque heure perdue profite aux Tréfonds. D\'abord, la finir.'),
            deber: L('Le hemos dado lo que nos pidió: el camino. Ahora la decisión es suya.', 'Nous lui avons donné ce qu\'il demandait : le chemin. Maintenant, c\'est à lui de décider.'),
            caracter: L('Ayudar también es dejar que cada cual haga su propio camino.', 'Aider, c\'est aussi laisser chacun faire sa propre route.') } }
      ]
    },
    mochila: {
      title: L('La mochila de Hob', 'Le sac de Hob'),
      prompt: L('Junto a la pared hay una mochila con un nombre bordado: «Hob». Dentro, provisiones y una nota: «Vuelvo enseguida».', 'Contre le mur, un sac porte un nom brodé : « Hob ». Dedans, des provisions et un mot : « Je reviens tout de suite ».'),
      family: L('¿Lo que encuentras es tuyo si su dueño no está? ¿Cambia algo que nadie te vea?', 'Ce que tu trouves t\'appartient-il si son propriétaire n\'est pas là ? Est-ce que ça change quelque chose que personne ne te voie ?'),
      options: [
        { label: L('Coger las provisiones', 'Prendre les provisions'), desc: L('+1 poción.', '+1 potion.'), fx: { potion: 1 },
          after: L('Os lleváis las provisiones. La nota se queda sola sobre la piedra.', 'Vous emportez les provisions. Le mot reste seul sur la pierre.'),
          why: {
            cons: L('Aquí abajo una poción puede sacarnos de un apuro. Mejor usarla que dejar que se pierda.', 'Ici, une potion peut nous tirer d\'affaire. Mieux vaut s\'en servir que la laisser se perdre.'),
            deber: L('Lo que se encuentra perdido es de quien lo encuentra: así ha sido siempre.', 'Ce qui est perdu appartient à qui le trouve : il en a toujours été ainsi.'),
            caracter: L('Un aventurero práctico aprovecha lo que encuentra. Si Hob vuelve, lo entenderá.', 'Un aventurier pratique profite de ce qu\'il trouve. Si Hob revient, il comprendra.') } },
        { label: L('Dejarla donde está', 'Le laisser où il est'), desc: L('Nada para vosotros.', 'Rien pour vous.'), fx: {},
          after: L('Dejáis la mochila como estaba. Alguien añade una línea a la nota: «Ánimo, Hob».', 'Vous laissez le sac tel quel. Quelqu\'un ajoute une ligne au mot : « Courage, Hob ».'),
          why: {
            cons: L('Si Hob vuelve y no encuentra nada, lo pasará muy mal. Para nosotros es poco; para él, mucho.', 'Si Hob revient et ne trouve rien, il sera bien en peine. Pour nous c\'est peu ; pour lui, beaucoup.'),
            deber: L('No es nuestro. Lo que no es tuyo no se coge, aunque nadie mire.', 'Ce n\'est pas à nous. On ne prend pas ce qui ne nous appartient pas, même si personne ne regarde.'),
            caracter: L('Quiero ser alguien de quien uno se pueda fiar, también cuando nadie lo sabría.', 'Je veux être quelqu\'un de confiance, même quand personne ne le saurait.') } }
      ]
    },
    mentira: {
      title: L('La pregunta del novicio', 'La question du novice'),
      prompt: L('Un novicio de la Orden se ha perdido y tiembla junto a vuestro fuego. Os pregunta si el camino hacia abajo es seguro. No lo es.', 'Un novice de l\'Ordre s\'est perdu et tremble près de votre feu. Il vous demande si le chemin vers le bas est sûr. Il ne l\'est pas.'),
      family: L('¿Está bien mentir para que alguien se sienta mejor? ¿Hay mentiras pequeñas y mentiras grandes?', 'Est-ce bien de mentir pour que quelqu\'un se sente mieux ? Y a-t-il des petits et des gros mensonges ?'),
      options: [
        { label: L('Decirle la verdad', 'Lui dire la vérité'), desc: L('Vuelve arriba asustado. Nada cambia para vosotros.', 'Il remonte, effrayé. Rien ne change pour vous.'), fx: {},
          after: L('El novicio traga saliva, os da las gracias y sube la escalera a toda prisa.', 'Le novice déglutit, vous remercie et remonte l\'escalier à toute allure.'),
          why: {
            cons: L('Si le mentimos, puede meterse en un lío mucho peor. La verdad le protege.', 'Si on lui ment, il risque de se mettre dans un pétrin bien pire. La vérité le protège.'),
            deber: L('No se miente. Ni siquiera para que alguien se sienta mejor.', 'On ne ment pas. Même pas pour que quelqu\'un se sente mieux.'),
            caracter: L('Quiero que la gente pueda fiarse de lo que digo.', 'Je veux que les gens puissent se fier à ce que je dis.') } },
        { label: L('Decirle que no hay peligro', 'Lui dire qu\'il n\'y a aucun danger'), desc: L('Se queda tranquilo y os deja sus provisiones: +1 poción.', 'Il se rassure et vous laisse ses provisions : +1 potion.'), fx: { potion: 1 },
          after: L('El novicio sonríe, más tranquilo. Os deja sus provisiones y se queda junto al fuego, esperando a que volváis.', 'Le novice sourit, rassuré. Il vous laisse ses provisions et reste près du feu à attendre votre retour.'),
          why: {
            cons: L('Estaba muy asustado. Una mentira pequeña le ha quitado un miedo muy grande.', 'Il avait très peur. Un petit mensonge lui a enlevé une très grande peur.'),
            deber: L('Hay que cuidar de los más débiles; a veces eso pide callarse una parte.', 'Il faut prendre soin des plus faibles ; parfois, cela demande de taire une partie.'),
            caracter: L('Ser amable a veces importa más que ser exacto.', 'Être gentil compte parfois plus qu\'être exact.') } }
      ]
    },
    trampa: {
      title: L('La trampa de la escalera', 'Le piège de l\'escalier'),
      prompt: L('En la escalera que baja hay una trampa. Si la dejáis armada, frenará a las criaturas que os siguen. Pero mañana podrían bajar por aquí otros exploradores.', 'Dans l\'escalier qui descend, il y a un piège. Si vous le laissez armé, il retiendra les créatures qui vous suivent. Mais demain, d\'autres explorateurs pourraient passer par là.'),
      family: L('¿Está bien poner en riesgo a desconocidos para protegerte tú? ¿Y si les dejas un aviso?', 'Est-ce juste de mettre des inconnus en danger pour te protéger ? Et si tu leur laisses un avertissement ?'),
      options: [
        { label: L('Desarmarla', 'Le désarmer'), desc: L('El camino queda seguro para todos. Nada más.', 'Le chemin reste sûr pour tout le monde. Rien de plus.'), fx: {},
          after: L('El mecanismo cede con un clic. La escalera queda libre para quien venga detrás.', 'Le mécanisme cède avec un clic. L\'escalier est libre pour ceux qui viendront après.'),
          why: {
            cons: L('Un explorador herido mañana pesa más que una noche tranquila hoy.', 'Un explorateur blessé demain pèse plus lourd qu\'une nuit tranquille aujourd\'hui.'),
            deber: L('No se pone en peligro a quien no tiene culpa de nada.', 'On ne met pas en danger quelqu\'un qui n\'y est pour rien.'),
            caracter: L('Quiero ser de los que dejan el camino mejor de como lo encontraron.', 'Je veux être de ceux qui laissent le chemin meilleur qu\'ils ne l\'ont trouvé.') } },
        { label: L('Dejarla armada', 'Le laisser armé'), desc: L('Las criaturas no os molestan esta noche: todos empezáis el próximo nivel Inspirados (+1 dado).', 'Les créatures vous laissent tranquilles cette nuit : tout le monde commence le prochain niveau Inspiré (+1 dé).'), fx: { sharp: true },
          after: L('Esa noche nada os molesta. Por la mañana, nadie dice nada al pasar junto a la trampa.', 'Cette nuit-là, rien ne vous dérange. Au matin, personne ne dit un mot en passant près du piège.'),
          why: {
            cons: L('Las criaturas son un peligro seguro; los exploradores, solo un quizá. Me ocupo de lo seguro.', 'Les créatures sont un danger certain ; les explorateurs, seulement un peut-être. Je m\'occupe du certain.'),
            deber: L('Mi deber es proteger primero a mi grupo.', 'Mon devoir est de protéger d\'abord mon groupe.'),
            caracter: L('Un buen guardián piensa en los suyos antes que en nadie.', 'Un bon gardien pense aux siens avant tout.') } }
      ]
    }
  },
  CAMPAIGN: ['trasgo', 'orco'],
  DESCENT: ['mochila', 'mentira', 'trampa'],
  speaker(kind) {
    const party = GAME.party || [];
    const pref = this.VOICE[kind].find((id) => party.includes(id));
    return pref || party[Object.keys(this.VOICE).indexOf(kind) % Math.max(1, party.length)] || 'barbaro';
  },
  // nextCh: índice del capítulo (o nivel) en el que se notan los efectos
  async dilemma(id, nextCh) {
    const D = this.DILEMMAS[id]; if (!D) return;
    this.css();
    const n = this.night();
    const opt = await UI.choice(D.prompt, D.options.map((o) => ({ label: o.label, desc: o.desc })), { title: L('Dilema de la noche', 'Dilemme de la nuit') + ' · ' + D.title });
    const picked = D.options.find((o) => o.label === (opt && opt.label)) || D.options[0];
    this.applyFx(picked.fx, nextCh);
    await UI.say('narrador', picked.after);
    // ¿por qué? tres razones, dichas por tres héroes del grupo
    const kinds = ['cons', 'deber', 'caracter'];
    const used = [];
    const reasons = kinds.map((k) => {
      let who = this.speaker(k); if (used.includes(who)) who = (GAME.party || []).find((p) => !used.includes(p)) || who; used.push(who);
      const nm = HERO_DEFS[who] ? HERO_DEFS[who].name : '';
      return { k, who, label: nm, desc: L(`«${picked.why[k]}»`, `« ${picked.why[k]} »`) };
    });
    const box = document.getElementById('choice'); if (box) box.classList.add('saber-why');
    const why = await UI.choice(L('¿Por qué lo habéis decidido así? Elige la razón que más se parece a la tuya.', 'Pourquoi avez-vous décidé ainsi ? Choisis la raison qui ressemble le plus à la tienne.'),
      reasons.map((r) => ({ label: r.label, desc: r.desc })), { title: L('¿Por qué?', 'Pourquoi ?') });
    if (box) box.classList.remove('saber-why');
    const r = reasons.find((q) => q.desc === (why && why.desc)) || reasons[0];
    UI.endDialogue && UI.endDialogue();
    n.dilemma = { id, opt: D.options.indexOf(picked), why: r.k };
    await this.reveal(D, picked, r.k);
  },
  applyFx(fx, nextCh) {
    if (!fx) return;
    const it = GAME.items || (GAME.items = {});
    if (fx.potion) it.potion = Math.max(0, (it.potion || 0) + fx.potion);
    if (fx.bomb) it.bomb = Math.max(0, (it.bomb || 0) + fx.bomb);
    if (fx.gold) GAME.gold = Math.max(0, (GAME.gold || 0) + fx.gold);
    if (fx.traps) GAME.flags.trapsKnownCh = nextCh;
    if (fx.sharp) GAME.flags.sharpCh = nextCh;
  },
  reveal(D, picked, k) {
    return new Promise((resolve) => {
      const P = this.PHILO[k];
      const s = UI.screen(`<div class="card saber-card"><div class="eyebrow">${L('Dilema de la noche', 'Dilemme de la nuit')} · ${U.esc(D.title)}</div>
        <h2>${U.esc(P.name)}</h2>
        <p class="lead">${U.esc(P.text)}</p>
        <div class="sb-three">${Object.keys(this.PHILO).map((q) => `<div class="${q === k ? 'on' : ''}"><b>${U.esc(this.PHILO[q].who)}</b><small>${U.esc(this.PHILO[q].name)}</small></div>`).join('')}</div>
        <p class="small">${L('No hay respuesta correcta: estos tres pensadores llevan siglos sin ponerse de acuerdo. Lo que importa es saber por qué eliges lo que eliges.', 'Il n\'y a pas de bonne réponse : ces trois penseurs ne sont pas d\'accord depuis des siècles. Ce qui compte, c\'est de savoir pourquoi tu choisis ce que tu choisis.')}</p>
        <div class="sb-family"><span class="eyebrow">${L('Para hablar en familia', 'À discuter en famille')}</span><p>${U.esc(D.family)}</p></div>
        <div class="row end"><button class="btn primary" id="sb-ok">${L('Seguir', 'Continuer')}</button></div></div>`, 'dim');
      audio.sfx('reveal', { vol: 0.4 });
      s.querySelector('#sb-ok').onclick = () => { audio.sfx('ui'); UI.screen(null); resolve(); };
    });
  },

  /* ---------------- Crónica de la noche ---------------- */
  chronicle() {
    return new Promise((resolve) => {
      this.css();
      const n = this.night();
      const pct = n.dice ? Math.round((n.skulls / n.dice) * 100) : 0;
      const tahurOn = SETTINGS.tahur !== false;
      const rows = [];
      rows.push(`<div class="sb-row"><span class="eyebrow">${L('Ojo de Tahúr', 'Œil du Parieur')}</span><p>${n.est
        ? L(`${n.est} ${n.est === 1 ? 'estimación' : 'estimaciones'}, ${n.estOk} ${n.estOk === 1 ? 'acertada' : 'acertadas'}. Nivel: <b>${U.esc(this.levelName())}</b> (${U.esc(this.LEVELS[this.prog.lvl].what)}).`, `${n.est} estimation${n.est > 1 ? 's' : ''}, ${n.estOk} juste${n.estOk > 1 ? 's' : ''}. Niveau : <b>${U.esc(this.levelName())}</b> (${U.esc(this.LEVELS[this.prog.lvl].what)}).`)
        : tahurOn ? L('Esta vez no has estimado ninguna tirada.', 'Cette fois, tu n\'as estimé aucun lancer.') : L('Desactivado. Puedes encenderlo en Ajustes.', 'Désactivé. Tu peux l\'activer dans les Réglages.')}</p></div>`);
      if (n.dice) rows.push(`<div class="sb-row"><span class="eyebrow">${L('Libro de Tiradas', 'Livre des Lancers')}</span>
        <p>${L(`Vuestros héroes han tirado <b>${n.dice}</b> dados de ataque y han salido <b>${n.skulls}</b> calaveras: el <b>${pct} %</b>.`, `Vos héros ont lancé <b>${n.dice}</b> dés d'attaque et obtenu <b>${n.skulls}</b> crânes : <b>${pct} %</b>.`)}</p>
        <div class="sb-bar" role="img" aria-label="${pct}%"><i style="width:${pct}%"></i><em style="left:50%"></em></div>
        <p class="small">${L('Lo esperado es el 50 %, porque 3 de las 6 caras son calavera. Cuantos más dados tiras, más se acerca: es la ley de los grandes números.', 'On attend 50 %, car 3 faces sur 6 sont des crânes. Plus tu lances de dés, plus tu t\'en approches : c\'est la loi des grands nombres.')}</p></div>`);
      if (n.dilemma && this.DILEMMAS[n.dilemma.id]) {
        const D = this.DILEMMAS[n.dilemma.id], o = D.options[n.dilemma.opt] || D.options[0], P = this.PHILO[n.dilemma.why];
        rows.push(`<div class="sb-row"><span class="eyebrow">${L('Dilema de la noche', 'Dilemme de la nuit')}</span><p>${L('Elegisteis: ', 'Vous avez choisi : ')}<b>${U.esc(o.label)}</b>${P ? ` · ${U.esc(P.name)} (${U.esc(P.who)})` : ''}.</p></div>`);
        rows.push(`<div class="sb-family"><span class="eyebrow">${L('Pregunta para la cena', 'Question pour le dîner')}</span><p>${U.esc(D.family)}</p></div>`);
      }
      const s = UI.screen(`<div class="card saber-card"><div class="eyebrow">${L('Crónica de la noche', 'Chronique de la nuit')}</div>
        <h2>${L('Lo que ha pasado ahí abajo', 'Ce qui s\'est passé en bas')}</h2>${rows.join('')}
        <div class="row end"><button class="btn primary" id="sb-ok">${L('Seguir', 'Continuer')}</button></div></div>`, 'dim');
      s.querySelector('#sb-ok').onclick = () => {
        audio.sfx('ui'); UI.screen(null);
        GAME.flags.saber = { est: 0, estOk: 0, dice: 0, skulls: 0, dilemma: null };
        resolve();
      };
    });
  },

  /* ---------------- estilos propios ---------------- */
  css() {
    if (document.getElementById('saber-css')) return;
    const st = document.createElement('style'); st.id = 'saber-css';
    st.textContent = `
.saber-pop { position: fixed; left: 50%; bottom: calc(16px + env(safe-area-inset-bottom)); transform: translate(-50%, 12px); width: min(560px, calc(100vw - 20px)); z-index: 58; padding: 14px 16px 16px; background: linear-gradient(180deg, rgba(30, 22, 15, 0.97), rgba(14, 10, 7, 0.97)); border: 1px solid var(--bronze); border-top: 3px solid var(--hc, #e9b864); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6); opacity: 0; transition: opacity 0.18s, transform 0.18s; }
.saber-pop.in { opacity: 1; transform: translate(-50%, 0); }
.saber-pop .sp-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.saber-pop .sp-skip { background: none; border: 0; color: var(--ash); font: inherit; font-size: var(--t-s); text-decoration: underline; cursor: pointer; padding: 6px; }
.saber-pop .sp-q { font-family: var(--f-story); font-size: var(--t-l); line-height: 1.35; color: var(--bone); margin: 8px 0 12px; }
.saber-pop .sp-opts { display: grid; grid-template-columns: repeat(auto-fit, minmax(56px, 1fr)); gap: 8px; }
.saber-pop .sp-opts.wide { grid-template-columns: repeat(6, 1fr); }
.saber-pop .sp-opt { min-height: 46px; font-family: var(--f-sc); font-size: var(--t-m); color: var(--candle-hi); background: rgba(0, 0, 0, 0.35); border: 1px solid var(--bronze); cursor: pointer; }
.saber-pop .sp-opt:hover:not(:disabled) { border-color: var(--candle); }
.saber-pop .sp-opt.right { border-color: #7fd08a; color: #b8f0bf; box-shadow: 0 0 14px rgba(127, 208, 138, 0.35); }
.saber-pop .sp-opt.wrong { border-color: #c06a5a; color: #e8a090; }
.saber-pop .sp-opt:disabled { cursor: default; }
.saber-pop .sp-note { font-size: var(--t-xs); color: var(--ash); margin: 10px 0 0; }
.saber-pop .sp-res { margin: 12px 0 0; font-size: var(--t-s); line-height: 1.45; color: #e2d4b6; }
.saber-pop .sp-res b { color: var(--candle-hi); }
.saber-pop .sp-res.good b { color: #b8f0bf; }
.saber-pop .sp-go { display: flex; justify-content: flex-end; margin-top: 12px; }
.saber-why .ch-opt small { font-family: var(--f-story); font-style: italic; font-size: var(--t-m); color: var(--bone); line-height: 1.4; }
.saber-card .sb-row { border-top: 1px solid rgba(180, 140, 90, 0.25); padding-top: 10px; }
.saber-card .sb-row p { margin: 4px 0 0; color: #e2d4b6; line-height: 1.45; }
.saber-card .sb-bar { position: relative; height: 12px; margin: 8px 0 6px; background: rgba(0, 0, 0, 0.45); border: 1px solid var(--bronze); }
.saber-card .sb-bar i { position: absolute; left: 0; top: 0; bottom: 0; background: linear-gradient(90deg, #8a5a2a, #e9b864); }
.saber-card .sb-bar em { position: absolute; top: -4px; bottom: -4px; width: 2px; background: var(--bone); }
.saber-card .sb-three { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.saber-card .sb-three div { padding: 10px; border: 1px solid rgba(180, 140, 90, 0.35); opacity: 0.6; display: flex; flex-direction: column; gap: 2px; }
.saber-card .sb-three div.on { opacity: 1; border-color: var(--candle); box-shadow: 0 0 16px rgba(233, 184, 100, 0.2); }
.saber-card .sb-three b { color: var(--candle-hi); font-family: var(--f-sc); }
.saber-card .sb-three small { color: var(--ash); font-size: var(--t-xs); }
.saber-card .sb-family { padding: 12px 14px; background: rgba(233, 184, 100, 0.08); border-left: 3px solid var(--candle); }
.saber-card .sb-family p { margin: 4px 0 0; font-family: var(--f-story); font-style: italic; font-size: var(--t-l); color: var(--bone); line-height: 1.4; }
@media (max-width: 560px) { .saber-pop .sp-opts.wide { grid-template-columns: repeat(6, 1fr); gap: 6px; } .saber-card .sb-three { grid-template-columns: 1fr; } }
`;
    document.head.appendChild(st);
  }
};
