const $ = (selector) => document.querySelector(selector);
const chapters = [
  { title: "The idea", time: "2 min", first: 0 },
  { title: "Independence", time: "5 min", first: 2 },
  { title: "Goodness of fit", time: "6 min", first: 7 },
  { title: "Exam check", time: "2 min", first: 13 },
];
const papers = [
  {
    code: "9231/42 · JUNE 2024 · Q5",
    season: "s24",
    variant: "42",
    qp: 8,
    ms: 11,
  },
  {
    code: "9231/42 · JUNE 2025 · Q3",
    season: "s25",
    variant: "42",
    qp: 6,
    ms: 11,
  },
  {
    code: "9231/41 · NOV 2023 · Q2",
    season: "w23",
    variant: "41",
    qp: 4,
    ms: 7,
  },
];
const step = (title, text, figure, draw, marks = "", trap = "") => ({
  title,
  text,
  figure,
  draw,
  marks,
  trap,
});
const steps = [
  step(
    "Measure the mismatch.",
    "<p>Say a model predicts 25 poor brushes and you count 18. The gap is seven. Would seven feel as surprising if you expected a thousand?</p><p>χ² (say <em>kai-squared</em>) squares each gap so opposite signs cannot cancel, then divides by the expected count to give the gap a scale.</p><p><strong>Try it.</strong> Move the count from 18 to 32, then to 25. Watch what happens to this cell’s contribution.</p>",
    "ONE CELL UNDER THE LENS",
    drawDots,
  ),
  step(
    "Where does the expectation come from?",
    "<p><strong>Observed (O)</strong> is a count from the sample. <strong>Expected (E)</strong> is the count predicted if the null hypothesis, H₀, holds.</p><p>Add the contributions from every cell. A larger total means a larger mismatch. Even a true model gives some mismatch by chance, so compare the total with a cutoff.</p>",
    "TWO ROUTES TO E",
    drawRoutes,
  ),
  step(
    "Set up the claim.",
    "<p>An examiner rates random samples of paintbrushes from companies P and Q. Each sampled brush contributes to one cell. At 5%, does the quality rating depend on the company?</p><p><strong>H₀</strong> Brush quality is independent of company.<br><strong>H₁</strong> Brush quality is associated with company.</p><p>Under H₀, both companies share the same proportions of poor, satisfactory and good brushes. Their sample sizes can differ.</p>",
    "PAINTBRUSH RATINGS",
    drawObserved,
    "5(a) · B1|State both hypotheses using the two variables.",
  ),
  step(
    "Build the expected table.",
    "<p>Of 200 brushes, 40 are poor. Under H₀, apply that same poor rate to P’s 125 brushes. That gives 25 expected poor brushes from P.</p><p>For any cell, multiply its row total by its column total and divide by the grand total. <strong>Tap a cell</strong> to trace its two totals.</p>",
    "MARGINS → EXPECTED COUNTS",
    drawExpected,
    "5(a) · M1 + A1|Show the expected table. The scheme asks for working to at least two decimal places where needed.",
    "Keep fractional expected counts. Only the observed counts must be whole numbers.",
  ),
  step(
    "Let every cell contribute.",
    "<p>P has seven fewer poor brushes than expected. Q has seven more. Q’s gap counts more because its expected count is smaller.</p><p>Follow the running sum. All six cells contribute, including the cells that differ only slightly from expectation.</p>",
    "SIX CELLS → ONE STATISTIC",
    drawBrushSum,
    "5(a) · M1 + A1|Show contributions or substitutions. The test statistic is 6.56 (3 s.f.).",
  ),
  step(
    "Find the cutoff.",
    "<p>With fixed margins, choosing the first two entries of the top row determines the other four. There are <strong>(2 − 1)(3 − 1) = 2 degrees of freedom</strong>.</p><p>If H₀ holds, about 5% of such samples would give a statistic beyond the 5% cutoff. The MF19 table gives left-tail probabilities, so use 1 − 0.05 = 0.95. Row 2, column 0.95 gives 5.991.</p>",
    "RIGHT-TAIL DECISION",
    () =>
      decision(
        2,
        6.56,
        5.991,
        "5%",
        "0.95",
        "At 5%, there is sufficient evidence that brush quality is associated with company.",
      ),
    "5(a) · M1 + A1|Compare the statistic with 5.991, reject H₀ and give the conclusion in context.",
  ),
  step(
    "Read the direction.",
    "<p>The test detects association. The squared terms have lost their signs, so go back to the original counts to say which company looks better.</p><p>P supplied 125 brushes and Q supplied 75. Compare each company with its own expected count.</p>",
    "RETURN TO THE COUNTS",
    drawDirection,
    "5(b) · B1|P appears to produce better brushes. The poor category gives a direct comparison.",
  ),
  step(
    "Estimate the breakage rate.",
    "<p>A manager samples 2,000 boxes of six eggs. The proposed model is binomial. First estimate the chance that an individual egg is broken.</p><p>Multiply each breakage count by the number of boxes in that class. A box with six broken eggs contributes six to the numerator.</p>",
    "BOX COUNTS → EGG PROBABILITY",
    drawEggRate,
    "3(a) · B1|The estimated probability is 0.01458 (4 s.f.).",
    "The denominator is 12,000 eggs. Later, expected frequencies count boxes, so use 2,000 there.",
  ),
  step(
    "Turn a probability into boxes.",
    "<p>Let X be the number broken in one box. Under the proposed model X follows B(6, p), with p estimated from this sample.</p><p><strong>H₀</strong> A binomial model fits the broken-egg counts per box.<br><strong>H₁</strong> A binomial model is inadequate for these counts.</p>",
    "BINOMIAL MODEL → EXPECTED COUNTS",
    drawBinomial,
    "3(b) · B1  /  3(c) · B1|Show how 162.6 is obtained for exactly one break. State both hypotheses for the fit test.",
  ),
  step(
    "Pool the sparse tail.",
    "<p>The χ² approximation needs adequately large <strong>expected</strong> counts. Here several are below 5. Combine adjacent tail classes until the pooled expectation reaches 5.</p><p>Start at six and work left. Even “three or more” has only about 0.12 expected boxes. Include the class for two breaks.</p>",
    "SEVEN CLASSES → THREE",
    drawPool,
    "",
    "Pool the same classes in both rows before calculating contributions. A small observed count by itself does not trigger pooling.",
  ),
  step(
    "Square after pooling.",
    "<p>The final categories are 0, 1 and 2 or more. The last category alone contributes about three quarters of the total. Thirteen boxes had multiple breakages, against just over six expected.</p><p>Use the paper’s printed expected counts here. Carry the unrounded contributions into the total.</p>",
    "THREE CELLS → ONE STATISTIC",
    drawEggSum,
    "3(c) · M1 + A1|Use the correctly pooled cells in the statistic and obtain 10.1 (3 s.f.).",
  ),
  step(
    "Pay for the fitted parameter.",
    "<p>Three pooled classes give two free counts after fixing the total. Estimating p from these data uses one more degree of freedom. The six eggs per box were fixed in advance.</p><p><strong>df = 3 − 1 − 1 = 1.</strong> At 0.5%, the upper-tail area is 0.005. Use MF19 column 0.995.</p>",
    "FITTED MODEL · RIGHT TAIL",
    () =>
      decision(
        1,
        10.1,
        7.879,
        "0.5%",
        "0.995",
        "At 0.5%, there is sufficient evidence that the binomial model is inadequate for broken eggs per box.",
      ),
    "3(c) · M1 + A1|Compare with 7.879, reject H₀ and explain what the result means for the manager’s model.",
    "For goodness of fit, df = final classes − 1 − parameters estimated from these data. A parameter specified in the question costs zero.",
  ),
  step(
    "Explain the failed assumption.",
    "<p>A binomial model treats the six eggs as independent trials with a common breakage probability. The exam asks for a reason that this model could fail.</p><p>Choose the explanation that connects the real situation to a model assumption.</p>",
    "MODEL ASSUMPTIONS",
    drawAssumptions,
    "3(d) · B1|Give a plausible failure of independence or constant breakage probability in context.",
  ),
  step(
    "Make the other decision.",
    "<p>Residents on four streets give an opinion. In this real question the statistic is 3.02. Test at 5%: does opinion depend on street?</p><p>Start from independence. Work out the degrees of freedom and use the table excerpt to pick the cutoff. Then choose the conclusion you would write.</p>",
    "PAST-PAPER EXIT CHECK",
    drawExit,
  ),
  step(
    "Take this into the exam.",
    "<p>On blank paper, reconstruct the six lines opposite. Say how you would find E for paintbrushes and for eggs, and why their degrees of freedom differ.</p><p>Then check the two decisions from memory. Which model fitted a parameter? Which example gave insufficient evidence of an association?</p>",
    "FINAL RECALL",
    drawFinish,
  ),
];
const brushO = [18, 43, 64, 22, 22, 31],
  brushE = [25, 40.625, 59.375, 15, 24.375, 35.625];
