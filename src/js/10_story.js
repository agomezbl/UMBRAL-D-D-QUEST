/* ==========================================================================
   Historia, personajes, mapas y reglas de datos
   ========================================================================== */
const SPEAKERS = {
  narrador: { name: '', color: '#e9dcc0' },
  aldric: { name: 'Aldric', title: 'Paladín de Vaelmont', color: '#8fb0ff' },
  sera: { name: 'Sera', title: 'Exploradora', color: '#86e0b0' },
  elian: { name: 'Elian', title: 'Tejedor del Éter', color: '#c2adff' },
  isolde: { name: 'Madre Isolde', title: 'Vidente del Archivo', color: '#f0e4c8' },
  voz: { name: '…', title: 'Un susurro', color: '#c08bff' },
  malakor: { name: 'Malakor', title: 'El Nigromante', color: '#7dffb0' },
  ignis: { name: 'Ignis', title: 'Señor del Magma', color: '#ff9a5a' },
  aethelgard: { name: 'Aethelgard', title: 'Guardián del Ojo', color: '#a8e0ff' },
  thrain: { name: 'Thráin', title: 'Último forjamaestro', color: '#a8e8ff' },
  tomas: { name: 'Tomás', title: 'Hermano de Sera', color: '#cfe8ff' }
};

const HERO_DEFS = {
  aldric: { name: 'Aldric', full: 'Aldric de Vaelmont', role: 'Paladín', model: 'aldric', color: '#4d7cff', start: '1',
    virt: { FUE: 4, AGI: 2, ING: 2, VOL: 3, PRE: 4 }, vigor: 3,
    weapon: { name: 'Espada larga', attr: 'FUE', base: 2, range: 1, dtype: 'phys' },
    armor: { name: 'Cota de malla y escudo', base: 4 },
    blurb: 'Fuerte y carismático. Sujeta la primera línea, castiga a quien se aleja de él y sostiene la moral del grupo.',
    trait: { name: 'Baluarte', desc: 'Sus ataques de oportunidad tiran todos sus dados (los demás tiran uno menos).' },
    basic: { name: 'Espadazo', icon: 'sword' },
    skills: [
      { id: 'wall', name: 'Muro de Escudos', icon: 'shield', cd: 3, target: 'self' },
      { id: 'smite', name: 'Juicio Radiante', icon: 'radiant', cd: 3, target: 'enemy', range: 1, dtype: 'radiant' }
    ] },
  sera: { name: 'Sera', full: 'Sera Vance', role: 'Exploradora', model: 'sera', color: '#3fbf86', start: '2',
    virt: { FUE: 2, AGI: 5, ING: 3, VOL: 3, PRE: 2 }, vigor: 2,
    weapon: { name: 'Dagas gemelas', attr: 'AGI', base: 1, range: 1, dtype: 'pierce' },
    armor: { name: 'Cuero endurecido', base: 1 },
    blurb: 'La más ágil. Se mueve lejos, se escurre entre enemigos, golpea por la espalda y es la mejor con trampas y cerraduras. Frágil si la rodean.',
    trait: { name: 'Golpe furtivo', desc: 'El flanqueo le da +2 dados en lugar de +1. Detecta trampas a 2 casillas sin buscarlas.' },
    basic: { name: 'Puñaladas', icon: 'dagger' },
    skills: [
      { id: 'throw', name: 'Daga Sombría', icon: 'dagger', cd: 2, target: 'enemy', range: 4, los: true, dtype: 'pierce' },
      { id: 'step', name: 'Paso Sombrío', icon: 'shadowstep', cd: 3, target: 'tile', range: 4, free: true }
    ] },
  elian: { name: 'Elian', full: 'Elian del Archivo', role: 'Tejedor del Éter', model: 'elian', color: '#9a6bff', start: '3',
    virt: { FUE: 1, AGI: 2, ING: 5, VOL: 4, PRE: 3 }, vigor: 2,
    weapon: { name: 'Saeta Arcana', attr: 'ING', base: 0, range: 4, ranged: true, dtype: 'arcane' },
    melee: { name: 'Báculo', attr: 'FUE', base: 1 },
    armor: { name: 'Túnica tejida', base: 2 },
    blurb: 'El más listo y voluntarioso. Ataca a distancia, cura y quema grupos con su Éter. No aguanta un cuerpo a cuerpo.',
    trait: { name: 'Tejedor del Éter', desc: 'Sus habilidades gastan Éter (máximo igual a su Ingenio, +1 cada ronda) en lugar de esperar. Escudo de éter: si le atacan, gasta 1 de Éter y tira un dado de defensa más.' },
    basic: { name: 'Saeta Arcana', icon: 'bolt' },
    skills: [
      { id: 'starfire', name: 'Fuego Astral', icon: 'starfire', eter: 3, target: 'enemy', range: 5, los: true, dtype: 'fire' },
      { id: 'dawn', name: 'Luz de la Aurora', icon: 'dawn', eter: 2, target: 'ally', range: 4 }
    ] }
};

