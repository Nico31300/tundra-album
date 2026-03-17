const db = require('./database');

const ALBUMS = [
  {
    name: 'Rekindled Flames',
    puzzles: [
      { name: 'Furnace', pieces: 9 },
      { name: 'City Fouding', pieces: 9 },
      { name: 'Dawn Alliance', pieces: 9 },
      { name: 'Decisions', pieces: 12 },
      { name: 'Menace Afoot', pieces: 12 },
      { name: 'Heroes', pieces: 12 },
      { name: 'Food Power', pieces: 15 },
      { name: 'A New Order', pieces: 15 },
      { name: 'True Explorer', pieces: 15 },
    ],
  },
  {
    name: 'Explore the World',
    puzzles: [
      { name: 'War on Winter', pieces: 9 },
      { name: 'Exploration Journal', pieces: 12 },
      { name: 'Hunting Guild', pieces: 12 },
      { name: 'The Raging Bear', pieces: 12 },
      { name: 'Treasure Kingdom', pieces: 15 },
      { name: 'Wealth is Knowledge', pieces: 15 },
      { name: 'Ruins of Old', pieces: 15 },
      { name: 'Cryptid Days', pieces: 18 },
      { name: 'Call of the Stars', pieces: 15 },
    ],
  },
  {
    name: 'Daybreak Island',
    puzzles: [
      { name: 'Daybreak Island Legend', pieces: 12 },
      { name: 'Island of Dreams', pieces: 12 },
      { name: 'Tree of Life', pieces: 12 },
      { name: 'Call of the Sea', pieces: 15 },
      { name: 'Distant Resonance', pieces: 15 },
      { name: 'Caravan Visit', pieces: 15 },
      { name: 'New Home', pieces: 18 },
      { name: 'Daybreak Song', pieces: 18 },
      { name: 'Island Splendors', pieces: 18 },
    ],
  },
  {
    name: 'Tundra Alliance',
    puzzles: [
      { name: 'Alliance-Buiding', pieces: 12 },
      { name: 'One Heart', pieces: 12 },
      { name: "Heroes' Aid", pieces: 15 },
      { name: 'Alliance Resources', pieces: 15 },
      { name: 'Twisted Obsessions', pieces: 15 },
      { name: 'Virtues and Crimes', pieces: 18 },
      { name: 'Children of the New World', pieces: 18 },
      { name: 'Horn of Command', pieces: 18 },
      { name: 'Battlefield Epic', pieces: 18 },
    ],
  },
  {
    name: 'Battlefield Epic',
    puzzles: [
      { name: 'Imperial Foundry', pieces: 12 },
      { name: 'King of the Battlefield', pieces: 15 },
      { name: 'Orichalcum', pieces: 15 },
      { name: 'City of Kings', pieces: 15 },
      { name: "Pilot's Paradise", pieces: 15 },
      { name: 'Great Contest', pieces: 18 },
      { name: 'Canyon Clash', pieces: 18 },
      { name: "Hero's Glory", pieces: 18 },
      { name: 'Grand Banquet', pieces: 18 },
    ],
  },
  {
    name: 'Spectacular Adventures',
    puzzles: [
      { name: 'Fishing Tournament', pieces: 12 },
      { name: 'Snowbusters', pieces: 15 },
      { name: 'Bandit', pieces: 15 },
      { name: 'Red-Haired Joe', pieces: 15 },
      { name: 'A Queen Arises', pieces: 15 },
      { name: 'The Eagles', pieces: 18 },
      { name: 'Bounty Hunter', pieces: 18 },
      { name: 'Wandering Merchant', pieces: 18 },
      { name: 'Tundra Adventure', pieces: 18 },
    ],
  },
  {
    name: 'Divine Weapons',
    puzzles: [
      { name: 'Master Blacksmith', pieces: 12 },
      { name: 'Legendary Divine Weapon', pieces: 15 },
      { name: 'Tundra Trade Route', pieces: 15 },
      { name: 'Merchant Escort', pieces: 15 },
      { name: 'Cryptid Invasion', pieces: 15 },
      { name: 'Steam Rhapsody', pieces: 18 },
      { name: 'Ice Journey', pieces: 18 },
      { name: 'Exotic Charm', pieces: 18 },
      { name: 'Essence Stones', pieces: 18 },
    ],
  },
  {
    name: 'Song of Heroes',
    puzzles: [
      { name: 'Dauntless Heroes', pieces: 9 },
      { name: 'Snow Angel', pieces: 9 },
      { name: 'Everyday Champions', pieces: 12 },
      { name: "Arcadia's Legacy", pieces: 12 },
      { name: 'I Am the Fire', pieces: 12 },
      { name: 'Artisan Architect', pieces: 15 },
      { name: 'Life Vs Death', pieces: 15 },
      { name: 'The Icebreakers', pieces: 15 },
      { name: 'Epic of a New World', pieces: 15 },
    ],
  },
  {
    name: 'The Labyrinth',
    puzzles: [
      { name: 'Underworld Mysteries', pieces: 12 },
      { name: 'The World Below', pieces: 15 },
      { name: 'Digging To Danger', pieces: 15 },
      { name: 'Fungal Forest', pieces: 15 },
      { name: 'Furnace of the Gods', pieces: 15 },
      { name: 'The Undergrounders', pieces: 18 },
      { name: 'The Project', pieces: 18 },
      { name: 'Gaia Heart', pieces: 18 },
      { name: 'The Deepest Echo', pieces: 18 },
    ],
  },
  {
    name: "Nature's Strength",
    puzzles: [
      { name: 'Friend of Nature', pieces: 12 },
      { name: 'Wild At Heart', pieces: 15 },
      { name: 'Beast Unleashed', pieces: 15 },
      { name: 'Wild Legion', pieces: 15 },
      { name: 'Pets-In-Arms', pieces: 15 },
      { name: 'Master Tamer', pieces: 18 },
      { name: 'Superhuman Strength', pieces: 18 },
      { name: "Kasia's Struggle", pieces: 18 },
      { name: 'Call of the Wild', pieces: 18 },
    ],
  },
  {
    name: 'Crystalline Mysteries',
    puzzles: [
      { name: 'Fiery Crystal', pieces: 12 },
      { name: 'Mining the Fire', pieces: 15 },
      { name: 'Heirs of Empire', pieces: 15 },
      { name: 'Sins of Empire', pieces: 15 },
      { name: 'Fire Reborn', pieces: 15 },
      { name: 'The Burning Legion', pieces: 18 },
      { name: 'Promises of Fire', pieces: 18 },
      { name: 'Crystalline Rage', pieces: 18 },
      { name: 'Fire Crystal Era', pieces: 18 },
    ],
  },
  {
    name: 'Ballad of Wind and Cold',
    puzzles: [
      { name: 'Honor and Glory', pieces: 12 },
      { name: 'Cold Highways', pieces: 15 },
      { name: 'Words of the Forgotten', pieces: 15 },
      { name: 'Monument to the Flame', pieces: 15 },
      { name: 'Alliance Showdown', pieces: 15 },
      { name: 'State Versus State', pieces: 18 },
      { name: 'The Summit of Battle', pieces: 18 },
      { name: 'Castle of Conflicts', pieces: 18 },
      { name: 'Remaker of Order', pieces: 18 },
    ],
  },
  {
    name: 'Infernal Power',
    puzzles: [
      { name: 'Hellios Warriors', pieces: 12 },
      { name: 'Crystal Strength', pieces: 15 },
      { name: 'Crystal Fragmentation', pieces: 15 },
      { name: 'Miner Madness', pieces: 15 },
      { name: 'Engine of the Future', pieces: 15 },
      { name: 'Risky Business', pieces: 18 },
      { name: 'Treasure of Empire', pieces: 18 },
      { name: 'The Communicative Heart', pieces: 18 },
      { name: 'The Guardians', pieces: 18 },
    ],
  },
  {
    name: 'Prerogative of the Flame',
    puzzles: [
      { name: 'Whispers of the World', pieces: 12 },
      { name: 'Temptations of Power', pieces: 15 },
      { name: 'Doomsday Man', pieces: 15 },
      { name: 'The Hunters', pieces: 15 },
      { name: 'The Mad King', pieces: 15 },
      { name: 'The Last Empress', pieces: 18 },
      { name: 'The Last Collapse', pieces: 18 },
      { name: 'A Long Slumber', pieces: 18 },
      { name: 'Sky City', pieces: 18 },
    ],
  },
  {
    name: 'Frostdragon Empire',
    puzzles: [
      { name: 'Frostdragon Empire', pieces: 12 },
      { name: 'The Dragonic Legend', pieces: 15 },
      { name: 'Wings of Empire', pieces: 15 },
      { name: 'The Dragonic Legion', pieces: 15 },
      { name: 'Rediscovery', pieces: 15 },
      { name: 'Future Vision', pieces: 18 },
      { name: 'War and Wealth', pieces: 18 },
      { name: 'Banquet for a King', pieces: 18 },
      { name: 'A Tyrant Crowned', pieces: 18 },
    ],
  },
  {
    name: 'Kings of Combat',
    puzzles: [
      { name: 'League of Honor', pieces: 12 },
      { name: 'A Tournament of Heroes', pieces: 15 },
      { name: 'Duel of Greatness', pieces: 15 },
      { name: 'The Callisto', pieces: 15 },
      { name: 'King Of Combat', pieces: 15 },
      { name: 'The Arena Gamers', pieces: 18 },
      { name: 'The Helios Cannon', pieces: 18 },
      { name: 'Behemoth', pieces: 18 },
      { name: 'The Bell Tolls', pieces: 18 },
    ],
  },
];

