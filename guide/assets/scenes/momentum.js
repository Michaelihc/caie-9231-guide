// Mega problem scenes for FM 3.6 Momentum. Plan view of a smooth horizontal table, spheres radius R.
// Every velocity after an impact is computed here from the same physics the working uses (H.P);
// scripts/check_momentum.mjs checks these numbers against the values written in the page.
// Colours: pen = part that changes in the impact (along line of centres / into wall),
// hl = part that stays (across line of centres / along wall), imp = impulse.
// Arrow ending on a sphere = velocity before an impact; arrow leaving it = after.
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

    const base = (o, t) => {
      o.wall([WALL, -2.2], [WALL, 2.2], [1, 0]);
      o.text([WALL - 0.2, 2.6], "wall", "ink2", { anchor: "end", size: 12 });
      const A = pA(t), B = pB(t);
      o.ball(A, R, "A"); o.ball(B, R, "B");
      o.text(V.add(A, [0, -R - 0.7]), "m", "ink2", { anchor: "middle", size: 12 });
      o.text(V.add(B, [0, -R - 0.7]), "2m", "ink2", { anchor: "middle", size: 12 });
    };
    // velocity arrows over each sphere at time t (t − EPS ⇒ just before an impact)
    // bBelow: B's arrow under it (when the spheres touch and both arrows point the same way)
    const arrows = (o, t, labels, cls = "pen", bBelow = false) => {
      const v = vel(t), at = [pA(t), pB(t)];
      v.forEach((s, n) => {
        if (!labels[n]) return;
        const p = n === 1 && bBelow ? V.add(at[n], [0, -R - 1.45]) : up(at[n]);
        if (Math.abs(s) < 1e-6) { o.text(p, labels[n], "ink2", { anchor: "middle", size: 13 }); return; }
        o.arrow(p, [s * S, 0], cls, { label: labels[n] });
      });
    };
    const plus = (o) => o.arrow([-12.8, -2.5], [1.6, 0], "ink2", { w: 1.5, label: "+ direction", size: 12 });

    return {
      view: [-13.5, -3.2, 6.2, 3.6],
      debug: { pA, pB, R, walls: [{ x: WALL }], times: [T0, TE], nums: { a1, b1, bW, a2, b2 } },
      base,
      cues: {
        q: { t: [T0, T0], ov: (o, t) => { arrows(o, t, ["u", "at rest"]); o.text([WALL + 0.25, -2.6], "e = ¾", "ink2", { size: 12 }); } },
        hit1: { t: [T0, 0], ov: (o, t) => { plus(o); arrows(o, t - EPS, ["u", "0"], "pen", true); } },
        nel1: { t: [0, 0], ov: (o) => { plus(o); arrows(o, -EPS, ["u", "0"], "pen", true);
          o.text([pA(0)[0] + R, 2.9], "approach u − 0", "ink2", { anchor: "middle", size: 12 }); } },
        solve1: { t: [0, 0], ov: (o) => { plus(o);
          o.arrow(up(pA(0)), [0.9, 0], "pen", { label: "v_A" }); o.arrow(up(pB(0)), [0.9, 0], "pen", { label: "v_B" });
          o.text(down(pA(0)), "both drawn +; sign comes out", "ink2", { anchor: "middle", size: 12 }); } },
        rev: { t: [0, 0], ov: (o) => { const A = pA(0);
          o.arrow(up(A), [-2 * S, 0], "pen", { label: "e > ½: A goes back" });
          o.arrow(down(A), [1.2, 0], "ink2", { w: 1.5, label: "e < ½: A keeps going", size: 12 }); } },
        num1: { t: [0, 0], ov: (o) => { plus(o); arrows(o, 0, [fmt(-a1), fmt(b1)]); } },
        wall: { t: [0, tW], ov: (o, t) => {
          arrows(o, Math.min(t, tW - EPS), [fmt(-a1), ""]);
          const B = up(pB(Math.min(t, tW - EPS))), L = b1 * S;
          o.arrow(V.add(B, [-L, 0]), [L, 0], "pen", {}); o.text(V.add(B, [-L - 0.2, 0]), `in ${fmt(b1)}`, "t-pen", { anchor: "end", dy: 4 });
          if (t >= tW - EPS) o.arrow(down(pB(tW)), [bW * S, 0], "pen", { label: `out ¾ × 6 = ${fmt(-bW)}`, size: 12 }); } },
        catch: { t: [tW, tW], ov: (o) => arrows(o, tW, [fmt(-a1), fmt(-bW)]) },
        hit2: { t: [tW, tC], ov: (o, t) => { plus(o); arrows(o, Math.min(t, tC - EPS), ["−2", "−4.5"], "pen", true); } },
        nel2: { t: [tC, tC], ov: (o) => { plus(o); arrows(o, tC - EPS, ["−2", "−4.5"], "pen", true);
          o.text([pA(tC)[0] + R, 2.9], "approach −2 − (−4.5) = 2.5", "ink2", { anchor: "middle", size: 12 }); } },
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
    const S = 0.4;
    const deg = (v) => V.ang(v);
    const sc = (v) => V.mul(v, S);
    const VIEW = [-7.2, -5.1, 6.8, 7.5];
    const zoom = (cx, cy, f) => { const w = (VIEW[2] - VIEW[0]) * f / 2, h = (VIEW[3] - VIEW[1]) * f / 2; return [cx - w, cy - h, cx + w, cy + h]; };
    const CORNER = zoom(-3.4, 3.2, 0.72);

    const base = (o, t) => {
      o.wall([WALL, -4.8], [WALL, TOP], [-1, 0]);
      o.wall([WALL, TOP], [-1.2, TOP], [0, 1]);
      o.text([WALL + 0.3, -4.6], "wall 1", "ink2", { size: 12 });
      o.text([-1.0, TOP - 0.1], "wall 2", "ink2", { size: 12, dy: 4 });
      const A = pA(t), B = pB(t);
      o.ball(A, R, "A"); o.ball(B, R, "B");
      o.text(V.add(A, [0.55, 0.55]), "m", "ink2", { size: 12 });
      o.text(V.add(B, [0.55, 0.55]), "2m", "ink2", { size: 12 });
    };
    const loc = (o) => { o.line([WALL, 0], [6.4, 0], "ink2", 1.3, 6); o.text([6.4, -0.25], "line of centres", "ink2", { size: 12, anchor: "end", dy: 10 }); };
    const A0 = () => pA(0), B0 = () => pB(0);
    const plus = (o) => o.arrow([3.6, 2.6], [1.4, 0], "ink2", { w: 1.5, label: "+", size: 13 });

    return {
      view: VIEW,
      tempo: 1.4,
      debug: { pA, pB, R, walls: [{ x: WALL }, { y: TOP, xMax: -1.2 }], times: [T0, T3], nums: { vA, vB, wA, wA2 } },
      base,
      cues: {
        q: { t: [T0, T0], ov: (o, t) => { o.vin(pA(t), sc(uA), R, "ink", "5"); o.vin(pB(t), sc(uB), R, "ink", "5", -1); } },
        hit: { t: [T0, 0], ov: (o) => { loc(o);
          o.vin(A0(), sc(uA), R, "ink", "5"); o.vin(B0(), sc(uB), R, "ink", "5", -1);
          o.arc(A0(), 180, 180 + deg(uA), 1.7, "α"); o.arc(B0(), 180 + deg(uB), 360, 1.7, "β"); } },
        resolve: { t: [0, 0], ov: (o) => { loc(o);
          o.vin(A0(), sc(uA), R, "ink2"); o.vin(B0(), sc(uB), R, "ink2", "", -1);
          o.vin(A0(), sc([uA[0], 0]), R, "pen", "5cos α = 4"); o.vin(A0(), sc([0, uA[1]]), R, "hl", "5sin α = 3");
          o.vin(B0(), sc([uB[0], 0]), R, "pen", "5cos β = 3", -1); o.vin(B0(), sc([0, uB[1]]), R, "hl", "5sin β = 4", -1); } },
        imp: { t: [0, 0], ov: (o) => { loc(o);
          o.arrow(V.add(A0(), [-R, 0]), [-1.6, 0], "imp", { w: 3.5 }); o.side(V.add(A0(), [-R, 0]), [-1.6, 0], "impulse on A", "imp", -1);
          o.arrow(V.add(B0(), [R, 0]), [1.6, 0], "imp", { w: 3.5 }); o.side(V.add(B0(), [R, 0]), [1.6, 0], "impulse on B", "imp", 1);
          o.vin(A0(), sc([0, uA[1]]), R, "hl", "3 stays"); o.vin(B0(), sc([0, uB[1]]), R, "hl", "4 stays", -1);
          o.text([0, 2.4], "smooth ⇒ impulse only along line of centres", "imp", { anchor: "middle", size: 12 }); } },
        mom: { t: [0, 0], ov: (o) => { loc(o); plus(o);
          o.vin(A0(), sc([uA[0], 0]), R, "pen", "4"); o.vin(B0(), sc([uB[0], 0]), R, "pen", "−3"); } },
        nel: { t: [0, 0], ov: (o) => { loc(o); plus(o);
          o.vin(A0(), sc([uA[0], 0]), R, "pen", "4"); o.vin(B0(), sc([uB[0], 0]), R, "pen", "−3");
          o.text([0, -1.9], "approach 4 − (−3) = 7", "ink2", { anchor: "middle", size: 12 }); } },
        solve: { t: [0, 0], ov: (o) => { loc(o); plus(o);
          o.vout(A0(), sc([vA[0], 0]), R, "pen", fmt(vA[0])); o.vout(B0(), sc([vB[0], 0]), R, "pen", "½"); } },
        combine: { t: [0, T1], ov: (o, t) => { loc(o); const A = pA(t), B = pB(t);
          o.vout(A, sc([vA[0], 0]), R, "pen", "3", -1); o.vout(A, sc([0, vA[1]]), R, "hl", "3", -1); o.vout(A, sc(vA), R, "ink", "3√2", 1);
          o.vout(B, sc([vB[0], 0]), R, "pen", "½", -1); o.vout(B, sc([0, vB[1]]), R, "hl", "4", 1); o.vout(B, sc(vB), R, "ink", "√65 / 2", -1); } },
        dirs: { t: [T1, T1], ov: (o, t) => { loc(o); const A = pA(t), B = pB(t);
          o.vout(A, sc(vA), R, "ink", "3√2"); o.vout(B, sc(vB), R, "ink", "√65 / 2", -1);
          o.line(A, V.add(A, [-2.2, 0]), "ink2", 1, 3); o.line(B, V.add(B, [2.2, 0]), "ink2", 1, 3);
          o.arc(A, deg(vA), 180, 1.7, "45°"); o.arc(B, 0, deg(vB), 1.7, `${fmt(deg(vB), 1)}°`); } },
        defl: { t: [T1, T1], ov: (o, t) => { const A = pA(t);
          o.line(V.add(A, V.mul(V.unit(uA), R)), V.add(A, V.mul(V.unit(uA), R + 2.2)), "ink2", 1.5, 4);
          o.text(V.add(A, V.mul(V.unit(uA), R + 2.5)), "old direction", "ink2", { size: 12 });
          o.vout(A, sc(vA), R, "ink", "new");
          o.arc(A, deg(uA), deg(vA), 1.7, `${fmt(deg(vA) - deg(uA), 1)}°`); } },
        ke: { t: [T1, T1], ov: (o, t) => { o.vout(pA(t), sc(vA), R, "ink", "3√2"); o.vout(pB(t), sc(vB), R, "ink", "√65 / 2", -1); } },
        towall: { t: [T1, tW], view: CORNER, ov: (o, t) => { const A = pA(Math.min(t, tW - EPS));
          o.vin(A, sc([vA[0], 0]), R, "pen", "3 into wall", -1); o.vin(A, sc([0, vA[1]]), R, "hl", "3 along wall", -1); } },
        bounce: { t: [tW, tW], view: CORNER, ov: (o, t) => { const A = pA(t);
          o.ball(hit, R, "", "ball ghost");
          o.vout(A, sc([wA[0], 0]), R, "pen", "⅓ × 3 = 1", -1); o.vout(A, sc([0, wA[1]]), R, "hl", "3 kept", -1);
          const c = V.add(hit, [-R, 0]);
          o.line(c, V.add(c, V.mul(V.unit(wA), 1.9)), "ink2", 1.2, 4);
          o.arc(c, deg(wA), 90, 2.4, `${fmt(90 - deg(wA), 1)}°`); } },
        towall2: { t: [tW, tW2], view: CORNER, ov: (o, t) => { const A = pA(Math.min(t, tW2 - EPS));
          o.vin(A, sc([0, wA[1]]), R, "pen", "3 into wall 2", -1); o.vout(A, sc([wA[0], 0]), R, "hl", "1 along wall 2", 1); } },
        bounce2: { t: [tW2, T3], view: CORNER, ov: (o, t) => { const A = pA(t);
          o.ball(hit2, R, "", "ball ghost");
          o.vout(A, sc([0, wA2[1]]), R, "pen", "⅓ × 3 = 1", -1); o.vout(A, sc([wA2[0], 0]), R, "hl", "1 kept", 1); } },
        par: { t: [T3, T3], view: CORNER, ov: (o) => { const A = pA(T3), P0 = pA(T1);
          o.line(P0, hit, "hl", 2, 6); o.line(hit, hit2, "ink2", 1.2, 4); o.line(hit2, V.add(hit2, V.mul(V.unit(wA2), 5)), "hl", 2, 6);
          o.text(V.add(V.mul(V.add(P0, hit), 0.5), [0.5, -0.4]), "in: (−3, 3)", "hl", { size: 13 });
          o.vout(A, sc(wA2), R, "ink", "out: (1, −1)", -1); } },
        ke2: { t: [T3, T3], view: CORNER, ov: (o) => { const A = pA(T3), P0 = pA(T1);
          o.line(P0, hit, "hl", 2, 6); o.line(hit2, V.add(hit2, V.mul(V.unit(wA2), 5)), "hl", 2, 6);
          o.text(V.add(V.mul(V.add(P0, hit), 0.5), [0.5, -0.4]), "speed 3√2", "hl", { size: 13 });
          o.vout(A, sc(wA2), R, "ink", "speed √2", -1); } },
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
    const S = 0.45;
    const deg = (v) => V.ang(v);
    const sc = (v) => V.mul(v, S);
    const along = V.dot(uA, n), acr = V.dot(uA, across);       // u cosθ, u sinθ

    const base = (o, t) => {
      const A = pA(t), B = pB(t);
      o.ball(A, R, "A"); o.ball(B, R, "B");
      o.text(V.add(A, [0.55, 0.55]), "m", "ink2", { size: 12 });
      o.text(V.add(B, [0.55, 0.55]), "km", "ink2", { size: 12 });
    };
    const loc = (o) => { o.line(V.mul(n, -6), V.mul(n, 5.4), "ink2", 1.3, 6);
      o.text(V.add(V.mul(n, 5.4), [0, -0.5]), "line of centres", "ink2", { size: 12, anchor: "end" }); };
    const plus = (o) => { const p = V.add(V.mul(n, 2.4), V.mul(across, 1.6)); o.arrow(p, V.mul(n, 1.4), "ink2", { w: 1.5, label: "+", size: 13 }); };
    const rightAngle = (o, c, d1, d2, s = 0.45) => {
      const a = V.add(c, V.mul(d1, s)), b = V.add(c, V.mul(d2, s));
      o.line(a, V.add(a, V.mul(d2, s)), "hl", 1.5); o.line(b, V.add(b, V.mul(d1, s)), "hl", 1.5);
    };
    const afterArrows = (o, t, la, lb) => { o.vout(pA(t), sc(vA), R, "hl", la, 1); o.vout(pB(t), sc(vB), R, "pen", lb, 1); };

    return {
      view: [-6.4, -3.6, 5.8, 4.4],
      tempo: 1.3,
      debug: { pA, pB, R, walls: [], times: [T0, T2], nums: { vA, vB, n } },
      base,
      cues: {
        q: { t: [T0, T0], ov: (o, t) => { o.vin(pA(t), sc(uA), R, "ink", "u"); o.text(V.add(pB(t), [0, -R - 0.5]), "at rest", "ink2", { anchor: "middle", size: 12 }); } },
        hit: { t: [T0, 0], ov: (o) => { loc(o); o.vin(A0, sc(uA), R, "ink", "u", -1);
          o.line(A0, V.add(A0, [-2.6, 0]), "ink2", 1, 3);
          o.arc(A0, 180 + deg(n), 180, 1.9, "θ"); } },
        resolve: { t: [0, 0], ov: (o) => { loc(o);
          o.vin(A0, sc(uA), R, "ink2");
          o.vin(A0, sc(V.mul(n, along)), R, "pen", "u cos θ", -1); o.vin(A0, sc(V.mul(across, acr)), R, "hl", "u sin θ", 1); } },
        imp: { t: [0, 0], ov: (o) => { loc(o);
          o.arrow(V.add(A0, V.mul(n, -R)), V.mul(n, -1.5), "imp", { w: 3.5 }); o.side(V.add(A0, V.mul(n, -R)), V.mul(n, -1.5), "impulse on A", "imp", -1);
          o.arrow(V.add(B0, V.mul(n, R)), V.mul(n, 1.5), "imp", { w: 3.5 }); o.side(V.add(B0, V.mul(n, R)), V.mul(n, 1.5), "impulse on B", "imp", -1);
          o.vin(A0, sc(V.mul(across, acr)), R, "hl", "u sin θ stays", 1); } },
        mom: { t: [0, 0], ov: (o) => { loc(o); plus(o); o.vin(A0, sc(V.mul(n, along)), R, "pen", "u cos θ", -1);
          o.text(V.add(B0, [0, -R - 0.5]), "0", "ink2", { anchor: "middle", size: 13 }); } },
        nel: { t: [0, 0], ov: (o) => { loc(o); plus(o); o.vin(A0, sc(V.mul(n, along)), R, "pen", "u cos θ", -1);
          o.text([0, -2.6], "approach u cos θ − 0", "ink2", { anchor: "middle", size: 12 }); } },
        solveB: { t: [0, 0], ov: (o) => { loc(o); plus(o); o.vout(B0, sc(V.mul(n, 2.2)), R, "pen", "y", 1); } },
        solveA: { t: [0, 0], ov: (o) => { loc(o); plus(o); o.vout(B0, sc(V.mul(n, 2.2)), R, "pen", "y", 1);
          const p = V.add(A0, V.mul(across, R + 0.35)); o.arrow(p, sc(V.mul(n, 2.2)), "pen", {}); o.side(p, sc(V.mul(n, 2.2)), "x (sign unknown)", "pen", 1); } },
        perp: { t: [0, 0], ov: (o) => { loc(o); o.vout(A0, sc(V.mul(across, acr)), R, "hl", "x = 0: only u sin θ left", 1);
          o.vout(B0, sc(vB), R, "pen", "y", 1); } },
        range: { t: [0, 0], ov: (o) => { loc(o); o.vout(A0, sc(V.mul(across, acr)), R, "hl", "u sin θ", 1); o.vout(B0, sc(vB), R, "pen", "y", 1); } },
        sub: { t: [0, 0], ov: (o) => { loc(o); afterArrows(o, 0, "u sin θ", "½u cos θ"); } },
        ke: { t: [0, 0], ov: (o) => { loc(o); afterArrows(o, 0, "u sin θ (KE kept)", "½u cos θ"); } },
        speeds: { t: [0, T2], ov: (o, t) => { afterArrows(o, t, `u/√5`, `u/√5`); } },
        after: { t: [T2, T2], ov: (o, t) => { loc(o); afterArrows(o, t, `u/√5`, `u/√5`);
          o.line(A0, V.add(A0, V.mul(across, 3)), "hl", 1.2, 4); rightAngle(o, A0, n, across); } },
      },
    };
  };
})();
