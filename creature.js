/* ============================================================
   REALM — the Gatekeeper.

   Your artwork, loaded as the hero. MOUTH is where the entry zoom
   aims: the fractions are measured from the image itself, so the
   rush into the realm goes through the being's mouth.

   If you replace keeper.jpg with new art, check those two numbers.
   ============================================================ */

window.RealmCreature = (() => {
  "use strict";

  /* mouth position, as a fraction of the picture */
  const MOUTH = { x: 0.5, y: 0.485 };

  const FULL  = "keeper.jpg";
  const SMALL = "keeper-small.jpg";     // lighter, for narrow screens

  /* ---------- cutting the black away ----------
     The art is painted on black. Up to now that black was hidden by
     blending the whole canvas against the page, which only holds while
     nothing above it is being faded or moved — the moment something is,
     the browser blends the canvas against itself and the black comes
     back as a rectangle.

     So the black is removed from the picture instead. Each pixel keeps
     its colour and is given an opacity equal to its brightest channel,
     which is the same arithmetic the blending was doing: black goes to
     nothing, a bright line stays solid, and everything between fades
     out the way it did before. After this the picture carries its own
     transparency and can be drawn anywhere, over anything. */
  function key(img) {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const g = cv.getContext("2d", { willReadFrequently: false });
    g.drawImage(img, 0, 0);

    let px;
    try { px = g.getImageData(0, 0, w, h); }
    catch (e) { return img; }          // shouldn't happen: same origin

    const d = px.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], gr = d[i + 1], b = d[i + 2];
      const a = r > gr ? (r > b ? r : b) : (gr > b ? gr : b);
      if (a === 0) { d[i + 3] = 0; continue; }
      // lift the colour back up, so what is drawn matches what was there
      const k = 255 / a;
      d[i]     = r  * k;
      d[i + 1] = gr * k;
      d[i + 2] = b  * k;
      d[i + 3] = a;
    }
    g.putImageData(px, 0, 0);
    return cv;
  }

  function load(onReady, onFail) {
    const img = new Image();
    img.decoding = "async";
    img.alt = "";
    img.onload  = () => onReady(key(img));
    img.onerror = () => {
      if (img.src.indexOf(SMALL) === -1) { img.src = SMALL; return; }  // one retry
      if (onFail) onFail();
    };
    img.src = (window.innerWidth <= 520 || (window.devicePixelRatio || 1) < 2) ? SMALL : FULL;
    return img;
  }

  return { load, MOUTH, key };
})();
