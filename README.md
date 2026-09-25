# REALM

10 sectors of the DMT realm. 10 rounds of 111 NFTs, max 3 per wallet, on Solana.

This is a plain website — no build step, no framework, no dependencies to install.

---

## Deploy on Railway

1. Put these files in a GitHub repository.
2. In Railway: **New Project → Deploy from GitHub repo**, pick the repo.
3. Railway reads `package.json`, runs `npm start`, and the site is live.

There is nothing to configure. Railway sets `PORT` automatically and
`server.js` uses it.

---

## Changing the site

Everything you will ever need to edit is in **`data.js`**. Both the homepage
and the immersive realm read from it, so you only change things in one place.

```js
const CONFIG = {
  currentRound: 1,      // 1-10. This unlocks sectors and lore automatically.
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

- light up sector 2 on the map and mark it as the live round
- unlock lore chapter 2 (chapter 3 onward stay blurred and SEALED)
- move the roadmap marker
- update the round number everywhere on the page

Commit the change, and Railway redeploys in about a minute.

### Turning the mint on

Paste your launchpad link into `mintLink`. While it is empty the button
reads "Mint opens soon" and cannot be clicked.

### Editing the story

The `SECTORS` list in `data.js` holds each sector's name, lore and colour.
Edit the text between the quotes. Keep all ten entries.

### Changing the rarity split

The `TIERS` list in `data.js` holds the eight tiers. **The counts must add up to 111.**

---

## Files

| File | What it is |
|------|------------|
| **`data.js`** | **the only file you edit** — round, mint link, sectors, rarity |
| `index.html` | the homepage |
| `styles.css` | homepage styling |
| `app.js` | homepage logic |
| `realm.html` | the immersive full-screen realm |
| `realm.css` | realm styling |
| `realm.js` | the realm engine — 111 drifting beings per sector |
| `server.js` | the tiny server Railway runs |
| `package.json` | tells Railway how to start it |

---

## The immersive realm

`realm.html` is a living map: 111 beings drift inside each sector, glowing in
their rarity's colour, rarer ones larger and slower with turning geometric
halos. Tap one to open it.

Right now every being is **sealed** — no NFTs exist yet. After your first mint,
put your collection address and a Helius API key in `data.js`, then follow the
short note at the bottom of `realm.js` to switch the live data on. The beings
that have been minted will then show their real artwork and current owner; the
rest stay sealed.

Sealed sectors can't be entered. `currentRound` controls that too.

---

## Note on the mint

This site does not mint anything itself — the Mint button sends people to
your launchpad, which handles payment, the 111 supply cap and the 3-per-wallet
limit. Set the collection up on a Solana launchpad first, then paste the link
into `mintLink`.
