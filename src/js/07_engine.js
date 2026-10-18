/* ==========================================================================
   Motor: render, posprocesado, cámara táctica, reserva de luces y selección
   ========================================================================== */
const TILE = 2;
const QUALITY = {
  bajo: { dpr: 1, shadows: false, shadowSize: 512, lights: 3, bloom: false, mist: false, tilt: 0, msaa: 0, particles: 0.4, label: 'Bajo' },
  medio: { dpr: 1.5, shadows: true, shadowSize: 1024, lights: 4, bloom: true, mist: true, tilt: 0, msaa: 2, particles: 0.7, label: 'Medio' },
  alto: { dpr: 2, shadows: true, shadowSize: 2048, lights: 6, bloom: true, mist: true, tilt: 0.55, msaa: 4, particles: 1, label: 'Alto' }
};

const ENGINE = {
  q: null, qName: 'alto', time: 0, dt: 0,
  cam: { target: new THREE.Vector3(10, 0, 10), yaw: 0.6, pitch: 0.95, dist: 26, t: { target: new THREE.Vector3(10, 0, 10), yaw: 0.6, pitch: 0.95, dist: 26 }, shake: 0, bounds: null, lambda: 6 },
  lightSources: [], pool: [], fxLights: [],
  fx: { damage: 0, flash: 0, desat: 0, fade: 0, desatT: 0, fadeT: 0 },

  init(container) {
    const renderer = this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', alpha: false });
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x050404, 1);
    container.appendChild(renderer.domElement);
    TEX.aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    this.isWebGL2 = renderer.capabilities.isWebGL2;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050404);
    this.scene.fog = new THREE.FogExp2(0x050404, 0.012);
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.5, 220);

    this.hemi = new THREE.HemisphereLight(0x46566e, 0x140e0a, 1.0);
    this.scene.add(this.hemi);
    this.ambient = new THREE.AmbientLight(0x2a2630, 0.5);
    this.scene.add(this.ambient);

    // farol del grupo: foco cálido sobre el héroe activo (única luz con sombra)
    const key = this.key = new THREE.SpotLight(0xffd7a0, 2.6, 34, 0.6, 0.7, 1.2);
    key.position.set(10, 12, 14);
    key.castShadow = true;
    key.shadow.bias = -0.0008; key.shadow.normalBias = 0.02;
    key.shadow.camera.near = 2; key.shadow.camera.far = 32;
    this.scene.add(key); this.scene.add(key.target);
    this.keyPos = new THREE.Vector3(10, 0, 10);

    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.setQuality(this.qName, true);
    window.addEventListener('resize', () => this.resize());
    if (window.visualViewport) window.visualViewport.addEventListener('resize', () => this.resize());
  },

  setQuality(name, first) {
    this.qName = name; const q = this.q = QUALITY[name];
    const dpr = Math.min(window.devicePixelRatio || 1, q.dpr);
    this.dpr = dpr;
    this.renderer.setPixelRatio(dpr);
    const needsRecompile = !first && this.renderer.shadowMap.enabled !== q.shadows;
    this.renderer.shadowMap.enabled = q.shadows;
    this.renderer.shadowMap.type = name === 'alto' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    this.key.castShadow = q.shadows;
    this.key.shadow.mapSize.set(q.shadowSize, q.shadowSize);
    if (this.key.shadow.map) { this.key.shadow.map.dispose(); this.key.shadow.map = null; }
    // reserva de luces puntuales de antorcha (número fijo => sin recompilaciones)
    this.pool.forEach((l) => this.scene.remove(l.light));
    this.pool = [];
    for (let i = 0; i < q.lights; i++) {
      const light = new THREE.PointLight(0xff9a4a, 0, 12, 1.5);
      light.position.set(0, -50, 0);
      this.scene.add(light);
      this.pool.push({ light, src: null, w: 0 });
    }
    if (!this.fxLights.length) for (let i = 0; i < 2; i++) { const l = new THREE.PointLight(0xffffff, 0, 9, 1.8); l.position.set(0, -50, 0); this.scene.add(l); this.fxLights.push({ light: l, t: 0, dur: 0, peak: 0, follow: null }); }
    this.buildComposer();
    if (needsRecompile) this.scene.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (m.needsUpdate = true)); });
    this.resize();
  },

  buildComposer() {
    const q = this.q, r = this.renderer;
    const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
    if (this.composer) { this.composer.renderTarget1.dispose(); this.composer.renderTarget2.dispose(); }
    const rt = new THREE.WebGLRenderTarget(w * this.dpr, h * this.dpr, { type: this.isWebGL2 ? THREE.HalfFloatType : THREE.UnsignedByteType, samples: this.isWebGL2 ? q.msaa : 0 });
    const comp = this.composer = new THREE.EffectComposer(r, rt);
    comp.setPixelRatio(this.dpr);
    comp.addPass(new THREE.RenderPass(this.scene, this.camera));
    if (q.bloom) { this.bloom = new THREE.UnrealBloomPass(new THREE.Vector2(w, h), 0.85, 0.55, 0.78); comp.addPass(this.bloom); } else this.bloom = null;
    this.final = new THREE.ShaderPass(SHADERS.finalPass());
    this.final.uniforms.uTilt.value = q.tilt * (this.tiltOn === false ? 0 : 1);
    comp.addPass(this.final);
  },

  resize() {
    const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
    this.w = w; this.h = h;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    // en vertical ampliamos el campo de visión para no perder el tablero
    this.camera.fov = w < h ? 50 : 38;
    this.camera.updateProjectionMatrix();
    if (this.composer) { this.composer.setPixelRatio(this.dpr); this.composer.setSize(w, h); }
    if (this.final) this.final.uniforms.uRes.value.set(w * this.dpr, h * this.dpr);
  },

  /* ---------------- cámara ---------------- */
  focus(x, z, o = {}) {
    const c = this.cam.t;
    c.target.set(x, 0, z);
    if (o.dist != null) c.dist = o.dist;
    if (o.pitch != null) c.pitch = o.pitch;
    if (o.yaw != null) c.yaw = o.yaw;
    if (o.instant) { this.cam.target.copy(c.target); this.cam.dist = c.dist; this.cam.pitch = c.pitch; this.cam.yaw = c.yaw; }
  },
  focusTile(gx, gy, o) { this.focus(gx * TILE, gy * TILE, o); },
  async focusWait(gx, gy, o = {}) {
    this.focusTile(gx, gy, o);
    if (U.instant) return;
    const t0 = performance.now(), maxT = o.max || 900;
    while (performance.now() - t0 < maxT) {
      await U.nextFrame();
      if (this.cam.target.distanceTo(this.cam.t.target) < 0.25 && Math.abs(this.cam.dist - this.cam.t.dist) < 0.5) break;
    }
  },
  rotate(d) { this.cam.t.yaw += d; },
  zoom(f) { this.cam.t.dist = U.clamp(this.cam.t.dist * f, 9, 58); },
  tilt(d) { this.cam.t.pitch = U.clamp(this.cam.t.pitch + d, 0.5, 1.42); },
  pan(dx, dz) {
    const yaw = this.cam.yaw, s = this.cam.dist * 0.0018;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    this.cam.t.target.x += (rx * dx + fx * dz) * s * 10;
    this.cam.t.target.z += (rz * dx + fz * dz) * s * 10;
    this.clampTarget();
  },
  panWorld(dx, dz) { this.cam.t.target.x += dx; this.cam.t.target.z += dz; this.clampTarget(); },
  clampTarget() {
    const b = this.cam.bounds; if (!b) return;
    const t = this.cam.t.target;
    t.x = U.clamp(t.x, b.minX, b.maxX); t.z = U.clamp(t.z, b.minZ, b.maxZ);
  },
  shake(a) { if (SETTINGS.shake) this.cam.shake = Math.max(this.cam.shake, a); },
  updateCamera(dt) {
    const c = this.cam, t = c.t, k = U.instant ? 1 : 1 - Math.exp(-c.lambda * dt);
    c.target.lerp(t.target, k);
    c.yaw += (t.yaw - c.yaw) * k; c.pitch += (t.pitch - c.pitch) * k; c.dist += (t.dist - c.dist) * k;
    const cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
    const pos = this.camera.position;
    pos.set(c.target.x + Math.sin(c.yaw) * cp * c.dist, c.target.y + sp * c.dist, c.target.z + Math.cos(c.yaw) * cp * c.dist);
    if (c.shake > 0.001) {
      const s = c.shake, tt = this.time * 40;
      pos.x += Math.sin(tt * 1.1) * s * 0.6; pos.y += Math.sin(tt * 1.7 + 2) * s * 0.5; pos.z += Math.cos(tt * 1.3) * s * 0.6;
      c.shake *= Math.exp(-dt * 5);
    }
    this.camera.lookAt(c.target.x, c.target.y + 0.6, c.target.z);
    if (this.final) {
      // foco del efecto miniatura en el punto observado
      const v = new THREE.Vector3(c.target.x, 0.8, c.target.z).project(this.camera);
      this.final.uniforms.uFocus.value = U.clamp(v.y * 0.5 + 0.5, 0.2, 0.8);
    }
  },

  /* ---------------- luces ---------------- */
  addLightSource(src) { src.w = 0; src.phase = Math.random() * 100; this.lightSources.push(src); return src; },
  clearLights() { this.lightSources = []; this.pool.forEach((p) => { p.src = null; p.light.intensity = 0; p.light.position.y = -50; }); },
  updateLights(dt) {
    const t = this.time, tg = this.cam.target;
    const active = this.lightSources.filter((s) => s.on);
    active.forEach((s) => { const dx = s.pos.x - tg.x, dz = s.pos.z - tg.z; s.d2 = dx * dx + dz * dz - (s.priority || 0); });
    active.sort((a, b) => a.d2 - b.d2);
    const want = active.slice(0, this.pool.length);
    // mantener asignaciones estables
    const keep = new Set();
    this.pool.forEach((p) => { if (p.src && want.includes(p.src)) keep.add(p.src); else p.src = null; });
    want.forEach((s) => { if (keep.has(s)) return; const free = this.pool.find((p) => !p.src); if (free) { free.src = s; free.w = 0; } });
    this.pool.forEach((p) => {
      const L = p.light;
      if (!p.src) { L.intensity = Math.max(0, L.intensity - dt * 4); if (L.intensity <= 0) L.position.y = -50; return; }
      const s = p.src;
      p.w = Math.min(1, p.w + dt * 2.5);
      L.position.copy(s.pos); L.color.copy(s.color); L.distance = s.distance || 11;
      let f = 1;
      if (s.flicker) f = 0.82 + 0.1 * Math.sin(t * 9 + s.phase) + 0.08 * Math.sin(t * 23.7 + s.phase * 2) + 0.05 * Math.sin(t * 3.1 + s.phase);
      if (s.pulse) f = 0.75 + 0.25 * Math.sin(t * s.pulse + s.phase);
      L.intensity = s.intensity * f * p.w * (s.mult == null ? 1 : s.mult);
    });
    this.fxLights.forEach((f) => {
      if (f.t >= f.dur) { f.light.intensity = 0; return; }
      f.t += dt;
      if (f.follow) f.light.position.copy(f.follow.position);
      const k = f.t / f.dur;
      f.light.intensity = f.peak * (f.sustain ? 1 : Math.pow(1 - k, 1.5));
      if (k >= 1) { f.light.intensity = 0; f.light.position.y = -50; }
    });
    // foco del grupo sigue al héroe activo con suavidad
    this.key.target.position.lerp(this.keyPos, 1 - Math.exp(-dt * 5));
    this.key.position.set(this.key.target.position.x + 2.5, 13, this.key.target.position.z + 4.5);
  },
  flashLight(pos, color, peak = 3, dur = 0.5, follow = null, sustain = false) {
    const f = this.fxLights.reduce((a, b) => (a.t / (a.dur || 1) > b.t / (b.dur || 1) ? a : b));
    f.light.position.copy(pos); f.light.color.set(color); f.peak = peak; f.dur = dur; f.t = 0; f.follow = follow; f.sustain = sustain;
    return f;
  },

  /* ---------------- selección ---------------- */
  ndc(clientX, clientY) {
    const r = this.renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  },
  pick(clientX, clientY, units) {
    this.raycaster.setFromCamera(this.ndc(clientX, clientY), this.camera);
    const ray = this.raycaster.ray;
    let best = null, bestD = Infinity;
    const tmp = new THREE.Vector3();
    (units || []).forEach((u) => {
      if (!u.mesh || !u.mesh.visible) return;
      const h = (u.mesh.userData.height || 1.5) * 0.55;
      tmp.set(u.mesh.position.x, h, u.mesh.position.z);
      const d = ray.distanceSqToPoint(tmp);
      const r = (u.boss ? 0.95 : 0.62);
      if (d < r * r) { const dist = ray.origin.distanceTo(tmp); if (dist < bestD) { bestD = dist; best = u; } }
    });
    if (best) return { x: best.x, y: best.y, unit: best };
    // objetos altos: puertas, cofres, atriles
    let bt = null; bestD = Infinity;
    (this.tall || []).forEach((o) => {
      if (o.hidden && o.hidden()) return;
      tmp.set(o.x * TILE, o.h, o.y * TILE);
      const d = ray.distanceSqToPoint(tmp);
      if (d < o.r * o.r) { const dist = ray.origin.distanceTo(tmp); if (dist < bestD) { bestD = dist; bt = o; } }
    });
    if (bt) return { x: bt.x, y: bt.y };
    const hit = new THREE.Vector3();
    if (!ray.intersectPlane(this.groundPlane, hit)) return null;
    return { x: Math.round(hit.x / TILE), y: Math.round(hit.z / TILE) };
  },
  project(v) {
    const p = v.clone().project(this.camera);
    return { x: (p.x * 0.5 + 0.5) * this.w, y: (-p.y * 0.5 + 0.5) * this.h, visible: p.z < 1 && p.z > -1 };
  },

  /* ---------------- retratos (render de la propia miniatura) ---------------- */
  portraits(list) {
    const r = this.renderer, S = 192, out = {};
    const prevPR = r.getPixelRatio(), prevSize = r.getSize(new THREE.Vector2());
    r.setPixelRatio(1); r.setSize(S, S, false);
    const sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight(0x8090b0, 0x201510, 0.6));
    const k1 = new THREE.DirectionalLight(0xffd6a0, 2.2); k1.position.set(2, 3, 4); sc.add(k1);
    const k2 = new THREE.DirectionalLight(0x7fa8ff, 1.6); k2.position.set(-3, 2, -3); sc.add(k2);
    const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
    const shadowWas = r.shadowMap.enabled; r.shadowMap.enabled = false;
    list.forEach(({ id, kind, opts, bg }) => {
      const m = MODELS.build(kind, opts || {});
      sc.add(m);
      sc.background = new THREE.Color(bg || '#1a1410');
      const h = m.userData.height || 1.5, fl = m.userData.float || 0;
      const head = new THREE.Vector3(); m.userData.head ? m.userData.head.getWorldPosition(head) : head.set(0, h * 0.85, 0);
      m.updateMatrixWorld(true); if (m.userData.head) m.userData.head.getWorldPosition(head);
      void fl;
      const big = h > 2 ? 1.6 : 1;
      cam.position.set(head.x + 0.35 * big, head.y + 0.08 * big, head.z + 1.25 * big);
      cam.lookAt(head.x, head.y - 0.12 * big, head.z);
      r.render(sc, cam);
      const c = document.createElement('canvas'); c.width = S; c.height = S;
      c.getContext('2d').drawImage(r.domElement, 0, 0, S, S, 0, 0, S, S);
      try { out[id] = c.toDataURL('image/jpeg', 0.86); } catch (e) { out[id] = ''; }
      sc.remove(m);
    });
    r.shadowMap.enabled = shadowWas;
    r.setPixelRatio(prevPR); r.setSize(prevSize.x, prevSize.y, false);
    this.resize();
    return out;
  },

  render(dt) {
    this.dt = dt; this.time += dt;
    this.updateCamera(dt);
    this.updateLights(dt);
    const F = this.fx, u = this.final.uniforms;
    F.damage = Math.max(0, F.damage - dt * 1.6);
    F.flash = Math.max(0, F.flash - dt * 3);
    F.desat += (F.desatT - F.desat) * (1 - Math.exp(-dt * 2));
    F.fade += (F.fadeT - F.fade) * (1 - Math.exp(-dt * 4));
    u.uTime.value = this.time; u.uDamage.value = F.damage; u.uFlash.value = SETTINGS.flashes ? F.flash : F.flash * 0.25;
    u.uDesat.value = F.desat; u.uFade.value = F.fade;
    this.composer.render(dt);
  }
};
