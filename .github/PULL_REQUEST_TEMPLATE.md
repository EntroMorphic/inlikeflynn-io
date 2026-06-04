## Summary

<!-- What does this PR change, and why? -->

## Type

- [ ] feat — new content/feature
- [ ] fix — bug fix
- [ ] chore — tooling/housekeeping
- [ ] docs — documentation only

## Checklist

- [ ] Tested locally via `python3 -m http.server` (not `file://`)
- [ ] Verified on a narrow (mobile) viewport
- [ ] If assets moved/added: every reference updated; game audio works from `/` **and** `/pages/*`
- [ ] Bumped the asset cache version (`?v=`) if any asset changed
- [ ] Updated `CHANGELOG.md`
- [ ] CI (links + cache-tag) passes
