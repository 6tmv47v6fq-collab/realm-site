/* ============================================================
   REALM — homepage rendering.

   Nothing to edit here. All the settings, sectors and rarity tiers
   live in data.js.
   ============================================================ */

const round = ROUND;
const current = SECTORS[round - 1];

/* --- little helpers --- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const svgEl = t => document.createElementNS("http://www.w3.org/2000/svg", t);

/* --- text placeholders --- */
$$("[data-round]").forEach(n => n.textContent = round);
$$("[data-sector-name]").forEach(n => n.textContent = current.name);
$$("[data-supply]").forEach(n => n.textContent = SUPPLY_PER_ROUND);
$$("[data-minted]").forEach(n => n.textContent = CONFIG.minted);

/* --- mint --- */
const bar = $("[data-bar]");
if (bar) {
  const pct = Math.min(100, (CONFIG.minted / SUPPLY_PER_ROUND) * 100);
  requestAnimationFrame(() => bar.style.width = pct + "%");
}

let qty = 1;
const qtyEl = $("[data-qty]");
$$(".step").forEach(btn => btn.addEventListener("click", () => {
  qty = Math.min(3, Math.max(1, qty + Number(btn.dataset.step)));
  qtyEl.textContent = qty;
}));

const mintBtn  = $("[data-mint-btn]");
const mintNote = $("[data-mint-note]");
if (CONFIG.mintLink) {
  mintBtn.href = CONFIG.mintLink;
  mintBtn.target = "_blank";
  mintBtn.rel = "noopener";
  mintBtn.textContent = "Mint on the launchpad";
  mintNote.textContent = "Opens the official mint page. Connect your Solana wallet there.";
} else {
  mintBtn.classList.add("disabled");
  mintBtn.textContent = "Mint opens soon";
  mintNote.textContent = "The gate for this round has not been opened yet.";
}

/* --- social links --- */
Object.entries(CONFIG.links).forEach(([key, url]) => {
  const el = $(`[data-link="${key}"]`);
  if (!el) return;
  if (url) { el.href = url; el.target = "_blank"; el.rel = "noopener"; }
  else el.remove();
});

/* --- spiral map ---
   Nine sectors sit on an inward spiral; the tenth (The Source) is the centre. */
const CX = 210, CY = 210;          // centre of the 420x420 map
const R_START = 185, R_END = 58;   // outer and innermost sector radius
const SWEEP = 480;                 // total degrees turned, outer to inner

const spiralPoint = t => {         // t: 0 at the rim, 1 at the innermost sector
  const a = (-90 + SWEEP * t) * Math.PI / 180;
  const r = R_START + (R_END - R_START) * t;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};

const POS = [];
for (let i = 0; i < 9; i++) POS.push(spiralPoint(i / 8));
POS.push([CX, CY]);                // The Source

/* draw the spiral as a smooth curve, then tuck it into the centre */
const spiral = $(".spiral");
if (spiral) {
  const pts = [];
  for (let s = 0; s <= 240; s++) pts.push(spiralPoint(s / 240));
  pts.push([CX, CY]);
  spiral.setAttribute("points", pts.map(p => p.map(n => n.toFixed(1)).join(",")).join(" "));
}

const nodesG = $(".nodes");
const panel  = $("#sector-panel");

SECTORS.forEach((sector, i) => {
  const [x, y] = POS[i];
  const open = i < round;
  const isCurrent = i === round - 1;

  const g = svgEl("g");
  g.setAttribute("class", `node ${open ? "open" : "locked"}${isCurrent ? " current" : ""}`);

  if (isCurrent) {
    const halo = svgEl("circle");
    halo.setAttribute("cx", x); halo.setAttribute("cy", y); halo.setAttribute("r", 22);
    halo.setAttribute("fill", "none");
    halo.setAttribute("stroke", "var(--gold)");
    halo.setAttribute("stroke-width", ".8");
    halo.setAttribute("class", "pulse");
    g.appendChild(halo);
  }

  const ring = svgEl("circle");
  ring.setAttribute("cx", x); ring.setAttribute("cy", y); ring.setAttribute("r", 15);
  ring.setAttribute("stroke-width", "1.4");
  ring.setAttribute("class", "ring");
  g.appendChild(ring);

  const num = svgEl("text");
  num.setAttribute("x", x); num.setAttribute("y", y);
  num.setAttribute("class", "num");
  num.textContent = i + 1;
  g.appendChild(num);

  const hit = svgEl("circle");
  hit.setAttribute("cx", x); hit.setAttribute("cy", y); hit.setAttribute("r", 24);
  hit.setAttribute("fill", "transparent");
  hit.style.cursor = "pointer";
  g.appendChild(hit);

  g.addEventListener("click", () => showSector(i, g));
  nodesG.appendChild(g);
});

function showSector(i, g) {
  $$(".node").forEach(n => n.classList.remove("selected"));
  g.classList.add("selected");

  const sector = SECTORS[i];
  const open = i < round;

  panel.innerHTML = open
    ? `<h3>${i + 1}. ${sector.name}</h3>
       <p class="status">Open &middot; Round ${i + 1}</p>
       <p>${sector.lore}</p>`
    : `<h3>Sector ${i + 1}</h3>
       <p class="status sealed">Sealed</p>
       <p>This sector opens in round ${i + 1}. Until then the fog holds, and what lives inside it has no name yet.</p>`;
}

/* --- rarity tiers --- */
const tiersEl = $(".tiers");
TIERS.forEach(t => {
  const el = document.createElement("div");
  el.className = "tier";
  el.style.setProperty("--c", `var(--t-${t.key})`);
  el.innerHTML = `<span class="dot"></span>
                  <span class="name">${t.name}</span>
                  <span class="count"><b>${t.count}</b>per round</span>`;
  tiersEl.appendChild(el);
});

/* --- lore chapters --- */
const chaptersEl = $(".chapters");
SECTORS.forEach((sector, i) => {
  const open = i < round;
  const el = document.createElement("article");
  el.className = "chapter" + (open ? "" : " sealed");
  el.innerHTML = `<p class="meta">Chapter ${i + 1}</p>
                  <h3>${open ? sector.name : "Sector " + (i + 1)}</h3>
                  <p class="body">${sector.lore}</p>`;
  chaptersEl.appendChild(el);
});

/* --- roadmap --- */
const timeline = $(".timeline");
SECTORS.forEach((sector, i) => {
  const state = i < round - 1 ? "done" : i === round - 1 ? "now" : "";
  const li = document.createElement("li");
  li.className = state;
  li.innerHTML = `<span class="r">Round ${i + 1}${state === "now" ? " &middot; live" : ""}</span>
                  <span class="s">${i < round ? sector.name : "Sealed sector"}</span>
                  <span class="d">111 beings &middot; max 3 per wallet</span>`;
  timeline.appendChild(li);
});

/* open the live sector by default */
showSector(round - 1, $$(".node")[round - 1]);
