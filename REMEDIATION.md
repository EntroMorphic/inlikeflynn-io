# Flynn Site — Remediation Plan

> Tracking doc for issues surfaced in the project audit (June 2026).
> Canonical source is the **repo root**. `Flynn-site/` is a stale snapshot (see HK-1).
>
> **Status legend:** `[ ]` todo · `[~]` in progress · `[x]` done
> **Priority:** 🔴 high · 🟡 medium · 🟢 low
> **Effort:** S (<1h) · M (half-day) · L (multi-day)

---

## Summary

> **✅ Remediated to v1.0.0 on 2026-06-04.** All items below are complete except
> **HK-5**, which was resolved on **2026-06-18** — not by precompiling the Tweaks
> panel, but by **removing it from production entirely** (see HK-5 note). See
> [`CHANGELOG.md`](CHANGELOG.md) for the shipped change set and
> [`docs/AUDIT.md`](docs/AUDIT.md) for the audit record.

| ID | Item | Priority | Effort | Status |
|----|------|----------|--------|--------|
| SEO-1 | Open Graph + Twitter Card meta on all pages | 🔴 | M | [x] |
| SEO-2 | Per-page `<meta name="description">` | 🟡 | S | [x] |
| SEO-3 | Favicon + canonical links | 🟡 | S | [x] |
| SEO-4 | `sitemap.xml` + `robots.txt` (+ `404.html`) | 🟢 | S | [x] |
| HK-1 | Remove stale `Flynn-site/` snapshot | 🟢 | S | [x] |
| HK-2 | Remove orphaned `flynn-logo.jpg` | 🟢 | S | [x] |
| HK-3 | Optimize nav logo (255 KB → 73 KB) | 🟢 | S | [x] |
| HK-4 | Resolve footer placeholder links | 🟢 | M | [x] |
| HK-5 | Precompile Babel / Tweaks for production | 🟢 | M | [x] resolved — panel removed |
| HK-6 | Remove orphaned `assets/tweaks.jsx` | 🟢 | S | [x] |
| DEC-1 | Tweaks panel home-only or site-wide? | 🟡 | S | [x] moot — panel removed |
| A11Y-1 | Accessibility pass (contrast, headings, kbd) | 🟢 | M | [x] |
| REPO | Professional-grade GitHub repo shape | 🟡 | L | [x] |

**HK-5 resolution (2026-06-18):** rather than hand-transpile or add a build step,
the Tweaks panel was **removed from the production home page**. Its four defaults
(Orbitron headline, glow 1.2, motion on, scope speed 22) are baked in statically in
`index.html` (a `<style>` block + `window.FLYNN_WAVE_SPEED`), so the page renders
identically with no React, no in-browser Babel, and a clean console. The
`tweaks-panel.jsx` / `tron-tweaks.jsx` modules and the `index_v1.html` rollback
snapshot have since been moved into `backups/` (out of the served tree; see the
2026-06-21 follow-up in `docs/TECH-DEBT.md`).

### ✅ Verified healthy (no action needed)
- **Reduced-motion is correctly handled** — `grid-void.js`, `tron-fx.js`, and `tron.css` all honor `prefers-reduced-motion: reduce` (grid, ribbons, and marquee calm down). Confirmed during audit.
- **Game-over screen buttons** — *fixed* (see Fix Log below).

### ✅ Verified healthy (no action needed)
- **Reduced-motion is correctly handled** — `grid-void.js`, `tron-fx.js`, and `tron.css` all honor `prefers-reduced-motion: reduce` (grid, ribbons, and marquee calm down). Confirmed during audit.
- **Game-over screen buttons** — *fixed* (see Fix Log below).

---

## 🔴 SEO-1 — Social / Open Graph metadata
**Why:** No OG or Twitter Card tags exist on any page. Links pasted into Slack,
LinkedIn, iMessage, and email render bare — the highest-value gap for a B2B site
that gets shared by URL.

- [ ] Author a 1200×630 share image (`assets/og-flynn.png`) — Tron hero lockup + tagline
- [ ] Add to **every** page `<head>`:
  - [ ] `og:title`, `og:description`, `og:type`, `og:url`, `og:image`, `og:image:alt`
  - [ ] `twitter:card` (`summary_large_image`), `twitter:title`, `twitter:description`, `twitter:image`
- [ ] Page-specific `og:title` / `og:description` (not all identical to the home page)
- [ ] Verify with a card validator (LinkedIn Post Inspector / X Card Validator)

