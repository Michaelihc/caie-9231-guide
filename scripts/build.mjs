// Build the guide site into dist/.
//
//   guide/units.json                 parts + units (order, titles, syllabus numbers)
//   guide/src/<part>/<num>-<slug>/   one folder per unit; *.html modules joined in filename order
//   guide/template.html              page shell (sidebar, crumbs, pager)
//   guide/assets/style.css           shared look
//
// A unit with no source folder (or an empty one) builds as a "Not done" placeholder.
// KaTeX is rendered here; pages only need assets/katex/katex.min.css + fonts.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const katex = require("katex");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const G = (...p) => path.join(root, "guide", ...p);
const dist = path.join(root, "dist");
const katexDir = path.dirname(require.resolve("katex/dist/katex.min.css"));

const macros = {
  "\\V": "\\mathbf{#1}",
  "\\cvec": "\\begin{pmatrix}#1\\\\#2\\\\#3\\end{pmatrix}",
  "\\AB": "\\overrightarrow{#1}",
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function renderMath(html, where) {
  const render = (tex, displayMode) => {
    try {
      return katex.renderToString(tex, { displayMode, macros: { ...macros }, throwOnError: true, strict: "warn" });
    } catch (e) {
      throw new Error(`${where}: KaTeX error in "${tex}": ${e.message}`);
    }
  };
  return html
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, t) => `<div class="math-row">${render(t.trim(), true)}</div>`)
    .replace(/\$([^$\n]+?)\$/g, (_, t) => render(t, false));
}

// ---- collect units ----------------------------------------------------------
const manifest = JSON.parse(fs.readFileSync(G("units.json"), "utf8"));
const units = [];
for (const part of manifest.parts) {
  for (const u of part.units) {
    const dir = G("src", part.id, `${u.num}-${u.slug}`);
    const modules = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => f.endsWith(".html")).sort().map((f) => path.join(dir, f))
      : [];
    units.push({
      ...u,
      part,
      modules,
      done: modules.length > 0,
      href: `${part.id}/${u.num.replace(".", "-")}-${u.slug}.html`,
    });
  }
}

// ---- page pieces ------------------------------------------------------------
const rel = (depth) => "../".repeat(depth);

function navHtml(current, depth) {
  return manifest.parts
    .map((part) => {
      const items = units
        .filter((u) => u.part === part)
        .map((u) => {
          const cls = [u.done ? "done" : "todo", u === current ? "here" : ""].join(" ").trim();
          const cur = u === current ? ' aria-current="page"' : "";
          const badge = u.done ? "" : '<span class="todo-badge">not done</span>';
          return `<li class="${cls}"><a href="${rel(depth)}${u.href}"${cur}><span class="num">${u.num}</span> ${esc(u.title)}</a>${badge}</li>`;
        })
        .join("");
      return `<div class="nav-part"><a class="nav-head" href="${rel(depth)}${part.id}/index.html">${part.id.toUpperCase()} ${esc(part.title)}</a><ol>${items}</ol></div>`;
    })
    .join("");
}

function crumbs(trail, depth) {
  const links = [`<a href="${rel(depth)}index.html">9231</a>`];
  for (const [label, href] of trail) links.push(href ? `<a href="${rel(depth)}${href}">${esc(label)}</a>` : `<span>${esc(label)}</span>`);
  return links.join('<span class="sep" aria-hidden="true">/</span>');
}

function pager(u, depth) {
  const i = units.indexOf(u);
  const prev = units[i - 1], next = units[i + 1];
  const link = (x, dir) =>
    x
      ? `<a class="${dir}" href="${rel(depth)}${x.href}"><small>${dir === "prev" ? "Previous" : "Next"}</small>${x.num} ${esc(x.title)}${x.done ? "" : " (not done)"}</a>`
      : "<span></span>";
  return `<nav class="pager" aria-label="Units">${link(prev, "prev")}${link(next, "next")}</nav>`;
}

// in-page index of F#/P# items, built from module source
function jumpIndex(src) {
  const re = /<div class="item([^"]*)" id="([FP]\d+)">\s*<span class="id">[^<]*<\/span>\s*<div>\s*<span class="name">([\s\S]*?)<\/span>/g;
  const groups = { F: [], P: [] };
  for (const m of src.matchAll(re)) {
    const star = m[1].includes("nomf") ? '<span class="star" title="not in MF19">★</span>' : "";
    groups[m[2][0]].push(`<li><a href="#${m[2]}"><b>${m[2]}</b> ${m[3]}</a>${star}</li>`);
  }
  const block = (title, items) => (items.length ? `<div><h3>${title}</h3><ol>${items.join("")}</ol></div>` : "");
  const body = block("Formulas", groups.F) + block("Procedures", groups.P);
  return body ? `<details class="jump" open><summary>On this page</summary><div class="jump-cols">${body}</div></details>` : "";
}

