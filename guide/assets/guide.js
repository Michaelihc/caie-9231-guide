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
