/* ============================================================
   REALM — the only file you need to edit.
   Both the homepage and the immersive realm read from here.
   ============================================================ */

const CONFIG = {
  // Which round is live right now (1-10). This unlocks sectors automatically.
  currentRound: 1,

  // How many of this round's 111 have been minted so far.
  minted: 0,

  // Paste your launchpad mint link here. Leave as "" to show "opens soon".
  mintLink: "",

  // Social + marketplace links.
  links: {
    x: "https://x.com/",
    telegram: "https://t.me/",
    marketplace: ""
  },

  /* --- LIVE NFT DATA (leave alone until after your first mint) ---
     Once the collection exists, put its address here and the realm will
     show the real beings, their art and their owners instead of the
     sealed placeholder forms. See the note at the bottom of realm.js. */
  collectionAddress: "",
  heliusApiKey: ""
};

const SUPPLY_PER_ROUND = 111;

/* Rarity breakdown per round — must add up to 111. */
const TIERS = [
  { name: "Common",    count: 40, key: "common",    color: "#9ca3af" },
  { name: "Uncommon",  count: 28, key: "uncommon",  color: "#34d399" },
  { name: "Rare",      count: 18, key: "rare",      color: "#3b82f6" },
  { name: "Epic",      count: 11, key: "epic",      color: "#a855f7" },
  { name: "Legendary", count: 7,  key: "legendary", color: "#f59e0b" },
  { name: "Mythic",    count: 4,  key: "mythic",    color: "#ef4444" },
  { name: "Entity",    count: 2,  key: "entity",    color: "#a5f3fc" },
  { name: "God",       count: 1,  key: "god",       color: "#fde68a" }
];

/* The ten sectors, in the order they open.
   `hue` tints that sector's sky in the immersive realm (0-360). */
const SECTORS = [
  { name: "The Threshold", hue: 270,
    lore: "You do not arrive here. You are delivered. The Threshold is the held breath between the room you left and everything after it — a curtain of moving light that recognises you before you recognise yourself. The first beings wait at the edge, and they have been expecting you for longer than you have existed." },
  { name: "The Chrysanthemum", hue: 320,
    lore: "The gate is a flower and the flower is opening, petal folding out of petal without end. Every petal is a door and every door is the same door seen from further in. The beings of the Chrysanthemum are gardeners. They do not grow the flower. They keep it from closing." },
  { name: "The Dome", hue: 45,
    lore: "A vaulted chamber with no visible ceiling, ribbed in gold and breathing slowly. The walls are not walls; they are rows of watchers, packed shoulder to shoulder, leaning in. They have waited the entire time. When you enter, the whole dome turns to look, and something enormous is pleased." },
  { name: "The Elf Workshop", hue: 150,
    lore: "Machine elves, working at impossible speed, making objects that sing themselves into being and then insist you take them. They hand you gifts made of language. They are hysterical with delight that you came, and the gifts keep arriving faster than you can hold them." },
  { name: "The Jester's Court", hue: 15,
    lore: "A checkered floor tilting under a court of tricksters, where the joke is structural and the punchline is you. Nothing here lies, but nothing here is straight either. The Court teaches by laughter, and the lesson only lands once you have stopped defending yourself." },
  { name: "The Hyperspace Corridor", hue: 195,
    lore: "Not a place but a passage, screaming past at a speed with no number. Walls of braided colour, information travelling the other way. The corridor beings are ferrymen. They are indifferent to you. They have carried everything that has ever crossed, and they will carry what comes after." },
  { name: "The Fractal Sea", hue: 220,
    lore: "An ocean that is made of its own reflection, each wave containing the whole sea, each drop containing every wave. To look closely is to fall in. The beings here have no edges. They are patterns wearing the idea of a body, and they rise when the depth decides to speak." },
  { name: "The Temple of Geometry", hue: 258,
    lore: "Architecture that is alive and knows it is being observed. Columns solve themselves. Arches rearrange to stay beautiful from wherever you stand. The temple guardians are laws rather than creatures — the rules that keep the realm from spilling, given faces so you can bear them." },
  { name: "The Loom", hue: 292,
    lore: "Here the realm is woven. Threads of every colour that does not exist run through hands too fast to see, and each thread is a life, a timeline, a version of the room you left behind. The weavers do not look up. They are building the thing you are standing inside." },
  { name: "The Source", hue: 50,
    lore: "The centre. Light without a lamp, love without a condition, understanding without a question left to ask. There is nothing here to collect and nothing here to own. Everything you were carrying is set down at the door, and the realm finally shows you why it opened at all." }
];

/* current round, clamped to something sane */
const ROUND = Math.min(Math.max(CONFIG.currentRound, 1), 10);