const ENEMY_TYPES = {
  skeleton: { name: 'Esqueleto', model: 'skeleton', role: 'bruto', virt: { FUE: 3, AGI: 2, ING: 1, VOL: 5, PRE: 1 }, hp: 2, atk: 3, def: 2, mv: 4, gold: 5, undead: true, weak: ['radiant'], immune: ['aterrado', 'envenenado'], traits: ['noMuerto', 'sinMiedo'], sfx: 'bone', deathCol: ['#f0e6cc', '#6a6050'] },
  archer: { name: 'Arquero esquelético', model: 'archer', role: 'tirador', virt: { FUE: 2, AGI: 3, ING: 2, VOL: 5, PRE: 1 }, hp: 2, atk: 2, def: 1, mv: 3, range: 5, ranged: true, proj: 'arrow', gold: 6, undead: true, weak: ['radiant'], immune: ['aterrado', 'envenenado'], traits: ['noMuerto', 'sinMiedo'], sfx: 'bone', deathCol: ['#f0e6cc', '#6a6050'] },
  ghoul: { name: 'Necrófago', model: 'ghoul', role: 'hostigador', virt: { FUE: 3, AGI: 4, ING: 1, VOL: 3, PRE: 1 }, hp: 3, atk: 3, def: 1, mv: 5, gold: 8, undead: true, weak: ['radiant'], immune: ['aterrado', 'envenenado'], onHit: { st: 'envenenado', dur: 2, resist: 'FUE', dif: 1 }, traits: ['noMuerto', 'veneno', 'desenganche'], deathCol: ['#b9c9a0', '#3a4a30'] },
  acolyte: { name: 'Acólito de la Voz', model: 'acolyte', role: 'lanzador', virt: { FUE: 1, AGI: 2, ING: 4, VOL: 2, PRE: 4 }, hp: 2, atk: 2, def: 2, mv: 4, range: 4, ranged: true, proj: 'necro', gold: 8, onHit: { st: 'aterrado', dur: 1, resist: 'VOL', dif: 1 }, traits: ['lider', 'aterrador'], deathCol: ['#ff8a7a', '#4a0a0a'], barks: ['Ella lo ve todo.', 'La luz miente…', 'Arrodillaos ante el farol.'] },
  orc: { name: 'Orco de la Mano Negra', model: 'orc', role: 'bruto', virt: { FUE: 4, AGI: 2, ING: 2, VOL: 3, PRE: 2 }, hp: 3, atk: 3, def: 2, mv: 5, gold: 8, traits: [], deathCol: ['#9ab060', '#2a3a10'], barks: ['¡Carne fresca!', '¡Aplastar!', '¡Por Ignis!'] },
  goblin: { name: 'Trasgo', model: 'goblin', role: 'hostigador', virt: { FUE: 1, AGI: 5, ING: 2, VOL: 1, PRE: 1 }, hp: 1, atk: 2, def: 1, mv: 7, gold: 4, traits: ['desenganche', 'cobarde'], deathCol: ['#c0c060', '#3a3a10'], barks: ['¡Hiii!', '¡Brillante, brillante!'] },
  shaman: { name: 'Chamán de ceniza', model: 'shaman', role: 'lanzador', virt: { FUE: 2, AGI: 2, ING: 4, VOL: 3, PRE: 4 }, hp: 3, atk: 3, def: 2, mv: 4, range: 4, ranged: true, proj: 'fire', gold: 10, healer: true, onHit: { st: 'ardiendo', dur: 2 }, traits: ['lider', 'sanador', 'incendiario'], deathCol: ['#ffb06a', '#3a1a0a'], barks: ['¡El fuego me escucha!'] },
  berserker: { name: 'Berserker', model: 'berserker', role: 'bruto', virt: { FUE: 5, AGI: 3, ING: 1, VOL: 5, PRE: 2 }, hp: 4, atk: 4, def: 1, mv: 5, gold: 10, fury: true, immune: ['aterrado'], traits: ['furia', 'sinMiedo'], deathCol: ['#c06060', '#3a0a0a'], barks: ['¡SANGRE!', '¡Más, más!'] },
  voidAcolyte: { name: 'Acólito del Vacío', model: 'voidAcolyte', role: 'lanzador', virt: { FUE: 1, AGI: 2, ING: 4, VOL: 3, PRE: 3 }, hp: 3, atk: 3, def: 2, mv: 4, range: 4, ranged: true, proj: 'void', gold: 9, onHit: { st: 'aterrado', dur: 1, resist: 'VOL', dif: 1 }, traits: ['aterrador'], deathCol: ['#d8b8ff', '#2a0a4a'], barks: ['El Ojo se abre.', 'Vuestra luz es nuestra.'] },
  wraith: { name: 'Espectro', model: 'wraith', role: 'espectro', virt: { FUE: 2, AGI: 4, ING: 3, VOL: 5, PRE: 2 }, hp: 3, atk: 3, def: 3, mv: 6, gold: 10, undead: true, flies: true, weak: ['radiant'], resistMundane: true, immune: ['aterrado', 'envenenado'], onHit: { st: 'aterrado', dur: 1, resist: 'VOL', dif: 2 }, traits: ['noMuerto', 'incorporeo', 'aterrador', 'vuela', 'desenganche'], deathCol: ['#e8ffff', '#3fb4c9'] },
  golem: { name: 'Gólem de cristal', model: 'golem', role: 'coloso', virt: { FUE: 5, AGI: 1, ING: 1, VOL: 5, PRE: 1 }, hp: 6, atk: 4, def: 4, mv: 3, gold: 18, resist: ['pierce', 'arcane'], immune: ['aterrado', 'envenenado', 'ardiendo'], onHit: { st: 'aturdido', dur: 1, resist: 'FUE', dif: 2, minDmg: 2 }, traits: ['cristal', 'aturdidor', 'sinMiedo'], deathCol: ['#e0ccff', '#5a2aaa'], sfx: 'glass' },
  reflection: { name: 'Reflejo', model: 'reflection', role: 'copia', virt: { FUE: 3, AGI: 3, ING: 3, VOL: 5, PRE: 1 }, hp: 3, atk: 3, def: 2, mv: 5, gold: 5, weak: ['radiant'], immune: ['aterrado', 'envenenado'], traits: ['sinMiedo'], deathCol: ['#d8d0ff', '#1a1430'], sfx: 'glass' },
  risen: { name: 'Huesos alzados', model: 'skeleton', role: 'bruto', virt: { FUE: 2, AGI: 2, ING: 1, VOL: 5, PRE: 1 }, hp: 1, atk: 2, def: 1, mv: 4, gold: 0, undead: true, weak: ['radiant'], immune: ['aterrado', 'envenenado'], traits: ['noMuerto', 'sinMiedo'], sfx: 'bone', deathCol: ['#f0e6cc', '#6a6050'] },
  // prácticas (tutorial)
  dummy: { name: 'Esqueleto de prácticas', model: 'skeleton', role: 'bruto', virt: { FUE: 2, AGI: 2, ING: 1, VOL: 5, PRE: 1 }, hp: 3, atk: 2, def: 1, mv: 3, gold: 2, undead: true, weak: ['radiant'], immune: ['aterrado', 'envenenado'], traits: ['noMuerto', 'sinMiedo'], sfx: 'bone', deathCol: ['#f0e6cc', '#6a6050'] },
  dummyArcher: { name: 'Arquero de prácticas', model: 'archer', role: 'tirador', virt: { FUE: 2, AGI: 2, ING: 2, VOL: 5, PRE: 1 }, hp: 2, atk: 2, def: 1, mv: 2, range: 4, ranged: true, proj: 'arrow', gold: 2, undead: true, weak: ['radiant'], immune: ['aterrado', 'envenenado'], traits: ['noMuerto', 'sinMiedo'], sfx: 'bone', deathCol: ['#f0e6cc', '#6a6050'] },
  // jefes
  malakor: { name: 'Malakor el Nigromante', model: 'malakor', role: 'jefe', virt: { FUE: 2, AGI: 2, ING: 5, VOL: 5, PRE: 5 }, boss: true, hp: 9, atk: 3, def: 3, mv: 3, range: 5, ranged: true, proj: 'necro', gold: 60, undead: true, weak: ['radiant'], immune: ['aterrado', 'envenenado'], onHit: { st: 'aterrado', dur: 1, resist: 'VOL', dif: 2 }, traits: ['noMuerto', 'aterrador', 'lider'], deathCol: ['#b9ffd8', '#0a3a20'] },
  ignis: { name: 'Ignis, Señor del Magma', model: 'ignis', role: 'jefe', virt: { FUE: 5, AGI: 2, ING: 3, VOL: 5, PRE: 4 }, boss: true, hp: 12, atk: 5, def: 3, mv: 3, gold: 80, resist: ['fire'], immune: ['aterrado', 'ardiendo', 'aturdido'], onHit: { st: 'ardiendo', dur: 2 }, traits: ['fuegoVivo', 'incendiario', 'lider'], deathCol: ['#ffd08a', '#ff3a10'] },
  aethelgard: { name: 'Aethelgard, Guardián del Ojo', model: 'aethelgard', role: 'jefe', virt: { FUE: 4, AGI: 3, ING: 4, VOL: 5, PRE: 4 }, boss: true, hp: 11, atk: 4, def: 5, mv: 4, gold: 80, undead: true, flies: true, weak: ['radiant'], immune: ['aterrado', 'envenenado'], traits: ['noMuerto', 'vuela', 'lider'], deathCol: ['#e8f7ff', '#4ab0ff'] },
  isolde: { name: 'Isolde, la Voz bajo la Piedra', model: 'isolde', role: 'jefe', virt: { FUE: 2, AGI: 3, ING: 5, VOL: 5, PRE: 5 }, boss: true, hp: 12, atk: 4, def: 3, mv: 0, range: 6, ranged: true, proj: 'void', gold: 0, flies: true, immune: ['aterrado', 'envenenado', 'aturdido'], onHit: { st: 'aterrado', dur: 1, resist: 'VOL', dif: 2 }, traits: ['aterrador', 'lider', 'vuela'], deathCol: ['#ffffff', '#9d6bff'] }
};

