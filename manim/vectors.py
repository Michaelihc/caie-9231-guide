"""FP1 vectors derivation clips. Steps are word strategies ("set up X + k*normal = Y, solve"),
named in words (point, foot, normal, line direction), not single letters.

    scripts/manim_export.sh fp1 manim/vectors.py PlaneShadow PointPlane PointLine SkewLines
"""
from manim import *

INK = "#1b2331"   # board background (= guide ink colour)
HL = "#ffe14d"    # highlighter: the thing that answers the question
PEN = "#8fb0ff"   # lines, planes
FG = "#e4e8ee"
MUTED_DROP = "#9aa5b4"  # shadow drop lines
config.background_color = INK


def steps(*tex, scale=0.62):
    g = VGroup(*[Tex(f"{i}. " + t, color=FG).scale(scale) for i, t in enumerate(tex, 1)])
    g.arrange(DOWN, aligned_edge=LEFT, buff=0.3)
    return g


def word(t, color=FG, scale=0.62):
    return Tex(t, color=color).scale(scale)


class PointPlane(ThreeDScene):
    """Distance point -> plane: foot + k*normal = point, foot on plane, solve k."""

    def construct(self):
        self.set_camera_orientation(phi=66 * DEGREES, theta=-52 * DEGREES, zoom=0.95)
        plane = Square(side_length=5.2, fill_color=PEN, fill_opacity=0.22, stroke_color=PEN, stroke_width=1.5)
        Q = np.array([0.9, 0.7, 2.6])
        N = np.array([0.9, 0.7, 0.0])
        q_dot = Dot3D(Q, color=FG, radius=0.08)
        q_lab = word("point").move_to(Q + np.array([0.0, 0.0, 0.45]))
        n_base = np.array([-1.6, -1.4, 0])
        n_arrow = Arrow3D(n_base, n_base + np.array([0, 0, 1.4]), color=PEN)
        n_lab = word("normal", PEN).move_to(n_base + np.array([0, 0, 1.8]))
        p_lab = word("plane", PEN).move_to(np.array([1.9, -2.1, 0.0]))
        self.add_fixed_orientation_mobjects(q_lab, n_lab, p_lab)

        s = steps(
            r"find normal of plane",
            r"foot $+\ k\times$normal $=$ point",
            r"foot is on plane $\Rightarrow$ sub into plane equation",
            r"solve for $k$",
            r"distance $=|k|\times|$normal$|$",
        ).to_corner(UL, buff=0.4)

        self.play(Create(plane), FadeIn(p_lab), FadeIn(q_dot), FadeIn(q_lab), run_time=1.2)
        self.add_fixed_in_frame_mobjects(s[0]); self.play(Write(s[0]))
        self.play(GrowFromPoint(n_arrow, n_base), FadeIn(n_lab))
        self.add_fixed_in_frame_mobjects(s[1]); self.play(Write(s[1]))
        # foot unknown: drop from point along normal until it lands on the plane
        t = ValueTracker(0.001)
        walker = always_redraw(lambda: Dot3D(Q - np.array([0, 0, t.get_value()]), color=HL, radius=0.07))
        trail = always_redraw(lambda: Line(Q, Q - np.array([0, 0, t.get_value()]), color=HL, stroke_width=5))
        self.add(trail, walker)
        self.play(t.animate.set_value(2.6), run_time=1.8, rate_func=smooth)
        foot_lab = word("foot", HL).move_to(N + np.array([0.55, 0.0, 0.2]))
        k_lab = word(r"$k\times$normal", HL).move_to((Q + N) / 2 + np.array([0.95, 0.0, 0.0]))
        self.add_fixed_orientation_mobjects(foot_lab, k_lab)
        self.play(FadeIn(foot_lab), FadeIn(k_lab))
        for i in (2, 3, 4):
            self.add_fixed_in_frame_mobjects(s[i]); self.play(Write(s[i]), run_time=1.1)
        box = SurroundingRectangle(s[4], color=HL, buff=0.1)
        self.add_fixed_in_frame_mobjects(box); self.play(Create(box))
        self.wait(1.5)


