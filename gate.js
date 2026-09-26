/* ============================================================
   REALM — the entrance.

   Three states on one page:
     gate     a near-black door with one way in
     tunnel   you are pulled through it
     options  where you come out

   The tunnel is meant to be punishing. It measures its own frame rate
   and adds detail until the device is working hard, then holds there —
   so a fast phone gets something overwhelming and an old one still
   gets through without locking up.
   ============================================================ */

(() => {
  "use strict";

  const canvas = document.getElementById("sky");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  /* two buffers, so each frame can be drawn on top of a scaled copy of
     the last one — that feedback is what makes the tunnel feel endless */
  const A = document.createElement("canvas"), a = A.getContext("2d");
  const B = document.createElement("canvas"), b = B.getContext("2d");
  let front = A, back = B, fc = a, bc = b;

  let W = 0, H = 0, cx = 0, cy = 0, R = 0, SC = 1;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    SC = W > 900 ? 0.5 : 0.62;            // buffer scale
    const bw = Math.max(1, Math.floor(W * SC)), bh = Math.max(1, Math.floor(H * SC));
    for (const c of [A, B]) { c.width = bw; c.height = bh; }
    cx = W / 2; cy = H / 2;
    R  = Math.hypot(W, H) * 0.6;
    fc.setTransform(SC, 0, 0, SC, 0, 0);
    bc.setTransform(SC, 0, 0, SC, 0, 0);
    seedStars();
    if (!puffs.length) seedSmoke();
  }
  window.addEventListener("resize", resize);

  /* ---------- state ---------- */
  let phase   = "gate";
  let phaseAt = 0;
  let quality = 0.55;          // climbs on fast devices, falls on slow ones
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const TUNNEL_MS = 3800;

  /* ---------- drawing pieces ---------- */
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

    const fade  = Math.min(1, f * 4) * (1 - f) * 2.1 * intensity;
    if (fade <= 0.01) return;
    const sides = 3 + (k % 10);
    const rot   = t * 0.22 * (k % 2 ? 1 : -1) + k * 0.37;

    g.strokeStyle = `hsla(${hue + k * 23},100%,${52 + (k % 3) * 6}%,${0.5 * fade})`;
    g.lineWidth = 0.8 + f * 5;
    polygon(g, rr, sides, rot);
    g.stroke();

    if (detail < 1) return;

    // a counter-turning polygon nested inside
    g.strokeStyle = `hsla(${hue + k * 23 + 150},100%,64%,${0.4 * fade})`;
    g.lineWidth = 0.6 + f * 2.4;
    polygon(g, rr * 0.72, sides + 2, -rot * 1.5);
    g.stroke();

    if (detail < 2) return;

    // spokes out to the ring
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

    // nodes at every vertex
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


  /* ============================================================
     THE SKY BEHIND THE GATE
     Smoke, stars, the occasional falling one, and things that pass.
     ============================================================ */

  const rand = (a, b) => a + Math.random() * (b - a);

  /* --- stars --- */
  let stars = [];
  function seedStars() {
    stars = [];
    const n = Math.round((W * H) / 9000);
    for (let i = 0; i < Math.min(180, n); i++) {
      stars.push({
        x: Math.random(), y: Math.random(),
        r: rand(0.4, 1.5),
        tw: rand(0.4, 2.2), ph: rand(0, 6.3),
        hue: rand(180, 300)
      });
    }
  }

  /* --- smoke: slow clouds drifting across --- */
  const PUFFS = 7;
  const puffs = [];
  function seedSmoke() {
    puffs.length = 0;
    for (let i = 0; i < PUFFS; i++) {
      puffs.push({
        x: Math.random(), y: rand(0.1, 0.95),
        r: rand(0.26, 0.6),
        vx: rand(0.004, 0.018) * (Math.random() < 0.5 ? -1 : 1),
        drift: rand(0, 6.3),
        hue: rand(250, 300),
        a: rand(0.13, 0.28)
      });
    }
  }

  /* --- shooting stars --- */
  const shots = [];
  let nextShot = 1.2;
  function fireShot() {
    const fromLeft = Math.random() < 0.5;
    shots.push({
      x: fromLeft ? rand(-0.1, 0.4) : rand(0.6, 1.1),
      y: rand(-0.05, 0.5),
      vx: (fromLeft ? 1 : -1) * rand(0.35, 0.62),
      vy: rand(0.18, 0.4),
      life: 0, span: rand(0.9, 1.5),
      hue: rand(170, 290)
    });
  }

  /* --- things that pass --- */
  const ufos = [];
  let nextUfo = 4;
  function sendUfo() {
    const fromLeft = Math.random() < 0.5;
    ufos.push({
      x: fromLeft ? -0.16 : 1.16,
      y: rand(0.08, 0.72),
      vx: (fromLeft ? 1 : -1) * rand(0.018, 0.045),
      bob: rand(0, 6.3),
      size: rand(0.03, 0.062),
      hue: rand(160, 300),
      beam: Math.random() < 0.35
    });
  }

  function drawUfo(g, u, t) {
    const x = u.x * W;
    const y = (u.y + Math.sin(t * 0.8 + u.bob) * 0.012) * H;
    const w = u.size * W, h = w * 0.3;

    if (u.beam) {                                   // a shaft of light below
      const bg = g.createLinearGradient(x, y, x, y + h * 9);
      bg.addColorStop(0, `hsla(${u.hue},100%,70%,0.24)`);
      bg.addColorStop(1, "hsla(0,0%,0%,0)");
      g.fillStyle = bg;
      g.beginPath();
      g.moveTo(x - w * 0.26, y + h * 0.4);
      g.lineTo(x + w * 0.26, y + h * 0.4);
      g.lineTo(x + w * 1.05, y + h * 9);
      g.lineTo(x - w * 1.05, y + h * 9);
      g.closePath(); g.fill();
    }

    const halo = g.createRadialGradient(x, y, 0, x, y, w * 1.5);
    halo.addColorStop(0, `hsla(${u.hue},100%,70%,0.3)`);
    halo.addColorStop(1, "hsla(0,0%,0%,0)");
    g.fillStyle = halo;
    g.fillRect(x - w * 1.5, y - w * 1.5, w * 3, w * 3);

    g.fillStyle = `hsla(${u.hue},70%,62%,0.85)`;    // hull
    g.beginPath(); g.ellipse(x, y, w * 0.5, h * 0.5, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = `hsla(${u.hue + 30},100%,82%,0.9)`; // dome
    g.beginPath(); g.ellipse(x, y - h * 0.34, w * 0.2, h * 0.5, 0, Math.PI, 0); g.fill();

    for (let i = 0; i < 4; i++) {                    // running lights
      const lx = x - w * 0.3 + i * (w * 0.2);
      const on = 0.4 + 0.6 * Math.abs(Math.sin(t * 3 + i * 1.3 + u.bob));
      g.fillStyle = `hsla(${u.hue + i * 40},100%,75%,${on})`;
      g.beginPath(); g.arc(lx, y + h * 0.3, w * 0.035, 0, Math.PI * 2); g.fill();
    }
  }

  function paintAmbient(t, dt) {
    const g = fc;
    const lift = phase === "options" ? 1.5 : 1;

    g.setTransform(SC, 0, 0, SC, 0, 0);
    g.fillStyle = "#000";
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = "lighter";

    // smoke
    for (const p of puffs) {
      p.x += p.vx * dt * 0.001;
      if (p.x < -0.6) p.x = 1.6; if (p.x > 1.6) p.x = -0.6;
      const px = p.x * W;
      const py = (p.y + Math.sin(t * 0.14 + p.drift) * 0.02) * H;
      const r  = p.r * Math.max(W, H) * (1 + Math.sin(t * 0.1 + p.drift) * 0.08);
      const grad = g.createRadialGradient(px, py, 0, px, py, r);
      grad.addColorStop(0,   `hsla(${p.hue},90%,52%,${p.a * lift})`);
      grad.addColorStop(0.5, `hsla(${p.hue + 40},90%,44%,${p.a * 0.4 * lift})`);
      grad.addColorStop(1,   "hsla(0,0%,0%,0)");
      g.fillStyle = grad;
      g.fillRect(px - r, py - r, r * 2, r * 2);
    }

    // stars
    for (const st of stars) {
      const a = 0.34 + 0.66 * Math.abs(Math.sin(t * st.tw + st.ph));
      g.fillStyle = `hsla(${st.hue},80%,88%,${a * lift})`;
      g.beginPath();
      g.arc(st.x * W, st.y * H, st.r, 0, Math.PI * 2);
      g.fill();
    }

    // falling stars
    nextShot -= dt * 0.001;
    if (nextShot <= 0) { fireShot(); nextShot = rand(1.1, 3.2); }
    for (let i = shots.length - 1; i >= 0; i--) {
      const sh = shots[i];
      sh.life += dt * 0.001;
      sh.x += sh.vx * dt * 0.001;
      sh.y += sh.vy * dt * 0.001;
      if (sh.life > sh.span) { shots.splice(i, 1); continue; }

      const fade = 1 - sh.life / sh.span;
      const hx = sh.x * W, hy = sh.y * H;
      const tx = hx - sh.vx * W * 0.13, ty = hy - sh.vy * H * 0.13;
      const tail = g.createLinearGradient(hx, hy, tx, ty);
      tail.addColorStop(0, `hsla(${sh.hue},100%,90%,${0.95 * fade * lift})`);
      tail.addColorStop(1, "hsla(0,0%,0%,0)");
      g.strokeStyle = tail;
      g.lineWidth = 2.2;
      g.beginPath(); g.moveTo(hx, hy); g.lineTo(tx, ty); g.stroke();

      const head = g.createRadialGradient(hx, hy, 0, hx, hy, 12);
      head.addColorStop(0, `hsla(${sh.hue},100%,96%,${fade})`);
      head.addColorStop(1, "hsla(0,0%,0%,0)");
      g.fillStyle = head;
      g.fillRect(hx - 12, hy - 12, 24, 24);
    }

    // passers-by
    nextUfo -= dt * 0.001;
    if (nextUfo <= 0 && ufos.length < 2) { sendUfo(); nextUfo = rand(7, 17); }
    for (let i = ufos.length - 1; i >= 0; i--) {
      const u = ufos[i];
      u.x += u.vx * dt * 0.001;
      if (u.x < -0.3 || u.x > 1.3) { ufos.splice(i, 1); continue; }
      drawUfo(g, u, t);
    }

    g.globalCompositeOperation = "source-over";

    // hold the edges down so the being stays the brightest thing here
    const cx2 = W / 2, cy2 = H / 2, RR = Math.hypot(W, H) * 0.6;
    const vig = g.createRadialGradient(cx2, cy2, Math.min(W, H) * 0.2, cx2, cy2, RR);
    vig.addColorStop(0,   "rgba(0,0,0,0)");
    vig.addColorStop(0.68,"rgba(0,0,0,0.3)");
    vig.addColorStop(1,   "rgba(0,0,0,0.82)");
    g.fillStyle = vig;
    g.fillRect(0, 0, W, H);
  }

  /* ---------- the frame ---------- */
  function paint(t, dt) {
    if (phase !== "tunnel") {
      paintAmbient(t, dt);
      ctx.drawImage(front, 0, 0, W, H);
      const tf0 = front, tc0 = fc;
      front = back; fc = bc; back = tf0; bc = tc0;
      return;
    }

    const g = fc;

    // how hard we are pushing right now
    const rush = phase === "tunnel"
      ? Math.min(1, (performance.now() - phaseAt) / TUNNEL_MS)
      : 0;

    const intensity = phase === "gate"    ? (gate && gate.classList.contains("gone") ? 0.55 : 0.05)
                    : phase === "options" ? 0.62
                    : 0.75 + rush * 0.9;

    const speed = phase === "tunnel" ? 0.28 + rush * rush * 2.6 : 0.13;
    const hue   = t * (phase === "tunnel" ? 70 + rush * 190 : 24);

    // feedback: last frame, scaled up, underneath everything
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, front.width, front.height);
    g.globalAlpha = phase === "tunnel" ? 0.66 + rush * 0.12 : 0.62;
    const zoom = 1 + (phase === "tunnel" ? 0.028 + rush * 0.05 : 0.012);
    const dw = front.width * zoom, dh = front.height * zoom;
    g.drawImage(back, (front.width - dw) / 2, (front.height - dh) / 2, dw, dh);
    g.globalAlpha = 1;
    g.setTransform(SC, 0, 0, SC, 0, 0);

    // darken what carried over, so trails decay instead of smearing white
    g.fillStyle = `rgba(0,0,0,${phase === "tunnel" ? 0.26 : 0.2})`;
    g.fillRect(0, 0, W, H);

    g.globalCompositeOperation = "lighter";
    g.lineCap = "round";

    const RINGS  = Math.round((phase === "tunnel" ? 46 : 20) * quality);
    const SYM    = phase === "tunnel" ? Math.round(2 + 5 * quality) : 3;
    const detail = phase === "tunnel"
      ? (quality > 0.85 ? 3 : quality > 0.6 ? 2 : quality > 0.4 ? 1 : 0)
      : (quality > 0.7 ? 1 : 0);

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

    // hold the edges down so text stays readable
    const vig = g.createRadialGradient(cx, cy, Math.min(W, H) * 0.12, cx, cy, R);
    const edge = phase === "gate" ? 0.99 : 0.88;
    vig.addColorStop(0,    "rgba(0,0,0,0)");
    vig.addColorStop(0.6,  `rgba(0,0,0,${edge * (phase === "gate" ? 0.88 : 0.42)})`);
    vig.addColorStop(1,    `rgba(0,0,0,${edge})`);
    g.fillStyle = vig;
    g.fillRect(0, 0, W, H);

    // blit and swap
    ctx.drawImage(front, 0, 0, W, H);
    const tf = front, tc = fc;
    front = back; fc = bc;
    back = tf;   bc = tc;
  }

  /* ---------- the loop, with its own quality governor ---------- */
  let last = performance.now(), acc = 0, frames = 0;

  function loop(now) {
    requestAnimationFrame(loop);
    if (document.hidden) { last = now; return; }

    const dt = now - last;
    last = now;
    if (dt > 400) return;                       // came back from the background

    paint(now * 0.001, dt);

    /* Push the detail up while frames are cheap, back off when they are
       not. Checked over a handful of frames so it doesn't thrash. */
    acc += dt; frames++;
    if (frames >= 12) {
      const avg = acc / frames;
      acc = 0; frames = 0;
      if (avg < 15 && quality < 1)      quality = Math.min(1, quality + 0.08);
      else if (avg > 26 && quality > 0.3) quality = Math.max(0.3, quality - 0.12);
    }
  }

  /* ---------- the gatekeeper ---------- */
  const keeper = document.getElementById("keeper");
  let art = null, kc = null, MX = 0, MY = 0;

  if (keeper && window.RealmCreature) {
    kc = keeper.getContext("2d");
    RealmCreature.load(img => {
      art = img;
      keeper.width = img.naturalWidth; keeper.height = img.naturalHeight;
      MX = keeper.width  * RealmCreature.MOUTH.x;
      MY = keeper.height * RealmCreature.MOUTH.y;
      drawKeeper(0, 0);
      keeper.classList.add("ready");
      if (!still) requestAnimationFrame(ripple);
    }, () => { if (keeper) keeper.style.display = "none"; });
  }

  /* ---------- the being will not hold still ----------
     Drawn as a stack of horizontal slices, each slid sideways by its
     own travelling wave. That is what makes it look like it is seen
     through moving water rather than simply scaled. */
  const SLICES = 130;

  function drawKeeper(t, zoom) {
    if (!kc || !art) return;
    const w = keeper.width, h = keeper.height;
    const sh = h / SLICES;

    kc.setTransform(1, 0, 0, 1, 0, 0);
    kc.clearRect(0, 0, w, h);

    if (zoom > 0) {
      const s = 1 + 15 * zoom * zoom * zoom;
      kc.globalAlpha = Math.max(0, 1 - Math.pow(zoom, 2.6));
      kc.translate(MX, MY); kc.scale(s, s); kc.translate(-MX, -MY);
    }

    // the warp eases off as you are pulled in
    const amp  = (w * 0.009) * (1 - zoom);
    const roll = (w * 0.003) * (1 - zoom);

    /* Each slice is drawn a little wider than the frame. Without that
       overscan, a slice sliding sideways leaves a bare strip at the
       edge of the picture. */
    const over = amp * 2.2 + roll * 2.2 + 2;

    /* Slices only ever move sideways. Shifting them vertically tears
       gaps between them, which is what read as glitching. The waves are
       kept low-frequency for the same reason: neighbouring slices have
       to stay close or the edge between them becomes visible. */
    for (let i = 0; i < SLICES; i++) {
      const sy = i * sh;
      const f  = i / SLICES;
      const dx = Math.sin(f * 3.1 + t * 0.9) * amp
               + Math.sin(f * 5.4 - t * 0.52) * roll;
      kc.drawImage(art, 0, sy, w, sh + 1.5,
                   dx - over, sy, w + over * 2, sh + 1.5);
    }

    kc.setTransform(1, 0, 0, 1, 0, 0);
    kc.globalAlpha = 1;
  }

  let rlast = 0;
  function ripple(ms) {
    if (phase !== "gate" || swallowing) return;   // the swallow takes over
    if (!document.hidden && ms - rlast > 32) { // 30fps is plenty for a drift
      rlast = ms;
      drawKeeper(ms * 0.001, 0);
    }
    requestAnimationFrame(ripple);
  }

  /* ---------- being swallowed ----------
     Until now the picture lives in a canvas the size of the picture,
     sitting in the middle of the screen. Zooming inside that canvas
     fills it edge to edge with bright pixels, and its edges then read
     as a box pasted on the sky.

     So the moment the pull starts, the canvas is stretched to cover the
     whole gate and the picture is drawn into the rectangle it was
     already occupying — the first frame is identical — and from there
     the zoom has the entire screen to grow into.

     The zoom stays INSIDE the canvas. Scaling the element with CSS asks
     the browser to rasterise a layer thousands of pixels across, which
     locks a phone up for seconds; redrawing the baked picture costs the
     same every frame however far in we are. */
  let sw = null;                 // the picture's box, in canvas pixels
  let swallowing = false;

  function beginSwallow() {
    if (!kc || !art) return;
    swallowing = true;

    const r = keeper.getBoundingClientRect();     // where the art is now

    /* hold the wrapper's box so the door and the creed don't jump as the
       canvas leaves the flow underneath them */
    const wrap = keeper.parentElement;
    if (wrap) {
      wrap.style.height = wrap.getBoundingClientRect().height + "px";
      wrap.style.position = "static";
    }

    keeper.classList.add("full");
    const f = keeper.getBoundingClientRect();     // the box it covers now

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    keeper.width  = Math.max(1, Math.round(f.width  * dpr));
    keeper.height = Math.max(1, Math.round(f.height * dpr));

    sw = {
      x: (r.left - f.left) * dpr, y: (r.top - f.top) * dpr,
      w: r.width * dpr,           h: r.height * dpr
    };
  }

  /* The CSS mask that stops the art reading as a pasted rectangle is in
     element space, so it cannot come along for the ride. The same two
     shapes are cut into the canvas instead, under the same transform as
     the picture: a soft oval, and a fade top and bottom. */
  function feather(x, y, w, h) {
    kc.globalAlpha = 1;
    kc.globalCompositeOperation = "destination-out";

    const rx = w * 0.86, ry = h * 0.84;
    kc.save();
    kc.translate(x + w * 0.5, y + h * 0.48);
    kc.scale(1, ry / rx);
    const oval = kc.createRadialGradient(0, 0, rx * 0.52, 0, 0, rx);
    oval.addColorStop(0, "rgba(0,0,0,0)");
    oval.addColorStop(1, "rgba(0,0,0,1)");
    kc.fillStyle = oval;
    kc.fillRect(-rx * 2, -rx * 2, rx * 4, rx * 4);
    kc.restore();

    const ends = kc.createLinearGradient(0, y, 0, y + h);
    ends.addColorStop(0,    "rgba(0,0,0,1)");
    ends.addColorStop(0.07, "rgba(0,0,0,0)");
    ends.addColorStop(0.93, "rgba(0,0,0,0)");
    ends.addColorStop(1,    "rgba(0,0,0,1)");
    kc.fillStyle = ends;
    kc.fillRect(x, y, w, h);

    kc.globalCompositeOperation = "source-over";
  }

  function swallow(p) {
    if (!kc || !art || !sw) return;
    const t = performance.now() * 0.001;

    kc.setTransform(1, 0, 0, 1, 0, 0);
    kc.clearRect(0, 0, keeper.width, keeper.height);

    // the mouth, in this canvas's own pixels
    const mx = sw.x + sw.w * RealmCreature.MOUTH.x;
    const my = sw.y + sw.h * RealmCreature.MOUTH.y;

    const s = 1 + 15 * p * p * p;
    kc.translate(mx, my); kc.scale(s, s); kc.translate(-mx, -my);
    kc.globalAlpha = Math.max(0, 1 - Math.pow(p, 2.6));

    /* The warp is 130 separate draws, and every join between them shows
       as a line once the picture is several times its own size. So the
       warp is spent early, while the picture is still near its own
       scale, and after that it is one single draw with nothing to join.
       Every term dies with `ease`, so the two paths meet exactly and
       there is no moment where the seams visibly vanish. */
    const ease = Math.max(0, 1 - p / 0.35);

    if (ease <= 0) {
      kc.drawImage(art, sw.x, sw.y, sw.w, sw.h);
    } else {
      const aw = art.naturalWidth, ah = art.naturalHeight;
      const src = ah / SLICES;
      const k   = sw.h / ah;        // picture pixels -> canvas pixels
      const e2  = ease * ease;

      const amp  = (sw.w * 0.009) * e2;
      const roll = (sw.w * 0.003) * e2;
      const over = amp * 2.2 + roll * 2.2 + 2 * e2;

      for (let i = 0; i < SLICES; i++) {
        const f  = i / SLICES;
        const dx = Math.sin(f * 3.1 + t * 0.9) * amp
                 + Math.sin(f * 5.4 - t * 0.52) * roll;
        kc.drawImage(art, 0, i * src, aw, src + 2,
                     sw.x + dx - over, sw.y + i * src * k,
                     sw.w + over * 2, (src + 2) * k);
      }
    }

    feather(sw.x, sw.y, sw.w, sw.h);

    kc.setTransform(1, 0, 0, 1, 0, 0);
    kc.globalAlpha = 1;
  }

  /* ---------- states ---------- */
  const gate    = document.querySelector(".gate");
  const journey = document.querySelector(".journey");

  function go(next) {
    phase = next;
    phaseAt = performance.now();
    document.body.dataset.phase = next;
    if (next === "tunnel") {
      /* The feedback buffers still hold the lit sky. Feeding that
         forward is what bleached the tunnel to grey. */
      for (const [cv, cx2] of [[A, a], [B, b]]) {
        cx2.setTransform(1, 0, 0, 1, 0, 0);
        cx2.fillStyle = "#000";
        cx2.fillRect(0, 0, cv.width, cv.height);
        cx2.setTransform(SC, 0, 0, SC, 0, 0);
      }
    }
  }

  const SWALLOW_MS = 1150;          // how long the mouth takes to take you

  function enter() {
    if (phase !== "gate") return;
    if (still) { gate.classList.add("gone"); land(); return; }

    beginSwallow();                 // measure first: the class below moves it
    gate.classList.add("gone");

    const t0 = performance.now();
    (function pull(now) {
      const p = Math.min(1, (now - t0) / SWALLOW_MS);
      swallow(p);
      if (p < 1) requestAnimationFrame(pull);
      else if (gate) gate.style.display = "none";
    })(t0);

    setTimeout(() => go("tunnel"), SWALLOW_MS * 0.62);
    setTimeout(land, SWALLOW_MS + TUNNEL_MS);
  }

  function land() {
    go("options");
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
