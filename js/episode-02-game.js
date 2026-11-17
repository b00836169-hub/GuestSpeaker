// "Your AI HQ": Episode 02 game.
// Six scenes, each a different real gesture: drag, press-and-hold, tap,
// and drag-to-drop. Mounts into #ai-hq on the page.
(() => {
  const mount = document.getElementById('ai-hq');
  if (!mount || !mount.querySelector('#hq-stage')) return;
  const $ = s => mount.querySelector(s);
  const stage = $('#hq-stage'), cv = $('#hq-cv'), ctx = cv.getContext('2d');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = getComputedStyle(mount);
  const col = (name, fallback) => { const v = css.getPropertyValue(name).trim(); return /^#[0-9a-f]{6}$/i.test(v) ? v : fallback; };
  const COL = { ink: col('--ink', '#f2eee6'), mute: col('--mute', '#a7a6b4'), acc: col('--acc', '#ff5a36'), pop: col('--pop', '#ffc94a'), deep: '#06070d', card: 'rgba(242,238,230,.06)' };
  const SANS = '"Bricolage Grotesque", system-ui, sans-serif', SERIF = 'Newsreader, Georgia, serif', MONO = '"JetBrains Mono", ui-monospace, monospace';
  const rgba = (h, a) => { const n = parseInt(h.replace('#', ''), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const lerp = (a, b, t) => a + (b - a) * t;

  let W = 0, H = 0, dpr = 1;
  function resize() {
    const r = stage.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    SCENES.forEach(s => s.layout && s.layout());
  }

  /* ---------- draw helpers ---------- */
  function rr(x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  function glowDot(x, y, r, color, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  function glass(x, y, w, h, r, stroke) {
    rr(x, y, w, h, r);
    ctx.fillStyle = COL.card; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = stroke || rgba(COL.ink, .22); ctx.stroke();
  }
  function label(text, x, y, size, color, align = 'center', font = SANS, weight = 600) {
    ctx.font = `${weight} ${size}px ${font}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  /* ---------- shared state ---------- */
  let S = { mode: 'title', step: -1, playTime: 0, fx: [], parts: [] };
  function tag(text, x, y, color) { S.fx.push({ text, x, y, color, life: 0, max: 1 }); }
  function sparks(x, y, color, n = 16) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 120;
      S.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: .5 + Math.random() * .4, color });
    }
  }
  function stepFx(dt) {
    for (const f of S.fx) f.life += dt; S.fx = S.fx.filter(f => f.life < f.max);
    for (const p of S.parts) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .9; p.vy *= .9; }
    S.parts = S.parts.filter(p => p.life < p.max);
  }
  function drawFx() {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const p of S.parts) { const k = 1 - p.life / p.max; ctx.fillStyle = rgba(p.color, k); ctx.beginPath(); ctx.arc(p.x, p.y, 2.4 * k + .5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    for (const f of S.fx) {
      const k = f.life / f.max, a = k < .2 ? k / .2 : 1 - (k - .2) / .8;
      ctx.save(); ctx.globalAlpha = a; label(f.text, f.x, f.y - k * 26, 13, f.color, 'center', MONO, 500); ctx.restore();
    }
  }

  /* ================= SCENE 0: power up the team ================= */
  const S0 = {
    name: 'Power up', need: 6, nodes: [], core: { x: 0, y: 0, r: 0 }, drag: null,
    layout() {
      this.core = { x: W / 2, y: H / 2, r: Math.min(W, H) * .09 };
      const R = Math.min(W, H) * .33;
      this.nodes = Array.from({ length: 6 }, (_, i) => {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / 6);
        return { x: W / 2 + Math.cos(a) * R, y: H / 2 + Math.sin(a) * R, r: Math.min(W, H) * .06, lit: false };
      });
    },
    reset() { this.nodes.forEach(n => n.lit = false); this.drag = null; S.got = 0; },
    goal() { return `Powered <b>${S.got}/6</b>`; },
    hint: 'Drag a cable from the core to each desk.',
    onDown(p) { if (dist(p, this.core) < this.core.r * 1.4) this.drag = { x: p.x, y: p.y }; },
    onMove(p) { if (this.drag) { this.drag.x = p.x; this.drag.y = p.y; } },
    onUp(p) {
      if (!this.drag) return; this.drag = null;
      const n = this.nodes.find(n => !n.lit && dist(p, n) < n.r * 1.6);
      if (n) { n.lit = true; S.got++; sparks(n.x, n.y, COL.acc, 18); tag('Powered', n.x, n.y - n.r, COL.acc); if (S.got === this.need) done(); }
    },
    draw() {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const n of this.nodes) { ctx.strokeStyle = rgba(COL.ink, n.lit ? .35 : .12); ctx.lineWidth = n.lit ? 2 : 1; ctx.beginPath(); ctx.moveTo(this.core.x, this.core.y); ctx.lineTo(n.x, n.y); ctx.stroke(); }
      if (this.drag) { ctx.strokeStyle = rgba(COL.acc, .8); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(this.core.x, this.core.y); ctx.lineTo(this.drag.x, this.drag.y); ctx.stroke(); }
      glowDot(this.core.x, this.core.y, this.core.r * 2.4, COL.acc, .5);
      ctx.restore();
      glass(this.core.x - this.core.r, this.core.y - this.core.r, this.core.r * 2, this.core.r * 2, this.core.r, rgba(COL.acc, .7));
      label('CORE', this.core.x, this.core.y, 11, COL.acc, 'center', MONO, 500);
      for (const n of this.nodes) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        if (n.lit) glowDot(n.x, n.y, n.r * 2.2, COL.acc, .55);
        ctx.restore();
        glass(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2, n.r, n.lit ? rgba(COL.acc, .9) : rgba(COL.ink, .25));
        label(n.lit ? '●' : '○', n.x, n.y, n.r * .9, n.lit ? COL.acc : rgba(COL.ink, .4));
      }
    }
  };

  /* ================= SCENE 1: carry the brief ================= */
  const S1 = {
    name: 'Carry the brief', need: 1, folder: { x: 0, y: 0, w: 0, h: 0, home: null }, desk: { x: 0, y: 0, w: 0, h: 0 }, grabbed: false, offset: { x: 0, y: 0 },
    layout() {
      this.folder.w = Math.min(W, H) * .22; this.folder.h = this.folder.w * .72;
      this.folder.home = { x: W * .18, y: H * .55 };
      this.folder.x = this.folder.home.x; this.folder.y = this.folder.home.y;
      this.desk.w = Math.min(W, H) * .3; this.desk.h = this.desk.w * .62;
      this.desk.x = W * .78; this.desk.y = H * .55;
    },
    reset() { this.layout(); this.grabbed = false; S.got = 0; },
    goal() { return S.got ? 'Delivered' : '<b>Drag</b> to the desk'; },
    hint: 'Drag the brief folder to the Brief Writer’s desk.',
    hit(p) { return Math.abs(p.x - this.folder.x) < this.folder.w / 2 && Math.abs(p.y - this.folder.y) < this.folder.h / 2; },
    onDown(p) { if (this.hit(p)) { this.grabbed = true; this.offset = { x: p.x - this.folder.x, y: p.y - this.folder.y }; } },
    onMove(p) { if (this.grabbed) { this.folder.x = p.x - this.offset.x; this.folder.y = p.y - this.offset.y; } },
    onUp() {
      if (!this.grabbed) return; this.grabbed = false;
      const dx = Math.abs(this.folder.x - this.desk.x), dy = Math.abs(this.folder.y - this.desk.y);
      if (dx < this.desk.w / 2 && dy < this.desk.h / 2) { S.got = 1; sparks(this.desk.x, this.desk.y, COL.acc, 20); tag('Delivered', this.desk.x, this.desk.y - this.desk.h / 2, COL.acc); done(); }
      else { this.folder.x = this.folder.home.x; this.folder.y = this.folder.home.y; }
    },
    draw() {
      glass(this.desk.x - this.desk.w / 2, this.desk.y - this.desk.h / 2, this.desk.w, this.desk.h, 10, rgba(COL.ink, .25));
      label('BRIEF WRITER', this.desk.x, this.desk.y, 12, COL.mute, 'center', MONO, 500);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(this.folder.x, this.folder.y, this.folder.w, COL.acc, this.grabbed ? .4 : .22); ctx.restore();
      glass(this.folder.x - this.folder.w / 2, this.folder.y - this.folder.h / 2, this.folder.w, this.folder.h, 8, rgba(COL.acc, .8));
      label('BRIEF', this.folder.x, this.folder.y, 13, COL.acc, 'center', MONO, 500);
    }
  };

  /* ================= SCENE 2: fresh eyes ================= */
  const S2 = {
    name: 'Fresh eyes', need: 3, lines: [], lens: { x: 0, y: 0, r: 0 }, dragging: false,
    layout() {
      const pw = Math.min(W * .62, 520), x0 = W / 2 - pw / 2, y0 = H * .32;
      this.lines = [0, 1, 2].map((i) => ({ x: x0, y: y0 + i * 44, w: pw * (0.7 + (i % 2) * .2), struck: false }));
      this.lens = { x: W / 2, y: H * .78, r: Math.min(W, H) * .07 };
    },
    reset() { this.lines.forEach(l => l.struck = false); this.dragging = false; S.got = 0; },
    goal() { return `Fixed <b>${S.got}/3</b>`; },
    hint: 'Drag the lens over each weak line.',
    onDown(p) { if (dist(p, this.lens) < this.lens.r * 1.5) this.dragging = true; },
    onMove(p) {
      if (!this.dragging) return; this.lens.x = p.x; this.lens.y = p.y;
      for (const l of this.lines) {
        if (l.struck) continue;
        if (this.lens.y > l.y - 16 && this.lens.y < l.y + 16 && this.lens.x > l.x && this.lens.x < l.x + l.w) {
          l.struck = true; S.got++; sparks(this.lens.x, this.lens.y, COL.acc, 16); tag('Fixed', this.lens.x, l.y - 18, COL.acc);
          if (S.got === this.need) done();
        }
      }
    },
    onUp() { this.dragging = false; },
    draw() {
      for (const l of this.lines) {
        glass(l.x, l.y - 14, l.w, 28, 6, rgba(COL.ink, .18));
        ctx.save();
        for (let i = 0; i < 3; i++) { ctx.fillStyle = rgba(COL.ink, l.struck ? .18 : .4); ctx.fillRect(l.x + 14, l.y - 7 + i * 7, l.w * (0.8 - i * .18), 2); }
        if (l.struck) { ctx.strokeStyle = rgba(COL.acc, .9); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(l.x + 8, l.y); ctx.lineTo(l.x + l.w - 8, l.y); ctx.stroke(); }
        ctx.restore();
      }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(this.lens.x, this.lens.y, this.lens.r * 2, COL.acc, this.dragging ? .4 : .2); ctx.restore();
      ctx.strokeStyle = rgba(COL.acc, .9); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(this.lens.x, this.lens.y, this.lens.r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(this.lens.x + this.lens.r * .7, this.lens.y + this.lens.r * .7); ctx.lineTo(this.lens.x + this.lens.r * 1.3, this.lens.y + this.lens.r * 1.3); ctx.stroke();
    }
  };

  /* ================= SCENE 3: approve (press and hold) ================= */
  const S3 = {
    name: 'Approve', need: 1, stamp: { x: 0, y: 0, r: 0 }, charge: 0, holding: false, slam: 0,
    layout() { this.stamp = { x: W / 2, y: H * .42, r: Math.min(W, H) * .11 }; },
    reset() { this.charge = 0; this.holding = false; this.slam = 0; S.got = 0; },
    goal() { return S.got ? 'Approved' : 'Press &amp; <b>hold</b>'; },
    hint: 'Press and hold the stamp, then let go.',
    onDown(p) { if (dist(p, this.stamp) < this.stamp.r * 1.4) this.holding = true; },
    onMove() {},
    onUp() {
      this.holding = false;
      if (this.charge >= 1 && !S.got) { S.got = 1; this.slam = 1; sparks(this.stamp.x, this.stamp.y + this.stamp.r, COL.acc, 26); tag('Approved', this.stamp.x, this.stamp.y - this.stamp.r, COL.acc); done(); }
      else this.charge = 0;
    },
    update(dt) { if (this.holding && this.charge < 1) this.charge = Math.min(1, this.charge + dt / 0.75); if (this.slam > 0) this.slam = Math.max(0, this.slam - dt * 2); },
    draw() {
      glass(this.stamp.x - 90, this.stamp.y + this.stamp.r + 18, 180, 50, 8, rgba(COL.ink, .2));
      label('STRATEGY', this.stamp.x, this.stamp.y + this.stamp.r + 43, 11, COL.mute, 'center', MONO, 500);
      const drop = this.slam * 10;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(this.stamp.x, this.stamp.y, this.stamp.r * (1.6 + this.charge), COL.acc, .2 + this.charge * .4); ctx.restore();
      ctx.save(); ctx.translate(0, drop);
      glass(this.stamp.x - this.stamp.r, this.stamp.y - this.stamp.r, this.stamp.r * 2, this.stamp.r * 2, 12, rgba(COL.acc, .8));
      label('STAMP', this.stamp.x, this.stamp.y, 12, COL.acc, 'center', MONO, 500);
      ctx.restore();
      if (this.charge > 0 && this.charge < 1) {
        ctx.strokeStyle = rgba(COL.acc, .9); ctx.lineWidth = 4; ctx.beginPath();
        ctx.arc(this.stamp.x, this.stamp.y, this.stamp.r + 16, -Math.PI / 2, -Math.PI / 2 + this.charge * Math.PI * 2); ctx.stroke();
      }
    }
  };

  /* ================= SCENE 4: style the shoot ================= */
  const S4 = {
    name: 'Style the shoot', need: 2, bag: null, plinth: null, backdrops: [], chosen: -1, grabbed: false,
    layout() {
      this.bag = { x: W * .18, y: H * .72, w: Math.min(W, H) * .16, home: null };
      this.bag.home = { x: this.bag.x, y: this.bag.y };
      this.plinth = { x: W / 2, y: H * .42, r: Math.min(W, H) * .16 };
      const bw = Math.min(W, H) * .11;
      this.backdrops = [0, 1, 2].map(i => ({ x: W * .72, y: H * (.28 + i * .24), r: bw, on: false }));
    },
    reset() { this.chosen = -1; this.backdrops.forEach(b => b.on = false); this.bag.x = this.bag.home.x; this.bag.y = this.bag.home.y; this.grabbed = false; S.got = 0; },
    goal() { return `Styled <b>${S.got}/2</b>`; },
    hint: 'Pick a backdrop, then drag the bag onto the plinth.',
    hitBag(p) { return dist(p, this.bag) < this.bag.w * .7; },
    onDown(p) {
      const b = this.backdrops.find(b => dist(p, b) < b.r * 1.3);
      if (b && !b.on) { this.backdrops.forEach(x => x.on = false); b.on = true; if (this.chosen < 0) { S.got++; } this.chosen = this.backdrops.indexOf(b); sparks(b.x, b.y, COL.acc, 14); if (S.got === this.need) done(); return; }
      if (this.hitBag(p)) this.grabbed = true;
    },
    onMove(p) { if (this.grabbed) { this.bag.x = p.x; this.bag.y = p.y; } },
    onUp() {
      if (!this.grabbed) return; this.grabbed = false;
      if (dist(this.bag, this.plinth) < this.plinth.r) {
        this.bag.x = this.plinth.x; this.bag.y = this.plinth.y - this.plinth.r * .3;
        if (this.bag.placed !== true) { this.bag.placed = true; S.got++; sparks(this.plinth.x, this.plinth.y, COL.acc, 20); tag('Styled', this.plinth.x, this.plinth.y - this.plinth.r, COL.acc); if (S.got === this.need) done(); }
      } else { this.bag.x = this.bag.home.x; this.bag.y = this.bag.home.y; }
    },
    draw() {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(this.plinth.x, this.plinth.y, this.plinth.r * 1.6, COL.acc, .18); ctx.restore();
      ctx.strokeStyle = rgba(COL.ink, .22); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(this.plinth.x, this.plinth.y + this.plinth.r * .5, this.plinth.r, this.plinth.r * .3, 0, 0, Math.PI * 2); ctx.stroke();
      for (const b of this.backdrops) {
        glass(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2, 10, b.on ? rgba(COL.acc, .9) : rgba(COL.ink, .22));
        label(b.on ? '●' : '○', b.x, b.y, 14, b.on ? COL.acc : rgba(COL.ink, .4));
      }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(this.bag.x, this.bag.y, this.bag.w, COL.acc, this.grabbed ? .4 : .2); ctx.restore();
      glass(this.bag.x - this.bag.w / 2, this.bag.y - this.bag.w / 2, this.bag.w, this.bag.w, 10, rgba(COL.acc, .8));
      label('BAG', this.bag.x, this.bag.y, 12, COL.acc, 'center', MONO, 500);
    }
  };

  /* ================= SCENE 5: launch ================= */
  const S5 = {
    name: 'Launch', need: 1, ad: null, board: null, grabbed: false,
    layout() { this.ad = { x: W / 2, y: H * .78, w: Math.min(W, H) * .22, home: null }; this.ad.home = { x: this.ad.x, y: this.ad.y }; this.board = { x: W / 2, y: H * .2, w: W * .5, h: H * .22 }; },
    reset() { this.ad.x = this.ad.home.x; this.ad.y = this.ad.home.y; this.grabbed = false; S.got = 0; },
    goal() { return 'Drag <b>up</b> to launch'; },
    hint: 'Drag the ad up to the billboard.',
    onDown(p) { if (Math.abs(p.x - this.ad.x) < this.ad.w / 2 && Math.abs(p.y - this.ad.y) < this.ad.w * .32) this.grabbed = true; },
    onMove(p) { if (this.grabbed) { this.ad.x = p.x; this.ad.y = p.y; } },
    onUp() {
      if (!this.grabbed) return; this.grabbed = false;
      if (Math.abs(this.ad.x - this.board.x) < this.board.w / 2 && Math.abs(this.ad.y - this.board.y) < this.board.h) {
        S.got = 1; sparks(this.board.x, this.board.y, COL.acc, 36); tag('Launched', this.board.x, this.board.y, COL.acc); done();
      } else { this.ad.x = this.ad.home.x; this.ad.y = this.ad.home.y; }
    },
    draw() {
      glass(this.board.x - this.board.w / 2, this.board.y - this.board.h / 2, this.board.w, this.board.h, 12, rgba(COL.ink, .3));
      label('BILLBOARD', this.board.x, this.board.y, 13, COL.mute, 'center', MONO, 500);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(this.ad.x, this.ad.y, this.ad.w, COL.acc, this.grabbed ? .45 : .2); ctx.restore();
      glass(this.ad.x - this.ad.w / 2, this.ad.y - this.ad.w * .32, this.ad.w, this.ad.w * .64, 10, rgba(COL.acc, .85));
      label('THE AD', this.ad.x, this.ad.y, 13, COL.acc, 'center', MONO, 500);
    }
  };

  const SCENES = [S0, S1, S2, S3, S4, S5];
  SCENES.forEach(s => { if (!s.update) s.update = () => {}; });

  /* ---------- HUD / flow ---------- */
  const track = $('#hq-track'); track.innerHTML = SCENES.map(() => '<i></i>').join('');
  function hud() {
    if (S.step < 0) return;
    const Z = SCENES[S.step];
    $('#hq-zone-name').innerHTML = `<span>0${S.step + 1} / 0${SCENES.length}</span> · ${Z.name}`;
    $('#hq-goal').innerHTML = Z.goal();
    [...track.children].forEach((el, i) => { el.className = i < S.step ? 'done' : i === S.step ? 'on' : ''; });
  }
  let capTimer = 0;
  function say(text) {
    $('#hq-cap-text').textContent = text;
    const c = $('#hq-caption'); c.classList.add('show');
    clearTimeout(capTimer); capTimer = setTimeout(() => c.classList.remove('show'), 2400);
  }
  function startStep(i) {
    S.step = i; SCENES[i].reset(); hud();
    setTimeout(() => { if (S.mode === 'play' && S.step === i) say(SCENES[i].hint); }, 500);
  }
  function done() {
    if (S.step === SCENES.length - 1) { finish(); return; }
    setTimeout(() => { if (S.mode === 'play') startStep(S.step + 1); }, 650);
  }
  function finish() {
    S.mode = 'end';
    $('#hq-hud').hidden = true; $('#hq-end-screen').hidden = false;
    $('#hq-again-btn').focus({ preventScroll: true });
  }
  function start() {
    S = { mode: 'play', step: -1, playTime: 0, fx: [], parts: [] };
    $('#hq-cover-screen').hidden = true; $('#hq-end-screen').hidden = true; $('#hq-pause-screen').hidden = true; $('#hq-hud').hidden = false;
    startStep(0);
  }

  /* ---------- loop ---------- */
  let last = performance.now(), visible = true;
  function update(dt) {
    S.playTime += dt; stepFx(dt);
    if (S.step >= 0 && S.step < SCENES.length) { SCENES[S.step].update(dt); hud(); }
  }
  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b0c17'); g.addColorStop(1, COL.deep);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (S.step >= 0 && S.step < SCENES.length) SCENES[S.step].draw();
    drawFx();
  }
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (visible && S.mode === 'play') update(dt);
    try { render(); } catch (err) { /* keep looping */ }
    requestAnimationFrame(frame);
  }

  /* ---------- input ---------- */
  function pos(e) { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  cv.addEventListener('pointerdown', e => { if (S.mode === 'play' && S.step >= 0) { cv.setPointerCapture(e.pointerId); SCENES[S.step].onDown(pos(e)); } });
  cv.addEventListener('pointermove', e => { if (S.mode === 'play' && S.step >= 0) SCENES[S.step].onMove(pos(e)); });
  cv.addEventListener('pointerup', e => { if (S.mode === 'play' && S.step >= 0) SCENES[S.step].onUp(pos(e)); });
  cv.addEventListener('pointercancel', e => { if (S.mode === 'play' && S.step >= 0) SCENES[S.step].onUp(pos(e)); });

  function pause(on) {
    if (on && S.mode === 'play') { S.mode = 'paused'; $('#hq-pause-screen').hidden = false; $('#hq-resume-btn').focus({ preventScroll: true }); }
    else if (!on && S.mode === 'paused') { S.mode = 'play'; $('#hq-pause-screen').hidden = true; last = performance.now(); }
  }
  addEventListener('keydown', e => { if (S.mode === 'play' && e.key === 'Escape') pause(true); else if (S.mode === 'paused' && e.key === 'Escape') pause(false); });

  $('#hq-play-btn').addEventListener('click', start);
  $('#hq-again-btn').addEventListener('click', start);
  $('#hq-pause-btn').addEventListener('click', () => pause(true));
  $('#hq-resume-btn').addEventListener('click', () => pause(false));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(true); });
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (!visible) pause(true); }, { threshold: .25 }).observe(stage);
  new ResizeObserver(resize).observe(stage);

  resize();
  requestAnimationFrame(frame);
})();
