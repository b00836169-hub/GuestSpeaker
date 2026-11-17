// "Get Cited": Episode 03 game.
// A LinkedIn-style feed built from real DOM, not canvas, so it can
// actually look like the app. Not LinkedIn. A class simulation.
// Mounts into #geo-feed on the page.
(() => {
  const mount = document.getElementById('geo-feed');
  if (!mount) return;
  const $ = s => mount.querySelector(s);

  const coverScreen = $('#geo-cover-screen');
  const endScreen = $('#geo-end-screen');
  const playBtn = $('#geo-play-btn');
  const againBtn = $('#geo-again-btn');
  const decision = $('#geo-decision');
  const decisionStep = $('#geo-decision-step');
  const decisionQ = $('#geo-decision-q');
  const decisionOptions = $('#geo-decision-options');
  const feedBody = $('#geo-feed-body');
  const endTitle = $('#geo-end-title');
  const aiPanel = $('#geo-ai-panel');

  // Three choices. Each "strong" pick is worth one point toward being cited.
  const STEPS = [
    {
      label: 'Headline',
      q: 'Which headline goes out?',
      key: 'headline',
      options: [
        { tag: 'Weak', strong: false, text: 'Our Thoughts on the Future of Marketing' },
        { tag: 'Strong', strong: true, text: 'How B2B Teams Can Measure LinkedIn Thought Leadership ROI' }
      ]
    },
    {
      label: 'Structure',
      q: 'How should the post read?',
      key: 'body',
      options: [
        {
          tag: 'Weak', strong: false,
          text: 'One long paragraph. No headings, no breaks.',
          html: '<p>Marketing today is changing fast and brands need to think about search and social and now AI which reads content differently than people do, and it all matters for long-term brand building.</p>'
        },
        {
          tag: 'Strong', strong: true,
          text: 'Clear headings. A bulleted list. Easy to scan.',
          html: '<p><strong>Three ways to measure thought leadership ROI:</strong></p><ul><li>Track branded search lift, not just impressions</li><li>Watch for AI assistants citing the post</li><li>Measure meaningful comments, not just likes</li></ul>'
        }
      ]
    },
    {
      label: 'Evidence',
      q: 'What backs it up?',
      key: 'evidence',
      options: [
        { tag: 'Weak', strong: false, text: 'Our research shows great results.' },
        { tag: 'Strong', strong: true, text: '40 client accounts, Q3 2026, measured against last year’s baseline.' }
      ]
    }
  ];

  let stepIndex = 0;
  let score = 0;
  let picks = {};

  function fillerCard() {
    const d = document.createElement('div');
    d.className = 'filler-card';
    d.innerHTML = '<div class="filler-avatar"></div><div class="filler-lines"><div class="filler-line w60"></div><div class="filler-line w40"></div></div>';
    return d;
  }

  function draftCard() {
    const d = document.createElement('div');
    d.className = 'post-card is-draft';
    d.id = 'geo-draft-post';
    d.innerHTML = `
      <div class="post-head">
        <div class="post-avatar">FB</div>
        <div class="post-id"><span class="post-name">Fintech Brand</span><span class="post-sub">Company page · Drafting…</span></div>
      </div>
      <p class="post-placeholder" id="geo-draft-text">Writing the post, one choice at a time…</p>
    `;
    return d;
  }

  function renderFeed() {
    feedBody.innerHTML = '';
    feedBody.appendChild(fillerCard());
    feedBody.appendChild(draftCard());
    feedBody.appendChild(fillerCard());
  }

  function updateDraftPreview() {
    const el = $('#geo-draft-text');
    if (!el) return;
    const bits = [];
    if (picks.headline) bits.push(`<strong>${picks.headline.text}</strong>`);
    if (picks.body) bits.push(picks.body.html);
    if (picks.evidence) bits.push(`<span class="post-evidence">${picks.evidence.text}</span>`);
    el.outerHTML = bits.length
      ? `<div class="post-body" id="geo-draft-text">${bits.join('')}</div>`
      : '<p class="post-placeholder" id="geo-draft-text">Writing the post, one choice at a time…</p>';
  }

  function showDecision() {
    const step = STEPS[stepIndex];
    decisionStep.textContent = `${stepIndex + 1} / ${STEPS.length} · ${step.label}`;
    decisionQ.textContent = step.q;
    decisionOptions.innerHTML = '';
    step.options.forEach(opt => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'decision-option';
      b.innerHTML = `<span class="decision-option-label">${opt.tag}</span><span class="decision-option-text">${opt.text}</span>`;
      b.addEventListener('click', () => choose(step, opt));
      decisionOptions.appendChild(b);
    });
    decision.hidden = false;
  }

  function choose(step, opt) {
    picks[step.key] = opt;
    if (opt.strong) score++;
    updateDraftPreview();
    stepIndex++;
    if (stepIndex < STEPS.length) {
      showDecision();
    } else {
      decision.hidden = true;
      finishPost();
    }
  }

  function finishPost() {
    const draft = $('#geo-draft-post');
    if (draft) {
      draft.classList.remove('is-draft');
      draft.id = '';
      const sub = draft.querySelector('.post-sub');
      if (sub) sub.textContent = 'Company page · Marketing';
      draft.innerHTML = `
        <div class="post-head">
          <div class="post-avatar">FB</div>
          <div class="post-id"><span class="post-name">Fintech Brand</span><span class="post-sub">Company page · Marketing</span></div>
        </div>
        <div class="post-headline">${picks.headline.text}</div>
        <div class="post-body">${picks.body.html}<p class="post-evidence">${picks.evidence.text}</p></div>
        <p class="post-meta">182 reactions · 24 comments</p>
        <div class="post-actions"><span class="post-action">Like</span><span class="post-action">Comment</span><span class="post-action">Repost</span><span class="post-action">Send</span></div>
      `;
    }
    setTimeout(showEnd, 900);
  }

  function showEnd() {
    const cited = score >= 2;
    endTitle.innerHTML = cited ? 'Cited.' : 'Not cited.';
    const dots = [0, 1, 2].map(i => `<span class="score-dot${i < score ? ' is-on' : ''}"></span>`).join('');

    if (cited) {
      aiPanel.innerHTML = `
        <span class="ai-panel-label">AI Overview</span>
        <p class="ai-panel-text">Based on a recent LinkedIn post from Fintech Brand: "${picks.headline.text}." It recommends tracking branded search lift, AI citations and meaningful comments instead of raw impressions.</p>
        <p class="ai-panel-source">Source: Fintech Brand, LinkedIn, 13 November 2026</p>
        <div class="score-row"><div class="score-meter">${dots}</div><span class="score-label">${score} / 3 strong choices</span></div>
      `;
    } else {
      aiPanel.innerHTML = `
        <span class="ai-panel-label">AI Overview</span>
        <p class="ai-panel-text">Based on two independent marketing guides. Fintech Brand's post wasn't specific or well-sourced enough to reference directly.</p>
        <p class="ai-panel-source">Source: two other publishers, not Fintech Brand</p>
        <div class="score-row"><div class="score-meter">${dots}</div><span class="score-label">${score} / 3 strong choices</span></div>
      `;
    }
    endScreen.hidden = false;
  }

  function resetGame() {
    stepIndex = 0; score = 0; picks = {};
    endScreen.hidden = true;
    renderFeed();
    showDecision();
  }

  playBtn.addEventListener('click', () => {
    coverScreen.hidden = true;
    resetGame();
  });
  againBtn.addEventListener('click', () => {
    endScreen.hidden = true;
    resetGame();
  });
})();
