/* ==========================================================================
   Historia, héroes, criaturas y mapas
   Los diálogos de los héroes no dependen de quién baje: el paso
   ['h', {barbaro: '…', enano: '…', any: '…'}] lo dice el primer héroe del
   grupo que tenga frase propia (o el portador del farol, con «any»).
   ['h2', …] busca a otro héroe distinto del último que habló.
   {lider} se sustituye por el nombre de quien lleva el farol.
   ========================================================================== */
const SPEAKERS = {
  narrador: { name: '', color: '#e9dcc0' },
  barbaro: { name: 'Korvak', title: 'Bárbaro', color: '#ff9a7a' },
  enano: { name: 'Borin', title: 'Enano', color: '#f0b070' },
  elfa: { name: 'Lyriel', title: 'Elfa arquera', color: '#86e0a0' },
  hechicero: { name: 'Aldebrán', title: 'Hechicero', color: '#9fb8ff' },
  amazona: { name: 'Thalia', title: 'Amazona', color: '#ffd27a' },
  isolde: { name: 'Madre Isolde', title: 'Vidente del Archivo', color: '#f0e4c8' },
  voz: { name: '…', title: 'Un susurro', color: '#c08bff' },
  malakor: { name: 'Malakor', title: 'El Nigromante', color: '#7dffb0' },
  ignis: { name: 'Ignis', title: 'Señor del Magma', color: '#ff9a5a' },
  aethelgard: { name: 'Aethelgard', title: 'Guardián del Ojo', color: '#a8e0ff' },
  thrain: { name: 'Thráin', title: 'Último forjamaestro', color: '#a8e8ff' },
  tomas: { name: 'Tomás', title: 'Novicio del Archivo', color: '#cfe8ff' }
};

/* Los cinco héroes. Cada uno: un ataque básico, dos habilidades distintas y un rasgo */
const HERO_ROSTER = ['barbaro', 'enano', 'elfa', 'hechicero', 'amazona'];
const HERO_DEFS = {
  barbaro: { name: 'Korvak', full: 'Korvak de las Estepas', role: 'Bárbaro', race: 'Humano del norte', model: 'barbaro', color: '#e0583c',
    stats: { hp: 11, atk: 3, def: 2, mv: 6 }, dtype: 'phys',
    weapon: 'Hacha de guerra', armor: 'Pieles',
    blurb: 'El que más aguanta y más pega. Se mete en el centro de la pelea: cuanto más le rodean, mejor.',
    trait: { name: 'Sangre caliente', desc: 'No conoce el miedo. Con la mitad de la vida o menos, ataca con un dado más.' },
    traits: { fearless: true, rage: true },
    basic: { name: 'Hachazo', icon: 'axe' },
    skills: [
      { id: 'torbellino', name: 'Torbellino', icon: 'whirl', cd: 3, target: 'self', desc: 'Golpea a todos los enemigos que tenga al lado.' },
      { id: 'grito', name: 'Grito de guerra', icon: 'crown', cd: 4, target: 'self', desc: 'Aterra a los enemigos cercanos y recupera vida.' }
    ] },
  enano: { name: 'Borin', full: 'Borin Yunquebarba', role: 'Enano', race: 'Enano de las montañas', model: 'enano', color: '#e8962f',
    stats: { hp: 10, atk: 2, def: 3, mv: 5 }, dtype: 'phys',
    weapon: 'Martillo de guerra', armor: 'Cota enana',
    blurb: 'El más duro. Lento, pero sus golpes atraviesan escudos y aguanta lo que le echen. Abre cerraduras y desarma trampas a la primera.',
    trait: { name: 'Manos de herrero', desc: 'Sus golpes ignoran 1 escudo. Abre cerraduras y desarma trampas sin tirar dados.' },
    traits: { shieldbreaker: 1, locksmith: true },
    basic: { name: 'Martillazo', icon: 'hammer' },
    skills: [
      { id: 'sismico', name: 'Martillo sísmico', icon: 'quake', cd: 3, target: 'enemy', range: 1, desc: 'Golpea y aturde a los enemigos de su alrededor.' },
      { id: 'muralla', name: 'Muralla', icon: 'shield', cd: 3, target: 'self', desc: 'Se planta: +2 dados de defensa y los enemigos van a por él.' }
    ] },
  elfa: { name: 'Lyriel', full: 'Lyriel de los Bosques Grises', role: 'Elfa arquera', race: 'Elfa', model: 'cazadora', color: '#3fbf6a',
    stats: { hp: 7, atk: 2, def: 2, mv: 7, range: 6, melee: 1 }, ranged: true, dtype: 'pierce', proj: 'arrow',
    weapon: 'Arco largo', armor: 'Cuero de ciervo',
    blurb: 'La más rápida y la que más lejos dispara. Ve las trampas antes de pisarlas. Frágil si la alcanzan.',
    trait: { name: 'Ojo de elfa', desc: 'Dispara a 6 casillas. Descubre las trampas a 2 casillas sin buscarlas.' },
    traits: { trapSense: 2 },
    basic: { name: 'Flechazo', icon: 'bow' },
    skills: [
      { id: 'lluvia', name: 'Lluvia de flechas', icon: 'rain', cd: 3, target: 'area', range: 6, los: true, desc: 'Dispara al aire: 2 dados a cada enemigo de una zona de 3×3.' },
      { id: 'salto', name: 'Salto élfico', icon: 'shadowstep', cd: 3, target: 'tile', range: 5, free: true, desc: 'Salta a una casilla libre a 5 casillas. No gasta la acción.' }
    ] },
  hechicero: { name: 'Aldebrán', full: 'Aldebrán de la Torre de Ceniza', role: 'Hechicero', race: 'Humano', model: 'hechicero', color: '#5a86ff',
    stats: { hp: 6, atk: 2, def: 2, mv: 5, range: 5, melee: 1 }, ranged: true, dtype: 'arcane', proj: 'bolt', magic: true,
    weapon: 'Saeta arcana', armor: 'Túnica tejida',
    blurb: 'Magia de fuego que arrasa grupos y una luz que cura. Muy frágil: que no le alcancen.',
    trait: { name: 'Arcano', desc: 'Sus ataques son mágicos: hieren de lleno a los espectros y los no muertos los temen. Abre los sellos rúnicos sin tirar dados.' },
    traits: { arcane: true, sealbreaker: true },
    basic: { name: 'Saeta arcana', icon: 'bolt' },
    skills: [
      { id: 'bola', name: 'Bola de fuego', icon: 'starfire', cd: 3, target: 'enemy', range: 5, los: true, desc: '3 dados al objetivo y 2 a los enemigos de su lado.' },
      { id: 'luz', name: 'Luz sanadora', icon: 'dawn', cd: 3, target: 'ally', range: 4, desc: 'Cura 3 PV a un aliado (o a sí mismo) o levanta a un caído.' }
    ] },
  amazona: { name: 'Thalia', full: 'Thalia de las Islas del Sol', role: 'Amazona', race: 'Humana', model: 'amazona', color: '#e8b33a',
    stats: { hp: 9, atk: 3, def: 2, mv: 6, range: 2 }, dtype: 'phys',
    weapon: 'Lanza', armor: 'Peto de bronce',
    blurb: 'Guerrera veloz que ataca a dos casillas con su lanza y se lanza a la carga. Su grito empuja al grupo.',
    trait: { name: 'Alcance de lanza', desc: 'Ataca a enemigos a 2 casillas, aunque no estén pegados a ella.' },
    traits: { reach: true },
    basic: { name: 'Lanzada', icon: 'target' },
    skills: [
      { id: 'carga', name: 'Carga', icon: 'boot', cd: 3, target: 'enemy', range: 5, desc: 'Corre hasta un enemigo a 5 casillas y le golpea con un dado más.' },
      { id: 'tribu', name: 'Grito de la tribu', icon: 'bell', cd: 4, target: 'self', desc: 'Ella y sus aliados a 3 casillas: +1 dado en su próximo ataque y +2 de movimiento.' }
    ] }
};

