/* ==========================================================================
   Probador de dados de Umbral: una sala de la cripta con un héroe, un aliado
   y dos enemigos para comparar tres sistemas de dados con dados de verdad.
   ========================================================================== */
const TS = 2; // tamaño de casilla, como en el juego
const W = (x, y, h = 0) => new THREE.Vector3(x * TS, h, y * TS);
const HEROES = ['barbaro', 'enano', 'elfa', 'hechicero', 'amazona'];
const FOES = ['skeleton', 'ghoul', 'orc', 'berserker', 'golem'];
const MODES = {
  clasico: { name: 'Clásico', tag: 'Como ahora', desc: 'Calaveras contra escudos, como ahora en Umbral. Los héroes paran con escudos blancos (2 caras de 6) y los monstruos con escudos negros (1 de 6). No hay efectos extra.' },
  destino: { name: 'Clásico + Destino', tag: 'Propuesta', desc: 'Lo mismo que ahora, y en cada ataque de un héroe cae además el Dado del Destino: 2 caras alegres (la ventaja propia del héroe), 1 trágica (+1 Presagio) y 3 en blanco. Los enemigos no lo tiran.' },
  mascaras: { name: 'Máscaras de Gemini', tag: 'Para comparar', desc: 'Un solo dado con máscaras para todos: 3 calaveras (una con máscara trágica), 1 escudo con máscara alegre, 1 alegre y 1 trágica. Héroes y monstruos paran con la misma cara.' }
};
const COMEDY = {
  barbaro: { name: 'Rebote', text: 'El hachazo sigue: 1 dado contra el otro enemigo junto al objetivo.' },
  enano: { name: 'Empujón', text: 'Aparta al enemigo una casilla.' },
  elfa: { name: 'Paso ligero', text: '+2 de movimiento este turno.' },
  hechicero: { name: 'Chispa', text: 'Una de sus habilidades se recarga una ronda antes.' },
  amazona: { name: '¡Conmigo!', text: 'Un aliado cercano queda Inspirado (+1 dado en su próximo ataque).' }
};
const TREASURE = {
  gold: 'Oro: +15 monedas.', potion: 'Una poción intacta.', item: 'Un objeto: bomba alquímica.', nothing: 'Polvo y huesos. Nada.', danger: 'Peligro.'
};

const S = { mode: 'destino', hero: 'barbaro', foe: 'skeleton', busy: false, doom: 0, lockHave: 0, log: [], tally: { attacks: 0, dmg: 0, comedy: 0, tragedy: 0, blank: 0, effects: 0 } };
let renderer, scene, camera, clock, units = {}, anchors = [], torches = [];
const $ = (id) => document.getElementById(id);

/* ======================================================================== escena */
function initScene() {
  const cv = $('cv');
  renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene(); scene.background = new THREE.Color('#0b0908'); scene.fog = new THREE.FogExp2(0x0b0908, 0.018);
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  clock = new THREE.Clock();
  TEX.size = 256;
  scene.add(new THREE.HemisphereLight(CRYPT.hemiSky, CRYPT.hemiGround, 0.75));
  const key = new THREE.DirectionalLight('#ffe2bf', 1.25); key.position.set(2, 18, 14); key.target.position.copy(W(3, 2.5));
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024); const sc = key.shadow.camera; sc.left = -12; sc.right = 12; sc.top = 12; sc.bottom = -12; sc.near = 1; sc.far = 50; key.shadow.bias = -0.0008;
  scene.add(key, key.target);
  // suelo de la sala: 7 × 6 casillas
  const FT = TEX.floor(CRYPT), rep = (t, x, y) => { const c = t.clone(); c.needsUpdate = true; c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(x, y); return c; };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(7 * TS, 6 * TS), new THREE.MeshStandardMaterial({ map: rep(FT.map, 7, 6), normalMap: rep(FT.normalMap, 7, 6), roughnessMap: rep(FT.roughnessMap, 7, 6), roughness: 1, metalness: 0.02 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(3 * TS, 0, 2.5 * TS); floor.receiveShadow = true; scene.add(floor);
  // muros del fondo y de los lados
  const WT = TEX.wall(CRYPT);
  const wall = (w, x, z, ry) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 3.2, 0.6), new THREE.MeshStandardMaterial({ map: rep(WT.map, w / TS, 1), normalMap: WT.normalMap ? rep(WT.normalMap, w / TS, 1) : null, roughness: 0.9 })); m.position.set(x, 1.6, z); m.rotation.y = ry; m.receiveShadow = true; scene.add(m); };
  wall(7 * TS + 0.6, 3 * TS, -1 - 0.3, 0); wall(6 * TS, -1 - 0.3, 2.5 * TS, Math.PI / 2); wall(6 * TS, 6 * TS + 1 + 0.3, 2.5 * TS, Math.PI / 2);
  // antorchas con luz que titila
  [[1.2, -1], [4.8, -1]].forEach(([x, y]) => {
    const s = MODELS.sconce(); s.position.copy(W(x, y + 0.36, 1.9)); scene.add(s);
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), MAT.glow('#ffb35a', 3)); fl.position.copy(W(x, y + 0.53, 2.38)); scene.add(fl);
    const L = new THREE.PointLight('#ff9a4a', 2.2, 14, 2); L.position.copy(W(x, y + 0.7, 2.4)); scene.add(L);
    torches.push({ L, fl, ph: Math.random() * 10 });
  });
  // un poco de atrezo de cripta
  const rnd = U.mulberry(7);
  const shelf = MODELS.skullShelf(rnd); shelf.position.copy(W(3, -0.64, 1.3)); scene.add(shelf);
  const cnd = MODELS.candles(rnd); cnd.position.copy(W(6.1, 0.2)); scene.add(cnd);
  const bones = MODELS.bones(rnd); bones.position.copy(W(0.2, 4.7)); scene.add(bones);
  DICE3D.init(scene, { size: 0.62 });
  resize(); window.addEventListener('resize', resize);
}
function resize() {
  const st = $('stage'), w = st.clientWidth, h = st.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); fitCamera();
}
/* La cámara se aleja lo justo para que se vea toda la escena y la zona de los dados */
function fitCamera() {
  const tall = camera.aspect < 0.95;
  const target = tall ? W(2.95, 2.45, 0.3) : W(3.1, 2.35, 0.3), dir = new THREE.Vector3(0, tall ? 2.1 : 1.3, 1).normalize();
  const pts = tall ? [W(0.55, 0.6, 2.2), W(4.45, 0.6, 2.2), W(1.15, 4.3, 0), W(4.85, 4.3, 0), W(5.35, 3.4, 0)] : [W(0.55, 0.55, 2.3), W(4.45, 0.55, 2.3), W(1.05, 4.45, 0), W(4.95, 4.45, 0), W(6.15, 3.6, 0)];
  const v = new THREE.Vector3();
  for (let d = 9; d < 60; d += 0.4) {
    camera.position.copy(target).addScaledVector(dir, d); camera.lookAt(target); camera.updateMatrixWorld();
    if (pts.every((p) => { v.copy(p).project(camera); return Math.abs(v.x) < 0.95 && v.y < 0.8 && v.y > (tall ? -0.55 : -0.62); })) break;
  }
  camera.userData.base = camera.position.clone(); camera.userData.target = target.clone();
  camera.userData.far = { pos: camera.position.clone(), target: target.clone() };
  camera.userData.tall = tall; camera.userData.zoom = 0;
}
/* En el móvil en vertical, la cámara se acerca a los dados cuando caen y se aleja al tirar de nuevo */
function camTo(pos, target) {
  const U0 = camera.userData, p0 = U0.base.clone(), t0 = U0.target.clone();
  return U.tween(480, (t) => { U0.base.lerpVectors(p0, pos, t); U0.target.lerpVectors(t0, target, t); });
}
function zoomOut() { const U0 = camera.userData; if (!U0.tall || !U0.far) return Promise.resolve(); return camTo(U0.far.pos, U0.far.target); }
/* Se acerca lo justo para que quepan los dados caídos y quienes luchan */
function zoomFit(units = []) {
  const U0 = camera.userData; if (!U0.tall || !U0.far) return Promise.resolve();
  const pts = [];
  DICE3D.live().forEach((d) => { const p = d.group.position; pts.push(new THREE.Vector3(p.x - 0.55, 0, p.z), new THREE.Vector3(p.x + 0.55, 0, p.z), new THREE.Vector3(p.x, 0, p.z + 1.25), new THREE.Vector3(p.x, 0.9, p.z - 0.4)); });
  units.forEach((u) => pts.push(new THREE.Vector3(u.root.position.x, u.h + 0.9, u.root.position.z)));
  if (!pts.length) return Promise.resolve();
  const c = new THREE.Vector3(); pts.forEach((p) => c.add(p)); c.divideScalar(pts.length); c.y = 0.3;
  const dir = U0.far.pos.clone().sub(U0.far.target).normalize(), dFar = U0.far.pos.distanceTo(U0.far.target);
  const cam = camera.clone(), v = new THREE.Vector3();
  let dist = dFar;
  for (let d = dFar * 0.5; d <= dFar; d += 0.25) {
    cam.position.copy(c).addScaledVector(dir, d); cam.lookAt(c); cam.updateMatrixWorld();
    if (pts.every((p) => { v.copy(p).project(cam); return Math.abs(v.x) < 0.92 && v.y < 0.7 && v.y > -0.45; })) { dist = d; break; }
  }
  return camTo(c.clone().addScaledVector(dir, dist), c);
}

