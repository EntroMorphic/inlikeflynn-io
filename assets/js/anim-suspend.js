/* Flynn — gate embedded figure animations so they never compete with the
   three.js grid backdrop for the main thread.

   Two suspend triggers, both mirrored into the animation iframes as
   postMessage({flynnAnim:'suspend'|'resume'}):
     1. body.ah-playing — the easter-egg game is running (grid-void.js).
     2. the figure is scrolled out of view (IntersectionObserver).
   An iframe stays suspended while EITHER condition holds. */
(function () {
  var SEL = 'iframe[src*="assets/anim/"]';
  var state = new WeakMap();   // iframe -> { onscreen, sent }

  function post(f, on) {
    try { f.contentWindow && f.contentWindow.postMessage({ flynnAnim: on ? 'resume' : 'suspend' }, '*'); } catch (e) {}
  }
  function apply(f) {
    var s = state.get(f); if (!s) return;
    var run = s.onscreen && !document.body.classList.contains('ah-playing');
    if (run === s.sent) return;
    s.sent = run;
    post(f, run);
  }
  function applyAll() { document.querySelectorAll(SEL).forEach(apply); }

  function boot() {
    var frames = document.querySelectorAll(SEL);
    if (!frames.length) return;

    var io = window.IntersectionObserver ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var s = state.get(en.target); if (!s) return;
        s.onscreen = en.isIntersecting;
        apply(en.target);
      });
    }, { rootMargin: '120px 0px' }) : null;

    frames.forEach(function (f) {
      // assume off-screen until told otherwise; the iframe starts drawing on its
      // own, and the first observer callback settles it either way
      state.set(f, { onscreen: !io, sent: null });
      if (io) io.observe(f);
      f.addEventListener('load', function () { var s = state.get(f); if (s) { s.sent = null; apply(f); } });
    });

    new MutationObserver(applyAll).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    applyAll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