const existingAlbums = db.prepare('SELECT COUNT(*) as count FROM albums').get();
if (existingAlbums.count > 0) {
  console.log('Database already seeded, skipping.');
  process.exit(0);
}

const insertAlbum = db.prepare('INSERT INTO albums (name, position) VALUES (?, ?)');
const insertPuzzle = db.prepare('INSERT INTO puzzles (album_id, name, position) VALUES (?, ?, ?)');
const insertPiece = db.prepare('INSERT INTO pieces (puzzle_id, name, position) VALUES (?, ?, ?)');

const seedAll = db.transaction(() => {
  let totalPuzzles = 0;
  let totalPieces = 0;

  ALBUMS.forEach((album, albumIdx) => {
    const albumResult = insertAlbum.run(album.name, albumIdx + 1);
    const albumId = albumResult.lastInsertRowid;

    album.puzzles.forEach((puzzle, puzzleIdx) => {
      const puzzleResult = insertPuzzle.run(albumId, puzzle.name, puzzleIdx + 1);
      const puzzleId = puzzleResult.lastInsertRowid;

      for (let pc = 1; pc <= puzzle.pieces; pc++) {
        insertPiece.run(puzzleId, `Pièce ${pc}`, pc);
      }

      totalPuzzles++;
      totalPieces += puzzle.pieces;
    });
  });

  return { totalPuzzles, totalPieces };
});

const { totalPuzzles, totalPieces } = seedAll();
console.log(`Seeded ${ALBUMS.length} albums, ${totalPuzzles} puzzles, ${totalPieces} pieces.`);
