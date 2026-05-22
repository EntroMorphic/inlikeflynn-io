# Flynn — marketing site

Static marketing site for **Flynn**, an embedded, self-calibrating anomaly
detector for industrial telemetry (EntroMorphic).

> Telemetry talks. Flynn listens.

## Stack

Plain HTML + CSS + vanilla JS — no build step, no dependencies. The repo root
is the web root: `index.html` is the landing page.

> [!NOTE]
> React + Babel are loaded from a CDN **only** to power the dev-only "Tweaks"
> design panel (`assets/tweaks*.jsx`). The site itself needs none of it — strip
> those `<script>` tags and the tweak block from `index.html` for production.

## Structure

```
index.html              Landing page
assets/
  styles.css            Shared design tokens + base styles
  hero-waveform.js      Hero canvas animation (learn → detect → anomaly)
  tweaks.jsx            Dev panel config (accent / speed / density / theme)
  tweaks-panel.jsx      Dev panel UI components
  flynn-logo.jpg
pages/
  whitepaper.html       Full narrative
  validation.html       Benchmarks & reproduction
  industries.html       Verticals
  industries-print.html Print variant
  roadmap.html          Neuron → spinal cord → nervous system
  tiers.html            Engagement tiers
```

## Run locally

It's a static site — serve the repo root with anything:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Design system

Dark theme by default (`data-theme="dark"` on `<html>`), warm bone/ink palette.
Amber accent (`--accent`) is reserved for anomaly/alert moments; cyan
(`--accent-2`) is used for navigation and labels. Type: Geist + Geist Mono.