const ENEMY_TYPES = {
  skeleton: { name: 'Esqueleto', model: 'skeleton', role: 'bruto', iq: 1, hp: 2, atk: 3, def: 2, mv: 4, gold: 5, undead: true, weak: ['arcane'], immune: ['aterrado', 'envenenado'], traits: ['noMuerto', 'sinMiedo'], sfx: 'bone', deathCol: ['#f0e6cc', '#6a6050'] },
  archer: { name: 'Arquero esquelético', model: 'archer', role: 'tirador', iq: 2, hp: 2, atk: 2, def: 1, mv: 3, range: 5, ranged: true, proj: 'arrow', gold: 6, undead: true, weak: ['arcane'], immune: ['aterrado', 'envenenado'], traits: ['noMuerto', 'sinMiedo'], sfx: 'bone', deathCol: ['#f0e6cc', '#6a6050'] },
  ghoul: { name: 'Necrófago', model: 'ghoul', role: 'hostigador', iq: 2, hp: 3, atk: 3, def: 1, mv: 5, gold: 8, undead: true, weak: ['arcane'], immune: ['aterrado', 'envenenado'], onHit: { st: 'envenenado', dur: 2 }, traits: ['noMuerto', 'veneno'], deathCol: ['#b9c9a0', '#3a4a30'] },
  acolyte: { name: 'Acólito de la Voz', model: 'acolyte', role: 'lanzador', iq: 4, hp: 2, atk: 2, def: 2, mv: 4, range: 4, ranged: true, proj: 'necro', gold: 8, onHit: { st: 'aterrado', dur: 1 }, traits: ['lider', 'aterrador'], deathCol: ['#ff8a7a', '#4a0a0a'], barks: ['Ella lo ve todo.', 'La luz miente…', 'Arrodillaos ante el farol.'] },
  orc: { name: 'Orco de la Mano Negra', model: 'orc', role: 'bruto', iq: 2, hp: 3, atk: 3, def: 2, mv: 5, gold: 8, traits: [], deathCol: ['#9ab060', '#2a3a10'], barks: ['¡Carne fresca!', '¡Aplastar!', '¡Por Ignis!'] },
  goblin: { name: 'Trasgo', model: 'goblin', role: 'hostigador', iq: 2, hp: 1, atk: 2, def: 1, mv: 7, gold: 4, traits: ['cobarde'], deathCol: ['#c0c060', '#3a3a10'], barks: ['¡Hiii!', '¡Brillante, brillante!'] },
  shaman: { name: 'Chamán de ceniza', model: 'shaman', role: 'lanzador', iq: 4, hp: 3, atk: 3, def: 2, mv: 4, range: 4, ranged: true, proj: 'fire', gold: 10, healer: true, onHit: { st: 'ardiendo', dur: 2 }, traits: ['lider', 'sanador', 'incendiario'], deathCol: ['#ffb06a', '#3a1a0a'], barks: ['¡El fuego me escucha!'] },
  berserker: { name: 'Berserker', model: 'berserker', role: 'bruto', iq: 1, hp: 4, atk: 4, def: 1, mv: 5, gold: 10, fury: true, immune: ['aterrado'], traits: ['furia', 'sinMiedo'], deathCol: ['#c06060', '#3a0a0a'], barks: ['¡SANGRE!', '¡Más, más!'] },
  voidAcolyte: { name: 'Acólito del Vacío', model: 'voidAcolyte', role: 'lanzador', iq: 4, hp: 3, atk: 3, def: 2, mv: 4, range: 4, ranged: true, proj: 'void', gold: 9, onHit: { st: 'aterrado', dur: 1 }, traits: ['aterrador'], deathCol: ['#d8b8ff', '#2a0a4a'], barks: ['El Ojo se abre.', 'Vuestra luz es nuestra.'] },
  wraith: { name: 'Espectro', model: 'wraith', role: 'espectro', iq: 3, hp: 3, atk: 3, def: 3, mv: 6, gold: 10, undead: true, flies: true, weak: ['arcane'], resistMundane: true, immune: ['aterrado', 'envenenado'], onHit: { st: 'aterrado', dur: 1 }, traits: ['noMuerto', 'incorporeo', 'aterrador', 'vuela'], deathCol: ['#e8ffff', '#3fb4c9'] },
  golem: { name: 'Gólem de cristal', model: 'golem', role: 'coloso', iq: 1, hp: 6, atk: 4, def: 4, mv: 3, gold: 18, resist: ['pierce', 'arcane'], immune: ['aterrado', 'envenenado', 'ardiendo'], onHit: { st: 'aturdido', dur: 1, minDmg: 2 }, traits: ['cristal', 'aturdidor', 'sinMiedo'], deathCol: ['#e0ccff', '#5a2aaa'], sfx: 'glass' },
  reflection: { name: 'Reflejo', model: 'reflection', role: 'copia', iq: 3, hp: 3, atk: 3, def: 2, mv: 5, gold: 5, weak: ['arcane'], immune: ['aterrado', 'envenenado'], traits: ['sinMiedo'], deathCol: ['#d8d0ff', '#1a1430'], sfx: 'glass' },
  risen: { name: 'Huesos alzados', model: 'skeleton', role: 'bruto', iq: 1, hp: 1, atk: 2, def: 1, mv: 4, gold: 0, undead: true, weak: ['arcane'], immune: ['aterrado', 'envenenado'], traits: ['noMuerto', 'sinMiedo'], sfx: 'bone', deathCol: ['#f0e6cc', '#6a6050'] },
  // prácticas (tutorial)
  dummy: { name: 'Esqueleto de prácticas', model: 'skeleton', role: 'bruto', iq: 1, hp: 3, atk: 2, def: 1, mv: 3, gold: 2, undead: true, weak: ['arcane'], immune: ['aterrado', 'envenenado'], traits: ['noMuerto', 'sinMiedo'], sfx: 'bone', deathCol: ['#f0e6cc', '#6a6050'] },
  dummyArcher: { name: 'Arquero de prácticas', model: 'archer', role: 'tirador', iq: 1, hp: 2, atk: 2, def: 1, mv: 2, range: 4, ranged: true, proj: 'arrow', gold: 2, undead: true, weak: ['arcane'], immune: ['aterrado', 'envenenado'], traits: ['noMuerto', 'sinMiedo'], sfx: 'bone', deathCol: ['#f0e6cc', '#6a6050'] },
  // jefes
  malakor: { name: 'Malakor el Nigromante', model: 'malakor', role: 'jefe', iq: 5, boss: true, hp: 9, atk: 3, def: 3, mv: 3, range: 5, ranged: true, proj: 'necro', gold: 60, undead: true, weak: ['arcane'], immune: ['aterrado', 'envenenado'], onHit: { st: 'aterrado', dur: 1 }, traits: ['noMuerto', 'aterrador', 'lider'], deathCol: ['#b9ffd8', '#0a3a20'] },
  ignis: { name: 'Ignis, Señor del Magma', model: 'ignis', role: 'jefe', iq: 4, boss: true, hp: 12, atk: 5, def: 3, mv: 3, gold: 50, resist: ['fire'], immune: ['aterrado', 'ardiendo', 'aturdido'], onHit: { st: 'ardiendo', dur: 2 }, traits: ['fuegoVivo', 'incendiario', 'lider'], deathCol: ['#ffd08a', '#ff3a10'] },
  aethelgard: { name: 'Aethelgard, Guardián del Ojo', model: 'aethelgard', role: 'jefe', iq: 5, boss: true, hp: 11, atk: 4, def: 5, mv: 4, gold: 80, undead: true, flies: true, weak: ['arcane'], immune: ['aterrado', 'envenenado'], traits: ['noMuerto', 'vuela', 'lider'], deathCol: ['#e8f7ff', '#4ab0ff'] },
  isolde: { name: 'Isolde, la Voz bajo la Piedra', model: 'isolde', role: 'jefe', iq: 5, boss: true, hp: 12, atk: 4, def: 3, mv: 0, range: 6, ranged: true, proj: 'void', gold: 0, flies: true, immune: ['aterrado', 'envenenado', 'aturdido'], onHit: { st: 'aterrado', dur: 1 }, traits: ['aterrador', 'lider', 'vuela'], deathCol: ['#ffffff', '#9d6bff'] }
};

