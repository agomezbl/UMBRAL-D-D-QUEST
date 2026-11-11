/* ==========================================================================
   Reglas sencillas, al estilo de los juegos de mesa de mazmorras:
   · Cada héroe tiene Vida, Ataque, Defensa y Movimiento.
   · Atacar: tantos dados como el Ataque; cada calavera es un golpe.
   · Defender: los héroes paran con escudos blancos (2 de 6 caras) y los
     monstruos con escudos negros (1 de 6). Daño = calaveras − escudos.
   · Forzar una cerradura o desarmar una trampa: se tiran dados de combate y
     cuentan las calaveras.
   ========================================================================== */

/* Estados alterados (duración en turnos propios) */
const STATUS = {
  aterrado: { name: L('Asustado', 'Effrayé'), icon: 'eye', bad: true, desc: L('−1 dado de ataque.', '−1 dé d’attaque.') },
  envenenado: { name: L('Envenenado', 'Empoisonné'), icon: 'potion', bad: true, desc: L('Pierde 1 PV al empezar su turno.', 'Perd 1 PV au début de son tour.') },
  ardiendo: { name: L('Ardiendo', 'En feu'), icon: 'flame', bad: true, desc: L('Pierde 1 PV al empezar su turno.', 'Perd 1 PV au début de son tour.') },
  aturdido: { name: L('Aturdido', 'Étourdi'), icon: 'skull', bad: true, desc: L('Pierde su próximo turno.', 'Passe son prochain tour.') },
  huyendo: { name: L('Huyendo', 'En fuite'), icon: 'boot', bad: true, desc: L('Se aleja de los héroes y no ataca.', 'S’éloigne des héros et n’attaque pas.') },
  inspirado: { name: L('Inspirado', 'Inspiré'), icon: 'crown', desc: L('+1 dado en su próximo ataque.', '+1 dé à sa prochaine attaque.') },
  muralla: { name: L('Muralla', 'Muraille'), icon: 'shield', desc: L('+2 dados de defensa hasta su próximo turno.', '+2 dés de défense jusqu’à son prochain tour.') },
  guard: { name: L('Protegido', 'Protégé'), icon: 'shield', desc: L('+1 dado de defensa hasta su próximo turno.', '+1 dé de défense jusqu’à son prochain tour.') },
  taunt: { name: L('Provocando', 'Provocation'), icon: 'target', desc: L('Los enemigos cercanos le prefieren como objetivo.', 'Les ennemis proches le ciblent en priorité.') },
  desangrando: { name: L('Sin fuerzas', 'À bout de forces'), icon: 'heart', bad: true, desc: L('Si nadie le levanta a tiempo, el grupo tendrá que retirarse.', 'Si personne ne le relève à temps, le groupe devra battre en retraite.') }
};

