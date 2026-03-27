const db = require("./database");
const bcrypt = require("bcryptjs");

const ALBUMS = [
  {
    name: "Rekindled Flames",
    puzzles: [
      { name: "Furnace", stars: [1,1,1,1,1,1,1,2,2] },
      { name: "City Fouding", stars: [1,1,1,1,1,2,2,2,3] },
      { name: "Dawn Alliance", stars: [1,1,1,1,2,2,2,3,3] },
      { name: "Decisions", stars: [1,1,1,1,2,2,2,2,3,3,3,4] },
      { name: "Menace Afoot", stars: [1,1,1,2,2,2,3,3,3,3,4,4] },
      { name: "Heroes", stars: [1,1,1,2,2,2,3,3,3,4,4,4] },
      { name: "Food Power", stars: [1,1,1,2,2,2,2,2,3,3,3,3,4,4,5] },
      { name: "A New Order", stars: [1,1,1,2,2,2,2,3,3,3,3,4,4,5,5] },
      { name: "True Explorer", stars: [1,1,1,2,2,2,3,3,3,4,4,4,5,5,5] },
    ],
  },
  {
    name: "Explore the World",
    puzzles: [
      { name: "War on Winter", stars: [1,1,1,1,2,2,2,3,3] },
      { name: "Exploration Journal", stars: [1,1,1,1,2,2,2,2,3,3,3,4] },
      { name: "Hunting Guild", stars: [1,1,1,2,2,2,3,3,3,3,4,4] },
      { name: "The Raging Bear", stars: [1,1,1,2,2,2,3,3,3,4,4,4] },
      { name: "Treasure Kingdom", stars: [1,1,1,2,2,2,2,2,3,3,3,3,4,4,5] },
      { name: "Wealth is Knowledge", stars: [1,1,1,2,2,2,2,3,3,3,3,4,4,5,5] },
      { name: "Ruins of Old", stars: [1,1,1,2,2,2,3,3,3,4,4,4,5,5,5] },
      { name: "Cryptid Days", stars: [1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5] },
      { name: "Call of the Stars", stars: [1,1,2,2,2,3,3,3,4,4,4,4,4,5,5,5,5,5] },
    ],
  },
  {
    name: "Daybreak Island",
    puzzles: [
      { name: "Daybreak Island Legend", stars: [1,1,1,1,2,2,2,2,3,3,3,4] },
      { name: "Island of Dreams", stars: [1,1,1,2,2,2,3,3,3,3,4,4] },
      { name: "Tree of Life", stars: [1,1,1,2,2,2,3,3,3,4,4,4] },
      { name: "Call of the Sea", stars: [1,1,1,2,2,2,2,2,3,3,3,3,4,4,5] },
      { name: "Distant Resonance", stars: [1,1,1,2,2,2,2,3,3,3,3,4,4,5,5] },
      { name: "Caravan Visit", stars: [1,1,1,2,2,2,3,3,3,4,4,4,5,5,5] },
      { name: "New Home", stars: [1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5] },
      { name: "Daybreak Song", stars: [1,1,1,2,2,3,3,3,4,4,4,4,4,5,5,5,5,5] },
      { name: "Island Splendors", stars: [2,2,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5] },
    ],
  },
  {
    name: "Tundra Alliance",
    puzzles: [
      { name: "Alliance-Buiding", stars: [1,1,1,2,2,2,3,3,3,3,4,4] },
      { name: "One Heart", stars: [1,1,1,2,2,2,3,3,3,4,4,4] },
      { name: "Heroes' Aid", stars: [1,1,1,2,2,2,2,2,3,3,3,3,4,4,5] },
      { name: "Alliance Resources", stars: [1,1,1,2,2,2,2,3,3,3,3,4,4,5,5] },
      { name: "Twisted Obsessions", stars: [1,1,1,2,2,2,3,3,3,4,4,4,5,5,5] },
      { name: "Virtues and Crimes", stars: [1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5] },
      { name: "Children of the New World", stars: [1,1,2,2,2,3,3,3,4,4,4,4,4,5,5,5,5,5] },
      { name: "Horn of Command", stars: [1,1,2,2,2,3,3,3,4,4,4,4,4,5,5,5,5,5] },
      { name: "Battlefield Epic", stars: [2,2,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5] },
    ],
  },
  {
    name: "Battlefield Epic",
    puzzles: [
      { name: "Imperial Foundry", stars: [1,1,1,2,2,2,3,3,3,4,4,4] },
      { name: "King of the Battlefield", stars: [1,1,1,2,2,2,2,2,3,3,3,3,4,4,5] },
      { name: "Orichalcum", stars: [1,1,1,2,2,2,2,2,3,3,3,3,4,4,5] },
      { name: "City of Kings", stars: [1,1,1,2,2,2,2,3,3,3,3,4,4,5,5] },
      { name: "Pilot's Paradise", stars: [1,1,1,2,2,2,3,3,3,4,4,4,5,5,5] },
      { name: "Great Contest", stars: [1,1,2,2,2,2,3,3,3,4,4,4,4,4,5,5,5,5] },
      { name: "Canyon Clash", stars: [1,1,2,2,2,3,3,3,4,4,4,4,4,5,5,5,5,5] },
      { name: "Hero's Glory", stars: [2,2,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5] },
      { name: "Grand Banquet", stars: [2,2,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5] },
    ],
  },
  {
    name: "Spectacular Adventures",
    puzzles: [
      { name: "Fishing Tournament", stars: [1,1,1,2,2,2,3,3,3,4,4,4] },
      { name: "Snowbusters", stars: [1,1,1,2,2,2,2,2,3,3,3,3,4,4,5] },
      { name: "Bandit", stars: [1,1,1,2,2,2,2,2,3,3,3,3,4,4,5] },
      { name: "Red-Haired Joe", stars: [1,1,1,2,2,2,2,3,3,3,3,4,4,5,5] },
      { name: "A Queen Arises", stars: [1,1,1,2,2,2,3,3,3,4,4,4,5,5,5] },
      { name: "The Eagles", stars: [1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5] },
      { name: "Bounty Hunter", stars: [1,1,2,2,2,3,3,3,4,4,4,4,4,5,5,5,5,5] },
      { name: "Wandering Merchant", stars: [2,2,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5] },
      { name: "Tundra Adventure", stars: [2,2,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5] },
    ],
  },
  {
    name: "Divine Weapons",
    puzzles: [
      { name: "Master Blacksmith", stars: [1,1,1,2,2,2,3,3,3,4,4,4] },
      { name: "Legendary Divine Weapon", stars: [1,1,1,2,2,2,2,2,3,3,3,3,4,4,5] },
      { name: "Tundra Trade Route", stars: [1,1,1,2,2,2,2,2,3,3,3,3,4,4,5] },
      { name: "Merchant Escort", stars: [1,1,1,2,2,2,2,3,3,3,3,4,4,5,5] },
      { name: "Cryptid Invasion", stars: [1,1,1,2,2,2,3,3,3,4,4,4,5,5,5] },
      { name: "Steam Rhapsody", stars: [1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5] },
      { name: "Ice Journey", stars: [1,1,2,2,2,3,3,3,4,4,4,4,4,5,5,5,5,5] },
      { name: "Exotic Charm", stars: [2,2,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5] },
      { name: "Essence Stones", stars: [2,2,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5] },
    ],
  },
  {
    name: "Song of Heroes",
    puzzles: [
      { name: "Dauntless Heroes", stars: [1,1,1,1,1,2,2,2,3] },
      { name: "Snow Angel", stars: [1,1,1,1,2,2,2,3,3] },
      { name: "Everyday Champions", stars: [1,1,1,1,2,2,2,2,3,3,3,4] },
      { name: "Arcadia's Legacy", stars: [1,1,1,2,2,2,3,3,3,3,4,4] },
      { name: "I Am the Fire", stars: [1,1,1,2,2,2,3,3,3,4,4,4] },
      { name: "Artisan Architect", stars: [1,1,1,2,2,2,2,2,3,3,3,3,4,4,5] },
      { name: "Life Vs Death", stars: [1,1,1,2,2,2,2,3,3,3,3,4,4,5,5] },
      { name: "The Icebreakers", stars: [1,1,1,2,2,2,3,3,3,4,4,4,5,5,5] },
      { name: "Epic of a New World", stars: [1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5] },
    ],
  },
  {
    name: "The Labyrinth",
    puzzles: [
      { name: "Underworld Mysteries", stars: [1,1,1,2,2,2,3,3,3,4,4,4] },
      { name: "The World Below", stars: [1,1,2,2,3,3,3,3,4,4,4,4,4,4,5] },
      { name: "Digging To Danger", stars: [1,1,1,2,2,2,2,2,3,3,3,3,4,4,5] },
      { name: "Fungal Forest", stars: [1,1,1,2,2,2,2,3,3,3,3,4,4,5,5] },
      { name: "Furnace of the Gods", stars: [1,1,1,2,2,2,3,3,3,4,4,4,5,5,5] },
      { name: "The Undergrounders", stars: [1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5] },
      { name: "The Project", stars: [1,2,2,3,3,3,4,4,4,4,4,4,5,5,5,5,5,5] },
      { name: "Gaia Heart", stars: [1,2,2,3,3,3,4,4,4,4,4,4,5,5,5,5,5,5] },
      { name: "The Deepest Echo", stars: [2,2,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5] },
    ],
  },
  {
    name: "Nature's Strength",
    puzzles: [
      { name: "Friend of Nature", stars: [1,1,1,2,2,2,3,3,3,4,4,4] },
      { name: "Wild At Heart", stars: [1,1,1,2,2,2,2,2,3,3,3,3,4,4,5] },
      { name: "Beast Unleashed", stars: [1,1,2,2,3,3,3,3,4,4,4,4,4,4,5] },
      { name: "Wild Legion", stars: [1,1,1,2,2,2,2,3,3,3,3,4,4,5,5] },
      { name: "Pets-In-Arms", stars: [1,1,1,2,2,2,3,3,3,4,4,4,5,5,5] },
      { name: "Master Tamer", stars: [1,1,2,2,2,3,3,3,4,4,4,4,4,5,5,5,5,5] },
      { name: "Superhuman Strength", stars: [1,1,2,2,2,3,3,3,4,4,4,4,4,5,5,5,5,5] },
      { name: "Kasia's Struggle", stars: [2,2,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5] },
      { name: "Call of the Wild", stars: [1,2,2,3,3,3,4,4,4,4,4,4,5,5,5,5,5,5] },
    ],
  },
  {
    name: "Crystalline Mysteries",
    puzzles: [
      { name: "Fiery Crystal", stars: [1,1,1,2,2,2,3,3,3,4,4,4] },
      { name: "Mining the Fire", stars: [1,1,1,2,2,2,2,2,3,3,3,3,4,4,5] },
      { name: "Heirs of Empire", stars: [1,1,1,2,2,2,2,2,3,3,3,3,4,4,5] },
      { name: "Sins of Empire", stars: [1,1,1,2,2,2,2,3,3,3,3,4,4,5,5] },
      { name: "Fire Reborn", stars: [1,1,1,2,2,2,3,3,3,4,4,4,5,5,5] },
      { name: "The Burning Legion", stars: [1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5] },
      { name: "Promises of Fire", stars: [1,1,2,2,2,3,3,3,4,4,4,4,4,5,5,5,5,5] },
      { name: "Crystalline Rage", stars: [2,2,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5] },
      { name: "Fire Crystal Era", stars: [2,2,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5] },
    ],
  },
  {
    name: "Ballad of Wind and Cold",
    puzzles: [
      { name: "Honor and Glory", stars: [1,1,1,2,2,2,3,3,3,4,4,4] },
      { name: "Cold Highways", stars: [1,1,2,2,3,3,3,3,4,4,4,4,4,4,5] },
      { name: "Words of the Forgotten", stars: [1,1,2,2,3,3,3,3,4,4,4,4,4,4,5] },
      { name: "Monument to the Flame", stars: [1,1,1,2,2,2,2,3,3,3,3,4,4,5,5] },
      { name: "Alliance Showdown", stars: [1,1,1,2,2,2,3,3,3,4,4,4,5,5,5] },
      { name: "State Versus State", stars: [1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5] },
      { name: "The Summit of Battle", stars: [1,2,2,3,3,3,4,4,4,4,4,4,5,5,5,5,5,5] },
      { name: "Castle of Conflicts", stars: [1,2,2,3,3,3,4,4,4,4,4,4,5,5,5,5,5,5] },
      { name: "Remaker of Order", stars: [2,2,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5] },
    ],
  },
  {
    name: "Infernal Power",
    puzzles: [
      { name: "Hellios Warriors", stars: [1,1,1,2,2,2,3,3,3,4,4,4] },
      { name: "Crystal Strength", stars: [1,1,2,2,3,3,3,3,4,4,4,4,4,4,5] },
      { name: "Crystal Fragmentation", stars: [1,1,1,2,2,2,2,2,3,3,3,3,4,4,5] },
      { name: "Miner Madness", stars: [1,1,1,2,2,2,2,3,3,3,3,4,4,5,5] },
      { name: "Engine of the Future", stars: [1,1,1,2,2,2,3,3,3,4,4,4,5,5,5] },
      { name: "Risky Business", stars: [1,1,2,2,2,3,3,3,4,4,4,4,4,5,5,5,5,5] },
      { name: "Treasure of Empire", stars: [1,1,2,2,2,3,3,3,4,4,4,4,4,5,5,5,5,5] },
      { name: "The Communicative Heart", stars: [2,2,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5] },
      { name: "The Guardians", stars: [1,2,2,3,3,3,4,4,4,4,4,4,5,5,5,5,5,5] },
    ],
  },
  {
    name: "Prerogative of the Flame",
    puzzles: [
      { name: "Whispers of the World", stars: [1,1,1,2,2,2,3,3,3,4,4,4] },
      { name: "Temptations of Power", stars: [1,1,1,2,2,2,2,2,3,3,3,3,4,4,5] },
      { name: "Doomsday Man", stars: [1,1,2,2,3,3,3,3,4,4,4,4,4,4,5] },
      { name: "The Hunters", stars: [1,1,1,2,2,2,2,3,3,3,3,4,4,5,5] },
      { name: "The Mad King", stars: [1,1,1,2,2,2,3,3,3,4,4,4,5,5,5] },
      { name: "The Last Empress", stars: [1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5] },
      { name: "The Last Collapse", stars: [1,1,2,2,2,3,3,3,4,4,4,4,4,5,5,5,5,5] },
      { name: "A Long Slumber", stars: [2,2,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5] },
      { name: "Sky City", stars: [2,2,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5] },
    ],
  },
  {
    name: "Frostdragon Empire",
    puzzles: [
      { name: "Frostdragon Empire", stars: [1,1,1,2,2,2,3,3,3,4,4,4] },
      { name: "The Dragonic Legend", stars: [1,1,1,2,2,2,2,2,3,3,3,3,4,4,5] },
      { name: "Wings of Empire", stars: [1,1,1,2,2,2,2,2,3,3,3,3,4,4,5] },
      { name: "The Dragonic Legion", stars: [1,1,1,2,2,2,2,3,3,3,3,4,4,5,5] },
      { name: "Rediscovery", stars: [1,1,1,2,2,2,3,3,3,4,4,4,5,5,5] },
      { name: "Future Vision", stars: [1,1,2,2,2,2,3,3,3,4,4,4,4,4,5,5,5,5] },
      { name: "War and Wealth", stars: [1,2,2,3,3,3,4,4,4,4,4,4,5,5,5,5,5,5] },
      { name: "Banquet for a King", stars: [1,2,2,3,3,3,4,4,4,4,4,4,5,5,5,5,5,5] },
      { name: "A Tyrant Crowned", stars: [2,2,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5] },
    ],
  },
  {
    name: "Kings of Combat",
    puzzles: [
      { name: "League of Honor", stars: [1,1,1,2,2,2,3,3,3,4,4,4] },
      { name: "A Tournament of Heroes", stars: [1,1,2,2,3,3,3,3,4,4,4,4,4,4,5] },
      { name: "Duel of Greatness", stars: [1,1,2,2,3,3,3,3,4,4,4,4,4,4,5] },
      { name: "The Callisto", stars: [1,1,1,2,2,2,2,3,3,3,3,4,4,5,5] },
      { name: "King Of Combat", stars: [1,1,1,2,2,2,3,3,3,4,4,4,5,5,5] },
      { name: "The Arena Gamers", stars: [1,1,2,2,2,3,3,3,4,4,4,4,4,5,5,5,5,5] },
      { name: "The Helios Cannon", stars: [1,1,2,2,2,3,3,3,4,4,4,4,4,5,5,5,5,5] },
      { name: "Behemoth", stars: [2,2,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5] },
      { name: "The Bell Tolls", stars: [1,2,2,3,3,3,4,4,4,4,4,4,5,5,5,5,5,5] },
    ],
  },
];