const SHOP = [
  { id: 'potion', kind: 'item', name: 'Poción de curación', icon: 'potion', cost: 35, max: 6, desc: 'Cura 4 PV y el veneno. Beberla no gasta la acción (una por turno).' },
  { id: 'elixir', kind: 'item', name: 'Elixir de ímpetu', icon: 'elixir', cost: 45, max: 3, desc: 'Concede una acción extra este turno.' },
  { id: 'bomb', kind: 'item', name: 'Bomba alquímica', icon: 'bomb', cost: 40, max: 4, desc: 'Se lanza a 4 casillas: 3 dados a todo lo que haya en un área de 3×3. ¡Ojo con los aliados!' }
];

const BARKS = {
  barbaro: { kill: ['¡Siguiente!', '¡Ja! ¿Eso era todo?', 'A la tierra contigo.', '¡Más!'], hurt: ['Eso me ha despertado.', '¡Ahora sí estoy enfadado!'], low: ['Aún… respiro.'], skill: ['¡VENID A MÍ!', '¡Sangre y acero!'], gold: ['Oro. Bien.'] },
  enano: { kill: ['Al yunque contigo.', 'Hierro manda.', 'Otro para la fragua.'], hurt: ['¿Eso es todo?', 'Mi abuela pegaba más fuerte.'], low: ['Aún… me tengo en pie.'], skill: ['¡Tierra, tiembla!', 'Que vengan.'], trap: ['Trampa. Quietos todos.', 'Mal hecha, pero es una trampa.'], gold: ['Oro enano. Lo reconozco.'] },
  elfa: { kill: ['Demasiado lento.', 'Una flecha, un enemigo.', 'Descansa.'], hurt: ['¡Ah! Cerca, demasiado cerca.', 'Que no me alcancen.'], low: ['Necesito… distancia.'], skill: ['Del cielo, como lluvia.', 'Arriba.'], trap: ['Alto. Aquí hay algo.', 'Una trampa. La veo.'], gold: ['Brilla bonito.'] },
  hechicero: { kill: ['Que el fuego te lleve.', 'Lección aprendida.', 'Polvo eres.'], hurt: ['¡Ah! No estoy hecho para esto.', '¡Cuidado conmigo!'], low: ['Veo… puntos negros.'], heal: ['Aguanta, ya te tengo.', 'Respira. Así.'], skill: ['¡Arde!', 'Estrellas, escuchadme.'], gold: ['Para tinta y libros.'] },
  amazona: { kill: ['Por las Islas del Sol.', '¡Uno menos!', 'Cae, bestia.'], hurt: ['¡Eso no te lo perdono!', 'Ni un paso atrás.'], low: ['Mi madre… no se rendiría.'], skill: ['¡Conmigo, hermanos!', '¡A la carga!'], gold: ['Para el templo.'] }
};

const HINTS = {
  move: 'Toca una casilla iluminada para mover al héroe activo. En ordenador, pasa el ratón para ver la ruta y haz clic.',
  attack: 'Toca a un enemigo para atacarlo. Si no está a tu alcance pero puedes llegar, el héroe se acercará y golpeará.',
  door: 'Toca una puerta para abrirla. Las salas ocultas solo se revelan al cruzar su umbral.',
  turn: 'Cada héroe tiene movimiento y una acción por turno. Cuando todos terminen, actuará la Sombra.',
  search: 'Buscar (lupa) revela las trampas de la sala y puede encontrar tesoro… o despertar algo.',
  touch: 'En el móvil: arrastra con un dedo para mover la cámara, pellizca para acercar y gira con dos dedos.',
  flank: 'Flanqueo: si otro héroe está junto a tu objetivo, atacas con un dado más.',
  lock: 'Puerta cerrada: forzarla gasta la acción y se tiran 3 dados; las calaveras se van sumando hasta abrirla. El Enano abre las cerraduras y el Hechicero los sellos sin tirar.',
  doom: 'El Presagio crece cada ronda y con el ruido. Cuando se llena, algo errante sube de la Hondura a buscaros.',
  fear: 'Aterrado: −1 dado de ataque hasta que se le pase. El Bárbaro no conoce el miedo.',
  skill: 'Cada héroe tiene dos habilidades. Después de usarlas se recargan unas rondas: el número sobre el botón dice cuántas faltan.'
};

