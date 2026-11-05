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
  const MOVE_MS = 900, HOLD_MS = 1700, FADE_MS = 160;
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

  // A = snapshot of the source, B = snapshot of the target (target line is laid out but hidden)
  function morph(stage, A, B, inPlace) {
    const layer = el("div", "solve-layer");
    stage.append(layer);
    const ink = getComputedStyle(stage).color;
    const hl = getComputedStyle(stage).getPropertyValue("--hl-line").trim() || ink;
    const usedA = new Set(), matchB = new Map();             // b index -> [a index, reordered?]
    for (const [a, b] of lcsPairs(A, B)) { usedA.add(a); matchB.set(b, [a, false]); }
    B.forEach((b, y) => {                                      // leftovers: same glyph moved out of order
      if (matchB.has(y)) return;
      let best = -1, bestD = Infinity;
      A.forEach((a, x) => {
        if (usedA.has(x) || a.key !== b.key) return;
        const d = Math.abs(a.r.x - b.r.x) + Math.abs(a.r.y - b.r.y);
        if (d < bestD) { bestD = d; best = x; }
      });
      if (best >= 0) { usedA.add(best); matchB.set(y, [best, true]); }
    });
    const lineH = Math.max(...B.map((b) => b.r.h), 16);
    const opts = { duration: MOVE_MS, easing: EASE, fill: "both" };
    const incoming = B.map((b) => [glyph(layer, b), b]);
    const leaving = inPlace ? A.filter((a, x) => !usedA.has(x)).map((a) => [glyph(layer, a), a]) : [];
    placeAll(stage, [...incoming, ...leaving]);
    incoming.forEach(([c, b], y) => {
      const m = matchB.get(y);
      if (!m) {                                               // new glyph: fades in over the second half, yellow → ink
        c.animate([{ opacity: 0, color: hl }, { opacity: 0, color: hl, offset: 0.45 }, { opacity: 1, color: hl, offset: 0.75 },
          { opacity: 1, color: ink }], { ...opts, easing: "linear" });
        return;
      }
      const a = A[m[0]].r;
      const dx = a.x - b.r.x, dy = a.y - b.r.y, s = b.r.h ? a.h / b.r.h : 1;
      if (!m[1]) {                                            // keeps order: slides with the block
        c.animate(curve(dx, dy, s, -Math.sign(dx) * Math.min(Math.abs(dx) * 0.05, 5)), opts);
      } else {                                                // reordered: own lane, clear of the block
        const bow = (dx > 0 ? -1 : 1) * Math.min(lineH * 0.9 + Math.abs(dx) * 0.18, lineH * 2.2);
        c.animate(curve(dx, dy, s, bow), opts);
        c.animate([{ color: ink }, { color: hl, offset: 0.3 }, { color: hl, offset: 0.7 }, { color: ink }],
          { duration: MOVE_MS, easing: "linear", fill: "both" });
      }
    });
    leaving.forEach(([c]) => {                                // glyphs that left the line fade out early
      c.animate([{ opacity: 1 }, { opacity: 0, offset: 0.35 }, { opacity: 0 }], { duration: MOVE_MS, fill: "forwards" });
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
      return { line: lineNo, words: li.querySelector(".w")?.innerHTML || "",
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

    let i = -1, busy = false, playing = true, timer = null;
    const slot = (n) => lines.children[n - 1];
    const lineEl = (k) => el("div", "solve-line", steps[k].math);
    const mark = () => {
      [...lines.children].forEach((l, n) => {
        l.classList.toggle("dim", n + 1 !== steps[i].line);
        l.classList.toggle("final", i === steps.length - 1 && n + 1 === steps[i].line);
      });
    };
    // label text changes at once (layout is final before glyphs are measured) and fades in; fixed height = tallest label
    const setLabel = (html) => {
      label.innerHTML = html;
      if (!REDUCED) label.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: "ease-out" });
    };
    const update = () => {
      count.textContent = `step ${i + 1} of ${steps.length}`;
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

    async function forward() {
      if (busy || i >= steps.length - 1) return false;
      if (i < 0 || REDUCED) { render(i + 1); return true; }
      busy = true;
      const k = i + 1, t = steps[k].line;
      const target = slot(t);
      const source = target || slot(steps[i].line);       // in place: the line itself; new line: copy from active line
      const A = snapshot(stage, source);
      const before = new Map([...lines.children].map((l) => [l, l.getBoundingClientRect().top]));
      const next = lineEl(k);
      next.style.visibility = "hidden";
      if (target) target.replaceWith(next); else lines.append(next);
      i = k;
      setLabel(steps[k].words);
      mark();
      glideLines(lines, before);
      await document.fonts.ready;                         // first use of a KaTeX font (big ∫, tall brackets) loads late
      const B = snapshot(stage, next);
      const layer = morph(stage, A, B, !!target);
      await new Promise((ok) => setTimeout(ok, MOVE_MS));
      next.style.visibility = "";                          // real line under the copies, same pixels ⇒ cross-fade
      await layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: "ease-out", fill: "forwards" }).finished;
      layer.remove();
      update();
      busy = false;
      return true;
    }

    function schedule() {
      clearTimeout(timer);
      if (!playing) return;
      timer = setTimeout(async () => {
        if (!playing) return;
        if (await forward()) schedule();
        else { playing = false; update(); }
      }, HOLD_MS);
    }

    bNext.onclick = async () => { playing = false; clearTimeout(timer); await forward(); update(); };
    bBack.onclick = () => { if (busy || i <= 0) return; playing = false; clearTimeout(timer); render(i - 1); };
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
    document.fonts.ready.then(() => { warm.remove(); schedule(); });
  }

  return { start };
})();
