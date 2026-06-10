# inlikeflynn.io

Marketing site for **Flynn** — an embedded, self-calibrating anomaly detector for
industrial telemetry. *Equipment talks. Flynn listens.*

A static, dependency-light site with a custom Tron-flavored visual system — and a
fully playable arcade game hidden inside it.

![status](https://img.shields.io/badge/status-live-1f8a5b) ![license](https://img.shields.io/badge/license-proprietary-ff8a3a) ![build](https://img.shields.io/badge/build-no%20build%20step-47d8ff) ![hosting](https://img.shields.io/badge/hosting-GitHub%20Pages-555)

---

## Stack

- **Plain HTML/CSS** — no build step, no framework for the site itself.
- **three.js** — the volumetric "grid void" backdrop (`assets/js/grid-void.js`),
  shared across every page.
- **React + Babel (in-browser)** — only for the optional **Tweaks** panel
  (`assets/js/tron-tweaks.jsx`), which lets you live-adjust fonts, glow, and motion.
  Loaded on the home page only (see [Production notes](#production-notes)).
- **Google Fonts** — Geist / Geist Mono (body), Orbitron / Chakra Petch / Michroma
  (display), Share Tech Mono (UI/mono).

Everything loads from relative paths, so the site runs from any static host.

---

## Structure

```
index.html              Landing page
404.html                Branded not-found page (root-relative assets)
robots.txt              Crawl rules + sitemap pointer
sitemap.xml             Indexed pages
site.webmanifest        PWA manifest
pages/
  whitepaper.html       Technical whitepaper (with sticky table of contents)
  validation.html       Deployed-numbers / validation tables
  roadmap.html          Composable-architecture roadmap
  tiers.html            Engagement tiers
  industries.html       Industry applications
  industries-print.html Print-optimized variant (noindex)
assets/
  css/                  styles.css (core), tron.css (Tron/void + game HUD)
  js/                   grid-void.js (grid + hidden game), tron-fx.js,
                        hero-waveform.js, tweaks-panel.jsx, tron-tweaks.jsx
  img/                  flynn-logo.png, favicons, PWA icons, og-flynn.png
  audio/
    music/              In-game soundtrack (synthwave)
    sfx/                In-game sound effects
docs/                   Audit notes & architecture
.github/                CI workflow, issue/PR templates, CODEOWNERS
uploads/                Source material (PDFs, logos, raw audio) — local only, git-ignored
```

The **root** is canonical. Asset references are relative, so the site runs from
any static host; favicons/manifest and the 404 page use root-relative paths.

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
- Soundtrack: original synthwave by **entropywalker** (`assets/audio/music/`)
- SFX (`assets/audio/sfx/`): blaster + heavy blaster, missile launch/travel, target
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
version tag (e.g. `grid-void.js?v=20260604-1530`); bumping the tag forces a fresh
fetch. To re-stamp every page with a fresh timestamp version in one pass, ask
Claude to "bump the asset cache version" — it runs the stamping script across
`index.html`, `pages/*.html`, and `404.html`. Done right before committing, this
guarantees mobile users get the latest build with no action on their part. CI
fails if the `?v=` tags are not uniform across all HTML.

---

## Production notes

**Tweaks panel is home-page only.** Only `index.html` loads React/Babel + the
Tweaks panel; the sub-pages stay lean (no React payload). This is intentional —
the panel is a home-page affordance, not site chrome. To make it site-wide, add
the defaults block + the three `text/babel` script tags to each sub-page.

**In-browser Babel is deferred, not forgotten.** The Tweaks panel is transpiled in
the browser, which prints a dev warning and costs a little CPU on the home page.
Precompiling it to plain JS is worth doing — but as a real build step, not a
hand-transpile that could subtly break the live panel. Track it for whenever a
toolchain is introduced.

---

## Credits

- **Music:** entropywalker — *Neon Nights*, *Chasing the Mirage*, *Silent Cinema*
- **Design & build:** Flynn / inlikeflynn.io

*Get in like Flynn.* 🟧🟦
