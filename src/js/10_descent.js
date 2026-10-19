/* ==========================================================================
   Modo Descenso: mazmorras que se generan solas, nivel a nivel.
   Cada partida tiene una semilla; el mismo nivel de la misma semilla sale
   siempre igual (así funcionan el guardado y el reintento).
   ========================================================================== */
const DESCENT = {
  BAND: 4,                       // cuatro niveles por tramo: tres normales y uno con guardián
  THEMES: ['crypt', 'forge', 'void'],
  LIVES: { relato: 5, heroe: 3, pesadilla: 1 },
  BOSS: { crypt: 'malakor', forge: 'ignis', void: 'aethelgard' },
  LANTERN: { crypt: '#ffb45a', forge: '#ffd07a', void: '#b07aff' },
  LEGENDS: {
    crypt: { a: 'skeleton', b: 'archer', c: 'ghoul', d: 'acolyte' },
    forge: { a: 'orc', b: 'goblin', c: 'shaman', d: 'berserker' },
    void: { a: 'voidAcolyte', b: 'wraith', c: 'golem', d: 'reflection' }
  },
  /* peso de cada criatura según la posición en el tramo (0 = primer nivel) */
  WEIGHTS: {
    crypt: (k) => ({ a: 4, b: 3, c: k >= 1 ? 3 : 1, d: k >= 1 ? 2 : 0 }),
    forge: (k) => ({ a: 4, b: 4, c: k >= 1 ? 2 : 1, d: k >= 2 ? 1.5 : 0 }),
    void: (k) => ({ a: 3, b: 3, c: k >= 2 ? 1 : 0, d: 3 })
  },
  NAMES: {
    crypt: { place: ['Catacumbas', 'Osarios', 'Criptas', 'Galerías', 'Panteones', 'Nichos'], of: ['de los Sin Nombre', 'del Hueso Viejo', 'de la Cera Negra', 'de los Abades', 'del Silencio', 'de Fray Osric', 'de las Velas Muertas'],
      rooms: ['Osario', 'Nichos', 'Capilla', 'Galería', 'Sala de los sarcófagos', 'Cripta menor', 'Pasillo de las velas', 'Celda', 'Relicario', 'Sala de las ofrendas', 'Pozo seco', 'Coro hundido'],
      start: 'Pie de la escalera', exit: 'Escalera abajo' },
    forge: { place: ['Fraguas', 'Minas', 'Hornos', 'Fundiciones', 'Pozos', 'Talleres'], of: ['de Karak-Azkul', 'de la Mano Negra', 'del Yunque Roto', 'de la Escoria', 'de los Enanos', 'del Magma', 'de la Ceniza'],
      rooms: ['Fragua', 'Mina', 'Almacén', 'Horno', 'Taller', 'Fundición', 'Cuartel', 'Galería de vagonetas', 'Polvorín', 'Sala del yunque', 'Carbonera', 'Pozo de escoria'],
      start: 'Rellano de hierro', exit: 'Rampa abajo' },
    void: { place: ['Salas', 'Jardines', 'Bóvedas', 'Claustros', 'Cámaras', 'Galerías'], of: ['del Ojo', 'de Cristal', 'del Vacío', 'de la Voz', 'sin Fondo', 'del Reflejo', 'de la Luz Quieta'],
      rooms: ['Bóveda', 'Jardín de cristal', 'Claustro', 'Galería de espejos', 'Cámara', 'Antesala', 'Puente', 'Observatorio', 'Biblioteca hundida', 'Santuario', 'Sala del eco', 'Nave'],
      start: 'Umbral de cristal', exit: 'Escalera abajo' }
  },
  INTRO: {
    crypt: ['Huele a cera vieja y a tierra removida. Algo arrastra los pies más allá de la luz.', 'Los nichos de este nivel tienen nombres. Todos tachados.', 'Las velas de este piso siguen encendidas. Nadie las ha encendido.', 'El eco de vuestros pasos tarda demasiado en volver.'],
    forge: ['El aire quema la garganta. Abajo, alguien sigue avivando los hornos.', 'Martillazos lejanos marcan un ritmo que no es humano.', 'La piedra está caliente al tacto. Hay huellas de botas herradas en la ceniza.', 'Una vagoneta volcada bloquea media galería. Todavía humea.'],
    void: ['El suelo brilla como el agua quieta. Vuestro reflejo tarda en moverse.', 'No hay eco aquí. Las palabras se apagan al salir de la boca.', 'Cristales violetas crecen de las paredes como dientes.', 'La luz del farol se curva hacia el fondo de la sala, como si algo la llamara.']
  },
  NOTES: {
    crypt: [['Lápida sin nombre', 'Aquí yace quien guardó la puerta. No preguntéis su nombre: ya no lo tiene.'], ['Diario de un saqueador', 'Bajamos seis. Subiremos tres, dice Hob. Hob siempre fue optimista.'], ['Inscripción en un nicho', 'La muerte no es el fondo. Hay más escalones.'], ['Plegaria rayada', 'Madre de la Llama, si me oyes, no bajes a buscarme.']],
    forge: [['Albarán de la forja', 'Cien hojas para la Mano Negra. Pago: lo que queda de los enanos que no quisieron forjarlas.'], ['Runas en un yunque', 'El que golpea sin descanso, al final se queda sin brazo.'], ['Nota de un capataz', 'Que nadie baje al pozo de escoria. Lo que hay allí no es escoria.'], ['Cartel quemado', 'Turno de noche: dos orcos y un trasgo. El trasgo no cuenta.']],
    void: [['Grabado en el cristal', 'Mira dentro y verás quién eres. Mira más y verás quién podrías ser.'], ['Página flotante', 'El Ojo no ve. Recuerda. Y todo lo que recuerda, vuelve.'], ['Anotación de un astrónomo', 'Aquí abajo las estrellas están más cerca. Y nos miran.'], ['Verso sin autor', 'Bajé buscando el fondo. El fondo me encontró a mí.']]
  },
  TAUNT: {
    malakor: ['Más corderos para mi rebaño.', '¿Habéis bajado hasta aquí para morir? Qué considerados.'],
    ignis: ['¡Más leña para la forja!', 'Vuestros huesos templarán bien el acero.'],
    aethelgard: ['Nadie cruza el Ojo dos veces.', 'Ya os he visto morir. Muchas veces.']
  },
  CAMP: [
    'Encontráis un hueco seco entre dos galerías. El fuego prende a la segunda.',
    'Alguien acampó aquí antes. Dejó leña, un caldero y ninguna explicación.',
    'Por primera vez en horas no se oye nada. Ni siquiera la Hondura.',
    'Las brasas iluminan las caras del grupo. Nadie habla de lo que hay más abajo.'
  ],
  theme(depth) { return this.THEMES[Math.floor((depth - 1) / this.BAND) % this.THEMES.length]; },
  cycle(depth) { return Math.floor((depth - 1) / (this.BAND * this.THEMES.length)); },
  isBoss(depth) { return depth % this.BAND === 0; },

  /* -------------------------------------------------------------- generador */
  make(seed, depth) {
    const rnd = U.mulberry(((seed >>> 0) ^ Math.imul(depth, 2654435761)) >>> 0);
    const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
    const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    const theme = this.theme(depth), k = (depth - 1) % this.BAND, cyc = this.cycle(depth), boss = this.isBoss(depth);
    const N = this.NAMES[theme];
    const sizes = cyc ? [[3, 3], [4, 3], [4, 3], [4, 3]] : [[3, 2], [3, 3], [4, 3], [3, 3]];
    const [cols, rows] = sizes[k];
    const w = Array.from({ length: cols }, () => ri(4, 6)), h = Array.from({ length: rows }, () => ri(3, 5));
    const x0 = [], y0 = [];
    w.reduce((a, v, i) => { x0[i] = a; return a + v + 1; }, 1);
    h.reduce((a, v, i) => { y0[i] = a; return a + v + 1; }, 1);
    const W = x0[cols - 1] + w[cols - 1] + 1, H = y0[rows - 1] + h[rows - 1] + 1;
    const G = Array.from({ length: H }, () => Array(W).fill('#'));
    const cell = (c, r) => r * cols + c;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) for (let y = y0[r]; y < y0[r] + h[r]; y++) for (let x = x0[c]; x < x0[c] + w[c]; x++) G[y][x] = '.';

    // esquinas: el grupo entra por una y la salida queda en la opuesta
    const corners = [[0, 0], [cols - 1, 0], [0, rows - 1], [cols - 1, rows - 1]];
    const sc = pick(corners), ec = [cols - 1 - sc[0], rows - 1 - sc[1]];
    // fusiones: algunas salas ocupan dos celdas (la del guardián siempre)
    const roomOfCell = Array.from({ length: cols * rows }, (_, i) => i), merged = new Set();
    const merge = (c, r, horiz) => {
      const c2 = horiz ? c + 1 : c, r2 = horiz ? r : r + 1;
      if (c2 >= cols || r2 >= rows) return false;
      const a = cell(c, r), b = cell(c2, r2);
      if (merged.has(a) || merged.has(b)) return false;
      if ((c === sc[0] && r === sc[1]) || (c2 === sc[0] && r2 === sc[1])) return false; // la entrada, pequeña
      merged.add(a); merged.add(b); roomOfCell[b] = a;
      if (horiz) { const x = x0[c2] - 1; for (let y = y0[r]; y < y0[r] + h[r]; y++) G[y][x] = '.'; }
      else { const y = y0[r2] - 1; for (let x = x0[c]; x < x0[c] + w[c]; x++) G[y][x] = '.'; }
      return true;
    };
    if (boss) merge(ec[0] > 0 ? ec[0] - 1 : 0, ec[1], true) || merge(ec[0], ec[1] > 0 ? ec[1] - 1 : 0, false);
    for (let i = 0, n = ri(0, 2), done = 0; i < 24 && done < n; i++) if (merge(ri(0, cols - 1), ri(0, rows - 1), rnd() < 0.6)) done++;
    // salas
    const rid = new Map(); let nR = 0;
    roomOfCell.forEach((root, i) => { if (!rid.has(root)) rid.set(root, nR++); });
    const roomIdOf = (c, r) => rid.get(roomOfCell[cell(c, r)]);
    const rooms = Array.from({ length: nR }, (_, i) => ({ id: i, x1: 99, y1: 99, x2: -1, y2: -1, adj: [] }));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const R = rooms[roomIdOf(c, r)];
      R.x1 = Math.min(R.x1, x0[c]); R.y1 = Math.min(R.y1, y0[r]); R.x2 = Math.max(R.x2, x0[c] + w[c] - 1); R.y2 = Math.max(R.y2, y0[r] + h[r] - 1);
    }
    rooms.forEach((R) => { R.area = (R.x2 - R.x1 + 1) * (R.y2 - R.y1 + 1); R.cx = Math.round((R.x1 + R.x2) / 2); R.cy = Math.round((R.y1 + R.y2) / 2); });
    // fronteras entre salas distintas: dónde puede ir una puerta
    const borders = new Map();
    const addBorder = (a, b, seg) => { if (a === b) return; const key = Math.min(a, b) + '-' + Math.max(a, b); if (!borders.has(key)) borders.set(key, { a: Math.min(a, b), b: Math.max(a, b), segs: [] }); borders.get(key).segs.push(seg); };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (c + 1 < cols) addBorder(roomIdOf(c, r), roomIdOf(c + 1, r), { v: true, x: x0[c + 1] - 1, from: y0[r], to: y0[r] + h[r] - 1 });
      if (r + 1 < rows) addBorder(roomIdOf(c, r), roomIdOf(c, r + 1), { v: false, y: y0[r + 1] - 1, from: x0[c], to: x0[c] + w[c] - 1 });
    }
    // árbol que une todas las salas y alguna puerta de más para dar rodeos
    const startR = roomIdOf(sc[0], sc[1]);
    const all = [...borders.values()];
    const inTree = new Set([startR]), edges = [];
    while (inTree.size < nR) {
      const cand = all.filter((e) => inTree.has(e.a) !== inTree.has(e.b));
      const e = pick(cand); edges.push(e); inTree.add(e.a); inTree.add(e.b);
    }
    const rest = shuffle(all.filter((e) => !edges.includes(e)));
    const extra = Math.min(rest.length, depth === 1 ? 1 : ri(1, 2));
    for (let i = 0; i < extra; i++) edges.push(rest[i]);
    const doors = [];
    edges.forEach((e) => {
      const s = pick(e.segs), len = s.to - s.from + 1;
      const p = len >= 3 ? ri(s.from + 1, s.to - 1) : ri(s.from, s.to);
      const x = s.v ? s.x : p, y = s.v ? p : s.y;
      G[y][x] = '+'; doors.push({ x, y, a: e.a, b: e.b });
      rooms[e.a].adj.push(e.b); rooms[e.b].adj.push(e.a);
    });
    // distancias desde la entrada; la salida, en la sala más lejana
    const dist = Array(nR).fill(-1); dist[startR] = 0; const q = [startR];
    while (q.length) { const a = q.shift(); rooms[a].adj.forEach((b) => { if (dist[b] < 0) { dist[b] = dist[a] + 1; q.push(b); } }); }
    let exitR = boss ? roomIdOf(ec[0], ec[1]) : rooms.slice().sort((A, B) => dist[B.id] - dist[A.id] || B.area - A.area)[0].id;
    if (exitR === startR) exitR = rooms.find((R) => R.id !== startR).id;

    // ---------------------------------------------------------------- atrezo
    const key = (x, y) => x + ',' + y;
    const keep = new Set();   // delante de cada puerta no se pone nada
    doors.forEach((d) => [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => keep.add(key(d.x + dx, d.y + dy))));
    const free = (x, y) => G[y] && G[y][x] === '.' && !keep.has(key(x, y));
    const BLOCK = '#OC?*X&M~';
    const passable = (ch) => !BLOCK.includes(ch);
    const connected = () => {
      let sx = -1, sy = -1, total = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (passable(G[y][x])) { total++; if (sx < 0) { sx = x; sy = y; } }
      const seen = new Set([key(sx, sy)]), st = [[sx, sy]];
      while (st.length) { const [x, y] = st.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (G[ny] && passable(G[ny][nx] || '#') && !seen.has(key(nx, ny))) { seen.add(key(nx, ny)); st.push([nx, ny]); } }); }
      return seen.size === total;
    };
    const tryPlace = (cells, ch) => {
      if (!cells.every(([x, y]) => free(x, y))) return false;
      cells.forEach(([x, y]) => (G[y][x] = ch));
      if (BLOCK.includes(ch) && !connected()) { cells.forEach(([x, y]) => (G[y][x] = '.')); return false; }
      return true;
    };
    const tilesOf = (R) => { const out = []; for (let y = R.y1; y <= R.y2; y++) for (let x = R.x1; x <= R.x2; x++) out.push([x, y]); return out; };
    const cornersOf = (R) => [[R.x1, R.y1], [R.x2, R.y1], [R.x1, R.y2], [R.x2, R.y2]];
    const ringFree = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && !(G[y + dy] && G[y + dy][x + dx] === '.')) return false; return true; };
    const doorDist = (R, x, y) => Math.min(...doors.filter((d) => d.a === R.id || d.b === R.id).map((d) => Math.abs(d.x - x) + Math.abs(d.y - y)));
    const S = rooms[startR], E = rooms[exitR];

    // entrada: el grupo y la escalera por la que ha bajado
    const sx = U.clamp(S.cx, S.x1, S.x2), sy = U.clamp(S.cy, S.y1, S.y2);
    const around = [[sx, sy], [sx + 1, sy], [sx - 1, sy], [sx, sy + 1], [sx, sy - 1], [sx + 1, sy + 1], [sx - 1, sy - 1], [sx + 1, sy - 1], [sx - 1, sy + 1]].filter(([x, y]) => x >= S.x1 && x <= S.x2 && y >= S.y1 && y <= S.y2);
    ['1', '2', '3'].forEach((ch) => { const p = around.find(([x, y]) => G[y][x] === '.'); if (p) G[p[1]][p[0]] = ch; });
    shuffle(cornersOf(S)).some(([x, y]) => tryPlace([[x, y]], 'X'));
    // salida: escalera en la esquina más alejada de las puertas
    const exitCorner = cornersOf(E).filter(([x, y]) => free(x, y)).sort((A, B) => doorDist(E, B[0], B[1]) - doorDist(E, A[0], A[1]));
    let exit = null;
    for (const [x, y] of exitCorner) if (tryPlace([[x, y]], 'X')) { exit = { x, y }; break; }
    if (!exit) { const t = tilesOf(E).filter(([x, y]) => free(x, y) && ringFree(x, y)); for (const [x, y] of t) if (tryPlace([[x, y]], 'X')) { exit = { x, y }; break; } }
    // guardián
    const bossType = boss ? this.BOSS[theme] : null;
    if (boss) {
      const spots = tilesOf(E).filter(([x, y]) => free(x, y) && Math.abs(x - exit.x) + Math.abs(y - exit.y) >= 2).sort((A, B) => (Math.abs(A[0] - E.cx) + Math.abs(A[1] - E.cy)) - (Math.abs(B[0] - E.cx) + Math.abs(B[1] - E.cy)));
      if (spots.length) G[spots[0][1]][spots[0][0]] = 'B';
    }
    // nombres de las salas (cada sala lleva su marca)
    const MARKS = '0456789RSTUVW'.split('');
    const roomMeta = { '1': { name: N.start } };
    const names = shuffle(N.rooms.slice());
    rooms.forEach((R) => {
      if (R.id === startR) return;
      const m = MARKS.shift(); if (!m) return;
      const spot = tilesOf(R).find(([x, y]) => free(x, y) && !ringFree(x, y)) || tilesOf(R).find(([x, y]) => free(x, y));
      if (!spot) return;
      G[spot[1]][spot[0]] = m;
      R.mark = m;
      if (R.id === exitR) roomMeta[m] = boss ? { name: `Guarida de ${ENEMY_TYPES[bossType].name.split(',')[0]}` } : { name: N.exit, reveal: [['n', 'Unos peldaños gastados se hunden en la oscuridad: la escalera al nivel siguiente.'], ['objective', 'Baja por la escalera: acércate y tócala. Antes, si quieres, explora.']] };
      else roomMeta[m] = { name: names.pop() || 'Sala' };
    });
    // columnas, bloques y fosas en las salas grandes
    const blockCh = '&';
    rooms.forEach((R) => {
      if (R.area < 18) return;
      const inner = shuffle(tilesOf(R).filter(([x, y]) => x > R.x1 && x < R.x2 && y > R.y1 && y < R.y2));
      if (R.area >= 30 && R.id !== startR && rnd() < 0.55) {
        for (const [x, y] of inner) {
          if (x + 1 >= R.x2 || y + 1 >= R.y2) continue;
          const sq = [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]];
          const clear = [-1, 0, 1, 2].every((dy) => [-1, 0, 1, 2].every((dx) => G[y + dy] && G[y + dy][x + dx] === '.'));
          if (clear && tryPlace(sq, '~')) break;
        }
      }
      let n = ri(0, R.area >= 30 ? 3 : 2);
      for (const [x, y] of inner) { if (n <= 0) break; if (ringFree(x, y) && tryPlace([[x, y]], rnd() < 0.55 ? 'O' : blockCh)) n--; }
    });
    // cofres: en esquinas de salas lejanas o sin salida
    const nChests = 1 + (rnd() < 0.5 ? 1 : 0) + (boss ? 1 : 0);
    const chestRooms = rooms.filter((R) => R.id !== startR).sort((A, B) => (B.adj.length === 1) - (A.adj.length === 1) || dist[B.id] - dist[A.id] || rnd() - 0.5);
    const chests = {};
    let placedC = 0;
    const chestOrder = [];
    for (const R of chestRooms) {
      if (placedC >= nChests) break;
      for (const [x, y] of shuffle(cornersOf(R))) { if (tryPlace([[x, y]], 'C')) { placedC++; chestOrder.push({ x, y }); break; } }
    }
    // a veces un cofre guarda una pieza de equipo (el índice es el orden de lectura del mapa)
    if (depth >= 2 && chestOrder.length && rnd() < 0.35) chests[ri(0, chestOrder.length - 1)] = [['gearLoot']];
    // un escrito de vez en cuando
    const notes = [];
    if (rnd() < 0.5) {
      const R = pick(rooms.filter((q) => q.id !== startR));
      const wallSpots = shuffle(tilesOf(R).filter(([x, y]) => (x === R.x1 || x === R.x2 || y === R.y1 || y === R.y2)));
      for (const [x, y] of wallSpots) if (tryPlace([[x, y]], '?')) { const [t, txt] = pick(this.NOTES[theme]); notes.push([['sfx', 'page'], ['note', t, txt]]); break; }
    }
    // trampas
    let nTraps = ri(1, 2) + (k >= 2 ? 1 : 0) + cyc;
    const trapTiles = shuffle(rooms.filter((R) => R.id !== startR).flatMap(tilesOf)).filter(([x, y]) => free(x, y));
    for (const [x, y] of trapTiles) {
      if (nTraps <= 0) break;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([dx, dy]) => G[y + dy] && G[y + dy][x + dx] === '^')) continue;
      G[y][x] = '^'; nTraps--;
    }
    // escombros (decoración que se puede pisar)
    rooms.forEach((R) => tilesOf(R).forEach(([x, y]) => { if (free(x, y) && rnd() < 0.05) G[y][x] = ','; }));
    // criaturas
    const weights = this.WEIGHTS[theme](k);
    const pickFoe = () => { const tot = Object.values(weights).reduce((a, b) => a + b, 0); let r = rnd() * tot; for (const [kk, v] of Object.entries(weights)) { r -= v; if (r < 0) return kk; } return 'a'; };
    let budget = Math.min(16, 4 + Math.round(depth * 1.25) + (k >= 2 ? 1 : 0));
    const foeRooms = shuffle(rooms.filter((R) => R.id !== startR));
    foeRooms.sort((A, B) => (B.id === exitR) - (A.id === exitR));
    foeRooms.forEach((R) => {
      let n = R.id === exitR ? (boss ? ri(1, 2) : ri(2, 3)) : (rnd() < 0.18 ? 0 : ri(1, 2 + (k >= 2 ? 1 : 0)));
      if (R.area >= 30 && R.id !== exitR) n++;
      const spots = shuffle(tilesOf(R).filter(([x, y]) => free(x, y)));
      for (const [x, y] of spots) { if (n <= 0 || budget <= 0) break; G[y][x] = pickFoe(); n--; budget--; }
    });
    // cerradura: a veces la puerta que lleva a la salida
    const locks = {};
    if (depth >= 2 && rnd() < 0.5) {
      const into = doors.filter((d) => (d.a === exitR || d.b === exitR));
      const d = into.sort((A, B) => Math.min(dist[A.a], dist[A.b]) - Math.min(dist[B.a], dist[B.b]))[0];
      if (d) locks[key(d.x, d.y)] = theme === 'void' || rnd() < 0.35 ? 'sello' : 'cerradura';
    }
    const map = G.map((row) => row.join(''));
    const P = this.NAMES[theme];
    const title = `${pick(P.place)} ${pick(P.of)}`;
    const bossName = boss ? ENEMY_TYPES[bossType].name : '';
    return {
      id: 'd' + depth, num: String(depth), descent: true, depth, eyebrow: `Descenso · Nivel ${depth}`, title,
      subtitle: boss ? `Nivel del guardián · ${bossName.split(',')[0]}` : `A ${depth * 40} varas bajo Aldmere`,
      theme, ambient: theme, legend: this.LEGENDS[theme], bossType, lantern: this.LANTERN[theme], locks, map,
      exit, scale: { hp: Math.floor((depth - 1) / 6), atk: Math.floor((depth - 1) / 10), bossHp: Math.floor((depth - 1) / 4) * 2 },
      champChance: Math.min(0.3, Math.max(0, (depth - 2) * 0.03)),
      intro: [['n', pick(this.INTRO[theme])], ['objective', boss ? 'Encuentra y derrota al guardián del nivel; tras él está la escalera.' : 'Encuentra la escalera que baja al nivel siguiente.']],
      rooms: roomMeta, notes, chests,
      boss: boss ? {
        reveal: [['music', 'boss'], ['stinger', 'boss'], ['camBoss'], [bossType, pick(this.TAUNT[bossType])], ['bossbar'], ['objective', `Derrota a ${bossName.split(',')[0]}. La escalera está tras él.`]],
        defeat: [['n', 'El guardián se desploma. Más allá, la escalera queda libre.'], ['objective', 'Baja por la escalera para acampar.']]
      } : null
    };
  }
};
