// "Launch Day": Episode 01 interactive story in 8 scenes.
// Mounts into #launch-day. To make a game for a new episode, copy this file
// and its CSS, then rewrite CARDS, buildScenes() and the scene views.
(() => {
  const mount = document.getElementById('launch-day');
  if (!mount) return;

  // ---------- Story data ----------

  const TIMES = [0, 0, 30, 120, 240, 330, 420, 750, 835, 840]; // minutes after 6:00 pm, per scene
  const TITLES = ['', 'The Ask', 'The Prompt', 'The Design', 'The Build', 'The Repo', 'Go Live', 'Last-Minute Changes', 'The Cliffhanger', ''];
  const CARDS = [
    { id: 'role', k: 'Role', t: 'You are an expert web designer.', good: 1 },
    { id: 'w1', t: 'Make it nice' },
    { id: 'goal', k: 'Goal', t: 'Create a website for Kopi Corner, a cosy neighbourhood café.', good: 1 },
    { id: 'aud', k: 'Audience', t: 'Young professionals looking for a quiet place to work.', good: 1 },
    { id: 'w2', t: 'Make it modern' },
    { id: 'style', k: 'Design style', t: 'Warm colours, friendly typography, light background.', good: 1 },
    { id: 'pages', k: 'Pages', t: 'Home, Menu, Our Story, Find Us.', good: 1 },
    { id: 'w3', t: 'Add some stuff' },
    { id: 'feat', k: 'Key features', t: 'Mobile-first, a clear Reserve a Table button.', good: 1 },
    { id: 'out', k: 'Output', t: 'Give me the full page code and explain your design choices.', good: 1 }
  ];
  const GOOD_CARDS = CARDS.filter(c => c.good).length;

  function buildScenes() {
    const M = t => ({ who: 'mei', t }), J = t => ({ who: 'jun', t }), N = t => ({ who: 'nar', t });
    const MEAN = {
      'Routines': 'Routines run tasks again and again in the background.',
      'Refactoring': 'Refactoring tidies the code and keeps it doing the same thing.',
      'Session context': 'Session context remembers the commands, the errors and the files we changed.'
    };
    const tool = (c, ok, set) => Object.keys(MEAN).map(l => ({ l, ok: l === c, say: l === c ? ok : MEAN[l] + ' Not what I need here.', set }));
    const HOLDS = { 'index.html': 'the words', 'styles.css': 'the look', 'script.js': 'what happens on a click' };
    const file = (c, ok, set) => Object.keys(HOLDS).map(l => ({ l, ok: l === c, say: l === c ? ok : `${l} holds ${HOLDS[l]}. Wrong file for this one.`, set }));
    const shareNo = 'That gives me a picture, not a working site. I need the bridge to Claude Code.';
    return [null,
      { beats: [{ intro: [M('Kopi Corner opens tomorrow at 8. I still have no website. Can you help?')], q: 'Where do I start?', opts: [
        { l: 'Start with Claude chat', ok: 1, say: 'First I explain everything in detail and let Claude write the prompt.' },
        { l: 'Open a code editor and start typing', say: "I don't need to code by hand. I just need to describe what I want." },
        { l: 'Tell Mei it takes two weeks', say: 'Not anymore. With vibe coding, one night is enough.' }] }] },
      { beats: [{ type: 'prompt', panel: 'Click cards to add them to the prompt', intro: [N('My prompt is one line, and the preview shows it. Time to add the details.')] }] },
      { beats: [
        { intro: [M('Love it! Can the menu feel warmer, more like my shop?')], q: 'How do I change it?', opts: [
          { l: 'Describe the change in plain words', ok: 1, say: 'I keep talking to it until it looks right.', set: { warm: 1 } },
          { l: 'Start again from scratch', say: 'No need. I can change one thing at a time.' },
          { l: 'Leave it as it is', say: 'The client is always worth one more round.' }] },
        { type: 'share', panel: 'Find a way to get this design into Claude Code', hint: 1, intro: [N('Mei is happy. Now the design has to become a real site.')], opts: [
          { l: 'Copy link', say: shareNo }, { l: 'Download as image', say: shareNo }, { l: 'Export as PDF', say: shareNo },
          { l: 'Handoff to Claude Code…', ok: 1, say: 'This is the bridge. The design goes straight into Claude Code.', set: { handoff: 1 } }] }] },
      { beats: [
        { intro: [N('Claude Code picks up the design and starts writing files.'), M('Can it check the site for errors every hour while I sleep?')], q: 'Which Claude Code feature?', opts: tool('Routines', 'Claude Code can run tasks again and again in the background.', { r1: 1 }), auto: 1 },
        { intro: [N("The code works but it's messy. I want it cleaner without breaking anything.")], q: 'Which Claude Code feature?', opts: tool('Refactoring', 'It tidies the code and keeps it doing the same thing.', { r2: 1 }), auto: 1 },
        { intro: [N('Wait, what did we change an hour ago?')], q: 'Which Claude Code feature?', opts: tool('Session context', 'It remembers the commands, the errors and the files we changed.', { r3: 1 }) }] },
      { beats: [
        { type: 'repo', panel: 'Make a new repository on GitHub', intro: [N('The code needs a home online. That’s GitHub.')] },
        { type: 'git', q: 'Run a command', intro: [N('The repository is empty. Time to send my files.')], opts: [{ l: 'git commit' }, { l: 'git push' }] },
        { intro: [J('Can I fix the opening hours on the site?')], q: 'What do I tell Jun?', opts: [
          { l: 'Ask Jun to open a pull request', ok: 1, say: ["A pull request lets me review Jun's change before it goes in.", 'I merge it.'], set: { merged: 1 } },
          { l: 'Let Jun push straight to the main site', say: 'A push goes live with no review. In a team, I want to check first.' },
          { l: 'Send Jun my GitHub password', say: 'Never. A pull request lets Jun suggest changes without my account.' }] }] },
      { beats: [
        { intro: [N('The code is on GitHub. Now Mei needs a link.')], q: 'How do I get it online?', auto: 1, opts: [
          { l: 'Import Git Repository', ok: 1, say: 'Vercel can read straight from my repository.', set: { importing: 1 } },
          { l: 'Drag the files into Vercel by hand', say: 'No more manual uploads. Vercel reads my GitHub repository.' },
          { l: 'Email the files to Mei', say: 'Mei needs a link, not a zip file.' }] },
        { type: 'deploy', panel: 'Pick kopi-corner, then deploy', intro: [] }] },
      { beats: [
        { intro: [N('Mei is awake, and she has notes.'), M('Change the button to say Reserve Now')], q: 'Which file?', auto: 1, opts: file('index.html', 'The words live in index.html.', { btnText: 1 }) },
        { intro: [M('Make the button orange')], q: 'Which file?', auto: 1, opts: file('styles.css', 'The look lives in styles.css.', { orange: 1 }) },
        { intro: [M('Make the button open a booking form')], q: 'Which file?', auto: 1, opts: file('script.js', 'What happens on a click lives in script.js.', { form: 1 }) },
        { type: 'push7', panel: 'Push once more', intro: [N('All three changes are on my computer. The live site doesn’t have them yet.')] }] },
      { beats: [{ intro: [M("It's perfect. One last thing: can customers log in and collect loyalty stamps? And can it show today's weather?")], q: 'What do I tell Mei?', opts: [
        { l: 'Not yet. It forgets everyone and only knows its own files.', ok: 1, set: { diagram: 1 }, say: [
          'To remember people, the site needs a backend for logins and a database, like Supabase.',
          'When you log in, the site gives your browser a token, a temporary sticker that says this is you.',
          'Live data like the weather needs the site to ask another computer for an answer. Logging in works the same way: it’s just an API call.'] },
        { l: 'Yes, it already does both.', say: 'Not yet. Close the tab and the site forgets you.' }] }] }
    ];
  }
  const S = buildScenes();

  // ---------- State ----------

  const fresh = sc => ({ sc, beat: 0, log: [], wrong: [], done: false, busy: false, f: {}, cards: [], hint: false, repo: '', shareOpen: false });
  let state = fresh(0);
  let timers = [];
  let clockMin = 0, clockText = '6:00 pm', clockRaf = 0;
  let renderQueued = false, lastLogLen = 0;

  const setState = patch => {
    state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
    if (!renderQueued) { renderQueued = true; queueMicrotask(render); }
  };
  const setF = o => setState(st => ({ f: { ...st.f, ...o } }));
  const pushLog = (items, extra = {}) => setState(st => ({ ...extra, log: [...st.log, ...items] }));
  const nar = (t, miss) => ({ who: 'nar', t, miss });
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clear = () => { timers.forEach(clearTimeout); timers = []; };

  // ---------- Story logic ----------

  function start(n) {
    clear();
    state = fresh(n);
    setState({});
    if (n >= 1 && n <= 8) enter(0);
    if (n === 9) later(() => setF({ door: 1 }), 350);
    tickClock(n);
  }

  function enter(b) {
    const sc = state.sc, beat = S[sc].beats[b];
    setState(st => ({ beat: b, done: false, busy: false, wrong: [], hint: false, shareOpen: false, log: [...st.log, ...(beat.intro || [])] }));
    if (beat.hint) later(() => {
      if (state.sc === sc && state.beat === b && !state.done) pushLog([nar("It's in the Share menu, and it's easy to miss.")], { hint: true });
    }, 10000);
    if (sc === 4 && b === 0) [1, 2, 3].forEach(i => later(() => setF({ files: i }), 450 * i));
  }

  function choose(i) {
    const { sc, beat, done, wrong } = state, b = S[sc].beats[beat], o = b.opts[i];
    if (done || wrong.includes(i)) return;
    if (b.type === 'git') return git(o.l);
    const you = b.type === 'share' ? [] : [{ who: 'you', t: o.l }];
    const says = [].concat(o.say || []).map(t => nar(t, !o.ok));
    if (o.ok) {
      setState(st => ({ done: true, busy: !!b.auto, shareOpen: false, f: { ...st.f, ...(o.set || {}) }, log: [...st.log, ...you, ...says] }));
      if (b.auto) later(() => enter(beat + 1), 1500);
    } else pushLog([...you, ...says], { wrong: [...wrong, i] });
  }

  function git(l) {
    const f = state.f, g = f.git || [], you = { who: 'you', t: l };
    if (l === 'git commit') {
      if (f.committed) return;
      pushLog([you], { f: { ...f, committed: 1, git: [...g, { t: '$ git commit -m "First version"', c: '#f1efe8' }, { t: '[main] 3 files saved on my computer', c: 'rgba(241,239,232,.6)' }] } });
    } else if (!f.committed) {
      pushLog([you, nar('A commit saves my work on my computer first. A push sends it to GitHub.', true)], { f: { ...f, git: [...g, { t: '$ git push', c: '#f1efe8' }, { t: 'Nothing new to push', c: '#ff8a7a' }] } });
    } else {
      pushLog([you, nar("That's my first commit and push.")], { done: true, f: { ...f, pushed: 1, git: [...g, { t: '$ git push', c: '#f1efe8' }, { t: '→ main · 3 files sent to GitHub', c: '#9be39b' }] } });
    }
  }

  function addCard(id) {
    const { done, cards, wrong } = state, c = CARDS.find(x => x.id === id);
    if (done || cards.includes(id) || wrong.includes(id)) return;
    if (!c.good) return pushLog([nar("Too vague. Claude can't build a feeling. I need to say exactly what I want.", true)], { wrong: [...wrong, id] });
    const next = [...cards, id];
    if (next.length === GOOD_CARDS) pushLog([nar("Same idea, better instructions. That's the art of prompting.")], { cards: next, done: true });
    else setState({ cards: next });
  }

  function createRepo() {
    if (state.f.repoMade) return;
    if (state.repo.trim().toLowerCase() !== 'kopi-corner') return pushLog([nar('I’ll call it kopi-corner, so everyone knows what it is.', true)]);
    setState(st => ({ done: true, busy: true, f: { ...st.f, repoMade: 1 } }));
    later(() => enter(1), 900);
  }

  function deploy() {
    if (state.f.building) return;
    setF({ building: 1, bp: 0, bl: 0 });
    later(() => setF({ bp: 100 }), 60);
    [1, 2, 3].forEach(i => later(() => setF({ bl: i }), 650 * i));
    later(() => { setF({ live: 1 }); pushLog([nar("GitHub stores the code, but it isn't a website yet. Vercel turns it into one.")], { done: true }); }, 2700);
  }

  function push7() {
    if (state.f.pushing) return;
    setF({ pushing: 1 });
    later(() => { setF({ live7: 1 }); pushLog([nar('From now on, I never upload anything again.')], { done: true }); }, 1500);
  }

  // The clock eases from the last scene's time to this scene's time.
  function fmtClock(m) {
    const tot = (1080 + Math.round(m / 5) * 5) % 1440, h = Math.floor(tot / 60), mm = tot % 60;
    return `${h % 12 || 12}:${String(mm).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`;
  }
  function tickClock(n) {
    const from = clockMin, to = TIMES[n], t0 = performance.now(), dur = from === to ? 0 : 1200;
    cancelAnimationFrame(clockRaf);
    const step = now => {
      const p = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - Math.pow(1 - p, 3);
      clockMin = from + (to - from) * e;
      clockText = fmtClock(p === 1 ? to : clockMin);
      const el = mount.querySelector('[data-clock]');
      if (el) el.textContent = clockText;
      if (p < 1) clockRaf = requestAnimationFrame(step);
    };
    clockRaf = requestAnimationFrame(step);
  }

  // ---------- Views ----------

  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const when = (cond, html) => cond ? html : '';
  const WHO = { mei: { name: 'Mei · Kopi Corner', init: 'M', av: '#e8742a' }, jun: { name: 'Jun · her cousin', init: 'J', av: '#7aa7ff' } };

  function optionList() {
    const { sc, beat, wrong, f } = state, b = S[sc] && S[sc].beats[beat];
    return ((b && b.opts) || []).map((o, i) => {
      const w = wrong.includes(i), off = w || (b.type === 'git' && o.l === 'git commit' && !!f.committed);
      return { label: o.l, i, off, style: `opacity:${w ? .35 : off ? .5 : 1};text-decoration:${w ? 'line-through' : 'none'}` };
    });
  }

  function viewTitle() {
    return `<div class="ld-title" data-key="title">
      <span class="ld-kicker">Episode 01 · An interactive story in 8 scenes</span>
      <h3>Launch <span class="ld-acc-i">Day</span></h3>
      <p>It’s 6 pm. Mei’s café opens at 8 am tomorrow, and it has no website. I have one night and four tools.</p>
      <div class="ld-chips">
        <span class="ld-chip"><span class="ld-chip-av" style="background:#e8742a">M</span>Mei · café owner</span>
        <span class="ld-chip"><span class="ld-chip-av" style="background:#7aa7ff">J</span>Jun · her cousin</span>
        <span class="ld-chip"><span class="ld-chip-av" style="background:var(--pop)">S</span>Suditi · narrator</span>
      </div>
      <div class="ld-start-row">
        <button class="ld-start" data-act="begin"><span class="ld-play"></span>Start the night</button>
        <span class="ld-rules">No scores · Pick the right move to move on</span>
      </div>
    </div>`;
  }

  function viewS1() {
    return `<div class="ld-browser ld-shadow" data-key="s1">
      <div class="ld-browser-bar ld-dots"><span class="ld-dot"></span><span class="ld-dot"></span><span class="ld-dot"></span><span class="ld-browser-url">kopicorner.com</span></div>
      <div class="ld-404">
        <span class="ld-404-code">404</span>
        <span class="ld-404-head">There’s nothing here yet.</span>
        <span class="ld-404-sub">Kopi Corner has no website.</span>
        <span class="ld-note-sticker">Opening 8 am!</span>
      </div>
    </div>`;
  }

  function viewS2() {
    const { cards, wrong } = state, has = id => cards.includes(id), warm = has('style');
    const pv = {
      bg: warm ? '#f7ead8' : '#e6e6e6', ink: warm ? '#3b2416' : '#555', acc: warm ? '#b4532a' : '#888',
      body: has('role') ? "'Bricolage Grotesque',sans-serif" : 'Arial,sans-serif',
      head: has('role') ? "'Newsreader',serif" : 'Arial,sans-serif'
    };
    const lines = cards.map(id => CARDS.find(c => c.id === id))
      .map(p => `<span class="ld-prompt-line"><span class="ld-prompt-key">${esc(p.k)}:</span> ${esc(p.t)}</span>`).join('');
    const tray = CARDS.map(c => {
      const w = wrong.includes(c.id), off = has(c.id) || w;
      return `<button class="ld-card" data-act="card" data-id="${c.id}" ${off ? 'disabled' : ''} style="opacity:${off ? .3 : 1};text-decoration:${w ? 'line-through' : 'none'}">+ ${esc(c.t)}</button>`;
    }).join('');
    return `<div class="ld-s2" data-key="s2">
      <div class="ld-s2-left">
        <div class="ld-prompt">
          <span class="ld-prompt-head"><span>Prompt</span><span>${cards.length} / ${GOOD_CARDS} details</span></span>
          <span class="ld-prompt-line">Create a website for my café.</span>
          ${lines}
        </div>
        <div class="ld-tray">${tray}</div>
      </div>
      <div class="ld-preview ld-shadow">
        <div class="ld-preview-bar ld-dots"><span class="ld-dot-sm"></span><span class="ld-dot-sm"></span><span style="margin-left:8px">Preview</span></div>
        <div class="ld-preview-body" style="background:${pv.bg};color:${pv.ink};font-family:${pv.body}">
          ${when(has('pages'), `<div class="ld-pv-nav"><span>Home</span><span>Menu</span><span>Our Story</span><span>Find Us</span></div>`)}
          ${when(!has('goal'), `<div class="ld-col8"><span class="ld-ghost-lg"></span><span class="ld-ghost" style="width:90%"></span><span class="ld-ghost" style="width:60%"></span></div>`)}
          ${when(has('goal'), `<div class="ld-col4"><span class="ld-pv-name" style="font-family:${pv.head}">Kopi Corner</span><span class="ld-pv-tag">A cosy neighbourhood café</span></div>`)}
          ${when(has('aud'), `<div class="ld-col8"><span class="ld-pv-aud">Quiet corners for focused work.</span><div class="ld-pv-pills"><span>Free Wi-Fi</span><span>Plugs at every table</span></div></div>`)}
          ${when(has('feat'), `<div class="ld-pv-feat"><span class="ld-pv-cta" style="background:${pv.acc}">Reserve a Table</span><span class="ld-pv-small">Mobile-first</span></div>`)}
          ${when(has('out'), `<div class="ld-pv-out">&lt;/&gt; full page code · plus notes on every design choice</div>`)}
        </div>
      </div>
    </div>`;
  }

  function viewS3() {
    const { beat, done, hint, shareOpen, f } = state;
    const live = beat === 1 && !done;
    const menu = f.warm
      ? { bg: '#8a4a26', ink: '#fff4e6', card: '#a65d33', font: "'Newsreader',serif", title: 'From our kitchen, with love' }
      : { bg: '#ececec', ink: '#444', card: '#dcdcdc', font: 'Arial,sans-serif', title: 'Menu' };
    const items = [{ n: 'Kopi O', p: '$1.80' }, { n: 'Kaya Toast', p: '$2.50' }, { n: 'Teh Tarik', p: '$2.00' }]
      .map(it => `<div class="ld-menu-item" style="background:${menu.card}"><span class="ld-menu-item-n" style="font-family:${menu.font}">${it.n}</span><span class="ld-menu-item-p">${it.p}</span></div>`).join('');
    const opts = optionList().map(o =>
      `<button class="ld-share-opt" data-act="choose" data-i="${o.i}" ${o.off ? 'disabled' : ''} style="${o.style}">${esc(o.label)}</button>`).join('');
    return `<div class="ld-design ld-shadow" data-key="s3">
      <div class="ld-design-bar">
        <span class="ld-design-name">Claude Design</span>
        <span class="ld-design-path">Kopi Corner / Home</span>
        <span class="ld-spacer"></span>
        <div class="ld-share-wrap">
          <button class="ld-share${hint ? ' is-ring' : ''}${live && hint && !shareOpen ? ' is-pulse' : ''}" data-act="share" aria-expanded="${shareOpen}">Share</button>
          ${when(shareOpen, `<div class="ld-share-menu" role="menu">${opts}</div>`)}
        </div>
      </div>
      <div class="ld-design-body">
        <div class="ld-design-head"><span class="ld-kopi">Kopi Corner</span><span class="ld-design-nav"><span>Menu</span><span>Our Story</span><span>Find Us</span></span></div>
        <div class="ld-menu" style="background:${menu.bg};color:${menu.ink}">
          <span class="ld-menu-title" style="font-family:${menu.font}">${menu.title}</span>
          <div class="ld-menu-grid">${items}</div>
        </div>
        ${when(f.handoff, `<span class="ld-sent">→ Sent to Claude Code</span>`)}
      </div>
    </div>`;
  }

  function viewS4() {
    const f = state.f;
    const term = [{ t: '$ claude', c: 'rgba(241,239,232,.55)' }, { t: '> Build Kopi Corner from the design handoff', c: '#f1efe8' }]
      .concat(['index.html', 'styles.css', 'script.js'].slice(0, f.files || 0).map(n => ({ t: '+ created ' + n, c: '#9be39b' })))
      .concat(f.r1 ? [{ t: '↻ routine: check the site for errors · every hour', c: '#ffc94a' }] : [])
      .concat(f.r2 ? [{ t: '✎ refactor: code tidied · behaviour unchanged', c: '#ffc94a' }] : [])
      .concat(f.r3 ? [{ t: '◷ session: 3 files changed · 2 errors fixed · 14 commands', c: '#ffc94a' }] : []);
    return `<div class="ld-cc" data-key="s4">
      <div class="ld-cc-bar ld-dots"><span class="ld-dot-dark"></span><span class="ld-dot-dark"></span><span class="ld-dot-dark"></span><span style="margin-left:10px">claude code — kopi-corner</span></div>
      <div class="ld-cc-body">
        ${term.map(l => `<span style="color:${l.c}">${esc(l.t)}</span>`).join('')}
        <span class="ld-cursor"></span>
      </div>
    </div>`;
  }

  function viewS5() {
    const { f, beat, sc, repo } = state;
    const rows = [{ n: 'index.html', m: f.merged ? 'Fix opening hours (Jun)' : 'First version' }, { n: 'styles.css', m: 'First version' }, { n: 'script.js', m: 'First version' }];
    let pane;
    if (!f.newRepo) pane = `<div class="ld-gh-pane" data-key="gh-list">
        <div class="ld-gh-row"><span class="ld-gh-h">Repositories</span><button class="ld-gh-btn ld-pulse" data-act="newRepo">New repository</button></div>
        <span class="ld-gh-empty">No repositories yet.</span>
      </div>`;
    else if (!f.repoMade) pane = `<div class="ld-gh-pane is-form" data-key="gh-form">
        <span class="ld-gh-h">Create a new repository</span>
        <label class="ld-gh-label">Repository name
          <input class="ld-gh-input" data-input="repo" value="${esc(repo)}" placeholder="kopi-corner" autocomplete="off" spellcheck="false">
        </label>
        <span class="ld-gh-help">Type <b>kopi-corner</b>, then create it.</span>
        <button class="ld-gh-btn" data-act="createRepo">Create repository</button>
      </div>`;
    else pane = `<div class="ld-gh-pane is-repo" data-key="gh-repo">
        <span class="ld-gh-title"><span style="color:#59636e">suditi /</span> <b>kopi-corner</b></span>
        ${when(!f.pushed, `<span class="ld-gh-empty">This repository is empty.</span>`)}
        ${when(f.pushed, `<div class="ld-gh-files">${rows.map(r => `<div class="ld-gh-file"><span class="ld-mono">${r.n}</span><span class="ld-gh-file-msg">${esc(r.m)}</span></div>`).join('')}</div>`)}
        ${when(f.merged, `<span class="ld-merged"><b>Merged</b> Pull request #1 · Fix opening hours · Jun</span>`)}
      </div>`;
    const showTerm = sc === 5 && beat >= 1;
    return `<div class="ld-col12 ld-s5" data-key="s5">
      <div class="ld-gh ld-shadow">
        <div class="ld-gh-bar"><span style="font-weight:800">GitHub</span><span class="ld-gh-user">suditi</span></div>
        ${pane}
      </div>
      ${when(showTerm, `<div class="ld-term ld-git"><span class="ld-faint">~/kopi-corner</span>${(f.git || []).map(g => `<span style="color:${g.c}">${esc(g.t)}</span>`).join('')}</div>`)}
    </div>`;
  }

  function viewS6() {
    const f = state.f;
    let body;
    if (!f.importing) body = `<div class="ld-vc-body" data-key="vc-home">
        <span class="ld-vc-h1">Let’s put it online.</span>
        <div class="ld-vc-choices"><span class="ld-vc-choice is-main">Import Git Repository</span><span class="ld-vc-choice is-alt">Upload files</span></div>
      </div>`;
    else if (!f.picked) body = `<div class="ld-vc-body" data-key="vc-list">
        <span class="ld-vc-h2">Import Git Repository</span>
        <div class="ld-vc-repo"><span class="ld-vc-repo-name">suditi/kopi-corner</span><button class="ld-vc-btn ld-pulse" data-act="pickRepo">Import</button></div>
      </div>`;
    else if (!f.building) body = `<div class="ld-vc-body" data-key="vc-config">
        <span class="ld-vc-h2">Configure kopi-corner</span>
        <span class="ld-vc-meta">Branch: main · Framework: static site</span>
        <button class="ld-vc-btn is-big ld-pulse" data-act="deploy">Deploy</button>
      </div>`;
    else if (!f.live) {
      const lines = ['Cloning suditi/kopi-corner…', 'Installing…', 'Building…', 'Deploying to kopi-corner.vercel.app'].slice(0, (f.bl || 0) + 1);
      body = `<div class="ld-vc-body" data-key="vc-build">
        <span class="ld-vc-h2">Building…</span>
        <div class="ld-vc-track"><div class="ld-vc-fill" style="width:${f.bp || 0}%"></div></div>
        <div class="ld-vc-log">${lines.map(b => `<span>${esc(b)}</span>`).join('')}</div>
      </div>`;
    } else body = `<div class="ld-vc-body" data-key="vc-live">
        <span class="ld-vc-ready">● Ready</span>
        <span class="ld-vc-live">It’s live.</span>
        <span class="ld-vc-url">kopi-corner.vercel.app ↗</span>
      </div>`;
    return `<div class="ld-vc ld-shadow" data-key="s6">
      <div class="ld-vc-bar"><span class="ld-vc-logo"></span><span style="font-weight:800">Vercel</span><span class="ld-vc-sub">New project</span></div>
      ${body}
    </div>`;
  }

  function viewS7() {
    const { f, sc, beat } = state;
    const site = on => ({ btn: on.btnText ? 'Reserve Now' : 'Reserve a Table', btnBg: on.orange ? '#e8742a' : '#3b2416', form: !!on.form });
    const n = ['btnText', 'orange', 'form'].filter(k => f[k]).length;
    const panes = [
      { title: 'On my computer', status: n ? `${n} change${n > 1 ? 's' : ''}` : 'no changes', url: 'localhost:3000', dot: '#ffc94a', ...site(f) },
      { title: 'Live site', status: f.live7 ? 'updated just now' : 'waiting for a push', url: 'kopi-corner.vercel.app', dot: f.live7 ? '#5fd35f' : '#888', ...site(f.live7 ? f : {}) }
    ];
    const paneHTML = panes.map(p => `<div class="ld-pane">
        <span class="ld-pane-label"><span class="ld-pane-dot" style="background:${p.dot}"></span>${p.title} · ${p.status}</span>
        <div class="ld-site">
          <div class="ld-urlbar">${p.url}</div>
          <div class="ld-site-body">
            <span class="ld-site-name">Kopi Corner</span>
            <span style="font-size:13px">Quiet corners for focused work.</span>
            <span class="ld-site-cta" style="background:${p.btnBg}">${p.btn}</span>
            ${when(p.form, `<div class="ld-booking"><b>Book a table</b><span class="ld-booking-row"><span>Date</span><span>Time</span><span>Guests</span></span></div>`)}
          </div>
        </div>
      </div>`).join('');
    return `<div class="ld-col12" data-key="s7">
      <div class="ld-panes">${paneHTML}</div>
      ${when(sc === 7 && beat === 3 && !f.pushing, `<div class="ld-term ld-push-row"><span class="ld-push-prompt">~/kopi-corner $</span><button class="ld-push-btn ld-pulse" data-act="push7">git push</button></div>`)}
      ${when(f.pushing, `<div class="ld-term ld-ok">→ pushed to GitHub · Vercel is rebuilding the live site…</div>`)}
    </div>`;
  }

  function viewS8() {
    return `<div class="ld-s8" data-key="s8">
      <div class="ld-site ld-shadow">
        <div class="ld-urlbar">kopi-corner.vercel.app</div>
        <div class="ld-site-body">
          <div class="ld-s8-head"><span class="ld-site-name">Kopi Corner</span><span class="ld-login ld-dashed">Log in ?</span></div>
          <div class="ld-s8-boxes">
            <div class="ld-s8-box ld-dashed"><b>Loyalty stamps</b><span>Who are you? The site doesn’t know.</span></div>
            <div class="ld-s8-box ld-dashed"><b>Today’s weather</b><span>Not in any of its files.</span></div>
          </div>
        </div>
      </div>
      ${when(state.f.diagram, `<div class="ld-diagram">
        <div class="ld-node is-you"><b>Your browser</b><span class="ld-token">TOKEN · this is you</span></div>
        <span class="ld-api">⇄ API call</span>
        <div class="ld-node"><b>Backend + database</b><span>Supabase: logins, stamps</span></div>
        <span class="ld-api">⇄ API call</span>
        <div class="ld-node"><b>Another computer</b><span>Weather service: today’s answer</span></div>
      </div>`)}
    </div>`;
  }

  function viewLog() {
    return state.log.map(m => {
      if (m.who === 'you') return `<span class="ld-you">${esc(m.t)}</span>`;
      if (m.who === 'nar') return `<div class="ld-cap${m.miss ? ' is-miss' : ''}">
          <span class="ld-cap-mono ld-cap-label">${m.miss ? 'Suditi · try again' : 'Suditi · narrator'}</span>
          <span class="ld-cap-text">${esc(m.t)}</span>
        </div>`;
      const w = WHO[m.who];
      return `<div class="ld-msg">
          <span class="ld-av" style="background:${w.av}">${w.init}</span>
          <div class="ld-msg-body"><span class="ld-cap-mono ld-msg-name">${w.name}</span><span class="ld-bubble">${esc(m.t)}</span></div>
        </div>`;
    }).join('');
  }

  function viewControls() {
    const { sc, beat, done, busy } = state, b = S[sc].beats[beat];
    const lastBeat = beat === S[sc].beats.length - 1;
    let html = '';
    if (!done && !b.panel) {
      html += `<span class="ld-cap-mono ld-q">${esc(b.q || 'Your move')}</span>`;
      html += optionList().map(o => `<button class="ld-opt" data-act="choose" data-i="${o.i}" ${o.off ? 'disabled' : ''} style="${o.style}">${esc(o.label)}</button>`).join('');
    }
    if (!done && b.panel) html += `<span class="ld-panel-note">← ${esc(b.panel)}</span>`;
    if (done && !busy) html += `<button class="ld-next" data-act="next">${!lastBeat ? 'Continue →' : sc === 8 ? 'Open the doors →' : 'Next scene →'}</button>`;
    return html;
  }

  function viewPlaying() {
    const views = [null, viewS1, viewS2, viewS3, viewS4, viewS5, viewS6, viewS7, viewS8];
    return `<div class="ld-play-area" data-key="playing">
      <div class="ld-stage">${views[state.sc]()}</div>
      <div class="ld-dialogue">
        <div class="ld-log" data-log>${viewLog()}</div>
        <div class="ld-controls">${viewControls()}</div>
      </div>
    </div>`;
  }

  function viewEnd() {
    const open = !!state.f.door;
    return `<div class="ld-end" data-key="end">
      <div class="ld-end-copy">
        <span class="ld-end-kicker">8:00 am · The first customer walks in</span>
        <h3>Kopi Corner is <span class="it">live.</span></h3>
        <span class="ld-end-done">Episode 01 complete.</span>
        <span class="ld-end-next">Next episode: coming soon.</span>
        <div class="ld-end-btns">
          <button class="ld-replay" data-act="replay">Replay episode</button>
          <a class="ld-end-link" href="#notes">Read my notes</a>
        </div>
      </div>
      <div class="ld-doors" aria-hidden="true">
        <div class="ld-door is-left" style="transform:translateX(${open ? '-102%' : '0%'})"><span class="ld-handle"></span></div>
        <div class="ld-door is-right" style="transform:translateX(${open ? '102%' : '0%'})"><span class="ld-handle"></span></div>
      </div>
    </div>`;
  }

  function view() {
    const { sc } = state, playing = sc >= 1 && sc <= 8;
    const label = playing ? `Scene ${sc} of 8 · ${TITLES[sc]}` : sc === 0 ? 'Episode 01 · Interactive story' : 'Episode 01 · Complete';
    return `<div class="ld">
      <div class="ld-top">
        <span class="ld-brand">Launch <span class="ld-acc-i">Day</span></span>
        <span class="ld-scene">${label}</span>
        <span class="ld-spacer"></span>
        <span class="ld-clock"><span class="ld-clock-dot"></span><span class="ld-clock-time" data-clock>${clockText}</span></span>
      </div>
      <div class="ld-night"><div class="ld-night-fill" style="width:${(TIMES[sc] / 840 * 100).toFixed(1)}%"></div></div>
      ${sc === 0 ? viewTitle() : playing ? viewPlaying() : viewEnd()}
    </div>`;
  }

  // ---------- Rendering ----------
  // Views return HTML strings. morph() patches the live DOM to match, so
  // elements stay in place and CSS transitions (clock bar, build bar, doors,
  // preview colours) run as they should. data-key marks a node to replace whole.

  function toNode(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function morph(from, to) {
    if (from.nodeType !== to.nodeType || from.nodeName !== to.nodeName ||
        (from.nodeType === 1 && from.getAttribute('data-key') !== to.getAttribute('data-key'))) {
      from.replaceWith(to);
      return;
    }
    if (from.nodeType !== 1) {
      if (from.nodeValue !== to.nodeValue) from.nodeValue = to.nodeValue;
      return;
    }
    for (const a of [...from.attributes]) if (!to.hasAttribute(a.name)) from.removeAttribute(a.name);
    for (const a of [...to.attributes]) if (from.getAttribute(a.name) !== a.value) from.setAttribute(a.name, a.value);
    if (from.tagName === 'INPUT') {
      const v = to.getAttribute('value') || '';
      if (from.value !== v) from.value = v;
    }
    const fc = [...from.childNodes], tc = [...to.childNodes];
    tc.forEach((child, i) => i < fc.length ? morph(fc[i], child) : from.appendChild(child));
    for (let i = tc.length; i < fc.length; i++) fc[i].remove();
  }

  function render() {
    renderQueued = false;
    const next = toNode(view());
    if (mount.firstElementChild && mount.firstElementChild.classList.contains('ld')) morph(mount.firstElementChild, next);
    else mount.replaceChildren(next);

    const log = mount.querySelector('[data-log]');
    if (log && state.log.length !== lastLogLen) log.scrollTo({ top: log.scrollHeight, behavior: 'smooth' });
    lastLogLen = state.log.length;
  }

  // ---------- Events ----------

  mount.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled || !mount.contains(el)) return;
    const { sc, beat, done } = state;
    switch (el.dataset.act) {
      case 'begin': case 'replay': return start(1);
      case 'choose': return choose(+el.dataset.i);
      case 'card': return addCard(el.dataset.id);
      case 'share': if (sc === 3 && beat === 1 && !done) setState(st => ({ shareOpen: !st.shareOpen })); return;
      case 'newRepo': return setF({ newRepo: 1 });
      case 'createRepo': return createRepo();
      case 'pickRepo': return setF({ picked: 1 });
      case 'deploy': return deploy();
      case 'push7': return push7();
      case 'next': {
        const lastBeat = beat === S[sc].beats.length - 1;
        return lastBeat ? start(sc + 1) : enter(beat + 1);
      }
    }
  });
  mount.addEventListener('input', e => {
    if (e.target.matches('[data-input="repo"]')) setState({ repo: e.target.value });
  });
  mount.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches('[data-input="repo"]')) createRepo();
  });

  render();
})();