const KEY = `<ul class="key">
  <li><b>F</b> formula</li><li><b>P</b> procedure</li>
  <li><b class="hlkey">★ highlighted</b> not in MF19, learn it</li><li><b>+</b> tap for edge cases</li>
</ul>`;

const template = fs.readFileSync(G("template.html"), "utf8");
function page({ title, depth, current, trail, content, pagerHtml = "" }) {
  return template
    .replace("{{title}}", esc(title))
    .replaceAll("{{root}}", rel(depth))
    .replace("{{nav}}", () => navHtml(current, depth))
    .replace("{{crumbs}}", () => crumbs(trail, depth))
    .replace("{{content}}", () => content.replaceAll("{{root}}", rel(depth)))
    .replace("{{pager}}", () => pagerHtml);
}

function write(file, html) {
  const out = path.join(dist, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
}

// ---- build ------------------------------------------------------------------
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, "assets/katex/fonts"), { recursive: true });
fs.cpSync(G("assets"), path.join(dist, "assets"), { recursive: true });
fs.copyFileSync(path.join(katexDir, "katex.min.css"), path.join(dist, "assets/katex/katex.min.css"));
for (const f of fs.readdirSync(path.join(katexDir, "fonts"))) {
  fs.copyFileSync(path.join(katexDir, "fonts", f), path.join(dist, "assets/katex/fonts", f));
}

for (const u of units) {
  const head = `<header class="top">
  <span class="course">9231 ${u.part.paper}, syllabus ${u.num}</span>
  <h1>${esc(u.title)}</h1>
  ${u.done ? KEY : ""}
</header>`;
  let body;
  if (u.done) {
    const src = u.modules.map((f) => fs.readFileSync(f, "utf8")).join("\n");
    const where = path.relative(root, path.dirname(u.modules[0]));
    body = head + renderMath(jumpIndex(src), where) + renderMath(src, where);
  } else {
    body = `${head}<section class="placeholder"><p><b>Not done yet.</b> Placeholder for syllabus ${u.num}.</p>
<p>Source goes in <code>guide/src/${u.part.id}/${u.num}-${u.slug}/</code>.</p></section>`;
  }
  write(u.href, page({
    title: `${u.part.id.toUpperCase()} ${u.title}`,
    depth: 1,
    current: u,
    trail: [[u.part.id.toUpperCase(), `${u.part.id}/index.html`], [`${u.num} ${u.title}`]],
    content: body,
    pagerHtml: pager(u, 1),
  }));
}

function unitTable(list, depth) {
  return `<ol class="unit-list">${list
    .map((u) => `<li class="${u.done ? "done" : "todo"}"><a href="${rel(depth)}${u.href}"><span class="num">${u.num}</span> ${esc(u.title)}</a><span class="status">${u.done ? "done" : "not done"}</span></li>`)
    .join("")}</ol>`;
}

for (const part of manifest.parts) {
  const list = units.filter((u) => u.part === part);
  const n = list.filter((u) => u.done).length;
  write(`${part.id}/index.html`, page({
    title: `${part.id.toUpperCase()} ${part.title}`,
    depth: 1,
    trail: [[part.id.toUpperCase()]],
    content: `<header class="top"><span class="course">9231 ${part.paper}</span><h1>${part.id.toUpperCase()} ${esc(part.title)}</h1>
<p class="progress">${n} of ${list.length} units done</p></header>${unitTable(list, 1)}`,
  }));
}

const partsHtml = manifest.parts
  .map((part) => {
    const list = units.filter((u) => u.part === part);
    const n = list.filter((u) => u.done).length;
    return `<section><h2><a href="${part.id}/index.html">${part.id.toUpperCase()} ${esc(part.title)}</a> <small>${part.paper}, ${n} of ${list.length} done</small></h2>${unitTable(list, 0)}</section>`;
  })
  .join("");
write("index.html", page({
  title: "9231 Compact Guide",
  depth: 0,
  trail: [],
  content: `<header class="top"><span class="course">${esc(manifest.course)}</span><h1>Compact revision guide</h1>${KEY}</header>${partsHtml}`,
}));

console.log(`built ${units.length} unit pages (${units.filter((u) => u.done).length} done) + ${manifest.parts.length} part indexes + index`);
