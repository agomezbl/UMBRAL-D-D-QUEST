/* ==========================================================================
   Arranque, bucle principal, entrada (ratón, táctil, teclado) y ajustes
   ========================================================================== */
const SETTINGS = Object.assign({
  quality: (() => { const touch = U.isTouch(), cores = navigator.hardwareConcurrency || 4; if (touch && Math.min(screen.width, screen.height) < 820) return 'medio'; return cores <= 4 ? 'medio' : 'alto'; })(),
  autoQ: true, tilt: true, shake: true, flashes: true, music: 0.55, sfx: 0.85, amb: 0.6, voice: 'narrador', textSpeed: 'normal', autoText: false,
  speed: 1, follow: true, confirmTouch: true, quickEnemyDice: true, detOffer: true, textSize: 'normal', contrast: false
}, U.store.get('umbral.settings', {}));

const INPUT = {
  pts: new Map(), drag: false, keys: {},
  init() {
    const c = ENGINE.renderer.domElement;
    c.style.touchAction = 'none';
    c.addEventListener('pointerdown', (e) => this.down(e));
    window.addEventListener('pointermove', (e) => this.move(e));
    window.addEventListener('pointerup', (e) => this.up(e));
    window.addEventListener('pointercancel', (e) => { this.pts.delete(e.pointerId); this.gesture = null; });
    c.addEventListener('wheel', (e) => { e.preventDefault(); ENGINE.zoom(e.deltaY > 0 ? 1.1 : 0.9); }, { passive: false });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => this.key(e, true));
    window.addEventListener('keyup', (e) => this.key(e, false));
    // en táctil el navegador lanza «pointerleave» justo después de cada toque: solo cuenta el ratón
    c.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !this.pts.size) { UI.preview(null); WORLD.setHover(null); GAME.showPreview(null); this.hoverK = null; } });
  },
  ground(cx, cy) {
    const r = ENGINE.raycaster; r.setFromCamera(ENGINE.ndc(cx, cy), ENGINE.camera);
    const v = new THREE.Vector3(); return r.ray.intersectPlane(ENGINE.groundPlane, v) ? v : null;
  },
  down(e) {
    audio.init();
    UI.closeItems();
    this.pts.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), b: e.button, type: e.pointerType });
    try { e.target.setPointerCapture(e.pointerId); } catch (er) {}
    if (this.pts.size === 1) this.drag = false;
    if (this.pts.size === 2) {
      const [a, b] = [...this.pts.values()];
      this.gesture = { d: Math.hypot(a.x - b.x, a.y - b.y), ang: Math.atan2(b.y - a.y, b.x - a.x), my: (a.y + b.y) / 2, dist: ENGINE.cam.t.dist, yaw: ENGINE.cam.t.yaw, pitch: ENGINE.cam.t.pitch };
      this.drag = true;
    }
  },
  move(e) {
    const p = this.pts.get(e.pointerId);
    if (!p) { if (e.pointerType === 'mouse' && e.target === ENGINE.renderer.domElement) this.hover(e.clientX, e.clientY); return; }
    const px = p.x, py = p.y; p.x = e.clientX; p.y = e.clientY;
    if (this.pts.size === 2 && this.gesture) {
      const [a, b] = [...this.pts.values()], g = this.gesture;
      const d = Math.hypot(a.x - b.x, a.y - b.y), ang = Math.atan2(b.y - a.y, b.x - a.x), my = (a.y + b.y) / 2;
      ENGINE.cam.t.dist = U.clamp(g.dist * g.d / Math.max(20, d), 9, 58);
      ENGINE.cam.t.yaw = g.yaw - (ang - g.ang);
      ENGINE.cam.t.pitch = U.clamp(g.pitch + (my - g.my) * 0.004, 0.5, 1.42);
      return;
    }
    if (!this.drag && Math.hypot(p.x - p.sx, p.y - p.sy) > (p.type === 'touch' ? 10 : 6)) this.drag = true;
    if (!this.drag) return;
    if (p.b === 2 || (p.type === 'mouse' && e.shiftKey)) { ENGINE.rotate(-(p.x - px) * 0.006); ENGINE.tilt((p.y - py) * 0.004); return; }
    const g0 = this.ground(px, py), g1 = this.ground(p.x, p.y);
    if (g0 && g1) { ENGINE.panWorld(g0.x - g1.x, g0.z - g1.z); ENGINE.cam.target.x += g0.x - g1.x; ENGINE.cam.target.z += g0.z - g1.z; }
  },
  up(e) {
    const p = this.pts.get(e.pointerId); if (!p) return;
    this.pts.delete(e.pointerId);
    if (this.pts.size < 2) this.gesture = null;
    if (this.drag || p.b !== 0 || this.pts.size) { if (!this.pts.size) this.drag = false; return; }
    if (performance.now() - p.t > 700) return;
    if (e.target !== ENGINE.renderer.domElement && !(e.target && e.target.id === 'stage')) return;
    if (!UI.$('dlg').hidden) { UI.advance(); return; }
    if (GAME.state !== 'play') return;
    const hit = ENGINE.pick(e.clientX, e.clientY, GAME.allUnits().filter((u) => u.mesh && u.mesh.visible));
    if (!hit) return;
    GAME.click(hit.x, hit.y, p.type !== 'mouse');
  },
  hover(cx, cy) {
    if (GAME.state !== 'play' || GAME.busy || GAME.phase !== 'hero') { if (this.hoverK) { UI.preview(null); WORLD.setHover(null); GAME.showPreview(null); this.hoverK = null; } return; }
    const hit = ENGINE.pick(cx, cy, GAME.allUnits().filter((u) => u.mesh && u.mesh.visible));
    const k = hit ? U.key(hit.x, hit.y) + (GAME.mode ? GAME.mode.key : '') : null;
    if (k === this.hoverK) return;
    this.hoverK = k;
    if (!hit) { UI.preview(null); WORLD.setHover(null); GAME.showPreview(null); GAME.showThreat(null); return; }
    const d = GAME.describe(hit.x, hit.y);
    UI.preview(d); GAME.showPreview(d);
    GAME.showThreat(d && d.unit && d.unit.side === 'enemy' && !GAME.mode ? d.unit : null);
    const t = GAME.T(hit.x, hit.y);
    WORLD.setHover(t && (t.floor || t.door) && WORLD.L.rooms[t.room] && (t.door || WORLD.L.rooms[t.room].revealed) ? hit : null);
  },
  key(e, down) {
    const k = e.key.toLowerCase();
    if (e.target && /input|select|textarea/i.test(e.target.tagName)) return;
    this.keys[k] = down;
    if (!down) return;
    if (UI.handoffOpen) { if (k === ' ' || k === 'enter') { e.preventDefault(); UI.handoffDone(); } return; }
    if (!UI.$('dlg').hidden && (k === ' ' || k === 'enter')) { e.preventDefault(); UI.advance(); return; }
    // los escritos también se cierran con el teclado
    if (!UI.$('note').hidden && (k === ' ' || k === 'enter' || k === 'escape')) { e.preventDefault(); UI.$('note').dispatchEvent(new PointerEvent('pointerup')); return; }
    if (k === 'enter' && TUTOR.active && TUTOR.el && !TUTOR.el.panel.hidden && !TUTOR.el.next.hidden) { e.preventDefault(); TUTOR.el.next.click(); return; }
    if (k === 'g' && (GAME.state === 'play' || GAME.state === 'camp')) { UI.sheet(); return; }
    if (k === 'escape' && !UI.$('sheet').hidden) { UI.$('sheet').hidden = true; return; }
    if (GAME.state !== 'play') { if (k === 'escape' && GAME.state === 'camp') UI.pause(); return; }
    const map = { '1': 'attack', '2': 's0', '3': 's1' };
    if (map[k]) { GAME.action(map[k]); return; }
    if (k === '4') { UI.togglePop('acts-pop'); return; }
    if (k === '5') { UI.togglePop('items-pop'); return; }
    if (k === 'z') { GAME.action('undo'); return; }
    if (k === ' ') { e.preventDefault(); GAME.action('end'); return; }
    if (k === 'tab') { e.preventDefault(); GAME.action('next'); return; }
    if (k === 'escape') { if (GAME.mode) GAME.action('cancel'); else if (!UI.$('screen').hidden) UI.screen(null); else UI.pause(); return; }
    if (k === 'q') ENGINE.rotate(Math.PI / 4); if (k === 'e') ENGINE.rotate(-Math.PI / 4);
    if (k === 'r') ENGINE.tilt(0.12); if (k === 'f') ENGINE.tilt(-0.12);
    if (k === '+' || k === '=') ENGINE.zoom(0.88); if (k === '-') ENGINE.zoom(1.12);
    if (k === 'c') { const h = GAME.active; if (h) ENGINE.focusTile(h.x, h.y); }
    if (k === 'v') UI.$('btn-view').click();
  },
  update(dt) {
    const K = this.keys; let dx = 0, dz = 0;
    if (K.w || K.arrowup) dz += 1; if (K.s || K.arrowdown) dz -= 1; if (K.a || K.arrowleft) dx -= 1; if (K.d || K.arrowright) dx += 1;
    if ((dx || dz) && (GAME.state === 'play')) ENGINE.pan(dx * dt * 160, dz * dt * 160);
  }
};

