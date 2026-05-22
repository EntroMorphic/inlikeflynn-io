/* Flynn — tweaks panel (mounts on landing page).
   Controls: accent color, scope speed, signal density, theme.
*/

const DEFAULTS = window.FLYNN_TWEAK_DEFAULTS || {
  accent: ["#d97a2c", "oklch(0.65 0.18 38)", "oklch(0.55 0.15 50)"],
  speed: 6,
  scopeMode: "Scope",
  density: "Medium",
  theme: "Dark",
};

function FlynnTweaks() {
  const [t, setTweak] = useTweaks(DEFAULTS);

  // apply theme (Dark / Light)
  React.useEffect(() => {
    const mode = (t.theme || "Dark").toLowerCase();
    if (mode === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [t.theme]);

  // apply accent color (first swatch in palette)
  React.useEffect(() => {
    const c = Array.isArray(t.accent) ? t.accent[0] : t.accent;
    if (!c) return;
    document.documentElement.style.setProperty("--accent", c);
    // derive a slightly darker "accent-deep" by reducing oklch L
    document.documentElement.style.setProperty("--accent-deep", c);
  }, [t.accent]);

  // apply scope speed
  React.useEffect(() => {
    if (window.__flynnWave && window.__flynnWave.setSpeed) {
      window.__flynnWave.setSpeed(t.speed);
    }
  }, [t.speed]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Theme">
        <TweakRadio
          label="Mode"
          value={t.theme}
          options={["Dark", "Light"]}
          onChange={(v) => setTweak("theme", v)}
        />
      </TweakSection>

      <TweakSection title="Accent">
        <TweakColor
          label="Signal color"
          value={t.accent}
          options={[
            ["#fe7e1e", "#24f7f7", "oklch(0.45 0.12 50)"],
            ["#d97a2c", "oklch(0.62 0.18 38)", "oklch(0.94 0.04 60)"],
            ["#2a6fdb", "oklch(0.55 0.18 250)", "oklch(0.94 0.04 250)"],
            ["#1f8a5b", "oklch(0.55 0.15 150)", "oklch(0.94 0.04 150)"],
            ["#b8451f", "oklch(0.5 0.16 30)", "oklch(0.93 0.04 30)"],
            ["#7c3aed", "oklch(0.5 0.2 290)", "oklch(0.93 0.05 290)"],
          ]}
          onChange={(v) => setTweak("accent", v)}
        />
      </TweakSection>

      <TweakSection title="Scope">
        <TweakSlider
          label="Speed"
          value={t.speed}
          min={2}
          max={16}
          step={1}
          unit=" spf"
          onChange={(v) => setTweak("speed", v)}
        />
        <TweakRadio
          label="Density"
          value={t.density}
          options={["Sparse", "Medium", "Dense"]}
          onChange={(v) => setTweak("density", v)}
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
  root.render(<FlynnTweaks />);
})();
