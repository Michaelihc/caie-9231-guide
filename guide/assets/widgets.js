// "Try it" widgets (JSXGraph). guide.js loads JSXGraph + this file the first time a Try it panel opens,
// then calls CAIE_WIDGETS[name](panel). Labels in words, colours from the page's theme tokens.
window.CAIE_WIDGETS = (() => {
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  let uid = 0;

  // shared setup: one board per panel, theme colours, no zoom/pan, optional one-line note
  function setup(panel, bbox, { axis = false, keepAspect = false, note = "" } = {}) {
    // hl = highlight line colour (readable as thin line/text in both themes)
    const C = { ink: css("--ink"), ink2: css("--ink-2"), pen: css("--pen"), hl: css("--hl-line"), rule: css("--rule") };
    if (note) {
      const p = document.createElement("p");
      p.className = "widget-note";
      p.textContent = note;
      panel.append(p);
    }
    const box = document.createElement("div");
    box.className = "jxgbox";
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

  return {
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
  };
})();