/* ======================================================================== figuras */
function makeUnit(id, kind, side, x, y, face) {
  const isHero = side === 'hero';
  const def = isHero ? HERO_DEFS[kind] : ENEMY_TYPES[kind];
  const root = new THREE.Group();
  const model = MODELS.build(def.model, {});
  const rim = isHero ? def.color : '#7a1d1d';
  root.add(MODELS.base(rim, 0.62, isHero)); root.add(model);
  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const mini = MINI.uniforms(isHero ? '#ffd9a8' : '#a8bcff', isHero ? 0.3 : 0.24); MINI.apply(model, mini);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ map: TEX.blob(), transparent: true, depthWrite: false, opacity: 0.85 }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.012; root.add(blob);
  root.position.copy(W(x, y)); root.rotation.y = face;
  scene.add(root);
  const st = isHero ? def.stats : def;
  const u = { id, kind, side, def, name: def.name, color: isHero ? def.color : '#c24a3a', root, model, fig: model.userData.fig, mini, h: model.userData.height || 1.5,
    home: W(x, y), x, y, face, maxHp: st.hp, hp: st.hp, atk: st.atk, def: st.def, status: {}, ph: Math.random() * 6 };
  u.fig.userData.baseY = u.fig.position.y; u.fig.userData.baseS = u.fig.scale.y;
  u.badge = U.el('div', 'badge ' + side, ''); $('labels').appendChild(u.badge);
  anchors.push({ el: u.badge, at: () => new THREE.Vector3(u.root.position.x, u.h + 0.55, u.root.position.z), keep: true });
  return u;
}
function dropUnit(u) { if (!u) return; scene.remove(u.root); u.badge.remove(); anchors = anchors.filter((a) => a.el !== u.badge); }
function badge(u) {
  const pips = Array.from({ length: u.maxHp }, (_, i) => `<i class="${i < u.hp ? 'on' : ''}"></i>`).join('');
  const st = Object.values(u.status).map((t) => `<em>${U.esc(t)}</em>`).join('');
  u.badge.innerHTML = `<b>${U.esc(u.name)}</b><span class="pips">${pips}</span>${st ? `<span class="st">${st}</span>` : ''}`;
}
function buildUnits() {
  Object.values(units).forEach(dropUnit);
  const ally = HEROES.find((id) => id !== S.hero && id !== 'enano') || 'elfa';
  units = {
    hero: makeUnit('hero', S.hero, 'hero', 2, 2, Math.atan2(1, 0.55)),
    ally: makeUnit('ally', ally, 'hero', 1, 1, Math.atan2(1, 0.8)),
    a: makeUnit('a', S.foe, 'foe', 3, 2, Math.atan2(-1, 0.55)),
    b: makeUnit('b', S.foe, 'foe', 4, 1, Math.atan2(-1, 0.8))
  };
  Object.values(units).forEach(badge);
  renderSide();
}
function resetPlaces() {
  const moves = Object.values(units).filter((u) => u.root.position.distanceTo(u.home) > 0.01);
  if (!moves.length) return Promise.resolve();
  const from = moves.map((u) => u.root.position.clone());
  return U.tween(260, (k) => moves.forEach((u, i) => u.root.position.lerpVectors(from[i], u.home, k)));
}

