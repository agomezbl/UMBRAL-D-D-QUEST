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
  barbaro: { name: 'Korvak', title: L('Bárbaro', 'Barbare'), color: '#ff9a7a' },
  enano: { name: 'Borin', title: L('Enano', 'Nain'), color: '#f0b070' },
  elfa: { name: 'Lyriel', title: L('Elfa arquera', 'Elfe archère'), color: '#86e0a0' },
  hechicero: { name: 'Aldebrán', title: L('Hechicero', 'Enchanteur'), color: '#9fb8ff' },
  amazona: { name: 'Thalia', title: L('Amazona', 'Amazone'), color: '#ffd27a' },
  isolde: { name: L('Madre Isolde', 'Mère Isolde'), title: L('Vidente del Archivo', 'Voyante des Archives'), color: '#f0e4c8' },
  voz: { name: '…', title: L('Un susurro', 'Un murmure'), color: '#c08bff' },
  malakor: { name: 'Malakor', title: L('El Nigromante', 'Le Nécromancien'), color: '#7dffb0' },
  ignis: { name: 'Ignis', title: L('Señor del Magma', 'Seigneur du Magma'), color: '#ff9a5a' },
  aethelgard: { name: 'Aethelgard', title: L('Guardián del Ojo', "Gardien de l'Œil"), color: '#a8e0ff' },
  thrain: { name: 'Thráin', title: L('Último forjamaestro', 'Dernier maître-forgeron'), color: '#a8e8ff' },
  tomas: { name: 'Tomás', title: L('Novicio del Archivo', 'Novice des Archives'), color: '#cfe8ff' }
};

/* Los cinco héroes. Cada uno: un ataque básico, dos habilidades distintas y un rasgo */
const HERO_ROSTER = ['barbaro', 'enano', 'elfa', 'hechicero', 'amazona'];
const HERO_DEFS = {
  barbaro: { name: 'Korvak', full: L('Korvak de las Estepas', 'Korvak des Steppes'), role: L('Bárbaro', 'Barbare'), race: L('Humano del norte', 'Humain du Nord'), model: 'barbaro', color: '#e0583c',
    stats: { hp: 11, atk: 3, def: 2, mv: 6 }, dtype: 'phys',
    weapon: L('Hacha de guerra', 'Hache de guerre'), armor: L('Pieles', 'Fourrures'),
    blurb: L('El que más aguanta y más pega. Se mete en el centro de la pelea: cuanto más le rodean, mejor.', "Le plus solide et celui qui frappe le plus fort. Il fonce au cœur de la mêlée : plus on l'entoure, mieux il se porte."),
    trait: { name: L('Corazón ardiente', 'Cœur ardent'), desc: L('No conoce el miedo. Con la mitad de la vida o menos, ataca con un dado más.', "Il ne connaît pas la peur. À la moitié de sa vie ou moins, il attaque avec un dé de plus.") },
    traits: { fearless: true, rage: true },
    basic: { name: L('Hachazo', 'Coup de hache'), icon: 'axe' },
    skills: [
      { id: 'torbellino', name: L('Torbellino', 'Tourbillon'), icon: 'whirl', cd: 3, target: 'self', desc: L('Golpea a todos los enemigos que tenga al lado.', 'Frappe tous les ennemis à côté de lui.') },
      { id: 'grito', name: L('Grito de guerra', 'Cri de guerre'), icon: 'crown', cd: 4, target: 'self', desc: L('Asusta a los enemigos cercanos y recupera vida.', 'Effraie les ennemis proches et regagne de la vie.') }
    ] },
  enano: { name: 'Borin', full: L('Borin Yunquebarba', "Borin Barbe-d'Enclume"), role: L('Enano', 'Nain'), race: L('Enano de las montañas', 'Nain des montagnes'), model: 'enano', color: '#e8962f',
    stats: { hp: 10, atk: 2, def: 3, mv: 5 }, dtype: 'phys',
    weapon: L('Martillo de guerra', 'Marteau de guerre'), armor: L('Cota enana', 'Cotte naine'),
    blurb: L('El más duro. Lento, pero sus golpes atraviesan escudos y aguanta lo que le echen. Abre cerraduras y desarma trampas a la primera.', "Le plus coriace. Lent, mais ses coups traversent les boucliers et il encaisse tout. Il ouvre les serrures et désarme les pièges du premier coup."),
    trait: { name: L('Manos de herrero', 'Mains de forgeron'), desc: L('Sus golpes ignoran 1 escudo. Abre cerraduras y desarma trampas sin tirar dados.', 'Ses coups ignorent 1 bouclier. Il ouvre les serrures et désarme les pièges sans lancer de dés.') },
    traits: { shieldbreaker: 1, locksmith: true },
    basic: { name: L('Martillazo', 'Coup de marteau'), icon: 'hammer' },
    skills: [
      { id: 'sismico', name: L('Martillo sísmico', 'Marteau sismique'), icon: 'quake', cd: 3, target: 'enemy', range: 1, desc: L('Golpea y aturde a los enemigos de su alrededor.', 'Frappe et étourdit les ennemis autour de lui.') },
      { id: 'muralla', name: L('Muralla', 'Muraille'), icon: 'shield', cd: 3, target: 'self', desc: L('Se planta: +2 dados de defensa y los enemigos van a por él.', "Il se campe : +2 dés de défense, et les ennemis s'en prennent à lui.") }
    ] },
  elfa: { name: 'Lyriel', full: L('Lyriel de los Bosques Grises', 'Lyriel des Bois Gris'), role: L('Elfa arquera', 'Elfe archère'), race: L('Elfa', 'Elfe'), model: 'cazadora', color: '#3fbf6a',
    stats: { hp: 7, atk: 2, def: 2, mv: 7, range: 6, melee: 1 }, ranged: true, dtype: 'pierce', proj: 'arrow',
    weapon: L('Arco largo', 'Arc long'), armor: L('Cuero de ciervo', 'Cuir de cerf'),
    blurb: L('La más rápida y la que más lejos dispara. Ve las trampas antes de pisarlas. Frágil si la alcanzan.', "La plus rapide, et celle qui tire le plus loin. Elle voit les pièges avant de marcher dessus. Fragile si on l'atteint."),
    trait: { name: L('Ojo de elfa', "Œil d'elfe"), desc: L('Dispara a 6 casillas. Descubre las trampas a 2 casillas sin buscarlas.', 'Tire à 6 cases. Repère les pièges à 2 cases sans fouiller.') },
    traits: { trapSense: 2 },
    basic: { name: L('Flechazo', 'Flèche'), icon: 'bow' },
    skills: [
      { id: 'lluvia', name: L('Lluvia de flechas', 'Pluie de flèches'), icon: 'rain', cd: 3, target: 'area', range: 6, los: true, desc: L('Dispara al aire: 2 dados a cada enemigo de una zona de 3×3.', "Tire en l'air : 2 dés contre chaque ennemi d'une zone de 3×3.") },
      { id: 'salto', name: L('Salto élfico', 'Bond elfique'), icon: 'shadowstep', cd: 3, target: 'tile', range: 5, free: true, desc: L('Salta a una casilla libre a 5 casillas. No gasta la acción.', "Bondit sur une case libre à 5 cases. Ne coûte pas l'action.") }
    ] },
  hechicero: { name: 'Aldebrán', full: L('Aldebrán de la Torre de Ceniza', 'Aldebrán de la Tour de Cendre'), role: L('Hechicero', 'Enchanteur'), race: L('Humano', 'Humain'), model: 'hechicero', color: '#5a86ff',
    stats: { hp: 6, atk: 2, def: 2, mv: 5, range: 5, melee: 1 }, ranged: true, dtype: 'arcane', proj: 'bolt', magic: true,
    weapon: L('Saeta arcana', 'Trait arcanique'), armor: L('Túnica tejida', 'Tunique tissée'),
    blurb: L('Magia de fuego que arrasa grupos y una luz que cura. Muy frágil: que no le alcancen.', "Une magie de feu qui balaie les groupes et une lumière qui soigne. Très fragile : qu'on ne l'atteigne pas."),
    trait: { name: L('Arcano', 'Arcane'), desc: L('Sus ataques son mágicos: hieren de lleno a los espectros y los no muertos los temen. Abre los sellos rúnicos sin tirar dados.', 'Ses attaques sont magiques : elles frappent les spectres de plein fouet et les morts-vivants les craignent. Il ouvre les sceaux runiques sans lancer de dés.') },
    traits: { arcane: true, sealbreaker: true },
    basic: { name: L('Saeta arcana', 'Trait arcanique'), icon: 'bolt' },
    skills: [
      { id: 'bola', name: L('Bola de fuego', 'Boule de feu'), icon: 'starfire', cd: 3, target: 'enemy', range: 5, los: true, desc: L('3 dados al objetivo y 2 a los enemigos de su lado.', "3 dés contre la cible et 2 contre les ennemis à côté d'elle.") },
      { id: 'luz', name: L('Luz sanadora', 'Lumière guérisseuse'), icon: 'dawn', cd: 3, target: 'ally', range: 4, desc: L('Cura 3 PV a un aliado (o a sí mismo) o levanta a un caído.', 'Rend 3 PV à un allié (ou à lui-même) ou relève un héros à terre.') }
    ] },
  amazona: { name: 'Thalia', full: L('Thalia de las Islas del Sol', 'Thalia des Îles du Soleil'), role: L('Amazona', 'Amazone'), race: L('Humana', 'Humaine'), model: 'amazona', color: '#e8b33a',
    stats: { hp: 9, atk: 3, def: 2, mv: 6, range: 2 }, dtype: 'phys',
    weapon: L('Lanza', 'Lance'), armor: L('Peto de bronce', 'Plastron de bronze'),
    blurb: L('Guerrera veloz que ataca a dos casillas con su lanza y se lanza a la carga. Su grito empuja al grupo.', 'Guerrière rapide qui frappe à deux cases avec sa lance et se jette à la charge. Son cri entraîne le groupe.'),
    trait: { name: L('Alcance de lanza', 'Portée de lance'), desc: L('Ataca a enemigos a 2 casillas, aunque no estén pegados a ella.', "Elle attaque les ennemis à 2 cases, même s'ils ne sont pas collés à elle.") },
    traits: { reach: true },
    basic: { name: L('Lanzada', 'Coup de lance'), icon: 'target' },
    skills: [
      { id: 'carga', name: L('Carga', 'Charge'), icon: 'boot', cd: 3, target: 'enemy', range: 5, desc: L('Corre hasta un enemigo a 5 casillas y le golpea con un dado más.', "Court jusqu'à un ennemi à 5 cases et le frappe avec un dé de plus.") },
      { id: 'tribu', name: L('Grito de la tribu', 'Cri de la tribu'), icon: 'bell', cd: 4, target: 'self', desc: L('Ella y sus aliados a 3 casillas: +1 dado en su próximo ataque y +2 de movimiento.', 'Elle et ses alliés à 3 cases : +1 dé à leur prochaine attaque et +2 de déplacement.') }
    ] }
};

