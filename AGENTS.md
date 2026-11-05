# CAIE 9231 compact revision guide

Goal: most compact revision guide for CAIE A Level Further Maths 9231.
Do FP1 (Paper 1) first, then FP2 (Paper 2). Syllabus: 2020–22 (`resources/syllabus/9231_y20-22_sy.pdf`).
Formula list: MF19 (`resources/syllabus/MF19_list_of_formulae.pdf`).

## Standing rule: no syllabus, no paper ⇒ no add

- Before adding anything (formula, form, skill, branch): check syllabus + past papers.
  - Syllabus: 9231 2020–22 and 2023–25, plus 9709 (assumed knowledge), in `resources/syllabus/`.
  - Papers: grep all qp + ms 2002–2025 (`pdftotext -layout`, `resources/papers/`).
- Not in syllabus **and** never in a paper ⇒ do not add. Remove it if already there.
- Example: cartesian line form $\frac{x-a_1}{b_1}=\dots$ — 0 uses in 558 papers, syllabus only says r = a + tb ⇒ removed.

## Writing style

- Assume A Level Maths (9709): don't teach its calculus, R-formula, etc. Only Further Maths content,
  plus 9709 facts used in a non-obvious way here (e.g. by-parts loop for $e^{ax}\sin bx$).

- Compact phrasing, grug speak. Few words. Drop "the", "a", "you should".
- Simple words. Short lines. Symbols ok: ⇒ ⇔ ∥ ⊥ → ≠.
- Math stays exact. Grug words, not grug math.
- No intros, no motivation, no worked examples, no exam tips.

## Words vs symbols

Pick whichever is clearer for the reader; don't translate for the sake of it. Add new cases here.

- Formula already says it compactly ⇒ keep the symbols, no word paraphrase next to it.
  e.g. S2 (DE): "IF $=e^{\int P\,dx}$" alone. Not "…: integrate $P$, then $e$ to that" (words add nothing, read worse).
- Naming objects in derivations ⇒ words that say what they belong to ("line direction", "plane normal"),
  not single letters. Only the unknown you solve for gets a letter.
- Unclear word ⇒ make the word say more ("direction" → "line direction"). Never a words ↔ letters key/glossary.
- Never define a letter ("$P$ = what multiplies $y$", "$\V n$ = normal"). Either the formula's shape makes it
  self-explanatory ($\frac{dy}{dx}+P\,y=Q$ shows what $P$ and $Q$ are) or write a word equation
  ("normal · (any point in plane) = $p$", "reflection = 2 × foot − point").
- Word equation panel = the one place a formula is said in words (user asked for it). Elsewhere, symbols first.

## Terms

- **Formula** (`F#`): fact or equation.
  - Not in MF19 ⇒ mark ★ (class `nomf`, highlighter). Must memorise.
  - In MF19 ⇒ tag `MF19`. Check the PDF before tagging; MF19 Vectors only has a·b.
  - Every ★ formula gets 2 buttons (built by `guide.js` from panels inside the item):
    - `<div class="word">` **Word equation**: formula said in plain words. Always.
    - `<div class="derive">` **Don't want to memorise**: quick on-the-spot derivation or setup that
      replaces memorising (e.g. point on l1 + k·normal = point on l2, then solve). Be selective: skip it
      when rederiving is slower than recall (cross product components, matrix inverse); say "Learn it" in
      the word panel instead.
    - Write derivations as a word strategy: "find normal of plane; set up foot + k×normal = point;
      solve". Name things in words that say what they belong to (point, foot, plane normal, line point,
      line direction, line 1 direction), not single letters ($Q$, $\V n$, $\V b$). Only the unknown you
      solve for gets a letter ($k$, $t$, $\lambda$).
      - No words ↔ letters key or glossary. That defeats the point. If a word is unclear, make the word
        itself say more. Example: "direction" unclear ⇒ write "line direction", not a key "direction = $\V b$".
    - Dot/cross formulas ⇒ **picture clip** in the word panel: what the formula means as a shadow
      (dot = length × shadow) or area (|cross| = parallelogram area), plus one "Picture: …" line.
      Motif: slide something, the shadow/area stays the same. Setup clips stay in the derive panel.
    - **Try it** (3rd button): interactive JSXGraph widget, `<div class="try" data-widget="name"></div>`.
      Widgets live in `guide/assets/widgets.js` (shared `setup()` = theme colours, word labels, no zoom/pan).
      JSXGraph + widgets.js load only when a Try it opens. Same motif: drag/slide, see what stays the same.
    - Geometric derivations ⇒ manim clip in the derive panel (`manim/<unit>.py`, export with
      `scripts/manim_export.sh <part> manim/<unit>.py Scene…` ⇒ `guide/assets/media/<part>/`).
      Embed: `<video src="{{root}}assets/media/…mp4" poster="…jpg" controls muted loop playsinline preload="none">`.
  - Every formula gets a **Settle** button (auto, `guide.js`): moves it out of the list into a collapsed
    "Settled formulas (n)" box at page bottom (title click = peek). Saved in localStorage key
    `caie9231.settled`, keyed `<part>/<unit>.html#<formula name>` ⇒ renaming a formula unsettles it;
    renumbering doesn't.
