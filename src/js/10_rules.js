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
  aterrado: { name: 'Aterrado', icon: 'eye', bad: true, desc: '−1 dado de ataque.' },
  envenenado: { name: 'Envenenado', icon: 'potion', bad: true, desc: 'Pierde 1 PV al empezar su turno.' },
  ardiendo: { name: 'Ardiendo', icon: 'flame', bad: true, desc: 'Pierde 1 PV al empezar su turno.' },
  aturdido: { name: 'Aturdido', icon: 'skull', bad: true, desc: 'Pierde su próximo turno.' },
  huyendo: { name: 'Huyendo', icon: 'boot', bad: true, desc: 'Se aleja de los héroes y no ataca.' },
  inspirado: { name: 'Inspirado', icon: 'crown', desc: '+1 dado en su próximo ataque.' },
  muralla: { name: 'Muralla', icon: 'shield', desc: '+2 dados de defensa hasta su próximo turno.' },
  guard: { name: 'Protegido', icon: 'shield', desc: '+1 dado de defensa hasta su próximo turno.' },
  taunt: { name: 'Provocando', icon: 'target', desc: 'Los enemigos cercanos le prefieren como objetivo.' },
  desangrando: { name: 'Desangrándose', icon: 'heart', bad: true, desc: 'Si nadie le levanta a tiempo, morirá.' }
};

/* Rasgos de criaturas (para la ficha y la IA) */
const ETRAITS = {
  sinMiedo: { name: 'Sin miedo', desc: 'Nunca huye ni queda aterrado.' },
  cobarde: { name: 'Cobarde', desc: 'Huye en cuanto la pelea se tuerce.' },
  veneno: { name: 'Mordisco infecto', desc: 'Al herir, envenena.' },
  aterrador: { name: 'Aterrador', desc: 'Al herir, siembra el pánico (−1 dado de ataque).' },
  aturdidor: { name: 'Golpe demoledor', desc: 'Si hace 2 o más de daño, aturde.' },
  incendiario: { name: 'Fuego', desc: 'Al herir, prende fuego al objetivo.' },
  furia: { name: 'Furia', desc: '+1 dado de ataque cuando está herido.' },
  lider: { name: 'Líder', desc: 'Si cae, sus aliados pueden huir.' },
  sanador: { name: 'Sanador', desc: 'Cura a sus aliados heridos.' },
  vuela: { name: 'Etéreo', desc: 'Flota sobre fosos y lava.' },
  noMuerto: { name: 'No muerto', desc: 'Vulnerable a la magia (+1 dado).' },
  incorporeo: { name: 'Incorpóreo', desc: 'Las armas no mágicas le hacen un dado menos.' },
  cristal: { name: 'Cristal', desc: 'Las flechas y la magia le hacen un dado menos.' },
  fuegoVivo: { name: 'Fuego vivo', desc: 'El fuego le hace un dado menos y no arde.' },
  campeon: { name: 'Campeón', desc: 'Élite de la Sombra: +1 PV, +1 dado de ataque y más astucia.' }
};

const ROLES = {
  bruto: 'Bruto · carga contra el más cercano',
  tirador: 'Tirador · ataca a distancia',
  hostigador: 'Hostigador · busca presas débiles',
  lanzador: 'Lanzador · se queda atrás y apoya',
  espectro: 'Espectro · atraviesa la lucha y aterra',
  coloso: 'Coloso · lento y demoledor',
  copia: 'Copia · imita a quien refleja',
  jefe: 'Guardián'
};

/* Tipos de daño: qué resisten o temen las criaturas */
const DTYPES = { phys: 'golpe', pierce: 'flecha', radiant: 'luz', fire: 'fuego', arcane: 'magia' };