const ENEMY_TYPES = {
  skeleton: { name: L('Esqueleto', 'Squelette'), model: 'skeleton', role: 'bruto', iq: 1, hp: 2, atk: 3, def: 2, mv: 4, gold: 5, undead: true, weak: ['arcane'], immune: ['aterrado', 'envenenado'], traits: ['noMuerto', 'sinMiedo'], sfx: 'bone', deathCol: ['#f0e6cc', '#6a6050'] },
  archer: { name: L('Arquero esquelético', 'Archer squelette'), model: 'archer', role: 'tirador', iq: 2, hp: 2, atk: 2, def: 1, mv: 3, range: 5, ranged: true, proj: 'arrow', gold: 6, undead: true, weak: ['arcane'], immune: ['aterrado', 'envenenado'], traits: ['noMuerto', 'sinMiedo'], sfx: 'bone', deathCol: ['#f0e6cc', '#6a6050'] },
  ghoul: { name: L('Acechador de criptas', 'Rôdeur des cryptes'), model: 'ghoul', role: 'hostigador', iq: 2, hp: 3, atk: 3, def: 1, mv: 5, gold: 8, undead: true, weak: ['arcane'], immune: ['aterrado', 'envenenado'], onHit: { st: 'envenenado', dur: 2 }, traits: ['noMuerto', 'veneno'], deathCol: ['#b9c9a0', '#3a4a30'] },
  acolyte: { name: L('Acólito de la Voz', 'Acolyte de la Voix'), model: 'acolyte', role: 'lanzador', iq: 4, hp: 2, atk: 2, def: 2, mv: 4, range: 4, ranged: true, proj: 'necro', gold: 8, onHit: { st: 'aterrado', dur: 1 }, traits: ['lider', 'aterrador'], deathCol: ['#ff8a7a', '#4a0a0a'], barks: [L('Ella lo ve todo.', 'Elle voit tout.'), L('La luz miente…', 'La lumière ment…'), L('Arrodillaos ante el farol.', 'À genoux devant la lanterne.')] },
  orc: { name: L('Orco de la Mano Negra', 'Orque de la Main Noire'), model: 'orc', role: 'bruto', iq: 2, hp: 3, atk: 3, def: 2, mv: 5, gold: 8, traits: [], deathCol: ['#9ab060', '#2a3a10'], barks: [L('¡Intrusos!', 'Intrus !'), L('¡Aplastar!', 'Écraser !'), L('¡Por Ignis!', 'Pour Ignis !')] },
  goblin: { name: L('Trasgo', 'Gobelin'), model: 'goblin', role: 'hostigador', iq: 2, hp: 1, atk: 2, def: 1, mv: 7, gold: 4, traits: ['cobarde'], deathCol: ['#c0c060', '#3a3a10'], barks: [L('¡Hiii!', 'Hiii !'), L('¡Brillante, brillante!', 'Brillant, brillant !')] },
  shaman: { name: L('Chamán de ceniza', 'Chaman de cendre'), model: 'shaman', role: 'lanzador', iq: 4, hp: 3, atk: 3, def: 2, mv: 4, range: 4, ranged: true, proj: 'fire', gold: 10, healer: true, onHit: { st: 'ardiendo', dur: 2 }, traits: ['lider', 'sanador', 'incendiario'], deathCol: ['#ffb06a', '#3a1a0a'], barks: [L('¡El fuego me escucha!', "Le feu m'écoute !")] },
  berserker: { name: 'Berserker', model: 'berserker', role: 'bruto', iq: 1, hp: 4, atk: 4, def: 1, mv: 5, gold: 10, fury: true, immune: ['aterrado'], traits: ['furia', 'sinMiedo'], deathCol: ['#ffb060', '#5a2a0a'], barks: [L('¡FURIA!', 'FUREUR !'), L('¡Más, más!', 'Encore, encore !')] },
  voidAcolyte: { name: L('Acólito del Vacío', 'Acolyte du Vide'), model: 'voidAcolyte', role: 'lanzador', iq: 4, hp: 3, atk: 3, def: 2, mv: 4, range: 4, ranged: true, proj: 'void', gold: 9, onHit: { st: 'aterrado', dur: 1 }, traits: ['aterrador'], deathCol: ['#d8b8ff', '#2a0a4a'], barks: [L('El Ojo se abre.', "L'Œil s'ouvre."), L('Vuestra luz es nuestra.', 'Votre lumière est à nous.')] },
  wraith: { name: L('Espectro', 'Spectre'), model: 'wraith', role: 'espectro', iq: 3, hp: 3, atk: 3, def: 3, mv: 6, gold: 10, undead: true, flies: true, weak: ['arcane'], resistMundane: true, immune: ['aterrado', 'envenenado'], onHit: { st: 'aterrado', dur: 1 }, traits: ['noMuerto', 'incorporeo', 'aterrador', 'vuela'], deathCol: ['#e8ffff', '#3fb4c9'] },
  golem: { name: L('Gólem de cristal', 'Golem de cristal'), model: 'golem', role: 'coloso', iq: 1, hp: 6, atk: 4, def: 4, mv: 3, gold: 18, resist: ['pierce', 'arcane'], immune: ['aterrado', 'envenenado', 'ardiendo'], onHit: { st: 'aturdido', dur: 1, minDmg: 2 }, traits: ['cristal', 'aturdidor', 'sinMiedo'], deathCol: ['#e0ccff', '#5a2aaa'], sfx: 'glass' },
  reflection: { name: L('Reflejo', 'Reflet'), model: 'reflection', role: 'copia', iq: 3, hp: 3, atk: 3, def: 2, mv: 5, gold: 5, weak: ['arcane'], immune: ['aterrado', 'envenenado'], traits: ['sinMiedo'], deathCol: ['#d8d0ff', '#1a1430'], sfx: 'glass' },
  risen: { name: L('Huesos alzados', 'Ossements relevés'), model: 'skeleton', role: 'bruto', iq: 1, hp: 1, atk: 2, def: 1, mv: 4, gold: 0, undead: true, weak: ['arcane'], immune: ['aterrado', 'envenenado'], traits: ['noMuerto', 'sinMiedo'], sfx: 'bone', deathCol: ['#f0e6cc', '#6a6050'] },
  // prácticas (tutorial)
  dummy: { name: L('Esqueleto de prácticas', "Squelette d'entraînement"), model: 'skeleton', role: 'bruto', iq: 1, hp: 3, atk: 2, def: 1, mv: 3, gold: 2, undead: true, weak: ['arcane'], immune: ['aterrado', 'envenenado'], traits: ['noMuerto', 'sinMiedo'], sfx: 'bone', deathCol: ['#f0e6cc', '#6a6050'] },
  dummyArcher: { name: L('Arquero de prácticas', "Archer d'entraînement"), model: 'archer', role: 'tirador', iq: 1, hp: 2, atk: 2, def: 1, mv: 2, range: 4, ranged: true, proj: 'arrow', gold: 2, undead: true, weak: ['arcane'], immune: ['aterrado', 'envenenado'], traits: ['noMuerto', 'sinMiedo'], sfx: 'bone', deathCol: ['#f0e6cc', '#6a6050'] },
  // jefes
  malakor: { name: L('Malakor el Nigromante', 'Malakor le Nécromancien'), model: 'malakor', role: 'jefe', iq: 5, boss: true, hp: 9, atk: 3, def: 3, mv: 3, range: 5, ranged: true, proj: 'necro', gold: 60, undead: true, weak: ['arcane'], immune: ['aterrado', 'envenenado'], onHit: { st: 'aterrado', dur: 1 }, traits: ['noMuerto', 'aterrador', 'lider'], deathCol: ['#b9ffd8', '#0a3a20'] },
  ignis: { name: L('Ignis, Señor del Magma', 'Ignis, Seigneur du Magma'), model: 'ignis', role: 'jefe', iq: 4, boss: true, hp: 12, atk: 5, def: 3, mv: 3, gold: 50, resist: ['fire'], immune: ['aterrado', 'ardiendo', 'aturdido'], onHit: { st: 'ardiendo', dur: 2 }, traits: ['fuegoVivo', 'incendiario', 'lider'], deathCol: ['#ffd08a', '#ff3a10'] },
  aethelgard: { name: L('Aethelgard, Guardián del Ojo', "Aethelgard, Gardien de l'Œil"), model: 'aethelgard', role: 'jefe', iq: 5, boss: true, hp: 11, atk: 4, def: 5, mv: 4, gold: 80, undead: true, flies: true, weak: ['arcane'], immune: ['aterrado', 'envenenado'], traits: ['noMuerto', 'vuela', 'lider'], deathCol: ['#e8f7ff', '#4ab0ff'] },
  isolde: { name: L('Isolde, la Voz bajo la Piedra', 'Isolde, la Voix sous la Pierre'), model: 'isolde', role: 'jefe', iq: 5, boss: true, hp: 12, atk: 4, def: 3, mv: 0, range: 6, ranged: true, proj: 'void', gold: 0, flies: true, immune: ['aterrado', 'envenenado', 'aturdido'], onHit: { st: 'aterrado', dur: 1 }, traits: ['aterrador', 'lider', 'vuela'], deathCol: ['#ffffff', '#9d6bff'] }
};

const SHOP = [
  { id: 'potion', kind: 'item', name: L('Poción de curación', 'Potion de soin'), icon: 'potion', cost: 35, max: 6, desc: L('Cura 4 PV y el veneno. Beberla no gasta la acción (una por turno).', "Rend 4 PV et guérit le poison. La boire ne coûte pas l'action (une par tour).") },
  { id: 'elixir', kind: 'item', name: L('Elixir de ímpetu', "Élixir d'élan"), icon: 'elixir', cost: 45, max: 3, desc: L('Concede una acción extra este turno.', 'Donne une action de plus ce tour-ci.') },
  { id: 'bomb', kind: 'item', name: L('Bomba alquímica', 'Bombe alchimique'), icon: 'bomb', cost: 40, max: 4, desc: L('Se lanza a 4 casillas: 3 dados a todo lo que haya en un área de 3×3. ¡Ojo con los aliados!', 'Se lance à 4 cases : 3 dés contre tout ce qui se trouve dans une zone de 3×3. Attention aux alliés !') }
];

