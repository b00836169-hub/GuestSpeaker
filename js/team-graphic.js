// Shared "virtual team" control-room motion graphic (Episode 02 + Home).
// TeamGraphic.mount(canvas, { labels: true }) -> { setActive(i), destroy() }
(function () {
  const LABELS = ['The brief', 'Brief Writer', 'Validator', 'Strategist', 'You', 'Creative'];
  function mount(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, raf = 0, active = opts.active ?? -1, glowA = [0, 0, 0, 0, 0, 0], coreBoost = 0;
    const seeds = LABELS.map((_, i) => [Math.random(), Math.random()]);
    function size() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height;
      canvas.width = Math.max(1, w * dpr); canvas.height = Math.max(1, h * dpr);
    }
    const ro = new ResizeObserver(size); ro.observe(canvas); size();
    function bez(a, c, b, t) { const u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; }
    function frame(now) {
      const t = now / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, m = Math.min(w, h), R = m * 0.075;
      const rx = w * 0.36, ry = h * 0.34;
      for (let i = 0; i < 6; i++) {
        const target = active < 0 ? 0 : i === active ? 1 : i < active ? 0.45 : 0;
        glowA[i] += (target - glowA[i]) * 0.08;
      }
      coreBoost += ((active < 0 ? 0 : 0.35 + (active >= 4 ? 0.4 : 0) + active * 0.04) - coreBoost) * 0.06;
      // floor rings
      ctx.lineWidth = 1;
      for (let k = 1; k <= 3; k++) {
        ctx.strokeStyle = 'rgba(242,238,230,' + (0.07 - k * 0.015) + ')';
        ctx.beginPath(); ctx.ellipse(cx, cy, rx * k * 0.42, ry * k * 0.42, 0, 0, Math.PI * 2); ctx.stroke();
      }
      const nodes = LABELS.map((_, i) => {
        const a = -Math.PI / 2 + i * Math.PI / 3;
        return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, a];
      });
      // threads + pulses
      nodes.forEach((n, i) => {
        const g = glowA[i];
        const mx = (n[0] + cx) / 2, my = (n[1] + cy) / 2;
        const px = -(n[1] - cy) * 0.18, py = (n[0] - cx) * 0.18;
        const c = [mx + px, my + py];
        ctx.strokeStyle = 'rgba(255,90,54,' + (0.22 + g * 0.5) + ')';
        ctx.lineWidth = 1 + g * 1.5;
        ctx.shadowColor = 'rgba(255,120,60,.8)'; ctx.shadowBlur = 6 + g * 14;
        ctx.beginPath(); ctx.moveTo(n[0], n[1]); ctx.quadraticCurveTo(c[0], c[1], cx, cy); ctx.stroke();
        const speed = 0.16 + g * 0.35;
        for (let p = 0; p < 2; p++) {
          const tt = ((t * speed + seeds[i][p] + p * 0.5) % 1);
          const pt = bez([n[0], n[1]], c, [cx, cy], i % 2 ? 1 - tt : tt);
          const fade = Math.sin(tt * Math.PI);
          ctx.fillStyle = 'rgba(255,201,74,' + (0.35 + g * 0.65) * fade + ')';
          ctx.shadowColor = '#ffc94a'; ctx.shadowBlur = 12 + g * 10;
          ctx.beginPath(); ctx.arc(pt[0], pt[1], 2 + g * 1.6, 0, Math.PI * 2); ctx.fill();
        }
      });
      // core
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.4);
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * (3.2 + coreBoost * 1.6 + pulse * 0.4));
      cg.addColorStop(0, 'rgba(255,230,170,' + (0.95) + ')');
      cg.addColorStop(0.18, 'rgba(255,201,74,' + (0.75 + coreBoost * 0.25) + ')');
      cg.addColorStop(0.45, 'rgba(255,90,54,' + (0.28 + coreBoost * 0.25) + ')');
      cg.addColorStop(1, 'rgba(255,90,54,0)');
      ctx.shadowBlur = 0; ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(cx, cy, R * (3.2 + coreBoost * 1.6 + pulse * 0.4), 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,201,74,.45)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.25 + pulse * 3, 0, Math.PI * 2); ctx.stroke();
      // figures at desks
      const s = m * 0.11;
      nodes.forEach((n, i) => {
        const g = glowA[i], x = n[0], y = n[1] + s * 0.1;
        const breathe = Math.sin(t * 1.2 + i) * 0.6;
        ctx.shadowColor = 'rgba(255,201,74,.9)'; ctx.shadowBlur = 10 + g * 22;
        // aura
        if (g > 0.02) {
          const ag = ctx.createRadialGradient(x, y - s * 0.2, 0, x, y - s * 0.2, s * 1.1);
          ag.addColorStop(0, 'rgba(255,201,74,' + 0.22 * g + ')'); ag.addColorStop(1, 'rgba(255,201,74,0)');
          ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(x, y - s * 0.2, s * 1.1, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,201,74,' + (0.1 + g * 0.3) + ')';
        ctx.strokeStyle = 'rgba(255,201,74,' + (0.45 + g * 0.55) + ')';
        ctx.lineWidth = 1.2;
        // head
        ctx.beginPath(); ctx.arc(x, y - s * 0.62 + breathe, s * 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        // shoulders
        ctx.beginPath();
        ctx.moveTo(x - s * 0.3, y - s * 0.02);
        ctx.quadraticCurveTo(x - s * 0.3, y - s * 0.4 + breathe, x, y - s * 0.4 + breathe);
        ctx.quadraticCurveTo(x + s * 0.3, y - s * 0.4 + breathe, x + s * 0.3, y - s * 0.02);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // desk + screen glow
        ctx.shadowBlur = 8 + g * 10; ctx.shadowColor = 'rgba(255,90,54,.9)';
        ctx.strokeStyle = 'rgba(255,90,54,' + (0.5 + g * 0.5) + ')'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - s * 0.5, y + s * 0.02); ctx.lineTo(x + s * 0.5, y + s * 0.02); ctx.stroke();
        ctx.fillStyle = 'rgba(255,90,54,' + (0.15 + g * 0.35 + 0.08 * Math.sin(t * 3 + i)) + ')';
        ctx.fillRect(x + s * 0.12, y - s * 0.24, s * 0.3, s * 0.2);
        ctx.shadowBlur = 0;
        if (opts.labels !== false && w > 260) {
          ctx.font = '500 ' + Math.max(9, Math.min(11, m * 0.026)) + 'px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = g > 0.5 ? '#f2eee6' : 'rgba(167,166,180,' + (0.85 + g * 0.15) + ')';
          const ly = n[1] < cy ? y - s * 0.95 : y + s * 0.42;
          ctx.fillText(LABELS[i].toUpperCase(), x, ly);
        }
      });
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return { setActive(i) { active = i; }, destroy() { cancelAnimationFrame(raf); ro.disconnect(); } };
  }
  window.TeamGraphic = { mount, LABELS };
})();