const SHOP = [
  { id: 'potion', kind: 'item', name: 'Poción de curación', icon: 'potion', cost: 35, desc: 'Cura 4 PV. Beberla no gasta la acción (una por turno).' },
  { id: 'elixir', kind: 'item', name: 'Elixir de ímpetu', icon: 'elixir', cost: 45, desc: 'Concede una acción extra este turno.' },
  { id: 'bomb', kind: 'item', name: 'Bomba alquímica', icon: 'bomb', cost: 40, desc: 'Se lanza a 4 casillas: 3 dados a todo lo que haya en un área de 3×3.' },
  { id: 'kit', kind: 'kit', name: 'Ganzúas enanas', icon: 'key', cost: 60, desc: '+2 dados para desarmar trampas y forzar cerraduras con Agilidad.' },
  { id: 'blade', kind: 'up', hero: 'aldric', name: 'Hoja de Vaelmont', icon: 'sword', cost: 120, desc: 'Aldric: +1 dado de ataque. Arma mágica: hiere de lleno a los espectros.' },
  { id: 'aegis', kind: 'up', hero: 'aldric', name: 'Égida de plata', icon: 'shield', cost: 130, desc: 'Aldric: +1 dado de defensa y +2 PV máximos.' },
  { id: 'fangs', kind: 'up', hero: 'sera', name: 'Colmillos gemelos', icon: 'dagger', cost: 110, desc: 'Sera: +1 dado de ataque. Armas mágicas: hieren de lleno a los espectros.' },
  { id: 'bow', kind: 'up', hero: 'sera', name: 'Arco de tejo negro', icon: 'bow', cost: 120, desc: 'Sera puede atacar a 5 casillas con su ataque básico.' },
  { id: 'dawnstaff', kind: 'up', hero: 'elian', name: 'Báculo del Alba', icon: 'starfire', cost: 120, desc: 'Elian: +1 dado a la Saeta Arcana y Luz de la Aurora cura 1 más.' },
  { id: 'mantle', kind: 'up', hero: 'elian', name: 'Manto de Vigilia', icon: 'feather', cost: 100, desc: 'Elian: +1 dado de defensa y +2 PV máximos.' }
];

const BARKS = {
  aldric: { kill: ['Uno menos.', '¡Por Vaelmont!', 'Descansa ya.', 'Vuelve al polvo.'], hurt: ['Solo es un rasguño.', '¡Aguantad la línea!', 'Mi escudo ha visto cosas peores.'], low: ['No caeré aquí…'], skill: ['¡Detrás de mí!', '¡Luz, guía mi brazo!'] },
  sera: { kill: ['Demasiado lento.', '¿Siguiente?', 'Ni lo has visto venir.', 'Esto por Tomás.'], hurt: ['¡Eso dolió!', 'Vale. Ahora estoy enfadada.'], low: ['Necesito… un respiro.'], trap: ['Trampa. Quietos todos.', 'Alto. Aquí hay algo.'], gold: ['Esto me lo quedo.', 'Para la jubilación.'], skill: ['Sorpresa.', 'Por aquí.'] },
  elian: { kill: ['Que el éter te lleve.', 'Lo… lo siento.', '¡Funciona!'], hurt: ['¡Ah! No estoy hecho para esto.', '¡Cuidado conmigo!'], low: ['Veo… puntos negros.'], heal: ['Aguanta, ya te tengo.', 'Respira. Así.'], skill: ['¡Arde!', 'Estrellas, escuchadme.'] }
};

const HINTS = {
  move: 'Toca una casilla iluminada para mover al héroe activo. En ordenador, pasa el ratón para ver la ruta y haz clic.',
  attack: 'Toca a un enemigo para atacarlo. Si no está a tu alcance pero puedes llegar, el héroe se acercará y golpeará.',
  door: 'Toca una puerta para abrirla. Las salas ocultas solo se revelan al cruzar su umbral.',
  turn: 'Cada héroe tiene movimiento y una acción por turno. Cuando todos terminen, actuará la Sombra.',
  search: 'Registrar (lupa) revela trampas de la sala y puede encontrar tesoros… o despertar algo.',
  touch: 'En el móvil: arrastra con un dedo para mover la cámara, pellizca para acercar y gira con dos dedos.',
  zoc: 'Alejarte de un enemigo cuerpo a cuerpo provoca su ataque de oportunidad. La ruta marcada lo evita si puede; Sera, tan ágil, se escurre sin provocar.',
  flank: 'Flanqueo: si otro héroe está junto a tu objetivo, atacas con +1 dado (Sera, +2).',
  det: 'Determinación: tras una tirada puedes gastar un punto para repetir los dados fallados. Si un golpe va a derribarte, se usa sola.',
  lock: 'Puerta cerrada: elige quién la abre y cómo. Cada forma usa una virtud distinta; la de Fuerza hace ruido y alimenta el Presagio.',
  doom: 'El Presagio crece cada ronda y con el ruido. Cuando se llena, algo errante sube de la Hondura a buscaros.',
  fear: 'Aterrado: −2 de movimiento y −1 dado de ataque. La Voluntad lo resiste y la Presencia de un aliado cercano lo evita.'
};

