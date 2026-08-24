/* ============================================================================
   site-nav.js — single source of truth for the top navigation.

   Drop an empty mount on any page:  <header id="site-nav"></header>
   This injects: brand, a reduced set of primary links, an "Explore" dropdown
   (styled after the INSTALL modal + the now-playing music card), the Install
   gem, and a Liquid.ai-style sliding highlight that follows the cursor and
   rests on the current page. Fully self-contained (own <style>, hardcoded
   palette) so it renders identically on themed pages and the self-contained
   why-flynn infographic. Load BEFORE install-button.js so the gem gets wired.
   ========================================================================== */
(function () {
  'use strict';
  var mount = document.getElementById('site-nav');
  if (!mount || mount.dataset.ready) return;
  mount.dataset.ready = '1';

  var V = '20260822-0253';
  var root = /\/pages\//.test(location.pathname) ? '../' : '';
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (here === '') here = 'index.html';

  // ---- nav model -----------------------------------------------------------
  var whitepapers = [
    { id: 'whitepaper.html',           href: root + 'pages/whitepaper.html',           label: 'Equipment talks. Flynn listens.', desc: 'Deterministic anomaly detection in 8,480 bytes' },
    { id: 'two-birds-one-stone.html',  href: root + 'pages/two-birds-one-stone.html',  label: 'Two Birds. One Stone.',           desc: 'LINK, Swift, and blind autonomy' }
  ];
  var explore = [
    { id: 'validation.html', href: root + 'pages/validation.html', label: 'Validation', desc: 'Five domains, measured' },
    { id: 'industries.html', href: root + 'pages/industries.html', label: 'Industries', desc: 'Where Flynn runs' },
    { id: 'roadmap.html',    href: root + 'pages/roadmap.html',    label: 'Roadmap',    desc: "What's shipping next" },
    { id: 'team.html',       href: root + 'pages/team.html',       label: 'Team',       desc: 'The people behind Flynn' }
  ];

  // Ordered primary nav: plain links and dropdown groups, rendered in sequence.
  var nav = [
    { type: 'link', id: 'why-flynn.html', href: root + 'why-flynn.html', label: 'Why Flynn' },
    { type: 'drop', label: 'Whitepaper', eye: 'Whitepapers', align: 'left', items: whitepapers },
    { type: 'link', id: 'tiers.html', href: root + 'pages/tiers.html', label: 'Tiers' },
    { type: 'drop', label: 'Explore', eye: 'Explore', align: 'right', items: explore }
  ];

  function groupActive(items) { return items.some(function (i) { return i.id === here; }); }

  function linkHTML(it) {
    var cur = it.id === here ? ' cur' : '';
    return '<a class="snav-link' + cur + '" href="' + it.href + '">' + it.label + '</a>';
  }
  function dropHTML(g) {
    var act = groupActive(g.items);
    return '<div class="snav-drop' + (act ? ' is-cur' : '') + '">' +
      '<button class="snav-link snav-trigger' + (act ? ' cur' : '') + '" type="button" aria-haspopup="true" aria-expanded="false">' +
        g.label + ' <span class="snav-caret" aria-hidden="true"></span>' +
      '</button>' +
      '<div class="snav-panel' + (g.align === 'left' ? ' left' : '') + '" role="menu">' +
        '<span class="snav-panel-bar" aria-hidden="true"></span>' +
        '<div class="snav-panel-body">' +
          '<div class="snav-panel-eye"><span class="dot"></span>' + g.eye + '</div>' +
          g.items.map(function (it) {
            var cur = it.id === here ? ' class="cur"' : '';
            return '<a' + cur + ' href="' + it.href + '" role="menuitem"><span class="t">' + it.label + '</span><span class="d">' + it.desc + '</span></a>';
          }).join('') +
        '</div>' +
      '</div>' +
    '</div>';
  }
  function mobileGroup(g) {
    return '<div class="grp"><span class="dot"></span>' + g.eye + '</div>' +
      g.items.map(function (it) {
        var cur = it.id === here ? ' class="cur"' : '';
        return '<a' + cur + ' href="' + it.href + '">' + it.label + '</a>';
      }).join('');
  }

  // ---- styles --------------------------------------------------------------
  if (!document.getElementById('snav-style')) {
    var css = document.createElement('style');
    css.id = 'snav-style';
    css.textContent =
    '#site-nav{position:sticky;top:0;z-index:60;width:100%;background:rgba(5,8,14,.82);' +
      '-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-bottom:1px solid rgba(120,180,210,.16)}' +
    '.snav-in{max-width:1180px;margin:0 auto;padding:14px 32px;display:flex;align-items:center;justify-content:space-between;gap:24px}' +
    '.snav-brand{display:inline-flex;align-items:center;gap:12px;text-decoration:none;color:#e9eff5;font-weight:600;font-size:15px;white-space:nowrap}' +
    '.snav-brand img{width:30px;height:30px;display:block}' +
    '.snav-brand .bf{color:#47d8ff}' +
    '.snav-right{display:flex;align-items:center;gap:16px}' +
    '.snav-links{position:relative;display:flex;align-items:center;gap:2px}' +
    '.snav-link{position:relative;z-index:1;display:inline-flex;align-items:center;gap:7px;padding:8px 13px;border-radius:6.75px;' +
      'color:oklch(0.88 0.16 200);text-decoration:none;font-family:"Share Tech Mono","Geist Mono",ui-monospace,monospace;' +
      'font-size:13px;letter-spacing:.14em;text-transform:uppercase;background:none;border:0;cursor:pointer;' +
      'white-space:nowrap;transition:color .2s ease}' +
    /* hover/active — simply turn the INSTALL orange */
    '.snav-link:hover,.snav-drop.open .snav-trigger{color:#ff8a3a}' +
    '.snav-link.cur{color:#ff8a3a}' +
    '.snav-link.cur{color:#ff8a3a;text-shadow:0 0 12px rgba(255,138,58,.45)}' +
    '.snav-caret{width:7px;height:7px;border-right:1.6px solid currentColor;border-bottom:1.6px solid currentColor;' +
      'transform:rotate(45deg) translateY(-1px);transition:transform .28s cubic-bezier(.16,.84,.34,1);opacity:.85}' +
    '.snav-drop{position:relative}' +
    '.snav-drop.open .snav-caret{transform:rotate(225deg) translateY(2px)}' +
    /* dropdown panel — INSTALL modal + music-card language */
    '.snav-panel.left{right:auto;left:0}' +
    '.snav-panel{position:absolute;top:calc(100% + 14px);right:0;min-width:250px;max-width:330px;display:flex;align-items:stretch;border-radius:9px;' +
      'overflow:hidden;background:linear-gradient(135deg,rgba(10,15,24,.98),rgba(6,10,17,.97));' +
      'border:1px solid rgba(71,216,255,.38);box-shadow:0 16px 48px -12px rgba(0,0,0,.75),0 0 26px -10px rgba(71,216,255,.5);' +
      'opacity:0;transform:translateY(-8px);pointer-events:none;transition:opacity .22s ease,transform .22s ease;z-index:80}' +
    '.snav-drop.open .snav-panel{opacity:1;transform:translateY(0);pointer-events:auto}' +
    /* transparent bridge across the trigger→panel gap so hover doesn’t drop */
    '.snav-panel::before{content:"";position:absolute;left:0;right:0;top:-16px;height:16px}' +
    '.snav-panel-bar{width:5px;flex:none;background:linear-gradient(180deg,#ff8a3a,#47d8ff);box-shadow:0 0 12px rgba(255,138,58,.6)}' +
    '.snav-panel-body{padding:13px 13px 11px;flex:1;min-width:0}' +
    '.snav-panel-eye{display:flex;align-items:center;gap:8px;font-family:"Geist Mono",ui-monospace,monospace;font-size:9px;' +
      'letter-spacing:.26em;text-transform:uppercase;color:#ffb585;text-shadow:0 0 8px rgba(255,138,58,.4);margin:2px 4px 9px}' +
    '.snav-panel-eye .dot{width:5px;height:5px;background:#ff8a3a;transform:rotate(45deg);box-shadow:0 0 7px #ff8a3a;flex:none}' +
    '.snav-panel a{display:flex;flex-direction:column;gap:2px;padding:9px 12px;border-radius:6px;text-decoration:none;' +
      'color:#cdd8e0;transition:background .18s ease,color .18s ease}' +
    '.snav-panel a:hover{background:rgba(71,216,255,.09);color:#fff}' +
    '.snav-panel a.cur{background:rgba(71,216,255,.07)}' +
    '.snav-panel a.cur .t{color:#47d8ff}' +
    '.snav-panel a .t{font-size:14px;font-weight:500}' +
    '.snav-panel a .d{font-size:11.5px;color:#7e93a3}' +
    /* mobile hamburger + slide-down sheet */
    '.snav-burger{display:none;flex-direction:column;justify-content:center;gap:5px;width:44px;height:44px;flex:none;' +
      'padding:0;border:1px solid rgba(120,180,210,.28);border-radius:8px;background:rgba(10,15,24,.6);cursor:pointer}' +
    '.snav-burger span{display:block;width:20px;height:2px;margin:0 auto;background:#cfe8f2;border-radius:2px;' +
      'transition:transform .25s ease,opacity .2s ease}' +
    '.snav-burger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}' +
    '.snav-burger.open span:nth-child(2){opacity:0}' +
    '.snav-burger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}' +
    '.snav-mobile{display:none;overflow:hidden;max-height:0;background:rgba(5,8,14,.97);' +
      '-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);transition:max-height .32s cubic-bezier(.4,0,.2,1)}' +
    '.snav-mobile.open{max-height:82vh;overflow-y:auto;border-top:1px solid rgba(120,180,210,.16)}' +
    '.snav-mobile-in{padding:8px 18px 18px}' +
    '.snav-mobile a{display:block;padding:13px 8px;text-decoration:none;color:oklch(0.88 0.16 200);' +
      'font-family:"Share Tech Mono","Geist Mono",ui-monospace,monospace;font-size:14px;letter-spacing:.14em;' +
      'text-transform:uppercase;border-bottom:1px solid rgba(120,180,210,.1);transition:color .2s ease}' +
    '.snav-mobile a:hover,.snav-mobile a.cur{color:#ff8a3a}' +
    '.snav-mobile a.cur{text-shadow:0 0 12px rgba(255,138,58,.4)}' +
    '.snav-mobile .grp{font-family:"Geist Mono",ui-monospace,monospace;font-size:9px;letter-spacing:.26em;' +
      'text-transform:uppercase;color:#ffb585;text-shadow:0 0 8px rgba(255,138,58,.35);padding:18px 8px 4px;' +
      'display:flex;align-items:center;gap:8px}' +
    '.snav-mobile .grp .dot{width:5px;height:5px;background:#ff8a3a;transform:rotate(45deg);box-shadow:0 0 7px #ff8a3a;flex:none}' +
    '@media (max-width:860px){.snav-links{display:none}.snav-in{padding:13px 18px}.snav-burger{display:flex}.snav-mobile{display:block}}' +
    '@media (prefers-reduced-motion:reduce){.snav-hl{transition:opacity .2s ease}.snav-mobile{transition:none}}';
    document.head.appendChild(css);
  }

  // ---- markup --------------------------------------------------------------
  mount.innerHTML =
    '<div class="snav-in">' +
      '<a class="snav-brand" href="' + root + 'index.html">' +
        '<img src="' + root + 'assets/img/flynn-logo.png?v=' + V + '" alt="Flynn" onerror="this.style.display=\'none\'" />' +
        '<span>Get in like <span class="bf">Flynn</span>.</span>' +
      '</a>' +
      '<div class="snav-right">' +
        '<nav class="snav-links" aria-label="Primary">' +
          nav.map(function (it) { return it.type === 'drop' ? dropHTML(it) : linkHTML(it); }).join('') +
        '</nav>' +
        '<button class="install-btn" data-install type="button" aria-label="Install Flynn as an app" title="Install Flynn — opens this site in its own window">' +
          '<span class="install-gem"><canvas class="install-fx" aria-hidden="true"></canvas></span>' +
          '<span class="install-label">Install</span>' +
        '</button>' +
        '<button class="snav-burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="snav-mobile">' +
          '<span></span><span></span><span></span>' +
        '</button>' +
      '</div>' +
    '</div>' +
    '<div class="snav-mobile" id="snav-mobile"><div class="snav-mobile-in">' +
      nav.map(function (it) {
        if (it.type === 'drop') return mobileGroup(it);
        var cur = it.id === here ? ' class="cur"' : '';
        return '<a' + cur + ' href="' + it.href + '">' + it.label + '</a>';
      }).join('') +
    '</div></div>';

  // ---- dropdown open/close (hover on desktop, click on touch) --------------
  var drops = Array.prototype.slice.call(mount.querySelectorAll('.snav-drop'));
  var canHover = window.matchMedia && window.matchMedia('(hover:hover)').matches;
  function closeAll(except) {
    drops.forEach(function (d) {
      if (d === except) return;
      d.classList.remove('open');
      var t = d.querySelector('.snav-trigger');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }
  drops.forEach(function (drop) {
    var trigger = drop.querySelector('.snav-trigger');
    var closeTimer;
    function setOpen(on) {
      drop.classList.toggle('open', on);
      trigger.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (on) closeAll(drop);
    }
    trigger.addEventListener('click', function (e) { e.preventDefault(); clearTimeout(closeTimer); setOpen(!drop.classList.contains('open')); });
    if (canHover) {
      drop.addEventListener('pointerenter', function () { clearTimeout(closeTimer); setOpen(true); });
      drop.addEventListener('pointerleave', function () { clearTimeout(closeTimer); closeTimer = setTimeout(function () { setOpen(false); }, 180); });
    }
  });
  document.addEventListener('click', function (e) {
    if (!drops.some(function (d) { return d.contains(e.target); })) closeAll(null);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(null); });

  // ---- mobile hamburger menu ----------------------------------------------
  var burger = mount.querySelector('.snav-burger');
  var mobile = mount.querySelector('.snav-mobile');
  function setMobile(on) { burger.classList.toggle('open', on); mobile.classList.toggle('open', on); burger.setAttribute('aria-expanded', on ? 'true' : 'false'); }
  burger.addEventListener('click', function () { setMobile(!mobile.classList.contains('open')); });
  mobile.addEventListener('click', function (e) { if (e.target.closest('a')) setMobile(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMobile(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 860) setMobile(false); });
})();