/* Dificultad: cambia cómo piensa la Sombra y qué pasa al caer, no solo los números */
const DIFFICULTY = {
  relato: { id: 'relato', name: 'Relato', iq: -1, enemyHp: 0, bossHp: -2, enemyAtk: -1, bossAtk: 0, heroHp: 2, foes: 1, doom: 9, potions: 3, champions: 0, fall: 'auto', wounds: false, summons: 4,
    blurb: 'Para disfrutar de la historia. Más vida, la Sombra es torpe y quien cae se levanta solo.' },
  heroe: { id: 'heroe', name: 'Héroe', iq: 0, enemyHp: 0, bossHp: 0, enemyAtk: 0, bossAtk: 0, heroHp: 0, foes: 1.2, doom: 6, potions: 2, champions: 0, fall: 'ally', wounds: true, summons: 6,
    blurb: 'La experiencia pensada. Cada criatura juega a su manera y quien cae necesita que un compañero le levante.' },
  pesadilla: { id: 'pesadilla', name: 'Pesadilla', iq: 1, enemyHp: 1, bossHp: 3, enemyAtk: 0, bossAtk: 0, heroHp: 0, foes: 1.05, doom: 5, potions: 2, champions: 5, fall: 'bleed', bleed: 3, wounds: true, summons: 8,
    blurb: 'La Sombra piensa más rápido, hay campeones y quien cae se desangra: si nadie le levanta en 3 rondas, se pierde la aventura.' }
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
    [{ id: 'brazo', name: 'Brazo de hierro', mods: { atk: 1 }, desc: '+1 dado de ataque.' },
      { id: 'curtido', name: 'Piel curtida', mods: { hp: 3 }, desc: '+3 de vida.' }],
    [{ id: 'torbellinoVeloz', name: 'Torbellino veloz', desc: 'Torbellino se recarga en 2 rondas.' },
      { id: 'indomable', name: 'Indomable', desc: 'Una vez por aventura, al caer se levanta solo con 3 PV.' }]
  ],
  enano: [
    [{ id: 'piedra', name: 'Piel de piedra', mods: { def: 1 }, desc: '+1 dado de defensa.' },
      { id: 'pesado', name: 'Martillo pesado', mods: { atk: 1 }, desc: '+1 dado de ataque.' }],
    [{ id: 'terremoto', name: 'Terremoto', desc: 'Martillo sísmico aturde a los enemigos a 2 casillas, no solo a los de al lado.' },
      { id: 'murallaHierro', name: 'Muralla de hierro', desc: 'Muralla también protege a los aliados de al lado (+1 dado de defensa).' }]
  ],
  elfa: [
    [{ id: 'pies', name: 'Pies ligeros', mods: { mv: 2 }, desc: '+2 de movimiento.' },
      { id: 'certera', name: 'Flecha certera', desc: 'Sus flechas ignoran 1 escudo.' }],
    [{ id: 'tormenta', name: 'Tormenta de flechas', desc: 'Lluvia de flechas tira 3 dados a cada enemigo, no 2.' },
      { id: 'viento', name: 'Salto del viento', desc: 'Salto élfico se recarga en 2 rondas y la deja Inspirada.' }]
  ],
  hechicero: [
    [{ id: 'llama', name: 'Llama viva', desc: 'Bola de fuego deja ardiendo a quien hiere.' },
      { id: 'vigor', name: 'Vigor arcano', mods: { hp: 3 }, desc: '+3 de vida.' }],
    [{ id: 'meteoro', name: 'Meteoro', desc: 'Bola de fuego tira 4 dados al objetivo y 3 a los de al lado.' },
      { id: 'aurora', name: 'Mano de la aurora', desc: 'Luz sanadora cura 1 más y también 2 PV a los aliados junto al objetivo.' }]
  ],
  amazona: [
    [{ id: 'fresno', name: 'Lanza de fresno', mods: { atk: 1 }, desc: '+1 dado de ataque.' },
      { id: 'bronce', name: 'Escudo de bronce', mods: { def: 1 }, desc: '+1 dado de defensa.' }],
    [{ id: 'imparable', name: 'Carga imparable', desc: 'La Carga tira 2 dados más en lugar de 1.' },
      { id: 'cancion', name: 'Canción de guerra', desc: 'Grito de la tribu también cura 2 PV a quien inspira.' }]
  ]
};

/* Mejoras del Descenso, cuando ya no quedan talentos */
const BOONS = [
  { id: 'hp', name: '+2 de vida', icon: 'heart', mods: { hp: 2 } },
  { id: 'atk', name: '+1 dado de ataque', icon: 'sword', mods: { atk: 1 } },
  { id: 'def', name: '+1 dado de defensa', icon: 'shield', mods: { def: 1 } },
  { id: 'mv', name: '+1 de movimiento', icon: 'boot', mods: { mv: 1 } }
];

