/* ============================================================================
   site-footer.js — single source of truth for the site footer.

   The canonical footer markup lives here (mirrors index.html). Every page drops
   an empty mount:  <footer class="footer" id="site-footer"></footer>
   (the 6 themed pages also keep a <canvas id="grid-bg"> inside it for tron-fx;
   this script appends the .wrap content after it, so the canvas is preserved).

   Links are resolved depth-aware so the same file works from the site root
   (index.html, why-flynn.html) and from /pages/*. Load BEFORE tron-fx.js and
   install-button.js so the footer's grid canvas and Install gem are wired.
   ========================================================================== */
(function () {
  'use strict';
  var mount = document.getElementById('site-footer');
  if (!mount) return;

  var V = '20260902-0325';
  var root = /\/pages\//.test(location.pathname) ? '../' : '';

  function li(href, label) { return '<li><a href="' + href + '">' + label + '</a></li>'; }

  var html =
    '<div class="wrap">' +
      '<div class="footer-grid">' +
        '<div>' +
          '<a class="brand" href="' + root + 'index.html">' +
            '<img class="brand-mark" src="' + root + 'assets/img/flynn-logo.png?v=' + V + '" alt="Flynn" />' +
            '<span>Flynn</span>' +
          '</a>' +
          '<p class="muted" style="font-size: 14px; max-width: 32ch; margin-top: 16px;">Deterministic anomaly detection embedded at the edge of the world and beyond.</p>' +
          '<button class="install-btn footer-install" data-install type="button" aria-label="Install Flynn as an app" title="Install Flynn — opens this site in its own window">' +
            '<span class="install-gem"><canvas class="install-fx" aria-hidden="true"></canvas></span>' +
            '<span class="install-label">Install</span>' +
          '</button>' +
        '</div>' +
        '<div><h4>Product</h4><ul>' +
          li(root + 'why-flynn.html', 'Why Flynn') +
          li(root + 'pages/whitepaper.html', 'Whitepaper') +
          li(root + 'pages/validation.html', 'Validation') +
          li(root + 'pages/industries.html', 'Industries') +
          li(root + 'pages/roadmap.html', 'Roadmap') +
          li(root + 'pages/tiers.html', 'Tiers') +
        '</ul></div>' +
        '<div><h4>Engage</h4><ul>' +
          li(root + 'index.html#contact', 'Evaluation access') +
          li(root + 'index.html#contact', 'OEM licensing') +
          li(root + 'index.html#contact', 'Enterprise') +
          li('mailto:tripp@entromorphic.com', 'tripp@entromorphic.com') +
        '</ul></div>' +
        '<div><h4>Company</h4><ul>' +
          li(root + 'pages/team.html', 'Team') +
          li(root + 'pages/whitepaper.html#about', 'About EntroMorphic') +
          li('mailto:tripp@entromorphic.com', 'Contact') +
        '</ul></div>' +
      '</div>' +
      '<div class="footer-meta">' +
        '<span>© 2026 EntroMorphic · Flynn is a trademark of EntroMorphic</span>' +
        '<span>v.q2.2026 · audit-ready</span>' +
      '</div>' +
    '</div>';

  // animated "living circuit" backdrop — single source: inject the canvas if the
  // page didn't supply one statically, so every footer (themed or standalone) has it.
  if (!mount.querySelector('#grid-bg')) {
    mount.insertAdjacentHTML('afterbegin', '<canvas id="grid-bg"></canvas>');
  }

  mount.insertAdjacentHTML('beforeend', html);
})();
