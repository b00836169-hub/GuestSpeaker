// Episode page behaviour: scroll progress bar, key art parallax, scroll reveals.
(() => {
  const bar = document.querySelector('[data-progress]');
  const art = document.querySelector('[data-parallax]');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let ticking = false;
  const update = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (max > 0 ? scrollY / max * 100 : 0).toFixed(2) + '%';
    if (art && !reduceMotion) art.style.transform = `translateY(${(scrollY * -0.08).toFixed(1)}px)`;
  };
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();

  // Reveal each [data-reveal] element once, when it enters the viewport.
  const items = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    items.forEach(el => io.observe(el));
  } else {
    items.forEach(el => el.classList.add('is-in'));
  }

  // LinkedIn links without a URL yet: don't jump to the top of the page.
  document.querySelectorAll('[data-todo-link]').forEach(a =>
    a.addEventListener('click', e => e.preventDefault()));
})();
