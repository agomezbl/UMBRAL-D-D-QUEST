/* ==========================================================================
   Dados 3D que se lanzan sobre el tablero.
   Cada dado cae, rebota y se para en la cara que ya ha decidido el juego
   (el azar se tira antes; la animación solo lo enseña). Pensado para poder
   llevarse tal cual al juego.
   ========================================================================== */
const DICE3D = (() => {
  // orden de caras de BoxGeometry: +x, -x, +y, -y, +z, -z
  const NORMALS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map((a) => new THREE.Vector3(...a));
  // hacia dónde queda «arriba» el dibujo de cada cara (para que se lea derecho desde la cámara)
  const TEX_UP = [[0, 1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1], [0, 1, 0], [0, 1, 0]].map((a) => new THREE.Vector3(...a));

  /* Tipos de dado: color del cuerpo, tinta y caras (en el orden de las caras de la caja) */
  const TYPES = {
    combat: { name: 'Dado de combate', body: '#efe6d3', edge: '#b9ab8e', ink: '#1f1813', faces: ['skull', 'wshield', 'skull', 'bshield', 'skull', 'wshield'] },
    foe: { name: 'Dado de combate', body: '#cdbf9f', edge: '#8f7f62', ink: '#1f1813', faces: ['skull', 'wshield', 'skull', 'bshield', 'skull', 'wshield'] },
    gemini: { name: 'Dado de máscaras', body: '#efe6d3', edge: '#b9ab8e', ink: '#1f1813', faces: ['skull', 'skullT', 'skull', 'shieldC', 'comedy', 'tragedy'] },
    geminiFoe: { name: 'Dado de máscaras', body: '#cdbf9f', edge: '#8f7f62', ink: '#1f1813', faces: ['skull', 'skullT', 'skull', 'shieldC', 'comedy', 'tragedy'] },
    destiny: { name: 'Dado del Destino', body: '#dcaa45', edge: '#7a5414', ink: '#2e1a08', size: 1.18, metal: 0.4, faces: ['comedy', 'blank', 'tragedy', 'blank', 'comedy', 'blank'] },
    treasure: { name: 'Dado del Tesoro', body: '#b48650', edge: '#6b4a26', ink: '#2a1a0e', size: 1.1, faces: ['gold', 'potion', 'gold', 'nothing', 'item', 'danger'] }
  };

  let scene = null, SIZE = 0.78;
  const live = [];
  const texCache = {};

  /* ---------------- geometría: cubo con aristas redondeadas ---------------- */
  let GEO = null;
  function roundedBox(r = 0.16, seg = 10) {
    const g = new THREE.BoxGeometry(1, 1, 1, seg, seg, seg);
    const p = g.attributes.position, n = g.attributes.normal, v = new THREE.Vector3(), c = new THREE.Vector3(), d = new THREE.Vector3();
    const h = 0.5 - r;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      c.set(U.clamp(v.x, -h, h), U.clamp(v.y, -h, h), U.clamp(v.z, -h, h));
      d.copy(v).sub(c).normalize();
      v.copy(c).addScaledVector(d, r);
      p.setXYZ(i, v.x, v.y, v.z); n.setXYZ(i, d.x, d.y, d.z);
    }
    return g;
  }

  /* ---------------- dibujo de caras ---------------- */
  const P = {
    skull: 'M12 3c-4.4 0-7.5 3.1-7.5 7.3 0 2.6 1.3 4.4 3 5.4V19h9v-3.3c1.7-1 3-2.8 3-5.4C19.5 6.1 16.4 3 12 3Z',
    shield: 'M12 2.6 4.4 5.5v6.1c0 4.8 3.2 8.3 7.6 9.8 4.4-1.5 7.6-5 7.6-9.8V5.5Z',
    mask: 'M3.6 5.2c3.4-1.8 13.4-1.8 16.8 0 .5 6.6-2.4 13.6-8.4 14.8C6 18.8 3.1 11.8 3.6 5.2Z',
    flask: 'M9.6 2.8h4.8M10.2 3v5.4L5.8 15.6A3.7 3.7 0 0 0 9 21h6a3.7 3.7 0 0 0 3.2-5.4L13.8 8.4V3',
    chest: 'M3.5 10.5h17v9h-17ZM3.5 10.5c0-3.3 2.5-5.5 5.5-5.5h6c3 0 5.5 2.2 5.5 5.5'
  };
  function canvasFor(key, draw) {
    if (texCache[key]) return texCache[key];
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d');
    draw(x, S);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    return (texCache[key] = t);
  }
  function bodyFill(x, S, T) {
    const g = x.createRadialGradient(S / 2, S / 2, S * 0.15, S / 2, S / 2, S * 0.72);
    g.addColorStop(0, T.body); g.addColorStop(0.78, T.body); g.addColorStop(1, T.edge);
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    if (T === TYPES.destiny) { // filete dorado
      x.strokeStyle = T.ink; x.globalAlpha = 0.55; x.lineWidth = 6; x.strokeRect(26, 26, S - 52, S - 52); x.globalAlpha = 1;
    }
  }
  function glyph(x, S, scale = 0.62) { const k = (S * scale) / 24; x.translate(S / 2 - 12 * k, S / 2 - 12 * k); x.scale(k, k); }
  function drawSkull(x, ink, hole) {
    x.fillStyle = ink; x.fill(new Path2D(P.skull));
    x.fillStyle = hole;
    x.beginPath(); x.ellipse(8.9, 10.9, 2.1, 2.4, -0.2, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(15.1, 10.9, 2.1, 2.4, 0.2, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.moveTo(12, 13.3); x.lineTo(10.9, 15.4); x.lineTo(13.1, 15.4); x.closePath(); x.fill();
    x.fillRect(9.6, 17.2, 0.9, 1.9); x.fillRect(11.55, 17.2, 0.9, 1.9); x.fillRect(13.5, 17.2, 0.9, 1.9);
  }
  function drawShield(x, white, ink) {
    const p = new Path2D(P.shield);
    if (white) { x.fillStyle = '#fbf8f1'; x.fill(p); x.lineWidth = 1.7; x.strokeStyle = ink; x.stroke(p); x.lineWidth = 1.3; x.beginPath(); x.moveTo(12, 6.4); x.lineTo(12, 17.6); x.moveTo(7.6, 10.8); x.lineTo(16.4, 10.8); x.stroke(); }
    else { x.fillStyle = ink; x.fill(p); x.strokeStyle = '#efe6d3'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(12, 6.4); x.lineTo(12, 17.6); x.moveTo(7.6, 10.8); x.lineTo(16.4, 10.8); x.stroke(); }
  }
  function drawMask(x, happy, fill, hole, edge) {
    x.fillStyle = fill; x.fill(new Path2D(P.mask));
    if (edge) { x.strokeStyle = edge; x.lineWidth = 0.9; x.stroke(new Path2D(P.mask)); }
    x.strokeStyle = hole; x.fillStyle = hole; x.lineCap = 'round'; x.lineJoin = 'round';
    x.lineWidth = 1.9;
    if (happy) {
      x.beginPath(); x.moveTo(6.6, 10.4); x.quadraticCurveTo(8.4, 7.6, 10.2, 10.4); x.stroke();
      x.beginPath(); x.moveTo(13.8, 10.4); x.quadraticCurveTo(15.6, 7.6, 17.4, 10.4); x.stroke();
      x.beginPath(); x.moveTo(7.4, 13.2); x.quadraticCurveTo(12, 19.4, 16.6, 13.2); x.quadraticCurveTo(12, 15.6, 7.4, 13.2); x.fill();
    } else {
      x.beginPath(); x.moveTo(6.6, 8.6); x.quadraticCurveTo(8.4, 11.2, 10.2, 9.6); x.stroke();
      x.beginPath(); x.moveTo(13.8, 9.6); x.quadraticCurveTo(15.6, 11.2, 17.4, 8.6); x.stroke();
      x.beginPath(); x.moveTo(7.8, 17.4); x.quadraticCurveTo(12, 11.6, 16.2, 17.4); x.quadraticCurveTo(12, 14.8, 7.8, 17.4); x.fill();
      x.lineWidth = 1.2; x.beginPath(); x.moveTo(8, 12.6); x.lineTo(7.6, 14.6); x.stroke(); // lágrima
    }
  }
  function faceTexture(typeKey, face) {
    const T = TYPES[typeKey];
    return canvasFor(typeKey + ':' + face, (x, S) => {
      bodyFill(x, S, T);
      x.save();
      const comedyCol = typeKey === 'destiny' ? '#fff3d6' : '#c9921d', tragedyCol = typeKey === 'destiny' ? '#a3172c' : '#8e1b2e';
      const holeCol = typeKey === 'destiny' ? T.ink : T.body;
      if (face === 'skull') { glyph(x, S); drawSkull(x, T.ink, holeCol); }
      else if (face === 'wshield') { glyph(x, S); drawShield(x, true, T.ink); }
      else if (face === 'bshield') { glyph(x, S); drawShield(x, false, T.ink); }
      else if (face === 'comedy') { glyph(x, S, 0.72); drawMask(x, true, comedyCol, holeCol, typeKey === 'destiny' ? T.ink : null); }
      else if (face === 'tragedy') { glyph(x, S, 0.72); drawMask(x, false, tragedyCol, holeCol, typeKey === 'destiny' ? T.ink : null); }
      else if (face === 'skullT' || face === 'shieldC') {
        x.save(); glyph(x, S, 0.56); x.translate(-2.4, 1.2);
        if (face === 'skullT') drawSkull(x, T.ink, holeCol); else drawShield(x, true, T.ink);
        x.restore(); x.save(); x.translate(S * 0.6, S * 0.06); const k = (S * 0.34) / 24; x.scale(k, k);
        drawMask(x, face === 'shieldC', face === 'shieldC' ? comedyCol : tragedyCol, holeCol); x.restore();
      }
      else if (face === 'blank') { // grabado tenue: un sol pequeño
        x.translate(S / 2, S / 2); x.strokeStyle = T.ink; x.globalAlpha = 0.28; x.lineWidth = 4;
        x.beginPath(); x.arc(0, 0, 22, 0, Math.PI * 2); x.stroke();
        for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; x.beginPath(); x.moveTo(Math.cos(a) * 32, Math.sin(a) * 32); x.lineTo(Math.cos(a) * 44, Math.sin(a) * 44); x.stroke(); }
      }
      else if (face === 'gold') {
        x.translate(S / 2, S / 2);
        const g = x.createRadialGradient(-14, -18, 6, 0, 0, 62); g.addColorStop(0, '#ffe9a0'); g.addColorStop(0.6, '#e2a92c'); g.addColorStop(1, '#8a5a12');
        x.fillStyle = g; x.beginPath(); x.arc(0, 0, 60, 0, Math.PI * 2); x.fill();
        x.strokeStyle = '#6b440c'; x.lineWidth = 6; x.stroke(); x.beginPath(); x.arc(0, 0, 42, 0, Math.PI * 2); x.globalAlpha = 0.6; x.stroke(); x.globalAlpha = 1;
        x.fillStyle = '#6b440c'; x.font = 'bold 54px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('O', 0, 3);
      }
      else if (face === 'potion') {
        glyph(x, S, 0.66);
        x.fillStyle = '#c4283a'; x.beginPath(); x.moveTo(6.8, 14); x.lineTo(17.2, 14); x.lineTo(18.2, 15.8); x.quadraticCurveTo(19.4, 20.8, 15.2, 20.8); x.lineTo(8.8, 20.8); x.quadraticCurveTo(4.6, 20.8, 5.8, 15.8); x.closePath(); x.fill();
        x.strokeStyle = T.ink; x.lineWidth = 1.5; x.lineJoin = 'round'; x.stroke(new Path2D(P.flask));
      }
      else if (face === 'item') {
        glyph(x, S, 0.66);
        x.fillStyle = '#6a3d1c'; x.fill(new Path2D(P.chest)); x.strokeStyle = '#f0c45a'; x.lineWidth = 1.3; x.stroke(new Path2D(P.chest));
        x.fillStyle = '#f0c45a'; x.fillRect(10.5, 10.5, 3, 3.5);
      }
      else if (face === 'nothing') {
        x.translate(S / 2, S / 2); x.strokeStyle = T.ink; x.globalAlpha = 0.45; x.lineWidth = 7; x.lineCap = 'round';
        x.beginPath(); x.arc(0, 0, 44, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.moveTo(-32, 32); x.lineTo(32, -32); x.stroke();
      }
      else if (face === 'danger') {
        glyph(x, S, 0.7);
        x.fillStyle = '#8e1b2e'; x.beginPath(); x.moveTo(3, 20); x.lineTo(6, 9); x.lineTo(9, 20); x.lineTo(12, 5); x.lineTo(15, 20); x.lineTo(18, 9); x.lineTo(21, 20); x.closePath(); x.fill();
        x.fillStyle = T.ink; x.fillRect(2.5, 19.6, 19, 1.6);
      }
      x.restore();
    });
  }

  /* ---------------- un dado ---------------- */
  function makeDie(typeKey) {
    const T = TYPES[typeKey];
    if (!GEO) GEO = roundedBox();
    const mats = T.faces.map((f) => new THREE.MeshStandardMaterial({ map: faceTexture(typeKey, f), roughness: typeKey === 'destiny' ? 0.32 : 0.46, metalness: T.metal || 0.02, emissive: new THREE.Color('#000000') }));
    const mesh = new THREE.Mesh(GEO, mats);
    const s = SIZE * (T.size || 1);
    mesh.scale.setScalar(s); mesh.castShadow = true; mesh.receiveShadow = true;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.58, 40), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    ring.rotation.x = -Math.PI / 2; ring.scale.setScalar(s * 1.35);
    const g = new THREE.Group(); g.add(mesh); g.add(ring);
    return { type: typeKey, T, group: g, mesh, ring, mats, size: s, face: 0, kind: null };
  }
  /* Orientación final: la cara «i» arriba y su dibujo derecho para quien mira desde +z */
  function restQuat(i, jitter = 0.3) {
    const q = new THREE.Quaternion().setFromUnitVectors(NORMALS[i], new THREE.Vector3(0, 1, 0));
    const up = TEX_UP[i].clone().applyQuaternion(q); up.y = 0; up.normalize();
    const want = new THREE.Vector3(0, 0, -1);
    let yaw = Math.atan2(up.x, up.z) - Math.atan2(want.x, want.z);
    yaw = -yaw + (Math.random() - 0.5) * 2 * jitter;
    return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw).multiply(q);
  }
  /* Elegir una cara al azar (todas igual de probables) */
  function roll(typeKey) { const i = Math.floor(Math.random() * 6); return { i, kind: TYPES[typeKey].faces[i] }; }

  /* Lanzar un grupo de dados. Cada pieza: { type, face (índice), from, to, delay } */
  function throwDice(list, o = {}) {
    if (list.length) audio.sfx('dice', { vol: 0.9 });
    return Promise.all(list.map((it) => new Promise(async (resolve) => {
      const d = makeDie(it.type);
      d.face = it.face; d.kind = TYPES[it.type].faces[it.face]; d.owner = it.owner;
      const from = it.from.clone(), to = it.to.clone();
      const qF = restQuat(it.face);
      const axis = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.4, Math.random() - 0.5).normalize();
      const spin = Math.PI * (5 + Math.random() * 3);
      const h0 = (o.height || 2.4) + Math.random() * 0.5, half = d.size / 2;
      d.group.position.copy(from); d.group.visible = false;
      scene.add(d.group); live.push(d);
      await U.sleep(it.delay || 0);
      d.group.visible = true;
      const dur = (o.dur || 950) * (0.92 + Math.random() * 0.16);
      let landed = false;
      const q = new THREE.Quaternion(), qs = new THREE.Quaternion();
      await U.tween(dur, (k) => {
        let f, y;
        if (k < 0.5) { const t = k / 0.5; f = 0.72 * t; y = h0 * (1 - t * t); }
        else if (k < 0.74) { const t = (k - 0.5) / 0.24; f = 0.72 + 0.18 * t; y = 0.62 * 4 * t * (1 - t); if (!landed) { landed = true; audio.sfx('diceLand', { vol: 0.55 + Math.random() * 0.3 }); } }
        else if (k < 0.88) { const t = (k - 0.74) / 0.14; f = 0.9 + 0.07 * t; y = 0.18 * 4 * t * (1 - t); }
        else { const t = (k - 0.88) / 0.12; f = 0.97 + 0.03 * (1 - (1 - t) * (1 - t)); y = 0; }
        d.mesh.position.set(0, 0, 0);
        d.group.position.set(U.lerp(from.x, to.x, f), half + y, U.lerp(from.z, to.z, f));
        const rem = Math.pow(1 - k, 2.1);
        qs.setFromAxisAngle(axis, spin * rem);
        q.copy(qF).multiply(qs);
        d.mesh.quaternion.copy(q);
      }, (t) => t);
      d.mesh.quaternion.copy(qF);
      d.group.position.set(to.x, half, to.z);
      resolve(d);
    })));
  }

  /* Huecos de aterrizaje: rejilla compacta con un poco de desorden */
  function slots(center, n, gap = 0.82, perRow = 4) {
    const out = [], rows = Math.ceil(n / perRow);
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / perRow), inRow = Math.min(perRow, n - r * perRow), c = i - r * perRow;
      out.push(new THREE.Vector3(center.x + (c - (inRow - 1) / 2) * gap + (Math.random() - 0.5) * 0.12, 0, center.z + (r - (rows - 1) / 2) * gap + (Math.random() - 0.5) * 0.12));
    }
    return out;
  }

  /* ---------------- efectos sobre un dado ya parado ---------------- */
  function glow(d, color, k = 1) {
    d.ring.material.color.set(color); d.ring.material.color.multiplyScalar(1.6 * k);
    d.mats.forEach((m) => { m.emissive.set(color); m.emissiveIntensity = 0.16 * k; });
    return U.tween(260, (t) => { d.ring.material.opacity = 0.9 * t; const s = 1 + 0.18 * Math.sin(t * Math.PI); d.mesh.scale.setScalar(d.size * s); });
  }
  function dim(d) {
    d.dimmed = true;
    d.mats.forEach((m) => { m.emissive.set('#000000'); });
    return U.tween(260, (t) => { d.mats.forEach((m) => m.color.setScalar(1 - 0.5 * t)); d.ring.material.opacity *= 1 - t; d.mesh.scale.setScalar(d.size * (1 - 0.12 * t)); });
  }
  function hop(d) { const y0 = d.group.position.y; return U.tween(300, (t) => (d.group.position.y = y0 + Math.sin(t * Math.PI) * 0.35)); }
  function clear() {
    const old = live.splice(0);
    if (!old.length) return Promise.resolve();
    return U.tween(260, (t) => old.forEach((d) => { d.group.position.y = d.size / 2 - t * d.size; d.mats.forEach((m) => { m.transparent = true; m.opacity = 1 - t; }); d.ring.material.opacity *= 1 - t; }))
      .then(() => old.forEach((d) => { scene.remove(d.group); d.mats.forEach((m) => m.dispose()); d.ring.geometry.dispose(); d.ring.material.dispose(); }));
  }

  return {
    TYPES, roll, slots, glow, dim, hop, clear, live: () => live.slice(),
    throw: throwDice,
    init(sc, o = {}) { scene = sc; if (o.size) SIZE = o.size; },
    faceTexture
  };
})();
