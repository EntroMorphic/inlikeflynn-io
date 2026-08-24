# Changelog

All notable changes to inlikeflynn.io are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- **New whitepaper page — "Two Birds. One Stone."** (`pages/two-birds-one-stone.html`):
  LINK, Swift, and blind autonomy, with two supporting images (`assets/img/link-spacecraft.jpeg`,
  `assets/img/swift-observatory.jpg`). Added to `sitemap.xml`.
- **Grouped site nav.** `site-nav.js` now renders ordered link/dropdown groups: the
  whitepapers ("Equipment talks. Flynn listens." + "Two Birds. One Stone.") collapse into a
  **Whitepaper** dropdown, and Explore keeps its panel. Propagated across all pages with a
  cache bump to `20260822-0253`.
- **JSON-LD structured data** (`Organization` + `WebSite`) on `index.html`.

### Fixed
- **`scripts/bump-cache.mjs` skip-list gap:** the walker omitted `backups/`/`explorations/`,
  so the next cache-bump would have silently re-stamped archived rollback snapshots. Added
  them (plus `ziptest`, `dist`) to the exclusion list, matching CI's scope.
- Archived (never deleted) two orphaned assets: `assets/audio/sfx/fire-z-missiles.mp3`
  and `assets/svg/how-flynn-works.svg`, both confirmed unreferenced.
