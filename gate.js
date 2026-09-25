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

    g.strokeStyle = `hsla(${hue + k * 23},100%,${56 + (k % 3) * 8}%,${0.66 * fade})`;
    g.lineWidth = 0.8 + f * 5;
    polygon(g, rr, sides, rot);
    g.stroke();

    if (detail < 1) return;

    // a counter-turning polygon nested inside
    g.strokeStyle = `hsla(${hue + k * 23 + 150},100%,68%,${0.6 * fade})`;
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
    g.strokeStyle = `hsla(${hue + k * 23 + 60},100%,72%,${0.42 * fade})`;
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
    g.strokeStyle = `hsla(${hue + k * 23 + 210},100%,76%,${0.55 * fade})`;
    g.lineWidth = 0.7;
    g.stroke();
  }

  /* ---------- the frame ---------- */
  function paint(t, dt) {
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
    g.globalAlpha = phase === "tunnel" ? 0.82 + rush * 0.1 : 0.62;
    const zoom = 1 + (phase === "tunnel" ? 0.028 + rush * 0.05 : 0.012);
    const dw = front.width * zoom, dh = front.height * zoom;
    g.drawImage(back, (front.width - dw) / 2, (front.height - dh) / 2, dw, dh);
    g.globalAlpha = 1;
    g.setTransform(SC, 0, 0, SC, 0, 0);

    // darken what carried over, so trails decay instead of smearing white
    g.fillStyle = `rgba(0,0,0,${phase === "tunnel" ? 0.1 : 0.2})`;
    g.fillRect(0, 0, W, H);

    g.globalCompositeOperation = "lighter";
    g.lineCap = "round";

    const RINGS  = Math.round((phase === "tunnel" ? 46 : 20) * quality);
    const SYM    = phase === "tunnel" ? Math.round(2 + 10 * quality) : 3;
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
      kc.globalAlpha = Math.max(0, 1 - zoom * zoom * 1.25);
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
    if (phase !== "gate") return;              // the swallow takes over
    if (!document.hidden && ms - rlast > 32) { // 30fps is plenty for a drift
      rlast = ms;
      drawKeeper(ms * 0.001, 0);
    }
    requestAnimationFrame(ripple);
  }

  /* Being swallowed is drawn INSIDE the canvas, at its own fixed size.
     Scaling the element itself with CSS asks the browser to rasterise a
     layer thousands of pixels across, which locks a phone up for
     seconds. Redrawing the baked picture costs the same every frame
     however far in we are. */
  function swallow(p) { drawKeeper(performance.now() * 0.001, p); }

  /* ---------- states ---------- */
  const gate    = document.querySelector(".gate");
  const options = document.querySelector(".options");

  function go(next) {
    phase = next;
    phaseAt = performance.now();
    document.body.dataset.phase = next;
  }

  const SWALLOW_MS = 1150;          // how long the mouth takes to take you

  function enter() {
    if (phase !== "gate") return;
    gate.classList.add("gone");
    if (still) { land(); return; }

    const t0 = performance.now();
    (function pull(now) {
      const p = Math.min(1, (now - t0) / SWALLOW_MS);
      swallow(p);
      if (p < 1) requestAnimationFrame(pull);
      else if (gate) gate.style.display = "none";
    })(t0);

    setTimeout(() => go("tunnel"), SWALLOW_MS * 0.5);
    setTimeout(land, SWALLOW_MS + TUNNEL_MS);
  }

  function land() {
    go("options");
    options.hidden = false;
    requestAnimationFrame(() => options.classList.add("here"));
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
