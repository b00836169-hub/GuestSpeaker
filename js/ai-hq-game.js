// "Your AI HQ": Episode 02 game, in 7 scenes. No lives or scores.
// One brief walks from room to room: Brief Writer, Fresh Eyes, Strategy,
// your desk, then the Creative Studio, and ends on a billboard.
// Mounts into #ai-hq. Arrow keys only move the player while you are walking
// between rooms and the game sits in the middle of the screen, so they
// scroll the page at all other times.
(() => {
  const mount = document.getElementById('ai-hq');
  if (!mount) return;

  // ---------- Story data ----------

  const ROOMS = {
    lobby: { name: 'Lobby', x: 300, y: 300, w: 150, h: 150 },
    brief: { name: 'Brief Room', x: 115, y: 130, w: 150, h: 130, fig: true },
    fresh: { name: 'Fresh Eyes', x: 300, y: 70, w: 150, h: 110, fig: true },
    strategy: { name: 'Strategy', x: 485, y: 130, w: 150, h: 130, fig: true },
    desk: { name: 'Your Desk', x: 115, y: 470, w: 150, h: 130, fig: false },
    creative: { name: 'Creative Studio', x: 485, y: 470, w: 150, h: 130, fig: true }
  };
  const TARGET = { 2: 'brief', 3: 'fresh', 4: 'strategy', 5: 'desk', 6: 'creative' };
  const DUR = [0, 3, 6, 8, 8, 5, 10, 5];
  const BRIEF = [['Client', 'The Row'], ['Product', 'An eco-friendly bag'], ['Tone', 'Quiet luxury'], ['Audience', 'Everyone'], ['Budget', 'TBC'], ['Success', 'It goes viral']];
  const BRIEF_TOTAL = BRIEF.reduce((a, [, v]) => a + v.length, 0);
  const WEAK = [['Audience', 'Everyone', 'Women 30–50 who buy less, but better'], ['Budget', 'TBC', 'S$150k over six weeks'], ['Success', 'It goes viral', '2,000 pre-orders in launch month']];
  const IDEAS = [['Made to stay.', 'A bag you keep for ten years, not one season.'], ['Nothing to prove.', 'No logo. Recycled leather. Craft that speaks quietly.'], ['Carry less.', 'Fewer, better things. The bag as an edit.']];
  const VERS = {
    safe: { label: 'Safe version', bg: '#e9dfcf', bag: '#8f877b', ink: '#2a2620', bagX: 30, bagW: 40, avg: '8.1', scores: [8.0, 8.3, 8.0], ad: 'Made to last. Made to stay.', c: '#ffc94a' },
    bold: { label: 'Bold version', bg: '#3a362f', bag: '#d8c7a8', ink: '#efe7d8', bagX: 62, bagW: 22, avg: '6.2', scores: [6.0, 6.5, 6.1], ad: 'This bag has nothing to say.', c: '#ff5a36' }
  };
  const SCREENS = [{ name: 'SOMIN', what: 'Competitor map', a: 72, b: 40 }, { name: 'SOMONITOR', what: 'Social listening', a: 55, b: 80 }, { name: 'Project docs', what: 'Brand book', a: 88, b: 60 }];
  const WALK_LINE = { 2: 'The Brief Writer turns the email into a structured brief.', 3: 'Open a new chat. Fresh eyes check the brief.', 4: 'Research meets the brief. The big idea takes shape.', 5: 'Before anything goes out, it comes to you.', 6: 'The creative team builds the campaign.' };

  // ---------- State ----------

  const init = () => ({ scene: 0, at: 'lobby', inRoom: false, emailIn: false, typed: 0, fixed: [false, false, false], idea: -1, approved: false, build: 0, scored: false, chosen: null, showQ: false, toast: '' });
  let state = init();
  let timers = [], typer = 0, arriveT = 0, tStart = 0, tDur = 0, drag = null, renderQueued = false;

  const setState = patch => {
    state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
    if (!renderQueued) { renderQueued = true; queueMicrotask(render); }
  };
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearAll = () => { timers.forEach(clearTimeout); timers = []; clearInterval(typer); clearTimeout(arriveT); };

  // ---------- Story logic ----------

  function startTimer(sc) { tStart = performance.now(); tDur = DUR[sc]; }
  function timerText(now = performance.now()) {
    if (!tStart) return { t: '--:--', done: false };
    const left = Math.max(0, tDur - (now - tStart) / 1000);
    return { t: '00:' + String(Math.ceil(left)).padStart(2, '0'), done: left <= 0 };
  }

  function walkTo(id) {
    const s = state;
    if (s.scene < 2 || s.scene > 6 || s.inRoom) return;
    setState({ at: id, toast: '' });
    clearTimeout(arriveT);
    arriveT = setTimeout(() => arrive(id), 900);
  }
  function arrive(id) {
    const s = state, tgt = TARGET[s.scene];
    if (!tgt || s.inRoom) return;
    if (id === tgt) { setState({ inRoom: true, toast: '' }); startTimer(s.scene); enter(s.scene); }
    else if (id !== 'lobby') setState({ toast: `This is ${ROOMS[id].name}. Your next stop is ${ROOMS[tgt].name}.` });
  }
  function enter(sc) {
    if (sc === 2) {
      clearInterval(typer);
      const t0 = performance.now();
      typer = setInterval(() => {
        const n = Math.round((performance.now() - t0) / 1000 * 42);
        if (n >= BRIEF_TOTAL) clearInterval(typer);
        setState({ typed: Math.min(BRIEF_TOTAL, n) });
      }, 40);
    }
    if (sc === 6) {
      [1, 2, 3, 4].forEach(k => later(() => setState({ build: k }), 350 * k));
      later(() => setState({ scored: true }), 1700);
    }
  }
  function next(sc) { tStart = 0; setState({ scene: sc, inRoom: false, toast: '' }); }
  function begin() {
    clearAll(); state = init(); setState({ scene: 1 });
    startTimer(1);
    later(() => setState({ emailIn: true }), 80);
    later(() => next(2), 3400);
  }
  function reset() { clearAll(); tStart = 0; state = init(); setState({}); }
  function launch(id) {
    if (state.chosen) return;
    setState({ chosen: id });
    later(() => { next(7); startTimer(7); later(() => setState({ showQ: true }), 2200); }, 900);
  }

  // Arrow keys pick the nearest room in that direction, as seen on the tilted map.
  addEventListener('keydown', e => {
    const s = state;
    if (s.scene < 2 || s.scene > 6 || s.inRoom) return;
    const root = mount.firstElementChild; if (!root) return;
    const r = root.getBoundingClientRect();
    if (r.top > innerHeight * 0.6 || r.bottom < innerHeight * 0.4) return;
    const d = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!d) return;
    e.preventDefault();
    const a = 38 * Math.PI / 180, sy = d[1] / 0.56;
    const fx = d[0] * Math.cos(a) - sy * Math.sin(a), fy = d[0] * Math.sin(a) + sy * Math.cos(a), fl = Math.hypot(fx, fy);
    const cur = ROOMS[s.at]; let best = null, bs = 1e9;
    Object.entries(ROOMS).forEach(([id, rm]) => {
      if (id === s.at) return;
      const dx = rm.x - cur.x, dy = rm.y - cur.y, dl = Math.hypot(dx, dy), dot = (dx * fx + dy * fy) / (dl * fl);
      if (dot < 0.35) return;
      const sc = dl / dot; if (sc < bs) { bs = sc; best = id; }
    });
    if (best) walkTo(best);
  });

  // ---------- Views ----------

  const esc = x => String(x).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const when = (c, html) => c ? html : '';
  const tri = '<span class="hq-tri" aria-hidden="true"></span>';

  function viewCover() {
    return `<div class="hq-cover" data-key="cover">
      <span class="hq-kicker">Episode 02 · An interactive game in 7 scenes</span>
      <h3>Your AI <span class="hq-acc-i">HQ</span></h3>
      <p>One brief just landed. Six AI roles are at their desks. Walk the work from room to room, and make the final call.</p>
      <div class="hq-cover-row">
        <button class="hq-start" type="button" data-act="begin">${tri}Open the HQ</button>
        <span class="hq-mono hq-cover-hint">About 45 seconds · Tap a room or use arrow keys</span>
      </div>
      <span class="hq-mono hq-cover-note">Fictional class brief. Not affiliated with The Row.</span>
    </div>`;
  }

  function viewMap() {
    const s = state, sc = s.scene, tgt = TARGET[sc];
    const walking = sc >= 2 && sc <= 6 && !s.inRoom;
    const done = { brief: sc > 2, fresh: sc > 3, strategy: sc > 4, desk: sc > 5, creative: sc > 6 };
    const threads = Object.entries(ROOMS).filter(([id]) => id !== 'lobby').map(([id, r], i) => {
      const dx = r.x - 300, dy = r.y - 300, op = done[id] || (s.inRoom && s.at === id) ? '.85' : '.3';
      return `<div class="hq-thread" style="width:${Math.hypot(dx, dy).toFixed(0)}px;transform:rotate(${(Math.atan2(dy, dx) * 180 / Math.PI).toFixed(1)}deg);background:linear-gradient(90deg,rgba(255,201,74,${op}),rgba(255,90,54,.15));box-shadow:0 0 10px rgba(255,140,60,${op})"><span class="hq-pulse" data-pulse="${i}" data-live></span></div>`;
    }).join('');
    const rooms = Object.entries(ROOMS).map(([id, r]) => {
      const isT = walking && id === tgt, here = s.inRoom && id === s.at;
      const bg = here ? 'rgba(255,201,74,.12)' : done[id] ? 'rgba(216,199,168,.1)' : 'rgba(216,199,168,.05)';
      const border = isT || here ? '#ffc94a' : 'rgba(239,231,216,.22)';
      const glow = isT ? '0 0 50px rgba(255,201,74,.55), inset 0 0 30px rgba(255,201,74,.2)' : here ? '0 0 40px rgba(255,201,74,.35)' : 'none';
      return `<div class="hq-room" data-act="walk" data-room="${id}" role="button" tabindex="0" aria-label="Walk to ${r.name}" style="left:${r.x - r.w / 2}px;top:${r.y - r.h / 2}px;width:${r.w}px;height:${r.h}px;background:${bg};border-color:${border};box-shadow:${glow}">
        <div class="hq-anchor"><div class="hq-stand">
          <span class="hq-room-name" style="color:${isT || here ? '#ffc94a' : '#efe7d8'}">${r.name}</span>
          ${when(r.fig, `<div class="hq-figure" style="opacity:${here || done[id] ? 1 : 0.55}"><span class="hq-fig-head"></span><span class="hq-fig-body"></span></div>`)}
          <span class="hq-desk"></span>
        </div></div>
      </div>`;
    }).join('');
    const coreLv = sc === 0 ? 0 : s.approved || sc >= 6 ? 3 : sc >= 3 ? 2 : 1;
    const ch = VERS[s.chosen || 'safe'];
    const p = ROOMS[s.at];
    return `<div class="hq-map" data-map>
      <div class="hq-cam" data-cam data-live>
        <div class="hq-floor"></div>
        ${threads}${rooms}
        <div class="hq-core-anchor">
          <span class="hq-core-halo" style="opacity:${[0.25, 0.6, 0.8, 1][coreLv]};transform:scale(${[0.7, 1, 1.15, 1.45][coreLv]})"></span>
          <div class="hq-stand"><span class="hq-core-orb" style="box-shadow:0 0 ${[10, 30, 45, 80][coreLv]}px #ffc94a"></span></div>
        </div>
        ${when(sc === 7, `<div class="hq-board-anchor"><div class="hq-stand">
          <div class="hq-board" style="background:${ch.bg};color:${ch.ink}">${esc(ch.ad)}</div><span class="hq-pole"></span>
        </div></div>`)}
        <div class="hq-player" style="left:${p.x}px;top:${p.y + (s.at === 'lobby' ? 45 : 22)}px">
          <span class="hq-player-ring"></span>
          <div class="hq-stand"><span class="hq-you">YOU</span><span class="hq-you-head"></span><span class="hq-you-body"></span></div>
        </div>
      </div>
      <span class="hq-mono hq-map-hint">Tap a room · Arrow keys</span>
    </div>`;
  }

  function viewSide() {
    const s = state, sc = s.scene, tgt = TARGET[sc];
    const walking = sc >= 2 && sc <= 6 && !s.inRoom;

    if (sc === 1) return `<div class="hq-panel" data-key="s1">
      <span class="hq-kicker">Scene 1 · The brief lands</span>
      <div class="hq-email" style="opacity:${s.emailIn ? 1 : 0};transform:${s.emailIn ? 'none' : 'translate(60px,-40px) rotate(6deg) scale(.85)'}">
        <span class="hq-email-from">From: The Row · Subject: New campaign</span>
        <span class="hq-email-body">“The Row: launch an eco-friendly bag. Make it feel <i>quiet luxury.</i>”</span>
      </div>
      <span class="hq-serif-i">The core in the lobby wakes up.</span>
    </div>`;

    if (walking) return `<div class="hq-panel" data-key="walk-${sc}">
      <span class="hq-kicker">Next stop</span>
      <h4 class="hq-walk-title">${ROOMS[tgt].name}</h4>
      <p class="hq-serif">${WALK_LINE[sc]}</p>
      ${when(s.toast, `<p class="hq-toast" role="status">${esc(s.toast)}</p>`)}
      <button class="hq-ghost" type="button" data-act="walkTarget">Walk there →</button>
    </div>`;

    if (sc === 2) {
      let left = s.typed;
      const lines = BRIEF.map(([k, v]) => { const n = Math.max(0, Math.min(v.length, left)); left -= v.length; return `<div class="hq-brief-line"><span class="hq-brief-k">${k}</span><span>${esc(v.slice(0, n))}</span></div>`; }).join('');
      const doneB = s.typed >= BRIEF_TOTAL;
      return `<div class="hq-panel" data-key="s2">
        <span class="hq-kicker">Scene 2 · Brief Writer is typing…</span>
        <div class="hq-brief${doneB ? ' is-done' : ''}"><span class="hq-brief-title">Marketing brief</span>${lines}</div>
        ${when(doneB, `<button class="hq-btn" type="button" data-act="next" data-to="3">Carry the brief out →</button>`)}
      </div>`;
    }

    if (sc === 3) {
      const weak = WEAK.map(([k, bad, good], i) => {
        const f = s.fixed[i];
        return `<button class="hq-weak${f ? ' is-fixed' : ''}" type="button" data-act="fix" data-i="${i}">
          <span class="hq-brief-k" style="padding:0">${k}</span>
          <span data-flicker="${f ? 'off' : 'on'}" data-live>${esc(f ? good : bad)}</span>
          <span class="hq-weak-tag">${f ? 'FIXED ✓' : 'TAP'}</span>
        </button>`;
      }).join('');
      return `<div class="hq-panel" data-key="s3">
        <span class="hq-kicker">Scene 3 · Validator · New chat</span>
        <p class="hq-serif">Fresh eyes found three weak lines. Tap each one to fix it.</p>
        ${weak}
        ${when(s.fixed.every(Boolean), `<button class="hq-btn" type="button" data-act="next" data-to="4">Brief validated. To Strategy →</button>`)}
      </div>`;
    }

    if (sc === 4) {
      const screens = SCREENS.map((x, i) => `<div class="hq-screen-col">
        <div class="hq-screen">
          <span class="hq-screen-name">${x.name}</span><span class="hq-screen-what">${x.what}</span>
          <span class="hq-bar" style="background:linear-gradient(90deg,#ff5a36 ${x.a}%,rgba(239,231,216,.12) 0)"></span>
          <span class="hq-bar" style="background:linear-gradient(90deg,#d8c7a8 ${x.b}%,rgba(239,231,216,.12) 0)"></span>
        </div>
        <span class="hq-drip"><span class="hq-drop" data-drop="${i}" data-live></span></span>
      </div>`).join('');
      const ideas = IDEAS.map(([name, line], i) => `<button class="hq-idea${s.idea === i ? ' is-picked' : ''}" type="button" data-act="idea" data-i="${i}" aria-pressed="${s.idea === i}">
        <span class="hq-idea-name">${name}</span><span class="hq-idea-line">${line}</span></button>`).join('');
      return `<div class="hq-panel" data-key="s4">
        <span class="hq-kicker">Scene 4 · Strategy Room</span>
        <div class="hq-screens">${screens}</div>
        <span class="hq-mono hq-strategist">Strategist</span>
        <p class="hq-serif is-sm">Three big ideas came back. Pick one.</p>
        ${ideas}
        ${when(s.idea >= 0, `<button class="hq-btn" type="button" data-act="next" data-to="5">Take it to your desk →</button>`)}
      </div>`;
    }

    if (sc === 5) return `<div class="hq-panel" data-key="s5">
      <span class="hq-kicker">Scene 5 · Your desk</span>
      <div class="hq-desk-card">
        <span class="hq-desk-row"><span>Brief</span><span style="color:#ffc94a">Validated ✓</span></span>
        <span class="hq-desk-row"><span>Big idea</span><span class="hq-idea-name" style="font-size:18px">${s.idea >= 0 ? IDEAS[s.idea][0] : ''}</span></span>
      </div>
      ${s.approved
        ? `<p class="hq-in-charge">The human stays in charge.</p><button class="hq-ghost" type="button" data-act="next" data-to="6">Send to Creative →</button>`
        : `<button class="hq-btn is-big" type="button" data-act="approve">Approve &amp; save to knowledge base</button>`}
    </div>`;

    if (sc === 6) {
      const versions = ['safe', 'bold'].map(id => {
        const v = VERS[id], b = s.build;
        const meters = ['BBH', 'Ogilvy', 'McCann'].map((n, k) => `<div class="hq-meter"><span class="hq-meter-n">${n}</span>
          <span class="hq-meter-track"><span class="hq-meter-fill" style="width:${s.scored ? v.scores[k] * 10 : 0}%;background:${v.c}"></span></span>
          <span style="text-align:right">${s.scored ? v.scores[k].toFixed(1) : ''}</span></div>`).join('');
        return `<div class="hq-version" data-drag="${id}" data-live>
          <span class="hq-version-label">${v.label}</span>
          <div class="hq-mock">
            <div class="hq-mock-post" style="background:${v.bg};opacity:${b >= 1 ? 1 : 0}">
              <span style="left:${v.bagX}%;top:30%;width:${v.bagW}%;height:38%;border-radius:8px 8px 12px 12px;background:${v.bag};opacity:${b >= 2 ? 1 : 0}"></span>
              <span style="left:calc(${v.bagX}% + 10%);top:20%;width:calc(${v.bagW}% - 20%);height:14%;border:3px solid ${v.bag};border-bottom:0;border-radius:40px 40px 0 0;opacity:${b >= 2 ? 1 : 0}"></span>
              <span style="left:8%;right:8%;bottom:7%;font-family:var(--serif);font-style:italic;font-size:clamp(11px,1.2vw,15px);line-height:1.05;color:${v.ink};opacity:${b >= 3 ? 1 : 0}">${v.ad}</span>
            </div>
            <div class="hq-mock-story" style="background:${v.bg};opacity:${b >= 4 ? 1 : 0}">
              <span style="left:20%;right:20%;top:30%;height:30%;border-radius:6px;background:${v.bag}"></span>
              <span style="left:10%;right:10%;bottom:8%;font-family:var(--mono);font-size:7px;letter-spacing:.1em;color:${v.ink}">THE ROW</span>
            </div>
          </div>
          ${meters}
          <span class="hq-avg"><span class="hq-version-label">AVERAGE</span><span class="hq-avg-n" style="color:${v.c}">${s.scored ? v.avg : '–'}</span></span>
          <button class="hq-launch-this" type="button" data-act="launch" data-id="${id}">Launch this</button>
        </div>`;
      }).join('');
      return `<div class="hq-panel is-tight" data-key="s6">
        <span class="hq-kicker">Scene 6 · Creative Studio</span>
        <p class="hq-serif is-sm">The AI jury scored both. Drag one into Launch. There’s no wrong answer.</p>
        <div class="hq-versions">${versions}</div>
        <div class="hq-dropzone${s.chosen ? ' is-on' : ''}" data-dropzone>Launch ↗</div>
      </div>`;
    }

    if (sc === 7) {
      const ch = VERS[s.chosen || 'safe'];
      return `<div class="hq-panel is-loose" data-key="s7">
        <span class="hq-kicker">Scene 7 · The billboard</span>
        <div class="hq-billboard" style="background:${ch.bg};color:${ch.ink}">
          <span style="position:absolute;right:12%;top:22%;width:22%;height:40%;border-radius:10px 10px 16px 16px;background:${ch.bag}"></span>
          <span style="position:absolute;right:15%;top:12%;width:16%;height:12%;border:4px solid ${ch.bag};border-bottom:0;border-radius:40px 40px 0 0"></span>
          <span class="hq-billboard-brand">THE ROW · RECYCLED LEATHER</span>
          <span class="hq-billboard-line">${ch.ad}</span>
        </div>
        <p class="hq-question" style="opacity:${s.showQ ? 1 : 0};transform:translateY(${s.showQ ? 0 : 16}px)">Can AI recognise originality, or does it reward what has worked before?</p>
        <div class="hq-end-row" style="opacity:${s.showQ ? 1 : 0}">
          <button class="hq-btn" type="button" data-act="reset">Play again</button>
          <a class="hq-ghost" href="#notes">Read my notes</a>
        </div>
      </div>`;
    }
    return '';
  }

  function view() {
    const s = state, sc = s.scene, tgt = TARGET[sc];
    const label = sc === 0 ? 'Fictional class brief' : `Scene ${sc} / 7 · ${sc === 1 ? 'Lobby' : sc === 7 ? 'Outside' : (s.inRoom ? ROOMS[tgt].name : 'Walking')}`;
    const tm = timerText();
    return `<div class="hq">
      <div class="hq-top">
        <span class="hq-brand">Your AI <span class="hq-acc-i">HQ</span></span>
        <span class="hq-mono hq-label">${label}</span>
        <span class="hq-spacer"></span>
        <span class="hq-timer-pill"><span class="hq-dot"></span><span class="hq-timer" data-timer data-live style="color:${tm.done ? '#ffc94a' : '#efe7d8'}">${tm.t}</span></span>
      </div>
      <div class="hq-progress"><div class="hq-progress-fill" style="width:${(sc / 7 * 100).toFixed(1)}%"></div></div>
      ${sc === 0 ? viewCover() : `<div class="hq-play" data-key="playing">${viewMap()}<div class="hq-side">${viewSide()}</div></div>`}
    </div>`;
  }

  // ---------- Rendering ----------
  // Views return HTML strings; morph() patches the live DOM to match, so elements
  // stay in place and CSS transitions run. data-key: replace the node whole when
  // it changes. data-live: the style attribute is driven by code (animation,
  // camera, dragging), so morph leaves it alone after the first render.

  function toNode(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function morph(from, to) {
    if (from.nodeType !== to.nodeType || from.nodeName !== to.nodeName ||
        (from.nodeType === 1 && from.getAttribute('data-key') !== to.getAttribute('data-key'))) { from.replaceWith(to); return; }
    if (from.nodeType !== 1) { if (from.nodeValue !== to.nodeValue) from.nodeValue = to.nodeValue; return; }
    const live = from.hasAttribute('data-live');
    for (const a of [...from.attributes]) if (!to.hasAttribute(a.name) && !(live && a.name === 'style')) from.removeAttribute(a.name);
    for (const a of [...to.attributes]) if (!(live && a.name === 'style') && from.getAttribute(a.name) !== a.value) from.setAttribute(a.name, a.value);
    if (live && from.hasAttribute('data-timer')) return; // text is kept fresh by the clock
    const fc = [...from.childNodes], tc = [...to.childNodes];
    tc.forEach((c, i) => i < fc.length ? morph(fc[i], c) : from.appendChild(c));
    for (let i = tc.length; i < fc.length; i++) fc[i].remove();
  }

  let ro = null, observedMap = null;
  function render() {
    renderQueued = false;
    const nextNode = toNode(view());
    if (mount.firstElementChild && mount.firstElementChild.classList.contains('hq')) morph(mount.firstElementChild, nextNode);
    else mount.replaceChildren(nextNode);
    const map = mount.querySelector('[data-map]');
    if (map && map !== observedMap) {
      ro && ro.disconnect(); ro = new ResizeObserver(applyCamera); ro.observe(map); observedMap = map;
    }
    applyCamera();
  }

  // Tilted, zoomed camera over the map; it moves in on the room you are in.
  function applyCamera() {
    const map = mount.querySelector('[data-map]'), cam = mount.querySelector('[data-cam]');
    if (!map || !cam) return;
    const fit = Math.max(0.34, Math.min(1.05, map.clientWidth / 840, map.clientHeight / 640));
    const s = state; let fx = 300, fy = 300, z = 1;
    if (s.scene === 7) { fx = 300; fy = 230; z = 0.92; }
    else if (s.inRoom && s.at !== 'lobby') { const r = ROOMS[s.at]; fx = (r.x + 300) / 2; fy = (r.y + 300) / 2; z = 1.18; }
    cam.style.transform = `scale(${(fit * z).toFixed(3)}) rotateX(56deg) rotateZ(-38deg) translate(${300 - fx}px, ${300 - fy}px)`;
  }

  // Small looping animations and the clock, every frame while on screen.
  let onScreen = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { onScreen = es[0].isIntersecting; }).observe(mount);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tick(now) {
    requestAnimationFrame(tick);
    if (!onScreen) return;
    const t = now / 1000;
    if (!reduceMotion) {
      mount.querySelectorAll('[data-pulse]').forEach(el => { el.style.left = (((t * 0.35 + +el.dataset.pulse * 0.21) % 1) * 100).toFixed(1) + '%'; });
      mount.querySelectorAll('[data-drop]').forEach(el => { el.style.top = (((t * 0.9 + +el.dataset.drop * 0.33) % 1) * 22).toFixed(1) + 'px'; });
    }
    mount.querySelectorAll('[data-flicker="on"]').forEach(el => { el.style.color = '#ff4b4b'; el.style.opacity = reduceMotion || Math.sin(t * 22) > -0.3 || Math.random() > 0.9 ? '1' : '.35'; });
    mount.querySelectorAll('[data-flicker="off"]').forEach(el => { el.style.color = '#efe7d8'; el.style.opacity = '1'; });
    const tm = mount.querySelector('[data-timer]');
    if (tm) { const x = timerText(now); tm.textContent = x.t; tm.style.color = x.done ? '#ffc94a' : '#efe7d8'; }
  }
  requestAnimationFrame(tick);

  // ---------- Events ----------

  mount.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || !mount.contains(el)) return;
    switch (el.dataset.act) {
      case 'begin': return begin();
      case 'reset': return reset();
      case 'walk': return walkTo(el.dataset.room);
      case 'walkTarget': return TARGET[state.scene] && walkTo(TARGET[state.scene]);
      case 'next': return next(+el.dataset.to);
      case 'fix': { const i = +el.dataset.i; return setState(st => { const fx = st.fixed.slice(); fx[i] = true; return { fixed: fx }; }); }
      case 'idea': return setState({ idea: +el.dataset.i });
      case 'approve': return setState({ approved: true });
      case 'launch': return launch(el.dataset.id);
    }
  });
  // Rooms are focusable by keyboard too.
  mount.addEventListener('keydown', e => {
    const room = e.target.closest('.hq-room');
    if (room && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); walkTo(room.dataset.room); }
  });

  // Drag a version card onto "Launch".
  mount.addEventListener('pointerdown', e => {
    const card = e.target.closest('[data-drag]');
    if (!card || e.target.closest('button') || state.chosen) return;
    drag = { el: card, id: card.dataset.drag, x: e.clientX, y: e.clientY };
    card.setPointerCapture && card.setPointerCapture(e.pointerId);
    card.style.cursor = 'grabbing'; card.style.zIndex = '5';
  });
  mount.addEventListener('pointermove', e => {
    if (!drag) return;
    drag.el.style.transform = `translate(${e.clientX - drag.x}px, ${e.clientY - drag.y}px) rotate(-2deg)`;
  });
  const endDrag = e => {
    if (!drag) return;
    const { el, id } = drag; drag = null;
    el.style.cursor = ''; el.style.zIndex = '';
    const dz = mount.querySelector('[data-dropzone]'), r = dz && dz.getBoundingClientRect();
    const hit = e.type === 'pointerup' && r && e.clientX > r.left && e.clientX < r.right && e.clientY > r.top - 30 && e.clientY < r.bottom + 30;
    el.style.transition = 'transform .4s cubic-bezier(.2,.7,.2,1)'; el.style.transform = '';
    setTimeout(() => { el.style.transition = ''; }, 420);
    if (hit) launch(id);
  };
  mount.addEventListener('pointerup', endDrag);
  mount.addEventListener('pointercancel', endDrag);

  render();
})();