- Converted three images to WebP (canvas re-encode) — `flynn-scope.png` −87%,
  `screenshot-wide.png` −93%, `screenshot-narrow.png` −96% — wired into `why-flynn.html`
  and `site.webmanifest`. `og-flynn.png`/`icon-512.png` remain PNG pending a proper
  lossless-optimizer pass (outside this environment's toolset).
- **Vendored three.js (r149) locally** at `assets/js/three.min.js` and precached it in the
  service worker (`OFFLINE_URLS`, derived from `VERSION` so a cache bump keeps it in sync) —
  the volumetric grid now renders fully offline and the served site has **zero external
  `<script>` dependencies**. Replaced the `https://unpkg.com/three@0.149.0/...` tag (un-pinned,
  no SRI) on all 9 grid pages — `index`, `why-flynn`, `404`, and
  `pages/{whitepaper,validation,roadmap,industries,tiers,team}` — with the local `?v=`-tagged
  reference. (Red-team **TD2-1**: kills both the supply-chain/SRI gap and the offline gap.)
  The service worker now precaches the **full local app shell** (HTML + CSS + JS + nav/footer
  logo) with a fault-tolerant per-asset install, so the home page — **grid included** — renders
  on a cold offline launch; only Google Fonts and game audio defer to runtime caching.
- **Subresource Integrity on three.js.** All 9 `three.min.js` tags carry
  `integrity="sha384-RRHfJ6w…"`, so a tampered local copy is rejected by the browser
  (verified live: enforced, three still executes at `REVISION 149`). The hash is byte-keyed
  — `?v=` cache bumps stay valid; a three.js version upgrade must regenerate it (see `SECURITY.md`).
- `assets/css/infographic.css` — shared design-system atoms (timeline, ticker,
  masthead, divider, print color-adjust) extracted from the four one-pager
  infographics after measuring byte-identical rules (TD-1).
- `scripts/bump-cache.mjs` — one-command cache-version stamper for all `?v=`
  refs, the injected-URL `var V` constants, and the service-worker `VERSION` (TD-5).

### Changed
- **Retired the dead in-browser toolchain (red-team TD2-2).** Moved the old-landing snapshot
  `index_v1.html` and its only dependencies (`tweaks-panel.jsx` / `tron-tweaks.jsx`) into
  `backups/` — **never deleted** — removing the last referrer of the React +
  `@babel/standalone` CDN scripts from the served tree. Added `Disallow: /backups/` to
  `robots.txt` and `noindex` to the archived snapshot so it is no longer publicly indexable.
  Net with TD2-1: production loads no React, Babel, or JSX, and no external scripts at all.
- **Scoped CI to the deployed surface.** The link (lychee) and cache-version checks now exclude
  `backups/` and `explorations/` — archived rollback snapshots carry their own historical `?v=`
  tags and root-relative paths, and dev scratch isn't shipped; linting them as live pages tripped
  the uniformity + broken-link checks.
- **Tech-debt remediation pass (see `docs/TECH-DEBT.md`):**
  - TD-1: deduped the genuinely-shared infographic CSS into `infographic.css`
    (only the 44 identical rules; each artifact keeps its tuned CSS inline).
  - TD-2: merged continuous-page print into the main infographics and **deleted
    `flynn-overview-print.html` + `flynn-overview-bd-print.html`**; `case-for-flynn`
    now sizes its print page dynamically instead of a hard-coded height.
  - TD-3/TD-6: nav, footer, and install button confirmed single-source; dead
    `.nav*` / `.wf-*` rules removed.
  - TD-4: per-page `<head>` SEO meta kept static by design (documented).
- Unified the asset cache version to `20260609-0100`.
- **Service worker (`sw.js`) + registration (`assets/js/sw-register.js`)** — makes
  the site meet Android/Chrome's installability criteria so phones mint a real
  installed app (WebAPK) instead of a permission-gated home-screen shortcut (fixes
  install stalling on Samsung/Android), and adds a light offline shell on Android
  & iOS. Caching is designed around the existing `?v=` busting: network-first for
  HTML, cache-first for versioned assets, with a version-keyed cache that
  self-cleans on activate. Registered at root scope from every page; degrades
  silently where unsupported.
- **iOS install accommodations** — the install popover now shows an inline Share
  glyph and Safari-specific "tap Share → Add to Home Screen" guidance (iOS has no
  programmatic install prompt). Pairs with the existing `apple-mobile-web-app-*`
  meta tags and `apple-touch-icon` for a clean standalone launch.
- **Flynn Overview** — a boardroom one-pager infographic (`flynn-overview.html`):
  problem → on-device detection
  → "one binary, many worlds" → lifecycle → proof (with the live detection scope)
  → market value. Refined-Tron, orange reserved for moments of value, auto-fit print.
- Echoed the **Install** control (floating bloom emblem + PWA flow) into the site
  **footer**, under the brand tagline — same `[data-install]` the script auto-wires.
- `CNAME` (`inlikeflynn.io`) and `.nojekyll` for GitHub Pages custom-domain serving.

### Changed
- Trimmed the empty padding from the logo (`flynn-logo.png`, mandala was inset
  ~33%) so it fills its box in the nav/footer/masthead, and regenerated the icon
  set from it: favicons (16/32), apple-touch-icon (180), and PWA maskable icons
  (192/512, with a proper safe zone).
- **Top navigation is now a single source of truth** (`assets/js/site-nav.js`),
  injected into a `<header id="site-nav">` mount on every page. Reduced the
  primary links to Why Flynn / Whitepaper / Tiers and moved Validation /
  Industries / Roadmap into an **"Explore" dropdown** styled after the INSTALL
  modal + the now-playing music card (dark cyan-bordered panel, orange→cyan
  accent bar, mono eyebrow). Added a Liquid.ai-style **sliding highlight** that
  follows the cursor and rests on the current page; the dropdown opens on hover
  (desktop) / tap (touch), and surfaces the active sub-page. Auto-detects the
  current page; depth-aware links.
- **Footer is now a single source of truth.** Extracted the canonical footer
  (index.html's) into `assets/js/site-footer.js`, which injects depth-aware markup
  into a `<footer id="site-footer">` mount on every page (index, all `pages/*`, and
  why-flynn). One edit now updates the footer everywhere. The themed pages keep
  their `<canvas id="grid-bg">` for tron-fx; why-flynn carries the footer CSS inline.
- Fixed a pre-existing ~22px horizontal scroll from the nav Install gem's oversized
  bloom canvas (`overflow-x: clip` on html/body).
- **Delivery model corrected across the site: Flynn ships as a compiled binary for
  the customer's hardware, not as source.** Reconciled every "ships as one
  human-readable C source file / Source files: 1 / auditable line-by-line" claim
  (whitepaper, index, validation, industries, industries-print, roadmap).
  Auditability re-grounded as *auditable by construction* — deterministic +
  verifiable against published test vectors + certification-ready artifacts, with
  full source available to certifying authorities under NDA / escrow.
- Renamed the install instructions modal header to **"INSTALL inlikeflynn.io"**.
- Disabled the hidden game on the 404 page (it half-launched against the wrong DOM)
  and made the 404 auto-start the synthwave + now-playing card on first interaction
  (autoplay-safe, falls back to first tap/click/keypress). Removed the 404's
  "type FLYNN" hint. New `noGame` / `autoMusic` flags in `grid-void.js`.
- Bumped the asset cache version to `20260608-2030` (also the service worker's
  cache `VERSION`).

### Removed
- `Flynn.pptx` (a fresh deck will be authored separately).

## [1.0.0] — 2026-06-04

First versioned release. Establishes the canonical site and a professional repo
baseline.

### Added
- A **floating three.js bloom emblem** beside a new **INSTALL** link in the nav
  (after Tiers): a neon wireframe "anomaly core" (nested counter-rotating
  icosahedra + a hot center) rendered on a transparent canvas through a hand-rolled
  UnrealBloom-style post pipeline (scene → blurred mip levels → additive
  composite), so it glows and appears to float freely next to the label. Energizes
  on hover/focus — faster spin, cyan→anomaly-orange, stronger bloom. Wired to the
  real PWA `beforeinstallprompt` flow via `assets/js/install-button.js`. Degrades
  gracefully — no WebGL falls back to a glowing CSS hexagon glyph; on iOS/Firefox
  (no prompt event) it shows plain-language "Add to Home Screen" instructions; once
  installed it hides itself. Respects `prefers-reduced-motion`; hidden in
  standalone (installed) mode.
- Social/SEO metadata on every page: Open Graph + Twitter Card tags, per-page
  meta descriptions, canonical URLs, and a branded 1200×630 share image.
- Favicons (16/32/180) and PWA icons (192/512) + `site.webmanifest`, including a
  plain-spoken install `description` and preview `screenshots` so the browser's
  install dialog clearly explains what installing does (no dark patterns).
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
