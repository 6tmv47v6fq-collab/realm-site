/* ============================================================
   REALM — being forms.

   Generates what each being looks like. Shared by the 2D realm and
   the 3D world, so the same number always gives the same creature.
   Nothing in here needs editing.
   ============================================================ */

window.RealmForms = (() => {
  "use strict";

/* ---------- deterministic randomness ----------
     Same beings, same places, every single visit. */
  const seeded = seed => () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

/* ---------- pre-rendered glow sprites (drawn once, reused) ----------
     Painting a soft glow per being every frame would crawl on a phone.
     Instead each tier's glow is baked into a small image up front. */
  const SPRITE = {};
  const buildSprites = () => {
    TIERS.forEach(t => {
      const S = 128, c = document.createElement("canvas");
      c.width = c.height = S;
      const g = c.getContext("2d");
      const grad = g.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2);
      grad.addColorStop(0,    "rgba(255,255,255,0.95)");
      grad.addColorStop(0.10, hexA(t.color, 0.95));
      grad.addColorStop(0.28, hexA(t.color, 0.45));
      grad.addColorStop(0.55, hexA(t.color, 0.13));
      grad.addColorStop(1,    hexA(t.color, 0));
      g.fillStyle = grad;
      g.fillRect(0, 0, S, S);
      SPRITE[t.key] = c;
    });
  };
  /* full-spectrum colour — the realm is not a two-tone place */
  const hsla = (h, s, l, a) => `hsla(${((h % 360) + 360) % 360},${s}%,${l}%,${a})`;

  /* each tier has a dominant hue, but the bands range right around the
     wheel — the rarer the being, the wider its spectrum */
  const TIER_HUE = {
    common:    { base: 190, spread: 110 },
    uncommon:  { base: 140, spread: 130 },
    rare:      { base: 215, spread: 140 },
    epic:      { base: 285, spread: 150 },
    legendary: { base: 40,  spread: 165 },
    mythic:    { base: 355, spread: 180 },
    entity:    { base: 185, spread: 230 },
    god:       { base: 45,  spread: 360 }
  };

  const hexA = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
  };

/* ---------- per-tier look and behaviour ---------- */
  const TIER_STYLE = {
    common:    { size: 2.2,  glow: 11, speed: 0.30, turn: false },
    uncommon:  { size: 2.7,  glow: 14, speed: 0.27, turn: false },
    rare:      { size: 3.4,  glow: 18, speed: 0.23, turn: false },
    epic:      { size: 4.4,  glow: 24, speed: 0.19, turn: true  },
    legendary: { size: 5.8,  glow: 33, speed: 0.15, turn: true  },
    mythic:    { size: 7.4,  glow: 44, speed: 0.12, turn: true  },
    entity:    { size: 9.2,  glow: 58, speed: 0.09, turn: true  },
    god:       { size: 12.5, glow: 84, speed: 0.06, turn: true  }
  };

/* How elaborate each tier's form is: px = baked sprite size,
     rings = concentric bands of pattern, sym = fold symmetry. */
  const FORM = {
    common:    { px: 44,  rings: 3, sym: 6,  spin: 0.00004 },
    uncommon:  { px: 54,  rings: 4, sym: 8,  spin: 0.00005 },
    rare:      { px: 68,  rings: 5, sym: 10, spin: 0.00005 },
    epic:      { px: 84,  rings: 6, sym: 12, spin: 0.00006 },
    legendary: { px: 104, rings: 7, sym: 14, spin: 0.00006 },
    mythic:    { px: 124, rings: 8, sym: 16, spin: 0.00007 },
    entity:    { px: 146, rings: 9, sym: 20, spin: 0.00007 },
    god:       { px: 176, rings: 11, sym: 24, spin: 0.00008 }
  };

