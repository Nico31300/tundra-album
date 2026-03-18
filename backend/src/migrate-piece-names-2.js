const db = require('./database');

const result = db.prepare(`
  UPDATE pieces SET name = SUBSTR(name, 7) WHERE name LIKE 'Piece %'
`).run();

console.log(`Updated ${result.changes} piece name(s).`);
