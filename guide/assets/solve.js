// "Watch it solved" player. Each .solve panel holds
//   <ol class="solve-steps"><li data-line="n"><span class="w">words</span> maths</li>…</ol>   (KaTeX rendered at build)
// data-line = which on-screen line the step writes to. Same line as the line it changes ⇒ morph in place
// (e.g. ∫ signs just appear). New line number ⇒ side calculation on a new line, glyphs copied from the active line.
// Every glyph of the result flies from where the same glyph sat before; new glyphs fade in, dropped ones fade out.
window.CAIE_SOLVE = (() => {
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MOVE_MS = 850, HOLD_MS = 1700;
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
        const text = node.textContent;
        if (!blank(text)) out.push({ el: node, key: text });
        return;
      }
      kids.forEach(walk);
    };
    line.querySelectorAll(".katex-html").forEach(walk);
    return out;
  }

  // measure glyphs relative to the stage, and keep a detached copy of each so it can be drawn after its line is gone
  function snapshot(stage, line) {
    const sr = stage.getBoundingClientRect();
    return leaves(line).map((g) => {
      const r = g.el.getBoundingClientRect();
      return { ...g, r: { x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height }, style: getComputedStyle(g.el) };
    }).filter((g) => g.r.w || g.r.h).map((g) => ({ ...g, font: {
      fontFamily: g.style.fontFamily, fontStyle: g.style.fontStyle, fontWeight: g.style.fontWeight, fontSize: g.style.fontSize },
      node: g.key === "svg" ? g.el.cloneNode(true) : null }));
  }

  function glyph(g) {
    let c;
    if (g.key === "bar") { c = el("div"); c.style.background = "currentColor"; }
    else if (g.key === "svg") { c = g.node.cloneNode(true); c.style.overflow = "hidden"; c.style.fontSize = g.font.fontSize; }
    else { c = el("span"); c.textContent = g.key; Object.assign(c.style, g.font, { lineHeight: `${g.r.h}px`, whiteSpace: "pre" }); }
    Object.assign(c.style, { position: "absolute", left: `${g.r.x}px`, top: `${g.r.y}px`, width: `${g.r.w}px`, height: `${g.r.h}px`,
      margin: "0", transformOrigin: "0 0" });
    return c;
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
  function curve(dx, dy, s, bow, steps = 14) {
    const frames = [];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps, u = 1 - t;
      const x = u * u * dx + 2 * u * t * (dx / 2);
      const y = u * u * dy + 2 * u * t * (dy / 2 + bow);
      const sc = s + (1 - s) * t;
      frames.push({ transform: `translate(${x}px, ${y}px) scale(${sc})`, offset: t });
    }
    return frames;
  }

  // A = snapshot of the source, B = snapshot of the target (target line is in place but hidden).
  // Phases: leaving glyphs fade (0–35%), structure-keeping glyphs slide as a block, reordered glyphs arc
  // in their own lane (moving left ⇒ over the line, moving right ⇒ under), new glyphs fade in last, highlighted.
  function morph(stage, A, B, inPlace) {
    const layer = el("div", "solve-layer");
    stage.append(layer);
    const ink = getComputedStyle(stage).color;
    const hl = getComputedStyle(stage).getPropertyValue("--hl-line").trim() || ink;
    const ease = "cubic-bezier(.45,0,.25,1)";
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
    B.forEach((b, y) => {
      const c = glyph(b);
      layer.append(c);
      const m = matchB.get(y);
      if (!m) {                                               // new glyph: appear at the end, highlighted
        c.animate([{ opacity: 0, color: hl }, { opacity: 0, color: hl, offset: 0.55 }, { opacity: 1, color: hl, offset: 0.8 },
          { opacity: 1, color: ink }], { duration: MOVE_MS * 1.35, easing: "ease-out" });
        return;
      }
      const a = A[m[0]].r;
      const dx = a.x - b.r.x, dy = a.y - b.r.y, s = b.r.h ? a.h / b.r.h : 1;
      if (!m[1]) {                                            // keeps order: gentle slide with the block
        c.animate(curve(dx, dy, s, -Math.sign(dx) * Math.min(Math.abs(dx) * 0.06, 6)), { duration: MOVE_MS, easing: ease });
      } else {                                                // reordered: own lane, arcs clear of the block
        const bow = (dx > 0 ? -1 : 1) * Math.min(lineH * 0.9 + Math.abs(dx) * 0.18, lineH * 2.2);   // offset is start - end: dx > 0 ⇒ moving left
        c.animate(curve(dx, dy, s, bow), { duration: MOVE_MS * 1.2, easing: ease, delay: MOVE_MS * 0.1 });
        c.animate([{ color: hl }, { color: hl, offset: 0.7 }, { color: ink }], { duration: MOVE_MS * 1.3 });
      }
    });
    if (inPlace) {                                            // glyphs that left the line fade out first
      A.forEach((a, x) => {
        if (usedA.has(x)) return;
        const c = glyph(a);
        layer.append(c);
        c.animate([{ opacity: 1 }, { opacity: 0, offset: 0.35 }, { opacity: 0 }], { duration: MOVE_MS, fill: "forwards" });
      });
    }
    return new Promise((ok) => setTimeout(() => { layer.remove(); ok(); }, MOVE_MS * 1.35 + 30));
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
    const lineEl = (k) => { const l = el("div", "solve-line", steps[k].math); return l; };
    const mark = () => {
      [...lines.children].forEach((l, n) => {
        l.classList.toggle("dim", n + 1 !== steps[i].line);
        l.classList.toggle("final", i === steps.length - 1 && n + 1 === steps[i].line);
      });
    };
    const setLabel = (html) => {
      if (REDUCED) { label.innerHTML = html; return; }
      label.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150 }).onfinish = () => {
        label.innerHTML = html;
        label.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
      };
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
      const next = lineEl(k);
      next.style.visibility = "hidden";
      if (target) target.replaceWith(next); else lines.append(next);
      i = k;
      setLabel(steps[k].words);
      mark();
      const B = snapshot(stage, next);
      await morph(stage, A, B, !!target);
      next.style.visibility = "";
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

    render(0);
    schedule();
  }

  return { start };
})();
