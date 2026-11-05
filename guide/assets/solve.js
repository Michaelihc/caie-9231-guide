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

  // A = snapshot of the source, B = snapshot of the target (target line is in place but hidden)
  function morph(stage, A, B) {
    const layer = el("div", "solve-layer");
    stage.append(layer);
    const used = new Set();
    const ease = "cubic-bezier(.45,0,.2,1)";
    for (const b of B) {
      let best = -1, bestD = Infinity;
      A.forEach((a, k) => {
        if (used.has(k) || a.key !== b.key) return;
        const d = Math.abs(a.r.x - b.r.x) + 0.5 * Math.abs(a.r.y - b.r.y);
        if (d < bestD) { bestD = d; best = k; }
      });
      const c = glyph(b);
      layer.append(c);
      if (best >= 0) {
        used.add(best);
        const a = A[best].r, s = b.r.h ? a.h / b.r.h : 1;
        c.animate([{ transform: `translate(${a.x - b.r.x}px, ${a.y - b.r.y}px) scale(${s})` }, { transform: "none" }],
          { duration: MOVE_MS, easing: ease });
      } else {
        c.animate([{ opacity: 0 }, { opacity: 0 }, { opacity: 1 }], { duration: MOVE_MS, easing: "ease-in" });
      }
    }
    return { layer, used };
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
      const { layer, used } = morph(stage, A, B);
      if (target) {                                       // glyphs that left the line fade out where they were
        A.forEach((a, n) => {
          if (used.has(n)) return;
          const c = glyph(a);
          layer.append(c);
          c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: MOVE_MS * 0.5, fill: "forwards" });
        });
      }
      await new Promise((ok) => setTimeout(ok, MOVE_MS + 30));
      layer.remove();
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