/* ======================================================================== efectos */
function headOf(u, k = 0.62) { return new THREE.Vector3(u.root.position.x, k >= 1 ? u.h + 1.25 + (k - 1) * 2 : u.h * k, u.root.position.z); }
function spark(color, r = 0.12) { return new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), MAT.glow(color, 2.6)); }
function projectile(from, to, color, o = {}) {
  const m = spark(color, o.r || 0.12); m.position.copy(from); scene.add(m);
  const L = new THREE.PointLight(color, 1.2, 4, 2); m.add(L);
  const a = from.clone(), b = to.clone(), arc = o.arc != null ? o.arc : 0.9;
  return U.sleep(o.delay || 0).then(() => U.tween(o.dur || 340, (k) => { m.position.lerpVectors(a, b, k); m.position.y += Math.sin(k * Math.PI) * arc; }, (t) => t)).then(() => { scene.remove(m); });
}
function ring(pos, color, r = 1.2, dur = 600) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1.8), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2; m.position.set(pos.x, 0.05, pos.z); scene.add(m);
  return U.tween(dur, (k) => { m.scale.setScalar(0.2 + r * k); m.material.opacity = 1 - k; }, (t) => t).then(() => { scene.remove(m); m.geometry.dispose(); m.material.dispose(); });
}
let shakeT = 0;
function shake(k = 0.25) { shakeT = Math.max(shakeT, k); }
function flash(u, color) { u.mini.uFlashCol.value.set(color); u.mini.uFlash.value = 1; }
function floatText(pos, text, cls = '') {
  const el = U.el('div', 'float ' + cls, U.esc(text)); $('labels').appendChild(el);
  const a = { el, at: () => pos, t0: performance.now(), life: 1500 / (U.speed || 1) };
  anchors.push(a);
  setTimeout(() => { el.remove(); anchors = anchors.filter((q) => q !== a); }, a.life);
}
function tag(pos, html, cls = '') {
  const el = U.el('div', 'tag ' + cls, html); $('labels').appendChild(el);
  anchors.push({ el, at: () => pos, tag: true });
  return el;
}
/* ---------------- cartel con el resultado de la tirada ---------------- */
const fiCache = {};
function fi(type, face) { const k = type + ':' + face; if (!fiCache[k]) fiCache[k] = DICE3D.faceTexture(type, face).image.toDataURL(); return `<img class="fi" src="${fiCache[k]}" alt="">`; }
function plaque(caption, main, cls = '') {
  const p = $('plaque');
  p.className = 'plaque ' + cls;
  p.innerHTML = `<div class="pq-cap">${caption}</div><div class="pq-main">${main}</div><div class="pq-sub"></div>`;
  p.hidden = false; void p.offsetWidth; p.classList.add('in');
}
function plaqueSub(html, cls = '') { const s = $('plaque').querySelector('.pq-sub'); if (s) s.insertAdjacentHTML('beforeend', `<p class="${cls}">${html}</p>`); }
function plaqueHide() { $('plaque').hidden = true; }
const SHORT = { barbaro: 'Rebote: 1 dado contra el otro enemigo', enano: 'Empujón: lo apartas 1 casilla', elfa: 'Paso ligero: +2 de movimiento', hechicero: 'Chispa: recarga una ronda antes', amazona: '¡Conmigo!: un aliado, +1 dado' };
function destinyLine(att, kind) {
  if (kind === 'comedy') return [`${fi('destiny', 'comedy')}<span><b class="good">Máscara alegre</b> · ${SHORT[att.kind]}</span>`, 'good'];
  if (kind === 'tragedy') return [`${fi('destiny', 'tragedy')}<span><b class="bad">Máscara trágica</b> · Ruido: +1 Presagio</span>`, 'bad'];
  return [`${fi('destiny', 'blank')}<span>Destino en blanco: nada más</span>`, 'none'];
}
function geminiVerdict(att, hit, C, T, noCounter) {
  const foeSide = att.side !== 'hero', net = C - T;
  const cnt = `${fi('gemini', 'comedy')}<b class="n">×${C}</b>${fi('gemini', 'tragedy')}<b class="n">×${T}</b>`;
  if (!C && !T) return [`<span>Sin máscaras</span>`, 'none'];
  if (!net) return [`${cnt}<span>se anulan</span>`, 'none'];
  if (net > 0) return foeSide ? [`${cnt}<span><b class="bad">${hit ? 'Te derriba: −2 de movimiento' : 'Falla, pero gana posición'}</b></span>`, 'bad'] : [`${cnt}<span><b class="good">${hit ? 'Éxito con ventaja: empujas' : 'Resquicio: +1 dado al aliado'}</b></span>`, 'good'];
  return foeSide ? [`${cnt}<span><b class="good">${hit ? 'Se le embota el arma' : 'Tropieza: te deja un hueco'}</b></span>`, 'good'] : [`${cnt}<span><b class="bad">${hit ? 'Éxito con coste: arma embotada' : noCounter ? 'Fallo' : 'Fracaso crítico: contraataque'}</b></span>`, 'bad'];
}
function clearTags() { anchors.filter((a) => a.tag).forEach((a) => a.el.remove()); anchors = anchors.filter((a) => !a.tag); }
async function lunge(u, target) {
  const p0 = u.root.position.clone(), dir = target.root.position.clone().sub(p0).setY(0).normalize();
  audio.sfx('swing');
  await U.tween(160, (k) => u.root.position.copy(p0).addScaledVector(dir, 0.55 * U.easeIn(k)));
  U.tween(220, (k) => u.root.position.copy(p0).addScaledVector(dir, 0.55 * (1 - k)));
}
function gesture(u) { const f = u.fig, y0 = f.userData.baseY; return U.tween(260, (k) => { f.position.y = y0 + Math.sin(k * Math.PI) * 0.22; }); }
async function hurt(u, n) {
  u.hp = Math.max(0, u.hp - n); badge(u);
  flash(u, '#ffffff'); shake(0.18 + n * 0.08); audio.sfx('hit');
  floatText(headOf(u, 1.05), `−${n}`, 'dmg');
  const f = u.fig; U.tween(260, (k) => { f.rotation.z = -0.25 * Math.sin(k * Math.PI); });
  if (u.hp <= 0) {
    audio.sfx(u.side === 'hero' ? 'heroDown' : 'bone');
    await U.tween(500, (k) => { u.model.rotation.x = -1.3 * U.easeOut(k); });
    await U.sleep(500);
    u.hp = u.maxHp; badge(u);
    floatText(headOf(u, 1.05), u.side === 'hero' ? 'Se levanta' : 'Otro igual ocupa su sitio', 'info');
    await U.tween(420, (k) => { u.model.rotation.x = -1.3 * (1 - k); });
  }
}
function setDoom(n) {
  S.doom = n;
  $('doom').innerHTML = `<span>Presagio</span>${Array.from({ length: 6 }, (_, i) => `<i class="${i < S.doom ? 'on' : ''}"></i>`).join('')}`;
}
async function addDoom() {
  setDoom(S.doom + 1); $('doom').classList.remove('bump'); void $('doom').offsetWidth; $('doom').classList.add('bump');
  audio.sfx('whisper', { dur: 0.9, vol: 0.7 });
  if (S.doom >= 6) { toast('El Presagio se llena: algo errante sube de la Hondura.'); await U.sleep(900); setDoom(0); return true; }
  return false;
}
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 3200); }

