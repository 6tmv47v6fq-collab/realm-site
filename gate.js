/* ============================================================
   REALM — the entrance.

   Three states on one page:
     gate     the tree, and the door in it
     tunnel   you are pulled through the door
     options  the chamber you come out into

   The tree is a still picture. Everything that makes it feel like a
   living place is drawn over it: light moves through the canopy, the
   sun flares, fireflies drift, and the doorway breathes. Pressing
   ENTER rushes the whole picture into that doorway.

   The tunnel is meant to be punishing. It measures its own frame rate
   and adds detail until the device is working hard, then holds there —
   so a fast phone gets something overwhelming and an old one still
   gets through without locking up.
   ============================================================ */

(() => {
  "use strict";

  /* ---------- the picture, and the two places that matter in it ----------
     Both are fractions: how far across, how far down. If the artwork is
     ever replaced, these two lines are what to re-measure. */
  const AIM = { x: 0.545, y: 0.738 };   // the doorway — where the zoom goes
  const SUN = { x: 0.513, y: 0.436 };   // the burst of light in the canopy

  const FULL = "tree.jpg";
  const SMALL = "tree-small.jpg";       // lighter, for narrow screens

  const canvas = document.getElementById("sky");
  const tree   = document.getElementById("tree");
  if (!canvas || !tree) return;
  const ctx = canvas.getContext("2d");
  const tc  = tree.getContext("2d");

  /* two buffers, so each frame of the tunnel can be drawn on top of a
     scaled copy of the last one — that feedback is what makes it feel
     endless */
  const A = document.createElement("canvas"), a = A.getContext("2d");
  const B = document.createElement("canvas"), b = B.getContext("2d");
  let front = A, back = B, fc = a, bc = b;

  let W = 0, H = 0, cx = 0, cy = 0, R = 0, SC = 1, DPR = 1;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 1.6);

    canvas.width = W; canvas.height = H;
    SC = W > 900 ? 0.5 : 0.62;            // buffer scale
    const bw = Math.max(1, Math.floor(W * SC)), bh = Math.max(1, Math.floor(H * SC));
    for (const c of [A, B]) { c.width = bw; c.height = bh; }
    cx = W / 2; cy = H / 2;
    R  = Math.hypot(W, H) * 0.6;
    fc.setTransform(SC, 0, 0, SC, 0, 0);
    bc.setTransform(SC, 0, 0, SC, 0, 0);

    tree.width  = Math.max(1, Math.round(W * DPR));
    tree.height = Math.max(1, Math.round(H * DPR));
    tc.setTransform(DPR, 0, 0, DPR, 0, 0);

    bakeHush();
    seedAir();
  }
  window.addEventListener("resize", resize);

  /* ---------- state ---------- */
  let phase   = "gate";
  let phaseAt = 0;
  let quality = 0.55;          // climbs on fast devices, falls on slow ones
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const TUNNEL_MS  = 3800;
  const SWALLOW_MS = 1250;

  const rand = (a, b) => a + Math.random() * (b - a);


  /* ============================================================
     THE TREE
     ============================================================ */

  let art = null;
  (function loadTree() {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => { art = img; tree.classList.add("ready"); };
    img.onerror = () => {
      if (img.src.indexOf(SMALL) === -1) { img.src = SMALL; return; }
    };
    img.src = (window.innerWidth <= 700 || (window.devicePixelRatio || 1) < 2)
      ? SMALL : FULL;
  })();

  /* Full bleed across, and the doorway held just above the middle so
     that it is the first thing seen and nothing has to sit on top of
     it. The tree is a tall picture and the door is three quarters of
     the way down it, so holding the door that high means the roots run
     off the bottom of the screen — which is where the words stand, in
     the dark, rather than over the artwork. */
  const DOOR_AT = 0.44;

  function frame(zoom) {
    const cover = Math.max(W / art.width, H / art.height) * zoom;
    const w = art.width * cover, h = art.height * cover;
    const y = Math.min(0, H * DOOR_AT - h * AIM.y);
    return { x: (W - w) / 2, y, w, h };
  }

  /* the wash that holds the picture back so the words on it can be
     read — the same every frame, so painted once */
  let hush = null;
  function bakeHush() {
    const ow = Math.max(2, Math.round(W / 3)), oh = Math.max(2, Math.round(H / 3));
    hush = document.createElement("canvas");
    hush.width = ow; hush.height = oh;
    const g = hush.getContext("2d");

    const vig = g.createRadialGradient(ow / 2, oh * 0.5, Math.min(ow, oh) * 0.24,
                                       ow / 2, oh * 0.5, Math.hypot(ow, oh) * 0.6);
    vig.addColorStop(0,   "rgba(3,1,10,0)");
    vig.addColorStop(0.7, "rgba(3,1,10,0.3)");
    vig.addColorStop(1,   "rgba(3,1,10,0.86)");
    g.fillStyle = vig;
    g.fillRect(0, 0, ow, oh);

    const scrim = g.createLinearGradient(0, oh * 0.5, 0, oh);
    scrim.addColorStop(0,   "rgba(3,1,10,0)");
    scrim.addColorStop(0.5, "rgba(3,1,10,0.5)");
    scrim.addColorStop(1,   "rgba(3,1,10,0.88)");
    g.fillStyle = scrim;
    g.fillRect(0, oh * 0.5, ow, oh * 0.5);
  }

  /* ---------- what moves in the air ---------- */
  let flies = [], streaks = [], nextStreak = 2;

  function seedAir() {
    flies = [];
    const n = Math.min(54, Math.round((W * H) / 17000));
    for (let i = 0; i < n; i++) {
      flies.push({
        x: Math.random(), y: rand(0.1, 1.05),
        r: rand(0.7, 2.2),
        vy: rand(0.004, 0.02),
        drift: rand(0, 6.3),
        tw: rand(0.6, 2.4),
        hue: rand(38, 62)
      });
    }
  }

  /* light finding its way through the leaves */
  function fireStreak() {
    streaks.push({
      x: rand(0.05, 0.95), y: rand(-0.02, 0.36),
      vx: rand(-0.5, 0.5), vy: rand(0.14, 0.34),
      life: 0, span: rand(0.7, 1.3),
      hue: rand(44, 190)
    });
  }

  let zoomed = false;          // true while the picture is being rushed into
  function glow(g, x, y, r, hue, alpha, light) {
    if (alpha <= 0.004 || r <= 0) return;
    if (!zoomed && (x + r < 0 || x - r > W || y + r < 0 || y - r > H)) return;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0,    `hsla(${hue},100%,${light || 80}%,${alpha})`);
    gr.addColorStop(0.36, `hsla(${hue},100%,64%,${alpha * 0.34})`);
    gr.addColorStop(1,    "hsla(0,0%,0%,0)");
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }

  /* ---------- one frame of the tree ---------- */
  function paintTree(t, dt, pull) {
    tc.setTransform(DPR, 0, 0, DPR, 0, 0);
    tc.clearRect(0, 0, W, H);
    if (!art) return;

    /* standing in front of it, not looking at a photograph */
    const breathe = 1 + 0.028 * (0.5 + 0.5 * Math.sin(t * 0.14));
    const rush = 1 + 17 * pull * pull * pull;      // and then, the doorway
    const { x, y, w, h } = frame(breathe);

    const ax = x + w * AIM.x, ay = y + h * AIM.y;

    tc.save();
    zoomed = pull > 0;
    if (pull > 0) {
      tc.translate(ax, ay); tc.scale(rush, rush); tc.translate(-ax, -ay);
      tc.globalAlpha = Math.max(0, 1 - Math.pow(pull, 2.4));
    }
    tc.drawImage(art, x, y, w, h);

    /* ---------- light ---------- */
    tc.globalCompositeOperation = "lighter";

    // the sun, flaring through the canopy
    const sx = x + w * SUN.x, sy = y + h * SUN.y;
    const flare = 0.34 + 0.12 * Math.sin(t * 0.7) + 0.05 * Math.sin(t * 2.3);
    glow(tc, sx, sy, w * 0.26, 48, flare * 0.42, 92);
    glow(tc, sx, sy, w * 0.07, 54, flare, 99);

    tc.strokeStyle = `hsla(50,100%,92%,${0.13 * flare})`;
    tc.lineWidth = 1.4;
    for (let k = 0; k < 10; k++) {
      const ang = (k / 10) * Math.PI * 2 + t * 0.04;
      const len = w * (0.14 + 0.07 * Math.sin(t * 1.3 + k));
      tc.beginPath();
      tc.moveTo(sx + Math.cos(ang) * w * 0.03, sy + Math.sin(ang) * w * 0.03);
      tc.lineTo(sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
      tc.stroke();
    }

    // the doorway, breathing, in the tunnel's own colours
    const door = 0.42 + 0.2 * Math.sin(t * 0.55) + 0.07 * Math.sin(t * 1.9);
    const open = door + pull * 2.2;
    glow(tc, ax, ay, w * 0.26, 282, open * 0.3, 74);
    glow(tc, ax, ay, w * 0.10, 172, open * 0.5, 86);
    glow(tc, ax, ay, w * 0.04, 300, open, 96);

    tc.globalCompositeOperation = "source-over";

    /* where the picture ends, let it fall away into the dark rather
       than stopping on a line */
    const foot = y + h;
    if (foot < H + 1) {
      const fade = tc.createLinearGradient(0, foot - h * 0.1, 0, foot);
      fade.addColorStop(0, "rgba(3,1,10,0)");
      fade.addColorStop(1, "rgba(3,1,10,1)");
      tc.fillStyle = fade;
      tc.fillRect(x, foot - h * 0.1, w, h * 0.1 + 1);
      tc.fillStyle = "#03010a";
      tc.fillRect(0, foot, W, H - foot + 1);
    }

    tc.restore();

    /* ---------- the air between you and the tree ----------
       Drawn after the picture is put back, in plain screen space: none
       of this should rush into the doorway with the tree, and at
       seventeen times its size a firefly would be a saucer. */
    const air = Math.max(0, 1 - pull * 2.4);
    if (air > 0.01) {
      tc.globalCompositeOperation = "lighter";

      // light moving across the leaves
      for (let k = 0; k < 2; k++) {
        const bxp = (((t * 0.028 + k / 2) % 1) * 1.7 - 0.35) * W;
        const half = W * 0.26;
        const l = Math.max(0, bxp - half), r2 = Math.min(W, bxp + half);
        if (r2 > l) {
          const sw = tc.createLinearGradient(bxp - half, 0, bxp + half, H);
          sw.addColorStop(0,   "hsla(0,0%,0%,0)");
          sw.addColorStop(0.5, `hsla(${64 + k * 40},100%,76%,${0.05 * air})`);
          sw.addColorStop(1,   "hsla(0,0%,0%,0)");
          tc.fillStyle = sw;
          tc.fillRect(l, 0, r2 - l, H);
        }
      }

      // light finding its way through the leaves, now and then
      nextStreak -= dt;
      if (nextStreak <= 0) { fireStreak(); nextStreak = rand(1.6, 4.4); }
      for (let i = streaks.length - 1; i >= 0; i--) {
        const s2 = streaks[i];
        s2.life += dt; s2.x += s2.vx * dt; s2.y += s2.vy * dt;
        if (s2.life > s2.span) { streaks.splice(i, 1); continue; }
        const fade = Math.sin((s2.life / s2.span) * Math.PI) * air;
        const hx = s2.x * W, hy = s2.y * H;
        const tx2 = hx - s2.vx * W * 0.16, ty2 = hy - s2.vy * H * 0.16;
        const tail = tc.createLinearGradient(hx, hy, tx2, ty2);
        tail.addColorStop(0, `hsla(${s2.hue},100%,92%,${0.7 * fade})`);
        tail.addColorStop(1, "hsla(0,0%,0%,0)");
        tc.strokeStyle = tail;
        tc.lineWidth = 2;
        tc.beginPath(); tc.moveTo(hx, hy); tc.lineTo(tx2, ty2); tc.stroke();
      }

      // fireflies
      for (const f of flies) {
        f.y -= f.vy * dt;
        if (f.y < -0.03) { f.y = 1.03; f.x = Math.random(); }
        const fx = (f.x + Math.sin(t * 0.3 + f.drift) * 0.014) * W;
        const fy = f.y * H;
        const on = 0.2 + 0.8 * Math.abs(Math.sin(t * f.tw + f.drift));
        tc.fillStyle = `hsla(${f.hue},100%,80%,${on * 0.55 * air})`;
        tc.beginPath(); tc.arc(fx, fy, f.r, 0, Math.PI * 2); tc.fill();
      }

      tc.globalCompositeOperation = "source-over";
    }

    if (hush) tc.drawImage(hush, 0, 0, W, H);
  }


  /* ============================================================
     THE TUNNEL
     ============================================================ */

  function polygon(g, rr, sides, rot) {
    g.beginPath();
    for (let i = 0; i <= sides; i++) {
      const ang = (i / sides) * Math.PI * 2 + rot;
      const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
  }

  /* One ring of the tunnel, with its own nested detail. */
  function ringAt(g, f, k, t, hue, intensity, detail) {
    const rr = Math.pow(f, 2.0) * R * 1.65;
    if (rr < 1.5) return;

    const fade = Math.min(1, f * 4) * (1 - f) * 2.1 * intensity;
    if (fade <= 0.01) return;
    const sides = 3 + (k % 10);
    const rot   = t * 0.22 * (k % 2 ? 1 : -1) + k * 0.37;

    g.strokeStyle = `hsla(${hue + k * 23},100%,${52 + (k % 3) * 6}%,${0.5 * fade})`;
    g.lineWidth = 0.8 + f * 5;
    polygon(g, rr, sides, rot);
    g.stroke();

    if (detail < 1) return;

    g.strokeStyle = `hsla(${hue + k * 23 + 150},100%,64%,${0.4 * fade})`;
    g.lineWidth = 0.6 + f * 2.4;
    polygon(g, rr * 0.72, sides + 2, -rot * 1.5);
    g.stroke();

    if (detail < 2) return;

    g.beginPath();
    for (let i = 0; i < sides; i++) {
      const ang = (i / sides) * Math.PI * 2 + rot;
      g.moveTo(Math.cos(ang) * rr * 0.72, Math.sin(ang) * rr * 0.72);
      g.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
    }
    g.strokeStyle = `hsla(${hue + k * 23 + 60},100%,68%,${0.26 * fade})`;
    g.lineWidth = 0.6;
    g.stroke();

    if (detail < 3) return;

    g.beginPath();
    for (let i = 0; i < sides; i++) {
      const ang = (i / sides) * Math.PI * 2 + rot;
      const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr;
      const nr = Math.max(0.8, rr * 0.035);
      g.moveTo(x + nr, y);
      g.arc(x, y, nr, 0, Math.PI * 2);
    }
    g.strokeStyle = `hsla(${hue + k * 23 + 210},100%,72%,${0.32 * fade})`;
    g.lineWidth = 0.7;
    g.stroke();
  }

  function paintTunnel(t) {
    const g = fc;
    const rush = Math.min(1, (performance.now() - phaseAt) / TUNNEL_MS);
    const intensity = 0.75 + rush * 0.9;
    const speed = 0.28 + rush * rush * 2.6;
    const hue   = t * (70 + rush * 190);

    // feedback: last frame, scaled up, underneath everything
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, front.width, front.height);
    g.globalAlpha = 0.66 + rush * 0.12;
    const zoom = 1 + 0.028 + rush * 0.05;
    const dw = front.width * zoom, dh = front.height * zoom;
    g.drawImage(back, (front.width - dw) / 2, (front.height - dh) / 2, dw, dh);
    g.globalAlpha = 1;
    g.setTransform(SC, 0, 0, SC, 0, 0);

    // darken what carried over, so trails decay instead of smearing white
    g.fillStyle = "rgba(0,0,0,0.26)";
    g.fillRect(0, 0, W, H);

    g.globalCompositeOperation = "lighter";
    g.lineCap = "round";

    const RINGS  = Math.round(46 * quality);
    const SYM    = Math.round(2 + 5 * quality);
    const detail = quality > 0.85 ? 3 : quality > 0.6 ? 2 : quality > 0.4 ? 1 : 0;
    const z = (t * speed) % 1;

    g.save();
    g.translate(cx, cy);
    for (let m = 0; m < SYM; m++) {
      g.save();
      g.rotate((m / SYM) * Math.PI * 2 + t * 0.05 * (m % 2 ? 1 : -1));
      for (let k = 0; k < RINGS; k++) {
        ringAt(g, ((k / RINGS) + z) % 1, k, t, hue + m * 31, intensity, detail);
      }
      g.restore();
    }
    g.restore();

    // the light you are heading into
    const core = g.createRadialGradient(cx, cy, 0, cx, cy, R * (0.3 + rush * 0.7));
    const blow = Math.pow(rush, 2.2);          // the whiteout arrives late
    core.addColorStop(0,    `hsla(${hue + 50},100%,${70 + blow * 30}%,${0.2 + blow * 0.78})`);
    core.addColorStop(0.2,  `hsla(${hue},100%,62%,${0.14 + blow * 0.5})`);
    core.addColorStop(0.62, `hsla(${hue + 170},100%,54%,${0.05 + blow * 0.25})`);
    core.addColorStop(1,    "hsla(0,0%,0%,0)");
    g.fillStyle = core;
    g.fillRect(0, 0, W, H);

    g.globalCompositeOperation = "source-over";

    const vig = g.createRadialGradient(cx, cy, Math.min(W, H) * 0.12, cx, cy, R);
    vig.addColorStop(0,   "rgba(0,0,0,0)");
    vig.addColorStop(0.6, "rgba(0,0,0,0.37)");
    vig.addColorStop(1,   "rgba(0,0,0,0.88)");
    g.fillStyle = vig;
    g.fillRect(0, 0, W, H);

    // blit and swap
    ctx.drawImage(front, 0, 0, W, H);
    const tf = front, tcx = fc;
    front = back; fc = bc;
    back = tf;   bc = tcx;
  }


  /* ---------- the loop, with its own quality governor ---------- */
  let last = performance.now(), acc = 0, frames = 0;
  let pull = 0, pullFrom = 0;

  function loop(now) {
    requestAnimationFrame(loop);
    if (document.hidden) { last = now; return; }

    const dt = Math.min(0.06, (now - last) * 0.001);
    if (now - last > 400) { last = now; return; }   // came back from the background
    last = now;
    const t = now * 0.001;

    if (phase === "tunnel" || phase === "options") paintTunnel(t);
    if (phase !== "options") {
      if (pullFrom) pull = Math.min(1, (now - pullFrom) / SWALLOW_MS);
      paintTree(t, dt, pull);
      if (pull >= 1 && tree.style.display !== "none") tree.style.display = "none";
    }

    /* Push the detail up while frames are cheap, back off when they are
       not. Checked over a handful of frames so it doesn't thrash. */
    acc += dt * 1000; frames++;
    if (frames >= 12) {
      const avg = acc / frames;
      acc = 0; frames = 0;
      if (avg < 15 && quality < 1)        quality = Math.min(1, quality + 0.08);
      else if (avg > 26 && quality > 0.3) quality = Math.max(0.3, quality - 0.12);
    }
  }

  /* ---------- states ---------- */
  const gate    = document.querySelector(".gate");
  const journey = document.querySelector(".journey");

  function go(next) {
    phase = next;
    phaseAt = performance.now();
    document.body.dataset.phase = next;
    if (next === "tunnel") {
      /* the buffers still hold whatever was there; feeding that forward
         is what bleached the tunnel to grey */
      for (const [cv, cx2] of [[A, a], [B, b]]) {
        cx2.setTransform(1, 0, 0, 1, 0, 0);
        cx2.fillStyle = "#000";
        cx2.fillRect(0, 0, cv.width, cv.height);
        cx2.setTransform(SC, 0, 0, SC, 0, 0);
      }
    }
  }

  function enter() {
    if (phase !== "gate") return;
    gate.classList.add("gone");
    if (still) { land(); return; }
    pullFrom = performance.now();
    setTimeout(() => go("tunnel"), SWALLOW_MS * 0.58);
    setTimeout(land, SWALLOW_MS + TUNNEL_MS);
  }

  function land() {
    go("options");
    if (gate) gate.style.display = "none";
    if (!journey) return;
    journey.hidden = false;
    if (window.RealmJourney && RealmJourney.start) RealmJourney.start();
    requestAnimationFrame(() => journey.classList.add("here"));
  }

  /* ---------- writing that moves ----------
     Each letter becomes its own element with its own place in the
     wave, so the words ripple across instead of animating as a block. */
  function liquify(el, cls) {
    if (!el) return;
    const text = el.textContent;
    el.textContent = "";
    [...text].forEach((ch, i) => {
      const sp = document.createElement("span");
      sp.className = cls;
      sp.style.setProperty("--i", i);
      sp.textContent = ch;
      if (ch === " ") sp.style.width = ".32em";
      el.appendChild(sp);
    });
  }
  liquify(document.querySelector(".enter-in"), "ch");
  liquify(document.querySelector(".creed"), "ch soft");

  document.querySelector("#enter").addEventListener("click", enter);

  /* nobody should be trapped in the tunnel — a tap takes you straight
     through, and it becomes the obvious thing to do on a second visit */
  window.addEventListener("pointerdown", () => {
    if (phase === "tunnel") land();
  });

  window.RealmGate = { enter, land };

  resize();
  go("gate");
  requestAnimationFrame(loop);
})();
