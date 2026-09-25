/* ============================================================
   REALM — the opening.

   A kaleidoscopic tunnel rushing outward through the whole spectrum.
   Drawn at half size so it stays smooth on a phone.
   Nothing here needs editing.
   ============================================================ */

(() => {
  "use strict";

  const canvas = document.getElementById("sky");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const bg  = document.createElement("canvas");
  const g   = bg.getContext("2d");

  let W = 0, H = 0, R = 0, cx = 0, cy = 0;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    bg.width  = Math.max(1, Math.floor(W / 2));
    bg.height = Math.max(1, Math.floor(H / 2));
    cx = W / 2; cy = H / 2;
    R  = Math.hypot(W, H) * 0.62;
  }
  window.addEventListener("resize", resize);

  const TUNNEL = 16;   // rings rushing outward
  const SYM    = 12;   // mirrored wedges

  function paint(t) {
    g.setTransform(0.5, 0, 0, 0.5, 0, 0);
    g.fillStyle = "#03010a";
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = "lighter";

    const hue = t * 26;

    /* ---- the tunnel: polygons racing out of the centre ---- */
    g.save();
    g.translate(cx, cy);
    const z = (t * 0.22) % 1;
    for (let k = 0; k < TUNNEL; k++) {
      const f  = ((k / TUNNEL) + z) % 1;      // 0 at the centre, 1 at the rim
      const rr = Math.pow(f, 2.1) * R * 1.5;
      if (rr < 2) continue;

      const fade  = Math.min(1, f * 3) * (1 - f) * 1.7;
      const sides = 6 + (k % 3);
      const spin  = t * 0.16 * (k % 2 ? 1 : -1) + k * 0.4;

      g.save();
      g.rotate(spin);
      g.beginPath();
      for (let i = 0; i <= sides; i++) {
        const a = (i / sides) * Math.PI * 2;
        i ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
          : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      g.strokeStyle = `hsla(${hue + k * 31},100%,66%,${0.78 * fade})`;
      g.lineWidth = 1 + f * 4.5;
      g.stroke();
      g.restore();
    }
    g.restore();

    /* ---- mirrored wedges of moving colour ---- */
    g.save();
    g.translate(cx, cy);
    g.rotate(t * 0.05);
    for (let i = 0; i < SYM; i++) {
      g.rotate((Math.PI * 2) / SYM);
      g.beginPath();
      for (let k = 0; k < 9; k++) {
        const rr = R * (0.06 + k * 0.1) + Math.sin(t * 0.7 + k * 1.1) * 34;
        const sp = 0.1 + Math.sin(t * 0.42 + k) * 0.07;
        g.moveTo(Math.cos(-sp) * rr, Math.sin(-sp) * rr);
        g.lineTo(Math.cos(sp) * rr, Math.sin(sp) * rr);
      }
      g.strokeStyle = `hsla(${hue + i * 30 + 120},100%,70%,0.42)`;
      g.lineWidth = 1.8;
      g.stroke();
    }
    g.restore();

    /* ---- the burning centre ---- */
    const core = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.42);
    core.addColorStop(0,    `hsla(${hue + 60},100%,86%,0.5)`);
    core.addColorStop(0.18, `hsla(${hue},100%,62%,0.26)`);
    core.addColorStop(0.55, `hsla(${hue + 180},100%,52%,0.09)`);
    core.addColorStop(1,    "hsla(0,0%,0%,0)");
    g.fillStyle = core;
    g.fillRect(0, 0, W, H);

    g.globalCompositeOperation = "source-over";

    /* ---- hold the edges to black so the buttons read ---- */
    const vig = g.createRadialGradient(cx, cy, Math.min(W, H) * 0.13, cx, cy, R);
    vig.addColorStop(0,    "rgba(3,1,10,0)");
    vig.addColorStop(0.62, "rgba(3,1,10,0.3)");
    vig.addColorStop(1,    "rgba(3,1,10,0.88)");
    g.fillStyle = vig;
    g.fillRect(0, 0, W, H);

    ctx.drawImage(bg, 0, 0, W, H);
  }

  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let last = 0;

  function loop(ms) {
    if (!document.hidden && ms - last > 26) {
      last = ms;
      paint(ms * 0.001);
    }
    requestAnimationFrame(loop);
  }

  resize();
  paint(0);
  if (!still) requestAnimationFrame(loop);
})();