/* Rasgos de criaturas (para la ficha y la IA) */
const ETRAITS = {
  sinMiedo: { name: L('Sin miedo', 'Intrépide'), desc: L('Nunca huye ni se asusta.', 'Ne fuit jamais et n’a jamais peur.') },
  cobarde: { name: L('Cobarde', 'Lâche'), desc: L('Huye en cuanto la pelea se tuerce.', 'Fuit dès que le combat tourne mal.') },
  veneno: { name: L('Mordisco infecto', 'Morsure infectée'), desc: L('Al herir, envenena.', 'Empoisonne quand il blesse.') },
  aterrador: { name: L('Aterrador', 'Terrifiant'), desc: L('Al herir, asusta (−1 dado de ataque).', 'Effraie quand il blesse (−1 dé d’attaque).') },
  aturdidor: { name: L('Golpe demoledor', 'Coup dévastateur'), desc: L('Si hace 2 o más de daño, aturde.', 'Étourdit s’il inflige 2 dégâts ou plus.') },
  incendiario: { name: L('Fuego', 'Feu'), desc: L('Al herir, prende fuego al objetivo.', 'Met le feu à sa cible quand il blesse.') },
  furia: { name: L('Furia', 'Furie'), desc: L('+1 dado de ataque cuando está herido.', '+1 dé d’attaque quand il est blessé.') },
  lider: { name: L('Líder', 'Meneur'), desc: L('Si cae, sus aliados pueden huir.', 'S’il tombe, ses alliés peuvent fuir.') },
  sanador: { name: L('Sanador', 'Guérisseur'), desc: L('Cura a sus aliados heridos.', 'Soigne ses alliés blessés.') },
  vuela: { name: L('Etéreo', 'Éthéré'), desc: L('Flota sobre fosos y lava.', 'Flotte au-dessus des fosses et de la lave.') },
  noMuerto: { name: L('No muerto', 'Mort-vivant'), desc: L('Vulnerable a la magia (+1 dado).', 'Vulnérable à la magie (+1 dé).') },
  incorporeo: { name: L('Incorpóreo', 'Incorporel'), desc: L('Las armas no mágicas le hacen un dado menos.', 'Les armes non magiques lancent un dé de moins contre lui.') },
  cristal: { name: L('Cristal', 'Cristal'), desc: L('Las flechas y la magia le hacen un dado menos.', 'Les flèches et la magie lancent un dé de moins contre lui.') },
  fuegoVivo: { name: L('Fuego vivo', 'Feu vivant'), desc: L('El fuego le hace un dado menos y no arde.', 'Le feu lance un dé de moins contre lui, et il ne brûle pas.') },
  campeon: { name: L('Campeón', 'Champion'), desc: L('Élite de la Sombra: +1 PV, +1 dado de ataque y más astucia.', 'Élite de l’Ombre : +1 PV, +1 dé d’attaque et plus de ruse.') }
};

const ROLES = {
  bruto: L('Bruto · carga contra el más cercano', 'Brute · charge le plus proche'),
  tirador: L('Tirador · ataca a distancia', 'Tireur · attaque à distance'),
  hostigador: L('Hostigador · busca presas débiles', 'Harceleur · cherche des proies faibles'),
  lanzador: L('Lanzador · se queda atrás y apoya', 'Mage · reste en retrait et soutient'),
  espectro: L('Espectro · atraviesa la lucha y asusta', 'Spectre · traverse la mêlée et effraie'),
  coloso: L('Coloso · lento y demoledor', 'Colosse · lent et dévastateur'),
  copia: L('Copia · imita a quien refleja', 'Copie · imite celui qu’il reflète'),
  jefe: L('Guardián', 'Gardien')
};

/* Tipos de daño: qué resisten o temen las criaturas */
const DTYPES = { phys: L('golpe', 'coup'), pierce: L('flecha', 'flèche'), radiant: L('luz', 'lumière'), fire: L('fuego', 'feu'), arcane: L('magia', 'magie') };

/* Dificultad: cambia cómo piensa la Sombra y qué pasa al caer, no solo los números */
const DIFFICULTY = {
  relato: { id: 'relato', name: L('Relato', 'Récit'), iq: -1, enemyHp: 0, bossHp: -2, enemyAtk: -1, bossAtk: 0, heroHp: 2, foes: 1, doom: 11, potions: 3, champions: 0, fall: 'auto', wounds: false, summons: 4,
    blurb: L('Para disfrutar de la historia. Más vida, la Sombra es torpe y quien cae se levanta solo.', 'Pour profiter de l’histoire. Plus de vie, l’Ombre est maladroite et un héros à terre se relève tout seul.') },
  heroe: { id: 'heroe', name: L('Héroe', 'Héros'), iq: 0, enemyHp: 0, bossHp: 0, enemyAtk: 0, bossAtk: 0, heroHp: 0, foes: 1.2, doom: 8, potions: 2, champions: 0, fall: 'ally', wounds: true, summons: 6,
    blurb: L('La experiencia pensada. Cada criatura juega a su manera y quien cae necesita que un compañero le levante.', 'L’expérience prévue. Chaque créature joue à sa façon et un héros à terre a besoin qu’un compagnon le relève.') },
  pesadilla: { id: 'pesadilla', name: L('Pesadilla', 'Cauchemar'), iq: 1, enemyHp: 1, bossHp: 3, enemyAtk: 0, bossAtk: 0, heroHp: 0, foes: 1.05, doom: 7, potions: 2, champions: 5, fall: 'bleed', bleed: 3, wounds: true, summons: 8,
    blurb: L('La Sombra piensa más rápido, hay campeones y quien cae se queda sin fuerzas: si nadie le levanta en 3 rondas, el grupo se retira y se repite la aventura.', 'L’Ombre réfléchit plus vite, il y a des champions et un héros à terre est à bout de forces : si personne ne le relève en 3 manches, le groupe bat en retraite et l’aventure recommence.') }
};

