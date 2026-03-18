const db = require('./database');

const result = db.prepare(`
  UPDATE pieces SET name = 'Piece ' || position WHERE name LIKE 'Pièce %'
`).run();

console.log(`Updated ${result.changes} piece name(s).`);
