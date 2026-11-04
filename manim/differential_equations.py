"""FP2 2.6 differential equations picture clips. Words, not letters.

    scripts/manim_export.sh fp2 manim/differential_equations.py RootShapes TransientDies
"""
from manim import *

INK = "#1b2331"
HL = "#ffe14d"
PEN = "#8fb0ff"
FG = "#e4e8ee"
MUTED = "#9aa5b4"
config.background_color = INK


def steps(*tex, scale=0.62):
    g = VGroup(*[Tex(f"{i}. " + t, color=FG).scale(scale) for i, t in enumerate(tex, 1)])
    g.arrange(DOWN, aligned_edge=LEFT, buff=0.28)
    return g


def word(t, color=FG, scale=0.6):
    return Tex(t, color=color).scale(scale)


def readout(label, fn, color=HL, scale=0.6, places=2):
    lab = Tex(label, color=color).scale(scale)
    num = DecimalNumber(fn(), num_decimal_places=places, include_sign=True, color=color).scale(scale)
    num.add_updater(lambda m: m.set_value(fn()))
    num.add_updater(lambda m: m.next_to(lab, RIGHT, buff=0.12))
    return VGroup(lab, num)


def make_axes(xmax, ymax, w=9.0, h=3.6):
    ax = Axes(x_range=[0, xmax, 1], y_range=[-ymax, ymax, 1], x_length=w, y_length=h,
              axis_config={"color": MUTED, "stroke_width": 2, "include_ticks": False},
              tips=False)
    xl = word("$x$", MUTED).next_to(ax.x_axis.get_end(), RIGHT, buff=0.15)
    yl = word("$y$", MUTED).next_to(ax.y_axis.get_end(), UP, buff=0.1)
    return ax, VGroup(xl, yl)


class RootShapes(Scene):
    """F3: complex roots. Imaginary part = wiggle speed, real part = envelope (dies / grows)."""

    def construct(self):
        ax, labs = make_axes(10, 3.0)
        ax.to_edge(DOWN, buff=0.45).shift(0.6 * RIGHT)
        labs = VGroup(word("$x$", MUTED).next_to(ax.x_axis.get_end(), RIGHT, buff=0.15),
                      word("$y$", MUTED).next_to(ax.y_axis.get_end(), UP, buff=0.1))
        re, im = ValueTracker(-0.25), ValueTracker(2.0)
        curve = always_redraw(lambda: ax.plot(lambda x: np.exp(re.get_value() * x) * np.cos(im.get_value() * x),
                                              x_range=[0, 10, 0.01], color=FG, stroke_width=4))
        env_up = always_redraw(lambda: ax.plot(lambda x: np.exp(re.get_value() * x), x_range=[0, 10, 0.05],
                                               color=HL, stroke_width=3))
        env_dn = always_redraw(lambda: ax.plot(lambda x: -np.exp(re.get_value() * x), x_range=[0, 10, 0.05],
                                               color=HL, stroke_width=3))
        env_lab = word("envelope $e^{\\text{real part}\\cdot x}$", HL).move_to(ax.c2p(2.6, 2.6))

        s = steps(
            r"complex roots: real part $\pm$ (imaginary part)$\,i$",
            r"CF $=e^{\text{real part}\cdot x}\times$(cos and sin wave)",
            r"imaginary part sets how fast it wiggles",
            r"real part sets the envelope: below 0 dies, above 0 grows",
        ).to_corner(UL, buff=0.4)
        ro = VGroup(readout(r"real part", lambda: re.get_value()),
                    readout(r"imaginary part", lambda: im.get_value(), color=FG)).arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        ro.to_corner(UR, buff=0.5).shift(LEFT * 0.9)

        self.play(Create(ax), FadeIn(labs))
        self.play(Write(s[0]), FadeIn(ro))
        self.play(Write(s[1]))
        self.add(curve); self.play(Create(curve), run_time=1.5)
        self.play(Write(s[2]))
        self.play(im.animate.set_value(4.0), run_time=1.6)
        self.play(im.animate.set_value(1.5), run_time=1.6)
        self.play(Write(s[3]), Create(env_up), Create(env_dn), FadeIn(env_lab))
        self.add(env_up, env_dn)
        self.play(re.animate.set_value(0.0), run_time=1.8)
        self.play(re.animate.set_value(0.1), run_time=1.6)
        self.wait(0.4)
        self.play(re.animate.set_value(-0.3), run_time=1.8)
        self.play(Create(SurroundingRectangle(s[3], color=HL, buff=0.1)))
        self.wait(1.3)


class TransientDies(Scene):
    """F2: change initial conditions: start of solution changes, end always settles onto PI."""

    def construct(self):
        ax, _ = make_axes(14, 3.0, w=9.6)
        ax.to_edge(DOWN, buff=0.45).shift(0.5 * RIGHT)
        labs = VGroup(word("$x$", MUTED).next_to(ax.x_axis.get_end(), RIGHT, buff=0.15),
                      word("$y$", MUTED).next_to(ax.y_axis.get_end(), UP, buff=0.1))
        pi = lambda x: 1.2 * np.sin(x) - 0.5 * np.cos(x)
        amp = ValueTracker(2.2)
        cf = lambda x: np.exp(-0.4 * x) * amp.get_value() * np.cos(2.5 * x)
        pi_curve = ax.plot(pi, x_range=[0, 14, 0.02], color=PEN, stroke_width=4)
        pi_dash = DashedVMobject(pi_curve, num_dashes=70)
        pi_lab = word("PI", PEN).next_to(ax.c2p(14, pi(14)), RIGHT, buff=0.15)
        sol = always_redraw(lambda: ax.plot(lambda x: pi(x) + cf(x), x_range=[0, 14, 0.01], color=FG, stroke_width=4))
        sol_lab = word("solution $=$ CF $+$ PI").move_to(ax.c2p(3.2, 2.7))

        s = steps(
            r"solution $=$ CF $+$ PI",
            r"CF has $e^{-\text{number}\cdot x}$ $\Rightarrow$ dies out",
            r"change initial conditions: start changes, end does not",
            r"large $x$: $y\approx$ PI",
        ).to_corner(UL, buff=0.4)

        self.play(Create(ax), FadeIn(labs))
        self.play(Write(s[0]), Create(pi_dash), FadeIn(pi_lab))
        self.add(sol); self.play(Create(sol), FadeIn(sol_lab), run_time=1.6)
        self.play(Write(s[1]))
        self.play(FadeOut(sol_lab))
        self.play(Write(s[2]))
        self.play(amp.animate.set_value(-2.4), run_time=1.8)
        self.play(amp.animate.set_value(0.8), run_time=1.6)
        self.play(amp.animate.set_value(2.2), run_time=1.6)
        self.play(Write(s[3]))
        self.play(Create(SurroundingRectangle(s[3], color=HL, buff=0.1)))
        self.wait(1.3)