/* ======================================================================== tiradas */
const ZONE = { atk: W(2.15, 3.2), def: W(3.9, 3.2), destiny: W(3.02, 4.05), solo: W(2.6, 3.35), extra: W(4.55, 2.5), extraDef: W(5.4, 2.65) };
const from = (u) => new THREE.Vector3(u.root.position.x, 1.9, u.root.position.z + 0.7);
const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
const range = (n) => Array.from({ length: n }, (_, i) => i);
const HIT = (k) => k === 'skull' || k === 'skullT';
const isComedy = (k) => k === 'comedy' || k === 'shieldC';
const isTragedy = (k) => k === 'tragedy' || k === 'skullT';

/* Un intercambio de golpes: el atacante tira sus dados, el defensor los suyos.
   Devuelve lo que ha pasado para que cada sistema añada lo suyo. */
async function exchange(att, tgt, o) {
  const gem = S.mode === 'mascaras';
  const aType = gem ? (att.side === 'hero' ? 'gemini' : 'geminiFoe') : (att.side === 'hero' ? 'combat' : 'foe');
  const dType = gem ? (tgt.side === 'hero' ? 'gemini' : 'geminiFoe') : (tgt.side === 'hero' ? 'combat' : 'foe');
  const block = gem ? (k) => k === 'shieldC' : tgt.side === 'hero' ? (k) => k === 'wshield' : (k) => k === 'bshield';
  const nA = Math.max(1, o.atk), nD = Math.max(0, o.def);
  const A = range(nA).map(() => DICE3D.roll(aType)), D = range(nD).map(() => DICE3D.roll(dType));
  const za = o.zoneA || ZONE.atk, zd = o.zoneD || ZONE.def;
  const sa = DICE3D.slots(za, nA, 1.0, 3), sd = DICE3D.slots(zd, nD, 1.0, 3);
  const list = A.map((r, i) => ({ type: aType, face: r.i, from: from(att), to: sa[i], delay: i * 55, owner: 'a' }))
    .concat(D.map((r, i) => ({ type: dType, face: r.i, from: from(tgt), to: sd[i], delay: 140 + i * 55, owner: 'd' })));
  if (o.destiny) list.push({ type: 'destiny', face: o.destiny.i, from: from(att), to: ZONE.destiny, delay: 300, owner: 'x' });
  gesture(att); setTimeout(() => gesture(tgt), 140);
  const dice = await DICE3D.throw(list, { dur: 950 });
  zoomFit([att, tgt]);
  const ad = dice.filter((d) => d.owner === 'a'), dd = dice.filter((d) => d.owner === 'd'), xd = dice.find((d) => d.owner === 'x');
  const hits = ad.filter((d) => HIT(d.kind)), blocks = dd.filter((d) => block(d.kind));
  const dmg0 = Math.max(0, hits.length - blocks.length), shieldFace = gem ? 'shieldC' : tgt.side === 'hero' ? 'wshield' : 'bshield';
  plaque(o.caption || `${U.esc(att.name)} → ${U.esc(tgt.name)}`,
    `${fi(aType, 'skull')}<b class="n">×${hits.length}</b><i>−</i>${fi(dType, shieldFace)}<b class="n">×${blocks.length}</b><i>=</i>${dmg0 ? `<b class="dmg">${dmg0} de daño</b>` : '<b class="none">Sin daño</b>'}`, dmg0 ? 'hit' : 'miss');
  if (xd) { const [l, c] = destinyLine(att, xd.kind); plaqueSub(l, c); }
  if (gem) {
    const C = ad.filter((d) => isComedy(d.kind)).length, T = ad.filter((d) => isTragedy(d.kind)).length, defC = dd.filter((d) => d.kind === 'shieldC').length;
    const [l, c] = geminiVerdict(att, dmg0 > 0, C, T, o.noCounter); plaqueSub(l, c);
    if (defC) plaqueSub(`${fi(dType, 'shieldC')}<span>${U.esc(tgt.name)} bloquea con ventaja</span>`, 'none');
  }
  await U.sleep(120);
  await Promise.all([...hits.map((d) => DICE3D.glow(d, '#ff9a5a')), ...ad.filter((d) => !HIT(d.kind)).map((d) => DICE3D.dim(d)),
    ...blocks.map((d) => DICE3D.glow(d, '#8fc6ff')), ...dd.filter((d) => !block(d.kind)).map((d) => DICE3D.dim(d))]);
  // cada escudo anula una calavera
  const n = Math.min(hits.length, blocks.length);
  for (let i = 0; i < n; i++) {
    const s = blocks[i], k = hits[hits.length - 1 - i];
    await projectile(s.group.position.clone().setY(0.6), k.group.position.clone().setY(0.6), '#8fc6ff', { dur: 230, arc: 0.5, r: 0.09 });
    audio.sfx('block', { vol: 0.6 }); DICE3D.dim(s); DICE3D.dim(k);
  }
  const left = hits.slice(0, hits.length - n), dmg = left.length;
  if (att.side === 'hero' && (att.kind === 'elfa' || att.kind === 'hechicero')) audio.sfx(att.kind === 'elfa' ? 'arrow' : 'magic'); else lunge(att, tgt);
  if (dmg) {
    await Promise.all(left.map((d, i) => projectile(d.group.position.clone().setY(0.6), headOf(tgt), '#ff5a3a', { delay: i * 70, dur: 300, arc: 1.2 })));
    await hurt(tgt, dmg);
  } else { audio.sfx('block'); floatText(headOf(tgt, 1.05), 'Bloqueado', 'info'); }
  return { dmg, hits: hits.length, blocks: blocks.length, ad, dd, xd, nA, nD };
}

