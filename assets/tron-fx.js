/* Flynn — "Living Circuit" void backdrop.
   Renders to #grid-bg: a faint circuit lattice, drifting data-motes,
   and occasional light-ribbons sweeping across the void (abstracted
   light-cycle trails — never a perspective floor).

   Controlled by window.__tronFx.setMotion(bool).
*/
(function () {
  const canvas = document.getElementById('grid-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let motion = !reduce;

  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    // scoped to the canvas's container (the footer), not the full window
    W = canvas.clientWidth || window.innerWidth;
    H = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.max(1, W * dpr);
    canvas.height = Math.max(1, H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  // ---- data-motes -------------------------------------------------------
  let motes = [];
  function seed() {
    const count = Math.round((W * H) / 28000); // density scales with area
    motes = [];
    for (let i = 0; i < count; i++) {
      motes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.4 + 0.4,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12 - 0.04,
        a: Math.random() * 0.5 + 0.1,
        tw: Math.random() * Math.PI * 2,         // twinkle phase
        orange: Math.random() < 0.12,             // a few charged motes
      });
    }
  }

  // ---- light-ribbons (sweeping trails) ----------------------------------
  let ribbons = [];
  function spawnRibbon() {
    const horizontal = Math.random() < 0.6;
    const orange = Math.random() < 0.25;
    if (horizontal) {
      const y = Math.random() * H;
      const dir = Math.random() < 0.5 ? 1 : -1;
      ribbons.push({
        horizontal, orange, dir,
        pos: dir > 0 ? -0.15 * W : 1.15 * W,
        cross: y,
        len: Math.random() * 180 + 120,
        speed: (Math.random() * 2.2 + 1.6) * dir,
        life: 0,
      });
    } else {
      const x = Math.random() * W;
      const dir = Math.random() < 0.5 ? 1 : -1;
      ribbons.push({
        horizontal, orange, dir,
        pos: dir > 0 ? -0.15 * H : 1.15 * H,
        cross: x,
        len: Math.random() * 140 + 100,
        speed: (Math.random() * 2.0 + 1.4) * dir,
        life: 0,
      });
    }
    if (ribbons.length > 6) ribbons.shift();
  }

  function rgbaFromOklch(orange) {
    // approximate emissive colors (kept literal so it's cheap)
    return orange ? [255, 150, 64] : [120, 224, 255];
  }

  let lastRibbon = 0;
  function draw(now) {
    ctx.clearRect(0, 0, W, H);

    // faint static lattice (very subtle)
    const cell = 64;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(120, 200, 230, 0.035)';
    ctx.beginPath();
    for (let x = (now * 0.004 % cell); x < W; x += cell) {
      ctx.moveTo(x, 0); ctx.lineTo(x, H);
    }
    for (let y = 0; y < H; y += cell) {
      ctx.moveTo(0, y); ctx.lineTo(W, y);
    }
    ctx.stroke();

    // motes
    for (const m of motes) {
      if (motion) {
        m.x += m.vx; m.y += m.vy; m.tw += 0.02;
        if (m.x < -4) m.x = W + 4; if (m.x > W + 4) m.x = -4;
        if (m.y < -4) m.y = H + 4; if (m.y > H + 4) m.y = -4;
      }
      const tw = 0.6 + 0.4 * Math.sin(m.tw);
      const [r, g, b] = rgbaFromOklch(m.orange);
      ctx.beginPath();
      ctx.fillStyle = `rgba(${r},${g},${b},${m.a * tw})`;
      ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
      ctx.shadowBlur = m.orange ? 8 : 6;
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // ribbons
    if (motion && now - lastRibbon > 2600 && Math.random() < 0.04) {
      spawnRibbon(); lastRibbon = now;
    }
    for (const rb of ribbons) {
      if (motion) rb.pos += rb.speed;
      const [r, g, b] = rgbaFromOklch(rb.orange);
      const head = rb.pos;
      const tail = rb.pos - rb.len * Math.sign(rb.speed);
      let grad;
      if (rb.horizontal) {
        grad = ctx.createLinearGradient(tail, 0, head, 0);
      } else {
        grad = ctx.createLinearGradient(0, tail, 0, head);
      }
      grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0.55)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      if (rb.horizontal) {
        ctx.moveTo(tail, rb.cross); ctx.lineTo(head, rb.cross);
      } else {
        ctx.moveTo(rb.cross, tail); ctx.lineTo(rb.cross, head);
      }
      ctx.stroke();
      // bright head node
      ctx.fillStyle = `rgba(${r},${g},${b},0.95)`;
      ctx.beginPath();
      ctx.arc(rb.horizontal ? head : rb.cross, rb.horizontal ? rb.cross : head, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // cull off-screen ribbons
    ribbons = ribbons.filter(rb => {
      const max = rb.horizontal ? W : H;
      return rb.pos > -0.3 * max && rb.pos < 1.3 * max;
    });

    if (running) requestAnimationFrame(draw);
  }

  let running = true;
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas.parentNode || canvas);
  }
  resize();
  // seed a couple of ribbons so it's alive immediately
  if (motion) { spawnRibbon(); }
  requestAnimationFrame(draw);

  window.__tronFx = {
    setMotion(on) {
      motion = !!on;
      if (motion && !running) { running = true; requestAnimationFrame(draw); }
    },
  };
})();