const BARKS = {
  barbaro: { kill: [L('¡Siguiente!', 'Au suivant !'), L('¡Ja! ¿Eso era todo?', "Ha ! C'est tout ?"), L('A la tierra contigo.', 'Mords la poussière.'), L('¡Más!', 'Encore !')], hurt: [L('Eso me ha despertado.', "Ça m'a réveillé."), L('¡Ahora sí estoy enfadado!', 'Là, je suis en colère !')], low: [L('Aún… respiro.', 'Je… respire encore.')], skill: [L('¡VENID A MÍ!', 'VENEZ À MOI !'), L('¡Fuerza y acero!', 'Force et acier !')], gold: [L('Oro. Bien.', "De l'or. Bien.")] },
  enano: { kill: [L('Al yunque contigo.', "Sur l'enclume, toi."), L('Hierro manda.', 'Le fer commande.'), L('Otro para la fragua.', 'Un de plus pour la forge.')], hurt: [L('¿Eso es todo?', "C'est tout ?"), L('Mi abuela pegaba más fuerte.', 'Ma grand-mère tapait plus fort.')], low: [L('Aún… me tengo en pie.', 'Je… tiens encore debout.')], skill: [L('¡Tierra, tiembla!', 'Terre, tremble !'), L('Que vengan.', "Qu'ils viennent.")], trap: [L('Trampa. Quietos todos.', 'Un piège. Personne ne bouge.'), L('Mal hecha, pero es una trampa.', "Mal fichu, mais c'est un piège.")], gold: [L('Oro enano. Lo reconozco.', "De l'or nain. Je le reconnais.")] },
  elfa: { kill: [L('Demasiado lento.', 'Trop lent.'), L('Una flecha, un enemigo.', 'Une flèche, un ennemi.'), L('Descansa.', 'Repose-toi.')], hurt: [L('¡Ah! Cerca, demasiado cerca.', 'Ah ! Trop près, bien trop près.'), L('Que no me alcancen.', "Qu'ils ne m'atteignent pas.")], low: [L('Necesito… distancia.', 'Il me faut… de la distance.')], skill: [L('Del cielo, como lluvia.', 'Du ciel, comme la pluie.'), L('Arriba.', 'Là-haut.')], trap: [L('Alto. Aquí hay algo.', "Halte. Il y a quelque chose ici."), L('Una trampa. La veo.', 'Un piège. Je le vois.')], gold: [L('Brilla bonito.', 'Ça brille joliment.')] },
  hechicero: { kill: [L('Que el fuego te lleve.', "Que le feu t'emporte."), L('Lección aprendida.', 'Leçon apprise.'), L('Polvo eres.', 'Retourne à la poussière.')], hurt: [L('¡Ah! No estoy hecho para esto.', 'Aïe ! Je ne suis pas fait pour ça.'), L('¡Cuidado conmigo!', 'Doucement avec moi !')], low: [L('Veo… puntos negros.', 'Je vois… des points noirs.')], heal: [L('Aguanta, ya te tengo.', 'Tiens bon, je suis là.'), L('Respira. Así.', 'Respire. Voilà.')], skill: [L('¡Arde!', 'Brûle !'), L('Estrellas, escuchadme.', 'Étoiles, écoutez-moi.')], gold: [L('Para tinta y libros.', "Pour l'encre et les livres.")] },
  amazona: { kill: [L('Por las Islas del Sol.', 'Pour les Îles du Soleil.'), L('¡Uno menos!', 'Un de moins !'), L('Cae, bestia.', 'À terre, bête.')], hurt: [L('¡Eso no te lo perdono!', 'Ça, tu vas le payer !'), L('Ni un paso atrás.', 'Pas un pas en arrière.')], low: [L('Mi madre… no se rendiría.', 'Ma mère… ne se rendrait pas.')], skill: [L('¡Conmigo, hermanos!', 'Avec moi, mes frères !'), L('¡A la carga!', 'À la charge !')], gold: [L('Para el templo.', 'Pour le temple.')] }
};

const HINTS = {
  move: L('Toca una casilla iluminada para mover al héroe activo. En ordenador, pasa el ratón para ver la ruta y haz clic.', 'Touche une case éclairée pour déplacer le héros actif. Sur ordinateur, survole avec la souris pour voir le trajet, puis clique.'),
  attack: L('Toca a un enemigo para atacarlo. Si no está a tu alcance pero puedes llegar, el héroe se acercará y golpeará.', "Touche un ennemi pour l'attaquer. S'il est hors de portée mais que tu peux l'atteindre, le héros s'approchera pour frapper."),
  door: L('Toca una puerta para abrirla. Las salas ocultas solo se revelan al cruzar su umbral.', "Touche une porte pour l'ouvrir. Les salles cachées ne se révèlent qu'au moment où tu franchis leur seuil."),
  turn: L('Cada héroe tiene movimiento y una acción por turno. Cuando todos terminen, actuará la Sombra.', "Chaque héros a un déplacement et une action par tour. Quand tous ont fini, c'est au tour de l'Ombre."),
  search: L('Buscar (lupa) revela las trampas de la sala y tira el Dado del Tesoro: oro, una poción, un objeto… nada, o peligro.', "Fouiller (loupe) révèle les pièges de la salle et lance le Dé du Trésor : de l'or, une potion, un objet… rien, ou un danger."),
  destiny: L('El dado dorado es el del Destino: acompaña a cada ataque de un héroe. Máscara alegre: un premio propio de tu héroe. Máscara triste: ruido, +1 Presagio. Cara lisa: nada.', "Le dé doré, c'est le Dé du Destin : il accompagne chaque attaque d'un héros. Masque joyeux : une récompense propre à ton héros. Masque triste : du bruit, +1 Présage. Face vierge : rien."),
  touch: L('En el móvil: arrastra con un dedo para mover la cámara, pellizca para acercar y gira con dos dedos.', 'Sur mobile : fais glisser un doigt pour déplacer la caméra, pince pour zoomer et tourne avec deux doigts.'),
  flank: L('Flanqueo: si otro héroe está junto a tu objetivo, atacas con un dado más.', 'Prise de flanc : si un autre héros est à côté de ta cible, tu attaques avec un dé de plus.'),
  lock: L('Puerta cerrada: forzarla gasta la acción y se tiran 3 dados; las calaveras se van sumando hasta abrirla. El Enano abre las cerraduras y el Hechicero los sellos sin tirar.', "Porte verrouillée : la forcer coûte l'action et lance 3 dés ; les crânes s'additionnent jusqu'à ce qu'elle cède. Le Nain ouvre les serrures et l'Enchanteur les sceaux sans lancer de dés."),
  doom: L('El Presagio crece cada ronda y con el ruido. Cuando se llena, algo errante sube de la Hondura a buscaros.', 'Le Présage grandit à chaque manche et avec le bruit. Quand il est plein, une créature errante monte des Tréfonds pour vous chercher.'),
  fear: L('Asustado: −1 dado de ataque hasta que se le pase. El Bárbaro no conoce el miedo.', "Effrayé : −1 dé d'attaque jusqu'à ce que ça passe. Le Barbare ne connaît pas la peur."),
  skill: L('Cada héroe tiene dos habilidades. Después de usarlas se recargan unas rondas: el número sobre el botón dice cuántas faltan.', 'Chaque héros a deux compétences. Une fois utilisées, elles se rechargent pendant quelques manches : le chiffre sur le bouton indique combien il en reste.')
};

