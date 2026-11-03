"""FP1 vectors derivation clips. Render all:

    .venv/bin/manim -qm manim/vectors.py PointPlane PointLine SkewLines
then scripts/manim_export.sh copies mp4 + poster into guide/assets/media/fp1/.
"""
from manim import *

INK = "#1b2331"   # board background (= guide ink colour)
HL = "#ffe14d"    # highlighter: the thing that answers the question
PEN = "#8fb0ff"   # lines, planes
FG = "#e4e8ee"
MUTED = "#9aa5b4"
config.background_color = INK


def steps(*tex, scale=0.62):
    g = VGroup(*[MathTex(t, color=FG).scale(scale) for t in tex])
    g.arrange(DOWN, aligned_edge=LEFT, buff=0.32)
    return g


class PointPlane(ThreeDScene):
    """Distance point -> plane: walk from Q along n until you hit the plane."""

    def construct(self):
        self.set_camera_orientation(phi=66 * DEGREES, theta=-52 * DEGREES, zoom=0.95)
        plane = Square(side_length=5.2, fill_color=PEN, fill_opacity=0.22, stroke_color=PEN, stroke_width=1.5)
        Q = np.array([0.9, 0.7, 2.6])
        N = np.array([0.9, 0.7, 0.0])
        q_dot = Dot3D(Q, color=FG, radius=0.08)
        q_lab = MathTex("Q", color=FG).scale(0.8).move_to(Q + np.array([0.0, 0.0, 0.42]))
        n_arrow = Arrow3D(np.array([-1.6, -1.4, 0]), np.array([-1.6, -1.4, 1.4]), color=PEN)
        n_lab = MathTex(r"\mathbf n", color=PEN).scale(0.8).move_to(np.array([-1.6, -1.4, 1.75]))
        p_lab = MathTex(r"\mathbf r\cdot\mathbf n=p", color=PEN).scale(0.7).move_to(np.array([1.9, -2.1, 0.0]))
        self.add_fixed_orientation_mobjects(q_lab, n_lab, p_lab)

        t = ValueTracker(0.001)
        walker = always_redraw(lambda: Dot3D(Q - np.array([0, 0, t.get_value()]), color=HL, radius=0.07))
        trail = always_redraw(lambda: Line(Q, Q - np.array([0, 0, t.get_value()]), color=HL, stroke_width=5))

        s = steps(
            r"\text{walk from }Q\text{ along }\mathbf n:\ \ \mathbf r=\mathbf q+t\,\mathbf n",
            r"\text{hit plane: }\ (\mathbf q+t\,\mathbf n)\cdot\mathbf n=p",
            r"t=\frac{p-\mathbf q\cdot\mathbf n}{|\mathbf n|^2}",
            r"d=|t|\,|\mathbf n|",
        ).to_corner(UL, buff=0.4)

        self.play(Create(plane), FadeIn(n_arrow), FadeIn(n_lab), FadeIn(p_lab), run_time=1.2)
        self.play(FadeIn(q_dot), FadeIn(q_lab))
        self.add_fixed_in_frame_mobjects(s[0]); self.play(Write(s[0]))
        self.add(trail, walker)
        self.play(t.animate.set_value(2.6), run_time=2, rate_func=smooth)
        foot_lab = MathTex("N", color=HL).scale(0.8).move_to(N + np.array([0.35, 0.0, 0.25]))
        self.add_fixed_orientation_mobjects(foot_lab)
        self.play(FadeIn(foot_lab))
        for k in (1, 2, 3):
            self.add_fixed_in_frame_mobjects(s[k]); self.play(Write(s[k]), run_time=1.1)
        box = SurroundingRectangle(s[3], color=HL, buff=0.1)
        self.add_fixed_in_frame_mobjects(box); self.play(Create(box))
        self.wait(1.5)


class PointLine(Scene):
    """Distance point -> line: parallelogram area two ways."""

    def construct(self):
        A = np.array([-1.0, -2.8, 0])
        b = np.array([3.2, 0.6, 0])
        AQ = np.array([1.0, 2.3, 0])
        Q = A + AQ
        u = b / np.linalg.norm(b)
        foot = A + np.dot(AQ, u) * u
        line = Line(A - 0.9 * b, A + 1.9 * b, color=PEN, stroke_width=3)
        a_dot, q_dot = Dot(A, color=FG), Dot(Q, color=FG)
        a_lab = MathTex("A", color=FG).scale(0.8).next_to(A, DOWN + LEFT, buff=0.12)
        q_lab = MathTex("Q", color=FG).scale(0.8).next_to(Q, UP + LEFT, buff=0.12)
        b_arr = Arrow(A, A + b, buff=0, color=PEN, stroke_width=5)
        b_lab = MathTex(r"\mathbf b", color=PEN).scale(0.8).next_to(A + 0.6 * b, DOWN, buff=0.15)
        aq_arr = Arrow(A, Q, buff=0, color=FG, stroke_width=4)
        para = Polygon(A, A + b, A + b + AQ, Q, fill_color=PEN, fill_opacity=0.18, stroke_color=PEN, stroke_width=1.5)
        h = DashedLine(Q, foot, color=HL, stroke_width=5)
        d_lab = MathTex("d", color=HL).scale(0.85).next_to(h, LEFT, buff=0.12)

        s = steps(
            r"\text{parallelogram on }\overrightarrow{AQ},\ \mathbf b",
            r"\text{area}=|\overrightarrow{AQ}\times\mathbf b|",
            r"\text{area}=\text{base}\times\text{height}=|\mathbf b|\,d",
            r"d=\frac{|\overrightarrow{AQ}\times\mathbf b|}{|\mathbf b|}",
            scale=0.7,
        ).to_corner(UL, buff=0.45)

        self.play(Create(line), FadeIn(a_dot, a_lab, q_dot, q_lab))
        self.play(GrowArrow(b_arr), FadeIn(b_lab), GrowArrow(aq_arr))
        self.play(Write(s[0]), DrawBorderThenFill(para), run_time=1.4)
        self.play(Write(s[1]))
        self.play(Create(h), FadeIn(d_lab))
        self.play(Write(s[2]))
        self.play(Write(s[3]))
        self.play(Create(SurroundingRectangle(s[3], color=HL, buff=0.1)))
        self.wait(1.5)