/* Equipo: cada pieza ocupa un hueco y solo la pueden llevar ciertos héroes */
const SLOTS = { mano: 'Mano', cuerpo: 'Cuerpo', extra: 'Extra' };
const ALL_HEROES = ['barbaro', 'enano', 'elfa', 'hechicero', 'amazona'];
const GEAR = [
  // reliquias: una por héroe
  { id: 'kingAxe', who: ['barbaro'], slot: 'mano', name: 'Hacha de los Reyes del Norte', icon: 'axe', cost: 120, mods: { atk: 1, magic: true }, look: 'axe', desc: '+1 dado de ataque. Arma mágica: hiere de lleno a los espectros.' },
  { id: 'forgeHammer', who: ['enano'], slot: 'mano', name: 'Martillo de la Forja Madre', icon: 'hammer', cost: 120, mods: { atk: 1, magic: true }, look: 'hammer', desc: '+1 dado de ataque. Arma mágica.' },
  { id: 'moonBow', who: ['elfa'], slot: 'mano', name: 'Arco de Lunaplata', icon: 'bow', cost: 120, mods: { atk: 1, range: 7, magic: true }, look: 'bow', desc: '+1 dado de ataque y alcance 7. Arma mágica.' },
  { id: 'dawnstaff', who: ['hechicero'], slot: 'mano', name: 'Báculo del Alba', icon: 'starfire', cost: 120, mods: { spell: 1 }, look: 'dawn', desc: '+1 dado a la Saeta arcana y a la Bola de fuego; Luz sanadora cura 1 más.' },
  { id: 'sunSpear', who: ['amazona'], slot: 'mano', name: 'Lanza del Sol de Bronce', icon: 'target', cost: 120, mods: { atk: 1, magic: true }, look: 'spear', desc: '+1 dado de ataque. Arma mágica.' },
  // equipo de la Orden
  { id: 'plate', who: ['barbaro', 'enano', 'amazona'], slot: 'cuerpo', name: 'Coraza de placas', icon: 'armor', cost: 140, mods: { def: 2, mv: -1 }, desc: '+2 dados de defensa, pero −1 de movimiento.' },
  { id: 'mail', who: ['barbaro', 'enano', 'elfa', 'amazona'], slot: 'cuerpo', name: 'Cota de malla', icon: 'armor', cost: 75, mods: { def: 1 }, desc: '+1 dado de defensa.' },
  { id: 'mantle', who: ['hechicero', 'elfa'], slot: 'cuerpo', name: 'Manto de Vigilia', icon: 'feather', cost: 100, mods: { def: 1, hp: 2 }, look: 'mantle', desc: '+1 dado de defensa y +2 de vida.' },
  { id: 'shield', who: ['enano', 'amazona'], slot: 'extra', name: 'Escudo de roble y hierro', icon: 'shield', cost: 90, mods: { def: 1, hp: 1 }, desc: '+1 dado de defensa y +1 de vida.' },
  { id: 'gauntlets', who: ['barbaro', 'enano', 'amazona'], slot: 'extra', name: 'Guanteletes de hierro', icon: 'hand', cost: 90, mods: { melee: 1 }, desc: '+1 dado en los ataques cuerpo a cuerpo.' },
  { id: 'quiver', who: ['elfa'], slot: 'extra', name: 'Carcaj de flechas élficas', icon: 'bow', cost: 90, mods: { shoot: 1 }, desc: '+1 dado al disparar.' },
  { id: 'grimoire', who: ['hechicero'], slot: 'extra', name: 'Grimorio de cenizas', icon: 'book', cost: 100, mods: { spell: 1 }, desc: '+1 dado en los hechizos; Luz sanadora cura 1 más.' },
  { id: 'boots', who: ALL_HEROES, slot: 'extra', name: 'Botas de zancada', icon: 'boot', cost: 70, mods: { mv: 1 }, desc: '+1 de movimiento.' },
  { id: 'amulet', who: ALL_HEROES, slot: 'extra', name: 'Amuleto de la Llama', icon: 'flame', cost: 80, mods: { hp: 3 }, desc: '+3 de vida.' },
  { id: 'signet', who: ALL_HEROES, slot: 'extra', name: 'Sello de la Orden', icon: 'ring', cost: 60, mods: { haggle: 1 }, desc: 'La tienda os rebaja un 10 % todo.' },
  // hallazgos (no se venden)
  { id: 'tomasDagger', who: ALL_HEROES, slot: 'extra', name: 'Daga de Tomás', icon: 'dagger', cost: 0, found: true, mods: { melee: 1 }, desc: '+1 dado en los ataques cuerpo a cuerpo. Era de un novicio del Archivo que bajó y no volvió.' }
];

/* Velada en el campamento: una actividad por noche, sin tiradas.
   Algunas necesitan a un héroe concreto en el grupo */
const VIGILS = [
  { prompt: 'La noche en el rellano es larga. Solo hay fuerzas para una cosa antes de dormir.', options: [
    { reward: 'vigor', label: 'Descansar de verdad', desc: 'Todos empiezan el próximo capítulo con +2 de vida máxima.' },
    { reward: 'traps', req: ['elfa', 'enano'], label: 'Explorar el siguiente tramo', desc: 'Las trampas del próximo capítulo empiezan señaladas. Necesita a la Elfa o al Enano.' },
    { reward: 'sharp', req: ['barbaro', 'amazona', 'enano'], label: 'Afilar las armas', desc: 'Todos empiezan el próximo capítulo Inspirados (+1 dado en su primer ataque). Necesita a alguien que sepa de armas.' }
  ] },
  { prompt: 'Nadie quiere hablar del ojo del farol. Aun así, queda una última noche.', options: [
    { reward: 'vigor', label: 'Descansar de verdad', desc: 'Todos empiezan el último capítulo con +2 de vida máxima.' },
    { reward: 'traps', req: ['elfa', 'enano'], label: 'Adelantarse hasta la fortaleza de cristal', desc: 'Las trampas del último capítulo empiezan señaladas. Necesita a la Elfa o al Enano.' },
    { reward: 'trueName', req: ['hechicero'], label: 'Descifrar el cuaderno cifrado de Osric', desc: 'Descubre el nombre verdadero de lo que vive en el farol: el enemigo final será más débil. Necesita al Hechicero.' }
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
  pct(p) { return Math.round(p * 100) + '%'; }
};
