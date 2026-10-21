// Home page behaviour: scroll-scrubbed trailer hero, ticker speed, episode rail.
// Scroll reveals come from episode.js.
(() => {
  const clamp01 = x => Math.min(1, Math.max(0, x));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Hero ----------
  const hero = document.querySelector('[data-hero]');
  if (hero) {
    const q = s => hero.querySelector(s);
    const title = q('[data-hero-title]'), frame = q('[data-hero-frame]'), still = q('[data-hero-still]');
    const bar = q('[data-hero-bar]'), knob = q('[data-hero-knob]'), tc = q('[data-hero-tc]'), cue = q('[data-hero-cue]');
    const caps = [...hero.querySelectorAll('[data-cue]')].map(el => ({ el, cue: el.dataset.cue.split(',').map(Number) }));
    const FADE = 0.04;

    // Optional trailer video: data-video="assets/trailer.mp4" on the hero section.
    let video = null;
    if (hero.dataset.video) {
      video = document.createElement('video');
      Object.assign(video, { muted: true, playsInline: true, preload: 'auto', src: hero.dataset.video });
      video.setAttribute('aria-hidden', 'true');
      still.replaceChildren(video);
    }

    let p = 0, target = 0, raf = 0;
    const readScroll = () => {
      const r = hero.getBoundingClientRect();
      target = clamp01(-r.top / Math.max(1, r.height - innerHeight));
    };

    const draw = () => {
      // Frame grows from a panel under the title to full screen over the first 22%.
      let k = clamp01(p / 0.22); k = 1 - Math.pow(1 - k, 3);
      const top0 = Math.max(innerHeight * 0.3, title.offsetTop + title.offsetHeight + 28);
      frame.style.clipPath = `inset(${((1 - k) * top0).toFixed(1)}px ${(1 - k) * 4}vw ${(1 - k) * 5}vh ${(1 - k) * 4}vw round ${(1 - k) * 16}px)`;
      title.style.opacity = clamp01(1 - k * 1.5).toFixed(3);
      title.style.transform = `translateY(${-k * 60}px)`;

      // Each caption fades in at its cue and out at the end; it rises in and lifts out.
      for (const { el, cue: [a, b] } of caps) {
        let o = clamp01((p - a) / FADE) * clamp01((b - p) / FADE); o = o * o * (3 - 2 * o);
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translateY(${((1 - o) * (p < (a + b) / 2 ? 40 : -40)).toFixed(1)}px)`;
      }

      if (video && video.duration) {
        const t = p * (video.duration - 0.05);
        if (Math.abs(video.currentTime - t) > 0.015) video.currentTime = t;
      }
      still.style.transform = `scale(${(1.12 - p * 0.12).toFixed(4)})`;

      const secs = Math.round(p * 15), pad = n => String(n).padStart(2, '0');
      tc.textContent = `00:${pad(secs)} / 00:15`;
      const pc = (p * 100).toFixed(2) + '%';
      bar.style.width = pc; knob.style.left = pc;
      cue.style.opacity = p > 0.95 ? '0' : '1';
    };

    // Ease towards the scroll position, and stop the loop once it gets there.
    const frameLoop = () => {
      raf = 0;
      p += (target - p) * (reduceMotion ? 1 : 0.1);
      if (Math.abs(target - p) < 0.0004) p = target;
      draw();
      if (p !== target) raf = requestAnimationFrame(frameLoop);
    };
    const kick = () => { readScroll(); if (!raf) raf = requestAnimationFrame(frameLoop); };
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', kick);
    kick();
  }

  // ---------- Ticker: 50px per second, whatever the text width ----------
  const ticker = document.querySelector('[data-ticker]');
  if (ticker) {
    const setSpeed = () => { ticker.style.animationDuration = (ticker.scrollWidth / 2 / 50).toFixed(1) + 's'; };
    setSpeed();
    document.fonts && document.fonts.ready.then(setSpeed);
  }

  // ---------- Episode rail buttons ----------
  const rail = document.querySelector('[data-rail-track]');
  document.querySelectorAll('[data-rail]').forEach(btn => btn.addEventListener('click', () => {
    if (rail) rail.scrollBy({ left: +btn.dataset.rail * rail.clientWidth * 0.8, behavior: 'smooth' });
  }));
})();
