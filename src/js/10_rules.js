/* ==========================================================================
   Sistema de virtudes: un único lenguaje para héroes, criaturas y PNJ
   Todo se resuelve con los mismos dados de calavera:
   · Ataque/defensa: calaveras contra escudos.
   · Prueba de virtud: tantos dados como la virtud; éxito si salen
     al menos tantas calaveras como la dificultad (1 fácil · 2 media · 3 difícil).
   ========================================================================== */
const VKEYS = ['FUE', 'AGI', 'ING', 'VOL', 'PRE'];
const VIRTUES = {
  FUE: { name: 'Fuerza', icon: 'sword', color: '#e0805a',
    desc: 'Vida, golpes con armas pesadas, romper cerraduras y resistir el veneno y los golpes que aturden.',
    perk: { name: 'Brazo firme', desc: 'Inmune a Aturdido. Rompe cerraduras sin tirada (con estruendo).' } },
  AGI: { name: 'Agilidad', icon: 'boot', color: '#7fd0a0',
    desc: 'Movimiento, defensa, armas sutiles, ganzúas y desarmar trampas.',
    perk: { name: 'Desenganche', desc: 'Se aleja de los enemigos sin provocar ataques de oportunidad.' } },
  ING: { name: 'Ingenio', icon: 'eye', color: '#9fb8ff',
    desc: 'Magia y éter, registrar a fondo, descifrar sellos y entender lo que otros no ven.',
    perk: { name: 'Saber arcano', desc: 'Descifra sellos rúnicos sin tirada y al registrar siempre encuentra algo.' } },
  VOL: { name: 'Voluntad', icon: 'flame', color: '#e9b864',
    desc: 'Puntos de Determinación para repetir dados y resistencia al miedo.',
    perk: { name: 'Temple', desc: 'Inmune a Aterrado.' } },
  PRE: { name: 'Presencia', icon: 'crown', color: '#d9a0e8',
    desc: 'Arengas, persuadir e intimidar, regatear y sostener la moral del grupo.',
    perk: { name: 'Aura de mando', desc: 'Él y los aliados adyacentes son inmunes a Aterrado. Su arenga tira un dado más.' } }
};
const PERK_AT = 4;
const VMAX = 6;
/* Bonificación de dados que aporta una virtud a un arma o defensa */
const VBONUS = (v) => (v >= 6 ? 3 : v >= 5 ? 2 : v >= 3 ? 1 : 0);

/* Estados alterados (duración en turnos propios) */
const STATUS = {
  aterrado: { name: 'Aterrado', icon: 'eye', bad: true, desc: '−2 de movimiento y −1 dado de ataque.' },
  envenenado: { name: 'Envenenado', icon: 'potion', bad: true, desc: 'Pierde 1 PV al empezar su turno.' },
  ardiendo: { name: 'Ardiendo', icon: 'flame', bad: true, desc: 'Pierde 1 PV al empezar su turno.' },
  aturdido: { name: 'Aturdido', icon: 'skull', bad: true, desc: 'Pierde su próxima acción.' },
  huyendo: { name: 'Huyendo', icon: 'boot', bad: true, desc: 'Se aleja de los héroes y no ataca.' },
  inspirado: { name: 'Inspirado', icon: 'crown', desc: '+1 dado en su próximo ataque o prueba.' },
  guard: { name: 'En guardia', icon: 'shield', desc: '+1 dado de defensa hasta su próximo turno.' },
  wall: { name: 'Muro de escudos', icon: 'shield', desc: '+2 dados de defensa hasta su próximo turno.' },
  taunt: { name: 'Provocando', icon: 'target', desc: 'Los enemigos cercanos le prefieren como objetivo.' },
  desangrando: { name: 'Desangrándose', icon: 'heart', bad: true, desc: 'Si nadie le levanta a tiempo, morirá.' }
};

