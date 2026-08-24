/* ============================================================================
   sw.js — Flynn service worker.

   Purpose: satisfy Android/Chrome's installability criteria so the phone mints
   a real installed app (a WebAPK) instead of falling back to a permission-gated
   home-screen shortcut — and give the site a light offline shell on Android & iOS.

   Designed NOT to fight the site's ?v= cache-busting:
     • HTML / navigations  -> network-first  (always fresh online; cache only when offline)
     • versioned assets     -> cache-first    (URLs carry ?v=, so a deploy = new URL = miss)
   Bump VERSION on each deploy; activate wipes every older "flynn-*" cache.
   ========================================================================== */
'use strict';

var VERSION = '20260822-0253';
var CACHE = 'flynn-' + VERSION;

// Offline app shell — every LOCAL asset the home page needs to render the full
// page *and the grid* on a cold offline launch (HTML + CSS + JS + nav/footer logo),
// not just a text shell. All carry the matching ?v= so they resolve to the
// cache-first branch; each is built from VERSION so a cache bump keeps them in sync
// (bump-cache.mjs rewrites VERSION). three.js is vendored locally, so the only thing
// left to runtime caching is Google Fonts (cross-origin) + the game audio — both
// cache on first online visit; the grid itself needs none of them.
var V = '?v=' + VERSION;
var OFFLINE_URLS = [
  '/', '/index.html',
  '/assets/css/styles.css' + V,
  '/assets/css/tron.css' + V,
  '/assets/css/install-button.css' + V,
  '/assets/css/site-footer.css' + V,
  '/assets/js/three.min.js' + V,
  '/assets/js/grid-void.js' + V,
  '/assets/js/tron-fx.js' + V,
  '/assets/js/hero-waveform.js' + V,
  '/assets/js/site-nav.js' + V,
  '/assets/js/site-footer.js' + V,
  '/assets/js/install-button.js' + V,
  '/assets/js/sw-register.js' + V,
  '/assets/img/flynn-logo.png' + V
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  // Cache each shell asset INDEPENDENTLY: addAll is atomic, so a single 404 would
  // abort the whole precache and silently leave the site non-offline. Per-item
  // c.add().catch() tolerates an odd miss and still caches everything else.
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(OFFLINE_URLS.map(function (u) {
        return c.add(u).catch(function () {});
      }));
    }).catch(function () {})
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.map(function (k) {
      if (k !== CACHE && k.indexOf('flynn-') === 0) return caches.delete(k);
    }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var accept = req.headers.get('accept') || '';
  var isHTML = req.mode === 'navigate' || accept.indexOf('text/html') !== -1;

  // HTML: network-first → cached copy → offline shell.
  if (isHTML) {
    e.respondWith((async function () {
      try {
        var fresh = await fetch(req);
        var c = await caches.open(CACHE);
        c.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        var cached = await caches.match(req);
        return cached || (await caches.match('/index.html')) || Response.error();
      }
    })());
    return;
  }

  // Everything else (CSS / JS / img / audio / fonts / CDN): cache-first → network.
  e.respondWith((async function () {
    var cached = await caches.match(req);
    if (cached) return cached;
    try {
      var fresh = await fetch(req);
      if (fresh && (fresh.ok || fresh.type === 'opaque')) {
        var c = await caches.open(CACHE);
        c.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      return cached || Response.error();
    }
  })());
});

// Lets a future page tell a waiting worker to take over immediately.
self.addEventListener('message', function (e) {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