const existingAlbums = db.prepare("SELECT COUNT(*) as count FROM albums").get();
if (existingAlbums.count > 0) {
  console.log("Database already seeded, skipping.");
  process.exit(0);
}

const insertAlbum = db.prepare(
  "INSERT INTO albums (name, position) VALUES (?, ?)",
);
const insertPuzzle = db.prepare(
  "INSERT INTO puzzles (album_id, name, position) VALUES (?, ?, ?)",
);
const insertPiece = db.prepare(
  "INSERT INTO pieces (puzzle_id, name, position, stars) VALUES (?, ?, ?, ?)",
);

const seedAll = db.transaction(() => {
  let totalPuzzles = 0;
  let totalPieces = 0;

  for (const [albumIdx, album] of ALBUMS.entries()) {
    const { lastInsertRowid: albumId } = insertAlbum.run(
      album.name,
      albumIdx + 1,
    );
    for (const [puzzleIdx, puzzle] of album.puzzles.entries()) {
      const { lastInsertRowid: puzzleId } = insertPuzzle.run(
        albumId,
        puzzle.name,
        puzzleIdx + 1,
      );

      for (const [idx, stars] of puzzle.stars.entries()) {
        insertPiece.run(puzzleId, String(idx + 1), idx + 1, stars);
      }

      totalPuzzles++;
      totalPieces += puzzle.stars.length;
    }
  }

  return { totalPuzzles, totalPieces };
});

const { totalPuzzles, totalPieces } = seedAll();
console.log(
  `Seeded ${ALBUMS.length} albums, ${totalPuzzles} puzzles, ${totalPieces} pieces.`,
);

const passwordHash = bcrypt.hashSync("admin", 10);
db.prepare(
  "INSERT INTO users (username, password_hash, role_id, force_password_change) VALUES (?, ?, 1, 1)",
).run("admin", passwordHash);
console.log("Created admin user (username: admin, password: admin) — password change required on first login.");