class SkewLines(ThreeDScene):
    """Skew lines: P + k(b x d) = Q, solve, d = |k||b x d|."""

    def construct(self):
        self.set_camera_orientation(phi=64 * DEGREES, theta=-40 * DEGREES, zoom=0.95)
        a, b = np.array([-1.5, 0, -1.1]), np.array([1.0, 0, 0])
        c, d = np.array([0.5, -2.0, 0.9]), np.array([0.6, 1.0, 0])
        l1 = lambda s: a + s * b
        l2 = lambda s: c + s * d
        line1 = Line(l1(1.0), l1(6.0), color=PEN, stroke_width=4)
        line2 = Line(l2(0.3), l2(4.6), color=PEN, stroke_width=4)
        lab1 = MathTex("l_1", color=PEN).scale(0.8).move_to(l1(6.3) + np.array([0, 0, 0.3]))
        lab2 = MathTex("l_2", color=PEN).scale(0.8).move_to(l2(4.9) + np.array([0, 0, 0.3]))
        self.add_fixed_orientation_mobjects(lab1, lab2)

        lam, mu = ValueTracker(1.6), ValueTracker(0.8)
        P = lambda: l1(lam.get_value())
        Qp = lambda: l2(mu.get_value())
        seg = always_redraw(lambda: DashedLine(P(), Qp(), color=FG, stroke_width=3))
        pd = always_redraw(lambda: Dot3D(P(), color=FG, radius=0.07))
        qd = always_redraw(lambda: Dot3D(Qp(), color=FG, radius=0.07))

        s = steps(
            r"P=\mathbf a+\lambda\mathbf b,\quad Q=\mathbf c+\mu\mathbf d",
            r"\text{shortest }PQ\perp\text{ both}\ \Rightarrow\ \overrightarrow{PQ}=k(\mathbf b\times\mathbf d)",
            r"\mathbf a+\lambda\mathbf b+k(\mathbf b\times\mathbf d)=\mathbf c+\mu\mathbf d",
            r"3\text{ eqns}\to\lambda,\mu,k\qquad d=|k|\,|\mathbf b\times\mathbf d|",
        ).to_corner(UL, buff=0.4)

        self.play(Create(line1), Create(line2), FadeIn(lab1, lab2), run_time=1.2)
        self.add(seg, pd, qd)
        self.add_fixed_in_frame_mobjects(s[0]); self.play(Write(s[0]))
        # slide P and Q around: PQ length changes
        self.play(lam.animate.set_value(1.4), mu.animate.set_value(3.6), run_time=1.6)
        self.play(lam.animate.set_value(5.4), mu.animate.set_value(1.0), run_time=1.6)
        self.add_fixed_in_frame_mobjects(s[1]); self.play(Write(s[1]))
        # settle at the common perpendicular (vertical, since b, d horizontal): lambda=3.2, mu=2.0
        self.play(lam.animate.set_value(3.2), mu.animate.set_value(2.0), run_time=1.6)
        best = DashedLine(P(), Qp(), color=HL, stroke_width=6)
        self.remove(seg); self.add(best)
        n_arr = Arrow3D(l1(5.2), l1(5.2) + np.array([0, 0, 1.3]), color=HL)
        n_lab = MathTex(r"\mathbf b\times\mathbf d", color=HL).scale(0.7).move_to(l1(5.2) + np.array([0, 0, 1.7]))
        self.add_fixed_orientation_mobjects(n_lab)
        self.play(FadeIn(n_arr), FadeIn(n_lab), Indicate(best, color=HL))
        for k in (2, 3):
            self.add_fixed_in_frame_mobjects(s[k]); self.play(Write(s[k]), run_time=1.2)
        box = SurroundingRectangle(s[3], color=HL, buff=0.1)
        self.add_fixed_in_frame_mobjects(box); self.play(Create(box))
        self.wait(1.5)