class PointLine(Scene):
    """Distance point -> line: foot = line point + t*line direction, (point - foot).line direction = 0, solve t."""

    def construct(self):
        A = np.array([-0.6, -2.7, 0])
        b = np.array([3.2, 0.6, 0])
        Q = A + np.array([1.4, 2.6, 0])
        t_foot = np.dot(Q - A, b) / np.dot(b, b)
        line = Line(A - 0.5 * b, A + 1.9 * b, color=PEN, stroke_width=3)
        a_dot = Dot(A, color=PEN)
        a_lab = word("line point", PEN).next_to(A, DOWN, buff=0.2)
        q_dot = Dot(Q, color=FG)
        q_lab = word("point").next_to(Q, UP, buff=0.15)
        b_arr = Arrow(A, A + 0.4 * b, buff=0, color=PEN, stroke_width=5)
        b_lab = word("line direction", PEN).next_to(A + 0.2 * b, UP, buff=0.25)

        s = steps(
            r"foot on line $\Rightarrow$ foot $=$ line point $+\ t\times$line direction",
            r"(point $-$ foot) $\perp$ line direction $\Rightarrow$ dot $=0$",
            r"solve for $t$",
            r"distance $=|$point $-$ foot$|$",
            scale=0.66,
        ).to_corner(UL, buff=0.45)

        self.play(Create(line), FadeIn(a_dot, a_lab, q_dot, q_lab))
        self.play(GrowArrow(b_arr), FadeIn(b_lab))
        self.play(Write(s[0]))
        t = ValueTracker(1.5)
        F = lambda: A + t.get_value() * b
        foot = always_redraw(lambda: Dot(F(), color=HL))
        seg = always_redraw(lambda: DashedLine(Q, F(), color=HL, stroke_width=4))
        self.add(seg, foot)
        self.play(t.animate.set_value(0.25), run_time=1.3)
        self.play(Write(s[1]))
        self.play(t.animate.set_value(t_foot), run_time=1.3)
        foot_lab = word("foot", HL).next_to(F(), DOWN, buff=0.2).shift(0.3 * RIGHT)
        mark = RightAngle(Line(F(), F() + b), Line(F(), Q), length=0.25, color=HL)
        self.play(FadeIn(foot_lab), Create(mark))
        self.play(Write(s[2]))
        self.play(Write(s[3]))
        self.play(Create(SurroundingRectangle(s[3], color=HL, buff=0.1)))
        self.wait(1.5)


class SkewLines(ThreeDScene):
    """Skew lines: point on line 1 + k*normal = point on line 2, solve, distance = |k||normal|."""

    def construct(self):
        self.set_camera_orientation(phi=64 * DEGREES, theta=-40 * DEGREES, zoom=0.95)
        a, b = np.array([-1.5, 0, -1.1]), np.array([1.0, 0, 0])
        c, d = np.array([0.5, -2.0, 0.9]), np.array([0.6, 1.0, 0])
        l1 = lambda s: a + s * b
        l2 = lambda s: c + s * d
        line1 = Line(l1(1.0), l1(6.0), color=PEN, stroke_width=4)
        line2 = Line(l2(0.3), l2(4.6), color=PEN, stroke_width=4)
        lab1 = word("line 1", PEN).move_to(l1(6.2) + np.array([0, 0, -0.35]))
        lab2 = word("line 2", PEN).move_to(l2(4.9) + np.array([0, 0, 0.3]))
        self.add_fixed_orientation_mobjects(lab1, lab2)

        s = steps(
            r"normal $=$ line 1 direction $\times$ line 2 direction",
            r"point on line 1 $+\ k\times$normal $=$ point on line 2",
            r"each point has own parameter $\Rightarrow$ 3 eqns, 3 unknowns",
            r"solve; distance $=|k|\times|$normal$|$",
        ).to_corner(UL, buff=0.4)

        self.play(Create(line1), Create(line2), FadeIn(lab1, lab2), run_time=1.2)
        self.add_fixed_in_frame_mobjects(s[0]); self.play(Write(s[0]))
        n_base = l1(5.2)
        n_arr = Arrow3D(n_base, n_base + np.array([0, 0, 1.3]), color=HL)
        n_lab = word("normal", HL).move_to(n_base + np.array([0, 0, 1.7]))
        self.add_fixed_orientation_mobjects(n_lab)
        self.play(GrowFromPoint(n_arr, n_base), FadeIn(n_lab))
        self.add_fixed_in_frame_mobjects(s[1]); self.play(Write(s[1]))

        lam, mu = ValueTracker(1.6), ValueTracker(0.8)
        P = lambda: l1(lam.get_value())
        Qp = lambda: l2(mu.get_value())
        seg = always_redraw(lambda: DashedLine(P(), Qp(), color=FG, stroke_width=3))
        pd = always_redraw(lambda: Dot3D(P(), color=FG, radius=0.07))
        qd = always_redraw(lambda: Dot3D(Qp(), color=FG, radius=0.07))
        self.add(seg, pd, qd)
        # slide both points: only one pair makes the join parallel to normal (lambda=3.2, mu=2.0)
        self.play(lam.animate.set_value(1.4), mu.animate.set_value(3.6), run_time=1.4)
        self.play(lam.animate.set_value(5.4), mu.animate.set_value(1.0), run_time=1.4)
        self.add_fixed_in_frame_mobjects(s[2]); self.play(Write(s[2]))
        self.play(lam.animate.set_value(3.2), mu.animate.set_value(2.0), run_time=1.4)
        best = DashedLine(P(), Qp(), color=HL, stroke_width=6)
        k_lab = word(r"$k\times$normal", HL).move_to((P() + Qp()) / 2 + np.array([-1.7, 0, 0]))
        self.add_fixed_orientation_mobjects(k_lab)
        self.remove(seg); self.add(best)
        self.play(Indicate(best, color=HL), FadeIn(k_lab))
        self.add_fixed_in_frame_mobjects(s[3]); self.play(Write(s[3]), run_time=1.2)
        box = SurroundingRectangle(s[3], color=HL, buff=0.1)
        self.add_fixed_in_frame_mobjects(box); self.play(Create(box))
        self.wait(1.5)


