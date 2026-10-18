/* ==========================================================================
   Motor de audio procedural: música generativa, ambiente, efectos y voz
   ========================================================================== */
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.vol = { master: 0.9, music: 0.55, sfx: 0.85, amb: 0.6, voice: 0.9 };
    this.muted = false;
    this.voiceMode = 'narrador'; // 'off' | 'narrador' | 'todos'
    this.music = { state: 'silence', theme: 'crypt', step: 0, next: 0, bar: 0, chord: 0 };
    this.ambTheme = null;
    this.ksCache = {};
    this.voices = [];
    this.hbTimer = 0;
    this.heartbeatOn = false;
  }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.sr = ctx.sampleRate;
    this.master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.25;
    this.master.connect(comp); comp.connect(ctx.destination);

    this.musicBus = ctx.createGain(); this.musicBus.connect(this.master);
    this.sfxBus = ctx.createGain(); this.sfxBus.connect(this.master);
    this.ambBus = ctx.createGain(); this.ambBus.connect(this.master);
    this.voiceBus = ctx.createGain(); this.voiceBus.connect(this.master);

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.makeIR(3.8, 2.6);
    this.revGain = ctx.createGain(); this.revGain.gain.value = 0.55;
    this.reverb.connect(this.revGain); this.revGain.connect(this.master);
    this.revSendMusic = ctx.createGain(); this.revSendMusic.gain.value = 0.7; this.revSendMusic.connect(this.reverb);
    this.revSendSfx = ctx.createGain(); this.revSendSfx.gain.value = 0.35; this.revSendSfx.connect(this.reverb);

    this.white = this.makeNoise('white', 2.5);
    this.pink = this.makeNoise('pink', 3);
    this.brown = this.makeNoise('brown', 4);
    this.applyVolumes();
    this.ready = true;
    this.scheduler = setInterval(() => this.schedule(), 50);
    if (this.ambTheme) this.startAmbient(this.ambTheme);
  }

  applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.muted ? 0 : this.vol.master * 2.1, t, 0.05);
    this.musicBus.gain.setTargetAtTime(this.vol.music * 0.8, t, 0.2);
    this.sfxBus.gain.setTargetAtTime(this.vol.sfx * 0.8, t, 0.05);
    this.ambBus.gain.setTargetAtTime(this.vol.amb * 0.55, t, 0.3);
    this.voiceBus.gain.setTargetAtTime(this.vol.voice, t, 0.05);
  }
  setMuted(m) { this.muted = m; this.applyVolumes(); if (m && window.speechSynthesis) speechSynthesis.cancel(); }

  makeIR(seconds, decay) {
    const len = Math.floor(this.sr * seconds), buf = this.ctx.createBuffer(2, len, this.sr);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * (i < this.sr * 0.012 ? i / (this.sr * 0.012) : 1);
      }
    }
    return buf;
  }
  makeNoise(kind, seconds) {
    const len = Math.floor(this.sr * seconds), buf = this.ctx.createBuffer(1, len, this.sr), d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'white') d[i] = w;
      else if (kind === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      } else { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    }
    return buf;
  }

  /* ---------- primitivas ---------- */
  out(bus, pan, rev) {
    const ctx = this.ctx;
    let node = bus;
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = U.clamp(pan, -1, 1); p.connect(bus); node = p; }
    return { node, rev };
  }
  tone(freq, t, dur, vol, o = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx, osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.glide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.glide), t + (o.glideT || dur));
    if (o.detune) osc.detune.value = o.detune;
    if (o.vibrato) {
      const l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = o.vibrato; lg.gain.value = o.vibDepth || 6; l.connect(lg); lg.connect(osc.detune); l.start(t); l.stop(t + dur + 0.1);
    }
    const a = o.attack ?? 0.005, r = o.release ?? Math.max(0.02, dur * 0.6);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    if (o.sustain != null) g.gain.setValueAtTime(vol * o.sustain, t + a + 0.02);
    g.gain.setTargetAtTime(0.0001, t + Math.max(a, dur - r), r / 4);
    let last = osc;
    if (o.filter) {
      const f = ctx.createBiquadFilter(); f.type = o.filter; f.frequency.setValueAtTime(o.freq || 1200, t); f.Q.value = o.q || 0.8;
      if (o.fglide) f.frequency.exponentialRampToValueAtTime(o.fglide, t + (o.fglideT || dur));
      osc.connect(f); last = f;
    }
    last.connect(g);
    const bus = o.bus || this.sfxBus;
    if (o.pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = U.clamp(o.pan, -1, 1); g.connect(p); p.connect(bus); } else g.connect(bus);
    if (o.rev !== false) g.connect(bus === this.musicBus ? this.revSendMusic : this.revSendSfx);
    osc.start(t); osc.stop(t + dur + 0.6);
    osc.onended = () => { try { g.disconnect(); } catch (e) {} };
    return osc;
  }
  noise(t, dur, vol, o = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx, src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = o.color === 'pink' ? this.pink : o.color === 'brown' ? this.brown : this.white;
    src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = o.filter || 'bandpass'; f.frequency.setValueAtTime(o.freq || 1000, t); f.Q.value = o.q ?? 1;
    if (o.fglide) f.frequency.exponentialRampToValueAtTime(o.fglide, t + (o.fglideT || dur));
    const a = o.attack ?? 0.004;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.setTargetAtTime(0.0001, t + Math.max(a, dur * (o.hold ?? 0.3)), (o.release ?? dur * 0.5) / 4);
    src.connect(f); f.connect(g);
    const bus = o.bus || this.sfxBus;
    if (o.pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = U.clamp(o.pan, -1, 1); g.connect(p); p.connect(bus); } else g.connect(bus);
    if (o.rev !== false) g.connect(bus === this.musicBus ? this.revSendMusic : this.revSendSfx);
    src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.8);
    src.onended = () => { try { g.disconnect(); } catch (e) {} };
  }
  ks(freq) {
    const k = Math.round(freq * 10);
    if (this.ksCache[k]) return this.ksCache[k];
    const sr = this.sr, len = Math.floor(sr * 2.2), buf = this.ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    const N = Math.max(2, Math.round(sr / freq)), ring = new Float32Array(N);
    for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
    let idx = 0, prev = 0;
    for (let i = 0; i < len; i++) {
      const cur = ring[idx];
      const nv = 0.996 * 0.5 * (cur + prev);
      prev = cur; ring[idx] = nv; d[i] = cur * 0.6;
      idx = (idx + 1) % N;
    }
    return (this.ksCache[k] = buf);
  }
  pluck(freq, t, vol, o = {}) {
    if (!this.ctx) return;
    const src = this.ctx.createBufferSource(), g = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
    src.buffer = this.ks(freq); f.type = 'lowpass'; f.frequency.value = o.bright || 3200;
    g.gain.value = vol; src.connect(f); f.connect(g);
    const bus = o.bus || this.musicBus; g.connect(bus); g.connect(this.revSendMusic);
    src.start(t); src.onended = () => { try { g.disconnect(); } catch (e) {} };
  }
  bell(freq, t, vol, o = {}) {
    const partials = o.partials || [1, 2.01, 2.76, 4.07, 5.43];
    partials.forEach((p, i) => this.tone(freq * p, t, (o.dur || 3.2) / (1 + i * 0.6), vol / (1 + i * 1.3), { attack: 0.002, release: (o.dur || 3.2) / (1 + i * 0.5), bus: o.bus || this.musicBus, pan: o.pan }));
  }
  choir(freq, t, dur, vol, o = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const vowels = { a: [800, 1150, 2900], o: [450, 800, 2830], u: [325, 700, 2530], e: [400, 1600, 2700] };
    const F = vowels[o.vowel || 'a'];
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + (o.attack || 1.6)); g.gain.setTargetAtTime(0.0001, t + dur - (o.release || 1.8), (o.release || 1.8) / 3);
    const sum = ctx.createGain(); sum.gain.value = 0.33;
    [-9, 0, 8].forEach((det) => {
      const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = freq; osc.detune.value = det;
      const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 4.6 + Math.random(); lg.gain.value = 9; l.connect(lg); lg.connect(osc.detune);
      osc.connect(sum); osc.start(t); osc.stop(t + dur + 0.2); l.start(t); l.stop(t + dur + 0.2);
    });
    F.forEach((ff, i) => { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = ff; bp.Q.value = 9; const bg = ctx.createGain(); bg.gain.value = [1, 0.5, 0.25][i]; sum.connect(bp); bp.connect(bg); bg.connect(g); });
    g.connect(o.bus || this.musicBus); g.connect(this.revSendMusic);
    setTimeout(() => { try { g.disconnect(); } catch (e) {} }, (dur + 1) * 1000 + (t - ctx.currentTime) * 1000);
  }
  pad(freqs, t, dur, vol, o = {}) {
    freqs.forEach((f, i) => {
      this.tone(f, t, dur, vol, { type: o.type || 'sawtooth', detune: (i % 2 ? 7 : -7), attack: o.attack || 1.8, release: o.release || 2.2, filter: 'lowpass', freq: o.cut || 700, q: 0.4, bus: this.musicBus, pan: (i - (freqs.length - 1) / 2) * 0.35, vibrato: 0.2 + Math.random() * 0.2, vibDepth: 4 });
    });
  }
  drum(t, vol, o = {}) {
    const f0 = o.freq || 70;
    this.tone(f0 * 2.2, t, o.dur || 0.6, vol, { glide: f0, glideT: 0.12, attack: 0.002, release: (o.dur || 0.6) * 0.9, bus: o.bus || this.musicBus, rev: true });
    this.noise(t, 0.08, vol * 0.5, { filter: 'lowpass', freq: o.nf || 900, q: 0.4, bus: o.bus || this.musicBus, hold: 0.1, release: 0.08 });
  }
  clang(t, vol, base = 520, o = {}) {
    [1, 2.76, 5.4, 8.93, 13.3].forEach((r, i) => this.tone(base * r * (1 + Math.random() * 0.01), t, 0.9 / (1 + i * 0.5), vol / (1 + i), { attack: 0.001, release: 0.6 / (1 + i * 0.3), pan: o.pan }));
  }

  /* ---------- efectos ---------- */
  sfx(name, o = {}) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + 0.01, pan = o.pan || 0, v = o.vol ?? 1;
    switch (name) {
      case 'ui': this.tone(1320, t, 0.06, 0.06 * v, { type: 'triangle', rev: false }); this.tone(1980, t + 0.015, 0.05, 0.03 * v, { rev: false }); break;
      case 'uiBack': this.tone(880, t, 0.07, 0.05 * v, { type: 'triangle', glide: 660, rev: false }); break;
      case 'hover': this.tone(2400, t, 0.03, 0.015 * v, { rev: false }); break;
      case 'step':
        this.noise(t, 0.07, 0.24 * v, { filter: 'lowpass', freq: 380 + Math.random() * 160, q: 0.8, pan, hold: 0.05, release: 0.06 });
        this.tone(95 + Math.random() * 20, t, 0.08, 0.09 * v, { glide: 50, attack: 0.002, pan, rev: false }); break;
      case 'hop': this.noise(t, 0.05, 0.08 * v, { filter: 'highpass', freq: 2500, pan, hold: 0.1, release: 0.04 }); break;
      case 'swing': this.noise(t, 0.28, 0.32 * v, { filter: 'bandpass', freq: 600, fglide: 3200, fglideT: 0.22, q: 1.6, pan, hold: 0.4, release: 0.15 }); break;
      case 'hit':
        this.noise(t, 0.16, 0.5 * v, { filter: 'lowpass', freq: 1400, fglide: 300, q: 0.7, pan, hold: 0.1, release: 0.12 });
        this.tone(140, t, 0.2, 0.35 * v, { glide: 45, attack: 0.002, pan }); break;
      case 'block': this.clang(t, 0.16 * v, 430 + Math.random() * 80, { pan }); this.noise(t, 0.05, 0.2 * v, { filter: 'highpass', freq: 3000, pan, hold: 0.1, release: 0.05 }); break;
      case 'bone': for (let i = 0; i < 5; i++) this.noise(t + i * 0.035 + Math.random() * 0.02, 0.03, 0.22 * v, { filter: 'bandpass', freq: 1800 + Math.random() * 1500, q: 4, pan, hold: 0.1, release: 0.02 }); break;
      case 'arrow': this.noise(t, 0.3, 0.2 * v, { filter: 'bandpass', freq: 3000, fglide: 900, q: 3, pan, hold: 0.2, release: 0.2 }); this.tone(220, t, 0.06, 0.1 * v, { type: 'triangle', glide: 120, rev: false }); break;
      case 'magic':
        [0, 4, 7, 12, 16].forEach((s, i) => this.tone(523.25 * Math.pow(2, s / 12), t + i * 0.045, 0.6, 0.06 * v, { type: 'sine', attack: 0.01, release: 0.5, pan }));
        this.noise(t, 0.5, 0.12 * v, { filter: 'bandpass', freq: 5000, fglide: 1500, q: 2, pan, hold: 0.3, release: 0.4 }); break;
      case 'fire':
        this.noise(t, 0.7, 0.45 * v, { filter: 'lowpass', freq: 2200, fglide: 300, q: 0.5, color: 'pink', pan, hold: 0.3, release: 0.5 });
        this.tone(80, t, 0.6, 0.3 * v, { glide: 40, pan }); break;
      case 'dark':
        this.tone(110, t, 0.9, 0.18 * v, { type: 'sawtooth', glide: 55, filter: 'lowpass', freq: 600, fglide: 150, pan });
        this.noise(t, 0.8, 0.2 * v, { filter: 'bandpass', freq: 300, q: 3, pan, hold: 0.4, release: 0.5 }); break;
      case 'heal': [0, 7, 12, 19, 24].forEach((s, i) => this.tone(587.33 * Math.pow(2, s / 12), t + i * 0.07, 1.2, 0.05 * v, { type: 'triangle', attack: 0.02, release: 1, pan })); break;
      case 'shield': this.clang(t, 0.12 * v, 330, { pan }); this.tone(220, t, 1.2, 0.12 * v, { type: 'triangle', vibrato: 5, vibDepth: 8, attack: 0.05 }); break;
      case 'door':
        this.tone(70, t, 0.9, 0.4 * v, { type: 'sawtooth', glide: 95, filter: 'bandpass', freq: 420, q: 6, vibrato: 11, vibDepth: 60, pan });
        this.tone(140, t + 0.1, 0.7, 0.12 * v, { type: 'sawtooth', glide: 180, filter: 'bandpass', freq: 900, q: 8, vibrato: 17, vibDepth: 80, pan });
        this.noise(t + 0.75, 0.3, 0.9 * v, { filter: 'lowpass', freq: 260, q: 0.6, color: 'brown', pan, hold: 0.2, release: 0.25 }); break;
      case 'doorSlam': this.noise(t, 0.4, 0.6 * v, { filter: 'lowpass', freq: 220, q: 0.6, color: 'brown', hold: 0.15, release: 0.3 }); this.tone(55, t, 0.4, 0.4 * v, { glide: 35 }); break;
      case 'chest':
        this.tone(140, t, 0.35, 0.12 * v, { type: 'sawtooth', glide: 210, filter: 'bandpass', freq: 600, q: 5, pan });
        for (let i = 0; i < 6; i++) this.tone(1800 + Math.random() * 1600, t + 0.3 + i * 0.05, 0.25, 0.05 * v, { type: 'sine', attack: 0.001, release: 0.2, pan }); break;
      case 'gold': for (let i = 0; i < 7; i++) this.tone(2200 + Math.random() * 2400, t + i * 0.04 + Math.random() * 0.02, 0.18, 0.07 * v, { attack: 0.001, release: 0.15, pan }); break;
      case 'potion': for (let i = 0; i < 6; i++) this.tone(300 + Math.random() * 500, t + i * 0.06, 0.08, 0.06 * v, { glide: 900, attack: 0.005, pan }); this.sfx('heal', { vol: 0.5 }); break;
      case 'dice': for (let i = 0; i < 9; i++) this.noise(t + i * 0.05 + Math.random() * 0.03, 0.02, (0.6 - i * 0.045) * v, { filter: 'bandpass', freq: 2200 + Math.random() * 1800, q: 5, hold: 0.1, release: 0.02, rev: false }); break;
      case 'diceLand': this.noise(t, 0.04, 0.7 * v, { filter: 'bandpass', freq: 1500, q: 3, hold: 0.1, release: 0.03, rev: false }); break;
      case 'trap': this.clang(t, 0.2 * v, 700, { pan }); this.noise(t, 0.25, 0.4 * v, { filter: 'highpass', freq: 1800, fglide: 6000, pan, hold: 0.2, release: 0.15 }); break;
      case 'explode': this.noise(t, 1.2, 0.45 * v, { filter: 'lowpass', freq: 1800, fglide: 120, q: 0.4, color: 'brown', pan, hold: 0.15, release: 0.9 }); this.tone(60, t, 1, 0.5 * v, { glide: 28 }); break;
      case 'death': this.tone(220, t, 0.9, 0.2 * v, { type: 'sawtooth', glide: 60, filter: 'lowpass', freq: 900, fglide: 120, pan }); this.noise(t, 0.6, 0.18 * v, { filter: 'bandpass', freq: 500, fglide: 150, q: 2, pan, hold: 0.3, release: 0.4 }); break;
      case 'heroDown': [0, -3, -7].forEach((s, i) => this.tone(220 * Math.pow(2, s / 12), t + i * 0.18, 1.4, 0.12 * v, { type: 'triangle', attack: 0.02 })); break;
      case 'torch': this.noise(t, 0.6, 0.35 * v, { filter: 'lowpass', freq: 400, fglide: 2400, fglideT: 0.15, color: 'pink', pan, hold: 0.2, release: 0.4 }); break;
      case 'torchOut': this.noise(t, 0.5, 0.4 * v, { filter: 'bandpass', freq: 1800, fglide: 200, q: 1, pan, hold: 0.2, release: 0.3 }); break;
      case 'reveal':
        this.tone(55, t, 2.6, 0.32 * v, { type: 'sine', attack: 0.05, release: 2 });
        this.noise(t, 1.8, 0.15 * v, { filter: 'bandpass', freq: 200, fglide: 2400, q: 1.2, color: 'pink', hold: 0.4, release: 1.2 });
        [0, 3, 7, 10].forEach((s, i) => this.tone(293.66 * Math.pow(2, s / 12), t + 0.2 + i * 0.12, 2.2, 0.04 * v, { type: 'triangle', attack: 0.3 })); break;
      case 'scare':
        [0, 1, 6, 11, 13].forEach((s) => this.tone(185 * Math.pow(2, s / 12), t, 1.6, 0.06 * v, { type: 'sawtooth', attack: 0.004, release: 1.2, filter: 'lowpass', freq: 3000, fglide: 500, vibrato: 7, vibDepth: 25 }));
        this.noise(t, 1.2, 0.28 * v, { filter: 'highpass', freq: 800, fglide: 4000, color: 'white', hold: 0.15, release: 0.8 });
        this.tone(40, t, 1.4, 0.4 * v, { glide: 28 }); break;
      case 'whisper': this.whisper(o.dur || 2.2, v); break;
      case 'heartbeat': this.tone(60, t, 0.18, 0.5 * v, { glide: 40, attack: 0.003, rev: false }); this.tone(55, t + 0.22, 0.2, 0.38 * v, { glide: 38, attack: 0.003, rev: false }); break;
      case 'turnHero': [0, 7, 12].forEach((s, i) => this.tone(293.66 * Math.pow(2, s / 12), t + i * 0.09, 0.9, 0.06 * v, { type: 'triangle', attack: 0.01 })); break;
      case 'turnShadow': this.tone(73.4, t, 2, 0.3 * v, { type: 'sawtooth', filter: 'lowpass', freq: 300, attack: 0.05 }); this.tone(77.8, t, 2, 0.2 * v, { type: 'sawtooth', filter: 'lowpass', freq: 300, attack: 0.05 }); this.drum(t, 0.6 * v, { bus: this.sfxBus, freq: 50 }); break;
      case 'levelUp': [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => this.tone(392 * Math.pow(2, s / 12), t + i * 0.06, 0.8, 0.06 * v, { type: 'triangle' })); break;
      case 'buy': this.sfx('gold'); this.clang(t + 0.05, 0.08 * v, 900); break;
      case 'summon': this.tone(80, t, 1.4, 0.3 * v, { type: 'sawtooth', glide: 220, filter: 'lowpass', freq: 300, fglide: 2400 }); this.noise(t, 1.2, 0.25 * v, { filter: 'bandpass', freq: 400, fglide: 3000, q: 2, hold: 0.5, release: 0.6 }); break;
      case 'lava': this.noise(t, 0.4, 0.3 * v, { filter: 'lowpass', freq: 300, color: 'brown', pan, hold: 0.2, release: 0.3 }); this.tone(90 + Math.random() * 60, t + 0.05, 0.12, 0.15 * v, { glide: 200 }); break;
      case 'glass': for (let i = 0; i < 8; i++) this.tone(3000 + Math.random() * 3000, t + i * 0.025, 0.4, 0.05 * v, { attack: 0.001, release: 0.35, pan }); this.noise(t, 0.3, 0.3 * v, { filter: 'highpass', freq: 4000, pan, hold: 0.1, release: 0.2 }); break;
      case 'quake': this.noise(t, 2, 0.6 * v, { filter: 'lowpass', freq: 120, color: 'brown', q: 0.5, hold: 0.5, release: 1.2 }); break;
      case 'bossRoar': this.tone(70, t, 1.6, 0.35 * v, { type: 'sawtooth', glide: 45, filter: 'lowpass', freq: 800, fglide: 200, vibrato: 18, vibDepth: 40 }); this.noise(t, 1.5, 0.4 * v, { filter: 'bandpass', freq: 400, q: 1.5, color: 'pink', hold: 0.5, release: 0.8 }); break;
      case 'page': this.noise(t, 0.25, 0.18 * v, { filter: 'highpass', freq: 2500, fglide: 5000, hold: 0.3, release: 0.15 }); break;
      case 'type': this.noise(t, 0.012, 0.03 * v, { filter: 'bandpass', freq: 2600 + Math.random() * 800, q: 3, hold: 0.1, release: 0.01, rev: false }); break;
      case 'deny': this.tone(196, t, 0.16, 0.08 * v, { type: 'square', filter: 'lowpass', freq: 900, rev: false }); this.tone(185, t + 0.09, 0.16, 0.08 * v, { type: 'square', filter: 'lowpass', freq: 900, rev: false }); break;
    }
  }
  whisper(dur, v = 1) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.02;
    const syll = Math.floor(dur * 5);
    for (let i = 0; i < syll; i++) {
      const tt = t + i * (dur / syll) + Math.random() * 0.05;
      const pan = Math.sin(i * 1.7) * 0.8;
      this.noise(tt, 0.16, 0.09 * v, { filter: 'bandpass', freq: 900 + Math.random() * 1800, fglide: 600 + Math.random() * 2400, q: 6, color: 'white', pan, hold: 0.4, release: 0.12 });
      if (Math.random() < 0.4) this.noise(tt + 0.05, 0.1, 0.05 * v, { filter: 'highpass', freq: 5000, pan, hold: 0.2, release: 0.08 });
    }
  }

  /* ---------- ambiente ---------- */
  startAmbient(theme) {
    this.ambTheme = theme;
    if (!this.ctx) return;
    this.stopAmbient();
    const ctx = this.ctx, nodes = [];
    const t = ctx.currentTime;
    const mk = (buf, filt, f, q, vol) => {
      const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
      const fl = ctx.createBiquadFilter(); fl.type = filt; fl.frequency.value = f; fl.Q.value = q;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 3);
      s.connect(fl); fl.connect(g); g.connect(this.ambBus); s.start(t, Math.random()); nodes.push(s, g, fl); return { s, fl, g };
    };
    const rumble = mk(this.brown, 'lowpass', theme === 'forge' ? 160 : 110, 0.7, theme === 'forge' ? 0.5 : 0.35);
    const wind = mk(this.pink, 'bandpass', 500, 0.9, 0.06);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 300; lfo.connect(lg); lg.connect(wind.fl.frequency); lfo.start(); nodes.push(lfo, lg);
    if (theme === 'void') {
      const hum = ctx.createOscillator(); hum.type = 'sine'; hum.frequency.value = 49;
      const h2 = ctx.createOscillator(); h2.type = 'sine'; h2.frequency.value = 49.6;
      const hg = ctx.createGain(); hg.gain.value = 0.08; hum.connect(hg); h2.connect(hg); hg.connect(this.ambBus); hum.start(); h2.start(); nodes.push(hum, h2, hg);
    }
    if (theme === 'camp') {
      const crackle = mk(this.white, 'highpass', 2500, 0.5, 0.0);
      nodes.push(crackle.g);
      this._crackle = true;
    } else this._crackle = false;
    this.ambNodes = nodes;
    this.nextAmbEvent = t + 3;
  }
  stopAmbient() {
    if (!this.ambNodes) return;
    const t = this.ctx.currentTime;
    this.ambNodes.forEach((n) => { if (n.gain) n.gain.setTargetAtTime(0.0001, t, 0.6); });
    const old = this.ambNodes; this.ambNodes = null;
    setTimeout(() => old.forEach((n) => { try { n.stop && n.stop(); n.disconnect(); } catch (e) {} }), 3000);
  }
  ambientEvent(t) {
    const th = this.ambTheme;
    const r = Math.random();
    const pan = U.rand(-0.9, 0.9);
    if (th === 'crypt') {
      if (r < 0.45) { const f = U.rand(900, 1700); this.tone(f, t, 0.18, 0.05, { glide: f * 0.55, attack: 0.002, bus: this.ambBus, pan }); }
      else if (r < 0.65) this.whisper(1.6, 0.6);
      else if (r < 0.85) for (let i = 0; i < 4; i++) this.clang(t + i * 0.22, 0.025, 900 + Math.random() * 300, { pan });
      else this.noise(t, 2.2, 0.12, { filter: 'lowpass', freq: 180, color: 'brown', bus: this.ambBus, hold: 0.4, release: 1.2 });
    } else if (th === 'forge') {
      if (r < 0.4) for (let i = 0; i < 3; i++) this.clang(t + i * 0.55, 0.03, 380 + Math.random() * 40, { pan });
      else if (r < 0.8) for (let i = 0; i < 4; i++) this.noise(t + i * 0.12, 0.15, 0.12, { filter: 'lowpass', freq: 250, color: 'brown', bus: this.ambBus, pan, hold: 0.2, release: 0.1 });
      else this.tone(60, t, 2.5, 0.12, { type: 'sawtooth', filter: 'lowpass', freq: 200, bus: this.ambBus, attack: 0.8 });
    } else if (th === 'void') {
      if (r < 0.5) this.bell(U.pick([1174.7, 1396.9, 1567.9, 1760]), t, 0.03, { bus: this.ambBus, pan, dur: 4, partials: [1, 2.4, 3.9] });
      else if (r < 0.75) this.whisper(2.2, 0.5);
      else this.tone(U.rand(200, 260), t, 3, 0.04, { type: 'sine', glide: 120, attack: 1, bus: this.ambBus, vibrato: 3, vibDepth: 30 });
    } else if (th === 'camp') {
      for (let i = 0; i < 6; i++) this.noise(t + Math.random() * 1.2, 0.015, 0.12, { filter: 'highpass', freq: 3000 + Math.random() * 2000, bus: this.ambBus, pan, hold: 0.1, release: 0.01 });
      if (r < 0.15) this.tone(U.rand(2400, 3200), t + 0.5, 0.12, 0.02, { type: 'triangle', glide: 2000, bus: this.ambBus, pan });
    }
  }

  /* ---------- música generativa ---------- */
  setMusic(state, theme) {
    if (theme) this.music.theme = theme;
    if (this.music.state === state) return;
    this.music.state = state;
    this.music.bar = 0; this.music.step = 0;
    if (this.ctx) {
      const t = this.ctx.currentTime;
      this.musicBus.gain.setTargetAtTime(0.0001, t, 0.25);
      this.musicBus.gain.setTargetAtTime(this.vol.music * 0.8, t + 0.9, 0.6);
      this.music.next = t + 0.8;
    }
  }
  stinger(kind) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + 0.02;
    if (kind === 'victory') {
      [[0, 4, 7], [5, 9, 12], [7, 11, 14], [12, 16, 19]].forEach((ch, i) => ch.forEach((s) => this.tone(293.66 * Math.pow(2, s / 12), t + i * 0.32, i === 3 ? 2.8 : 0.6, 0.06, { type: 'sawtooth', filter: 'lowpass', freq: 1800, attack: 0.02, bus: this.musicBus })));
      this.drum(t, 0.5); this.drum(t + 0.96, 0.6);
    } else if (kind === 'defeat') {
      [[0, 3, 7], [-2, 2, 5], [-4, 0, 3], [-5, -2, 2]].forEach((ch, i) => ch.forEach((s) => this.tone(220 * Math.pow(2, s / 12), t + i * 0.7, 1.4, 0.06, { type: 'triangle', attack: 0.1, bus: this.musicBus })));
    } else if (kind === 'boss') {
      this.drum(t, 0.9, { freq: 45, dur: 1.4 }); this.drum(t + 0.5, 0.8, { freq: 45, dur: 1.2 });
      [0, 1, 6].forEach((s) => this.tone(73.4 * Math.pow(2, s / 12), t, 3, 0.12, { type: 'sawtooth', filter: 'lowpass', freq: 900, attack: 0.02, bus: this.musicBus }));
    } else if (kind === 'chapter') {
      this.bell(146.83, t, 0.12, { dur: 6 }); this.bell(220, t + 0.02, 0.06, { dur: 6 });
      this.tone(36.7, t, 5, 0.3, { attack: 0.5, bus: this.musicBus });
    } else if (kind === 'twist') {
      [0, 1, 4, 6].forEach((s, i) => this.tone(110 * Math.pow(2, s / 12), t + i * 0.08, 4, 0.08, { type: 'sawtooth', filter: 'lowpass', freq: 1400, attack: 0.5, vibrato: 5, vibDepth: 20, bus: this.musicBus }));
      this.choir(220, t, 5, 0.12, { vowel: 'o' });
    }
  }
  schedule() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    if (this.ambNodes && now > (this.nextAmbEvent || 0)) {
      this.ambientEvent(now + 0.05);
      this.nextAmbEvent = now + (this.ambTheme === 'camp' ? U.rand(0.6, 1.6) : U.rand(4, 10));
    }
    if (this.heartbeatOn && now > this.hbTimer) { this.sfx('heartbeat', { vol: 0.7 }); this.hbTimer = now + 1.05; }
    const M = this.music;
    if (M.state === 'silence') return;
    if (!M.next || M.next < now - 1) M.next = now + 0.1;
    while (M.next < now + 0.35) { this.playStep(M.next); }
  }
  playStep(t) {
    const M = this.music, st = M.state;
    const D = 146.83; // Re3
    const S = (s) => D * Math.pow(2, s / 12);
    const prog = {
      menu: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -1, 2]],
      explore: [[0, 3, 7], [-4, 0, 3], [-7, -4, 0], [-5, -1, 2]],
      combat: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -1, 2]],
      boss: [[0, 3, 7], [1, 5, 8], [0, 3, 7], [-1, 2, 6]],
      camp: [[0, 3, 7], [3, 7, 10], [-2, 2, 5], [0, 3, 7]],
      void: [[0, 3, 7], [-1, 3, 6], [-4, 0, 3], [-6, -2, 1]]
    };
    let bpm = 60, stepsPerBar = 8;
    if (st === 'combat') bpm = 84; else if (st === 'boss') bpm = 100; else if (st === 'camp') bpm = 72; else if (st === 'menu') bpm = 52;
    const stepDur = 60 / bpm / 2; // corcheas
    const stepInBar = M.step % stepsPerBar;
    const key = st === 'explore' && M.theme === 'void' ? 'void' : st;
    const P = prog[key] || prog.explore;
    const barsPerChord = (st === 'explore' || st === 'menu') ? 2 : 1;
    const chord = P[Math.floor(M.bar / barsPerChord) % P.length];
    const v = 1;
    if (stepInBar === 0) {
      const chordStart = M.bar % barsPerChord === 0;
      if (st === 'explore' || st === 'menu') {
        if (chordStart) {
          const dur = stepDur * stepsPerBar * barsPerChord + 1.5;
          this.pad(chord.map((s) => S(s)), t, dur, (st === 'menu' ? 0.075 : 0.06) * v, { cut: M.theme === 'forge' ? 900 : 650, attack: 2.5, release: 3 });
          this.tone(S(chord[0] - 12), t, dur, 0.09, { type: 'triangle', attack: 2, release: 2.5, bus: this.musicBus });
          if (st === 'menu' || Math.random() < 0.5) this.choir(S(chord[1]), t + 0.5, dur, 0.085, { vowel: Math.random() < 0.5 ? 'a' : 'o' });
        }
      } else if (st === 'combat') {
        this.pad(chord.map((s) => S(s)), t, stepDur * stepsPerBar + 0.6, 0.035, { cut: 1100, attack: 0.4, release: 0.8 });
        this.tone(S(chord[0] - 12), t, stepDur * 1.5, 0.12, { type: 'sawtooth', filter: 'lowpass', freq: 520, attack: 0.01, bus: this.musicBus });
      } else if (st === 'boss') {
        this.pad(chord.map((s) => S(s)), t, stepDur * stepsPerBar + 0.4, 0.04, { cut: 1500, attack: 0.15, release: 0.6 });
        if (M.bar % 2 === 0) this.choir(S(chord[0] + 12), t, stepDur * stepsPerBar * 2, 0.07, { vowel: 'a', attack: 0.6 });
        this.tone(S(chord[0] + 12), t, 0.3, 0.06, { type: 'sawtooth', filter: 'lowpass', freq: 2200, fglide: 600, attack: 0.005, bus: this.musicBus });
      } else if (st === 'camp') {
        this.tone(S(chord[0] - 12), t, stepDur * stepsPerBar, 0.06, { type: 'triangle', attack: 0.5, release: 1, bus: this.musicBus });
      }
    }
    // capas rítmicas / melódicas
    if (st === 'explore' || st === 'menu') {
      if (Math.random() < (st === 'menu' ? 0.12 : 0.09)) {
        const scale = [0, 2, 3, 5, 7, 8, 10, 12, 14, 15];
        const n = S(U.pick(scale) + 12);
        if (M.theme === 'forge') this.pluck(n / 2, t, 0.25);
        else this.bell(n, t, 0.07, { dur: 4, pan: U.rand(-0.6, 0.6) });
      }
    } else if (st === 'combat') {
      if (stepInBar === 0 || stepInBar === 4) this.drum(t, 0.55, { freq: 52 });
      if (stepInBar === 3 || stepInBar === 7) this.drum(t, 0.22, { freq: 90, dur: 0.25 });
      if (stepInBar % 2 === 1) this.noise(t, 0.04, 0.03, { filter: 'highpass', freq: 6000, bus: this.musicBus, hold: 0.1, release: 0.03 });
      const arp = [0, 1, 2, 1];
      if (stepInBar % 2 === 0) this.tone(S(chord[arp[(stepInBar / 2) % 4]]), t, stepDur * 0.9, 0.035, { type: 'square', filter: 'lowpass', freq: 1300, attack: 0.005, bus: this.musicBus });
    } else if (st === 'boss') {
      if ([0, 3, 4, 6].includes(stepInBar)) this.drum(t, stepInBar === 0 ? 0.8 : 0.45, { freq: stepInBar === 0 ? 42 : 60 });
      this.noise(t, 0.03, stepInBar % 2 ? 0.02 : 0.04, { filter: 'highpass', freq: 7000, bus: this.musicBus, hold: 0.1, release: 0.03 });
      this.tone(S(chord[stepInBar % 3] - 12), t, stepDur * 0.8, 0.07, { type: 'sawtooth', filter: 'lowpass', freq: 700, attack: 0.004, bus: this.musicBus });
    } else if (st === 'camp') {
      const pat = [0, 2, 1, 2, 0, 2, 1, 3];
      const ns = chord.concat([chord[0] + 12]);
      this.pluck(S(ns[pat[stepInBar]]), t + Math.random() * 0.01, 0.55);
      if (stepInBar === 6 && Math.random() < 0.4) this.pluck(S(ns[2] + 12), t + stepDur * 0.5, 0.18);
    }
    M.step++;
    if (M.step % stepsPerBar === 0) M.bar++;
    M.next = t + stepDur;
  }

  heartbeat(on) { this.heartbeatOn = on; }

  /* ---------- voz narrada ---------- */
  pickVoice() {
    if (!('speechSynthesis' in window)) return null;
    const vs = speechSynthesis.getVoices();
    if (!vs || !vs.length) return null;
    const es = vs.filter((v) => /^es/i.test(v.lang));
    const score = (v) => (/natural|neural|online/i.test(v.name) ? 10 : 0) + (/es-ES/i.test(v.lang) ? 4 : 0) + (/google/i.test(v.name) ? 3 : 0) + (/microsoft/i.test(v.name) ? 2 : 0);
    es.sort((a, b) => score(b) - score(a));
    return es[0] || null;
  }
  speak(text, who) {
    if (this.muted || this.voiceMode === 'off' || !('speechSynthesis' in window)) return;
    if (this.voiceMode === 'narrador' && !['narrador', 'isolde', 'voz'].includes(who)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[«»—]/g, ' '));
      const v = this.pickVoice();
      if (v) u.voice = v;
      u.lang = (v && v.lang) || 'es-ES';
      const prof = { narrador: [0.92, 0.82], isolde: [0.86, 1.08], voz: [0.75, 0.4], aldric: [0.95, 0.78], sera: [1.04, 1.12], elian: [1, 1], malakor: [0.82, 0.5], ignis: [0.85, 0.35], aethelgard: [0.8, 0.6], thrain: [0.9, 0.55], tomas: [0.9, 0.9] }[who] || [0.95, 0.9];
      u.rate = prof[0]; u.pitch = prof[1]; u.volume = U.clamp(this.vol.voice, 0, 1);
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  stopSpeech() { try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) {} }
}
const audio = new AudioEngine();
if ('speechSynthesis' in window) { try { speechSynthesis.onvoiceschanged = () => {}; speechSynthesis.getVoices(); } catch (e) {} }