const CHAPTERS = [
  /* ============================ CAPÍTULO I ============================ */
  {
    id: 'c1', num: 'I', title: 'Las Criptas de Malakor', subtitle: 'El Sello de Hueso', theme: 'crypt', ambient: 'crypt',
    legend: { a: 'skeleton', b: 'archer', c: 'ghoul', d: 'acolyte' }, bossType: 'malakor', lantern: '#ffb45a',
    locks: { '10,11': 'sello', '17,11': 'cerradura' },
    recommend: { heroes: ['hechicero', 'amazona', 'barbaro'], text: 'Criptas llenas de no muertos: la magia del Hechicero les hace más daño y abre el sello rúnico sin tirar. La lanza de la Amazona mantiene a raya a los necrófagos.' },
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
      ['isolde', 'Oídme bien, hijos. Lleváis mi farol. Mientras arda, podré hablaros y ver lo que veis.'],
      ['isolde', 'Tres sellos mantienen cerrada la Hondura: Hueso, Fuego y Cristal. Sus guardianes se han corrompido. Acercad el farol a cada sello y la Llama Perenne volverá a casa.'],
      ['h', { amazona: 'Bajaremos, Madre. Y subiremos con la Llama o no subiremos.', barbaro: 'Mientras haya algo a lo que pegar, por mí bien.', enano: 'Piedra vieja y mal trabajada. Ya me gusta poco.', elfa: 'Huele a muerte antigua. Y a algo más reciente.', hechicero: 'El farol tiembla, Madre. ¿Es normal?' }],
      ['isolde', 'Tiembla porque tiene miedo. Igual que vosotros. Adelante.'],
      ['objective', 'Encuentra el Sello de Hueso en la cripta de Malakor.'],
      ['hint', 'move'], ['hint', 'touch']
    ],
    rooms: {
      '1': { name: 'Antecámara' },
      '4': { name: 'Galería de los Nichos', reveal: [
        ['n', 'Nichos excavados en la roca, cientos, hasta donde alcanza la luz. En cada uno, un nombre borrado a cincel.'],
        ['h', { elfa: 'Alguien ha raspado los nombres. Esto no es obra de saqueadores.', hechicero: 'Nombres raspados… Sin nombre, un muerto no descansa: obedece.', any: 'Alguien ha raspado los nombres de los muertos.' }],
        ['sfx', 'bone'], ['bark', 'lider', '¡En guardia!'], ['hint', 'attack']
      ] },
      '5': { name: 'Osario', reveal: [
        ['n', 'Huesos apilados en muros, en columnas, en bóvedas. Un osario sin fondo.']
      ], enter: [
        ['lights', 'out'], ['music', 'silence'], ['wait', 700], ['sfx', 'whisper', 2.4],
        ['voz', '«…{lider}…»'], ['wait', 500],
        ['h', { any: '¿Quién ha dicho mi nombre?' }],
        ['fear', 'lider', 2],
        ['lights', 'on'], ['scare'], ['spawn', 'ghoul', 'near'], ['shake', 0.6],
        ['bark', 'lider', '¡Detrás!'], ['music', 'combat']
      ] },
      '6': { name: 'Capilla de los Susurros', reveal: [
        ['n', 'Una capilla pequeña. Cuatro sarcófagos rodean un cofre sellado con cera negra.'],
        ['h', { hechicero: 'Huele a incienso. Reciente.', any: 'Incienso. Alguien estuvo aquí hace poco.' }]
      ] },
      '7': { name: 'Pozo Necrótico', reveal: [
        ['n', 'Un pozo de miasma verde burbujea en el centro de la sala. Sobre las pasarelas, arqueros sin carne tensan cuerdas podridas.'],
        ['h', { enano: 'No piséis eso verde. Ni lo miréis mucho rato.', hechicero: 'No toquéis ese líquido. Ni lo miréis demasiado rato.', any: 'Lejos de ese pozo.' }]
      ] },
      '9': { name: 'Cámara del Tesoro', reveal: [
        ['n', 'Monedas antiguas cubiertas de polvo. Demasiado fácil.'],
        ['h', { elfa: 'Cuando algo parece demasiado fácil, mira dónde pisas.', enano: 'Monedas sueltas en el suelo. O es un regalo o es una trampa.', any: 'Cuidado. Esto huele a trampa.' }], ['hint', 'search']
      ] },
      '8': { name: 'La Celda', reveal: [
        ['n', 'Una celda estrecha. En la pared, cientos de rayas que cuentan días. Y un nombre grabado una y otra vez: TOMÁS.'],
        ['npc', 'tomas', 'room'], ['music', 'silence'], ['sfx', 'whisper', 1.5],
        ['tomas', 'Más portadores de farol. Llegáis tarde. O demasiado pronto.'],
        ['h', { amazona: '¿Quién eres, espíritu?', any: '¿Quién eres?' }],
        ['tomas', 'Tomás, novicio del Archivo. Bajamos a reavivar los sellos, como vosotros. Ella nos guiaba con su luz. Nos dijo que los guardianes estaban corruptos.'],
        ['tomas', 'No lo estaban. Era mentira. Tened cuidado con la luz que…'],
        ['lights', 'flicker'], ['sfx', 'dark'],
        ['isolde', '¡Basta! Es un eco. Los muertos de la Hondura imitan voces para atraeros. No le escuchéis.'],
        ['choice', 'El eco de Tomás empieza a deshacerse. ¿Qué hacéis?', [
          { label: 'Escucharle hasta el final', desc: 'Sostener el eco cuesta: quien lleva el farol pierde 2 PV.', steps: [
            ['hurt', 'lider', 2],
            ['tomas', '…La luz que lleváis no es suya. El Archivo nunca tuvo una vidente. Recordad su voz y no la escuchéis.'],
            ['flag', 'tomasTruth', true],
            ['n', 'Ahora sabéis a quién no creer. (La voz de Isolde no os afectará al final y el enemigo final será más débil)']] },
          { label: 'Dejarle descansar', desc: 'Nadie debería obligar a los muertos a hablar.', steps: [['h', { any: 'Descansa, Tomás.' }]] }
        ]],
        ['npcGone', 'tomas'], ['wait', 600],
        ['h2', { hechicero: 'Madre Isolde nunca nos mentiría… ¿verdad?', amazona: 'Un eco no miente a propósito. Los vivos, sí.', barbaro: 'No me gustan los fantasmas. Pero ese parecía sincero.', any: 'Era una voz cansada. No una trampa.' }],
        ['music', 'explore']
      ] },
      '0': { name: 'Cripta de Malakor' }
    },
    notes: [
      [['sfx', 'page'], ['note', 'Diario de Fray Osric · Folio I', 'Día tres. Los nombres de los muertos han sido raspados. Sin nombre, un muerto no descansa: obedece. Quien lo hizo conocía los ritos del Archivo.'],
        ['h', { hechicero: 'Los ritos del Archivo… Solo las hermanas los conocen.', any: 'Los ritos del Archivo. Solo las hermanas los conocen.' }],
        ['h2', { barbaro: 'Pues alguna hermana tiene malas costumbres.', elfa: 'Pues alguna de esas hermanas tiene malas costumbres.', any: 'Pues alguna hermana tiene malas costumbres.' }]],
      [['sfx', 'page'], ['note', 'Diario de Fray Osric · Folio II', 'Día nueve. Encontramos el Sello de Hueso intacto. La hermana Isolde dijo que estaba corrupto. A mí me pareció sano. Brillaba como una vela en una casa en paz.'],
        ['h', { amazona: 'Osric. Era capellán de una orden de paladines. Desapareció hace cinco inviernos.', any: 'Osric… Un capellán que bajó hace cinco inviernos y no volvió.' }]]
    ],
    chests: {
      0: [['give', 'tomasDagger'], ['music', 'silence'],
        ['n', 'Entre las ofrendas hay una daga con un nombre grabado en la empuñadura: TOMÁS.'],
        ['h', { any: 'Bajó con una partida del Archivo y nunca volvió. Su daga seguirá bajando con nosotros.' }],
        ['n', '(La Daga de Tomás va al arcón: +1 dado cuerpo a cuerpo para quien la lleve)'],
        ['wait', 400], ['sfx', 'doorSlam'], ['shake', 0.5],
        ['n', 'Las tapas de piedra de los sarcófagos se deslizan a la vez.'],
        ['spawn', 'skeleton', 'room', 2], ['music', 'combat']]
    },
    boss: {
      reveal: [
        ['music', 'boss'], ['stinger', 'boss'], ['camBoss'],
        ['n', 'Al fondo de la cripta, ante un altar de hueso, una figura alta alza los brazos. Todos los muertos de la sala giran la cabeza a la vez.'],
        ['malakor', 'Más corderos con faroles. ¿Cuántos rebaños me enviará todavía?'],
        ['h', { amazona: 'Malakor. Por los crímenes contra los muertos de Aldmere, hoy rindes cuentas.', barbaro: 'Mucho hablar para estar tan flaco.', any: 'Venimos por el sello, nigromante.' }],
        ['malakor', '¿Crímenes? Yo solo les doy trabajo. Fue otra quien les arrancó el nombre.'],
        ['malakor', '¡Levantaos!'], ['sfx', 'summon'], ['bossbar'],
        ['objective', 'Derrota a Malakor el Nigromante.']
      ],
      defeat: [
        ['malakor', 'Necios… el sello… no es lo que os han contado…'],
        ['wait', 500], ['music', 'silence'], ['camAltar'],
        ['isolde', 'Rápido, {lider}. Acerca el farol al sello.'],
        ['seal'],
        ['n', 'La luz del sello se curva hacia el farol como agua hacia un desagüe. Durante un instante, la cripta entera queda a oscuras.'],
        ['h', { any: 'Madre… el sello no se ha encendido. Se ha apagado.' }],
        ['isolde', 'Ha cedido su fuerza a la Llama. Así debe ser. Uno de tres, hijos míos. Descansad.']
      ]
    }
  },

  /* ============================ CAPÍTULO II ============================ */
  {
    id: 'c2', num: 'II', title: 'La Forja de Karak-Azkul', subtitle: 'El Sello de Fuego', theme: 'forge', ambient: 'forge',
    legend: { a: 'orc', b: 'goblin', c: 'shaman', d: 'berserker' }, bossType: 'ignis', lantern: '#ffd07a',
    locks: { '19,15': 'cerradura', '18,9': 'sello' },
    recommend: { heroes: ['enano', 'barbaro', 'elfa'], text: 'Una forja tomada por orcos y trasgos: el Torbellino del Bárbaro limpia grupos y la Elfa abate a los chamanes desde lejos. Thráin, el último forjamaestro, tiene algo que contarle a un enano.' },
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
      ['h', { enano: 'Karak-Azkul… La forja de mis abuelos, llena de orcos. Pagarán por cada piedra.', any: '¿Orcos? ¿Tan abajo?' }],
      ['isolde', 'Alguien les abrió el camino. Id.'],
      ['h2', { elfa: '«Alguien». Últimamente ese alguien abre muchas puertas.', barbaro: 'Me da igual quién les abriera. Yo les cierro.', any: '«Alguien». Últimamente ese alguien abre muchas puertas.' }],
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
        ['h', { elfa: 'Trasgos. Odio a los trasgos. Muerden los tobillos.', barbaro: 'Trasgos. Ni para calentar.', any: 'Trasgos. Rápidos y cobardes.' }]
      ] },
      '6': { name: 'Puente de Ceniza', reveal: [
        ['n', 'Un río de roca fundida corta la sala en dos. Solo un puente estrecho cruza al otro lado.'],
        ['h', { hechicero: 'Si alguien cae ahí, no quedará nada que enterrar.', any: 'Nadie se acerca al borde.' }]
      ] },
      '7': { name: 'Salón de los Martillos', reveal: [
        ['n', 'Columnas talladas con rostros de enanos. Todos tienen los ojos cerrados… salvo uno.']
      ], enter: [
        ['sfx', 'scare'], ['shake', 0.8],
        ['n', 'Algo cae desde lo alto de una columna.'],
        ['ambush', 2],
        ['spawn', 'berserker', 'near'], ['bark', 'enemy', '¡SANGRE!'], ['music', 'combat']
      ] },
      '8': { name: 'Tumba de Thráin', reveal: [
        ['n', 'Una tumba enana, intacta. Ni siquiera los orcos se han atrevido a entrar.'],
        ['npc', 'thrain', 'room'], ['music', 'silence'],
        ['thrain', 'Forasteros. Y con un farol del Archivo. Hacía siglos que no veía uno. La última vez fue el día que murió mi pueblo.'],
        ['h', { enano: '¡Thráin Yunquemayor! Mi abuelo cantaba tu nombre en las fiestas de la forja.', any: '¿Quién eres?' }],
        ['thrain', 'Thráin, último forjamaestro de Karak-Azkul. Guardián del Sello de Fuego, hasta que me lo arrebataron.'],
        ['thrain', 'Escuchadme bien. Los sellos no están corruptos. Nunca lo estuvieron. Son cerraduras, y los guardianes, sus llaves vivas.'],
        ['thrain', 'Hace siglos vino una mujer con un farol como ese. Prometió reavivar mi sello. Cuando lo acercó, mi pueblo ardió desde dentro.'],
        ['h', { hechicero: 'Eso no puede ser. Isolde no puede tener siglos.', any: 'Isolde no puede tener siglos.' }],
        ['thrain', 'La que lleva la luz no envejece. Solo cambia de nombre.'],
        ['lights', 'flicker'], ['sfx', 'dark'],
        ['isolde', 'Los espíritus enanos son rencorosos y tercos. Ignis espera. Terminad lo que empezasteis.'],
        ['thrain', 'Si debéis destruir al orco, hacedlo. Pero no le deis el fuego a la luz.'],
        ['choice', 'Thráin espera una respuesta.', [
          { label: 'Jurarle que el fuego no irá a la luz', desc: 'Una promesa ante un rey muerto.', steps: [
            ['thrain', 'Hacía siglos que no oía un juramento de verdad. Escuchad: el corazón de Ignis se enfría donde la runa del yunque está rota.'],
            ['flag', 'ignisWeak', true], ['give', 'blessing'], ['n', 'Donde estaba el espíritu queda un calor suave. (+2 PV a todos · Ignis tirará un dado de defensa menos)']] },
          { label: 'Hablarle en la lengua de la forja', req: ['enano'], reqText: 'Necesita al Enano', desc: 'Borin le habla como se habla a un rey enano.', steps: [
            ['h', { enano: 'Rey de la forja: devuélvenos el fuego y lo guardaremos como lo guardabais vosotros.' }],
            ['thrain', 'Un enano. Al fin. Toma lo que queda de mi tesoro y escucha: la runa rota del yunque es su punto débil.'],
            ['flag', 'ignisWeak', true], ['give', 'blessing'], ['give', 'thrainLoot'], ['n', '(+2 PV a todos · +40 de oro y un elixir · Ignis tirará un dado de defensa menos)']] },
          { label: 'Registrar la tumba mientras habla', desc: 'Nadie está mirando. Bueno, casi nadie.', steps: [
            ['n', 'Bajo la losa hay oro enano y un elixir.'], ['give', 'thrainLoot'],
            ['thrain', '…Ladrones. Ni muerto se respeta a un enano.'], ['n', 'Thráin se desvanece sin bendeciros. (+40 de oro y un elixir)']] }
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
        ['h', { any: 'Otra vez ella. Otra vez una puerta abierta.' }]],
      [['sfx', 'page'], ['note', 'Diario de Fray Osric · Folio IV', 'Día quince. Ya no la llamo hermana. He visto lo que hay dentro del farol cuando cree que nadie mira: un ojo. Un ojo que no es suyo.'],
        ['h', { any: '…' }], ['h2', { any: '¿Alguien ha visto algo raro en el farol?' }], ['n', 'Nadie contesta. Nadie quiere mirar.']]
    ],
    chests: {},
    boss: {
      reveal: [
        ['music', 'boss'], ['stinger', 'boss'], ['camBoss'], ['sfx', 'quake'], ['shake', 0.6],
        ['n', 'Un yunque del tamaño de una casa se alza entre lagos de magma. Encima, algo que una vez fue un orco se pone en pie. Su piel es roca. Su sangre, fuego.'],
        ['ignis', 'La mujer del farol dijo que vendríais. Dijo que me traeríais el último trozo de fuego que me falta.'],
        ['h', { any: '¿La mujer del farol? ¿Hablas de Isolde?' }],
        ['ignis', 'Hablo de la que me hizo esto. Y ahora… ¡ARDED!'], ['sfx', 'bossRoar'], ['bossbar'],
        ['objective', 'Derrota a Ignis. Cuidado con las erupciones marcadas en el suelo.']
      ],
      defeat: [
        ['ignis', 'Ella… también a mí… me prometió luz…'],
        ['wait', 500], ['music', 'silence'], ['camAltar'],
        ['isolde', 'El sello, {lider}. Ahora.'],
        ['h', { any: 'No. Esta vez no.' }],
        ['n', '{lider} no mueve el brazo. No hace falta. El farol tira hacia el sello como un perro de su correa.'],
        ['seal'], ['scare', 'eyes'], ['sfx', 'whisper', 1.4], ['voz', '«Gracias.»'],
        ['lantern', '#b07aff'],
        ['h', { any: '¿Lo habéis visto? Dentro del farol… algo me ha mirado.' }],
        ['isolde', 'Habéis visto la Llama. Es lo que hay al final de todas las cosas. Dos de tres.']
      ]
    }
  },

  /* ============================ CAPÍTULO III ============================ */
  {
    id: 'c3', num: 'III', title: 'El Ojo de Cristal', subtitle: 'El último sello', theme: 'void', ambient: 'void',
    legend: { a: 'voidAcolyte', b: 'wraith', c: 'golem', d: 'reflection' }, bossType: 'aethelgard', lantern: '#b07aff',
    locks: { '4,12': 'sello', '20,12': 'cerradura', '8,3': 'sello' },
    recommend: { heroes: ['enano', 'hechicero', 'amazona'], text: 'Espectros que el acero normal apenas toca y un gólem de cristal que se ríe de las flechas: martillos y magia. Sellos rúnicos por todas partes.' },
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
      ['h', { amazona: 'Así será, Madre.', any: 'Así será, Madre.' }],
      ['h2', { elfa: 'Mientes de maravilla.', barbaro: 'Mientes fatal, ¿lo sabías?', any: 'Mientes de maravilla.' }],
      ['hlast', 'Solo cuando importa.'],
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
        ['h', { barbaro: '¡Mi propio reflejo! Por fin un rival a mi altura.', any: '¡Nuestro propio reflejo!' }],
        ['fear', 'all', 1],
        ['h2', { elfa: 'Pues pégale fuerte. Siempre he querido hacerlo.', any: 'Pues pégale fuerte.' }], ['music', 'combat']
      ] },
      '5': { name: 'Biblioteca Ahogada', reveal: [
        ['n', 'Estanterías hundidas en cristal. Libros atrapados como insectos en ámbar.']
      ] },
      '6': { name: 'Galería de los Ecos', reveal: [
        ['n', 'Cada paso resuena tres veces. El tercero no es vuestro.'], ['sfx', 'whisper', 2]
      ] },
      '7': { name: 'Jardín de Cristal', reveal: [
        ['n', 'Cristales del tamaño de árboles. Uno de ellos se mueve.'],
        ['h', { enano: 'Un gólem. A esos se les rompe a martillazos, nada de flechitas.', hechicero: 'Es un gólem. Antiguo. Las flechas y la magia apenas le hacen nada.', any: 'Un gólem de cristal. Las flechas y la magia le hacen poco.' }]
      ] },
      '9': { name: 'Relicario', reveal: [
        ['n', 'Un relicario sellado por dentro. Quien lo cerró no quería salir.']
      ] },
      '8': { name: 'Santuario del Eco', reveal: [
        ['npc', 'tomas', 'room'], ['music', 'silence'],
        ['tomas', 'Llegasteis hasta el fondo. Pocos lo hacen.'],
        ['h', { any: 'Esta vez te escucharemos hasta el final.' }],
        ['tomas', 'Al final, ante el Ojo, ella os ofrecerá lo que más queréis. A mí me ofreció volver a casa.'],
        ['tomas', 'No aceptéis. Romped la luz.'],
        ['h2', { any: 'Te sacaremos de aquí, Tomás.' }],
        ['tomas', 'Ya lo habéis hecho. Me habéis escuchado.'],
        ['npcGone', 'tomas'], ['give', 'blessing2'],
        ['n', 'El eco de Tomás se deshace en luz. (Todos recuperan 3 PV)'],
        ['music', 'explore']
      ] },
      '0': { name: 'El Ojo' }
    },
    notes: [
      [['sfx', 'page'], ['note', 'Inscripción en el cristal', 'Lo que duerme no puede despertar solo. Necesita los ojos de otro para ver la salida, y las manos de un inocente para abrir la puerta.'],
        ['h', { hechicero: 'Los ojos de otro… Por eso lleva siempre la venda.', any: 'Los ojos de otro… Por eso Isolde lleva siempre la venda.' }]],
      [['sfx', 'page'], ['note', 'Diario de Fray Osric · Último folio', 'Si alguien lee esto: Isolde no es ciega. Ve a través de la llama. Y lo que mira desde dentro no es ella. No dejéis que el farol toque el Ojo.'],
        ['h', { any: 'Osric llegó hasta aquí. Solo.' }], ['h2', { any: 'Y nos dejó un aviso. Hagámosle caso.' }], ['flag', 'osricFolio', true]]
    ],
    chests: {},
    boss: {
      reveal: [
        ['music', 'boss'], ['stinger', 'boss'], ['camBoss'],
        ['n', 'En el corazón de la fortaleza, un ojo de cristal del tamaño de una puerta mira hacia el abismo. Ante él, un caballero hecho de luz fría alza su espada.'],
        ['aethelgard', 'Portadores de la luz. Habéis roto a dos de mis hermanos. No romperéis al tercero.'],
        ['h', { amazona: 'No venimos a romperlo, guardián. Venimos a…', any: 'No venimos a romperlo, guardián. Venimos a…' }],
        ['aethelgard', '¡Silencio! He oído esas palabras mil veces, siempre con la misma voz detrás.'],
        ['choice', 'Aethelgard alza la espada. Queda un instante antes del primer golpe.', [
          { label: 'Recitarle el aviso de Osric', req: 'osricFolio', reqText: 'Hay que haber leído el último folio de Osric', desc: '«No dejéis que el farol toque el Ojo.»', steps: [
            ['aethelgard', '…Osric. El único que bajó para avisarme. Entonces sabéis lo que lleváis.'], ['flag', 'aethDoubt', true],
            ['n', 'La luz del guardián vacila. (Empieza con 4 PV menos y pierde su primer turno)']] },
          { label: 'Bajar las armas y hablarle', desc: 'Le daréis el primer golpe gratis, pero quizá os escuche.', steps: [
            ['strike', 'lider', 4],
            ['aethelgard', '…No os defendéis. Ninguno de los que vino con ella bajó nunca las armas.'], ['flag', 'aethDoubt', true],
            ['n', 'La luz del guardián vacila. (Empieza con 4 PV menos y pierde su primer turno)']] },
          { label: 'Atacar sin palabras', desc: 'No hay tiempo para discursos.', steps: [['h', { barbaro: '¡Por fin!', any: 'Que así sea.' }]] }
        ]],
        ['isolde', 'Mátalo, {lider}. Hazlo y todo habrá terminado.'], ['bossbar'],
        ['objective', 'Derrota a Aethelgard. Puede aparecer de golpe junto a quien esté más débil.']
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
      ['n', 'El farol se suelta de la mano de {lider} y flota hacia el Ojo. Su llama se abre como una flor y de ella sale una figura vestida de blanco, con una venda sobre los ojos.'],
      ['isolde', 'Mil años esperando a que alguien bajara con un corazón lo bastante limpio para cargar mi luz. Gracias, {lider}. Has sido el mejor de mis hijos.'],
      ['h', { hechicero: 'Me enseñaste a leer las estrellas en el Archivo. Cada lección… ¿era para esto?', any: 'Nos usaste. Desde el primer escalón.' }],
      ['isolde', 'Os elegí con cariño. Una cosa no quita la otra.'],
      ['isolde', 'Dadme el farol. Dejad que el Ojo se abra y os daré lo que pidáis: gloria, oro, a los que perdisteis. Una madre que nunca vuelva a mentiros.'],
      ['n', 'La voz de Isolde se mete en cada cabeza a la vez. Es cálida. Es la voz de una madre.'],
      ['willTest'],
      ['choice', 'El farol late a vuestro alcance. ¿Qué hacéis?', [
        ['Romper el farol', '{lider} lo estrella contra el suelo. Isolde pierde parte de su poder.', [['flag', 'broke', true], ['sfx', 'glass'], ['shake', 1], ['scare'],
          ['h', { any: 'No, Madre. Esta vez el cuento lo terminamos nosotros.' }],
          ['isolde', '¡NO! ¿Qué habéis hecho, desagradecidos?']]],
        ['Entregar el farol', '{lider} duda… y lo tiende hacia ella. Isolde despierta con todo su poder.', [['flag', 'broke', false], ['sfx', 'summon'],
          ['h', { any: 'Yo… solo quería que dejara de doler.' }],
          ['h2', { any: '¡No!' }],
          ['isolde', 'Buen hijo. Ahora, mirad cómo se abre el mundo.']]]
      ]],
      ['spawnBoss', 'isolde'], ['music', 'boss'], ['bossbar'],
      ['objective', 'Derrota a Isolde, la Voz bajo la Piedra.']
    ],
    finalDefeat: [
      ['isolde', '{lider}… mi niño… está tan oscuro aquí abajo…'],
      ['h', { any: 'Lo sé, Madre. Por eso vamos a encender una luz.' }],
      ['music', 'silence'], ['wait', 600]
    ]
  }
];