const CHAPTERS = [
  /* ============================ CAPÍTULO I ============================ */
  {
    id: 'c1', num: 'I', title: 'Las Criptas de Malakor', subtitle: 'El Sello de Hueso', theme: 'crypt', ambient: 'crypt',
    legend: { a: 'skeleton', b: 'archer', c: 'ghoul', d: 'acolyte' }, bossType: 'malakor', lantern: '#ffb45a',
    locks: { '10,11': 'sello', '17,11': 'cerradura' },
    map: [
      '#########################',
      '#*..B..O.....O.....O....#',
      '#......~~.........~~....#',
      '#..O...~~...d.....~~..O.#',
      '#....0..................#',
      '###################+#####',
      '#..?...#,,,,,,#....c....#',
      '#.a....#,,a,,,#..~~.~~..#',
      '#...4..+,,,5,,+..~~.~~.b#',
      '#..a...#,c,,,,#..~~.~~..#',
      '#......#,,,,,,#....7..b.#',
      '###+######+######+#######',
      '#......#&...&#..^..#....#',
      '#..1...#.....#..9..+..?.#',
      '#.2.3..#&.6.&#.....#.8..#',
      '#X.....#..C..#...C.#....#',
      '#########################'
    ],
    intro: [
      ['n', 'La escalera termina en una antecámara helada. Arriba queda Aldmere, con su catedral a oscuras. Abajo, la Hondura.'],
      ['isolde', 'Oídme bien, hijos. Elian lleva mi farol. Mientras arda, podré hablaros y ver lo que veis.'],
      ['isolde', 'Tres sellos mantienen cerrada la Hondura: Hueso, Fuego y Cristal. Sus guardianes se han corrompido. Acercad el farol a cada sello y la Llama Perenne volverá a casa.'],
      ['aldric', 'Hemos jurado bajar, Madre. Subiremos con la Llama o no subiremos.'],
      ['sera', 'Habla por ti, paladín. Yo he venido por el oro… y por otra cosa.'],
      ['elian', 'El farol tiembla, Madre. ¿Es normal?'],
      ['isolde', 'Tiembla porque tiene miedo, niño. Igual que tú. Adelante.'],
      ['objective', 'Encuentra el Sello de Hueso en la cripta de Malakor.'],
      ['hint', 'move'], ['hint', 'touch']
    ],
    rooms: {
      '1': { name: 'Antecámara' },
      '4': { name: 'Galería de los Nichos', reveal: [
        ['n', 'Nichos excavados en la roca, cientos, hasta donde alcanza la luz. En cada uno, un nombre borrado a cincel.'],
        ['sera', 'Alguien ha raspado los nombres. Esto no es obra de saqueadores.'],
        ['sfx', 'bone'], ['bark', 'aldric', '¡En formación!'], ['hint', 'attack']
      ] },
      '5': { name: 'Osario', reveal: [
        ['n', 'Huesos apilados en muros, en columnas, en bóvedas. Un osario sin fondo.']
      ], enter: [
        ['lights', 'out'], ['music', 'silence'], ['wait', 700], ['sfx', 'whisper', 2.4],
        ['voz', '«…Sera…»'], ['wait', 500],
        ['sera', '¿Quién ha dicho mi nombre?'],
        ['test', 'sera', 'VOL', 2, [['sera', 'No. No vas a jugar conmigo.']], [['sera', '¿Tomás…?'], ['status', 'tested', 'aterrado', 2]]],
        ['lights', 'on'], ['scare'], ['spawn', 'ghoul', 'near'], ['shake', 0.6],
        ['bark', 'aldric', '¡Detrás de ti!'], ['music', 'combat']
      ] },
      '6': { name: 'Capilla de los Susurros', reveal: [
        ['n', 'Una capilla pequeña. Cuatro sarcófagos rodean un cofre sellado con cera negra.'],
        ['elian', 'Huele a incienso. Reciente.']
      ] },
      '7': { name: 'Pozo Necrótico', reveal: [
        ['n', 'Un pozo de miasma verde burbujea en el centro de la sala. Sobre las pasarelas, arqueros sin carne tensan cuerdas podridas.'],
        ['elian', 'No toquéis ese líquido. Ni lo miréis demasiado rato.']
      ] },
      '9': { name: 'Cámara del Tesoro', reveal: [
        ['n', 'Monedas antiguas cubiertas de polvo. Demasiado fácil.'],
        ['sera', 'Cuando algo parece demasiado fácil, mira dónde pisas.'], ['hint', 'search']
      ] },
      '8': { name: 'La Celda', reveal: [
        ['n', 'Una celda estrecha. En la pared, cientos de rayas que cuentan días. Y un nombre grabado una y otra vez: TOMÁS.'],
        ['npc', 'tomas', 'room'], ['music', 'silence'], ['sfx', 'whisper', 1.5],
        ['tomas', 'Sera… Cuánto has crecido.'],
        ['sera', '¿Tomás? Por todos los dioses… ¿qué te han hecho?'],
        ['tomas', 'Bajamos a reavivar los sellos, como vosotros. Ella nos guiaba con su luz. Nos dijo que los guardianes estaban corruptos.'],
        ['tomas', 'No lo estaban. Era mentira, Sera. Ten cuidado con la luz que…'],
        ['lights', 'flicker'], ['sfx', 'dark'],
        ['isolde', '¡Basta! Es un eco. Los muertos de la Hondura imitan voces queridas para atraeros. No le escuchéis.'],
        ['check', 'El eco de Tomás empieza a deshacerse. ¿Qué hacéis?', [
          { hero: 'elian', attr: 'ING', dif: 2, label: 'Sostener el eco con el éter', desc: 'Elian teje un hilo de éter para que la voz no se apague.',
            ok: [['tomas', '…La luz que llevas no es suya. El Archivo nunca tuvo una vidente. Recuerda su voz, Sera, y no la escuches.'], ['flag', 'tomasTruth', true], ['n', 'Sera aprieta los dientes. Ahora sabe a quién no creer. (Sera resistirá la voz de Isolde y el enemigo final será más débil)']],
            ko: [['n', 'El hilo de éter se rompe con un chasquido. El eco se deshace antes de terminar.']] },
          { hero: 'aldric', attr: 'PRE', dif: 2, label: 'Ordenarle que termine, por su juramento', desc: 'Aldric invoca el juramento que Tomás hizo al bajar.',
            ok: [['tomas', '…Por el juramento. La luz que llevas no es suya. El Archivo nunca tuvo una vidente. Recuerda su voz, Sera, y no la escuches.'], ['flag', 'tomasTruth', true], ['n', 'Sera aprieta los dientes. Ahora sabe a quién no creer. (Sera resistirá la voz de Isolde y el enemigo final será más débil)']],
            ko: [['n', 'El eco se encoge ante la voz del paladín y desaparece.']] },
          { label: 'Dejarle descansar', desc: 'Nadie debería obligar a los muertos a hablar.', steps: [['sera', 'Descansa, hermano. Volveré a por ti.']] }
        ]],
        ['npcGone', 'tomas'], ['wait', 600],
        ['sera', 'Era él. Sé que era él.'],
        ['elian', 'Madre Isolde nunca nos mentiría… ¿verdad?'],
        ['music', 'explore']
      ] },
      '0': { name: 'Cripta de Malakor' }
    },
    notes: [
      [['sfx', 'page'], ['note', 'Diario de Fray Osric · Folio I', 'Día tres. Los nombres de los muertos han sido raspados. Sin nombre, un muerto no descansa: obedece. Quien lo hizo conocía los ritos del Archivo.'],
        ['elian', 'Los ritos del Archivo… Solo las hermanas los conocen.'],
        ['sera', 'Pues alguna de tus hermanas tiene malas costumbres.']],
      [['sfx', 'page'], ['note', 'Diario de Fray Osric · Folio II', 'Día nueve. Encontramos el Sello de Hueso intacto. La hermana Isolde dijo que estaba corrupto. A mí me pareció sano. Brillaba como una vela en una casa en paz.'],
        ['aldric', 'Osric. Era capellán de mi orden. Desapareció hace cinco inviernos.']]
    ],
    chests: {
      0: [['give', 'tomasDagger'], ['music', 'silence'],
        ['sera', 'No… Esta daga es de Tomás. Mi hermano. Bajó hace cinco años con una partida del Archivo y nunca volvió.'],
        ['aldric', 'Lo siento, Sera.'],
        ['sera', 'No lo sientas. Si su daga está aquí, él también. Y voy a encontrarle.'],
        ['n', 'Sera guarda la daga de su hermano. Su pulso es ahora más firme. (+1 dado de ataque)'],
        ['wait', 400], ['sfx', 'doorSlam'], ['shake', 0.5],
        ['n', 'Las tapas de piedra de los sarcófagos se deslizan a la vez.'],
        ['spawn', 'skeleton', 'room', 2], ['music', 'combat']]
    },
    boss: {
      reveal: [
        ['music', 'boss'], ['stinger', 'boss'], ['camBoss'],
        ['n', 'Al fondo de la cripta, ante un altar de hueso, una figura alta alza los brazos. Todos los muertos de la sala giran la cabeza a la vez.'],
        ['malakor', 'Más corderos con faroles. ¿Cuántos rebaños me enviará todavía?'],
        ['aldric', 'Malakor. Por los crímenes contra los muertos de Aldmere, hoy rindes cuentas.'],
        ['malakor', '¿Crímenes? Yo solo les doy trabajo. Fue otra quien les arrancó el nombre.'],
        ['malakor', '¡Levantaos!'], ['sfx', 'summon'], ['bossbar'],
        ['objective', 'Derrota a Malakor el Nigromante.']
      ],
      defeat: [
        ['malakor', 'Necios… el sello… no es lo que os han contado…'],
        ['wait', 500], ['music', 'silence'], ['camAltar'],
        ['isolde', 'Rápido, Elian. Acerca el farol al sello.'],
        ['seal'],
        ['n', 'La luz del sello se curva hacia el farol como agua hacia un desagüe. Durante un instante, la cripta entera queda a oscuras.'],
        ['elian', 'Madre… el sello no se ha encendido. Se ha apagado.'],
        ['isolde', 'Ha cedido su fuerza a la Llama. Así debe ser. Uno de tres, hijos míos. Descansad.']
      ]
    }
  },

  /* ============================ CAPÍTULO II ============================ */
  {
    id: 'c2', num: 'II', title: 'La Forja de Karak-Azkul', subtitle: 'El Sello de Fuego', theme: 'forge', ambient: 'forge',
    legend: { a: 'orc', b: 'goblin', c: 'shaman', d: 'berserker' }, bossType: 'ignis', lantern: '#ffd07a',
    locks: { '19,15': 'cerradura', '18,9': 'sello' },
    map: [
      '#########################',
      '#.......#.~~....#.......#',
      '#.b...b.#.~~.d..#.~~.~~.#',
      '#...5...+.....6.+...B..*#',
      '#..&.&..#.~~..?.#.~~.~~.#',
      '#,......#.~~.a..#...0...#',
      '####+#######+############',
      '#.....,.#.........#.....#',
      '#..a....#..O.c.O..#..?..#',
      '#...4...+....7....+..8..#',
      '#....a..#..O...O..#..C..#',
      '#.,.....#.........#.....#',
      '###+######+##############',
      '#......#...~~..~~..#....#',
      '#.1.2..+...~~.a~~..#.9..#',
      '#X.3...#.....R,....+..^C#',
      '#########################'
    ],
    intro: [
      ['n', 'Más abajo, el aire arde. Karak-Azkul fue una forja enana cuando el mundo era joven. Hoy los martillos los empuñan otras manos.'],
      ['isolde', 'El Sello de Fuego descansa sobre el Yunque Rúnico. Lo custodia Ignis, un caudillo orco que bebe del magma.'],
      ['aldric', '¿Orcos? ¿Tan abajo?'],
      ['isolde', 'Alguien les abrió el camino. Id.'],
      ['sera', '«Alguien». Últimamente ese alguien abre muchas puertas.'],
      ['objective', 'Alcanza el Yunque Rúnico y derrota a Ignis.']
    ],
    rooms: {
      '1': { name: 'La Gran Puerta' },
      '4': { name: 'Barracones', reveal: [
        ['n', 'Jergones, huesos roídos y el olor de muchos cuerpos. Los orcos no esperaban visita.'],
        ['bark', 'enemy', '¡Carne fresca!']
      ] },
      '5': { name: 'Fundición', reveal: [
        ['n', 'Moldes de piedra del tamaño de un hombre. De uno de ellos todavía gotea metal.'],
        ['sera', 'Trasgos. Odio a los trasgos. Muerden los tobillos.']
      ] },
      '6': { name: 'Puente de Ceniza', reveal: [
        ['n', 'Un río de roca fundida corta la sala en dos. Solo un puente estrecho cruza al otro lado.'],
        ['elian', 'Si alguien cae ahí, no quedará nada que enterrar.']
      ] },
      '7': { name: 'Salón de los Martillos', reveal: [
        ['n', 'Columnas talladas con rostros de enanos. Todos tienen los ojos cerrados… salvo uno.']
      ], enter: [
        ['sfx', 'scare'], ['shake', 0.8],
        ['n', 'Algo cae desde lo alto de una columna.'],
        ['test', 'hero', 'AGI', 2, [['n', 'Te apartas de un salto. El hacha muerde la piedra donde estabas.']], [['n', 'El golpe te alcanza de lleno al caer.'], ['hurt', 'tested', 2]]],
        ['spawn', 'berserker', 'near'], ['bark', 'enemy', '¡SANGRE!'], ['music', 'combat']
      ] },
      '8': { name: 'Tumba de Thráin', reveal: [
        ['n', 'Una tumba enana, intacta. Ni siquiera los orcos se han atrevido a entrar.'],
        ['npc', 'thrain', 'room'], ['music', 'silence'],
        ['thrain', 'Humanos. Y con un farol del Archivo. Hacía siglos que no veía uno. La última vez fue el día que murió mi pueblo.'],
        ['aldric', '¿Quién eres?'],
        ['thrain', 'Thráin, último forjamaestro de Karak-Azkul. Guardián del Sello de Fuego, hasta que me lo arrebataron.'],
        ['thrain', 'Escuchadme bien. Los sellos no están corruptos. Nunca lo estuvieron. Son cerraduras, y los guardianes, sus llaves vivas.'],
        ['thrain', 'Hace siglos vino una mujer con un farol como ese. Prometió reavivar mi sello. Cuando lo acercó, mi pueblo ardió desde dentro.'],
        ['elian', 'Eso no puede ser. Isolde no puede tener siglos.'],
        ['thrain', 'La que lleva la luz no envejece, muchacho. Solo cambia de nombre.'],
        ['lights', 'flicker'], ['sfx', 'dark'],
        ['isolde', 'Elian. Los espíritus enanos son rencorosos y tercos. Ignis espera. Termina lo que empezaste.'],
        ['thrain', 'Si debéis destruir al orco, hacedlo. Pero no le deis el fuego a la luz.'],
        ['check', 'Thráin espera una respuesta.', [
          { hero: 'aldric', attr: 'PRE', dif: 2, label: 'Jurarle que el fuego no irá a la luz', desc: 'La palabra de un paladín, ante un rey muerto.',
            ok: [['thrain', 'Un juramento de Vaelmont. Hacía siglos que no oía uno. Escucha: el corazón de Ignis se enfría donde la runa del yunque está rota.'], ['flag', 'ignisWeak', true], ['give', 'blessing'], ['n', 'Donde estaba el espíritu queda un calor suave. (+2 PV a todos · Ignis tirará un dado de defensa menos)']],
            ko: [['thrain', 'Palabras. Todos los que bajan traen palabras.'], ['give', 'blessing'], ['n', 'Aun así, el calor del espíritu cierra vuestras heridas. (+2 PV a todos)']] },
          { hero: 'elian', attr: 'ING', dif: 2, label: 'Leer las runas de su tumba', desc: 'Las runas enanas cuentan cómo cayó la forja.',
            ok: [['elian', 'Aquí dice dónde se quebró el yunque… y por dónde respira el corazón de Ignis.'], ['flag', 'ignisWeak', true], ['give', 'blessing'], ['n', 'Thráin asiente, complacido. (+2 PV a todos · Ignis tirará un dado de defensa menos)']],
            ko: [['elian', 'Son runas enanas muy antiguas. No entiendo ni la mitad.'], ['give', 'blessing'], ['n', 'El espíritu os bendice de todos modos. (+2 PV a todos)']] },
          { hero: 'sera', attr: 'AGI', dif: 2, label: 'Registrar la tumba mientras él habla', desc: 'Nadie está mirando. Bueno, casi nadie.',
            ok: [['n', 'Los dedos de Sera encuentran un hueco bajo la losa: oro enano y un elixir.'], ['give', 'thrainLoot'], ['thrain', '…Ladrona. Ni muerto se respeta a un enano.'], ['n', 'Thráin se desvanece sin bendeciros. (+60 oro y un elixir)']],
            ko: [['thrain', '¡Fuera de mi tumba, rata!'], ['n', 'La losa se cierra sobre sus dedos. (−2 PV a Sera)'], ['hurt', 'sera', 2]] }
        ]],
        ['npcGone', 'thrain'],
        ['music', 'explore']
      ] },
      '9': { name: 'Cámara de Lingotes', reveal: [
        ['n', 'Lingotes enanos apilados con cuidado. Los orcos no saben contar, pero saben esconder.']
      ] },
      'R': { name: 'Canal de Escoria' },
      '0': { name: 'El Yunque Rúnico' }
    },
    notes: [
      [['sfx', 'page'], ['note', 'Diario de Fray Osric · Folio III', 'Día doce. Bajamos a la forja. Isolde acercó el farol al Sello de Fuego. Los orcos llegaron esa misma noche, como si alguien les hubiera abierto una puerta.'],
        ['aldric', 'Otra vez ella. Otra vez una puerta abierta.']],
      [['sfx', 'page'], ['note', 'Diario de Fray Osric · Folio IV', 'Día quince. Ya no la llamo hermana. He visto lo que hay dentro del farol cuando cree que nadie mira: un ojo. Un ojo que no es suyo.'],
        ['elian', '…'], ['sera', 'Elian. Dime que no has visto nada raro en ese farol.'], ['elian', 'No he mirado. No quiero mirar.']]
    ],
    chests: {},
    boss: {
      reveal: [
        ['music', 'boss'], ['stinger', 'boss'], ['camBoss'], ['sfx', 'quake'], ['shake', 0.6],
        ['n', 'Un yunque del tamaño de una casa se alza entre lagos de magma. Encima, algo que una vez fue un orco se pone en pie. Su piel es roca. Su sangre, fuego.'],
        ['ignis', 'La mujer del farol dijo que vendríais. Dijo que me traeríais el último trozo de fuego que me falta.'],
        ['sera', '¿La mujer del farol? ¿Hablas de Isolde?'],
        ['ignis', 'Hablo de la que me hizo esto. Y ahora… ¡ARDED!'], ['sfx', 'bossRoar'], ['bossbar'],
        ['objective', 'Derrota a Ignis. Cuidado con las erupciones marcadas en el suelo.']
      ],
      defeat: [
        ['ignis', 'Ella… también a mí… me prometió luz…'],
        ['wait', 500], ['music', 'silence'], ['camAltar'],
        ['isolde', 'El sello, Elian. Ahora.'],
        ['elian', 'No. Esta vez no.'],
        ['n', 'Elian no mueve el brazo. No hace falta. El farol tira de él hacia el sello como un perro de su correa.'],
        ['seal'], ['scare', 'eyes'], ['sfx', 'whisper', 1.4], ['voz', '«Gracias, niño.»'],
        ['lantern', '#b07aff'],
        ['elian', '¿Lo habéis visto? Dentro del farol… algo me ha mirado.'],
        ['isolde', 'Has visto la Llama, Elian. Es lo que hay al final de todas las cosas. Dos de tres.']
      ]
    }
  },

  /* ============================ CAPÍTULO III ============================ */
  {
    id: 'c3', num: 'III', title: 'El Ojo de Cristal', subtitle: 'El último sello', theme: 'void', ambient: 'void',
    legend: { a: 'voidAcolyte', b: 'wraith', c: 'golem', d: 'reflection' }, bossType: 'aethelgard', lantern: '#b07aff',
    locks: { '4,12': 'sello', '20,12': 'cerradura', '8,3': 'sello' },
    map: [
      '#########################',
      '#.......#.a...........a.#',
      '#.&...&.#...~~~...~~~...#',
      '#...7...+...~~~.B.~~~...#',
      '#.&...&.#.O....~*~....O.#',
      '#.......#......~~~......#',
      '#...c...#.......0.......#',
      '####+####################',
      '#.?.....#..M....M.#.....#',
      '#...5...+....4....+..6..#',
      '#.....M.#.........#.b...#',
      '#.......#..M.a..M.#...b.#',
      '####+#######+#######+####',
      '#...^...#.........#.....#',
      '#..9..C.#..1.2.3..#..8..#',
      '#.......#....X....#..?..#',
      '#########################'
    ],
    intro: [
      ['n', 'El fondo de la Hondura no es oscuro. Brilla. Una fortaleza de cristal violeta crece del abismo, y en su centro late algo enorme: el Ojo.'],
      ['isolde', 'Ya casi estáis. El último sello lo guarda Aethelgard, el más terco de los guardianes. Destruidle y todo habrá terminado.'],
      ['aldric', 'Así será, Madre.'],
      ['sera', 'Mientes de maravilla, paladín.'],
      ['aldric', 'Solo cuando importa.'],
      ['objective', 'Llega al Ojo de Cristal.']
    ],
    rooms: {
      '1': { name: 'Escalinata del Abismo' },
      '4': { name: 'Vestíbulo de los Espejos', reveal: [
        ['n', 'Espejos de marco dorado cubren las paredes. Vuestros reflejos tardan un instante en seguiros.']
      ], enter: [
        ['sfx', 'glass'], ['shake', 0.5], ['scare'],
        ['n', 'Uno de los reflejos no se detiene cuando os detenéis. Sale del espejo.'],
        ['spawn', 'reflection', 'near'],
        ['aldric', '¡Mi propio reflejo!'],
        ['test', 'all', 'VOL', 1, [], [['status', 'tested', 'aterrado', 1]]],
        ['sera', 'Pues pégale fuerte. Siempre he querido hacerlo.'], ['music', 'combat']
      ] },
      '5': { name: 'Biblioteca Ahogada', reveal: [
        ['n', 'Estanterías hundidas en cristal. Libros atrapados como insectos en ámbar.']
      ] },
      '6': { name: 'Galería de los Ecos', reveal: [
        ['n', 'Cada paso resuena tres veces. El tercero no es vuestro.'], ['sfx', 'whisper', 2]
      ] },
      '7': { name: 'Jardín de Cristal', reveal: [
        ['n', 'Cristales del tamaño de árboles. Uno de ellos se mueve.'],
        ['elian', 'Es un gólem. Antiguo. Cada golpe que reciba le dolerá menos que a nosotros.']
      ] },
      '9': { name: 'Relicario', reveal: [
        ['n', 'Un relicario sellado por dentro. Quien lo cerró no quería salir.']
      ] },
      '8': { name: 'Santuario del Eco', reveal: [
        ['npc', 'tomas', 'room'], ['music', 'silence'],
        ['tomas', 'Llegaste, hermanita.'],
        ['sera', 'Esta vez no voy a dejar que te corten a medias.'],
        ['tomas', 'Al final, ante el Ojo, ella te ofrecerá lo que más quieres. A mí me ofreció volver a casa.'],
        ['tomas', 'No aceptes. Rompe la luz.'],
        ['sera', 'Te sacaré de aquí, Tomás.'],
        ['tomas', 'Ya lo has hecho. Me has escuchado.'],
        ['npcGone', 'tomas'], ['give', 'blessing2'],
        ['n', 'El eco de Tomás se deshace en luz. Sera respira hondo por primera vez en cinco años. (Todos recuperan 3 PV)'],
        ['music', 'explore']
      ] },
      '0': { name: 'El Ojo' }
    },
    notes: [
      [['sfx', 'page'], ['note', 'Inscripción en el cristal', 'Lo que duerme no puede despertar solo. Necesita los ojos de otro para ver la salida, y las manos de un inocente para abrir la puerta.'],
        ['elian', 'Los ojos de otro… Por eso lleva siempre la venda.']],
      [['sfx', 'page'], ['note', 'Diario de Fray Osric · Último folio', 'Si alguien lee esto: Isolde no es ciega. Ve a través de la llama. Y lo que mira desde dentro no es ella. No dejéis que el farol toque el Ojo.'],
        ['aldric', 'Osric llegó hasta aquí. Solo.'], ['sera', 'Y nos dejó un aviso. Hagámosle caso.'], ['flag', 'osricFolio', true]]
    ],
    chests: {},
    boss: {
      reveal: [
        ['music', 'boss'], ['stinger', 'boss'], ['camBoss'],
        ['n', 'En el corazón de la fortaleza, un ojo de cristal del tamaño de una puerta mira hacia el abismo. Ante él, un caballero hecho de luz fría alza su espada.'],
        ['aethelgard', 'Portadores de la luz. Habéis roto a dos de mis hermanos. No romperéis al tercero.'],
        ['aldric', 'No venimos a romperlo, guardián. Venimos a…'],
        ['aethelgard', '¡Silencio! He oído esas palabras mil veces, siempre con la misma voz detrás.'],
        ['check', 'Aethelgard alza la espada. Queda un instante antes del primer golpe.', [
          { hero: 'aldric', attr: 'PRE', dif: 3, label: 'Bajar la espada y hablarle de igual a igual', desc: 'Prueba difícil. Un caballero a otro.',
            ok: [['aethelgard', '…Tu voz no tiene su eco. Pero ya no sé detenerme.'], ['flag', 'aethDoubt', true], ['n', 'La luz del guardián vacila. (Empieza con 4 PV menos y pierde su primer turno)']],
            ko: [['aethelgard', '¡Mentiras con armadura!']] },
          { hero: 'elian', attr: 'ING', dif: 2, req: 'osricFolio', reqText: 'Requiere haber leído el último folio de Osric', label: 'Recitarle el aviso de Osric', desc: '«No dejéis que el farol toque el Ojo.»',
            ok: [['aethelgard', '…Osric. El único que bajó para avisarme. Entonces sabéis lo que lleváis.'], ['flag', 'aethDoubt', true], ['n', 'La luz del guardián vacila. (Empieza con 4 PV menos y pierde su primer turno)']],
            ko: [['aethelgard', 'Cualquiera puede repetir las palabras de un muerto.']] },
          { label: 'Atacar sin palabras', desc: 'No hay tiempo para discursos.', steps: [['aldric', 'Que así sea.']] }
        ]],
        ['isolde', 'Mátalo, Aldric. Hazlo y todo habrá terminado.'], ['bossbar'],
        ['objective', 'Derrota a Aethelgard. Puede teleportarse junto a quien esté más débil.']
      ],
      defeat: [
        ['aethelgard', 'Vuestras espadas… no tienen su olor. Quizá me equivoqué con vosotros.'],
        ['aethelgard', 'Escuchad. El sello no se rompe con acero. Solo el farol puede abrirlo. No dejéis que…'],
        ['stinger', 'twist'], ['music', 'silence'], ['lights', 'flicker'],
        ['isolde', 'Gracias, guardián. Ya no hace falta que nadie me deje.'],
        ['twist']
      ]
    },
    twist: [
      ['n', 'El farol se suelta del báculo y flota hacia el Ojo. Su llama se abre como una flor y de ella sale una figura vestida de blanco, con una venda sobre los ojos.'],
      ['isolde', 'Mil años esperando a que alguien bajara con un corazón lo bastante limpio para cargar mi luz. Gracias, Elian. Has sido el mejor de mis hijos.'],
      ['elian', 'Me criaste para esto. Cada lección. Cada cuento antes de dormir.'],
      ['isolde', 'Te crié con amor. Una cosa no quita la otra.'],
      ['isolde', 'Dame el farol, niño. Deja que el Ojo se abra y os daré lo que pidáis. A Sera, su hermano. A Aldric, su orden. A ti, una madre que nunca vuelva a mentirte.'],
      ['n', 'La voz de Isolde se mete en cada cabeza a la vez. Es cálida. Es la voz de una madre.'],
      ['willTest', 2],
      ['choice', 'El farol late en la mano de Elian. ¿Qué hace?', [
        ['Romper el farol', 'Elian golpea el farol contra el suelo. Isolde pierde parte de su poder.', [['flag', 'broke', true], ['sfx', 'glass'], ['shake', 1], ['scare'],
          ['elian', 'No, Madre. Esta vez el cuento lo termino yo.'],
          ['isolde', '¡NO! ¿Qué has hecho, desagradecido?']]],
        ['Entregar el farol', 'Elian duda… y lo tiende hacia ella. Isolde despierta con todo su poder.', [['flag', 'broke', false], ['sfx', 'summon'],
          ['elian', 'Yo… solo quería que dejara de doler.'],
          ['sera', '¡Elian, no!'],
          ['isolde', 'Buen chico. Ahora, mirad cómo se abre el mundo.']]]
      ]],
      ['spawnBoss', 'isolde'], ['music', 'boss'], ['bossbar'],
      ['objective', 'Derrota a Isolde, la Voz bajo la Piedra.']
    ],
    finalDefeat: [
      ['isolde', 'Elian… mi niño… está tan oscuro aquí abajo…'],
      ['elian', 'Lo sé, Madre. Por eso vamos a encender una luz.'],
      ['music', 'silence'], ['wait', 600]
    ]
  }
];

