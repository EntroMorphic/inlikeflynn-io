/* ============================================================================
   sw-register.js — register the Flynn service worker.

   Enables the proper PWA install path (Android WebAPK) + a light offline shell.
   Defensive by design: no-ops on browsers without service-worker support or on
   non-secure / non-root hosts (e.g. local preview), where install still works
   through the browser's own UI. Registers at root scope so it covers every page.
   ========================================================================== */
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {
      /* preview / non-HTTPS / non-root host — safe to ignore */
    });
  });
})();
