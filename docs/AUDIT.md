# Site Audit — inlikeflynn.io

_Recorded 2026-06-04. Companion to [`/REMEDIATION.md`](../REMEDIATION.md), which tracks the fixes._

## Method

Full read of the canonical root (`index.html`, `pages/*.html`, `assets/*`),
cross-checked for: asset-reference integrity, cache-version uniformity, dead
links, SEO/social metadata, accessibility, and repo hygiene. Verified live in a
browser (console clean, render correct) and by fetch-probing asset paths.

## Verified healthy

- Renders cleanly; only console output is the in-browser Babel dev warning.
- All internal nav, footer, and cross-page anchors resolve; whitepaper TOC
  anchors all have targets.
- Every audio (SFX + music) and image asset resolves; game paths are
  script-relative and work from `/` and `/pages/*`.
- `prefers-reduced-motion` is honored in `grid-void.js`, `tron-fx.js`, and
  `tron.css` (grid, ribbons, marquee all calm down).

## Findings (all remediated in v1.0.0 — see CHANGELOG)

| Area | Finding |
|------|---------|
| SEO | No Open Graph / Twitter tags; sub-pages lacked meta descriptions; no favicon/canonical/sitemap/robots. |
| Bug | Game-over Continue / Main Menu buttons dead on touch (`touchstart` `preventDefault` suppressed the tap-click on SVG buttons). |
| Housekeeping | Stale `Flynn-site/` duplicate; orphaned `flynn-logo.jpg` + `tweaks.jsx`; 255 KB nav logo; dead footer `#` links; in-browser Babel. |
| Structure | Flat `assets/`; no `LICENSE`/`CONTRIBUTING`/`SECURITY`/CI/`.gitignore`. |
| A11y | No keyboard activation or focus rings for the SVG game-over buttons. |

## Known / deferred

- **Tweaks panel is home-only** by design (sub-pages stay lean) — documented in the README.
- **In-browser Babel** for the Tweaks panel remains; precompiling is deferred to a
  real build step rather than a hand-transpile (see README → "Production notes").