const CHAPTERS = [
  /* ============================ CAPÍTULO I ============================ */
  {
    id: 'c1', num: 'I', title: L('Las Criptas de Malakor', 'Les Cryptes de Malakor'), subtitle: L('El Sello de Hueso', "Le Sceau d'Os"), theme: 'crypt', ambient: 'crypt',
    legend: { a: 'skeleton', b: 'archer', c: 'ghoul', d: 'acolyte' }, bossType: 'malakor', lantern: '#ffb45a',
    locks: { '10,11': 'sello', '17,11': 'cerradura' },
    recommend: { heroes: ['hechicero', 'amazona', 'barbaro'], text: L('Criptas llenas de no muertos: la magia del Hechicero les hace más daño y abre el sello rúnico sin tirar. La lanza de la Amazona mantiene a raya a los acechadores.', "Des cryptes pleines de morts-vivants : la magie de l'Enchanteur les frappe plus fort et ouvre le sceau runique sans lancer de dés. La lance de l'Amazone tient les rôdeurs à distance.") },
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
      ['n', L('La escalera termina en una antecámara helada. Arriba queda Aldmere, con su catedral a oscuras. Abajo, la Hondura.', "L'escalier s'achève sur une antichambre glacée. Là-haut, Aldmere et sa cathédrale plongée dans le noir. En bas, les Tréfonds.")],
      ['isolde', L('Oídme bien, hijos. Lleváis mi farol. Mientras arda, podré hablaros y ver lo que veis.', "Écoutez-moi bien, mes enfants. Vous portez ma lanterne. Tant qu'elle brûlera, je pourrai vous parler et voir ce que vous voyez.")],
      ['isolde', L('Tres sellos mantienen cerrada la Hondura: Hueso, Fuego y Cristal. Sus guardianes se han corrompido. Acercad el farol a cada sello y la Llama Perenne volverá a casa.', "Trois sceaux tiennent les Tréfonds fermés : l'Os, le Feu et le Cristal. Leurs gardiens se sont corrompus. Approchez la lanterne de chaque sceau, et la Flamme Éternelle rentrera chez elle.")],
      ['h', { amazona: L('Bajaremos, Madre. Y subiremos con la Llama o no subiremos.', 'Nous descendrons, Mère. Et nous remonterons avec la Flamme, ou nous ne remonterons pas.'), barbaro: L('Mientras haya algo a lo que pegar, por mí bien.', "Tant qu'il y a quelque chose à cogner, ça me va."), enano: L('Piedra vieja y mal trabajada. Ya me gusta poco.', 'De la vieille pierre, mal taillée. Ça commence mal.'), elfa: L('Huele a polvo de siglos. Y a algo más reciente.', 'Ça sent la poussière des siècles. Et quelque chose de plus récent.'), hechicero: L('El farol tiembla, Madre. ¿Es normal?', "La lanterne tremble, Mère. C'est normal ?") }],
      ['isolde', L('Tiembla porque tiene miedo. Igual que vosotros. Adelante.', "Elle tremble parce qu'elle a peur. Comme vous. En avant.")],
      ['objective', L('Encuentra el Sello de Hueso en la cripta de Malakor.', "Trouve le Sceau d'Os dans la crypte de Malakor.")],
      ['hint', 'move'], ['hint', 'touch']
    ],
    rooms: {
      '1': { style: 'pasillo', name: L('Antecámara', 'Antichambre') },
      '4': { style: 'nichos', name: L('Galería de los Nichos', 'Galerie des Niches'), reveal: [
        ['n', L('Nichos excavados en la roca, cientos, hasta donde alcanza la luz. En cada uno, un nombre borrado a cincel.', 'Des niches creusées dans la roche, des centaines, aussi loin que porte la lumière. Dans chacune, un nom effacé au burin.')],
        ['h', { elfa: L('Alguien ha raspado los nombres. Esto no es obra de saqueadores.', "Quelqu'un a gratté les noms. Ce n'est pas l'œuvre de pilleurs."), hechicero: L('Nombres raspados… Sin nombre, un muerto no descansa: obedece.', 'Des noms grattés… Sans nom, un mort ne repose pas : il obéit.'), any: L('Alguien ha raspado los nombres de los muertos.', "Quelqu'un a gratté les noms des morts.") }],
        ['sfx', 'bone'], ['bark', 'lider', L('¡En guardia!', 'En garde !')], ['hint', 'attack']
      ] },
      '5': { style: 'osario', name: L('Osario', 'Ossuaire'), reveal: [
        ['n', L('Huesos apilados en muros, en columnas, en bóvedas. Un osario sin fondo.', 'Des os empilés en murs, en colonnes, en voûtes. Un ossuaire sans fond.')]
      ], enter: [
        ['lights', 'out'], ['music', 'silence'], ['wait', 700], ['sfx', 'whisper', 2.4],
        ['voz', L('«…{lider}…»', '« …{lider}… »')], ['wait', 500],
        ['h', { any: L('¿Quién ha dicho mi nombre?', 'Qui a dit mon nom ?') }],
        ['fear', 'lider', 2],
        ['lights', 'on'], ['scare'], ['spawn', 'ghoul', 'near'], ['shake', 0.6],
        ['bark', 'lider', L('¡Detrás!', 'Derrière !')], ['music', 'combat']
      ] },
      '6': { style: 'capilla', name: L('Capilla de los Susurros', 'Chapelle des Murmures'), reveal: [
        ['n', L('Una capilla pequeña. Cuatro sarcófagos rodean un cofre sellado con cera negra.', 'Une petite chapelle. Quatre sarcophages entourent un coffre scellé de cire noire.')],
        ['h', { hechicero: L('Huele a incienso. Reciente.', "Ça sent l'encens. Récent."), any: L('Incienso. Alguien estuvo aquí hace poco.', "De l'encens. Quelqu'un est passé ici il y a peu.") }]
      ] },
      '7': { style: 'laboratorio', name: L('Pozo Necrótico', 'Puits nécrotique'), reveal: [
        ['n', L('Un pozo de miasma verde burbujea en el centro de la sala. Sobre las pasarelas, arqueros de hueso tensan cuerdas viejas.', "Un puits de miasmes verts bouillonne au centre de la salle. Sur les passerelles, des archers d'os tendent de vieilles cordes.")],
        ['h', { enano: L('No piséis eso verde. Ni lo miréis mucho rato.', 'Ne marchez pas dans ce truc vert. Et ne le regardez pas trop longtemps.'), hechicero: L('No toquéis ese líquido. Ni lo miréis demasiado rato.', 'Ne touchez pas ce liquide. Ne le regardez même pas trop longtemps.'), any: L('Lejos de ese pozo.', 'Loin de ce puits.') }]
      ] },
      '9': { style: 'tesoro', name: L('Cámara del Tesoro', 'Salle du Trésor'), reveal: [
        ['n', L('Monedas antiguas cubiertas de polvo. Demasiado fácil.', 'Des pièces anciennes couvertes de poussière. Trop facile.')],
        ['h', { elfa: L('Cuando algo parece demasiado fácil, mira dónde pisas.', 'Quand une chose paraît trop facile, regarde où tu mets les pieds.'), enano: L('Monedas sueltas en el suelo. O es un regalo o es una trampa.', "Des pièces qui traînent par terre. Soit c'est un cadeau, soit c'est un piège."), any: L('Cuidado. Esto huele a trampa.', 'Prudence. Ça sent le piège.') }], ['hint', 'search']
      ] },
      '8': { style: 'celdas', name: L('La Celda', 'La Cellule'), reveal: [
        ['n', L('Una celda estrecha. En la pared, cientos de rayas que cuentan días. Y un nombre grabado una y otra vez: TOMÁS.', 'Une cellule étroite. Au mur, des centaines de traits qui comptent les jours. Et un nom gravé encore et encore : TOMÁS.')],
        ['npc', 'tomas', 'room'], ['music', 'silence'], ['sfx', 'whisper', 1.5],
        ['tomas', L('Más portadores de farol. Llegáis tarde. O demasiado pronto.', "D'autres porteurs de lanterne. Vous arrivez trop tard. Ou bien trop tôt.")],
        ['h', { amazona: L('¿Quién eres, espíritu?', 'Qui es-tu, esprit ?'), any: L('¿Quién eres?', 'Qui es-tu ?') }],
        ['tomas', L('Tomás, novicio del Archivo. Bajamos a reavivar los sellos, como vosotros. Ella nos guiaba con su luz. Nos dijo que los guardianes estaban corruptos.', 'Tomás, novice des Archives. Nous sommes descendus raviver les sceaux, comme vous. Elle nous guidait de sa lumière. Elle nous a dit que les gardiens étaient corrompus.')],
        ['tomas', L('No lo estaban. Era mentira. Tened cuidado con la luz que…', "Ils ne l'étaient pas. C'était un mensonge. Méfiez-vous de la lumière qui…")],
        ['lights', 'flicker'], ['sfx', 'dark'],
        ['isolde', L('¡Basta! Es un eco. Los muertos de la Hondura imitan voces para atraeros. No le escuchéis.', "Assez ! Ce n'est qu'un écho. Les morts des Tréfonds imitent les voix pour vous attirer. Ne l'écoutez pas.")],
        ['choice', L('El eco de Tomás empieza a deshacerse. ¿Qué hacéis?', "L'écho de Tomás commence à se défaire. Que faites-vous ?"), [
          { label: L('Escucharle hasta el final', "L'écouter jusqu'au bout"), desc: L('Sostener el eco cuesta: quien lleva el farol pierde 2 PV.', "Retenir l'écho a un prix : le porteur de la lanterne perd 2 PV."), steps: [
            ['hurt', 'lider', 2],
            ['tomas', L('…La luz que lleváis no es suya. El Archivo nunca tuvo una vidente. Recordad su voz y no la escuchéis.', "…La lumière que vous portez n'est pas la sienne. Les Archives n'ont jamais eu de voyante. Souvenez-vous de sa voix, et ne l'écoutez pas.")],
            ['flag', 'tomasTruth', true],
            ['n', L('Ahora sabéis a quién no creer. (La voz de Isolde no os afectará al final y el enemigo final será más débil)', "Désormais, vous savez qui ne pas croire. (La voix d'Isolde ne vous atteindra pas à la fin, et l'ennemi final sera plus faible)")]] },
          { label: L('Dejarle descansar', 'Le laisser reposer'), desc: L('Nadie debería obligar a los muertos a hablar.', 'Personne ne devrait forcer les morts à parler.'), steps: [['h', { any: L('Descansa, Tomás.', 'Repose-toi, Tomás.') }]] }
        ]],
        ['npcGone', 'tomas'], ['wait', 600],
        ['h2', { hechicero: L('Madre Isolde nunca nos mentiría… ¿verdad?', "Mère Isolde ne nous mentirait jamais… n'est-ce pas ?"), amazona: L('Un eco no miente a propósito. Los vivos, sí.', 'Un écho ne ment pas exprès. Les vivants, si.'), barbaro: L('No me gustan los fantasmas. Pero ese parecía sincero.', "Je n'aime pas les fantômes. Mais celui-là avait l'air sincère."), any: L('Era una voz cansada. No una trampa.', "C'était une voix fatiguée. Pas un piège.") }],
        ['music', 'explore']
      ] },
      '0': { style: 'santuario', name: L('Cripta de Malakor', 'Crypte de Malakor') }
    },
    notes: [
      [['sfx', 'page'], ['note', L('Diario de Fray Osric · Folio I', 'Journal de Frère Osric · Folio I'), L('Día tres. Los nombres de los muertos han sido raspados. Sin nombre, un muerto no descansa: obedece. Quien lo hizo conocía los ritos del Archivo.', 'Jour trois. Les noms des morts ont été grattés. Sans nom, un mort ne repose pas : il obéit. Celui qui a fait cela connaissait les rites des Archives.')],
        ['h', { hechicero: L('Los ritos del Archivo… Solo las hermanas los conocen.', 'Les rites des Archives… Seules les sœurs les connaissent.'), any: L('Los ritos del Archivo. Solo las hermanas los conocen.', 'Les rites des Archives. Seules les sœurs les connaissent.') }],
        ['h2', { barbaro: L('Pues alguna hermana tiene malas costumbres.', "Alors l'une des sœurs a de mauvaises habitudes."), elfa: L('Pues alguna de esas hermanas tiene malas costumbres.', "Alors l'une de ces sœurs a de bien mauvaises habitudes."), any: L('Pues alguna hermana tiene malas costumbres.', "Alors l'une des sœurs a de mauvaises habitudes.") }]],
      [['sfx', 'page'], ['note', L('Diario de Fray Osric · Folio II', 'Journal de Frère Osric · Folio II'), L('Día nueve. Encontramos el Sello de Hueso intacto. La hermana Isolde dijo que estaba corrupto. A mí me pareció sano. Brillaba como una vela en una casa en paz.', "Jour neuf. Nous avons trouvé le Sceau d'Os intact. Sœur Isolde a dit qu'il était corrompu. Moi, je l'ai trouvé sain. Il brillait comme une bougie dans une maison en paix.")],
        ['h', { amazona: L('Osric. Era capellán de una orden de paladines. Desapareció hace cinco inviernos.', "Osric. Il était chapelain d'un ordre de paladins. Il a disparu il y a cinq hivers."), any: L('Osric… Un capellán que bajó hace cinco inviernos y no volvió.', "Osric… Un chapelain descendu il y a cinq hivers, et jamais revenu.") }]]
    ],
    chests: {
      0: [['give', 'tomasDagger'], ['music', 'silence'],
        ['n', L('Entre las ofrendas hay una daga con un nombre grabado en la empuñadura: TOMÁS.', 'Parmi les offrandes, une dague porte un nom gravé sur la poignée : TOMÁS.')],
        ['h', { any: L('Bajó con una partida del Archivo y nunca volvió. Su daga seguirá bajando con nosotros.', "Il est descendu avec une expédition des Archives et n'est jamais revenu. Sa dague continuera la descente avec nous.") }],
        ['n', L('(La Daga de Tomás va al arcón: +1 dado cuerpo a cuerpo para quien la lleve)', '(La Dague de Tomás va dans la malle : +1 dé au corps à corps pour qui la porte)')],
        ['wait', 400], ['sfx', 'doorSlam'], ['shake', 0.5],
        ['n', L('Las tapas de piedra de los sarcófagos se deslizan a la vez.', 'Les couvercles de pierre des sarcophages glissent tous en même temps.')],
        ['spawn', 'skeleton', 'room', 2], ['music', 'combat']]
    },
    boss: {
      reveal: [
        ['music', 'boss'], ['stinger', 'boss'], ['camBoss'],
        ['n', L('Al fondo de la cripta, ante un altar de hueso, una figura alta alza los brazos. Todos los muertos de la sala giran la cabeza a la vez.', "Au fond de la crypte, devant un autel d'os, une haute silhouette lève les bras. Tous les morts de la salle tournent la tête en même temps.")],
        ['malakor', L('Más corderos con faroles. ¿Cuántos rebaños me enviará todavía?', "Encore des agneaux avec des lanternes. Combien de troupeaux va-t-elle encore m'envoyer ?")],
        ['h', { amazona: L('Malakor. Por los crímenes contra los muertos de Aldmere, hoy rindes cuentas.', "Malakor. Pour tes crimes contre les morts d'Aldmere, aujourd'hui, tu rends des comptes."), barbaro: L('Mucho hablar para estar tan flaco.', 'Bien bavard, pour un type aussi maigre.'), any: L('Venimos por el sello, nigromante.', 'Nous venons pour le sceau, nécromancien.') }],
        ['malakor', L('¿Crímenes? Yo solo les doy trabajo. Fue otra quien les borró el nombre.', "Des crimes ? Moi, je leur donne du travail, c'est tout. C'est une autre qui a effacé leurs noms.")],
        ['malakor', L('¡Levantaos!', 'Levez-vous !')], ['sfx', 'summon'], ['bossbar'],
        ['objective', L('Derrota a Malakor el Nigromante.', 'Bats Malakor le Nécromancien.')]
      ],
      defeat: [
        ['malakor', L('Necios… el sello… no es lo que os han contado…', "Pauvres fous… le sceau… n'est pas ce qu'on vous a raconté…")],
        ['wait', 500], ['music', 'silence'], ['camAltar'],
        ['isolde', L('Rápido, {lider}. Acerca el farol al sello.', 'Vite, {lider}. Approche la lanterne du sceau.')],
        ['seal'],
        ['n', L('La luz del sello se curva hacia el farol como agua hacia un desagüe. Durante un instante, la cripta entera queda a oscuras.', "La lumière du sceau se courbe vers la lanterne comme l'eau vers une bonde. Pendant un instant, la crypte entière plonge dans le noir.")],
        ['h', { any: L('Madre… el sello no se ha encendido. Se ha apagado.', "Mère… le sceau ne s'est pas allumé. Il s'est éteint.") }],
        ['isolde', L('Ha cedido su fuerza a la Llama. Así debe ser. Uno de tres, hijos míos. Descansad.', 'Il a cédé sa force à la Flamme. Il doit en être ainsi. Un sur trois, mes enfants. Reposez-vous.')]
      ]
    }
  },

  /* ============================ CAPÍTULO II ============================ */
  {
    id: 'c2', num: 'II', title: L('La Forja de Karak-Azkul', 'La Forge de Karak-Azkul'), subtitle: L('El Sello de Fuego', 'Le Sceau de Feu'), theme: 'forge', ambient: 'forge',
    legend: { a: 'orc', b: 'goblin', c: 'shaman', d: 'berserker' }, bossType: 'ignis', lantern: '#ffd07a',
    locks: { '19,15': 'cerradura', '18,9': 'sello' },
    recommend: { heroes: ['enano', 'barbaro', 'elfa'], text: L('Una forja tomada por orcos y trasgos: el Torbellino del Bárbaro limpia grupos y la Elfa abate a los chamanes desde lejos. Thráin, el último forjamaestro, tiene algo que contarle a un enano.', "Une forge envahie d'orques et de gobelins : le Tourbillon du Barbare balaie les groupes et l'Elfe abat les chamans de loin. Thráin, le dernier maître-forgeron, a quelque chose à confier à un nain.") },
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
      ['n', L('Más abajo, el aire arde. Karak-Azkul fue una forja enana cuando el mundo era joven. Hoy los martillos los empuñan otras manos.', "Plus bas, l'air brûle. Karak-Azkul était une forge naine quand le monde était jeune. Aujourd'hui, ce sont d'autres mains qui tiennent les marteaux.")],
      ['isolde', L('El Sello de Fuego descansa sobre el Yunque Rúnico. Lo custodia Ignis, un caudillo orco que bebe del magma.', "Le Sceau de Feu repose sur l'Enclume runique. Il est gardé par Ignis, un chef de guerre orque qui boit le magma.")],
      ['h', { enano: L('Karak-Azkul… La forja de mis abuelos, llena de orcos. Pagarán por cada piedra.', "Karak-Azkul… La forge de mes ancêtres, pleine d'orques. Ils paieront pour chaque pierre."), any: L('¿Orcos? ¿Tan abajo?', 'Des orques ? Si profond ?') }],
      ['isolde', L('Alguien les abrió el camino. Id.', "Quelqu'un leur a ouvert le chemin. Allez.")],
      ['h2', { elfa: L('«Alguien». Últimamente ese alguien abre muchas puertas.', "« Quelqu'un ». Ces temps-ci, ce quelqu'un ouvre beaucoup de portes."), barbaro: L('Me da igual quién les abriera. Yo les cierro.', "Peu importe qui leur a ouvert. Moi, je leur ferme la porte au nez."), any: L('«Alguien». Últimamente ese alguien abre muchas puertas.', "« Quelqu'un ». Ces temps-ci, ce quelqu'un ouvre beaucoup de portes.") }],
      ['objective', L('Alcanza el Yunque Rúnico y derrota a Ignis.', "Atteins l'Enclume runique et bats Ignis.")]
    ],
    rooms: {
      '1': { style: 'armeria', name: L('La Gran Puerta', 'La Grande Porte') },
      '4': { style: 'barracon', name: L('Barracones', 'Baraquements'), reveal: [
        ['n', L('Jergones revueltos, restos de comida y un olor a establo. Los orcos no esperaban visita.', "Des paillasses en désordre, des restes de repas et une odeur d'écurie. Les orques n'attendaient pas de visite.")],
        ['bark', 'enemy', L('¡Intrusos!', 'Intrus !')]
      ] },
      '5': { style: 'fragua', name: L('Fundición', 'Fonderie'), reveal: [
        ['n', L('Moldes de piedra del tamaño de un hombre. De uno de ellos todavía gotea metal.', "Des moules de pierre de la taille d'un homme. De l'un d'eux goutte encore du métal.")],
        ['h', { elfa: L('Trasgos. Odio a los trasgos. Muerden los tobillos.', 'Des gobelins. Je déteste les gobelins. Ils mordent les chevilles.'), barbaro: L('Trasgos. Ni para calentar.', "Des gobelins. Même pas de quoi s'échauffer."), any: L('Trasgos. Rápidos y cobardes.', 'Des gobelins. Rapides et lâches.') }]
      ] },
      '6': { style: 'mina', name: L('Puente de Ceniza', 'Pont de Cendre'), reveal: [
        ['n', L('Un río de roca fundida corta la sala en dos. Solo un puente estrecho cruza al otro lado.', "Un fleuve de roche en fusion coupe la salle en deux. Seul un pont étroit mène de l'autre côté.")],
        ['h', { hechicero: L('Ese calor derrite el acero. Mejor no acercarse.', "Cette chaleur fait fondre l'acier. Mieux vaut ne pas s'approcher."), any: L('Nadie se acerca al borde.', "Personne ne s'approche du bord.") }]
      ] },
      '7': { style: 'salon', name: L('Salón de los Martillos', 'Salle des Marteaux'), reveal: [
        ['n', L('Columnas talladas con rostros de enanos. Todos tienen los ojos cerrados… salvo uno.', 'Des colonnes sculptées de visages de nains. Tous ont les yeux fermés… sauf un.')]
      ], enter: [
        ['sfx', 'scare'], ['shake', 0.8],
        ['n', L('Algo cae desde lo alto de una columna.', "Quelque chose tombe du haut d'une colonne.")],
        ['ambush', 2],
        ['spawn', 'berserker', 'near'], ['bark', 'enemy', L('¡FURIA!', 'FUREUR !')], ['music', 'combat']
      ] },
      '8': { style: 'tumba', name: L('Tumba de Thráin', 'Tombeau de Thráin'), reveal: [
        ['n', L('Una tumba enana, intacta. Ni siquiera los orcos se han atrevido a entrar.', "Un tombeau nain, intact. Même les orques n'ont pas osé y entrer.")],
        ['npc', 'thrain', 'room'], ['music', 'silence'],
        ['thrain', L('Forasteros. Y con un farol del Archivo. Hacía siglos que no veía uno. La última vez fue el día que cayó mi pueblo.', "Des étrangers. Et avec une lanterne des Archives. Il y avait des siècles que je n'en avais vu. La dernière fois, c'était le jour où mon peuple est tombé.")],
        ['h', { enano: L('¡Thráin Yunquemayor! Mi abuelo cantaba tu nombre en las fiestas de la forja.', 'Thráin Grande-Enclume ! Mon grand-père chantait votre nom aux fêtes de la forge.'), any: L('¿Quién eres?', 'Qui êtes-vous ?') }],
        ['thrain', L('Thráin, último forjamaestro de Karak-Azkul. Guardián del Sello de Fuego, hasta que me lo arrebataron.', "Thráin, dernier maître-forgeron de Karak-Azkul. Gardien du Sceau de Feu, jusqu'à ce qu'on me l'arrache.")],
        ['thrain', L('Escuchadme bien. Los sellos no están corruptos. Nunca lo estuvieron. Son cerraduras, y los guardianes, sus llaves vivas.', "Écoutez-moi bien. Les sceaux ne sont pas corrompus. Ils ne l'ont jamais été. Ce sont des serrures, et les gardiens en sont les clés vivantes.")],
        ['thrain', L('Hace siglos vino una mujer con un farol como ese. Prometió reavivar mi sello. Cuando lo acercó, la forja se apagó y mi pueblo tuvo que huir de la montaña.', "Il y a des siècles, une femme est venue avec une lanterne comme celle-ci. Elle a promis de raviver mon sceau. Quand elle l'a approchée, la forge s'est éteinte et mon peuple a dû fuir la montagne.")],
        ['h', { hechicero: L('Eso no puede ser. Isolde no puede tener siglos.', "C'est impossible. Isolde ne peut pas avoir des siècles."), any: L('Isolde no puede tener siglos.', 'Isolde ne peut pas avoir des siècles.') }],
        ['thrain', L('La que lleva la luz no envejece. Solo cambia de nombre.', 'Celle qui porte la lumière ne vieillit pas. Elle change seulement de nom.')],
        ['lights', 'flicker'], ['sfx', 'dark'],
        ['isolde', L('Los espíritus enanos son rencorosos y tercos. Ignis espera. Terminad lo que empezasteis.', 'Les esprits nains sont rancuniers et têtus. Ignis attend. Terminez ce que vous avez commencé.')],
        ['thrain', L('Si debéis destruir al orco, hacedlo. Pero no le deis el fuego a la luz.', "S'il vous faut détruire l'orque, faites-le. Mais ne donnez pas le feu à la lumière.")],
        ['choice', L('Thráin espera una respuesta.', 'Thráin attend une réponse.'), [
          { label: L('Jurarle que el fuego no irá a la luz', "Jurer que le feu n'ira pas à la lumière"), desc: L('Una promesa ante un rey muerto.', 'Une promesse devant un roi défunt.'), steps: [
            ['thrain', L('Hacía siglos que no oía un juramento de verdad. Escuchad: el corazón de Ignis se enfría donde la runa del yunque está rota.', "Il y avait des siècles que je n'avais entendu un vrai serment. Écoutez : le cœur d'Ignis refroidit là où la rune de l'enclume est brisée.")],
            ['flag', 'ignisWeak', true], ['give', 'blessing'], ['n', L('Donde estaba el espíritu queda un calor suave. (+2 PV a todos · Ignis tirará un dado de defensa menos)', "Là où se tenait l'esprit, il reste une douce chaleur. (+2 PV pour tous · Ignis lancera un dé de défense de moins)")]] },
          { label: L('Hablarle en la lengua de la forja', 'Lui parler la langue de la forge'), req: ['enano'], reqText: L('Necesita al Enano', 'Il faut le Nain'), desc: L('Borin le habla como se habla a un rey enano.', 'Borin lui parle comme on parle à un roi nain.'), steps: [
            ['h', { enano: L('Rey de la forja: devuélvenos el fuego y lo guardaremos como lo guardabais vosotros.', 'Roi de la forge : rendez-nous le feu, et nous le garderons comme vous le gardiez.') }],
            ['thrain', L('Un enano. Al fin. Toma lo que queda de mi tesoro y escucha: la runa rota del yunque es su punto débil.', "Un nain. Enfin. Prends ce qui reste de mon trésor, et écoute : la rune brisée de l'enclume est son point faible.")],
            ['flag', 'ignisWeak', true], ['give', 'blessing'], ['give', 'thrainLoot'], ['n', L('(+2 PV a todos · +40 de oro y un elixir · Ignis tirará un dado de defensa menos)', "(+2 PV pour tous · +40 d'or et un élixir · Ignis lancera un dé de défense de moins)")]] },
          { label: L('Registrar la tumba mientras habla', "Fouiller le tombeau pendant qu'il parle"), desc: L('Nadie está mirando. Bueno, casi nadie.', 'Personne ne regarde. Enfin, presque personne.'), steps: [
            ['n', L('Bajo la losa hay oro enano y un elixir.', "Sous la dalle, il y a de l'or nain et un élixir.")], ['give', 'thrainLoot'],
            ['thrain', L('…Ladrones. Ni en su tumba se respeta a un enano.', '…Des voleurs. Même dans sa tombe, on ne respecte pas un nain.')], ['n', L('Thráin se desvanece sin bendeciros. (+40 de oro y un elixir)', "Thráin s'efface sans vous bénir. (+40 d'or et un élixir)")]] }
        ]],
        ['npcGone', 'thrain'],
        ['music', 'explore']
      ] },
      '9': { style: 'tesoro', name: L('Cámara de Lingotes', 'Salle des Lingots'), reveal: [
        ['n', L('Lingotes enanos apilados con cuidado. Los orcos no saben contar, pero saben esconder.', 'Des lingots nains empilés avec soin. Les orques ne savent pas compter, mais ils savent cacher.')]
      ] },
      'R': { style: 'fragua', name: L('Canal de Escoria', 'Canal de Scories') },
      '0': { style: 'santuario', name: L('El Yunque Rúnico', "L'Enclume runique") }
    },
    notes: [
      [['sfx', 'page'], ['note', L('Diario de Fray Osric · Folio III', 'Journal de Frère Osric · Folio III'), L('Día doce. Bajamos a la forja. Isolde acercó el farol al Sello de Fuego. Los orcos llegaron esa misma noche, como si alguien les hubiera abierto una puerta.', "Jour douze. Nous sommes descendus à la forge. Isolde a approché la lanterne du Sceau de Feu. Les orques sont arrivés la nuit même, comme si quelqu'un leur avait ouvert une porte.")],
        ['h', { any: L('Otra vez ella. Otra vez una puerta abierta.', 'Encore elle. Encore une porte ouverte.') }]],
      [['sfx', 'page'], ['note', L('Diario de Fray Osric · Folio IV', 'Journal de Frère Osric · Folio IV'), L('Día quince. Ya no la llamo hermana. He visto lo que hay dentro del farol cuando cree que nadie mira: un ojo. Un ojo que no es suyo.', "Jour quinze. Je ne l'appelle plus sœur. J'ai vu ce qu'il y a dans la lanterne quand elle croit que personne ne regarde : un œil. Un œil qui n'est pas le sien.")],
        ['h', { any: '…' }], ['h2', { any: L('¿Alguien ha visto algo raro en el farol?', "Quelqu'un a vu quelque chose de bizarre dans la lanterne ?") }], ['n', L('Nadie contesta. Nadie quiere mirar.', 'Personne ne répond. Personne ne veut regarder.')]]
    ],
    chests: {},
    boss: {
      reveal: [
        ['music', 'boss'], ['stinger', 'boss'], ['camBoss'], ['sfx', 'quake'], ['shake', 0.6],
        ['n', L('Un yunque del tamaño de una casa se alza entre lagos de magma. Encima, algo que una vez fue un orco se pone en pie. Su piel es roca. Por dentro arde como una fragua.', "Une enclume grande comme une maison se dresse entre des lacs de magma. Dessus, quelque chose qui fut autrefois un orque se lève. Sa peau est de roche. Au-dedans, il brûle comme une forge.")],
        ['ignis', L('La mujer del farol dijo que vendríais. Dijo que me traeríais el último trozo de fuego que me falta.', "La femme à la lanterne a dit que vous viendriez. Elle a dit que vous m'apporteriez le dernier morceau de feu qui me manque.")],
        ['h', { any: L('¿La mujer del farol? ¿Hablas de Isolde?', "La femme à la lanterne ? Tu parles d'Isolde ?") }],
        ['ignis', L('Hablo de la que me hizo esto. Y ahora… ¡ARDED!', "Je parle de celle qui m'a fait ça. Et maintenant… BRÛLEZ !")], ['sfx', 'bossRoar'], ['bossbar'],
        ['objective', L('Derrota a Ignis. Cuidado con las erupciones marcadas en el suelo.', 'Bats Ignis. Attention aux éruptions marquées au sol.')]
      ],
      defeat: [
        ['ignis', L('Ella… también a mí… me prometió luz…', "Elle… à moi aussi… elle m'avait promis la lumière…")],
        ['wait', 500], ['music', 'silence'], ['camAltar'],
        ['isolde', L('El sello, {lider}. Ahora.', 'Le sceau, {lider}. Maintenant.')],
        ['h', { any: L('No. Esta vez no.', 'Non. Pas cette fois.') }],
        ['n', L('{lider} no mueve el brazo. No hace falta. El farol tira hacia el sello como un perro de su correa.', '{lider} ne bouge pas le bras. Inutile. La lanterne tire vers le sceau comme un chien sur sa laisse.')],
        ['seal'], ['scare', 'eyes'], ['sfx', 'whisper', 1.4], ['voz', L('«Gracias.»', '« Merci. »')],
        ['lantern', '#b07aff'],
        ['h', { any: L('¿Lo habéis visto? Dentro del farol… algo me ha mirado.', "Vous l'avez vu ? Dans la lanterne… quelque chose m'a regardé.") }],
        ['isolde', L('Habéis visto la Llama. Es lo que hay al final de todas las cosas. Dos de tres.', "Vous avez vu la Flamme. C'est ce qui se trouve au bout de toute chose. Deux sur trois.")]
      ]
    }
  },

  /* ============================ CAPÍTULO III ============================ */
  {
    id: 'c3', num: 'III', title: L('El Ojo de Cristal', "L'Œil de Cristal"), subtitle: L('El último sello', 'Le dernier sceau'), theme: 'void', ambient: 'void',
    legend: { a: 'voidAcolyte', b: 'wraith', c: 'golem', d: 'reflection' }, bossType: 'aethelgard', lantern: '#b07aff',
    locks: { '4,12': 'sello', '20,12': 'cerradura', '8,3': 'sello' },
    recommend: { heroes: ['enano', 'hechicero', 'amazona'], text: L('Espectros que el acero normal apenas toca y un gólem de cristal que se ríe de las flechas: martillos y magia. Sellos rúnicos por todas partes.', "Des spectres que l'acier ordinaire effleure à peine et un golem de cristal qui se moque des flèches : marteaux et magie. Des sceaux runiques partout.") },
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
      ['n', L('El fondo de la Hondura no es oscuro. Brilla. Una fortaleza de cristal violeta crece del abismo, y en su centro late algo enorme: el Ojo.', "Le fond des Tréfonds n'est pas obscur. Il brille. Une forteresse de cristal violet s'élève de l'abîme, et en son centre bat quelque chose d'immense : l'Œil.")],
      ['isolde', L('Ya casi estáis. El último sello lo guarda Aethelgard, el más terco de los guardianes. Destruidle y todo habrá terminado.', 'Vous y êtes presque. Le dernier sceau est gardé par Aethelgard, le plus têtu des gardiens. Détruisez-le, et tout sera terminé.')],
      ['h', { amazona: L('Así será, Madre.', 'Il en sera ainsi, Mère.'), any: L('Así será, Madre.', 'Il en sera ainsi, Mère.') }],
      ['h2', { elfa: L('Mientes de maravilla.', 'Tu mens à merveille.'), barbaro: L('Mientes fatal, ¿lo sabías?', 'Tu mens très mal, tu le sais ?'), any: L('Mientes de maravilla.', 'Tu mens à merveille.') }],
      ['hlast', L('Solo cuando importa.', 'Seulement quand ça compte.')],
      ['objective', L('Llega al Ojo de Cristal.', "Atteins l'Œil de Cristal.")]
    ],
    rooms: {
      '1': { style: 'pasillo', name: L('Escalinata del Abismo', "Escalier de l'Abîme") },
      '4': { style: 'espejos', name: L('Vestíbulo de los Espejos', 'Vestibule des Miroirs'), reveal: [
        ['n', L('Espejos de marco dorado cubren las paredes. Vuestros reflejos tardan un instante en seguiros.', 'Des miroirs aux cadres dorés couvrent les murs. Vos reflets mettent un instant à vous suivre.')]
      ], enter: [
        ['sfx', 'glass'], ['shake', 0.5], ['scare'],
        ['n', L('Uno de los reflejos no se detiene cuando os detenéis. Sale del espejo.', "L'un des reflets ne s'arrête pas quand vous vous arrêtez. Il sort du miroir.")],
        ['spawn', 'reflection', 'near'],
        ['h', { barbaro: L('¡Mi propio reflejo! Por fin un rival a mi altura.', 'Mon propre reflet ! Enfin un adversaire à ma hauteur.'), any: L('¡Nuestro propio reflejo!', 'Notre propre reflet !') }],
        ['fear', 'all', 1],
        ['h2', { elfa: L('Pues pégale fuerte. Siempre he querido hacerlo.', "Alors frappe fort. J'en ai toujours rêvé."), any: L('Pues pégale fuerte.', 'Alors frappe fort.') }], ['music', 'combat']
      ] },
      '5': { style: 'biblioteca', name: L('Biblioteca Ahogada', 'Bibliothèque noyée'), reveal: [
        ['n', L('Estanterías hundidas en cristal. Libros atrapados como insectos en ámbar.', "Des étagères englouties dans le cristal. Des livres pris comme des insectes dans l'ambre.")]
      ] },
      '6': { style: 'observatorio', name: L('Galería de los Ecos', 'Galerie des Échos'), reveal: [
        ['n', L('Cada paso resuena tres veces. El tercero no es vuestro.', "Chaque pas résonne trois fois. Le troisième n'est pas le vôtre.")], ['sfx', 'whisper', 2]
      ] },
      '7': { style: 'jardin', name: L('Jardín de Cristal', 'Jardin de Cristal'), reveal: [
        ['n', L('Cristales del tamaño de árboles. Uno de ellos se mueve.', "Des cristaux grands comme des arbres. L'un d'eux bouge.")],
        ['h', { enano: L('Un gólem. A esos se les rompe a martillazos, nada de flechitas.', 'Un golem. Ça se casse à coups de marteau, pas avec des petites flèches.'), hechicero: L('Es un gólem. Antiguo. Las flechas y la magia apenas le hacen nada.', 'Un golem. Très ancien. Les flèches et la magie ne lui font presque rien.'), any: L('Un gólem de cristal. Las flechas y la magia le hacen poco.', 'Un golem de cristal. Les flèches et la magie ne lui font pas grand-chose.') }]
      ] },
      '9': { style: 'tesoro', name: L('Relicario', 'Reliquaire'), reveal: [
        ['n', L('Un relicario sellado por dentro. Quien lo cerró no quería salir.', "Un reliquaire scellé de l'intérieur. Celui qui l'a fermé ne voulait pas sortir.")]
      ] },
      '8': { style: 'laboratorio', name: L('Santuario del Eco', "Sanctuaire de l'Écho"), reveal: [
        ['npc', 'tomas', 'room'], ['music', 'silence'],
        ['tomas', L('Llegasteis hasta el fondo. Pocos lo hacen.', "Vous êtes arrivés jusqu'au fond. Bien peu y parviennent.")],
        ['h', { any: L('Esta vez te escucharemos hasta el final.', "Cette fois, nous t'écouterons jusqu'au bout.") }],
        ['tomas', L('Al final, ante el Ojo, ella os ofrecerá lo que más queréis. A mí me ofreció volver a casa.', "À la fin, devant l'Œil, elle vous offrira ce que vous désirez le plus. À moi, elle a offert de rentrer à la maison.")],
        ['tomas', L('No aceptéis. Romped la luz.', "N'acceptez pas. Brisez la lumière.")],
        ['h2', { any: L('Te sacaremos de aquí, Tomás.', "Nous te sortirons d'ici, Tomás.") }],
        ['tomas', L('Ya lo habéis hecho. Me habéis escuchado.', "C'est déjà fait. Vous m'avez écouté.")],
        ['npcGone', 'tomas'], ['give', 'blessing2'],
        ['n', L('El eco de Tomás se deshace en luz. (Todos recuperan 3 PV)', "L'écho de Tomás se dissout en lumière. (Tout le monde récupère 3 PV)")],
        ['music', 'explore']
      ] },
      '0': { style: 'santuario', name: L('El Ojo', "L'Œil") }
    },
    notes: [
      [['sfx', 'page'], ['note', L('Inscripción en el cristal', 'Inscription dans le cristal'), L('Lo que duerme no puede despertar solo. Necesita los ojos de otro para ver la salida, y las manos de un inocente para abrir la puerta.', "Ce qui dort ne peut s'éveiller seul. Il lui faut les yeux d'un autre pour voir la sortie, et les mains d'un innocent pour ouvrir la porte.")],
        ['h', { hechicero: L('Los ojos de otro… Por eso lleva siempre la venda.', "Les yeux d'un autre… Voilà pourquoi elle porte toujours ce bandeau."), any: L('Los ojos de otro… Por eso Isolde lleva siempre la venda.', "Les yeux d'un autre… Voilà pourquoi Isolde porte toujours un bandeau.") }]],
      [['sfx', 'page'], ['note', L('Diario de Fray Osric · Último folio', 'Journal de Frère Osric · Dernier folio'), L('Si alguien lee esto: Isolde no es ciega. Ve a través de la llama. Y lo que mira desde dentro no es ella. No dejéis que el farol toque el Ojo.', "Si quelqu'un lit ceci : Isolde n'est pas aveugle. Elle voit à travers la flamme. Et ce qui regarde de l'intérieur, ce n'est pas elle. Ne laissez pas la lanterne toucher l'Œil.")],
        ['h', { any: L('Osric llegó hasta aquí. Solo.', "Osric est arrivé jusqu'ici. Seul.") }], ['h2', { any: L('Y nos dejó un aviso. Hagámosle caso.', 'Et il nous a laissé un avertissement. Écoutons-le.') }], ['flag', 'osricFolio', true]]
    ],
    chests: {},
    boss: {
      reveal: [
        ['music', 'boss'], ['stinger', 'boss'], ['camBoss'],
        ['n', L('En el corazón de la fortaleza, un ojo de cristal del tamaño de una puerta mira hacia el abismo. Ante él, un caballero hecho de luz fría alza su espada.', "Au cœur de la forteresse, un œil de cristal grand comme une porte fixe l'abîme. Devant lui, un chevalier fait de lumière froide lève son épée.")],
        ['aethelgard', L('Portadores de la luz. Habéis roto a dos de mis hermanos. No romperéis al tercero.', 'Porteurs de lumière. Vous avez brisé deux de mes frères. Vous ne briserez pas le troisième.')],
        ['h', { amazona: L('No venimos a romperlo, guardián. Venimos a…', 'Nous ne venons pas le briser, gardien. Nous venons…'), any: L('No venimos a romperlo, guardián. Venimos a…', 'Nous ne venons pas le briser, gardien. Nous venons…') }],
        ['aethelgard', L('¡Silencio! He oído esas palabras mil veces, siempre con la misma voz detrás.', "Silence ! J'ai entendu ces mots mille fois, toujours avec la même voix derrière.")],
        ['choice', L('Aethelgard alza la espada. Queda un instante antes del primer golpe.', 'Aethelgard lève son épée. Il reste un instant avant le premier coup.'), [
          { label: L('Recitarle el aviso de Osric', "Lui réciter l'avertissement d'Osric"), req: 'osricFolio', reqText: L('Hay que haber leído el último folio de Osric', "Il faut avoir lu le dernier folio d'Osric"), desc: L('«No dejéis que el farol toque el Ojo.»', "« Ne laissez pas la lanterne toucher l'Œil. »"), steps: [
            ['aethelgard', L('…Osric. El único que bajó para avisarme. Entonces sabéis lo que lleváis.', '…Osric. Le seul qui soit descendu pour me prévenir. Alors vous savez ce que vous portez.')], ['flag', 'aethDoubt', true],
            ['n', L('La luz del guardián vacila. (Empieza con 4 PV menos y pierde su primer turno)', 'La lumière du gardien vacille. (Il commence avec 4 PV de moins et perd son premier tour)')]] },
          { label: L('Bajar las armas y hablarle', 'Baisser les armes et lui parler'), desc: L('Le daréis el primer golpe gratis, pero quizá os escuche.', 'Vous lui laisserez le premier coup, mais il vous écoutera peut-être.'), steps: [
            ['strike', 'lider', 4],
            ['aethelgard', L('…No os defendéis. Ninguno de los que vino con ella bajó nunca las armas.', "…Vous ne vous défendez pas. Aucun de ceux qui sont venus avec elle n'a jamais baissé les armes.")], ['flag', 'aethDoubt', true],
            ['n', L('La luz del guardián vacila. (Empieza con 4 PV menos y pierde su primer turno)', 'La lumière du gardien vacille. (Il commence avec 4 PV de moins et perd son premier tour)')]] },
          { label: L('Atacar sin palabras', 'Attaquer sans un mot'), desc: L('No hay tiempo para discursos.', 'Pas le temps pour les discours.'), steps: [['h', { barbaro: L('¡Por fin!', 'Enfin !'), any: L('Que así sea.', "Qu'il en soit ainsi.") }]] }
        ]],
        ['isolde', L('Acaba con él, {lider}. Hazlo y todo habrá terminado.', 'Achève-le, {lider}. Fais-le, et tout sera terminé.')], ['bossbar'],
        ['objective', L('Derrota a Aethelgard. Puede aparecer de golpe junto a quien esté más débil.', "Bats Aethelgard. Il peut surgir d'un coup à côté du héros le plus faible.")]
      ],
      defeat: [
        ['aethelgard', L('Vuestras espadas… no tienen su olor. Quizá me equivoqué con vosotros.', "Vos épées… n'ont pas son odeur. Je me suis peut-être trompé sur vous.")],
        ['aethelgard', L('Escuchad. El sello no se rompe con acero. Solo el farol puede abrirlo. No dejéis que…', "Écoutez. Le sceau ne se brise pas avec l'acier. Seule la lanterne peut l'ouvrir. Ne laissez pas…")],
        ['stinger', 'twist'], ['music', 'silence'], ['lights', 'flicker'],
        ['isolde', L('Gracias, guardián. Ya no hace falta que nadie me deje.', "Merci, gardien. Je n'ai plus besoin qu'on me laisse faire.")],
        ['twist']
      ]
    },
    twist: [
      ['n', L('El farol se suelta de la mano de {lider} y flota hacia el Ojo. Su llama se abre como una flor y de ella sale una figura vestida de blanco, con una venda sobre los ojos.', "La lanterne échappe à la main de {lider} et flotte vers l'Œil. Sa flamme s'ouvre comme une fleur, et il en sort une silhouette vêtue de blanc, un bandeau sur les yeux.")],
      ['isolde', L('Mil años esperando a que alguien bajara con un corazón lo bastante limpio para cargar mi luz. Gracias, {lider}. Has sido el mejor de mis hijos.', "Mille ans à attendre que quelqu'un descende avec un cœur assez pur pour porter ma lumière. Merci, {lider}. Tu as été le meilleur de mes enfants.")],
      ['h', { hechicero: L('Me enseñaste a leer las estrellas en el Archivo. Cada lección… ¿era para esto?', "Vous m'avez appris à lire les étoiles, aux Archives. Chaque leçon… c'était pour ça ?"), any: L('Nos usaste. Desde el primer escalón.', 'Vous nous avez utilisés. Dès la première marche.') }],
      ['isolde', L('Os elegí con cariño. Una cosa no quita la otra.', "Je vous ai choisis avec tendresse. L'un n'empêche pas l'autre.")],
      ['isolde', L('Dadme el farol. Dejad que el Ojo se abra y os daré lo que pidáis: gloria, oro, a los que perdisteis. Una madre que nunca vuelva a mentiros.', "Donnez-moi la lanterne. Laissez l'Œil s'ouvrir, et je vous donnerai tout ce que vous voudrez : la gloire, l'or, ceux que vous avez perdus. Une mère qui ne vous mentira plus jamais.")],
      ['n', L('La voz de Isolde se mete en cada cabeza a la vez. Es cálida. Es la voz de una madre.', "La voix d'Isolde se glisse dans chaque tête à la fois. Elle est chaude. C'est la voix d'une mère.")],
      ['willTest'],
      ['choice', L('El farol late a vuestro alcance. ¿Qué hacéis?', 'La lanterne palpite à votre portée. Que faites-vous ?'), [
        [L('Romper el farol', 'Briser la lanterne'), L('{lider} lo estrella contra el suelo. Isolde pierde parte de su poder.', '{lider} la fracasse sur le sol. Isolde perd une partie de son pouvoir.'), [['flag', 'broke', true], ['sfx', 'glass'], ['shake', 1], ['scare'],
          ['h', { any: L('No, Madre. Esta vez el cuento lo terminamos nosotros.', "Non, Mère. Cette fois, c'est nous qui finissons l'histoire.") }],
          ['isolde', L('¡NO! ¿Qué habéis hecho, desagradecidos?', "NON ! Qu'avez-vous fait, ingrats ?")]]],
        [L('Entregar el farol', 'Donner la lanterne'), L('{lider} duda… y lo tiende hacia ella. Isolde despierta con todo su poder.', "{lider} hésite… puis la lui tend. Isolde s'éveille avec tout son pouvoir."), [['flag', 'broke', false], ['sfx', 'summon'],
          ['h', { any: L('Yo… solo quería que dejara de doler.', 'Je… je voulais seulement que ça cesse de faire mal.') }],
          ['h2', { any: L('¡No!', 'Non !') }],
          ['isolde', L('Buen hijo. Ahora, mirad cómo se abre el mundo.', "C'est bien, mon enfant. Maintenant, regardez le monde s'ouvrir.")]]]
      ]],
      ['spawnBoss', 'isolde'], ['music', 'boss'], ['bossbar'],
      ['objective', L('Derrota a Isolde, la Voz bajo la Piedra.', 'Bats Isolde, la Voix sous la Pierre.')]
    ],
    finalDefeat: [
      ['isolde', L('{lider}… mi niño… está tan oscuro aquí abajo…', '{lider}… mon enfant… il fait si sombre, ici, en bas…')],
      ['h', { any: L('Lo sé, Madre. Por eso vamos a encender una luz.', "Je sais, Mère. C'est pour ça que nous allons allumer une lumière.") }],
      ['music', 'silence'], ['wait', 600]
    ]
  }
];

