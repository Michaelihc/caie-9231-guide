// Checks the FM 3.6 mega-problem scenes: the physics they animate matches the working on the page.
//   node scripts/check_momentum.mjs
// Per impact: momentum along the line of centres kept, across parts unchanged, NEL holds;
// numbers equal the ones written in guide/src/fm/3.6-momentum/30-mega.html;
// along the whole animation spheres never overlap each other or a wall.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.window = globalThis;
globalThis.matchMedia = () => ({ matches: false });
for (const f of ["guide/assets/mega.js", "guide/assets/scenes/momentum.js"]) (0, eval)(fs.readFileSync(path.join(root, f), "utf8"));
const { scenes, H } = window.CAIE_MEGA;
const { V, P } = H;

let fails = 0;
const near = (a, b, msg, tol = 1e-9) => {
  const ok = Array.isArray(a) ? a.every((x, i) => Math.abs(x - b[i]) < tol) : Math.abs(a - b) < tol;
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}: ${JSON.stringify(a)}${ok ? "" : ` expected ${JSON.stringify(b)}`}`);
  if (!ok) fails++;
};
// one impact between two spheres: momentum along n, NEL, across parts
function impact(label, m1, m2, u1, u2, v1, v2, n, e) {
  const along = (v) => V.dot(v, n), across = (v) => V.sub(v, V.mul(n, V.dot(v, n)));
  near(m1 * along(u1) + m2 * along(u2), m1 * along(v1) + m2 * along(v2), `${label} momentum along line of centres`);
  near(along(v2) - along(v1), e * (along(u1) - along(u2)), `${label} NEL`);
  near(across(v1), across(u1), `${label} sphere 1 across part unchanged`);
  near(across(v2), across(u2), `${label} sphere 2 across part unchanged`);
}
function wallHit(label, u, v, n, e) {
  near(V.dot(v, n), -e * V.dot(u, n), `${label} into-wall part × −e`);
  near(V.sub(v, V.mul(n, V.dot(v, n))), V.sub(u, V.mul(n, V.dot(u, n))), `${label} along-wall part kept`);
}
// spheres never overlap or cross a wall, sampled through the animation
function noOverlap(label, d) {
  const [t0, t1] = d.times;
  let worst = Infinity;
  for (let t = t0; t <= t1; t += 0.002) {
    const A = d.pA(t), B = d.pB(t);
    worst = Math.min(worst, V.len(V.sub(A, B)) - 2 * d.R);
    for (const w of d.walls) for (const p of [A, B]) {
      if (w.x != null) worst = Math.min(worst, Math.abs(p[0] - w.x) - d.R);
      if (w.y != null && p[0] <= w.xMax + d.R) worst = Math.min(worst, w.y - p[1] - d.R);
    }
  }
  const ok = worst > -1e-6;
  console.log(`${ok ? "ok  " : "FAIL"} ${label} no overlap (closest gap ${worst.toFixed(4)})`);
  if (!ok) fails++;
}

// M1: A m, B 2m, u 10, e 4/5, wall 3/4
{
  const d = scenes["momentum-1"](H).debug, x = d.nums;
  near([x.a1, x.b1], [-2, 6], "M1 first impact v_A, v_B (page: −2, 6)");
  impact("M1 first impact", 1, 2, [10, 0], [0, 0], [x.a1, 0], [x.b1, 0], [1, 0], 4 / 5);
  near(x.bW, -4.5, "M1 B after wall (page: 4.5 away)");
  near([x.a2, x.b2], [-5, -3], "M1 second impact v_A, v_B (page: −5, −3)");
  impact("M1 second impact", 1, 2, [x.a1, 0], [x.bW, 0], [x.a2, 0], [x.b2, 0], [1, 0], 4 / 5);
  near([d.pA.vel(-1e-6)[0], d.pB.vel(-1e-6)[0]], [10, 0], "M1 drawn velocities just before impact 1");
  near(0.5 * 100 - (0.5 * x.a2 ** 2 + 0.5 * 2 * x.b2 ** 2), 28.5, "M1 KE lost / m (page: 28.5m)");
  noOverlap("M1", d);
}
// M2: A m (4,3), B 2m (−3,4), e 1/2; walls 1/3
{
  const d = scenes["momentum-2"](H).debug, x = d.nums;
  near(x.vA, [-3, 3], "M2 A after (page: along −3, across 3)");
  near(x.vB, [0.5, 4], "M2 B after (page: along ½, across 4)");
  impact("M2 impact", 1, 2, [4, 3], [-3, 4], x.vA, x.vB, [1, 0], 1 / 2);
  near([...d.pA.vel(-1e-6), ...d.pB.vel(-1e-6)], [4, 3, -3, 4], "M2 drawn velocities just before impact");
  near(V.len(x.vA), 3 * Math.SQRT2, "M2 |v_A| = 3√2");
  near(V.len(x.vB), Math.sqrt(65) / 2, "M2 |v_B| = √65/2");
  near(Math.atan2(x.vB[1], x.vB[0]) * 180 / Math.PI, 82.87498365109819, "M2 B angle 82.9°", 1e-9);
  near(V.ang(x.vA) - V.ang([4, 3]), 98.13010235415598, "M2 deflection 98.1°");
  near(0.5 * 25 + 0.5 * 2 * 25 - (0.5 * V.len(x.vA) ** 2 + 0.5 * 2 * V.len(x.vB) ** 2), 12.25, "M2 KE lost / m (page: 12.25m)");
  wallHit("M2 wall 1", x.vA, x.wA, [1, 0], 1 / 3);
  near(x.wA, [1, 3], "M2 after wall 1 (page: out 1, along 3)");
  near(90 - V.ang(x.wA), 18.43494882292201, "M2 angle with wall 18.4°");
  wallHit("M2 wall 2", x.wA, x.wA2, [0, -1], 1 / 3);
  near(x.wA2, V.mul(x.vA, -1 / 3), "M2 after both walls = −⅓ × before (parallel)");
  near(1 - V.len(x.wA2) ** 2 / V.len(x.vA) ** 2, 8 / 9, "M2 fraction of KE lost at walls 8/9");
  noOverlap("M2", d);
}
// M3: A m speed 5, B 2m at rest, e 1/2, tanθ = 1/2
{
  const d = scenes["momentum-3"](H).debug, x = d.nums, u = 5, c = 2 / Math.sqrt(5);
  impact("M3 impact", 1, 2, [u, 0], [0, 0], x.vA, x.vB, x.n, 1 / 2);
  near(V.dot(x.vA, x.n), 0, "M3 A along part after = 0 (moves ⊥ line of centres)");
  near(V.dot(x.vB, x.n), u * (1 + 0.5) * c / 3, "M3 B speed = u(1+e)cosθ/(1+k)");
  near(V.len(x.vA), u / Math.sqrt(5), "M3 |v_A| = u/√5");
  near(V.len(x.vB), u / Math.sqrt(5), "M3 |v_B| = u/√5");
  near(V.dot(x.vA, x.vB), 0, "M3 A ⊥ B after");
  near(1 - (V.len(x.vA) ** 2 + 2 * V.len(x.vB) ** 2) / u ** 2, 0.4, "M3 40% of KE lost");
  noOverlap("M3", d);
}
// ---- to scale: every arrow a step draws has length = value × S (velocities) or × SI (impulses) ----
// Runs each cue's overlay with a recording kit; dashed (unknown) arrows are exempt.
function recordArrows(scene) {
  const out = [];
  let cur = null;
  const rec = (tip, d, unknown) => { if (tip && !unknown && V.len(d) > 1e-9) out.push({ tip, len: V.len(d) }); };
  const o = new Proxy({
    px: (n) => n / 40, k: 40,
    within(tip, fn) { const prev = cur; cur = tip || cur; try { fn(); } finally { cur = prev; } },
    arrow(p, d, cls, opt = {}) { rec(opt.tip || cur, d, opt.unknown); },
    vin(p, d, r, cls, label, side, opt = {}) { rec(opt.tip || cur, d, opt.unknown); },
    vout(p, d, r, cls, label, side, opt = {}) { rec(opt.tip || cur, d, opt.unknown); },
  }, { get: (t, k) => (k in t ? t[k] : () => {}) });
  for (const cue of Object.values(scene.cues)) {
    if (!cue.ov) continue;
    for (const t of [cue.t[0], (cue.t[0] + cue.t[1]) / 2, cue.t[1]]) cue.ov(o, t);
  }
  return out;
}
function toScale(label, scene, expect) {
  const { S, SI } = scene.debug;
  let bad = 0, n = 0;
  for (const a of recordArrows(scene)) {
    if (!(a.tip in expect)) continue;             // + direction, scale bars: not quantities
    const [value, kind] = expect[a.tip];
    const want = value * (kind === "imp" ? SI : S);
    n++;
    if (Math.abs(a.len - want) > 1e-9) { bad++; console.log(`FAIL ${label} ${a.tip}: length ${a.len.toFixed(4)} ≠ ${want.toFixed(4)}`); }
  }
  const ok = !bad && n > 0;
  console.log(`${ok ? "ok  " : "FAIL"} ${label} all ${n} drawn arrows to scale`);
  if (!ok) fails++;
}
{
  const r2 = Math.SQRT2, c = 2 / Math.sqrt(5), s = 1 / Math.sqrt(5);
  toScale("M1", scenes["momentum-1"](H), { "m1-u": [10], "m1-a1": [2], "m1-b1": [6], "m1-bw": [4.5], "m1-a2": [5], "m1-b2": [3] });
  toScale("M2", scenes["momentum-2"](H), {
    "m2-uA": [5], "m2-uB": [5], "m2-uA-al": [4], "m2-uA-ac": [3], "m2-uB-al": [3], "m2-uB-ac": [4],
    "m2-vA-al": [3], "m2-vA-ac": [3], "m2-vA": [3 * r2], "m2-vB-al": [0.5], "m2-vB-ac": [4], "m2-vB": [Math.sqrt(65) / 2],
    "m2-w1-v": [3 * r2], "m2-w1-in": [3], "m2-w1-al": [3], "m2-w1-out": [1], "m2-w1-kept": [3],
    "m2-w2-in": [3], "m2-w2-al": [1], "m2-w2-out": [1], "m2-w2-kept": [1], "m2-path-out": [r2],
    "m2-impA": [7, "imp"], "m2-impB": [7, "imp"],
  });
  toScale("M3", scenes["momentum-3"](H), {
    "m3-u": [5], "m3-al": [5 * c], "m3-ac": [5 * s], "m3-vA": [5 * s], "m3-vB": [5 * s], "m3-y": [5 * s],
    "m3-impA": [5 * c, "imp"], "m3-impB": [5 * c, "imp"],
  });
}
console.log(fails ? `\n${fails} check(s) FAILED` : "\nall checks passed");
process.exit(fails ? 1 : 0);
