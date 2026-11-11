// Motion for the DevOps Lounge site, with GSAP and ScrollTrigger.
// The page is complete without it: nothing is hidden in CSS, and only content still below the fold is set up to animate in.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap) return;
  const { gsap } = window;
  gsap.registerPlugin(window.ScrollTrigger);
  const ST = window.ScrollTrigger;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const below = (el) => el.getBoundingClientRect().top > innerHeight * 0.92;
  const ease = 'expo.out';

  // ---------- nav: tucks away while reading down, returns when scrolling up ----------
  const nav = document.querySelector('.nav');
  if (nav) {
    ST.create({
      start: 120,
      onUpdate: (self) => gsap.to(nav, { yPercent: self.direction === 1 ? -110 : 0, duration: 0.35, ease: 'power2.out', overwrite: true }),
    });
  }

  // ---------- hero: lines rise out of a mask, then the server opens and messages arrive ----------
  const heroLines = $$('.hero-title .line > span');
  if (heroLines.length) {
    const tl = gsap.timeline({ defaults: { ease } });
    tl.from(heroLines, { yPercent: 110, duration: 1.15, stagger: 0.12 })
      .from('[data-hero-sub] > *', { y: 24, opacity: 0, duration: 0.9, stagger: 0.1 }, 0.45);
    const app = document.querySelector('.hero .app');
    if (app) {
      tl.from(app, { y: 90, rotateX: 9, scale: 0.95, opacity: 0, duration: 1.5, transformOrigin: '50% 0%' }, 0.55)
        .from($$('.feed .msg', app), { y: 18, opacity: 0, duration: 0.7, stagger: 0.42, ease: 'power3.out' }, 1.25)
        .from($$('.side .ch', app), { x: -10, opacity: 0, duration: 0.5, stagger: 0.03, ease: 'power2.out' }, 0.95)
        .from(app.querySelector('.chip'), { scale: 0.85, y: 12, opacity: 0, duration: 0.8, ease: 'back.out(1.6)' }, 2.3);
      gsap.to(app, { yPercent: -5, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }
  }

  // ---------- generic reveals: anything marked data-reveal that starts below the fold ----------
  const reveal = (selector, from, opts = {}) => {
    const els = $$(selector).filter(below);
    if (!els.length) return;
    gsap.set(els, { ...from, opacity: 0 });
    ST.batch(els, {
      start: 'top 88%', once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, x: 0, scale: 1, opacity: 1, duration: 1, ease, stagger: 0.09, overwrite: true, ...opts }),
    });
  };
  reveal('[data-reveal]', { y: 32 });
  reveal('.index li', { x: -28 });
  reveal('.tile', { y: 40, scale: 0.97 });
  reveal('.pick', { y: 48 });
  reveal('.res, .steps li, .tips li', { y: 24 });
  reveal('.count, .faq details, .tool, .page-head > *', { y: 26 });
  reveal('.final', { y: 60, scale: 0.98 });

  // ---------- the prompt tile writes itself line by line ----------
  const mini = document.querySelector('.mini-prompt');
  if (mini && below(mini)) {
    gsap.fromTo(mini, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.6, ease: 'steps(6)', scrollTrigger: { trigger: mini, start: 'top 85%', once: true } });
  }

  // ---------- the Vault number counts up ----------
  $$('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const n = { v: 0 };
    ST.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => gsap.to(n, { v: target, duration: 1.8, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(n.v); } }) });
  });

  // ---------- join story: cards stack, the one underneath steps back ----------
  const cards = $$('.cards .card');
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    gsap.to(card, { scale: 0.93, filter: 'brightness(.55)', ease: 'none', scrollTrigger: { trigger: next, start: 'top 65%', end: 'top 15%', scrub: true } });
  });
  $$('.dc-menu li, .dc-post').forEach((el) => gsap.from(el, { y: 14, opacity: 0, duration: 0.6, ease: 'power3.out', scrollTrigger: { trigger: el.parentElement, start: 'top 80%', once: true }, delay: [...el.parentElement.children].indexOf(el) * 0.07 }));

  // ---------- language wall: rows drift with the scroll, and the lit word moves around ----------
  const wall = document.querySelector('[data-wall]');
  if (wall) {
    $$('.wall-lines > div', wall).forEach((row, i) => gsap.fromTo(row, { xPercent: i % 2 ? -10 : 2 }, { xPercent: i % 2 ? 2 : -10, ease: 'none', scrollTrigger: { trigger: wall, start: 'top bottom', end: 'bottom top', scrub: 0.6 } }));
    const words = $$('.wall-lines span', wall);
    let timer;
    const cycle = () => {
      const lit = words.find((w) => w.classList.contains('lit'));
      const pool = words.filter((w) => w !== lit && w.lang !== lit?.lang && w.getBoundingClientRect().right < innerWidth && w.getBoundingClientRect().left > 0);
      const next = pool[Math.floor(Math.random() * pool.length)];
      if (!next) return;
      lit?.classList.remove('lit');
      next.classList.add('lit');
    };
    ST.create({ trigger: wall, start: 'top 80%', end: 'bottom 20%', onToggle: (self) => { clearInterval(timer); if (self.isActive) timer = setInterval(cycle, 1700); } });
  }

  // ---------- bot trap: spam lands, gets caught, the review appears ----------
  const trap = document.querySelector('[data-trap]');
  if (trap) {
    const spam = trap.querySelector('.spam');
    const review = trap.querySelector('.review');
    gsap.set(review, { opacity: 0, y: 30 });
    gsap.set(spam, { opacity: 0, y: 20 });
    const tl = gsap.timeline({ paused: true });
    tl.to(spam, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
      .to(spam, { x: -6, duration: 0.06, repeat: 5, yoyo: true, ease: 'none' }, '+=0.5')
      .add(() => spam.classList.add('caught'))
      .to(spam, { opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0, duration: 0.6, ease: 'power2.inOut' }, '+=0.7')
      .to(review, { opacity: 1, y: 0, duration: 0.9, ease }, '-=0.15')
      .from($$('.buttons span', review), { y: 10, opacity: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out' }, '-=0.4');
    ST.create({ trigger: trap, start: 'top 70%', once: true, onEnter: () => tl.play() });
  }

  // Fonts and images change heights after load; keep every trigger in the right place.
  addEventListener('load', () => ST.refresh());
})();