**Acceptance:** Pasting any page URL into Slack shows the share image, title, and description.

---

## 🟡 SEO-2 — Per-page meta descriptions
**Why:** Only `index.html` has a `<meta name="description">`. The other six pages
ship without one, so search engines scrape arbitrary body text.

- [ ] `pages/whitepaper.html`
- [ ] `pages/validation.html`
- [ ] `pages/industries.html`
- [ ] `pages/roadmap.html`
- [ ] `pages/tiers.html`
- [ ] `pages/industries-print.html`

**Acceptance:** Each page has a unique, ≤155-char description reflecting its content.

---

## 🟡 SEO-3 — Favicon + canonical
**Why:** No favicon, no `rel="canonical"` anywhere. Browser tabs show a blank glyph;
canonical avoids duplicate-content ambiguity.

- [ ] Generate favicon set from the Flynn mark (`.ico`, 32px, 180px apple-touch, SVG)
- [ ] Add `<link rel="icon">` + `<link rel="apple-touch-icon">` to all pages
- [ ] Add `<link rel="canonical">` with the absolute URL per page
- [ ] (Optional) `site.webmanifest` for installability

---

## 🟢 SEO-4 — sitemap.xml + robots.txt
- [ ] `sitemap.xml` listing all 6 public pages
- [ ] `robots.txt` (allow all; reference sitemap; disallow `Flynn-site/` if it stays)

---

## 🟢 HK-1 — Remove stale `Flynn-site/` snapshot
**Why:** Full duplicate of the site (its own `grid-void.js`, old `.jpg` logo, no
cache tags). README marks it reference-only, but it's a foot-gun for editing the
wrong file.

- [ ] Confirm nothing unique lives only in `Flynn-site/`
- [ ] Delete the directory
- [ ] Update README structure section to drop the `Flynn-site/` line

---

## 🟢 HK-2 — Remove orphaned `flynn-logo.jpg`
**Why:** Canonical pages all use `flynn-logo.png`. The `.jpg` is referenced only by
the stale snapshot + README.

- [ ] Delete `assets/flynn-logo.jpg` (after HK-1)
- [ ] Update README structure section

---

## 🟢 HK-3 — Optimize nav logo
**Why:** `flynn-logo.png` is 255 KB at 500×500 but displays ~40px in the nav.

- [ ] Export a nav-sized PNG (e.g. 96px @2x) or compress the source
- [ ] Keep a full-res master for the OG image / print
- [ ] Re-stamp cache version on the asset

---

## 🟢 HK-4 — Footer placeholder links
**Why:** `Press`, `Trademark`, `Legal` point to `#` on every page; `About
EntroMorphic` routes to the whitepaper.

- [ ] Decide: build stub pages, link external, or remove until ready
- [ ] If removing, drop the list items rather than leaving dead `#` anchors
- [ ] Point `About EntroMorphic` at a real about target (or relabel)

---

## 🟡 DEC-1 — Tweaks panel: home-only or site-wide?
**Why:** Only `index.html` loads React/Babel + the Tweaks panel. The 6 sub-pages
don't, so font/glow/motion tweaks silently don't exist off the home page.
**This decision scopes HK-5.**

- [ ] Decide intent:
  - [ ] **Home-only (intentional):** keep sub-pages lean; HK-5 only touches `index.html`. Document the choice in the README.
  - [ ] **Site-wide:** add the panel + defaults block to all sub-pages (then HK-5 precompile covers all).

---

## 🟢 HK-6 — Remove orphaned `assets/tweaks.jsx`
**Why:** The live Tweaks pair is `tweaks-panel.jsx` + `tron-tweaks.jsx`. The older
`tweaks.jsx` (different accent-array defaults shape) isn't referenced by any
canonical page — dead code that will confuse the next reader.

- [ ] Confirm no page references `tweaks.jsx`
- [ ] Delete `assets/tweaks.jsx`

---

## 🟢 A11Y-1 — Lightweight accessibility pass
**Why:** Motion, alt text, and structure check out, but a full pass wasn't done.

- [ ] WCAG AA contrast sweep (cyan/orange on dark — verify mono labels & ghost buttons)
- [ ] Heading-order check (no skipped levels) across all pages
- [ ] Keyboard activation for the game-over SVG buttons (Enter/Space — they're `role="button"` but key-activation isn't wired)
- [ ] Visible focus states on nav + CTAs

---

## 🟢 HK-5 — Precompile Babel / Tweaks for production  ✅ RESOLVED (panel removed)
**Why:** In-browser Babel transpiled the React Tweaks panel on every home-page load
— a perf and console-warning cost.

