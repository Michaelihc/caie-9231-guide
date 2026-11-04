# Built guide page -> plain text. KaTeX -> $tex$ ($$..$$ display), every panel/branch included,
# clips and widgets noted. Usage: python3 -I page2text.py dist/<page>.html
import sys
from html.parser import HTMLParser

BLOCK = {"p", "li", "h1", "h2", "h3", "summary", "div", "section", "ol", "ul", "header", "details"}

class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.out = []; s.k = 0; s.disp = False; s.ann = False; s.tex = ""; s.skip = 0; s.inmain = False
    def handle_starttag(s, t, a):
        a = dict(a); cls = a.get("class", "") or ""
        if t == "main": s.inmain = True
        if not s.inmain: return
        if s.k:
            s.k += 1
            if t == "annotation": s.ann = True
            return
        if t == "span" and "katex-display" in cls.split(): s.disp = True; return
        if t == "span" and "katex" in cls.split(): s.k = 1; s.tex = ""; return
        if t == "nav": s.skip += 1
        if s.skip: return
        if t == "video": s.out.append(f" [video clip: {a.get('src','').split('/')[-1]}] ")
        if t == "div" and "try" in cls.split(): s.out.append(f"\n[interactive widget: {a.get('data-widget')}]")
        if t == "summary": s.out.append("\n[branch] ")
        elif t == "li": s.out.append("\n- ")
        elif t in BLOCK: s.out.append("\n")
    def handle_endtag(s, t):
        if s.k:
            if t == "annotation": s.ann = False
            s.k -= 1
            if s.k == 0:
                s.out.append(("\n$$" + s.tex + "$$\n") if s.disp else ("$" + s.tex + "$")); s.disp = False
            return
        if t == "nav" and s.skip: s.skip -= 1
    def handle_data(s, d):
        if not s.inmain: return
        if s.k:
            if s.ann: s.tex += d
            return
        if not s.skip: s.out.append(d)

p = P(); p.feed(open(sys.argv[1], encoding="utf8").read())
import re
txt = re.sub(r"[ \t]+\n", "\n", "".join(p.out)); txt = re.sub(r"\n\s*\n+", "\n", txt)
print(txt)