const CAMPS = [
  {
    title: 'Rellano de la Escalera Vieja',
    steps: [
      ['n', 'En un rellano de la vieja escalera, a medio camino entre el mundo y la Hondura, encendéis un fuego.'],
      ['aldric', 'Hoy has luchado bien, Sera. Tu hermano estaría orgulloso.'],
      ['sera', 'Mi hermano está ahí abajo, paladín. Y me ha dicho que la luz miente.'],
      ['elian', 'Era un eco. Madre Isolde me crió en el Archivo desde los seis años. No hay nadie en Aldmere más bondadoso.'],
      ['sera', 'Nadie es bondadoso a tanta profundidad.'],
      ['aldric', 'Basta. Seguiremos adelante. Pero con los ojos abiertos. Los tres.'],
      ['elian', '…El farol pesa más que esta mañana.']
    ]
  },
  {
    title: 'Grieta del Último Calor',
    steps: [
      ['n', 'Nadie habla durante un largo rato. El fuego crepita. El farol, apartado sobre una piedra, late con una luz que ya no es del todo cálida.'],
      ['sera', 'Un ojo, Elian. Había un ojo dentro de esa cosa.'],
      ['elian', 'Lo sé. Lo sé…'],
      ['aldric', 'El enano dijo que los sellos son cerraduras. Si es verdad, llevamos dos noches abriendo puertas que debían seguir cerradas.'],
      ['elian', 'Me eligió a mí. Desde niño. Me enseñó a leer, a tejer el éter… ¿para esto?'],
      ['sera', 'Eh. Mírame. Lo que ella planeara no te define. Lo que hagas mañana, sí.'],
      ['aldric', 'Bajaremos al Ojo. Pero el farol no tocará el último sello. Lo juro por mi orden.'],
      ['elian', '¿Y si ella intenta detenernos?'],
      ['aldric', 'Entonces sabremos por fin a quién nos enfrentamos.']
    ]
  }
];

