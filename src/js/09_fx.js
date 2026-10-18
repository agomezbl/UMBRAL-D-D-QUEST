/* ==========================================================================
   Efectos: partículas, proyectiles, textos flotantes y bocadillos
   ========================================================================== */
const FX = {
  N: 2400, n: 0,
  init() {
    const N = this.N;
    this.pos = new Float32Array(N * 3); this.vel = new Float32Array(N * 3); this.col = new Float32Array(N * 3);
    this.life = new Float32Array(N); this.max = new Float32Array(N); this.size = new Float32Array(N); this.alpha = new Float32Array(N);
    this.grav = new Float32Array(N); this.drag = new Float32Array(N); this.base = new Float32Array(N);
    const geo = new THREE.BufferGeometry();
    this.aPos = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage);
    this.aSize = new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage);
    this.aAlpha = new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.aPos); geo.setAttribute('color', this.aCol); geo.setAttribute('size', this.aSize); geo.setAttribute('alpha', this.aAlpha);
    geo.setDrawRange(0, 0);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: TEX.dot() }, uScale: { value: 400 } },
      vertexShader: `attribute float size; attribute float alpha; attribute vec3 color; varying vec3 vC; varying float vA; uniform float uScale;
        void main(){ vC = color; vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D uTex; varying vec3 vC; varying float vA; void main(){ vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(vC * t.a * vA * 2.0, 1.0); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    this.points = new THREE.Points(geo, mat); this.points.frustumCulled = false; this.points.renderOrder = 20;
    ENGINE.scene.add(this.points);
    this.layer = document.getElementById('fx-layer');
    this.labels = [];
    this.projectiles = [];
  },
  emit(o) {
    const q = ENGINE.q ? ENGINE.q.particles : 1;
    const count = Math.max(1, Math.round((o.count || 10) * q));
    const c1 = new THREE.Color(o.color || '#ffffff'), c2 = new THREE.Color(o.color2 || o.color || '#ffffff');
    for (let k = 0; k < count; k++) {
      if (this.n >= this.N) return;
      const i = this.n++;
      const sp = o.spread || 0.3, vs = o.velSpread || 1;
      this.pos[i * 3] = o.pos.x + (Math.random() - 0.5) * sp * 2;
      this.pos[i * 3 + 1] = o.pos.y + (Math.random() - 0.5) * (o.spreadY != null ? o.spreadY : sp) * 2;
      this.pos[i * 3 + 2] = o.pos.z + (Math.random() - 0.5) * sp * 2;
      let vx = (o.vel ? o.vel.x : 0) + (Math.random() - 0.5) * vs * 2, vy = (o.vel ? o.vel.y : 0) + (Math.random() - 0.5) * vs * 2, vz = (o.vel ? o.vel.z : 0) + (Math.random() - 0.5) * vs * 2;
      if (o.radial) { const a = Math.random() * Math.PI * 2, r = o.radial * (0.5 + Math.random() * 0.5); vx = Math.cos(a) * r; vz = Math.sin(a) * r; vy = (o.vel ? o.vel.y : 0) + Math.random() * (o.up || 1); }
      this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
      const t = Math.random(), c = c1.clone().lerp(c2, t);
      this.col[i * 3] = c.r; this.col[i * 3 + 1] = c.g; this.col[i * 3 + 2] = c.b;
      this.max[i] = (o.life || 1) * (0.6 + Math.random() * 0.8); this.life[i] = this.max[i];
      this.base[i] = (o.size || 0.25) * (0.6 + Math.random() * 0.8);
      this.grav[i] = o.gravity || 0; this.drag[i] = o.drag != null ? o.drag : 1.5;
    }
  },
  update(dt) {
    let n = this.n;
    for (let i = 0; i < n; i++) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        n--;
        if (i !== n) {
          for (let k = 0; k < 3; k++) { this.pos[i * 3 + k] = this.pos[n * 3 + k]; this.vel[i * 3 + k] = this.vel[n * 3 + k]; this.col[i * 3 + k] = this.col[n * 3 + k]; }
          this.life[i] = this.life[n]; this.max[i] = this.max[n]; this.base[i] = this.base[n]; this.grav[i] = this.grav[n]; this.drag[i] = this.drag[n];
          i--;
        }
        continue;
      }
      const dr = Math.exp(-this.drag[i] * dt);
      this.vel[i * 3] *= dr; this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * dr - this.grav[i] * dt; this.vel[i * 3 + 2] *= dr;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      const k = this.life[i] / this.max[i];
      this.alpha[i] = Math.min(1, k * 2.2) * Math.min(1, (1 - k) * 8);
      this.size[i] = this.base[i] * (0.5 + 0.5 * k);
    }
    this.n = n;
    this.points.geometry.setDrawRange(0, n);
    this.aPos.needsUpdate = this.aCol.needsUpdate = this.aSize.needsUpdate = this.aAlpha.needsUpdate = true;
    this.points.material.uniforms.uScale.value = ENGINE.h * 0.9;
    this.updateLabels();
    this.ambient(dt);
  },
  /* emisores ambientales: brasas de antorchas, motas de polvo, chispas de lava */
  ambT: 0,
  ambient(dt) {
    this.ambT += dt;
    if (this.ambT < 0.12) return;
    this.ambT = 0;
    const tg = ENGINE.cam.target;
    const near = ENGINE.lightSources.filter((s) => s.on && s.flame && Math.abs(s.pos.x - tg.x) < 22 && Math.abs(s.pos.z - tg.z) < 18);
    near.forEach((s) => { if (Math.random() < 0.35) this.emit({ pos: s.flame.position, count: 1, spread: 0.08, vel: { x: 0, y: 0.9, z: 0 }, velSpread: 0.25, life: 1.4, size: 0.07, color: '#ffb35a', color2: '#ff5a14', drag: 0.4 }); });
    const theme = WORLD.theme;
    if (theme && WORLD.L) {
      // motas flotando cerca del foco de la cámara
      const p = { x: tg.x + (Math.random() - 0.5) * 16, y: 0.4 + Math.random() * 2.2, z: tg.z + (Math.random() - 0.5) * 12 };
      const t = WORLD.L.T[Math.round(p.z / TILE)] && WORLD.L.T[Math.round(p.z / TILE)][Math.round(p.x / TILE)];
      if (t && t.floor && WORLD.L.rooms[t.room] && WORLD.L.rooms[t.room].revealed) {
        const col = theme.id === 'void' ? '#b9a2ff' : theme.id === 'forge' ? '#ff9a4a' : '#d8e6d8';
        this.emit({ pos: p, count: 1, spread: 0.1, vel: { x: 0.05, y: theme.id === 'forge' ? 0.5 : 0.05, z: 0.02 }, velSpread: 0.08, life: 4, size: theme.id === 'forge' ? 0.06 : 0.045, color: col, drag: 0.1 });
      }
      WORLD.L.rooms.forEach((r) => {
        if (!r.revealed || !r.hazardTiles || Math.random() > 0.5) return;
        const h = U.pick(r.hazardTiles);
        if (Math.abs(h.x * TILE - tg.x) > 24) return;
        const col = theme.hazard === 'lava' ? ['#ffcf6b', '#ff3a10'] : theme.hazard === 'necro' ? ['#a8ffd8', '#1dbf7a'] : ['#e0ccff', '#7a3aff'];
        this.emit({ pos: { x: h.x * TILE, y: 0, z: h.y * TILE }, count: 1, spread: 0.8, spreadY: 0.05, vel: { x: 0, y: theme.hazard === 'lava' ? 1.6 : 0.6, z: 0 }, velSpread: 0.3, life: 1.6, size: 0.09, color: col[0], color2: col[1], drag: 0.3 });
      });
    }
    // brasas del jefe de magma
    if (GAME && GAME.enemies) GAME.enemies.forEach((e) => { if (e.alive && e.mesh && e.mesh.visible && e.kind === 'ignis') this.emit({ pos: { x: e.mesh.position.x, y: 1.6, z: e.mesh.position.z }, count: 2, spread: 0.6, vel: { x: 0, y: 1.2, z: 0 }, velSpread: 0.4, life: 1.4, size: 0.1, color: '#ffcf6b', color2: '#ff3a10', drag: 0.3 }); });
  },

  burst(kind, pos, o = {}) {
    const P = { x: pos.x, y: pos.y != null ? pos.y : 1, z: pos.z };
    switch (kind) {
      case 'hit': this.emit({ pos: P, count: 22, spread: 0.15, radial: 3.2, up: 2.4, gravity: 6, life: 0.6, size: 0.11, color: '#ffb36b', color2: '#ff3d1e', drag: 2 }); break;
      case 'blood': this.emit({ pos: P, count: 14, spread: 0.15, radial: 2.4, up: 2, gravity: 8, life: 0.7, size: 0.1, color: '#b0101a', color2: '#5a0008', drag: 1.5 }); break;
      case 'bone': this.emit({ pos: P, count: 18, spread: 0.2, radial: 2.5, up: 2.5, gravity: 8, life: 0.9, size: 0.09, color: '#f0e6cc', color2: '#a89c80', drag: 1 }); break;
      case 'block': this.emit({ pos: P, count: 16, spread: 0.1, radial: 3.6, up: 1.5, gravity: 4, life: 0.45, size: 0.08, color: '#cfe6ff', color2: '#7fb8ff', drag: 2 }); break;
      case 'magic': this.emit({ pos: P, count: 30, spread: 0.2, radial: 2.6, up: 1.8, gravity: -0.5, life: 0.9, size: 0.14, color: o.color || '#c9b0ff', color2: o.color2 || '#6a3aff', drag: 2.2 }); break;
      case 'fire': this.emit({ pos: P, count: 40, spread: 0.4, radial: 2.8, up: 3, gravity: -1, life: 0.9, size: 0.2, color: '#ffe08a', color2: '#ff3a10', drag: 2 }); break;
      case 'heal': this.emit({ pos: { x: P.x, y: 0.3, z: P.z }, count: 34, spread: 0.55, spreadY: 0.1, vel: { x: 0, y: 1.6, z: 0 }, velSpread: 0.35, life: 1.3, size: 0.12, color: '#c8ffd8', color2: '#3dff9a', drag: 0.8 }); break;
      case 'shield': this.emit({ pos: { x: P.x, y: 0.2, z: P.z }, count: 40, spread: 0.1, radial: 1.2, up: 2.2, gravity: -0.2, life: 1.0, size: 0.12, color: '#bfe0ff', color2: '#ffd27a', drag: 1.2 }); break;
      case 'death': this.emit({ pos: { x: P.x, y: 0.8, z: P.z }, count: 40, spread: 0.4, vel: { x: 0, y: 1.4, z: 0 }, velSpread: 0.8, life: 1.4, size: 0.16, color: o.color || '#9fe3c0', color2: o.color2 || '#2a3a30', drag: 1.2 }); break;
      case 'soul': this.emit({ pos: { x: P.x, y: 1.0, z: P.z }, count: 18, spread: 0.2, vel: { x: 0, y: 2.4, z: 0 }, velSpread: 0.3, life: 1.8, size: 0.18, color: '#e8fff6', color2: '#7dffb0', drag: 0.5 }); break;
      case 'dust': this.emit({ pos: { x: P.x, y: 0.15, z: P.z }, count: 18, spread: 0.6, spreadY: 0.05, radial: 1.4, up: 0.6, gravity: 0.3, life: 1.2, size: 0.2, color: '#5a5048', color2: '#2a2420', drag: 2 }); break;
      case 'gold': this.emit({ pos: P, count: 26, spread: 0.2, radial: 1.8, up: 3.2, gravity: 7, life: 1.0, size: 0.09, color: '#fff0a0', color2: '#ffb000', drag: 0.8 }); break;
      case 'summon': this.emit({ pos: { x: P.x, y: 0.1, z: P.z }, count: 50, spread: 0.7, spreadY: 0.05, vel: { x: 0, y: 2.2, z: 0 }, velSpread: 0.5, life: 1.1, size: 0.15, color: o.color || '#9dffcf', color2: o.color2 || '#0a5a3a', drag: 1 }); break;
      case 'explode': this.emit({ pos: P, count: 70, spread: 0.6, radial: 5, up: 4, gravity: 5, life: 1.1, size: 0.24, color: '#ffe08a', color2: '#ff2a00', drag: 2 }); this.emit({ pos: P, count: 30, spread: 1, radial: 1.5, up: 1, life: 1.8, size: 0.4, color: '#4a3a30', color2: '#1a1410', drag: 1 }); break;
      case 'trap': this.emit({ pos: { x: P.x, y: 0.2, z: P.z }, count: 24, spread: 0.5, radial: 2, up: 2, gravity: 6, life: 0.6, size: 0.1, color: '#ffffff', color2: '#ff9a3a', drag: 1 }); break;
      case 'glass': this.emit({ pos: P, count: 40, spread: 0.5, radial: 3, up: 2, gravity: 6, life: 1.0, size: 0.12, color: '#e8e0ff', color2: '#7a5aff', drag: 1 }); break;
      case 'reveal': this.emit({ pos: { x: P.x, y: 0.1, z: P.z }, count: 30, spread: 1.6, spreadY: 0.1, vel: { x: 0, y: 1.2, z: 0 }, velSpread: 0.4, life: 1.6, size: 0.12, color: o.color || '#ffd27a', color2: '#ff7a2a', drag: 0.7 }); break;
    }
  },

  /* proyectiles con estela y luz propia */
  projectile(from, to, kind = 'arrow') {
    return new Promise((resolve) => {
      const scene = ENGINE.scene;
      let mesh;
      const color = { arrow: '#ffe0b0', bolt: '#b9a2ff', fire: '#ff7a2a', necro: '#7dffb0', void: '#c08bff', dagger: '#cfe6ff', dawn: '#ffe6a0', bomb: '#ffb347' }[kind] || '#ffffff';
      if (kind === 'arrow' || kind === 'dagger') {
        mesh = new THREE.Group();
        const shaft = new THREE.Mesh(G.cyl(0.015, 0.015, 0.7, 5), MAT.std('#6a4a2a', 0.8)); shaft.rotation.x = Math.PI / 2; mesh.add(shaft);
        const tip = new THREE.Mesh(G.cone(0.04, 0.14, 5), MAT.std('#cfd6de', 0.3, 0.9)); tip.rotation.x = Math.PI / 2; tip.position.z = 0.4; mesh.add(tip);
        if (kind === 'dagger') { shaft.visible = false; tip.scale.set(1.2, 3, 1.2); }
      } else if (kind === 'bomb') {
        mesh = new THREE.Mesh(G.sph(0.14, 10, 8), MAT.std('#2a2420', 0.6, 0.4));
      } else {
        mesh = new THREE.Mesh(G.sph(0.16, 12, 10), MAT.glow(color, 3));
      }
      mesh.position.copy(from); scene.add(mesh);
      const fl = ENGINE.flashLight(from, color, kind === 'arrow' ? 0 : 2.5, 9, mesh, true);
      const dist = from.distanceTo(to), dur = Math.max(0.25, dist / (kind === 'arrow' || kind === 'dagger' ? 26 : kind === 'bomb' ? 12 : 16));
      const arc = kind === 'bomb' ? dist * 0.35 : kind === 'arrow' ? dist * 0.06 : 0.3;
      const t0 = performance.now();
      const prev = from.clone();
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / 1000 * (U.speed || 1) / dur);
        mesh.position.lerpVectors(from, to, k); mesh.position.y += Math.sin(k * Math.PI) * arc;
        if (kind === 'arrow' || kind === 'dagger') mesh.lookAt(mesh.position.clone().add(mesh.position.clone().sub(prev)));
        if (kind !== 'arrow') this.emit({ pos: mesh.position, count: 2, spread: 0.05, velSpread: 0.2, life: 0.4, size: 0.14, color, color2: color, drag: 2 });
        prev.copy(mesh.position);
        if (k < 1 && !U.instant) requestAnimationFrame(step);
        else { scene.remove(mesh); fl.sustain = false; fl.t = fl.dur; resolve(); }
      };
      step();
    });
  },

  /* textos flotantes (daño, curación, avisos) */
  text(worldPos, text, cls = 'dmg') {
    if (!this.layer) return;
    const el = U.el('div', 'float-txt ' + cls, text);
    this.layer.appendChild(el);
    this.labels.push({ el, pos: worldPos.clone ? worldPos.clone() : new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z), t: 0, dur: 1.5, rise: 1.2 });
  },
  bubble(unit, text, dur = 2.8) {
    if (!this.layer || !unit || !unit.mesh) return;
    this.labels.filter((l) => l.unit === unit).forEach((l) => (l.t = l.dur));
    const el = U.el('div', 'bubble side-' + unit.side, `<span>${U.esc(text)}</span>`);
    this.layer.appendChild(el);
    this.labels.push({ el, unit, t: 0, dur, rise: 0, bubble: true });
  },
  updateLabels() {
    const dt = ENGINE.dt;
    for (let i = this.labels.length - 1; i >= 0; i--) {
      const l = this.labels[i];
      l.t += dt;
      const k = l.t / l.dur;
      if (k >= 1 || (l.unit && !l.unit.mesh)) { l.el.remove(); this.labels.splice(i, 1); continue; }
      let p;
      if (l.unit) { const m = l.unit.mesh; p = new THREE.Vector3(m.position.x, (m.userData.height || 1.5) + 0.75, m.position.z); }
      else p = l.pos.clone().setY(l.pos.y + l.rise * U.easeOut(Math.min(1, k * 1.4)));
      const s = ENGINE.project(p);
      l.el.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) translate(-50%, -100%)`;
      l.el.style.opacity = l.bubble ? (k < 0.08 ? k / 0.08 : k > 0.85 ? (1 - k) / 0.15 : 1) : (k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4);
      l.el.style.visibility = s.visible ? 'visible' : 'hidden';
    }
  },
  clearLabels() { this.labels.forEach((l) => l.el.remove()); this.labels = []; this.n = 0; }
};
