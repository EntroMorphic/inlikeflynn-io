# Contributing to inlikeflynn.io

Thanks for working on Flynn's site. It's a **static, dependency-light** site with
no build step — what's in the repo is what ships.

## Run it locally

It's static; serve the folder with anything:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

A local server (rather than `file://`) avoids fetch/CORS quirks with the game's
audio buffers.

## Project layout

```
/                       canonical site root (served by GitHub Pages)
  index.html
  404.html              branded not-found page
  robots.txt sitemap.xml site.webmanifest
  pages/                whitepaper, validation, industries, roadmap, tiers (+ print)
  assets/
    css/                styles.css, tron.css
    js/                 grid-void.js (+ game), tron-fx.js, hero-waveform.js, *.jsx (Tweaks)
    img/                logo, favicons, OG image
    audio/{music,sfx}/  game soundtrack + sound effects
  docs/                 audit notes & architecture (see also /REMEDIATION.md at root)
  uploads/              raw source drops (PDFs, original audio) — local only, git-ignored
```

## Branching & commits

- Branch from `main` using `feat/…`, `fix/…`, `chore/…`, or `docs/…`.
- Use [Conventional Commits](https://www.conventionalcommits.org):
  `feat: add validation soak chart`, `fix: game-over buttons dead on touch`.
- Open a PR; CI (link + cache-tag checks) must pass before merge. `main` is protected.

## Before every deploy: bump the cache version

Mobile browsers cache `grid-void.js` / `tron.css` etc. hard. Every local asset
reference carries a `?v=YYYYMMDD-HHMM` tag. Bump it in one pass so returning
visitors get fresh code:

> Ask Claude to **"bump the asset cache version"** — it re-stamps `index.html`,
> `pages/*.html`, and `404.html` with a fresh timestamp.

CI fails if the `?v=` tags are not uniform across all HTML.

## Releasing

1. Update `CHANGELOG.md` (Keep a Changelog format).
2. Bump the cache version.
3. Tag the release: `git tag vX.Y.Z && git push --tags` (SemVer).
4. Merge to `main` — GitHub Pages deploys from root.

## Editing the game

`assets/js/grid-void.js` holds the volumetric grid **and** the hidden game. It
resolves audio/logo paths relative to its own script URL (`MUSIC_BASE`). If you
move it, update that resolution and the hard-coded `assets/...` paths inside, and
test the game audio from **both** `/` and `/pages/*`.
