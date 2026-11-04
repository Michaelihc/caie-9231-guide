// Turn .word / .derive / .try panels inside each item into toggle buttons.
// Without JS the panels simply show (see .js rules in style.css).
document.documentElement.classList.add("js");

const ROOT = (document.currentScript && document.currentScript.src.replace(/assets\/guide\.js.*$/, "")) || "";
const LABELS = { word: "Word equation", derive: "Don't want to memorise", try: "Try it" };

// load a script once, on demand
const loaded = {};
const loadScript = (src) => (loaded[src] ||= new Promise((ok, fail) => {
  const el = document.createElement("script");
  el.src = ROOT + src; el.onload = ok; el.onerror = () => fail(new Error(`could not load ${src}`));
  document.head.append(el);
}));

async function startWidget(panel) {
  if (panel.dataset.started) return;
  panel.dataset.started = "1";
  try {
    await loadScript("assets/jsxgraph/jsxgraphcore.js");
    await loadScript("assets/widgets.js");
    window.CAIE_WIDGETS[panel.dataset.widget](panel);
  } catch (e) {
    panel.textContent = `Widget did not load (${e.message}). Reload the page to try again.`;
  }
}

document.querySelectorAll(".item").forEach((item) => {
  const panels = [...item.querySelectorAll(":scope > div > .word, :scope > div > .derive, :scope > div > .try")];
  if (!panels.length) return;
  const bar = document.createElement("div");
  bar.className = "more";
  panels.forEach((panel) => {
    const kind = ["word", "derive", "try"].find((k) => panel.classList.contains(k));
    panel.id = `${item.id}-${kind}`;
    panel.classList.add("more-panel");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `more-btn more-${kind}`;
    btn.textContent = LABELS[kind];
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", panel.id);
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      panel.classList.toggle("open", open);
      if (!open) panel.querySelectorAll("video").forEach((v) => v.pause());
      if (open && kind === "try") startWidget(panel);
    });
    bar.append(btn);
  });
  panels[0].before(bar);
});

// ---- Formula chips: formula used in place inside a skill. Hover = formula; tap/click = full card under the step.
document.querySelectorAll(".fx[data-f]").forEach((chip) => {
  const card = document.getElementById(chip.dataset.f);
  if (!card) return;
  if (!card._home) { card._home = document.createComment(card.id); card.before(card._home); }
  chip.tabIndex = 0;
  chip.setAttribute("role", "button");
  chip.setAttribute("aria-expanded", "false");
  const name = card.querySelector(".name")?.textContent.trim() || "Formula";
  const tip = document.createElement("span");
  tip.className = "fx-tip";
  tip.setAttribute("role", "tooltip");
  tip.innerHTML = `<b>${name}</b> <small>tap for more</small>`;
  const formula = card.querySelector(".hl");
  if (formula) tip.append(formula.cloneNode(true));
  chip.append(tip);
  const toggle = () => {
    const host = chip.closest("li") || chip.parentElement;
    const here = card.parentElement === host && card.classList.contains("open-inline");
    document.querySelectorAll(`.fx[data-f="${card.id}"]`).forEach((c) => c.setAttribute("aria-expanded", "false"));
    if (here) { card.classList.remove("open-inline"); card._home.after(card); return; }
    host.append(card);
    card.classList.add("open-inline");
    chip.setAttribute("aria-expanded", "true");
  };
  chip.addEventListener("click", (e) => { if (!e.target.closest(".fx-tip")) toggle(); });
  chip.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
});

// ---- Settle: move formulas you are confident about to a collapsed box at page bottom ----
// Saved in this browser (localStorage), keyed by unit + formula name.
const STORE = "caie9231.settled";
const unitKey = location.pathname.split("/").slice(-2).join("/"); // e.g. fp1/1-6-vectors.html
const load = () => {
  try { return new Set(JSON.parse(localStorage.getItem(STORE) || "[]")); } catch { return new Set(); }
};
const save = (set) => {
  try { localStorage.setItem(STORE, JSON.stringify([...set])); } catch { /* storage blocked: lasts this visit */ }
};
const settled = load();
const formulas = [...document.querySelectorAll('.item[id^="F"]:not(.inline)')];

if (formulas.length) {
  // bottom box, placed after the last content section (before the pager)
  const box = document.createElement("section");
  box.className = "settled-box";
  box.innerHTML = '<details><summary></summary><div class="settled-list"></div></details>';
  const details = box.querySelector("details");
  const list = box.querySelector(".settled-list");
  const sections = document.querySelectorAll("main > section");
  sections[sections.length - 1].after(box);

  const refresh = () => {
    let n = 0;
    formulas.forEach((item) => {
      const on = settled.has(item.dataset.settleKey);
      item.classList.toggle("settled", on);
      if (on) { n++; list.append(item); }          // formulas[] order ⇒ box stays in F order
      else if (item.parentElement === list) item._home.after(item);
      const btn = item.querySelector(".settle-btn");
      btn.textContent = on ? "Unsettle" : "Settle";
      btn.setAttribute("aria-pressed", String(on));
      document.querySelectorAll(`.jump a[href="#${item.id}"]`).forEach((a) => a.parentElement.classList.toggle("settled", on));
    });
    box.hidden = n === 0;
    details.querySelector("summary").textContent = `Settled formulas (${n})`;
  };

  formulas.forEach((item) => {
    item._home = document.createComment(item.id);   // marks original spot
    item.before(item._home);
    const body = item.querySelector(":scope > div");
    const name = body.querySelector(".name");
    item.dataset.settleKey = `${unitKey}#${name.textContent.trim()}`;
    const head = document.createElement("div");
    head.className = "item-head";
    const title = document.createElement("span");
    title.className = "item-title";
    [...body.children].filter((el) => el.matches(".name, .tag")).forEach((el) => title.append(el));
    title.addEventListener("click", () => item.classList.contains("settled") && item.classList.toggle("peek"));
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "settle-btn";
    btn.title = "Move to Settled at page bottom. Saved in this browser.";
    btn.addEventListener("click", () => {
      const k = item.dataset.settleKey;
      settled.has(k) ? settled.delete(k) : settled.add(k);
      item.classList.remove("peek");
      save(settled);
      refresh();
    });
    head.append(title, btn);
    body.prepend(head);
  });

  // jumping to a settled formula opens the box
  const openFor = (id) => { if (list.querySelector(`#${CSS.escape(id)}`)) details.open = true; };
  document.querySelectorAll('.jump a[href^="#F"]').forEach((a) => a.addEventListener("click", () => openFor(a.hash.slice(1))));
  refresh();
  if (location.hash) openFor(location.hash.slice(1));
}