/* Cuántos enemigos según el tamaño del grupo (pensado para 3 héroes) */
const PARTY_SCALE = {
  foes: [0.45, 0.6, 1, 1.2, 1.4],
  boss: [0.55, 0.8, 1, 1.2, 1.4],
  // en solitario: más vida, un dado más de ataque y de defensa, una poción más y la Hondura tarda más en agitarse
  hp: [4, 0, 0, 0, 0],
  atk: [1, 0, 0, 0, 0],
  def: [1, 0, 0, 0, 0],
  potions: [1, 0, 0, 0, 0],
  doom: [3, 1, 0, 0, 0],
  of(n, k) { return this[k][U.clamp(n, 1, 5) - 1]; }
};

/* Talentos: al acampar, cada héroe del grupo elige uno (dos rangos).
   «mods» suma a sus números; el resto se comprueba por su id */
const TALENTS = {
  barbaro: [
    [{ id: 'brazo', name: L('Brazo de hierro', 'Bras de fer'), mods: { atk: 1 }, desc: L('+1 dado de ataque.', '+1 dé d’attaque.') },
      { id: 'curtido', name: L('Piel curtida', 'Cuir tanné'), mods: { hp: 3 }, desc: L('+3 de vida.', '+3 PV.') }],
    [{ id: 'torbellinoVeloz', name: L('Torbellino veloz', 'Tourbillon éclair'), desc: L('Torbellino se recarga en 2 rondas.', 'Tourbillon se recharge en 2 manches.') },
      { id: 'indomable', name: L('Indomable', 'Indomptable'), desc: L('Una vez por aventura, al caer se levanta solo con 3 PV.', 'Une fois par aventure, quand il tombe, il se relève seul avec 3 PV.') }]
  ],
  enano: [
    [{ id: 'piedra', name: L('Piel de piedra', 'Peau de pierre'), mods: { def: 1 }, desc: L('+1 dado de defensa.', '+1 dé de défense.') },
      { id: 'pesado', name: L('Martillo pesado', 'Marteau lourd'), mods: { atk: 1 }, desc: L('+1 dado de ataque.', '+1 dé d’attaque.') }],
    [{ id: 'terremoto', name: L('Terremoto', 'Séisme'), desc: L('Martillo sísmico aturde a los enemigos a 2 casillas, no solo a los de al lado.', 'Marteau sismique étourdit les ennemis à 2 cases, pas seulement ceux d’à côté.') },
      { id: 'murallaHierro', name: L('Muralla de hierro', 'Muraille de fer'), desc: L('Muralla también protege a los aliados de al lado (+1 dado de defensa).', 'Muraille protège aussi les alliés d’à côté (+1 dé de défense).') }]
  ],
  elfa: [
    [{ id: 'pies', name: L('Pies ligeros', 'Pieds légers'), mods: { mv: 2 }, desc: L('+2 de movimiento.', '+2 de déplacement.') },
      { id: 'certera', name: L('Flecha certera', 'Flèche précise'), desc: L('Sus flechas ignoran 1 escudo.', 'Ses flèches ignorent 1 bouclier.') }],
    [{ id: 'tormenta', name: L('Tormenta de flechas', 'Tempête de flèches'), desc: L('Lluvia de flechas tira 3 dados a cada enemigo, no 2.', 'Pluie de flèches lance 3 dés sur chaque ennemi, au lieu de 2.') },
      { id: 'viento', name: L('Salto del viento', 'Bond du vent'), desc: L('Salto élfico se recarga en 2 rondas y la deja Inspirada.', 'Bond elfique se recharge en 2 manches et la rend Inspirée.') }]
  ],
  hechicero: [
    [{ id: 'llama', name: L('Llama viva', 'Flamme vive'), desc: L('Bola de fuego deja ardiendo a quien hiere.', 'Boule de feu met en feu ceux qu’elle blesse.') },
      { id: 'vigor', name: L('Vigor arcano', 'Vigueur arcanique'), mods: { hp: 3 }, desc: L('+3 de vida.', '+3 PV.') }],
    [{ id: 'meteoro', name: L('Meteoro', 'Météore'), desc: L('Bola de fuego tira 4 dados al objetivo y 3 a los de al lado.', 'Boule de feu lance 4 dés sur la cible et 3 sur ses voisins.') },
      { id: 'aurora', name: L('Mano de la aurora', 'Main de l’aurore'), desc: L('Luz sanadora cura 1 más y también 2 PV a los aliados junto al objetivo.', 'Lumière guérisseuse soigne 1 de plus, et aussi 2 PV aux alliés voisins de la cible.') }]
  ],
  amazona: [
    [{ id: 'fresno', name: L('Lanza de fresno', 'Lance de frêne'), mods: { atk: 1 }, desc: L('+1 dado de ataque.', '+1 dé d’attaque.') },
      { id: 'bronce', name: L('Escudo de bronce', 'Bouclier de bronze'), mods: { def: 1 }, desc: L('+1 dado de defensa.', '+1 dé de défense.') }],
    [{ id: 'imparable', name: L('Carga imparable', 'Charge irrésistible'), desc: L('La Carga tira 2 dados más en lugar de 1.', 'La Charge lance 2 dés de plus au lieu de 1.') },
      { id: 'cancion', name: L('Canción de guerra', 'Chant de guerre'), desc: L('Grito de la tribu también cura 2 PV a quien inspira.', 'Cri de la tribu soigne aussi 2 PV à ceux qu’il inspire.') }]
  ]
};

