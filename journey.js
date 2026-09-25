/* ============================================================
   REALM — the journey.

   The menu is not a grid of buttons. It is one shape that never
   stops existing: scroll and it melts from one option into the next,
   carrying its colour, its lettering and the geometry behind it.

   The options themselves are defined in OPTIONS below.
   ============================================================ */

window.RealmJourney = (() => {
  "use strict";

  const OPTIONS = [
    { key: "mint",  label: "MINT",              kind: "hex",     hue: 288, sub: "",        panel: "mint" },
    { key: "map",   label: "MAP",               kind: "diamond", hue: 196, sub: "ten sectors", href: "realm.html" },
    { key: "nfts",  label: "NFTS",              kind: "bloom",   hue: 268, sub: "the beings", panel: "nfts" },
    { key: "x",     label: "X",                 kind: "star",    hue: 44,  sub: "follow",  link: "x" },
    { key: "story", label: "THE STORY SO FAR",  kind: "circle",  hue: 152, sub: "",        panel: "lore" }
  ];

  /* ---------- shapes, as a radius for any angle ----------
     Describing every shape this way means morphing between them is
     just averaging two numbers. */
  function radius(kind, a) {
    const poly = n => {
      const step = Math.PI * 2 / n;
      const h = ((a % step) + step) % step - step / 2;
      return Math.cos(step / 2) / Math.cos(h);
    };
    switch (kind) {
      case "hex":     return poly(6);
      case "diamond": return poly(4);
      case "circle":  return 1;
      case "star":    return 0.62 + 0.38 * Math.abs(Math.cos(a * 4));
      case "bloom":   return 0.82 + 0.18 * Math.cos(a * 6) + 0.06 * Math.cos(a * 12);
      default:        return 1;
    }
  }

  const lerp  = (a, b, t) => a + (b - a) * t;
  const ease  = t => t * t * (3 - 2 * t);

  /* ---------- liquid lettering ----------
     Baked flat, then warped column by column as it is drawn, so the
     words flow like the lettering in the artwork. */
  function bakeLabel(text, hue) {
    const pad = 46, size = 96;
    const m = document.createElement("canvas").getContext("2d");
    m.font = `800 ${size}px Syne, system-ui, sans-serif`;
    const w = Math.ceil(m.measureText(text).width) + pad * 2;
    const h = size + pad * 2;

    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const g = cv.getContext("2d");
    g.font = `800 ${size}px Syne, system-ui, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineJoin = "round";

    const x = w / 2, y = h / 2;

    g.strokeStyle = `hsla(${hue},100%,60%,0.5)`;   // outer bloom
    g.lineWidth = 26; g.strokeText(text, x, y);
    g.strokeStyle = "#f0d489";                      // gold rim
    g.lineWidth = 13; g.strokeText(text, x, y);
    g.strokeStyle = "#2a0f4d";
    g.lineWidth = 6;  g.strokeText(text, x, y);

    const fillGrad = g.createLinearGradient(0, y - size / 2, 0, y + size / 2);
    fillGrad.addColorStop(0,   "#ffffff");
    fillGrad.addColorStop(0.4, `hsl(${hue},100%,82%)`);
    fillGrad.addColorStop(1,   `hsl(${hue + 30},100%,64%)`);
    g.fillStyle = fillGrad;
    g.fillText(text, x, y);

    return cv;
  }

  return { OPTIONS, radius, lerp, ease, bakeLabel };
})();


(() => {
  "use strict";

  const wrap = document.querySelector(".journey");
  if (!wrap) return;

  const { OPTIONS, radius, lerp, ease, bakeLabel } = window.RealmJourney;
  const geo   = document.getElementById("geo");
  const morph = document.getElementById("morph");
  if (!geo || !morph) return;

  const gc = geo.getContext("2d");
  const mc = morph.getContext("2d");

  let W = 0, H = 0, MS = 0, labels = [];
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;

    geo.width  = Math.floor(W * 0.5);
    geo.height = Math.floor(H * 0.5);
    gc.setTransform(0.5, 0, 0, 0.5, 0, 0);

    MS = Math.min(W * 0.82, H * 0.42, 380);
    morph.style.width  = MS + "px";
    morph.style.height = MS + "px";
    morph.width  = Math.floor(MS * dpr);
    morph.height = Math.floor(MS * dpr);
    mc.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);

  /* ---------- where we are in the journey ---------- */
  function progress() {
    const stops = document.querySelectorAll(".stop");
    if (!stops.length) return 0;
    const step = stops[0].getBoundingClientRect().height || H;
    const p = wrap.scrollTop / step;
    return Math.max(0, Math.min(OPTIONS.length - 1, p));
  }

  /* ---------- the morphing gate ---------- */
  function drawMorph(p, t) {
    const i  = Math.min(OPTIONS.length - 1, Math.floor(p));
    const j  = Math.min(OPTIONS.length - 1, i + 1);
    const f  = ease(p - i);
    const A  = OPTIONS[i], B = OPTIONS[j];
    const hue = lerp(A.hue, B.hue < A.hue - 180 ? B.hue + 360 : B.hue, f);

    const c = MS / 2, R = MS * 0.42;
    mc.setTransform(mc.getTransform().a, 0, 0, mc.getTransform().d, 0, 0);
    mc.clearRect(0, 0, MS, MS);

    // the shape, as one path sampled all the way round
    const path = (scale, wob) => {
      mc.beginPath();
      const N = 140;
      for (let k = 0; k <= N; k++) {
        const a = (k / N) * Math.PI * 2 - Math.PI / 2;
        let r = lerp(radius(A.kind, a), radius(B.kind, a), f);
        r *= 1 + Math.sin(a * 3 + t * 1.1) * wob + Math.sin(a * 7 - t * 0.7) * wob * 0.5;
        const x = c + Math.cos(a) * r * R * scale;
        const y = c + Math.sin(a) * r * R * scale;
        k ? mc.lineTo(x, y) : mc.moveTo(x, y);
      }
      mc.closePath();
    };

    // lit body
    path(1, 0.02);
    const body = mc.createRadialGradient(c, c, 0, c, c, R);
    body.addColorStop(0,   `hsla(${hue + 30},100%,64%,0.62)`);
    body.addColorStop(0.6, `hsla(${hue},100%,44%,0.4)`);
    body.addColorStop(1,   `hsla(${hue - 30},100%,30%,0.62)`);
    mc.fillStyle = body;
    mc.fill();

    // gold rim, doubled for glow
    mc.strokeStyle = `hsla(${hue},100%,62%,0.55)`;
    mc.lineWidth = 12; mc.stroke();
    mc.strokeStyle = "#f0d489";
    mc.lineWidth = 3.2; mc.stroke();

    // an inner echo, turning the other way
    path(0.74, -0.03);
    mc.strokeStyle = `hsla(${hue + 60},100%,76%,0.5)`;
    mc.lineWidth = 1.6; mc.stroke();

    // the lettering, crossfading as one melts into the next
    const put = (img, alpha) => {
      if (alpha <= 0.01 || !img) return;
      const maxW = MS * 0.66;
      const s = Math.min(maxW / img.width, (MS * 0.3) / img.height);
      const dw = img.width * s, dh = img.height * s;
      const COLS = 26, cw = img.width / COLS;
      mc.globalAlpha = alpha;
      for (let k = 0; k < COLS; k++) {
        const off = Math.sin(k / COLS * 5.5 + t * 1.6) * (MS * 0.012);
        mc.drawImage(img, k * cw, 0, cw + 1, img.height,
                     c - dw / 2 + k * (dw / COLS), c - dh / 2 + off,
                     dw / COLS + 1, dh);
      }
      mc.globalAlpha = 1;
    };
    /* Hand the word over rather than crossfading it: two sets of
       letters sitting on top of each other read as a smudge. */
    put(labels[i], 1 - Math.min(1, f * 2.3));
    put(labels[j], Math.max(0, f * 2.3 - 1.3));
  }

  /* ---------- the geometry behind it ---------- */
  function drawGeo(p, t) {
    const i = Math.min(OPTIONS.length - 1, Math.floor(p));
    const j = Math.min(OPTIONS.length - 1, i + 1);
    const f = ease(p - i);
    const A = OPTIONS[i], B = OPTIONS[j];
    const hue = lerp(A.hue, B.hue < A.hue - 180 ? B.hue + 360 : B.hue, f);

    gc.setTransform(0.5, 0, 0, 0.5, 0, 0);
    gc.fillStyle = "#04000e";
    gc.fillRect(0, 0, W, H);
    gc.globalCompositeOperation = "lighter";

    const cx = W / 2, cy = H / 2, R = Math.hypot(W, H) * 0.6;
    const RINGS = 14, SYM = 6;

    gc.save();
    gc.translate(cx, cy);
    for (let m = 0; m < SYM; m++) {
      gc.save();
      gc.rotate((m / SYM) * Math.PI * 2 + t * 0.03 * (m % 2 ? 1 : -1));
      for (let k = 0; k < RINGS; k++) {
        const z  = ((k / RINGS) + (t * 0.05) % 1) % 1;
        const rr = Math.pow(z, 1.7) * R;
        if (rr < 3) continue;
        const fade = Math.min(1, z * 4) * (1 - z);

        gc.beginPath();
        const N = 60;
        for (let n = 0; n <= N; n++) {
          const a = (n / N) * Math.PI * 2;
          const r = lerp(radius(A.kind, a), radius(B.kind, a), f) * rr;
          const x = Math.cos(a + k * 0.2 + t * 0.1) * r;
          const y = Math.sin(a + k * 0.2 + t * 0.1) * r;
          n ? gc.lineTo(x, y) : gc.moveTo(x, y);
        }
        gc.closePath();
        gc.strokeStyle = `hsla(${hue + k * 14},100%,62%,${0.5 * fade})`;
        gc.lineWidth = 0.8 + z * 3;
        gc.stroke();
      }
      gc.restore();
    }
    gc.restore();

    const core = gc.createRadialGradient(cx, cy, 0, cx, cy, R * 0.45);
    core.addColorStop(0, `hsla(${hue + 40},100%,72%,0.2)`);
    core.addColorStop(1, "hsla(0,0%,0%,0)");
    gc.fillStyle = core;
    gc.fillRect(0, 0, W, H);

    gc.globalCompositeOperation = "source-over";
    const vig = gc.createRadialGradient(cx, cy, Math.min(W, H) * 0.18, cx, cy, R);
    vig.addColorStop(0,   "rgba(4,0,14,0)");
    vig.addColorStop(0.7, "rgba(4,0,14,0.42)");
    vig.addColorStop(1,   "rgba(4,0,14,0.9)");
    gc.fillStyle = vig;
    gc.fillRect(0, 0, W, H);
  }

  /* ---------- which option are we on ---------- */
  let current = 0;
  function settle(p) {
    const n = Math.round(p);
    if (n === current) return;
    current = n;
    document.querySelectorAll(".dot-j").forEach((d, k) =>
      d.classList.toggle("on", k === n));
    const o = OPTIONS[n];
    const sub = document.querySelector(".j-sub");
    if (sub) sub.textContent = o.sub || "";
  }

  function choose() {
    const o = OPTIONS[Math.round(progress())];
    if (o.href) { window.location.href = o.href; return; }
    if (o.link) {
      const url = (window.CONFIG && CONFIG.links && CONFIG.links[o.link]) || "";
      if (url) window.open(url, "_blank", "noopener");
      return;
    }
    if (o.panel && window.RealmPanels) window.RealmPanels.show(o.panel);
  }
  morph.addEventListener("click", choose);

  /* ---------- the loop ---------- */
  let running = false, last = 0;
  function tick(ms) {
    if (!running) return;
    requestAnimationFrame(tick);
    if (document.hidden || ms - last < 30) return;
    last = ms;
    const t = ms * 0.001;
    const p = progress();
    settle(p);
    drawGeo(p, t);
    drawMorph(p, t);
  }

  /* ---------- build ---------- */
  function build() {
    const stops = document.querySelector(".j-stops");
    const dots  = document.querySelector(".j-dots");
    OPTIONS.forEach((o, i) => {
      const sec = document.createElement("section");
      sec.className = "stop";
      // a real control for keyboards and screen readers
      const btn = document.createElement(o.href ? "a" : "button");
      btn.className = "stop-hit";
      if (o.href) btn.href = o.href; else btn.type = "button";
      btn.textContent = o.label;
      btn.addEventListener("click", e => {
        if (!o.href) { e.preventDefault(); wrap.scrollTo({ top: i * H, behavior: "smooth" }); setTimeout(choose, 420); }
      });
      sec.appendChild(btn);
      stops.appendChild(sec);

      const d = document.createElement("button");
      d.className = "dot-j" + (i ? "" : " on");
      d.type = "button";
      d.setAttribute("aria-label", o.label);
      d.addEventListener("click", () => wrap.scrollTo({ top: i * H, behavior: "smooth" }));
      dots.appendChild(d);
    });
  }

  function start() {
    if (running) return;
    build();
    resize();
    labels = OPTIONS.map(o => bakeLabel(o.label, o.hue));
    running = true;
    settle(0);
    drawGeo(0, 0); drawMorph(0, 0);
    if (!still) requestAnimationFrame(tick);
  }

  window.RealmJourney.start = start;
})();