- **Skill** (`S#`): compact actionable numbered steps for one standard task.
  - Starts with a trigger line `<p class="trigger"><b>When:</b> …</p>`: what the question looks like
    (equation shape + a real example, or the question's wording) so reader can pick the skill.
  - Can call formulas (list them in `uses`). E.g. solve 1st-order DE ⇒ calls integrating-factor formula.
  - Unit where formulas only serve skills (DE: every formula is a step of some skill) ⇒ no Formulas list at
    all: every formula is a chip; `10-formulas.html` is `<section id="formulas" class="store">` of `inline`
    cards. Keep a Formulas list only when formulas are shared by many skills / looked up alone (vectors).
  - Formula only used inside one skill (e.g. integrating factor) ⇒ don't list it. Write it in place in the step
    as a chip: `<span class="fx" data-f="Fif">IF $=e^{\int P\,dx}$</span>`. Formula card stays in
    `10-formulas.html` with class `inline` and a non-numbered id (`Fif`): hidden from list and index,
    hover chip = formula, tap = card (word/derive buttons) opens under the step.
  - Steps = what to do. Not why.
  - **Watch it solved** button: in-page animation (no video) of one typical example solved step by step.
    Markup after the steps: `<div class="solve"><ol class="solve-steps"><li><span class="w">words</span>$$maths$$</li>…</ol></div>`.
    `guide/assets/solve.js` (loaded on first open) plays it: up to 3 lines, each glyph of the new line flies from
    where the same glyph sat in the previous line, step words on top, Back / Play / Next / Restart, final answer boxed.
    Morph keeps the line's structure: glyphs matched in reading order (LCS) slide as a block; reordered glyphs
    arc in their own lane (left-movers over, right-movers under); leaving glyphs fade first; new glyphs fade in
    last, briefly highlighted.
    Same quantity used more often in the new line ⇒ it visibly splits: extra copies fly out of the one source glyph
    (e.g. $m=-2\pm3i$ ⇒ $\cos3x$ and $\sin3x$, the 3 splits in two). Fewer uses ⇒ extra copies merge into the
    survivor. Only numbers, letters, Greek; never signs or brackets. No quantity may appear from nowhere.
    Smoothness: copies sit on each glyph's exact text box, fonts are preloaded before measuring, label has a fixed
    height, other lines glide; copies cross-fade into the real line (handoff error 0 px, 60 fps). Panels and the
    step list are hidden from first paint (`js` class set in `<head>`).
    Each step `<li data-line="n">` says which on-screen line it writes to. Morph in place on the same line as long
    as possible (∫ signs just appear on the line); a new line only for a genuine side calculation (IF, auxiliary
    equation, finding $C$). Side results flow back into the main line by morphing it again.
    Pick example numbers so no glyph appears from nothing or vanishes: avoid 1 as a coefficient, power or root
    (implicit in the line before, e.g. $m^2+2m+5$ ⇒ $m=-1\pm2i$ makes a 1 appear), avoid ½ from $\int x\,dx$ (use $2x$),
    avoid by-parts results like $(x-1)e^x$; leave a ratio unsimplified if that keeps its digits from the line above.
    Show every step a solver writes (e.g. $\int e^y\,dy=\int x\,dx$ before integrating). Check the example
    numerically first. Only exception to "no worked examples": as an animation, never as static text (the list is
    a no-JS fallback only). Chain related skills on one example where natural (DE: S3 → S4 → S6 on one equation).
- **Branch**: expandable (`<details>`) sub-case of a skill, shown under an "Edge cases" label. Edge cases and variants only. Few per skill.
  - Keep only what a strong A Level Maths student (no Further Maths) would NOT figure out alone: FM facts,
    exam traps the mark scheme punishes (e.g. single sin ⇒ trial needs both), non-obvious setups.
    Cut anything the steps already say, A Level technique, alternative methods, reassurances, shortcuts.
- Leave out problem-solving parts (e.g. "find k so that…", choosing a strategy). Only steps.

## Units

- FP1 (Paper 1): 1.1 roots of polynomials, 1.2 rational functions + graphs, 1.3 summation of series,
  1.4 matrices, 1.5 polar coords, 1.6 vectors, 1.7 proof by induction.
- FP2 (Paper 2): 2.1 hyperbolic fns, 2.2 matrices, 2.3 differentiation, 2.4 integration,
  2.5 complex numbers, 2.6 differential equations.
- List lives in `guide/units.json`. Unit with no source folder ⇒ builds as "not done" placeholder.
- Done: FP1 1.6 vectors, FP2 2.6 differential equations.

## Workflow per unit

1. Read unit in syllabus text (`pdftotext -layout`). Read MF19 section for unit.
2. Scan past papers (`resources/papers/<year>/9231_*_qp_1*.pdf`, 2002–2025) for question types ⇒ edge-case branches.
3. Make `guide/src/<fp1|fp2>/<num>-<slug>/` (slug from `units.json`). Add modules, joined in name order:
   `10-formulas.html`, `20-skills.html` (copy markup from `fp1/1.6-vectors/`). IDs `F#`/`S#` feed the
   "On this page" index automatically.
4. `npm run build` ⇒ `dist/` site (index, part pages, unit pages, sidebar, prev/next).
   While editing: `npm run dev` (localhost:8080, rebuild + browser reload on save, ~0.2 s).
   Cloud session: user watches live preview artifact https://claude.ai/artifact/EUUj4eGGqVdm4Ka87ZpiSg
   (whole site, private). After every change: `npm run artifact` ⇒ republish with Artifact tool,
   `url` = that link, `file_path` = `preview/artifact-index.html` (home page minus <html>/<head>/<body>),
   `root` = `dist`, `files` = every other file in `dist/`. Open viewers update in place.
   Single page instead: `npm run preview -- <part>/<page>.html` ⇒ one self-contained file in `preview/`.
5. Screenshot once with Playwright (light + dark) to check layout.
6. **No-further-maths check**: could someone who knows A Level Maths (9709) but never studied Further Maths
   solve a real CAIE question using only this page? Test: `python3 -I scripts/page2text.py dist/<page>.html`
   ⇒ give text + 2–3 real papers (qp, then ms) to a tester agent on a smaller model (`model: sonnet` or
   `haiku`) playing that persona; it logs GAP / UNCLEAR / MISSING STEP. Fix gaps in the page (skills, chips,
   branches), re-test once.

## Repo layout

- `guide/units.json` parts + units, order, titles.
- `guide/src/<part>/<num>-<slug>/*.html` unit modules (HTML fragments, one `<section>` each).
- `guide/template.html` page shell; `guide/assets/style.css` shared look.
- `scripts/build.mjs` renders KaTeX at build time ⇒ `dist/` (gitignored). Open `dist/index.html`.
- `.github/workflows/pages.yml` builds + deploys to https://michaelihc.github.io/caie-9231-guide/ on push to `main`.
- `scripts/fetch_resources.sh` re-downloads papers/syllabi (PDFs not in git).
- `scripts/setup.sh` installs system deps, Python venv with manim, npm deps.
- `manim/` optional figure scenes ⇒ render with `.venv/bin/manim`, put stills in `guide/assets/`.
- `resources/` syllabi (9231 2016–2025, 9709 2020–2025), MF19, MF10, past papers 2002–2025 (2002–20: qp, ms, er, gt; 2021–25: qp, ms).

## Math markup

- `$...$` inline, `$$...$$` display. Rendered by KaTeX at build. Never use a bare `$` for anything else.
- Macros: `\V{a}` bold vector, `\cvec{x}{y}{z}` column vector, `\AB{AB}` arrow vector.
