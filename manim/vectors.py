"""FP1 vectors derivation clips. Steps are word strategies ("set up X + k*normal = Y, solve"),
named in words (point, foot, normal, line direction), not single letters.

    scripts/manim_export.sh fp1 manim/vectors.py PointPlane PointLine SkewLines
"""
from manim import *

INK = "#1b2331"   # board background (= guide ink colour)
HL = "#ffe14d"    # highlighter: the thing that answers the question
PEN = "#8fb0ff"   # lines, planes
FG = "#e4e8ee"
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
