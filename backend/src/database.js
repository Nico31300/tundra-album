const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/tundra.db');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    alliance TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position INTEGER NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS puzzles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id INTEGER NOT NULL REFERENCES albums(id),
    name TEXT NOT NULL,
    position INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pieces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    puzzle_id INTEGER NOT NULL REFERENCES puzzles(id),
    name TEXT NOT NULL,
    position INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS inventory (
    user_id INTEGER NOT NULL REFERENCES users(id),
    piece_id INTEGER NOT NULL REFERENCES pieces(id),
    status TEXT NOT NULL CHECK(status IN ('need', 'have_duplicate', 'have')),
    PRIMARY KEY (user_id, piece_id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
  );
`);

db.prepare(`INSERT OR IGNORE INTO roles (id, name) VALUES (1, 'admin')`).run();
db.prepare(`INSERT OR IGNORE INTO roles (id, name) VALUES (2, 'stars_editor')`).run();
db.prepare(`INSERT OR IGNORE INTO roles (id, name) VALUES (3, 'user')`).run();

const userCols = db.pragma('table_info(users)');
if (!userCols.some(col => col.name === 'role_id')) {
  db.prepare(`ALTER TABLE users ADD COLUMN role_id INTEGER NOT NULL DEFAULT 3`).run();
}

// Migrate: if mission_milestones still has the old 'atlas' text column, drop and recreate
const mmCols = db.pragma('table_info(mission_milestones)');
if (mmCols.some(col => col.name === 'atlas')) {
  db.exec(`
    DROP TABLE IF EXISTS user_mission_progress;
    DROP TABLE IF EXISTS mission_milestones;
  `);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS mission_milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id INTEGER NOT NULL REFERENCES albums(id),
    task TEXT NOT NULL,
    milestone_number INTEGER NOT NULL,
    milestone_value TEXT,
    is_unknown INTEGER NOT NULL DEFAULT 0,
    is_final_milestone INTEGER NOT NULL DEFAULT 0,
    rarity TEXT,
    fragment_reward TEXT,
    UNIQUE(album_id, task, milestone_number)
  );

  CREATE TABLE IF NOT EXISTS user_mission_progress (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    milestone_id INTEGER NOT NULL REFERENCES mission_milestones(id) ON DELETE CASCADE,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, milestone_id)
  );
`);

const milestoneCount = db.prepare('SELECT COUNT(*) as c FROM mission_milestones').get();
if (milestoneCount.c === 0) {
  const MILESTONES = require('./missions-seed');
  const albumIdByName = Object.fromEntries(
    db.prepare('SELECT id, name FROM albums').all().map(a => [a.name, a.id])
  );
  const insertMilestone = db.prepare(`
    INSERT OR IGNORE INTO mission_milestones
      (album_id, task, milestone_number, milestone_value, is_unknown, is_final_milestone, rarity, fragment_reward)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const seedAll = db.transaction((rows) => {
    for (const [albumName, task, milestoneNum, value, isUnknown, isFinal, rarity, reward] of rows) {
      const albumId = albumIdByName[albumName];
      if (albumId == null) continue;
      insertMilestone.run(albumId, task, milestoneNum, value, isUnknown, isFinal, rarity, reward);
    }
  });
  seedAll(MILESTONES);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    label TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;