class PlaneShadow(ThreeDScene):
    """Plane r.n = p: every point in plane casts same-length shadow on normal line; off plane => different."""

    def construct(self):
        self.set_camera_orientation(phi=78 * DEGREES, theta=-60 * DEGREES, zoom=0.8)
        Z0 = -0.8                                  # plane height
        O = np.array([0.0, 0.0, -3.0])             # origin well below the plane
        plane = Square(side_length=5.2, fill_color=PEN, fill_opacity=0.2, stroke_color=PEN,
                       stroke_width=1.5).shift(Z0 * OUT)
        p_lab = word("plane", PEN).move_to(np.array([2.9, 2.4, Z0 + 0.3]))
        o_dot = Dot3D(O, color=FG, radius=0.07)
        o_lab = word("origin").move_to(O + np.array([0.0, 0.0, -0.45]))
        n_line = DashedLine(O + np.array([0, 0, -0.5]), np.array([0, 0, Z0 + 2.1]), color=PEN, stroke_width=2)
        nl_lab = word("normal line", PEN).move_to(np.array([-1.35, 0, Z0 + 1.95]))
        nb = np.array([-1.9, -1.9, Z0])
        n_arr = Arrow3D(nb, nb + np.array([0, 0, 1.2]), color=PEN)
        n_lab = word("normal", PEN).move_to(nb + np.array([0, 0, 1.55]))
        self.add_fixed_orientation_mobjects(p_lab, o_lab, nl_lab, n_lab)

        s = steps(
            r"arrow from origin to a point in plane",
            r"its shadow on the normal line",
            r"slide point around plane: shadow stays same",
            r"point $\cdot$ normal $=$ same number every time $=p$",
            r"point off plane $\Rightarrow$ different number",
        ).to_corner(UL, buff=0.4)

        ang, lift = ValueTracker(0.0), ValueTracker(0.0)
        P = lambda: np.array([0.9 + 1.5 * np.cos(ang.get_value()), 0.5 + 1.5 * np.sin(ang.get_value()), Z0 + lift.get_value()])
        S = lambda: np.array([0.0, 0.0, Z0 + lift.get_value()])   # top of shadow: same height as point
        pos = always_redraw(lambda: Line(O, P(), color=FG, stroke_width=4))
        pdot = always_redraw(lambda: Dot3D(P(), color=FG, radius=0.08))
        drop = always_redraw(lambda: DashedLine(P(), S(), color=MUTED_DROP, stroke_width=3))
        shadow = always_redraw(lambda: Line(O, S(), color=HL, stroke_width=9))

        self.play(Create(plane), FadeIn(p_lab), FadeIn(o_dot, o_lab), run_time=1.2)
        self.play(Create(n_line), FadeIn(nl_lab), GrowFromPoint(n_arr, nb), FadeIn(n_lab))
        self.add_fixed_in_frame_mobjects(s[0]); self.play(Write(s[0]))
        self.play(Create(pos), FadeIn(pdot))
        self.add(pos, pdot)
        self.add_fixed_in_frame_mobjects(s[1]); self.play(Write(s[1]))
        self.play(Create(drop), Create(shadow))
        self.add(drop, shadow)
        sh_lab = word("shadow", HL).move_to(O + np.array([-1.0, 0, 1.0]))
        self.add_fixed_orientation_mobjects(sh_lab)
        self.play(FadeIn(sh_lab))
        self.add_fixed_in_frame_mobjects(s[2]); self.play(Write(s[2]))
        self.play(ang.animate.set_value(2 * PI), run_time=4, rate_func=linear)
        self.add_fixed_in_frame_mobjects(s[3]); self.play(Write(s[3]), run_time=1.2)
        box = SurroundingRectangle(s[3], color=HL, buff=0.1)
        self.add_fixed_in_frame_mobjects(box); self.play(Create(box))
        self.add_fixed_in_frame_mobjects(s[4]); self.play(Write(s[4]))
        self.play(lift.animate.set_value(1.3), run_time=1.4)
        self.wait(0.6)
        self.play(lift.animate.set_value(0.0), run_time=1.2)
        self.wait(1.2)


