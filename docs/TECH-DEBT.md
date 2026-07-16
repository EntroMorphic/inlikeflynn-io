# Tech-Debt Remediation — Tracking

_Companion to the Claude Code red-team (2026-06-08). Live, no-build, partly-portable site._

**Status:** `[ ]` todo · `[~]` in progress · `[x]` done

## Architectural decision (resolved)

**Owner chose (B) — full DRY**, with the deployment reality that the site is served
statically (GitHub Pages, no build): shared code lives in linked CSS/JS files that the
production server always has alongside the HTML. When a *single-file portable* copy is
needed (e-mail, offline share), run `super_inline_html` to bundle one HTML on demand —
that is the "inline step." So: DRY source + opt-in bundling, no permanent build pipeline.

## Items

| ID | Item | Resolution |
|----|------|------------|
| TD-1 | Dedup inline design-system CSS | `[x]` **Measured, not assumed.** The "~480-line shared design system" was an overestimate — of 122–217 rules per infographic, only **44 are byte-identical** across the BD-family (~4.4 KB); ~80% is intentionally tuned per artifact. Extracted exactly those 44 (timeline, ticker, masthead atoms, divider, print color-adjust) → `assets/css/infographic.css`, linked in all four infographics; each keeps its tuned CSS inline. All four verified pixel-identical after. |
| TD-2 | Collapse `-print.html` clones → `@media print` | `[x]` Merged the continuous-page print (dynamic `@page` sized on `beforeprint`, no auto-print) into the main files; **deleted `flynn-overview-print.html` and `flynn-overview-bd-print.html`**. `case-for-flynn` upgraded from a hard-coded `@page` height to the same dynamic sizing. PDF export now opens the main file. |
| TD-3 | Finish nav/footer/install component adoption | `[x]` Nav (`site-nav.js`), footer (`site-footer.js` + `site-footer.css`), and install button (`install-button.css` + `install-button.js`) are each single-source, loaded by every page incl. the standalone infographics. Orphaned `.nav*` / `.wf-*` CSS removed. |
| TD-4 | Shared `<head>` boilerplate | `[x]` **Kept per-page by design.** `<title>`, `description`, `canonical`, and OG/Twitter tags must be in the initial static HTML for SEO; JS-injection would hurt crawlability and flash. The residual shared boilerplate (charset/viewport/preconnect/favicons) is a few lines and not worth a fragile abstraction. Not debt. |
| TD-5 | Automate `?v=` cache stamping | `[x]` `scripts/bump-cache.mjs` — one command stamps every `?v=` in HTML, the `var V` in `site-nav.js`/`site-footer.js`, and the `VERSION` in `sw.js` to a fresh UTC timestamp (or an explicit arg). Documented in CONTRIBUTING. |
| TD-6 | Selectors defined in both CSS files | `[x]` Dead `.nav*/.nav-cta` removed (orphaned by the nav refactor). Remaining `.btn*/.h1/.brand*` overlaps are intentional `tron.css`-over-`styles.css` dark-theme overrides — confirmed and kept. |

## Done this pass
- Removed orphaned `.nav / .nav-inner / .nav-links / .nav-cta` rules from `styles.css` and
  `tron.css` (dead since nav → `site-nav.js`). 404 keeps its own self-contained `.nav`.
- Removed dead `.wf-nav / .wf-brand / .wf-links` rules from `why-flynn.html` (left over from
  its pre-shared nav).
- **INSTALL button is now single-source:** extracted its CSS to `assets/css/install-button.css`,
  linked in `<head>` on every page, and deleted the duplicate copies from `tron.css` and the
  `why-flynn` inline block. This also **fixed a stuck white→cyan transition** bug: the styles
  had briefly been JS-injected *after* the nav/footer rendered, which left the INSTALL label
  stuck white on the themed pages; a `<head>` stylesheet renders it correctly from first paint.
- **Fixed the why-flynn footer/nav font + dimness:** the shared components use Share Tech Mono,
  but why-flynn never imported it (fell back to Geist Mono — thinner/dimmer). Added Share Tech
  Mono to its font import. Also baked the footer logo glow (`mix-blend-mode + drop-shadow`) into
  `site-footer.css` so it no longer depended on tron.css.
- **Footer is now fully self-contained** (single source, environment-independent):
  - Lifted `#site-footer` above why-flynn's `.void-haze` overlay (`z-index: 2; isolation`)
    so the haze no longer darkened it.
  - Moved the animated `#grid-bg` "living circuit" backdrop into the component: `site-footer.js`
    injects the `<canvas>` if absent, `site-footer.css` styles it (`z-index:-1`, opaque base),
    and why-flynn now loads `tron-fx.js` to animate it. The footer no longer shows the page's
    3D grid-void through a transparent background — it renders identically everywhere.

---

## 2026-06-21 red-team follow-up (third-party JS)

| ID | Item | Resolution |
|----|------|------------|
| TD2-1 | `three.min.js` loaded from unpkg, un-pinned (no SRI), and absent from the SW precache → not truly offline | `[x]` **Vendored locally.** three r149 now ships at `assets/js/three.min.js` (608 KB, verified `THREE.REVISION === "149"`), referenced with a `?v=` tag on all 9 grid pages. The SW now precaches the **full local app shell** (HTML + CSS + JS + logo, derived from `VERSION`) with a fault-tolerant per-asset install, so the home page renders **grid-and-all on a cold offline launch**. Same-origin ⇒ SRI moot; zero external `<script>` deps. |
| TD2-2 | `index_v1.html` is the only referrer keeping the React + `@babel/standalone` + `*.jsx` toolchain alive, and is publicly indexable | `[x]` **Archived, not deleted.** `index_v1.html` + `tweaks-panel.jsx` + `tron-tweaks.jsx` moved to `backups/`; `Disallow: /backups/` added to `robots.txt` and `noindex` to the snapshot. Production now loads no React/Babel/JSX. Rollback: restore those three files to root (`index.html`, `assets/js/`) and run `scripts/bump-cache.mjs`. |

| TD2-3 | Vendored `three.min.js` could be tampered with locally (SRI moot for transport but not for integrity) | `[x]` **SRI added.** All 9 tags carry `integrity="sha384-RRHfJ6w…"` (verified live: browser enforces it and three still executes, `REVISION 149`). Hash is byte-keyed, so `?v=` bumps stay valid; a three.js **upgrade** must regenerate it (documented in `SECURITY.md`). |

_Note: the dated report `docs/TECH-DEBT-2026-06-21.md` referenced in the brief was not present in the repo; this follow-up records the resolution here alongside the original tracking._