/* ---------------- el héroe ataca ---------------- */
async function heroAttack() {
  const h = units.hero, e = units.a, gem = S.mode === 'mascaras';
  let destiny = S.mode === 'destino' ? DICE3D.roll('destiny') : null;
  if (destiny && S.force) { const i = DICE3D.TYPES.destiny.faces.indexOf(S.force); if (i >= 0) destiny = { i, kind: S.force }; S.force = null; }
  const atk = h.atk + (h.status.blunt ? -1 : 0);
  delete h.status.blunt; badge(h);
  const r = await exchange(h, e, { atk, def: e.def, destiny });
  S.tally.attacks++; S.tally.dmg += r.dmg;
  const lines = [`${h.name} tira ${plural(r.nA, 'dado', 'dados')}: ${plural(r.hits, 'calavera', 'calaveras')}. ${e.name} para ${plural(r.blocks, 'golpe', 'golpes')}. ${r.dmg ? `<b>${r.dmg} de daño.</b>` : '<b>Sin daño.</b>'}`];
  if (r.xd) lines.push(await destinyEffect(h, r.xd, r.dmg));
  if (gem) lines.push(...(await geminiEffects(h, e, r)));
  report(lines);
}
/* ---------------- Dado del Destino ---------------- */
async function destinyEffect(h, xd, dmg) {
  await U.sleep(150);
  if (xd.kind === 'blank') { DICE3D.dim(xd); S.tally.blank++; return 'Destino en blanco: nada más.'; }
  if (xd.kind === 'tragedy') {
    S.tally.tragedy++; S.tally.effects++;
    await DICE3D.glow(xd, '#ff3a5a', 1.6); DICE3D.hop(xd);
    floatText(headOf(h, 1.15), '+1 Presagio', 'bad');
    const full = await addDoom();
    return `Destino: <b class="bad">máscara trágica</b>. El ruido atrae a la Hondura: +1 Presagio${full ? ' y se llena: sube un monstruo errante' : ''}.`;
  }
  S.tally.comedy++; S.tally.effects++;
  await DICE3D.glow(xd, '#ffd060', 1.8); DICE3D.hop(xd); audio.sfx('levelUp', { vol: 0.6 });
  const C = COMEDY[h.kind];
  floatText(headOf(h, 1.15), C.name, 'good');
  if (h.kind === 'barbaro') {
    const b = units.b;
    audio.sfx('swing');
    const r = DICE3D.roll('combat'), D = range(b.def).map(() => DICE3D.roll('foe'));
    const sd = DICE3D.slots(ZONE.extraDef, D.length, 0.95, 3);
    const dice = await DICE3D.throw([{ type: 'combat', face: r.i, from: from(h), to: ZONE.extra, owner: 'a' }].concat(D.map((q, i) => ({ type: 'foe', face: q.i, from: from(b), to: sd[i], delay: 120 + i * 50, owner: 'd' }))), { dur: 800, height: 1.8 });
    zoomFit([h, b]);
    const a = dice[0], blocks = dice.slice(1).filter((d) => d.kind === 'bshield');
    const hit = a.kind === 'skull' && !blocks.length;
    await Promise.all([HIT(a.kind) ? DICE3D.glow(a, '#ff9a5a') : DICE3D.dim(a), ...dice.slice(1).map((d) => (d.kind === 'bshield' ? DICE3D.glow(d, '#8fc6ff') : DICE3D.dim(d)))]);
    plaqueSub(`${fi('combat', HIT(a.kind) ? 'skull' : a.kind)}<span>Rebote contra ${U.esc(b.name)}: <b class="${hit ? 'dmg' : 'none'}">${hit ? '1 de daño' : HIT(a.kind) ? 'lo para' : 'falla'}</b></span>`, hit ? 'good' : 'none');
    if (hit) { await projectile(a.group.position.clone().setY(0.6), headOf(b), '#ff5a3a', { dur: 300 }); await hurt(b, 1); return `Destino: <b class="good">máscara alegre</b> · Rebote: el hachazo alcanza a ${b.name}, <b>1 de daño</b>.`; }
    floatText(headOf(b, 1.05), HIT(a.kind) ? 'Bloqueado' : 'Fallo', 'info');
    return `Destino: <b class="good">máscara alegre</b> · Rebote: 1 dado contra ${b.name}… ${HIT(a.kind) ? 'lo para con su escudo' : 'falla'}.`;
  }
  if (h.kind === 'enano') {
    const e = units.a, p0 = e.root.position.clone(), p1 = p0.clone().add(new THREE.Vector3(TS, 0, 0));
    audio.sfx('quake', { vol: 0.5 }); ring(p0, '#f0b070', 1.4);
    await U.tween(320, (k) => e.root.position.lerpVectors(p0, p1, U.easeOut(k)));
    e.status.push = 'Empujado'; badge(e);
    return `Destino: <b class="good">máscara alegre</b> · Empujón: ${e.name} retrocede una casilla.`;
  }
  if (h.kind === 'elfa') { ring(h.root.position, '#86e0a0', 1.6); h.status.mv = '+2 mov.'; badge(h); return 'Destino: <b class="good">máscara alegre</b> · Paso ligero: Lyriel gana +2 de movimiento este turno.'; }
  if (h.kind === 'hechicero') { ring(h.root.position, '#9fb8ff', 1.6); for (let i = 0; i < 6; i++) projectile(headOf(h, 0.9), headOf(h, 0.9).add(new THREE.Vector3(Math.cos(i) * 1.2, 0.8, Math.sin(i) * 1.2)), '#9fb8ff', { dur: 420, r: 0.05, arc: 0.3 }); h.status.cd = 'Recarga −1'; badge(h); return 'Destino: <b class="good">máscara alegre</b> · Chispa: la Bola de fuego estará lista una ronda antes.'; }
  const al = units.ally; ring(al.root.position, '#ffd27a', 1.6); flash(al, '#ffe0a0'); al.status.insp = 'Inspirado'; badge(al);
  return `Destino: <b class="good">máscara alegre</b> · ¡Conmigo!: ${al.name} queda Inspirado (+1 dado en su próximo ataque).`;
}
/* ---------------- máscaras al estilo Gemini ---------------- */
async function geminiEffects(att, tgt, r, counter) {
  const C = r.ad.filter((d) => isComedy(d.kind)).length, T = r.ad.filter((d) => isTragedy(d.kind)).length;
  const defC = r.dd.filter((d) => d.kind === 'shieldC').length;
  const out = [`Máscaras de ${att.name}: ${plural(C, 'alegre', 'alegres')} y ${plural(T, 'trágica', 'trágicas')}.`];
  r.ad.forEach((d) => { if (isComedy(d.kind)) ring(d.group.position, '#ffd060', 0.7, 700); if (isTragedy(d.kind)) ring(d.group.position, '#ff3a5a', 0.7, 700); });
  await U.sleep(250);
  const net = C - T, hit = r.dmg > 0, foeSide = att.side !== 'hero';
  if (defC) { S.tally.effects++; out.push(`${tgt.name} bloquea con ventaja (escudo con máscara alegre): se recoloca.`); floatText(headOf(tgt, 1.2), 'Bloqueo con ventaja', 'info'); }
  if (!C && !T) return out.concat('Sin máscaras: nada más.');
  if (net === 0) return out.concat('Las máscaras se anulan entre sí.');
  S.tally.effects++;
  if (net > 0) {
    S.tally.comedy++;
    if (hit && !foeSide) { const e = tgt, p0 = e.root.position.clone(); await U.tween(300, (k) => e.root.position.lerpVectors(p0, p0.clone().add(new THREE.Vector3(TS, 0, 0)), U.easeOut(k))); e.status.push = 'Empujado'; badge(e); floatText(headOf(att, 1.15), 'Éxito con ventaja', 'good'); return out.concat('<b class="good">Éxito con ventaja</b>: empujas al enemigo una casilla.'); }
    if (!hit && !foeSide) { const al = units.ally; al.status.insp = '+1 dado'; badge(al); ring(al.root.position, '#ffd27a', 1.4); floatText(headOf(att, 1.15), 'Resquicio', 'good'); return out.concat(`<b class="good">Fracaso con resquicio</b>: descubres un punto débil, ${al.name} tendrá +1 dado.`); }
    if (hit) { tgt.status.mv = '−2 mov.'; badge(tgt); floatText(headOf(tgt, 1.15), 'Derribado', 'bad'); return out.concat(`<b class="bad">El enemigo te derriba</b>: ${tgt.name} pierde 2 de movimiento.`); }
    floatText(headOf(att, 1.15), 'Se recoloca', 'info'); return out.concat('El enemigo falla, pero gana posición.');
  }
  S.tally.tragedy++;
  if (hit && !foeSide) { att.status.blunt = 'Arma embotada −1'; badge(att); floatText(headOf(att, 1.15), 'Éxito con coste', 'bad'); return out.concat('<b class="bad">Éxito con coste</b>: tu arma se embota, −1 dado en tu próximo ataque.'); }
  if (!hit && !foeSide && !counter) {
    floatText(headOf(att, 1.15), 'Fracaso crítico', 'bad');
    out.push('<b class="bad">Fracaso crítico</b>: el enemigo contraataca al instante.');
    await U.sleep(500); await DICE3D.clear(); clearTags(); await zoomOut();
    const c = await exchange(tgt, att, { atk: tgt.atk, def: att.def, zoneA: ZONE.def, zoneD: ZONE.atk, noCounter: true, caption: `Contraataque · ${U.esc(tgt.name)} → ${U.esc(att.name)}` });
    out.push(`Contraataque de ${tgt.name}: ${plural(c.hits, 'calavera', 'calaveras')} contra ${plural(c.blocks, 'escudo', 'escudos')}. ${c.dmg ? `<b>${c.dmg} de daño a ${att.name}.</b>` : 'Sin daño.'}`);
    return out;
  }
  if (hit) { floatText(headOf(att, 1.15), 'Golpe con coste', 'good'); return out.concat('Al enemigo se le embota el arma: −1 dado en su próximo ataque.'); }
  floatText(headOf(att, 1.15), 'Tropieza', 'good'); return out.concat('El enemigo tropieza: te deja un hueco.');
}

