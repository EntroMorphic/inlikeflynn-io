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

var VERSION = '20260608-1100';
var CACHE = 'flynn-' + VERSION;

// Minimal offline shell — the start_url so an offline launch shows something.
var OFFLINE_URLS = ['/', '/index.html'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(OFFLINE_URLS); }).catch(function () {})
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