const CAMPS = [
  {
    title: 'Rellano de la Escalera Vieja',
    steps: [
      ['n', 'En un rellano de la vieja escalera, a medio camino entre el mundo y la Hondura, encendéis un fuego.'],
      ['h', { barbaro: 'Buena pelea. Mañana, más.', amazona: 'Hoy hemos luchado bien. Mañana lo haremos mejor.', any: 'Hoy hemos salido vivos. No es poco.' }],
      ['h2', { elfa: 'Ese eco dijo que la luz miente. No dejo de pensarlo.', enano: 'Ese eco dijo que la luz miente. Y los enanos sabemos de luces que mienten.', any: 'Ese eco dijo que la luz miente.' }],
      ['h', { hechicero: 'Madre Isolde me admitió en el Archivo cuando nadie más lo hacía. No hay nadie en Aldmere más bondadoso.', any: 'Isolde nos eligió. ¿Por qué iba a mentirnos?' }],
      ['h2', { elfa: 'Nadie es bondadoso a tanta profundidad.', any: 'Nadie es bondadoso a tanta profundidad.' }],
      ['n', 'El farol, apartado sobre una piedra, pesa más que esta mañana.']
    ]
  },
  {
    title: 'Grieta del Último Calor',
    steps: [
      ['n', 'Nadie habla durante un largo rato. El fuego crepita. El farol late con una luz que ya no es del todo cálida.'],
      ['h', { any: 'Un ojo. Había un ojo dentro de esa cosa.' }],
      ['h2', { enano: 'Thráin dijo que los sellos son cerraduras. Si es verdad, llevamos dos noches abriendo puertas que debían seguir cerradas.', any: 'Si los sellos son cerraduras, llevamos dos noches abriendo puertas que debían seguir cerradas.' }],
      ['h', { hechicero: 'Me enseñó a leer, a tejer la magia… ¿para esto?', any: 'Nos eligió. Desde el principio. ¿Para esto?' }],
      ['h2', { amazona: 'Lo que ella planeara no nos define. Lo que hagamos mañana, sí.', any: 'Lo que ella planeara no nos define. Lo que hagamos mañana, sí.' }],
      ['h', { barbaro: 'Mañana bajamos al Ojo. Y el farol no toca ese sello. Yo me encargo.', any: 'Bajaremos al Ojo. Pero el farol no tocará el último sello.' }]
    ]
  }
];