/* ---------------- el enemigo ataca ---------------- */
async function foeAttack() {
  const h = units.hero, e = units.a;
  const r = await exchange(e, h, { atk: e.atk, def: h.def, zoneA: ZONE.def, zoneD: ZONE.atk, noCounter: true });
  const lines = [`${e.name} tira ${plural(r.nA, 'dado', 'dados')}: ${plural(r.hits, 'calavera', 'calaveras')}. ${h.name} para ${plural(r.blocks, 'golpe', 'golpes')} con ${S.mode === 'mascaras' ? 'el escudo con máscara (1 cara de 6)' : 'escudos blancos (2 caras de 6)'}. ${r.dmg ? `<b>${r.dmg} de daño.</b>` : '<b>Sin daño.</b>'}`];
  if (S.mode === 'destino') lines.push('Los enemigos no tiran el Dado del Destino: su turno sigue igual de rápido.');
  if (S.mode === 'mascaras') lines.push(...(await geminiEffects(e, h, r, true)));
  report(lines);
}
/* ---------------- buscar: Dado del Tesoro ---------------- */
async function search() {
  const h = units.hero, r = DICE3D.roll('treasure');
  gesture(h);
  const [d] = await DICE3D.throw([{ type: 'treasure', face: r.i, from: from(h), to: ZONE.solo }], { dur: 1000 });
  zoomFit([h]);
  const good = d.kind === 'gold' || d.kind === 'potion' || d.kind === 'item';
  const dart = d.kind === 'danger' && Math.random() < 0.5;
  const LBL = { gold: 'Oro: +15 monedas', potion: 'Una poción', item: 'Un objeto: bomba', nothing: 'Nada', danger: dart ? 'Peligro: un dardo, −1 PV' : 'Peligro: ruido, +1 Presagio' };
  plaque(`${U.esc(h.name)} busca · Dado del Tesoro`, `${fi('treasure', d.kind)}<b class="${good ? 'good' : d.kind === 'danger' ? 'bad' : 'none'}">${LBL[d.kind]}</b>`, good ? 'hit' : 'miss');
  await DICE3D.glow(d, good ? '#ffd060' : d.kind === 'danger' ? '#ff3a5a' : '#bbbbbb', 1.4); DICE3D.hop(d);
  let txt = TREASURE[d.kind];
  if (d.kind === 'gold') { audio.sfx('gold'); floatText(headOf(h, 1.15), '+15 oro', 'gold'); }
  if (d.kind === 'potion') { audio.sfx('potion'); floatText(headOf(h, 1.15), '+1 poción', 'good'); }
  if (d.kind === 'item') { audio.sfx('chest'); floatText(headOf(h, 1.15), '+1 bomba', 'good'); }
  if (d.kind === 'nothing') floatText(headOf(h, 1.15), 'Nada', 'info');
  if (d.kind === 'danger') {
    if (dart) { audio.sfx('trap'); txt = 'Peligro: un dardo sale de la pared. −1 PV.'; await hurt(h, 1); }
    else { txt = 'Peligro: el ruido despierta algo. +1 Presagio.'; floatText(headOf(h, 1.15), '+1 Presagio', 'bad'); await addDoom(); }
  }
  report([`${h.name} busca en la sala. Dado del Tesoro: ${txt}`, 'Caras: oro, oro, poción, objeto, nada y peligro. Se tira una vez por sala.']);
}
/* ---------------- forzar una cerradura ---------------- */
async function forceLock() {
  const h = units.hero, need = 2;
  const R = range(3).map(() => DICE3D.roll('combat')), sl = DICE3D.slots(ZONE.solo, 3, 1.0, 3);
  gesture(h);
  const dice = await DICE3D.throw(R.map((r, i) => ({ type: 'combat', face: r.i, from: from(h), to: sl[i], delay: i * 60 })), { dur: 900 });
  zoomFit([h]);
  const sk = dice.filter((d) => d.kind === 'skull');
  await Promise.all([...sk.map((d) => DICE3D.glow(d, '#ff9a5a')), ...dice.filter((d) => d.kind !== 'skull').map((d) => DICE3D.dim(d))]);
  S.lockHave += sk.length;
  const ok = S.lockHave >= need;
  plaque(`${U.esc(h.name)} fuerza la cerradura`, `${fi('combat', 'skull')}<b class="n">×${sk.length}</b><i>→</i>${ok ? '<b class="good">¡Abierta!</b>' : `<b class="none">${S.lockHave} de ${need}</b>`}`, ok ? 'hit' : 'miss');
  audio.sfx(ok ? 'door' : 'deny');
  report([`${h.name} fuerza la cerradura: ${plural(sk.length, 'calavera', 'calaveras')}. ${ok ? '<b>Se abre.</b>' : `Lleva ${S.lockHave} de ${need}: las calaveras se suman en el siguiente intento.`}`]);
  if (ok) S.lockHave = 0;
}

