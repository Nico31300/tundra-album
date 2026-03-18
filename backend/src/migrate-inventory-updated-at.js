const db = require('./database');

// Add updated_at column to inventory if it doesn't exist
const columns = db.pragma('table_info(inventory)').map(c => c.name);
if (columns.includes('updated_at')) {
  console.log('Column updated_at already exists, nothing to do.');
  process.exit(0);
}

db.exec(`ALTER TABLE inventory ADD COLUMN updated_at DATETIME`);
db.prepare(`UPDATE inventory SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL`).run();
console.log('Added updated_at column to inventory.');