const PROLOGUE = [
  'Durante mil años, la Llama Perenne ardió en la catedral de Aldmere.',
  'Bajo sus raíces duerme la Hondura: criptas, forjas y torres hundidas que nadie recuerda haber construido.',
  'Hace siete noches, la Llama se apagó.',
  'Desde entonces, los muertos llaman a las puertas. Y algo, muy abajo, ha empezado a respirar.',
  'Madre Isolde, la vidente ciega del Archivo, ha reunido a tres almas dispuestas a descender.'
];

const EPILOGUES = {
  broke: {
    title: 'La Llama Despierta',
    lines: [
      'Elian apoyó las manos sobre el Ojo y tejió en él todo el éter que le quedaba. El cristal se cerró como un párpado.',
      'Arriba, en la catedral de Aldmere, la Llama Perenne volvió a arder sola, sin que nadie la encendiera.',
      'Elian nunca recuperó la vista de su ojo izquierdo. Dice que así recuerda que la luz también puede mentir.',
      'Sera bajó una vez más, sola, con una vela. Volvió al amanecer y nunca contó lo que dejó en la celda de Tomás. Desde entonces duerme sin pesadillas.',
      'Aldric escribió la verdad en el Archivo, con su nombre al pie. Es el primer texto de la Hondura que nadie ha raspado.'
    ]
  },
  gave: {
    title: 'El Nuevo Guardián',
    lines: [
      'Isolde cayó, pero el Ojo no se cerró del todo. Alguien tenía que quedarse a vigilarlo.',
      'Aldric de Vaelmont se arrodilló ante el cristal y ocupó el lugar de Aethelgard. Dicen que su armadura brilla ahora con una luz fría.',
      'Sera y Elian subieron solos. La Llama volvió a arder, más débil que antes.',
      'Elian guarda los pedazos del farol en una caja sin cerradura. Cada noche comprueba que siguen apagados.',
      'Algunas noches, los perros de Aldmere aún ladran hacia el suelo.'
    ]
  }
};

