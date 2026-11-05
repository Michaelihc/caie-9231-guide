// "Watch it solved" player. Each .solve panel holds <ol class="solve-steps"><li><span class="w">words</span> maths</li>…
// (KaTeX already rendered at build). The player shows up to 3 lines; on each step every glyph of the new line
// flies in from where the same glyph sat in the previous line (new glyphs fade in, dropped ones fade out).
window.CAIE_SOLVE = (() => {
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MOVE_MS = 850, HOLD_MS = 1700, MAX_LINES = 3;
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const blank = (t) => /^[\s​]*$/.test(t);

  // visible glyph pieces of a rendered line: text leaves, fraction bars, svg pieces (roots, big brackets)
  function leaves(line) {
    const out = [];
    const walk = (node) => {
      if (node.matches(".frac-line")) { out.push({ el: node, key: "bar" }); return; }
      if (node.querySelector(":scope > svg")) { out.push({ el: node, key: "svg" }); return; }
      const kids = [...node.children];
      const text = [...node.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("");
      if (!kids.length) { if (!blank(text)) out.push({ el: node, key: text }); return; }
      kids.forEach(walk);
    };
    line.querySelectorAll(".katex-html").forEach(walk);
    return out;
  }

  function cloneGlyph({ el: src, key }, r) {
    let c;
    if (key === "bar") { c = el("div"); c.style.background = "currentColor"; }
    else if (key === "svg") { c = src.cloneNode(true); c.style.overflow = "hidden"; c.style.fontSize = getComputedStyle(src).fontSize; }
    else {
      c = el("span"); c.textContent = src.textContent;
      const cs = getComputedStyle(src);
      Object.assign(c.style, { fontFamily: cs.fontFamily, fontStyle: cs.fontStyle, fontWeight: cs.fontWeight,
        fontSize: cs.fontSize, lineHeight: `${r.h}px`, whiteSpace: "pre" });
    }
    Object.assign(c.style, { position: "absolute", left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px`,
      margin: "0", transformOrigin: "0 0" });
    return c;
  }

  function morph(stage, from, to) {
    const sr = stage.getBoundingClientRect();
    const rel = (e) => { const r = e.getBoundingClientRect(); return { x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height }; };
    const A = leaves(from).map((a) => ({ ...a, r: rel(a.el) })).filter((a) => a.r.w || a.r.h);
    const B = leaves(to).map((b) => ({ ...b, r: rel(b.el) })).filter((b) => b.r.w || b.r.h);
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
      const c = cloneGlyph(b, b.r);
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
    A.forEach((a, k) => {
      if (used.has(k)) return;
      const c = cloneGlyph(a, a.r);
      layer.append(c);
      c.animate([{ opacity: 0.9 }, { opacity: 0 }], { duration: MOVE_MS * 0.5, fill: "forwards" });
    });
    return new Promise((done) => setTimeout(() => { layer.remove(); done(); }, MOVE_MS + 30));
  }

  // slide remaining lines up smoothly after the oldest one leaves
  function flipUp(lines, change) {
    const before = new Map([...lines.children].map((l) => [l, l.getBoundingClientRect().top]));
    change();
    if (REDUCED) return;
    for (const l of lines.children) {
      const t0 = before.get(l);
      if (t0 == null) continue;
      const dy = t0 - l.getBoundingClientRect().top;
      if (dy) l.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 400, easing: "ease-out" });
    }
  }

  function start(panel) {
    if (panel.dataset.started) return;
    panel.dataset.started = "1";
    const list = panel.querySelector(".solve-steps");
    const steps = [...list.children].map((li) => ({
      words: li.querySelector(".w")?.innerHTML || "",
      math: (li.querySelector(".katex-display") || li.querySelector(".katex"))?.outerHTML || "",
    }));
    list.hidden = true;

    const stage = el("div", "solve-stage");
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
    const lineFor = (k) => { const l = el("div", "solve-line", steps[k].math); if (k === steps.length - 1) l.classList.add("final"); return l; };

    // jump to step k with no animation (Back, Restart, reduced motion)
    function render(k) {
      i = k;
      lines.replaceChildren();
      for (let j = Math.max(0, k - MAX_LINES + 1); j <= k; j++) {
        const l = lineFor(j);
        if (j < k) l.classList.add("dim");
        lines.append(l);
      }
      label.innerHTML = steps[k].words;
      update();
    }

    async function forward() {
      if (busy || i >= steps.length - 1) return false;
      busy = true;
      const prev = lines.lastElementChild;
      if (!prev || REDUCED) { render(i + 1); busy = false; return true; }
      i += 1;
      setLabel(steps[i].words);
      if (lines.children.length >= MAX_LINES) flipUp(lines, () => lines.firstElementChild.remove());
      const next = lineFor(i);
      next.style.visibility = "hidden";
      lines.append(next);
      prev.classList.add("dim");
      await morph(stage, prev, next);
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
