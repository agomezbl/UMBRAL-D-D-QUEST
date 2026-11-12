/* Probador de atrezo. Parámetros en la dirección:
   ?only=barril,mesa   solo esas piezas          ?slot=wall     solo ese hueco
   ?tema=crypt         solo las de ese tema      ?cols=6        columnas
   ?seed=3             otra semilla              ?fig=0         sin figura de escala
   ?vol=0              sin dibujar el volumen permitido         ?luz=fria|calida|sala */
(() => {
  const qs = new URLSearchParams(location.search);
  const only = (qs.get('only') || '').split(',').filter(Boolean), slotF = qs.get('slot'), temaF = qs.get('tema');
  const seed = +(qs.get('seed') || 1), showFig = qs.get('fig') !== '0', showVol = qs.get('vol') !== '0', luz = qs.get('luz') || 'calida';
  let names = Object.keys(DECO.CAT).filter((n) => (!only.length || only.includes(n)) && (!slotF || DECO.CAT[n].meta.slot === slotF) && (!temaF || !DECO.CAT[n].meta.temas || DECO.CAT[n].meta.temas.includes(temaF)));
  if (only.length) names = only.filter((n) => DECO.CAT[n]);
  const cols = +(qs.get('cols') || Math.min(8, Math.max(1, Math.ceil(Math.sqrt(names.length * 1.6)))));
  const rows = Math.max(1, Math.ceil(names.length / cols));
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.35;
  renderer.setPixelRatio(1); renderer.setSize(innerWidth, innerHeight); document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b0908);
  scene.add(new THREE.HemisphereLight(luz === 'fria' ? 0x6a86b0 : 0x55607a, 0x1a120c, luz === 'sala' ? 0.55 : 1.0));
  const sun = new THREE.DirectionalLight(luz === 'fria' ? 0xbfd4ff : 0xffd9a8, luz === 'sala' ? 0.5 : 1.5); sun.position.set(3, 8, 6); scene.add(sun);
  const SX = 3.2, SZ = 3.6, W = cols * SX, D = rows * SZ;
  const stone = new THREE.MeshStandardMaterial({ color: '#5a5d63', roughness: 0.9 }), wallM = new THREE.MeshStandardMaterial({ color: '#4c4e55', roughness: 0.95 }), dark = new THREE.MeshStandardMaterial({ color: '#17181b', roughness: 1 });
  const lineM = new THREE.LineBasicMaterial({ color: 0xff5a4a, transparent: true, opacity: 0.55 });
  const VOL = { wall: [[-0.9, 0, 0], [0.9, 2.1, 0.4]], hang: [[-0.9, 1.0, 0], [0.9, 2.1, 0.22]], corner: [[0, 0, 0], [0.6, 2.1, 0.6]], block: [[-0.85, 0, -0.85], [0.85, 2.1, 0.85]], floor: null };
  const label = (text, sub) => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 96; const x = c.getContext('2d');
    x.fillStyle = '#f2e6c8'; x.font = '600 40px sans-serif'; x.textAlign = 'center'; x.fillText(text, 256, 44);
    x.fillStyle = '#b8a888'; x.font = '26px sans-serif'; x.fillText(sub, 256, 82);
    const t = new THREE.CanvasTexture(c); const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.49), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false })); m.rotation.x = -Math.PI / 2; return m;
  };
  const stats = [];
  names.forEach((name, i) => {
    const it = DECO.CAT[name], slot = it.meta.slot, cx = (i % cols) * SX - W / 2 + SX / 2, cz = Math.floor(i / cols) * SZ - D / 2 + SZ / 2;
    const st = new THREE.Group(); st.position.set(cx, 0, cz); scene.add(st);
    const tw = it.meta.tw || 1, td = it.meta.td || 1;
    const fl = new THREE.Mesh(new THREE.BoxGeometry(2 * tw - 0.04, 0.1, 2 * td - 0.04), stone); fl.position.y = -0.05; st.add(fl);
    const under = new THREE.Mesh(new THREE.BoxGeometry(2 * tw + 0.5, 0.08, 2 * td + 0.5), dark); under.position.y = -0.1; st.add(under);
    let origin = new THREE.Vector3(0, 0, 0);
    if (slot === 'wall' || slot === 'hang' || slot === 'corner') { const w = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.15, 0.2), wallM); w.position.set(slot === 'corner' ? -0.1 : 0, 1.075, -1.1); st.add(w); origin.set(0, 0, -1); }
    if (slot === 'corner') { const w = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.15, 2.0), wallM); w.position.set(-1.1, 1.075, 0); st.add(w); origin.set(-1, 0, -1); }
    const res = DECO.make(name, U.mulberry(seed * 977 + i * 31));
    const built = DECO.compose([{ res, m: new THREE.Matrix4().makeTranslation(origin.x, origin.y, origin.z) }]);
    st.add(built.group);
    built.lights.forEach((l) => { const p = new THREE.PointLight(new THREE.Color(l.color), l.intensity * 2.2, l.dist * 1.6, 1.6); p.position.set(l.x, l.y, l.z); st.add(p); });
    built.flames.forEach((f) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(f.w, f.h), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff9a3a').multiplyScalar(2), transparent: true, opacity: 0.8, toneMapped: false, side: THREE.DoubleSide })); m.position.set(f.x, f.y, f.z); st.add(m); });
    // caja real que ocupa la pieza (para avisar si se sale del volumen permitido)
    const bb = new THREE.Box3(); built.group.children.forEach((m) => { m.geometry.computeBoundingBox(); bb.union(m.geometry.boundingBox); });
    const lo = bb.min.clone().sub(origin), hi = bb.max.clone().sub(origin), V = VOL[slot];
    let ok = true;
    if (V) { const e = 0.011; ok = lo.x >= V[0][0] - e && lo.y >= V[0][1] - e && lo.z >= V[0][2] - e && hi.x <= V[1][0] + e && hi.y <= V[1][1] + e && hi.z <= V[1][2] + e; }
    else ok = hi.y <= 0.036;
    let tris = 0; built.group.children.forEach((m) => (tris += m.geometry.attributes.position.count / 3));
    stats.push({ name, slot, ok, tris, min: lo.toArray().map((v) => +v.toFixed(2)), max: hi.toArray().map((v) => +v.toFixed(2)), luces: built.lights.length });
    if (showVol && V) { const g = new THREE.BoxGeometry(V[1][0] - V[0][0], V[1][1] - V[0][1], V[1][2] - V[0][2]); const l = new THREE.LineSegments(new THREE.EdgesGeometry(g), lineM); l.position.set(origin.x + (V[0][0] + V[1][0]) / 2, (V[0][1] + V[1][1]) / 2, origin.z + (V[0][2] + V[1][2]) / 2); st.add(l); }
    if (showFig && slot !== 'block') { try { const f = MODELS.build(['barbaro', 'cazadora', 'hechicero', 'enano'][i % 4]); f.position.set(slot === 'floor' ? 0 : 0, 0, 0); st.add(f); } catch (e) { /* sin figura */ } }
    const lb = label(name + (ok ? '' : '  ⚠ SE SALE'), `${slot} · ${Math.round(tris)} tri`); lb.position.set(0, 0.01, td + 0.42); st.add(lb);
  });
  window.__stats = stats;
  const cam = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.5, 400);
  const fit = () => {
    const a = innerWidth / innerHeight, pitch = +(qs.get('pitch') || 0.82), yaw = +(qs.get('yaw') || 0);
    const need = Math.max(D * 1.05 + 3, (W + 1) / a * 1.05) ; const dist = +(qs.get('dist') || (need / (2 * Math.tan(15 * Math.PI / 180)) * 0.62));
    cam.aspect = a; cam.updateProjectionMatrix();
    cam.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist + 0.4); cam.lookAt(0, 0.6, 0.4);
  };
  fit(); addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); fit(); });
  const loop = () => { renderer.render(scene, cam); requestAnimationFrame(loop); }; loop();
  window.__listo = true;
})();
