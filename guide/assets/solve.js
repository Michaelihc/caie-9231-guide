// "Watch it solved" player. Each .solve panel holds
//   <ol class="solve-steps"><li data-line="n"><span class="w">words</span> maths</li>…</ol>   (KaTeX rendered at build)
// data-line = which on-screen line the step writes to. Same line ⇒ morph in place (∫ signs just appear).
// New line number ⇒ side calculation on a new line, glyphs copied from the active line.
// Morph keeps the line's structure: glyphs matched in reading order slide as a block; reordered glyphs arc in their
// own lane (moving left ⇒ over the line, moving right ⇒ under); leaving glyphs fade first; new glyphs fade in last,
// briefly highlighted. Flying copies are placed on the exact text box of each glyph and cross-fade into the real
// line, so nothing snaps at the end.
window.CAIE_SOLVE = (() => {
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MOVE_MS = 900, FADE_MS = 160;
  // pause after a step = how much there is to take in: glyphs that are new or moved on their own (block slides
  // are free). A derivative or a copy ⇒ short; collecting terms ⇒ longer. data-hold="ms" on a step overrides.
  // Tune here: PAUSE.base + PAUSE.perGlyph × work, clamped to [PAUSE.min, PAUSE.max] ms. Work is only a proxy for
  // "how much to take in"; when it's wrong for a step, set data-hold on that step instead of bending these numbers.
  const PAUSE = { base: 300, perGlyph: 60, min: 450, max: 2400 };
  const holdFor = (work) => Math.max(PAUSE.min, Math.min(PAUSE.max, PAUSE.base + PAUSE.perGlyph * work));
  const EASE = "cubic-bezier(.65,0,.35,1)";                       // ease-in-out, same for every glyph
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const blank = (t) => /^[\s​]*$/.test(t);

  // visible glyph pieces of a rendered line: text leaves, fraction bars, svg pieces (roots, big brackets)
  function leaves(line) {
    const out = [];
    const walk = (node) => {
      if (node.matches(".frac-line")) { out.push({ el: node, key: "bar" }); return; }
      if (node.querySelector(":scope > svg")) { out.push({ el: node, key: "svg" }); return; }
      const kids = [...node.children];
      if (!kids.length) {
        if (!blank(node.textContent)) out.push({ el: node, key: node.textContent });
        return;
      }
      kids.forEach(walk);
    };
    line.querySelectorAll(".katex-html").forEach(walk);
    return out;
  }

  // exact box: text ⇒ the text's own box (not the padded span); bars/svg ⇒ element box
  function boxOf(node, isText) {
    if (!isText) return node.getBoundingClientRect();
    const rg = document.createRange();
    rg.selectNodeContents(node);
    return rg.getBoundingClientRect();
  }

  function snapshot(stage, line) {
    const sr = stage.getBoundingClientRect();
    return leaves(line).map((g) => {
      const text = g.key !== "bar" && g.key !== "svg";
      const r = boxOf(g.el, text);
      const cs = getComputedStyle(g.el);
      return { ...g, text, r: { x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height },
        font: { fontFamily: cs.fontFamily, fontStyle: cs.fontStyle, fontWeight: cs.fontWeight, fontSize: cs.fontSize },
        node: g.key === "svg" ? g.el.cloneNode(true) : null };
    }).filter((g) => g.r.w || g.r.h);
  }

  // a flying copy; placeAll() then puts its own text box exactly on g.r (one read pass, one write pass)
  function glyph(layer, g) {
    let c;
    if (g.key === "bar") { c = el("div"); c.style.background = "currentColor"; }
    else if (g.key === "svg") { c = g.node.cloneNode(true); c.style.overflow = "hidden"; c.style.fontSize = g.font.fontSize; }
    else { c = el("span"); c.textContent = g.key; Object.assign(c.style, g.font, { lineHeight: "normal", whiteSpace: "pre" }); }
    Object.assign(c.style, { position: "absolute", left: "0px", top: "0px", margin: "0", transformOrigin: "0 0" });
    if (!g.text) Object.assign(c.style, { width: `${g.r.w}px`, height: `${g.r.h}px` });
    layer.append(c);
    return c;
  }
  function placeAll(stage, items) {                         // items: [copy, glyph]
    const sr = stage.getBoundingClientRect();
    const at = items.map(([c, g]) => boxOf(c, g.text));      // reads only
    items.forEach(([c, g], n) => {                           // writes only
      c.style.left = `${g.r.x - (at[n].left - sr.left)}px`;
      c.style.top = `${g.r.y - (at[n].top - sr.top)}px`;
    });
  }

  // longest common subsequence of glyph keys (reading order) ⇒ pairs that keep the line's structure
  function lcsPairs(A, B) {
    const n = A.length, m = B.length;
    const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let x = n - 1; x >= 0; x--) for (let y = m - 1; y >= 0; y--)
      L[x][y] = A[x].key === B[y].key ? L[x + 1][y + 1] + 1 : Math.max(L[x + 1][y], L[x][y + 1]);
    const pairs = [];
    for (let x = 0, y = 0; x < n && y < m;) {
      if (A[x].key === B[y].key) { pairs.push([x, y]); x++; y++; }
      else if (L[x + 1][y] >= L[x][y + 1]) x++; else y++;
    }
    return pairs;
  }

  // keyframes along a quadratic curve from offset (dx,dy) to (0,0), bowed by `bow` px (negative = up)
  function curve(dx, dy, s, bow, steps = 16) {
    const frames = [];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps, u = 1 - t;
      const x = u * u * dx + 2 * u * t * (dx / 2);
      const y = u * u * dy + 2 * u * t * (dy / 2 + bow);
      frames.push({ transform: `translate(${x}px, ${y}px) scale(${s + (1 - s) * t})`, offset: t });
    }
    return frames;
  }

  // A = snapshot of the source, B = snapshot of the target (target line is laid out but hidden),
  // X = optional extra source line (substitution: the expression flies in from its own line; X stays put)
  function morph(stage, A, B, inPlace, X = null) {
    const layer = el("div", "solve-layer");
    stage.append(layer);
    const ink = getComputedStyle(stage).color;
    const hl = getComputedStyle(stage).getPropertyValue("--hl-line").trim() || ink;
    const usedA = new Set(), gone = new Set(), matchB = new Map();             // b index -> { r: start box, lane: own curved lane? }
    if (X) {
      // substitution = one run of the line replaced. Same start + same end of the line stay put (matched directly);
      // the new middle comes from X's right side (not its \mathllap'd "dy/dx =" part), in reading order;
      // the old middle (the term being replaced) leaves.
      let p = 0, q = 0;
      while (p < A.length && p < B.length && A[p].key === B[p].key) p++;
      while (q < A.length - p && q < B.length - p && A[A.length - 1 - q].key === B[B.length - 1 - q].key) q++;
      for (let n = 0; n < p; n++) { usedA.add(n); matchB.set(n, { r: A[n].r, lane: false }); }
      for (let n = 1; n <= q; n++) { usedA.add(A.length - n); matchB.set(B.length - n, { r: A[A.length - n].r, lane: false }); }
      for (let n = p; n < A.length - q; n++) gone.add(n);    // replaced term: leaves, never re-used elsewhere
      const rhs = X.filter((g) => !g.el.closest(".llap"));
      const mid = B.slice(p, B.length - q);
      for (const [x, k] of lcsPairs(rhs, mid)) matchB.set(p + k, { r: rhs[x].r, lane: true });
    } else {
      for (const [a, b] of lcsPairs(A, B)) { usedA.add(a); matchB.set(b, { r: A[a].r, lane: false }); }
    }
    const quantity = (k) => /^[0-9A-Za-zͰ-Ͽ]+$/.test(k);
    const nearest = (list, g, ok = () => true) => {
      let best = -1, bestD = Infinity;
      list.forEach((o, n) => {
        if (o.key !== g.key || !ok(n)) return;
        const d = Math.abs(o.r.x - g.r.x) + Math.abs(o.r.y - g.r.y);
        if (d < bestD) { bestD = d; best = n; }
      });
      return best;
    };
    B.forEach((b, y) => {                                      // same glyph moved out of order
      if (matchB.has(y)) return;
      const x = nearest(A, b, (n) => !usedA.has(n) && !gone.has(n));
      if (x >= 0) { usedA.add(x); matchB.set(y, { r: A[x].r, lane: true }); }
    });
    // split: the new line uses a quantity more often than before ⇒ extra copies fly out of the same source glyph
    const pool = X ? [...A, ...X] : A;
    B.forEach((b, y) => {
      if (matchB.has(y) || !quantity(b.key)) return;
      const x = nearest(pool, b);
      if (x >= 0) matchB.set(y, { r: pool[x].r, lane: true });
    });
    const lineH = Math.max(...B.map((b) => b.r.h), 16);
    const opts = { duration: MOVE_MS, easing: EASE, fill: "both" };
    const incoming = B.map((b) => [glyph(layer, b), b]);
    const leaving = inPlace ? A.filter((a, x) => !usedA.has(x)).map((a) => [glyph(layer, a), a]) : [];
    placeAll(stage, [...incoming, ...leaving]);
    layer.work = B.filter((b, y) => !matchB.has(y) || matchB.get(y).lane).length;
    incoming.forEach(([c, b], y) => {
      const m = matchB.get(y);
      if (!m) {                                               // new glyph: fades in over the second half, yellow → ink
        c.animate([{ opacity: 0, color: hl }, { opacity: 0, color: hl, offset: 0.45 }, { opacity: 1, color: hl, offset: 0.75 },
          { opacity: 1, color: ink }], { ...opts, easing: "linear" });
        return;
      }
      const a = m.r;
      const dx = a.x - b.r.x, dy = a.y - b.r.y, s = b.r.h ? a.h / b.r.h : 1;
      if (!m.lane) {                                          // keeps order: slides with the block
        c.animate(curve(dx, dy, s, -Math.sign(dx) * Math.min(Math.abs(dx) * 0.05, 5)), opts);
      } else {                                                // reordered / split / substituted: own lane
        const bow = Math.abs(dy) > lineH ? 0 : (dx > 0 ? -1 : 1) * Math.min(lineH * 0.9 + Math.abs(dx) * 0.18, lineH * 2.2);
        c.animate(curve(dx, dy, s, bow), opts);
        c.animate([{ color: ink }, { color: hl, offset: 0.3 }, { color: hl, offset: 0.7 }, { color: ink }],
          { duration: MOVE_MS, easing: "linear", fill: "both" });
      }
    });
    leaving.forEach(([c, a]) => {
      const y = !X && quantity(a.key) ? nearest(B, a) : -1;   // substitution: replaced glyphs just fade
      if (y >= 0) {                                           // merge: flies into the surviving copy, fades on arrival
        const t = B[y].r, dx = t.x - a.r.x, dy = t.y - a.r.y, s = a.r.h ? t.h / a.r.h : 1;
        c.animate([{ transform: "none" }, { transform: `translate(${dx}px, ${dy}px) scale(${s})` }],
          { duration: MOVE_MS, easing: EASE, fill: "forwards" });
        c.animate([{ opacity: 1 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: MOVE_MS, fill: "forwards" });
        return;
      }
      const out = X ? [{ opacity: 1 }, { opacity: 1, offset: 0.55 }, { opacity: 0, offset: 0.85 }, { opacity: 0 }]   // replaced: fades as the new expression lands
        : [{ opacity: 1 }, { opacity: 0, offset: 0.35 }, { opacity: 0 }];                                          // otherwise: fades early
      c.animate(out, { duration: MOVE_MS, fill: "forwards" });
    });
    return layer;
  }

  // other lines glide to where the layout now puts them
  function glideLines(lines, before) {
    for (const l of lines.children) {
      const t0 = before.get(l);
      if (t0 == null) continue;
      const dy = t0 - l.getBoundingClientRect().top;
      if (Math.abs(dy) > 0.5) l.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: MOVE_MS, easing: EASE });
    }
  }

  function start(panel) {
    if (panel.dataset.started) return;
    panel.dataset.started = "1";
    const list = panel.querySelector(".solve-steps");
    let lineNo = 1;
    const steps = [...list.children].map((li) => {
      lineNo = Number(li.dataset.line) || lineNo;
      return { line: lineNo, from: Number(li.dataset.from) || 0, hold: Number(li.dataset.hold) || 0,
        chain: li.hasAttribute("data-chain"),                // plays straight after the previous step: same beat
        anchor: li.hasAttribute("data-anchor"),              // left edge on the shared anchor column (see setAnchor)
        words: li.querySelector(".w")?.innerHTML || "",
        math: (li.querySelector(".katex-display") || li.querySelector(".katex"))?.outerHTML || "" };
    });
    list.hidden = true;

    const stage = el("div", "solve-stage");
    stage.style.minHeight = `${2.4 + 4.3 * Math.max(...steps.map((st) => st.line))}rem`;   // room for the lines this solve uses
    const label = el("div", "solve-label");
    const lines = el("div", "solve-lines");
    stage.append(label, lines);
    const bar = el("div", "solve-bar");
    const mk = (txt, title) => { const b = el("button", "more-btn", txt); b.type = "button"; b.title = title; bar.append(b); return b; };
    const bBack = mk("◀ Back", "Previous step"), bPlay = mk("Pause", "Play / pause"), bNext = mk("Next ▶", "Next step"),
      bRestart = mk("Restart", "Start again");
    const count = el("span", "count");
    bar.append(count);
    panel.append(stage, bar);

    let i = -1, busy = false, playing = true, timer = null, nextHold = 1200;
    const slot = (n) => lines.children[n - 1];
    const lineEl = (k) => el("div", "solve-line" + (steps[k].anchor ? " anchor" : ""), steps[k].math);
    // anchored lines share one column: \mathllap{…} parts hang left of it, the rest starts on it. So whatever sits on
    // the column in one line (y=, dy/dx= right sides; the terms of the stacked equation) lines up with the others and a
    // substitution drops straight down. Column x chosen so the widest left + right parts sit centred.
    function setAnchor() {
      let L = 0, R = 0;
      for (const st of steps.filter((s) => s.anchor)) {
        const m = el("div", "solve-line anchor", st.math);
        m.style.cssText = "position:absolute;visibility:hidden;padding-left:0";
        lines.append(m);
        const box = m.querySelector(".katex").getBoundingClientRect(), r = document.createRange();
        r.selectNodeContents(m);
        const all = r.getBoundingClientRect();
        L = Math.max(L, box.left - all.left); R = Math.max(R, all.right - box.left);
        m.remove();
      }
      const W = lines.getBoundingClientRect().width;
      lines.style.setProperty("--anchor", `${Math.max(L + 9, (W - L - R) / 2 + L)}px`);
    }
    const mark = () => {
      [...lines.children].forEach((l, n) => {
        l.classList.toggle("dim", n + 1 !== steps[i].line && n + 1 !== steps[i].from);
        l.classList.toggle("final", i === steps.length - 1 && n + 1 === steps[i].line);
      });
    };
    // label text changes at once (layout is final before glyphs are measured) and fades in; fixed height = tallest label
    const setLabel = (html) => {
      label.innerHTML = html;
      if (!REDUCED) label.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: "ease-out" });
    };
    // beats: a chained step belongs to the beat of the step before it. Counter, Back and pauses work in beats.
    const beats = steps.filter((st) => !st.chain).length;
    const beatNo = (k) => steps.slice(0, k + 1).filter((st) => !st.chain).length;
    const update = () => {
      count.textContent = `step ${beatNo(i)} of ${beats}`;
      bPlay.textContent = playing ? "Pause" : i >= steps.length - 1 ? "Play again" : "Play";
      bBack.disabled = i <= 0; bNext.disabled = i >= steps.length - 1;
    };

    // jump to step k with no animation: replay which step each line holds
    function render(k) {
      i = k;
      const holds = [];
      for (let j = 0; j <= k; j++) holds[steps[j].line - 1] = j;
      lines.replaceChildren(...holds.map((j) => lineEl(j)));
      label.innerHTML = steps[k].words;
      mark(); update();
    }

    let lastWork = 0;
    async function stepOnce() {
      if (busy || i >= steps.length - 1) return false;
      if (i < 0 || REDUCED) { render(i + 1); return true; }
      busy = true;
      const k = i + 1, t = steps[k].line;
      const target = slot(t);
      const from = steps[k].from ? slot(steps[k].from) : null;
      // in place: the line itself (+ named line to pull from); new line: copy from named line, else active line
      const source = target || from || slot(steps[i].line);
      const A = snapshot(stage, source);
      const X = target && from ? snapshot(stage, from) : null;
      const before = new Map([...lines.children].map((l) => [l, l.getBoundingClientRect().top]));
      const next = lineEl(k);
      next.style.visibility = "hidden";
      if (target) target.replaceWith(next); else lines.append(next);
      i = k;
      setLabel(steps[k].words);
      mark();
      glideLines(lines, before);
      // glyphs travelling between lines pass over the lines in between ⇒ fade those right down for the move
      const kids = [...lines.children], a = kids.indexOf(target ? (from || next) : (from || slot(steps[k - 1].line))), z = kids.indexOf(next);
      const passed = kids.filter((l, n) => n > Math.min(a, z) && n < Math.max(a, z));
      passed.forEach((l) => l.classList.add("pass"));
      await document.fonts.ready;                         // first use of a KaTeX font (big ∫, tall brackets) loads late
      const B = snapshot(stage, next);
      const layer = morph(stage, A, B, !!target, X);
      lastWork = layer.work;
      await new Promise((ok) => setTimeout(ok, MOVE_MS));
      passed.forEach((l) => l.classList.remove("pass"));
      next.style.visibility = "";                          // real line under the copies, same pixels ⇒ cross-fade
      await layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: "ease-out", fill: "forwards" }).finished;
      layer.remove();
      update();
      busy = false;
      return true;
    }

    // one beat: the step plus any chained steps after it; pause after = total work of the beat (or data-hold)
    async function forward() {
      if (busy || i >= steps.length - 1) return false;
      let work = 0, k;
      do {
        k = i + 1;
        if (!(await stepOnce())) break;
        work += lastWork;
      } while (steps[i + 1]?.chain);
      nextHold = steps[k].hold || holdFor(work);
      return true;
    }

    function schedule() {
      clearTimeout(timer);
      if (!playing) return;
      timer = setTimeout(async () => {
        if (!playing) return;
        if (await forward()) schedule();
        else { playing = false; update(); }
      }, nextHold);
    }

    bNext.onclick = async () => { playing = false; clearTimeout(timer); await forward(); update(); };
    bBack.onclick = () => {
      if (busy || i <= 0) return;
      playing = false; clearTimeout(timer);
      let j = i;
      while (j > 0 && steps[j].chain) j--;                 // start of this beat
      render(Math.max(0, j - 1));                          // end of the beat before
    };
    bRestart.onclick = () => { if (busy) return; render(0); playing = true; update(); schedule(); };
    bPlay.onclick = () => {
      if (busy) return;
      if (i >= steps.length - 1) { render(0); playing = true; }
      else playing = !playing;
      update();
      schedule();
    };
    panel._pause = () => { playing = false; clearTimeout(timer); update(); };

    label.style.minHeight = `${Math.max(...steps.map((st) => { label.innerHTML = st.words; return label.offsetHeight; }))}px`;
    // lay out every step once, hidden, so all fonts they need start loading now (not mid-morph)
    const warm = el("div", "solve-warm", steps.map((st) => st.math).join(""));
    stage.append(warm);
    render(0);
    if (steps.some((st) => st.anchor)) { setAnchor(); addEventListener("resize", setAnchor); }
    document.fonts.ready.then(() => { warm.remove(); if (steps.some((st) => st.anchor)) setAnchor(); schedule(); });
  }

  return { start };
})();