# ---------------------------------------------------------------------------------------------
# Picture clips for Word equation panels: what each dot / cross formula means (shadow, area).
# ---------------------------------------------------------------------------------------------

def readout(label, tracker_fn, color=HL, scale=0.62, places=1):
    """'label = <number>' that follows tracker_fn()."""
    lab = Tex(label, color=color).scale(scale)
    num = DecimalNumber(tracker_fn(), num_decimal_places=places, color=color).scale(scale)
    num.add_updater(lambda m: m.set_value(tracker_fn()))
    num.add_updater(lambda m: m.next_to(lab, RIGHT, buff=0.15))
    return VGroup(lab, num)


class DotShadow(Scene):
    """F1: dot = length of arrow 1 x shadow of arrow 2 on it."""

    def construct(self):
        O = np.array([-0.8, -2.0, 0])
        L1, L2 = 4.0, 3.0
        a1 = Arrow(O, O + L1 * RIGHT, buff=0, color=PEN, stroke_width=6)
        a1_lab = word("arrow 1", PEN).next_to(O + L1 * RIGHT, DOWN, buff=0.25)
        th = ValueTracker(55 * DEGREES)
        tip = lambda: O + L2 * np.array([np.cos(th.get_value()), np.sin(th.get_value()), 0])
        foot = lambda: O + L2 * np.cos(th.get_value()) * RIGHT
        a2 = always_redraw(lambda: Arrow(O, tip(), buff=0, color=FG, stroke_width=5))
        a2_lab = always_redraw(lambda: word("arrow 2").next_to(tip(), UP, buff=0.15))
        drop = always_redraw(lambda: DashedLine(tip(), foot(), color=MUTED_DROP, stroke_width=3))
        shadow = always_redraw(lambda: Line(O, foot() + 0.0001 * RIGHT, color=HL, stroke_width=10))
        sh_lab = always_redraw(lambda: word("shadow", HL).next_to(Line(O, foot() + 0.0001 * RIGHT), DOWN, buff=0.2))

        s = steps(
            r"shine light straight down onto arrow 1",
            r"arrow 2 casts a shadow on it",
            r"dot $=$ length of arrow 1 $\times$ shadow",
            r"under $90^\circ$ $\Rightarrow +$, at $90^\circ \Rightarrow 0$, over $90^\circ \Rightarrow -$",
            scale=0.66,
        ).to_corner(UL, buff=0.45)
        dot_val = readout(r"dot $=$", lambda: L1 * L2 * np.cos(th.get_value())).to_corner(UR, buff=0.6).shift(LEFT * 0.6)

        self.play(GrowArrow(a1), FadeIn(a1_lab))
        self.add(a2, a2_lab)
        self.play(Write(s[0]))
        self.play(Write(s[1]), Create(drop), Create(shadow), FadeIn(sh_lab))
        self.add(drop, shadow, sh_lab)
        self.play(Write(s[2]), FadeIn(dot_val))
        self.play(Write(s[3]))
        self.play(th.animate.set_value(90 * DEGREES), run_time=1.8)
        self.wait(0.6)
        self.play(th.animate.set_value(140 * DEGREES), run_time=1.8)
        self.wait(0.6)
        self.play(th.animate.set_value(30 * DEGREES), run_time=2.2)
        self.play(Create(SurroundingRectangle(s[2], color=HL, buff=0.1)))
        self.wait(1.2)


