/* ============================================================
   THE REALM — the living map.

   111 beings drift in each sector. Before the mint they are sealed
   forms, glowing in their rarity's colour. After the mint they become
   the real NFTs. See "GOING LIVE" at the bottom of this file.

   You should not need to edit anything here. Sector names, lore and
   rarity all come from data.js.
   ============================================================ */

(() => {
  "use strict";

  const canvas = document.getElementById("realm");
  const ctx    = canvas.getContext("2d", { alpha: false });

  const $ = s => document.querySelector(s);

  /* shared with the 3D world — see forms.js */
  const { seeded, hexA, TIER_STYLE, FORM, makeForm, buildSprites, SPRITE } = window.RealmForms;

  

  

  

  

  /* forms are built per sector and released when you leave, so only
     111 of them ever sit in memory at once */
  function buildForms(list) {
    SECTOR_BEINGS.forEach(s => s.forEach(b => { b.form = null; }));
    list.forEach(b => { b.form = makeForm(b); });
  }

  

  /* ---------- build a sector's 111 beings ---------- */
  const tierOf = [];                        // 111 tier-keys, rarest last
  TIERS.forEach(t => { for (let i = 0; i < t.count; i++) tierOf.push(t.key); });

  function makeSector(index) {
    const rnd = seeded(index * 7919 + 13);
    const order = tierOf.slice();

    // deterministic shuffle so numbering isn't tier-ordered
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    return order.map((key, i) => ({
      id: index * SUPPLY_PER_ROUND + i + 1,   // #1-#1110 across the collection
      n: i + 1,                               // #1-#111 within the sector
      tier: key,
      tierName: TIERS.find(t => t.key === key).name,
      color: TIERS.find(t => t.key === key).color,
      x: 0.12 + rnd() * 0.76, y: 0.16 + rnd() * 0.58,   // 0-1, scaled to the canvas
      z: 0.55 + rnd() * 0.45,                 // depth: nearer = bigger
      dir: rnd() * Math.PI * 2,
      vx: 0, vy: 0,
      phase: rnd() * Math.PI * 2,             // pulse offset
      spin: rnd() * Math.PI * 2,
      wob: 0.6 + rnd() * 0.8
    }));
  }

  const SECTOR_BEINGS = SECTORS.map((_, i) => makeSector(i));

  /* ---------- state ---------- */
  let sector   = ROUND - 1;      // which sector we're standing in
  let beings   = SECTOR_BEINGS[sector];
  let selected = null;
  let W = 0, H = 0, DPR = 1;
  let t0 = 0, running = true;

  /* ---------- sizing ---------- */
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width  = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener("resize", resize);

  /* ---------- background ---------- */
  function drawSky(time) {
    const hue = SECTORS[sector].hue;

    ctx.fillStyle = "#04020a";
    ctx.fillRect(0, 0, W, H);

    const g = ctx.createRadialGradient(W/2, H*0.45, 0, W/2, H*0.45, Math.max(W, H) * 0.75);
    g.addColorStop(0,   `hsla(${hue},70%,45%,0.30)`);
    g.addColorStop(0.45,`hsla(${hue + 40},65%,35%,0.13)`);
    g.addColorStop(1,   "rgba(4,2,10,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // slow sacred geometry, turning behind everything
    const cx = W/2, cy = H*0.45, r = Math.min(W, H) * 0.42;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time * 0.00002);
    ctx.strokeStyle = `hsla(${hue},80%,70%,0.10)`;
    ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const rr = r * (1 - k * 0.22);
        i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
          : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.stroke();
    }
    ctx.rotate(-time * 0.00005);
    ctx.strokeStyle = `hsla(${hue + 60},80%,70%,0.08)`;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- movement ---------- */
  /* Beings stay inside a "stage" that avoids the title at the top and the
     controls at the bottom, so nothing important is ever drifted over. */
  function stage() {
    return {
      l: 46 / W,
      r: 1 - 46 / W,
      t: Math.min(0.26, 132 / H),
      b: 1 - Math.min(0.32, 186 / H)
    };
  }

  function step(being, dt) {
    const st = TIER_STYLE[being.tier];
    const s = stage();

    // wander: drift the heading a little each frame
    being.dir += (Math.random() - 0.5) * 0.09 * being.wob;

    const sp = st.speed * 0.00016;
    being.vx += Math.cos(being.dir) * sp * dt;
    being.vy += Math.sin(being.dir) * sp * dt;

    // drag, so nothing ever races off
    being.vx *= 0.985;
    being.vy *= 0.985;

    being.x += being.vx * dt * 0.06;
    being.y += being.vy * dt * 0.06;

    // soft walls: ease back toward the stage rather than bounce
    const push = 0.0022 * dt * 0.06;
    if (being.x < s.l) { being.vx += push; being.dir = Math.random() * Math.PI * 2; }
    if (being.x > s.r) { being.vx -= push; being.dir = Math.random() * Math.PI * 2; }
    if (being.y < s.t) { being.vy += push; being.dir = Math.random() * Math.PI * 2; }
    if (being.y > s.b) { being.vy -= push; being.dir = Math.random() * Math.PI * 2; }

    being.x = Math.min(s.r + 0.03, Math.max(s.l - 0.03, being.x));
    being.y = Math.min(s.b + 0.03, Math.max(s.t - 0.03, being.y));
    being.spin += 0.00016 * dt;
  }

  /* ---------- one being ---------- */
  function draw(being, time) {
    const st = TIER_STYLE[being.tier];
    const px = being.x * W;
    const py = being.y * H;

    const pulse = 1 + Math.sin(time * 0.0016 + being.phase) * 0.14;
    const scale = being.z * pulse;

    // bloom underneath
    const glow = st.glow * scale;
    ctx.globalAlpha = 0.4;
    ctx.drawImage(SPRITE[being.tier], px - glow, py - glow, glow * 2, glow * 2);
    ctx.globalAlpha = 1;

    // the being's own form, turning slowly
    if (being.form) {
      const d = st.size * scale * 3.5;
      if (st.turn) {                       // only the rare ones turn
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(being.spin * (being.n % 2 ? 1 : -1));
        ctx.drawImage(being.form, -d, -d, d * 2, d * 2);
        ctx.restore();
      } else {
        ctx.drawImage(being.form, px - d, py - d, d * 2, d * 2);
      }
    }

    if (selected === being) {
      ctx.strokeStyle = "rgba(255,255,255,.85)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, st.size * scale * 4.4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /* ---------- the loop ---------- */
  function frame(time) {
    if (!running) return;
    const dt = Math.min(time - t0, 50) || 16;
    t0 = time;

    drawSky(time);

    ctx.globalCompositeOperation = "lighter";
    // paint far ones first so near ones sit on top
    const order = beings.slice().sort((a, b) => a.z - b.z);
    for (const b of order) { step(b, dt); draw(b, time); }
    ctx.globalCompositeOperation = "source-over";

    requestAnimationFrame(frame);
  }

  /* pause when the tab is hidden — saves a lot of phone battery */
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) { t0 = performance.now(); requestAnimationFrame(frame); }
  });

  /* ---------- tapping a being ---------- */
  canvas.addEventListener("pointerdown", e => {
    const r = canvas.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;

    let best = null, bestD = 34;          // generous target for fingers
    for (const b of beings) {
      const d = Math.hypot(b.x * W - px, b.y * H - py);
      const reach = Math.max(20, TIER_STYLE[b.tier].size * b.z * 3.6);
      if (d < reach && d < bestD) { best = b; bestD = d; }
    }
    selected = best;
    showBeing(best);
  });

  function showBeing(b) {
    const card = $("#being");
    if (!b) { card.classList.remove("show"); document.body.classList.remove("picking"); return; }

    const live = b.live;                   // filled in once the mint is done
    card.innerHTML = `
      <button class="close" aria-label="Close">&times;</button>
      <p class="being-tier" style="color:${b.color}">${b.tierName}</p>
      <h3>Being #${b.id}</h3>
      <p class="where">${SECTORS[sector].name} &middot; ${b.n} of ${SUPPLY_PER_ROUND}</p>
      ${live
        ? `<img class="art" src="${live.image}" alt="Being #${b.id}">
           <p class="owner">Held by <span>${live.owner}</span></p>`
        : `<div class="unrevealed" style="--c:${b.color}">
             ${b.form ? `<img src="${b.form.toDataURL()}" alt="">` : ""}
             <span>UNREVEALED</span>
           </div>
           <p class="note">This being has not been drawn out of the realm yet.
              It takes its form when its sector is minted.</p>`}`;
    card.classList.add("show");
    document.body.classList.add("picking");
    card.querySelector(".close").onclick = () => {
      selected = null;
      card.classList.remove("show");
      document.body.classList.remove("picking");
    };
  }

  /* ---------- moving between sectors ---------- */
  function enter(i) {
    if (i >= ROUND) return;                 // sealed
    sector   = i;
    beings   = SECTOR_BEINGS[i];
    buildForms(beings);
    selected = null;
    $("#being").classList.remove("show");
    document.body.classList.remove("picking");
    $("#sector-title").textContent = SECTORS[i].name;
    $("#sector-sub").textContent   = `Sector ${i + 1} · ${SUPPLY_PER_ROUND} beings`;
    document.querySelectorAll(".dot").forEach((d, k) =>
      d.classList.toggle("here", k === i));
    const l = $("#lore-text");
    if (l) l.textContent = SECTORS[i].lore;
  }

  /* ---------- build the controls ---------- */
  const strip = $("#sectors");
  SECTORS.forEach((s, i) => {
    const open = i < ROUND;
    const b = document.createElement("button");
    b.className = "dot" + (open ? "" : " locked");
    b.textContent = i + 1;
    b.title = open ? s.name : "Sealed";
    b.setAttribute("aria-label", open ? s.name : `Sector ${i + 1}, sealed`);
    if (open) b.onclick = () => enter(i);
    else b.onclick = () => {
      const t = $("#sector-title");
      t.textContent = "Sealed";
      $("#sector-sub").textContent = `Sector ${i + 1} opens in round ${i + 1}`;
      setTimeout(() => enter(sector), 1600);
    };
    strip.appendChild(b);
  });

  const loreBtn = $("#lore-btn"), lorePanel = $("#lore");
  loreBtn.onclick = () => lorePanel.classList.toggle("show");
  lorePanel.querySelector(".close").onclick = () => lorePanel.classList.remove("show");

  /* ---------- go ---------- */
  buildSprites();
  resize();
  enter(sector);
  requestAnimationFrame(frame);

  /* ============================================================
     GOING LIVE — after your first mint

     Right now every being is a sealed placeholder. To show the real
     NFTs instead, put your collection address and a Helius API key in
     data.js, then delete the word "false &&" from the line below.

     It reads the collection from the chain and matches each NFT to a
     being by its number, so the beings that are minted come alive and
     the rest stay sealed.
     ============================================================ */
  async function loadLiveBeings() {
    if (false && CONFIG.collectionAddress && CONFIG.heliusApiKey) {
      const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${CONFIG.heliusApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: "realm", method: "getAssetsByGroup",
          params: { groupKey: "collection", groupValue: CONFIG.collectionAddress, page: 1, limit: 1000 }
        })
      });
      const { result } = await res.json();
      for (const asset of result.items) {
        const num = parseInt((asset.content?.metadata?.name || "").replace(/\D/g, ""), 10);
        const all = SECTOR_BEINGS.flat();
        const being = all.find(b => b.id === num);
        if (being) being.live = {
          image: asset.content?.links?.image,
          owner: (asset.ownership?.owner || "").slice(0, 4) + "…" +
                 (asset.ownership?.owner || "").slice(-4)
        };
      }
    }
  }
  loadLiveBeings().catch(() => { /* realm stays sealed; never breaks the page */ });
})();
