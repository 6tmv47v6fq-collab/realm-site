/* ============================================================
   REALM — the Gatekeeper.

   An original being drawn from scratch: bilaterally symmetrical,
   built from neon linework and mandala geometry. Its mouth is the
   way in, and the tunnel is behind it.

   Everything is drawn once into a canvas, so it costs nothing to
   display. Nothing here needs editing.
   ============================================================ */

window.RealmCreature = (() => {
  "use strict";

  /* where the mouth sits, as a fraction of the drawing — the gate
     zooms into exactly this point */
  const MOUTH = { x: 0.5, y: 0.287 };

  const W = 980, H = 1340;
  const CX = W / 2, CY = 650;          // origin: centre of the body

  const hsla = (h, s, l, a) => `hsla(${((h % 360) + 360) % 360},${s}%,${l}%,${a})`;

  function draw() {
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    g.translate(CX, CY);
    g.lineCap = "round";
    g.lineJoin = "round";

    /* every stroke is laid down three times: a wide dim bloom, a mid
       pass, then a tight bright core. That is what makes a line glow. */
    const glow = (hue, w, draws) => {
      for (const [lw, al, lift] of [[w * 4.5, 0.12, 55], [w * 2, 0.4, 62], [w * 0.85, 0.95, 80]]) {
        g.strokeStyle = hsla(hue, 100, lift, al);
        g.lineWidth = lw;
        draws();
      }
    };

    /* draw once on the right, mirrored on the left */
    const both = fn => {
      fn(1);
      g.save(); g.scale(-1, 1); fn(1); g.restore();
    };

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
        g.moveTo(px + dr, py);
        g.arc(px, py, dr, 0, Math.PI * 2);
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

    /* a gear-mandala, the motif the whole creature is built from */
    const gear = (x, y, r, hue, teeth) => {
      glow(hue,       1.1, () => ring(x, y, r, 40));
      glow(hue + 40,  0.9, () => ring(x, y, r * 0.74, teeth));
      glow(hue + 90,  0.8, () => spokes(x, y, r * 0.3, r * 0.74, teeth));
      glow(hue + 150, 0.9, () => dots(x, y, r * 0.88, teeth, r * 0.085));
      glow(hue + 200, 1,   () => ring(x, y, r * 0.3, 20));
      glow(hue + 60,  0.8, () => ring(x, y, r * 0.14, 14));
    };

    /* ---------- behind it: rays and glyph field ---------- */
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const r0 = 300 + (i % 5) * 26, r1 = 640 + (i % 7) * 34;
      g.strokeStyle = hsla(i * 13, 100, 60, 0.16);
      g.lineWidth = 7;
      g.beginPath();
      g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 - 120);
      g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1 - 120);
      g.stroke();
    }

    /* ---------- the plinth it stands on ---------- */
    for (let k = 0; k < 4; k++) {
      const r = 84 + k * 30;
      glow(196 + k * 34, 1, () => ring(0, 452, r, 22 + k * 6));
    }
    glow(280, 1.1, () => spokes(0, 452, 84, 174, 22));
    glow(150, 1,   () => dots(0, 452, 158, 22, 8));

    /* ---------- lower body ---------- */
    gear(0, 306, 78, 186, 16);
    both(() => gear(118, 196, 50, 306, 12));

    // spine
    for (let k = 0; k < 6; k++) {
      const y = 118 - k * 44;
      glow(258 + k * 22, 1, () => {
        g.beginPath();
        g.rect(-38, y - 17, 76, 34);
        g.stroke();
      });
      glow(150 + k * 30, 0.8, () => ring(0, y, 13, 12));
    }

    // ribs
    both(() => {
      for (let k = 0; k < 5; k++) {
        const y = 86 - k * 40;
        glow(310 + k * 22, 0.9, () => {
          g.beginPath();
          g.moveTo(34, y);
          g.quadraticCurveTo(104, y - 14, 122, y - 52);
          g.stroke();
        });
      }
    });

    /* ---------- chest ---------- */
    both(() => gear(104, -70, 76, 330, 18));
    glow(190, 1.2, () => {           // the triangle between them
      g.beginPath();
      g.moveTo(0, -168); g.lineTo(132, 34); g.lineTo(-132, 34); g.closePath();
      g.stroke();
    });
    glow(320, 1.2, () => {
      g.beginPath();
      g.rect(-84, -128, 168, 124);
      g.stroke();
    });
    glow(46, 1, () => ring(0, -70, 28, 16));

    /* ---------- arms ---------- */
    both(() => {
      // upper arm, segmented
      for (let k = 0; k < 5; k++) {
        const x = 176 + k * 36, y = -196 + k * 3;
        glow(174 + k * 22, 0.95, () => ring(x, y, 26 - k * 2, 10, k * 0.3));
        glow(210 + k * 28, 0.75, () => dots(x, y, 34 - k * 2.2, 6, 3.6, k * 0.4));
      }
      // shoulder
      gear(140, -206, 50, 150, 14);
      // hand: a palm mandala and five fingers, open toward you
      const hx = 352, hy = -200;
      gear(hx, hy, 42, 286, 12);
      for (let f = 0; f < 5; f++) {
        const a = -2.34 + f * 0.44;
        glow(196 + f * 26, 1.05, () => {
          g.beginPath();
          g.moveTo(hx + Math.cos(a) * 36, hy + Math.sin(a) * 36);
          g.lineTo(hx + Math.cos(a) * 92, hy + Math.sin(a) * 92);
          g.stroke();
        });
        glow(320, 0.85, () =>
          ring(hx + Math.cos(a) * 96, hy + Math.sin(a) * 96, 8, 8));
      }
    });

    /* ---------- neck ---------- */
    for (let k = 0; k < 3; k++) {
      glow(200 + k * 40, 1, () => ring(0, -196 + k * 16, 30 - k * 4, 14));
    }
    glow(330, 0.9, () => {
      g.beginPath();
      g.moveTo(-34, -168); g.lineTo(-52, -132);
      g.moveTo(34, -168);  g.lineTo(52, -132);
      g.stroke();
    });

    /* ---------- head ---------- */
    const HY = -358;

    glow(268, 1.3, () => {           // skull
      g.beginPath();
      g.moveTo(0, HY - 132);
      g.bezierCurveTo(124, HY - 124, 150, HY - 12, 100, HY + 86);
      g.bezierCurveTo(58, HY + 156, -58, HY + 156, -100, HY + 86);
      g.bezierCurveTo(-150, HY - 12, -124, HY - 124, 0, HY - 132);
      g.stroke();
    });

    both(() => gear(56, HY - 18, 44, 160, 12));   // eyes
    glow(46, 1, () => ring(0, HY - 76, 18, 10));  // third eye

    /* the mouth — the way in. Left dark on purpose. */
    const MY = HY + 88;
    for (let k = 0; k < 4; k++) {
      glow(300 + k * 30, 1.2, () => {
        g.beginPath();
        g.ellipse(0, MY, 78 - k * 16, 38 - k * 8, 0, 0, Math.PI * 2);
        g.stroke();
      });
    }
    glow(190, 0.9, () => spokes(0, MY, 24, 74, 20));

    /* ---------- crown ---------- */
    both(() => {
      for (let k = 0; k < 7; k++) {
        const lean = 0.16 + k * 0.17;
        const len  = 250 - k * 16;
        glow(20 + k * 28, 1.1, () => {
          g.beginPath();
          g.moveTo(16 + k * 10, HY - 118);
          g.quadraticCurveTo(
            74 + k * 34, HY - 118 - len * 0.7,
            52 + Math.sin(lean) * 230, HY - 118 - len);
          g.stroke();
        });
        glow(150 + k * 30, 0.9, () =>
          ring(52 + Math.sin(lean) * 230, HY - 118 - len, 14 - k * 0.7, 9));
        glow(280 + k * 20, 0.7, () =>
          dots(52 + Math.sin(lean) * 230, HY - 118 - len, 26 - k, 6, 3.4));
      }
    });

    return cv;
  }

  return { draw, MOUTH, W, H };
})();
