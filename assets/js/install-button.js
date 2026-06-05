/* ============================================================================
   install-button.js — a floating bloom emblem beside the INSTALL nav link.

   A neon "anomaly core" rendered in three.js: nested counter-rotating wireframe
   icosahedra with a hot additive center, run through a hand-rolled UnrealBloom-
   style post pipeline (scene -> two blurred mip levels -> additive composite) so
   the edges bloom with an HDR glow — the Tron look from the three.js
   webgl_postprocessing_unreal_bloom example. Rendered on a transparent canvas
   (alpha from luminance) so the gem floats freely next to the label.

   On hover/focus it energizes: faster spin, cyan -> anomaly-orange, stronger
   bloom. Wired to the real Progressive Web App install flow. Degrades:
     - no WebGL            -> stays a styled button (.no-fx)
     - not installable     -> shows manual "Add to Home Screen" instructions
     - already installed   -> hides itself
   Respects prefers-reduced-motion (freezes motion, keeps a static glow).
   Requires THREE (loaded before this script).
   ========================================================================== */
(function () {
  'use strict';

  var buttons = [].slice.call(document.querySelectorAll('[data-install]'));
  if (!buttons.length) return;

  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
                   window.navigator.standalone === true;
  if (standalone) { buttons.forEach(function (b) { b.style.display = 'none'; }); return; }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  /* ---- PWA install plumbing ------------------------------------------- */
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    buttons.forEach(function (b) { b.classList.add('is-ready'); });
  });
  window.addEventListener('appinstalled', function () {
    deferred = null;
    buttons.forEach(function (b) { b.classList.remove('is-ready'); });
    toast('Flynn installed — look for it with your apps. 🟧🟦');
    closePop();
    buttons.forEach(function (b) { b.style.display = 'none'; });
  });

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'install-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 400); }, 3400);
  }

  var pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; document.removeEventListener('pointerdown', onDoc, true); } }
  function onDoc(e) { if (pop && !pop.contains(e.target) && !e.target.closest('[data-install]')) closePop(); }
  function showInstructions(btn) {
    closePop();
    pop = document.createElement('div');
    pop.className = 'install-pop';
    var steps = isIOS
      ? 'Tap the <b>Share</b> icon, then <b>“Add to Home Screen.”</b>'
      : 'Open your browser menu and choose <b>“Install app”</b> or <b>“Add to Home Screen.”</b> Some browsers show an install icon in the address bar.';
    pop.innerHTML =
      '<div class="install-pop-h">Install <span class="install-pop-dn">inlikeflynn.io</span></div>' +
      '<p>' + steps + '</p>' +
      '<p class="install-pop-fine">It just opens this site in its own window — no account, no tracking.</p>';
    document.body.appendChild(pop);
    var r = btn.getBoundingClientRect();
    var pw = pop.offsetWidth, ph = pop.offsetHeight;
    var pad = 12, gap = 10;
    var vw = window.innerWidth, vh = window.innerHeight;
    var left, top;
    if (r.bottom + gap + ph <= vh - pad) {
      // room below — place beneath, centered on the link
      left = r.left + r.width / 2 - pw / 2;
      top = r.bottom + gap;
    } else {
      // not enough room below (e.g. the footer) — place to the side, centered vertically
      top = r.top + r.height / 2 - ph / 2;
      if (r.right + gap + pw <= vw - pad) {
        left = r.right + gap;              // to the right of the link
      } else {
        left = r.left - gap - pw;          // fall back to the left if right overflows
      }
    }
    // clamp inside the viewport
    left = Math.min(vw - pw - pad, Math.max(pad, left));
    top = Math.min(vh - ph - pad, Math.max(pad, top));
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    requestAnimationFrame(function () { pop.classList.add('show'); });
    setTimeout(function () { document.addEventListener('pointerdown', onDoc, true); }, 0);
  }

  function onActivate(btn) {
    if (deferred) {
      var d = deferred; deferred = null;
      d.prompt();
      if (d.userChoice) d.userChoice.then(function (c) {
        if (c && c.outcome === 'accepted') toast('Installing Flynn…');
        else buttons.forEach(function (b) { b.classList.add('is-ready'); });
      });
    } else {
      showInstructions(btn);
    }
  }

  /* ---- post-processing shaders (fullscreen quad) ---------------------- */
  var QUAD_VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

  // separable 9-tap Gaussian; uDir carries the per-pass texel step (and spread)
  var BLUR_FRAG = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform sampler2D tDiffuse;',
    'uniform vec2 uDir;',
    'void main(){',
    '  vec4 s = vec4(0.0);',
    '  s += texture2D(tDiffuse, vUv + uDir * -4.0) * 0.0162;',
    '  s += texture2D(tDiffuse, vUv + uDir * -3.0) * 0.0540;',
    '  s += texture2D(tDiffuse, vUv + uDir * -2.0) * 0.1216;',
    '  s += texture2D(tDiffuse, vUv + uDir * -1.0) * 0.1945;',
    '  s += texture2D(tDiffuse, vUv) * 0.2270;',
    '  s += texture2D(tDiffuse, vUv + uDir *  1.0) * 0.1945;',
    '  s += texture2D(tDiffuse, vUv + uDir *  2.0) * 0.1216;',
    '  s += texture2D(tDiffuse, vUv + uDir *  3.0) * 0.0540;',
    '  s += texture2D(tDiffuse, vUv + uDir *  4.0) * 0.0162;',
    '  gl_FragColor = s;',
    '}'
  ].join('\n');

  // additive composite of base scene + two bloom mips, with a gentle highlight
  // desaturation so blowout keeps its hue instead of clipping to white
  var COMP_FRAG = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform sampler2D tBase;',
    'uniform sampler2D tBloom1;',
    'uniform sampler2D tBloom2;',
    'uniform float uStrength;',
    'void main(){',
    '  vec3 base = texture2D(tBase, vUv).rgb;',
    '  vec3 bloom = texture2D(tBloom1, vUv).rgb * 0.8 + texture2D(tBloom2, vUv).rgb * 1.1;',
    '  vec3 col = base + bloom * uStrength;',
    '  float l = max(col.r, max(col.g, col.b));',
    '  col = mix(col, col / max(1.0, l), 0.16);',
    '  float a = clamp(l * 1.30, 0.0, 1.0);',
    '  gl_FragColor = vec4(col, a);',
    '}'
  ].join('\n');

  /* ---- the bloom core ------------------------------------------------- */
  var fxList = [];
  function initFx(btn) {
    var canvas = btn.querySelector('.install-fx');
    if (!canvas || typeof THREE === 'undefined') return null;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'low-power' });
    } catch (e) { return null; }
    var pr = Math.min(2, window.devicePixelRatio || 1);
    renderer.setPixelRatio(pr);
    renderer.setClearColor(0x000000, 0);   // transparent — the gem floats next to the label
    renderer.autoClear = false;

    // --- scene: nested neon wireframes + hot core ---
    var scene = new THREE.Scene();
    var cam = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    cam.position.set(0, 0, 7.4);   // pulled back: the gem reads ~26px but leaves
    var group = new THREE.Group(); scene.add(group);

    var icoIn = new THREE.IcosahedronGeometry(1.0, 0);
    var lineIn = new THREE.LineSegments(
      new THREE.EdgesGeometry(icoIn),
      new THREE.LineBasicMaterial({ color: 0x47d8ff, transparent: true, opacity: 0.95 })
    );
    group.add(lineIn);

    var lineOut = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.42, 0)),
      new THREE.LineBasicMaterial({ color: 0x47d8ff, transparent: true, opacity: 0.4 })
    );
    group.add(lineOut);

    var coreMat = new THREE.MeshBasicMaterial({
      color: 0x9fefff, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    var core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), coreMat);
    group.add(core);

    var ptsMat = new THREE.PointsMaterial({
      color: 0xc7f4ff, size: 0.085, sizeAttenuation: true,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    group.add(new THREE.Points(icoIn, ptsMat));

    // --- fullscreen-quad plumbing for the post passes ---
    var quadScene = new THREE.Scene();
    var quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    var quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); quadScene.add(quad);

    var blurMat = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, uDir: { value: new THREE.Vector2() } },
      vertexShader: QUAD_VERT, fragmentShader: BLUR_FRAG, depthTest: false, depthWrite: false, blending: THREE.NoBlending
    });
    var compMat = new THREE.ShaderMaterial({
      uniforms: { tBase: { value: null }, tBloom1: { value: null }, tBloom2: { value: null }, uStrength: { value: 1 } },
      vertexShader: QUAD_VERT, fragmentShader: COMP_FRAG, depthTest: false, depthWrite: false, blending: THREE.NoBlending
    });

    function mk(w, h) {
      return new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h),
        { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
    }
    var bw = 1, bh = 1, rtScene, rt1a, rt1b, rt2a, rt2b;
    function resize() {
      var r = canvas.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      renderer.setSize(w, h, false);
      bw = Math.max(1, Math.round(w * pr)); bh = Math.max(1, Math.round(h * pr));
      cam.aspect = bw / bh; cam.updateProjectionMatrix();
      if (rtScene) { rtScene.dispose(); rt1a.dispose(); rt1b.dispose(); rt2a.dispose(); rt2b.dispose(); }
      rtScene = mk(bw, bh);
      rt1a = mk(bw >> 1, bh >> 1); rt1b = mk(bw >> 1, bh >> 1);
      rt2a = mk(bw >> 2, bh >> 2); rt2b = mk(bw >> 2, bh >> 2);
    }
    resize();
    if (window.ResizeObserver) { new ResizeObserver(resize).observe(canvas); }
    window.addEventListener('resize', resize);

    function pass(mat, target) {
      quad.material = mat;
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(quadScene, quadCam);
    }

    var cyan = new THREE.Color(0x47d8ff), orange = new THREE.Color(0xff8a3a);
    var hotC = new THREE.Color(0x9fefff), hotO = new THREE.Color(0xffd2a6);
    var hover = 0, tMs = 0;

    btn.addEventListener('pointerenter', function () { obj.target = 1; });
    btn.addEventListener('pointerleave', function () { obj.target = 0; });
    btn.addEventListener('pointerdown', function () { obj.target = 1; hover = Math.min(1, hover + 0.4); });
    btn.addEventListener('focus', function () { obj.target = 1; });
    btn.addEventListener('blur', function () { obj.target = 0; });

    function render(dt) {
      hover += (obj.target - hover) * Math.min(1, dt * 0.008);
      var h = hover;
      if (!reduce) tMs += dt;
      var pulse = 0.5 + 0.5 * Math.sin(tMs * 0.0042);

      var spin = reduce ? 0 : (0.00035 + h * 0.0017);
      group.rotation.y += dt * spin;
      group.rotation.x += dt * spin * 0.42;
      lineOut.rotation.y -= dt * spin * 1.3;     // counter-rotate the outer cage
      lineOut.rotation.z += dt * spin * 0.5;
      core.rotation.y -= dt * spin * 1.8;

      lineIn.material.color.copy(cyan).lerp(orange, h);
      lineIn.material.opacity = 0.72 + h * 0.28;
      lineOut.material.color.copy(cyan).lerp(orange, h);
      lineOut.material.opacity = 0.22 + 0.12 * pulse + h * 0.30;
      coreMat.color.copy(hotC).lerp(hotO, h);
      coreMat.opacity = 0.12 + 0.10 * pulse + h * 0.20;
      core.scale.setScalar(0.5 + 0.08 * pulse + h * 0.30);
      ptsMat.color.copy(hotC).lerp(hotO, h);
      ptsMat.size = 0.06 + h * 0.05;

      // 1) render the neon scene
      renderer.setRenderTarget(rtScene); renderer.clear(); renderer.render(scene, cam);
      // 2) bloom mip 1 (half res) — H then V
      var sp1 = 1.7 + h * 1.6;
      blurMat.uniforms.tDiffuse.value = rtScene.texture;
      blurMat.uniforms.uDir.value.set(sp1 / Math.max(1, bw >> 1), 0); pass(blurMat, rt1a);
      blurMat.uniforms.tDiffuse.value = rt1a.texture;
      blurMat.uniforms.uDir.value.set(0, sp1 / Math.max(1, bh >> 1)); pass(blurMat, rt1b);
      // 3) bloom mip 2 (quarter res) — wider halo, fed from mip 1
      var sp2 = 2.8 + h * 2.4;
      blurMat.uniforms.tDiffuse.value = rt1b.texture;
      blurMat.uniforms.uDir.value.set(sp2 / Math.max(1, bw >> 2), 0); pass(blurMat, rt2a);
      blurMat.uniforms.tDiffuse.value = rt2a.texture;
      blurMat.uniforms.uDir.value.set(0, sp2 / Math.max(1, bh >> 2)); pass(blurMat, rt2b);
      // 4) composite to the canvas
      compMat.uniforms.tBase.value = rtScene.texture;
      compMat.uniforms.tBloom1.value = rt1b.texture;
      compMat.uniforms.tBloom2.value = rt2b.texture;
      compMat.uniforms.uStrength.value = 0.7 + h * 1.85 + 0.08 * pulse;
      pass(compMat, null);
    }

    var obj = { target: 0, render: render, hoverGet: function () { return hover; } };
    btn.__fx = obj;
    return obj;
  }

  /* ---- wire up -------------------------------------------------------- */
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () { onActivate(btn); });
    var fx = initFx(btn);
    if (fx) fxList.push(fx); else btn.classList.add('no-fx');
  });

  var paused = false;
  document.addEventListener('visibilitychange', function () { paused = document.hidden; });

  var last = performance.now();
  (function loop(now) {
    requestAnimationFrame(loop);
    var dt = Math.min(60, now - last); last = now;
    if (paused || !fxList.length) return;
    for (var i = 0; i < fxList.length; i++) fxList[i].render(dt);
  })(last);
})();