const CAMPS = [
  {
    title: L('Rellano de la Escalera Vieja', 'Palier du Vieil Escalier'),
    steps: [
      ['n', L('En un rellano de la vieja escalera, a medio camino entre el mundo y la Hondura, encendéis un fuego.', 'Sur un palier du vieil escalier, à mi-chemin entre le monde et les Tréfonds, vous allumez un feu.')],
      ['h', { barbaro: L('Buena pelea. Mañana, más.', 'Beau combat. Demain, on remet ça.'), amazona: L('Hoy hemos luchado bien. Mañana lo haremos mejor.', "Aujourd'hui, nous avons bien combattu. Demain, nous ferons mieux."), any: L('Hoy hemos salido vivos. No es poco.', "Aujourd'hui, nous nous en sommes sortis. Ce n'est pas rien.") }],
      ['h2', { elfa: L('Ese eco dijo que la luz miente. No dejo de pensarlo.', "Cet écho a dit que la lumière ment. Je n'arrête pas d'y penser."), enano: L('Ese eco dijo que la luz miente. Y los enanos sabemos de luces que mienten.', "Cet écho a dit que la lumière ment. Et nous, les nains, on s'y connaît en lumières qui mentent."), any: L('Ese eco dijo que la luz miente.', 'Cet écho a dit que la lumière ment.') }],
      ['h', { hechicero: L('Madre Isolde me admitió en el Archivo cuando nadie más lo hacía. No hay nadie en Aldmere más bondadoso.', "Mère Isolde m'a accueilli aux Archives quand personne d'autre ne voulait de moi. Personne à Aldmere n'a meilleur cœur."), any: L('Isolde nos eligió. ¿Por qué iba a mentirnos?', 'Isolde nous a choisis. Pourquoi nous mentirait-elle ?') }],
      ['h2', { elfa: L('Nadie es bondadoso a tanta profundidad.', "Personne n'a bon cœur à une telle profondeur."), any: L('Nadie es bondadoso a tanta profundidad.', "Personne n'a bon cœur à une telle profondeur.") }],
      ['n', L('El farol, apartado sobre una piedra, pesa más que esta mañana.', "La lanterne, posée à l'écart sur une pierre, pèse plus lourd que ce matin.")]
    ]
  },
  {
    title: L('Grieta del Último Calor', 'Faille de la Dernière Chaleur'),
    steps: [
      ['n', L('Nadie habla durante un largo rato. El fuego crepita. El farol late con una luz que ya no es del todo cálida.', "Personne ne parle pendant un long moment. Le feu crépite. La lanterne palpite d'une lumière qui n'est plus tout à fait chaude.")],
      ['h', { any: L('Un ojo. Había un ojo dentro de esa cosa.', 'Un œil. Il y avait un œil dans ce truc.') }],
      ['h2', { enano: L('Thráin dijo que los sellos son cerraduras. Si es verdad, llevamos dos noches abriendo puertas que debían seguir cerradas.', "Thráin a dit que les sceaux sont des serrures. Si c'est vrai, ça fait deux nuits qu'on ouvre des portes qui devaient rester fermées."), any: L('Si los sellos son cerraduras, llevamos dos noches abriendo puertas que debían seguir cerradas.', "Si les sceaux sont des serrures, ça fait deux nuits qu'on ouvre des portes qui devaient rester fermées.") }],
      ['h', { hechicero: L('Me enseñó a leer, a tejer la magia… ¿para esto?', "Elle m'a appris à lire, à tisser la magie… pour ça ?"), any: L('Nos eligió. Desde el principio. ¿Para esto?', 'Elle nous a choisis. Dès le début. Pour ça ?') }],
      ['h2', { amazona: L('Lo que ella planeara no nos define. Lo que hagamos mañana, sí.', "Ce qu'elle a pu prévoir ne nous définit pas. Ce que nous ferons demain, si."), any: L('Lo que ella planeara no nos define. Lo que hagamos mañana, sí.', "Ce qu'elle a pu prévoir ne nous définit pas. Ce que nous ferons demain, si.") }],
      ['h', { barbaro: L('Mañana bajamos al Ojo. Y el farol no toca ese sello. Yo me encargo.', "Demain, on descend jusqu'à l'Œil. Et la lanterne ne touche pas ce sceau. Je m'en charge."), any: L('Bajaremos al Ojo. Pero el farol no tocará el último sello.', "Nous descendrons jusqu'à l'Œil. Mais la lanterne ne touchera pas le dernier sceau.") }]
    ]
  }
];