/* Rasgos de criaturas (para la ficha y la IA) */
const ETRAITS = {
  sinMiedo: { name: 'Sin miedo', desc: 'Nunca huye ni queda aterrado.' },
  cobarde: { name: 'Cobarde', desc: 'Huye con facilidad.' },
  desenganche: { name: 'Escurridizo', desc: 'Se aleja sin provocar ataques de oportunidad.' },
  veneno: { name: 'Mordisco infecto', desc: 'Al herir, envenena (resiste Fuerza 1).' },
  aterrador: { name: 'Aterrador', desc: 'Al herir, siembra el pánico (resiste Voluntad).' },
  aturdidor: { name: 'Golpe demoledor', desc: 'Si hace 2 o más de daño, aturde (resiste Fuerza 2).' },
  incendiario: { name: 'Fuego', desc: 'Al herir, prende fuego al objetivo.' },
  furia: { name: 'Furia', desc: '+1 dado de ataque cuando está herido.' },
  lider: { name: 'Líder', desc: 'Sus aliados cercanos aguantan mejor la moral. Si cae, cunde el pánico.' },
  sanador: { name: 'Sanador', desc: 'Cura a sus aliados heridos.' },
  vuela: { name: 'Etéreo', desc: 'Flota sobre fosos y lava.' },
  noMuerto: { name: 'No muerto', desc: 'Vulnerable a la luz radiante (+1 dado).' },
  incorporeo: { name: 'Incorpóreo', desc: 'Las armas no mágicas le hacen un dado menos.' },
  cristal: { name: 'Cristal', desc: 'Las armas perforantes y la magia arcana le hacen un dado menos.' },
  fuegoVivo: { name: 'Fuego vivo', desc: 'El fuego le hace un dado menos y no arde.' },
  campeon: { name: 'Campeón', desc: 'Élite de la Sombra: +1 PV, +1 dado de ataque y más astucia.' }
};

const ROLES = {
  bruto: 'Bruto · carga contra el más cercano',
  tirador: 'Tirador · ataca a distancia',
  hostigador: 'Hostigador · busca flancos y presas débiles',
  lanzador: 'Lanzador · se queda atrás y apoya',
  espectro: 'Espectro · atraviesa la lucha y aterra',
  coloso: 'Coloso · lento y demoledor',
  copia: 'Copia · imita a quien refleja',
  jefe: 'Guardián'
};

/* Tipos de daño: qué resisten o temen las criaturas */
const DTYPES = { phys: 'contundente', pierce: 'perforante', radiant: 'radiante', fire: 'fuego', arcane: 'arcano' };

/* Perfiles de dificultad: cambian cómo piensa la Sombra, no solo sus números */
const DIFFICULTY = {
  relato: { id: 'relato', name: 'Relato', iq: -1, enemyHp: 0, bossHp: -2, enemyAtk: -1, bossAtk: 0, heroHp: 2, det: 1, doom: 9, checkMod: -1, potions: 3, champions: 0, fall: 'auto', wounds: false, summons: 4,
    blurb: 'Para disfrutar de la historia. Los héroes tienen más vida y Determinación, la Sombra es torpe y quien cae se levanta solo.' },
  heroe: { id: 'heroe', name: 'Héroe', iq: 0, enemyHp: 0, bossHp: 0, enemyAtk: 0, bossAtk: 0, heroHp: 0, det: 0, doom: 6, checkMod: 0, potions: 2, champions: 0, fall: 'ally', wounds: true, summons: 6,
    blurb: 'La experiencia pensada. Cada criatura juega según su ingenio, caer deja herida y la Hondura se agita si os entretenéis.' },
  pesadilla: { id: 'pesadilla', name: 'Pesadilla', iq: 1, enemyHp: 1, bossHp: 3, enemyAtk: 0, bossAtk: 0, heroHp: 0, det: 0, doom: 5, checkMod: 0, potions: 2, champions: 5, fall: 'bleed', bleed: 3, wounds: true, summons: 8,
    blurb: 'La Sombra piensa más rápido, hay campeones y quien cae se desangra: si nadie le levanta en 3 rondas, el capítulo se pierde.' }
};

/* Talentos que se eligen al acampar (uno por héroe y campamento) */
const TALENTS = {
  aldric: [
    [{ id: 'brazo', name: 'Brazo de hierro', virt: { FUE: 1 }, desc: '+1 Fuerza: más vida, golpes más duros.' },
      { id: 'mando', name: 'Voz de mando', virt: { PRE: 1 }, desc: '+1 Presencia. Su arenga obliga a los enemigos a 2 casillas a superar una prueba de moral.' }],
    [{ id: 'centinela', name: 'Centinela', desc: 'Nadie se aleja de él sin pagarlo: sus ataques de oportunidad alcanzan también a las criaturas escurridizas.' },
      { id: 'martir', name: 'Mártir', desc: 'Una vez por capítulo recibe en su lugar el golpe que iba a derribar a un aliado adyacente.' }]
  ],
  sera: [
    [{ id: 'piesSombra', name: 'Pies de sombra', desc: 'Paso Sombrío se recarga en 2 rondas y ya no consume el movimiento que le queda.' },
      { id: 'ojo', name: 'Ojo avizor', virt: { ING: 1 }, desc: '+1 Ingenio: registra mejor y detecta trampas a 3 casillas.' }],
    [{ id: 'ejecucion', name: 'Ejecución', desc: '+2 dados de ataque contra enemigos ya heridos.' },
      { id: 'venenoSombra', name: 'Veneno de sombra', desc: 'Sus puñaladas y sus dagas envenenan al herir.' }]
  ],
  elian: [
    [{ id: 'corazon', name: 'Corazón firme', virt: { VOL: 1 }, desc: '+1 Voluntad: un punto más de Determinación.' },
      { id: 'cadena', name: 'Cadena estelar', desc: 'Fuego Astral salpica con 3 dados en lugar de 2.' }],
    [{ id: 'manoAlba', name: 'Mano del alba', desc: 'Luz de la Aurora cuesta 1 de Éter menos y también cura 2 PV al aliado más herido junto al objetivo.' },
      { id: 'fuente', name: 'Fuente de éter', desc: '+2 de Éter máximo y la Saeta Arcana alcanza 5 casillas.' }]
  ]
};

