// "Mega problem" player (applied units). One long exam-style problem, solved step by step next to a moving scene.
// Markup (maths rendered by KaTeX at build):
//   <div class="mega" data-scene="name">
//     <ol class="mega-steps"><li data-cue="cue"><span class="w">words</span>$$maths$$</li>…</ol>
//   </div>
// guide.js loads this file and assets/scenes/<unit>.js (data-scene-file) on first open, then calls CAIE_MEGA.start(panel).
// A scene file registers CAIE_MEGA.scenes[name] = (H) => ({ view, base(o, t), cues: { cue: { t: [t0, t1], ov(o, t) } } }).
//   view = [x0, y0, x1, y1] in scene units (y up). base draws the table, walls, spheres at sim time t.
//   Each cue animates sim time t0 → t1 (t1 = t0 ⇒ no motion), then fades its overlay ov in (arrows, angles, labels).
//   A cue's overlay stays while the step is current; earlier overlays are gone, so each step shows one idea.
//   Optional cue.view (same aspect as view) = camera for that step: the scene glides/zooms there during the step.
window.CAIE_MEGA = (() => {
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MS_PER_T = 900;          // ms of animation per unit of scene time (scene may set tempo)
  const FADE = 380;              // overlay fade-in, ms
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const sv = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v != null) e.setAttribute(k, v);
    if (parent) parent.append(e);
    return e;
  };

  // ---- vector + physics helpers shared by scenes ----------------------------------------------------------------
  const V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
    mul: (a, k) => [a[0] * k, a[1] * k],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1],
    len: (a) => Math.hypot(a[0], a[1]),
    unit: (a) => { const l = Math.hypot(a[0], a[1]); return [a[0] / l, a[1] / l]; },
    perp: (a) => [-a[1], a[0]],                     // 90° anticlockwise
    dir: (deg) => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)],
    ang: (a) => (Math.atan2(a[1], a[0]) * 180) / Math.PI,
  };
  const P = {
    // direct impact along one line, velocities signed (+ = chosen positive direction)
    direct(m1, m2, u1, u2, e) {
      const v1 = (m1 * u1 + m2 * u2 - m2 * e * (u1 - u2)) / (m1 + m2);
      return [v1, v1 + e * (u1 - u2)];
    },
    // oblique impact of smooth spheres: n = unit vector along line of centres, from sphere 1 to sphere 2.
    // Along n: momentum + NEL. Perpendicular to n: each sphere keeps its own component (impulse is along n only).
    oblique(m1, m2, u1, u2, n, e) {
      const a = V.dot(u1, n), b = V.dot(u2, n);
      const [a2, b2] = P.direct(m1, m2, a, b, e);
      return [V.add(u1, V.mul(n, a2 - a)), V.add(u2, V.mul(n, b2 - b))];
    },
    // smooth fixed surface with unit normal n (pointing back out of the surface): normal part × −e, along-surface part kept
    wall(u, n, e) { const a = V.dot(u, n); return V.sub(u, V.mul(n, (1 + e) * a)); },
  };
  // piecewise-straight path: segs = [{ t, p, v }] in time order; position at time t
  // path.vel(t) = velocity of the segment in force at t (at an impact time: the velocity after; use t − ε for before)
  const path = (segs) => {
    const seg = (t) => { let s = segs[0]; for (const x of segs) if (x.t <= t + 1e-9) s = x; return s; };
    const at = (t) => { const s = seg(t); return V.add(s.p, V.mul(s.v, t - s.t)); };
    at.vel = (t) => seg(t).v;
    return at;
  };
  const H = { V, P, path };

  // ---- drawing kit (o) handed to scene code each frame ------------------------------------------------------------
  // coordinates in scene units, y up. Sizes for strokes/text are in screen px (k = px per scene unit).
  function kit(svg, k, fs = 1) {   // fs: text scale (smaller on narrow screens)
    const X = (p) => p[0], Y = (p) => -p[1];
    let layer = svg;
    const px = (n) => n / k;
    const o = {
      k, px,
      group(opacity = 1) { layer = sv("g", { opacity }, svg); return layer; },
      base() { layer = svg; },
      line(a, b, cls = "ink", w = 2, dash) {
        sv("line", { x1: X(a), y1: Y(a), x2: X(b), y2: Y(b), class: `s-${cls}`, "stroke-width": px(w), "stroke-dasharray": dash ? `${px(dash)} ${px(dash)}` : null, "stroke-linecap": "round" }, layer);
      },
      // fixed surface from a to b; hatching on the side of `out` (unit normal pointing into the wall)
      wall(a, b, out) {
        o.line(a, b, "ink", 3);
        const d = V.sub(b, a), L = V.len(d), u = V.unit(d), step = px(10), h = px(8);
        for (let s = step / 2; s < L; s += step) {
          const p = V.add(a, V.mul(u, s));
          o.line(p, V.add(p, V.add(V.mul(out, h), V.mul(u, -h * 0.6))), "ink2", 1.2);
        }
      },
      ball(p, r, name, cls = "ball") {
        const ghost = cls.includes("ghost");
        sv("circle", { cx: X(p), cy: Y(p), r, class: cls, "stroke-width": px(ghost ? 1.5 : 2), "stroke-dasharray": ghost ? `${px(4)} ${px(4)}` : null }, layer);
        if (name) o.text(p, name, "ball-name", { size: 14, anchor: "middle", dy: 5 });
      },
      // arrow from point p along vector d (scene units). label placed past the tip (or at label.at)
      arrow(p, d, cls = "pen", { w = 2.5, label, at, dash, size = 13, labelSide = 0 } = {}) {
        const L = V.len(d);
        if (L < 1e-6) return;
        const u = V.mul(d, 1 / L), n = V.perp(u), q = V.add(p, d);
        const head = Math.min(px(11), L * 0.45);
        const back = V.sub(q, V.mul(u, head));
        o.line(p, back, cls, w, dash);
        const a = V.add(back, V.mul(n, head * 0.42)), b = V.sub(back, V.mul(n, head * 0.42));
        sv("path", { d: `M${X(q)} ${Y(q)} L${X(a)} ${Y(a)} L${X(b)} ${Y(b)} Z`, class: `f-${cls}` }, layer);
        if (label) {
          const spot = at || V.add(V.add(q, V.mul(u, px(8))), V.mul(n, px(labelSide)));
          const anchor = at ? "middle" : (u[0] > 0.35 ? "start" : u[0] < -0.35 ? "end" : "middle");
          o.text(spot, label, `t-${cls}`, { size, anchor, dy: at ? 4 : u[1] < -0.35 ? 12 : u[1] > 0.35 ? -2 : 4 });
        }
      },
      // angle mark at c from direction a0 to a1 (degrees, anticlockwise), radius r in scene units
      arc(c, a0, a1, r, label, cls = "hl") {
        const p0 = V.add(c, V.mul(V.dir(a0), r)), p1 = V.add(c, V.mul(V.dir(a1), r));
        const large = Math.abs(a1 - a0) > 180 ? 1 : 0, sweep = a1 > a0 ? 0 : 1;   // y flipped ⇒ anticlockwise = sweep 0
        sv("path", { d: `M${X(p0)} ${Y(p0)} A${r} ${r} 0 ${large} ${sweep} ${X(p1)} ${Y(p1)}`, class: `s-${cls}`, fill: "none", "stroke-width": px(2) }, layer);
        if (label) o.text(V.add(c, V.mul(V.dir((a0 + a1) / 2), r + px(13))), label, `t-${cls}`, { size: 13, anchor: "middle", dy: 4 });
      },
      // velocity before an impact: arrow that ends on the sphere's edge (comes in). Label beside its middle.
      vin(p, d, r, cls = "ink", label, side = 1) {
        if (V.len(d) < 1e-9) return;
        const u = V.unit(d), head = V.sub(p, V.mul(u, r)), tail = V.sub(head, d);
        o.arrow(tail, d, cls, {});
        if (label) o.side(tail, d, label, cls, side);
      },
      // velocity after: arrow that starts on the sphere's edge (goes out)
      vout(p, d, r, cls = "ink", label, side = 1) {
        if (V.len(d) < 1e-9) return;
        const u = V.unit(d), tail = V.add(p, V.mul(u, r));
        o.arrow(tail, d, cls, {});
        if (label) o.side(tail, d, label, cls, side);
      },
      // label beside the middle of segment tail → tail + d, on the left (side 1) or right (side −1) of its direction
      side(tail, d, label, cls, side = 1) {
        const u = V.unit(d), n = V.mul(V.perp(u), side), mid = V.add(tail, V.mul(d, 0.5));
        const spot = V.add(mid, V.mul(n, px(9)));
        const anchor = Math.abs(n[0]) < 0.35 ? "middle" : n[0] > 0 ? "start" : "end";
        o.text(spot, label, `t-${cls}`, { size: 13, anchor, dy: n[1] < -0.35 ? 12 : n[1] > 0.35 ? -3 : 4 });
      },
      text(p, str, cls = "ink", { size = 13, anchor = "start", dy = 0, dx = 0, weight } = {}) {
        const t = sv("text", { x: X(p) + px(dx), y: Y(p) + px(dy), class: cls.startsWith("t-") || cls === "ball-name" ? cls : `t-${cls}`, "font-size": px(size * fs), "text-anchor": anchor, "font-weight": weight }, layer);
        t.textContent = str;
        return t;
      },
      // text with a soft panel behind it (for labels over busy areas)
      tag(p, str, cls = "ink", opts = {}) {
        const t = o.text(p, str, cls, opts);
        const bb = t.getBBox(), pad = px(3);
        const r = sv("rect", { x: bb.x - pad, y: bb.y - pad / 2, width: bb.width + 2 * pad, height: bb.height + pad, rx: px(3), class: "tagbg" });
        t.before(r);
      },
    };
    return o;
  }

  // ---- player ----------------------------------------------------------------------------------------------------
  function start(panel) {
    if (panel.dataset.started) return;
    panel.dataset.started = "1";
    const def = window.CAIE_MEGA.scenes[panel.dataset.scene];
    if (!def) { panel.textContent = `Scene ${panel.dataset.scene} missing.`; return; }
    const scene = def(H);
    const list = panel.querySelector(".mega-steps");
    const steps = [...list.children].map((li) => ({
      cue: li.dataset.cue, hold: Number(li.dataset.hold) || 0,
      words: li.querySelector(".w")?.innerHTML || "",
      math: (li.querySelector(".katex-display") || li.querySelector(".katex"))?.outerHTML || "",
    }));
    for (const st of steps) if (!scene.cues[st.cue]) console.warn(`mega: no cue "${st.cue}" in scene ${panel.dataset.scene}`);
    list.hidden = true;

    const stage = el("div", "mega-stage");
    const svg = sv("svg", { class: "mega-svg", role: "img", "aria-label": "Animated diagram of the problem" });
    const [x0, y0, x1, y1] = scene.view;
    let cam = scene.view.slice();
    const setCam = () => svg.setAttribute("viewBox", `${cam[0]} ${-cam[3]} ${cam[2] - cam[0]} ${cam[3] - cam[1]}`);
    setCam();
    svg.style.aspectRatio = `${x1 - x0} / ${y1 - y0}`;
    const label = el("div", "mega-label");
    const maths = el("div", "mega-maths");
    stage.append(svg, label, maths);
    const bar = el("div", "solve-bar");
    const mk = (txt, title) => { const b = el("button", "more-btn", txt); b.type = "button"; b.title = title; bar.append(b); return b; };
    const bBack = mk("◀ Back", "Previous step"), bPlay = mk("Play", "Play / pause"), bNext = mk("Next ▶", "Next step"),
      bRestart = mk("Restart", "Start again");
    const count = el("span", "count");
    bar.append(count);
    panel.append(stage, bar);

    let i = 0, t = 0, fade = 1, playing = false, timer = null, raf = 0, runId = 0;
    const cueOf = (n) => scene.cues[steps[n].cue] || { t: [t, t] };

    function draw() {
      svg.replaceChildren();
      setCam();
      const box = svg.getBoundingClientRect();
      const k = Math.min(box.width / (cam[2] - cam[0]), box.height / (cam[3] - cam[1])) || 10;
      const o = kit(svg, k, Math.max(0.8, Math.min(1, box.width / 560)));
      scene.base(o, t);
      const cue = cueOf(i);
      if (cue.ov) { o.group(fade); cue.ov(o, t); o.base(); }
    }
    function showText() {
      label.innerHTML = steps[i].words;
      maths.replaceChildren();
      for (const n of [i - 1, i]) {
        if (n < 0 || !steps[n].math) continue;
        const row = el("div", "mega-line" + (n === i ? " now" : ""), steps[n].math);
        maths.append(row);
      }
      if (!REDUCED) label.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-out" });
      count.textContent = `${i + 1} / ${steps.length}`;
      bBack.disabled = i === 0;
      bNext.disabled = i === steps.length - 1;
    }
    const update = () => { bPlay.textContent = playing ? "Pause" : i === steps.length - 1 ? "Replay" : "Play"; };

    // jump straight to the end state of step n
    function jump(n) {
      runId++; cancelAnimationFrame(raf);
      i = n; t = cueOf(n).t[1]; fade = 1; cam = (cueOf(n).view || scene.view).slice();
      showText(); draw(); update();
    }
    // play step n: scene time t0 → t1, then fade its overlay in
    function play(n) {
      return new Promise((done) => {
        const id = ++runId; cancelAnimationFrame(raf);
        i = n; const [a, b] = cueOf(n).t;
        showText();
        const motion = REDUCED ? 0 : Math.abs(b - a) * MS_PER_T * (scene.tempo || 1);
        const t0 = performance.now();
        t = a; fade = 0;
        const camFrom = cam.slice(), camTo = cueOf(n).view || scene.view;
        const frame = (now) => {
          if (id !== runId) return done(false);
          const e = now - t0;
          const s = motion ? Math.min(1, e / motion) : 1;
          t = a + (b - a) * s;
          const c = REDUCED ? 1 : Math.min(1, e / Math.max(motion + FADE, 700)), ce = c * c * (3 - 2 * c);
          cam = camFrom.map((x, j) => x + (camTo[j] - x) * ce);
          fade = REDUCED ? 1 : Math.max(0, Math.min(1, (e - motion) / FADE));
          draw();
          if (s < 1 || fade < 1 || cam.some((x, j) => Math.abs(x - camTo[j]) > 1e-6)) raf = requestAnimationFrame(frame);
          else done(true);
        };
        raf = requestAnimationFrame(frame);
      });
    }
    const holdFor = (n) => steps[n].hold || Math.min(5200, 1700 + 22 * (label.textContent.length + maths.textContent.length / 3));
    function schedule() {
      clearTimeout(timer);
      if (!playing) return;
      timer = setTimeout(async () => {
        if (!playing) return;
        if (i >= steps.length - 1) { playing = false; update(); return; }
        if (await play(i + 1)) schedule();
        update();
      }, holdFor(i));
    }
    bNext.onclick = async () => { playing = false; clearTimeout(timer); update(); if (i < steps.length - 1) await play(i + 1); update(); };
    bBack.onclick = () => { if (i <= 0) return; playing = false; clearTimeout(timer); jump(i - 1); };
    bRestart.onclick = async () => { clearTimeout(timer); playing = true; update(); jump(0); schedule(); };
    bPlay.onclick = async () => {
      clearTimeout(timer);
      if (i >= steps.length - 1) { playing = true; update(); jump(0); schedule(); return; }
      playing = !playing; update();
      if (playing) { if (await play(i + 1)) schedule(); update(); }
    };
    panel._pause = () => { playing = false; clearTimeout(timer); update(); };
    addEventListener("resize", () => draw());
    // fixed height for words + maths = tallest step (no jumping layout)
    const probe = (n) => { i = n; showText(); return [label.offsetHeight, maths.offsetHeight]; };
    let hl = 0, hm = 0;
    steps.forEach((_, n) => { const [a, b] = probe(n); hl = Math.max(hl, a); hm = Math.max(hm, b); });
    label.style.minHeight = `${hl}px`; maths.style.minHeight = `${hm}px`;
    document.fonts.ready.then(() => jump(0));
    jump(0);
  }

  return { start, scenes: {}, H };
})();
