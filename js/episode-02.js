// Episode 02 behaviour: team graphics, the scroll-linked handoff, CRAFT flip cards.
// Progress bar and scroll reveals come from episode.js.
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp01 = x => Math.min(1, Math.max(0, x));

  // ---------- Team graphics (js/team-graphic.js) ----------
  let handoffGraphic = null;
  if (window.TeamGraphic) {
    document.querySelectorAll('[data-team-graphic]').forEach(canvas => {
      const g = window.TeamGraphic.mount(canvas, {});
      if (canvas.hasAttribute('data-handoff-graphic')) handoffGraphic = g;
    });
  }

  // Reduced motion: keep the clip still.
  const clip = document.querySelector('.ep02-clip video');
  if (clip && reduceMotion) { clip.removeAttribute('autoplay'); clip.preload = 'auto'; clip.pause(); }

  // ---------- The handoff: one step lights up at a time as the section scrolls ----------
  const handoff = document.querySelector('[data-handoff]');
  const fill = document.querySelector('[data-handoff-fill]');
  const steps = [...document.querySelectorAll('[data-step]')];
  let active = null;

  const updateHandoff = () => {
    if (!handoff) return;
    const r = handoff.getBoundingClientRect();
    const p = clamp01((innerHeight * 0.85 - r.top) / Math.max(1, innerHeight * 0.6));
    const idx = r.top > innerHeight * 0.85 ? -1 : Math.min(5, Math.floor(p * 6));
    fill.style.width = (clamp01((p * 6 - 0.5) / 5) * 100).toFixed(2) + '%';
    if (idx === active) return;
    active = idx;
    steps.forEach((s, i) => {
      s.classList.toggle('is-active', i === idx);
      s.classList.toggle('is-done', idx >= 0 && i < idx);
      s.classList.toggle('is-next', idx >= 0 && i > idx);
    });
    if (handoffGraphic) handoffGraphic.setActive(idx);
  };
  let ticking = false;
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; updateHandoff(); }); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  updateHandoff();

  // ---------- CRAFT cards: hover with a mouse, tap on touch, Enter or Space by keyboard ----------
  document.querySelectorAll('[data-craft]').forEach(card => {
    let pointer = '';
    const set = on => { card.classList.toggle('is-flipped', on); card.setAttribute('aria-pressed', String(on)); };
    const toggle = () => set(!card.classList.contains('is-flipped'));
    card.addEventListener('pointerdown', e => { pointer = e.pointerType; });
    card.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') set(true); });
    card.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') set(false); });
    card.addEventListener('click', () => { if (pointer !== 'mouse') toggle(); pointer = ''; });
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });
})();
