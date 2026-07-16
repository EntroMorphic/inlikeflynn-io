/* Three layout directions for "How Flynn Works".
   Uses shared nodes from hfw-shared.jsx. cyan = healthy signal in;
   amber = Flynn's detection routed out + the closed-loop action back to the pump. */
const { PumpNode, SensorTag, FlynnNode, Consumer } = window;

/* defs: arrowheads + a reusable connector (faint base + flowing dash + packet) */
function Defs() {
  return (
    <defs>
      <marker id="ar-cy" markerWidth="9" markerHeight="9" refX="6.5" refY="4" orient="auto">
        <path d="M0 0 L8 4 L0 8 Z" fill="#4fd6e8" />
      </marker>
      <marker id="ar-am" markerWidth="9" markerHeight="9" refX="6.5" refY="4" orient="auto">
        <path d="M0 0 L8 4 L0 8 Z" fill="#ff9d3c" />
      </marker>
    </defs>
  );
}
function Flow({ d, amber, dur = 1.9, packet = true, arrow = true }) {
  const col = amber ? '#ff9d3c' : '#4fd6e8';
  return (
    <g>
      <path d={d} fill="none" stroke={col} strokeWidth="2.5" opacity="0.18" />
      <path d={d} fill="none" stroke={col} strokeWidth="2.5"
        className={amber ? 'flow-amber' : 'flow'} markerEnd={arrow ? `url(#${amber ? 'ar-am' : 'ar-cy'})` : undefined} />
      {packet && (
        <circle r="3.5" fill={col} opacity="0.95">
          <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={d} />
        </circle>
      )}
    </g>
  );
}
/* a small live waveform drawn along a horizontal/vertical signal run */
function WaveLabel({ x, y, text, color = 'var(--cyan)' }) {
  return <div className="node tag" style={{ left: x, top: y, color, fontSize: 9.5 }}>{text}</div>;
}

/* ============================ A — HORIZONTAL PIPELINE ============================ */
function DirA() {
  return (
    <div className="stage" style={{ width: 1180, height: 660 }}>
      <svg className="connectors" viewBox="0 0 1180 660"><Defs />
        <Flow d="M196 332 H466" />
        <Flow d="M632 332 C726 332 742 150 826 150" dur={2.1} />
        <Flow d="M642 332 H826" dur={1.7} />
        <Flow d="M632 332 C726 332 742 527 826 527" dur={2.3} />
        <Flow d="M992 566 C992 612 992 624 940 624 H156 C118 624 110 600 110 560 L110 446" amber dur={2.6} />
      </svg>
      <PumpNode x={26} y={232} />
      <WaveLabel x={250} y={300} text="VIBRATION · CURRENT · 1 kHz" />
      <FlynnNode x={476} y={252} size={160} />
      <WaveLabel x={250} y={362} text="raw telemetry →" color="var(--mid)" />
      <Consumer x={826} y={70} kind="human" />
      <Consumer x={826} y={252} kind="dash" />
      <Consumer x={826} y={452} kind="plc" />
      <div className="node tag" style={{ left: 360, top: 600, color: 'var(--amber)' }}>REAL-TIME ACTION · CLOSED LOOP</div>
    </div>
  );
}

/* ============================ B — RADIAL HUB ============================ */
function DirB() {
  return (
    <div className="stage" style={{ width: 1100, height: 980 }}>
      <svg className="connectors" viewBox="0 0 1100 980"><Defs />
        <Flow d="M212 492 H452" />
        <Flow d="M624 470 C690 392 706 250 760 214" dur={2.1} />
        <Flow d="M648 492 H760" dur={1.7} />
        <Flow d="M624 514 C690 592 706 730 760 766" dur={2.3} />
        <Flow d="M884 866 C560 1004 150 936 96 610 C90 566 100 552 132 552" amber dur={3.0} />
      </svg>
      <PumpNode x={44} y={392} />
      <FlynnNode x={462} y={402} size={176} />
      <WaveLabel x={250} y={462} text="VIBRATION · CURRENT →" />
      <Consumer x={760} y={120} kind="human" />
      <Consumer x={760} y={402} kind="dash" />
      <Consumer x={760} y={690} kind="plc" />
      <div className="node tag" style={{ left: 250, top: 858, color: 'var(--amber)', width: 320 }}>REAL-TIME ACTION · CLOSED LOOP BACK TO PUMP</div>
    </div>
  );
}

/* ============================ C — VERTICAL DESCENT ============================ */
function DirC() {
  return (
    <div className="stage" style={{ width: 760, height: 1320 }}>
      <svg className="connectors" viewBox="0 0 760 1320"><Defs />
        <Flow d="M380 256 V464" dur={1.6} />
        <Flow d="M380 716 C300 786 138 800 138 898" dur={2.2} />
        <Flow d="M380 716 V898" dur={1.7} />
        <Flow d="M380 716 C460 786 622 800 622 898" dur={2.2} />
        <Flow d="M622 1052 C702 1052 712 1024 712 974 V300 C712 206 690 150 470 146" amber dur={3.2} />
      </svg>
      <PumpNode x={296} y={44} />
      <WaveLabel x={398} y={330} text="VIBRATION · CURRENT · 1 kHz" />
      <FlynnNode x={300} y={476} size={160} />
      <div className="node tag" style={{ left: 300, top: 690, color: 'var(--cyan)', width: 200, textAlign: 'center' }}>VERDICT ROUTED →</div>
      <Consumer x={20} y={902} w={230} kind="human" />
      <Consumer x={266} y={902} w={230} kind="dash" />
      <Consumer x={512} y={902} w={230} kind="plc" />
      <div className="node tag" style={{ left: 470, top: 1110, color: 'var(--amber)', width: 260 }}>REAL-TIME ACTION ↑ CLOSED LOOP</div>
    </div>
  );
}

Object.assign(window, { DirA, DirB, DirC });
