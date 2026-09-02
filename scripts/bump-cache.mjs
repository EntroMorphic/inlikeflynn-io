#!/usr/bin/env node
/* ============================================================================
   scripts/bump-cache.mjs — single source of truth for cache-busting.

   The site ships no build pipeline; static assets are referenced with a
   `?v=YYYYMMDD-HHMM` query string and the service worker keys its cache off a
   matching VERSION constant. After changing any CSS/JS asset, run this to stamp
   every reference to one fresh version so returning visitors never run stale code:

       node scripts/bump-cache.mjs            # bump to current UTC timestamp
       node scripts/bump-cache.mjs 20260609-1200   # or an explicit version

   It rewrites:
     • every  ?v=<old>  in *.html (root + pages/) and in the JS modules that
       stamp injected asset URLs (site-nav.js, site-footer.js)
     • the  VERSION  constant in sw.js

   Idempotent and safe to run repeatedly. Prints a summary of what changed.
   ========================================================================== */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// The site is served from the repo root; legacy_files/ is excluded below.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}`;
}

const NEW = process.argv[2] || stamp();
const VRE = /\?v=\d{8}-\d{4}/g;
const SWRE = /(VERSION\s*=\s*['"])\d{8}-\d{4}(['"])/;
const JSV = /(\bvar V = ['"])\d{8}-\d{4}(['"])/g;

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (['assets', 'node_modules', '.git', 'scripts', 'docs', 'uploads', 'screenshots', 'backups', 'explorations', 'ziptest', 'dist', 'legacy_files'].includes(name)) continue;
      out.push(...htmlFiles(p));
    } else if (name.endsWith('.html')) {
      out.push(p);
    }
  }
  return out;
}

let changed = 0;
const log = [];

// 1) HTML: ?v= stamps
for (const f of htmlFiles(ROOT)) {
  const src = readFileSync(f, 'utf8');
  const hits = (src.match(VRE) || []).length;
  if (!hits) continue;
  const next = src.replace(VRE, `?v=${NEW}`);
  if (next !== src) { writeFileSync(f, next); changed++; log.push(`${f.replace(ROOT + '/', '')}: ${hits} ?v=`); }
}

// 2) JS modules that stamp injected URLs (var V = '...')
for (const rel of ['assets/js/site-nav.js', 'assets/js/site-footer.js']) {
  const f = join(ROOT, rel);
  try {
    const src = readFileSync(f, 'utf8');
    const next = src.replace(JSV, `$1${NEW}$2`);
    if (next !== src) { writeFileSync(f, next); changed++; log.push(`${rel}: var V`); }
  } catch {}
}

// 3) service worker VERSION
{
  const f = join(ROOT, 'sw.js');
  try {
    const src = readFileSync(f, 'utf8');
    const next = src.replace(SWRE, `$1${NEW}$2`);
    if (next !== src) { writeFileSync(f, next); changed++; log.push('sw.js: VERSION'); }
  } catch {}
}

console.log(`cache-bump → ${NEW}`);
for (const l of log) console.log('  ' + l);
console.log(`${changed} file(s) updated.`);