const PROLOGUE = [
  'Durante mil años, la Llama Perenne ardió en la catedral de Aldmere.',
  'Bajo sus raíces duerme la Hondura: criptas, forjas y torres hundidas que nadie recuerda haber construido.',
  'Hace siete noches, la Llama se apagó.',
  'Desde entonces, los muertos llaman a las puertas. Y algo, muy abajo, ha empezado a respirar.',
  'Madre Isolde, la vidente ciega del Archivo, ha reunido a un puñado de héroes dispuestos a descender.'
];

const EPILOGUES = {
  broke: {
    title: 'La Llama Despierta',
    lines: [
      '{lider} apoyó las manos sobre el Ojo y lo empujó con todo lo que le quedaba. El cristal se cerró como un párpado.',
      'Arriba, en la catedral de Aldmere, la Llama Perenne volvió a arder sola, sin que nadie la encendiera.',
      'Tomás descansa por fin. Alguien bajó una última vez, solo, con una vela, y volvió al amanecer sin contar lo que dejó en su celda.',
      '{grupo}: sus nombres están escritos en el Archivo, al pie de la verdad. Es el primer texto de la Hondura que nadie ha raspado.'
    ]
  },
  gave: {
    title: 'El Nuevo Guardián',
    lines: [
      'Isolde cayó, pero el Ojo no se cerró del todo. Alguien tenía que quedarse a vigilarlo.',
      '{lider} se arrodilló ante el cristal y ocupó el lugar de Aethelgard. Dicen que ahora brilla con una luz fría.',
      'Los demás subieron sin su compañero. La Llama volvió a arder, más débil que antes.',
      'Los pedazos del farol descansan en una caja sin cerradura. Cada noche, alguien comprueba que siguen apagados.',
      'Algunas noches, los perros de Aldmere aún ladran hacia el suelo.'
    ]
  }
};

