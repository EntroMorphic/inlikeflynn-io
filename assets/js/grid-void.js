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

  function spawnTracer(clientX, clientY, power = 0, target = null, onArrive = null) {
    const mx = (clientX / window.innerWidth) * 2 - 1;
    const my = -(clientY / window.innerHeight) * 2 + 1;
    const ray = new THREE.Vector3(mx, my, 0.5).unproject(camera);
    const dir = ray.sub(camera.position).normalize();
    const start = camera.position.clone().add(dir.multiplyScalar(9)); // just ahead of the click
    // homing target (a game anomaly), else shoot parallel to -z toward the
    // true vanishing point — the horizon between the floor and ceiling.
    const dest = target ? target.mesh.position.clone()
      : start.clone().add(new THREE.Vector3(0, 0, -1).multiplyScalar(Math.abs(cfg.fog[1]) * 1.4));

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

    tracers.push({ start, dest, t: 0, life: 0.7 + power * 0.25, line, head, baseScale, power, target, onArrive });
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
      if (tr.target && tr.target.alive) tr.dest.copy(tr.target.mesh.position); // home onto the anomaly
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
        if (tr.onArrive) tr.onArrive();
        else if (tr.power >= 0.9) horizonBurst(tr.dest);   // max-power shot detonates at the horizon
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
    if (game.over || game.attract) return;
    power = Math.min(1, Math.max(0, power || 0));
    muzzleFlash(x, y, power);
    playTracerSfx(power);
    if (musicOn) duck(power >= 0.9 ? 900 : 220);   // music dips under the shot
    if (game.active && !game.paused) gameFire(x, y, power);
    else spawnTracer(x, y, power);
    ensureRunning();
  }

  // ---- press & hold to charge a bigger shot ------------------------------
  const CHARGE_MAX = 1200; // ms to full power
  const WEB_HOLD_MIN = 240; // ms: off the game, only a deliberate hold fires (quick taps are silent)
  let charging = false, chargeStart = 0, cx = 0, cy = 0, chargeEl = null, chargeRaf = 0, chargeArmTimer = 0;
  function chargeTick() {
    if (!charging || !chargeEl) return;
    const p = Math.min(1, (performance.now() - chargeStart) / CHARGE_MAX);
    const size = 24 + p * 170;
    chargeEl.style.width = chargeEl.style.height = size + 'px';
    chargeEl.style.margin = (-size / 2) + 'px 0 0 ' + (-size / 2) + 'px';
    chargeEl.style.opacity = String(0.3 + p * 0.55);
    if (chargeEl._logo) {
      // the Flynn mark blooms into the core: grows + fades + slowly spins up
      chargeEl._logo.style.opacity = String(Math.min(1, Math.max(0, (p - 0.08) * 1.3)));
      chargeEl._logo.style.transform = 'translate(-50%, -50%) scale(' + (0.62 + p * 0.38) + ') rotate(' + (p * 44) + 'deg)';
    }
    chargeRaf = requestAnimationFrame(chargeTick);
  }
  function beginChargeVisuals() {
    if (chargeEl) return;
    ensureMuzzleLayer();
    chargeEl = document.createElement('div');
    chargeEl.className = 'charge';
    chargeEl.style.left = cx + 'px'; chargeEl.style.top = cy + 'px';
    const logo = document.createElement('img');
    logo.className = 'charge-logo'; logo.alt = ''; logo.decoding = 'async';
    logo.src = MUSIC_BASE + 'assets/img/flynn-logo.png';
    chargeEl.appendChild(logo);
    chargeEl._logo = logo;
    muzzleLayer.appendChild(chargeEl);
    startChargeSound();
    chargeRaf = requestAnimationFrame(chargeTick);
  }
  function startCharge(x, y) {
    if (game.over || game.attract) return;
    charging = true; chargeStart = performance.now(); cx = x; cy = y;
    // in-game: charge UI is immediate. on the site (incl. paused): defer until
    // it's a real hold, so quick taps make nothing (no orb, no whine, no shot).
    if (game.active && !game.paused) beginChargeVisuals();
    else chargeArmTimer = setTimeout(() => { if (charging) beginChargeVisuals(); }, WEB_HOLD_MIN);
  }
  function moveCharge(x, y) {
    cx = x; cy = y;
    if (chargeEl) { chargeEl.style.left = x + 'px'; chargeEl.style.top = y + 'px'; }
  }
  function endCharge(x, y) {
    if (!charging) return;
    charging = false;
    clearTimeout(chargeArmTimer);
    cancelAnimationFrame(chargeRaf);
    const held = performance.now() - chargeStart;
    const p = Math.min(1, held / CHARGE_MAX);
    if (chargeEl) { chargeEl.remove(); chargeEl = null; }
    stopChargeSound();
    // On the marketing site (not in-game), ignore quick taps — only a deliberate
    // press-and-hold fires the charged blast. In-game, every click fires.
    if (!(game.active && !game.paused) && held < WEB_HOLD_MIN) return;
    const fx2 = typeof x === 'number' ? x : cx, fy2 = typeof y === 'number' ? y : cy;
    fire(fx2, fy2, p);
    if (p >= 0.12) launchLogoProjectile(fx2, fy2, p);   // the charged mark flies down the tunnel
  }

  // the bloomed Flynn mark rides the charged shot into the vanishing point —
  // it mirrors the tracer 1:1 by sampling the tracer's exact 3D path each frame
  // and projecting it to screen (same curve, same perspective recede, same timing).
  function launchLogoProjectile(x, y, power) {
    ensureMuzzleLayer();
    const orbSize = 24 + power * 170;
    const startSize = Math.max(34, orbSize * 0.86 * (0.62 + power * 0.38));
    const el = document.createElement('img');
    el.className = 'charge-logo-fly'; el.alt = ''; el.decoding = 'async';
    el.src = MUSIC_BASE + 'assets/img/flynn-logo.png';
    muzzleLayer.appendChild(el);

    // replicate the tracer's own start→dest exactly (see spawnTracer)
    let tStart = null, tDest = null;
    try {
      const mx = (x / window.innerWidth) * 2 - 1, my = -(y / window.innerHeight) * 2 + 1;
      const ray = new THREE.Vector3(mx, my, 0.5).unproject(camera);
      const dir = ray.sub(camera.position).normalize();
      tStart = camera.position.clone().add(dir.multiplyScalar(9));
      tDest = tStart.clone().add(new THREE.Vector3(0, 0, -1).multiplyScalar(Math.abs(cfg.fog[1]) * 1.4));
    } catch (e) {}

    const _lp = new THREE.Vector3(), _lp2 = new THREE.Vector3(), _unitY = new THREE.Vector3(0, 1, 0);
    function proj(v) { const c = v.clone().project(camera); return { x: (c.x * 0.5 + 0.5) * window.innerWidth, y: (-c.y * 0.5 + 0.5) * window.innerHeight }; }
    // screen px per 1 world unit at a given world point (for perspective sizing)
    function pxPerWorld(v) { const a = proj(v); const b = proj(_lp2.copy(v).add(_unitY)); return Math.abs(b.y - a.y) || 0.0001; }
    const worldSize = tStart ? (startSize / pxPerWorld(tStart)) : 0;   // logo's size in world units

    const t0 = performance.now();
    const life = (0.7 + power * 0.25) * 1000;        // identical to the tracer's life
    (function fly() {
      const tt = Math.min(1, (performance.now() - t0) / life);
      const e = 1 - Math.pow(1 - tt, 3);             // easeOutCubic — identical to the tracer
      if (tStart) {
        _lp.lerpVectors(tStart, tDest, e);           // the tracer's exact 3D point at this t
        const s = proj(_lp);
        const sizePx = Math.max(2, pxPerWorld(_lp) * worldSize);
        el.style.left = s.x + 'px'; el.style.top = s.y + 'px';
        el.style.width = el.style.height = sizePx + 'px';
        el.style.transform = 'translate(-50%, -50%) rotate(' + (e * 200) + 'deg)';
      }
      const fade = tt < 0.8 ? 1 : Math.max(0, 1 - (tt - 0.8) / 0.2);   // matches the tracer head fade
      el.style.opacity = String(fade);
      if (tt < 1) requestAnimationFrame(fly); else el.remove();
    })();
  }

  window.addEventListener('pointerdown', (e) => { if (game.active && !game.paused) updateReticle(e.clientX, e.clientY); startCharge(e.clientX, e.clientY); }, { passive: true });
  window.addEventListener('pointerup', (e) => endCharge(e.clientX, e.clientY), { passive: true });
  window.addEventListener('pointercancel', () => endCharge(), { passive: true });
  window.addEventListener('blur', () => endCharge());

  // mobile: during play, suppress the native long-press text-selection / copy
  // callout (and scroll) on the playfield — but never on the buttons. The
  // pointer-driven charge/fire still works; we only cancel the touch default.
  window.addEventListener('touchstart', (e) => {
    if (!(game.active || game.attract || game.over) || game.paused) return;
    const t = e.target;
    if (t && t.closest && t.closest('button, a, input, textarea, select, .cas-howto, .svgo-btn, [role="button"]')) return;
    if (e.cancelable) e.preventDefault();
  }, { passive: false });
  window.addEventListener('touchmove', (e) => {
    if (!(game.active || game.attract) || game.paused) return;
    const t = e.target;
    if (t && t.closest && t.closest('.cas-howto')) return;   // allow the how-to panel to scroll
    if (e.cancelable) e.preventDefault();
  }, { passive: false });

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

  // generic one-shot sample players — decoded once, a fresh source per shot
  // so rapid fire overlaps cleanly. Synth stays as the fallback until loaded.
  const sfxBuf = {}, sfxBufTried = {}, sfxOffset = {};
  // find where real sound starts so we can skip baked-in leading silence
  function leadingSilence(buf) {
    const thresh = 0.015, n = buf.length, chs = [];
    for (let c = 0; c < buf.numberOfChannels; c++) chs.push(buf.getChannelData(c));
    for (let i = 0; i < n; i++) {
      for (let c = 0; c < chs.length; c++) {
        if (Math.abs(chs[c][i]) > thresh) return Math.max(0, i / buf.sampleRate - 0.004);
      }
    }
    return 0;
  }
  function loadSfxBuf(name, rel) {
    if (sfxBufTried[name] || !ensureCtx()) return;
    sfxBufTried[name] = true;
    fetch(MUSIC_BASE + rel)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then((b) => actx.decodeAudioData(b))
      .then((buf) => { sfxBuf[name] = buf; sfxOffset[name] = leadingSilence(buf); })
      .catch(() => {});
  }
  function playSfxBuf(name, gain, rateVar) {
    const buf = sfxBuf[name]; if (!buf) return false;
    const s = actx.createBufferSource(); s.buffer = buf;
    if (rateVar) s.playbackRate.value = 1 - rateVar + Math.random() * rateVar * 2;
    const g = actx.createGain(); g.gain.value = gain;
    s.connect(g); g.connect(actx.destination);
    s.start(0, sfxOffset[name] || 0);          // skip leading silence → instant fire
    return true;
  }
  function ensureBlasters() {
    loadSfxBuf('blaster', 'assets/audio/sfx/blaster.mp3');
    loadSfxBuf('heavy', 'assets/audio/sfx/heavy-blaster.mp3');
    loadSfxBuf('hit', 'assets/audio/sfx/direct-hit-1.mp3');
    loadSfxBuf('slowmo', 'assets/audio/sfx/slow-mo.mp3');
  }
  function playHitSfx() { ensureBlasters(); playSfxBuf('hit', 0.6, 0.06); }
  function playSlowmoSfx() { ensureBlasters(); playSfxBuf('slowmo', 0.85, 0); }

  function playTracerSfx(power) {
    if (!sfxOn || !ensureCtx()) return;
    power = Math.min(1, Math.max(0, power || 0));
    ensureBlasters();
    // charged shots get the heavy blaster; light taps get the regular one
    const heavy = power >= 0.5;
    if (playSfxBuf(heavy ? 'heavy' : 'blaster', heavy ? 0.85 : 0.7, 0.05)) return;
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

  // missile launch sample (user-uploaded). fire-z-missiles-2.mp3 contains TWO
  // missiles back-to-back; we isolate the FIRST one (clip below) and play it
  // per missile so the salvo layers into an Itano-Circus crescendo. Falls back
  // to the synth until it loads (or if it fails).
  let missileBuf = null, missileBufTried = false;
  // fire-z-missiles-3.mp3 holds two events; the SECOND (~0.66s on) is a full
  // launch + a long descending travel-whoosh tail — launch AND scream in one.
  const MISSILE_CLIP = { off: 0.66, dur: 1.7 };
  function ensureMissileBuf() {
    if (missileBufTried || !ensureCtx()) return;
    missileBufTried = true;
    fetch(MUSIC_BASE + 'assets/audio/sfx/fire-z-missiles-3.mp3')
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then((b) => actx.decodeAudioData(b))
      .then((buf) => { missileBuf = buf; })
      .catch(() => {});
  }

  // a synth "travel whoosh" — descending (doppler-away) noise + whistle. Layered
  // under the sampled launch so the missile both fires AND screams off-screen.
  function missileWhoosh(prog) {
    const t0 = actx.currentTime, sr = actx.sampleRate;
    const master = actx.createGain(); master.gain.value = 0.24; master.connect(actx.destination);
    const len = Math.floor(sr * 0.42);
    const buf = actx.createBuffer(1, len, sr); const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) { const e = i / len; d[i] = (Math.random() * 2 - 1) * (1 - e * 0.15); }
    const src = actx.createBufferSource(); src.buffer = buf;
    const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(1550 + prog * 250, t0);
    bp.frequency.exponentialRampToValueAtTime(300, t0 + 0.4);       // pitch falls = flying away
    const g = actx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.9, t0 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42);
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + 0.43);
    const o = actx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(1500 + Math.random() * 220, t0);
    o.frequency.exponentialRampToValueAtTime(380 + Math.random() * 60, t0 + 0.4);
    const og = actx.createGain();
    og.gain.setValueAtTime(0.0001, t0);
    og.gain.exponentialRampToValueAtTime(0.1, t0 + 0.05);
    og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
    o.connect(og); og.connect(master); o.start(t0); o.stop(t0 + 0.42);
    setTimeout(() => { try { master.disconnect(); } catch (e) {} }, 600);
  }

  // a single missile launch — uses the real sample if loaded, else a synth
  // (ignition CRACK + motor whoosh that rises then falls + doppler whistle).
  // Staggered across the salvo they pile into an Itano-Circus crescendo.
  function playMissileSfx(prog) {
    if (!sfxOn || !ensureCtx()) return;
    ensureMissileBuf();
    if (missileBuf) {
      const t0 = actx.currentTime;
      const rate = 0.95 + Math.random() * 0.1;          // slight per-shot variation
      const realDur = MISSILE_CLIP.dur / rate;
      const s = actx.createBufferSource();
      s.buffer = missileBuf; s.playbackRate.value = rate;
      const g = actx.createGain();
      g.gain.setValueAtTime(0.55, t0);
      g.gain.setValueAtTime(0.55, t0 + Math.max(0, realDur - 0.18));
      g.gain.linearRampToValueAtTime(0.0001, t0 + realDur);   // gentle tail-fade so the cut doesn't click
      s.connect(g); g.connect(actx.destination);
      s.start(t0, MISSILE_CLIP.off, MISSILE_CLIP.dur);          // launch + travel-whoosh, in one sample
      return;
    }
    const t0 = actx.currentTime, sr = actx.sampleRate;
    const master = actx.createGain(); master.gain.value = 0.34; master.connect(actx.destination);

    // 1) ignition CRACK — sharp highpassed transient (the "chk" of launch)
    const clen = Math.floor(sr * 0.05);
    const cbuf = actx.createBuffer(1, clen, sr); const cd = cbuf.getChannelData(0);
    for (let i = 0; i < clen; i++) cd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / clen, 3);
    const crack = actx.createBufferSource(); crack.buffer = cbuf;
    const chp = actx.createBiquadFilter(); chp.type = 'highpass'; chp.frequency.value = 1700;
    const cg = actx.createGain(); cg.gain.value = 0.8;
    crack.connect(chp); chp.connect(cg); cg.connect(master);
    crack.start(t0); crack.stop(t0 + 0.06);

    // 2) motor ROAR — noise through a bandpass that rises then falls (whoosh away)
    const len = Math.floor(sr * 0.34);
    const buf = actx.createBuffer(1, len, sr); const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) { const e = i / len; d[i] = (Math.random() * 2 - 1) * (1 - e * 0.25); }
    const src = actx.createBufferSource(); src.buffer = buf;
    const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(300 + prog * 130, t0);
    bp.frequency.exponentialRampToValueAtTime(1500, t0 + 0.08);
    bp.frequency.exponentialRampToValueAtTime(360, t0 + 0.34);
    const g = actx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(1.0, t0 + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.34);
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + 0.35);

    // 3) descending doppler whistle (the missile screaming away)
    const o = actx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(1300 + Math.random() * 240, t0);
    o.frequency.exponentialRampToValueAtTime(420 + Math.random() * 80, t0 + 0.32);
    const og = actx.createGain();
    og.gain.setValueAtTime(0.0001, t0);
    og.gain.exponentialRampToValueAtTime(0.13, t0 + 0.03);
    og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
    o.connect(og); og.connect(master); o.start(t0); o.stop(t0 + 0.33);
    setTimeout(() => { try { master.disconnect(); } catch (e) {} }, 400);
  }

  // ---- game music: 80s synthwave playlist (shuffles, ducks under SFX) -----
  const MUSIC = [
    { src: 'assets/audio/music/neon-nights.mp3', title: 'Neon Nights', artist: 'entropywalker', meta: 'SYNTHWAVE · ENTROMORPHIC' },
    { src: 'assets/audio/music/chasing-the-mirage.mp3', title: 'Chasing the Mirage', artist: 'entropywalker', meta: 'SYNTHWAVE · ENTROMORPHIC' },
    { src: 'assets/audio/music/silent-cinema.mp3', title: 'Silent Cinema', artist: 'entropywalker', meta: 'SYNTHWAVE · ENTROMORPHIC' }
  ];
  // resolve relative to this script so it works from /pages/* too
  const MUSIC_BASE = (function () {
    try {
      const s = document.currentScript || [].slice.call(document.scripts).find((x) => /grid-void\.js/.test(x.src));
      if (s && s.src) return s.src.replace(/[^/]*$/, '').replace(/assets\/js\/$/, '');
    } catch (e) {}
    return '';
  })();
  let musicOn = (function () { try { return localStorage.getItem('flynn-music') !== 'off'; } catch (e) { return true; } })();
  const MUSIC_VOL = 0.5;
  let musicEl = null, order = [], orderPos = 0, duckUntil = 0, musicFadeId = 0, nowPlaying = null;

  // ---- MTV/VH1-style "now playing" lower-third chyron ---------------------
  // slides in from the lower-right whenever the track changes, holds, slides out.
  let npEl = null, npTimer = 0;
  function ensureNpEl() {
    if (npEl) return npEl;
    npEl = document.createElement('div');
    npEl.className = 'np-card';
    npEl.innerHTML =
      '<span class="np-bar"></span>' +
      '<div class="np-body">' +
        '<div class="np-eyebrow"><span class="np-eq"><i></i><i></i><i></i><i></i></span>NOW PLAYING</div>' +
        '<div class="np-title" data-np-title></div>' +
        '<div class="np-artist" data-np-artist></div>' +
        '<div class="np-meta" data-np-meta></div>' +
      '</div>';
    document.body.appendChild(npEl);
    return npEl;
  }
  function showNowPlaying(track) {
    if (!track) return;
    const el = ensureNpEl();
    el.querySelector('[data-np-title]').textContent = track.title;
    el.querySelector('[data-np-artist]').textContent = track.artist;
    el.querySelector('[data-np-meta]').textContent = track.meta || '';
    // restart the slide-in even if it's already showing
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(npTimer);
    npTimer = setTimeout(() => { if (npEl) npEl.classList.remove('show'); }, 6500);
  }
  function hideNowPlaying() { if (npEl) npEl.classList.remove('show'); clearTimeout(npTimer); }
  function shuffleOrder() {
    order = MUSIC.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    orderPos = 0;
  }
  function ensureMusicEl() {
    if (musicEl) return musicEl;
    musicEl = new Audio();
    musicEl.preload = 'auto';
    musicEl.addEventListener('ended', playNextTrack);
    return musicEl;
  }
  function playNextTrack() {
    if (!order.length) shuffleOrder();
    const el = ensureMusicEl();
    musicFadeId++;                              // abort any in-flight stop-fade
    const idx = order[orderPos % order.length]; orderPos++;
    const track = MUSIC[idx];
    nowPlaying = track;
    el.src = MUSIC_BASE + track.src;
    el.currentTime = 0; el.volume = MUSIC_VOL;
    if (musicOn) { el.play().catch(() => {}); showNowPlaying(track); }
  }
  function startMusic() {
    if (!musicOn) return;
    shuffleOrder(); playNextTrack();
  }
  function stopMusic() {                       // gentle fade then pause
    hideNowPlaying();
    const el = musicEl; if (!el || el.paused) return;
    const myId = ++musicFadeId;
    const v0 = el.volume, t0 = performance.now();
    (function fade() {
      if (myId !== musicFadeId) return;        // a newer start/stop superseded this fade
      const k = Math.min(1, (performance.now() - t0) / 700);
      el.volume = Math.max(0, v0 * (1 - k));
      if (k < 1) requestAnimationFrame(fade); else el.pause();
    })();
  }
  function duck(ms) { duckUntil = Math.max(duckUntil, performance.now() + ms); }
  function updateMusic(dt) {                    // smooth volume toward duck/idle target
    if (!musicEl || musicEl.paused) return;
    const target = (performance.now() < duckUntil) ? MUSIC_VOL * 0.28 : MUSIC_VOL;
    musicEl.volume = Math.max(0, Math.min(1, musicEl.volume + (target - musicEl.volume) * Math.min(1, dt * 9)));
  }
  function setMusic(on) {
    musicOn = !!on;
    try { localStorage.setItem('flynn-music', musicOn ? 'on' : 'off'); } catch (e) {}
    if (game.active || game.attract) {
      if (musicOn) { if (!musicEl || musicEl.paused) startMusic(); else { musicEl.play().catch(() => {}); showNowPlaying(nowPlaying); } }
      else { if (musicEl) musicEl.pause(); hideNowPlaying(); }
    }
    updateMusicBtn();
  }

  // ---- interaction state --------------------------------------------------
  const mouse = { x: 0, y: 0 };          // -1..1
  const target = { x: 0, y: 0 };
  let scrollFrac = 0;

  window.addEventListener('pointermove', (e) => {
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = (e.clientY / window.innerHeight) * 2 - 1;
    if (charging) moveCharge(e.clientX, e.clientY);
    if (game.active && !game.paused) updateReticle(e.clientX, e.clientY);
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
    const aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    // widen the grid horizontally so it always overshoots the screen edges
    // (the geometry is tuned for ~16:9; stretch X on wider/portrait viewports
    // so the void reads full-bleed instead of a centred panel)
    const sx = Math.max(1, aspect / 1.6);
    grid.scale.x = sx;
    glow.scale.x = sx;
  }
  window.addEventListener('resize', resize);
  resize();

  // ===== ANOMALY HUNT — hidden easter-egg game ============================
  const anomalyTex = (function () {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0.0, 'rgba(255,228,186,1)');
    grd.addColorStop(0.4, 'rgba(255,150,64,0.92)');
    grd.addColorStop(1.0, 'rgba(255,110,40,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    g.save(); g.translate(32, 32); g.rotate(Math.PI / 4);
    g.fillStyle = 'rgba(255,244,214,0.95)'; g.fillRect(-6, -6, 12, 12);
    g.restore();
    return new THREE.CanvasTexture(c);
  })();
  const slowTex = (function () {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0.0, 'rgba(216,250,255,1)');
    grd.addColorStop(0.4, 'rgba(90,224,255,0.9)');
    grd.addColorStop(1.0, 'rgba(60,200,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    g.save(); g.translate(32, 32); g.rotate(Math.PI / 4);
    g.strokeStyle = 'rgba(230,252,255,0.95)'; g.lineWidth = 2; g.strokeRect(-7, -7, 14, 14);
    g.restore();
    return new THREE.CanvasTexture(c);
  })();

  const game = { active: false, over: false, attract: false, paused: false, pausedAt: 0, score: 0, high: 0, prevHigh: 0, wave: 0, combo: 0, lives: 3, timeScale: 1, slowUntil: 0, toSpawn: 0, spawnTimer: 0, waveBreak: 0, blossomReady: false, blossoming: false };
  try { game.high = +(localStorage.getItem('flynn-ah-high') || 0) || 0; } catch (e) {}

  // ---- run + career stats -------------------------------------------------
  // stats: reset each run. career: accumulated across all runs (localStorage).
  const stats = { shots: 0, hits: 0, faults: 0, breaches: 0, bestCombo: 0, blossoms: 0, slowmo: 0, startedAt: 0, elapsed: 0 };
  function resetStats() {
    stats.shots = 0; stats.hits = 0; stats.faults = 0; stats.breaches = 0;
    stats.bestCombo = 0; stats.blossoms = 0; stats.slowmo = 0;
    stats.startedAt = performance.now(); stats.elapsed = 0;
  }
  let career = (function () { try { return JSON.parse(localStorage.getItem('flynn-ah-career')) || {}; } catch (e) { return {}; } })();
  function commitCareer() {
    career.games = (career.games || 0) + 1;
    career.shots = (career.shots || 0) + stats.shots;
    career.hits = (career.hits || 0) + stats.hits;
    career.faults = (career.faults || 0) + stats.faults;
    career.blossoms = (career.blossoms || 0) + stats.blossoms;
    career.playtime = (career.playtime || 0) + stats.elapsed;
    career.bestWave = Math.max(career.bestWave || 0, game.wave);
    career.bestCombo = Math.max(career.bestCombo || 0, stats.bestCombo);
    career.bestScore = Math.max(career.bestScore || 0, game.score);
    try { localStorage.setItem('flynn-ah-career', JSON.stringify(career)); } catch (e) {}
  }
  function fmtTime(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function accuracy(hits, shots) { return shots > 0 ? Math.round((hits / shots) * 100) : 0; }

  const anomalies = [];
  const fx = [];
  // real equipment faults — you're literally shooting down failures before they land
  const FAULT_NAMES = ['BEARING WEAR', 'CAVITATION', 'ARC FAULT', 'MISALIGNMENT', 'IMBALANCE', 'GEAR MESH', 'LOOSENESS', 'RESONANCE', 'STATOR FAULT', 'PUMP STALL', 'BELT SLIP', 'OVERTEMP'];
  const BLOSSOM_AT = 12;            // combo catches needed to arm Death Blossom
  const raycaster = new THREE.Raycaster();
  const _ndc = new THREE.Vector2();
  const breachZ = 9;
  const fieldH = cfg.ceiling ? cfg.ceilH : 12;
  const fieldY0 = cfg.ceiling ? 2 : 1.5;

  function popBurst(pos, color, big) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: headTex, color: color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false }));
    s.position.copy(pos); s.scale.setScalar(big ? 7 : 4); scene.add(s);
    fx.push({ s, t: 0, life: big ? 0.5 : 0.32, s0: big ? 7 : 4, s1: big ? 40 : 18 });
  }
  function updateFx(dt) {
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i]; f.t += dt / f.life;
      const e = Math.min(1, f.t), ease = 1 - Math.pow(1 - e, 2);
      f.s.scale.setScalar(f.s0 + ease * (f.s1 - f.s0));
      f.s.material.opacity = Math.max(0, 1 - e);
      if (f.t >= 1) { scene.remove(f.s); f.s.material.dispose(); fx.splice(i, 1); }
    }
  }

  // ---- Asteroids-style shatter: craft break into spinning wireframe shards -
  const _shardGeos = (function () {
    const geos = [];
    for (let n = 0; n < 6; n++) {
      const pts = [];
      const segs = 2 + (Math.random() * 2 | 0);
      for (let i = 0; i < segs; i++) {
        const ax = (Math.random() - 0.5) * 2, ay = (Math.random() - 0.5) * 2, az = (Math.random() - 0.5) * 2;
        pts.push(ax, ay, az, ax + (Math.random() - 0.5) * 1.7, ay + (Math.random() - 0.5) * 1.7, az + (Math.random() - 0.5) * 1.7);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      geos.push(g);
    }
    return geos;
  })();
  const debris = [];
  function shatter(pos, colorHex, count, force) {
    count = count || 8; force = force || 1;
    for (let i = 0; i < count; i++) {
      const geo = _shardGeos[(Math.random() * _shardGeos.length) | 0];
      const mat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, fog: false });
      const seg = new THREE.LineSegments(geo, mat);
      seg.position.copy(pos);
      seg.scale.setScalar(0.5 + Math.random() * 0.8);
      seg.renderOrder = 6;
      scene.add(seg);
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, (Math.random() - 0.5) * 0.6).normalize();
      const speed = (9 + Math.random() * 20) * force;
      debris.push({
        seg, vel: dir.multiplyScalar(speed),
        spin: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
        spinRate: 2 + Math.random() * 5, t: 0, life: 0.5 + Math.random() * 0.45
      });
    }
  }
  function updateDebris(dt) {
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.t += dt / d.life;
      d.seg.position.addScaledVector(d.vel, dt);
      d.vel.multiplyScalar(Math.max(0, 1 - dt * 1.4));   // drag, so shards coast to a stop
      d.seg.rotateOnAxis(d.spin, d.spinRate * dt);
      d.seg.material.opacity = Math.max(0, 1 - d.t * d.t); // fade out, easing
      if (d.t >= 1) { scene.remove(d.seg); d.seg.material.dispose(); debris.splice(i, 1); }
    }
  }

  // ---- Itano-Circus missile swarm (Death Blossom) ------------------------
  // missiles bloom outward from the viewer, draw smoke trails, then steer
  // (arc) back onto every on-screen anomaloid. ~6 per target.
  const missileTex = (function () {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0.0, 'rgba(255,255,250,1)');
    grd.addColorStop(0.35, 'rgba(255,210,150,0.95)');
    grd.addColorStop(0.7, 'rgba(255,140,60,0.5)');
    grd.addColorStop(1.0, 'rgba(255,110,40,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const missiles = [];
  // Flynn mark ridden in each missile's exhaust (38% opacity). loaded once.
  const logoTex = (function () {
    try { const t = new THREE.TextureLoader().load(MUSIC_BASE + 'assets/img/flynn-logo.png'); t.anisotropy = 2; return t; } catch (e) { return null; }
  })();
  const _mv1 = new THREE.Vector3(), _mv2 = new THREE.Vector3();
  function buildTrail(line, pts) {
    const n = pts.length;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = pts[i].x; pos[i * 3 + 1] = pts[i].y; pos[i * 3 + 2] = pts[i].z;
      const a = 1 - i / (n - 1 || 1);            // newest = brightest
      col[i * 3] = a; col[i * 3 + 1] = a * 0.55; col[i * 3 + 2] = a * 0.24;
    }
    const gg = line.geometry;
    gg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    gg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  function launchMissile(target) {
    const pos = new THREE.Vector3((Math.random() - 0.5) * 9, 2 + Math.random() * 2.5, 9 + Math.random() * 2.5);
    // initial OUTWARD spread (up + sideways, slightly toward camera) → forces an arc
    const spread = new THREE.Vector3((Math.random() - 0.5) * 2.6, 0.5 + Math.random() * 1.3, (Math.random() - 0.25) * 0.9).normalize();
    const vel = spread.multiplyScalar(18 + Math.random() * 16);
    const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: missileTex, color: 0xffe2b8, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false }));
    head.position.copy(pos); head.scale.setScalar(2.6); head.renderOrder = 7; scene.add(head);
    const line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, fog: false }));
    line.renderOrder = 6; line.frustumCulled = false; scene.add(line);
    const tpos = (target && target.alive) ? target.mesh.position.clone()
      : new THREE.Vector3((Math.random() - 0.5) * 64, 4 + Math.random() * 16, -(cfg.fog[1] * 0.66));
    // Flynn mark riding the exhaust (38% opacity), spinning as it flies
    let logo = null;
    if (logoTex) {
      logo = new THREE.Sprite(new THREE.SpriteMaterial({ map: logoTex, transparent: true, opacity: 0.21, depthTest: false, depthWrite: false, fog: false }));
      logo.scale.setScalar(4.4); logo.renderOrder = 5; logo.position.copy(pos); scene.add(logo);
    }
    missiles.push({ target, tpos, pos, vel, head, line, logo, trail: [pos.clone()], spin: Math.random() * Math.PI, t: 0, cruise: 52 + Math.random() * 18, max: 80, turn: 2.3 + Math.random() * 1.9 });
  }
  function disposeMissile(m) {
    scene.remove(m.head); m.head.material.dispose();
    scene.remove(m.line); m.line.geometry.dispose(); m.line.material.dispose();
    if (m.logo) { scene.remove(m.logo); m.logo.material.dispose(); }
  }
  function detonateMissile(m) {
    if (m.target && m.target.alive) {
      const slow = m.target.type === 'slow';
      shatter(m.target.mesh.position, slow ? 0x9ff0ff : 0xffae5c, 9, 1.2);
      popBurst(m.target.mesh.position, slow ? 0x9ff0ff : 0xffb060, false);
      playHitSfx();
      stats.faults++;
      game.score += 150; removeAnomaly(m.target); updateHUD();
      if (Math.random() < 0.45) shakeScreen(0.34);
    } else {
      popBurst(m.pos, 0xffc890, false);          // secondary airburst (overkill missiles)
    }
  }
  function updateMissiles(dt) {
    for (let i = missiles.length - 1; i >= 0; i--) {
      const m = missiles[i];
      m.t += dt;
      if (m.target && m.target.alive) m.tpos.copy(m.target.mesh.position);
      const desired = _mv1.copy(m.tpos).sub(m.pos);
      const dist = desired.length();
      desired.normalize().multiplyScalar(m.cruise);
      m.vel.addScaledVector(_mv2.copy(desired).sub(m.vel), Math.min(1, m.turn * dt));
      const sp = m.vel.length();
      if (sp > m.max) m.vel.multiplyScalar(m.max / sp);
      m.pos.addScaledVector(m.vel, dt);
      m.head.position.copy(m.pos);
      if (m.logo) {
        // sit in the exhaust: just behind the head, opposite the velocity
        const sp2 = m.vel.length() || 1;
        m.logo.position.copy(m.pos).addScaledVector(m.vel, -2.6 / sp2);
        m.logo.material.rotation = (m.spin += dt * 2.4);
      }
      m.trail.unshift(m.pos.clone()); if (m.trail.length > 16) m.trail.pop();
      buildTrail(m.line, m.trail);
      if (dist < 4 || m.t > 2.4) { detonateMissile(m); disposeMissile(m); missiles.splice(i, 1); }
    }
  }

  // ---- Last Starfighter-style wireframe craft ----------------------------
  // glowing vector polyhedra that tumble as they approach: elongated
  // octahedron "darts" and 4-sided "shards" for faults, a faceted icosahedron
  // "core" for power-ups. Edges are additive neon; a faint inner body adds bloom.
  const _craftGeo = {
    dart: new THREE.OctahedronGeometry(2.4, 0),
    shard: new THREE.ConeGeometry(2.0, 5.0, 4),
    core: new THREE.IcosahedronGeometry(2.3, 0)
  };
  const _craftEdge = {};
  function edgesOf(k) { if (!_craftEdge[k]) _craftEdge[k] = new THREE.EdgesGeometry(_craftGeo[k]); return _craftEdge[k]; }
  function makeCraft(type) {
    const slow = type === 'slow';
    const key = slow ? 'core' : (Math.random() < 0.5 ? 'dart' : 'shard');
    const col = slow ? 0x7fefff : 0xff9a40;
    const outer = new THREE.Group();
    const shape = new THREE.Group();          // holds fixed elongation so spin stays rigid
    const lines = new THREE.LineSegments(edgesOf(key), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.96, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, fog: false }));
    const body = new THREE.Mesh(_craftGeo[key], new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: slow ? 0.16 : 0.12, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false }));
    body.renderOrder = 4; lines.renderOrder = 6;
    shape.add(body); shape.add(lines);
    if (key === 'dart') shape.scale.set(0.78, 0.78, 1.9);
    else if (key === 'shard') shape.rotation.x = Math.PI / 2;   // point the pyramid forward
    outer.add(shape);
    const spin = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    return { outer, lines, body, spin, spinRate: 0.7 + Math.random() * 1.3 };
  }

  function spawnAnomaly(type) {
    const c = makeCraft(type);
    const corridor = xMax * 0.7;
    c.outer.position.set((Math.random() * 2 - 1) * corridor, fieldY0 + Math.random() * (fieldH - fieldY0 - 1), -(cfg.fog[1] * 0.92));
    scene.add(c.outer);
    const base = 16 + game.wave * 2;
    const slow = type === 'slow';
    const a = { mesh: c.outer, lines: c.lines, body: c.body, spin: c.spin, spinRate: c.spinRate, type, name: slow ? 'TANDEM SCAN' : FAULT_NAMES[(Math.random() * FAULT_NAMES.length) | 0], alive: true, speed: base * (0.82 + Math.random() * 0.5), radius: 6, warned: false, blip: makeBlip(slow) };
    anomalies.push(a);
  }
  function updateAnomalies(dt) {
    const d = dt * game.timeScale;
    const now = performance.now();
    const zFar = -(cfg.fog[1] * 0.92), corridor = xMax * 0.7;
    let nearest = 0;
    for (let i = anomalies.length - 1; i >= 0; i--) {
      const a = anomalies[i];
      if (!a) continue;                              // array can shrink mid-loop (breach → gameOver clears it)
      a.mesh.position.z += a.speed * d;
      a.mesh.rotateOnAxis(a.spin, a.spinRate * dt * (0.5 + game.timeScale * 0.5));
      const pulse = 1 + 0.06 * Math.sin(now * 0.006 + a.mesh.position.x);
      a.mesh.scale.setScalar(pulse);
      const frac = Math.max(0, Math.min(1, (a.mesh.position.z - zFar) / (breachZ - zFar)));
      updateBlip(a, frac, corridor);
      if (a.type === 'fault' && frac > nearest) nearest = frac;   // only real threats raise the alarm
      if (a.type === 'fault' && frac > 0.74) { a.body.material.opacity = 0.12 + 0.18 * (0.5 + 0.5 * Math.sin(now * 0.02)); }
      if (a.mesh.position.z > breachZ) breach(a);
      if (game.over) break;                          // the breach above ended the run — stop touching the (now-cleared) array
    }
    setBreachAlarm(game.active && nearest > 0.74 && anomalies.length > 0);
  }
  function removeAnomaly(a) {
    a.alive = false; scene.remove(a.mesh);
    a.mesh.traverse((o) => { if (o.material) o.material.dispose(); });
    if (a.blip && a.blip.parentNode) a.blip.parentNode.removeChild(a.blip);
    const idx = anomalies.indexOf(a); if (idx >= 0) anomalies.splice(idx, 1);
  }
  function breach(a) {
    if (!a.alive) return;
    if (game.attract) { removeAnomaly(a); return; }   // attract-mode craft just drift past
    if (a.type === 'slow') { popBurst(a.mesh.position, 0x6fe8ff, false); removeAnomaly(a); return; }   // missed power-ups are harmless
    shatter(a.mesh.position, 0xff5a2a, 11, 1.25);
    popBurst(a.mesh.position, 0xff5a2a, true);
    removeAnomaly(a);
    stats.breaches++;
    game.combo = 0; game.lives--; flashScreen('breach'); shakeScreen(0.6); updateHUD();
    if (game.lives <= 0) gameOver();
  }
  function destroyAnomaly(a, byPlayer) {
    if (!a.alive) return;
    const slow = a.type === 'slow';
    shatter(a.mesh.position, slow ? 0x9ff0ff : 0xffae5c, slow ? 10 : 8, 1);
    popBurst(a.mesh.position, slow ? 0x9ff0ff : 0xffb060, false);
    removeAnomaly(a);
    if (byPlayer) {
      if (slow) { activateSlowmo(); stats.slowmo++; } else playHitSfx();   // slow core → slow-mo sting; faults → hit
      stats.faults++;
      game.combo++;
      if (game.combo > stats.bestCombo) stats.bestCombo = game.combo;
      game.score += 100 * (1 + Math.floor(game.combo / 5));
      if (!game.blossomReady && game.combo >= BLOSSOM_AT) armBlossom();
      if (game.score > game.high) { game.high = game.score; try { localStorage.setItem('flynn-ah-high', String(game.high)); } catch (e) {} }
      updateHUD();
    }
  }
  function pickAnomaly(x, y) {
    _ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(_ndc, camera);
    let best = null, bestCam = Infinity;
    for (const a of anomalies) {
      if (!a.alive) continue;
      if (raycaster.ray.distanceToPoint(a.mesh.position) < a.radius) {
        const cd = camera.position.distanceToSquared(a.mesh.position);
        if (cd < bestCam) { bestCam = cd; best = a; }
      }
    }
    return best;
  }
  function gameFire(x, y, power) {
    stats.shots++;
    if (power >= 0.9) {                  // MAX-CHARGE BOMB → clears the field
      if (anomalies.some((a) => a.alive)) stats.hits++;   // bomb connects if anything's out there
      spawnTracer(x, y, power);          // cyan fan detonates at the horizon on arrival
      anomalies.slice().forEach((a, k) => setTimeout(() => { if (a.alive) destroyAnomaly(a, true); }, 80 + k * 45));
      flashScreen('bomb');
      return;
    }
    const hit = pickAnomaly(x, y);
    if (hit) { stats.hits++; spawnTracer(x, y, power, hit, () => destroyAnomaly(hit, true)); }
    else { spawnTracer(x, y, power); game.combo = 0; updateHUD(); }
  }
  function activateSlowmo() { game.slowUntil = performance.now() + 4000; flashScreen('slow'); playSlowmoSfx(); }

  // ---- radar blips: plot live anomalies on the SECTOR SCAN ---------------
  function makeBlip(slow) {
    if (!hudEls || !hudEls.radar) return null;
    const d = document.createElement('span');
    d.className = 'ah-blip' + (slow ? ' slow' : '');
    hudEls.radar.appendChild(d);
    return d;
  }
  function updateBlip(a, frac, corridor) {
    const b = a.blip; if (!b) return;
    const xn = Math.max(-1, Math.min(1, a.mesh.position.x / corridor));
    b.style.left = (50 + xn * 40) + '%';
    b.style.top = (10 + frac * 80) + '%';
    b.style.opacity = String(0.45 + frac * 0.55);
    if (frac > 0.74 && !a.type.indexOf('fault')) b.classList.add('hot');
  }
  function setBreachAlarm(on) { if (hud) hud.classList.toggle('alarm', !!on); }

  // ---- screen shake (translates the void canvas) -------------------------
  function shakeScreen(amp) {
    if (!canvas) return;
    canvas.style.setProperty('--shake', amp || 0.6);
    canvas.classList.remove('ah-shake'); void canvas.offsetWidth; canvas.classList.add('ah-shake');
  }

  // ---- DEATH BLOSSOM: armed at high combo, clears the field --------------
  function armBlossom() {
    game.blossomReady = true;
    if (hud) hud.classList.add('blossom');
    if (hudEls && hudEls.hint) hudEls.hint.classList.add('hot');
    showPrompt('DEATH BLOSSOM READY');
  }
  function blossomBolt(px, py) {
    const mx = (px / window.innerWidth) * 2 - 1, my = -(py / window.innerHeight) * 2 + 1;
    const ray = new THREE.Vector3(mx, my, 0.5).unproject(camera);
    const dir = ray.sub(camera.position).normalize();
    const dest = camera.position.clone().add(dir.multiplyScalar(140));
    spawnTracer(window.innerWidth / 2, window.innerHeight / 2, 0.72, { mesh: { position: dest }, alive: true }, null);
  }
  function deathBlossom() {
    if (!game.active || game.over || !game.blossomReady || game.blossoming) return;
    game.blossomReady = false; game.blossoming = true;
    stats.blossoms++;
    if (hud) hud.classList.remove('blossom');
    if (hudEls && hudEls.hint) hudEls.hint.classList.remove('hot');
    showPrompt('DEATH BLOSSOM');
    flashScreen('bomb'); shakeScreen(0.6);
    // ~6 missiles per on-screen target; if the field is empty, fire a display salvo
    // each target gets its own rolling salvo: ~6 missiles fired 0.1s apart;
    // groups start slightly staggered so the whole barrage ripples out.
    const targets = anomalies.filter((a) => a.alive);
    const per = 6;
    const groups = targets.length ? targets : [null, null, null];
    const groupGap = 80;      // ms between successive target-groups starting
    const missileGap = 100;   // ms between missiles within one group
    let n = 0, lastAt = 0;
    groups.forEach((t, gi) => {
      const count = targets.length ? per : 5;
      for (let m = 0; m < count; m++) {
        if (n >= 48) break;                         // safety cap
        const at = gi * groupGap + m * missileGap;
        lastAt = Math.max(lastAt, at);
        const prog = n;
        setTimeout(() => { if (!game.active) return; launchMissile(t); playMissileSfx(Math.min(1, prog / 30)); }, at);
        n++;
      }
    });
    // the convergence boom lands as the first salvos reach the horizon
    setTimeout(() => { if (!game.active) return; horizonBurstSfx(); flashScreen('bomb'); shakeScreen(1.0); }, lastAt * 0.5 + 520);
    game.combo = 0;
    if (game.score > game.high) { game.high = game.score; try { localStorage.setItem('flynn-ah-high', String(game.high)); } catch (e) {} }
    updateHUD();
    setTimeout(() => { game.blossoming = false; }, lastAt + 2200);
    ensureRunning();
  }

  function nextWave() {
    game.wave++;
    game.toSpawn = 3 + game.wave * 2;
    game.spawnTimer = 0.4;
    game.waveBreak = 2.2;
    flashWave(); updateHUD();
  }
  function updateGame(dt) {
    if (!game.active || game.over || game.paused) return;
    game.timeScale = performance.now() < game.slowUntil ? 0.4 : 1;
    updateAnomalies(dt);
    if (game.toSpawn > 0) {
      game.spawnTimer -= dt;
      if (game.spawnTimer <= 0) {
        spawnAnomaly(Math.random() < 0.08 && game.wave >= 2 ? 'slow' : 'fault');
        game.toSpawn--;
        game.spawnTimer = Math.max(0.45, 1.5 - game.wave * 0.08);
      }
    } else if (anomalies.length === 0) {
      game.waveBreak -= dt;
      if (game.waveBreak <= 0) nextWave();
    }
  }

  // ---- arcade flow: splash (attract) → start → game → over → menu -------
  let attractSpawn = 0;
  function updateAttract(dt) {
    if (!game.attract) return;
    game.timeScale = 1;
    updateAnomalies(dt);
    attractSpawn -= dt;
    if (attractSpawn <= 0 && anomalies.length < 7) {
      spawnAnomaly(Math.random() < 0.2 ? 'slow' : 'fault');
      attractSpawn = 0.5 + Math.random() * 0.7;
    }
  }
  function openHowto() { if (hud) hud.classList.add('howto'); }
  function closeHowto() { if (hud) hud.classList.remove('howto'); }

  function openSplash() {
    if (game.active || game.attract) return;
    buildHUD();
    anomalies.slice().forEach(removeAnomaly);
    game.attract = true; game.active = false; game.over = false;
    if (hud) hud.classList.add('menu');
    if (hud) hud.classList.remove('blossom', 'alarm', 'howto');
    document.body.classList.add('ah-playing', 'cas-menu');
    showHUD(true); hideGameOver(); closeHowto();
    if (hudEls && hudEls.hiscore) hudEls.hiscore.textContent = game.high;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fadeSite(true);
    startMusic();
    ensureBlasters();            // preload blaster/hit/slow-mo while the player reads the splash
    ensureMissileBuf();          // ...and the Death Blossom launch sample
    attractSpawn = 0.2;
    ensureRunning();
  }

  function startGame() {
    if (game.active) return;
    clearGoCountdown();
    anomalies.slice().forEach(removeAnomaly);
    game.attract = false;
    game.active = true; game.over = false; game.score = 0; game.wave = 0; game.combo = 0; game.lives = 3;
    game.timeScale = 1; game.slowUntil = 0; game.toSpawn = 0; game.waveBreak = 0;
    game.blossomReady = false; game.blossoming = false;
    game.prevHigh = game.high;
    resetStats();
    buildHUD(); showHUD(true); hideGameOver(); closeHowto();
    if (hud) hud.classList.remove('blossom', 'alarm', 'menu');
    document.body.classList.remove('cas-menu');
    if (hudEls && hudEls.hint) hudEls.hint.classList.remove('hot');
    document.body.classList.add('ah-playing');
    if (hudEls && hudEls.reticle) updateReticle(window.innerWidth / 2, window.innerHeight / 2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fadeSite(true);
    if (!musicEl || musicEl.paused) startMusic();
    ensureMissileBuf();          // preload the launch sample
    ensureBlasters();            // preload blaster + hit + slow-mo samples
    nextWave();
    ensureRunning();
  }
  function gameOver() {
    game.over = true;
    anomalies.slice().forEach(removeAnomaly);
    setBreachAlarm(false);
    stats.elapsed = performance.now() - stats.startedAt;
    commitCareer();
    const isNew = game.score > 0 && game.score > game.prevHigh;
    showGameOver(isNew);
  }
  function exitToMenu() { clearGoCountdown(); game.active = false; game.over = false; game.attract = false; openSplash(); }
  function endGame() {
    clearGoCountdown();
    game.active = false; game.over = false; game.attract = false; game.paused = false;
    anomalies.slice().forEach(removeAnomaly);
    if (hud) hud.classList.remove('menu', 'howto', 'paused');
    document.body.classList.remove('ah-playing', 'cas-menu', 'ah-paused');
    fadeSite(false);
    stopMusic();
    showHUD(false); hideGameOver();
  }

  // ---- pause: stash the run and return to the website ("play at work") ----
  // ESC (desktop) or rotating to portrait (mobile) pauses without losing the
  // run; FLYNN / Konami / ESC / rotate-to-landscape resumes exactly where it was.
  function pauseGame() {
    if (!game.active || game.paused || game.over) return;
    game.paused = true; game.pausedAt = performance.now();
    setBreachAlarm(false);
    anomalies.forEach((a) => { if (a.mesh) a.mesh.visible = false; });   // hide the craft behind the site
    if (hud) hud.classList.remove('blossom', 'alarm');
    showHUD(false);
    document.body.classList.remove('ah-playing');
    fadeSite(false);                       // bring the website back
    if (musicEl) musicEl.pause();          // silence — looks like normal browsing
    hideNowPlaying();
  }
  function resumeGame() {
    if (!game.paused) return;
    game.paused = false;
    // don't count paused time against survival / timers
    const delta = performance.now() - game.pausedAt;
    stats.startedAt += delta;
    if (game.slowUntil) game.slowUntil += delta;
    anomalies.forEach((a) => { if (a.mesh) a.mesh.visible = true; });
    showHUD(true);
    document.body.classList.add('ah-playing');
    fadeSite(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (musicOn && musicEl) { musicEl.play().catch(() => {}); showNowPlaying(nowPlaying); }
    last = performance.now();              // avoid a giant dt on the first resumed frame
    ensureRunning();
  }

  // ---- HUD (DOM) ----
  let hud = null, hudEls = null;
  function buildHUD() {
    if (hud) return;
    hud = document.createElement('div'); hud.className = 'ah-hud';
    hud.innerHTML =
      '<div class="ah-flash"></div>' +
      '<div class="ah-frame">' +
        '<span class="ah-corner tl"></span><span class="ah-corner tr"></span>' +
        '<span class="ah-corner bl"></span><span class="ah-corner br"></span>' +
        '<span class="ah-tick ah-tick-t"></span><span class="ah-tick ah-tick-b"></span>' +
        '<div class="ah-scan"></div>' +
      '</div>' +
      '<div class="ah-header">' +
        '<span class="ah-id">FLYNN // ANOMALY HUNT</span>' +
        '<span class="ah-sys">DEF GRID · ONLINE</span>' +
      '</div>' +
      '<div class="ah-stats">' +
        '<div class="ah-mod"><i>SCORE</i><b data-score>0</b></div>' +
        '<div class="ah-mod"><i>WAVE</i><b data-wave>1</b></div>' +
        '<div class="ah-mod"><i>COMBO</i><b data-combo>\u00d71</b></div>' +
        '<div class="ah-mod ah-lives"><i>THRESHOLD</i><b data-lives>\u25c6\u25c6\u25c6</b></div>' +
        '<div class="ah-mod"><i>BEST</i><b data-high>0</b></div>' +
      '</div>' +
      '<div class="ah-radar" aria-hidden="true">' +
        '<div class="ah-radar-grid"></div>' +
        '<div class="ah-radar-sweep"></div>' +
        '<div class="ah-radar-cross"></div>' +
        '<span class="ah-radar-cap">SECTOR SCAN</span>' +
      '</div>' +
      '<div class="ah-splash" data-splash></div>' +
      '<button class="ah-fs" data-fs type="button" aria-label="Toggle full screen">' +
        '<svg class="ah-fs-in" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/></svg>' +
        '<svg class="ah-fs-out" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4H4v5"/><path d="M15 4h5v5"/><path d="M9 20H4v-5"/><path d="M15 20h5v-5"/></svg>' +
        '<span class="ah-fs-label">FULL SCREEN</span>' +
      '</button>' +
      '<button class="ah-music" data-music type="button" aria-label="Toggle music"><span class="ah-note">♪</span> <span data-musiclabel>MUSIC</span></button>' +
      '<div class="ah-hint">CLICK / HOLD TO FIRE \u00b7 MAX CHARGE = HORIZON BOMB \u00b7 ESC TO EXIT</div>' +
      '<div class="ah-armed"><span class="ah-armed-dot"></span>DEATH BLOSSOM ARMED \u00b7 PRESS SPACE</div>' +
      '<button class="ah-blossom-btn" data-blossom type="button" aria-label="Death Blossom">' +
        '<span class="bb-bracket tl"></span><span class="bb-bracket tr"></span>' +
        '<span class="bb-bracket bl"></span><span class="bb-bracket br"></span>' +
        '<span class="bb-word bb-word-l">DEATH</span>' +
        '<span class="bb-stripes"></span>' +
        '<span class="bb-word bb-word-r">BLOSSOM</span>' +
      '</button>' +
      '<div class="ah-prompt" data-prompt></div>' +
      '<div class="ah-reticle" data-reticle aria-hidden="true">' +
        '<span class="ah-ret-ring"></span>' +
        '<span class="ah-ret-tick t"></span><span class="ah-ret-tick r"></span>' +
        '<span class="ah-ret-tick b"></span><span class="ah-ret-tick l"></span>' +
        '<span class="ah-ret-dot"></span>' +
        '<span class="ah-ret-lock tl"></span><span class="ah-ret-lock tr"></span>' +
        '<span class="ah-ret-lock bl"></span><span class="ah-ret-lock br"></span>' +
        '<span class="ah-ret-label" data-retlabel></span>' +
      '</div>' +
      '<div class="ah-over" data-over role="dialog" aria-modal="true" aria-label="Game over">' +
        '<div class="ah-over-card">' +
          '<svg class="svgo" viewBox="0 0 520 600" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">' +
            '<defs>' +
              '<linearGradient id="svgoBg" x1="0" y1="0" x2="0" y2="1">' +
                '<stop offset="0" stop-color="#0c1320" stop-opacity="0.96"/>' +
                '<stop offset="1" stop-color="#060a12" stop-opacity="0.97"/>' +
              '</linearGradient>' +
            '</defs>' +
            '<rect x="6" y="6" width="508" height="588" rx="16" fill="url(#svgoBg)" stroke="rgba(255,138,90,0.40)" stroke-width="1.5"/>' +
            '<path class="svgo-bracket" d="M22 54 V22 H54"/>' +
            '<path class="svgo-bracket" d="M498 54 V22 H466"/>' +
            '<path class="svgo-bracket" d="M22 546 V578 H54"/>' +
            '<path class="svgo-bracket" d="M498 546 V578 H466"/>' +
            '<text class="svgo-new" data-new x="260" y="44" text-anchor="middle">\u2605 NEW HIGH SCORE \u2605</text>' +
            '<text class="svgo-title" x="260" y="98" text-anchor="middle">GAME OVER</text>' +
            '<text class="svgo-subtitle" x="260" y="122" text-anchor="middle">THRESHOLD BREACHED</text>' +
            '<text class="svgo-cont-lbl" x="260" y="152" text-anchor="middle">CONTINUE?</text>' +
            '<text class="svgo-cont-num" data-continue x="260" y="190" text-anchor="middle">9</text>' +
            '<text class="svgo-eyebrow" x="260" y="216" text-anchor="middle">SCORE</text>' +
            '<text class="svgo-score" data-fscore x="260" y="246" text-anchor="middle">0</text>' +
            '<text class="svgo-best" x="260" y="270" text-anchor="middle">BEST <tspan class="svgo-best-v" data-fhigh>0</tspan></text>' +
            '<g class="svgo-grid">' +
              '<rect x="26" y="288" width="468" height="208" rx="6"/>' +
              '<line x1="260" y1="288" x2="260" y2="496"/>' +
              '<line x1="26" y1="340" x2="494" y2="340"/>' +
              '<line x1="26" y1="392" x2="494" y2="392"/>' +
              '<line x1="26" y1="444" x2="494" y2="444"/>' +
            '</g>' +
            '<text class="svgo-lbl" x="146" y="312" text-anchor="middle">WAVE</text>' +
            '<text class="svgo-val" data-st-wave x="146" y="334" text-anchor="middle">0</text>' +
            '<text class="svgo-lbl" x="374" y="312" text-anchor="middle">TIME</text>' +
            '<text class="svgo-val" data-st-time x="374" y="334" text-anchor="middle">0:00</text>' +
            '<text class="svgo-lbl" x="146" y="364" text-anchor="middle">FAULTS CAUGHT</text>' +
            '<text class="svgo-val" data-st-faults x="146" y="386" text-anchor="middle">0</text>' +
            '<text class="svgo-lbl" x="374" y="364" text-anchor="middle">ACCURACY</text>' +
            '<text class="svgo-val" data-st-acc x="374" y="386" text-anchor="middle">0%</text>' +
            '<text class="svgo-lbl" x="146" y="416" text-anchor="middle">SHOTS FIRED</text>' +
            '<text class="svgo-val" data-st-shots x="146" y="438" text-anchor="middle">0</text>' +
            '<text class="svgo-lbl" x="374" y="416" text-anchor="middle">BEST COMBO</text>' +
            '<text class="svgo-val" data-st-combo x="374" y="438" text-anchor="middle">0</text>' +
            '<text class="svgo-lbl" x="146" y="468" text-anchor="middle">DEATH BLOSSOMS</text>' +
            '<text class="svgo-val" data-st-blossoms x="146" y="490" text-anchor="middle">0</text>' +
            '<text class="svgo-lbl" x="374" y="468" text-anchor="middle">SLOW-MO GRABBED</text>' +
            '<text class="svgo-val" data-st-slowmo x="374" y="490" text-anchor="middle">0</text>' +
            '<text class="svgo-career" data-career x="260" y="520" text-anchor="middle"></text>' +
            '<g class="svgo-btn svgo-btn-fill" data-retry role="button" tabindex="0">' +
              '<rect x="86" y="536" width="160" height="44" rx="22"/>' +
              '<text x="166" y="564" text-anchor="middle">CONTINUE</text>' +
            '</g>' +
            '<g class="svgo-btn svgo-btn-ghost" data-menu role="button" tabindex="0">' +
              '<rect x="274" y="536" width="160" height="44" rx="22"/>' +
              '<text x="354" y="564" text-anchor="middle">MAIN MENU</text>' +
            '</g>' +
          '</svg>' +
        '</div>' +
      '</div>' +
      '<div class="cas-splash">' +
        '<div class="cas-hi">HI-SCORE <b data-hiscore>0</b></div>' +
        '<div class="cas-titlewrap">' +
          '<h1 class="cas-title"><span>CYBERSPACE</span><span>ANOMALOIDS</span></h1>' +
          '<div class="cas-sub">A FLYNN DEFENSE SIMULATION</div>' +
        '</div>' +
        '<button class="cas-coin" data-start type="button" aria-label="Insert coin to play">' +
          '<span class="cas-coin-slot"></span>' +
          '<span class="cas-coin-body">' +
            '<span class="cas-coin-price">25<i>¢</i></span>' +
            '<span class="cas-coin-rule"></span>' +
            '<span class="cas-coin-cta"><span>INSERT COIN</span><span>TO PLAY</span></span>' +
          '</span>' +
        '</button>' +
        '<div class="cas-prompt">PRESS ENTER · INSERT COIN</div>' +
        '<button class="cas-howto-btn" data-howto type="button">HOW TO PLAY</button>' +
        '<div class="cas-credits">MUSIC BY ENTROPYWALKER · © 2026 ENTROMORPHIC</div>' +
        '<div class="cas-howto" data-howtopanel>' +
          '<div class="cas-howto-card">' +
            '<div class="cas-howto-t">HOW TO PLAY</div>' +
            '<ul class="cas-howto-list">' +
              '<li><b>AIM</b><span class="cas-keys"><kbd class="cas-key"><span class="cas-mouse"></span>MOVE</kbd></span><span>Track anomaloids streaming in from the void</span></li>' +
              '<li><b>FIRE</b><span class="cas-keys"><kbd class="cas-key">CLICK</kbd></span><span>Lock on and neutralize a fault</span></li>' +
              '<li><b>CHARGE</b><span class="cas-keys"><kbd class="cas-key">HOLD</kbd></span><span>A full charge detonates the horizon</span></li>' +
              '<li><b>SLOW-MO</b><span class="cas-keys"><kbd class="cas-key"><span class="cas-core"></span>CORE</kbd></span><span>Shoot a cyan core to bend time in your favor</span></li>' +
              '<li><b>THRESHOLD</b><span class="cas-keys"><span class="cas-pips">\u25c6\u25c6\u25c6</span></span><span>Three breaches and the run is over</span></li>' +
            '</ul>' +
            '<button class="ah-btn" data-howtoclose type="button">GOT IT</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(hud);
    hudEls = {
      score: hud.querySelector('[data-score]'), wave: hud.querySelector('[data-wave]'),
      combo: hud.querySelector('[data-combo]'), lives: hud.querySelector('[data-lives]'),
      high: hud.querySelector('[data-high]'), splash: hud.querySelector('[data-splash]'),
      over: hud.querySelector('[data-over]'), fscore: hud.querySelector('[data-fscore]'),
      fhigh: hud.querySelector('[data-fhigh]'), flash: hud.querySelector('.ah-flash'),
      music: hud.querySelector('[data-music]'), musicLabel: hud.querySelector('[data-musiclabel]'),
      reticle: hud.querySelector('[data-reticle]'), retLabel: hud.querySelector('[data-retlabel]'),
      radar: hud.querySelector('.ah-radar'), hint: hud.querySelector('.ah-hint'), prompt: hud.querySelector('[data-prompt]'),
      fs: hud.querySelector('[data-fs]'),
      hiscore: hud.querySelector('[data-hiscore]'), newhigh: hud.querySelector('[data-new]'),
      stWave: hud.querySelector('[data-st-wave]'), stTime: hud.querySelector('[data-st-time]'),
      stFaults: hud.querySelector('[data-st-faults]'), stAcc: hud.querySelector('[data-st-acc]'),
      stShots: hud.querySelector('[data-st-shots]'), stCombo: hud.querySelector('[data-st-combo]'),
      stBlossoms: hud.querySelector('[data-st-blossoms]'), stSlowmo: hud.querySelector('[data-st-slowmo]'),
      career: hud.querySelector('[data-career]')
    };
    hud.querySelector('[data-retry]').addEventListener('click', (e) => { e.stopPropagation(); game.active = false; game.over = false; startGame(); });
    hud.querySelector('[data-menu]').addEventListener('click', (e) => { e.stopPropagation(); exitToMenu(); });
    // keyboard activation for the SVG game-over buttons (role=button, tabindex=0)
    ['[data-retry]', '[data-menu]'].forEach((sel) => {
      const g = hud.querySelector(sel);
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space') {
          e.preventDefault(); e.stopPropagation();
          g.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      });
    });
    hud.querySelector('[data-start]').addEventListener('click', (e) => { e.stopPropagation(); startGame(); });
    hud.querySelector('[data-howto]').addEventListener('click', (e) => { e.stopPropagation(); openHowto(); });
    hud.querySelector('[data-howtoclose]').addEventListener('click', (e) => { e.stopPropagation(); closeHowto(); });
    // full-screen toggle
    const fsBtn = hud.querySelector('[data-fs]');
    if (fsBtn) {
      if (!fullscreenSupported()) {
        fsBtn.style.display = 'none';     // e.g. iPhone Safari — no element fullscreen; hide the dead button
      } else {
        fsBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFullscreen(); });
        fsBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); }, { passive: true });
        document.addEventListener('fullscreenchange', updateFsBtn);
        document.addEventListener('webkitfullscreenchange', updateFsBtn);
        updateFsBtn();
      }
    }
    // touch devices have no Enter key — speak their language on the splash prompt
    try {
      if (window.matchMedia('(pointer: coarse)').matches) {
        const pr = hud.querySelector('.cas-prompt');
        if (pr) pr.textContent = 'TAP THE COIN TO PLAY';
        const hint = hud.querySelector('.ah-hint');
        if (hint) hint.textContent = 'TAP TO FIRE \u00b7 HOLD TO CHARGE \u00b7 ROTATE TO EXIT';
      }
    } catch (e) {}
    // mobile Death Blossom button — tap to fire it (no keyboard). stop the tap
    // from also triggering a normal shot via the window pointer handler.
    const bb = hud.querySelector('[data-blossom]');
    if (bb) {
      bb.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); if (game.blossomReady) deathBlossom(); }, { passive: false });
      bb.addEventListener('click', (e) => { e.stopPropagation(); });
    }
    hudEls.music.addEventListener('click', (e) => { e.stopPropagation(); setMusic(!musicOn); });
    updateMusicBtn();
  }
  function updateMusicBtn() {
    if (!hudEls || !hudEls.music) return;
    hudEls.music.classList.toggle('off', !musicOn);
    hudEls.musicLabel.textContent = musicOn ? 'MUSIC' : 'MUTED';
  }
  // full-screen toggle (cross-browser)
  function isFullscreen() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function fullscreenSupported() {
    const el = document.documentElement;
    return !!(el.requestFullscreen || el.webkitRequestFullscreen) && (document.fullscreenEnabled !== false);
  }
  function toggleFullscreen() {
    try {
      if (isFullscreen()) {
        (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
      } else {
        const el = document.documentElement;
        (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
      }
    } catch (e) {}
  }
  function updateFsBtn() { if (hudEls && hudEls.fs) hudEls.fs.classList.toggle('on', isFullscreen()); }
  // targeting reticle follows the pointer; locks (orange) when over a craft
  let reticleSeen = false;
  function updateReticle(x, y) {
    if (!hudEls || !hudEls.reticle) return;
    const r = hudEls.reticle;
    r.style.left = x + 'px'; r.style.top = y + 'px';
    if (!reticleSeen) { reticleSeen = true; r.classList.add('seen'); }
    const a = pickAnomaly(x, y);
    r.classList.toggle('lock', !!a);
    if (a) { r.classList.toggle('slowlock', a.type === 'slow'); if (hudEls.retLabel) hudEls.retLabel.textContent = a.name; }
  }
  function showHUD(on) { if (hud) hud.classList.toggle('on', !!on); }
  function updateHUD() {
    if (!hudEls) return;
    hudEls.score.textContent = game.score;
    hudEls.wave.textContent = game.wave;
    hudEls.combo.textContent = '\u00d7' + (1 + Math.floor(game.combo / 5));
    hudEls.high.textContent = game.high;
    hudEls.lives.textContent = game.lives > 0 ? '\u25c6'.repeat(game.lives) : '\u2014';
  }
  function flashScreen(kind) {
    if (!hudEls) return;
    hudEls.flash.style.background = kind === 'breach'
      ? 'radial-gradient(circle at 50% 50%, rgba(255,60,30,0.30), transparent 60%)'
      : kind === 'bomb'
      ? 'radial-gradient(circle at 50% 45%, rgba(90,230,255,0.32), transparent 62%)'
      : 'radial-gradient(circle at 50% 50%, rgba(120,240,255,0.20), transparent 60%)';
    hudEls.flash.classList.remove('hit'); void hudEls.flash.offsetWidth; hudEls.flash.classList.add('hit');
  }
  function flashWave() {
    if (!hudEls) return;
    hudEls.splash.textContent = 'WAVE ' + game.wave;
    hudEls.splash.classList.remove('show'); void hudEls.splash.offsetWidth; hudEls.splash.classList.add('show');
  }
  function showPrompt(text) {
    if (!hudEls || !hudEls.prompt) return;
    hudEls.prompt.textContent = text;
    hudEls.prompt.classList.remove('show'); void hudEls.prompt.offsetWidth; hudEls.prompt.classList.add('show');
  }
  function showGameOver(isNew) {
    if (!hudEls) return;
    hudEls.fscore.textContent = game.score; hudEls.fhigh.textContent = game.high;
    if (hudEls.newhigh) hudEls.newhigh.style.display = isNew ? '' : 'none';
    if (hudEls.stWave) {
      hudEls.stWave.textContent = game.wave;
      hudEls.stTime.textContent = fmtTime(stats.elapsed);
      hudEls.stFaults.textContent = stats.faults;
      hudEls.stAcc.textContent = accuracy(stats.hits, stats.shots) + '%';
      hudEls.stShots.textContent = stats.shots;
      hudEls.stCombo.textContent = stats.bestCombo;
      hudEls.stBlossoms.textContent = stats.blossoms;
      hudEls.stSlowmo.textContent = stats.slowmo;
    }
    if (hudEls.career) {
      hudEls.career.textContent = 'CAREER · ' + (career.games || 0) + ' RUNS · ' +
        (career.faults || 0) + ' FAULTS · ' + accuracy(career.hits, career.shots) + '% ACC · ' +
        'BEST WAVE ' + (career.bestWave || 0);
    }
    hudEls.over.classList.add('show');
    // move focus to the primary action so keyboard users can act immediately
    try { var _r = hudEls.over.querySelector('[data-retry]'); if (_r) _r.focus(); } catch (e) {}
    startGoCountdown();
  }
  // CAPCOM-style continue countdown: 9 → 0; expiry drops back to the attract menu
  let goTimer = 0;
  function clearGoCountdown() { if (goTimer) { clearInterval(goTimer); goTimer = 0; } }
  function startGoCountdown() {
    clearGoCountdown();
    const numEl = hud && hud.querySelector('[data-continue]');
    const svg = hud && hud.querySelector('.svgo');
    if (svg) svg.classList.remove('go-expired');
    let n = 9;
    if (numEl) { numEl.textContent = n; numEl.classList.remove('low'); }
    goTimer = setInterval(function () {
      n--;
      if (numEl) { numEl.textContent = Math.max(0, n); if (n <= 3) numEl.classList.add('low'); }
      if (n <= 0) { clearGoCountdown(); if (svg) svg.classList.add('go-expired'); }   // keep the stats card up
    }, 1000);
  }
  function hideGameOver() { if (hudEls) hudEls.over.classList.remove('show'); }

  // ---- fade the whole site out/in for the game --------------------------
  // the site reveals elements via the Web Animations API (fill:forwards),
  // which override CSS opacity/filter. So we fade with the same API — a
  // later animation wins — and reverse it to restore.
  let fadeAnims = [];
  function fadeTargets() {
    return document.querySelectorAll('.nav, .void-haze, section, .footer, .strip');
  }
  function fadeSite(out) {
    if (out) {
      fadeAnims.forEach((a) => { try { a.cancel(); } catch (e) {} });
      fadeAnims = [];
      fadeTargets().forEach((el) => {
        fadeAnims.push(el.animate(
          [{ opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: 'blur(7px)' }],
          { duration: 600, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }
        ));
      });
    } else {
      // reverse the existing fade-outs back to visible, then drop them so the
      // elements revert to their natural (CSS) state
      fadeAnims.forEach((a) => {
        try { a.reverse(); a.onfinish = () => { try { a.cancel(); } catch (e) {} }; }
        catch (e) { try { a.cancel(); } catch (e2) {} }
      });
      fadeAnims = [];
    }
  }

  // ---- triggers: Konami code or type FLYNN; ESC exits --------------------
  const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  let kbuf = [], fbuf = '';
  window.addEventListener('keydown', (e) => {
    const k = (e.key || '').toLowerCase();
    kbuf.push(k); if (kbuf.length > KONAMI.length) kbuf.shift();
    if (!cfg.noGame && kbuf.length === KONAMI.length && KONAMI.every((v, i) => kbuf[i] === v)) { kbuf = []; if (game.paused) resumeGame(); else openSplash(); }
    if (!cfg.noGame && k.length === 1) { fbuf = (fbuf + k).slice(-5); if (fbuf === 'flynn') { fbuf = ''; if (game.paused) resumeGame(); else openSplash(); } }
    if (k === 'escape') {
      if (game.paused) resumeGame();
      else if (game.active && !game.over) pauseGame();   // stash the run, back to the site
      else if (game.attract || game.over) endGame();
    }
    if ((k === 'enter' || k === ' ' || k === 'spacebar' || e.code === 'Space') && game.paused) { e.preventDefault(); resumeGame(); }
    else if ((k === 'enter' || k === ' ' || k === 'spacebar' || e.code === 'Space') && game.attract) { e.preventDefault(); startGame(); }
    else if ((k === ' ' || k === 'spacebar' || e.code === 'Space') && game.active && !game.paused) { e.preventDefault(); if (game.blossomReady) deathBlossom(); }
  });

  // ---- touch devices: rotate to landscape to enter the arcade -----------
  // phones & tablets (coarse pointer + landscape). The height cap is generous
  // enough to include tablets (~1024px tall in landscape) but bounded so a
  // desktop never qualifies; coarse-pointer + an actual rotation gate the rest.
  (function () {
    if (cfg.noGame) return;                  // game disabled on this page (e.g. 404)
    const coarse = () => { try { return window.matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } };
    let mq;
    try { mq = window.matchMedia('(orientation: landscape)'); } catch (e) { return; }
    function onOrient() {
      if (!coarse()) return;
      if (mq.matches) {                       // turned horizontal
        if (game.paused) resumeGame();        // back to your saved run
        else if (window.innerHeight <= 1200 && !game.active && !game.attract && !game.over) openSplash();
      } else {                                // back to portrait
        if (game.active && !game.paused) pauseGame();   // stash the run, look like you're reading
        else if (game.attract || game.over) endGame();
      }
    }
    if (mq.addEventListener) mq.addEventListener('change', onOrient);
    else if (mq.addListener) mq.addListener(onOrient);   // older Safari
  })();

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
    updateFx(dt);
    updateDebris(dt);
    updateMissiles(dt);
    updateMusic(dt);
    if (game.active) updateGame(dt);
    else if (game.attract) updateAttract(dt);
    renderer.render(scene, camera);

    // keep animating while motion is on OR effects / the game / attract is active
    if (motion || tracers.length || bursts.length || fx.length || debris.length || missiles.length || game.active || game.attract) { raf = requestAnimationFrame(frame); running = true; }
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
    else if (motion || game.active || game.attract) start();
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
    setMusic(on) { setMusic(on); },
    get musicEnabled() { return musicOn; },
    get nowPlaying() { return nowPlaying ? { title: nowPlaying.title, artist: nowPlaying.artist, meta: nowPlaying.meta } : null; },
    get tracerCount() { return tracers.length; },
    startGame() { startGame(); },
    openSplash() { openSplash(); },
    stopGame() { endGame(); },
    pauseGame() { pauseGame(); },
    resumeGame() { resumeGame(); },
    deathBlossom() { game.blossomReady = true; deathBlossom(); },
    get stats() { return { shots: stats.shots, hits: stats.hits, accuracy: accuracy(stats.hits, stats.shots), faults: stats.faults, breaches: stats.breaches, bestCombo: stats.bestCombo, blossoms: stats.blossoms, slowmo: stats.slowmo, elapsed: stats.elapsed }; },
    get career() { return Object.assign({ accuracy: accuracy(career.hits, career.shots) }, career); },
    get game() { return { active: game.active, over: game.over, attract: game.attract, paused: game.paused, score: game.score, wave: game.wave, combo: game.combo, lives: game.lives, anomalies: anomalies.length, blossomReady: game.blossomReady }; }
  };

  // ---- auto-music (e.g. the 404 page): start the synthwave + now-playing card.
  // Browsers block audio until a user gesture, so try immediately; if that's
  // refused, arm a one-shot starter on the first real interaction. The card is
  // suppressed until playback is actually confirmed (no silent-card flash).
  if (cfg.autoMusic && musicOn) {
    startMusic();
    hideNowPlaying();                          // suppress premature card; show only once audio is confirmed
    setTimeout(() => {
      if (musicEl && !musicEl.paused) { showNowPlaying(nowPlaying); return; }   // autoplay allowed
      const evs = ['pointerdown', 'keydown', 'touchstart', 'click'];
      const cleanup = () => evs.forEach((ev) => window.removeEventListener(ev, go, true));
      function go() {
        cleanup();
        if (musicEl && musicEl.paused) { musicEl.play().then(() => showNowPlaying(nowPlaying)).catch(() => {}); }
        else { showNowPlaying(nowPlaying); }
      }
      evs.forEach((ev) => window.addEventListener(ev, go, true));
    }, 250);
  }
})();
