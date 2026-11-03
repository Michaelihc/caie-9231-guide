// Local preview: rebuild on save + auto-reload the browser.
//   npm run dev            → http://localhost:8080
//   PORT=3000 npm run dev
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const port = Number(process.env.PORT) || 8080;
const clients = new Set();

function build() {
  const t = Date.now();
  const r = spawnSync(process.execPath, [path.join(root, "scripts/build.mjs")], { encoding: "utf8" });
  if (r.status === 0) {
    console.log(`rebuilt in ${Date.now() - t} ms`);
    for (const res of clients) res.write("data: reload\n\n");
  } else {
    console.error(r.stderr || r.stdout); // e.g. KaTeX error: page keeps last good build
  }
}

const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".mp4": "video/mp4",
  ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
const RELOAD = `<script>new EventSource("/__reload").onmessage = () => location.reload();</script>`;

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/__reload") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }
  let file = path.join(dist, url);
  if (!file.startsWith(dist)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end("not found"); }
  const ext = path.extname(file);
  res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream", "Cache-Control": "no-store" });
  if (ext === ".html") return res.end(fs.readFileSync(file, "utf8").replace("</body>", `${RELOAD}</body>`));
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`preview: http://localhost:${port}  (watching guide/)`));

build();
let timer;
fs.watch(path.join(root, "guide"), { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(build, 120);
});
