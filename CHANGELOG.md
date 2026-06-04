# Changelog

All notable changes to inlikeflynn.io are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-06-04

First versioned release. Establishes the canonical site and a professional repo
baseline.

### Added
- Social/SEO metadata on every page: Open Graph + Twitter Card tags, per-page
  meta descriptions, canonical URLs, and a branded 1200×630 share image.
- Favicons (16/32/180) and PWA icons (192/512) + `site.webmanifest`.
- `robots.txt`, `sitemap.xml`, and a branded `404.html`.
- Keyboard activation (Enter/Space) and a focus ring for the game-over buttons;
  `role="dialog"` on the game-over screen; site-wide `:focus-visible` styles.
- Repo hygiene: `LICENSE` (proprietary), `CONTRIBUTING.md`, `SECURITY.md`,
  `CODEOWNERS`, `.editorconfig`, `.gitignore`, and a CI workflow that checks
  links and cache-tag consistency.

### Changed
- Restructured `assets/` into `css/`, `js/`, `img/`, and `audio/{music,sfx}/`;
  updated every reference (HTML + the game's internal path resolution).
- Optimized the navigation logo (500×500 → 256×256, 256 KB → 73 KB).
- Footer "Company" links now resolve (About → whitepaper `#about`, Contact email)
  — removed the dead `#` placeholders (Press / Trademark / Legal).
- Bumped the asset cache version to `20260604-1530`.

### Fixed
- Game-over **Continue / Main Menu** buttons were dead on touch devices: the
  global `touchstart` handler called `preventDefault()` on the SVG
  `<g role="button">` buttons (its exclusion selector only matched real
  `<button>`/`<a>`), suppressing the synthesized tap-click. Added
  `.svgo-btn, [role="button"]` to the exclusion. Desktop was unaffected.

### Removed
- Stale `Flynn-site/` snapshot (superseded by the canonical root).
- Orphaned `assets/flynn-logo.jpg` and `assets/tweaks.jsx`.