/* ---------- procedural beings ----------
     Every being is baked once into its own little image: concentric
     bands of neon geometry with fold symmetry, like a mandala grown out
     of circuitry. Baking means the detail costs nothing per frame. */
  function makeForm(being) {
    const cfg  = FORM[being.tier];
    const tier = TIERS.find(t => t.key === being.tier);
    const rnd  = seeded(being.id * 2654435761);
    const HUE  = TIER_HUE[being.tier];

    const S = cfg.px, c = S / 2;
    const cv = document.createElement("canvas");
    cv.width = cv.height = S;
    const g = cv.getContext("2d");
    g.translate(c, c);
    g.lineCap = "round";

    const neon = (color, w, a) => { g.strokeStyle = hexA(color, a); g.lineWidth = w; };
    const R = c * 0.94;

    for (let band = 0; band < cfg.rings; band++) {
      const rr    = R * (0.24 + 0.76 * ((band + 1) / cfg.rings));
      const sym   = cfg.sym + (band % 2 ? 0 : 2);
      const hue   = HUE.base + (rnd() - 0.5) * HUE.spread + band * 17;
      const motif = Math.floor(rnd() * 5);
      const w     = 0.8 + rnd() * 1.1;

      /* three passes: a wide bloom in a neighbouring hue, a mid pass,
         then a tight near-white core line. That chromatic fringe is
         what makes neon look lit rather than drawn. */
      const passes = [
        [w * 4.2, 0.16, hsla(hue + 40, 100, 58, 1)],
        [w * 1.9, 0.5,  hsla(hue,      100, 60, 1)],
        [w * 0.8, 0.98, hsla(hue,      100, 82, 1)]
      ];
      for (const [lw, al, col] of passes) {
        g.strokeStyle = col.replace(/,1\)$/, `,${al})`);
        g.lineWidth = lw;
        g.beginPath();

        if (motif === 0) {                                  // ring of nodes
          for (let i = 0; i < sym; i++) {
            const a = (i / sym) * Math.PI * 2;
            const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
            g.moveTo(x + rr * 0.09, y);
            g.arc(x, y, rr * 0.09, 0, Math.PI * 2);
          }
        } else if (motif === 1) {                           // spokes
          for (let i = 0; i < sym; i++) {
            const a = (i / sym) * Math.PI * 2;
            g.moveTo(Math.cos(a) * rr * 0.45, Math.sin(a) * rr * 0.45);
            g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
          }
        } else if (motif === 2) {                           // polygon
          for (let i = 0; i <= sym; i++) {
            const a = (i / sym) * Math.PI * 2;
            i ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
              : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
          }
        } else if (motif === 3) {                           // petals / arcs
          for (let i = 0; i < sym; i++) {
            const a = (i / sym) * Math.PI * 2;
            g.moveTo(Math.cos(a) * rr * 0.5, Math.sin(a) * rr * 0.5);
            g.quadraticCurveTo(
              Math.cos(a + 0.34) * rr, Math.sin(a + 0.34) * rr,
              Math.cos(a + 0.68) * rr * 0.5, Math.sin(a + 0.68) * rr * 0.5);
          }
        } else {                                            // circuit steps
          for (let i = 0; i < sym; i++) {
            const a = (i / sym) * Math.PI * 2;
            const s2 = rr * 0.16;
            const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
            g.moveTo(x - s2, y - s2); g.lineTo(x + s2, y - s2);
            g.lineTo(x + s2, y + s2); g.lineTo(x - s2, y + s2); g.closePath();
          }
        }
        g.stroke();
      }

      // the concentric band itself
      g.strokeStyle = hsla(hue + 180, 100, 65, 0.42);
      g.lineWidth = 0.7;
      g.beginPath(); g.arc(0, 0, rr, 0, Math.PI * 2); g.stroke();
    }

    // burning core
    const core = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.38);
    core.addColorStop(0,    "rgba(255,255,255,1)");
    core.addColorStop(0.22, hsla(HUE.base + 60, 100, 78, 0.95));
    core.addColorStop(0.5,  hsla(HUE.base,      100, 62, 0.6));
    core.addColorStop(0.78, hsla(HUE.base - 70, 100, 55, 0.26));
    core.addColorStop(1,    hsla(HUE.base,      100, 50, 0));
    g.fillStyle = core;
    g.beginPath(); g.arc(0, 0, R * 0.38, 0, Math.PI * 2); g.fill();

    return cv;
  }

  /* ---------- onto the grid ----------
     The same recipe the rest of the site uses: draw it properly, shrink it
     with smoothing so nothing aliases, and let whoever shows it blow it
     back up with hard edges. */
  function pixelate(cv, grid) {
    const out = document.createElement("canvas");
    out.width = out.height = grid;
    out.getContext("2d").drawImage(cv, 0, 0, grid, grid);
    return out;
  }

  return { seeded, hexA, hsla, TIER_HUE, TIER_STYLE, FORM, makeForm, buildSprites,
           SPRITE, pixelate };
})();
