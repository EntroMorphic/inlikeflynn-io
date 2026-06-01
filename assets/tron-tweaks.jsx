/* Flynn — "Living Circuit" tweaks.
   Controls: headline display font, glow intensity, void motion, scope speed.
*/

const TRON_DEFAULTS = Object.assign({
  headlineFont: "Orbitron",
  glow: 1,
  motion: true,
  speed: 6,
  sfx: true,
  music: true,
}, window.FLYNN_TWEAK_DEFAULTS || {});

const FONT_STACKS = {
  Orbitron: { stack: '"Orbitron", sans-serif', track: "0.005em", weight: "600" },
  Michroma: { stack: '"Michroma", sans-serif', track: "0.0em", weight: "400" },
  "Chakra Petch": { stack: '"Chakra Petch", sans-serif', track: "0.005em", weight: "600" },
  Geist: { stack: '"Geist", sans-serif', track: "-0.03em", weight: "500" },
};

function TronTweaks() {
  const [t, setTweak] = useTweaks(TRON_DEFAULTS);

  // headline display font
  React.useEffect(() => {
    const f = FONT_STACKS[t.headlineFont] || FONT_STACKS.Orbitron;
    const root = document.documentElement.style;
    root.setProperty("--font-display", f.stack);
    document.querySelectorAll(".h-display, .h1, .brand").forEach((el) => {
      el.style.letterSpacing = f.track;
      el.style.fontWeight = f.weight;
    });
  }, [t.headlineFont]);

  // glow intensity
  React.useEffect(() => {
    document.documentElement.style.setProperty("--glow", String(t.glow));
  }, [t.glow]);

  // void motion
  React.useEffect(() => {
    if (window.__tronFx && window.__tronFx.setMotion) window.__tronFx.setMotion(t.motion);
    if (window.__gridVoid && window.__gridVoid.setMotion) window.__gridVoid.setMotion(t.motion);
  }, [t.motion]);

  // tracer sound
  React.useEffect(() => {
    if (window.__gridVoid && window.__gridVoid.setSfx) window.__gridVoid.setSfx(t.sfx);
  }, [t.sfx]);

  // game music
  React.useEffect(() => {
    if (window.__gridVoid && window.__gridVoid.setMusic) window.__gridVoid.setMusic(t.music);
  }, [t.music]);

  // scope speed
  React.useEffect(() => {
    if (window.__flynnWave && window.__flynnWave.setSpeed) window.__flynnWave.setSpeed(t.speed);
  }, [t.speed]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Headlines">
        <TweakSelect
          label="Display font"
          value={t.headlineFont}
          options={["Orbitron", "Michroma", "Chakra Petch", "Geist"]}
          onChange={(v) => setTweak("headlineFont", v)}
        />
      </TweakSection>

      <TweakSection label="Light">
        <TweakSlider
          label="Glow"
          value={t.glow}
          min={0}
          max={1.6}
          step={0.1}
          onChange={(v) => setTweak("glow", v)}
        />
        <TweakToggle
          label="Void motion"
          value={t.motion}
          onChange={(v) => setTweak("motion", v)}
        />
        <TweakToggle
          label="Tracer sound"
          value={t.sfx}
          onChange={(v) => setTweak("sfx", v)}
        />
        <TweakToggle
          label="Game music"
          value={t.music}
          onChange={(v) => setTweak("music", v)}
        />
      </TweakSection>

      <TweakSection label="Signal">
        <TweakSlider
          label="Scope speed"
          value={t.speed}
          min={2}
          max={16}
          step={1}
          unit=" spf"
          onChange={(v) => setTweak("speed", v)}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

(function mount() {
  const el = document.createElement("div");
  el.id = "__flynn-tweaks-root";
  document.body.appendChild(el);
  const root = ReactDOM.createRoot(el);
  root.render(<TronTweaks />);
})();
