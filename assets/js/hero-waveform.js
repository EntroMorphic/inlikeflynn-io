/* Flynn hero waveform — animated learning -> detection cycle.
   Renders to a <canvas data-flynn-wave> element.
   Cycle:
     0..warmup    : LEARNING phase, threshold building
     warmup..fault: DETECTING phase, normal signal, locked threshold
     fault..end   : anomaly excursion crosses threshold -> ALERT
*/
(function () {
  const canvases = document.querySelectorAll('canvas[data-flynn-wave]');
  if (!canvases.length) return;

  canvases.forEach(setup);

  function setup(canvas) {
    const ctx = canvas.getContext('2d');
    const labelEls = {
      phase: document.querySelector('[data-flynn-phase]'),
      sample: document.querySelector('[data-flynn-sample]'),
      threshold: document.querySelector('[data-flynn-threshold]'),
      state: document.querySelector('[data-flynn-state]'),
      score: document.querySelector('[data-flynn-score]'),
    };

    let W = 0, H = 0, dpr = 1;
    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(320, rect.width);
      H = Math.max(220, rect.height);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // signal state
    const TOTAL = 17000;     // total samples shown across the canvas
    const WARMUP = 1700;     // learning window — first 10% (matches whitepaper's 1,700)
    const FAULT_AT = 15528;  // anomaly begins — near the end (~91%)
    const ALERT_AT = 15608;  // detection fires
    let t = 0;               // sample index (loops 0..TOTAL+pause)
    const PAUSE = 1400;
    let speed = (typeof window !== 'undefined' && window.FLYNN_WAVE_SPEED) || 20;          // samples per frame
    const samples = new Float32Array(TOTAL);
    let threshold = 0;       // locked threshold (set at warmup)
    let runningMin = 0, runningMax = 0;

    // procedural signal: baseline sine + harmonic + gaussian-ish noise
    function gen(i) {
      // baseline rhythm — frequencies scaled to TOTAL so the wave keeps a readable
      // ~29 cycles across the canvas regardless of sample count
      const base = Math.sin(i * 0.0107) * 0.45 + Math.sin(i * 0.0275 + 1.2) * 0.18;
      const noise = (Math.random() - 0.5) * 0.18 + (Math.random() - 0.5) * 0.12;
      let val = base + noise;
      // ramp up to a fault: gradual then sharp excursion
      if (i >= FAULT_AT) {
        const k = (i - FAULT_AT) / 80;
        const burst = Math.min(1.2, k * 0.9) * (0.6 + 0.6 * Math.sin(i * 0.55));
        val += burst * 1.05;
      }
      return val;
    }

    // pre-fill an initial buffer so the wave appears continuous on first draw
    for (let i = 0; i < TOTAL; i++) samples[i] = gen(i);

    function step() {
      // advance time
      const cycleLen = TOTAL + PAUSE;
      const prev = t;
      t = (t + speed) % cycleLen;

      // when wrapping, regenerate samples + reset threshold
      if (t < prev) {
        for (let i = 0; i < TOTAL; i++) samples[i] = gen(i);
        threshold = 0;
        runningMin = 0;
        runningMax = 0;
      }

      // accumulate running min/max during warmup (only on samples we've "seen")
      const visibleEnd = Math.min(t, TOTAL);
      if (visibleEnd <= WARMUP) {
        // recompute running min/max up to visibleEnd
        let mn = Infinity, mx = -Infinity;
        for (let i = 0; i < visibleEnd; i++) {
          if (samples[i] < mn) mn = samples[i];
          if (samples[i] > mx) mx = samples[i];
        }
        runningMin = mn === Infinity ? -0.6 : mn;
        runningMax = mx === -Infinity ? 0.6 : mx;
        // threshold lock at end of warmup — conservative envelope
        threshold = Math.max(Math.abs(runningMin), Math.abs(runningMax)) * 1.35;
      }

      draw(visibleEnd);
      updateLabels(visibleEnd);
      requestAnimationFrame(step);
    }

    function project(i, v) {
      const x = (i / TOTAL) * W;
      const yMid = H / 2;
      const yRange = H * 0.36;
      const y = yMid - v * yRange;
      return [x, y];
    }

    function inkRGBA(alpha) {
      // read current --ink at draw-time so theme switches take effect
      const v = getCSSVar('--ink') || '#14110d';
      // parse hex like #f4efe6 or #14110d
      const m = v.replace('#','');
      let r=20,g=17,b=13;
      if (m.length === 6) {
        r = parseInt(m.slice(0,2), 16);
        g = parseInt(m.slice(2,4), 16);
        b = parseInt(m.slice(4,6), 16);
      }
      return `rgba(${r},${g},${b},${alpha})`;
    }

    function draw(visibleEnd) {
      ctx.clearRect(0, 0, W, H);

      // background grid (mono, subtle)
      ctx.strokeStyle = inkRGBA(0.06);
      ctx.lineWidth = 1;
      const cols = 24, rows = 6;
      for (let i = 1; i < cols; i++) {
        const x = (i / cols) * W;
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let i = 1; i < rows; i++) {
        const y = (i / rows) * H;
        ctx.beginPath();
        ctx.moveTo(0, y); ctx.lineTo(W, y);
        ctx.stroke();
      }

      // center axis
      ctx.strokeStyle = inkRGBA(0.18);
      ctx.beginPath();
      ctx.moveTo(0, H/2); ctx.lineTo(W, H/2);
      ctx.stroke();

      // warmup region shading + progress
      const warmupX = (WARMUP / TOTAL) * W;
      ctx.fillStyle = inkRGBA(0.04);
      ctx.fillRect(0, 0, warmupX, H);

      // threshold lines (only after warmup complete)
      if (visibleEnd >= WARMUP && threshold > 0) {
        const [, yUp] = project(0, threshold);
        const [, yDn] = project(0, -threshold);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = inkRGBA(0.45);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(warmupX, yUp); ctx.lineTo(W, yUp);
        ctx.moveTo(warmupX, yDn); ctx.lineTo(W, yDn);
        ctx.stroke();
        ctx.setLineDash([]);

        // threshold labels
        ctx.fillStyle = inkRGBA(0.55);
        ctx.font = '500 10px "Geist Mono", ui-monospace, monospace';
        ctx.fillText('+THRESHOLD', warmupX + 8, yUp - 6);
        ctx.fillText('−THRESHOLD', warmupX + 8, yDn + 14);
      }

      // warmup boundary
      ctx.strokeStyle = visibleEnd >= WARMUP ? (getCSSVar('--accent-2') || '#24f7f7') : inkRGBA(0.25);
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(warmupX, 0); ctx.lineTo(warmupX, H);
      ctx.stroke();
      ctx.setLineDash([]);

      // warmup label — rotated vertically inside the now-narrow calibration strip
      ctx.save();
      ctx.translate(15, H / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = inkRGBA(0.5);
      ctx.font = '500 10px "Geist Mono", ui-monospace, monospace';
      ctx.fillText('CALIBRATION · 1,700 SAMPLES', 0, 0);
      ctx.restore();
      ctx.fillStyle = inkRGBA(0.45);
      ctx.fillText('DETECTION', warmupX + 12, 18);

      // determine alert state
      const alertActive = visibleEnd >= ALERT_AT;
      // signal path: draw up to visibleEnd
      // we segment so the post-alert region renders in accent
      const end = Math.min(visibleEnd, TOTAL);

      // base path (pre-alert portion)
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = getCSSVar('--ink') || '#14110d';
      ctx.beginPath();
      let started = false;
      const splitIdx = alertActive ? ALERT_AT : end;
      for (let i = 0; i < Math.min(end, splitIdx); i++) {
        const [x, y] = project(i, samples[i]);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // post-alert path in accent
      if (alertActive) {
        ctx.strokeStyle = getCSSVar('--accent') || '#d97a2c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        let s2 = false;
        for (let i = ALERT_AT; i < end; i++) {
          const [x, y] = project(i, samples[i]);
          if (!s2) { ctx.moveTo(x, y); s2 = true; }
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // alert marker
        const [xa, ya] = project(ALERT_AT, samples[ALERT_AT]);
        ctx.fillStyle = getCSSVar('--accent') || '#d97a2c';
        ctx.beginPath();
        ctx.arc(xa, ya, 4, 0, Math.PI * 2);
        ctx.fill();
        // pulse ring
        const pulse = (Date.now() % 1200) / 1200;
        ctx.strokeStyle = `oklch(0.68 0.17 50 / ${1 - pulse})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(xa, ya, 4 + pulse * 22, 0, Math.PI * 2);
        ctx.stroke();

        // event label — flips to the left of the spike when near the right edge
        const lblY = Math.max(16, ya - 16);
        const nearRight = xa > W - 170;
        const lblX = nearRight ? xa - 10 : xa + 10;
        ctx.textAlign = nearRight ? 'right' : 'left';
        ctx.fillStyle = getCSSVar('--ink') || '#14110d';
        ctx.font = '500 11px "Geist Mono", ui-monospace, monospace';
        ctx.fillText('ANOMALY DETECTED', lblX, lblY);
        ctx.fillStyle = inkRGBA(0.55);
        ctx.font = '500 10px "Geist Mono", ui-monospace, monospace';
        ctx.fillText('SCORE > THRESHOLD', lblX, lblY + 14);
        ctx.textAlign = 'left';
      }

      // moving cursor at the head of the wave
      if (end > 0 && end < TOTAL) {
        const [cx, cy] = project(end - 1, samples[end - 1]);
        const inWarmup = end < WARMUP;
        ctx.fillStyle = alertActive
          ? (getCSSVar('--accent') || '#fe7e1e')
          : (inWarmup ? (getCSSVar('--accent-2') || '#24f7f7') : (getCSSVar('--ink') || '#14110d'));
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // border
      ctx.strokeStyle = inkRGBA(0.18);
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    }

    function updateLabels(visibleEnd) {
      const inWarmup = visibleEnd < WARMUP;
      const alertActive = visibleEnd >= ALERT_AT;
      if (labelEls.phase) {
        labelEls.phase.textContent = inWarmup ? 'LEARNING' : (alertActive ? 'ANOMALY' : 'DETECTING');
        labelEls.phase.dataset.state = inWarmup ? 'learn' : (alertActive ? 'alert' : 'detect');
      }
      if (labelEls.sample) {
        labelEls.sample.textContent = String(Math.min(visibleEnd, TOTAL)).padStart(4, '0');
      }
      if (labelEls.threshold) {
        labelEls.threshold.textContent = threshold > 0 ? '±' + threshold.toFixed(3) : '—';
      }
      if (labelEls.state) {
        labelEls.state.textContent = inWarmup ? 'CALIBRATING' : (alertActive ? 'ALERT' : 'NOMINAL');
        labelEls.state.dataset.state = inWarmup ? 'learn' : (alertActive ? 'alert' : 'ok');
      }
      if (labelEls.score && visibleEnd > 0) {
        const v = samples[Math.min(visibleEnd, TOTAL) - 1];
        labelEls.score.textContent = (Math.abs(v)).toFixed(3);
      }
    }

    function getCSSVar(name) {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    // tweak hook
    window.__flynnWave = {
      setSpeed: (v) => { speed = Math.max(1, Math.min(80, v)); },
    };

    requestAnimationFrame(step);
  }
})();
