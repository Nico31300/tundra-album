const db = require('./database');

// SQLite doesn't support modifying CHECK constraints — must recreate the table.
const tableInfo = db.pragma('table_info(inventory)');
const statusCol = tableInfo.find(c => c.name === 'status');

if (statusCol && statusCol.type.includes("'have'")) {
  console.log('CHECK constraint already includes "have", nothing to do.');
  process.exit(0);
}

db.exec(`
  PRAGMA foreign_keys = OFF;

  CREATE TABLE inventory_new (
    user_id    INTEGER NOT NULL REFERENCES users(id),
    piece_id   INTEGER NOT NULL REFERENCES pieces(id),
    status     TEXT NOT NULL CHECK(status IN ('need', 'have_duplicate', 'have')),
    updated_at DATETIME,
    PRIMARY KEY (user_id, piece_id)
  );

  INSERT INTO inventory_new SELECT * FROM inventory;

  DROP TABLE inventory;

  ALTER TABLE inventory_new RENAME TO inventory;

  PRAGMA foreign_keys = ON;
`);

console.log('Migrated inventory: CHECK constraint now includes "have".');