class CrossArea(ThreeDScene):
    """F2: cross sticks straight out of both arrows; its length = parallelogram area."""

    def construct(self):
        self.set_camera_orientation(phi=65 * DEGREES, theta=-55 * DEGREES, zoom=0.9)
        O = np.array([-0.3, -0.6, -1.7])
        L1, L2, K = 3.0, 2.4, 0.33            # K: cross drawn at K x true length to fit frame
        th = ValueTracker(70 * DEGREES)
        u = np.array([1.0, 0, 0])
        v = lambda: np.array([np.cos(th.get_value()), np.sin(th.get_value()), 0])
        area = lambda: L1 * L2 * np.sin(th.get_value())
        a1 = Arrow3D(O, O + L1 * u, color=PEN)
        a2 = always_redraw(lambda: Arrow3D(O, O + L2 * v(), color=FG))
        para = always_redraw(lambda: Polygon(O, O + L1 * u, O + L1 * u + L2 * v(), O + L2 * v(),
                                             fill_color=PEN, fill_opacity=0.25, stroke_color=PEN, stroke_width=1.5))
        cross = always_redraw(lambda: Arrow3D(O, O + np.array([0, 0, max(K * area(), 0.02)]), color=HL))
        l1 = word("arrow 1", PEN).move_to(O + L1 * u + np.array([0.3, -0.45, 0]))
        l2 = word("arrow 2").move_to(O + np.array([-0.6, 2.2, 0]))
        lc = word("cross", HL).move_to(O + np.array([-0.55, 0, 2.2]))
        self.add_fixed_orientation_mobjects(l1, l2, lc)

        s = steps(
            r"parallelogram on the two arrows",
            r"cross points straight out, $\perp$ both",
            r"length of cross $=$ area of parallelogram",
            r"arrows parallel $\Rightarrow$ flat $\Rightarrow$ cross $=0$",
        ).to_corner(UL, buff=0.4)

        self.play(FadeIn(a1), FadeIn(l1)); self.add(a2); self.play(FadeIn(l2))
        self.add_fixed_in_frame_mobjects(s[0]); self.play(Write(s[0]), FadeIn(para)); self.add(para)
        self.add_fixed_in_frame_mobjects(s[1]); self.play(Write(s[1])); self.add(cross); self.play(FadeIn(lc))
        self.add_fixed_in_frame_mobjects(s[2]); self.play(Write(s[2]))
        self.play(th.animate.set_value(115 * DEGREES), run_time=1.8)
        self.add_fixed_in_frame_mobjects(s[3]); self.play(Write(s[3]))
        self.play(th.animate.set_value(6 * DEGREES), run_time=2.2)
        self.wait(0.6)
        self.play(th.animate.set_value(70 * DEGREES), run_time=1.6)
        box = SurroundingRectangle(s[2], color=HL, buff=0.1)
        self.add_fixed_in_frame_mobjects(box); self.play(Create(box))
        self.wait(1.2)


class PointPlaneShadow(ThreeDScene):
    """F4: distance = point's shadow - plane's shadow, both on the normal line."""

    def construct(self):
        self.set_camera_orientation(phi=78 * DEGREES, theta=-60 * DEGREES, zoom=0.8)
        Z0 = -1.2
        O = np.array([0.0, 0.0, -3.2])
        plane = Square(side_length=5.0, fill_color=PEN, fill_opacity=0.2, stroke_color=PEN, stroke_width=1.5).shift(Z0 * OUT)
        p_lab = word("plane", PEN).move_to(np.array([2.8, 2.3, Z0 + 0.3]))
        o_dot = Dot3D(O, color=FG, radius=0.07)
        o_lab = word("origin").move_to(O + np.array([0, 0, -0.45]))
        n_line = DashedLine(O + np.array([0, 0, -0.4]), np.array([0, 0, 1.6]), color=PEN, stroke_width=2)
        nl_lab = word("normal line", PEN).move_to(np.array([-1.35, 0, 1.45]))
        self.add_fixed_orientation_mobjects(p_lab, o_lab, nl_lab)

        h = ValueTracker(1.4)                 # point height above plane
        sx = ValueTracker(2.2)                # point sideways position (stays right of normal line)
        Q = lambda: np.array([sx.get_value(), 0.6, Z0 + h.get_value()])
        off = np.array([0.14, 0, 0])          # draw the two shadows side by side
        plane_sh = Line(O - off, np.array([0, 0, Z0]) - off, color=PEN, stroke_width=9)
        pt_sh = always_redraw(lambda: Line(O + off, np.array([0, 0, Q()[2]]) + off, color=FG, stroke_width=9))
        diff = always_redraw(lambda: Line(np.array([0, 0, Z0]) + 3 * off, np.array([0, 0, Q()[2]]) + 3 * off, color=HL, stroke_width=11))
        q_dot = always_redraw(lambda: Dot3D(Q(), color=FG, radius=0.08))
        q_drop = always_redraw(lambda: DashedLine(Q(), np.array([0, 0, Q()[2]]), color=MUTED_DROP, stroke_width=3))
        gap = always_redraw(lambda: DashedLine(Q(), np.array([Q()[0], Q()[1], Z0]), color=HL, stroke_width=4))

        s = steps(
            r"plane's shadow on normal line: same for every point in plane",
            r"point's shadow on normal line",
            r"distance $=$ difference of the two shadows",
            r"point$\cdot$normal $-\,p = |$normal$|\times$difference $\Rightarrow \div|$normal$|$",
        ).to_corner(UL, buff=0.4)

        self.play(Create(plane), FadeIn(p_lab, o_dot, o_lab), Create(n_line), FadeIn(nl_lab), run_time=1.2)
        self.add_fixed_in_frame_mobjects(s[0]); self.play(Write(s[0]), Create(plane_sh))
        lp = word("plane's shadow", PEN).move_to(O + np.array([1.7, 0, 0.6]))
        self.add_fixed_orientation_mobjects(lp); self.play(FadeIn(lp))
        self.add(q_dot, q_drop)
        self.add_fixed_in_frame_mobjects(s[1]); self.play(Write(s[1]), FadeIn(q_dot), Create(pt_sh)); self.add(pt_sh)
        lq = word("point", FG).move_to(Q() + np.array([0, 0, 0.4]))
        self.add_fixed_orientation_mobjects(lq); self.play(FadeIn(lq))
        self.add_fixed_in_frame_mobjects(s[2]); self.play(Write(s[2]), Create(diff), Create(gap)); self.add(diff, gap)
        self.play(FadeOut(lq))
        self.play(sx.animate.set_value(1.0), run_time=1.6)       # slide sideways: same distance
        self.play(h.animate.set_value(2.3), run_time=1.4)        # lift: bigger distance
        self.play(h.animate.set_value(1.4), sx.animate.set_value(2.2), run_time=1.4)
        self.add_fixed_in_frame_mobjects(s[3]); self.play(Write(s[3]), run_time=1.3)
        box = SurroundingRectangle(s[2], color=HL, buff=0.1)
        self.add_fixed_in_frame_mobjects(box); self.play(Create(box))
        self.wait(1.3)


