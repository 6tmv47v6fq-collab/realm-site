/* ============================================================
   REALM — the landing page's behaviour.

   Fills the panels from data.js and opens them over the gate.
   Nothing here needs editing.
   ============================================================ */

(() => {
  "use strict";

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const round   = ROUND;
  const current = SECTORS[round - 1];

  /* ---------- fill in the numbers ---------- */
  $$("[data-round]").forEach(n => n.textContent = round);
  $$("[data-sector-name]").forEach(n => n.textContent = current.name);
  $$("[data-supply]").forEach(n => n.textContent = SUPPLY_PER_ROUND);
  $$("[data-minted]").forEach(n => n.textContent = CONFIG.minted);
  const rl = $("[data-round-label]");
  if (rl) rl.textContent = `round ${round}`;

  /* ---------- what is true right now, on the door ---------- */
  const chapter = $("#st-chapter");
  if (chapter) chapter.textContent = `Round ${round} · ${current.name}`;

  const supply = $("#st-supply");
  if (supply) {
    supply.textContent = CONFIG.minted > 0
      ? `${CONFIG.minted} of ${SUPPLY_PER_ROUND}`
      : `none of ${SUPPLY_PER_ROUND} yet`;
  }

  const status = $("#st-status");
  if (status) {
    const open = !!CONFIG.mintLink;
    status.textContent = open ? "Open" : "Closed";
    status.classList.toggle("shut", !open);
  }

  /* ---------- mint ---------- */
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
    /* nothing to choose while the gate is shut — offering a quantity
       would suggest there is something to take */
    const qtyBox = $(".qty"), limit = $(".limit");
    if (qtyBox) qtyBox.hidden = true;
    if (limit)  limit.hidden = true;
    mintBtn.classList.add("disabled");
    mintBtn.textContent = "The gate is shut";
    mintNote.textContent = "The gate for this round has not been opened yet. "
                         + "When it is, this becomes the only mint link — anything else is not us.";
  }

  /* ---------- links ---------- */
  Object.entries(CONFIG.links).forEach(([key, url]) => {
    const el = $(`[data-link="${key}"]`);
    if (!el) return;
    if (url) { el.href = url; el.target = "_blank"; el.rel = "noopener"; }
    else el.remove();
  });

  /* ---------- the eight tiers ----------
     Each row shows an actual being of that tier rather than a coloured
     dot, drawn by the same generator the chamber uses. */
  const tiersEl = $(".tiers");
  TIERS.forEach((t, i) => {
    const el = document.createElement("div");
    el.className = "tier" + (t.key === "god" ? " god" : "");
    el.style.setProperty("--c", t.color);

    const slot = document.createElement("span");
    slot.className = "form-slot";
    if (window.RealmForms) {
      const form = RealmForms.pixelate(RealmForms.makeForm({
        id: 100 + i, n: i + 1, tier: t.key, tierName: t.name, color: t.color
      }), 14 + i * 2);
      form.style.setProperty("--fs", (21 + i * 3.6).toFixed(0) + "px");
      slot.appendChild(form);
    }
    el.appendChild(slot);

    const rest = document.createElement("span");
    rest.className = "name";
    rest.textContent = t.name;
    el.appendChild(rest);

    const count = document.createElement("span");
    count.className = "count";
    count.innerHTML = t.key === "god"
      ? `<b>1</b>per sector`
      : `<b>${t.count}</b>per round`;
    el.appendChild(count);

    tiersEl.appendChild(el);
  });

  /* ---------- lore ---------- */
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

  /* ---------- rounds ---------- */
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

  /* ---------- panels ---------- */
  let openPanel = null;

  function show(name) {
    const p = $("#p-" + name);
    if (!p) return;
    hide();
    p.hidden = false;
    openPanel = p;
    document.body.style.overflow = "hidden";
    p.scrollTop = 0;
  }

  function hide() {
    if (!openPanel) return;
    openPanel.hidden = true;
    openPanel = null;
    document.body.style.overflow = "";
  }

  $$("[data-open]").forEach(b => b.addEventListener("click", () => show(b.dataset.open)));

  // the journey opens these too
  window.RealmPanels = { show, hide };

  // X is a link when one is configured, and a panel-free no-op otherwise

  $$(".panel-close").forEach(b => b.addEventListener("click", hide));

  document.addEventListener("keydown", e => { if (e.key === "Escape") hide(); });

  // tapping the dimmed area outside the content closes it too
  $$(".panel").forEach(p => p.addEventListener("click", e => {
    if (e.target === p) hide();
  }));
})();