/* ============================ TUTORIAL ============================
   Sala de prácticas bajo la catedral: se juega con reglas de Relato y no toca la partida guardada */
const TUTORIAL = {
  id: 'tut', num: '0', eyebrow: 'Tutorial guiado', title: 'La Sala de Armas', subtitle: 'Antes de descender', theme: 'crypt', ambient: 'crypt', tutorial: true,
  legend: { a: 'dummy', b: 'dummyArcher' }, lantern: '#ffb45a',
  locks: { '14,3': 'cerradura' },
  map: [
    '#####################',
    '#.....#......b#.....#',
    '#.1...#..a....#..C..#',
    '#..2..+.......+.....#',
    '#.3...#....a..#..?..#',
    '#X....#4......#....5#',
    '#####################'
  ],
  intro: [
    ['n', 'Bajo la catedral de Aldmere, la Orden guarda una sala de armas. Huele a cera, a aceite y a huesos viejos.'],
    ['aldric', 'Antes de bajar a la Hondura quiero veros luchar juntos. Tras esa puerta esperan tres esqueletos de prácticas.'],
    ['sera', '¿Esqueletos de prácticas? Qué cosas guardáis en las catedrales.'],
    ['elian', 'Huesos y alambre con un hechizo menor. Pegan flojo… creo.'],
    ['objective', 'Tutorial: aprende a moverte, luchar y abrir puertas.']
  ],
  rooms: {
    '1': { name: 'Sala de armas' },
    '4': { name: 'Patio de prácticas', reveal: [['aldric', 'Ahí los tenéis. Pegan flojo, pero pegan. Juntos, como os enseñé.'], ['objective', 'Derrota a los esqueletos de prácticas.']] },
    '5': { name: 'Armería', reveal: [['sera', 'Un cofre. Ahora sí hablamos el mismo idioma.'], ['objective', 'Abre el cofre de la armería.']] }
  },
  notes: [
    [['sfx', 'page'], ['note', 'Reglamento de la Orden · Artículo III', 'Un paladín no deja atrás a un hermano caído. Un explorador mira dónde pisa. Un tejedor no gasta su éter en vano. Y ninguno de los tres baja solo.'],
      ['aldric', 'Leer no gasta la acción. Aprendedlo: abajo, los escritos cuentan lo que nadie os dirá.']]
  ],
  chests: {
    0: [['n', 'Monedas viejas y provisiones: la Orden no deja bajar a nadie con las manos vacías.'], ['objective', 'Últimos consejos antes de bajar.']]
  }
};

