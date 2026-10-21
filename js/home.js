// Home page hero: an abstract title sequence drawn on a canvas and scrubbed by scroll.
// Scroll down plays it forward, scroll up plays it back.
// Story: a blinking cursor -> a design grid -> tiles of colour -> code particles
// streaming into a cube (the repo) -> a burst of light lines (going live) -> one bar of light (the title).
(() => {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;
  const canvas = hero.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const caps = [...hero.querySelectorAll('[data-at]')].map(el => {
    const [a, b] = el.dataset.at.split('-').map(Number);
    return { el, a, b };
  });
  const hint = hero.querySelector('[data-scroll-hint]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const css = getComputedStyle(document.documentElement);
  const ACC = css.getPropertyValue('--acc').trim() || '#ff5a36';
  const POP = css.getPropertyValue('--pop').trim() || '#ffc94a';
  const INK = css.getPropertyValue('--ink').trim() || '#f2eee6';
  const BG = '#05060b';

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

  // ---------- Fixed scene data (same every time, so scrubbing is stable) ----------
  const COLS = 8, ROWS = 5;
  const tiles = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const pick = rand();
    tiles.push({
      c, r,
      z: 120 + rand() * 520,
      dx: (rand() - .5) * 1.1, dy: (rand() - .5) * .9,
      rot: (rand() - .5) * .9,
      col: pick < .22 ? ACC : pick < .4 ? POP : INK,
      fill: pick < .4 ? .9 : .08 + rand() * .1,
      delay: rand() * .35
    });
  }
  const parts = [];
  tiles.forEach(t => { for (let i = 0; i < 14; i++) parts.push({ t, ox: rand(), oy: rand(), bend: (rand() - .5) * 2, d: rand() * .4, s: .6 + rand() * 1.6, col: rand() < .3 ? POP : rand() < .5 ? ACC : INK }); });
  const nodes = [];
  for (let i = 0; i < 90; i++) {
    const a = rand() * Math.PI * 2, rr = .18 + Math.pow(rand(), .7) * .9;
    nodes.push({ a, rr, d: rand() * .45, bx: (rand() - .5) * 1.25, size: .8 + rand() * 1.8 });
  }
  const links = [];
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const A = nodes[i], B = nodes[j];
    const dx = Math.cos(A.a) * A.rr - Math.cos(B.a) * B.rr, dy = Math.sin(A.a) * A.rr - Math.sin(B.a) * B.rr;
    if (dx * dx + dy * dy < .045) links.push([i, j]);
  }

  // Film grain, made once.
  const grain = document.createElement('canvas');
  grain.width = grain.height = 160;
  const g = grain.getContext('2d'), gd = g.createImageData(160, 160);
  for (let i = 0; i < gd.data.length; i += 4) { const v = Math.random() * 255; gd.data[i] = gd.data[i + 1] = gd.data[i + 2] = v; gd.data[i + 3] = 14; }
  g.putImageData(gd, 0, 0);

  let W = 0, H = 0, DPR = 1;
  const resize = () => {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  };

  const rgba = (hex, a) => {
    const n = parseInt(hex.replace('#', ''), 16);
    return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
  };

  function draw(p, time) {
    const cx = W / 2, cy = H / 2, S = Math.min(W, H);
    const push = 1 + p * .18;                 // slow push-in across the whole sequence
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(cx, cy); ctx.scale(push, push); ctx.translate(-cx, -cy);
    ctx.globalCompositeOperation = 'lighter';

    // Grid box
    const gw = Math.min(W * .72, S * 1.15), gh = gw * ROWS / COLS * .78;
    const gx = cx - gw / 2, gy = cy - gh / 2, tw = gw / COLS, th = gh / ROWS;

    // A. Cursor
    const aOut = 1 - seg(p, .12, .2);
    if (aOut > 0) {
      const blink = p < .1 ? (Math.sin(time / 260) > -.2 ? 1 : .15) : 1;
      const stretch = ease(seg(p, .1, .2));
      const w = lerp(3, gw, stretch), h = lerp(30, 2, stretch);
      ctx.shadowColor = ACC; ctx.shadowBlur = 24;
      ctx.fillStyle = rgba(ACC, blink * (stretch > 0 ? 1 : 1));
      ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
      ctx.shadowBlur = 0;
    }

    // B. Grid lines draw themselves
    const gIn = seg(p, .16, .32), gOut = 1 - seg(p, .36, .46);
    if (gIn > 0 && gOut > 0) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(INK, .35 * gOut);
      for (let r = 0; r <= ROWS; r++) {
        const k = ease(seg(gIn, r / (ROWS + 2), r / (ROWS + 2) + .5));
        if (!k) continue;
        ctx.beginPath(); ctx.moveTo(cx - gw / 2 * k, gy + r * th); ctx.lineTo(cx + gw / 2 * k, gy + r * th); ctx.stroke();
      }
      for (let c = 0; c <= COLS; c++) {
        const k = ease(seg(gIn, .25 + c / (COLS * 2.2), .25 + c / (COLS * 2.2) + .4));
        if (!k) continue;
        ctx.beginPath(); ctx.moveTo(gx + c * tw, cy - gh / 2 * k); ctx.lineTo(gx + c * tw, cy + gh / 2 * k); ctx.stroke();
      }
    }

    // C. Tiles lift off in 3D, then D. dissolve into particles
    const FOCAL = 900;
    const tilePos = (t, lift) => {
      const z = t.z * lift;
      const sc = FOCAL / (FOCAL - z);
      const bx = gx + (t.c + .5) * tw, by = gy + (t.r + .5) * th;
      return {
        x: cx + (bx - cx + t.dx * S * .55 * lift) * sc,
        y: cy + (by - cy + t.dy * S * .45 * lift) * sc,
        sc, rot: t.rot * lift
      };
    };
    const tIn = seg(p, .3, .4);
    const dis = seg(p, .52, .66);
    if (tIn > 0 && dis < 1) {
      tiles.forEach(t => {
        const lift = ease(seg(p, .34 + t.delay * .2, .56));
        const fade = tIn * (1 - ease(seg(dis, t.delay * .6, t.delay * .6 + .4)));
        if (fade <= 0) return;
        const q = tilePos(t, lift);
        ctx.save();
        ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.scale(q.sc, q.sc);
        const w = tw * .82, h = th * .78;
        ctx.fillStyle = rgba(t.col, t.fill * fade * .55);
        ctx.strokeStyle = rgba(t.col, .7 * fade);
        ctx.lineWidth = 1 / q.sc;
        ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 6); ctx.fill(); ctx.stroke();
        if (t.fill < .5) {           // "content" bars on the glass panels
          ctx.fillStyle = rgba(INK, .35 * fade);
          ctx.fillRect(-w * .36, -h * .18, w * .5, 2); ctx.fillRect(-w * .36, h * .06, w * .32, 2);
        }
        ctx.restore();
      });
    }

    // D. Particles stream into the cube
    const stream = seg(p, .5, .72);
    if (stream > 0 && stream < 1) {
      parts.forEach(pt => {
        const k = ease(seg(stream, pt.d, pt.d + .6));
        const q = tilePos(pt.t, ease(seg(p, .34 + pt.t.delay * .2, .56)));
        const sx = q.x + (pt.ox - .5) * tw * q.sc, sy = q.y + (pt.oy - .5) * th * q.sc;
        const mx = lerp(sx, cx, .5) + pt.bend * S * .18, my = lerp(sy, cy, .5) - pt.bend * S * .1;
        const x = (1 - k) * (1 - k) * sx + 2 * (1 - k) * k * mx + k * k * cx;
        const y = (1 - k) * (1 - k) * sy + 2 * (1 - k) * k * my + k * k * cy;
        const a = Math.sin(Math.PI * clamp(stream * 1.4)) * (1 - k * .6);
        ctx.fillStyle = rgba(pt.col, a);
        ctx.fillRect(x, y, pt.s * 1.4, pt.s * 1.4);
      });
    }

    // The cube (the repository)
    const cubeIn = seg(p, .6, .7), split = ease(seg(p, .74, .84));
    if (cubeIn > 0 && split < 1) {
      const size = S * .09 * (1 + split * .3);
      const ang = p * 9;
      const V = [];
      for (const X of [-1, 1]) for (const Y of [-1, 1]) for (const Z of [-1, 1]) {
        let x = X, y = Y, z = Z;
        const c1 = Math.cos(ang), s1 = Math.sin(ang), c2 = Math.cos(.6), s2 = Math.sin(.6);
        [x, z] = [x * c1 - z * s1, x * s1 + z * c1];
        [y, z] = [y * c2 - z * s2, y * s2 + z * c2];
        const off = X * split * S * .22;
        const sc = 3 / (3 + z);
        V.push([cx + x * size * sc + off, cy + y * size * sc]);
      }
      const E = [[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
      ctx.lineWidth = 1.4;
      ctx.shadowColor = ACC; ctx.shadowBlur = 18;
      ctx.strokeStyle = rgba(ACC, ease(cubeIn) * (1 - split));
      E.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(V[a][0], V[a][1]); ctx.lineTo(V[b][0], V[b][1]); ctx.stroke(); });
      ctx.shadowBlur = 0;
      // core glow
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 1.6);
      core.addColorStop(0, rgba(POP, .35 * cubeIn * (1 - split)));
      core.addColorStop(1, rgba(POP, 0));
      ctx.fillStyle = core; ctx.fillRect(cx - size * 2, cy - size * 2, size * 4, size * 4);
    }

    // E. Burst into a network of light, then F. pull into one bar
    const burst = seg(p, .74, .85), bar = ease(seg(p, .83, .93));
    if (burst > 0) {
      const R = Math.hypot(W, H) * .5;
      const pos = nodes.map(n => {
        const k = ease(seg(burst, n.d, n.d + .55));
        const fx = cx + Math.cos(n.a) * n.rr * R * k, fy = cy + Math.sin(n.a) * n.rr * R * .7 * k;
        const tx = cx + n.bx * W * .5 * .62, ty = cy + Math.min(H * .2, 150);
        return [lerp(fx, tx, bar), lerp(fy, ty, bar), k];
      });
      ctx.lineWidth = 1;
      links.forEach(([i, j]) => {
        const a = Math.min(pos[i][2], pos[j][2]) * .5 * Math.pow(1 - bar, 3);
        if (a <= .01) return;
        ctx.strokeStyle = rgba(ACC, a);
        ctx.beginPath(); ctx.moveTo(pos[i][0], pos[i][1]); ctx.lineTo(pos[j][0], pos[j][1]); ctx.stroke();
      });
      nodes.forEach((n, i) => {
        const [x, y, k] = pos[i];
        if (k <= 0) return;
        // spoke from the centre while bursting
        if (bar < .3 && k < 1) {
          ctx.strokeStyle = rgba(POP, .25 * (1 - k));
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
        }
        ctx.fillStyle = rgba(i % 3 ? POP : INK, .85 * k);
        ctx.beginPath(); ctx.arc(x, y, n.size * (1 - bar * .4), 0, Math.PI * 2); ctx.fill();
      });
      if (bar > 0) {
        const bw = W * .62 * bar, bh = 2 + 2 * bar;
        const lg = ctx.createLinearGradient(cx - bw / 2, 0, cx + bw / 2, 0);
        lg.addColorStop(0, rgba(ACC, 0)); lg.addColorStop(.3, rgba(ACC, .9 * bar));
        lg.addColorStop(.5, rgba(POP, 1 * bar)); lg.addColorStop(.7, rgba(ACC, .9 * bar)); lg.addColorStop(1, rgba(ACC, 0));
        ctx.shadowColor = ACC; ctx.shadowBlur = 30;
        ctx.fillStyle = lg; ctx.fillRect(cx - bw / 2, cy + Math.min(H * .2, 150) - bh / 2, bw, bh);
        ctx.shadowBlur = 0;
        // soft haze behind the title
        const haze = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * .6);
        haze.addColorStop(0, rgba(ACC, .12 * bar)); haze.addColorStop(1, rgba(ACC, 0));
        ctx.fillStyle = haze; ctx.fillRect(0, 0, W, H);
      }
    }
    ctx.restore();

    // Vignette + grain
    ctx.globalCompositeOperation = 'source-over';
    const vg = ctx.createRadialGradient(cx, cy, S * .35, cx, cy, Math.hypot(W, H) * .6);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.65)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (!reduce) {
      ctx.fillStyle = ctx.createPattern(grain, 'repeat');
      ctx.save(); ctx.translate((time * .7) % 160, (time * .45) % 160);
      ctx.fillRect(-160, -160, W + 320, H + 320); ctx.restore();
    }
  }

  // ---------- Scroll scrub ----------
  let target = 0, current = 0, visible = true, raf = 0;
  const readScroll = () => {
    const r = hero.getBoundingClientRect();
    const total = hero.offsetHeight - innerHeight;
    target = reduce ? 1 : clamp(-r.top / Math.max(total, 1));
  };
  const setCaptions = p => {
    caps.forEach(c => c.el.classList.toggle('is-on', p >= c.a && p < c.b));
    if (hint) hint.classList.toggle('is-gone', p > .03);
  };
  const frame = time => {
    raf = 0;
    current += (target - current) * .12;
    if (Math.abs(target - current) < .0004) current = target;
    draw(current, time);
    setCaptions(current);
    if (visible) raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!raf) raf = requestAnimationFrame(frame); };

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }).observe(hero);
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', () => { resize(); readScroll(); start(); });
  resize(); readScroll();
  if (reduce) current = 1;
  start();
})();
