# Security Policy

## Reporting a vulnerability

If you discover a security issue in the inlikeflynn.io website — exposed
credentials, a content-injection vector, a dependency advisory, or anything that
could compromise visitors — please report it privately.

**Email:** tripp@entromorphic.com
**Subject:** `SECURITY — inlikeflynn.io`

Please include:

- A description of the issue and its impact
- Steps to reproduce (URL, browser, payload)
- Any relevant logs or screenshots

Do **not** open a public GitHub issue for security reports.

## Scope

This is a static marketing site served from GitHub Pages. There is no backend,
no user accounts, and no data collection. The most relevant classes of issue are:

- Stale or compromised third-party CDN dependencies (three.js, React, Babel)
- Sub-resource integrity gaps on external scripts
- Mixed-content or transport issues on the custom domain

## Response

We aim to acknowledge reports within 5 business days and to remediate confirmed
issues promptly. Thank you for helping keep Flynn's visitors safe.