- [x] **Resolved 2026-06-18 by removing the panel from production** (not by
      precompiling). Defaults baked in statically; React + Babel + the two
      `text/babel` script tags deleted from `index.html`. In-browser Babel dev
      warning and the JSX sourcemap 404s are gone; home-page console is clean of
      site-attributable output.

---

## 🟡 REPO — Professional-grade GitHub repository
**Why:** Get the codebase into a state a new collaborator (or auditor) can clone,
understand, and deploy with zero tribal knowledge — and so releases are traceable.

### Directory structure
- [ ] Settle a canonical layout and document it in the README, e.g.:
  ```
  /                  # canonical site root (served by Pages)
    index.html
    pages/
    assets/
      css/   js/   img/   audio/{music,sfx}/
  docs/              # whitepaper sources, audit, this plan, ADRs
  .github/           # workflows, issue/PR templates
  ```
- [ ] Group `assets/` by type (`css/`, `js/`, `img/`, `audio/`) instead of flat
- [ ] Move dev-only `screenshots/` out of the deploy path (or `.gitignore` it)
- [ ] Decide fate of `uploads/` (source PDFs, raw audio) — move to `docs/source/` or LFS

### Versioning & releases
- [ ] Adopt **SemVer** and tag releases (`v1.0.0`, …)
- [ ] Add a `CHANGELOG.md` (Keep a Changelog format)
- [ ] Replace ad-hoc `?v=YYYYMMDD-HHMM` cache tags with a single build version constant,
      or generate them in a build/deploy step so they bump automatically
- [ ] Adopt **Conventional Commits** for readable history + automated changelogs

### Repo hygiene files
- [ ] `.gitignore` (OS cruft, editor dirs, `screenshots/`, build artifacts)
- [ ] `LICENSE` — confirm posture (proprietary vs. permissive); Flynn is trademarked, so likely **proprietary / all-rights-reserved** with explicit notice
- [ ] `README.md` — already strong; add badges, quick-start, deploy, and structure
- [ ] `CONTRIBUTING.md` — branch strategy, commit style, how to run locally
- [ ] `CODEOWNERS` — review ownership
- [ ] `SECURITY.md` — disclosure contact (`tripp@entromorphic.com`)
- [ ] `.editorconfig` — consistent whitespace/indentation
- [ ] Issue + PR templates under `.github/`

### CI / CD
- [ ] GitHub Actions: HTML/link-check + asset-exists check on PR
- [ ] (Optional) Lighthouse CI budget on PR (perf/SEO/a11y regressions)
- [ ] Formalize **GitHub Pages** deploy (branch or Actions); document custom domain + DNS for `inlikeflynn.io`
- [ ] Add cache-bump step to the deploy workflow so it never ships stale `grid-void.js`

### Branch protection & workflow
- [ ] Protect `main`: require PR + passing checks before merge
- [ ] Define branch naming (`feat/`, `fix/`, `chore/`)
- [ ] Document the release ritual (tag → changelog → deploy) in `CONTRIBUTING.md`

### Pages-specific
- [ ] Custom `404.html` at the root (GitHub Pages serves it on unknown paths)
- [ ] Confirm `CNAME` for `inlikeflynn.io` is committed if using a custom domain

**Acceptance:** A fresh clone + README quick-start gets a contributor to a running
local site and a clean PR in minutes; `main` is protected; releases are tagged and
changelogged.

---

## Fix Log

| Date | Item | Change |
|------|------|--------|
| 2026-06-04 | Game-over buttons dead on touch | `grid-void.js` — the global `touchstart` handler called `preventDefault()` on the SVG `<g role="button">` CONTINUE / MAIN MENU buttons (the exclusion selector only matched `<button>`, `<a>`, etc.), suppressing the synthesized tap-click on mobile. Added `.svgo-btn, [role="button"]` to the exclusion selector. Desktop was unaffected. **Note:** re-stamp the `?v=` cache tag on `grid-void.js` before deploy so mobile users get the fix. |

---

## Suggested sequencing

1. **Quick wins (1 pass):** SEO-1, SEO-2, SEO-3 across all pages + re-stamp cache.
2. **Cleanup:** HK-1, HK-2, HK-3 (delete duplicate, drop orphan, shrink logo).
3. **Repo professionalization (REPO):** structure + hygiene files + CI, ideally before
   the next external share or handoff.
4. **Follow-ups:** SEO-4, HK-4, HK-5 as time allows.
