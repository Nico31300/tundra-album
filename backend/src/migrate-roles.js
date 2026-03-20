const db = require('./database');

// Create roles table if it doesn't exist
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='roles'").get();
if (!tables) {
  db.exec(`
    CREATE TABLE roles (
      id INTEGER PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    )
  `);
  console.log('Created roles table.');
}

// Insert roles with fixed IDs
const inserted = db.transaction(() => {
  let count = 0;
  const insert = db.prepare(`INSERT OR IGNORE INTO roles (id, name) VALUES (?, ?)`);
  count += insert.run(1, 'admin').changes;
  count += insert.run(2, 'stars_editor').changes;
  count += insert.run(3, 'user').changes;
  return count;
})();
if (inserted > 0) console.log(`Inserted ${inserted} role(s).`);

// Add role_id column to users if it doesn't exist
const userCols = db.prepare("PRAGMA table_info(users)").all();
if (!userCols.find(c => c.name === 'role_id')) {
  db.exec(`ALTER TABLE users ADD COLUMN role_id INTEGER NOT NULL DEFAULT 3`);
  console.log('Added role_id column to users (default: user).');
} else {
  console.log('role_id column already exists on users.');
}

// Set user id=1 as admin
const result = db.prepare(`UPDATE users SET role_id = 1 WHERE id = 1`).run();
if (result.changes > 0) console.log('User id=1 set as admin.');

console.log('Migration complete.');
