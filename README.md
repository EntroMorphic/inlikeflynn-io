# inlikeflynn.io

Marketing site for **Flynn** — an embedded, self-calibrating anomaly detector for
industrial telemetry. *Telemetry talks. Flynn listens.*

A static, dependency-light site with a custom Tron-flavored visual system — and a
fully playable arcade game hidden inside it.

---

## Stack

- **Plain HTML/CSS** — no build step, no framework for the site itself.
- **three.js** — the volumetric "grid void" backdrop (`assets/grid-void.js`),
  shared across every page.
- **React + Babel (in-browser)** — only for the optional **Tweaks** panel
  (`assets/tron-tweaks.jsx`), which lets you live-adjust fonts, glow, and motion.
- **Google Fonts** — Geist / Geist Mono (body), Orbitron / Chakra Petch / Michroma
  (display), Share Tech Mono (UI/mono).

Everything loads from relative paths, so the site runs from any static host.

---

## Structure

```
index.html              Landing page
pages/
  whitepaper.html       Technical whitepaper (with sticky table of contents)
  validation.html       Deployed-numbers / validation tables
  roadmap.html          Composable-architecture roadmap
  tiers.html            Engagement tiers
  industries.html       Industry applications
  industries-print.html Print-optimized variant
assets/
  styles.css            Core site styles
  tron.css              Tron/void + game HUD styles
  grid-void.js          three.js grid void + the hidden game engine
  tron-fx.js            Footer "living circuit" 2D effect
  hero-waveform.js      Hero waveform animation
  tron-tweaks.jsx       Tweaks panel (React)
  music/                In-game soundtrack (synthwave)
  sfx/                  In-game sound effects
  flynn-logo.jpg
Flynn-site/             Older standalone export snapshot (not the source of truth)
screenshots/            Working screenshots from the design process
uploads/                Source material (PDFs, logos, raw audio drops)
```

The **root** is canonical. `Flynn-site/` is an early deployable snapshot kept for
reference — edit the root files.

---

## The hidden game — CYBERSPACE ANOMALOIDS 🕹️

An easter-egg arcade game built into the grid-void engine. You *are* Flynn:
equipment faults fly in as tumbling neon wireframe craft, and you shoot them down
before they breach the threshold — a literal, playable version of the pitch.

**Unlock it (any page):**
- Type **`FLYNN`**, or
- The **Konami code** — ↑ ↑ ↓ ↓ ← → ← → B A

This opens a coin-op **attract / splash screen** ("INSERT 25 CENTS"). Click the
coin slot or press **Enter** to start.

**Controls**
- **Aim** — mouse / pointer (a targeting reticle locks onto craft and names the fault)
- **Fire** — click (hold to charge a heavier shot)
- **Death Blossom** — at a 12-combo it arms; press **SPACE** to unleash a homing
  **Itano-Circus missile swarm** that clears the field
- **Exit** — **ESC**

**Mechanics**
- Named equipment faults (`BEARING WEAR`, `CAVITATION`, `ARC FAULT`, …)
- Waves that ramp in speed and count
- Combo multiplier, score, and a `localStorage` high score
- **TANDEM SCAN** cyan power-up → 40% slow-mo
- Live **radar** plotting incoming anomalies; a **BREACH IMMINENT** alarm
- Asteroids-style wireframe shatter on every kill
- Full arcade HUD: framing brackets, scanline, radar sweep, readout modules

**Audio**
- Soundtrack: original synthwave by **entropywalker** (`assets/music/`)
- SFX (`assets/sfx/`): blaster + heavy blaster, missile launch/travel, target
  explosion, slow-mo sting. Sounds are decoded once and auto-trimmed of leading
  silence so shots fire instantly.
- Audio unlocks on first interaction (browser autoplay policy); a mute toggle
  lives in the HUD and in the Tweaks panel.

> The game's motion, fades, and audio require a **live, foreground browser tab** —
> backgrounded tabs freeze animation timelines.

---

## Run locally

It's static — serve the folder with anything:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` via `file://` mostly works, but a local server avoids any
fetch/CORS quirks with the audio buffers.)

## Deploy

Push to GitHub and enable **GitHub Pages** on the branch/root. All paths are
relative, so no extra configuration is needed. The site needs internet at runtime
for the three.js and Google Fonts CDNs.

### Cache-busting (do this before each deploy)

Mobile browsers cache `grid-void.js` / `tron.css` etc. hard, so returning visitors
can run stale code after an update. Every local asset reference carries a `?v=`
version tag (e.g. `grid-void.js?v=20260603-1936`); bumping the tag forces a fresh
fetch. To re-stamp every page with a fresh timestamp version in one pass, ask
Claude to "bump the asset cache version" — it runs the stamping script across
`index.html` and `pages/*.html`. Done right before committing, this guarantees
mobile users get the latest build with no action on their part.

---

## Credits

- **Music:** entropywalker — *Neon Nights*, *Chasing the Mirage*, *Silent Cinema*
- **Design & build:** Flynn / inlikeflynn.io

*Get in like Flynn.* 🟧🟦