class PointLineArea(Scene):
    """F5: parallelogram area two ways; slide the line point, area stays same."""

    def construct(self):
        b = np.array([2.6, 0.5, 0])
        A0 = np.array([-0.8, -2.7, 0])
        Q = np.array([1.6, -0.3, 0])
        u = b / np.linalg.norm(b)
        line = Line(A0 - 0.9 * b, A0 + 2.4 * b, color=PEN, stroke_width=3)
        t = ValueTracker(0.0)
        A = lambda: A0 + t.get_value() * b
        para = always_redraw(lambda: Polygon(A(), A() + b, Q + b, Q, fill_color=PEN, fill_opacity=0.22, stroke_color=PEN, stroke_width=1.5))
        aq = always_redraw(lambda: Arrow(A(), Q, buff=0, color=FG, stroke_width=4))
        dirr = always_redraw(lambda: Arrow(A(), A() + b, buff=0, color=PEN, stroke_width=6))
        a_dot = always_redraw(lambda: Dot(A(), color=PEN))
        a_lab = always_redraw(lambda: word("line point", PEN).next_to(A(), DOWN, buff=0.2))
        d_lab = always_redraw(lambda: word("line direction", PEN).next_to(A() + 0.75 * b, DOWN, buff=0.2))
        foot = A0 + np.dot(Q - A0, u) * u
        height = DashedLine(Q, foot, color=HL, stroke_width=5)
        h_lab = word("distance", HL).next_to(height, RIGHT, buff=0.15)
        q_dot = Dot(Q, color=FG)
        q_lab = word("point").next_to(Q, UP, buff=0.15)

        s = steps(
            r"parallelogram on (line point $\to$ point) and line direction",
            r"area $=|$cross$|$",
            r"area $=$ base $\times$ height $=|$line direction$|\times$distance",
            r"distance $=|$cross$|\div|$line direction$|$",
            scale=0.64,
        ).to_corner(UL, buff=0.45)

        self.play(Create(line), FadeIn(q_dot, q_lab))
        self.add(a_dot, a_lab, dirr, d_lab, aq)
        self.play(Write(s[0]), FadeIn(para)); self.add(para)
        self.play(Write(s[1]))
        self.play(Write(s[2]), Create(height), FadeIn(h_lab))
        self.play(t.animate.set_value(0.9), run_time=1.6)     # slide line point: shape changes,
        self.play(t.animate.set_value(-0.5), run_time=1.6)    # base and height (so area) do not
        self.play(t.animate.set_value(0.0), run_time=1.0)
        self.play(Write(s[3]))
        self.play(Create(SurroundingRectangle(s[3], color=HL, buff=0.1)))
        self.wait(1.3)


