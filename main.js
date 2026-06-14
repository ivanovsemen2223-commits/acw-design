/* =====================================================================
   A-COLD-WALL* — interactions
   - smooth scroll (Lenis), no load-jump
   - smooth scroll-reveal (IntersectionObserver, GPU transform/opacity only)
   - fullscreen burger menu
   - horizontal drag for product row
   ===================================================================== */
(() => {
  'use strict';

  // Always start at the very top on (re)load — kills the scroll "jump".
  window.scrollTo(0, 0);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  function initLenis() {
    if (reduceMotion || typeof Lenis === 'undefined') return;
    try {
      lenis = new Lenis({
        duration: 1.1,
        smoothWheel: true,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    } catch (e) { lenis = null; }
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    const els = Array.from(document.querySelectorAll('.reveal'));
    if (!els.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('in'));
      return;
    }

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        // gentle stagger for siblings that enter together
        const sibs = el.parentElement
          ? Array.from(el.parentElement.querySelectorAll(':scope > .reveal'))
          : [el];
        const i = Math.max(0, sibs.indexOf(el));
        el.style.transitionDelay = Math.min(i * 90, 360) + 'ms';
        el.classList.add('in');
        obs.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    els.forEach(el => io.observe(el));

    // Hard safety: never leave anything hidden.
    setTimeout(() => els.forEach(el => el.classList.add('in')), 2600);
  }

  /* ---------- Fullscreen menu ---------- */
  function initMenu() {
    const overlay = document.getElementById('menuOverlay');
    const openBtn = document.getElementById('menuOpen');
    const closeBtn = document.getElementById('menuClose');
    if (!overlay || !openBtn) return;

    const open = () => {
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      openBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
      if (lenis) lenis.stop();
    };
    const close = () => {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      openBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
      if (lenis) lenis.start();
    };

    openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
  }

  /* ---------- Horizontal drag for product row ---------- */
  function initRowDrag() {
    document.querySelectorAll('[data-row]').forEach(row => {
      let down = false, sx = 0, sl = 0;
      row.addEventListener('pointerdown', e => {
        down = true; sx = e.pageX; sl = row.scrollLeft;
        row.setPointerCapture(e.pointerId);
      });
      row.addEventListener('pointermove', e => { if (down) row.scrollLeft = sl - (e.pageX - sx); });
      const up = () => { down = false; };
      row.addEventListener('pointerup', up);
      row.addEventListener('pointercancel', up);
    });
  }

  function boot() {
    initLenis();
    initReveal();
    initMenu();
    initRowDrag();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
