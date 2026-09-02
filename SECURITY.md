# Security Policy

## Reporting a vulnerability

If you discover a security issue in the inlikeflynn.io website — exposed
credentials, a content-injection vector, a dependency advisory, or anything that
could compromise visitors — please report it privately.

**Email:** tripp@inlikeflynn.io
**Subject:** `SECURITY — inlikeflynn.io`

Please include:

- A description of the issue and its impact
- Steps to reproduce (URL, browser, payload)
- Any relevant logs or screenshots

Do **not** open a public GitHub issue for security reports.

## Scope

This is a static marketing site served from GitHub Pages. There is no backend,
no user accounts, and no data collection. The most relevant classes of issue are:

- Integrity of the vendored `assets/js/three.min.js` (three r149) — the served site ships
  **no external `<script>` dependencies**; three.js is local and React/Babel are retired.
  The 9 `<script>` tags that load it carry a Subresource Integrity hash
  (`integrity="sha384-RRHfJ6w1mTlKUBMYT/hvnRiOzEB/vyRV3DrQOseb6oYfvaZSfdd0byS4bHps0k2R"`),
  so a tampered local file is rejected by the browser. **The hash is keyed to the file
  bytes, not the URL** — a `?v=` cache bump leaves it valid, but **upgrading three.js
  requires regenerating the hash** (`openssl dgst -sha384 -binary three.min.js | openssl base64 -A`)
  and updating all 9 tags, or the grid silently fails to load.
- Google Fonts is the only remaining third-party origin loaded at runtime (a stylesheet)
- Mixed-content or transport issues on the custom domain

## Response

We aim to acknowledge reports within 5 business days and to remediate confirmed
issues promptly. Thank you for helping keep Flynn's visitors safe.
