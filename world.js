/* ============================================================
   REALM — the 3D world.

   Each sector is a place you fly through, with its 111 beings
   floating in it. Drag to look, and you drift forward on your own.

   Nothing here needs editing — sectors, lore and rarity all come
   from data.js, and the beings' appearance from forms.js.
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

  const { makeForm } = window.RealmForms;

  /* ---------- scene ---------- */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 400);
  camera.rotation.order = "YXZ";
  const clock  = new THREE.Clock();

  let sector = ROUND - 1;
  let env    = new THREE.Group();     // the sector's architecture
  let swarm  = new THREE.Group();     // its beings
  scene.add(env, swarm);

  /* ---------- camera control ---------- */
  const view = { yaw: 0, pitch: -0.05, drift: true };
  const pos  = new THREE.Vector3(0, 5, 46);
  const dir  = new THREE.Vector3();
  const BOUND = 78;

  /* ---------- helpers ---------- */
  const hsl = (h, s, l) => new THREE.Color().setHSL(((h % 360) + 360) % 360 / 360, s, l);

  function lines(points, color, opacity) {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.LineSegments(geo,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
  }

  /* a closed ring of points, as line segments */
  function ring(radius, sides, y, z, color, opacity, squash) {
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2, b = ((i + 1) / sides) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, y + Math.sin(a) * radius * (squash || 1), z));
      pts.push(new THREE.Vector3(Math.cos(b) * radius, y + Math.sin(b) * radius * (squash || 1), z));
    }
    return lines(pts, color, opacity);
  }

  function box(w, h, d, x, y, z, color, opacity) {
    const g = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d));
    const m = new THREE.LineSegments(g,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
    m.position.set(x, y, z);
    return m;
  }

  /* the floor, in every sector */
  function floor(color) {
    const pts = [], N = 34, S = 150, step = S / N;
    for (let i = 0; i <= N; i++) {
      const p = -S / 2 + i * step;
      pts.push(new THREE.Vector3(-S / 2, 0, p), new THREE.Vector3(S / 2, 0, p));
      pts.push(new THREE.Vector3(p, 0, -S / 2), new THREE.Vector3(p, 0, S / 2));
    }
    return lines(pts, color, 0.16);
  }

  /* ---------- the ten places ----------
     Each sector is built from cheap neon linework so it stays fast. */
  function build(i) {
    const g   = new THREE.Group();
    const hue = SECTORS[i].hue;
    const c1  = hsl(hue, 0.85, 0.6);
    const c2  = hsl(hue + 45, 0.8, 0.62);

    g.add(floor(c1));

    switch (i) {
      case 0:  // The Threshold — gateways receding into light
        for (let k = 0; k < 14; k++) {
          const z = -k * 11, s = 15 + k * 0.6;
          g.add(box(s * 2, s * 1.5, 0.4, 0, s * 0.75, z, k % 2 ? c1 : c2, 0.5 - k * 0.025));
        }
        break;

      case 1:  // The Chrysanthemum — petals opening without end
        for (let k = 0; k < 11; k++) {
          const r = new THREE.Mesh(
            new THREE.TorusGeometry(9 + k * 4.2, 0.14, 4, 30),
            new THREE.MeshBasicMaterial({ color: k % 2 ? c1 : c2, transparent: true, opacity: 0.5 }));
          r.rotation.set(Math.PI / 2 + k * 0.1, k * 0.36, 0);
          r.position.y = 3 + k * 1.1;
          g.add(r);
        }
        break;

      case 2:  // The Dome — a ceiling of watchers
        for (let k = 1; k <= 9; k++) {
          const band = ring(52 * Math.sin((k / 10) * Math.PI / 2), 40, 0, 0, c1, 0.3);
          band.rotation.x = Math.PI / 2;
          band.position.y = 52 * Math.cos((k / 10) * Math.PI / 2) * 0.72 + 4;
          g.add(band);
        }
        for (let k = 0; k < 9; k++) {
          const dm = ring(54, 44, 0, 0, c2, 0.26);
          dm.rotation.y = (k / 9) * Math.PI;
          g.add(dm);
        }
        for (let k = 0; k < 26; k++) {
          const a = (k / 26) * Math.PI * 2;
          g.add(box(2.4, 26, 2.4, Math.cos(a) * 50, 13, Math.sin(a) * 50, c1, 0.42));
        }
        break;

      case 3:  // The Elf Workshop — machines stacked to the roof
        for (let k = 0; k < 90; k++) {
          const a = Math.random() * Math.PI * 2, r = 12 + Math.random() * 48;
          const s = 1.6 + Math.random() * 5;
          g.add(box(s, s, s, Math.cos(a) * r, 1 + Math.random() * 26, Math.sin(a) * r,
                    Math.random() < 0.5 ? c1 : c2, 0.5));
        }
        break;

      case 4:  // The Jester's Court — a tilted, checkered hall
        for (let k = 0; k < 20; k++) {
          const a = (k / 20) * Math.PI * 2;
          const p = box(2, 30, 2, Math.cos(a) * 42, 15, Math.sin(a) * 42, k % 2 ? c1 : c2, 0.5);
          p.rotation.z = (k % 2 ? 1 : -1) * 0.14;
          g.add(p);
        }
        for (let k = 0; k < 8; k++) {
          const tile = ring(10 + k * 6, 4, 0, 0, c2, 0.3);
          tile.rotation.x = Math.PI / 2;
          tile.position.y = 0.1;
          g.add(tile);
        }
        break;

      case 5:  // The Hyperspace Corridor — a passage at impossible speed
        for (let k = 0; k < 40; k++) {
          const r = ring(20, 26, 6, -k * 9 + 40, k % 3 ? c1 : c2, 0.5);
          g.add(r);
        }
        break;

      case 6:  // The Fractal Sea — an ocean of its own reflection
        for (let row = -12; row <= 12; row++) {
          const pts = [];
          for (let x = -60; x <= 60; x += 4) {
            const y = Math.sin(x * 0.08 + row * 0.5) * 2.4 + Math.cos(row * 0.32) * 1.8;
            pts.push(new THREE.Vector3(x, y, row * 5),
                     new THREE.Vector3(x + 4, Math.sin((x + 4) * 0.08 + row * 0.5) * 2.4 +
                                              Math.cos(row * 0.32) * 1.8, row * 5));
          }
          g.add(lines(pts, row % 2 ? c1 : c2, 0.34));
        }
        break;

      case 7:  // The Temple of Geometry — laws given columns
        for (let side = -1; side <= 1; side += 2)
          for (let k = 0; k < 11; k++) {
            g.add(box(3, 34, 3, side * 20, 17, -k * 12 + 40, c1, 0.5));
            g.add(box(3, 1.4, 10, side * 20, 34, -k * 12 + 34, c2, 0.4));
          }
        for (let k = 0; k < 11; k++) g.add(box(43, 1.4, 3, 0, 35, -k * 12 + 40, c2, 0.34));
        break;

      case 8:  // The Loom — every thread a life
        for (let k = 0; k < 150; k++) {
          const a = Math.random() * Math.PI * 2, r = 8 + Math.random() * 54;
          const x = Math.cos(a) * r, z = Math.sin(a) * r;
          g.add(lines([new THREE.Vector3(x, 0, z), new THREE.Vector3(x, 30 + Math.random() * 22, z)],
                      Math.random() < 0.5 ? c1 : c2, 0.24));
        }
        break;

      default: // The Source — light without a lamp
        for (let k = 1; k <= 16; k++) {
          const halo = ring(k * 3.4, 36, 0, 0, k % 2 ? c1 : c2, 0.4 - k * 0.018);
          halo.rotation.x = Math.PI / 2 + k * 0.05;
          halo.position.y = 12;
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

  function makeBeings(index) {
    const { seeded } = window.RealmForms;
    const rnd   = seeded(index * 7919 + 13);
    const order = tierOf.slice();
    for (let a = order.length - 1; a > 0; a--) {
      const b = Math.floor(rnd() * (a + 1));
      [order[a], order[b]] = [order[b], order[a]];
    }

    const group = new THREE.Group();
    const list  = [];

    order.forEach((key, n) => {
      const tier  = TIERS.find(t => t.key === key);
      const being = {
        id: index * SUPPLY_PER_ROUND + n + 1,
        n: n + 1, tier: key, tierName: tier.name, color: tier.color
      };
      being.form = makeForm(being);

      const tex = new THREE.CanvasTexture(being.form);
      const sp  = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, transparent: true, fog: false,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));

      const s = SCALE[key];
      sp.scale.set(s, s, 1);

      const a = rnd() * Math.PI * 2, r = 6 + rnd() * 58;
      sp.position.set(Math.cos(a) * r, 2 + rnd() * 30, Math.sin(a) * r);

      sp.userData.being = being;
      sp.userData.bob   = { phase: rnd() * 6.3, speed: 0.2 + rnd() * 0.5, amp: 0.4 + rnd() * 1.6 };
      sp.userData.home  = sp.position.clone();

      being.sprite = sp;
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

    scene.remove(env, swarm);
    env.traverse(o => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose(); });
    swarm.traverse(o => { o.material && o.material.map && o.material.map.dispose(); });

    env = build(i);
    const made = makeBeings(i);
    swarm   = made.group;
    sprites = made.list;
    scene.add(env, swarm);

    const hue = SECTORS[i].hue;
    scene.fog = new THREE.FogExp2(hsl(hue, 0.7, 0.05).getHex(), 0.011);
    renderer.setClearColor(hsl(hue, 0.65, 0.035).getHex(), 1);

    pos.set(0, 5, 46);
    view.yaw = 0; view.pitch = -0.05; view.drift = true;
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
    if (chosen && chosen !== sp) {            // put the last one back to its true size
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

  /* ---------- input: drag to look, tap to choose ---------- */
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
    view.pitch -= dy * 0.0035;
    view.pitch  = Math.max(-1.1, Math.min(1.1, view.pitch));
  });

  canvas.addEventListener("pointerup", e => {
    dragging = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    if (moved > 9) return;                       // that was a look, not a tap

    const r = canvas.getBoundingClientRect();
    const v = new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(v, camera);
    const hits = ray.intersectObjects(sprites, false);
    select(hits.length ? hits[0].object : null);
  });

  /* ---------- drift ---------- */
  const driftBtn = $("#drift");
  function setDrift() {
    driftBtn.textContent = view.drift ? "Stop" : "Move";
    driftBtn.classList.toggle("moving", view.drift);
  }
  driftBtn.onclick = () => { view.drift = !view.drift; setDrift(); };

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
      if (pos.length() > BOUND) pos.setLength(BOUND * 0.985);
      pos.y = Math.max(1.6, Math.min(46, pos.y));
    }
    camera.position.copy(pos);

    // beings breathe in place
    for (const sp of sprites) {
      const b = sp.userData.bob;
      sp.position.y = sp.userData.home.y + Math.sin(t * b.speed + b.phase) * b.amp;
      if (sp === chosen) {
        const p = 1 + Math.sin(t * 5) * 0.09;
        const s = SCALE[sp.userData.being.tier] * p;
        sp.scale.set(s, s, 1);
      }
    }

    env.rotation.y += dt * 0.006;

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
    setDrift();
    requestAnimationFrame(tick);
  } catch (e) {
    fail("Something went wrong building the realm: " + e.message);
  }
})();