/* ============================ TUTORIAL ============================
   Sala de prácticas bajo la catedral: se juega con reglas de Relato,
   con el Bárbaro, la Elfa y el Hechicero, y no toca la partida guardada */
const TUTORIAL = {
  id: 'tut', num: '0', eyebrow: 'Tutorial guiado', title: 'La Sala de Armas', subtitle: 'Antes de descender', theme: 'crypt', ambient: 'crypt', tutorial: true,
  party: ['barbaro', 'elfa', 'hechicero'],
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
    ['barbaro', 'Antes de bajar a la Hondura quiero ver cómo os movéis. Tras esa puerta esperan unos esqueletos de prácticas.'],
    ['elfa', '¿Esqueletos de prácticas? Qué cosas guardáis en las catedrales.'],
    ['hechicero', 'Huesos y alambre con un hechizo menor. Pegan flojo… creo.'],
    ['objective', 'Tutorial: aprende a moverte, luchar y abrir puertas.']
  ],
  rooms: {
    '1': { name: 'Sala de armas' },
    '4': { name: 'Patio de prácticas', reveal: [['barbaro', 'Ahí los tenéis. Pegan flojo, pero pegan.'], ['objective', 'Derrota a los esqueletos de prácticas.']] },
    '5': { name: 'Armería', reveal: [['elfa', 'Un cofre. Ahora sí hablamos el mismo idioma.'], ['objective', 'Abre el cofre de la armería.']] }
  },
  notes: [
    [['sfx', 'page'], ['note', 'Reglamento de la Orden · Artículo III', 'Un guerrero no deja atrás a un hermano caído. Un explorador mira dónde pisa. Un mago no gasta su magia en vano. Y ninguno baja solo… salvo que no quede nadie más.'],
      ['barbaro', 'Leer no gasta la acción. Abajo, los escritos cuentan lo que nadie os dirá.']]
  ],
  chests: {
    0: [['n', 'Monedas viejas y provisiones: la Orden no deja bajar a nadie con las manos vacías.'], ['objective', 'Últimos consejos antes de bajar.']]
  }
};