/* ======================================================================== interfaz */
async function act(fn) {
  if (S.busy) return;
  audio.init();
  S.busy = true; document.body.classList.add('busy');
  try {
    clearTags(); plaqueHide(); await Promise.all([DICE3D.clear(), resetPlaces(), zoomOut()]);
    Object.values(units).forEach((u) => { const keep = u.side === 'hero' && u.status.blunt; u.status = keep ? { blunt: u.status.blunt } : {}; badge(u); });
    await fn();
  } catch (e) { console.error(e); }
  S.busy = false; document.body.classList.remove('busy'); renderStats();
}
function report(lines) {
  $('result').innerHTML = lines.map((l) => `<p>${l}</p>`).join('');
  S.log.unshift(lines.join(' ')); S.log = S.log.slice(0, 6);
  $('log').innerHTML = S.log.map((l) => `<li>${l}</li>`).join('');
}
function chip(id, label, sub, on, color) { return `<button class="chip ${on ? 'on' : ''}" data-id="${id}" ${color ? `style="--c:${color}"` : ''} aria-pressed="${on}"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</button>`; }
function renderSide() {
  $('modes').innerHTML = Object.entries(MODES).map(([id, m]) => `<button class="mode ${S.mode === id ? 'on' : ''}" data-mode="${id}" role="tab" aria-selected="${S.mode === id}"><b>${m.name}</b><small>${m.tag}</small></button>`).join('');
  $('mode-desc').textContent = MODES[S.mode].desc;
  $('mode-desc2').textContent = MODES[S.mode].desc;
  $('heroes').innerHTML = HEROES.map((id) => { const d = HERO_DEFS[id], s = d.stats; return chip(id, d.name, `${d.role} · ${s.hp} PV · ${s.atk} ataque · ${s.def} defensa`, S.hero === id, d.color); }).join('');
  $('foes').innerHTML = FOES.map((id) => { const d = ENEMY_TYPES[id]; return chip(id, d.name, `${d.hp} PV · ${d.atk} ataque · ${d.def} defensa`, S.foe === id); }).join('');
  $('legend').innerHTML = S.mode === 'destino'
    ? `<p><b>Máscara alegre de ${HERO_DEFS[S.hero].name}: ${COMEDY[S.hero].name}.</b> ${COMEDY[S.hero].text}</p><p><b>Máscara trágica (todos):</b> el ruido sube 1 el Presagio. Al llenarse, sube un monstruo errante.</p><ul class="cl">${HEROES.filter((id) => id !== S.hero).map((id) => `<li><b>${HERO_DEFS[id].name}</b> · ${COMEDY[id].name}: ${COMEDY[id].text}</li>`).join('')}</ul>`
    : S.mode === 'mascaras'
      ? '<p>Si salen más máscaras alegres que trágicas: con daño, <b>empujas</b>; sin daño, <b>+1 dado a un aliado</b>. Si salen más trágicas: con daño, <b>arma embotada</b> (−1 dado); sin daño, <b>contraataque inmediato</b>. Si se igualan, se anulan.</p>'
      : '<p>Sin efectos extra: cada calavera que no para un escudo es 1 de daño.</p>';
  U.$$('#modes .mode').forEach((b) => (b.onclick = () => { if (S.busy) return; S.mode = b.dataset.mode; audio.init(); audio.sfx('ui'); clearTags(); plaqueHide(); DICE3D.clear(); renderSide(); renderStats(); }));
  U.$$('#heroes .chip').forEach((b) => (b.onclick = () => { if (S.busy) return; S.hero = b.dataset.id; audio.init(); audio.sfx('ui'); clearTags(); plaqueHide(); DICE3D.clear(); buildUnits(); renderStats(); }));
  U.$$('#foes .chip').forEach((b) => (b.onclick = () => { if (S.busy) return; S.foe = b.dataset.id; audio.init(); audio.sfx('ui'); clearTags(); plaqueHide(); DICE3D.clear(); buildUnits(); renderStats(); }));
}

