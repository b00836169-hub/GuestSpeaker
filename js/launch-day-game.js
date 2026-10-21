// "Launch Day Run": Episode 01 game.
// A three-lane runner across five zones: Claude chat, Claude Design,
// Claude Code, GitHub and Vercel. Mounts into #launch-day on the page.
// Keys only control the game while it is being played, so the arrow keys
// and space still scroll the page at all other times.
(() => {
  const mount = document.getElementById('launch-day');
  if (!mount || !mount.querySelector('#ld-stage')) return;
  const $ = s => mount.querySelector(s);
  const stage = $('#ld-stage'), cv = $('#ld-cv'), ctx = cv.getContext('2d');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = getComputedStyle(mount);
  const siteCol = (name, fallback) => { const v = css.getPropertyValue(name).trim(); return /^#[0-9a-f]{6}$/i.test(v) ? v : fallback; };
  const COL = {
    ink: siteCol('--ink', '#f2eee6'), mute: siteCol('--mute', '#a7a6b4'), acc: siteCol('--acc', '#ff5a36'), pop: siteCol('--pop', '#ffc94a'),
    red: '#ff2e63', cyan: '#3df5ff', teal: '#4fd1c5', green: '#5ee08a'
  };
  const SANS = '"Bricolage Grotesque", system-ui, sans-serif', SERIF = 'Newsreader, Georgia, serif', MONO = '"JetBrains Mono", ui-monospace, monospace';
  const SPAWN = 46, FAR = 72, EDGE = 1.5;
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

  function makeGlow(col) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, rgba(col, 1)); gr.addColorStop(.18, rgba(col, .55)); gr.addColorStop(.5, rgba(col, .12)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c;
  }
  const G = {}; for (const k of ['ink', 'acc', 'pop', 'red', 'cyan', 'teal']) G[k] = makeGlow(COL[k]);
  function glow(spr, x, y, rx, ry, a) { if (a <= 0) return; ctx.globalAlpha = a; ctx.drawImage(spr, x - rx, y - ry, rx * 2, ry * 2); ctx.globalAlpha = 1; }

  let W = 0, H = 0, K = 0, HOR = 0, BASE = 0, CX = 0, dpr = 1, vignette = null, towers = [], dust = [];

  function resize() {
    const r = stage.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    K = Math.min(W * (W < 640 ? 0.34 : 0.28), H * 0.44); HOR = H * 0.4; BASE = H * 0.9; CX = W / 2;
    vignette = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.3, W / 2, H * 0.55, Math.hypot(W, H) * 0.62);
    vignette.addColorStop(0, 'rgba(6,7,13,0)'); vignette.addColorStop(1, 'rgba(6,7,13,.85)');
    towers = []; const n = Math.round(W / 26);
    for (let i = 0; i < n; i++) towers.push({ x: (i + Math.random() * .6) / n, h: Math.pow(Math.random(), 2.2) * H * 0.16 + 4, ph: Math.random() * 6, w: Math.random() < .2 ? 2 : 1 });
    dust = []; for (let i = 0; i < 150; i++) dust.push(newDust(Math.random() * SPAWN));
  }
  function newDust(z) { return { x: (Math.random() - .5) * 14, y: Math.random() * 3.2 + .05, z, b: .3 + Math.random() * .7 }; }

  const T = z => 1 / (1 + Math.max(z, -0.9) * 0.15);
  const P = (wx, z) => { const t = T(z); return { x: CX + wx * K * t, y: HOR + (BASE - HOR) * t, s: K * t, t }; };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const row = (items, spacing = 9) => ({ kind: 'row', items, spacing });
  const gate = (title, opts, correct, right, wrongMap) => ({ kind: 'gate', title, opts, correct, right, wrongMap, spacing: 12 });

  const ZONES = [
    { name: 'Claude', it: 'chat', sub: 'Collect a strong prompt. Avoid the vague words.', need: 6,
      goal: g => `Prompt <b>${g}/6</b>`, intro: 'First, I tell Claude exactly what I want.',
      done: 'Role, goal, audience, style, pages, features. That is a real prompt.',
      build: () => { const Gd = ['Role', 'Goal', 'Audience', 'Style', 'Pages', 'Features'], B = ['Make it nice', 'Add stuff', 'Modern-ish', 'Idk, cool?', 'Vibes only', 'Like, a site'];
        return Gd.map((g, i) => row([{ t: 'token', label: g }, { t: 'bad', label: B[i] }])); } },
    { name: 'Claude', it: 'Design', sub: 'Pick up the look. Then find the handoff.', need: 3,
      goal: g => g < 3 ? `Look <b>${g}/3</b>` : 'Find the <b>handoff</b>', intro: 'Next, I shape how the site looks.',
      done: 'The design is on its way to Claude Code.',
      build: () => [
        row([{ t: 'token', label: 'Colours' }, { t: 'bad', label: 'Rainbow text' }]),
        row([{ t: 'token', label: 'Typography' }, { t: 'bad', label: 'Comic Sans' }]),
        row([{ t: 'token', label: 'Layout' }, { t: 'bad', label: 'Clip art' }]),
        gate('Share menu', ['Download image', 'Export as PDF', 'Handoff to Claude Code'], 2, 'Handoff sends my design straight into Claude Code.',
          { 'Download image': 'That is a picture, not a working site.', 'Export as PDF': 'A PDF is not a website. I need the handoff.' })] },
    { name: 'Claude', it: 'Code', sub: 'Collect the three files. Jump the bugs.', need: 3,
      goal: g => `Files <b>${g}/3</b>`, intro: 'Claude Code turns the design into real files.',
      done: 'index.html holds the words, styles.css the look, script.js the clicks.',
      build: () => [
        row([{ t: 'bug' }, { t: 'file', label: 'index.html', c: 'pop' }]),
        row([{ t: 'bug' }, { t: 'bug' }, { t: 'file', label: 'styles.css', c: 'teal' }]),
        row([{ t: 'bug', lane: 0 }, { t: 'bug', lane: 1 }, { t: 'bug', lane: 2 }], 11),
        row([{ t: 'file', label: 'script.js', c: 'acc' }, { t: 'bug' }])] },
    { name: 'Git', it: 'Hub', sub: 'Save it first. Then send it.', need: 0,
      goal: g => g ? 'Now <b>push</b>' : '<b>Commit</b> first', intro: 'Time to store the code on GitHub.',
      done: 'My code is on GitHub. It is not a website yet.',
      build: () => [
        gate('GitHub', ['Push', 'Commit', 'Delete repo'], 1, 'Commit saves a snapshot on my computer.',
          { 'Push': 'Nothing to push yet. I have to commit first.', 'Delete repo': 'Never delete the repo.' }),
        gate('GitHub', ['Clone', 'Fork', 'Push'], 2, 'Push sends my commits up to GitHub.',
          { 'Clone': 'Clone copies a repo down. I need to send mine up.', 'Fork': 'Fork copies someone else’s repo. I need to send mine.' })] },
    { name: 'Go', it: 'live', sub: 'Vercel turns the code into a link.', need: 0,
      goal: () => 'Go <b>live</b>', intro: 'Last stop: Vercel puts it online.',
      done: 'Vercel is building the site. Run into the light.',
      build: () => [gate('Vercel', ['Upload by hand', 'Import Git repo', 'Email a zip'], 1, 'Vercel reads my repo and builds the site.',
        { 'Upload by hand': 'No more manual uploads. Vercel reads GitHub.', 'Email a zip': 'Mei needs a link, not a zip file.' })] }
  ];

  let S;
  function fresh(mode) {
    S = { mode, t: 0, dist: 0, speed: 11, sp: 7, slow: 0, boost: 0, shake: 0, glitch: 0, flash: 0, flashCol: 'pop', zone: -1, queue: [], objs: [], gap: 0, got: 0,
      lane: 1, px: 0, jump: 0, vy: 0, stumble: 0, fx: [], parts: [], rings: [], hist: [], shown: {}, zoneDone: false, next: 0, bannerT: 0, playTime: 0, title: null };
  }
  fresh('title');

  /* HUD */
  const track = $('#ld-track'); track.innerHTML = ZONES.map(() => '<i></i>').join('');
  function hud() {
    if (S.zone < 0) return;
    const Z = ZONES[S.zone];
    $('#ld-zone-name').innerHTML = `<span>0${S.zone + 1} / 05</span> · ${Z.name}${Z.name === 'Git' ? '' : ' '}${Z.it}`;
    $('#ld-goal').innerHTML = Z.goal(S.got);
    [...track.children].forEach((el, i) => { el.className = i < S.zone || (i === S.zone && S.zoneDone) ? 'done' : i === S.zone ? 'on' : ''; });
  }
  let capTimer = 0;
  function say(text) {
    $('#ld-cap-text').textContent = text;
    const c = $('#ld-caption'); c.classList.add('show');
    clearTimeout(capTimer); capTimer = setTimeout(() => c.classList.remove('show'), 2400 + text.length * 30);
  }
  function titleCard(i) {
    const Z = ZONES[i];
    $('#ld-card-num').textContent = `Zone 0${i + 1}`;
    $('#ld-card-ttl').innerHTML = `${Z.name}${Z.name === 'Git' ? '' : ' '}<span class="it">${Z.it}</span>`;
    $('#ld-card-sub').textContent = Z.sub;
    const c = $('#ld-card'); c.classList.remove('show'); void c.offsetWidth; c.classList.add('show');
  }

  /* Flow */
  function startZone(i) {
    S.zone = i; const Z = ZONES[i];
    S.queue = Z.build(); S.got = 0; S.zoneDone = false; S.bannerT = 1.6; S.gap = 3; S.next = 0;
    S.speed = 10.5 + i * 0.6;
    titleCard(i); hud();
    setTimeout(() => { if (S.mode === 'play' && S.zone === i) say(Z.intro); }, 1500);
  }
  function zoneComplete() {
    S.zoneDone = true; hud(); say(ZONES[S.zone].done);
    if (S.zone === ZONES.length - 1) S.objs.push({ t: 'portal', z: SPAWN, done: false, lane: 1 });
    else S.next = 1.4;
  }
  function spawn(b) {
    if (b.kind === 'gate') {
      const ord = shuffle([0, 1, 2]);
      S.objs.push({ t: 'gate', src: b, opts: ord.map(i => b.opts[i]), correctLane: ord.indexOf(b.correct), z: SPAWN, done: false });
      return;
    }
    const free = shuffle([0, 1, 2].filter(l => !b.items.some(it => it.lane === l)));
    if (b.items.length === 3 && b.items.every(it => it.t === 'bug')) { say('Bug wall ahead. Jump.'); S.shown.bug = 1; }
    for (const it of b.items) {
      const lane = it.lane != null ? it.lane : free.shift();
      S.objs.push({ ...it, lane, src: it, z: SPAWN, done: false, bob: Math.random() * 6, seed: Math.random() * 6 });
    }
  }
  function hurt(sec, g = 0.3) { S.slow = Math.max(S.slow, sec); if (!RM) { S.shake = 0.7; S.glitch = Math.max(S.glitch, g); } }

  function resolve(o, pl) {
    o.done = true;
    const p = P(pl - 1, 0.3), hy = p.y - 0.55 * p.s;
    if (o.t === 'token' || o.t === 'file') {
      if (o.lane === pl) {
        o.hit = true; S.got++;
        const c = o.t === 'file' ? o.c : 'pop';
        tag('+ ' + o.label, p.x, hy - K * 0.35, COL[c]); sparks(p.x, hy, COL[c], 22); ring(p.x, p.y, c); hud();
      } else {
        S.queue.push(row([{ t: o.t, label: o.label, c: o.c }]));
        if (!S.shown.miss) { say('Missed one. It will come round again.'); S.shown.miss = 1; }
      }
    } else if (o.t === 'bad') {
      if (o.lane === pl) {
        o.hit = true; tag('Too vague', p.x, hy - K * 0.35, COL.mute); hurt(0.6, 0.18);
        if (!S.shown.bad) { say('Too vague. Claude can’t build a feeling.'); S.shown.bad = 1; }
      }
    } else if (o.t === 'bug') {
      if (o.lane === pl && S.jump < 0.45) {
        o.hit = true; tag('Bug', p.x, hy - K * 0.35, COL.red); hurt(1, 0.35); S.stumble = 0.6; sparks(p.x, hy, COL.red, 16);
        if (!S.shown.bug) { say('Jump the bugs. Swipe up, tap the middle or press ↑.'); S.shown.bug = 1; }
      } else if (o.lane === pl) { tag('Clean jump', p.x, hy - K * 0.35, COL.ink); }
    } else if (o.t === 'gate') {
      o.picked = pl; o.ok = pl === o.correctLane;
      if (o.ok) {
        S.got++; S.boost = 1.2; S.flash = 1; S.flashCol = 'pop';
        S.title = { text: 'Correct.', col: COL.pop, life: 0, max: 1.3 };
        sparks(p.x, hy, COL.pop, 40); ring(p.x, p.y, 'pop'); ring(p.x, p.y, 'acc', 0.15);
        say(o.src.right); hud();
      } else {
        const lab = o.opts[pl];
        S.flash = 0.8; S.flashCol = 'red'; S.title = { text: 'Not quite.', col: COL.red, life: 0, max: 1.3 };
        hurt(1.4, 0.5); say((o.src.wrongMap && o.src.wrongMap[lab]) || 'Not that one.');
        S.queue.unshift(o.src); S.gap = 4;
      }
    } else if (o.t === 'portal') { finish(); }
  }

  function finish() {
    S.mode = 'end'; S.flash = 1.2; S.flashCol = 'pop';
    const s = Math.round(S.playTime), m = Math.floor(s / 60);
    $('#ld-end-time').innerHTML = `Shipped in <b>${m}:${String(s % 60).padStart(2, '0')}</b>`;
    $('#ld-hud').hidden = true; $('#ld-end-screen').hidden = false;
    $('#ld-again-btn').focus({ preventScroll: true });
  }
  function start() {
    fresh('play');
    $('#ld-cover-screen').hidden = true; $('#ld-end-screen').hidden = true; $('#ld-pause-screen').hidden = true; $('#ld-hud').hidden = false;
    startZone(0);
  }

  /* FX */
  function tag(text, x, y, color) { S.fx.push({ text: text.toUpperCase(), x, y, color, life: 0, max: 1.1 }); }
  function sparks(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (0.4 + Math.random()) * K * 2.4;
      S.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, life: 0, max: 0.5 + Math.random() * 0.5, color, len: 0.02 + Math.random() * 0.04 });
    }
  }
  function ring(x, y, c, delay = 0) { S.rings.push({ x, y, c, life: -delay, max: 0.7 }); }

  /* Update */
  function update(dt) {
    S.t += dt;
    S.flash = Math.max(0, S.flash - dt * 2.2); S.glitch = Math.max(0, S.glitch - dt);
    if (S.title) { S.title.life += dt; if (S.title.life > S.title.max) S.title = null; }
    if (S.mode !== 'play') {
      S.sp = 7; S.dist += dt * S.sp; S.lane = 1;
      S.px = Math.sin(S.t * 0.6) * 0.55;
      moveDust(dt * S.sp); stepFx(dt); pushHist(); return;
    }
    S.playTime += dt;
    const sp = S.speed * (S.slow > 0 ? 0.5 : 1) * (S.boost > 0 ? 1.4 : 1);
    S.sp += (sp - S.sp) * Math.min(1, dt * 5);
    S.slow = Math.max(0, S.slow - dt); S.boost = Math.max(0, S.boost - dt);
    S.shake = Math.max(0, S.shake - dt * 2.5); S.stumble = Math.max(0, S.stumble - dt);
    const dz = S.sp * dt; S.dist += dz;

    S.px += ((S.lane - 1) - S.px) * Math.min(1, dt * 13);
    if (S.jump > 0) { S.vy -= dt * 26; S.jump += S.vy * dt; if (S.jump <= 0) { S.jump = 0; S.vy = 0; ring(P(S.px, 0).x, P(S.px, 0).y, 'acc'); } }
    pushHist();

    S.gap -= dz;
    if (S.bannerT > 0) S.bannerT -= dt;
    else if (S.queue.length) {
      const needGap = S.queue[0].kind === 'gate' ? -5 : 0;
      if (S.gap <= needGap && !S.objs.some(o => o.t === 'gate' && !o.done)) { const b = S.queue.shift(); spawn(b); S.gap = b.spacing; }
    }
    const pl = Math.round(S.px + 1);
    for (const o of S.objs) { o.z -= dz; if (!o.done && o.z <= 0.35) resolve(o, pl); }
    if (S.mode !== 'play') return;
    S.objs = S.objs.filter(o => o.z > -1.2);
    if (S.zone >= 0 && !S.zoneDone && S.bannerT <= 0 && !S.queue.length && !S.objs.some(o => !o.done)) zoneComplete();
    if (S.next > 0) { S.next -= dt; if (S.next <= 0) startZone(S.zone + 1); }
    moveDust(dz); stepFx(dt);
  }
  function pushHist() { S.hist.push({ px: S.px, j: S.jump, t: S.t, sp: S.sp }); while (S.hist.length && S.t - S.hist[0].t > 0.32) S.hist.shift(); }
  function moveDust(dz) { for (const d of dust) { d.z -= dz; if (d.z < 0.3) Object.assign(d, newDust(SPAWN + Math.random() * 10)); } }
  function stepFx(dt) {
    for (const f of S.fx) f.life += dt; S.fx = S.fx.filter(f => f.life < f.max);
    for (const p of S.parts) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; } S.parts = S.parts.filter(p => p.life < p.max);
    for (const r of S.rings) r.life += dt; S.rings = S.rings.filter(r => r.life < r.max);
  }

  /* Draw helpers */
  function rr(x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  function line(a, b) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
  function fit(text, font, maxW, maxPx) { ctx.font = `${font.replace('$', 10)}`; const m = ctx.measureText(text).width || 1; return Math.min(maxPx, 10 * maxW / m); }
  function wrapText(text, maxW) {
    const words = text.split(' '), lines = []; let l = '';
    for (const w of words) { const t = l ? l + ' ' + w : w; if (ctx.measureText(t).width > maxW && l) { lines.push(l); l = w; } else l = t; }
    if (l) lines.push(l); return lines;
  }
  function glass(x, y, w, h, r, stroke, a = 1, dash) {
    rr(x, y, w, h, r);
    const g = ctx.createLinearGradient(x, y, x + w * 0.6, y + h);
    g.addColorStop(0, `rgba(242,238,230,${0.16 * a})`); g.addColorStop(1, `rgba(242,238,230,${0.03 * a})`);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = Math.max(1, w * 0.01); ctx.strokeStyle = stroke; if (dash) ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x + r, y + 0.5); ctx.lineTo(x + w * 0.55, y + 0.5); ctx.strokeStyle = `rgba(255,255,255,${0.5 * a})`; ctx.lineWidth = 1; ctx.stroke();
  }

  /* Scene */
  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, HOR);
    g.addColorStop(0, '#05060c'); g.addColorStop(1, '#121531');
    ctx.fillStyle = g; ctx.fillRect(-40, -40, W + 80, HOR + 40);
    ctx.save(); ctx.beginPath(); ctx.rect(-40, -40, W + 80, HOR + 40); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const k = ((S.t * 0.12 + i / 5) % 1), r = k * Math.max(W, H) * 0.9;
      ctx.strokeStyle = rgba(COL.pop, 0.12 * (1 - k)); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(CX, HOR, Math.max(0.1, r), Math.max(0.1, r * 0.42), 0, 0, Math.PI * 2); ctx.stroke();
    }
    glow(G.acc, CX, HOR, W * 0.75, H * 0.32, 0.55);
    glow(G.pop, CX, HOR, W * 0.28, H * 0.1, 0.5);
    for (const tw of towers) {
      const x = tw.x * W + (CX - W / 2) * 0.3, a = 0.18 + 0.22 * (0.5 + 0.5 * Math.sin(S.t * 1.4 + tw.ph));
      const d = Math.abs(x - CX) / (W / 2), h = tw.h * (1 - d * 0.5);
      ctx.fillStyle = `rgba(242,238,230,${a * (1 - d * 0.6)})`; ctx.fillRect(x, HOR - h, tw.w, h);
      ctx.fillStyle = rgba(COL.pop, a * 1.6); ctx.fillRect(x - 0.5, HOR - h - 2, tw.w + 1, 2);
    }
    ctx.restore();
    const hl = ctx.createLinearGradient(0, 0, W, 0);
    hl.addColorStop(0, 'rgba(255,201,74,0)'); hl.addColorStop(0.5, 'rgba(255,220,150,.95)'); hl.addColorStop(1, 'rgba(255,201,74,0)');
    ctx.fillStyle = hl; ctx.fillRect(0, HOR - 0.5, W, 1.5);
  }

  function drawFloor() {
    const g = ctx.createLinearGradient(0, HOR, 0, H);
    g.addColorStop(0, '#191b3a'); g.addColorStop(0.18, '#0c0e1f'); g.addColorStop(1, '#05060b');
    ctx.fillStyle = g; ctx.fillRect(-40, HOR, W + 80, H - HOR + 40);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(G.acc, CX, HOR + 4, W * 0.6, (BASE - HOR) * 0.35, 0.28);
    const fade = (a) => { const lg = ctx.createLinearGradient(0, H, 0, HOR); lg.addColorStop(0, `rgba(242,238,230,${a})`); lg.addColorStop(0.75, `rgba(242,238,230,${a * 0.35})`); lg.addColorStop(1, 'rgba(242,238,230,0)'); return lg; };
    ctx.lineWidth = 1;
    ctx.strokeStyle = fade(0.07);
    for (let wx = -8; wx <= 8; wx += 0.5) { if (Math.abs(wx) <= EDGE) continue; line(P(wx, -0.9), P(wx, FAR)); }
    for (let i = 0; ; i++) {
      const z = i * 2 - (S.dist % 2); if (z > FAR) break; if (z < -0.9) continue;
      const a = P(-8, z), b = P(8, z), t = a.t;
      ctx.strokeStyle = `rgba(242,238,230,${0.05 + 0.06 * t})`; line(a, b);
      ctx.strokeStyle = `rgba(242,238,230,${0.05 + 0.14 * t})`; line(P(-EDGE, z), P(EDGE, z));
    }
    ctx.strokeStyle = fade(0.32);
    for (const lx of [-0.5, 0.5]) line(P(lx, -0.9), P(lx, FAR));
    for (const ex of [-EDGE, EDGE]) {
      const lg = ctx.createLinearGradient(0, H, 0, HOR); lg.addColorStop(0, rgba(COL.acc, 0.9)); lg.addColorStop(0.8, rgba(COL.acc, 0.35)); lg.addColorStop(1, rgba(COL.acc, 0));
      ctx.strokeStyle = lg; ctx.lineWidth = 6; ctx.globalAlpha = 0.18; line(P(ex, -0.9), P(ex, FAR));
      ctx.globalAlpha = 1; ctx.lineWidth = 1.6; line(P(ex, -0.9), P(ex, FAR));
    }
    for (let k = 0; k < 6; k++) {
      const z = ((k * 11 - S.t * 34) % 66 + 66) % 66 - 2;
      for (const ex of [-EDGE, EDGE]) {
        const a = P(ex, z), b = P(ex, z + 2.2);
        ctx.strokeStyle = rgba(COL.pop, 0.9); ctx.lineWidth = Math.max(1.2, 3 * a.t); line(a, b);
        glow(G.pop, a.x, a.y, 14 * a.t + 3, 6 * a.t + 2, 0.7);
      }
    }
    ctx.restore();
  }

  function drawDust() {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const streak = S.sp > 12.5 && !RM;
    for (const d of dust) {
      const p = P(d.x, d.z); if (p.t < 0.05) continue;
      const y = p.y - d.y * p.s, a = d.b * Math.min(1, p.t * 2.4) * 0.7, sz = Math.max(0.7, p.t * 2.2);
      if (streak) { const q = P(d.x, d.z + 1.6); ctx.strokeStyle = `rgba(242,238,230,${a * 0.6})`; ctx.lineWidth = sz * 0.7; ctx.beginPath(); ctx.moveTo(p.x, y); ctx.lineTo(q.x, q.y - d.y * q.s); ctx.stroke(); }
      else { ctx.fillStyle = `rgba(242,238,230,${a})`; ctx.fillRect(p.x, y, sz, sz); }
    }
    ctx.restore();
  }

  function drawToken(o, p, good) {
    const s = p.s, w = s * 0.86, h = s * 0.34, x = p.x - w / 2, y = p.y - s * 0.62 - h / 2 + Math.sin(S.t * 2.6 + o.bob) * s * 0.03;
    const near = clamp(1.2 - o.z / 40, 0.3, 1);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (good) glow(G.pop, p.x, y + h / 2, w * 0.75, h * 1.4, 0.22 * near);
    glow(good ? G.pop : G.ink, p.x, p.y, w * 0.5, s * 0.08, good ? 0.35 : 0.08);
    ctx.restore();
    if (good) {
      glass(x, y, w, h, h * 0.22, `rgba(242,238,230,${0.75 * near})`, near);
      ctx.fillStyle = COL.pop; ctx.fillRect(x + h * 0.25, y + h * 0.3, Math.max(1.5, w * 0.014), h * 0.4);
    } else {
      glass(x, y, w, h, h * 0.22, `rgba(143,142,163,${0.45 * near})`, near * 0.35, [Math.max(2, s * 0.02), Math.max(2, s * 0.02)]);
    }
    const fs = fit(o.label, `600 $px ${SANS}`, w * 0.68, h * 0.46);
    if (fs < 5) return;
    ctx.font = `600 ${fs}px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tx = p.x + (good ? h * 0.12 : 0), ty = y + h * 0.53;
    if (good) { ctx.fillStyle = `rgba(242,238,230,${near})`; ctx.fillText(o.label, tx, ty); }
    else {
      const j = (Math.sin(S.t * 23 + o.seed) > 0.85) ? s * 0.02 : 0;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(COL.red, 0.45 * near); ctx.fillText(o.label, tx - 1.2 - j, ty);
      ctx.fillStyle = rgba(COL.cyan, 0.35 * near); ctx.fillText(o.label, tx + 1.2 + j, ty);
      ctx.restore();
      ctx.fillStyle = rgba(COL.mute, near); ctx.fillText(o.label, tx + j * 0.5, ty);
      const ms = Math.max(0, h * 0.2);
      if (ms > 6) { ctx.font = `500 ${ms}px ${MONO}`; ctx.fillStyle = rgba(COL.red, 0.8 * near); ctx.textAlign = 'left'; ctx.fillText('VAGUE', x + h * 0.2, y - ms * 0.8); }
    }
  }

  function drawFile(o, p) {
    const s = p.s, col = COL[o.c], w = s * 0.62, h = s * 0.72, x = p.x - w / 2, y = p.y - s * 0.62 - h / 2 + Math.sin(S.t * 2.4 + o.bob) * s * 0.03;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(G[o.c], p.x, y + h / 2, w * 0.95, h * 0.95, 0.3); glow(G[o.c], p.x, p.y, w * 0.6, s * 0.09, 0.4);
    ctx.restore();
    glass(x, y, w, h, s * 0.05, rgba(col, 0.85));
    ctx.fillStyle = col; ctx.fillRect(x + w * 0.12, y + h * 0.12, w * 0.76, Math.max(1.5, h * 0.025));
    ctx.fillStyle = 'rgba(242,238,230,.18)';
    for (let i = 0; i < 4; i++) ctx.fillRect(x + w * 0.12, y + h * (0.28 + i * 0.1), w * (0.7 - (i % 2) * 0.22), Math.max(1, h * 0.03));
    let fs = h * 0.22; if (fs > 7) { ctx.font = `500 ${fs}px ${MONO}`; ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('</>', p.x, y + h * 0.76); }
    fs = fit(o.label, `500 $px ${MONO}`, w * 1.3, s * 0.12);
    if (fs > 5) { ctx.font = `500 ${fs}px ${MONO}`; ctx.fillStyle = COL.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(o.label, p.x, y + h + fs * 0.5); }
  }

  function drawBug(o, p) {
    const s = p.s, cx = p.x, cy = p.y - s * 0.3;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(G.red, cx, cy, s * 0.65, s * 0.5, 0.5);
    ctx.strokeStyle = rgba(COL.red, 0.7); ctx.lineWidth = Math.max(1, s * 0.012);
    line(P(o.lane - 1 - 0.44, o.z), P(o.lane - 1 + 0.44, o.z));
    const shard = (dx, col, a) => {
      ctx.fillStyle = rgba(col, a);
      for (let i = 0; i < 6; i++) {
        const ang = o.seed + i * 1.05 + Math.sin(S.t * 3 + i) * 0.25, rad = s * (0.1 + (i % 3) * 0.045);
        const jx = Math.sin(S.t * 31 + i * 7) > 0.9 ? s * 0.05 : 0;
        const bx = cx + dx + jx + Math.cos(ang) * rad * 0.6, by = cy + Math.sin(ang) * rad * 0.6;
        ctx.beginPath(); ctx.moveTo(bx + Math.cos(ang) * rad, by + Math.sin(ang) * rad);
        ctx.lineTo(bx + Math.cos(ang + 2.3) * rad * 0.5, by + Math.sin(ang + 2.3) * rad * 0.5);
        ctx.lineTo(bx + Math.cos(ang - 2.3) * rad * 0.5, by + Math.sin(ang - 2.3) * rad * 0.5); ctx.closePath(); ctx.fill();
      }
    };
    shard(s * 0.025, COL.cyan, 0.45); shard(-s * 0.025, COL.red, 0.9);
    glow(G.ink, cx, cy, s * 0.12, s * 0.12, 0.7);
    ctx.restore();
    const fs = s * 0.09; if (fs > 6) { ctx.font = `500 ${fs}px ${MONO}`; ctx.fillStyle = COL.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ERR', cx, cy - s * 0.32); }
  }

  function drawGate(o) {
    const mid = P(0, o.z), s = mid.s, near = clamp(1.25 - o.z / 34, 0.25, 1);
    const pw = s * 0.9, ph = s * 1.2, top = mid.y - ph;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(242,238,230,${0.35 * near})`; ctx.lineWidth = Math.max(1, s * 0.012); line(P(-EDGE, o.z), P(EDGE, o.z));
    glow(G.pop, mid.x, mid.y, s * 1.6, s * 0.1, 0.25 * near);
    ctx.restore();
    const keys = ['←', '↑', '→'];
    for (let l = 0; l < 3; l++) {
      const p = P(l - 1, o.z), x = p.x - pw / 2;
      glass(x, top, pw, ph, s * 0.03, `rgba(242,238,230,${0.55 * near})`, near * 0.9);
      ctx.strokeStyle = rgba(COL.pop, near); ctx.lineWidth = Math.max(1.2, s * 0.016); const c = s * 0.09;
      for (const [cx, cy, sx, sy] of [[x, top, 1, 1], [x + pw, top, -1, 1], [x, top + ph, 1, -1], [x + pw, top + ph, -1, -1]]) {
        ctx.beginPath(); ctx.moveTo(cx, cy + sy * c); ctx.lineTo(cx, cy); ctx.lineTo(cx + sx * c, cy); ctx.stroke();
      }
      const ks = s * 0.09; if (ks > 6) { ctx.font = `500 ${ks}px ${MONO}`; ctx.fillStyle = rgba(COL.pop, near); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(keys[l], x + s * 0.07, top + s * 0.07); }
      const fs = Math.min(s * 0.135, 30);
      if (fs > 6) {
        ctx.font = `600 ${fs}px ${SANS}`; ctx.fillStyle = `rgba(242,238,230,${near})`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const lines = wrapText(o.opts[l], pw * 0.78), lh = fs * 1.12, y0 = top + ph * 0.5 - (lines.length - 1) * lh / 2;
        lines.forEach((ln, i) => ctx.fillText(ln, p.x, y0 + i * lh));
      }
    }
    const hs = s * 0.085;
    if (hs > 6) {
      ctx.font = `500 ${hs}px ${MONO}`; const label = o.src.title.toUpperCase().split('').join(' ');
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = rgba(COL.pop, near); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, mid.x, top - s * 0.14);
      ctx.strokeStyle = rgba(COL.pop, 0.6 * near); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(mid.x - tw / 2 - s * 0.5, top - s * 0.14); ctx.lineTo(mid.x - tw / 2 - s * 0.08, top - s * 0.14);
      ctx.moveTo(mid.x + tw / 2 + s * 0.08, top - s * 0.14); ctx.lineTo(mid.x + tw / 2 + s * 0.5, top - s * 0.14); ctx.stroke();
    }
  }

  function drawPortal(o) {
    const p = P(0, o.z), s = p.s, cy = p.y - s * 0.95;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(G.pop, p.x, cy, s * 2.2, s * 2.2, 0.6); glow(G.acc, p.x, cy, s * 3, s * 2, 0.35);
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2 + S.t * 0.4, r0 = s * 1.1, r1 = s * (1.5 + (i % 3) * 0.25);
      ctx.strokeStyle = rgba(COL.pop, 0.35); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p.x + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(p.x + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
    }
    [COL.ink, COL.pop, COL.acc].forEach((c, i) => {
      ctx.strokeStyle = rgba(c, 0.9); ctx.lineWidth = Math.max(1.5, s * (0.03 - i * 0.006));
      ctx.beginPath(); ctx.arc(p.x, cy, s * (1 - i * 0.14) * (1 + 0.03 * Math.sin(S.t * 5 + i)), 0, Math.PI * 2); ctx.stroke();
    });
    ctx.restore();
    const fs = s * 0.42; if (fs > 8) { ctx.font = `italic 400 ${fs}px ${SERIF}`; ctx.fillStyle = COL.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Live.', p.x, cy); }
  }

  function drawPlayer() {
    const p = P(S.px, 0), hover = 0.5 + S.jump * 0.5, cx = p.x, cy = p.y - hover * K;
    const lean = ((S.lane - 1) - S.px) * -0.45;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(G.acc, cx, p.y, K * 0.55 * (1 - S.jump * 0.15), K * 0.12, 0.55 - S.jump * 0.15);
    const pts = [{ x: cx, y: cy }];
    for (let i = S.hist.length - 1; i >= 0; i--) {
      const h = S.hist[i], z = (S.t - h.t) * h.sp; if (z < 0.05) continue;
      const q = P(h.px, z); pts.push({ x: q.x, y: q.y - (0.5 + h.j * 0.5) * q.s, t: q.t });
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const k = 1 - i / pts.length;
      ctx.strokeStyle = rgba(S.stumble > 0 ? COL.red : COL.acc, 0.55 * k); ctx.lineWidth = K * 0.1 * k + 1;
      ctx.lineCap = 'round'; line(pts[i], pts[i + 1]);
      ctx.strokeStyle = `rgba(255,236,200,${0.7 * k})`; ctx.lineWidth = K * 0.025 * k + 0.5; line(pts[i], pts[i + 1]);
    }
    const pulse = 0.85 + 0.15 * Math.sin(S.t * 6);
    glow(G.acc, cx, cy, K * 0.6, K * 0.6, 0.7 * pulse);
    glow(G.pop, cx, cy, K * 0.25, K * 0.25, 0.8);
    ctx.restore();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(lean);
    const bw = K * 0.065, bh = K * 0.34;
    if (S.stumble > 0 && !RM) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(COL.red, 0.8); rr(-bw / 2 - 3, -bh / 2, bw, bh, bw / 2); ctx.fill();
      ctx.fillStyle = rgba(COL.cyan, 0.6); rr(-bw / 2 + 3, -bh / 2, bw, bh, bw / 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.fillStyle = '#fff6e8'; rr(-bw / 2, -bh / 2, bw, bh, bw / 2); ctx.fill();
    const ang = S.t * 3.2;
    ctx.strokeStyle = rgba(COL.pop, 0.85); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(0, 0, K * 0.24, K * 0.075, -0.12, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.arc(Math.cos(ang) * K * 0.24, Math.sin(ang) * K * 0.075, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawFx() {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const r of S.rings) {
      if (r.life < 0) continue; const k = r.life / r.max;
      ctx.strokeStyle = rgba(COL[r.c], 0.8 * (1 - k)); ctx.lineWidth = 2 * (1 - k) + 0.5;
      ctx.beginPath(); ctx.ellipse(r.x, r.y, Math.max(0.1, K * (0.2 + k * 1.1)), Math.max(0.1, K * (0.05 + k * 0.28)), 0, 0, Math.PI * 2); ctx.stroke();
    }
    for (const p of S.parts) {
      const k = 1 - p.life / p.max; ctx.strokeStyle = rgba(p.color, k); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * p.len, p.y - p.vy * p.len); ctx.stroke();
    }
    ctx.restore();
    for (const f of S.fx) {
      const k = f.life / f.max, a = k < 0.15 ? k / 0.15 : k > 0.65 ? 1 - (k - 0.65) / 0.35 : 1;
      const fs = clamp(K * 0.075, 10, 15), y = f.y - k * K * 0.3;
      ctx.font = `500 ${fs}px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const label = f.text.split('').join(' ');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(f.color === COL.pop ? G.pop : f.color === COL.red ? G.red : G.ink, f.x, y, ctx.measureText(label).width * 0.8, fs * 1.6, 0.25 * a); ctx.restore();
      ctx.globalAlpha = a; ctx.fillStyle = f.color; ctx.fillText(label, f.x, y); ctx.globalAlpha = 1;
    }
    if (S.title) {
      const k = S.title.life / S.title.max, a = k < 0.2 ? k / 0.2 : k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1;
      const fs = clamp(K * 0.36, 34, 84);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(CX, H * 0.3); ctx.scale(0.96 + k * 0.06, 0.96 + k * 0.06);
      ctx.font = `italic 400 ${fs}px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = S.title.col; ctx.fillText(S.title.text, 0, 0); ctx.restore();
    }
    if (S.boost > 0 && !RM) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 30; i++) {
        const a = i * 2.39996 + S.t * 0.5, r0 = Math.hypot(W, H) * (0.3 + ((i * 37) % 11) / 30);
        ctx.strokeStyle = `rgba(242,238,230,${0.12 * S.boost})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(CX + Math.cos(a) * r0, HOR + Math.sin(a) * r0 * 0.7); ctx.lineTo(CX + Math.cos(a) * r0 * 1.7, HOR + Math.sin(a) * r0 * 1.2); ctx.stroke();
      }
      ctx.restore();
    }
  }

  function render() {
    CX = W / 2 - S.px * K * 0.2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#05060b'; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H * 0.62); ctx.rotate(-S.px * 0.025 + ((S.lane - 1) - S.px) * 0.02); ctx.translate(-W / 2, -H * 0.62);
    if (S.shake > 0) { const m = S.shake * 6; ctx.translate((Math.random() - .5) * m, (Math.random() - .5) * m); }
    drawSky(); drawFloor(); drawDust();
    const list = S.objs.filter(o => o.z > 0.25 && !o.hit).sort((a, b) => b.z - a.z);
    for (const o of list) {
      if (o.t === 'gate') drawGate(o);
      else if (o.t === 'portal') drawPortal(o);
      else {
        const p = P(o.lane - 1, o.z); ctx.globalAlpha = clamp((SPAWN - o.z) / 6, 0, 1);
        if (o.t === 'token') drawToken(o, p, true);
        else if (o.t === 'bad') drawToken(o, p, false);
        else if (o.t === 'file') drawFile(o, p);
        else if (o.t === 'bug') drawBug(o, p);
        ctx.globalAlpha = 1;
      }
    }
    drawPlayer(); drawFx();
    ctx.restore();
    if (S.flash > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba(COL[S.flashCol], 0.22 * Math.min(1, S.flash)); ctx.fillRect(0, 0, W, H); ctx.restore(); }
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
    if (S.glitch > 0 && !RM) {
      const bands = 6;
      for (let i = 0; i < bands; i++) {
        const y = Math.random() * H, h = 4 + Math.random() * H * 0.05, dx = (Math.random() - .5) * 40 * S.glitch * 3;
        ctx.drawImage(cv, 0, y * dpr, cv.width, h * dpr, dx, y, W, h);
      }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba(COL.red, 0.08 * S.glitch * 3); ctx.fillRect(0, 0, W, H); ctx.restore();
    }
  }

  /* Loop */
  let last = performance.now(), visible = true;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (visible && S.mode !== 'paused') update(dt);
    try { render(); } catch (err) { ctx.restore(); }
    requestAnimationFrame(frame);
  }

  /* Input */
  const move = d => { if (S.mode === 'play') S.lane = clamp(S.lane + d, 0, 2); };
  const jump = () => { if (S.mode === 'play' && S.jump === 0) { S.vy = 9.5; S.jump = 0.001; } };
  function pause(on) {
    if (on && S.mode === 'play') { S.mode = 'paused'; $('#ld-pause-screen').hidden = false; $('#ld-resume-btn').focus({ preventScroll: true }); }
    else if (!on && S.mode === 'paused') { S.mode = 'play'; $('#ld-pause-screen').hidden = true; last = performance.now(); }
  }
  addEventListener('keydown', e => {
    if (S.mode === 'paused') { if (e.key === 'p' || e.key === 'Escape') pause(false); return; }
    if (S.mode !== 'play') return;
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { move(-1); e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { move(1); e.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') { jump(); e.preventDefault(); }
    else if (k === 'ArrowDown') e.preventDefault();
    else if (k === 'p' || k === 'Escape') pause(true);
  });
  let touch = null;
  cv.addEventListener('pointerdown', e => { touch = { x: e.clientX, y: e.clientY, fired: false }; });
  cv.addEventListener('pointermove', e => {
    if (!touch || touch.fired) return;
    const dx = e.clientX - touch.x, dy = e.clientY - touch.y;
    if (Math.abs(dx) > 26 && Math.abs(dx) > Math.abs(dy)) { move(Math.sign(dx)); touch.fired = true; }
    else if (dy < -26) { jump(); touch.fired = true; }
  });
  cv.addEventListener('pointerup', e => {
    if (!touch) return;
    if (!touch.fired) { const r = cv.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width; if (fx < 0.36) move(-1); else if (fx > 0.64) move(1); else jump(); }
    touch = null;
  });
  cv.addEventListener('pointercancel', () => { touch = null; });

  $('#ld-play-btn').addEventListener('click', start);
  $('#ld-again-btn').addEventListener('click', start);
  $('#ld-pause-btn').addEventListener('click', () => pause(true));
  $('#ld-resume-btn').addEventListener('click', () => pause(false));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(true); });
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (!visible) pause(true); }, { threshold: 0.25 }).observe(stage);
  new ResizeObserver(resize).observe(stage);

  resize();
  requestAnimationFrame(frame);
})();