const MAIN = {
  last: 0, fpsT: 0, fpsN: 0, slow: 0,
  async boot() {
    const ld = document.getElementById('loading-text');
    const say = (t) => { if (ld) ld.textContent = t; };
    if (!window.THREE || !THREE.EffectComposer || !THREE.UnrealBloomPass) {
      say('No se pudo cargar el motor 3D. Comprueba tu conexión a internet y recarga la página.');
      return;
    }
    try {
      ENGINE.qName = SETTINGS.quality; TEX.size = SETTINGS.quality === 'bajo' || SETTINGS.quality === 'minimo' ? 256 : 512;
      say('Encendiendo las antorchas…');
      await U.nextFrame();
      ENGINE.tiltOn = SETTINGS.tilt;
      ENGINE.init(document.getElementById('stage'));
      FX.init(); UI.init(); INPUT.init();
      this.applySettings(false, true);
      say('Tallando las miniaturas…');
      await U.nextFrame();
      UI.portraits = ENGINE.portraits([
        { id: 'aldric', kind: 'aldric', bg: '#18202e' }, { id: 'sera', kind: 'sera', bg: '#16221c' }, { id: 'elian', kind: 'elian', bg: '#1e1830' },
        { id: 'brunna', kind: 'brunna', bg: '#2a1a10' }, { id: 'nyra', kind: 'nyra', bg: '#2a1420' },
        { id: 'isolde', kind: 'isolde', opts: { small: true }, bg: '#241f1a' }, { id: 'malakor', kind: 'malakor', bg: '#0c1a12' }, { id: 'ignis', kind: 'ignis', bg: '#2a0d06' },
        { id: 'aethelgard', kind: 'aethelgard', bg: '#0c1a2a' }, { id: 'thrain', kind: 'thrain', bg: '#0c1a22' }, { id: 'tomas', kind: 'tomas', bg: '#101a24' }
      ]);
      say('Abriendo la Hondura…');
      await U.nextFrame();
      this.titleScene();
      document.getElementById('loading').classList.add('done');
      setTimeout(() => { const l = document.getElementById('loading'); if (l) l.remove(); }, 1200);
      requestAnimationFrame((t) => this.loop(t));
      UI.title();
    } catch (err) {
      console.error(err);
      say('Algo ha fallado al preparar la mazmorra: ' + (err && err.message ? err.message : err));
    }
  },
  loop(t) {
    requestAnimationFrame((tt) => this.loop(tt));
    // el tiempo real manda: en un aparato lento las animaciones dan saltos, pero no van a cámara lenta
    // (así cuadran con los temporizadores de la interfaz, que van por reloj)
    const raw = Math.max(0, (t - (this.last || t)) / 1000); this.last = t;
    const dt = Math.min(0.1, raw);
    U.updateTweens(Math.min(1, raw));
    INPUT.update(dt);
    if (this.titleOrbit || GAME.campOrbit) ENGINE.cam.t.yaw += dt * (this.titleOrbit ? 0.035 : 0.05);
    WORLD.update(dt);
    FX.update(dt);
    ENGINE.render(dt);
    // calidad adaptativa
    this.fpsT += Math.min(1, raw); this.fpsN++;
    if (this.fpsT > 4) {
      const fps = this.fpsN / this.fpsT; this.fpsT = 0; this.fpsN = 0;
      if (SETTINGS.autoQ && GAME.state === 'play' && fps < 26) {
        this.slow++;
        if (this.slow >= 2 && ENGINE.qName !== 'minimo') {
          const nq = ENGINE.qName === 'alto' ? 'medio' : ENGINE.qName === 'medio' ? 'bajo' : 'minimo';
          SETTINGS.quality = nq; this.applySettings(true, true); this.slow = 0;
          UI.toast(`Calidad gráfica ajustada a ${QUALITY[nq].label.toLowerCase()} para que el juego vaya fluido.`);
        }
      } else this.slow = 0;
    }
  },
  titleScene() {
    if (this.titleBuilt && WORLD.L && this.titleOrbit) return;
    WORLD.build(CHAPTERS[0], 'crypt');
    GAME.heroes = ['aldric', 'sera', 'elian'].map((id) => GAME.makeHero(id));
    GAME.enemies = []; GAME.npcs = [];
    GAME.heroes.forEach((h) => { const s = WORLD.L.starts[HERO_DEFS[h.id].start]; h.x = s.x; h.y = s.y; WORLD.addUnit(h, { face: Math.PI * 0.8 }); });
    const L = WORLD.L;
    const start = L.rooms[L.T[L.starts['1'].y][L.starts['1'].x].room];
    WORLD.revealRoom(start.id, null, true);
    const sp = L.starts['1'];
    ENGINE.focusTile(sp.x + 0.3, sp.y, { dist: 16, pitch: 0.62, yaw: 0.95, instant: true });
    ENGINE.keyPos.set(sp.x * TILE, 0, sp.y * TILE); ENGINE.key.target.position.copy(ENGINE.keyPos);
    audio.startAmbient('crypt');
    this.titleOrbit = true; this.titleBuilt = true;
  },
  stopTitle() { this.titleOrbit = false; this.wake(); },
  fullscreen() {
    try {
      const d = document, el = d.documentElement;
      if (d.fullscreenElement) d.exitFullscreen && d.exitFullscreen().catch(() => {});
      else if (el.requestFullscreen) el.requestFullscreen().catch(() => UI.toast('Este navegador no permite pantalla completa aquí.'));
      else UI.toast('Este navegador no permite pantalla completa aquí.');
    } catch (e) { UI.toast('Este navegador no permite pantalla completa aquí.'); }
  },
  async wake() { try { if ('wakeLock' in navigator && !this.lock) { this.lock = await navigator.wakeLock.request('screen'); this.lock.addEventListener('release', () => (this.lock = null)); } } catch (e) {} },
  applySettings(qChanged, silent) {
    const S = SETTINGS;
    if (qChanged && !silent) S.autoQ = false;
    audio.vol.music = S.music; audio.vol.sfx = S.sfx; audio.vol.amb = S.amb; audio.voiceMode = S.voice; audio.applyVolumes();
    U.speed = S.speed;
    // lectura: tamaño de letra y alto contraste
    document.body.classList.toggle('txt-grande', S.textSize === 'grande');
    document.body.classList.toggle('txt-enorme', S.textSize === 'enorme');
    document.body.classList.toggle('contraste', !!S.contrast);
    ENGINE.tiltOn = S.tilt;
    if (qChanged) ENGINE.setQuality(S.quality);
    if (ENGINE.final) ENGINE.final.uniforms.uTilt.value = S.tilt ? ENGINE.q.tilt : 0;
    U.store.set('umbral.settings', S);
  }
};

window.UMBRAL = { GAME, ENGINE, WORLD, UI, FX, MAIN, SETTINGS, U, audio, RULES, VIRTUES, TALENTS, VIGILS, DIFFICULTY, HERO_DEFS, HERO_IDS, ENEMY_TYPES, CHAPTERS, SHOP, GEAR, SLOTS, STATUS, TUTOR, TUTORIAL, DESCENT };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => MAIN.boot()); else MAIN.boot();
