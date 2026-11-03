# CAIE 9231 compact revision guide

Most compact revision guide for CAIE A Level Further Maths 9231, FP1 then FP2.
Style and terms: see [AGENTS.md](AGENTS.md).

```bash
scripts/setup.sh        # fresh machine: deps, manim venv, KaTeX, papers, build
npm run build           # rebuild dist/ after editing guide/
```

Open `dist/index.html`.

```
guide/units.json              unit list (order, titles); units without source build as "not done"
guide/src/fp1/1.6-vectors/    one folder per unit; *.html modules joined in name order
  10-formulas.html
  20-procedures.html
guide/template.html           page shell: sidebar, breadcrumbs, prev/next
guide/assets/style.css
scripts/build.mjs             KaTeX at build time -> dist/
scripts/fetch_resources.sh    past papers + syllabi -> resources/ (not in git)
resources/syllabus/           syllabus 2016-2022, MF19, MF10
resources/papers/<year>/      9231 qp/ms/er/gt 2002-2020
```
