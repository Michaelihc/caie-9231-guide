# CAIE 9231 compact revision guide

Goal: most compact revision guide for CAIE A Level Further Maths 9231.
Do FP1 (Paper 1) first, then FP2 (Paper 2). Syllabus: 2020–22 (`resources/syllabus/9231_y20-22_sy.pdf`).
Formula list: MF19 (`resources/syllabus/MF19_list_of_formulae.pdf`).

## Writing style

- Compact phrasing, grug speak. Few words. Drop "the", "a", "you should".
- Simple words. Short lines. Symbols ok: ⇒ ⇔ ∥ ⊥ → ≠.
- Math stays exact. Grug words, not grug math.
- No intros, no motivation, no worked examples, no exam tips.

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
      solve". Name things in words (point, foot, normal, direction, line 1), not single letters
      ($Q$, $\V n$, $\V b$). Only the unknown you solve for gets a letter ($k$, $t$, $\lambda$).
    - Geometric derivations ⇒ manim clip in the derive panel (`manim/<unit>.py`, export with
      `scripts/manim_export.sh <part> manim/<unit>.py Scene…` ⇒ `guide/assets/media/<part>/`).
      Embed: `<video src="{{root}}assets/media/…mp4" poster="…jpg" controls muted loop playsinline preload="none">`.
- **Procedure** (`P#`): compact actionable numbered steps for one standard task.
  - Can call formulas (list them in `uses`). E.g. solve 1st-order DE ⇒ calls integrating-factor formula.
  - Steps = what to do. Not why.
- **Branch**: expandable (`<details>`) sub-case of a procedure. Edge cases and variants only. Few per procedure.
- Leave out problem-solving parts (e.g. "find k so that…", choosing a strategy). Only steps.

## Units

- FP1 (Paper 1): 1.1 roots of polynomials, 1.2 rational functions + graphs, 1.3 summation of series,
  1.4 matrices, 1.5 polar coords, 1.6 vectors, 1.7 proof by induction.
- FP2 (Paper 2): 2.1 hyperbolic fns, 2.2 matrices, 2.3 differentiation, 2.4 integration,
  2.5 complex numbers, 2.6 differential equations.
- List lives in `guide/units.json`. Unit with no source folder ⇒ builds as "not done" placeholder.
- Done: FP1 1.6 vectors.

## Workflow per unit

1. Read unit in syllabus text (`pdftotext -layout`). Read MF19 section for unit.
2. Scan past papers (`resources/papers/<year>/9231_*_qp_1*.pdf`, ≤2020) for question types ⇒ edge-case branches.
3. Make `guide/src/<fp1|fp2>/<num>-<slug>/` (slug from `units.json`). Add modules, joined in name order:
   `10-formulas.html`, `20-procedures.html` (copy markup from `fp1/1.6-vectors/`). IDs `F#`/`P#` feed the
   "On this page" index automatically.
4. `npm run build` ⇒ `dist/` site (index, part pages, unit pages, sidebar, prev/next).
5. Screenshot once with Playwright (light + dark) to check layout.

## Repo layout

- `guide/units.json` parts + units, order, titles.
- `guide/src/<part>/<num>-<slug>/*.html` unit modules (HTML fragments, one `<section>` each).
- `guide/template.html` page shell; `guide/assets/style.css` shared look.
- `scripts/build.mjs` renders KaTeX at build time ⇒ `dist/` (gitignored). Open `dist/index.html`.
- `.github/workflows/pages.yml` builds + deploys to https://michaelihc.github.io/caie-9231-guide/ on push to `main`.
- `scripts/fetch_resources.sh` re-downloads papers/syllabi (PDFs not in git).
- `scripts/setup.sh` installs system deps, Python venv with manim, npm deps.
- `manim/` optional figure scenes ⇒ render with `.venv/bin/manim`, put stills in `guide/assets/`.
- `resources/` syllabi, MF19, past papers 2002–2020 (qp, ms, er, gt).

## Math markup

- `$...$` inline, `$$...$$` display. Rendered by KaTeX at build. Never use a bare `$` for anything else.
- Macros: `\V{a}` bold vector, `\cvec{x}{y}{z}` column vector, `\AB{AB}` arrow vector.
