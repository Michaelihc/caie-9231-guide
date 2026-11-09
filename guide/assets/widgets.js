// "Try it" widgets (JSXGraph). guide.js loads JSXGraph + this file the first time a Try it panel opens,
// then calls CAIE_WIDGETS[name](panel). Labels in words, colours from the page's theme tokens.
window.CAIE_WIDGETS = (() => {
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  let uid = 0;

  // shared setup: one board per panel, theme colours, no zoom/pan, optional one-line note
  function setup(panel, bbox, { axis = false, keepAspect = false, note = "", short = false } = {}) {
    // hl = highlight line colour (readable as thin line/text in both themes)
    const C = { ink: css("--ink"), ink2: css("--ink-2"), pen: css("--pen"), hl: css("--hl-line"), rule: css("--rule") };
    if (note) {
      const p = document.createElement("p");
      p.className = "widget-note";
      p.textContent = note;
      panel.append(p);
    }
    const box = document.createElement("div");
    box.className = short ? "jxgbox short" : "jxgbox";
    box.id = `jxg-${++uid}`;
    panel.append(box);
    const axisStyle = { strokeColor: C.rule, highlight: false, ticks: { visible: false }, withLabel: false };
    const b = JXG.JSXGraph.initBoard(box.id, {
      boundingbox: bbox, axis, keepAspectRatio: keepAspect,
      showCopyright: false, showNavigation: false,
      pan: { enabled: false }, zoom: { enabled: false },
      defaultAxes: { x: axisStyle, y: axisStyle },
    });
    const text = (x, y, fn, opt = {}) =>
      b.create("text", [x, y, fn], { fontSize: 14, color: C.ink, fixed: true, highlight: false, ...opt });
    const pt = (xy, color, opt = {}) =>
      b.create("point", xy, { name: "", size: 5, fillColor: color, strokeColor: color, highlight: false, showInfobox: false, ...opt });
    const hidden = (xy) => b.create("point", xy, { visible: false, fixed: true });
    return { b, C, text, pt, hidden };
  }

  const f1 = (v) => (Math.abs(v) < 0.05 ? "0.0" : v.toFixed(1));

  const f2 = (v) => (Math.abs(v) < 0.005 ? "0.00" : v.toFixed(2));

  // slider in guide colours
  function slider(b, C, from, to, [min, start, max], name, snap = 0.05) {
    return b.create("slider", [from, to, [min, start, max]], {
      name, snapWidth: snap, precision: 2, highlight: false,
      fillColor: C.pen, strokeColor: C.pen,
      baseline: { strokeColor: C.rule }, highline: { strokeColor: C.pen },
      label: { color: C.ink, fontSize: 14 },
    });
  }

  // slope field: short segment of slope f(x,y) at each grid point (skips where f is not finite)
  function slopeField(b, C, f, xs, ys, halfPx = 7) {
    for (const x of xs) for (const y of ys) {
      const m = f(x, y);
      if (!Number.isFinite(m)) continue;
      const h = halfPx / Math.hypot(b.unitX, m * b.unitY);
      b.create("segment", [[x - h, y - m * h], [x + h, y + m * h]],
        { strokeColor: C.rule, strokeWidth: 1.5, fixed: true, highlight: false, straightFirst: false, straightLast: false });
    }
  }
  const range = (a, z, step) => Array.from({ length: Math.floor((z - a) / step + 1e-9) + 1 }, (_, i) => a + i * step);

  return {
    // Ae=λe (FP2 matrices): drag the arrow round. Matrix output usually turns off the arrow's line;
    // on 2 directions it stays on the line ⇒ eigenvector, stretch factor = eigenvalue.
    "eigen-drag"(panel) {
      const M = [[2, 1], [1, 2]];
      const { b, C, text, pt, hidden } = setup(panel, [-5.2, 5.2, 5.2, -5.2], {
        keepAspect: true, note: "Matrix (2 1 / 1 2). Drag the arrow tip round the circle.",
      });
      const O = hidden([0, 0]);
      const R = 1.6;
      const ring = b.create("circle", [O, R], { strokeColor: C.rule, strokeWidth: 1, dash: 2, fixed: true, highlight: false });
      const tip = b.create("glider", [R * Math.cos(0.5), R * Math.sin(0.5), ring],
        { name: "", size: 6, fillColor: C.ink, strokeColor: C.ink, highlight: false, showInfobox: false });
      const v = () => [tip.X(), tip.Y()];
      const Av = () => { const [x, y] = v(); return [M[0][0] * x + M[0][1] * y, M[1][0] * x + M[1][1] * y]; };
      const turn = () => { const [x, y] = v(), [p, q] = Av(); return Math.atan2(x * q - y * p, x * p + y * q); };
      const on = () => Math.abs(Math.sin(turn())) < 0.035;
      const ratio = () => { const [x, y] = v(), [p, q] = Av(); return (x * p + y * q) / (x * x + y * y); };
      tip.on("up", () => {                                       // near an eigen direction ⇒ snap onto it
        if (Math.abs(Math.sin(turn())) > 0.12) return;
        const a = Math.atan2(tip.Y(), tip.X()), dirs = [Math.PI / 4, -Math.PI / 4, 3 * Math.PI / 4, -3 * Math.PI / 4];
        const best = dirs.reduce((m, d) => (Math.abs(Math.sin(a - d)) < Math.abs(Math.sin(a - m)) ? d : m), dirs[0]);
        tip.moveTo([R * Math.cos(best), R * Math.sin(best)]);
      });
      b.create("line", [O, tip], { strokeColor: () => (on() ? C.hl : C.rule), strokeWidth: () => (on() ? 3 : 1), dash: 2, fixed: true, highlight: false });
      const out = hidden([() => Av()[0], () => Av()[1]]);
      b.create("arrow", [O, out], { strokeColor: C.pen, strokeWidth: 4, fixed: true, highlight: false });
      b.create("arrow", [O, tip], { strokeColor: C.ink, strokeWidth: 3, fixed: true, highlight: false });
      text(-5, 4.6, () => (on() ? `On its line: matrix × arrow = ${f1(ratio())} × arrow` : "Matrix × arrow turns off the arrow's line"));
      text(-5, 3.9, () => (on() ? `⇒ eigenvector, eigenvalue ${f1(ratio())}` : "Find the 2 directions where it doesn't"), { color: C.ink2 });
    },

    // F1 (vectors): drag both arrow tips. Shadow of arrow 2 on arrow 1; dot = length × shadow = component sum.
    "dot-shadow"(panel) {
      const { b, C, text, pt, hidden } = setup(panel, [-1.6, 4.4, 6.4, -0.6], {
        keepAspect: true, note: "Drag the two arrow tips.",
      });
      const O = hidden([0, 0]);
      const t1 = pt([4, 0.6], C.pen);
      const t2 = pt([1.8, 2.6], C.ink);
      const a = () => [t1.X(), t1.Y()];
      const v = () => [t2.X(), t2.Y()];
      const dot = () => a()[0] * v()[0] + a()[1] * v()[1];
      const len1 = () => Math.hypot(...a());
      const shadow = () => dot() / len1();                 // signed length along arrow 1
      const foot = hidden([() => (dot() / len1() ** 2) * a()[0], () => (dot() / len1() ** 2) * a()[1]]);
      b.create("line", [O, t1], { strokeColor: C.rule, strokeWidth: 1, dash: 2, fixed: true, highlight: false });
      b.create("segment", [O, foot], { strokeColor: C.hl, strokeWidth: 9, fixed: true, highlight: false });
      b.create("arrow", [O, t1], { strokeColor: C.pen, strokeWidth: 4, fixed: true, highlight: false });
      b.create("arrow", [O, t2], { strokeColor: C.ink, strokeWidth: 3, fixed: true, highlight: false });
      b.create("segment", [t2, foot], { strokeColor: C.ink2, strokeWidth: 1.5, dash: 2, fixed: true, highlight: false });
      text(() => t1.X() + 0.15, () => t1.Y() - 0.25, "arrow 1", { color: C.pen });
      text(() => t2.X() + 0.15, () => t2.Y() + 0.25, "arrow 2");
      text(() => foot.X() / 2 - 0.3, () => foot.Y() / 2 - 0.35, "shadow", { color: C.hl });
      text(-1.45, 4.1, () => `length of arrow 1 = ${f1(len1())}`);
      text(-1.45, 3.72, () => `shadow of arrow 2 = ${f1(shadow())}`, { color: C.hl });
      text(-1.45, 3.34, () => `dot = length × shadow = ${f1(len1() * shadow())}`);
      text(-1.45, 2.96, () => `dot by parts = ${f1(a()[0])}×${f1(v()[0])} + ${f1(a()[1])}×${f1(v()[1])} = ${f1(dot())}`, { color: C.ink2 });
    },

    // F2 (differential equations): complex roots. Sliders for real and imaginary part.
    "root-shapes"(panel) {
      const { b, C, text } = setup(panel, [-0.6, 3.4, 10.4, -3.4], {
        axis: true, note: "Slide the real part and the imaginary part of the roots.",
      });
      const sliderStyle = (name) => ({
        name, snapWidth: 0.05, precision: 2, highlight: false,
        fillColor: C.pen, strokeColor: C.pen,
        baseline: { strokeColor: C.rule }, highline: { strokeColor: C.pen },
        label: { color: C.ink, fontSize: 14 },
      });
      const re = b.create("slider", [[0.3, 2.9], [2.7, 2.9], [-1, -0.25, 0.3]], sliderStyle("real part"));
      const im = b.create("slider", [[5.0, 2.9], [7.4, 2.9], [0.5, 2, 5]], sliderStyle("imaginary part"));
      const env = (s) => (x) => s * Math.exp(re.Value() * x);
      b.create("functiongraph", [env(1), 0, 10], { strokeColor: C.hl, strokeWidth: 2, highlight: false });
      b.create("functiongraph", [env(-1), 0, 10], { strokeColor: C.hl, strokeWidth: 2, highlight: false });
      b.create("functiongraph", [(x) => Math.exp(re.Value() * x) * Math.cos(im.Value() * x), 0, 10],
        { strokeColor: C.ink, strokeWidth: 3, highlight: false });
      text(0.3, -2.95, () => {
        const r = re.Value();
        if (Math.abs(r) < 0.025) return "real part = 0 ⇒ wave keeps same size";
        return r < 0 ? "real part below 0 ⇒ envelope shrinks ⇒ dies out" : "real part above 0 ⇒ envelope grows";
      }, { color: C.hl });
    },

    // DE integrating factor: x y' + 2y = e^x (w20 paper). Drag the start point: each start picks one C.
    "if-family"(panel) {
      const { b, C, text, pt } = setup(panel, [-0.1, 8.5, 3.7, -4.5], {
        note: "Drag the starting point. Equation: x dy/dx + 2y = eˣ, IF = x².",
      });
      slopeField(b, C, (x, y) => (Math.exp(x) - 2 * y) / x, range(0.4, 3.4, 0.3), range(-4, 8, 1));
      const P = pt([1, 3], C.hl);
      const Cval = () => P.X() ** 2 * P.Y() - (P.X() - 1) * Math.exp(P.X());
      b.on("update", () => { if (P.X() < 0.35) P.moveTo([0.35, P.Y()]); });
      b.create("functiongraph", [(x) => ((x - 1) * Math.exp(x) + Cval()) / (x * x), 0.32, 3.7],
        { strokeColor: C.ink, strokeWidth: 3, highlight: false });
      text(0.15, -2.55, "x²y = (x − 1)eˣ + C  ⇒  y = ((x − 1)eˣ + C) / x²");
      text(0.15, -3.25, () => `start (${f2(P.X())}, ${f2(P.Y())})  ⇒  C = ${f2(Cval())}`, { color: C.hl });
      text(0.15, -3.95, "every curve is one C; the initial condition picks it", { color: C.ink2 });
    },

    // DE CF + PI: sliders A, B change the start; tail always lands on the PI.
    "cf-pi"(panel) {
      const { b, C, text } = setup(panel, [-0.4, 6.4, 14.2, -6.4], {
        axis: true, note: "Slide A and B (they come from the initial conditions).",
      });
      // y'' + y' + 4.25y = 10 sin x: CF roots -1/2 ± 2i; PI = λ cos x + μ sin x
      const lam = -10 / (3.25 * 3.25 + 1), mu = -3.25 * lam;
      const pi = (x) => lam * Math.cos(x) + mu * Math.sin(x);
      const A = slider(b, C, [0.6, 5.6], [4.0, 5.6], [-4, 3, 4], "A", 0.1);
      const B = slider(b, C, [7.6, 5.6], [11.0, 5.6], [-4, 0, 4], "B", 0.1);
      const cf = (x) => Math.exp(-0.5 * x) * (A.Value() * Math.cos(2 * x) + B.Value() * Math.sin(2 * x));
      b.create("functiongraph", [pi, 0, 14], { strokeColor: C.pen, strokeWidth: 3, dash: 2, highlight: false });
      b.create("functiongraph", [(x) => cf(x) + pi(x), 0, 14], { strokeColor: C.ink, strokeWidth: 3, highlight: false });
      text(0.3, -5.0, "y″ + y′ + 4.25y = 10 sin x", { color: C.ink2 });
      text(0.3, -5.8, () => `CF part at x = 12: ${f2(cf(12))}   ⇒  for large x, y ≈ PI (dashed)`, { color: C.hl });
    },

    // DE trial PI: slide λ, μ until left side(trial) sits on the right side = compare coefficients.
    "pi-match"(panel) {
      const { b, C, text } = setup(panel, [-0.4, 17, 12.8, -17], {
        axis: true, note: "Slide λ and μ until the two curves match. Equation: y″ + 2y′ + 5y = 10 sin x, trial λ cos x + μ sin x.",
      });
      const L = slider(b, C, [0.5, 14.5], [3.8, 14.5], [-4, 1, 4], "λ", 0.5);
      const M = slider(b, C, [7.0, 14.5], [10.3, 14.5], [-4, 1, 4], "μ", 0.5);
      const cosPart = () => 4 * L.Value() + 2 * M.Value();
      const sinPart = () => 4 * M.Value() - 2 * L.Value();
      b.create("functiongraph", [(x) => 10 * Math.sin(x), 0, 12.6], { strokeColor: C.hl, strokeWidth: 4, highlight: false });
      b.create("functiongraph", [(x) => cosPart() * Math.cos(x) + sinPart() * Math.sin(x), 0, 12.6],
        { strokeColor: C.ink, strokeWidth: 2.5, highlight: false });
      text(0.3, -12.5, () => `left side(trial) = ${f2(cosPart())} cos x + ${f2(sinPart())} sin x`);
      text(0.3, -14.5, "need: cos part 0, sin part 10 (right side, yellow)", { color: C.hl });
      text(0.3, 11.8, () => (Math.abs(cosPart()) < 1e-9 && Math.abs(sinPart() - 10) < 1e-9
        ? "matched ⇒ PI = −cos x + 2 sin x" : ""), { color: C.hl, fontSize: 15 });
    },

    // DE x = e^t: power x^m in x becomes exponential e^{mt} in t. Two linked boards.
    "euler-sub"(panel) {
      const top = setup(panel, [-0.2, 9.5, 3.2, -1.2], {
        axis: true, short: true, note: "Slide m and drag the point. Top: y = xᵐ against x. Bottom: same y against t = ln x.",
      });
      const bot = setup(panel, [-2.6, 9.5, 1.3, -1.2], { axis: true, short: true });
      const C = top.C;
      const m = slider(top.b, C, [0.3, 8.6], [1.8, 8.6], [0.3, 2, 3], "m", 0.1);
      const curve = top.b.create("functiongraph", [(x) => Math.pow(x, m.Value()), 0.0001, 3.2],
        { strokeColor: C.ink, strokeWidth: 3, highlight: false });
      const P = top.b.create("glider", [1.6, Math.pow(1.6, 2), curve],
        { name: "", size: 5, fillColor: C.hl, strokeColor: C.hl, highlight: false, showInfobox: false });
      bot.b.create("functiongraph", [(t) => Math.exp(m.Value() * t), -2.6, 1.3], { strokeColor: C.pen, strokeWidth: 3, highlight: false });
      const Q = bot.b.create("point", [() => Math.log(Math.max(P.X(), 1e-6)), () => P.Y()],
        { name: "", size: 5, fillColor: C.hl, strokeColor: C.hl, fixed: true, highlight: false, showInfobox: false });
      top.text(0.15, 7.5, "in x: y = xᵐ", { color: C.ink2 });
      bot.text(-2.45, 8.6, "in t: y = eᵐᵗ", { color: C.pen });
      bot.text(-2.45, 7.6, () => `x = ${f2(P.X())}  ⇒  t = ln x = ${f2(Q.X())},  same y = ${f2(P.Y())}`, { color: C.hl });
      bot.text(-2.45, -0.75, "power of x ⇒ exponential in t ⇒ constant coefficients", { color: C.ink2 });
      top.b.addChild(bot.b);
    },

    // DE y = ux: slope of dy/dx = (x+y)/(x−y) is the same all along each ray from O ⇒ only u = y/x matters.
    "ux-rays"(panel) {
      const { b, C, text, pt, hidden } = setup(panel, [-4.2, 4.2, 4.2, -4.2], {
        keepAspect: true, note: "Drag the point to swing the ray. Equation: dy/dx = (x + y)/(x − y).",
      });
      const f = (x, y) => (Math.abs(x - y) < 0.12 ? NaN : (x + y) / (x - y));
      slopeField(b, C, f, range(-3.6, 3.6, 0.6), range(-3.6, 3.6, 0.6), 6);
      const O = hidden([0, 0]);
      const R = pt([3, 1.2], C.hl);
      b.create("line", [O, R], { straightFirst: false, strokeColor: C.hl, strokeWidth: 1.5, dash: 2, fixed: true, highlight: false });
      const u = () => R.Y() / R.X();
      const slope = () => (1 + u()) / (1 - u());
      for (const d of [0.9, 1.6, 2.3, 3.0, 3.7]) {
        const cx = () => (d * R.X()) / Math.hypot(R.X(), R.Y()), cy = () => (d * R.Y()) / Math.hypot(R.X(), R.Y());
        const hx = () => 9 / Math.hypot(b.unitX, slope() * b.unitY);
        b.create("segment", [[() => cx() - hx(), () => cy() - slope() * hx()], [() => cx() + hx(), () => cy() + slope() * hx()]],
          { strokeColor: C.hl, strokeWidth: 3.5, fixed: true, highlight: false });
      }
      text(-4.0, 3.85, () => `u = y/x = ${f2(u())}`, { color: C.hl });
      text(-4.0, 3.35, () => `slope all along ray = (1 + u)/(1 − u) = ${Number.isFinite(slope()) && Math.abs(slope()) < 1e6 ? f2(slope()) : "∞"}`, { color: C.hl });
      text(-4.0, -3.85, "only u matters ⇒ y = ux makes it separable", { color: C.ink2 });
    },
  };
})();