class SkewShadow(ThreeDScene):
    """F6: shadow of any join on the common normal = distance; never changes as you slide."""

    def construct(self):
        self.set_camera_orientation(phi=72 * DEGREES, theta=-40 * DEGREES, zoom=0.9)
        a, b = np.array([-1.5, 0, -1.3]), np.array([1.0, 0, 0])
        c, d = np.array([0.5, -2.0, 0.7]), np.array([0.6, 1.0, 0])
        l1 = lambda s: a + s * b
        l2 = lambda s: c + s * d
        line1 = Line(l1(0.6), l1(6.0), color=PEN, stroke_width=4)
        line2 = Line(l2(0.0), l2(4.6), color=PEN, stroke_width=4)
        lab1 = word("line 1", PEN).move_to(l1(6.3) + np.array([0, 0, -0.35]))
        lab2 = word("line 2", PEN).move_to(l2(4.9) + np.array([0, 0, 0.3]))
        nb = l1(5.4)
        n_arr = Arrow3D(nb, nb + np.array([0, 0, 1.1]), color=PEN)
        n_lab = word("normal", PEN).move_to(nb + np.array([0.0, 0, 1.45]))
        self.add_fixed_orientation_mobjects(lab1, lab2, n_lab)

        lam, mu = ValueTracker(1.6), ValueTracker(3.6)
        P = lambda: l1(lam.get_value())
        Q = lambda: l2(mu.get_value())
        join = always_redraw(lambda: Line(P(), Q(), color=FG, stroke_width=4))
        pd = always_redraw(lambda: Dot3D(P(), color=FG, radius=0.07))
        qd = always_redraw(lambda: Dot3D(Q(), color=FG, radius=0.07))
        top = lambda: np.array([P()[0], P()[1], Q()[2]])
        shadow = always_redraw(lambda: Line(P(), top(), color=HL, stroke_width=9))
        drop = always_redraw(lambda: DashedLine(Q(), top(), color=MUTED_DROP, stroke_width=3))

        s = steps(
            r"common normal $=$ line 1 direction $\times$ line 2 direction",
            r"join any point on line 1 to any point on line 2",
            r"shadow of join on normal: same however you slide",
            r"distance $=$ shadow $=|$join$\cdot$normal$|\div|$normal$|$",
        ).to_corner(UL, buff=0.4)

        self.play(Create(line1), Create(line2), FadeIn(lab1, lab2), run_time=1.2)
        self.add_fixed_in_frame_mobjects(s[0]); self.play(Write(s[0]), GrowFromPoint(n_arr, nb), FadeIn(n_lab))
        self.add_fixed_in_frame_mobjects(s[1]); self.play(Write(s[1])); self.add(join, pd, qd); self.play(Create(join))
        self.add_fixed_in_frame_mobjects(s[2]); self.play(Write(s[2])); self.add(shadow, drop); self.play(Create(shadow))
        sl = word("shadow", HL).move_to(P() + np.array([-0.75, 0, 1.0]))
        self.add_fixed_orientation_mobjects(sl); self.play(FadeIn(sl)); self.play(FadeOut(sl))
        self.play(lam.animate.set_value(4.8), mu.animate.set_value(0.8), run_time=1.8)
        self.play(lam.animate.set_value(2.6), mu.animate.set_value(2.4), run_time=1.6)
        self.add_fixed_in_frame_mobjects(s[3]); self.play(Write(s[3]), run_time=1.2)
        box = SurroundingRectangle(s[3], color=HL, buff=0.1)
        self.add_fixed_in_frame_mobjects(box); self.play(Create(box))
        self.wait(1.3)


class LinePlaneAngle(Scene):
    """F7: side view. Angle to plane = 90 deg - angle to normal => sin."""

    def construct(self):
        P = np.array([0.6, -2.3, 0])
        plane = Line(P + 4.2 * LEFT, P + 4.4 * RIGHT, color=PEN, stroke_width=6)
        p_lab = word("plane (side view)", PEN).next_to(P + 3.4 * RIGHT, DOWN, buff=0.25)
        normal = Arrow(P, P + 3.2 * UP, buff=0, color=PEN, stroke_width=5)
        n_lab = word("plane normal", PEN).next_to(P + 3.2 * UP, UP, buff=0.15)
        th = ValueTracker(35 * DEGREES)        # angle to plane
        tip = lambda: P + 3.6 * np.array([np.cos(th.get_value()), np.sin(th.get_value()), 0])
        ld = always_redraw(lambda: Arrow(P, tip(), buff=0, color=FG, stroke_width=5))
        ld_lab = always_redraw(lambda: word("line direction").next_to(tip(), RIGHT, buff=0.15))
        to_plane = always_redraw(lambda: Angle(Line(P, P + RIGHT), Line(P, tip()), radius=1.0, color=HL, stroke_width=5))
        to_normal = always_redraw(lambda: Angle(Line(P, tip()), Line(P, P + UP), radius=1.45, color=FG, stroke_width=3))
        tp_lab = always_redraw(lambda: word("angle to plane", HL).next_to(P + 1.05 * RIGHT, UP, buff=0.05).shift(0.95 * RIGHT))
        tn_lab = word("angle to normal").next_to(P + 1.7 * UP, LEFT, buff=0.25)

        s = steps(
            r"dot with plane normal gives angle to normal",
            r"plane is $90^\circ$ off normal",
            r"angle to plane $=90^\circ-$ angle to normal",
            r"so $\sin$(angle to plane) $=\cos$(angle to normal)",
            scale=0.64,
        ).to_corner(UL, buff=0.45)

        self.play(Create(plane), FadeIn(p_lab), GrowArrow(normal), FadeIn(n_lab))
        self.add(ld, ld_lab); self.play(FadeIn(ld))
        self.play(Write(s[0]), Create(to_normal), FadeIn(tn_lab)); self.add(to_normal, tn_lab)
        self.play(Write(s[1]), Indicate(normal, color=PEN))
        self.play(Write(s[2]), Create(to_plane), FadeIn(tp_lab)); self.add(to_plane, tp_lab)
        self.play(th.animate.set_value(60 * DEGREES), run_time=1.6)
        self.play(th.animate.set_value(25 * DEGREES), run_time=1.6)
        self.play(Write(s[3]))
        self.play(Create(SurroundingRectangle(s[3], color=HL, buff=0.1)))
        self.wait(1.3)


