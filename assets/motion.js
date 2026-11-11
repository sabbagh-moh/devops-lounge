// Motion for the template-based site: smooth scroll, word-by-word headings, staggered cards, counters and the menu.
// Everything here only animates content that is already in the page, so the site reads fine without it.
(() => {
  const root = document.documentElement;
  const ready = () => root.classList.add('motion-ready');

  // ---------- navbar: solid after scrolling, and the small-screen menu ----------
  const nav = document.querySelector('[data-nav]');
  if (nav) {
    const btn = nav.querySelector('.menu-button');
    const setOpen = (open) => { nav.classList.toggle('is-open', open); btn?.setAttribute('aria-expanded', String(open)); btn?.setAttribute('aria-label', open ? 'Close the menu' : 'Open the menu'); };
    btn?.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    nav.querySelectorAll('.nav-link-wrapper a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 24);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { gsap, ScrollTrigger, SplitText } = window;
  if (reduce || !gsap) { ready(); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (SplitText) gsap.registerPlugin(SplitText);

  // ---------- smooth scroll, kept in step with ScrollTrigger ----------
  if (window.Lenis && !matchMedia('(pointer: coarse)').matches) {
    const lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -90 }); }
    }));
  }

  const isArabic = (el) => !!el.closest('[lang="ar"]');
  const ease = 'power3.out';

  // Headings rise word by word from under a mask; Arabic is faded instead, so its letters stay joined.
  const words = (el, vars) => {
    if (!SplitText || isArabic(el)) return gsap.from(el, { opacity: 0, y: 24, duration: 0.9, ease, ...vars });
    const split = SplitText.create(el, { type: 'words', mask: 'words' });
    return gsap.from(split.words, { yPercent: 110, opacity: 0, duration: 1, ease, stagger: 0.05, ...vars, onComplete: () => split.revert() });
  };
  const onView = (el, start = 'top 86%') => ({ scrollTrigger: { trigger: el, start, once: true } });

  // ---------- on load: the hero ----------
  const load = gsap.timeline({ delay: 0.05 });
  document.querySelectorAll('[data-reveal-load]').forEach((el, i) => {
    const kind = el.getAttribute('data-reveal-load');
    const at = 0.08 * i;
    if (kind === 'text') load.add(words(el, {}), at);
    else if (kind === 'image') load.from(el, { opacity: 0, y: 80, scale: 0.96, duration: 1.4, ease: 'power4.out' }, at + 0.1);
    else load.from(el, { opacity: 0, y: 22, duration: 0.9, ease }, at);
  });
  ready();

  // ---------- on scroll ----------
  document.querySelectorAll('[data-reveal="text"]').forEach((el) => words(el, onView(el)));
  document.querySelectorAll('[data-reveal="fade"]').forEach((el) => gsap.from(el, { opacity: 0, y: 26, duration: 1, ease, ...onView(el) }));
  document.querySelectorAll('[data-reveal="image"]').forEach((el) => gsap.from(el, { opacity: 0, y: 50, scale: 0.97, duration: 1.3, ease: 'power4.out', ...onView(el, 'top 92%') }));
  document.querySelectorAll('[data-reveal="group"]').forEach((group) => {
    const items = [...group.children];
    if (items.length) gsap.from(items, { opacity: 0, y: 40, duration: 1, ease, stagger: 0.09, ...onView(group) });
  });

  // Numbers count up to their real value once they come into view.
  document.querySelectorAll('[data-count]').forEach((el) => {
    const end = Number(el.getAttribute('data-count'));
    if (!Number.isFinite(end) || end < 2) return;
    const fmt = new Intl.NumberFormat(isArabic(el) ? 'ar' : 'en');
    const box = { n: 0 };
    gsap.to(box, { n: end, duration: 1.6, ease: 'power2.out', ...onView(el, 'top 90%'), onUpdate: () => { el.textContent = fmt.format(Math.round(box.n)); } });
  });

  // The template's little scenes: rows slide in, steps light up in order, rays breathe.
  document.querySelectorAll('.fx-card').forEach((card) => {
    const rows = card.querySelectorAll('.team-row, .proc-step');
    gsap.from(rows, { opacity: 0, x: -40, duration: 0.9, ease, stagger: 0.18, ...onView(card, 'top 80%') });
    gsap.from(card.querySelectorAll('.fx-layer'), { opacity: 0, duration: 1.6, ease: 'power2.out', stagger: 0.06, ...onView(card, 'top 80%') });
    gsap.from(card.querySelectorAll('.proc-bracket'), { opacity: 0, scaleY: 0, transformOrigin: 'top', duration: 1, ease, delay: 0.6, ...onView(card, 'top 80%') });
    const glows = card.querySelectorAll('.proc-glow');
    if (glows.length) gsap.to(glows, { opacity: 1, duration: 0.6, ease: 'sine.inOut', stagger: { each: 0.9, repeat: -1, yoyo: true }, ...onView(card, 'top 80%') });
  });
  document.querySelectorAll('.orbit-card').forEach((card) => {
    gsap.from(card.querySelectorAll('.orbit-node'), { opacity: 0, scale: 0.4, duration: 0.9, ease: 'back.out(1.6)', stagger: 0.07, ...onView(card, 'top 80%') });
    gsap.to(card.querySelectorAll('.orbit-hit'), { y: -5, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: { each: 0.3, from: 'random' } });
  });

  // The server in the hero drifts up a touch as the page scrolls.
  const device = document.querySelector('.hero-device');
  if (device) gsap.to(device, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: device, start: 'top bottom', end: 'bottom top', scrub: true } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
