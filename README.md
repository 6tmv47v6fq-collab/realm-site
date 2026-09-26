# REALM

10 sectors of the DMT realm. 1,111 beings, max 3 per wallet, on Solana.
Nine rounds of 111 and a tenth of 112.

One page. No build step, no framework, nothing to install.

---

## How the site is shaped

Everything happens on `index.html`, in three states:

1. **The door** — the tree, the doorway in its trunk, and one way in.
2. **The tunnel** — you are rushed through that doorway.
3. **The chamber** — the room you come out into, with five ways on.

Each of the five opens a panel over the room: Mint, The Beings, Rewards,
Lore, The Rounds. Nothing navigates away.

---

## Deploy on Railway

1. Push these files to the GitHub repository.
2. Railway reads `package.json`, runs `npm start`, and the site is live.

Nothing to configure — Railway sets `PORT` and `server.js` uses it.
If a push doesn't appear, check **Source → auto deploy is enabled** in Railway.

---

## Changing the site

Everything you will ever need to edit is in **`data.js`**.

```js
const CONFIG = {
  currentRound: 1,      // 1-10. Unlocks sectors and lore automatically.
  minted: 0,            // how many of this round's 111 are gone
  mintLink: "",         // your launchpad mint page URL
  links: {
    x: "https://x.com/yourhandle",
    telegram: "https://t.me/yourgroup",
    marketplace: ""     // leave "" to hide the link
  }
};
```

### Opening a new round

Change one number:

```js
currentRound: 2,
```

That single edit will:

- name sector 2 as the live round, on the door and in the chamber
- unlock lore chapter 2 (3 onward stay sealed)
- move the marker down the rounds list

Commit it, and Railway redeploys in about a minute.

### Turning the mint on

Paste your launchpad link into `mintLink`. While it is empty the button
reads "The gate is shut" and cannot be clicked, and the chamber says SHUT
next to MINT.

### Editing the story

The `SECTORS` list holds each sector's name, lore and colour. Edit the text
between the quotes. Keep all ten entries.

### Changing the rarity split

The `TIERS` list holds the eight tiers. **The counts must add up to 111.**

### Why the tenth round is 112

Ten rounds of 111 is 1,110. The tenth holds one extra so the total is 1,111.
Two lines in `data.js` do it:

```js
const EXTRA_IN_FINAL_ROUND = 1;
const TOTAL_BEINGS = SUPPLY_PER_ROUND * 10 + EXTRA_IN_FINAL_ROUND;   // 1,111
```

Set `EXTRA_IN_FINAL_ROUND` to 0 and everything on the site goes back to 1,110
on its own — the door, the FAQ, the rounds list and the mint counter all read
from it.

### Social links

A link only appears once it is real. The placeholders (`https://x.com/`,
`https://t.me/`) are treated as blanks and stay hidden.

---

## Files

| File | What it is |
|------|------------|
| **`data.js`** | **the only file you edit** — round, mint link, sectors, rarity |
| `index.html` | the whole site |
| `styles.css` | the shared look: black, gold hairline, pixel type |
| `landing.css` | the door, the chamber and the panels |
| `gate.js` | the tree, the rush into the doorway, and the tunnel |
| `journey.js` | the chamber — the room, everything alive in it, and the menu |
| `landing.js` | fills the panels from `data.js` |
| `forms.js` | draws a being for a tier |
| `tree.png` | the tree with the door in it, as pixel art |
| `chamber.png` | the room you come out into, as pixel art |
| `server.js` | the tiny server Railway runs |
| `package.json` | tells Railway how to start it |

Each picture also has a `-small` version, used on phones.

---

## Replacing the artwork

Drop in a new `tree.png` (and `tree-small.png`) and the door screen uses it.
Two lines at the top of `gate.js` say where things are in it:

```js
const AIM = { x: 0.545, y: 0.738 };   // the doorway — where the zoom goes
const SUN = { x: 0.513, y: 0.436 };   // the burst of light in the canopy
```

Both are fractions — how far across, how far down. If the new picture's
doorway sits somewhere else, change those two numbers and the rush will aim
at it.

Same for `chamber.png`: the fractions near the top of `journey.js`
(`EYE_HIGH`, `EYE_BIG`, `DOOR`, `FLOOR`) say where the light lands in the
room.

Both pictures are drawn full bleed, so anything tall and centred will work.

## The pixel grid

Every canvas on the site is drawn at a third of the screen's size and blown
back up by the browser with hard edges (`image-rendering: pixelated`). One
line, `const PX = 3` at the top of `gate.js` and `journey.js`, sets how chunky
the pixels are — larger number, bigger pixels. It costs a ninth of the drawing
work, which is why the whole site got faster when it went pixel.

Because of that, the two pictures never need to be big: they are 460 pixels
across with a 44-colour palette, about 100 KB each.

---

## Note on the mint

This site does not mint anything itself — the Mint button sends people to
your launchpad, which handles payment, the 111 supply cap and the
3-per-wallet limit. Set the collection up on a Solana launchpad first, then
paste the link into `mintLink`.
