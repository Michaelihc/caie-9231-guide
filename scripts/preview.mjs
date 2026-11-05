// Bundle one built page into a single self-contained HTML file (CSS, JS, KaTeX fonts, clips inlined),
// for viewers that open one file at a time (e.g. the Claude app file viewer).
//   node scripts/preview.mjs fp1/1-6-vectors.html   → preview/fp1-1-6-vectors.html
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
// --artifact: write preview/artifact-index.html = dist/index.html without its own <html>/<head>/<body>
// (the Claude artifact wraps its main page in a skeleton); other dist files are published as-is.
if (process.argv[2] === "--artifact") {
  const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
  const head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
    .replace(/<meta charset[^>]*>\s*/, "").replace(/<meta name="viewport"[^>]*>\s*/, "");
  const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
  const out = path.join(root, "preview", "artifact-index.html");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `<meta name="claude:viewport-fit-sides" content="cover">\n${head.trim()}\n${body.trim()}\n`);
  console.log(path.relative(root, out));
  process.exit(0);
}
const page = process.argv[2] || "fp1/1-6-vectors.html";
const src = path.join(dist, page);
if (!fs.existsSync(src)) { console.error(`missing ${src} (run npm run build first)`); process.exit(1); }
const dir = path.dirname(src);
const mime = { ".woff2": "font/woff2", ".mp4": "video/mp4", ".jpg": "image/jpeg", ".png": "image/png" };
const dataUri = (file) => `data:${mime[path.extname(file)]};base64,${fs.readFileSync(file).toString("base64")}`;

let html = fs.readFileSync(src, "utf8");
html = html.replace(/<link rel="stylesheet" href="(?!https?:)([^"]+)">/g, (_, href) => {
  const file = path.resolve(dir, href);
  const css = fs.readFileSync(file, "utf8").replace(/url\(([^)"']+\.woff2)\)/g, (m, u) => `url(${dataUri(path.resolve(path.dirname(file), u))})`)
    .replace(/url\(([^)"']+\.(woff|ttf))\)[^,;}]*,?/g, ""); // keep woff2 only (stop at "}": never eat the next rule)
  return `<style>${css}</style>`;
});
html = html.replace(/<script src="(?!https?:)([^"]+)"><\/script>/g, (_, s) => `<script>${fs.readFileSync(path.resolve(dir, s), "utf8")}</script>`);
html = html.replace(/(src|poster)="(?!https?:|data:)([^"]+\.(mp4|jpg|png))"/g, (_, attr, s) => `${attr}="${dataUri(path.resolve(dir, s))}"`);

const out = path.join(root, "preview", page.replace(/\//g, "-"));
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`${path.relative(root, out)} (${(html.length / 1024).toFixed(0)} KB)`);
