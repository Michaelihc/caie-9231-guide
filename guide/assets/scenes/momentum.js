// Mega problem scenes for FM 3.6 Momentum. Plan view of a smooth horizontal table, spheres radius R.
// Every velocity after an impact is computed here from the same physics the working uses (H.P);
// scripts/check_momentum.mjs checks these numbers against the values written in the page.
// To scale: velocity arrow length = speed × S (one S per scene, scale bar in a corner); impulse arrows = |I| × SI.
// Dashed arrow = not known yet at that step (direction assumed, length not to scale).
// Colours: pen = part that changes in the impact (along line of centres / into wall),
// hl = part that stays (across line of centres / along wall), imp = impulse.
// Arrow ending on a sphere = velocity before an impact; arrow leaving it = after.
// Hover ids (tip) match <div data-tip> in guide/src/fm/3.6-momentum/30-mega.html. A component's hover draws the
// right-angled triangle it comes from (o.rtri): hypotenuse = velocity, adjacent to the angle = cos, opposite = sin.
(() => {
  const R = 1, EPS = 1e-6;   // EPS: t − EPS = just before an impact
  const fmt = (x, d = 2) => (Math.round(x * 10 ** d) / 10 ** d).toString().replace("-", "−");
  const scenes = window.CAIE_MEGA.scenes;

  // ---------- M1: direct impacts in a line, A (m) → B (2m) → wall, B comes back and hits A ----------
  scenes["momentum-1"] = ({ V, P, path }) => {
    const mA = 1, mB = 2, u = 10, e = 4 / 5, f = 3 / 4, WALL = 5;
    const [a1, b1] = P.direct(mA, mB, u, 0, e);                 // −2, 6
    const tW = (WALL - R) / b1;                                 // B (starts at x = 0) reaches the wall
    const bW = -f * b1;                                         // −4.5
    // B catches A when xB − xA = 2R:  (WALL − R) + bW (t − tW) − (−2R + a1 t) = 2R
    const tC = (bW * tW - (WALL - R)) / (bW - a1);
    const [a2, b2] = P.direct(mA, mB, a1, bW, e);               // −5, −3
    const T0 = -0.5, TE = tC + 0.6;
    const pA = path([{ t: T0, p: [-2 * R + u * T0, 0], v: [u, 0] }, { t: 0, p: [-2 * R, 0], v: [a1, 0] },
      { t: tC, p: [-2 * R + a1 * tC, 0], v: [a2, 0] }]);
    const pB = path([{ t: T0, p: [0, 0], v: [0, 0] }, { t: 0, p: [0, 0], v: [b1, 0] },
      { t: tW, p: [WALL - R, 0], v: [bW, 0] }, { t: tC, p: [WALL - R + bW * (tC - tW), 0], v: [b2, 0] }]);
    const vel = (t) => [pA.vel(t)[0], pB.vel(t)[0]];
    const S = 0.32;                                             // arrow length per m s⁻¹
    const up = (p) => V.add(p, [0, R + 0.55]), down = (p) => V.add(p, [0, -R - 1.5]);
    // hover id of each sphere's velocity in force at time t
    // same boundaries as path.vel: t − EPS (just before an impact) still belongs to the velocity before it
    const idA = (t) => (t < -EPS / 2 ? "m1-u" : t < tC - EPS / 2 ? "m1-a1" : "m1-a2");
    const idB = (t) => (t < -EPS / 2 ? "m1-rest" : t < tW - EPS / 2 ? "m1-b1" : t < tC - EPS / 2 ? "m1-bw" : "m1-b2");

    const base = (o, t) => {
      o.wall([WALL, -2.2], [WALL, 2.2], [1, 0]);
      o.text([WALL - 0.2, 2.6], "wall", "ink2", { anchor: "end", size: 12 });
      const A = pA(t), B = pB(t);
      o.ball(A, R, "A"); o.ball(B, R, "B");
      o.text(V.add(A, [0, -R - 0.7]), "m", "ink2", { anchor: "middle", size: 12 });
      o.text(V.add(B, [0, -R - 0.7]), "2m", "ink2", { anchor: "middle", size: 12 });
    };
    // velocity arrows over each sphere at time t (t − EPS ⇒ just before an impact), to scale
    // bBelow: B's arrow under it (when the spheres touch and both arrows point the same way)
    const arrows = (o, t, labels, cls = "pen", bBelow = false) => {
      const v = vel(t), at = [pA(t), pB(t)], ids = [idA(t), idB(t)];
      v.forEach((s, n) => {
        if (!labels[n]) return;
        const p = n === 1 && bBelow ? V.add(at[n], [0, -R - 1.45]) : up(at[n]);
        if (Math.abs(s) < 1e-6) { o.within(ids[n], () => o.text(p, labels[n], "ink2", { anchor: "middle", size: 13 })); return; }
        o.arrow(p, [s * S, 0], cls, { label: labels[n], tip: ids[n] });
      });
    };
    const plus = (o) => o.arrow([-12.8, -2.5], [1.6, 0], "ink2", { w: 1.5, label: "+ direction", size: 12, tip: "m1-plus" });

    return {
      view: [-13.5, -3.2, 6.2, 3.6],
      scale: { len: 5 * S, label: "5 m s⁻¹", corner: "tl" },
      debug: { pA, pB, R, walls: [{ x: WALL }], times: [T0, TE], nums: { a1, b1, bW, a2, b2 }, S },
      base,
      cues: {
        q: { t: [T0, T0], ov: (o, t) => { arrows(o, t, ["u", "at rest"]); o.text([WALL + 0.25, -2.6], "e = ¾", "ink2", { size: 12 }); } },
        hit1: { t: [T0, 0], ov: (o, t) => { plus(o); arrows(o, t - EPS, ["u", "0"], "pen", true); } },
        nel1: { t: [0, 0], ov: (o) => { plus(o); arrows(o, -EPS, ["u", "0"], "pen", true);
          o.within("m1-app1", () => o.text([pA(0)[0] + R, 2.9], "approach u − 0", "ink2", { anchor: "middle", size: 12 })); } },
        solve1: { t: [0, 0], ov: (o) => { plus(o);
          o.arrow(up(pA(0)), [0.9, 0], "pen", { label: "v_A ?", tip: "m1-unknown", unknown: true });
          o.arrow(up(pB(0)), [0.9, 0], "pen", { label: "v_B ?", tip: "m1-unknown", unknown: true });
          o.text(down(pA(0)), "both drawn +; sign comes out", "ink2", { anchor: "middle", size: 12 }); } },
        rev: { t: [0, 0], ov: (o) => { const A = pA(0);
          o.arrow(up(A), [-0.9, 0], "pen", { label: "e > ½: A goes back", tip: "m1-rev", unknown: true });
          o.arrow(down(A), [0.9, 0], "ink2", { w: 1.5, label: "e < ½: A keeps going", size: 12, tip: "m1-rev", unknown: true }); } },
        num1: { t: [0, 0], ov: (o) => { plus(o); arrows(o, 0, [fmt(-a1), fmt(b1)]); } },
        wall: { t: [0, tW], ov: (o, t) => {
          arrows(o, Math.min(t, tW - EPS), [fmt(-a1), ""]);
          const B = up(pB(Math.min(t, tW - EPS))), L = b1 * S;
          o.within("m1-b1", () => { o.arrow(V.add(B, [-L, 0]), [L, 0], "pen", {}); o.text(V.add(B, [-L - 0.2, 0]), `in ${fmt(b1)}`, "t-pen", { anchor: "end", dy: 4 }); });
          if (t >= tW - EPS) o.arrow(down(pB(tW)), [bW * S, 0], "pen", { label: `out ¾ × 6 = ${fmt(-bW)}`, size: 12, tip: "m1-bw" }); } },
        catch: { t: [tW, tW], ov: (o) => arrows(o, tW, [fmt(-a1), fmt(-bW)]) },
        hit2: { t: [tW, tC], ov: (o, t) => { plus(o); arrows(o, Math.min(t, tC - EPS), ["−2", "−4.5"], "pen", true); } },
        nel2: { t: [tC, tC], ov: (o) => { plus(o); arrows(o, tC - EPS, ["−2", "−4.5"], "pen", true);
          o.within("m1-app2", () => o.text([pA(tC)[0] + R, 2.9], "approach −2 − (−4.5) = 2.5", "ink2", { anchor: "middle", size: 12 })); } },
        solve2: { t: [tC, tC], ov: (o) => { plus(o); arrows(o, tC, [fmt(a2), fmt(b2)], "pen", true); } },
        after: { t: [tC, TE], ov: (o, t) => arrows(o, t, [`${fmt(-a2)} away`, `${fmt(-b2)} away`]) },
        ke: { t: [TE, TE], ov: (o, t) => arrows(o, t, [fmt(-a2), fmt(-b2)], "ink2") },
      },
    };
  };

  // ---------- M2: oblique impact, both moving; then A hits wall 1 (⊥ line of centres), then wall 2 (⊥ wall 1) ----------
  // Line of centres along x at the impact (A left, B right). + = A→B = +x, across = +y.
  scenes["momentum-2"] = ({ V, P, path }) => {
    const mA = 1, mB = 2, e = 1 / 2, eW = 1 / 3, WALL = -6.2, TOP = 6.6;
    const uA = [4, 3], uB = [-3, 4];                            // speed 5 each: cos α = 4/5, cos β = 3/5
    const [vA, vB] = P.oblique(mA, mB, uA, uB, [1, 0], e);      // (−3, 3), (0.5, 4)
    const tW = (WALL + 2 * R) / vA[0];                          // A's centre (starts at −R) reaches x = WALL + R
    const hit = V.add([-R, 0], V.mul(vA, tW));
    const wA = P.wall(vA, [1, 0], eW);                          // (1, 3)
    const tW2 = tW + (TOP - R - hit[1]) / wA[1];                // reaches the top wall
    const hit2 = V.add(hit, V.mul(wA, tW2 - tW));
    const wA2 = P.wall(wA, [0, -1], eW);                        // (1, −1)
    const T0 = -0.6, T1 = 0.6, T3 = tW2 + 0.9;
    const pA = path([{ t: T0, p: V.add([-R, 0], V.mul(uA, T0)), v: uA }, { t: 0, p: [-R, 0], v: vA },
      { t: tW, p: hit, v: wA }, { t: tW2, p: hit2, v: wA2 }]);
    const pB = path([{ t: T0, p: V.add([R, 0], V.mul(uB, T0)), v: uB }, { t: 0, p: [R, 0], v: vB }]);
    const S = 0.4, SI = 0.22;                                   // per m s⁻¹; per (m × m s⁻¹) of impulse
    const impA = mA * (vA[0] - uA[0]), impB = mB * (vB[0] - uB[0]);   // −7m, +7m
    const deg = (v) => V.ang(v);
    const sc = (v) => V.mul(v, S);
    const VIEW = [-7.2, -5.1, 6.8, 7.5];
    const zoom = (cx, cy, f) => { const w = (VIEW[2] - VIEW[0]) * f / 2, h = (VIEW[3] - VIEW[1]) * f / 2; return [cx - w, cy - h, cx + w, cy + h]; };
    const CORNER = zoom(-3.4, 3.2, 0.72), WALLS = zoom(-4.4, 4.4, 0.52);   // WALLS: closer, for the bounce triangles
    const X = [1, 0], Y = [0, 1];
    // tail of a velocity arrow drawn coming in to / going out of the sphere at p
    const tailIn = (p, v) => V.sub(V.sub(p, V.mul(V.unit(v), R)), sc(v)), tailOut = (p, v) => V.add(p, V.mul(V.unit(v), R));
    // triangle construction for velocity v drawn with tail T: legs along axis a (adjacent to the angle) then axis b
    const tri = (T, v, a, b, lab, cls, focus) => (o) => o.rtri(T, sc(V.mul(a, V.dot(v, a))), sc(V.mul(b, V.dot(v, b))), lab, cls, focus);
    const triUA = (f) => tri(tailIn(pA(-EPS), uA), uA, X, Y, { ang: "α", hyp: "5", adj: "5cos α = 4", opp: "5sin α = 3" }, ["pen", "hl"], f);
    const triUB = (f) => tri(tailIn(pB(-EPS), uB), uB, X, Y, { ang: "β", hyp: "5", adj: "5cos β = 3", opp: "5sin β = 4" }, ["pen", "hl"], f);
    const triVA = (t, f) => tri(tailOut(pA(t), vA), vA, X, Y, { ang: "45°", hyp: "3√2", adj: "3", opp: "3" }, ["pen", "hl"], f);
    const triVB = (t, f) => tri(tailOut(pB(t), vB), vB, X, Y, { ang: "82.9°", hyp: "√65 / 2", adj: "½", opp: "4" }, ["pen", "hl"], f);
    // walls: angle measured with the wall ⇒ along-wall leg is adjacent (cos), into-wall leg opposite (sin)
    const triW1in = (t, f) => tri(tailIn(pA(t), vA), vA, Y, X, { ang: "45°", hyp: "3√2", adj: "3√2 cos 45° = 3", opp: "3√2 sin 45° = 3" }, ["hl", "pen"], f);
    const triW1out = (f) => tri(tailOut(pA(tW), wA), wA, Y, X, { ang: "18.4°", hyp: "√10", adj: "3", opp: "1" }, ["hl", "pen"], f);
    const triW2in = (t, f) => tri(tailIn(pA(t), wA), wA, X, Y, { ang: "71.6°", hyp: "√10", adj: "√10 cos 71.6° = 1", opp: "√10 sin 71.6° = 3" }, ["hl", "pen"], f);
    const triW2out = (t, f) => tri(tailOut(pA(t), wA2), wA2, X, Y, { ang: "45°", hyp: "√2", adj: "1", opp: "1" }, ["hl", "pen"], f);

    const base = (o, t) => {
      o.wall([WALL, -4.8], [WALL, TOP], [-1, 0]);
      o.wall([WALL, TOP], [-1.2, TOP], [0, 1]);
      o.text([WALL + 0.3, -4.6], "wall 1", "ink2", { size: 12 });
      o.text([-3.0, TOP - 0.45], "wall 2", "ink2", { size: 12 });
      const A = pA(t), B = pB(t);
      o.ball(A, R, "A"); o.ball(B, R, "B");
      o.text(V.add(A, [0.55, 0.55]), "m", "ink2", { size: 12 });
      o.text(V.add(B, [0.55, 0.55]), "2m", "ink2", { size: 12 });
    };
    const loc = (o) => o.within("m2-loc", () => { o.line([WALL, 0], [6.4, 0], "ink2", 1.3, 6);
      o.text([6.4, -0.25], "line of centres", "ink2", { size: 12, anchor: "end", dy: 10 }); });
    const A0 = () => pA(-EPS), B0 = () => pB(-EPS);
    const plus = (o) => o.arrow([3.6, 2.6], [1.4, 0], "ink2", { w: 1.5, label: "+", size: 13, tip: "m2-plus" });
    const inA = (o, lab, side = 1) => o.vin(A0(), sc(uA), R, "ink", lab, side, { tip: "m2-uA", extra: triUA("hyp") });
    const inB = (o, lab, side = -1) => o.vin(B0(), sc(uB), R, "ink", lab, side, { tip: "m2-uB", extra: triUB("hyp") });

    return {
      view: VIEW,
      tempo: 1.4,
      scale: { len: 5 * S, label: "5 m s⁻¹", corner: "tr" },
      debug: { pA, pB, R, walls: [{ x: WALL }, { y: TOP, xMax: -1.2 }], times: [T0, T3], nums: { vA, vB, wA, wA2, impA, impB }, S, SI },
      base,
      cues: {
        q: { t: [T0, T0], ov: (o, t) => {
          o.vin(pA(t), sc(uA), R, "ink", "5", 1, { tip: "m2-uA" }); o.vin(pB(t), sc(uB), R, "ink", "5", -1, { tip: "m2-uB" }); } },
        hit: { t: [T0, 0], ov: (o) => { loc(o); inA(o, "5"); inB(o, "5");
          o.arc(A0(), 180, 180 + deg(uA), 1.7, "α", "hl", "m2-alpha"); o.arc(B0(), 180 + deg(uB), 360, 1.7, "β", "hl", "m2-beta"); } },
        resolve: { t: [0, 0], ov: (o) => { loc(o); inA(o, ""); inB(o, "");
          o.vin(A0(), sc([uA[0], 0]), R, "pen", "5cos α = 4", 1, { tip: "m2-uA-al", extra: triUA("adj") });
          o.vin(A0(), sc([0, uA[1]]), R, "hl", "5sin α = 3", 1, { tip: "m2-uA-ac", extra: triUA("opp") });
          o.vin(B0(), sc([uB[0], 0]), R, "pen", "5cos β = 3", -1, { tip: "m2-uB-al", extra: triUB("adj") });
          o.vin(B0(), sc([0, uB[1]]), R, "hl", "5sin β = 4", -1, { tip: "m2-uB-ac", extra: triUB("opp") }); } },
        imp: { t: [0, 0], ov: (o) => { loc(o);
          const ia = [impA * SI, 0], ib = [impB * SI, 0];
          o.within("m2-impA", () => { o.arrow(V.add(A0(), [-R, 0]), ia, "imp", { w: 3.5 }); o.side(V.add(A0(), [-R, 0]), ia, "impulse on A: 7m", "imp", -1); });
          o.within("m2-impB", () => { o.arrow(V.add(B0(), [R, 0]), ib, "imp", { w: 3.5 }); o.side(V.add(B0(), [R, 0]), ib, "impulse on B: 7m", "imp", 1); });
          o.bar([-5.4, 4.6], 5 * SI, "impulse 5m N s", "imp", "m2-impscale");
          o.vin(A0(), sc([0, uA[1]]), R, "hl", "3 stays", 1, { tip: "m2-uA-ac", extra: triUA("opp") });
          o.vin(B0(), sc([0, uB[1]]), R, "hl", "4 stays", -1, { tip: "m2-uB-ac", extra: triUB("opp") });
          o.text([0, 2.4], "smooth ⇒ impulse only along line of centres", "imp", { anchor: "middle", size: 12 }); } },
        mom: { t: [0, 0], ov: (o) => { loc(o); plus(o);
          o.vin(A0(), sc([uA[0], 0]), R, "pen", "4", 1, { tip: "m2-uA-al", extra: triUA("adj") });
          o.vin(B0(), sc([uB[0], 0]), R, "pen", "−3", 1, { tip: "m2-uB-al", extra: triUB("adj") }); } },
        nel: { t: [0, 0], ov: (o) => { loc(o); plus(o);
          o.vin(A0(), sc([uA[0], 0]), R, "pen", "4", 1, { tip: "m2-uA-al", extra: triUA("adj") });
          o.vin(B0(), sc([uB[0], 0]), R, "pen", "−3", 1, { tip: "m2-uB-al", extra: triUB("adj") });
          o.within("m2-app", () => o.text([0, -1.9], "approach 4 − (−3) = 7", "ink2", { anchor: "middle", size: 12 })); } },
        solve: { t: [0, 0], ov: (o) => { loc(o); plus(o);
          o.vout(pA(0), sc([vA[0], 0]), R, "pen", fmt(vA[0]), 1, { tip: "m2-vA-al" });
          o.vout(pB(0), sc([vB[0], 0]), R, "pen", "½", 1, { tip: "m2-vB-al" }); } },
        combine: { t: [0, T1], ov: (o, t) => { loc(o); const A = pA(t), B = pB(t);
          o.vout(A, sc([vA[0], 0]), R, "pen", "3", -1, { tip: "m2-vA-al", extra: triVA(t, "adj") });
          o.vout(A, sc([0, vA[1]]), R, "hl", "3", -1, { tip: "m2-vA-ac", extra: triVA(t, "opp") });
          o.vout(A, sc(vA), R, "ink", "3√2", 1, { tip: "m2-vA", extra: triVA(t, "hyp") });
          o.vout(B, sc([vB[0], 0]), R, "pen", "½", -1, { tip: "m2-vB-al", extra: triVB(t, "adj") });
          o.vout(B, sc([0, vB[1]]), R, "hl", "4", 1, { tip: "m2-vB-ac", extra: triVB(t, "opp") });
          o.vout(B, sc(vB), R, "ink", "√65 / 2", -1, { tip: "m2-vB", extra: triVB(t, "hyp") }); } },
        dirs: { t: [T1, T1], ov: (o, t) => { loc(o); const A = pA(t), B = pB(t);
          o.vout(A, sc(vA), R, "ink", "3√2", 1, { tip: "m2-vA", extra: triVA(t, "hyp") });
          o.vout(B, sc(vB), R, "ink", "√65 / 2", -1, { tip: "m2-vB", extra: triVB(t, "hyp") });
          o.line(A, V.add(A, [-2.2, 0]), "ink2", 1, 3); o.line(B, V.add(B, [2.2, 0]), "ink2", 1, 3);
          o.arc(A, deg(vA), 180, 1.7, "45°", "hl", "m2-angA"); o.arc(B, 0, deg(vB), 1.7, `${fmt(deg(vB), 1)}°`, "hl", "m2-angB"); } },
        defl: { t: [T1, T1], ov: (o, t) => { const A = pA(t);
          o.within("m2-old", () => { o.line(V.add(A, V.mul(V.unit(uA), R)), V.add(A, V.mul(V.unit(uA), R + 2.2)), "ink2", 1.5, 4);
            o.text(V.add(A, V.mul(V.unit(uA), R + 2.5)), "old direction", "ink2", { size: 12 }); });
          o.vout(A, sc(vA), R, "ink", "new", 1, { tip: "m2-vA" });
          o.arc(A, deg(uA), deg(vA), 1.7, `${fmt(deg(vA) - deg(uA), 1)}°`, "hl", "m2-defl"); } },
        ke: { t: [T1, T1], ov: (o, t) => {
          o.vout(pA(t), sc(vA), R, "ink", "3√2", 1, { tip: "m2-vA", extra: triVA(t, "hyp") });
          o.vout(pB(t), sc(vB), R, "ink", "√65 / 2", -1, { tip: "m2-vB", extra: triVB(t, "hyp") }); } },
        towall: { t: [T1, tW], view: CORNER, ov: (o, t) => { const tt = Math.min(t, tW - EPS), A = pA(tt);
          o.vin(A, sc(vA), R, "ink2", "", 1, { tip: "m2-w1-v", extra: triW1in(tt, "hyp") });
          o.vin(A, sc([vA[0], 0]), R, "pen", "3 into wall", -1, { tip: "m2-w1-in", extra: triW1in(tt, "opp") });
          o.vin(A, sc([0, vA[1]]), R, "hl", "3 along wall", -1, { tip: "m2-w1-al", extra: triW1in(tt, "adj") }); } },
        bounce: { t: [tW, tW], view: WALLS, ov: (o, t) => { const A = pA(t);
          o.ball(hit, R, "", "ball ghost");
          o.vout(A, sc([wA[0], 0]), R, "pen", "⅓ × 3 = 1", -1, { tip: "m2-w1-out", extra: triW1out("opp") });
          o.vout(A, sc([0, wA[1]]), R, "hl", "3 kept", -1, { tip: "m2-w1-kept", extra: triW1out("adj") });
          const c = V.add(hit, [-R, 0]);
          o.within("m2-w1-ang", () => { o.line(c, V.add(c, V.mul(V.unit(wA), 1.9)), "ink2", 1.2, 4);
            o.arc(c, deg(wA), 90, 2.4, `${fmt(90 - deg(wA), 1)}°`); }, triW1out("hyp")); } },
        towall2: { t: [tW, tW2], view: WALLS, ov: (o, t) => { const tt = Math.min(t, tW2 - EPS), A = pA(tt);
          o.vin(A, sc([0, wA[1]]), R, "pen", "3 into wall 2", -1, { tip: "m2-w2-in", extra: triW2in(tt, "opp") });
          o.vout(A, sc([wA[0], 0]), R, "hl", "1 along wall 2", 1, { tip: "m2-w2-al", extra: triW2in(tt, "adj") }); } },
        bounce2: { t: [tW2, T3], view: WALLS, ov: (o, t) => { const A = pA(t);
          o.ball(hit2, R, "", "ball ghost");
          o.vout(A, sc([0, wA2[1]]), R, "pen", "⅓ × 3 = 1", -1, { tip: "m2-w2-out", extra: triW2out(t, "opp") });
          o.vout(A, sc([wA2[0], 0]), R, "hl", "1 kept", 1, { tip: "m2-w2-kept", extra: triW2out(t, "adj") }); } },
        par: { t: [T3, T3], view: CORNER, ov: (o) => { const A = pA(T3), P0 = pA(T1);
          o.within("m2-path-in", () => { o.line(P0, hit, "hl", 2, 6);
            o.text(V.add(V.mul(V.add(P0, hit), 0.5), [0.5, -0.4]), "in: (−3, 3)", "hl", { size: 13 }); });
          o.line(hit, hit2, "ink2", 1.2, 4);
          o.within("m2-path-out", () => { o.line(hit2, V.add(hit2, V.mul(V.unit(wA2), 5)), "hl", 2, 6);
            o.vout(A, sc(wA2), R, "ink", "out: (1, −1)", -1); }); } },
        ke2: { t: [T3, T3], view: CORNER, ov: (o) => { const A = pA(T3), P0 = pA(T1);
          o.within("m2-path-in", () => { o.line(P0, hit, "hl", 2, 6);
            o.text(V.add(V.mul(V.add(P0, hit), 0.5), [0.5, -0.4]), "speed 3√2", "hl", { size: 13 }); });
          o.within("m2-path-out", () => { o.line(hit2, V.add(hit2, V.mul(V.unit(wA2), 5)), "hl", 2, 6);
            o.vout(A, sc(wA2), R, "ink", "speed √2", -1); }); } },
      },
    };
  };

  // ---------- M3: A hits B (at rest) obliquely; A ends up moving ⊥ line of centres ----------
  // A moves along +x; line of centres tilted at θ below it (tan θ = 1/2) so resolving is visibly along that line.
  scenes["momentum-3"] = ({ V, P, path }) => {
    const u = 5, k = 2, e = 1 / 2, th = Math.atan(1 / 2);
    const n = [Math.cos(th), -Math.sin(th)];                     // + along line of centres, A → B
    const across = [Math.sin(th), Math.cos(th)];                 // ⊥ n, on A's side
    const uA = [u, 0];
    const [vA, vB] = P.oblique(1, k, uA, [0, 0], n, e);          // vA = u sinθ · across, vB = ½u cosθ · n
    const A0 = V.mul(n, -R), B0 = V.mul(n, R);
    const T0 = -0.4, T2 = 1.1;
    const pA = path([{ t: T0, p: V.add(A0, V.mul(uA, T0)), v: uA }, { t: 0, p: A0, v: vA }]);
    const pB = path([{ t: T0, p: B0, v: [0, 0] }, { t: 0, p: B0, v: vB }]);
    const S = 0.45, SI = 0.33;
    const impA = V.dot(V.sub(vA, uA), n), impB = k * V.dot(vB, n);   // −mu cosθ, +mu cosθ (in units of m)
    const deg = (v) => V.ang(v);
    const sc = (v) => V.mul(v, S);
    const along = V.dot(uA, n), acr = V.dot(uA, across);       // u cosθ, u sinθ
    const triU = (f) => (o) => o.rtri(V.sub(V.sub(A0, V.mul(V.unit(uA), R)), sc(uA)), sc(V.mul(n, along)), sc(V.mul(across, acr)),
      { ang: "θ", hyp: "u", adj: "u cos θ", opp: "u sin θ" }, ["pen", "hl"], f);

    const base = (o, t) => {
      const A = pA(t), B = pB(t);
      o.ball(A, R, "A"); o.ball(B, R, "B");
      o.text(V.add(A, [0.55, 0.55]), "m", "ink2", { size: 12 });
      o.text(V.add(B, [0.55, 0.55]), "km", "ink2", { size: 12 });
    };
    const loc = (o) => o.within("m3-loc", () => { o.line(V.mul(n, -6), V.mul(n, 5.4), "ink2", 1.3, 6);
      o.text(V.add(V.mul(n, 5.4), [0, -0.5]), "line of centres", "ink2", { size: 12, anchor: "end" }); });
    const plus = (o) => { const p = V.add(V.mul(n, 2.4), V.mul(across, 1.6)); o.arrow(p, V.mul(n, 1.4), "ink2", { w: 1.5, label: "+", size: 13, tip: "m3-plus" }); };
    const rightAngle = (o, c, d1, d2, s = 0.45) => {
      const a = V.add(c, V.mul(d1, s)), b = V.add(c, V.mul(d2, s));
      o.line(a, V.add(a, V.mul(d2, s)), "hl", 1.5); o.line(b, V.add(b, V.mul(d1, s)), "hl", 1.5);
    };
    const inA = (o, lab, side = 1, cls = "ink") => o.vin(A0, sc(uA), R, cls, lab, side, { tip: "m3-u", extra: triU("hyp") });
    const afterArrows = (o, t, la, lb) => {
      o.vout(pA(t), sc(vA), R, "hl", la, 1, { tip: "m3-vA" }); o.vout(pB(t), sc(vB), R, "pen", lb, 1, { tip: "m3-vB" }); };

    return {
      view: [-6.4, -3.6, 5.8, 4.4],
      tempo: 1.3,
      scale: { len: u * S, label: "u", corner: "tl" },
      debug: { pA, pB, R, walls: [], times: [T0, T2], nums: { vA, vB, n, impA, impB }, S, SI },
      base,
      cues: {
        q: { t: [T0, T0], ov: (o, t) => { o.vin(pA(t), sc(uA), R, "ink", "u", 1, { tip: "m3-u" });
          o.within("m3-rest", () => o.text(V.add(pB(t), [0, -R - 0.5]), "at rest", "ink2", { anchor: "middle", size: 12 })); } },
        hit: { t: [T0, 0], ov: (o) => { loc(o); inA(o, "u", -1);
          o.line(A0, V.add(A0, [-2.6, 0]), "ink2", 1, 3);
          o.arc(A0, 180 + deg(n), 180, 1.9, "θ", "hl", "m3-theta"); } },
        resolve: { t: [0, 0], ov: (o) => { loc(o); inA(o, "", 1, "ink2");
          o.vin(A0, sc(V.mul(n, along)), R, "pen", "u cos θ", -1, { tip: "m3-al", extra: triU("adj") });
          o.vin(A0, sc(V.mul(across, acr)), R, "hl", "u sin θ", 1, { tip: "m3-ac", extra: triU("opp") }); } },
        imp: { t: [0, 0], ov: (o) => { loc(o);
          const ia = V.mul(n, impA * SI), ib = V.mul(n, impB * SI);
          o.within("m3-impA", () => { o.arrow(V.add(A0, V.mul(n, -R)), ia, "imp", { w: 3.5 }); o.side(V.add(A0, V.mul(n, -R)), ia, "impulse on A", "imp", -1); });
          o.within("m3-impB", () => { o.arrow(V.add(B0, V.mul(n, R)), ib, "imp", { w: 3.5 }); o.side(V.add(B0, V.mul(n, R)), ib, "impulse on B", "imp", -1); });
          o.bar([-6.0, -3.0], u * SI, "impulse mu", "imp", "m3-impscale");
          o.vin(A0, sc(V.mul(across, acr)), R, "hl", "u sin θ stays", 1, { tip: "m3-ac", extra: triU("opp") }); } },
        mom: { t: [0, 0], ov: (o) => { loc(o); plus(o);
          o.vin(A0, sc(V.mul(n, along)), R, "pen", "u cos θ", -1, { tip: "m3-al", extra: triU("adj") });
          o.within("m3-rest", () => o.text(V.add(B0, [0, -R - 0.5]), "0", "ink2", { anchor: "middle", size: 13 })); } },
        nel: { t: [0, 0], ov: (o) => { loc(o); plus(o);
          o.vin(A0, sc(V.mul(n, along)), R, "pen", "u cos θ", -1, { tip: "m3-al", extra: triU("adj") });
          o.within("m3-app", () => o.text([0, -2.6], "approach u cos θ − 0", "ink2", { anchor: "middle", size: 12 })); } },
        solveB: { t: [0, 0], ov: (o) => { loc(o); plus(o); o.vout(B0, sc(vB), R, "pen", "y ?", 1, { tip: "m3-y-unknown", unknown: true }); } },
        solveA: { t: [0, 0], ov: (o) => { loc(o); plus(o); o.vout(B0, sc(vB), R, "pen", "y", 1, { tip: "m3-y" });
          const p = V.add(A0, V.mul(across, R + 0.35)), d = V.mul(n, 0.9);
          o.arrow(p, d, "pen", { tip: "m3-x-unknown", unknown: true }); o.within("m3-x-unknown", () => o.side(p, d, "x ? (sign unknown)", "pen", 1)); } },
        perp: { t: [0, 0], ov: (o) => { loc(o); o.vout(A0, sc(V.mul(across, acr)), R, "hl", "x = 0: only u sin θ left", 1, { tip: "m3-vA" });
          o.vout(B0, sc(vB), R, "pen", "y", 1, { tip: "m3-y" }); } },
        range: { t: [0, 0], ov: (o) => { loc(o); o.vout(A0, sc(V.mul(across, acr)), R, "hl", "u sin θ", 1, { tip: "m3-vA" });
          o.vout(B0, sc(vB), R, "pen", "y", 1, { tip: "m3-y" }); } },
        sub: { t: [0, 0], ov: (o) => { loc(o); afterArrows(o, 0, "u sin θ", "½u cos θ"); } },
        ke: { t: [0, 0], ov: (o) => { loc(o); afterArrows(o, 0, "u sin θ (KE kept)", "½u cos θ"); } },
        speeds: { t: [0, T2], ov: (o, t) => { afterArrows(o, t, `u/√5`, `u/√5`); } },
        after: { t: [T2, T2], ov: (o, t) => { loc(o); afterArrows(o, t, `u/√5`, `u/√5`);
          o.within("m3-right", () => { o.line(A0, V.add(A0, V.mul(across, 3)), "hl", 1.2, 4); rightAngle(o, A0, n, across); }); } },
      },
    };
  };
})();
