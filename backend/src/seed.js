const db = require('./database');

const ALBUMS = [
  { name: 'Rekindled Flames', puzzles: 9 },
  { name: 'Explore the World', puzzles: 9 },
  { name: 'Daybreak Island', puzzles: 9 },
  { name: 'Tundra Alliance', puzzles: 9 },
  { name: 'Battlefield Epic', puzzles: 9 },
  { name: 'Spectacular Adventures', puzzles: 9 },
  { name: 'Divine Weapons', puzzles: 9 },
  { name: 'Song of Heroes', puzzles: 9 },
  { name: 'The Labyrinth', puzzles: 9 },
  { name: "Nature's Strength", puzzles: 9 },
  { name: 'Crystalline Mysteries', puzzles: 9 },
  { name: 'Ballad of Wind and Cold', puzzles: 9 },
  { name: 'Infernal Power', puzzles: 9 },
  { name: 'Prerogative of the Flame', puzzles: 9 },
  { name: 'Frostdragon Empire', puzzles: 9 },
  { name: 'Kings of Combat', puzzles: 9 },
];

// Number of pieces per puzzle (9 by default, adjust if you know the exact counts)
const PIECES_PER_PUZZLE = 9;

const existingAlbums = db.prepare('SELECT COUNT(*) as count FROM albums').get();
if (existingAlbums.count > 0) {
  console.log('Database already seeded, skipping.');
  process.exit(0);
}

const insertAlbum = db.prepare('INSERT INTO albums (name, position) VALUES (?, ?)');
const insertPuzzle = db.prepare('INSERT INTO puzzles (album_id, name, position) VALUES (?, ?, ?)');
const insertPiece = db.prepare('INSERT INTO pieces (puzzle_id, name, position) VALUES (?, ?, ?)');

const seedAll = db.transaction(() => {
  ALBUMS.forEach((album, albumIdx) => {
    const albumResult = insertAlbum.run(album.name, albumIdx + 1);
    const albumId = albumResult.lastInsertRowid;

    for (let p = 1; p <= album.puzzles; p++) {
      const puzzleResult = insertPuzzle.run(albumId, `Puzzle ${p}`, p);
      const puzzleId = puzzleResult.lastInsertRowid;

      for (let pc = 1; pc <= PIECES_PER_PUZZLE; pc++) {
        insertPiece.run(puzzleId, `Pièce ${pc}`, pc);
      }
    }
  });
});

seedAll();
console.log(`Seeded ${ALBUMS.length} albums, ${ALBUMS.length * 9} puzzles, ${ALBUMS.length * 9 * PIECES_PER_PUZZLE} pieces.`);