const PROLOGUE = [
  L('Durante mil años, la Llama Perenne ardió en la catedral de Aldmere.', "Pendant mille ans, la Flamme Éternelle a brûlé dans la cathédrale d'Aldmere."),
  L('Bajo sus raíces duerme la Hondura: criptas, forjas y torres hundidas que nadie recuerda haber construido.', "Sous ses racines dorment les Tréfonds : des cryptes, des forges et des tours englouties que personne ne se souvient d'avoir bâties."),
  L('Hace siete noches, la Llama se apagó.', "Il y a sept nuits, la Flamme s'est éteinte."),
  L('Desde entonces, las sombras llaman a las puertas. Y algo, muy abajo, ha empezado a despertar.', "Depuis, les ombres frappent aux portes. Et quelque chose, tout en bas, a commencé à s'éveiller."),
  L('Madre Isolde, la vidente ciega del Archivo, ha reunido a un puñado de héroes dispuestos a descender.', 'Mère Isolde, la voyante aveugle des Archives, a réuni une poignée de héros prêts à descendre.')
];

const EPILOGUES = {
  broke: {
    title: L('La Llama Despierta', "La Flamme s'éveille"),
    lines: [
      L('{lider} apoyó las manos sobre el Ojo y lo empujó con todo lo que le quedaba. El cristal se cerró como un párpado.', "{lider} posa les mains sur l'Œil et le repoussa de toutes ses dernières forces. Le cristal se referma comme une paupière."),
      L('Arriba, en la catedral de Aldmere, la Llama Perenne volvió a arder sola, sin que nadie la encendiera.', "Là-haut, dans la cathédrale d'Aldmere, la Flamme Éternelle se remit à brûler toute seule, sans que personne ne l'allume."),
      L('Tomás descansa por fin. Alguien bajó una última vez, solo, con una vela, y volvió al amanecer sin contar lo que dejó en su celda.', "Tomás repose enfin. Quelqu'un descendit une dernière fois, seul, une bougie à la main, et remonta à l'aube sans dire ce qu'il avait laissé dans sa cellule."),
      L('{grupo}: sus nombres están escritos en el Archivo, al pie de la verdad. Es el primer texto de la Hondura que nadie ha raspado.', "{grupo} : leurs noms sont inscrits aux Archives, au bas de la vérité. C'est le premier texte des Tréfonds que personne n'a gratté.")
    ]
  },
  gave: {
    title: L('El Nuevo Guardián', 'Le Nouveau Gardien'),
    lines: [
      L('Isolde cayó, pero el Ojo no se cerró del todo. Alguien tenía que quedarse a vigilarlo.', "Isolde tomba, mais l'Œil ne se referma pas tout à fait. Quelqu'un devait rester pour le surveiller."),
      L('{lider} se arrodilló ante el cristal y ocupó el lugar de Aethelgard. Dicen que ahora brilla con una luz fría.', "{lider} s'agenouilla devant le cristal et prit la place d'Aethelgard. On dit que le cristal brille désormais d'une lumière froide."),
      L('Los demás subieron sin su compañero. La Llama volvió a arder, más débil que antes.', "Les autres remontèrent sans {lider}. La Flamme se ralluma, plus faible qu'avant."),
      L('Los pedazos del farol descansan en una caja sin cerradura. Cada noche, alguien comprueba que siguen apagados.', "Les morceaux de la lanterne reposent dans une boîte sans serrure. Chaque nuit, quelqu'un vérifie qu'ils sont toujours éteints."),
      L('Algunas noches, los perros de Aldmere aún ladran hacia el suelo.', "Certaines nuits, les chiens d'Aldmere aboient encore vers le sol.")
    ]
  }
};

