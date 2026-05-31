/* Flynn — Volumetric Tron grid void (three.js).
   Renders to #grid-void: a perspective grid receding into fog, lines
   flowing toward the viewer, with moderate mouse + scroll parallax.

   One engine, many looks. A page selects a variant:
       window.FLYNN_GRID_CONFIG = { variant: 'home' };
   ...before this script runs. Falls back to 'home'.

   Public API:  window.__gridVoid.setMotion(bool)
   Respects prefers-reduced-motion, pauses when the tab is hidden,
   caps pixel ratio, and trims the grid on small screens.
*/
(function () {
  if (typeof THREE === 'undefined') return;
  const canvas = document.getElementById('grid-void');
  if (!canvas) return;

  // ---- per-page variants --------------------------------------------------
  // colour stays in the cyan brand family; the feel changes per page via
  // density, speed, camera height/tilt, fog depth and a floor/tunnel toggle.
  const VARIANTS = {
    home:       { color: 0x47d8ff, cell: 4.0, half: 44, camY: 7.0,  look: -46, speed: 7.5,  opacity: 0.55, ceiling: true,  ceilH: 26, fog: [26, 188], parallax: 9 },
    whitepaper: { color: 0x3fb9e6, cell: 2.6, half: 52, camY: 5.0,  look: -54, speed: 3.0,  opacity: 0.34, ceiling: false, ceilH: 0,  fog: [20, 150], parallax: 5 },
    validation: { color: 0x4fe2ff, cell: 3.4, half: 46, camY: 6.0,  look: -48, speed: 6.0,  opacity: 0.5,  ceiling: false, ceilH: 0,  fog: [24, 172], parallax: 8 },
    roadmap:    { color: 0x52e6ff, cell: 4.4, half: 40, camY: 8.5,  look: -40, speed: 9.5,  opacity: 0.58, ceiling: true,  ceilH: 30, fog: [30, 200], parallax: 11 },
    tiers:      { color: 0x44d2f5, cell: 4.0, half: 44, camY: 6.4,  look: -50, speed: 5.0,  opacity: 0.48, ceiling: false, ceilH: 0,  fog: [26, 180], parallax: 7 },
    // industries: wide, calm, expansive
    industries: { color: 0x46cfee, cell: 5.4, half: 38, camY: 9.5,  look: -38, speed: 4.0,  opacity: 0.46, ceiling: false, ceilH: 0,  fog: [30, 210], parallax: 8 }
  };

  const want = (window.FLYNN_GRID_CONFIG && window.FLYNN_GRID_CONFIG.variant) || 'home';
  const cfg = Object.assign({}, VARIANTS[want] || VARIANTS.home, (window.FLYNN_GRID_CONFIG || {}));

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 680;
  if (small) { cfg.half = Math.round(cfg.half * 0.62); } // trim grid on phones
  let motion = !reduce;

  // ---- renderer / scene ---------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !small });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.6));

  const scene = new THREE.Scene();
  const fogColor = 0x05080e;
  scene.fog = new THREE.Fog(fogColor, cfg.fog[0], cfg.fog[1]);

  const camera = new THREE.PerspectiveCamera(64, 1, 0.1, 600);
  const baseCamY = cfg.camY;
  camera.position.set(0, baseCamY, 14);
  camera.lookAt(0, 0, cfg.look);

  // ---- build the grid -----------------------------------------------------
  const cell = cfg.cell;
  const half = cfg.half;                 // cells out from centre on x
  const xMax = half * cell;
  const zNear = 24;                      // a little behind the camera
  const zFar = -(cfg.fog[1] + cell * 2); // beyond the fog so it fades out
  const zCount = Math.ceil((zNear - zFar) / cell);

  function buildPlane(y) {
    const pts = [];
    // lines running into the distance (parallel to z)
    for (let i = -half; i <= half; i++) {
      const x = i * cell;
      pts.push(x, y, zNear, x, y, zFar);
    }
    // cross lines (parallel to x) — these read as the flow
    for (let j = 0; j <= zCount; j++) {
      const z = zNear - j * cell;
      pts.push(-xMax, y, z, xMax, y, z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: cfg.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: true
    });
    return new THREE.LineSegments(geo, mat);
  }

  const grid = new THREE.Group();
  grid.add(buildPlane(0));
  if (cfg.ceiling) {
    const ceil = buildPlane(cfg.ceilH);
    ceil.material.opacity = cfg.opacity * 0.6;
    grid.add(ceil);
  }
  scene.add(grid);

  // a soft horizon glow plane far down the tunnel
  const glowGeo = new THREE.PlaneGeometry(xMax * 2.4, cfg.ceiling ? cfg.ceilH * 2.2 : 60);
  const glowMat = new THREE.MeshBasicMaterial({
    color: cfg.color, transparent: true, opacity: 0.06,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(0, cfg.ceiling ? cfg.ceilH / 2 : 6, cfg.fog[1] * -0.78);
  scene.add(glow);

  // ---- orange tracers (click → streak into the vanishing point) ----------
  const TRACER_COLOR = 0xff9a40;
  const headTex = (function () {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0.0, 'rgba(255,214,158,1)');
    grd.addColorStop(0.35, 'rgba(255,150,64,0.85)');
    grd.addColorStop(1.0, 'rgba(255,120,40,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const tracers = [];
  const _head = new THREE.Vector3(), _tail = new THREE.Vector3();

  // cyan event-horizon burst textures
  const cyanTex = (function () {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0.0, 'rgba(216,250,255,1)');
    grd.addColorStop(0.35, 'rgba(90,224,255,0.8)');
    grd.addColorStop(1.0, 'rgba(60,200,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const fanTex = (function () {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64;
    const g = c.getContext('2d');
    // bright horizontal band, soft vertical falloff
    const vg = g.createLinearGradient(0, 0, 0, 64);
    vg.addColorStop(0.0, 'rgba(150,245,255,0)');
    vg.addColorStop(0.5, 'rgba(195,250,255,1)');
    vg.addColorStop(1.0, 'rgba(150,245,255,0)');
    g.fillStyle = vg; g.fillRect(0, 0, 256, 64);
    // fade the horizontal ends
    g.globalCompositeOperation = 'destination-in';
    const hg = g.createLinearGradient(0, 0, 256, 0);
    hg.addColorStop(0.0, 'rgba(0,0,0,0)');
    hg.addColorStop(0.5, 'rgba(0,0,0,1)');
    hg.addColorStop(1.0, 'rgba(0,0,0,0)');
    g.fillStyle = hg; g.fillRect(0, 0, 256, 64);
    g.globalCompositeOperation = 'source-over';
    return new THREE.CanvasTexture(c);
  })();
  const bursts = [];

  function spawnTracer(clientX, clientY, power = 0) {
    const mx = (clientX / window.innerWidth) * 2 - 1;
    const my = -(clientY / window.innerHeight) * 2 + 1;
    const ray = new THREE.Vector3(mx, my, 0.5).unproject(camera);
    const dir = ray.sub(camera.position).normalize();
    const start = camera.position.clone().add(dir.multiplyScalar(9)); // just ahead of the click
    // shoot parallel to the grid's depth axis (world -z): all tracers converge
    // on the true vanishing point — the horizon between the floor and ceiling.
    const dest = start.clone().add(new THREE.Vector3(0, 0, -1).multiplyScalar(Math.abs(cfg.fog[1]) * 1.4));

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([start.x, start.y, start.z, start.x, start.y, start.z], 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: TRACER_COLOR, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    }));
    line.frustumCulled = false;
    scene.add(line);

    const head = new THREE.Sprite(new THREE.SpriteMaterial({
      map: headTex, color: TRACER_COLOR, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false
    }));
    const baseScale = 3 * (1 + power * 1.8);
    head.scale.set(baseScale, baseScale, baseScale);
    head.position.copy(start);
    scene.add(head);

    tracers.push({ start, dest, t: 0, life: 0.7 + power * 0.25, line, head, baseScale, power });
    if (tracers.length > 18) disposeTracer(tracers.shift());
  }

  function disposeTracer(tr) {
    scene.remove(tr.line); tr.line.geometry.dispose(); tr.line.material.dispose();
    scene.remove(tr.head); tr.head.material.dispose();
  }

  function updateTracers(dt) {
    for (let i = tracers.length - 1; i >= 0; i--) {
      const tr = tracers[i];
      tr.t += dt / tr.life;
      const e = 1 - Math.pow(1 - Math.min(tr.t, 1), 3);      // easeOutCubic
      _head.lerpVectors(tr.start, tr.dest, e);
      _tail.lerpVectors(tr.start, tr.dest, Math.max(0, e - 0.24));
      const p = tr.line.geometry.attributes.position;
      p.setXYZ(0, _tail.x, _tail.y, _tail.z);
      p.setXYZ(1, _head.x, _head.y, _head.z);
      p.needsUpdate = true;
      tr.head.position.copy(_head);
      const fade = tr.t < 0.8 ? 1 : Math.max(0, 1 - (tr.t - 0.8) / 0.2);
      tr.line.material.opacity = 0.95 * fade;
      tr.head.material.opacity = fade;
      const s = tr.baseScale * (0.5 + 0.5 * (1 - e));
      tr.head.scale.set(s, s, s);
      if (tr.t >= 1) {
        if (tr.power >= 0.9) horizonBurst(tr.dest);   // max-power shot detonates at the horizon
        disposeTracer(tr); tracers.splice(i, 1);
      }
    }
  }

  // ---- cyan event-horizon burst (max-power shot reaches the vanishing pt) -
  function horizonBurst(pos) {
    // small bright core flash at the horizon
    const core = new THREE.Sprite(new THREE.SpriteMaterial({
      map: cyanTex, color: 0xbff6ff, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false
    }));
    core.position.copy(pos); core.scale.set(10, 10, 1); scene.add(core);
    // bright horizontal fan beam spreading along the horizon
    const fan = new THREE.Sprite(new THREE.SpriteMaterial({
      map: fanTex, color: 0x7fecff, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false
    }));
    fan.position.copy(pos); fan.scale.set(24, 8, 1); scene.add(fan);
    // wider, softer glow fan behind it
    const fan2 = new THREE.Sprite(new THREE.SpriteMaterial({
      map: fanTex, color: 0x4fd8ff, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false
    }));
    fan2.position.copy(pos); fan2.scale.set(30, 16, 1); scene.add(fan2);
    bursts.push({ core, fan, fan2, t: 0, life: 0.62 });
    horizonBurstSfx();
    ensureRunning();
  }
  function updateBursts(dt) {
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.t += dt / b.life;
      const e = Math.min(1, b.t);
      const ease = 1 - Math.pow(1 - e, 2);
      // core: quick bright pop
      b.core.scale.setScalar(10 + ease * 26);
      b.core.material.opacity = Math.max(0, 1 - e * 1.4);
      // fan: spreads wide horizontally, stays thin vertically
      b.fan.scale.set(24 + ease * 250, 8 + ease * 8, 1);
      b.fan.material.opacity = Math.max(0, 0.95 * (1 - e * e));
      // soft wide glow
      b.fan2.scale.set(30 + ease * 340, 16 + ease * 22, 1);
      b.fan2.material.opacity = Math.max(0, 0.5 * (1 - e));
      if (b.t >= 1) {
        [b.core, b.fan, b.fan2].forEach((s) => { scene.remove(s); s.material.dispose(); });
        bursts.splice(i, 1);
      }
    }
  }

  // ---- muzzle flash + charge-shot (DOM at the cursor) --------------------
  let muzzleLayer = null;
  function ensureMuzzleLayer() {
    if (!muzzleLayer) {
      muzzleLayer = document.createElement('div');
      muzzleLayer.className = 'muzzle-layer';
      document.body.appendChild(muzzleLayer);
    }
    return muzzleLayer;
  }
  function muzzleFlash(x, y, power) {
    ensureMuzzleLayer();
    const size = 128 * (1 + (power || 0) * 2.6);
    const m = document.createElement('div');
    m.className = 'muzzle';
    m.style.left = x + 'px';
    m.style.top = y + 'px';
    m.style.width = m.style.height = size + 'px';
    m.style.margin = (-size / 2) + 'px 0 0 ' + (-size / 2) + 'px';
    m.innerHTML = '<div class="burst" style="transform:rotate(' + (Math.random() * 360 | 0) + 'deg)"></div><div class="core"></div>';
    muzzleLayer.appendChild(m);
    setTimeout(() => m.remove(), 300);
  }

  // fire everything together, scaled by charge power (0..1)
  function fire(x, y, power) {
    power = Math.min(1, Math.max(0, power || 0));
    muzzleFlash(x, y, power);
    spawnTracer(x, y, power);
    playTracerSfx(power);
    ensureRunning();
  }

  // ---- press & hold to charge a bigger shot ------------------------------
  const CHARGE_MAX = 1200; // ms to full power
  let charging = false, chargeStart = 0, cx = 0, cy = 0, chargeEl = null, chargeRaf = 0;
  function chargeTick() {
    if (!charging) return;
    const p = Math.min(1, (performance.now() - chargeStart) / CHARGE_MAX);
    const size = 24 + p * 170;
    chargeEl.style.width = chargeEl.style.height = size + 'px';
    chargeEl.style.margin = (-size / 2) + 'px 0 0 ' + (-size / 2) + 'px';
    chargeEl.style.opacity = String(0.3 + p * 0.55);
    chargeRaf = requestAnimationFrame(chargeTick);
  }
  function startCharge(x, y) {
    charging = true; chargeStart = performance.now(); cx = x; cy = y;
    ensureMuzzleLayer();
    chargeEl = document.createElement('div');
    chargeEl.className = 'charge';
    chargeEl.style.left = x + 'px'; chargeEl.style.top = y + 'px';
    muzzleLayer.appendChild(chargeEl);
    startChargeSound();
    chargeRaf = requestAnimationFrame(chargeTick);
  }
  function moveCharge(x, y) {
    cx = x; cy = y;
    if (chargeEl) { chargeEl.style.left = x + 'px'; chargeEl.style.top = y + 'px'; }
  }
  function endCharge(x, y) {
    if (!charging) return;
    charging = false;
    cancelAnimationFrame(chargeRaf);
    const p = Math.min(1, (performance.now() - chargeStart) / CHARGE_MAX);
    if (chargeEl) { chargeEl.remove(); chargeEl = null; }
    stopChargeSound();
    fire(typeof x === 'number' ? x : cx, typeof y === 'number' ? y : cy, p);
  }

  window.addEventListener('pointerdown', (e) => startCharge(e.clientX, e.clientY), { passive: true });
  window.addEventListener('pointerup', (e) => endCharge(e.clientX, e.clientY), { passive: true });
  window.addEventListener('pointercancel', () => endCharge(), { passive: true });
  window.addEventListener('blur', () => endCharge());

  // ---- tracer sound — original photon-torpedo-style synth (no samples) ---
  let actx = null;
  let sfxOn = (function () { try { return localStorage.getItem('flynn-sfx') !== 'off'; } catch (e) { return true; } })();
  function ensureCtx() {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
    } catch (e) { return null; }
    return actx;
  }

  // rising "charge" whine while the button is held
  let chargeOsc = null, chargeGn = null;
  function startChargeSound() {
    if (!sfxOn || !ensureCtx()) return;
    stopChargeSound();
    const t0 = actx.currentTime;
    chargeOsc = actx.createOscillator(); chargeOsc.type = 'sawtooth';
    chargeOsc.frequency.setValueAtTime(180, t0);
    chargeOsc.frequency.linearRampToValueAtTime(1500, t0 + CHARGE_MAX / 1000);
    chargeGn = actx.createGain();
    chargeGn.gain.setValueAtTime(0.0001, t0);
    chargeGn.gain.exponentialRampToValueAtTime(0.06, t0 + 0.12);
    chargeOsc.connect(chargeGn); chargeGn.connect(actx.destination);
    chargeOsc.start(t0);
  }
  function stopChargeSound() {
    if (!actx || !chargeOsc) return;
    const o = chargeOsc, g = chargeGn, t0 = actx.currentTime;
    try {
      g.gain.cancelScheduledValues(t0);
      g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
      o.stop(t0 + 0.06);
    } catch (e) {}
    setTimeout(() => { try { o.disconnect(); g.disconnect(); } catch (e) {} }, 220);
    chargeOsc = null; chargeGn = null;
  }

  function playTracerSfx(power) {
    if (!sfxOn || !ensureCtx()) return;
    power = Math.min(1, Math.max(0, power || 0));
    const t0 = actx.currentTime;
    const master = actx.createGain();
    master.connect(actx.destination);

    // descending dual-oscillator "vweer"
    const f0 = 1080 + Math.random() * 280;
    const f1 = (150 - power * 70) + Math.random() * 40;
    [['triangle', 0, 1.0], ['sawtooth', 7, 0.32]].forEach(([type, detune, gv]) => {
      const o = actx.createOscillator();
      o.type = type; o.detune.value = detune;
      o.frequency.setValueAtTime(f0, t0);
      o.frequency.exponentialRampToValueAtTime(f1, t0 + 0.34 + power * 0.3);
      const g = actx.createGain(); g.gain.value = gv;
      o.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + 0.5 + power * 0.34);
    });

    // launch puff — short band-passed noise
    const nlen = Math.floor(actx.sampleRate * 0.09);
    const nbuf = actx.createBuffer(1, nlen, actx.sampleRate);
    const nd = nbuf.getChannelData(0);
    for (let i = 0; i < nlen; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nlen);
    const noise = actx.createBufferSource(); noise.buffer = nbuf;
    const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 0.8;
    const ng = actx.createGain(); ng.gain.value = 0.5;
    noise.connect(bp); bp.connect(ng); ng.connect(master);
    noise.start(t0); noise.stop(t0 + 0.1);

    // single sci-fi echo tap
    const delay = actx.createDelay(0.5); delay.delayTime.value = 0.1;
    const wet = actx.createGain(); wet.gain.value = 0.28;
    master.connect(delay); delay.connect(wet); wet.connect(actx.destination);

    // sub-bass thump for charged shots
    if (power > 0.05) {
      const sub = actx.createOscillator(); sub.type = 'sine';
      sub.frequency.setValueAtTime(90, t0);
      sub.frequency.exponentialRampToValueAtTime(46, t0 + 0.3);
      const sg = actx.createGain();
      sg.gain.setValueAtTime(0.0001, t0);
      sg.gain.exponentialRampToValueAtTime(0.34 * power, t0 + 0.02);
      sg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.34 + power * 0.3);
      sub.connect(sg); sg.connect(actx.destination);
      sub.start(t0); sub.stop(t0 + 0.7 + power * 0.3);
    }

    // master envelope
    const peak = 0.18 + power * 0.16;
    const tEnd = 0.46 + power * 0.4;
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    master.gain.exponentialRampToValueAtTime(0.0001, t0 + tEnd);

    setTimeout(() => { try { master.disconnect(); delay.disconnect(); wet.disconnect(); } catch (e) {} }, 1400);
  }

  // cyan impact when a max-power shot detonates at the event horizon —
  // a layered, world-cracking kaboom (crack + body + sub + rumble + reverb)
  let _softClip = null, _ir = null;
  function softClipCurve() {
    if (_softClip) return _softClip;
    const n = 2048, curve = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; curve[i] = Math.tanh(x * 2.4); }
    _softClip = curve; return curve;
  }
  function impulseResponse() {
    if (_ir) return _ir;
    const len = Math.floor(actx.sampleRate * 1.8);
    _ir = actx.createBuffer(2, len, actx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = _ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    return _ir;
  }
  function horizonBurstSfx() {
    if (!sfxOn || !ensureCtx()) return;
    const t0 = actx.currentTime, sr = actx.sampleRate;

    // master bus → soft-clip saturation → (dry + convolution reverb) → out
    const master = actx.createGain(); master.gain.value = 0.42;
    const shaper = actx.createWaveShaper(); shaper.curve = softClipCurve(); shaper.oversample = '4x';
    master.connect(shaper);
    const dry = actx.createGain(); dry.gain.value = 0.85;
    shaper.connect(dry); dry.connect(actx.destination);
    const conv = actx.createConvolver(); conv.buffer = impulseResponse();
    const wet = actx.createGain(); wet.gain.value = 0.55;
    shaper.connect(conv); conv.connect(wet); wet.connect(actx.destination);
    const nodes = [master, shaper, dry, conv, wet];

    function noiseSource(dur, exp) {
      const len = Math.max(1, Math.floor(sr * dur));
      const buf = actx.createBuffer(1, len, sr);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, exp);
      const s = actx.createBufferSource(); s.buffer = buf; return s;
    }

    // 1) leading CRACK — short bright transient
    const crack = noiseSource(0.07, 8);
    const chp = actx.createBiquadFilter(); chp.type = 'highpass'; chp.frequency.value = 2700;
    const cg = actx.createGain(); cg.gain.value = 0.85;
    crack.connect(chp); chp.connect(cg); cg.connect(master);
    crack.start(t0); crack.stop(t0 + 0.09);

    // 2) explosion BODY — big noise through a downward-sweeping lowpass
    const body = noiseSource(1.5, 1.4);
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.8;
    lp.frequency.setValueAtTime(2200, t0);
    lp.frequency.exponentialRampToValueAtTime(140, t0 + 1.1);
    const bg = actx.createGain();
    bg.gain.setValueAtTime(0.0001, t0);
    bg.gain.exponentialRampToValueAtTime(1.1, t0 + 0.015);
    bg.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.45);
    body.connect(lp); lp.connect(bg); bg.connect(master);
    body.start(t0); body.stop(t0 + 1.5);

    // 3) stacked SUB-BASS booms — the chest-thump
    [[120, 30, 1.2], [64, 20, 0.95]].forEach(([fa, fbz, gv]) => {
      const o = actx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(fa, t0);
      o.frequency.exponentialRampToValueAtTime(fbz, t0 + 0.5);
      const g = actx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gv, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.05);
      o.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + 1.1);
    });

    // 4) long low RUMBLE tail
    const rumble = noiseSource(1.9, 1.2);
    const rlp = actx.createBiquadFilter(); rlp.type = 'lowpass'; rlp.frequency.value = 230;
    const rg = actx.createGain();
    rg.gain.setValueAtTime(0.0001, t0);
    rg.gain.exponentialRampToValueAtTime(0.55, t0 + 0.08);
    rg.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.9);
    rumble.connect(rlp); rlp.connect(rg); rg.connect(master);
    rumble.start(t0); rumble.stop(t0 + 1.9);

    setTimeout(() => { try { nodes.forEach((n) => n.disconnect()); } catch (e) {} }, 2600);
  }

  // ---- interaction state --------------------------------------------------
  const mouse = { x: 0, y: 0 };          // -1..1
  const target = { x: 0, y: 0 };
  let scrollFrac = 0;

  window.addEventListener('pointermove', (e) => {
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = (e.clientY / window.innerHeight) * 2 - 1;
    if (charging) moveCharge(e.clientX, e.clientY);
  }, { passive: true });

  function onScroll() {
    const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
    scrollFrac = Math.min(1, Math.max(0, window.scrollY / max));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- resize -------------------------------------------------------------
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- loop ---------------------------------------------------------------
  let raf = 0, last = performance.now(), running = false;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;

    if (motion) {
      grid.position.z += cfg.speed * dt;
      if (grid.position.z >= cell) grid.position.z -= cell;  // seamless wrap

      // ease mouse parallax + scroll descent
      mouse.x += (target.x - mouse.x) * 0.045;
      mouse.y += (target.y - mouse.y) * 0.045;
      const camYTarget = baseCamY * (1 - 0.34 * scrollFrac) + mouse.y * (cfg.parallax * 0.45);
      camera.position.x += (mouse.x * cfg.parallax - camera.position.x) * 0.05;
      camera.position.y += (camYTarget - camera.position.y) * 0.05;
      camera.lookAt(mouse.x * cfg.parallax * 0.3, 0, cfg.look);
    }

    updateTracers(dt);
    updateBursts(dt);
    renderer.render(scene, camera);

    // keep animating while motion is on OR a tracer/burst is still active
    if (motion || tracers.length || bursts.length) { raf = requestAnimationFrame(frame); running = true; }
    else { running = false; }
  }
  function ensureRunning() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } }
  function start() { ensureRunning(); }
  function stop() { cancelAnimationFrame(raf); running = false; }

  // render one static frame even when motion is off / reduced
  renderer.render(scene, camera);
  if (motion) start();
  else { camera.position.y = baseCamY; renderer.render(scene, camera); }

  // pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (motion) start();
  });

  window.__gridVoid = {
    setMotion(on) {
      motion = !!on;
      if (motion) start();
      else { stop(); renderer.render(scene, camera); }
    },
    spawn(x, y, power) {
      fire(
        typeof x === 'number' ? x : window.innerWidth / 2,
        typeof y === 'number' ? y : window.innerHeight * 0.6,
        typeof power === 'number' ? power : 0
      );
    },
    charge(power) { fire(window.innerWidth / 2, window.innerHeight * 0.55, typeof power === 'number' ? power : 1); },
    setSfx(on) {
      sfxOn = !!on;
      try { localStorage.setItem('flynn-sfx', sfxOn ? 'on' : 'off'); } catch (e) {}
    },
    get sfxEnabled() { return sfxOn; },
    get tracerCount() { return tracers.length; }
  };
})();
