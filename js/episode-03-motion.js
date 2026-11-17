// Episode 03 extra motion: a connecting thread down the margin, and a
// few count-up numbers. Page-specific. Episode 01 and 02 don't load this
// file, so none of it touches them.
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- The spine: a line down the page, filled to how far you've
  // scrolled, with one dot per section that lights up once you reach it.
  const spine = document.getElementById('ep03-spine');
  if (spine) {
    const fill = document.getElementById('spine-fill');
    const dotsHost = document.getElementById('spine-dots');
    const sections = Array.from(document.querySelectorAll('main > section'));
    const dots = sections.map(() => {
      const d = document.createElement('div');
      d.className = 'spine-dot';
      dotsHost.appendChild(d);
      return d;
    });

    function layout() {
      const trackH = spine.clientHeight;
      const total = document.documentElement.scrollHeight;
      if (!total) return;
      sections.forEach((s, i) => {
        const centre = s.offsetTop + s.offsetHeight / 2;
        dots[i].style.top = Math.min(trackH, (centre / total) * trackH) + 'px';
      });
    }

    let ticking = false;
    function update() {
      ticking = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      const frac = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      fill.style.height = (frac * 100) + '%';
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => entries.forEach(e => {
        const i = sections.indexOf(e.target);
        if (i === -1 || !e.isIntersecting) return;
        dots[i].classList.add('is-on');
      }), { threshold: 0.35 });
      sections.forEach(s => io.observe(s));
    }

    layout();
    update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', () => { layout(); update(); });
    addEventListener('load', layout);
  }

  // ---- Count-up numbers: animate from 0 to the target once on screen.
  // Also used by the game, for the reactions count on the finished post.
  function countUp(el) {
    const to = parseFloat(el.dataset.to);
    if (isNaN(to)) return;
    const decimals = (String(el.dataset.to).split('.')[1] || '').length;
    if (reduceMotion) { el.textContent = el.dataset.to; return; }
    const dur = 1000;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (to * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = el.dataset.to;
    }
    requestAnimationFrame(tick);
  }
  window.ep03CountUp = countUp;

  const counters = document.querySelectorAll('[data-countup]');
  if (counters.length) {
    if ('IntersectionObserver' in window) {
      const io2 = new IntersectionObserver(entries => entries.forEach(e => {
        if (!e.isIntersecting) return;
        countUp(e.target);
        io2.unobserve(e.target);
      }), { threshold: 0.6 });
      counters.forEach(el => io2.observe(el));
    } else {
      counters.forEach(el => el.textContent = el.dataset.to);
    }
  }
})();