/* ============================ TUTORIAL ============================
   Sala de prácticas bajo la catedral: se juega con reglas de Relato,
   con el Bárbaro, la Elfa y el Hechicero, y no toca la partida guardada */
const TUTORIAL = {
  id: 'tut', num: '0', eyebrow: L('Tutorial guiado', 'Tutoriel guidé'), title: L('La Sala de Armas', "La Salle d'Armes"), subtitle: L('Antes de descender', 'Avant de descendre'), theme: 'crypt', ambient: 'crypt', tutorial: true,
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
    ['n', L('Bajo la catedral de Aldmere, la Orden guarda una sala de armas. Huele a cera, a aceite y a huesos viejos.', "Sous la cathédrale d'Aldmere, l'Ordre garde une salle d'armes. Ça sent la cire, l'huile et les vieux os.")],
    ['barbaro', L('Antes de bajar a la Hondura quiero ver cómo os movéis. Tras esa puerta esperan unos esqueletos de prácticas.', "Avant de descendre dans les Tréfonds, je veux voir comment vous bougez. Derrière cette porte attendent des squelettes d'entraînement.")],
    ['elfa', L('¿Esqueletos de prácticas? Qué cosas guardáis en las catedrales.', "Des squelettes d'entraînement ? Vous en gardez, de drôles de choses, dans vos cathédrales.")],
    ['hechicero', L('Huesos y alambre con un hechizo menor. Pegan flojo… creo.', 'Des os et du fil de fer, animés par un sort mineur. Ils frappent mollement… je crois.')],
    ['objective', L('Tutorial: aprende a moverte, luchar y abrir puertas.', 'Tutoriel : apprends à te déplacer, à combattre et à ouvrir les portes.')]
  ],
  rooms: {
    '1': { style: 'guardia', name: L('Sala de armas', "Salle d'armes") },
    '4': { style: 'pasillo', name: L('Patio de prácticas', "Cour d'entraînement"), reveal: [['barbaro', L('Ahí los tenéis. Pegan flojo, pero pegan.', 'Les voilà. Ils frappent mollement, mais ils frappent.')], ['objective', L('Derrota a los esqueletos de prácticas.', "Bats les squelettes d'entraînement.")]] },
    '5': { style: 'guardia', name: L('Armería', 'Armurerie'), reveal: [['elfa', L('Un cofre. Ahora sí hablamos el mismo idioma.', 'Un coffre. Là, on parle enfin la même langue.')], ['objective', L('Abre el cofre de la armería.', "Ouvre le coffre de l'armurerie.")]] }
  },
  notes: [
    [['sfx', 'page'], ['note', L('Reglamento de la Orden · Artículo III', "Règlement de l'Ordre · Article III"), L('Un guerrero no deja atrás a un hermano caído. Un explorador mira dónde pisa. Un mago no gasta su magia en vano. Y ninguno baja solo… salvo que no quede nadie más.', "Un guerrier n'abandonne pas un frère tombé. Un éclaireur regarde où il met les pieds. Un mage ne gaspille pas sa magie. Et nul ne descend seul… à moins qu'il ne reste personne d'autre.")],
      ['barbaro', L('Leer no gasta la acción. Abajo, los escritos cuentan lo que nadie os dirá.', "Lire ne coûte pas l'action. En bas, les écrits racontent ce que personne ne vous dira.")]]
  ],
  chests: {
    0: [['n', L('Monedas viejas y provisiones: la Orden no deja bajar a nadie con las manos vacías.', "De vieilles pièces et des provisions : l'Ordre ne laisse personne descendre les mains vides.")], ['objective', L('Últimos consejos antes de bajar.', 'Derniers conseils avant de descendre.')]]
  }
};