/* Velada en el campamento: una actividad por noche, resuelta con una prueba */
const VIGILS = [
  { prompt: 'La noche en el rellano es larga. Solo hay fuerzas para una cosa antes de dormir.', options: [
    { hero: 'aldric', attr: 'PRE', dif: 2, reward: 'detAll', label: 'Aldric reza en voz alta por el grupo', desc: 'Si lo logra: +1 Determinación máxima para todos durante el próximo capítulo.',
      ok: 'Su voz llena el rellano. Nadie lo dice, pero esa noche todos duermen mejor.', ko: 'Las palabras no le salen. Sera finge estar dormida.' },
    { hero: 'sera', attr: 'AGI', dif: 2, reward: 'traps', penalty: 'seraCut', label: 'Sera baja sola a explorar el siguiente tramo', desc: 'Si lo logra: las trampas del próximo capítulo empiezan señaladas. Si falla, vuelve herida.',
      ok: 'Vuelve al alba con un mapa garabateado y una sonrisa torcida.', ko: 'Vuelve con las manos vacías y un corte en la mejilla.' },
    { hero: 'elian', attr: 'ING', dif: 2, reward: 'eter', label: 'Elian estudia el farol en silencio', desc: 'Si lo logra: +1 de Éter máximo para el resto de la aventura.',
      ok: 'Descubre que el farol bebe de su éter, gota a gota, y aprende a cerrarle el paso.', ko: 'El farol le devuelve la mirada. Elian lo cubre con un paño y no duerme.' }
  ] },
  { prompt: 'Nadie quiere hablar del ojo del farol. Aun así, queda una última noche.', options: [
    { hero: 'aldric', attr: 'PRE', dif: 2, reward: 'detAll', label: 'Aldric vela sus armas y les hace jurar', desc: 'Si lo logra: +1 Determinación máxima para todos durante el último capítulo.',
      ok: 'Tres manos sobre una espada. Nadie suelta la suya primero.', ko: 'Elian no se atreve a poner la mano. El juramento queda a medias.' },
    { hero: 'sera', attr: 'AGI', dif: 2, reward: 'traps', penalty: 'seraCut', label: 'Sera se adelanta hasta la fortaleza de cristal', desc: 'Si lo logra: las trampas del último capítulo empiezan señaladas. Si falla, vuelve herida.',
      ok: 'Encuentra las losas que cantan antes de romperse. Las marca con tiza.', ko: 'Un cristal le corta la mano al apoyarse. Vuelve en silencio.' },
    { hero: 'elian', attr: 'ING', dif: 3, reward: 'trueName', label: 'Elian descifra el cuaderno cifrado de Osric', desc: 'Prueba difícil. Si lo logra: descubre el nombre verdadero de lo que vive en el farol (debilita al enemigo final).',
      ok: 'Al amanecer tiene un nombre escrito en el margen. Lo tacha tres veces, pero ya lo sabe.', ko: 'El cifrado se le resiste. Solo saca dolor de cabeza.' }
  ] }
];

/* Utilidades de reglas */
const RULES = {
  diff() { return DIFFICULTY[(window.GAME_DIFF || 'heroe')] || DIFFICULTY.heroe; },
  perk(u, k) { return !!(u && u.virt && u.virt[k] >= PERK_AT); },
  pCheck(n, dif) {
    // probabilidad de sacar al menos «dif» calaveras con «n» dados
    if (dif <= 0) return 1;
    const b = U.binom(Math.max(0, n), 0.5); let p = 0;
    for (let k = dif; k < b.length; k++) p += b[k];
    return p;
  },
  pct(p) { return Math.round(p * 100) + '%'; },
  difName(d) { return d <= 1 ? 'fácil' : d === 2 ? 'media' : 'difícil'; }
};
