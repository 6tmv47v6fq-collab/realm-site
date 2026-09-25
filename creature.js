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

  function load(onReady, onFail) {
    const img = new Image();
    img.decoding = "async";
    img.alt = "";
    img.onload  = () => onReady(img);
    img.onerror = () => {
      if (img.src.indexOf(SMALL) === -1) { img.src = SMALL; return; }  // one retry
      if (onFail) onFail();
    };
    img.src = (window.innerWidth <= 520 || (window.devicePixelRatio || 1) < 2) ? SMALL : FULL;
    return img;
  }

  return { load, MOUTH };
})();