/* Mejoras del Descenso, cuando ya no quedan talentos */
const BOONS = [
  { id: 'hp', name: L('+2 de vida', '+2 PV'), icon: 'heart', mods: { hp: 2 } },
  { id: 'atk', name: L('+1 dado de ataque', '+1 dé d’attaque'), icon: 'sword', mods: { atk: 1 } },
  { id: 'def', name: L('+1 dado de defensa', '+1 dé de défense'), icon: 'shield', mods: { def: 1 } },
  { id: 'mv', name: L('+1 de movimiento', '+1 de déplacement'), icon: 'boot', mods: { mv: 1 } }
];

/* Equipo: cada pieza ocupa un hueco y solo la pueden llevar ciertos héroes */
const SLOTS = { mano: L('Mano', 'Main'), cuerpo: L('Cuerpo', 'Corps'), extra: L('Extra', 'Extra') };
const ALL_HEROES = ['barbaro', 'enano', 'elfa', 'hechicero', 'amazona'];
const GEAR = [
  // reliquias: una por héroe
  { id: 'kingAxe', who: ['barbaro'], slot: 'mano', name: L('Hacha de los Reyes del Norte', 'Hache des Rois du Nord'), icon: 'axe', cost: 120, mods: { atk: 1, magic: true }, look: 'axe', desc: L('+1 dado de ataque. Arma mágica: hiere de lleno a los espectros.', '+1 dé d’attaque. Arme magique : frappe les spectres de plein fouet.') },
  { id: 'forgeHammer', who: ['enano'], slot: 'mano', name: L('Martillo de la Forja Madre', 'Marteau de la Forge Mère'), icon: 'hammer', cost: 120, mods: { atk: 1, magic: true }, look: 'hammer', desc: L('+1 dado de ataque. Arma mágica.', '+1 dé d’attaque. Arme magique.') },
  { id: 'moonBow', who: ['elfa'], slot: 'mano', name: L('Arco de Lunaplata', 'Arc de Lune-d’Argent'), icon: 'bow', cost: 120, mods: { atk: 1, range: 7, magic: true }, look: 'bow', desc: L('+1 dado de ataque y alcance 7. Arma mágica.', '+1 dé d’attaque et portée 7. Arme magique.') },
  { id: 'dawnstaff', who: ['hechicero'], slot: 'mano', name: L('Báculo del Alba', 'Bâton de l’Aube'), icon: 'starfire', cost: 120, mods: { spell: 1 }, look: 'dawn', desc: L('+1 dado a la Saeta arcana y a la Bola de fuego; Luz sanadora cura 1 más.', '+1 dé au Trait arcanique et à la Boule de feu ; Lumière guérisseuse soigne 1 de plus.') },
  { id: 'sunSpear', who: ['amazona'], slot: 'mano', name: L('Lanza del Sol de Bronce', 'Lance du Soleil de Bronze'), icon: 'target', cost: 120, mods: { atk: 1, magic: true }, look: 'spear', desc: L('+1 dado de ataque. Arma mágica.', '+1 dé d’attaque. Arme magique.') },
  // equipo de la Orden
  { id: 'plate', who: ['barbaro', 'enano', 'amazona'], slot: 'cuerpo', name: L('Coraza de placas', 'Armure de plaques'), icon: 'armor', cost: 140, mods: { def: 2, mv: -1 }, desc: L('+2 dados de defensa, pero −1 de movimiento.', '+2 dés de défense, mais −1 de déplacement.') },
  { id: 'mail', who: ['barbaro', 'enano', 'elfa', 'amazona'], slot: 'cuerpo', name: L('Cota de malla', 'Cotte de mailles'), icon: 'armor', cost: 75, mods: { def: 1 }, desc: L('+1 dado de defensa.', '+1 dé de défense.') },
  { id: 'mantle', who: ['hechicero', 'elfa'], slot: 'cuerpo', name: L('Manto de Vigilia', 'Manteau de Veille'), icon: 'feather', cost: 100, mods: { def: 1, hp: 2 }, look: 'mantle', desc: L('+1 dado de defensa y +2 de vida.', '+1 dé de défense et +2 PV.') },
  { id: 'shield', who: ['enano', 'amazona'], slot: 'extra', name: L('Escudo de roble y hierro', 'Bouclier de chêne et de fer'), icon: 'shield', cost: 90, mods: { def: 1, hp: 1 }, desc: L('+1 dado de defensa y +1 de vida.', '+1 dé de défense et +1 PV.') },
  { id: 'gauntlets', who: ['barbaro', 'enano', 'amazona'], slot: 'extra', name: L('Guanteletes de hierro', 'Gantelets de fer'), icon: 'hand', cost: 90, mods: { melee: 1 }, desc: L('+1 dado en los ataques cuerpo a cuerpo.', '+1 dé aux attaques au corps à corps.') },
  { id: 'quiver', who: ['elfa'], slot: 'extra', name: L('Carcaj de flechas élficas', 'Carquois de flèches elfiques'), icon: 'bow', cost: 90, mods: { shoot: 1 }, desc: L('+1 dado al disparar.', '+1 dé au tir.') },
  { id: 'grimoire', who: ['hechicero'], slot: 'extra', name: L('Grimorio de cenizas', 'Grimoire de cendres'), icon: 'book', cost: 100, mods: { spell: 1 }, desc: L('+1 dado en los hechizos; Luz sanadora cura 1 más.', '+1 dé aux sorts ; Lumière guérisseuse soigne 1 de plus.') },
  { id: 'boots', who: ALL_HEROES, slot: 'extra', name: L('Botas de zancada', 'Bottes d’arpenteur'), icon: 'boot', cost: 70, mods: { mv: 1 }, desc: L('+1 de movimiento.', '+1 de déplacement.') },
  { id: 'amulet', who: ALL_HEROES, slot: 'extra', name: L('Amuleto de la Llama', 'Amulette de la Flamme'), icon: 'flame', cost: 80, mods: { hp: 3 }, desc: L('+3 de vida.', '+3 PV.') },
  { id: 'signet', who: ALL_HEROES, slot: 'extra', name: L('Sello de la Orden', 'Sceau de l’Ordre'), icon: 'ring', cost: 60, mods: { haggle: 1 }, desc: L('La tienda os rebaja un 10 % todo.', 'La boutique vous fait 10 % de remise sur tout.') },
  // hallazgos (no se venden)
  { id: 'tomasDagger', who: ALL_HEROES, slot: 'extra', name: L('Daga de Tomás', 'Dague de Tomás'), icon: 'dagger', cost: 0, found: true, mods: { melee: 1 }, desc: L('+1 dado en los ataques cuerpo a cuerpo. Era de un novicio del Archivo que bajó y no volvió.', '+1 dé aux attaques au corps à corps. Elle appartenait à un novice des Archives, descendu un jour et jamais remonté.') }
];