const eggO = [1844, 143, 13],
  eggE = [1831.3, 162.6, 6.136];
const qualities = ["Poor", "Satisfactory", "Good"];
const labels = brushO.map(
  (_, i) => (i < 3 ? "P" : "Q") + " · " + qualities[i % 3],
);
const contribution = (o, e) => (o - e) ** 2 / e;
const math = (label, value, kind = "math") =>
  `<div class="${kind}"><small>${label}</small>${value}</div>`;
const html = (content) => {
  $("#figure").innerHTML = content;
};
function table(head, rows) {
  return (
    "<table><thead><tr>" +
    head.map((x) => '<th scope="col">' + x + "</th>").join("") +
    "</tr></thead><tbody>" +
    rows
      .map(
        (row) =>
          '<tr><th scope="row">' +
          row[0] +
          "</th>" +
          row
            .slice(1)
            .map((v) => "<td>" + v + "</td>")
            .join("") +
          "</tr>",
      )
      .join("") +
    "</tbody></table>"
  );
}
function drawDots() {
  html(
    '<h3>Expected 25. Observed <span id="obs"></span>.</h3><div class="dots" aria-hidden="true">' +
      Array.from({ length: 40 }, () => '<i class="dot"></i>').join("") +
      '</div><div class="legend"><span>Observed count</span><span class="missing">Shortfall against 25</span></div><label class="slider">Observed <input type="range" min="0" max="40" value="18" aria-label="Observed count"><output id="readout"></output></label><div id="dot-eq"></div><p class="sub">The same gap of seven would contribute only 49 / 1,000 = 0.049 if you expected 1,000 brushes.</p>',
  );
  const input = $(".slider input");
  function update() {
    const n = Number(input.value);
    $("#obs").textContent = n;
    $("#readout").textContent = n;
    document.querySelectorAll(".dot").forEach((dot, i) => {
      dot.className =
        "dot " +
        (i < n ? (i >= 25 ? "excess" : "filled") : i < 25 ? "goal" : "");
    });
    $("#dot-eq").innerHTML = math(
      "One cell’s contribution",
      `(${n} − 25)² / 25 = <b>${contribution(n, 25).toFixed(2)}</b>`,
    );
  }
  input.oninput = update;
  update();
}
function drawRoutes() {
  html(
    "<h3>One statistic, two tests</h3>" +
      math(
        "Independence · two classifications",
        "E = row total × column total / grand total",
      ) +
      math(
        "Goodness of fit · one model",
        "E = sample size × model probability",
      ) +
      math("Both tests", "χ² = Σ (O − E)² / E", "result") +
      '<p class="sub">Σ means add one term for every final cell. Use frequencies on both sides of the subtraction.</p>',
  );
}
function drawObserved() {
  html(
    "<h3>200 brushes, two companies</h3>" +
      table(
        ["Company", ...qualities, "Total"],
        [
          ["P", 18, 43, 64, 125],
          ["Q", 22, 22, 31, 75],
          ["Total", 40, 65, 95, 200],
        ],
      ) +
      math("All brushes together", "40 / 200 = 20% poor") +
      '<p class="sub">Prediction under independence: 20% poor in each company’s sample.</p><details><summary>How to read the mark labels</summary><p class="sub">B1 is one independent mark, M1 is one method mark, and A1 is one accuracy mark that depends on the relevant method.</p></details>',
  );
}
function drawExpected() {
  html(
    "<h3>Follow the row and column</h3>" +
      table(
        ["Expected", ...qualities, "Row total"],
        ["P", "Q"]
          .map((r, j) => [
            r,
            ...brushE
              .slice(j * 3, j * 3 + 3)
              .map(
                (e, c) =>
                  `<button class="pick" data-i="${j * 3 + c}" aria-label="${r}, ${qualities[c]}, expected ${e}">${e}</button>`,
              ),
            [125, 75][j],
          ])
          .concat([["Column total", 40, 65, 95, 200]]),
      ) +
      '<div id="cell-eq"></div><p class="sub">Check the margins: the expected counts in each row and column add back to its observed total.</p>',
  );
  const buttons = [...document.querySelectorAll(".pick")],
    rows = $("#figure tbody").rows;
  function select(i) {
    const r = Math.floor(i / 3),
      c = i % 3;
    document
      .querySelectorAll("#figure .focus")
      .forEach((el) => el.classList.remove("focus"));
    [rows[r].cells[4], rows[2].cells[c + 1], rows[2].cells[4]].forEach((el) =>
      el.classList.add("focus"),
    );
    buttons.forEach((b, k) => b.setAttribute("aria-pressed", k === i));
    $("#cell-eq").innerHTML = math(
      labels[i],
      `${[125, 75][r]} × ${[40, 65, 95][c]} / 200 = <b>${brushE[i]}</b>`,
    );
    $("#cell-eq").firstChild.classList.add("flow");
  }
  buttons.forEach((b, i) => (b.onclick = () => select(i)));
  select(0);
}
let stopAnimation = () => {};
function sumFigure(title, os, es, names) {
  const parts = os.map((o, i) => contribution(o, es[i]));
  html(
    "<h3>" +
      title +
      '</h3><div id="sum-table"></div><div id="sum-eq"></div><button class="action" id="sum-play">▶ Trace the sum</button> <button class="action" id="sum-step">Next cell →</button><div id="running" aria-live="polite"></div>',
  );
  let i = 0,
    timer;
  function show() {
    $("#sum-table").innerHTML = table(
      ["Cell", "O", "E", "Contribution"],
      names.map((name, k) => [
        name,
        os[k],
        es[k],
        k <= i ? parts[k].toFixed(4) : "·",
      ]),
    );
    [...$("#sum-table tbody").rows[i].cells].forEach((c) =>
      c.classList.add("focus"),
    );
    $("#sum-eq").innerHTML = math(
      names[i],
      `(${os[i]} − ${es[i]})² / ${es[i]} = ${parts[i].toFixed(4)}`,
    );
    $("#running").innerHTML = math(
      i === os.length - 1 ? "Final statistic" : "Running total",
      `χ² ${i === os.length - 1 ? "" : "so far "}≈ <b>${parts
        .slice(0, i + 1)
        .reduce((a, b) => a + b, 0)
        .toFixed(i === os.length - 1 ? (os.length === 3 ? 1 : 2) : 4)}</b>`,
      "result",
    );
    $("#sum-step").textContent =
      i === os.length - 1 ? "First cell ↺" : "Next cell →";
  }
  function stop() {
    clearInterval(timer);
    timer = undefined;
    $("#sum-play").textContent = "▶ Trace the sum";
  }
  $("#sum-step").onclick = () => {
    stop();
    i = (i + 1) % os.length;
    show();
  };
  $("#sum-play").onclick = () => {
    if (timer) {
      stop();
      return;
    }
    i = 0;
    show();
    $("#sum-play").textContent = "Ⅱ Pause";
    timer = setInterval(() => {
      i++;
      show();
      if (i === os.length - 1) stop();
    }, 1000);
  };
  stopAnimation = stop;
  show();
}
function drawBrushSum() {
  sumFigure("Build χ² cell by cell", brushO, brushE, labels);
}
function drawEggSum() {
  sumFigure("Work with the pooled counts", eggO, eggE, [
    "0 broken",
    "1 broken",
    "2+ broken",
  ]);
}
function decision(df, stat, cut, alpha, column, conclusion) {
  // Chi-square densities for the two degrees of freedom used in these papers.
  const density = (x) =>
    df === 2
      ? 0.5 * Math.exp(-x / 2)
      : Math.exp(-x / 2) / Math.sqrt(2 * Math.PI * x);
  const max = df === 2 ? 11 : 14,
    left = 28,
    right = 490,
    base = 145;
  const x = (v) => left + ((right - left) * v) / max,
    y = (v) => base - density(Math.max(0.001, v)) * 218;
  const points = (from) =>
    Array.from({ length: 160 }, (_, i) => {
      const v = from + ((max - from) * i) / 159;
      return x(v).toFixed(2) + "," + y(v).toFixed(2);
    }).join(" ");
  html(
    "<h3>Where does the statistic land?</h3>" +
      math("MF19 lookup", `df ${df} · column ${column} → ${cut}`) +
      `<svg class="chart" viewBox="0 0 520 192" role="img" aria-label="Chi-squared density. The statistic ${stat} is to the right of the cutoff ${cut}."><defs><clipPath id="plot-window"><rect x="0" y="9" width="520" height="139"/></clipPath></defs><polygon points="${x(cut)},${base} ${points(cut)} ${right},${base}" fill="#d07745"/><polyline clip-path="url(#plot-window)" points="${points(0)}" fill="none" stroke="#256651" stroke-width="2.4"/><path d="M${left} ${base} H${right}" stroke="#91a290"/><path d="M${x(cut)} 66 V${base + 6}" stroke="#994723" stroke-dasharray="4 4"/><text x="${x(cut) - 5}" y="61" text-anchor="end">cutoff ${cut}</text><g class="cursor" style="--start:${left - x(stat)}px"><path d="M${x(stat)} 87 V${base}" stroke="#183c30" stroke-width="2"/><circle cx="${x(stat)}" cy="86" r="4" fill="#183c30"/><text x="${x(stat) + 6}" y="89">${stat}</text></g><text x="${left}" y="166">0</text><text x="${right}" y="166" text-anchor="end">χ² →</text><text x="${x(cut)}" y="186" text-anchor="middle">upper tail · ${alpha}</text></svg>` +
      math(
        "Decision",
        `${stat} &gt; ${cut} &nbsp;⇒&nbsp; reject H₀`,
        "result",
      ) +
      '<p class="sub">' +
      conclusion +
      "</p>",
  );
}
function drawDirection() {
  html(
    "<h3>The same gap, opposite signs</h3>" +
      table(
        ["Poor brushes", "Observed", "Expected", "O − E"],
        [
          ["P", 18, 25, "−7"],
          ["Q", 22, 15, "+7"],
        ],
      ) +
      math(
        "Poor rate",
        "P: 18 / 125 = 14.4% &nbsp; · &nbsp; Q: 22 / 75 ≈ 29.3%",
      ) +
      '<p class="sub">The poor category contributes 1.96 + 3.27 of the total 6.56. Fewer poor brushes than expected in P, more in Q.</p>',
  );
}
function drawEggRate() {
  html(
    "<h3>Count broken eggs across boxes</h3>" +
      table(
        ["Broken eggs", 0, 1, 2, 3, 4, 5, 6],
        [["Boxes", 1844, 143, 11, 0, 1, 0, 1]],
      ) +
      math("Broken eggs", "143 + 2 × 11 + 4 × 1 + 6 × 1 = 175") +
      math(
        "Estimated probability",
        "p̂ = 175 / (2,000 × 6) = 7 / 480 ≈ 0.01458",
        "result",
      ),
  );
}
function drawBinomial() {
  html(
    "<h3>Exactly one broken egg</h3>" +
      math("Model probability", "P(X = 1) = 6p(1 − p)⁵") +
      '<p class="sub">The broken egg could be in any of six positions. The other five eggs must survive.</p>' +
      math(
        "Expected boxes",
        "2,000 × 6 × (7/480) × (473/480)⁵ ≈ <b>162.6</b>",
        "result",
      ) +
      '<p class="sub">A second route is to subtract all six other expected counts from the total of 2,000 boxes.</p>',
  );
}
function drawPool() {
  html(
    '<h3>Combine both rows together</h3><p class="sub">Each tile shows broken eggs, then observed boxes (O) and expected boxes (E). Values are rounded as in the paper.</p><div id="pool" class="pool"></div><button class="action" id="pool-btn"></button><div id="pool-eq" aria-live="polite"></div>',
  );
  let joined = false;
  function render(animate) {
    const parent = $("#pool");
    const before = [...parent.children];
    const previous = before.map((tile) => tile.getBoundingClientRect());
    parent.classList.toggle("joined", joined);
    const groups = joined
      ? [
          ["0", 1844, "1831.3"],
          ["1", 143, "162.6"],
          ["2+", 13, "6.136"],
        ]
      : [
          ["0", 1844, "1831.3"],
          ["1", 143, "162.6"],
          ["2", 11, "6.016"],
          ["3", 0, "0.119"],
          ["4", 1, "0.001"],
          ["5", 0, "0.000"],
          ["6", 1, "0.000"],
        ];
    parent.innerHTML = groups
      .map(
        ([name, o, e], i) =>
          `<div class="group ${i >= 2 ? "tail" : ""}"><b>${name}</b><span>${o}</span><span>${e}</span></div>`,
      )
      .join("");
    if (animate && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const tiles = [...parent.children];
      tiles.forEach((tile, i) => {
        const now = tile.getBoundingClientRect(),
          old = previous[Math.min(i, previous.length - 1)];
        tile.animate(
          [
            {
              transformOrigin: "left",
              transform: `translateX(${old.left - now.left}px) scaleX(${old.width / now.width})`,
              opacity: 0.4,
            },
            { transformOrigin: "left", transform: "none", opacity: 1 },
          ],
          { duration: 550, easing: "ease-out" },
        );
      });
      if (joined) {
        const destination = tiles[2].getBoundingClientRect();
        before.slice(2).forEach((ghost, index) => {
          const start = previous[index + 2];
          Object.assign(ghost.style, {
            position: "fixed",
            left: start.left + "px",
            top: start.top + "px",
            width: start.width + "px",
            height: start.height + "px",
            pointerEvents: "none",
          });
          ghost.setAttribute("aria-hidden", "true");
          document.body.append(ghost);
          const dx =
            destination.left +
            destination.width / 2 -
            start.left -
            start.width / 2;
          const move = ghost.animate(
            [
              { opacity: 1 },
              { transform: `translateX(${dx}px) scale(.64)`, opacity: 0 },
            ],
            { duration: 520, easing: "ease-in-out" },
          );
          move.onfinish = () => ghost.remove();
        });
      }
    }
    $("#pool-btn").textContent = joined
      ? "↺ Unpool classes"
      : "Combine classes 2 through 6 →";
    $("#pool-eq").innerHTML = joined
      ? math(
          "Pooled cell",
          "O = 11 + 0 + 1 + 0 + 1 = 13<br>E = 6.016 + 0.119 + 0.001 ≈ 6.136",
          "result",
        )
      : math("Before pooling", "E for 3+ ≈ 0.120 &lt; 5");
  }
  $("#pool-btn").onclick = () => {
    joined = !joined;
    render(true);
  };
  render(false);
}
function quiz(id, question, answers) {
  return `<section id="${id}"><p><strong>${question}</strong></p><div class="choices">${answers.map((a, i) => `<button class="choice" aria-pressed="false" data-choice="${i}">${a}</button>`).join("")}</div><p class="feedback" aria-live="polite"></p></section>`;
}
function bindQuiz(id, correct, replies, onRight) {
  const root = document.getElementById(id),
    buttons = [...root.querySelectorAll(".choice")];
  buttons.forEach(
    (b, i) =>
      (b.onclick = () => {
        buttons.forEach((x) => x.setAttribute("aria-pressed", x === b));
        const feedback = root.querySelector(".feedback");
        feedback.className = "feedback " + (i === correct ? "right" : "wrong");
        feedback.textContent = replies[i];
        if (i === correct) onRight?.();
      }),
  );
}
function drawAssumptions() {
  html(
    "<h3>Which explanation earns the mark?</h3>" +
      quiz("assumption", "Choose one.", [
        "A box has only six eggs, so a binomial model cannot apply.",
        "Dropping one box could break several eggs together.",
        "The expected frequencies include decimals.",
      ]),
  );
  bindQuiz("assumption", 1, [
    "A fixed number of trials is exactly what a binomial model requires. Try again.",
    "Yes. A shared impact makes breakages within a box dependent.",
    "An expectation is a long-run average and can be fractional. Try again.",
  ]);
}
function drawExit() {
  html(
    "<h3>Street and opinion</h3>" +
      table(
        ["Observed", "North", "East", "South", "West"],
        [
          ["Approve", 33, 54, 42, 26],
          ["Disapprove", 19, 39, 28, 9],
        ],
      ) +
      table(
        ["MF19 · left area 0.95", "df 2", "df 3", "df 4"],
        [["Cutoff", 5.991, 7.815, 9.488]],
      ) +
      quiz("exit-df", "Which cutoff applies?", ["5.991", "7.815", "9.488"]) +
      '<div id="exit-conclusion"></div><details id="street-working"><summary>See the full seven-mark working</summary></details>',
  );
  const o = [33, 54, 42, 26, 19, 39, 28, 9],
    columns = [52, 93, 70, 35];
  const e = o.map((_, i) => ((i < 4 ? 155 : 95) * columns[i % 4]) / 250);
  const terms = o.map((v, i) => contribution(v, e[i]));
  $("#street-working").insertAdjacentHTML(
    "beforeend",
    '<p class="sub">B1 · H₀: opinion is independent of street. H₁: opinion is associated with street.</p>' +
      math("First expectation", "155 × 52 / 250 = 32.24") +
      table(
        ["Expected / contribution", "North", "East", "South", "West"],
        ["Approve", "Disapprove"].map((name, i) => [
          name,
          ...e
            .slice(i * 4, i * 4 + 4)
            .map(
              (v, j) =>
                v.toFixed(2) +
                "<br><small>" +
                terms[i * 4 + j].toFixed(4) +
                "</small>",
            ),
        ]),
      ) +
      '<p class="sub">M1 + A1 · Expected counts are on the first line of each cell. M1 + A1 · The second line gives each contribution. For instance, (33 − 32.24)² / 32.24 ≈ 0.0179. Adding all eight gives 3.02.</p>' +
      '<p class="sub">M1 · df = (2 − 1)(4 − 1) = 3. At 5%, 3.02 &lt; 7.815, so retain H₀. A1 · There is insufficient evidence that residents’ opinions depend on their street.</p>',
  );
  bindQuiz(
    "exit-df",
    1,
    [
      "Count the categories in both directions. Use (rows − 1)(columns − 1).",
      "Yes. (2 − 1)(4 − 1) = 3 degrees of freedom.",
      "Four streets alone do not determine the degrees of freedom. Try again.",
    ],
    () => {
      if ($("#exit-conclusion").children.length) return;
      $("#exit-conclusion").innerHTML = quiz(
        "exit-answer",
        "What can you infer from 3.02?",
        [
          "Street and opinion are independent.",
          "There is insufficient evidence at 5% that opinion depends on street.",
          "Opinion depends on street because χ² is positive.",
        ],
      );
      bindQuiz("exit-answer", 1, [
        "This claims certainty. A small statistic leaves independence plausible.",
        "Correct. 3.02 < 7.815, so do not reject H₀. The comparison and decision earn M1, and the qualified contextual conclusion earns A1 with correct working.",
        "Most samples give a positive statistic. Rejection requires crossing the upper cutoff.",
      ]);
    },
  );
}
function drawFinish() {
  html(
    "<h3>Your six-line answer</h3>" +
      table(
        ["Line", "What to put on paper"],
        [
          [
            "1 · Hypotheses",
            "Name the variables or the proposed distribution.",
          ],
          [
            "2 · Expectation",
            "Write the model probabilities or use the row and column totals.",
          ],
          ["3 · Counts", "Show E. Pool sparse classes in both rows if needed."],
          ["4 · Statistic", "Show (O − E)² / E terms, then their sum."],
          ["5 · Cutoff", "Use final df and MF19 column 1 − α."],
          [
            "6 · Inference",
            "Compare, decide, then state the evidence in context.",
          ],
        ],
      ) +
      '<details><summary>Check your recall</summary><p class="sub">Eggs: p fitted, df 1. Brushes: two categorical variables, df 2. Streets: 3.02 falls below 7.815, leaving insufficient evidence of an association.</p></details>',
  );
}
const pageFromHash = () => {
  const m = location.hash.match(/^#step-(\d+)$/);
  return m ? Math.max(0, Math.min(steps.length - 1, Number(m[1]) - 1)) : 0;
};
let current = pageFromHash();
function go(i) {
  if (i === current) return;
  location.hash = "step-" + (i + 1);
}
function render(focus = false) {
  stopAnimation();
  stopAnimation = () => {};
  const s = steps[current],
    ch = chapters.findLastIndex((c) => c.first <= current),
    paper = ch ? papers[ch - 1] : null;
  $("#chapters").innerHTML = chapters
    .map(
      (c, i) =>
        `<button type="button" ${i === ch ? 'aria-current="step"' : ""}><span class="stage-no">0${i + 1}</span>${c.title}<span class="navtime">${c.time}</span></button>`,
    )
    .join("");
  [...$("#chapters").children].forEach(
    (b, i) => (b.onclick = () => go(chapters[i].first)),
  );
  $("#step-id").textContent = paper ? paper.code : "THE IDEA  /  χ²";
  $("#title").textContent = s.title;
  $("#copy").innerHTML = s.text;
  const marks = s.marks.split("|");
  $("#mark").innerHTML =
    (s.marks
      ? `<aside class="mark"><b>MARK SCHEME · ${marks[0]}</b>${marks[1]}</aside>`
      : "") +
    (s.trap ? `<aside class="trap"><b>EXAM TRAP</b>${s.trap}</aside>` : "");
  const prefix =
    "https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/9231_";
  $("#citations").innerHTML = paper
    ? `<div class="source">${[
        ["qp", "Question paper"],
        ["ms", "Mark scheme"],
      ]
        .map(
          ([k, label]) =>
            `<a href="${prefix}${paper.season}_${k}_${paper.variant}.pdf#page=${paper[k]}" target="_blank" rel="noopener">${label} ↗</a>`,
        )
        .join("")}</div>`
    : "";
  if ([5, 11, 13].includes(current)) {
    $("#citations .source").insertAdjacentHTML(
      "beforeend",
      '<a href="https://www.cambridgeinternational.org/Images/417318-list-of-formulae-and-statistical-tables.pdf#page=12" target="_blank" rel="noopener">MF19 table ↗</a>',
    );
  }
  $("#fig-no").textContent = "FIG. " + String(current + 1).padStart(2, "0");
  $("#fig-label").textContent = s.figure;
  s.draw();
  $("#back").disabled = current === 0;
  $("#progress").textContent = `Step ${current + 1} of ${steps.length}`;
  $("#next").textContent =
    current === steps.length - 1
      ? "Restart lesson ↺"
      : current === steps.length - 2
        ? "Finish lesson →"
        : "Continue →";
  if (focus) {
    $("#title").focus({ preventScroll: true });
    if (
      $("#lesson").getBoundingClientRect().top < 0 ||
      window.innerWidth <= 800
    )
      $("#lesson").scrollIntoView({ block: "start" });
  }
}
$("#back").onclick = () => go(Math.max(0, current - 1));
$("#next").onclick = () => go((current + 1) % steps.length);
window.addEventListener("hashchange", () => {
  current = pageFromHash();
  render(true);
});
render();
