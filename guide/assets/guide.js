// Turn .word / .derive panels inside each item into two toggle buttons.
// Without JS the panels simply show (see .js rules in style.css).
document.documentElement.classList.add("js");

const LABELS = { word: "Word equation", derive: "Don't want to memorise" };

document.querySelectorAll(".item").forEach((item) => {
  const panels = [...item.querySelectorAll(":scope > div > .word, :scope > div > .derive")];
  if (!panels.length) return;
  const bar = document.createElement("div");
  bar.className = "more";
  panels.forEach((panel) => {
    const kind = panel.classList.contains("word") ? "word" : "derive";
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
    });
    bar.append(btn);
  });
  panels[0].before(bar);
});

// ---- Settle: hide formulas you are confident about (saved in this browser) ----
const STORE = "caie9231.settled";
const unitKey = location.pathname.split("/").slice(-2).join("/"); // e.g. fp1/1-6-vectors.html
const load = () => {
  try { return new Set(JSON.parse(localStorage.getItem(STORE) || "[]")); } catch { return new Set(); }
};
const save = (set) => {
  try { localStorage.setItem(STORE, JSON.stringify([...set])); } catch { /* storage blocked: state lasts this visit */ }
};
const settled = load();
const formulas = [...document.querySelectorAll('.item[id^="F"]')];

if (formulas.length) {
  const section = formulas[0].closest("section");
  const h2 = section?.querySelector("h2");
  const showAll = document.createElement("button");
  showAll.type = "button";
  showAll.className = "settle-all";
  showAll.setAttribute("aria-pressed", "false");
  showAll.addEventListener("click", () => {
    const on = showAll.getAttribute("aria-pressed") !== "true";
    showAll.setAttribute("aria-pressed", String(on));
    section.classList.toggle("show-settled", on);
    refresh();
  });
  h2?.append(showAll);

  const refresh = () => {
    let n = 0;
    formulas.forEach((item) => {
      const on = settled.has(item.dataset.settleKey);
      if (on) n++;
      item.classList.toggle("settled", on);
      const btn = item.querySelector(".settle-btn");
      btn.textContent = on ? "Unsettle" : "Settle";
      btn.setAttribute("aria-pressed", String(on));
      document.querySelectorAll(`.jump a[href="#${item.id}"]`).forEach((a) => a.parentElement.classList.toggle("settled", on));
    });
    showAll.hidden = n === 0;
    const showing = showAll.getAttribute("aria-pressed") === "true";
    showAll.textContent = showing ? `Hide settled (${n})` : `Show settled (${n})`;
  };

  formulas.forEach((item) => {
    const body = item.querySelector(":scope > div");
    const name = body.querySelector(".name");
    item.dataset.settleKey = `${unitKey}#${name.textContent.trim()}`;
    const head = document.createElement("div");
    head.className = "item-head";
    const title = document.createElement("span");
    title.className = "item-title";
    [...body.children].filter((el) => el.matches(".name, .tag")).forEach((el) => title.append(el));
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "settle-btn";
    btn.title = "Hide this formula once you know it. Saved in this browser.";
    btn.addEventListener("click", () => {
      const k = item.dataset.settleKey;
      settled.has(k) ? settled.delete(k) : settled.add(k);
      save(settled);
      refresh();
    });
    head.append(title, btn);
    body.prepend(head);
  });
  refresh();
}
