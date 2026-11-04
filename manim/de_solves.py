"""FP2 2.6 "Watch it solved" clips: one typical example per skill, symbols moving line to line.

    scripts/manim_export.sh fp2 manim/de_solves.py SepSolve IFSolve CFPISolve ICSolve SubSolve LargeXSolve

Examples are checked numerically (each solution satisfies its equation and conditions).
"""
from manim import *

INK = "#1b2331"
HL = "#ffe14d"
PEN = "#8fb0ff"
FG = "#e4e8ee"
config.background_color = INK

SLOTS = [1.5, 0.0, -1.5]       # up to 3 lines on screen; older lines scroll off the top


class Solve(Scene):
    title = ""
    steps = []                  # (step in words, line of maths)

    def construct(self):
        head = Tex(self.title, color=PEN).scale(0.62).to_corner(UL, buff=0.4)
        self.add(head)
        label, lines = None, []
        for words, tex in self.steps:
            eq = MathTex(tex, color=FG).scale(0.95)
            if eq.width > 12.6:
                eq.scale_to_fit_width(12.6)
            new_label = Tex(words, color=HL).scale(0.66).to_edge(UP, buff=1.05)
            anims = [FadeIn(new_label) if label is None else FadeTransform(label, new_label)]
            if not lines:
                eq.move_to(UP * SLOTS[0])
                self.play(Write(eq), *anims, run_time=1.2)
            else:
                if len(lines) == len(SLOTS):            # scroll: drop oldest, move rest up
                    self.play(FadeOut(lines[0], shift=UP * 0.6),
                              *[l.animate.move_to([l.get_x(), SLOTS[i], 0]) for i, l in enumerate(lines[1:])],
                              run_time=0.6)
                    lines = lines[1:]
                eq.move_to(UP * SLOTS[len(lines)])
                self.play(TransformMatchingShapes(lines[-1].copy(), eq), lines[-1].animate.set_opacity(0.4),
                          *anims, run_time=1.4)
            lines.append(eq)
            label = new_label
            self.wait(0.7)
        self.play(Create(SurroundingRectangle(lines[-1], color=HL, buff=0.15)))
        self.wait(1.6)


class SepSolve(Solve):
    title = "S1 Separate variables"
    steps = [
        ("start", r"\frac{dy}{dx}=x\,e^{-y}"),
        ("all $y$ with $dy$, all $x$ with $dx$", r"e^{y}\,dy=x\,dx"),
        ("integrate both sides, one $+C$", r"e^{y}=\tfrac12x^{2}+C"),
        ("make $y$ the subject", r"y=\ln\left(\tfrac12x^{2}+C\right)"),
    ]


class IFSolve(Solve):
    title = "S2 Integrating factor"
    steps = [
        ("start", r"x\frac{dy}{dx}+2y=e^{x},\quad y=3\text{ when }x=1"),
        ("divide every term by $x$", r"\frac{dy}{dx}+\frac{2}{x}\,y=\frac{e^{x}}{x}"),
        ("IF $=e^{\int P\,dx}$", r"\text{IF}=e^{\int\frac{2}{x}dx}=e^{2\ln x}=x^{2}"),
        ("multiply every term by IF", r"x^{2}\frac{dy}{dx}+2x\,y=x\,e^{x}"),
        ("left side is one derivative", r"\frac{d}{dx}\left(x^{2}y\right)=x\,e^{x}"),
        ("integrate (by parts), $+C$ now", r"x^{2}y=(x-1)e^{x}+C"),
        ("initial condition: $x=1$, $y=3$", r"3=0+C\ \Rightarrow\ C=3"),
        ("divide by IF", r"y=\frac{(x-1)e^{x}+3}{x^{2}}"),
    ]


class CFPISolve(Solve):
    title = "S3 CF + PI"
    steps = [
        ("start", r"\frac{d^2y}{dx^2}+2\frac{dy}{dx}+5y=10\sin x"),
        ("auxiliary equation", r"m^{2}+2m+5=0"),
        ("roots", r"m=-1\pm2i"),
        ("complex roots $\Rightarrow$ CF", r"y_{\text{CF}}=e^{-x}(A\cos2x+B\sin2x)"),
        ("trial PI: both cos and sin", r"y=\lambda\cos x+\mu\sin x"),
        ("sub into left side, collect", r"(4\lambda+2\mu)\cos x+(4\mu-2\lambda)\sin x=10\sin x"),
        ("compare coefficients", r"4\lambda+2\mu=0,\ \ 4\mu-2\lambda=10\ \Rightarrow\ \lambda=-1,\ \mu=2"),
        ("$y=$ CF $+$ PI", r"y=e^{-x}(A\cos2x+B\sin2x)-\cos x+2\sin x"),
    ]


class ICSolve(Solve):
    title = "S4 Initial conditions"
    steps = [
        ("general solution, $y=0$ and $\\frac{dy}{dx}=0$ when $x=0$", r"y=e^{-x}(A\cos2x+B\sin2x)-\cos x+2\sin x"),
        ("sub $x=0$, $y=0$", r"0=A-1\ \Rightarrow\ A=1"),
        ("differentiate (product rule)", r"\frac{dy}{dx}=e^{-x}\big((2B-A)\cos2x-(2A+B)\sin2x\big)+\sin x+2\cos x"),
        ("sub $x=0$, $\\frac{dy}{dx}=0$", r"0=2B-A+2\ \Rightarrow\ B=-\tfrac12"),
        ("particular solution", r"y=e^{-x}\left(\cos2x-\tfrac12\sin2x\right)-\cos x+2\sin x"),
    ]


class SubSolve(Solve):
    title = r"S5 Substitution $x=e^t$"
    steps = [
        ("start", r"x^{2}\frac{d^2y}{dx^2}-2x\frac{dy}{dx}+2y=0"),
        (r"swap: $x\frac{dy}{dx}\to\frac{dy}{dt}$, $\ x^2\frac{d^2y}{dx^2}\to\frac{d^2y}{dt^2}-\frac{dy}{dt}$",
         r"\left(\frac{d^2y}{dt^2}-\frac{dy}{dt}\right)-2\frac{dy}{dt}+2y=0"),
        ("simplify: constant coefficients", r"\frac{d^2y}{dt^2}-3\frac{dy}{dt}+2y=0"),
        ("auxiliary equation", r"m^{2}-3m+2=0\ \Rightarrow\ m=1,\ 2"),
        ("CF in $t$", r"y=Ae^{t}+Be^{2t}"),
        ("back: $e^{t}=x$", r"y=Ax+Bx^{2}"),
    ]


class LargeXSolve(Solve):
    title = r"S6 Behaviour for large $x$"
    steps = [
        ("particular solution", r"y=e^{-x}\left(\cos2x-\tfrac12\sin2x\right)-\cos x+2\sin x"),
        (r"$e^{-x}\to0$ as $x\to\infty$", r"y\approx2\sin x-\cos x"),
        ("R-formula", r"R=\sqrt{2^{2}+1^{2}}=\sqrt5,\quad \tan\varphi=-\tfrac12"),
        ("large-$x$ answer", r"y\approx\sqrt5\,\sin(x-0.464)"),
    ]