/* Velada en el campamento: una actividad por noche, sin tiradas.
   Algunas necesitan a un héroe concreto en el grupo */
const VIGILS = [
  { prompt: L('La noche en el rellano es larga. Solo hay fuerzas para una cosa antes de dormir.', 'La nuit est longue sur le palier. Il ne reste de forces que pour une chose avant de dormir.'), options: [
    { reward: 'vigor', label: L('Descansar de verdad', 'Se reposer vraiment'), desc: L('Todos empiezan el próximo capítulo con +2 de vida máxima.', 'Tout le monde commence le prochain chapitre avec +2 PV max.') },
    { reward: 'traps', req: ['elfa', 'enano'], label: L('Explorar el siguiente tramo', 'Partir en éclaireur'), desc: L('Las trampas del próximo capítulo empiezan señaladas. Necesita a la Elfa o al Enano.', 'Les pièges du prochain chapitre sont signalés dès le départ. Il faut l’Elfe ou le Nain.') },
    { reward: 'sharp', req: ['barbaro', 'amazona', 'enano'], label: L('Afilar las armas', 'Affûter les armes'), desc: L('Todos empiezan el próximo capítulo Inspirados (+1 dado en su primer ataque). Necesita a alguien que sepa de armas.', 'Tout le monde commence le prochain chapitre Inspiré (+1 dé à sa première attaque). Il faut quelqu’un qui s’y connaît en armes.') }
  ] },
  { prompt: L('Nadie quiere hablar del ojo del farol. Aun así, queda una última noche.', 'Personne ne veut parler de l’œil de la lanterne. Il reste pourtant une dernière nuit.'), options: [
    { reward: 'vigor', label: L('Descansar de verdad', 'Se reposer vraiment'), desc: L('Todos empiezan el último capítulo con +2 de vida máxima.', 'Tout le monde commence le dernier chapitre avec +2 PV max.') },
    { reward: 'traps', req: ['elfa', 'enano'], label: L('Adelantarse hasta la fortaleza de cristal', 'Pousser jusqu’à la forteresse de cristal'), desc: L('Las trampas del último capítulo empiezan señaladas. Necesita a la Elfa o al Enano.', 'Les pièges du dernier chapitre sont signalés dès le départ. Il faut l’Elfe ou le Nain.') },
    { reward: 'trueName', req: ['hechicero'], label: L('Descifrar el cuaderno cifrado de Osric', 'Déchiffrer le carnet codé d’Osric'), desc: L('Descubre el nombre verdadero de lo que vive en el farol: el enemigo final será más débil. Necesita al Hechicero.', 'Découvre le vrai nom de ce qui vit dans la lanterne : l’ennemi final sera plus faible. Il faut l’Enchanteur.') }
  ] }
];

/* Utilidades de reglas */
const RULES = {
  diff() { return DIFFICULTY[(window.GAME_DIFF || 'heroe')] || DIFFICULTY.heroe; },
  // probabilidad de sacar al menos «k» calaveras con «n» dados
  pAtLeast(n, k) {
    if (k <= 0) return 1;
    const b = U.binom(Math.max(0, n), 0.5); let p = 0;
    for (let i = k; i < b.length; i++) p += b[i];
    return p;
  },
  pct(p) { return Math.round(p * 100) + L('%', ' %'); }
};
