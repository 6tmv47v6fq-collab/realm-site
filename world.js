/* ============================================================
   REALM — the 3D world.

   Each sector is an enclosed chamber you fly around inside. The walls
   are real: you cannot leave, and the beings cannot either.

   Nothing here needs editing — sectors, lore and rarity come from
   data.js, and the beings' appearance from forms.js.
   ============================================================ */

(() => {
  "use strict";

  const $ = s => document.querySelector(s);

  const fail = msg => {
    const el = $("#fail");
    el.querySelector("p").textContent = msg;
    el.classList.add("show");
  };

  if (!window.THREE) {
    fail("The 3D engine could not load. Check your connection, or use the flat realm instead.");
    return;
  }

  const canvas = $("#world");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  } catch (e) {
    fail("This browser can't show 3D graphics. The flat realm works everywhere.");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const { makeForm, seeded } = window.RealmForms;

  /* ---------- the shape of each sector ----------
     box  — a hall, w × h × d
     cyl  — a round chamber, radius r, height h
     tube — a corridor of radius r running d deep     */
  const SHAPES = [
    { kind: "tube", r: 24, d: 150 },   // The Threshold — a passage of gates
    { kind: "cyl",  r: 46, h: 46 },    // The Chrysanthemum
    { kind: "cyl",  r: 50, h: 50 },    // The Dome
    { kind: "box",  w: 80, h: 38, d: 80 }, // The Elf Workshop
    { kind: "box",  w: 84, h: 38, d: 84 }, // The Jester's Court
    { kind: "tube", r: 20, d: 180 },   // The Hyperspace Corridor
    { kind: "box",  w: 100, h: 30, d: 100 }, // The Fractal Sea
    { kind: "box",  w: 56, h: 42, d: 130 },  // The Temple of Geometry
    { kind: "cyl",  r: 46, h: 54 },    // The Loom
    { kind: "cyl",  r: 38, h: 40 }     // The Source
  ];

  /* ---------- scene ---------- */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 500);
  camera.rotation.order = "YXZ";
  const clock  = new THREE.Clock();

  let sector = ROUND - 1;
  let shape  = SHAPES[sector];
  let env    = new THREE.Group();
  let swarm  = new THREE.Group();
  scene.add(env, swarm);

  const view = { yaw: 0, pitch: -0.05, drift: true };
  const pos  = new THREE.Vector3();
  const dir  = new THREE.Vector3();

  const hsl = (h, s, l) => new THREE.Color().setHSL(((h % 360) + 360) % 360 / 360, s, l);

  function lines(points, color, opacity) {
    return new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
  }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  function box(w, h, d, x, y, z, color, opacity) {
    const m = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
    m.position.set(x, y, z);
    return m;
  }

  /* ---------- the shell: floor, ceiling and walls ----------
     This is what makes a sector feel sealed rather than open. */
  function buildShell(sh, c1, c2) {
    const g = new THREE.Group();
    const pts = [], cap = [];
    const STEP = 6;

    if (sh.kind === "box") {
      const w = sh.w / 2, h = sh.h, d = sh.d / 2;

      for (let x = -w; x <= w; x += STEP) {            // floor + ceiling
        pts.push(V(x, 0, -d), V(x, 0, d));
        cap.push(V(x, h, -d), V(x, h, d));
      }
      for (let z = -d; z <= d; z += STEP) {
        pts.push(V(-w, 0, z), V(w, 0, z));
        cap.push(V(-w, h, z), V(w, h, z));
      }
      for (let x = -w; x <= w; x += STEP) {            // front + back walls
        cap.push(V(x, 0, -d), V(x, h, -d), V(x, 0, d), V(x, h, d));
      }
      for (let z = -d; z <= d; z += STEP) {            // left + right walls
        cap.push(V(-w, 0, z), V(-w, h, z), V(w, 0, z), V(w, h, z));
      }
      for (let y = 0; y <= h; y += STEP) {
        cap.push(V(-w, y, -d), V(w, y, -d), V(-w, y, d), V(w, y, d));
        cap.push(V(-w, y, -d), V(-w, y, d), V(w, y, -d), V(w, y, d));
      }

    } else if (sh.kind === "cyl") {
      const r = sh.r, h = sh.h, SIDES = 40;

      for (let i = 0; i < SIDES; i++) {                // vertical ribs
        const a = (i / SIDES) * Math.PI * 2;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        cap.push(V(x, 0, z), V(x, h, z));
        pts.push(V(0, 0, 0), V(x, 0, z));              // floor spokes
        cap.push(V(0, h, 0), V(x, h, z));              // ceiling spokes
      }
      for (let y = 0; y <= h; y += STEP) {             // hoops up the wall
        for (let i = 0; i < SIDES; i++) {
          const a = (i / SIDES) * Math.PI * 2, b = ((i + 1) / SIDES) * Math.PI * 2;
          cap.push(V(Math.cos(a) * r, y, Math.sin(a) * r),
                   V(Math.cos(b) * r, y, Math.sin(b) * r));
        }
      }
      for (let k = 1; k <= 7; k++) {                   // rings on the floor
        const rr = (k / 7) * r;
        for (let i = 0; i < SIDES; i++) {
          const a = (i / SIDES) * Math.PI * 2, b = ((i + 1) / SIDES) * Math.PI * 2;
          pts.push(V(Math.cos(a) * rr, 0, Math.sin(a) * rr),
                   V(Math.cos(b) * rr, 0, Math.sin(b) * rr));
        }
      }

    } else {                                            // tube
      const r = sh.r, d = sh.d / 2, SIDES = 26;

      for (let z = -d; z <= d; z += STEP) {             // hoops down the tube
        for (let i = 0; i < SIDES; i++) {
          const a = (i / SIDES) * Math.PI * 2, b = ((i + 1) / SIDES) * Math.PI * 2;
          cap.push(V(Math.cos(a) * r, Math.sin(a) * r + r, z),
                   V(Math.cos(b) * r, Math.sin(b) * r + r, z));
        }
      }
      for (let i = 0; i < SIDES; i++) {                 // rails along its length
        const a = (i / SIDES) * Math.PI * 2;
        pts.push(V(Math.cos(a) * r, Math.sin(a) * r + r, -d),
                 V(Math.cos(a) * r, Math.sin(a) * r + r, d));
      }
      for (const end of [-d, d]) {                      // the sealed ends
        for (let k = 1; k <= 6; k++) {
          const rr = (k / 6) * r;
          for (let i = 0; i < SIDES; i++) {
            const a = (i / SIDES) * Math.PI * 2, b = ((i + 1) / SIDES) * Math.PI * 2;
            cap.push(V(Math.cos(a) * rr, Math.sin(a) * rr + r, end),
                     V(Math.cos(b) * rr, Math.sin(b) * rr + r, end));
          }
        }
      }
    }

    g.add(lines(pts, c1, 0.22));
    g.add(lines(cap, c2, 0.15));
    return g;
  }

  /* is this point inside the chamber? pull it back if not */
  function confine(p, sh, margin) {
    let hit = false;
    if (sh.kind === "box") {
      const w = sh.w / 2 - margin, d = sh.d / 2 - margin;
      if (p.x < -w) { p.x = -w; hit = true; } if (p.x > w) { p.x = w; hit = true; }
      if (p.z < -d) { p.z = -d; hit = true; } if (p.z > d) { p.z = d; hit = true; }
      if (p.y < margin) { p.y = margin; hit = true; }
      if (p.y > sh.h - margin) { p.y = sh.h - margin; hit = true; }

    } else if (sh.kind === "cyl") {
      const r = sh.r - margin;
      const rad = Math.hypot(p.x, p.z);
      if (rad > r) { p.x *= r / rad; p.z *= r / rad; hit = true; }
      if (p.y < margin) { p.y = margin; hit = true; }
      if (p.y > sh.h - margin) { p.y = sh.h - margin; hit = true; }

    } else {
      const r = sh.r - margin, d = sh.d / 2 - margin;
      const cy = p.y - sh.r;
      const rad = Math.hypot(p.x, cy);
      if (rad > r) { p.x *= r / rad; p.y = sh.r + cy * (r / rad); hit = true; }
      if (p.z < -d) { p.z = -d; hit = true; } if (p.z > d) { p.z = d; hit = true; }
    }
    return hit;
  }

  /* a random point well inside the chamber */
  function inside(sh, rnd) {
    if (sh.kind === "box")
      return V((rnd() - 0.5) * sh.w * 0.82, 2 + rnd() * (sh.h - 5), (rnd() - 0.5) * sh.d * 0.82);
    if (sh.kind === "cyl") {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * sh.r * 0.84;
      return V(Math.cos(a) * r, 2 + rnd() * (sh.h - 5), Math.sin(a) * r);
    }
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * sh.r * 0.78;
    return V(Math.cos(a) * r, sh.r + Math.sin(a) * r, (rnd() - 0.5) * sh.d * 0.88);
  }

  /* ---------- what stands inside each sector ---------- */
  function furnish(i, sh, c1, c2) {
    const g = new THREE.Group();

    switch (i) {
      case 0:  // gateways down the passage
        for (let k = 0; k < 12; k++) {
          const z = sh.d / 2 - 8 - k * 12, s = 13 - k * 0.15;
          g.add(box(s * 1.6, s * 1.5, 0.4, 0, sh.r, z, k % 2 ? c1 : c2, 0.55 - k * 0.03));
        }
        break;

      case 1:  // petals opening
        for (let k = 0; k < 10; k++) {
          const r = new THREE.Mesh(
            new THREE.TorusGeometry(7 + k * 3.6, 0.13, 4, 28),
            new THREE.MeshBasicMaterial({ color: k % 2 ? c1 : c2, transparent: true, opacity: 0.5 }));
          r.rotation.set(Math.PI / 2 + k * 0.11, k * 0.38, 0);
          r.position.y = 4 + k * 1.2;
          g.add(r);
        }
        break;

      case 2:  // the watchers around the dome
        for (let k = 0; k < 24; k++) {
          const a = (k / 24) * Math.PI * 2;
          g.add(box(2.2, 24, 2.2, Math.cos(a) * (sh.r - 5), 12, Math.sin(a) * (sh.r - 5), c1, 0.45));
        }
        break;

      case 3:  // machines stacked high
        for (let k = 0; k < 80; k++) {
          const a = Math.random() * Math.PI * 2, r = 8 + Math.random() * (sh.w / 2 - 12);
          const s = 1.6 + Math.random() * 4.5;
          g.add(box(s, s, s, Math.cos(a) * r, 1 + Math.random() * (sh.h - 6), Math.sin(a) * r,
                    Math.random() < 0.5 ? c1 : c2, 0.5));
        }
        break;

      case 4:  // tilted columns of the court
        for (let k = 0; k < 18; k++) {
          const a = (k / 18) * Math.PI * 2, r = sh.w / 2 - 9;
          const p = box(2, sh.h - 4, 2, Math.cos(a) * r, (sh.h - 4) / 2, Math.sin(a) * r,
                        k % 2 ? c1 : c2, 0.5);
          p.rotation.z = (k % 2 ? 1 : -1) * 0.13;
          g.add(p);
        }
        break;

      case 5:  // rings rushing down the corridor
        for (let k = 0; k < 26; k++) {
          const m = new THREE.Mesh(
            new THREE.TorusGeometry(sh.r - 3, 0.16, 4, 24),
            new THREE.MeshBasicMaterial({ color: k % 3 ? c1 : c2, transparent: true, opacity: 0.45 }));
          m.position.set(0, sh.r, sh.d / 2 - 6 - k * 6.6);
          g.add(m);
        }
        break;

      case 6:  // the sea's own surface
        for (let row = -9; row <= 9; row++) {
          const pts = [];
          for (let x = -sh.w / 2 + 4; x <= sh.w / 2 - 4; x += 4) {
            const y1 = Math.sin(x * 0.08 + row * 0.5) * 2.2 + Math.cos(row * 0.32) * 1.6 + 5;
            const y2 = Math.sin((x + 4) * 0.08 + row * 0.5) * 2.2 + Math.cos(row * 0.32) * 1.6 + 5;
            pts.push(V(x, y1, row * 5), V(x + 4, y2, row * 5));
          }
          g.add(lines(pts, row % 2 ? c1 : c2, 0.36));
        }
        break;

      case 7:  // the colonnade
        for (let side = -1; side <= 1; side += 2)
          for (let k = 0; k < 10; k++) {
            const z = sh.d / 2 - 8 - k * 12;
            g.add(box(3, sh.h - 6, 3, side * 17, (sh.h - 6) / 2, z, c1, 0.5));
            g.add(box(3, 1.3, 9, side * 17, sh.h - 6, z - 4, c2, 0.4));
          }
        for (let k = 0; k < 10; k++)
          g.add(box(37, 1.3, 3, 0, sh.h - 5, sh.d / 2 - 8 - k * 12, c2, 0.32));
        break;

      case 8:  // the hanging threads
        for (let k = 0; k < 130; k++) {
          const a = Math.random() * Math.PI * 2, r = 5 + Math.random() * (sh.r - 8);
          const x = Math.cos(a) * r, z = Math.sin(a) * r;
          g.add(lines([V(x, 0, z), V(x, sh.h - 1, z)],
                      Math.random() < 0.5 ? c1 : c2, 0.22));
        }
        break;

      default: // light without a lamp
        for (let k = 1; k <= 14; k++) {
          const rr = (k / 14) * (sh.r - 4), SIDES = 34, pts = [];
          for (let n = 0; n < SIDES; n++) {
            const a = (n / SIDES) * Math.PI * 2, b = ((n + 1) / SIDES) * Math.PI * 2;
            pts.push(V(Math.cos(a) * rr, 0, Math.sin(a) * rr),
                     V(Math.cos(b) * rr, 0, Math.sin(b) * rr));
          }
          const halo = lines(pts, k % 2 ? c1 : c2, 0.45 - k * 0.02);
          halo.position.y = sh.h / 2;
          halo.rotation.x = k * 0.06;
          g.add(halo);
        }
        break;
    }
    return g;
  }

  /* ---------- the beings ---------- */
  const tierOf = [];
  TIERS.forEach(t => { for (let n = 0; n < t.count; n++) tierOf.push(t.key); });

  const SCALE = { common: 1.5, uncommon: 1.9, rare: 2.5, epic: 3.4,
                  legendary: 4.6, mythic: 6, entity: 7.8, god: 11 };

  function makeBeings(index, sh) {
    const rnd   = seeded(index * 7919 + 13);
    const order = tierOf.slice();
    for (let a = order.length - 1; a > 0; a--) {
      const b = Math.floor(rnd() * (a + 1));
      [order[a], order[b]] = [order[b], order[a]];
    }

    const group = new THREE.Group(), list = [];

    order.forEach((key, n) => {
      const tier  = TIERS.find(t => t.key === key);
      const being = {
        id: index * SUPPLY_PER_ROUND + n + 1,
        n: n + 1, tier: key, tierName: tier.name, color: tier.color
      };
      being.form = makeForm(being);

      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(being.form),
        transparent: true, fog: false,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));

      const s = SCALE[key];
      sp.scale.set(s, s, 1);

      const p = inside(sh, rnd);
      confine(p, sh, s);
      sp.position.copy(p);

      sp.userData.being = being;
      sp.userData.bob   = { phase: rnd() * 6.3, speed: 0.2 + rnd() * 0.5, amp: 0.3 + rnd() * 1.2 };
      sp.userData.home  = sp.position.clone();

      group.add(sp);
      list.push(sp);
    });

    return { group, list };
  }

  let sprites = [];

  /* ---------- entering a sector ---------- */
  function enter(i) {
    if (i >= ROUND) {
      $("#sector-title").textContent = "Sealed";
      $("#sector-sub").textContent   = `Sector ${i + 1} opens in round ${i + 1}`;
      setTimeout(() => enter(sector), 1700);
      return;
    }

    sector = i;
    shape  = SHAPES[i];

    scene.remove(env, swarm);
    env.traverse(o => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose(); });
    swarm.traverse(o => {
      if (o.material) { o.material.map && o.material.map.dispose(); o.material.dispose(); }
    });

    const hue = SECTORS[i].hue;
    const c1  = hsl(hue, 0.85, 0.6);
    const c2  = hsl(hue + 45, 0.8, 0.62);

    env = new THREE.Group();
    env.add(buildShell(shape, c1, c2));
    env.add(furnish(i, shape, c1, c2));

    const made = makeBeings(i, shape);
    swarm   = made.group;
    sprites = made.list;
    scene.add(env, swarm);

    scene.fog = new THREE.FogExp2(hsl(hue, 0.7, 0.05).getHex(), 0.0085);
    renderer.setClearColor(hsl(hue, 0.65, 0.03).getHex(), 1);

    // stand just inside the near end, looking in
    if (shape.kind === "tube") pos.set(0, shape.r, shape.d / 2 - 12);
    else if (shape.kind === "cyl") pos.set(0, shape.h * 0.4, shape.r - 10);
    else pos.set(0, shape.h * 0.4, shape.d / 2 - 10);

    view.yaw = Math.PI; view.pitch = -0.04; view.drift = true;
    select(null);
    setDrift();

    $("#sector-title").textContent = SECTORS[i].name;
    $("#sector-sub").textContent   = `Sector ${i + 1} · ${SUPPLY_PER_ROUND} beings`;
    $("#lore-text").textContent    = SECTORS[i].lore;
    document.querySelectorAll(".dot").forEach((d, k) => d.classList.toggle("here", k === i));
  }

  /* ---------- selecting a being ---------- */
  let chosen = null;

  function select(sp) {
    if (chosen && chosen !== sp) {
      const was = SCALE[chosen.userData.being.tier];
      chosen.scale.set(was, was, 1);
    }
    chosen = sp;

    const card = $("#being");
    if (!sp) {
      card.classList.remove("show");
      document.body.classList.remove("picking");
      return;
    }
    view.drift = false;
    setDrift();

    const b = sp.userData.being;
    card.innerHTML = `
      <button class="close" aria-label="Close">&times;</button>
      <p class="being-tier" style="color:${b.color}">${b.tierName}</p>
      <h3>Being #${b.id}</h3>
      <p class="where">${SECTORS[sector].name} &middot; ${b.n} of ${SUPPLY_PER_ROUND}</p>
      <div class="unrevealed" style="--c:${b.color}">
        <img src="${b.form.toDataURL()}" alt="">
        <span>UNREVEALED</span>
      </div>
      <p class="note">This being has not been drawn out of the realm yet.
         It takes its form when its sector is minted.</p>`;
    card.classList.add("show");
    document.body.classList.add("picking");
    card.querySelector(".close").onclick = () => select(null);
  }

  /* ---------- input ---------- */
  const ray = new THREE.Raycaster();
  let dragging = false, moved = 0, lastX = 0, lastY = 0;

  canvas.addEventListener("pointerdown", e => {
    dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    view.yaw   -= dx * 0.0042;
    view.pitch  = Math.max(-1.1, Math.min(1.1, view.pitch - dy * 0.0035));
  });

  canvas.addEventListener("pointerup", e => {
    dragging = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    if (moved > 9) return;

    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    const hits = ray.intersectObjects(sprites, false);
    select(hits.length ? hits[0].object : null);
  });

  /* ---------- move / stop ---------- */
  const driftBtn = $("#drift");
  function setDrift() {
    driftBtn.textContent = view.drift ? "Stop" : "Move";
    driftBtn.classList.toggle("moving", view.drift);
  }
  driftBtn.onclick = () => { view.drift = !view.drift; setDrift(); };

  /* ---------- the wall ---------- */
  const edge = $("#edge");
  let edgeUntil = 0;
  function hitWall(t) {
    if (t < edgeUntil) return;
    edgeUntil = t + 2.6;
    edge.classList.add("show");
    setTimeout(() => edge.classList.remove("show"), 1500);
  }

  /* ---------- resize ---------- */
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener("resize", resize);

  /* ---------- loop ---------- */
  let running = true;
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) { clock.getDelta(); requestAnimationFrame(tick); }
  });

  function tick() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t  = clock.elapsedTime;

    camera.rotation.y = view.yaw;
    camera.rotation.x = view.pitch;

    if (view.drift) {
      camera.getWorldDirection(dir);
      pos.addScaledVector(dir, dt * 11);
      if (confine(pos, shape, 3)) hitWall(t);
    }
    camera.position.copy(pos);

    for (const sp of sprites) {
      const b = sp.userData.bob;
      sp.position.y = sp.userData.home.y + Math.sin(t * b.speed + b.phase) * b.amp;
      if (sp === chosen) {
        const s = SCALE[sp.userData.being.tier] * (1 + Math.sin(t * 5) * 0.09);
        sp.scale.set(s, s, 1);
      }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  /* ---------- sector strip ---------- */
  const strip = $("#sectors");
  SECTORS.forEach((s, i) => {
    const open = i < ROUND;
    const b = document.createElement("button");
    b.className = "dot" + (open ? "" : " locked");
    b.textContent = i + 1;
    b.setAttribute("aria-label", open ? s.name : `Sector ${i + 1}, sealed`);
    b.onclick = () => enter(i);
    strip.appendChild(b);
  });

  const lorePanel = $("#lore");
  $("#lore-btn").onclick = () => lorePanel.classList.toggle("show");
  lorePanel.querySelector(".close").onclick = () => lorePanel.classList.remove("show");

  /* ---------- go ---------- */
  try {
    resize();
    enter(sector);
    requestAnimationFrame(tick);
  } catch (e) {
    fail("Something went wrong building the realm: " + e.message);
  }
})();
