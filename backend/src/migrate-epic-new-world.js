const db = require('./database');

const puzzle = db.prepare("SELECT * FROM puzzles WHERE name = 'Epic of a New World'").get();
if (!puzzle) {
  console.log('Puzzle "Epic of a New World" not found.');
  process.exit(1);
}

const existing = db.prepare('SELECT MAX(position) as max FROM pieces WHERE puzzle_id = ?').get(puzzle.id);
const maxPos = existing.max ?? 0;

if (maxPos >= 18) {
  console.log(`Already has ${maxPos} pieces, nothing to do.`);
  process.exit(0);
}

const insert = db.prepare('INSERT INTO pieces (puzzle_id, name, position) VALUES (?, ?, ?)');
let added = 0;
for (let pos = maxPos + 1; pos <= 18; pos++) {
  insert.run(puzzle.id, String(pos), pos);
  added++;
}

console.log(`Added ${added} piece(s) to "Epic of a New World" (now 18 total).`);
