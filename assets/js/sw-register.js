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
  // Skip in embedded previews: the editor runs this page inside an iframe, where
  // /sw.js resolves to the sandbox host and 404s (noisy console, no benefit).
  // The deployed site loads top-level, so registration still happens in production.
  if (window.top !== window.self) return;
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {
      /* non-HTTPS / non-root host — safe to ignore */
    });
  });
})();
