# Tech-Debt Red-Team — Code Duplication & Consolidation

_Recorded 2026-06-08. Companion to [`AUDIT.md`](AUDIT.md) and [`/REMEDIATION.md`](../REMEDIATION.md)._

> Focus: where the site duplicates code and where it can consolidate. **Analysis only —
> no code was changed.** Nothing here is a functional breakage; the live site renders
> clean and CI is green. This is maintainability debt.

## Method

Scripted parse of the canonical root (`index.html`, `404.html`, `why-flynn.html`,
`flynn-overview*.html`, `pages/*.html`, `assets/js/*`, `assets/css/*`): per-page inline
`<style>`/`<script>` accounting, `<head>` tag frequency, nav/footer component adoption,
byte-level rule-duplication across inline CSS, and pairwise page similarity
(`difflib.SequenceMatcher`). Counts are indicative, not exact — the CSS parser is crude
around nested `@media` blocks, and duplicate detection is byte-identical (a conservative
lower bound; near-identical rules with minor diffs are *not* counted).

## Scale

13 HTML files ≈ **8,700 lines**; JS/CSS ≈ 4,700 lines. A large fraction of the HTML is
copy-paste. Four patterns drive nearly all of it.

**Status legend:** `[ ]` todo · `[~]` in progress · `[x]` done
**Priority:** 🔴 high · 🟡 medium · 🟢 low · **Effort:** S (<1h) · M (half-day) · L (multi-day)

| ID | Item | Priority | Effort | Status |
|----|------|----------|--------|--------|
| TD-1 | Extract duplicated inline CSS → shared stylesheet | 🔴 | L | [ ] |
| TD-2 | Collapse `-print.html` clones into `@media print` | 🔴 | M | [ ] |
| TD-3 | Finish nav/footer component adoption | 🟡 | M | [ ] |
| TD-4 | Shared `<head>` boilerplate injection | 🟡 | M | [ ] |
| TD-5 | Automate cache-version (`?v=`) stamping | 🟢 | S | [ ] |
| TD-6 | Reconcile selectors defined in both CSS files | 🟢 | S | [ ] |

---

## 🔴 TD-1 — Inline `<style>` duplication (the #1 debt)

**Evidence:** **3,857 lines** of inline `<style>` across pages. Of the inline rules,
**301 distinct rules appear on 2+ pages → ~740 redundant copies.** The most-duplicated
are shared design-system atoms, copy-pasted 5-6× each:
`:root`, `*`, `.eyebrow`, `.mono`, `.accent`, `.hot`, `.pad`, `.shead`, `.snum`,
`.stitle`, `.sbody strong`, `section.block`.

**Why it hurts:** a token/atom change (color, spacing, type scale) is a 13-file edit and
drifts silently when one page is missed.

- [ ] Extract the shared atoms/tokens into `assets/css/base.css` (or fold into `styles.css`)
- [ ] Link it on every page; delete the per-page copies
- [ ] Leave only genuinely page-specific rules inline (or in a per-page file)

**Acceptance:** no design-system atom is defined in more than one place; pages shrink to
their unique styles. Expected removal: 1,000+ lines.

---

## 🔴 TD-2 — `-print.html` files are near-clones

**Evidence:** print variants are near-identical to their screen counterparts:

| Pair | Similarity |
|------|-----------|
| `flynn-overview.html` ↔ `flynn-overview-print.html` | **97.2%** |
| `flynn-overview-bd.html` ↔ `flynn-overview-bd-print.html` | **98.1%** |
| `pages/industries.html` ↔ `pages/industries-print.html` | 86.6% |

**Why it hurts:** ~5 print files (~2,400 lines) duplicate content that differs only in
print CSS. Every content edit must be made twice and can desync.

- [ ] Replace separate print files with a `@media print { … }` block (or shared `print.css`)
- [ ] Add a "Print" affordance on the canonical page; retire the `-print.html` URLs (redirect if any are linked externally)

**Acceptance:** one source page per topic; print layout driven by CSS. Biggest line-count win.

---

## 🟡 TD-3 — Nav/footer refactor only half-landed

The shared `assets/js/site-nav.js` / `site-footer.js` are adopted by the 7 "main" pages
(`index`, `why-flynn`, `pages/{industries,roadmap,tiers,validation,whitepaper}`) — but
**not** by the holdouts, which still carry inline markup:

| File | Inline `<nav>` | Inline `<footer>` | Uses components |
|------|:-:|:-:|:-:|
| `flynn-overview.html` | – | ~492 ch | no |
| `flynn-overview-print.html` | – | ~492 ch | no |
| `flynn-overview-bd.html` | – | ~500 ch | no |
| `flynn-overview-bd-print.html` | – | ~500 ch | no |
| `pages/industries-print.html` | ~265 ch | ~225 ch | no |
| `404.html` | ~288 ch | – | no |

- [ ] Point holdouts at `site-nav.js` / `site-footer.js`; delete inline nav/footer
- [ ] ⚠️ **`why-flynn.html` is inconsistent** — it loads `site-footer.js` *and* has a ~500-char hardcoded `<footer>`. Likely a double-render or dead markup; confirm and remove one.

**Acceptance:** every page sources nav/footer from the shared components; no inline copies.

---

## 🟡 TD-4 — Head boilerplate copy-pasted into every page

**Evidence:** **22 distinct `<meta>`/`<link>` tags** repeated across 6-13 pages each —
charset, viewport, font preconnect + Geist load, the full OG + Twitter card sets, and the
apple/mobile PWA tags.

**Why it hurts:** an OG-image or font change is a 7-13-file edit.

- [ ] Inject common head via a small `site-head.js` (matches the existing nav/footer JS pattern), or a build-time partial
- [ ] Leave each page to set only its unique `<title>` + `meta description` + canonical/OG-url

**Acceptance:** shared head defined once; per-page heads contain only page-unique tags.

---

## 🟢 TD-5 — Cache-version (`?v=`) stamping is manual

**Evidence:** **70 hand-stamped `?v=20260608-2030` tags** across the HTML, currently all
uniform (CI enforces uniformity). Bumping them on each release is manual and easy to
botch.

- [ ] Replace with a single version constant injected at load (or stamped by a build step)

---

## 🟢 TD-6 — Selectors defined in both CSS files

**Evidence:** **13 selector strings** appear in *both* `styles.css` and `tron.css`
(`.btn:hover`, `.h1`, `.nav-links`, `.brand-mark`, `.brand-flynn`, `.btn.ghost`, …).

- [ ] Confirm these are intentional cascade/overrides, not silent conflicts; collapse if redundant

---

## JS — healthy, no action needed

Only `resize()` and `draw()` recur across files, and they're independent canvas-module
locals in `grid-void.js` / `hero-waveform.js` / `tron-fx.js`. A shared canvas util is
optional and low-value; not worth the indirection.

---

## Suggested sequencing (by ROI)

1. **TD-1** extract shared inline CSS (kills ~740 dup rules; touch every page once)
2. **TD-2** collapse print clones (removes ~5 files / ~2,400 lines)
3. **TD-3** finish nav/footer adoption; fix the `why-flynn` double-footer
4. **TD-4** shared `<head>` injection
5. **TD-5 / TD-6** cache-tag automation; CSS selector reconciliation

Each is structural change to a live site — do them one at a time with CI/lychee verifying
each step.
