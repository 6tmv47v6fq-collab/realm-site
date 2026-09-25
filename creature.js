/* ============================================================
   REALM — the Gatekeeper.

   An original being, drawn in code. Filled forms rather than
   wireframe: gradient bodies, layered depth, a glyph field behind it
   and feathered fans spread out either side. Its mouth is the way in.

   Baked once into a canvas, so the detail is free to display.
   Nothing here needs editing.
   ============================================================ */

window.RealmCreature = (() => {
  "use strict";

  const MOUTH = { x: 0.5, y: 0.315 };

  const W = 1120, H = 1520;
  const CX = W / 2, CY = 760;

  const hsla = (h, s, l, a) => `hsla(${((h % 360) + 360) % 360},${s}%,${l}%,${a})`;

  /* a small deterministic random, so the being never changes */
  let seed = 20260925;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  function draw() {
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    g.translate(CX, CY);
    g.lineCap = "round";
    g.lineJoin = "round";

    /* ---------- helpers ---------- */

    // three passes: wide dim bloom, mid, tight bright core
    const glow = (hue, w, draws, lift) => {
      for (const [lw, al, l] of [[w * 5, 0.1, 50], [w * 2.1, 0.36, 60], [w * 0.85, 0.96, lift || 82]]) {
        g.strokeStyle = hsla(hue, 100, l, al);
        g.lineWidth = lw;
        draws();
      }
    };

    // a filled, lit body of colour — this is what stops it being a wireframe
    const fill = (x, y, r, hue, alpha, squash) => {
      g.save();
      g.translate(x, y);
      g.scale(1, squash || 1);
      const grad = g.createRadialGradient(0, 0, 0, 0, 0, r);
      grad.addColorStop(0,    hsla(hue + 40, 100, 70, alpha));
      grad.addColorStop(0.45, hsla(hue,      100, 52, alpha * 0.72));
      grad.addColorStop(0.8,  hsla(hue - 40, 100, 42, alpha * 0.3));
      grad.addColorStop(1,    hsla(hue,      100, 40, 0));
      g.fillStyle = grad;
      g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
      g.restore();
    };

    const both = fn => { fn(); g.save(); g.scale(-1, 1); fn(); g.restore(); };

    const ring = (x, y, r, sides, rot) => {
      g.beginPath();
      for (let i = 0; i <= sides; i++) {
        const a = (i / sides) * Math.PI * 2 + (rot || 0);
        const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
        i ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.stroke();
    };

    const dots = (x, y, r, n, dr, rot) => {
      g.beginPath();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (rot || 0);
        const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
        g.moveTo(px + dr, py); g.arc(px, py, dr, 0, Math.PI * 2);
      }
      g.stroke();
    };

    const spokes = (x, y, r0, r1, n, rot) => {
      g.beginPath();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (rot || 0);
        g.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
        g.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
      }
      g.stroke();
    };

    // the motif the whole creature is built from: a lit gear-mandala
    const gear = (x, y, r, hue, teeth) => {
      fill(x, y, r * 1.5, hue, 0.5);
      glow(hue,       1.3, () => ring(x, y, r, 44));
      glow(hue + 40,  1,   () => ring(x, y, r * 0.74, teeth));
      glow(hue + 90,  0.9, () => spokes(x, y, r * 0.3, r * 0.74, teeth));
      glow(hue + 150, 1,   () => dots(x, y, r * 0.88, teeth, r * 0.085));
      glow(hue + 200, 1.1, () => ring(x, y, r * 0.3, 20));
      fill(x, y, r * 0.3, hue + 120, 0.85);
      glow(hue + 60,  0.9, () => ring(x, y, r * 0.14, 14));
    };

    g.globalCompositeOperation = "lighter";

    /* ---------- 1. the glyph field it stands against ---------- */
    for (let row = -9; row <= 9; row++) {
      for (let col = -9; col <= 9; col++) {
        const x = col * 62 + (row % 2 ? 31 : 0), y = row * 74;
        if (Math.hypot(x, y) > 780) continue;
        const k = Math.floor(rnd() * 4);
        g.strokeStyle = hsla(190 + rnd() * 160, 90, 52, 0.12 + rnd() * 0.1);
        g.lineWidth = 1.6;
        g.beginPath();
        if (k === 0)      { g.rect(x - 8, y - 8, 16, 16); }
        else if (k === 1) { g.moveTo(x - 9, y); g.lineTo(x + 9, y); g.moveTo(x, y - 9); g.lineTo(x, y + 9); }
        else if (k === 2) { g.arc(x, y, 8, 0, Math.PI * 2); }
        else              { g.moveTo(x - 9, y + 8); g.lineTo(x, y - 9); g.lineTo(x + 9, y + 8); g.closePath(); }
        g.stroke();
      }
    }

    /* ---------- 2. the fans spread behind it ---------- */
    both(() => {
      const SX = 150, SY = -250;                 // they grow from the shoulder
      for (let f = 0; f < 20; f++) {
        const a0  = -1.02 + f * 0.078;           // up-and-out, round to down-and-out
        const len = 430 - Math.abs(f - 9) * 14;
        const hue = 150 + f * 12;
        const tx = SX + Math.cos(a0) * len, ty = SY + Math.sin(a0) * len;
        g.beginPath();
        g.moveTo(SX, SY);
        g.quadraticCurveTo(SX + Math.cos(a0 - 0.22) * len * 0.62,
                           SY + Math.sin(a0 - 0.22) * len * 0.62, tx, ty);
        g.strokeStyle = hsla(hue, 100, 52, 0.3);
        g.lineWidth = 11; g.stroke();
        g.strokeStyle = hsla(hue + 30, 100, 74, 0.55);
        g.lineWidth = 2.4; g.stroke();
      }
    });

    /* ---------- 3. the aura ---------- */
    fill(0, -120, 560, 280, 0.2);
    fill(0, -330, 300, 200, 0.14);

    /* ---------- 4. the plinth ---------- */
    fill(0, 520, 300, 196, 0.45, 0.42);
    for (let k = 0; k < 5; k++) {
      const r = 96 + k * 42;
      glow(196 + k * 32, 1.3, () => ring(0, 520, r, 26 + k * 6));
    }
    glow(280, 1.3, () => spokes(0, 520, 96, 290, 26));
    glow(150, 1.2, () => dots(0, 520, 250, 26, 11));

    /* ---------- 5. lower body ---------- */
    gear(0, 350, 96, 186, 18);
    both(() => gear(134, 224, 58, 306, 12));

    // spine: filled segments
    for (let k = 0; k < 6; k++) {
      const y = 132 - k * 50;
      fill(0, y, 62, 258 + k * 20, 0.6);
      glow(258 + k * 22, 1.3, () => { g.beginPath(); g.rect(-44, y - 20, 88, 40); g.stroke(); });
      glow(150 + k * 30, 1,   () => ring(0, y, 15, 12));
    }

    // ribs
    both(() => {
      for (let k = 0; k < 6; k++) {
        const y = 100 - k * 44;
        glow(310 + k * 20, 1.1, () => {
          g.beginPath();
          g.moveTo(40, y);
          g.quadraticCurveTo(120, y - 16, 140, y - 60);
          g.stroke();
        });
      }
    });

    /* ---------- 6. chest ---------- */
    both(() => gear(118, -76, 86, 330, 18));
    fill(0, -60, 170, 300, 0.4);
    glow(190, 1.5, () => {
      g.beginPath();
      g.moveTo(0, -190); g.lineTo(150, 40); g.lineTo(-150, 40); g.closePath();
      g.stroke();
    });
    glow(320, 1.4, () => { g.beginPath(); g.rect(-96, -146, 192, 142); g.stroke(); });
    fill(0, -76, 44, 46, 0.85);
    glow(46, 1.2, () => ring(0, -76, 32, 16));

    /* ---------- 7. arms ---------- */
    both(() => {
      for (let k = 0; k < 5; k++) {
        const x = 196 + k * 40, y = -220 + k * 3;
        fill(x, y, 42, 174 + k * 22, 0.5);
        glow(174 + k * 22, 1.15, () => ring(x, y, 30 - k * 2, 10, k * 0.3));
        glow(210 + k * 28, 0.9,  () => dots(x, y, 39 - k * 2.4, 6, 4, k * 0.4));
      }
      gear(156, -232, 58, 150, 14);                 // shoulder

      const hx = 396, hy = -226;                    // open palm
      gear(hx, hy, 48, 286, 12);
      for (let f = 0; f < 5; f++) {
        const a = -2.36 + f * 0.44;
        glow(196 + f * 26, 1.25, () => {
          g.beginPath();
          g.moveTo(hx + Math.cos(a) * 40, hy + Math.sin(a) * 40);
          g.lineTo(hx + Math.cos(a) * 104, hy + Math.sin(a) * 104);
          g.stroke();
        });
        fill(hx + Math.cos(a) * 110, hy + Math.sin(a) * 110, 16, 320, 0.8);
        glow(320, 1, () => ring(hx + Math.cos(a) * 110, hy + Math.sin(a) * 110, 9, 8));
      }
    });

    /* ---------- 8. neck ---------- */
    for (let k = 0; k < 3; k++) {
      fill(0, -220 + k * 18, 40, 200 + k * 40, 0.55);
      glow(200 + k * 40, 1.2, () => ring(0, -220 + k * 18, 34 - k * 4, 14));
    }

    /* ---------- 9. head ---------- */
    const HY = -400;
    const skull = () => {
      g.beginPath();
      g.moveTo(0, HY - 150);
      g.bezierCurveTo(142, HY - 142, 172, HY - 14, 114, HY + 98);
      g.bezierCurveTo(66, HY + 178, -66, HY + 178, -114, HY + 98);
      g.bezierCurveTo(-172, HY - 14, -142, HY - 142, 0, HY - 150);
    };
    // filled head, then the line on top
    g.save();
    skull(); g.clip();
    fill(0, HY - 20, 210, 268, 0.34);
    fill(0, HY + 70, 130, 320, 0.28);
    g.restore();
    glow(268, 1.6, () => { skull(); g.stroke(); });

    both(() => gear(64, HY - 20, 50, 160, 12));     // eyes
    fill(0, HY - 86, 26, 46, 0.9);
    glow(46, 1.3, () => ring(0, HY - 86, 21, 10));  // third eye

    /* the mouth — the way in. A void with a lit rim. */
    const MY = HY + 100;
    g.globalCompositeOperation = "source-over";
    g.save();
    g.beginPath(); g.ellipse(0, MY, 92, 46, 0, 0, Math.PI * 2);
    g.fillStyle = "#01000a"; g.fill();
    g.restore();
    g.globalCompositeOperation = "lighter";
    for (let k = 0; k < 5; k++) {
      glow(300 + k * 26, 1.4, () => {
        g.beginPath();
        g.ellipse(0, MY, 92 - k * 17, 46 - k * 8.6, 0, 0, Math.PI * 2);
        g.stroke();
      });
    }
    glow(190, 1, () => spokes(0, MY, 26, 88, 22));

    /* ---------- 10. crown ---------- */
    both(() => {
      for (let k = 0; k < 9; k++) {
        const lean = 0.14 + k * 0.15;
        const len  = 300 - k * 16;
        const tipX = 56 + Math.sin(lean) * 270;
        const tipY = HY - 132 - len;
        glow(20 + k * 24, 1.35, () => {
          g.beginPath();
          g.moveTo(16 + k * 11, HY - 132);
          g.quadraticCurveTo(tipX * 0.5, HY - 132 - len * 0.62, tipX, tipY);
          g.stroke();
        });
        fill(tipX, tipY, 30, 150 + k * 26, 0.7);
        glow(150 + k * 26, 1.1, () => ring(tipX, tipY, 16 - k * 0.6, 9));
        glow(280 + k * 18, 0.9, () => dots(tipX, tipY, 30 - k, 6, 4));
      }
    });

    return cv;
  }

  return { draw, MOUTH, W, H };
})();