class VolumeShadow(ThreeDScene):
    """F8: cross of 2 base edges = base area, 3rd edge's shadow on it = height."""

    def construct(self):
        self.set_camera_orientation(phi=70 * DEGREES, theta=-50 * DEGREES, zoom=1.15)
        A = np.array([-1.2, -1.2, -2.1])
        e1 = np.array([2.8, 0.0, 0.0])        # base edge 1
        e2 = np.array([0.9, 2.4, 0.0])        # base edge 2
        H = 2.0
        sx = ValueTracker(0.0)
        e3 = lambda: np.array([0.8 + sx.get_value(), 0.6, H])   # 3rd edge, slides but height fixed
        base = Polygon(A, A + e1, A + e1 + e2, A + e2, fill_color=PEN, fill_opacity=0.2, stroke_color=PEN, stroke_width=1.5)
        tet = always_redraw(lambda: VGroup(
            Line(A, A + e1, color=FG), Line(A, A + e2, color=FG), Line(A + e1, A + e2, color=FG),
            Line(A, A + e3(), color=FG, stroke_width=5), Line(A + e1, A + e3(), color=FG), Line(A + e2, A + e3(), color=FG)))
        cb = A + 0.9 * e1 + 0.85 * e2
        cross = Arrow3D(cb, cb + np.array([0, 0, 1.1]), color=PEN)
        c_lab = word("cross", PEN).move_to(cb + np.array([0.0, 0, 1.45]))
        shadow = always_redraw(lambda: Line(A + np.array([e3()[0], e3()[1], 0]), A + e3(), color=HL, stroke_width=9))
        drop = always_redraw(lambda: DashedLine(A + e3(), A + np.array([e3()[0], e3()[1], 0]), color=HL, stroke_width=1))
        b_lab = word("base", PEN).move_to(A + e1 + np.array([0.4, -0.4, 0]))
        e_lab = always_redraw(lambda: word("3rd edge").move_to(A + 0.5 * e3() + np.array([-0.4, -0.4, 0.25])))
        self.add_fixed_orientation_mobjects(c_lab, b_lab)

        s = steps(
            r"cross of 2 base edges: $\perp$ base, length $=$ base parallelogram area",
            r"3rd edge's shadow on cross $=$ height",
            r"dot $=|$cross$|\times$shadow $=$ base area $\times$ height",
            r"tetrahedron $=\frac13\times\frac12$ base $\times$ height $=\frac16|$dot$|$",
        ).to_corner(UL, buff=0.4)

        self.play(FadeIn(base), FadeIn(b_lab)); self.add(tet); self.play(Create(tet))
        self.add_fixed_in_frame_mobjects(s[0]); self.play(Write(s[0]), FadeIn(cross), FadeIn(c_lab))
        self.add_fixed_orientation_mobjects(e_lab); self.add(e_lab)
        self.add_fixed_in_frame_mobjects(s[1]); self.play(Write(s[1])); self.add(shadow); self.play(Create(shadow))
        hl = word("height", HL).move_to(A + np.array([e3()[0], e3()[1], 0]) + np.array([0.0, 0.6, 1.0]))
        self.add_fixed_orientation_mobjects(hl); self.play(FadeIn(hl)); self.play(FadeOut(hl))
        self.add_fixed_in_frame_mobjects(s[2]); self.play(Write(s[2]))
        self.play(sx.animate.set_value(1.4), run_time=1.6)    # slide top: same height, same volume
        self.play(sx.animate.set_value(0.0), run_time=1.4)
        self.add_fixed_in_frame_mobjects(s[3]); self.play(Write(s[3]), run_time=1.3)
        box = SurroundingRectangle(s[3], color=HL, buff=0.1)
        self.add_fixed_in_frame_mobjects(box); self.play(Create(box))
        self.wait(1.3)