/* ---------------- números: teoría y comparación ---------------- */
function binom(n, p) { const out = []; let c = 1; for (let k = 0; k <= n; k++) { out.push(c * Math.pow(p, k) * Math.pow(1 - p, n - k)); c = (c * (n - k)) / (k + 1); } return out; }
function dmgStats(nA, nD, pBlock) {
  const A = binom(nA, 0.5), D = binom(nD, pBlock); let exp = 0, any = 0;
  A.forEach((pa, a) => D.forEach((pd, d) => { const x = Math.max(0, a - d); exp += pa * pd * x; if (x > 0) any += pa * pd; }));
  return { exp, any };
}
/* Máscaras con n dados: cada dado 2/6 alegre, 2/6 trágica, 2/6 nada */
function maskStats(n) {
  let pos = 0, neg = 0;
  for (let c = 0; c <= n; c++) for (let t = 0; t + c <= n; t++) {
    const ways = fact(n) / (fact(c) * fact(t) * fact(n - c - t)), p = ways * Math.pow(1 / 3, n);
    if (c > t) pos += p; else if (t > c) neg += p;
  }
  return { pos, neg, any: pos + neg };
}
function fact(n) { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; }
function rows() {
  const h = HERO_DEFS[S.hero].stats, e = ENEMY_TYPES[S.foe];
  const out = [];
  const you = dmgStats(h.atk, e.def, 1 / 6), them = dmgStats(e.atk, h.def, 1 / 3), themG = dmgStats(e.atk, h.def, 1 / 6);
  const mh = maskStats(h.atk), mf = maskStats(e.atk), mTyp = (maskStats(3).any * 8);
  out.push({ id: 'clasico', name: 'Clásico', you, them, good: 0, bad: 0, read: 0, typical: 0 });
  out.push({ id: 'destino', name: 'Clásico + Destino', you, them, good: 1 / 3, bad: 1 / 6, read: 1 / 2, typical: 3 / 2 });
  out.push({ id: 'mascaras', name: 'Máscaras de Gemini', you, them: themG, good: mh.pos, bad: mh.neg, read: mh.any + mf.any, typical: mTyp });
  return out;
}
const pc = (p) => `${Math.round(p * 100)} %`;
function renderStats() {
  const R = rows(), cur = R.find((r) => r.id === S.mode);
  const h = HERO_DEFS[S.hero], e = ENEMY_TYPES[S.foe];
  $('now').innerHTML = `
    <div><dt>${h.name} hiere al ${e.name.toLowerCase()}</dt><dd>${pc(cur.you.any)}</dd><small>daño medio ${cur.you.exp.toFixed(2)}</small></div>
    <div><dt>El ${e.name.toLowerCase()} hiere a ${h.name}</dt><dd>${pc(cur.them.any)}</dd><small>daño medio ${cur.them.exp.toFixed(2)}</small></div>
    <div><dt>Ataques con ventaja</dt><dd>${pc(cur.good)}</dd><small>${S.mode === 'destino' ? 'máscara alegre' : S.mode === 'mascaras' ? 'más alegres que trágicas' : 'no hay'}</small></div>
    <div><dt>Ataques con contratiempo</dt><dd>${pc(cur.bad)}</dd><small>${S.mode === 'destino' ? 'máscara trágica' : S.mode === 'mascaras' ? 'más trágicas que alegres' : 'no hay'}</small></div>`;
  $('cmp').innerHTML = `<thead><tr><th>Sistema</th><th>Daño que haces</th><th>Daño que recibes</th><th>Con ventaja</th><th>Con contratiempo</th><th>Efectos que leer en una ronda típica</th></tr></thead><tbody>${R.map((r) => `<tr class="${r.id === S.mode ? 'on' : ''}"><th>${r.name}</th><td>${r.you.exp.toFixed(2)}</td><td>${r.them.exp.toFixed(2)}</td><td>${r.good ? pc(r.good) : '—'}</td><td>${r.bad ? pc(r.bad) : '—'}</td><td>${r.typical ? `≈ ${r.typical.toFixed(1)}` : '0'}</td></tr>`).join('')}</tbody>`;
  const T = S.tally;
  $('tally').textContent = T.attacks ? `En esta sesión: ${plural(T.attacks, 'ataque', 'ataques')} de héroe, ${T.dmg} de daño en total (${(T.dmg / T.attacks).toFixed(2)} por ataque), ${plural(T.comedy, 'ventaja', 'ventajas')} y ${plural(T.tragedy, 'contratiempo', 'contratiempos')}.` : 'Aún no has tirado en esta sesión.';
}

/* ======================================================================== bucle */
function loop() {
  requestAnimationFrame(loop);
  const raw = Math.min(0.1, clock.getDelta()), t = clock.elapsedTime;
  U.updateTweens(raw);
  Object.values(units).forEach((u) => { const f = u.fig; if (f) f.scale.y = f.userData.baseS * (1 + Math.sin(t * 2 + u.ph) * 0.012); if (u.mini.uFlash.value > 0) u.mini.uFlash.value = Math.max(0, u.mini.uFlash.value - raw * 3); });
  torches.forEach((q) => { const k = 0.85 + Math.sin(t * 9 + q.ph) * 0.08 + Math.sin(t * 23 + q.ph * 2) * 0.06; q.L.intensity = 2.2 * k; q.fl.scale.setScalar(k); });
  if (camera.userData.base) {
    shakeT = Math.max(0, shakeT - raw * 1.6);
    camera.position.copy(camera.userData.base).add(new THREE.Vector3((Math.random() - 0.5) * shakeT, (Math.random() - 0.5) * shakeT, 0));
    camera.lookAt(camera.userData.target);
  }
  MINI.update(camera);
  renderer.render(scene, camera);
  // etiquetas sobre el tablero
  const st = $('stage'), w = st.clientWidth, hgt = st.clientHeight, v = new THREE.Vector3(), now = performance.now();
  anchors.forEach((a) => {
    v.copy(a.at()).project(camera);
    let y = (-v.y * 0.5 + 0.5) * hgt;
    if (a.t0) { const k = (now - a.t0) / a.life; y -= k * 40; a.el.style.opacity = String(Math.max(0, 1 - Math.max(0, k - 0.6) / 0.4)); }
    a.el.style.transform = `translate(${((v.x * 0.5 + 0.5) * w).toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
  });
}

function start() {
  initScene(); buildUnits(); setDoom(0); renderStats();
  report(['Elige un sistema arriba y pulsa <b>Atacar</b>: los dados caen sobre el tablero, el resultado aparece en el cartel de arriba y se aplica en la escena.']);
  $('do-attack').onclick = () => act(heroAttack);
  $('do-defend').onclick = () => act(foeAttack);
  $('do-search').onclick = () => act(search);
  $('do-lock').onclick = () => act(forceLock);
  $('do-speed').innerHTML = `${icon('ffwd')}<i class="lb">Animación</i> <span>Normal</span>`; $('do-sound').innerHTML = `${icon('sound')}<i class="lb">Sonido</i> <span>Sí</span>`;
  $('do-speed').onclick = () => { U.speed = U.speed > 1 ? 1 : 2; $('do-speed').setAttribute('aria-pressed', String(U.speed > 1)); $('do-speed').querySelector('span').textContent = U.speed > 1 ? 'Rápida' : 'Normal'; };
  $('do-sound').onclick = () => { audio.init(); audio.setMuted(!audio.muted); $('do-sound').setAttribute('aria-pressed', String(!audio.muted)); $('do-sound').innerHTML = `${icon(audio.muted ? 'mute' : 'sound')}<i class="lb">Sonido</i> <span>${audio.muted ? 'No' : 'Sí'}</span>`; };
  document.addEventListener('keydown', (e) => { if (e.target.closest && e.target.closest('input,select,textarea')) return; const k = e.key.toLowerCase(); if (k === 'a') act(heroAttack); if (k === 'r') act(foeAttack); if (k === 'b') act(search); if (k === 'c') act(forceLock); });
  window.__probador = { S, act, heroAttack, foeAttack, search, forceLock, units: () => units };
  loop();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
