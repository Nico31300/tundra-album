const db = require('./database');

// Add stars column if it doesn't exist
const cols = db.prepare("PRAGMA table_info(pieces)").all();
if (!cols.find(c => c.name === 'stars')) {
  db.exec('ALTER TABLE pieces ADD COLUMN stars INTEGER NOT NULL DEFAULT 1');
  console.log('Added stars column to pieces.');
}

function getPieceStars(piecePosition, totalPieces, fiveStarCount) {
  if (piecePosition > totalPieces - fiveStarCount) return 5;
  const remaining = totalPieces - fiveStarCount;
  if (remaining === 0) return 5;
  const maxStars = totalPieces >= 15 ? 4 : Math.min(4, Math.ceil(totalPieces / 3));
  return Math.ceil(piecePosition / remaining * maxStars);
}

const albums = db.prepare('SELECT * FROM albums ORDER BY position').all();

let totalUpdated = 0;

for (const album of albums) {
  const puzzles = db.prepare('SELECT * FROM puzzles WHERE album_id = ? ORDER BY position').all(album.id);

  // Puzzles with 15+ pieces in order — the Nth one has N five-star pieces
  const bigPuzzles = puzzles.filter(pz => {
    const count = db.prepare('SELECT COUNT(*) as c FROM pieces WHERE puzzle_id = ?').get(pz.id).c;
    return count >= 15;
  });

  for (const puzzle of puzzles) {
    const pieces = db.prepare('SELECT * FROM pieces WHERE puzzle_id = ? ORDER BY position').all(puzzle.id);
    const total = pieces.length;

    const bigIdx = bigPuzzles.findIndex(pz => pz.id === puzzle.id);
    const fiveStarCount = bigIdx >= 0 ? bigIdx + 1 : 0;

    const update = db.prepare('UPDATE pieces SET stars = ? WHERE id = ?');
    for (let i = 0; i < pieces.length; i++) {
      const stars = getPieceStars(i + 1, total, fiveStarCount);
      update.run(stars, pieces[i].id);
      totalUpdated++;
    }
  }
}

console.log(`Updated stars for ${totalUpdated} pieces.`);
