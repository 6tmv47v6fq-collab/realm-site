/* ============================================================
   REALM — the living sky behind the homepage.

   A slow kaleidoscope that drifts through the whole spectrum, drawn
   at half size and capped to 30 frames a second so it costs almost
   nothing on a phone. Nothing here needs editing.
   ============================================================ */

(() => {
  "use strict";

  const canvas = document.getElementById("sky");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const bg  = document.createElement("canvas");
  const bgc = bg.getContext("2d");

  let W = 0, H = 0;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    bg.width  = Math.max(1, Math.floor(W / 2));
    bg.height = Math.max(1, Math.floor(H / 2));
  }
  window.addEventListener("resize", resize);

  function paint(t) {
    const g = bgc;
    g.setTransform(0.5, 0, 0, 0.5, 0, 0);
    g.fillStyle = "#04020a";
    g.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H * 0.42, R = Math.max(W, H);
    const hue = t * 9;

    g.globalCompositeOperation = "lighter";

    // drifting colour fields
    for (let k = 0; k < 3; k++) {
      const a  = t * (0.08 + k * 0.05) + k * 2.1;
      const px = cx + Math.cos(a) * W * 0.4;
      const py = cy + Math.sin(a * 0.8) * H * 0.3;
      const grad = g.createRadialGradient(px, py, 0, px, py, R * 0.55);
      const h = hue + k * 115;
      grad.addColorStop(0,    `hsla(${h},100%,58%,0.17)`);
      grad.addColorStop(0.45, `hsla(${h + 50},100%,52%,0.07)`);
      grad.addColorStop(1,    "hsla(0,0%,0%,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, W, H);
    }

    // mirrored spokes
    const SYM = 14;
    g.save();
    g.translate(cx, cy);
    g.rotate(t * 0.035);
    for (let i = 0; i < SYM; i++) {
      g.rotate((Math.PI * 2) / SYM);
      g.beginPath();
      for (let k = 0; k < 8; k++) {
        const rr = R * (0.06 + k * 0.08) + Math.sin(t * 0.5 + k * 1.2) * 30;
        const sp = 0.11 + Math.sin(t * 0.3 + k) * 0.06;
        g.moveTo(Math.cos(-sp) * rr, Math.sin(-sp) * rr);
        g.lineTo(Math.cos(sp) * rr, Math.sin(sp) * rr);
      }
      g.strokeStyle = `hsla(${hue + i * 26},100%,66%,0.26)`;
      g.lineWidth = 1.6;
      g.stroke();
    }
    g.restore();

    // breathing sacred geometry
    g.save();
    g.translate(cx, cy);
    g.rotate(-t * 0.045);
    for (let k = 0; k < 6; k++) {
      const rr = Math.min(W, H) * (0.13 + k * 0.095) + Math.sin(t * 0.55 + k) * 11;
      const sides = 6 + (k % 3);
      g.beginPath();
      for (let i = 0; i <= sides; i++) {
        const a = (i / sides) * Math.PI * 2 + k * 0.3;
        i ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
          : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      g.strokeStyle = `hsla(${hue + 140 + k * 38},100%,70%,0.3)`;
      g.lineWidth = 1.2;
      g.stroke();
    }
    g.restore();

    g.globalCompositeOperation = "source-over";

    // hold the edges down to black so text stays readable
    const vig = g.createRadialGradient(cx, cy, Math.min(W, H) * 0.2, cx, cy, R * 0.75);
    vig.addColorStop(0, "rgba(4,2,10,0)");
    vig.addColorStop(1, "rgba(4,2,10,0.93)");
    g.fillStyle = vig;
    g.fillRect(0, 0, W, H);

    ctx.drawImage(bg, 0, 0, W, H);
  }

  const slow = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let last = 0;

  function loop(ms) {
    if (!document.hidden) {
      if (ms - last > 33) {            // 30fps is plenty for a backdrop
        last = ms;
        paint(ms * 0.001);
      }
    }
    requestAnimationFrame(loop);
  }

  resize();
  paint(0);
  if (!slow) requestAnimationFrame(loop);
})();
