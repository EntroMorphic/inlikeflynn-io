/* Shared visual primitives for the "How Flynn Works" layout directions.
   Each node is absolutely positioned by left/top (px) inside a fixed-size .stage.
   Healthy signal = cyan; Flynn's detection + action = amber. */

function Pos({ x, y, w, children, style }) {
  return (
    <div className="node" style={{ left: x, top: y, width: w, ...style }}>{children}</div>
  );
}

/* ---- Pump + embedded MCU running Flynn ---- */
function PumpNode({ x, y, w = 168 }) {
  return (
    <Pos x={x} y={y} w={w}>
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="tag">Centrifugal pump</span>
          <span className="led" id="pump-led"></span>
        </div>
        {/* simple pump glyph: volute + shaft */}
        <svg viewBox="0 0 140 96" style={{ width: '100%', marginTop: 8 }} aria-hidden="true">
          <circle cx="56" cy="52" r="34" fill="none" stroke="var(--ink-2)" strokeWidth="2.5"/>
          <circle cx="56" cy="52" r="7" fill="var(--cyan)"/>
          <g stroke="var(--mid)" strokeWidth="2">
            <line x1="56" y1="52" x2="56" y2="26"/>
            <line x1="56" y1="52" x2="79" y2="65"/>
            <line x1="56" y1="52" x2="33" y2="65"/>
          </g>
          <path d="M86 38 h24 v-12 h22 v52 h-22 v-12 h-24" fill="none" stroke="var(--ink-2)" strokeWidth="2.5"/>
          <rect x="6" y="44" width="14" height="16" fill="var(--mid)"/>
        </svg>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6, padding: '7px 9px', border: '1px solid var(--hair)', borderRadius: 7, background: 'rgba(79,214,232,0.06)' }}>
          <span style={{ width: 18, height: 18, borderRadius: 4, border: '1px solid var(--cyan-deep)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
            <span style={{ width: 8, height: 8, background: 'var(--cyan)', borderRadius: 1 }}></span>
          </span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.2 }}>MCU · Flynn<br/><span style={{ color: 'var(--mid)', fontSize: 9.5, letterSpacing: '0.08em' }}>8,480 B · BARE-METAL</span></span>
        </div>
      </div>
    </Pos>
  );
}

/* ---- The sensor tap (vibration / current) ---- */
function SensorTag({ x, y }) {
  return (
    <Pos x={x} y={y} w={150}>
      <div className="tag" style={{ color: 'var(--cyan)', fontSize: 9.5 }}>VIBRATION · CURRENT</div>
      <div className="tag" style={{ marginTop: 2, fontSize: 9 }}>1 kHz · on-die</div>
    </Pos>
  );
}

/* ---- Flynn core node ---- */
function FlynnNode({ x, y, size = 150 }) {
  return (
    <Pos x={x} y={y} w={size}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: 'radial-gradient(circle at 50% 40%, rgba(79,214,232,0.22), rgba(79,214,232,0.03) 70%)', border: '1px solid rgba(79,214,232,0.4)', boxShadow: '0 0 40px rgba(79,214,232,0.15), inset 0 0 24px rgba(79,214,232,0.08)' }}></div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <div style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: size > 150 ? 30 : 24, letterSpacing: '-0.02em', textShadow: '0 0 22px rgba(79,214,232,0.5)' }}>FLYNN</div>
          <div className="tag" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9.5 }}>
            <span className="led"></span>BASELINE LOCKED
          </div>
        </div>
      </div>
    </Pos>
  );
}

/* ---- Consumer cards with concrete payloads ---- */
function Consumer({ x, y, w = 320, kind }) {
  const map = {
    human: {
      icon: <path d="M11 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-7 2-7 5v2h14v-2c0-3-3-5-7-5Z" fill="var(--cyan)"/>,
      label: 'Technician',
      sub: 'SMS / push alert',
      body: (
        <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--amber-soft)', background: 'rgba(255,157,60,0.07)' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--amber)', display: 'flex', gap: 6, alignItems: 'center' }}><span className="led amber"></span>FLYNN ALERT</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 5, lineHeight: 1.4 }}>Pump 7B — bearing signature drifting. 17-day window. Schedule swap.</div>
        </div>
      ),
    },
    dash: {
      icon: <path d="M3 4h7v7H3V4Zm9 0h7v4h-7V4ZM3 13h7v4H3v-4Zm9-2h7v6h-7v-6Z" fill="var(--cyan)"/>,
      label: 'Dashboard',
      sub: 'SCADA / monitoring',
      body: (
        <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--hair)', background: 'rgba(0,0,0,0.25)' }}>
          <svg viewBox="0 0 180 44" style={{ width: '100%' }} aria-hidden="true">
            <line x1="0" y1="30" x2="180" y2="30" stroke="rgba(79,214,232,0.4)" strokeWidth="1" strokeDasharray="3 4"/>
            <path d="M0 31 q10 -2 20 0 t20 1 t20 -2 t20 1 t20 0 t20 -8 t20 -16" fill="none" stroke="var(--amber)" strokeWidth="2"/>
            <circle cx="160" cy="9" r="3" fill="var(--amber)"/>
          </svg>
          <div className="mono" style={{ fontSize: 10, color: 'var(--mid)', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}><span>HEALTH</span><span style={{ color: 'var(--amber)' }}>0.61σ → ALERT</span></div>
        </div>
      ),
    },
    plc: {
      icon: <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 4v3h3V7H7Zm0 5v3h3v-3H7Zm5-5v3h5V7h-5Z" fill="var(--cyan)"/>,
      label: 'PLC / controller',
      sub: 'Automated action',
      body: (
        <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--amber-soft)', background: 'rgba(255,157,60,0.07)' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--amber)' }}>&gt; CMD: throttle 100% → 60%</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 3 }}>&gt; derate &amp; flag for service</div>
        </div>
      ),
    },
  };
  const c = map[kind];
  return (
    <Pos x={x} y={y} w={w}>
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, flex: '0 0 auto' }}>{c.icon}</svg>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>{c.label}</div>
            <div className="tag" style={{ fontSize: 9.5, marginTop: 1 }}>{c.sub}</div>
          </div>
        </div>
        {c.body}
      </div>
    </Pos>
  );
}

Object.assign(window, { Pos, PumpNode, SensorTag, FlynnNode, Consumer });
